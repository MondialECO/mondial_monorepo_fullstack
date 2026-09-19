import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_business_model_node.json', 'utf8'));
const root = data.nodes['57079:11396'].document;

const lines = [];

function walk(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let extra = '';
  if (node.type === 'TEXT') {
    extra = ` "${node.characters}" [font: ${node.style?.fontFamily} ${node.style?.fontWeight} ${node.style?.fontSize}px, color: ${JSON.stringify(node.fills?.[0]?.color)}]`;
  } else if (node.layoutMode) {
    extra = ` [layout: ${node.layoutMode}, pad: ${node.paddingTop}/${node.paddingRight}/${node.paddingBottom}/${node.paddingLeft}, gap: ${node.itemSpacing}, bg: ${JSON.stringify(node.fills?.[0]?.color)}]`;
  }
  lines.push(`${indent}- [${node.type}] ${node.name}${extra}`);
  if (node.children) {
    for (const c of node.children) {
      walk(c, depth + 1);
    }
  }
}

lines.push(`=== ROOT: ${root.name} (${root.type}) ===`);
walk(root);

fs.writeFileSync('scripts/bm_ast_utf8.txt', lines.join('\n'), 'utf8');
console.log('Saved scripts/bm_ast_utf8.txt');
