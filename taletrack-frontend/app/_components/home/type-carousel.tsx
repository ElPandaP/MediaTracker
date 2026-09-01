'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Cover, typeMeta } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import type { LibraryItem, LibraryType } from '@/lib/types';

export function TypeCarousel({
  type,
  items,
}: {
  type: LibraryType;
  items: LibraryItem[];
}) {
  const meta = typeMeta[type];
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section aria-labelledby={`carousel-${type}`}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id={`carousel-${type}`} className="font-heading text-lg font-semibold">
          {meta.plural}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/library?type=${type}`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {items.length} · see all →
          </Link>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={atStart}
              aria-label={`${meta.plural}: previous`}
              className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={atEnd}
              aria-label={`${meta.plural}: next`}
              className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No {meta.plural.toLowerCase()} tracked yet.
        </p>
      ) : (
        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
        >
          {items.map((item) => (
            <figure key={item.mediaId} className="w-[92px] shrink-0 snap-start">
              <Cover
                title={item.title}
                type={item.type}
                posterUrl={item.posterUrl}
                sizes="92px"
              />
              <figcaption className="mt-1.5">
                <p className="line-clamp-2 text-xs leading-tight text-foreground">{item.title}</p>
                {item.myRating != null && (
                  <StarRating stars={toStars(item.myRating)} className="mt-0.5" />
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
