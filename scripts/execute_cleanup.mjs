import fs from 'fs';
import path from 'path';

const filesToDelete = [
  'src/components/homepage/HeroSection.tsx',
  'src/components/homepage/AllProfileSection.tsx',
  'src/components/homepage/TrustedPartners.tsx',
  'src/components/homepage/rolesSection.tsx',
  'src/components/homepage/FeaturesSection.tsx',
  'src/components/homepage/FeaturesSection2.tsx',
  'src/components/homepage/Pricing.tsx',
  'src/components/homepage/ImpactSection.tsx',
  'src/components/homepage/FAQ.tsx',
  'src/components/homepage/profiles.tsx',
  'src/components/homepage/profileCard/ProfileCard.tsx',
];

const dirsToDelete = [
  'src/components/homepage/profileCard',
];

const assetsToDelete = [
  'public/dashboard-mockup.png',
  'public/blob-left.png',
  'public/blob-right.png',
  'public/logos/astar.svg',
  'public/logos/calamari.svg',
  'public/logos/chainlink.svg',
  'public/logos/composable.svg',
  'public/logos/fusotao.svg',
  'public/logos/hive.svg',
  'public/logos/kintsugi.svg',
  'public/logos/loom.svg',
  'public/logos/polkadex.svg',
  'public/logos/polkadot.svg',
];

for (const f of filesToDelete) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`Deleted file: ${f}`);
  }
}

for (const d of dirsToDelete) {
  if (fs.existsSync(d)) {
    fs.rmdirSync(d);
    console.log(`Deleted dir: ${d}`);
  }
}

for (const a of assetsToDelete) {
  if (fs.existsSync(a)) {
    fs.unlinkSync(a);
    console.log(`Deleted asset: ${a}`);
  }
}

// Remove public/logos directory if empty
if (fs.existsSync('public/logos') && fs.readdirSync('public/logos').length === 0) {
  fs.rmdirSync('public/logos');
  console.log('Deleted empty dir: public/logos');
}

console.log('Cleanup script completed.');
