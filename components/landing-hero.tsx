// components/landing-hero.tsx
// Animated landing hero with 3D perspective effects, interactive tilt,
// holographic card showcase, particle field, and dramatic scroll animations.
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
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
  Sparkles,
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

const ELIXIR_PALETTE: Record<
  number,
  { bg: string; border: string; glow: string }
> = {
  2: { bg: "#2e1065", border: "#4c1d95", glow: "#7c3aed" },
  3: { bg: "#3b0764", border: "#5b21b6", glow: "#8b5cf6" },
  4: { bg: "#4c1d95", border: "#6d28d9", glow: "#a78bfa" },
  5: { bg: "#5b21b6", border: "#7c3aed", glow: "#c4b5fd" },
  6: { bg: "#6d28d9", border: "#8b5cf6", glow: "#ddd6fe" },
  7: { bg: "#7c3aed", border: "#a78bfa", glow: "#ede9fe" },
  8: { bg: "#7e22ce", border: "#c084fc", glow: "#f3e8ff" },
  9: { bg: "#86198f", border: "#e879f9", glow: "#fae8ff" },
};
const DEFAULT_ELIXIR = { bg: "#3b0764", border: "#6d28d9", glow: "#8b5cf6" };

const FEATURES = [
  {
    Icon: BarChart2,
    title: "Meta Deck Intelligence",
    desc: "Our rating formula R = WR × (1 − e^−UR/baseline) surfaces true deck power. Clean Win Rate strips out mirror-match noise.",
    gradFrom: "#7c3aed",
    gradTo: "#4c1d95",
    stat: "110+ decks · updated every 5 min",
    accent: "violet",
  },
  {
    Icon: Users,
    title: "Player Deep Dive",
    desc: "Full battle logs, upcoming chest cycle, trophies velocity, and real-time W/L breakdown for any player tag worldwide.",
    gradFrom: "#d97706",
    gradTo: "#92400e",
    stat: "1,000+ players tracked",
    accent: "amber",
  },
  {
    Icon: Shield,
    title: "Clan War Command",
    desc: "River Race fame, repair points, per-member strike detection and full war history — keep every member accountable.",
    gradFrom: "#059669",
    gradTo: "#064e3b",
    stat: "Live River Race data",
    accent: "emerald",
  },
] as const;

// ─── Animation Variants ───────────────────────────────────────────────────────

const textContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const textLine: Variants = {
  hidden: { opacity: 0, y: 80, rotateX: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotateY: -30, z: -100 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotateY: 0,
    z: 0,
    transition: {
      delay: 0.6 + i * 0.08,
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  }),
};

const featureCard: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Floating atmospheric particle */
function Particle({ index }: { index: number }) {
  const size = 2 + (index % 3);
  const left = `${(index * 13.7) % 100}%`;
  const delay = `${(index * 1.3) % 8}s`;
  const duration = `${8 + (index % 6)}s`;
  const opacity = 0.15 + (index % 5) * 0.08;

  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        left,
        bottom: "-5%",
        background:
          index % 3 === 0 ? "#a78bfa" : index % 3 === 1 ? "#7c3aed" : "#c4b5fd",
        opacity,
        animation: `particle-drift ${duration} ${delay} linear infinite`,
      }}
    />
  );
}

/** Interactive 3D tilt card container */
function Tilt3D({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg)",
  );
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 20;
    const rotateX = (0.5 - y) * 20;
    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    );
    setGlare({ x: x * 100, y: y * 100, opacity: 0.15 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform(
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    );
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
        }}
      />
    </div>
  );
}

function WinRateBarAnimated({ winRate }: { winRate: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const show = useInView(ref, { once: true });
  const pct = Math.round(winRate * 100);
  return (
    <div ref={ref}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          Win Rate
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={show ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
          className="text-sm font-black text-white"
        >
          {pct}%
        </motion.span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800/80">
        <motion.div
          initial={{ width: 0 }}
          animate={show ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-full rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-purple-400"
        >
          {/* Animated shimmer on bar */}
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
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
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={show ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, type: "spring", stiffness: 150 }}
        className="text-3xl font-black tracking-tight text-white font-display animate-text-glow"
      >
        {target}
      </motion.div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
    </div>
  );
}

/** Animated background grid with perspective */
function PerspectiveGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] opacity-[0.04]"
        style={{
          perspective: "500px",
          perspectiveOrigin: "50% 0%",
        }}
      >
        <div
          className="h-full w-full"
          style={{
            transform: "rotateX(60deg)",
            backgroundImage: [
              "linear-gradient(to right, rgba(139,92,246,0.6) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(139,92,246,0.6) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      {/* Vertical grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgba(139,92,246,0.04) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(139,92,246,0.04) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "72px 72px",
        }}
      />
    </div>
  );
}

