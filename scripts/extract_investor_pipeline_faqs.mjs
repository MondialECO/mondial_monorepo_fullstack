import fs from 'fs';

const faqSec = JSON.parse(fs.readFileSync('scripts/investor_pipeline_sections/sec_10_56877_116117.json', 'utf8'));

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

const allTexts = extractText(faqSec);
console.log('=== FAQ TEXTS ===');
allTexts.forEach(t => console.log(`[${t.name}]: ${t.text}`));
