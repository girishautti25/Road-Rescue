-- ============ roles ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('DRIVER','MECHANIC','STATION_OPERATOR','ADMIN','SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ infrastructure ============
CREATE TABLE public.stations (
  id text PRIMARY KEY,
  name text NOT NULL,
  highway text NOT NULL DEFAULT 'NH-44',
  km numeric NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  status text NOT NULL DEFAULT 'ONLINE',
  rail_length_km numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stations TO anon, authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stations public read" ON public.stations FOR SELECT USING (true);
CREATE TRIGGER stations_touch BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.pods (
  id text PRIMARY KEY,
  station_id text NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'AVAILABLE',
  battery numeric NOT NULL DEFAULT 100,
  health numeric NOT NULL DEFAULT 100,
  km numeric NOT NULL,
  destination_km numeric,
  progress numeric NOT NULL DEFAULT 0,
  kit_seal text NOT NULL DEFAULT 'SEALED',
  current_request_id text,
  obstacle_clear boolean NOT NULL DEFAULT true,
  last_maintenance_at timestamptz DEFAULT now() - interval '21 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pods TO anon, authenticated;
GRANT ALL ON public.pods TO service_role;
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pods public read" ON public.pods FOR SELECT USING (true);
CREATE TRIGGER pods_touch BEFORE UPDATE ON public.pods FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.emergency_buttons (
  id text PRIMARY KEY,
  highway text NOT NULL DEFAULT 'NH-44',
  location_name text NOT NULL,
  km numeric NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ONLINE',
  battery numeric NOT NULL DEFAULT 90,
  presses integer NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  last_heartbeat_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.emergency_buttons TO anon, authenticated;
GRANT ALL ON public.emergency_buttons TO service_role;
ALTER TABLE public.emergency_buttons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buttons public read" ON public.emergency_buttons FOR SELECT USING (true);
CREATE TRIGGER buttons_touch BEFORE UPDATE ON public.emergency_buttons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.mechanics (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  km numeric NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  vehicle_types text[] NOT NULL DEFAULT '{}',
  available boolean NOT NULL DEFAULT true,
  rating numeric NOT NULL DEFAULT 4.5,
  workload integer NOT NULL DEFAULT 0,
  jobs integer NOT NULL DEFAULT 0,
  earnings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mechanics TO anon, authenticated;
GRANT ALL ON public.mechanics TO service_role;
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mechanics public read" ON public.mechanics FOR SELECT USING (true);
CREATE TRIGGER mechanics_touch BEFORE UPDATE ON public.mechanics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ drivers & vehicles ============
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers signed in read" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE TRIGGER drivers_touch BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  label text NOT NULL,
  plate text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'Car',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles signed in read" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE TRIGGER vehicles_touch BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ emergency requests ============
CREATE TABLE public.emergency_requests (
  id text PRIMARY KEY,
  driver_name text NOT NULL DEFAULT 'Demo Driver',
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_label text NOT NULL,
  problem_type text NOT NULL,
  details text,
  button_id text REFERENCES public.emergency_buttons(id) ON DELETE SET NULL,
  km numeric NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  pod_id text REFERENCES public.pods(id) ON DELETE SET NULL,
  mechanic_id text REFERENCES public.mechanics(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'CREATED',
  pod_progress numeric NOT NULL DEFAULT 0,
  mechanic_progress numeric NOT NULL DEFAULT 0,
  distance_km numeric NOT NULL DEFAULT 0,
  eta_min integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 99,
  paid boolean NOT NULL DEFAULT false,
  kit_unlocked boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'APP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.emergency_requests TO anon, authenticated;
GRANT ALL ON public.emergency_requests TO service_role;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests public read" ON public.emergency_requests FOR SELECT USING (true);
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.emergency_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 99,
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'SIMULATED',
  status text NOT NULL DEFAULT 'PENDING',
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments signed in read" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE TRIGGER payments_touch BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.kit_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  pod_id text REFERENCES public.pods(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING',
  granted_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kit_access TO anon, authenticated;
GRANT ALL ON public.kit_access TO service_role;
ALTER TABLE public.kit_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kit access public read" ON public.kit_access FOR SELECT USING (true);
CREATE TRIGGER kit_access_touch BEFORE UPDATE ON public.kit_access FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.mechanic_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  mechanic_id text REFERENCES public.mechanics(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'OFFERED',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mechanic_assignments TO anon, authenticated;
GRANT ALL ON public.mechanic_assignments TO service_role;
ALTER TABLE public.mechanic_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments public read" ON public.mechanic_assignments FOR SELECT USING (true);
CREATE TRIGGER assignments_touch BEFORE UPDATE ON public.mechanic_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ notifications, audit, maintenance ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL DEFAULT 'DRIVER',
  request_id text REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications public read" ON public.notifications FOR SELECT USING (true);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL DEFAULT 'SYSTEM',
  actor_role text NOT NULL DEFAULT 'SYSTEM',
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO anon, authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit public read" ON public.audit_logs FOR SELECT USING (true);

CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id text REFERENCES public.pods(id) ON DELETE CASCADE,
  station_id text REFERENCES public.stations(id) ON DELETE SET NULL,
  record_type text NOT NULL DEFAULT 'ROUTINE',
  notes text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.maintenance_records TO anon, authenticated;
GRANT ALL ON public.maintenance_records TO service_role;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance public read" ON public.maintenance_records FOR SELECT USING (true);

-- request code sequence
CREATE SEQUENCE IF NOT EXISTS public.request_code_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.request_code_seq TO service_role;

CREATE OR REPLACE FUNCTION public.next_request_code() RETURNS text
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'REQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.request_code_seq')::text, 4, '0');
$$;
GRANT EXECUTE ON FUNCTION public.next_request_code() TO service_role;

-- ============ seed data ============
INSERT INTO public.stations (id, name, highway, km, lat, lng, status, rail_length_km) VALUES
  ('S1','Ghat Station Alpha','NH-44 · Ghat Road',7.8, 12.9702, 77.6312, 'ONLINE', 11),
  ('S2','Highway Station Beta','NH-44 · Ghat Road',18.9, 13.0701, 77.6756, 'ONLINE', 11),
  ('S3','Mountain Station Gamma','NH-44 · Ghat Road',28.2, 13.1538, 77.7128, 'ONLINE', 9),
  ('S4','Highway Station Delta','NH-44 · Ghat Road',2.4, 12.9216, 77.6096, 'ONLINE', 8);

INSERT INTO public.pods (id, station_id, status, battery, health, km, kit_seal)
SELECT s.id || '-POD0' || n, s.id, 'AVAILABLE', 82 + (n * 7) % 18, 96 - n, s.km, 'SEALED'
FROM public.stations s CROSS JOIN generate_series(1,2) AS n;

INSERT INTO public.emergency_buttons (id, highway, location_name, km, lat, lng, station_id, status, battery, presses)
SELECT
  'B-' || lpad(i::text, 3, '0'),
  'NH-44',
  'Ghat Section ' || i,
  round((i * 0.6)::numeric, 2),
  round((12.9 + i * 0.6 * 0.009)::numeric, 6),
  round((77.6 + i * 0.6 * 0.004)::numeric, 6),
  (SELECT s.id FROM public.stations s WHERE s.status = 'ONLINE'
    ORDER BY abs(s.km - (i * 0.6)) LIMIT 1),
  CASE WHEN i IN (13, 41) THEN 'OFFLINE' ELSE 'ONLINE' END,
  62 + (i * 13) % 38,
  (i * 3) % 5
FROM generate_series(1,50) AS i;

INSERT INTO public.mechanics (id, name, phone, km, lat, lng, skills, vehicle_types, available, rating, workload, jobs, earnings) VALUES
  ('M-001','Ravi Kumar','+91 98450 22110', 4.2, 12.9378, 77.6168, ARRAY['TYRE_PUNCTURE','TYRE_BURST','BATTERY_DEAD'], ARRAY['Car','SUV','Bike'], true, 4.9, 1, 214, 74200),
  ('M-002','Suresh Naik','+91 98450 33221', 9.6, 12.9864, 77.6384, ARRAY['ENGINE_ISSUE','OVERHEATING','BRAKE_ISSUE'], ARRAY['Car','SUV','Truck'], true, 4.7, 2, 168, 61300),
  ('M-003','Imran Shaikh','+91 98450 44332', 14.1, 13.0269, 77.6564, ARRAY['BATTERY_DEAD','FUEL_SHORTAGE','ELECTRICAL_ISSUE'], ARRAY['Car','SUV'], true, 4.5, 0, 121, 42800),
  ('M-004','Manoj Reddy','+91 98450 55443', 17.4, 13.0566, 77.6696, ARRAY['BATTERY_DEAD','ELECTRICAL_ISSUE','ENGINE_ISSUE','OTHER'], ARRAY['Car','SUV','Bike','Truck'], true, 4.8, 1, 243, 86900),
  ('M-005','Prakash Rao','+91 98450 66554', 23.8, 13.1142, 77.6952, ARRAY['TYRE_BURST','TYRE_PUNCTURE','OVERHEATING'], ARRAY['Car','Truck'], true, 4.4, 3, 96, 33100),
  ('M-006','Deepak Joshi','+91 98450 77665', 29.5, 13.1655, 77.7180, ARRAY['ENGINE_ISSUE','BRAKE_ISSUE','FUEL_SHORTAGE','OTHER'], ARRAY['Car','SUV','Truck'], false, 4.6, 2, 139, 51700);

INSERT INTO public.drivers (id, name, phone) VALUES
  ('11111111-1111-1111-1111-111111111111','Girisha Utti','+91 98860 12345');

INSERT INTO public.vehicles (driver_id, label, plate, vehicle_type) VALUES
  ('11111111-1111-1111-1111-111111111111','Hyundai i20','KA 51 MJ 4412','Car'),
  ('11111111-1111-1111-1111-111111111111','Mahindra XUV700','KA 02 HK 9087','SUV'),
  ('11111111-1111-1111-1111-111111111111','Royal Enfield Classic','TN 29 BQ 1123','Bike');

INSERT INTO public.maintenance_records (pod_id, station_id, record_type, notes, performed_at) VALUES
  ('S1-POD01','S1','ROUTINE','Rail drive inspection and kit reseal.', now() - interval '18 days'),
  ('S2-POD01','S2','ROUTINE','Battery pack balancing, lock actuator test.', now() - interval '9 days'),
  ('S3-POD02','S3','REPAIR','Obstacle sensor recalibrated.', now() - interval '3 days');
