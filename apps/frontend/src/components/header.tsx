import Link from "next/link";
import { Logo } from "./logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface shadow-sm">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <Link
          href="/company/login"
          className="font-label text-label-md font-medium text-on-surface-variant transition-colors duration-200 hover:text-secondary active:opacity-80"
        >
          Iniciar Sesión
        </Link>
      </div>
    </header>
  );
}
