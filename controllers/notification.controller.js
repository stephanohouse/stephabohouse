const { NotificationRule, Role } = require("../models");

exports.createRule = async (req, res) => {
  const { event, roleName } = req.body;

  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) return res.status(404).json({ message: "Role not found" });

  await NotificationRule.create({
    event,
    RoleId: role.id,
  });

  res.json({ message: "Notification rule created" });
};

exports.getRules = async (req, res) => {
  const rules = await NotificationRule.findAll({
    include: [{ model: Role }]
  });
  res.json(rules);
};

exports.deleteRule = async (req, res) => {
  const rule = await NotificationRule.findByPk(req.params.id);
  if (!rule) return res.status(404).json({ message: "Rule not found" });

  await rule.destroy();
  res.json({ message: "Rule deleted" });
};



