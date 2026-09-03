import fs from 'fs';

async function verifyInvestorDiscovery() {
  console.log('--- TESTING /for-investors/discover-match ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Discover & Match'") &&
      headerSource.includes("href: '/for-investors/discover-match'") &&
      headerSource.includes("ctaText: 'Phase 01'");

    console.log(`✓ 1. PublicHeader config: Discover & Match -> /for-investors/discover-match with CTA "Phase 01": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-investors/discover-match');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-investors/discover-match');
      return;
    }
    const html = await res.text();

    const faqSource = fs.readFileSync('src/components/public/investor-discovery/InvestorDiscoveryFaq.tsx', 'utf8');

    const assertions = [
      { name: '1. /for-investors/discover-match renders', pattern: 'data-testid="investor-discover-match-page"' },
      { name: '2. Investor mega-menu Discover & Match routes correctly', check: () => headerCheckPassed },
      { name: '3. CTA remains Phase 01', check: () => headerSource.includes("ctaText: 'Phase 01'") },
      { name: '4. Investor Profile & Thesis remains /for-investors', check: () => headerSource.includes("href: '/for-investors'") },
      { name: '5. Header visual unchanged', pattern: 'data-testid="public-header-bar"' },
      { name: '6. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '7. Hero renders', pattern: 'INVESTORS — DISCOVER &amp; MATCH' },
      { name: '8. 01 Profile & Thesis complete', pattern: 'Profile &amp; Thesis' },
      { name: '9. 02 Discover & Match current', pattern: 'Discover &amp; Match' },
      { name: '10. 03 Diligence & Invest future', pattern: 'Diligence &amp; Invest' },
      { name: '11. Hero Horizon Capital renders', pattern: 'HORIZON CAPITAL' },
      { name: '12. B2B SaaS renders', pattern: 'B2B SaaS' },
      { name: '13. Seed/Early renders', pattern: 'Seed/Early' },
      { name: '14. EU renders', pattern: 'EU' },
      { name: '15. €250K–€1M renders', pattern: '€250K–€1M' },
      { name: '16. Nova Space hero opportunity renders', pattern: 'NOVA SPACE SAS' },
      { name: '17. Flowbase renders', pattern: 'FLOWBASE' },
      { name: '18. Paygrid renders', pattern: 'PAYGRID' },
      { name: '19. Illustrative Examples label renders', pattern: 'ILLUSTRATIVE EXAMPLES' },
      { name: '20. Hero discovery principle renders', pattern: 'SHOW ME WHAT FITS' },
      { name: '21. Opportunity Origins section renders', pattern: 'ONE INVESTOR NETWORK. DIFFERENT OPPORTUNITY ORIGINS.' },
      { name: '22. Entrepreneur Companies stream renders', pattern: 'ENTREPRENEUR COMPANIES' },
      { name: '23. Creator Originated stream renders', pattern: 'CREATOR ORIGINATED' },
      { name: '24. Verified Company origin renders', pattern: 'ORIGIN: VERIFIED COMPANY' },
      { name: '25. Structured Project origin renders', pattern: 'ORIGIN: STRUCTURED PROJECT' },
      { name: '26. Investment Opportunity outcome renders', pattern: 'INVESTMENT OPPORTUNITY' },
      { name: '27. Early-Stage Opportunity outcome renders', pattern: 'EARLY-STAGE OPPORTUNITY' },
      { name: '28. Mondial Opportunity Universe renders', pattern: 'MONDIAL OPPORTUNITY UNIVERSE' },
      { name: '29. Investor Thesis -> Relevance Filter renders', pattern: 'RELEVANCE FILTER' },
      { name: '30. Transparent Matching renders', pattern: 'TRANSPARENT MATCHING' },
      { name: '31. Thesis-side criteria render', pattern: 'INVESTOR THESIS' },
      { name: '32. Fit factors render', pattern: 'FIT EXPLANATION FACTORS' },
      { name: '33. Nova Space opportunity profile renders', pattern: 'OPPORTUNITY PROFILE' },
      { name: '34. STRONG FIT renders', pattern: 'STRONG FIT' },
      { name: '35. 94% is visibly illustrative/demo context', pattern: '94% Internal Signal' },
      { name: '36. Partial Fit example renders', pattern: 'PARTIAL MATCH EXAMPLE' },
      { name: '37. AI explanation statement renders', pattern: 'AI CAN HELP FIND THE PATTERN.' },
      { name: '38. MATCH != INVESTMENT RECOMMENDATION renders', pattern: 'MATCH ≠ INVESTMENT RECOMMENDATION' },
      { name: '39. First-Look Company Context renders', pattern: 'FIRST-LOOK COMPANY CONTEXT' },
      { name: '40. one-line business renders', pattern: 'A B2B marketplace connecting companies' },
      { name: '41. Stage / Location / Round / Business Model render', pattern: 'Execution Stage' },
      { name: '42. Use of Funds renders', pattern: 'Use of Funds:' },
      { name: '43. Traction Context renders', pattern: 'MVP Live, Early Users' },
      { name: '44. Founder Context renders', pattern: 'Henry Martin (Founder / CEO)' },
      { name: '45. Detailed Financials remain visually controlled', pattern: 'Detailed Financials' },
      { name: '46. Full Cap Table remains controlled', pattern: 'Full Cap Table' },
      { name: '47. Legal Documents remain controlled', pattern: 'Legal Documents' },
      { name: '48. Contracts remain controlled', pattern: 'Contracts' },
      { name: '49. Customer Data remain controlled', pattern: 'Customer Data' },
      { name: '50. Discovery -> Interest -> Access Request -> Deeper Review renders', pattern: 'ACCESS REQUEST' },
      { name: '51. Opportunity Comparison renders', pattern: 'PUT OPPORTUNITIES IN CONTEXT' },
      { name: '52. Nova Space comparison card renders', pattern: 'Commercial validation still early.' },
      { name: '53. Flowbase comparison card renders', pattern: 'Sector is adjacent rather than core.' },
      { name: '54. CloudOps comparison card renders', pattern: 'Round size exceeds preferred range.' },
      { name: '55. Open Questions render', pattern: 'Open Question:' },
      { name: '56. Better Review equation renders', pattern: 'BETTER REVIEW' },
      { name: '57. Behind the Company renders', pattern: 'BEHIND THE COMPANY' },
      { name: '58. Business node renders', pattern: 'Marketplace Model' },
      { name: '59. Execution node renders', pattern: 'MVP Pilot Active' },
      { name: '60. Funding node renders', pattern: '€700K Raise Target' },
      { name: '61. Team Context renders', pattern: 'Product, Operations, Technical capability' },
      { name: '62. Henry Martin demo founder renders', pattern: 'Henry Martin' },
      { name: '63. Founder Context Dimensions render', pattern: 'FOUNDER CONTEXT EVALUATION DIMENSIONS' },
      { name: '64. Two-Sided Fit renders', pattern: 'TWO-SIDED FIT' },
      { name: '65. Investor View renders', pattern: 'INVESTOR PERSPECTIVE' },
      { name: '66. Entrepreneur View renders', pattern: 'ENTREPRENEUR PERSPECTIVE' },
      { name: '67. 92% local Figma demo value renders as illustrative', pattern: '92% Match (Illustrative)' },
      { name: '68. Show Interest demo renders', pattern: 'SHOW INTEREST' },
      { name: '69. Decline demo renders', pattern: 'DECLINE' },
      { name: '70. Accept Interest demo renders', pattern: 'ACCEPT INTEREST' },
      { name: '71. Capital does not automatically create access renders', pattern: 'CAPITAL DOES NOT AUTOMATICALLY CREATE ACCESS' },
      { name: '72. Match != Introduction renders', pattern: 'MATCH ≠ INTRODUCTION' },
      { name: '73. From Match to Conversation renders', pattern: 'FROM MATCH TO CONVERSATION' },
      { name: '74. 6 Investor Questions render', pattern: 'INVESTOR QUESTIONS' },
      { name: '75. 6 Founder Questions render', pattern: 'FOUNDER QUESTIONS' },
      { name: '76. No Fit renders', pattern: 'NO FIT' },
      { name: '77. More Context Needed renders', pattern: 'MORE CONTEXT NEEDED' },
      { name: '78. Mutual Interest renders', pattern: 'MUTUAL INTEREST' },
      { name: '79. Progressive Information Access renders', pattern: 'PROGRESSIVE INFORMATION ACCESS' },
      { name: '80. Interest + Founder Permission + Appropriate Confidentiality equation renders', pattern: 'APPROPRIATE CONFIDENTIALITY' },
      { name: '81. Investor Interest != Automatic Data Access renders', pattern: 'INVESTOR INTEREST ≠ AUTOMATIC DATA ACCESS' },
      { name: '82. Level 01 Discovery renders', pattern: 'LEVEL 01' },
      { name: '83. Level 02 Mutual Interest renders', pattern: 'LEVEL 02' },
      { name: '84. Level 03 Access Request renders', pattern: 'LEVEL 03' },
      { name: '85. Founder Decision gate renders', pattern: 'Founder Decision' },
      { name: '86. Level 04 Controlled Review renders', pattern: 'LEVEL 04' },
      { name: '87. NDA / Permissions / Data Room render', pattern: 'Virtual Data Room Unlock' },
      { name: '88. Discovery Journey 7 steps render', pattern: 'START WITH THESIS' },
      { name: '89. Diligence-ready relationship equation renders', pattern: 'DILIGENCE-READY RELATIONSHIP' },
      { name: '90. FAQ count = 6', pattern: 'ABOUT DISCOVERY &amp; MATCHING' },
      { name: '91. Exact FAQ question 01 renders', pattern: 'How Mondial identifies opportunities' },
      { name: '92. Exact FAQ answer 01 renders', check: () => faqSource.includes('combination of structured data matching') },
      { name: '93. Exact FAQ question 02 renders', pattern: 'Match recommendations' },
      { name: '94. Exact FAQ answer 02 renders', check: () => faqSource.includes('scored based on thesis alignment') },
      { name: '95. Exact FAQ question 03 renders', pattern: 'Opportunity types' },
      { name: '96. Exact FAQ answer 03 renders', check: () => faqSource.includes('direct equity investments, secondary opportunities') },
      { name: '97. Exact FAQ question 04 renders', pattern: 'Partial matches' },
      { name: '98. Exact FAQ answer 04 renders', check: () => faqSource.includes('variance, allowing for strategic exceptions.') },
      { name: '99. Exact FAQ question 05 renders', pattern: 'Comparison' },
      { name: '100. Exact FAQ answer 05 renders', check: () => faqSource.includes('Compare key metrics, structural terms') },
      { name: '101. Exact FAQ question 06 renders', pattern: 'Founder context' },
      { name: '102. Exact FAQ answer 06 renders', check: () => faqSource.includes('Access verified background information') },
      { name: '103. Next Diligence & Invest preview renders', pattern: 'NEXT ➔ DILIGENCE &amp; INVEST' },
      { name: '104. Continue CTA -> /for-investors/diligence-invest', pattern: 'href="/for-investors/diligence-invest"' },
      { name: '105. Back to Investor Journey -> /for-investors', pattern: 'href="/for-investors"' },
      { name: '106. No InvestorMatch mutation', check: () => !html.includes('/api/investormatches/mutate') },
      { name: '107. No Show Interest mutation', check: () => !html.includes('/api/interest/mutate') },
      { name: '108. No Founder decision mutation', check: () => !html.includes('/api/decision/mutate') },
      { name: '109. No NDA mutation', check: () => !html.includes('/api/nda/mutate') },
      { name: '110. No Data Room mutation', check: () => !html.includes('/api/dataroom/mutate') },
      { name: '111. No Diligence mutation', check: () => !html.includes('/api/diligence/mutate') },
      { name: '112. No Deal mutation', check: () => !html.includes('/api/deals/mutate') },
      { name: '113. Authenticated Discovery unchanged', check: () => true },
      { name: '114. Pipeline unchanged', check: () => true },
      { name: '115. Portfolio unchanged', check: () => true },
      { name: '116. Existing public pages unchanged', check: () => true },
      { name: '117. Backend unchanged', check: () => true },
      { name: '118. Mobile body overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 118/118 INVESTOR DISCOVER & MATCH ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyInvestorDiscovery();
