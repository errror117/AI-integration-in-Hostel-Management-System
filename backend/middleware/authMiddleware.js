const { verifyToken } = require("../utils/auth");

exports.protect = (req, res, next) => {
  let token;

  // Token should come in header: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        errors: [{ msg: "No token, authorization denied" }],
      });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, errors: [{ msg: "Token is not valid" }] });
    }
    // Ensure both userId and id are available
    req.user = decoded.userId ? { ...decoded, id: decoded.userId } : decoded;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ success: false, errors: [{ msg: "Token is not valid" }] });
  }
};

/**
 * Optional authentication middleware
 * Extracts user from token if present, but doesn't fail if missing
 * Perfect for chatbot which works with or without login
 */
exports.optionalAuth = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    // Ensure both userId and id are available for consistency
    if (decoded && decoded.userId) {
      req.user = { ...decoded, id: decoded.userId };
    } else {
      req.user = decoded || null;
    }
  } catch (err) {
    // Token invalid, continue without user
    req.user = null;
  }

  next();
};

/**
 * Admin-only middleware
 * Must be used after protect middleware
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      errors: [{ msg: "Authentication required" }]
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      errors: [{ msg: "Access denied. Admin privileges required." }]
    });
  }

  next();
};
