async function verifyCreatorIdentity() {
  console.log('--- TESTING /for-creators/identity-verification ON LOCALHOST:3000 ---');
  try {
    const res = await fetch('http://localhost:3000/for-creators/identity-verification');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-creators/identity-verification');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: 'Identity & Verification Page Container', pattern: 'data-testid="creator-identity-verification-page"' },
      { name: 'Public header bar present', pattern: 'data-testid="public-header-bar"' },
      { name: 'Hero Headline', pattern: 'Every project starts with a real person' },
      { name: 'Hero Profile Readiness 72%', pattern: '72%' },
      { name: 'Henry workspace preview mockup', pattern: 'CREATOR: HENRY' },
      { name: 'Trust Architecture Kicker', pattern: 'TRUST BEFORE VISIBILITY' },
      { name: 'Trust Architecture Headline', pattern: 'A project becomes stronger when people know who stands behind it' },
      { name: 'Starting State: Unverified', pattern: 'STARTING STATE' },
      { name: 'Trusted State: Verified', pattern: 'TRUSTED STATE' },
      { name: 'Equation Bar', pattern: 'TRUSTED CREATOR FOUNDATION' },
      { name: 'Step 01 Creator Profile Headline', pattern: 'Start with the person behind the project' },
      { name: 'Creator Profile Form: Henry Martin', pattern: 'Henry Martin' },
      { name: 'Creator Profile Form: Paris, France', pattern: 'Paris' },
      { name: 'Section 04 Contact Verification', pattern: 'Make sure Mondial can securely reach you' },
      { name: 'Email Verified flow', pattern: 'henry@example.com' },
      { name: 'Phone OTP box & timer', pattern: 'Code expires in:' },
      { name: 'Why this matters card', pattern: 'WHY THIS MATTERS' },
      { name: 'Section 05 Identity & Liveness Headline', pattern: 'Confirm the identity behind the Creator profile' },
      { name: 'Passport Received Mockup', pattern: 'DOCUMENT RECEIVED' },
      { name: 'Liveness Ready Mockup', pattern: 'Liveness Check' },
      { name: 'Confirmation Bar: Liveness Verified', pattern: 'LIVENESS VERIFIED' },
      { name: 'Section 06 Profile Readiness Headline', pattern: 'One place to see what still needs attention' },
      { name: 'Readiness 86% Panel', pattern: '86%' },
      { name: 'Profile Information 70% Detail', pattern: 'Current Completion: 70%' },
      { name: 'Section 07 Privacy & Control Headline', pattern: 'Verification should build trust without making everything public' },
      { name: 'Private Verification Data Column', pattern: 'PRIVATE VERIFICATION DATA' },
      { name: 'Public / Shared Context Column', pattern: 'Public / Shared Context' },
      { name: 'Creator Controls Column', pattern: 'Creator Controls' },
      { name: 'Banner: VERIFIED DOES NOT MEAN EVERYTHING IS PUBLIC', pattern: 'VERIFIED DOES NOT MEAN EVERYTHING IS PUBLIC' },
      { name: 'Section 08 Phase 01 Complete', pattern: 'You are verified. Now define what you are building' },
      { name: 'Next Page Preview: Project Identity & Concept', pattern: 'Project Identity &amp; Concept' },
      { name: 'Back to Creator Path Link -> /for-creators', pattern: 'href="/for-creators"' },
      { name: 'Next page route -> /for-creators/project-identity-concept', pattern: 'href="/for-creators/project-identity-concept"' },
      { name: 'Section 09 FAQ Headline', pattern: 'Questions before you MOVE FORWARD?' },
      { name: 'Public footer present', pattern: 'data-testid="public-footer"' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 35/35 CREATOR IDENTITY & VERIFICATION CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some verification checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyCreatorIdentity();
