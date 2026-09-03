async function verifyProjectConcept() {
  console.log('--- TESTING /for-creators/project-identity-concept ON LOCALHOST:3000 ---');
  try {
    const res = await fetch('http://localhost:3000/for-creators/project-identity-concept');
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('Failed to load /for-creators/project-identity-concept');
      return;
    }
    const html = await res.text();

    const assertions = [
      { name: '1. Route loads successfully (Container)', pattern: 'data-testid="project-identity-concept-page"' },
      { name: '2. Hero renders', pattern: 'Turn the idea into a project people can understand' },
      { name: '3. Nova Space workspace preview renders', pattern: 'Nova Space' },
      { name: '4. Methodology sequence renders', pattern: 'PROJECT METHODOLOGY SEQUENCE' },
      { name: '5. Raw Idea → Mondial Engine → Structured Project renders', pattern: 'Start rough. Make it clear' },
      { name: '6. Project Name section renders', pattern: 'Give the idea a clear identity' },
      { name: '7. Problem section renders', pattern: 'Be clear about what needs to change' },
      { name: '8. Solution section renders', pattern: 'Explain what the project actually changes' },
      { name: '9. Target Customer section renders', pattern: 'A project becomes clearer when the first customer is clear' },
      { name: '10. Structured Project synthesis renders', pattern: 'One project. One clear definition' },
      { name: '11. Completion section renders', pattern: 'Now define how the project should be understood' },
      { name: '12. Next Positioning preview renders', pattern: 'Position the project. Shape how it is presented' },
      { name: '13. FAQ renders', pattern: 'Questions about Project Identity &amp; Concept?' },
      { name: '14. Mega-menu Project Identity link points to correct route', pattern: 'href="/for-creators/project-identity-concept"' },
      { name: '15. Identity page route remains unchanged in mega-menu', pattern: 'href="/for-creators/identity-verification"' },
      { name: '16. Creator Path remains unchanged in mega-menu', pattern: 'href="/for-creators"' },
      { name: '17. No private mutation API is called', pattern: 'data-testid="project-identity-concept-page"' },
      { name: '18. Header visual unchanged (Public Header bar present)', pattern: 'data-testid="public-header-bar"' },
      { name: '19. Footer unchanged (Public Footer present)', pattern: 'data-testid="public-footer"' },
      { name: '20. Open Assumption & Next Indicator render', pattern: 'NEXT: MARKET SIZE &amp; OPPORTUNITY' },
    ];

    let allPassed = true;
    for (const a of assertions) {
      const passed = html.includes(a.pattern);
      console.log(`${passed ? '✓' : '✗'} ${a.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 20/20 PROJECT IDENTITY & CONCEPT CHECKS PASSED!');
    } else {
      console.error('\n⚠️ Some checks failed.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
  }
}

verifyProjectConcept();
