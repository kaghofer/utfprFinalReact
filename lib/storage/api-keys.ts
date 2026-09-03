import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProviderId } from '@/lib/ai/providers';

const STORAGE_KEY = 'utfpr-final:api-keys:v1';
const SELECTED_KEY = 'utfpr-final:selected-key-id:v1';

export type StoredCredential = {
  id: string;
  provider: ProviderId;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  createdAt: number;
};

export async function listCredentials(): Promise<StoredCredential[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistCredentials(credentials: StoredCredential[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export async function getSelectedCredentialId(): Promise<string | null> {
  return AsyncStorage.getItem(SELECTED_KEY);
}

export async function persistSelectedCredentialId(id: string | null): Promise<void> {
  if (id === null) {
    await AsyncStorage.removeItem(SELECTED_KEY);
  } else {
    await AsyncStorage.setItem(SELECTED_KEY, id);
  }
}
