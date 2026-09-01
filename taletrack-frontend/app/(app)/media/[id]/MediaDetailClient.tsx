'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Cover, typeMeta } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ReviewModal, type ReviewTarget } from '@/components/media/review-modal';
import type { MediaDetail } from '@/lib/types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MediaDetailClient({ detail }: { detail: MediaDetail }) {
  const [modalOpen, setModalOpen] = useState(false);
  const meta = typeMeta[detail.type];

  const target: ReviewTarget = {
    mediaId: detail.id,
    title: detail.title,
    type: detail.type,
    posterUrl: detail.posterUrl,
    reviewId: detail.myReviewId,
    rating: detail.myRating,
    comment: detail.myComment,
  };

  const unit = detail.type === 'Book' ? 'pages' : detail.type === 'Series' ? 'episodes' : 'min';
  const progress = detail.myProgress ?? 0;

  return (
    <div>
      <Link
        href="/library"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Library
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        <Cover
          title={detail.title}
          type={detail.type}
          posterUrl={detail.posterUrl}
          className="w-40 shrink-0 self-center sm:self-start"
          sizes="160px"
        />

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">{detail.title}</h1>
          {detail.author && <p className="mt-0.5 text-muted-foreground">{detail.author}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {detail.length > 0 && <span>{detail.length} {unit}</span>}
            {detail.avgRating != null && (
              <span className="flex items-center gap-1.5">
                <StarRating stars={toStars(detail.avgRating)} />
                {(detail.avgRating / 2).toFixed(1)} · {detail.reviewCount}{' '}
                {detail.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          {detail.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">{detail.description}</p>
          )}

          {/* Your status */}
          <div className="tt-card mt-5 flex flex-col gap-3 p-4">
            <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
              Your status
            </p>
            {detail.myProgress != null ? (
              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-1.5" />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {progress}%{detail.myLastEventDate ? ` · ${fmtDate(detail.myLastEventDate)}` : ''}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not tracked yet.</p>
            )}

            <div className="flex items-center justify-between gap-3">
              {detail.myRating != null ? (
                <StarRating stars={toStars(detail.myRating)} size="md" />
              ) : (
                <span className="text-sm text-muted-foreground">No rating yet</span>
              )}
              <Button size="sm" variant={detail.myReviewId ? 'outline' : 'default'} onClick={() => setModalOpen(true)}>
                {detail.myReviewId ? 'Edit review' : 'Write a review'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* All reviews */}
      <h2 className="mt-10 mb-4 font-heading text-lg font-semibold">
        Reviews {detail.reviewCount > 0 && <span className="text-muted-foreground">· {detail.reviewCount}</span>}
      </h2>

      {detail.reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No reviews yet. Be the first.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {detail.reviews.map((r) => (
            <li key={r.id} className="tt-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  @{r.username ?? 'user'}
                  {r.mine && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                </span>
                <span className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</span>
              </div>
              <StarRating stars={toStars(r.rating)} className="mt-1.5" />
              {r.comment && <p className="mt-2 text-sm text-foreground/90">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      <ReviewModal target={target} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
