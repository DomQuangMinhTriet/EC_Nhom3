import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import {
  role,
  user,
  customerProfile,
  partnerProfile,
  branchProfile,
  category,
  voucherProduct,
  branchVoucherProduct,
} from "./schema/index.js";

const roles: {
  roleCode: (typeof role.$inferInsert)["roleCode"];
  roleDescription: string;
}[] = [
  { roleCode: "Super_Admin", roleDescription: "Toan quyen quan tri he thong" },
  {
    roleCode: "Operational_Admin",
    roleDescription: "Duyet Partner/Branch/Voucher, van hanh hang ngay",
  },
  { roleCode: "Customer", roleDescription: "Duyet mua va doi voucher" },
  { roleCode: "Partner", roleDescription: "Tao va quan ly voucher, chi nhanh" },
  {
    roleCode: "Branch",
    roleDescription: "Xac thuc va xac nhan su dung voucher qua QR/code",
  },
];

// Fixed demo password for every seeded account — for report/demo purposes only,
// documented in Nhom3-EC-Report so graders can log in with any of the accounts
// listed below.
const DEMO_PASSWORD = "Demo@123456";

type SeedAccountInput = {
  email: string;
  roleCode: "Super_Admin" | "Operational_Admin" | "Partner" | "Branch" | "Customer";
};

/**
 * Creates (or reuses) a Supabase Auth user + matching local `users` row.
 * Idempotent: re-running the seed against a DB that already has these demo
 * accounts just looks up the existing userId instead of erroring.
 */
async function ensureAccount({ email, roleCode }: SeedAccountInput) {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existing) {
    return existing.userId;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { roleCode },
  });

  if (error || !data.user?.id) {
    throw new Error(`Could not create Supabase Auth user for ${email}: ${error?.message}`);
  }

  await db
    .insert(user)
    .values({
      userId: data.user.id,
      email,
      roleCode,
      status: "active",
    })
    .onConflictDoNothing({ target: user.userId });

  return data.user.id;
}

