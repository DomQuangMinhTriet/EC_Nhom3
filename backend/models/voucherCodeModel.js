import { DataTypes, Model } from "sequelize";

class VoucherCode extends Model {
  static initModel(sequelize) {
    VoucherCode.init(
      {
        voucherCodeId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        voucherProductId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "voucher_products",
            key: "voucherProductId",
          },
        },
        customerProfileId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "customer_profiles",
            key: "customerProfileId",
          },
        },
        voucherCode: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          allowNull: false,
          unique: true,
        },
        qr: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        expiredAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("used", "expired", "cancelled", "available"),
          allowNull: false,
          defaultValue: "available",
        },
        usedAtBranch: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "branch_profiles",
            key: "branchProfileCode",
          },
        },
      },
      {
        sequelize,
        modelName: "VoucherCode",
        tableName: "voucher_codes",
        timestamps: true,
      },
    );

    return VoucherCode;
  }

  static associate(models) {
    VoucherCode.belongsTo(models.VoucherProduct, {
      foreignKey: "voucherProductId",
      as: "voucherProduct",
    });
    VoucherCode.belongsTo(models.CustomerProfile, {
      foreignKey: "customerProfileId",
      as: "customer",
    });
    VoucherCode.belongsTo(models.BranchProfile, {
      foreignKey: "usedAtBranch",
      as: "usedBranch",
    });
  }
}

export default VoucherCode;
