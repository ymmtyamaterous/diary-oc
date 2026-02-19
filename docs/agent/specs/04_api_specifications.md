# API仕様書

## 1. API概要

### 1.1 基本情報
- **プロトコル**: HTTP/HTTPS
- **ベースURL**: `http://localhost:8000` (開発環境)
- **APIパス**: `/api/*`
- **データ形式**: JSON、Multipart Form Data（ファイルアップロード）
- **文字エンコーディング**: UTF-8
- **実装言語**: Go + Air（ホットリロード）

### 1.2 認証
- **方式**: JWT (JSON Web Token)
- **ヘッダー名**: `Authorization`
- **形式**: `Bearer <token>`
- 認証が必要なエンドポイントにはトークンを付与すること

### 1.3 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|------------|
| `HOST` | バインドするホスト | `0.0.0.0` |
| `API_PORT` | APIサーバーのポート番号 | `8000` |
| `ALLOWED_ORIGINS` | CORS許可オリジン（カンマ区切り） | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL接続文字列 | - |
| `JWT_SECRET` | JWT署名シークレットキー | - |
| `UPLOAD_DIR` | ファイルアップロードディレクトリ | `./uploads` |

### 1.4 共通レスポンス形式

#### 成功時
```json
{
  "data": { ... }
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ（日本語）"
}
```

---

## 2. エンドポイント一覧

### 認証系

| No. | メソッド | エンドポイント | 説明 | 認証 |
|-----|---------|---------------|------|------|
| 1 | POST | `/api/auth/register` | ユーザー登録 | 不要 |
| 2 | POST | `/api/auth/login` | ログイン（JWTトークン発行） | 不要 |
| 3 | GET | `/api/auth/me` | 現在のユーザー情報取得 | 必要 |

### 日記系

| No. | メソッド | エンドポイント | 説明 | 認証 |
|-----|---------|---------------|------|------|
| 4 | GET | `/api/diaries` | 自分の日記一覧取得 | 必要 |
| 5 | POST | `/api/diaries` | 日記作成 | 必要 |
| 6 | DELETE | `/api/diaries/:id` | 日記削除 | 必要 |
| 7 | PATCH | `/api/diaries/:id/visibility` | 公開設定切り替え | 必要 |
| 8 | GET | `/api/diaries/public` | 公開日記一覧取得 | 不要 |

### ファイル系

| No. | メソッド | エンドポイント | 説明 | 認証 |
|-----|---------|---------------|------|------|
| 9 | POST | `/api/upload/image` | 画像アップロード | 必要 |
| 10 | POST | `/api/upload/audio` | 音声アップロード | 必要 |
| 11 | DELETE | `/api/files/:filename` | ファイル削除 | 必要 |
| 12 | GET | `/api/files/images/:filename` | 画像ファイル取得 | 不要 |
| 13 | GET | `/api/files/audio/:filename` | 音声ファイル取得 | 不要 |

### ヘルスチェック

| No. | メソッド | エンドポイント | 説明 | 認証 |
|-----|---------|---------------|------|------|
| 14 | GET | `/api/health` | ヘルスチェック | 不要 |

---

## 3. エンドポイント詳細

### 3.1 ユーザー登録

```
POST /api/auth/register
```

#### リクエスト

##### ヘッダー
```
Content-Type: application/json
```

##### ボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `email` | string | ○ | メールアドレス |
| `password` | string | ○ | パスワード（8文字以上） |
| `display_name` | string | ○ | 表示名 |

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "山田太郎"
}
```

#### レスポンス

##### 成功時 (201 Created)
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "display_name": "山田太郎",
      "profile_image_url": null,
      "created_at": "2026-02-19T10:00:00+09:00"
    }
  }
}
```

##### エラー時 (400 Bad Request)
```json
{ "error": "メールアドレスは必須です" }
```
```json
{ "error": "パスワードは8文字以上で入力してください" }
```

##### エラー時 (409 Conflict)
```json
{ "error": "このメールアドレスはすでに登録されています" }
```

---

### 3.2 ログイン

```
POST /api/auth/login
```

#### リクエスト

##### ヘッダー
```
Content-Type: application/json
```

##### ボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `email` | string | ○ | メールアドレス |
| `password` | string | ○ | パスワード |

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "display_name": "山田太郎",
      "profile_image_url": null,
      "created_at": "2026-02-19T10:00:00+09:00"
    }
  }
}
```

##### エラー時 (401 Unauthorized)
```json
{ "error": "メールアドレスまたはパスワードが正しくありません" }
```

---

### 3.3 現在のユーザー情報取得

```
GET /api/auth/me
```

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "山田太郎",
    "profile_image_url": null,
    "created_at": "2026-02-19T10:00:00+09:00"
  }
}
```

##### エラー時 (401 Unauthorized)
```json
{ "error": "認証トークンが無効です" }
```

---

### 3.4 自分の日記一覧取得

