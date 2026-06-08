'use client';

import { useEffect, useState } from 'react';
import TierBunny from './TierBunny';

interface LevelUpPopupProps {
  userId: string;
  levelLabel: string;
  levelIndex: number;
}

export default function LevelUpPopup({ userId, levelLabel, levelIndex }: LevelUpPopupProps) {
  const [open, setOpen] = useState(false);
  const storageKey = `starrabbit-level:${userId}`;

  useEffect(() => {
    const previous = Number(window.localStorage.getItem(storageKey));
    if (Number.isFinite(previous) && previous >= 0 && levelIndex > previous) {
      setOpen(true);
    }
    window.localStorage.setItem(storageKey, String(levelIndex));
  }, [levelIndex, storageKey]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs rounded-lg border border-amber-200 bg-white p-5 text-center shadow-xl dark:border-amber-900 dark:bg-gray-950">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
          <TierBunny tier={levelLabel} size={58} />
        </div>
        <p className="text-xs font-black text-amber-500">LEVEL UP</p>
        <h2 className="mt-1 text-xl font-black">{levelLabel} 승급!</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">포인트가 쌓여 새 토끼 등급이 열렸어요.</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full rounded-md bg-gray-950 px-3 py-2 text-sm font-bold text-white dark:bg-white dark:text-gray-950"
        >
          확인
        </button>
      </div>
    </div>
  );
}
