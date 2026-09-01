import { cookies } from 'next/headers';
import Landing from './_components/landing';
import HomeView, { type HomeData } from './_components/home/home-view';
import { getStats, getLibrary, getPendingReviews } from '@/lib/api/server';
import { isJwtValid } from '@/lib/jwt';
import type { GetLibraryResponse, GetStatsResponse, LibraryItem } from '@/lib/types';

function decodeUsername(token: string): string {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
    );
    return payload.unique_name ?? payload.username ?? 'reader';
  } catch {
    return 'reader';
  }
}

const libData = (r: PromiseSettledResult<GetLibraryResponse>): LibraryItem[] =>
  r.status === 'fulfilled' ? (r.value.data ?? []) : [];

export default async function RootPage() {
  const token = (await cookies()).get('tt-token')?.value;

  // Logged-out or expired visitors get the public landing page.
  if (!token || !isJwtValid(token)) return <Landing />;

  const year = new Date().getFullYear();
  const [stats, books, movies, series, inProgress, pending, top] = await Promise.allSettled([
    getStats(),
    getLibrary({ type: 'Book', limit: 24 }),
    getLibrary({ type: 'Movie', limit: 24 }),
    getLibrary({ type: 'Series', limit: 24 }),
    getLibrary({ status: 'in_progress', limit: 6 }),
    getPendingReviews(),
    getLibrary({ sort: 'rating', year, limit: 3 }),
  ]);

  const data: HomeData = {
    username: decodeUsername(token),
    stats:
      stats.status === 'fulfilled'
        ? (stats.value as GetStatsResponse).data
        : null,
    books: libData(books),
    movies: libData(movies),
    series: libData(series),
    inProgress: libData(inProgress),
    pending: libData(pending),
    topOfYear: libData(top),
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
      <HomeView data={data} />
    </main>
  );
}
