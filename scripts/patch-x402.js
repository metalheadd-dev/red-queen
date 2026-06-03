const fs = require('fs');
const path = require('path');

const patchTargets = [
  path.join(__dirname, '../node_modules/@x402/svm/dist/cjs/index.js'),
  path.join(__dirname, '../node_modules/@x402/svm/dist/esm/chunk-GHP74CT3.mjs')
];

patchTargets.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('MAX_COMPUTE_UNIT_PRICE_MICROLAMPORTS = 5e6')) {
        content = content.replace(
          'MAX_COMPUTE_UNIT_PRICE_MICROLAMPORTS = 5e6',
          'MAX_COMPUTE_UNIT_PRICE_MICROLAMPORTS = 1000000000'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[patch] Successfully patched ${filePath}`);
      } else {
        console.log(`[patch] ${filePath} already patched or target pattern not found.`);
      }
    } catch (e) {
      console.error(`[patch] Failed to patch ${filePath}:`, e.message);
    }
  } else {
    console.log(`[patch] Target file does not exist: ${filePath}`);
  }
});
