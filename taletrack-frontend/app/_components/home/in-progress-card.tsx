import { Progress } from '@/components/ui/progress';
import { Cover } from '@/components/media/cover';
import type { LibraryItem } from '@/lib/types';

export function InProgressCard({ items }: { items: LibraryItem[] }) {
  return (
    <div className="tt-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
        In progress
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in progress.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const pct = item.progress ?? 0;
            return (
              <li key={item.mediaId} className="flex items-center gap-2.5">
                <Cover
                  title={item.title}
                  type={item.type}
                  posterUrl={item.posterUrl}
                  className="w-8 shrink-0"
                  sizes="32px"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={pct} className="h-1" />
                    <span className="shrink-0 text-[10px] text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
