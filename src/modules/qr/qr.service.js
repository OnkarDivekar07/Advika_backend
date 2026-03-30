const QRCode = require('qrcode');
const CustomError = require('@utils/customError');

const generateQR = async (productId) => {
  if (!productId) throw new CustomError('Product ID is required', 400);
  return QRCode.toDataURL(productId, { width: 300, margin: 1 });
};

module.exports = { generateQR };
