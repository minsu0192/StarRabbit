'use client';

import { useState } from 'react';
import BannerUploader from './BannerUploader';

interface Props {
  updateBannerAd: (formData: FormData) => Promise<void>;
  bannerImageUrl: string;
  bannerLinkUrl: string;
  bannerAltText: string;
}

export default function AdminBannerSection({ updateBannerAd, bannerImageUrl, bannerLinkUrl, bannerAltText }: Props) {
  const [imageUrl, setImageUrl] = useState(bannerImageUrl);

  return (
    <div className="space-y-3">
      <BannerUploader onUploaded={(url) => setImageUrl(url)} />
      <form action={updateBannerAd} className="space-y-2">
        <input
          name="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="이미지 URL (업로드 후 자동 입력됩니다)"
          className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800"
        />
        <input name="linkUrl" defaultValue={bannerLinkUrl} placeholder="클릭 시 이동 URL" className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
        <input name="altText" defaultValue={bannerAltText} placeholder="광고 대체 텍스트 (예: 네이버웹툰 신작 게임 광고)" className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-gray-800" />
        <button className="rounded-md bg-gray-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-gray-950">
          배너 저장
        </button>
      </form>
    </div>
  );
}
