import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '56877:114549';

async function fetchFigmaNode() {
  console.log(`Fetching node ${NODE_ID} from file ${FILE_KEY}...`);
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}&depth=4`;
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch from Figma:', res.status, res.statusText);
    const errText = await res.text();
    console.error(errText);
    return;
  }

  const data = await res.json();
  fs.writeFileSync('scripts/figma_investor_pipeline_node.json', JSON.stringify(data, null, 2));
  console.log('Saved to scripts/figma_investor_pipeline_node.json');

  const documentNode = data.nodes[NODE_ID]?.document;
  if (!documentNode) {
    console.error('No document found for node ID', NODE_ID);
    return;
  }

  console.log(`Node Name: "${documentNode.name}", Type: ${documentNode.type}`);
  console.log(`Children count: ${documentNode.children?.length || 0}`);

  if (documentNode.children) {
    documentNode.children.forEach((c, idx) => {
      console.log(`Child [${idx}] ID: ${c.id}, Name: "${c.name}", Type: ${c.type}, Visible: ${c.visible !== false}`);
    });
  }
}

fetchFigmaNode();
