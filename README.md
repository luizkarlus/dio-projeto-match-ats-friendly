# Match ATS

Aplicação web em português do Brasil que compara um currículo com a descrição de uma vaga, mostra o que está evidenciado, o que não está e gera uma versão do currículo mais fácil de ler por pessoas e por sistemas de triagem (ATS).

> **Este projeto roda localmente.** Não depende de Lovable Cloud, banco de dados, autenticação ou publicação. A camada de IA é opcional: sem chave configurada, a análise funciona por regras determinísticas.

## 1. Problema que a aplicação resolve

Candidatos costumam descrever experiências reais com palavras diferentes das usadas no anúncio. Isso dificulta a leitura tanto por recrutadores quanto por sistemas que extraem texto. O Match ATS torna essa distância visível e sugere ajustes de **apresentação**, sem alterar os fatos do currículo.

**Regra de integridade:** o texto do currículo é a única fonte de verdade. A ferramenta não cria experiências, cargos, empresas, datas, métricas, formações, certificações ou competências.

## 2. Funcionalidades implementadas

- Dois campos independentes (vaga e currículo) com contador de caracteres, validação e exemplos fictícios.
- Normalização de texto (acentos, caixa, siglas, termos compostos como `C#`, `C++`, `Node.js`).
- Extração de requisitos por dicionário de competências, padrões de anos de experiência, formação, idioma e licença.
- Classificação de prioridade: obrigatório, desejável ou não classificado, inclusive por seção do anúncio ("Requisitos:" / "Desejável:").
- Comparação com evidência textual: exato, semântico, parcial, ausente ou indeterminado.
- Índice de compatibilidade reproduzível (0–100), calculado apenas pelo código.
- Palavras-chave encontradas e ausentes, com trecho de apoio e ocorrências.
- Análise por critério (técnico, ferramentas, experiência, formação, comportamental, outros).
- Recomendações de estrutura, clareza, terminologia e relevância.
- Currículo otimizado editável, com cópia do texto editado e exportação em PDF A4.
- Modo determinístico local e fallback automático quando o servidor não responde.
- IA opcional com contrato validado por Zod, uma tentativa de reparo e descarte do que não passa na validação.

## 3. Tecnologias

| Camada | Escolha |
|---|---|
| Interface | React 19 + TypeScript + Vite |
| Estilo | Tailwind CSS 4 + primitivos no estilo shadcn/ui |
| Ícones | Lucide |
| Validação | Zod |
| PDF | jsPDF (Helvetica/WinAnsi, texto selecionável) |
| Servidor local | Express 5 + tsx |
| Testes | Vitest + Testing Library |

## 4. Arquitetura e fluxo de dados

```text
navegador                             servidor local (Express :8787)
┌────────────────────────┐            ┌──────────────────────────────┐
│ React                  │  POST      │ valida com Zod               │
│  formulário             │ ─────────► │ análise determinística       │
│  resultados             │            │ + IA opcional (chave aqui)   │
│  editor + PDF          │ ◄───────── │ JSON validado                │
└────────────────────────┘            └──────────────────────────────┘
          │ se /api falhar
          └─► motor determinístico no próprio navegador (mode: "offline")
```

O diretório `shared/` é importado pelos dois lados: a mesma fórmula de pontuação e o mesmo extrator rodam no navegador e no servidor.

```text
match-ats/
├── shared/          motor determinístico (tipos, normalização, extração, match, score, otimização)
├── server/          Express, contrato Zod, prompt, cliente de IA, rate limit
├── src/
│   ├── components/  formulário, resultados, editor, PDF, primitivos de UI
│   ├── lib/         PDF, exemplos fictícios, formatação
│   ├── services/    chamada de /api com fallback local
│   └── test/        testes de interface, PDF e segredos
├── .env.example
└── README.md
```

Nenhum dado é persistido: sem banco, sem histórico, sem cookies de análise. Ao iniciar uma nova análise, os resultados anteriores são descartados.

## 5. Abordagem híbrida

1. **Normalização** — acentos, caixa, pontuação e espaços, preservando sinais técnicos (`c#`, `c++`) e o texto original para exibição.
2. **Extração determinística** — dicionário curado de competências e ferramentas + padrões (anos, formação, idioma, CNH). Alternativas como "Vitest ou Jest" viram um único requisito.
3. **Comparação** — busca por expressão completa com fronteira de palavra, devolvendo o trecho original como evidência. Termo parecido não conta como correspondência.
4. **IA opcional** — interpreta equivalências semânticas, explica lacunas e reescreve a apresentação. Ela **não** define a nota e não pode criar requisitos.
5. **Cálculo** — a pontuação é recalculada no código a partir dos níveis finais.

## 6. Fórmula de pontuação

Base inicial:

| Categoria | Peso |
|---|---|
| Competências técnicas e ferramentas | 40% |
| Experiência profissional | 25% |
| Requisitos obrigatórios | 20% |
| Formação e certificações | 10% |
| Outros requisitos | 5% |

Dentro de cada categoria:

```text
cobertura = Σ (peso_prioridade × valor_evidência) / Σ (peso_prioridade)
```

- prioridade: obrigatório `3`, não classificado `2`, desejável `1,5`;
- evidência: exato `1,0`, semântico `0,85`, parcial `0,55`, ausente `0`;
- `indeterminado` sai do denominador (não pune falta de informação);
- categorias sem requisito são removidas e os pesos redistribuídos proporcionalmente;
- o índice final é `round(Σ(peso_redistribuído × cobertura))`, sempre entre 0 e 100.

O índice é uma **estimativa interna de correspondência textual e contextual**. Não é nota oficial de ATS, não prevê decisão de recrutador e não garante aprovação.

