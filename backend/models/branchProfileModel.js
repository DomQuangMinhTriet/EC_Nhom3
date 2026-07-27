import { DataTypes, Model } from "sequelize";

class BranchProfile extends Model {
  static initModel(sequelize) {
    BranchProfile.init(
      {
        branchProfileCode: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        partnerCode: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "partner_profiles",
            key: "partnerCode",
          },
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: "users",
            key: "userId",
          },
        },
        branchName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        phone: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        email: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        status: {
          type: DataTypes.ENUM(
            "pending",
            "active",
            "suspended",
            "closed",
            "rejected",
          ),
          allowNull: false,
          defaultValue: "pending",
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
      },
      {
        sequelize,
        modelName: "BranchProfile",
        tableName: "branch_profiles",
        timestamps: true,
      },
    );

    return BranchProfile;
  }

  static associate(models) {
    BranchProfile.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    BranchProfile.belongsTo(models.PartnerProfile, {
      foreignKey: "partnerCode",
      as: "partner",
    });
    BranchProfile.belongsToMany(models.VoucherProduct, {
      through: models.BranchVoucherProduct,
      foreignKey: "branchId",
      otherKey: "voucherProductId",
      as: "voucherProducts",
    });
    BranchProfile.hasMany(models.VoucherCode, {
      foreignKey: "usedAtBranch",
      as: "usedVoucherCodes",
    });
  }
}

export default BranchProfile;
