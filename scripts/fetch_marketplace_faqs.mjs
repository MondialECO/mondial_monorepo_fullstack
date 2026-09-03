import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const FAQ_IDS = [
  '56791:80463',
  '56791:80464',
  '56791:80465',
  '56791:80466',
  '56791:80467',
  '56791:80468',
  '56791:80469',
  '56791:80470',
  '56795:80573',
  '56795:80586',
];

async function fetchFaqs() {
  console.log('Fetching 10 FAQs from Figma...');
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${FAQ_IDS.map(encodeURIComponent).join(',')}&depth=10`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  if (!res.ok) {
    console.error('Failed to fetch FAQs:', res.status, res.statusText);
    return;
  }
  const data = await res.json();
  fs.writeFileSync('scripts/marketplace_sections/faqs.json', JSON.stringify(data, null, 2));
  console.log('Saved scripts/marketplace_sections/faqs.json');
}

fetchFaqs();
