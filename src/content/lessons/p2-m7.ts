import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, article, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m7",
  slug: "testing-and-code-quality",
  title: "Testing & Code Quality",
  description:
    "Prove your Node.js API works: unit, integration and end-to-end testing, the built-in Node test runner, Jest and Vitest, Supertest, mocking, database tests, fixtures, environment-specific config, ESLint and Prettier, debugging failures, coverage and CI.",
  phaseId: "phase-2",
  order: 7,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m7",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m7-unit-testing",
    slug: "unit-testing",
    title: "Unit Testing",
    description:
      "Testing the smallest pieces of your backend in isolation: what counts as a unit, the Arrange-Act-Assert pattern, and what unit tests can and cannot prove.",
    order: 1,
    estimatedMinutes: 15,
    tags: ["testing", "unit-tests", "aaa", "quality"],
    prerequisites: ["p1m3-npm-scripts", "p2m2-controllers-services"],
    relatedTopics: ["p2m7-integration-testing", "p2m7-jest-vitest", "p2m7-mocking-dependencies", "p2m7-test-coverage"],
    learningObjectives: [
      "Define what counts as a unit in a Node.js backend project",
      "Structure a test with the Arrange-Act-Assert pattern",
      "Explain which categories of bugs unit tests can and cannot catch",
      "Decide where to draw the unit boundary inside an Express application",
    ],
    simpleExplanation:
      "A unit test checks one small piece of code all by itself. You give it an input, run it, and compare the result with what you expected. Because nothing else is involved (no server, no database, no network), unit tests run in milliseconds and tell you immediately when a helper function or service method stops behaving the way you designed it.",
    detailedContent: `
A **unit test** exercises the smallest meaningful piece of your code in isolation: a pure function, a small service method, a validation helper, or a single middleware. Nothing outside that unit is involved: no HTTP server, no database, no network, no file system. Because the unit talks to nothing, the test runs in microseconds and fails for exactly one reason: the logic itself was wrong, or somebody changed it.

The universal shape is **Arrange-Act-Assert (AAA)**:

1. **Arrange** — build the inputs and any state the unit needs.
2. **Act** — call the unit exactly once.
3. **Assert** — check the observable result: return value, thrown error, or state that was mutated.

Unit tests are cheap, so write many of them. They still cannot prove that your Express route is mounted at the right path, that your middleware chain runs in the right order, or that your SQL is valid. That is the job of integration and end-to-end tests. The goal is a balanced suite, not a suite of 100% unit tests.

Where is the unit boundary in a backend app? A practical rule: if a function cannot be called without real \`req\` and \`res\` objects, pull the logic out behind it, for example \`createTask(input, repo)\`, so it can be invoked directly. Controllers stay thin glue; services, mappers and pure helpers become the units.

Three properties separate good unit tests from fragile ones: they are **deterministic** (same input, same result every time), **isolated** (they never depend on another test having run first), and **fast** (an entire unit suite should finish in well under a second).
    `,
    howItWorks: `
When you run \`npm test\`, the framework loads your source modules into memory, discovers files matching its test pattern (for example \`*.test.ts\`), and executes the tests registered inside \`describe\` and \`it\` blocks in declaration order.

For each test the runner resets an assertion counter, invokes your callback, and inspects every assertion. \`expect(value).toBe(expected)\` compares with \`Object.is\`; a mismatch throws an \`AssertionError\`. The runner catches that error, marks the test **failed**, records a stack trace pointing at the failing line, and continues with the next test. An uncaught exception, or a rejected promise nobody awaited, is converted into a failure as well.

Nothing is replaced automatically: a unit test only reaches the code you imported. When the callback finishes without throwing, the test is marked **passed**, and the runner prints totals such as "12 passed, 0 failed" at the end of the run.
    `,
    codeExamples: [
      {
        title: "A pure unit test for a pagination helper",
        language: "ts",
        code: `import { describe, expect, it } from "vitest";
import { parsePagination } from "../src/lib/pagination";

describe("parsePagination", () => {
  it("applies defaults when the query is empty", () => {
    // Arrange
    const query = {};
    // Act
    const result = parsePagination(query);
    // Assert
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it("rejects a non-numeric page", () => {
    expect(() => parsePagination({ page: "abc" })).toThrow(/must be a number/i);
  });

  it("caps the limit so a client cannot request everything", () => {
    expect(parsePagination({ limit: "5000" }).limit).toBe(100);
  });
});`,
        description:
          "Three independent tests, each arranging its own input. parsePagination touches no HTTP layer, so this file needs no server and no database.",
      },
      {
        title: "Extract logic so it can be unit tested",
        language: "ts",
        code: `// Before: untestable without a fake req/res pair
export function createTaskHandler(req: any, res: any) {
  const title = String(req.body.title ?? "").trim();
  if (title.length < 3) return res.status(400).json({ error: "title too short" });
  const task = { id: crypto.randomUUID(), title };
  return res.status(201).json(task);
}

// After: pure function, trivial to test
export function buildTask(input: { title?: string }) {
  const title = String(input.title ?? "").trim();
  if (title.length < 3) {
    return { ok: false as const, status: 400, code: "VALIDATION_ERROR" };
  }
  return { ok: true as const, status: 201, task: { id: crypto.randomUUID(), title } };
}`,
        description:
          "Validation is now a pure function. The handler only translates HTTP into function calls, which is exactly the shape unit tests want.",
      },
    ],
    commonMistakes: [
      "Testing through HTTP when you meant to test logic: a unit test that boots Express and hits a database is really an integration test wearing a disguise.",
      "One giant test that arranges twenty things and asserts once at the end, so a failure tells you nothing about which part broke.",
      "Depending on execution order by reading a module-level variable that an earlier test mutated.",
      "Asserting on random ids or timestamps with toBe instead of checking the shape with something like toMatchObject.",
    ],
    bestPractices: [
      "Name tests after behaviour, not implementation: it rejects a title shorter than three characters instead of it sets an error flag.",
      "Keep one reason to fail per test and make each assertion message useful when it reports a mismatch.",
      "Extract pure helpers out of controllers early: it is the cheapest way to raise unit-test coverage in an Express codebase.",
      "Run the unit suite on every save; if it takes more than a few seconds, something is touching I/O.",
    ],
    realWorldUseCases: [
      "Price, tax and discount calculations in a p2-ecommerce-api checkout, where a rounding bug costs real money.",
      "Slug generation and URL validation in a p2-url-shortener, both pure and therefore perfect unit-test targets.",
      "Permission checks such as isOwnerOrAdmin in p2-auth-api, which must be proven for every role combination.",
    ],
    resources: [
      docs("Jest — Getting Started", OFFICIAL.jestDocs, "Official Jest guide covering describe/it structure, matchers and running suites."),
      docs("Vitest — Getting Started", OFFICIAL.vitestDocs, "Vitest guide for writing fast unit tests with an API close to Jest."),
      docs("Node.js — Test runner", "https://nodejs.org/api/test.html", "The built-in node:test module for unit tests with zero dependencies."),
      ytSearch(
        "unit testing javascript arrange act assert",
        "Short videos explaining the AAA pattern with runnable JavaScript examples.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-unit-1",
        title: "Unit test a slugify helper",
        prompt:
          "Write unit tests for a slugify(input) function that lowercases, trims, replaces runs of non-alphanumeric characters with a single hyphen, and strips leading/trailing hyphens. Cover at least four inputs, including an empty string and a string that contains only symbols.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Decide first what slugify returns for an empty or symbol-only input: an empty string or a thrown error. Your tests must pick one and stay consistent.",
          "Use toBe for strings and toThrow for the invalid cases.",
        ],
        solution: `import { describe, expect, it } from "vitest";
import { slugify } from "../src/lib/slugify";

describe("slugify", () => {
  it("lowercases and joins words", () => {
    expect(slugify("My First Post")).toBe("my-first-post");
  });

  it("collapses repeated symbols into one hyphen", () => {
    expect(slugify("Hello!!!  World")).toBe("hello-world");
  });

  it("trims hyphens from both ends", () => {
    expect(slugify("-- shipping --")).toBe("shipping");
  });

  it("returns an empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("returns an empty string for an empty input", () => {
    expect(slugify("")).toBe("");
  });
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-task-api", "p2-url-shortener", "p2-blog-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-integration-testing",
    slug: "integration-testing",
    title: "Integration Testing",
    description:
      "Testing the wiring: routers, middleware chains, error handlers and real dependencies working together, plus the five HTTP outcomes every API suite must cover.",
    order: 2,
    estimatedMinutes: 20,
    tags: ["testing", "integration", "express", "http"],
    prerequisites: ["p2m7-unit-testing", "p2m2-express-app", "p2m5-consistent-responses"],
    relatedTopics: ["p2m7-supertest", "p2m7-testing-databases", "p2m7-test-fixtures", "p2m7-e2e-testing"],
    learningObjectives: [
      "Explain what an integration test covers that a unit test cannot",
      "List the five HTTP outcomes every API endpoint should be tested for",
      "Structure an integration suite around success, validation, auth, 404 and 500 paths",
      "Choose which dependencies stay real and which are replaced during integration testing",
    ],
    simpleExplanation:
      "An integration test checks that the pieces of your server actually fit together: the route path, the middleware, the validation, the controller, and the error handler. Instead of testing one function in isolation, you push a real request through the app and assert on the status code and JSON body that comes back, which catches wiring mistakes unit tests can never see.",
    detailedContent: `
Unit tests prove the logic. **Integration tests prove the wiring.** They start your Express application (usually without binding a network port), push a request through the real middleware chain, and assert on the HTTP response that your error handler finally produces.

The mistake most teams make is stopping at the happy path. A production API must behave correctly in five distinct situations, and each one exercises a different branch of your code:

1. **Successful request** — status 200 or 201, with the created or fetched resource in the body.
2. **Validation failure** — status 400 with a machine-readable code such as \`VALIDATION_ERROR\`, produced by your input validation layer before anything reaches the database.
3. **Authentication error** — status 401 when no token or a bad token is presented, and 403 when a valid token lacks permission. These come from your auth middleware, not from the controller.
4. **Missing resource** — status 404 with a consistent \`NOT_FOUND\` shape, proving your service maps "zero rows" to a response instead of crashing.
5. **Unexpected server error** — status 500 with a generic message and a logged stack trace, proving a thrown dependency failure is caught by centralized error handling and never leaks internals.

Write those five tests for every non-trivial endpoint and you automatically cover the whole vertical slice: router registration, middleware ordering, validation schema, service behaviour, and the final error formatter.

Keep most integration tests pointed at a fake or throwaway dependency for speed, and let a smaller group talk to a real database; both layers are needed.
    `,
    howItWorks: `
An integration test imports your exported \`app\` instead of starting \`server.ts\`. Supertest (or Node 18+ \`fetch\`) then opens an ephemeral connection to the app's request listener.

Express builds an \`IncomingMessage\`, matches the path against the router table, and runs the matching middleware stack in order: CORS, body parsing, authentication, validation, controller, then the four-argument error handler if anything threw. Each layer may short-circuit the chain by sending a response directly.

Assertions run against the final status code, headers and parsed JSON body. Because the error handler runs last, a controller that throws produces a 500 without any test-only code: the test simply triggers the failure (a rejected repository call) and checks that the response is the sanitized 500 users are allowed to see.

Since no real port is published, dozens of suites can run in parallel inside one process.
    `,
    codeExamples: [
      {
        title: "The five outcomes for one endpoint",
        language: "ts",
        code: `import request from "supertest";
import { app } from "../src/app";

describe("POST /api/tasks", () => {
  it("creates a task on a valid request", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${validToken}\`)
      .send({ title: "Ship the API" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ title: "Ship the API" });
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${validToken}\`)
      .send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "No auth" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 for a missing parent project", async () => {
    const res = await request(app)
      .get("/api/projects/nope/tasks")
      .set("Authorization", \`Bearer \${validToken}\`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 when the repository fails", async () => {
    repo.insert.mockRejectedValueOnce(new Error("connection lost"));

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${validToken}\`)
      .send({ title: "Doomed" });

    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
  });
});`,
        description:
          "One describe block, five tests: success, validation failure, authentication error, missing resource and unexpected server error. This is the minimum bar for any write endpoint.",
      },
      {
        title: "Test the error handler directly with a fake response",
        language: "ts",
        code: `import { errorHandler } from "../src/middleware/error-handler";

function fakeRes() {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => ((res.statusCode = code), res);
  res.json = (payload: unknown) => ((res.body = payload), res);
  return res;
}

it("maps an unknown error to a generic 500", () => {
  const res = fakeRes();
  errorHandler(new Error("ECONNREFUSED 10.0.0.5:5432"), {}, res, () => {});

  expect(res.statusCode).toBe(500);
  expect(res.body.error.message).toBe("Something went wrong");
  expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
});`,
        description:
          "Proves that internal details never reach clients, even when the original failure contains a database host name.",
      },
    ],
    commonMistakes: [
      "Only testing the happy path, so a broken validator or missing auth middleware goes unnoticed until production.",
      "Importing server.ts so the suite binds a real port and collides when tests run in parallel.",
      "Asserting on English messages instead of stable machine-readable codes, which break on every copy rewrite.",
      "Writing a 500 assertion that matches the mocked error text, accidentally teaching the suite to expect internal details in responses.",
    ],
    bestPractices: [
      "Give every endpoint the same five-case checklist: success, 400, 401/403, 404 and 500.",
      "Assert status code first, then error code, then body shape: it makes failures readable at a glance.",
      "Keep integration tests deterministic by seeding and cleaning data inside each test rather than relying on what another test left behind.",
      "Log the full error server-side and assert only that the 500 body is generic.",
    ],
    realWorldUseCases: [
      "Protecting p2-auth-api login and refresh endpoints, where a regression in auth middleware must fail CI immediately.",
      "Verifying that p2-blog-api returns a consistent 404 shape for unpublished posts instead of a raw 500.",
      "Guaranteeing p2-ecommerce-api validation errors carry field names so mobile clients can highlight inputs.",
    ],
    resources: [
      docs("Express.js — Error handling", "https://expressjs.com/en/guide/error-handling.html", "Official guide to Express error middleware and the four-argument handler."),
      docs("Supertest — README", "https://github.com/ladjs/supertest", "Library used to drive HTTP assertions against an Express app without binding a port."),
      article(
        "Practical Test Pyramid",
        "https://martinfowler.com/articles/practical-test-pyramid.html",
        "martinfowler.com",
        "Martin Fowler's reference article on how unit, integration and end-to-end tests should balance each other.",
        { estimatedDuration: "20 min" },
      ),
      ytSearch(
        "express api integration testing supertest",
        "Walkthroughs of testing Express routes with Supertest and consistent error responses.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-int-1",
        title: "Add the missing 403 and 500 tests",
        prompt:
          "Your p2-auth-api has a DELETE /api/posts/:id endpoint guarded by an auth middleware and a service-side ownership check. Write the integration tests for the 403 case (a logged-in user who does not own the post) and for the 500 case (the repository throws). Reuse the five-case checklist from this lesson.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "The 403 test needs two fixtures: a post owner and a different logged-in user.",
          "For the 500 case, mock the repository to reject once, then assert that the body does not contain the original error message.",
        ],
      },
      {
        id: "ex-p2m7-int-2",
        title: "Audit an existing endpoint",
        prompt:
          "Pick one write endpoint from any Phase 2 project and list the exact test cases it needs to satisfy the five-outcome checklist. Mark each as already covered, missing or not applicable, then write the one missing test with the highest risk.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: ["Risk ranking usually puts authentication and validation above the 500 path."],
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-ecommerce-api", "p2-chat-backend"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-e2e-testing",
    slug: "e2e-testing",
    title: "End-to-End Testing",
    description:
      "Driving the whole system with real HTTP and real infrastructure, when E2E tests earn their cost, and how to keep them fast and reliable.",
    order: 3,
    estimatedMinutes: 18,
    tags: ["testing", "e2e", "automation", "quality"],
    prerequisites: ["p2m7-integration-testing"],
    relatedTopics: ["p2m7-ci-fundamentals", "p2m7-testing-databases", "p2m7-test-fixtures", "p2m7-debugging-failing-tests"],
    learningObjectives: [
      "Distinguish end-to-end tests from integration tests by the boundaries they cross",
      "Decide which critical user journeys deserve E2E coverage",
      "Start a real server plus real dependencies safely inside a test run",
      "Keep an E2E suite fast and stable enough to run on every pull request",
    ],
    simpleExplanation:
      "An end-to-end test behaves like a real client: it opens a network connection to a freshly started server, sends actual HTTP requests, and checks the effect in the real database. It proves the deployment-shaped system works, but it is slow and brittle, so teams keep only a handful of these tests for the journeys that must never break.",
    detailedContent: `
An **end-to-end (E2E) test** crosses every boundary your code has: real process, real port, real HTTP stack, real database, and often real third-party sandboxes. Nothing is mocked. That makes E2E tests the only ones that can catch a broken environment variable, a missing migration, a wrong CORS origin, or a container that forgets to expose a port.

The trade-off is cost. E2E tests take seconds each, need provisioned infrastructure, and fail for reasons unrelated to your code. The practical rule is **few and critical**: cover the journeys that would lose money or data if they broke.

- A user registers, confirms, and logs in.
- A buyer adds an item to the cart and completes checkout.
- A shortener creates a link and the redirect resolves it.

Typical E2E flow:

1. Provision an isolated database (a separate schema or container).
2. Run migrations and seed a known starting state.
3. Boot the app on an ephemeral port with test configuration.
4. Act like a client: send real requests over HTTP.
5. Assert both the response and the persisted side effects.
6. Tear everything down so the next run starts clean.

Because E2E tests cross process boundaries, they need explicit readiness checks: never send a request before the server has finished binding, or the suite will fail randomly.
    `,
    howItWorks: `
A runner like \`node:test\`, Vitest or Playwright starts a \`beforeAll\` hook that spawns the server as a child process (for example \`node dist/server.js\`) with \`NODE_ENV=test\` and a dedicated \`DATABASE_URL\`. The hook waits until a health endpoint answers 200 before releasing the tests; this polling loop turns "server not ready" from a flake into a clear failure.

Each test then uses \`fetch\` against \`http://127.0.0.1:\${port}\`. Because the connection goes through the real network stack, the request exercises body parsing limits, helmet headers, rate limiting and any proxy middleware exactly as production would.

Side effects are verified by querying the database directly, not only by trusting the response body. Finally an \`afterAll\` closes the server and drops the schema, so parallel workers never see each other's rows.
    `,
    codeExamples: [
      {
        title: "Boot a real server and run a full journey",
        language: "ts",
        code: `import { afterAll, beforeAll, describe, expect, it } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";

let server: ChildProcess;
let baseUrl: string;

beforeAll(async () => {
  const port = process.env.TEST_PORT ?? "4100";
  baseUrl = \`http://127.0.0.1:\${port}\`;
  server = spawn("node", ["dist/server.js"], {
    env: { ...process.env, NODE_ENV: "test", PORT: port },
    stdio: "inherit",
  });

  // Wait for readiness instead of racing the listener
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(\`\${baseUrl}/health\`);
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("server never became ready");
});

afterAll(() => server?.kill());

describe("shortening journey", () => {
  it("creates a link and resolves the redirect", async () => {
    const created = await fetch(\`\${baseUrl}/api/links\`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: "https://nodejs.org" }),
    });
    assert.equal(created.status, 201);
    const { data } = await created.json();
    expect(data.code).toMatch(/^[a-z0-9]{6}$/);

    const redirect = await fetch(\`\${baseUrl}/\${data.code}\`, { redirect: "manual" });
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe("https://nodejs.org");
  });
});`,
        description:
          "The hook starts the built server, polls a health endpoint, and only then lets tests run. No mocks: the whole stack is exercised over a real socket.",
      },
    ],
    commonMistakes: [
      "Sending the first request before the listener is bound, which shows up as a random ECONNREFUSED failure on slow machines.",
      "Reusing one database for every worker, so parallel E2E runs delete each other's rows.",
      "Writing dozens of E2E tests that duplicate integration coverage and turning CI into a 30-minute bottleneck.",
      "Asserting only the response body and never the side effect, so a 201 that stored nothing still passes.",
    ],
    bestPractices: [
      "Keep the E2E suite to a handful of critical journeys and run it on every pull request plus nightly.",
      "Give each parallel worker its own schema or container and drop it in afterAll.",
      "Add a readiness probe endpoint and poll it before sending any request.",
      "Prefer ephemeral ports so several suites can run on one machine without clashing.",
    ],
    realWorldUseCases: [
      "A checkout journey in p2-ecommerce-api that must prove payment, stock decrement and order creation all happened.",
      "Registration to login in p2-auth-api, protecting the exact flow users hit first.",
      "Publishing and reading a post in p2-blog-api through the public API, exactly as a third-party client would.",
    ],
    resources: [
      docs("Node.js — Test runner hooks", "https://nodejs.org/api/test.html#hooks", "before/after hooks in node:test used to start and stop a real server."),
      docs("Playwright — Testing", "https://playwright.dev/docs/intro", "Browser and API E2E tooling with fixtures, retries and trace output."),
      ytSearch(
        "nodejs end to end api testing real server",
        "Examples of booting a real Node.js server inside an automated test suite.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-e2e-1",
        title: "Add a readiness gate",
        prompt:
          "Take any E2E test that spawns your server and replace the fixed sleep with a polling readiness check against a health endpoint. Prove it works by running the suite five times in a row on a machine under load.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Loop with a try/catch around fetch, because a refused connection throws before any status code exists.",
          "Cap the number of attempts so a broken boot fails with a clear message instead of hanging forever.",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-url-shortener", "p2-auth-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-node-test-runner",
    slug: "node-test-runner",
    title: "The Node.js Test Runner",
    description:
      "node:test and node:assert: writing tests with zero dependencies, mocking with mock.fn, and wiring the suite into npm scripts.",
    order: 4,
    estimatedMinutes: 16,
    tags: ["node", "test-runner", "assert", "built-in"],
    prerequisites: ["p2m7-unit-testing", "p1m3-npm-scripts"],
    relatedTopics: ["p2m7-jest-vitest", "p2m7-mocking-dependencies", "p2m7-unit-testing"],
    learningObjectives: [
      "Write unit tests with node:test and node:assert/strict",
      "Choose the right assertion method for values, errors and object shapes",
      "Create and inspect mock functions with mock.fn",
      "Run a suite from the command line and wire it into npm scripts",
    ],
    simpleExplanation:
      "Node ships with its own test framework, so you do not need to install anything. Import describe and it from node:test, write assertions with node:assert, and run node --test in your terminal. It gives you the same basics as Jest (groups, hooks, mocks, filtering) while keeping your project dependency-free.",
    detailedContent: `
The **Node.js test runner** (the \`node:test\` module, stable since Node 20) is built into the runtime. It gives you \`describe\`/\`it\` for grouping, \`before\`/\`after\`/\`beforeEach\`/\`afterEach\` for setup, subtests, concurrency control, mocking helpers, watch mode, and JUnit or TAP output for CI.

Pair it with \`node:assert/strict\`, which turns every mismatch into a thrown \`AssertionError\`:

- \`assert.equal\` and \`assert.deepEqual\` (under the strict import) compare with \`===\` and compare object **types** deeply.
- \`assert.ok\` for boolean conditions.
- \`assert.throws\` and \`assert.rejects\` for error paths, such as a validation helper that must reject bad input.
- \`assert.match\` for regular expressions.

Mocks are first class: \`mock.fn(implementation)\` wraps a function and records \`callCount()\` and \`calls\`. \`t.mock.method(object, "name")\` temporarily replaces a method on a real object and restores it when the test ends, which is exactly what you need to stub a repository without a mocking library.

Because the runner is part of Node, the same test file runs identically on your laptop, on a CI machine and inside a container with no install step. Add scripts such as \`node --test --test-reporter=spec\`, \`node --test --watch\`, or point it at a folder with \`node --test tests/\`.
    `,
    howItWorks: `
Running \`node --test\` makes Node scan the target paths for files matching its test naming convention (\`*.test.js\`, \`*-test.js\`, \`test.js\` and similar), import each file in a fresh module context, and collect every test registered at load time.

The runner then executes them sequentially per file, honouring \`concurrency\` options. Before each test it runs \`beforeEach\` hooks in declaration order; after it, \`afterEach\` hooks. Assertion methods throw, and the runner converts any throw (or rejected promise) into a failure with a stack trace pointing at the source line.

Mock wrappers are transparent proxies: calling the wrapped function executes the supplied implementation, appends an entry to \`mock.calls\`, and increments \`callCount()\`. When a test ends, mocks created with \`t.mock.method\` are automatically restored so mocks never leak into the next test.

Results stream to stdout as TAP or a human-readable spec tree, with a non-zero exit code on failure so CI can gate merges.
    `,
    codeExamples: [
      {
        title: "Unit tests with node:test and node:assert",
        language: "ts",
        code: `import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { notifyUser } from "../src/notify";

describe("notifyUser", () => {
  it("sends exactly one email for a new signup", async () => {
    const send = mock.fn(async () => ({ accepted: true }));

    await notifyUser({ email: "ada@example.com" }, send);

    assert.equal(send.mock.callCount(), 1);
    assert.deepEqual(send.mock.calls[0].arguments[0], { email: "ada@example.com" });
  });

  it("does nothing when there is no email address", async () => {
    const send = mock.fn();

    await notifyUser({}, send);

    assert.equal(send.mock.callCount(), 0);
  });

  it("rejects an invalid address", async () => {
    await assert.rejects(() => notifyUser({ email: "nope" }, mock.fn()), /invalid email/i);
  });
});`,
        description:
          "Zero dependencies: describe/it from node:test, assertions from node:assert/strict, and a mock function that records every call.",
      },
      {
        title: "Replace a method on a real object, then restore it",
        language: "ts",
        code: `import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tasksRepo } from "../src/db/tasks.repo";
import { deleteTask } from "../src/services/tasks";

describe("deleteTask", () => {
  it("returns false when the row does not exist", async (t) => {
    t.mock.method(tasksRepo, "findById", () => Promise.resolve(null));

    const removed = await deleteTask("missing-id");

    assert.equal(removed, false);
  });

  it("registers a fresh spy for this test only", async (t) => {
    const spy = t.mock.method(tasksRepo, "findById", (id: string) =>
      Promise.resolve({ id, title: "real" }),
    );

    await deleteTask("task_1");

    assert.equal(spy.mock.callCount(), 1);
    assert.equal(spy.mock.calls[0].arguments[0], "task_1");
  });
});`,
        description:
          "t.mock.method is scoped to the test context, so mocks never bleed into the next test and no resetModules call is needed.",
      },
    ],
    commonMistakes: [
      "Importing node:assert instead of node:assert/strict, whose deep comparison is looser about prototypes and primitives.",
      "Creating a mock but never asserting on callCount, so the test passes even if the method is never used.",
      "Naming a file utils.spec.ts and then wondering why node --test skips it.",
      "Relying on global expect APIs from Jest: node:test has no globals unless you import them.",
    ],
    bestPractices: [
      "Prefer the strict assertion import so type mismatches fail loudly.",
      "Use t.mock.method inside the test so restoration is automatic, even on failure.",
      "Add a test script such as node --test --test-reporter=spec and keep it identical locally and in CI.",
      "Turn on --watch during development for feedback in a few hundred milliseconds.",
    ],
    realWorldUseCases: [
      "Small p2-url-shortener or p2-inventory-api services where adding Jest would cost more than it saves.",
      "Container images that run tests during the build with nothing but the Node runtime available.",
      "Fast smoke checks inside a monorepo that already uses node:test in other packages.",
    ],
    resources: [
      docs("Node.js — Test runner documentation", "https://nodejs.org/api/test.html", "Official reference for node:test: runners, hooks, mocking and reporters."),
      docs("Node.js — Assertions", "https://nodejs.org/api/assert.html", "Full list of assertion methods and the strict comparison rules."),
      ytSearch(
        "node test runner node --test tutorial",
        "Hands-on videos introducing the built-in Node.js test runner.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-ntr-1",
        title: "Convert a Jest test to node:test",
        prompt:
          "Take any Jest or Vitest unit test you have written and port it to node:test plus node:assert/strict. Replace expect(...).toBe with assert.equal, expect(...).toThrow with assert.throws, and jest.fn with mock.fn. Run it with node --test and confirm the exit code is 0.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "expect(x).toEqual(y) becomes assert.deepEqual(x, y) under the strict import.",
          "The function passed to assert.throws must wrap the call itself, not be the result of calling it.",
        ],
        solution: `import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { calculateTotal } from "../src/pricing";

describe("calculateTotal", () => {
  it("sums line items and applies the discount", () => {
    const items = [
      { price: 1000, qty: 2 },
      { price: 500, qty: 1 },
    ];

    assert.equal(calculateTotal(items, 0.1), 2250);
  });

  it("throws when the discount is out of range", () => {
    assert.throws(() => calculateTotal([], 1.5), /discount/i);
  });

  it("calls the tax provider once", () => {
    const tax = mock.fn(() => 100);
    assert.equal(calculateTotal([], 0, tax), 100);
    assert.equal(tax.mock.callCount(), 1);
  });
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-inventory-api", "p2-url-shortener"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-jest-vitest",
    slug: "jest-and-vitest",
    title: "Jest & Vitest",
    description:
      "Choosing and configuring the two dominant JavaScript test frameworks: matchers, hooks, fake timers, projects and parallel workers.",
    order: 5,
    estimatedMinutes: 22,
    tags: ["jest", "vitest", "frameworks", "configuration"],
    prerequisites: ["p2m7-unit-testing", "p2m7-node-test-runner"],
    relatedTopics: ["p2m7-mocking-dependencies", "p2m7-test-coverage", "p2m7-debugging-failing-tests"],
    learningObjectives: [
      "Compare Jest and Vitest and pick one for a TypeScript backend",
      "Configure test discovery, setup files and timeouts",
      "Use hooks, matchers and fake timers correctly",
      "Explain how watch mode and parallel workers speed up feedback",
    ],
    simpleExplanation:
      "Jest and Vitest are batteries-included test frameworks: they find your test files, run them, give you an expect function with dozens of matchers, and report the results. Vitest started in the Vite world and is generally faster on modern setups; Jest is the older, extremely stable default. Both use the same describe and it style you already know.",
    detailedContent: `
Both frameworks provide the same core vocabulary: \`describe\` to group, \`it\`/\`test\` for a single behaviour, \`beforeEach\` for per-test setup, and a global \`expect\` API with matchers such as \`toBe\`, \`toEqual\`, \`toMatchObject\`, \`toThrow\`, \`resolves\` and \`rejects\`.

**Jest** is the industry default: batteries included, its own transformer, its own resolver, snapshot testing, and a huge ecosystem of matcher libraries. It runs tests in worker processes and supports \`projects\` to execute TypeScript, ESM and Node environments from one command.

**Vitest** is Vite-native: it transforms your code with Vite, starts nearly instantly, supports ESM and TypeScript with almost no configuration, and exposes \`vi\` as its mock API. Its API is intentionally Jest-compatible, so most suites port by changing imports.

Configuration decisions that matter for a backend:

- \`testMatch\` / \`include\` — where tests live (\`tests/**/*.test.ts\`).
- \`setupFiles\` — run before each test file; the standard place to set \`NODE_ENV=test\` and load a test environment file.
- \`testTimeout\` / \`timeout\` — how long a single test may run before it fails.
- \`restoreMocks\` / \`clearMocks\` — automatic cleanup so mocks never leak between files.
- \`pool\` and \`isolate\` — how many workers run in parallel.

Fake timers (\`jest.useFakeTimers()\` or \`vi.useFakeTimers()\`) let you test expiry logic such as token TTLs without sleeping in real time.
    `,
    howItWorks: `
On startup the framework globs for files matching its test pattern and builds a queue. It then spawns worker processes (Jest uses worker forks, Vitest uses tinypool) and distributes test **files** across them; each worker loads one file in an isolated module registry so two files never share module state.

Inside a file, tests run sequentially in declaration order. For each test the runner installs mocks, runs \`beforeEach\` hooks, invokes the test callback, awaits any returned promise, then runs \`afterEach\` hooks. A thrown error or a rejected promise marks the test failed, and the error is serialised with a stack that maps back to your TypeScript source through the transformer.

Watch mode keeps a persistent process, invalidates only the files affected by your last edit, and re-runs the related tests, which typically drops feedback from seconds to a few hundred milliseconds.
    `,
    codeExamples: [
      {
        title: "Same behaviour in both frameworks",
        language: "ts",
        code: `// Vitest
import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkout } from "../src/checkout";
import { payments } from "../src/payments";

vi.mock("../src/payments", () => ({
  payments: { charge: vi.fn() },
}));

describe("checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("charges once and marks the order paid", async () => {
    vi.mocked(payments.charge).mockResolvedValue({ id: "ch_1", ok: true });

    const order = await checkout({ total: 2500, token: "tok_visa" });

    expect(payments.charge).toHaveBeenCalledTimes(1);
    expect(order).toMatchObject({ status: "paid", total: 2500 });
  });

  it("turns a decline into a domain error", async () => {
    vi.mocked(payments.charge).mockRejectedValue(new Error("card_declined"));

    await expect(checkout({ total: 100, token: "tok_visa" })).rejects.toThrow("card_declined");
  });
});

// Jest version: replace vi with jest and swap the vitest import for @jest/globals`,
        description:
          "The two frameworks share matchers and structure, so switching usually means renaming vi to jest and adjusting the mock module path.",
      },
      {
        title: "A backend test configuration file",
        language: "ts",
        code: `// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    testTimeout: 10_000,
    restoreMocks: true,
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: { statements: 80, branches: 75 },
    },
  },
});`,
        description:
          "Discovery, setup file, timeout, automatic mock restoration and coverage thresholds in one place. The Jest equivalent lives under the top-level test key in jest.config.ts.",
      },
    ],
    commonMistakes: [
      "Mixing Jest globals with Vitest imports in the same file, which produces describe is not defined at runtime.",
      "Forgetting restoreMocks and letting a mockResolvedValue from one test silently satisfy the next one.",
      "Setting an aggressive global timeout that fails slow integration tests while unit tests never need it.",
      "Using fake timers without restoring them, so later tests see a frozen Date.now.",
    ],
    bestPractices: [
      "Pick one framework per repository and configure it in package.json scripts so everyone runs the same command.",
      "Enable automatic mock restoration and keep setup files minimal and side-effect free.",
      "Split unit and integration suites into separate projects so the fast suite stays fast.",
      "Run tests with coverage in CI and without coverage locally for speed.",
    ],
    realWorldUseCases: [
      "Vitest in a p2-url-shortener where instant watch mode keeps the edit-test loop under a second.",
      "Jest in a large p2-blog-api with multiple test projects (unit, integration, scripts).",
      "Fake timers in p2-auth-api to prove an access token expires without waiting a real minute.",
    ],
    resources: [
      docs("Jest — Getting Started", OFFICIAL.jestDocs, "Official Jest docs: configuration, matchers, mocks, async tests and CLI options."),
      docs("Vitest — Guide", OFFICIAL.vitestDocs, "Vitest handbook covering config, mocking, coverage and watch mode."),
      docs("Vitest — API (vi)", "https://vitest.dev/api/vi", "Reference for vi.mock, vi.useFakeTimers and every mocking helper."),
      ytSearch(
        "jest vs vitest node backend testing",
        "Comparisons and setup walkthroughs for both frameworks in Node.js projects.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-jv-1",
        title: "Port a suite between frameworks",
        prompt:
          "Take one test file written for Jest and make it run under Vitest (or the reverse). Change only imports and configuration, run both suites, and write down any API differences you hit.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "jest.fn becomes vi.fn, and jest.mock becomes vi.mock.",
          "Check whether your config sets globals: true before assuming expect is global.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api", "p2-auth-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-supertest",
    slug: "supertest",
    title: "Testing HTTP with Supertest",
    description:
      "Driving an Express app without binding a port: requests, assertions on status and body, and covering success, 400, 401, 404 and 500 in one file.",
    order: 6,
    estimatedMinutes: 17,
    tags: ["supertest", "http", "express", "integration"],
    prerequisites: ["p2m7-integration-testing", "p2m2-express-app", "p2m5-error-response-formats"],
    relatedTopics: ["p2m7-unit-testing", "p2m7-mocking-dependencies", "p2m7-test-coverage"],
    learningObjectives: [
      "Structure an Express app so it can be tested without listening on a port",
      "Write Supertest assertions for status codes, headers and JSON bodies",
      "Cover the five HTTP outcomes with Supertest",
      "Chain headers, cookies and auth tokens onto a request",
    ],
    simpleExplanation:
      "Supertest lets you treat your Express app like a function: you send a request such as GET /api/tasks to it and get back a response object you can assert on. No port is opened and no curl is involved, so tests run fast and can check status codes, headers and JSON bodies in a few lines.",
    detailedContent: `
Supertest wraps your app's request handler and dispatches requests through it in-process. The chain reads like HTTP: \`request(app).get("/api/tasks/1").set("Authorization", token).expect(200)\`. The resolved response exposes \`status\`, \`headers\`, \`body\` (already parsed JSON) and \`text\`.

The first prerequisite is **exporting the app separately from the listener**. A \`server.ts\` that calls \`app.listen\` would bind a port as soon as the module is imported, causing EADDRINUSE when suites run in parallel. Split the two:

- \`app.ts\` builds and exports the Express instance.
- \`server.ts\` imports it and calls \`listen\` — this file only ever runs in production.

Supertest is ideal for the five outcomes of an endpoint:

- **200/201** on a valid request, checking the returned entity shape.
- **400** when validation fails, checking the machine-readable error code.
- **401** when the token is missing or malformed.
- **404** when the resource does not exist.
- **500** when an injected dependency failure is caught by your centralized error handler.

Because everything runs in one process, you can combine Supertest with mocked repositories for speed, or point it at a seeded test database for higher confidence. Either way, assert the **status first**, then the error code, then the body shape: the failure output then tells you immediately which layer broke.

Supertest also handles multipart uploads, cookies and redirects, which makes it the tool of choice for testing file endpoints in p2-blog-api without a browser.
    `,
    howItWorks: `
Supertest creates an \`http.Server\` internally from the request handler you pass in, but it does not publish it on a fixed port: for a path-like URL it calls \`server.listen(0)\` so the operating system assigns a free ephemeral port, then issues the request against that socket with \`http.request\`.

The response is buffered, and once the message completes Supertest parses the body based on the \`content-type\` header: JSON responses become \`res.body\`, anything else becomes \`res.text\`. The promise returned by the chain resolves with the response object, which is why tests can simply \`await\` it.

\`.expect(...)\` registers assertions that run when the response arrives; if a status or body check fails, the promise rejects and the test fails with a diff of expected versus actual. The temporary server is closed automatically after each request.
    `,
    codeExamples: [
      {
        title: "One Supertest file, five outcomes",
        language: "ts",
        code: `import request from "supertest";
import { app } from "../src/app";

describe("GET /api/tasks/:id", () => {
  it("returns 200 with the task", async () => {
    const res = await request(app)
      .get("/api/tasks/task_1")
      .set("Authorization", \`Bearer \${token}\`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: "task_1", title: "Ship the API" });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app)
      .get("/api/tasks/task_404")
      .set("Authorization", \`Bearer \${token}\`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 when the repository throws", async () => {
    tasksRepo.findById.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await request(app)
      .get("/api/tasks/task_1")
      .set("Authorization", \`Bearer \${token}\`);

    expect(res.status).toBe(500);
    expect(res.body.error.message).not.toContain("ECONNREFUSED");
  });
});

describe("POST /api/tasks", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "New" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when validation fails", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${token}\`)
      .send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: "title", message: "title must be at least 3 characters" },
    ]);
  });

  it("returns 201 on a valid payload", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${token}\`)
      .send({ title: "Write the release notes" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Write the release notes");
  });
});`,
        description:
          "The canonical Supertest layout: import the app, send a request, assert status, then error code, then body shape for every outcome.",
      },
      {
        title: "Split app from server so tests never bind a port",
        language: "ts",
        code: `// src/app.ts
import express from "express";
import { tasksRouter } from "./routes/tasks";
import { errorHandler } from "./middleware/error-handler";

export const app = express();
app.use(express.json());
app.use("/api/tasks", tasksRouter);
app.use(errorHandler);

// src/server.ts (production entry point only)
import { app } from "./app";
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(\`API listening on port \${port}\`);
});`,
        description:
          "Supertest imports app.ts. Nothing listens on a socket during tests, so multiple suites can run in parallel without EADDRINUSE.",
      },
    ],
    commonMistakes: [
      "Importing the server entry point so the suite binds a fixed port and fails with EADDRINUSE under parallelism.",
      "Forgetting express.json() in the test environment and receiving an empty body for every POST.",
      "Not awaiting the request promise, so the assertion never runs and the test passes vacuously.",
      "Asserting only res.status, which hides a broken error format until a client complains.",
    ],
    bestPractices: [
      "Use a shared helper that attaches the auth header so every test does not repeat .set(...).",
      "Assert status, machine-readable code and body shape in that order.",
      "Seed test data with unique ids per test instead of relying on rows another test created.",
      "Be consistent within a file: either use .expect(...) for simple checks or expect(...) assertions for all of them.",
    ],
    realWorldUseCases: [
      "Proving p2-task-api validation returns field-level details for every rejected payload.",
      "Locking the 401 contract of protected routes in p2-auth-api and p2-chat-backend.",
      "Confirming p2-job-board-api returns 404 rather than an empty 200 for unknown job ids.",
    ],
    resources: [
      docs("Supertest — README", "https://github.com/ladjs/supertest", "Official Supertest documentation with Express examples and .expect usage."),
      docs("Express.js — API", OFFICIAL.expressApi, "Reference for app.listen, middleware and the app instance you pass to Supertest."),
      ytSearch(
        "supertest express api testing tutorial",
        "Step-by-step videos covering Supertest requests and assertions.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-st-1",
        title: "Refactor for testability",
        prompt:
          "Open any Phase 2 project where app.listen runs at import time. Split it into app.ts and server.ts, update your npm start script, and write one Supertest test that hits a health endpoint. Confirm the suite passes twice in a row without port conflicts.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Move only the app.listen call: everything that builds the app stays in app.ts.",
          "Update the start script to point at server.ts (or dist/server.js after a build).",
        ],
        solution: `// src/app.ts
import express from "express";
import { healthRouter } from "./routes/health";

export const app = express();
app.use(healthRouter);

// tests/health.test.ts
import request from "supertest";
import { app } from "../src/app";

it("answers 200 on /health", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-job-board-api", "p2-chat-backend"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-mocking-dependencies",
    slug: "mocking-dependencies",
    title: "Mocking Dependencies",
    description:
      "Replacing slow or external collaborators with controlled doubles: stubs, spies, fakes, module mocks, timers, and when mocking goes too far.",
    order: 7,
    estimatedMinutes: 21,
    tags: ["mocking", "stubs", "spies", "test-doubles"],
    prerequisites: ["p2m7-unit-testing", "p2m7-jest-vitest"],
    relatedTopics: ["p2m7-testing-databases", "p2m7-test-coverage", "p2m7-debugging-failing-tests"],
    learningObjectives: [
      "Tell a stub, a spy, a fake and a mock apart",
      "Mock a module boundary so a service can be tested without its infrastructure",
      "Use fake timers to test expiry logic without sleeping",
      "Recognise when mocking is hiding a real defect",
    ],
    simpleExplanation:
      "A mock is a stand-in for something you do not want to use in a test, such as a payment provider or a database. You program the stand-in with the answer you need and then check how your code called it. This makes tests fast and predictable, but if you mock too much you end up testing your own fake instead of the real system.",
    detailedContent: `
Test doubles come in flavours, and naming them precisely makes design conversations easier:

- **Stub** — returns canned data. A repository stub answers findById with a fixed object.
- **Spy** — records how it was called so you can assert on arguments and call counts.
- **Fake** — a working but simplified implementation, like an in-memory array standing in for Postgres.
- **Mock** — programmed expectations that fail if the interaction does not match.

The useful boundary to mock in a backend is the **module boundary you do not own**: the database driver, the mail provider, the HTTP client to a third party, the clock. Mocking your own domain logic means the test proves nothing.

With Jest and Vitest you mock at the module level: \`jest.mock("../src/db")\` or \`vi.mock("../src/db")\` replaces every export for the whole file, and you then configure each function with \`mockResolvedValue\` or \`mockRejectedValue\`. A rejected mock is how you test the 500 path: make the repository throw and assert that your centralized error handler returns a sanitized 500.

**Fake timers** (\`vi.useFakeTimers()\`, \`jest.useFakeTimers()\`) let you advance time explicitly with \`vi.advanceTimersByTime(...)\`, so a test for a 15-minute token expiry finishes instantly.

The danger: an over-mocked test can pass while the real integration is broken. If a mock returns an object shape the real API never produces, your test validates a fiction. Keep a smaller set of tests where the collaborator is real.
    `,
    howItWorks: `
Module mocking works by intercepting the module registry. When your test file calls \`vi.mock("../src/payments")\`, Vitest registers a factory for that specifier. On the next \`import\` of your service, the transformer rewrites that import to the registered factory instead of loading the real file, so \`payments.charge\` is your programmed function.

Each mock records calls in an array: every invocation pushes an entry holding \`arguments\`, the return value, and the error if any. Assertions like \`toHaveBeenCalledTimes(1)\` simply read \`mock.calls.length\`. \`mockResolvedValue(x)\` is sugar for an implementation returning \`Promise.resolve(x)\`, while \`mockRejectedValue\` returns a rejected promise so \`await\` inside your service throws exactly where a real network failure would.

Fake timers replace the runtime's \`setTimeout\`, \`setInterval\` and \`Date.now\` with a controllable clock. Instead of the event loop scheduling work, callbacks are stored in a queue that only fires when you call \`advanceTimersByTime\`, making expiry tests deterministic.

Mocks registered by \`restoreMocks\`, or scoped with \`t.mock.method\`, are torn down after each test so state never leaks forward.
    `,
    codeExamples: [
      {
        title: "Mock the repository to test success, 404 and 500",
        language: "ts",
        code: `import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTask } from "../src/services/tasks";
import { tasksRepo } from "../src/db/tasks.repo";

vi.mock("../src/db/tasks.repo", () => ({
  tasksRepo: { findById: vi.fn(), insert: vi.fn(), remove: vi.fn() },
}));

const findById = vi.mocked(tasksRepo.findById);

describe("getTask", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the task when it exists", async () => {
    findById.mockResolvedValue({ id: "t1", title: "Ship" });

    const result = await getTask("t1");

    expect(result).toMatchObject({ ok: true, task: { id: "t1" } });
    expect(findById).toHaveBeenCalledWith("t1");
  });

  it("reports not found when the repo returns null", async () => {
    findById.mockResolvedValue(null);

    const result = await getTask("missing");

    expect(result).toEqual({ ok: false, status: 404, code: "NOT_FOUND" });
  });

  it("rethrows so the error middleware can emit a 500", async () => {
    findById.mockRejectedValue(new Error("connection lost"));

    await expect(getTask("t1")).rejects.toThrow("connection lost");
  });
});`,
        description:
          "One mocked boundary, three outcomes: success, a 404 branch, and a rejection that your error middleware converts into a sanitized 500.",
      },
      {
        title: "Fake timers for token expiry",
        language: "ts",
        code: `import { afterEach, describe, expect, it, vi } from "vitest";
import { isExpired } from "../src/auth/tokens";

describe("isExpired", () => {
  afterEach(() => vi.useRealTimers());

  it("is false before the TTL elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const exp = Date.now() + 15 * 60 * 1000;

    vi.advanceTimersByTime(14 * 60 * 1000);

    expect(isExpired({ exp })).toBe(false);
  });

  it("is true after the TTL elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const exp = Date.now() + 15 * 60 * 1000;

    vi.advanceTimersByTime(15 * 60 * 1000 + 1);

    expect(isExpired({ exp })).toBe(true);
  });
});`,
        description:
          "No real sleeping: the clock moves instantly, so an expiry test takes microseconds and never becomes flaky.",
      },
    ],
    commonMistakes: [
      "Mocking your own domain services, so the test only proves your mocks behave as programmed.",
      "Forgetting to restore real timers and breaking unrelated tests that expect time to pass.",
      "Mocking a module with a factory that omits an export the code imports, causing a cryptic undefined is not a function.",
      "Asserting only that a mock was called, never checking the arguments it was called with.",
    ],
    bestPractices: [
      "Mock at infrastructure boundaries: database, third-party APIs, mail, queue and clock.",
      "Always assert arguments, not just call counts.",
      "Pair every mocked suite with a smaller set of tests where the dependency is real.",
      "Enable automatic mock restoration and prefer scoped mocks over file-level side effects.",
    ],
    realWorldUseCases: [
      "Faking the Stripe client in p2-ecommerce-api so checkout tests never touch a payment gateway.",
      "Simulating a failing mail provider in p2-auth-api to prove signup still returns 201 when delivery fails.",
      "Injecting a fake clock in p2-url-shortener to test link expiry windows deterministically.",
    ],
    resources: [
      docs("Jest — Mock functions", "https://jestjs.io/docs/mock-functions", "Official guide to jest.fn, spies, module mocks and fake timers."),
      docs("Vitest — Mocking", "https://vitest.dev/guide/mocking", "How vi.mock, spies and fake timers intercept modules and time."),
      docs("Node.js — Test runner mocking", "https://nodejs.org/api/test.html#mocking", "Built-in mock.method and mock.fn helpers in node:test."),
      ytSearch(
        "mocking dependencies javascript testing",
        "Explainers on stubs, spies and module mocking in JavaScript test suites.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-mock-1",
        title: "Mock a third-party client",
        prompt:
          "Choose an external client in one of your projects (mail, payments, storage, a webhook caller). Write three tests: the happy path where the client resolves, a path where it rejects and your error handler returns 500, and a spy assertion proving your code called the client with the correct arguments exactly once.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Mock the module that wraps the client, not the client library itself; that keeps the seam in your control.",
          "Use toHaveBeenCalledWith to assert the payload, not just the call count.",
        ],
        solution: `import { describe, expect, it, vi } from "vitest";
import { sendWelcomeEmail } from "../src/mail/welcome";
import { mailer } from "../src/mail/mailer";

vi.mock("../src/mail/mailer", () => ({ mailer: { send: vi.fn() } }));
const send = vi.mocked(mailer.send);

it("delivers the welcome email once", async () => {
  send.mockResolvedValue({ id: "msg_1" });

  await sendWelcomeEmail({ email: "ada@example.com", name: "Ada" });

  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ to: "ada@example.com", template: "welcome" }),
  );
});

it("rethrows so the route answers 500", async () => {
  send.mockRejectedValue(new Error("SMTP unavailable"));

  await expect(sendWelcomeEmail({ email: "a@b.c", name: "A" })).rejects.toThrow(
    "SMTP unavailable",
  );
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-auth-api", "p2-url-shortener"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-testing-databases",
    slug: "testing-databases",
    title: "Testing Databases",
    description:
      "Real queries against isolated data: throwaway databases, transaction rollback, truncation strategies, and keeping tests fast and parallel-safe.",
    order: 8,
    estimatedMinutes: 24,
    tags: ["database", "postgres", "mongodb", "isolation"],
    prerequisites: ["p2m7-integration-testing", "p2m4-postgres-from-node", "p2m3-mongoose-connection-management"],
    relatedTopics: ["p2m7-test-fixtures", "p2m7-supertest", "p2m7-ci-fundamentals"],
    learningObjectives: [
      "Choose between truncation, per-test transactions and disposable containers",
      "Isolate tests so parallel workers never see each other's data",
      "Test repository code against a real database engine",
      "Prove side effects by querying the database directly",
    ],
    simpleExplanation:
      "Mocking a database only proves your code talks to your mock. To trust a query you must run it against a real database, but tests cannot share production data. The solution is to give the suite its own throwaway database, wipe or roll back the rows after every test, and make sure parallel runs never collide.",
    detailedContent: `
Database tests sit between integration and end-to-end: your SQL or Mongoose queries are real, so they catch typos, missing columns, wrong operators and constraint violations that mocks hide completely.

Three isolation strategies, in increasing order of fidelity:

1. **Truncate between tests.** \`DELETE FROM tasks\` (or \`TRUNCATE ... RESTART IDENTITY\`) in \`afterEach\`. Simple and realistic, but slower as data grows and unsafe with parallel workers unless each worker has its own schema.
2. **Wrap each test in a transaction that is rolled back.** Fast and perfectly isolated: the test sees its own writes, then everything is discarded. The caveat is code that opens its own connection or commits internally, which escapes your transaction.
3. **Disposable containers or databases.** Spin up Postgres or MongoDB per worker (or per run) with Testcontainers or a CI service block. Highest fidelity, highest cost.

Whichever you choose, the golden rules are: use a **dedicated database name** such as \`app_test\`, never point tests at staging with shared data, and give every fixture row a unique identifier (a uuid or a per-run suffix) so leftovers from an interrupted run cannot match your assertions.

Assert side effects directly: after \`POST /api/tasks\` returns 201, query the table and check the row exists with the expected columns. A 201 with an empty table is exactly the bug a response-only test misses.

Remember that caches sit beside your database: a Redis key written by one test can be read by the next, so flush it on the same hooks.
    `,
    howItWorks: `
On setup, the suite opens a connection pool against \`process.env.DATABASE_URL\` pointing at the test database and runs migrations (never production schema edits by hand). Because pooling is expensive, the pool is created once per worker and closed in \`afterAll\`.

With the transaction strategy, each test begins with \`BEGIN\`, runs its assertions, and ends with \`ROLLBACK\`. PostgreSQL sees the test's inserts inside the transaction, and because nothing was committed, other connections and workers observe nothing. Constraints, triggers and indexes still execute normally, so realism is preserved.

With truncation, \`afterEach\` issues \`TRUNCATE\` statements for every table in dependency order (children before parents), or a single statement listing all tables with \`CASCADE\`.

For Mongoose the equivalent is \`deleteMany({})\` per collection in \`afterEach\`, or connecting to a database whose name includes the worker id.

Either way the connection is released in \`afterAll\` so the test process can exit; otherwise CI hangs waiting for an open handle.
    `,
    codeExamples: [
      {
        title: "Real SQL, real constraints, real round-trip",
        language: "ts",
        code: `import { afterAll, describe, it } from "node:test";
import assert from "node:assert/strict";
import { pool, withTransaction } from "../src/db/pool";
import { insertTask, findTaskById } from "../src/db/tasks.repo";

describe("tasks repository", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("round-trips a task through Postgres", async () => {
    const saved = await withTransaction(async (client) => {
      const row = await insertTask(client, { title: "Ship the API", owner: "ada" });
      assert.equal(row.title, "Ship the API");
      assert.match(row.id, /^[0-9a-f-]{36}$/i);
      return row;
    });

    const found = await findTaskById(saved.id);
    assert.deepEqual(found, saved);
  });

  it("rejects an empty title at the database level", async () => {
    await assert.rejects(
      () => withTransaction((client) => insertTask(client, { title: "", owner: "ada" })),
      /violates check constraint/i,
    );
  });
});`,
        description:
          "The check-constraint test can never be written against a mock: only a real engine can prove the database enforces the rule.",
      },
      {
        title: "Rollback helper wrapped around a Supertest test",
        language: "ts",
        code: `import { pool } from "../src/db/pool";

export async function asCleanSlate(run: () => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await run();
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
}

it("creates a task and stores it", async () => {
  await asCleanSlate(async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", \`Bearer \${token}\`)
      .send({ title: "Isolated" });

    expect(res.status).toBe(201);

    const { rows } = await testClient.query("SELECT * FROM tasks WHERE id = $1", [
      res.body.data.id,
    ]);
    expect(rows).toHaveLength(1);
  });
});`,
        description:
          "Every test runs inside a transaction that is always rolled back in finally, so failures still clean up and parallel workers stay isolated.",
      },
    ],
    commonMistakes: [
      "Pointing the test suite at the development database and slowly polluting it with fixture rows.",
      "Running tests in parallel against one schema, producing random unique-constraint failures.",
      "Truncating tables in the wrong order and hitting foreign key errors.",
      "Asserting only the HTTP response and never verifying that the row was actually persisted.",
    ],
    bestPractices: [
      "Use a dedicated database name per worker and run migrations before the suite, not during tests.",
      "Prefer rollback-per-test for speed, and keep a smaller truncation suite for realism.",
      "Generate unique fixture values with a per-run prefix so stale rows cannot match.",
      "Close the pool in afterAll so the process exits cleanly.",
    ],
    realWorldUseCases: [
      "Proving p2-inventory-api stock decrements really persist and are not lost on rollback.",
      "Verifying p2-blog-api unique slug constraints against real Postgres indexes.",
      "Testing p2-chat-backend message ordering against a real Mongo collection instead of an array.",
    ],
    resources: [
      docs("PostgreSQL — TRUNCATE", "https://www.postgresql.org/docs/current/sql-truncate.html", "Official reference for clearing fixture data between tests."),
      docs("Mongoose — Connecting to MongoDB", "https://mongoosejs.com/docs/connections.html", "Connection lifecycle and how to point tests at a separate database."),
      docs("Testcontainers — Node.js", "https://node-testcontainers.org/", "Programmatic disposable containers for database-backed test suites."),
      ytSearch(
        "database integration testing transactions rollback",
        "Videos on isolating database tests with transactions and containers.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-db-1",
        title: "Pick an isolation strategy",
        prompt:
          "For one Phase 2 project, list the tables or collections involved in your write endpoints and choose an isolation strategy (truncate, transaction, container). Implement it, then run the same suite twice concurrently and confirm both runs pass.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "If two runs collide, give each run its own database name and use a RUN_ID environment variable in fixtures.",
          "Make sure afterAll closes the pool or the runner will report hanging handles.",
        ],
      },
    ],
    projectIds: ["p2-inventory-api", "p2-blog-api", "p2-chat-backend", "p2-ecommerce-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-test-fixtures",
    slug: "test-fixtures",
    title: "Test Fixtures",
    description:
      "Known starting states for tests: factories, seeds, overrides, and why hardcoded JSON snapshots rot fast.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["fixtures", "seeding", "factories", "test-data"],
    prerequisites: ["p2m7-testing-databases", "p2m2-input-validation"],
    relatedTopics: ["p2m7-testing-databases", "p2m7-integration-testing", "p2m7-env-specific-config"],
    learningObjectives: [
      "Define a fixture and explain why tests need a known starting state",
      "Build factory functions with sensible defaults and overrides",
      "Seed and clean fixtures without creating order dependencies",
      "Decide between inline data, seeded files and generated data",
    ],
    simpleExplanation:
      "A fixture is the carefully arranged starting state of a test: the user that already exists, the task that is already in the database, the header you always send. Instead of copying the same object into twenty tests, you write one factory function with defaults and override only the fields each test cares about.",
    detailedContent: `
A **fixture** is any data prepared before a test so it starts from a known state. Without fixtures, tests depend on whatever the previous test left behind, and the suite becomes order-dependent: it passes alone and fails as a whole.

Two complementary styles:

- **Factory functions** (also called builders) return a fresh object per call with defaults you can override, for example \`makeUser({ role: "admin" })\`. They are the default choice for unit and integration tests because each call produces independent data.
- **Seed files** are JSON, SQL or YAML snapshots loaded once. They are useful for golden files, migration tests and contract tests where the exact payload matters.

Good factories have three properties:

1. **Defaults are valid.** \`makeTask()\` must satisfy every validation rule, so a test only overrides what it is about.
2. **Overrides are shallow and typed.** Passing \`{ status: "done" }\` changes one field and nothing else.
3. **Every call is unique.** Include a uuid or a counter so uniqueness constraints are never accidentally satisfied by stale rows.

Avoid giant shared objects copied across files: when the schema changes you edit twenty copies and miss one. Prefer a single factory module that imports the type, so TypeScript tells you about every change.

For relational data, add helpers that create a user and its posts in one call, keeping foreign keys valid without hand-writing inserts.
    `,
    howItWorks: `
A factory is a plain function returning an object literal built from defaults merged with overrides: \`{ ...defaults, ...overrides }\`. Because the defaults are generated inside the function (uuid, timestamp, counter), each call is independent and cannot leak state between tests.

Seed helpers take it further: a \`seedBlog()\` helper opens a transaction, inserts a user and two posts with valid foreign keys, commits, and returns the created rows so tests can assert against real ids instead of guessing them.

Cleanup hooks make fixtures safe to reuse. \`beforeEach\` seeds fresh data for tests that write; \`afterEach\` truncates or rolls back. If you seed once in \`beforeAll\` for read-only tests, never let a test mutate that data, or the next test inherits a different world.

In CI, fixture loading happens before the suite: migrations run, then the seed script, then the tests. The seed step must be idempotent so re-running it on the same database does not duplicate rows.
    `,
    codeExamples: [
      {
        title: "A typed factory with unique defaults",
        language: "ts",
        code: `import { randomUUID } from "node:crypto";
import type { Task, User } from "../src/types";

let counter = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  return {
    id: randomUUID(),
    title: \`Task \${counter}\`,
    status: "todo",
    priority: "medium",
    ownerId: randomUUID(),
    dueDate: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    email: \`user-\${randomUUID().slice(0, 8)}@example.com\`,
    name: "Ada Lovelace",
    role: "member",
    ...overrides,
  };
}`,
        description:
          "Defaults are always valid, every call is unique, and tests override only the field they care about: makeTask({ status: \"done\" }).",
      },
      {
        title: "Seed helper plus cleanup hook",
        language: "ts",
        code: `import { afterAll, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { pool, query } from "../src/db/pool";
import { makeUser, makeTask } from "./factories";

async function seedUserWithTasks(count: number) {
  const user = makeUser();
  const { rows: u } = await query(
    "INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *",
    [user.id, user.email, user.name, user.role],
  );
  const tasks = [];
  for (const task of Array.from({ length: count }, () => makeTask({ ownerId: user.id }))) {
    const { rows } = await query(
      "INSERT INTO tasks (id, title, status, owner_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [task.id, task.title, task.status, task.ownerId],
    );
    tasks.push(rows[0]);
  }
  return { user: u[0], tasks };
}

describe("listTasksForUser", () => {
  beforeEach(async () => {
    await query("TRUNCATE users, tasks CASCADE");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("returns only the owner's tasks", async () => {
    const { user, tasks } = await seedUserWithTasks(3);
    const other = await seedUserWithTasks(1);

    const result = await listTasksForUser(user.id);

    assert.equal(result.length, tasks.length);
    assert.ok(result.every((t) => t.ownerId === user.id));
    assert.notEqual(result.length, tasks.length + other.tasks.length);
  });
});`,
        description:
          "A seed helper creates valid parent-child rows, and beforeEach wipes them so every test starts from the same known state.",
      },
    ],
    commonMistakes: [
      "Seeding once in beforeAll and then letting tests mutate the data, so later tests see a different state.",
      "Hardcoding ids that another developer's seed script assigns differently.",
      "Factories whose defaults violate validation, forcing every test to override the same three fields.",
      "Copying a large fixture object into each test file so a schema change breaks them one by one.",
    ],
    bestPractices: [
      "Keep one factory module per domain type and import it everywhere.",
      "Make fixture data unique per run (uuid or RUN_ID suffix) so leftover rows never match.",
      "Seed inside the test when the test writes; seed in beforeAll only for read-only suites.",
      "Type overrides as Partial<T> so TypeScript rejects misspelled fields.",
    ],
    realWorldUseCases: [
      "Seeding a user, cart and two products in p2-ecommerce-api to test checkout totals.",
      "Creating owner and non-owner accounts in p2-auth-api to test authorization decisions.",
      "Generating hundreds of jobs for p2-job-board-api pagination tests without hand-written JSON.",
    ],
    resources: [
      docs("Faker.js — Documentation", "https://fakerjs.dev/", "Random data generation for unique, realistic fixture values."),
      docs("Node.js — Mocking", "https://nodejs.org/api/test.html#mocking", "Built-in helpers for registering module fixtures in node:test."),
      ytSearch(
        "test fixtures factories javascript best practices",
        "Walkthroughs of factory functions and seeding strategies for test suites.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-fix-1",
        title: "Build a factory module",
        prompt:
          "Create a factory for the main entity of one Phase 2 project (task, post, product, job, message). It must produce valid defaults, accept overrides, and generate unique values on every call. Then rewrite three existing tests to use it instead of inline objects.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Generate ids and unique fields inside the function, not at module load time.",
          "Type the overrides as Partial<T> so TypeScript rejects misspelled fields.",
        ],
        solution: `import { randomUUID } from "node:crypto";
import type { Job } from "../src/types/job";

export function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: randomUUID(),
    title: "Backend Engineer",
    company: "Acme",
    location: "Remote",
    salaryMin: 80000,
    salaryMax: 120000,
    status: "open",
    createdAt: new Date(),
    ...overrides,
  };
}

// usage in a test
const job = makeJob({ company: "Globex", status: "closed" });
expect(job.company).toBe("Globex");
expect(job.title).toBe("Backend Engineer"); // default untouched`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-job-board-api", "p2-blog-api", "p2-auth-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-env-specific-config",
    slug: "environment-specific-config",
    title: "Environment-Specific Config in Tests",
    description:
      "Making NODE_ENV=test mean something: test secrets, separate databases, config validation at boot, and setup files that keep tests deterministic.",
    order: 10,
    estimatedMinutes: 15,
    tags: ["configuration", "environment", "env-vars", "twelve-factor"],
    prerequisites: ["p1m3-environment-variables", "p2m2-configuration-management"],
    relatedTopics: ["p2m7-testing-databases", "p2m7-ci-fundamentals", "p2m7-test-fixtures"],
    learningObjectives: [
      "Create a config module that behaves differently under NODE_ENV=test",
      "Load test-specific secrets and connection strings safely",
      "Fail fast when required environment variables are missing",
      "Write setup files that give every test a deterministic baseline",
    ],
    simpleExplanation:
      "Your app reads settings from environment variables, and tests need different ones: a throwaway database, a fake JWT secret, retries turned off. Setting NODE_ENV=test and loading a .env.test file tells your config module to swap in those values, so tests never touch production services and never depend on what happens to be set on a developer's laptop.",
    detailedContent: `
The twelve-factor app stores config in the environment. That works beautifully until a test accidentally uses the production database URL. The fix is a **single config module** that reads \`process.env\` once, applies environment-aware defaults, and validates the result at boot.

Rules that make this safe:

1. **Set NODE_ENV=test in the test runner.** Jest, Vitest and node:test can all do it in config; a setup file is the simplest place.
2. **Load a test-only env file.** \`.env.test\` contains a dedicated \`DATABASE_URL\`, a fixed \`JWT_SECRET\` and feature flags. It is committed (it holds no real secrets) and never used in production.
3. **Fail fast on missing values.** If \`JWT_SECRET\` is absent in development or production, throw at startup rather than silently generating an insecure default.
4. **Never read process.env directly in business code.** Import \`config\` everywhere so tests can stub one object instead of patching globals.
5. **Keep test defaults boring.** Disable retries against third parties, shorten timeouts, and point rate limiting at a generous no-op value so a suite of 400 requests does not throttle itself.

A setup file is also where you freeze randomness when a test needs it (a seeded RNG), silence the logger to keep output readable, and register global cleanup.

Environment-specific config also controls feature flags: a test can enable the experimental queue path while production keeps it off, both through the same typed \`config.features\` object.
    `,
    howItWorks: `
At import time your config module evaluates its environment, merges defaults with parsed values, and runs a validation step (a Zod or Joi schema). An invalid or missing variable throws a descriptive error before any route is registered, which turns a broken deploy into an immediate, obvious failure.

The test runner sets \`NODE_ENV=test\` in its own process, then loads setup files **before** any test file. Those setup files typically do three things: import a dotenv-style loader pointed at \`.env.test\`, apply overrides to \`process.env\`, and register global hooks such as \`afterEach\` cleanup.

Because every test file runs in the same worker after setup, modules that import \`config\` receive the test values. Modules are loaded once per worker, so config is effectively frozen for that worker — which is why environment variables must be set before the first import, never inside a test.
    `,
    codeExamples: [
      {
        title: "One config module, three environments",
        language: "ts",
        code: `// src/config.ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    "Invalid environment: " +
      parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join(", "),
  );
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  logLevel: env.isTest ? "error" : env.LOG_LEVEL,
  rateLimit:
    env.NODE_ENV === "test"
      ? { max: 10000, windowMs: 60000 }
      : { max: 100, windowMs: 60000 },
} as const;`,
        description:
          "Environment-aware defaults plus fail-fast validation. Tests get a generous rate limit and silent logs; production never boots with a weak secret.",
      },
      {
        title: "Setup file that switches the app into test mode",
        language: "ts",
        code: `// tests/setup.ts
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgres://localhost:5432/app_test";
process.env.JWT_SECRET ??= "test-secret-do-not-use-in-production";
process.env.LOG_LEVEL = "error";

// vitest.config.ts (Jest uses the same idea under setupFiles)
export default {
  test: {
    setupFiles: ["./tests/setup.ts"],
    env: { NODE_ENV: "test" },
  },
};`,
        description:
          "Runs once before any test file imports src/, guaranteeing every module sees test configuration.",
      },
    ],
    commonMistakes: [
      "Reading process.env inside a service, so tests cannot override it after the module has been imported.",
      "Committing a real .env file and letting a developer's local DATABASE_URL leak into the suite.",
      "Setting environment variables inside a test instead of the setup file, which runs too late for config modules.",
      "Silently defaulting a missing JWT_SECRET to an empty string, which lets auth tests pass with an insecure key.",
    ],
    bestPractices: [
      "Expose exactly one config object and import it everywhere.",
      "Validate configuration with a schema at boot and fail with a clear message.",
      "Commit .env.test with harmless values; keep real secrets out of the repository entirely.",
      "Log at error level during tests to keep CI output readable.",
    ],
    realWorldUseCases: [
      "Running p2-auth-api tests against local Postgres while the same image deploys with a cloud connection string.",
      "Disabling rate limiting in tests so a 400-case suite is not throttled mid-run.",
      "Making p2-chat-backend use an in-memory queue in tests and Redis in production behind one config flag.",
    ],
    resources: [
      docs("The Twelve-Factor App — Config", OFFICIAL.twelveFactor, "Store config in the environment, separate per deploy."),
      docs("Node.js — Process environment", "https://nodejs.org/api/process.html#processenv", "How process.env behaves, including its string-only values."),
      docs("Dotenv — GitHub", "https://github.com/motdotla/dotenv", "Loading .env files, including a separate .env.test for suites."),
      ytSearch(
        "node js environment based configuration testing",
        "Patterns for NODE_ENV, .env files and config modules in Node.js apps.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-env-1",
        title: "Audit your config",
        prompt:
          "List every process.env read in one of your projects. Move them all behind a single validated config module, add a .env.test with test-only values, and confirm the suite still passes when your real .env is temporarily renamed.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "If the suite fails after renaming .env, something is still reading the environment directly.",
          "Wrap the reads in a zod schema so missing values produce a readable message.",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-chat-backend", "p2-task-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-eslint-prettier",
    slug: "eslint-and-prettier",
    title: "ESLint & Prettier",
    description:
      "Automating code style and catching whole classes of bugs before review: flat config, TypeScript rules, formatting, and an autofix script.",
    order: 11,
    estimatedMinutes: 14,
    tags: ["eslint", "prettier", "linting", "style"],
    prerequisites: ["p1m3-npm-scripts"],
    relatedTopics: ["p2m7-ci-fundamentals", "p2m7-debugging-failing-tests", "p2m7-test-coverage"],
    learningObjectives: [
      "Explain the split between linting (correctness) and formatting (style)",
      "Configure ESLint flat config with TypeScript rules",
      "Set up Prettier and stop conflicts between the two tools",
      "Wire lint and format checks into npm scripts and CI",
    ],
    simpleExplanation:
      "ESLint reads your source and points out risky patterns: an unused variable, a floating promise nobody awaits, a comparison with == that behaves unexpectedly. Prettier ignores all that and simply rewrites your spacing, quotes and line breaks consistently. Together they remove style arguments from code review and catch real bugs before the tests even run.",
    detailedContent: `
Two tools, two jobs:

- **ESLint** checks *meaning*. It flags unused variables, unreachable code, accidental globals, \`==\` comparisons, unhandled promises and hundreds of patterns that cause bugs. Rules can be errors, warnings or off.
- **Prettier** checks *appearance* only. It parses your code into an AST and prints it back with fixed quotes, indentation, trailing commas and line wrapping. It has almost no configuration by design.

ESLint has moved to **flat config** (\`eslint.config.js\`), an array of objects where each entry can scope rules to files with a \`files\` key. For TypeScript, use \`typescript-eslint\`, which layers type-aware rules on top of the JavaScript ones. Rules worth turning on early in a backend:

- \`no-floating-promises\` (type-aware) — catches a forgotten \`await\` that would silently drop an error.
- \`require-await\` — an async function with no await is usually a mistake.
- \`no-console\` restricted to warn/error — keeps debug logs out of production code.
- \`eqeqeq: "smart"\` — prevents loose equality beyond the null check.

For TypeScript projects, disable ESLint rules that Prettier already enforces (run \`eslint-config-prettier\`) so the two never fight over formatting. Then add scripts: \`lint\`, \`lint:fix\` and \`format\`. Run \`lint\` in CI with \`--max-warnings 0\` so warnings cannot quietly accumulate.

Linting is the cheapest test you have: it runs in a second, needs no fixtures, and reports the exact file and line.
    `,
    howItWorks: `
ESLint parses each file into an AST with Espree (or the \`typescript-eslint\` parser), then walks the tree once per enabled rule. Each rule is a function that receives context nodes and returns problem objects with a message, severity and source location. The CLI aggregates them, applies a formatter, and exits non-zero when errors exist — which is exactly what CI needs.

Type-aware rules go further: they ask TypeScript's compiler service for the type of each expression, which is how \`no-floating-promises\` knows that \`doWork()\` returns a Promise nobody awaited. That costs extra time, so type-aware linting usually runs only on \`src/**\` rather than on tests.

Prettier takes a different route: it parses to its own AST, discards all original whitespace, and reprints the document using a Wadler-style algorithm that decides line breaks to fit the configured print width.
    `,
    codeExamples: [
      {
        title: "ESLint flat config for a TypeScript backend",
        language: "js",
        code: `// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "no-floating-promises": "error",
      "require-await": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  prettier,
);`,
        description:
          "Type-aware rules catch missing awaits; the prettier entry switches off every stylistic rule so ESLint and Prettier never disagree.",
      },
      {
        title: "Prettier config and npm scripts",
        language: "json",
        code: `// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}

// package.json scripts
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}`,
        description:
          "Run format:check and lint in CI so a pull request cannot merge with unformatted or warning-laden code.",
      },
    ],
    commonMistakes: [
      "Leaving stylistic ESLint rules enabled alongside Prettier, so the two tools rewrite each other's output on every run.",
      "Turning off a rule repository-wide because one file trips it, instead of adding a narrow ignore or an eslint-disable comment with a reason.",
      "Running lint only locally, so warnings pile up until one day CI fails for a change nobody touched.",
      "Using no-console: off globally and shipping console.log calls that leak request payloads.",
    ],
    bestPractices: [
      "Let Prettier own formatting and ESLint own correctness; never overlap them.",
      "Fail CI on warnings with --max-warnings 0 while developers see them as warnings locally.",
      "Keep eslint-disable comments inline, rare and justified with a short comment.",
      "Run lint:fix before committing so reviewers never see whitespace noise.",
    ],
    realWorldUseCases: [
      "Blocking accidental secrets or debug logs in p2-auth-api through no-console and no-restricted-syntax rules.",
      "Catching a missing await on a fire-and-forget audit write in p2-blog-api.",
      "Keeping every contributor's output identical in p2-inventory-api so diffs stay readable.",
    ],
    resources: [
      docs("ESLint — Getting Started", "https://eslint.org/docs/latest/use/getting-started", "Official guide to installing ESLint and writing flat configuration."),
      docs("ESLint — Configuration files", "https://eslint.org/docs/latest/use/configure/configuration-files", "How the flat config array, files globs and ignores work."),
      docs("Prettier — Installing", "https://prettier.io/docs/install", "Official Prettier setup, configuration file options and CLI."),
      docs("typescript-eslint — ESLint config", "https://typescript-eslint.io/getting-started/", "Type-aware linting rules for TypeScript projects."),
    ],
    exercises: [
      {
        id: "ex-p2m7-lint-1",
        title: "Turn warnings into errors",
        prompt:
          "Run your linter and count the warnings. Fix them all, then change the lint script to fail on warnings. Add one type-aware rule (no-floating-promises or require-await) and fix whatever it finds in your source.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Enable type-aware rules only for src/** first; tests often use looser typing.",
          "eslint-config-prettier must stay last in the config array.",
        ],
        solution: `// eslint.config.js (tail)
export default tseslint.config(
  // ...other configs
  {
    files: ["src/**/*.ts"],
    rules: { "no-floating-promises": "error" },
  },
  prettier, // must be last so it wins on stylistic rules
);

// package.json
{ "scripts": { "lint": "eslint . --max-warnings 0" } }`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api", "p2-inventory-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-debugging-failing-tests",
    slug: "debugging-failing-tests",
    title: "Debugging Failing Tests",
    description:
      "Reading failure output like a pro: separating real regressions from flaky tests, isolating with name filters, and fixing the three common causes of red suites.",
    order: 12,
    estimatedMinutes: 20,
    tags: ["debugging", "flaky-tests", "troubleshooting", "testing"],
    prerequisites: ["p2m7-unit-testing", "p2m7-jest-vitest"],
    relatedTopics: ["p2m7-test-fixtures", "p2m7-mocking-dependencies", "p2m7-e2e-testing"],
    learningObjectives: [
      "Read an assertion diff and identify the failing layer within seconds",
      "Isolate a single test with name filters and targeted file runs",
      "Diagnose the three classic causes of flaky tests: order, time and shared state",
      "Decide whether a failing test is a product bug or a test bug",
    ],
    simpleExplanation:
      "When a test goes red, the output tells you what was expected, what you got, and on which line. Your first job is to decide whether the code broke or the test itself is badly written. Then you shrink the problem: run only that file, then only that test, and check whether it fails alone or only as part of the full suite.",
    detailedContent: `
A failing test is information, not a crisis. Work through it in this order:

1. **Read the diff.** \`Expected: 400\` versus \`Received: 500\` means validation never ran — probably an exception was thrown earlier than you assumed.
2. **Check the stack trace.** A failure inside your test file points at the test; a failure inside \`node_modules\` or a timeout usually points at the environment.
3. **Reproduce in isolation.** Filter to the file, then to the single test (\`--testNamePattern\`, \`-t\` or \`.only\`). If it passes alone, the bug is shared state or ordering, not logic.
4. **Check repeatability.** Run it ten times. A test that fails only sometimes is flaky, and flaky tests erode trust faster than missing tests.

The three classic flake sources:

- **Order dependence.** Test B reads a row that test A created, or a module-level variable that A mutated. Running with a filter or in parallel breaks it.
- **Time dependence.** Assertions on wall-clock time, \`Date.now()\` differences, or \`setTimeout\` durations that race a slow CI machine.
- **Shared external state.** One database, one Redis key, one port or one network call reused across tests or workers.

Also watch for the silent failure: a promise nobody awaited, so the test finishes before the assertion runs and reports a pass that means nothing.

Finally, decide who is wrong. If the product now returns 422 instead of 400 because the API was redesigned, update the test deliberately and say so in the commit message. Never delete a failing assertion just to go green.
    `,
    howItWorks: `
Runners make isolation easy. \`node --test --test-name-pattern "404"\`, \`jest -t "returns 404"\` and \`vitest run -t "returns 404"\` all load the file, register every test, then skip those whose names do not match — so hooks still run, which is exactly what you need to see whether setup is the problem.

For deeper work, run the process under a debugger: \`node --inspect-brk --test tests/tasks.test.ts\`, then attach your editor's debugger and set a breakpoint inside the failing assertion. Watch mode (\`--watch\`) re-runs the affected file on save, so you can iterate on a failing case in under a second.

To detect flakes deliberately, repeat the suite: \`for i in 1..20\` or a runner flag such as \`--repeat\` or Jest's \`--runInBand\` to remove worker parallelism from the equation. If a test passes serially and fails in parallel, you have found shared state.

Finally, log deliberately inside the test: print the actual response body once, confirm it, then replace the print with a real assertion. Temporary \`console.log\` that never gets removed becomes noise for everyone else.
    `,
    codeExamples: [
      {
        title: "Order-dependent test that only fails with a filter",
        language: "ts",
        code: `let createdId: string;

it("creates a user", async () => {
  const res = await request(app)
    .post("/api/users")
    .send({ name: "Ada" });

  expect(res.status).toBe(201);
  createdId = res.body.data.id; // <-- hidden coupling
});

it("deletes the user", async () => {
  const res = await request(app).delete(\`/api/users/\${createdId}\`);

  expect(res.status).toBe(204);
});`,
        description:
          "Both tests pass in a normal run, but npm test -- -t 'deletes the user' leaves createdId undefined and returns 404. Each test must create what it needs.",
      },
      {
        title: "Diagnose a 500 you expected to be a 400",
        language: "ts",
        code: `it("rejects an invalid payload", async () => {
  const res = await request(app)
    .post("/api/tasks")
    .send({ title: "" });

  // Received 500 -> the validator itself threw instead of returning 400
  if (res.status === 500) {
    console.error("unhandled:", res.body); // remove after diagnosing
  }

  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe("VALIDATION_ERROR");
});`,
        description:
          "A single conditional log reveals whether the schema is undefined, the error middleware is missing, or the service threw before validation ran.",
      },
    ],
    commonMistakes: [
      "Deleting or weakening an assertion to make CI green, which permanently hides the regression.",
      "Debugging the full suite every time instead of filtering to the one failing test.",
      "Treating a flaky test as acceptable and re-running CI until it passes.",
      "Leaving console.log diagnostics in the committed test so every future run is harder to read.",
    ],
    bestPractices: [
      "Reproduce first: isolated file, single test, repeated ten times.",
      "Make every test create its own data and clean it up, so ordering never matters.",
      "Mark known flakes with a ticket and a deadline rather than silently retrying forever.",
      "Assert on machine-readable codes, so copy changes never look like regressions.",
    ],
    realWorldUseCases: [
      "A p2-ecommerce-api test that fails only when the whole suite runs, revealing a shared cart fixture.",
      "A p2-auth-api 401 assertion that turned into a 500 after a config variable went missing.",
      "A p2-url-shortener test that races a TTL cache and fails on a loaded CI runner.",
    ],
    resources: [
      docs("Vitest — CLI", "https://vitest.dev/guide/cli", "Filters, watch mode and repeat options for isolating a failing test."),
      docs("Jest — Getting Started", OFFICIAL.jestDocs, "CLI options such as -t, --runInBand and --watch for targeted runs."),
      docs("Node.js — Test runner CLI", "https://nodejs.org/api/test.html#test-runner-executing-tests", "node --test flags including name pattern filtering."),
      ytSearch(
        "debugging flaky tests javascript",
        "Videos on diagnosing order-dependent, time-dependent and shared-state flakes.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-debug-1",
        title: "Find your worst flaky test",
        prompt:
          "Run your full suite ten times in a row (or with parallelism turned off and on). If any test changes result, isolate it, identify which of the three causes applies, and rewrite it so it passes in any order and any repetition.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Run the single test alone with a name filter: if it passes alone, suspect shared state.",
          "Check for before instead of beforeEach, module-level variables and real timers.",
        ],
      },
      {
        id: "ex-p2m7-debug-2",
        title: "Turn a log into an assertion",
        prompt:
          "Find a console.log left in one of your test files. Use it to understand the real response shape, then replace it with a precise assertion on status, error code and body.",
        difficulty: "intermediate",
        estimatedMinutes: 12,
        hints: ["Assert the error code before the message: codes are stable, wording is not."],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-auth-api", "p2-url-shortener"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-test-coverage",
    slug: "test-coverage",
    title: "Test Coverage",
    description:
      "What coverage numbers really mean, how to generate reports, reading branch coverage for the five HTTP outcomes, and choosing honest thresholds.",
    order: 13,
    estimatedMinutes: 16,
    tags: ["coverage", "metrics", "quality", "v8"],
    prerequisites: ["p2m7-unit-testing", "p2m7-integration-testing"],
    relatedTopics: ["p2m7-ci-fundamentals", "p2m7-debugging-failing-tests", "p2m7-mocking-dependencies"],
    learningObjectives: [
      "Read statement, branch, function and line coverage reports",
      "Explain why high coverage does not mean few bugs",
      "Use coverage to find untested error branches such as 404 and 500",
      "Set thresholds that improve a codebase instead of encouraging gaming",
    ],
    simpleExplanation:
      "A coverage report reads your source while tests run and marks which lines and branches actually executed. It cannot tell you whether your assertions were any good, but it is excellent at pointing at the code nobody tested: the 500 branch, the retry path, the empty-result case.",
    detailedContent: `
Coverage tools instrument your source (or use V8's built-in counters) and record what executed during the suite:

- **Statements / lines** — how many statements ran at least once.
- **Branches** — how many decision outcomes were taken: both arms of an \`if\`, each case of a \`switch\`, the null and non-null paths of \`??\`.
- **Functions** — how many declared functions were called.

The number is a **floor, not a ceiling**. A test that calls your function with no assertions still raises coverage. Ten thousand covered lines with zero assertions prove nothing about correctness. Treat coverage as a map of where you have *not* looked.

Coverage shines brightest on error paths. For a typical Express handler the happy path covers maybe 60% of branches; the remaining branches are exactly the ones production hits at 3 a.m.: validation failure (400), authentication error (401/403), missing resource (404), and an unexpected exception turned into 500 by your error middleware. Write those tests first when a report shows an uncovered red line.

Practical workflow:

1. Run the suite with coverage and open the HTML or text report.
2. Sort by lowest coverage inside \`src/\`, not test files.
3. For each uncovered branch, ask whether it is reachable. If yes, write a test; if not, exclude the file.
4. Set thresholds slightly *below* your current value so the build fails only when coverage drops.

Popular setups: Vitest with the v8 provider, Jest with \`collectCoverage\`, or \`c8\` wrapping \`node --test\`.
    `,
    howItWorks: `
With V8-native coverage (Vitest and c8), Node's built-in profiler records block-level execution counters while your tests run. On exit, the tool maps those counters back to your original source through source maps, then aggregates per statement, branch and function. No source rewriting is needed, so the tested code runs at full speed.

Istanbul-style instrumentation (used by Jest's default provider) instead rewrites your files at transform time, inserting counters into every statement and branch before execution. It is more precise about branches but adds overhead and can confuse source maps.

Either way the report is produced by difference: lines that executed are green, lines that never ran are red. A branch is "covered" only when every outcome of that decision was observed, which is why a single \`if (err)\` needs one test where it is true and one where it is false.

CI reads the final percentage and compares it against configured thresholds, exiting non-zero when the value falls below them.
    `,
    codeExamples: [
      {
        title: "Generate and gate coverage",
        language: "bash",
        code: `# Vitest with the v8 provider
npx vitest run --coverage

# Jest
npx jest --coverage --coverageReporters=text lcov

# Node's built-in runner wrapped by c8
npx c8 --reporter=text --reporter=lcov node --test

# package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test": "vitest run"
  }
}`,
        description:
          "Add one script so local runs and CI produce the same report, then read coverage/lcov-report/index.html.",
      },
      {
        title: "The uncovered branches behind a 500",
        language: "ts",
        code: `export async function getTask(id: string) {
  if (!isValidId(id)) {
    return { status: 400, code: "VALIDATION_ERROR" }; // branch A
  }

  try {
    const task = await tasksRepo.findById(id);
    if (!task) {
      return { status: 404, code: "NOT_FOUND" }; // branch B
    }
    return { status: 200, data: task }; // branch C
  } catch (err) {
    logger.error(err);
    throw err; // branch D -> error middleware answers 500
  }
}

// Four tests cover every branch:
// 1. getTask("not-an-id")            -> 400
// 2. getTask("00000000-0000-0000-0000-000000000000") with repo null  -> 404
// 3. getTask(existingId)              -> 200
// 4. getTask(existingId) with repo rejecting -> 500 via middleware`,
        description:
          "Every branch of this handler maps to one of the five HTTP outcomes. If any line is red in the report, a production scenario is untested.",
      },
    ],
    commonMistakes: [
      "Chasing 100% coverage by writing assertions-free tests that execute lines without checking anything.",
      "Measuring test files and scripts alongside src/, which inflates the number meaninglessly.",
      "Setting a threshold higher than the current value and then adding throwaway tests just to pass CI.",
      "Assuming 90% coverage means 90% of bugs are caught; coverage says nothing about assertion quality.",
    ],
    bestPractices: [
      "Use coverage to find uncovered error branches (400/401/404/500), not to decorate a badge.",
      "Fail the build only when coverage *drops* below your agreed floor.",
      "Exclude migrations, type definitions and generated clients from the report.",
      "Pair the percentage with a habit of reading the annotated source for critical files.",
    ],
    realWorldUseCases: [
      "Discovering that p2-auth-api never tested the 403 branch of its ownership check.",
      "Finding that p2-task-api's repository catch block was untested, hiding a crash on connection loss.",
      "Justifying a refactor in p2-inventory-api by showing coverage stayed flat while code got simpler.",
    ],
    resources: [
      docs("Vitest — Coverage", "https://vitest.dev/guide/coverage", "Configuring the v8 or istanbul provider, thresholds and reporters."),
      docs("Jest — Configuration (coverage)", OFFICIAL.jestDocs, "collectCoverage, coveragePathIgnorePatterns and threshold options."),
      docs("c8 — README", "https://github.com/bcoe/c8", "Coverage for the built-in node:test runner using V8 coverage."),
      ytSearch(
        "code coverage explained branch line coverage",
        "Visual explanations of statement versus branch coverage and why the difference matters.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-cov-1",
        title: "Close an uncovered branch",
        prompt:
          "Run coverage on one Phase 2 project, open the report for a single service file, and list every uncovered branch. Classify each as reachable or dead code, then write tests that raise that file's branch coverage without adding a single assertion-free test.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Error paths are usually the red lines: repository rejection, null result, invalid id.",
          "A branch you cannot reach is a candidate for deletion, not for exclusion.",
        ],
        solution: `// Before: only the happy path was tested, so both guards were red
it("returns 200", async () => {
  const res = await request(app).get("/api/tasks/task_1").set("Authorization", token);
  expect(res.status).toBe(200);
});

// After: every branch has a test
it("returns 400 for a malformed id", async () => {
  const res = await request(app).get("/api/tasks/!!").set("Authorization", token);
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe("VALIDATION_ERROR");
});

it("returns 404 for an unknown id", async () => {
  const res = await request(app).get("/api/tasks/missing").set("Authorization", token);
  expect(res.status).toBe(404);
});

it("returns 500 when the repository throws", async () => {
  tasksRepo.findById.mockRejectedValueOnce(new Error("boom"));
  const res = await request(app).get("/api/tasks/task_1").set("Authorization", token);
  expect(res.status).toBe(500);
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-inventory-api"],
    quizId: "quiz-p2-m7",
  },
  {
    ...shared,
    id: "p2m7-ci-fundamentals",
    slug: "ci-fundamentals",
    title: "CI Fundamentals",
    description:
      "Turning a local suite into a gate: workflow files, jobs, caches, services, required checks and keeping the pipeline fast and trustworthy.",
    order: 14,
    estimatedMinutes: 23,
    tags: ["ci", "github-actions", "automation", "pipelines"],
    prerequisites: ["p1m3-git-fundamentals", "p2m7-eslint-prettier", "p2m7-test-coverage"],
    relatedTopics: ["p2m7-test-coverage", "p2m7-e2e-testing", "p2m7-testing-databases"],
    learningObjectives: [
      "Explain continuous integration and why it catches integration failures early",
      "Write a GitHub Actions workflow that lints, type-checks and tests",
      "Provision a database service for tests in CI",
      "Keep a pipeline fast with caching, sharding and sensible job splitting",
    ],
    simpleExplanation:
      "Continuous integration means every push runs your checks on a clean machine that nobody forgot to update. A workflow file installs your dependencies, runs the linter, the type checker and the tests, and marks the pull request green or red. Because it runs the same commands everywhere, 'it works on my machine' stops being an argument.",
    detailedContent: `
**Continuous integration (CI)** is the practice of merging small changes frequently and verifying each one automatically. The pipeline is a script executed by a fresh virtual machine for every push and pull request.

A healthy Node.js pipeline runs these steps in order, cheapest first:

1. **Checkout** the commit.
2. **Install** with a lockfile (\`npm ci\`, not \`npm install\`) so CI gets byte-identical dependencies.
3. **Lint** — ESLint with \`--max-warnings 0\`.
4. **Type check** — \`tsc --noEmit\`.
5. **Unit and integration tests** with coverage.
6. **Build** the production bundle.
7. **E2E** as a separate, possibly slower job.

Order matters: failing in one second during lint is cheaper than failing after a three-minute test run.

For database-backed tests, GitHub Actions provides **services**: declarative containers such as Postgres that start before your steps and are reachable on localhost. Set \`DATABASE_URL\`, run migrations, then run the suite.

Speed comes from **caching** (the npm cache and \`node_modules\` keyed on the lockfile hash) and from splitting work across parallel jobs. Failing fast also means configuring \`fail-fast\` deliberately: you usually want every job to report rather than cancelling the rest on the first error.

The last piece is branch protection: require the CI check to pass before merging, so nobody can bypass the gate. A red main branch that everyone ignores is worse than no CI at all.
    `,
    howItWorks: `
A workflow is YAML under \`.github/workflows/\`. You declare events (\`push\`, \`pull_request\`), and GitHub spins up an ephemeral runner, checks out your repository, and executes each \`run\` step in order inside a shell. Each step's exit code decides the outcome; a non-zero code fails the step and the job.

\`uses:\` steps pull a prepared action from the marketplace — \`actions/checkout\`, \`actions/setup-node\` with built-in npm caching — instead of a shell command.

\`services:\` blocks are containers started by the runner before steps run; they expose ports on the runner's localhost and carry health checks so the job waits until Postgres accepts connections instead of racing it.

Each job gets its own runner, so jobs run in parallel while steps inside one job run sequentially. Artifacts and caches bridge them: a build job can upload \`dist/\` and a deploy job can download it.

Secrets come from the repository's encrypted secrets store and are injected as environment variables only for steps that need them, keeping tokens out of the log.
    `,
    codeExamples: [
      {
        title: "A complete Node.js CI workflow",
        language: "yaml",
        code: `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      NODE_ENV: test
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
      JWT_SECRET: ci-only-secret-value-16-chars

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build`,
        description:
          "Lint and type-check before tests, a healthy Postgres service for integration runs, npm ci for reproducible installs, and a production build as the final gate.",
      },
      {
        title: "package.json scripts the pipeline calls",
        language: "json",
        code: `{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "build": "tsc -p tsconfig.build.json"
  }
}`,
        description:
          "CI never invents commands: it runs exactly the same npm scripts developers run locally.",
      },
    ],
    commonMistakes: [
      "Using npm install in CI instead of npm ci, so a silently updated dependency breaks the build later.",
      "Running the slow E2E suite first, wasting minutes before a one-second lint failure surfaces.",
      "Committing a workflow that reads a secret the repository has not defined, so every job fails on day one.",
      "Letting main go red for weeks until the team stops looking at the check at all.",
    ],
    bestPractices: [
      "Fail fast: order steps from cheapest to most expensive.",
      "Cache the package manager downloads keyed on the lockfile hash.",
      "Keep CI commands identical to npm scripts so local reproduction is trivial.",
      "Require the CI check in branch protection and fix a red main before starting new work.",
    ],
    realWorldUseCases: [
      "Gating every pull request to p2-auth-api with lint, typecheck and unit tests in under two minutes.",
      "Running Postgres-backed integration tests for p2-inventory-api using a service container.",
      "Running the p2-ecommerce-api E2E checkout journey nightly while fast suites gate every merge.",
    ],
    resources: [
      docs("GitHub Actions — Documentation", OFFICIAL.githubActionsDocs, "Official guide to workflows, jobs, steps, services and secrets."),
      docs("GitHub Actions — Workflow syntax", "https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions", "Full reference for triggers, jobs, services and matrices."),
      docs("actions/setup-node", "https://github.com/actions/setup-node", "Node version selection and built-in dependency caching."),
      ytSearch(
        "github actions node.js ci pipeline tutorial",
        "Walkthroughs of building a Node.js continuous integration pipeline.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m7-ci-1",
        title: "Create your first pipeline",
        prompt:
          "Add a GitHub Actions workflow to one Phase 2 repository that runs lint, typecheck and the unit suite on every pull request. Break one lint rule on a branch and confirm the check fails, then fix it and confirm it goes green.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Install with npm ci so the lockfile is respected.",
          "Use actions/setup-node with cache: npm to avoid re-downloading packages every run.",
        ],
      },
      {
        id: "ex-p2m7-ci-2",
        title: "Add a database service",
        prompt:
          "Extend your workflow with a Postgres service container, set DATABASE_URL for the job, run migrations before the tests, and make one integration test pass against it. Measure how much time the service adds to the job.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Give the service a health check so the job waits for pg_isready instead of racing it.",
          "Expose the port on localhost and include credentials in the URL.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api", "p2-inventory-api", "p2-auth-api"],
    quizId: "quiz-p2-m7",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m7",
  title: "Testing & Code Quality — Module Quiz",
  description:
    "Eight questions on test layers, Supertest assertions, mocks, flaky suites, coverage reading and continuous integration.",
  moduleId: "p2-m7",
  questions: [
    {
      id: "q-p2m7-1",
      type: "multiple-choice",
      prompt:
        "A test imports a service function, calls it with a plain object, and asserts the returned result. There is no HTTP request, no database connection and no network access anywhere in the file. Which testing layer does this describe?",
      options: [
        "Unit testing",
        "Integration testing",
        "End-to-end testing",
        "Snapshot testing",
      ],
      correctIndex: 0,
      explanation:
        "The test exercises a single unit in isolation: the only code it reaches is the code it imported. Nothing about the HTTP layer, the router table or a real database is involved, which is exactly the definition of a unit test.",
      optionExplanations: [
        "Correct. A unit test runs the smallest meaningful piece of code with no external I/O, so it is fast, deterministic and isolated.",
        "An integration test would push a request through the real middleware chain (and usually a real or throwaway database) to prove the wiring works.",
        "An end-to-end test would start a real server process and communicate with it over an actual socket, crossing every system boundary.",
        "Snapshot testing compares a serialised output against a stored golden file; it is a technique, not a testing layer.",
      ],
    },
    {
      id: "q-p2m7-2",
      type: "code-output",
      prompt:
        "In this test the API actually responds with status 422 and a body of { \"error\": { \"code\": \"INVALID_INPUT\" } }. Which assertion fails the test, and why?",
      language: "ts",
      code: `import request from "supertest";
import { app } from "../src/app";

it("rejects an invalid payload", async () => {
  const res = await request(app)
    .post("/api/tasks")
    .send({ title: "" });

  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe("VALIDATION_ERROR");
});`,
      options: [
        "Neither — the test passes, because Supertest only validates the transport",
        "expect(res.status).toBe(400), because the response status is 422 and this assertion runs first",
        "expect(res.body.error.code).toBe(\"VALIDATION_ERROR\"), because the code is INVALID_INPUT",
        "The test fails before any assertion, because the request itself throws",
      ],
      correctIndex: 1,
      explanation:
        "Assertions execute in statement order. The very first one compares 400 with the actual 422, throws an AssertionError, and aborts the test — so the second assertion is never reached. Fix the status expectation (or the API contract) before worrying about the error code.",
      optionExplanations: [
        "Supertest does parse and expose the body, and Jest-style assertions run normally, so this is not how the test behaves.",
        "Correct. toBe(400) is evaluated before the code assertion; the status mismatch (400 vs 422) throws and stops the test.",
        "This assertion would also fail, but it never executes because the earlier status assertion already threw.",
        "Supertest resolves with the response object for any HTTP status, including 4xx and 5xx; only a connection failure would throw.",
      ],
    },
    {
      id: "q-p2m7-3",
      type: "code-output",
      prompt: "What is printed to the console when this test runs?",
      language: "ts",
      code: `import { test, mock } from "node:test";
import assert from "node:assert/strict";

test("records every charge", async () => {
  const charge = mock.fn(async (amount) => ({ id: "ch_1", amount }));

  await charge(1000);
  await charge(500);

  console.log(charge.mock.callCount());
  assert.equal(charge.mock.calls[1].arguments[0], 500);
});`,
      options: ["0", "1", "2", "TypeError: charge.mock is undefined"],
      correctIndex: 2,
      explanation:
        "mock.fn records every invocation: two calls means callCount() returns 2, so the console prints 2. The assertion on calls[1].arguments[0] then passes because the second call was made with 500, and the test reports as passed.",
      optionExplanations: [
        "0 would mean the wrapped function was never invoked, but it is awaited twice in the test body.",
        "1 would mean only the first call was recorded; mocks append an entry for every invocation.",
        "Correct — two calls were made, callCount() returns 2, and the second recorded call carries the argument 500.",
        "charge.mock exists on any mock.fn return value, so no TypeError is thrown.",
      ],
    },
    {
      id: "q-p2m7-4",
      type: "find-bug",
      prompt:
        "This suite passes when the whole file runs, but fails when only the second test is selected with -t \"deletes the user\". What is the root cause?",
      language: "ts",
      code: `let createdId: string;

it("creates a user", async () => {
  const res = await request(app)
    .post("/api/users")
    .send({ name: "Ada" });

  expect(res.status).toBe(201);
  createdId = res.body.data.id;
});

it("deletes the user", async () => {
  const res = await request(app).delete(\`/api/users/\${createdId}\`);

  expect(res.status).toBe(204);
});`,
      options: [
        "The auth token expires between the two tests",
        "The second test depends on state created by the first, so running it alone leaves createdId undefined and the request targets a missing resource",
        "Supertest does not support the DELETE method",
        "The database connection is closed by an afterAll hook before the test runs",
      ],
      correctIndex: 1,
      explanation:
        "This is classic order dependence: createdId is module-level state written by the first test. A name filter skips that test, createdId stays undefined, and the DELETE request resolves to a different outcome than 204. Each test must create the data it needs, typically inside its own beforeEach.",
      optionExplanations: [
        "Tokens are usually generated per run or per suite; the failure appears precisely because a test was skipped, not because time passed.",
        "Correct — hidden coupling on a shared variable makes the suite order-dependent, which name filters and parallel runs expose.",
        "Supertest issues whatever method you chain, including DELETE; the failure is in the data, not the verb.",
        "No afterAll appears here, and the failure is tied to test selection rather than teardown.",
      ],
    },
    {
      id: "q-p2m7-5",
      type: "multiple-choice",
      prompt:
        "A coverage report shows 100% statement coverage and 70% branch coverage for a file. What does that tell you?",
      options: [
        "Every line executed at least once, but 30% of decision outcomes (for example one side of an if) were never exercised",
        "30% of the lines in the file were never executed",
        "The file is fully tested and cannot contain bugs",
        "The test file is running too slowly and should be split",
      ],
      correctIndex: 0,
      explanation:
        "Statements and branches are measured separately. Every line ran, yet some decisions only ever took one path — commonly the happy path, with the error branch (404 or 500) never reached. Branch coverage is the number that reveals untested error handling.",
      optionExplanations: [
        "Correct — statement coverage counts execution, branch coverage counts whether each outcome of every decision was observed.",
        "If 30% of lines had never run, statement coverage would be below 100%.",
        "Coverage never proves correctness: a test with no assertions still raises it. It is a map of what was not looked at.",
        "Coverage percentages say nothing about execution time; speed is a separate concern.",
      ],
    },
    {
      id: "q-p2m7-6",
      type: "code-output",
      prompt: "Both tests in this file run against real functions. What does the runner report?",
      language: "ts",
      code: `import { describe, it } from "node:test";
import assert from "node:assert/strict";

const trim = (s: string) => s.trim();

describe("helpers", () => {
  it("trims input", () => {
    assert.strictEqual(trim("  hi  "), "hi");
  });

  it("parses the payload", () => {
    assert.deepStrictEqual(JSON.parse('{"n":1}'), { n: "1" });
  });
});`,
      options: [
        "Both tests pass",
        "The first test passes and the second fails with an AssertionError",
        "The first test fails and the second passes",
        "Both tests fail, because node:test does not support describe",
      ],
      correctIndex: 1,
      explanation:
        "trim behaves as expected, so strictEqual passes. JSON.parse('{\"n\":1}') produces the number 1, while the expected object holds the string \"1\"; deepStrictEqual from node:assert/strict compares types as well as values, so the second test fails.",
      optionExplanations: [
        "The second assertion compares a number with a string, and the strict variant does not coerce them.",
        "Correct — test one passes; test two throws an AssertionError because 1 and \"1\" are different values under strict comparison.",
        "The order is the opposite: trim is correct, the parsed payload comparison is wrong.",
        "node:test exports describe and it exactly like other frameworks; both tests are registered and executed.",
      ],
    },
    {
      id: "q-p2m7-7",
      type: "find-bug",
      prompt:
        "On a loaded CI machine this test fails roughly one run in ten with ECONNREFUSED, but it always passes on a fast laptop. What is the most likely cause?",
      language: "ts",
      code: `import { before, after, it } from "node:test";

let server;

before(async () => {
  server = app.listen(3000);
});

after(() => server.close());

it("creates an order", async () => {
  const res = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sku: "A-1" }),
  });

  expect(res.status).toBe(201);
});`,
      options: [
        "Port 3000 is permanently occupied by another process",
        "listen() is asynchronous: the request is sent before the socket is bound and accepting connections, so the run races the listener",
        "fetch is unavailable inside node:test and throws a network error",
        "The before hook executes after the test body in node:test",
      ],
      correctIndex: 1,
      explanation:
        "app.listen returns immediately and binds the socket on a later tick. On a slow machine the fetch wins the race and finds nothing listening. The fix is a readiness gate: poll a health endpoint until it answers (or await the server's listening event) before releasing the tests.",
      optionExplanations: [
        "A permanently occupied port would fail every run with EADDRINUSE on the server, not an intermittent ECONNREFUSED on the client.",
        "Correct — the test races an asynchronous bind. Intermittent failures that correlate with machine load are the signature of a missing readiness check.",
        "fetch is available in Node 18+ and works fine inside the runner; the error is a refused connection, not a missing API.",
        "node:test guarantees before hooks run before the tests in the same scope; that is not what varies between runs.",
      ],
    },
    {
      id: "q-p2m7-8",
      type: "short-answer",
      prompt:
        "In your own words, describe what makes a test suite flaky, and give one concrete change you would make to a test that inserts a row into a shared database and never cleans it up afterwards.",
      acceptedKeywords: [
        "flaky",
        "nondeterministic",
        "non-deterministic",
        "order",
        "isolation",
        "isolated",
        "independent",
        "parallel",
        "shared",
        "rollback",
        "transaction",
        "truncate",
        "cleanup",
        "unique",
        "race",
        "time",
      ],
      explanation:
        "A flaky test is one whose result depends on something other than the code under test: execution order, shared database rows, real time, random data, ports, or network conditions — so the same commit sometimes passes and sometimes fails. For a test that writes to a shared database, the concrete fixes are wrapping it in a transaction that is always rolled back (even on failure), truncating or deleting its rows in afterEach, or generating unique fixture values with a per-run prefix so leftovers can never satisfy an assertion. The goal is that every test is independent: it can run alone, first, last, in any order, and in parallel with the others.",
    },
  ],
};
