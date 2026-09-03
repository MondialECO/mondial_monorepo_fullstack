import fs from 'fs';
import path from 'path';

const candidates = [
  'HeroSection',
  'AllProfileSection',
  'TrustedPartners',
  'rolesSection',
  'RolesSection',
  'FeaturesSection',
  'FeaturesSection2',
  'Pricing',
  'ImpactSection',
  'FAQ',
  'profiles',
  'profileCard',
];

const candidateFiles = [
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
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (
        fullPath.endsWith('.ts') ||
        fullPath.endsWith('.tsx') ||
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.mjs') ||
        fullPath.endsWith('.jsx') ||
        fullPath.endsWith('.json')
      ) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

const allProjectFiles = getAllFiles('.');

console.log(`Total scanned files: ${allProjectFiles.length}`);

const report = [];

for (const cand of candidates) {
  const references = [];
  const regex = new RegExp(`\\b${cand}\\b`, 'g');

  for (const f of allProjectFiles) {
    // Skip scripts/ or the candidate file itself
    if (f.startsWith('scripts')) continue;
    if (f.includes(`src/components/homepage/${cand}`)) continue;

    const content = fs.readFileSync(f, 'utf8');
    if (regex.test(content)) {
      references.push(f);
    }
  }

  report.push({
    candidate: cand,
    refCount: references.length,
    references,
  });
}

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('scripts/legacy_cleanup_audit.json', JSON.stringify(report, null, 2));
