import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/figma_creator_identity_nodes.json', 'utf8'));
const outDir = 'scripts/creator_identity_sections';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function inspectNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let lines = [];

  const textVal = node.characters ? ` -> "${node.characters.replace(/\n/g, '\\n')}"` : '';
  const font = node.style ? ` (font: ${node.style.fontFamily}, size: ${node.style.fontSize}, weight: ${node.style.fontWeight})` : '';
  const fills = node.fills && node.fills.length > 0 && node.fills[0].color ? ` (color: rgb(${Math.round(node.fills[0].color.r*255)}, ${Math.round(node.fills[0].color.g*255)}, ${Math.round(node.fills[0].color.b*255)}))` : '';

  lines.push(`${indent}[${node.type}] "${node.name}" (id: ${node.id}, w: ${Math.round(node.absoluteBoundingBox?.width || 0)}, h: ${Math.round(node.absoluteBoundingBox?.height || 0)})${textVal}${font}${fills}`);

  if (node.children) {
    for (const child of node.children) {
      lines = lines.concat(inspectNode(child, depth + 1));
    }
  }

  return lines;
}

for (const [nodeId, nodeObj] of Object.entries(data.nodes)) {
  const doc = nodeObj.document;
  if (!doc) continue;
  const lines = inspectNode(doc);
  const filename = `node_${nodeId.replace(':', '_')}_${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
  fs.writeFileSync(path.join(outDir, filename), lines.join('\n'));
  console.log(`Saved ${filename} (${lines.length} lines)`);
}
