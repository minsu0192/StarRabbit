'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface WebtoonResult {
  id: string;
  title: string;
  author: string | null;
  platform: string;
}

export default function WebtoonSearchPicker({ name = 'webtoonIds' }: { name?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WebtoonResult[]>([]);
  const [selected, setSelected] = useState<WebtoonResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('webtoons')
        .select('id, title, author, platform')
        .ilike('title', `%${query.trim()}%`)
        .limit(8);
      const filtered = (data ?? []).filter((w) => !selected.some((s) => s.id === w.id));
      setResults(filtered);
      setOpen(filtered.length > 0);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query, selected]);

  function add(w: WebtoonResult) {
    setSelected((prev) => [...prev, w]);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function remove(id: string) {
    setSelected((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="작품 제목으로 검색..."
          className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800"
        />
        {open && (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
            {results.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onMouseDown={() => add(w)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <span className="text-sm font-bold">{w.title}</span>
                  <span className="text-xs text-gray-400">{w.author ?? ''}</span>
                  <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    w.platform === 'naver' ? 'bg-green-100 text-green-700' :
                    w.platform === 'kakao' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{w.platform}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((w) => (
            <div key={w.id} className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {w.title}
              <button
                type="button"
                onClick={() => remove(w.id)}
                className="ml-1 text-amber-400 hover:text-amber-700 dark:hover:text-amber-200"
                aria-label={`${w.title} 제거`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length < 2 && (
        <p className="text-[11px] text-gray-400">최소 2개 작품을 추가해야 응원전을 만들 수 있어요</p>
      )}

      <input type="hidden" name={name} value={selected.map((w) => w.id).join('\n')} />
    </div>
  );
}
