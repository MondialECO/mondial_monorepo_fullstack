import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://mongoDB:hr11100010@cluster0.nsfffx4.mongodb.net/';
const client = new MongoClient(uri);

async function check() {
  await client.connect();
  const db = client.db('MondialEcoDev');

  const dealId = '6a982968a75803e488e8bfc2';
  const companyId = '6a98294da75803e488e8bf87';

  const deal = await db.collection('DealExecutions').findOne({ _id: new ObjectId(dealId) });
  console.log('=== DEAL EXECUTION ===');
  console.log('Id:', deal?._id);
  console.log('Status:', deal?.Status);
  console.log('CurrentTurn:', deal?.CurrentTurn);
  console.log('Investors:', JSON.stringify(deal?.Investors, null, 2));
  console.log('TermSheet:', JSON.stringify(deal?.TermSheet, null, 2));
  console.log('Revisions:', JSON.stringify(deal?.Revisions, null, 2));
  console.log('Signatures:', JSON.stringify(deal?.Signatures, null, 2));

  const holdings = await db.collection('CompanyPortfolioHoldings').find({
    $or: [{ CompanyId: companyId }, { CompanyId: new ObjectId(companyId) }]
  }).toArray();
  console.log('\n=== PORTFOLIO HOLDINGS ===');
  console.log(JSON.stringify(holdings, null, 2));

  const capTables = await db.collection('Phase4CapTables').find({
    CompanyId: companyId
  }).sort({ Version: 1 }).toArray();
  console.log('\n=== CAP TABLES ===');
  console.log(JSON.stringify(capTables, null, 2));

  const issuances = await db.collection('Phase4ShareIssuances').find({
    CompanyId: companyId
  }).toArray();
  console.log('\n=== SHARE ISSUANCES ===');
  console.log(JSON.stringify(issuances, null, 2));

  const histories = await db.collection('Phase4OwnershipHistories').find({
    CompanyId: companyId
  }).toArray();
  console.log('\n=== OWNERSHIP HISTORIES ===');
  console.log(JSON.stringify(histories, null, 2));

  await client.close();
}

check().catch(console.error);
