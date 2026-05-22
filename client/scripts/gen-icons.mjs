import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SVG = fs.readFileSync(path.join('public', 'icon.svg'));
const out = (name) => path.join('public', name);

const MASKABLE_BG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#2563EB"/>
    <g transform="translate(80, 80) scale(0.6875)">
      <rect width="512" height="512" rx="96" fill="#2563EB"/>
      <g fill="#FFFFFF">
        <rect x="156" y="116" width="200" height="280" rx="100"/>
        <rect x="146" y="246" width="220" height="20"/>
      </g>
    </g>
  </svg>
`;

await sharp(SVG).resize(192, 192).png().toFile(out('icon-192.png'));
await sharp(SVG).resize(512, 512).png().toFile(out('icon-512.png'));
await sharp(Buffer.from(MASKABLE_BG)).resize(512, 512).png().toFile(out('icon-maskable-512.png'));

console.log('Icons generated:', ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].join(', '));
