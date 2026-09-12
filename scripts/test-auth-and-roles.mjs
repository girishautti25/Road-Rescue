// Automated Verification Test Suite for ROADRESCUE Auth & Role-Based Access Control

export const DEMO_ACCOUNTS = {
  DRIVER: {
    email: 'driver@roadrescue.com',
    name: 'Rahul Sharma (Driver)',
    role: 'DRIVER',
    station_id: null,
    password: 'RoadRescue2026!',
  },
  MECHANIC: {
    email: 'mechanic@roadrescue.com',
    name: 'Rajesh Verma (Auto Care)',
    role: 'MECHANIC',
    station_id: null,
    password: 'RoadRescue2026!',
  },
  STATION_OPERATOR: {
    email: 'operator@roadrescue.com',
    name: 'Anil Rao (Station S2 Beta)',
    role: 'STATION_OPERATOR',
    station_id: 'S2',
    password: 'RoadRescue2026!',
  },
  ADMIN: {
    email: 'admin@roadrescue.com',
    name: 'Priya Patel (Command Center)',
    role: 'ADMIN',
    station_id: null,
    password: 'RoadRescue2026!',
  },
};

console.log('====================================================');
console.log('ROADRESCUE STEP 1: AUTH & RBAC VERIFICATION SUITE');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Role Definitions & Demo Accounts
assert(DEMO_ACCOUNTS.DRIVER.role === 'DRIVER', 'Driver demo account has DRIVER role');
assert(DEMO_ACCOUNTS.MECHANIC.role === 'MECHANIC', 'Mechanic demo account has MECHANIC role');
assert(DEMO_ACCOUNTS.STATION_OPERATOR.role === 'STATION_OPERATOR', 'Station Operator demo account has STATION_OPERATOR role');
assert(DEMO_ACCOUNTS.ADMIN.role === 'ADMIN', 'Admin demo account has ADMIN role');
assert(DEMO_ACCOUNTS.STATION_OPERATOR.station_id === 'S2', 'Station operator is assigned to station S2');

// 2. Safe Redirect URL Validation
function isSafeReturnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\') && !url.includes('://');
}

assert(isSafeReturnUrl('/driver') === true, 'Allows valid internal route /driver');
assert(isSafeReturnUrl('/admin/stations') === true, 'Allows valid internal route /admin/stations');
assert(isSafeReturnUrl('/driver/request/REQ-1027') === true, 'Allows valid internal route with params');
assert(isSafeReturnUrl('https://malicious.com') === false, 'Rejects external URL https://malicious.com');
assert(isSafeReturnUrl('//malicious.com') === false, 'Rejects protocol-relative open redirect //malicious.com');
assert(isSafeReturnUrl('/\\malicious.com') === false, 'Rejects backslash bypass /\\malicious.com');
assert(isSafeReturnUrl('javascript:alert(1)') === false, 'Rejects javascript: scheme');

// 3. Role Authorization Matrix
function isRoleAuthorized(role, allowedRoles) {
  return allowedRoles.includes(role);
}

// Route Protection: /admin
const adminAllowed = ['ADMIN', 'SUPER_ADMIN'];
assert(isRoleAuthorized('ADMIN', adminAllowed) === true, 'Admin can access /admin');
assert(isRoleAuthorized('SUPER_ADMIN', adminAllowed) === true, 'Super Admin can access /admin');
assert(isRoleAuthorized('DRIVER', adminAllowed) === false, 'Driver CANNOT access /admin (403 Forbidden)');
assert(isRoleAuthorized('MECHANIC', adminAllowed) === false, 'Mechanic CANNOT access /admin (403 Forbidden)');
assert(isRoleAuthorized('STATION_OPERATOR', adminAllowed) === false, 'Station Operator CANNOT access /admin (403 Forbidden)');

// Route Protection: /mechanic
const mechanicAllowed = ['MECHANIC', 'ADMIN', 'SUPER_ADMIN'];
assert(isRoleAuthorized('MECHANIC', mechanicAllowed) === true, 'Mechanic can access /mechanic');
assert(isRoleAuthorized('ADMIN', mechanicAllowed) === true, 'Admin can access /mechanic');
assert(isRoleAuthorized('DRIVER', mechanicAllowed) === false, 'Driver CANNOT access /mechanic');
assert(isRoleAuthorized('STATION_OPERATOR', mechanicAllowed) === false, 'Station Operator CANNOT access /mechanic');

