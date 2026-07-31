import "dotenv/config";
import express from "express";
import { sql } from "drizzle-orm";
import { db } from "./db/client";

// Routes
import partnerProfileRoutes from "./modules/partnerProfile/partnerProfile.routes";
import branchProfileRoutes from "./modules/branchProfile/branchProfile.routes";
import customerProfileRoutes from "./modules/customerProfile/customerProfile.routes";

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

// Profiles routes
app.use("/", customerProfileRoutes);
app.use("/", partnerProfileRoutes);
app.use("/", branchProfileRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
