"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/hooks/queries/use-cart";
import { useAuthSession } from "@/features/auth/auth-session-provider";
import { useToast } from "@/components/common/toast";
import type { VoucherProduct } from "@/features/vouchers/voucher-product-api";

export function AddToCartButton({ voucher }: { voucher: VoucherProduct }) {
  const router = useRouter();
  const toast = useToast();
  const { session } = useAuthSession();
  const addToCart = useAddToCart();

  function handleClick() {
    if (!session) {
      toast("Vui lòng đăng nhập để thêm voucher vào giỏ hàng.", "info");
      router.push("/login");
      return;
    }

    addToCart.mutate(
      { voucherProductId: voucher.voucherProductId },
      {
        onSuccess: () => {
          toast("Đã thêm voucher vào giỏ hàng.");
          router.push("/cart");
        },
        onError: (error) => toast(error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng.", "error"),
      },
    );
  }

  return (
    <Button fullWidth size="lg" disabled={addToCart.isPending} onClick={handleClick}>
      {addToCart.isPending ? "Đang thêm..." : "Thêm vào giỏ hàng"}
    </Button>
  );
}
