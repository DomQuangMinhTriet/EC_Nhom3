import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

const {
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_NAME = "postgres",
  DB_USER = "postgres",
  DB_PASS = "",
  DB_SSL = "false",
} = process.env;

const ssl = DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl })
  : new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      ssl,
    });

export const db = drizzle(pool, { schema });
