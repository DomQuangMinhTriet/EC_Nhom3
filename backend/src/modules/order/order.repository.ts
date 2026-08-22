import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql, sum } from "drizzle-orm";
import { db } from "../../db/client";
import {
  branchVoucherProduct,
  cart,
  cartItem,
  customerProfile,
  order,
  orderItem,
  payment,
  voucherCode,
  voucherProduct,
} from "../../db/schema";

export type OrderStatus = "pending_payment" | "completed" | "failed";
export type PaymentMethod = "bank_transfer" | "card";

export type CreateOrderItemRecord = {
  voucherProductId: string;
  quantity: number;
  unitPrice: string;
};

export type CreateOrderRecord = {
  cartId: string;
  customerProfileId: string;
  subtotalAmount: string;
  discountAmount: string;
  totalAmount: string;
  items: CreateOrderItemRecord[];
};

export type CreatePaymentRecord = {
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: string;
  currency: string;
  status: "success" | "failed";
  reason?: string | null;
};

export type UpdateOrderRecord = {
  orderId: string;
  customerProfileId: string;
  status: OrderStatus;
  reason?: string | null;
  payment?: CreatePaymentRecord;
};

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "23505";

const generateVoucherCode = () => randomBytes(18).toString("base64url");

const calculateExpiredAt = (
  validDurationDays: number,
  productEndDate: Date,
) => {
  if (validDurationDays <= 0) {
    return productEndDate;
  }

  const durationExpiredAt = new Date(
    Date.now() + validDurationDays * 24 * 60 * 60 * 1000,
  );

  return durationExpiredAt < productEndDate
    ? durationExpiredAt
    : productEndDate;
};

export class OrderRepository {
  async getCustomerProfileIdByUserId(userId: string): Promise<string | null> {
    const result = await db.query.customerProfile.findFirst({
      where: eq(customerProfile.userId, userId),
      columns: { customerProfileId: true },
    });

    return result?.customerProfileId ?? null;
  }

  async findCartByIdAndCustomer(cartId: string, customerProfileId: string) {
    const result = await db.query.cart.findFirst({
      where: and(
        eq(cart.cartId, cartId),
        eq(cart.customerProfileId, customerProfileId),
      ),
    });

    return result ?? null;
  }

  async findOrderByCartId(cartId: string) {
    const result = await db.query.order.findFirst({
      where: eq(order.cartId, cartId),
    });

    return result ?? null;
  }

  async getCartItemsWithProducts(cartId: string) {
    return await db
      .select({
        cartItemId: cartItem.cartItemId,
        voucherProductId: cartItem.voucherProductId,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        voucherProduct: {
          voucherProductId: voucherProduct.voucherProductId,
          title: voucherProduct.title,
          originalPrice: voucherProduct.originalPrice,
          discountType: voucherProduct.discountType,
          discountValue: voucherProduct.discountValue,
          validDurationDays: voucherProduct.validDurationDays,
          endDate: voucherProduct.endDate,
          status: voucherProduct.status,
        },
      })
      .from(cartItem)
      .innerJoin(
        voucherProduct,
        eq(cartItem.voucherProductId, voucherProduct.voucherProductId),
      )
      .where(eq(cartItem.cartId, cartId));
  }

  async getAvailableStock(voucherProductId: string): Promise<number> {
    const result = await db
      .select({
        totalStock: sum(branchVoucherProduct.totalQuantity),
        totalSold: sum(branchVoucherProduct.soldQuantity),
      })
      .from(branchVoucherProduct)
      .where(eq(branchVoucherProduct.voucherProductId, voucherProductId));

    if (!result || result.length === 0) return 0;

    const totalStock = parseInt((result[0]?.totalStock as string) ?? "0", 10);
    const totalSold = parseInt((result[0]?.totalSold as string) ?? "0", 10);

    return Math.max(0, totalStock - totalSold);
  }

