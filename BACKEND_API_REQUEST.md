# QuestLogic バックエンド API 追加依頼書

> 作成日: 2026-03-06
> 依頼元: QuestLogic フロントエンドチーム（親用モバイルアプリ）
> 対象リポジトリ: QuestLogic（メインバックエンド）

---

## 依頼概要

親用モバイルアプリのAPI接続実装にあたり、以下の5件についてバックエンド側のエンドポイント追加・修正を依頼します。
優先度順に記載しています。各エンドポイントの詳細は以降のセクションを参照してください。

| # | 依頼内容 | 区分 | 優先度 |
|---|---------|------|--------|
| 1 | ゲーム管理系API（状態取得・強制ロック・時間延長） | 新規追加 | 高 |
| 2 | `GET /api/quests` レスポンスへの画像・教科情報追加 | 既存修正 | 高 |
| 3 | `GET /api/quests` レスポンスへの親向けAIフィードバック追加 | 既存修正 | 中 |
| 4 | AI設定の取得・更新API | 新規追加 | 中 |
| 5 | デバイス管理API | 新規追加 | 低 |

---

## 共通仕様

### 認証

全エンドポイントは `Authorization: Bearer <JWT>` ヘッダーが必須です。

```
Authorization: Bearer eyJhbGciOi...
```

JWTは `GET /api/test/login/parent` のレスポンスの `token` フィールドから取得します。

### エラーレスポンス

```json
{ "error": "エラー内容を説明するメッセージ" }
```

- `success: false` は返さない（既存仕様に準拠）
- エラーはHTTPステータスコード（4xx / 5xx）と `error` フィールドで判定する

### パスパラメータ

| パラメータ | 取得元 |
|-----------|--------|
| `:familyId` | ログインレスポンスの `user.familyId` |

---

## 依頼 1: ゲーム管理系API（新規追加）

### 背景

親用アプリのホーム画面には、子供のゲーム・スマホ残り時間の表示、強制ロック・解除、時間延長の機能があります。
現在これらに対応するエンドポイントが存在しないため、以下3本の追加を依頼します。

---

### 1-A. 子供のゲーム状態取得

```
GET /api/family/:familyId/game-status
Authorization: Bearer <token>
```

**レスポンス（200 OK）**

```json
{
  "success": true,
  "gameRemainingMinutes": 45,
  "smartphoneRemainingMinutes": 30,
  "isForceLocked": false
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `gameRemainingMinutes` | number | ゲームの残り時間（分） |
| `smartphoneRemainingMinutes` | number | スマホの残り時間（分） |
| `isForceLocked` | boolean | 強制ロック中かどうか |

---

### 1-B. 強制ロック・解除

```
POST /api/family/:familyId/lock
Authorization: Bearer <token>
Content-Type: application/json
```

**リクエストボディ**

```json
{ "locked": true }
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `locked` | boolean | `true` でロック、`false` で解除 |

**レスポンス（200 OK）**

```json
{ "success": true, "locked": true }
```

---

### 1-C. 時間延長

```
POST /api/family/:familyId/extend-time
Authorization: Bearer <token>
Content-Type: application/json
```

**リクエストボディ**

```json
{ "minutes": 30 }
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `minutes` | number | 延長する分数（正の整数） |

**レスポンス（200 OK）**

```json
{ "success": true, "newRemainingMinutes": 75 }
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `newRemainingMinutes` | number | 延長後の残り時間（分） |

---

## 依頼 2: `GET /api/quests` への画像・教科情報追加（既存修正）

### 背景

ホーム画面の「宿題の確認」セクションで、子供が提出した宿題のビフォー/アフター画像と教科・トピック情報を表示したいです。
現在 `GET /api/quests` のレスポンスにこれらのフィールドが含まれていないため、追加をお願いします。

### 現状のレスポンス（抜粋）

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "familyId": "family_id",
      "status": "COMPLETED",
      "earnedPoints": 32,
      "child": { "name": "テスト生徒", "avatarUrl": null }
    }
  ]
}
```

### 追加をお願いするフィールド

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "familyId": "family_id",
      "status": "COMPLETED",
      "earnedPoints": 32,
      "child": { "name": "テスト生徒", "avatarUrl": null },
      "beforeImageUrl": "https://example.com/before.jpg",
      "afterImageUrl": "https://example.com/after.jpg",
      "subject": "算数",
      "topic": "文字と式"
    }
  ]
}
```

| 追加フィールド | 型 | 説明 |
|--------------|-----|------|
| `beforeImageUrl` | string \| null | 宿題開始前の画像URL |
| `afterImageUrl` | string \| null | 宿題完了後の画像URL |
| `subject` | string \| null | 教科名（例: 算数、国語） |
| `topic` | string \| null | トピック・単元名（例: 文字と式） |

> **代替案:** `GET /api/quests/:id` が実装済みとのことですが、現在ルートに未接続とのことです。公開していただけるのであれば、個別取得APIを使う形でも対応可能です。

---

## 依頼 3: `GET /api/quests` への親向けAIフィードバック追加（既存修正）

