import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_brand_kit_hub_57004_12057.json', 'utf-8'));

function printTopSections(node, depth = 0) {
  const indent = '  '.repeat(depth);
  if (depth <= 4) {
    const info = [
      node.name,
      `[${node.type}]`,
      node.characters ? `text="${node.characters.replace(/\n/g, ' ')}"` : '',
      node.absoluteBoundingBox ? `(${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)})` : ''
    ].filter(Boolean).join(' ');
    console.log(`${indent}- ${info}`);
  }
  if (node.children) {
    for (const child of node.children) {
      printTopSections(child, depth + 1);
    }
  }
}

const rootNode = Object.values(data.nodes)[0]?.document;
if (rootNode) {
  printTopSections(rootNode);
}
