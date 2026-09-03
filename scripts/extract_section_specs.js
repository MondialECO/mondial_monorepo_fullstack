import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_homepage_node_data.json', 'utf8'));
const rootNode = Object.values(data.nodes)[0].document;

const children = [...rootNode.children];
children.sort((a, b) => (a.absoluteBoundingBox?.y ?? 0) - (b.absoluteBoundingBox?.y ?? 0));

// Filter out 0-height lines
const sections = children.filter(c => (c.absoluteBoundingBox?.height ?? 0) > 30);

console.log(`Found ${sections.length} major sections:\n`);

sections.forEach((sec, idx) => {
  console.log(`\n======================================================`);
  console.log(`SECTION ${idx + 1}: ${sec.name} (${Math.round(sec.absoluteBoundingBox.width)}x${Math.round(sec.absoluteBoundingBox.height)})`);
  console.log(`Background / Fills:`, JSON.stringify(sec.fills?.map(f => f.color || f.type)));
  console.log(`Layout: ${sec.layoutMode}, Gap: ${sec.itemSpacing}, Padding: ${sec.paddingTop}/${sec.paddingRight}/${sec.paddingBottom}/${sec.paddingLeft}`);
  console.log(`======================================================`);

  function dump(node, depth = 0) {
    const indent = '  '.repeat(depth);
    const box = node.absoluteBoundingBox ? `${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}` : '';
    const text = node.characters ? ` | TEXT: "${node.characters.replace(/\n/g, ' ')}"` : '';
    const style = node.style ? ` [${node.style.fontFamily} ${node.style.fontWeight} ${node.style.fontSize}px/${node.style.lineHeightPx}px]` : '';
    const fills = node.fills && node.fills.length ? ` (Color: ${JSON.stringify(node.fills[0].color || node.fills[0].type)})` : '';
    const border = node.strokes && node.strokes.length ? ` (Stroke: ${JSON.stringify(node.strokes[0].color)})` : '';
    const radius = node.cornerRadius ? ` (Radius: ${node.cornerRadius})` : '';
    
    console.log(`${indent}• ${node.name} (${node.type} ${box})${style}${fills}${border}${radius}${text}`);
    
    if (node.children) {
      node.children.forEach(c => dump(c, depth + 1));
    }
  }

  dump(sec);
});
