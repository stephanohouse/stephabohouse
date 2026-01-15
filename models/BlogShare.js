module.exports = (sequelize, DataTypes) => {
  const BlogShare = sequelize.define(
    "BlogShare",
    {
      platform: DataTypes.STRING, // whatsapp, twitter, facebook
    },
    { timestamps: true }
  );

  BlogShare.associate = (models) => {
    BlogShare.belongsTo(models.User);
    BlogShare.belongsTo(models.BlogPost);
  };

  return BlogShare;
};
