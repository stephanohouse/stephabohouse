const {
  BlogPost,
  BlogSection,
  BlogMedia,
  BlogLike,
  BlogComment,
  BlogShare,
  User,
} = require("../models");
const { uploadToCloudinary } = require("../middleware/blogUpload.middleware");

/* ───────── CREATE POST ───────── */
exports.createPost = async (req, res) => {
  try {
    const { title, content, sections } = req.body;
    const parsedSections = JSON.parse(sections);

    const post = await BlogPost.create({
      title,
      content,
      authorId: req.user.id,
    });

    for (let i = 0; i < parsedSections.length; i++) {
      const section = parsedSections[i];

      const blogSection = await BlogSection.create({
        text: section.text || null,
        order: section.order,
        type: section.type || "content",
        BlogPostId: post.id,
      });

      // 🔥 GET FILES BELONGING TO THIS SECTION
      const sectionFiles = req.files.filter(file =>
        file.fieldname.startsWith(`section_${i}_media`)
      );

      for (const file of sectionFiles) {
        const uploaded = await uploadToCloudinary(file);

        await BlogMedia.create({
          type: file.mimetype.startsWith("image") ? "image" : "video",
          url: uploaded.secure_url, // ✅ REAL URL
          BlogSectionId: blogSection.id,
        });
      }
    }

    res.status(201).json({ message: "Blog post created", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



/* ───────── GET ALL POSTS ───────── */
exports.getAllPosts = async (req, res) => {
  const posts = await BlogPost.findAll({
    where: { isPublished: true },
    include: [
      {
        model: User,
        as: "author",
        attributes: ["id", "fullName", "profileImage"],
      },
      {
        model: BlogSection,
        as: "sections",
        include: [{ model: BlogMedia, as: "media" }],
      },
      { model: BlogLike, as: "likes" },
      { model: BlogComment, as: "comments" },
      { model: BlogShare, as: "shares" },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json(posts);
};

/* ───────── GET SINGLE POST ───────── */
exports.getSinglePost = async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: "author",
        attributes: ["fullName", "profileImage"],
      },
      {
        model: BlogSection,
        as: "sections",
        include: [{ model: BlogMedia, as: "media" }],
      },
      {
        model: BlogComment,
        as: "comments",
        include: [{ model: User, attributes: ["fullName", "profileImage"] }],
      },
      { model: BlogLike, as: "likes" },
    ],
  });

  if (!post) return res.status(404).json({ message: "Post not found" });

  res.json(post);
};

/* ───────── UPDATE POST ───────── */
exports.updatePost = async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);

  if (!post) return res.status(404).json({ message: "Post not found" });

  await post.update(req.body);

  res.json({ message: "Post updated", post });
};

/* ───────── DELETE POST ───────── */
exports.deletePost = async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);

  if (!post) return res.status(404).json({ message: "Post not found" });

  await post.destroy();

  res.json({ message: "Post deleted" });
};

/* ───────── LIKE / UNLIKE ───────── */
exports.toggleLike = async (req, res) => {
  const existing = await BlogLike.findOne({
    where: { UserId: req.user.id, BlogPostId: req.params.id },
  });

  if (existing) {
    await existing.destroy();
    return res.json({ message: "Unliked" });
  }

  await BlogLike.create({
    UserId: req.user.id,
    BlogPostId: req.params.id,
  });

  res.json({ message: "Liked" });
};

/* ───────── COMMENT ───────── */
exports.addComment = async (req, res) => {
  const comment = await BlogComment.create({
    comment: req.body.comment,
    UserId: req.user.id,
    BlogPostId: req.params.id,
  });

  res.status(201).json(comment);
};

/* ───────── SHARE ───────── */
exports.sharePost = async (req, res) => {
  await BlogShare.create({
    platform: req.body.platform,
    UserId: req.user.id,
    BlogPostId: req.params.id,
  });

  res.json({ message: "Post shared" });
};
