'use strict';

/**
 * threshold.alert.js
 *
 * Sends an email when one or more products have dropped to or below
 * their min_threshold (danger zone) mid-month.
 *
 * ISOLATED — zero changes to the existing email.service.js.
 * Uses the same nodemailer + env vars (EMAIL_USER, EMAIL_PASSWORD,
 * RECIVER_EMAIL) so no new config is needed.
 *
 * Called from threshold.service.js → saveThresholds() after every
 * recalculate. If nothing is below min, the function returns silently.
 */

const nodemailer = require('nodemailer');

/* ─── HTML builder ───────────────────────────────────────────────────────── */

const buildAlertHtml = (products) => {
  const categoryLabel = {
    'fast-moving': '🔴 Fast-Moving',
    'slow-moving': '🟡 Slow-Moving',
  };

  const rows = products
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <strong>${p.product_name}</strong>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
          ${categoryLabel[p.category] || p.category}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:#e53e3e;font-weight:bold;">
          ${p.current_stock}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
          ${p.min_threshold}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
          ${p.units_below} units below limit
        </td>
      </tr>`
    )
    .join('');

  return `
    <div style="font-family:sans-serif;max-width:680px;margin:0 auto;">
      <h2 style="color:#c53030;">⚠️ Low Stock Alert — Minimum Threshold Breached</h2>
      <p style="color:#555;">
        The following products have dropped to or below their
        <strong>minimum threshold</strong> before month-end.
        This means last month's order was insufficient — place an emergency order immediately.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#fff5f5;">
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e53e3e;">Product</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e53e3e;">Category</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e53e3e;">Current Stock</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e53e3e;">Min Threshold</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #e53e3e;">Gap</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:20px;color:#888;font-size:12px;">
        Min threshold = safety buffer + lead time buffer (stock needed to survive
        until your next delivery arrives). Do not let any product reach zero.
      </p>
    </div>
  `;
};

/* ─── Transporter (same credentials as existing email module) ────────────── */

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

/* ─── One-email-per-day guard ────────────────────────────────────────────── */

// Stores the calendar date string of the last sent alert e.g. "2026-04-12".
// Lives in process memory — resets automatically if the server restarts,
// which is fine: a restart is a new day from the guard's perspective.
let lastAlertDate = null;

const todayString = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

/* ─── Public function ────────────────────────────────────────────────────── */

/**
 * sendMinThresholdAlert(breachedProducts)
 *
 * Sends at most ONE email per calendar day regardless of how many times
 * recalculate is called. Subsequent calls on the same day return silently.
 *
 * @param {Array<{
 *   product_name:   string,
 *   category:       string,
 *   current_stock:  number,
 *   min_threshold:  number,
 *   units_below:    number,
 * }>} breachedProducts
 *
 * Returns silently if the array is empty or alert already sent today.
 */
const sendMinThresholdAlert = async (breachedProducts) => {
  if (!breachedProducts.length) return { sent: false, reason: 'no_breach' };

  const today = todayString();
  if (lastAlertDate === today) return { sent: false, reason: 'already_sent_today' };

  // Mark before sending — prevents a second call racing in while sendMail is awaited
  lastAlertDate = today;

  const transporter = createTransporter();

  await transporter.sendMail({
    from:    `"Advika Inventory" <${process.env.EMAIL_USER}>`,
    to:      process.env.RECIVER_EMAIL,
    subject: `⚠️ Low Stock Alert — ${breachedProducts.length} product(s) below minimum`,
    html:    buildAlertHtml(breachedProducts),
  });

  return {
    sent:  true,
    count: breachedProducts.length,
  };
};

module.exports = { sendMinThresholdAlert };