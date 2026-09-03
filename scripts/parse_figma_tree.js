import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_node_data.json', 'utf8'));

function walk(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const name = node.name;
  const type = node.type;
  const chars = node.characters ? ` -> "${node.characters.replace(/\n/g, ' ')}"` : '';
  const layout = node.layoutMode ? `[${node.layoutMode}, gap: ${node.itemSpacing}, pad: ${node.paddingTop}/${node.paddingRight}/${node.paddingBottom}/${node.paddingLeft}]` : '';
  const bounds = node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}` : '';
  const style = node.style ? `[Font: ${node.style.fontFamily} ${node.style.fontWeight} ${node.style.fontSize}px/${node.style.lineHeightPx}px]` : '';
  const fills = node.fills && node.fills.length ? `[Color: ${JSON.stringify(node.fills[0].color)}]` : '';
  
  console.log(`${indent}${name} (${type}, ${bounds}) ${layout} ${style} ${fills} ${chars}`);
  
  if (node.children) {
    node.children.forEach(c => walk(c, depth + 1));
  }
}

const rootNode = Object.values(data.nodes)[0].document;
console.log('=== ROOT FOOTER NODE ===');
console.log('Name:', rootNode.name);
console.log('Type:', rootNode.type);
console.log('BoundingBox:', rootNode.absoluteBoundingBox);
console.log('Fills:', JSON.stringify(rootNode.fills));
console.log('Padding:', `T: ${rootNode.paddingTop}, R: ${rootNode.paddingRight}, B: ${rootNode.paddingBottom}, L: ${rootNode.paddingLeft}`);
console.log('Item Spacing (gap):', rootNode.itemSpacing);
console.log('Layout Mode:', rootNode.layoutMode);
console.log('\n=== COMPLETE TREE HIERARCHY ===\n');
walk(rootNode);
