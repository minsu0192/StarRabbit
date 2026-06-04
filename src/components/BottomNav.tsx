'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

export default function BottomNav() {
  const path = usePathname();

  const item = (href: string, icon: ReactNode, label: string) => {
    const active = path === href || (href !== '/' && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex min-w-20 flex-col items-center gap-0.5 px-5 py-2 transition-colors ${
          active ? 'text-gray-950 dark:text-white' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {icon}
        <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-2xl justify-around border-t border-gray-100 bg-[var(--background)]/95 backdrop-blur dark:border-gray-900">
      {item('/', <HomeIcon />, '홈')}
      {item('/search', <SearchIcon />, '검색')}
      {item('/profile', <ProfileIcon />, 'MY')}
    </nav>
  );
}
