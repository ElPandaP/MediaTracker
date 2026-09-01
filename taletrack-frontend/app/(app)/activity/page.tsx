import { Activity } from 'lucide-react';

export default function ActivityPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary/60">
        <Activity aria-hidden="true" className="size-6 text-muted-foreground" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">Activity</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The activity and friends feed is coming in a later phase. For now, browse your library and
        your reviews.
      </p>
    </div>
  );
}