// Route Protection: /station
const stationAllowed = ['STATION_OPERATOR', 'ADMIN', 'SUPER_ADMIN'];
assert(isRoleAuthorized('STATION_OPERATOR', stationAllowed) === true, 'Station Operator can access /station');
assert(isRoleAuthorized('ADMIN', stationAllowed) === true, 'Admin can access /station');
assert(isRoleAuthorized('DRIVER', stationAllowed) === false, 'Driver CANNOT access /station');
assert(isRoleAuthorized('MECHANIC', stationAllowed) === false, 'Mechanic CANNOT access /station');

// Route Protection: /driver
const driverAllowed = ['DRIVER', 'ADMIN', 'SUPER_ADMIN'];
assert(isRoleAuthorized('DRIVER', driverAllowed) === true, 'Driver can access /driver');
assert(isRoleAuthorized('ADMIN', driverAllowed) === true, 'Admin can access /driver');
assert(isRoleAuthorized('MECHANIC', driverAllowed) === false, 'Mechanic CANNOT access /driver');
assert(isRoleAuthorized('STATION_OPERATOR', driverAllowed) === false, 'Station Operator CANNOT access /driver');

// 4. Public Registration Role Restriction
function isPublicRoleAllowed(role) {
  return role === 'DRIVER' || role === 'MECHANIC';
}

assert(isPublicRoleAllowed('DRIVER') === true, 'Public signup allows DRIVER');
assert(isPublicRoleAllowed('MECHANIC') === true, 'Public signup allows MECHANIC');
assert(isPublicRoleAllowed('ADMIN') === false, 'Public signup strictly FORBIDS ADMIN');
assert(isPublicRoleAllowed('SUPER_ADMIN') === false, 'Public signup strictly FORBIDS SUPER_ADMIN');
assert(isPublicRoleAllowed('STATION_OPERATOR') === false, 'Public signup strictly FORBIDS STATION_OPERATOR');

// 5. Emergency Request Ownership Scoping
function canViewEmergency(user, emergency) {
  if (emergency.source === 'DEMO') return true;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'STATION_OPERATOR' && emergency.stationId === user.station_id) return true;
  if (user.role === 'MECHANIC' && (emergency.mechanicId === user.id || emergency.stage === 'MECHANIC_SEARCHING')) return true;
  if (user.role === 'DRIVER' && emergency.driverId === user.id) return true;
  return false;
}

const driver1 = { id: 'driver-001', role: 'DRIVER' };
const driver2 = { id: 'driver-002', role: 'DRIVER' };
const operatorS2 = { id: 'op-001', role: 'STATION_OPERATOR', station_id: 'S2' };
const operatorS1 = { id: 'op-002', role: 'STATION_OPERATOR', station_id: 'S1' };
const adminUser = { id: 'admin-001', role: 'ADMIN' };

const request1 = { id: 'REQ-1', driverId: 'driver-001', stationId: 'S2', mechanicId: 'mech-1', source: 'APP', stage: 'POD_MOVING' };
const demoRequest = { id: 'DEMO-1027', driverId: 'demo', stationId: 'S2', mechanicId: null, source: 'DEMO', stage: 'CREATED' };

assert(canViewEmergency(driver1, request1) === true, 'Driver 1 can view own emergency request');
assert(canViewEmergency(driver2, request1) === false, 'Driver 2 CANNOT view Driver 1 private request');
assert(canViewEmergency(operatorS2, request1) === true, 'Station Operator S2 can view emergency allocated to S2');
assert(canViewEmergency(operatorS1, request1) === false, 'Station Operator S1 CANNOT view emergency allocated to S2');
assert(canViewEmergency(adminUser, request1) === true, 'Admin can view any emergency request');
assert(canViewEmergency(driver2, demoRequest) === true, 'Any driver can view public demo requests');

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
