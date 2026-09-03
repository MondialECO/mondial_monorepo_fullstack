import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const MAIN_NODE_ID = '56877:91835';

async function fetchPositioningBranding() {
  console.log('Fetching Figma Positioning & Branding AST node 56877:91835...');
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${MAIN_NODE_ID}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch node:', res.status, res.statusText);
      return;
    }

    const data = await res.json();
    fs.writeFileSync('scripts/figma_positioning_branding_node.json', JSON.stringify(data, null, 2));
    console.log('✓ Successfully saved scripts/figma_positioning_branding_node.json');

    const doc = data.nodes[MAIN_NODE_ID]?.document;
    if (doc) {
      console.log(`Main Node: "${doc.name}" (${Math.round(doc.absoluteBoundingBox?.width || 0)}x${Math.round(doc.absoluteBoundingBox?.height || 0)})`);
      if (doc.children) {
        doc.children.forEach((c, idx) => {
          console.log(`  ${idx + 1}. [${c.id}] "${c.name}" (${Math.round(c.absoluteBoundingBox?.width || 0)}x${Math.round(c.absoluteBoundingBox?.height || 0)})`);
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Positioning & Branding:', err);
  }
}

fetchPositioningBranding();
