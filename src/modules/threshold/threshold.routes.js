'use strict';

const express        = require('express');
const router         = express.Router();
const ctrl           = require('./threshold.controller');
const authenticate   = require('@middlewares/authenticate');
const authorizeAdmin = require('@middlewares/authorizeAdmin');

// Both endpoints are admin-only — they write to the DB
router.use(authenticate, authorizeAdmin);

/**
 * POST /api/threshold/recalculate
 * Recalculate thresholds for ALL products from their full sales history.
 */
router.post('/recalculate', ctrl.recalculateAll);

/**
 * POST /api/threshold/recalculate/:productId
 * Recalculate thresholds for ONE product by its UUID.
 */
router.post('/recalculate/:productId', ctrl.recalculateOne);

module.exports = router;
