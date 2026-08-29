import express from "express";
import { errorHandler } from "./shared/http/errorHandler";
import { notFoundHandler } from "./shared/http/notFoundHandler";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

  // Railway (and Vercel's rewrite proxy in front of it) sit in front of this
  // app, so without this every request's req.ip resolves to the proxy's own
  // address instead of the real client — collapsing express-rate-limit's
  // per-IP buckets (login, register, forgot-password) into one bucket shared
  // by every visitor, causing unrelated users to lock each other out.
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", frontendOrigin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));
  app.use(express.json());
  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
