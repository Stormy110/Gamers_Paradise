"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert("Users", [
      {
        name: "Josh L",
        username: "jlopez28",
        email: "jlopez28@gamerparadise.com",
      },
      {
        name: "Sho U",
        username: "suddin29",
        email: "suddin29@gamerparadise.com",
      },
      {
        name: "Ian S",
        username: "istorms30",
        email: "istorms30@gamerparadise.com",
      },
      {
        name: "Kevin T",
        username: "ktuck31",
        email: "ktuck31@gamerparadise.com",
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Users");
  },
};
