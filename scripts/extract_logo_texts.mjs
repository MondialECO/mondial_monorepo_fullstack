import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_logo_node.json', 'utf8'));
const root = Object.values(raw.nodes)[0].document;

function extractAll(node) {
  let results = [];
  if (node.characters) {
    results.push({ name: node.name, text: node.characters });
  }
  if (node.children) {
    for (const child of node.children) {
      results = results.concat(extractAll(child));
    }
  }
  return results;
}

console.log(JSON.stringify(extractAll(root), null, 2));
