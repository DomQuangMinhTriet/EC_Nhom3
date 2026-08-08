import "dotenv/config";
import { sql } from "drizzle-orm";
import { createApp } from "./app";
import { db } from "./db/client";

const PORT = Number(process.env.PORT ?? 8080);
const app = createApp();

async function logDatabaseTables() {
  try {
    const tables = await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    const tableNames = tables.rows.map((row) => String(row.table_name));

    console.log(
      "Database tables (%d): %s",
      tableNames.length,
      tableNames.length > 0 ? tableNames.join(", ") : "(none)",
    );
  } catch (error) {
    console.error("Failed to log database tables:", error);
  }
}

void logDatabaseTables();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
