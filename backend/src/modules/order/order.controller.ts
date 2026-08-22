import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { isUuid } from "../../shared/http/requestParsers";
import { OrderService } from "./order.service";

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  createOrder = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { cartId } = req.body as { cartId?: unknown };

    if (!isUuid(cartId)) {
      throw new AppError("Invalid cartId", 400);
    }

    res.status(201).json({
      data: await this.orderService.createOrder(userId, cartId),
    });
  };

  updateOrder = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = req.params.id;

    if (!isUuid(orderId)) {
      throw new AppError("Invalid order ID", 400);
    }

    res.json({
      data: await this.orderService.updateOrder(userId, orderId, req.body),
    });
  };
}
