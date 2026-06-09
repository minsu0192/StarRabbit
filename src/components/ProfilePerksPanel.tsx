'use client';

import { useEffect, useState } from 'react';
import { AppTheme, applyAppTheme, readAppTheme } from './AppThemeController';

const THEMES: { id: AppTheme; label: string; desc: string }[] = [
  { id: 'default', label: '기본', desc: '별토끼 기본 화면' },
  { id: 'excel', label: '엑셀', desc: '표 계산기처럼 보이는 저시인성 화면' },
  { id: 'field', label: '들판', desc: '초록 들판 느낌의 산뜻한 화면' },
  { id: 'moon', label: '달밤', desc: '달토끼 분위기의 차분한 밤 화면' },
];

const SHOP_ITEMS = [
  { name: '닉네임 컬러 7일', price: 300, desc: '프로필과 한줄평 닉네임에 포인트 컬러 적용' },
  { name: '프로필 배지 30일', price: 700, desc: '등급 옆에 작은 배지 표시' },
  { name: '한줄평 강조권', price: 1200, desc: '내 한줄평 배경을 은은하게 강조' },
];

export default function ProfilePerksPanel({ points }: { points: number }) {
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

      <section className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">스타 상점 구상</h2>
            <p className="mt-0.5 text-xs text-gray-400">현재 보유 {points.toLocaleString()} ★ 기준</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-500 dark:bg-gray-900">기획중</span>
        </div>
        <div className="grid gap-2">
          {SHOP_ITEMS.map((item) => (
            <div key={item.name} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-gray-100 px-3 py-2.5 dark:border-gray-900">
              <div className="min-w-0">
                <p className="text-sm font-bold">{item.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">{item.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black tabular-nums text-amber-500">{item.price.toLocaleString()} ★</p>
                <p className={`text-[10px] font-bold ${points >= item.price ? 'text-green-500' : 'text-gray-300 dark:text-gray-700'}`}>
                  {points >= item.price ? '가능' : '부족'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
