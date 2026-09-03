import { FlashList, FlashListRef, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCredentials } from '@/context/credentials-context';
import { generateChatCompletion, SYSTEM_PROMPT, type ChatMessage } from '@/lib/ai/client';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

const ACCENT_COLOR = '#0a7ea4';
const BUBBLE_ASSISTANT_LIGHT = '#F2F2F2';
const BUBBLE_ASSISTANT_DARK = '#1E2023';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
};

const SUGGESTIONS = [
  'Me dê uma receita de margarita clássica',
  'Quero um drink sem álcool com maracujá',
  'Sugira 3 drinks com gin e limão',
  'Qual o passo a passo de um Old Fashioned?',
  'Drink para servir numa festa de 20 pessoas',
];

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

export default function ChatScreen() {
  const router = useRouter();
  const { credentials, selectedId, selected, select, loading: credentialsLoading } = useCredentials();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const listRef = useRef<FlashListRef<UiMessage> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardOpenRef = useRef(false);
  const contentHeightRef = useRef(0);
  const baselineHeightRef = useRef(0);
  const gapToScreenBottomRef = useRef<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      keyboardOpenRef.current = true;
      const baseline = baselineHeightRef.current;
      const before = contentHeightRef.current;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const after = contentHeightRef.current;
          const resized = Math.max(baseline, before) - after > 40;
          if (resized) {
            setKeyboardInset(0);
            return;
          }
          const keyboardHeight = Keyboard.metrics()?.height ?? 0;
          const offset0 = gapToScreenBottomRef.current ?? 0;
          setKeyboardInset(Math.max(keyboardHeight - offset0 + 5, 0));
        });
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardOpenRef.current = false;
      requestAnimationFrame(() => {
        baselineHeightRef.current = contentHeightRef.current;
      });
      setKeyboardInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  function handleContentLayout(event: LayoutChangeEvent) {
    contentHeightRef.current = event.nativeEvent.layout.height;
    if (!keyboardOpenRef.current) {
      baselineHeightRef.current = event.nativeEvent.layout.height;
    }
  }

  function measureInputGap() {
    if (keyboardOpenRef.current) return;
    inputRef.current?.measureInWindow((x, y, width, height) => {
      if (height <= 0 || gapToScreenBottomRef.current !== null) return;
      const windowHeight = Dimensions.get('window').height;
      const inputBottom = y + height;
      if (inputBottom > 0 && inputBottom <= windowHeight) {
        gapToScreenBottomRef.current = windowHeight - inputBottom;
      }
    });
  }

  useEffect(() => {
    const timer = setTimeout(measureInputGap, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [messages, sending]);

  const canSend = !sending && input.trim().length > 0 && selected !== null;

  async function handleSend(presetText?: string) {
    const text = (presetText ?? input).trim();
    if (!text || sending || !selected) return;

    const history: UiMessage[] = [...messages, { id: nextId(), role: 'user', content: text }];
    setMessages(history);
    setInput('');
    setSending(true);

    const apiMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    try {
      const reply = await generateChatCompletion(selected, apiMessages);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.';
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: message, isError: true },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const renderItem: ListRenderItem<UiMessage> = ({ item }) => (
    <ThemedView
      lightColor={item.role === 'user' ? ACCENT_COLOR : BUBBLE_ASSISTANT_LIGHT}
      darkColor={item.role === 'user' ? ACCENT_COLOR : BUBBLE_ASSISTANT_DARK}
      style={[
        styles.bubble,
        item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
      ]}>
      <ThemedText
        lightColor={item.role === 'user' ? '#fff' : undefined}
        darkColor={item.role === 'user' ? '#fff' : undefined}
        style={item.isError ? styles.errorText : undefined}>
        {item.content}
      </ThemedText>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Chat de Drinks
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            {credentials.length === 0
              ? 'Nenhuma chave cadastrada.'
              : selected
                ? `${selected.label} · ${selected.model}`
                : 'Escolha uma chave abaixo.'}
          </ThemedText>
        </ThemedView>

        {credentials.length > 0 && (
          <ThemedView style={styles.chipRow}>
            <FlashList
              data={credentials}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chipContent}
              renderItem={({ item }) => (
                <Pressable onPress={() => select(item.id)}>
                  <ThemedView
                    lightColor={item.id === selectedId ? ACCENT_COLOR : BUBBLE_ASSISTANT_LIGHT}
                    darkColor={item.id === selectedId ? ACCENT_COLOR : BUBBLE_ASSISTANT_DARK}
                    style={styles.chip}>
                    <ThemedText
                      lightColor={item.id === selectedId ? '#fff' : undefined}
                      darkColor={item.id === selectedId ? '#fff' : undefined}
                      style={styles.chipText}>
                      {item.label}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              )}
            />
          </ThemedView>
        )}

        {!credentialsLoading && credentials.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Para começar, cadastre uma chave de API de um provedor de IA
              (ChatGPT, Claude, Gemini, DeepSeek…).
            </ThemedText>
            <Pressable style={styles.ctaButton} onPress={() => router.push('/credential-form')}>
              <ThemedText lightColor="#fff" darkColor="#fff" type="defaultSemiBold">
                Cadastrar chave de API
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedView
            style={[styles.flex, { paddingBottom: keyboardInset }]}
            onLayout={handleContentLayout}>
            <FlashList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContent}
              ListEmptyComponent={
                <ThemedView style={styles.emptyChat}>
                  <ThemedText type="subtitle" style={styles.emptyChatTitle}>
                    O que vamos preparar?
                  </ThemedText>
                  <ThemedText style={styles.emptyChatHint}>
                    Toque em uma sugestão ou escreva sua própria mensagem.
                  </ThemedText>
                  <ThemedView style={styles.suggestionWrap}>
                    {SUGGESTIONS.map((suggestion) => (
                      <Pressable key={suggestion} onPress={() => handleSend(suggestion)}>
                        <ThemedView
                          lightColor={BUBBLE_ASSISTANT_LIGHT}
                          darkColor={BUBBLE_ASSISTANT_DARK}
                          style={styles.suggestionChip}>
                          <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </ThemedView>
                </ThemedView>
              }
            />
            {sending && (
              <ThemedView style={styles.typingRow}>
                <ActivityIndicator size="small" color={ACCENT_COLOR} />
                <ThemedText style={styles.typingText}>Preparando seu drink…</ThemedText>
              </ThemedView>
            )}
            <ThemedView style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Escreva sua mensagem…"
                placeholderTextColor="#8E8E93"
                multiline
                style={[styles.input, { color: textColor }]}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => handleSend()}
                disabled={!canSend}
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol size={22} color="#fff" name="paperplane.fill" />
                )}
              </Pressable>
            </ThemedView>
          </ThemedView>
        )}
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
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    opacity: 0.6,
  },
  chipRow: {
    paddingVertical: 8,
  },
  chipContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 14,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 8,
    flexGrow: 1,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '85%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  errorText: {
    color: '#D22F2F',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  emptyChat: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 24,
  },
  emptyChatTitle: {
    textAlign: 'center',
  },
  emptyChatHint: {
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestionWrap: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: {
    fontSize: 14,
  },
  ctaButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  typingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingBottom: 16,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
