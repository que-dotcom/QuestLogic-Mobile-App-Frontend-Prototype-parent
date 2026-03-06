import React, { useMemo, useRef } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/AppContext';
import type { ChatHistoryData, ChatListItem } from '../types/chat';
import mockChatData from '../data/mock_chat.json';
import DateLabel from '../components/chat/DateLabel';
import ChatBubble from '../components/chat/ChatBubble';

// ─── ChatDay[] → FlatList 用フラットリストへ変換 ─────────────────────────────

/**
 * ChatHistoryData（日付ごとのネスト構造）を FlatList が扱いやすい
 * ChatListItem[] のフラット配列に変換する。
 *
 * → API から取得した ChatHistoryData をそのままこの関数に渡せばよい。
 */
function flattenChatHistory(history: ChatHistoryData): ChatListItem[] {
  const items: ChatListItem[] = [];
  history.forEach((day) => {
    // 日付ラベルを先頭に追加
    items.push({
      type: 'dateLabel',
      id: `date-${day.dateLabel}`,
      label: day.dateLabel,
    });
    // その日のメッセージを追加
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

/**
 * Chat 画面 — AI アシスタントからのレポートを一覧表示する画面。
 *
 * 【バックエンド連携ポイント】
 * - `dummyChatHistory` を useEffect 内の API 呼び出し結果で置き換える。
 * - タイピング中状態は isTyping: true のメッセージを WebSocket / Polling で追加。
 * - 新しいメッセージ受信時は flatListRef.current?.scrollToEnd() を呼び出す。
 */
const ChatScreen: React.FC = () => {
  const theme = useTheme();

  // ── データ（バックエンド API で差し替え予定） ──
  const chatHistory: ChatHistoryData = mockChatData;

  // ── FlatList 用フラットリスト ──
  const listData = useMemo(() => flattenChatHistory(chatHistory), [chatHistory]);

  // ── 最新メッセージへ自動スクロール ──
  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  // ── レンダラ ──
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

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // 新メッセージ追加時に最下部へスクロール
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        // 大量メッセージでのパフォーマンス向上
        removeClippedSubviews={Platform.OS === 'android'}
        // テイルの絶対配置が隣のアイテムに重なるのを防ぐ
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    // タブバーがオーバーレイ（position:absolute）のため十分な余白を確保
    paddingBottom: 120,
  },
  separator: {
    height: 0, // ChatBubble 自身に marginBottom: 16 があるので追加不要
  },
});

export default ChatScreen;
