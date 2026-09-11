"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";
import { clearCompanyToken, getCompanyToken } from "@/lib/company-auth";

export function PrivateNavigation({ role }: { role: "admin" | "company" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const publicPage = pathname.endsWith("/login") || pathname.endsWith("/register") || pathname.includes("/reset-password") || pathname.includes("/forgot-password");
  useEffect(() => {
    const check = () => {
      if (!publicPage && !(role === "admin" ? getAdminToken() : getCompanyToken())) {
        router.replace(role === "admin" ? "/admin/login" : "/company/login");
      }
    };
    check();
    window.addEventListener("cpv-auth", check);
    window.addEventListener("storage", check);
    return () => { window.removeEventListener("cpv-auth", check); window.removeEventListener("storage", check); };
  }, [publicPage, role, router, pathname]);
  if (publicPage) return null;
  const links = role === "admin" ? [
    ["/admin?tab=moderation", "Profesionales"], ["/admin?tab=companies", "Empresas"],
    ["/admin?tab=vacancies", "Vacantes"], ["/admin/contacts", "Contactos"],
    ["/admin?tab=catalogs", "Catálogos"], ["/admin/stats", "Estadísticas"], ["/admin/emails", "Correos"],
  ] : [["/search", "Buscar talento"], ["/company/vacancies", "Mis vacantes"], ["/company/profile", "Mi empresa"]];
  return <nav aria-label={role === "admin" ? "Administración" : "Área de empresa"} className="border-b border-border-subtle bg-surface-container-lowest">
    <div className="mx-auto flex max-w-container-max flex-wrap items-center gap-2 px-margin-mobile py-3 md:px-margin-desktop">
      {links.map(([href, label]) => {
        const [path, query] = href.split("?");
        const active = pathname === path && (!query || (params.get("tab") ?? "moderation") === new URLSearchParams(query).get("tab"));
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-2 font-label text-label-sm ${active ? "bg-primary-container text-on-primary" : "text-primary-container hover:bg-surface-container"}`}>{label}</Link>;
      })}
      <Link href="/" className="px-3 py-2 font-label text-label-sm text-on-surface-variant">Ver portal</Link>
      <button type="button" className="ml-auto px-3 py-2 font-label text-label-sm text-on-surface-variant" onClick={() => {
        if (role === "admin") clearAdminToken(); else clearCompanyToken();
        router.push(role === "admin" ? "/admin/login" : "/company/login");
      }}>Cerrar sesión</button>
    </div>
  </nav>;
}
