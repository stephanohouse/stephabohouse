module.exports = (sequelize, DataTypes) => {
  const BlogMedia = sequelize.define(
    "BlogMedia",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "blog_media",
      timestamps: true,
    }
  );

  BlogMedia.associate = (models) => {
    BlogMedia.belongsTo(models.BlogSection);
  };

  return BlogMedia;
};
