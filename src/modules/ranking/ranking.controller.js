const rankingService = require('./ranking.service');

exports.getRankings = async (req, res, next) => {
  try {
    const data = await rankingService.getRankings();
    res.sendResponse({ message: 'Product rankings fetched', data });
  } catch (err) {
    next(err);
  }
};

exports.getRankingsByCategory = async (req, res, next) => {
  try {
    const data = await rankingService.getRankingsByCategory();
    res.sendResponse({ message: 'Rankings by category fetched', data });
  } catch (err) {
    next(err);
  }
};

exports.resetRankings = async (req, res, next) => {
  try {
    await rankingService.resetRankings();
    res.sendResponse({ message: 'All rankings and sales counts have been reset.' });
  } catch (err) {
    next(err);
  }
};
