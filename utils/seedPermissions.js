const { Permission } = require("../models");

const permissions = [
  // Users & Admin
  "manage_users",
  "manage_notifications",


  // Events & Tickets
  "create_event",
  "update_event",
  "post_ticket",
  "delete_event",
  "update_event",
  "verify_ticket",
  "view_analytics",


  // Apartments
  "post_apartment",
  "approve_booking",
  "update_apartment",
  "delete_apartment",

  // Rides
  "post_ride",
  "approve_ride",
  "put_ride",
  "delete_ride",

  // Inquiries
  "receive_inquiry",

  // View Dashboard.html2
  "view_basic_dashboard",

  // Blog Management
  "create_blog",
  "update_blog",
  "delete_blog",

  // KYC Management
  "approve_kyc",

];

module.exports = async () => {
  for (const name of permissions) {
    await Permission.findOrCreate({ where: { name } });
  }
};
