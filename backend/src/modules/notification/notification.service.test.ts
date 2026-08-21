import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../../shared/errors/AppError";
import {
  NotificationService,
  type SendEmailNotificationInput,
} from "./notification.service";

const customerProfileId = "customer-profile-1";

const input: SendEmailNotificationInput = {
  email: "Customer@Example.com",
  title: "Voucher approved",
  body: "Your voucher is ready.",
};

const createRepository = (overrides = {}) => ({
  findCustomerProfileIdByUserId: async () => customerProfileId,
  findCustomerProfileIdByEmail: async () => customerProfileId,
  create: async (record: {
    customerProfileId: string;
    title: string;
    body: string;
  }) => ({
    notificationId: "notification-1",
    isRead: false,
    createdAt: new Date(),
    ...record,
  }),
  findAllByCustomerProfileId: async () => [
    {
      notificationId: "notification-1",
      customerProfileId,
      title: input.title,
      body: input.body,
      isRead: false,
      createdAt: new Date(),
    },
  ],
  ...overrides,
});

test("sendEmailNotification sends email and stores notification for matching customer", async () => {
  const sentEmails: SendEmailNotificationInput[] = [];
  const service = new NotificationService(
    createRepository(),
    async (emailInput) => {
      sentEmails.push(emailInput);
    },
  );

  const result = await service.sendEmailNotification(input);

  assert.deepEqual(sentEmails, [
    {
      email: "customer@example.com",
      title: input.title,
      body: input.body,
    },
  ]);
  assert.equal(result.customerProfileId, customerProfileId);
  assert.equal(result.notification?.customerProfileId, customerProfileId);
});

test("sendEmailNotification does not store notification when email has no customer profile", async () => {
  let createCalled = false;
  const service = new NotificationService(
    createRepository({
      findCustomerProfileIdByEmail: async () => null,
      create: async () => {
        createCalled = true;
        return null;
      },
    }),
    async () => {},
  );

  const result = await service.sendEmailNotification(input);

  assert.equal(createCalled, false);
  assert.equal(result.customerProfileId, null);
  assert.equal(result.notification, null);
});

test("sendEmailNotification rejects invalid email", async () => {
  const service = new NotificationService(createRepository(), async () => {});

  await assert.rejects(
    service.sendEmailNotification({ ...input, email: "not-an-email" }),
    (error) => error instanceof AppError && error.statusCode === 400,
  );
});

test("getMyNotifications returns notifications for current customer", async () => {
  const service = new NotificationService(createRepository(), async () => {});

  const result = await service.getMyNotifications("user-1");

  assert.equal(result.notifications.length, 1);
  assert.equal(result.notifications[0]?.customerProfileId, customerProfileId);
});

test("getMyNotifications throws 404 if customer profile is missing", async () => {
  const service = new NotificationService(
    createRepository({
      findCustomerProfileIdByUserId: async () => null,
    }),
    async () => {},
  );

  await assert.rejects(
    service.getMyNotifications("missing-user"),
    (error) => error instanceof AppError && error.statusCode === 404,
  );
});
