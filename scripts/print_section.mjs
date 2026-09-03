import fs from 'fs';

const secId = process.argv[2] || '114550';
const data = JSON.parse(fs.readFileSync(`scripts/investor_pipeline_sections/deep_56877_${secId}.json`, 'utf8'));

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

const texts = extractText(data);
console.log(`=== Texts for 56877:${secId} (${texts.length}) ===`);
texts.forEach((t, i) => console.log(`[${i}] [${t.name}]: ${t.text.replace(/\n/g, ' \\n ')}`));
