/**
 * Copy shared files to the correct location in dist
 * This ensures shared modules are accessible from both main and preload processes
 */

const fs = require('fs');
const path = require('path');

const distMain = path.join(__dirname, '../dist/main');
const distPreload = path.join(__dirname, '../dist/preload');
const distShared = path.join(__dirname, '../dist/shared');

// Create dist/shared if it doesn't exist
if (!fs.existsSync(distShared)) {
  fs.mkdirSync(distShared, { recursive: true });
}

// Copy shared files from main/shared to dist/shared
const mainShared = path.join(distMain, 'shared');
if (fs.existsSync(mainShared)) {
  const files = fs.readdirSync(mainShared);
  files.forEach((file) => {
    const src = path.join(mainShared, file);
    const dest = path.join(distShared, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/shared/`);
  });
}

// Also ensure shared exists in main and preload for relative imports
// Copy to main/shared (already exists from TypeScript compilation)
// Copy to preload/shared
const preloadShared = path.join(distPreload, 'shared');
if (!fs.existsSync(preloadShared)) {
  fs.mkdirSync(preloadShared, { recursive: true });
}

if (fs.existsSync(distShared)) {
  const files = fs.readdirSync(distShared);
  files.forEach((file) => {
    const src = path.join(distShared, file);
    const dest = path.join(preloadShared, file);
    fs.copyFileSync(src, dest);
  });
}

console.log('Shared files copied successfully');
