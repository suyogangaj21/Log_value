// app/(public)/layout.tsx
// Main site shell: top navigation + footer for all public pages.

import Link from "next/link";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MobileNav } from "@/components/mobile-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        {/* Brand accent line across the very top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="group flex items-center gap-2">
              {/* Crystal gem mark */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
                className="text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
              >
                <polygon
                  points="9,1 17,6 17,12 9,17 1,12 1,6"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <polygon
                  points="9,4 14,7.5 14,10.5 9,14 4,10.5 4,7.5"
                  fill="currentColor"
                  fillOpacity="0.45"
                />
              </svg>
              <span className="font-display text-base font-black tracking-tight text-foreground">
                Log<span className="text-primary">Value</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-0.5 sm:flex">
              <NavLink href="/leaderboard">Leaderboard</NavLink>
              <NavLink href="/decks">Meta Decks</NavLink>
              <NavLink href="/cards">Cards</NavLink>
              <NavLink href="/search">Search</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <MobileNav />
            <Suspense>
              <ThemeSwitcher />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <p>
          LogValue is not affiliated with Supercell. Clash Royale © Supercell.
        </p>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      {/* Underline accent on hover */}
      <span className="absolute bottom-0 inset-x-3 h-px origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
    </Link>
  );
}
