# syntax=docker/dockerfile:1

FROM node:24-alpine AS builder

WORKDIR /app

# ビルド時引数として環境変数を受け取る
ARG NEXT_PUBLIC_API_BASE_URL
# ARG NEXT_PUBLIC_CONTACT_URL

# 環境変数として設定（ビルド時にバンドルされる）
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
# ENV NEXT_PUBLIC_CONTACT_URL=${NEXT_PUBLIC_CONTACT_URL}

COPY ./package*.json ./
RUN npm ci

COPY . .

RUN npm run build

#------------------------------------

FROM gcr.io/distroless/nodejs24-debian12

WORKDIR /app

# standalone 実行体
COPY --from=builder /app/.next/standalone ./

# 静的ファイル
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["server.js"]
