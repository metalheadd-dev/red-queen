const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '..', 'public', 'token-image.png');

const targets = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const storeIconDest = path.join(__dirname, 'store_icon.png');

async function run() {
  // Generate all mipmap icons
  for (const { dir, size } of targets) {
    const dest = path.join(__dirname, 'app', 'src', 'main', 'res', dir, 'ic_launcher.png');
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(dest);
    console.log(`Written: ${dir}/ic_launcher.png (${size}x${size})`);
  }

  // Generate store icon (512x512)
  await sharp(SOURCE)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(storeIconDest);
  console.log('Written: store_icon.png (512x512)');

  console.log('\nAll icons updated successfully.');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
