import { DataTypes, Model } from "sequelize";

class CustomerProfile extends Model {
  static initModel(sequelize) {
    CustomerProfile.init(
      {
        customerProfileId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: "profiles",
            key: "userId",
          },
        },
        fullName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        phone: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        birthDate: {
          type: DataTypes.DATEONLY,
          allowNull: true,
          validate: {
            isDate: true,
          },
        },
        gender: {
          type: DataTypes.ENUM("Nam", "Nữ"),
          allowNull: true,
        },
        avatarUrl: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
          validate: {
            isUrlOrEmpty(value) {
              if (value && !/^https?:\/\//i.test(value)) {
                throw new Error("avatarUrl must be a valid URL");
              }
            },
          },
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
      },
      {
        sequelize,
        modelName: "CustomerProfile",
        tableName: "customer_profiles",
        timestamps: true,
      },
    );

    return CustomerProfile;
  }

  static associate(models) {
    CustomerProfile.belongsTo(models.Profile, {
      foreignKey: "userId",
      targetKey: "userId",
      as: "profile",
    });
    CustomerProfile.hasOne(models.Cart, {
      foreignKey: "customerProfileId",
      as: "cart",
    });
    CustomerProfile.hasMany(models.Order, {
      foreignKey: "customerProfileId",
      as: "orders",
    });
    CustomerProfile.hasMany(models.VoucherCode, {
      foreignKey: "customerProfileId",
      as: "voucherCodes",
    });
    CustomerProfile.hasMany(models.Review, {
      foreignKey: "customerProfileId",
      as: "reviews",
    });
    CustomerProfile.hasMany(models.Notification, {
      foreignKey: "customerProfileId",
      as: "notifications",
    });
  }
}

export default CustomerProfile;
