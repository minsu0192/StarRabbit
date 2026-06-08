'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'starrabbit-analytics-consent';

type Consent = 'accepted' | 'declined' | null;

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (!name?.startsWith('_ga')) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax`;
  }
}

export default function AnalyticsConsentSettings() {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    setConsent(saved === 'accepted' || saved === 'declined' ? saved : null);
  }, []);

  function updateConsent(next: Exclude<Consent, null>) {
    window.localStorage.setItem(CONSENT_KEY, next);
    if (next === 'declined') clearAnalyticsCookies();
    setConsent(next);
    window.location.reload();
  }

  return (
    <div className="mt-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
      <p className="text-xs">
        현재 Analytics 설정: <strong>{consent === 'accepted' ? '동의' : consent === 'declined' ? '거부' : '미선택'}</strong>
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => updateConsent('declined')} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold dark:border-gray-800">
          동의 철회
        </button>
        <button type="button" onClick={() => updateConsent('accepted')} className="rounded-md bg-gray-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
          분석 허용
        </button>
      </div>
    </div>
  );
}
