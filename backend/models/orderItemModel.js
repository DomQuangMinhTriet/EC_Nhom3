import { DataTypes, Model } from "sequelize";

class OrderItem extends Model {
  static initModel(sequelize) {
    OrderItem.init(
      {
        orderId: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          references: {
            model: "orders",
            key: "orderId",
          },
        },
        orderItemId: {
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
        modelName: "OrderItem",
        tableName: "order_items",
        timestamps: true,
      },
    );

    return OrderItem;
  }

  static associate(models) {
    OrderItem.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });
    OrderItem.belongsTo(models.VoucherProduct, {
      foreignKey: "voucherProductId",
      as: "voucherProduct",
    });
  }
}

export default OrderItem;
