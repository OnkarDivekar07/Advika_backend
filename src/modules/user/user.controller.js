const userService = require('./user.service');

exports.sendOTP = async (req, res, next) => {
  try {
    await userService.sendOTP(req.body.email);
    res.sendResponse({ message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const token = await userService.verifyOTP(req.body.email, req.body.otp);
    res.sendResponse({ message: 'OTP verified successfully', data: { token } });
  } catch (err) {
    next(err);
  }
};

exports.loginWithPassword = async (req, res, next) => {
  try {
    const token = await userService.loginWithPassword(req.body.email, req.body.password);
    res.sendResponse({ message: 'Login successful', data: { token } });
  } catch (err) {
    next(err);
  }
};
