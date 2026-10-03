import Image from "next/image";
import Link from "next/link";

import type { ProductCardData } from "@/lib/catalog/cards";

import { Price } from "./price";
import { StockLabel } from "./stock-label";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-line-strong">
      <div className="relative aspect-square bg-surface">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 48vw"
            className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{product.brand}</p>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-ink sm:text-[0.9375rem]">
          <Link href={product.href} className="after:absolute after:inset-0 hover:text-primary">
            {product.title}
          </Link>
        </h3>
        {product.compatibility && (
          <p className="line-clamp-1 text-xs text-ink-soft sm:text-[0.8125rem]">{product.compatibility}</p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-2">
          <Price amount={product.price} from={product.priceFrom} compareAt={product.compareAtPrice} />
          <StockLabel stock={product.stock} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = "" }: { products: ProductCardData[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${className}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
