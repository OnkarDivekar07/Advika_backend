const CustomError = require('@utils/customError');

const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.error('Error Stack:', err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const errors = err.errors || null;

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
