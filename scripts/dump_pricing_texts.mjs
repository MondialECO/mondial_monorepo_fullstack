import fs from 'fs';

function extractText(node, texts = []) {
  if (node.characters) {
    texts.push({
      id: node.id,
      name: node.name,
      text: node.characters,
      fills: node.fills,
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
    });
  }
  if (node.children) {
    node.children.forEach(c => extractText(c, texts));
  }
  return texts;
}

function findImages(node, images = []) {
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE' && fill.imageRef) {
        images.push({
          nodeId: node.id,
          name: node.name,
          imageRef: fill.imageRef,
        });
      }
    }
  }
  if (node.children) {
    node.children.forEach(c => findImages(c, images));
  }
  return images;
}

const files = ['deep_56939_79254.json', 'deep_56939_79428.json'];

let out = '';
const allImages = [];

files.forEach(f => {
  const p = `scripts/pricing_sections/${f}`;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const texts = extractText(data);
  const imgs = findImages(data);
  imgs.forEach(img => {
    if (!allImages.find(x => x.imageRef === img.imageRef)) {
      allImages.push(img);
    }
  });

  out += `\n=================== ${f} (${texts.length} texts, ${imgs.length} images) ===================\n`;
  texts.forEach((t, i) => {
    out += `[${i}] [${t.name}] (${t.id}): ${t.text.replace(/\n/g, ' \\n ')}\n`;
  });
});

fs.writeFileSync('scripts/pricing_all_texts.txt', out, 'utf8');
fs.writeFileSync('scripts/pricing_images.json', JSON.stringify(allImages, null, 2));
console.log('Saved scripts/pricing_all_texts.txt');
console.log(`Found ${allImages.length} images across pricing sections`);
