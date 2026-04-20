const nodemailer = require('nodemailer');
const { getReorderProductsRanked } = require('@modules/ranking/ranking.service');

const buildEmailHtml = (products) => {
  const categoryLabel = {
    'fast-moving': '🔴 Fast-Moving',
    'slow-moving': '🟡 Slow-Moving',
    'non-moving':  '⚪ Non-Moving',
  };

  const rows = products
    .map(
      (p) => `
      <li style="margin-bottom:10px;">
        <strong>${p.name}${p.marathiName ? ` (${p.marathiName})` : ''}</strong>
        &nbsp;<span style="font-size:12px;color:#666;">${categoryLabel[p.category] || ''} — Rank #${p.rank ?? 'Unranked'}</span><br/>
        Current Stock: ${p.quantity} &nbsp;|&nbsp;
        Upper Threshold: ${p.upper_threshold} &nbsp;|&nbsp;
        Suggested Order: <strong>${p.order_quantity}</strong>
      </li>`
    )
    .join('');

  return `
    <h2>📦 Inventory Reorder Alert</h2>
    <p>Products are listed <strong>fast-moving first</strong> (rank 1 = top seller).</p>
    <ul style="line-height:1.8;">${rows}</ul>
  `;
};

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

/**
 * Can be called from cron (no req/res) or from an API route.
 * Products that need reorder are sorted: rank 1 (fast-mover) first.
 */
const sendLowStockEmail = async () => {
  const reorderProducts = (await getReorderProductsRanked()).filter((p) => p.category !== 'non-moving');

  if (!reorderProducts.length) {
    return { sent: false, message: 'No products require reorder.' };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Advika Flowers" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIVER_EMAIL,
    subject: 'Inventory Reorder Alert',
    html: buildEmailHtml(reorderProducts),
  });

  return { sent: true, message: 'Inventory alert email sent.', count: reorderProducts.length };
};

module.exports = { sendLowStockEmail };
