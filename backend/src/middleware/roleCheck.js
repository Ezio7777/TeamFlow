const { ROLE_HIERARCHY } = require('../constants/roles');
const ApiResponse = require('../utils/apiResponse');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const hasPermission = allowedRoles.some(
      (role) => ROLE_HIERARCHY[role] <= userRoleLevel
    );

    if (!hasPermission) {
      return ApiResponse.error(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        403
      );
    }

    next();
  };
};

const requireTeam = (req, res, next) => {
  if (!req.user?.teamId) {
    return ApiResponse.error(res, 'You must be part of a team to perform this action', 403);
  }
  next();
};

module.exports = { requireRole, requireTeam };
