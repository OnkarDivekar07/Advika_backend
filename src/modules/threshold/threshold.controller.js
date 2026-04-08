'use strict';

const thresholdService = require('./threshold.service');

/**
 * POST /api/threshold/recalculate/:productId
 *
 * Recalculate and save thresholds for a single product.
 */
exports.recalculateOne = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const data = await thresholdService.recalculateForOne(productId);
    const saved = data.status === 'calculated';
    res.sendResponse({
      statusCode: 200,
      message: saved
        ? `Thresholds updated for product "${data.product_name}"`
        : `Thresholds NOT updated for "${data.product_name}": ${data.reason}`,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/threshold/recalculate
 *
 * Recalculate and save thresholds for ALL products.
 */
exports.recalculateAll = async (req, res, next) => {
  try {
    const data = await thresholdService.recalculateForAll();
    res.sendResponse({
      statusCode: 200,
      message: `Threshold recalculation complete. Updated: ${data.summary.updated}, Skipped: ${data.summary.skipped}`,
      data,
    });
  } catch (err) {
    next(err);
  }
};
