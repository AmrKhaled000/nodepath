import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m6",
  slug: "authentication-authorization",
  title: "Authentication & Authorization",
  description:
    "Proving who a user is and controlling what they can do: password hashing, sessions vs JWTs, refresh token rotation, RBAC, protected routes, password reset, OAuth, secure cookies, CSRF protection and account hardening.",
  phaseId: "phase-2",
  order: 6,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m6",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m6-auth-vs-authz",
    slug: "authentication-vs-authorization",
    title: "Authentication vs Authorization",
    description:
      "AuthN and AuthZ: two different questions your API must answer on every protected request, in the right order.",
    order: 1,
    estimatedMinutes: 12,
    tags: ["authentication", "authorization", "security", "fundamentals"],
    prerequisites: ["p1m1-http", "p1m1-frontend-backend"],
    relatedTopics: ["p2m6-jwt-access-tokens", "p2m6-role-based-access-control", "p2m5-api-security-basics"],
    learningObjectives: [
      "Define authentication (AuthN) and authorization (AuthZ) precisely",
      "Explain why authentication always happens before authorization",
      "Classify real API requirements as AuthN or AuthZ problems",
    ],
    simpleExplanation:
      "Authentication answers “who are you?” — like showing a passport at a gate. Authorization answers “what are you allowed to do?” — like the passport determining which rooms you may enter. Your API must authenticate a request first (resolve the user behind the token or session), and only then authorize it (check roles, ownership, or permissions). Mixing the two up is the root of most access-control bugs.",
    detailedContent: `
Every protected endpoint performs two logically separate checks:

- **Authentication (AuthN)** — establish the caller's identity. “This request comes from user id u_42.” Usually done by a session cookie or a JWT in the \`Authorization\` header. The result is typically attached to the request as \`req.user\`.
- **Authorization (AuthZ)** — decide whether that identity may perform this action on this resource. “May u_42 delete post p_9?” Usually a role check, a permission check, or an ownership comparison.

Why the distinction matters in practice:

1. **Different failure modes.** No identity → **401 Unauthorized**. Identity present but not allowed → **403 Forbidden**. Returning the wrong code confuses clients and leaks information.
2. **Different code.** Authentication is one shared middleware reused everywhere. Authorization is often per-route or per-resource logic.
3. **Different lifetimes.** A token can be valid (authenticated) while a role change should take effect immediately — authorization data should ideally not live only inside a long-lived token.
4. **Composability.** Good designs stack small middlewares: \`authenticate\` → \`requireRole("admin")\` → \`checkOwnership\` → handler. Each layer answers exactly one question.

Common AuthN mechanisms: session cookies, JWT access tokens, API keys, OAuth/OIDC flows. Common AuthZ models: role-based access control (RBAC), attribute-based checks (ownership, tenancy), and fine-grained permission strings like \`post:delete\`.

A classic anti-pattern is skipping AuthN because “the UI hides the button”. Clients are untrusted: every route must authenticate and authorize server-side, even if the frontend never shows the control.
    `,
    howItWorks: `
On each request to a protected route the pipeline runs:

1. **Authenticate.** Read the session cookie or \`Authorization: Bearer …\` header, verify it (signature + expiry for JWTs, store lookup for sessions), load the user, and set \`req.user\`. Fail with 401 if anything is missing or invalid.
2. **Authorize.** Middlewares inspect \`req.user\` against the route's policy: roles (\`req.user.role === "admin"\`), permissions, or resource ownership (\`todo.ownerId === req.user.id\`). Fail with 403 when denied.
3. **Handle.** The route handler runs with a fully resolved, trusted identity — never parsing credentials itself.

Only after both gates pass does business logic run. This order is what makes “least privilege by default” enforceable in code rather than in documentation.
    `,
    codeExamples: [
      {
        title: "Authenticate, then authorize — as two separate middlewares",
        language: "ts",
        code: `import type { Request, Response, NextFunction } from "express";

// AuthN: who is making this request?
function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // In later lessons this verifies a JWT; here we show the shape only.
  req.user = { id: "u_42", role: "user" }; // trusted after verification
  next();
}

// AuthZ: is this user allowed to do this?
function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

app.get("/admin/stats", authenticate, requireRole("admin"), (req, res) => {
  res.json({ users: 1284 });
});`,
        description:
          "Two questions, two middlewares: authenticate resolves identity (401 on failure), authorize enforces policy (403 on failure).",
      },
    ],
    commonMistakes: [
      "Calling a 401 failure “forbidden” or a 403 failure “unauthorized” — the names feel swapped but the codes matter to clients and security tooling.",
      "Trusting the client: hiding an admin button is not authorization; the API must re-check on every request.",
      "Putting role checks only inside route handlers and forgetting them on new routes — middleware makes deny-by-default easier to audit.",
    ],
    bestPractices: [
      "Make authentication a single shared middleware so credential parsing and verification live in one audited place.",
      "Deny by default: protect routes with middleware, and treat public routes as the explicit exception list.",
      "Keep “who” (AuthN) and “may” (AuthZ) in separate modules so policies can change without touching credential logic.",
    ],
    realWorldUseCases: [
      "Multi-tenant SaaS: AuthN identifies the user, AuthZ checks that they belong to the tenant in the URL path.",
      "Admin dashboards: same AuthN as normal users, different role gate before any admin handler runs.",
    ],
    resources: [
      docs(
        "OWASP — Authentication Project",
        "https://owasp.org/www-proj-authentication/",
        "OWASP guidance covering identity verification and access control concepts.",
      ),
      docs(
        "jwt.io — Introduction to JWT",
        OFFICIAL.jsonWebTokens,
        "How structured tokens carry identity claims between services.",
      ),
      ytSearch(
        "authentication vs authorization explained",
        "Short visual breakdowns of AuthN vs AuthZ with everyday analogies.",
        "en",
        "5–10 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-authz-classify",
        title: "Classify AuthN vs AuthZ",
        prompt:
          "For each scenario, state whether the primary concern is authentication or authorization, and what status code (401 or 403) a failure should return: (a) a request arrives with no session cookie; (b) a logged-in user tries to delete another user's task; (c) a JWT signature fails verification; (d) a normal user calls /admin/users.",
        difficulty: "intermediate",
        estimatedMinutes: 10,
        hints: [
          "401 = we do not know who you are (or your credential is invalid); 403 = we know who you are and you may not do this",
          "Think: is the identity itself in question, or the permission?",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-password-hashing",
    slug: "password-hashing",
    title: "Password Hashing with bcrypt & Argon2",
    description:
      "Why you must never store plaintext passwords, how salted adaptive hashing works, and how to use bcrypt or Argon2 correctly in Node.js.",
    order: 2,
    estimatedMinutes: 20,
    tags: ["passwords", "hashing", "bcrypt", "argon2", "security"],
    prerequisites: ["p2m6-auth-vs-authz"],
    relatedTopics: ["p2m6-registration-login", "p2m6-password-reset", "p2m5-api-security-basics"],
    learningObjectives: [
      "Explain why hashing beats encryption for stored passwords",
      "Use bcrypt with an appropriate salt-round cost",
      "Recognise the Argon2id recommendation and when to prefer it",
      "Avoid plaintext storage, homemade hash schemes, and timing-unsafe comparisons",
    ],
    simpleExplanation:
      "Never keep a user's actual password. Store a one-way hash produced by a slow, salted algorithm (bcrypt or Argon2). When the user logs in, hash the password they just typed the same way and compare the results. If your database leaks, attackers only get useless hashes — and because each password has a unique salt plus a deliberately slow cost factor, cracking them is painfully expensive.",
    detailedContent: `
A password store must assume the database **will** leak someday. Design for that:

- **Hashing, not encryption.** Encryption is reversible with a key; a key leak reverses everything. A password hash is one-way: even you cannot recover the password, which is exactly what you want because you only ever need to *compare*.
- **Algorithms to use.** \`bcrypt\` (battle-tested, built-in salt) or **Argon2id** (the 2015 Password Hashing Competition winner; memory-hard, resistant to GPU farms). Prefer Argon2 for new projects; bcrypt is fine and widely available.
- **Never:** store plaintext, store MD5/SHA-256 alone (too fast on GPUs), or “encrypt” passwords with AES using a key in the same repo.
- **Salt.** A unique random salt per password defeats rainbow tables. bcrypt and argon2 generate and embed the salt for you — never invent your own.
- **Cost factor.** bcrypt's \`rounds\` (e.g. 12) means 2^12 iterations. Tune so one hash takes ~100–250 ms on production hardware, then re-tune as hardware improves. Higher cost also slows online brute-force attacks.
- **Pepper (optional).** A server-side secret (\`process.env.PASSWORD_PEPPER\`) mixed in before hashing adds a second factor that a pure database thief lacks. Rotate carefully — it makes old hashes unverifiable.
- **Comparison.** Use \`bcrypt.compare\` / \`argon2.verify\`; they perform constant-time comparison internally. Never compare hashes with \`===\` on your own, and never decrypt anything.

Password storage is a solved problem — use the libraries, configure the cost, and move on to harder parts of your product.
    `,
    howItWorks: `
bcrypt encodes cost and salt **into the hash string itself**, e.g. \`$2b$12$<22-char salt><31-char hash>\`. The stored string is self-describing:

1. On registration, call \`bcrypt.hash(password, 12)\`. bcrypt generates a random salt, runs Blowfish key setup 2^12 times, and returns the full string above. Store that single string.
2. On login, call \`bcrypt.compare(password, storedHash)\`. bcrypt parses the cost and salt out of \`storedHash\`, hashes the candidate password the same way, and compares in constant time.
3. Because the salt is embedded, two users with the password “hunter2” get completely different stored hashes — and you need no extra columns to track salts.

Argon2 works similarly but is memory-hard: each verification allocates a configurable amount of RAM, making parallel ASIC/GPU attacks far costlier than with bcrypt.
    `,
    codeExamples: [
      {
        title: "Hash on register, compare on login (bcrypt)",
        language: "ts",
        code: `import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // tune: ~100-250ms per hash in production

export async function hashPassword(plaintext: string): Promise<string> {
  // bcrypt generates a unique random salt internally — never reuse one.
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  storedHash: string,
): Promise<boolean> {
  // bcrypt.compare performs a constant-time comparison internally.
  // Missing \`await\` here is a classic bug: the Promise is truthy, so
  // every login "succeeds" (or always fails, depending on the check).
  return bcrypt.compare(plaintext, storedHash);
}

// registration
const hash = await hashPassword(req.body.password);
await db.users.create({ email, passwordHash: hash });

// login — generic message, never reveal which field was wrong
const ok = await verifyPassword(req.body.password, user.passwordHash);
if (!ok) {
  return res.status(401).json({ error: "Invalid credentials" });
}`,
        description:
          "One-way hash with per-password salt on the way in, library-provided constant-time compare on the way out. Always await the compare.",
      },
      {
        title: "Argon2id — the memory-hard alternative",
        language: "ts",
        code: `import argon2 from "argon2";

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 19456, // KiB (~19 MiB) — OWASP baseline
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, argonOptions);
}

export async function verifyPassword(plaintext: string, hash: string) {
  return argon2.verify(hash, plaintext); // constant-time compare built in
}`,
        description:
          "OWASP's current baseline parameters for Argon2id. The verify API takes the stored hash first because it carries the parameters and salt.",
      },
    ],
    commonMistakes: [
      "Storing the password in plaintext “because we need to email it later” — you should not be able to recover it; send a reset link instead.",
      "Using MD5/SHA-256 as password hashes: microseconds per attempt on a GPU. Fine for file checksums, never for passwords.",
      "Forgetting `await` on `bcrypt.compare` — you then check a Promise object (always truthy) and accidentally accept any password, or always reject.",
      "Setting salt rounds too low (4–6) for speed in development and shipping it to production.",
    ],
    bestPractices: [
      "Use bcrypt (cost ≥ 12) or Argon2id with OWASP baseline parameters; never roll your own construction.",
      "Keep the cost factor in configuration (`process.env.BCRYPT_ROUNDS`) so it can be tuned per environment.",
      "Add a per-deployment pepper via `process.env.PASSWORD_PEPPER` only if you can protect and rotate that secret properly.",
    ],
    realWorldUseCases: [
      "Every consumer app's signup/login path: hash at registration, verify at login, re-hash after a password reset.",
      "Admin tooling that “views a user” — the UI can show the user's email but must never be able to display their password, which is structurally impossible if you hashed correctly.",
    ],
    resources: [
      docs("bcrypt — npm package", OFFICIAL.bcryptNpm, "API reference for hash/compare and cost factor tuning."),
      docs("argon2 — npm package", OFFICIAL.argon2Npm, "Memory-hard hashing library; types, parameters and verify API."),
      docs(
        "OWASP Password Storage Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
        "Current algorithm and parameter recommendations for storing passwords.",
      ),
      ytSearch(
        "password hashing bcrypt salt rounds explained",
        "Walkthroughs of why salted slow hashes protect leaked databases.",
        "en",
        "10–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-fix-login-compare",
        title: "Find the bug: login always succeeds",
        prompt:
          "This login logic was reported as accepting any password: \\`const ok = bcrypt.compare(password, user.passwordHash); if (ok) { /* issue token */ }\\`. Find the bug, explain why it happens, and fix it. Then add a timing-safe path for the “user not found” case so response times do not reveal which emails are registered.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "What does bcrypt.compare return — a boolean or a Promise?",
          "A Promise object is always truthy in a plain if-check",
          "For unknown users, compare against a dummy hash of the same cost so the branch takes similar time",
        ],
        solution: `import bcrypt from "bcrypt";

// Pre-compute once at startup: hash of a random string, same cost as real hashes.
const DUMMY_HASH = bcrypt.hashSync("dummy-not-a-real-password", 12);

export async function login(email: string, password: string, res: Response) {
  const user = await db.users.findByEmail(email);

  // Always run a compare, even when the user is missing (anti-enumeration).
  const stored = user?.passwordHash ?? DUMMY_HASH;
  const ok = await bcrypt.compare(password, stored);

  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // issue session/token...
}`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p2m6-cost-tuning",
        title: "Benchmark the cost factor",
        prompt:
          "Write a small script that hashes the same password with bcrypt rounds 8, 10, 12 and 14, times each, and picks the smallest rounds value that still takes at least 100 ms on your machine. Report the value and where you would store it in config.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Use performance.now() around await bcrypt.hash(...)",
          "Store the chosen value in an environment variable, not hardcoded in the handler",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-blog-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-registration-login",
    slug: "registration-and-login",
    title: "Registration & Login Endpoints",
    description:
      "Building /register and /login: input validation, unique emails, generic credential errors, and issuing a session or token on success.",
    order: 3,
    estimatedMinutes: 22,
    tags: ["registration", "login", "express", "validation", "api-design"],
    prerequisites: ["p2m6-password-hashing", "p2m2-input-validation"],
    relatedTopics: ["p2m6-sessions-cookies", "p2m6-email-verification", "p2m6-auth-error-handling"],
    learningObjectives: [
      "Design a safe registration endpoint with validation and unique-email handling",
      "Implement login with generic “invalid credentials” responses",
      "Prevent user enumeration through status codes, messages and timing",
      "Decide what to create on success (session vs access/refresh tokens)",
    ],
    simpleExplanation:
      "Registration creates an account: validate the input, make sure the email is not already taken, hash the password, save the user, and return success without echoing secrets back. Login looks the user up, verifies the password hash, and on success issues whatever proves identity next — a session or a token pair. Both endpoints must answer identically for “wrong password” and “no such user”, so attackers cannot probe which emails have accounts.",
    detailedContent: `
**Registration (\`POST /register\`)** should:

1. **Validate before touching the database.** Email format, password minimum length (and optionally a denylist of common passwords). Use your schema validator (Zod/Joi) from the input-validation lessons.
2. **Normalise the email** (lowercase/trim) so \`Alice@Example.com\` and \`alice@example.com\` are the same account. Consider a case-insensitive unique index in the database.
3. **Handle the unique constraint race.** Two concurrent signups can both pass an \`exists()\` check. Catch the database's unique-violation error (code 11000 on MongoDB, \`23505\` on Postgres) and return **409 Conflict**.
4. **Hash with bcrypt/argon2** — never store the plaintext.
5. **Respond 201** with minimal data (e.g. the user id). Do not return the password hash, and do not auto-login if you plan to require email verification first.

**Login (\`POST /login\`)** should:

1. Look up the user by normalised email.
2. If not found, still perform a dummy \`bcrypt.compare\` against a precomputed hash so response *timing* matches the found-user path (anti-enumeration).
3. Return **401** with a single generic body — \`{ "error": "Invalid credentials" }\` — for both “no such user” and “wrong password”. Never say “email not found”.
4. On success, regenerate any session id (session fixation) or mint a fresh token pair, then set the cookie / return the tokens.

Rate-limit both endpoints (covered in the account-security lesson): login is the online brute-force surface, and register enables spam account floods.
    `,
    howItWorks: `
The full login request path:

1. Client \`POST /login\` with JSON credentials over HTTPS.
2. Validator rejects malformed bodies with 400 before any DB work.
3. Handler normalises the email, fetches the user row/document.
4. \`bcrypt.compare\` runs (real hash or dummy hash) — ~100–250 ms by design.
5. Success → create server-side session (regenerate id, store user id) or sign access + refresh tokens; attach \`Set-Cookie\` headers.
6. Failure → constant-shape 401 JSON. Server logs the attempt with IP and email for audit; the client learns nothing extra.

Neither endpoint should ever put the password in a log line, query string, or error message.
    `,
    codeExamples: [
      {
        title: "Registration with unique-email race handling",
        language: "ts",
        code: `import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8).max(72), // bcrypt truncates at 72 bytes
});

router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await db.users.create({ email, passwordHash });
    return res.status(201).json({ id: user.id });
  } catch (err: any) {
    // Unique constraint race: treat like a normal conflict, no stack trace out.
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }
    throw err;
  }
});

export default router;`,
        description:
          "Validate and normalise first, hash second, and translate the database's unique-violation error into a clean 409.",
      },
      {
        title: "Login with generic errors and a dummy compare",
        language: "ts",
        code: `import bcrypt from "bcrypt";

const DUMMY_HASH = bcrypt.hashSync("timing-pad", 12);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  const user = await db.users.findByEmail(email.toLowerCase().trim());
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    // Same status, same body, similar timing — no enumeration.
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Success: rotate session id (fixation defense) or mint tokens.
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    res.json({ id: user.id });
  });
});`,
        description:
          "The dummy hash keeps the “user not found” path as slow as the real compare, closing the timing side channel.",
      },
    ],
    commonMistakes: [
      "Returning 404 for unknown emails and 401 for wrong passwords — trivial user enumeration.",
      "Checking uniqueness with an application-level find() and ignoring the unique index, so concurrent signups create duplicates.",
      "Auto-login immediately after registration while also planning email verification — pick one flow and enforce it consistently.",
      "Logging the request body on failed logins, which writes plaintext passwords into log files.",
    ],
    bestPractices: [
      "Return one generic 401 body for every login failure and back it with a dummy compare for timing parity.",
      "Rely on a database unique constraint (plus normalised emails) rather than an application-only exists() check.",
      "Rate-limit /register and /login per IP and per email, and audit-log attempts without ever logging secrets.",
    ],
    realWorldUseCases: [
      "SaaS signup: validate, hash, persist as unverified, send verification email (next lessons).",
      "Internal tool login: same flow, but stricter password policy and mandatory MFA later in the module.",
    ],
    resources: [
      docs("Express.js documentation", OFFICIAL.expressDocs, "Routing and request handling fundamentals used by both endpoints."),
      docs(
        "Zod — schema validation",
        OFFICIAL.zodDocs,
        "Declarative validation for request bodies before any database work.",
      ),
      docs(
        "OWASP — Identity Verification Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Identity_Verification_Cheat_Sheet.html",
        "Guidance on login and identity proofing without leaking account existence.",
      ),
      ytSearch(
        "express register and login endpoint tutorial bcrypt",
        "End-to-end signup/login builds with validation and hashed passwords.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-register-endpoint",
        title: "Build POST /register",
        prompt:
          "Implement a registration endpoint that validates email + password with Zod, normalises the email, hashes with bcrypt (12 rounds), persists the user, and returns 201 with only the user id. Include a test proving a duplicate email returns 409.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Use z.string().email() and a transform to lowercase/trim",
          "Catch the unique-violation error code from your database driver",
        ],
      },
      {
        id: "ex-p2m6-generic-401",
        title: "Prove your login does not leak existence",
        prompt:
          "Using curl or a test suite, request /login with (a) a registered email + wrong password and (b) an unregistered email. Assert the status code and response body are indistinguishable. Document anything that still differs.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Compare JSON.stringify of both bodies byte-for-byte",
          "If (b) is faster, you skipped the dummy compare",
        ],
        solution: `// Vitest-style sketch
import request from "supertest";

it("does not reveal whether the email exists", async () => {
  const wrongPass = await request(app)
    .post("/login")
    .send({ email: "known@example.com", password: "wrong-password" });
  const noUser = await request(app)
    .post("/login")
    .send({ email: "ghost@example.com", password: "wrong-password" });

  expect(wrongPass.status).toBe(401);
  expect(noUser.status).toBe(401);
  expect(wrongPass.body).toEqual(noUser.body); // identical { error: "Invalid credentials" }
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-task-api", "p2-chat-backend"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-sessions-cookies",
    slug: "sessions-and-cookies",
    title: "Sessions & Cookies",
    description:
      "Server-side sessions: how an id in a cookie maps to state on the server, session stores, regeneration, and destruction.",
    order: 4,
    estimatedMinutes: 22,
    tags: ["sessions", "cookies", "stateful-auth", "express-session"],
    prerequisites: ["p1m1-cookies", "p2m6-auth-vs-authz"],
    relatedTopics: ["p2m6-secure-cookie-config", "p2m6-jwt-access-tokens", "p2m6-csrf-protection"],
    learningObjectives: [
      "Explain the session-cookie handshake end to end",
      "Choose and configure a session store beyond in-memory Maps",
      "Prevent session fixation by regenerating the id at login",
      "Destroy sessions correctly on logout and password change",
    ],
    simpleExplanation:
      "After login, the server generates a random session id, stores user data under that id in a store it controls, and sends only the id to the browser inside a cookie. Every later request carries the cookie automatically; the server looks up the id and knows who you are. Because the state lives server-side, you can revoke a session instantly — log out everywhere, disable a stolen session — at the cost of a store lookup on every request.",
    detailedContent: `
Sessions are the classic **stateful** authentication model:

- **The cookie is just an opaque key.** A good session id is ≥128 bits of randomness from \`crypto.randomBytes\`. It carries no user data itself; guessing it must be infeasible.
- **State lives on the server.** A \`Map\` works in development, but restarts wipe every session and multiple server processes cannot share memory. Production needs a shared store: Redis, a database table, or a hosted store. \`express-session\` plugs into any of these via a store adapter.
- **Session fixation.** If the id is issued *before* login and kept after, an attacker can plant a known id (e.g. via a crafted link) and hijack the session the moment the victim logs in. Solution: call \`req.session.regenerate()\` inside the login handler, then write \`userId\`.
- **Expiration.** Configure both idle timeout (rolling) and an absolute maximum lifetime. Long-lived “remember me” sessions should be a separate, explicitly opt-in record with its own revocation UI.
- **Logout and revocation.** \`req.session.destroy()\` removes the server-side record and you clear the cookie. Deleting only the cookie on the client is not logout — the server record would still be valid if stolen.
- **Password change / admin disable.** Every security-sensitive account event should destroy all of that user's sessions (iterate the store and delete by \`userId\`).

Compared to JWTs, sessions make revocation trivial but require every request to hit a shared store. Weigh that trade-off in the next lesson.
    `,
    howItWorks: `
A typical express-session request cycle:

1. First authenticated response: server creates session data \`{ userId: "u_42" }\`, stores it under a fresh random id, and sends \`Set-Cookie: sid=<id>; HttpOnly; Path=/\`.
2. Browser stores the cookie (domain-scoped, sent automatically on every subsequent request to the site).
3. On each request, the session middleware reads the cookie, looks the id up in the store, and hydrates \`req.session\`.
4. Mutations to \`req.session\` are persisted back to the store at the end of the response (configurable via \`resave\`/\`saveUninitialized\`).
5. On logout the record is deleted server-side and the cookie cleared — the id is now worthless.

If the store is down, authenticated traffic fails closed. That is correct: never fall back to “trust the cookie contents” when the lookup fails.
    `,
    codeExamples: [
      {
        title: "Configuring express-session with sane defaults",
        language: "ts",
        code: `import session from "express-session";
import { RedisStore } from "connect-redis";

app.use(
  session({
    secret: process.env.SESSION_SECRET, // long random string, from env only
    name: "sid", // do not use the default "connect.sid"
    resave: false, // do not re-save unchanged sessions
    saveUninitialized: false, // do not create a session for anonymous visits
    store: new RedisStore({ client: redisClient }),
    cookie: {
      httpOnly: true, // no JS access -> mitigates XSS token theft
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "lax", // good default CSRF resistance for top-level navigation
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days, tune to your policy
    },
  }),
);`,
        description:
          "Shared Redis store for multi-process deploys; HttpOnly, Secure, SameSite cookie settings that we harden further later.",
      },
      {
        title: "Login: regenerate the id. Logout: destroy the record",
        language: "ts",
        code: `app.post("/login", async (req, res) => {
  const user = await authenticateCredentials(req.body); // see earlier lessons
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // Session fixation defense: never keep a pre-login session id.
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    req.session.createdAt = Date.now();
    res.json({ id: user.id });
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.clearCookie("sid", { path: "/" });
    res.status(204).end();
  });
});`,
        description:
          "Regenerate on privilege change, destroy on logout — cookie deletion alone would leave the server record alive.",
      },
    ],
    commonMistakes: [
      "Using the in-memory Map store in production: every deploy or crash logs every user out, and horizontal scaling breaks lookups.",
      "Forgetting session regeneration at login — classic session fixation vulnerability.",
      "Calling only `res.clearCookie` on logout without destroying the server-side record.",
      "Storing sensitive data (role, permissions, cart contents) in an unsigned client cookie instead of server-side session state.",
    ],
    bestPractices: [
      "Use a shared store (Redis/Postgres) in production and treat store availability as part of your auth availability.",
      "Regenerate the session id on login, privilege elevation, and password change.",
      "Destroy all of a user's sessions on password reset or account compromise events.",
    ],
    realWorldUseCases: [
      "Traditional server-rendered web apps: sessions + cookies remain the simplest correct model.",
      "Admin panels needing instant “log out all devices” — sessions make revocation a single store delete.",
    ],
    resources: [
      docs("express-session — npm package", "https://www.npmjs.com/package/express-session", "Middleware API, store adapters and cookie options."),
      docs("MDN — HTTP cookies", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", "How cookies are set, scoped and sent by browsers."),
      docs("Redis documentation", OFFICIAL.redisDocs, "The most common shared session store for Node deployments."),
      ytSearch(
        "express session cookie login logout tutorial",
        "Walkthroughs of session middleware, fixation and destruction.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-session-flow",
        title: "Map the session handshake",
        prompt:
          "Using your browser's devtools Network tab on any logged-in site (or your own app), capture the login request and one subsequent request. Write down: the Set-Cookie header on login (flags and name), and the Cookie header on the follow-up request. Then explain in 3–4 sentences why the cookie value alone is not a JWT.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "Look for HttpOnly, Secure, SameSite, Path and Max-Age on Set-Cookie",
          "A JWT is self-contained (claims + signature); a session id is an opaque lookup key",
        ],
      },
      {
        id: "ex-p2m6-logout-revocation",
        title: "Implement secure logout",
        prompt:
          "Add POST /logout that destroys the server-side session and clears the cookie. Then add POST /logout-all that deletes every session belonging to req.session.userId across devices. Prove revocation by re-using a copied cookie after logout and asserting 401.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "express-session: req.session.destroy(cb) and res.clearCookie('sid')",
          "For logout-all, iterate your store's sessions (or maintain a userId -> sid index) and destroy matches",
        ],
        solution: `app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.clearCookie("sid", { path: "/" });
    res.status(204).end();
  });
});

app.post("/logout-all", requireAuth, async (req, res) => {
  // With an indexed store: delete all sessions where userId === req.user.id
  await sessionStore.destroyAllForUser(req.user.id);
  res.status(204).end();
});`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-chat-backend", "p2-blog-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-jwt-access-tokens",
    slug: "jwt-access-tokens",
    title: "JWT Access Tokens",
    description:
      "Structure, signing algorithms, claims, lifetimes, and the session-vs-JWT trade-offs every backend developer must know.",
    order: 5,
    estimatedMinutes: 25,
    tags: ["jwt", "tokens", "json-web-tokens", "stateless-auth"],
    prerequisites: ["p2m6-auth-vs-authz", "p2m6-sessions-cookies"],
    relatedTopics: ["p2m6-refresh-tokens-rotation", "p2m6-protected-routes", "p2m6-secure-cookie-config"],
    learningObjectives: [
      "Decode a JWT into header, payload and signature and explain each part",
      "Sign and verify tokens correctly with jsonwebtoken, including exp/iss/aud",
      "State why the payload must never contain secrets",
      "Compare sessions and JWTs and justify the choice for a given project",
    ],
    simpleExplanation:
      "A JWT is a tamper-evident receipt the server issues after login. It contains three Base64URL parts: who signed it, the claims (user id, expiry…), and a signature over the first two. Any change to the claims breaks the signature, so the server can trust the token on later requests without storing session state — but only if it verifies the signature, the expiry, and keeps the signing secret strictly on the server.",
    detailedContent: `
A JWT is \`header.payload.signature\`, each segment Base64URL-encoded and joined by dots:

- **Header** — algorithm and token type: \`{ "alg": "HS256", "typ": "JWT" }\`. Always set \`algorithms\` explicitly when verifying so an attacker cannot downgrade you by swapping in \`"none"\`.
- **Payload (claims)** — identity and context: \`sub\` (user id), \`iat\`, \`exp\` (short!), \`iss\`, \`aud\`. **Anyone can decode the payload — it is not encrypted.** Never put passwords, API secrets or anything private in it. Signing proves integrity; it does not provide confidentiality.
- **Signature** — \`HMAC-SHA256(header + payload, secret)\` (HS256, shared secret) or an RSA/ECDSA signature (RS256/ES256, private key signs, public key verifies). Use asymmetric signing when services that only *verify* tokens must not hold the signing key.

Rules for access tokens:

1. **Short lifetime: 5–15 minutes.** Long-lived access tokens are a liability; the refresh-token lesson pairs them with long-lived rotating refresh tokens instead.
2. **Verify properly:** signature (with explicit algorithms), \`exp\`, \`nbf\` if used, plus \`iss\`/\`aud\` when you set them.
3. **Storage on the client:** memory (a JS variable) minimises XSS exposure but is lost on reload; \`localStorage\` persists but any XSS can read it; an HttpOnly cookie resists XSS but reintroduces CSRF concerns (mitigated with SameSite + CSRF tokens). There is no perfect option — shorten lifetimes to bound the blast radius.
4. **Revocation is hard.** A valid JWT cannot be invalidated before \`exp\` without extra state (a denylist, or tiny lifetimes + refresh rotation). Plan for this before choosing JWTs for a “log out everywhere” feature.

### Sessions vs JWTs

| Criterion                  | Server-side session          | JWT access token               |
| -------------------------- | ---------------------------- | ------------------------------ |
| Where state lives          | Server store                 | Inside the token (stateless)   |
| Per-request cost           | Store lookup                 | Signature verify (no lookup)   |
| Revocation / “log out all” | Instant (delete record)      | Only via denylist or expiry    |
| Scalability across nodes   | Needs shared store           | Nothing shared to coordinate   |
| Cross-service auth         | Awkward (store coupling)     | Natural (any service verifies) |
| Cookie/CSRF surface        | Cookie → CSRF tokens needed  | Header bearer avoids CSRF      |
| Sensitive data in token    | Not exposed                  | Payload readable — keep clean  |
| Default best for           | Traditional web apps         | SPAs, mobile, service-to-service |

Neither is universally “better”; hybrid designs (HttpOnly session-like refresh cookie + short JWT access token) capture the benefits of both.
    `,
    howItWorks: `
Issuing and verifying with HS256:

1. **Sign:** \`jwt.sign({ sub: user.id, role: user.role }, secret, { algorithm: "HS256", expiresIn: "10m", issuer: "auth-service" })\`. The library base64url-encodes header+payload and appends the HMAC.
2. **Send:** client stores the token and attaches \`Authorization: Bearer <token>\` on API calls.
3. **Verify:** \`jwt.verify(token, secret, { algorithms: ["HS256"], issuer: "auth-service" })\`. The library recomputes the HMAC and compares in constant time; a mismatch or expired \`exp\` throws.
4. **Attach:** middleware sets \`req.user = payload\` (with \`sub\` as the user id) and calls \`next()\`. Throw 401 on any verification error.

With RS256, the auth service holds the private key and signs; every other service verifies with the published public key — no shared secret sprawl across microservices.
    `,
    codeExamples: [
      {
        title: "Sign and verify access tokens correctly",
        language: "ts",
        code: `import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET; // >= 32 random bytes; env only, never in code
const ISSUER = "p2-auth-api";

export function issueAccessToken(user: { id: string; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, {
    algorithm: "HS256",
    expiresIn: "10m", // short-lived access token
    issuer: ISSUER,
    audience: "p2-api",
  });
}

export function verifyAccessToken(token: string) {
  // Pin the algorithm — never trust the token's own "alg" header alone.
  return jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: "p2-api",
  }) as jwt.JwtPayload;
}

// Express middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: String(payload.sub), role: String(payload.role) };
    next();
  } catch (err) {
    // Generic body; log details server-side. Distinguish expiry if the
    // client benefits (see auth error-handling lesson).
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}`,
        description:
          "Secret from env, pinned algorithm, short expiry, issuer/audience checks, and a middleware that fails closed with 401.",
      },
      {
        title: "Read claims safely in a route",
        language: "ts",
        code: `app.get("/me", requireAuth, async (req, res) => {
  // req.user was set from the VERIFIED payload — never from client JSON.
  const user = await db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, role: user.role });
});`,
        description: "The handler trusts only the verified token payload as the source of identity.",
      },
    ],
    commonMistakes: [
      "Putting the password hash or an API secret inside the JWT payload — the payload is only Base64, not encrypted.",
      "Calling `jwt.decode` (no signature check) instead of `jwt.verify` — any client can forge the token.",
      "Omitting `algorithms` when verifying, or trusting the token's own alg header, enabling algorithm-confusion attacks.",
      "Shipping access tokens with multi-day expiries and no revocation story.",
    ],
    bestPractices: [
      "Keep access tokens under ~15 minutes and pair them with refresh-token rotation for long sessions.",
      "Store the signing secret in `process.env.JWT_SECRET` (≥ 32 random bytes) and rotate it with overlap if using HS256.",
      "Prefer bearer tokens in the Authorization header over localStorage when your threat model is XSS-heavy; document the trade-off.",
    ],
    realWorldUseCases: [
      "SPA + API architecture: the API stays stateless and horizontally scalable with no shared session store.",
      "Service-to-service calls: an internal service signs a short JWT; peers verify with the public key without calling the auth service.",
    ],
    resources: [
      docs("jwt.io — Introduction to JWT", OFFICIAL.jsonWebTokens, "Interactive decoder and conceptual overview of header/payload/signature."),
      docs("Auth0 — JSON Web Tokens", OFFICIAL.auth0Jwt, "Claims, algorithms and token lifecycle guidance."),
      docs("jsonwebtoken — npm package", "https://www.npmjs.com/package/jsonwebtoken", "Node library API for sign and verify options."),
      ytSearch(
        "jwt access token express tutorial",
        "Practical sign/verify walkthroughs and middleware wiring.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-jwt-middleware",
        title: "Build a requireAuth middleware",
        prompt:
          "Implement issueAccessToken() and a requireAuth middleware that verifies the Bearer token (pinned HS256, 10-minute expiry), sets req.user from the verified payload, and returns 401 with a generic body on failure. Add a /me route protected by it.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "jwt.verify accepts an options object — pin algorithms: ['HS256']",
          "Never build req.user from req.body or query parameters",
        ],
      },
      {
        id: "ex-p2m6-decode-jwt",
        title: "Decode (do not verify) a sample token",
        prompt:
          "Paste any sample JWT into jwt.io or decode it with Node and print the payload fields. Then answer: (1) which fields would you never put in a payload, (2) what exactly does the signature protect against, (3) why doesn't the signature provide confidentiality?",
        difficulty: "intermediate",
        estimatedMinutes: 12,
        hints: [
          "Base64URL is encoding, not encryption — anyone can decode without the secret",
          "The signature proves the payload wasn't altered by anyone lacking the secret",
        ],
        solution: `// Decode-only (for debugging your own tokens in dev tooling — never for auth):
import jwt from "jsonwebtoken";
const decoded = jwt.decode(sampleToken); // no signature check!
console.log(decoded);
// 1) Never: passwords, secrets, PII that must stay confidential.
// 2) Signature protects integrity + authenticity (who issued it).
// 3) Anyone can Base64-decode the payload; the secret only signs it.`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-url-shortener", "p2-ecommerce-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-refresh-tokens-rotation",
    slug: "refresh-tokens-and-rotation",
    title: "Refresh Tokens & Rotation",
    description:
      "Long-lived sessions without long-lived access tokens: refresh token storage, rotation, and reuse detection that revokes entire token families.",
    order: 6,
    estimatedMinutes: 25,
    tags: ["refresh-tokens", "rotation", "token-lifecycle", "security"],
    prerequisites: ["p2m6-jwt-access-tokens"],
    relatedTopics: ["p2m6-jwt-access-tokens", "p2m6-secure-cookie-config", "p2m6-account-security"],
    learningObjectives: [
      "Design an access + refresh token pair with correct lifetimes",
      "Implement refresh token rotation with server-side invalidation",
      "Detect stolen-token reuse and revoke the whole family",
      "Store refresh tokens hashed and deliver them via HttpOnly cookies",
    ],
    simpleExplanation:
      "A short-lived access token (minutes) is annoying to renew manually, so you pair it with a long-lived refresh token (weeks). When the access token expires, the client presents the refresh token to a dedicated endpoint and receives a brand-new access token — and, with rotation, a brand-new refresh token too. Old refresh tokens are invalidated server-side; if a previously used one shows up again, you assume theft and kill every token in that family.",
    detailedContent: `
The pair works like a hotel key card plus the front-desk pass:

- **Access token** — 5–15 minutes, carried in the \`Authorization\` header, proves identity on every API call. Stateless verification.
- **Refresh token** — days to weeks, used only at \`POST /auth/refresh\`, never on normal API calls. Delivered preferably in an **HttpOnly, Secure, SameSite cookie** scoped to your auth paths so JavaScript cannot exfiltrate it, or returned in the body for native apps that use secure storage.

**Rotation protocol (the important part):**

1. Client calls \`/auth/refresh\` with its current refresh token.
2. Server verifies it: signature, expiry, and **that it is the current unrevoked token for that session/family** (a DB lookup — refresh tokens are *not* fully stateless).
3. Server marks the presented token used, generates a fresh access token **and** a fresh refresh token, stores a hash of the new refresh token, and returns both.
4. The old refresh token is revoked immediately.

**Reuse detection.** If a refresh token that was already rotated (marked used) appears again, two copies exist — one is probably stolen. Response: revoke the entire **family** (the chain of tokens descended from the original login), forcing re-authentication. Legitimate clients that race (two tabs refreshing at once) need a short grace period or careful ordering to avoid false positives.

**Storage hygiene.** Store only a **hash** (SHA-256) of each refresh token in the database. A database leak then does not hand out usable refresh tokens. Bind each token to a client id or user agent fingerprint for additional anomaly signals — but treat fingerprints as signals, not proof.
    `,
    howItWorks: `
End-to-end refresh cycle:

1. \`POST /login\` → server creates session row: \`{ familyId, currentRefreshHash, expiresAt }\` → returns access JWT + refresh token (via Set-Cookie or body).
2. Client uses the access JWT normally until it expires (401).
3. Client calls \`POST /auth/refresh\` (cookie or body carries the refresh token).
4. Server hashes the incoming token, looks it up, confirms it equals \`currentRefreshHash\` and is unexpired.
5. Server rotates: set \`currentRefreshHash\` to the hash of the new token, store the new token's meta (family, usedAt: null), sign a new access JWT.
6. If the presented hash matches a *used* (previous) token → reuse detected → delete all rows with this \`familyId\` → respond 401 and force login.

Only steps 4–6 touch the database; normal API requests still verify access JWTs without any store lookup.
    `,
    codeExamples: [
      {
        title: "Refresh endpoint with rotation and reuse detection",
        language: "ts",
        code: `import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const hashToken = (t: string) =>
  crypto.createHash("sha256").update(t).digest("hex");

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

app.post("/auth/refresh", async (req, res) => {
  const presented = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!presented) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  const presentedHash = hashToken(presented);
  const record = await db.refreshTokens.findByHash(presentedHash);

  if (!record || record.expiresAt < new Date()) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  if (record.usedAt) {
    // Stolen token replayed: kill the whole family and force re-login.
    await db.refreshTokens.deleteFamily(record.familyId);
    return res.status(401).json({ error: "Token reuse detected; please sign in again" });
  }

  // Rotate: invalidate current, issue new refresh + new access token.
  await db.refreshTokens.markUsed(record.id);
  const next = newRefreshToken();
  await db.refreshTokens.create({
    familyId: record.familyId,
    userId: record.userId,
    hash: hashToken(next),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    usedAt: null,
  });

  const accessToken = jwt.sign(
    { sub: record.userId },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "10m" },
  );

  res
    .cookie("refreshToken", next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    })
    .json({ accessToken });
});`,
        description:
          "Hash-at-rest refresh tokens, single-use rotation, and family-wide revocation when a used token is replayed.",
      },
      {
        title: "Silent renew on the client (sketch)",
        language: "ts",
        code: `// Pseudo-client: on 401, try one refresh, then retry the original request.
async function apiFetch(url: string, init: RequestInit = {}) {
  const token = getAccessToken(); // in memory, e.g. a module-level variable
  let res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: "Bearer " + token },
  });
  if (res.status !== 401) return res;

  const refreshed = await refreshSession(); // POST /auth/refresh (cookie sent automatically)
  if (!refreshed) throw new Error("Session expired");
  return fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: "Bearer " + refreshed.accessToken },
  });
}`,
        description:
          "The browser attaches the HttpOnly refresh cookie automatically; only the short-lived access token lives in JS memory.",
      },
    ],
    commonMistakes: [
      "Giving the refresh token a multi-month lifetime with no rotation — one theft compromises the account for months.",
      "Storing refresh tokens in plaintext in the database; hash them (SHA-256) at rest.",
      "Serving /auth/refresh from a cookie without SameSite and CSRF defenses — the endpoint becomes a CSRF goldmine.",
      "Failing to detect reuse, so a stolen refresh token silently coexists with the legitimate one.",
    ],
    bestPractices: [
      "Rotate on every refresh, store hashes only, and revoke the family on reuse.",
      "Deliver refresh tokens as HttpOnly Secure cookies scoped to /auth for web clients; use platform secure storage in mobile apps.",
      "Keep access tokens short (5–15 min) so even a missed revocation window is small.",
    ],
    realWorldUseCases: [
      "SPA that stays logged in for 30 days without keeping a long-lived secret in localStorage.",
      "Mobile apps with flaky networks: refresh transparently on 401 instead of forcing re-login.",
    ],
    resources: [
      docs("Auth0 — Refresh Tokens", "https://auth0.com/docs/secure/tokens/refresh-tokens", "Rotation, reuse detection and storage recommendations."),
      docs("OWASP Session Management Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "Server-side session and token lifecycle guidance."),
      ytSearch(
        "refresh token rotation reuse detection tutorial",
        "Implementations of rotating refresh token families in Node/Express.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-rotation-family",
        title: "Implement family revocation",
        prompt:
          "Extend the refresh endpoint so that reuse of a used token revokes every token in that family. Write a test that: logs in, refreshes once (old token now used), replays the old token, and asserts 401 plus that the new token no longer works.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Track familyId (uuid per login) on every refresh token row",
          "Replay = presented hash matches a row with usedAt != null",
        ],
      },
      {
        id: "ex-p2m6-hash-at-rest",
        title: "Hash refresh tokens at rest",
        prompt:
          "Show why storing refresh tokens hashed at rest matters: sketch the attacker's advantage if your users table leaks with plaintext refresh tokens, and implement creation + lookup using SHA-256 hashes.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "SHA-256 is fine here because refresh tokens are high-entropy random strings (unlike passwords)",
          "Lookup path: hash(presented) -> find row",
        ],
        solution: `import crypto from "node:crypto";
const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

const token = crypto.randomBytes(48).toString("base64url");
await db.tokens.create({ userId, hash: sha256(token), usedAt: null }); // store hash only
// later:
const row = await db.tokens.findByHash(sha256(presentedToken));`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-chat-backend"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-role-based-access-control",
    slug: "role-based-access-control",
    title: "Role-Based Access Control (RBAC)",
    description:
      "Modeling access with roles: role assignment, middleware guards, hierarchy pitfalls, and keeping roles fresh across tokens and sessions.",
    order: 7,
    estimatedMinutes: 18,
    tags: ["rbac", "roles", "authorization", "access-control"],
    prerequisites: ["p2m6-auth-vs-authz"],
    relatedTopics: ["p2m6-permissions", "p2m6-protected-routes", "p2m6-jwt-access-tokens"],
    learningObjectives: [
      "Model roles as a small, explicit enum rather than free-form strings",
      "Implement reusable requireRole() middleware",
      "Decide whether roles belong in the JWT payload or only in the database",
      "Handle privilege escalation safely (role changes taking effect quickly)",
    ],
    simpleExplanation:
      "RBAC means every user gets one or more named roles — like “user”, “moderator”, “admin” — and routes declare which roles may call them. It is the 80/20 of authorization: simple to understand, easy to audit, and enough for most products. The hard parts are keeping roles accurate when they change and resisting the urge to invent dozens of overlapping roles.",
    detailedContent: `
RBAC maps **subject → role → permissions**:

- **Roles are enums, not free text.** \`type Role = "user" | "moderator" | "admin"\` (or a DB check constraint). Free-form role strings from user input are an escalation waiting to happen.
- **One role per user is often enough.** Multiple roles (\`["editor", "reviewer"]\`) are fine, but define clearly whether checks are “any of” or “all of”.
- **Middleware, not copy-pasted ifs.** A \`requireRole("admin")\` factory keeps policies visible in the route table: \`router.delete("/posts/:id", authenticate, requireRole("admin"), handler)\`.
- **Hierarchy pitfalls.** “Admin implies every permission” sounds convenient but creates surprising grants. Prefer explicit role lists per route over deep inheritance trees until you truly need them.
- **Where to store the role.**

  | Approach                        | Pros                            | Cons                                  |
  | ------------------------------- | ------------------------------- | ------------------------------------- |
  | Only in DB, read per request    | Changes apply immediately       | Extra query (or cache) per request    |
  | In JWT payload                  | No lookup; works statelessly    | Stale until token expiry              |
  | Hybrid (JWT + short TTL)        | Fast *and* fairly fresh         | More moving parts                     |

  For an “admin demoted mid-session” scenario, either keep access tokens very short, check a server-side role cache, or maintain a small revocation list for elevated users.
- **Assignment discipline.** Grant roles through an explicit admin flow (or migration), log every change, and never accept a role field from an unauthenticated registration body.

RBAC shines when your matrix is small. When rules become per-resource and contextual (“owners may edit their posts only before publication”), graduate to the permissions/ownership model in the next lesson — RBAC and ownership checks compose well together.
    `,
    howItWorks: `
A request through an RBAC-guarded route:

1. \`authenticate\` resolves \`req.user\` (id + role) from a verified token or session.
2. \`requireRole("moderator")\` compares \`req.user.role\` against the required role(s); on mismatch it responds 403.
3. Handler runs; resource-level checks (ownership) may still apply inside.
4. On role change, an admin action updates the database and — if roles are embedded in tokens — you either wait for expiry, force re-issue, or bump a “roles version” claim that the middleware compares against a cached value.

Fail closed: if \`req.user\` is missing (middleware ordering bug), return 401/403 — never let the request through “because the handler will check”.
    `,
    codeExamples: [
      {
        title: "requireRole middleware factory",
        language: "ts",
        code: `import type { Request, Response, NextFunction } from "express";

export type Role = "user" | "moderator" | "admin";

// Works with any authenticated request shape; assumes requireAuth ran first.
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role as Role | undefined;
    if (!role) {
      // authenticate() did not run or failed — deny, do not fall through.
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Route table reads like a policy document:
router.get("/posts/:id/moderation", authenticate, requireRole("moderator", "admin"), getFlaggedPosts);
router.delete("/users/:id", authenticate, requireRole("admin"), deleteUser);`,
        description:
          "A tiny factory that keeps authorization policy visible at the route definition and denies when identity is missing.",
      },
      {
        title: "Admin assigns a role — validated server-side",
        language: "ts",
        code: `const ROLES = ["user", "moderator", "admin"] as const;

router.patch("/admin/users/:id/role", authenticate, requireRole("admin"), async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: "Unknown role" });
  }
  // Never trust a role field from the target user themselves.
  const updated = await db.users.setRole(req.params.id, role);
  await audit.log({ actor: req.user.id, action: "role.change", target: req.params.id, role });
  // If roles live in JWTs, shorten access TTL or bump a rolesVersion claim now.
  res.json({ id: updated.id, role: updated.role });
});`,
        description: "Role changes are admin-only, validated against an allowlist, audited, and made visible to token checks.",
      },
    ],
    commonMistakes: [
      "Accepting a role from the registration or profile body — instant privilege escalation.",
      "Embedding roles in week-long JWTs and wondering why a demoted admin still has access.",
      "String-typed roles scattered across the codebase with silent typos ('Admin' vs 'admin').",
      "Checking roles only on the frontend route table while API endpoints remain open.",
    ],
    bestPractices: [
      "Enumerate roles in one module and reuse the type/const everywhere.",
      "Combine coarse RBAC gates with resource-level ownership checks (next lesson) for real-world rules.",
      "Audit every role assignment and elevation; treat the admin role change path as a security-critical endpoint.",
    ],
    realWorldUseCases: [
      "Marketplace: “seller”, “buyer”, “support_agent” roles gate different route groups.",
      "Content platform: moderators can hide posts, only admins can delete users.",
    ],
    resources: [
      docs("OWASP — Application Security / Access Control", "https://owasp.org/www-project-application-security/", "Principles underlying RBAC and deny-by-default design."),
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Architecture patterns for authorization layers in Node services."),
      ytSearch(
        "role based access control express middleware",
        "RBAC implementations with requireRole and policy tables.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-rbac-middleware",
        title: "Build an RBAC route group",
        prompt:
          "Create authenticate + requireRole middleware and protect two groups: /mod/* for moderators and /admin/* for admins. Add a test matrix asserting user→403, moderator→200 on /mod, moderator→403 on /admin, unauthenticated→401 on both.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Mount router.use(requireRole('moderator')) on a sub-router",
          "Missing req.user must 401, not 403",
        ],
      },
      {
        id: "ex-p2m6-role-freshness",
        title: "Demote an admin mid-session",
        prompt:
          "Describe two strategies that make an admin demotion take effect within one minute even if the admin holds a 10-minute access JWT. Implement one (e.g. short TTL + reissue, or a rolesVersion checked against a cache).",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Shorten access token lifetime and force refresh after role change",
          "Or: version the role data and compare a claim to a Redis-cached version per request",
        ],
      },
    ],
    projectIds: ["p2-blog-api", "p2-job-board-api", "p2-inventory-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-permissions",
    slug: "permissions-and-ownership",
    title: "Permissions & Ownership Checks",
    description:
      "Fine-grained authorization beyond roles: permission strings, resource ownership, tenancy, and deny-by-default policies.",
    order: 8,
    estimatedMinutes: 20,
    tags: ["permissions", "ownership", "authorization", "abac"],
    prerequisites: ["p2m6-role-based-access-control"],
    relatedTopics: ["p2m6-role-based-access-control", "p2m6-protected-routes", "p2m6-auth-error-handling"],
    learningObjectives: [
      "Design permission strings such as post:delete and invoice:read",
      "Implement ownership checks on every resource route",
      "Prevent IDOR by querying with both resource id and owner id",
      "Combine RBAC gates with per-resource policies",
    ],
    simpleExplanation:
      "Roles answer “what kind of user is this?”; permissions answer “exactly what action on what kind of resource is allowed?”. A blog needs rules like “authors may edit their own posts; editors may edit any post”. Implement this by combining a role check with an ownership comparison — and by always scoping database queries to the current user so guessing another user's id simply returns nothing.",
    detailedContent: `
Roles are coarse. Real products need **resource-level** rules:

- **Permission strings.** A single canonical verb set — \`create, read, update, delete\` (optionally \`publish, moderate\`) — combined with a resource: \`"post:delete"\`, \`"invoice:read"\`. A permission map per role keeps policy readable:

  \`const ROLE_PERMISSIONS = {
    user: ["post:create", "post:read", "post:update:own"],
    editor: ["post:create", "post:read", "post:update", "post:delete"],
    admin: ["*"],
  };\`

- **Ownership checks.** \`:own\` permissions require comparing the resource's owner to \`req.user.id\`: \`if (post.authorId !== req.user.id) throw new ForbiddenError();\`
- **IDOR (Insecure Direct Object Reference).** The classic bug: \`GET /invoices/1042\` returns another tenant's invoice because the query was \`findById(1042)\` only. Fix: **always scope the query** — \`findOne({ _id: 1042, userId: req.user.id })\`. Missing-row and forbidden should both be indistinguishable to the attacker (prefer 404 for resources you do not want to confirm exist).
- **Tenancy.** In multi-tenant apps, every query includes \`tenantId\` (from the verified session/token, never from an untrusted body). Cross-tenant leaks are the SaaS equivalent of IDOR.
- **Deny by default.** New endpoints ship without authorization until you add a check — so make the guard part of your route boilerplate, and add tests that assert 401/403 for outsider users on every mutation.
- **Server is the policy engine.** Hiding buttons on the client is UX, not security.

Attributes beyond ownership (time of day, device trust, resource state like “draft vs published”) move you toward ABAC — same middleware shape, richer predicate.
    `,
    howItWorks: `
A protected mutation runs three gates:

1. **Authenticate** → \`req.user\`.
2. **Permission check** → does the user's role grant \`"post:update:own"\` or \`"post:update"\`? (Map lookup — cheap, no I/O.)
3. **Resource scope** → load the post with \`{ _id, authorId: req.user.id }\` (or load then compare owner if the route allows editing any post). Zero rows → 404/403. Rows returned → proceed.

Because step 3 bakes the owner into the query itself, even a forgotten \`if\` in the handler cannot leak another user's row — defense in depth. Policy tests then assert the matrix: owner→200, other user→403/404, anonymous→401, admin (if allowed)→200.
    `,
    codeExamples: [
      {
        title: "Permission map + ownership-scoped query",
        language: "ts",
        code: `const ROLE_PERMISSIONS: Record<string, string[]> = {
  user: ["post:create", "post:read", "post:update:own", "post:delete:own"],
  editor: ["post:create", "post:read", "post:update", "post:delete"],
  admin: ["*"],
};

export function can(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!can(req.user.role, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

router.patch(
  "/posts/:id",
  authenticate,
  requirePermission("post:update:own"),
  async (req, res) => {
    // Scope by owner in the query itself — prevents IDOR even if a later
    // check is forgotten.
    const post = await db.posts.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user.id },
      { $set: { title: req.body.title } },
      { new: true },
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  },
);`,
        description:
          "Coarse permission strings gate the route; the owner filter inside the query provides a second, structural layer against IDOR.",
      },
      {
        title: "Ownership compare for mixed “own vs any” rules",
        language: "ts",
        code: `export async function authorizePostAction(
  req: Request,
  postId: string,
  action: "update" | "delete",
) {
  const post = await db.posts.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  const isOwner = post.authorId === req.user.id;
  const allowed =
    can(req.user.role, \`post:\${action}\`) || // e.g. editor: "post:update"
    (isOwner && can(req.user.role, \`post:\${action}:own\`));

  if (!allowed) throw new ForbiddenError();
  return post;
}`,
        description:
          "Grant “any” permissions via role, “own” permissions via ownership — the pattern behind most content-management rules.",
      },
    ],
    commonMistakes: [
      "IDOR: querying by id alone and trusting that only owners will call the endpoint.",
      "Taking tenantId or ownerId from the request body instead of the verified identity.",
      "Returning 403 for resources that belong to someone else, confirming the id exists — prefer 404 when existence is sensitive.",
      "Adding ownership logic in some routes but not their siblings (GET vs PATCH asymmetry).",
    ],
    bestPractices: [
      "Encode owner/tenant filters in the database query itself, not only in a preceding if-statement.",
      "Write policy tests for the full matrix: anonymous, owner, other user, privileged role.",
      "Keep permission strings centralized so audits are a single-file review.",
    ],
    realWorldUseCases: [
      "Task app: users edit only their tasks; workspace admins edit any task in their workspace.",
      "E-commerce: customers read only their orders; support agents read any order within their region.",
    ],
    resources: [
      docs("OWASP Top 10 — Broken Object Level Authorization", "https://owasp.org/Top10/A1_2021-Broken_Object_Level_Authorization/", "Root cause and prevention of object-level authorization failures."),
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "API-focused risk categories including BFLA and BOLA."),
      ytSearch(
        "IDOR prevention ownership check express",
        "Practical fixes for insecure direct object references in REST APIs.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-idor-fix",
        title: "Fix the IDOR",
        prompt:
          "This handler leaks other users' invoices — it calls db.invoices.findById(req.params.id) with no owner filter and returns the row directly. Rewrite it so a non-owner receives 404 and cannot confirm invoice ids exist. Add a regression test using two users.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Add userId: req.user.id to the filter object",
          "Decide one response for 'not yours' vs 'does not exist' and be consistent",
        ],
        solution: `// Fixed — scope by owner in the query
app.get("/invoices/:id", authenticate, async (req, res) => {
  const inv = await db.invoices.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!inv) return res.status(404).json({ error: "Invoice not found" });
  res.json(inv);
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p2m6-policy-matrix",
        title: "Write a policy matrix test",
        prompt:
          "For a blog API, write a table: roles (anonymous, author, other-user, editor) × actions (create, update own, update other, delete other) with expected status codes. Then implement it as parameterized tests.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "anonymous → 401 on everything protected",
          "author updating another author's post → 403 or 404",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-inventory-api", "p2-blog-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-protected-routes",
    slug: "protected-routes",
    title: "Protected Routes with Middleware",
    description:
      "Composing authenticate and authorize middleware into a fail-closed pipeline, with correct 401/403 semantics and route grouping.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["middleware", "express", "route-protection", "401-403"],
    prerequisites: ["p2m6-jwt-access-tokens", "p2m2-middleware"],
    relatedTopics: ["p2m6-auth-vs-authz", "p2m6-role-based-access-control", "p2m6-auth-error-handling"],
    learningObjectives: [
      "Structure a fail-closed authenticate middleware",
      "Apply middleware per-route and per-router group",
      "Distinguish 401 vs 403 consistently across the API",
      "Debug middleware ordering bugs (auth running after handlers, etc.)",
    ],
    simpleExplanation:
      "A protected route is a pipeline: first a shared authenticate middleware resolves the user, then optional authorization guards check roles or permissions, and only then your handler runs. Express lets you attach these middlewares per route or to an entire router, so the policy is visible in code. The pipeline must fail closed — if identity is missing, reject with 401; if identity is fine but the action is denied, reject with 403.",
    detailedContent: `
**The pipeline shape:**

\`authenticate → [requireRole / requirePermission] → validateParams → handler\`

- **One authenticate for the whole app.** Credential parsing, JWT verification and session lookup belong in a single middleware that sets \`req.user\` or responds 401. Route handlers should never parse the \`Authorization\` header themselves.
- **401 vs 403.**

  | Situation                                    | Status |
  | -------------------------------------------- | ------ |
  | No credential at all                         | 401    |
  | Malformed / expired / bad-signature token    | 401    |
  | Valid identity, not allowed for this route   | 403    |
  | Valid identity, resource belongs to someone else | 403 or 404 |

  Some teams include a \`WWW-Authenticate\` header on 401 responses (RFC 9110) — helpful for API clients.
- **Grouping.** Mount protection on a sub-router once: \`router.use(authenticate)\` then define all routes. This prevents the classic “forgot the middleware on the new endpoint” failure.
- **Fail closed on ordering bugs.** If a handler assumes \`req.user\` exists but the middleware was skipped, return 401 rather than continuing with \`undefined\` — otherwise you get 500s or, worse, data leaks.
- **Public routes are explicit.** Health checks, login/register, and marketing endpoints live on routers without \`authenticate\`. Everything else requires it by default.

Express 5 async handlers propagate rejected promises to your error middleware automatically; with Express 4 wrap async handlers or use a wrapper so thrown auth errors do not hang requests.
    `,
    howItWorks: `
Concrete request to \`PATCH /projects/9\`:

1. Router-level \`authenticate\` runs first (registered via \`router.use\`).
2. It reads \`Authorization: Bearer …\`, verifies the JWT, sets \`req.user = { id, role }\`, calls \`next()\`. On failure it responds 401 immediately — later middlewares never run.
3. Route-level \`requirePermission("project:update:own")\` runs; denial → 403 response.
4. A small \`loadProject\` middleware fetches the project scoped to the user; miss → 404.
5. The final handler receives a request where identity, permission and resource are all pre-validated — it only applies the update.

Express executes middlewares in registration order, so the pipeline is deterministic and easy to reason about.
    `,
    codeExamples: [
      {
        title: "Fail-closed authenticate middleware",
        language: "ts",
        code: `import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    req.user = { id: String(payload.sub), role: String(payload.role) };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional helper for async routes on Express 4:
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);`,
        description:
          "Every failure path responds 401 and never calls next() — the pipeline fails closed by construction.",
      },
      {
        title: "Protect a whole router group",
        language: "ts",
        code: `import { Router } from "express";

const projects = Router();

// Everything under /projects requires authentication.
projects.use(authenticate);

projects.get("/", listProjects); // any authenticated user
projects.get("/:id", requirePermission("project:read"), getProject);
projects.patch(
  "/:id",
  requirePermission("project:update:own"),
  asyncHandler(updateProject),
);
projects.delete("/:id", requireRole("admin"), asyncHandler(deleteProject));

// Public router stays separate and explicit:
const publicRoutes = Router();
publicRoutes.post("/login", asyncHandler(login));
publicRoutes.get("/health", (req, res) => res.json({ ok: true }));

app.use("/projects", projects);
app.use("/auth", publicRoutes);`,
        description:
          "router.use(authenticate) protects the group once; public endpoints live on a separate, obviously-unprotected router.",
      },
    ],
    commonMistakes: [
      "Protecting most routes but forgetting middleware on newly added ones — group-level router.use reduces this risk.",
      "Returning 403 for missing credentials, which breaks clients that treat 401 as 'refresh your token'.",
      "Re-parsing the Authorization header inside every handler instead of trusting req.user set by middleware.",
      "Async handlers that throw without an error-handling wrapper on Express 4, causing hung requests.",
    ],
    bestPractices: [
      "Use router.use(authenticate) per resource group and keep truly public routes on their own router.",
      "Standardize 401 for credential failures and 403 for authorization failures across all error responses.",
      "Add smoke tests that hit every registered route without a token and assert it is not accidentally public.",
    ],
    realWorldUseCases: [
      "Versioned APIs (/v1/projects) where the entire version is authenticated except /v1/auth/*.",
      "Internal microservices that authenticate machine tokens with the same middleware shape as user tokens.",
    ],
    resources: [
      docs("Express — API reference (Router, middleware)", OFFICIAL.expressApi, "Order of execution for app.use, router.use and route handlers."),
      docs("RFC 9110 — HTTP semantics", OFFICIAL.rfcHttp, "Normative definitions of 401 Unauthorized and 403 Forbidden."),
      ytSearch(
        "express protect routes middleware auth",
        "Building reusable auth middleware and securing route groups.",
        "en",
        "10–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-protect-api",
        title: "Lock down a resource router",
        prompt:
          "Take any API you built earlier (task or blog). Move all routes behind authenticate except register/login/health. For each mutation, add the appropriate role/ownership guard, then run a no-token sweep test asserting no 200s.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "router.use(authenticate) once at the top of the resource router",
          "Parameterize the sweep test over a list of method+path pairs",
        ],
      },
      {
        id: "ex-p2m6-status-codes",
        title: "Audit your status codes",
        prompt:
          "List every auth-related response your API currently returns. Check each against the 401/403/404 table in this lesson and fix inconsistencies (e.g. 401 after a valid login for a role problem).",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: ["401 = identity problem, 403 = permission problem, 404 = hide existence of others' resources"],
      },
    ],
    projectIds: ["p2-auth-api", "p2-task-api", "p2-url-shortener"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-password-reset",
    slug: "password-reset-flow",
    title: "Password Reset Flow",
    description:
      "Secure forgot-password flows: single-use expiring tokens, anti-enumeration responses, and invalidating sessions after a reset.",
    order: 10,
    estimatedMinutes: 22,
    tags: ["password-reset", "tokens", "email", "account-recovery"],
    prerequisites: ["p2m6-registration-login", "p2m6-password-hashing"],
    relatedTopics: ["p2m6-email-verification", "p2m6-account-security", "p2m6-auth-error-handling"],
    learningObjectives: [
      "Implement a forgot-password endpoint that resists user enumeration",
      "Generate, hash, and expire single-use reset tokens",
      "Complete the reset: update the hash and revoke all sessions",
      "Apply rate limits and clean UX without leaking account state",
    ],
    simpleExplanation:
      "A password reset flow lets a user prove control of their email inbox, then choose a new password. The server creates a random single-use token, stores only its hash with a short expiry, emails a link, and on submission verifies the token before hashing and saving the new password. Crucially, the “email sent” response must look identical whether or not the address exists, and completing a reset should log out every device.",
    detailedContent: `
**Request phase (\`POST /forgot-password\`):**

1. Validate the email shape. Always respond **200** with a generic body (“If an account exists for that email, we've sent reset instructions”) — for known and unknown addresses alike. This closes user enumeration via status codes and messages.
2. If the user exists: generate \`crypto.randomBytes(32).toString("base64url")\` — high entropy, not guessable.
3. **Store a hash** (\`sha256\`) of the token with \`expiresAt = now + 15–30 min\` and \`usedAt = null\`. Storing the raw token in the DB is an unnecessary risk if the DB leaks.
4. Rate-limit per IP and per email: reset abuse enables mailbox bombing and online attacks.
5. Send the link over email: \`https://app.example.com/reset-password?token=…\`. Never log the token (redact query strings in request logs).

**Reset phase (\`POST /reset-password\`):**

1. Hash the incoming token, look it up, check expiry and \`usedAt\`.
2. Mark the token used **immediately** (single-use), then hash the new password with bcrypt/argon2 and update the user record.
3. **Revoke all sessions and refresh-token families** for that user — otherwise a thief who triggered the reset keeps their access.
4. Optionally force re-login everywhere and send a “your password was changed” notification email.

Pitfalls: long-lived reset tokens, tokens in the URL query (may leak via \`Referer\` headers — prefer short links or POST-only token submission), and letting the reset form reveal password-policy details only after token validation (keep policy public instead).
    `,
    howItWorks: `
End-to-end sequence:

1. User clicks “Forgot password”, submits email.
2. Server: validate → find user → create \`{ tokenHash, userId, expiresAt, usedAt: null }\` → enqueue email job → respond 200 (generic).
3. User clicks the emailed link; the SPA collects a new password and \`POST /reset-password\` with the token.
4. Server hashes the token, finds the row, verifies not expired/used, marks used, bcrypt-hashes the new password, updates the user, deletes all sessions and refresh tokens for the user.
5. User logs in fresh; thief's old tokens are dead.

Timing note: for unknown emails, skip the DB write but keep the HTTP response and rough timing identical (optionally perform a dummy hash operation).
    `,
    codeExamples: [
      {
        title: "Forgot password: generic 200 + hashed single-use token",
        language: "ts",
        code: `import crypto from "node:crypto";

app.post("/forgot-password", rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  const email = String(req.body.email ?? "").toLowerCase().trim();
  const user = await db.users.findByEmail(email);

  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await db.resetTokens.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
      usedAt: null,
    });
    await emailQueue.enqueue({
      to: user.email,
      template: "password-reset",
      link: \`https://app.example.com/reset-password?token=\${token}\`,
    });
  }

  // Identical response whether or not the account exists.
  res.json({ message: "If an account exists for that email, reset instructions were sent." });
});`,
        description:
          "Random 256-bit token, SHA-256 at rest, 20-minute expiry, and an enumeration-safe response body.",
      },
      {
        title: "Reset: single-use token, re-hash, revoke sessions",
        language: "ts",
        code: `app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (typeof token !== "string" || typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await db.resetTokens.findValid(tokenHash); // not used, not expired

  if (!record) {
    return res.status(400).json({ error: "Reset link is invalid or has expired" });
  }

  // Single-use: mark before the slow hash so concurrent replays fail.
  await db.resetTokens.markUsed(record.id);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.users.updatePassword(record.userId, passwordHash);

  // Kill any stolen sessions/tokens from before the reset.
  await db.sessions.deleteAllForUser(record.userId);
  await db.refreshTokens.deleteAllForUser(record.userId);

  res.json({ message: "Password updated. Please sign in again." });
});`,
        description:
          "Mark-used first, then re-hash the password, then revoke every session and refresh family for the account.",
      },
    ],
    commonMistakes: [
      "Returning 404 for unknown emails on /forgot-password — instant account enumeration.",
      "Storing raw reset tokens in the database or writing them to logs/analytics.",
      "Allowing reset tokens to be reused (not marking usedAt), or giving them multi-day lifetimes.",
      "Updating the password without revoking existing sessions and refresh tokens.",
    ],
    bestPractices: [
      "Respond generically and identically for existing and non-existing accounts; rate-limit both phases.",
      "Hash reset tokens at rest, expire in 15–30 minutes, enforce single use.",
      "Revoke all sessions/refresh tokens on successful reset and email the user about the change.",
    ],
    realWorldUseCases: [
      "Consumer apps: self-service recovery that never requires support to see or set a password.",
      "Enterprise tools: reset links that also force MFA re-enrollment when policy requires it.",
    ],
    resources: [
      docs(
        "OWASP Forgot Password Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html",
        "Step-by-step secure design for account recovery flows.",
      ),
      docs("Node.js crypto API", "https://nodejs.org/api/crypto.html", "randomBytes and createHash for token generation and hashing."),
      docs("OWASP Session Management Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "Session revocation after privilege events."),
      ytSearch(
        "password reset flow node express tutorial",
        "Full forgot-password implementations with expiring tokens.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-reset-flow",
        title: "Build the full reset flow",
        prompt:
          "Implement /forgot-password and /reset-password per this lesson: generic 200s, hashed 20-minute single-use tokens, bcrypt re-hash, and session revocation. Write tests for: unknown email (200 + no token row), happy path, expired token (400), and token reuse (400).",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "sha256(token) is what you store and look up",
          "Mark usedAt before hashing the new password to stop concurrent replays",
        ],
      },
      {
        id: "ex-p2m6-reset-abuse",
        title: "Harden against reset abuse",
        prompt:
          "Add per-IP and per-email rate limits to /forgot-password (e.g. 5 per 15 minutes). Explain how you would avoid letting the limiter itself become an enumeration oracle (e.g. same 200 response when throttled, or bucket by hash of email).",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "express-rate-limit supports custom keyGenerator",
          "Return the same generic body when the limit is hit",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-job-board-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-email-verification",
    slug: "email-verification",
    title: "Email Verification",
    description:
      "Proving an inbox belongs to the registrant: verification tokens, resend throttling, and gating unverified accounts.",
    order: 11,
    estimatedMinutes: 16,
    tags: ["email-verification", "signup", "tokens", "onboarding"],
    prerequisites: ["p2m6-registration-login"],
    relatedTopics: ["p2m6-password-reset", "p2m6-account-security", "p2m6-registration-login"],
    learningObjectives: [
      "Design a verification-token flow similar to password reset but distinct in purpose",
      "Mark accounts verified with a timestamp and enforce gating rules",
      "Throttle resend requests without enabling enumeration",
      "Handle token expiry and re-request UX",
    ],
    simpleExplanation:
      "Right after signup you send a one-time link to the user's inbox. Clicking it proves they control that email address, so the server sets a verified flag (ideally with a timestamp). Until then the account can be restricted — no posts, no purchases, no password resets. The token mechanics are almost identical to password reset: random, hashed at rest, short-lived, single-use.",
    detailedContent: `
Why verify at all?

- **Deliverability & abuse.** Unverified signups enable spam floods from throwaway or mistyped addresses.
- **Reset safety.** If passwords can be reset by email, an unverified address means anyone can squat an inbox variant and take over accounts.
- **Compliance/trust.** Many products need a confirmed contact channel for receipts and security notices.

**Design:**

1. On registration, create the user with \`emailVerifiedAt: null\` and a verification token record (\`sha256(token)\`, expiry 24–48 hours, single-use). Send the email asynchronously — never block the HTTP response on the SMTP provider.
2. \`GET/POST /verify-email\` with the token: hash, lookup, check expiry/use, set \`emailVerifiedAt = new Date()\`, mark token used. Idempotent success page (“already verified”) is friendlier than a scary error when users click twice.
3. **Resend** (\`POST /auth/resend-verification\`): rate-limit per email (e.g. 3 per hour) and per IP. Return the same generic 200 as registration so it cannot probe accounts.
4. **Gating:** middleware \`requireVerifiedEmail\` on sensitive routes (create post, checkout, change email). Login may still succeed with a limited session, or you may return 403 with a specific error code like \`email_not_verified\` so the client can show a banner — that reveals nothing an attacker with the password does not already know.
5. **Changing email later** un-verifies the new address and repeats the flow; never trust a client-supplied “verified: true”.

Security details: single-use tokens prevent replay; hashing at rest protects against DB leaks; expiry limits the attack window; never log the raw token.
    `,
    howItWorks: `
Typical lifecycle:

1. \`POST /register\` → user row + token row created → email job enqueued → 201.
2. Mailer sends \`https://app.example.com/verify?token=…\`.
3. User clicks; backend hashes the token, finds the row, checks \`usedAt == null && expiresAt > now\`.
4. Sets \`emailVerifiedAt\`, marks token used, optionally logs the user in and redirects to onboarding.
5. Expired link → show “resend” UI; \`POST /resend-verification\` issues a fresh token (invalidating older ones) under rate limits.

Because verification only proves inbox control, keep its privileges narrow — it is not authentication by itself.
    `,
    codeExamples: [
      {
        title: "Issue and consume verification tokens",
        language: "ts",
        code: `import crypto from "node:crypto";

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

export async function createVerificationFor(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await db.verificationTokens.deleteForUser(userId); // one active token max
  await db.verificationTokens.create({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    usedAt: null,
  });
  await emailQueue.enqueue({
    to: email,
    template: "verify-email",
    link: \`https://app.example.com/verify?token=\${token}\`,
  });
}

app.get("/verify", async (req, res) => {
  const token = String(req.query.token ?? "");
  const record = await db.verificationTokens.findValid(sha256(token));
  if (!record) {
    return res.status(400).json({ error: "Verification link is invalid or expired" });
  }
  await db.verificationTokens.markUsed(record.id);
  await db.users.update(record.userId, { emailVerifiedAt: new Date() });
  res.json({ message: "Email verified" });
});`,
        description:
          "Single active token per user, 48-hour expiry, hashed at rest, consumed once and replaced by a timestamp on the user.",
      },
      {
        title: "Gate sensitive routes on verification",
        language: "ts",
        code: `export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (!req.user.emailVerifiedAt) {
    return res
      .status(403)
      .json({ error: "Email verification required", code: "email_not_verified" });
  }
  next();
}

router.post("/posts", authenticate, requireVerifiedEmail, createPost);`,
        description:
          "A typed error code lets the frontend show a 'verify your email' banner while keeping the API consistent.",
      },
    ],
    commonMistakes: [
      "Sending verification emails synchronously in the request handler and timing out when the provider is slow.",
      "Accepting a verified flag from the client instead of consuming a server-issued token.",
      "Unbounded resend endpoints that become email-bombing or enumeration tools.",
      "Forgetting to re-verify when the user changes their email address.",
    ],
    bestPractices: [
      "Mirror the password-reset token pattern: random, hashed at rest, expiring, single-use.",
      "Queue emails asynchronously and provide a throttled resend endpoint with generic responses.",
      "Stamp emailVerifiedAt (not just a boolean) for auditability and support.",
    ],
    realWorldUseCases: [
      "Marketplaces that block listings until the seller confirms a reachable email.",
      "Newsletters and forums reducing spam registrations with double opt-in verification.",
    ],
    resources: [
      docs(
        "OWASP Forgot Password Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html",
        "Token hygiene practices shared by reset and verification flows.",
      ),
      docs("Node.js crypto API", "https://nodejs.org/api/crypto.html", "Generating high-entropy tokens and hashing them at rest."),
      ytSearch(
        "email verification flow express node",
        "Building verify-email endpoints with expiring tokens and resend limits.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-verify-endpoint",
        title: "Add verification to registration",
        prompt:
          "Extend your register endpoint to create a verification token and enqueue an email. Implement /verify and a rate-limited /resend-verification. Gate POST /posts with requireVerifiedEmail and test the unverified 403 path.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Set emailVerifiedAt to a Date, not just true",
          "Resend should invalidate previous tokens (deleteForUser then create)",
        ],
      },
      {
        id: "ex-p2m6-double-click",
        title: "Handle double-clicks gracefully",
        prompt:
          "A user clicks the verification link, then their mail client prefetches it again. Decide the second-click response (friendly success vs 400) and implement idempotent behavior without weakening single-use semantics for attackers.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "If the user is already verified, return success without touching tokens",
          "Do not mark a token 'valid again' — just special-case the already-verified state",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-blog-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-oauth-fundamentals",
    slug: "oauth-2-fundamentals",
    title: "OAuth 2.0 & OIDC Fundamentals",
    description:
      "Delegated authorization with OAuth 2.0, identity with OIDC, the authorization-code + PKCE flow, and why the implicit flow is retired.",
    order: 12,
    estimatedMinutes: 25,
    tags: ["oauth", "oidc", "sso", "pkce", "third-party-auth"],
    prerequisites: ["p2m6-auth-vs-authz", "p1m1-rest"],
    relatedTopics: ["p2m6-auth-vs-authz", "p2m6-jwt-access-tokens", "p2m6-secure-cookie-config"],
    learningObjectives: [
      "Distinguish OAuth 2.0 (authorization) from OIDC (identity on top of OAuth)",
      "Walk through the authorization-code flow with PKCE step by step",
      "Explain the security roles of state, nonce, scopes, and client_secret",
      "Reject insecure patterns (implicit flow, tokens in query strings, secrets in the SPA)",
    ],
    simpleExplanation:
      "OAuth 2.0 lets a user grant your app limited access to another service without handing you their password — think “Sign in with Google” or “connect your calendar”. Your app redirects the user to the provider, they approve scopes, and you receive short-lived tokens. OpenID Connect (OIDC) is a standardized layer on OAuth that also gives you the user's identity (id token). The modern safe pattern is authorization-code + PKCE, done mostly server-side.",
    detailedContent: `
Key terms:

- **Resource owner** — the user.
- **Client** — your app (with \`client_id\`, and for confidential clients a \`client_secret\` from env).
- **Authorization server** — Google, GitHub, Auth0, etc.
- **Resource server / API** — the API holding the user's data.
- **Scope** — granular consent: \`openid profile email\`, \`calendar.readonly\`. Request the minimum.
- **Authorization code** — short-lived, single-use code returned to your redirect URI.
- **Access token** — bearer credential for the provider API.
- **ID token (OIDC)** — JWT proving identity to *your* app; verify signature, \`iss\`, \`aud\`, \`nonce\`.

**Authorization-code + PKCE flow:**

1. Client generates \`code_verifier\` (random) and \`code_challenge = BASE64URL(SHA256(verifier))\`.
2. Redirect user to the provider: \`response_type=code\`, \`client_id\`, \`redirect_uri\`, \`scope\`, \`state\` (CSRF guard), \`code_challenge\` (+ method \`S256\`).
3. User authenticates and consents at the provider.
4. Provider redirects to your \`redirect_uri\` with \`code\` and \`state\`.
5. Server verifies \`state\`, then POSTs to the token endpoint with \`code\`, \`code_verifier\`, \`client_secret\` — the challenge proves the exchange comes from the original initiator, which protects public clients (SPAs/mobile) that cannot keep a secret.
6. Receive access token (+ ID token). Verify the ID token claims, map/link the user (\`sub\` + provider), then issue **your own** session or JWT pair. Never accept a provider token as your app's session by itself.

**Avoid:** implicit flow (tokens in the URL fragment — retired for most cases), putting \`client_secret\` in frontend code, tokens in query strings or logs, and trusting provider access tokens forever (refresh/revoke per provider rules).

“Sign in with X” is OIDC (identity). “Connect your calendar so we can create events” is OAuth scopes (authorization). They often appear together.
    `,
    howItWorks: `
Concrete “Sign in with Google” server-side flow:

1. \`GET /auth/google\` → 302 to Google's \`/o/oauth2/v2/auth\` with your client_id, redirect_uri, scope (\`openid email profile\`), state, PKCE challenge, nonce.
2. User finishes at Google; browser lands on \`GET /auth/google/callback?code=…&state=…\`.
3. Server checks \`state\` matches the value stashed (short-lived, HttpOnly cookie or cache entry).
4. Server exchanges the code at \`https://oauth2.googleapis.com/token\` (server-to-server) with client_secret + verifier.
5. Server receives \`access_token\`, \`id_token\`. Verifies the ID token (JWKS from provider, issuer, audience, nonce, exp).
6. Finds or creates a local user keyed by (\`provider\`, \`sub\`), creates a local session/token pair, redirects the browser into the app.

Only steps 4–5 hold provider credentials; the browser never sees the \`client_secret\`.
    `,
    codeExamples: [
      {
        title: "Start the flow: state + PKCE",
        language: "ts",
        code: `import crypto from "node:crypto";

const b64url = (buf: Buffer) => buf.toString("base64url");

app.get("/auth/google", (req, res) => {
  const state = b64url(crypto.randomBytes(16));
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());

  res.cookie("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600_000 });
  res.cookie("pkce_verifier", verifier, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600_000 });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: "https://app.example.com/auth/google/callback",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  res.redirect(\`https://accounts.google.com/o/oauth2/v2/auth?\${params.toString()}\`);
});`,
        description:
          "state and the PKCE verifier ride in HttpOnly cookies; only the challenge goes to the provider.",
      },
      {
        title: "Exchange the code server-side",
        language: "ts",
        code: `app.get("/auth/google/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state || state !== req.cookies.oauth_state) {
    return res.status(400).json({ error: "Invalid OAuth callback" });
  }
  const verifier = req.cookies.pkce_verifier;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET, // env only — never in the SPA bundle
      redirect_uri: "https://app.example.com/auth/google/callback",
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return res.status(502).json({ error: "Provider token exchange failed" });
  const tokens = (await tokenRes.json()) as { access_token: string; id_token: string };

  // Verify id_token (JWKS, iss, aud, nonce) before trusting its claims.
  const claims = await verifyGoogleIdToken(tokens.id_token);
  const user = await findOrCreateOAuthUser({ provider: "google", sub: claims.sub, email: claims.email });

  // Issue YOUR session/token pair — do not forward provider tokens to the client.
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    res.clearCookie("pkce_verifier");
    res.redirect("/app");
  });
});`,
        description:
          "Code exchange happens only on the server; local session issued after ID-token verification.",
      },
    ],
    commonMistakes: [
      "Skipping the state parameter — leaves the callback open to CSRF login attacks.",
      "Shipping client_secret to the browser or embedding it in a public SPA bundle.",
      "Trusting provider claims without verifying the ID token signature, issuer and audience.",
      "Reusing the authorization code or accepting tokens delivered in the URL fragment (implicit flow).",
    ],
    bestPractices: [
      "Use authorization-code + PKCE for all new integrations; treat implicit as legacy.",
      "Request the narrowest scopes and keep provider access tokens server-side.",
      "Link accounts by (provider, sub) pairs rather than email alone (emails can change or be recycled).",
    ],
    realWorldUseCases: [
      "“Sign in with Google/GitHub” reducing signup friction while keeping password storage out of your app.",
      "Integrations: a job board connecting to a calendar API with calendar.readonly scope on behalf of a user.",
    ],
    resources: [
      docs("OAuth 2.0 (official site)", "https://oauth.net/2/", "Core specification overview, grants and security topics."),
      docs("RFC 6749 — OAuth 2.0", "https://www.rfc-editor.org/rfc/rfc6749", "The normative authorization-framework specification."),
      docs("Auth0 — OAuth 2.0", "https://auth0.com/docs/authenticate/protocols/oauth", "Practical flow explanations including PKCE."),
      ytSearch(
        "oauth 2.0 authorization code pkce flow explained",
        "Visual walkthroughs of redirect, code exchange and token verification.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-oauth-map",
        title: "Map the flow on paper",
        prompt:
          "Draw or write the authorization-code + PKCE flow with every party (browser, your server, provider). Label where state is created/checked, where the code_verifier lives, and where client_secret is used. Mark every hop that must be HTTPS.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "state: created by you, checked on callback",
          "client_secret: only in the server-to-server token exchange",
        ],
      },
      {
        id: "ex-p2m6-link-account",
        title: "Implement account linking",
        prompt:
          "Write findOrCreateOAuthUser({ provider, sub, email }) that finds by (provider, sub), creates a user if missing, and handles the edge case where the same email already has a password account — decide and justify whether to auto-link, require a logged-in confirmation, or refuse.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Auto-linking by email alone enables account takeover if the provider did not verify the email",
          "Safer: require the user to authenticate with their existing credentials to confirm linking",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-blog-api", "p2-job-board-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-secure-cookie-config",
    slug: "secure-cookie-configuration",
    title: "Secure Cookie Configuration",
    description:
      "HttpOnly, Secure, SameSite, Path, prefixes and lifetimes — the full checklist for session and refresh cookies that resist XSS and CSRF.",
    order: 13,
    estimatedMinutes: 18,
    tags: ["cookies", "httponly", "samesite", "secure-flags", "xss", "csrf"],
    prerequisites: ["p1m1-cookies", "p2m6-sessions-cookies"],
    relatedTopics: ["p2m6-csrf-protection", "p2m6-refresh-tokens-rotation", "p2m6-jwt-access-tokens"],
    learningObjectives: [
      "Set HttpOnly, Secure, SameSite, Path, Max-Age correctly in Express",
      "Choose SameSite=Lax vs Strict vs None for your flow",
      "Use __Host- and __Secure- cookie name prefixes",
      "Explain what each flag does and does not protect against",
    ],
    simpleExplanation:
      "A cookie is a few bytes the browser stores and resends automatically — so every attribute matters. HttpOnly stops JavaScript from reading it (XSS mitigation), Secure forces HTTPS-only transmission, and SameSite controls whether the browser attaches it on cross-site requests (CSRF mitigation). Get the combination right and your session cookie becomes much harder to steal or abuse.",
    detailedContent: `
Cookie attributes and their security roles:

| Attribute           | Effect                                                     | Protects against   |
| ------------------- | ---------------------------------------------------------- | ------------------ |
| \`HttpOnly\`         | \`document.cookie\` cannot read it; only sent with HTTP     | XSS token theft    |
| \`Secure\`           | Sent only over HTTPS                                       | Network sniffing   |
| \`SameSite\`         | Controls sending on cross-site requests (Lax/Strict/None)  | CSRF (mostly)      |
| \`Path\`             | Limits which paths receive the cookie                      | Exposure surface   |
| \`Domain\`           | Cookie scope; prefer host-only (omit Domain)               | Over-broad sharing |
| \`Max-Age\`/\`Expires\`| Lifetime; session cookies die on browser close             | Indefinite validity|

**SameSite choice:**

- **Lax** (good default): cookie sent on top-level GET navigations (so emailed links work), withheld on cross-site POSTs/XHR — strong CSRF reduction with usable UX.
- **Strict** (strongest): never sent cross-site; breaks “log in via link” flows.
- **None**: sent cross-site — **requires \`Secure\`** and is only for deliberate embeds (OAuth popups, SSO widgets) paired with explicit CSRF tokens.

**Prefixes.** Names starting with \`__Host-\` must be \`Secure\`, \`Path=/\`, and must not set \`Domain\` — the browser enforces this, blocking subdomain cookie-tossing attacks. Use \`__Host-sid\` for session cookies when you control the whole site. \`__Secure-\` only requires \`Secure\`.

**Express specifics.** \`cookie-parser\` needed to read cookies; \`res.cookie(name, value, options)\` to set; \`res.clearCookie\` with matching path/domain on logout. For cookies containing sensitive identifiers prefer \`signed: true\` with \`process.env.COOKIE_SECRET\` (note: signed ≠ encrypted — contents are still readable, just tamper-evident).

**What these flags do NOT fix:** an XSS bug that runs attacker JS in your origin can still make authenticated requests (even without reading the cookie). Fix XSS at the source; cookie flags only reduce blast radius.
    `,
    howItWorks: `
When the browser receives \`Set-Cookie: __Host-sid=abc; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800\`:

1. It stores the cookie keyed by host (no Domain → host-only) and path \`/\`.
2. On any HTTPS request to that host, it includes \`Cookie: __Host-sid=abc\` automatically.
3. On a cross-site POST from evil.example, Lax withholds the cookie — the server sees no session → CSRF fails.
4. In-page JS cannot read \`abc\` because HttpOnly set the inaccessible flag.
5. After Max-Age the cookie evaporates; if omitted entirely it becomes a session cookie deleted on browser close.

Refresh cookies should further narrow \`Path=/auth\` so the browser only attaches them to your refresh endpoint.
    `,
    codeExamples: [
      {
        title: "Hardened session cookie (Express)",
        language: "ts",
        code: `app.use(
  session({
    secret: process.env.SESSION_SECRET,
    name: "__Host-sid", // Secure + Path=/ + no Domain, enforced by the browser
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // always true in prod; localhost http allowed in dev
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    // ... store, resave, saveUninitialized
  }),
);`,
        description:
          "A production-ready combination: host-prefixed name, HttpOnly, Secure, SameSite=Lax, explicit lifetime.",
      },
      {
        title: "Refresh cookie scoped to /auth, Strict SameSite",
        language: "ts",
        code: `res.cookie("refreshToken", newToken, {
  httpOnly: true,
  secure: true,
  sameSite: "strict", // refresh endpoint never needs cross-site sends
  path: "/auth",      // only /auth/refresh receives it
  maxAge: 1000 * 60 * 60 * 24 * 30,
});

// Logout — clearCookie must repeat the same path/flags or removal fails
res.clearCookie("refreshToken", {
  path: "/auth",
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});`,
        description:
          "Matching clearCookie options guarantee the browser actually removes the cookie on logout.",
      },
    ],
    commonMistakes: [
      "Omitting Secure in production because “we terminate TLS at the proxy” — the browser still needs the flag to refuse plain HTTP.",
      "Forgetting SameSite=None requires Secure; browsers reject the cookie otherwise.",
      "clearCookie with a different path than res.cookie, so logout silently fails.",
      "Storing the JWT in localStorage ‘because cookies are complicated’, ignoring XSS exfiltration.",
    ],
    bestPractices: [
      "Default: HttpOnly + Secure + SameSite=Lax + Path=/ + explicit Max-Age; tighten to Strict/Path-scoped for refresh tokens.",
      "Prefix high-value cookies with __Host- whenever the deployment allows it.",
      "Centralize cookie options in one shared module so every Set-Cookie path uses the same hardened defaults.",
    ],
    realWorldUseCases: [
      "Any session-based web app: one shared cookie-options module used by express-session and manual res.cookie calls.",
      "SPA + API split domains: cookies need Secure + SameSite=None plus CSRF defenses, or you accept header-only tokens.",
    ],
    resources: [
      docs("MDN — HTTP cookies", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", "Attribute reference including SameSite semantics and prefixes."),
      docs("Express — res.cookie", "https://expressjs.com/en/api.html#res.cookie", "Official option list for setting cookies in Express."),
      docs("OWASP Session Management Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "Recommended cookie attributes for session identifiers."),
      ytSearch(
        "cookie flags httponly secure samesite explained",
        "Browser-behavior demos of each flag and cross-site scenarios.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-cookie-audit",
        title: "Audit Set-Cookie output",
        prompt:
          "Log every Set-Cookie your app emits (login, refresh, logout). Verify each has the intended HttpOnly/Secure/SameSite/Path/Max-Age. Write the one-line fix for any cookie missing flags.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "Express: res.cookie options must match clearCookie options",
          "Dev over http://localhost needs secure:false only in dev",
        ],
      },
      {
        id: "ex-p2m6-samesite-matrix",
        title: "SameSite decision matrix",
        prompt:
          "For cookies named session, refreshToken and csrf, choose Lax/Strict/None and justify each in one sentence, considering emailed login links and OAuth redirects.",
        difficulty: "intermediate",
        estimatedMinutes: 12,
        hints: [
          "Top-level navigations need Lax (or Strict if you can drop emailed-link logins)",
          "None only for deliberate cross-site embeds, always with Secure + CSRF tokens",
        ],
        solution: `session:      SameSite=Lax   — emailed links still work; cross-site POSTs are blocked.
refreshToken: SameSite=Strict + Path=/auth — only your own origin ever sends it.
csrfToken:    SameSite=Lax (redundant belt) — real defense is the token comparison itself.`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-ecommerce-api", "p2-chat-backend"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-csrf-protection",
    slug: "csrf-protection",
    title: "CSRF Protection",
    description:
      "How cross-site request forgery rides cookies, and the layered defenses: SameSite, synchronizer tokens, double-submit, and Origin checks.",
    order: 14,
    estimatedMinutes: 20,
    tags: ["csrf", "security", "cookies", "helmet", "owasp"],
    prerequisites: ["p2m6-secure-cookie-config", "p2m5-cors"],
    relatedTopics: ["p2m6-secure-cookie-config", "p2m6-protected-routes", "p2m5-api-security-basics"],
    learningObjectives: [
      "Explain the CSRF attack with cookie-authenticated APIs",
      "Layer SameSite, Origin/Referer validation, and CSRF tokens",
      "Implement a synchronizer-token middleware in Express",
      "Recognize why CORS alone is not CSRF protection",
    ],
    simpleExplanation:
      "CSRF tricks a logged-in user's browser into sending an unwanted request to your site — because cookies ride along automatically, evil.com can fire a hidden form POST to bank.example and your server sees a legitimate session. Defense is layered: SameSite cookies stop most cross-site sends, strict Origin checks catch the rest, and CSRF tokens prove the request came from a page your server rendered (an attacker cannot read or predict the token).",
    detailedContent: `
**The attack.** Victim is logged into \`bank.example\` (session cookie set). Victim visits \`evil.example\`, which serves:

\`<form action="https://bank.example/transfer" method="POST">
  <input name="to" value="attacker" />
  <input name="amount" value="10000" />
</form>
<script>document.forms[0].submit();</script>\`

The browser attaches the session cookie (if SameSite allows), and the transfer executes as the victim. Note: bearer tokens in the \`Authorization\` header are **not** sent cross-site automatically, which is why header-auth APIs are naturally CSRF-resistant — the risk concentrates on cookie-based auth.

**Defense layers (use at least two):**

1. **SameSite=Lax/Strict** — modern browsers withhold the cookie on cross-site POSTs (Lax) or all cross-site requests (Strict). Excellent first layer; not universal (old browsers, some embed cases).
2. **Origin/Referer validation** — for state-changing requests, require \`Origin\` (or fallback \`Referer\`) to match your own origin. Missing *and* mismatched should be rejected for APIs that always have Origin set (fetch/XHR from browsers).
3. **Synchronizer token** — server generates a random token, embeds it in forms/SPA state (or a readable cookie), and requires the same value in a header/body of mutations. Attackers cannot read it cross-origin (same-origin policy).
4. **Double-submit cookie** — a random value in a non-HttpOnly cookie must equal a request header; attacker can set neither to match cross-site.
5. **Never rely on CORS alone.** CORS governs whether JS can *read* responses; simple form POSTs don't need CORS approval to be *sent*.

Also: use POST/PUT/DELETE (not GET) for mutations, avoid \`GET\` that changes state, and keep custom headers like \`X-Requested-With\` as an extra signal. Helmet sets helpful headers but does **not** stop CSRF by itself.
    `,
    howItWorks: `
Request path with Origin check + synchronizer token:

1. SPA loads; server sets session cookie (HttpOnly) **and** a CSRF cookie (\`XSRF-TOKEN\`, readable by JS) or embeds the token in the page.
2. SPA copies the token into \`X-CSRF-Token\` on every mutating request.
3. \`POST /transfer\` arrives with both cookies. Middleware:
   a. Rejects if \`Origin\` header is present and not your allowlisted origin.
   b. Compares \`X-CSRF-Token\` to the expected value in constant time; mismatch → 403.
4. Only then does authenticate/authorize run and the handler execute.

An attacker's page can force the browser to *send* the request, but cannot read your CSRF cookie (cross-origin) to put the right header on it — the request dies at step 3b.
    `,
    codeExamples: [
      {
        title: "Origin/Referer check middleware",
        language: "ts",
        code: `const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(","),
);

export function requireSameOrigin(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next(); // mutations only
  }
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const source = origin ?? (referer ? new URL(referer).origin : undefined);

  if (!source || !ALLOWED_ORIGINS.has(source)) {
    return res.status(403).json({ error: "Cross-origin request blocked" });
  }
  next();
}

app.use(requireSameOrigin);`,
        description:
          "State-changing methods must carry a first-party Origin (or a matching Referer); everything else is rejected.",
      },
      {
        title: "Synchronizer-token middleware",
        language: "ts",
        code: `import crypto from "node:crypto";

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

export function issueCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("base64url");
  }
  // Readable cookie for SPAs (double-submit pattern):
  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    httpOnly: false, // JS must read this one — that is the point
    secure: true,
    sameSite: "lax",
  });
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  const expected = req.session?.csrfToken;
  const provided = req.headers["x-csrf-token"];
  if (!expected || typeof provided !== "string" || !safeEqual(provided, expected)) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
}`,
        description:
          "Session-bound synchronizer token plus a readable double-submit cookie; comparisons use crypto.timingSafeEqual.",
      },
    ],
    commonMistakes: [
      "Believing CORS configuration prevents CSRF — it only controls response readability, not request sending.",
      "Checking Origin only on some mutations and leaving DELETE endpoints unprotected.",
      "Comparing CSRF tokens with === (timing side channel is minor here, but use timingSafeEqual as a habit).",
      "Generating one global CSRF token for all users instead of per-session (or per-user) tokens.",
    ],
    bestPractices: [
      "Layer SameSite=Lax/Strict with Origin checks and CSRF tokens on state-changing routes.",
      "Reject requests with missing or foreign Origin for browser-API traffic; document exceptions for server-to-server calls.",
      "Use helmet for general hardening, and keep mutations off GET.",
    ],
    realWorldUseCases: [
      "Cookie-session SPAs on a different subdomain than the API: SameSite=None + CSRF tokens + strict Origin allowlist.",
      "Classic form-based apps: synchronizer tokens embedded in every form post.",
    ],
    resources: [
      docs(
        "OWASP CSRF Prevention Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
        "Defense-in-depth patterns: tokens, SameSite, and referer checks.",
      ),
      docs("helmet — helmetjs", OFFICIAL.helmetDocs, "Security headers middleware; complementary to, not a replacement for, CSRF tokens."),
      docs("MDN — SameSite cookies", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie", "Browser semantics for Lax, Strict and None."),
      ytSearch(
        "csrf protection express synchronizer token",
        "Implementing CSRF tokens and origin checks in Node apps.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-csrf-stack",
        title: "Layer CSRF defenses",
        prompt:
          "Add requireSameOrigin plus a synchronizer-token middleware to a cookie-authenticated API. Prove with a test that a POST carrying a valid session cookie but no X-CSRF-Token header gets 403, while the same POST with the token succeeds.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Issue the token in a readable XSRF-TOKEN cookie and echo it in the X-CSRF-Token header",
          "Skip the check for GET/HEAD/OPTIONS",
        ],
      },
      {
        id: "ex-p2m6-cors-vs-csrf",
        title: "CORS is not CSRF protection",
        prompt:
          "Write a short paragraph explaining why a perfectly configured CORS policy (restrictive Access-Control-Allow-Origin) does not stop a classic form-POST CSRF attack. Include what does stop it.",
        difficulty: "intermediate",
        estimatedMinutes: 12,
        hints: [
          "Simple form POSTs are 'simple requests' that browsers send without preflight",
          "CORS only gates whether JS can read the response",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-ecommerce-api", "p2-blog-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-auth-error-handling",
    slug: "auth-error-handling",
    title: "Auth Error Handling",
    description:
      "Consistent 401/403/400 responses for authentication failures: custom error classes, centralized formatting, and safe logging.",
    order: 15,
    estimatedMinutes: 18,
    tags: ["errors", "http-status", "observability", "express"],
    prerequisites: ["p2m2-error-handling-middleware", "p2m1-custom-errors", "p2m5-error-response-formats"],
    relatedTopics: ["p2m6-protected-routes", "p2m6-auth-vs-authz", "p2m1-error-propagation"],
    learningObjectives: [
      "Map auth failures to correct HTTP status codes and error codes",
      "Create custom UnauthorizedError/ForbiddenError classes",
      "Centralize auth error formatting in error-handling middleware",
      "Log safely without leaking tokens, passwords, or emails in plaintext",
    ],
    simpleExplanation:
      "Auth failures are normal traffic, not crashes: expired tokens, missing headers, wrong roles. Handle them with dedicated error types that your centralized error middleware turns into consistent JSON bodies — 401 when identity is the problem, 403 when permission is. Never let a raw stack trace or a 'user not found' message escape to the client, and keep detailed diagnostics in server logs (redacted).",
    detailedContent: `
**Status code mapping:**

| Failure                              | Status | Example body                                  |
| ------------------------------------ | ------ | --------------------------------------------- |
| Missing credential                   | 401    | \`{ "error": "Authentication required" }\`     |
| Malformed/invalid/expired token      | 401    | \`{ "error": "Invalid or expired token" }\`    |
| Role/permission denied               | 403    | \`{ "error": "Insufficient permissions" }\`    |
| Malformed auth header                | 401    | Same as invalid — do not explain the parser   |
| Email not verified                   | 403    | \`{ "error": "...", "code": "email_not_verified" }\` |

**Custom errors.** Extend your base AppError (from the custom-errors lessons):

\`class UnauthorizedError extends AppError { statusCode = 401; code = "unauthorized"; }
class ForbiddenError extends AppError { statusCode = 403; code = "forbidden"; }\`

Middlewares then \`throw new UnauthorizedError()\` and a single error-handling middleware serializes everything identically — clients learn one contract.

**JWT-specific nuance.** \`jsonwebtoken\` throws different error names (\`TokenExpiredError\`, \`JsonWebTokenError\`). You may translate expiry to a distinct body field like \`{ code: "token_expired" }\` so clients know to refresh — but do **not** distinguish “signature invalid” vs “wrong algorithm” in the response; that helps attackers. Log the precise reason server-side instead.

**Logging hygiene.** Log the event (auth.failure), user id if known, IP, and a hash or last-4 of the token — never the full token or password. Stack traces belong in logs, not in API responses (except in development).

**WWW-Authenticate.** RFC 9110 expects 401 responses to include a \`WWW-Authenticate\` header; a simple \`Bearer\` or \`Bearer error="invalid_token"\` is good API citizenship.
    `,
    howItWorks: `
Error flow through Express:

1. \`authenticate\` catches \`jwt.verify\` failure → \`throw new UnauthorizedError("Invalid or expired token", { cause: err })\`.
2. Express routes the error past remaining route middlewares straight to the error-handling middleware (\`app.use((err, req, res, next) => ...)\`).
3. The handler classifies: if \`err instanceof AppError\`, respond \`err.statusCode\` with \`{ error: err.message, code: err.code }\`. Otherwise log the stack and respond a generic 500.
4. Audit middleware may record \`auth.failure\` with request id, IP, and error code for security monitoring (credential stuffing spikes show up here).

Because every auth failure funnels through one formatter, adding request ids or standard envelope fields (from the error-response-formats lessons) stays a one-file change.
    `,
    codeExamples: [
      {
        title: "Custom errors + centralized formatting",
        language: "ts",
        code: `export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", options?: { cause?: unknown }) {
    super(message, 401, "unauthorized");
    if (options?.cause) this.cause = options.cause;
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "forbidden");
  }
}

// In authenticate():
try {
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  req.user = { id: String(payload.sub), role: String(payload.role) };
  next();
} catch (err) {
  // Log the precise cause; respond generically.
  logger.warn({ event: "auth.failure", reason: (err as Error).name, ip: req.ip });
  next(new UnauthorizedError("Invalid or expired token", { cause: err }));
}

// Central error middleware (sketch)
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});`,
        description:
          "Auth layers throw typed errors; one middleware maps them to the public JSON contract and keeps stacks out of responses.",
      },
      {
        title: "Translate JWT errors without leaking details",
        language: "ts",
        code: `export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.setHeader("WWW-Authenticate", "Bearer");
    return next(new UnauthorizedError("Authentication required"));
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: String(payload.sub), role: String(payload.role) };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // Helpful for refresh-aware clients; safe — expiry is public knowledge.
      return next(new UnauthorizedError("Token expired", { cause: err }));
    }
    // Invalid signature / malformed / wrong alg — indistinguishable to the client.
    res.setHeader("WWW-Authenticate", 'Bearer error="invalid_token"');
    return next(new UnauthorizedError("Invalid or expired token", { cause: err }));
  }
}`,
        description:
          "Expiry may get a distinct message; every other verification failure collapses into one generic 401 body.",
      },
    ],
    commonMistakes: [
      "Returning 500 for expired tokens — clients cannot tell them apart from real server bugs and never refresh.",
      "Echoing jwt.verify error internals (`invalid signature`, algorithm details) straight into API responses.",
      "Including stack traces in production error bodies.",
      "Logging full Authorization headers or passwords on failed logins.",
    ],
    bestPractices: [
      "One custom error class per auth failure kind and one centralized serializer for the JSON envelope.",
      "Log structured security events (event, code, ip, request id) with redacted secrets.",
      "Set WWW-Authenticate on 401s and keep client-facing messages stable and generic.",
    ],
    realWorldUseCases: [
      "Mobile clients keying offline behavior off a machine-readable `code` like token_expired vs unauthorized.",
      "Security monitoring: spikes of auth.failure events from one IP trigger rate limiting or alerts.",
    ],
    resources: [
      docs("Express — Error handling", "https://expressjs.com/en/guide/error-handling.html", "Centralized error middleware patterns for thrown auth errors."),
      docs("RFC 9110 — HTTP semantics", OFFICIAL.rfcHttp, "Status code definitions for 401/403 and WWW-Authenticate."),
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "Broken authentication and authorization categories your errors should align with."),
      ytSearch(
        "express custom error classes 401 403 middleware",
        "Building consistent error responses for auth failures.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-auth-errors",
        title: "Standardize auth errors",
        prompt:
          "Introduce UnauthorizedError and ForbiddenError, replace every ad-hoc res.status(401/403) in your auth middlewares with throws, and extend your error middleware to serialize them as { error, code }. Add tests asserting the exact bodies for missing token, expired token, and role denial.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "jsonwebtoken: err.name === 'TokenExpiredError' for expiry",
          "Keep one public message per class; log the detailed reason",
        ],
      },
      {
        id: "ex-p2m6-no-leak",
        title: "Hunt for auth information leaks",
        prompt:
          "Review your API responses and logs for anything that leaks: stack traces, 'user not found' vs 'wrong password' distinctions, full tokens in logs, or SQL/ORM error messages. List each leak and the fix.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Check pino/morgan log serializers for headers",
          "Production error handler should have a catch-all generic 500",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-chat-backend", "p2-task-api"],
    quizId: "quiz-p2-m6",
  },
  {
    ...shared,
    id: "p2m6-account-security",
    slug: "account-security-hardening",
    title: "Account Security Hardening",
    description:
      "Rate limiting, lockouts, MFA (TOTP), breached-password checks, and audit logging — the last mile of auth defense.",
    order: 16,
    estimatedMinutes: 22,
    tags: ["rate-limiting", "mfa", "lockout", "hardening", "helmet"],
    prerequisites: ["p2m5-api-security-basics", "p2m6-auth-error-handling"],
    relatedTopics: ["p2m6-auth-error-handling", "p2m6-registration-login", "p2m6-refresh-tokens-rotation"],
    learningObjectives: [
      "Rate-limit login, register, and reset endpoints with express-rate-limit",
      "Design account lockout or progressive delays without enabling DoS",
      "Add TOTP-based MFA and recovery codes",
      "Run breached-password checks and keep audit logs of security events",
    ],
    simpleExplanation:
      "Even perfect hashing and JWT hygiene lose to unlimited online guessing. Hardening means throttling: rate-limit per IP and per account, optionally lock or delay after repeated failures, require a second factor (TOTP app) for sensitive accounts, refuse known-breached passwords, and record security events so you can detect credential-stuffing campaigns early.",
    detailedContent: `
**Rate limiting.** Put tight limits on \`/login\`, \`/register\`, \`/forgot-password\`, \`/resend-verification\` and \`/auth/refresh\`. Use \`express-rate-limit\` with a per-IP key, and consider a second limiter keyed by normalised email (hashed) to stop distributed attacks on one account. Return **429** with a Retry-After header. Beware: naive IP limits behind a proxy need \`app.set("trust proxy", ...)\` configured correctly or every client shares the proxy's IP.

**Lockouts & delays.** Hard lockouts let attackers denial-of-service a victim's account by spamming failures. Safer patterns: progressive delay (sleep grows with failure count), temporary soft-lock (5–15 min), or risk-based checks (new device + wrong password → require MFA). Always keep responses generic.

**MFA (TOTP).** With \`otplib\`-style libraries: generate a secret at enrollment, show an otpauth QR code, verify a first code to confirm setup, store the secret encrypted or in a secrets manager, and require a TOTP code at login (or only for sensitive actions). Provide one-time recovery codes (hashed at rest) so users are not locked out.

**Breach checks.** k-anonymity queries against the Have I Been Pwned range API send only the first 5 hash chars; or use a local corpus. Block or force-reset passwords found in breach corpora at registration and reset time.

**Audit logging & hygiene.** Log \`auth.login.success\`, \`auth.login.failure\`, \`auth.lockout\`, \`auth.mfa.enabled\`, \`auth.password.changed\` with user id, IP, user-agent hash, and timestamp. Add helmet, keep dependencies updated, store every secret in \`process.env\` (never in code), and review who holds admin roles regularly.
    `,
    howItWorks: `
A hardened login handler chains:

1. IP rate limiter (e.g. 20 requests / 15 min per IP) — cheap first filter.
2. Account limiter (e.g. 5 failures / 15 min per email hash) — protects specific victims.
3. Fetch user, dummy-hash compare, password verify (constant-time via library).
4. If MFA enabled and password OK → respond a short-lived \`mfa_required\` challenge instead of a session; verify the TOTP code on a second endpoint that is also rate-limited.
5. On success: regenerate session / mint tokens, reset failure counters, emit audit event.
6. On failure: increment counters, emit audit event, respond generic 401. When the threshold trips, respond 429/401 with the same generic body and start the delay window.

Every step is observable: counters feed alerts when one IP or one account explodes with failures.
    `,
    codeExamples: [
      {
        title: "Layered rate limiting on login",
        language: "ts",
        code: `import rateLimit from "express-rate-limit";
import crypto from "node:crypto";

const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  // Key by hashed email so one victim cannot be flooded by one attacker,
  // and raw emails do not end up in limiter stores.
  keyGenerator: (req) =>
    crypto.createHash("sha256").update(String(req.body?.email ?? "unknown")).digest("hex"),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

app.post("/login", ipLimiter, accountLimiter, loginHandler);`,
        description:
          "Two limiters: cheap per-IP shield plus per-account shield keyed by a hash of the email.",
      },
      {
        title: "Progressive delay instead of hard lockout",
        language: "ts",
        code: `const failures = new Map<string, { count: number; lockedUntil?: number }>();

export async function guardLoginAttempt(emailHash: string) {
  const entry = failures.get(emailHash);
  if (!entry) return;
  const now = Date.now();
  if (entry.lockedUntil && entry.lockedUntil > now) {
    // Soft-lock window — still respond generically at the route layer.
    throw new UnauthorizedError("Invalid credentials");
  }
  if (entry.count >= 5) {
    // 5 failures -> 5 minute soft lock (progressive: multiply by count-4)
    entry.lockedUntil = now + (entry.count - 4) * 5 * 60 * 1000;
  }
}

export function recordLoginFailure(emailHash: string) {
  const entry = failures.get(emailHash) ?? { count: 0 };
  entry.count += 1;
  failures.set(emailHash, entry);
}

export function recordLoginSuccess(emailHash: string) {
  failures.delete(emailHash);
}`,
        description:
          "In-memory sketch of progressive soft-locking; production should persist counters in Redis and keep responses generic.",
      },
    ],
    commonMistakes: [
      "No rate limit on /login — online brute force and credential stuffing at scale.",
      "Hard-locking accounts on 3 failures without CAPTCHA or delay, enabling intentional lockout DoS.",
      "Collecting a TOTP secret but never verifying the first code before enabling MFA.",
      "Logging emails and passwords in plaintext in security audit trails.",
    ],
    bestPractices: [
      "Rate-limit every auth endpoint per IP and per account; return 429 with Retry-After.",
      "Prefer progressive delays or risk-based challenges over permanent lockouts.",
      "Offer TOTP MFA + hashed recovery codes; check breached password corpora at set/reset time.",
      "Emit structured audit events for all auth security actions and monitor them.",
    ],
    realWorldUseCases: [
      "Consumer apps facing credential stuffing: per-account limits plus breached-password checks stop recycled password lists.",
      "Admin consoles: mandatory MFA for privileged roles, with recovery codes for travel scenarios.",
    ],
    resources: [
      docs("express-rate-limit — GitHub", OFFICIAL.expressRateLimit, "Middleware options for IP and custom key generators, proxies, headers."),
      docs("helmet — helmetjs", OFFICIAL.helmetDocs, "Secure default HTTP headers for Express apps."),
      docs("OWASP Authentication Cheat Sheet", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", "Lockout, MFA and credential lifecycle guidance."),
      ytSearch(
        "express rate limit login brute force protection",
        "Practical throttling and MFA implementations for Node APIs.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m6-login-limiter",
        title: "Throttle the login endpoint",
        prompt:
          "Add per-IP (20/15min) and per-email-hash (5/15min) rate limiters to /login. Write a test that sends 6 bad passwords for one email and asserts the 6th gets 429, while a different email still gets 401 (not throttled).",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "keyGenerator with sha256(email) for the account limiter",
          "memory store is fine in tests; clear between runs",
        ],
      },
      {
        id: "ex-p2m6-mfa-plan",
        title: "Design a TOTP enrollment flow",
        prompt:
          "Write the endpoint sequence for enabling TOTP MFA: secret generation, QR display, confirmation code, then enforcement at login. Note where rate limits, hashed storage, and recovery codes fit, and what happens when a user loses their device.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Do not mark mfa_enabled until the first code verifies",
          "Recovery codes: generate once, store hashed, allow single use",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-job-board-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m6",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m6",
  title: "Authentication & Authorization Quiz",
  description:
    "Test your understanding of password hashing, sessions vs JWTs, refresh rotation, RBAC, protected routes, cookies, CSRF and account hardening.",
  moduleId: "p2-m6",
  questions: [
    {
      id: "q-p2m6-1",
      type: "multiple-choice",
      prompt:
        "A logged-in user with a valid session cookie tries to DELETE /tasks/:id for a task owned by someone else and receives 403. Which statement is correct?",
      options: [
        "The request failed authentication — the session cookie was invalid or expired",
        "The request was authenticated but failed authorization (the user is not permitted for this resource)",
        "The server is rate-limiting the account because of too many requests",
        "The user entered the wrong password on the previous request",
      ],
      correctIndex: 1,
      explanation:
        "403 Forbidden means the server knows who the caller is (authentication succeeded) but the policy denies the action — here, ownership or a permission check failed. Authentication problems (missing/invalid credentials) return 401.",
      optionExplanations: [
        "Wrong: an invalid session would produce 401, not 403.",
        "Correct: valid identity + denied action = 403 Forbidden.",
        "Wrong: rate limiting returns 429 Too Many Requests.",
        "Wrong: password correctness is only relevant at login; it does not affect an authenticated request's authorization.",
      ],
    },
    {
      id: "q-p2m6-2",
      type: "multiple-choice",
      prompt: "Which password storage practice is correct for a production Node.js API?",
      options: [
        "AES-encrypt the password with a key from the environment and store the ciphertext",
        "Store a salted SHA-256 hash of the password with no work factor",
        "Store a bcrypt hash with a tuned cost (e.g. 12) and a unique salt per password",
        "Store the plaintext so support staff can remind users of their password",
      ],
      correctIndex: 2,
      explanation:
        "bcrypt (or Argon2id) is a slow, adaptive, salted one-way hash designed for passwords. Encryption is reversible with the key; fast hashes like bare SHA-256 are cheap to brute-force on GPUs; plaintext storage is never acceptable.",
      optionExplanations: [
        "Wrong: encryption is reversible — a key leak exposes every password.",
        "Wrong: SHA-256 has no work factor; GPUs billions of guesses per second.",
        "Correct: unique salt + high cost factor is the industry-standard approach (bcrypt/Argon2).",
        "Wrong: you should not be able to recover passwords; offer a reset flow instead.",
      ],
    },
    {
      id: "q-p2m6-3",
      type: "find-bug",
      prompt:
        "Users report that login accepts ANY password, even obviously wrong ones. Find the bug in this handler.",
      code: `router.post("/login", async (req, res) => {
  const user = await db.users.findByEmail(req.body.email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const ok = bcrypt.compare(req.body.password, user.passwordHash);
  if (ok) {
    return issueSession(user, res);
  }
  return res.status(401).json({ error: "Invalid credentials" });
});`,
      language: "ts",
      options: [
        "bcrypt.compare returns a Promise; without await, ok is always a truthy object, so any password is accepted",
        "The cost rounds are too high, causing bcrypt.compare to short-circuit and return true",
        "The error message 'Invalid credentials' leaks whether the email exists, which makes ok true",
        "There is no bug — bcrypt.compare is synchronous and this code is correct",
      ],
      correctIndex: 0,
      explanation:
        "bcrypt.compare is async. Without await, the if (ok) check receives a Promise object, and every object is truthy — so the session is issued for any password. The fix is await bcrypt.compare(...), which resolves to the real boolean.",
      optionExplanations: [
        "Correct: Promise is truthy; await is required to get the boolean comparison result.",
        "Wrong: high cost makes hashing slower, but compare still resolves to the correct boolean.",
        "Wrong: the message shape is fine and has no effect on the comparison value.",
        "Wrong: bcrypt.compare is promise-based; the code as written is a classic bug.",
      ],
    },
    {
      id: "q-p2m6-4",
      type: "find-bug",
      prompt:
        "This middleware was deployed and attackers discovered they could forge arbitrary user identities by crafting Authorization headers. Find the bug.",
      code: `function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const payload = jwt.decode(header.slice(7));
  req.user = { id: payload.sub, role: payload.role };
  next();
}`,
      language: "ts",
      options: [
        "jwt.decode performs no signature verification — any attacker-built token with arbitrary claims is trusted",
        "jwt.decode requires an options object with algorithms pinned, which is missing here",
        "The payload is decoded too early; it should only be decoded after the response is sent",
        "The bug is that the function uses optional chaining on req.headers.authorization",
      ],
      correctIndex: 0,
      explanation:
        "jwt.decode only Base64-decodes the token; it never checks the signature or expiry. Anyone can craft header.payload and decode it themselves. You must use jwt.verify(token, secret, { algorithms: ['HS256'] }) so the HMAC and exp are validated before claims are trusted.",
      optionExplanations: [
        "Correct: decode = no verification; forged tokens with admin roles would be accepted.",
        "Wrong: pinning algorithms belongs to jwt.verify; decode ignores the secret entirely.",
        "Wrong: timing of the decode is irrelevant — the missing signature check is the vulnerability.",
        "Wrong: optional chaining is fine; it is not what enables forgery.",
      ],
    },
    {
      id: "q-p2m6-5",
      type: "code-output",
      prompt:
        "An access token was issued with expiresIn: '10m' and is presented 30 minutes later. What happens when jwt.verify(token, secret, { algorithms: ['HS256'] }) runs?",
      code: `const token = jwt.sign({ sub: "u_1" }, secret, {
  algorithm: "HS256",
  expiresIn: "10m",
});
// ... 30 minutes later ...
try {
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  console.log("ok", payload.sub);
} catch (err) {
  console.log(err.name);
}`,
      language: "ts",
      options: [
        "It throws TokenExpiredError — the signature is valid but exp is in the past",
        "It returns null because expired tokens are silently dropped",
        "It throws an error whose name is JsonWebTokenError with the message 'invalid signature'",
        "It returns the payload but sets payload.expired = true",
      ],
      correctIndex: 0,
      explanation:
        "jsonwebtoken checks exp during verify. When the signature is valid but exp has passed, it rejects with an error whose .name is 'TokenExpiredError'. Clients can distinguish this to trigger a refresh, while other verification failures should stay generic.",
      optionExplanations: [
        "Correct: valid signature + past exp → TokenExpiredError.",
        "Wrong: verify never resolves to null; it either returns the payload or throws.",
        "Wrong: 'invalid signature' means the HMAC did not match — a different failure.",
        "Wrong: verify does not return expired payloads with flags; it rejects them.",
      ],
    },
    {
      id: "q-p2m6-6",
      type: "multiple-choice",
      prompt:
        "Which cookie configuration is the strongest practical default for a first-party web session cookie?",
      options: [
        "SameSite=None without the Secure flag so the cookie also works over plain HTTP",
        "HttpOnly + Secure + SameSite=Lax + Path=/ with an explicit Max-Age",
        "No special flags — a correctly configured CORS policy is sufficient protection",
        "HttpOnly only, leaving Secure and SameSite at browser defaults",
      ],
      correctIndex: 1,
      explanation:
        "HttpOnly blocks JS theft (XSS mitigation), Secure restricts transmission to HTTPS, SameSite=Lax blocks most cross-site sends (CSRF mitigation), and explicit Path/Max-Age bound exposure and lifetime. SameSite=None requires Secure; CORS is not a substitute for cookie flags.",
      optionExplanations: [
        "Wrong: browsers reject SameSite=None without Secure, and it is the weakest SameSite mode.",
        "Correct: this is the standard hardened combination taught by OWASP and the lesson.",
        "Wrong: CORS controls response readability, not whether cookies are sent; flags still matter.",
        "Wrong: Secure and SameSite should be set explicitly rather than relying on defaults.",
      ],
    },
    {
      id: "q-p2m6-7",
      type: "multiple-choice",
      prompt:
        "A request carries a valid, unexpired JWT, but the user's role is 'user' and the route requires role 'admin'. What is the correct response?",
      options: [
        "401 Unauthorized with 'Authentication required'",
        "404 Not Found to make the admin route invisible",
        "403 Forbidden with 'Insufficient permissions'",
        "200 OK with an empty body so the client can decide",
      ],
      correctIndex: 2,
      explanation:
        "Authentication already succeeded — the token is valid. Authorization failed because the role policy denies access, so the correct code is 403 Forbidden. Returning 401 would wrongly tell clients their credential is bad (and would break token-refresh logic).",
      optionExplanations: [
        "Wrong: 401 means identity could not be established; here it was.",
        "Wrong: 404 hides existence but misrepresents an authenticated denial; 403 is the policy answer.",
        "Correct: valid identity + denied role = 403 Forbidden.",
        "Wrong: silently succeeding would grant the admin action to a normal user.",
      ],
    },
    {
      id: "q-p2m6-8",
      type: "short-answer",
      prompt:
        "Explain why refresh tokens should be rotated on every use, and what your server should do when a refresh token that was already used is presented again.",
      acceptedKeywords: [
        "reuse",
        "stolen",
        "theft",
        "compromise",
        "revoke",
        "revocation",
        "family",
        "invalidat",
        "re-auth",
        "reauth",
        "detection",
        "single-use",
      ],
      explanation:
        "Rotation gives each refresh token a single use: when a client refreshes, the old token is invalidated and a new one issued. If a previously used token appears again, two copies exist — a strong signal one was stolen. The safe response is to treat it as reuse detection: revoke the entire token family (every token descended from that login), require fresh authentication, and audit the event. Without rotation, one stolen refresh token grants access for its full multi-week lifetime.",
    },
  ],
};
