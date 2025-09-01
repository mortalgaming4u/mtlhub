-- Fix security warnings by setting proper search paths for functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'moderator' THEN 2
    WHEN 'user' THEN 3
  END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
  -- Update XP
  UPDATE public.profiles 
  SET xp = xp + _xp_amount 
  WHERE user_id = _user_id
  RETURNING xp INTO new_xp;
  
  -- Calculate new level (100 XP per level, with increasing requirements)
  new_level := FLOOR(SQRT(new_xp / 100)) + 1;
  
  -- Update level if increased
  UPDATE public.profiles 
  SET level = new_level 
  WHERE user_id = _user_id AND level < new_level;
END;
$$;