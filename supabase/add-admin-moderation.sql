-- Adds moderation, nickname cooldown, and editable site notices.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nickname_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'site_settings_read'
  ) THEN
    CREATE POLICY "site_settings_read"
      ON public.site_settings FOR SELECT
      USING (true);
  END IF;
END;
$$;
