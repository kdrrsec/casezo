import Link from "next/link";

const links = [
  { label: "Klantenservice", href: "/klantenservice" },
  { label: "Contact", href: "/contact" },
  { label: "Veelgestelde vragen", href: "/veelgestelde-vragen" },
  { label: "Verzending en retourneren", href: "/verzending-en-retourneren" },
  { label: "Privacyverklaring", href: "/privacy" },
  { label: "Algemene voorwaarden", href: "/algemene-voorwaarden" },
];

export function ServiceNav({ current }: { current: string }) {
  return (
    <aside aria-label="Klantenservice" className="lg:pt-12">
      <nav className="rounded-md border border-line bg-surface p-2">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={l.href === current ? "page" : undefined}
                className={`block rounded px-3 py-2 text-sm ${
                  l.href === current ? "bg-white font-semibold text-primary" : "text-ink-soft hover:bg-white hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
