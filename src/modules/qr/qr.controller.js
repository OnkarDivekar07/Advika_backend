const qrService = require('./qr.service');

exports.generateQR = async (req, res, next) => {
  try {
    const qr = await qrService.generateQR(req.body.productId);
    res.sendResponse({ message: 'QR generated', data: { qr } });
  } catch (err) { next(err); }
};
