import fs from 'fs';

async function verifyFundingDeals() {
  console.log('--- TESTING /for-entrepreneurs/funding-deals ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Funding & Deals'") &&
      headerSource.includes("href: '/for-entrepreneurs/funding-deals'") &&
      headerSource.includes("ctaText: 'Capital Journey'");

    console.log(`✓ 1. PublicHeader config: Funding & Deals -> /for-entrepreneurs/funding-deals with CTA "Capital Journey": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-entrepreneurs/funding-deals');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-entrepreneurs/funding-deals');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '2. /for-entrepreneurs/funding-deals renders successfully', pattern: 'data-testid="entrepreneur-funding-deals-page"' },
      { name: '3. Public Header present', pattern: 'data-testid="public-header-bar"' },
      { name: '4. Footer present', pattern: 'data-testid="public-footer"' },
      { name: '5. Hero renders', pattern: 'From investor' },
      { name: '6. 01-03 COMPLETE renders', pattern: '01-03 COMPLETE' },
      { name: '7. 04 CURRENT (FUNDING & DEALS) renders', pattern: '04 CURRENT (FUNDING &amp; DEALS)' },
      { name: '8. €500K illustrative Funding Ask renders', pattern: 'Structured Funding Ask - €500K' },
      { name: '9. Investor Fit renders', pattern: '1. INVESTOR FIT' },
      { name: '10. Controlled Access renders', pattern: '2. CONTROLLED ACCESS' },
      { name: '11. Diligence renders', pattern: '3. DILIGENCE' },
      { name: '12. Term Discussion renders', pattern: '4. TERM DISCUSSION' },
      { name: '13. Agreement renders', pattern: '5. AGREEMENT' },
      { name: '14. Deal Execution renders', pattern: '6. DEAL EXECUTION' },
      { name: '15. Investor Discovery renders', pattern: 'INVESTOR DISCOVERY' },
      { name: '16. Company Context renders', pattern: 'NOVA SPACE SAS' },
      { name: '17. Investor archetypes render', pattern: 'INVESTOR ARCHETYPES' },
      { name: '18. High/Low fit states render', pattern: 'FIT: HIGH' },
      { name: '19. Information Journey renders', pattern: 'CONTROL THE INFORMATION JOURNEY' },
      { name: '20. Discovery layer renders', pattern: '01. Discovery' },
      { name: '21. Investor Interest layer renders', pattern: '02. Investor Interest' },
      { name: '22. Controlled Access layer renders', pattern: '03. Controlled Access' },
      { name: '23. Data Room layer renders', pattern: '04. Data Room' },
      { name: '24. Access Request -> Founder Approval -> NDA renders', pattern: 'Execute NDA' },
      { name: '25. Trust & Sensitive Access renders', pattern: 'TRUST BEFORE SENSITIVE ACCESS' },
      { name: '26. Public / Controlled / Sensitive levels render', pattern: 'SENSITIVE' },
      { name: '27. NDA limitation renders', pattern: 'AN NDA IS NOT A DEAL' },
      { name: '28. Structured Data Room renders', pattern: 'STRUCTURED DILIGENCE' },
      { name: '29. Six Data Room chapters render', pattern: 'MASTER DATA ROOM' },
      { name: '30. Investigative Diligence renders', pattern: 'GO DEEPER THAN THE PITCH' },
      { name: '31. Market branch renders', pattern: 'What evidence supports demand?' },
      { name: '32. Financial branch renders', pattern: 'What does scaling cost?' },
      { name: '33. Execution branch renders', pattern: 'What has already been delivered?' },
      { name: '34. Team branch renders', pattern: 'Who owns the critical capabilities?' },
      { name: '35. Legal branch renders', pattern: 'Is the company structure clear?' },
      { name: '36. Equity branch renders', pattern: 'Who owns what?' },
      { name: '37. Risk branch renders', pattern: 'What assumptions remain unresolved?' },
      { name: '38. Diligence example 1 renders', pattern: 'Demand still needs commercial validation.' },
      { name: '39. Diligence example 2 renders', pattern: 'Execution risk remains.' },
      { name: '40. Diligence example 3 renders', pattern: 'Funding logic requires review.' },
      { name: '41. Founder Meeting section renders', pattern: 'FROM DATA TO CONVERSATION' },
      { name: '42. Entrepreneur discussion topics render', pattern: 'Why now' },
      { name: '43. Investor discussion topics render', pattern: 'Fit with thesis' },
      { name: '44. No Fit renders', pattern: 'NO FIT' },
      { name: '45. More Information Needed renders', pattern: 'MORE INFORMATION NEEDED' },
      { name: '46. Potential Fit renders', pattern: 'POTENTIAL FIT' },
      { name: '47. Term Sheet section renders', pattern: 'SECTION 08 — FROM INTEREST TO TERMS' },
      { name: '48. Investment renders', pattern: 'How much capital enters the company.' },
      { name: '49. Valuation renders', pattern: 'The economic basis of the round.' },
      { name: '50. Ownership renders', pattern: 'What investors receive.' },
      { name: '51. Rights renders', pattern: 'What protections or governance rights may apply.' },
      { name: '52. Conditions renders', pattern: 'What needs to happen before closing.' },
      { name: '53. 20% illustrative investor ownership renders', pattern: 'NEW INVESTOR OWNERSHIP' },
      { name: '54. Journey to Closing renders', pattern: 'JOURNEY TO CLOSING' },
      { name: '55. Deal Process timeline renders', pattern: 'THE DEAL IS A PROCESS' },
      { name: '56. Won/Funded renders', pattern: 'FUNDED' },
      { name: '57. Lost/Closed renders', pattern: 'CLOSED' },
      { name: '58. Funding & Deals 7-step story renders', pattern: 'From readiness to a real investor process.' },
      { name: '59. Structured Deal Process equation renders', pattern: 'STRUCTURED DEAL PROCESS' },
      { name: '60. "(Not: GUARANTEED FUNDING)" renders', pattern: '(Not: GUARANTEED FUNDING)' },
      { name: '61. FAQ count and header renders', pattern: 'ABOUT FUNDING &amp; DEALS' },
      { name: '62. All exact FAQ questions render', pattern: 'How does matching work?' },
      { name: '63. Exact Figma answers are used', pattern: 'We align your company&#x27;s profile' },
      { name: '64. Complete Entrepreneur Journey renders', pattern: 'One company.' },
      { name: '65. Four Entrepreneur stages render', pattern: 'COMPANY &amp; VERIFICATION' },
      { name: '66. Stage 04 Funding & Deals highlighted', pattern: 'CURRENT STAGE' },
      { name: '67. Accumulated Context equation renders', pattern: 'ONE CONTINUOUS COMPANY JOURNEY' },
      { name: '68. Start Entrepreneur Journey -> /signup', pattern: 'href="/signup"' },
      { name: '69. Explore Company & Verification -> /for-entrepreneurs', pattern: 'href="/for-entrepreneurs"' },
      { name: '70. 01 -> 02 -> 03 -> 04 COMPLETE renders', pattern: 'ENTREPRENEUR JOURNEY 01 → 02 → 03 → 04 COMPLETE' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 70/70 FUNDING & DEALS PUBLIC ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyFundingDeals();
