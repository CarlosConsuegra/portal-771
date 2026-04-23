import Link from "next/link";

type PublicFooterNavProps = {
  className?: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function PublicFooterNav({
  className = "",
  primaryHref = "/manifiesto",
  primaryLabel = "manifiesto",
}: PublicFooterNavProps) {
  return (
    <nav
      aria-label="Navegacion publica"
      className={`flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[0.76rem] tracking-[0.02em] text-muted ${className}`.trim()}
    >
      <Link href={primaryHref} className="transition-opacity hover:opacity-70">
        {primaryLabel}
      </Link>
      <span aria-hidden="true">|</span>
      <Link href="/contacto" className="transition-opacity hover:opacity-70">
        contacto
      </Link>
      <span aria-hidden="true">|</span>
      <span>@2026</span>
    </nav>
  );
}
