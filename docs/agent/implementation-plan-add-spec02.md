# 実装計画書 (add-spec02.md 対応)

**作成日**: 2026年2月22日  
**対象スペック**: `/workspace/docs/user/add-spec02.md`

---

## 対応内容

| # | 種別 | 内容 |
|---|------|------|
| 1 | バグ修正 | 音声ファイル選択時に400のエラーが出る |
| 2 | 追加仕様 | 保存済み日記の編集機能 |
| 3 | 追加仕様 | 設定画面の新規作成（日記フォーム項目の表示/非表示） |

---

## 1. バグ修正: 音声ファイルアップロード時の400エラー

### 原因分析

`backend/internal/server/server.go` の `saveUpload` 関数内で、Go 標準の `http.DetectContentType` によるMIME型判定を行っている。  
Go の `http.DetectContentType` は先頭512バイトのマジックバイトを使って判定するが、**音声ファイルのMIME型検出サポートが不十分**であり、以下の問題が発生している。

| ファイル種別 | `DetectContentType` が返す型 | 許可リスト |
|---|---|---|
| MP3 (ID3タグ付き) | `application/octet-stream` | ❌ 含まれない |
| M4A | `video/mp4` | ❌ `audio/mp4` を期待しているが不一致 |
| AAC | `application/octet-stream` | ❌ 含まれない |
| WebM (音声) | `video/webm` | ❌ `audio/webm` を期待しているが不一致 |
| WAV | `audio/x-wav` | ✅ 含まれる |
| OGG | `audio/ogg` | ✅ 含まれる |

すでに `isAllowedAudioExt` で拡張子バリデーションを行っているため、MIME型チェックは拡張子から推定する方式に変更する。

### 修正方針

`saveUpload` 関数の音声用コードパスにおける MIME 型チェックを、**拡張子ベースの MIME 型マッピング**に変更する。  
（`http.DetectContentType` の呼び出し自体は画像用に残す）

### 修正対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `backend/internal/server/server.go` | `saveUpload` 内の音声MIME型チェックを拡張子ベースに変更 |

---

## 2. 追加仕様: 保存済み日記の編集機能

### 概要

日記一覧の各エントリーに「編集」ボタンを追加し、モーダル内で内容を編集・保存できるようにする。

### バックエンド変更

#### 2.1 新規エンドポイント追加

`PUT /api/diaries/:id` を追加する。

- **認証**: 必要（JWT）
- **パス**: `/api/diaries/{id}`
- **メソッド**: `PUT`
- **リクエストボディ**: 日記作成 (`POST /api/diaries`) と同じフィールド構成
- **レスポンス**: 更新後の `DiaryEntry` オブジェクト (200 OK)
- **エラー**: 404 (存在しない) / 403 (他人の日記) / 400 (バリデーション失敗)

#### 修正対象ファイル (バックエンド)

| ファイル | 変更内容 |
|---------|---------|
| `backend/internal/server/server.go` | `handleUpdateDiary` ハンドラ追加、`Router()` にルート登録 |
| `backend/openapi.yaml` | `PUT /api/diaries/{id}` エンドポイントの定義追加 |

#### 2.2 バックエンドテスト

`validation_test.go` と同じパターンで、バリデーション周りのユニットテストを追加する。

### フロントエンド変更

#### 2.3 編集モーダルの追加

`DiaryCard` コンポーネントに「編集」ボタンを追加し、`diary/page.tsx` 内でモーダルを管理する。

**UXフロー**:
1. 日記カードの「編集」ボタンをクリック
2. 既存の日記内容が入力済みのモーダルが表示される
3. 内容を変更して「保存する」ボタンを押す
4. API呼び出し後、一覧を再取得してモーダルを閉じる

**モーダル仕様**:
- 背景は `bg-black/50` で半透明
- 新規作成フォームと同じフィールド構成
- 音声・画像の変更も可能（再アップロード対応）

#### 修正対象ファイル (フロントエンド)

| ファイル | 変更内容 |
|---------|---------|
| `frontend/components/DiaryCard.tsx` | `onEdit?: () => void` prop を追加し、「編集」ボタンを表示 |
| `frontend/app/diary/page.tsx` | 編集モーダルのUI・ステート・API呼び出しを追加 |
| `frontend/lib/types.ts` | 必要に応じて型を追加（EditDiaryForm など） |

