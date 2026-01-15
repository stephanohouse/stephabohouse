module.exports = (sequelize, DataTypes) => {
  const RideImage = sequelize.define("RideImage", {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  RideImage.associate = (models) => {
    RideImage.belongsTo(models.Ride);
  };

  return RideImage;
};
