import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./client.js";
import {
  category,
  voucherProduct,
  branchVoucherProduct,
  partnerProfile,
  branchProfile,
  customerProfile,
  order,
  orderItem,
  payment,
  voucherCode,
  review,
} from "./schema/index.js";

/**
 * Adds more demo depth on top of seed.ts: extra categories, extra voucher
 * products with real (Lorem Picsum) images instead of the placeholder
 * example.com URL, and a handful of completed orders + reviews so the
 * Dashboard/Reports pages and public voucher pages don't look empty during
 * grading. Idempotent — safe to re-run.
 */

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/600`;
}

const extraCategoryNames = ["Thoi trang", "Suc khoe", "Cong nghe", "The thao"];

const extraVoucherSeeds = [
  {
    title: "Ao Thun Basic Unisex",
    description: "Giam 25% cho tat ca ao thun basic unisex, nhieu mau sac",
    categoryName: "Thoi trang",
    originalPrice: "250000",
    discountType: "percentage" as const,
    discountValue: "25",
    validDurationDays: 60,
    totalQuantity: 80,
    imageSeed: "ao-thun-basic",
  },
  {
    title: "Giay Sneaker The Thao",
    description: "Uu dai 100.000d cho giay sneaker the thao chinh hang",
    categoryName: "Thoi trang",
    originalPrice: "890000",
    discountType: "direct" as const,
    discountValue: "100000",
    validDurationDays: 45,
    totalQuantity: 40,
    imageSeed: "sneaker",
  },
  {
    title: "Goi Kham Suc Khoe Tong Quat",
    description: "Giam 30% goi kham suc khoe tong quat tai phong kham doi tac",
    categoryName: "Suc khoe",
    originalPrice: "1200000",
    discountType: "percentage" as const,
    discountValue: "30",
    validDurationDays: 90,
    totalQuantity: 25,
    imageSeed: "kham-suc-khoe",
  },
  {
    title: "The Tap Gym 1 Thang",
    description: "The tap gym 1 thang khong gioi han, tang 2 buoi PT",
    categoryName: "Suc khoe",
    originalPrice: "600000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 30,
    totalQuantity: 60,
    imageSeed: "gym-membership",
  },
  {
    title: "Tai Nghe Bluetooth Chinh Hang",
    description: "Giam 150.000d cho tai nghe bluetooth chinh hang",
    categoryName: "Cong nghe",
    originalPrice: "990000",
    discountType: "direct" as const,
    discountValue: "150000",
    validDurationDays: 60,
    totalQuantity: 35,
    imageSeed: "bluetooth-headphone",
  },
  {
    title: "Sac Du Phong 10000mAh",
    description: "Uu dai 20% cho sac du phong dung luong 10000mAh",
    categoryName: "Cong nghe",
    originalPrice: "450000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 60,
    totalQuantity: 50,
    imageSeed: "power-bank",
  },
  {
    title: "Ve San Bong Da Mini",
    description: "Giam 15% chi phi thue san bong da mini theo gio",
    categoryName: "The thao",
    originalPrice: "300000",
    discountType: "percentage" as const,
    discountValue: "15",
    validDurationDays: 45,
    totalQuantity: 45,
    imageSeed: "football-field",
  },
  {
    title: "Combo Buffet Hai San",
    description: "Giam 25% combo buffet hai san cho 2 nguoi",
    categoryName: "Am thuc",
    originalPrice: "798000",
    discountType: "percentage" as const,
    discountValue: "25",
    validDurationDays: 30,
    totalQuantity: 40,
    imageSeed: "seafood-buffet",
  },
  {
    title: "Tour Du Lich Da Lat 2N1D",
    description: "Uu dai 500.000d cho tour du lich Da Lat 2 ngay 1 dem",
    categoryName: "Du lich",
    originalPrice: "2500000",
    discountType: "direct" as const,
    discountValue: "500000",
    validDurationDays: 120,
    totalQuantity: 20,
    imageSeed: "dalat-tour",
  },
  {
    title: "Ve Cong Vien Nuoc",
    description: "Giam 20% ve vao cong vien nuoc, ap dung ca cuoi tuan",
    categoryName: "Giai tri",
    originalPrice: "220000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 60,
    totalQuantity: 70,
    imageSeed: "water-park",
  },
];

const existingVoucherImageSeeds: Record<string, string> = {
  "Combo Lau Nuong 2 Nguoi": "hotpot-combo",
  "Goi Cham Soc Da Co Ban": "facial-spa",
  "Ve Xem Phim 2D": "cinema-ticket",
};

const reviewSeeds = [
  { title: "Combo Lau Nuong 2 Nguoi", rating: 5, comment: "Do an ngon, nhan vien phuc vu nhiet tinh, se quay lai." },
  { title: "Ve Xem Phim 2D", rating: 4, comment: "Doi mua khong lau, ghe ngoi thoai mai." },
  { title: "Ao Thun Basic Unisex", rating: 5, comment: "Vai mat, form dep, gia hop ly voi voucher giam gia." },
  { title: "The Tap Gym 1 Thang", rating: 4, comment: "May moc day du, PT huong dan tan tinh." },
  { title: "Tai Nghe Bluetooth Chinh Hang", rating: 5, comment: "Am thanh tot, pin trau, dong goi can than." },
  { title: "Tour Du Lich Da Lat 2N1D", rating: 5, comment: "Lich trinh hop ly, huong dan vien vui tinh, rat dang tien." },
];

async function main() {
  console.log("Seeding extra categories ...");
  const categoryIds: Record<string, string> = {};
  const allCategories = await db.query.category.findMany();
  for (const c of allCategories) categoryIds[c.name] = c.categoryId;

  for (const name of extraCategoryNames) {
    if (categoryIds[name]) continue;
    const [created] = await db.insert(category).values({ name }).returning();
    categoryIds[name] = created!.categoryId;
  }
  console.log(`Done — ${extraCategoryNames.length} extra categories ensured.`);

  console.log("Fixing placeholder images on original demo vouchers ...");
  for (const [title, seed] of Object.entries(existingVoucherImageSeeds)) {
    const existing = await db.query.voucherProduct.findFirst({ where: eq(voucherProduct.title, title) });
    if (existing && (!existing.imageUrl || existing.imageUrl.includes("example.com"))) {
      await db.update(voucherProduct).set({ imageUrl: picsum(seed) }).where(eq(voucherProduct.voucherProductId, existing.voucherProductId));
    }
  }
  console.log("Done — placeholder images replaced with real images.");

  const partner = await db.query.partnerProfile.findFirst({ where: eq(partnerProfile.partnerProfileCode, "PARTNER-DEMO-01") });
  const branch = await db.query.branchProfile.findFirst({ where: eq(branchProfile.branchProfileCode, "BRANCH-DEMO-01") });
  if (!partner || !branch) {
    throw new Error("Run `npm run db:seed` first — demo partner/branch not found.");
  }

  console.log("Seeding extra voucher products ...");
  const now = new Date();
  const endDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  for (const v of extraVoucherSeeds) {
    let product = await db.query.voucherProduct.findFirst({ where: eq(voucherProduct.title, v.title) });
    if (!product) {
      [product] = await db
        .insert(voucherProduct)
        .values({
          categoryId: categoryIds[v.categoryName]!,
          partnerProfileId: partner.partnerProfileId,
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
          imageUrl: picsum(v.imageSeed),
          status: "active",
        })
        .returning();
    }

    const existingAllocation = await db.query.branchVoucherProduct.findFirst({
      where: and(eq(branchVoucherProduct.branchProfileId, branch.branchProfileId), eq(branchVoucherProduct.voucherProductId, product!.voucherProductId)),
    });
    if (!existingAllocation) {
      await db.insert(branchVoucherProduct).values({
        branchProfileId: branch.branchProfileId,
        voucherProductId: product!.voucherProductId,
        totalQuantity: v.totalQuantity,
      });
    }
  }
  console.log(`Done — ${extraVoucherSeeds.length} extra voucher products ensured, allocated to demo branch.`);

  console.log("Seeding completed orders + reviews for demo depth ...");
  const customer = await db.query.customerProfile.findFirst({ where: eq(customerProfile.fullName, "Tran Thi Demo") });
  if (!customer) {
    throw new Error("Run `npm run db:seed` first — demo customer not found.");
  }

  let ordersCreated = 0;
  for (const r of reviewSeeds) {
    const product = await db.query.voucherProduct.findFirst({ where: eq(voucherProduct.title, r.title) });
    if (!product) continue;

    const existingReview = await db.query.review.findFirst({
      where: and(eq(review.customerProfileId, customer.customerProfileId), eq(review.voucherProductId, product.voucherProductId)),
    });
    if (existingReview) continue;

    const price = Number(product.originalPrice);
    const code = `ECV-DEMO-${randomUUID().slice(0, 8).toUpperCase()}`;
    const usedAt = new Date(now.getTime() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000);
    const expiredAt = new Date(usedAt.getTime() + product.validDurationDays * 24 * 60 * 60 * 1000);

    const [createdVoucherCode] = await db
      .insert(voucherCode)
      .values({
        voucherProductId: product.voucherProductId,
        customerProfileId: customer.customerProfileId,
        code,
        expiredAt,
        status: "used",
        usedAt,
      })
      .returning();

    const [createdOrder] = await db
      .insert(order)
      .values({
        customerProfileId: customer.customerProfileId,
        totalAmount: price.toString(),
        status: "completed",
        paymentCode: `PAY-${randomUUID().slice(0, 10).toUpperCase()}`,
        createdAt: usedAt,
        updatedAt: usedAt,
      })
      .returning();

    await db.insert(orderItem).values({
      orderId: createdOrder!.orderId,
      voucherProductId: product.voucherProductId,
      voucherCodeId: createdVoucherCode!.voucherCodeId,
      quantity: 1,
      unitPrice: product.originalPrice,
      createdAt: usedAt,
      updatedAt: usedAt,
    });

    await db.insert(payment).values({
      transactionId: `TXN-${randomUUID().slice(0, 12).toUpperCase()}`,
      orderId: createdOrder!.orderId,
      paymentMethod: "card",
      amount: product.originalPrice,
      currency: "VND",
      status: "success",
      paidAt: usedAt,
      createdAt: usedAt,
      updatedAt: usedAt,
    });

    await db.insert(review).values({
      customerProfileId: customer.customerProfileId,
      voucherProductId: product.voucherProductId,
      rating: r.rating,
      comment: r.comment,
      status: "active",
      createdAt: usedAt,
      updatedAt: usedAt,
    });

    ordersCreated += 1;
  }
  console.log(`Done — ${ordersCreated} completed orders + reviews ensured for demo customer.`);

  const allCategoriesNow = await db.query.category.findMany();
  const allVouchers = await db.query.voucherProduct.findMany();
  console.log(`\nTotals now: ${allCategoriesNow.length} categories, ${allVouchers.length} voucher products.`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Extra seeding failed:");
  console.error(error);
  process.exit(1);
});
