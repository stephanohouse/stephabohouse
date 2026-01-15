module.exports = (sequelize, DataTypes) => {
  const BlogLike = sequelize.define("BlogLike", {}, { timestamps: true });

  BlogLike.associate = (models) => {
    BlogLike.belongsTo(models.User);
    BlogLike.belongsTo(models.BlogPost);
  };

  return BlogLike;
};
