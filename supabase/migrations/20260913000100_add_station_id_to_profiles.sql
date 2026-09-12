-- Step 1: Add station_id column to profiles for station operator linking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS station_id text NULL REFERENCES public.stations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_station_id ON public.profiles(station_id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
