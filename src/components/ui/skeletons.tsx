/** Grijze placeholders die de vorm van de pagina tonen terwijl data laadt. */

function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line/70 ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <div className="aspect-square animate-pulse bg-surface" />
      <div className="space-y-2 p-3.5">
        <Block className="h-3 w-16" />
        <Block className="h-4 w-4/5" />
        <Block className="h-3 w-3/5" />
        <div className="flex justify-between pt-2">
          <Block className="h-5 w-16" />
          <Block className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6" aria-busy="true" aria-label="Producten laden">
      <Block className="h-4 w-48" />
      <Block className="mt-4 h-8 w-64" />
      <Block className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-6 lg:grid lg:grid-cols-[15.5rem_1fr] lg:gap-8">
        <div className="hidden space-y-6 lg:block">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2.5">
              <Block className="h-4 w-28" />
              <Block className="h-3.5 w-40" />
              <Block className="h-3.5 w-36" />
              <Block className="h-3.5 w-32" />
            </div>
          ))}
        </div>
        <div>
          <div className="mb-4 flex justify-end">
            <Block className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-shop pt-4 pb-8 lg:pt-6" aria-busy="true" aria-label="Product laden">
      <Block className="h-4 w-56" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="aspect-square animate-pulse rounded-md bg-surface" />
        <div className="space-y-4">
          <Block className="h-4 w-32" />
          <Block className="h-8 w-3/4" />
          <Block className="h-7 w-24" />
          <Block className="h-4 w-2/3" />
          <Block className="h-4 w-1/2" />
          <div className="flex flex-wrap gap-2 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <Block key={i} className="h-10 w-28" />
            ))}
          </div>
          <Block className="mt-4 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
