/**
 * Setting 画面で使用するデータ型定義。
 * バックエンドとのAPI通信に対応できるよう型を分離して管理する。
 */

// ─── AI分析設定 ───────────────────────────────────────────────────────────────

/** AI分析で検出するNG行為の設定 */
export interface AiNgSetting {
  /** 途中式・プロセスの欠落を検出するか */
  missingProcess: boolean;
  /** 作業量と時間の不整合を検出するか */
  workTimeMismatch: boolean;
  /** 画像の不一致・使い回しを検出するか */
  imageReuse: boolean;
}

/** AI分析設定全体（APIリクエスト/レスポンスの形に合わせる） */
export interface AiSettings {
  /** 1〜5 の整数（1=最も優しい, 5=最も厳しい） */
  strictness: number;
  /** 1=途中経過重視, 2=バランスよく, 3=字の丁寧さ重視 */
  focus: number;
  ng: AiNgSetting;
}

// ─── デバイス連携 ─────────────────────────────────────────────────────────────

/** アプリに連携されたデバイス情報 */
export interface ConnectedDevice {
  id: string;
  name: string;
}
