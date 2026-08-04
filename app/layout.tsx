import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";

// A round, friendly display font for the Latin-script UI chrome. Hebrew/
// Arabic/Cyrillic text (chat bubbles, language names) falls back to the
// system font stack automatically since Baloo 2 has no glyphs for those
// scripts — that's fine, only the English chrome needs to feel playful.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PSAI",
  description: "Your friend PSAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body>{children}</body>
    </html>
  );
}
