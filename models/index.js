const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

// Import models
const User = require("./User")(sequelize, DataTypes);
const Role = require("./Role")(sequelize, DataTypes);
const Permission = require("./Permission")(sequelize, DataTypes);
const UserRole = require("./UserRole")(sequelize, DataTypes);
const RolePermission = require("./RolePermission")(sequelize, DataTypes);
const Event = require("./Event")(sequelize, DataTypes);
const TicketCategory = require("./TicketCategory")(sequelize, DataTypes);
const TicketPurchase = require("./TicketPurchase")(sequelize, DataTypes);
const TelegramAccount = require("./TelegramAccount")(sequelize, DataTypes);
const NotificationRule = require("./NotificationRule")(sequelize, DataTypes);
const NotificationLog = require("./NotificationLog")(sequelize, DataTypes);
const ChatRoom = require("./ChatRoom")(sequelize, DataTypes);
const ChatMessage = require("./ChatMessage")(sequelize, DataTypes);
const UserKyc = require("./UserKyc")(sequelize, DataTypes);
const Apartment = require("./Apartment")(sequelize, DataTypes);
const ApartmentImage = require("./ApartmentImage")(sequelize, DataTypes);
const ApartmentBooking = require("./ApartmentBooking")(sequelize, DataTypes);
const Ride = require("./Ride")(sequelize, DataTypes);
const RideBooking = require("./RideBooking")(sequelize, DataTypes);
const RideImage = require("./RideImage")(sequelize, DataTypes);
const BlogPost = require("./BlogPost")(sequelize, DataTypes);
const BlogSection = require("./BlogSection")(sequelize, DataTypes);
const BlogMedia = require("./BlogMedia")(sequelize, DataTypes);
const BlogComment = require("./BlogComment")(sequelize, DataTypes);
const BlogLike = require("./BlogLike")(sequelize, DataTypes);
const BlogShare = require("./BlogShare")(sequelize, DataTypes);
// Create models object
const models = {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Event,
  TicketCategory,
  TicketPurchase,
  Apartment,
  ApartmentImage,
  ApartmentBooking,
  Ride,
  RideBooking,
  RideImage,
  TelegramAccount,
  NotificationRule,
  NotificationLog,
  ChatRoom,
  ChatMessage,
  UserKyc,
  BlogPost,
  BlogSection,
  BlogMedia,
  BlogComment,
  BlogLike,
  BlogShare,
};

// Associations
User.belongsToMany(Role, { through: UserRole });
Role.belongsToMany(User, { through: UserRole });

Event.hasMany(TicketCategory);
TicketCategory.belongsTo(Event);

TicketCategory.hasMany(TicketPurchase);
TicketPurchase.belongsTo(TicketCategory);

Event.hasMany(TicketPurchase);
TicketPurchase.belongsTo(Event);

Role.belongsToMany(Permission, { through: RolePermission });
Permission.belongsToMany(Role, { through: RolePermission });

Apartment.hasMany(ApartmentImage, { onDelete: "CASCADE" });
ApartmentImage.belongsTo(Apartment);

Apartment.hasMany(ApartmentBooking, { onDelete: "CASCADE" });
ApartmentBooking.belongsTo(Apartment);

User.hasMany(ApartmentBooking);
ApartmentBooking.belongsTo(User);

Ride.hasMany(RideBooking, { onDelete: "CASCADE" });
RideBooking.belongsTo(Ride);

Ride.hasMany(RideImage, { onDelete: "CASCADE" });
RideImage.belongsTo(Ride);

User.hasMany(RideBooking);
RideBooking.belongsTo(User);

User.hasOne(TelegramAccount);
TelegramAccount.belongsTo(User);

Role.hasMany(NotificationRule);
NotificationRule.belongsTo(Role);

Role.hasMany(ChatRoom);
ChatRoom.belongsTo(Role);

ChatRoom.hasMany(ChatMessage);
ChatMessage.belongsTo(ChatRoom);

User.hasMany(ChatMessage);
ChatMessage.belongsTo(User);

User.hasOne(UserKyc, { onDelete: "CASCADE" });
UserKyc.belongsTo(User);

// Call associate for each model if defined
Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

// Export everything
module.exports = {
  ...models,
  sequelize,
  DataTypes,
};
