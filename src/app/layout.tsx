import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthFeedback from "@/components/AuthFeedback";

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
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased pb-16">
        <Suspense>
          <AuthFeedback />
        </Suspense>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
