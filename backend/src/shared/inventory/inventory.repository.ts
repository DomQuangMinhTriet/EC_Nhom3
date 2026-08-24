import { eq, sum } from "drizzle-orm";
import { db } from "../../db/client";
import { branchVoucherProduct } from "../../db/schema";

export async function getAvailableStock(
  voucherProductId: string,
): Promise<number> {
  const result = await db
    .select({
      totalStock: sum(branchVoucherProduct.totalQuantity),
      totalSold: sum(branchVoucherProduct.soldQuantity),
    })
    .from(branchVoucherProduct)
    .where(eq(branchVoucherProduct.voucherProductId, voucherProductId));

  if (!result || result.length === 0) return 0;

  const totalStock = parseInt((result[0]?.totalStock as string) ?? "0", 10);
  const totalSold = parseInt((result[0]?.totalSold as string) ?? "0", 10);

  return Math.max(0, totalStock - totalSold);
}
