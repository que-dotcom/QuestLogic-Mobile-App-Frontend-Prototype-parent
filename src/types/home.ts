/** 今日の終了タスク 1件分 */
export interface CompletedTask {
  id: string;
  status: string;
  earnedPoints: number;
  child: { name: string; avatarUrl: string | null };
}

/** スマホ・ゲーム管理データ */
export interface GameManagementData {
  gameRemainingMinutes: number;
  smartphoneRemainingMinutes: number;
  isForceLocked: boolean;
  childName: string;
}

/** 宿題確認画像 1件分 */
export interface HomeworkImage {
  id: string;
  /** 例: "ビフォー" / "アフター" */
  caption: string;
  subject: string;
  imageUrl: string;
}

/** Home 画面全体のデータ */
export interface HomeScreenData {
  parentName: string;
  childName: string;
  completedTasks: CompletedTask[];
  gameManagement: GameManagementData;
  homeworkImages: HomeworkImage[];
}
