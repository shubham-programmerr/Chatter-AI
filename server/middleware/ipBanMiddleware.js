const IPBan = require('../models/IPBan');

const BAN_CACHE_TTL_MS = 15000;
let activeBanCache = new Set();
let cacheExpiresAt = 0;
let pendingCacheLoad = null;

const getActiveBannedIPs = async () => {
  const now = Date.now();
  if (now < cacheExpiresAt) {
    return activeBanCache;
  }
  if (!pendingCacheLoad) {
    pendingCacheLoad = IPBan.find({ isActive: true })
      .select('ipAddress')
      .lean()
      .then((records) => {
        activeBanCache = new Set(records.map((r) => r.ipAddress));
        cacheExpiresAt = Date.now() + BAN_CACHE_TTL_MS;
        return activeBanCache;
      })
      .finally(() => {
        pendingCacheLoad = null;
      });
  }
  return pendingCacheLoad;
};

const invalidateIPBanCache = () => {
  cacheExpiresAt = 0;
};

/**
 * Middleware to check if IP address is banned
 * Blocks access if IP is in the ban list
 */
const ipBanMiddleware = async (req, res, next) => {
  try {
    // Get client IP address - handle various formats
    const ip = (req.headers['x-forwarded-for']?.split(',')[0] || 
                req.socket.remoteAddress || 
                req.connection.remoteAddress || 
                'unknown').trim();

    // Store IP in request for later use
    req.clientIP = ip;

    const bannedSet = await getActiveBannedIPs();
    if (bannedSet.has(ip)) {
      const bannedIP = await IPBan.findOne({ ipAddress: ip, isActive: true }).select('username reason').lean();
      if (bannedIP) {
        console.warn(`🚫 BLOCKED: Access attempt from banned IP: ${ip} (User: ${bannedIP.username}, Reason: ${bannedIP.reason})`);
        return res.status(403).json({
          error: 'Access Denied',
          message: 'Your IP address has been banned due to policy violations. Contact support for appeal.'
        });
      }
      invalidateIPBanCache();
    }

    next();
  } catch (error) {
    console.error('❌ IP ban middleware error:', error);
    // Allow access if there's an error, but log it
    req.clientIP = (req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.socket.remoteAddress || 
                    'unknown').trim();
    next();
  }
};

module.exports = ipBanMiddleware;
module.exports.invalidateIPBanCache = invalidateIPBanCache;
