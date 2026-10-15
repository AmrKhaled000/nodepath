import type { Resource, ResourceLanguage, ResourceType } from "@/types";

/**
 * Helpers that keep resource links consistent and verifiable.
 *
 * Rules encoded here:
 * - Official documentation links point to stable docs domains.
 * - YouTube links are ALWAYS search links unless a URL is certain.
 *   Never invent a video ID; use `ytSearch` instead and it is
 *   automatically labelled as a search link.
 */

export const docs = (
  title: string,
  url: string,
  description: string,
  language: ResourceLanguage = "en",
  estimatedDuration?: string,
): Resource => ({
  title,
  url,
  resourceType: "official-docs",
  language,
  provider: domainOf(url),
  description,
  verificationStatus: "verified",
  cost: "free",
  ...(estimatedDuration ? { estimatedDuration } : {}),
});

export const article = (
  title: string,
  url: string,
  provider: string,
  description: string,
  options?: { language?: ResourceLanguage; estimatedDuration?: string; cost?: "free" | "paid"; resourceType?: ResourceType },
): Resource => ({
  title,
  url,
  resourceType: options?.resourceType ?? "article",
  language: options?.language ?? "en",
  provider,
  description,
  verificationStatus: "verified",
  cost: options?.cost ?? "free",
  ...(options?.estimatedDuration ? { estimatedDuration: options.estimatedDuration } : {}),
});

export const ytSearch = (
  query: string,
  description: string,
  language: ResourceLanguage = "en",
  estimatedDuration?: string,
): Resource => ({
  title: `YouTube search: ${query}`,
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  resourceType: "video",
  language,
  provider: "YouTube (search result)",
  description,
  verificationStatus: "search-link",
  cost: "free",
  ...(estimatedDuration ? { estimatedDuration } : {}),
});

export const docsSearch = (query: string, description: string): Resource => ({
  title: `Google search: ${query}`,
  url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  resourceType: "search",
  language: "en",
  provider: "Google (search result)",
  description,
  verificationStatus: "search-link",
  cost: "free",
});

/** A verified, stable official documentation set used across the curriculum. */
export const OFFICIAL = {
  nodejsLearn: "https://nodejs.org/en/learn",
  nodejsApi: "https://nodejs.org/api/",
  nodejsDocsGuides: "https://nodejs.org/en/learn/getting-started/nodejs-with-visual-studio-code",
  npmDocs: "https://docs.npmjs.com/",
  npmGettingStarted: "https://docs.npmjs.com/getting-started",
  mdnJsGuide: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
  mdnJsReference: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
  expressDocs: "https://expressjs.com/",
  expressGuide: "https://expressjs.com/en/guide/routing.html",
  expressApi: "https://expressjs.com/en/api.html",
  mongooseDocs: "https://mongoosejs.com/docs/",
  mongooseSchemas: "https://mongoosejs.com/docs/guide.html",
  mongodbDocs: "https://www.mongodb.com/docs/",
  mongodbManual: "https://www.mongodb.com/docs/manual/",
  postgresDocs: "https://www.postgresql.org/docs/",
  postgresTutorial: "https://www.postgresql.org/docs/current/tutorial.html",
  prismaDocs: "https://www.prisma.io/docs",
  prismaGettingStarted: "https://www.prisma.io/docs/getting-started",
  gitDocs: "https://git-scm.com/doc",
  gitBook: "https://git-scm.com/book/en/v2",
  dockerDocs: "https://docs.docker.com/",
  typescriptDocs: "https://www.typescriptlang.org/docs/",
  owaspApi: "https://owasp.org/www-project-api-security/",
  owaspTop10: "https://owasp.org/www-project-top-ten/",
  githubActionsDocs: "https://docs.github.com/en/actions",
  redisDocs: "https://redis.io/docs/latest/",
  rfcHttp: "https://www.rfc-editor.org/rfc/rfc9110",
  rfcJson: "https://www.rfc-editor.org/rfc/rfc8259",
  jestDocs: "https://jestjs.io/docs/getting-started",
  vitestDocs: "https://vitest.dev/guide/",
  zodDocs: "https://zod.dev/",
  joiApi: "https://joi.dev/api/?language=en",
  jsonWebTokens: "https://jwt.io/introduction",
  auth0Jwt: "https://auth0.com/docs/secure/tokens/json-web-tokens",
  bcryptNpm: "https://www.npmjs.com/package/bcrypt",
  argon2Npm: "https://www.npmjs.com/package/argon2",
  helmetDocs: "https://helmetjs.github.io/",
  expressRateLimit: "https://github.com/expressjs/express-rate-limit",
  multerDocs: "https://github.com/expressjs/multer",
  bullmqDocs: "https://docs.bullmq.io/",
  openapiSpec: "https://spec.openapis.org/oas/latest.html",
  swaggerUi: "https://github.com/swagger-api/swagger-ui",
  reactFlowDocs: "https://reactflow.dev/learn",
  nodeBestPractices: "https://github.com/goldbergyoni/nodebestpractices",
  twelveFactor: "https://12factor.net/",
  webDevSimplified: "https://www.youtube.com/@WebDevSimplified",
  traversyMedia: "https://www.youtube.com/@TraversyMedia",
  thenetninja: "https://www.youtube.com/@NetNinja",
  freecodecamp: "https://www.youtube.com/@freecodecamp",
  programmingWithMosh: "https://www.youtube.com/@programmingwithmosh",
  academind: "https://www.youtube.com/@Academind",
} as const;

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external";
  }
}

/** Standard 4-resource bundle used by most lessons. */
export function lessonResources(options: {
  official: { title: string; url: string; description: string };
  videos?: { query: string; description: string; language?: ResourceLanguage; estimatedDuration?: string }[];
  article?: { title: string; url: string; provider: string; description: string; estimatedDuration?: string };
}): Resource[] {
  const list: Resource[] = [
    docs(options.official.title, options.official.url, options.official.description),
  ];
  for (const v of options.videos ?? []) {
    list.push(ytSearch(v.query, v.description, v.language ?? "en", v.estimatedDuration));
  }
  if (options.article) {
    list.push(
      article(options.article.title, options.article.url, options.article.provider, options.article.description, {
        estimatedDuration: options.article.estimatedDuration,
      }),
    );
  }
  return list;
}
