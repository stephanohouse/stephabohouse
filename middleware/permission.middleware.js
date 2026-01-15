const { User, Role, Permission } = require("../models");

module.exports = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: {
          model: Role,
          include: Permission,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const permissions = new Set();

      user.Roles.forEach((role) => {
        role.Permissions.forEach((perm) => {
          permissions.add(perm.name);
        });
      });

      if (!permissions.has(permissionName)) {
        return res.status(403).json({ message: "Permission denied" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
};
