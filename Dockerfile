ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM dependencies AS builder
COPY . .
RUN npm run build:node

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3100 STORAGE_DRIVER=sqlite BLOG_DB_PATH=/app/data/field-notes.sqlite
RUN useradd --system --uid 1001 blog && mkdir -p /app/data && chown -R blog:blog /app
COPY --from=builder --chown=blog:blog /app/.next/standalone ./
COPY --from=builder --chown=blog:blog /app/.next/static ./.next/static
COPY --from=builder --chown=blog:blog /app/public ./public
USER blog
EXPOSE 3100
CMD ["node", "server.js"]
