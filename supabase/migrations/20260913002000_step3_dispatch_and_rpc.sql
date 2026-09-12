-- Step 3: Real Emergency Dispatch & Live Operations RPC Functions

-- 1. Create indexes for quick pod & mechanic lookup
CREATE INDEX IF NOT EXISTS idx_pods_station_status ON public.pods(station_id, status);
CREATE INDEX IF NOT EXISTS idx_mechanics_available ON public.mechanics(available);

-- 2. RPC: Atomic Pod Dispatch & Assignment
CREATE OR REPLACE FUNCTION public.dispatch_emergency_pod(p_request_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_station record;
  v_pod record;
  v_dist numeric;
  v_eta integer;
  v_now timestamptz := now();
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
BEGIN
  -- Lock emergency request row
  SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'REQUEST_NOT_FOUND');
  END IF;

  -- Check if already assigned
  IF v_req.pod_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_assigned', true, 'pod_id', v_req.pod_id, 'station_id', v_req.station_id);
  END IF;

  -- Find nearest ONLINE station with an AVAILABLE pod within rail reach
  SELECT s.*, p.id AS pod_id INTO v_station
  FROM public.stations s
  JOIN public.pods p ON p.station_id = s.id
  WHERE s.status = 'ONLINE'
    AND (p.status = 'AVAILABLE' OR p.status = 'IDLE')
    AND abs(s.km - v_req.km) <= s.rail_length_km
  ORDER BY abs(s.km - v_req.km) ASC
  LIMIT 1
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'NO_POD_AVAILABLE');
  END IF;

  -- Get pod details
  SELECT * INTO v_pod FROM public.pods WHERE id = v_station.pod_id FOR UPDATE;

  -- Update pod status
  UPDATE public.pods
  SET status = 'DISPATCHED',
      current_request_id = p_request_id,
      updated_at = v_now
  WHERE id = v_pod.id;

  -- Calculate distance and ETA
  v_dist := round(abs(v_station.km - v_req.km), 1);
  v_eta := greatest(2, round((v_dist / 42.0) * 60)::integer);

  -- Update emergency request
  UPDATE public.emergency_requests
  SET station_id = v_station.id,
      pod_id = v_pod.id,
      distance_km = v_dist,
      eta_min = v_eta,
      status = 'POD_ASSIGNED',
      stage = 'POD_ASSIGNED',
      timeline = timeline || jsonb_build_object('stage', 'POD_ASSIGNED', 'at', v_now_ms),
      updated_at = v_now
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'station_id', v_station.id,
    'pod_id', v_pod.id,
    'distance_km', v_dist,
    'eta_min', v_eta
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_emergency_pod(text) TO authenticated, service_role;

-- 3. RPC: Atomic Mechanic Assignment
CREATE OR REPLACE FUNCTION public.assign_emergency_mechanic(p_request_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_mech record;
  v_now timestamptz := now();
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
BEGIN
  -- Lock request row
  SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'REQUEST_NOT_FOUND');
  END IF;

  -- If already assigned
  IF v_req.mechanic_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_assigned', true, 'mechanic_id', v_req.mechanic_id);
  END IF;

  -- Find nearest available mechanic
  SELECT * INTO v_mech
  FROM public.mechanics
  WHERE available = true
  ORDER BY abs(km - v_req.km) ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    -- If no mechanic is immediately available, mark searching status
    UPDATE public.emergency_requests
    SET status = 'MECHANIC_SEARCHING',
        stage = 'MECHANIC_SEARCHING',
        timeline = timeline || jsonb_build_object('stage', 'MECHANIC_SEARCHING', 'at', v_now_ms),
        updated_at = v_now
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', false, 'reason', 'NO_MECHANIC_AVAILABLE');
  END IF;

  -- Lock mechanic
  UPDATE public.mechanics
  SET available = false,
      updated_at = v_now
  WHERE id = v_mech.id;

  -- Update request
  UPDATE public.emergency_requests
  SET mechanic_id = v_mech.id,
      status = 'MECHANIC_ASSIGNED',
      stage = 'MECHANIC_ASSIGNED',
      mechanic_progress = 0,
      timeline = timeline || jsonb_build_object('stage', 'MECHANIC_ASSIGNED', 'at', v_now_ms),
      updated_at = v_now
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'mechanic_id', v_mech.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_emergency_mechanic(text) TO authenticated, service_role;

-- 4. RPC: Advance Emergency Stage & Release Resources on Completion
CREATE OR REPLACE FUNCTION public.advance_emergency_stage(p_request_id text, p_target_stage text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req record;
  v_now timestamptz := now();
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
BEGIN
  SELECT * INTO v_req FROM public.emergency_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'REQUEST_NOT_FOUND');
  END IF;

  -- Update stage and status
  UPDATE public.emergency_requests
  SET status = p_target_stage,
      stage = p_target_stage,
      timeline = timeline || jsonb_build_object('stage', p_target_stage, 'at', v_now_ms),
      updated_at = v_now,
      completed_at = CASE WHEN p_target_stage = 'COMPLETED' THEN v_now ELSE completed_at END
  WHERE id = p_request_id;

  -- Resource release logic when completed
  IF p_target_stage = 'COMPLETED' THEN
    -- Free assigned pod
    IF v_req.pod_id IS NOT NULL THEN
      UPDATE public.pods
      SET status = 'AVAILABLE',
          current_request_id = NULL,
          kit_seal = 'SEALED',
          updated_at = v_now
      WHERE id = v_req.pod_id;
    END IF;

    -- Free assigned mechanic
    IF v_req.mechanic_id IS NOT NULL THEN
      UPDATE public.mechanics
      SET available = true,
          jobs = jobs + 1,
          earnings = earnings + 850,
          updated_at = v_now
      WHERE id = v_req.mechanic_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'stage', p_target_stage);
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_emergency_stage(text, text) TO authenticated, service_role;
