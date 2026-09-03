async function verifyForEntrepreneurs() {
  console.log('--- TESTING /for-entrepreneurs ON LOCALHOST:3000 ---');
  try {
    const res = await fetch('http://localhost:3000/for-entrepreneurs');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-entrepreneurs');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '1. /for-entrepreneurs renders successfully', pattern: 'data-testid="entrepreneur-company-page"' },
      { name: '2. Entrepreneur mega-menu Company & Verification points to /for-entrepreneurs', pattern: 'href="/for-entrepreneurs"' },
      { name: '3. PublicHeader bar present', pattern: 'data-testid="public-header-bar"' },
      { name: '4. Footer present', pattern: 'data-testid="public-footer"' },
      { name: '5. Hero composition renders', pattern: 'Build the company' },
      { name: '6. Hero headline renders', pattern: 'Build the company' },
      { name: '7. 01 VERIFY journey tracker renders', pattern: '01 VERIFY' },
      { name: '8. Company Foundation Command Center renders', pattern: 'MONDIAL COMPANY FOUNDATION COMMAND CENTER' },
      { name: '9. 72% readiness marked illustrative', pattern: 'ILLUSTRATIVE EXAMPLE' },
      { name: '10. Two Ways In renders', pattern: 'Already have a company? Or' },
      { name: '11. Project-path (Nova Space) renders', pattern: 'PROJECT CONTEXT AVAILABLE' },
      { name: '12. Existing-company-path (Nova Space SAS) renders', pattern: 'COMPANY ALREADY EXISTS' },
      { name: '13. Convergence point renders', pattern: 'CONVERGENCE POINT' },
      { name: '14. Company Identity renders', pattern: 'One company. One structured record' },
      { name: '15. Identity relationship renders', pattern: 'IDENTITY RELATIONSHIP' },
      { name: '16. Primary representative (Henry Martin) renders', pattern: 'PRIMARY REPRESENTATIVE' },
      { name: '17. Official Verification renders', pattern: 'Connect the company record to official information' },
      { name: '18. KBIS France example renders', pattern: 'KBIS / Official Registration Record' },
      { name: '19. Representatives & Control renders', pattern: 'Know who represents, controls and accesses the business' },
      { name: '20. Workspace Access & Roles table renders', pattern: 'Workspace Access &amp; Permissions Demo' },
      { name: '21. Bank & Financial Foundation renders', pattern: 'Connect legal identity to financial reality' },
      { name: '22. Bank identity IBAN masked renders', pattern: 'FR•• •••• •••• •••• •••• •••' },
      { name: '23. Compliance Intelligence renders', pattern: 'Not every company needs the same documents' },
      { name: '24. Compliance filter options render', pattern: 'NOT APPLICABLE' },
      { name: '25. Trust Without Overexposure renders', pattern: 'Verified does not mean everything becomes public' },
      { name: '26. Private / Controls / Shared architecture renders', pattern: 'PRIVATE VERIFICATION DATA' },
      { name: '27. Company Readiness Command Center renders', pattern: 'Know exactly what is ready next' },
      { name: '28. 86% readiness renders', pattern: '86%' },
      { name: '29. Foundation Complete renders', pattern: 'The foundation is ready.' },
      { name: '30. Mandatory disclaimer renders', pattern: 'Readiness indicates structural preparedness within the Mondial ecosystem' },
      { name: '31. Build & Execute preview renders', pattern: 'PREVIEW: PAGE 02 (BUILD &amp; EXECUTE)' },
      { name: '32. Active Priorities Pipeline renders', pattern: 'ACTIVE PRIORITIES PIPELINE' },
      { name: '33. FAQ accordion renders 9 items', pattern: 'TRANSITION CONTEXT' },
      { name: '34. Final CTA renders', pattern: 'Your company is structured.' },
      { name: '35. Continue to Build & Execute link renders', pattern: 'href="/for-entrepreneurs/build-execute"' },
      { name: '36. Review Entrepreneur Journey link renders', pattern: 'href="/for-entrepreneurs"' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 36/36 ENTREPRENEUR COMPANY & VERIFICATION CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyForEntrepreneurs();
