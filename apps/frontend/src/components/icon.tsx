interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

/** Material Symbols Outlined glyph — the font is loaded once in the root layout. */
export function Icon({ name, className, filled = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className ?? ""}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
