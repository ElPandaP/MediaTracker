'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Cover, typeMeta } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import { ReviewModal, type ReviewTarget } from '@/components/media/review-modal';
import { cn } from '@/lib/utils';
import type { LibraryItem, LibraryType } from '@/lib/types';

type Tab = 'all' | LibraryType;
type SortKey = 'newest' | 'oldest' | 'rating_high' | 'rating_low';
type StatusKey = 'all' | 'reading' | 'done';
type ReviewKey = 'all' | 'done' | 'todo';

const PER_PAGE_TARGET = 24; // 4 rows × 6 columns

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'Book', label: 'Books' },
  { key: 'Movie', label: 'Movies' },
  { key: 'Series', label: 'Series' },
];

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rating_high', label: 'Highest rated' },
  { value: 'rating_low', label: 'Lowest rated' },
];

const ms = (iso: string) => new Date(iso).getTime();

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  // Unique per instance so the two Segmented groups don't share an indicator.
  const layoutId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground/70">{label}</span>
      <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={cn(
                'relative cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md bg-card shadow-sm"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }
                  }
                />
              )}
              <span className="relative z-10">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LibraryClient({ items }: { items: LibraryItem[] }) {
  const params = useSearchParams();
  const initialTab = (params.get('type') as Tab) ?? 'all';
  const query = params.get('q')?.toLowerCase() ?? '';

  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.key === initialTab) ? initialTab : 'all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [status, setStatus] = useState<StatusKey>('all');
  const [reviews, setReviews] = useState<ReviewKey>('all');
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  // Target 24 per page (4 rows × 6 cols); when the grid shows fewer columns we
  // drop to the largest multiple of that column count that is ≤ 24, so the last
  // row is never partial (6→24, 5→20, 4→24, 3→24).
  const [pageSize, setPageSize] = useState(PER_PAGE_TARGET);
  const gridRef = useRef<HTMLUListElement>(null);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: items.length, Book: 0, Movie: 0, Series: 0 };
    for (const it of items) c[it.type]++;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const list = items.filter((it) => {
      if (tab !== 'all' && it.type !== tab) return false;
      if (query && !`${it.title} ${it.author ?? ''}`.toLowerCase().includes(query)) return false;
      if (status === 'reading' && it.progress === 100) return false;
      if (status === 'done' && it.progress !== 100) return false;
      if (reviews === 'done' && it.myReviewId == null) return false;
      if (reviews === 'todo' && it.myReviewId != null) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sort === 'oldest') return ms(a.lastEventDate) - ms(b.lastEventDate);
      if (sort === 'rating_high' || sort === 'rating_low') {
        const ra = a.myRating;
        const rb = b.myRating;
        if (ra == null && rb == null) return ms(b.lastEventDate) - ms(a.lastEventDate);
        if (ra == null) return 1; // unrated always last
        if (rb == null) return -1;
        return sort === 'rating_high' ? rb - ra : ra - rb;
      }
      return ms(b.lastEventDate) - ms(a.lastEventDate); // newest
    });

    return list;
  }, [items, tab, query, status, reviews, sort]);

  // Measure the column count once the grid mounts and pick the largest whole
  // number of rows that fits in ~24 items (6→24, 5→20, 4→24, 3→24). A ref
  // callback (not an effect) so it runs exactly when the node is attached;
  // deliberately not recalculated on resize — kept simple.
  const gridRefCallback = useCallback((grid: HTMLUListElement | null) => {
    gridRef.current = grid;
    if (!grid) return;
    const cols =
      getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 6;
    setPageSize(PER_PAGE_TARGET - (PER_PAGE_TARGET % cols));
  }, []);

  // Reset to page 1 whenever the filter changes (adjust state during render —
  // see react.dev "You Might Not Need an Effect").
  const filterKey = `${tab}|${query}|${sort}|${status}|${reviews}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageItems = visible.slice((current - 1) * pageSize, current * pageSize);

  const openReview = (it: LibraryItem) => {
    setTarget({
      mediaId: it.mediaId,
      title: it.title,
      type: it.type,
      posterUrl: it.posterUrl,
      reviewId: it.myReviewId,
      rating: it.myRating,
    });
    setModalOpen(true);
  };

  const goTo = (p: number) => {
    setPage(p);
    gridRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <h1 className="font-heading text-2xl font-semibold">My library</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort"
            className="cursor-pointer rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground focus:border-primary/50 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All' },
              { value: 'reading', label: 'Reading' },
              { value: 'done', label: 'Done' },
            ]}
          />

          <Segmented
            label="Reviews"
            value={reviews}
            onChange={setReviews}
            options={[
              { value: 'all', label: 'All' },
              { value: 'done', label: 'Reviewed' },
              { value: 'todo', label: 'To review' },
            ]}
          />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'cursor-pointer border-b-2 px-3 py-2 text-sm transition-colors',
              tab === t.key
                ? 'border-primary font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label} · {counts[t.key]}
          </button>
        ))}
      </div>

      {query && (
        <p className="mb-4 text-sm text-muted-foreground">
          Results for <span className="font-medium text-foreground">“{query}”</span>
        </p>
      )}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          Nothing matches these filters.
        </p>
      ) : (
        <>
          <ul
            ref={gridRefCallback}
            className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
          >
            {pageItems.map((it) => {
              const finished = it.progress === 100;
              const rated = it.myRating != null;
              return (
                <li key={it.mediaId} className="flex flex-col">
                  <Link href={`/media/${it.mediaId}`} className="group block">
                    <Cover
                      title={it.title}
                      type={it.type}
                      posterUrl={it.posterUrl}
                      sizes="160px"
                      className="transition group-hover:shadow-md group-hover:brightness-[1.03]"
                    />
                    <p className="mt-1.5 line-clamp-2 text-xs leading-tight text-foreground group-hover:text-primary">
                      {it.title}
                    </p>
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{typeMeta[it.type].label}</p>
                  {rated ? (
                    <button
                      type="button"
                      onClick={() => openReview(it)}
                      className="mt-1 cursor-pointer self-start"
                      aria-label={`Edit review of ${it.title}`}
                    >
                      <StarRating stars={toStars(it.myRating)} />
                    </button>
                  ) : finished ? (
                    <button
                      type="button"
                      onClick={() => openReview(it)}
                      className="mt-1 cursor-pointer self-start text-[11px] font-medium text-primary hover:underline"
                    >
                      Review
                    </button>
                  ) : it.progress != null ? (
                    <span className="mt-1 text-[11px] text-muted-foreground">{it.progress}%</span>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => goTo(current - 1)}
                disabled={current === 1}
                aria-label="Previous page"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <span className="px-2 text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{current}</span> of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => goTo(current + 1)}
                disabled={current === totalPages}
                aria-label="Next page"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </nav>
          )}
        </>
      )}

      <ReviewModal target={target} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
