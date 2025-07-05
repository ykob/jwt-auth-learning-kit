# @jwt-auth-learning-kit/resource-server

アプリケーションサーバーとそのDB。

## 環境変数

```
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DB_PORT}/${POSTGRES_DB}?schema=public"

ACCESS_TOKEN_SECRET="YOUR_SUPER_SECRET_KEY_HERE"
REFRESH_TOKEN_SECRET="YOUR_SUPER_SECRET_KEY_HERE"

PORT=4001
```