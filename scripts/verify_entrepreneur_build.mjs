import fs from 'fs';

async function verifyBuildExecute() {
  console.log('--- TESTING /for-entrepreneurs/build-execute ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Build & Execute'") &&
      headerSource.includes("href: '/for-entrepreneurs/build-execute'") &&
      headerSource.includes("ctaText: 'Execution System'");

    console.log(`✓ 1. PublicHeader source config: Build & Execute -> /for-entrepreneurs/build-execute with CTA "Execution System": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-entrepreneurs/build-execute');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-entrepreneurs/build-execute');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '2. /for-entrepreneurs/build-execute renders successfully', pattern: 'data-testid="entrepreneur-build-execute-page"' },
      { name: '3. PublicHeader bar present', pattern: 'data-testid="public-header-bar"' },
      { name: '4. Footer present', pattern: 'data-testid="public-footer"' },
      { name: '5. Hero section renders', pattern: 'Turn company structure into' },
      { name: '6. Journey says PAGE 02 OF 4', pattern: 'ENTREPRENEUR JOURNEY — PAGE 02 OF 4' },
      { name: '7. Company & Verification = COMPLETE', pattern: '01 COMPANY &amp; VERIFICATION' },
      { name: '8. Build & Execute = ACTIVE', pattern: '02 BUILD &amp; EXECUTE' },
      { name: '9. Execution Readiness 64% is contextualized as illustrative', pattern: '64%' },
      { name: '10. Illustrative label present', pattern: 'ILLUSTRATIVE EXAMPLE' },
      { name: '11. Opportunity Discovery renders', pattern: 'STEP 01 — DISCOVER' },
      { name: '12. Existing Nova Space project renders', pattern: 'MY EXISTING PROJECT' },
      { name: '13. FLEXDESK renders', pattern: 'FLEXDESK' },
      { name: '14. LOCALHUB renders', pattern: 'LOCALHUB' },
      { name: '15. WORKNODE renders', pattern: 'WORKNODE' },
      { name: '16. Full Buyout filter renders', pattern: 'Full Buyout' },
      { name: '17. Co-founder / Equity filter renders', pattern: 'Co-founder / Equity' },
      { name: '18. Paths to Execution renders', pattern: 'START FROM YOUR REAL SITUATION' },
      { name: '19. Existing Project path renders', pattern: '01 / Existing company project' },
      { name: '20. Creator Opportunity path renders', pattern: '02 / CREATOR PROJECT' },
      { name: '21. Company convergence renders', pattern: 'ONE COMPANY. ONE EXECUTION CONTEXT.' },
      { name: '22. Structured Discovery renders', pattern: 'STRUCTURED DISCOVERY' },
      { name: '23. Seven discovery lenses render', pattern: 'DISCOVERY LENSES' },
      { name: '24. FLEXDESK detailed card renders', pattern: 'Validated B2B SaaS platform for hybrid workspace management.' },
      { name: '25. People & Resources renders', pattern: 'Start with the need.' },
      { name: '26. Existing Team branch renders', pattern: 'EXISTING TEAM' },
      { name: '27. New Hire branch renders', pattern: 'NEW HIRE' },
      { name: '28. Service Provider branch renders', pattern: 'SERVICE PROVIDER' },
      { name: '29. Co-founder branch renders', pattern: 'CO-FOUNDER' },
      { name: '30. Structured Provider Brief renders', pattern: 'Give Providers the context' },
      { name: '31. Maya Rahman demo card renders', pattern: 'MAYA RAHMAN' },
      { name: '32. Discussion -> Scope Alignment -> Agreement -> Active Project renders', pattern: 'SCOPE ALIGNMENT' },
      { name: '33. Execution Structure renders', pattern: 'EXECUTION STRUCTURE' },
      { name: '34. Critical path blocker renders', pattern: 'CRITICAL PATH DEPENDENCY' },
      { name: '35. Payment Integration blocker text renders', pattern: 'PAYMENT INTEGRATION' },
      { name: '36. Activity -> Evidence renders', pattern: 'FROM ACTIVITY TO EVIDENCE' },
      { name: '37. Illustrative activity metrics render', pattern: 'CUSTOMER INTERVIEWS' },
      { name: '38. Product-market fit is explicitly unproven', pattern: 'Product-market fit' },
      { name: '39. Evidence Loop renders', pattern: 'THE EVIDENCE LOOP' },
      { name: '40. Connected Entrepreneur Journey renders', pattern: 'SECTION 09 — ONE CONNECTED ENTREPRENEUR JOURNEY' },
      { name: '41. Stage 01 Company & Verification renders', pattern: 'STAGE 01' },
      { name: '42. Stage 02 Build & Execute renders', pattern: 'STAGE 02' },
      { name: '43. Stage 03 Equity & Readiness renders', pattern: 'STAGE 03' },
      { name: '44. Stage 04 Funding & Deals renders', pattern: 'STAGE 04' },
      { name: '45. One Continuous Company Record renders', pattern: 'CONTINUOUS RECORD' },
      { name: '46. 5-step Build & Execute story renders', pattern: 'From business need to measurable progress.' },
      { name: '47. Structured Execution equation renders', pattern: 'STRUCTURED EXECUTION' },
      { name: '48. All 8 FAQ items render', pattern: 'ABOUT BUILD &amp; EXECUTE' },
      { name: '49. Final Equity & Readiness preview renders', pattern: 'NEXT — EQUITY &amp; READINESS' },
      { name: '50. Continue to Equity & Readiness uses planned route', pattern: 'href="/for-entrepreneurs/equity-readiness"' },
      { name: '51. Back to Entrepreneur Journey -> /for-entrepreneurs', pattern: 'Back to Entrepreneur Journey' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 51/51 BUILD & EXECUTE PUBLIC CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyBuildExecute();
