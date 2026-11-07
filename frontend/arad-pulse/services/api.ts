import { Platform } from 'react-native';
import { getAuthToken } from './storage';

// Dacă testezi pe telefon fizic prin Expo Go, trece IP-ul calculatorului tău din Wi-Fi (ex: '192.168.1.50')
//const DEV_LAN_IP = '192.168.1.100';

const DEV_LAN_IP = '10.199.179.124';

const getBaseUrl = (): string => {
  // Dacă testezi pe telefon fizic prin Expo Go:
  return `http://${DEV_LAN_IP}:5000/api`;
};

export const BASE_URL = getBaseUrl();

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