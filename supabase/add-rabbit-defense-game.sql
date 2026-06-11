-- Rabbit Hole Guardians: daily attempts, verified runs, and idempotent rewards.

CREATE TABLE IF NOT EXISTS public.game_daily_stats (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_date date NOT NULL,
  attempts_used smallint NOT NULL DEFAULT 0 CHECK (attempts_used BETWEEN 0 AND 3),
  best_stage smallint NOT NULL DEFAULT 0 CHECK (best_stage BETWEEN 0 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_date)
);

CREATE TABLE IF NOT EXISTS public.game_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_date date NOT NULL,
  attempt_no smallint NOT NULL CHECK (attempt_no BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'failed', 'expired', 'rejected')),
  unlock_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  command_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_stage smallint NOT NULL DEFAULT 0 CHECK (final_stage BETWEEN 0 AND 20),
  reward_stars int NOT NULL DEFAULT 0 CHECK (reward_stars BETWEEN 0 AND 200),
  elapsed_ms int NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '45 minutes',
  UNIQUE (user_id, game_date, attempt_no)
);

CREATE INDEX IF NOT EXISTS game_runs_user_started_idx ON public.game_runs(user_id, started_at DESC);

ALTER TABLE public.game_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_daily_stats_read_own ON public.game_daily_stats;
CREATE POLICY game_daily_stats_read_own ON public.game_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS game_runs_read_own ON public.game_runs;
CREATE POLICY game_runs_read_own ON public.game_runs
  FOR SELECT USING (auth.uid() = user_id);

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

  INSERT INTO public.game_daily_stats(user_id, game_date)
  VALUES (v_user_id, v_date)
  ON CONFLICT (user_id, game_date) DO NOTHING;

  SELECT * INTO v_stats FROM public.game_daily_stats
  WHERE user_id = v_user_id AND game_date = v_date FOR UPDATE;

  UPDATE public.game_runs SET status = 'expired', finished_at = now()
  WHERE user_id = v_user_id AND status = 'active' AND expires_at <= now();

  IF EXISTS (SELECT 1 FROM public.game_runs WHERE user_id = v_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'active run exists';
  END IF;
  IF v_stats.attempts_used >= 3 THEN RAISE EXCEPTION 'daily attempts exhausted'; END IF;

  v_tier_count := CASE
    WHEN v_earned >= 50000 THEN 8 WHEN v_earned >= 15000 THEN 7
    WHEN v_earned >= 5000 THEN 6 WHEN v_earned >= 1500 THEN 5
    WHEN v_earned >= 500 THEN 4 WHEN v_earned >= 150 THEN 3
    WHEN v_earned >= 50 THEN 2 ELSE 1 END;

  SELECT to_jsonb(v_tier_keys[1:v_tier_count]) || COALESCE(jsonb_agg(si.costume_key) FILTER (WHERE si.costume_key IS NOT NULL), '[]'::jsonb)
  INTO v_unlocks
  FROM public.user_items ui
  JOIN public.shop_items si ON si.id = ui.item_id
  WHERE ui.user_id = v_user_id AND si.type = 'costume'
    AND (ui.expires_at IS NULL OR ui.expires_at > now());

  UPDATE public.game_daily_stats SET attempts_used = attempts_used + 1, updated_at = now()
  WHERE user_id = v_user_id AND game_date = v_date
  RETURNING * INTO v_stats;

  INSERT INTO public.game_runs(user_id, game_date, attempt_no, unlock_snapshot)
  VALUES (v_user_id, v_date, v_stats.attempts_used, COALESCE(v_unlocks, to_jsonb(v_tier_keys[1:v_tier_count])))
  RETURNING id INTO v_run_id;

  RETURN jsonb_build_object('run_id', v_run_id, 'attempts_used', v_stats.attempts_used,
    'best_stage', v_stats.best_stage, 'unlocks', v_unlocks);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_rabbit_game_verified(
  p_run_id uuid, p_user_id uuid, p_final_stage int, p_elapsed_ms int, p_command_log jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.game_runs%ROWTYPE;
  v_stats public.game_daily_stats%ROWTYPE;
  v_reward int := 0;
  v_stage int;
BEGIN
  SELECT * INTO v_run FROM public.game_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND OR v_run.user_id <> p_user_id THEN RAISE EXCEPTION 'run not found'; END IF;
  IF v_run.status <> 'active' THEN
    RETURN jsonb_build_object('final_stage', v_run.final_stage, 'reward_stars', v_run.reward_stars, 'already_finished', true);
  END IF;
  IF p_final_stage < 0 OR p_final_stage > 20 OR p_elapsed_ms < 0 THEN RAISE EXCEPTION 'invalid result'; END IF;

  SELECT * INTO v_stats FROM public.game_daily_stats
  WHERE user_id = p_user_id AND game_date = v_run.game_date FOR UPDATE;

  IF p_final_stage > 0 THEN
    FOR v_stage IN 1..p_final_stage LOOP
      INSERT INTO public.point_transactions(user_id, amount, reason, unique_key, metadata)
      VALUES (p_user_id, 10, '토끼굴 수호대 ' || v_stage || '스테이지',
        'game:' || p_run_id || ':stage:' || v_stage,
        jsonb_build_object('run_id', p_run_id, 'stage', v_stage, 'game_date', v_run.game_date))
      ON CONFLICT (unique_key) DO NOTHING;
      IF FOUND THEN v_reward := v_reward + 10; END IF;
    END LOOP;

    UPDATE public.profiles SET points = points + v_reward, earned_points = earned_points + v_reward WHERE id = p_user_id;
    UPDATE public.game_daily_stats SET best_stage = GREATEST(best_stage, p_final_stage), updated_at = now()
    WHERE user_id = p_user_id AND game_date = v_run.game_date;
  END IF;

  UPDATE public.game_runs SET status = CASE WHEN p_final_stage = 20 THEN 'cleared' ELSE 'failed' END,
    final_stage = p_final_stage, reward_stars = v_reward, elapsed_ms = p_elapsed_ms,
    command_log = p_command_log, finished_at = now()
  WHERE id = p_run_id;

  RETURN jsonb_build_object('final_stage', p_final_stage, 'reward_stars', v_reward, 'best_stage', GREATEST(v_stats.best_stage, p_final_stage));
END;
$$;

REVOKE ALL ON FUNCTION public.start_rabbit_game() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_rabbit_game() TO authenticated;
REVOKE ALL ON FUNCTION public.finish_rabbit_game_verified(uuid, uuid, int, int, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_rabbit_game_verified(uuid, uuid, int, int, jsonb) TO service_role;
