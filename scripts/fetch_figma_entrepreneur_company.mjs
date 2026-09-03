import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '56877:95645';

async function fetchFigmaNode() {
  console.log(`Fetching node ${NODE_ID} from file ${FILE_KEY}...`);
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  
  const res = await fetch(url, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch Figma node:', res.status, res.statusText);
    const text = await res.text();
    console.error(text);
    return;
  }

  const data = await res.json();
  fs.writeFileSync('scripts/figma_entrepreneur_company_node.json', JSON.stringify(data, null, 2));
  console.log('Saved node data to scripts/figma_entrepreneur_company_node.json');

  const doc = data.nodes[NODE_ID]?.document;
  if (doc) {
    console.log(`Document name: "${doc.name}", type: ${doc.type}, children count: ${doc.children?.length || 0}`);
    if (doc.children) {
      doc.children.forEach((c, idx) => {
        console.log(`  Child [${idx}] ID: ${c.id}, Name: "${c.name}", Type: ${c.type}, bounds: w=${c.absoluteBoundingBox?.width}, h=${c.absoluteBoundingBox?.height}`);
      });
    }
  }
}

fetchFigmaNode();
