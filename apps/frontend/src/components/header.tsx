"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getAdminToken } from "@/lib/admin-auth";
import { getCompanyToken } from "@/lib/company-auth";
import { Logo } from "./logo";

export function Header() {
  const role = useSyncExternalStore(subscribe, () => getAdminToken() ? "admin" : getCompanyToken() ? "company" : "public", () => "public");
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface shadow-sm">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/vacantes" className="font-label text-label-md font-medium text-on-surface-variant transition-colors hover:text-secondary">Vacantes</Link>
          <Link href={role === "admin" ? "/admin" : role === "company" ? "/search" : "/company/login"} className="font-label text-label-md font-medium text-on-surface-variant transition-colors hover:text-secondary active:opacity-80">{role === "admin" ? "Volver a administración" : role === "company" ? "Mi panel" : "Iniciar Sesión"}</Link>
        </div>
      </div>
    </header>
  );
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("cpv-auth", listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener("cpv-auth", listener); };
}
