import { redirect } from 'next/navigation';
import { getMe, getStats } from '@/lib/api/server';
import type { UserProfile, YearlyStats } from '@/lib/types';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  let profile: UserProfile | null = null;
  let stats: YearlyStats | null = null;

  try {
    const [meRes, statsRes] = await Promise.allSettled([getMe(), getStats()]);
    if (meRes.status === 'fulfilled') profile = meRes.value.data;
    if (statsRes.status === 'fulfilled') stats = statsRes.value.data;
  } catch {
    // handled below
  }

  if (!profile) redirect('/login');

  return <ProfileClient profile={profile} stats={stats} />;
}
