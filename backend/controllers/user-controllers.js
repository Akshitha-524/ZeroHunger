const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const HttpError = require('../models/http-error');
const transporter = require('../utils/transporter'); // make sure this exists

// ---------------- SIGNUP ----------------
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { fullname, email, password, mobile, gender, type, address, city, state, Url } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  if (existingUser) {
    return next(new HttpError('User exists already, please login instead.', 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError('Could not create user, please try again.', 500));
  }

  const createdUser = new User({
    fullname,
    email,
    password: hashedPassword,
    mobile,
    gender,
    type,
    address,
    city,
    state,
    Url,
    datetime: new Date().toISOString(),
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  // Optional: send welcome email
  try {
    await transporter.sendMail({
      to: createdUser.email,
      from: 'we-dont-waste-food@king.buzz',
      subject: 'Registration Successful',
      html: '<h1>Welcome to We Don\'t Waste Food!</h1>',
    });
  } catch (err) {
    console.error('Mail sending failed:', err);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token,
  });
};

// ---------------- LOGIN ----------------
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.', 500));
  }

  if (!existingUser) {
    return next(new HttpError('Invalid credentials, could not log you in.', 403));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(new HttpError('Could not log you in, please try again.', 500));
  }

  if (!isValidPassword) {
    return next(new HttpError('Invalid credentials, could not log you in.', 403));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later.', 500));
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token,
  });
};

// ---------------- VIEW PROFILE ----------------
const viewProfile = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError('Fetching user failed, please try again later.', 500));
  }

  if (!user) {
    return next(new HttpError('User not found.', 404));
  }

  res.json({
    fullname: user.fullname,
    email: user.email,
    mobile: user.mobile,
    gender: user.gender,
    type: user.type,
    address: user.address,
    city: user.city,
    state: user.state,
    Url: user.Url,
  });
};

// ---------------- EDIT PROFILE ----------------
const editProfile = async (req, res, next) => {
  const { fullname, email, mobile, gender, type, address, city, state, Url } = req.body;

  let user;
  try {
    user = await User.findById(req.userData.userId);
    if (!user) return next(new HttpError('User not found.', 404));

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.gender = gender || user.gender;
    user.type = type || user.type;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.Url = Url || user.Url;

    await user.save();
  } catch (err) {
    return next(new HttpError('Edit profile failed, please try again later.', 500));
  }

  res.json({
    fullname: user.fullname,
    email: user.email,
    mobile: user.mobile,
    gender: user.gender,
    type: user.type,
    address: user.address,
    city: user.city,
    state: user.state,
    Url: user.Url,
  });
};

// ---------------- RESET PASSWORD ----------------
const resetPassword = async (req, res, next) => {
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) return next(new HttpError('Token creation failed.', 500));
    const token = buffer.toString('hex');

    let user;
    try {
      user = await User.findOne({ email: req.body.email });
    } catch (err) {
      return next(new HttpError('Something went wrong.', 500));
    }

    if (!user) return next(new HttpError('No user found with that email.', 422));

    user.resetToken = token;
    user.expireToken = Date.now() + 3600 * 1000;

    try {
      await user.save();
      await transporter.sendMail({
        to: user.email,
        from: 'we-dont-waste-food@king.buzz',
        subject: 'Password Reset',
        html: `<p>You requested a password reset</p>
               <h4>Click this <a href="https://we-dont-waste-food.herokuapp.com/reset-password/${token}">link</a> to reset your password</h4>`,
      });
      res.json({ message: 'Check your email for reset link.' });
    } catch (err) {
      return next(new HttpError('Saving reset token failed.', 500));
    }
  });
};

// ---------------- NEW PASSWORD ----------------
const newPassword = async (req, res, next) => {
  const { password, token } = req.body;

  let user;
  try {
    user = await User.findOne({ resetToken: token, expireToken: { $gt: Date.now() } });
  } catch (err) {
    return next(new HttpError('Something went wrong.', 500));
  }

  if (!user) return next(new HttpError('Token invalid or expired.', 422));

  try {
    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();
  } catch (err) {
    return next(new HttpError('Could not reset password.', 500));
  }

  res.json({ message: 'Password updated successfully.' });
};

// ---------------- EXPORTS ----------------
exports.signup = signup;
exports.login = login;
exports.viewProfile = viewProfile;
exports.editProfile = editProfile;
exports.resetPassword = resetPassword;
exports.newPassword = newPassword;
