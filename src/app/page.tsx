export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">🐰 별토끼</span>
        <button className="text-sm px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          로그인
        </button>
      </header>

      {/* 히어로 */}
      <section className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
        {/* 마스코트 자리 (10단계에서 실제 이미지로 교체) */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-5xl shadow-lg">
          🐰
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">별토끼</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xs leading-relaxed">
          네이버는 다 9점,<br />
          <span className="text-black dark:text-white font-semibold">별토끼는 진짜 점수가 나온다.</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 max-w-xs">
          팬덤 몰표 없이 1인 1평. 솔직한 점수만.
        </p>
      </section>

      {/* 연결 상태 확인용 임시 영역 */}
      <section className="flex-1 flex flex-col items-center gap-3 px-4 pb-16">
        <div className="w-full max-w-2xl rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-400 dark:text-gray-600">
          웹툰 목록이 여기에 들어갑니다<br />
          <span className="text-xs">(2단계 DB 세팅 후 표시됩니다)</span>
        </div>

        {/* 등급 미리보기 */}
        <div className="w-full max-w-2xl mt-4">
          <p className="text-xs text-gray-400 dark:text-gray-600 mb-2 text-center">등급 미리보기</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "길토끼", color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
              { label: "들토끼", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "달토끼", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
              { label: "별토끼", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
              { label: "무지개토끼", color: "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500", bg: "bg-gray-50 dark:bg-gray-900" },
            ].map(({ label, color, bg }) => (
              <span
                key={label}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${bg} ${color}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-600">
        © 2026 별토끼
      </footer>
    </div>
  );
}
