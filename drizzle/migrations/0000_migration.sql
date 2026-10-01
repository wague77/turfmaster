CREATE TABLE public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.access_codes TO service_role;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;