import type { ReactNode } from "react";
import { ProtectedPage } from "@/components/auth/protected-page";
export default function BranchLayout({ children }: { children: ReactNode }) { return <ProtectedPage role="branch">{children}</ProtectedPage>; }
