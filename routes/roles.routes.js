// routes/roles.routes.js
const router = require("express").Router();
const { Role } = require("../models");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, async (req, res) => {
  const roles = await Role.findAll({
    attributes: ["id", "name"]
  });
  res.json(roles);
});

module.exports = router;
