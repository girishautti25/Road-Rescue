-- Step 1: Add role column to profiles for storing user role (DRIVER, MECHANIC, STATION_OPERATOR, ADMIN, SUPER_ADMIN)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'DRIVER';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Ensure that public sign-up/users cannot set privileged roles via a trigger, while admins can
CREATE OR REPLACE FUNCTION public.validate_profile_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If invoked by normal authenticated user who is NOT an admin, reject privileged role assignment
  IF (auth.role() = 'authenticated' AND NOT public.has_role(auth.uid(), 'ADMIN')) THEN
    IF NEW.role IN ('ADMIN', 'SUPER_ADMIN', 'STATION_OPERATOR') THEN
      RAISE EXCEPTION 'Privileged roles must be assigned by an administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_role_trigger ON public.profiles;
CREATE TRIGGER validate_profile_role_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_role();
