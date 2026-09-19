import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_market_study_node.json', 'utf8'));
const node = data.nodes['57078:11039'];

function dumpNode(n, depth = 0) {
  const indent = ' '.repeat(depth * 2);
  let info = `${indent}- [${n.type}] "${n.name}" (${n.id})`;
  if (n.characters) info += ` text: "${n.characters.replace(/\n/g, ' ')}"`;
  if (n.style) {
    info += ` font: ${n.style.fontFamily} ${n.style.fontWeight} ${n.style.fontSize}px`;
  }
  console.log(info);
  if (n.children) {
    for (const c of n.children) {
      dumpNode(c, depth + 1);
    }
  }
}

console.log('Frame Name:', node.document.name);
console.log('Bounding Box:', node.document.absoluteBoundingBox);
dumpNode(node.document);
