# QuestLogic 親用アプリ API連携 タスク一覧

> 作成日: 2026-03-06
> ブランチ: `API-connent`
> 参照仕様書: `back_to_front.md`

## 凡例

- 🟢 **フロントエンドのみで完結**
- 🟡 **チームで方針決定が必要**
- 🔴 **バックエンドの追加実装が先に必要**

---

## 優先順位まとめ

| 優先 | Task | 担当 | ステータス |
|------|------|------|---------|
| — | TASK-02 APIクライアント作成 | フロント | ✅ 完了 |
| — | TASK-01 認証フロー実装 | フロント | ✅ 完了 |
| — | TASK-03 クエスト一覧取得 | フロント | ✅ 完了 |
| — | TASK-04 プロフィール更新 | フロント | ✅ 完了 |
| — | TASK-05 ボーナス付与UI | フロント | ✅ 完了 |
| — | TASK-06 招待コード表示 | フロント | ✅ 完了 |
| — | TASK-07 ゲーム時間取得 | フロント | ✅ 完了 |
| — | TASK-09 宿題画像取得 | フロント | ✅ 完了 |
| — | TASK-11 AI設定 | フロント | ✅ 完了 |
| — | TASK-12 デバイス管理 | フロント | ✅ 完了 |
| **1** | **TASK-08 lock/extend-time接続** | **フロント** | **✅ 完了** |
| **2** | **TASK-10 チャット画面API接続** | **フロント** | **✅ 完了** |

---

## TASK-01 🟢 認証フローの実装（ログイン画面の作成）

**ステータス:** [x] 完了

### やること

1. ログイン画面 `src/screens/LoginScreen.tsx` を新規作成する
2. `GET https://QL-api.adcsvmc.net/api/test/login/parent` を呼び、JWTトークンと `user` オブジェクトを取得する
3. 取得した `token` を `AsyncStorage`（または `SecureStore`）に保存する
4. 取得した `user.name` を `AppContext` の `setUserName()` にセットする
5. `App.tsx` のナビゲーション設定を修正し、未ログイン時はLoginScreen、ログイン済み時はタブナビゲーションに遷移するよう分岐する

### 完了の定義

アプリ起動時にログインAPIが呼ばれ、`userName` がAPIの `user.name` で表示され、JWTがストレージに保存されること。

### 参照するAPIレスポンス

```
GET /api/test/login/parent
```

```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "user_id",
    "name": "テスト生徒",
    "role": "PARENT",
    "familyId": "family_id",
    "level": 1,
    "exp": 0,
    "currentPoints": 0
  }
}
```

---

## TASK-02 🟢 API共通クライアントの作成

**ステータス:** [x] 実装済み（`src/lib/apiClient.ts`）
**前提:** TASK-01より先に実装する（TASK-01で使用するため）

### やること

1. `src/lib/apiClient.ts` を新規作成する
2. `AsyncStorage` からJWTを読み込み、`Authorization: Bearer <token>` ヘッダーを付与してfetchする汎用関数を実装する
3. HTTPステータスが4xx/5xxの場合はレスポンスの `error` フィールドを見てエラーをthrowする
4. タイムアウトは **30秒** に設定する（画像分析APIが数秒〜十数秒かかるため）
5. ネットワーク疎通失敗（`TypeError: Network request failed`）時は `AppContext` の `setIsNetworkError(true)` を呼ぶ

### 完了の定義

JWT付きリクエストが1つの関数で送れ、エラー時に適切にハンドリングされること。

### 実装イメージ

```ts
// src/lib/apiClient.ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T>
```

### エラーレスポンス形式（back_to_front.md § 3.2）

```json
{ "error": "エラー内容" }
```

> `success: false` は返さない。HTTPステータスと `error` フィールドで判定する。

---

## TASK-03 🟢 クエスト一覧取得の実装と型の修正

**ステータス:** [x] 完了
**前提:** TASK-01, TASK-02

### やること

