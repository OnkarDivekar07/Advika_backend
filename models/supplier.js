const { DataTypes } = require('sequelize');
const sequelize = require('@utils/db');
const { encrypt, decrypt } = require('@utils/supplierCrypto');

const Supplier = sequelize.define('Supplier', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:      {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return decrypt(this.getDataValue('name'));
    },
    set(value) {
      this.setDataValue('name', encrypt(value));
    },
  },
  phone:     {
    type: DataTypes.STRING,
    get() {
      return decrypt(this.getDataValue('phone'));
    },
    set(value) {
      this.setDataValue('phone', encrypt(value));
    },
  },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Supplier;
