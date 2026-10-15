import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m5",
  slug: "rest-api-development",
  title: "REST API Development",
  description:
    "Design, build and operate production-quality REST APIs: REST constraints at design level, resource naming, methods and status codes, request validation, response and error formats, pagination, filtering and sorting, versioning, idempotency, rate limiting, OpenAPI, endpoint testing, security, CORS, payload limits, logging and cross-API consistency.",
  phaseId: "phase-2",
  order: 5,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m5",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m5-rest-principles",
    slug: "rest-principles",
    title: "REST Principles at the API Design Level",
    description:
      "Fielding's constraints revisited as concrete design decisions: resource-oriented thinking, the uniform interface, statelessness and cacheability.",
    order: 1,
    estimatedMinutes: 16,
    tags: ["rest", "api-design", "constraints"],
    prerequisites: ["p1m1-rest", "p1m1-methods", "p1m1-status-codes"],
    relatedTopics: ["p2m5-resource-naming", "p2m5-methods-and-codes", "p2m5-consistent-responses"],
    learningObjectives: [
      "Recast REST's constraints as practical decisions you make when designing endpoints",
      "Think in resources and representations instead of endpoints and actions",
      "Explain the four parts of the uniform interface and apply the useful three immediately",
      "Recognise RPC-style design and decide when it is the right tool",
    ],
    simpleExplanation:
      "REST is a small set of design rules that makes an API predictable and scalable. You address **resources** (nouns) with URLs, act on them with **HTTP methods** (verbs), exchange **representations** of those resources as JSON, and every request stands completely alone — the server remembers nothing between requests. Following these rules is what lets any developer on any platform use your API without a phone call.",
    detailedContent: `
REST is not a checklist of URL styles — it is six constraints that together buy you scalability and evolvability. Four of them shape every endpoint you write:

- **Client–server** — the API must not assume who calls it (browser, mobile app, another service). Keep presentation out of the responses so each side can evolve independently.
- **Statelessness** — every request carries its own context: auth token, tenant, locale. The server keeps no memory of previous requests from that client. This is exactly what lets you put a second API instance behind a load balancer with zero session replication.
- **Cacheability** — responses declare whether they may be reused (\`Cache-Control\`, \`ETag\`). Correct GETs should be cheap to repeat.
- **Uniform interface** — the core constraint, with four parts: (1) **identification of resources** — each thing has a URL; (2) **manipulation through representations** — you send and receive JSON *about* the resource, not function calls; (3) **self-descriptive messages** — method, status, headers and body contain everything needed to process the request; (4) **hypermedia (HATEOAS)** — responses may point at related resources.

**Resource-oriented thinking** starts from the nouns of your domain — users, orders, invoices — and lets the HTTP method supply the verb. \`GET /invoices/84\` reads, \`PUT /invoices/84\` replaces, and the URL never changes shape. Two remaining constraints matter less day to day: the **layered system** constraint says clients do not care how many proxies lie between them and the server, and **code-on-demand** (rarely used) lets servers ship executable code such as JavaScript.

REST is a spectrum, not a religion: \`POST /invoices/84/void\` is an honest action — keep actions exceptional and nouns dominant.
    `,
    howItWorks: `
A REST request resolves to a resource plus a representation:

    GET /api/v1/invoices/84 HTTP/1.1
    Host: api.example.com
    Authorization: Bearer eyJhbGciOi...
    Accept: application/json

1. Routing maps the path to a **resource** (\`invoice\`, id 84).
2. Middleware authenticates the token — statelessness means nothing about this caller was remembered from before.
3. The handler loads the resource, checks permissions and serialises a JSON **representation**.
4. Headers make the message self-descriptive: \`200 OK\`, \`ETag: "v7"\`, \`Cache-Control: private\`.
5. The server discards all request state; the next request starts from zero.

Because the response is a representation of resource state, the same URL can serve JSON to an app and HTML to a browser via content negotiation — without touching handler logic.
    `,
    codeExamples: [
      {
        title: "Resource-oriented routes vs RPC-style routes",
        language: "ts",
        code: `// GOOD: the URL names a noun, the method names the verb
app.get("/api/v1/invoices", listInvoices);         // collection
app.post("/api/v1/invoices", createInvoice);       // create in collection
app.get("/api/v1/invoices/:id", getInvoice);       // single item
app.put("/api/v1/invoices/:id", replaceInvoice);   // full replace
app.patch("/api/v1/invoices/:id", updateInvoice);  // partial update
app.delete("/api/v1/invoices/:id", deleteInvoice); // remove

// ACCEPTABLE: a true action that is not plain CRUD (keep these rare)
app.post("/api/v1/invoices/:id/void", voidInvoice);

// AVOID: verbs and query tricks in the path
app.get("/api/v1/getInvoice?id=84", getInvoice);
app.delete("/api/v1/invoices/delete/84", deleteInvoice);`,
        description:
          "Same capability, three styles. The first block is what clients expect from a REST API; the last block hides the real method and forces every caller to learn custom URL grammar.",
      },
    ],
    commonMistakes: [
      "Designing endpoints as internal functions (/getUser, /createOrder) and only wrapping them in nouns after clients depend on them.",
      "Confusing statelessness with 'no tokens' — the token (or cookie) must accompany *every* request; the server simply does not remember the last one.",
      "Treating HATEOAS as all-or-nothing: skipping hypermedia entirely is fine, but a few related-resource links in responses pay off immediately.",
    ],
    bestPractices: [
      "Start every design session by listing the domain nouns, then map HTTP methods onto them before writing any code.",
      "Make messages self-descriptive: pair every 4xx/5xx status with a stable machine-readable error code (see the error-format lesson).",
      "Mark safe GETs as cacheable with ETag/Cache-Control; never let caches store POST, PATCH or DELETE responses.",
    ],
    realWorldUseCases: [
      "Stripe models charges, refunds and customers as resources; actions appear as explicit sub-resources such as POST /charges/:id/refund.",
      "A job-board API (p2-job-board-api) exposing /jobs, /applications and /employers maps one-to-one onto database tables, so backend and frontend teams share the same mental model.",
    ],
    resources: [
      docs(
        "Roy Fielding's REST dissertation (chapter 5)",
        "https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm",
        "The original REST constraints, written by the author of the term.",
        "en",
        "reference",
      ),
      docs(
        "Zalando — RESTful API guidelines",
        "https://opensource.zalando.com/restful-api-guidelines/",
        "A concrete, opinionated rulebook for applying REST constraints in production APIs.",
        "en",
        "reference",
      ),
      docs("MDN — REST", "https://developer.mozilla.org/en-US/docs/Glossary/REST", "Short, precise definition of REST and its constraints.", "en", "5 min"),
      ytSearch("REST API design principles resource oriented", "Walkthroughs that translate Fielding's constraints into endpoint design.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-principles-rpc",
        title: "Convert an RPC API to resources",
        prompt:
          "A team shipped this RPC-style API: GET /getUser?id=7, POST /createOrder, GET /listOrdersForUser?userId=7, GET /calculateOrderTotal?orderId=12. Rewrite all four as resource-oriented routes with correct methods. For any operation that is genuinely an action rather than CRUD, keep an action path and justify it.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "A user, an order and a collection of orders are three different resources.",
          "calculateOrderTotal is derived data — it may belong inside the order representation instead of its own route.",
        ],
        solution: `GET    /api/v1/users/:userId            → get user 7 (item)
GET    /api/v1/orders                    → list orders, filter with ?userId=7 (collection)
POST   /api/v1/orders                    → create an order (collection)
GET    /api/v1/orders/:orderId            → order 12 already contains its total

// Derived data (total) is part of the order representation, so no
// /calculateOrderTotal endpoint is needed. If a real action appears
// later (e.g. re-pricing), model it as POST /orders/:id/recalculate.`,
        solutionLanguage: "text",
      },
      {
        id: "ex-p2m5-principles-audit",
        title: "Audit a real API",
        prompt:
          "Pick one public API you use (GitHub, Stripe, OpenAI). Fetch three endpoints from its documentation and classify each against the uniform interface: which URL identifies the resource, which representation is returned, and which headers make the message self-descriptive? Note one place the API breaks its own conventions.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Look at the response headers, not only the body: ETag, Cache-Control, Content-Type and Link are all self-description."],
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-resource-naming",
    slug: "resource-naming",
    title: "Resource Naming",
    description:
      "Plural nouns, kebab-case, collection vs item routes, nesting depth limits and how to keep verbs out of your URLs.",
    order: 2,
    estimatedMinutes: 15,
    tags: ["naming", "urls", "api-design"],
    prerequisites: ["p2m5-rest-principles"],
    relatedTopics: ["p2m5-methods-and-codes", "p2m5-filtering-sorting", "p2m5-api-versioning"],
    learningObjectives: [
      "Apply plural, lowercase, kebab-case naming consistently across an API",
      "Distinguish collection routes from item routes and choose the right one",
      "Keep nesting to at most one level and flatten deep hierarchies",
      "Replace verbs in URLs with methods, sub-resources or query parameters",
    ],
    simpleExplanation:
      "A resource URL should read like a filing label: plural noun, lowercase, hyphens between words (`/job-applications`). A collection is the folder (`/jobs`), one item is a file inside it (`/jobs/j_42`), and the HTTP method tells the server whether you are reading, writing or deleting it. Verbs never appear in the path.",
    detailedContent: `
Naming is the part of your API that clients memorise. Break it once and every developer pays for years.

**The core rules**

- **Plural nouns for collections:** \`/users\`, \`/orders\`. The item route reuses the same plural (\`/users/j_42\`), never a singular (\`/user/42\`). Genuine mass nouns (\`/metadata\`, \`/health\`) are the rare exception.
- **Lowercase kebab-case:** \`/job-applications\`, \`/shipping-addresses\`. Paths are case-sensitive, so \`/Jobs\` and \`/jobs\` are two different resources — never let both exist. Avoid camelCase and snake_case in URLs.
- **Collection vs item:** \`GET /tasks\` returns a (paginated) collection; \`GET /tasks/t_42\` returns exactly one item. Collection routes never contain an id; item routes always do.
- **No verbs:** \`POST /tasks/t_42/complete\` (an action on a resource) instead of \`/completeTask?id=t_42\`. Query parameters that select data are fine (\`?status=done\`); query parameters that *perform* actions are not.
- **Nesting depth of one:** \`/users/u_7/orders\` is readable. \`/users/u_7/orders/o_9/items/i_3/reviews\` is not. Give deep resources their own top-level route: \`/order-items/i_3/reviews\` or \`/reviews?itemId=i_3\`.
- **Version prefix** (\`/v1/\`) or a version header — you will choose deliberately in the versioning lesson.
- **One trailing-slash policy:** either always or never; inconsistent slashes cause silent duplicates and redirect round-trips.

Ids should be **opaque** to clients (UUIDs, prefixed ids like \`o_9\`) so you can migrate storage without breaking URLs.
    `,
    howItWorks: `
Under the hood, a framework matches the path against registered patterns. In Express:

    app.get("/users/:userId/orders", handler);
    // req.params => { userId: "u_7" } for /users/u_7/orders

The pattern language (path-to-regexp) treats \`:param\` as a wildcard segment and \`/\` as literal. Because matching is case-sensitive and order-sensitive, \`/users/new\` registered before \`/users/:id\` will swallow the id \`"new"\` — a classic source of confusing 404s.

Servers and proxies often normalise paths too: Nginx may redirect \`/users\` → \`/users/\` (or vice versa), and each redirect costs a round-trip and can strip method semantics on non-GET requests. Pick one canonical form, redirect the other once, and document it.
    `,
    codeExamples: [
      {
        title: "A naming pass over a realistic route table",
        language: "ts",
        code: `// BEFORE — verbs, singulars, deep nesting, mixed case
app.get("/getTasks", listTasks);
app.get("/task/:taskId", getTask);
app.post("/tasks/completeTask", completeTask);
app.get("/users/:userId/boards/:boardId/lists/:listId/cards", getCards);
app.get("/Tasks", getTasksCapital);

// AFTER — plural, kebab-case, one level of nesting, methods do the work
app.get("/api/v1/tasks", listTasks);                    // ?status=open|done
app.get("/api/v1/tasks/:taskId", getTask);
app.post("/api/v1/tasks/:taskId/complete", completeTask); // explicit action
app.get("/api/v1/lists/:listId/cards", getCards);        // cards belong to a list
app.get("/api/v1/cards", getCards);                      // or flat, filtered: ?listId=l_3
app.get("/api/v1/boards/:boardId/members", getMembers);  // relation sub-resource`,
        description:
          "The rewritten table is guessable: a client that has never seen the docs can still predict /tasks/t_42. Actions survive only where they are genuinely not CRUD.",
      },
      {
        title: "Collection vs item responses for the same resource",
        language: "json",
        code: `// GET /api/v1/tasks?status=open&page=1&limit=2
{
  "data": [
    { "id": "t_41", "title": "Write RFC", "status": "open" },
    { "id": "t_42", "title": "Fix login", "status": "open" }
  ],
  "meta": { "total": 17, "page": 1, "limit": 2 }
}

// GET /api/v1/tasks/t_41
{
  "data": {
    "id": "t_41",
    "title": "Write RFC",
    "status": "open",
    "createdAt": "2026-10-02T08:15:00.000Z",
    "assignee": { "id": "u_7", "name": "Amina Yusuf" }
  }
}`,
        description:
          "Same noun, two shapes: the collection is an array envelope, the item is a single object envelope. Both live under the plural path.",
      },
    ],
    commonMistakes: [
      "Mixing singular and plural (/task vs /tasks) or case (/Tasks) so the same resource answers under several URLs.",
      "Encoding actions as query parameters (?action=delete) — caches, logs and clients cannot reason about them.",
      "Nesting three or four levels deep, then discovering later that the deeply nested route is unreachable without its parents.",
    ],
    bestPractices: [
      "Write the full route table on paper (method + path) before implementing; naming problems are 10× cheaper to fix on paper.",
      "Flatten: give every meaningful resource a top-level collection and express hierarchy with one nesting level or a query filter.",
      "Redirect (301/308) any legacy path to its canonical form exactly once, and log how much traffic still follows it.",
    ],
    realWorldUseCases: [
      "GitHub's /repos/:owner/:repo/issues/:number shows one allowed level of nesting that mirrors how humans talk about issues.",
      "An inventory API (p2-inventory-api) uses /products, /products/:id/stock-adjustments instead of /adjustStock — auditors can read the URL as a sentence.",
    ],
    resources: [
      docs(
        "Google Cloud — API design guide (resource naming)",
        "https://cloud.google.com/apis/design/resources",
        "Google's internal rules for naming collections, methods and sub-resources.",
        "en",
        "reference",
      ),
      docs(
        "Microsoft — API design guidelines (URLs)",
        "https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design",
        "Practical guidance on plural nouns, ids and query parameters.",
        "en",
        "15 min",
      ),
      ytSearch("REST API URL naming conventions", "Videos comparing good and bad resource names with live examples.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-naming-table",
        title: "Fix the route table",
        prompt:
          "Rewrite these routes following this lesson's rules: GET /getProducts, POST /addProductToCart, GET /product/:id/reviews/:revId/helpful, DELETE /removeCartItem?id=9, GET /OrderItems. Your output must use plural kebab-case nouns, at most one nesting level and no verbs in paths (actions may stay as POST sub-resources).",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["A review is addressed by its own id — does it need the product in the path?", "Marking a cart item helpful is an action; removing one is a DELETE."],
        solution: `GET    /api/v1/products                     // collection
POST   /api/v1/carts/:cartId/items          // add (creates an item in the cart)
GET    /api/v1/reviews/:reviewId            // flattened: reviews are top-level
POST   /api/v1/reviews/:reviewId/helpful    // genuine action
DELETE /api/v1/cart-items/9                 // item route with its own collection
GET    /api/v1/order-items                  // plural, lowercase`,
        solutionLanguage: "text",
      },
      {
        id: "ex-p2m5-naming-escalation",
        title: "Escape deep nesting",
        prompt:
          "You must expose cards that belong to lists, which belong to boards, which belong to users: /users/u_1/boards/b_2/lists/l_3/cards. Propose two flatter designs (one using one level of nesting, one fully top-level with a filter), and state the trade-off of each in one sentence.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Do clients ever need the board to address a card?", "Authorization can enforce ownership without repeating it in the URL."],
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api", "p2-inventory-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-methods-and-codes",
    slug: "methods-and-status-codes",
    title: "HTTP Methods and Status Codes: The Full Matrix",
    description:
      "The complete method/status pairing table, safe and idempotent semantics, the Allow header, and 201 Created with Location.",
    order: 3,
    estimatedMinutes: 18,
    tags: ["http", "methods", "status-codes"],
    prerequisites: ["p1m1-methods", "p1m1-status-codes", "p2m5-rest-principles"],
    relatedTopics: ["p2m5-resource-naming", "p2m5-idempotency", "p2m5-error-response-formats"],
    learningObjectives: [
      "Pair every common method with the status codes it should return",
      "Classify methods as safe and/or idempotent and explain why caches and retries depend on it",
      "Return 405 with a correct Allow header and 201 with a correct Location header",
      "Choose between 200, 201, 202, 204, 409, 412 and 415 with confidence",
    ],
    simpleExplanation:
      "Each HTTP method has a small set of correct answers. Reading (`GET`) answers 200; creating (`POST`) answers 201 plus a `Location` header pointing at the new resource; deleting answers 204 with no body; calling a method a resource does not support answers 405 plus an `Allow` header listing what *is* supported. Getting these pairs right is what makes clients, caches and retry logic work without special cases.",
    detailedContent: `
Use this matrix as the contract of your API:

| Method | Success codes | Typical failures | Idempotent | Safe |
| --- | --- | --- | --- | --- |
| GET | 200, 304 | 404 | Yes | Yes |
| HEAD | 200 (headers only) | 404 | Yes | Yes |
| POST | 201 + \`Location\`, 200, 202 | 400, 409, 422 | No | No |
| PUT | 200, 204, 201 (if created) | 400, 409, 412 | Yes | No |
| PATCH | 200, 204 | 400, 409, 412, 422 | No* | No |
| DELETE | 204, 200 | 404 | Yes | No |
| OPTIONS | 204 + \`Allow\` | — | Yes | Yes |

**Safe** means no state change — only GET, HEAD and OPTIONS. Caches, prefetchers and crawlers assume this. **Idempotent** means N applications equal one: GET, HEAD, PUT, DELETE and OPTIONS. POST is never idempotent; PATCH is idempotent only if it sets absolute values (\`{"status":"done"}\`) rather than deltas (\`{"views":{"increment":1}}\`).

Details that separate senior APIs from tutorials:

- **201 Created** must carry \`Location: /api/v1/orders/o_9\` and normally the created representation in the body.
- **405 Method Not Allowed** must carry \`Allow: GET, PATCH, DELETE\` — it says "wrong verb", where 404 says "wrong path".
- **415 Unsupported Media Type** when \`Content-Type\` is not what the endpoint accepts; **400/422** when the body is syntactically fine but fails the schema.
- **409 Conflict** for state clashes (duplicate email, already-shipped order); **412 Precondition Failed** when \`If-Match\` fails.
- **202 Accepted** when work continues in the background — point at a status resource with \`Location\`.
    `,
    howItWorks: `
Clients and infrastructure read these pairs to make decisions:

1. A CDN caches a GET until \`Cache-Control\` says otherwise, but never caches a POST — because POST is not safe.
2. A mobile retry library that timed out re-sends an idempotent PUT or DELETE without fear of duplicates, but holds back on POST unless an idempotency key was sent.
3. An \`OPTIONS\` preflight (CORS) asks which methods exist; your framework answers from the same route table used for real requests, which is why a wrong 405 breaks browsers.
4. Express sets 200 by default, so every non-200 must be explicit: \`res.status(201)\` before \`.json()\`, and headers such as \`Location\` must be set **before** the body is written.
    `,
    codeExamples: [
      {
        title: "Correct pairs: 201+Location, 405+Allow, 415",
        language: "ts",
        code: `app.post("/api/v1/orders", async (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ error: "UNSUPPORTED_MEDIA_TYPE" });
  }
  const order = await orders.create(req.body);
  res.location("/api/v1/orders/" + order.id); // header BEFORE the body
  return res.status(201).json({ data: order });
});

app.delete("/api/v1/orders/:id", async (req, res) => {
  const found = await orders.remove(req.params.id);
  if (!found) return res.status(404).json({ error: "ORDER_NOT_FOUND" });
  return res.status(204).end(); // success, no body
});

// Any unsupported method on this path
app.all("/api/v1/orders/:id", (req, res) => {
  res.set("Allow", "GET, PATCH, DELETE");
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
});`,
        description:
          "One file showing the three headers/status pairs clients rely on: Location for creations, Allow for rejected verbs, and an empty 204 for deletion.",
      },
      {
        title: "The same resource exercised with curl",
        language: "bash",
        code: `# Create → 201 + Location
curl -i -X POST http://localhost:3000/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -d '{"items":[{"sku":"KB-01","qty":2}]}'

# Wrong verb → 405 + Allow
curl -i -X PUT http://localhost:3000/api/v1/orders/o_9

# Delete → 204, empty body
curl -i -X DELETE http://localhost:3000/api/v1/orders/o_9`,
        description:
          "`-i` prints status line and headers — the only way to verify Location and Allow were actually sent.",
      },
    ],
    commonMistakes: [
      "Returning 200 with an empty body for creations — clients then have no URL for the new resource (missing Location) and no signal to distinguish create from update.",
      "Answering 404 for a wrong method: 404 says the path is unknown, 405 says the path exists but not for this verb; caches and clients treat them differently.",
      "Forgetting that GET must not have side effects: a GET that increments a counter will be double-counted by prefetchers and CDN warm-ups.",
    ],
    bestPractices: [
      "Encode the matrix as tests: for each route assert the exact success code and required headers (Location, Allow, ETag).",
      "Send 202 + Location for anything slower than a few seconds, then expose progress at that location.",
      "Keep PATCH operations absolute where possible so retries are harmless even though PATCH is not guaranteed idempotent.",
    ],
    realWorldUseCases: [
      "Payment APIs answer 201 with a Location to the charge so clients can poll its status resource instead of re-posting.",
      "Proxies answer 405 with Allow when a WAF blocks a method — matching that behaviour keeps your API debuggable behind infrastructure.",
    ],
    resources: [
      docs("MDN — HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", "Annotated list of every status code including 201, 405 and 415.", "en", "15 min"),
      docs("MDN — Allow header", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Allow", "The header required with 405 responses.", "en", "5 min"),
      docs("RFC 9110 — HTTP Semantics (methods)", OFFICIAL.rfcHttp, "The authoritative definitions of safe, idempotent and the status codes.", "en", "reference"),
      ytSearch("HTTP status codes for REST API design", "Matrix-style walkthroughs pairing methods with codes.", "en", "12–18 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-method-matrix",
        title: "Fill the matrix from memory",
        prompt:
          "Without looking, write the method/status matrix for GET, POST, PUT, PATCH and DELETE: for each, list the success codes you would implement, two failure codes, and whether it is safe and idempotent. Then check your answer against MDN and note every row you got wrong.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["PUT may create, so 201 is legal there too.", "DELETE on a missing resource: pick 404 or 204 — but pick one and document it."],
        solution: `GET    → 200 | 304, 404        safe: yes idempotent: yes
POST   → 201 + Location, 202 | 400, 409, 422   safe: no idempotent: no
PUT    → 200, 204, 201 (created) | 400, 412    safe: no idempotent: yes
PATCH  → 200, 204 | 400, 409, 412, 422         safe: no idempotent: not guaranteed
DELETE → 204, 200 | 404                        safe: no idempotent: yes`,
        solutionLanguage: "text",
      },
      {
        id: "ex-p2m5-method-headers",
        title: "Prove it with curl",
        prompt:
          "Start a small Express app with GET, POST and DELETE on /api/v1/items. Using curl -i, capture and paste the exact status line and headers for: a creation (confirm Location), a DELETE of a missing item, and a PUT on the path (confirm 405 and Allow). Explain why Allow lists only the three implemented methods.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["curl -i shows headers; curl -X PUT forces a verb the app did not register."],
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-request-validation",
    slug: "request-validation",
    title: "Request Validation at the Boundary",
    description:
      "Schema-first validation with Zod or Joi, normalisation and coercion of raw input, and field-level error details clients can render.",
    order: 4,
    estimatedMinutes: 20,
    tags: ["validation", "zod", "schema", "middleware"],
    prerequisites: ["p2m2-input-validation", "p1m1-json"],
    relatedTopics: ["p2m5-error-response-formats", "p2m5-response-design", "p2m5-api-security-basics"],
    learningObjectives: [
      "Validate every request once, in middleware, before any handler runs",
      "Write schema-first validation with Zod and explain why schemas beat scattered if-statements",
      "Normalise and coerce raw input (trimmed strings, numeric query params, empty → undefined)",
      "Return field-level error details that a UI can map onto form fields",
    ],
    simpleExplanation:
      "Everything a client sends is untrusted text until proven otherwise. **Validate at the boundary**: one schema, run before your handler, that checks types, lengths, ranges and allowed values — then hands your code a *typed, cleaned* object. When validation fails, answer 400 or 422 with a list of field-level problems so the frontend can highlight exactly the inputs that are wrong.",
    detailedContent: `
**Validate at the boundary.** The HTTP layer is the only place every request must pass. Put validation in middleware so handlers receive data that is already known-good; a handler that re-validates is a sign the middleware is optional somewhere — and optional validation is a vulnerability.

**Schema-first beats statement-first.** A Zod (or Joi) schema declares the whole contract in one readable block: types, required fields, enums, string lengths, numeric ranges and unknown-key policy. From that single source you get runtime validation *and* a TypeScript type — two artefacts that can never drift apart.

**Normalise before you validate:**

- \`trim()\` strings; lowercase emails and usernames.
- Treat \`""\` as \`undefined\` for optional fields — otherwise "empty" silently overwrites a value.
- Coerce deliberately: query params arrive as strings (\`?page=2\`), so use \`z.coerce.number().int().min(1)\`.
- Decide unknown-key policy: \`strip\` (drop extras) or \`strict\` (reject with 400). Never \`passthrough\` into your database layer — that is mass assignment.

**Error details format.** Return one stable shape with per-field problems:

    {
      "error": "VALIDATION_FAILED",
      "message": "2 fields are invalid.",
      "details": [
        { "field": "email", "code": "invalid_format", "message": "Must be a valid email" },
        { "field": "quantity", "code": "too_small", "message": "Must be at least 1" }
      ],
      "requestId": "req_8f3a21"
    }

Use **400** for malformed JSON or wrong types, **422** for well-formed input that breaks business rules — but pick one convention and document it.
    `,
    howItWorks: `
A Zod schema is a description of constraints plus a parser. When you call \`schema.safeParse(input)\`, Zod walks the schema recursively, collecting *every* failure instead of stopping at the first, then returns either \`{ success: true, data }\` with coerced, normalised values or \`{ success: false, error }\` with a structured issue list.

Your middleware maps those issues into your error envelope and responds 422; on success it **replaces** \`req.body\`/\`req.query\` with \`result.data\`. From that point on, handlers read typed fields (\`body.quantity\` is a \`number\`) with no defensive checks — and because the schema is exported, OpenAPI generation and frontend form types can reuse it later.
    `,
    codeExamples: [
      {
        title: "Zod schema + validation middleware",
        language: "ts",
        code: `import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimateHours: z.coerce.number().positive().max(999).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
}).strict(); // unknown keys are rejected, not silently stored

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: "VALIDATION_FAILED",
        message: "Request body failed validation.",
        details: result.error.issues.map((i) => ({
          field: i.path.join("."),
          code: i.code,
          message: i.message,
        })),
        requestId: req.id,
      });
    }
    req.body = result.data; // handlers now see typed, cleaned input
    next();
  };
}

app.post("/api/v1/tasks", validate(createTaskSchema), createTaskHandler);`,
        description:
          "One schema, one middleware, typed handlers. `.strict()` blocks mass assignment; `.trim()` and defaults normalise before storage.",
      },
      {
        title: "What the client sends and gets back",
        language: "json",
        code: `// POST /api/v1/tasks
// Content-Type: application/json
{
  "title": "   ",            <- fails min(1) after trim
  "priority": "urgent",      <- not in the enum
  "estimateHours": "4",      <- coerced to 4 (valid)
  "isAdmin": true            <- unknown key (rejected by .strict())
}

// 422 Unprocessable Entity
{
  "error": "VALIDATION_FAILED",
  "message": "Request body failed validation.",
  "details": [
    { "field": "title", "code": "too_small", "message": "String must contain at least 1 character(s)" },
    { "field": "priority", "code": "invalid_enum_value", "message": "Invalid enum value. Expected 'low' | 'medium' | 'high', received 'urgent'" },
    { "field": "isAdmin", "code": "unrecognized_keys", "message": "Unrecognized key(s) in object: 'isAdmin'" }
  ],
  "requestId": "req_8f3a21"
}`,
        description:
          "Every issue is reported at once with a machine-readable code and a path the frontend can map straight onto the failing form input.",
      },
    ],
    commonMistakes: [
      "Validating only in the frontend — an attacker skips the UI entirely and posts whatever they like with curl.",
      "Logging or storing unknown keys because the schema used passthrough: that is how role: \"admin\" gets mass-assigned into a user row.",
      "Returning a single string like \"invalid input\" — the UI cannot highlight fields, so users guess what went wrong.",
    ],
    bestPractices: [
      "Keep schemas next to routes and export them so tests, OpenAPI docs and frontend types all consume the same contract.",
      "Cap string lengths and array sizes in the schema: limits are a cheap denial-of-service defence.",
      "Validate query parameters too (pagination, filters) — they are just as attacker-controlled as the body.",
    ],
    realWorldUseCases: [
      "Checkout forms: the API rejects an invalid postal code with a field-level error the browser scrolls to and highlights.",
      "Job-board postings (p2-job-board-api): a strict schema prevents applicants from injecting extra fields such as `status: \"featured\"`.",
    ],
    resources: [
      docs("Zod — schemas and validation", OFFICIAL.zodDocs, "Official docs: object schemas, coercion, strict mode and error issues.", "en", "reference"),
      docs("Joi — API reference", OFFICIAL.joiApi, "Alternative schema library with a fluent validation API.", "en", "reference"),
      docs(
        "OWASP — Input Validation Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
        "Security rules behind every schema: allowlists, length limits and canonicalisation.",
        "en",
        "12 min",
      ),
      ytSearch("zod validation middleware express tutorial", "Build-along videos for schema-first request validation.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-validation-schema",
        title: "Write the schema first",
        prompt:
          "Write a Zod schema for POST /api/v1/jobs: company (trimmed string 2–100 chars), title (2–120), salaryMin and salaryMax (positive integers, salaryMin ≤ salaryMax — enforce the cross-field rule), location (string), remote (boolean, default false), tags (array of ≤5 unique lowercase strings). Then list the exact `details` entries returned when salaryMin > salaryMax and tags contains 'NodeJS'.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: ["Use .superRefine() or a refinement for the cross-field rule.", "Uniqueness needs a set-size check, not just array item types."],
        solution: `import { z } from "zod";

export const jobSchema = z.object({
  company: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(120),
  salaryMin: z.number().int().positive(),
  salaryMax: z.number().int().positive(),
  location: z.string().trim().min(1),
  remote: z.boolean().default(false),
  tags: z.array(z.string().trim().toLowerCase()).max(5),
}).superRefine((v, ctx) => {
  if (v.salaryMin > v.salaryMax)
    ctx.addIssue({ code: "custom", path: ["salaryMax"],
      message: "salaryMax must be >= salaryMin" });
  if (new Set(v.tags).size !== v.tags.length)
    ctx.addIssue({ code: "custom", path: ["tags"], message: "tags must be unique" });
});

// details would contain:
// { field: "salaryMax", code: "custom", message: "salaryMax must be >= salaryMin" }
// { field: "tags",      code: "custom", message: "tags must be unique" }
// ('NodeJS' is lowercased by the item schema before the uniqueness check)`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p2m5-validation-query",
        title: "Validate the query string",
        prompt:
          "Query parameters are always strings. Write the schema that turns ?page=2&limit=50&sort=-createdAt into typed values, rejects limit=5000 with a useful error, and explain in one sentence why you coerce instead of requiring clients to send JSON in the query.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["z.coerce.number() handles \"2\" → 2; .max() rejects oversized limits."],
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api", "p2-job-board-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-response-design",
    slug: "response-design",
    title: "Response Design: Envelopes and Conventions",
    description:
      "Success envelopes with data/meta/links, consistent camelCase fields, nullable vs omitted fields, and dates as ISO 8601.",
    order: 5,
    estimatedMinutes: 18,
    tags: ["responses", "envelope", "json", "conventions"],
    prerequisites: ["p1m1-json", "p1m1-status-codes", "p2m5-methods-and-codes"],
    relatedTopics: ["p2m5-error-response-formats", "p2m5-pagination", "p2m5-consistent-responses"],
    learningObjectives: [
      "Choose one envelope shape (data / meta / links) and apply it to items, lists and errors",
      "Pick a single field-naming convention and a date format for the whole API",
      "Explain the difference between null, omitted and empty fields — and document your choice",
      "Design a response a mobile client can render without special cases",
    ],
    simpleExplanation:
      "Every successful response should look like it came from the same factory: the payload under `data`, extra information about it (totals, paging) under `meta`, navigation links under `links`, fields in camelCase, and dates as ISO 8601 strings like `2026-10-14T09:30:00.000Z`. Pick these rules once, write them in your docs, and every endpoint inherits a response clients can parse with one shared function.",
    detailedContent: `
**One envelope, three slots.** A conventional success body:

    {
      "data": { ... },              // the resource(s) — always present
      "meta": { ... },              // counts, timings, pagination — when relevant
      "links": { ... }              // self / next / prev — on collections
    }

Items and lists both use \`data\`; lists simply put an array in it. This uniformity lets clients write \`res.data\` once. The alternative — some endpoints return bare objects, others wrap — forces a wrapper function full of special cases forever.

**Field naming:** choose **camelCase** for JSON (\`createdAt\`, \`shippingAddress\`) because JavaScript and TypeScript consume it natively, and keep it on every endpoint. If your database uses snake_case, convert at the serialization boundary, not by renaming columns everywhere.

**Dates: ISO 8601 with timezone.** \`"2026-10-14T09:30:00.000Z"\` is unambiguous across languages, sortable as a string, and parseable with \`new Date(...)\`. Never send epoch milliseconds and locale-formatted dates from different endpoints.

**null vs omitted — decide deliberately:**

- \`null\` = "this field exists and is explicitly empty" (the user has no phone number).
- Omitted = "not applicable here" or "unknown" (a list projection does not include \`deletedAt\`).
- \`[]\` = "a collection with zero members" — never \`null\` for lists.

Document which fields may be \`null\` in OpenAPI; clients will thank you when their parser stops crashing.

**Money and precision:** send amounts as integers in minor units (\`amountCents: 4999\`) plus a currency code — floats lose cents.
    `,
    howItWorks: `
Serialisation is where conventions become code. A single helper decides the shape:

    res.status(200).json({ data: user, meta: { requestId: req.id } });

Express calls \`JSON.stringify\` on that object; \`undefined\` keys are dropped (that is how omitted fields happen) while explicit \`null\` survives. Date \`Date\` objects are converted through their \`toJSON()\` → ISO strings automatically.

Behind the scenes you typically map a database row (snake_case, \`Date\` objects, secrets like \`password_hash\`) into an API representation: pick the allowed fields, rename to camelCase, format dates. That mapping is your **anti-leak layer** — the same place you guarantee no internal column ever escapes to a client. Response-shape tests then freeze the contract so a refactor cannot silently rename a field.
    `,
    codeExamples: [
      {
        title: "One serialiser, consistent output",
        language: "ts",
        code: `// DTO mapper: DB row -> API representation (camelCase, ISO dates, no secrets)
export function toUserDto(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    phone: row.phone ?? null,          // null = "known to be empty"
    avatarUrl: row.avatar_url ?? undefined, // omitted = "not uploaded yet"
    createdAt: new Date(row.created_at).toISOString(),
    role: row.role,
    // password_hash, internal notes: never listed here
  };
}

// Collection response
res.status(200).json({
  data: rows.map(toUserDto),
  meta: { total: 17, page: 2, limit: 10 },
  links: {
    self: "/api/v1/users?page=2&limit=10",
    next: "/api/v1/users?page=3&limit=10",
    prev: "/api/v1/users?page=1&limit=10",
  },
});`,
        description:
          "The mapper is the single choke point for naming, dates and field allowlisting — one function guarantees the whole API's conventions.",
      },
      {
        title: "Item vs list vs empty vs error, side by side",
        language: "json",
        code: `// 200 — single resource
{ "data": { "id": "u_7", "displayName": "Amina Yusuf", "phone": null,
            "createdAt": "2026-10-14T09:30:00.000Z" } }

// 200 — collection with results
{ "data": [ { "id": "t_41", "title": "Write RFC" } ],
  "meta": { "total": 17, "page": 1, "limit": 10 },
  "links": { "self": "/api/v1/tasks?page=1&limit=10",
             "next": "/api/v1/tasks?page=2&limit=10" } }

// 200 — legitimately empty collection (NOT null)
{ "data": [], "meta": { "total": 0, "page": 1, "limit": 10 },
  "links": { "self": "/api/v1/tasks?assignee=me" } }

// 404 — same envelope philosophy, error slot instead of data
{ "error": "TASK_NOT_FOUND", "message": "No task with id t_404.",
  "requestId": "req_8f3a21" }`,
        description:
          "Four calls, four shapes a client can branch on in one line each: data object, data array with meta, empty array, error object.",
      },
    ],
    commonMistakes: [
      "Mixing conventions: snake_case on one endpoint, camelCase on another, epoch timestamps here and ISO strings there.",
      "Returning null for empty lists — clients that do data.length then crash, because null has no length.",
      "Serialising whole database documents with `res.json(user)`, leaking password_hash and internal flags the moment someone adds a column.",
    ],
    bestPractices: [
      "Write DTO/serialiser functions per resource; handlers should never pass raw rows to res.json().",
      "Declare in your API guide: field names are camelCase, dates are ISO 8601 UTC, money is integer minor units.",
      "Add a contract test asserting the exact key set of one representative response per resource.",
    ],
    realWorldUseCases: [
      "A React client (NodePath's own frontend) can render any endpoint with one typed `data` accessor plus optional meta.",
      "A chat backend (p2-chat-backend) sends message previews with omitted (not null) edit metadata, so clients only render edit UI when the field exists.",
    ],
    resources: [
      docs("JSON:API — document structure", "https://jsonapi.org/format/#document-structure", "A fully specified envelope (data, meta, links, errors) you can adopt wholesale.", "en", "reference"),
      docs("MDN — Date toISOString()", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString", "The ISO 8601 string your API should always emit.", "en", "5 min"),
      docs("RFC 8259 — JSON", OFFICIAL.rfcJson, "How undefined and non-JSON values behave when stringified.", "en", "reference"),
      ytSearch("REST API response envelope design", "Design sessions comparing bare vs enveloped JSON responses.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-response-shapes",
        title: "Design the shapes on paper",
        prompt:
          "For an e-commerce API, write the exact JSON success bodies for: (1) one product, (2) a product list page with 2 of 40 results, (3) an empty wish-list, (4) a checkout with total in cents. Each must use your chosen envelope and conventions — list every rule you applied.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Empty wish-list is a successful collection — what should data be?", "Money: amountCents plus currency code."],
        solution: `{
  "data": [
    { "id": "p_15", "title": "Mechanical Keyboard", "priceCents": 12900, "currency": "USD",
      "releasedAt": "2026-08-01T00:00:00.000Z", "tags": ["peripherals"] },
    { "id": "p_16", "title": "USB-C Hub", "priceCents": 4900, "currency": "USD",
      "releasedAt": "2026-09-12T00:00:00.000Z", "tags": [] }
  ],
  "meta": { "total": 40, "page": 1, "limit": 2, "totalPages": 20 },
  "links": { "self": "/api/v1/products?page=1&limit=2",
             "next": "/api/v1/products?page=2&limit=2", "prev": null }
}

// Empty list still an envelope:  { "data": [], "meta": { "total": 0, ... } }
// Rules: camelCase fields, ISO 8601 dates, integer minor-unit money,
//        array (never null) for collections, links for pagination.`,
        solutionLanguage: "json",
      },
      {
        id: "ex-p2m5-response-null",
        title: "Null or omitted?",
        prompt:
          "Classify each field and justify in one line: user's middle name (users table has the column), user's profile banner (never uploaded), a post's deletedAt (only set after soft-delete), a list of comments (none exist). Which of these would a naive `res.json(row)` expose incorrectly?",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: ["Column exists + no value → null; column not part of this projection → omitted."],
      },
    ],
    projectIds: ["p2-blog-api", "p2-ecommerce-api", "p2-task-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-error-response-formats",
    slug: "error-response-formats",
    title: "Error Response Formats",
    description:
      "A single error object shape (code, message, details, requestId), field-level errors, and never leaking internal state to clients.",
    order: 6,
    estimatedMinutes: 18,
    tags: ["errors", "http", "api-design", "debugging"],
    prerequisites: ["p2m2-centralized-error-handling", "p1m1-status-codes", "p2m5-request-validation"],
    relatedTopics: ["p2m5-response-design", "p2m5-logging-monitoring", "p2m5-consistent-responses"],
    learningObjectives: [
      "Design one error object with code, message, details and requestId",
      "Return field-level detail lists that clients can map onto forms",
      "Explain why stack traces, SQL and internal ids must never leave the server",
      "Route every failure through one centralised error handler",
    ],
    simpleExplanation:
      "Errors deserve a format as strict as your success bodies. Give every failure a stable machine-readable `code` (`EMAIL_TAKEN`), a human `message`, an optional `details` array for per-field problems, and a `requestId` the user can quote in a bug report. The HTTP status tells a retry library what to do; the code tells the client which UI branch to take; the requestId ties the response to your logs.",
    detailedContent: `
**The error object.** HTTP status codes are too coarse for clients — \`400\` alone cannot distinguish malformed JSON from an invalid email. Pair every 4xx/5xx with a body like:

    {
      "error": {
        "code": "EMAIL_TAKEN",
        "message": "An account with this email already exists.",
        "details": [
          { "field": "email", "code": "duplicate", "message": "Email already registered" }
        ],
        "requestId": "req_8f3a21"
      }
    }

- **code** — stable, SCREAMING_SNAKE or dot-separated, never localised text. Clients branch on it; you can add codes but never repurpose one.
- **message** — human-readable default English text. Safe to show in a toast; not for matching logic.
- **details** — optional array of \`{ field, code, message }\` for validation and multi-error responses.
- **requestId** — echoed in the \`x-request-id\` header and every log line for that request.

RFC 9457 ("Problem Details") standardises a close cousin (\`application/problem+json\` with \`type\`, \`title\`, \`status\`) — adopting it is fine; inventing a *different* shape per endpoint is not.

**Never leak internals.** A \`500\` response must say "Something went wrong" plus the requestId — nothing about the table, the query, the library version or the file path. Stack traces, \`ECONNREFUSED\`, raw driver errors and internal UUIDs tell attackers where to aim. **Log** the detail server-side keyed by requestId; **send** the safe summary.

Status-to-code mapping: 401 \`UNAUTHENTICATED\`, 403 \`FORBIDDEN\`, 404 \`RESOURCE_NOT_FOUND\`, 409 \`CONFLICT\`, 422 \`VALIDATION_FAILED\`, 429 \`RATE_LIMITED\`, 500 \`INTERNAL_ERROR\`.
    `,
    howItWorks: `
All errors converge on one handler. In Express you centralise with a middleware of four arity \`(err, req, res, next)\` placed last: thrown errors, \`next(err)\`, rejected async handlers and framework body-parser failures all arrive there.

1. The error carries an HTTP status and a code (custom \`ApiError\` class or Zod issues).
2. The handler logs the full error — stack, path, user, requestId — at \`error\` level.
3. It responds with the envelope above, substituting a generic message for any 5xx.
4. The \`x-request-id\` header goes out with it, so a support ticket containing \`req_8f3a21\` can be grep'd straight out of your log stream.

Because no route ever writes an error body itself, adding \`requestId\` or changing the envelope is a one-file change.
    `,
    codeExamples: [
      {
        title: "One centralised error handler",
        language: "ts",
        code: `export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string,
              public details?: { field: string; code: string; message: string }[]) {
    super(message);
  }
}

// Last middleware — every error in the app funnels here
app.use((err, req, res, next) => {
  const requestId = req.id;
  const status = err.status ?? 500;

  logger.error({ err, requestId, path: req.path, userId: req.user?.id });

  // 5xx: never echo the internal message
  const message = status >= 500 ? "Something went wrong." : err.message;

  res.status(status).json({
    error: {
      code: err.status ? err.code : "INTERNAL_ERROR",
      message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    },
  });
});

// Usage inside a handler
const user = await users.findByEmail(email);
if (!user) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");`,
        description:
          "Handlers throw; the handler formats. Note the 5xx message substitution — the real error still lands in the logs under the same requestId.",
      },
      {
        title: "Field-level validation failure on the wire",
        language: "http",
        code: `HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json
x-request-id: req_8f3a21

{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "2 fields are invalid.",
    "details": [
      { "field": "email", "code": "invalid_format", "message": "Must be a valid email" },
      { "field": "password", "code": "too_weak", "message": "Must contain a number" }
    ],
    "requestId": "req_8f3a21"
  }
}`,
        description:
          "A frontend can highlight two inputs, show the generic message as a summary, and attach the requestId to any bug report.",
      },
    ],
    commonMistakes: [
      "Returning 200 with an error inside the body — retries, load balancers and monitoring all believe the request succeeded.",
      "Shipping err.message from the database driver (\"column users.email does not exist\") straight to the client.",
      "A different error shape per endpoint: {error}, {message}, {errors} and plain text in the same API.",
    ],
    bestPractices: [
      "Publish an error-code table in your docs alongside the endpoint table.",
      "Include requestId in every error body *and* in a header, so clients without a body (network layer) can still correlate.",
      "Alert on 5xx rate by code; page humans only for codes that indicate real breakage.",
    ],
    realWorldUseCases: [
      "Stripe's error objects carry a stable `code` plus `param`, letting SDKs map failures to typed exceptions.",
      "A mobile app shows \"We couldn't save your changes (ref req_8f3a21)\" — support finds the exact log line in seconds.",
    ],
    resources: [
      docs("RFC 9457 — Problem Details for HTTP APIs", "https://www.rfc-editor.org/rfc/rfc9457", "The IETF standard for machine-readable error bodies.", "en", "reference"),
      docs(
        "OWASP — Error Handling Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html",
        "Rules for generic client messages and detailed server-side logs.",
        "en",
        "8 min",
      ),
      docs("MDN — HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", "Status families your codes must align with.", "en", "15 min"),
      ytSearch("REST API error handling best practices", "Walkthroughs of centralised handlers and error envelopes.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-error-codes",
        title: "Build the error catalogue",
        prompt:
          "List 12 failures a task API can hit (auth, validation, conflicts, missing resources, rate limits, server faults). For each write: HTTP status, stable code, one-sentence client-safe message. Mark which ones must never expose internal detail and explain why in one line.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["401 vs 403 vs 404 is a classic trio — an unauthenticated caller must not learn which ids exist."],
      },
      {
        id: "ex-p2m5-error-handler",
        title: "Install the handler",
        prompt:
          "In your API project, add an ApiError class, move every inline error body into a single centralised Express error middleware, and prove it works: throw from an async handler and paste the exact response body including the requestId. Then make the handler return a generic message for 5xx and verify the stack trace appears only in the log.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: ["Express only invokes error middleware when next(err) is called or a handler throws (wrap async handlers or use express-async-errors)."],
        solution: `// async wrapper so rejected promises reach the error middleware
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/api/v1/tasks/:id", ah(async (req, res) => {
  const task = await db.tasks.find(req.params.id);
  if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "No task with that id.");
  res.json({ data: task });
}));

// Response pasted from the running server:
// {
//   "error": {
//     "code": "TASK_NOT_FOUND",
//     "message": "No task with that id.",
//     "requestId": "req_2c91ff"
//   }
// }
// Log line (server only): level=ERROR requestId=req_2c91ff err="NotFoundError ..."`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-pagination",
    slug: "pagination",
    title: "Pagination: Offset vs Cursor",
    description:
      "Offset and keyset pagination, page-size limits, next/prev links, the real cost of total counts, and when to cap deep pages.",
    order: 7,
    estimatedMinutes: 20,
    tags: ["pagination", "performance", "api-design"],
    prerequisites: ["p2m2-pagination-filtering-sorting", "p2m5-response-design"],
    relatedTopics: ["p2m5-filtering-sorting", "p2m5-consistent-responses", "p2m5-response-design"],
    learningObjectives: [
      "Explain the mechanics and failure modes of offset and cursor (keyset) pagination",
      "Design cursor tokens that encode a stable sort position",
      "Set default and maximum page sizes that protect the database",
      "Decide when a total count is worth its cost and how to make it optional",
    ],
    simpleExplanation:
      "Pagination means 'give me part 1, not everything'. **Offset** (`?page=3&limit=20`) is simple but scans and discards rows, and it drifts when data changes mid-scroll. **Cursor** (`?cursor=eyJpZCI6...`) stores *where you are* — a pointer into a stable sort — so it stays fast and correct on huge or live collections. Either way: cap the page size, return `next` links, and treat `total` as an optional, expensive extra.",
    detailedContent: `
**Offset pagination** is \`LIMIT 20 OFFSET 40\`:

- Pros: humans like page numbers, random access is possible, total pages are easy.
- Cons: the database must walk and discard every skipped row — page 5000 costs 5000× the work of page 1; inserts and deletes *shift* rows between requests, so users see duplicates or gaps while scrolling.

**Cursor (keyset) pagination** ships a token encoding the last row's sort position:

- Query becomes \`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20\` — an index seek, constant cost no matter how deep.
- No drift: rows are addressed by value, not by offset, so concurrent writes cannot shuffle your window.
- Cons: no random page jumps (acceptable for infinite feeds), and the sort must include a unique tiebreaker (\`id\`) or rows at boundaries repeat.

**Rules that protect you:**

- **Default 20, max 100.** A client asking \`limit=100000\` is a self-inflicted outage.
- **Emit \`links.next\` / \`links.prev\`** (and \`meta.total\` when known) so clients never string-concatenate URLs.
- **Total counts are a query of their own.** \`COUNT(*)\` over a filtered million-row table can cost more than the page itself — make it optional (\`?withTotal=true\`) or approximate.
- **Cap deep offsets** if you keep offset mode (GitHub refuses offsets beyond 10,000 rows and suggests cursors).

A sensible envelope: \`data\`, \`meta: { limit, nextCursor, total? }\`, \`links: { self, next?, prev? }\`.
    `,
    howItWorks: `
Suppose tasks are sorted newest-first. With cursor mode the server keeps state *in the client's token*:

1. First call — \`GET /api/v1/tasks?limit=2\` runs \`ORDER BY created_at DESC, id DESC LIMIT 2\` and returns the last row's position as a base64 token: \`{"created_at":"2026-10-14T09:00:00Z","id":"t_41"}\`.
2. Next call — \`?cursor=eyJjcmVhdGVkX2F0Ijoi...\` decodes the token, binds it as \`WHERE (created_at, id) < ('2026-10-14T09:00:00Z', 't_41')\`, and seeks with the composite index.
3. If \`rows.length === limit\` there *may* be more — return \`nextCursor\`; when a short page comes back, stop.

The token is opaque (base64, not encrypted) — treat it as a filter, validate its shape, and never trust a cursor that references fields you did not whitelist.
    `,
    codeExamples: [
      {
        title: "Cursor pagination in Express + SQL",
        language: "ts",
        code: `const encodeCursor = (row) =>
  Buffer.from(JSON.stringify({ c: row.created_at.toISOString(), id: row.id })).toString("base64url");
const decodeCursor = (token) => JSON.parse(Buffer.from(token, "base64url").toString());

app.get("/api/v1/tasks", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const where = ["tenant_id = $1"];
  const args = [req.tenantId];

  if (req.query.cursor) {
    const cur = decodeCursor(req.query.cursor);   // validate shape!
    where.push("(created_at, id) < ($2, $3)");
    args.push(cur.c, cur.id);
  }

  const rows = await db.query(
    \`SELECT * FROM tasks WHERE \${where.join(" AND ")}
     ORDER BY created_at DESC, id DESC LIMIT \${limit + 1}\`, // +1: is there more?
    args,
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];

  res.json({
    data: page,
    meta: { limit, nextCursor: hasMore ? encodeCursor(last) : null },
    links: {
      self: "/api/v1/tasks?limit=" + limit,
      next: hasMore ? "/api/v1/tasks?limit=" + limit + "&cursor=" + encodeCursor(last) : null,
    },
  });
});`,
        description:
          "Fetching limit+1 rows tells you whether a next page exists without a COUNT. The cursor is opaque and the page size is clamped server-side.",
      },
      {
        title: "Offset mode with a hard cap (when you need page numbers)",
        language: "ts",
        code: `app.get("/api/v1/orders", async (req, res) => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const maxPage = 500;                     // refuse deep scans
  if (page > maxPage) {
    return res.status(400).json({
      error: { code: "PAGE_TOO_DEEP",
               message: "Offset beyond page 500 is not supported; use sort=oldest&cursor.",
               requestId: req.id },
    });
  }
  const [rows, total] = await Promise.all([
    db.orders.find({ offset: (page - 1) * limit, limit }),
    db.orders.count(),                      // cost paid on every request
  ]);
  res.json({
    data: rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    links: {
      self: \`/api/v1/orders?page=\${page}&limit=\${limit}\`,
      next: page * limit < total ? \`/api/v1/orders?page=\${page + 1}&limit=\${limit}\` : null,
      prev: page > 1 ? \`/api/v1/orders?page=\${page - 1}&limit=\${limit}\` : null,
    },
  });
});`,
        description:
          "Offsets are fine for admin tables where users page deliberately — but clamp the depth, cap the limit, and know that total is a separate query.",
      },
    ],
    commonMistakes: [
      "Unbounded limit: trusting ?limit=500000 and melting the database on a public endpoint.",
      "Offset pagination on an infinitely scrolling feed fed by live inserts — users see the same item twice or miss one entirely.",
      "Computing COUNT(*) on every list request for a table with millions of rows, because 'the frontend shows total'.",
    ],
    bestPractices: [
      "Default to cursor pagination for feeds and infinite scroll; keep offset only where numbered pages are a real requirement.",
      "Always add a unique tiebreaker column to the sort so cursors cannot skip or repeat boundary rows.",
      "Make total optional (?withTotal=true) or cache it; expose it in meta only when computed.",
    ],
    realWorldUseCases: [
      "Twitter/GitHub-style feeds: cursor tokens keep page 900 as cheap as page 1 while posts stream in.",
      "An e-commerce catalogue (p2-ecommerce-api): numbered offset pages for search-result footers, cursor for 'load more'.",
    ],
    resources: [
      docs(
        "Keyset pagination (content-negotiated) — practical write-up",
        "https://www.cockroachlabs.com/blog/sql-paging-improvements-cockroachdb/",
        "Why OFFSET degrades and how keyset queries stay index-backed.",
        "en",
        "12 min",
      ),
      docs("PostgreSQL — LIMIT/OFFSET", "https://www.postgresql.org/docs/current/queries-limit.html", "Official semantics of LIMIT and OFFSET.", "en", "8 min"),
      ytSearch("cursor vs offset pagination explained", "Comparisons with SQL plans and demo feeds.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-pagination-compare",
        title: "Measure both modes",
        prompt:
          "Create a table with 500k rows. Run OFFSET 0/10000/400000 with EXPLAIN ANALYZE, then run the equivalent keyset query on (created_at, id). Record wall-clock times for both at the deepest page and explain the difference in two sentences. Which mode would you expose publicly, and why?",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: ["EXPLAIN (ANALYZE, BUFFERS) shows rows scanned; OFFSET's scan grows linearly with depth."],
        solution: `-- Offset (degrades with depth)
EXPLAIN ANALYZE SELECT * FROM events ORDER BY created_at DESC OFFSET 400000 LIMIT 20;
--  => scans/skips ~400020 rows

-- Keyset (constant depth)
EXPLAIN ANALYZE SELECT * FROM events
WHERE (created_at, id) < ('2026-10-01T00:00:00Z', 'e_400000')
ORDER BY created_at DESC, id DESC LIMIT 20;
--  => index seek, ~20 rows touched

Expose cursor mode publicly: cost is flat and concurrent inserts cannot
shift the window (no duplicates/gaps during infinite scroll).`,
        solutionLanguage: "sql",
      },
      {
        id: "ex-p2m5-pagination-envelope",
        title: "Design the envelope",
        prompt:
          "Write the JSON response for page 2 of a 47-result collection with limit 10 using offset mode, including self/next/prev links and correct totals. Then rewrite the same response for cursor mode and state what information is lost and why that is acceptable.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["totalPages = ceil(47/10) = 5; next exists while page*limit < total.", "Cursor mode cannot express 'page 3 of 5' — by design."],
      },
    ],
    projectIds: ["p2-blog-api", "p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-filtering-sorting",
    slug: "filtering-and-sorting",
    title: "Filtering and Sorting",
    description:
      "Query-parameter grammar, field whitelists, multi-column sort syntax and operator filters — without accidentally building GraphQL.",
    order: 8,
    estimatedMinutes: 18,
    tags: ["query-parameters", "filtering", "sorting", "api-design"],
    prerequisites: ["p2m2-pagination-filtering-sorting", "p2m5-pagination"],
    relatedTopics: ["p2m5-resource-naming", "p2m5-request-validation", "p2m5-response-design"],
    learningObjectives: [
      "Design a predictable query grammar for filters and sorts",
      "Whitelist filterable and sortable fields and reject everything else",
      "Support multi-column sorting and a small operator set safely",
      "Recognise the point where a REST query language becomes GraphQL by accident",
    ],
    simpleExplanation:
      "Clients narrow lists with query parameters: `/jobs?remote=true&salaryMin=80000&sort=-createdAt`. The server must be paranoid — only fields on an **allowlist** may be filtered or sorted, operators come from a small fixed set, and an unknown field is a 400, not a silently ignored parameter. This keeps queries indexable and stops clients from inventing a query language you did not agree to support.",
    detailedContent: `
**A small, explicit grammar** beats a clever one:

| Concern | Convention | Example |
| --- | --- | --- |
| Equality | \`=field=value\` | \`?status=active\` |
| Multiple values | comma list | \`?status=active,pending\` |
| Comparison | operator suffix or bracket | \`?salaryMin=80000\` or \`?price[gte]=100\` |
| Search | one dedicated param | \`?q=react\` |
| Sort | comma list, \`-\` prefix = descending | \`?sort=-createdAt,title\` |
| Pagination | \`limit\` + \`cursor\`/\`page\` | \`?limit=20\` |

**Whitelist everything.** Maintain one map per endpoint:

    { status: enum(active,archived), remote: boolean,
      tags: string[], salaryMin: number }

Anything outside the map — including \`?passwordHash=...\` or \`?sort=password\` — returns **400 INVALID_QUERY_PARAMETER**. The same map feeds your Zod query schema and your OpenAPI docs, so documentation and behaviour cannot drift.

**Sorting** must (a) restrict to sortable columns, (b) append a unique tiebreaker (\`-createdAt,id\`) so pagination stays stable, and (c) preserve order: \`sort=-createdAt,title\` means createdAt DESC then title ASC.

**Operator filters** (\`gte\`, \`lte\`, \`in\`, \`ne\`, \`contains\`) are useful for ranges and facets — but cap complexity: maximum 2 filters × 3 operators per request, no nested logical \`AND/OR\` trees. The moment clients need arbitrary boolean groups, you are building GraphQL — adopt a real GraphQL layer or accept that REST's job is done here.
    `,
    howItWorks: `
The request pipeline turns a query string into a safe database query in three steps:

1. **Parse** — \`URLSearchParams\` yields raw strings; \`?page=2&page=3\` can arrive duplicated.
2. **Validate** — a Zod schema built from your whitelist coerces types (\`"true"\` → \`true\`), enforces enums and rejects unknowns with 400.
3. **Translate** — a mapper builds parameterised SQL: \`status = ANY($1)\`, \`salary >= $2\`, \`ORDER BY created_at DESC, id ASC LIMIT $3\`. Values are always **bound parameters**, never concatenated — this is where SQL injection would otherwise happen.

Sorting is applied *after* filtering and *before* LIMIT, and your composite index should mirror the common orders (\`(tenant_id, status, created_at, id)\`) or the database will sort in memory on every request.
    `,
    codeExamples: [
      {
        title: "Whitelist → validated query → SQL",
        language: "ts",
        code: `const jobQuerySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  remote: z.enum(["true", "false"]).optional().transform((v) => v === "true"),
  tags: z.string().transform((s) => s.split(",")).pipe(z.array(z.string()).max(5)).optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.string().regex(/^-?(createdAt|title|salaryMin)(,-?(createdAt|title|salaryMin))*$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
}).strict();

app.get("/api/v1/jobs", validateQuery(jobQuerySchema), async (req, res) => {
  const { status, remote, tags, salaryMin, q, sort, limit, cursor } = req.q;

  const where = ["tenant_id = $1"]; const args = [req.tenantId];
  if (status)   { args.push(status);   where.push(\`status = $\${args.length}\`); }
  if (remote !== undefined) { args.push(remote); where.push(\`remote = $\${args.length}\`); }
  if (salaryMin) { args.push(salaryMin); where.push(\`salary_min >= $\${args.length}\`); }
  if (tags?.length) { args.push(tags); where.push(\`tags && $\${args.length}\`); }
  if (q)        { args.push("%" + q + "%"); where.push(\`title ILIKE $\${args.length}\`); }

  const orderBy = (sort ?? "-createdAt")
    .split(",")
    .map((f) => (f.startsWith("-") ? f.slice(1) + " DESC" : f + " ASC"))
    .join(", ") + ", id ASC"; // stable tiebreaker

  const rows = await db.query(
    \`SELECT * FROM jobs WHERE \${where.join(" AND ")} ORDER BY \${orderBy} LIMIT \${limit}\`,
    args, // every value bound — never concatenated
  );
  res.json({ data: rows, meta: { limit, sort: sort ?? "-createdAt" } });
});`,
        description:
          "The strict schema rejects unknown params before any SQL exists; the mapper binds values as parameters; the sort string is built only from whitelisted column names.",
      },
      {
        title: "Grammar cheat sheet on the wire",
        language: "http",
        code: `GET /api/v1/jobs?status=open,featured&remote=true&salaryMin=80000&sort=-createdAt,title&limit=25 HTTP/1.1
Host: api.example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    { "id": "j_901", "title": "Senior Node Engineer", "status": "open", "remote": true, "salaryMin": 95000 },
    { "id": "j_877", "title": "Platform Engineer", "status": "open", "remote": true, "salaryMin": 88000 }
  ],
  "meta": { "limit": 25, "sort": "-createdAt,title", "total": 63 },
  "links": { "self": "/api/v1/jobs?status=open,featured&remote=true&salaryMin=80000&sort=-createdAt,title&limit=25",
             "next": "/api/v1/jobs?status=open,featured&remote=true&salaryMin=80000&sort=-createdAt,title&limit=25&cursor=eyJpZCI6ImpfODc3In0" }
}`,
        description:
          "One request shows equality, a comma list, coercion (true), a range filter, a two-column sort with a tiebreaker and pagination — all from the fixed grammar.",
      },
    ],
    commonMistakes: [
      "Interpolating raw query values into SQL (\"SELECT * FROM jobs WHERE status='\" + status + \"'\") — instant SQL injection.",
      "Accepting any ?sort= column, letting clients sort on unindexed text and expose existence of hidden fields.",
      "Designing a new operator per client request until your API supports nested boolean logic nobody can document.",
    ],
    bestPractices: [
      "Generate the query schema from a single per-endpoint allowlist so validation, SQL mapping and OpenAPI share one source.",
      "Always append a unique tiebreaker to ORDER BY — otherwise pagination repeats or skips rows.",
      "Return 400 with the offending parameter name in details; silently ignoring unknown params hides client bugs.",
    ],
    realWorldUseCases: [
      "A job board (p2-job-board-api) exposes facet filters (location, seniority, tags) as fixed params, keeping list pages cacheable and index-backed.",
      "An e-commerce catalogue (p2-ecommerce-api) uses price[gte]/price[lte] ranges for faceted search without a full query engine.",
    ],
    resources: [
      docs(
        "Microsoft — API design: query parameters and filtering",
        "https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design#support-partial-response-using-fields",
        "Industry guidance on filter, sort and sparse-fieldset conventions.",
        "en",
        "15 min",
      ),
      docs("PostgreSQL — SELECT parameterised queries", "https://www.postgresql.org/docs/current/sql-select.html", "ORDER BY and WHERE semantics behind your mapper.", "en", "reference"),
      ytSearch("REST API filtering and sorting query parameters", "End-to-end filtering implementations with validation.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-query-grammar",
        title: "Write the grammar",
        prompt:
          "For an inventory API define: filter by warehouse (single), low-stock flag (boolean), SKU prefix (string), price range (two numbers), and sort by 4 allowed columns (one descending default). Write 5 example URLs, then list 4 malicious/unsupported params your server must reject with 400 and the exact error details you would return for one of them.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Include a param that maps to a secret column (e.g. ?supplierCost=) to prove the whitelist works."],
      },
      {
        id: "ex-p2m5-sort-bug",
        title: "Fix unstable sorting",
        prompt:
          "A feed uses ORDER BY created_at DESC with offset pagination and users report duplicated items during scroll. Diagnose the cause, then write the corrected ORDER BY and explain why the tiebreaker fixes it — including what happens when two rows share the same timestamp.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Rows with equal created_at have no defined relative order, so LIMIT/OFFSET may return them in different query plans."],
      },
    ],
    projectIds: ["p2-job-board-api", "p2-ecommerce-api", "p2-inventory-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-api-versioning",
    slug: "api-versioning-in-production",
    title: "API Versioning in Production",
    description:
      "URL, header and media-type versioning, what counts as a breaking change, the compatibility window and how to sunset an API.",
    order: 9,
    estimatedMinutes: 17,
    tags: ["versioning", "breaking-changes", "api-design"],
    prerequisites: ["p2m2-api-versioning", "p2m5-rest-principles"],
    relatedTopics: ["p2m5-resource-naming", "p2m5-openapi-swagger", "p2m5-consistent-responses"],
    learningObjectives: [
      "Compare URL, header and media-type versioning with their real trade-offs",
      "Classify changes as breaking vs compatible (additive)",
      "Run a compatibility window where two versions serve old and new clients",
      "Plan a sunset with communication, deprecation headers and a removal date",
    ],
    simpleExplanation:
      "Versioning is your promise about the future: \"clients written today will keep working tomorrow\". The common approach is a version in the URL (`/v1/tasks`) because it is visible, cacheable and easy to test. You then treat *additive* changes (new optional fields) as free, and *breaking* changes (removing or renaming fields) as a new version — supported side-by-side until old clients are gone.",
    detailedContent: `
**Three placement options**

| Style | Example | Pros | Cons |
| --- | --- | --- | --- |
| URL path | \`/v1/tasks\` | Obvious in logs, curl-friendly, cacheable per version | Version in every route; proxies must not strip it |
| Request header | \`Accept: application/vnd.nodepath.v1+json\` | URLs stay clean; content negotiation is "pure" | Impossible to try in a browser; hard to see in access logs |
| Custom header | \`X-API-Version: 1\` | Simple for internal services | Non-standard, still invisible in URLs |

Pick **one**. URL versioning is the pragmatic default for public APIs (GitHub, most SaaS); media-type versioning suits mature APIs that care about representation semantics.

**What is a breaking change?** Breaking = existing clients can fail. Removing a field or endpoint, renaming a field, changing a type (string → number), tightening validation, changing a status code, reordering list results — all break. **Compatible** = additive and optional: new fields, new optional parameters, new endpoints, new enum members *if* clients tolerate unknowns (they should — write that into your client guide).

**Compatibility window.** Run v1 and v2 simultaneously — often different route prefixes backed by the same service. Mobile apps update slowly, so plan months, not days: announce v2, keep v1 serving, monitor its traffic daily.

**Sunsetting.** Send \`Deprecation: true\` (and \`Sunset: <HTTP-date>\`, RFC 8594) on v1 responses, publish a date, email integrators when their traffic appears in logs, and finally return **410 Gone** with a link to the migration guide.
    `,
    howItWorks: `
Version routing is a thin layer above your handlers:

1. Middleware reads the version from the path (\`/v1\`, \`/v2\`) or header and sets \`req.apiVersion\`.
2. A router maps \`(resource, version)\` → handler. v1 and v2 handlers can share services; only the **serialisation layer** usually differs (field renames, envelope changes).
3. Response headers advertise support: \`Deprecation\`, \`Sunset\`, \`Link: <.../v2>; rel="successor-version"\`.
4. Metrics are labelled by version, so "v1 traffic = 3% and falling" becomes an objective sunset signal rather than a guess.

Because both versions answer the same URLs underneath, data migrations happen once while two representations stay valid.
    `,
    codeExamples: [
      {
        title: "Version once at the edge of the app",
        language: "ts",
        code: `// Path versioning: mount each version separately
app.use("/api/v1", v1Router);   // legacy shape
app.use("/api/v2", v2Router);   // new shape, same services

// v2 serialiser adds a field, renames nothing yet
v2Router.get("/tasks/:id", async (req, res) => {
  const task = await tasks.find(req.params.id);
  res.json({
    data: {
      id: task.id,
      title: task.title,
      status: task.status,
      dueAt: task.due_at?.toISOString() ?? null,  // v2 added dueAt
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
    },
  });
});

// Announce the future on every v1 response
v1Router.use((req, res, next) => {
  res.set("Deprecation", "true");
  res.set("Sunset", "Wed, 01 Jul 2027 00:00:00 GMT");
  res.set("Link", '</api/v2/tasks>; rel="successor-version"');
  next();
});`,
        description:
          "Two prefixes, one service. The Deprecation/Sunset headers give automated clients a machine-readable warning months before removal.",
      },
      {
        title: "Deprecation headers on the wire",
        language: "http",
        code: `GET /api/v1/tasks/t_41 HTTP/1.1
Host: api.example.com

HTTP/1.1 200 OK
Content-Type: application/json
Deprecation: true
Sunset: Wed, 01 Jul 2027 00:00:00 GMT
Link: </api/v2/tasks/t_41>; rel="successor-version"

{ "data": { "id": "t_41", "title": "Write RFC", "status": "open" } }`,
        description:
          "A well-behaved client reads Link rel=\"successor-version\" and Deprecation without any email — the protocol does the communication.",
      },
    ],
    commonMistakes: [
      "Shipping a 'small' breaking change in place: removing a field from v1 'because nobody uses it' — someone does.",
      "Creating v2 for every tweak, so five versions are alive and every bug must be fixed five times.",
      "Sunsetting by silently turning v1 off; without Sunset headers and monitoring, integrations fail in production for days.",
    ],
    bestPractices: [
      "Default to additive evolution; reserve a new version for removals, renames, type changes or semantic shifts.",
      "Tag every metric and log line with api_version so the sunset decision is data-driven.",
      "Write a short migration guide with before/after JSON for each change when you cut a version.",
    ],
    realWorldUseCases: [
      "GitHub keeps /api/v3 stable for years while versioning specific preview media types — additive changes carry the load.",
      "A NodePath-style learning platform can evolve /v1/enrollments while mobile app builds from 2025 still parse v1 payloads.",
    ],
    resources: [
      docs(
        "Microsoft — API versioning guidance",
        "https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design#api-versioning",
        "URL/header options and when to publish a new version.",
        "en",
        "12 min",
      ),
      docs("RFC 8594 — Sunset HTTP header", "https://www.rfc-editor.org/rfc/rfc8594", "The standard header for announcing an endpoint's removal date.", "en", "reference"),
      docs("OpenAPI — openapi field and versions", OFFICIAL.openapiSpec, "How specifications themselves are versioned.", "en", "reference"),
      ytSearch("REST API versioning strategies url vs header", "Trade-off discussions with real API examples.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-version-classify",
        title: "Breaking or not?",
        prompt:
          "Classify each proposed change as breaking or compatible and justify in one line: (1) add optional field `estimatedMinutes`, (2) rename `name` to `displayName`, (3) allow a new enum value for `status`, (4) require authentication on a previously public endpoint, (5) add a new endpoint, (6) change `total` from number to string, (7) tighten `limit` max from 100 to 50.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["If a strictly-typed existing client could throw or misbehave, it is breaking."],
      },
      {
        id: "ex-p2m5-version-sunset",
        title: "Plan a sunset",
        prompt:
          "Your logs show /api/v1 still serves 6% of traffic, mostly from three API keys. Write a sunset plan: headers to add now, timeline (announce → freeze → 410), what each step's response looks like, and how you verify each of the three integrators has migrated.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Group traffic by api key, not IP. 410 Gone still deserves a JSON error body."],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-task-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-idempotency",
    slug: "idempotency",
    title: "Idempotency Keys and Safe Retries",
    description:
      "Making POST retries safe with Idempotency-Key, storing the first response, and the real semantics of POST vs PUT.",
    order: 10,
    estimatedMinutes: 20,
    tags: ["idempotency", "reliability", "http"],
    prerequisites: ["p1m1-methods", "p2m5-methods-and-codes"],
    relatedTopics: ["p2m5-rate-limiting", "p2m5-methods-and-codes", "p2m5-error-response-formats"],
    learningObjectives: [
      "Explain why POST is not idempotent and what an idempotency key adds",
      "Implement the store-first-response pattern with a TTL",
      "Handle concurrent retries of the same key correctly",
      "Choose between POST, PUT and PATCH for operations that may be retried",
    ],
    simpleExplanation:
      "Networks fail in the worst moment: your payment POST reaches the server, the response is lost, and the client cannot tell whether to retry. An **idempotency key** — a unique value (usually a UUID) the client sends with the request — lets the server remember what it already did: the first attempt executes, and every replay of the same key returns the *stored* original response instead of doing the work twice.",
    detailedContent: `
**The problem.** A client times out after 30 seconds. Did the order get created? Retrying a POST may create a second order; not retrying may leave the user waiting. HTTP only promises idempotency for GET, PUT, DELETE and HEAD — POST creates a new resource each call.

**The pattern (as Stripe made it standard):**

1. Client generates \`Idempotency-Key: 3f6c...9a\` (one per logical operation, **reused on every retry** of that operation).
2. Server atomically claims the key (\`SET key NX EX 86400\` in Redis, or a unique index insert). Three outcomes:
   - **New key** → execute, store \`{ request hash, status, response body }\` under the key with a 24h TTL, return it.
   - **Existing key, request hash matches** → return the stored response (status + body) with a header such as \`Idempotent-Replay: true\`. Do *not* re-execute.
   - **Existing key, request hash differs** → **409 IDEMPOTENCY_KEY_REUSED** — the client sent a different payload under the same key.
3. A concurrent second attempt while the first still runs → **409** (or wait briefly and re-check) — never execute twice.

**POST vs PUT vs PUT-style upserts:** PUT \`/orders/o_9\` replacing a known id is naturally idempotent — retries are harmless. POST \`/orders\` is not. Alternatives like \`PUT /orders/client-token-xyz\` (client-chosen id) also make creation idempotent; that is elegant when clients control ids.

**What to store:** method + path + body hash, final status code and serialised body. Store the *first* response, not a re-run. Make the check **atomic** — a plain read-then-write has a race window that defeats the whole feature.
    `,
    howItWorks: `
Inside the middleware, the key lookup and claim happen before any handler logic:

1. Read \`Idempotency-Key\`; if absent, pass through (or 400 if your API mandates it for POST).
2. Atomically claim: \`SET idem:<key> pending NX EX 86400\`.
   - \`OK\` → you own it: run the handler, then \`SET idem:<key> <json> EX 86400\`.
   - Already exists → read the value; \`pending\` means a concurrent attempt (409), a stored response means replay it verbatim with the same status code.
3. If the handler throws, delete the claim so the client may retry with the same key after a real failure — you do not want to cache a 500 forever.

Because the response is byte-identical, clients, logs and downstream webhooks see one logical operation regardless of how many attempts the network forced.
    `,
    codeExamples: [
      {
        title: "Idempotency middleware (Redis-backed)",
        language: "ts",
        code: `import { createHash } from "node:crypto";

export function idempotency(redis) {
  return async (req, res, next) => {
    const key = req.header("Idempotency-Key");
    if (!key) return next(); // or 400 if your API requires it

    const fingerprint = createHash("sha256")
      .update(req.method + req.path + JSON.stringify(req.body ?? {}))
      .digest("hex");

    const redisKey = "idem:" + key;
    const claimed = await redis.set(redisKey, "pending", { NX: true, EX: 86400 });

    if (!claimed) {
      const stored = await redis.get(redisKey);
      if (stored === "pending") {
        return res.status(409).json({
          error: { code: "IDEMPOTENCY_IN_PROGRESS",
                   message: "A request with this Idempotency-Key is still running.",
                   requestId: req.id },
        });
      }
      const { fingerprint: storedHash, status, body } = JSON.parse(stored);
      if (storedHash !== fingerprint) {
        return res.status(409).json({
          error: { code: "IDEMPOTENCY_KEY_REUSED",
                   message: "This key was used with a different request body.",
                   requestId: req.id },
        });
      }
      res.set("Idempotent-Replay", "true");
      return res.status(status).json(body); // stored first response
    }

    // Capture the response by wrapping res.json
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      await redis.set(redisKey,
        JSON.stringify({ fingerprint, status: res.statusCode, body }),
        { EX: 86400 });
      return originalJson(body);
    };
    next();
  };
}

app.post("/api/v1/charges", idempotency(redis), createCharge);`,
        description:
          "Atomic NX claim closes the race; the wrapped res.json stores the first response; a 409 covers both in-flight duplicates and key reuse with a different body.",
      },
      {
        title: "Client and server on the wire",
        language: "http",
        code: `POST /api/v1/charges HTTP/1.1
Idempotency-Key: 3f6c0b2e-1f4a-4d5b-9c11-8a2e6d5f9a91
Content-Type: application/json

{ "orderId": "o_9", "amountCents": 4999, "currency": "USD" }

HTTP/1.1 201 Created
Location: /api/v1/charges/ch_551

{ "data": { "id": "ch_551", "status": "succeeded", "amountCents": 4999 } }

--- retry after timeout, SAME key ---

HTTP/1.1 201 Created
Idempotent-Replay: true
Location: /api/v1/charges/ch_551

{ "data": { "id": "ch_551", "status": "succeeded", "amountCents": 4999 } }`,
        description:
          "Identical status, body and Location on replay — the client observes exactly one charge no matter how many attempts happened.",
      },
    ],
    commonMistakes: [
      "Generating a fresh key on every retry — that defeats the feature entirely; the key identifies the logical operation, not the attempt.",
      "Check-then-execute without atomicity: two concurrent retries both read 'no key stored' and both charge the card.",
      "Caching failures: storing a 500 or 402 under the key permanently blocks retries of a genuinely recoverable operation.",
    ],
    bestPractices: [
      "Require Idempotency-Key on every POST that creates money, inventory or messages — document it as a first-class header.",
      "Keep a 24-hour TTL and include method + path + body hash in the fingerprint to catch key reuse.",
      "Expose Idempotent-Replay in responses so clients can log when a retry actually replayed.",
    ],
    realWorldUseCases: [
      "Stripe charges and payouts: every POST ships with an idempotency key; SDK retries reuse it automatically.",
      "A URL shortener (p2-url-shortener): POST /shorten with a client-generated key prevents duplicate redirects after flaky mobile connections.",
    ],
    resources: [
      docs(
        "Stripe docs — Idempotent requests",
        "https://stripe.com/docs/api/idempotent_requests",
        "The reference implementation of Idempotency-Key semantics.",
        "en",
        "12 min",
      ),
      docs("RFC 9110 — Idempotent methods", OFFICIAL.rfcHttp, "Which methods HTTP itself guarantees may be retried.", "en", "reference"),
      docs("Redis — SET NX with TTL", "https://redis.io/docs/latest/commands/set/", "The atomic primitive behind key claiming.", "en", "8 min"),
      ytSearch("idempotency keys explained API", "Walkthroughs of duplicate-request protection with Redis.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-idem-flow",
        title: "Draw the state machine",
        prompt:
          "Write the decision table for idempotency middleware: key absent / key new / key pending / key stored with same fingerprint / key stored with different fingerprint / handler threw. For each row give the server action, HTTP status and headers sent. Then say which row has the race condition if the claim is not atomic.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["'pending' exists only between claim and store — that window is the race.", "Handler threw → delete the claim so the client can retry."],
        solution: `| key state        | action                          | status | headers              |
|------------------|---------------------------------|--------|----------------------|
| absent           | execute normally (no protection)| 2xx    | —                    |
| new (claimed)    | execute, store response, TTL 24h| 2xx    | —                    |
| pending          | refuse: attempt still running   | 409    | —                    |
| stored, same hash| return stored response verbatim | 2xx*   | Idempotent-Replay    |
| stored, diff hash| reject key reuse                | 409    | —                    |
| handler threw    | delete claim, propagate error   | 4xx/5xx| —                    |
* same status as the original stored response.
Race row: 'new (claimed)' if implemented as GET-then-SET instead of atomic SET NX.`,
        solutionLanguage: "text",
      },
      {
        id: "ex-p2m5-idem-retry",
        title: "Build a retrying client",
        prompt:
          "Write a fetch wrapper that POSTs a charge, retries up to 3 times on network error/503 with exponential backoff, and reuses one Idempotency-Key across all attempts. Show which header stays constant and which attempt is allowed to change the body (none).",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: ["Generate the key before the first attempt, outside the retry loop."],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-url-shortener", "p2-auth-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-rate-limiting",
    slug: "rate-limiting",
    title: "Rate Limiting",
    description:
      "Token bucket vs fixed window algorithms, 429 responses with Retry-After and X-RateLimit-* headers, and per-user vs per-IP keys in Redis or memory.",
    order: 11,
    estimatedMinutes: 19,
    tags: ["rate-limiting", "redis", "middleware", "reliability"],
    prerequisites: ["p2m2-middleware", "p2m5-methods-and-codes"],
    relatedTopics: ["p2m5-idempotency", "p2m5-api-security-basics", "p2m5-logging-monitoring"],
    learningObjectives: [
      "Compare token bucket, fixed window and sliding window algorithms",
      "Return 429 with Retry-After and X-RateLimit-* headers clients can act on",
      "Choose a limiting key: authenticated user, API key, IP or a combination",
      "Store counters in memory for one process and Redis for a fleet",
    ],
    simpleExplanation:
      "A rate limiter is a doorman for your API: each caller gets a budget (say, 100 requests per minute). When the budget runs out, the server answers `429 Too Many Requests` with a `Retry-After` header saying when to come back — instead of letting one noisy client exhaust the database for everyone else. The budget can be spent slowly (token bucket) or reset on a clock (fixed window); the choice affects how bursty your traffic can be.",
    detailedContent: `
**Algorithms**

- **Fixed window** — count requests in an aligned window (\`12:00–12:09\`). Trivial to implement, but a burst at 12:09:59 plus another at 12:10:00 allows 2× the intended rate at the boundary.
- **Sliding window** — smooth the boundary by weighting the previous window; correct, more bookkeeping.
- **Token bucket** — a bucket of \`capacity\` tokens refills at \`rate\` per second. Each request costs one token; an empty bucket means 429. Allows controlled **bursts** (up to capacity) with a steady long-run rate — the usual best default (and what most L7 proxies implement).
- **Leaky bucket** — smooths output to a constant rate; useful when the downstream is rate-sensitive.

**The response contract.** When you reject:

    HTTP/1.1 429 Too Many Requests
    Retry-After: 30
    X-RateLimit-Limit: 100
    X-RateLimit-Remaining: 0
    X-RateLimit-Reset: 1791648000

Also send \`X-RateLimit-*\` on **successful** responses so clients can throttle *before* they get blocked. \`Retry-After\` may be delta-seconds or an HTTP-date; seconds are the common choice. Your body uses the standard error envelope: \`code: "RATE_LIMITED"\`.

**Keying decisions:** per-**authenticated user** (or API key) for fairness among known clients; per-**IP** for pre-auth endpoints (login) — but IPs behind NAT or corporate proxies are shared, so combine (\`userId\` or \`ip + route\`). Tighter limits on expensive routes (search, exports) and looser on cheap reads.

**Storage:** an in-memory \`Map\`/sliding counter works for a single dev process but is wrong for a fleet (each instance allows the full budget) — production uses **Redis** with atomic \`INCR\` + \`EXPIRE\`, or Lua scripts, so all instances share one counter.
    `,
    howItWorks: `
For a token bucket, the state per key is \`{ tokens, lastRefill }\`:

1. On each request, compute \`tokens = min(capacity, tokens + elapsed * rate)\` — refill based on time passed.
2. If \`tokens >= 1\`, decrement and allow; otherwise reject with 429 and \`Retry-After = ceil((1 - tokens) / rate)\`.
3. Persist state in Redis: \`INCR rate:<key>\` once per window with \`EXPIRE\`, or run a small Lua script that refills and consumes atomically.

In Express this sits early in the middleware chain — after request-id logging, before heavy handlers. Popular implementations (\`express-rate-limit\`) expose \`windowMs\`, \`max\`, custom \`keyGenerator\` and \`handler\` so the 429 body matches your error envelope instead of the library's default text.
    `,
    codeExamples: [
      {
        title: "express-rate-limit with your own 429 envelope",
        language: "ts",
        code: `import rateLimit from "express-rate-limit";

// Global: 100 requests / minute / user (falls back to IP when anonymous)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",   // X-RateLimit-Limit/Remaining/Reset on every response
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  handler: (req, res, next) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000);
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
        details: [{ field: "x-ratelimit-remaining", code: "exhausted",
                    message: "Rate limit of 100 per minute reached." }],
        requestId: req.id,
      },
    });
    res.set("Retry-After", String(Math.max(retryAfter, 1)));
  },
});

// Expensive route gets a tighter budget
export const searchLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20 });

app.use("/api/v1", apiLimiter);
app.get("/api/v1/search", searchLimiter, searchHandler);`,
        description:
          "Identity-aware keys keep one abusive user from starving others; a per-route limiter protects the costliest endpoint; the body matches your global error format.",
      },
      {
        title: "A tiny fixed-window limiter in Redis",
        language: "ts",
        code: `// One shared counter across all API instances
export async function checkLimit(redis, key, limit, windowSec) {
  const bucket = Math.floor(Date.now() / 1000 / windowSec); // aligned window
  const redisKey = \`rl:\${key}:\${bucket}\`;

  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, windowSec + 1); // first hit sets TTL

  const remaining = Math.max(limit - count, 0);
  const resetAt = (bucket + 1) * windowSec; // seconds until next window
  return {
    allowed: count <= limit,
    limit,
    remaining,
    reset: resetAt,
    retryAfter: resetAt - Math.floor(Date.now() / 1000),
  };
}

// usage in middleware
const r = await checkLimit(redis, req.user?.id ?? req.ip, 100, 60);
res.set("X-RateLimit-Limit", String(r.limit));
res.set("X-RateLimit-Remaining", String(r.remaining));
res.set("X-RateLimit-Reset", String(r.reset));
if (!r.allowed) {
  res.set("Retry-After", String(r.retryAfter));
  return res.status(429).json({
    error: { code: "RATE_LIMITED", message: "Too many requests.",
             requestId: req.id },
  });
}
next();`,
        description:
          "INCR + EXPIRE is atomic enough for counting and cheap at high QPS; bucketing by time keeps one key per window and self-expires.",
      },
    ],
    commonMistakes: [
      "In-memory counters in a multi-instance deployment: with 4 replicas each client actually gets 4× the intended limit.",
      "A 429 with no Retry-After — retry libraries and humans then guess (usually with tight loops that make things worse).",
      "Keying only by IP behind a load balancer or corporate NAT, throttling hundreds of unrelated users as one.",
    ],
    bestPractices: [
      "Emit X-RateLimit-* on all responses, not only on rejections, so clients can self-throttle.",
      "Use stricter limits on authentication, search and export endpoints — the usual targets of abuse.",
      "Tie 429 responses to your standard error envelope with code RATE_LIMITED and the requestId.",
    ],
    realWorldUseCases: [
      "Public APIs (GitHub: 5000 req/hour per token) return 429 with rate-limit headers that SDKs honour automatically.",
      "Login endpoints limit per IP *and* per account to blunt credential-stuffing without locking out shared office IPs entirely.",
    ],
    resources: [
      docs("express-rate-limit", OFFICIAL.expressRateLimit, "Reference implementation for Express: windows, key generators, headers, custom handlers.", "en", "reference"),
      docs("MDN — 429 Too Many Requests", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429", "Status semantics and the Retry-After header.", "en", "5 min"),
      docs("Redis — INCR and EXPIRE", OFFICIAL.redisDocs, "Atomic counters with TTL backing distributed limiters.", "en", "reference"),
      ytSearch("rate limiting algorithms token bucket explained", "Visual explainers of buckets, windows and 429 flows.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-rate-choose",
        title: "Pick the algorithm",
        prompt:
          "A public API promises '1000 requests per hour' and also 'short bursts of 50 must succeed'. Which algorithm fits (fixed window, sliding window, token bucket)? State capacity and refill rate, compute Retry-After when the bucket is empty, and explain why a naive fixed window can accidentally allow 2000 requests in two minutes.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["Refill rate = 1000/3600 tokens per second; capacity = burst size.", "Fixed windows straddle an hour boundary."],
        solution: `Token bucket: capacity 50 (the burst), refill 1000/3600 = 0.2778 tokens/s.
Long-run average stays 1000/hour while a 50-request burst passes instantly.

Retry-After when empty with r tokens needed at rate k:
  retry = ceil((1 - tokens) / k)  → worst case ceil(1 / 0.2778) ≈ 4s for one token,
  or until tokens are restored to the number the client wants.

Naive fixed window (count per clock hour): a client spends 1000 at 10:59:59 and
1000 more at 11:00:00 → 2000 requests in 61 seconds, breaking the promise.`,
        solutionLanguage: "text",
      },
      {
        id: "ex-p2m5-rate-limit-test",
        title: "Prove the limiter",
        prompt:
          "Set a limit of 5 requests per 10 seconds on one route. Using curl in a loop, capture the X-RateLimit-* headers of the 1st, 5th and 6th responses plus the full 429 (status, Retry-After, body). Then run two Node processes and explain what changes when counters are only in memory.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["curl -s -o /dev/null -D - prints only headers.", "Each process counts independently — total allowed doubles."],
      },
    ],
    projectIds: ["p2-auth-api", "p2-url-shortener"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-openapi-swagger",
    slug: "openapi-and-swagger",
    title: "OpenAPI and Swagger",
    description:
      "OpenAPI 3 structure, contract-first specs, generating Swagger UI, and driving docs, tests and client code from the spec.",
    order: 12,
    estimatedMinutes: 22,
    tags: ["openapi", "swagger", "documentation", "tooling"],
    prerequisites: ["p2m5-rest-principles", "p2m3-documents-collections"],
    relatedTopics: ["p2m5-api-versioning", "p2m5-testing-endpoints", "p2m5-consistent-responses"],
    learningObjectives: [
      "Read and write an OpenAPI 3 document: info, servers, paths, components",
      "Explain contract-first development and where the spec fits in the build loop",
      "Serve interactive Swagger UI from your Express app",
      "Use the spec to generate client SDKs, fixtures and contract tests",
    ],
    simpleExplanation:
      "OpenAPI (formerly Swagger) is a machine-readable description of your API — every path, method, parameter, request body, response and error, written in YAML or JSON. Once the spec exists, documentation sites, interactive `try it out` panels, request validators, mock servers and client SDKs all come from it, so the docs can no longer drift from the code.",
    detailedContent: `
**The document skeleton (OpenAPI 3.x):**

    openapi: 3.1.0
    info:      { title, version, description }
    servers:   [ { url: "https://api.example.com" } ]
    paths:
      /tasks:
        get:    { parameters, responses }
        post:   { requestBody, responses }
    components:
      schemas:      { Task, TaskList, Error }   # reusable models
      securitySchemes: { bearerAuth: { type: http, scheme: bearer } }

Everything reusable lives in \`components\`: schemas, parameters (\`limit\`, \`cursor\`), responses (\`404NotFound\`, \`429RateLimited\`) and security schemes. Paths then \`$ref\` them — one definition of \`Error\` keeps the whole document consistent.

**Contract-first (spec before code):** write the paths and schemas as the design artefact, review *that* in the pull request, then implement handlers to satisfy it. Alternatives — code-first with annotations, or a spec generated from routes — work too, but a hand-written spec reviewed first catches naming and status-code mistakes while they are still cheap.

**Swagger UI** renders any OpenAPI document as an interactive reference: \`GET /api-docs\` serves the UI, \`/api-docs.json\` serves the spec. Because responses are declared, the UI validates what you type in the "try it" box before the request even leaves the browser.

**From the spec you can generate:** typed client SDKs (TypeScript, Python), Postman collections, mock servers, changelogs/diffs (to catch *breaking* changes before release), and **contract tests** asserting your handlers still return the declared shapes.
    `,
    howItWorks: `
A typical build loop looks like this:

1. Edit \`openapi.yaml\` — add \`POST /tasks\` with a \`TaskCreate\` schema and \`201\`/\`422\` responses.
2. CI runs a validator (\`@redocly/cli lint\`) — structural errors, missing responses, $ref breakages fail the build.
3. The spec is served to Swagger UI; product and clients review the *behaviour* before implementation lands.
4. Handlers are written against the schema (Zod schemas can even be the source, projected into OpenAPI via a converter).
5. Contract tests fetch \`/api-docs.json\` and assert each real response validates against its declared schema.

The spec becomes the single artefact tying design, docs, validation and generation together — which is why breaking-change detection is just a diff of two specs.
    `,
    codeExamples: [
      {
        title: "Serving Swagger UI in Express",
        language: "ts",
        code: `import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const spec = YAML.parse(fs.readFileSync("./openapi.yaml", "utf8"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: "NodePath Task API — docs",
}));
app.get("/api-docs.json", (req, res) => res.json(spec));

// Contract test: every response matches the spec
import { validate } from "@seriousme/openapi-schema-validator";
app.get("/__docs-validate", async (req, res) => {
  const result = await validate({ schema: spec });
  res.json({ valid: result.valid, errors: result.errors });
});`,
        description:
          "Two routes and you have interactive docs: the UI at /api-docs, the raw machine-readable spec at /api-docs.json for tests and generators.",
      },
      {
        title: "A complete spec slice for one endpoint",
        language: "yaml",
        code: `openapi: 3.1.0
info:
  title: NodePath Task API
  version: 1.2.0
  description: Tasks, lists and assignments for the NodePath learning platform.
servers:
  - url: https://api.nodepath.dev
paths:
  /tasks:
    get:
      summary: List tasks
      operationId: listTasks
      parameters:
        - $ref: "#/components/parameters/Limit"
        - name: status
          in: query
          schema: { type: string, enum: [open, done] }
      responses:
        "200":
          description: A page of tasks
          content:
            application/json:
              schema:
                type: object
                required: [data, meta]
                properties:
                  data:  { type: array, items: { $ref: "#/components/schemas/Task" } }
                  meta:  { $ref: "#/components/schemas/PageMeta" }
        "429": { $ref: "#/components/responses/RateLimited" }
    post:
      summary: Create a task
      operationId: createTask
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/TaskCreate" }
      responses:
        "201":
          description: Created
          headers:
            Location: { schema: { type: string }, description: URL of the new task }
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: "#/components/schemas/Task" }
        "422": { $ref: "#/components/responses/ValidationFailed" }
components:
  schemas:
    Task:
      type: object
      required: [id, title, status, createdAt]
      properties:
        id:        { type: string, example: t_41 }
        title:     { type: string, minLength: 1, maxLength: 200 }
        status:    { type: string, enum: [open, done] }
        createdAt: { type: string, format: date-time }
    TaskCreate:
      type: object
      required: [title]
      properties:
        title:    { type: string, minLength: 1, maxLength: 200 }
        dueAt:    { type: string, format: date-time }
    PageMeta:
      type: object
      properties:
        limit: { type: integer }
        total: { type: integer }
  responses:
    RateLimited:
      description: Rate limit exceeded
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }`,
        description:
          "Reusable components, an explicit 429 and 422, declared headers — everything Swagger UI and contract tests need to validate real traffic.",
      },
    ],
    commonMistakes: [
      "Hand-writing docs in a wiki beside the code: within two weeks they describe an API that no longer exists.",
      "Documenting only the happy path — clients discover 409/429/422 shapes only by breaking production.",
      "Letting the generator invent schemas from TypeScript interfaces, which usually misses enums, nullability and required fields.",
    ],
    bestPractices: [
      "Lint the spec in CI and fail the build on structural errors or missing common responses.",
      "Keep one Error schema in components and $ref it from every failure response.",
      "Publish a spec diff in release notes so consumers see exactly what changed between versions.",
    ],
    realWorldUseCases: [
      "Partner integrations: publishing /api-docs.json lets a third-party team generate a typed client in an afternoon.",
      "Contract tests catch a teammate renaming `createdAt` to `created_at` before any frontend does.",
    ],
    resources: [
      docs("OpenAPI Specification (latest)", OFFICIAL.openapiSpec, "The authoritative specification: structure, schema object, responses.", "en", "reference"),
      docs("Swagger UI (GitHub)", OFFICIAL.swaggerUi, "Interactive reference UI and Express integration.", "en", "reference"),
      docs("OpenAPI Guide — structure", "https://swagger.io/docs/specification/about/", "Swagger.io's pragmatic introduction to the document model.", "en", "15 min"),
      ytSearch("OpenAPI 3 tutorial swagger UI express", "Build-along videos generating docs from a spec.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-openapi-write",
        title: "Spec one endpoint end-to-end",
        prompt:
          "Write an OpenAPI 3.1 YAML slice for PATCH /tasks/{id}: path param (string), a TaskPatch body (title?, status? — both optional), responses 200 (updated Task), 400, 404 and 422, plus the shared Error schema in components. Include at least one $ref. Then state what Swagger UI renders differently for a required vs optional body property.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: ["Path parameters are always required — mark it in `required: true`.", "Optional means the property is simply absent from `required: [...]`."],
        solution: `paths:
  /tasks/{id}:
    patch:
      summary: Partially update a task
      operationId: patchTask
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, example: t_41 }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:  { type: string, minLength: 1, maxLength: 200 }
                status: { type: string, enum: [open, done] }
      responses:
        "200":
          description: Updated task
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: "#/components/schemas/Task" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "404": { $ref: "#/components/responses/NotFound" }
        "422": { $ref: "#/components/responses/ValidationFailed" }

# Swagger UI: \`status\` shows as an enum dropdown; properties missing from
# \`required\` render as optional inputs in "try it out".`,
        solutionLanguage: "yaml",
      },
      {
        id: "ex-p2m5-openapi-diff",
        title: "Catch a breaking change",
        prompt:
          "Take your spec from the previous exercise and propose three changes: one compatible, one breaking, one ambiguous (e.g. adding an enum value). For each, describe what a generated TypeScript client would do and which change you would ship in-place vs in a new version.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: ["A removed required field breaks compiled clients; a new optional field does not."],
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-testing-endpoints",
    slug: "testing-endpoints",
    title: "Testing Endpoints with Collections",
    description:
      "Postman/Bruno collections, environments, scripts for auth chaining, contract checks and exporting collections for the team and CI.",
    order: 13,
    estimatedMinutes: 19,
    tags: ["testing", "postman", "collections", "automation"],
    prerequisites: ["p2m3-documents-collections", "p2m5-openapi-swagger"],
    relatedTopics: ["p2m5-api-security-basics", "p2m5-consistent-responses", "p2m5-error-response-formats"],
    learningObjectives: [
      "Structure a request collection that mirrors your resource design",
      "Use environments and variables so one collection runs against dev, staging and prod",
      "Chain requests with scripts: login → extract token → call authenticated routes",
      "Run collections in CI and validate responses against your OpenAPI contract",
    ],
    simpleExplanation:
      "A collection is a folder of saved requests — one per endpoint — with variables for the base URL, tokens and ids. Run it against your local server and everything green means the API behaves as documented. Add small scripts (\"take the token from the login response\", \"assert status is 201\") and the same collection becomes an automated smoke test you can run in CI before every deploy.",
    detailedContent: `
**Collection structure.** Mirror the API: folders by resource (\`Auth\`, \`Tasks\`, \`Admin\`), one request per operation, named exactly like the OpenAPI \`operationId\`s. A collection nobody can navigate is a collection nobody runs.

**Environments and variables.** Store \`{{baseUrl}}\`, \`{{token}}\`, \`{{taskId}}\` as variables with values per environment:

- \`dev\` → \`http://localhost:3000\`
- \`staging\` → \`https://staging.api.example.com\`
- \`prod\` → read-only smoke tests only

Never hardcode URLs or secrets in requests; committed tokens are leaked tokens.

**Scripts for auth chaining.** A \`pre-request script\` can log in once and stash the bearer token; a \`test script\` (assertions) after each response checks status and extracts ids for the next call:

    pm.test("created", () => pm.response.to.have.status(201));
    pm.environment.set("taskId", pm.response.json().data.id);

So the flow "login → create task → fetch task → update → delete → confirm 404" runs with zero manual clicks.

**Contract checks.** Add an assertion that the response body matches your OpenAPI schema (libraries exist for Postman/Newman and Bruno). Now a renamed field fails the suite, not a customer.

**Export and CI.** Collections export as JSON; \`newman run collection.json --environment ci.json\` executes them headlessly in your pipeline. Keep \`prod\` runs minimal, read-only and rate-limit friendly.
    `,
    howItWorks: `
Under the hood a collection runner is just an HTTP client with a script engine:

1. Resolve variables (environment → collection → local) into the final URL, headers and body.
2. Run pre-request scripts (generate a nonce, sign a header, refresh a token).
3. Send the request with the same primitives as curl.
4. Run test scripts against the captured status, headers and body; each \`pm.test\` registers a pass/fail.
5. Persist any \`pm.environment.set\` calls for the next request in the chain.

In CI, Newman/Bruno's CLI replays exactly this loop and exits non-zero on any failed assertion — turning your manual sanity checklist into a deploy gate.
    `,
    codeExamples: [
      {
        title: "Auth test script (Postman/Bruno style)",
        language: "js",
        code: `// Test script attached to: POST {{baseUrl}}/api/v1/auth/login
pm.test("200 with token", () => {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body).to.have.property("data");
  pm.expect(body.data).to.have.property("accessToken");
});

// Stash for every subsequent request in the collection
pm.environment.set("token", pm.response.json().data.accessToken);

// Test script for: POST {{baseUrl}}/api/v1/tasks  (pre-request sets {{token}})
pm.test("created + Location + shape", () => {
  pm.response.to.have.status(201);
  pm.response.to.have.header("Location");
  const { data } = pm.response.json();
  pm.expect(data).to.include.keys("id", "title", "status", "createdAt");
  pm.expect(data.status).to.eql("open");
  pm.environment.set("taskId", data.id);
});

// Test script for: DELETE {{baseUrl}}/api/v1/tasks/{{taskId}}
pm.test("204 then 404", () => pm.response.to.have.status(204));`,
        description:
          "Assertions double as documentation: the key list enforces the response contract, and taskId flows to the next request automatically.",
      },
      {
        title: "Run the same collection in CI",
        language: "bash",
        code: `# Install the CLI runner
npm i -D newman

# Export once from the GUI: File → Export → collection + environment
newman run collections/task-api.postman_collection.json \\
  -e environments/ci.postman_environment.json \\
  --env-var baseUrl=http://127.0.0.1:3000 \\
  --folder "Smoke" \\
  --reporters cli,junit \\
  --reporter-junit-export reports/newman.xml

# Exit code is non-zero when any assertion fails → deploy gate`,
        description:
          "The GUI and CI run identical requests — developers get interactive debugging, pipelines get regression protection.",
      },
    ],
    commonMistakes: [
      "Hardcoding http://localhost:3000 and a personal access token inside requests — the collection then only works on one laptop.",
      "Assertions only on status 200: the body can silently lose a field and every test stays green.",
      "A 'tests' folder full of one-off manual requests nobody runs — collections must be runnable end-to-end in one click or one command.",
    ],
    bestPractices: [
      "One folder per resource, request names matching operationIds, and a Smoke folder that CI always runs.",
      "Assert body structure (required keys, types), not just status codes — that is what catches contract drift.",
      "Keep secrets in environment files excluded from git; CI injects them as variables at run time.",
    ],
    realWorldUseCases: [
      "A staging smoke suite of 40 requests runs after every deploy and answers 'is the API basically healthy?' in 30 seconds.",
      "Onboarding: a new engineer runs the exported collection against dev and understands the whole API by reading request names.",
    ],
    resources: [
      docs("Postman learning center", "https://learning.postman.com/docs/", "Collections, environments, scripts and the Newman CLI.", "en", "reference"),
      docs("Bruno documentation", "https://docs.usebruno.com/", "Open-source collection client with git-friendly plain-text collections.", "en", "reference"),
      docs("Newman (GitHub)", "https://github.com/postmanlabs/newman", "CLI collection runner for CI pipelines.", "en", "reference"),
      ytSearch("postman collection environment variables tutorial", "Videos covering auth chains and scripted assertions.", "en", "12–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-test-chain",
        title: "Script the full lifecycle",
        prompt:
          "Build a collection for your API that, with zero manual interaction: logs in, creates a resource, reads it back, updates it, deletes it, then asserts 404 on a final fetch. For each request write the assertion(s) beyond the status code (at least one header or body-shape check per response) and mark which variables must pass between steps.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: ["Capture the new id from the 201 body via pm.environment.set.", "The final 404 proves deletion really happened."],
      },
      {
        id: "ex-p2m5-test-contract",
        title: "Add a contract assertion",
        prompt:
          "Take one list response and write assertions for: envelope keys (data/meta), array item key set, camelCase naming of two fields, and ISO 8601 shape of createdAt (regex). Run it, then deliberately rename a field in the handler and paste the failing test output.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(value) checks ISO shape."],
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api", "p2-auth-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-api-security-basics",
    slug: "api-security-basics",
    title: "API Security Basics",
    description:
      "The OWASP API Security Top 10 as a checklist, authentication vs authorization, minimal data exposure and audit logging.",
    order: 14,
    estimatedMinutes: 22,
    tags: ["security", "owasp", "auth", "authorization"],
    prerequisites: ["p1m1-cookies", "p2m5-error-response-formats"],
    relatedTopics: ["p2m5-rate-limiting", "p2m5-request-validation", "p2m5-logging-monitoring"],
    learningObjectives: [
      "Name the leading OWASP API Security risks and map each to a concrete defence",
      "Separate authentication (who) from authorization (what may you do)",
      "Apply least-data-exposure: serialise only what the caller needs",
      "Record audit events for sensitive actions with correlation ids",
    ],
    simpleExplanation:
      "API security is not one feature — it is a short list of recurring failures. The OWASP API Security Top 10 is that list: the most exploited problems are **authorization** (user A reaching user B's object), **broken authentication**, **excessive data** in responses, and **unbounded resource use**. Your defence: verify identity, verify permission on *every object access*, return the minimum fields, and write down who did what.",
    detailedContent: `
**OWASP API Security Top 10 (2023) mapped to defences:**

| Risk | In practice | Defence |
| --- | --- | --- |
| API1 Broken Object Level Authorization (BOLA) | \`GET /orders/99\` returns another tenant's order | Check ownership on every fetch: \`WHERE id = ? AND tenant_id = ?\` |
| API2 Broken Function Level Authz | A normal user calls \`/admin/users\` | Role guard middleware per route, not per controller |
| API3 Broken Authentication | Stolen/replayed tokens, no expiry | Short-lived JWTs, rotation, rate-limited login |
| API4 Unrestricted Resource Consumption | \`limit=1e9\`, huge uploads, no rate limit | Page-size caps, body limits, 429s |
| API5 Broken Object Property Level Authz | \`{"role":"admin"}\` mass-assigned | Strict schemas — strip unknown fields |
| API6 Unrestricted Business Flows | Bots racing to buy stock | Idempotency, flow-specific throttles, CAPTCHA at edges |
| API7 SSRF | Server fetches a user-supplied URL | Allowlist outbound destinations |
| API8 Security Misconfiguration | Debug mode, permissive CORS, default creds | Hardened base config + headers (Helmet) |
| API9 Improper Inventory Management | Forgotten \`/v2-beta\` still live | Spec-driven inventory, deprecate and remove |
| API10 Unsafe Consumption | Trusting a third-party webhook blindly | Verify signatures, validate shapes |

**Authentication ≠ authorization.** AuthN proves identity (JWT, session); AuthZ decides the action. \`401\` = no/invalid identity; \`403\` = known identity, denied action; \`404\` sometimes leaks less information than 403 for objects the caller may not know exist — choose deliberately.

**Minimal data exposure:** never return \`password_hash\`, internal notes, other users' PII or unreleased fields. Serialise through DTOs (lesson 5). "We'll hide it in the frontend" is not a control.

**Audit logs:** for money, permission and content changes, write \`{ actor, action, target, ip, requestId, timestamp }\` to append-only storage — separate from debug logs — so answers to "who deleted this?" exist months later.
    `,
    howItWorks: `
A request crosses four gates before touching data:

1. **Transport & edge** — HTTPS, Helmet headers, rate limit, body-size cap.
2. **Authentication** — verify the bearer token signature/expiry; attach \`req.user\`.
3. **Authorization** — route-level role checks (\`requireRole("admin")\`) *and* object-level checks inside the handler (\`assertOwned(order, req.user)\`). Both layers are required: BOLA is precisely the gap between them.
4. **Serialisation** — map the row through a DTO so only permitted fields leave, then append an audit entry if the action was sensitive.

Fail-closed at every gate: a missing role, unknown tenant or malformed token must default to *deny*, never to "allow and log".
    `,
    codeExamples: [
      {
        title: "Layered authorisation (role + object)",
        language: "ts",
        code: `// 1) Function-level guard mounted per route
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "UNAUTHENTICATED", "Log in first."));
  if (req.user.role !== role && req.user.role !== "admin")
    return next(new ApiError(403, "FORBIDDEN", "Insufficient role."));
  next();
};

// 2) Object-level check (BOLA defence) — always tenant-scoped
export async function loadOwnOrder(req, res, next) {
  const order = await db.orders.findFirst({
    id: req.params.id,
    tenant_id: req.user.tenantId,   // never id alone
  });
  if (!order) return next(new ApiError(404, "ORDER_NOT_FOUND", "No such order."));
  req.order = order;
  next();
}

app.get("/api/v1/orders/:id", authenticate, loadOwnOrder, getOrder);
app.delete("/api/v1/orders/:id", authenticate, requireRole("admin"),
           loadOwnOrder, cancelOrder);

// 3) Audit entry for sensitive actions
await audit.write({
  actor: req.user.id, action: "order.cancelled",
  target: req.order.id, ip: req.ip, requestId: req.id,
  at: new Date().toISOString(),
});`,
        description:
          "Two independent authorisation layers plus an audit trail: guessing an order id (BOLA) now returns 404 for other tenants, and every cancellation is attributable.",
      },
      {
        title: "Minimal vs leaking serialisation",
        language: "json",
        code: `// NEVER — raw database document
{
  "id": "u_7",
  "email": "amina@example.com",
  "password_hash": "$2b$10$K8Ht...",
  "internal_risk_score": 12,
  "reset_token": "a91f...",
  "role": "user"
}

// AFTER — DTO with least data exposure
{
  "data": {
    "id": "u_7",
    "email": "amina@example.com",
    "displayName": "Amina Yusuf",
    "role": "user",
    "createdAt": "2026-05-02T11:20:00.000Z"
  }
}`,
        description:
          "The same row: on the left, three secrets an attacker would love; on the right, only fields the profile UI actually renders.",
      },
    ],
    commonMistakes: [
      "Checking authentication and then fetching by id alone — authenticated but unauthorised access (BOLA) is the #1 API risk.",
      "Returning the full ORM document 'for convenience' and discovering the leak when a security scanner flags it.",
      "Writing audit events to the same rotating debug log, so they get deleted after 14 days.",
    ],
    bestPractices: [
      "Fail closed: missing role, missing tenant or unknown token → deny.",
      "Run the OWASP API Security Top 10 as a review checklist for every new endpoint.",
      "Keep audit logs append-only with requestId correlation and long retention.",
    ],
    realWorldUseCases: [
      "Multi-tenant SaaS: every query carries tenant_id; forgetting it once is a data-breach-class incident.",
      "Marketplaces audit listing edits so a disputed edit can be attributed to an account, IP and time.",
    ],
    resources: [
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "The canonical risk list this lesson maps to.", "en", "reference"),
      docs(
        "OWASP — Authorization Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
        "Deny-by-default, function- and object-level authorisation patterns.",
        "en",
        "12 min",
      ),
      docs("Helmet (secure HTTP headers)", OFFICIAL.helmetDocs, "Baseline response hardening for Express apps.", "en", "8 min"),
      ytSearch("OWASP API security top 10 explained", "Case-study videos walking through BOLA and broken authz.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-security-bola",
        title: "Hunt for BOLA",
        prompt:
          "Audit one of your endpoints: GET /api/v1/<resource>/:id. Write the exact query it runs today, then rewrite it to be tenant-scoped. Test with two accounts: paste the responses when account A requests account B's id before and after the fix. Which status code did you choose and why?",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: ["404 hides existence from callers who may not know the id; 403 asserts existence — pick one policy and keep it consistent."],
      },
      {
        id: "ex-p2m5-security-checklist",
        title: "Run the Top 10 on your API",
        prompt:
          "Go through all ten OWASP API risks against your current project. For each: write 'covered / gap / N/A' plus one line of evidence (the middleware, schema or query that proves it). List the top 2 gaps and the concrete change you would make first.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: ["API9 is easy to forget — list every route you have ever shipped, including experiments."],
      },
    ],
    projectIds: ["p2-auth-api", "p2-ecommerce-api", "p2-chat-backend"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-cors",
    slug: "cors",
    title: "CORS: Preflight, Headers and Credentials",
    description:
      "Why the browser blocks cross-origin reads, how OPTIONS preflight works, Access-Control-* headers, credentials mode, and the mistakes that break every frontend.",
    order: 15,
    estimatedMinutes: 18,
    tags: ["cors", "browser", "http", "security"],
    prerequisites: ["p1m1-headers", "p2m2-middleware"],
    relatedTopics: ["p2m5-api-security-basics", "p2m5-logging-monitoring", "p1m1-browsers-servers"],
    learningObjectives: [
      "Explain the same-origin policy and which requests CORS actually restricts",
      "Describe the preflight OPTIONS dance and which requests trigger it",
      "Configure Access-Control-* headers, including the credentials rules",
      "Diagnose the classic CORS errors from the browser console alone",
    ],
    simpleExplanation:
      "Browsers refuse to let one website read another's responses — that is the same-origin policy. CORS is the **server's** opt-in: it responds with `Access-Control-Allow-Origin` naming the caller's origin, and the browser then unlocks the response *for that page*. Cross-origin requests that carry custom headers or non-simple methods first send a dry-run `OPTIONS` (preflight); if the server does not answer it correctly, the real request never leaves the browser. curl and mobile apps ignore CORS entirely.",
    detailedContent: `
**What triggers what**

- A "simple" request (GET/HEAD/POST, common headers, \`Content-Type: application/json\` is *not* simple — text/plain or form types are) goes straight out; the browser just refuses to *hand the response to JS* without \`Access-Control-Allow-Origin\`.
- Anything else — custom headers (\`Authorization\`), JSON bodies, PUT/DELETE — triggers a **preflight**: an \`OPTIONS\` request that asks which origins, methods and headers are allowed.

**The headers your server must learn**

| Header | Where | Meaning |
| --- | --- | --- |
| \`Access-Control-Allow-Origin\` | response | Which origin may read: the exact origin, or \`*\` |
| \`Access-Control-Allow-Methods\` | preflight response | Allowed verbs, e.g. \`GET, POST, PATCH, DELETE\` |
| \`Access-Control-Allow-Headers\` | preflight response | Allowed request headers, e.g. \`Authorization, Content-Type\` |
| \`Access-Control-Allow-Credentials\` | response | Cookies/auth headers may be sent — **\`*\` is illegal here** |
| \`Access-Control-Max-Age\` | preflight response | Seconds the browser may cache the preflight |
| \`Access-Control-Expose-Headers\` | response | Which response headers JS may read |
| \`Vary: Origin\` | response | Caches must key on Origin when the value is dynamic |

**Credentials mode.** With \`fetch(..., { credentials: "include" })\` the server must echo the **specific** origin (not \`*\`) *and* send \`Access-Control-Allow-Credentials: true\`. Cookie-based auth (p1m1-cookies) depends on this.

**Why the server must configure it.** CORS is enforced by the browser for the protection of *users* — no server-to-server call can ever "have a CORS problem". That is why the fix for a React dev on \`localhost:5173\` calling \`localhost:3000\` is always a server (or dev-proxy) change.
    `,
    howItWorks: `
A preflighted DELETE with a bearer token from \`https://app.example.com\` looks like this:

1. Browser sends \`OPTIONS /api/v1/tasks/t_1\` with \`Origin: https://app.example.com\` and \`Access-Control-Request-Method: DELETE\`.
2. Server answers \`204\` with \`Access-Control-Allow-Origin: https://app.example.com\`, \`Allow-Methods: GET, PATCH, DELETE\`, \`Allow-Headers: Authorization, Content-Type\`, and \`Max-Age: 86400\`.
3. Browser caches that verdict for a day, then sends the real DELETE with the Origin header.
4. The real response must *also* carry a valid \`Allow-Origin\` (and \`Allow-Credentials\` if applicable) or the browser hides it from JS — the network tab still shows a 200, which is why CORS bugs look like "nothing happened".

Express \`cors\` middleware does steps 1–2 for you; misconfiguration usually means an origin mismatch (trailing slash, http vs https) or combining \`*\` with credentials.
    `,
    codeExamples: [
      {
        title: "Correct CORS configuration in Express",
        language: "ts",
        code: `import cors from "cors";

const allowed = new Set([
  "https://app.example.com",
  "https://admin.example.com",
  process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
]);

const corsOptions = {
  origin(origin, callback) {
    // same-origin, curl, and server-to-server calls send no Origin header
    if (!origin || allowed.has(origin)) return callback(null, true);
    return callback(null, false); // NOT an error — just no CORS headers
  },
  credentials: true,                     // cookies / Authorization allowed
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  exposedHeaders: ["x-request-id", "x-ratelimit-remaining"],
  maxAge: 86400,                          // preflight cache: one day
};

app.use(cors(corsOptions));              // BEFORE your routes
app.options("/api/v1/*", cors(corsOptions)); // explicit preflight if needed

// Vary: Origin is essential: caches must not serve one origin's
// Access-Control-Allow-Origin to another. \`cors\` adds it for you.`,
        description:
          "An allowlist, not a wildcard: credentials + '*' is forbidden by the spec, and echoing the request Origin against a set is the pattern that scales to multiple frontends.",
      },
      {
        title: "Preflight and real request on the wire",
        language: "http",
        code: `OPTIONS /api/v1/tasks/t_1 HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
Vary: Origin

DELETE /api/v1/tasks/t_1 HTTP/1.1
Origin: https://app.example.com
Authorization: Bearer eyJ...

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin`,
        description:
          "Two round-trips for the price of one request — which is exactly why Access-Control-Max-Age and minimal Allow-Headers lists matter for latency.",
      },
    ],
    commonMistakes: [
      "Setting Allow-Origin: * together with Allow-Credentials: true — the browser rejects this combination every time.",
      "Handling preflight but forgetting Allow-Origin on the *real* response, so the request 'succeeds' in the network tab but the app sees nothing.",
      "Debugging CORS with curl: curl never enforces it, so 'it works in Postman' says nothing about the browser path. During development use a Vite/webpack dev proxy and keep CORS for deployed environments.",
    ],
    bestPractices: [
      "Allowlist exact origins (scheme + host + port); never reflect arbitrary Origin values with credentials enabled.",
      "Set Max-Age to at least a day and keep Allow-Headers minimal — every extra header is a permanent preflight cost.",
      "Add Vary: Origin on any dynamic origin response so CDNs cannot replay the wrong header.",
    ],
    realWorldUseCases: [
      "SPA at app.example.com calling api.example.com with cookie sessions — the exact credentials + allowlist setup above.",
      "During development the Vite proxy forwards /api to :3000 (same-origin from the browser's view), avoiding CORS entirely until deployment.",
    ],
    resources: [
      docs("MDN — Cross-Origin Resource Sharing (CORS)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS", "The canonical explainer of preflight, headers and credentials.", "en", "15 min"),
      docs("MDN — Access-Control-Allow-Origin", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin", "Exact rules including the * / credentials restriction.", "en", "5 min"),
      docs("cors middleware (GitHub)", "https://github.com/expressjs/cors", "Express integration: options, origin callbacks, preflight handling.", "en", "reference"),
      ytSearch("CORS explained preflight credentials", "Console-error-driven walkthroughs of CORS debugging.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-cors-debug",
        title: "Reproduce and fix",
        prompt:
          "Serve a page from one port and your API from another. Make a fetch with credentials: 'include' and a Authorization header. Capture: the preflight OPTIONS and its response, the real request, and the browser console error when Allow-Origin is *. Then fix the server (allowlist + Allow-Credentials) and paste the final working response headers.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: ["DevTools → Network → the gray OPTIONS row shows exactly which request headers triggered the preflight."],
        solution: `// Broken combination the browser rejects:
//   Access-Control-Allow-Origin: *
//   Access-Control-Allow-Credentials: true

// Fixed:
//   Access-Control-Allow-Origin: http://localhost:5173   (exact origin)
//   Access-Control-Allow-Credentials: true
//   Access-Control-Allow-Headers: Authorization, Content-Type
//   Vary: Origin

const res = await fetch("http://localhost:3000/api/v1/me", {
  credentials: "include",
  headers: { Authorization: "Bearer " + token },
});
// => 200 and the body is readable in JS — CORS satisfied.`,
        solutionLanguage: "js",
      },
      {
        id: "ex-p2m5-cors-preflight-cost",
        title: "Audit preflight traffic",
        prompt:
          "Open your app, load one dashboard page and count how many OPTIONS requests the browser sent. List which headers triggered each preflight. Propose one change (header removal or Max-Age) that reduces preflight count or cost, and predict the latency effect.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Any custom header beyond the simple list forces preflight; Max-Age stops repeats for the cache lifetime."],
      },
    ],
    projectIds: ["p2-blog-api", "p2-task-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-request-size-limits",
    slug: "request-size-limits",
    title: "Request Size Limits",
    description:
      "Body-size limits in Express and Nginx, 413 handling, streaming and presigned-URL upload strategies for large files.",
    order: 16,
    estimatedMinutes: 16,
    tags: ["uploads", "limits", "express", "nginx"],
    prerequisites: ["p1m1-headers", "p2m2-middleware"],
    relatedTopics: ["p2m5-rate-limiting", "p2m5-api-security-basics", "p2m5-error-response-formats"],
    learningObjectives: [
      "Set body-size limits at every layer that touches a request",
      "Explain why Nginx's client_max_body_size bites before your app sees the request",
      "Return clean 413 Payload Too Large errors in your standard envelope",
      "Choose a strategy for uploads larger than any sensible body limit",
    ],
    simpleExplanation:
      "Every hop between client and app has a maximum body size. If Nginx allows 1 MB and Express allows 100 KB, a 500 KB upload dies at Express — while a 2 MB upload dies at Nginx with a generic error page your app never logs. Set explicit, matching limits at each layer, return a friendly `413`, and for anything genuinely large (video, CSV dumps) stop using request bodies altogether — use a streaming or direct-to-storage upload.",
    detailedContent: `
**Where limits live**

| Layer | Knob | Default trap |
| --- | --- | --- |
| Nginx / reverse proxy | \`client_max_body_size\` | **1 MB** — rejects bigger with its own 413 page |
| Express JSON/urlencoded | \`express.json({ limit: "100kb" })\` | body-parser default ~100kb |
| Multer (multipart) | \`limits.fileSize\` | Unbounded if you forget it |
| Cloud LB / API GW | platform-specific quota | Often 10 MB, invisible in your repo |
| Your handler | manual \`Content-Length\` check | Last line of defence |

Align them like nested dolls: gateway ≥ Nginx ≥ app ≥ route-specific (tighter on comments, looser on imports). Every layer that *can* reject early should — buffering a 2 GB body to discover it is too large is how processes die.

**413 Payload Too Large.** Respond with your error envelope:

    { "error": { "code": "PAYLOAD_TOO_LARGE",
                 "message": "Request body exceeds the 100kb limit.",
                 "requestId": "req_91aa" } }

Include the limit so integrators know what to fix. Note that a 413 may arrive *before* headers finish — clients must handle truncated connections too.

**Large uploads need a different path:**

1. **Streaming** — pipe \`req\` to disk/S3 with Multer/multer-s3; memory stays flat regardless of file size.
2. **Presigned URL** — the API returns a short-lived upload URL; the client PUTs the file *directly* to storage. Your Node process never touches the bytes; the only limit is storage's own quota.
    `,
    howItWorks: `
For a JSON body, \`express.json({ limit: "100kb" })\` watches the incoming stream. When \`Content-Length\` exceeds the limit (or the streamed bytes pass it without a declared length), body-parser aborts the parse and calls \`next(err)\` with \`err.type = "entity.too.large"\` and \`err.status = 413\` — your centralised error middleware then formats the response.

For multipart uploads, Multer reads the stream *before* your handler runs: its \`limits.fileSize\` destroys the stream mid-upload when the cap is hit, so the server stops consuming bandwidth immediately rather than after the whole file arrives.

Nginx, sitting in front, enforces its own limit first when the \`Content-Length\` header alone already exceeds \`client_max_body_size\` — it answers with a bare HTML 413 without proxying, which is why app logs show nothing for those requests until you configure \`proxy_intercept_errors\` or match the limits.
    `,
    codeExamples: [
      {
        title: "Aligned limits + clean 413",
        language: "ts",
        code: `app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Tighter per-route limits for rich text vs bulk import
const commentSchema = z.object({ body: z.string().max(5000) });
app.post("/api/v1/comments", validate(commentSchema), createComment);
app.post("/api/v1/bulk-import", express.json({ limit: "5mb" }), bulkImport);

// Turn body-parser's error into your envelope
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the 100kb limit.",
        requestId: req.id,
      },
    });
  }
  next(err);
});`,
        description:
          "One global cap, a deliberate larger cap on the route that needs it, and a 413 that names the limit instead of echoing body-parser's default HTML.",
      },
      {
        title: "Streaming upload and presigned-URL flow",
        language: "ts",
        code: `import multer from "multer";

// Option A — stream to disk, flat memory
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25 MB hard stop
});
app.post("/api/v1/attachments", upload.single("file"), (req, res) => {
  res.status(201).json({
    data: { id: "att_1", filename: req.file.originalname, sizeBytes: req.file.size },
  });
});

// Option B — client uploads straight to storage; your API only mints a ticket
app.post("/api/v1/uploads/presign", authenticate, async (req, res) => {
  const key = \`imports/\${req.user.id}/\${crypto.randomUUID()}.csv\`;
  const url = await s3.getSignedUrl("putObject", {
    Bucket: "nodepath-uploads", Key: key, Expires: 300,
    ContentType: "text/csv",
  });
  res.status(201).json({ data: { uploadUrl: url, key, expiresIn: 300 } });
});`,
        description:
          "Presigned URLs move multi-hundred-MB files out of your Node process entirely — your API only authorises and records the upload.",
      },
    ],
    commonMistakes: [
      "Setting limit only in Express while Nginx's default 1 MB silently 413s bigger requests with an HTML error page.",
      "Raising global limits to 100 MB so one import route works — now any endpoint can be used to exhaust memory.",
      "Buffering uploads with `await req.text()`-style helpers before checking size.",
    ],
    bestPractices: [
      "State the limit in docs and in the 413 message; integrators should never have to discover it by trial.",
      "Prefer presigned URLs for anything over a few MB; keep request bodies for small JSON only.",
      "Log every 413 with the attempted size and route — spikes reveal client bugs and abuse early.",
    ],
    realWorldUseCases: [
      "Avatar uploads capped at 2 MB through Multer with a friendly 413; bulk CSV imports go through presigned URLs.",
      "An Nginx-fronted blog (p2-blog-api): client_max_body_size 1m matches express.json limit '1mb', so error pages stay in your JSON envelope.",
    ],
    resources: [
      docs("Multer (GitHub)", OFFICIAL.multerDocs, "Multipart parsing with fileSize limits and streaming storage.", "en", "reference"),
      docs("Nginx — client_max_body_size", "https://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size", "The proxy-side limit that bites before your app runs.", "en", "5 min"),
      docs("Express — express.json() options", OFFICIAL.expressApi, "body-parser limit option and error types such as entity.too.large.", "en", "reference"),
      ytSearch("express file upload limits multer 413", "Upload-limit walkthroughs with Multer and proxies.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-limits-map",
        title: "Map your layers",
        prompt:
          "List every layer a 2 MB upload crosses in your project (client, LB, Nginx, Express, Multer, DB row). For each, write the configured limit or 'unbounded'. Then set coherent limits (e.g. 10 MB edge / 5 MB app / 2 MB route) and prove a 6 MB request fails at the edge while a 3 MB request fails at the app with your JSON 413.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: ["Check Nginx config or the platform dashboard; 'unbounded' is the most common finding."],
      },
      {
        id: "ex-p2m5-limits-413",
        title: "Handle 413 like a pro",
        prompt:
          "Write the exact 413 JSON body your API returns (with requestId), then write the client-side handling: how fetch detects a non-JSON 413 from Nginx vs your JSON 413, and what message a user should see in each case.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["res.headers.get('content-type') tells you whether the body is JSON or Nginx HTML."],
      },
    ],
    projectIds: ["p2-blog-api", "p2-chat-backend", "p2-ecommerce-api"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-logging-monitoring",
    slug: "logging-and-monitoring",
    title: "Logging and Monitoring",
    description:
      "Structured request logs, correlation ids, latency and error-rate metrics, and the dashboards every API team watches.",
    order: 17,
    estimatedMinutes: 20,
    tags: ["logging", "monitoring", "observability", "metrics"],
    prerequisites: ["p2m2-middleware", "p2m5-error-response-formats"],
    relatedTopics: ["p2m5-consistent-responses", "p2m5-rate-limiting", "p2m5-api-security-basics"],
    learningObjectives: [
      "Emit one structured JSON log line per request with consistent fields",
      "Propagate correlation ids from client to logs to responses",
      "Define the golden signals: latency, traffic, errors and saturation",
      "Build a dashboard that answers 'is the API healthy?' in seconds",
    ],
    simpleExplanation:
      "When production misbehaves, logs and metrics are your only witnesses. **Structured logs** (one JSON line per request with method, path, status, duration and a request id) let you search and aggregate; **correlation ids** stitch one user's request through your app, the database and background jobs; **metrics** (latency percentiles, error rate, traffic) feed dashboards and alarms so you learn about problems before the support inbox does.",
    detailedContent: `
**Structured request logs.** Not \`console.log("got request")\` — a machine-parsable object:

    {"level":"info","time":"2026-10-14T09:30:11.482Z","requestId":"req_8f3a21",
     "method":"GET","path":"/api/v1/tasks","status":200,"durationMs":34,
     "userId":"u_7","tenantId":"t_2","userAgent":"Mozilla/5.0"}

Fields worth always including: timestamp, level, requestId, method, path (route template — \`/tasks/:id\`, not the raw URL with ids, or cardinality explodes), status, duration, user/tenant when known. Libraries (pino, winston) emit JSON by default in production; \`console.log\` of objects is fine in dev only.

**Correlation ids.** Accept \`x-request-id\` from the client or generate one; put it on the response, in every log line, and pass it to queues and outbound HTTP calls. A support ticket quoting the id becomes a single grep.

**Metrics — the RED method** (per endpoint):

- **Rate** — requests/second (traffic).
- **Errors** — 5xx ratio and 4xx ratio.
- **Duration** — latency histogram; watch **p50/p95/p99**, never averages (one slow tail hides in an average).

Add saturation: event-loop lag, CPU, memory, DB pool usage. Export in Prometheus format and chart in Grafana; OpenTelemetry traces go deeper when one request spans services.

**Dashboards you actually watch:** a home view with RPS, 5xx rate, p95 latency and saturation; an endpoint table ranked by p95 × traffic; an alert when 5xx rate crosses ~1–2% for 5 minutes or p95 doubles.
    `,
    howItWorks: `
A logging middleware runs first and last for every request:

1. On entry: read or mint \`req.id\` (correlation id).
2. \`const start = process.hrtime.bigint()\` — high-resolution clock.
3. Handlers run; pino child loggers inherit \`{ requestId }\` so application logs auto-attach.
4. When the response finishes (\`res.on("finish")\`), compute duration, increment metrics (\`http_requests_total{route, status}\`, \`http_duration_seconds\` histogram), and write **one** info line with the full field set. Errors log at \`error\` level with the stack, keyed by the same requestId.

Because metrics increment on \`finish\`, a request that crashes the handler mid-flight still counts — and event-loop lag is sampled on a timer independent of traffic, so idle-but-blocked processes are visible too.
    `,
    codeExamples: [
      {
        title: "Request logging + metrics middleware",
        language: "ts",
        code: `import { pino } from "pino";
import { Counter, Histogram, register } from "prom-client";

export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const requests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["route", "method", "status"],
});
const duration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Request latency",
  labelNames: ["route", "method"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export function requestLogger(req, res, next) {
  req.id = req.header("x-request-id") ?? crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  res.set("x-request-id", req.id);
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path ?? req.path.split("/").length > 3 ? "…many-segments" : req.path;
    requests.labels(route, req.method, String(res.statusCode)).inc();
    duration.labels(route, req.method).observe(seconds);
    req.log.info({
      method: req.method, route, status: res.statusCode,
      durationMs: Math.round(seconds * 1000), userId: req.user?.id,
    });
  });
  next();
}

// Scrape endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});`,
        description:
          "One line per request, one increment per metric, one route template label — the minimum viable observability stack for an Express API.",
      },
      {
        title: "What a dashboard panel queries",
        language: "text",
        code: `# Prometheus queries behind typical Grafana panels

# Traffic (RED – rate)
sum(rate(http_requests_total[5m])) by (route)

# Error rate: 5xx / total over 5 minutes
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# p95 latency per route (RED – duration)
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

# Alert sketch: page when 5xx rate > 2% for 5m
(
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))
) > 0.02`,
        description:
          "The four panels that answer 'is it healthy?': traffic, error ratio, p95 latency, saturation — plus the alert that wakes a human only when it matters.",
      },
    ],
    commonMistakes: [
      "Logging the raw URL (with ids and query secrets) as the metric label — cardinality explodes and Prometheus dies.",
      "Averaging latency: p95 can be 8 s while the average looks like 120 ms; users feel the tail.",
      "Logging stack traces to the client and PII (tokens, passwords) into logs that thousands of people can read.",
    ],
    bestPractices: [
      "One JSON log line per request in production; sample debug noise aggressively.",
      "Propagate x-request-id everywhere — outbound calls, queue jobs, third-party webhooks.",
      "Alert on symptoms users feel (5xx rate, p95), not on causes (CPU) alone.",
    ],
    realWorldUseCases: [
      "An incident at 02:00: the dashboard shows p95 on /orders spiking; the requestId from a user report greps straight to the slow SQL.",
      "A chat backend (p2-chat-backend) logs message-send latency percentiles to catch WebSocket fan-out regressions before users complain.",
    ],
    resources: [
      docs("pino — Node.js logger", "https://getpino.io/", "Fast structured JSON logging with child loggers per request.", "en", "reference"),
      docs("Prometheus — metric types", "https://prometheus.io/docs/practices/histograms/", "Counters, histograms and why percentiles beat averages.", "en", "12 min"),
      docs("12factor.net — Logs", OFFICIAL.twelveFactor, "Treat logs as event streams; ship them to aggregators.", "en", "5 min"),
      ytSearch("nodejs structured logging request id tutorial", "Build-alongs wiring pino and request correlation.", "en", "12–22 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-log-line",
        title: "Log one line to rule them all",
        prompt:
          "Add request logging to your API so every request emits exactly one structured JSON line containing at least: requestId, method, route template, status, durationMs, userId (nullable). Send ten mixed requests and paste five lines. Then deliberately remove the requestId and explain what debugging becomes impossible.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: ["req.route.path gives the template (/tasks/:id) only after the route matched."],
      },
      {
        id: "ex-p2m5-metrics-plan",
        title: "Design the dashboard",
        prompt:
          "List the panels for a new API dashboard using RED: for each panel write the metric name, the PromQL-style query in words, and the alert threshold you would set. Include one panel that would have caught your most recent production-ish bug.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Watch p95 per route, not global average latency."],
      },
    ],
    projectIds: ["p2-task-api", "p2-chat-backend"],
    quizId: "quiz-p2-m5",
  },
  {
    ...shared,
    id: "p2m5-consistent-responses",
    slug: "consistent-responses",
    title: "Consistent Responses Across the API",
    description:
      "One envelope to rule them all: success, pagination and error shapes, documenting them, and a review checklist before shipping an endpoint.",
    order: 18,
    estimatedMinutes: 17,
    tags: ["consistency", "envelope", "api-design", "review"],
    prerequisites: ["p2m5-response-design", "p2m5-error-response-formats", "p2m5-pagination"],
    relatedTopics: ["p2m5-openapi-swagger", "p2m5-testing-endpoints", "p2m5-rest-principles"],
    learningObjectives: [
      "Unify success, list and error bodies under one documented envelope",
      "Reuse shared components (Error, PageMeta) so every endpoint stays aligned",
      "Publish the conventions where clients will find them",
      "Run a consistency review checklist before an endpoint ships",
    ],
    simpleExplanation:
      "Consistency is what makes an API feel professional: the same keys, the same casing, the same date format and the same error shape on *every* endpoint. Pick the envelope once (`data` / `meta` / `links`, errors under `error`), implement it with shared helpers, document it in your OpenAPI components — and then every new endpoint inherits the whole contract instead of inventing a slightly different one.",
    detailedContent: `
**The three shapes.** Freeze these and reuse them everywhere:

    // 1) Success — item or collection
    { "data": <object | array>, "meta"?: {...}, "links"?: {...} }

    // 2) Error
    { "error": { "code": "...", "message": "...", "details"?: [...], "requestId": "..." } }

    // 3) Empty success
    204 No Content  (DELETE) — no body at all, or { } if your client needs one

**Enforcement, not hope.** Three layers keep drift out:

1. **Helpers** — \`ok(res, data)\`, \`created(res, data, location)\`, \`list(res, items, page)\` are the only ways responses leave your handlers.
2. **Components** — the OpenAPI spec defines \`Error\`, \`PageMeta\` and each resource schema once; every endpoint $refs them.
3. **Contract tests** — one test per shape (item, list, empty, each error class) that asserts exact key sets, camelCase and ISO dates.

**Document the conventions, not only endpoints.** A short "API conventions" page (in \`info.description\` of the spec or the first page of your docs) covering envelope, naming, dates, money, pagination, errors and versioning saves every integrator an hour and you a dozen issues.

**The pre-ship review checklist:**

- [ ] Method and status codes match the method/status matrix (201+Location on create, 204 on delete).
- [ ] Path follows plural kebab-case; nesting ≤ 1 level.
- [ ] Query params validated against a whitelist; page size capped.
- [ ] Success uses data/meta/links; errors use code/message/details/requestId.
- [ ] camelCase fields; ISO 8601 dates; no internal columns (DTO).
- [ ] AuthN + AuthZ (role *and* object level) tested with a second account.
- [ ] Rate limit and body-size caps apply; 413/429 shapes are standard.
- [ ] Spec, collection and contract tests updated in the same PR.
    `,
    howItWorks: `
Consistency is a pipeline, not a personality trait. A handler returns \`created(res, dto, location)\`; that helper sets status 201, the \`Location\` header and wraps the DTO in \`{ data }\`. The same DTO mapper feeds the OpenAPI schema generator, so the documented shape and the wire shape come from one source. Contract tests fetch the live spec and validate real responses against it — a renamed field fails CI. Because errors also funnel through one middleware, adding a new error code is a catalogue change, not a cross-endpoint hunt. The result: a client that writes its parse function once, on day one, and never touches it again.
    `,
    codeExamples: [
      {
        title: "The envelope helpers every handler uses",
        language: "ts",
        code: `export const ok = (res, data, meta?, links?) =>
  res.status(200).json({ data, ...(meta && { meta }), ...(links && { links }) });

export const created = (res, data, location) => {
  res.location(location);
  return res.status(201).json({ data });
};

export const list = (res, items, { total, limit, nextCursor = null }) =>
  res.status(200).json({
    data: items,
    meta: { total: total ?? undefined, limit, nextCursor },
    links: {
      self: res.req.originalUrl,
      next: nextCursor ? res.req.originalUrl + "&cursor=" + nextCursor : null,
    },
  });

export const fail = (res, status, code, message, details?) =>
  res.status(status).json({
    error: { code, message, ...(details && { details }), requestId: res.req.id },
  });

// Handlers shrink to business logic:
app.get("/api/v1/tasks/:id", ah(async (req, res) => {
  const task = await tasks.findOwned(req.params.id, req.user.tenantId);
  if (!task) return fail(res, 404, "TASK_NOT_FOUND", "No task with that id.");
  return ok(res, toTaskDto(task));
}));

app.post("/api/v1/tasks", validate(createTaskSchema), ah(async (req, res) => {
  const task = await tasks.create({ ...req.body, tenantId: req.user.tenantId });
  return created(res, toTaskDto(task), "/api/v1/tasks/" + task.id);
}));

app.delete("/api/v1/tasks/:id", ah(async (req, res) => {
  await tasks.removeOwned(req.params.id, req.user.tenantId);
  return res.status(204).end();
}));`,
        description:
          "Four helpers, zero ad-hoc res.json calls: every response automatically satisfies the envelope, headers and error contract.",
      },
      {
        title: "Conventions page (paste into your docs)",
        language: "markdown",
        code: `# NodePath API conventions

- Base URL: https://api.example.com/api/v1
- Naming: plural lowercase kebab-case nouns; at most one nesting level.
- Success: 200/201 with { data, meta?, links? }. Deletes return 204.
- Errors: 4xx/5xx with
  { error: { code, message, details?, requestId } }.
  Branch on \`code\`, never on \`message\`.
- Field names: camelCase. Dates: ISO 8601 UTC strings.
- Money: integer minor units + currency code.
- Pagination: ?limit= (max 100) + ?cursor= or ?page=.
  Collections always return data: [] (never null) when empty.
- Auth: Authorization: Bearer <jwt>. 401 = missing/invalid, 403 = denied.
- Rate limits: 100 req/min/user; 429 includes Retry-After.
- Deprecations: Deprecation + Sunset headers, 90-day overlap.`,
        description:
          "Publish it in the spec description and the repo README; consistency fails when the rules live only in someone's head.",
      },
    ],
    commonMistakes: [
      "Every new endpoint inventing a slightly different error key ({error}, {errors}, {message}) until clients maintain a parser per route.",
      "Documenting envelopes in prose but not encoding them as OpenAPI components, so the docs drift within a sprint.",
      "Reviewing endpoints feature-by-feature and never asking 'does this match the other 40?'.",
    ],
    bestPractices: [
      "Make raw res.json illegal in handlers via lint rule or code review — force responses through helpers.",
      "Keep a living conventions doc next to the spec and link it from every pull request template.",
      "Run one 'consistency sweep' per release: sample 5 random endpoints and verify the checklist end-to-end.",
    ],
    realWorldUseCases: [
      "Stripe's uniform envelopes and typed errors are why SDKs in ten languages generate from one spec without per-endpoint patches.",
      "A platform with task, blog and inventory APIs (p2-task-api, p2-blog-api, p2-inventory-api) shares one helper package, so all three feel like one product.",
    ],
    resources: [
      docs("JSON:API — document structure", "https://jsonapi.org/format/#document-structure", "A ready-made specification for consistent envelopes if you do not want to invent one.", "en", "reference"),
      docs("OpenAPI Specification — components", OFFICIAL.openapiSpec, "Reusable schemas, responses and parameters — the enforcement point for consistency.", "en", "reference"),
      docs("Google Cloud — API design guide", "https://cloud.google.com/apis/design", "Cross-cutting conventions: errors, pagination, partial responses.", "en", "reference"),
      ytSearch("REST API consistency envelope design", "Reviews of real APIs' response-shape consistency.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p2m5-consistency-sweep",
        title: "Sweep your API",
        prompt:
          "Pick five endpoints at random from your project. For each record: success shape, error shape, field casing, date format, pagination style and status codes used. Write a table of deviations, rank them by client impact, and fix the top three by routing them through shared helpers. Paste one before/after response.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: ["Look for one endpoint still returning bare objects with no data envelope."],
        solution: `BEFORE (task endpoint):
  200 → { "id": "t_1", "title": "...", "created_at": "2026-10-14 09:30:00" }
  404 → { "message": "not found" }

AFTER (same endpoint, routed through helpers + DTO):
  200 → { "data": { "id": "t_1", "title": "...",
                    "createdAt": "2026-10-14T09:30:00.000Z" } }
  404 → { "error": { "code": "TASK_NOT_FOUND",
                     "message": "No task with that id.",
                     "requestId": "req_5b12" } }

Checklist items fixed: envelope, camelCase, ISO date, error code+requestId.`,
        solutionLanguage: "json",
      },
      {
        id: "ex-p2m5-consistency-review",
        title: "Write the PR checklist",
        prompt:
          "Turn this lesson's review checklist into a GitHub pull-request template (markdown checkboxes) tailored to your codebase, with links to the conventions doc and the OpenAPI file. Then run it on the last endpoint you merged and note anything it would have caught.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Include 'spec and collection updated' — docs drift usually starts in the PR that forgets them."],
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api", "p2-blog-api"],
    quizId: "quiz-p2-m5",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m5",
  moduleId: "p2-m5",
  title: "Module 5 quiz — REST API development",
  description:
    "Test your design skills: resource naming, method/status pairs, response and error formats, pagination, idempotency, rate limiting, CORS and consistency.",
  questions: [
    {
      id: "q-p2m5-1",
      type: "multiple-choice",
      prompt:
        "Which URL best follows REST naming conventions for listing the comments of post 42?",
      options: [
        "GET /getPostComments?postId=42",
        "GET /posts/42/comments",
        "GET /comments/listForPost/42",
        "POST /posts/42/comments/list",
      ],
      correctIndex: 1,
      explanation:
        "Comments are a sub-resource of a post: plural noun, one level of nesting, GET for reading. Verbs in the path (getPostComments, list) and using POST to read both violate the uniform interface and break caches.",
      optionExplanations: [
        "Verbs in the path plus a query param naming the parent — RPC style, not resource-oriented.",
        "Correct — plural nouns, one nesting level, the method supplies the verb.",
        "'listForPost' embeds an action segment; the comment should just live under the post.",
        "POST creates; a read must be GET (POST would also trigger a CORS preflight and never be cacheable).",
      ],
    },
    {
      id: "q-p2m5-2",
      type: "code-output",
      prompt: "A client POSTs {\"title\":\"Write tests\"} to this route. What does it receive?",
      code: `app.post("/api/v1/tasks", (req, res) => {
  const task = { id: "t_1", title: req.body.title, status: "open" };
  res.location("/api/v1/tasks/t_1");
  res.status(201).json({ data: task });
});`,
      language: "ts",
      options: [
        "200 OK with the created task and no Location header",
        "204 No Content with a Location header",
        "201 Created with a Location: /api/v1/tasks/t_1 header and a JSON body containing data.id = \"t_1\"",
        "201 Created with an empty body and no Location header",
      ],
      correctIndex: 2,
      explanation:
        "A successful POST answers 201 Created, sets Location to the new resource's URL, and normally includes the created representation (here wrapped in the standard data envelope). 200 lacks the 'created' signal; 204 wastes the chance to return the resource; an empty 201 leaves clients without the new id in the body.",
      optionExplanations: [
        "200 does not signal creation, and this handler explicitly sets Location and 201.",
        "204 means 'success, no body' — wrong for a creation that has a representation to return.",
        "Correct — status 201, Location header, and the JSON body with the created task under data.",
        "The handler sends both the header and the body; Location is set before res.json runs.",
      ],
    },
    {
      id: "q-p2m5-3",
      type: "find-bug",
      prompt: "A React app with credentials: \"include\" always fails on this endpoint, though curl works. What is wrong?",
      code: `app.get("/api/v1/me", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Credentials", "true");
  res.json({ data: req.user });
});`,
      language: "ts",
      options: [
        "Nothing is wrong — curl proves the endpoint works",
        "Access-Control-Allow-Origin cannot be '*' when credentials are allowed; the server must echo the specific request Origin (from an allowlist)",
        "The endpoint must use POST before CORS headers apply",
        "CORS requires the Access-Control-Allow-Methods header on every response",
      ],
      correctIndex: 1,
      explanation:
        "The fetch spec forbids combining Allow-Origin: * with Allow-Credentials: true — the browser blocks reading the response. curl never enforces CORS, which is exactly why 'it works in curl' proves nothing about the browser path. Fix: echo the allowed Origin (e.g. https://app.example.com) and keep Allow-Credentials: true.",
      optionExplanations: [
        "curl is not subject to CORS — it cannot validate browser behaviour.",
        "Correct — wildcard origin + credentials is an illegal combination; echo the exact origin instead.",
        "Method has no bearing on which origin may read a response; GET is fine.",
        "Allow-Methods only matters in preflight responses for non-simple requests.",
      ],
    },
    {
      id: "q-p2m5-4",
      type: "multiple-choice",
      prompt:
        "A client sends PUT /api/v1/tasks (the collection path) to an API that implements GET, POST, PATCH and DELETE there. What is the best response?",
      options: [
        "404 Not Found with a JSON error body",
        "200 OK echoing the task list",
        "405 Method Not Allowed with an Allow header listing GET, POST and the item-path methods",
        "400 Bad Request because PUT needs a body",
      ],
      correctIndex: 2,
      explanation:
        "The path exists but not for PUT — that is precisely 405 Method Not Allowed, and the spec requires an Allow header listing the supported methods. 404 would claim the path is unknown; 200 would invent behaviour; 400 blames the body when the verb itself is the problem.",
      optionExplanations: [
        "404 is for unknown paths; this path clearly exists (GET/POST work on it).",
        "Silently accepting an unsupported method makes the API unpredictable and hides bugs.",
        "Correct — 405 + Allow tells the client exactly which verbs this resource supports.",
        "The rejection is about the method, not the payload; a body-less PUT still gets 405.",
      ],
    },
    {
      id: "q-p2m5-5",
      type: "short-answer",
      prompt:
        "A rate limiter rejects a request with 429 Too Many Requests. Which HTTP response header must it include to tell the client how long to wait before retrying? Answer with the header name only.",
      acceptedKeywords: ["retry-after", "retry after"],
      explanation:
        "Retry-After (seconds or an HTTP-date) tells clients and retry libraries when it is safe to try again. X-RateLimit-* headers describe the budget, but Retry-After is the one that answers 'when can I retry?'.",
    },
    {
      id: "q-p2m5-6",
      type: "code-output",
      prompt:
        "Which error body follows this module's agreed format (stable code, human message, field-level details, requestId)?",
      options: [
        "\"Error: validation failed — please fix your input\"",
        "{\"error\":{\"code\":\"VALIDATION_FAILED\",\"message\":\"2 fields are invalid.\",\"details\":[{\"field\":\"email\",\"code\":\"invalid_format\",\"message\":\"Must be a valid email\"}],\"requestId\":\"req_8f3a21\"}}",
        "{\"status\":422,\"stack\":\"TypeError: invalid email\\n    at validate (schema.js:12:9)\"}",
        "{\"errors\":{\"email\":[\"invalid\"]}}",
      ],
      correctIndex: 1,
      explanation:
        "The agreed error object carries a machine-readable code, a human message, optional field-level details, and a requestId correlating to the logs. Plain text gives clients nothing to branch on; a stack trace leaks internals; a bare errors map omits the code and requestId the contract requires.",
      optionExplanations: [
        "No structure: clients cannot branch on code or map fields, and there is no requestId.",
        "Correct — code + message + details[] + requestId, in the standard envelope.",
        "Stack traces must never leave the server; log them under the requestId instead.",
        "Missing code, message and requestId; close to a validation payload but not the agreed contract.",
      ],
    },
    {
      id: "q-p2m5-7",
      type: "multiple-choice",
      prompt:
        "Why is cursor (keyset) pagination usually preferred over offset pagination for a large, frequently changing feed?",
      options: [
        "Cursor pagination returns an exact total count for free",
        "It needs no index on the sort columns",
        "It stays correct and fast when rows are inserted or deleted, because the cursor addresses a stable sort position instead of a numeric offset",
        "It always returns exactly one page of results regardless of the limit parameter",
      ],
      correctIndex: 2,
      explanation:
        "OFFSET n makes the database scan and discard n rows, so deep pages slow down, and concurrent inserts shift rows between requests (duplicates/gaps). A cursor encodes the last row's (sort, id) position and seeks with an index — constant cost and no drift. Totals are *not* free with cursors (usually omitted or optional), and a proper index on the sort key is still required.",
      optionExplanations: [
        "The opposite: counting totals is an extra cost cursors usually avoid or make optional.",
        "Keyset queries are index-backed — without an index on the sort columns they do not get their performance benefit.",
        "Correct — stable addressing plus index seeks make cursors fast and immune to row drift.",
        "Page size is still a parameter (with a server-side max); nothing about cursors fixes the size.",
      ],
    },
    {
      id: "q-p2m5-8",
      type: "find-bug",
      prompt:
        "Clients occasionally report being charged twice after network timeouts. What is the core defect here?",
      code: `app.post("/api/v1/charges", authenticate, async (req, res) => {
  const charge = await payments.create({
    amountCents: req.body.amountCents,
    currency: "usd",
    userId: req.user.id,
  });
  res.status(201).json({ data: charge });
});`,
      language: "ts",
      options: [
        "res.status(201) should be 200 for payment creation",
        "The POST is not idempotent: a timed-out retry runs payments.create again because there is no Idempotency-Key (or client-chosen id) to make replays return the stored first response",
        "The currency must be passed as \"USD\" in uppercase",
        "authenticate should run after the handler so the charge is not delayed",
      ],
      correctIndex: 1,
      explanation:
        "POST creates new state on every call, so a client that cannot tell whether the first request succeeded must not blindly retry. An Idempotency-Key header (claimed atomically, first response stored with a TTL) makes every replay return the original 201 body instead of charging again. Status code, currency casing and middleware order are not the root cause.",
      optionExplanations: [
        "201 Created is correct for a new charge resource.",
        "Correct — no idempotency protection means every retry can double-charge; add Idempotency-Key handling.",
        "Currency casing is cosmetic; Stripe accepts either.",
        "Moving authenticate would weaken security, not fix retries.",
      ],
    },
  ],
};
