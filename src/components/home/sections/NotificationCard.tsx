import React from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HardShadowBox from '../../common/HardShadowBox';
import { useTheme } from '../../../context/AppContext';

interface NotificationCardProps {
  /** カード左に表示するアイコン画像。Figma エクスポートの PNG を require() で渡す */
  iconSource: ImageSourcePropType;
  label: string;
  remainingMinutes: number;
  /**
   * ペンアイコンを押した際のコールバック。
   * 指定された場合、カード右端にペンアイコンボタンを表示する。
   * → ベース設定時間変更モーダルの呼び出しに使用。
   */
  onEditPress?: () => void;
}

/** ゲーム/スマホ残り時間を表示する通知カード */
const NotificationCard: React.FC<NotificationCardProps> = ({
  iconSource,
  label,
  remainingMinutes,
  onEditPress,
}) => {
  const theme = useTheme();

  return (
    <HardShadowBox offsetX={6} offsetY={8} borderRadius={8} shadowColor={theme.border}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* アイコン (Image コンポーネントで表示 / 絵文字不使用) */}
        <View style={[styles.iconContainer, { borderRightColor: theme.border }]}>
          <View style={[styles.iconBorder, { borderColor: theme.border }]}>
            <Image
              source={iconSource}
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* メッセージエリア */}
        <View style={styles.messageArea}>
          <View style={styles.topRow}>
            <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>{label}</Text>
            <Text style={[styles.dateLabel, { color: theme.text }]}>本日</Text>
            {/* ベース時間設定ボタン（ペンアイコン） */}
            {onEditPress && (
              <TouchableOpacity
                onPress={onEditPress}
                style={styles.editButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={16} color={theme.text} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.timeText, { color: theme.text }]}>残り{remainingMinutes}分</Text>
        </View>
      </View>
    </HardShadowBox>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    height: 80,
    overflow: 'hidden',
  },
  iconContainer: {
    borderRightWidth: 2,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconBorder: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  messageArea: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.32,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    letterSpacing: 0.36,
    marginLeft: 4,
  },
  editButton: {
    marginLeft: 6,
    padding: 2,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default NotificationCard;
