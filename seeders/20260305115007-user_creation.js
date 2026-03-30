const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {

    const password = await bcrypt.hash(process.env.USER_STAFF_PASSWORD, 10);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email: process.env.USER_STAFF_EMAIL,
        password: password,
        otp: null,
        otpExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: process.env.USER_STAFF_EMAIL
    }, {});
  }
};