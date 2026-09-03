import { ROLE_MEGA_MENUS } from '../src/components/shared/PublicHeader.js';

function testPublicHeaderConfig() {
  console.log('Testing PublicHeader ROLE_MEGA_MENUS configuration...');
  const creators = ROLE_MEGA_MENUS.creators;
  console.log('Creator Menu Cards:');
  creators.cards.forEach((c, idx) => {
    console.log(`  ${idx + 1}. [${c.title}] -> href: "${c.href}", ctaText: "${c.ctaText}"`);
  });

  const assertions = [
    { name: 'Card 1: Creator Path -> /for-creators', pass: creators.cards[0].href === '/for-creators' },
    { name: 'Card 2: Identity & Verification -> /for-creators/identity-verification', pass: creators.cards[1].href === '/for-creators/identity-verification' },
    { name: 'Card 3: Project Identity & Concept -> /for-creators/project-identity-concept', pass: creators.cards[2].href === '/for-creators/project-identity-concept' },
    { name: 'Card 3: CTA is Project Identity', pass: creators.cards[2].ctaText === 'Project Identity' },
    { name: 'Card 4: Positioning & Branding -> /for-creators', pass: creators.cards[3].href === '/for-creators' },
  ];

  let allPass = true;
  assertions.forEach((a) => {
    console.log(`${a.pass ? '✓' : '✗'} ${a.name}`);
    if (!a.pass) allPass = false;
  });

  if (allPass) {
    console.log('\n🎉 ALL PublicHeader CREATOR MEGA MENU CONFIG ASSERTIONS PASSED!');
  } else {
    console.error('\n⚠️ Some configuration checks failed.');
  }
}

// Since PublicHeader is TSX with Lucide imports, we can verify via script reading or dynamic check
