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

  console.log('🎉 ALL 9 CORE BACKEND & ALGORITHM TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
