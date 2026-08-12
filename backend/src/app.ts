import express from "express";
import { errorHandler } from "./shared/http/errorHandler";
import { notFoundHandler } from "./shared/http/notFoundHandler";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();
  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

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

  app.use(express.json());
  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
