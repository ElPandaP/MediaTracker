'use client';

import { Activity } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function ActivityPage() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary/60">
        <Activity aria-hidden="true" className="size-6 text-muted-foreground" />
      </span>
      <h1 className="font-heading text-2xl font-semibold">{t('activity.title')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('activity.body')}</p>
    </div>
  );
}
