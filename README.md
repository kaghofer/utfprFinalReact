# 🍹 DrinkMaster

Aplicativo mobile desenvolvido com **React Native (Expo)** para o projeto final (UTFPR). O app gera **receitas de drinks e coquetéis** com inteligência artificial, permitindo cadastrar chaves de API de diferentes provedores de IA diretamente no celular.

## ✨ Funcionalidades

- **Chat com IA especializado em drinks**: converse e peça receitas no formato Nome → Ingredientes → Modo de preparo → Copo/guarnição.
- **Cadastro de chaves API genérico e multi-provedor**:
  - ChatGPT (OpenAI)
  - Claude (Anthropic)
  - Google Gemini
  - DeepSeek
  - Qualquer provedor compatível com o formato OpenAI (OpenRouter, Groq, etc.)
- Cada cadastro armazena: provedor, nome de exibição, chave, URL base e modelo — todos editáveis no momento do cadastro.
- **Persistência local** das chaves e da seleção ativa (AsyncStorage).
- **Tema claro e escuro** automático.
- **Lista performática** com FlashList (mensagens, chaves e sugestões).
- Sugestões de pedidos para facilitar o primeiro uso.
- Tratamento de erros amigável (chave inválida, limite de requisições, timeout, etc.).

## 🧱 Stack

| Tecnologia | Uso |
|---|---|
| [Expo SDK 57](https://docs.expo.dev/) | Plataforma e build |
| [React Native 0.86](https://reactnative.dev/) | Framework |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Navegação por arquivos |
| [FlashList](https://shopify.github.io/flash-list/) | Listas de alto desempenho |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Persistência local |
| [expo-symbols](https://docs.expo.dev/versions/latest/sdk/symbols/) | Ícones nativos (SF Symbols / Material Icons) |

## 📁 Estrutura do projeto

```
app/
  _layout.tsx              → Layout raiz (provedor de credenciais + navegação)
  credential-form.tsx      → Tela de cadastro de chave API
  (tabs)/
    _layout.tsx            → Abas (Chat | Chaves)
    index.tsx              → Chat de drinks (IA)
    keys.tsx               → Lista de chaves cadastradas
components/
  themed-text.tsx          → Texto com tema claro/escuro
  themed-view.tsx          → View com tema claro/escuro
  haptic-tab.tsx           → Aba com feedback tátil
  ui/icon-symbol.tsx       → Ícones cross-platform
context/
  credentials-context.tsx  → Estado global das credenciais
constants/
  theme.ts                 → Paleta de cores e fontes
hooks/
  use-color-scheme.ts      → Tema ativo do sistema
  use-theme-color.ts       → Cores do tema
lib/
  ai/
    providers.ts           → Presets dos provedores (URL/modelo padrão)
    client.ts              → Chamada à API de IA (OpenAI e Anthropic) + prompt
  storage/
    api-keys.ts            → CRUD das chaves no AsyncStorage
assets/images/             → Ícones e splash do app
```

## 🚀 Como rodar

Pré-requisitos: **Node.js 20.19+** (versões pares suportadas) e o app **Expo Go** no celular (mesma versão do SDK do projeto — SDK 57), com o celular na **mesma rede Wi-Fi** do computador.

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start
```

No terminal aparecerá um **QR code** — escaneie com o Expo Go (Android/iOS) ou pressione `a` (Android), `i` (iOS) ou `w` (web).

> Dica: se o celular não encontrar o servidor na rede local, rode com o modo túnel: `npx expo start --tunnel`.

### 📝 Onde conseguir as chaves de API

| Provedor | Painel | Observações |
|---|---|---|
| OpenAI | https://platform.openai.com/api-keys | Modelos ex.: `gpt-4o-mini` |
| Anthropic | https://console.anthropic.com | Confira o modelo vigente no console |
| Google Gemini | https://aistudio.google.com/apikey | URL base usa o endpoint compatível com OpenAI |
| DeepSeek | https://platform.deepseek.com | Modelo `deepseek-chat` |

**Atenção**: as chaves ficam armazenadas somente no aparelho (AsyncStorage). Não compartilhe o app com suas chaves e evite colocá-las em repositórios públicos.

## 🧠 Como a IA é chamada

O app fala com as APIs de duas formas, escolhidas pelo provedor cadastrado (`lib/ai/providers.ts`):

1. **Formato OpenAI** — `POST {baseUrl}/chat/completions` com `Authorization: Bearer` (OpenAI, Gemini, DeepSeek, personalizado).
2. **Formato Anthropic** — `POST {baseUrl}/messages` com `x-api-key` e `anthropic-version` (Claude).

O prompt de sistema (`lib/ai/client.ts`) orienta o modelo a responder em português com receitas estruturadas de drinks. As respostas são recebidas de uma vez (sem streaming), com timeout de 90s.

## 🧭 Fluxo de uso

1. Abra a aba **Chaves** e toque em **Nova chave**.
2. Escolha o provedor, preencha a chave (URL e modelo já vêm preenchidos) e salve.
3. Volte ao **Chat**, selecione a chave ativa (chip) e pergunte algo como:
   > *"Me dê uma receita de margarita clássica"*
4. A IA responde com o drink estruturado. Use as sugestões na tela vazia para testar rapidamente.

## 🛠️ Scripts úteis

```bash
npm start            # Inicia o Metro Bundler
npm run android      # Abre no Android (emulador/dispositivo)
npm run ios          # Abre no iOS Simulator
npm run web          # Abre no navegador
npm run lint         # ESLint
npx tsc --noEmit     # Verificação de tipos
npx expo-doctor      # Diagnóstico do projeto
```

## 📄 Licença

Projeto acadêmico — uso educacional.
