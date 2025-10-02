-- Disable the trigger that auto-creates profiles on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- We'll manually create profiles when user subscribes instead