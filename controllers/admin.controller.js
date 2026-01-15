const { User, Role } = require("../models");

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: Role,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// APPROVE or DISABLE user
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = isActive;
    await user.save();

    res.json({ message: "User status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ASSIGN role to user
exports.assignRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleName } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) return res.status(404).json({ message: "Role not found" });

    await user.addRole(role);

    res.json({ message: "Role assigned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
