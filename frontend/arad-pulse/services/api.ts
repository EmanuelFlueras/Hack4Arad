import Constants from 'expo-constants';
import { getAuthToken } from './storage';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhostIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${localhostIp}:5000`;
console.log('Connected to backend at:', API_URL);

export const BASE_URL = `${API_URL}/api`;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Eroare API (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}