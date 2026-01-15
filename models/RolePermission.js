module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {},
    {
      tableName: "role_permissions",
      timestamps: false,
    }
  );

  return RolePermission;
};
