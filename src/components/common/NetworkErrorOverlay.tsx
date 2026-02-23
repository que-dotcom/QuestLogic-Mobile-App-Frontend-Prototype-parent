import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext, useTheme } from '../../context/AppContext';

const ICON_SMILEY_X = require('../../../asset/home/images/SmileyXEyes.png');

/**
 * ネットワークエラー時のフルスクリーンロックオーバーレイ。
 *
 * AppContext の isNetworkError が true のときに表示される。
 * 「更新」ボタンを押すと 2 秒のローディング後に isNetworkError を false に戻す。
 * Modal の背後の操作は一切ブロックされる。
 *
 * Figma デザイン準拠:
 * - 半透明グレーオーバーレイ
 * - 中央にネオ・ブルータリズムダイアログ（太枠・ハードシャドウ）
 * - SmileyXEyes アイコン / エラータイトル / メッセージ / 更新ボタン
 */
const NetworkErrorOverlay: React.FC = () => {
  const { isNetworkError, setIsNetworkError } = useAppContext();
  const theme = useTheme();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // ダミーの再読み込み処理（2秒後にエラー解除）
    // 本番ではここで API リクエストを再発行する
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    setIsRetrying(false);
    setIsNetworkError(false);
  };

  return (
    <Modal
      visible={isNetworkError}
      transparent
      animationType="fade"
      // statusBarTranslucent でステータスバー含む全画面をカバー（Android）
      statusBarTranslucent
      // バックキーで閉じさせない
      onRequestClose={() => {}}
    >
      {/* フルスクリーン半透明オーバーレイ（ポインターイベントをすべてブロック） */}
      <View style={styles.overlay}>
        <View style={styles.cardWrapper}>
          {/* Neo-Brutalism ハードシャドウ */}
          <View
            style={[styles.shadow, { backgroundColor: theme.border }]}
          />

          {/* ダイアログ本体 */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {isRetrying ? (
              /* ローディング中 */
              <View style={styles.retryingContainer}>
                <ActivityIndicator size="large" color={theme.text} />
                <Text style={[styles.retryingText, { color: theme.text }]}>
                  再読み込み中...
                </Text>
              </View>
            ) : (
              /* エラー表示 */
              <>
                <Image
                  source={ICON_SMILEY_X}
                  style={styles.icon}
                  resizeMode="contain"
                />
                <Text style={[styles.errorTitle, { color: theme.text }]}>
                  Wifi接続エラー
                </Text>
                <Text style={[styles.errorMessage, { color: theme.text }]}>
                  接続しなおしてから更新してください
                </Text>

                {/* 更新ボタン（テキストリンクスタイル） */}
                <TouchableOpacity
                  onPress={handleRetry}
                  style={styles.retryButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={28}
                    color={theme.text}
                  />
                  <Text style={[styles.retryLabel, { color: theme.text }]}>
                    更新
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: '100%',
    paddingRight: 6,
    paddingBottom: 8,
  },
  shadow: {
    position: 'absolute',
    top: 8,
    left: 6,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  card: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 16,
  },
  icon: {
    width: 48,
    height: 48,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    letterSpacing: 0.28,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.32,
  },
  retryingContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  retryingText: {
    fontSize: 14,
    letterSpacing: 0.28,
  },
});

export default NetworkErrorOverlay;
