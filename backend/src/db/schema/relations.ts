import { relations } from "drizzle-orm";
import {
  branchProfile,
  customerProfile,
  partnerProfile,
  profile,
  role,
  user,
} from "./account";
import { branchVoucherProduct, category, voucherCode, voucherProduct } from "./product";
import { cart, cartItem, order, orderItem, payment, review } from "./transaction";
import { notification } from "./notification";

export const roleRelations = relations(role, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one }) => ({
  role: one(role, { fields: [user.roleCode], references: [role.roleCode] }),
  profile: one(profile, { fields: [user.userId], references: [profile.userId] }),
}));

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.userId], references: [user.userId] }),
  customerProfile: one(customerProfile, {
    fields: [profile.userId],
    references: [customerProfile.userId],
  }),
  partnerProfile: one(partnerProfile, {
    fields: [profile.userId],
    references: [partnerProfile.userId],
  }),
  branchProfile: one(branchProfile, {
    fields: [profile.userId],
    references: [branchProfile.userId],
  }),
}));

export const customerProfileRelations = relations(customerProfile, ({ many }) => ({
  carts: many(cart),
  voucherCodes: many(voucherCode),
  reviews: many(review),
  notifications: many(notification),
}));

export const partnerProfileRelations = relations(partnerProfile, ({ many }) => ({
  branches: many(branchProfile),
  voucherProducts: many(voucherProduct),
}));

export const branchProfileRelations = relations(branchProfile, ({ one, many }) => ({
  partner: one(partnerProfile, {
    fields: [branchProfile.partnerProfileId],
    references: [partnerProfile.partnerProfileId],
  }),
  branchVoucherProducts: many(branchVoucherProduct),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  parent: one(category, { fields: [category.parentCategoryId], references: [category.categoryId] }),
  voucherProducts: many(voucherProduct),
}));

export const voucherProductRelations = relations(voucherProduct, ({ one, many }) => ({
  category: one(category, { fields: [voucherProduct.categoryId], references: [category.categoryId] }),
  partner: one(partnerProfile, {
    fields: [voucherProduct.partnerProfileId],
    references: [partnerProfile.partnerProfileId],
  }),
  branchVoucherProducts: many(branchVoucherProduct),
  voucherCodes: many(voucherCode),
  cartItems: many(cartItem),
  reviews: many(review),
}));

export const branchVoucherProductRelations = relations(branchVoucherProduct, ({ one }) => ({
  branch: one(branchProfile, {
    fields: [branchVoucherProduct.branchProfileId],
    references: [branchProfile.branchProfileId],
  }),
  voucherProduct: one(voucherProduct, {
    fields: [branchVoucherProduct.voucherProductId],
    references: [voucherProduct.voucherProductId],
  }),
}));

export const voucherCodeRelations = relations(voucherCode, ({ one, many }) => ({
  voucherProduct: one(voucherProduct, {
    fields: [voucherCode.voucherProductId],
    references: [voucherProduct.voucherProductId],
  }),
  customer: one(customerProfile, {
    fields: [voucherCode.customerProfileId],
    references: [customerProfile.customerProfileId],
  }),
  orderItems: many(orderItem),
}));

export const cartRelations = relations(cart, ({ one, many }) => ({
  customer: one(customerProfile, {
    fields: [cart.customerProfileId],
    references: [customerProfile.customerProfileId],
  }),
  items: many(cartItem),
  order: one(order, { fields: [cart.cartId], references: [order.cartId] }),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.cartId] }),
  voucherProduct: one(voucherProduct, {
    fields: [cartItem.voucherProductId],
    references: [voucherProduct.voucherProductId],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  cart: one(cart, { fields: [order.cartId], references: [cart.cartId] }),
  customer: one(customerProfile, {
    fields: [order.customerProfileId],
    references: [customerProfile.customerProfileId],
  }),
  items: many(orderItem),
  payments: many(payment),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.orderId] }),
  voucherCode: one(voucherCode, {
    fields: [orderItem.voucherCodeId],
    references: [voucherCode.voucherCodeId],
  }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  order: one(order, { fields: [payment.orderId], references: [order.orderId] }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  customer: one(customerProfile, {
    fields: [review.customerProfileId],
    references: [customerProfile.customerProfileId],
  }),
  voucherProduct: one(voucherProduct, {
    fields: [review.voucherProductId],
    references: [voucherProduct.voucherProductId],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  customer: one(customerProfile, {
    fields: [notification.customerProfileId],
    references: [customerProfile.customerProfileId],
  }),
}));
