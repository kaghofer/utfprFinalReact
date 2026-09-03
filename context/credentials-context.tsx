import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getSelectedCredentialId,
  listCredentials,
  persistCredentials,
  persistSelectedCredentialId,
} from '@/lib/storage/api-keys';
import type { StoredCredential } from '@/lib/storage/api-keys';

type CredentialsContextValue = {
  credentials: StoredCredential[];
  selectedId: string | null;
  selected: StoredCredential | null;
  loading: boolean;
  select: (id: string | null) => void;
  addCredential: (credential: StoredCredential) => void;
  removeCredential: (id: string) => void;
};

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [stored, selected] = await Promise.all([
        listCredentials(),
        getSelectedCredentialId(),
      ]);
      if (!active) return;
      setCredentials(stored);
      const stillExists = selected !== null && stored.some((c) => c.id === selected);
      setSelectedId(stillExists ? selected : null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    persistSelectedCredentialId(id);
  }, []);

  const addCredential = useCallback((credential: StoredCredential) => {
    setCredentials((prev) => {
      const next = [...prev, credential];
      persistCredentials(next);
      return next;
    });
  }, []);

  const removeCredential = useCallback((id: string) => {
    setCredentials((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistCredentials(next);
      return next;
    });
    setSelectedId((current) => {
      if (current === id) {
        persistSelectedCredentialId(null);
        return null;
      }
      return current;
    });
  }, []);

  const value = useMemo<CredentialsContextValue>(
    () => ({
      credentials,
      selectedId,
      selected: credentials.find((c) => c.id === selectedId) ?? null,
      loading,
      select,
      addCredential,
      removeCredential,
    }),
    [credentials, selectedId, loading, select, addCredential, removeCredential]
  );

  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>;
}

export function useCredentials(): CredentialsContextValue {
  const ctx = useContext(CredentialsContext);
  if (!ctx) {
    throw new Error('useCredentials deve ser usado dentro de <CredentialsProvider>.');
  }
  return ctx;
}
