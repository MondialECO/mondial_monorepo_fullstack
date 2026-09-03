import fs from 'fs';

function verifyHeaderSource() {
  const content = fs.readFileSync('src/components/shared/PublicHeader.tsx', 'utf8');

  const tests = [
    {
      name: 'Card 1: Creator Path -> /for-creators',
      pass: content.includes("title: 'Creator Path'") && content.includes("href: '/for-creators'"),
    },
    {
      name: 'Card 2: Identity & Verification -> /for-creators/identity-verification',
      pass: content.includes("title: 'Identity & Verification'") && content.includes("href: '/for-creators/identity-verification'"),
    },
    {
      name: 'Card 3: Project Identity & Concept -> /for-creators/project-identity-concept',
      pass: content.includes("title: 'Project Identity & Concept'") && content.includes("href: '/for-creators/project-identity-concept'"),
    },
    {
      name: 'Card 3 CTA: Project Identity',
      pass: content.includes("ctaText: 'Project Identity'"),
    },
  ];

  console.log('--- VERIFYING PublicHeader.tsx SOURCE CODE CONFIG ---');
  let allPass = true;
  tests.forEach((t) => {
    console.log(`${t.pass ? '✓' : '✗'} ${t.name}: ${t.pass ? 'PASS' : 'FAIL'}`);
    if (!t.pass) allPass = false;
  });

  if (allPass) {
    console.log('\n🎉 ALL PUBLIC HEADER MEGA-MENU CONFIG CHECKS PASSED!');
  } else {
    console.error('\n⚠️ Header config check failed.');
  }
}

verifyHeaderSource();
