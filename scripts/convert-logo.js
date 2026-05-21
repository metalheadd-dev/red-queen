const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgCode = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Add black background so it looks good on pump.fun -->
  <rect width="100" height="100" fill="#000000" />
  <circle cx="50" cy="50" r="48" stroke="#ff4d4d" stroke-width="3" />
  <path d="M 50 8 A 42 42 0 0 1 92 50" stroke="#ff4d4d" stroke-width="3" fill="none"/>
  <path d="M 50 8 A 42 42 0 0 0 8 50" stroke="#ff4d4d" stroke-width="3" fill="none"/>
  <line x1="50" y1="8" x2="50" y2="92" stroke="#ff4d4d" stroke-width="3"/>
  <line x1="8" y1="50" x2="92" y2="50" stroke="#ff4d4d" stroke-width="3"/>
  <path d="M 8 50 A 21 21 0 0 1 50 50" stroke="#ff4d4d" stroke-width="3" fill="none"/>
  <path d="M 50 50 A 21 21 0 0 1 92 50" stroke="#ff4d4d" stroke-width="3" fill="none"/>
  <circle cx="50" cy="50" r="5" fill="#ff4d4d"/>
</svg>`;

async function convert() {
  await sharp(Buffer.from(svgCode))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'token-image.png'));
  console.log("Converted to token-image.png successfully.");
}

convert().catch(console.error);
