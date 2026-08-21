import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { NotificationService } from "./notification.service";

export class NotificationController {
  constructor(
    private readonly notificationService = new NotificationService(),
  ) {}

  sendEmail = async (req: Request, res: Response) => {
    const { email, title, body } = req.body as {
      email?: unknown;
      title?: unknown;
      body?: unknown;
    };

    if (
      typeof email !== "string" ||
      typeof title !== "string" ||
      typeof body !== "string"
    ) {
      throw new AppError("email, title, and body are required", 400);
    }

    const result = await this.notificationService.sendEmailNotification({
      email,
      title,
      body,
    });

    res.status(201).json(result);
  };

  getMyNotifications = async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await this.notificationService.getMyNotifications(
      req.user.userId,
    );

    res.json(result);
  };
}
