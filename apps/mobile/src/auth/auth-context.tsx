import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser, LoginRequest } from '@roznamcha/types';
import { createApi } from '../lib/api';

const TOKEN_KEY = 'roznamcha_token';

async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function loadToken() {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadToken();
        if (stored) {
          setToken(stored);
          const api = createApi(() => stored);
          const me = await api.auth.me();
          setUser(me);
        }
      } catch {
        await saveToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const api = createApi(() => null);
    const result = await api.auth.login(payload);
    await saveToken(result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        const api = createApi(() => token);
        await api.auth.logout();
      }
    } catch {
      // ignore network errors on logout
    }
    await saveToken(null);
    setToken(null);
    setUser(null);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const api = createApi(() => token);
    const me = await api.auth.me();
    setUser(me);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [token, user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
