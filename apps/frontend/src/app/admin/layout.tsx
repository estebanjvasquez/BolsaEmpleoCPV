import { Suspense } from "react";
import { PrivateNavigation } from "@/components/private-navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <><Suspense><PrivateNavigation role="admin" /></Suspense>{children}</>;
}
