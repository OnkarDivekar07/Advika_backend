'use strict';
const { v4: uuidv4 } = require('uuid');

const email = process.env.ADMIN_EMAIL;

module.exports = {
  async up(queryInterface) {
    if (!email) throw new Error('ADMIN_EMAIL is not defined in environment variables');

    await queryInterface.bulkInsert('users', [{
      id:         uuidv4(),
      email,
      otp:        '000000',
      otpExpiry:  new Date(Date.now() + 10 * 60 * 1000),
      createdAt:  new Date(),
      updatedAt:  new Date(),
    }], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email }, {});
  },
};
