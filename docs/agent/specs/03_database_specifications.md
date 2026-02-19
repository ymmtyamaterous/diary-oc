# データベース仕様書

## 1. データベース概要

### 1.1 データベースシステム
- **種類**: PostgreSQL（リレーショナルデータベース）
- **バージョン**: 18.1 (alpine)
- **特徴**:
  - ACID準拠のトランザクション
  - 外部キー制約による参照整合性
  - インデックスによる高速検索
  - devcontainer 環境で Docker Compose により起動

### 1.2 接続設定（環境変数）

| 環境変数 | 説明 | 例 |
|---------|------|-----|
| `DATABASE_URL` | PostgreSQL接続文字列 | `postgres://user:password@postgres:5432/diarydb?sslmode=disable` |

---

## 2. テーブル一覧

| テーブル名 | 説明 | 備考 |
|-----------|------|------|
| `users` | ユーザー情報 | JWT認証のユーザー管理 |
| `diary_entries` | 日記エントリー | 日記本文・詳細項目・メディア情報 |

---

## 3. テーブル詳細仕様

### 3.1 users（ユーザー）

#### 3.1.1 概要
- **用途**: アプリケーションのユーザー情報を管理する
- **主キー**: `id`（UUID）

#### 3.1.2 カラム定義

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | ユーザーID（主キー） |
| `email` | VARCHAR(255) | NOT NULL | - | メールアドレス（一意） |
| `password_hash` | VARCHAR(255) | NOT NULL | - | bcryptハッシュ化されたパスワード |
| `display_name` | VARCHAR(255) | NOT NULL | - | 表示名 |
| `profile_image_url` | VARCHAR(500) | NULL | NULL | プロフィール画像URL |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | 作成日時 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | 更新日時 |

#### 3.1.3 制約

| 制約名 | 種別 | 対象カラム | 説明 |
|--------|------|-----------|------|
| `users_pkey` | PRIMARY KEY | `id` | 主キー制約 |
| `users_email_key` | UNIQUE | `email` | メールアドレスの一意制約 |

#### 3.1.4 カラム詳細

##### id (UUID)
- `gen_random_uuid()` によりDB側で自動生成
- 形式例: `"550e8400-e29b-41d4-a716-446655440000"`

##### email (VARCHAR)
- ユーザーのログイン識別子
- 英数字 + 記号、最大255文字
- 形式例: `"user@example.com"`

##### password_hash (VARCHAR)
- bcryptによりハッシュ化して保存
- 生のパスワードは保存しない
- 形式例: `"$2a$10$..."`

##### display_name (VARCHAR)
- 日記の公開時に表示される名前
- 形式例: `"山田太郎"`

##### profile_image_url (VARCHAR)
- プロフィール画像の相対URLまたは絶対URL
- 未設定の場合は NULL

