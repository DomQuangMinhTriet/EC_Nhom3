import { DataTypes, Model } from "sequelize";

class Order extends Model {
  static initModel(sequelize) {
    Order.init(
      {
        orderId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        cartId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: "carts",
            key: "cartId",
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
        subtotalAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        discountAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        totalAmount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        status: {
          type: DataTypes.ENUM("pending_payment", "completed", "failed"),
          allowNull: false,
          defaultValue: "pending_payment",
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Order",
        tableName: "orders",
        timestamps: true,
        validate: {
          totalAmountWithinSubtotalAmount() {
            if (Number(this.totalAmount) > Number(this.subtotalAmount)) {
              throw new Error("totalAmount must be less than or equal to subtotalAmount");
            }
          },
        },
      },
    );

    return Order;
  }

  static associate(models) {
    Order.belongsTo(models.Cart, {
      foreignKey: "cartId",
      as: "cart",
    });
    Order.belongsTo(models.CustomerProfile, {
      foreignKey: "customerProfileId",
      as: "customer",
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: "orderId",
      as: "items",
    });
    Order.hasMany(models.Payment, {
      foreignKey: "orderId",
      as: "payments",
    });
  }
}

export default Order;
