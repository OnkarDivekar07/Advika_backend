const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const moment = require('moment');
const User = require('@root/models/userdetails');
const generateToken = require('@utils/generateToken');
const CustomError = require('@utils/customError');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Advika Flowers" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Login',
    html: `<h2>🔐 OTP for Login</h2><p>Your OTP is: <strong>${otp}</strong></p><p>Expires in 10 minutes.</p>`,
  });
};

const sendOTP = async (email) => {
  if (email !== process.env.ADMIN_EMAIL) {
    throw new CustomError('Invalid email address', 400);
  }

  const otp = generateOTP();
  const otpExpiry = moment().add(10, 'minutes').toISOString();

  await User.update({ otp, otpExpiry }, { where: { email } });
  await sendOTPEmail(email, otp);
};

const verifyOTP = async (email, otp) => {
  if (email !== process.env.ADMIN_EMAIL) {
    throw new CustomError('Invalid email address', 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) throw new CustomError('User not found', 404);
  if (!user.otp || !user.otpExpiry) throw new CustomError('No OTP found. Please request a new one.', 400);
  if (moment().isAfter(moment(user.otpExpiry))) throw new CustomError('OTP has expired', 400);
  if (user.otp !== otp) throw new CustomError('Invalid OTP', 400);

  await User.update({ otp: null, otpExpiry: null }, { where: { email } });

  return generateToken(user.id, 'admin');
};

const loginWithPassword = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new CustomError('Invalid email', 400);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new CustomError('Invalid password', 400);

  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
  return generateToken(user.id, role);
};

module.exports = { sendOTP, verifyOTP, loginWithPassword };
