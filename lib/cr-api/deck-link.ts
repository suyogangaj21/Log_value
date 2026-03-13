// lib/cr-api/deck-link.ts
// Builds the official Clash Royale Universal Link for copying a deck into the game.
//
// URI format:
//   https://link.clashroyale.com/deck/en?deck=ID1;ID2;ID3;ID4;ID5;ID6;ID7;ID8
//
// Evolution slots (2025/2026):
//   &slots=1;0;0;0;0;0;0;0  — bitmask aligned with the deck card order
//
// On mobile the OS intercepts this URL and opens the CR app directly (Universal Link).
// On desktop the browser opens Supercell's landing page which displays a QR code.

export interface DeckLinkCard {
  /** Game ID — 8-digit integer, starts with 26 (troop), 27 (building) or 28 (spell). */
  id: number;
  /** Mark true when this card slot is in its evolved form. */
  evolved?: boolean;
}

/**
 * Builds the Clash Royale deep-link for a deck of up to 8 cards.
 * Semicolons in the query string are intentionally left unencoded because
 * Supercell's redirector expects the literal character, not `%3B`.
 */
export function buildDeckLink(cards: DeckLinkCard[]): string {
  const slots = cards.slice(0, 8);
  const deckParam = slots.map((c) => c.id).join(";");

  let url = `https://link.clashroyale.com/deck/en?deck=${deckParam}`;

  if (slots.some((c) => c.evolved)) {
    const slotsParam = slots.map((c) => (c.evolved ? "1" : "0")).join(";");
    url += `&slots=${slotsParam}`;
  }

  return url;
}
