const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 300, checkperiod: 60 });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, val, ttl) => ttl ? cache.set(key, val, ttl) : cache.set(key, val),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
};
