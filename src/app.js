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
cron.schedule('0 6 * * *', () => {
  console.log('Running auto-order generation cron...');
  generateAutoOrders().catch((err) => console.error('Auto-order cron failed:', err.message));
}, { timezone: 'Asia/Kolkata' });

cron.schedule('0 7 * * *', () => {
  console.log('Running daily low-stock email cron...');
  emailService.sendLowStockEmail().catch((err) => console.error('Cron email failed:', err.message));
}, { timezone: 'Asia/Kolkata' });

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
