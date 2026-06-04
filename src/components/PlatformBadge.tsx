import { Platform } from '@/types';

const PLATFORM_LABEL: Record<Platform, string> = {
  naver: '네이버',
  kakao: '카카오',
  ridi: '리디',
  etc: '기타',
};

const PLATFORM_COLOR: Record<Platform, string> = {
  naver: 'bg-[#03C75A] text-white',
  kakao: 'bg-[#FEE500] text-black',
  ridi: 'bg-[#1f8ce6] text-white',
  etc: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PLATFORM_COLOR[platform]}`}>
      {PLATFORM_LABEL[platform]}
    </span>
  );
}

export function PlatformBadges({ platforms }: { platforms: Platform[] }) {
  const unique = [...new Set(platforms)];

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {unique.map((platform) => (
        <PlatformBadge key={platform} platform={platform} />
      ))}
    </span>
  );
}
