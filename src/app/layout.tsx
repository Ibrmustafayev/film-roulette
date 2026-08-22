import type { Metadata } from "next";
import { Inter, Source_Serif_4, Geist_Mono } from "next/font/google";
import "./globals.css";

/* Sans carries structure; serif carries prose and numerals. That split is the
   largest single contributor to the look — see DESIGN.md. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Film Roulette",
  description:
    "Roll the Dice, Find Your Movie! Discover random movies with smart filters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} min-h-screen bg-bg text-ink flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
