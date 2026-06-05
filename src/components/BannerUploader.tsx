'use client';

import { useState, useRef } from 'react';

export default function BannerUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus('uploading');
    setMsg('');
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/upload-banner', { method: 'POST', body: form });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || json.error) {
        setStatus('error');
        setMsg(json.error ?? '업로드 실패');
        return;
      }
      setStatus('done');
      setMsg(json.url!);
      onUploaded(json.url!);
    } catch {
      setStatus('error');
      setMsg('네트워크 오류');
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-5 text-center hover:border-amber-400 dark:border-gray-800 dark:hover:border-amber-700"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {status === 'uploading' ? (
          <p className="text-sm text-amber-500 font-bold">업로드 중...</p>
        ) : status === 'done' ? (
          <>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">업로드 완료!</p>
            <p className="mt-1 text-[11px] text-gray-400 break-all max-w-full px-2">{msg}</p>
          </>
        ) : status === 'error' ? (
          <>
            <p className="text-sm font-bold text-red-500">{msg}</p>
            <p className="mt-1 text-xs text-gray-400">다시 클릭해서 재시도</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">클릭하거나 파일을 여기에 드래그</p>
            <p className="mt-1 text-[11px] text-gray-400">JPG · PNG · WebP · GIF · 최대 300KB</p>
            <p className="text-[11px] text-gray-400">권장 크기: 750 × 150px</p>
          </>
        )}
      </div>
    </div>
  );
}
