import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { CartController } from "./cart.controller";

export const cartRouter = Router();
const cartController = new CartController();

// All cart endpoints are for Customers only
cartRouter.use(requireAuth);
cartRouter.use(authorizeRoles("Customer"));

cartRouter.get(
    "/customers/me/cart",
    asyncHandler(cartController.getCart)
);

cartRouter.post(
    "/customers/me/cart/items",
    asyncHandler(cartController.addItem)
);

cartRouter.put(
    "/customers/me/cart/items/:id",
    asyncHandler(cartController.updateItemQuantity)
);

cartRouter.delete(
    "/customers/me/cart/items/:id",
    asyncHandler(cartController.removeItem)
);
