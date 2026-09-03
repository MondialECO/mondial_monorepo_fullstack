import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_IDS = [
  '56877:114550',
  '56877:114734',
  '56877:114838',
  '56877:114988',
  '56877:115155',
  '56877:115301',
  '56877:115424',
  '56877:115612',
  '56877:115782',
  '56877:115923',
  '56877:116117',
  '56877:116071',
];

async function fetchSections() {
  console.log('Fetching deep sections from Figma...');
  // Fetch in batches of 4 to keep URL and payload sizes manageable
  for (let i = 0; i < NODE_IDS.length; i += 4) {
    const batch = NODE_IDS.slice(i, i + 4);
    const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${batch.map(encodeURIComponent).join(',')}&depth=10`;
    console.log(`Fetching batch ${i / 4 + 1}...`);
    const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
    if (!res.ok) {
      console.error('Batch failed:', res.status, res.statusText);
      continue;
    }
    const data = await res.json();
    for (const [id, val] of Object.entries(data.nodes)) {
      const sanitized = id.replace(':', '_');
      fs.writeFileSync(`scripts/investor_pipeline_sections/deep_${sanitized}.json`, JSON.stringify(val.document, null, 2));
      console.log(`Saved deep_${sanitized}.json`);
    }
  }
}

fetchSections();
