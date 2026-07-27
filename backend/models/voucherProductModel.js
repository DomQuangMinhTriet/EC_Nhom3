import { DataTypes, Model } from "sequelize";

class VoucherProduct extends Model {
  static initModel(sequelize) {
    VoucherProduct.init(
      {
        voucherProductId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "categories",
            key: "categoryId",
          },
        },
        partnerCode: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "partner_profiles",
            key: "partnerCode",
          },
        },
        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        originalPrice: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        discountType: {
          type: DataTypes.ENUM("direct", "percentage"),
          allowNull: false,
        },
        discountValue: {
          type: DataTypes.DECIMAL(9, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        validDuration: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        status: {
          type: DataTypes.ENUM(
            "pending",
            "out_of_stock",
            "active",
            "inactive",
            "rejected",
            "expired",
          ),
          allowNull: false,
          defaultValue: "pending",
        },
        rejectionReason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "VoucherProduct",
        tableName: "voucher_products",
        timestamps: true,
      },
    );

    return VoucherProduct;
  }

  static associate(models) {
    VoucherProduct.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
    VoucherProduct.belongsTo(models.PartnerProfile, {
      foreignKey: "partnerCode",
      as: "partner",
    });
    VoucherProduct.belongsToMany(models.BranchProfile, {
      through: models.BranchVoucherProduct,
      foreignKey: "voucherProductId",
      otherKey: "branchId",
      as: "branches",
    });
    VoucherProduct.hasMany(models.VoucherCode, {
      foreignKey: "voucherProductId",
      as: "voucherCodes",
    });
    VoucherProduct.hasMany(models.CartItem, {
      foreignKey: "voucherProductId",
      as: "cartItems",
    });
    VoucherProduct.hasMany(models.OrderItem, {
      foreignKey: "voucherProductId",
      as: "orderItems",
    });
    VoucherProduct.hasMany(models.Review, {
      foreignKey: "voucherProductId",
      as: "reviews",
    });
  }
}

export default VoucherProduct;
