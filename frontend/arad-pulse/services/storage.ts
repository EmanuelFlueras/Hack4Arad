import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'arad_pulse_jwt_token';

export async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAuthToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}