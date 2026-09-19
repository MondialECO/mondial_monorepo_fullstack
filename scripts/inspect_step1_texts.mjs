import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const doc = Object.values(data.nodes)[0]?.document;

function printTexts(node, path = '') {
  const currentPath = path ? `${path} > ${node.name}` : node.name;
  if (node.type === 'TEXT') {
    console.log(`[TEXT] ${currentPath}: "${node.characters}" (font: ${node.style?.fontFamily} ${node.style?.fontWeight} ${node.style?.fontSize}px)`);
  }
  if (node.children) {
    for (const child of node.children) {
      printTexts(child, currentPath);
    }
  }
}

console.log('=== ALL TEXT ELEMENTS IN NODE 57003:9780 ===');
printTexts(doc);
