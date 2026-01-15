module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define("Ride", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    description: DataTypes.TEXT,
    pricePerKm: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
    pricePerDay: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
    vehicleType: DataTypes.STRING,
    capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
  },
 });


  Ride.associate = (models) => {
    Ride.hasMany(models.RideBooking, { onDelete: "CASCADE" });
    Ride.hasMany(models.RideImage, { onDelete: "CASCADE" });
  };

  return Ride;
};
