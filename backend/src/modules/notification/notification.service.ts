import { AppError } from "../../shared/errors/AppError";
import { NotificationRepository } from "./notification.repository";

export type SendEmailNotificationInput = {
  email: string;
  title: string;
  body: string;
};

type EmailSender = (input: SendEmailNotificationInput) => Promise<void>;

const defaultEmailFunctionName = "send-email";

const sendEmailWithSupabase: EmailSender = async ({ email, title, body }) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const functionName =
    process.env.SUPABASE_EMAIL_FUNCTION_NAME ?? defaultEmailFunctionName;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not configured",
      500,
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, title, body }),
    },
  );

  const responseText = await response.text();
  const data = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    const detail =
      process.env.NODE_ENV === "production"
        ? ""
        : `: ${response.status} ${responseText}`;
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "Could not send email through Supabase"
        : `Could not send email through Supabase${detail}`;

    throw new AppError(errorMessage, 502);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("message" in data) ||
    data.message !== "Email sent successfully"
  ) {
    throw new AppError(
      "Supabase email function did not confirm email delivery",
      502,
    );
  }
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export class NotificationService {
  constructor(
    private readonly notificationRepository = new NotificationRepository(),
    private readonly emailSender = sendEmailWithSupabase,
  ) {}

  async sendEmailNotification(input: SendEmailNotificationInput) {
    const email = input.email.trim().toLowerCase();
    const title = input.title.trim();
    const body = input.body.trim();

    if (!isEmail(email)) {
      throw new AppError("email must be a valid email address", 400);
    }

    if (!title) {
      throw new AppError("title is required", 400);
    }

    if (!body) {
      throw new AppError("body is required", 400);
    }

    await this.emailSender({ email, title, body });

    const customerProfileId =
      await this.notificationRepository.findCustomerProfileIdByEmail(email);

    const record = customerProfileId
      ? await this.notificationRepository.create({
          customerProfileId,
          title,
          body,
        })
      : null;

    return {
      message: "Email notification sent successfully.",
      notification: record,
      customerProfileId,
    };
  }

  async getMyNotifications(userId: string) {
    const customerProfileId =
      await this.notificationRepository.findCustomerProfileIdByUserId(userId);

    if (!customerProfileId) {
      throw new AppError("Customer profile not found", 404);
    }

    const notifications =
      await this.notificationRepository.findAllByCustomerProfileId(
        customerProfileId,
      );

    return { notifications };
  }

  async markAsRead(userId: string, notificationId: string) {
    const customerProfileId =
      await this.notificationRepository.findCustomerProfileIdByUserId(userId);

    if (!customerProfileId) {
      throw new AppError("Customer profile not found", 404);
    }

    const updated = await this.notificationRepository.markAsRead(
      notificationId,
      customerProfileId,
    );

    if (!updated) {
      throw new AppError("Notification not found", 404);
    }

    return { notification: updated };
  }
}
