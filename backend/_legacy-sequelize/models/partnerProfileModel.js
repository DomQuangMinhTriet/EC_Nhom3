import { DataTypes, Model } from "sequelize";

class PartnerProfile extends Model {
  static initModel(sequelize) {
    PartnerProfile.init(
      {
        partnerProfileId: {
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
        partnerProfileCode: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        partnerName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        taxCode: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        representativeName: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(
            "pending",
            "active",
            "suspended",
            "terminated",
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
        modelName: "PartnerProfile",
        tableName: "partner_profiles",
        timestamps: true,
      },
    );

    return PartnerProfile;
  }

  static associate(models) {
    PartnerProfile.belongsTo(models.Profile, {
      foreignKey: "userId",
      targetKey: "userId",
      as: "profile",
    });
    PartnerProfile.hasMany(models.BranchProfile, {
      foreignKey: "partnerProfileId",
      as: "branches",
    });
    PartnerProfile.hasMany(models.VoucherProduct, {
      foreignKey: "partnerProfileId",
      as: "voucherProducts",
    });
  }
}

export default PartnerProfile;
