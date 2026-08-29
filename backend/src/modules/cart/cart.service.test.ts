import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../shared/errors/AppError";
import { CartService } from "./cart.service";
import type { CartRepository } from "./cart.repository";

// Mocks
const mockUserId = "u-123";
const mockCustomerProfileId = "cp-123";
const mockCartId = "cart-123";
const mockVoucherProductId = "vp-123";
const mockCartItemId = "ci-123";

const mockCart = {
    cartId: mockCartId,
    customerProfileId: mockCustomerProfileId,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockVoucherProduct = {
    voucherProductId: mockVoucherProductId,
    categoryId: "cat-123",
    partnerProfileId: "partner-123",
    title: "Voucher",
    description: "",
    originalPrice: "1000",
    discountType: "percentage" as const,
    discountValue: "10",
    startDate: new Date(),
    endDate: new Date(),
    validDurationDays: 0,
    minLimit: 1,
    maxLimit: 10,
    imageUrl: null,
    status: "active" as const,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockCartItem = {
    cartItemId: mockCartItemId,
    cartId: mockCartId,
    voucherProductId: mockVoucherProductId,
    quantity: 2,
    unitPrice: "1000",
    createdAt: new Date(),
    updatedAt: new Date()
};

function createRepository(overrides?: Partial<CartRepository>): CartRepository {
    return {
        getCustomerProfileIdByUserId: async () => mockCustomerProfileId,
        getOrCreateCart: async () => mockCart,
        getCartWithItems: async () => ({ ...mockCart, items: [] }),
        getVoucherProduct: async () => mockVoucherProduct,
        hasAnyAllocation: async () => true,
        getAvailableStock: async () => 10,
        findCartItemByVoucherId: async () => null,
        findCartItemById: async () => mockCartItem,
        insertCartItem: async () => mockCartItem,
        updateCartItemQuantity: async () => mockCartItem,
        deleteCartItem: async () => mockCartItem,
        ...overrides,
    } as unknown as CartRepository;
}

test("getCart successfully returns cart with items", async () => {
    const service = new CartService(createRepository({
        getCartWithItems: async () => ({ ...mockCart, items: [{ ...mockCartItem, voucherProduct: mockVoucherProduct } as unknown as Awaited<ReturnType<CartRepository["getCartWithItems"]>>["items"][0]] })
    }));

    const cart = await service.getCart(mockUserId);
    assert.equal(cart.cartId, mockCartId);
    assert.equal(cart.items.length, 1);
});

test("getCart throws 404 if customer profile not found", async () => {
    const service = new CartService(createRepository({
        getCustomerProfileIdByUserId: async () => null
    }));

    await assert.rejects(
        service.getCart(mockUserId),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Customer profile not found"
    );
});

test("addItem successfully inserts a new cart item", async () => {
    const service = new CartService(createRepository({
        findCartItemByVoucherId: async () => null,
        insertCartItem: async (cId, vId, q) => {
            assert.equal(cId, mockCartId);
            assert.equal(vId, mockVoucherProductId);
            assert.equal(q, 3);
            return { ...mockCartItem, quantity: 3 };
        }
    }));

    const result = await service.addItem(mockUserId, mockVoucherProductId, 3);
    assert.equal(result!.quantity, 3);
});

test("addItem stores the discounted sale price, not the original price", async () => {
    // mockVoucherProduct: originalPrice 1000, 10% off -> sale price 900.
    const service = new CartService(createRepository({
        findCartItemByVoucherId: async () => null,
        insertCartItem: async (cId, vId, q, unitPrice) => {
            assert.equal(unitPrice, "900.00");
            return { ...mockCartItem, quantity: q, unitPrice };
        }
    }));

    const result = await service.addItem(mockUserId, mockVoucherProductId, 1);
    assert.equal(result!.unitPrice, "900.00");
});

test("addItem applies a direct discount when computing the sale price", async () => {
    const service = new CartService(createRepository({
        getVoucherProduct: async () => ({ ...mockVoucherProduct, discountType: "direct", discountValue: "150" }),
        findCartItemByVoucherId: async () => null,
        insertCartItem: async (cId, vId, q, unitPrice) => {
            assert.equal(unitPrice, "850.00");
            return { ...mockCartItem, quantity: q, unitPrice };
        }
    }));

    const result = await service.addItem(mockUserId, mockVoucherProductId, 1);
    assert.equal(result!.unitPrice, "850.00");
});

test("addItem successfully updates quantity if item is already in cart", async () => {
    const service = new CartService(createRepository({
        findCartItemByVoucherId: async () => mockCartItem, // already has 2
        updateCartItemQuantity: async (cId, cItemId, q) => {
            assert.equal(q, 5); // 2 existing + 3 new
            return { ...mockCartItem, quantity: 5 };
        }
    }));

    const result = await service.addItem(mockUserId, mockVoucherProductId, 3);
    assert.equal(result!.quantity, 5);
});

test("addItem throws 400 if quantity is invalid", async () => {
    const service = new CartService(createRepository());

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 0),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "Quantity must be a positive integer"
    );

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, -5),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "Quantity must be a positive integer"
    );
});

