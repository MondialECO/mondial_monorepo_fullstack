const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.cs')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('backend');
const collectionMap = new Map();

const regex1 = /GetCollection<([^>]+)>\(\s*"([^"]+)"/g;
const regex2 = /base\(\w+,\s*"([^"]+)"\)/g;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = regex1.exec(content)) !== null) {
    const model = m[1];
    const col = m[2];
    if (!collectionMap.has(col)) collectionMap.set(col, { col, model, files: new Set() });
    collectionMap.get(col).files.add(f.replace(/\\/g, '/'));
  }
  while ((m = regex2.exec(content)) !== null) {
    const col = m[1];
    if (!collectionMap.has(col)) collectionMap.set(col, { col, model: 'Unknown', files: new Set() });
    collectionMap.get(col).files.add(f.replace(/\\/g, '/'));
  }
});

const sorted = Array.from(collectionMap.keys()).sort();
console.log('TOTAL UNIQUE STRING LITERAL COLLECTIONS FOUND:', sorted.length);
sorted.forEach(c => {
  const info = collectionMap.get(c);
  console.log(JSON.stringify({
    collection: c,
    model: info.model,
    primaryFile: Array.from(info.files)[0],
    fileCount: info.files.size
  }));
});
