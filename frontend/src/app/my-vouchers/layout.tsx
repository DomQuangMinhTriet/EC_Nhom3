import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
export default function MyVouchersLayout({ children }: { children: ReactNode }) { return <ProtectedPage role="customer">{children}</ProtectedPage>; }
