# 日記アプリケーション - 仕様書

## 概要

本ディレクトリには、日記アプリケーション (Diary Open Close) の各種仕様書が格納されています。

## 文書一覧

| No. | ファイル名 | 文書名 | 説明 |
|-----|-----------|--------|------|
| 1 | [01_functional_specifications.md](./01_functional_specifications.md) | 機能仕様書 | アプリケーションの全機能を詳細に定義 |
| 2 | [02_screen_specifications.md](./02_screen_specifications.md) | 画面仕様書 | 各画面の構成、UI要素、レイアウトを定義 |
| 3 | [03_database_specifications.md](./03_database_specifications.md) | DB仕様書 | PostgreSQLのテーブル、カラム、インデックスを定義 |
| 4 | [04_api_specifications.md](./04_api_specifications.md) | API仕様書 | RESTful APIの全エンドポイントを定義 |
| 5 | [05_screen_transition_diagram.md](./05_screen_transition_diagram.md) | 画面遷移図 | 画面間の遷移とユーザーフローを定義 |
| 6 | [06_non_functional_requirements.md](./06_non_functional_requirements.md) | 非機能要件定義書 | パフォーマンス、セキュリティ、可用性などを定義 |

## システム構成

### フロントエンド
- **フレームワーク**: Next.js (App Router) + TypeScript
- **スタイリング**: TailwindCSS v4
- **ソースコード**: `frontend/`
- **ポート**: 3000

### バックエンド
- **フレームワーク**: Go
- **ホットリロード**: Air
- **ソースコード**: `backend/`
- **ポート**: 8000
- **API定義**: `backend/openapi.yaml`

### データベース
- **DB**: PostgreSQL
- **管理ツール**: pgAdmin4 (ポート: 5050)

### 認証
- **方式**: JWT (JSON Web Token)
- **メールアドレス + パスワード認証**

### インフラ
- **コンテナ**: Docker Compose (devcontainer)
- **コンテナ定義**: `infra/compose.yml`

## 主要機能

1. **認証機能**
   - メールアドレス + パスワードによるユーザー登録・ログイン
   - JWTトークンによるセッション管理

2. **日記管理**
   - 日記の作成（メインコンテンツ + 10の詳細項目）
   - 日記の削除
   - 日記の公開/非公開設定

3. **メディア添付**
   - 画像アップロード（最大5MB）
   - 音声アップロード（最大10MB）

4. **閲覧機能**
   - マイ日記一覧（自分の日記のみ）
   - みんなの日記一覧（公開日記）

---

**文書作成日**: 2026年2月19日  
**バージョン**: 1.0
