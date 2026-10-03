import Link from "next/link";

/**
 * Tijdelijk tekstlogo. Vervang de inhoud van deze component door een
 * <Image> met het echte logo zodra dat beschikbaar is.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline text-[1.625rem] leading-none font-extrabold tracking-[-0.04em] text-ink ${className}`}
      aria-label="Casezo – naar de homepage"
    >
      Case<span className="text-primary">zo</span>
    </Link>
  );
}
