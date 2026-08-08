import { ProtectedPage } from "@/components/auth/protected-page";
import { CheckoutScreen } from "@/components/cart/checkout-screen";
export default function CheckoutPage() { return <ProtectedPage role="customer"><CheckoutScreen/></ProtectedPage>; }
