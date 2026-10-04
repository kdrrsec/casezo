import { Magnet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ProductCardData } from "@/lib/catalog/cards";

import { Price } from "./price";
import { StockLabel } from "./stock-label";

export function ProductCard({
  product,
  priority = false,
  highPriority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
  /** Eerste kaarten boven de vouw: met voorrang laden. */
  highPriority?: boolean;
}) {
  const soldOut = product.stock.status === "out";
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-primary-line hover:shadow-pop">
      <div className="relative aspect-square bg-surface">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={highPriority ? "high" : "auto"}
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 48vw"
            className={`object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06] ${soldOut ? "opacity-60" : ""}`}
          />
        )}
        {product.magsafe && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-card">
            <Magnet
              className="size-3 text-primary"
              strokeWidth={2.25}
              aria-hidden
            />
            MagSafe
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5em] text-sm leading-[1.25] font-semibold text-ink sm:text-[0.9375rem]">
          <Link
            href={product.href}
            className="after:absolute after:inset-0 hover:text-primary"
          >
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 min-h-[1.4em] text-xs text-ink-soft sm:text-[0.8125rem]">
          {product.compatibility}
        </p>
        {product.colors.length > 1 && <Swatches colors={product.colors} />}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-3">
          <Price
            amount={product.price}
            from={product.priceFrom}
            compareAt={product.compareAtPrice}
          />
          <StockLabel stock={product.stock} />
        </div>
      </div>
    </article>
  );
}

function Swatches({ colors }: { colors: ProductCardData["colors"] }) {
  const shown = colors.slice(0, 5);
  return (
    <p className="mt-2 flex items-center gap-1">
      <span className="sr-only">{`${colors.length} kleuren: ${colors.map((c) => c.name).join(", ")}`}</span>
      {shown.map((c) => (
        <span
          key={c.name}
          className="size-3.5 rounded-full ring-1 ring-black/15 ring-inset"
          style={{ backgroundColor: c.hex }}
          aria-hidden
        />
      ))}
      {colors.length > shown.length && (
        <span className="ml-0.5 text-xs text-muted" aria-hidden>
          +{colors.length - shown.length}
        </span>
      )}
    </p>
  );
}

export function ProductGrid({
  products,
  className = "",
}: {
  products: ProductCardData[];
  className?: string;
}) {
  return (
    <ul
      className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${className}`}
    >
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} highPriority={i < 2} />
        </li>
      ))}
    </ul>
  );
}
