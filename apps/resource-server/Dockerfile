# --- Stage 1: ビルダー ---
FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# 依存関係のキャッシュを効かせるため、package.json関連ファイルを先にコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/auth-server/package.json ./apps/auth-server/
COPY apps/resource-server/package.json ./apps/resource-server/

# 開発用も含め、全ての依存関係をインストール
RUN pnpm install --frozen-lockfile

# ソースコード全体をコピー
COPY . .

# resource-serverをビルド
RUN pnpm --filter @jwt-auth-learning-kit/resource-server build

# --- Stage 2: 本番 ---
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm

# 本番用の依存関係をクリーンにインストール
COPY package.json pnpm-workspace.yaml ./
COPY apps/auth-server/package.json ./apps/auth-server/
COPY apps/resource-server/package.json ./apps/resource-server/
RUN pnpm install --prod --frozen-lockfile

# ★ 変更点: resource-serverのビルド済みコードをコピー
COPY --from=builder /app/apps/resource-server/dist ./dist

EXPOSE 4001

CMD ["node", "dist/index.js"]