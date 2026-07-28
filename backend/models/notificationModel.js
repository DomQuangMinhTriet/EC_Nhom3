import { DataTypes, Model } from "sequelize";

class Notification extends Model {
  static initModel(sequelize) {
    Notification.init(
      {
        notificationId: {
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
        title: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: "",
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: "Notification",
        tableName: "notifications",
        timestamps: false,
      },
    );

    return Notification;
  }

  static associate(models) {
    Notification.belongsTo(models.CustomerProfile, {
      foreignKey: "customerProfileId",
      as: "customer",
    });
  }
}

export default Notification;
