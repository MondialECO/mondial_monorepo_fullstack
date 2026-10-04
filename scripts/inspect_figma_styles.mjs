import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_node_57000_9634.json', 'utf-8'));
const doc = raw.nodes['57000:9634']?.document;

function inspectStyles(node) {
  if (node.name === 'Frame 2147228950' || node.name === 'Frame' && node.absoluteBoundingBox?.width === 300) {
    console.log(`\n=== CARD: ${node.name} (${Math.round(node.absoluteBoundingBox.width)}x${Math.round(node.absoluteBoundingBox.height)}) ===`);
    console.log('Corner radius:', node.cornerRadius);
    console.log('Fills:', JSON.stringify(node.fills));
    console.log('Strokes:', JSON.stringify(node.strokes));
    console.log('Effects (shadow):', JSON.stringify(node.effects));
    console.log('Padding:', node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft);
    console.log('Item spacing:', node.itemSpacing);
  }

  if (node.name === 'Frame 2147228953') {
    console.log(`\n=== TRANSCRIPT CONTAINER: ${node.name} ===`);
    console.log('Corner radius:', node.cornerRadius);
    console.log('Fills:', JSON.stringify(node.fills));
    console.log('Strokes:', JSON.stringify(node.strokes));
    console.log('Padding:', node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft);
    console.log('Item spacing:', node.itemSpacing);
  }

  if (node.name === 'Input body') {
    console.log(`\n=== INPUT BODY: ${node.name} ===`);
    console.log('Corner radius:', node.cornerRadius);
    console.log('Fills:', JSON.stringify(node.fills));
    console.log('Strokes:', JSON.stringify(node.strokes));
    console.log('Padding:', node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft);
  }

  if (node.children) {
    for (const c of node.children) inspectStyles(c);
  }
}

inspectStyles(doc);
