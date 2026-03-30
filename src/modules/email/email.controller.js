const emailService = require('./email.service');

exports.sendLowStockEmail = async (req, res, next) => {
  try {
    const result = await emailService.sendLowStockEmail();
    res.sendResponse({ message: result.message, data: { sent: result.sent } });
  } catch (err) { next(err); }
};
