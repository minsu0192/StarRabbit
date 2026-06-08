'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = 'starrabbit-analytics-consent';

export default function GoogleAnalytics() {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (saved === 'accepted' || saved === 'declined') setConsent(saved);
  }, []);

  if (!GA_ID) return null;

  function updateConsent(value: 'accepted' | 'declined') {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {consent === 'accepted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${GA_ID}',{anonymize_ip:true});
          `}</Script>
        </>
      )}
      {consent === null && (
        <div className="fixed bottom-16 left-1/2 z-50 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            서비스 개선을 위해 Google Analytics를 사용합니다. 선택 동의이며, 거부해도 서비스 이용에는 영향이 없습니다.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => updateConsent('declined')} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 dark:border-gray-800">
              거부
            </button>
            <button type="button" onClick={() => updateConsent('accepted')} className="rounded-md bg-gray-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
              동의
            </button>
          </div>
        </div>
      )}
    </>
  );
}
