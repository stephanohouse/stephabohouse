const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Event = sequelize.define(
    "Event",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      flyer: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      flyerUrl: {
         type: DataTypes.STRING,
      },
      
      eventDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "events",
      timestamps: true,
    }
  );

  return Event;
};
