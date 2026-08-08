import { ProtectedPage } from "@/components/auth/protected-page";
import { CartScreen } from "@/components/cart/cart-screen";
export default function CartPage() { return <ProtectedPage role="customer"><CartScreen/></ProtectedPage>; }
