import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext, useTheme } from '../context/AppContext';
import type { CompletedTask, HomeworkImage } from '../types/home';
import { apiFetch } from '../lib/apiClient';

// GET /api/quests のレスポンス1件分の型（CompletedTaskより多くのフィールドを持つ）
type ApiQuest = CompletedTask & {
  beforeImageUrl: string;
  afterImageUrl: string;
  subject: string | null;
  createdAt: string;
  aiResult: { feedback_to_parent?: string } | null;
  child: { name: string; avatarUrl?: string } | null;
};

import AccordionSection from '../components/home/AccordionSection';
import TasksContent from '../components/home/sections/TasksContent';
import GameManagementContent from '../components/home/sections/GameManagementContent';
import HomeworkContent from '../components/home/sections/HomeworkContent';
import ConfirmModal from '../components/home/modals/ConfirmModal';
import ExtendTimeModal from '../components/home/modals/ExtendTimeModal';
import BaseTimeModal from '../components/home/modals/BaseTimeModal';

// ─── アイコン画像 ──────────────────────────────────────────────────────────────
// Figma からエクスポートされた PNG（asset/home/images/ に配置済み）
// ファイル名の大文字小文字は実際のファイル名に合わせること（case-sensitive 環境対応）
const ICON_LOCK   = require('../../asset/home/images/SmileyXEyes.png');
const ICON_UNLOCK = require('../../asset/home/images/Smiley.png');


// ─── モーダル種別 ──────────────────────────────────────────────────────────────
type ModalType = 'none' | 'forceLock' | 'unlock' | 'extendTime' | 'baseGame' | 'baseSmart';

