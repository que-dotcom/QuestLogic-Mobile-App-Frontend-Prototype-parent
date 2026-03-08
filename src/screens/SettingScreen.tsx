import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Platform,
  StatusBar,
  LayoutAnimation,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { lightTheme, darkTheme } from '../theme/theme';
import { useNotification } from '../hooks/useNotification';
import type { AiSettings, AiNgSetting, ConnectedDevice } from '../types/setting';
import mockSettingData from '../data/mock_setting.json';
import { apiFetch } from '../lib/apiClient';

// APIレスポンスのAI設定形式（数値直接）← フロント型の { level: number } と異なる
type ApiAiSettings = {
  strictness: number;
  focus: number;
  ng: AiNgSetting;
};

import DotSlider from '../components/setting/DotSlider';
import NoteBox from '../components/setting/NoteBox';
import NgToggleRow from '../components/setting/NgToggleRow';
import DeviceModal from '../components/setting/DeviceModal';
import LogoutModal from '../components/setting/LogoutModal';


// ─── 注釈文 ───────────────────────────────────────────────────────────────────

const NOTE_STRICTNESS =
  'AI分析の厳しさはスコア加点に大きく影響します。\n厳しさを上げるほど、細かな誤りや不足が減点対象になります。';

const NOTE_FOCUS =
  'AI分析の重点視はスコア加点に大きく影響します。\n黒点が左の時は「途中経過重視」、真ん中の時は「バランスよく」、右の時は「字の丁寧さ」を重視します。';

// ─── メインコンポーネント ─────────────────────────────────────────────────────