```
GET /api/diaries
```

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "content": "今日は素晴らしい一日でした。",
      "date": "2026-02-19",
      "weather": "sunny",
      "is_public": true,
      "image_url": "/api/files/images/diary-image-1708185600000-123456789.jpg",
      "image_name": "diary-image-1708185600000-123456789.jpg",
      "audio_url": null,
      "audio_name": null,
      "events": "プロジェクト完了",
      "emotions": "達成感がある",
      "good_things": null,
      "reflections": null,
      "gratitude": null,
      "tomorrow_goals": null,
      "tomorrow_looking_forward": null,
      "learnings": null,
      "health_habits": null,
      "today_in_one_word": "達成",
      "created_at": "2026-02-19T10:00:00+09:00",
      "updated_at": "2026-02-19T10:00:00+09:00"
    }
  ]
}
```

> **ソート順**: `date DESC, created_at DESC`

---

### 3.5 日記作成

```
POST /api/diaries
```

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
Content-Type: application/json
```

##### ボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `content` | string | - | メインコンテンツ |
| `date` | string | ○ | 日記の日付（YYYY-MM-DD） |
| `weather` | string | - | 天気 |
| `is_public` | boolean | - | 公開フラグ（デフォルト: false） |
| `image_url` | string | - | 画像URL |
| `image_name` | string | - | 画像ファイル名 |
| `audio_url` | string | - | 音声URL |
| `audio_name` | string | - | 音声ファイル名 |
| `events` | string | - | 出来事 |
| `emotions` | string | - | 感情 |
| `good_things` | string | - | よかったこと |
| `reflections` | string | - | 反省点 |
| `gratitude` | string | - | 感謝したこと |
| `tomorrow_goals` | string | - | 明日の目標 |
| `tomorrow_looking_forward` | string | - | 明日の楽しみ |
| `learnings` | string | - | 学んだこと・気づき |
| `health_habits` | string | - | 健康・習慣チェック |
| `today_in_one_word` | string | - | 今日を一言で |

**バリデーション**: `date` は必須。その他少なくとも1項目が入力されていること。

#### レスポンス

##### 成功時 (201 Created)
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "今日は素晴らしい一日でした。",
    "date": "2026-02-19",
    "weather": "sunny",
    "is_public": false,
    "created_at": "2026-02-19T10:00:00+09:00",
    "updated_at": "2026-02-19T10:00:00+09:00"
  }
}
```

##### エラー時 (400 Bad Request)
```json
{ "error": "日付は必須です" }
```

---

### 3.6 日記削除

```
DELETE /api/diaries/:id
```

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `id` | string (UUID) | ○ | 削除する日記のID |

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": { "message": "日記を削除しました" }
}
```

##### エラー時 (403 Forbidden)
```json
{ "error": "この日記を削除する権限がありません" }
```

##### エラー時 (404 Not Found)
```json
{ "error": "日記が見つかりません" }
```

---

### 3.7 公開設定切り替え

```
PATCH /api/diaries/:id/visibility
```

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `id` | string (UUID) | ○ | 対象の日記のID |

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
Content-Type: application/json
```

##### ボディ
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `is_public` | boolean | ○ | 公開フラグ |

```json
{
  "is_public": true
}
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "is_public": true,
    "updated_at": "2026-02-19T11:00:00+09:00"
  }
}
```

##### エラー時 (403 Forbidden)
```json
{ "error": "この日記を変更する権限がありません" }
```

---

### 3.8 公開日記一覧取得

```
GET /api/diaries/public
```

#### リクエスト
認証不要。パラメータなし。

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "content": "今日は素晴らしい一日でした。",
      "date": "2026-02-19",
      "weather": "sunny",
      "image_url": "/api/files/images/diary-image-1708185600000-123456789.jpg",
      "audio_url": null,
      "events": "プロジェクト完了",
      "emotions": "達成感がある",
      "good_things": null,
      "reflections": null,
      "gratitude": null,
      "tomorrow_goals": null,
      "tomorrow_looking_forward": null,
      "learnings": null,
      "health_habits": null,
      "today_in_one_word": "達成",
      "created_at": "2026-02-19T10:00:00+09:00",
      "author_name": "山田太郎",
      "author_photo": null
    }
  ]
}
```

> **ソート順**: `created_at DESC`  
> **件数制限**: 最新50件

---

### 3.9 画像アップロード

```
POST /api/upload/image
```

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

##### ボディ（Form Data）
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `image` | File | ○ | 画像ファイル |

