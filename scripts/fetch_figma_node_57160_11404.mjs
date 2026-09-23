import fs from 'fs';
import path from 'path';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/FIGMA_ACCESS_TOKEN=(.+)/);
const token = match ? match[1].trim() : '';

const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '57160:11404';

async function run() {
  console.log('Fetching Figma node:', NODE_ID);
  const nodeUrl = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  const res = await fetch(nodeUrl, {
    headers: { 'X-Figma-Token': token }
  });
  if (!res.ok) {
    console.error('Failed to fetch node:', res.status, res.statusText, await res.text());
    return;
  }
  const data = await res.json();
  fs.writeFileSync('scripts/figma_step37_57160_11404.json', JSON.stringify(data, null, 2));
  console.log('Saved JSON to scripts/figma_step37_57160_11404.json');

  console.log('Fetching PNG image for node:', NODE_ID);
  const imgApiUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(NODE_ID)}&format=png&scale=2`;
  const imgRes = await fetch(imgApiUrl, {
    headers: { 'X-Figma-Token': token }
  });
  if (imgRes.ok) {
    const imgData = await imgRes.json();
    const downloadUrl = imgData.images[NODE_ID];
    if (downloadUrl) {
      const pngRes = await fetch(downloadUrl);
      const buffer = Buffer.from(await pngRes.arrayBuffer());
      fs.writeFileSync('scripts/figma_step37_57160_11404.png', buffer);
      
      const artifactDir = 'C:\\Users\\Siraj\\.gemini\\antigravity-ide\\brain\\f6f1908a-1819-4fb8-8e76-982b5b1f16b1';
      fs.writeFileSync(path.join(artifactDir, 'figma_step37_57160_11404.png'), buffer);
      console.log('Saved PNG to scripts/figma_step37_57160_11404.png and artifact folder');
    }
  }

  const root = Object.values(data.nodes)[0]?.document;
  if (!root) {
    console.log('No document found in node');
    return;
  }

  function getHex(c) {
    if (!c) return 'none';
    const r = Math.round((c.r || 0) * 255);
    const g = Math.round((c.g || 0) * 255);
    const b = Math.round((c.b || 0) * 255);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  const lines = [];
  function dump(n, depth = 0) {
    const indent = '  '.repeat(depth);
    let str = `${indent}- [${n.type}] "${n.name}"`;
    if (n.characters) {
      str += ` (text: "${n.characters.replace(/\n/g, '\\n')}")`;
    }
    if (n.fills && n.fills.length > 0 && n.fills[0].color) {
      str += ` [fill: ${getHex(n.fills[0].color)}]`;
    }
    if (n.absoluteBoundingBox) {
      const { x, y, width, height } = n.absoluteBoundingBox;
      str += ` bbox: [${Math.round(x)}, ${Math.round(y)}, ${Math.round(width)}x${Math.round(height)}]`;
    }
    lines.push(str);
    if (n.children) {
      n.children.forEach(c => dump(c, depth + 1));
    }
  }

  dump(root);
  fs.writeFileSync('scripts/figma_step37_dump.txt', lines.join('\n'));
  console.log('Dumped text hierarchy to scripts/figma_step37_dump.txt (' + lines.length + ' nodes)');
}

run().catch(console.error);
