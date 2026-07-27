import { DataTypes, Model } from "sequelize";

class Review extends Model {
  static initModel(sequelize) {
    Review.init(
      {
        reviewId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        customerProfileId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "customer_profiles",
            key: "customerProfileId",
          },
        },
        voucherProductId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "voucher_products",
            key: "voucherProductId",
          },
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 10,
          },
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        status: {
          type: DataTypes.ENUM("active", "deleted", "hidden"),
          allowNull: false,
          defaultValue: "active",
        },
        isEdited: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        editedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "Review",
        tableName: "reviews",
        timestamps: true,
      },
    );

    return Review;
  }

  static associate(models) {
    Review.belongsTo(models.CustomerProfile, {
      foreignKey: "customerProfileId",
      as: "customer",
    });
    Review.belongsTo(models.VoucherProduct, {
      foreignKey: "voucherProductId",
      as: "voucherProduct",
    });
  }
}

export default Review;
