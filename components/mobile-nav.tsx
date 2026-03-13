// components/mobile-nav.tsx
// Hamburger mobile navigation — only renders below the sm breakpoint.
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/decks", label: "Meta Decks" },
  { href: "/cards", label: "Cards" },
  { href: "/search", label: "Search" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground sm:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 border-border bg-card p-0">
        {/* Logo header */}
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
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
            <span className="font-display text-sm font-black tracking-tight text-foreground">
              Log<span className="text-primary">Value</span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
