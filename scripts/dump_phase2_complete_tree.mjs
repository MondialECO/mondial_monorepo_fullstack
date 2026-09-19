import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_phase2_complete_57007_12780.json', 'utf8'));

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const type = node.type;
  const name = node.name;
  let extra = '';
  if (node.characters) extra += ` characters="${node.characters}"`;
  if (node.layoutMode) extra += ` layout=${node.layoutMode}`;
  if (node.primaryAxisAlignItems) extra += ` align=${node.primaryAxisAlignItems}`;
  if (node.itemSpacing) extra += ` gap=${node.itemSpacing}`;
  if (node.paddingLeft) extra += ` p=[${node.paddingTop},${node.paddingRight},${node.paddingBottom},${node.paddingLeft}]`;
  if (node.style) {
    extra += ` font="${node.style.fontFamily} ${node.style.fontWeight} ${node.style.fontSize}px"`;
  }
  if (node.backgroundColor) {
    extra += ` bg=${JSON.stringify(node.backgroundColor)}`;
  }
  if (node.fills && node.fills.length) {
    const f = node.fills[0];
    if (f.color) extra += ` fill=${JSON.stringify(f.color)}`;
  }
  console.log(`${indent}- [${type}] "${name}"${extra}`);
  if (node.children) {
    for (const child of node.children) {
      dumpNode(child, depth + 1);
    }
  }
}

const root = Object.values(data.nodes)[0].document;
dumpNode(root);
