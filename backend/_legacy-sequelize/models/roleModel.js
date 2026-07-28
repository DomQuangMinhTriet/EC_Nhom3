import { DataTypes, Model } from "sequelize";

class Role extends Model {
  static initModel(sequelize) {
    Role.init(
      {
        roleId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        roleCode: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
          validate: {
            isIn: [
              [
                "Super_Admin",
                "Operational_Admin",
                "Customer",
                "Partner",
                "Branch",
              ],
            ],
          },
        },
        roleDescription: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
      },
      {
        sequelize,
        modelName: "Role",
        tableName: "roles",
        timestamps: false,
      },
    );

    return Role;
  }

  static associate(models) {
    Role.hasMany(models.User, {
      foreignKey: "roleCode",
      sourceKey: "roleCode",
      as: "users",
    });
  }
}

export default Role;
