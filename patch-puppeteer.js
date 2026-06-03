const fs = require('fs');
const file = '/app/dist/engine/adapters/whatsapp-web-js.adapter.js';
if (!fs.existsSync(file)) { console.log('Adapter not found, skipping'); process.exit(0); }
let src = fs.readFileSync(file, 'utf8');
if (src.includes('--no-sandbox')) { console.log('Already patched'); process.exit(0); }
const flags = ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-zygote','--single-process'];
const replaced = src.replace(/args\s*:\s*\[\s*\]/, 'args: ' + JSON.stringify(flags));
if (replaced === src) {
  // fallback: inject before executablePath
  const patched = src.replace(/(executablePath\s*:)/, 'args: ' + JSON.stringify(flags) + ', $1');
  fs.writeFileSync(file, patched);
} else {
  fs.writeFileSync(file, replaced);
}
console.log('Patched puppeteer args successfully');
