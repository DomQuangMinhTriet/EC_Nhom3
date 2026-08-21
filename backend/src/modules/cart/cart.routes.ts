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
    "/me",
    asyncHandler(cartController.getCart)
);

cartRouter.post(
    "/me/items",
    asyncHandler(cartController.addItem)
);

cartRouter.put(
    "/me/items/:id",
    asyncHandler(cartController.updateItemQuantity)
);

cartRouter.delete(
    "/me/items/:id",
    asyncHandler(cartController.removeItem)
);