async function main() {
  console.log("Seeding roles ...");
  await db
    .insert(role)
    .values(roles)
    .onConflictDoNothing({ target: role.roleCode });
  console.log(`Done — ${roles.length} roles ensured.`);

  console.log("Seeding categories ...");
  const categoryNames = ["Ẩm thực", "Làm đẹp", "Giải trí", "Du lịch"];
  const categoryIds: Record<string, string> = {};
  for (const name of categoryNames) {
    const existingCategory = await db.query.category.findFirst({
      where: eq(category.name, name),
    });
    if (existingCategory) {
      categoryIds[name] = existingCategory.categoryId;
      continue;
    }
    const [created] = await db.insert(category).values({ name }).returning();
    categoryIds[name] = created!.categoryId;
  }
  console.log(`Done — ${categoryNames.length} categories ensured.`);

  console.log("Seeding demo accounts ...");
  // Admin roles have no separate profile table — the users row created by
  // ensureAccount is all they need, so their userId isn't used further here.
  await ensureAccount({
    email: "demo.admin@ecnhom3.cloud",
    roleCode: "Super_Admin",
  });
  await ensureAccount({
    email: "demo.opadmin@ecnhom3.cloud",
    roleCode: "Operational_Admin",
  });
  const partnerUserId = await ensureAccount({
    email: "demo.partner@ecnhom3.cloud",
    roleCode: "Partner",
  });
  const branchUserId = await ensureAccount({
    email: "demo.branch@ecnhom3.cloud",
    roleCode: "Branch",
  });
  const customerUserId = await ensureAccount({
    email: "demo.customer@ecnhom3.cloud",
    roleCode: "Customer",
  });
  console.log("Done — 5 demo accounts ensured (Super_Admin/Operational_Admin/Partner/Branch/Customer).");

  console.log("Seeding profiles ...");
  let partner = await db.query.partnerProfile.findFirst({
    where: eq(partnerProfile.userId, partnerUserId),
  });
  if (!partner) {
    [partner] = await db
      .insert(partnerProfile)
      .values({
        userId: partnerUserId,
        partnerProfileCode: "PARTNER-DEMO-01",
        partnerName: "Cong ty Demo Nhom3",
        taxCode: "0000000001",
        representativeName: "Nguyen Van Demo",
        status: "active",
      })
      .returning();
  }

  let branch = await db.query.branchProfile.findFirst({
    where: eq(branchProfile.userId, branchUserId),
  });
  if (!branch) {
    [branch] = await db
      .insert(branchProfile)
      .values({
        userId: branchUserId,
        partnerProfileId: partner!.partnerProfileId,
        branchProfileCode: "BRANCH-DEMO-01",
        branchName: "Chi nhanh Demo Quan 1",
        phone: "0900000010",
        address: "123 Duong Demo, Quan 1, TP.HCM",
        status: "active",
      })
      .returning();
  }

  let customer = await db.query.customerProfile.findFirst({
    where: eq(customerProfile.userId, customerUserId),
  });
  if (!customer) {
    [customer] = await db
      .insert(customerProfile)
      .values({
        userId: customerUserId,
        fullName: "Tran Thi Demo",
        phone: "0900000020",
        address: "456 Duong Khach Hang, Quan 3, TP.HCM",
      })
      .returning();
  }
  console.log("Done — partner/branch/customer profiles ensured.");

  console.log("Seeding voucher products ...");
  const now = new Date();
  const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const voucherSeeds = [
    {
      title: "Combo Lẩu Nướng 2 Người",
      description: "Giảm 20% cho combo lẩu nướng dành cho 2 người",
      categoryName: "Ẩm thực",
      originalPrice: "350000",
      discountType: "percentage" as const,
      discountValue: "20",
      validDurationDays: 30,
      totalQuantity: 50,
    },
    {
      title: "Gói Chăm Sóc Da Cơ Bản",
      description: "Ưu đãi gói chăm sóc da mặt cơ bản tại spa đối tác",
      categoryName: "Làm đẹp",
      originalPrice: "500000",
      discountType: "percentage" as const,
      discountValue: "15",
      validDurationDays: 45,
      totalQuantity: 30,
    },
    {
      title: "Vé Xem Phim 2D",
      description: "Vé xem phim 2D suất chiếu bất kỳ trong tuần",
      categoryName: "Giải trí",
      originalPrice: "90000",
      discountType: "direct" as const,
      discountValue: "20000",
      validDurationDays: 60,
      totalQuantity: 100,
    },
  ];

  for (const v of voucherSeeds) {
    let product = await db.query.voucherProduct.findFirst({
      where: eq(voucherProduct.title, v.title),
    });
    if (!product) {
      [product] = await db
        .insert(voucherProduct)
        .values({
          categoryId: categoryIds[v.categoryName]!,
          partnerProfileId: partner!.partnerProfileId,
          title: v.title,
          description: v.description,
          originalPrice: v.originalPrice,
          discountType: v.discountType,
          discountValue: v.discountValue,
          startDate: now,
          endDate,
          validDurationDays: v.validDurationDays,
          minLimit: 1,
          maxLimit: v.totalQuantity,
          status: "active",
        })
        .returning();
    }

    const existingAllocation = await db.query.branchVoucherProduct.findFirst({
      where: (t, { and, eq: eqOp }) =>
        and(
          eqOp(t.branchProfileId, branch!.branchProfileId),
          eqOp(t.voucherProductId, product!.voucherProductId),
        ),
    });
    if (!existingAllocation) {
      await db.insert(branchVoucherProduct).values({
        branchProfileId: branch!.branchProfileId,
        voucherProductId: product!.voucherProductId,
        totalQuantity: v.totalQuantity,
      });
    }
  }
  console.log(`Done — ${voucherSeeds.length} voucher products ensured, allocated to demo branch.`);

  console.log("\nDemo accounts (password for all: " + DEMO_PASSWORD + "):");
  console.log("  Super_Admin       demo.admin@ecnhom3.cloud");
  console.log("  Operational_Admin demo.opadmin@ecnhom3.cloud");
  console.log("  Partner           demo.partner@ecnhom3.cloud");
  console.log("  Branch            demo.branch@ecnhom3.cloud");
  console.log("  Customer          demo.customer@ecnhom3.cloud");

  process.exit(0);
}

main().catch((error) => {
  console.error("Seeding failed:");
  console.error(error);
  process.exit(1);
});
