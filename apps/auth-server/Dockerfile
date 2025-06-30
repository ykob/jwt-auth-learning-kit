# --- Stage 1: ビルドステージ ---
# ★ 変更点: Node.jsのバージョンを22に変更
FROM node:22-alpine AS builder

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# pnpmをインストール
RUN npm install -g pnpm

# まず、依存関係の解決に必要なファイルだけをコピーする
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# プロジェクト全体の依存関係をインストールする
RUN pnpm install --frozen-lockfile

# アプリケーションのソースコード全体をコピーする
COPY . .

# auth-serverアプリケーションのみをビルドする
RUN pnpm --filter @jwt-auth-learning-kit/auth-server build

# Prisma Clientを生成する
RUN pnpm --filter @jwt-auth-learning-kit/auth-server exec prisma generate

# --- Stage 2: 本番ステージ ---
# ★ 変更点: Node.jsのバージョンを22に変更
FROM node:22-alpine AS production

WORKDIR /app

# 環境変数を本番モードに設定
ENV NODE_ENV=production

# ビルドステージから、本番環境で必要なファイルだけをコピーする
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/auth-server/package.json ./apps/auth-server/package.json
COPY --from=builder /app/apps/auth-server/dist ./apps/auth-server/dist
COPY --from=builder /app/apps/auth-server/prisma ./apps/auth-server/prisma

# アプリケーションがリッスンするポートを公開
EXPOSE 3001

# コンテナが起動したときに実行されるコマンド
CMD ["node", "apps/auth-server/dist/index.js"]