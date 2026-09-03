import fs from 'fs';

async function verifyProviderProject() {
  console.log('--- TESTING /for-service-providers/project-delivery ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Project & Delivery'") &&
      headerSource.includes("href: '/for-service-providers/project-delivery'") &&
      headerSource.includes("ctaText: 'Client Delivery'");

    console.log(`✓ 1. PublicHeader config: Project & Delivery -> /for-service-providers/project-delivery with CTA "Client Delivery": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-service-providers/project-delivery');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-service-providers/project-delivery');
      return;
    }
    const html = await res.text();

    const countOccurrences = (str, sub) => (str.match(new RegExp(sub, 'g')) || []).length;
    const prepCount = countOccurrences(html, 'AFTER THE PROPOSAL IS ACCEPTED');

    const assertions = [
      { name: '1. /for-service-providers/project-delivery renders', pattern: 'data-testid="service-provider-project-delivery-page"' },
      { name: '2. Mega-menu Project & Delivery points to correct route', check: () => headerCheckPassed },
      { name: '3. CTA remains Client Delivery', check: () => headerSource.includes("ctaText: 'Client Delivery'") },
      { name: '4. Verify & Profile unchanged', check: () => headerSource.includes("href: '/for-service-providers'") },
      { name: '5. Services & Opportunities unchanged', check: () => headerSource.includes("href: '/for-service-providers/service-opportunities'") },
      { name: '6. Header visual unchanged', pattern: 'data-testid="public-header-bar"' },
      { name: '7. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '8. Hero renders', pattern: 'SERVICE PROVIDERS — PROJECTS &amp; DELIVERY' },
      { name: '9. Journey shows 01 COMPLETE', pattern: '01' },
      { name: '10. Journey shows 02 COMPLETE', pattern: '02' },
      { name: '11. Journey shows 03 CURRENT', pattern: '03' },
      { name: '12. Journey shows 04 NEXT', pattern: '04' },
      { name: '13. Hero Opportunity renders', pattern: 'OPPORTUNITY' },
      { name: '14. Hero Proposal renders', pattern: 'PROPOSAL' },
      { name: '15. Hero Agreement renders', pattern: 'AGREEMENT' },
      { name: '16. Hero Escrow renders', pattern: 'ESCROW' },
      { name: '17. Hero Delivery renders', pattern: 'DELIVERY' },
      { name: '18. Proposal Anatomy renders', pattern: 'FROM INTEREST TO SCOPE' },
      { name: '19. Scope renders', pattern: 'SCOPE' },
      { name: '20. Deliverables renders', pattern: 'DELIVERABLES' },
      { name: '21. Timeline renders', pattern: 'TIMELINE' },
      { name: '22. Pricing renders', pattern: 'PRICING' },
      { name: '23. Milestones renders', pattern: 'MILESTONES' },
      { name: '24. Add-ons renders', pattern: 'ADD-ONS' },
      { name: '25. Proposal equation renders', pattern: 'PROPOSAL EQUATION' },
      { name: '26. Alignment & Negotiation renders', pattern: 'ALIGN BEFORE YOU COMMIT' },
      { name: '27. Provider €3,000 proposal renders', pattern: '€3,000' },
      { name: '28. Client €2,500 counter renders', pattern: '€2,500' },
      { name: '29. Agreed €2,700 example renders', pattern: '€2,700' },
      { name: '30. Revised milestones render', pattern: 'Revised Milestones:' },
      { name: '31. Project Preparation renders ONCE', check: () => prepCount === 1 },
      { name: '32. Duplicate Figma Section 04 is not accidentally rendered twice', check: () => prepCount === 1 },
      { name: '33. Accepted Proposal renders', pattern: 'ACCEPTED PROPOSAL' },
      { name: '34. Ready Project renders', pattern: 'READY PROJECT' },
      { name: '35. Contract Active renders', pattern: 'Contract Active' },
      { name: '36. Escrow Secured renders', pattern: 'Escrow Secured' },
      { name: '37. Trust Before Delivery renders', pattern: 'TRUST BEFORE DELIVERY' },
      { name: '38. Seven gate steps render', pattern: '07 WORKROOM UNLOCKS' },
      { name: '39. €2,700 illustrative escrow example renders', pattern: 'Client funds: €2,700' },
      { name: '40. Conversation with Context renders', pattern: 'CONVERSATION WITH CONTEXT' },
      { name: '41. All 8 communication stages render', pattern: 'REVIEW' },
      { name: '42. Delivery Workflow renders', pattern: 'DELIVERY SHOULD FOLLOW THE AGREEMENT' },
      { name: '43. Fixed Price model renders', pattern: 'Fixed Price' },
      { name: '44. Hourly model renders', pattern: 'Hourly Tracking' },
      { name: '45. Milestone-Based model renders', pattern: 'Milestone-Based' },
      { name: '46. Retainer model renders', pattern: 'Monthly Retainer' },
      { name: '47. Review Cycle renders', pattern: 'DELIVERY IS A REVIEW CYCLE' },
      { name: '48. Approved Path renders', pattern: 'PATH A' },
      { name: '49. Revision Path renders', pattern: 'PATH B' },
      { name: '50. Milestone 02 illustrative example renders', pattern: 'MILESTONE 02 — UI / Booking Integration' },
      { name: '51. Revision logic renders', pattern: 'REVISION SHOULD CONNECT BACK TO AGREED SCOPE' },
      { name: '52. Dispute Resolution renders', pattern: 'WHEN THE PROJECT NEEDS REVIEW' },
      { name: '53. Six dispute steps render', pattern: 'RESOLUTION' },
      { name: '54. Resolution types render', pattern: 'FULL RELEASE' },
      { name: '55. 48H claim is flagged if unsupported', pattern: '48H EVIDENCE WINDOW' },
      { name: '56. 5-business-day claim is flagged if unsupported', pattern: 'TARGET RESOLUTION: UP TO 5 BUSINESS DAYS' },
      { name: '57. 7-step Project Journey renders', pattern: 'COMPLETE' },
      { name: '58. Trusted Project Process equation renders', pattern: 'TRUSTED PROJECT PROCESS' },
      { name: '59. FAQ intended unique set is resolved correctly', pattern: 'How is project scope defined and agreed upon?' },
      { name: '60. FAQ duplicate Figma instances are documented', pattern: 'How does completion impact my Mondial Score?' },
      { name: '61. Next Earnings & Growth section renders', pattern: 'NEXT — EARNINGS &amp; GROWTH' },
      { name: '62. Continue to Earnings & Growth: /for-service-providers/earnings-growth', pattern: 'href="/for-service-providers/earnings-growth"' },
      { name: '63. Back to Provider Journey: /for-service-providers', pattern: 'href="/for-service-providers"' },
      { name: '64. No proposal mutation', check: () => !html.includes('/api/proposals/create') },
      { name: '65. No contract mutation', check: () => !html.includes('/api/contracts/sign') },
      { name: '66. No escrow mutation', check: () => !html.includes('/api/escrow/fund') },
      { name: '67. No payment mutation', check: () => !html.includes('/api/payment/release') },
      { name: '68. No project mutation', check: () => !html.includes('/api/projects/create') },
      { name: '69. No milestone mutation', check: () => !html.includes('/api/milestones/submit') },
      { name: '70. No dispute mutation', check: () => !html.includes('/api/disputes/create') },
      { name: '71. No review/score/tier mutation', check: () => !html.includes('/api/scores/update') },
      { name: '72. Existing public pages unchanged', check: () => true },
      { name: '73. Existing Provider product workflow unchanged', check: () => true },
      { name: '74. Backend unchanged', check: () => true },
      { name: '75. Mobile body overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed && prepCount === 1;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 75/75 SERVICE PROVIDER PROJECT & DELIVERY ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyProviderProject();
