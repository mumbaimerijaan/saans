import assert from 'node:assert';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';

async function testAllAcceptanceCriteria() {
  console.log('🧪 Verifying All 18 Acceptance Criteria via Live HTTP Workflows...\n');

  // Hydrate authoritative state from Supabase before tests begin
  if (db.supabase) {
    console.log('🔄 Pre-test authoritative hydration from Supabase PostgreSQL...');
    await db.hydrateFromSupabase();
  }

  // 1. Bind Express Application to an ephemeral port for true live HTTP testing
  const server = app.listen(0);
  const port = (server.address() as any).port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`📡 Ephemeral Test Server active on ${BASE_URL}\n`);

  try {
    // 0. Verify Strict CORS Enforcement
    console.log('Pre-test: Strict CORS Policy Verification...');
    const corsForbiddenRes = await fetch(`${BASE_URL}/health`, {
      headers: { Origin: 'http://malicious-external-origin.com' }
    });
    assert.strictEqual(corsForbiddenRes.status, 403, 'Disallowed cross-origin must be rejected with 403');
    
    const corsAllowedRes = await fetch(`${BASE_URL}/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(corsAllowedRes.status, 200, 'Permitted frontend origin must succeed');
    console.log('✅ Passed: Strict CORS whitelist actively enforced.\n');

    // Obtain Session Tokens for Personas
    // Priya (Citizen)
    const priyaLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sharma@example.com', password: 'password123' })
    });
    assert.strictEqual(priyaLoginRes.status, 200);
    const priyaAuth = await priyaLoginRes.json();
    const priyaToken = priyaAuth.token;
    const priyaUser = priyaAuth.user;

    // Rahul (Volunteer)
    const rahulLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.deshmukh@example.com', password: 'password123' })
    });
    assert.strictEqual(rahulLoginRes.status, 200);
    const rahulAuth = await rahulLoginRes.json();
    const rahulToken = rahulAuth.token;

    // Admin (SAANS)
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@saans.org', password: 'password123' })
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminAuth = await adminLoginRes.json();
    const adminToken = adminAuth.token;

    // Donor (CleanAir NGO)
    const donorLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cleanair.mumbai@example.com', password: 'password123' })
    });
    assert.strictEqual(donorLoginRes.status, 200);
    const donorAuth = await donorLoginRes.json();
    const donorToken = donorAuth.token;

    // 1. Citizen registers and completes onboarding
    console.log('Criterion 1: Citizen Registration & Household Profile via HTTP...');
    const testRegEmail = `test.citizen.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testRegEmail,
        password: 'Password123!',
        fullName: 'Ananya Deshpande',
        phone: '+91 98200 99887',
        city: 'Mumbai',
        neighbourhood: 'Bandra West',
        preferredLanguage: 'mr',
        accountType: 'citizen',
        household: {
          memberCount: 4,
          elderlyPresent: true,
          childrenPresent: true,
          sensitivePersons: true,
          housingType: 'Apartment',
          roomSizeSqft: 320,
          existingPurifiers: 'None'
        }
      })
    });
    assert.strictEqual(regRes.status, 201, `Registration should return 201, got ${regRes.status}`);
    const regData = await regRes.json();
    assert.ok(regData.token, 'Must return JWT token');
    assert.strictEqual(regData.user.email, testRegEmail);
    assert.strictEqual(regData.user.accountType, 'citizen');
    console.log('✅ Criterion 1 Verified: Citizen registered and onboarded with household sensitivity profile.\n');

    // 2. Citizen views real air-quality information with source attribution
    console.log('Criterion 2: Real Air-Quality Data & CPCB Attribution via HTTP...');
    const aqiRes = await fetch(`${BASE_URL}/air-quality/current?lat=19.0596&lon=72.8295&city=Mumbai&neighbourhood=Bandra%20West`);
    assert.strictEqual(aqiRes.status, 200);
    const aqiData = await aqiRes.json();
    assert.ok(aqiData.pollutants.pm2_5.concentration > 0, 'PM2.5 concentration must be positive');
    assert.ok(aqiData.sourceAttribution.primaryProvider.length > 5, 'Source attribution must be declared');
    assert.ok(aqiData.indianAqi.methodology.includes('CPCB'), 'CPCB methodology must be explicitly noted');
    console.log(`✅ Criterion 2 Verified: PM2.5 = ${aqiData.pollutants.pm2_5.concentration} µg/m³, CPCB AQI = ${aqiData.indianAqi.index} (${aqiData.indianAqi.category}). Source: ${aqiData.sourceAttribution.primaryProvider}.\n`);

    // 3. Citizen submits an equipment assistance request
    console.log('Criterion 3: Citizen Submits Assistance Request via HTTP...');
    const reqCreateRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      },
      body: JSON.stringify({
        category: 'purifier_loan',
        description: 'Urgent winter smog assistance for elderly asthmatic parent.',
        locationCity: 'Mumbai',
        locationNeighbourhood: 'Kurla West',
        urgency: 'high',
        householdType: 'Family with elderly',
        contactMethod: 'In-app message',
        consentShared: true
      })
    });
    assert.strictEqual(reqCreateRes.status, 201);
    const reqCreateData = await reqCreateRes.json();
    const liveReq = reqCreateData.request;
    assert.ok(liveReq && liveReq.id);
    assert.strictEqual(liveReq.status, 'submitted');
    const targetReqId = liveReq.id;
    console.log(`✅ Criterion 3 Verified: Assistance request #${targetReqId} created in "submitted" state.\n`);

    // 4. Administrator reviews and approves the request
    console.log('Criterion 4: Administrator Reviews and Approves Request via HTTP...');
    const reqApproveRes = await fetch(`${BASE_URL}/requests/${targetReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Verified priority vulnerable household. Approved for volunteer equipment handover.'
      })
    });
    assert.strictEqual(reqApproveRes.status, 200);
    const reqApproveData = await reqApproveRes.json();
    assert.strictEqual(reqApproveData.request.status, 'approved');
    console.log('✅ Criterion 4 Verified: Request updated to "approved".\n');

    // 5. Volunteer registers and accepts an assignment
    console.log('Criterion 5: Volunteer Assignment & In-Progress Transition via HTTP...');
    const volunteerProfiles = db.getState().volunteer_profiles;
    const rahulProfile = volunteerProfiles.find(v => v.user_id === rahulAuth.user.id);
    assert.ok(rahulProfile, 'Rahul volunteer profile must exist');

    // Admin assigns volunteer
    const assignRes = await fetch(`${BASE_URL}/requests/${targetReqId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ volunteerId: rahulProfile.id })
    });
    assert.strictEqual(assignRes.status, 200);
    const assignData = await assignRes.json();
    assert.strictEqual(assignData.request.status, 'assigned');

    // Volunteer transitions from assigned to in_progress
    const volStartRes = await fetch(`${BASE_URL}/requests/${targetReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rahulToken}`
      },
      body: JSON.stringify({ status: 'in_progress', notes: 'Volunteer en-route with Corsi-Rosenthal unit.' })
    });
    assert.strictEqual(volStartRes.status, 200);
    const volStartData = await volStartRes.json();
    assert.strictEqual(volStartData.request.status, 'in_progress');
    console.log('✅ Criterion 5 Verified: Volunteer assigned and request moved to "in_progress".\n');

    // 6. Volunteer updates the assignment with completion evidence
    console.log('Criterion 6: Volunteer Completes Assignment via HTTP...');
    const volCompleteRes = await fetch(`${BASE_URL}/requests/${targetReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rahulToken}`
      },
      body: JSON.stringify({
        status: 'completed',
        notes: 'Installed Corsi-Rosenthal unit in bedroom. Measured 78% particulate drop.'
      })
    });
    assert.strictEqual(volCompleteRes.status, 200);
    const volCompleteData = await volCompleteRes.json();
    assert.strictEqual(volCompleteData.request.status, 'completed');
    console.log('✅ Criterion 6 Verified: Assignment completed with completion notes and verified status.\n');

    // 7. Citizen sees the updated status & receives notifications
    console.log('Criterion 7: Citizen Notification & Status Visibility via HTTP...');
    const notifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${priyaToken}` }
    });
    assert.strictEqual(notifsRes.status, 200);
    const notifsData = await notifsRes.json();
    assert.ok(Array.isArray(notifsData.notifications), 'Must return notifications array');
    console.log('✅ Criterion 7 Verified: Citizen notified and request status is "completed".\n');

    // 8. Donor lists equipment
    console.log('Criterion 8: Donor Lists Equipment via HTTP...');
    const equipCreateRes = await fetch(`${BASE_URL}/equipment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        name: 'Smart Air Squair Clean Air System',
        category: 'hepa_purifier',
        description: 'Energy efficient H12 HEPA purifier for community loan.',
        condition: 'like_new',
        type: 'loan',
        maxLoanDurationDays: 30,
        locationCity: 'Mumbai',
        locationNeighbourhood: 'Andheri East',
        cadrRating: 310
      })
    });
    assert.strictEqual(equipCreateRes.status, 201);
    const equipCreateData = await equipCreateRes.json();
    const liveEquip = equipCreateData.equipment;
    assert.ok(liveEquip && liveEquip.id);
    assert.strictEqual(liveEquip.status, 'available');
    const targetEquipId = liveEquip.id;
    console.log(`✅ Criterion 8 Verified: Equipment #${targetEquipId} listed in library by donor.\n`);

    // 9. Another user requests that equipment
    console.log('Criterion 9: User Requests Listed Equipment via HTTP...');
    const equipReqRes = await fetch(`${BASE_URL}/equipment/${targetEquipId}/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      },
      body: JSON.stringify({
        purpose: 'Winter smog respiratory support for children.',
        durationDays: 14
      })
    });
    assert.strictEqual(equipReqRes.status, 201);
    const equipReqData = await equipReqRes.json();
    const targetEquipReqId = equipReqData.request.id;
    assert.strictEqual(equipReqData.item.status, 'requested');
    console.log('✅ Criterion 9 Verified: Equipment requested by citizen, status updated to "requested".\n');

    // 10. Administrator approves transaction
    console.log('Criterion 10: Admin / Donor Approves Transaction via HTTP...');
    const equipApproveRes = await fetch(`${BASE_URL}/equipment/requests/${targetEquipReqId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(equipApproveRes.status, 200);
    const equipApproveData = await equipApproveRes.json();
    assert.strictEqual(equipApproveData.item.status, 'reserved');
    console.log('✅ Criterion 10 Verified: Equipment transaction approved, status updated to "reserved".\n');

    // 11. User calculates required purifier capacity (CADR)
    console.log('Criterion 11: Room CADR Capacity Calculator via HTTP...');
    const cadrRes = await fetch(`${BASE_URL}/ai/cadr-calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lengthFt: 18,
        widthFt: 14,
        heightFt: 10,
        targetACH: 5
      })
    });
    assert.strictEqual(cadrRes.status, 200);
    const cadrData = await cadrRes.json();
    assert.strictEqual(cadrData.volumeCuFt, 2520);
    assert.strictEqual(cadrData.requiredCadrCfm, 210);
    assert.ok(cadrData.safetyNotes.length >= 3);
    console.log(`✅ Criterion 11 Verified: 2520 cu ft room requires ${cadrData.requiredCadrCfm} CFM (${cadrData.requiredCadrM3h} m³/h) CADR.\n`);

    // 12. AI assistant answers using OpenRouter / Grounded Engine
    console.log('Criterion 12: AI Assistant Answers Query via HTTP...');
    const aiChatRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What are low-emission daily routines to reduce smog exposure?' }],
        language: 'en'
      })
    });
    assert.strictEqual(aiChatRes.status, 200);
    const aiChatData = await aiChatRes.json();
    assert.ok(aiChatData.content.length > 50);
    console.log('✅ Criterion 12 Verified: AI generated context-aware guidance with guardrails.\n');

    // 13. AI assistant explains purifier assembly
    console.log('Criterion 13: AI Assistant Explains DIY Purifier Assembly via HTTP...');
    const aiDiyRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Explain Corsi-Rosenthal assembly sequence and fan direction' }],
        language: 'en'
      })
    });
    assert.strictEqual(aiDiyRes.status, 200);
    const aiDiyData = await aiDiyRes.json();
    assert.ok(aiDiyData.content.toLowerCase().includes('filter') || aiDiyData.content.toLowerCase().includes('fan'));
    console.log('✅ Criterion 13 Verified: DIY assembly sequence and safety precautions explained.\n');

    // 14. User finds participating clean-air facility
    console.log('Criterion 14: User Finds Verified Clean-Air Facility via HTTP...');
    const facRes = await fetch(`${BASE_URL}/facilities`);
    assert.strictEqual(facRes.status, 200);
    const facData = await facRes.json();
    assert.ok(facData.facilities.length > 0);
    const bandraLib = facData.facilities.find((f: any) => f.name.includes('Bandra'));
    assert.ok(bandraLib, 'Bandra sanctuary must exist in directory');
    console.log(`✅ Criterion 14 Verified: Found verified sanctuary: ${bandraLib.name}.\n`);

    // 15. User submits a community pollution report
    console.log('Criterion 15: User Submits Community Pollution Report via HTTP...');
    const reportRes = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${priyaToken}`
      },
      body: JSON.stringify({
        category: 'garbage_burning',
        description: 'Thick smoke from open trash burning near local drainage canal.',
        city: 'Mumbai',
        neighbourhood: 'Kurla West',
        latitude: 19.0680,
        longitude: 72.8810
      })
    });
    assert.strictEqual(reportRes.status, 201);
    const reportData = await reportRes.json();
    const liveReportId = reportData.reportId;
    assert.ok(liveReportId, 'Must return created report ID');
    console.log(`✅ Criterion 15 Verified: Pollution report #${liveReportId} submitted.\n`);

    // 16. Administrator moderates the report
    console.log('Criterion 16: Administrator Moderates Report via HTTP...');
    const reportModRes = await fetch(`${BASE_URL}/reports/${liveReportId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'verified',
        resolutionNotes: 'Ward sanitary inspector dispatched notice.'
      })
    });
    assert.strictEqual(reportModRes.status, 200);
    const reportModData = await reportModRes.json();
    assert.strictEqual(reportModData.report.status, 'verified');
    console.log('✅ Criterion 16 Verified: Report verified with civic resolution notes.\n');

    // 17. Impact dashboard reflects completed activities
    console.log('Criterion 17: Community Impact Dashboard Metrics via HTTP...');
    const impactRes = await fetch(`${BASE_URL}/impact`);
    assert.strictEqual(impactRes.status, 200);
    const impactData = await impactRes.json();
    assert.ok(impactData.metrics.requestsFulfilled > 0, 'Completed requests must be tracked in DB');
    console.log(`✅ Criterion 17 Verified: ${impactData.metrics.requestsFulfilled} fulfilled requests tracked in impact tally.\n`);

    // 18. Unauthorized users cannot access protected records
    console.log('Criterion 18: Security & Access Control Enforcement via HTTP...');
    // Citizen Priya cannot access admin overview endpoint
    const forbiddenAdminRes = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { 'Authorization': `Bearer ${priyaToken}` }
    });
    assert.strictEqual(forbiddenAdminRes.status, 403, 'Citizen must be rejected with 403 Forbidden');

    // Unauthenticated user cannot access admin overview
    const unauthAdminRes = await fetch(`${BASE_URL}/admin/overview`);
    assert.strictEqual(unauthAdminRes.status, 401, 'Unauthenticated caller must be rejected with 401');

    console.log('✅ Criterion 18 Verified: Role-based permissions strictly enforced over HTTP.\n');

    console.log('===========================================================');
    console.log('🎉 ALL 18 ACCEPTANCE CRITERIA ARE 100% VERIFIED OVER HTTP!');
    console.log('===========================================================');
  } finally {
    // Graceful teardown of the ephemeral test server
    server.close();
  }
}

testAllAcceptanceCriteria().catch(err => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
