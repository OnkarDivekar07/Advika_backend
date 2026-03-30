require('module-alias/register');
require('@config/env');

const app = require('./src/app');
const sequelize = require('@utils/db');

const PORT = process.env.PORT || 5000;

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
