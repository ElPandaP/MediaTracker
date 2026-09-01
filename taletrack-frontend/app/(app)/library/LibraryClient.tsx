'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Cover, typeMeta } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import { ReviewModal, type ReviewTarget } from '@/components/media/review-modal';
import { cn } from '@/lib/utils';
import type { LibraryItem, LibraryType } from '@/lib/types';

type Tab = 'all' | LibraryType;

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'Book', label: 'Books' },
  { key: 'Movie', label: 'Movies' },
  { key: 'Series', label: 'Series' },
];

export default function LibraryClient({ items }: { items: LibraryItem[] }) {
  const params = useSearchParams();
  const initialTab = (params.get('type') as Tab) ?? 'all';
  const query = params.get('q')?.toLowerCase() ?? '';

  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.key === initialTab) ? initialTab : 'all');
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: items.length, Book: 0, Movie: 0, Series: 0 };
    for (const it of items) c[it.type]++;
    return c;
  }, [items]);

  const visible = useMemo(
    () =>
      items.filter((it) => {
        if (tab !== 'all' && it.type !== tab) return false;
        if (query && !`${it.title} ${it.author ?? ''}`.toLowerCase().includes(query)) return false;
        return true;
      }),
    [items, tab, query],
  );

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

  return (
    <div>
      <h1 className="mb-4 font-heading text-2xl font-semibold">My library</h1>

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
          Nothing to show.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visible.map((it) => {
            const finished = it.progress === 100;
            const rated = it.myRating != null;
            return (
              <li key={it.mediaId} className="flex flex-col">
                <Cover title={it.title} type={it.type} posterUrl={it.posterUrl} sizes="160px" />
                <p className="mt-1.5 line-clamp-2 text-xs leading-tight text-foreground">{it.title}</p>
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
      )}

      <ReviewModal target={target} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
