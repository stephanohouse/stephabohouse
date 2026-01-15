const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const permit = require("../middleware/permission.middleware");
const blog = require("../controllers/blog.controller");
const { upload } = require("../middleware/blogUpload.middleware");

router.post(
  "/",
  auth,
  permit("create_blog"),
  upload.any(),        // 🔥 REQUIRED
  blog.createPost
);

router.put("/:id", auth, permit("update_blog"), blog.updatePost);
router.delete("/:id", auth, permit("delete_blog"), blog.deletePost);

router.get("/", blog.getAllPosts);
router.get("/:id", blog.getSinglePost);

router.post("/:id/like", auth, blog.toggleLike);
router.post("/:id/comment", auth, blog.addComment);
router.post("/:id/share", auth, blog.sharePost);

module.exports = router;
