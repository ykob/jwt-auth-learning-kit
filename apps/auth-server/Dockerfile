# Dockerfile in apps/auth-server/

# --- Stage 1: ビルドステージ ---
# ここでは、開発用の依存関係も含めて全てをインストールし、アプリケーションをビルドします
FROM node:22-alpine AS builder

WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm

# 依存関係の解決に必要なファイルを先にコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# プロジェクト全体のソースコードと設定ファイルをコピー
COPY . .

# すべての依存関係をインストールし、auth-serverをビルド
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @jwt-auth-learning-kit/auth-server build
RUN pnpm --filter @jwt-auth-learning-kit/auth-server exec prisma generate

# ★ pnpm deployを使って、本番用のファイル一式を/prodディレクトリに準備する
# これが今回のキーポイントです！
RUN pnpm deploy --filter=@jwt-auth-learning-kit/auth-server --prod /prod


# --- Stage 2: 本番ステージ ---
# ここでは、ビルドステージで準備した本番用のファイルだけを使って、最小のイメージを作成します
FROM node:22-alpine AS production

WORKDIR /app

# 環境変数を本番モードに設定
ENV NODE_ENV=production

# ビルドステージの/prodディレクトリから、本番用のファイル一式をコピー
COPY --from=builder /prod .

# アプリケーションがリッスンするポートを公開
EXPOSE 3001

# コンテナが起動したときに実行されるコマンド
# pnpm deployは元のディレクトリ構造を保つため、パスの指定が必要
CMD ["node", "apps/auth-server/dist/index.js"]