---

## 3. 追加仕様: 設定画面（日記フォーム項目の表示/非表示）

### 概要

新規に設定画面 (`/settings`) を作成する。  
設定画面では、マイ日記登録フォームに表示する詳細10項目（出来事、感情、よかったことなど）の表示/非表示を個別に切り替えられる。  
設定はブラウザの `localStorage` に保存し、次回アクセス時も維持する。

### 設定対象の項目

| フィールドキー | 表示名 |
|---|---|
| `events` | 📝 出来事 |
| `emotions` | 💭 感情 |
| `good_things` | 😊 よかったこと |
| `reflections` | 🤔 反省点 |
| `gratitude` | 🙏 感謝したこと |
| `tomorrow_goals` | 🎯 明日の目標 |
| `tomorrow_looking_forward` | ✨ 明日の楽しみ |
| `learnings` | 💡 学んだこと・気づき |
| `health_habits` | 💪 健康・習慣チェック |
| `today_in_one_word` | 🏷️ 今日を一言で |

### localStorage のデータ構造

```json
// キー: "diary-field-settings"
{
  "events": true,
  "emotions": true,
  "good_things": false,
  "reflections": true,
  "gratitude": false,
  "tomorrow_goals": true,
  "tomorrow_looking_forward": false,
  "learnings": true,
  "health_habits": false,
  "today_in_one_word": true
}
```

デフォルト値はすべて `true`（全項目表示）とする。

### 画面構成

```
/settings

┌──────────────────────────────────────────────────┐
│ ヘッダー                                           │
├──────────────────────────────────────────────────┤
│ 設定                                              │
│                                                  │
│ 【日記フォームの表示項目】                          │
│ マイ日記の登録フォームに表示する項目を選択できます。   │
│                                                  │
│ ☑ 📝 出来事                                       │
│ ☑ 💭 感情                                         │
│ ☐ 😊 よかったこと                                  │
│ ☑ 🤔 反省点                                       │
│  ...                                             │
│                                                  │
│        [設定を保存する]                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### フロントエンド変更

| ファイル | 変更内容 |
|---------|---------|
| `frontend/app/settings/page.tsx` | 設定画面の新規作成 |
| `frontend/lib/settings.ts` | localStorage 操作ユーティリティの新規作成 |
| `frontend/components/AppHeader.tsx` | ヘッダーに「設定」リンク (`/settings`) を追加 |
| `frontend/app/diary/page.tsx` | `settings.ts` から設定を読み込み、フォームの表示/非表示を制御 |

---

## 実装順序

| 順序 | タスク | 対象 |
|------|--------|------|
| 1 | バグ修正: 音声MIME型チェックを拡張子ベースに変更 | Backend |
| 2 | バックエンド: `PUT /api/diaries/:id` ハンドラ追加 | Backend |
| 3 | バックエンド: `openapi.yaml` 更新 | Backend |
| 4 | バックエンド: テスト追加 | Backend |
| 5 | フロントエンド: 設定ユーティリティ (`settings.ts`) 作成 | Frontend |
| 6 | フロントエンド: 設定画面 (`settings/page.tsx`) 作成 | Frontend |
| 7 | フロントエンド: ヘッダーに設定リンク追加 | Frontend |
| 8 | フロントエンド: マイ日記フォームへの設定反映 | Frontend |
| 9 | フロントエンド: `DiaryCard` に編集ボタン追加 | Frontend |
| 10 | フロントエンド: 編集モーダル実装 | Frontend |

---

## 影響範囲まとめ

```
backend/
  internal/server/server.go     ← バグ修正 + 編集ハンドラ追加
  openapi.yaml                   ← 編集エンドポイント追加

frontend/
  lib/settings.ts                ← 新規作成（設定ユーティリティ）
  lib/types.ts                   ← 必要に応じて型追加
  app/settings/page.tsx          ← 新規作成（設定画面）
  app/diary/page.tsx             ← 編集モーダル追加 + 設定反映
  components/AppHeader.tsx       ← 設定リンク追加
  components/DiaryCard.tsx       ← 編集ボタン追加
```

---

**バージョン**: 1.0  
**ステータス**: 計画中
