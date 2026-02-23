import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/AppContext';

// ─── ピッカー定数 ──────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 52;      // 各行の高さ (px)
const VISIBLE_ITEMS = 5;     // 同時に見える行数（奇数推奨）
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 260px
const MAX_MINUTES = 240;
const PADDING = Math.floor(VISIBLE_ITEMS / 2); // 2（上下の空白行数）

// 0 〜 240 の数値配列
const VALUES = Array.from({ length: MAX_MINUTES + 1 }, (_, i) => i);

// 先頭・末尾に空行を追加して、0 と 240 がセンターに来られるようにする
type PickerItem = number | null;
const PADDED_VALUES: PickerItem[] = [
  ...Array<null>(PADDING).fill(null),
  ...VALUES,
  ...Array<null>(PADDING).fill(null),
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface BaseTimeModalProps {
  visible: boolean;
  /** モーダルタイトル（スマホ用 or ゲーム用） */
  title: string;
  /** モーダル初期値（分） */
  initialMinutes: number;
  onConfirm: (minutes: number) => void;
  onCancel: () => void;
}

// ─── コンポーネント ────────────────────────────────────────────────────────────

/**
 * 毎日の基準制限時間を設定するスクロールピッカーモーダル。
 *
 * Figma デザイン準拠:
 * - 上部注釈（枠あり）
 * - タイトルテキスト
 * - 縦スクロールの数値ピッカー（0〜240分、中央行をダークハイライト）
 * - 「変更する」ボタン
 */
const BaseTimeModal: React.FC<BaseTimeModalProps> = ({
  visible,
  title,
  initialMinutes,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = useState(initialMinutes);
  const flatListRef = useRef<FlatList<PickerItem>>(null);

  // モーダルが開くたびに初期値へスクロール
  useEffect(() => {
    if (!visible) return;
    setSelectedValue(initialMinutes);
    // レイアウト確定後にスクロール（遅延で確実に反映）
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialMinutes * ITEM_HEIGHT,
        animated: false,
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [visible, initialMinutes]);

  // スクロール停止時に選択値を更新
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.y;
      const value = Math.round(
        Math.max(0, Math.min(MAX_MINUTES, offset / ITEM_HEIGHT)),
      );
      setSelectedValue(value);
    },
    [],
  );

  // 行タップで即座にスクロール
  const handleItemPress = useCallback((value: number) => {
    setSelectedValue(value);
    flatListRef.current?.scrollToOffset({
      offset: value * ITEM_HEIGHT,
      animated: true,
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<PickerItem>) => {
      if (item === null) return <View style={{ height: ITEM_HEIGHT }} />;

      const realIndex = index - PADDING;
      const isSelected = realIndex === selectedValue;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleItemPress(realIndex)}
          style={[
            styles.pickerItem,
            isSelected && { backgroundColor: theme.border },
          ]}
        >
          <Text
            style={[
              styles.pickerNumber,
              {
                color: isSelected
                  ? theme.surface
                  : theme.textSecondary ?? theme.text,
                fontWeight: isSelected ? '700' : '400',
                opacity: isSelected ? 1 : 0.6,
              },
            ]}
          >
            {item}
          </Text>
          {isSelected && (
            <Text style={[styles.pickerUnit, { color: theme.surface }]}>分</Text>
          )}
        </TouchableOpacity>
      );
    },
    [selectedValue, theme, handleItemPress],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* 半透明オーバーレイ（タップで閉じる） */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.centeredView} pointerEvents="box-none">
        <View style={styles.cardWrapper}>
          {/* Neo-Brutalism ハードシャドウ */}
          <View style={[styles.shadow, { backgroundColor: theme.border }]} />

          {/* モーダル本体 */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* 注釈ボックス */}
            <View
              style={[styles.noteBox, { borderColor: theme.border }]}
            >
              <Text style={[styles.noteText, { color: theme.text }]}>
                一日の制限時間の変更は、{'\n'}
                毎日の基本的に使用できる{'\n'}
                時間として設定されます
              </Text>
            </View>

            {/* タイトル */}
            <Text
              style={[
                styles.title,
                { color: theme.text, borderBottomColor: theme.border },
              ]}
            >
              {title}
            </Text>

            {/* スクロールピッカー */}
            <View style={styles.pickerOuter}>
              <FlatList<PickerItem>
                ref={flatListRef}
                data={PADDED_VALUES}
                keyExtractor={(_, i) => String(i)}
                renderItem={renderItem}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                style={{ height: PICKER_HEIGHT }}
                removeClippedSubviews={false}
              />
            </View>

            {/* 変更するボタン */}
            <TouchableOpacity
              onPress={() => onConfirm(selectedValue)}
              style={[
                styles.confirmButton,
                { borderColor: theme.border },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={theme.text}
              />
              <Text style={[styles.confirmLabel, { color: theme.text }]}>
                変更する
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── スタイル ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 34, 0.5)',
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
    overflow: 'hidden',
  },
  noteBox: {
    borderWidth: 2,
    borderRadius: 4,
    margin: 16,
    marginBottom: 8,
    padding: 12,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.26,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerOuter: {
    overflow: 'hidden',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerNumber: {
    fontSize: 20,
    letterSpacing: 0.4,
    minWidth: 36,
    textAlign: 'right',
  },
  pickerUnit: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    margin: 16,
    alignSelf: 'center',
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.32,
  },
});

export default BaseTimeModal;
