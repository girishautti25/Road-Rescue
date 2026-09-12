-- Step 2: Driver Emergency Flow Persistence & RLS Enhancements

-- 1. Add columns to emergency_requests if not present
ALTER TABLE public.emergency_requests 
  ADD COLUMN IF NOT EXISTS timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'CREATED';

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_emergency_requests_driver_id ON public.emergency_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at ON public.emergency_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

-- 3. RLS Policies for drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "drivers signed in read" ON public.drivers;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "drivers read own or admin" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'ADMIN')
    OR public.has_role(auth.uid(), 'STATION_OPERATOR')
    OR public.has_role(auth.uid(), 'MECHANIC')
  );

CREATE POLICY "drivers insert own" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "drivers update own or admin" ON public.drivers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'ADMIN'));

-- 4. RLS Policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "vehicles signed in read" ON public.vehicles;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "vehicles read own or admin" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
    OR public.has_role(auth.uid(), 'STATION_OPERATOR')
    OR public.has_role(auth.uid(), 'MECHANIC')
  );

CREATE POLICY "vehicles insert own" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "vehicles update own or admin" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
  )
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "vehicles delete own or admin" ON public.vehicles
  FOR DELETE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
  );

-- 5. RLS Policies for emergency_requests table
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "requests public read" ON public.emergency_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "requests read own or staff or demo" ON public.emergency_requests
  FOR SELECT USING (
    source = 'DEMO'
    OR (auth.role() = 'authenticated' AND (
      driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
      OR public.has_role(auth.uid(), 'ADMIN')
      OR public.has_role(auth.uid(), 'STATION_OPERATOR')
      OR public.has_role(auth.uid(), 'MECHANIC')
    ))
  );

CREATE POLICY "requests insert authenticated driver" ON public.emergency_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
  );

CREATE POLICY "requests update own or staff" ON public.emergency_requests
  FOR UPDATE TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
    OR public.has_role(auth.uid(), 'STATION_OPERATOR')
    OR public.has_role(auth.uid(), 'MECHANIC')
  )
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'ADMIN')
    OR public.has_role(auth.uid(), 'STATION_OPERATOR')
    OR public.has_role(auth.uid(), 'MECHANIC')
  );

-- 6. Enable Realtime publication for emergency_requests table
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
