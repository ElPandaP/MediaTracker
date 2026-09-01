import { Button } from '@/components/ui/button';
import { Cover } from '@/components/media/cover';
import type { ReviewTarget } from '@/components/media/review-modal';
import type { LibraryItem } from '@/lib/types';

export function PendingReviewsCard({
  items,
  onReview,
}: {
  items: LibraryItem[];
  onReview: (target: ReviewTarget) => void;
}) {
  const toTarget = (item: LibraryItem): ReviewTarget => ({
    mediaId: item.mediaId,
    title: item.title,
    type: item.type,
    posterUrl: item.posterUrl,
  });

  return (
    <div className="tt-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
        To review
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">All caught up.</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {items.slice(0, 6).map((item) => (
              <li key={item.mediaId}>
                <button
                  type="button"
                  onClick={() => onReview(toTarget(item))}
                  title={`Review: ${item.title}`}
                  className="block w-10 cursor-pointer rounded-xl transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Cover title={item.title} type={item.type} posterUrl={item.posterUrl} sizes="40px" />
                </button>
              </li>
            ))}
          </ul>
          <Button size="sm" className="w-full" onClick={() => onReview(toTarget(items[0]))}>
            Write a review{items.length > 1 ? ` (${items.length})` : ''}
          </Button>
        </>
      )}
    </div>
  );
}
