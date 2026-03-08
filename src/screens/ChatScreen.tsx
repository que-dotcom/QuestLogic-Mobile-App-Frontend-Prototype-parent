import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Platform,
  StatusBar,
  View,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/AppContext';
import { apiFetch } from '../lib/apiClient';
import type { ChatHistoryData, ChatListItem } from '../types/chat';
import DateLabel from '../components/chat/DateLabel';
import ChatBubble from '../components/chat/ChatBubble';

// ─── API レスポンス型 ──────────────────────────────────────────────────────────

/** GET /api/quests の1件分（チャット画面で使うフィールドのみ） */
interface ApiQuest {
  id: string;
  createdAt: string;
  aiResult: {
    feedback_to_parent?: string;
  } | null;
}

// ─── 日付ラベル変換 ───────────────────────────────────────────────────────────

/**
 * ISO 8601 文字列をチャット画面用の日付ラベルに変換する。
 * - 当日  → "今日"
 * - 前日  → "昨日"
 * - それ以外 → "YYYY/MM/DD"
 */
function toDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const toMidnight = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffDays =
    (toMidnight(now).getTime() - toMidnight(date).getTime()) /
    (1000 * 60 * 60 * 24);

  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '昨日';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

// ─── API データ → ChatHistoryData 変換 ───────────────────────────────────────

/**
 * GET /api/quests のレスポンスを ChatHistoryData に変換する。
 * - feedback_to_parent が空のクエストは除外する
 * - createdAt で昇順ソートしてから日付グルーピングする
 */
function buildChatHistory(quests: ApiQuest[]): ChatHistoryData {
  // feedback_to_parent がないクエストを除外し、日時昇順でソート
  const filtered = quests
    .filter((q) => q.aiResult?.feedback_to_parent)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  // 日付ラベルでグループ化（Map で挿入順を保持）
  const groups = new Map<string, ApiQuest[]>();
  for (const quest of filtered) {
    const label = toDateLabel(quest.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(quest);
  }

  return Array.from(groups.entries()).map(([dateLabel, dayQuests]) => ({
    dateLabel,
    messages: dayQuests.map((q) => ({
      id: q.id,
      text: q.aiResult!.feedback_to_parent!,
      isTyping: false,
    })),
  }));
}

// ─── ChatDay[] → FlatList 用フラットリストへ変換 ─────────────────────────────

function flattenChatHistory(history: ChatHistoryData): ChatListItem[] {
  const items: ChatListItem[] = [];
  history.forEach((day) => {
    items.push({
      type: 'dateLabel',
      id: `date-${day.dateLabel}`,
      label: day.dateLabel,
    });
    day.messages.forEach((msg) => {
      items.push({
        type: 'message',
        id: msg.id,
        text: msg.text,
        isTyping: msg.isTyping,
      });
    });
  });
  return items;
}

// ─── コンポーネント ────────────────────────────────────────────────────────────

const ChatScreen: React.FC = () => {
  const theme = useTheme();

  const [chatHistory, setChatHistory] = useState<ChatHistoryData>([]);
  const [isLoading, setIsLoading] = useState(true);

  // GET /api/quests から aiResult.feedback_to_parent を取得して日付グルーピング
  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiQuest[] }>('/api/quests')
      .then((res) => {
        if (res.success) {
          setChatHistory(buildChatHistory(res.data));
        }
      })
      .catch(() => {
        // ネットワークエラー時は NetworkErrorOverlay が表示される
        // その他のエラーは空のまま表示
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const listData = useMemo(() => flattenChatHistory(chatHistory), [chatHistory]);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const renderItem: ListRenderItem<ChatListItem> = ({ item }) => {
    if (item.type === 'dateLabel') {
      return <DateLabel label={item.label} />;
    }
    return <ChatBubble text={item.text} isTyping={item.isTyping} />;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={theme.background === '#000022' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            AIレポートはまだありません
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          removeClippedSubviews={Platform.OS === 'android'}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  separator: {
    height: 0,
  },
});

export default ChatScreen;
