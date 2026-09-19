import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_logotype_node.json', 'utf8'));
const root = Object.values(raw.nodes)[0].document;

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let str = `${indent}${node.name} [${node.type}]`;
  if (node.characters) str += ` -> "${node.characters}"`;
  console.log(str);
  if (node.children) {
    for (const c of node.children) dumpNode(c, depth + 1);
  }
}

function findCards(node) {
  if (node.name && node.name.startsWith('CARD')) {
    console.log(`\n================== FULL DUMP FOR ${node.name} ==================`);
    dumpNode(node);
  } else if (node.children) {
    for (const c of node.children) findCards(c);
  }
}

findCards(root);
