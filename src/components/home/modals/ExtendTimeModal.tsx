import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../../theme/colors';
import { useAppContext } from '../../../context/AppContext';

/**
 * 【アイコン画像について】
 * Figma の「Sliders」アイコンを PNG でエクスポートし、
 * asset/home/images/sliders.png に配置してください。
 * 現在はプレースホルダー PNG を使用しています。
 */
// アイコンはモードに応じて切り替える
// ダークモードでのみ white 版が使われる。require は両方書いて
// Metro バンドラーに取り込ませる。


const DURATION_OPTIONS = [15, 30, 60] as const;
type DurationOption = (typeof DURATION_OPTIONS)[number];

interface ExtendTimeModalProps {
  visible: boolean;
  /** 子供の名前（動的テキスト用） */
  childName: string;
  onConfirm: (minutes: DurationOption) => void;
  onCancel: () => void;
}

/**
 * スマホ・ゲーム時間延長モーダル。
 * 延長時間 (15 / 30 / 60 分) を選択して確定できる。
 */
const ExtendTimeModal: React.FC<ExtendTimeModalProps> = ({
  visible,
  childName,
  onConfirm,
  onCancel,
}) => {
  const [selected, setSelected] = useState<DurationOption>(30);
  const { isDarkMode } = useAppContext();
  const ICON_SLIDERS = isDarkMode
    ? require('../../../../asset/home/images/sliders-white.png')
    : require('../../../../asset/home/images/sliders.png');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* 半透明オーバーレイ */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.centeredView} pointerEvents="box-none">
        <View style={styles.cardWrapper}>
          {/* シャドウ層 */}
          <View style={styles.shadowLayer} />

          {/* カード本体 */}
          <View style={styles.card}>
          {/* アイコン画像 (絵文字不使用) */}
          <Image
            source={ICON_SLIDERS}
            style={styles.iconImage}
            resizeMode="contain"
          />

          {/* タイトル */}
          <Text style={styles.title}>時間を延長しますか？</Text>

          {/* 説明 (childName を動的に展開) */}
          <Text style={styles.message}>
            {childName}のスマホ・ゲーム時間を{'\n'}延長する時間を選んでください
          </Text>

          {/* 時間選択ボタン */}
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((min) => (
              <TouchableOpacity
                key={min}
                onPress={() => setSelected(min)}
                style={[
                  styles.durationButton,
                  selected === min && styles.durationButtonSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.durationLabel,
                    selected === min && styles.durationLabelSelected,
                  ]}
                >
                  {min}分
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* アクションボタン */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelLabel}>キャンセル</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onConfirm(selected)}
              style={[styles.button, styles.confirmButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmLabel}>延長する</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 34, 0.5)',
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '9%',
  },
  cardWrapper: {
    width: '100%',
    paddingRight: 6,
    paddingBottom: 8,
  },
  shadowLayer: {
    position: 'absolute',
    top: 8,
    left: 6,
    right: -6,
    bottom: -8,
    backgroundColor: Colors.blackberry,
    borderRadius: 8,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.blackberry,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  iconImage: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.blackberry,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  message: {
    fontSize: 16,
    color: Colors.blackberry,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.32,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  durationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.blackberry,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  durationButtonSelected: {
    backgroundColor: Colors.blackberry,
  },
  durationLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.blackberry,
  },
  durationLabelSelected: {
    color: Colors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.blackberry,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
  },
  cancelLabel: {
    fontSize: 16,
    color: Colors.blackberry,
    fontWeight: '400',
  },
  confirmButton: {
    backgroundColor: Colors.blackberry,
  },
  confirmLabel: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '700',
  },
});

export default ExtendTimeModal;