1. `src/types/home.ts` の `CompletedTask` 型をAPIレスポンスに合わせて変更する

    **変更前（削除）:**
    ```ts
    interface CompletedTask {
      id: string;
      subject: string;
      description: string;
    }
    ```

    **変更後:**
    ```ts
    interface CompletedTask {
      id: string;
      status: string;
      earnedPoints: number;
      child: { name: string; avatarUrl: string | null };
    }
    ```

2. `HomeScreen.tsx` の `completedTasks` 表示部分を新しい型に合わせて修正する（`subject`・`description` を表示していた箇所を `child.name`・`earnedPoints` などに変更する）

3. `HomeScreen.tsx` の `useEffect` 内で `GET /api/quests` を呼び、結果を `setCompletedTasks()` にセットする（認証ヘッダー必須）

4. `mock_home.json` の `completedTasks` は使用しないようにする

### 完了の定義

ホーム画面の「今日の終了タスク」セクションが実際のAPIデータを表示すること。

### 参照するAPIレスポンス

```
GET /api/quests
Authorization: Bearer <token>
```

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
      }
    }
  ]
}
```

---

## TASK-04 🟢 ユーザー名（プロフィール）更新のAPI接続

**ステータス:** [x] 完了
**前提:** TASK-01, TASK-02

### やること

1. `SettingScreen.tsx` の `userName` の `TextInput` から離れたタイミング（`onBlur`）または専用の保存ボタン押下時に `PUT /api/users/profile` を呼ぶ
2. リクエストBody: `{ "name": "<入力値>" }`
3. レスポンスの `success: true` を確認してから `setUserName()` を更新する
4. 失敗時は `Alert` でエラー内容を表示し、入力値を元の `userName` に戻す

### 完了の定義

設定画面で名前を変えると、APIに保存され、ホーム画面の「ようこそ、〇〇さん」に反映されること。

### 参照するAPIレスポンス

```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "新しい名前" }
```

```json
{
  "success": true,
  "message": "プロフィールを更新しました。",
  "data": { "id": "user_id" }
}
```

---

## TASK-05 🟢 ボーナスポイント付与UIの追加

**ステータス:** [x] 完了
**前提:** TASK-01, TASK-02, TASK-03

### やること

1. `HomeScreen.tsx` のクエスト一覧（`TasksContent`）の各タスクカードに「ボーナス付与」ボタンを追加する
2. ボタン押下時にポイント入力モーダルを表示する
3. 確定時に `POST /api/quests/:id/bonus` を呼ぶ（`:id` はクエストの `id`）
4. リクエストBody: `{ "bonusPoints": <入力値> }`
5. 成功後はAPIレスポンスの `earnedPoints`（合計ポイント）でUIを更新する

### 完了の定義

親がクエスト一覧からボーナスを付与でき、付与後の合計ポイントが画面に反映されること。

### 参照するAPIレスポンス

```
POST /api/quests/:id/bonus
Authorization: Bearer <token>
Content-Type: application/json