### 背景

チャット画面では、AIが宿題を評価した結果のフィードバックを日付ごとに表示します。
現在 `GET /api/quests` の `aiResult` に `feedback_to_parent`（親向けフィードバック）が含まれていないため、追加をお願いします。

### 追加をお願いするフィールド

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "createdAt": "2026-03-06T10:00:00Z",
      "aiResult": {
        "feedback_to_child": "よく頑張ったね！",
        "feedback_to_parent": "途中式が丁寧に書けています。計算ミスは少なく、理解度は高いと思われます。"
      }
    }
  ]
}
```

| 追加フィールド | 型 | 説明 |
|--------------|-----|------|
| `aiResult.feedback_to_parent` | string \| null | 保護者向けのAI評価コメント |

> `createdAt` は既存フィールドです。フロント側でこの値を使って日付ごとにグルーピングして表示します。

---

## 依頼 4: AI設定の取得・更新API（新規追加）

### 背景

設定画面でAIの採点方針（厳しさ・重視点・NG行為）を親が設定できる機能を実装したいです。
対応するAPIがないため、取得と更新のエンドポイント追加をお願いします。

---

### 4-A. AI設定取得

```
GET /api/settings/ai
Authorization: Bearer <token>
```

**レスポンス（200 OK）**

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

---

### 4-B. AI設定更新

```
PATCH /api/settings/ai
Authorization: Bearer <token>
Content-Type: application/json
```

**リクエストボディ**

```json
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

**フィールド定義**

| フィールド | 型 | 説明 | 値の範囲 |
|-----------|-----|------|---------|
| `strictness` | number | 採点の厳しさ | 1〜5（整数） |
| `focus` | number | 重視する観点 | 1〜5（整数） |
| `ng.missingProcess` | boolean | 途中式なしをNGとする | true / false |
| `ng.workTimeMismatch` | boolean | 作業時間の不一致をNGとする | true / false |
| `ng.imageReuse` | boolean | 画像の使い回しをNGとする | true / false |

**レスポンス（200 OK）**

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

> PATCHなので、送信したフィールドのみ更新（部分更新）にしていただけると望ましいです。

---

## 依頼 5: デバイス管理API（新規追加）

### 背景

設定画面の「デバイス連携」モーダルで、ファミリーに紐づく子供のデバイス一覧を表示したいです。
対応するAPIがないため追加をお願いします。

---

### 5-A. デバイス一覧取得

```
GET /api/family/:familyId/devices
Authorization: Bearer <token>
```

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": [
    { "id": "d1", "name": "Nintendo Switch" },
    { "id": "d2", "name": "Android スマートフォン" }
  ]
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | デバイスの一意ID |
| `name` | string | デバイス表示名 |

---

## 確認事項・質問

依頼内容についてご不明点や仕様の相違がある場合は、以下の点を中心にご連絡ください。

1. **`familyId` の取得方法**: ログインレスポンスの `user.familyId` を使う想定ですが、問題ないか確認させてください
2. **AI設定のスコープ**: AI設定はユーザー単位（親）か、ファミリー単位か確認させてください
3. **ゲーム状態の計算ロジック**: `gameRemainingMinutes` の算出方法（ポイント換算など）についてご共有いただけると実装の参考になります
4. **`GET /api/quests/:id` の公開**: 依頼2の代替案として検討したいため、公開可能か確認させてください

---

*本ドキュメントは QuestLogic フロントエンドチームが作成しました。*
*ご対応よろしくお願いいたします。*


バックエンドチームからの返答

フロントエンドチームへの回答 
1. familyId の取得方法とURLパスパラメータの扱いについて
セキュリティ（ID改ざんによる他家族のデータ閲覧防止）のため、URLパスに :familyId を含めないようAPI仕様を変更しました。フロントエンドはURLにIDを埋め込む必要はなく、通常通りヘッダーにJWTトークンを含めて GET /api/family/game-status 等へリクエストしていただければ、バックエンドがトークン内の安全な familyId を抽出して処理します。

2. AI設定のスコープ
AI設定はデータの一貫性を保つため、親個人単位ではなく**「家族（Family）単位」**として保存および適用されます。

3. ゲーム状態（gameRemainingMinutes）の計算ロジック
先日確立した「バックエンド主導のポイントモデル」に基づいて算出されます。家族内の子供が保有している現在のポイント（currentPoints）に、家族の1ポイントあたりのゲーム時間設定値（minutesPerPoint）を掛け合わせて計算されます。（例: 20pt × 5分 = 100分）

4. GET /api/quests/:id の公開について（依頼2の代替案）
一覧を表示するたびに詳細取得APIを何度も呼ぶこと（N+1問題）は、アプリのパフォーマンス低下を招く恐れがあります。これを防ぐため、既存の GET /api/quests の一覧レスポンス自体に、画像URL、教科、親向けAIフィードバックのフィールドを全て含めて返すようにバックエンド側で対応を完了しました！そのため、個別取得APIを別途使用していただく必要はありません。