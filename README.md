# 日記アプリ (仮)

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js / TypeScript / TailwindCSS |
| バックエンド | Go / Air (ホットリロード) |
| データベース | PostgreSQL |
| 開発環境 | Dev Container (Docker Compose) |

## 開発環境のセットアップ

### 前提条件

- Docker Desktop がインストールされていること
- VS Code + [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) がインストールされていること

### 手順

1. **リポジトリをクローン**

   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **環境変数ファイルを作成**

   ```bash
   cp infra/.env.example infra/.env
   ```

   `infra/.env` を開き、各値を設定してください（詳細は後述）。

3. **devcontainer.json を作成**

   ```bash
   cp .devcontainer/devcontainer.json.template .devcontainer/devcontainer.json
   ```

   `devcontainer.json` の `name` を任意のプロジェクト名に変更してください。

4. **Dev Container を起動**

   VS Code でリポジトリを開き、コマンドパレット（`Ctrl+Shift+P`）から
   `Dev Containers: Reopen in Container` を実行してください。

## 環境変数

`infra/.env.example` をコピーして `infra/.env` を作成し、以下の値を設定してください。

| 変数名 | 説明 | 例 |
|---|---|---|
| `PROJECT_NAME` | Dockerプロジェクト名 | `diary-oc` |
| `POSTGRES_USER` | PostgreSQL ユーザー名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL パスワード | 任意の強いパスワード |
| `POSTGRES_DB` | PostgreSQL データベース名 | `diary_oc_data` |
| `PGADMIN_DEFAULT_EMAIL` | pgAdmin ログインメール | 任意のメールアドレス |
| `PGADMIN_DEFAULT_PASSWORD` | pgAdmin パスワード | 任意の強いパスワード |
| `DATABASE_URL` | DB接続URL（自動生成） | 変更不要 |
| `JWT_SECRET` | JWT署名シークレット | 十分な長さのランダム文字列 |
| `API_PORT` | バックエンドAPIポート | `8000` |
| `HOST` | バックエンドホスト | `0.0.0.0` |
| `ALLOWED_ORIGINS` | CORSの許可オリジン | `http://localhost:3000` |
| `UPLOAD_DIR` | アップロードファイルの保存先 | `./uploads` |

> ⚠️ **本番環境では `JWT_SECRET`・`POSTGRES_PASSWORD`・`PGADMIN_DEFAULT_PASSWORD` に強い値を設定してください。**

## ポート

| サービス | ポート | 説明 |
|---|---|---|
| フロントエンド | 3000 | Next.js 開発サーバー |
| バックエンド API | 8000 | Go API サーバー |
| pgAdmin | 5050 | DB 管理画面 |