test("addItem throws 404 if voucher product is not found", async () => {
    const service = new CartService(createRepository({
        getVoucherProduct: async () => null
    }));

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 1),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Voucher product not found"
    );
});

test("addItem throws 400 if voucher product is not active", async () => {
    const service = new CartService(createRepository({
        getVoucherProduct: async () => ({ ...mockVoucherProduct, status: "pending" })
    }));

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 1),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "Voucher product is not active"
    );
});

test("addItem throws 400 if voucher has not been allocated to any branch yet", async () => {
    const service = new CartService(createRepository({
        hasAnyAllocation: async () => false,
        getAvailableStock: async () => 10, // even with stock elsewhere, no allocation means not purchasable
    }));

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 1),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message.includes("has not been allocated to any branch")
    );
});

test("addItem throws 400 if requested quantity exceeds available stock for new item", async () => {
    const service = new CartService(createRepository({
        getAvailableStock: async () => 2,
        findCartItemByVoucherId: async () => null
    }));

    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 3),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message.includes("Not enough stock available")
    );
});

test("addItem throws 400 if requested quantity exceeds available stock for existing item", async () => {
    const service = new CartService(createRepository({
        getAvailableStock: async () => 3,
        findCartItemByVoucherId: async () => ({ ...mockCartItem, quantity: 2 })
    }));

    // existing is 2, adding 2 more = 4. Available is 3. Should throw.
    await assert.rejects(
        service.addItem(mockUserId, mockVoucherProductId, 2),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message.includes("Not enough stock available")
    );
});

test("updateItemQuantity successfully updates if stock allows it", async () => {
    const service = new CartService(createRepository({
        getAvailableStock: async () => 10,
        updateCartItemQuantity: async (cId, cItemId, q) => ({ ...mockCartItem, quantity: q })
    }));

    const result = await service.updateItemQuantity(mockUserId, mockCartItemId, 5);
    assert.equal(result!.quantity, 5);
});

test("updateItemQuantity successfully updates without checking stock if lowering quantity", async () => {
    let stockChecked = false;
    const service = new CartService(createRepository({
        findCartItemById: async () => ({ ...mockCartItem, quantity: 5 }),
        getAvailableStock: async () => {
            stockChecked = true;
            return 10;
        },
        updateCartItemQuantity: async (cId, cItemId, q) => ({ ...mockCartItem, quantity: q })
    }));

    const result = await service.updateItemQuantity(mockUserId, mockCartItemId, 3);
    assert.equal(result!.quantity, 3);
    assert.equal(stockChecked, false);
});

test("updateItemQuantity throws 400 if increasing quantity exceeds available stock", async () => {
    const service = new CartService(createRepository({
        findCartItemById: async () => ({ ...mockCartItem, quantity: 2 }),
        getAvailableStock: async () => 3,
    }));

    await assert.rejects(
        service.updateItemQuantity(mockUserId, mockCartItemId, 4),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message.includes("Not enough stock available")
    );
});

test("updateItemQuantity throws 400 if quantity is invalid", async () => {
    const service = new CartService(createRepository());

    await assert.rejects(
        service.updateItemQuantity(mockUserId, mockCartItemId, 0),
        (err: unknown) => err instanceof AppError && err.statusCode === 400 && err.message === "Quantity must be a positive integer"
    );
});

test("updateItemQuantity throws 404 if item not found", async () => {
    const service = new CartService(createRepository({
        findCartItemById: async () => null
    }));

    await assert.rejects(
        service.updateItemQuantity(mockUserId, mockCartItemId, 3),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Cart item not found"
    );
});

test("removeItem successfully removes item", async () => {
    let deleted = false;
    const service = new CartService(createRepository({
        deleteCartItem: async () => {
            deleted = true;
            return mockCartItem;
        }
    }));

    const result = await service.removeItem(mockUserId, mockCartItemId);
    assert.equal(deleted, true);
    assert.equal(result.message, "Item removed successfully");
});

test("removeItem throws 404 if item not found", async () => {
    const service = new CartService(createRepository({
        findCartItemById: async () => null
    }));

    await assert.rejects(
        service.removeItem(mockUserId, mockCartItemId),
        (err: unknown) => err instanceof AppError && err.statusCode === 404 && err.message === "Cart item not found"
    );
});
