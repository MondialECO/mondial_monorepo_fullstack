import fs from 'fs';
import path from 'path';

// Read token from .env.local
const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/FIGMA_ACCESS_TOKEN=(.+)/);
const token = match ? match[1].trim() : '';

const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '57156:8767';

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
  fs.writeFileSync('scripts/figma_formation_57156_8767.json', JSON.stringify(data, null, 2));
  console.log('Saved JSON to scripts/figma_formation_57156_8767.json');

  // Fetch rendered PNG image
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
      fs.writeFileSync('scripts/figma_formation_57156_8767.png', buffer);
      
      const artifactDir = 'C:\\Users\\Siraj\\.gemini\\antigravity-ide\\brain\\f6f1908a-1819-4fb8-8e76-982b5b1f16b1';
      fs.writeFileSync(path.join(artifactDir, 'figma_formation_57156_8767.png'), buffer);
      console.log('Saved PNG to scripts/figma_formation_57156_8767.png and artifact folder');
    }
  }

  // Dump textual structure
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
    const fills = (n.fills || []).filter(f => f.visible !== false).map(f => f.type + (f.color ? ':' + getHex(f.color) : '')).join(',');
    const strokes = (n.strokes || []).filter(s => s.visible !== false).map(s => s.type + (s.color ? ':' + getHex(s.color) : '')).join(',');
    const pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].filter(x => x !== undefined).join('/');
    const radius = n.cornerRadius !== undefined ? 'r:' + n.cornerRadius : '';
    const textInfo = n.type === 'TEXT'
      ? '"' + (n.characters || '').replace(/\n/g, '\\n') + '" [font:' + n.style?.fontFamily + ' w:' + n.style?.fontWeight + ' size:' + n.style?.fontSize + 'px color:' + (n.fills?.[0]?.color ? getHex(n.fills[0].color) : '') + ']'
      : '';
    const size = n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) : '';

    lines.push(`${indent}[${n.type}] "${n.name}" ${size} ${radius} ${fills ? 'fill:' + fills : ''} ${strokes ? 'stroke:' + strokes : ''} ${pad ? 'pad:' + pad : ''} ${textInfo}`);
    if (n.children) {
      for (const child of n.children) {
        dump(child, depth + 1);
      }
    }
  }

  dump(root);
  fs.writeFileSync('scripts/figma_formation_dump.txt', lines.join('\n'));
  console.log('Saved dump to scripts/figma_formation_dump.txt. Total elements:', lines.length);
}

run().catch(console.error);
