import { Suspense } from "react";
import { PrivateNavigation } from "@/components/private-navigation";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <><Suspense><PrivateNavigation role="company" /></Suspense>{children}</>;
}
