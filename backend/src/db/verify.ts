import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./client.js";
import { role } from "./schema/index.js";

async function main() {
  const tables = await db.execute(
    sql`select table_name from information_schema.tables where table_schema='public' order by table_name`,
  );
  console.log(
    "Tables (%d):",
    tables.rows.length,
    tables.rows.map((r) => r.table_name).join(", "),
  );

  const cols = await db.execute(
    sql`select column_name from information_schema.columns where table_schema='public' and table_name='users' order by column_name`,
  );
  console.log("users columns:", cols.rows.map((r) => r.column_name).join(", "));

  const roles = await db.select().from(role);
  console.log(
    "roles seeded (%d):",
    roles.length,
    roles.map((r) => r.roleCode).join(", "),
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
