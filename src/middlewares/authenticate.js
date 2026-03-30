const jwt = require('jsonwebtoken');
const CustomError = require('@utils/customError');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new CustomError('Access denied. No token provided.', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    next(new CustomError('Invalid token.', 401));
  }
};

module.exports = authenticate;
