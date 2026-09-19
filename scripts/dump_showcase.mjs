import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_phase2_complete_57007_12780.json', 'utf8'));

function findNode(node, name) {
  if (node.name && node.name.includes(name)) return node;
  if (node.children) {
    for (const c of node.children) {
      const found = findNode(c, name);
      if (found) return found;
    }
  }
  return null;
}

function printNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const info = [
    node.type,
    `"${node.name}"`,
    node.characters ? `text="${node.characters}"` : '',
    node.layoutMode ? `layout=${node.layoutMode}` : '',
    node.itemSpacing !== undefined ? `gap=${node.itemSpacing}` : '',
    node.cornerRadius !== undefined ? `radius=${node.cornerRadius}` : '',
    node.style ? `font="${node.style.fontFamily} ${node.style.fontWeight} ${node.style.fontSize}px"` : '',
  ].filter(Boolean).join(' ');

  console.log(`${indent}${info}`);
  if (node.children) {
    for (const c of node.children) {
      printNode(c, depth + 1);
    }
  }
}

const root = Object.values(data.nodes)[0].document;
const showcase = findNode(root, "BRAND KIT SHOWCASE");
printNode(showcase);
