import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI-Hana | あなたの悩みに寄り添うコンテンツ推薦",
  description:
    "占いの先生の過去のコンテンツから、あなたの悩みにぴったりの記事を見つけます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-gradient-to-b from-pink-50 via-white to-purple-50 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
