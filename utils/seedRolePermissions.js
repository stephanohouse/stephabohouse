const { Role, Permission } = require("../models");

const rolePermissions = {
  SUPER_ADMIN: ["manage_users","approve_kyc", "manage_notifications","view_analytics", "create_event", "post_ticket", "verify_ticket", "post_apartment", "approve_booking", "post_ride", "approve_ride", "receive_inquiry", "put_ride", "delete_ride", "update_apartment", "delete_apartment", "update_event", "delete_event"],
  ADMIN: ["manage_users", "approve_kyc", "manage_notifications", "create_event", "post_ticket", "verify_ticket"],
  EVENT_MANAGER: ["create_event", "update_event", "view_analytics",  "post_ticket", "delete_event", "verify_ticket"],
  TICKET_MANAGER: ["post_ticket", "verify_ticket", "view_analytics"],
  APARTMENT_MANAGER: ["post_apartment", "approve_booking","update_apartment", "delete_apartment"],
  RIDE_MANAGER: ["post_ride", "approve_ride", "put_ride", "delete_ride"],
  CONSULTATION_MANAGER: ["receive_inquiry"],
  BOARD_MEMBER: ["view_basic_dashboard"],
  BLOG_EDITOR: ["create_blog", "update_blog", "delete_blog"],
  USER: [],
};

module.exports = async () => {
  for (const roleName in rolePermissions) {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) continue;

    const perms = await Permission.findAll({
      where: { name: rolePermissions[roleName] },
    });

    await role.setPermissions(perms);
  }
};
