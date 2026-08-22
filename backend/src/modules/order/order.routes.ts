import { Router } from "express";
import { authorizeRoles, requireAuth } from "../../shared/auth/auth.middleware";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { OrderController } from "./order.controller";

export const orderRouter = Router();
const orderController = new OrderController();

orderRouter.use(requireAuth);
orderRouter.use(authorizeRoles("Customer"));

orderRouter.post("/", asyncHandler(orderController.createOrder));
orderRouter.put("/:id", asyncHandler(orderController.updateOrder));
