module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Restaurants', "view_Counts", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Restaurants', "view_Counts"); 
  }
};

