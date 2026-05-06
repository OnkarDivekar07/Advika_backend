const { getInventoryPlan } = require('./inventoryPlanner.service');
const ExcelJS = require('exceljs');

/**
 * GET /api/inventory-planner
 * Returns JSON of the inventory plan with required quantities.
 */
exports.getInventoryPlan = async (req, res, next) => {
  try {
    const config = buildConfig(req.query);
    const data   = await getInventoryPlan(config);
    res.sendResponse({ message: 'Inventory plan computed', data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/inventory-planner/download
 * Downloads an Excel file (.xlsx) with the inventory plan.
 *
 * Columns : Product Name | Current Quantity | Required Quantity
 * Order   : fast-movers → slow-movers → non-movers
 *
 * The "Required Quantity" column shows the TOTAL units that should be in
 * stock (not just additional units to buy). The delta is in the JSON API.
 *
 * NOTE: This route streams the workbook directly to the response — it does
 * NOT touch the filesystem — so it works fine in memory-only environments.
 */
exports.downloadInventoryPlan = async (req, res, next) => {
  try {
    const config = buildConfig(req.query);
    const plan   = await getInventoryPlan(config);

    const workbook = new ExcelJS.Workbook();
    const sheet    = workbook.addWorksheet('Inventory Plan');

    // ── Meta info at top ──────────────────────────────────────────────────
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value     = 'Advika Flowers — Inventory Requirement Plan';
    sheet.getCell('A1').font      = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:C2');
    const { totalCapital, currentlyInvested, toBeInvested, targets } = plan.config;
    sheet.getCell('A2').value =
      `Total Capital: ₹${totalCapital.toLocaleString('en-IN')}  |  ` +
      `Currently Invested: ₹${currentlyInvested.toLocaleString('en-IN')}  |  ` +
      `To Be Invested: ₹${toBeInvested.toLocaleString('en-IN')}`;
    sheet.getCell('A2').font      = { italic: true, size: 10 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:C3');
    sheet.getCell('A3').value =
      `Targets — Fast: ${targets.fastMoving}  |  Slow: ${targets.slowMoving}  |  Non: ${targets.nonMoving}`;
    sheet.getCell('A3').font      = { italic: true, size: 10 };
    sheet.getCell('A3').alignment = { horizontal: 'center' };

    sheet.addRow([]); // blank spacer (row 4)

    // ── Header row (row 5) ────────────────────────────────────────────────
    const headerRow = sheet.addRow(['Product Name', 'Current Quantity', 'Required Quantity']);
    headerRow.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border    = allBorders();
    });

    // Column widths
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 20;
    sheet.getColumn(3).width = 20;

    // ── Category colours ─────────────────────────────────────────────────
    const COLORS = {
      'fast-moving': 'FFD6E4BC', // soft green
      'slow-moving': 'FFFFF2CC', // soft yellow
      'non-moving':  'FFFCE4D6', // soft orange/red
    };

    let lastCategory = null;

    for (const p of plan.products) {
      // Section separator label when category changes
      if (p.category !== lastCategory) {
        lastCategory = p.category;
        const labelRow = sheet.addRow([
          p.category.toUpperCase().replace('-', ' '),
          '',
          '',
        ]);
        sheet.mergeCells(`A${labelRow.number}:C${labelRow.number}`);
        labelRow.getCell(1).font      = { bold: true, italic: true, size: 11 };
        labelRow.getCell(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        labelRow.getCell(1).alignment = { horizontal: 'center' };
      }

      const row = sheet.addRow([p.name, p.currentStock, p.requiredQuantity]);

      const bgColor = COLORS[p.category] || 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = allBorders();
        cell.alignment = { vertical: 'middle' };
      });

      // Right-align numeric columns
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // ── Summary footer ────────────────────────────────────────────────────
    sheet.addRow([]);
    const sum = plan.summary;
    const footerRow = sheet.addRow([
      `Total products: ${sum.totalProducts}  |  Fast: ${sum.fastMovingCount}  |  Slow: ${sum.slowMovingCount}  |  Non: ${sum.nonMovingCount}`,
      '',
      '',
    ]);
    sheet.mergeCells(`A${footerRow.number}:C${footerRow.number}`);
    footerRow.getCell(1).font      = { italic: true, size: 10 };
    footerRow.getCell(1).alignment = { horizontal: 'center' };

    // ── Stream file to client ──────────────────────────────────────────────
    const fileName = `inventory-plan-${Date.now()}.xlsx`;
    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Parse optional query params to override capital config */
function buildConfig(query) {
  const cfg = {};
  if (query.totalCapital)      cfg.totalCapital      = Number(query.totalCapital);
  if (query.currentlyInvested) cfg.currentlyInvested = Number(query.currentlyInvested);
  if (query.toBeInvested)      cfg.toBeInvested      = Number(query.toBeInvested);
  if (query.fastPct)           cfg.fastPct           = Number(query.fastPct);
  if (query.slowPct)           cfg.slowPct           = Number(query.slowPct);
  if (query.nonPct)            cfg.nonPct            = Number(query.nonPct);
  return cfg;
}

function allBorders() {
  const thin = { style: 'thin' };
  return { top: thin, left: thin, bottom: thin, right: thin };
}
