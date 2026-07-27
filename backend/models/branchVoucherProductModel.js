import { DataTypes, Model } from "sequelize";

class BranchVoucherProduct extends Model {
  static initModel(sequelize) {
    BranchVoucherProduct.init(
      {
        branchProfileId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: "branch_profiles",
            key: "branchProfileId",
          },
        },
        voucherProductId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: "voucher_products",
            key: "voucherProductId",
          },
        },
        totalQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        soldQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
      },
      {
        sequelize,
        modelName: "BranchVoucherProduct",
        tableName: "branch_voucher_products",
        timestamps: false,
        validate: {
          soldQuantityWithinTotalQuantity() {
            if (this.soldQuantity > this.totalQuantity) {
              throw new Error("soldQuantity must be less than or equal to totalQuantity");
            }
          },
        },
      },
    );

    return BranchVoucherProduct;
  }
}

export default BranchVoucherProduct;
