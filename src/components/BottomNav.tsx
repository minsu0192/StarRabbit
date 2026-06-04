'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const path = usePathname();

  const item = (href: string, icon: string, label: string) => {
    const active = path === href || (href !== '/' && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 py-2 px-5 transition-colors ${
          active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[var(--background)]/95 backdrop-blur border-t border-gray-100 dark:border-gray-800 flex justify-around max-w-2xl mx-auto">
      {item('/', '🏠', '홈')}
      {item('/search', '🔍', '검색')}
      {item('/profile', '👤', 'MY')}
    </nav>
  );
}
