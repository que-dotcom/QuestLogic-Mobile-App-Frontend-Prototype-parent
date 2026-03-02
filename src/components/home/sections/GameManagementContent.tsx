import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotificationCard from './NotificationCard';
import ActionButton from './ActionButton';

// ─── アイコン画像 ──────────────────────────────────────────────────────────────
// Figma からエクスポートされた PNG を使用（asset/home/images/ に配置済み）
// ファイル名はすべて英字・大文字小文字に注意（case-sensitive 環境対応）
const ICON_BELL       = require('../../../../asset/home/images/BellRinging.png');
const ICON_LOCK       = require('../../../../asset/home/images/SmileyXEyes.png');
const ICON_UNLOCK     = require('../../../../asset/home/images/Smiley.png');
const ICON_SLIDERS    = require('../../../../asset/home/images/sliders.png');

interface GameManagementContentProps {
  /** 子供の名前（全ラベルで動的に使用） */
  childName: string;
  /** ゲーム残り時間（分） — State から渡す */
  gameRemainingMinutes: number;
  /** スマホ残り時間（分） — State から渡す */
  smartphoneRemainingMinutes: number;
  /** 強制ロック中かどうか — State から渡す */
  isForceLocked: boolean;
  onForceLockPress: () => void;
  onUnlockPress: () => void;
  onExtendTimePress: () => void;
  /** ゲーム基準時間変更モーダルを開くコールバック */
  onEditGameBaseTimePress: () => void;
  /** スマホ基準時間変更モーダルを開くコールバック */
  onEditSmartBaseTimePress: () => void;
}

/** アコーディオン「スマホ・ゲーム管理」の展開コンテンツ */
const GameManagementContent: React.FC<GameManagementContentProps> = ({
  childName,
  gameRemainingMinutes,
  smartphoneRemainingMinutes,
  isForceLocked,
  onForceLockPress,
  onUnlockPress,
  onExtendTimePress,
  onEditGameBaseTimePress,
  onEditSmartBaseTimePress,
}) => {
  return (
    <View style={styles.container}>
      {/* ゲーム残り時間通知カード（ペンアイコンでベース時間変更） */}
      <NotificationCard
        iconSource={ICON_BELL}
        label={`${childName}のゲーム制限時間`}
        remainingMinutes={gameRemainingMinutes}
        onEditPress={onEditGameBaseTimePress}
      />

      {/* スマホ残り時間通知カード（ペンアイコンでベース時間変更） */}
      <NotificationCard
        iconSource={ICON_BELL}
        label={`${childName}のスマホ制限時間`}
        remainingMinutes={smartphoneRemainingMinutes}
        onEditPress={onEditSmartBaseTimePress}
      />

      {/* アクションボタン (Image アイコン使用) */}
      <View style={styles.buttonsContainer}>
        <ActionButton
          iconSource={ICON_LOCK}
          label="スマホ・ゲームを強制ロックする"
          onPress={onForceLockPress}
          disabled={isForceLocked}
        />
        <ActionButton
          iconSource={ICON_UNLOCK}
          label="スマホ・ゲームを強制解除する"
          onPress={onUnlockPress}
          disabled={!isForceLocked}
        />
        <ActionButton
          iconSource={ICON_SLIDERS}
          label="スマホ・ゲームの時間を延長する"
          onPress={onExtendTimePress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  buttonsContainer: {
    gap: 4,
  },
});

export default GameManagementContent;
