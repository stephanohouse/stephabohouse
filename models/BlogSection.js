module.exports = (sequelize, DataTypes) => {
  const BlogSection = sequelize.define(
    "BlogSection",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("content", "ad"),
        defaultValue: "content",
      },
    },
    {
      tableName: "blog_sections",
      timestamps: true,
    }
  );

  BlogSection.associate = (models) => {
    BlogSection.belongsTo(models.BlogPost);
    BlogSection.hasMany(models.BlogMedia, {
      onDelete: "CASCADE",
      as: "media",
    });
  };

  return BlogSection;
};
