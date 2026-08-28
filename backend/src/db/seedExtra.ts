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
 * products, and a handful of completed orders + reviews so the
 * Dashboard/Reports pages and public voucher pages don't look empty during
 * grading. No imageUrl is set — voucher cards fall back to a category icon
 * (frontend/src/lib/category-icon.ts) instead of a stock photo that doesn't
 * match the product. Idempotent — safe to re-run.
 */

const extraCategoryNames = ["Thời trang", "Sức khỏe", "Công nghệ", "Thể thao"];

const extraVoucherSeeds = [
  {
    title: "Áo Thun Basic Unisex",
    description: "Giảm 25% cho tất cả áo thun basic unisex, nhiều màu sắc",
    categoryName: "Thời trang",
    originalPrice: "250000",
    discountType: "percentage" as const,
    discountValue: "25",
    validDurationDays: 60,
    totalQuantity: 80,
  },
  {
    title: "Giày Sneaker Thể Thao",
    description: "Ưu đãi 100.000đ cho giày sneaker thể thao chính hãng",
    categoryName: "Thời trang",
    originalPrice: "890000",
    discountType: "direct" as const,
    discountValue: "100000",
    validDurationDays: 45,
    totalQuantity: 40,
  },
  {
    title: "Gói Khám Sức Khỏe Tổng Quát",
    description: "Giảm 30% gói khám sức khỏe tổng quát tại phòng khám đối tác",
    categoryName: "Sức khỏe",
    originalPrice: "1200000",
    discountType: "percentage" as const,
    discountValue: "30",
    validDurationDays: 90,
    totalQuantity: 25,
  },
  {
    title: "Thẻ Tập Gym 1 Tháng",
    description: "Thẻ tập gym 1 tháng không giới hạn, tặng 2 buổi PT",
    categoryName: "Sức khỏe",
    originalPrice: "600000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 30,
    totalQuantity: 60,
  },
  {
    title: "Tai Nghe Bluetooth Chính Hãng",
    description: "Giảm 150.000đ cho tai nghe bluetooth chính hãng",
    categoryName: "Công nghệ",
    originalPrice: "990000",
    discountType: "direct" as const,
    discountValue: "150000",
    validDurationDays: 60,
    totalQuantity: 35,
  },
  {
    title: "Sạc Dự Phòng 10000mAh",
    description: "Ưu đãi 20% cho sạc dự phòng dung lượng 10000mAh",
    categoryName: "Công nghệ",
    originalPrice: "450000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 60,
    totalQuantity: 50,
  },
  {
    title: "Vé Sân Bóng Đá Mini",
    description: "Giảm 15% chi phí thuê sân bóng đá mini theo giờ",
    categoryName: "Thể thao",
    originalPrice: "300000",
    discountType: "percentage" as const,
    discountValue: "15",
    validDurationDays: 45,
    totalQuantity: 45,
  },
  {
    title: "Combo Buffet Hải Sản",
    description: "Giảm 25% combo buffet hải sản cho 2 người",
    categoryName: "Ẩm thực",
    originalPrice: "798000",
    discountType: "percentage" as const,
    discountValue: "25",
    validDurationDays: 30,
    totalQuantity: 40,
  },
  {
    title: "Tour Du Lịch Đà Lạt 2N1Đ",
    description: "Ưu đãi 500.000đ cho tour du lịch Đà Lạt 2 ngày 1 đêm",
    categoryName: "Du lịch",
    originalPrice: "2500000",
    discountType: "direct" as const,
    discountValue: "500000",
    validDurationDays: 120,
    totalQuantity: 20,
  },
  {
    title: "Vé Công Viên Nước",
    description: "Giảm 20% vé vào công viên nước, áp dụng cả cuối tuần",
    categoryName: "Giải trí",
    originalPrice: "220000",
    discountType: "percentage" as const,
    discountValue: "20",
    validDurationDays: 60,
    totalQuantity: 70,
  },
];

const reviewSeeds = [
  { title: "Combo Lẩu Nướng 2 Người", rating: 5, comment: "Đồ ăn ngon, nhân viên phục vụ nhiệt tình, sẽ quay lại." },
  { title: "Vé Xem Phim 2D", rating: 4, comment: "Đợi mua không lâu, ghế ngồi thoải mái." },
  { title: "Áo Thun Basic Unisex", rating: 5, comment: "Vải mát, form đẹp, giá hợp lý với voucher giảm giá." },
  { title: "Thẻ Tập Gym 1 Tháng", rating: 4, comment: "Máy móc đầy đủ, PT hướng dẫn tận tình." },
  { title: "Tai Nghe Bluetooth Chính Hãng", rating: 5, comment: "Âm thanh tốt, pin trâu, đóng gói cẩn thận." },
  { title: "Tour Du Lịch Đà Lạt 2N1Đ", rating: 5, comment: "Lịch trình hợp lý, hướng dẫn viên vui tính, rất đáng tiền." },
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
