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
COPY patch-puppeteer.js /tmp/patch-puppeteer.js
RUN npm install
RUN npm run build
RUN node /tmp/patch-puppeteer.js

EXPOSE 3000
CMD find /app/.wwebjs_auth -name "Singleton*" -delete 2>/dev/null; npm run start:prod

