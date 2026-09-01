import { Suspense } from 'react';
import { getLibrary } from '@/lib/api/server';
import type { LibraryItem } from '@/lib/types';
import LibraryClient from './LibraryClient';

export default async function LibraryPage() {
  let items: LibraryItem[] = [];
  try {
    const res = await getLibrary({ limit: 200 });
    items = res.data ?? [];
  } catch {
    // empty state handled in the client
  }
  return (
    <Suspense fallback={null}>
      <LibraryClient items={items} />
    </Suspense>
  );
}
