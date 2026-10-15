import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m3",
  slug: "security",
  title: "Security",
  description:
    "Build APIs that survive contact with attackers: the OWASP API Security Top 10, injection families (SQL, NoSQL, command), XSS, CSRF, SSRF, broken access control, secure headers with Helmet, rate limiting and brute-force defence, input sanitization, secrets management, dependency auditing, safe file uploads, logging without leaking, threat modeling and security testing in CI.",
  phaseId: "phase-3",
  order: 3,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m3",
  difficulty: "advanced",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m3-owasp-api-security",
    slug: "owasp-api-security",
    title: "OWASP API Security Top 10",
    description:
      "The ten API risks that keep appearing in real audits - BOLA, broken authentication, property-level authorization, resource exhaustion, function-level authorization, SSRF, misconfiguration, injection, inventory management and unsafe consumption - each mapped to an endpoint you could actually write.",
    order: 1,
    estimatedMinutes: 24,
    tags: ["owasp", "api-security", "threat-modeling", "checklist"],
    prerequisites: ["p2m5-api-security-basics", "p2m6-auth-vs-authz", "p3m1-solid"],
    relatedTopics: [
      "p3m3-broken-access-control",
      "p3m3-injection-attacks",
      "p3m3-ssrf",
      "p3m3-secure-headers-helmet",
      "p3m3-threat-modeling",
    ],
    learningObjectives: [
      "List the ten entries of the OWASP API Security Top 10 and the mistake each one names",
      "Map every entry to a concrete Express/Mongoose endpoint pattern from your own project",
      "Separate authentication (who are you) from authorization (which object and which function)",
      "Use the list as a design and code-review checklist instead of a memorisation exercise",
    ],
    simpleExplanation:
      "The OWASP API Security Top 10 is a community-built list of the ten API risks that auditors find most often. Each entry describes a way your API can leak or change data it was never meant to touch - for example reading another user's invoice just by changing an id in the URL. Learn the list once and you have a checklist you can run against every endpoint you write.",
    detailedContent: `
The list is the API-specific sibling of the general OWASP Top 10. Every entry maps to a mistake that fits in one Express handler:

- **API1 - Broken Object Level Authorization (BOLA / IDOR).** \`GET /api/invoices/123\` authenticates the caller but never checks that invoice 123 belongs to them. The most common API finding in the wild.
- **API2 - Broken Authentication.** Weak password rules, no rate limit on login, tokens that never expire, accepting the wrong algorithm or header, predictable reset codes.
- **API3 - Broken Object Property Level Authorization.** Two flavours: *excessive data exposure* (returning \`passwordHash\` or internal flags) and *mass assignment* (spreading \`req.body\` into an update lets a caller set \`role: "admin"\`).
- **API4 - Unrestricted resource consumption.** No rate limit, no \`limit\` cap, unbounded pagination, regex search fields - one client can exhaust CPU, memory or database connections.
- **API5 - Broken function level authorization.** \`DELETE /admin/users/7\` is registered for everyone; only the word "admin" in the path *suggests* protection.
- **API6 - Server side request forgery (SSRF).** The API fetches a user-supplied URL and ends up talking to \`169.254.169.254\` or an internal admin service.
- **API7 - Security misconfiguration.** Debug routes in production, CORS wildcard with credentials, verbose stack traces, default passwords, disabled TLS.
- **API8 - Injection.** SQL, NoSQL, shell and template injection caused by unvalidated input reaching an interpreter.
- **API9 - Improper inventory management.** Forgotten \`/v1\` routes, undocumented "shadow APIs" and environments that skip your security middleware.
- **API10 - Unsafe consumption of APIs.** Trusting data from a third-party API without validating it, so your partner's bug becomes your bug.

The point is not the numbers. The point is that ten questions, asked in order against each endpoint, find most of what an attacker would find.
    `,
    howItWorks: `
In practice the list runs at three moments. At **design time** you sketch the data flow of a new endpoint and ask: which object id does it touch (API1), which properties can the caller write (API3), which function does it call (API5), does it call out anywhere (API6). At **review time** you read the diff and tick the same questions. At **audit time** you generate the inventory of live routes (API9) and re-run the checklist against everything registered.

Each question is cheap; the value comes from asking it *before* the endpoint ships. A single ownership check added during review costs a line. The same check added after an incident costs a breach report.
    `,
    codeExamples: [
      {
        title: "Three Top-10 risks in one route file, before and after",
        language: "ts",
        code: `// BEFORE - API1, API3 and API5 all present
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  res.json(await Invoice.findById(req.params.id));                // API1: no ownership check
});

app.patch("/api/users/:id", authenticate, async (req, res) => {
  res.json(await User.findByIdAndUpdate(req.params.id, req.body)); // API3: mass assignment
});

app.delete("/api/admin/users/:id", async (req, res) => {          // API5: no role guard
  await User.deleteOne({ _id: req.params.id });
  res.status(204).end();
});

// AFTER - scope by owner, allowlist writable fields, guard the function
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id });
  if (!invoice) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  res.json({ data: invoice });
});

const updateMeSchema = z.object({
  displayName: z.string().max(80),
  timezone: z.string().max(60),
});
app.patch("/api/users/me", authenticate, async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  res.json({ data: await User.findByIdAndUpdate(req.user.id, data, { new: true }) });
});

app.delete("/api/admin/users/:id", authenticate, requireRole("admin"), async (req, res) => {
  await User.deleteOne({ _id: req.params.id });
  res.status(204).end();
});`,
        description:
          "The fixed routes fail closed: unknown invoice ids answer 404 (never 403, which would confirm existence), updates only accept allowlisted fields, and the admin route cannot even be reached without the role check.",
      },
    ],
    commonMistakes: [
      "Treating authentication as authorization - a valid JWT proves who the caller is, never that they may touch this object or call this function.",
      "Checking roles but not object ownership: an admin-only check does nothing for /invoices/123 requested by two ordinary customers.",
      "Running the checklist only on new endpoints while old /v1 routes (API9) quietly keep shipping without middleware.",
    ],
    bestPractices: [
      "Keep a one-page table of your API's ten highest-risk endpoints and re-run the checklist on each release.",
      "Deny by default: every new route starts unregistered for writes until an explicit ownership and role check is written.",
      "Generate your route inventory from the router itself (app._router.stack or an OpenAPI export) so shadow APIs are visible.",
    ],
    realWorldUseCases: [
      "Fintech and healthcare audits almost always open with BOLA: enumerate /invoices/<n> or /patients/<n> and count what leaks.",
      "A versioned API that keeps /v1 alive after /v2 ships is the classic API9 finding - the old path often lacks newer rate limits.",
    ],
    resources: [
      docs(
        "OWASP API Security Project",
        OFFICIAL.owaspApi,
        "The authoritative list of API risks, each with attack scenarios and prevention notes.",
        "en",
        "reference",
      ),
      docs(
        "OWASP Top 10",
        OFFICIAL.owaspTop10,
        "The broader web application Top 10 that the API list builds on.",
        "en",
        "reference",
      ),
      docs(
        "OWASP REST Security Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html",
        "Concrete REST-level guidance for authorization, mass assignment and error handling.",
        "en",
        "15 min",
      ),
      ytSearch(
        "OWASP API Security Top 10 explained",
        "Walkthroughs that attach a demo request to each entry of the list.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m3-owasp-map",
        title: "Run the checklist on your own API",
        prompt:
          "Take five endpoints from your current project (or from p3-ecommerce-platform) and write a table with one row per endpoint and ten columns, one per API Security entry. Write OK or the concrete gap in each cell. Rank the gaps by (likelihood x impact) and list the three you would fix first.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "If an endpoint takes an id from the path or query, API1 is the first column to examine.",
          "Any handler that writes req.body straight into a persistence call has an API3 gap.",
        ],
      },
      {
        id: "ex-p3m3-owasp-fix",
        title: "Fix a BOLA route locally",
        prompt:
          "Start a toy API on 127.0.0.1:3000 with two seeded users and one invoice per user. Authenticate as user A (a fake in-memory token is fine) and GET /invoices/<user-B-invoice-id>. Observe the leak, then change the handler so the same request fails safely. Paste the request, the vulnerable response and the fixed response.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Filter by owner in the query itself instead of loading first and checking later.",
          "Answer 404 for objects the caller may not see so you do not confirm that the id exists.",
        ],
        solution: `// vulnerable
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  res.json(await Invoice.findById(req.params.id)); // leaks user B's invoice to user A
});

// fixed - scope the query by owner, fail closed with 404
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  }
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.user.id,          // ownership is part of the filter
  });
  if (!invoice) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  res.json({ data: invoice });
});

// verify:
// curl -i http://127.0.0.1:3000/api/invoices/<B's id> -H "Authorization: Bearer <A's token>"
// -> 404 {"error":"INVOICE_NOT_FOUND"} for A, 200 for B`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-injection-attacks",
    slug: "injection-attacks",
    title: "Injection Attacks: When Data Becomes Code",
    description:
      "The single principle behind SQL injection, NoSQL injection, command injection and template injection: untrusted data crossing a boundary and being interpreted as instructions.",
    order: 2,
    estimatedMinutes: 20,
    tags: ["injection", "owasp", "input-validation", "taint"],
    prerequisites: ["p2m2-middleware", "p2m5-api-security-basics"],
    relatedTopics: [
      "p3m3-sql-injection",
      "p3m3-nosql-injection",
      "p3m3-xss",
      "p3m3-input-sanitization",
    ],
    learningObjectives: [
      "Define injection as a data-versus-code boundary failure and identify source, sink and payload",
      "Name the main injection families a Node.js API is exposed to",
      "Recognise the sinks in Express code that turn strings into instructions",
      "State the three general defences that work against every family",
    ],
    simpleExplanation:
      "Injection happens when a program takes text you typed and, instead of treating it as data, treats it as instructions. If a search box adds your text into a query like `SELECT ... WHERE name = '<your text>'`, you can close the quote and append your own commands. The fix is always the same idea: keep user data strictly on the data side of the line.",
    detailedContent: `
Every injection bug has three parts:

1. **Source** - wherever untrusted data enters: \`req.body\`, \`req.query\`, \`req.params\`, headers, cookies, file contents, data from a webhook.
2. **Sink** - a place where data is reinterpreted as code: a SQL string, \`child_process.exec\`, \`eval\`, a template engine, a logger that shells out, an HTTP header.
3. **Payload** - the string that escapes the data context, e.g. \`' ; DROP TABLE users; --\`.

If no source can ever reach a sink, the bug cannot exist. That is why the defences are structural rather than signature-based:

- **Separate data from code at the API level.** Parameterised queries, argument arrays instead of shell strings, templates that auto-escape.
- **Validate before use.** An allowlist of expected values (an enum, an id format, a number range) makes most payloads unrepresentable.
- **Run with least privilege.** Even if a payload gets through, a database user that cannot \`DROP\` limits the blast radius.

Families you will meet in Node.js: SQL injection (\`pg\`, raw Prisma/Sequelize), NoSQL operator injection (Mongoose objects), OS command injection (\`exec\`), server-side template injection, CRLF/header injection (\`res.setHeader\` with \`\\r\\n\`), and XSS - which is injection into the browser's HTML/JS parser rather than into your server.

Sanitizing *after* the interpreter has already seen the string is the weakest layer. Escaping is a backstop, not the primary control.
    `,
    howItWorks: `
Follow one payload through the machine. A client sends \`name = O'Neil'; DROP TABLE audit; --\` to \`POST /search\`. The handler concatenates it into \`SELECT * FROM users WHERE name = '' + name + ''\`. The database receives what looks like three statements. With a driver using parameter binding, the same payload arrives as *one* value in *one* placeholder: the database parser never re-tokenises it, so the semicolon is just a character inside a string.

The boundary that matters is the moment data is parsed by something more powerful than a string. Everything else - WAFs, blocklists, case filters - is layering on top of that one structural decision.
    `,
    codeExamples: [
      {
        title: "Command injection vs safe argument passing (local only)",
        language: "js",
        code: `import { exec, execFile } from "node:child_process";

// VULNERABLE: the payload below runs two commands on YOUR machine
// Payload to try locally:  127.0.0.1 & echo pwned
exec("ping -n 1 " + req.query.host, (err, stdout) => res.send(stdout));

// FIXED: no shell is ever started, arguments stay arguments
execFile("ping", ["-n", "1", host], { timeout: 3000 }, (err, stdout) => {
  if (err) return res.status(400).json({ error: "BAD_HOST" });
  res.send(stdout);
});

// BETTER: validate first so only expected values ever reach execFile
const hostSchema = z.string().regex(/^127\\.0\\.0\\.1$/, "loopback only in this demo");
const host = hostSchema.parse(req.query.host);`,
        description:
          "Run only against 127.0.0.1 on your own machine. exec() spawns a shell, so metacharacters like &, ; and | become shell syntax; execFile() never invokes a shell, so the same characters are ordinary text.",
      },
    ],
    commonMistakes: [
      "Assuming 'we use an ORM, so we are safe' - any raw or string-built query bypasses the ORM's parameter binding.",
      "Blocklisting quote characters instead of using parameterised APIs: encodings, double quotes and NoSQL operators slip straight past.",
      "Concatenating into shell commands for 'harmless' utilities such as ping, curl or ffmpeg - they all accept flags that run other programs.",
    ],
    bestPractices: [
      "Treat every handler as untrusted input: identify the sinks first, then decide how each one receives data.",
      "Prefer safe APIs (parameterised query, execFile, template auto-escape) over escaping functions you call by hand.",
      "Give the runtime account least privilege so a successful payload still cannot do irreversible damage.",
    ],
    realWorldUseCases: [
      "Any search, filter or sort endpoint: the payload lives in a query string, which is the most-transmitted part of a request.",
      "Background workers that shell out to ffmpeg or ImageMagick on user uploads - the classic command-injection sink in media apps.",
    ],
    resources: [
      docs(
        "OWASP - Injection",
        "https://owasp.org/www-community/attacks/Injection_",
        "The community definition of the class with the canonical payload examples.",
        "en",
        "10 min",
      ),
      docs(
        "OWASP Input Validation Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
        "How to design allowlist validation so payloads become unrepresentable.",
        "en",
        "12 min",
      ),
      docs("Node.js child_process docs", OFFICIAL.nodejsApi, "exec vs execFile vs spawn and why shells matter.", "en", "10 min"),
      ytSearch("injection attacks explained taint source sink", "Visual taint-flow walkthroughs of injection bugs.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-injection-sinks",
        title: "Find the sinks in your codebase",
        prompt:
          "Search your project for every call that could be a sink: query builders receiving strings, child_process.*, eval, new Function, res.setHeader with user data, and template rendering. For each, write the source that feeds it and one sentence on which boundary it crosses. Classify each as safe (structured API) or unsafe (string interpolation).",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Search for backtick template literals that contain a function call - that is the classic interpolation smell."],
      },
      {
        id: "ex-p3m3-injection-fix",
        title: "Break it locally, then fix it",
        prompt:
          "Copy the exec example into a toy route on 127.0.0.1:3000. Send 127.0.0.1 & echo pwned as the host value and confirm both commands run. Then rewrite the handler so the same request fails safely instead of executing anything, and paste the before/after responses.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "The vulnerability exists because a shell is involved at all.",
          "Validate the value against a fixed allowlist before it reaches any process.",
        ],
        solution: `// before: payload runs a second command
app.get("/ping", (req, res) => {
  exec("ping -n 1 " + req.query.host, (err, stdout) => res.send(stdout ?? ""));
});

// after: allowlist + execFile + hard timeout, so the payload is rejected
const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);

app.get("/ping", (req, res) => {
  const host = req.query.host;
  if (typeof host !== "string" || !ALLOWED_HOSTS.has(host)) {
    return res.status(400).json({ error: "BAD_HOST", message: "host not allowed" });
  }
  execFile("ping", ["-n", "1", host], { timeout: 3000 }, (err, stdout) => {
    if (err) return res.status(400).json({ error: "PING_FAILED" });
    res.type("text/plain").send(stdout);
  });
});

// verify: curl "http://127.0.0.1:3000/ping?host=127.0.0.1%20%26%20echo%20pwned"
// -> 400 {"error":"BAD_HOST"} and nothing executes`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-nosql-injection",
    slug: "nosql-injection",
    title: "NoSQL Injection",
    description:
      "Operator injection in MongoDB and Mongoose: how a JSON body like {\"$gt\": \"\"} becomes a query, why query strings smuggle objects too, and how type validation shuts it down.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["mongodb", "mongoose", "injection", "authentication"],
    prerequisites: ["p2m3-crud", "p3m3-injection-attacks"],
    relatedTopics: ["p3m3-sql-injection", "p3m3-input-sanitization", "p3m3-brute-force-protection"],
    learningObjectives: [
      "Explain how an object sent in a JSON body becomes a query with operators instead of a value",
      "Reproduce a login bypass locally with {\"$gt\": \"\"} and describe why it works",
      "Show how query-string parsers smuggle {\"$ne\": null} into req.query",
      "Fix handlers with schema type validation and key sanitization",
    ],
    simpleExplanation:
      "MongoDB queries are JSON, and JSON can contain operators such as `$gt` (greater than) and `$ne` (not equal). If your login handler passes the request body straight into `findOne`, an attacker does not send a password - they send an *operator* that matches almost any value. The database happily runs the attacker's query logic instead of yours.",
    detailedContent: `
**The classic bypass.** A login handler does \`User.findOne({ email: req.body.email, password: req.body.password })\` with passwords stored as hashes. The attacker posts:

    { "email": { "$gt": "" }, "password": { "$gt": "" } }

\`$gt: ""\` means "any string greater than the empty string", which is essentially every non-empty value. The query matches the first user document, and the API logs the attacker in as that user. No password was guessed.

**The query-string variant.** Body parsers are not the only source. With Express's extended query parsing, \`GET /users?age[$ne]=0\` arrives as \`req.query = { age: { "$ne": "0" } }\` - an object, not a string. The same happens in \`?password[$regex]=.*\`.

**Why validation fixes it completely.** Mongoose only honours operators when the value is genuinely an object with operator keys. If a schema (or a Zod parse) forces \`email\` to be a \`String\`, the value \`{ "$gt": "" }\` fails validation before it reaches the driver. That is the whole defence: **declare the type you expect, and reject anything else**.

Supporting layers:

- Strip keys starting with \`$\` (and keys containing \`.\`) from untrusted objects - libraries such as \`express-mongo-sanitize\` do this.
- Reject object-typed values where a scalar is expected; do not "just stringify" silently.
- Never compare a password to user-supplied data with operators; compare hashes with \`bcrypt.compare\`.
- Watch \`$where\` and \`$regex\`: the first executes JavaScript, the second invites catastrophic backtracking (ReDoS).

Mongoose is not "safe by default" here - \`findOne\` receives whatever object you hand it.
    `,
    howItWorks: `
Mongoose builds a MongoDB wire-protocol query from the plain object you pass. It walks the object: keys beginning with \`$\` are translated into query operators, plain keys become equality matches, nested objects become subdocument matches. So the shape of *your JavaScript object* is the shape of *the executed query*.

The request pipeline makes this exploitable: \`express.json()\` parses \`{"password":{"$gt":""}}\` into a real nested object, \`req.body.password\` is an object, and \`findOne\` sees \`$gt\` and compiles a range predicate. A schema cast turns the same value into a string comparison - or throws a CastError - so the operator never reaches MongoDB.
    `,
    codeExamples: [
      {
        title: "Login bypass and the validated fix",
        language: "ts",
        code: `// VULNERABLE - body is the query
app.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,        // attacker sends { "$gt": "" }
    password: req.body.password,  // attacker sends { "$gt": "" }
  });
  if (!user) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  res.json({ token: issueToken(user.id) });
});

// FIXED - declare types, compare hashes, never operators
const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

app.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: "BAD_CREDENTIALS" });

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  res.json({ token: issueToken(user.id) });
});`,
        description:
          "The fixed version makes the operator payload impossible: Zod rejects an object where a string is expected, and a failed parse returns the same generic 401 as a wrong password so attackers cannot probe by error message.",
      },
      {
        title: "Confirm the vulnerability against your own local server",
        language: "bash",
        code: `# local-only payload against a toy API on 127.0.0.1:3000
curl -i -X POST http://127.0.0.1:3000/login \\
  -H "Content-Type: application/json" \\
  -d '{\\"email\\":{\\"$gt\\":\\"\\"},\\"password\\":{\\"$gt\\":\\"\\"}}'

# after the fix the same payload must return 401
curl -i -X POST http://127.0.0.1:3000/login \\
  -H "Content-Type: application/json" \\
  -d '{\\"email\\":{\\"$gt\\":\\"\\"},\\"password\\":{\\"$gt\\":\\"\\"}}'`,
        description:
          "Nothing here touches a third-party system: both requests go to your own loopback server. Run the payload first to observe the bypass, then apply the fix and confirm the identical request fails safely.",
      },
    ],
    commonMistakes: [
      "Assuming express.json() protects you - it only produces the nested object that Mongoose then interprets as operators.",
      "Using string coercion to 'fix' it: String({ $gt: '' }) becomes '[object Object]', which still never matches what you intended and hides the bug.",
      "Returning 'invalid email format' for the payload but 'wrong password' for the valid shape, which confirms to an attacker that the account exists.",
    ],
    bestPractices: [
      "Validate every body, query and params object against a schema that declares scalar types before any database call.",
      "Strip operator keys at middleware level as a second layer, then keep strict schemas as the first layer.",
      "Use bcrypt/argon2 compare for passwords and generic 401 responses on every failure path.",
    ],
    realWorldUseCases: [
      "Login endpoints are the highest-value target because one bypass yields a full session as the first user in the collection.",
      "Search and filter endpoints that accept JSON filters from the client (for example an admin reporting UI) carry the same risk.",
    ],
    resources: [
      docs("Mongoose - Querying", OFFICIAL.mongooseDocs, "How query objects, casting and operators interact.", "en", "15 min"),
      docs("MongoDB Manual - Query operators", OFFICIAL.mongodbManual, "Reference for $gt, $ne, $regex, $where and their semantics.", "en", "reference"),
      docs("Zod - Schemas", OFFICIAL.zodDocs, "Declaring scalar types so object payloads fail validation early.", "en", "reference"),
      ytSearch("NoSQL injection explained login bypass", "Demos of operator injection against local Express apps.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-nosql-bypass",
        title: "Prove the bypass on your own server",
        prompt:
          "Build the vulnerable login handler against a local MongoDB (or the in-memory mongodb-memory-server) seeded with two users. Run the {\"$gt\": \"\"} payload against http://127.0.0.1:3000 and record which user you became. Then add schema validation and rerun the exact same payload, recording the status code both times.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Use curl with -H 'Content-Type: application/json' so Express parses a real object body.",
          "Zod's z.string() rejects an object before Mongoose ever sees it.",
        ],
        solution: `// curl -X POST http://127.0.0.1:3000/login -H "Content-Type: application/json" \\
//   -d '{"$gt-placeholder":1}' is NOT needed - the payload is:

{ "email": { "$gt": "" }, "password": { "$gt": "" } }

// BEFORE the fix -> 200 {"token":"..."} (first user in the collection)
// AFTER  the fix -> 401 {"error":"BAD_CREDENTIALS"}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  res.json({ token: issueToken(user.id) });
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-nosql-query",
        title: "Smuggle an operator through the query string",
        prompt:
          "Against your local API, request /users?age[$ne]=0 and log what Express puts in req.query (typeof and JSON.stringify). Explain in two sentences why typeof is 'object'. Then decide: would a handler doing User.find(req.query) be vulnerable? Write the fix you would apply.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Express's extended parser turns bracket syntax into nested objects.",
          "Never pass req.query straight into find(); project an explicit allowlist of fields first.",
        ],
      },
    ],
    projectIds: ["p3-chat-app"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-sql-injection",
    slug: "sql-injection",
    title: "SQL Injection",
    description:
      "String concatenation versus parameterised queries, the classic OR '1'='1' payload, second-order injection, and limiting the blast radius with a least-privileged database user.",
    order: 4,
    estimatedMinutes: 22,
    tags: ["sql", "postgres", "injection", "parameterised-queries"],
    prerequisites: ["p2m4-postgres-from-node", "p3m3-injection-attacks"],
    relatedTopics: ["p3m3-nosql-injection", "p3m3-input-sanitization", "p3m3-secrets-management"],
    learningObjectives: [
      "Rewrite a concatenated SQL string as a parameterised query with $1 placeholders",
      "Trace what the payload OR '1'='1' does to a WHERE clause and why the comment variant returns every row",
      "Explain second-order injection and where stored values become queries",
      "Apply least privilege to the database role your application uses",
    ],
    simpleExplanation:
      "SQL injection happens when user text is pasted into a SQL statement and the database can no longer tell your data apart from your commands. If a login query is built with string concatenation, the classic payload `' OR '1'='1' --` turns the condition into something that is always true. Parameterised queries fix this by sending the SQL and the values as two separate things, so the database never re-parses your input as SQL.",
    detailedContent: `
**The vulnerable shape.** Any query assembled with \`+\` or a template literal from request data:

    SELECT * FROM users WHERE email = '<email>' AND active = true

With \`email = x' OR '1'='1' --\` the statement becomes:

    SELECT * FROM users WHERE email = 'x' OR '1'='1' --' AND active = true

\`--\` starts a line comment, so everything after it (including the closing quote and your \`AND active\` guard) disappears. Every row is returned.

**The fix is a driver feature, not a coding style.** PostgreSQL supports placeholders (\`$1\`, \`$2\`), MySQL and SQLite use \`?\`. The SQL text is sent once and parsed; values are sent separately as data:

    SELECT * FROM users WHERE email = $1 AND active = true

No placeholder ever appears inside quotes, and no value is ever re-tokenised. This defeats *all* value-based payloads without any filtering.

**Second-order injection** is the variant people miss: the payload is stored safely (as data) and only becomes dangerous when a *later* feature concatenates it back into SQL - a username saved at signup, then interpolated into an audit query at export time. Parameterise every query, including internal ones that read your own columns.

**Blast-radius controls:** give the app role only \`SELECT/INSERT/UPDATE/DELETE\` on the schemas it owns (no \`DROP\`, no superuser), disable multi-statement execution in your driver, and keep error messages generic while logging details server-side.
    `,
    howItWorks: `
With \`node-postgres\` you call \`pool.query(text, values)\`. The driver splits the call: the text goes to PostgreSQL with unbound \`$1\` markers, PostgreSQL plans it, and then binds each value with correct type information. Because binding happens at the protocol level, a value containing \`'\`, \`;\` or \`--\` is simply a string inside a bound parameter - the parser has already decided the statement's structure.

Concatenation does the opposite: the *client* builds the full text, so the server parses attacker-controlled bytes as syntax. Escaping by doubling quotes (\`''\`) is a manual re-implementation of that protocol step and fails the moment an encoding or type mismatch slips in.
    `,
    codeExamples: [
      {
        title: "Concatenation versus $1 placeholders",
        language: "ts",
        code: `import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// VULNERABLE - payload: x' OR '1'='1' --
app.get("/api/users", async (req, res) => {
  const sql =
    "SELECT * FROM users WHERE email = '" + req.query.email + "' AND active = true";
  const { rows } = await pool.query(sql);      // returns EVERY active row
  res.json({ data: rows });
});

// FIXED - values never become syntax
app.get("/api/users", async (req, res) => {
  const email = req.query.email;
  if (typeof email !== "string" || email.length > 254) {
    return res.status(400).json({ error: "BAD_EMAIL" });
  }
  const { rows } = await pool.query(
    "SELECT id, email, display_name FROM users WHERE email = $1 AND active = true",
    [email],
  );
  res.json({ data: rows });                   // 0 rows for the payload
});`,
        description:
          "Note the fixed query also selects explicit columns instead of SELECT *: the payload cannot reach data the handler never needed.",
      },
      {
        title: "Least privilege for the application role",
        language: "sql",
        code: `-- run once as the database owner (NOT as the app user)
CREATE ROLE app_readonly  LOGIN PASSWORD 'change-me-in-a-secret-store';
CREATE ROLE app_writer    LOGIN PASSWORD 'change-me-in-a-secret-store';

GRANT CONNECT ON DATABASE shop TO app_writer;
GRANT USAGE    ON SCHEMA public TO app_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_writer;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_readonly;
GRANT SELECT ON public.users, public.products TO app_readonly;

-- the app connects with app_writer: even a successful injection payload
-- cannot DROP tables or read the postgres superuser's data.`,
        description: "Run against your own local PostgreSQL only. The point: privilege is the backstop when every other layer fails.",
      },
    ],
    commonMistakes: [
      "Parameterising the WHERE clause but concatenating values into ORDER BY, LIMIT or table names - placeholders only work where a value is grammatically expected.",
      "Using SELECT * and then blaming the leak on the injection: the exposure is a separate (API3) problem.",
      "Connecting to the database as the superuser or table owner 'to keep things simple' in every environment including production.",
    ],
    bestPractices: [
      "Make parameterised queries the only way your code can talk to SQL: wrap the driver in a small data layer that takes values, not strings.",
      "Validate shape before the query (type, length, enum) so malformed input never reaches the database at all.",
      "Run migrations with an owner role and the application with a lesser role; rotate those credentials like any other secret.",
    ],
    realWorldUseCases: [
      "Search, sort and filter endpoints where query strings feed directly into dynamic SQL builds.",
      "Reporting jobs that interpolate date ranges or column names from a UI - a very common place for second-order injection.",
    ],
    resources: [
      docs(
        "OWASP SQL Injection Prevention Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
        "Parameterised queries as the primary control, with defence-in-depth layers.",
        "en",
        "12 min",
      ),
      docs("PostgreSQL - Protocol flow / parameterised queries", OFFICIAL.postgresDocs, "How bound parameters are transported and typed.", "en", "reference"),
      docs("node-postgres (pg) - Parameterized queries", "https://node-postgres.com/features/parameterized-queries", "The driver API for passing values separately from SQL text.", "en", "8 min"),
      ytSearch("SQL injection explained OR 1=1 demo", "Local, harmless demos of classic SQL injection payloads.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-sqli-rewrite",
        title: "Rewrite the query",
        prompt:
          "Given: SELECT * FROM orders WHERE customer_id = '<id>' AND status = '<status>' ORDER BY <sort>. Identify which three parts are currently interpolations, rewrite the two that can be values as $1/$2 placeholders, and explain in one sentence why ORDER BY cannot take a placeholder - then give the allowlist fix for it.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "A placeholder can only appear where the grammar expects a value expression.",
          "Column names for sorting must come from a fixed map: { createdAt: 'created_at', ... }.",
        ],
        solution: `-- before
SELECT * FROM orders
WHERE customer_id = '<id>' AND status = '<status>'
ORDER BY <sort>;

-- after (values parameterised, sort allowlisted in application code)
SELECT * FROM orders
WHERE customer_id = $1 AND status = $2
ORDER BY created_at DESC;

// ts
const SORTS = { newest: "created_at DESC", total: "total_cents ASC" };
const orderBy = SORTS[req.query.sort] ?? SORTS.newest; // never interpolate raw input
await pool.query(
  "SELECT * FROM orders WHERE customer_id = $1 AND status = $2 ORDER BY " + orderBy,
  [req.user.id, req.query.status],
);`,
        solutionLanguage: "sql",
      },
      {
        id: "ex-p3m3-sqli-local",
        title: "Run the payload, then make it fail safely",
        prompt:
          "Stand up a toy Express + local PostgreSQL app on 127.0.0.1:3000 with a users table seeded with three rows (email, active). Send the payload x' OR '1'='1' -- as the email query parameter and record how many rows come back. Then convert the handler to a parameterised query, rerun the identical request, and paste both responses.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "curl \"http://127.0.0.1:3000/api/users?email=x'%20OR%20'1'%3D'1'%20--\"",
          "pool.query(text, values) is the whole fix - no escaping helpers needed.",
        ],
        solution: `// before: every active row is returned
const sql = "SELECT * FROM users WHERE email = '" + req.query.email + "' AND active = true";
const { rows } = await pool.query(sql);
// payload x' OR '1'='1' --  ->  SELECT * FROM users WHERE email = 'x' OR '1'='1' -- ...
// response: 200 with all three seeded rows

// after: identical request, zero rows, no error thrown
const email = req.query.email;
if (typeof email !== "string") return res.status(400).json({ error: "BAD_EMAIL" });
const { rows } = await pool.query(
  "SELECT id, email FROM users WHERE email = $1 AND active = true",
  [email],
);
res.json({ data: rows });
// response: 200 {"data": []} - the payload is just a string that matches nothing`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-booking-platform", "p3-analytics-api"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-xss",
    slug: "cross-site-scripting",
    title: "Cross-Site Scripting (XSS)",
    description:
      "Stored, reflected and DOM-based XSS in a JSON API world: why React is not a free pass, Content-Type discipline, output encoding and an introduction to Content Security Policy.",
    order: 5,
    estimatedMinutes: 22,
    tags: ["xss", "frontend", "csp", "output-encoding"],
    prerequisites: ["p3m3-injection-attacks", "p2m5-api-security-basics"],
    relatedTopics: ["p3m3-secure-headers-helmet", "p3m3-csrf", "p3m3-input-sanitization"],
    learningObjectives: [
      "Distinguish stored, reflected and DOM-based XSS and locate the sink for each",
      "Explain why an API that returns JSON can still cause XSS later",
      "Choose between output encoding, sanitization of rich text and CSP",
      "Set safe Content-Type and character-encoding headers on responses",
    ],
    simpleExplanation:
      "XSS is injection into the browser's HTML or JavaScript parser: an attacker stores or sends text that, when rendered, becomes executable script in someone else's session. React escapes values it interpolates by default, which prevents the easiest cases - but any use of dangerouslySetInnerHTML, server-rendered HTML, or a JSON endpoint that later gets injected into a page can reopen the hole.",
    detailedContent: `
**The three families**

- **Stored XSS** - the payload is saved (a comment, a profile name, a chat message) and served to every viewer. Highest impact because it is persistent and self-propagating.
- **Reflected XSS** - the payload arrives in the request (usually a query parameter) and is echoed straight back into the response body or a redirect URL. Needs a victim to click a link.
- **DOM-based XSS** - the server response is fine; client-side JavaScript writes the payload into the DOM with \`innerHTML\`, \`document.write\` or a jQuery \`html()\` call.

**Why a JSON API is not automatically safe.** If \`GET /api/messages\` returns \`{"body": "<img src=x onerror=fetch('/steal?c='+document.cookie)>"}\` and any consumer renders that string as HTML, you have stored XSS. The API made it possible by accepting raw HTML in a field that was documented as plain text. Your responsibilities on the API side:

- Decide per field: **plain text** (reject or encode angle brackets at write time) or **rich text** (sanitize server-side with an HTML sanitizer such as DOMPurify on a server DOM, storing only the cleaned markup).
- Never serve user content with \`Content-Type: text/html\` unless you are deliberately rendering a page; use \`application/json\` or \`text/plain\`, plus \`X-Content-Type-Options: nosniff\` so browsers refuse to "sniff" JSON into HTML.
- Set an explicit charset (\`charset=utf-8\`) - some legacy UTF-7 style tricks relied on browser guessing.
- Output encoding is contextual: HTML body, attribute, URL and JavaScript contexts each need different escaping. Libraries (React, templating engines with auto-escape) do this for you if you let them.

**Content Security Policy** is the defence-in-depth layer: even if a payload executes an injection sink, a strict CSP can block inline script and external script sources, turning many XSS bugs into non-events.
    `,
    howItWorks: `
A browser executes a script only when the HTML parser reaches a \`<script>\` tag, an event handler attribute (\`onerror=\`), or a \`javascript:\` URL in an executable position. Output encoding works by making attacker characters inert in that context: \`<\` becomes \`&lt;\` inside HTML text, quotes become \`&quot;\` inside an attribute value, and so on.

When you set \`Content-Type: application/json\` plus \`X-Content-Type-Options: nosniff\`, the browser will not hand the body to the HTML parser at all, so a stored \`<script>\` payload is just characters. CSP then adds a second gate: a policy such as \`default-src 'self'; script-src 'self'\` tells the browser to refuse inline scripts and unknown script origins, which neutralises most injection sinks even if one exists.
    `,
    codeExamples: [
      {
        title: "Storing user content: raw HTML in, sanitised HTML out",
        language: "ts",
        code: `import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
const purify = new JSDOM("").window;
const DOMPurify = createDOMPurify(purify as any);

// VULNERABLE - any markup a user sends is stored verbatim
app.post("/api/posts", authenticate, async (req, res) => {
  const post = await Post.create({ authorId: req.user.id, body: req.body.body });
  res.status(201).json({ data: post });
});

// FIXED - declare the field as rich text, sanitise at the trust boundary
const createPostSchema = z.object({ body: z.string().max(20_000) });

app.post("/api/posts", authenticate, async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: "VALIDATION_ERROR" });

  const clean = DOMPurify.sanitize(parsed.data.body, { ALLOWED_TAGS: ["p", "em", "strong", "a"] });
  const post = await Post.create({ authorId: req.user.id, body: clean });
  res.status(201).json({ data: post });
});`,
        description:
          "Sanitizing at write time means every future consumer (web, mobile, email export) receives markup that is already safe. Also sanitize on read if old unsanitised rows might still exist.",
      },
      {
        title: "Headers that stop JSON from being sniffed into HTML",
        language: "ts",
        code: `import helmet from "helmet";
app.use(helmet());                       // sets X-Content-Type-Options: nosniff, frameguard, referrer-policy...

// plus a CSP tuned for a JSON + SPA API surface
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
    },
  }),
);

// never do this for a JSON endpoint that a browser might open directly:
app.get("/legacy", (req, res) => {
  res.set("Content-Type", "text/html");      // <- browser will parse user data as HTML
  res.send("<h1>" + req.query.title + "</h1>"); // <- reflected XSS
});`,
        description:
          "A JSON API needs almost no CSP allowances - 'none' defaults are fine. The legacy handler shows the anti-pattern: HTML content type plus string building is reflected XSS with two mistakes.",
      },
    ],
    commonMistakes: [
      "Assuming React makes you immune - dangerouslySetInnerHTML, href={`javascript:...`} and server-rendered templates all bypass React's escaping.",
      "Escaping for HTML but not for the attribute or URL context the value is placed into.",
      "Serving user-uploaded SVG or HTML files from your own origin with an inline content type - SVG is an XSS vector by design.",
    ],
    bestPractices: [
      "Classify every user-controlled field as plain text or rich text up front; reject angle brackets in plain-text fields instead of 'cleaning' them later.",
      "Ship a strict CSP with Helmet and test it in report-only mode before enforcing.",
      "Serve user uploads from a separate sandbox origin (or object storage) so a payload cannot run in your app's origin.",
    ],
    realWorldUseCases: [
      "Forum, comment and chat features (p3-chat-app) where one stored payload reaches every reader.",
      "Admin dashboards that render user-supplied names or ticket descriptions into an HTML table.",
    ],
    resources: [
      docs(
        "OWASP XSS Prevention Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
        "Context-by-context output encoding rules and the rules of thumb for HTML.",
        "en",
        "15 min",
      ),
      docs("MDN - Content Security Policy", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP", "How CSP directives block inline and remote script.", "en", "12 min"),
      docs("Helmet - contentSecurityPolicy", OFFICIAL.helmetDocs, "Setting CSP headers from Express with sane defaults.", "en", "8 min"),
      ytSearch("cross site scripting explained stored reflected DOM", "Local demos of XSS payloads against your own test pages.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-xss-classify",
        title: "Classify the sinks",
        prompt:
          "For each of the following, name the XSS family (stored / reflected / DOM) and the minimal fix: (1) a chat message saved to MongoDB and rendered with innerHTML in React; (2) /search?q=... echoed into an <h1> on the server; (3) a JSON field rendered with {userInput} in JSX; (4) an avatar URL put into href without scheme checks.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: ["Family depends on where the payload is stored, not on what the payload looks like.", "javascript: in href is DOM XSS even though the sink is an attribute, not innerHTML."],
      },
      {
        id: "ex-p3m3-xss-store",
        title: "Make a stored payload fail safely",
        prompt:
          "Add a plain-text bio field to a toy API on 127.0.0.1:3000. Save <img src=x onerror=alert(1)> as the bio, fetch it back and confirm it round-trips verbatim. Then change the handler so the same write is rejected (or stored encoded) such that rendering it is inert. Paste the before/after responses.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["Reject at write time with a validation error if the field is declared plain text.", "Do not rely on the frontend to escape - the API owns the guarantee."],
        solution: `// before: payload stored verbatim
app.patch("/api/users/me", authenticate, async (req, res) => {
  await User.updateOne({ _id: req.user.id }, { bio: req.body.bio });
  res.json({ ok: true });
});
// POST {"bio":"<img src=x onerror=alert(1)>"} -> 200, bio round-trips as HTML

// after: plain-text field - angle brackets are rejected at the boundary
const updateBioSchema = z.string().max(500).refine(
  (v) => !/[<>]/.test(v),
  { message: "bio must be plain text" },
);

app.patch("/api/users/me", authenticate, async (req, res) => {
  const parsed = updateBioSchema.safeParse(req.body.bio);
  if (!parsed.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: [{ field: "bio", code: "not_plain_text" }],
    });
  }
  await User.updateOne({ _id: req.user.id }, { bio: parsed.data });
  res.json({ ok: true });
});
// same POST -> 422 {"error":"VALIDATION_ERROR",...} and nothing is stored`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-chat-app", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-csrf",
    slug: "cross-site-request-forgery",
    title: "Cross-Site Request Forgery (CSRF)",
    description:
      "Why cookie-authenticated state changes are forgeable from another origin, and how SameSite, double-submit tokens and custom headers stop it - plus why Bearer tokens sidestep the problem.",
    order: 6,
    estimatedMinutes: 18,
    tags: ["csrf", "cookies", "samesite", "browser-security"],
    prerequisites: ["p2m6-csrf-protection", "p2m6-secure-cookie-config"],
    relatedTopics: ["p3m3-xss", "p3m3-secure-headers-helmet", "p3m3-broken-access-control"],
    learningObjectives: [
      "Explain the CSRF trust model: the browser attaches cookies the attacker cannot read",
      "Build a minimal local CSRF demo against your own loopback API",
      "Combine SameSite cookies with a double-submit token or required custom header",
      "State why Authorization: Bearer tokens stored outside cookies are not vulnerable to CSRF",
    ],
    simpleExplanation:
      "CSRF tricks a logged-in victim's browser into sending a request to your site that the victim never intended. Because the browser automatically attaches your session cookie to requests to your bank, a form on an attacker's page can POST a transfer and it will look authenticated. The attacker never sees the cookie - they just borrow its effect.",
    detailedContent: `
**The requirements for an exploit**

1. The API authenticates with something the browser attaches automatically - a cookie (or client certificate).
2. A state-changing request exists (POST/PATCH/DELETE) that needs no extra secret the attacker lacks.
3. The attacker can get the victim's browser to send that request: a cross-site form, an image tag, a fetch with \`mode: "no-cors"\`.

Note what is *not* required: reading the response. CSRF is about causing an action, not observing it, which is why \`SameSite\` and CORS do not fully overlap.

**Defences that compose**

- **SameSite=Lax or Strict** on the session cookie. Modern browsers do not attach a Lax cookie to cross-site POSTs, which kills the classic form attack. \`Lax\` still sends cookies on top-level GET navigation, so it is not a complete answer for state-changing GETs (which you should not have anyway).
- **Double-submit CSRF token**: a random token in a cookie plus the same token in a header or body field. The attacker cannot read the cookie cross-origin, so they cannot set the matching header. Implementation: issue \`csrf=<random>; SameSite=Lax\`, require \`X-CSRF-Token: <same value>\` on writes.
- **Required custom header**: demand \`X-Requested-With: XMLHttpRequest\` (or any custom header) on every write. Cross-site simple requests cannot set custom headers, and a preflight will fail - this alone stops most CSRF without a token.
- **Re-authentication** for high-value actions (changing an email, withdrawing funds).

**Bearer tokens avoid CSRF by construction.** Tokens in \`Authorization\` headers are not attached automatically; a cross-site page cannot set that header without a preflight that your CORS rules reject. That is the single biggest operational difference from cookie sessions - and the reason SPA APIs moved to them.

Never rely on HTTPS alone, and never use \`SameSite=None\` unless you genuinely need cross-site cookies (then Secure is mandatory).
    `,
    howItWorks: `
Browsers decide cookie attachment before your server ever sees the request. For a cross-site POST from \`evil.example\` to \`bank.example\`:

1. The browser looks up cookies for \`bank.example\` with \`SameSite=None\` - only those are candidates.
2. With \`SameSite=Lax\` (the modern default) the cookie is **withheld**, so the server sees an unauthenticated request and answers 401.

If the cookie is sent, Express middleware then checks the double-submit token: compare \`req.cookies.csrf\` against \`req.get("X-CSRF-Token")\` using a timing-safe comparison, and reject with 403 on mismatch. The attacker cannot satisfy the check because reading \`csrf\` from another origin is blocked by the same-origin policy - CORS forbids the read even though the cookie was sent.
    `,
    codeExamples: [
      {
        title: "Cookie session plus double-submit CSRF protection",
        language: "ts",
        code: `import crypto from "node:crypto";

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a); const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// login sets BOTH cookies
app.post("/login", (req, res) => {
  const sid = createSession(req.user);
  const csrf = crypto.randomBytes(32).toString("hex");
  saveCsrfToken(sid, csrf);
  res.cookie("sid", sid, { httpOnly: true, secure: true, sameSite: "lax" });
  res.cookie("csrf", csrf, { httpOnly: false, secure: true, sameSite: "lax" }); // JS must read it
  res.json({ ok: true });
});

// every state-changing route requires the matching header
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookie = req.cookies.csrf ?? "";
  const header = req.get("X-CSRF-Token") ?? "";
  if (!cookie || !header || !safeEqual(cookie, header)) {
    return res.status(403).json({ error: "CSRF_TOKEN_INVALID" });
  }
  next();
}

app.use(csrfProtection);
app.post("/api/transfers", authenticate, (req, res) => res.json({ ok: true }));`,
        description:
          "The attacker's page can cause the browser to send the sid cookie, but it cannot read the csrf cookie, so it can never produce a matching X-CSRF-Token header.",
      },
      {
        title: "A local, harmless CSRF demo page",
        language: "html",
        code: `<!-- save as csrf-demo.html and open from another local origin,
     e.g. file:// or http://127.0.0.1:5500 while the API is on :3000 -->
<form action="http://127.0.0.1:3000/api/profile/email" method="POST">
  <input type="hidden" name="email" value="attacker@example.com" />
  <button>Click for a prize</button>
</form>
<script>
  // With SameSite=Lax the browser will NOT attach the session cookie
  // to this cross-site POST, so the API answers 401 and nothing changes.
</script>`,
        description:
          "Run only against your own 127.0.0.1 API with seeded data. Observe the 401, then remove SameSite from the cookie and observe the change go through - that difference is the entire vulnerability class.",
      },
    ],
    commonMistakes: [
      "Assuming CORS protects you: CORS stops the attacker reading the response, not the browser sending the request.",
      "Relying only on SameSite for state-changing GETs - Lax still sends the cookie on top-level navigation, and GET should never mutate state.",
      "Marking the CSRF cookie HttpOnly, which makes it impossible for your frontend to echo the token into the header.",
    ],
    bestPractices: [
      "Set SameSite=Lax (or Strict for first-party apps) on every session cookie as the default layer.",
      "Add double-submit tokens or a required custom header on all writes; they compose rather than compete.",
      "Prefer Bearer tokens for pure APIs - no automatic attachment, so CSRF disappears from the threat model.",
    ],
    realWorldUseCases: [
      "Any cookie-authenticated dashboard (p3-ecommerce-platform checkout, admin panels) - the classic target of CSRF.",
      "Legacy apps that kept POST forms without tokens after moving to a SPA: the forms still work and are still forgeable.",
    ],
    resources: [
      docs(
        "OWASP CSRF Prevention Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
        "SameSite, synchroniser tokens and double-submit compared side by side.",
        "en",
        "12 min",
      ),
      docs(
        "MDN - SameSite cookies",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie/SameSite",
        "Exact browser behaviour for Lax, Strict and None.",
        "en",
        "8 min",
      ),
      docs("Express - res.cookie", OFFICIAL.expressApi, "Setting cookie attributes from Express.", "en", "5 min"),
      ytSearch("CSRF attack explained same site cookies demo", "End-to-end CSRF demos against local test servers.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-csrf-demo",
        title: "Demonstrate and then kill CSRF locally",
        prompt:
          "Build a cookie-login API on 127.0.0.1:3000 with a POST /api/profile/email route and a separate local page that auto-submits a cross-site form to it. Record what happens with (a) no SameSite, (b) SameSite=Lax, (c) SameSite=Lax + required X-CSRF-Token header. Write three sentences on which layer stopped the attack each time.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "curl -b 'sid=...' still works with SameSite set - SameSite is a browser-only rule.",
          "Test with two local origins (ports differ = different sites) rather than file:// if your browser restricts it.",
        ],
      },
      {
        id: "ex-p3m3-csrf-token",
        title: "Implement the double-submit check",
        prompt:
          "Add the csrfProtection middleware from this lesson to your toy API and verify three cases with curl: no header (403), wrong header value (403), matching header (200). Then explain why an attacker page cannot produce the third case even though it can make the browser send the cookie.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Use curl -b 'sid=x; csrf=abc' -H 'X-CSRF-Token: abc' to simulate the good case.",
          "Cross-origin JavaScript cannot read document.cookie for your domain, so it cannot learn abc.",
        ],
        solution: `# 1) no header -> rejected
curl -i -X POST http://127.0.0.1:3000/api/transfers \\
  -H "Content-Type: application/json" -d '{"amount":10}' \\
  -b "sid=s1; csrf=abc123"
# 403 {"error":"CSRF_TOKEN_INVALID"}

# 2) wrong header -> rejected
curl -i -X POST http://127.0.0.1:3000/api/transfers \\
  -H "Content-Type: application/json" -H "X-CSRF-Token: nope" \\
  -d '{"amount":10}' -b "sid=s1; csrf=abc123"
# 403 {"error":"CSRF_TOKEN_INVALID"}

# 3) matching header -> allowed
curl -i -X POST http://127.0.0.1:3000/api/transfers \\
  -H "Content-Type: application/json" -H "X-CSRF-Token: abc123" \\
  -d '{"amount":10}' -b "sid=s1; csrf=abc123"
# 200 {"ok":true}

// middleware
function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const c = req.cookies.csrf ?? "";
  const h = req.get("X-CSRF-Token") ?? "";
  const ok = c.length > 0 && c.length === h.length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(h));
  if (!ok) return res.status(403).json({ error: "CSRF_TOKEN_INVALID" });
  next();
}`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-ssrf",
    slug: "server-side-request-forgery",
    title: "Server-Side Request Forgery (SSRF)",
    description:
      "Fetching user-supplied URLs safely: cloud metadata at 169.254.169.254, redirect following, DNS rebinding, and an allowlist design that blocks link-local and private ranges.",
    order: 7,
    estimatedMinutes: 22,
    tags: ["ssrf", "url-validation", "cloud-security", "fetch"],
    prerequisites: ["p2m5-api-security-basics", "p3m3-injection-attacks"],
    relatedTopics: ["p3m3-broken-access-control", "p3m3-input-sanitization", "p3m3-secure-file-uploads"],
    learningObjectives: [
      "Describe the SSRF attack surface: any endpoint that fetches a caller-supplied URL",
      "Explain why 169.254.169.254 and 127.0.0.1 matter and what an attacker gains",
      "Design an allowlist that validates scheme, host and resolved IP, and survives redirects",
      "Demonstrate a blocked request against a local toy fetcher",
    ],
    simpleExplanation:
      "SSRF is when you trick a server into making an HTTP request on your behalf. If your API has a \"import from URL\" feature, an attacker can point it at things only the server can reach: the cloud metadata service that holds temporary credentials, internal admin panels, or databases listening on 127.0.0.1. The server becomes a proxy into your private network.",
    detailedContent: `
**Why it matters more in the cloud.** Most cloud instances expose a metadata endpoint at \`169.254.169.254\` (link-local). With IMDSv1, a single unauthenticated GET to \`http://169.254.169.254/latest/meta-data/iam/security-credentials/\` returns the instance's temporary AWS credentials. From there an attacker does not need your secrets - they borrow the machine's identity.

**The naive sink**

    const res = await fetch(req.query.url);   // SSRF with one line

Useful targets for an attacker (all reachable from your server, not from their laptop):

- \`http://127.0.0.1:3000/admin\` and \`http://localhost:9200\` - loopback services that never meant to be public.
- \`http://169.254.169.254/\` - cloud metadata.
- RFC1918 ranges: \`10.x\`, \`172.16–31.x\`, \`192.168.x\` - internal admin UIs and databases.
- Non-HTTP schemes: \`file:///etc/passwd\`, \`gopher://\`, \`ftp://\` in clients that support them.

**Defence in depth (an allowlist beats any blocklist)**

1. **Allowlist hosts** you genuinely need (a fixed list of partner domains), and require \`https\`.
2. **Parse, never regex**: use \`new URL(input)\` and validate \`protocol\` and \`hostname\`.
3. **Resolve DNS and check the IP**: reject loopback, link-local (\`169.254.0.0/16\`), private ranges and IPv6 equivalents (\`::1\`, \`fc00::/7\`, \`fe80::/10\`).
4. **Disable redirect following** (\`redirect: "manual"\`) or re-run steps 2–3 on every hop - a public URL that 302s to metadata defeats a one-time check.
5. **Egress controls**: in production, block metadata and RFC1918 at the network layer so even a validation bug cannot reach them.
6. Never return the raw upstream response body to the client; parse and project the fields you need.

All demos in this lesson target \`127.0.0.1\` and \`example.com\` only. Do not point SSRF practice at third-party systems.
    `,
    howItWorks: `
A safe fetcher separates *parsing* from *connecting*. \`new URL()\` gives you a normalised \`protocol\` and \`hostname\`; you check those against an allowlist. Because DNS is attacker-influenceable (a name can resolve to \`127.0.0.1\`, or resolve differently on the second look - DNS rebinding), you then resolve the hostname yourself with \`dns.promises.lookup\`, verify the address is not in a blocked range, and connect **to that IP** (or re-verify after connect).

Fetch and undici follow redirects by default, so a URL you approved can silently change host mid-flight. \`redirect: "manual"\` keeps the 3xx in your hands; if you choose to follow, re-run the full validation on the new URL. Timeouts, response size caps and an aborted body stream keep a hostile server from exhausting your worker.
    `,
    codeExamples: [
      {
        title: "Unsafe fetcher versus allowlist fetcher (local only)",
        language: "ts",
        code: `import dns from "node:dns/promises";
import net from "node:net";

// VULNERABLE - one parameter, no checks
app.get("/api/proxy", async (req, res) => {
  const r = await fetch(String(req.query.url)); // try 127.0.0.1:3000/admin locally
  res.type("text/plain").send(await r.text());
});

// FIXED - scheme allowlist, host allowlist, IP range check, no redirects
const ALLOWED_HOSTS = new Set(["example.com", "www.example.com"]);
const BLOCKED_RANGES = [/^127\\./, /^10\\./, /^192\\.168\\./, /^169\\.254\\./, /^172\\.(1[6-9]|2\\d|3[01])\\./];

function isBlockedIp(ip: string): boolean {
  if (net.isIPv6(ip)) return ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd");
  return BLOCKED_RANGES.some((re) => re.test(ip));
}

app.get("/api/proxy", async (req, res) => {
  let url: URL;
  try {
    url = new URL(String(req.query.url));
  } catch {
    return res.status(400).json({ error: "BAD_URL" });
  }
  if (url.protocol !== "https:") return res.status(400).json({ error: "HTTPS_ONLY" });
  if (!ALLOWED_HOSTS.has(url.hostname)) return res.status(400).json({ error: "HOST_NOT_ALLOWED" });

  const { address } = await dns.lookup(url.hostname);
  if (isBlockedIp(address)) return res.status(400).json({ error: "BLOCKED_ADDRESS" });

  const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  if (r.status >= 300 && r.status < 400) return res.status(400).json({ error: "REDIRECT_NOT_FOLLOWED" });
  res.type("text/plain").send((await r.text()).slice(0, 10_000));
});`,
        description:
          "Point the vulnerable version at http://127.0.0.1:3000/admin on your own machine to see loopback access succeed; the fixed version rejects it at the host allowlist before any connection.",
      },
      {
        title: "What to block, as a reference table",
        language: "text",
        code: `BLOCK THESE WHEN VALIDATING A RESOLVED IP
  IPv4 loopback        127.0.0.0/8        127.0.0.1, 127.0.0.53
  IPv4 private         10.0.0.0/8         internal services
  IPv4 private         172.16.0.0/12      docker bridges
  IPv4 private         192.168.0.0/16     office/home LANs
  IPv4 link-local      169.254.0.0/16     CLOUD METADATA 169.254.169.254
  IPv4 CGNAT          100.64.0.0/10       some cloud internal ranges
  IPv6 loopback        ::1
  IPv6 unique-local    fc00::/7
  IPv6 link-local      fe80::/10
  Any                  0.0.0.0            "this host" on many stacks

PREFER: a fixed host allowlist over any blocklist - the internet will invent new internal ranges tomorrow.`,
        description:
          "Keep this next to any code path that opens a socket to a caller-supplied host, including webhooks you register and image importers.",
      },
    ],
    commonMistakes: [
      "Validating the URL string with a regex like /^https?:\\/\\// - it says nothing about where the connection actually goes.",
      "Checking the IP once, then letting fetch follow a 302 to http://169.254.169.254/.",
      "Blocking 127.0.0.1 by string but forgetting 2130706433 (decimal), 0x7f000001 (hex) or localhost - parse with URL and check the resolved IP instead.",
    ],
    bestPractices: [
      "Default-deny: only hosts on an explicit allowlist are fetchable, and only over HTTPS.",
      "Disable redirects or revalidate every hop; cap response size and time with AbortSignal.timeout.",
      "Block metadata and RFC1918 egress at the network layer in production - it is the control that still works after a code bug.",
    ],
    realWorldUseCases: [
      "Webhook registration, \"import from URL\" and RSS/CSV importers in p3-job-processing - all classic SSRF sinks.",
      "Image proxies and link previewers in chat apps (p3-chat-app) that fetch arbitrary URLs on demand.",
    ],
    resources: [
      docs(
        "OWASP SSRF Prevention Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Server-Side_Request_Forgery_Prevention_Cheat_Sheet.html",
        "Allowlist design, DNS checks and network-level controls.",
        "en",
        "12 min",
      ),
      docs(
        "AWS - Instance metadata",
        "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html",
        "What the metadata service exposes and why IMDSv2 (hop limit) exists.",
        "en",
        "10 min",
      ),
      docs("MDN - Fetch API redirect", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API", "redirect: 'manual' and how fetch handles 3xx.", "en", "8 min"),
      ytSearch("SSRF explained cloud metadata 169.254.169.254 demo", "Local demonstrations against loopback and metadata stubs.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-ssrf-block",
        title: "Block the local payload",
        prompt:
          "Implement the vulnerable /api/proxy on 127.0.0.1:3000 together with a tiny /admin route that returns {\"secret\":\"local-only\"}. Confirm curl 'http://127.0.0.1:3000/api/proxy?url=http://127.0.0.1:3000/admin' leaks it. Then add validation so that exact request fails safely. Paste both responses.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Everything is loopback, so no third-party system is involved.",
          "Check protocol, then hostname against an allowlist - the IP check is the second layer.",
        ],
        solution: `// step 1 - vulnerable proxy + local admin target (loopback only)
app.get("/admin", (req, res) => res.json({ secret: "local-only" }));

app.get("/api/proxy", async (req, res) => {
  const r = await fetch(String(req.query.url));
  res.type("text/plain").send(await r.text());
});

// step 2 - same server, hardened proxy
const ALLOWED_HOSTS = new Set(["example.com"]);

app.get("/api/proxy", async (req, res) => {
  let url: URL;
  try { url = new URL(String(req.query.url)); } catch {
    return res.status(400).json({ error: "BAD_URL" });
  }
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    return res.status(400).json({ error: "HOST_NOT_ALLOWED" });
  }
  const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  res.type("text/plain").send((await r.text()).slice(0, 10_000));
});

// BEFORE: curl "http://127.0.0.1:3000/api/proxy?url=http://127.0.0.1:3000/admin"
//   -> 200 {"secret":"local-only"}
// AFTER:  identical curl
//   -> 400 {"error":"HOST_NOT_ALLOWED"}`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-ssrf-redirect",
        title: "Defeat a one-time check",
        prompt:
          "Explain, without running anything against third parties, how an attacker defeats a validator that checks the IP of the original URL but lets fetch follow redirects. Sketch the two-hop sequence (public host -> internal target) and write the two-line change that stops it.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: ["The first URL can be perfectly legitimate and still 302 to 169.254.169.254.", "redirect: 'manual' keeps the decision in your code."],
      },
    ],
    projectIds: ["p3-job-processing", "p3-analytics-api"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-broken-access-control",
    slug: "broken-access-control",
    title: "Broken Access Control",
    description:
      "BOLA and IDOR at /invoices/123, object ownership checks, deny-by-default routing and function-level authorization for admin surfaces.",
    order: 8,
    estimatedMinutes: 24,
    tags: ["authorization", "idor", "bola", "permissions"],
    prerequisites: ["p2m6-permissions", "p2m6-protected-routes", "p2m6-auth-vs-authz", "p3m1-layered-architecture"],
    relatedTopics: ["p3m3-owasp-api-security", "p3m3-ssrf", "p3m3-safe-logging"],
    learningObjectives: [
      "Differentiate authentication, object-level authorization and function-level authorization",
      "Implement ownership scoping in the database query itself, not only in the handler",
      "Apply deny-by-default routing and explicit role guards to admin functions",
      "Choose 403 versus 404 correctly so responses do not confirm resource existence",
    ],
    simpleExplanation:
      "Access control answers \"now that we know who you are, may you do *this*?\" The two classic failures are reading someone else's object by changing an id (BOLA/IDOR) and reaching an admin function that was never actually guarded. Both are fixed by writing the check where the request is handled - every single time, for every object.",
    detailedContent: `
**Three questions, in order, on every request**

1. **Authentication** - who is calling? (session or token; 401 when missing/invalid).
2. **Object-level authorization** - may this principal read/change *this* object? (403/404 when not).
3. **Function-level authorization** - may this principal call this *operation* at all? (403 for \`DELETE /admin/users\` from a non-admin).

Mixing them up produces the classic wrong status codes: a 401 for an unauthorised-but-authenticated request teaches clients nothing, and a 403 for a stranger's invoice confirms that invoice exists.

**Where the check belongs.** The safest pattern is to put ownership into the data-access query:

    Invoice.findOne({ _id: id, userId: req.user.id })

If the row does not exist *for this user*, you answer 404. The alternative - load, then compare - works too, but every early return in a long handler is a chance to forget. Deny-by-default routing goes further: register admin routers under a \`requireRole("admin")\` middleware so a forgotten route cannot be public.

**Hierarchy and tenancy.** If you have roles (owner, member, admin) or tenants (org A vs org B), encode the rule once in a policy function (\`can(user, "delete", invoice)\`) rather than scattering \`if (user.role === "admin")\` checks. Policy code is testable; ad-hoc ifs are not.

**Client-side hiding is not access control.** A disabled button in React changes nothing - the attacker calls the API with curl. Every rule must live server-side.
    `,
    howItWorks: `
A request arrives at \`GET /api/invoices/inv_123\`. The auth middleware runs and puts a verified \`req.user = { id: "u_7", role: "user" }\`. A naive handler then loads \`Invoice.findById("inv_123")\` - which succeeds regardless of the owner - and returns it. That is BOLA in one line.

With scoping, the repository method always requires a \`userId\` (or \`orgId\`) argument; the signature itself makes an unscoped query impossible. For admin functions, a guard middleware runs before the handler and returns 403 unless \`req.user.role\` satisfies the requirement. Because middleware runs in registration order, mounting \`app.use("/admin", requireRole("admin"), adminRouter)\` protects every route added later, including ones the original author forgot about.
    `,
    codeExamples: [
      {
        title: "IDOR versus ownership scoping",
        language: "ts",
        code: `// VULNERABLE - /invoices/123 is readable by anyone with a valid token
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ data: invoice }); // leaks user B's invoice to user A
});

// FIXED - ownership is part of the query; strangers get 404
app.get("/api/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!invoice) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  res.json({ data: invoice });
});

// FIXED ALTERNATIVE - explicit policy call (better for complex hierarchies)
app.delete("/api/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice || !can(req.user, "delete", invoice)) {
    return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  }
  await invoice.deleteOne();
  res.status(204).end();
});`,
        description:
          "The policy version handles complex rules (org members can cancel, only the creator can delete) in one testable function while still failing closed for missing objects.",
      },
      {
        title: "Function-level authorization with a mounted guard",
        language: "ts",
        code: `function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "NOT_AUTHENTICATED" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    next();
  };
}

// every route registered under this mount point is admin-only
app.use("/api/admin", authenticate, requireRole("admin"), adminRouter);

// deny by default: unknown paths never fall through to a permissive handler
app.use((req, res) => res.status(404).json({ error: "ROUTE_NOT_FOUND" }));`,
        description:
          "Mounting the guard protects routes that do not exist yet as well - the default is denial, which is the only default that survives new code.",
      },
    ],
    commonMistakes: [
      "Checking that req.user exists but never that the object belongs to them - 'authenticated' is not 'authorised'.",
      "Returning 403 for objects owned by others, which confirms the id exists and invites enumeration.",
      "Guarding /admin in the frontend router while the API path itself is unauthenticated.",
    ],
    bestPractices: [
      "Put ownership (tenant/user id) in the WHERE clause of every object query by default.",
      "Centralise role logic in one policy module with unit tests for allow and deny cases.",
      "Test every new endpoint with two accounts: the owner must succeed, the stranger must get 404/403.",
    ],
    realWorldUseCases: [
      "Multi-tenant SaaS (p3-booking-platform, p3-analytics-api): one forgotten orgId filter exposes a whole customer's data.",
      "Admin back offices: a leaked admin route without a role guard is full compromise.",
    ],
    resources: [
      docs(
        "OWASP - A01 Broken Access Control",
        "https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
        "Category description, attack examples and prevention checklist.",
        "en",
        "10 min",
      ),
      docs(
        "OWASP REST Security Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html",
        "Object-level and function-level authorization patterns for REST APIs.",
        "en",
        "12 min",
      ),
      docs("OWASP - Insecure Direct Object References", "https://owasp.org/www-community/attacks/Insecure_Direct_Object_Reference", "The IDOR pattern with worked examples.", "en", "8 min"),
      ytSearch("broken access control IDOR explained demo", "Local IDOR demonstrations and test strategies.", "en", "12–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-ac-two-users",
        title: "Two-account test matrix",
        prompt:
          "For five write and read endpoints in your project, build a 2x2 matrix: (owner, non-owner) x (user role, admin role). Predict the expected status for each cell, then verify with curl using two local accounts. List every cell where the actual response differs from your prediction - those are your open access-control bugs.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: ["Use 404 for objects the caller must not know exist, 403 for operations they may know exist."],
      },
      {
        id: "ex-p3m3-ac-scope",
        title: "Scope the query, not the handler",
        prompt:
          "Take a handler that does findById followed by an ownership if-statement. Move the rule into a repository function whose signature requires the caller's id, delete the in-handler if, and add a unit test that asserts the stranger path returns no document. Paste the before/after code.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["If the repository method cannot be called without a userId, an unscoped query becomes impossible to write by accident."],
        solution: `// before - rule lives in the handler, easy to forget on the next copy-paste
async function getInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "NOT_FOUND" });
  if (invoice.userId !== req.user.id) return res.status(404).json({ error: "NOT_FOUND" });
  res.json({ data: invoice });
}

// after - rule lives in the data layer, required by the type signature
async function findInvoiceForUser(id: string, userId: string) {
  return Invoice.findOne({ _id: id, userId });
}

app.get("/api/invoices/:id", authenticate, async (req, res) => {
  const invoice = await findInvoiceForUser(req.params.id, req.user.id);
  if (!invoice) return res.status(404).json({ error: "INVOICE_NOT_FOUND" });
  res.json({ data: invoice });
});

// test
it("returns null for another user's invoice", async () => {
  const invoice = await findInvoiceForUser(invoiceOfB, userA.id);
  expect(invoice).toBeNull();
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-booking-platform", "p3-analytics-api"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-secure-headers-helmet",
    slug: "secure-headers-helmet",
    title: "Secure Headers with Helmet",
    description:
      "CSP, X-Content-Type-Options, frame restrictions, Referrer-Policy, Permissions Policy and when it is finally safe to turn on HSTS.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["helmet", "headers", "csp", "hsts"],
    prerequisites: ["p2m5-cors", "p2m5-api-security-basics"],
    relatedTopics: ["p3m3-xss", "p3m3-csrf", "p3m3-owasp-api-security"],
    learningObjectives: [
      "List the security headers Helmet sets by default and what each one prevents",
      "Write a CSP appropriate for a JSON API versus a server-rendered app",
      "Enable HSTS only after proving every subdomain serves HTTPS",
      "Verify headers locally with curl and fix the common misconfigurations",
    ],
    simpleExplanation:
      "Browsers will happily guess how to treat a response unless you tell them otherwise. Security headers are those instructions: \"do not let this be framed\", \"never sniff JSON into HTML\", \"only load scripts from my origin\". Helmet is an Express middleware that sets a sensible set of them in one line, which you then tune per application.",
    detailedContent: `
**The headers worth knowing**

| Header | What it does | Typical value |
| --- | --- | --- |
| \`Content-Security-Policy\` | Restricts where scripts, styles, images and frames may come from | \`default-src 'self'\` |
| \`X-Content-Type-Options\` | Disables MIME sniffing | \`nosniff\` |
| \`X-Frame-Options\` / \`frame-ancestors\` | Blocks clickjacking framing | \`DENY\` |
| \`Referrer-Policy\` | Controls how much URL is leaked in Referer | \`no-referrer\` |
| \`Permissions-Policy\` | Turns off powerful browser features you do not use | \`camera=(), geolocation=()\` |
| \`Strict-Transport-Security\` | Forces future visits onto HTTPS | \`max-age=31536000; includeSubDomains\` |
| \`Cross-Origin-Opener-Policy\` | Isolates the browsing context | \`same-origin\` |
| \`X-DNS-Prefetch-Control\` | Stops DNS prefetching of links | \`off\` |

**CSP is the heavyweight.** For a JSON API that no browser renders, a restrictive policy costs nothing: \`default-src 'none'; frame-ancestors 'none'; base-uri 'none'\`. For a server-rendered app you will need \`script-src 'self'\` (no inline, no \`eval\`), \`img-src 'self' data:\`, and ideally nonces or hashes for the few inline snippets that remain. Start with \`Content-Security-Policy-Report-Only\` and watch the reports before enforcing.

**HSTS has a footgun.** \`Strict-Transport-Security\` with a long \`max-age\` tells browsers to upgrade every future request to HTTPS for that host - including requests that have not happened yet. If any subdomain (\`http://staging.example.com\`) still speaks plain HTTP, users get hard errors for the entire \`max-age\`. Turn it on only after an inventory proves TLS everywhere, and start with a short \`max-age\` (300) before raising it. \`includeSubDomains\` is a one-way door for a long time; \`preload\` is permanent.

Helmet does not set HSTS by default for exactly this reason.
    `,
    howItWorks: `
Helmet is a stack of small middlewares, each setting one header family: \`noSniff()\`, \`frameguard()\`, \`referrerPolicy()\`, \`contentSecurityPolicy()\`, \`hsts()\`, \`crossOriginOpenerPolicy()\`, and more. \`app.use(helmet())\` mounts the safe defaults; anything you pass in the options object overrides or extends them.

Because headers are per-response, you can vary policy by route: a strict CSP for your HTML documents and a stricter 'none' CSP for \`/api/*\`. Verify with:

    curl -sI http://127.0.0.1:3000/ | findstr /i "content-security x-frame strict-transport"

If a header is missing, the middleware is mounted after a route that ended the response, or the reverse proxy in front of you is stripping it - check both.
    `,
    codeExamples: [
      {
        title: "Helmet configured for a JSON API",
        language: "ts",
        code: `import helmet from "helmet";
import express from "express";

const app = express();

app.use(helmet()); // nosniff, frameguard, referrer-policy, COOP, ...

// JSON API surface: nothing needs to load scripts or frames
app.use(
  "/api",
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  }),
  helmet.crossOriginResourcePolicy({ policy: "same-site" }),
);

// HSTS: enable ONLY behind confirmed HTTPS, start short, then lengthen
if (process.env.NODE_ENV === "production") {
  app.use(helmet.hsts({ maxAge: 300, includeSubDomains: true })); // seconds!
}

app.get("/api/health", (req, res) => res.json({ ok: true }));`,
        description:
          "maxAge is in seconds: 300 is five minutes, 31536000 is a year. Never paste a year-long HSTS header into an environment you have not verified end to end over TLS.",
      },
      {
        title: "Inspect what your app actually sends",
        language: "bash",
        code: `# local check against your own server
curl -sI http://127.0.0.1:3000/api/health

# expect at least:
#   x-dns-prefetch-control: off
#   x-frame-options: SAMEORIGIN
#   x-content-type-options: nosniff
#   referrer-policy: no-referrer
#   content-security-policy: default-src 'none'; frame-ancestors 'none'; ...
#   cross-origin-opener-policy: same-origin`,
        description: "Run this after every Helmet upgrade; defaults change between major versions.",
      },
    ],
    commonMistakes: [
      "Enabling HSTS with includeSubDomains while staging still runs on plain HTTP - users cannot reach staging for the whole max-age.",
      "Shipping a CSP with 'unsafe-inline' for scripts, which removes most of the XSS protection you just paid for.",
      "Letting a reverse proxy overwrite or drop headers so local tests pass and production silently loses them.",
    ],
    bestPractices: [
      "Start with Helmet defaults, then add a stricter route-scoped CSP for /api/*.",
      "Roll out CSP in report-only mode and triage violations before enforcing.",
      "Keep an inventory of subdomains before enabling HSTS; raise max-age gradually from 300 to 31536000.",
    ],
    realWorldUseCases: [
      "Any public API: a one-line helmet() plus a strict API CSP removes a whole category of findings in security scans.",
      "SPAs served by the same Express app need different CSP directives for the document route than the JSON routes.",
    ],
    resources: [
      docs("Helmet.js", OFFICIAL.helmetDocs, "Default middleware list and per-directive configuration.", "en", "10 min"),
      docs("MDN - Content Security Policy", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP", "Directive reference with examples and report-only mode.", "en", "12 min"),
      docs("RFC 6797 - HSTS", "https://www.rfc-editor.org/rfc/rfc6797", "The specification behind Strict-Transport-Security and its risks.", "en", "reference"),
      ytSearch("helmet express security headers tutorial", "Walkthroughs of enabling and verifying security headers locally.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-headers-audit",
        title: "Audit your response headers",
        prompt:
          "Run curl -sI against three routes of your app (HTML page, JSON endpoint, error page). Build a table of the eight headers from this lesson and mark present/missing per route. Fix the two gaps with the highest impact and paste the new header list for the worst route.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Error pages are often served by a proxy after your middleware has already run - check them separately."],
      },
      {
        id: "ex-p3m3-csp-api",
        title: "Write a CSP for a JSON API",
        prompt:
          "Given an API consumed by a React SPA on https://app.example.com and by mobile clients, write the tightest CSP that still makes sense for the /api routes, and explain in two sentences why script-src matters less here than on the document route.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: ["A JSON response is never executed as a document - default-src 'none' is legal.", "frame-ancestors and base-uri still protect against a browser opening the JSON directly."],
        solution: `app.use(
  "/api",
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      connectSrc: ["'none'"],
      sandbox: ["allow-same-origin"],
    },
  }),
);

// Why script-src is not the lever here: browsers do not execute JSON as a
// document, so the XSS sinks live on the HTML route. For /api the wins are
// 'no framing' (clickjacking a JSON view), 'no base hijack' and refusing
// any future change that starts serving HTML from these paths.`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-rate-limiting-security",
    slug: "rate-limiting-security",
    title: "Rate Limiting as a Security Control",
    description:
      "Protecting login, token and expensive endpoints specifically: 429 semantics, per-user versus per-IP budgets, shared stores, and how not to DoS your own legitimate users.",
    order: 10,
    estimatedMinutes: 18,
    tags: ["rate-limiting", "availability", "express-rate-limit", "429"],
    prerequisites: ["p2m5-rate-limiting", "p2m5-request-size-limits"],
    relatedTopics: ["p3m3-brute-force-protection", "p3m3-owasp-api-security", "p3m3-safe-logging"],
    learningObjectives: [
      "Explain why rate limiting is an authorization-adjacent control, not only a cost control",
      "Choose the right key (IP, user, token, API key) for a given endpoint",
      "Return correct 429 responses with Retry-After and budget headers",
      "Back the limiter with a shared store so multiple instances enforce one budget",
    ],
    simpleExplanation:
      "Rate limiting caps how many requests a client may make in a time window. As a *security* control it stops credential stuffing, token guessing, scraping and resource exhaustion. Done badly it is worse than nothing: a shared NAT or a busy mobile network can lock out hundreds of real users behind one IP address.",
    detailedContent: `
**Security goals of a limiter**

- Stop brute force and credential stuffing on \`/login\`, \`/token\`, \`/password-reset\`.
- Cap expensive work: complex search, report generation, regex filters, bulk exports.
- Keep one noisy tenant from starving the shared pool (API4 - unrestricted resource consumption).

**Choosing the key**

| Key | Good for | Watch out |
| --- | --- | --- |
| IP address | Anonymous traffic, pre-login | Shared NATs, mobile carriers, IPv6 /64 blocks |
| User id / API key | Authenticated traffic | Rotate keys without resetting the budget |
| Email or account id | Login per account | Combine with IP so you still see distributed attacks |
| Route + IP | Endpoint-specific budgets | Keep windows short |

The production pattern for login is a *combination*: a generous per-IP budget plus a tight per-account budget, so one victim cannot be locked out by an attacker alone (that is lockout DoS - covered in the brute-force lesson).

**Correct 429 semantics.** Respond with \`429 Too Many Requests\`, a \`Retry-After: <seconds>\` header, and optionally the budget: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`. Clients and retry libraries honour Retry-After; without it they guess, and guesses turn into thundering herds.

**Distributed reality.** An in-memory counter is per-process: two API instances each grant the full budget, and a restart forgets everything. Use a shared store (Redis) with atomic \`INCR\` + \`EXPIRE\`, and load-test the limiter itself so it cannot become the bottleneck.

**Fail safe, fail fair.** If the shared store is briefly unavailable, decide deliberately: allow (availability first) or reject (safety first). Document the choice.
    `,
    howItWorks: `
With \`express-rate-limit\`, each request increments a counter for its key inside the window. When the count exceeds the configured maximum, the middleware answers 429 without ever calling your handler - which is exactly what you want for expensive routes.

The Redis-backed variant uses \`INCR key\` followed by \`EXPIRE key window\` on first use, all evaluated atomically. Because every instance talks to the same Redis, the budget is global. The window strategy also matters: a **fixed window** resets abruptly (a burst can still be 2x the limit across a boundary), a **sliding window** smooths it, and a **token bucket** allows controlled bursts while capping the long-run rate.
    `,
    codeExamples: [
      {
        title: "Layered limits: general API plus a strict login budget",
        language: "ts",
        code: `import { rateLimit } from "express-rate-limit";

// generous global budget, keyed by IP, applied to everything
const general = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",   // RateLimit-Limit / -Remaining / -Reset
  legacyHeaders: false,
  message: { error: "RATE_LIMITED" },
});

// tight budget for credential attempts, keyed by IP *and* account
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,       // a correct login does not consume budget
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "unknown";
    return "login:" + req.ip + ":" + crypto.createHash("sha256").update(email).digest("hex").slice(0, 16);
  },
  handler: (req, res) => {
    res.setHeader("Retry-After", String(Math.ceil(15 * 60)));
    res.status(429).json({ error: "TOO_MANY_ATTEMPTS", retryAfterSeconds: 900 });
  },
});

app.use("/api", general);
app.post("/api/login", loginLimiter, loginHandler);`,
        description:
          "skipSuccessfulRequests keeps legitimate users unconstrained while still counting every failure - the budget tracks attacks, not traffic.",
      },
      {
        title: "Manual Redis-backed limiter (the mechanism, simplified)",
        language: "ts",
        code: `async function isRateLimited(redis, key: string, limit: number, windowSec: number) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  if (count > limit) {
    const ttl = await redis.ttl(key); // seconds left in this window
    return { limited: true, retryAfter: ttl > 0 ? ttl : windowSec };
  }
  return { limited: false, remaining: limit - count };
}

// usage inside middleware
const result = await isRateLimited(redis, "rl:login:" + req.ip, 10, 900);
if (result.limited) {
  res.setHeader("Retry-After", String(result.retryAfter));
  return res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
}
next();`,
        description:
          "INCR is atomic across all API instances, which is the whole reason to put the counter in Redis instead of a process Map.",
      },
    ],
    commonMistakes: [
      "Keying everything by IP only, so a whole office (or a mobile carrier NAT) shares one budget and locks out real users.",
      "Forgetting Retry-After, which makes client retry libraries hammer you harder than they would have anyway.",
      "Running a per-process in-memory limiter behind a load balancer and believing the limit is enforced globally.",
    ],
    bestPractices: [
      "Rate limit authentication and token endpoints first; they have the highest attacker value per request.",
      "Combine budgets (IP + account) rather than choosing one key, and exempt successful logins from the account budget.",
      "Expose X-RateLimit-* headers so clients can slow down before they ever see a 429.",
    ],
    realWorldUseCases: [
      "Login, password reset and signup endpoints in p3-ecommerce-platform - the first thing attackers try.",
      "Analytics query endpoints in p3-analytics-api where one heavy scan can cost minutes of database time.",
    ],
    resources: [
      docs("express-rate-limit", OFFICIAL.expressRateLimit, "Configuration reference, keyGenerator, stores and 429 headers.", "en", "12 min"),
      docs("Redis - INCR", OFFICIAL.redisDocs, "Atomic counters that back a distributed limiter.", "en", "5 min"),
      docs(
        "OWASP - Unrestricted Resource Consumption",
        "https://owasp.org/API-Security/editions/2023/en/0xa6-unrestricted-resource-consumption/",
        "The API Security entry that rate limiting directly addresses.",
        "en",
        "8 min",
      ),
      ytSearch("express rate limit tutorial security", "Setting up and load-testing rate limits against local apps.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-rl-login",
        title: "Lock down your login locally",
        prompt:
          "Add a limit of 5 attempts per minute to a local POST /login on 127.0.0.1:3000. Send six wrong passwords with curl and record the status code and every rate-related response header of the sixth attempt. Then send a correct login from a different IP (or a different keyGenerator input) and confirm it still succeeds.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["curl -i shows response headers; look for Retry-After and RateLimit-*.", "Use --interface 127.0.0.2 on systems with extra loopback addresses to simulate another client."],
      },
      {
        id: "ex-p3m3-rl-design",
        title: "Design the budget table",
        prompt:
          "Write a table of at least six endpoints in your project with columns: endpoint, key (IP / user / account), limit, window, what happens on 429. Justify any endpoint you deliberately do not limit, and mark which limits must be shared across instances via Redis.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["GET endpoints that are cached or trivial can share a generous budget; writes and expensive queries cannot."],
      },
    ],
    projectIds: ["p3-chat-app", "p3-analytics-api"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-brute-force-protection",
    slug: "brute-force-protection",
    title: "Brute-Force Protection",
    description:
      "Progressive delays, the lockout DoS trade-off, generic credential errors and CAPTCHA as a last resort rather than a first design.",
    order: 11,
    estimatedMinutes: 18,
    tags: ["brute-force", "authentication", "account-security", "lockout"],
    prerequisites: ["p3m3-rate-limiting-security", "p2m6-account-security"],
    relatedTopics: ["p3m3-rate-limiting-security", "p3m3-safe-logging", "p3m3-owasp-api-security"],
    learningObjectives: [
      "Compare the three standard defences: throttling, progressive delay and lockout",
      "Explain lockout denial-of-service and design around it",
      "Return identical errors for unknown user and wrong password",
      "Decide when CAPTCHA is justified and what it costs users",
    ],
    simpleExplanation:
      "Brute force is guessing credentials until one works - automated now, so thousands of attempts per minute. You defend by making each guess slower and cheaper for the attacker than for the user: rate limits, delays after failures, and only then temporary lockouts. Every defence can itself be turned into an attack against your users if you are not careful.",
    detailedContent: `
**The three levers**

1. **Rate limiting** (previous lesson) - caps attempts per IP and per account in a window. Stops the flood.
2. **Progressive delay** - after N failures, sleep before answering: 1s, 2s, 4s, capped at ~30s. It does not lock anyone out; it just makes a million guesses take a million seconds. Applied per account *and* per IP.
3. **Lockout** - after N failures, refuse further attempts for T minutes. Strongest against an attacker, and the most dangerous for users.

**The lockout DoS trade-off.** If \`/login\` locks an account after five failures, an attacker who knows your email can deliberately lock *you* out at will - a denial of service with zero privileges. Mitigations: short windows (minutes, not hours), unlock on success of a correct password or via an emailed link, count failures per (account, IP) pair rather than per account alone, and prefer progressive delays over hard locks.

**Error messages must not leak existence.** "No account with that email" tells an attacker which emails to target and turns login into an enumeration oracle. Always run the same code path: look up the user; if missing, still \`bcrypt.compare\` against a dummy hash so timing is similar; answer the same generic 401.

**Signals worth logging** (safely - see the logging lesson): attempt count, IP, user agent, outcome. A spike on one account is your alert.

**CAPTCHA** belongs at the end of the ladder: after delays and limits still fail, or from a flagged IP. It protects the endpoint but taxes every legitimate user on mobile, so make it conditional.
    `,
    howItWorks: `
A hardened login handler keeps a failure counter (Redis, with a TTL equal to the lock window). On each attempt it: checks whether the account is currently locked (429 + Retry-After); verifies the password with a constant-shape code path; on failure, \`INCR\` the counter and, past a threshold, \`sleep(2 ** failures seconds)\` capped; on success, \`DEL\` the counter.

Because the delay happens *before* the response, an attacker cannot pipeline guesses at full speed: each request must wait for the previous one. Combined with the per-IP limiter, a distributed attack still burns through its budget quickly even when each individual account stays under the lockout threshold.
    `,
    codeExamples: [
      {
        title: "Login with progressive delay and safe failures",
        language: "ts",
        code: `const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6l7cM0RQ8G1r1r2y2y2y2y2y2y2y"; // compare target

async function login(req, res) {
  const { email, password } = req.body; // assume validated as strings
  const key = "loginfail:" + email.toLowerCase();
  const failures = Number(await redis.get(key) ?? 0);

  if (failures >= 10) {
    const ttl = await redis.ttl(key);
    res.setHeader("Retry-After", String(ttl > 0 ? ttl : 900));
    return res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  // constant shape: always run a compare, even when the user is missing
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  const realSuccess = Boolean(user) && ok;

  if (!realSuccess) {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 900);
    const delay = Math.min(2 ** Math.min(n, 5) * 250, 30_000); // 0.5s .. 8s
    await new Promise((r) => setTimeout(r, delay));
    return res.status(401).json({ error: "BAD_CREDENTIALS" });
  }

  await redis.del(key);
  res.json({ token: issueToken(user.id) });
}`,
        description:
          "The dummy compare keeps 'unknown email' and 'wrong password' indistinguishable; the capped exponential delay slows attackers without ever locking the account.",
      },
    ],
    commonMistakes: [
      "Locking accounts forever on failure, which hands attackers a free denial-of-service lever against your customers.",
      "Returning 404 'user not found' on login - an enumeration oracle that powers credential stuffing lists.",
      "Only limiting by IP: botnets rotate addresses while hammering one account.",
    ],
    bestPractices: [
      "Layer per-IP rate limits, per-account limits and capped progressive delays; reach for lockout only where the risk demands it.",
      "Return one generic 401 for every credential failure and log the detail server-side under a request id.",
      "Offer self-service unlock (email link or re-auth) whenever a lockout is used at all.",
    ],
    realWorldUseCases: [
      "Login and password-reset endpoints in customer-facing apps, where credential stuffing lists are tested continuously.",
      "Admin and API-token endpoints that use long-lived secrets and are therefore high-value brute-force targets.",
    ],
    resources: [
      docs(
        "OWASP Authentication Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
        "Throttling, lockout guidance and generic error rules.",
        "en",
        "15 min",
      ),
      docs("OWASP - Brute Force", "https://owasp.org/www-community/attacks/Brute_force_attack", "Attack patterns and terminology.", "en", "8 min"),
      docs("Redis - EXPIRE", OFFICIAL.redisDocs, "TTLs that turn failure counters into self-clearing lock windows.", "en", "5 min"),
      ytSearch("brute force protection login lockout tradeoff", "Walkthroughs of throttling and lockout implementations.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-bf-enumerate",
        title: "Kill the enumeration oracle",
        prompt:
          "Take a login handler that returns 'user not found' for unknown emails and 'wrong password' otherwise. Demonstrate the leak locally with two curl calls, then rewrite the handler so both cases return an identical status, body and (approximately) identical timing. Paste both responses after the fix.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["Always call bcrypt.compare, using a fixed dummy hash when no user was found."],
        solution: `const DUMMY_HASH = "$2b$10$K7l0u0Nq0Zq0Zq0Zq0Zq0u0Nq0Zq0Zq0Zq0Zq0Zq0Zq0Zq0Zq0Zq0Zq";

app.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").toLowerCase();
  const password = String(req.body.password ?? "");

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: "BAD_CREDENTIALS" });
  }
  res.json({ token: issueToken(user.id) });
});

// after:
// curl -X POST .../login -d '{"email":"nobody@example.com","password":"x"}' -> 401 BAD_CREDENTIALS
// curl -X POST .../login -d '{"email":"real@example.com","password":"x"}' -> 401 BAD_CREDENTIALS
// identical body, identical status - nothing to enumerate`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-bf-ladder",
        title: "Design the defence ladder",
        prompt:
          "For a money-transfer endpoint, write the ladder of controls an attacker meets in order (rate limit, delay, step-up auth, alert), with thresholds and the user impact of each step. Mark the point at which you would accept a CAPTCHA and justify the cost.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["Each step should cost the attacker more than the legitimate user.", "Step-up auth (re-enter password) is often better UX than a lockout."],
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-input-sanitization",
    slug: "input-sanitization",
    title: "Input Validation and Sanitization",
    description:
      "Validate first, sanitize second: schemas that declare types, canonicalization before comparison, rich-text cleaning with DOMPurify-like libraries, and why data must never become code.",
    order: 12,
    estimatedMinutes: 20,
    tags: ["validation", "zod", "sanitization", "canonicalization"],
    prerequisites: ["p3m3-injection-attacks", "p2m5-error-response-formats"],
    relatedTopics: ["p3m3-sql-injection", "p3m3-nosql-injection", "p3m3-xss", "p3m3-secure-file-uploads"],
    learningObjectives: [
      "Order the controls correctly: parse and validate, then sanitise, then store or query",
      "Write a schema that rejects object payloads where scalars are expected",
      "Explain canonicalization and why comparison must happen after normalisation",
      "Choose between rejecting, encoding and sanitising for a given field",
    ],
    simpleExplanation:
      "Validation asks \"is this the shape and range I expect?\" - a string of at most 80 characters, an integer between 1 and 100, an enum value. Sanitization asks \"now that I know the shape, what do I do with dangerous content?\" - strip HTML from a plain-text name, re-encode a rich-text body. Doing them in the wrong order, or skipping validation entirely, is how injection bugs are born.",
    detailedContent: `
**The pipeline, in the only order that works**

1. **Parse** - read the raw body once; reject malformed JSON with 400.
2. **Validate** - a schema (Zod, Joi, or a hand-rolled equivalent) declares types, lengths, ranges and enums. Unknown keys are stripped (\`.strict()\`) or rejected.
3. **Canonicalise** - normalise before any comparison or storage: lowercase emails, NFC-normalise unicode, resolve percent-encoding, trim whitespace.
4. **Sanitise** - only fields that need it: rich text through an HTML sanitizer, filenames through a safe-name function, phone numbers through a pattern.
5. **Use** - pass the *validated object only* to queries, templates and shells. \`req.body\` never reaches a sink again after step 2.

**Validation is the injection fix.** The NoSQL operator payload fails because the schema says \`email: z.string()\`. The SQL payload is inert because it is a value in a placeholder *and* because the schema said string, length <= 254. Escaping is the backstop, not the control.

**Canonicalization subtleties.** \`%2e%2e%2f\` is \`../\` after decoding; browsers and servers may decode a different number of times. Compare paths after decoding *and* normalising, and never assume a single decode is enough for file paths. Case folding matters for emails and filenames on case-insensitive filesystems.

**Rich text is a different contract.** If a field may contain markup, sanitise with a maintained library (DOMPurify with an explicit tag allowlist) on a server-side DOM - never a regex. If it may not, reject angle brackets outright rather than silently stripping them (silent stripping corrupts data and surprises users).
    `,
    howItWorks: `
Schema libraries work by describing the *expected* value and then walking the actual input against that description. Zod's \`parse\` either returns a typed, stripped object or an error tree with per-field issues. Because the description is a closed world - only these keys, only these types - anything else fails by default. That default-closed behaviour is what stops \`{ "$gt": "" }\`, \`{ role: "admin" }\` and 10 MB strings at the same boundary.

Express wiring is then trivial: one \`validate(schema)\` middleware per route that replaces nothing - it *produces* a new \`req.validated\` object which handlers are allowed to touch. Handlers that still reach for \`req.body\` after validation are the ones that reintroduce the bugs.
    `,
    codeExamples: [
      {
        title: "One validation middleware, one trusted object",
        language: "ts",
        code: `import { z } from "zod";

const createReviewSchema = z
  .object({
    productId: z.string().regex(/^prod_[a-z0-9]{10}$/),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(3).max(80),
    body: z.string().max(4000),            // plain text: no markup allowed
  })
  .strict();                                // unknown keys are rejected, not ignored

function validate(schema: z.ZodTypeAny) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: "VALIDATION_ERROR",
        details: result.error.issues.map((i) => ({
          field: i.path.join("."),
          code: i.code,
          message: i.message,
        })),
      });
    }
    req.validated = result.data;            // ONLY this object reaches the handler
    next();
  };
}

app.post("/api/reviews", authenticate, validate(createReviewSchema), async (req, res) => {
  const review = await Review.create({ ...req.validated, authorId: req.user.id });
  res.status(201).json({ data: review });
});`,
        description:
          "The handler never sees req.body, so mass assignment and operator payloads have no path to the database.",
      },
      {
        title: "Canonicalize before you compare",
        language: "ts",
        code: `// emails: case + whitespace must be normalised BEFORE lookup and storage
function canonicalEmail(input: string): string {
  return input.trim().toLowerCase();
}

// file paths: decode, normalise, then reject traversal
import path from "node:path";
function safeUploadName(raw: string): string | null {
  const decoded = decodeURIComponent(raw);          // %2e%2e%2f -> ../
  const normalised = path.posix.normalize(decoded); // collapse .. segments
  if (normalised.startsWith("..") || normalised.includes("/")) return null;
  return normalised;
}

console.log(safeUploadName("..%2f..%2fetc%2fpasswd")); // null
console.log(safeUploadName("holiday-photo.png"));      // "holiday-photo.png"`,
        description:
          "Compare only after canonicalisation - two strings that mean the same thing must become one string before equality checks, hashes or path joins.",
      },
    ],
    commonMistakes: [
      "Sanitising with regexes: HTML has encodings, comments and parser quirks that no 20-line regex will cover.",
      "Validating in the React form only - the server must repeat every rule.",
      "Allowing unknown keys 'for flexibility', which is mass assignment with extra steps.",
    ],
    bestPractices: [
      "Put one schema per route next to the route; validation is part of the contract, not an afterthought.",
      "Use .strict() on write schemas and strip unknown keys deliberately, not by accident.",
      "Canonicalise at the boundary (email, path, unicode) and store the canonical form.",
    ],
    realWorldUseCases: [
      "Every write endpoint in your platform - one shared validate() middleware pays for itself in a week.",
      "Import and file-name handling, where encoded traversal payloads arrive in ordinary-looking names.",
    ],
    resources: [
      docs("Zod", OFFICIAL.zodDocs, "Schema authoring, .strict(), and error trees for 422 responses.", "en", "reference"),
      docs(
        "OWASP Input Validation Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
        "Allowlist-first validation and canonicalisation guidance.",
        "en",
        "12 min",
      ),
      docs("DOMPurify", "https://github.com/cure53/DOMPurify", "The maintained HTML sanitizer to use for rich-text fields.", "en", "8 min"),
      ytSearch("zod validation express tutorial", "Practical schema validation walkthroughs for Express APIs.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-val-schema",
        title: "Close the schema",
        prompt:
          "Write a strict Zod schema for PATCH /api/profile accepting displayName (3-60 chars, trimmed), timezone (string max 60) and locale (enum of three values). Verify locally that each of these is rejected with 422: {\"role\":\"admin\"}, {\"displayName\":\"<img>\"}, {\"displayName\":\"x\".repeat(500)} and a body containing an extra key. Paste one rejection response.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [".strict() is what rejects unknown keys such as role.", "Use .trim() in the schema so the stored value is already canonical."],
        solution: `const profileSchema = z
  .object({
    displayName: z.string().trim().min(3).max(60),
    timezone: z.string().max(60),
    locale: z.enum(["en", "ar", "fr"]),
  })
  .strict();

// {"role":"admin"}            -> 422 (unrecognized key)
// {"displayName":"<img>"}     -> 422 (contains markup is ALLOWED as text here;
//                                 if this field must be plain text, add
//                                 .refine((v) => !/[<>]/.test(v), "plain text only"))
// {"displayName":"x"*500}     -> 422 (too long)
// {"displayName":"Amina","timezone":"Europe/Paris","locale":"en","isAdmin":true}
//                             -> 422 (strict() rejects isAdmin)`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-val-order",
        title: "Fix the order",
        prompt:
          "Find one place in your code where sanitization happens without validation (or where validation happens after a database call). Rewrite it so parse -> validate -> canonicalise -> sanitise -> use happens in that order, and note what became impossible to inject afterwards.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["A database call before validation means the sink already saw raw input."],
      },
    ],
    projectIds: ["p3-chat-app", "p3-booking-platform"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-secrets-management",
    slug: "secrets-management",
    title: "Secrets Management",
    description:
      "Environment variables versus secret managers, rotation, least-privilege scoping, pre-commit scanning and the rules for what must never be logged.",
    order: 13,
    estimatedMinutes: 20,
    tags: ["secrets", "environment", "rotation", "git-hygiene"],
    prerequisites: ["p3m1-config-secrets-management"],
    relatedTopics: ["p3m3-safe-logging", "p3m3-dependency-auditing", "p3m3-security-testing"],
    learningObjectives: [
      "Classify configuration into defaults, configuration and secrets",
      "Move from committed .env files to injected secrets with rotation",
      "Apply scoping: one credential per service, least privilege, short lifetimes",
      "Catch leaks before they reach the remote with pre-commit scanning",
    ],
    simpleExplanation:
      "A secret is any value that grants access: database URLs with passwords, API keys, JWT signing keys, TLS private keys. They must never live in git, never be printed to logs, and should be injected at runtime from the environment or a secret manager so you can rotate them without a redeploy of source code.",
    detailedContent: `
**Three kinds of configuration**

- **Defaults** - retry counts, page sizes. Commit them.
- **Configuration** - feature flags, timeouts, non-secret URLs. Commit them, or read from env.
- **Secrets** - anything that authenticates. Never commit, never log, never return in an API response.

**From .env to a secret manager.** A committed \`.env\` is one careless \`git add .\` away from permanent history. A local \`.env\` that is git-ignored and loaded with \`dotenv\` is fine for development *if* the values are development-only. Production should inject secrets at start time from your platform's store (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Doppler, SOPS + age, or Kubernetes Secrets), fetched either before boot or on demand with caching.

**Rotation is the feature that matters.** A secret you cannot rotate is a liability you carry forever. Design for rotation: read the signing key from env, keep two keys valid during a JWT rotation window, and use short-lived credentials (OIDC / workload identity) where the platform offers them.

**Scoping.** One database role per service, one API key per integration, read-only keys for reporting jobs. If a key leaks, the blast radius is that one service, not the fleet.

**Leak prevention.** Run a scanner (gitleaks, truffleHog, your platform's secret scanning) as a pre-commit hook *and* in CI, so a key that slips through locally still fails the pipeline. Treat any key that ever touched a repository as compromised: rotate, then purge history if needed.

**Never log:** passwords, tokens, cookie headers, \`Authorization\`, private keys, connection strings, reset codes, full payment PANs.
    `,
    howItWorks: `
At boot, a hardened app validates that every required secret is present (fail fast with a clear list of missing names, never with values), then builds typed config:

    const config = {
      jwtSecret: required("JWT_SECRET"),
      databaseUrl: required("DATABASE_URL"),
    };

The process receives secrets through its environment, which your platform populates from the secret store at deploy time. Because the app reads by *name*, rotation is a matter of updating the stored value and restarting - no code change, no commit. For high-value keys, prefer fetching the value at runtime with a cache and a short TTL so rotation does not require a restart at all.

Scanners work by entropy plus known prefixes (\`sk_live_\`, \`AKIA\`, \`ghp_\`, PEM headers). They cannot know your custom formats, so add your own patterns for internal key shapes.
    `,
    codeExamples: [
      {
        title: "Fail-fast config that never echoes values",
        language: "ts",
        code: `function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // list the NAME only - never the value, never a partial value
    throw new Error("Missing required environment variable: " + name);
  }
  return value;
}

export const config = Object.freeze({
  jwtSecret: required("JWT_SECRET"),
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "", // optional integration
});

// startup guard: crash with the missing NAMES if the platform misconfigured us
try {
  void config;
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}`,
        description:
          "Compare with the anti-pattern: JSON.stringify(process.env) in a debug route, which dumps every secret at once.",
      },
      {
        title: "A gitleaks pre-commit hook and CI check",
        language: "bash",
        code: `# local: block the commit if a secret pattern is found
gitleaks detect --staged --verbose

# ci: scan the whole history of the pull request
gitleaks detect --redact --report-format sarif --report-path gitleaks.sarif

# never do any of these:
#   git add .env
#   echo "DATABASE_URL=..." >> config.txt
#   console.log(process.env)            # full dump
#   console.log("auth:", req.headers.authorization)`,
        description:
          "--redact keeps the scanner output itself free of secrets, so CI logs stay clean.",
      },
    ],
    commonMistakes: [
      "Committing .env because it is 'just the local one' - history is forever, and production keys often ride along.",
      "Logging process.env on startup for debugging, which prints every secret into your log aggregator.",
      "Using one shared admin database password for every service so that any compromise reaches everything.",
    ],
    bestPractices: [
      "Fail boot when a required secret is missing; list names only, never values or prefixes.",
      "Rotate on a schedule and after any personnel or vendor change; treat repo exposure as an automatic rotation event.",
      "Scan with gitleaks locally and in CI, and enable your git host's built-in secret scanning.",
    ],
    realWorldUseCases: [
      "Multi-service platforms (p3-job-processing, p3-capstone) where each worker gets its own scoped queue credential.",
      "Any team that has ever rotated a key by search-and-replace across three repositories - a secret manager ends that pain.",
    ],
    resources: [
      docs(
        "OWASP Secrets Management Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
        "Storage, rotation, scoping and access control for secrets.",
        "en",
        "15 min",
      ),
      docs("The Twelve-Factor App - Config", OFFICIAL.twelveFactor, "Store config in the environment, keep credentials out of the codebase.", "en", "5 min"),
      docs("gitleaks", "https://github.com/gitleaks/gitleaks", "Open-source secret scanner for pre-commit hooks and CI.", "en", "5 min"),
      ytSearch("managing secrets in nodejs environment variables", "Practical patterns for env-based secrets and rotation.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-secrets-audit",
        title: "Audit your repository",
        prompt:
          "Run a secret scanner over your project (or simply search for common prefixes: sk_, ghp_, AKIA, xox, postgres://user:pass). Record every hit, classify it as real secret / test value / false positive, and rotate anything real. Then add a pre-commit hook and paste its output on a staged file containing a fake AWS key.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: ["git log --all -S 'AKIA' finds historical occurrences, not just the current tree."],
      },
      {
        id: "ex-p3m3-secrets-rotate",
        title: "Design a rotation",
        prompt:
          "Pick one secret in your stack (JWT signing key, database password, third-party API key) and write the rotation runbook: how many environments are affected, how you keep old and new values valid during the window, who must be notified, and how you verify the old value is dead afterwards.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["JWT rotation usually means accepting both keys for one window while signing with the new one."],
      },
    ],
    projectIds: ["p3-capstone", "p3-job-processing"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-dependency-auditing",
    slug: "dependency-auditing",
    title: "Dependency Auditing and Supply Chain",
    description:
      "npm audit, lockfile integrity, typosquatting, provenance, pinning and automated update bots - treating every dependency as code you chose to run.",
    order: 14,
    estimatedMinutes: 20,
    tags: ["dependencies", "supply-chain", "npm-audit", "ci"],
    prerequisites: ["p2m7-ci-fundamentals", "p3m3-secrets-management"],
    relatedTopics: ["p3m3-security-testing", "p3m3-secrets-management", "p3m3-safe-logging"],
    learningObjectives: [
      "Run and interpret npm audit, including what severity and fixability mean",
      "Explain why the lockfile is a security control and how integrity hashes verify it",
      "Recognise typosquatting and dependency-confusion patterns",
      "Set up Renovate or Dependabot with sensible grouping and review rules",
    ],
    simpleExplanation:
      "Every npm package you install is code you have decided to run with your privileges. Most packages are fine; some contain vulnerabilities, and a small number are deliberately malicious. Dependency auditing means knowing what you installed, checking it for known issues, and controlling how it changes over time.",
    detailedContent: `
**The audit itself**

- \`npm audit\` compares your lockfile against the GitHub Advisory Database and reports vulnerabilities with severity (low / moderate / high / critical) and a fix range.
- \`npm audit fix\` applies semver-compatible updates; \`npm audit fix --force\` may cross majors - treat that as a normal upgrade, not a patch.
- Snyk, Socket and your git host's dependency graph add reachability analysis: a vulnerable function your code never calls is a different risk from one it calls on every request.

**The lockfile is a control.** \`package-lock.json\` pins the exact version *and* an \`integrity\` hash for every tarball. CI must install with \`npm ci\` (fails if the lockfile is missing or out of sync) rather than \`npm install\` (may silently resolve newer versions).

**Attack patterns to know**

- **Typosquatting** - \`expresss\`, \`lodahs\`, \`crossenv\`: near-miss names that people install by accident.
- **Dependency confusion** - an internal package name that is also claimed publicly; if your registry order is wrong, the public malicious package wins.
- **Compromised maintainer** - a legitimate package whose new version ships a postinstall payload. Pinning exact versions and reviewing diffs of major updates narrows the window.

**Practices that compound**

1. Keep the dependency count low; every package is attack surface and upgrade work.
2. Pin exact versions for anything critical, or use \`overrides\` to force a safe transitive version.
3. Enable npm provenance where available, and prefer packages that publish it.
4. Run \`npm audit --audit-level=high\` in CI as a gate, and let Renovate/Dependabot open PRs so updates are reviewed like any other change.
5. Review \`postinstall\` scripts of new dependencies; \`npm ci --ignore-scripts\` in CI is a hardening option.
    `,
    howItWorks: `
\`npm audit\` builds a dependency tree from the lockfile, then queries the advisory database with the name and version ranges of every package. The response contains vulnerable ranges; npm marks each finding as *fixable* (a compatible upgrade exists) or not. That distinction drives your triage: fixable highs are today's work; unfixable ones need a mitigation (override, replacement, or a documented risk acceptance with an expiry).

Renovate or Dependabot watch the same metadata: when a new release or advisory appears, they open a PR that bumps the lockfile, CI runs, and a human reviews. This is what keeps the audit clean *over time* rather than in a panic the week before launch.
    `,
    codeExamples: [
      {
        title: "Audit, gate and update in CI",
        language: "yaml",
        code: `# .github/workflows/security.yml (excerpt)
jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci                       # fails if lockfile is out of sync
      - run: npm audit --audit-level=high # non-zero exit fails the build
      - run: npm ls --all > dependency-tree.txt`,
        description:
          "audit-level=high keeps the gate actionable: low/moderate findings are tracked but do not block every merge.",
      },
      {
        title: "Reading an audit report and fixing deliberately",
        language: "bash",
        code: `npm audit

# npm audit report
#  cookie  0.4.0 - 0.6.0
#  Severity: moderate
#  ...
#  fix available via npm audit fix

npm audit fix                 # semver-compatible bumps only
npm audit fix --force         # may bump majors - review the diff!
npm install express@4.21.2    # pin a specific safe version
npm ls express                # who pulled this package in, and at what version`,
        description:
          "Run this against your own project only. Note that npm audit fix --force can silently change behaviour: it is an upgrade, not a patch.",
      },
    ],
    commonMistakes: [
      "Committing node_modules or disabling lockfiles, which makes every install a different (possibly vulnerable) build.",
      "Ignoring moderate advisories for months because they do not block the pipeline - they are exactly what attackers wait for.",
      "Adding a package with a familiar-looking name without checking the publisher and download counts.",
    ],
    bestPractices: [
      "Install with npm ci in CI and anywhere reproducibility matters.",
      "Keep a bot (Renovate or Dependabot) opening update PRs weekly; review major diffs by eye.",
      "Minimise dependencies and document the critical ones so their releases get attention.",
    ],
    realWorldUseCases: [
      "The event-stream and colors.js compromises showed how a routine dependency update becomes an incident.",
      "Enterprise apps with hundreds of transitive packages: the audit gate is the only thing that keeps the list honest.",
    ],
    resources: [
      docs("npm - Auditing vulnerabilities", OFFICIAL.npmDocs, "Official documentation for npm audit and remediation options.", "en", "10 min"),
      docs("GitHub Advisory Database", "https://github.com/advisories", "The database behind npm audit; each entry lists affected ranges and patches.", "en", "reference"),
      docs("Snyk - Open Source Vulnerabilities", "https://security.snyk.io/", "Reachability-aware scanning and fix PRs.", "en", "8 min"),
      docs("Renovate", "https://docs.renovatebot.com/", "Automated dependency update PRs with grouping rules.", "en", "reference"),
    ],
    exercises: [
      {
        id: "ex-p3m3-dep-audit",
        title: "Triage a real report",
        prompt:
          "Run npm audit (or equivalent) in your project. For the top three findings write: package, severity, vulnerable range, whether a fix exists, whether your code actually calls the vulnerable API, and your decision (fix now / schedule / accept with expiry). Paste the command output you triaged from.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["npm ls <package> shows which parent pulled it in - sometimes the fix is bumping the parent."],
      },
      {
        id: "ex-p3m3-dep-lockfile",
        title: "Prove the lockfile matters",
        prompt:
          "In a scratch project, install a package, commit the lockfile, then delete node_modules and reinstall twice while a newer patch release exists. Observe whether npm ci and npm install resolve the same version. Write two sentences on what an attacker gains if CI uses npm install without a lockfile.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["npm ci installs exactly what the lockfile says; npm install may re-resolve."],
      },
    ],
    projectIds: ["p3-capstone", "p3-job-processing"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-secure-file-uploads",
    slug: "secure-file-uploads",
    title: "Secure File Uploads",
    description:
      "Type sniffing versus extensions, random stored names, storage outside the web root, size limits, image re-encoding and path traversal in filenames.",
    order: 15,
    estimatedMinutes: 22,
    tags: ["file-uploads", "multer", "path-traversal", "storage"],
    prerequisites: ["p2m5-request-size-limits", "p3m3-input-sanitization"],
    relatedTopics: ["p3m3-ssrf", "p3m3-xss", "p3m3-safe-logging"],
    learningObjectives: [
      "List the six controls every upload endpoint needs before it touches disk",
      "Explain why the declared Content-Type and the file extension are both attacker-controlled",
      "Store uploads with random names outside the web root and serve them safely",
      "Block path traversal and polyglot files with validation plus re-encoding",
    ],
    simpleExplanation:
      "An upload endpoint is a hole you deliberately punch through your perimeter: arbitrary bytes from anyone, written to your disk. If you trust the filename, the content type or the extension, an attacker can store a script, overwrite a config file, or smuggle a polyglot that is both a JPEG and a page that executes JavaScript.",
    detailedContent: `
**The six controls**

1. **Authenticate and authorise** the upload; cap uploads per user (see rate limiting).
2. **Size limits** at every layer: reverse proxy (\`client_max_body_size\`), Express (\`express.json({ limit })\`), and Multer's \`limits.fileSize\`. Reject with 413 before buffering everything into memory.
3. **Validate the real content type.** \`Content-Type\` and the extension are both attacker-chosen. Check the magic bytes (file signature) with a library such as \`file-type\`, and only for the types you accept.
4. **Re-encode images** with \`sharp\` when possible. Re-encoding destroys embedded payloads (EXIF scripts, polyglots) and produces a known-good file.
5. **Randomise the stored name.** Generate a UUID server-side; never use the client's filename. Keep the original name only as sanitised metadata.
6. **Store outside the web root**, or better, in object storage on a separate origin. Serve through an endpoint that sets \`Content-Disposition: attachment\` (or a safe \`Content-Type\` plus \`nosniff\`) so a stored HTML/SVG payload can never execute in your origin.

**Path traversal** rides on the filename: \`../../.env\`, \`..%2f..%2fapp.js\`. \`path.basename\` plus an allowlist of characters, or simply ignoring the client name entirely, removes the class. Also refuse symlinks when reading uploads back.

**SVG and HTML are not images** for security purposes - they are documents. If you must accept SVG, sanitise it like rich text or serve it from a sandbox origin as a download.
    `,
    howItWorks: `
With Multer, a disk storage engine receives the file stream, enforces \`fileSize\`, and writes to a destination directory. Your \`fileFilter\` runs first and can reject by mimetype - but remember that mimetype came from the client. The hardened flow adds a post-upload sniff: read the first few kilobytes, detect the true type with \`file-type\`, and if it does not match the allowlist, delete the file and answer 415.

Serving is the other half of the story. A file written to \`public/uploads/x.png\` is reachable at \`/uploads/x.png\` and, if a bad file slips through, it executes in your origin. Writing to \`/var/data/uploads/<uuid>\` and streaming it through a handler that forces \`Content-Type: application/octet-stream\` plus \`Content-Disposition: attachment\` means even a malicious file is inert bytes until the user saves it.
    `,
    codeExamples: [
      {
        title: "A hardened Multer upload route",
        language: "ts",
        code: `import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { fileTypeFromFile } from "file-type";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: "/var/data/uploads",            // NOT inside public/
    filename: (_req, _file, cb) => {
      cb(null, crypto.randomUUID() + ".upload"); // random name, ignore client name
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error("UNSUPPORTED_TYPE"));
    cb(null, true);
  },
});

app.post("/api/avatars", authenticate, upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "NO_FILE" });

  const detected = await fileTypeFromFile(file.path);
  if (!detected || !ALLOWED.has(detected.mime)) {
    await fs.promises.unlink(file.path);          // delete impostors immediately
    return res.status(415).json({ error: "FILE_TYPE_MISMATCH" });
  }

  const finalName = crypto.randomUUID() + "." + detected.ext;
  await fs.promises.rename(file.path, "/var/data/uploads/" + finalName);
  res.status(201).json({ data: { url: "/files/" + finalName } });
});

// serving: never point the static root at the upload directory
app.get("/files/:name", (req, res) => {
  const name = path.basename(req.params.name);   // strips any traversal
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "attachment; filename=\\"" + name + "\\"");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile("/var/data/uploads/" + name);
});`,
        description:
          "Magic-byte detection after storage catches polyglots that the mimetype filter missed; the random name and attachment serving keep anything hostile inert.",
      },
      {
        title: "Path traversal, safely demonstrated",
        language: "bash",
        code: `# what an attacker tries (against YOUR local test server only)
curl -i -F "file=@./notes.txt;filename=../../.env" http://127.0.0.1:3000/api/uploads

# multer writes to a fixed destination with a generated name, so the
# ../../ in the filename never reaches the filesystem - it is metadata only.

# the naive version that IS vulnerable:
#   fs.writeFile(uploadsDir + "/" + file.originalname, buffer)
# payload filename: ../../.env  -> overwrites your environment file`,
        description:
          "Run only against your own loopback server with throwaway data. The fix is structural: never concatenate a client filename into a path.",
      },
    ],
    commonMistakes: [
      "Trusting file.originalname or the client Content-Type instead of sniffing the bytes.",
      "Serving the upload directory with express.static so a stored .html or .svg executes in your origin.",
      "Limiting only in Multer while the reverse proxy happily accepts a gigabyte body first.",
    ],
    bestPractices: [
      "Random server-generated names, storage outside the web root, served through a controlled handler.",
      "Re-encode images with sharp; treat SVG, HTML and JS as documents, not images.",
      "Validate type by magic bytes, enforce size at proxy + framework + storage, and rate-limit per user.",
    ],
    realWorldUseCases: [
      "Avatar and product-image uploads in p3-ecommerce-platform - high volume, user-controlled, and publicly served.",
      "Attachment uploads in chat (p3-chat-app) where one malicious file reaches another user's device.",
    ],
    resources: [
      docs(
        "OWASP File Upload Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html",
        "The checklist this lesson is built from, with attack examples.",
        "en",
        "12 min",
      ),
      docs("Multer", OFFICIAL.multerDocs, "Disk/memory storage, limits and fileFilter configuration.", "en", "10 min"),
      docs("sharp", "https://sharp.pixelplumbing.com/", "Image re-encoding that strips embedded payloads.", "en", "8 min"),
      ytSearch("secure file upload nodejs express multer", "Local demos of upload attacks and hardened implementations.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-upload-traversal",
        title: "Attempt traversal on your own server",
        prompt:
          "Build the naive upload route (uploadsDir + originalname) on 127.0.0.1:3000 with a throwaway directory. Upload a file named ../escape.txt and show where it landed. Then switch to the hardened route from this lesson, repeat the identical curl, and paste both outcomes.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: ["Use curl -F 'file=@./notes.txt;filename=../escape.txt'.", "Multer's filename callback is what removes the client's control."],
        solution: `// naive (do not ship)
app.post("/api/uploads", upload.single("file"), (req, res) => {
  fs.writeFileSync(uploadsDir + "/" + req.file.originalname, req.file.buffer);
  res.json({ ok: true });
});
// curl -F "file=@notes.txt;filename=../escape.txt" -> writes escape.txt one level UP

// hardened
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_r, _f, cb) => cb(null, crypto.randomUUID() + ".upload"),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// same curl -> file lands as a random name inside uploadsDir; ../ is inert`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-upload-polyglot",
        title: "Think about polyglots",
        prompt:
          "Explain in a short paragraph how a file can be a valid PNG and still carry an HTML payload, and list the two independent controls from this lesson that neutralise it when the file is later served. No tooling required - reasoning only.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: ["Browsers may sniff content despite extensions.", "Re-encoding produces new bytes; attachment disposition stops rendering."],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-chat-app"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-safe-logging",
    slug: "safe-logging",
    title: "Safe Logging",
    description:
      "Never log tokens, passwords or PII: redaction at the logger level, structured logs as attack evidence, and retention that respects privacy rules.",
    order: 16,
    estimatedMinutes: 18,
    tags: ["logging", "redaction", "pii", "observability"],
    prerequisites: ["p2m2-middleware", "p3m3-secrets-management"],
    relatedTopics: ["p3m3-brute-force-protection", "p3m3-secrets-management", "p3m3-threat-modeling"],
    learningObjectives: [
      "Identify the fields that must never appear in a log line",
      "Implement redaction centrally in the logger instead of ad hoc per call site",
      "Use structured logs as evidence during an incident without leaking data",
      "Balance debugging detail with retention and access controls",
    ],
    simpleExplanation:
      "Logs outlive the request: they are shipped to a third party, kept for months, and readable by everyone with dashboard access. Anything you log is therefore disclosed - passwords, session tokens, card fragments, private messages. Safe logging means deciding once, centrally, what may be logged, and redacting everything else automatically.",
    detailedContent: `
**The deny list (never log these)**

- Passwords, password hashes, \`Authorization\` headers, cookie headers, API keys, JWTs.
- Reset codes, OTPs, magic links, session ids that can be replayed.
- Full request bodies of payment or health endpoints; PANs; national ids.
- PII you have no lawful basis to retain (emails, phone numbers) unless masked.

**Redaction belongs in the logger.** Ask every call site to remember and you will eventually forget. Configure one place:

    logger.info({ userId, eventId, path }, "request completed");

with a serializer that allowlists the fields it will emit, plus a scrubber that replaces anything matching \`authorization|cookie|password|token|secret\` with \`[REDACTED]\`. Allowlist beats denylist: unknown keys are dropped rather than passed through.

**Structured logs are evidence.** During an incident you will be asked: which IP hit \`/login\` 500 times, with which user agent, and did any succeed? That answer exists only if you log \`requestId\`, \`userId\` (when known), route, status, duration, outcome and source IP in a queryable format - and *not* the credentials that caused it.

**Retention and access.** Logs containing even masked identifiers are personal data under GDPR-style rules: define retention (days, not forever), restrict who can read raw logs, and prefer counters/metrics over raw payloads for long-term storage.

**Debugging without leaking.** Log the *shape* (keys, sizes, types) rather than the value when inspecting untrusted input: \`bodyKeys=["email","password"] passwordLength=12\`.
    `,
    howItWorks: `
A structured logger (pino, Winston) accepts an object plus a message and serialises them into JSON, one line per event. Before writing, pino runs *serializers* for known keys (\`req\`, \`res\`, \`err\`) - this is the natural hook for redaction: \`redact: { paths: ["req.headers.authorization", "*.password"], censor: "[REDACTED]" }\`.

Request middleware then attaches a \`requestId\` (from the \`x-request-id\` header or a fresh uuid) to every log line for that request. Downstream services echo it, so one user action that fans out across API, queue and worker can be reconstructed as a single trace without logging any secret along the way.
    `,
    codeExamples: [
      {
        title: "Pino with redaction and allowlisted request logs",
        language: "ts",
        code: `import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "body.cardNumber",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    req(req) {
      return {
        id: req.headers["x-request-id"],
        method: req.method,
        path: req.url.split("?")[0],   // never the query string: it can carry tokens
        userId: req.user?.id,          // may be undefined pre-auth
      };
    },
  },
});

// usage: log decisions and outcomes, not payloads
app.post("/api/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email ?? "").toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(String(req.body.password), user.passwordHash));

  logger.info({ event: "login_attempt", emailHash: sha256(email), ok }, "login");
  //                                     ^^^^ masked identifier, not the raw email

  if (!ok) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  res.json({ token: issueToken(user.id) });
});`,
        description:
          "Hashing the email before logging keeps the line useful for counting attempts per account without storing the address itself.",
      },
      {
        title: "What an incident query looks like afterwards",
        language: "text",
        code: `# during a credential-stuffing event you want this to work:
#   SELECT count(*) FROM logs
#    WHERE event = 'login_attempt' AND ok = false
#      AND ts > now() - interval '1 hour'
#    GROUP BY email_hash ORDER BY count DESC LIMIT 10;

# and it must be impossible to run:
#   SELECT req.headers.authorization FROM logs ...
# because that field was redacted at write time, not at read time.`,
        description:
          "Redaction at write time is the only kind that protects data you cannot take back from a log aggregator.",
      },
    ],
    commonMistakes: [
      "console.log(req) in a catch block - dumps headers, cookies and body into stdout with no redaction.",
      "Logging full URLs including query strings, which routinely carry tokens, codes and search terms with PII.",
      "Keeping logs forever 'just in case', which multiplies the blast radius of every later access or breach.",
    ],
    bestPractices: [
      "Configure redaction once in the logger factory; forbid raw console.log in lint rules.",
      "Log events and decisions (login_attempt, permission_denied) rather than full request bodies.",
      "Define retention, restrict raw-log access, and prefer hashed or masked identifiers for PII.",
    ],
    realWorldUseCases: [
      "Security investigations: your only evidence during a breach attempt is what you logged before it happened.",
      "Compliance reviews (GDPR, PCI): demonstrating that tokens and card data never reach the log pipeline.",
    ],
    resources: [
      docs(
        "OWASP Logging Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html",
        "What to log, what never to log, and event data guidelines.",
        "en",
        "12 min",
      ),
      docs("pino - redact option", "https://getpino.io/", "Built-in redaction paths and serializers for Express apps.", "en", "8 min"),
      docs("MDN - Data minimisation (GDPR context)", "https://gdpr-info.eu/art-5-gdpr/", "Legal basis for logging identifiers: minimise, purpose-limit, retain briefly.", "en", "8 min"),
      ytSearch("structured logging nodejs pino redaction", "Practical logging setups with redaction for Express.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-log-sweep",
        title: "Sweep your log statements",
        prompt:
          "List every console.log, logger.* and res.json(error) in your project. Mark each as safe, needs-redaction or leaks-secret. Fix the three worst offenders by moving them onto the redacting logger, and paste one before/after line showing what no longer appears.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["Search for 'console.log(req' and 'JSON.stringify(req' first - those dump everything."],
      },
      {
        id: "ex-p3m3-log-evidence",
        title: "Write the incident query",
        prompt:
          "Given structured logs with fields {ts, requestId, event, route, status, ip, userId, ok}, write the three queries (SQL or log-search syntax) you would run to answer: how many failed logins per account in the last hour, which IPs hit them, and whether any attempt succeeded. Then state which field you deliberately did NOT need.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["Group by account identifier, not by raw email.", "The password is never needed to answer any of the three questions."],
      },
    ],
    projectIds: ["p3-job-processing", "p3-capstone"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-threat-modeling",
    slug: "threat-modeling",
    title: "Threat Modeling",
    description:
      "STRIDE-lite, data flow diagrams, the 'what can go wrong' workshop and ranking risk as likelihood times impact before you write the fix.",
    order: 17,
    estimatedMinutes: 22,
    tags: ["threat-modeling", "stride", "risk", "design"],
    prerequisites: ["p3m1-layered-architecture", "p3m1-separation-of-concerns", "p3m3-owasp-api-security"],
    relatedTopics: ["p3m3-security-testing", "p3m3-broken-access-control", "p3m3-secrets-management"],
    learningObjectives: [
      "Draw a one-page data flow diagram for a feature: components, data stores, trust boundaries",
      "Apply STRIDE-lite to each element and boundary to generate threats",
      "Score risk as likelihood x impact and order a backlog from that score",
      "Run a 60-minute workshop that produces actionable items, not a wall of sticky notes",
    ],
    simpleExplanation:
      "Threat modeling is a structured way to ask \"what can go wrong here?\" before attackers ask it for you. You draw where data flows, look at each hop through six lenses (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege), and turn the answers into prioritised work items.",
    detailedContent: `
**Why bother.** A vulnerability found in design costs a conversation. The same one found in production costs an incident response. Threat modeling is the cheapest security activity per hour - provided it stays small and concrete.

**The four questions (adapted from Adam Shostack's model):**

1. **What are we working on?** Draw a simple DFD: external entities (browser, mobile app, payment provider), processes (API, worker), data stores (Postgres, Redis, S3), and the data flows between them. Mark **trust boundaries** - places where data crosses into a less trusted zone (Internet -> API, API -> third party).
2. **What can go wrong?** Walk each element and boundary with **STRIDE-lite**:
   - **S**poofing - can something pretend to be this caller? (auth)
   - **T**ampering - can data be modified in transit or at rest? (integrity)
   - **R**epudiation - can a user deny an action with no evidence? (audit logs)
   - **I**nformation disclosure - what leaks here? (authorization, logging)
   - **D**enial of service - what makes this fall over? (rate limits, timeouts)
   - **E**levation of privilege - what lets a caller do more? (roles, mass assignment)
3. **What are we going to do?** For each threat, choose: fix now, mitigate, transfer (insurance/third party), or accept with an owner and an expiry date.
4. **Did we do a good job?** Track items to completion; re-run the model when the architecture changes.

**Scoring.** Risk = likelihood x impact, each 1–5. A BOLA on a payments endpoint (low likelihood, high impact) still outranks a verbose error message (high likelihood, low impact). Numbers do not have to be precise - they have to be *argued*, because the argument is where the shared understanding appears.
    `,
    howItWorks: `
A workshop takes 60–90 minutes with 3–6 people (backend, frontend, ops, someone who can say no). Start with one feature, not the whole system. Draw the DFD together for ten minutes; if you cannot draw it, that itself is a finding.

For threats, use the STRIDE prompts as questions in round-robin: "where does this request come from?", "what if this field is changed in transit?", "how would we prove this happened?". Capture each threat as a card: threat, element, existing control, proposed action, owner.

Close by ranking the cards and committing to the top three. Revisit at the next design review. The model is a living sketch in a repo (a mermaid diagram in the feature's README is enough), not a document that is finished and forgotten.
    `,
    codeExamples: [
      {
        title: "A one-page DFD in mermaid for a checkout flow",
        language: "markdown",
        code: `\`\`\`mermaid
flowchart LR
  Browser -->|POST /checkout (TLS)| API
  API -->|SQL| Postgres[(Postgres)]
  API -->|charge request| Stripe[(Stripe)]
  API -->|enqueue| Redis[(Redis)]
  Worker[(Worker)] -->|dequeue| Redis
  Worker -->|email| SendGrid[(SendGrid)]

  boundary Internet { Browser }
  boundary ThirdParty { Stripe SendGrid }
\`\`\`

# trust boundaries worth flagging:
#   Internet -> API      (untrusted input, needs auth + validation)
#   API -> Stripe        (outbound fetch: SSRF? secrets? timeouts?)
#   API -> Redis queue   (poison messages, unserialised payloads)`,
        description:
          "One page, three boundaries, and already five STRIDE questions you can ask about specific arrows.",
      },
      {
        title: "Threat cards from a STRIDE-lite pass",
        language: "text",
        code: `ELEMENT: GET /api/invoices/:id  (Internet -> API -> Postgres)
  S - token accepted from wrong source?        control: Bearer only, verify sig
  T  - invoice altered in transit?             control: TLS at the proxy
  R  - user denies they viewed it?             control: access log with requestId
  I  - other users' invoices readable?  **    control: MISSING ownership filter
  D  - id enumeration floods DB?               control: per-user rate limit (ok)
  E  - can a user cancel someone's invoice?    control: policy check (present)

RISK SCORE for the I finding: likelihood 4 x impact 5 = 20 -> fix this sprint.
NOTE the D finding scores lower but rides on the same fix (scoped query).`,
        description:
          "This is the entire output of a good session for one endpoint: six answers, one ranked item, and a concrete fix owner.",
      },
    ],
    commonMistakes: [
      "Modeling the whole platform at once - the session produces 100 vague threats and zero fixes.",
      "Skipping trust boundaries, which are where almost every interesting threat actually lives.",
      "Stopping at the list: without owners and dates, threat modeling is theatre.",
    ],
    bestPractices: [
      "Model one feature per session, 60 minutes, with a facilitator who is not the feature's author.",
      "Record threats as cards in the repo next to the code so future changes re-trigger the review.",
      "Re-run the model whenever a new external dependency, data store or auth flow appears.",
    ],
    realWorldUseCases: [
      "Before launching p3-capstone: a single session on the payment and booking flows surfaces the BOLA and SSRF items while they are still cheap.",
      "Quarterly reviews of multi-tenant features where a new join filter can silently break tenant isolation.",
    ],
    resources: [
      docs("OWASP - Threat Modeling", "https://owasp.org/www-community/Threat_Modeling", "Community process descriptions and tooling.", "en", "10 min"),
      docs("Microsoft - Threat Modeling", "https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling", "STRIDE and DFD guidance with worked examples.", "en", "15 min"),
      docs("OWASP - Cornucopia cards", "https://owasp.org/www-project-cornucopia/", "Card deck that turns the STRIDE questions into a facilitated game.", "en", "reference"),
      ytSearch("threat modeling stride for developers", "Facilitated workshop walkthroughs you can copy.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-tm-one-feature",
        title: "Model one feature end to end",
        prompt:
          "Pick a single feature of your project (password reset, file upload, or booking creation). Draw the DFD, mark trust boundaries, run STRIDE-lite, and produce a table of at least six threats with a risk score each. Finish with the top three actions and an owner for each.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: ["If the diagram takes more than one page, the feature is too big - split it.", "Every data store is a possible information-disclosure element; ask what is in it."],
      },
      {
        id: "ex-p3m3-tm-workshop",
        title: "Facilitate a 60-minute session",
        prompt:
          "Run a short threat-modeling session with at least one other person on a feature neither of you wrote. Keep the agenda: 10 min DFD, 30 min threats, 15 min ranking, 5 min owners. Afterwards, write a retro: which prompt produced the best finding, and where did you lose time?",
        difficulty: "advanced",
        estimatedMinutes: 75,
        hints: ["Timebox ruthlessly - the clock is what keeps the session concrete.", "Capture threats as cards during the discussion, not from memory afterwards."],
      },
    ],
    projectIds: ["p3-capstone"],
    quizId: "quiz-p3-m3",
  },
  {
    ...shared,
    id: "p3m3-security-testing",
    slug: "security-testing",
    title: "Security Testing",
    description:
      "SAST and DAST, dependency scanning in CI, an OWASP ZAP baseline pass, security assertions as unit tests and a bug-bounty mindset for your own code.",
    order: 18,
    estimatedMinutes: 22,
    tags: ["testing", "sast", "dast", "zap", "ci"],
    prerequisites: ["p2m7-test-coverage", "p2m7-ci-fundamentals", "p3m3-threat-modeling"],
    relatedTopics: ["p3m3-dependency-auditing", "p3m3-threat-modeling", "p3m3-broken-access-control"],
    learningObjectives: [
      "Distinguish SAST, DAST and dependency scanning, and what each one misses",
      "Write security-focused unit tests: authorization denials, validation rejections, header presence",
      "Run a ZAP baseline scan against a local build of your app",
      "Wire security gates into CI without turning every build into a blocked bottleneck",
    ],
    simpleExplanation:
      "Security testing is ordinary testing with an adversary in mind. Static analysis (SAST) reads your source for dangerous patterns, dynamic analysis (DAST) pokes a running app like an attacker would, and dependency scanning checks your lockfile against known CVEs. None of them replace tests you write yourself for the rules that matter to your app.",
    detailedContent: `
**The three automated layers**

- **SAST** (Semgrep, CodeQL, eslint-security plugins) - parses source without running it. Fast, early, noisy. Great at finding \`exec(\` with interpolation, \`eval\`, \`sql\` built by concatenation. Weak at business-logic flaws.
- **DAST** (OWASP ZAP, Nuclei) - sends real HTTP at a running instance. Finds missing headers, reflected XSS, exposed debug routes. Needs a running target and credentials for authenticated scans.
- **Dependency scanning** (npm audit, Snyk, GitHub Dependabot alerts) - the lockfile lesson, automated in CI.

**Tests you should write yourself.** These catch the findings scanners miss, because they encode *your* rules:

1. Authorization: owner gets 200, stranger gets 404/403 for every object route.
2. Validation: each schema rejects its known-bad payloads (operator injection, oversize strings, unknown keys).
3. Headers: the response from \`/api/health\` contains \`x-content-type-options: nosniff\` and your CSP.
4. Rate limits: the sixth login attempt in a window returns 429 with \`Retry-After\`.
5. Redaction: an attempted log of an \`Authorization\` header emits \`[REDACTED]\` (assert on the transport, not the string).

**The bug-bounty mindset.** For one hour a sprint, stop defending and start attacking *your own* endpoint: change the id, remove the token, send an object where a string is expected, add an admin header, upload a .png that is really HTML. Every failure you find becomes a test in the suite above.

**CI gates.** Block on high/critical dependency advisories and on SAST findings for changed files; keep informational noise as annotations. Run ZAP baseline on a nightly schedule against staging, not on every PR.
    `,
    howItWorks: `
A DAST scanner works exactly like the manual tester: crawl the app from a starting URL, build a request map, then replay each request with mutations - extra parameters, quote characters, script tags, oversized bodies - and observe responses for signatures of vulnerability (error strings, reflected input, changed behaviour). ZAP's \`baseline\` mode is passive: it records what it sees without attacking, which makes it safe to run against any environment you own.

SAST, by contrast, never runs your app: it builds an AST and matches taint rules (source \`req.query\` to sink \`exec\`). Both produce findings you must triage; the value is that they run on every change, so a new \`exec(\` with interpolation never waits for a human review to be noticed.
    `,
    codeExamples: [
      {
        title: "Security tests as ordinary Vitest cases",
        language: "ts",
        code: `import request from "supertest";
import { app } from "../src/app";

describe("security regressions", () => {
  it("denies access to another user's invoice with 404", async () => {
    const res = await request(app)
      .get("/api/invoices/" + invoiceOfB)
      .set("Authorization", "Bearer " + tokenOfA);
    expect(res.status).toBe(404);
    expect(res.body).not.toHaveProperty("data.totalCents"); // no partial leak
  });

  it("rejects NoSQL operator payloads on login", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: { $gt: "" }, password: { $gt: "" } });
    expect(res.status).toBe(401);
  });

  it("sets nosniff and a CSP on API responses", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("default-src");
  });

  it("rate limits login attempts", async () => {
    for (let i = 0; i < 6; i++) {
      await request(app).post("/api/login").send({ email: "a@example.com", password: "x" });
    }
    const blocked = await request(app)
      .post("/api/login")
      .send({ email: "a@example.com", password: "x" });
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });
});`,
        description:
          "These are just integration tests with an adversarial bent - they belong in the same suite that already runs on every push.",
      },
      {
        title: "ZAP baseline scan against your own local build",
        language: "bash",
        code: `# 1) start your app locally
npm run dev   # http://127.0.0.1:3000

# 2) run a PASSIVE baseline scan (docker) - nothing is attacked
docker run --rm --network host -v "$(pwd):/zap/wrk/:rw" \\
  -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \\
  -t http://127.0.0.1:3000 -r zap-baseline.html

# 3) triage the report: missing headers, cookie flags, reflected input
# fix, re-run, and only then promote the scan to nightly CI against staging`,
        description:
          "Baseline mode is passive and safe against an environment you own. Never point scanners at systems you do not have permission to test.",
      },
    ],
    commonMistakes: [
      "Treating a green SAST scan as proof of security - scanners are weak at exactly the business-logic bugs that hurt most.",
      "Running DAST only before release, when a nightly baseline would surface header regressions in a day.",
      "Writing zero authorization tests, then discovering an IDOR from a customer report instead of from CI.",
    ],
    bestPractices: [
      "Make 'owner allowed, stranger denied' a required test for every new object route.",
      "Gate CI on high/critical dependency advisories; keep SAST annotations visible on every PR.",
      "Schedule a monthly one-hour attack-your-own-endpoint session and convert every finding into a test.",
    ],
    realWorldUseCases: [
      "A regression suite that includes the NoSQL login payload would have blocked the reintroduction of a bypass that was fixed months earlier.",
      "Nightly ZAP baselines against staging catch a missing header the day a reverse-proxy config changes.",
    ],
    resources: [
      docs("OWASP ZAP", "https://www.zaproxy.org/", "Free DAST scanner; baseline mode for passive checks.", "en", "15 min"),
      docs("OWASP - Verification Standard (ASVS)", OFFICIAL.owaspApi, "A checklist of security requirements you can turn into test cases.", "en", "reference"),
      docs("Semgrep", "https://semgrep.dev/docs/", "Lightweight SAST with writable custom rules for your sinks.", "en", "10 min"),
      ytSearch("owasp zap baseline scan tutorial docker", "Walkthroughs of running ZAP against a local development server.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m3-test-suite",
        title: "Build the security regression suite",
        prompt:
          "Write five security tests for your app using the pattern above: one authorization denial, one validation rejection, one header assertion, one rate-limit check and one redaction check. Run them and paste the failing output of any that exposes a real gap - then fix the app, not the test.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "supertest against a running Express app is enough; you do not need a real browser.",
          "If a test fails because the app is wrong, the test has done its job.",
        ],
        solution: `it("rejects unknown keys on profile update", async () => {
  const res = await request(app)
    .patch("/api/profile")
    .set("Authorization", "Bearer " + tokenOfA)
    .send({ displayName: "Amina", role: "admin" });   // role is not in the schema
  expect(res.status).toBe(422);
  expect(res.body.error).toBe("VALIDATION_ERROR");

  // prove the privilege did not change either
  const me = await request(app)
    .get("/api/me")
    .set("Authorization", "Bearer " + tokenOfA);
  expect(me.body.data.role).toBe("user");
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m3-test-zap",
        title: "Run a baseline scan",
        prompt:
          "Start your app on 127.0.0.1:3000 and run a ZAP baseline scan against it (docker command in this lesson). List every finding, mark it true/false positive, fix two real ones, and re-scan to confirm they are gone. Note one class of bug ZAP could not find that a unit test could.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: ["Baseline is passive - it reports what it observes, including missing headers.", "Authorization flaws need two identities; that is exactly what ZAP's default scan lacks."],
      },
    ],
    projectIds: ["p3-capstone", "p3-analytics-api"],
    quizId: "quiz-p3-m3",
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m3",
  moduleId: "p3-m3",
  title: "Module 3 quiz - Security",
  description:
    "Test your grasp of the OWASP API risks, injection, XSS, CSRF, SSRF, access control, headers, rate limiting, secrets, dependencies, uploads, logging and security testing.",
  questions: [
    {
      id: "q-p3m3-1",
      type: "multiple-choice",
      prompt:
        "An authenticated user requests GET /api/invoices/912. Invoice 912 belongs to a different customer, yet the API returns it in full. Which OWASP API Security entry does this best match?",
      options: [
        "API2 - Broken Authentication",
        "API1 - Broken Object Level Authorization (BOLA)",
        "API5 - Broken Function Level Authorization",
        "API7 - Security Misconfiguration",
      ],
      correctIndex: 1,
      explanation:
        "The caller is properly authenticated; what is missing is the check that this specific object belongs to them. That is BOLA (also called IDOR). Function-level authorization (API5) would look like an ordinary user reaching an admin operation such as DELETE /api/admin/users/7. Broken authentication would mean the token itself was invalid or forgeable.",
      optionExplanations: [
        "Authentication worked - a valid user made the request; the failure is authorisation of the object.",
        "Correct - object-level authorization is missing, so any id in the path is readable.",
        "Function-level issues concern admin operations, not per-object ownership.",
        "Misconfiguration covers debug routes, CORS wildcards and verbose errors, not a missing ownership filter.",
      ],
    },
    {
      id: "q-p3m3-2",
      type: "find-bug",
      prompt:
        "A support engineer reports that any user can 'promote themselves'. What is the vulnerability here?",
      code: `app.patch("/api/users/me", authenticate, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
  });
  res.json({ data: user });
});`,
      language: "ts",
      options: [
        "Mass assignment: req.body is written straight to the document, so {\"role\":\"admin\"} escalates privileges",
        "The route is missing CSRF protection, which is why roles change unexpectedly",
        "findByIdAndUpdate should be replaced with save() - the update itself is unsafe",
        "The response should be 204 No Content; returning the user leaks the role",
      ],
      correctIndex: 0,
      explanation:
        "Spreading or passing req.body into a persistence call lets the caller choose which fields change, including role, isAdmin or emailVerified. This is mass assignment, part of API3 (Broken Object Property Level Authorization). The fix is a schema that allowlists writable fields (displayName, timezone...) and writes only those.",
      optionExplanations: [
        "Correct - any field present in the body is writable, so the caller can set role.",
        "CSRF concerns forged requests from another origin; here the user deliberately sends the payload themselves.",
        "Both APIs write to the database; the defect is which fields are accepted, not which method is used.",
        "Leaking a role is a minor concern next to letting the client change it.",
      ],
    },
    {
      id: "q-p3m3-3",
      type: "code-output",
      prompt:
        "The handler below runs the query as shown. What does the payload x' OR '1'='1' -- return? (Assume the table has five rows, three of them active.)",
      code: `const sql =
  "SELECT * FROM users WHERE email = '" + req.query.email + "' AND active = true";
const { rows } = await pool.query(sql);`,
      language: "ts",
      options: [
        "Only the row whose email is x",
        "No rows, because the quotes make the query invalid",
        "Every row in the users table, because the comment disables the AND active = true guard",
        "Only the active rows whose email contains a quote character",
      ],
      correctIndex: 2,
      explanation:
        "After substitution the statement reads: SELECT * FROM users WHERE email = 'x' OR '1'='1' --' AND active = true. The -- starts a line comment, so the trailing quote and the AND active = true clause are discarded. The WHERE clause is then email = 'x' OR '1'='1', which is true for every row, so all five rows are returned.",
      optionExplanations: [
        "That is what a correctly parameterised query would effectively do - match nothing for this input.",
        "The resulting SQL is syntactically valid; that is what makes injection silent.",
        "Correct - the comment removes your guard and the OR condition is always true.",
        "The payload matches on the OR condition, not on partial email content.",
      ],
    },
    {
      id: "q-p3m3-4",
      type: "find-bug",
      prompt:
        "This endpoint is used to generate link previews. What is the security problem?",
      code: `app.get("/api/preview", async (req, res) => {
  const response = await fetch(String(req.query.url), {
    redirect: "follow",
  });
  res.type("text/plain").send(await response.text());
});`,
      language: "ts",
      options: [
        "fetch cannot be called in an Express handler - it must be wrapped in a queue job",
        "SSRF: the server fetches any caller-supplied URL, including http://127.0.0.1/... and the cloud metadata address 169.254.169.254; redirect: \"follow\" also lets a public URL bounce to an internal one",
        "The response should be JSON, not text/plain",
        "The handler must set a Content-Length header before sending the body",
      ],
      correctIndex: 1,
      explanation:
        "Any endpoint that fetches a user-supplied URL is an SSRF sink. From inside your network the server can reach loopback services, RFC1918 addresses and the link-local metadata service at 169.254.169.254, which can expose cloud credentials. Because redirects are followed automatically, validating only the first URL is not enough.",
      optionExplanations: [
        "fetch works fine server-side - that is exactly what creates the SSRF risk.",
        "Correct - unrestricted server-side fetching plus redirect following is the classic SSRF pattern.",
        "Content type is cosmetic here; the vulnerability is the destination of the request.",
        "Content-Length is not required; Node computes it. The issue is where the request goes.",
      ],
    },
    {
      id: "q-p3m3-5",
      type: "multiple-choice",
      prompt:
        "Your API authenticates browsers with a session cookie. Which statement about CSRF is correct?",
      options: [
        "CSRF also works against Authorization: Bearer tokens, because browsers attach them automatically",
        "HTTPS prevents CSRF, so no additional defence is needed",
        "Requiring a custom header such as X-CSRF-Token on state-changing requests is effective because cross-site pages cannot set custom headers without failing CORS preflight",
        "CSRF only affects GET requests; POST is safe",
      ],
      correctIndex: 2,
      explanation:
        "Cross-site 'simple' requests cannot carry custom headers; a non-simple request triggers a preflight that your CORS policy rejects. That is why a required custom header (or a double-submit token the attacker cannot read) stops CSRF. Bearer tokens in the Authorization header are not attached automatically, so they are not CSRF-prone; HTTPS protects the channel but does not stop a forged in-channel request.",
      optionExplanations: [
        "Bearer headers are set explicitly by JavaScript; a cross-site page cannot set them for another origin.",
        "HTTPS does not stop the victim's browser from sending a request the victim never intended.",
        "Correct - the header requirement is exactly why custom headers are a CSRF defence.",
        "GET must be safe, but state-changing POSTs are the classic CSRF target.",
      ],
    },
    {
      id: "q-p3m3-6",
      type: "short-answer",
      prompt:
        "Which HTTP status code must a rate limiter return when a client exceeds its budget? Answer with the numeric code only.",
      acceptedKeywords: ["429", "429 too many requests", "too many requests"],
      explanation:
        "429 Too Many Requests is the standard signal. It should be paired with a Retry-After header (seconds or an HTTP-date) so clients and retry libraries know when to come back instead of hammering the endpoint.",
    },
    {
      id: "q-p3m3-7",
      type: "multiple-choice",
      prompt: "Which practice is correct for an API key used in production?",
      options: [
        "Commit it to a private repository - private repos are not public, so the key is safe",
        "Bake it into the frontend bundle so the mobile app can use it without configuration",
        "Inject it at runtime from the platform's environment or a secret manager, scope it to one service, and rotate it on a schedule",
        "Paste it into the team chat so on-call engineers can copy it during incidents",
      ],
      correctIndex: 2,
      explanation:
        "Secrets belong in the environment or a dedicated secret manager, with least-privilege scoping and a rotation plan. Private repositories leak via forks, access changes and history; frontend bundles are public by definition; chat logs are retained, searchable and widely accessible - and all three make rotation painful.",
      optionExplanations: [
        "Git history is forever; private repos are one access change away from public, and history cannot be un-leaked.",
        "Anything shipped to a client can be extracted - treat it as published.",
        "Correct - runtime injection, scoped credentials and scheduled rotation.",
        "Chat is not a secret store; incidents are exactly when keys get mishandled.",
      ],
    },
    {
      id: "q-p3m3-8",
      type: "code-output",
      prompt:
        "The vulnerable login handler is deployed and the attacker sends the JSON body shown. What happens?",
      code: `app.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password, // passwords stored as bcrypt hashes
  });
  if (!user) return res.status(401).json({ error: "BAD_CREDENTIALS" });
  res.json({ token: issueToken(user.id) });
});

// attacker body: { "email": { "$gt": "" }, "password": { "$gt": "" } }`,
      language: "ts",
      options: [
        "The request fails with a 400 because Mongoose rejects object values",
        "The handler returns the first user in the collection as a successful login, because $gt: \"\" matches any non-empty string - including the stored hashes",
        "Mongoose throws a CastError, which Express turns into a 500",
        "Nothing changes; MongoDB only honours operators written inside the query string",
      ],
      correctIndex: 1,
      explanation:
        "Express's JSON body parser turns the payload into real nested objects, and Mongoose compiles $gt into a range predicate. '$gt: \"\"' is true for any non-empty string, so the query matches essentially every document and findOne returns the first one - a full authentication bypass. The fix is schema/type validation so an object where a string is expected is rejected before the query runs.",
      optionExplanations: [
        "Mongoose does not reject object values here - it interprets them as operators.",
        "Correct - operator injection matches any user and bypasses the password check entirely.",
        "No cast is attempted for a $-prefixed operator object; that is what makes it work.",
        "Operators work in any query object, including one built from a JSON body.",
      ],
    },
  ],
};
