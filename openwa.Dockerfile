FROM node:22-alpine

RUN apk add --no-cache \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN git clone https://github.com/rmyndharis/OpenWA.git /app
WORKDIR /app
RUN npm install
RUN npm run build

# Inject --no-sandbox and related flags into the compiled Puppeteer adapter
RUN node -e "
const fs = require('fs');
const file = '/app/dist/engine/adapters/whatsapp-web-js.adapter.js';
let src = fs.readFileSync(file, 'utf8');
const flags = ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-zygote','--single-process'];
const inject = 'args: ' + JSON.stringify(flags) + ',';
if (!src.includes('--no-sandbox')) {
  src = src.replace(/puppeteerOpts\s*=\s*\{/, 'puppeteerOpts = {' + inject);
  fs.writeFileSync(file, src);
  console.log('Patched puppeteer args');
} else { console.log('Already patched'); }
"

EXPOSE 3000
CMD ["npm", "run", "start:prod"]

