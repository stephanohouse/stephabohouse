module.exports = (sequelize, DataTypes) => {
  const ApartmentImage = sequelize.define("ApartmentImage", {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  ApartmentImage.associate = (models) => {
    ApartmentImage.belongsTo(models.Apartment);
  };

  return ApartmentImage;
};
