import fs from 'fs';

const files = fs.readdirSync('scripts/investor_pipeline_sections');

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

files.forEach(f => {
  if (!f.endsWith('.json')) return;
  const data = JSON.parse(fs.readFileSync(`scripts/investor_pipeline_sections/${f}`, 'utf8'));
  const texts = extractText(data);
  console.log(`\n=================== ${f} (Total texts: ${texts.length}) ===================`);
  texts.slice(0, 15).forEach(t => console.log(`  [${t.name}]: ${t.text.replace(/\n/g, ' ')}`));
});
