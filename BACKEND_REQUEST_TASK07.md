# バックエンド依頼書 — TASK-07 ゲーム状態管理API

> 作成日: 2026-03-07
> 依頼元: フロントエンド担当
> 優先度: 高（フロントの表示がモックデータのまま固定されているため）

---

## 背景・現状の問題

親用アプリのホーム画面「スマホ・ゲーム管理」セクションでは、子供の現在のゲーム残り時間・スマホ残り時間・強制ロック状態を表示している。

しかし現在フロントエンドはこれらをモックデータ（固定値）で表示している。
アプリを起動するたびに「残り45分」と表示されてしまい、実態を反映していない。

```
現状の問題:
├── gameRemainingMinutes    → 常に 45（固定）
├── smartphoneRemainingMinutes → 常に 30（固定）
└── isForceLocked           → 常に false（固定）
```

---

## 依頼内容

以下の **4エンドポイント** の追加をお願いします。

---

### 1. 子供のゲーム状態取得

ホーム画面表示時に呼び出し、現在の残り時間と強制ロック状態を取得します。

```
GET /api/family/:familyId/game-status
Authorization: Bearer <JWT>
```

**リクエストパラメータ:**

| パラメータ | 場所 | 説明 |
|-----------|------|------|
| `familyId` | パスパラメータ | ログイン時に取得できる `user.familyId` を使用 |

**期待するレスポンス (200 OK):**

```json
{
  "success": true,
  "gameRemainingMinutes": 45,
  "smartphoneRemainingMinutes": 30,
  "isForceLocked": false
}
```

**フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `gameRemainingMinutes` | number | 今日のゲーム残り時間（分）。0以上の整数 |
| `smartphoneRemainingMinutes` | number | 今日のスマホ残り時間（分）。0以上の整数 |
| `isForceLocked` | boolean | 強制ロック中かどうか |

---

### 2. 強制ロック・解除

親が「強制ロック」または「ロック解除」ボタンを押したときに呼び出します。

```
POST /api/family/:familyId/lock
Authorization: Bearer <JWT>
Content-Type: application/json

{ "locked": true }   // true = ロック, false = 解除
```

**期待するレスポンス (200 OK):**

```json
{
  "success": true,
  "locked": true
}
```

**フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `locked` | boolean | 操作後のロック状態（リクエストの `locked` と同値） |

---

### 3. ゲーム・スマホ時間の延長

親が「時間を延長する」ボタンを押し、分数を入力して確定したときに呼び出します。

```
POST /api/family/:familyId/extend-time
Authorization: Bearer <JWT>
Content-Type: application/json

{ "minutes": 30 }
```

**期待するレスポンス (200 OK):**

```json
{
  "success": true,
  "newGameRemainingMinutes": 75,
  "newSmartphoneRemainingMinutes": 60
}
```

**フィールド定義:**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `minutes` | number | 延長する分数（1以上の整数） |
| `newGameRemainingMinutes` | number | 延長後のゲーム残り時間（分） |
| `newSmartphoneRemainingMinutes` | number | 延長後のスマホ残り時間（分） |

> **補足:** ゲームとスマホの両方を同じ分数だけ延長する想定です。個別延長が必要な場合はご相談ください。

---

### 4. エラーレスポンス（共通）

既存のAPI仕様（`back_to_front.md § 3.2`）に準拠してください。

```json
{ "error": "エラー内容の文字列" }
```

- `success: false` は返さない
- HTTPステータスコードと `error` フィールドで判定する

---

## フロントエンドが使用するデータ

ログインレスポンスに含まれる以下のフィールドを `:familyId` として使用します。

```json
{
  "user": {
    "familyId": "family_id"  ← これを使用
  }
}
```

---

## フロントエンド側の対応（API確定後）

バックエンドのAPIが追加され次第、フロントエンド側で以下を実装します。

1. `HomeScreen.tsx` の `useEffect` 内で `GET /api/family/:familyId/game-status` を呼び、`gameRemainingMinutes` / `smartphoneRemainingMinutes` / `isForceLocked` を取得して `useState` を初期化する
2. `handleForceLockConfirm` / `handleUnlockConfirm` 内で `POST /api/family/:familyId/lock` を呼ぶ
3. `handleExtendTimeConfirm` 内で `POST /api/family/:familyId/extend-time` を呼び、レスポンスの `newGameRemainingMinutes` / `newSmartphoneRemainingMinutes` でUIを更新する
4. `mock_home.json` の `gameManagement` セクションを削除する

---

## 質問・相談事項

- ゲームとスマホで独立した時間延長（個別延長）が必要かどうか → UIはボタン1つで両方同時延長を想定しているが、要件次第で変更可
- `isForceLocked` の永続化はDB管理？それともインメモリ？（再起動時のリセット有無を確認したい）
