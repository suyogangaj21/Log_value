// components/landing-hero.tsx
// Animated landing hero + stats band + feature cards.
// Full Client Component — all animations driven by Framer Motion.
"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import {
  Search,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Trophy,
  Swords,
  BarChart2,
  Users,
  ChevronRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CardSlot {
  id: number;
  name: string;
  icon_url?: string | null;
  elixir_cost?: number | null;
}

export interface LandingHeroProps {
  topDeckCards?: CardSlot[];
  topDeckWinRate?: number | null;
  topDeckArchetype?: string | null;
  topDeckAvgElixir?: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SAMPLE_CARDS: CardSlot[] = [
  { id: 1, name: "Giant", elixir_cost: 5 },
  { id: 2, name: "Musketeer", elixir_cost: 4 },
  { id: 3, name: "Minions", elixir_cost: 3 },
  { id: 4, name: "Zap", elixir_cost: 2 },
  { id: 5, name: "Fireball", elixir_cost: 4 },
  { id: 6, name: "Goblins", elixir_cost: 2 },
  { id: 7, name: "Bowler", elixir_cost: 5 },
  { id: 8, name: "The Log", elixir_cost: 2 },
];

const ELIXIR_PALETTE: Record<number, { bg: string; border: string }> = {
  2: { bg: "#2e1065", border: "#4c1d95" },
  3: { bg: "#3b0764", border: "#5b21b6" },
  4: { bg: "#4c1d95", border: "#6d28d9" },
  5: { bg: "#5b21b6", border: "#7c3aed" },
  6: { bg: "#6d28d9", border: "#8b5cf6" },
  7: { bg: "#7c3aed", border: "#a78bfa" },
  8: { bg: "#7e22ce", border: "#c084fc" },
  9: { bg: "#86198f", border: "#e879f9" },
};
const DEFAULT_ELIXIR = { bg: "#3b0764", border: "#6d28d9" };

const FEATURES = [
  {
    Icon: BarChart2,
    title: "Meta Deck Intelligence",
    desc: "Our rating formula R = WR × (1 − e^−UR/baseline) surfaces true deck power. Clean Win Rate strips out mirror-match noise.",
    gradFrom: "#7c3aed",
    gradTo: "#4c1d95",
    stat: "110+ decks · updated every 5 min",
  },
  {
    Icon: Users,
    title: "Player Deep Dive",
    desc: "Full battle logs, upcoming chest cycle, trophies velocity, and real-time W/L breakdown for any player tag worldwide.",
    gradFrom: "#d97706",
    gradTo: "#92400e",
    stat: "1,000+ players tracked",
  },
  {
    Icon: Shield,
    title: "Clan War Command",
    desc: "River Race fame, repair points, per-member strike detection and full war history — keep every member accountable.",
    gradFrom: "#059669",
    gradTo: "#064e3b",
    stat: "Live River Race data",
  },
] as const;

// ─── Animation Variants ───────────────────────────────────────────────────────

const textContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const textLine: Variants = {
  hidden: { opacity: 0, y: 60, clipPath: "inset(100% 0% 0% 0%)" },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.5 + i * 0.06,
      type: "spring",
      stiffness: 260,
      damping: 22,
    },
  }),
};

