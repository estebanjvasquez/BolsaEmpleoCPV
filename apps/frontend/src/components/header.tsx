"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getAdminToken } from "@/lib/admin-auth";
import { getCompanyToken } from "@/lib/company-auth";
import { Logo } from "./logo";

export function Header() {
  const role = useSyncExternalStore(subscribe, () => getAdminToken() ? "admin" : getCompanyToken() ? "company" : "public", () => "public");
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d6d9dc] bg-white shadow-[0_1px_10px_rgba(23,33,44,0.07)]">
      <div className="border-b border-[#e2e4e6] bg-[#17212c]">
        <div className="mx-auto flex h-8 max-w-container-max items-center justify-end px-margin-mobile md:px-margin-desktop">
          <a href="https://camarapetrolera.org/" className="font-label text-[11px] uppercase tracking-[0.12em] text-[#dfe5e8] hover:text-[#f0c675]">Cámara Petrolera de Venezuela</a>
        </div>
      </div>
      <div className="mx-auto flex h-[72px] max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/vacantes" className="font-label text-label-md font-medium text-[#344250] transition-colors hover:text-[#8b5d17]">Vacantes</Link>
          <Link href={role === "admin" ? "/admin" : role === "company" ? "/search" : "/company/login"} className="rounded-md bg-[#17212c] px-4 py-2 font-label text-label-sm text-white transition hover:bg-[#344250] active:translate-y-px">{role === "admin" ? "Administración" : role === "company" ? "Mi panel" : "Ingresar"}</Link>
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
