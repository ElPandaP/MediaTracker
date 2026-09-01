'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Leaf, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import ThemeToggle from './theme-toggle';

const navItems = [
  { href: '/', label: 'Home', exact: true },
  { href: '/library', label: 'Library' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/activity', label: 'Activity', soon: true },
];

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState('');
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Close the account menu on outside click.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el?.open && !el.contains(e.target as Node)) el.removeAttribute('open');
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const isActive = (item: (typeof navItems)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/library?q=${encodeURIComponent(q)}` : '/library');
  };

  const handleLogout = () => {
    menuRef.current?.removeAttribute('open');
    logout();
    // Full document load: `/` swaps between the home and the public landing.
    window.location.assign('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 lg:px-6">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/15">
            <Leaf aria-hidden="true" className="size-4 text-primary" />
          </span>
          <span className="font-heading text-[17px] font-semibold tracking-tight">TaleTrack</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map((item) =>
            item.soon ? (
              <span
                key={item.href}
                title="Coming soon"
                className="cursor-default rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground/40"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(item)
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Search */}
          <form onSubmit={onSearch} className="relative hidden md:block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/50"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search the library"
              className="h-8 w-40 rounded-lg border border-border bg-secondary/50 pr-3 pl-8 text-sm text-foreground transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60 focus:bg-secondary/70 focus:outline-none"
            />
          </form>

          <ThemeToggle compact />

          {/* User menu */}
          {isAuthenticated && (
            <details ref={menuRef} className="group relative">
              <summary
                className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-xs font-semibold text-primary select-none [&::-webkit-details-marker]:hidden"
                aria-label="Account menu"
              >
                {initials(user?.username ?? 'U')}
              </summary>
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <Link
                  href="/profile"
                  onClick={() => menuRef.current?.removeAttribute('open')}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <User aria-hidden="true" className="size-4" />
                  View profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Log out
                </button>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-1.5 sm:hidden">
        {navItems.map((item) =>
          item.soon ? (
            <span key={item.href} className="rounded-lg px-3 py-1 text-sm text-muted-foreground/40">
              {item.label}
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1 text-sm font-medium transition-colors',
                isActive(item)
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
