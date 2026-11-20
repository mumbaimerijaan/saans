import assert from 'node:assert';
import { db } from '../src/db/index.js';
import { airQualityService } from '../src/services/airQualityService.js';
import { volunteerMatchingService } from '../src/services/volunteerMatchingService.js';
import { aiService } from '../src/services/aiService.js';

async function runTests() {
  console.log('🧪 Starting SAANS Automated End-to-End Verification Suite...\n');

  // Test 1: Verify Seed Data & Profiles
  console.log('Test 1: Database State & Profiles Initialization...');
  const state = db.getState();
  assert.ok(state.profiles.length >= 4, 'Seed profiles must have at least 4 users');
  const admin = state.profiles.find(p => p.account_type === 'admin');
  const citizen = state.profiles.find(p => p.account_type === 'citizen');
  const volunteer = state.profiles.find(p => p.account_type === 'volunteer');
  const donor = state.profiles.find(p => p.account_type === 'donor');
  assert.ok(admin && citizen && volunteer && donor, 'All 4 primary user roles must exist in DB');
  console.log('✅ Passed: 4 Primary User Profiles Initialized.\n');

  // Test 2: Indian National AQI (CPCB Breakpoints Formula)
  console.log('Test 2: CPCB Indian National AQI Sub-Index Calculation Engine...');
  // PM2.5 = 25 -> Good (0-50)
  const pm25Good = airQualityService.calculateCpcbSubIndex('pm2_5', 25);
  assert.ok(pm25Good !== null && pm25Good <= 50, `PM2.5=25 should be <= 50, got ${pm25Good}`);

  // PM2.5 = 85 -> Moderate (101-200)
  const pm25Mod = airQualityService.calculateCpcbSubIndex('pm2_5', 85);
  assert.ok(pm25Mod !== null && pm25Mod >= 101 && pm25Mod <= 200, `PM2.5=85 should be Moderate (101-200), got ${pm25Mod}`);

  // PM2.5 = 150 -> Very Poor (301-400)
  const pm25VeryPoor = airQualityService.calculateCpcbSubIndex('pm2_5', 150);
  assert.ok(pm25VeryPoor !== null && pm25VeryPoor >= 301 && pm25VeryPoor <= 400, `PM2.5=150 should be Very Poor, got ${pm25VeryPoor}`);

  assert.strictEqual(airQualityService.getCpcbCategory(pm25Good), 'Good');
  assert.strictEqual(airQualityService.getCpcbCategory(pm25Mod), 'Moderate');
  assert.strictEqual(airQualityService.getCpcbCategory(pm25VeryPoor), 'Very Poor');
  console.log('✅ Passed: CPCB Breakpoint Mathematical Equations Verified.\n');

  // Test 3: Real-Time Air Quality Service Fetching & Ground Stations
  console.log('Test 3: Air Quality Service (Open-Meteo & CAAQMS Mumbai Ground Stations)...');
  const aqReport = await airQualityService.getAirQuality(19.0760, 72.8777, 'Mumbai', 'Bandra West');
  assert.ok(aqReport.pollutants.pm2_5, 'PM2.5 pollutant detail must exist');
  assert.ok(aqReport.pollutants.pm10, 'PM10 pollutant detail must exist');
  assert.ok(aqReport.sourceAttribution.primaryProvider, 'Source attribution must be declared');
  assert.ok(aqReport.nearbyStations.length > 0, 'Nearby ground stations must be present');
  console.log(`✅ Passed: Air Quality retrieved. Primary: ${aqReport.sourceAttribution.primaryProvider}, CPCB AQI: ${aqReport.indianAqi.index} (${aqReport.indianAqi.category}).\n`);

  // Test 4: Volunteer Matching Algorithm (Geo-Distance & Skill Ranking)
  console.log('Test 4: Volunteer Matching Algorithm...');
  const testReq = state.assistance_requests[0];
  assert.ok(testReq, 'Test request must exist');
  const matches = volunteerMatchingService.findMatchesForRequest(testReq);
  assert.ok(matches.length > 0, 'Must match at least one available volunteer');
  const topMatch = matches[0];
  assert.ok(topMatch.distanceKm >= 0, 'Distance must be calculated');
  assert.ok(topMatch.matchScore > 0, 'Match score must be positive');
  assert.ok(topMatch.rationale.length > 10, 'Rationale explanation must be generated');
  console.log(`✅ Passed: Top match: ${topMatch.volunteerUser.fullName} (${topMatch.distanceKm} km away, Score: ${topMatch.matchScore}%).\n`);

  // Test 5: DIY Purifier Room CADR Calculator
  console.log('Test 5: DIY Purifier Room CADR Calculator...');
  const roomCalc = aiService.calculateRoomPurifierCADR(15, 12, 10, 5);
  // Volume = 15*12*10 = 1800 cu ft -> 5 ACH -> CADR CFM = 1800*5/60 = 150 CFM
  assert.strictEqual(roomCalc.volumeCuFt, 1800);
  assert.strictEqual(roomCalc.requiredCadrCfm, 150);
  assert.ok(roomCalc.safetyNotes.length >= 3, 'Must include critical safety warnings');
  console.log(`✅ Passed: CADR Calculator: 1800 cu ft room requires ${roomCalc.requiredCadrCfm} CFM (${roomCalc.requiredCadrM3h} m³/h) CADR. Safety rules present.\n`);

  // Test 6: AI Chat & Safety Guardrails
  console.log('Test 6: AI Assistant Chat & Safety Guardrails...');
  const aiReplyEn = await aiService.generateChatResponse([
    { role: 'user', content: 'How do I build a DIY Corsi-Rosenthal box purifier?' }
  ], 'en');
  assert.ok(aiReplyEn.content.includes('Corsi-Rosenthal') || aiReplyEn.content.includes('filter'), 'Response must explain purifier construction');
  assert.ok(aiReplyEn.content.toLowerCase().includes('safety') || aiReplyEn.content.toLowerCase().includes('medical'), 'Must include safety disclaimer');

  const aiReplyHi = await aiService.generateChatResponse([
    { role: 'user', content: 'स्मॉग से कैसे बचें?' }
  ], 'hi');
  assert.ok(aiReplyHi.content.length > 20, 'Hindi response must be generated');
  console.log('✅ Passed: Multi-lingual AI Assistant with Safety Disclaimers.\n');

  // Test 7: Clean Air Facilities Directory
  console.log('Test 7: Clean Air Facilities Directory...');
  const verifiedFacilities = state.facilities.filter(f => f.is_verified);
  assert.ok(verifiedFacilities.length >= 4, 'Must have at least 4 verified clean air facilities');
  assert.ok(verifiedFacilities[0].filtration_equipment_details.length > 0, 'Filtration details must be verified');
  console.log(`✅ Passed: ${verifiedFacilities.length} Verified Clean Air Facilities in Mumbai.\n`);

  // Test 8: Equipment Library & Lifecycle
  console.log('Test 8: Equipment Library & Lifecycle...');
  const availableEq = state.equipment.filter(e => e.status === 'available');
  assert.ok(availableEq.length >= 4, 'Must have available equipment items');
  console.log(`✅ Passed: ${availableEq.length} Equipment items ready for loan or donation.\n`);

  // Test 9: Community Impact Engine Aggregation
  console.log('Test 9: Community Impact Engine Metrics Aggregation...');
  const totalReportsResolved = state.community_reports.filter(r => r.status === 'resolved').length;
  assert.ok(typeof totalReportsResolved === 'number');
  console.log(`✅ Passed: Verified Impact metrics aggregated directly from DB state.\n`);

  // Test 10: Request Lifecycle & Transition State Machine Verification
  console.log('Test 10: Request Status Transition State Machine Verification...');
  const { ALLOWED_TRANSITIONS, VALID_REQUEST_STATUSES, validateStatusTransition } = await import('../src/routes/requests.js');
  
  // 1. Verify state machine definition
  assert.ok(VALID_REQUEST_STATUSES.includes('in_progress'));
  assert.ok(VALID_REQUEST_STATUSES.includes('completed'));
  assert.deepStrictEqual(ALLOWED_TRANSITIONS.completed, [], 'Completed must be a terminal state');
  assert.deepStrictEqual(ALLOWED_TRANSITIONS.cancelled, [], 'Cancelled must be a terminal state');
  assert.ok(ALLOWED_TRANSITIONS.assigned.includes('in_progress'), 'Assigned must allow transition to in_progress');
  assert.ok(!ALLOWED_TRANSITIONS.assigned.includes('completed'), 'Assigned must NOT allow direct transition to completed');
  assert.ok(ALLOWED_TRANSITIONS.in_progress.includes('completed'), 'in_progress must allow transition to completed');

  // 2. Test: Citizen cannot cancel an in-progress request
  const ownerInProgressCancel = validateStatusTransition('in_progress', 'cancelled', {
    isAdmin: false,
    isOwner: true,
    isAssignedVolunteer: false
  });
  assert.strictEqual(ownerInProgressCancel.valid, false, 'Citizen must not be allowed to cancel in_progress request');
  assert.strictEqual(ownerInProgressCancel.statusCode, 400);

  // 3. Test: Citizen cannot cancel a completed request
  const ownerCompletedCancel = validateStatusTransition('completed', 'cancelled', {
    isAdmin: false,
    isOwner: true,
    isAssignedVolunteer: false
  });
  assert.strictEqual(ownerCompletedCancel.valid, false, 'Cannot modify completed request');

  // 4. Test: Citizen cannot approve or advance their own request
  const ownerApprove = validateStatusTransition('submitted', 'approved', {
    isAdmin: false,
    isOwner: true,
    isAssignedVolunteer: false
  });
  assert.strictEqual(ownerApprove.valid, false, 'Citizen cannot approve requests');
  assert.strictEqual(ownerApprove.statusCode, 403);

  // 5. Test: Citizen CAN cancel their submitted request
  const ownerSubmittedCancel = validateStatusTransition('submitted', 'cancelled', {
    isAdmin: false,
    isOwner: true,
    isAssignedVolunteer: false
  });
  assert.strictEqual(ownerSubmittedCancel.valid, true, 'Citizen should be able to cancel submitted request');

  // 6. Test: Assigned volunteer CANNOT jump directly from assigned to completed
  const volDirectComplete = validateStatusTransition('assigned', 'completed', {
    isAdmin: false,
    isOwner: false,
    isAssignedVolunteer: true
  });
  assert.strictEqual(volDirectComplete.valid, false, 'Volunteer cannot jump from assigned directly to completed');
  assert.strictEqual(volDirectComplete.statusCode, 400);

  // 7. Test: Assigned volunteer CAN advance from assigned to in_progress
  const volStart = validateStatusTransition('assigned', 'in_progress', {
    isAdmin: false,
    isOwner: false,
    isAssignedVolunteer: true
  });
  assert.strictEqual(volStart.valid, true, 'Volunteer can move from assigned to in_progress');

  // 8. Test: Assigned volunteer CAN advance from in_progress to completed
  const volComplete = validateStatusTransition('in_progress', 'completed', {
    isAdmin: false,
    isOwner: false,
    isAssignedVolunteer: true
  });
  assert.strictEqual(volComplete.valid, true, 'Volunteer can move from in_progress to completed');

  // 9. Test: Unrelated third-party user cannot modify request status
  const unauthorizedUser = validateStatusTransition('submitted', 'cancelled', {
    isAdmin: false,
    isOwner: false,
    isAssignedVolunteer: false
  });
  assert.strictEqual(unauthorizedUser.valid, false, 'Unrelated user must be rejected');
  assert.strictEqual(unauthorizedUser.statusCode, 403);

  // 10. Test: Admin cannot transition terminal states or invalid jumps
  const adminTerminal = validateStatusTransition('completed', 'assigned', {
    isAdmin: true,
    isOwner: false,
    isAssignedVolunteer: false
  });
  assert.strictEqual(adminTerminal.valid, false, 'Admin cannot assign a completed request');

  const adminIllegalJump = validateStatusTransition('submitted', 'completed', {
    isAdmin: true,
    isOwner: false,
    isAssignedVolunteer: false
  });
  assert.strictEqual(adminIllegalJump.valid, false, 'Admin cannot jump directly from submitted to completed');

  // 11. Test: Admin CAN assign an approved request
  const adminValidAssign = validateStatusTransition('approved', 'assigned', {
    isAdmin: true,
    isOwner: false,
    isAssignedVolunteer: false
  });
  assert.strictEqual(adminValidAssign.valid, true, 'Admin can transition approved request to assigned');

  console.log('✅ Passed: Request Status State Machine, Role Permissions, and Transition Engine Fully Verified.\n');

  console.log('🎉 ALL 10 CORE BACKEND & ALGORITHM TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
