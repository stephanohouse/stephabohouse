module.exports = (sequelize, DataTypes) => {
  const BlogPost = sequelize.define(
    "BlogPost",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT, // main body (intro, summary, etc.)
        allowNull: false,
      },
      coverType: {
        type: DataTypes.ENUM("image", "video"),
        allowNull: true,
      },
      coverUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "blog_posts",
      timestamps: true,
    }
  );

  BlogPost.associate = (models) => {
    BlogPost.belongsTo(models.User, {
      foreignKey: "authorId",
      as: "author",
    });

    BlogPost.hasMany(models.BlogSection, {
      onDelete: "CASCADE",
      as: "sections",
    });
      // 🔥 ADD THESE
    BlogPost.hasMany(models.BlogLike, {
      onDelete: "CASCADE",
      as: "likes",
    });

    BlogPost.hasMany(models.BlogComment, {
      onDelete: "CASCADE",
      as: "comments",
    });

    BlogPost.hasMany(models.BlogShare, {
      onDelete: "CASCADE",
      as: "shares",
    });

  
    // ✅ ADD THESE
  BlogPost.hasMany(models.BlogLike);
  BlogPost.hasMany(models.BlogComment);
  BlogPost.hasMany(models.BlogShare);
  };

  return BlogPost;
};
