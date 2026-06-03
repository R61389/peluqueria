FROM node:22-alpine
RUN apk add --no-cache git
RUN git clone https://github.com/rmyndharis/OpenWA.git /app
WORKDIR /app
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
