import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="py-6 text-center text-xs text-gray-300 dark:text-gray-700">
      <div className="flex items-center justify-center gap-3 mb-1.5">
        <Link href="/terms" className="hover:text-gray-500 transition-colors">이용약관</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-gray-500 transition-colors font-semibold">개인정보처리방침</Link>
      </div>
      © 2026 별토끼
    </footer>
  );
}
