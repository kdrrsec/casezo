import { TriangleAlert } from "lucide-react";

/**
 * Markeringen voor gegevens die de eigenaar nog moet aanleveren.
 *
 * Alleen zichtbaar tijdens ontwikkeling of met NEXT_PUBLIC_SHOW_OWNER_NOTES=1.
 * Op de live site verdwijnen ze, en worden ontbrekende gegevens weggelaten
 * in plaats van verzonnen.
 */
export const showOwnerNotes =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_OWNER_NOTES === "1";

export function Placeholder({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
  if (!showOwnerNotes) return null;
  if (inline) {
    return (
      <span className="rounded border border-dashed border-warning/60 bg-warning/5 px-1.5 py-0.5 text-sm text-warning">
        Nog in te vullen: {children}
      </span>
    );
  }
  return (
    <div className="my-3 flex gap-2 rounded-md border border-dashed border-warning/60 bg-warning/5 px-4 py-3 text-sm text-warning">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
      <div>
        <strong className="font-semibold">Nog in te vullen:</strong> {children}
      </div>
    </div>
  );
}

export type InfoRow = { label: string; value: React.ReactNode | null; todo: string };

/**
 * Definitielijst die ontbrekende waarden overslaat (of markeert tijdens
 * ontwikkeling). Rendert niets als er niets te tonen is.
 */
export function InfoList({ rows, title }: { rows: InfoRow[]; title?: string }) {
  const visible = rows.filter((r) => r.value !== null || showOwnerNotes);
  if (visible.length === 0) return null;
  return (
    <>
    {title && <h2>{title}</h2>}
    <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {visible.map((r) => (
        <div key={r.label} className="contents">
          <dt className="font-medium">{r.label}</dt>
          <dd className="text-ink-soft">{r.value ?? <Placeholder inline>{r.todo}</Placeholder>}</dd>
        </div>
      ))}
    </dl>
    </>
  );
}