const SettingScreen: React.FC = () => {
  const { userName, setUserName, isDarkMode, setIsDarkMode, setIsNetworkError } = useAppContext();
  const { signOut } = useAuth();
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { requestAndTest, cancelAll } = useNotification();

  // ── ローカルステート ──

  // プロフィール名（API保存前の編集中の値）
  const [localName, setLocalName] = useState<string>(userName);
  const [isSavingName, setIsSavingName] = useState(false);

  // AI 設定（バックエンド API で差し替え）
  const [aiSettings, setAiSettings] = useState<AiSettings>(mockSettingData.aiSettings);

  // デバイス一覧
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);

  // アコーディオン開閉
  const [openSection, setOpenSection] = useState<
    'strictness' | 'focus' | 'ng' | null
  >(null);

  // NoteBox の表示状態（アコーディオンを再開くと true にリセット）
  const [noteVisible, setNoteVisible] = useState({
    strictness: true,
    focus: true,
  });

  // モーダル表示
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 招待コード
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; inviteCode: string }>('/api/users/invite-code')
      .then((res) => {
        if (res.success) setInviteCode(res.inviteCode);
      })
      .catch(() => {
        // エラー時は非表示のまま
      });
  }, []);

  // TASK-11: AI設定をAPIから取得
  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiAiSettings }>('/api/family/settings/ai')
      .then((res) => {
        if (res.success) {
          setAiSettings({
            strictness: { level: res.data.strictness },
            focus: { level: res.data.focus },
            ng: res.data.ng,
          });
        }
      })
      .catch(() => {
        // エラー時はモック値のまま
      });
  }, []);

  // TASK-12: デバイス一覧をAPIから取得
  useEffect(() => {
    apiFetch<{ success: boolean; data: ConnectedDevice[] }>('/api/family/devices')
      .then((res) => {
        if (res.success) setDevices(res.data);
      })
      .catch(() => {
        // エラー時は空のまま
      });
  }, []);

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('コピーしました', `招待コード「${inviteCode}」をコピーしました。`);
  };

  // 通知トグル
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  // ── アコーディオン操作 ──

  const toggleSection = useCallback(
    (section: 'strictness' | 'focus' | 'ng') => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (openSection === section) {
        setOpenSection(null);
      } else {
        setOpenSection(section);
        // アコーディオンを開くたびに注釈を再表示
        setNoteVisible((prev) => ({ ...prev, [section]: true }));
      }
    },
    [openSection],
  );

  // ── プロフィール名の保存 ──

  const handleNameBlur = async () => {
    const trimmed = localName.trim();
    if (trimmed === userName) return; // 変更なし

    if (trimmed.length === 0) {
      setLocalName(userName);
      return;
    }

    setIsSavingName(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(
        '/api/users/profile',
        {
          method: 'PUT',
          body: JSON.stringify({ name: trimmed }),
        },
      );
      if (res.success) {
        setUserName(trimmed);
      } else {
        throw new Error('プロフィールの更新に失敗しました。');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'エラーが発生しました。';
      Alert.alert('保存失敗', message);
      setLocalName(userName);
    } finally {
      setIsSavingName(false);
    }
  };

  // ── バックエンド送信ダミー関数 ──

  // TASK-11: AI設定の保存
  const handleSaveStrictness = async () => {
    try {
      await apiFetch<{ success: boolean }>('/api/family/settings/ai', {
        method: 'PATCH',
        body: JSON.stringify({ strictness: aiSettings.strictness.level }),
      });
      Alert.alert('保存しました', `厳しさレベル: ${aiSettings.strictness.level}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'エラーが発生しました。';
      Alert.alert('保存失敗', message);
    }
  };

  const handleSaveFocus = async () => {
    try {
      await apiFetch<{ success: boolean }>('/api/family/settings/ai', {
        method: 'PATCH',
        body: JSON.stringify({ focus: aiSettings.focus.level }),
      });
      Alert.alert('保存しました', `重視点レベル: ${aiSettings.focus.level}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'エラーが発生しました。';
      Alert.alert('保存失敗', message);
    }
  };

  const handleSaveNg = async () => {
    try {
      await apiFetch<{ success: boolean }>('/api/family/settings/ai', {
        method: 'PATCH',
        body: JSON.stringify({ ng: aiSettings.ng }),
      });
      Alert.alert('保存しました', 'NG行為設定を更新しました');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'エラーが発生しました。';
      Alert.alert('保存失敗', message);
    }
  };

  // ── 通知トグル処理 ──

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestAndTest();
      if (!granted) {
        Alert.alert(
          '通知が許可されていません',
          '設定アプリから通知を許可してください。',
        );
        return;
      }
    } else {
      await cancelAll();
    }
    setNotificationEnabled(value);
  };

  // ── ログアウト ──

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await signOut();
  };

  // ── スタイル（テーマ依存） ──

  const dynamicStyles = {
    safeArea: { backgroundColor: theme.background },
    label: { color: theme.text },
    separator: { borderBottomColor: theme.separator },
    sectionRow: {
      borderBottomColor: theme.separator,
      backgroundColor: theme.background,
    },
    inputText: { color: theme.text },
  };

  // ─── レンダリング ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══════════════════════════════════════════════════════════════
            プロフィール行
        ══════════════════════════════════════════════════════════════ */}
        <View style={[styles.profileRow, dynamicStyles.separator]}>
          {/* ユーザーアイコン */}
          <Ionicons name="person-circle-outline" size={40} color={theme.text} />

          {/* 名前入力欄 */}
          <TextInput
            value={localName}
            onChangeText={setLocalName}
            onBlur={handleNameBlur}
            editable={!isSavingName}
            style={[styles.nameInput, dynamicStyles.inputText]}
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* ペンアイコン */}
          <Ionicons name="pencil-outline" size={22} color={theme.text} />

          {/* リンクアイコン（デバイス連携） */}
          <TouchableOpacity
            onPress={() => setDeviceModalVisible(true)}
            activeOpacity={0.7}
            style={styles.linkButton}
          >
            <Ionicons name="link-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════
            AI分析の評価の厳しさ設定
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          onPress={() => toggleSection('strictness')}
          style={[styles.sectionRow, dynamicStyles.sectionRow]}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            AI分析の評価の厳しさ設定
          </Text>
          <Text style={[styles.sectionAction, { color: theme.text }]}>
            変更 {openSection === 'strictness' ? '∨' : '>'}
          </Text>
        </TouchableOpacity>

        {openSection === 'strictness' && (
          <View style={[styles.sectionContent, { borderBottomColor: theme.separator }]}>
            <DotSlider
              value={aiSettings.strictness.level}
              max={5}
              onChange={(v) =>
                setAiSettings((prev) => ({
                  ...prev,
                  strictness: { level: v },
                }))
              }
              theme={theme}
            />

            {noteVisible.strictness && (
              <NoteBox
                note={NOTE_STRICTNESS}
                onDismiss={() =>
                  setNoteVisible((prev) => ({ ...prev, strictness: false }))
                }
                theme={theme}
              />
            )}

            <TouchableOpacity
              onPress={handleSaveStrictness}
              style={[styles.saveButton, { borderColor: theme.accent }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.accent}
              />
              <Text style={[styles.saveLabel, { color: theme.accent }]}>
                変更する
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            AI分析の重視点の設定
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          onPress={() => toggleSection('focus')}
          style={[styles.sectionRow, dynamicStyles.sectionRow]}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            AI分析の重視点の設定
          </Text>
          <Text style={[styles.sectionAction, { color: theme.text }]}>
            変更 {openSection === 'focus' ? '∨' : '>'}
          </Text>
        </TouchableOpacity>

        {openSection === 'focus' && (
          <View style={[styles.sectionContent, { borderBottomColor: theme.separator }]}>
            <DotSlider
              value={aiSettings.focus.level}
              max={3}
              onChange={(v) =>
                setAiSettings((prev) => ({
                  ...prev,
                  focus: { level: v },
                }))
              }
              theme={theme}
            />

            {noteVisible.focus && (
              <NoteBox
                note={NOTE_FOCUS}
                onDismiss={() =>
                  setNoteVisible((prev) => ({ ...prev, focus: false }))
                }
                theme={theme}
              />
            )}

            <TouchableOpacity
              onPress={handleSaveFocus}
              style={[styles.saveButton, { borderColor: theme.accent }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.accent}
              />
              <Text style={[styles.saveLabel, { color: theme.accent }]}>
                変更する
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            AI分析で発見したNG行為の設定
        ══════════════════════════════════════════════════════════════ */}
        <TouchableOpacity
          onPress={() => toggleSection('ng')}
          style={[styles.sectionRow, dynamicStyles.sectionRow]}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            AI分析で発見したNG行為の設定
          </Text>
          <Text style={[styles.sectionAction, { color: theme.text }]}>
            変更 {openSection === 'ng' ? '∨' : '>'}
          </Text>
        </TouchableOpacity>

        {openSection === 'ng' && (
          <View style={[styles.sectionContent, { borderBottomColor: theme.separator }]}>
            <NgToggleRow
              label="途中式・プロセスの欠落の検閲"
              value={aiSettings.ng.missingProcess}
              onChange={(v) =>
                setAiSettings((prev) => ({
                  ...prev,
                  ng: { ...prev.ng, missingProcess: v },
                }))
              }
              theme={theme}
            />
            <NgToggleRow
              label="作業量と時間の不整合の検閲"
              value={aiSettings.ng.workTimeMismatch}
              onChange={(v) =>
                setAiSettings((prev) => ({
                  ...prev,
                  ng: { ...prev.ng, workTimeMismatch: v },
                }))
              }
              theme={theme}
            />
            <NgToggleRow
              label="画像の不一致・使い回しの検閲"
              value={aiSettings.ng.imageReuse}
              onChange={(v) =>
                setAiSettings((prev) => ({
                  ...prev,
                  ng: { ...prev.ng, imageReuse: v },
                }))
              }
              theme={theme}
            />

            <TouchableOpacity
              onPress={handleSaveNg}
              style={[styles.saveButton, { borderColor: theme.accent }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.accent}
              />
              <Text style={[styles.saveLabel, { color: theme.accent }]}>
                変更する
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            招待コード
        ══════════════════════════════════════════════════════════════ */}
        {inviteCode !== null && (
          <View style={[styles.sectionRow, dynamicStyles.sectionRow]}>
            <View style={styles.inviteCodeContent}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>
                招待コード
              </Text>
              <Text style={[styles.inviteCodeText, { color: theme.text }]}>
                {inviteCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyInviteCode}
              style={[styles.copyButton, { borderColor: theme.accent }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={theme.accent} />
              <Text style={[styles.copyLabel, { color: theme.accent }]}>
                コピー
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            通知の許可
        ══════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionRow, dynamicStyles.sectionRow]}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            通知の許可
          </Text>
          <Switch
            value={notificationEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: theme.text }}
            thumbColor={notificationEnabled ? theme.background : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>

        {/* ══════════════════════════════════════════════════════════════
            ダークモード適用
        ══════════════════════════════════════════════════════════════ */}
        <View style={[styles.sectionRow, dynamicStyles.sectionRow]}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            ダークモード適用
          </Text>
          {/* 丸いドットトグル（Figma デザインに準拠） */}
          <TouchableOpacity
            onPress={() => setIsDarkMode(!isDarkMode)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <View
              style={[
                styles.dotToggle,
                { borderColor: theme.text },
                isDarkMode && { backgroundColor: theme.text },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════
            デバッグ: ネットワークエラー画面テスト
            ※ 本番リリース前に削除すること
        ══════════════════════════════════════════════════════════════ */}
        <View style={[styles.debugRow, dynamicStyles.separator]}>
          <TouchableOpacity
            onPress={() => setIsNetworkError(true)}
            style={styles.debugButton}
            activeOpacity={0.8}
          >
            <Ionicons name="wifi-outline" size={16} color="#FC2865" />
            <Text style={styles.debugLabel}>エラー画面をテストする</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════
            ログアウト
        ══════════════════════════════════════════════════════════════ */}
        <View style={[styles.logoutRow, dynamicStyles.separator]}>
          <Ionicons
            name="person-remove-outline"
            size={36}
            color={theme.text}
          />
          <TouchableOpacity
            onPress={() => setLogoutModalVisible(true)}
            style={[styles.logoutButton, { borderColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.logoutLabel, { color: theme.text }]}>
              ログアウトする
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── モーダル群 ─────────────────────────────────────────────────── */}

      <DeviceModal
        visible={deviceModalVisible}
        devices={devices}
        onClose={() => setDeviceModalVisible(false)}
      />

      <LogoutModal
        visible={logoutModalVisible}
        onKeepLogin={() => setLogoutModalVisible(false)}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
};

// ─── スタイル ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // タブバーがオーバーレイ（position:absolute）のため十分な余白を確保
    paddingBottom: 120,
  },

  // ── プロフィール行 ──
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#AAAAAA',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  linkButton: {
    padding: 2,
  },

  // ── セクション行（AI設定・通知・ダークモード） ──
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: 15,
    flex: 1,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // ── セクション展開コンテンツ ──
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },

  // ── 変更するボタン ──
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 100,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginTop: 8,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── ダークモードドットトグル ──
  dotToggle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },

  // ── デバッグ行 ──
  debugRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FC2865',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  debugLabel: {
    fontSize: 13,
    color: '#FC2865',
    letterSpacing: 0.26,
  },

  // ── 招待コード ──
  inviteCodeContent: {
    flex: 1,
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 12,
  },
  copyLabel: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── ログアウト行 ──
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  logoutButton: {
    borderWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default SettingScreen;
