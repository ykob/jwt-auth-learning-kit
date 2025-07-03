# --- Stage 1: ビルドステージ ---
# 開発に必要なもの全てを含み、アプリケーションをビルドする
FROM node:22-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

# 依存関係の解決に必要なファイルを先にコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 開発用も含め、全ての依存関係をインストール
RUN pnpm install --frozen-lockfile

# 全てのソースコードをコピーする
COPY . .

# auth-serverをビルド
# （pnpm-lock.yamlの更新を防ぐため、ビルドの前にインストールを完了させる）
RUN pnpm --filter @jwt-auth-learning-kit/auth-server build
RUN pnpm --filter @jwt-auth-learning-kit/auth-server exec prisma generate

# --- Stage 2: 本番ステージ ---
# ビルド済みの成果物と本番用の依存関係だけを含む、最小のイメージを作成する
FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm

# pnpmがワークスペース全体を正しく認識できるよう、
# builderステージから、すべてのpackage.jsonを含むディレクトリ構造をコピーする
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/ ./apps/

# これでpnpmはワークスペース内の全パッケージを認識できる状態になった
# --prodフラグで、本番用の依存関係のみをインストールする
RUN pnpm install --prod --frozen-lockfile

# ビルド済みのコードをコピー
COPY --from=builder /app/apps/auth-server/dist ./apps/auth-server/dist
COPY --from=builder /app/apps/auth-server/generated ./apps/auth-server/dist/generated

EXPOSE 3001

# CMDのパスは、作業ディレクトリ(/app)からの相対パスなので、このままでOK
CMD ["node", "apps/auth-server/dist/index.js"]