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
        partnerProfileId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "partner_profiles",
            key: "partnerProfileId",
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
        validDurationDays: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        minLimit: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
        maxLimit: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
          },
        },
        imageUrl: {
          type: DataTypes.TEXT,
          allowNull: true,
          validate: {
            isUrlOrEmpty(value) {
              if (value && !/^https?:\/\//i.test(value)) {
                throw new Error("imageUrl must be a valid URL");
              }
            },
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
        validate: {
          maxLimitAtLeastMinLimit() {
            if (this.maxLimit !== null && this.maxLimit < this.minLimit) {
              throw new Error("maxLimit must be greater than or equal to minLimit");
            }
          },
        },
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
      foreignKey: "partnerProfileId",
      as: "partner",
    });
    VoucherProduct.belongsToMany(models.BranchProfile, {
      through: models.BranchVoucherProduct,
      foreignKey: "voucherProductId",
      otherKey: "branchProfileId",
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
    VoucherProduct.hasMany(models.Review, {
      foreignKey: "voucherProductId",
      as: "reviews",
    });
  }
}

export default VoucherProduct;