  async createOrderFromCart(data: CreateOrderRecord) {
    return await db.transaction(async (tx) => {
      const [createdOrder] = await tx
        .insert(order)
        .values({
          cartId: data.cartId,
          customerProfileId: data.customerProfileId,
          subtotalAmount: data.subtotalAmount,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          status: "pending_payment",
        })
        .returning();

      if (!createdOrder) {
        return null;
      }

      await tx.insert(orderItem).values(
        data.items.map((item) => ({
          orderId: createdOrder.orderId,
          voucherProductId: item.voucherProductId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );

      return createdOrder;
    });
  }

  async findOrderByIdAndCustomer(orderId: string, customerProfileId: string) {
    const result = await db.query.order.findFirst({
      where: and(
        eq(order.orderId, orderId),
        eq(order.customerProfileId, customerProfileId),
      ),
    });

    return result ?? null;
  }

  async findOrderById(orderId: string) {
    const result = await db.query.order.findFirst({
      where: eq(order.orderId, orderId),
    });

    return result ?? null;
  }

  async getOrderDetail(orderId: string, customerProfileId: string) {
    const orderRecord = await this.findOrderByIdAndCustomer(
      orderId,
      customerProfileId,
    );

    if (!orderRecord) {
      return null;
    }

    const [items, payments] = await Promise.all([
      db
        .select({
          orderItemId: orderItem.orderItemId,
          voucherProductId: orderItem.voucherProductId,
          voucherCodeId: orderItem.voucherCodeId,
          quantity: orderItem.quantity,
          unitPrice: orderItem.unitPrice,
          createdAt: orderItem.createdAt,
          updatedAt: orderItem.updatedAt,
          voucherProduct: {
            voucherProductId: voucherProduct.voucherProductId,
            title: voucherProduct.title,
            imageUrl: voucherProduct.imageUrl,
            originalPrice: voucherProduct.originalPrice,
            discountType: voucherProduct.discountType,
            discountValue: voucherProduct.discountValue,
          },
          voucherCode: {
            voucherCodeId: voucherCode.voucherCodeId,
            code: voucherCode.code,
            status: voucherCode.status,
            expiredAt: voucherCode.expiredAt,
          },
        })
        .from(orderItem)
        .innerJoin(
          voucherProduct,
          eq(orderItem.voucherProductId, voucherProduct.voucherProductId),
        )
        .leftJoin(
          voucherCode,
          eq(orderItem.voucherCodeId, voucherCode.voucherCodeId),
        )
        .where(eq(orderItem.orderId, orderId)),
      db.select().from(payment).where(eq(payment.orderId, orderId)),
    ]);

    return {
      ...orderRecord,
      items,
      payments,
    };
  }

  async updateOrder(data: UpdateOrderRecord) {
    return await db.transaction(async (tx) => {
      const [existingOrder] = await tx
        .select()
        .from(order)
        .where(
          and(
            eq(order.orderId, data.orderId),
            eq(order.customerProfileId, data.customerProfileId),
          ),
        )
        .limit(1);

      if (!existingOrder) {
        return null;
      }

      if (data.status === "completed" && existingOrder.status !== "completed") {
        const itemsMissingCodes = await tx
          .select({
            orderItemId: orderItem.orderItemId,
            voucherProductId: orderItem.voucherProductId,
            quantity: orderItem.quantity,
            validDurationDays: voucherProduct.validDurationDays,
            endDate: voucherProduct.endDate,
          })
          .from(orderItem)
          .innerJoin(
            voucherProduct,
            eq(orderItem.voucherProductId, voucherProduct.voucherProductId),
          )
          .where(
            and(
              eq(orderItem.orderId, data.orderId),
              isNull(orderItem.voucherCodeId),
            ),
          );

        for (const item of itemsMissingCodes) {
          let firstCreatedVoucherCodeId: string | null = null;

          for (let index = 0; index < item.quantity; index += 1) {
            let createdVoucherCodeId: string | null = null;

            for (let attempt = 0; attempt < 5; attempt += 1) {
              const code = generateVoucherCode();

              try {
                const [createdVoucherCode] = await tx
                  .insert(voucherCode)
                  .values({
                    voucherProductId: item.voucherProductId,
                  customerProfileId: data.customerProfileId,
                  code,
                  expiredAt: calculateExpiredAt(
                    item.validDurationDays,
                    item.endDate,
                    ),
                    status: "available",
                  })
                  .returning({ voucherCodeId: voucherCode.voucherCodeId });

                createdVoucherCodeId =
                  createdVoucherCode?.voucherCodeId ?? null;
                break;
              } catch (error) {
                if (!isUniqueViolation(error) || attempt === 4) {
                  throw error;
                }
              }
            }

            if (!createdVoucherCodeId) {
              throw new Error("Could not generate a unique voucher code");
            }

            firstCreatedVoucherCodeId ??= createdVoucherCodeId;
          }

          await tx
            .update(orderItem)
            .set({
              voucherCodeId: firstCreatedVoucherCodeId,
              updatedAt: sql`now()`,
            })
            .where(
              and(
                eq(orderItem.orderId, data.orderId),
                eq(orderItem.orderItemId, item.orderItemId),
              ),
            );
        }
      }

      const [updatedOrder] = await tx
        .update(order)
        .set({
          status: data.status,
          reason: data.reason,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(order.orderId, data.orderId),
            eq(order.customerProfileId, data.customerProfileId),
          ),
        )
        .returning();

      if (data.payment) {
        await tx.insert(payment).values({
          transactionId: data.payment.transactionId,
          orderId: data.orderId,
          paymentMethod: data.payment.paymentMethod,
          amount: data.payment.amount,
          currency: data.payment.currency,
          status: data.payment.status,
          reason: data.payment.reason,
        });
      }

      return updatedOrder ?? null;
    });
  }
}
