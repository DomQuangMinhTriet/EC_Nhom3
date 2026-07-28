import "dotenv/config";
import express from "express";
import { sql } from "drizzle-orm";
import { db } from "./db/client";

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "EC Voucher API" });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ database: "connected" });
  } catch (error) {
    res.status(503).json({ database: "unreachable", error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
