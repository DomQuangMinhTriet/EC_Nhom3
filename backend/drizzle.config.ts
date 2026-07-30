import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const {
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_NAME = "postgres",
  DB_USER = "postgres",
  DB_PASS = "",
  DB_SSL = "false",
} = process.env;

const dbCredentials = DATABASE_URL
  ? { url: DATABASE_URL }
  : {
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      ssl: DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    };

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials,
});
