import { DataTypes, Model } from "sequelize";

class Payment extends Model {
  static initModel(sequelize) {
    Payment.init(
      {
        paymentId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        transactionId: {
          type: DataTypes.TEXT,
          allowNull: false,
          unique: true,
        },
        orderId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "orders",
            key: "orderId",
          },
        },
        paymentMethod: {
          type: DataTypes.ENUM("bank_transfer", "card"),
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        currency: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "VND",
        },
        status: {
          type: DataTypes.ENUM("success", "failed"),
          allowNull: false,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        refundedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Payment",
        tableName: "payments",
        timestamps: true,
      },
    );

    return Payment;
  }

  static associate(models) {
    Payment.belongsTo(models.Order, {
      foreignKey: "orderId",
      as: "order",
    });
  }
}

export default Payment;
