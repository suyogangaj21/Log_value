// app/(public)/search/page.tsx
// Player / Clan search page — Client Component for interactive search.
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"player" | "clan">("player");
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const tag = query.trim().replace(/^#/, "").toUpperCase();
    if (!tag) return;
    startTransition(() => {
      if (mode === "player") {
        router.push(`/players/%23${tag}`);
      } else {
        router.push(`/clans/%23${tag}`);
      }
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-20 sm:px-6">
      {/* Page header */}
      <div className="space-y-2 text-center">
        <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
          Search
        </h1>
        <p className="text-muted-foreground">
          Enter a player or clan tag (with or without #)
        </p>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "player" | "clan")}>
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger
            value="player"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User size={14} /> Player
          </TabsTrigger>
          <TabsTrigger
            value="clan"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users size={14} /> Clan
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={mode === "player" ? "#ABC123" : "#CLANXYZ"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Button type="submit" disabled={isPending || !query.trim()}>
          {isPending ? "…" : "Search"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        Tip: You can find your player tag in-game under your profile.
      </p>
    </div>
  );
}
