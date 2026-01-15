module.exports = (sequelize, DataTypes) => {
  const ApartmentBooking = sequelize.define("ApartmentBooking", {
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalPrice: DataTypes.FLOAT,
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bookingReference: DataTypes.STRING,
  });

  ApartmentBooking.associate = (models) => {
    ApartmentBooking.belongsTo(models.User);
    ApartmentBooking.belongsTo(models.Apartment);
  };

  return ApartmentBooking;
};