## 7. Como a aplicação evita inventar informações

- Instruções explícitas de integridade no prompt do sistema; vaga e currículo são tratados como **dados**, não instruções.
- A resposta da IA é validada por Zod; campo inválido descarta a resposta inteira e a análise cai para o modo determinístico.
- Requisitos citados pela IA fora da lista extraída são ignorados e reportados em aviso.
- A IA não devolve nota: qualquer número é recalculado pelo motor.
- A versão otimizada é apresentada como sugestão editável, com aviso de revisão.
- Ausência de evidência é exibida como ausência de evidência — não como falta de competência.

## 8. Configuração local

Requisitos: Node.js 22 ou superior, npm.

```bash
npm install
npm run dev
```

- interface: `http://localhost:5173`
- API: `http://localhost:8787` (proxy do Vite em `/api`)

Para o modo de produção local:

```bash
npm run build
npm start
# abre em http://localhost:8787 (API + build estático)
```

### Variáveis de ambiente

Copie `.env.example` para `.env`. Nenhum valor secreto deve ser versionado.

| Variável | Uso |
|---|---|
| `PORT` | porta da API (padrão `8787`) |
| `AI_BASE_URL` | base de um provedor compatível com a API de chat da OpenAI |
| `AI_API_KEY` | chave usada **somente** no servidor |
| `AI_MODEL` | modelo de chat a usar |
| `AI_TIMEOUT_MS` | tempo limite da chamada de IA |
| `RATE_LIMIT_PER_MINUTE` | limite de análises por minuto por IP |

Sem `AI_API_KEY`, o servidor responde em modo determinístico com um aviso explícito. A interface continua funcional. Se a IA falhar, a análise retorna com aviso indicando o motivo (timeout, recusa do provedor, falha de rede ou resposta inválida).

> A chave nunca vai para o bundle do navegador. O frontend só conhece `/api/analyze`.

## 9. Como rodar os testes

```bash
npm test          # execução única
npm run test:watch
npm run typecheck
npm run build
```

Cobertura de testes:

- normalização, acentuação, siglas, fronteira de palavra e evidência;
- extração de requisitos, prioridade por seção, alternativas e anos de experiência;
- cálculo de pontuação, redistribuição de pesos e requisitos indeterminados;
- análise completa, recomendações e critérios;
- contrato de entrada e contrato da resposta da IA;
- interface: validação, carregamento, erro sem perda de texto, resultados, edição, cópia e nova análise;
- PDF: páginas, texto editado e acentuação;
- varredura do código do navegador por padrões de segredo.

Execução local desta versão: **90 testes passando**. O número pode mudar conforme o projeto evolui.

## 10. Limitações conhecidas

- A análise é textual: tabelas, imagens e PDFs escaneados não são interpretados. O currículo precisa ser colado como texto.
- O dicionário de competências é finito; termos fora dele dependem da IA (quando habilitada).
- Estimativa de anos de experiência usa datas do próprio currículo e não substitui validação humana.
- O índice não reproduz o algoritmo de nenhum ATS comercial.
- Não há autenticação, banco, histórico ou multiusuário.
- O rate limit é em memória: adequado a uso local, não a produção distribuída.
- Sem `AI_API_KEY`, não há correspondência semântica nem reescrita generativa.

## 11. Exemplo demonstrativo (dados fictícios)

A interface tem botões **Usar exemplo** nos dois campos. O exemplo é uma vaga fictícia de front-end pleno e o currículo fictício de "Ana Ribeiro". Ao analisar:

- React, TypeScript, Tailwind CSS, Git e "Vitest ou Jest" aparecem como encontrados;
- Next.js, GraphQL e CI/CD aparecem como sem evidência no texto;
- o índice fica na faixa de "alta correspondência textual", com ressalva sobre as lacunas;
- o currículo otimizado mantém nome, contato, empresas, datas e formação do original.

Os exemplos são identificados como fictícios na própria interface e não representam nenhuma pessoa real.

## 12. Evidências de uso

> Espaço reservado para capturas de tela reais. Nenhuma imagem foi inventada.

- `docs/captura-formulario.png` — placeholder
- `docs/captura-resultado.png` — placeholder
- `docs/captura-pdf.png` — placeholder

Ao gerar as capturas, substitua os placeholders e descreva o que cada imagem mostra.

## 13. Histórico de desenvolvimento

1. Estrutura, identidade visual, formulário e estados de carregamento/erro.
2. Motor determinístico: normalização, extração, comparação e pontuação, com testes.
3. Servidor local com validação, camada de IA opcional e fallback.
4. Edição, cópia, exportação em PDF e ajustes de acessibilidade.
5. Testes de interface e de PDF, documentação e verificação final.

Ajustes feitos após a primeira versão:

- alternativas ("Vitest ou Jest") passaram a contar como um único requisito;
- prioridade por seção do anúncio ("Desejável:") passou a valer para as linhas seguintes;
- termos contidos em outros ("CSS" dentro de "Tailwind CSS") deixaram de gerar falso positivo;
- mensagens de falha da IA passaram a distinguir timeout, recusa, rede e validação.

## 14. Aplicação publicada

> Não publicada. Este projeto foi construído para execução local.
> Endereço público: _a definir_.

## 15. Repositório

> Link do repositório GitHub: _a definir_.

## Privacidade

- Os textos são processados em memória e não são gravados em banco.
- Quando a IA está habilitada, vaga e currículo são enviados ao provedor configurado por você; o conteúdo não é registrado em log pela aplicação.
- Nenhum dado pessoal é enviado a ferramentas de monitoramento.
- Recomenda-se revisar o resultado antes de enviar o currículo a qualquer processo seletivo.
