import fs from 'fs';

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

const files = [
  'deep_56781_3777.json',
  'deep_56784_3844.json',
  'deep_56788_78191.json',
  'deep_56788_78371.json',
  'deep_56788_78509.json',
  'deep_56788_78694.json',
  'deep_56788_78816.json',
  'deep_56788_78957.json',
  'deep_56788_79161.json',
  'deep_56788_79734.json',
];

let out = '';
files.forEach(f => {
  const p = `scripts/marketplace_sections/${f}`;
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const texts = extractText(data);
  out += `\n=================== ${f} (${texts.length} texts) ===================\n`;
  texts.forEach((t, i) => {
    out += `  [${i}][${t.name}]: ${t.text.replace(/\n/g, ' \\n ')}\n`;
  });
});

// Also FAQs
if (fs.existsSync('scripts/marketplace_sections/faqs.json')) {
  const faqsData = JSON.parse(fs.readFileSync('scripts/marketplace_sections/faqs.json', 'utf8'));
  out += `\n=================== 10 FAQS ===================\n`;
  for (const [id, val] of Object.entries(faqsData.nodes)) {
    const texts = extractText(val.document);
    out += `--- FAQ ${id} ---\n`;
    texts.forEach(t => {
      out += `  [${t.name}]: ${t.text.replace(/\n/g, ' \\n ')}\n`;
    });
  }
}

fs.writeFileSync('scripts/marketplace_all_texts.txt', out, 'utf8');
console.log('Saved scripts/marketplace_all_texts.txt');
