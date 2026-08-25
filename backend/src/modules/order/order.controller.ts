import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import {
  isUuid,
  parseOptionalStringQuery,
  parsePositiveIntegerWithDefault,
} from "../../shared/http/requestParsers";
import { OrderService } from "./order.service";

const parseDateQuery = (value: unknown, field: string): Date | undefined => {
  const raw = parseOptionalStringQuery(value, field);

  if (raw === undefined) {
    return undefined;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  return parsed;
};

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  getMyOrders = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const page = parsePositiveIntegerWithDefault(req.query.page, 1, "page");
    const limit = parsePositiveIntegerWithDefault(req.query.limit, 20, "limit");

    if (limit > 100) {
      throw new AppError("limit must not exceed 100", 400);
    }

    const status = parseOptionalStringQuery(req.query.status, "status");

    res.json(await this.orderService.getMyOrders(userId, { page, limit, status }));
  };

  getOrderById = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = req.params.id;

    if (!isUuid(orderId)) {
      throw new AppError("Invalid order ID", 400);
    }

    res.json({ data: await this.orderService.getOrderById(userId, orderId) });
  };

  getOrdersForAdmin = async (req: Request, res: Response) => {
    const page = parsePositiveIntegerWithDefault(req.query.page, 1, "page");
    const limit = parsePositiveIntegerWithDefault(req.query.limit, 20, "limit");

    if (limit > 100) {
      throw new AppError("limit must not exceed 100", 400);
    }

    const status = parseOptionalStringQuery(req.query.status, "status");
    const from = parseDateQuery(req.query.from, "from");
    const to = parseDateQuery(req.query.to, "to");
    const customerProfileId = parseOptionalStringQuery(
      req.query.customerProfileId,
      "customerProfileId",
    );

    if (customerProfileId !== undefined && !isUuid(customerProfileId)) {
      throw new AppError("Invalid customerProfileId", 400);
    }

    res.json(
      await this.orderService.getOrdersForAdmin({
        page,
        limit,
        status,
        from,
        to,
        customerProfileId,
      }),
    );
  };

  getOrderByIdForAdmin = async (req: Request, res: Response) => {
    const orderId = req.params.id;

    if (!isUuid(orderId)) {
      throw new AppError("Invalid order ID", 400);
    }

    res.json({ data: await this.orderService.getOrderByIdForAdmin(orderId) });
  };

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
    const orderId = req.params.id;

    if (!isUuid(orderId)) {
      throw new AppError("Invalid order ID", 400);
    }

    res.json({
      data: await this.orderService.updateOrderBySystem(orderId, req.body),
    });
  };

  cancelOrder = async (req: Request, res: Response) => {
    const orderId = req.params.id;

    if (!isUuid(orderId)) {
      throw new AppError("Invalid order ID", 400);
    }

    const { reason } = req.body as { reason?: unknown };

    res.json({
      data: await this.orderService.cancelOrder(
        req.user!.userId,
        orderId,
        reason,
      ),
    });
  };
}
