'use strict';
const bcrypt = require('bcrypt');

const email = process.env.ADMIN_EMAIL;
const rawPassword = process.env.ADMIN_FRONT_PASSWORD;

module.exports = {
  async up(queryInterface, Sequelize) {

    if (!email) {
      throw new Error("ADMIN_EMAIL is not defined");
    }

    if (!rawPassword) {
      throw new Error("ADMIN_FRONT_PASSWORD is not defined");
    }

    const password = await bcrypt.hash(rawPassword, 10);

    await queryInterface.bulkUpdate(
      'users',
      {
        password: password,
        updatedAt: new Date()
      },
      {
        email: email
      }
    );
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.bulkUpdate(
      'users',
      {
        password: null
      },
      {
        email: email
      }
    );

  }
};