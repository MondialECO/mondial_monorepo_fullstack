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

let out = '';
files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(`scripts/investor_pipeline_sections/${f}`, 'utf8'));
  const texts = extractText(data);
  out += `\n=================== ${f} (${texts.length} texts) ===================\n`;
  texts.forEach(t => {
    out += `  [${t.name}]: ${t.text.replace(/\n/g, ' ')}\n`;
  });
});

fs.writeFileSync('scripts/pipeline_all_texts.txt', out, 'utf8');
console.log('Saved properly formatted scripts/pipeline_all_texts.txt');
