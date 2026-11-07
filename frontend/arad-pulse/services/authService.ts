import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiRequest } from './api';

export interface UserSession {
	id: string;
	name: string;
	phone: string;
	location: string;
	category?: string | null;
	role: string;
}

interface LoginResponse {
	token: string;
	user: UserSession;
}

interface RegisterResponse {
	message: string;
}

interface RegisterPayload {
	name: string;
	phone: string;
	password: string;
	location: string;
	category?: string;
}

const TOKEN_KEY = 'userToken';
const USER_KEY = 'userData';

async function setStoredValue(key: string, value: string): Promise<void> {
	if (Platform.OS === 'web') {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, value);
		}
		return;
	}

	await SecureStore.setItemAsync(key, value);
}

async function getStoredValue(key: string): Promise<string | null> {
	if (Platform.OS === 'web') {
		return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	}

	return SecureStore.getItemAsync(key);
}

async function deleteStoredValue(key: string): Promise<void> {
	if (Platform.OS === 'web') {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(key);
		}
		return;
	}

	await SecureStore.deleteItemAsync(key);
}

const authService = {
	async login(phone: string, password: string): Promise<UserSession> {
		const response = await apiRequest<LoginResponse>('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ phone, password }),
		});

		await Promise.all([
			setStoredValue(TOKEN_KEY, response.token),
			setStoredValue(USER_KEY, JSON.stringify(response.user)),
		]);

		return response.user;
	},

	async register(payload: RegisterPayload): Promise<RegisterResponse> {
		return apiRequest<RegisterResponse>('/auth/register', {
			method: 'POST',
			body: JSON.stringify(payload),
		});
	},

	async logout(): Promise<void> {
		await Promise.all([deleteStoredValue(TOKEN_KEY), deleteStoredValue(USER_KEY)]);
	},

	async getCurrentUser(): Promise<UserSession | null> {
		try {
			const userData = await getStoredValue(USER_KEY);
			return userData ? (JSON.parse(userData) as UserSession) : null;
		} catch {
			return null;
		}
	},
};

export default authService;
