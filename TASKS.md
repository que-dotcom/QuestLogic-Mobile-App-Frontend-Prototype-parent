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
| — | TASK-01 認証フロー実装 | フロント | ✅ 完了 |
| — | TASK-02 APIクライアント作成 | フロント | ✅ 完了 |
| — | TASK-03 クエスト一覧取得 | フロント | ✅ 完了 |
| — | TASK-04 プロフィール更新 | フロント | ✅ 完了 |
| — | TASK-05 ボーナス付与UI | フロント | ✅ 完了 |
| — | TASK-06 招待コード表示 | フロント | ✅ 完了 |
| — | TASK-07 ゲーム時間取得 | フロント | ✅ 完了 |
| — | TASK-08 lock/extend-time接続 | フロント | ✅ 完了 |
| — | TASK-09 宿題画像取得 | フロント | ✅ 完了 |
| — | TASK-10 チャット画面API接続 | フロント | ✅ 完了 |
| — | TASK-11 AI設定 | フロント | ✅ 完了 |
| — | TASK-12 デバイス管理 | フロント | ✅ 完了 |
| — | TASK-13 childName の動的取得 | チーム判断→フロント | ✅ 完了 |
| **2** | **TASK-14 HomeScreen エラーハンドリング改善** | **フロント** | **✅ 完了** |
| **3** | **TASK-15 環境変数タイムアウト統一** | **フロント** | **✅ 完了** |

---

## 完了タスク（TASK-01〜12）

| Task | 内容 | 主なファイル | 接続API |
|------|------|------------|--------|
| TASK-01 | 認証フロー実装（ログイン画面） | LoginScreen.tsx, AuthContext.tsx, App.tsx | `GET /api/test/login/parent`, `POST /api/auth/google` |
| TASK-02 | API共通クライアント作成 | src/lib/apiClient.ts | — |
| TASK-03 | クエスト一覧取得・型修正 | HomeScreen.tsx, src/types/home.ts | `GET /api/quests` |
| TASK-04 | プロフィール更新API接続 | SettingScreen.tsx | `PUT /api/users/profile` |
| TASK-05 | ボーナス付与UI追加 | TasksContent.tsx | `POST /api/quests/:id/bonus` |
| TASK-06 | 招待コード表示 | SettingScreen.tsx | `GET /api/users/invite-code` |
| TASK-07 | ゲーム残り時間取得（案A） | HomeScreen.tsx | `GET /api/family/game-status` |
| TASK-08 | ゲーム管理系API接続 | HomeScreen.tsx | `POST /api/family/lock`, `POST /api/family/extend-time` |
| TASK-09 | 宿題画像取得（クエストAPIに統合） | HomeScreen.tsx | `GET /api/quests`（`beforeImageUrl` 等を追加） |
| TASK-10 | チャット画面API接続 | ChatScreen.tsx | `GET /api/quests`（`aiResult.feedback_to_parent` を使用） |
| TASK-11 | AI設定GET/PATCH接続 | SettingScreen.tsx | `GET /api/family/settings/ai`, `PATCH /api/family/settings/ai` |
| TASK-12 | デバイス管理API接続 | SettingScreen.tsx | `GET /api/family/devices` |

---

## TASK-13 🟡 childName の動的取得

**ステータス:** [x] 完了（案A採用：`GET /api/family/game-status` に `childName` を追加）

### 状況

`AppContext` の `childName` が初期値 `'○○'` のまま固定されており、ホーム画面の「今日の○○の終了タスク」「○○のゲーム制限時間」などに固定文字が表示されている。

### 選択肢（チームで決定すること）

**案A: `GET /api/family/game-status` のレスポンスに `childName` を追加してもらう（推奨）**
- バックエンドに追加依頼し、フロントは `AppContext` の `setChildName()` にセットするだけ

**案B: `GET /api/quests` の `child.name` を流用する**
- クエストが0件のときは名前が取得できないリスクあり

### 決定後のフロント作業

- 取得した `childName` を `AppContext` の `setChildName()` にセットする
- `mock_home.json` の `childName` フィールドは削除する

---

## TASK-14 🟢 HomeScreen のエラーハンドリング改善

**ステータス:** [x] 完了

### 状況

[HomeScreen.tsx](src/screens/HomeScreen.tsx) の `GET /api/quests` および `GET /api/family/game-status` の `.catch()` が空のままになっており、ネットワークエラー以外のAPIエラー（400/500系）がサイレントに失敗している。

### やること

1. `GET /api/quests` の catch で `Alert.alert('データ取得失敗', ...)` を表示する
2. `GET /api/family/game-status` の catch で同様にAlertを表示する
3. SettingScreen と同じスタイルのエラーハンドリングに統一する

### 完了の定義

APIがエラーを返したとき、ユーザーにAlertで通知されること。

---

## TASK-15 🟢 環境変数タイムアウトの統一

**ステータス:** [ ] 未着手

### 状況

`.env.example` に `EXPO_PUBLIC_API_TIMEOUT=10000` があるが、[src/lib/apiClient.ts](src/lib/apiClient.ts#L6) では `const TIMEOUT_MS = 30_000` とハードコードされており環境変数が無視されている。

### やること

```ts
// src/lib/apiClient.ts
const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30_000);
```

に変更し、環境変数で制御できるようにする。

### 完了の定義

`.env` の `EXPO_PUBLIC_API_TIMEOUT` を変更するとタイムアウト時間が変わること。

---

## 作業ログ

| 日付 | Task | 対応内容 |
|------|------|---------|
| 2026-03-06 | — | タスク一覧作成 |
| 2026-03-06 | TASK-02 | src/lib/apiClient.ts 実装 |
| 2026-03-06 | TASK-01 | LoginScreen.tsx, AuthContext.tsx, App.tsx 実装（Google認証＋テストAPIログイン対応） |
| 2026-03-06 | TASK-03 | CompletedTask型修正・HomeScreen useEffectでGET /api/quests呼び出し |
| 2026-03-07 | TASK-04 | SettingScreen PUT /api/users/profile 接続・失敗時Alert＋ロールバック |
| 2026-03-07 | TASK-05 | TasksContent.tsx にボーナス付与ボタン・POST /api/quests/:id/bonus接続 |
| 2026-03-08 | TASK-06 | SettingScreen GET /api/users/invite-code 接続・クリップボードコピー |
| 2026-03-08 | TASK-07 | HomeScreen GET /api/family/game-status 接続（案Aで完了） |
| 2026-03-08 | TASK-09 | GET /api/quests に beforeImageUrl/afterImageUrl/subject 追加・HomeScreen接続 |
| 2026-03-08 | TASK-11 | SettingScreen GET/PATCH /api/family/settings/ai 接続 |
| 2026-03-08 | TASK-12 | SettingScreen GET /api/family/devices 接続 |
| 2026-03-08 | TASK-08 | handleLockApi() → POST /api/family/lock、handleExtendTimeConfirm → POST /api/family/extend-time 接続 |
| 2026-03-08 | TASK-10 | ChatScreen.tsx で GET /api/quests から aiResult.feedback_to_parent を取得・日付グルーピング実装 |
| 2026-03-08 | — | TASK-01〜12 全完了確認。残課題として TASK-13/14/15 を追加 |
