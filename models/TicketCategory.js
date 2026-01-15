const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TicketCategory = sequelize.define(
    "TicketCategory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      price: {
        type: DataTypes.INTEGER, // in kobo
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "ticket_categories",
      timestamps: true,
    }
  );

  return TicketCategory;
};
