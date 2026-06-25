-- Promote user to admin
-- NOTE: Please execute this in your Supabase SQL Editor after you've signed up with bresleydimpho@gmail.com
UPDATE public.users 
SET user_type = 'admin' 
WHERE email = 'bresleydimpho@gmail.com';