/** Orbiting energy ring */
function OrbitalRing({
  size,
  duration,
  delay,
  color,
}: {
  size: number;
  duration: number;
  delay: number;
  color: string;
}) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-20"
      style={{
        width: size,
        height: size,
        borderColor: color,
        animation: `orbit ${duration}s ${delay}s linear infinite`,
      }}
      aria-hidden
    >
      <div
        className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"
        style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      />
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

  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const featuresVisible = useInView(featuresRef, { once: true, amount: 0.1 });

  // Parallax scroll
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroCardY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <>
      {/* ═══════════════  HERO SECTION  ══════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative isolate flex min-h-[calc(100dvh-56px)] items-center overflow-hidden noise-overlay"
      >
        {/* Background layers */}
        <PerspectiveGrid />

        {/* Animated radial glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-48 -top-48 h-[800px] w-[800px] rounded-full bg-purple-700/20 animate-pulse-glow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-900/15 animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-600/10 animate-pulse-glow"
          style={{ animationDelay: "3.5s" }}
        />

        {/* Scan line effect */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-scan-line"
        />

        {/* Particle field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </div>

        {/* Orbital energy rings — hidden on small screens to prevent overlap */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
        >
          <div className="absolute right-[15%] top-[20%]">
            <OrbitalRing size={240} duration={20} delay={0} color="#7c3aed" />
            <OrbitalRing size={160} duration={14} delay={2} color="#a78bfa" />
          </div>
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_480px] lg:gap-12 lg:py-28">
          {/* ── LEFT: TEXT ─────────────────────────────────────────────────── */}
          <motion.div style={{ y: heroTextY, opacity: heroOpacity }}>
            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full gradient-border glass px-5 py-2 backdrop-blur"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-purple-300">
                Real-time · Battle Analytics
              </span>
              <Sparkles size={12} className="text-purple-400" />
            </motion.div>

            {/* Headline with 3D text reveal */}
            <div className="perspective-1500">
              <motion.div
                variants={textContainer}
                initial="hidden"
                animate="visible"
                className="preserve-3d"
              >
                <motion.h1
                  variants={textLine}
                  className="overflow-hidden font-display text-[clamp(2.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight text-white animate-text-glow"
                  style={{ transformOrigin: "left bottom" }}
                >
                  Dominate
                </motion.h1>
                <motion.h1
                  variants={textLine}
                  className="overflow-hidden font-display text-[clamp(2.5rem,10vw,9rem)] font-black uppercase leading-[0.85] tracking-tight"
                  style={{
                    transformOrigin: "left bottom",
                    background:
                      "linear-gradient(135deg, #a78bfa 0%, #7c3aed 30%, #c4b5fd 50%, #7c3aed 70%, #a78bfa 100%)",
                    backgroundSize: "200% 200%",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "holographic 4s ease-in-out infinite",
                  }}
                >
                  The Meta
                </motion.h1>
              </motion.div>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.6,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-7 max-w-lg text-lg leading-relaxed text-zinc-400"
            >
              Deck ratings, clean win rates, player intelligence, and clan war
              tools — all powered by{" "}
              <span className="font-semibold text-purple-400">
                live Clash Royale battle data
              </span>
              .
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.6 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/decks"
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-purple-600 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-purple-500"
                >
                  {/* Glow pulse behind button */}
                  <span className="absolute inset-0 rounded-full bg-purple-500/40 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
                  <TrendingUp size={16} className="relative z-10" />
                  <span className="relative z-10">Explore Meta Decks</span>
                  <ArrowRight
                    size={14}
                    className="relative z-10 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 px-8 py-4 text-sm font-bold text-zinc-300 transition-all hover:border-purple-700/50 hover:bg-purple-950/30 hover:text-white glass"
                >
                  <Search size={16} />
                  Search Player
                </Link>
              </motion.div>
            </motion.div>

            {/* Mini feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="mt-10 flex flex-wrap gap-6"
            >
              {[
                { Icon: Trophy, text: "1,000+ players tracked" },
                { Icon: Swords, text: "7-day rolling data" },
                { Icon: Zap, text: "5-min meta refresh" },
              ].map(({ Icon, text }, i) => (
                <motion.span
                  key={text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="flex items-center gap-2 text-xs text-zinc-500"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-950/60 ring-1 ring-purple-800/30">
                    <Icon size={10} className="text-purple-400" />
                  </span>
                  {text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: 3D DECK SHOWCASE ────────────────────────────────────── */}
          <motion.div style={{ y: heroCardY, opacity: heroOpacity }}>
            <motion.div
              initial={{
                opacity: 0,
                rotateY: -15,
                rotateX: 5,
                scale: 0.9,
                x: 60,
              }}
              animate={{ opacity: 1, rotateY: 0, rotateX: 0, scale: 1, x: 0 }}
              transition={{
                delay: 0.35,
                duration: 1.0,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="perspective-1500"
            >
              <Tilt3D>
                {/* Ambient layered glows */}
                <div className="absolute -inset-4 rounded-3xl bg-purple-600/10 blur-3xl" />
                <div className="absolute -inset-8 rounded-3xl bg-violet-700/5 blur-[60px]" />

                <div className="relative overflow-hidden rounded-2xl glass-heavy shadow-2xl shadow-purple-950/40">
                  {/* Holographic top edge */}
                  <div
                    className="absolute inset-x-0 top-0 h-px animate-holographic"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, #a78bfa, #7c3aed, #c4b5fd, #7c3aed, #a78bfa, transparent)",
                      backgroundSize: "200% 100%",
                    }}
                  />

                  <div className="relative p-6">
                    {/* Card header */}
                    <div className="mb-5 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                          #1 Meta Deck
                        </p>
                        <p className="mt-1 text-base font-black capitalize text-white">
                          {archetype}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-900/50 px-2.5 py-1 font-mono text-[10px] font-bold text-purple-300 ring-1 ring-purple-700/30">
                            <Zap size={9} />
                            {avgElixir.toFixed(1)} avg
                          </span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.8,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="rounded-xl border border-green-800/40 bg-green-950/30 px-4 py-2.5 text-center glass"
                      >
                        <p className="font-mono text-[9px] uppercase text-green-600">
                          Win Rate
                        </p>
                        <p className="text-lg font-black tabular-nums text-green-400">
                          {(winRate * 100).toFixed(1)}%
                        </p>
                      </motion.div>
                    </div>

                    {/* 4 × 2 3D card grid */}
                    <div className="perspective-1000">
                      <div className="grid grid-cols-4 gap-2.5 preserve-3d">
                        {cards.slice(0, 8).map((card, i) => {
                          const cost = card.elixir_cost ?? 4;
                          const palette =
                            ELIXIR_PALETTE[cost] ?? DEFAULT_ELIXIR;
                          return (
                            <motion.div
                              key={card.id}
                              custom={i}
                              variants={cardVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover={{
                                scale: 1.12,
                                zIndex: 10,
                                rotateY: 8,
                                boxShadow: `0 8px 30px ${palette.glow}40`,
                              }}
                              className="relative aspect-[5/6] cursor-default overflow-hidden rounded-xl transition-shadow"
                              style={{
                                background: `linear-gradient(160deg, ${palette.bg} 0%, #0c0a1e 100%)`,
                                border: `1px solid ${palette.border}50`,
                                transformStyle: "preserve-3d",
                              }}
                            >
                              {/* Inner glow */}
                              <div
                                className="pointer-events-none absolute inset-0 opacity-20"
                                style={{
                                  background: `radial-gradient(circle at 30% 20%, ${palette.glow}40, transparent 70%)`,
                                }}
                              />
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
                                    className="mb-1.5 h-6 w-6 rounded-full opacity-50"
                                    style={{
                                      background: `radial-gradient(circle, ${palette.glow}, ${palette.border})`,
                                    }}
                                  />
                                  <span className="text-center text-[8px] font-bold leading-tight text-white/60">
                                    {card.name.slice(0, 7)}
                                  </span>
                                </div>
                              )}
                              {/* Elixir pip */}
                              <div
                                className="absolute bottom-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${palette.border}, ${palette.glow})`,
                                }}
                              >
                                <span className="text-[8px] font-black text-white drop-shadow">
                                  {cost}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Win rate bar + CWR */}
                    <div className="mt-6 space-y-3">
                      <WinRateBarAnimated winRate={winRate} />
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                          CWR (clean)
                        </span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                          className="font-mono text-[11px] font-bold text-emerald-400"
                        >
                          {((winRate - 0.018) * 100).toFixed(1)}%
                        </motion.span>
                      </div>
                    </div>

                    {/* CTA link */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Link
                        href="/decks"
                        className="group mt-5 flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-500 transition-all hover:border-purple-800/50 hover:text-purple-300 hover:bg-purple-950/20"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles size={11} className="text-purple-500" />
                          View full deck analysis
                        </span>
                        <ChevronRight
                          size={12}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </Link>
                    </motion.div>
                  </div>

                  {/* Corner glow decorations */}
                  <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-purple-500/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-violet-600/10 blur-2xl" />
                </div>
              </Tilt3D>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Scroll
            </span>
            <div className="h-8 w-5 rounded-full border border-zinc-700/50 p-1">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="h-2 w-full rounded-full bg-purple-500/60"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════  STATS BAND  ════════════════════════════════════════ */}
      <section className="relative border-y border-zinc-800/60 overflow-hidden">
        {/* Glass bg */}
        <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-xl" />
        {/* Accent glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-purple-600/30 to-transparent" />
          <div className="absolute bottom-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-purple-600/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 divide-x divide-zinc-800/50 sm:grid-cols-4">
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
        className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={featuresVisible ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-6 h-px w-24 origin-center bg-gradient-to-r from-transparent via-purple-500 to-transparent"
          />
          <h2 className="font-display text-[clamp(2rem,5.5vw,3.8rem)] font-black uppercase tracking-tight text-white">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-500">
            Three pillars of Clash Royale intelligence, unified in one platform.
          </p>
        </motion.div>

        <div className="perspective-2000">
          <div className="grid gap-7 sm:grid-cols-3 preserve-3d">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                variants={featureCard}
                initial="hidden"
                animate={featuresVisible ? "visible" : "hidden"}
                whileHover={{
                  y: -8,
                  rotateX: -2,
                  rotateY: i === 0 ? 3 : i === 2 ? -3 : 0,
                  scale: 1.02,
                }}
                className="group relative overflow-hidden rounded-2xl glass-heavy p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-950/20"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Top colour bar with glow */}
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(to right, transparent, ${feat.gradFrom}, ${feat.gradTo}, transparent)`,
                  }}
                />
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(ellipse at center, ${feat.gradFrom}08, transparent 70%)`,
                  }}
                />

                {/* 3D Icon */}
                <motion.div
                  whileHover={{ rotateY: 180 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6 inline-flex items-center justify-center rounded-xl p-3.5"
                  style={{
                    background: `linear-gradient(135deg, ${feat.gradFrom}25, ${feat.gradTo}50)`,
                    border: `1px solid ${feat.gradFrom}25`,
                    transformStyle: "preserve-3d",
                    boxShadow: `0 4px 20px ${feat.gradFrom}15`,
                  }}
                >
                  <feat.Icon size={24} style={{ color: feat.gradFrom }} />
                </motion.div>

                <h3 className="text-lg font-black text-white">{feat.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {feat.desc}
                </p>

                <div className="mt-6 flex items-center gap-2.5">
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: feat.gradFrom,
                      boxShadow: `0 0 6px ${feat.gradFrom}`,
                    }}
                  />
                  <span className="text-xs font-semibold text-zinc-500">
                    {feat.stat}
                  </span>
                </div>

                {/* Bottom glow on hover */}
                <div
                  className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `${feat.gradFrom}20` }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════  FINAL CTA BAND  ════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-zinc-800/60">
        {/* Dramatic bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950"
        />

        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Decorative element */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mx-auto mb-8 h-px w-20 origin-center bg-gradient-to-r from-transparent via-purple-500 to-transparent"
            />

            <h2 className="font-display text-[clamp(2rem,5.5vw,3.5rem)] font-black uppercase tracking-tight text-white animate-text-glow">
              Start Exploring
            </h2>
            <p className="mx-auto mt-5 max-w-md text-zinc-400">
              Dive into the meta, track your season, or scout your next
              opponent.{" "}
              <span className="font-semibold text-zinc-300">
                All free. No account required.
              </span>
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/decks"
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-purple-600 px-9 py-4 text-sm font-bold text-white transition-all hover:bg-purple-500"
                >
                  <span className="absolute inset-0 rounded-full bg-purple-500/50 blur-xl transition-opacity opacity-0 group-hover:opacity-100" />
                  <TrendingUp size={16} className="relative z-10" />
                  <span className="relative z-10">Browse Meta Decks</span>
                  <ArrowRight
                    size={14}
                    className="relative z-10 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 px-9 py-4 text-sm font-bold text-zinc-300 transition-all hover:border-purple-700/50 hover:bg-purple-950/30 hover:text-white glass"
                >
                  <Trophy size={16} />
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
