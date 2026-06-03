@AGENTS.md

# 별토끼 (Byeoltokki)

웹툰 평점·리뷰 커뮤니티. "네이버는 다 9점, 별토끼는 진짜 점수가 나온다."
팬덤 몰표 없이 1인 1평으로 솔직한 점수를 매기는 곳.

## 기술 스택

- **프레임워크:** Next.js 16 (App Router) + TypeScript
- **스타일:** Tailwind CSS v4
- **백엔드/DB/인증:** Supabase (PostgreSQL + Auth + RLS)
- **로그인:** 구글 OAuth (Supabase Auth)

## 핵심 규칙

- 읽기: 비로그인 허용 / 쓰기(평점·댓글·추천): 로그인 필수
- 1인 1평: 한 유저가 웹툰 1개당 평점+한줄평 딱 하나 (수정/삭제 가능)
- 평점: 1.0 ~ 10.0, 0.5 단위
- 추천: 다른 사람 한줄평에만 가능, 1인 1추
- 등급: 받은 추천 누적 → 길토끼(0)/들토끼(10+)/달토끼(100+)/별토끼(1000+)/무지개토끼(상위1%)

## 디렉토리 구조

```
src/
  app/           # Next.js App Router 페이지
  components/    # 재사용 UI 컴포넌트
  lib/
    supabase/    # Supabase 클라이언트 (client.ts, server.ts, middleware.ts)
    utils.ts     # 등급 계산, 진단 로직 등 순수 함수
  types/         # TypeScript 타입 정의
```

## 환경변수

`.env.local` 파일이 필요하다 (`.env.local.example` 참고):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 디자인 토큰

- 플랫폼 뱃지: 네이버=초록(#03C75A), 카카오=노랑(#FEE500), 기타=회색
- 평점 색: 8.0↑=초록, 5.0~7.9=노랑, 4.9↓=빨강
- 등급 색: 길토끼=회색, 들토끼=초록, 달토끼=파랑, 별토끼=금색, 무지개토끼=무지개

## 빌드 순서 (단계별 진행)

1. ✅ 프로젝트 세팅 — Next.js + Tailwind + Supabase 연결. 빈 화면 띄우기.
2. ⬜ DB 스키마 — 테이블 생성 + RLS 기본 규칙
3. ⬜ 웹툰 목록 + 시드 데이터 — 메인 페이지 리스트 + 검색바
4. ⬜ 구글 로그인 — Supabase Auth 구글 OAuth
5. ⬜ 평점·한줄평 작성 — 1인 1평 작성/수정/삭제
6. ⬜ 추천 + 등급 + 랭킹
7. ⬜ 자동 진단 — 분포 막대그래프 + 진단 문구
8. ⬜ 내 프로필
9. ⬜ 신고 + 금지어 필터
10. ⬜ 다듬기 — 마스코트, 정렬 칩, 반응형 점검
