import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { saveToken, getToken, deleteToken, apiFetch, registerUnauthorizedHandler } from '../lib/apiClient';

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const SECURE_KEY_USER_INFO = 'questlogic_user_info';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

/** バックエンドのログインAPIレスポンス共通形式 */
interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
    familyId: string;
  };
}

/** AuthContext で保持するユーザー情報 */
export interface UserInfo {
  id: string;
  name: string;
  familyId: string;
}

interface AuthContextValue {
  /** 認証済みかどうか */
  isAuthenticated: boolean;
  /** バックエンドから取得した JWT */
  token: string | null;
  /** ログイン中のユーザー情報 */
  userInfo: UserInfo | null;
  /**
   * Google ID トークンでログイン。
   * POST /api/auth/google に { idToken, role: "PARENT" } を送り JWT を取得・保存する。
   */
  signIn: (googleIdToken: string) => Promise<UserInfo>;
  /**
   * 開発用テストAPIでログイン。
   * GET /api/test/login/parent を呼び JWT を取得・保存する。
   */
  signInWithTestApi: () => Promise<UserInfo>;
  /** JWT とユーザー情報を削除してログアウトする */
  signOut: () => Promise<void>;
  /** 初期化中（SecureStore 読み込み中）かどうか */
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  token: null,
  userInfo: null,
  signIn: async () => ({ id: '', name: '', familyId: '' }),
  signInWithTestApi: async () => ({ id: '', name: '', familyId: '' }),
  signOut: async () => {},
  isLoading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // signOut の最新参照を保持する ref（useEffect 内で古い参照を掴まないように）
  const signOutRef = useRef<() => Promise<void>>(async () => {});

  // 401 ハンドラーを登録する（signOutRef 経由で常に最新の signOut を呼ぶ）
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      signOutRef.current();
    });
  }, []);

  // アプリ起動時に SecureStore から JWT とユーザー情報を復元
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getToken(),
          SecureStore.getItemAsync(SECURE_KEY_USER_INFO),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUserInfo(JSON.parse(storedUser) as UserInfo);
        }
      } catch {
        // 読み込み失敗時は未認証のまま
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** ログインレスポンスを受け取り、JWT とユーザー情報を保存してステートを更新する */
  const processLoginResponse = async (data: LoginResponse): Promise<UserInfo> => {
    const user: UserInfo = {
      id: data.user.id,
      name: data.user.name,
      familyId: data.user.familyId,
    };
    await saveToken(data.token);
    await SecureStore.setItemAsync(SECURE_KEY_USER_INFO, JSON.stringify(user));
    setToken(data.token);
    setUserInfo(user);
    return user;
  };

  /**
   * Google ID トークンをバックエンドへ送りログインする。
   * back_to_front.md § 5 参照: POST /api/auth/google
   * Body: { idToken: string, role: "PARENT" }
   */
  const signIn = async (googleIdToken: string): Promise<UserInfo> => {
    const data = await apiFetch<LoginResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: googleIdToken, role: 'PARENT' }),
    });
    return processLoginResponse(data);
  };

  /**
   * 開発用テストAPIでログインする。
   * back_to_front.md § 2.2 参照: GET /api/test/login/parent
   * Basic認証ヘッダー必須: Base64("{EXPO_PUBLIC_TEST_USER}:{EXPO_PUBLIC_TEST_PASS}")
   * apiFetch はJWTで Authorization を上書きするため、素の fetch を使用する。
   */
  const signInWithTestApi = async (): Promise<UserInfo> => {
    const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
    const user = process.env.EXPO_PUBLIC_TEST_USER ?? 'admin';
    const pass = process.env.EXPO_PUBLIC_TEST_PASS ?? 'Quest2404';
    const credentials = btoa(`${user}:${pass}`);
    const response = await fetch(`${BASE_URL}/api/test/login/parent`, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as LoginResponse;
    return processLoginResponse(data);
  };

  const signOut = async () => {
    await deleteToken();
    await SecureStore.deleteItemAsync(SECURE_KEY_USER_INFO);
    setToken(null);
    setUserInfo(null);
  };

  // ref を常に最新の signOut で更新する
  signOutRef.current = signOut;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: token !== null,
        token,
        userInfo,
        signIn,
        signInWithTestApi,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── カスタムフック ───────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
