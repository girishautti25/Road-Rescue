-- Migration 20260913001500_step2_security_fixes.sql
-- Step 2 Security Audit Fixes: Mechanic RLS & Station Operator RLS Scoping

-- 1. Ensure user_id column exists on public.mechanics
ALTER TABLE public.mechanics
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

CREATE INDEX IF NOT EXISTS idx_mechanics_user_id ON public.mechanics(user_id);

-- 2. Drop legacy un-scoped policies on emergency_requests
DO $$ BEGIN
  DROP POLICY IF EXISTS "requests read own or staff or demo" ON public.emergency_requests;
  DROP POLICY IF EXISTS "requests update own or staff" ON public.emergency_requests;
  DROP POLICY IF EXISTS "requests public read" ON public.emergency_requests;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Scoped SELECT Policy for emergency_requests
CREATE POLICY "requests read own staff or demo" ON public.emergency_requests
  FOR SELECT USING (
    source = 'DEMO'
    OR (auth.role() = 'authenticated' AND (
      -- DRIVER: Read own requests
      driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
      -- ADMIN: Full read access
      OR public.has_role(auth.uid(), 'ADMIN')
      -- STATION_OPERATOR: Read requests at assigned station only
      OR (
        public.has_role(auth.uid(), 'STATION_OPERATOR')
        AND station_id IS NOT NULL
        AND station_id = (SELECT station_id FROM public.profiles WHERE user_id = auth.uid())
      )
      -- MECHANIC: Read assigned requests OR requests currently seeking a mechanic
      OR (
        public.has_role(auth.uid(), 'MECHANIC')
        AND (
          status IN ('MECHANIC_SEARCHING', 'UNABLE_TO_REPAIR')
          OR (
            mechanic_id IS NOT NULL 
            AND mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
          )
        )
      )
    ))
  );

-- 4. Scoped UPDATE Policy for emergency_requests
CREATE POLICY "requests update own or staff" ON public.emergency_requests
  FOR UPDATE TO authenticated
  USING (
    -- DRIVER: Update own requests
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    -- ADMIN: Full update access
    OR public.has_role(auth.uid(), 'ADMIN')
    -- STATION_OPERATOR: Update requests at assigned station only
    OR (
      public.has_role(auth.uid(), 'STATION_OPERATOR')
      AND station_id IS NOT NULL
      AND station_id = (SELECT station_id FROM public.profiles WHERE user_id = auth.uid())
    )
    -- MECHANIC: Update assigned requests or accept available mechanic dispatch requests
    OR (
      public.has_role(auth.uid(), 'MECHANIC')
      AND (
        status = 'MECHANIC_SEARCHING'
        OR (
          mechanic_id IS NOT NULL 
          AND mechanic_id IN (SELECT id FROM public.mechanics WHERE user_id = auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    -- DRIVER: Check driver ownership
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
    -- ADMIN: Full check
    OR public.has_role(auth.uid(), 'ADMIN')
    -- STATION_OPERATOR: Check station assignment matches operator
    OR (
      public.has_role(auth.uid(), 'STATION_OPERATOR')
      AND station_id IS NOT NULL
      AND station_id = (SELECT station_id FROM public.profiles WHERE user_id = auth.uid())
    )
    -- MECHANIC: Check mechanic role
    OR public.has_role(auth.uid(), 'MECHANIC')
  );
