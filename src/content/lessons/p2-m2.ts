import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m2",
  slug: "expressjs",
  title: "Express.js",
  description:
    "The de-facto Node.js web framework: application setup, routing, middleware, routers, controllers and services, error handling, configuration, static files, template engines, uploads, logging, versioning, pagination and validation — with Express 5 differences called out throughout.",
  phaseId: "phase-2",
  order: 2,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m2",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m2-express-app",
    slug: "your-first-express-app",
    title: "Your First Express App",
    description:
      "Installing Express 5, the smallest possible application, what app.listen really does, and how a single request reaches your first route.",
    order: 1,
    estimatedMinutes: 15,
    tags: ["express", "getting-started", "routing"],
    prerequisites: ["p1m4-basic-http-server", "p1m4-http-module", "p1m2-es-modules"],
    relatedTopics: ["p2m2-app-structure", "p2m2-routing", "p2m2-middleware"],
    learningObjectives: [
      "Install Express 5 and pin the version deliberately",
      "Explain what app.get(path, handler) registers and how a request reaches it",
      "Compare app.listen with a hand-rolled http.createServer().listen()",
      "Verify a route from the terminal with curl",
    ],
    simpleExplanation:
      "Express is a thin layer over Node.js's built-in `http` server. Instead of writing one function that parses every incoming URL by hand, you register one function per method + path pair — Express matches the request to your function, gives you parsed request data, and offers helpers like `res.json()` so you can answer in one line.",
    detailedContent: `
Express is a thin layer over Node.js's \`http\` module. A raw \`http.createServer\` handler receives **every** request; Express lets you register **one function per method + path pair** and takes care of matching, parameter parsing and error propagation.

Install Express 5 (it needs Node.js 18 or newer) and pin the major version so a fresh install never drops you back to 4:

    npm install express@5

The smallest useful application:

    import express from "express";

    const app = express();
    app.get("/", (req, res) => res.json({ message: "hello" }));
    app.listen(3000);

Every request then flows through one pipeline:

    client
      → Node http server (created behind the scenes by Express)
      → application middleware, in the order you registered it
      → the first route whose method AND path match
      → res.json(...) ends the response
      → nothing matched → Express's built-in 404

Two Express 5 details matter from day one. \`app.listen\` returns the underlying \`http.Server\`, and if binding fails (for example \`EADDRINUSE\`) the error is passed to your **callback** instead of being thrown as it was in Express 4. And because Express 5 forwards rejected promises from handlers, an \`async\` handler that throws reaches your error middleware automatically.
    `,
    howItWorks: `
\`express()\` builds an application object that carries a router. Each \`app.get(...)\` call pushes a **Layer** — a compiled matcher for the path plus the handler list — onto that router. \`app.listen(port, cb)\` creates an \`http.Server\` whose request handler is the router itself, binds the port, and returns the server so you can attach \`close\` or \`error\` events.

On each request Express walks the layer stack in order, comparing \`req.method\` and the path. The first matching layer runs its handlers; \`next()\` advances to the next one. If no layer matches, a final built-in handler responds with 404. Your route code never touches sockets — it only reads \`req\` and writes \`res\`.
    `,
    codeExamples: [
      {
        title: "The smallest complete Express 5 app",
        language: "js",
        code: `import express from "express";

const app = express();

// Global middleware: sees every request (covered in lesson 7)
app.use((req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});

// First route: HTTP method + path + handler
app.get("/", (req, res) => {
  res.json({ message: "hello from Express" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// app.listen wraps http.createServer and returns the http.Server
const server = app.listen(process.env.PORT ?? 3000, (error) => {
  if (error) throw error; // Express 5 delivers listen errors to the callback
  console.log("listening on", server.address());
});`,
        description:
          "Run with `node server.js`. The health route is the pattern every production API starts with: a cheap GET that load balancers and uptime checks can call.",
      },
      {
        title: "Verify the routes from a second terminal",
        language: "bash",
        code: `node server.js

# in another terminal
curl -i http://127.0.0.1:3000/
curl -i http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/nope   # built-in 404 from Express`,
        description:
          "`-i` prints the status line and headers, so you can confirm 200 vs 404 and the Content-Type Express sets for `res.json()`.",
      },
    ],
    commonMistakes: [
      "Installing plain `npm install express` on an existing project and silently getting a different major version than your code expects — pin `express@5`.",
      "Hardcoding port 3000: read `process.env.PORT ?? 3000` so hosting platforms can assign the port.",
      "Calling `app.listen` in the same file that exports the app: tests then bind a real port on every import (lesson 2 fixes this).",
      "Mixing module systems — this repo is ESM (`\"type\": \"module\"`), so use `import express from \"express\"`, not `require`.",
    ],
    bestPractices: [
      "Keep app creation in one module and listening in another so tests can import the app without opening a socket.",
      "Add a `/health` route immediately; containers, load balancers and orchestrators all want one.",
      "Log the resolved address inside the listen callback — it shows the real host/port after OS assignment.",
    ],
    realWorldUseCases: [
      "Every Phase 2 project (task API, auth API, blog API) begins with this exact bootstrap.",
      "Serverless platforms wrap your exported app in their own handler instead of calling listen — the same app object is reused.",
    ],
    resources: [
      docs(
        "Express — Installing",
        "https://expressjs.com/en/5x/starter/installing",
        "Official Express 5 install steps, including the Node.js version requirement.",
        "en",
        "5 min",
      ),
      docs(
        "Express — Hello world",
        "https://expressjs.com/en/5x/starter/hello-world",
        "The canonical minimal application, straight from the docs.",
        "en",
        "5 min",
      ),
      ytSearch(
        "Express JS getting started tutorial",
        "Walkthrough videos that build the same minimal app and hit it with curl.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-app-1",
        title: "From http to Express",
        prompt:
          "Take the raw `http.createServer` server you wrote in Phase 1 and rewrite it with Express: one GET route returning JSON, one 404 fallback. Then send both requests with `curl -i` and paste the status lines you observed.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "`res.json(obj)` sets Content-Type and stringifies for you — no `writeHead` needed.",
          "Express already answers 404 for unmatched paths; you only add your own JSON 404 in lesson 12.",
        ],
      },
      {
        id: "ex-p2m2-app-2",
        title: "Prove what app.listen returns",
        prompt:
          "Write a script that stores the value of `app.listen(0)` (an OS-assigned port), waits for the listen callback, then uses `node:http` to GET that port and print the body. Explain in one sentence why the callback form is safer than assuming port 3000 is free.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "`server.address()` returns `{ port, family, address }` once bound.",
          "Port 0 asks the OS for any free ephemeral port — ideal in automated tests.",
        ],
        solution: `import express from "express";
import http from "node:http";

const app = express();
app.get("/ping", (req, res) => res.json({ pong: true }));

const server = app.listen(0, (error) => {
  if (error) throw error;
  const { port } = server.address();
  console.log("ephemeral port:", port);

  http.get("http://127.0.0.1:" + port + "/ping", (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log(res.statusCode, body); // 200 {"pong":true}
      server.close();
    });
  });
});`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-app-structure",
    slug: "structuring-an-express-project",
    title: "Structuring an Express Application",
    description:
      "The folders that scale — routes, controllers, services, models, middleware, config — and why app.js and server.js must be two different files.",
    order: 2,
    estimatedMinutes: 18,
    tags: ["express", "architecture", "organization"],
    prerequisites: ["p2m2-express-app", "p2m1-code-organization"],
    relatedTopics: ["p2m2-controllers-services", "p2m2-configuration-management", "p2m2-express-router"],
    learningObjectives: [
      "Split an application into routes, controllers, services, models and middleware with clear responsibilities",
      "Explain the difference between app.js (build the app) and server.js (run the app)",
      "Import the app in a test without binding a port",
      "Decide where a new piece of code belongs before writing it",
    ],
    simpleExplanation:
      "A single-file Express demo is fine until a second person joins. Real projects separate **URL shapes** (routes), **HTTP plumbing** (controllers), **business rules** (services), **database access** (models) and **cross-cutting behaviour** (middleware) so each file has one reason to change — and so tests can exercise business logic without a server.",
    detailedContent: `
An Express app that puts every route, database query and middleware function in one file works for a demo and fails for a team. Structure exists so that each file has **one reason to change**.

The folders that scale:

    src/
    ├── app.js           ← express() + middleware + routers (never listens)
    ├── server.js        ← reads config, calls app.listen, handles shutdown
    ├── config/          ← env vars → one validated config object
    ├── routes/          ← URL shapes only: method, path, handler list
    ├── controllers/     ← HTTP in/out: read req, call a service, shape res
    ├── services/        ← business rules; imports no Express code
    ├── models/          ← schema + database access
    ├── middleware/      ← cross-cutting: auth, logging, validation, errors
    └── utils/           ← helpers, AppError classes

The single most valuable split is **app.js vs server.js**. \`app.js\` exports a factory that builds and configures the application but never binds a port. \`server.js\` is the only file allowed to call \`app.listen\`. Tests import the app object (with a library like supertest) and never open a socket, while the same app can be reused by a socket server, a serverless adapter or an integration harness.

Why it pays off: routes stay reviewable, services are unit-testable without HTTP, middleware order is visible on one screen, and “where do I add an endpoint?” has a one-line answer.
    `,
    howItWorks: `
A request through this structure:

    HTTP request
      → http.Server owned by server.js
      → app-level middleware (logger → cors → json parser)
      → routes/index.js mounts /api/tasks
      → the tasks router matches and runs the controller
      → controller validates input, calls the service
      → service applies business rules, calls the model
      → model queries the database
      → controller answers with res.json(...)
      → any throw jumps to middleware/error-handler.js

Only \`server.js\` knows about ports and shutdown; only \`config/\` reads \`process.env\`; only \`models/\` knows SQL or Mongoose. When one of those changes, the blast radius is one folder — and every other layer can be tested with a plain object in place of the real dependency.
    `,
    codeExamples: [
      {
        title: "app.js — build the app, never listen",
        language: "js",
        code: `import express from "express";
import { taskRouter } from "./routes/task.routes.js";
import { requestLogger } from "./middleware/request-logger.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(requestLogger);
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/tasks", taskRouter);

  // Order matters: 404 fallback, then error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}`,
        description:
          "Exporting a factory keeps configuration explicit: the app is built once per process, and tests can call `createApp()` directly.",
      },
      {
        title: "server.js — the only file that listens",
        language: "js",
        code: `import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

const server = app.listen(config.PORT, (error) => {
  if (error) throw error;
  console.log("API listening on port", config.PORT);
});

// Graceful shutdown: stop accepting new connections, finish in-flight ones
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});`,
        description:
          "Configuration is read at the edge of the process; `app.js` stays environment-agnostic and therefore testable.",
      },
    ],
    commonMistakes: [
      "Calling `app.listen` at import time: a test that merely imports a route file starts a server and fails on EADDRINUSE.",
      "Letting controllers talk to the database directly — the business logic then cannot be unit-tested without a live DB.",
      "A `models/` folder that also contains validation and email sending: models own persistence shape, services own rules.",
      "Importing Express inside services “just to use req”: services must receive plain data so they stay framework-free.",
    ],
    bestPractices: [
      "Adopt one layout early and keep it identical across every Phase 2 project so teammates transfer between repos instantly.",
      "Put cross-cutting HTTP concerns (logging, auth, errors) in `middleware/` and compose them in `app.js` where the order is visible.",
      "Keep `routes/` files almost empty: method, path, middleware chain, controller function — nothing else.",
    ],
    realWorldUseCases: [
      "Teams add features in parallel because folder boundaries mirror ownership boundaries.",
      "Swapping Mongoose for Prisma touches only `models/` and `services/`; routes and controllers are untouched.",
    ],
    resources: [
      docs(
        "Express — Debugging",
        "https://expressjs.com/en/5x/guide/debugging",
        "How to see what Express is doing while you reorganise a project.",
        "en",
        "8 min",
      ),
      docs(
        "Node.js Best Practices — Project structure",
        OFFICIAL.nodeBestPractices,
        "The goldbergyoni/nodebestpractices catalogue of layering and structure rules.",
        "en",
        "reference",
      ),
      ytSearch(
        "Express project structure MVC routes controllers services",
        "Videos that walk through the folder layout used in this lesson.",
        "en",
        "10–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-structure-1",
        title: "Refactor a monolith file",
        prompt:
          "Take your single-file Express app from lesson 1 and split it into `app.js` (createApp factory), `server.js` (listen + shutdown), `routes/`, `middleware/` and `config/`. Verify both `node server.js` and a `curl` request still work, and write down how many lines `app.js` ended up with.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Move every `app.use` and `app.get` into createApp; leave only the listen call in server.js.",
          "Export middleware as named functions so they can be unit-tested later.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-blog-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-routing",
    slug: "routing",
    title: "Routing",
    description:
      "app.METHOD, Express 5 path syntax, matching order, route chaining with app.route() and app.all() — and how Express decides which handler runs.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["express", "routing", "path-to-regexp"],
    prerequisites: ["p2m2-express-app", "p1m1-methods"],
    relatedTopics: ["p2m2-route-params", "p2m2-express-router", "p2m2-handling-404"],
    learningObjectives: [
      "Register routes with every app.METHOD helper and with app.all()",
      "Read and write Express 5 path patterns, including named wildcards and brace groups",
      "Explain first-match-wins ordering and place routes from specific to general",
      "Chain several methods on one path with app.route()",
    ],
    simpleExplanation:
      "Routing is how you say “when a GET for `/api/tasks/:id` arrives, run this function”. Express compares the request method and path against every route you registered, **in order**, and runs the first match. Express 5 updated the pattern language (wildcards must be named, optionals use braces), so old Express 4 patterns can throw.",
    detailedContent: `
Routing maps an HTTP method and a path to a list of handlers. Express registers them with \`app.get\`, \`app.post\`, \`app.put\`, \`app.patch\`, \`app.delete\`, \`app.head\`, \`app.options\` and \`app.all\`.

Matching rules:

- **First match wins, in registration order.** Express never picks the “most specific” route for you — a broad \`app.use(...)\` placed early swallows everything registered after it.
- Matching uses the **path only**; the query string is parsed separately (lesson 5).
- \`app.route("/tasks/:id")\` chains several methods on one path; \`app.all("/path", h)\` matches every method — handy for CORS preflights and legacy redirects.

**Express 5 changed the path syntax** (it embeds path-to-regexp v8):

    Express 4 pattern        Express 5 equivalent     Why
    -----------------------  -----------------------  -------------------------
    "/*"                     "/*splat"                wildcard must be named
                             "/{*splat}"              braces also match "/"
    "/:file.:ext?"           "/:file{.:ext}"          "?" optional marker removed
    "/[a-z]+/:slug"          (no equivalent)          regex characters rejected
    "/a/:x" + "/b/:x"        ["/a/:x", "/b/:x"]       pass an array of paths

The characters \`()\`, \`[]\`, \`?\`, \`+\` and \`!\` are reserved; escape them with a backslash if they are literal. Parameter names must be valid JavaScript identifiers (or quoted, like \`:"this"\`).

Because ordering is explicit, register precise paths first and wildcards last — otherwise your catch-all 404 shadows the API.
    `,
    howItWorks: `
Each registration compiles the path string into a regular expression and stores it in a **Layer** together with the handler array. \`app.use\` layers match on a path **prefix**; \`app.get\`-style layers match the **full** path for that method.

For every incoming request Express walks the layers in order: method must match, then the path. A matching layer runs its handlers one by one — \`next()\` advances inside the layer, then to the next layer. Ending the response without calling \`next()\` stops the walk entirely. If nothing matches, the built-in final handler answers 404.

Mount points strip the matched prefix from \`req.url\` (a router mounted at \`/api/tasks\` sees \`/\`), while \`req.originalUrl\` always holds the full original URL.
    `,
    codeExamples: [
      {
        title: "Chaining methods and matching every verb",
        language: "js",
        code: `import express from "express";
const app = express();

// One path, three methods — registered together so they stay in sync
app
  .route("/api/tasks/:id")
  .get((req, res) => res.json({ id: req.params.id, action: "read" }))
  .put((req, res) => res.json({ id: req.params.id, action: "replace" }))
  .delete((req, res) => res.status(204).end());

// app.all matches every method, including OPTIONS and TRACE
app.all("/api/legacy", (req, res) => {
  res.status(410).json({ error: "GONE", use: "/api/tasks" });
});

app.listen(3000);`,
        description:
          "`app.route()` keeps the path in one place; `app.all()` is the idiomatic way to short-circuit a whole path regardless of verb.",
      },
      {
        title: "Express 4 patterns that must change in Express 5",
        language: "js",
        code: `// ✗ Express 4 only — throws or never matches in Express 5
app.get("/*", (req, res) => res.end());
app.get("/:file.:ext?", (req, res) => res.end());
app.get("/[discussion|page]/:slug", (req, res) => res.end());

// ✓ Express 5
app.get("/*splat", (req, res) => {
  // GET /a/b  →  req.params.splat === ["a", "b"]
  res.json({ splat: req.params.splat });
});

app.get("/{*splat}", (req, res) => {
  // same, but "/" matches too (the root path is included)
  res.end("root or deeper");
});

app.get("/:file{.:ext}", (req, res) => {
  // GET /image     → { file: "image" }         (ext omitted in Express 5)
  // GET /photo.png → { file: "photo", ext: "png" }
  res.json(req.params);
});

app.get(["/discussion/:slug", "/page/:slug"], (req, res) => res.end());`,
        description:
          "The migration guide lists every removed form. Learn the three replacements: named wildcards, brace groups, and arrays of plain paths.",
      },
    ],
    commonMistakes: [
      "Registering a `*` catch-all before the API routes so every request gets the wrong response.",
      "Copying Express 4 patterns such as `/:id?` into an Express 5 app — optional segments now need braces.",
      "Assuming Express chooses the most specific match: two matching routes always resolve to whichever was registered first.",
      "Forgetting that `app.all` also catches OPTIONS preflight requests and may answer them before your CORS middleware.",
    ],
    bestPractices: [
      "Order every router file: exact paths → parameterised paths → wildcards.",
      "Use `app.route()` when several methods share one path, so the path string exists once.",
      "Keep pattern syntax in one reviewable place: a `routes/` folder where a teammate can see the whole surface area.",
    ],
    realWorldUseCases: [
      "GitHub-style APIs expose `/repos/:owner/:repo/commits/:sha` — parameterised paths plus arrays of alternatives.",
      "Legacy sunsets use `app.all('/old/*splat', ...)` to answer every verb with 410 Gone.",
    ],
    resources: [
      docs(
        "Express — Routing",
        OFFICIAL.expressGuide,
        "The official routing guide covering paths, parameters and route handlers.",
        "en",
        "15 min",
      ),
      docs(
        "Moving to Express 5 — path syntax",
        "https://expressjs.com/en/guide/migrating-5",
        "Authoritative list of the path-pattern changes between Express 4 and 5.",
        "en",
        "reference",
      ),
      ytSearch(
        "Express routing tutorial route parameters",
        "Video walkthroughs of app.get/app.post, matching order and parameters.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-routing-1",
        title: "Route a resource",
        prompt:
          "Write the five REST routes for a `task` resource (list, create, read, replace, remove) using `app.route()` where it helps. Then add a wildcard route that returns JSON 404 for any other path, and prove with curl that a task route still works.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "GET /api/tasks and POST /api/tasks share a path; GET/PUT/DELETE /api/tasks/:id share another.",
          "Register the wildcard last — order is the whole point of the exercise.",
        ],
      },
      {
        id: "ex-p2m2-routing-2",
        title: "Predict the winner",
        prompt:
          "Given this code, state which handler runs for `GET /tasks/42` and why: (a) `app.use((req,res,next)=>next())`, (b) `app.get('/tasks/:id', h1)`, (c) `app.get('/tasks/42', h2)`, (d) `app.get('/*splat', h3)`. Then reorder the file so h2 wins, and explain the trade-off.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "`app.use` without a path runs for every request but only if it calls next().",
          "First match wins — the parameterised route currently beats the literal.",
        ],
        solution: `// As written, h1 runs first: registration order decides, and
// "/tasks/:id" is registered before the literal "/tasks/42".
import express from "express";
const app = express();
app.use((req, res, next) => next());
app.get("/tasks/:id", (req, res) => res.send("h1"));
app.get("/tasks/42", (req, res) => res.send("h2"));
app.get("/*splat", (req, res) => res.send("h3"));

// Put the literal first when you want it to win:
app.get("/tasks/42", (req, res) => res.send("h2"));
app.get("/tasks/:id", (req, res) => res.send("h1"));`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-url-shortener"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-route-params",
    slug: "route-parameters",
    title: "Route Parameters",
    description:
      "req.params, decoding and encoding, optional segments and wildcards in Express 5, and validating identifiers before they reach your services.",
    order: 4,
    estimatedMinutes: 16,
    tags: ["express", "routing", "validation"],
    prerequisites: ["p2m2-routing", "p1m1-json"],
    relatedTopics: ["p2m2-query-params", "p2m2-input-validation", "p2m2-express-router"],
    learningObjectives: [
      "Read values out of req.params and know they are always strings",
      "Explain how percent-encoding is decoded and why malformed encoding becomes a 400",
      "Use Express 5 optional groups and know that unmatched parameters are omitted",
      "Validate identifiers before passing them to a service or database",
    ],
    simpleExplanation:
      "Route parameters are the named placeholders inside a path — `/users/:userId` — and Express fills `req.params.userId` with whatever the client sent there. The values arrive decoded but still as strings, so you must validate that an “id” really is an integer or UUID before using it.",
    detailedContent: `
Route parameters are the named placeholders in a path: \`/users/:userId/posts/:postId\`. Express matches the segments and fills \`req.params\`, decoding each value for you:

    app.get("/users/:userId/posts/:postId", (req, res) => {
      // GET /users/42/posts/abc%20def
      req.params.userId; // "42"
      req.params.postId; // "abc def"  ← percent-decoding applied
    });

Rules worth knowing:

- **Decoding.** Each value goes through \`decodeURIComponent\`. A malformed sequence such as \`/users/100%zz\` does not crash the process: the router turns it into a 400 error with the message “Failed to decode param”.
- **A literal slash splits segments.** \`a%2Fb\` arrives as the single value \`"a/b"\`; sending a real \`/\` simply produces more path segments and usually no match.
- **Null prototype (Express 5).** With string paths, \`req.params\` has a null prototype — \`req.params.toString\` is undefined — which removes a prototype-pollution surprise.
- **Optional groups (Express 5).** \`/:file{.:ext}\` makes \`.ext\` optional, and an unmatched optional parameter is **omitted** from \`req.params\` (Express 4 left the key present with value \`undefined\`).
- **Wildcards capture arrays.** On \`/a/b\`, \`/*splat\` yields \`req.params.splat === ["a", "b"]\`.

Params are strings. Validate before use: a UUID route param should fail with 400 rather than reach the database and throw a cast error.
    `,
    howItWorks: `
path-to-regexp compiles the path into a regular expression with one capture group per parameter. At request time Express tests \`req.path\` (the URL with the query string removed); every capture becomes a key in \`req.params\`.

Decoding happens **per parameter**, not on the whole URL, so \`%2F\` inside one segment survives as a slash in that value while still counting as a single segment for matching.

Parameters are also visible to middleware mounted on the same path — \`app.use("/users/:userId", loadUser)\` can read \`req.params.userId\` — and a nested router inherits parent parameters only when created with \`{ mergeParams: true }\` (lesson 9). Any decoding failure is passed to \`next(err)\` exactly like other request errors.
    `,
    codeExamples: [
      {
        title: "Parameters, optional groups and validation",
        language: "js",
        code: `import express from "express";
import { z } from "zod";
const app = express();

const idSchema = z.string().uuid();

app.get("/users/:userId/posts/:postId", (req, res, next) => {
  const userId = idSchema.safeParse(req.params.userId);
  if (!userId.success) return res.status(400).json({ error: "INVALID_USER_ID" });
  res.json({ userId: userId.data, postId: req.params.postId });
});

// Express 5: braces make the ".ext" group optional; unmatched keys are omitted
app.get("/files/:name{.:ext}", (req, res) => {
  res.json({ name: req.params.name, ext: req.params.ext ?? "txt" });
});

app.listen(3000);`,
        description:
          "`req.params.ext` is `undefined` when the group did not match — use `??` defaults instead of expecting an empty string.",
      },
      {
        title: "See decoding and the 400 for bad encoding",
        language: "bash",
        code: `curl -i "http://127.0.0.1:3000/users/42/posts/abc%20def"
# → postId is "abc def"

curl -i "http://127.0.0.1:3000/users/100%zz/posts/1"
# → 400 Failed to decode param '100%zz'`,
        description:
          "Reproducing these two URLs shows clients exactly what the server does with encoding — worth documenting in your API guide.",
      },
    ],
    commonMistakes: [
      "Passing `req.params.id` straight into a database query: a non-numeric id can trigger cast errors or injection attempts.",
      "Expecting `req.params.ext === \"\"` when the optional group is missing — Express 5 omits the key entirely.",
      "Using `req.param('id')`: removed in Express 5, and it searched params, body and query in a confusing order.",
      "Encoding a value twice on the client because the server already decodes once — pick one convention and test it.",
    ],
    bestPractices: [
      "Validate every route parameter at the route edge with a schema; hand services already-clean identifiers.",
      "Prefer opaque string ids (UUID/ULID) over sequential integers in public URLs.",
      "Document which parameters are optional and what default applies when they are missing.",
    ],
    realWorldUseCases: [
      "Nested resources like `/users/:userId/orders/:orderId` pass the parent id into services for ownership checks.",
      "File routes such as `/files/:name{.:ext}` serve `report.pdf` and `report` with one handler.",
    ],
    resources: [
      docs(
        "Express API — req.params",
        OFFICIAL.expressApi,
        "Official description of the request object, including parameters.",
        "en",
        "reference",
      ),
      docs(
        "Moving to Express 5 — req.params changes",
        "https://expressjs.com/en/guide/migrating-5",
        "Null-prototype params, array wildcards and omitted unmatched parameters.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Express route parameters validation tutorial",
        "Videos covering req.params, decoding and validating route inputs.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-params-1",
        title: "Parameter autopsy",
        prompt:
          "Create a route `GET /api/items/:itemId/reviews/:reviewId` that echoes both parameters. Then use curl to request: a normal id, an id containing `%20`, an id containing `%2F`, and an id containing `%zz`. Record the exact response of each and explain the difference between the middle two.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Use quotes around the URL in bash so `%` is not interpreted by the shell.",
          "`%2F` decodes to a slash inside one segment; a real slash would add a segment.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-query-params",
    slug: "query-parameters",
    title: "Query Parameters",
    description:
      "req.query as a getter in Express 5, the simple parser's string-only semantics, arrays, coercion, defaults and whitelisting.",
    order: 5,
    estimatedMinutes: 18,
    tags: ["express", "query-string", "url"],
    prerequisites: ["p2m2-routing", "p1m1-json"],
    relatedTopics: ["p2m2-input-validation", "p2m2-pagination-filtering-sorting", "p2m2-route-params"],
    learningObjectives: [
      "Explain that req.query is a read-only getter backed by the simple query parser in Express 5",
      "Predict the shape of req.query for repeated keys, empty values and plus signs",
      "Coerce string query values into numbers, booleans and dates safely",
      "Apply defaults and whitelists before using query input",
    ],
    simpleExplanation:
      "Everything after `?` in a URL is the query string — the standard place for filters, pagination and search terms. Express puts a parsed object on `req.query`, but every value is a **string** (or an array of strings when a key repeats), so booleans, numbers and defaults are up to you.",
    detailedContent: `
Everything after \`?\` in a URL is the query string: the standard way to pass optional, cache-safe parameters for listing, filtering, searching and sorting.

**Express 5 changed two things here:**

1. \`req.query\` is a **getter**, not a writable property. Assigning \`req.query.page = 1\` no longer works — build a new object instead.
2. The default query parser changed from \`extended\` (the \`qs\` library, nested objects) to \`simple\` (Node's \`querystring\`):

       GET /search?q=hello+world&tag=node&tag=api&page=2&active=true

       req.query.q       // "hello world"    (+ is decoded as a space)
       req.query.tag     // ["node", "api"]  repeated keys become arrays
       req.query.page    // "2"              still a string
       req.query.active  // "true"           not a boolean
       req.query["ids[]"] // bracket notation is NOT parsed anymore

Everything is a string (or an array of strings). The same semantics are visible without Express via \`URLSearchParams\`:

    const params = new URLSearchParams("q=a+b&tag=1&tag=2&flag");
    params.get("q");       // "a b"
    params.getAll("tag");  // ["1", "2"]
    params.get("flag");    // ""      (present but empty — not null)
    params.get("missing"); // null

Numbers, booleans and dates must be converted deliberately (\`Number(...)\`, \`=== "true"\`, or a Zod schema with \`z.coerce\`), and unknown keys should be ignored rather than trusted. Because the parser is flat, repeated keys are the only array signal you get: normalise with \`[].concat(q.tags ?? [])\` so single and repeated values behave identically downstream.
    `,
    howItWorks: `
On first access to \`req.query\`, Express calls the configured query parser and caches the result behind the getter. With the simple parser, \`querystring.parse\` splits on \`&\` and \`=\`, percent-decodes, maps \`+\` to a space, and collects duplicate keys into arrays — it does **not** interpret \`a[b]=c\` nesting.

Because parsing is lazy, a URL carrying a very long query is only parsed when your code reads \`req.query\`; still reject absurd URLs at the proxy. If your code relied on \`qs\` nesting from Express 4, either restore it with \`app.set("query parser", "extended")\` or (better) redesign the contract to use flat keys, which are far easier to validate.
    `,
    codeExamples: [
      {
        title: "Reading query values with defaults and coercion",
        language: "js",
        code: `import express from "express";
const app = express();

app.get("/api/tasks", (req, res) => {
  // req.query is read-only in Express 5 — read, then normalise locally
  const q = req.query;
  const page = Math.max(1, Number(q.page ?? "1") || 1);
  const limit = Math.min(100, Number(q.limit ?? "20") || 20);
  const done = q.done === undefined ? undefined : q.done === "true";
  const tags = q.tags === undefined ? [] : [].concat(q.tags);

  res.json({ page, limit, done, tags, raw: q });
});

app.listen(3000);`,
        description:
          "`[].concat(q.tags)` handles both shapes: a single string when the key appears once, an array when it repeats.",
      },
      {
        title: "Query semantics without Express",
        language: "js",
        code: `const url = "/search?q=hello+world&tag=node&tag=api&page=2&active=true&empty=";
const params = new URLSearchParams(url.split("?")[1]);

params.get("q");         // "hello world"   + becomes a space
params.getAll("tag");    // ["node", "api"]
params.get("page");      // "2"             still a string
params.get("active");    // "true"          not a boolean
params.get("empty");     // ""              empty string, not null
params.has("missing");   // false
Number(params.get("page"));          // 2
params.get("active") === "true";     // true`,
        description:
          "Test your parsing rules in a plain Node script like this before wiring them into a route — it makes the edge cases obvious.",
      },
    ],
    commonMistakes: [
      "Assuming `?active=true` arrives as a boolean — it is the string `\"true\"`, and any non-empty string is truthy in JavaScript.",
      "Migrating from Express 4 and losing `?filter[status]=done` nesting, which the simple parser now ignores.",
      "Mutating `req.query` to pass defaults downstream — it is a getter in Express 5 and the write is silently lost or throws in strict code.",
      "Trusting `Number(userInput)` without bounds: `?limit=999999` can still make your database work hard.",
    ],
    bestPractices: [
      "Validate and coerce the whole query with one schema (lesson 20) instead of ad-hoc `Number()` calls in every handler.",
      "Whitelist query keys: ignore anything you do not explicitly accept.",
      "Cap numeric ranges (`limit` ≤ 100) and reject non-numbers with 400 rather than silently defaulting.",
    ],
    realWorldUseCases: [
      "List endpoints (`/api/tasks?page=2&done=false`) are built entirely from query parameters.",
      "Search and filtering UIs pass their whole state as query strings, which keeps URLs shareable and cacheable.",
    ],
    resources: [
      docs(
        "Express — req.query and the query parser",
        OFFICIAL.expressApi,
        "Official API reference for the request object and its query property.",
        "en",
        "reference",
      ),
      docs(
        "Moving to Express 5 — req.query is a getter",
        "https://expressjs.com/en/guide/migrating-5",
        "Explains the getter change and the switch to the simple parser.",
        "en",
        "8 min",
      ),
      ytSearch(
        "Express query parameters tutorial req.query",
        "Videos walking through query strings, arrays and defaults in Express.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-query-1",
        title: "Predict req.query",
        prompt:
          "For each URL, write the exact value of `JSON.stringify(req.query)` in an Express 5 app using the simple parser: `/x?a=1&a=2`, `/x?b`, `/x?c=`, `/x?d=hello+world`, `/x?e[f]=1`, `/x?g=%C3%A9`.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "Repeated keys become arrays; bare keys become empty strings.",
          "The simple parser does not interpret bracket notation.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-inventory-api", "p2-job-board-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-request-bodies",
    slug: "request-bodies",
    title: "Request Bodies",
    description:
      "express.json() and express.urlencoded(), Content-Type matching, size limits, and the Express 5 pitfall where req.body is undefined until a parser ran.",
    order: 6,
    estimatedMinutes: 18,
    tags: ["express", "body-parser", "json"],
    prerequisites: ["p2m2-routing", "p1m1-headers", "p1m1-json"],
    relatedTopics: ["p2m2-input-validation", "p2m2-file-uploads-multer", "p2m2-middleware-builtins-custom"],
    learningObjectives: [
      "Install and configure express.json() and express.urlencoded() with sensible limits",
      "Explain why req.body is undefined in Express 5 when no parser matched",
      "Diagnose a missing or wrong Content-Type header with curl",
      "Handle malformed JSON and oversized payloads as 4xx responses, not crashes",
    ],
    simpleExplanation:
      "HTTP request bodies arrive as a raw stream of bytes. Body-parser middleware (`express.json()`, `express.urlencoded()`) reads that stream, checks the Content-Type header, parses it into a JavaScript object and puts it on `req.body` — but only when the Content-Type matches.",
    detailedContent: `
Bodies are streams: Node.js receives them in chunks, so something must read and parse them before your handler runs. Express ships that something as built-in middleware.

    app.use(express.json({ limit: "100kb" }));
    app.use(express.urlencoded({ extended: false, limit: "100kb" }));

How matching works:

- \`express.json()\` only acts when \`Content-Type\` includes \`application/json\`; \`express.urlencoded()\` targets \`application/x-www-form-urlencoded\`.
- If nothing matches, the middleware calls \`next()\` and **leaves the body alone**.
- Malformed JSON throws a \`SyntaxError\` carrying \`status: 400\`, which is forwarded to your error middleware.

**Express 5 differences that bite:**

- \`req.body\` is **undefined** when no parser ran. Express 4 returned \`{}\` — code that assumed an object now throws \`Cannot destructure ...\` of undefined.
- \`express.urlencoded()\` defaults to \`extended: false\` (flat \`querystring\` parsing). Express 4 defaulted to \`true\` (nested \`qs\` objects). Opt back in with \`{ extended: true }\` if you really need nesting.
- The parsers now also decompress \`br\` (Brotli) bodies, alongside gzip and deflate.

**Limits matter.** The default body limit is 100 kB. Raise it deliberately (\`{ limit: "1mb" }\`), never unbounded: an attacker streaming gigabytes would otherwise pin your memory and event loop.

A wrong or missing Content-Type produces 415-like behaviour: nothing is parsed, and your handler sees \`req.body === undefined\`. That is the number-one “my POST returns empty” bug.
    `,
    howItWorks: `
The parser middleware listens for \`data\` and \`end\` events on the request stream, enforcing the size limit as bytes accumulate. When the stream ends, it checks \`Content-Type\` again, runs \`JSON.parse\` (or \`querystring.parse\`), assigns the result to \`req.body\` and calls \`next()\`.

If the limit is exceeded the middleware destroys the socket and calls \`next(err)\` with a \`PayloadTooLargeError\` (\`status: 413\`). If parsing fails, \`SyntaxError\` is forwarded with \`status: 400\`. Because both carry a status, your error middleware can map them straight to a response without special-casing.

Only one body parser should ever consume a given request; registering several is fine because each one skips requests whose Content-Type it does not handle.
    `,
    codeExamples: [
      {
        title: "Configuring parsers with explicit limits",
        language: "js",
        code: `import express from "express";
const app = express();

// Order matters: parsers must run before any route that reads req.body
app.use(express.json({ limit: "100kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.post("/api/tasks", (req, res) => {
  // Express 5: undefined when the client sent no (matching) body
  if (req.body === undefined) {
    return res.status(415).json({ error: "SEND_JSON", hint: "Content-Type: application/json" });
  }
  res.status(201).json({ title: req.body.title ?? null, done: false });
});

app.listen(3000);`,
        description:
          "`strict: true` rejects bodies that are not a JSON object or array. The explicit `undefined` check turns a confusing crash into a helpful 415.",
      },
      {
        title: "Reproduce the three common body bugs",
        language: "bash",
        code: `# 1) works
curl -i -X POST http://127.0.0.1:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Learn Express"}'

# 2) no Content-Type → body stays undefined → 415 from your handler
curl -i -X POST http://127.0.0.1:3000/api/tasks \\
  -d '{"title":"Learn Express"}'

# 3) broken JSON → SyntaxError → 400 from your error middleware
curl -i -X POST http://127.0.0.1:3000/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": }'`,
        description:
          "Run all three before blaming Express: most body bugs are a missing header, a typo in the JSON, or a payload over the limit (which yields 413).",
      },
    ],
    commonMistakes: [
      "Reading `req.body` in a route mounted before `express.json()` — the parser has not run yet, so the body is undefined.",
      "Assuming Express 4 behaviour after upgrading: `const { title } = req.body` now throws when the body was never parsed.",
      "Raising the limit to `\"10mb\"` globally “just in case”: cap large uploads only on the upload route (lesson 16).",
      "Sending forms as JSON from a custom client without the header, then wondering why the handler sees nothing.",
    ],
    bestPractices: [
      "Register body parsers once, globally, immediately after other cross-cutting middleware and before routers.",
      "Keep the default 100 kB limit unless a specific route needs more, and raise it per route.",
      "Return 415 with a short hint when a body is required but the Content-Type did not match.",
    ],
    realWorldUseCases: [
      "Webhook receivers (Stripe, GitHub) post JSON at your API — correct parsing plus a size cap is their entire input surface.",
      "Form-based login pages post urlencoded bodies; `express.urlencoded()` covers them without extra packages.",
    ],
    resources: [
      docs(
        "Express — Body parsing middleware",
        "https://expressjs.com/en/resources/middleware/body-parser.html",
        "Options, limits and content-type matching for the parsers behind express.json().",
        "en",
        "12 min",
      ),
      docs(
        "Moving to Express 5 — req.body and urlencoded defaults",
        "https://expressjs.com/en/guide/migrating-5",
        "The undefined-body change and the extended: false default.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Express json body parser tutorial",
        "Videos demonstrating express.json, limits and the missing Content-Type bug.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-body-1",
        title: "Hunt the undefined body",
        prompt:
          "Build the app from the code example, then reproduce all three curl cases and record the status codes. Finally move `express.json()` to *after* the POST route and show that the working case now also returns 415 — explain why in one sentence.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Middleware order is registration order; a parser cannot retroactively fill a body.",
          "`-i` shows the status line and Content-Type of the response.",
        ],
        solution: `import express from "express";
const app = express();

app.post("/api/tasks", (req, res) => {
  if (req.body === undefined) {
    return res.status(415).json({ error: "SEND_JSON" });
  }
  res.status(201).json({ title: req.body.title });
});

// BUG: registered after the route, so req.body is undefined for it
app.use(express.json({ limit: "100kb" }));

app.listen(3000);
// Fix: move the app.use(express.json(...)) ABOVE the route.`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-middleware",
    slug: "middleware",
    title: "Middleware",
    description:
      "The (req, res, next) signature, execution order, calling next(), short-circuiting a request, and mounting middleware on a path prefix.",
    order: 7,
    estimatedMinutes: 20,
    tags: ["express", "middleware", "request-lifecycle"],
    prerequisites: ["p2m2-express-app", "p1m2-functions"],
    relatedTopics: ["p2m2-middleware-builtins-custom", "p2m2-express-router", "p2m2-error-handling-middleware"],
    learningObjectives: [
      "Describe the three-part middleware signature and what each argument is for",
      "Trace the exact order in which a request crosses registered middleware",
      "Short-circuit a request by responding without calling next()",
      "Mount middleware on a prefix and explain what happens to req.url and req.originalUrl",
    ],
    simpleExplanation:
      "Middleware functions are the building blocks of every Express app: small functions that receive the request, the response, and a `next` callback. They can log, authenticate, parse bodies, or answer the request outright — and they run one after another in the order you registered them.",
    detailedContent: `
An Express application is, in the docs' own words, “a series of middleware function calls executed during the request-response cycle”. A middleware function has the signature:

    function middleware(req, res, next) {
      // 1. run any code
      // 2. optionally modify req / res
      // 3. either end the response OR call next()
    }

**Execution order is registration order.** Express walks a single list; there is no priority between “global” and “route” middleware — only position in that list.

    client request
      → logger          (app.use, no path)
      → cors            (app.use, no path)
      → express.json    (app.use, no path)
      → auth            (app.use("/api"))
      → route handler   (app.get("/api/tasks"))
      → (nothing left)  → built-in 404

**Short-circuiting:** if a middleware sends a response, it must **not** call \`next()\`. Calling both causes “Cannot set headers after they are sent”.

**Mounting:** \`app.use("/api", mw)\` runs \`mw\` only for paths starting with \`/api\`. Inside, \`req.url\` has the prefix stripped (so a router sees \`/\`), \`req.baseUrl\` is \`/api\`, and \`req.originalUrl\` still holds the full URL.

Two escape hatches: \`next('route')\` skips the rest of the current route's handlers (only valid in handlers registered via \`app.METHOD\`), and \`next('router')\` exits the whole router instance.
    `,
    howItWorks: `
Every \`app.use\`/\`app.get\` call pushes a Layer onto the application's router. When a request arrives, Express iterates the layers, testing method and path; a matching layer's handlers are pushed onto a pending stack and executed in order.

\`next()\` pops the next pending handler. If the stack empties, Express moves to the next matching layer. If no layer matches at all, the final handler responds 404. Calling \`next(err)\` with an argument abandons the normal stack and searches forward for a **four-argument** error handler (lesson 11).

Because the mechanism is just a list, middleware order is the most common source of subtle bugs: a parser after a route never fills that route's body; a 404 catch-all before the routers hides them.
    `,
    codeExamples: [
      {
        title: "Watch the order a request crosses middleware",
        language: "js",
        code: `import express from "express";
const app = express();

app.use((req, res, next) => {
  console.log("1 global");
  next();
});

app.use("/api", (req, res, next) => {
  console.log("2 mounted on /api");
  console.log("   req.url:", req.url);           // "/tasks"
  console.log("   req.baseUrl:", req.baseUrl);   // "/api"
  console.log("   req.originalUrl:", req.originalUrl); // "/api/tasks"
  next();
});

app.get("/api/tasks", (req, res) => {
  console.log("3 route handler");
  res.json([]);
});

// GET /api/tasks prints: 1 global → 2 mounted on /api → 3 route handler
app.listen(3000);`,
        description:
          "The three log lines print in registration order. Note how mounting rewrites `req.url` while `req.originalUrl` keeps the client's full path.",
      },
      {
        title: "Short-circuiting with an auth gate",
        language: "js",
        code: `import express from "express";
const app = express();

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    // respond and STOP — no next(), the request ends here
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
  req.user = { id: "u_1", role: "member" }; // pretend token verification
  next();
}

app.get("/api/me", requireAuth, (req, res) => {
  res.json(req.user);
});

// GET /api/me          → 401
// GET /api/me + header → 200 {"id":"u_1","role":"member"}
app.listen(3000);`,
        description:
          "The `return` before `res.status(...)` is deliberate: it prevents any chance of a second response and makes the short-circuit obvious to readers.",
      },
    ],
    commonMistakes: [
      "Forgetting `next()` in middleware that should pass control on — the request hangs until the client times out.",
      "Calling `next()` after `res.send()`/`res.json()`, which triggers a headers-already-sent error.",
      "Assuming Express runs all middleware for a path: the first handler that responds stops everything.",
      "Using `next('route')` in `app.use()` middleware — it only works inside handlers registered with `app.METHOD`.",
    ],
    bestPractices: [
      "Draw your middleware order on paper before coding; it is cheaper than debugging a hidden short-circuit.",
      "Always `return res...` inside a conditional branch so the short-circuit is explicit.",
      "Give every middleware a name (a named function or a factory) so stack traces and logs are readable.",
    ],
    realWorldUseCases: [
      "Authentication is almost always a mounted middleware (`app.use(\"/api\", requireAuth)`) so no protected route forgets it.",
      "Rate limiting, request IDs and CORS are global middleware registered before any route.",
    ],
    resources: [
      docs(
        "Express — Using middleware",
        "https://expressjs.com/en/5x/guide/using-middleware",
        "Official tour of application-level, router-level and error-handling middleware.",
        "en",
        "12 min",
      ),
      docs(
        "Express — Writing middleware",
        "https://expressjs.com/en/5x/guide/writing-middleware",
        "How to structure your own middleware functions and factories.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Express middleware explained execution order",
        "Visual walkthroughs of next() and middleware ordering.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-middleware-1",
        title: "Trace it by hand",
        prompt:
          "Given `app.use(A)`, `app.use('/api', B)`, `app.get('/api/x', C, D)`, `app.use(E)`, write the execution order for `GET /api/x` if B never calls next, and again if it does. Then run it and compare with your prediction.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "A path-mounted middleware only participates when the URL starts with that prefix.",
          "If a function never calls next and never responds, the client just hangs.",
        ],
      },
      {
        id: "ex-p2m2-middleware-2",
        title: "Build a timing middleware",
        prompt:
          "Write `durationLogger(req, res, next)` that records `Date.now()` at entry, registers a `res.on('finish')` listener, logs `METHOD path → status (Xms)`, and calls next(). Mount it first in the app and confirm it also logs 404 responses.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "`res.on('finish')` fires after the response is fully flushed — the only safe place to log the status.",
          "The middleware must always call next(), otherwise the request never reaches your routes.",
        ],
        solution: `import express from "express";
const app = express();

function durationLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    console.log(req.method, req.originalUrl, "->", res.statusCode, "(" + (Date.now() - start) + "ms)");
  });
  next();
}

app.use(durationLogger);
app.get("/", (req, res) => res.json({ ok: true }));
// 404s are logged too, because the middleware ran before Express's final handler
app.listen(3000);`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-middleware-builtins-custom",
    slug: "built-in-and-custom-middleware",
    title: "Built-in and Custom Middleware",
    description:
      "The middleware Express ships with, cors as the canonical third-party package, and writing your own request-logger from scratch.",
    order: 8,
    estimatedMinutes: 18,
    tags: ["express", "middleware", "cors", "logging"],
    prerequisites: ["p2m2-middleware", "p2m1-code-organization"],
    relatedTopics: ["p2m2-static-files", "p2m2-logging-requests", "p2m2-request-bodies"],
    learningObjectives: [
      "List Express's built-in middleware and choose the right options for each",
      "Install and configure cors, and explain what problem it solves",
      "Write a reusable request-logger middleware with a factory signature",
      "Decide when to write your own middleware instead of installing a package",
    ],
    simpleExplanation:
      "Express ships a handful of ready-made middleware (`express.json()`, `express.static()`, `express.urlencoded()`, `express.raw()`, `express.text()`). Everything else — CORS, cookies, sessions, rate limiting — comes from packages, and anything unique to your app you write yourself as a small function you pass to `app.use()`.",
    detailedContent: `
Express's built-in middleware (all mounted with \`app.use\`):

- \`express.json()\` / \`express.urlencoded()\` — parse bodies (lesson 6)
- \`express.static(root)\` — serve files from a directory (lesson 14)
- \`express.raw()\` / \`express.text()\` — Buffer and plain-text bodies

**Third-party middleware** is installed as a package and configured by calling it: \`cors()\`, \`cookie-parser()\`, \`helmet()\`, \`express-rate-limit()\`, \`morgan()\`. The CORS package is the canonical example — browsers block cross-origin \`fetch\` unless the **server** answers the preflight \`OPTIONS\` and sends \`Access-Control-Allow-*\` headers:

    npm install cors

    import cors from "cors";
    app.use(cors({ origin: ["https://app.example.com"] }));

**Custom middleware** follows the same shape. Two styles are worth knowing:

1. *Bare function* — simplest, fine for singletons like a logger.
2. *Factory* — \`function requireRole(role) { return (req, res, next) => {...} }\`, which lets you configure the middleware at mount time. Most reusable middleware should be a factory.

The one rule that never changes: either end the response or call \`next()\`. A logger that forgets \`next()\` freezes every request in the app.

Order still matters — register CORS **before** routes so preflights never reach your handlers, and register body parsers before anything that reads \`req.body\`.
    `,
    howItWorks: `
When you write \`app.use(mw)\`, Express stores \`mw\` as a Layer with a match-everything path. On each request the layer runs; \`mw\` may read or write \`req\`/\`res\`, attach properties (\`req.user\`, \`req.id\`), or respond.

Third-party middleware is just a function that returns such a function: \`cors(options)\` returns a handler that inspects the \`Origin\` header, sets the matching \`Access-Control-Allow-*\` response headers, and — for preflight \`OPTIONS\` requests — responds immediately with 204 and never calls \`next()\`. That automatic preflight handling is why you do not hand-write OPTIONS routes.

Custom middleware like a request logger hooks into Node's response events (\`res.on('finish')\`) so it can measure duration and read the final status code after the response is flushed.
    `,
    codeExamples: [
      {
        title: "Built-ins plus cors, in the right order",
        language: "js",
        code: `import express from "express";
import cors from "cors";
const app = express();

// 1) CORS first: preflights never reach your routes
app.use(cors({
  origin: ["https://app.example.com"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));

// 2) Body parsers
app.use(express.json({ limit: "100kb" }));

// 3) Static assets
app.use(express.static("public", { index: "index.html" }));

// 4) Your routes
app.get("/api/ping", (req, res) => res.json({ pong: true }));

app.listen(3000);`,
        description:
          "Swap the order of 1 and 4 in a browser-based app and watch preflight requests fail with CORS errors — the headers never get set.",
      },
      {
        title: "A reusable request-logger factory",
        language: "js",
        code: `import crypto from "node:crypto";

export function requestLogger({ level = "info" } = {}) {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    req.id = req.headers["x-request-id"] ?? crypto.randomUUID();
    res.setHeader("x-request-id", req.id);

    res.on("finish", () => {
      const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
      console.log(JSON.stringify({
        level,
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        status: res.statusCode,
        durationMs,
      }));
    });

    next(); // never forget: a logger must not stop the chain
  };
}

// usage
import express from "express";
const app = express();
app.use(requestLogger({ level: "info" }));`,
        description:
          "The factory signature (`requestLogger(options)`) is the same pattern used by morgan, helmet and rate-limit — it keeps configuration at the call site.",
      },
    ],
    commonMistakes: [
      "Registering `cors()` after the routes so preflight OPTIONS requests never receive the allow headers.",
      "Writing a custom body parser when `express.json({ limit })` already covers it.",
      "Forgetting `next()` in custom middleware — the classic cause of requests that hang with no error.",
      "Copying a third-party middleware's options object from a v4 tutorial into Express 5 without checking the changelog.",
    ],
    bestPractices: [
      "Prefer established packages (cors, helmet, express-rate-limit) over hand-rolled security middleware.",
      "Write custom middleware as factories so tests can mount them with different options.",
      "Log via a `finish` listener, not at entry, so you can include the real status and duration.",
    ],
    realWorldUseCases: [
      "A React dev server on :5173 calling an API on :3000 needs `cors()` during development and an explicit origin allow-list in production.",
      "Request loggers with correlation ids are how you reconstruct one user's journey across services.",
    ],
    resources: [
      docs(
        "Express — Built-in middleware",
        "https://expressjs.com/en/5x/api/express",
        "Reference for express.json, express.static, express.raw, express.text and express.urlencoded.",
        "en",
        "reference",
      ),
      docs(
        "cors for Express",
        "https://github.com/expressjs/cors",
        "The official CORS middleware package, with option reference and preflight behaviour.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Express cors middleware tutorial",
        "Videos explaining preflight requests and configuring cors().",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-builtins-1",
        title: "Break CORS on purpose",
        prompt:
          "Start an Express API with `cors()` restricted to `http://localhost:5173`. Use curl to send a request with `Origin: http://evil.example` and record the response headers. Then remove `cors()` entirely and repeat. Explain which header the browser needs to read the response.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Look for `Access-Control-Allow-Origin` in the response with `curl -i`.",
          "A preflight is the OPTIONS request a browser sends before the real one.",
        ],
      },
      {
        id: "ex-p2m2-builtins-2",
        title: "Middleware menu",
        prompt:
          "List five middleware you would add to a public JSON API before writing any routes (built-in or third-party), one line each on what it protects or provides, and the exact `app.use` line for it.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Candidates: request-id logger, cors, helmet, express.json, rate limiter, auth, 404, error handler."],
      },
    ],
    projectIds: ["p2-task-api", "p2-chat-backend"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-express-router",
    slug: "express-router",
    title: "Express Router",
    description:
      "Modular routers, mount paths, mergeParams, encapsulation and next('router') — splitting a growing app into independently testable route modules.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["express", "router", "modularity"],
    prerequisites: ["p2m2-middleware", "p2m2-routing"],
    relatedTopics: ["p2m2-app-structure", "p2m2-controllers-services", "p2m2-route-params"],
    learningObjectives: [
      "Create a Router, define routes on it and mount it at a prefix",
      "Explain what happens to req.url, req.baseUrl and req.params when a router is mounted",
      "Use mergeParams to read parent parameters inside a nested router",
      "Use next('router') to bail out of a whole router instance",
    ],
    simpleExplanation:
      "An `express.Router()` is a mini-application with its own list of routes and middleware but no port. You build it in one file (`task.routes.js`), then attach it at a prefix (`app.use(\"/api/tasks\", taskRouter)`), which keeps every resource in its own module.",
    detailedContent: `
As an app grows, one \`app.get\` list becomes unmanageable. \`express.Router()\` gives you a mountable sub-application: it has \`use\`, \`get\`, \`post\` and friends, its own middleware stack, and no knowledge of ports.

    // routes/task.routes.js
    export const taskRouter = express.Router();
    taskRouter.use(requireAuth);          // applies only inside this router
    taskRouter.get("/", listTasks);
    taskRouter.post("/", createTask);
    taskRouter.get("/:taskId", getTask);

    // app.js
    app.use("/api/tasks", taskRouter);     // URL prefix applied here

What mounting does:

- Paths inside the router are **relative** — \`"/:taskId"\` becomes \`/api/tasks/:taskId\`.
- \`req.url\` is stripped to the unmatched remainder (\`/:taskId\`), while \`req.originalUrl\` keeps the client's full URL.
- \`req.baseUrl\` is the mount prefix (\`/api/tasks\`).
- Parameters from the mount path are **not** visible inside the router unless you create it with \`{ mergeParams: true }\`.

**Encapsulation** is the big win: middleware added to a router never leaks to other resources, and router files can be imported in tests without an app at all. It also improves security review — you can see at a glance that \`requireAuth\` guards every route of this resource and nothing else.

**Bailing out:** \`next('router')\` from inside router middleware exits the entire router instance and resumes in the application — perfect for a guard that should fall through to a public handler mounted after the router.
    `,
    howItWorks: `
A Router is the same Layer machinery as the application itself, just nested. When the app's router matches a mounted prefix, it rewrites \`req.url\`, sets \`req.baseUrl\`, and delegates the remainder to the child router's own layer list. The child walks its layers exactly like the parent does.

\`mergeParams: true\` copies the parent's \`req.params\` object into the child's before matching, which is how \`/users/:userId/tasks\` can expose both \`userId\` and \`taskId\` to the same handler.

When a router finishes without responding, control returns to the parent — which is why a request that matches nothing inside \`taskRouter\` can still fall through to your global 404 handler.
    `,
    codeExamples: [
      {
        title: "A resource router with encapsulated middleware",
        language: "js",
        code: `import express from "express";
import { requireAuth } from "../middleware/require-auth.js";
import * as taskController from "../controllers/task.controller.js";

export const taskRouter = express.Router();

// Runs for every route below, and for nothing else in the app
taskRouter.use(requireAuth);

taskRouter
  .route("/")
  .get(taskController.list)
  .post(taskController.create);

taskRouter
  .route("/:taskId")
  .get(taskController.getOne)
  .put(taskController.replace)
  .delete(taskController.remove);`,
        description:
          "The router file imports no `app` at all — it can be mounted anywhere or tested standalone with supertest.",
      },
      {
        title: "Nested routers with mergeParams",
        language: "js",
        code: `import express from "express";
const app = express();

const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.get("/", (req, res) => {
  // mounted at /api/users/:userId/reviews
  res.json({ userId: req.params.userId, reviews: [] });
});

const userRouter = express.Router({ mergeParams: true });
userRouter.use("/:userId/reviews", reviewRouter);

app.use("/api/users", userRouter);

// GET /api/users/42/reviews → { userId: "42", reviews: [] }
app.listen(3000);`,
        description:
          "Both routers need `mergeParams: true`: the child inherits `userId` from the parent mount path, not from its own pattern.",
      },
    ],
    commonMistakes: [
      "Defining absolute paths inside a router (`taskRouter.get(\"/api/tasks\", ...)`) and double-prefixing the URL after mounting.",
      "Forgetting `mergeParams: true` and finding `req.params.userId` undefined in a nested router.",
      "Expecting router middleware to run for requests that never enter the router — encapsulation cuts both ways.",
      "Registering a router after a catch-all 404 so it never receives a request.",
    ],
    bestPractices: [
      "One file per resource in `routes/`, each exporting a single Router.",
      "Keep router files to route declarations; push logic into controllers (lesson 10).",
      "Mount routers in one place (`app.js` or `routes/index.js`) so the full URL map is visible at a glance.",
    ],
    realWorldUseCases: [
      "Large APIs mount dozens of routers (`/users`, `/orders`, `/admin`) that different teams own.",
      "Nested resources — `/blogs/:blogId/posts/:postId/comments` — are naturally expressed with nested routers.",
    ],
    resources: [
      docs(
        "Express API — express.Router",
        OFFICIAL.expressApi,
        "Official reference for the Router class and its methods.",
        "en",
        "reference",
      ),
      docs(
        "Express — Router-level middleware",
        "https://expressjs.com/en/5x/guide/using-middleware",
        "How router.use and next('router') behave inside a mounted router.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Express router tutorial modular routes",
        "Videos building resource routers and mounting them with prefixes.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-router-1",
        title: "Split a monolith into routers",
        prompt:
          "Take every route in your lesson-1 app and move it into `routes/task.routes.js` and `routes/user.routes.js`, each exporting a Router. Mount them from `app.js` and verify all previous curl checks still pass with the same URLs.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Strip the mount prefix from every path inside the router file.",
          "Auth middleware that should protect both resources stays in app.js, or is added with router.use in each file.",
        ],
      },
    ],
    projectIds: ["p2-blog-api", "p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-controllers-services",
    slug: "controllers-and-services",
    title: "Controllers and Services",
    description:
      "Separating HTTP concerns from business logic: thin controllers, framework-free services, and passing dependencies so everything stays testable.",
    order: 10,
    estimatedMinutes: 20,
    tags: ["express", "architecture", "testing"],
    prerequisites: ["p2m2-app-structure", "p2m1-code-organization"],
    relatedTopics: ["p2m2-express-router", "p2m2-error-handling-middleware", "p2m2-input-validation"],
    learningObjectives: [
      "State what belongs in a controller and what belongs in a service",
      "Write a controller that only reads req, calls a service and shapes res",
      "Keep services free of Express imports so they can be unit-tested",
      "Pass dependencies (repositories) into services for testability",
    ],
    simpleExplanation:
      "A **controller** is the HTTP adapter: it pulls data out of the request, asks a **service** to do the work, and writes the response. The service contains the actual business rules and knows nothing about HTTP — which means you can test the rules with a plain function call, no server required.",
    detailedContent: `
Mixing HTTP and business logic in route handlers works until the second consumer appears (a cron job, a CLI, a queue worker) or the second test suite.

**Controller responsibilities** (HTTP only):

- Read \`req.params\`, \`req.query\`, \`req.body\`, headers
- Choose a status code and shape the response
- Translate thrown errors into \`next(err)\` (or nothing, in Express 5)
- No business rules, no database calls

**Service responsibilities** (business only):

- Validate invariants (“a task title is required, max 200 chars”)
- Apply rules (“a user may only delete their own task”)
- Orchestrate repositories and third-party clients
- Throw domain errors (\`NotFoundError\`, \`ConflictError\`) instead of writing responses

**Dependency passing** keeps both layers testable:

    const taskService = createTaskService(taskRepository);

    // tests
    const fakeRepo = { insert: async (row) => ({ id: "t1", ...row }) };
    const svc = createTaskService(fakeRepo);
    await svc.create({ title: "x" });   // no HTTP, no database

A useful rule of thumb: if a line mentions \`req\` or \`res\`, it belongs in the controller; if it mentions a business noun or a rule, it belongs in the service.

Express 5 makes controllers even thinner: a rejected promise from an async controller reaches the error middleware automatically, so the \`try { ... } catch (err) { next(err) }\` boilerplate can go (you still catch locally when you need cleanup, like deleting a half-written upload).
    `,
    howItWorks: `
At startup, \`app.js\` (or a small composition root) instantiates the real repository, builds each service with it, and injects the service into a controller factory. The router only ever sees the finished handler functions.

    routes → controllers (HTTP) → services (rules) → repositories/models (data)

During a request, the controller runs first, awaiting the service. The service awaits the repository. Results or errors travel back up; the controller turns them into \`res.status(...).json(...)\` or \`next(err)\`.

Because services never import Express, the same unit tests exercise every rule with in-memory fakes, and the same service can be called from a background worker without duplicating logic.
    `,
    codeExamples: [
      {
        title: "A service with an injected repository",
        language: "js",
        code: `// services/task.service.js — no "express" import anywhere in this file
export function createTaskService(taskRepo, { clock = () => new Date() } = {}) {
  return {
    async create(userId, input) {
      const title = String(input.title ?? "").trim();
      if (!title) {
        const err = new Error("title is required");
        err.status = 422;
        throw err;
      }
      if (title.length > 200) {
        const err = new Error("title must be 200 characters or fewer");
        err.status = 422;
        throw err;
      }
      return taskRepo.insert({ userId, title, done: false, createdAt: clock() });
    },

    async remove(userId, taskId) {
      const task = await taskRepo.findById(taskId);
      if (!task) {
        const err = new Error("task not found");
        err.status = 404;
        throw err;
      }
      if (task.userId !== userId) {
        const err = new Error("forbidden");
        err.status = 403;
        throw err;
      }
      await taskRepo.deleteById(taskId);
    },
  };
}`,
        description:
          "The injectable `clock` is a small testability trick: deterministic timestamps without mocking Date globally.",
      },
      {
        title: "A thin controller wired to the service",
        language: "js",
        code: `// controllers/task.controller.js
export function makeTaskController(taskService) {
  return {
    async create(req, res, next) {
      try {
        const task = await taskService.create(req.user.id, req.body);
        res.status(201).json(task);
      } catch (err) {
        next(err); // Express 4 style; in Express 5 a rejected promise reaches the error middleware on its own
      }
    },

    async remove(req, res, next) {
      // Express 5: no try/catch needed — rejections are forwarded for you
      await taskService.remove(req.user.id, req.params.taskId);
      res.status(204).end();
    },
  };
}

// composition root (app.js or server.js)
import { createTaskService } from "./services/task.service.js";
import { makeTaskController } from "./controllers/task.controller.js";
import { taskRepository } from "./models/task.model.js";

const taskController = makeTaskController(createTaskService(taskRepository));`,
        description:
          "Controllers stay under ten lines each; all the interesting logic lives in the service where tests can reach it.",
      },
    ],
    commonMistakes: [
      "Controllers that query the database directly — the rules then cannot be tested without a live database.",
      "Services that import `req`/`res` or call `res.json`: the business logic becomes untestable and un-reusable.",
      "Returning domain strings from services (\"please try again\") instead of throwing typed errors.",
      "Creating a new repository instance per request instead of composing once at startup.",
    ],
    bestPractices: [
      "One controller factory per resource, one service per bounded area of the business.",
      "Throw errors with a `status` (or a custom AppError — lesson 21) and let the error middleware decide the response.",
      "Inject dependencies as arguments: it is the simplest form of dependency injection and needs no framework.",
    ],
    realWorldUseCases: [
      "An order service reused by the REST API, a background email worker and an admin CLI without duplicating rules.",
      "Feature flags changing a rule in one service file instead of across dozens of route handlers.",
    ],
    resources: [
      docs(
        "Node.js Best Practices — Layered application design",
        OFFICIAL.nodeBestPractices,
        "Catalogue of structuring practices including controllers, services and dependency injection.",
        "en",
        "reference",
      ),
      docs(
        "Express — Writing middleware",
        "https://expressjs.com/en/5x/guide/writing-middleware",
        "Background on the handler functions controllers ultimately export.",
        "en",
        "8 min",
      ),
      ytSearch(
        "Express MVC controllers services separation of concerns",
        "Videos refactoring route handlers into controllers and services.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-controllers-1",
        title: "Extract a service",
        prompt:
          "Take your task routes and move every non-HTTP line into `services/task.service.js` with an injected repository. Write three unit tests for the service using an in-memory fake repository, with no Express code at all.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "If a line uses `req`, it stays in the controller.",
          "An array-backed `Map` makes a convincing fake repository.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-inventory-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-error-handling-middleware",
    slug: "error-handling-middleware",
    title: "Error-handling Middleware",
    description:
      "The four-argument signature, next(err), how Express 5 forwards rejected promises from async handlers, and the v4 wrapper pattern you will still meet.",
    order: 11,
    estimatedMinutes: 22,
    tags: ["express", "errors", "async"],
    prerequisites: ["p2m2-middleware", "p1m2-error-handling-try-catch", "p2m1-error-propagation"],
    relatedTopics: ["p2m2-centralized-error-handling", "p2m2-handling-404", "p2m1-custom-errors"],
    learningObjectives: [
      "Write an error-handling middleware and explain why it needs exactly four arguments",
      "Trigger it with next(err) and with a thrown error",
      "Describe how Express 5 forwards rejected promises and how Express 4 required a wrapper",
      "Register error handlers after routes so they are actually reachable",
    ],
    simpleExplanation:
      "Any middleware can hand an error to Express by calling `next(err)`. Express then skips normal middleware and runs the next **four-argument** function `(err, req, res, next)` — that is your error handler, the single place that turns failures into consistent responses.",
    detailedContent: `
Error-handling middleware looks like ordinary middleware but takes **exactly four** arguments:

    app.use((err, req, res, next) => {
      console.error(err);
      res.status(err.status ?? 500).json({ error: "INTERNAL_ERROR" });
    });

If you declare only three, Express treats it as regular middleware and it will never receive errors. Declaring four — even with an unused \`_next\` — is what marks it.

**How an error reaches it:** calling \`next(err)\` (with anything truthy) abandons the current handler chain and scans forward for the next four-argument function. Ordinary middleware is skipped.

**Express 5 makes async errors automatic.** A rejected promise returned by a handler or middleware is forwarded to the error middleware as if you had called \`next(err)\`:

    // Express 4: this silently becomes an unhandled rejection
    app.get("/users/:id", async (req, res) => {
      const user = await users.find(req.params.id); // throws → nothing catches it
      res.json(user);
    });

    // Express 5: the rejection reaches your error middleware

In Express 4 you had to write \`...then(ok).catch(next)\`, or install \`express-async-errors\`. Projects still on v4 must keep that habit.

**Placement is critical:** error handlers only see errors raised *before* them in the stack, so register them after all routes — right before or after your 404 fallback (lesson 12). Multiple error handlers run in registration order; the first one that responds wins.
    `,
    howItWorks: `
The router keeps two notions of “next”: a normal next (continue with ordinary middleware) and an error next (skip to a four-argument function). When \`next(err)\` is called — explicitly, by a thrown sync error Express catches, or by Express 5 from a rejected promise — the router walks the remaining layers looking for arity-4 functions.

If one is found, it runs with the error as the first argument; if it calls \`next(err)\` again, the following error handler runs. If none is found, Express's **default** error handler takes over: it logs the stack and answers with a plain-text (often HTML) 500, which is exactly what you do not want your API clients to receive. That is why a JSON API must always install its own final error middleware.
    `,
    codeExamples: [
      {
        title: "One error middleware for the whole app (Express 5)",
        language: "js",
        code: `import express from "express";
const app = express();
app.use(express.json());

app.get("/api/boom", async (req, res) => {
  throw new Error("database is on fire"); // Express 5 forwards this for you
});

app.post("/api/things", (req, res, next) => {
  Promise.reject(new Error("async in a non-async handler")).catch(next);
});

// Must be registered AFTER every route
app.use((err, req, res, next) => {
  console.error(err); // full stack in logs, never in the response
  res.status(err.status ?? 500).json({
    error: err.status ? err.code ?? "ERROR" : "INTERNAL_ERROR",
    message: err.status ? err.message : "Something went wrong",
  });
});

app.listen(3000);`,
        description:
          "Both routes now fail safely: the client gets JSON, the log gets the stack. The 500 message is deliberately generic.",
      },
      {
        title: "The Express 4 wrapper you will still meet",
        language: "js",
        code: `// Express 4 only — without this, async throws never reach the error handler
app.get("/users/:id", (req, res, next) => {
  userService
    .find(req.params.id)
    .then((user) => res.json(user))
    .catch(next); // ← the manual bridge
});

// Or the popular package form, also Express 4:
//   import "express-async-errors";
//   // after that, async handlers behave like Express 5

// Express 5 equivalent — just write the async handler:
app.get("/users/:id", async (req, res) => {
  res.json(await userService.find(req.params.id));
});`,
        description:
          "When you inherit a v4 codebase, search for missing `.catch(next)` first: silent async failures are its most common production bug.",
      },
    ],
    commonMistakes: [
      "Declaring the error handler with three arguments, so Express treats it as normal middleware and errors fall through to the default HTML 500.",
      "Registering the error handler before the routes — errors raised in later routes find nothing to handle them.",
      "Calling `next()` (without an argument) after an error, which continues the normal chain as if nothing went wrong.",
      "Sending `err.stack` to the client: it leaks file paths, dependencies and sometimes query text.",
    ],
    bestPractices: [
      "Keep exactly one final error middleware per app; give it the whole error envelope (lesson 21).",
      "Log the full error server-side; return a generic message plus a request id for support.",
      "In Express 4 codebases, add `express-async-errors` once at boot instead of writing `.catch(next)` everywhere.",
    ],
    realWorldUseCases: [
      "A single error handler guarantees every 4xx/5xx response has the same JSON shape for mobile clients.",
      "Database outages surface as one 500 path instead of a different half-finished response per route.",
    ],
    resources: [
      docs(
        "Express — Error handling",
        "https://expressjs.com/en/5x/guide/error-handling",
        "Official guide to error middleware, next(err) and the default handler.",
        "en",
        "12 min",
      ),
      docs(
        "Moving to Express 5 — rejected promises",
        "https://expressjs.com/en/guide/migrating-5",
        "How Express 5 forwards rejected promises from handlers to error middleware.",
        "en",
        "8 min",
      ),
      ytSearch(
        "Express error handling middleware tutorial",
        "Videos demonstrating next(err), four-argument handlers and async errors.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-errors-1",
        title: "Make the default handler disappear",
        prompt:
          "Create a route that throws, then start the app and call it before adding any error middleware — record exactly what the client receives. Add your JSON error middleware and call it again. Paste both responses and explain what changed.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Without a custom handler Express uses its built-in final handler, which is not JSON.",
          "Register the error middleware after the route.",
        ],
      },
      {
        id: "ex-p2m2-errors-2",
        title: "Arity check",
        prompt:
          "Write two error handlers: one with 3 parameters and one with 4, registered in that order. Throw in a route and explain which (if any) runs. Then swap their order and predict the new outcome before testing.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Express decides what a middleware is by counting its declared parameters.",
          "The 4-argument handler must come after the error is raised.",
        ],
        solution: `import express from "express";
const app = express();

app.get("/boom", (req, res, next) => next(new Error("kaboom")));

// 3 args → regular middleware, never sees the error
app.use((req, res, next) => console.log("3-arg middleware ran"));

// 4 args → error handler, receives the error
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(3000);`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-handling-404",
    slug: "handling-404",
    title: "Handling 404s",
    description:
      "The JSON fallback route, why placement order decides whether it works, and how to answer unmatched paths and wrong methods in an API.",
    order: 12,
    estimatedMinutes: 14,
    tags: ["express", "404", "api-design"],
    prerequisites: ["p2m2-routing", "p2m2-express-router"],
    relatedTopics: ["p2m2-error-handling-middleware", "p2m2-centralized-error-handling", "p2m2-static-files"],
    learningObjectives: [
      "Write a JSON 404 fallback middleware",
      "Place it correctly relative to routers, the SPA fallback and the error handler",
      "Explain why registration order determines whether the fallback is ever reached",
      "Distinguish 404 (unknown path) from 405 (known path, wrong method)",
    ],
    simpleExplanation:
      "When no route matches, Express answers with its own plain-text 404 — useless for a JSON API. You replace that with one middleware registered after every route: it runs only for unmatched paths and returns a consistent JSON error your clients can parse.",
    detailedContent: `
Every Express app must answer the same final question: “nothing matched”. Express's built-in answer is an HTML/plain-text 404. For an API you replace it with a fallback registered **after all routes** and **before the error handler**:

    app.use(logger)
    app.use(express.json())
    app.use("/api/tasks", taskRouter)
    app.use("/api/users", userRouter)
    app.use(notFound)        ← reached only when no route matched
    app.use(errorHandler)    ← reached only via next(err)

Placement is the entire lesson. Put \`notFound\` above your routers and it swallows every request before they run; put it after the error handler and plain unmatched paths still work, but the stack no longer reads in the obvious order.

Details worth handling:

- Answer with JSON and a machine-readable code: \`{ "error": "NOT_FOUND", "path": "/api/nope" }\`.
- Include the requested path — it turns “it 404s” support tickets into one-line answers.
- **405 for a known path with the wrong verb** is more accurate than 404; add an \`Allow\` header (an \`app.all\` fallback per resource does this neatly).
- **SPA apps** must split the two cases: \`/api/*\` gets JSON 404, everything else gets \`index.html\` so client-side routing can take over.

Keep the fallback tiny. Any real logic belongs in a route or the error handler — the 404 middleware should only read \`req.method\` and \`req.originalUrl\` and answer.
    `,
    howItWorks: `
There is no special “404 mechanism”: your fallback is simply a middleware with an always-matching path registered last. When the router exhausts its layers without a response, control reaches the next matching layer — yours — which sends the JSON 404.

The error handler behaves differently: it runs **only** when \`next(err)\` was called. That is why both can sit at the end of the stack without colliding — unmatched paths fall into the 404, failures jump over it into the error handler.

A useful side effect: if your 404 middleware itself throws, the exception is picked up by the error middleware registered after it, so even the fallback cannot produce Express's default HTML error page.
    `,
    codeExamples: [
      {
        title: "A JSON 404 fallback with method awareness",
        language: "js",
        code: `import express from "express";
import { taskRouter } from "./routes/task.routes.js";

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use("/api/tasks", taskRouter);

// Registered AFTER every router — nothing below this line is a route
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: \`No route for \${req.method} \${req.originalUrl}\`,
  });
});

app.listen(3000);`,
        description:
          "Add this as the second-to-last middleware in every API. Including method and path in the body makes client-side debugging instant.",
      },
      {
        title: "405 with an Allow header for known paths",
        language: "js",
        code: `const taskRouter = express.Router();

taskRouter.get("/", listTasks);
taskRouter.post("/", createTask);

// Same paths, every other verb → 405, not 404
taskRouter.all("/", (req, res) => {
  res.set("allow", "GET, POST");
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
});

taskRouter.all("/:taskId", (req, res) => {
  res.set("allow", "GET, PUT, DELETE");
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
});`,
        description:
          "`router.all` catches only verbs you did not implement, so the 404 fallback still handles genuinely unknown paths inside the resource.",
      },
    ],
    commonMistakes: [
      "Registering the 404 fallback before the routers, which makes every endpoint return 404.",
      "Returning Express's default HTML 404 to a JSON client, which breaks `res.json()` parsing on the frontend.",
      "Using 404 for a wrong HTTP method — clients and caches treat 404 and 405 differently.",
      "Forgetting that the SPA fallback and the API 404 must be separated by path prefix.",
    ],
    bestPractices: [
      "Standardise one 404 envelope and reuse it everywhere, including for nested routers.",
      "Log unmatched API paths: a spike of 404s usually means a client bug or a removed endpoint.",
      "Keep `notFound` and `errorHandler` as the last two lines of `app.js`, always in that order.",
    ],
    realWorldUseCases: [
      "Mobile apps show a friendly “not found” screen by parsing `{ error: \"NOT_FOUND\" }` instead of HTML.",
      "Public APIs record 404s per path to spot partners still calling endpoints you removed.",
    ],
    resources: [
      docs(
        "Express — Error handling",
        "https://expressjs.com/en/5x/guide/error-handling",
        "How the final handler and your own fallbacks fit together.",
        "en",
        "10 min",
      ),
      docs(
        "Express — Basic routing",
        "https://expressjs.com/en/5x/starter/basic-routing",
        "Route matching behaviour that decides when the fallback runs.",
        "en",
        "8 min",
      ),
      ytSearch(
        "Express 404 not found handler tutorial",
        "Videos showing JSON 404 middleware and placement order.",
        "en",
        "6–12 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-404-1",
        title: "Place the fallback",
        prompt:
          "Add a JSON 404 middleware to your app. Prove with curl that (a) an existing route still answers 200, (b) an unknown path returns your JSON 404, and (c) moving the fallback above the routers breaks (a). Paste the three status codes.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Registration order is the only thing that changes between the runs.",
          "Use `curl -i` so the status line is in the output.",
        ],
        solution: `import express from "express";
const app = express();
app.use(express.json());

app.get("/api/ping", (req, res) => res.json({ pong: true }));

// LAST: only reached when no route above matched
app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND", path: req.originalUrl });
});

app.listen(3000);
// curl -i /api/ping        → 200
// curl -i /api/does-not    → 404 {"error":"NOT_FOUND",...}`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-url-shortener"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-configuration-management",
    slug: "configuration-management",
    title: "Configuration Management",
    description:
      "Environment-based config objects, validating configuration at boot with a schema, the 12-factor rules, and a single config module every file imports.",
    order: 13,
    estimatedMinutes: 17,
    tags: ["express", "configuration", "environment"],
    prerequisites: ["p1m4-env-vars-node", "p2m2-express-app"],
    relatedTopics: ["p2m2-app-structure", "p2m2-logging-requests", "p2m1-code-organization"],
    learningObjectives: [
      "Centralise all environment access in one config module",
      "Validate configuration at boot and fail fast with a clear message",
      "Coerce environment strings into typed values deliberately",
      "Follow 12-factor rules: no secrets in the repo, same code in every environment",
    ],
    simpleExplanation:
      "Configuration is everything your app needs to run but must not hardcode: ports, database URLs, secrets, log levels. Store it in environment variables, read it **once** in a module that validates the values, and let every other file import the finished object.",
    detailedContent: `
Configuration is everything your application needs to run but must not hardcode: ports, database URLs, API keys, feature flags, log levels. The [12-factor app](https://12factor.net/) keeps config **in the environment** and code identical across development, staging and production.

The pattern every serious Express project uses:

1. **One config module** (\`config/index.js\`) reads \`process.env\` exactly once.
2. **Validate at boot** with a schema. Missing or malformed config is a deployment mistake — fail fast with \`process.exit(1)\` and the field names, instead of discovering it on the first request at 3 a.m.
3. **Freeze and export** an object. Every other file imports \`config\`; only this file touches \`process.env\`.

       const schema = z.object({
         PORT: z.coerce.number().int().min(1).default(3000),
         DATABASE_URL: z.string().min(1),
         JWT_SECRET: z.string().min(32),
         NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
       });

Rules that save you later:

- Never commit \`.env\`; commit \`.env.example\` with placeholder values.
- Secrets come from the environment or a secret manager — never the repository, and never the frontend bundle.
- Defaults live in the schema, so a missing optional value behaves identically everywhere.
- Environment variables are **always strings**: coerce them once, in the schema, rather than with \`Number(...)\` scattered around the code.
    `,
    howItWorks: `
At boot, the config module runs its schema against \`process.env\`. Failures print which fields are wrong — which instantly exposes a typo like \`DATABSE_URL\` — and the process exits **before** binding a port, so a broken deployment fails its health check immediately instead of half-working.

The exported object is typed and defaults-filled: \`config.PORT\` is a number, \`config.NODE_ENV\` is one of three strings. No other file needs guards like \`Number(process.env.PORT ?? 3000)\`.

Containers then inject different values per environment while the code, tests and build artifacts stay byte-identical — the essence of “build once, deploy many”.
    `,
    codeExamples: [
      {
        title: "A validated config module",
        language: "js",
        code: `// config/index.js
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // fail fast — never start with broken config
}

export const config = Object.freeze(parsed.data);`,
        description:
          "`z.coerce.number()` turns the string \"3000\" into a number; `Object.freeze` makes accidental mutation an immediate TypeError in development.",
      },
      {
        title: "Using config everywhere else",
        language: "js",
        code: `// server.js
import "dotenv/config";          // loads .env into process.env (dev only)
import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();
const server = app.listen(config.PORT, (error) => {
  if (error) throw error;
  console.log("listening on port", config.PORT, "in", config.NODE_ENV);
});

// anywhere else in the app:
// import { config } from "./config/index.js";
// await connect(config.DATABASE_URL);`,
        description:
          "Only `server.js` and the config module ever look at the environment; the rest of the code just imports typed values.",
      },
    ],
    commonMistakes: [
      "Reading `process.env` inside handlers — every read needs its own default and validation, and they drift apart.",
      "Committing `.env` with real credentials: it lives in git history forever.",
      "Assuming a value is a number because it looks like one — `process.env.PORT` is always the string `\"3000\"`.",
      "Letting the app boot with missing config and crashing later on the first login attempt.",
    ],
    bestPractices: [
      "Validate once, at boot, and exit non-zero so orchestrators roll the deployment back.",
      "Provide `.env.example` with safe placeholders and keep it in sync with the schema.",
      "Keep secrets out of logs: redact keys matching SECRET, TOKEN, PASSWORD in your logger.",
    ],
    realWorldUseCases: [
      "The same Docker image runs in dev, staging and production with only environment differences.",
      "A wrong secret is caught in the first seconds of startup instead of by a failing login hours later.",
    ],
    resources: [
      docs(
        "The Twelve-Factor App — Config in the environment",
        OFFICIAL.twelveFactor,
        "The canonical rules for storing config in environment variables.",
        "en",
        "8 min",
      ),
      docs(
        "Zod — Schemas and coercion",
        OFFICIAL.zodDocs,
        "Schema validation used to check configuration at boot.",
        "en",
        "10 min",
      ),
      ytSearch(
        "Node.js environment variables config module tutorial",
        "Videos building validated config modules with dotenv and schemas.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-config-1",
        title: "Fail fast on purpose",
        prompt:
          "Create the config module above, start the app with `JWT_SECRET=short node server.js`, and record the output and exit code. Then fix the environment and confirm the app boots. Write one sentence explaining why exiting at boot is better than throwing on the first request.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["`process.exit(1)` signals failure to shells and orchestrators.", "Field errors from `flatten()` show exactly which key is wrong."],
      },
    ],
    projectIds: ["p2-auth-api", "p2-chat-backend"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-static-files",
    slug: "serving-static-files",
    title: "Serving Static Files",
    description:
      "express.static options — index files, cache headers, dotfiles in Express 5 — and why directory traversal is already handled for you (unless you bypass it).",
    order: 14,
    estimatedMinutes: 16,
    tags: ["express", "static", "security"],
    prerequisites: ["p2m2-express-app", "p1m1-headers"],
    relatedTopics: ["p2m2-template-engines", "p2m2-request-bodies", "p2m2-handling-404"],
    learningObjectives: [
      "Mount express.static and explain index and fallthrough behaviour",
      "Set sensible cache headers, including immutable headers for fingerprinted assets",
      "Explain the Express 5 dotfiles default change and when to opt in",
      "Recognise directory-traversal attempts and why user input must never reach sendFile directly",
    ],
    simpleExplanation:
      "`express.static(\"public\")` turns a folder into a website: it maps URLs to files, sets the right Content-Type, adds caching headers, and streams the bytes. Crucially, it also refuses to serve anything outside that folder — which is exactly the protection a hand-written file route forgets.",
    detailedContent: `
\`express.static(root, options)\` serves files with correct \`Content-Type\`, \`Last-Modified\` and \`ETag\` headers — everything a hand-rolled file route gets wrong.

    app.use(express.static(path.join(process.cwd(), "public")));

Options that matter:

- \`index\` (default \`"index.html"\`) — served for directory requests; set \`false\` to disable.
- \`fallthrough\` (default \`true\`) — no file matched → call \`next()\` so your API routes below still work.
- \`maxAge\` — browser cache lifetime in milliseconds or a string like \`"1h"\`.
- \`setHeaders(res, filePath)\` — per-file header control, e.g. \`cache-control: public, max-age=31536000, immutable\` for fingerprinted bundles.
- \`dotfiles\` — **Express 5 changed the default to \`"ignore"\`**. Paths through a dot-directory (\`/.well-known/acme-challenge/...\`) now return 404 unless you mount that folder with \`dotfiles: "allow"\`.

**Security — no directory traversal.** The \`send\` module resolves each request path inside \`root\` and rejects \`..\`, absolute paths and null bytes; a request for \`/../../etc/passwd\` never escapes. That protection lives in \`send\`/ \`res.sendFile({ root })\` — **not** in string concatenation. Never write \`res.sendFile(req.query.path)\` or \`path.join(BASE, req.params.file)\` without validating the name: \`..\` in user input is the classic traversal payload.

Keep uploads outside the served directory and hand out files through a controlled route that checks ownership.
    `,
    howItWorks: `
For each request the middleware joins the URL path onto \`root\`, normalises it, and verifies the result still starts with \`root\`. It then \`stat\`s the file and streams it with \`fs.createReadStream\`, so memory stays flat no matter the size.

It computes an ETag from size and modification time and answers \`304 Not Modified\` when \`If-None-Match\` matches, letting browsers reuse cached copies. MIME types come from the extension (Express 5 serves \`.js\` as \`text/javascript\`).

If nothing matched and \`fallthrough\` is true, \`next()\` passes the request on — which is how your API 404 middleware can still run for unknown paths.
    `,
    codeExamples: [
      {
        title: "Static assets with layered cache policy",
        language: "js",
        code: `import express from "express";
import path from "node:path";
const app = express();

const PUBLIC_DIR = path.join(process.cwd(), "public");

app.use(express.static(PUBLIC_DIR, {
  index: "index.html",
  maxAge: "1h",
  dotfiles: "ignore", // Express 5 default — set "allow" only for a specific mount
  setHeaders(res, filePath) {
    if (filePath.includes(path.sep + "assets" + path.sep)) {
      // fingerprinted files: cache forever
      res.setHeader("cache-control", "public, max-age=31536000, immutable");
    }
  },
}));

// e.g. serve ACME challenges that live in a dot-directory
app.use(
  "/.well-known",
  express.static(path.join(PUBLIC_DIR, ".well-known"), { dotfiles: "allow" }),
);

app.listen(3000);`,
        description:
          "Two mounts with different policies: normal assets stay cacheable for an hour, fingerprinted bundles forever, and dotfiles are only exposed where you opted in.",
      },
      {
        title: "SPA fallback that cannot leak files",
        language: "js",
        code: `app.use(express.static(PUBLIC_DIR));

// Client-side router owns everything that is not our JSON API
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next(); // → JSON 404 middleware

  // Absolute path built from a constant — never from user input
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => {
    if (err) next(err);
  });
});`,
        description:
          "`sendFile` requires an absolute path (or a `root` option). Because the path comes from a constant, no `..` in the URL can influence it.",
      },
    ],
    commonMistakes: [
      "Serving the uploads folder statically so deleted or private files stay publicly reachable by guessable names.",
      "Forgetting the Express 5 dotfiles change and losing `/.well-known` routes after an upgrade.",
      "Building file paths by concatenating user input — `..%2f..%2fetc/passwd` escapes any folder you did not sanitise.",
      "Setting `immutable` caching on files whose names do not change: browsers will not pick up new versions.",
    ],
    bestPractices: [
      "Serve only a dedicated `public/` directory; keep uploads, `.env` and source code outside it.",
      "Fingerprint built assets (`app.4f3a2b1c.js`) and cache them forever; keep HTML `no-cache` or short-lived.",
      "Let `express.static` handle traversal; never reimplement path checks with string replacement.",
    ],
    realWorldUseCases: [
      "React/Vite builds are dropped into `public/` and served by one `express.static` line in production.",
      "Let's Encrypt HTTP challenges require explicitly allowing `/.well-known` in Express 5.",
    ],
    resources: [
      docs(
        "Express — Serving static files",
        "https://expressjs.com/en/5x/starter/static-files",
        "Official walkthrough of express.static and its options.",
        "en",
        "8 min",
      ),
      docs(
        "Moving to Express 5 — static dotfiles",
        "https://expressjs.com/en/guide/migrating-5",
        "The `dotfiles: \"ignore\"` default change and how to opt in.",
        "en",
        "6 min",
      ),
      ytSearch(
        "Express static files and cache headers tutorial",
        "Videos on express.static, ETag/Last-Modified and caching strategy.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-static-1",
        title: "Audit your static setup",
        prompt:
          "Serve a `public/` folder, then use curl to record: the Content-Type of a `.js` file, whether `ETag` and `Last-Modified` are present, the response for a missing file, and the response for `/public/../.env`. Explain each result in one line.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "`curl -i` shows headers; look for `etag` and `cache-control`.",
          "Traversal attempts never leave `root` — you should get 404, not file contents.",
        ],
      },
    ],
    projectIds: ["p2-blog-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-template-engines",
    slug: "template-engines",
    title: "Template Engines",
    description:
      "EJS and Pug basics, res.render, escaping rules, view caching in production, and when server-rendered HTML beats a single-page app.",
    order: 15,
    estimatedMinutes: 17,
    tags: ["express", "ssr", "ejs", "pug"],
    prerequisites: ["p2m2-express-app", "p1m1-json"],
    relatedTopics: ["p2m2-static-files", "p2m2-app-structure", "p1m1-frontend-backend"],
    learningObjectives: [
      "Configure a view engine and views directory, then render a template with locals",
      "Choose the escaped output form and explain the XSS risk of the raw form",
      "Explain when view caching kicks in and why it differs between dev and production",
      "Decide when server-side rendering beats a client-side SPA",
    ],
    simpleExplanation:
      "A template engine turns a file plus data into HTML on the server: you call `res.render(\"post\", { post })`, Express loads `views/post.ejs`, fills in the values and sends the result. Escaped output (`<%= %>`) keeps user input from becoming executable HTML.",
    detailedContent: `
Template engines turn a template file plus data into HTML on the server. Express integrates them through two settings and one method:

    app.set("view engine", "ejs");                  // res.render("post") → views/post.ejs
    app.set("views", path.join(process.cwd(), "views"));
    res.render("post", { post, title: post.title }); // sends HTML, Content-Type: text/html

Two engines you will meet:

- **EJS** — HTML with \`<%= value %>\` (HTML-escaped) and \`<%- rawHtml %>\` (raw).
- **Pug** — indentation-based; \`p= title\` escapes, \`p!= raw\` does not.

**Escaping is the security boundary.** \`<%=\` / \`p=\` HTML-escape the value, so \`<script>\` from a user arrives as visible text. Only use the raw form for HTML you generated or sanitised yourself — one \`<%- post.body %>\` with unsanitised content is a stored XSS hole.

**Caching.** With \`NODE_ENV=production\`, Express caches compiled templates, so \`res.render\` runs a cached function instead of recompiling from disk. In development the cache is off — edit a template, refresh, see it. Express 5 also enforces the asynchronous engine interface, so a slow \`renderFile\` cannot block the event loop the way a sync implementation could.

**SSR vs SPA:** server rendering wins for content-heavy, SEO-critical pages (blogs, marketing, emails, public docs) and gives a fast first paint. A highly interactive dashboard still favours a client-side SPA that talks to your JSON API — which is exactly why this module teaches both.
    `,
    howItWorks: `
\`res.render(view, locals)\` resolves \`view\` under the \`views\` directory, picks the engine registered for its extension (a function shaped like \`function (path, options, callback)\`), and calls it with the locals merged with app settings.

The engine reads the file, compiles it into a JavaScript function (cached when view caching is enabled), executes it with the data, and returns an HTML string. Express sets the content type and ends the response. If the engine calls back with an error — a missing template, a thrown \`TypeError\` in the template — that error goes to your error middleware like any other.
    `,
    codeExamples: [
      {
        title: "Rendering a page with escaped and raw output",
        language: "js",
        code: `import express from "express";
import path from "node:path";
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

app.get("/posts/:slug", async (req, res, next) => {
  try {
    const post = await postService.findBySlug(req.params.slug);
    if (!post) return res.status(404).render("404", { title: "Not found" });
    res.render("post", { post, title: post.title });
  } catch (err) {
    next(err);
  }
});

app.listen(3000);`,
        description:
          "Rendering is normal middleware: a missing template or a thrown error lands in your four-argument error handler.",
      },
      {
        title: "The template — escape by default",
        language: "html",
        code: `<!-- views/post.ejs -->
<article>
  <h1><%= post.title %></h1>          <!-- escaped: safe for user input -->
  <p>By <%= post.authorName %></p>   <!-- escaped -->
  <div><%- post.sanitizedHtml %></div><!-- raw: ONLY for trusted/sanitised HTML -->
</article>`,
        description:
          "Make `<%=` the habit; treat every `<%-` as a code-review flag that must justify why its value is trusted.",
      },
    ],
    commonMistakes: [
      "Forgetting `app.set(\"view engine\", ...)` and calling `res.render(\"x\")` — Express then has no engine for the extension.",
      "Using `<%-` for user content, which is a stored XSS vulnerability.",
      "Editing templates in production with view caching on and wondering why nothing changes until restart.",
      "Serving rendered HTML from one route and JSON from another without agreeing who owns the layout and assets.",
    ],
    bestPractices: [
      "Escape by default; sanitise once at the boundary if you must render rich HTML.",
      "Keep templates dumb: pass plain data, put logic in the service (a `views/` file should not query a database).",
      "Turn on view caching in production and restart on deploy — never edit templates on a running server.",
    ],
    realWorldUseCases: [
      "Marketing pages, blogs, transactional emails and admin dashboards rendered on the server for SEO and speed.",
      "Progressive enhancement: HTML first, then small scripts — often simpler and more resilient than a full SPA.",
    ],
    resources: [
      docs(
        "Express — Using template engines",
        "https://expressjs.com/en/5x/guide/using-template-engines",
        "Official setup for `app.set('view engine')` and `res.render`.",
        "en",
        "10 min",
      ),
      docs(
        "EJS repository",
        "https://github.com/mde/ejs",
        "Template syntax reference, including escaping and includes.",
        "en",
        "reference",
      ),
      ytSearch(
        "Express EJS template engine tutorial",
        "Videos building server-rendered pages with EJS or Pug.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-views-1",
        title: "Render a list page",
        prompt:
          "Create `views/index.ejs` listing five tasks passed as locals, with a link per task. Render it from `GET /`, then inject a task title of `<script>alert(1)</script>` and show that the escaped output renders as text rather than executing.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "`<% tasks.forEach(...) %>` runs logic; `<%= %>` prints escaped values.",
          "Check the page source: you should see `&lt;script&gt;`.",
        ],
      },
    ],
    projectIds: ["p2-blog-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-file-uploads-multer",
    slug: "file-uploads-with-multer",
    title: "File Uploads with Multer",
    description:
      "multipart/form-data, disk vs memory storage, field naming, size limits, cleanup of failed uploads and the security rules for user files.",
    order: 16,
    estimatedMinutes: 22,
    tags: ["express", "uploads", "multer", "multipart"],
    prerequisites: ["p2m2-request-bodies", "p1m1-headers"],
    relatedTopics: ["p2m2-request-bodies", "p2m2-centralized-error-handling", "p2m2-static-files"],
    learningObjectives: [
      "Explain why file uploads use multipart/form-data instead of JSON",
      "Choose between diskStorage and memoryStorage for a given use case",
      "Match upload field names to the form/FormData key and handle the mismatch",
      "Apply size/count limits, map MulterError codes to status codes and clean up on failure",
    ],
    simpleExplanation:
      "Files cannot travel as JSON. A `multipart/form-data` request splits the body into labelled parts — text fields plus raw file bytes — and Multer reads that stream, writes each file where you told it to, and puts the results on `req.file`/`req.body`.",
    detailedContent: `
Browsers cannot send a file as JSON. A form with \`enctype="multipart/form-data"\` splits the body into parts separated by a boundary marker: ordinary text fields plus raw bytes. Multer parses that stream for you.

    const upload = multer({ storage, limits, fileFilter });

- **diskStorage** — writes into a destination directory with a filename you generate. Survives restarts; costs file I/O and needs cleanup logic.
- **memoryStorage** — keeps the whole file in a Buffer. Only for small files you forward immediately (upload to S3, run through a resize pipeline). A 200 MB file here is a 200 MB Buffer on your heap.
- **Field naming** — \`upload.single("avatar")\` matches \`<input name="avatar">\` and \`formData.append("avatar", file)\`. A mismatch is *not* an error: \`req.file\` is simply \`undefined\`, which is the classic “multer does nothing” bug.
- **Limits** — \`limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 }\`. Exceeding \`fileSize\` throws a \`MulterError\` with \`code: "LIMIT_FILE_SIZE"\` → map it to 413.
- **fileFilter** — reject by mimetype before anything reaches disk.

**Cleanup.** If validation of the rest of the payload fails, \`unlink\` the written file. Orphaned uploads are a silent disk leak.

**Security.** Never trust \`originalname\` — generate your own (random UUID + whitelisted extension). Store uploads **outside** the served directory and deliver them through a route that checks ownership. Cap size and count. A believable extension proves nothing: validate the type and consider scanning.
    `,
    howItWorks: `
Multer consumes the request stream, parsing MIME boundaries itself. Text parts are collected into \`req.body\`; the first file part is handed to the storage engine, which either streams it to disk (\`fs.createWriteStream\`) or accumulates it in memory. \`limits.fileSize\` is enforced as bytes arrive, so an over-sized upload is aborted early instead of after the whole body is buffered.

The first file lands on \`req.file\`, extra files on \`req.files\` (a keyed object for \`upload.fields([...])\`). Failures are \`MulterError\` instances carrying \`code\`, so one error middleware can translate them: \`LIMIT_FILE_SIZE\` → 413, \`LIMIT_UNEXPECTED_FILE\` (wrong field name) → 400 — and every non-Multer error can pass through to your global handler.
    `,
    codeExamples: [
      {
        title: "Configuring storage, limits and an allow-list",
        language: "js",
        code: `import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { config } from "./config/index.js";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(config.UPLOAD_DIR, "tmp")),
  filename: (req, file, cb) => {
    // never trust originalname: random id + whitelisted extension only
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10 },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED.includes(file.mimetype));
  },
});`,
        description:
          "Rejecting in `fileFilter` avoids writing junk to disk; the generated filename removes path-traversal and collision worries in one line.",
      },
      {
        title: "A route that cleans up after itself",
        language: "js",
        code: `import fs from "node:fs/promises";

// field name "cover" must match the client's FormData key
router.post("/posts/:postId/cover", upload.single("cover"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "NO_FILE" });

    const body = coverSchema.safeParse(req.body);
    if (!body.success) throw Object.assign(new Error("invalid caption"), { status: 422 });

    const post = await postService.setCover(req.params.postId, req.file.path, body.data);
    res.json(post);
  } catch (err) {
    // do not orphan the upload when the rest of the request fails
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

// Multer errors arrive here before the global handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: err.code });
  }
  next(err);
});`,
        description:
          "Cleanup on failure and explicit MulterError mapping are the two habits that separate a demo upload from a production one.",
      },
    ],
    commonMistakes: [
      "Mismatched field names — `upload.single(\"avatar\")` with `formData.append(\"file\", ...)` silently yields `req.file === undefined`.",
      "Using memoryStorage for multi-megabyte files and exhausting the heap under load.",
      "Trusting `file.originalname`, which can contain `../` and arbitrary characters.",
      "Leaving files on disk when the accompanying record (post, product) fails to save.",
    ],
    bestPractices: [
      "Set both `fileSize` and `files` limits on every upload route; they are your defence against abuse.",
      "Store uploads outside `public/` and stream them back through an authenticated route.",
      "Log upload failures with the Multer error code so you can spot clients sending bad field names.",
    ],
    realWorldUseCases: [
      "Blog cover images and e-commerce product photos: disk (or S3) storage plus a resize worker.",
      "Avatar uploads where memoryStorage is fine — the file is tiny and forwarded straight to object storage.",
    ],
    resources: [
      docs(
        "Multer (official Express middleware)",
        OFFICIAL.multerDocs,
        "Storage engines, limits, fileFilter and error handling.",
        "en",
        "15 min",
      ),
      docs(
        "Multer middleware page on expressjs.com",
        "https://expressjs.com/en/resources/middleware/multer.html",
        "Express's own middleware catalogue entry for Multer.",
        "en",
        "8 min",
      ),
      ytSearch(
        "Multer file upload Express tutorial",
        "Videos covering diskStorage, limits and common field-name mistakes.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-uploads-1",
        title: "Upload from curl",
        prompt:
          "Expose `POST /uploads` with `upload.single(\"file\")`. Use `curl -F \"file=@./photo.png\"` to upload, then repeat with a different field name (`-F \"image=@...\"`) and record both responses. Finally send a file over the size limit and record the status code.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "`-F` sends multipart/form-data with the field name you specify.",
          "Over-limit uploads surface as a MulterError, not a normal route error.",
        ],
      },
      {
        id: "ex-p2m2-uploads-2",
        title: "Prove the cleanup path",
        prompt:
          "Add a caption field required by your handler but omitted by the client, so the route fails after the file was written. Count files in the upload directory before and after the failed request, then add the `unlink` cleanup and show the count stays at zero.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Save `req.file.path` before any validation that can throw.",
          "On Windows use `Get-ChildItem .\\uploads\\tmp | Measure-Object` to count.",
        ],
        solution: `router.post("/posts/:postId/cover", upload.single("cover"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "NO_FILE" });
    if (!req.body.caption) {
      const err = new Error("caption is required");
      err.status = 422;
      throw err;
    }
    res.json(await postService.setCover(req.params.postId, req.file.path, req.body));
  } catch (err) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
});`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-blog-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-logging-requests",
    slug: "logging-and-requests",
    title: "Logging Requests",
    description:
      "morgan-style request logging, correlation ids, structured JSON logs, and deciding what belongs in a log line (and what never does).",
    order: 17,
    estimatedMinutes: 17,
    tags: ["express", "logging", "observability"],
    prerequisites: ["p2m2-middleware", "p2m2-app-structure"],
    relatedTopics: ["p2m2-configuration-management", "p2m2-error-handling-middleware", "p2m2-centralized-error-handling"],
    learningObjectives: [
      "Add morgan request logging and define a custom token",
      "Attach a correlation id to every request, response and log line",
      "Emit structured JSON logs that an aggregator can index",
      "Decide what to log — and what must never appear in a log",
    ],
    simpleExplanation:
      "After a request finishes, the only evidence it existed is your logs. A good log line answers: who asked, what they asked for, what happened, how long it took, and a request id that ties this line to every other line the same request produced.",
    detailedContent: `
Every completed request should leave **one** line containing: the method, the path, the status, the duration, a correlation id, and (when known) the user id.

The classic tool is **morgan**, an Express middleware with preset formats:

    npm install morgan
    app.use(morgan("dev"));            // colourful one-liner for development
    app.use(morgan("combined"));       // Apache-style for production

For real systems, **structured JSON logs** beat pretty strings — every field becomes searchable in your aggregator:

    {"level":"info","requestId":"b31f...","method":"GET","path":"/api/tasks","status":200,"durationMs":12}

**What to log:** method, the matched route pattern (for example \`/api/tasks/:id\`, not every concrete id), status, duration, requestId, user id, error codes — and never the raw query string, which can carry tokens. Aggregating on the pattern is what makes “p95 latency of GET /api/tasks/:id” a single query instead of a million rows.

**What never to log:** \`Authorization\` headers, cookies, passwords, full request bodies in production, and personal data you have no retention policy for. Logs are copied, shipped and stored for years — treat them as an attack surface, not a scratchpad.

**Correlation ids** are the glue. Accept an incoming \`x-request-id\` (or generate one), echo it in the response, stamp every log line with it, and forward it to downstream services. Then “the user says it failed at 14:03” becomes one grep.
    `,
    howItWorks: `
Request loggers hook two moments: **entry**, to stamp a start time and attach an id, and **\`res.on('finish')\`**, when the response has been fully flushed and the status code is final. Logging only at entry gives you no status and no duration; logging right after \`res.end()\` without waiting for \`finish\` can miss late failures.

With correlation ids, one incoming request becomes a readable story across your API, its database calls and third-party clients. Aggregators (Loki, CloudWatch, Datadog) index the JSON fields, so “all 500s on /api/payments in the last hour” is a single query instead of a scroll through interleaved text.
    `,
    codeExamples: [
      {
        title: "morgan with a request-id token",
        language: "js",
        code: `import express from "express";
import morgan from "morgan";
import crypto from "node:crypto";

const app = express();

app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] ?? crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});

morgan.token("request-id", (req) => req.id);
app.use(morgan(":remote-addr :request-id :method :url :status :response-time ms"));

app.listen(3000);`,
        description:
          "The custom token turns morgan's fixed format into a correlatable one — the id appears in both the log and the client's response.",
      },
      {
        title: "A structured logger with a finish hook",
        language: "js",
        code: `export function structuredLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const line = {
      level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split("?")[0], // query strings can carry tokens
      status: res.statusCode,
      durationMs: Date.now() - start,
      userId: req.user?.id,
    };
    console.log(JSON.stringify(line));
  });

  next();
}`,
        description:
          "One JSON line per request, levelled by status. `split('?')[0]` keeps secrets out of the path field.",
      },
    ],
    commonMistakes: [
      "Logging the full `Authorization` header or cookies — a log leak becomes a credential leak.",
      "Logging only at request entry, so you never learn the status or duration of failures.",
      "Log-spamming health checks (`/healthz` every five seconds) and drowning real traffic.",
      "Generating a request id but never echoing it to the client, so users cannot quote it in bug reports.",
    ],
    bestPractices: [
      "One JSON line per request in production; keep `morgan('dev')` for local development.",
      "Propagate `x-request-id` to every outbound call so traces stitch across services.",
      "Log at the right level: 5xx → error (with stack), 4xx → warn, 2xx/3xx → info.",
    ],
    realWorldUseCases: [
      "Support asks “what happened to order 553?” — the order id in the payload is useless without the requestId that links the logs.",
      "Post-incident reviews reconstruct timelines from structured logs instead of guesswork.",
    ],
    resources: [
      docs(
        "morgan for Express",
        "https://github.com/expressjs/morgan",
        "The de-facto request-logging middleware: formats, tokens and stream options.",
        "en",
        "10 min",
      ),
      docs(
        "morgan middleware page on expressjs.com",
        "https://expressjs.com/en/resources/middleware/morgan.html",
        "Express's middleware catalogue entry with usage examples.",
        "en",
        "6 min",
      ),
      ytSearch(
        "Express morgan logging tutorial request id",
        "Videos on request logging, custom tokens and correlation ids.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-log-1",
        title: "Follow one request through the logs",
        prompt:
          "Add a correlation-id middleware plus the structured logger, make three requests (200, 404, and one with a failing handler), and paste the three log lines. Then use the id from the failing request to explain how you would find its full story in a real aggregator.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "`curl -i` shows the `x-request-id` response header.",
          "Different statuses should map to different `level` values.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-chat-backend"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-api-versioning",
    slug: "api-versioning",
    title: "API Versioning",
    description:
      "URL vs header versioning, a compatibility strategy that avoids needless versions, and the deprecation headers that tell clients when to move.",
    order: 18,
    estimatedMinutes: 16,
    tags: ["express", "api-design", "versioning"],
    prerequisites: ["p2m2-routing", "p1m1-rest"],
    relatedTopics: ["p2m2-pagination-filtering-sorting", "p2m2-express-router", "p2m2-controllers-services"],
    learningObjectives: [
      "Compare URL-path and header-based versioning with their trade-offs",
      "Decide which changes need a new version and which do not",
      "Mount versioned routers that share one service layer",
      "Signal deprecation with Deprecation, Sunset and Link headers",
    ],
    simpleExplanation:
      "Versioning lets you change a response without breaking clients that have not updated. Either the version lives in the URL (`/v1/users`) or in a request header (`Accept: application/vnd.myapi.v1+json`) — pick one before launch, because retrofitting it is the expensive part.",
    detailedContent: `
Versioning exists so you can change a response shape without breaking clients mid-flight.

| Approach | Example | Pros | Cons |
| --- | --- | --- | --- |
| URL path | \`/v1/users\`, \`/v2/users\` | Obvious, curl-friendly, cacheable per version | The version appears in every route and log line |
| Header | \`Accept: application/vnd.myapi.v1+json\` | Clean URLs, one route table | Harder to test with curl; caches must \`Vary\` on Accept |

**Compatibility strategy** (identical for both designs):

- **Additive changes need no version bump.** A new optional response field is not breaking; document it.
- **Breaking changes get a new version** — renamed or removed fields, changed types, new required parameters.
- Version the **HTTP layer only**: the v2 controller serialises differently, but both call the same service. Duplicated business logic is how versioning rots.
- Keep the old version alive for an announced window and **measure its traffic** before deleting it.

**Deprecation headers** are the polite contract:

    Deprecation: true
    Sunset: Wed, 01 Jul 2026 00:00:00 GMT
    Link: </v2/users>; rel="successor-version"

Clients (and your own monitoring) can then watch usage fall to zero before the route is removed.
    `,
    howItWorks: `
URL versioning is just mount paths: \`app.use("/v1/users", userV1Router)\` and \`app.use("/v2/users", userV2Router)\`, both delegating to one \`userService\` with differently shaped controllers.

Header versioning needs a middleware that parses the \`Accept\` header into \`req.apiVersion\` and dispatches to a versioned serializer. Remember \`res.vary("Accept")\` — without it a CDN may cache the v1 representation and serve it to v2 clients. (Express 5 throws if \`res.vary\` is called with no argument, so always pass the field name.)

Whichever you choose, document it in your API guide on day one, and make the default (no version specified) an explicit decision rather than an accident.
    `,
    codeExamples: [
      {
        title: "URL versioning with a shared service",
        language: "js",
        code: `import express from "express";
import { userService } from "./services/user.service.js";

const app = express();
app.use(express.json());

// v1: flat representation
const v1 = express.Router();
v1.get("/:id", async (req, res) => {
  const user = await userService.find(req.params.id);
  res.json({ id: user.id, name: user.name });
});

// v2: nested, adds email — breaking change, new version
const v2 = express.Router();
v2.get("/:id", async (req, res) => {
  const user = await userService.find(req.params.id);
  res.json({ data: { id: user.id, fullName: user.name, email: user.email } });
});

app.use("/v1/users", v1);
app.use("/v2/users", v2);
app.listen(3000);`,
        description:
          "One service, two serialisers. Business rules stay in one place while each version's contract can evolve independently.",
      },
      {
        title: "Header versioning middleware",
        language: "js",
        code: `export function apiVersion(defaultVersion = "1") {
  return (req, res, next) => {
    const accept = req.get("accept") ?? "";
    const match = accept.match(/application\\/vnd\\.myapi\\.v(\\d+)\\+json/);
    req.apiVersion = match ? match[1] : defaultVersion;
    res.vary("Accept"); // caches must key on this header
    next();
  };
}

// usage
app.use(apiVersion("1"));
app.get("/users/:id", async (req, res) => {
  const user = await userService.find(req.params.id);
  res.json(req.apiVersion === "2" ? toV2(user) : toV1(user));
});`,
        description:
          "The regex extracts a digit from `application/vnd.myapi.v2+json`; anything else falls back to the default version.",
      },
    ],
    commonMistakes: [
      "Forking services per version, so a bugfix has to be applied in three places.",
      "Shipping a header-versioned API without `Vary: Accept`, letting caches serve the wrong representation.",
      "Bumping the version for additive changes, which multiplies versions without protecting anyone.",
      "Removing a version the day a rewrite ships, without checking whether old mobile clients still call it.",
    ],
    bestPractices: [
      "Start with URL versioning for public APIs: it is debuggable with nothing but curl.",
      "Version only the HTTP layer; keep services and models version-agnostic.",
      "Announce deprecation with headers plus a changelog entry, and monitor the old version's traffic to zero.",
    ],
    realWorldUseCases: [
      "Stripe's dated API versions let every integration pin behaviour and upgrade deliberately.",
      "Mobile apps in the wild update slowly — sunset headers are how you retire endpoints without support spikes.",
    ],
    resources: [
      docs(
        "OpenAPI specification",
        OFFICIAL.openapiSpec,
        "How to describe versions and media types in machine-readable API docs.",
        "en",
        "reference",
      ),
      docs(
        "Express — Routing",
        OFFICIAL.expressGuide,
        "Mounting paths, which is all URL versioning really is.",
        "en",
        "10 min",
      ),
      ytSearch(
        "REST API versioning strategies url vs header",
        "Comparisons of versioning approaches with real-world examples.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-versioning-1",
        title: "Design a version bump",
        prompt:
          "Your `GET /v1/orders` returns `{ id, total }`. Product wants `items[]` added, then later wants `total` renamed to `amount`. Say which change needs `/v2` and which does not, then implement both routes sharing one service and paste the two responses.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Adding an optional field is additive; renaming is breaking.",
          "Both controllers should call the same `orderService.find`.",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-pagination-filtering-sorting",
    slug: "pagination-filtering-sorting",
    title: "Pagination, Filtering and Sorting",
    description:
      "Offset vs cursor pagination, filter and sort whitelists, query design and the list envelope every API should agree on.",
    order: 19,
    estimatedMinutes: 22,
    tags: ["express", "api-design", "pagination", "query"],
    prerequisites: ["p2m2-query-params", "p1m1-rest"],
    relatedTopics: ["p2m2-input-validation", "p2m2-query-params", "p2m2-api-versioning"],
    learningObjectives: [
      "Compare offset and cursor pagination and choose per endpoint",
      "Whitelist filter and sort fields instead of trusting query strings",
      "Design a consistent list envelope with meta information",
      "Explain why deep offsets are slow and how keyset pagination fixes it",
    ],
    simpleExplanation:
      "Any list endpoint that can grow must paginate. Offset pagination (`?page=2&limit=20`) is simple but shifts under concurrent writes and slows down on deep pages; cursor pagination (`?cursor=...`) stays stable and fast. Whatever you choose, only accept filter and sort fields from an allow-list.",
    detailedContent: `
Every list endpoint grows up: ten items is a fine array, ten thousand is unusable. Paginate from day one — retrofitting it breaks clients.

**Offset pagination** — \`?page=2&limit=20\`:

- Simple, supports page numbers and easy totals.
- Skips rows, so deep pages get slower, and concurrent inserts shift items between pages while a reader is paging.

**Cursor pagination** — \`?cursor=eyJpZCI6MTAwfQ&limit=20\`:

- The cursor is a **position** (usually the last \`(sortKey, id)\`), not a row count, so pages stay stable under writes.
- Efficient with a composite index — the database jumps straight to the starting row (keyset pagination).
- Clients follow \`nextCursor\` links instead of guessing page numbers.

**Filter whitelists.** Accept only fields you have indexed and understand; map them to internal names; reject anything else with 400. Never interpolate a client string into \`ORDER BY\` — that is sort injection.

**Sort whitelists** work the same way. A friendly convention is \`?sort=-createdAt,title\` (a leading minus means descending), parsed through an allowed map.

Agree one envelope and reuse it everywhere:

    { "data": [...], "meta": { "limit": 20, "nextCursor": "abc", "total": 1234 } }
    `,
    howItWorks: `
Offset pagination runs \`LIMIT n OFFSET m\`: the engine must still locate and discard \`m\` rows, so cost grows with the page number. Keyset pagination instead filters on the sort key:

    WHERE (created_at, id) < (cursor_ts, cursor_id)
    ORDER BY created_at DESC, id DESC
    LIMIT n

With a composite index on \`(created_at, id)\` this is O(log n) at any depth.

Totals are the hidden cost: \`COUNT(*)\` over a filtered table can dominate the whole query. Options are to cache the count, compute it asynchronously, or simply return \`hasMore\`.

The cursor itself should be opaque — base64-encode the key — so clients cannot craft arbitrary positions and you can change its format later.
    `,
    codeExamples: [
      {
        title: "Whitelists for sort and filter",
        language: "js",
        code: `const SORTABLE = { createdAt: "createdAt", title: "title", price: "price" };
const FILTERABLE = { status: "status", done: "done", ownerId: "userId" };

export function parseSort(raw = "-createdAt") {
  return raw.split(",").map((token) => {
    const desc = token.startsWith("-");
    const key = SORTABLE[desc ? token.slice(1) : token];
    if (!key) {
      const err = new Error("sort field not allowed: " + token);
      err.status = 400;
      throw err;
    }
    return { field: key, direction: desc ? "desc" : "asc" };
  });
}

export function parseFilters(query) {
  const where = {};
  for (const [key, value] of Object.entries(query)) {
    const column = FILTERABLE[key];
    if (column && value !== undefined) where[column] = value;
    // unknown keys are ignored — they never reach ORDER BY or WHERE
  }
  return where;
}`,
        description:
          "Unknown fields never reach the query builder, which closes the sort-injection hole and turns typos into explicit 400s.",
      },
      {
        title: "Cursor pagination endpoint",
        language: "js",
        code: `import express from "express";
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    // fetch one extra row to know whether another page exists
    const rows = await jobService.list({ limit: limit + 1, after: cursor });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    res.json({
      data,
      meta: {
        limit,
        nextCursor: hasMore ? encodeCursor(data[data.length - 1]) : null,
      },
    });
  } catch (err) {
    next(err);
  }
});`,
        description:
          "The `limit + 1` trick avoids a second COUNT query: an extra row means there is another page.",
      },
    ],
    commonMistakes: [
      "Accepting `?sort=<anything>` and passing it into the query builder — sort injection and surprise 500s.",
      "Offering `?page=` deep into a large table, where OFFSET makes each request slower than the last.",
      "Returning an unbounded array on list endpoints 'for convenience'.",
      "Changing the list envelope per endpoint, so every client team writes custom parsing.",
    ],
    bestPractices: [
      "Cap `limit` (e.g. ≤ 100) and default it; never let a client request everything.",
      "Use cursor pagination for infinite-scroll feeds and huge tables; offset is fine for small, admin-style lists.",
      "Document the sort/filter whitelist next to the endpoint so client teams stop guessing.",
    ],
    realWorldUseCases: [
      "Job boards and inventories routinely hold 100k+ rows: keyset pagination keeps page 500 as fast as page 1.",
      "E-commerce category pages use offset pagination with cached totals for the classic 'page 3 of 42' UI.",
    ],
    resources: [
      docs(
        "Express — req.query",
        OFFICIAL.expressApi,
        "Where filter, pagination and sort input enters the application.",
        "en",
        "reference",
      ),
      docs(
        "Zod — schemas for query parsing",
        OFFICIAL.zodDocs,
        "Coercing and validating pagination input in one place.",
        "en",
        "8 min",
      ),
      ytSearch(
        "API pagination offset vs cursor keyset tutorial",
        "Explainers of offset, cursor and keyset pagination with SQL examples.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-pagination-1",
        title: "Build both styles",
        prompt:
          "Implement `GET /api/jobs` twice: once with `?page=&limit=` and once with `?cursor=&limit=`. Seed 50 rows, insert a new row while paging through with offsets (observe the shift), then repeat with the cursor (observe stability). Paste the two observed behaviours.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Sort by a unique, monotonic key such as createdAt+id so the cursor is unambiguous.",
          "Fetch limit+1 rows to compute hasMore without a COUNT.",
        ],
        solution: `router.get("/offset", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page ?? 1) || 1, 1);
    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
    const data = await jobService.list({ skip: (page - 1) * limit, take: limit });
    res.json({ data, meta: { page, limit } });
  } catch (err) {
    next(err);
  }
});

router.get("/cursor", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
    const after = req.query.cursor ? decodeCursor(req.query.cursor) : null;
    const rows = await jobService.listAfter(after, limit + 1);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    res.json({ data, meta: { limit, nextCursor: hasMore ? encodeCursor(data.at(-1)) : null } });
  } catch (err) {
    next(err);
  }
});`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-inventory-api", "p2-job-board-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-input-validation",
    slug: "input-validation",
    title: "Input Validation",
    description:
      "Validating params, query and body at the boundary with Zod, coercing string input, normalising output and shipping one error shape.",
    order: 20,
    estimatedMinutes: 22,
    tags: ["express", "validation", "zod", "security"],
    prerequisites: ["p2m2-request-bodies", "p2m2-query-params", "p1m1-json"],
    relatedTopics: ["p2m2-centralized-error-handling", "p2m2-route-params", "p2m2-pagination-filtering-sorting"],
    learningObjectives: [
      "Validate req.params, req.query and req.body with schemas at the route edge",
      "Coerce string-only inputs into numbers, booleans and dates",
      "Normalise validated data so handlers always see the same shape",
      "Return a single, complete validation-error envelope",
    ],
    simpleExplanation:
      "Everything a client sends is untrusted and arrives as strings. Validate it the moment it enters the app — one schema per route that checks, coerces and normalises — then hand services clean data and a single 400 response listing every problem at once.",
    detailedContent: `
Validation belongs at the **boundary**: the moment untrusted data enters the application. Validate \`req.params\`, \`req.query\` and \`req.body\` at the route edge, then hand services already-clean data. Services may still enforce invariants; they just should not be the first line of defence.

Zod is the natural tool: one schema describes, validates and **transforms** input.

    const listQuerySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });

Key ideas:

- **Coercion.** Query strings are strings — \`z.coerce.number()\` turns \`"20"\` into \`20\` and rejects \`"abc"\`.
- **Normalisation.** \`trim()\`, defaults and \`transform()\` run once, at the boundary, so every handler sees the same shape.
- **Strict objects.** \`z.object({}).strict()\` rejects unknown keys, catching client typos like \`titel\` instead of silently dropping them. That turns a confusing “why is my field ignored?” ticket into an immediate 400.
- **One error shape.** Collect every field error and answer once:

      { "error": "VALIDATION_ERROR",
        "details": { "title": ["Required"] },
        "requestId": "b31f..." }

Clients show better forms when they receive *all* errors, not just the first.

Joi is the older alternative with the same role. Pick one library and use it everywhere — mixed styles produce mixed error shapes.
    `,
    howItWorks: `
A \`validate(schema, source)\` middleware factory runs \`schema.safeParse(req[source])\`. On failure it answers 400 with the flattened field errors. On success it **replaces** \`req[source]\` with the parsed value — coerced, trimmed, defaulted — so handlers never touch raw input again.

That one trick removes dozens of \`Number(req.query.page ?? 1)\` lines and guarantees that \`req.body.title\` is always a trimmed string. Because schemas are plain data, they can be unit-tested without HTTP and reused in queue workers and CLI tools, keeping one definition of “valid” across the whole system.

Schemas compose: a route can extend a shared base (\`{ ...base.strict(), admin: z.boolean().optional() }\`) without duplicating rules.
    `,
    codeExamples: [
      {
        title: "Reusable validation middleware",
        language: "js",
        code: `import { z } from "zod";

export const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    done: z.enum(["true", "false"]).optional(),
  })
  .strict();

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    dueDate: z.coerce.date().optional(),
  })
  .strict();

export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data; // normalised data replaces raw input
    next();
  };
}`,
        description:
          "The factory works for any of the three sources — `validate(schema, 'query')`, `'body'` or `'params'` — with one error shape for all of them.",
      },
      {
        title: "Wiring schemas into routes",
        language: "js",
        code: `import { z } from "zod";
import { validate, listQuerySchema, createTaskSchema } from "../middleware/validate.js";
import * as taskController from "../controllers/task.controller.js";

export const taskRouter = express.Router();

taskRouter.get("/", validate(listQuerySchema, "query"), taskController.list);
taskRouter.post("/", validate(createTaskSchema, "body"), taskController.create);

taskRouter.get(
  "/:taskId",
  validate(z.object({ taskId: z.string().uuid() }), "params"),
  taskController.getOne,
);

// A handler can now trust its inputs completely:
// list(req) → req.query.page is a number between 1 and Infinity, limit ≤ 100`,
        description:
          "Validation lives with the route, not buried in the service, so a reviewer sees the contract at the URL definition.",
      },
    ],
    commonMistakes: [
      "Validating only in the browser — anyone can skip it and post anything with curl.",
      "Trusting `Number(req.query.limit)` without bounds: `?limit=999999` still reaches the database.",
      "Returning only the first validation error, so clients iterate through a form one round-trip at a time.",
      "Forgetting that `req.params` needs validation too — an id should be a UUID or a bounded integer, not a raw string.",
    ],
    bestPractices: [
      "One schema per endpoint, exported next to its route, unit-tested like any other code.",
      "Always `.strict()` bodies so unknown fields are rejected rather than silently ignored.",
      "Normalise once at the boundary and delete the ad-hoc coercions scattered through handlers.",
    ],
    realWorldUseCases: [
      "Signup forms receive every field error in one 422, so the UI can highlight the whole form at once.",
      "Public APIs reject malformed pagination input with a clear 400 instead of a cryptic database error.",
    ],
    resources: [
      docs(
        "Zod — documentation",
        OFFICIAL.zodDocs,
        "Schemas, coercion, transforms and error formatting.",
        "en",
        "15 min",
      ),
      docs(
        "Joi — API reference",
        OFFICIAL.joiApi,
        "The alternative validation library you will meet in older Express codebases.",
        "en",
        "reference",
      ),
      ytSearch(
        "Zod validation Express tutorial",
        "Videos validating req.body, req.query and req.params with Zod.",
        "en",
        "10–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-validation-1",
        title: "Validate all three sources",
        prompt:
          "Add schemas for `req.params`, `req.query` and `req.body` on a task API. Then attack it with curl: an invalid UUID, `?limit=abc`, `?limit=9999`, a missing title, and an extra unknown field. Record the status code and body of each response.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "`z.coerce.number()` rejects \"abc\" but accepts \"5\".",
          "`.strict()` is what rejects the unknown field.",
        ],
      },
      {
        id: "ex-p2m2-validation-2",
        title: "Prove normalisation",
        prompt:
          "Show that `req.body.title` arrives trimmed in the handler by sending a title padded with whitespace, and log `JSON.stringify(req.body)` in both the route and the service. Explain in two sentences why the service saw clean data without calling trim itself.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "The validate middleware replaces `req.body` with the parsed value on success.",
          "Compare the log lines from before and after adding the middleware.",
        ],
        solution: `const createTaskSchema = z.object({ title: z.string().trim().min(1) }).strict();

router.post("/", validate(createTaskSchema, "body"), async (req, res, next) => {
  // curl -d '{"title":"   Learn Express   "}'
  console.log("controller sees:", JSON.stringify(req.body.title)); // "Learn Express"
  const task = await taskService.create(req.user.id, req.body);    // service needs no trim
  res.status(201).json(task);
});`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m2",
  },
  {
    ...shared,
    id: "p2m2-centralized-error-handling",
    slug: "centralized-error-handling",
    title: "Centralized Error Handling",
    description:
      "AppError classes, one error envelope, mapping known errors to status codes, and keeping stack traces and internals out of client responses.",
    order: 21,
    estimatedMinutes: 22,
    tags: ["express", "errors", "api-design", "security"],
    prerequisites: ["p2m2-error-handling-middleware", "p2m1-custom-errors", "p2m2-handling-404"],
    relatedTopics: ["p2m2-controllers-services", "p2m2-logging-requests", "p2m2-input-validation"],
    learningObjectives: [
      "Define typed AppError subclasses that carry status, code and details",
      "Map known error types to HTTP status codes in one place",
      "Return a consistent error envelope with a request id",
      "Explain why stack traces must never reach a production client",
    ],
    simpleExplanation:
      "Error middleware decides *where* failures are handled; this design decides *what they look like*. Services throw typed errors (`NotFoundError`, `ConflictError`), and one middleware maps each to a status code and a consistent JSON envelope — never a stack trace.",
    detailedContent: `
Error-handling middleware (lesson 11) decides **where** errors are handled. This lesson decides **what** they look like.

**1. Typed errors.** Extend an \`AppError\` that carries \`status\`, a machine-readable \`code\` and optional \`details\` — the same idea you met with custom errors in Phase 2:

    class NotFoundError extends AppError {
      constructor(resource, id) {
        super(resource + " not found", { status: 404, code: "NOT_FOUND", details: { id } });
      }
    }

Services throw these; they never write responses.

**2. One envelope**, never varied:

    { "error": "NOT_FOUND", "message": "task not found", "requestId": "b31f..." }

**3. Mapping** in the single error middleware:

| Error | Status |
| --- | --- |
| ValidationError / body-parser SyntaxError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError (duplicate email) | 409 |
| PayloadTooLargeError / Multer LIMIT_FILE_SIZE | 413 |
| anything unexpected | 500 |

Translate infrastructure errors too: a Mongo duplicate-key error (\`code: 11000\`) becomes 409 Conflict instead of a mysterious 500.

**4. Never leak.** Production 5xx responses carry a generic message plus the request id — never \`err.stack\`, SQL text, file paths or dependency versions. Log the full error server-side, keyed by that request id; support can then correlate a user's report with the actual stack.
    `,
    howItWorks: `
Every throw and every \`next(err)\` funnels into one middleware. It normalises the status (\`err.status ?? err.statusCode ?? 500\`), classifies the error as **operational** (known domain failure) or **bug** (unknown → 500), logs at the right level, and writes the envelope.

Operational errors are expected traffic: log a warning with the request id and the details. Bugs are incidents: log an error with the full stack and alert someone. Because the response body only ever contains \`{ error, message, requestId }\`, an attacker learns nothing from your failures while your team keeps everything it needs.

Optional polish: include a \`details\` map for validation errors and a \`Retry-After\` header on 503 responses.
    `,
    codeExamples: [
      {
        title: "A small AppError hierarchy",
        language: "js",
        code: `// utils/app-error.js
export class AppError extends Error {
  constructor(message, { status = 500, code = "INTERNAL_ERROR", details } = {}) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true; // expected failure, not a bug
  }
}

export class ValidationError extends AppError {
  constructor(details) {
    super("Validation failed", { status: 422, code: "VALIDATION_ERROR", details });
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(resource + " not found", { status: 404, code: "NOT_FOUND", details: id ? { id } : undefined });
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, { status: 409, code: "CONFLICT" });
  }
}`,
        description:
          "`new.target.name` keeps the subclass name without repeating it, and `isOperational` lets the middleware distinguish bugs from expected failures.",
      },
      {
        title: "The single error middleware",
        language: "js",
        code: `// middleware/error-handler.js
import multer from "multer";

export function errorHandler(err, req, res, _next) {
  // 1. normalise known infrastructure errors into AppError-shaped ones
  let error = err;
  if (err instanceof multer.MulterError) {
    error = new AppError("Upload rejected", {
      status: err.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      code: err.code,
    });
  } else if (err?.name === "MongoServerError" && err.code === 11000) {
    error = new ConflictError("Duplicate value");
  }

  const status = error.status ?? error.statusCode ?? 500;
  const known = status < 500 || error.isOperational;

  log[status >= 500 ? "error" : "warn"]({ err, requestId: req.id, status });

  res.status(status).json({
    error: known ? error.code ?? "ERROR" : "INTERNAL_ERROR",
    message: known ? error.message : "Something went wrong",
    requestId: req.id,
    ...(known && error.details ? { details: error.details } : {}),
  });
}`,
        description:
          "Fourth argument declared (even if unused) so Express recognises it; unknown errors collapse to a generic 500 that leaks nothing.",
      },
    ],
    commonMistakes: [
      "Returning `err.stack` (or `err.message` for bugs) to the client — it discloses internals and file paths.",
      "Returning 500 for validation failures: invalid input is the client's problem (400/422).",
      "A different error shape per handler, so every client team writes bespoke parsing.",
      "Logging and responding at each layer, producing ten log lines and one response for a single failure.",
    ],
    bestPractices: [
      "Throw typed errors from services; decide responses in exactly one middleware.",
      "Always include a `requestId` in error responses so users can quote it in support tickets.",
      "In development you may include the stack; in production log it and never send it.",
    ],
    realWorldUseCases: [
      "Mobile apps branch on the machine-readable `error` code (show a form error for VALIDATION_ERROR, re-login for UNAUTHENTICATED).",
      "Webhook retries and load balancers read correct status codes (409, 429, 503) to behave sensibly.",
    ],
    resources: [
      docs(
        "Express — Error handling",
        "https://expressjs.com/en/5x/guide/error-handling",
        "The official guide your error middleware builds on.",
        "en",
        "12 min",
      ),
      docs(
        "Node.js Best Practices — error handling",
        OFFICIAL.nodeBestPractices,
        "Operational vs programmer errors, and handling errors in production.",
        "en",
        "reference",
      ),
      docs(
        "OWASP API Security",
        OFFICIAL.owaspApi,
        "Why leaking internals in error responses is a recognised API risk.",
        "en",
        "reference",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m2-central-errors-1",
        title: "Map five errors",
        prompt:
          "Using the AppError classes, throw each of: ValidationError, UnauthorizedError, ForbiddenError, NotFoundError and a plain Error. Record the status code and JSON body your middleware produced for all five, and confirm the plain Error never exposes its stack.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Unknown errors must collapse to `{ error: \"INTERNAL_ERROR\", message: \"Something went wrong\" }`.",
          "Check the logs separately — the stack belongs there, not in the response.",
        ],
        solution: `import { ValidationError, NotFoundError, AppError } from "./utils/app-error.js";
import { errorHandler } from "./middleware/error-handler.js";

app.get("/demo/validation", (req, res, next) => next(new ValidationError({ title: ["Required"] })));
app.get("/demo/missing", (req, res, next) => next(new NotFoundError("task", "t_9")));
app.get("/demo/bug", (req, res, next) => next(new Error("SELECT * FROM secret_table failed")));

app.use(errorHandler);
// 422 { error: "VALIDATION_ERROR", details: { title: ["Required"] }, requestId }
// 404 { error: "NOT_FOUND", details: { id: "t_9" }, requestId }
// 500 { error: "INTERNAL_ERROR", message: "Something went wrong", requestId }  ← no stack`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-ecommerce-api", "p2-inventory-api"],
    quizId: "quiz-p2-m2",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m2",
  moduleId: "p2-m2",
  title: "Module 2 quiz — Express.js",
  description:
    "Test your understanding of middleware order, routing syntax, request parsing, error handling and API design patterns in Express 5.",
  questions: [
    {
      id: "q-p2m2-1",
      type: "multiple-choice",
      prompt: "Which statement about Express middleware execution is correct?",
      options: [
        "Express runs every app.use() middleware before any app.get() handler, regardless of registration order",
        "Middleware runs in registration order, and the first function that ends the response stops the chain",
        "Error-handling middleware always runs before normal middleware when an error occurs, wherever it is registered",
        "Express sorts middleware by path specificity before running them",
      ],
      correctIndex: 1,
      explanation:
        "An Express app is a single ordered list of middleware. The first match runs, and a function that responds without calling next() ends the request. Error handlers only run when next(err) was called, and only if they are registered after the error — so position matters for them too.",
      optionExplanations: [
        "Wrong: app.use and app.get entries live in the same list; only registration order decides.",
        "Correct — order is registration order, and ending the response short-circuits everything after.",
        "Wrong: an error handler is skipped unless an error has already been passed and it sits later in the stack.",
        "Wrong: Express does not reorder middleware; a broad use() placed early will run first.",
      ],
    },
    {
      id: "q-p2m2-2",
      type: "code-output",
      prompt: "A client sends `GET /users/42`. What is printed?",
      code: `import express from "express";
const app = express();

app.use((req, res, next) => {
  console.log("A");
  next();
});

app.get("/users/:id", (req, res, next) => {
  console.log("B:" + req.params.id);
  next();
}, (req, res) => {
  console.log("C");
  res.end();
});

app.use((req, res, next) => {
  console.log("D");
  res.end();
});

app.listen(3000);`,
      language: "js",
      options: ["A, B:42, C, D", "A, B:42, C", "A, B:42, D", "B:42, C, A"],
      correctIndex: 1,
      explanation:
        "The global middleware logs A and calls next(). The matching route runs its first handler (B:42) and calls next(), so the route's second handler runs (C) and ends the response without calling next(). The final app.use (D) is never reached.",
      optionExplanations: [
        "D never runs: the chain stopped when C ended the response.",
        "Correct — A, B:42, then C; nothing after that.",
        "The route's second handler (C) runs before any later app.use.",
        "Middleware runs in registration order: A is first.",
      ],
    },
    {
      id: "q-p2m2-3",
      type: "code-output",
      prompt: "A client sends `GET /ok` with no `x-token` header. What is printed?",
      code: `const app = express();

app.use((req, res, next) => {
  console.log("1");
  if (!req.headers["x-token"]) {
    res.status(401).json({ error: "NO_TOKEN" });
    return;
  }
  next();
});

app.use((req, res, next) => {
  console.log("2");
  next();
});

app.get("/ok", (req, res) => {
  console.log("3");
  res.json({ ok: true });
});`,
      language: "js",
      options: ["1, then 2, then 3", "just 1", "1, then 2", "1, then 3"],
      correctIndex: 1,
      explanation:
        "The first middleware sends a 401 and returns without calling next(), short-circuiting the request. The second middleware and the route never run, so only \"1\" is printed and the client receives the 401 JSON.",
      optionExplanations: [
        "Nothing after the first middleware runs — it never called next().",
        "Correct — respond-and-return stops the chain immediately.",
        "Middleware 2 would only run if the first one called next().",
        "The route runs only when the token check passes.",
      ],
    },
    {
      id: "q-p2m2-4",
      type: "find-bug",
      prompt:
        "A client reports that failures come back as an ugly HTML page instead of your JSON error envelope. What is wrong with this code?",
      code: `app.get("/boom", async (req, res) => {
  throw new Error("kaboom");
});

app.use((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR" });
});`,
      language: "js",
      options: [
        "The handler declares only three arguments, so Express treats it as regular middleware; with no four-argument error handler registered, Express's default handler answers 500 as HTML",
        "Express 5 cannot run async route handlers, so the process crashes before any handler runs",
        "The handler runs but `err` is undefined, because the fourth parameter is missing",
        "There is no bug — this is valid error middleware and it always returns JSON",
      ],
      correctIndex: 0,
      explanation:
        "Express recognises error-handling middleware by its arity: it must declare exactly four arguments `(err, req, res, next)`. With three, it is ordinary middleware and never receives errors. Express's built-in final handler then answers 500 with a plain-text/HTML body, which is exactly what the client saw.",
      optionExplanations: [
        "Correct — declare `(err, req, res, next)` and register it after the routes.",
        "Express 5 runs async handlers and forwards their rejected promises automatically.",
        "The three-argument function is never invoked as an error handler at all.",
        "Without four arguments Express cannot identify it as an error handler.",
      ],
    },
    {
      id: "q-p2m2-5",
      type: "multiple-choice",
      prompt: "Which route pattern is valid in Express 5?",
      options: [
        "app.get('/*', handler)",
        "app.get('/*splat', handler)",
        "app.get('/:file.:ext?', handler)",
        "app.get('/[a-z]+/:slug', handler)",
      ],
      correctIndex: 1,
      explanation:
        "Express 5 uses path-to-regexp v8: wildcards must be named (`/*splat`), optional segments use braces (`/:file{.:ext}`), and regex character classes are not supported. `/{*splat}` additionally matches the root path.",
      optionExplanations: [
        "A bare `*` is no longer allowed — the wildcard needs a name.",
        "Correct — named wildcard; it captures the remaining segments as an array.",
        "`?` optional markers were replaced by brace groups: `/:file{.:ext}`.",
        "Regex character classes are rejected in Express 5 paths.",
      ],
    },
    {
      id: "q-p2m2-6",
      type: "multiple-choice",
      prompt: "Which pair of statements about Express 5 is correct?",
      options: [
        "req.body is `{}` when no body parser ran, and req.query is a writable object",
        "req.body is undefined when no body parser ran, and req.query is a read-only getter whose default parser is \"simple\"",
        "req.query is a getter, but the default parser is still \"extended\" (qs)",
        "req.body defaults to null, and wildcards are still written as '*'",
      ],
      correctIndex: 1,
      explanation:
        "In Express 5, `req.body` is undefined until a parser populates it (Express 4 defaulted to `{}`), and `req.query` is a getter backed by the \"simple\" query parser — string values only, repeated keys become arrays, no nested bracket notation.",
      optionExplanations: [
        "Those are Express 4 behaviours; both changed in v5.",
        "Correct — undefined body, read-only getter, simple parser by default.",
        "The default query parser changed from \"extended\" to \"simple\" in v5.",
        "Wildcards must be named in v5, and an unparsed body is undefined, not null.",
      ],
    },
    {
      id: "q-p2m2-7",
      type: "find-bug",
      prompt: "What does `GET /users` return with this code?",
      code: `app.use((req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.get("/users", (req, res) => {
  res.json([{ id: 1 }]);
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "INTERNAL" });
});`,
      language: "js",
      options: [
        "404 JSON — the catch-all middleware is registered first and never calls next(), so the request stops there and the /users route is never reached",
        "200 with the users array — Express always prefers a route over middleware",
        "500 JSON — the error handler runs before everything else",
        "The app throws at startup, because a 404 handler cannot be registered before routes",
      ],
      correctIndex: 0,
      explanation:
        "Registration order is everything: the first middleware matches every path, responds 404, and does not call next(), so no later layer runs. The 404 fallback must be registered after all routes (and before the error handler).",
      optionExplanations: [
        "Correct — move the 404 fallback below the routers and it will only run for unmatched paths.",
        "There is no automatic preference: the first matching layer wins.",
        "Error handlers only run when next(err) has been called.",
        "The app starts fine; the bug only shows up at request time.",
      ],
    },
    {
      id: "q-p2m2-8",
      type: "short-answer",
      prompt:
        "How many arguments must an Express error-handling middleware declare for Express to recognise it as an error handler? Answer with a single number (digit or word).",
      acceptedKeywords: ["4", "four"],
      explanation:
        "Exactly four: `(err, req, res, next)`. Express identifies error handlers by arity, so a three-argument function is treated as ordinary middleware and never receives errors. Declare the fourth argument even if you do not use it (for example `_next`).",
    },
  ],
};
