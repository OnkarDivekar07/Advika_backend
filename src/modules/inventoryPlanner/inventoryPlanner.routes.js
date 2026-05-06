const express        = require('express');
const router         = express.Router();
const ctrl           = require('./inventoryPlanner.controller');
const authenticate   = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

/**
 * GET /api/inventory-planner
 * Returns JSON of the inventory plan.
 */
router.get('/', authenticate, authorizeAdmin, ctrl.getInventoryPlan);

/**
 * GET /api/inventory-planner/download
 * Downloads the inventory plan as an Excel (.xlsx) file.
 *
 * Optional query params to override defaults:
 *   totalCapital      (number)  – default 900000
 *   currentlyInvested (number)  – default 500000
 *   toBeInvested      (number)  – default 400000
 *   fastPct           (0–1)     – default 0.70
 *   slowPct           (0–1)     – default 0.25
 *   nonPct            (0–1)     – default 0.05
 */
router.get('/download', authenticate, authorizeAdmin, ctrl.downloadInventoryPlan);

module.exports = router;
