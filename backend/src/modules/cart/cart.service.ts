import { AppError } from "../../shared/errors/AppError";
import { CartRepository } from "./cart.repository";

export class CartService {
    constructor(private readonly cartRepository = new CartRepository()) {}

    private async getCustomerProfileId(userId: string): Promise<string> {
        const customerProfileId = await this.cartRepository.getCustomerProfileIdByUserId(userId);
        if (!customerProfileId) {
            throw new AppError("Customer profile not found", 404);
        }
        return customerProfileId;
    }

    async getCart(userId: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);
        return await this.cartRepository.getCartWithItems(customerProfileId);
    }

    async addItem(userId: string, voucherProductId: string, quantity: number) {
        if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
            throw new AppError("Quantity must be a positive integer", 400);
        }

        const customerProfileId = await this.getCustomerProfileId(userId);
        const cart = await this.cartRepository.getOrCreateCart(customerProfileId);

        const voucher = await this.cartRepository.getVoucherProduct(voucherProductId);
        if (!voucher) {
            throw new AppError("Voucher product not found", 404);
        }
        if (voucher.status !== "active") {
            throw new AppError("Voucher product is not active", 400);
        }

        const availableStock = await this.cartRepository.getAvailableStock(voucherProductId);

        const existingItem = await this.cartRepository.findCartItemByVoucherId(cart.cartId, voucherProductId);
        const totalRequestedQuantity = existingItem ? existingItem.quantity + quantity : quantity;

        if (totalRequestedQuantity > availableStock) {
            throw new AppError(`Not enough stock available. Available: ${availableStock}`, 400);
        }

        if (existingItem) {
            return await this.cartRepository.updateCartItemQuantity(cart.cartId, existingItem.cartItemId, totalRequestedQuantity);
        } else {
            return await this.cartRepository.insertCartItem(cart.cartId, voucherProductId, quantity, voucher.originalPrice);
        }
    }

    async updateItemQuantity(userId: string, cartItemId: string, quantity: number) {
        if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
            throw new AppError("Quantity must be a positive integer", 400);
        }

        const customerProfileId = await this.getCustomerProfileId(userId);
        const cart = await this.cartRepository.getOrCreateCart(customerProfileId);

        const existingItem = await this.cartRepository.findCartItemById(cart.cartId, cartItemId);
        if (!existingItem) {
            throw new AppError("Cart item not found", 404);
        }

        if (quantity > existingItem.quantity) {
            const availableStock = await this.cartRepository.getAvailableStock(existingItem.voucherProductId);
            if (quantity > availableStock) {
                throw new AppError(`Not enough stock available. Available: ${availableStock}`, 400);
            }
        }

        return await this.cartRepository.updateCartItemQuantity(cart.cartId, cartItemId, quantity);
    }

    async removeItem(userId: string, cartItemId: string) {
        const customerProfileId = await this.getCustomerProfileId(userId);
        const cart = await this.cartRepository.getOrCreateCart(customerProfileId);

        const existingItem = await this.cartRepository.findCartItemById(cart.cartId, cartItemId);
        if (!existingItem) {
            throw new AppError("Cart item not found", 404);
        }

        await this.cartRepository.deleteCartItem(cart.cartId, cartItemId);
        return { message: "Item removed successfully" };
    }
}
