import dotenv from "dotenv";
import express from "express";
import db from "./models/index.js";
import testRoute from "./routes/testRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const DB_SYNC = process.env.DB_SYNC === "true";
const DB_SYNC_ALTER = process.env.DB_SYNC_ALTER === "true";

app.get("/", (req, res) => {
  res.send("Hello Express!");
});

app.use(express.json());

app.use("/api/test", testRoute);

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected successfully.");

    if (DB_SYNC) {
      await db.sequelize.sync({ alter: DB_SYNC_ALTER });
      console.log("Database models synced successfully.");
    }

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
