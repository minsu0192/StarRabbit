-- anon(비로그인) 역할에 읽기 권한 부여
-- schema.sql에 GRANT 문장이 없어서 비로그인 상태에서 reviews 조회 불가 → 이걸 실행해야 정렬이 작동함

GRANT SELECT ON reviews TO anon, authenticated;
GRANT SELECT ON recommends TO anon, authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON webtoons TO anon, authenticated;
GRANT SELECT ON webtoon_sources TO anon, authenticated;
