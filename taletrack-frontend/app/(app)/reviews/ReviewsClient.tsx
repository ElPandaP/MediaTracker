'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Cover, typeMeta } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import { ReviewModal, type ReviewTarget } from '@/components/media/review-modal';
import { reviewService } from '@/lib/api/services';
import type { ReviewItem } from '@/lib/types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewsClient({ reviews }: { reviews: ReviewItem[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const edit = (r: ReviewItem) => {
    if (!r.media) return;
    setTarget({
      mediaId: r.mediaId,
      title: r.media.title,
      type: r.media.type,
      posterUrl: r.media.posterUrl,
      reviewId: r.id,
      rating: r.rating,
      comment: r.comment,
    });
    setModalOpen(true);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    setDeleting(id);
    try {
      await reviewService.deleteReview(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-semibold">My reviews</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
      </p>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          You haven&apos;t written any reviews yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r.id} className="tt-card flex gap-4 p-4">
              {r.media && (
                <Cover
                  title={r.media.title}
                  type={r.media.type}
                  posterUrl={r.media.posterUrl}
                  className="w-14 shrink-0"
                  sizes="56px"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.media?.title ?? `#${r.mediaId}`}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.media ? typeMeta[r.media.type].label : ''} · {fmtDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => edit(r)}
                      aria-label="Edit review"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      disabled={deleting === r.id}
                      aria-label="Delete review"
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>
                <StarRating stars={toStars(r.rating)} className="mt-1.5" />
                {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReviewModal target={target} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
