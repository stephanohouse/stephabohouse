const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TicketPurchase = sequelize.define(
    "TicketPurchase",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      buyerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      buyerEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      buyerPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      serialCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      paymentReference: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "ticket_purchases",
      timestamps: true,
    }
  );

  return TicketPurchase;
};