import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const PARENT_ID = '56939:79716';

async function fetchPricingParent() {
  console.log(`Fetching Pricing parent ${PARENT_ID} from file ${FILE_KEY}...`);
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(PARENT_ID)}&depth=4`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN },
  });

  if (!res.ok) {
    console.error('Failed to fetch:', res.status, res.statusText);
    return;
  }

  const data = await res.json();
  fs.writeFileSync('scripts/figma_pricing_parent.json', JSON.stringify(data, null, 2));
  console.log('Saved to scripts/figma_pricing_parent.json');

  const doc = data.nodes[PARENT_ID]?.document;
  if (!doc) {
    console.error('No doc found for parent');
    return;
  }
  console.log(`Parent Name: "${doc.name}", Type: ${doc.type}, Children: ${doc.children?.length}`);
  doc.children?.forEach((c, i) => {
    console.log(`[${i}] ID: ${c.id}, Name: "${c.name}", Type: ${c.type}, Y: ${c.absoluteBoundingBox?.y}, Height: ${c.absoluteBoundingBox?.height}`);
  });
}

fetchPricingParent();
