import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const rootNode = Object.values(data.nodes)[0]?.document;

function traverse(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const type = node.type;
  const name = node.name;
  let text = '';
  if (type === 'TEXT') {
    text = ` "${node.characters}"`;
  }
  console.log(`${indent}- [${type}] ${name}${text}`);
  if (node.children) {
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }
}

if (rootNode) {
  console.log('Root Node Name:', rootNode.name, 'Type:', rootNode.type);
  traverse(rootNode);
} else {
  console.log('No root document found in JSON');
}
