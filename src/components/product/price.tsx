import { formatPrice } from "@/lib/format";

export function Price({
  amount,
  from = false,
  compareAt,
  size = "md",
}: {
  amount: number;
  from?: boolean;
  compareAt?: number;
  size?: "md" | "lg";
}) {
  const showCompare = compareAt !== undefined && compareAt > amount;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      {from && <span className="text-xs text-muted">vanaf</span>}
      <span className={`font-bold text-ink tabular-nums ${size === "lg" ? "text-2xl" : "text-base"}`}>
        {formatPrice(amount)}
      </span>
      {showCompare && (
        <span className="text-sm text-muted line-through tabular-nums">
          <span className="sr-only">Oude prijs </span>
          {formatPrice(compareAt)}
        </span>
      )}
    </p>
  );
}
