"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import type { Voucher } from "@/lib/mocks/vouchers";
import { useToast } from "@/components/common/toast";
export function AddToCartButton({ voucher }: { voucher: Voucher }) { const add = useCartStore((state) => state.add); const router = useRouter(); const toast = useToast(); return <Button fullWidth size="lg" onClick={() => { add(voucher); toast("Đã thêm voucher vào giỏ hàng."); router.push("/cart"); }}>Thêm vào giỏ hàng</Button>; }
