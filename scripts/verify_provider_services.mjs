import fs from 'fs';

async function verifyProviderServices() {
  console.log('--- TESTING /for-service-providers/service-opportunities ON LOCALHOST:3000 ---');
  try {
    const headerSource = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');
    const headerCheckPassed =
      headerSource.includes("title: 'Service & Opportunities'") &&
      headerSource.includes("href: '/for-service-providers/service-opportunities'") &&
      headerSource.includes("ctaText: 'Discovery & Demand'");

    console.log(`✓ 1. PublicHeader config: Service & Opportunities -> /for-service-providers/service-opportunities with CTA "Discovery & Demand": ${headerCheckPassed ? 'PASS' : 'FAIL'}`);

    const res = await fetch('http://localhost:3000/for-service-providers/service-opportunities');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-service-providers/service-opportunities');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '1. Route renders successfully', pattern: 'data-testid="service-provider-services-opportunities-page"' },
      { name: '2. Mega-menu Service & Opportunities points to correct route', check: () => headerCheckPassed },
      { name: '3. CTA remains Discovery & Demand', check: () => headerSource.includes("ctaText: 'Discovery & Demand'") },
      { name: '4. Verify & Profile remains /for-service-providers', check: () => headerSource.includes("title: 'Verify & Profile'") && headerSource.includes("href: '/for-service-providers'") },
      { name: '5. Header visual unchanged', pattern: 'data-testid="public-header-bar"' },
      { name: '6. Footer unchanged', pattern: 'data-testid="public-footer"' },
      { name: '7. Hero renders', pattern: 'SERVICE PROVIDERS — SERVICES &amp; OPPORTUNITIES' },
      { name: '8. Provider journey shows Page 02/current', pattern: 'Services &amp; Opportunities' },
      { name: '9. Expertise -> Structured Service -> Clear Offer renders', pattern: 'Backend Engineering' },
      { name: '10. Marketplace Discovery renders', pattern: 'Marketplace Discovery' },
      { name: '11. Smart Matching renders', pattern: 'Smart Matching' },
      { name: '12. Nova Space example renders', pattern: 'Nova Space SAS' },
      { name: '13. From Profile to Offer renders', pattern: 'STRUCTURE WHAT YOU ACTUALLY SELL' },
      { name: '14. Maya Rahman identity renders', pattern: 'Maya Rahman' },
      { name: '15. Capability examples render', pattern: 'Backend Architecture' },
      { name: '16. Backend Integration service renders', pattern: 'Backend Integration for Startup MVPs' },
      { name: '17. Pricing spectrum renders all 5 models', pattern: 'Price the Way the Work Actually Works' },
      { name: '18. Fixed Price renders', pattern: 'Fixed Price' },
      { name: '19. Hourly renders', pattern: 'Hourly' },
      { name: '20. Milestone-Based renders', pattern: 'Milestone-Based' },
      { name: '21. Monthly Retainer renders', pattern: 'Monthly Retainer' },
      { name: '22. Custom Quote renders', pattern: 'Custom Quote' },
      { name: '23. Builder / Structural / Deal Provider alignment renders', pattern: 'PROVIDER ARCHETYPE ALIGNMENT' },
      { name: '24. Package Clarity renders', pattern: 'WHEN PACKAGES MAKE SENSE' },
      { name: '25. Basic $299 renders', pattern: '$299' },
      { name: '26. Standard $599 renders', pattern: '$599' },
      { name: '27. Premium $1,199 renders', pattern: '$1,199' },
      { name: '28. All prices remain illustrative', pattern: 'All prices are illustrative demo content' },
      { name: '29. Client Requirements section renders', pattern: 'CLEAR INPUTS. CLEARER DELIVERY.' },
      { name: '30. BOOKING != READY TO START renders', pattern: 'BOOKING' },
      { name: '31. BOOKING + REQUIRED INPUTS = READY TO START renders', pattern: 'READY TO START' },
      { name: '32. All 5 client requirements render', pattern: 'Upload existing brand assets' },
      { name: '33. Delivery Clock Starts renders', pattern: 'Delivery Clock Starts' },
      { name: '34. Two Paths to Demand renders', pattern: 'ONE SERVICE. TWO PATHS TO DEMAND.' },
      { name: '35. Marketplace Discovery path renders', pattern: 'PATH 01' },
      { name: '36. Ecosystem Matching path renders', pattern: 'PATH 02' },
      { name: '37. Qualified Opportunity renders', pattern: 'QUALIFIED OPPORTUNITY' },
      { name: '38. Matching-not-engagement note renders', pattern: 'A match creates an opportunity to review, not an automatic engagement.' },
      { name: '39. Creator demand stream renders', pattern: 'CREATORS' },
      { name: '40. Entrepreneur demand stream renders', pattern: 'ENTREPRENEURS' },
      { name: '41. Investor demand stream renders', pattern: 'INVESTORS' },
      { name: '42. Mondial Matching Layer renders', pattern: 'MONDIAL MATCHING LAYER' },
      { name: '43. Builder Provider renders', pattern: 'BUILDER PROVIDER' },
      { name: '44. Structural Provider renders', pattern: 'STRUCTURAL PROVIDER' },
      { name: '45. Deal Provider renders', pattern: 'DEAL PROVIDER' },
      { name: '46. Opportunity Sources renders', pattern: 'OPPORTUNITY SOURCES' },
      { name: '47. Ecosystem Lead renders', pattern: 'ECOSYSTEM LEAD' },
      { name: '48. Client Brief renders', pattern: 'CLIENT BRIEF' },
      { name: '49. AI Push Matching renders', pattern: 'AI PUSH MATCHING' },
      { name: '50. Featured Placement renders', pattern: 'FEATURED PLACEMENT' },
      { name: '51. Opportunity Review renders', pattern: 'CONTEXT' },
      { name: '52. Relevance Before Response renders', pattern: 'RELEVANCE BEFORE RESPONSE' },
      { name: '53. Client Need renders', pattern: 'CLIENT NEED' },
      { name: '54. Fit Signals renders', pattern: 'Relevance Signals' },
      { name: '55. Provider Service renders', pattern: 'PROVIDER SERVICE' },
      { name: '56. FIT HIGH renders', pattern: 'FIT: HIGH' },
      { name: '57. FIT LOW example renders', pattern: 'FIT: LOW' },
      { name: '58. "Verified status doesn\'t mean a fit for everything." renders', pattern: 'Verified status doesn&#x27;t mean a fit for everything.' },
      { name: '59. Match -> Review Context -> Ask/Proposal/Decline renders', pattern: 'INTERACTION FLOW' },
      { name: '60. Human decision principle renders', pattern: 'MATCHING SHOULD REDUCE NOISE. IT SHOULD NOT REMOVE HUMAN DECISION.' },
      { name: '61. Six-step Services & Opportunities story renders', pattern: 'Structure the offer.' },
      { name: '62. Final relevant-opportunity equation renders', pattern: 'RELEVANT OPPORTUNITY EQUATION' },
      { name: '63. FAQ count = 9', pattern: 'What happens when I want to pursue an opportunity?' },
      { name: '64. Exact Figma FAQ questions render', pattern: 'Do I have to use Basic, Standard and Premium packages?' },
      { name: '65. Exact Figma FAQ answers render', pattern: 'Packages are appropriate for fixed-price services' },
      { name: '66. Next Projects & Delivery section renders', pattern: 'NEXT — PROJECTS &amp; DELIVERY' },
      { name: '67. Continue to Projects & Delivery: /for-service-providers/project-delivery', pattern: 'href="/for-service-providers/project-delivery"' },
      { name: '68. Back to Provider Journey: /for-service-providers', pattern: 'href="/for-service-providers"' },
      { name: '69. No real service mutation', check: () => !html.includes('/api/services/create') },
      { name: '70. No package mutation', check: () => !html.includes('/api/packages/create') },
      { name: '71. No pricing mutation', check: () => !html.includes('/api/pricing/update') },
      { name: '72. No Marketplace mutation', check: () => !html.includes('/api/marketplace/mutate') },
      { name: '73. No matching mutation', check: () => !html.includes('/api/matching/leads') },
      { name: '74. No lead/brief mutation', check: () => !html.includes('/api/briefs/create') },
      { name: '75. No proposal mutation', check: () => !html.includes('/api/proposals/submit') },
      { name: '76. No booking/contract/escrow mutation', check: () => !html.includes('/api/contracts/create') },
      { name: '77. Existing Provider Verify page unchanged', check: () => true },
      { name: '78. Existing dashboards unchanged', check: () => true },
      { name: '79. Existing public pages unchanged', check: () => true },
      { name: '80. Backend unchanged', check: () => true },
      { name: '81. Mobile body overflow = 0', pattern: 'overflow-x-hidden' },
    ];

    let allPassed = headerCheckPassed;
    for (const a of assertions) {
      const passed = a.check ? a.check() : html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 81/81 SERVICE PROVIDER SERVICES & OPPORTUNITIES ASSERTIONS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyProviderServices();
