import { getProvider } from '@/lib/ai/providers';
import type { StoredCredential } from '@/lib/storage/api-keys';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export const SYSTEM_PROMPT = [
  'Você é um bartender e mixologista experiente.',
  'Sempre que o usuário pedir receitas de drinks ou coquetéis, responda em português do Brasil usando este formato:',
  '- Nome do drink',
  '- Ingredientes (com quantidades)',
  '- Modo de preparo (passo a passo)',
  '- Tipo de copo e guarnição',
  'Se a pergunta não for sobre drinks, responda normalmente.',
].join('\n');

const REQUEST_TIMEOUT_MS = 90_000;

export class AiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readErrorMessage(bodyText: string): Promise<string | null> {
  try {
    const json = JSON.parse(bodyText);
    if (typeof json?.error?.message === 'string') return json.error.message;
    if (typeof json?.message === 'string') return json.message;
  } catch {
    // corpo não é JSON
  }
  return null;
}

function extractAssistantText(style: 'openai' | 'anthropic', json: unknown): string {
  const data = json as {
    choices?: { message?: { content?: string } }[];
    content?: { text?: string }[];
  };

  if (style === 'anthropic') {
    const text = data.content
      ?.map((block) => block.text ?? '')
      .filter(Boolean)
      .join('\n');
    if (text) return text;
  } else {
    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
  }
  throw new Error('A resposta da IA veio vazia ou em um formato inesperado.');
}

export async function generateChatCompletion(
  credential: StoredCredential,
  messages: ChatMessage[]
): Promise<string> {
  const preset = getProvider(credential.provider);

  const systemText = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');
  const userMessages = messages.filter((m) => m.role !== 'system');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    if (preset.style === 'anthropic') {
      response = await fetch(`${credential.baseUrl}/messages`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': credential.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: credential.model,
          max_tokens: 2048,
          system: systemText || undefined,
          messages: userMessages,
        }),
      });
    } else {
      response = await fetch(`${credential.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${credential.apiKey}`,
        },
        body: JSON.stringify({
          model: credential.model,
          messages,
          temperature: 0.7,
        }),
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('A requisição demorou demais. Tente novamente.');
    }
    throw new Error('Não foi possível conectar ao provedor. Verifique sua conexão.');
  } finally {
    clearTimeout(timer);
  }

  const bodyText = await response.text();

  if (!response.ok) {
    const detail = await readErrorMessage(bodyText);
    if (response.status === 401) {
      throw new AiRequestError(response.status, 'Chave de API inválida ou sem permissão (401).');
    }
    if (response.status === 404) {
      throw new AiRequestError(response.status, 'Endpoint ou modelo não encontrado (404). Confira a URL base e o modelo.');
    }
    if (response.status === 429) {
      throw new AiRequestError(response.status, 'Limite de requisições atingido (429). Aguarde e tente novamente.');
    }
    throw new AiRequestError(response.status, detail ?? `Erro do provedor (HTTP ${response.status}).`);
  }

  try {
    return extractAssistantText(preset.style, JSON.parse(bodyText));
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Resposta inválida do provedor.');
  }
}
