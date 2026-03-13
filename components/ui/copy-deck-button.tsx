"use client";
// components/ui/copy-deck-button.tsx
// Triggers the official Clash Royale Universal Link so the OS opens the game
// (or shows a QR-code landing page on desktop).

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { buildDeckLink, type DeckLinkCard } from "@/lib/cr-api/deck-link";
import { cn } from "@/lib/utils";

interface CopyDeckButtonProps {
  /** Exactly 8 card objects with their game IDs. Evolved cards should set evolved=true. */
  cards: DeckLinkCard[];
  className?: string;
}

export function CopyDeckButton({ cards, className }: CopyDeckButtonProps) {
  const [opened, setOpened] = useState(false);

  const handleClick = useCallback(() => {
    if (cards.length < 8) return;
    const link = buildDeckLink(cards);
    window.open(link, "_blank", "noopener,noreferrer");
    setOpened(true);
    setTimeout(() => setOpened(false), 2000);
  }, [cards]);

  const ready = cards.length >= 8;

  return (
    <Button
      onClick={handleClick}
      disabled={!ready}
      aria-label="Copy this deck to Clash Royale"
      className={cn(
        "gap-2 transition-colors",
        opened && "bg-green-600 text-white hover:bg-green-600 border-green-500",
        className,
      )}
    >
      {/* Sword icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M15.312 2.688a1 1 0 0 0-1.414 0L3.293 13.293a1 1 0 0 0 0 1.414l2 2a1 1 0 0 0 1.414 0L16.312 7.1a1 1 0 0 0 0-1.414l-1-1ZM5 14.5l-.5.5-.5-.5.5-.5.5.5Z"
          clipRule="evenodd"
        />
      </svg>
      {opened ? "Copied!" : "Copy Deck to Game"}
    </Button>
  );
}
