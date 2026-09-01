import TopNav from './topnav';

/**
 * Chrome shared by every authenticated screen: the top navigation bar plus a
 * centered content column. Used by the `(app)` route-group layout and by the
 * logged-in home at `/`.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">{children}</main>
    </div>
  );
}
