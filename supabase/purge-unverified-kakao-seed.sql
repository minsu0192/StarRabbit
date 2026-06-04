-- Data cleanup applied on 2026-06-04.
-- Purges old manual Kakao seed rows that had no reviews and no verified source.
-- Keep only Kakao rows that were manually verified through public sources.

DELETE FROM public.webtoons w
WHERE w.platform = 'kakao'
  AND w.title NOT IN (
    '나 혼자만 레벨업',
    '데뷔 못 하면 죽는 병 걸림'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.reviews r
    WHERE r.webtoon_id = w.id
  );
