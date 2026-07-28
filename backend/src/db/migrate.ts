import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

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
  ? new Pool({ connectionString: DATABASE_URL, ssl, max: 1 })
  : new Pool({
      host: DB_HOST,
      port: Number(DB_PORT),
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASS,
      ssl,
      max: 1,
    });

async function main() {
  const db = drizzle(pool);
  console.log("Applying migrations from ./drizzle ...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
  await pool.end();
}

main().catch((error) => {
  console.error("Migration failed:");
  console.error(error);
  process.exit(1);
});
