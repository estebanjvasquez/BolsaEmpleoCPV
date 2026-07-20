interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

/**
 * Placeholder wordmark — swap for the real Cámara Petrolera de Venezuela
 * logo asset once supplied; this only exists so the header/footer aren't empty.
 */
export function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-md font-headline text-sm font-bold ${
          isLight ? "bg-surface text-primary-container" : "bg-primary-container text-on-primary"
        }`}
      >
        CPV
      </span>
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
