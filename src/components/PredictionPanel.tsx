'use client';

import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'up', label: '상승' },
  { value: 'hold', label: '유지' },
  { value: 'down', label: '하락' },
] as const;

type Prediction = (typeof OPTIONS)[number]['value'];

export default function PredictionPanel({ webtoonId }: { webtoonId: string }) {
  const storageKey = `prediction:${webtoonId}`;
  const [selected, setSelected] = useState<Prediction | null>(null);

  useEffect(() => {
    const value = window.localStorage.getItem(storageKey);
    if (value === 'up' || value === 'hold' || value === 'down') setSelected(value);
  }, [storageKey]);

  const choose = (value: Prediction) => {
    setSelected(value);
    window.localStorage.setItem(storageKey, value);
  };

  return (
    <section className="border-b border-gray-100 px-4 py-4 dark:border-gray-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">이번 주 예측</h2>
        {selected && <span className="text-xs font-semibold text-amber-500">참여 완료</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => choose(option.value)}
            className={`h-10 rounded-md border text-sm font-bold transition-colors ${
              selected === option.value
                ? 'border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
