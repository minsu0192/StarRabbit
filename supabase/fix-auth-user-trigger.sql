-- Run this in Supabase SQL Editor if Google login shows:
-- "Database error saving new user"

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_nickname text;
BEGIN
  base_nickname := NULLIF(
    trim(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))),
    ''
  );

  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    left(COALESCE(base_nickname, '유저'), 8) || '-' || substr(NEW.id::text, 1, 4)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, nickname)
    VALUES (NEW.id, '유저-' || substr(NEW.id::text, 1, 8))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  WHEN others THEN
    -- Never let profile creation break Supabase Auth user creation.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_insert'
  ) THEN
    CREATE POLICY "profiles_insert"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END;
$$;

INSERT INTO public.profiles (id, nickname)
SELECT
  u.id,
  left(COALESCE(NULLIF(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1), '유저'), 8)
    || '-' || substr(u.id::text, 1, 4)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
