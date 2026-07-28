import { DataTypes, Model } from "sequelize";

class CartItem extends Model {
  static initModel(sequelize) {
    CartItem.init(
      {
        cartId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: "carts",
            key: "cartId",
          },
        },
        cartItemId: {
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
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: {
            min: 1,
          },
        },
        unitPrice: {
          type: DataTypes.DECIMAL(9, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
      },
      {
        sequelize,
        modelName: "CartItem",
        tableName: "cart_items",
        timestamps: true,
        indexes: [
          {
            unique: true,
            fields: ["cartId", "voucherProductId"],
          },
        ],
      },
    );

    return CartItem;
  }

  static associate(models) {
    CartItem.belongsTo(models.Cart, {
      foreignKey: "cartId",
      as: "cart",
    });
    CartItem.belongsTo(models.VoucherProduct, {
      foreignKey: "voucherProductId",
      as: "voucherProduct",
    });
  }
}

export default CartItem;
