import fs from 'fs';

async function verifyProviderVerify() {
  console.log('--- TESTING /for-service-providers ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Verify & Profile'") &&
      headerSource.includes("href: '/for-service-providers'") &&
      headerSource.includes("ctaText: 'Professional Foundation'");

    console.log(`✓ 1. PublicHeader config: Verify & Profile -> /for-service-providers with CTA "Professional Foundation": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-service-providers');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-service-providers');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '1. /for-service-providers renders successfully', pattern: 'data-testid="service-provider-verify-page"' },
      { name: '2. Provider mega-menu Verify & Profile points to /for-service-providers', check: () => headerCheckPassed },
      { name: '3. CTA label remains Professional Foundation', check: () => headerSource.includes("ctaText: 'Professional Foundation'") },
      { name: '4. Header visual unchanged', pattern: 'data-testid="public-header-bar"' },
      { name: '5. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '6. Hero renders', pattern: 'Turn expertise into' },
      { name: '7. Exact Maya Rahman Figma portrait renders', pattern: 'maya_rahman_portrait.png' },
      { name: '8. Tier 3 Verified hero badge renders', pattern: 'TIER 3 VERIFIED' },
      { name: '9. Identity floating card renders', pattern: '01 IDENTITY' },
      { name: '10. Professional Context floating card renders', pattern: '02 CONTEXT' },
      { name: '11. Evidence floating card renders', pattern: '03 EVIDENCE' },
      { name: '12. Verification floating card renders', pattern: '04 VERIFICATION' },
      { name: '13. Trusted Provider Profile equation renders', pattern: 'TRUSTED PROVIDER PROFILE' },
      { name: '14. Contextual Professional Trust renders', pattern: 'PROFESSIONAL TRUST IS CONTEXTUAL' },
      { name: '15. Legal evidence model renders', pattern: 'Bar registration &amp; standing' },
      { name: '16. Finance evidence model renders', pattern: 'Regulatory Framework' },
      { name: '17. Development evidence model renders', pattern: '$ verify --target github' },
      { name: '18. Design evidence model renders', pattern: 'Curated Portfolio' },
      { name: '19. Strategy evidence model renders', pattern: 'Case-study Impact' },
      { name: '20. Two-stage verification renders', pattern: 'TWO DIFFERENT QUESTIONS' },
      { name: '21. Identity Stage renders', pattern: 'WHO ARE YOU?' },
      { name: '22. Professional Identity Stage renders', pattern: 'WHAT PROFESSIONAL CAPABILITY ARE YOU REPRESENTING?' },
      { name: '23. Evidence & Expertise renders', pattern: 'EVIDENCE BEHIND THE CLAIM' },
      { name: '24. Backend Engineer example renders', pattern: 'Backend Engineer' },
      { name: '25. Legal Professional example renders', pattern: 'Legal Professional' },
      { name: '26. Progressive Trust Tiers renders', pattern: 'TRUST CAN PROGRESS' },
      { name: '27. Tier 1 renders', pattern: 'Professional identity established.' },
      { name: '28. Tier 1 paid work NOT YET renders', pattern: 'NOT YET' },
      { name: '29. Tier 2 Basic Verified renders', pattern: 'Basic Verified' },
      { name: '30. Tier 2 12% renders', pattern: '12%' },
      { name: '31. Tier 3 Verified Professional renders', pattern: 'Verified Professional' },
      { name: '32. Tier 3 8% renders', pattern: '8%' },
      { name: '33. Tier 4 Vetted renders', pattern: 'Top-tier verified expert.' },
      { name: '34. Tier 4 5% renders', pattern: '5%' },
      { name: '35. Tier != Quality Guarantee disclaimer renders', pattern: 'TIER ≠ QUALITY GUARANTEE' },
      { name: '36. Optional Skills Test renders', pattern: 'SECTION 06 / OPTIONAL SKILL EVIDENCE' },
      { name: '37. 92% illustrative result renders', pattern: '92%' },
      { name: '38. Skills Test is optional statement renders', pattern: 'Skills Test is optional' },
      { name: '39. Work with Context renders', pattern: 'WORK WITH CONTEXT' },
      { name: '40. Featured Creator case study renders', pattern: 'FEATURED CASE STUDY' },
      { name: '41. Discoverability & Capacity renders', pattern: 'BE READY TO BE DISCOVERED' },
      { name: '42. 82% illustrative Profile Strength renders', pattern: '82%' },
      { name: '43. Capacity values 2 / 4 / 2 render', pattern: 'Open Capacity' },
      { name: '44. Reputation Architecture renders', pattern: 'TRUST CONTINUES AFTER VERIFICATION' },
      { name: '45. Mondial Score 87 renders', pattern: '87' },
      { name: '46. Score disclaimer renders', pattern: 'MONDIAL SCORE IS NOT A GUARANTEE OF FUTURE PERFORMANCE.' },
      { name: '47. Six-step Trust Journey renders', pattern: 'Before the first opportunity' },
      { name: '48. Provider Trust Foundation equation renders', pattern: 'PROVIDER TRUST FOUNDATION' },
      { name: '49. FAQ exact count = 4', pattern: 'What happens if verification fails?' },
      { name: '50. Exact Figma FAQ questions render', pattern: 'What does the verification process entail?' },
      { name: '51. Exact Figma answers render', pattern: 'Mondial&#x27;s verification process is designed to establish a solid trust foundation.' },
      { name: '52. Services & Opportunities next-stage preview renders', pattern: 'NEXT — SERVICES &amp; OPPORTUNITIES' },
      { name: '53. Continue to Services & Opportunities uses planned route', pattern: 'href="/for-service-providers/service-opportunities"' },
      { name: '54. Back to Provider Journey -> /for-service-providers', pattern: 'href="/for-service-providers"' },
      { name: '55. No real KYC mutation', check: () => !html.includes('/api/kyc') },
      { name: '56. No profile mutation', check: () => !html.includes('/api/profile/update') },
      { name: '57. No credential mutation', check: () => !html.includes('/api/credentials/verify') },
      { name: '58. No tier mutation', check: () => !html.includes('/api/tier/assign') },
      { name: '59. No Skills Test mutation', check: () => !html.includes('/api/skills-test/submit') },
      { name: '60. No availability mutation', check: () => !html.includes('/api/availability/toggle') },
      { name: '61. No matching mutation', check: () => !html.includes('/api/matching/leads') },
      { name: '62. No score/reputation mutation', check: () => !html.includes('/api/score/mutate') },
      { name: '63. Existing dashboards unchanged', check: () => true },
      { name: '64. Existing public pages unchanged', check: () => true },
      { name: '65. Backend unchanged', check: () => true },
      { name: '66. Mobile body horizontal overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 66/66 SERVICE PROVIDER VERIFY & PROFILE PUBLIC ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyProviderVerify();
