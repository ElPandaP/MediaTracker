import Link from 'next/link';
import { Cover } from '@/components/media/cover';
import { StarRating, toStars } from '@/components/media/star-rating';
import type { LibraryItem } from '@/lib/types';

export function TopOfYearCard({ items }: { items: LibraryItem[] }) {
  return (
    <div className="tt-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
        Top of the year
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rate titles to see them here.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-3">
          {items.slice(0, 3).map((item) => (
            <li key={item.mediaId}>
              <Link href={`/media/${item.mediaId}`} className="group block">
                <Cover
                  title={item.title}
                  type={item.type}
                  posterUrl={item.posterUrl}
                  sizes="80px"
                  className="rounded-md transition group-hover:brightness-[1.03]"
                />
                <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-foreground group-hover:text-primary">
                  {item.title}
                </p>
                {item.myRating != null && <StarRating stars={toStars(item.myRating)} className="mt-0.5" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
