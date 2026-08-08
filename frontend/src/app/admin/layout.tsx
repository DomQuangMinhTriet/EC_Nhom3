import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
export default function AdminLayout({ children }: { children: ReactNode }) { return <ProtectedPage role="admin">{children}</ProtectedPage>; }
