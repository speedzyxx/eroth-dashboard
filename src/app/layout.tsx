import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { APP_TITLE, GUILD_NAME } from "@/lib/config";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: `Dashboard High-End Small-Scale / Party 20 del gremio ${GUILD_NAME} — Albion Online.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${cinzel.variable} ${sourceSans.variable}`}>
      <body
        className="antialiased"
        style={
          {
            "--font-display": "var(--font-cinzel), serif",
            "--font-sans": "var(--font-source), sans-serif",
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
