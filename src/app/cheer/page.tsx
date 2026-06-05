export const runtime = 'edge';

import Header from '@/components/Header';
import BunnyMascot from '@/components/BunnyMascot';

export default function CheerPage() {
  return (
    <div className="flex min-h-screen w-full max-w-2xl flex-col mx-auto">
      <Header />

      <section className="border-b border-gray-100 px-4 py-6 dark:border-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900">
            <BunnyMascot size={36} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-500">CHEER LEAGUE</p>
            <h1 className="text-2xl font-black tracking-tight">별토끼 응원전</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">좋아하는 작품을 추천하고 포인트를 받는 주간 경쟁</p>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 px-4 py-5 dark:border-gray-900">
        <h2 className="mb-3 text-sm font-bold">진행 방식</h2>
        <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-300">
          <p>매주 작품 여러 개가 같은 리그에 올라가고, 유저는 작품 하나를 골라 응원 댓글을 남깁니다.</p>
          <p>이벤트 종료 시 응원 댓글 수와 추천 수를 합산해 승리 작품을 정합니다.</p>
          <p>포인트는 실제 참여 기록 기준으로만 지급하고, 같은 이벤트에서는 중복 지급을 막습니다.</p>
        </div>
      </section>

      <section className="px-4 py-5">
        <h2 className="mb-3 text-sm font-bold">운영 제한</h2>
        <div className="grid gap-2 text-sm text-gray-600 dark:text-gray-300">
          <p>응원 댓글은 이벤트당 1개만 포인트 지급 대상입니다.</p>
          <p>자기 댓글 추천, 반복 삭제 후 재작성, 동일 문구 도배는 포인트 지급에서 제외합니다.</p>
          <p>승리팀/패배팀 보상은 이벤트 종료 시 한 번만 정산합니다.</p>
        </div>
      </section>
    </div>
  );
}
