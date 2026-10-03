import { TriangleAlert } from "lucide-react";

/**
 * Duidelijke markering voor gegevens of beleid dat de eigenaar nog moet
 * aanleveren. Bewust opvallend, zodat er niets verzonnens online komt.
 */
export function Placeholder({ children, inline = false }: { children: React.ReactNode; inline?: boolean }) {
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

/** Waarde uit de winkelconfiguratie, of een markering als die ontbreekt. */
export function ConfigValue({ value, label }: { value: string | number | null; label: string }) {
  return value === null || value === "" ? <Placeholder inline>{label}</Placeholder> : <>{value}</>;
}
