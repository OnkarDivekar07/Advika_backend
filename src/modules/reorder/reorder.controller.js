const reorderService = require('./reorder.service');

exports.getSuggestedOrderQuantity = async (req, res, next) => {
  try {
    const data = await reorderService.getSuggestedOrderQuantity();
    res.sendResponse({ message: 'Reorder suggestions fetched', data });
  } catch (err) { next(err); }
};
