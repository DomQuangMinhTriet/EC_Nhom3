import { describe, expect, it } from "vitest";
import { getVoucher, getVouchers } from "@/features/vouchers/api";

describe("voucher browse happy path", () => {
  it("filters mock vouchers by category and search query while backend is unavailable", async () => {
    const results = await getVouchers({ category: "Ăn uống", query: "lotteria" });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ id: "lotteria-combo", brand: "Lotteria" });
  });

  it("resolves legacy landing slugs to canonical voucher IDs", async () => {
    await expect(getVoucher("cgv-cinema")).resolves.toMatchObject({ id: "cgv-popcorn" });
    await expect(getVoucher("sendo")).resolves.toMatchObject({ id: "sendo-fashion" });
  });
});
