import { DataTypes, Model } from "sequelize";

class Cart extends Model {
  static initModel(sequelize) {
    Cart.init(
      {
        cartId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        customerProfileId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: "customer_profiles",
            key: "customerProfileId",
          },
        },
      },
      {
        sequelize,
        modelName: "Cart",
        tableName: "carts",
        timestamps: true,
      },
    );

    return Cart;
  }

  static associate(models) {
    Cart.belongsTo(models.CustomerProfile, {
      foreignKey: "customerProfileId",
      as: "customer",
    });
    Cart.hasMany(models.CartItem, {
      foreignKey: "cartId",
      as: "items",
    });
    Cart.hasOne(models.Order, {
      foreignKey: "cartId",
      as: "order",
    });
  }
}

export default Cart;
