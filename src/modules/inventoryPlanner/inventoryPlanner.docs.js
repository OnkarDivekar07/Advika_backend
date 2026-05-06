/**
 * @swagger
 * tags:
 *   name: InventoryPlanner
 *   description: >
 *     Capital-aware inventory planning. Given a total capital budget of ₹9 lakh
 *     (₹5 lakh already invested + ₹4 lakh to be invested), computes the exact
 *     required quantity for every product so that the final inventory value
 *     matches the target split: fast-movers 70% · slow-movers 25% · non-movers 5%.
 *
 *     **How required quantity is calculated:**
 *     Each bucket (fast/slow/non) receives a share of totalCapital (e.g. 70% = ₹6,30,000).
 *     Within a bucket, each product receives a weighted share based on its salesCount
 *     (for fast/slow movers) or an equal split (for non-movers).
 *     requiredQuantity = ⌈productShare ÷ price⌉ — this is the TOTAL units that
 *     should be in stock. The `delta` field = requiredQuantity − currentStock,
 *     telling you exactly how many units to buy (positive) or reduce (negative).
 */

/**
 * @swagger
 * /api/inventory-planner:
 *   get:
 *     summary: Get inventory plan (JSON)
 *     description: >
 *       Returns all products in order — fast-movers first, then slow-movers,
 *       then non-movers — with their current quantity and the required quantity
 *       needed to achieve the target capital allocation.
 *
 *       **Default capital config** (overridable via query params):
 *       - `totalCapital` = 9,00,000 (₹9 lakh)
 *       - `currentlyInvested` = 5,00,000
 *       - `toBeInvested` = 4,00,000
 *       - `fastPct` = 0.70 (fast-movers should hold 70% of total capital value)
 *       - `slowPct` = 0.25
 *       - `nonPct`  = 0.05
 *
 *       Within each bucket, required quantities are distributed proportionally
 *       by `salesCount` (fast/slow) or equally (non-movers).
 *     tags: [InventoryPlanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: totalCapital
 *         schema: { type: number, example: 900000 }
 *         description: Total capital budget in ₹ (default 900000)
 *       - in: query
 *         name: currentlyInvested
 *         schema: { type: number, example: 500000 }
 *         description: Capital already tied up in current stock (default 500000)
 *       - in: query
 *         name: toBeInvested
 *         schema: { type: number, example: 400000 }
 *         description: Capital to be invested in upcoming months (default 400000)
 *       - in: query
 *         name: fastPct
 *         schema: { type: number, example: 0.70 }
 *         description: Fraction of totalCapital for fast-movers (default 0.70)
 *       - in: query
 *         name: slowPct
 *         schema: { type: number, example: 0.25 }
 *         description: Fraction of totalCapital for slow-movers (default 0.25)
 *       - in: query
 *         name: nonPct
 *         schema: { type: number, example: 0.05 }
 *         description: Fraction of totalCapital for non-movers (default 0.05)
 *     responses:
 *       200:
 *         description: Inventory plan computed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Inventory plan computed }
 *                 data:
 *                   $ref: '#/components/schemas/InventoryPlanResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * /api/inventory-planner/download:
 *   get:
 *     summary: Download inventory plan as Excel (.xlsx)
 *     description: >
 *       Generates and streams an Excel workbook with three columns:
 *       **Product Name | Current Quantity | Required Quantity**.
 *
 *       Products are sorted: fast-movers at the top, slow-movers in the middle,
 *       non-movers at the bottom. Each section is visually distinguished by
 *       colour and a section-header row.
 *
 *       **Required Quantity** = total units that should be in stock to hit the
 *       capital allocation target. It does NOT represent units to purchase —
 *       subtract Current Quantity yourself to find how many to buy.
 *
 *       The workbook also includes a summary row and capital-config metadata.
 *
 *       All query parameters are identical to the JSON endpoint and are optional.
 *     tags: [InventoryPlanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: totalCapital
 *         schema: { type: number, example: 900000 }
 *         description: Total capital budget in ₹ (default 900000)
 *       - in: query
 *         name: currentlyInvested
 *         schema: { type: number, example: 500000 }
 *         description: Capital already tied up in current stock (default 500000)
 *       - in: query
 *         name: toBeInvested
 *         schema: { type: number, example: 400000 }
 *         description: Capital to be invested in upcoming months (default 400000)
 *       - in: query
 *         name: fastPct
 *         schema: { type: number, example: 0.70 }
 *         description: Fraction of totalCapital for fast-movers (default 0.70)
 *       - in: query
 *         name: slowPct
 *         schema: { type: number, example: 0.25 }
 *         description: Fraction of totalCapital for slow-movers (default 0.25)
 *       - in: query
 *         name: nonPct
 *         schema: { type: number, example: 0.05 }
 *         description: Fraction of totalCapital for non-movers (default 0.05)
 *     responses:
 *       200:
 *         description: Excel file streamed as binary download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryPlanProduct:
 *       type: object
 *       properties:
 *         id:               { type: string, format: uuid }
 *         name:             { type: string, example: Rose }
 *         marathiName:      { type: string, nullable: true, example: गुलाब }
 *         price:            { type: number, example: 25.5 }
 *         currentStock:     { type: integer, example: 40, description: Units in stock right now }
 *         requiredQuantity: { type: integer, example: 112, description: Total units that should be in stock to hit target allocation }
 *         requiredValue:    { type: number,  example: 2856, description: requiredQuantity × price }
 *         currentValue:     { type: number,  example: 1020, description: currentStock × price }
 *         delta:            { type: integer, example: 72, description: requiredQuantity − currentStock (positive = buy more, negative = excess) }
 *         salesCount:       { type: integer, example: 87 }
 *         rank:             { type: integer, nullable: true, example: 1 }
 *         category:         { type: string, enum: [fast-moving, slow-moving, non-moving] }
 *         defaultUnit:      { type: string, example: pcs }
 *
 *     InventoryPlanResponse:
 *       type: object
 *       properties:
 *         config:
 *           type: object
 *           properties:
 *             totalCapital:      { type: number, example: 900000 }
 *             currentlyInvested: { type: number, example: 500000 }
 *             toBeInvested:      { type: number, example: 400000 }
 *             targets:
 *               type: object
 *               properties:
 *                 fastMoving: { type: string, example: "70% = ₹6,30,000" }
 *                 slowMoving: { type: string, example: "25% = ₹2,25,000" }
 *                 nonMoving:  { type: string, example: "5% = ₹45,000" }
 *         summary:
 *           type: object
 *           properties:
 *             totalProducts:      { type: integer }
 *             fastMovingCount:    { type: integer }
 *             slowMovingCount:    { type: integer }
 *             nonMovingCount:     { type: integer }
 *             currentStockValue:  { type: number }
 *             requiredStockValue: { type: number }
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InventoryPlanProduct'
 */
