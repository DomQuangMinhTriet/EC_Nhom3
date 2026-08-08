import { sql } from "drizzle-orm";
import { db } from "../../db/client";

export class HealthRepository {
  async pingDatabase() {
    await db.execute(sql`select 1`);
  }
}
