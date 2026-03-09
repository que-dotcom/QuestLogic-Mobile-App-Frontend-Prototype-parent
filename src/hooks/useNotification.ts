import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * プッシュ通知の権限リクエストとテスト発火を管理するカスタムフック。
 *
 * 【重要】このアプリはリモートプッシュ通知（FCM/APNs）を使用しない。
 *   scheduleNotificationAsync によるローカル通知のみ使用する。
 *   Expo Go SDK 53 以降、Android のリモートプッシュ通知は非サポートとなったが、
 *   ローカル通知は引き続き動作する。
 *
 *   "Android Push notifications removed from Expo Go with SDK 53" という
 *   ログは expo-notifications ライブラリ内部から出力されるため、
 *   コード側から抑制することはできないが、クラッシュには至らない。
 *
 * 【使い方】
 * - `requestAndTest()`: 権限を要求し、許可されたらテスト通知を2秒後に発火。
 * - `cancelAll()`: スケジュール済みの通知をすべてキャンセル（トグルOFF時）。
 */
export function useNotification() {
  /**
   * 通知権限を要求し、許可されたらローカルテスト通知をスケジュール。
   * @returns 権限が付与されたかどうか
   */
  const requestAndTest = async (): Promise<boolean> => {
    try {
      // ローカル通知のデフォルト動作を設定。
      // ※ モジュールレベルではなく呼び出し時に設定することで副作用を最小化。
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // Android は通知チャンネルの設定が必要
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // ローカルテスト通知: 2秒後に発火
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'QuestLogic',
          body: 'AIからの採点が返答されました',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      return true;
    } catch (err) {
      console.warn('[useNotification] ローカル通知のスケジュールに失敗しました:', err);
      return false;
    }
  };

  /** スケジュール済み通知をすべてキャンセル（トグルOFF時） */
  const cancelAll = async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (err) {
      console.warn('[useNotification] 通知キャンセルに失敗しました:', err);
    }
  };

  return { requestAndTest, cancelAll };
}
