import AppShell from '@/components/layout/app-shell';

// Auth protection for this route group is handled by `proxy.ts`.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
