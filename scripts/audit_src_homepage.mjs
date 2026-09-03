import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git') continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      getFiles(full, files);
    } else if (/\.(tsx|ts|jsx|js|mjs|css|json)$/.test(full)) {
      files.push(full);
    }
  }
  return files;
}

const srcFiles = getFiles('src');

const candidateFiles = [
  'HeroSection.tsx',
  'AllProfileSection.tsx',
  'TrustedPartners.tsx',
  'rolesSection.tsx',
  'FeaturesSection.tsx',
  'FeaturesSection2.tsx',
  'Pricing.tsx',
  'ImpactSection.tsx',
  'FAQ.tsx',
  'profiles.tsx',
];

const candidateDir = 'src/components/homepage';

const results = {};

for (const cf of candidateFiles) {
  const name = cf.replace(/\.tsx$/, '').replace(/\.ts$/, '');
  const refs = [];

  for (const f of srcFiles) {
    if (f.replace(/\\/g, '/') === `${candidateDir}/${cf}`) continue;
    const content = fs.readFileSync(f, 'utf8');

    // Check direct import path
    const hasPathImport =
      content.includes(`components/homepage/${name}`) ||
      content.includes(`components/homepage/${cf}`) ||
      content.includes(`./${name}`) ||
      content.includes(`./${cf}`);

    // Check JSX usage
    const hasJsx = new RegExp(`<${name}\\b`).test(content);

    if (hasPathImport || hasJsx) {
      refs.push({
        file: f,
        hasPathImport,
        hasJsx,
      });
    }
  }

  results[cf] = {
    name,
    refCount: refs.length,
    refs,
  };
}

// Also check profileCard directory
const profileCardFiles = fs.existsSync('src/components/homepage/profileCard')
  ? fs.readdirSync('src/components/homepage/profileCard')
  : [];

const profileCardRefs = [];
for (const f of srcFiles) {
  if (f.replace(/\\/g, '/').includes('src/components/homepage/profileCard')) continue;
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('homepage/profileCard') || content.includes('profileCard')) {
    profileCardRefs.push(f);
  }
}

results['profileCard/'] = {
  name: 'profileCard',
  files: profileCardFiles,
  refCount: profileCardRefs.length,
  refs: profileCardRefs,
};

console.log(JSON.stringify(results, null, 2));
fs.writeFileSync('scripts/src_homepage_audit.json', JSON.stringify(results, null, 2));
