# CLAUDE.md - QuestLogic 親用モバイルアプリ

## プロジェクト概要

子供の学習・ゲーム時間を管理する保護者向けモバイルアプリ（QuestLogicシステムの親用フロントエンドプロトタイプ）。
子用アプリ（QuestLogic-Mobile-App-Frontend-Prototype-child）と連携する。

## 技術スタック

- React Native 0.81.5
- Expo 54.0.33
- TypeScript 5.3.3
- React Navigation（BottomTabs）

## 開発コマンド

```bash
npx expo start -c --tunnel   # トンネル経由で起動（実機確認用・推奨）
npm start                     # 標準起動
npm run ios                   # iOSシミュレータ
npm run android               # Androidエミュレータ
npm run web                   # Web版
```

## ディレクトリ構成

```
src/
├── components/
│   ├── chat/        チャット画面コンポーネント
│   ├── common/      共通コンポーネント（NetworkErrorOverlay等）
│   ├── home/        ホーム画面コンポーネント
│   │   ├── modals/  モーダル
│   │   └── sections/ セクション
│   └── setting/     設定画面コンポーネント
├── context/         グローバルステート（AppContext.tsx）
├── data/            モックデータ
├── hooks/           カスタムフック
├── screens/         3画面（HomeScreen, ChatScreen, SettingScreen）
├── theme/           テーマ・カラー定義（theme.ts）
├── types/           TypeScript型定義
└── utils/           ユーティリティ
```

## グローバルステート（AppContext）

`useAppContext()` でアクセス。`useTheme()` でダークモード対応カラーを取得。

| 変数 | 型 | 説明 |
|------|----|------|
| `userName` | string | 親の名前 |
| `childName` | string | 子供の名前 |
| `isDarkMode` | boolean | ダークモードフラグ |
| `baseGameTime` | number | 1日のゲーム基準時間（分） |
| `baseSmartphoneTime` | number | 1日のスマホ基準時間（分） |
| `isNetworkError` | boolean | ネットワークエラーフラグ（trueでオーバーレイ表示） |

## テーマシステム

- Light: 白背景 `#FFFFFF`
- Dark: 紺背景 `#000022`
- Accent: ゴジベリー `#FC2865`

コンポーネント内では `useTheme()` を使い、`theme.background / theme.text / theme.border` 等を参照する。

## コーディング規約

- コンポーネントは PascalCase、ファイルは `.tsx`
- カスタムフックは `use` prefix
- TypeScript strict モード（型 `any` は避ける）
- 環境変数は `EXPO_PUBLIC_` prefix（例: `EXPO_PUBLIC_API_BASE_URL`）

## API接続（API-connentブランチ）

バックエンドとのAPI接続を実装中。`.env` ファイルに環境変数を設定して使用する。
`.env.example` を参照してローカルの `.env` を作成すること。

## 関連リポジトリ

| リポジトリ | 説明 |
|-----------|------|
| QuestLogic-Mobile-App-Frontend-Prototype-child | 子用モバイルアプリ |
| QuestLogic | メインプロジェクト（backend/frontend含む） |
