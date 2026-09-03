export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'custom';

export type ApiStyle = 'openai' | 'anthropic';

export type ProviderPreset = {
  id: ProviderId;
  name: string;
  style: ApiStyle;
  defaultBaseUrl: string;
  defaultModel: string;
  description: string;
};

export const PROVIDERS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    style: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    description: 'Compatível com o formato OpenAI (chat/completions).',
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    style: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    description: 'Usa o formato Messages da Anthropic.',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    style: 'openai',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    description: 'Endpoint compatível com OpenAI do Gemini.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    style: 'openai',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    description: 'Compatível com o formato OpenAI (chat/completions).',
  },
  {
    id: 'custom',
    name: 'Personalizado (OpenAI-compatível)',
    style: 'openai',
    defaultBaseUrl: '',
    defaultModel: '',
    description: 'Qualquer provedor que use o formato OpenAI (OpenRouter, Groq, etc).',
  },
];

export function getProvider(id: ProviderId): ProviderPreset {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[PROVIDERS.length - 1];
}
