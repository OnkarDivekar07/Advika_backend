const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');

const MissingItem = sequelize.define('MissingItem', {
  name: { type: DataTypes.STRING, allowNull: false },
  requestCount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = MissingItem;
