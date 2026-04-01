const Redis = require('ioredis');

let client = null;
let connected = false;

const getClient = () => {
  if (client) return client;

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  client = new Redis(redisUrl, {
    lazyConnect:          true,
    enableOfflineQueue:   false,
    maxRetriesPerRequest: 1,
    retryStrategy:        () => null, // disable auto-reconnect — fail fast
  });

  client.on('connect', () => {
    connected = true;
    console.log('[Redis] Connected');
  });

  client.on('error', (err) => {
    if (connected) {
      console.error('[Redis] Error:', err.message);
    } else {
      console.warn('[Redis] Unavailable — running without cache:', err.message);
    }
    connected = false;
  });

  // Eagerly attempt connection so the log appears at startup
  client.connect().catch(() => {
    // error handler above already logged it
  });

  return client;
};

const isReady = () => connected;

/**
 * Call this once in server.js (or app.js) so Redis connects at boot
 * and the "[Redis] Connected" log appears alongside "Database connected".
 */
const connectRedis = () => getClient();

module.exports = { getClient, isReady, connectRedis };
