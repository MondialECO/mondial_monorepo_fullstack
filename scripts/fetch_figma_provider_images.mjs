import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '56877:103351';

async function downloadMayaPortrait() {
  const url = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(NODE_ID)}&format=png&scale=2`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  const json = await res.json();
  console.log('Images response:', json);

  const outDir = 'public/provider-public';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const imgUrl = json.images[NODE_ID];
  if (imgUrl) {
    const localFile = path.join(outDir, 'maya_rahman_portrait.png');
    const imgRes = await fetch(imgUrl);
    const buffer = await imgRes.arrayBuffer();
    fs.writeFileSync(localFile, Buffer.from(buffer));
    console.log(`Successfully downloaded ${localFile} (${buffer.byteLength} bytes)`);
  }
}

downloadMayaPortrait().catch(console.error);
