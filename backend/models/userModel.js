import { DataTypes, Model } from "sequelize";

class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        userId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        email: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        passwordHash: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        roleCode: {
          type: DataTypes.TEXT,
          allowNull: false,
          references: {
            model: "roles",
            key: "roleCode",
          },
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
        status: {
          type: DataTypes.ENUM("banned", "pending", "active", "deactivated"),
          allowNull: false,
          defaultValue: "pending",
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        timestamps: true,
      },
    );

    return User;
  }

  static associate(models) {
    User.belongsTo(models.Role, {
      foreignKey: "roleCode",
      targetKey: "roleCode",
      as: "role",
    });
    User.hasOne(models.CustomerProfile, {
      foreignKey: "userId",
      as: "customerProfile",
    });
    User.hasOne(models.PartnerProfile, {
      foreignKey: "userId",
      as: "partnerProfile",
    });
    User.hasOne(models.BranchProfile, {
      foreignKey: "userId",
      as: "branchProfile",
    });
  }
}

export default User;
