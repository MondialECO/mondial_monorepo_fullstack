import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';

async function fetchFigmaImages() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/images`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  
  if (res.ok) {
    const data = await res.json();
    console.log('Figma image fill URLs:', data.meta?.images);
    const logoUrl = data.meta?.images?.['e1e51898e67b12582538b45df4d7bce0505adc5b'];
    if (logoUrl) {
      console.log('Downloading brand logo from:', logoUrl);
      const imgRes = await fetch(logoUrl);
      const buf = await imgRes.arrayBuffer();
      fs.writeFileSync('public/brand-logo-footer.png', Buffer.from(buf));
      console.log('✓ Saved to public/brand-logo-footer.png');
    }
  }
}

fetchFigmaImages().catch(console.error);
