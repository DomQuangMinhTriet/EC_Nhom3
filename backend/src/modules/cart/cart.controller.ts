import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { CartService } from "./cart.service";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CartController {
    constructor(private readonly cartService = new CartService()) {}

    getCart = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const cart = await this.cartService.getCart(userId);
        res.json({ data: cart });
    };

    addItem = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { voucherProductId, quantity } = req.body;

        if (!voucherProductId || !uuidRegex.test(voucherProductId)) {
            throw new AppError("Invalid voucherProductId", 400);
        }

        const item = await this.cartService.addItem(userId, voucherProductId, quantity);
        res.status(201).json({ data: item });
    };

    updateItemQuantity = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const cartItemId = req.params.id as string;
        const { quantity } = req.body;

        if (!uuidRegex.test(cartItemId)) {
            throw new AppError("Invalid cart item ID", 400);
        }

        const item = await this.cartService.updateItemQuantity(userId, cartItemId, quantity);
        res.json({ data: item });
    };

    removeItem = async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const cartItemId = req.params.id as string;

        if (!uuidRegex.test(cartItemId)) {
            throw new AppError("Invalid cart item ID", 400);
        }

        const result = await this.cartService.removeItem(userId, cartItemId);
        res.json({ data: result });
    };
}
