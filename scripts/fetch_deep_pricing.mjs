import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_IDS = ['56939:79254', '56939:79428'];

fs.mkdirSync('scripts/pricing_sections', { recursive: true });

async function fetchDeepPricing() {
  console.log('Fetching deep pricing sections from Figma...');
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${NODE_IDS.map(encodeURIComponent).join(',')}&depth=10`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  if (!res.ok) {
    console.error('Failed to fetch deep pricing:', res.status, res.statusText);
    return;
  }
  const data = await res.json();
  for (const [id, val] of Object.entries(data.nodes)) {
    const sanitized = id.replace(':', '_');
    fs.writeFileSync(`scripts/pricing_sections/deep_${sanitized}.json`, JSON.stringify(val.document, null, 2));
    console.log(`Saved deep_${sanitized}.json`);
  }
}

fetchDeepPricing();
