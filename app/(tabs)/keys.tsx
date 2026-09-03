import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getProvider } from '@/lib/ai/providers';
import { Fonts } from '@/constants/theme';
import { useCredentials } from '@/context/credentials-context';
import type { StoredCredential } from '@/lib/storage/api-keys';

export default function KeysScreen() {
  const router = useRouter();
  const { credentials, selectedId, select, removeCredential } = useCredentials();

  function handleRemove(credential: StoredCredential) {
    Alert.alert('Remover chave', `Excluir "${credential.label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => removeCredential(credential.id),
      },
    ]);
  }

  const renderItem: ListRenderItem<StoredCredential> = ({ item }) => {
    const isSelected = item.id === selectedId;
    const preset = getProvider(item.provider);

    return (
      <ThemedView
        lightColor="#F2F2F2"
        darkColor="#1E2023"
        style={styles.card}>
        <View style={styles.cardBody}>
          <ThemedText type="defaultSemiBold">{item.label}</ThemedText>
          <ThemedText style={styles.meta}>
            {preset.name} · {item.model}
          </ThemedText>
          <ThemedText style={styles.meta}>
            Chave: {item.apiKey.slice(0, 6)}••••••••••••{item.apiKey.slice(-4)}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => select(isSelected ? null : item.id)}
            style={[styles.actionButton, isSelected && styles.actionButtonActive]}>
            {isSelected ? (
              <IconSymbol size={20} color="#fff" name="checkmark" />
            ) : (
              <ThemedText type="defaultSemiBold" style={styles.actionText}>
                Usar
              </ThemedText>
            )}
          </Pressable>
          <Pressable onPress={() => handleRemove(item)} style={styles.actionButton}>
            <IconSymbol size={20} color="#D22F2F" name="trash" />
          </Pressable>
        </View>
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Chaves de API
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {credentials.length === 0
              ? 'Nenhuma chave cadastrada ainda.'
              : `${credentials.length} chave(s) cadastrada(s).`}
          </ThemedText>
        </ThemedView>

        <FlashList
          data={credentials}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                Cadastre chaves de provedores de IA (ChatGPT, Claude, Gemini, DeepSeek ou
                qualquer API compatível com OpenAI) para usar no chat de drinks.
              </ThemedText>
            </ThemedView>
          }
        />

        <ThemedView style={styles.footer}>
          <Pressable style={styles.addButton} onPress={() => router.push('/credential-form')}>
            <IconSymbol size={20} color="#fff" name="plus" />
            <ThemedText lightColor="#fff" darkColor="#fff" type="defaultSemiBold">
              Nova chave
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.6,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  meta: {
    fontSize: 13,
    opacity: 0.65,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionButtonActive: {
    backgroundColor: '#0a7ea4',
  },
  actionText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 14,
  },
});
