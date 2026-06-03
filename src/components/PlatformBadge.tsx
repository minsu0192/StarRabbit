import { Platform } from '@/types';

const PLATFORM_LABEL: Record<Platform, string> = {
  naver: '네이버',
  kakao: '카카오',
  etc: '기타',
};

const PLATFORM_COLOR: Record<Platform, string> = {
  naver: 'bg-[#03C75A] text-white',
  kakao: 'bg-[#FEE500] text-black',
  etc: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PLATFORM_COLOR[platform]}`}>
      {PLATFORM_LABEL[platform]}
    </span>
  );
}
