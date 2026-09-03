import fs from 'fs';
import path from 'path';

const candidates = [
  'about', 'about-us', 'how-it-works', 'features', 'pricing', 'contact', 'faq', 'help',
  'resources', 'blog', 'news', 'partners', 'security', 'trust', 'legal', 'privacy',
  'terms', 'cookies', 'for-creators', 'for-entrepreneurs', 'for-investors',
  'for-service-providers', 'funding', 'incubator', 'company', 'careers', 'request-demo'
];

for (const c of candidates) {
  const p1 = path.join('src/app', c, 'page.tsx');
  const p2 = path.join('src/app', c, 'page.jsx');
  const p3 = path.join('src/app', c, 'page.js');
  const exists = fs.existsSync(p1) || fs.existsSync(p2) || fs.existsSync(p3);
  console.log(`/${c}: ${exists ? 'EXISTS' : 'MISSING'}`);
}
