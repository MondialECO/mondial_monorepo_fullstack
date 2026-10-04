import fs from 'fs';

let figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || '';
if (!figmaToken && fs.existsSync('.env.local')) {
  const envLocal = fs.readFileSync('.env.local', 'utf-8');
  const match = envLocal.match(/FIGMA_ACCESS_TOKEN=(.+)/) || envLocal.match(/FIGMA_TOKEN=(.+)/);
  if (match) figmaToken = match[1].trim().replace(/^["']|["']$/g, '');
}

const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '57000:9634';

async function main() {
  console.log('Figma token present:', !!figmaToken);
  if (!figmaToken) {
    console.error('No Figma token found');
    return;
  }
  
  console.log(`Fetching node ${NODE_ID}...`);
  const nodeUrl = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  const res = await fetch(nodeUrl, {
    headers: { 'X-Figma-Token': figmaToken }
  });
  
  if (!res.ok) {
    console.error('Fetch failed:', res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  fs.writeFileSync('scripts/figma_node_57000_9634.json', JSON.stringify(data, null, 2));
  console.log('✓ Saved scripts/figma_node_57000_9634.json');

  const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(NODE_ID)}&scale=2&format=png`;
  const imgRes = await fetch(imgUrl, {
    headers: { 'X-Figma-Token': figmaToken }
  });
  if (imgRes.ok) {
    const imgData = await imgRes.json();
    const renderUrl = imgData.images?.[NODE_ID];
    if (renderUrl) {
      const downloadRes = await fetch(renderUrl);
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      fs.writeFileSync('scripts/figma_node_57000_9634.png', buffer);
      console.log('✓ Downloaded scripts/figma_node_57000_9634.png');
    }
  }
}

main().catch(console.error);
