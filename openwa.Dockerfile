FROM node:22-alpine

# Chromium + dependencias para Puppeteer
RUN apk add --no-cache \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Decirle a Puppeteer que use el Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN git clone https://github.com/rmyndharis/OpenWA.git /app
WORKDIR /app
RUN npm install
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
