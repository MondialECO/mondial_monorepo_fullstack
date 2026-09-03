import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_IDS = ['56885:117176', '56877:89047', '56885:117338', '56885:117939', '56885:118356', '56885:118618'];

async function fetchFigmaNodes() {
  console.log('Fetching Figma Header nodes:', NODE_IDS.join(','));
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${NODE_IDS.join(',')}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch nodes:', res.status, res.statusText);
      const text = await res.text();
      console.error('Response:', text);
      return;
    }

    const data = await res.json();
    fs.writeFileSync('scripts/figma_header_nodes.json', JSON.stringify(data, null, 2));
    console.log('✓ Successfully saved scripts/figma_header_nodes.json');

    // Also request rendered image previews for each node
    console.log('Fetching images for header nodes...');
    const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${NODE_IDS.join(',')}&format=png&scale=2`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (imgRes.ok) {
      const imgData = await imgRes.json();
      fs.writeFileSync('scripts/figma_header_images.json', JSON.stringify(imgData, null, 2));
      console.log('✓ Successfully saved scripts/figma_header_images.json');
      console.log('Image URLs:', imgData.images);
    }
  } catch (err) {
    console.error('Error fetching Figma header:', err);
  }
}

fetchFigmaNodes();
