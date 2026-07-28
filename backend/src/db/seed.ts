import "dotenv/config";
import { db } from "./client.js";
import { role } from "./schema/index.js";

const roles: { roleCode: (typeof role.$inferInsert)["roleCode"]; roleDescription: string }[] = [
  { roleCode: "Super_Admin", roleDescription: "Toan quyen quan tri he thong" },
  { roleCode: "Operational_Admin", roleDescription: "Duyet Partner/Branch/Voucher, van hanh hang ngay" },
  { roleCode: "Customer", roleDescription: "Duyet mua va doi voucher" },
  { roleCode: "Partner", roleDescription: "Tao va quan ly voucher, chi nhanh" },
  { roleCode: "Branch", roleDescription: "Xac thuc va xac nhan su dung voucher qua QR/code" },
];

async function main() {
  console.log("Seeding roles ...");
  await db.insert(role).values(roles).onConflictDoNothing({ target: role.roleCode });
  console.log(`Done — ${roles.length} roles ensured.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:");
  console.error(error);
  process.exit(1);
});