{ "bonusPoints": 10 }
```

```json
{
  "success": true,
  "message": "子供に 10 分の追加ボーナスを付与しました！",
  "data": {
    "id": "quest_id",
    "earnedPoints": 42
  }
}
```

---

## TASK-06 🟢 招待コード表示機能の追加

**ステータス:** [x] 完了
**前提:** TASK-01, TASK-02

### やること

1. `SettingScreen.tsx` に「招待コード」セクションを追加する
2. 画面表示時（`useEffect`）に `GET /api/users/invite-code` を呼ぶ
3. レスポンスの **トップレベル** `inviteCode` フィールドを表示する（`data.inviteCode` ではないことに注意）
4. コードをクリップボードにコピーするボタンを追加する（`expo-clipboard` を使用）

### 完了の定義

設定画面に招待コードが表示され、コピーボタンで文字列を取得できること。

### 参照するAPIレスポンス

```
GET /api/users/invite-code
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "inviteCode": "a1b2c3"
}
```

> **注意:** `data.inviteCode` ではなく、トップレベルの `inviteCode` を参照すること（back_to_front.md § 7）。

---

## TASK-07 🟡 ゲーム残り時間表示の方針決定・実装

**ステータス:** [x] 完了（案A で実装済み）

### 状況

`GET /api/family/game-status` をバックエンドが追加。`HomeScreen.tsx` の `useEffect` で呼び出し、`gameRemainingMinutes` / `smartphoneRemainingMinutes` / `isForceLocked` を取得・表示している。

### ⚠️ 残課題（TASK-08と連動）

- 強制ロック（`POST /api/family/lock`）・時間延長（`POST /api/family/extend-time`）はフロントがまだモック状態（ローカルstateのみ更新）

---

## TASK-08 🔴 ゲーム管理系API追加をバックエンドに依頼

**ステータス:** [x] 完了

### 完了したAPI（バックエンド実装済み・フロント接続済み）

- ✅ `GET /api/family/game-status` — HomeScreen で接続済み

### 未接続のAPI（バックエンド実装済み・フロント対応残り）

- ⚠️ `POST /api/family/lock` — フロントがローカルstateのみ（APIを呼んでいない）
- ⚠️ `POST /api/family/extend-time` — 同上

### フロント残作業

`HomeScreen.tsx` の以下3関数でAPIを呼ぶよう修正する：
- `handleForceLockConfirm` → `POST /api/family/lock { "locked": true }`
- `handleUnlockConfirm` → `POST /api/family/lock { "locked": false }`
- `handleExtendTimeConfirm` → `POST /api/family/extend-time { "minutes": <入力値> }`

成功後にレスポンス値でstateを更新し、失敗時はAlertを表示する。

---

## TASK-09 🔴 宿題画像取得APIをバックエンドに依頼

**ステータス:** [x] 完了（バックエンド実装済み・フロント接続済み）

### 状況

ホーム画面の「宿題の確認」セクションでビフォー/アフター画像を表示したいが、`GET /api/quests` のレスポンスに画像URLと教科情報が含まれていない。

### バックエンドへの依頼内容

`GET /api/quests` のレスポンスに以下フィールドの追加を依頼する。

```json
{
  "success": true,
  "data": [
    {
      "id": "quest_id",
      "status": "COMPLETED",
      "earnedPoints": 32,
      "child": { "name": "...", "avatarUrl": null },
      "beforeImageUrl": "https://...",
      "afterImageUrl": "https://...",
      "subject": "算数",
      "topic": "文字と式"
    }
  ]
}
```

または、現在ルート未接続の `GET /api/quests/:id` を公開してもらう。

### フロントはAPI確定後に対応

- `HomeworkImage` 型を更新する
- `HomeworkContent` の `imageUrl` をAPIから取得した値に差し替える
- `mock_home.json` の `homeworkImages` を削除する

---

## TASK-10 🔴 チャット画面（AI分析レポート）取得APIをバックエンドに依頼

**ステータス:** [x] 完了（バックエンド実装済み・フロント接続済み）

### 状況

チャット画面に「親向けAI分析レポート」を日付ごとに表示したいが、対応するAPIがない。`GET /api/quests` のレスポンスに `feedback_to_parent` が含まれていない。

### バックエンドへの依頼内容

`GET /api/quests` のレスポンスの `aiResult` に `feedback_to_parent` を追加してもらう。

```json
{
  "data": [
    {
      "id": "quest_id",
      "createdAt": "2026-03-06T10:00:00Z",
      "aiResult": {
        "feedback_to_child": "よく頑張ったね",
        "feedback_to_parent": "途中式が丁寧に書けています。..."
      }
    }
  ]
}
```

### フロント残作業（⚠️ 未実装）

- `ChatScreen.tsx` が現在 `mock_chat.json` を使用中（API未接続）
- `GET /api/quests` を呼び、`aiResult.feedback_to_parent` を `createdAt` で日付グルーピングして表示する
- 接続後に `mock_chat.json` / `chatData.ts` を削除する

---

## TASK-11 🔴 AI設定APIをバックエンドに依頼

**ステータス:** [x] 完了（バックエンド実装済み・フロント接続済み）

### 状況

設定画面のAI設定（厳しさ・重視点・NG行為）を保存・取得するAPIがバックエンドに未実装。現在フロントは `mockSettingData.aiSettings` を使用し、保存ボタンは `Alert` のみ（TODOコメント）。

### バックエンドへの依頼内容

```
GET /api/settings/ai
Authorization: Bearer <token>

