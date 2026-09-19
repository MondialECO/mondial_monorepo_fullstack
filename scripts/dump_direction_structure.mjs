import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_direction_node.json', 'utf8'));
const root = data.nodes['57012:9066']?.document;

function extractAll(node) {
  let list = [];
  if (node.characters) {
    list.push({
      name: node.name,
      text: node.characters,
      fontName: node.style?.fontFamily,
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
    });
  }
  if (node.children) {
    for (const child of node.children) {
      list.push(...extractAll(child));
    }
  }
  return list;
}

const allTexts = extractAll(root);
console.log('=== ALL TEXTS IN DIRECTION NODE ===');
console.log(JSON.stringify(allTexts, null, 2));

// Look at card 3 and card 4 bodies, footer, etc.
function printCard(node, name) {
  console.log(`\n=== DETAIL: ${name} ===`);
  console.log(JSON.stringify(extractAll(node), null, 2));
}

function findNodeByName(node, target) {
  if (node.name && node.name.includes(target)) return node;
  if (node.children) {
    for (const child of node.children) {
      const res = findNodeByName(child, target);
      if (res) return res;
    }
  }
  return null;
}

const card3 = findNodeByName(root, 'CARD 3');
if (card3) printCard(card3, 'CARD 3');

const card4 = findNodeByName(root, 'CARD 4');
if (card4) printCard(card4, 'CARD 4');

const footer = findNodeByName(root, '4. STICKY FOOTER') || findNodeByName(root, 'FOOTER');
if (footer) printCard(footer, 'FOOTER');
