FROM node:22-alpine AS base

# --- Stage 1: ビルドステージ ---
FROM base AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY . .

RUN pnpm config set inject-workspace-packages=true
RUN pnpm install --frozen-lockfile
RUN pnpm build:auth
RUN pnpm deploy:auth

# --- Stage 2: 本番ステージ ---
FROM base AS production

WORKDIR /app

COPY --from=builder /app/deploy/dist /app/dist
COPY --from=builder /app/deploy/generated /app/generated
COPY --from=builder /app/deploy/node_modules/ /app/node_modules
COPY --from=builder /app/deploy/package.json /app/package.json

EXPOSE 4001
CMD ["node", "dist/index.js"]