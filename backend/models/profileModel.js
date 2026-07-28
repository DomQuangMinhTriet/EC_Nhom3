import { DataTypes, Model } from "sequelize";

class Profile extends Model {
  static initModel(sequelize) {
    Profile.init(
      {
        profileId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: "users",
            key: "userId",
          },
        },
        type: {
          type: DataTypes.ENUM("customer", "partner", "branch"),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "Profile",
        tableName: "profiles",
        timestamps: true,
      },
    );

    return Profile;
  }

  static associate(models) {
    Profile.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Profile.hasOne(models.CustomerProfile, {
      foreignKey: "userId",
      sourceKey: "userId",
      as: "customerProfile",
    });
    Profile.hasOne(models.PartnerProfile, {
      foreignKey: "userId",
      sourceKey: "userId",
      as: "partnerProfile",
    });
    Profile.hasOne(models.BranchProfile, {
      foreignKey: "userId",
      sourceKey: "userId",
      as: "branchProfile",
    });
  }
}

export default Profile;
