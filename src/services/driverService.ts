import { supabase } from '@/integrations/supabase/client';
import type { ProblemTypeId, Stage } from '@/lib/roadrescue/types';

export interface DriverProfile {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverVehicle {
  id: string;
  driver_id: string | null;
  label: string;
  plate: string;
  vehicle_type: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyRequestRow {
  id: string;
  driver_name: string;
  driver_id: string | null;
  vehicle_label: string;
  vehicle_id?: string | null;
  problem_type: string;
  details: string | null;
  button_id: string | null;
  km: number;
  lat: number;
  lng: number;
  station_id: string | null;
  pod_id: string | null;
  mechanic_id: string | null;
  status: string;
  stage?: string;
  pod_progress: number;
  mechanic_progress: number;
  distance_km: number;
  eta_min: number;
  amount: number;
  paid: boolean;
  kit_unlocked: boolean;
  source: string;
  timeline?: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** Get or create driver profile associated with authenticated user_id */
export async function getOrCreateDriverProfile(userId: string, email?: string | null): Promise<DriverProfile> {
  const { data: existing, error: fetchErr } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    console.warn('[driverService] Error fetching driver profile:', fetchErr.message);
  }

  if (existing) {
    return existing as DriverProfile;
  }

  const name: string = email ? (email.split('@')[0] ?? 'Driver') : 'Driver';
  const { data: created, error: createErr } = await supabase
    .from('drivers')
    .insert({
      user_id: userId,
      name,
      phone: null,
    })
    .select('*')
    .single();

  if (createErr) {
    throw createErr;
  }

  return created as DriverProfile;
}

/** Fetch vehicles owned by driver */
export async function fetchDriverVehicles(driverId: string): Promise<DriverVehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[driverService] Error fetching vehicles:', error.message);
    return [];
  }

  return (data ?? []) as DriverVehicle[];
}

/** Add a new vehicle for driver */
export async function addDriverVehicle(
  driverId: string,
  vehicle: { label: string; plate: string; vehicle_type: string }
): Promise<DriverVehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      driver_id: driverId,
      label: vehicle.label,
      plate: vehicle.plate,
      vehicle_type: vehicle.vehicle_type,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as DriverVehicle;
}

/** Create a persistent emergency request in Supabase */
export async function createSupabaseEmergencyRequest(input: {
  driverId: string;
  driverName: string;
  vehicleLabel: string;
  vehicleId?: string | null;
  problemType: ProblemTypeId;
  buttonId?: string | null;
  km: number;
  lat: number;
  lng: number;
  source?: string;
}): Promise<EmergencyRequestRow> {
  let reqCode: string = `REQ-${Date.now()}`;
  try {
    const { data: codeData } = await supabase.rpc('next_request_code');
    if (codeData) reqCode = codeData;
  } catch (e) {
    // fallback code
  }

  const nowIso = new Date().toISOString();
  const initialTimeline = [{ stage: 'CREATED', at: Date.now() }];

  const payload: any = {
    id: reqCode,
    driver_id: input.driverId,
    driver_name: input.driverName,
    vehicle_label: input.vehicleLabel,
    vehicle_id: input.vehicleId ?? null,
    problem_type: input.problemType,
    button_id: input.buttonId ?? null,
    km: input.km,
    lat: input.lat,
    lng: input.lng,
    status: 'CREATED',
    stage: 'CREATED',
    pod_progress: 0,
    mechanic_progress: 0,
    distance_km: 0,
    eta_min: 0,
    amount: 99,
    paid: false,
    kit_unlocked: false,
    source: input.source ?? 'APP',
    timeline: initialTimeline,
  };

  const { data, error } = await supabase
    .from('emergency_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as EmergencyRequestRow;
}

/** Fetch single emergency request by ID */
export async function fetchEmergencyRequestById(id: string): Promise<EmergencyRequestRow | null> {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.warn('[driverService] Error fetching request by ID:', error.message);
    return null;
  }

  return data as EmergencyRequestRow | null;
}

/** Fetch all emergency requests for driver */
export async function fetchDriverRequests(driverId: string): Promise<EmergencyRequestRow[]> {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[driverService] Error fetching driver requests:', error.message);
    return [];
  }

  return (data ?? []) as EmergencyRequestRow[];
}

/** Update emergency request */
export async function updateEmergencyRequest(
  id: string,
  patch: Partial<EmergencyRequestRow>
): Promise<void> {
  const { error } = await supabase
    .from('emergency_requests')
    .update(patch as any)
    .eq('id', id);

  if (error) {
    console.warn('[driverService] Error updating emergency request:', error.message);
  }
}

/** RPC Wrapper: Dispatch Emergency Pod atomically */
export async function dispatchEmergencyPod(requestId: string): Promise<{
  success: boolean;
  station_id?: string;
  pod_id?: string;
  distance_km?: number;
  eta_min?: number;
  reason?: string;
}> {
  const { data, error } = await supabase.rpc('dispatch_emergency_pod', { p_request_id: requestId });
  if (error) {
    console.warn('[driverService] Error calling dispatch_emergency_pod RPC:', error.message);
    return { success: false, reason: error.message };
  }
  return data as any;
}

/** RPC Wrapper: Assign Emergency Mechanic atomically */
export async function assignEmergencyMechanic(requestId: string): Promise<{
  success: boolean;
  mechanic_id?: string;
  reason?: string;
}> {
  const { data, error } = await supabase.rpc('assign_emergency_mechanic', { p_request_id: requestId });
  if (error) {
    console.warn('[driverService] Error calling assign_emergency_mechanic RPC:', error.message);
    return { success: false, reason: error.message };
  }
  return data as any;
}

/** RPC Wrapper: Advance Emergency Stage & Release Resources on Completion */
export async function advanceEmergencyStage(requestId: string, targetStage: Stage): Promise<{
  success: boolean;
  stage?: string;
  reason?: string;
}> {
  const { data, error } = await supabase.rpc('advance_emergency_stage', {
    p_request_id: requestId,
    p_target_stage: targetStage,
  });
  if (error) {
    console.warn('[driverService] Error calling advance_emergency_stage RPC:', error.message);
    return { success: false, reason: error.message };
  }
  return data as any;
}

