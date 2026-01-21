const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Generate JWT token with multi-tenancy support
 * @param {String} userId - User's MongoDB ID
 * @param {String} organizationId - Organization's MongoDB ID (optional for super_admin)
 * @param {String} role - User role: super_admin, org_admin, sub_admin, student
 * @param {Boolean} isAdmin - Legacy field for backward compatibility
 * @returns {String} JWT token
 */
exports.generateToken = (userId, organizationId = null, role = 'student', isAdmin = false) => {
  const payload = {
    userId,
    role,
    isAdmin: isAdmin || ['super_admin', 'org_admin', 'sub_admin'].includes(role)
  };

  // Only add organizationId if it exists (super_admin doesn't need it)
  if (organizationId) {
    payload.organizationId = organizationId;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Extended from 1h for better UX
  });
};

/**
 * Verify JWT token and return decoded payload
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};