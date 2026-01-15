module.exports = (sequelize, DataTypes) => {
  const RideBooking = sequelize.define("RideBooking", {
    pickupLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dropoffLocation: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    distanceKm: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalPrice: DataTypes.FLOAT,
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bookingReference: DataTypes.STRING,
  });

  RideBooking.associate = (models) => {
    RideBooking.belongsTo(models.User);
    RideBooking.belongsTo(models.Ride);
  };

  return RideBooking;
};
