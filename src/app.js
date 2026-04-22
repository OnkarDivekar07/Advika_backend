const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const cron = require('node-cron');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('@config/swagger');

// Register all Sequelize model associations before anything else
require('@root/models/associations');

const routes = require('./routes/apiRoutes');
const errorHandler = require('@middlewares/errorHandler');
const responseMiddleware = require('@middlewares/responseMiddleware');
const emailService = require('@modules/email/email.service');
const { generateAutoOrders } = require('@services/autoOrder/autoOrderGenerator');
const { recalculateForAll } = require('@modules/threshold/threshold.service');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────
app.use(responseMiddleware);
app.use(express.json());
app.use(cors({ origin: true }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/view', express.static(path.join(__dirname, '../view')));

// ─── Swagger Docs ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Advika Flowers API Docs',
  swaggerOptions: {
    persistAuthorization: true, // keeps token filled in after page refresh
  },
}));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Cron Jobs ────────────────────────────────────────────────────────────
cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Step 1/2 — Recalculating thresholds from latest sales...');
  try {
    const result = await recalculateForAll();
    console.log(`[Cron] Thresholds updated: ${result.summary.updated} products, ${result.summary.eliminated} eliminated, ${result.summary.skipped} skipped.`);
  } catch (err) {
    console.error('[Cron] Threshold recalculation failed:', err.message);
    // Don't return — still run auto-orders with existing thresholds
  }

  console.log('[Cron] Step 2/2 — Generating auto-orders from fresh thresholds...');
  generateAutoOrders().catch((err) => console.error('[Cron] Auto-order generation failed:', err.message));
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 7 * * *', () => {
  console.log('Running daily low-stock email cron...');
  emailService.sendLowStockEmail().catch((err) => console.error('Cron email failed:', err.message));
}, { timezone: 'Asia/Kolkata' });

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
