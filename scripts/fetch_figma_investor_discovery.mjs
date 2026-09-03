import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '56877:111500';

async function fetchNode() {
  console.log(`Fetching node ${NODE_ID} from Figma file ${FILE_KEY}...`);
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!res.ok) {
    throw new Error(`Figma API returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  fs.writeFileSync('scripts/figma_investor_discovery_node.json', JSON.stringify(data, null, 2));
  console.log('Saved node data to scripts/figma_investor_discovery_node.json');

  const node = data.nodes[NODE_ID]?.document;
  if (!node) {
    console.error('Node not found in response');
    return;
  }

  console.log(`Node Name: "${node.name}", type: ${node.type}, children: ${node.children ? node.children.length : 0}`);
  if (node.children) {
    node.children.forEach((c, i) => {
      console.log(`Child ${i}: "${c.name}" (id: ${c.id}, type: ${c.type}, bounds: w:${c.absoluteBoundingBox?.width}, h:${c.absoluteBoundingBox?.height}, y:${c.absoluteBoundingBox?.y})`);
    });
  }
}

fetchNode().catch(console.error);
