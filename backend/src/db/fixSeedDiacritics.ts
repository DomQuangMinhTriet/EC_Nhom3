import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client.js";
import { category, voucherProduct, review } from "./schema/index.js";

/**
 * One-time fix for seed.ts/seedExtra.ts: the original demo data was typed
 * without Vietnamese diacritics, and the placeholder Lorem Picsum photos on
 * voucher products don't match their titles. This adds proper diacritics and
 * clears imageUrl so voucher cards fall back to the category icon
 * (frontend/src/lib/category-icon.ts) instead of a mismatched stock photo.
 * Idempotent — matches by the old (no-diacritics) text, so re-running after
 * the fix has already applied is a no-op.
 */

const categoryRenames: Record<string, string> = {
  "Am thuc": "Ẩm thực",
  "Lam dep": "Làm đẹp",
  "Giai tri": "Giải trí",
  "Du lich": "Du lịch",
  "Thoi trang": "Thời trang",
  "Suc khoe": "Sức khỏe",
  "Cong nghe": "Công nghệ",
  "The thao": "Thể thao",
};

const voucherFixes: { oldTitle: string; title: string; description: string }[] = [
  { oldTitle: "Combo Lau Nuong 2 Nguoi", title: "Combo Lẩu Nướng 2 Người", description: "Giảm 20% cho combo lẩu nướng dành cho 2 người" },
  { oldTitle: "Goi Cham Soc Da Co Ban", title: "Gói Chăm Sóc Da Cơ Bản", description: "Ưu đãi gói chăm sóc da mặt cơ bản tại spa đối tác" },
  { oldTitle: "Ve Xem Phim 2D", title: "Vé Xem Phim 2D", description: "Vé xem phim 2D suất chiếu bất kỳ trong tuần" },
  { oldTitle: "Ao Thun Basic Unisex", title: "Áo Thun Basic Unisex", description: "Giảm 25% cho tất cả áo thun basic unisex, nhiều màu sắc" },
  { oldTitle: "Giay Sneaker The Thao", title: "Giày Sneaker Thể Thao", description: "Ưu đãi 100.000đ cho giày sneaker thể thao chính hãng" },
  { oldTitle: "Goi Kham Suc Khoe Tong Quat", title: "Gói Khám Sức Khỏe Tổng Quát", description: "Giảm 30% gói khám sức khỏe tổng quát tại phòng khám đối tác" },
  { oldTitle: "The Tap Gym 1 Thang", title: "Thẻ Tập Gym 1 Tháng", description: "Thẻ tập gym 1 tháng không giới hạn, tặng 2 buổi PT" },
  { oldTitle: "Tai Nghe Bluetooth Chinh Hang", title: "Tai Nghe Bluetooth Chính Hãng", description: "Giảm 150.000đ cho tai nghe bluetooth chính hãng" },
  { oldTitle: "Sac Du Phong 10000mAh", title: "Sạc Dự Phòng 10000mAh", description: "Ưu đãi 20% cho sạc dự phòng dung lượng 10000mAh" },
  { oldTitle: "Ve San Bong Da Mini", title: "Vé Sân Bóng Đá Mini", description: "Giảm 15% chi phí thuê sân bóng đá mini theo giờ" },
  { oldTitle: "Combo Buffet Hai San", title: "Combo Buffet Hải Sản", description: "Giảm 25% combo buffet hải sản cho 2 người" },
  { oldTitle: "Tour Du Lich Da Lat 2N1D", title: "Tour Du Lịch Đà Lạt 2N1Đ", description: "Ưu đãi 500.000đ cho tour du lịch Đà Lạt 2 ngày 1 đêm" },
  { oldTitle: "Ve Cong Vien Nuoc", title: "Vé Công Viên Nước", description: "Giảm 20% vé vào công viên nước, áp dụng cả cuối tuần" },
];

const reviewFixes: { voucherOldTitle: string; comment: string }[] = [
  { voucherOldTitle: "Combo Lau Nuong 2 Nguoi", comment: "Đồ ăn ngon, nhân viên phục vụ nhiệt tình, sẽ quay lại." },
  { voucherOldTitle: "Ve Xem Phim 2D", comment: "Đợi mua không lâu, ghế ngồi thoải mái." },
  { voucherOldTitle: "Ao Thun Basic Unisex", comment: "Vải mát, form đẹp, giá hợp lý với voucher giảm giá." },
  { voucherOldTitle: "The Tap Gym 1 Thang", comment: "Máy móc đầy đủ, PT hướng dẫn tận tình." },
  { voucherOldTitle: "Tai Nghe Bluetooth Chinh Hang", comment: "Âm thanh tốt, pin trâu, đóng gói cẩn thận." },
  { voucherOldTitle: "Tour Du Lich Da Lat 2N1D", comment: "Lịch trình hợp lý, hướng dẫn viên vui tính, rất đáng tiền." },
];

async function main() {
  console.log("Fixing category diacritics ...");
  let categoriesFixed = 0;
  for (const [oldName, newName] of Object.entries(categoryRenames)) {
    const existing = await db.query.category.findFirst({ where: eq(category.name, oldName) });
    if (existing) {
      await db.update(category).set({ name: newName }).where(eq(category.categoryId, existing.categoryId));
      categoriesFixed += 1;
    }
  }
  console.log(`Done — ${categoriesFixed} categories fixed.`);

  console.log("Fixing voucher title/description diacritics and clearing mismatched images ...");
  const voucherIdByOldTitle: Record<string, string> = {};
  let vouchersFixed = 0;
  for (const v of voucherFixes) {
    const existing = await db.query.voucherProduct.findFirst({ where: eq(voucherProduct.title, v.oldTitle) });
    if (existing) {
      voucherIdByOldTitle[v.oldTitle] = existing.voucherProductId;
      await db
        .update(voucherProduct)
        .set({ title: v.title, description: v.description, imageUrl: null })
        .where(eq(voucherProduct.voucherProductId, existing.voucherProductId));
      vouchersFixed += 1;
    } else {
      // Already renamed in a previous run — still make sure the image is cleared.
      const renamed = await db.query.voucherProduct.findFirst({ where: eq(voucherProduct.title, v.title) });
      if (renamed) {
        voucherIdByOldTitle[v.oldTitle] = renamed.voucherProductId;
        if (renamed.imageUrl) {
          await db.update(voucherProduct).set({ imageUrl: null }).where(eq(voucherProduct.voucherProductId, renamed.voucherProductId));
        }
      }
    }
  }
  console.log(`Done — ${vouchersFixed} vouchers fixed.`);

  console.log("Fixing review comment diacritics ...");
  let reviewsFixed = 0;
  for (const r of reviewFixes) {
    const voucherProductId = voucherIdByOldTitle[r.voucherOldTitle];
    if (!voucherProductId) continue;
    const existingReview = await db.query.review.findFirst({ where: eq(review.voucherProductId, voucherProductId) });
    if (existingReview && existingReview.comment !== r.comment) {
      await db.update(review).set({ comment: r.comment }).where(eq(review.reviewId, existingReview.reviewId));
      reviewsFixed += 1;
    }
  }
  console.log(`Done — ${reviewsFixed} reviews fixed.`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fix failed:");
  console.error(error);
  process.exit(1);
});
