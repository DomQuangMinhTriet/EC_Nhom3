import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
export default function PartnerLayout({ children }: { children: ReactNode }) { return <ProtectedPage role="partner">{children}</ProtectedPage>; }