const featureCard: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.13, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FloatingOrb({
  style,
  delay,
  duration = 10,
}: {
  style: React.CSSProperties;
  delay: number;
  duration?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute rounded-full blur-3xl"
      style={style}
      animate={{
        y: [0, -28, 8, -18, 0],
        x: [0, 10, -8, 4, 0],
        scale: [1, 1.08, 0.96, 1.04, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      }}
    />
  );
}

function WinRateBarAnimated({ winRate }: { winRate: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const show = useInView(ref, { once: true });
  const pct = Math.round(winRate * 100);
  return (
    <div ref={ref}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          Win Rate
        </span>
        <span className="text-sm font-black text-white">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={show ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.4, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-purple-400"
        />
      </div>
    </div>
  );
}

function StatPill({ target, label }: { target: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const show = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={show ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-3xl font-black tracking-tight text-white font-display"
      >
        {target}
      </motion.div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function LandingHero({
  topDeckCards,
  topDeckWinRate,
  topDeckArchetype,
  topDeckAvgElixir,
}: LandingHeroProps) {
  const cards =
    topDeckCards && topDeckCards.length >= 8 ? topDeckCards : SAMPLE_CARDS;
  const winRate = topDeckWinRate ?? 0.674;
  const archetype = topDeckArchetype ?? "Beatdown";
  const avgElixir = topDeckAvgElixir ?? 3.8;

  const featuresRef = useRef<HTMLElement>(null);
  const featuresVisible = useInView(featuresRef, { once: true, amount: 0.1 });

  return (
    <>
      {/* ═══════════════  HERO  ══════════════════════════════════════════════ */}
      <section className="relative isolate flex min-h-[calc(100dvh-56px)] items-center overflow-hidden">
        {/* Background: tactical grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(to right, rgba(139,92,246,0.07) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(139,92,246,0.07) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "72px 72px",
          }}
        />

        {/* Background: radial glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-purple-700/25 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-violet-900/20 blur-[120px]"
        />

        {/* Floating orbs */}
        <FloatingOrb
          style={{
            right: "18%",
            top: "12%",
            width: 280,
            height: 280,
            background: "rgba(124,58,237,0.18)",
          }}
          delay={0}
          duration={11}
        />
        <FloatingOrb
          style={{
            right: "6%",
            top: "55%",
            width: 180,
            height: 180,
            background: "rgba(109,40,217,0.14)",
          }}
          delay={3}
          duration={8}
        />
        <FloatingOrb
          style={{
            left: "2%",
            top: "65%",
            width: 220,
            height: 220,
            background: "rgba(79,70,229,0.12)",
          }}
          delay={1.5}
          duration={13}
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_460px] lg:py-28">
          {/* ── LEFT: TEXT ─────────────────────────────────────────────────── */}
          <div>
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-purple-700/50 bg-purple-950/50 px-4 py-1.5 backdrop-blur"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-purple-300">
                Real-time · Battle Analytics
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              variants={textContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                variants={textLine}
                className="overflow-hidden font-display text-[clamp(4.5rem,11vw,8rem)] font-black uppercase leading-[0.88] tracking-tight text-white"
              >
                Dominate
              </motion.h1>
              <motion.h1
                variants={textLine}
                className="overflow-hidden bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500 bg-clip-text font-display text-[clamp(4.5rem,11vw,8rem)] font-black uppercase leading-[0.88] tracking-tight text-transparent"
              >
                The Meta
              </motion.h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400"
            >
              Deck ratings, clean win rates, player intelligence, and clan war
              tools — all powered by live Clash Royale battle data.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.5 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/decks"
                  className="group inline-flex items-center gap-2 rounded-full bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_0_0_rgba(139,92,246,0.5)] transition-all hover:bg-purple-500 hover:shadow-[0_0_25px_4px_rgba(139,92,246,0.4)]"
                >
                  <TrendingUp size={15} />
                  Explore Meta Decks
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-7 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white"
                >
                  <Search size={15} />
                  Search Player
                </Link>
              </motion.div>
            </motion.div>

            {/* Mini feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.82 }}
              className="mt-8 flex flex-wrap gap-5"
            >
              {[
                { Icon: Trophy, text: "1,000+ players tracked" },
                { Icon: Swords, text: "7-day rolling data" },
                { Icon: Zap, text: "5-min meta refresh" },
              ].map(({ Icon, text }) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 text-xs text-zinc-500"
                >
                  <Icon size={11} className="text-purple-500" />
                  {text}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: DECK SHOWCASE ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Ambient glow behind card  */}
            <div className="absolute inset-4 rounded-3xl bg-purple-600/15 blur-2xl" />

            <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
              {/* Card header */}
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                    Top Meta Deck
                  </p>
                  <p className="mt-0.5 text-sm font-bold capitalize text-white">
                    {archetype}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-purple-900/50 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                      {avgElixir.toFixed(1)} avg ⚡️
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-green-800/50 bg-green-950/40 px-3 py-1.5 text-center">
                  <p className="font-mono text-[9px] uppercase text-green-600">
                    Win Rate
                  </p>
                  <p className="text-sm font-black text-green-400">
                    {(winRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* 4 × 2 card grid */}
              <div className="grid grid-cols-4 gap-2">
                {cards.slice(0, 8).map((card, i) => {
                  const cost = card.elixir_cost ?? 4;
                  const palette = ELIXIR_PALETTE[cost] ?? DEFAULT_ELIXIR;
                  return (
                    <motion.div
                      key={card.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ scale: 1.08, zIndex: 10 }}
                      className="relative aspect-[5/6] cursor-default overflow-hidden rounded-xl"
                      style={{
                        background: `linear-gradient(160deg, ${palette.bg} 0%, #0c0a1e 100%)`,
                        border: `1px solid ${palette.border}40`,
                      }}
                    >
                      {card.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.icon_url}
                          alt={card.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-1">
                          <div
                            className="mb-1 h-5 w-5 rounded-full opacity-60"
                            style={{ background: palette.border }}
                          />
                          <span className="text-center text-[8px] font-bold leading-tight text-white/70">
                            {card.name.length > 7
                              ? card.name.slice(0, 7)
                              : card.name}
                          </span>
                        </div>
                      )}
                      {/* Elixir pill */}
                      <div
                        className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ background: palette.border }}
                      >
                        <span className="text-[8px] font-black text-white">
                          {cost}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Win rate bar + CWR */}
              <div className="mt-5 space-y-2">
                <WinRateBarAnimated winRate={winRate} />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    CWR (clean)
                  </span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">
                    {((winRate - 0.018) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CTA link */}
              <Link
                href="/decks"
                className="group mt-4 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-xs text-zinc-500 transition-all hover:border-purple-800/50 hover:text-purple-300"
              >
                <span>View full deck analysis</span>
                <ChevronRight
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              {/* Decorative corner glow */}
              <div className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rounded-full bg-purple-500/20 blur-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════  STATS BAND  ════════════════════════════════════════ */}
      <section className="border-y border-zinc-800/60 bg-zinc-900/30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 divide-x divide-zinc-800/60 sm:grid-cols-4">
            <StatPill target="1,000+" label="Players Tracked" />
            <StatPill target="7-Day" label="Rolling Window" />
            <StatPill target="110+" label="Cards Analyzed" />
            <StatPill target="5 min" label="Meta Refresh" />
          </div>
        </div>
      </section>

      {/* ═══════════════  FEATURES  ══════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tight text-white">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Three pillars of Clash Royale intelligence, unified in one platform.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              variants={featureCard}
              initial="hidden"
              animate={featuresVisible ? "visible" : "hidden"}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/60 p-7 backdrop-blur transition-shadow hover:shadow-2xl"
            >
              {/* Top colour bar */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(to right, ${feat.gradFrom}, ${feat.gradTo})`,
                }}
              />

              {/* Icon */}
              <div
                className="mb-5 inline-flex items-center justify-center rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, ${feat.gradFrom}30, ${feat.gradTo}60)`,
                  border: `1px solid ${feat.gradFrom}30`,
                }}
              >
                <feat.Icon size={22} style={{ color: feat.gradFrom }} />
              </div>

              <h3 className="text-lg font-black text-white">{feat.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
                {feat.desc}
              </p>

              <div className="mt-5 flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: feat.gradFrom }}
                />
                <span className="text-xs font-semibold text-zinc-500">
                  {feat.stat}
                </span>
              </div>

              {/* Bottom-right glow on hover */}
              <div
                className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `${feat.gradFrom}30` }}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════  FINAL CTA BAND  ════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-zinc-800/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-950/40 via-transparent to-violet-950/40"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-black uppercase tracking-tight text-white">
              Start Exploring
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-400">
              Dive into the meta, track your season, or scout your next
              opponent. All free. No account required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/decks"
                  className="group inline-flex items-center gap-2 rounded-full bg-purple-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                  <TrendingUp size={15} />
                  Browse Meta Decks
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-8 py-3.5 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-white"
                >
                  <Trophy size={15} />
                  Leaderboard
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
