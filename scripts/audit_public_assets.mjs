import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git') continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      getFiles(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const publicFiles = getFiles('public');
const srcFiles = getFiles('src').filter((f) => /\.(tsx|ts|jsx|js|mjs|css|json)$/.test(f));

// Read all src files once
const srcContents = srcFiles.map((sf) => ({
  path: sf,
  content: fs.readFileSync(sf, 'utf8'),
}));

const results = [];

for (const pubFile of publicFiles) {
  const relPath = pubFile.replace(/\\/g, '/');
  const filename = path.basename(pubFile);
  const webPath = relPath.replace(/^public/, '');

  let refCount = 0;
  const matches = [];

  for (const sc of srcContents) {
    if (sc.content.includes(filename) || sc.content.includes(webPath) || sc.content.includes(relPath)) {
      refCount++;
      matches.push(sc.path);
    }
  }

  results.push({
    file: relPath,
    filename,
    refCount,
    matches,
  });
}

const kept = results.filter((r) => r.refCount > 0);
const unref = results.filter((r) => r.refCount === 0);

console.log(`Total public files: ${publicFiles.length}`);
console.log(`Referenced: ${kept.length}, Unreferenced: ${unref.length}`);
fs.writeFileSync('scripts/public_assets_audit.json', JSON.stringify({ kept, unref }, null, 2));
