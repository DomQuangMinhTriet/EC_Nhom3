import { and, eq, sql, sum } from "drizzle-orm";
import { db } from "../../db/client";
import { branchVoucherProduct, cart, cartItem, customerProfile, voucherProduct } from "../../db/schema";

export class CartRepository {
    async getCustomerProfileIdByUserId(userId: string): Promise<string | null> {
        const result = await db.query.customerProfile.findFirst({
            where: eq(customerProfile.userId, userId),
            columns: { customerProfileId: true },
        });
        return result?.customerProfileId ?? null;
    }

    async getOrCreateCart(customerProfileId: string) {
        const existingCart = await db.query.cart.findFirst({
            where: eq(cart.customerProfileId, customerProfileId),
        });

        if (existingCart) return existingCart;

        const [newCart] = await db.insert(cart).values({ customerProfileId }).returning();
        return newCart!;
    }

    async getCartWithItems(customerProfileId: string) {
        const c = await this.getOrCreateCart(customerProfileId);

        const items = await db
            .select({
                cartItemId: cartItem.cartItemId,
                quantity: cartItem.quantity,
                unitPrice: cartItem.unitPrice,
                voucherProduct: {
                    voucherProductId: voucherProduct.voucherProductId,
                    title: voucherProduct.title,
                    imageUrl: voucherProduct.imageUrl,
                    originalPrice: voucherProduct.originalPrice,
                    discountType: voucherProduct.discountType,
                    discountValue: voucherProduct.discountValue,
                    status: voucherProduct.status,
                },
            })
            .from(cartItem)
            .innerJoin(voucherProduct, eq(cartItem.voucherProductId, voucherProduct.voucherProductId))
            .where(eq(cartItem.cartId, c.cartId));

        return {
            ...c,
            items,
        };
    }

    async getVoucherProduct(voucherProductId: string) {
        const result = await db.query.voucherProduct.findFirst({
            where: eq(voucherProduct.voucherProductId, voucherProductId),
        });
        return result ?? null;
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

        const totalStock = parseInt(result[0]?.totalStock as string ?? "0", 10);
        const totalSold = parseInt(result[0]?.totalSold as string ?? "0", 10);

        return Math.max(0, totalStock - totalSold);
    }

    async hasAnyAllocation(voucherProductId: string): Promise<boolean> {
        const result = await db
            .select({ branchProfileId: branchVoucherProduct.branchProfileId })
            .from(branchVoucherProduct)
            .where(eq(branchVoucherProduct.voucherProductId, voucherProductId))
            .limit(1);

        return result.length > 0;
    }


    async findCartItemByVoucherId(cartId: string, voucherProductId: string) {
        const result = await db.query.cartItem.findFirst({
            where: and(
                eq(cartItem.cartId, cartId),
                eq(cartItem.voucherProductId, voucherProductId)
            ),
        });
        return result ?? null;
    }

    async findCartItemById(cartId: string, cartItemId: string) {
        const result = await db.query.cartItem.findFirst({
            where: and(
                eq(cartItem.cartId, cartId),
                eq(cartItem.cartItemId, cartItemId)
            ),
        });
        return result ?? null;
    }

    async insertCartItem(cartId: string, voucherProductId: string, quantity: number, unitPrice: string) {
        const [newItem] = await db.insert(cartItem).values({
            cartId,
            voucherProductId,
            quantity,
            unitPrice,
        }).returning();
        return newItem!;
    }

    async updateCartItemQuantity(cartId: string, cartItemId: string, quantity: number) {
        const [updated] = await db
            .update(cartItem)
            .set({ quantity, updatedAt: sql`now()` })
            .where(and(eq(cartItem.cartId, cartId), eq(cartItem.cartItemId, cartItemId)))
            .returning();
        return updated ?? null;
    }

    async deleteCartItem(cartId: string, cartItemId: string) {
        const [deleted] = await db
            .delete(cartItem)
            .where(and(eq(cartItem.cartId, cartId), eq(cartItem.cartItemId, cartItemId)))
            .returning();
        return deleted ?? null;
    }
}