#### 3.1.5 レコード例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "password_hash": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "display_name": "山田太郎",
  "profile_image_url": null,
  "created_at": "2026-02-19T10:00:00+09:00",
  "updated_at": "2026-02-19T10:00:00+09:00"
}
```

---

### 3.2 diary_entries（日記エントリー）

#### 3.2.1 概要
- **用途**: 日記エントリーの全情報を管理する
- **主キー**: `id`（UUID）
- **外部キー**: `user_id` → `users.id`

#### 3.2.2 カラム定義

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | エントリーID（主キー） |
| `user_id` | UUID | NOT NULL | - | ユーザーID（外部キー） |
| `content` | TEXT | NULL | NULL | メインコンテンツ（本文） |
| `date` | DATE | NOT NULL | - | 日記の日付（YYYY-MM-DD） |
| `weather` | VARCHAR(20) | NULL | NULL | 天気（選択値） |
| `is_public` | BOOLEAN | NOT NULL | `FALSE` | 公開フラグ |
| `image_url` | VARCHAR(500) | NULL | NULL | 画像URL（相対パス） |
| `image_name` | VARCHAR(255) | NULL | NULL | 画像ファイル名 |
| `audio_url` | VARCHAR(500) | NULL | NULL | 音声URL（相対パス） |
| `audio_name` | VARCHAR(255) | NULL | NULL | 音声ファイル名 |
| `events` | TEXT | NULL | NULL | 詳細項目：出来事 |
| `emotions` | TEXT | NULL | NULL | 詳細項目：感情 |
| `good_things` | TEXT | NULL | NULL | 詳細項目：よかったこと |
| `reflections` | TEXT | NULL | NULL | 詳細項目：反省点 |
| `gratitude` | TEXT | NULL | NULL | 詳細項目：感謝したこと |
| `tomorrow_goals` | TEXT | NULL | NULL | 詳細項目：明日の目標 |
| `tomorrow_looking_forward` | TEXT | NULL | NULL | 詳細項目：明日の楽しみ |
| `learnings` | TEXT | NULL | NULL | 詳細項目：学んだこと・気づき |
| `health_habits` | TEXT | NULL | NULL | 詳細項目：健康・習慣チェック |
| `today_in_one_word` | VARCHAR(100) | NULL | NULL | 詳細項目：今日を一言で |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | 作成日時 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | 更新日時 |

#### 3.2.3 制約

| 制約名 | 種別 | 対象カラム | 説明 |
|--------|------|-----------|------|
| `diary_entries_pkey` | PRIMARY KEY | `id` | 主キー制約 |
| `diary_entries_user_id_fkey` | FOREIGN KEY | `user_id` → `users.id` | ON DELETE CASCADE |

#### 3.2.4 カラム詳細

##### date (DATE)
- 日記の日付（実際に日記を書いた日、またはユーザーが指定した日付）
- 形式: `YYYY-MM-DD`
- 例: `"2026-02-19"`

##### weather (VARCHAR)
- 天気情報を文字列で保存
- **選択肢**:
  - `"sunny"` - 晴れ ☀️
  - `"cloudy"` - 曇り ☁️
  - `"rainy"` - 雨 🌧️
  - `"snowy"` - 雪 ❄️
  - `"stormy"` - 嵐 ⛈️
  - `"foggy"` - 霧 🌫️
  - `"partly-cloudy"` - 晴れ時々曇り ⛅
  - `"windy"` - 風が強い 💨

##### is_public (BOOLEAN)
- `TRUE`: 公開（他のユーザーも閲覧可能）
- `FALSE`: 非公開（本人のみ閲覧可能）
- デフォルト: `FALSE`

##### image_url / audio_url (VARCHAR)
- バックエンドが配信する相対パス
- 例: `"/api/files/images/diary-image-1708185600000-123456789.jpg"`
- NULL の場合はメディアなし

#### 3.2.5 レコード例

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "今日は素晴らしい一日でした。新しいプロジェクトが無事に完了しました。",
  "date": "2026-02-19",
  "weather": "sunny",
  "is_public": true,
  "image_url": "/api/files/images/diary-image-1708185600000-123456789.jpg",
  "image_name": "diary-image-1708185600000-123456789.jpg",
  "audio_url": "/api/files/audio/diary-audio-1708185600000-987654321.mp3",
  "audio_name": "diary-audio-1708185600000-987654321.mp3",
  "events": "朝からプロジェクトの最終レビューを実施。午後にはクライアントへのプレゼンテーションを行いました。",
  "emotions": "達成感と安堵感でいっぱいです。",
  "good_things": "クライアントから高評価をいただけたこと。",
  "reflections": "もう少し早く準備を始めれば良かった。",
  "gratitude": "チームメンバー全員に感謝。",
  "tomorrow_goals": "プロジェクトの振り返りミーティングで良い議論をする。",
  "tomorrow_looking_forward": "プロジェクト完了の打ち上げパーティー！",
  "learnings": "計画的に進めることの重要性を再認識。",
  "health_habits": "朝のジョギング30分、野菜中心の食事、睡眠7時間確保予定。",
  "today_in_one_word": "達成",
  "created_at": "2026-02-19T10:00:00+09:00",
  "updated_at": "2026-02-19T10:00:00+09:00"
}
```

---

## 4. DDL（テーブル定義SQL）

