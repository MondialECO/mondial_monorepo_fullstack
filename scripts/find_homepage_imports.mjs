import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git') continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      getFiles(full, files);
    } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(full)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = getFiles('src');

const importsFromHomepage = [];

for (const f of allFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, lineNo) => {
    if (line.includes('components/homepage')) {
      importsFromHomepage.push({
        file: f,
        lineNo: lineNo + 1,
        line: line.trim(),
      });
    }
  });
}

console.log('ALL IMPORTS FROM components/homepage IN src/:');
console.log(JSON.stringify(importsFromHomepage, null, 2));
