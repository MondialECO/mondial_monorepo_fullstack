import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_header_nodes.json', 'utf8'));

function extractTextAndStyles(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let result = [];
  
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    box: node.absoluteBoundingBox,
    fills: node.fills,
    strokes: node.strokes,
    cornerRadius: node.cornerRadius,
    itemSpacing: node.itemSpacing,
    padding: {
      left: node.paddingLeft,
      right: node.paddingRight,
      top: node.paddingTop,
      bottom: node.paddingBottom,
    }
  };

  if (node.type === 'TEXT') {
    info.characters = node.characters;
    info.style = node.style;
    result.push(`${indent}[TEXT] "${node.characters}" (fontSize: ${node.style?.fontSize}, fontWeight: ${node.style?.fontWeight}, font: ${node.style?.fontFamily})`);
  } else {
    result.push(`${indent}[${node.type}] "${node.name}" (id: ${node.id}, w: ${node.absoluteBoundingBox?.width}, h: ${node.absoluteBoundingBox?.height})`);
  }

  if (node.children) {
    for (const child of node.children) {
      result = result.concat(extractTextAndStyles(child, depth + 1));
    }
  }

  return result;
}

for (const [nodeId, nodeObj] of Object.entries(data.nodes)) {
  console.log(`\n================= NODE: ${nodeId} (${nodeObj?.document?.name}) =================`);
  const lines = extractTextAndStyles(nodeObj.document);
  fs.writeFileSync(`scripts/header_node_${nodeId.replace(':', '_')}.txt`, lines.join('\n'));
  console.log(`Saved scripts/header_node_${nodeId.replace(':', '_')}.txt (${lines.length} elements)`);
}
