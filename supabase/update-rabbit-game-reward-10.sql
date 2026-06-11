-- Apply after add-rabbit-defense-game.sql to change rewards to 10 stars per cleared stage.

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

  RETURN jsonb_build_object('final_stage', p_final_stage, 'reward_stars', v_reward,
    'best_stage', GREATEST(v_stats.best_stage, p_final_stage));
END;
$$;

REVOKE ALL ON FUNCTION public.finish_rabbit_game_verified(uuid, uuid, int, int, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_rabbit_game_verified(uuid, uuid, int, int, jsonb)
  TO service_role;
