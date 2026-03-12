// app/(public)/layout.tsx
// Main site shell: top navigation + footer for all public pages.

import Link from "next/link";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                Log<span className="text-purple-400">Value</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/leaderboard">Leaderboard</NavLink>
              <NavLink href="/decks">Meta Decks</NavLink>
              <NavLink href="/cards">Cards</NavLink>
              <NavLink href="/search">Search</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Suspense>
              <ThemeSwitcher />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-800/50 py-6 text-center text-xs text-zinc-600">
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
      className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
    >
      {children}
    </Link>
  );
}
