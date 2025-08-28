const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
require('dotenv').config();

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Authentication failed! No token provided.');
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    if (!token) {
      throw new Error('Authentication failed! Invalid token.');
    }

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    req.userData = { userId: decodedToken.userId };
    console.log('JWT Authentication passed for userId:', decodedToken.userId);
    next();
  } catch (err) {
    console.error('Authentication failed:', err.message);
    return next(new HttpError('Authentication failed!', 403));
  }
};
