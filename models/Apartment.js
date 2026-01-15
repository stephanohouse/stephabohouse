module.exports = (sequelize, DataTypes) => {
  const Apartment = sequelize.define("Apartment", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    pricePerNight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    location: DataTypes.STRING,
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  });

  Apartment.associate = (models) => {
    Apartment.hasMany(models.ApartmentImage, { onDelete: "CASCADE" });
    Apartment.hasMany(models.ApartmentBooking, { onDelete: "CASCADE" });
  };

  return Apartment;
};
