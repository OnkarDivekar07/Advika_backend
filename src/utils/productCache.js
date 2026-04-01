const { getClient, isReady } = require('@utils/redis');

const PRODUCT_CACHE_KEY = 'products:all';
const CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * getCachedProducts()
 * Returns parsed array from Redis, or null if not cached / Redis down.
 */
const getCachedProducts = async () => {
  if (!isReady()) return null;
  try {
    const raw = await getClient().get(PRODUCT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[Cache] getCachedProducts error:', err.message);
    return null;
  }
};

/**
 * setCachedProducts(products)
 * Stores the product list in Redis with a TTL.
 * Silently skips if Redis is down.
 */
const setCachedProducts = async (products) => {
  if (!isReady()) return;
  try {
    await getClient().set(
      PRODUCT_CACHE_KEY,
      JSON.stringify(products),
      'EX',
      CACHE_TTL_SECONDS
    );
  } catch (err) {
    console.error('[Cache] setCachedProducts error:', err.message);
  }
};

/**
 * invalidateProductCache()
 * Deletes the cached product list so the next GET fetches fresh data.
 * Called by every write operation (add, update, delete, stock, image, etc.)
 * Silently skips if Redis is down.
 */
const invalidateProductCache = async () => {
  if (!isReady()) return;
  try {
    await getClient().del(PRODUCT_CACHE_KEY);
  } catch (err) {
    console.error('[Cache] invalidateProductCache error:', err.message);
  }
};

module.exports = { getCachedProducts, setCachedProducts, invalidateProductCache };
