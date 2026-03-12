import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Syne } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "LogValue — Clash Royale Analytics",
    template: "%s | LogValue",
  },
  description:
    "High-performance Clash Royale analytics: deck ratings, clean win rates, player profiles, clan war tools, and real-time meta insights.",
  keywords: [
    "clash royale",
    "deck builder",
    "meta",
    "analytics",
    "win rate",
    "leaderboard",
  ],
  openGraph: {
    siteName: "LogValue",
    type: "website",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} ${syne.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
