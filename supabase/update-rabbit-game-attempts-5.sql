-- Apply after add-rabbit-defense-game.sql to allow five daily attempts.

ALTER TABLE public.game_daily_stats
  DROP CONSTRAINT IF EXISTS game_daily_stats_attempts_used_check;
ALTER TABLE public.game_daily_stats
  ADD CONSTRAINT game_daily_stats_attempts_used_check CHECK (attempts_used BETWEEN 0 AND 5);

ALTER TABLE public.game_runs
  DROP CONSTRAINT IF EXISTS game_runs_attempt_no_check;
ALTER TABLE public.game_runs
  ADD CONSTRAINT game_runs_attempt_no_check CHECK (attempt_no BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION public.start_rabbit_game()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_date date := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_stats public.game_daily_stats%ROWTYPE;
  v_run_id uuid;
  v_earned int;
  v_tier_count int;
  v_tier_keys text[] := ARRAY['road','grass','field','moon','star','galaxy','space','legend'];
  v_unlocks jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  SELECT earned_points INTO v_earned FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile required'; END IF;

  INSERT INTO public.game_daily_stats(user_id, game_date) VALUES (v_user_id, v_date)
  ON CONFLICT (user_id, game_date) DO NOTHING;
  SELECT * INTO v_stats FROM public.game_daily_stats
  WHERE user_id = v_user_id AND game_date = v_date FOR UPDATE;

  UPDATE public.game_runs SET status = 'expired', finished_at = now()
  WHERE user_id = v_user_id AND status = 'active' AND expires_at <= now();
  IF EXISTS (SELECT 1 FROM public.game_runs WHERE user_id = v_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'active run exists';
  END IF;
  IF v_stats.attempts_used >= 5 THEN RAISE EXCEPTION 'daily attempts exhausted'; END IF;

  v_tier_count := CASE
    WHEN v_earned >= 50000 THEN 8 WHEN v_earned >= 15000 THEN 7
    WHEN v_earned >= 5000 THEN 6 WHEN v_earned >= 1500 THEN 5
    WHEN v_earned >= 500 THEN 4 WHEN v_earned >= 150 THEN 3
    WHEN v_earned >= 50 THEN 2 ELSE 1 END;

  SELECT to_jsonb(v_tier_keys[1:v_tier_count]) || COALESCE(jsonb_agg(si.costume_key) FILTER (WHERE si.costume_key IS NOT NULL), '[]'::jsonb)
  INTO v_unlocks FROM public.user_items ui JOIN public.shop_items si ON si.id = ui.item_id
  WHERE ui.user_id = v_user_id AND si.type = 'costume'
    AND (ui.expires_at IS NULL OR ui.expires_at > now());

  UPDATE public.game_daily_stats SET attempts_used = attempts_used + 1, updated_at = now()
  WHERE user_id = v_user_id AND game_date = v_date RETURNING * INTO v_stats;
  INSERT INTO public.game_runs(user_id, game_date, attempt_no, unlock_snapshot)
  VALUES (v_user_id, v_date, v_stats.attempts_used, COALESCE(v_unlocks, to_jsonb(v_tier_keys[1:v_tier_count])))
  RETURNING id INTO v_run_id;

  RETURN jsonb_build_object('run_id', v_run_id, 'attempts_used', v_stats.attempts_used,
    'best_stage', v_stats.best_stage, 'unlocks', v_unlocks);
END;
$$;

REVOKE ALL ON FUNCTION public.start_rabbit_game() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_rabbit_game() TO authenticated;
