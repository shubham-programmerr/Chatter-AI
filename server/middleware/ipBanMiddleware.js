const IPBan = require('../models/IPBan');

/**
 * Middleware to check if IP address is banned
 * Blocks access if IP is in the ban list
 */
const ipBanMiddleware = async (req, res, next) => {
  try {
    // Get client IP address
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
               req.socket.remoteAddress ||
               req.connection.remoteAddress ||
               'unknown';

    // Store IP in request for later use
    req.clientIP = ip;

    // Check if IP is banned and active
    const bannedIP = await IPBan.findOne({
      ipAddress: ip,
      isActive: true
    });

    if (bannedIP) {
      console.warn(`🚫 BLOCKED: Access attempt from banned IP: ${ip} (User: ${bannedIP.username}, Reason: ${bannedIP.reason})`);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Your IP address has been banned due to policy violations. Contact support for appeal.'
      });
    }

    next();
  } catch (error) {
    console.error('IP ban middleware error:', error);
    // Allow access if there's an error, but log it
    req.clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                   req.socket.remoteAddress ||
                   'unknown';
    next();
  }
};

module.exports = ipBanMiddleware;
