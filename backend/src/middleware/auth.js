const admin = require('firebase-admin');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'No authentication token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return ApiResponse.error(res, 'User not found. Please complete registration.', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return ApiResponse.error(res, 'Token expired. Please sign in again.', 401);
    }
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return ApiResponse.error(res, 'Invalid authentication token', 401);
    }
    next(error);
  }
};

module.exports = authenticate;
