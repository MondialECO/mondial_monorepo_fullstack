import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/';
const BASE_URL = 'http://localhost:5093';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function apiCall(method, path, token, body = null, isFormData = false) {
  const url = `${BASE_URL}${path}`;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody;
  if (body) {
    if (isFormData) {
      const formData = new FormData();
      for (const key of Object.keys(body)) {
        if (body[key] !== null && body[key] !== undefined) {
          if (body[key] instanceof Blob) {
            formData.append(key, body[key], 'signed_document.pdf');
          } else {
            formData.append(key, body[key]);
          }
        }
      }
      requestBody = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: requestBody
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { ok: res.ok, status: res.status, data };
}

async function runRegression() {
  const runTag = Math.random().toString(36).substring(2, 9);
  console.log(`\n===============================================================`);
  console.log(`🚀 MONDIAL ECO — REGRESSION DEAL C (8.0% -> 6.25% COUNTER AUDIT)`);
  console.log(`Run ID: ${runTag}`);
  console.log(`===============================================================\n`);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('MondialEcoDev');

  const password = 'TestPassword123!';
  const founderEmail = `founder.reg.${runTag}@mondial.test`;
  const investorCEmail = `investor.c.${runTag}@mondial.test`;
  const investorDEmail = `investor.d.${runTag}@mondial.test`;

  // 1. Create Founder & Company
  const regFounder = await apiCall('POST', '/api/auth/register', null, {
    name: `Founder Reg ${runTag}`,
    email: founderEmail,
    password: password,
    user: 'Entrepreneur'
  });
  assert(regFounder.ok, `Founder registration failed: ${regFounder.status}`);
  const founderUserId = regFounder.data?.user?.id || regFounder.data?.data?.user?.id || '';

  await db.collection('applicationUsers').updateOne(
    { UserName: founderEmail },
    { $set: { EmailConfirmed: true, Onboarding: { Phase: 1, Completed: true } } }
  );

  const loginFounder = await apiCall('POST', '/api/auth/login', null, { email: founderEmail, password });
  const founderToken = loginFounder.data.data.token;

  const createComp = await apiCall('POST', '/api/companies', founderToken, {
    companyName: `Aegis Robotics ${runTag}`,
    industry: 'DeepTech / AI',
    website: 'https://aegis.test',
    tagline: 'Autonomous drones for logistics'
  });
  assert(createComp.ok, `Company creation failed: ${createComp.status}`);
  const companyId = (createComp.data.id || createComp.data.Id || createComp.data._id).toString();

  await db.collection('Companies').updateOne(
    { _id: companyId },
    { $set: { FundingAsk: 500000, PreMoneyValuation: 5000000 } }
  );

  // Baseline Cap Table (1,000,000 shares)
  await db.collection('Phase4CapTables').insertOne({
    _id: new ObjectId(),
    CompanyId: companyId,
    Version: 1,
    TotalShares: 1000000,
    Grants: [{
      GrantId: new ObjectId().toHexString(),
      StakeholderName: `Founder Reg ${runTag}`,
      StakeholderType: 'founder',
      ShareClass: 'Common',
      SharesGranted: 1000000,
      GrantDate: new Date(),
      Source: 'Initial Founder Allocation'
    }],
    RecordedAt: new Date()
  });

  // 2. Create Investor C
  const regInvC = await apiCall('POST', '/api/auth/register', null, {
    name: `Venture Capital C ${runTag}`,
    email: investorCEmail,
    password: password,
    user: 'Investor'
  });
  assert(regInvC.ok, `Investor C register failed: ${regInvC.status}`);
  const invCUserId = regInvC.data?.user?.id || regInvC.data?.data?.user?.id || '';

  await db.collection('applicationUsers').updateOne(
    { UserName: investorCEmail },
    { $set: { EmailConfirmed: true, Onboarding: { Phase: 1, Completed: true }, 'InvestorProfile.Verified': true } }
  );

  const loginInvC = await apiCall('POST', '/api/auth/login', null, { email: investorCEmail, password });
  const investorCToken = loginInvC.data.data.token;
  const invCUserInDb = await db.collection('applicationUsers').findOne({ UserName: investorCEmail });
  const investorCId = invCUserInDb.InvestorProfile.InvestorId;

  await db.collection('Investors').updateOne(
    { _id: investorCId },
    { $set: { Status: 'Verified', IsActive: true, PreferredSectors: ['DeepTech / AI'], PreferredStages: ['seed'] } }
  );

  // 3. Initiate Deal C: Initial offer €40,000 / 8.0% equity (Post-money €500,000)
  const dealCReq = {
    investorId: investorCId,
    termSheet: {
      totalRaiseAmount: 40000,
      postMoneyValuation: 500000,
      preMoneyValuation: 460000,
      equityType: 'Equity',
      investorEquityPercent: 8.0,
      proRataRights: true,
      liquidationPreference: '1x Non-Participating',
      boardSeats: 1
    }
  };

  const dealCRes = await apiCall('POST', `/api/companies/${companyId}/deals`, founderToken, dealCReq);
  assert(dealCRes.ok, `Deal C creation failed: ${dealCRes.status}`);
  const dealCId = dealCRes.data.dealId || dealCRes.data.id;

  // 4. Offer Proposal: Investor proposes Revision 1 (8.0% equity)
  await db.collection('DealExecutions').updateOne(
    { _id: new ObjectId(dealCId) },
    {
      $set: {
        Status: 'negotiating',
        CurrentTurn: 'founder',
        Revisions: [{
          RevisionNumber: 1,
          ProposedByRole: 'investor',
          ProposedByPrincipalId: investorCId,
          Status: 'sent',
          Terms: {
            TotalRaiseAmount: 40000,
            PostMoneyValuation: 500000,
            PreMoneyValuation: 460000,
            EquityType: 'Equity',
            InvestorEquityPercent: 8.0,
            ProRataRights: true,
            LiquidationPreference: '1x Non-Participating',
            BoardSeats: 1
          },
          CreatedAt: new Date()
        }]
      }
    }
  );

  // 5. Founder Counters with Revision 2: €40,000 / 6.25% equity (Post-money €640,000)
  const counterRes = await apiCall('POST', `/api/companies/deals/${dealCId}/offer/counter`, founderToken, {
    totalRaiseAmount: 40000,
    postMoneyValuation: 640000,
    preMoneyValuation: 600000,
    equityType: 'Equity',
    investorEquityPercent: 6.25,
    proRataRights: true,
    liquidationPreference: '1x Non-Participating',
    boardSeats: 1,
    note: 'Counter: €40,000 for 6.25% equity'
  });
  assert(counterRes.ok, `Counter failed: ${counterRes.status}`);

  // 6. Investor C Accepts Revision 2 (6.25%)
  const acceptRes = await apiCall('POST', `/api/companies/deals/${dealCId}/offer/accept`, investorCToken, {});
  assert(acceptRes.ok, `Accept failed: ${acceptRes.status}`);

  // Pre-close DB assertions
  const preHoldings = await db.collection('CompanyPortfolioHoldings').countDocuments({ CompanyId: companyId });
  const preCap = await db.collection('Phase4CapTables').findOne({ CompanyId: companyId }, { sort: { Version: -1 } });
  assert(preHoldings === 0, 'Portfolio holding must be 0 before close');
  assert(preCap.Grants.length === 1, 'Cap table grants must be 1 before close');

  // 7. Dual Signatures
  const dummyPdfBytes = Buffer.from('%PDF-1.4 1 0 obj << /Type /Catalog >> endobj trailer << /Root 1 0 R >> %%EOF');
  const signFileBlob = new Blob([dummyPdfBytes], { type: 'application/pdf' });

  const signInv = await apiCall('POST', `/api/companies/deals/${dealCId}/term-sheet/sign`, investorCToken, { file: signFileBlob }, true);
  assert(signInv.ok, `Investor sign failed: ${signInv.status}`);

  const signFounder = await apiCall('POST', `/api/companies/deals/${dealCId}/term-sheet/sign`, founderToken, { file: signFileBlob }, true);
  assert(signFounder.ok, `Founder sign failed: ${signFounder.status}`);

  // 8. Founder Closes Deal C
  const closeRes = await apiCall('POST', `/api/companies/deals/${dealCId}/close`, founderToken, {});
  assert(closeRes.ok, `Close deal failed: ${closeRes.status}`);

  // 9. Post-Close Authority Verifications
  const dealDoc = await db.collection('DealExecutions').findOne({ _id: new ObjectId(dealCId) });
  assert(dealDoc.Status === 'completed', 'Deal status must be completed');
  assert(dealDoc.TermSheet.InvestorEquityPercent === 6.25, `TermSheet equity must be 6.25%, got ${dealDoc.TermSheet.InvestorEquityPercent}`);
  assert(dealDoc.TermSheet.TotalRaiseAmount === 40000, `TermSheet raise must be 40000, got ${dealDoc.TermSheet.TotalRaiseAmount}`);

  const holdingDoc = await db.collection('CompanyPortfolioHoldings').findOne({
    $or: [{ CompanyId: companyId }, { CompanyId: new ObjectId(companyId) }]
  });
  assert(holdingDoc !== null, 'Portfolio holding must exist');
  assert(holdingDoc.InvestmentAmount === 40000, `Holding amount must be €40,000, got ${holdingDoc.InvestmentAmount}`);
  assert(holdingDoc.EquityPercentage === 6.25, `Holding equity must be exactly 6.25%, got ${holdingDoc.EquityPercentage}`);
  assert(holdingDoc.EntryValuation === 640000, `Holding entry valuation must be 640000, got ${holdingDoc.EntryValuation}`);

  const capTableDoc = await db.collection('Phase4CapTables').findOne({ CompanyId: companyId }, { sort: { Version: -1 } });
  const fGrant = capTableDoc.Grants.find(g => g.StakeholderType === 'founder');
  const iGrant = capTableDoc.Grants.find(g => g.StakeholderType === 'investor');

  // Math check: Q = 0.0625 -> 1,000,000 / (1 - 0.0625) = 1,066,667 total shares. New shares = 66,667
  assert(iGrant.SharesGranted === 66667, `Investor C shares must be 66,667, got ${iGrant.SharesGranted}`);
  assert(capTableDoc.TotalShares === 1066667, `Total shares must be 1,066,667, got ${capTableDoc.TotalShares}`);
  assert(fGrant.SharesGranted === 1000000, `Founder shares must be 1,000,000, got ${fGrant.SharesGranted}`);

  const founderEffectivePct = (fGrant.SharesGranted / capTableDoc.TotalShares) * 100;
  const investorEffectivePct = (iGrant.SharesGranted / capTableDoc.TotalShares) * 100;
  assert(Math.abs(investorEffectivePct - 6.25) < 0.01, `Investor % must be 6.25%, got ${investorEffectivePct.toFixed(3)}%`);
  assert(Math.abs(founderEffectivePct - 93.75) < 0.01, `Founder % must be 93.75%, got ${founderEffectivePct.toFixed(3)}%`);

  const shareIssuance = await db.collection('Phase4ShareIssuances').findOne({ DealExecutionId: dealCId });
  assert(shareIssuance.SharesIssued === 66667, `Share issuance must be 66,667 shares, got ${shareIssuance.SharesIssued}`);

  const ownershipHistory = await db.collection('Phase4OwnershipHistories').findOne({ DealExecutionId: dealCId });
  assert(ownershipHistory.InvestorOwnership === 6.25, `Ownership history investor % must be 6.25%, got ${ownershipHistory.InvestorOwnership}`);
  assert(ownershipHistory.FounderOwnershipAfter === 93.75, `Ownership history founder % must be 93.75%, got ${ownershipHistory.FounderOwnershipAfter}`);

  // Pipeline Won Check
  const pipeRes = await apiCall('GET', '/api/companies/opportunities/pipeline', investorCToken);
  const wonCard = (pipeRes.data.columns?.won || [])[0];
  assert(wonCard !== undefined, 'Won card must exist');
  assert(wonCard.equityPercentage === 6.25, `Won card equity must be 6.25%, got ${wonCard.equityPercentage}`);
  assert(wonCard.investmentAmount === 40000, `Won card amount must be €40,000, got ${wonCard.investmentAmount}`);

  console.log(`✓ Deal C Closed: ID: ${dealCId}`);
  console.log(`✓ Accepted Revision: 6.25% (€40,000)`);
  console.log(`✓ Signed TermSheet: 6.25% (€40,000)`);
  console.log(`✓ Portfolio Holding: 6.25% (€40,000, Entry Valuation: €640,000)`);
  console.log(`✓ Cap Table Version 2: Total: 1,066,667 shares (Founder: 1,000,000 [93.75%], Investor C: 66,667 [6.25%])`);
  console.log(`✓ Share Issuance: 66,667 shares`);
  console.log(`✓ Ownership History: Founder 93.75% / Investor 6.25%`);
  console.log(`✓ Pipeline Won Card: 6.25% / €40,000`);

  // 10. PART 16: SECOND ROUND DILUTION (Investor D: €50,000 for 10% equity)
  const regInvD = await apiCall('POST', '/api/auth/register', null, {
    name: `Venture Capital D ${runTag}`,
    email: investorDEmail,
    password: password,
    user: 'Investor'
  });
  assert(regInvD.ok, `Investor D register failed: ${regInvD.status}`);
  const invDUserInDb = await db.collection('applicationUsers').findOne({ UserName: investorDEmail });
  const investorDId = invDUserInDb.InvestorProfile.InvestorId;
  await db.collection('applicationUsers').updateOne({ UserName: investorDEmail }, { $set: { EmailConfirmed: true, Onboarding: { Phase: 1, Completed: true }, 'InvestorProfile.Verified': true } });
  await db.collection('Investors').updateOne({ _id: investorDId }, { $set: { Status: 'Verified', IsActive: true, PreferredSectors: ['DeepTech / AI'], PreferredStages: ['seed'] } });
  const loginInvD = await apiCall('POST', '/api/auth/login', null, { email: investorDEmail, password });
  const investorDToken = loginInvD.data.data.token;

  const dealDRes = await apiCall('POST', `/api/companies/${companyId}/deals`, founderToken, {
    investorId: investorDId,
    termSheet: {
      totalRaiseAmount: 50000,
      postMoneyValuation: 500000,
      preMoneyValuation: 450000,
      equityType: 'Equity',
      investorEquityPercent: 10.0,
      proRataRights: true,
      liquidationPreference: '1x Non-Participating',
      boardSeats: 1
    }
  });
  const dealDId = dealDRes.data.dealId || dealDRes.data.id;

  await db.collection('DealExecutions').updateOne(
    { _id: new ObjectId(dealDId) },
    { $set: { Status: 'negotiating', 'TermSheet.Status': 'agreed', 'TermSheet.InvestorEquityPercent': 10.0, 'TermSheet.TotalRaiseAmount': 50000 } }
  );

  await apiCall('POST', `/api/companies/deals/${dealDId}/term-sheet/sign`, investorDToken, { file: signFileBlob }, true);
  await apiCall('POST', `/api/companies/deals/${dealDId}/term-sheet/sign`, founderToken, { file: signFileBlob }, true);
  const closeDRes = await apiCall('POST', `/api/companies/deals/${dealDId}/close`, founderToken, {});
  assert(closeDRes.ok, `Close Deal D failed: ${closeDRes.status}`);

  const capTableRound2 = await db.collection('Phase4CapTables').findOne({ CompanyId: companyId }, { sort: { Version: -1 } });
  assert(capTableRound2.Version === 3, 'Cap table must be Version 3');
  assert(capTableRound2.Grants.length === 3, 'Cap table must have 3 grants (Founder + Inv C + Inv D)');

  // Math check Round 2: Base = 1,066,667 shares. Q = 0.10 -> 1,066,667 / (1 - 0.10) = 1,185,186 total shares.
  // New shares D = 118,519 (10.00%)
  // Founder: 1,000,000 / 1,185,186 = 84.375%
  // Investor C: 66,667 / 1,185,186 = 5.625%
  // Investor D: 118,519 / 1,185,186 = 10.000%
  // Total = 100.00%
  const fGrantR2 = capTableRound2.Grants.find(g => g.StakeholderType === 'founder');
  const cGrantR2 = capTableRound2.Grants.find(g => g.InvestorId === investorCId);
  const dGrantR2 = capTableRound2.Grants.find(g => g.InvestorId === investorDId);

  assert(fGrantR2.SharesGranted === 1000000, 'Founder shares must remain 1,000,000');
  assert(cGrantR2.SharesGranted === 66667, 'Investor C shares must remain 66,667');
  assert(dGrantR2.SharesGranted === 118519, `Investor D shares must be 118,519, got ${dGrantR2.SharesGranted}`);
  assert(capTableRound2.TotalShares === 1185186, `Round 2 total shares must be 1,185,186, got ${capTableRound2.TotalShares}`);

  const fPctR2 = (fGrantR2.SharesGranted / capTableRound2.TotalShares) * 100;
  const cPctR2 = (cGrantR2.SharesGranted / capTableRound2.TotalShares) * 100;
  const dPctR2 = (dGrantR2.SharesGranted / capTableRound2.TotalShares) * 100;

  console.log(`\n✓ Round 2 Dilution Completed:`);
  console.log(`  Founder: ${fGrantR2.SharesGranted.toLocaleString()} shares (${fPctR2.toFixed(3)}%)`);
  console.log(`  Investor C: ${cGrantR2.SharesGranted.toLocaleString()} shares (${cPctR2.toFixed(3)}%)`);
  console.log(`  Investor D: ${dGrantR2.SharesGranted.toLocaleString()} shares (${dPctR2.toFixed(3)}%)`);
  console.log(`  Total: ${capTableRound2.TotalShares.toLocaleString()} shares (${(fPctR2 + cPctR2 + dPctR2).toFixed(3)}%)\n`);

  assert(Math.round(fPctR2 + cPctR2 + dPctR2) === 100, 'Round 2 total % must equal 100%');
  assert(Math.abs(dPctR2 - 10.0) < 0.01, 'Investor D must own 10.00%');
  assert(Math.abs(cPctR2 - 5.625) < 0.01, 'Investor C must own 5.625%');
  assert(Math.abs(fPctR2 - 84.375) < 0.01, 'Founder must own 84.375%');

  await client.close();
  console.log(`===============================================================`);
  console.log(`🎉 REGRESSION DEAL C & ROUND 2 DILUTION FULLY VERIFIED!`);
  console.log(`===============================================================\n`);
}

runRegression().catch(err => {
  console.error('\n❌ REGRESSION RUN FAILED:', err);
  process.exit(1);
});
