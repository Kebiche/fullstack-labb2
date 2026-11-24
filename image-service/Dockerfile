FROM node:24-bookworm-slim

# Typsnitt behövs när Sharp ritar text i bilder.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-fund --no-audit
COPY src ./src

RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
ENV PORT=3001
ENV UPLOAD_DIRECTORY=/data/uploads
ENV DATABASE_PATH=/data/images.sqlite
EXPOSE 3001
CMD ["node", "src/server.js"]
