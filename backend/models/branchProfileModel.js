import { DataTypes, Model } from "sequelize";

class BranchProfile extends Model {
  static initModel(sequelize) {
    BranchProfile.init(
      {
        branchProfileId: {
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
        partnerProfileId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "partner_profiles",
            key: "partnerProfileId",
          },
        },
        branchProfileCode: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
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
    BranchProfile.belongsTo(models.Profile, {
      foreignKey: "userId",
      targetKey: "userId",
      as: "profile",
    });
    BranchProfile.belongsTo(models.PartnerProfile, {
      foreignKey: "partnerProfileId",
      as: "partner",
    });
    BranchProfile.belongsToMany(models.VoucherProduct, {
      through: models.BranchVoucherProduct,
      foreignKey: "branchProfileId",
      otherKey: "voucherProductId",
      as: "voucherProducts",
    });
  }
}

export default BranchProfile;
