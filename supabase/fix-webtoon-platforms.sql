-- Data cleanup applied on 2026-06-04.
-- These rows came from early manual seed data and had zero reviews at cleanup time.

DELETE FROM public.webtoons
WHERE id IN (
  '996fc82e-8d71-4880-9760-bba02ad5acb8', -- 나노마신 duplicate; canonical Naver row exists
  '3f826a57-a041-4e58-9b5f-638ccb87357d', -- 재혼황후 duplicate; canonical Naver row exists as 재혼 황후
  'd7959377-0dfe-40a7-a4c1-a7437f427050'  -- unverified dummy title
)
AND NOT EXISTS (
  SELECT 1
  FROM public.reviews r
  WHERE r.webtoon_id = webtoons.id
);

UPDATE public.webtoons
SET platform = 'naver',
    author = '232',
    status = 'completed'
WHERE id = 'abea1ea8-68bf-4a12-8237-76c135f8931d'; -- 연애혁명

UPDATE public.webtoons
SET platform = 'naver',
    author = '서패스 / 김진석',
    status = 'completed'
WHERE id = '7bf7bd34-f653-417f-8cfd-ef08478978ed'; -- 약한영웅
