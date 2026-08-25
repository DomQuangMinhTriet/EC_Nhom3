import { randomBytes } from "node:crypto";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/client";
import {
  branchVoucherProduct,
  cart,
  cartItem,
  customerProfile,
  order,
  orderItem,
  payment,
  user,
  voucherCode,
  voucherProduct,
} from "../../db/schema";
import { getAvailableStock } from "../../shared/inventory/inventory.repository";

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

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

type LockedStockAllocation = {
  branchProfileId: string;
  voucherProductId: string;
  totalQuantity: number;
  soldQuantity: number;
};

export class StockReservationError extends Error {
  constructor(public readonly availableStock: number) {
    super(`Not enough stock available. Available: ${availableStock}`);
  }
}

export class DuplicateTransactionError extends Error {
  constructor() {
    super("transactionId already exists for another order");
  }
}

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
    return await getAvailableStock(voucherProductId);
  }

  async createOrderFromCart(data: CreateOrderRecord) {
    return await db.transaction(async (tx) => {
      for (const item of this.sortItemsByProduct(data.items)) {
        await this.reserveStock(
          tx,
          item.voucherProductId,
          item.quantity,
        );
      }

      const [createdOrder] = await tx
        .insert(order)
        .values({
          customerProfileId: data.customerProfileId,
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

      await tx.delete(cartItem).where(eq(cartItem.cartId, data.cartId));

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
      this.selectOrderItems(eq(orderItem.orderId, orderId)),
      db.select().from(payment).where(eq(payment.orderId, orderId)),
    ]);

    return {
      ...orderRecord,
      items,
      payments,
    };
  }

  async getOrderDetailForAdmin(orderId: string) {
    const [orderRecord] = await db
      .select({
        orderId: order.orderId,
        customerProfileId: order.customerProfileId,
        totalAmount: order.totalAmount,
        status: order.status,
        reason: order.reason,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: {
          fullName: customerProfile.fullName,
          email: user.email,
        },
      })
      .from(order)
      .innerJoin(
        customerProfile,
        eq(order.customerProfileId, customerProfile.customerProfileId),
      )
      .innerJoin(user, eq(customerProfile.userId, user.userId))
      .where(eq(order.orderId, orderId))
      .limit(1);

    if (!orderRecord) {
      return null;
    }

    const [items, payments] = await Promise.all([
      this.selectOrderItems(eq(orderItem.orderId, orderId)),
      db.select().from(payment).where(eq(payment.orderId, orderId)),
    ]);

    return {
      ...orderRecord,
      items,
      payments,
    };
  }

  async findOrdersByCustomer(
    customerProfileId: string,
    { page, limit, status }: { page: number; limit: number; status?: OrderStatus },
  ) {
    const offset = (page - 1) * limit;
    const filters = and(
      eq(order.customerProfileId, customerProfileId),
      status ? eq(order.status, status) : undefined,
    );

    const [orders, totals] = await Promise.all([
      db
        .select()
        .from(order)
        .where(filters)
        .orderBy(desc(order.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(order).where(filters),
    ]);

    return await this.attachItemsAndPayments(orders, totals[0]?.total ?? 0);
  }

  async findOrdersForAdmin({
    page,
    limit,
    status,
    from,
    to,
    customerProfileId,
  }: {
    page: number;
    limit: number;
    status?: OrderStatus;
    from?: Date;
    to?: Date;
    customerProfileId?: string;
  }) {
    const offset = (page - 1) * limit;
    const filters = and(
      status ? eq(order.status, status) : undefined,
      customerProfileId ? eq(order.customerProfileId, customerProfileId) : undefined,
      from ? gte(order.createdAt, from) : undefined,
      to ? lte(order.createdAt, to) : undefined,
    );

    const [orders, totals] = await Promise.all([
      db
        .select({
          orderId: order.orderId,
          customerProfileId: order.customerProfileId,
          totalAmount: order.totalAmount,
          status: order.status,
          reason: order.reason,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customer: {
            fullName: customerProfile.fullName,
            email: user.email,
          },
        })
        .from(order)
        .innerJoin(
          customerProfile,
          eq(order.customerProfileId, customerProfile.customerProfileId),
        )
        .innerJoin(user, eq(customerProfile.userId, user.userId))
        .where(filters)
        .orderBy(desc(order.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(order).where(filters),
    ]);

    return await this.attachItemsAndPayments(orders, totals[0]?.total ?? 0);
  }

  private async attachItemsAndPayments<T extends { orderId: string }>(
    orders: T[],
    total: number,
  ) {
    if (orders.length === 0) {
      return { orders: [], total };
    }

    const orderIds = orders.map((orderRecord) => orderRecord.orderId);

    const [items, payments] = await Promise.all([
      this.selectOrderItems(inArray(orderItem.orderId, orderIds)),
      db.select().from(payment).where(inArray(payment.orderId, orderIds)),
    ]);

    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    const paymentsByOrder = new Map<string, typeof payments>();
    for (const paymentRecord of payments) {
      const list = paymentsByOrder.get(paymentRecord.orderId) ?? [];
      list.push(paymentRecord);
      paymentsByOrder.set(paymentRecord.orderId, list);
    }

    return {
      orders: orders.map((orderRecord) => ({
        ...orderRecord,
        items: itemsByOrder.get(orderRecord.orderId) ?? [],
        payments: paymentsByOrder.get(orderRecord.orderId) ?? [],
      })),
      total,
    };
  }

  private selectOrderItems(where: SQL) {
    return db
      .select({
        orderItemId: orderItem.orderItemId,
        orderId: orderItem.orderId,
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
      .where(where);
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
        .limit(1)
        .for("update");

      if (!existingOrder) {
        return null;
      }

      let shouldInsertPayment = Boolean(data.payment);
      if (data.payment) {
        const [existingPayment] = await tx
          .select()
          .from(payment)
          .where(eq(payment.transactionId, data.payment.transactionId))
          .limit(1)
          .for("update");

        if (existingPayment) {
          if (existingPayment.orderId !== data.orderId) {
            throw new DuplicateTransactionError();
          }

          shouldInsertPayment = false;
        }
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
                .onConflictDoNothing({ target: voucherCode.code })
                .returning({ voucherCodeId: voucherCode.voucherCodeId });

              if (createdVoucherCode) {
                createdVoucherCodeId =
                  createdVoucherCode.voucherCodeId;
                break;
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

      if (data.status === "failed" && existingOrder.status === "pending_payment") {
        await this.releaseStockForOrder(tx, data.orderId);
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

      if (data.payment && shouldInsertPayment) {
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

  private sortItemsByProduct(items: CreateOrderItemRecord[]) {
    return [...items].sort((left, right) =>
      left.voucherProductId.localeCompare(right.voucherProductId),
    );
  }

  private async lockStockAllocations(
    tx: TransactionClient,
    voucherProductId: string,
  ): Promise<LockedStockAllocation[]> {
    return await tx
      .select({
        branchProfileId: branchVoucherProduct.branchProfileId,
        voucherProductId: branchVoucherProduct.voucherProductId,
        totalQuantity: branchVoucherProduct.totalQuantity,
        soldQuantity: branchVoucherProduct.soldQuantity,
      })
      .from(branchVoucherProduct)
      .where(eq(branchVoucherProduct.voucherProductId, voucherProductId))
      .orderBy(asc(branchVoucherProduct.branchProfileId))
      .for("update");
  }

  private async reserveStock(
    tx: TransactionClient,
    voucherProductId: string,
    quantity: number,
  ) {
    const allocations = await this.lockStockAllocations(tx, voucherProductId);
    const availableStock = allocations.reduce(
      (sum, allocation) =>
        sum + Math.max(0, allocation.totalQuantity - allocation.soldQuantity),
      0,
    );

    if (quantity > availableStock) {
      throw new StockReservationError(availableStock);
    }

    let remainingQuantity = quantity;

    for (const allocation of allocations) {
      if (remainingQuantity <= 0) break;

      const availableInAllocation = Math.max(
        0,
        allocation.totalQuantity - allocation.soldQuantity,
      );
      const quantityToReserve = Math.min(
        remainingQuantity,
        availableInAllocation,
      );

      if (quantityToReserve <= 0) continue;

      await tx
        .update(branchVoucherProduct)
        .set({
          soldQuantity: sql`${branchVoucherProduct.soldQuantity} + ${quantityToReserve}`,
        })
        .where(
          and(
            eq(branchVoucherProduct.branchProfileId, allocation.branchProfileId),
            eq(branchVoucherProduct.voucherProductId, voucherProductId),
          ),
        );

      remainingQuantity -= quantityToReserve;
    }
  }

  private async releaseStockForOrder(tx: TransactionClient, orderId: string) {
    const items = await tx
      .select({
        voucherProductId: orderItem.voucherProductId,
        quantity: orderItem.quantity,
      })
      .from(orderItem)
      .where(eq(orderItem.orderId, orderId));

    const quantityByProduct = new Map<string, number>();
    for (const item of items) {
      quantityByProduct.set(
        item.voucherProductId,
        (quantityByProduct.get(item.voucherProductId) ?? 0) + item.quantity,
      );
    }

    for (const [voucherProductId, quantity] of [...quantityByProduct.entries()].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      await this.releaseStock(tx, voucherProductId, quantity);
    }
  }

  private async releaseStock(
    tx: TransactionClient,
    voucherProductId: string,
    quantity: number,
  ) {
    const allocations = await this.lockStockAllocations(tx, voucherProductId);
    let remainingQuantity = quantity;

    for (const allocation of allocations) {
      if (remainingQuantity <= 0) break;

      const quantityToRelease = Math.min(
        remainingQuantity,
        allocation.soldQuantity,
      );

      if (quantityToRelease <= 0) continue;

      await tx
        .update(branchVoucherProduct)
        .set({
          soldQuantity: sql`${branchVoucherProduct.soldQuantity} - ${quantityToRelease}`,
        })
        .where(
          and(
            eq(branchVoucherProduct.branchProfileId, allocation.branchProfileId),
            eq(branchVoucherProduct.voucherProductId, voucherProductId),
          ),
        );

      remainingQuantity -= quantityToRelease;
    }
  }
}
