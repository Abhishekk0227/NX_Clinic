const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is required'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hms_jwt_key_2026_production_v1');
    const user = await User.findOne({ userId: decoded.userId });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE_OR_NOT_FOUND',
          message: 'User account is inactive or not found'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
        details: error.message
      }
    });
  }
};

module.exports = authenticate;
