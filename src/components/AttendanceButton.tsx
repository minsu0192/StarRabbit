'use client';

import { useState } from 'react';
import { checkAttendance } from '@/app/actions';

interface Props {
  checkedToday: boolean;
}

export default function AttendanceButton({ checkedToday }: Props) {
  const [done, setDone] = useState(checkedToday);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (done || loading) return;
    setLoading(true);
    const result = await checkAttendance();
    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      setDone(true);
    } else {
      setDone(true);
      setMessage('+50 스타 획득!');
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={done || loading}
        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
          done
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-default'
            : 'bg-amber-400 text-white hover:bg-amber-500 active:bg-amber-600'
        }`}
      >
        {loading ? '처리 중...' : done ? '출석 완료 ✓' : '출석 체크'}
      </button>
      {message && (
        <span className={`text-xs font-bold ${message.startsWith('+') ? 'text-amber-500' : 'text-gray-400'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
