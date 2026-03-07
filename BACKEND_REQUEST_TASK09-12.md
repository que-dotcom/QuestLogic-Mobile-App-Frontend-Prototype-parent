# バックエンド依頼書 — TASK-09〜12 追加API実装

> 作成日: 2026-03-07
> 依頼元: フロントエンド担当
> 関連依頼書: `BACKEND_REQUEST_TASK07.md`（ゲーム状態管理API）

---

## 依頼概要

親用アプリ（QuestLogic-Mobile-App-Frontend-Prototype-parent）において、以下の4機能がモックデータのまま固定表示されています。実データを表示するために、バックエンドAPIの追加・修正をお願いします。

| # | 機能 | 影響画面 | 優先度 |
|---|------|---------|--------|
| TASK-09 | 宿題画像（ビフォー/アフター）取得 | ホーム画面 | 高 |
| TASK-10 | AI分析レポート（チャット）取得 | チャット画面 | 高 |
| TASK-11 | AI設定の取得・保存 | 設定画面 | 中 |
| TASK-12 | 連携デバイス一覧取得 | 設定画面 | 低 |

---

## 共通仕様

### 認証

全エンドポイントにJWT認証が必要です。

```
Authorization: Bearer <token>
```

トークンはログインAPI（`GET /api/test/login/parent`）のレスポンス `token` フィールドから取得します。

### エラーレスポンス（既存仕様 `back_to_front.md § 3.2` に準拠）

```json
{ "error": "エラー内容の文字列" }
```

- `success: false` は返さない
- HTTPステータスコードと `error` フィールドで判定する

---

## TASK-09 宿題画像取得

### 背景・現状

ホーム画面の「宿題の確認」セクションでは、子供が提出した宿題のビフォー/アフター画像と教科名を表示したい。
現在は `mock_home.json` のプレースホルダー画像URL（`https://via.placeholder.com/150`）を使用しており、実際の画像が表示されていない。

### 依頼内容

既存の `GET /api/quests` レスポンスに以下のフィールドを追加してください。

```
GET /api/quests
Authorization: Bearer <token>
```

**追加するフィールド:**

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "familyId": "family_id",
      "status": "COMPLETED",
      "earnedPoints": 32,
      "child": {
        "name": "テスト生徒",
        "avatarUrl": null
      },
      "beforeImageUrl": "https://storage.example.com/quests/quest_id/before.jpg",
      "afterImageUrl": "https://storage.example.com/quests/quest_id/after.jpg",
      "subject": "算数",
      "topic": "文字と式"
    }
  ]
}
```

**追加フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `beforeImageUrl` | string \| null | 宿題開始前の画像URL。未提出の場合は `null` |
| `afterImageUrl` | string \| null | 宿題完了後の画像URL。未提出の場合は `null` |
| `subject` | string \| null | 教科名（例: `"算数"`, `"国語"`）。不明の場合は `null` |
| `topic` | string \| null | 単元名（例: `"文字と式"`）。不明の場合は `null` |

> **代替案:** `GET /api/quests` への追加が難しい場合、現在未接続の `GET /api/quests/:id` エンドポイントを公開する方法でも対応可能です。ご相談ください。

### フロントエンド側の対応（API確定後）

- `HomeworkImage` 型に `beforeImageUrl` / `afterImageUrl` / `subject` / `topic` を追加
- `HomeworkContent` コンポーネントの `imageUrl` をAPIから取得した値に差し替え
- `mock_home.json` の `homeworkImages` を削除

---

## TASK-10 AI分析レポート取得

### 背景・現状

チャット画面では子供の学習に対する「親向けAI分析レポート」を日付ごとに表示したい。
現在は `mock_chat.json` のハードコードされたテキストを表示しており、実際のAI分析結果が反映されていない。

### 依頼内容

既存の `GET /api/quests` レスポンスに以下のフィールドを追加してください。

```
GET /api/quests
Authorization: Bearer <token>
```

**追加するフィールド:**

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "status": "COMPLETED",
      "createdAt": "2026-03-07T10:00:00Z",
      "earnedPoints": 32,
      "child": {
        "name": "テスト生徒",
        "avatarUrl": null
      },
      "aiResult": {
        "feedback_to_child": "よく頑張ったね！途中式も丁寧に書けていたよ。",
        "feedback_to_parent": "途中式が丁寧に書けています。一部の設問で見直しが必要ですが、集中力は最後まで維持できていました。"
      }
    }
  ]
}
```

**追加フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `createdAt` | string | ISO 8601形式のタイムスタンプ。日付グルーピングに使用 |
| `aiResult` | object \| null | AI分析結果。分析未完了の場合は `null` |
| `aiResult.feedback_to_child` | string | 子供向けフィードバック（チャット画面では非表示） |
| `aiResult.feedback_to_parent` | string | **親向けフィードバック（チャット画面に表示するテキスト）** |

