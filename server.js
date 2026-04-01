require('module-alias/register');
require('@config/env');

const app       = require('./src/app');
const sequelize = require('@utils/db');
const { connectRedis } = require('@utils/redis');

const PORT = process.env.PORT || 5000;

// Kick off Redis connection at startup — runs in parallel with DB auth
connectRedis();

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
