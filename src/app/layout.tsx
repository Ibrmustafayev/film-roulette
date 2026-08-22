import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/* Three faces, three jobs — see DESIGN.md.
   Archivo: UI and headings. Plex Mono: numerals and measurement only.
   Source Serif: prose only. No face does two jobs. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Film Roulette",
  description:
    "Set your filters, roll once, and get one film to watch tonight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${plexMono.variable} ${sourceSerif.variable} min-h-screen bg-ink-0 text-ink-8`}
      >
        {children}
      </body>
    </html>
  );
}
