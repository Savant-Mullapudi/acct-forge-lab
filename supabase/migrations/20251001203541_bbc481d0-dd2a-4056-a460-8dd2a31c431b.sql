-- Create password_reset_codes table for storing temporary reset codes
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- No policies needed - service role bypasses RLS and has full access
-- Anon and authenticated users are blocked by default

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email_code ON public.password_reset_codes(email, code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);