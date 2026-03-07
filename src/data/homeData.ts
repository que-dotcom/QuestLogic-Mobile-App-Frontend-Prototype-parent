import type { HomeScreenData } from '../types/home';

/**
 * バックエンドからデータを受け取るまでの仮データ。
 * 実装時はこのオブジェクトをAPIレスポンスで置き換える。
 */
export const dummyHomeData: HomeScreenData = {
  parentName: '田中',
  childName: '△△',
  completedTasks: [
    { id: '1', status: 'COMPLETED', earnedPoints: 32, child: { name: 'テスト生徒', avatarUrl: null } },
    { id: '2', status: 'COMPLETED', earnedPoints: 20, child: { name: 'テスト生徒', avatarUrl: null } },
    { id: '3', status: 'COMPLETED', earnedPoints: 15, child: { name: 'テスト生徒', avatarUrl: null } },
  ],
  gameManagement: {
    gameRemainingMinutes: 45,
    smartphoneRemainingMinutes: 30,
    isForceLocked: false,
    childName: '△△',
  },
  homeworkImages: [
    {
      id: '1',
      caption: 'ビフォー',
      subject: '6年：文字と式',
      imageUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      caption: 'アフター',
      subject: '6年：文字と式',
      imageUrl: 'https://via.placeholder.com/150',
    },
  ],
};
