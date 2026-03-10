import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { useAuth } from '../context/AuthContext';
import { useAppContext, useTheme } from '../context/AppContext';

// Expo Go でのリダイレクト処理を完了させる
WebBrowser.maybeCompleteAuthSession();

// ─── コンポーネント ────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const { signIn, signInWithTestApi } = useAuth();
  const { setUserName } = useAppContext();
  const theme = useTheme();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  });

  const [isSigningIn, setIsSigningIn] = React.useState(false);

  // Google 認証レスポンスを処理
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      (async () => {
        setIsSigningIn(true);
        try {
          const user = await signIn(id_token);
          setUserName(user.name);
        } catch (e) {
          Alert.alert('ログイン失敗', 'サーバーとの通信に失敗しました。\nしばらくしてから再度お試しください。');
        } finally {
          setIsSigningIn(false);
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('ログイン失敗', response.error?.message ?? '不明なエラーが発生しました。');
    }
  }, [response, signIn, setUserName]);

  const handleGoogleLogin = async () => {
    if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ||
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB === 'YOUR_WEB_CLIENT_ID_HERE') {
      Alert.alert('設定エラー', '.env に EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB を設定してください。');
      return;
    }
    await promptAsync();
  };

  // 開発用テストログイン（GET /api/test/login/parent）
  const handleTestLogin = async () => {
    setIsSigningIn(true);
    try {
      const user = await signInWithTestApi();
      setUserName(user.name);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('テストログイン失敗', msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle={theme.background === '#000022' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* ── ロゴ・タイトルエリア ── */}
      <View style={styles.heroArea}>
        <View style={[styles.logoCircle, { borderColor: theme.accent }]}>
          <Text style={[styles.logoText, { color: theme.accent }]}>Q</Text>
        </View>
        <Text style={[styles.appTitle, { color: theme.text }]}>QuestLogic</Text>
        <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
          保護者用アプリ
        </Text>
      </View>

      {/* ── ログインボタンエリア ── */}
      <View style={styles.buttonArea}>
        {isSigningIn ? (
          <ActivityIndicator size="large" color={theme.accent} />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: theme.border }]}
              onPress={handleGoogleLogin}
              disabled={!request}
              activeOpacity={0.8}
            >
              {/* Google ロゴ（SVGの代わりにテキストで表現） */}
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleButtonLabel, { color: theme.text }]}>
                Google でログイン
              </Text>
            </TouchableOpacity>

            {/* 開発用テストログイン */}
            <TouchableOpacity
              style={[styles.testButton, { borderColor: theme.textSecondary }]}
              onPress={handleTestLogin}
              activeOpacity={0.8}
            >
              <Text style={[styles.testButtonLabel, { color: theme.textSecondary }]}>
                開発用テストログイン
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── スタイル ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '700',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  buttonArea: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  testButton: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  testButtonLabel: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;
