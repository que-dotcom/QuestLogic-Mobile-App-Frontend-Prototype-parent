import * as SecureStore from 'expo-secure-store';

// ─── 定数 ─────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30_000);
const TOKEN_KEY = 'auth_token';

// ─── ネットワークエラーハンドラー登録 ─────────────────────────────────────────
// AppContext のフックはコンポーネント外から呼べないため、
// AppProvider でコールバックを登録してもらうパターンを採用する。

let onNetworkError: (() => void) | null = null;

/**
 * ネットワーク疎通失敗時に呼び出すコールバックを登録する。
 * AppProvider の useEffect 内で呼ぶこと。
 */
export function registerNetworkErrorHandler(handler: () => void): void {
  onNetworkError = handler;
}

// ─── 401 未認証ハンドラー登録 ─────────────────────────────────────────────────
// トークン期限切れ・無効時にログアウト処理を呼び出すためのコールバック。
// AuthProvider の useEffect 内で登録する。

let onUnauthorized: (() => void) | null = null;

/**
 * HTTP 401 レスポンス時に呼び出すコールバックを登録する。
 * AuthProvider の useEffect 内で呼ぶこと。
 */
export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// ─── トークン管理ヘルパー ──────────────────────────────────────────────────────

/** JWTトークンを SecureStore に保存する */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/** SecureStore から JWTトークンを取得する */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** SecureStore から JWTトークンを削除する */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── APIクライアント ───────────────────────────────────────────────────────────

/**
 * JWT付きHTTPリクエストを送る汎用関数。
 *
 * - トークンは SecureStore から自動取得し Authorization ヘッダーに付与する
 * - タイムアウトは 30 秒
 * - 4xx/5xx 時はレスポンスの `error` フィールドを使って Error をthrowする
 * - ネットワーク疎通失敗時は登録済みのネットワークエラーハンドラーを呼ぶ
 *
 * @param path `/api/quests` のような `/api` から始まるパス
 * @param options fetch と同じオプション（headers は自動でマージされる）
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error) {
          errorMessage = body.error;
        }
      } catch {
        // JSON パース失敗時はステータスコードをそのまま使う
      }
      if (response.status === 401 || response.status === 403) {
        onUnauthorized?.();
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (
      error instanceof TypeError &&
      error.message === 'Network request failed'
    ) {
      onNetworkError?.();
    }

    throw error;
  }
}