### フロントエンド側の対応（API確定後）

- `ChatScreen.tsx` で `GET /api/quests` を呼び、`aiResult.feedback_to_parent` を `createdAt` で日付グルーピングして表示
- `mock_chat.json` を削除

---

## TASK-11 AI設定の取得・保存

### 背景・現状

設定画面では以下の3つのAI分析設定を親が変更できる。

- **厳しさ**: スライダーでレベル1〜5（AI採点の厳しさ）
- **重視点**: スライダーでレベル1〜3（途中経過重視 〜 字の丁寧さ重視）
- **NG行為**: 3種類のON/OFFトグル

現在は `mock_setting.json` の固定値を表示しており、「変更する」ボタンを押しても `Alert` を表示するだけで実際には保存されていない。

### 依頼内容

以下2エンドポイントの新規作成をお願いします。

#### AI設定取得

```
GET /api/settings/ai
Authorization: Bearer <token>
```

**期待するレスポンス (200 OK):**

```json
{
  "success": true,
  "data": {
    "strictness": 3,
    "focus": 2,
    "ng": {
      "missingProcess": true,
      "workTimeMismatch": false,
      "imageReuse": false
    }
  }
}
```

#### AI設定更新

```
PATCH /api/settings/ai
Authorization: Bearer <token>
Content-Type: application/json

{
  "strictness": 3,
  "focus": 2,
  "ng": {
    "missingProcess": true,
    "workTimeMismatch": false,
    "imageReuse": false
  }
}
```

**期待するレスポンス (200 OK):**

```json
{
  "success": true
}
```

**フィールド定義:**

| フィールド | 型 | 値の範囲 | 説明 |
|-----------|-----|---------|------|
| `strictness` | number | 1〜5 | AI採点の厳しさレベル |
| `focus` | number | 1〜3 | 重視点レベル（1:途中経過重視 / 2:バランス / 3:字の丁寧さ重視） |
| `ng.missingProcess` | boolean | — | 途中式・プロセスの欠落を検閲するか |
| `ng.workTimeMismatch` | boolean | — | 作業量と時間の不整合を検閲するか |
| `ng.imageReuse` | boolean | — | 画像の不一致・使い回しを検閲するか |

> **設定の保持単位:** 設定はユーザー（親）単位で保持してください。ファミリー単位での共有は不要です。

### フロントエンド側の対応（API確定後）

- 設定画面表示時（`useEffect`）に `GET /api/settings/ai` で初期値を取得
- 各「変更する」ボタン押下時に `PATCH /api/settings/ai` を呼ぶ
- `mock_setting.json` の `aiSettings` を削除

---

## TASK-12 連携デバイス一覧取得

### 背景・現状

設定画面の「デバイス連携」アイコン押下で開くモーダルに、子供が使用するデバイスの一覧を表示したい。
現在は `mock_setting.json` の固定リスト（スイッチ2、androidスマートフォン、playstation5）を使用しており、実際のデバイス情報が表示されていない。

### 依頼内容

以下エンドポイントの新規作成をお願いします。

```
GET /api/family/:familyId/devices
Authorization: Bearer <token>
```

**リクエストパラメータ:**

| パラメータ | 場所 | 説明 |
|-----------|------|------|
| `familyId` | パスパラメータ | ログイン時に取得できる `user.familyId` を使用 |

**期待するレスポンス (200 OK):**

```json
{
  "success": true,
  "data": [
    { "id": "d1", "name": "スイッチ2" },
    { "id": "d2", "name": "androidスマートフォン" },
    { "id": "d3", "name": "playstation5" }
  ]
}
```

**フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | デバイスの一意ID |
| `name` | string | デバイスの表示名 |

> デバイスが0件の場合は `"data": []` を返してください。

### フロントエンド側の対応（API確定後）

- `SettingScreen.tsx` でデバイス連携モーダルを開く際に `GET /api/family/:familyId/devices` を呼ぶ
- `DeviceModal` に渡す `devices` をAPIから取得した値に差し替え
- `mock_setting.json` の `devices` を削除

---

## 実装後の確認依頼

各エンドポイントが実装されましたら、以下を共有していただけると助かります。

1. **エンドポイントのURL確定通知**（パスが変わる場合）
2. **実際のレスポンスサンプル**（型の差異がないか確認するため）
3. **認証エラー時のHTTPステータスコード**（401 or 403）

---

## 質問・相談事項

- TASK-09: `GET /api/quests` へのフィールド追加と `GET /api/quests/:id` 公開のどちらが実装しやすいか
- TASK-10: `createdAt` は既にDBに存在するフィールドか
- TASK-11: AI設定はユーザー単位とファミリー単位のどちらで管理するか
- TASK-12: デバイスの登録・削除はバックエンド管理画面で行う想定か、それとも親アプリからも操作できる必要があるか
