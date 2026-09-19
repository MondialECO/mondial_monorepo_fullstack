import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_logotype_node.json', 'utf8'));
const root = Object.values(raw.nodes)[0].document;

function findFooter(node) {
  if (node.name && (node.name.toLowerCase().includes('footer') || node.name.toLowerCase().includes('action') || node.name.toLowerCase().includes('button'))) {
    console.log(`FOUND: ${node.name} [${node.type}]`);
    if (node.characters) console.log(`  -> "${node.characters}"`);
  }
  if (node.children) {
    for (const c of node.children) findFooter(c);
  }
}

console.log('=== SEARCHING FOOTER IN FIGMA NODE ===');
findFooter(root);
