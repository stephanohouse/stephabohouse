const { Role } = require("../models");

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "EVENT_MANAGER",
  "TICKET_MANAGER",
  "APARTMENT_MANAGER",
  "RIDE_MANAGER",
  "CONSULTATION_MANAGER",
  "BOARD_MEMBER",
  "USER",
  "BLOG_EDITOR",
];

module.exports = async () => {
  for (const name of roles) {
    await Role.findOrCreate({ where: { name } });
  }
};
