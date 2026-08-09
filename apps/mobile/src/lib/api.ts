import { createApiClient } from '@roznamcha/api-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 3001;
const API_PATH = '/api/v1';

/** Host running Metro / Expo — same machine as the API in local monorepo dev. */
function getDevMachineHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    (
      Constants.manifest2 as
        | { extra?: { expoClient?: { hostUri?: string } } }
        | null
        | undefined
    )?.extra?.expoClient?.hostUri;

  if (!hostUri) return null;
  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === '127.0.0.1') return null;
  return host;
}

export function getApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl?.trim();
  const configured = fromEnv || fromExtra;
  const configuredIsLoopback =
    !!configured &&
    (/:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(configured) ||
      configured.startsWith('localhost'));

  // On a real device / Expo Go, localhost is the phone — fall back to Metro host.
  const host = getDevMachineHost();
  if (Platform.OS !== 'web' && (!configured || configuredIsLoopback) && host && host !== 'localhost') {
    return `http://${host}:${API_PORT}${API_PATH}`;
  }

  if (configured && !configuredIsLoopback) return configured;

  // Android emulator maps the host loopback to 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}${API_PATH}`;
  }

  return configured ?? `http://localhost:${API_PORT}${API_PATH}`;
}

export function createApi(getToken: () => string | null) {
  return createApiClient({
    baseUrl: getApiBaseUrl(),
    getToken,
  });
}
