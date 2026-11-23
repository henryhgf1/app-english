# app-english

PWA para estudar inglês: flashcards com repetição espaçada, anotações em Markdown, quiz e estatísticas. Funciona **100% offline**, sem conta, sem servidor e **sem nenhum custo**.

## Recursos

- **Flashcards** com frente/verso, explicação em português, IPA, exemplo, fenômeno de *connected speech* e tags.
- **Add cards**: formulário rápido, colagem de JSON gerado por IA e linhas `frente | verso`. O botão **Copy prompt** no app copia um prompt que faz qualquer IA devolver cards no formato exato.
- **Revisão espaçada** com algoritmo SM-2 (Again / Hard / Good / Easy), atalhos de teclado e áudio via Web Speech API.
- **Notes** com Markdown, preview, tags e busca.
- **Quiz** de múltipla escolha ou digitação, gerado a partir dos seus cards.
- **Stats**: streak atual e recorde, gráfico de reviews, heatmap e acurácia por deck.
- **Backup JSON** (exportar/importar) e temas claro/escuro.
- Instalável como app (PWA) via `vite-plugin-pwa`.

## Custos

Nenhum. React, Vite e as bibliotecas são open-source; o GitHub Free inclui repositórios, GitHub Pages (HTTPS) e GitHub Actions grátis para repositórios públicos; os dados ficam no IndexedDB do navegador. Não há API paga, chave de API, banco ou servidor.

## Como usar

1. Abra o app e crie decks em **Decks** (já existem três decks iniciais).
2. Em **Add cards**, clique em **Copy prompt**, cole o prompt na sua IA preferida e cole a resposta JSON de volta na aba **Paste JSON**.
3. Revise os cards, edite se quiser e salve.
4. Em **Review**, estude os cards vencidos. Use `Espaço` para virar e `1`–`4` para avaliar.
5. Faça **backup** em **Settings → Export JSON** de vez em quando.

### Formato JSON aceito

```json
[
  {
    "kind": "connected-speech",
    "front": "going to → gonna",
    "back": "going to",
    "ipa": "/ˈɡənə/",
    "phenomenon": "reduction",
    "explanation": "Em fala rápida, 'going to' reduz para 'gonna'.",
    "example": "I'm gonna call you tomorrow.",
    "tags": ["connected-speech", "reduction"]
  }
]
```

Campos obrigatórios: `front` e `back`. Todos os outros são opcionais. `kind` aceita `word`, `phrase` ou `connected-speech`. Também é aceito um objeto `{ "cards": [...] }`.

## Desenvolvimento

Requer Node.js 20+ (testado com Node 22).

```bash
npm install
npm run dev      # servidor local
npm test         # testes do algoritmo SM-2
npm run build    # gera dist/
npm run preview  # serve o build localmente
```

O app usa rotas por hash (`#/decks`), então funciona em hospedagem estática sem configuração de fallback.

## Privacidade

Tudo é salvo no **IndexedDB** deste navegador e nas preferências do `localStorage`. Nada é enviado para lugar algum. O service worker guarda o app para uso offline. Se limpar os dados do site, use o backup JSON para restaurar.

## Deploy no GitHub Pages

O build é publicado automaticamente por um GitHub Actions workflow (`.github/workflows/deploy.yml`). O `base` do Vite está configurado como `/app-english/`; se você renomear o repositório, ajuste `base` em `vite.config.ts`.

Após o deploy: `https://henryhgf1.github.io/app-english/`

## Estrutura

```
src/
├── app/          # shell, navegação, tema, settings context
├── components/   # componentes reutilizáveis
├── features/     # add/cards/decks/review/notes/quiz/stats/settings/dashboard
├── hooks/        # useLiveQuery do Dexie
├── lib/          # db, backup, srs, stats, speech, types
└── styles/       # design system em CSS
```
