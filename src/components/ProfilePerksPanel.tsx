'use client';

import { useEffect, useState } from 'react';
import { AppTheme, applyAppTheme, readAppTheme } from './AppThemeController';

const THEMES: { id: AppTheme; label: string; desc: string }[] = [
  { id: 'default', label: '기본', desc: '별토끼 기본 화면' },
  { id: 'excel', label: '엑셀', desc: '표 계산기처럼 보이는 저시인성 화면' },
  { id: 'field', label: '들판', desc: '초록 들판 느낌의 산뜻한 화면' },
  { id: 'moon', label: '달밤', desc: '달토끼 분위기의 차분한 밤 화면' },
];

export default function ProfilePerksPanel() {
  const [theme, setTheme] = useState<AppTheme>('default');

  useEffect(() => {
    setTheme(readAppTheme());
  }, []);

  function selectTheme(nextTheme: AppTheme) {
    setTheme(nextTheme);
    applyAppTheme(nextTheme);
  }

  return (
    <>
      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-bold mb-3">화면 테마</h2>
        <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTheme(item.id)}
              className={`min-h-20 rounded-md border px-2 py-2 text-left transition-colors ${
                theme === item.id
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                  : 'border-gray-100 hover:border-gray-200 dark:border-gray-900 dark:hover:border-gray-800'
              }`}
            >
              <span className="block text-sm font-black">{item.label}</span>
              <span className="mt-1 block text-[11px] leading-snug text-gray-400">{item.desc}</span>
            </button>
          ))}
        </div>
      </section>

    </>
  );
}
