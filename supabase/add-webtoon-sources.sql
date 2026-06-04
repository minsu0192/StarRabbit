-- Adds source-level platform tracking.
-- A single canonical webtoon can now have multiple source/platform rows.

CREATE TABLE IF NOT EXISTS public.webtoon_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webtoon_id uuid NOT NULL REFERENCES public.webtoons(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('naver', 'kakao', 'ridi', 'lezhin', 'bomtoon', 'toomics', 'etc')),
  external_id text,
  source_url text,
  title text NOT NULL,
  author text,
  genre text,
  status text CHECK (status IN ('ongoing', 'completed')),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  source_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id),
  UNIQUE (platform, source_url)
);

CREATE INDEX IF NOT EXISTS webtoon_sources_webtoon_id_idx
  ON public.webtoon_sources (webtoon_id);

CREATE INDEX IF NOT EXISTS webtoon_sources_platform_idx
  ON public.webtoon_sources (platform);

ALTER TABLE public.webtoon_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webtoon_sources'
      AND policyname = 'webtoon_sources_read'
  ) THEN
    CREATE POLICY "webtoon_sources_read"
      ON public.webtoon_sources
      FOR SELECT
      USING (true);
  END IF;
END;
$$;

INSERT INTO public.webtoon_sources (
  webtoon_id,
  platform,
  external_id,
  source_url,
  title,
  author,
  genre,
  status,
  source_checked_at
)
SELECT
  w.id,
  w.platform,
  w.id::text,
  NULL,
  w.title,
  w.author,
  w.genre,
  w.status,
  now()
FROM public.webtoons w
ON CONFLICT (platform, external_id) DO UPDATE
SET webtoon_id = EXCLUDED.webtoon_id,
    title = EXCLUDED.title,
    author = EXCLUDED.author,
    genre = EXCLUDED.genre,
    status = EXCLUDED.status,
    last_seen_at = now(),
    source_checked_at = EXCLUDED.source_checked_at,
    updated_at = now();
