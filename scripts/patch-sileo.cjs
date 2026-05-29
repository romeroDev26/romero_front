/**
 * Patch sileo toast dimensions idempotently.
 * Replaces patch-package for sileo to avoid build-cache issues in Vercel.
 */

const fs = require('fs');
const path = require('path');

const SILEO_DIST = path.resolve(__dirname, '../node_modules/sileo/dist');
const FILES = ['index.js', 'index.mjs'];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-sileo] File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Idempotent replacements: if already patched, these are no-ops
  content = content.replace(/const HEIGHT = 40;/g, 'const HEIGHT = 52;');
  content = content.replace(/const WIDTH = 350;/g, 'const WIDTH = 360;');
  content = content.replace(/--sileo-height:40px/g, '--sileo-height:52px');
  content = content.replace(/--sileo-width:350px/g, '--sileo-width:360px');

  if (content === original) {
    console.log(`[patch-sileo] ${path.basename(filePath)} already patched or no changes needed.`);
    return true;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[patch-sileo] Patched ${path.basename(filePath)}`);
  return true;
}

let allOk = true;
for (const file of FILES) {
  const filePath = path.join(SILEO_DIST, file);
  if (!patchFile(filePath)) {
    allOk = false;
  }
}

if (!allOk) {
  console.error('[patch-sileo] Some files could not be patched.');
  process.exit(1);
}

console.log('[patch-sileo] Done.');