##### 制約
- **ファイル形式**: image/* (MIME type)
- **最大ファイルサイズ**: 5MB (5,242,880 bytes)

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": {
    "image_url": "/api/files/images/diary-image-1708185600000-123456789.jpg",
    "filename": "diary-image-1708185600000-123456789.jpg",
    "original_name": "my-photo.jpg",
    "size": 1024567
  }
}
```

##### エラー時 (400 Bad Request)
```json
{ "error": "ファイルがアップロードされていません" }
```
```json
{ "error": "画像ファイルのみアップロード可能です" }
```
```json
{ "error": "ファイルサイズが大きすぎます（画像: 最大5MB）" }
```

---

### 3.10 音声アップロード

```
POST /api/upload/audio
```

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

##### ボディ（Form Data）
| フィールド名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `audio` | File | ○ | 音声ファイル |

##### 制約
- **ファイル形式**: MP3, WAV, OGG, M4A, AAC, WebM
- **最大ファイルサイズ**: 10MB (10,485,760 bytes)

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": {
    "audio_url": "/api/files/audio/diary-audio-1708185600000-987654321.mp3",
    "filename": "diary-audio-1708185600000-987654321.mp3",
    "original_name": "voice-memo.mp3",
    "size": 2048576,
    "mime_type": "audio/mpeg"
  }
}
```

##### エラー時 (400 Bad Request)
```json
{ "error": "音声ファイルがアップロードされていません" }
```
```json
{ "error": "音声ファイルのみアップロード可能です（MP3, WAV, OGG, M4A, AAC, WebM）" }
```
```json
{ "error": "ファイルサイズが大きすぎます（音声: 最大10MB）" }
```

---

### 3.11 ファイル削除

```
DELETE /api/files/:filename
```

#### パスパラメータ
| パラメータ名 | 型 | 必須 | 説明 |
|------------|-----|------|------|
| `filename` | string | ○ | 削除するファイル名 |

#### リクエスト

##### ヘッダー
```
Authorization: Bearer <token>
```

##### リクエスト例
```
DELETE /api/files/diary-image-1708185600000-123456789.jpg
DELETE /api/files/diary-audio-1708185600000-987654321.mp3
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "data": { "message": "ファイルが削除されました" }
}
```

##### エラー時 (403 Forbidden)
```json
{ "error": "アクセス拒否" }
```

##### エラー時 (404 Not Found)
```json
{ "error": "ファイルが見つかりません" }
```

#### セキュリティ
- パストラバーサル攻撃対策を実装
- `UPLOAD_DIR` 配下以外のファイルアクセスを防止

---

### 3.12 画像ファイル取得

```
GET /api/files/images/:filename
```

#### レスポンス

##### 成功時 (200 OK)
- **Content-Type**: 画像のMIME type（例: `image/jpeg`）
- **Body**: 画像ファイルのバイナリデータ

##### エラー時 (404 Not Found)
ファイルが存在しない場合

---

### 3.13 音声ファイル取得

```
GET /api/files/audio/:filename
```

#### レスポンス

##### 成功時 (200 OK)
- **Content-Type**: `audio/mpeg` 等
- **Body**: 音声ファイルのバイナリデータ

##### エラー時 (404 Not Found)
ファイルが存在しない場合

---

### 3.14 ヘルスチェック

```
GET /api/health
```

#### レスポンス

##### 成功時 (200 OK)
```json
{
  "status": "OK",
  "timestamp": "2026-02-19T10:00:00+09:00"
}
```

---

## 4. セキュリティ・制限

### 4.1 CORS設定
- **許可オリジン**: `ALLOWED_ORIGINS` 環境変数で設定（カンマ区切り複数指定可）
- **デフォルト**: `http://localhost:3000`
- **許可メソッド**: GET, POST, PATCH, DELETE, OPTIONS
- **許可ヘッダー**: Content-Type, Authorization

### 4.2 JWT設定
- **アルゴリズム**: HS256
- **有効期限**: 24時間（変更可能）
- **シークレットキー**: `JWT_SECRET` 環境変数で設定（必須）

### 4.3 ファイル検証

#### 画像アップロード
- MIME typeチェック: `image/*`
- ファイルサイズチェック: 最大5MB

#### 音声アップロード
- MIME typeチェック: audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/m4a, audio/aac, audio/webm
- 拡張子チェック: .mp3, .wav, .ogg, .m4a, .aac, .webm
- ファイルサイズチェック: 最大10MB

### 4.4 パストラバーサル対策
ファイル削除・取得時に、`UPLOAD_DIR` 外へのアクセスを防止する。

---

## 5. HTTPステータスコード

| コード | 説明 | 発生条件 |
|--------|------|---------|
| 200 | OK | リクエスト成功 |
| 201 | Created | リソース作成成功 |
| 400 | Bad Request | リクエストが不正（バリデーションエラーなど） |
| 401 | Unauthorized | 認証トークンなし・無効・期限切れ |
| 403 | Forbidden | アクセス権限なし（他人のリソース操作など） |
| 404 | Not Found | リソースが存在しない |
| 409 | Conflict | リソースの競合（メールアドレス重複など） |
| 500 | Internal Server Error | サーバー内部エラー |

---

## 6. ファイル命名規則

### 6.1 画像ファイル
```
diary-image-{unix_milli}-{random9digits}.{ext}
```
例: `diary-image-1708185600000-123456789.jpg`

### 6.2 音声ファイル
```
diary-audio-{unix_milli}-{random9digits}.{ext}
```
例: `diary-audio-1708185600000-987654321.mp3`

---

## 7. 今後の拡張予定

### 7.1 追加予定のエンドポイント
- `PUT /api/auth/me` - プロフィール更新
- `GET /api/diaries/:id` - 日記詳細取得
- `PUT /api/diaries/:id` - 日記更新
- 画像リサイズ・最適化API
- サムネイル生成API

---

**文書作成日**: 2026年2月19日  
**バージョン**: 1.0
