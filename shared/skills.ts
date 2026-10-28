import type { RequirementCategory } from "./types";

export interface SkillEntry {
  label: string;
  aliases: string[];
  category: Extract<RequirementCategory, "technical" | "tools">;
}

/**
 * Dicionário curado. Só entra termo técnico verificável — evita que o extrator
 * transforme adjetivo genérico em requisito.
 */
export const SKILL_ENTRIES: SkillEntry[] = [
  // Linguagens
  { label: "JavaScript", aliases: ["js", "ecmascript"], category: "technical" },
  { label: "TypeScript", aliases: ["ts"], category: "technical" },
  { label: "Python", aliases: ["py"], category: "technical" },
  { label: "Java", aliases: ["java se", "java ee"], category: "technical" },
  { label: "C#", aliases: ["csharp", "c sharp", "dotnet", ".net"], category: "technical" },
  { label: "C++", aliases: ["cpp"], category: "technical" },
  { label: "C", aliases: [], category: "technical" },
  { label: "Go", aliases: ["golang"], category: "technical" },
  { label: "Rust", aliases: [], category: "technical" },
  { label: "Ruby", aliases: [], category: "technical" },
  { label: "PHP", aliases: [], category: "technical" },
  { label: "Swift", aliases: [], category: "technical" },
  { label: "Kotlin", aliases: [], category: "technical" },
  { label: "Scala", aliases: [], category: "technical" },
  { label: "Elixir", aliases: [], category: "technical" },
  { label: "R", aliases: ["r language", "linguagem r"], category: "technical" },
  { label: "SQL", aliases: ["pl sql", "t sql"], category: "technical" },
  { label: "HTML", aliases: ["html5"], category: "technical" },
  { label: "CSS", aliases: ["css3"], category: "technical" },
  { label: "Sass", aliases: ["scss"], category: "technical" },
  { label: "Bash", aliases: ["shell script", "shell"], category: "technical" },

  // Frontend
  { label: "React", aliases: ["react.js", "reactjs"], category: "technical" },
  { label: "Next.js", aliases: ["nextjs", "next js"], category: "technical" },
  { label: "Vue", aliases: ["vue.js", "vuejs"], category: "technical" },
  { label: "Angular", aliases: ["angularjs"], category: "technical" },
  { label: "Svelte", aliases: ["sveltekit"], category: "technical" },
  { label: "Astro", aliases: [], category: "technical" },
  { label: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"], category: "technical" },
  { label: "Bootstrap", aliases: [], category: "technical" },
  { label: "Redux", aliases: ["redux toolkit"], category: "technical" },
  { label: "Zustand", aliases: [], category: "technical" },
  { label: "React Query", aliases: ["tanstack query"], category: "technical" },
  { label: "Vite", aliases: [], category: "tools" },
  { label: "Webpack", aliases: [], category: "tools" },
  { label: "Jest", aliases: [], category: "tools" },
  { label: "Vitest", aliases: [], category: "tools" },
  { label: "Testing Library", aliases: ["react testing library"], category: "tools" },
  { label: "Cypress", aliases: [], category: "tools" },
  { label: "Playwright", aliases: [], category: "tools" },
  { label: "Storybook", aliases: [], category: "tools" },
  { label: "Acessibilidade (WCAG)", aliases: ["wcag", "acessibilidade web", "a11y"], category: "technical" },
  { label: "Design System", aliases: ["design systems"], category: "technical" },

  // Backend
  { label: "Node.js", aliases: ["nodejs", "node js", "node"], category: "technical" },
  { label: "Express", aliases: ["express.js", "expressjs"], category: "technical" },
  { label: "NestJS", aliases: ["nest.js"], category: "technical" },
  { label: "FastAPI", aliases: ["fast api"], category: "technical" },
  { label: "Django", aliases: [], category: "technical" },
  { label: "Flask", aliases: [], category: "technical" },
  { label: "Spring Boot", aliases: ["spring"], category: "technical" },
  { label: "Laravel", aliases: [], category: "technical" },
  { label: "Ruby on Rails", aliases: ["rails"], category: "technical" },
  { label: "GraphQL", aliases: [], category: "technical" },
  { label: "REST", aliases: ["rest api", "api rest", "restful"], category: "technical" },
  { label: "gRPC", aliases: [], category: "technical" },
  { label: "Microsserviços", aliases: ["microservices", "microservicos"], category: "technical" },
  { label: "WebSockets", aliases: ["websocket"], category: "technical" },
  { label: "Autenticação OAuth", aliases: ["oauth", "oauth2", "openid connect", "oidc"], category: "technical" },
  { label: "JWT", aliases: ["json web token"], category: "technical" },

  // Dados
  { label: "PostgreSQL", aliases: ["postgres"], category: "technical" },
  { label: "MySQL", aliases: ["mariadb"], category: "technical" },
  { label: "SQLite", aliases: [], category: "technical" },
  { label: "MongoDB", aliases: ["mongo"], category: "technical" },
  { label: "Redis", aliases: [], category: "technical" },
  { label: "Elasticsearch", aliases: ["elastic search", "opensearch"], category: "technical" },
  { label: "Kafka", aliases: ["apache kafka"], category: "technical" },
  { label: "RabbitMQ", aliases: [], category: "technical" },
  { label: "Airflow", aliases: ["apache airflow"], category: "tools" },
  { label: "dbt", aliases: [], category: "tools" },
  { label: "Spark", aliases: ["apache spark", "pyspark"], category: "technical" },
  { label: "Snowflake", aliases: [], category: "tools" },
  { label: "BigQuery", aliases: ["big query"], category: "tools" },
  { label: "Power BI", aliases: ["powerbi"], category: "tools" },
  { label: "Tableau", aliases: [], category: "tools" },
  { label: "Looker", aliases: ["looker studio"], category: "tools" },
  { label: "Pandas", aliases: [], category: "technical" },
  { label: "NumPy", aliases: ["numpy"], category: "technical" },
  { label: "Scikit-learn", aliases: ["sklearn", "scikit learn"], category: "technical" },
  { label: "TensorFlow", aliases: [], category: "technical" },
  { label: "PyTorch", aliases: ["torch"], category: "technical" },
  { label: "Jupyter", aliases: ["jupyter notebook"], category: "tools" },

  // Cloud e DevOps
  { label: "AWS", aliases: ["amazon web services"], category: "technical" },
  { label: "Azure", aliases: ["microsoft azure"], category: "technical" },
  { label: "Google Cloud", aliases: ["gcp", "google cloud platform"], category: "technical" },
  { label: "Docker", aliases: ["containers", "containeres"], category: "technical" },
  { label: "Kubernetes", aliases: ["k8s"], category: "technical" },
  { label: "Terraform", aliases: [], category: "tools" },
  { label: "Ansible", aliases: [], category: "tools" },
  { label: "Jenkins", aliases: [], category: "tools" },
  { label: "Git", aliases: ["git flow", "gitflow"], category: "tools" },
  { label: "GitHub Actions", aliases: ["gh actions"], category: "tools" },
  { label: "GitLab CI", aliases: ["gitlab ci cd"], category: "tools" },
  { label: "CI/CD", aliases: ["ci cd", "integracao continua", "entrega continua"], category: "technical" },
  { label: "Linux", aliases: ["ubuntu", "debian"], category: "technical" },
  { label: "Nginx", aliases: [], category: "tools" },
  { label: "Prometheus", aliases: [], category: "tools" },
  { label: "Grafana", aliases: [], category: "tools" },
  { label: "Datadog", aliases: [], category: "tools" },
  { label: "Sentry", aliases: [], category: "tools" },
  { label: "Observabilidade", aliases: ["observability", "monitoramento"], category: "technical" },

  // IA
  { label: "Machine Learning", aliases: ["aprendizado de maquina", "ml"], category: "technical" },
  { label: "Deep Learning", aliases: ["aprendizado profundo"], category: "technical" },
  { label: "LLM", aliases: ["large language model", "modelos de linguagem"], category: "technical" },
  { label: "RAG", aliases: ["retrieval augmented generation"], category: "technical" },
  { label: "Prompt Engineering", aliases: ["engenharia de prompt"], category: "technical" },
  { label: "NLP", aliases: ["processamento de linguagem natural"], category: "technical" },
  { label: "Visão Computacional", aliases: ["computer vision"], category: "technical" },
  { label: "LangChain", aliases: [], category: "tools" },
  { label: "Hugging Face", aliases: ["huggingface"], category: "tools" },
  { label: "OpenAI", aliases: ["api da openai"], category: "tools" },

  // Produto, gestão e escritório
  { label: "Jira", aliases: [], category: "tools" },
  { label: "Confluence", aliases: [], category: "tools" },
  { label: "Notion", aliases: [], category: "tools" },
  { label: "Scrum", aliases: [], category: "technical" },
  { label: "Kanban", aliases: [], category: "technical" },
  { label: "Metodologias ágeis", aliases: ["agile", "agilista", "metodologia agil"], category: "technical" },
  { label: "Excel", aliases: ["microsoft excel", "planilhas"], category: "tools" },
  { label: "Google Sheets", aliases: ["google planilhas"], category: "tools" },
  { label: "SAP", aliases: [], category: "tools" },
  { label: "Salesforce", aliases: [], category: "tools" },
  { label: "HubSpot", aliases: [], category: "tools" },

  // Design
  { label: "Figma", aliases: [], category: "tools" },
  { label: "Adobe XD", aliases: [], category: "tools" },
  { label: "Photoshop", aliases: ["adobe photoshop"], category: "tools" },
  { label: "Illustrator", aliases: ["adobe illustrator"], category: "tools" },
  { label: "UX/UI", aliases: ["ux", "ui", "ux ui", "experiencia do usuario"], category: "technical" },
];

/** Termos comportamentais só entram quando aparecem explicitamente na vaga. */
export const BEHAVIORAL_TERMS: Array<{ label: string; aliases: string[] }> = [
  { label: "Comunicação", aliases: ["comunicacao", "comunicativo"] },
  { label: "Trabalho em equipe", aliases: ["trabalho em equipe", "colaboracao", "colaborativo"] },
  { label: "Liderança", aliases: ["lideranca", "liderar times", "gestao de pessoas"] },
  { label: "Resolução de problemas", aliases: ["resolucao de problemas", "problem solving"] },
  { label: "Proatividade", aliases: ["proatividade", "proativo"] },
  { label: "Adaptabilidade", aliases: ["adaptabilidade", "flexibilidade"] },
  { label: "Pensamento crítico", aliases: ["pensamento critico", "analitico"] },
  { label: "Organização", aliases: ["organizacao", "organizado"] },
  { label: "Autonomia", aliases: ["autonomia", "autonomo"] },
  { label: "Negociação", aliases: ["negociacao"] },
  { label: "Gestão de tempo", aliases: ["gestao de tempo", "time management"] },
  { label: "Atenção a detalhes", aliases: ["atencao a detalhes", "detalhista"] },
];

export const LANGUAGE_NAMES = ["inglês", "espanhol", "francês", "alemão", "italiano", "mandarim"];

export const LANGUAGE_LEVELS: Array<{ label: string; aliases: string[]; rank: number }> = [
  { label: "básico", aliases: ["basico", "iniciante", "a1", "a2"], rank: 1 },
  { label: "intermediário", aliases: ["intermediario", "b1", "b2"], rank: 2 },
  { label: "avançado", aliases: ["avancado", "c1"], rank: 3 },
  { label: "fluente", aliases: ["fluente", "fluency", "c2", "nativo"], rank: 4 },
];
