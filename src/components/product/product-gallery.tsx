"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { ProductImage } from "@/lib/catalog/types";

/**
 * Productgalerij.
 * - Mobiel: veegbare rij foto's met stippen.
 * - Groter: miniaturen naast de hoofdfoto.
 * - Tik/klik op een foto opent een vergroting met pijltjes en veegbediening.
 */
/**
 * Zelfde `sizes` voor de mobiele en de desktopweergave: de browser kiest dan
 * hetzelfde bestand en downloadt de hoofdfoto maar één keer.
 */
const GALLERY_SIZES = "(min-width: 1024px) 45vw, (min-width: 640px) 80vw, 100vw";

export function ProductGallery({
  images,
  title,
  illustrative,
}: {
  images: ProductImage[];
  title: string;
  illustrative: boolean;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="aspect-square rounded-md border border-line bg-surface" aria-label={`Geen foto van ${title}`} />;
  }

  const select = (i: number) => {
    setActive(i);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  const caption = illustrative && (
    <p aria-hidden className="pointer-events-none absolute right-3 bottom-2 text-xs text-muted">
      Afbeelding ter illustratie
    </p>
  );

  return (
    <div className="lg:sticky lg:top-4 lg:self-start">
      {/* Mobiel: veegbaar */}
      <div className="sm:hidden">
        <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-md border border-line bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const el = event.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          aria-label="Productfoto's, veeg om te bladeren"
        >
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setZoomed(true)}
              className="relative aspect-square w-full shrink-0 snap-center"
              aria-label={`Foto ${i + 1} van ${images.length} vergroten`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                loading={i === 0 ? "eager" : "lazy"}
                sizes={GALLERY_SIZES}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="object-contain"
              />
            </button>
          ))}
        </div>
        {caption}
        </div>
        {images.length > 1 && (
          <div className="mt-1 flex justify-center">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => select(i)}
                aria-label={`Toon foto ${i + 1}`}
                aria-current={i === active}
                className="flex h-8 min-w-8 items-center justify-center px-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-line-strong"}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tablet en desktop: miniaturen + hoofdfoto */}
      <div className="hidden gap-3 sm:flex">
        {images.length > 1 && (
          <ul className="flex flex-col gap-2" aria-label="Productfoto's">
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  aria-label={`Toon foto ${i + 1} van ${images.length}`}
                  aria-current={i === active}
                  className={`relative block size-20 overflow-hidden rounded border bg-surface transition-colors ${
                    i === active ? "border-primary ring-1 ring-primary" : "border-line hover:border-line-strong"
                  }`}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-contain" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-md border border-line bg-surface"
          aria-label="Foto vergroten"
        >
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            fetchPriority="high"
            sizes={GALLERY_SIZES}
            className="animate-[fade-in_200ms_ease-out] object-contain"
          />
          <span className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-soft opacity-0 shadow-card transition-opacity group-hover:opacity-100">
            <ZoomIn className="size-4" strokeWidth={2} aria-hidden />
          </span>
        </button>
        {caption}
        </div>
      </div>

      {zoomed && (
        <Lightbox
          images={images}
          start={active}
          title={title}
          onClose={(index) => {
            setZoomed(false);
            setActive(index);
          }}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  start,
  title,
  onClose,
}: {
  images: ProductImage[];
  start: number;
  title: string;
  onClose: (index: number) => void;
}) {
  const [index, setIndex] = useState(start);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(start);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const scrollTo = (i: number, smooth = true) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (i + images.length) % images.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth ? "smooth" : "instant" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: start * track.clientWidth, behavior: "instant" });
    closeRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      const t = trackRef.current;
      if (!t) return;
      const current = Math.round(t.scrollLeft / t.clientWidth);
      if (event.key === "Escape") onCloseRef.current(indexRef.current);
      if (event.key === "ArrowRight") t.scrollTo({ left: ((current + 1) % images.length) * t.clientWidth, behavior: "smooth" });
      if (event.key === "ArrowLeft") {
        t.scrollTo({ left: ((current - 1 + images.length) % images.length) * t.clientWidth, behavior: "smooth" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
    };
  }, [start, images.length]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto's van ${title}`}
      className="fixed inset-0 z-[70] flex animate-[fade-in_150ms_ease-out] flex-col bg-white"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-muted tabular-nums">
          {index + 1} / {images.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose(index)}
          className="flex size-10 items-center justify-center rounded-md hover:bg-surface"
          aria-label="Vergroting sluiten"
        >
          <X className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const el = event.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            indexRef.current = i;
            if (i !== index) setIndex(i);
          }}
        >
          {images.map((img) => (
            <div key={img.url} className="relative h-full w-full shrink-0 snap-center">
              <Image src={img.url} alt={img.alt} fill sizes="100vw" quality={90} className="object-contain" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-card hover:bg-surface"
              aria-label="Vorige foto"
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-card hover:bg-surface"
              aria-label="Volgende foto"
            >
              <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
