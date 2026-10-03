import type { StockState } from "@/lib/catalog/cards";

const styles: Record<StockState["status"], { text: string; dot: string }> = {
  in: { text: "text-success", dot: "bg-success" },
  low: { text: "text-warning", dot: "bg-warning" },
  out: { text: "text-muted", dot: "bg-line-strong" },
};

export function StockLabel({ stock }: { stock: StockState }) {
  const s = styles[stock.status];
  return (
    <p className={`flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`size-2 rounded-full ${s.dot}`} aria-hidden />
      {stock.label}
    </p>
  );
}