```sql
-- UUID拡張の有効化
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- usersテーブル
CREATE TABLE users (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    display_name     VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_pkey      PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- diary_entriesテーブル
CREATE TABLE diary_entries (
    id                        UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id                   UUID         NOT NULL,
    content                   TEXT,
    date                      DATE         NOT NULL,
    weather                   VARCHAR(20),
    is_public                 BOOLEAN      NOT NULL DEFAULT FALSE,
    image_url                 VARCHAR(500),
    image_name                VARCHAR(255),
    audio_url                 VARCHAR(500),
    audio_name                VARCHAR(255),
    events                    TEXT,
    emotions                  TEXT,
    good_things               TEXT,
    reflections               TEXT,
    gratitude                 TEXT,
    tomorrow_goals            TEXT,
    tomorrow_looking_forward  TEXT,
    learnings                 TEXT,
    health_habits             TEXT,
    today_in_one_word         VARCHAR(100),
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT diary_entries_pkey          PRIMARY KEY (id),
    CONSTRAINT diary_entries_user_id_fkey  FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 5. インデックス設計

### 5.1 インデックス一覧

| インデックス名 | テーブル | カラム | 種別 | 用途 |
|--------------|---------|--------|------|------|
| `users_pkey` | `users` | `id` | PRIMARY KEY | ユーザーID検索 |
| `users_email_key` | `users` | `email` | UNIQUE | ログイン時のメール検索 |
| `diary_entries_pkey` | `diary_entries` | `id` | PRIMARY KEY | エントリーID検索 |
| `idx_diary_entries_user_id` | `diary_entries` | `user_id` | INDEX | ユーザー別日記一覧取得 |
| `idx_diary_entries_public` | `diary_entries` | `is_public, created_at DESC` | INDEX | 公開日記一覧取得 |
| `idx_diary_entries_date` | `diary_entries` | `user_id, date DESC` | INDEX | 日付順の日記一覧取得 |

### 5.2 インデックス作成SQL

```sql
-- ユーザー別日記取得用
CREATE INDEX idx_diary_entries_user_id
    ON diary_entries (user_id);

-- 公開日記取得用（is_public + 日時降順）
CREATE INDEX idx_diary_entries_public
    ON diary_entries (is_public, created_at DESC)
    WHERE is_public = TRUE;

-- ユーザー別日付順取得用
CREATE INDEX idx_diary_entries_date
    ON diary_entries (user_id, date DESC, created_at DESC);
```

---

## 6. クエリパターン

### 6.1 ユーザーの日記一覧取得
```sql
SELECT *
FROM diary_entries
WHERE user_id = $1
ORDER BY date DESC, created_at DESC;
```

### 6.2 公開日記一覧取得（最新50件）
```sql
SELECT
    de.*,
    u.display_name  AS author_name,
    u.profile_image_url AS author_photo
FROM diary_entries de
JOIN users u ON u.id = de.user_id
WHERE de.is_public = TRUE
ORDER BY de.created_at DESC
LIMIT 50;
```

### 6.3 日記の作成
```sql
INSERT INTO diary_entries (
    user_id, content, date, weather, is_public,
    image_url, image_name, audio_url, audio_name,
    events, emotions, good_things, reflections,
    gratitude, tomorrow_goals, tomorrow_looking_forward,
    learnings, health_habits, today_in_one_word
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12, $13,
    $14, $15, $16,
    $17, $18, $19
)
RETURNING *;
```

### 6.4 公開設定の切り替え
```sql
UPDATE diary_entries
SET is_public = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3
RETURNING *;
```

### 6.5 日記の削除
```sql
DELETE FROM diary_entries
WHERE id = $1 AND user_id = $2;
```

---

## 7. マイグレーション方針

- マイグレーションは Go で実行可能な CLI コマンドとして実装する
- コマンド例: `go run ./cmd/migrate up`
- マイグレーションファイルはバージョン管理し、`backend/migrations/` 配下に配置する
- 適用済みマイグレーションは `schema_migrations` テーブルで管理する

---

## 8. データ容量見積もり

### 8.1 レコードサイズ

| テーブル | 標準サイズ | 備考 |
|---------|----------|------|
| `users` | 約0.5KB/レコード | テキストフィールド少 |
| `diary_entries` | 約2-8KB/レコード | テキストフィールド多 |

### 8.2 ストレージ見積もり（1,000ユーザー想定）

| 期間 | エントリー数 | データ容量 |
|------|------------|----------|
| 1ヶ月 | 30,000 | 約150MB |
| 1年 | 360,000 | 約1.8GB |
| 5年 | 1,800,000 | 約9GB |

**注**: 画像・音声ファイルは `UPLOAD_DIR` 配下に保存されるため、PostgreSQL容量には含まれない

---

## 9. 今後の拡張

### 9.1 新規テーブル候補
- **tags**: タグ情報
- **diary_tags**: 日記とタグの中間テーブル
- **comments**: 日記へのコメント
- **likes**: いいね情報

---

**文書作成日**: 2026年2月19日  
**バージョン**: 1.0
