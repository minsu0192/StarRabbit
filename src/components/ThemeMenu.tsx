'use client';

import { useEffect, useRef, useState } from 'react';
import { AppTheme, applyAppTheme, readAppTheme } from './AppThemeController';

const THEMES: { id: AppTheme; label: string; swatch: string }[] = [
  { id: 'default', label: '기본', swatch: 'bg-amber-300' },
  { id: 'excel', label: '엑셀', swatch: 'bg-green-700' },
  { id: 'field', label: '들판', swatch: 'bg-lime-500' },
  { id: 'moon', label: '달밤', swatch: 'bg-indigo-700' },
];

export default function ThemeMenu() {
  const [theme, setTheme] = useState<AppTheme>('default');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(readAppTheme());

    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  function selectTheme(nextTheme: AppTheme) {
    setTheme(nextTheme);
    applyAppTheme(nextTheme);
    setOpen(false);
  }

  const current = THEMES.find((item) => item.id === theme) ?? THEMES[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="화면 테마 변경"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
      >
        <span className={`h-3 w-3 rounded-sm ${current.swatch}`} aria-hidden="true" />
        <span className="hidden min-[420px]:inline">테마</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-40 w-36 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950">
          {THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTheme(item.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
                theme === item.id
                  ? 'bg-amber-50 font-black text-gray-950 dark:bg-amber-950/30 dark:text-white'
                  : 'font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <span className={`h-3 w-3 rounded-sm ${item.swatch}`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
