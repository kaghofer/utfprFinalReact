import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PROVIDERS, type ProviderId, type ProviderPreset } from '@/lib/ai/providers';
import { useCredentials } from '@/context/credentials-context';
import { useThemeColor } from '@/hooks/use-theme-color';

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences';
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'sentences',
}: FieldProps) {
  const textColor = useThemeColor({}, 'text');

  return (
    <ThemedView style={styles.fieldGroup}>
      <ThemedText type="defaultSemiBold" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[styles.fieldInput, { color: textColor }]}
      />
    </ThemedView>
  );
}

export default function CredentialFormScreen() {
  const router = useRouter();
  const { addCredential, select } = useCredentials();

  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const preset = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0];

  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(preset.defaultBaseUrl);
  const [model, setModel] = useState(preset.defaultModel);

  function switchProvider(next: ProviderPreset) {
    setProviderId(next.id);
    setBaseUrl(next.defaultBaseUrl);
    setModel(next.defaultModel);
  }

  const validationError =
    label.trim() === ''
      ? 'Informe um nome de exibição.'
      : apiKey.trim() === ''
        ? 'Informe a chave de API.'
        : baseUrl.trim() === ''
          ? 'Informe a URL base da API.'
          : model.trim() === ''
            ? 'Informe o modelo.'
            : null;

  function handleSave() {
    if (validationError) return;
    const credential = {
      id: `cred-${Date.now()}`,
      provider: providerId,
      label: label.trim(),
      baseUrl: baseUrl.trim().replace(/\/+$/, ''),
      model: model.trim(),
      apiKey: apiKey.trim(),
      createdAt: Date.now(),
    };
    addCredential(credential);
    select(credential.id);
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Fornecedor</ThemedText>
        <ThemedView lightColor="#F2F2F2" darkColor="#1E2023" style={styles.providerList}>
          {PROVIDERS.map((provider) => {
            const isSelected = provider.id === providerId;
            return (
              <Pressable key={provider.id} onPress={() => switchProvider(provider)}>
                <ThemedView
                  lightColor={isSelected ? '#0a7ea4' : undefined}
                  darkColor={isSelected ? '#0a7ea4' : undefined}
                  style={[styles.providerItem, isSelected && styles.providerItemSelected]}>
                  <ThemedText
                    lightColor={isSelected ? '#fff' : undefined}
                    darkColor={isSelected ? '#fff' : undefined}
                    type="defaultSemiBold">
                    {provider.name}
                  </ThemedText>
                  <ThemedText
                    lightColor={isSelected ? '#EAF6FA' : undefined}
                    darkColor={isSelected ? '#EAF6FA' : undefined}
                    style={styles.providerDescription}>
                    {provider.description}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>

        <Field label="Nome de exibição" value={label} onChangeText={setLabel} placeholder="Ex.: Meu ChatGPT" />
        <Field label="Chave de API" value={apiKey} onChangeText={setApiKey} placeholder="sk-…" secureTextEntry autoCapitalize="none" />
        <Field label="URL base" value={baseUrl} onChangeText={setBaseUrl} placeholder="https://api.exemplo.com/v1" autoCapitalize="none" />
        <Field label="Modelo" value={model} onChangeText={setModel} placeholder="Ex.: gpt-4o-mini" autoCapitalize="none" />

        {validationError && <ThemedText style={styles.error}>{validationError}</ThemedText>}
      </ScrollView>

      <ThemedView style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={validationError !== null}
          style={[styles.saveButton, validationError !== null && styles.saveButtonDisabled]}>
          <ThemedText lightColor="#fff" darkColor="#fff" type="defaultSemiBold">
            Salvar chave
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    marginTop: 4,
  },
  providerList: {
    borderRadius: 12,
    gap: 1,
    overflow: 'hidden',
  },
  providerItem: {
    padding: 14,
    gap: 2,
  },
  providerItemSelected: {
    borderRadius: 12,
  },
  providerDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  fieldGroup: {
    marginTop: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 15,
  },
  fieldInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(127,127,127,0.4)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: '#D22F2F',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.25)',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
});
