import Link from 'next/link';
import { Button } from '@/components/ui/button';

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function ProfileCard({
  username,
  total,
  reviewCount,
}: {
  username: string;
  total: number;
  reviewCount: number;
}) {
  return (
    <div className="tt-card flex flex-col items-center gap-2 p-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-heading text-lg font-semibold text-primary">
        {initials(username)}
      </span>
      <p className="font-medium text-foreground">@{username}</p>
      <p className="text-xs text-muted-foreground">
        {total} this year · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-1 w-full">
        <Link href="/profile">View profile</Link>
      </Button>
    </div>
  );
}
