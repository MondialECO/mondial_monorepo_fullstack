import fs from 'fs';

const files = fs.readdirSync('scripts/investor_pipeline_sections').filter(f => f.startsWith('deep_'));

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
  const data = JSON.parse(fs.readFileSync(`scripts/investor_pipeline_sections/${f}`, 'utf8'));
  const texts = extractText(data);
  console.log(`\n=================== ${f} (${texts.length} texts) ===================`);
  texts.forEach(t => console.log(`  [${t.name}]: ${t.text.replace(/\n/g, ' ')}`));
});
