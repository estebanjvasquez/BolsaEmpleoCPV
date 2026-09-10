import Image from "next/image";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

/** Shared institutional mark used by the header and footer. */
export function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/brand/logo-camara-petrolera.svg"
        alt="Cámara Petrolera de Venezuela"
        width={48}
        height={48}
        className={`h-12 w-12 object-contain ${isLight ? "brightness-0 invert" : ""}`}
      />
      <span
        className={`hidden font-headline text-headline-md font-semibold md:block ${
          isLight ? "text-surface" : "text-primary-container"
        }`}
      >
        Cámara Petrolera
      </span>
    </div>
  );
}
