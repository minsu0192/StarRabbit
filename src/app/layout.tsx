import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AuthFeedback from "@/components/AuthFeedback";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AppThemeController from "@/components/AppThemeController";

export const metadata: Metadata = {
  title: "별토끼 — 진짜 웹툰 평점",
  description: "네이버는 다 9점, 별토끼는 진짜 점수가 나온다. 몰표 없이 1인 1평.",
  verification: {
    google: "NAf5RNe9e3R8mk4KmE1RB2F0S9-PFfmI4EwSPf3D8uE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased pb-16">
        <AppThemeController />
        <GoogleAnalytics />
        <Suspense>
          <AuthFeedback />
        </Suspense>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
