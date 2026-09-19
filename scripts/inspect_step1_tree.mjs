import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const doc = Object.values(data.nodes)[0]?.document;

function printStructure(node, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${node.name} (${node.type})`);
  if (node.children) {
    for (const child of node.children) {
      printStructure(child, depth + 1);
    }
  }
}

printStructure(doc);
