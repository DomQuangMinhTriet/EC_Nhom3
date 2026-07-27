import dotenv from "dotenv";
import db from "../models/index.js";

dotenv.config();

try {
  await db.sequelize.authenticate();
  console.log("Database connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