// ─── コンポーネント ────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  // ── グローバルステート ──
  // userName: 親の名前 / childName: 子供の名前 / baseXxxTime: 毎日の基準時間
  const {
    userName,
    childName,
    setChildName,
    baseGameTime,
    setBaseGameTime,
    baseSmartphoneTime,
    setBaseSmartphoneTime,
  } = useAppContext();
  const theme = useTheme();

  // ── 終了タスク: APIから取得 ──
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [homeworkImages, setHomeworkImages] = useState<HomeworkImage[]>([]);

  // TASK-09: GET /api/quests でタスク一覧と宿題画像を同時に取得
  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiQuest[] }>('/api/quests')
      .then((res) => {
        if (res.success) {
          setCompletedTasks(res.data);
          // before/after 画像を HomeworkImage 形式に変換
          const images: HomeworkImage[] = res.data.flatMap((quest) => [
            {
              id: `${quest.id}-before`,
              caption: 'ビフォー',
              subject: quest.subject ?? '',
              imageUrl: quest.beforeImageUrl,
            },
            {
              id: `${quest.id}-after`,
              caption: 'アフター',
              subject: quest.subject ?? '',
              imageUrl: quest.afterImageUrl,
            },
          ]);
          setHomeworkImages(images);
        }
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'データの取得に失敗しました。';
        Alert.alert('データ取得失敗', message);
      });
  }, []);

  // ── ゲーム管理：子供が使うたびに減算できるよう State に分離 ──
  /** ゲーム残り時間 (分)。GET /api/family/game-status から取得。 */
  const [gameRemainingMinutes, setGameRemainingMinutes] = useState<number>(0);

  /** スマホ残り時間 (分)。GET /api/family/game-status から取得。 */
  const [smartphoneRemainingMinutes, setSmartphoneRemainingMinutes] = useState<number>(0);

  /** 強制ロック中かどうか。trueのとき「強制ロック」ボタンが無効化される。 */
  const [isForceLocked, setIsForceLocked] = useState<boolean>(false);

  // TASK-07: ゲーム状態をAPIから取得
  useEffect(() => {
    apiFetch<{
      success: boolean;
      gameRemainingMinutes: number;
      smartphoneRemainingMinutes: number;
      isForceLocked: boolean;
      childName?: string;
    }>('/api/family/game-status')
      .then((res) => {
        if (res.success) {
          setGameRemainingMinutes(res.gameRemainingMinutes);
          setSmartphoneRemainingMinutes(res.smartphoneRemainingMinutes);
          setIsForceLocked(res.isForceLocked);
          // TASK-13: 案A - game-status レスポンスの childName をセット
          if (res.childName) {
            setChildName(res.childName);
          }
        }
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'データの取得に失敗しました。';
        Alert.alert('データ取得失敗', message);
      });
  }, []);

  // ── モーダル制御 ──
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const closeModal = () => setActiveModal('none');

  // ── ハンドラ ──

  /** POST /api/family/lock で強制ロック or 解除を行う共通処理 */
  const handleLockApi = async (locked: boolean) => {
    try {
      const res = await apiFetch<{ success: boolean; locked: boolean }>(
        '/api/family/lock',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked }),
        },
      );
      if (res.success) {
        setIsForceLocked(res.locked);
        closeModal();
      } else {
        Alert.alert('エラー', 'ロック状態の変更に失敗しました。');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'ロック操作に失敗しました。';
      Alert.alert('エラー', message);
    }
  };

  const handleForceLockConfirm = () => handleLockApi(true);

  const handleUnlockConfirm = () => handleLockApi(false);

  const handleExtendTimeConfirm = async (minutes: number) => {
    try {
      const res = await apiFetch<{
        success: boolean;
        newGameRemainingMinutes: number;
        newSmartphoneRemainingMinutes: number;
      }>('/api/family/extend-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });
      if (res.success) {
        setGameRemainingMinutes(res.newGameRemainingMinutes);
        setSmartphoneRemainingMinutes(res.newSmartphoneRemainingMinutes);
        closeModal();
      } else {
        Alert.alert('エラー', '時間延長に失敗しました。');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '時間延長に失敗しました。';
      Alert.alert('エラー', message);
    }
  };

  // ── ベース時間設定ハンドラ ──
  const handleBaseGameTimeConfirm = (minutes: number) => {
    setBaseGameTime(minutes);
    closeModal();
  };

  const handleBaseSmartTimeConfirm = (minutes: number) => {
    setBaseSmartphoneTime(minutes);
    closeModal();
  };

  // ── レンダリング ──
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <StatusBar
        barStyle={theme.background === '#000022' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 挨拶テキスト: userName (親の名前) を使用 */}
        <Text style={[styles.welcomeText, { color: theme.text }]}>
          ようこそ、{userName}さん
        </Text>

        {/* ① 今日の{childName}の終了タスク ← 子供の名前を使用 */}
        <AccordionSection title={`今日の${childName}の終了タスク`}>
          <TasksContent tasks={completedTasks} childName={childName} />
        </AccordionSection>

        {/* ② スマホ・ゲーム管理 */}
        <AccordionSection title="スマホ・ゲーム管理">
          <GameManagementContent
            childName={childName}
            gameRemainingMinutes={gameRemainingMinutes}
            smartphoneRemainingMinutes={smartphoneRemainingMinutes}
            isForceLocked={isForceLocked}
            onForceLockPress={() => setActiveModal('forceLock')}
            onUnlockPress={() => setActiveModal('unlock')}
            onExtendTimePress={() => setActiveModal('extendTime')}
            onEditGameBaseTimePress={() => setActiveModal('baseGame')}
            onEditSmartBaseTimePress={() => setActiveModal('baseSmart')}
          />
        </AccordionSection>

        {/* ③ 宿題の確認 */}
        <AccordionSection title="宿題の確認">
          <HomeworkContent images={homeworkImages} />
        </AccordionSection>
      </ScrollView>

      {/* ── モーダル群 ───────────────────────────────── */}

      {/* 強制ロック確認 */}
      <ConfirmModal
        visible={activeModal === 'forceLock'}
        title="強制ロックしますか？"
        message={`${childName}のスマホ・ゲームを\n今すぐロックします。`}
        iconSource={ICON_LOCK}
        confirmLabel="ロックする"
        onConfirm={handleForceLockConfirm}
        onCancel={closeModal}
      />

      {/* 強制ロック解除確認 */}
      <ConfirmModal
        visible={activeModal === 'unlock'}
        title="ロックを解除しますか？"
        message={`${childName}のスマホ・ゲームの\nロックを解除します。`}
        iconSource={ICON_UNLOCK}
        confirmLabel="解除する"
        onConfirm={handleUnlockConfirm}
        onCancel={closeModal}
      />

      {/* 時間延長 */}
      <ExtendTimeModal
        visible={activeModal === 'extendTime'}
        childName={childName}
        onConfirm={handleExtendTimeConfirm}
        onCancel={closeModal}
      />

      {/* ゲーム基準時間設定 */}
      <BaseTimeModal
        visible={activeModal === 'baseGame'}
        title="一日のゲーム制限時間の変更"
        initialMinutes={baseGameTime}
        onConfirm={handleBaseGameTimeConfirm}
        onCancel={closeModal}
      />

      {/* スマホ基準時間設定 */}
      <BaseTimeModal
        visible={activeModal === 'baseSmart'}
        title="一日のスマホ制限時間の変更"
        initialMinutes={baseSmartphoneTime}
        onConfirm={handleBaseSmartTimeConfirm}
        onCancel={closeModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    // タブバーがオーバーレイ表示（position:absolute）のため、
    // 最下部コンテンツがタブバーで隠れないよう十分な余白を確保
    paddingBottom: 120,
  },
  welcomeText: {
    fontSize: 20,
    letterSpacing: 0.4,
    fontWeight: '400',
    marginBottom: 16,
    marginLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
});

export default HomeScreen;
