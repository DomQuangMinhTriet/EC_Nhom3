import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { isUuid } from "../../shared/http/requestParsers";
import { PaymentService } from "./payment.service";

export class PaymentController {
  constructor(private readonly paymentService = new PaymentService()) {}

  initiatePayment = async (req: Request, res: Response) => {
    const { orderId, paymentMethod } = req.body as {
      orderId?: unknown;
      paymentMethod?: unknown;
    };

    if (!isUuid(orderId)) {
      throw new AppError("Invalid orderId", 400);
    }

    if (typeof paymentMethod !== "string") {
      throw new AppError("paymentMethod is required", 400);
    }

    res.status(201).json({
      data: await this.paymentService.initiatePayment(req.user!.userId, {
        orderId,
        paymentMethod,
      }),
    });
  };

  handleCallback = async (req: Request, res: Response) => {
    const { orderId } = req.body as { orderId?: unknown };

    if (!isUuid(orderId)) {
      throw new AppError("Invalid orderId", 400);
    }

    res.json({
      data: await this.paymentService.handleCallback({
        ...(req.body as Record<string, unknown>),
        orderId,
      } as Parameters<PaymentService["handleCallback"]>[0]),
    });
  };

  handleSepayWebhook = async (req: Request, res: Response) => {
    res.json(
      await this.paymentService.handleSepayWebhook({
        authorization: req.header("authorization"),
        payload: req.body,
      }),
    );
  };

  handleStripeWebhook = async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawBody = (req as any).rawBody;
    const signature = req.header("Stripe-Signature");

    res.json(
      await this.paymentService.handleStripeWebhook(signature, rawBody),
    );
  };
}
