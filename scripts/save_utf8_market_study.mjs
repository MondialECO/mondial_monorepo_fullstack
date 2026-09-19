import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_market_study_node.json', 'utf8'));
const node = data.nodes['57078:11039'];

const lines = [];

function dumpNode(n, depth = 0) {
  const indent = ' '.repeat(depth * 2);
  let info = `${indent}- [${n.type}] "${n.name}" (${n.id})`;
  if (n.characters) info += ` text: "${n.characters.replace(/\n/g, ' ')}"`;
  if (n.style) {
    info += ` font: ${n.style.fontFamily} ${n.style.fontWeight} ${n.style.fontSize}px`;
  }
  lines.push(info);
  if (n.children) {
    for (const c of n.children) {
      dumpNode(c, depth + 1);
    }
  }
}

lines.push(`Frame Name: ${node.document.name}`);
lines.push(`Bounding Box: ${JSON.stringify(node.document.absoluteBoundingBox)}`);
dumpNode(node.document);

fs.writeFileSync('scripts/market_study_ast_utf8.txt', lines.join('\n'), 'utf8');
console.log('✓ Wrote scripts/market_study_ast_utf8.txt');
