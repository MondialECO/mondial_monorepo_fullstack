import fs from 'fs';

const secName = process.argv[2];
const fileMap = {
  'hero': 'deep_56781_3777.json',
  'value_types': 'deep_56784_3844.json',
  'creator': 'deep_56788_78191.json',
  'services': 'deep_56788_78371.json',
  'entrepreneur': 'deep_56788_78509.json',
  'profiles': 'deep_56788_78694.json',
  'discovery': 'deep_56788_78816.json',
  'access': 'deep_56788_78957.json',
  'routing': 'deep_56788_79161.json',
  'final': 'deep_56788_79734.json',
};

const filename = fileMap[secName] || secName;
const p = `scripts/marketplace_sections/${filename}`;
if (!fs.existsSync(p)) {
  console.log(`File not found: ${p}`);
  process.exit(1);
}

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

const data = JSON.parse(fs.readFileSync(p, 'utf8'));
const texts = extractText(data);
console.log(`=== ${secName} (${texts.length} texts) ===`);
texts.forEach((t, i) => console.log(`[${i}] [${t.name}]: ${t.text.replace(/\n/g, ' \\n ')}`));
