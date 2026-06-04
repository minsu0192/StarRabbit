import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "별토끼 — 진짜 웹툰 평점",
  description: "네이버는 다 9점, 별토끼는 진짜 점수가 나온다. 팬덤 몰표 없이 1인 1평.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-[family-name:var(--font-noto)] antialiased pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
