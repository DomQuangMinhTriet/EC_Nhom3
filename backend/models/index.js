import sequelize from "../config/database.js";
import BranchProfile from "./branchProfileModel.js";
import BranchVoucherProduct from "./branchVoucherProductModel.js";
import Cart from "./cartModel.js";
import CartItem from "./cartItemModel.js";
import Category from "./categoryModel.js";
import CustomerProfile from "./customerProfileModel.js";
import Order from "./orderModel.js";
import OrderItem from "./orderItemModel.js";
import PartnerProfile from "./partnerProfileModel.js";
import Payment from "./paymentModel.js";
import Review from "./reviewModel.js";
import Role from "./roleModel.js";
import TestUser from "./testModel.js";
import User from "./userModel.js";
import VoucherCode from "./voucherCodeModel.js";
import VoucherProduct from "./voucherProductModel.js";

Role.initModel(sequelize);
User.initModel(sequelize);
CustomerProfile.initModel(sequelize);
PartnerProfile.initModel(sequelize);
BranchProfile.initModel(sequelize);
Category.initModel(sequelize);
VoucherProduct.initModel(sequelize);
BranchVoucherProduct.initModel(sequelize);
VoucherCode.initModel(sequelize);
Cart.initModel(sequelize);
CartItem.initModel(sequelize);
Order.initModel(sequelize);
OrderItem.initModel(sequelize);
Payment.initModel(sequelize);
Review.initModel(sequelize);
TestUser.initModel(sequelize);

const db = {
  sequelize,
  BranchProfile,
  BranchVoucherProduct,
  Cart,
  CartItem,
  Category,
  CustomerProfile,
  Order,
  OrderItem,
  PartnerProfile,
  Payment,
  Review,
  Role,
  TestUser,
  User,
  VoucherCode,
  VoucherProduct,
};

Object.values(db).forEach((model) => {
  if (model?.associate) {
    model.associate(db);
  }
});

export default db;
