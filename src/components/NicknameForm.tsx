'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateNickname } from '@/app/actions';

export default function NicknameForm({ currentNickname }: { currentNickname: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(currentNickname);
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = () => {
    if (value.trim() === currentNickname) { setMsg('현재 닉네임과 동일합니다'); return; }
    setMsg('');
    setIsSuccess(false);
    startTransition(async () => {
      const result = await updateNickname(value);
      if (result.error) {
        setMsg(result.error);
      } else {
        setIsSuccess(true);
        setMsg('닉네임이 변경되었습니다!');
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setMsg(''); setIsSuccess(false); }}
          maxLength={12}
          placeholder="닉네임 (2~12자)"
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none focus:border-amber-400 dark:focus:border-amber-500"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !value.trim()}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? '저장 중...' : '변경'}
        </button>
      </div>
      {msg && (
        <p className={`text-xs ${isSuccess ? 'text-green-500' : 'text-red-400'}`}>{msg}</p>
      )}
      <p className="text-[11px] text-gray-400">{value.length}/12</p>
    </div>
  );
}
