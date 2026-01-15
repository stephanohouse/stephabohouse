module.exports = (sequelize, DataTypes) => {
  const BlogComment = sequelize.define(
    "BlogComment",
    {
      comment: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    { timestamps: true }
  );

  BlogComment.associate = (models) => {
    BlogComment.belongsTo(models.User);
    BlogComment.belongsTo(models.BlogPost);
  };

  return BlogComment;
};
