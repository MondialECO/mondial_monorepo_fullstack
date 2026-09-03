import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_IDS = [
  '56781:3777',
  '56784:3844',
  '56788:78191',
  '56788:78371',
  '56788:78509',
  '56788:78694',
  '56788:78816',
  '56788:78957',
  '56788:79161',
  '56788:79734',
];

fs.mkdirSync('scripts/marketplace_sections', { recursive: true });

async function fetchSections() {
  console.log('Fetching deep sections from Figma...');
  for (let i = 0; i < NODE_IDS.length; i += 2) {
    const batch = NODE_IDS.slice(i, i + 2);
    const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${batch.map(encodeURIComponent).join(',')}&depth=10`;
    console.log(`Fetching batch ${i / 2 + 1}...`);
    const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
    if (!res.ok) {
      console.error('Batch failed:', res.status, res.statusText);
      continue;
    }
    const data = await res.json();
    for (const [id, val] of Object.entries(data.nodes)) {
      const sanitized = id.replace(':', '_');
      fs.writeFileSync(`scripts/marketplace_sections/deep_${sanitized}.json`, JSON.stringify(val.document, null, 2));
      console.log(`Saved deep_${sanitized}.json`);
    }
  }
}

fetchSections();
