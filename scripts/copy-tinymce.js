import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../node_modules/tinymce');
const destDir = path.resolve(__dirname, '../public/tinymce');

console.log(`Copying TinyMCE assets from ${srcDir} to ${destDir}...`);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destDir);
    console.log('TinyMCE assets copied successfully.');
  } else {
    console.error('TinyMCE node_modules directory not found.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error copying TinyMCE assets:', err);
  process.exit(1);
}
