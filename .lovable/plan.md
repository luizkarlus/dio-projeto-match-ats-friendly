# Plano — Match ATS (local)

## Contexto

O mega prompt original assume Lovable Cloud: banco, auth, edge functions, publicação em
`*.lovable.app` e integração de IA gerenciada. Nada disso é necessário ou gratuito.

Esta versão roda 100% na máquina: Vite + React no navegador, um servidor Express local
que guarda a chave de IA, e nenhum serviço externo obrigatório.

## Decisões

| Decisão | Motivo |
|---|---|
| Vite + React 19 + TS + Tailwind 4 | stack do prompt, sem dependência de plataforma |
| Primitivos no estilo shadcn/ui escritos no projeto | evita CLI interativo e Radix desnecessário; mesma API e classes |
| Análise determinística no `shared/` | roda no navegador **e** no servidor; testável isolada |
| IA é camada opcional, nunca a base | app funciona sem chave; IA só interpreta e reescreve |
| Servidor Express local em `:8787` | guarda a chave fora do bundle; proxy do Vite em `/api` |
| Fallback automático para modo determinístico | IA off, sem chave, timeout ou JSON inválido não quebram a análise |
| PDF com jsPDF, fonte Helvetica (WinAnsi) | acentos do pt-BR e texto selecionável, sem serviço externo |
| Sem auth, banco ou histórico | fora do escopo declarado na v1 |
| Sem publicação | entrega local: `npm run build && npm start` |

## Arquitetura

```text
navegador                         servidor local
┌──────────────────────┐         ┌───────────────────────────┐
│ React                │  POST   │ Express :8787             │
│  formulário          │ ──────► │  valida (zod)             │
│  resultados          │         │  análise determinística   │
│  editor + PDF        │ ◄────── │  + IA opcional (segredo)  │
└──────────────────────┘         └───────────────────────────┘
        │ fallback se /api falhar
        └─► analyzeDeterministic() roda no próprio navegador
```

`shared/` é importado pelos dois lados: uma única fórmula de pontuação, um único extrator.

## Fluxo da análise

1. Normalizar textos (acento, caixa, pontuação técnica como `c#`, `c++`, `node.js`).
2. Extrair requisitos da vaga: dicionário de skills/ferramentas + padrões (anos, formação,
   idioma, CNH) + marcadores de obrigatório/desejável.
3. Comparar com o currículo: exato → parcial → sem evidência, guardando o trecho de apoio.
4. Calcular o índice por bucket (técnico 40, experiência 25, obrigatórios 20, formação 10,
   outros 5), redistribuindo quando um bucket não existe.
5. IA (se configurada): equivalência semântica, justificativas e reescrita — sem poder
   definir a nota.
6. Montar recomendações, versão otimizada editável e exportar PDF.

## Pontuação

`coverage_bucket = Σ(peso_prioridade × valor_evidência) / Σ(peso_prioridade)`

- prioridade: obrigatório 3, não classificado 2, desejável 1,5;
- evidência: exato 1,0 · semântico 0,85 · parcial 0,55 · ausente 0;
- `unknown` sai do denominador (não pune falta de evidência);
- buckets sem requisito são removidos e os pesos redistribuídos proporcionalmente;
- `índice = round(Σ(peso_redistribuído × coverage))`, sempre no código.

## Segurança

- Chave só em `.env` do servidor; nenhuma `VITE_*` com segredo.
- Limite de payload (1 MB) e de texto (vaga 20k, currículo 30k caracteres).
- Rate limit simples por IP no endpoint.
- Textos enviados como dados, com instrução explícita anti-injeção.
- Resposta da IA validada por zod; campo inválido descarta a resposta inteira.
- Nenhum log de currículo completo.

## Riscos

| Risco | Tratamento |
|---|---|
| IA inventar experiência | prompt com guardrails + validação + v1 marcada como sugestão editável |
| JSON malformado | zod + 1 retry + fallback determinístico |
| Falso positivo de keyword | dicionário com multi-palavra e boundary; `js` só como alias explícito |
| PDF perder acento | Helvetica WinAnsi + teste de documento com "ç/ã/é" |
| Chave vazar | só servidor; teste que varre `dist/` por padrões de chave |

## Arquivos

```text
match-ats/
├── shared/{types,normalize,skills,extract,match,score,analyze,optimize}.ts
├── server/{index,ai,prompt,schema,rate-limit}.ts
├── src/{App,main,index.css}
├── src/components/{...}.tsx + ui/{...}.tsx
├── src/lib/{pdf,samples,cn,format}.ts
├── src/services/analyze.ts
├── src/test/*.test.{ts,tsx}
└── README.md, .env.example
```

## Fases

1. Estrutura + design tokens + formulário + estados.
2. Motor determinístico + testes.
3. Servidor + IA opcional + fallback.
4. PDF, edição, cópia, responsividade.
5. Testes de UI, README, verificação final.

## Fora de escopo (v1)

Auth, banco, histórico, publicação, multiusuário, upload de PDF/DOCX, integração com
LinkedIn. Documentado no README como limitação conhecida.
