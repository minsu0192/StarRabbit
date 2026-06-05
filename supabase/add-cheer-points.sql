-- Adds point ledger and weekly cheer league tables.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount int NOT NULL CHECK (amount <> 0),
  reason text NOT NULL,
  unique_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unique_key)
);

CREATE TABLE IF NOT EXISTS public.cheer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'settled', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  winner_webtoon_id uuid REFERENCES public.webtoons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cheer_event_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.cheer_events(id) ON DELETE CASCADE,
  webtoon_id uuid NOT NULL REFERENCES public.webtoons(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, webtoon_id)
);

CREATE TABLE IF NOT EXISTS public.cheer_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.cheer_events(id) ON DELETE CASCADE,
  webtoon_id uuid NOT NULL REFERENCES public.webtoons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment text NOT NULL CHECK (char_length(trim(comment)) >= 2 AND char_length(comment) <= 300),
  recommend_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.cheer_comment_recommends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cheer_comment_id uuid NOT NULL REFERENCES public.cheer_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cheer_comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS point_transactions_user_id_idx ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS cheer_events_status_ends_at_idx ON public.cheer_events(status, ends_at);
CREATE INDEX IF NOT EXISTS cheer_comments_event_id_idx ON public.cheer_comments(event_id);
CREATE INDEX IF NOT EXISTS cheer_comments_webtoon_id_idx ON public.cheer_comments(webtoon_id);

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_unique_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean AS $$
DECLARE
  inserted_count int;
BEGIN
  INSERT INTO public.point_transactions (user_id, amount, reason, unique_key, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_unique_key, p_metadata)
  ON CONFLICT (unique_key) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 0 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET points = GREATEST(points + p_amount, 0)
  WHERE id = p_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_cheer_recommend_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.cheer_comments
  SET recommend_count = recommend_count + 1
  WHERE id = NEW.cheer_comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_cheer_recommend_delete()
RETURNS trigger AS $$
BEGIN
  UPDATE public.cheer_comments
  SET recommend_count = GREATEST(recommend_count - 1, 0)
  WHERE id = OLD.cheer_comment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_cheer_recommend_insert ON public.cheer_comment_recommends;
CREATE TRIGGER on_cheer_recommend_insert
  AFTER INSERT ON public.cheer_comment_recommends
  FOR EACH ROW EXECUTE FUNCTION public.handle_cheer_recommend_insert();

DROP TRIGGER IF EXISTS on_cheer_recommend_delete ON public.cheer_comment_recommends;
CREATE TRIGGER on_cheer_recommend_delete
  AFTER DELETE ON public.cheer_comment_recommends
  FOR EACH ROW EXECUTE FUNCTION public.handle_cheer_recommend_delete();

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_event_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheer_comment_recommends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_transactions_read_own"
  ON public.point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cheer_events_read"
  ON public.cheer_events FOR SELECT
  USING (true);

CREATE POLICY "cheer_event_entries_read"
  ON public.cheer_event_entries FOR SELECT
  USING (true);

CREATE POLICY "cheer_comments_read"
  ON public.cheer_comments FOR SELECT
  USING (true);

CREATE POLICY "cheer_comments_insert_own"
  ON public.cheer_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cheer_comments_update_own"
  ON public.cheer_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "cheer_comment_recommends_read"
  ON public.cheer_comment_recommends FOR SELECT
  USING (true);

CREATE POLICY "cheer_comment_recommends_insert_own"
  ON public.cheer_comment_recommends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cheer_comment_recommends_delete_own"
  ON public.cheer_comment_recommends FOR DELETE
  USING (auth.uid() = user_id);
