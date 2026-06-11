-- Restrict the generic point-award RPC to trusted server code.
-- Application routes and server actions call it with SUPABASE_SERVICE_ROLE_KEY.

REVOKE ALL ON FUNCTION public.award_points(uuid, int, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_points(uuid, int, text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.award_points(uuid, int, text, text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, int, text, text, jsonb) TO service_role;
