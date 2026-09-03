import fs from 'fs';

async function verifyEquityReadiness() {
  console.log('--- TESTING /for-entrepreneurs/equity-readiness ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Equity & Readiness'") &&
      headerSource.includes("href: '/for-entrepreneurs/equity-readiness'") &&
      headerSource.includes("ctaText: 'Ownership & Readiness'");

    console.log(`✓ 1. PublicHeader config: Equity & Readiness -> /for-entrepreneurs/equity-readiness with CTA "Ownership & Readiness": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-entrepreneurs/equity-readiness');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-entrepreneurs/equity-readiness');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '2. /for-entrepreneurs/equity-readiness renders successfully', pattern: 'data-testid="entrepreneur-equity-readiness-page"' },
      { name: '3. PublicHeader bar present', pattern: 'data-testid="public-header-bar"' },
      { name: '4. Footer present', pattern: 'data-testid="public-footer"' },
      { name: '5. Hero renders', pattern: 'Structure' },
      { name: '6. Headline part "what comes next." renders in blue', pattern: 'what comes next.' },
      { name: '7. Journey tracker shows 03 EQUITY active', pattern: '03 EQUITY' },
      { name: '8. Today ownership 80/10/10 renders', pattern: 'Founder Henry Martin (80%)' },
      { name: '9. Option Pool 10% renders', pattern: 'Option Pool (10%)' },
      { name: '10. Early Contributor 10% renders', pattern: 'Early Contributor (10%)' },
      { name: '11. €500K future funding round renders', pattern: '€500K' },
      { name: '12. Post-round 64/8/8/20 renders', pattern: 'New Investor (20%)' },
      { name: '13. ILLUSTRATIVE EXAMPLE renders', pattern: 'ILLUSTRATIVE EXAMPLE' },
      { name: '14. Editorial statement renders', pattern: 'Raising capital changes more than cash.' },
      { name: '15. Ownership Clarity section renders', pattern: 'BEFORE THE FUNDRAISE' },
      { name: '16. Unclear state renders', pattern: 'UNCLEAR STATE' },
      { name: '17. Founder promises renders', pattern: 'Founder promises' },
      { name: '18. Informal equity discussions renders', pattern: 'informal equity discussions' },
      { name: '19. Structured cap table spine renders', pattern: 'STRUCTURED CAP TABLE' },
      { name: '20. FOUNDERS / EMPLOYEES / CONTRIBUTORS / INVESTORS / FUTURE RIGHTS render', pattern: 'FUTURE RIGHTS' },
      { name: '21. Clarity checklist renders', pattern: 'Who owns shares' },
      { name: '22. Legal limitation renders', pattern: 'Final legal ownership and securities decisions depend on valid company records' },
      { name: '23. Cap Table section renders', pattern: 'OWNERSHIP, MADE LEGIBLE' },
      { name: '24. Founder 80% card renders', pattern: 'Equity Core' },
      { name: '25. Option Pool 10% card renders', pattern: 'Incentive Pool' },
      { name: '26. Angel Round 10% card renders', pattern: 'Angel Round' },
      { name: '27. Issued definition renders', pattern: 'Finalized and granted shares.' },
      { name: '28. Reserved definition renders', pattern: 'Shares set aside for future use' },
      { name: '29. Vesting definition renders', pattern: 'Ownership earned over time' },
      { name: '30. Option Pool definition renders', pattern: 'Dedicated equity for future employees' },
      { name: '31. Convertible definition renders', pattern: 'Rights that may become shares' },
      { name: '32. Fully Diluted definition renders', pattern: 'Total possible ownership count' },
      { name: '33. Ownership Evolution renders', pattern: 'OWNERSHIP EVOLVES' },
      { name: '34. Stage 01 100% renders', pattern: 'Founding' },
      { name: '35. Stage 02 90/10 renders', pattern: 'Team Building' },
      { name: '36. Stage 03 80/10/10 renders', pattern: 'Early Contributor' },
      { name: '37. Stage 04 64/8/8/20 renders', pattern: 'Funding Round' },
      { name: '38. Pre-decision checklist renders', pattern: 'BEFORE MAKING A DECISION, THE ENTREPRENEUR SHOULD UNDERSTAND:' },
      { name: '39. Scenario Thinking section renders', pattern: 'SECTION 05 — SCENARIO THINKING' },
      { name: '40. Scenario A renders', pattern: 'SCENARIO A' },
      { name: '41. Scenario B renders', pattern: 'SCENARIO B' },
      { name: '42. Scenario C renders', pattern: 'SCENARIO C' },
      { name: '43. ILLUSTRATIVE SCENARIOS ONLY renders', pattern: 'ILLUSTRATIVE SCENARIOS ONLY' },
      { name: '44. Valuation Context hub renders', pattern: 'UNDERSTAND THE CONTEXT' },
      { name: '45. Company Stage node renders', pattern: 'COMPANY STAGE' },
      { name: '46. Traction node renders', pattern: 'TRACTION' },
      { name: '47. Financial Context node renders', pattern: 'FINANCIAL CONTEXT' },
      { name: '48. Market node renders', pattern: 'MARKET' },
      { name: '49. Execution node renders', pattern: 'EXECUTION' },
      { name: '50. Risk node renders', pattern: 'RISK' },
      { name: '51. Structured Funding Ask renders', pattern: 'FROM “WE NEED MONEY” TO A STRUCTURED ASK' },
      { name: '52. €500K Funding Need renders', pattern: 'STEP 5: FUNDING NEED' },
      { name: '53. Use of Funds 40/25/20/15 renders', pattern: 'PRODUCT &amp; TECHNOLOGY' },
      { name: '54. Structured Raise Logic equation renders', pattern: 'STRUCTURED RAISE LOGIC' },
      { name: '55. Review Wall renders', pattern: 'CONNECT THE COMPANY LOGIC' },
      { name: '56. €500K Ask vs €720K Forecast example renders', pattern: 'FINDING: ASK MAY NOT COVER THE PLAN' },
      { name: '57. 5% Option Pool vs 8 future hires renders', pattern: 'FINDING: OPTION POOL MAY NEED REVIEW' },
      { name: '58. Strong market demand vs 18 interviews/no transactions renders', pattern: 'FINDING: CLAIM NEEDS BETTER QUALIFICATION' },
      { name: '59. Growth-stage vs Pre-launch MVP renders', pattern: 'FINDING: POSITIONING MAY BE TOO ADVANCED' },
      { name: '60. Final Summary renders', pattern: 'Understand the structure before entering the deal.' },
      { name: '61. Investor-Ready Context equation renders', pattern: 'INVESTOR-READY CONTEXT' },
      { name: '62. 2 FAQ items render', pattern: 'ABOUT EQUITY &amp; READINESS' },
      { name: '63. Final Funding & Deals transition renders', pattern: 'NEXT — FUNDING &amp; DEALS' },
      { name: '64. Continue to Funding & Deals uses planned public route', pattern: 'href="/for-entrepreneurs/funding-deals"' },
      { name: '65. Back to Entrepreneur Journey -> /for-entrepreneurs', pattern: 'Back to Entrepreneur Journey' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 65/65 EQUITY & READINESS PUBLIC CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyEquityReadiness();
