import { DataTypes, Model } from "sequelize";

class Category extends Model {
  static initModel(sequelize) {
    Category.init(
      {
        categoryId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        parentCategoryId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "categories",
            key: "categoryId",
          },
        },
      },
      {
        sequelize,
        modelName: "Category",
        tableName: "categories",
        timestamps: false,
      },
    );

    return Category;
  }

  static associate(models) {
    Category.belongsTo(models.Category, {
      foreignKey: "parentCategoryId",
      as: "parentCategory",
    });
    Category.hasMany(models.Category, {
      foreignKey: "parentCategoryId",
      as: "children",
    });
    Category.hasMany(models.VoucherProduct, {
      foreignKey: "categoryId",
      as: "voucherProducts",
    });
  }
}

export default Category;