レスポンス:
{
  "success": true,
  "data": {
    "strictness": 3,
    "focus": 2,
    "ng": { "missingProcess": true, "workTimeMismatch": false, "imageReuse": false }
  }
}
```

```
PATCH /api/settings/ai
Authorization: Bearer <token>
Content-Type: application/json

{
  "strictness": 3,
  "focus": 2,
  "ng": { "missingProcess": true, "workTimeMismatch": false, "imageReuse": false }
}
```

### フロントはAPI確定後に対応

- `SettingScreen.tsx` の `handleSaveStrictness` / `handleSaveFocus` / `handleSaveNg` でAPIを呼ぶよう修正する
- 画面表示時に `GET /api/settings/ai` で初期値を取得する
- `mock_setting.json` の `aiSettings` を削除する

---

## TASK-12 🔴 デバイス管理APIをバックエンドに依頼

**ステータス:** [x] 完了（バックエンド実装済み・フロント接続済み）

### 状況

設定画面の「デバイス連携」モーダル（`DeviceModal`）にデバイス一覧を表示したいが、対応するAPIが存在しない。現在は `mock_setting.json` の `devices` を使用。

### バックエンドへの依頼内容

```
GET /api/family/:familyId/devices
Authorization: Bearer <token>

レスポンス:
{
  "success": true,
  "data": [
    { "id": "d1", "name": "スイッチ2" },
    { "id": "d2", "name": "androidスマートフォン" }
  ]
}
```

### フロントはAPI確定後に対応

- `SettingScreen.tsx` でAPIを呼び、`DeviceModal` に渡す `devices` を差し替える
- `mock_setting.json` の `devices` を削除する

---

## 作業ログ

| 日付 | Task | 対応内容 |
|------|------|---------|
| 2026-03-06 | — | タスク一覧作成 |
| 2026-03-06 | TASK-02 | 実装済み確認（src/lib/apiClient.ts）|
| 2026-03-06 | TASK-01 | LoginScreen.tsx, AuthContext.tsx, App.tsx 実装・Google認証＋テストAPIログイン対応 |
| 2026-03-06 | TASK-03 | CompletedTask型修正・TasksContent表示修正・HomeScreen useEffectでGET /api/quests呼び出し |
| 2026-03-07 | TASK-04 | SettingScreen handleNameBlur でPUT /api/users/profile呼び出し・成功時setUserName・失敗時Alert＋ロールバック実装済み確認 |
| 2026-03-07 | TASK-05 | TasksContent.tsx にボーナス付与ボタン・入力モーダル・POST /api/quests/:id/bonus呼び出し・earnedPoints更新実装済み確認 |
| 2026-03-08 | TASK-06 | SettingScreen.tsx に招待コードセクション追加・GET /api/users/invite-code・クリップボードコピー実装済み確認 |
| 2026-03-08 | TASK-07 | GET /api/family/game-status 接続済み確認（案Aで完了）|
| 2026-03-08 | TASK-09 | GET /api/quests に beforeImageUrl/afterImageUrl/subject フィールド追加済み確認 |
| 2026-03-08 | TASK-11 | GET/PATCH /api/family/settings/ai 接続済み確認 |
| 2026-03-08 | TASK-12 | GET /api/family/devices 接続済み確認 |
| 2026-03-08 | TASK-08 | game-status は完了。lock/extend-time はフロントがモック状態のまま（要対応） |
| 2026-03-08 | TASK-08 | handleForceLockConfirm/handleUnlockConfirm → POST /api/family/lock、handleExtendTimeConfirm → POST /api/family/extend-time 接続完了 |
| 2026-03-08 | TASK-10 | バックエンド実装済み。ChatScreen.tsx が mock_chat.json を使用中（フロント未接続） |
| 2026-03-08 | TASK-10 | GET /api/quests から aiResult.feedback_to_parent を取得・日付グルーピング実装。mock_chat.json / chatData.ts を削除。ローディング状態・空表示・エラーハンドリング対応 |
