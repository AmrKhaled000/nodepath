import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m2",
  slug: "advanced-api-design",
  title: "Advanced API Design",
  description:
    "Design APIs that outgrow plain CRUD: advanced REST patterns (HATEOAS lite, bulk, sub-resources, partial responses), GraphQL schemas, resolvers, authorization and DataLoader, API gateways, WebSockets, SSE, webhooks, idempotency keys, rate limiting strategies, distributed design, backward compatibility, deprecation and OpenAPI 3.1.",
  phaseId: "phase-3",
  order: 2,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m2",
  difficulty: "advanced",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m2-advanced-rest-design",
    slug: "advanced-rest-design",
    title: "Advanced REST Design: HATEOAS Lite, Bulk, Sub-resources and Partial Responses",
    description:
      "Four patterns that mature a CRUD API: lightweight hypermedia links, batch operations, sub-resource modelling and sparse fieldsets with a fields query parameter.",
    order: 1,
    estimatedMinutes: 22,
    tags: ["rest", "api-design", "hateoas", "bulk-operations"],
    prerequisites: [
      "p2m5-rest-principles",
      "p2m5-resource-naming",
      "p2m5-pagination",
      "p2m5-openapi-swagger",
    ],
    relatedTopics: [
      "p3m2-openapi-advanced",
      "p3m2-backward-compatibility",
      "p3m2-idempotent-operations",
      "p3m2-graphql-fundamentals",
    ],
    learningObjectives: [
      "Add HATEOAS-lite links to responses without over-engineering the API",
      "Model child collections as sub-resources with correct ownership scoping",
      "Design bulk endpoints that report per-item success and failure",
      "Implement a fields query parameter that returns a projection of a resource",
    ],
    simpleExplanation:
      "Your Phase 2 API probably returns whole objects from fixed URLs. Advanced REST adds four small moves: responses can carry links to related resources and actions (lite HATEOAS), one request can touch many items (bulk), nested things live under their owner (sub-resources), and clients can ask for only the columns they need with a fields query parameter. None of these change the style of your API — they just make it cheaper, faster and more self-descriptive.",
    detailedContent: `
Phase 2 gave you resource-oriented CRUD. Four patterns take that API the next step.

**Partial responses.** A product document with 40 attributes is wasteful when a list view needs three. Add a \`fields\` query parameter:

    GET /api/v1/products/84?fields=id,name,price

The server projects the representation before serialising it. This cuts bandwidth *and* often database load (ask SQL for only those columns: \`SELECT id, name, price FROM products\`). Define dot syntax for nesting (\`fields=id,name,address.city\`), decide whether unknown fields are silently ignored or rejected with 400, and document the choice in OpenAPI. Remember that HTTP caches key on the full URL, so every distinct \`fields\` value is its own cache entry.

**Sub-resources.** Child collections live under their parent: \`GET /orders/o_9/items\`, then \`GET /orders/o_9/items/i_2\`. The parent id scopes every query (\`WHERE order_id = $1\`), which prevents both accidental cross-tenant reads and runaway nesting. Cap depth at one or two levels — deeper trees usually mean you modelled the wrong resource.

**Bulk operations.** A single \`POST /orders/bulk\` accepting up to 100 operations saves a mobile client on a flaky connection from 100 round-trips. Return per-item results keyed by \`index\` so partial failure is reportable: successful items carry their own 201, failed ones their own 4xx. Decide explicitly between per-item execution (the default) and all-or-nothing inside a database transaction.

**HATEOAS lite.** Full hypermedia constraints are rarely worth it, but a \`links\` object in each response — self, relations, and action links that include their HTTP method — lets clients navigate without hardcoded URL grammar and makes your API self-documenting.
    `,
    howItWorks: `
A request for \`GET /api/v1/orders/o_9?fields=id,status&include=items\` travels like this:

1. Routing resolves the resource: sub-resource routes are registered under the parent path (\`/orders/:orderId/items\`), so Express applies the same auth middleware to children as to parents.
2. Authentication runs once; the handler loads the order **scoped to the caller** (\`_id = o_9 AND tenant_id = ?\`).
3. \`include=items\` triggers one extra query for the children; the handler composes the aggregate in memory.
4. The projection step drops every attribute outside \`fields\` before JSON serialisation.
5. A \`links\` object is attached and the response leaves with \`Cache-Control: private\`, because the representation is caller-specific.

Nothing about this changes the resource model — the query string only narrows the representation.
    `,
    codeExamples: [
      {
        title: "Partial response with a links object",
        language: "ts",
        code: `const ORDER_FIELDS = ["id", "status", "total", "currency", "customerId", "createdAt"];

app.get("/api/v1/orders/:orderId", requireUser, async (req, res) => {
  const order = await orders.find(req.params.orderId, req.user.tenantId);
  if (!order) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "No such order." } });
  }

  const requested = String(req.query.fields ?? ORDER_FIELDS.join(","))
    .split(",")
    .map((f) => f.trim())
    .filter((f) => ORDER_FIELDS.includes(f)); // unknown fields are ignored, not fatal

  const data = Object.fromEntries(requested.map((f) => [f, order[f]]));

  res.json({
    data,
    links: {
      self: "/api/v1/orders/" + order.id,
      items: "/api/v1/orders/" + order.id + "/items",
      customer: "/api/v1/customers/" + order.customerId,
      cancel: { method: "POST", href: "/api/v1/orders/" + order.id + "/cancel" },
    },
  });
});`,
        description:
          "Two patterns in one handler: the projection only serialises requested keys, and the links object tells the client the canonical URL, related resources and how to perform the next action. Pick either ignore-or-400 for unknown fields and document it.",
      },
      {
        title: "Bulk endpoint with per-item results",
        language: "ts",
        code: `// body: { "operations": [ { "op": "create", "data": { ... } }, { "op": "cancel", "id": "o_9" } ] }
app.post("/api/v1/orders/bulk", requireUser, async (req, res) => {
  const operations = Array.isArray(req.body.operations) ? req.body.operations : [];
  if (operations.length < 1 || operations.length > 100) {
    return res.status(400).json({
      error: { code: "BULK_SIZE_INVALID", message: "Send between 1 and 100 operations." },
    });
  }

  const results = await Promise.all(
    operations.map(async (op, index) => {
      try {
        if (op.op === "create") {
          const order = await orders.create({ ...op.data, tenantId: req.user.tenantId });
          return { index, status: 201, id: order.id };
        }
        if (op.op === "cancel") {
          await orders.cancel(op.id, req.user.tenantId);
          return { index, status: 200, id: op.id };
        }
        return { index, status: 400, code: "UNKNOWN_OP" };
      } catch (err) {
        return { index, status: err.statusCode ?? 422, code: err.code ?? "VALIDATION_FAILED" };
      }
    }),
  );

  const failed = results.filter((r) => r.status >= 400).length;
  res.status(failed === 0 ? 201 : 207).json({
    data: results,
    summary: { total: results.length, failed },
  });
});`,
        description:
          "Each result carries its own index and status, so the client can retry only the failures. 207 Multi-Status signals partial success; many teams instead always return 200 with the summary — either way, be consistent and document it.",
      },
    ],
    commonMistakes: [
      "Nesting resources more than two levels deep (/users/:id/orders/:id/items/:id/comments) — ownership and caching both become unmanageable.",
      "Building bulk endpoints that stop at the first error, leaving the client unable to tell which items succeeded.",
      "Documenting fields in prose but not in OpenAPI, so generated clients silently return objects missing keys they expect.",
      "Adding a links object only to some endpoints, which teaches clients that they cannot trust it.",
    ],
    bestPractices: [
      "Apply the same authentication, tenant scoping and rate limits to sub-resource routes as to their parent.",
      "Cap bulk request size explicitly (100 operations is a common limit) and enforce the same body limit you use elsewhere.",
      "Define one projection helper and reuse it across list and detail routes so fields behave identically everywhere.",
      "Ship links with stable rel names (self, items, customer, cancel) and version them like any other contract.",
    ],
    realWorldUseCases: [
      "Stripe returns a compact object per list item and full detail on the item route — list views call with sparse fields to keep payloads small.",
      "GitHub's REST API includes an extensive links object in every paginated response so clients never hardcode pagination URLs.",
      "A mobile checkout on a poor network sends one bulk order submission instead of 40 individual requests that could each be lost.",
    ],
    resources: [
      docs(
        "Zalando — RESTful API guidelines",
        "https://opensource.zalando.com/restful-api-guidelines/",
        "Opinionated production rulebook covering hypermedia, sub-resources and partial responses.",
        "en",
        "reference",
      ),
      docs(
        "RFC 8288 — Web Linking",
        "https://www.rfc-editor.org/rfc/rfc8288",
        "The link-relation standard behind the links and rel names used by HATEOAS-style responses.",
        "en",
        "reference",
      ),
      docs(
        "Google Cloud — API Design Guide",
        "https://cloud.google.com/apis/design",
        "Google's public design guide: collections, partial responses and standard query parameters.",
        "en",
        "reference",
      ),
      ytSearch(
        "REST API design HATEOAS partial responses bulk operations",
        "Walkthroughs of hypermedia links, sparse fieldsets and batch endpoints.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-fields-links",
        title: "Add sparse fieldsets and links to your API",
        prompt:
          "Take any collection route you built in Phase 2 and add a fields query parameter plus a links object. Requirements: unknown fields are ignored, nested fields use dot syntax, the OpenAPI document documents the parameter, and a curl command proves the payload shrinks. Paste the before/after JSON.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Split on commas, trim, then pick keys with Object.fromEntries — projection is a serialisation concern, not a query concern.",
          "Compare content length with curl -w '%{size_download}'.",
        ],
        solution: `app.get("/api/v1/products/:id", async (req, res) => {
  const product = await products.find(req.params.id);
  if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Gone." } });

  const data = pick(product, String(req.query.fields ?? "").split(","));

  res.json({
    data,
    links: {
      self: "/api/v1/products/" + product.id,
      reviews: "/api/v1/products/" + product.id + "/reviews",
      buy: { method: "POST", href: "/api/v1/orders/bulk" },
    },
  });
});

function pick(source, paths) {
  if (paths.length === 0 || paths[0] === "") return source;
  return Object.fromEntries(paths.map((p) => [p, p.split(".").reduce((o, k) => o?.[k], source)]));
}

// curl "http://localhost:3000/api/v1/products/84?fields=id,name,price"`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-bulk",
        title: "Design a bulk API contract",
        prompt:
          "Write the request and response contract for POST /api/v1/invoices/bulk that creates, voids and updates invoices. Decide and justify: maximum operations, what happens when item 3 of 10 fails, which status code the endpoint returns, and how a client correlates results with its input.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Per-item results need an index that mirrors the input array position.",
          "Decide between partial success (per-item statuses) and all-or-nothing (transaction) before writing any code.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-analytics-api"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-graphql-fundamentals",
    slug: "graphql-fundamentals",
    title: "GraphQL Fundamentals: Over-fetching, Under-fetching and the Real Trade-offs",
    description:
      "What GraphQL actually solves (over-fetching and under-fetching), when it genuinely beats REST, when REST still wins, and the costs nobody mentions up front: caching complexity and query cost.",
    order: 2,
    estimatedMinutes: 24,
    tags: ["graphql", "api-design", "query-language", "trade-offs"],
    prerequisites: ["p2m5-rest-principles", "p2m5-pagination", "p2m2-api-versioning"],
    relatedTopics: [
      "p3m2-graphql-schemas-resolvers",
      "p3m2-graphql-auth",
      "p3m2-dataloader-n1",
      "p3m2-openapi-advanced",
    ],
    learningObjectives: [
      "Define over-fetching and under-fetching with concrete API examples",
      "Describe a GraphQL request lifecycle from query document to JSON response",
      "Pick GraphQL or REST for a scenario and justify the choice with costs, not fashion",
      "Explain why GraphQL responses are hard to cache and what mitigations exist",
      "Recognise unbounded query risk and the controls that limit it",
    ],
    simpleExplanation:
      "GraphQL lets the client write exactly the data shape it needs, and the server answers with precisely that shape. That removes two classic REST problems: over-fetching (getting 40 fields when you use 3) and under-fetching (needing five round-trips to build one screen). The price is that you give up URL-based HTTP caching, gain a new class of expensive query to defend against, and must govern a shared schema instead of shipping endpoint changes freely.",
    detailedContent: `
**Over-fetching** is a REST response carrying data the client discards: \`GET /api/v1/users/42\` returns 25 columns for a settings page that displays three. **Under-fetching** is the opposite: a dashboard needs the user, their last ten orders and each order's items, so the client issues five requests, waits for each, and pays five round-trips of latency — often serially.

GraphQL collapses both into one POST to \`/graphql\` with a query document describing the desired tree. The server walks its type system, resolves each field, and returns JSON whose shape mirrors the request.

**When GraphQL wins:**

- Many diverse clients (web, iOS, Android, embedded) each needing different shapes of the same data.
- Deeply relational reads where REST forces client-side joins.
- Frontends that ship weekly while the backend releases monthly: adding a field to the schema is additive and needs no coordination.

**When REST wins:** simple CRUD, public partner APIs, anything relying on HTTP caching and CDNs (URL is the cache key; GraphQL's URL is always \`/graphql\`), file and streaming payloads, and teams that benefit from the discipline of resources and status codes.

**Cost 1 — caching.** Because the endpoint never changes, you cannot cache at the CDN by URL. Mitigations: **persisted queries** (client sends an id, server maps it to a known document), **automatic persisted queries** (hash of the query as cache key), and field-level caching inside the server.

**Cost 2 — query cost.** A client can request \`orders { items { product { reviews { author { posts } } } } }\` and multiply work thousands of times. Always enforce **depth limits**, **complexity/field-count budgets**, and per-request timeouts. Add the N+1 problem: naive resolvers issue one query per parent row — that is the next lesson.
    `,
    howItWorks: `
A GraphQL round-trip looks like this:

1. The client POSTs \`{ "query": "{ user(id: 42) { name orders { id total } } }" }\` to \`/graphql\` with an Authorization header.
2. The server **parses** the string into an AST, then **validates** it against the schema: unknown fields, wrong types and cycles are rejected before any data is touched.
3. The query is **executed** field by field: root resolvers run for \`user\`, then nested field resolvers run for \`name\` and \`orders\`, each receiving \`(parent, args, context, info)\`.
4. Results are collected into a response object. Field-level failures do not fail the whole request: \`data\` holds what succeeded, \`errors\` holds what did not.
5. The HTTP layer usually answers **200 even for errors** — clients must read the body, not the status line.

Because execution is per field, a resolver that queries per row explodes into the N+1 problem.
    `,
    codeExamples: [
      {
        title: "REST waterfall versus one GraphQL query",
        language: "json",
        code: `// REST: three (or more) round trips to build one screen
GET /api/v1/users/42
GET /api/v1/users/42/orders?limit=10
GET /api/v1/orders/o_9/items        // repeated for every order => N+1 on the client

// GraphQL: one request, exactly the shape the screen needs
POST /graphql
{
  "query": "query Screen($id: ID!) { user(id: $id) { name avatar orders(limit: 10) { id total items { sku qty } } } }",
  "variables": { "id": "42" }
}

// Response mirrors the request — no more, no less
{
  "data": {
    "user": {
      "name": "Amina",
      "avatar": "https://cdn.example.com/a.png",
      "orders": [
        { "id": "o_9", "total": 4200, "items": [{ "sku": "NP-1", "qty": 2 }] }
      ]
    }
  }
}`,
        description:
          "The client controls the projection, so adding a column to the screen means editing the query document, not asking the backend team for a new endpoint. Note the response has no HTTP status discussion — success is decided by the data and errors arrays.",
      },
      {
        title: "The cost control you must ship on day one",
        language: "ts",
        code: `import { createHandler } from "graphql-http/lib/use/express";
import depthLimit from "graphql-depth-limit";
import { createComplexityLimitRule } from "graphql-validation-complexity";

app.use(
  "/graphql",
  createHandler({
    schema,
    validationRules: [
      depthLimit(7),                                   // reject deeply nested documents
      createComplexityLimitRule(1000),                 // reject documents that cost too much
    ],
    context: ({ req }) => ({
      user: verifyToken(req.headers.authorization),
      loaders: makeLoaders(db),                        // request-scoped (see the DataLoader lesson)
    }),
  }),
);`,
        description:
          "Depth and complexity rules run during validation, before a single database query is issued — so hostile queries are rejected cheaply with 400-class GraphQL errors instead of melting your primary database.",
      },
    ],
    commonMistakes: [
      "Adopting GraphQL for a single simple CRUD service where one team controls both ends — you inherit schema governance for no benefit.",
      "Checking only res.ok in the client: GraphQL reports most failures inside a 200 body, so errors are missed entirely.",
      "Exposing an unbounded schema with no depth or complexity limits — one accidental nested query can take the site down.",
      "Assuming GraphQL removes the N+1 problem; it makes it more visible, but resolver-per-field design is exactly what creates it.",
    ],
    bestPractices: [
      "Start every GraphQL service with depth limits, complexity budgets, query timeouts and query logging enabled.",
      "Use persisted queries for your own first-party clients — they shrink payloads to an id and make caching and allow-listing trivial.",
      "Return 200 with a well-formed errors array by convention, but still use 401/403/400 at the HTTP layer for auth and malformed requests.",
      "Keep mutations resource-named and idempotency-friendly: GraphQL mutations are POSTs and are not retry-safe by default.",
    ],
    realWorldUseCases: [
      "GitHub's GraphQL API exists because a single profile page needs user, repositories, pull requests and notifications in one payload.",
      "E-commerce product pages combine product, price, inventory, reviews and recommendations — a natural fit for one nested query.",
      "An internal analytics dashboard with fast-moving UI requirements can add fields without versioning a dozen REST endpoints.",
    ],
    resources: [
      docs(
        "GraphQL — Learning track",
        "https://graphql.org/learn/",
        "Official tour of queries, schema, execution, errors and best practices.",
        "en",
        "reference",
      ),
      docs(
        "GraphQL — FAQ",
        "https://graphql.org/learn/faq/",
        "The official position on caching, performance, when GraphQL is a fit and when it is not.",
        "en",
        "15 min",
      ),
      docs(
        "GraphQL — Best practices",
        "https://graphql.org/learn/best-practices/",
        "Official guidance on serving over HTTP, caching with global object ids, and the performance and security pages that cover query cost defence.",
        "en",
        "reference",
      ),
      ytSearch(
        "GraphQL vs REST over fetching under fetching explained",
        "Side-by-side comparisons of REST waterfalls versus single GraphQL queries.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-graphql-decision",
        title: "Justify the choice, not the trend",
        prompt:
          "For each scenario pick REST or GraphQL and defend it with at least two concrete costs: (1) a public partner API with a stable contract and CDN caching, (2) an iOS + Android + web app all rendering the same order history screen differently, (3) a file-upload and download API, (4) an admin dashboard where the product team changes visible columns every sprint.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Ask where the caching happens and who pays for round-trips.",
          "Schema change cost versus endpoint change cost is usually the deciding factor.",
        ],
      },
      {
        id: "ex-p3m2-query-cost",
        title: "Attack your own API",
        prompt:
          "Write the most expensive legal GraphQL query you can for a schema you control (nesting relations three or four levels deep). Estimate how many database queries a naive resolver implementation would run for it, then write the depth and complexity limits you would configure to reject it. Include the exact limit values and justify them.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Count rows multiplied at each nesting level, not just the depth number.",
          "A limit should reject the hostile query while passing your real UI queries with room to spare.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-graphql-schemas-resolvers",
    slug: "graphql-schemas-and-resolvers",
    title: "GraphQL Schemas and Resolvers",
    description:
      "SDL types, Query and Mutation roots, the four-argument resolver shape, context, field-level resolvers and structured error handling with error extensions.",
    order: 3,
    estimatedMinutes: 25,
    tags: ["graphql", "schema", "resolvers", "sdl"],
    prerequisites: ["p3m2-graphql-fundamentals", "p3m1-layered-architecture", "p2m2-centralized-error-handling"],
    relatedTopics: [
      "p3m2-graphql-auth",
      "p3m2-dataloader-n1",
      "p3m2-openapi-advanced",
      "p3m2-advanced-rest-design",
    ],
    learningObjectives: [
      "Write a GraphQL schema in SDL with types, enums, inputs and connection pagination",
      "Explain the resolver signature (parent, args, context, info) and where each argument comes from",
      "Compose root and field-level resolvers so each type owns only its own fields",
      "Return structured errors with extensions.code while preserving partial data",
    ],
    simpleExplanation:
      "The schema is the contract: it declares every type, query and mutation your API exposes, and the server rejects anything not described there. Resolvers are the small functions that fetch the value for each field when a query runs. Errors are collected per field, so one broken resolver still lets the rest of the response arrive, with a machine-readable code in error.extensions so clients can branch on it.",
    detailedContent: `
**SDL (Schema Definition Language)** is the language-agnostic description of your API. It has three pillars:

- **Object types** describe data: \`type Order { id: ID!, total: Int!, status: OrderStatus!, items: [Item!]! }\`. \`!\` means non-null; \`[Item!]!\` is a non-null list of non-null items.
- **The Query root** is the read entry point, like GET routes: \`type Query { order(id: ID!): Order orders(first: Int = 20, after: String): OrderConnection! }\`.
- **The Mutation root** is the write entry point, like POST/PATCH/DELETE: \`type Mutation { createOrder(input: CreateOrderInput!): Order! }\`.

Use \`input\` types for mutation arguments (never reuse an output type), \`enum\` for closed values, and cursor **connections** (\`edges { node cursor }\` + \`pageInfo\`) instead of offset numbers — GraphQL has no standard \`?page=2\`.

**Resolver shape.** Every resolver is \`function(parent, args, context, info)\`:

| Argument | Meaning |
| --- | --- |
| \`parent\` | The value returned by the resolver one level up (null for root fields) |
| \`args\` | Parsed and type-coerced arguments for this field |
| \`context\` | Per-request services: \`db\`, \`user\`, \`loaders\`, \`logger\` |
| \`info\` | AST, path and return type — used for dataloading and field selection |

Root resolvers fetch whole rows; **field resolvers** derive or load individual properties (\`Order.totalCents => totalCents / 100\`). Keep business logic out of resolvers — they call into your service layer, exactly like a controller in a modular monolith.

**Errors.** Throw \`new GraphQLError(message, { extensions: { code: "ORDER_NOT_FOUND", orderId } })\`. The spec puts errors in a sibling array to \`data\`: nulls bubble up through non-null fields, so one thrown non-null field can null an entire parent object. Standardise codes (\`UNAUTHENTICATED\`, \`FORBIDDEN\`, \`NOT_FOUND\`, \`BAD_USER_INPUT\`, \`INTERNAL_SERVER_ERROR\`) and map them to HTTP statuses with \`extensions.http\`.
    `,
    howItWorks: `
Execution is a walk over the query tree:

1. Parse the document into an AST, validate against the schema (unknown fields are caught here).
2. Begin at the Query root. For the \`order(id: "o_9")\` field, call \`Query.order(parent=undefined, args={id:"o_9"}, ctx, info)\`.
3. Its return value becomes \`parent\` for each selected subfield: \`Order.status\` receives \`parent = { id, total, status, ... }\`.
4. Sibling fields at the same level run **concurrently** (the server collects them into promises), which is why a per-row resolver produces the N+1 storm.
5. Results are assembled bottom-up into \`{ data, errors }\`. Error entries carry \`path\` (exactly which field failed) and \`locations\`.

Because \`context\` is created once per HTTP request, anything built there (loaders, the authenticated user, a transaction handle) is shared safely by every resolver in that request only.
    `,
    codeExamples: [
      {
        title: "SDL for a small order API",
        language: "graphql",
        code: `enum OrderStatus { PENDING PAID SHIPPED CANCELLED }

type Order {
  id: ID!
  number: String!
  status: OrderStatus!
  total: Int!          # minor units, like Stripe
  customer: Customer!
  items(first: Int = 20, after: String): OrderItemConnection!
}

type Query {
  order(id: ID!): Order
  orders(first: Int = 20, after: String, status: OrderStatus): OrderConnection!
}

input CreateOrderInput {
  customerId: ID!
  currency: String! = "usd"
  lineItems: [LineItemInput!]!
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!): Order!
}`,
        description:
          "Non-null markers, an enum for a closed status set, an input type for the mutation and cursor pagination arguments. Clients cannot invent a field the schema does not declare — that is where GraphQL's safety comes from.",
      },
      {
        title: "Root resolvers, field resolvers and structured errors",
        language: "ts",
        code: `import { GraphQLError } from "graphql";

export const resolvers = {
  Query: {
    order: async (_parent, args, ctx) => {
      if (!ctx.user) {
        throw new GraphQLError("Authentication required.", {
          extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
        });
      }
      const order = await ctx.db.orders.findOne({ _id: args.id, tenantId: ctx.user.tenantId });
      if (!order) {
        throw new GraphQLError("Order not found.", {
          extensions: { code: "NOT_FOUND", orderId: args.id },
        });
      }
      return order;
    },
  },

  Order: {
    // parent = the order row returned above; nothing is refetched
    total: (parent) => parent.totalCents / 100,
    customer: (parent, _args, ctx) => ctx.loaders.customer.load(parent.customerId),
    items: (parent, args, ctx) => ctx.db.orderItems.page({ orderId: parent.id, ...args }),
  },

  Mutation: {
    cancelOrder: async (_parent, args, ctx) => {
      const order = await ctx.services.orders.cancel(args.id, ctx.user);
      if (!order) throw new GraphQLError("Order cannot be cancelled.", { extensions: { code: "CONFLICT" } });
      return order;
    },
  },
};`,
        description:
          "Note the division of labour: Query resolvers authorise and load, field resolvers derive or batch, and the service layer owns the business rule. Every error carries extensions.code so the client can branch without parsing English.",
      },
    ],
    commonMistakes: [
      "Returning 500 with a stack trace for every failure — expose extensions.code and log the stack under a requestId instead.",
      "Resolving nested fields by re-querying the database instead of using the parent value or a loader.",
      "Making a Query root field non-null when it can legitimately be absent, which nulls the entire data object.",
      "Passing the raw HTTP request into every resolver call instead of building a clean context object once per request.",
    ],
    bestPractices: [
      "Keep resolvers thin: parse args, authorise, delegate to a service, map domain errors to GraphQLError with stable codes.",
      "Define a shared set of error codes and reuse the same codes your REST API uses so clients learn one vocabulary.",
      "Mark only truly impossible states as non-null in lists; nulls inside a list are safer than nulling a whole parent.",
      "Log error extensions and the GraphQL path — path is the only way to find which field a user reported as broken.",
    ],
    realWorldUseCases: [
      "A checkout mutation returns the created order while an invalid coupon produces a field error the UI shows inline.",
      "An analytics API exposes a Query that returns partial data with an errors entry when one upstream source times out.",
      "Schema-first teams generate TypeScript types from SDL so the frontend and backend compile against the same contract.",
    ],
    resources: [
      docs(
        "GraphQL — Schemas and types",
        "https://graphql.org/learn/schema/",
        "Official SDL reference: object types, Query and Mutation roots, input types and enums.",
        "en",
        "reference",
      ),
      docs(
        "GraphQL — Errors",
        "https://graphql.org/learn/errors/",
        "How errors and partial data are represented, including error paths and extensions.",
        "en",
        "12 min",
      ),
      docs(
        "GraphQL — Execution",
        "https://graphql.org/learn/execution/",
        "The field-by-field execution model and where concurrency happens.",
        "en",
        "12 min",
      ),
      ytSearch(
        "graphql schema resolvers nodejs tutorial",
        "Hands-on build-alongs for SDL, resolver maps and context.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-sdl",
        title: "Model a booking domain in SDL",
        prompt:
          "Write SDL for a room-booking API: Booking, Room and Hotel types, a Query root that returns a single booking and a filtered list of bookings, and Mutations to create and cancel a booking. Include: non-null markers, an enum for booking status, an input type for creation, and cursor pagination on the list query. Then list the resolver map you would need (one entry per type and root field you declared).",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "status: BookingStatus! is safer than String! because the schema enforces the closed set.",
          "Each type in the schema needs a matching entry in the resolver map only if at least one of its fields needs logic.",
        ],
        solution: `enum BookingStatus { REQUESTED CONFIRMED CANCELLED NO_SHOW }

type Booking {
  id: ID!
  status: BookingStatus!
  checkIn: String!
  nights: Int!
  room: Room!
  hotel: Hotel!
}

type Query {
  booking(id: ID!): Booking
  bookings(from: String!, to: String!, first: Int = 20, after: String): BookingConnection!
}

input CreateBookingInput {
  roomId: ID!
  checkIn: String!
  nights: Int!
}

type Mutation {
  createBooking(input: CreateBookingInput!): Booking!
  cancelBooking(id: ID!): Booking!
}

// resolver map
// Query.booking      -> load + authorise
// Query.bookings     -> filter + cursor page
// Booking.room       -> ctx.loaders.room.load(parent.roomId)
// Booking.hotel      -> via room (field resolver on Room)
// Mutation.*         -> service layer`,
        solutionLanguage: "graphql",
      },
      {
        id: "ex-p3m2-error-contract",
        title: "Map domain errors to GraphQL errors",
        prompt:
          "Take five failure cases from a REST API you built (validation, unauthenticated, forbidden, not found, conflict). For each, write the exact GraphQLError you would throw, including message, extensions.code, and any extra context fields. Then explain why the HTTP status stays 401 for unauthenticated even though the body carries data and errors.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "extensions should be machine-readable first, human-readable second.",
          "HTTP-level auth failures are decided before GraphQL execution begins — middleware still runs.",
        ],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-graphql-auth",
    slug: "graphql-authorization",
    title: "GraphQL Authorization: Resolvers, Directives and Batching",
    description:
      "Where authentication ends and authorization begins in GraphQL: context, resolver-level guards, @auth directives versus HTTP middleware, and why batching changes the security picture.",
    order: 4,
    estimatedMinutes: 22,
    tags: ["graphql", "authorization", "security", "directives"],
    prerequisites: [
      "p3m2-graphql-schemas-resolvers",
      "p2m6-protected-routes",
      "p2m6-jwt-access-tokens",
      "p2m6-role-based-access-control",
    ],
    relatedTopics: [
      "p3m2-dataloader-n1",
      "p3m2-api-gateways",
      "p3m2-openapi-advanced",
      "p3m2-websockets",
    ],
    learningObjectives: [
      "Split responsibilities between HTTP middleware and GraphQL resolvers for auth",
      "Enforce field-level authorization so hidden data cannot be reached by a crafted query",
      "Compare directive-based guards with explicit resolver checks and choose deliberately",
      "Keep authorization correct when loaders batch rows across users and tenants",
    ],
    simpleExplanation:
      "HTTP middleware still verifies the token and puts the user into GraphQL context, but middleware only sees the URL — it cannot see which fields inside the query are dangerous. Authorization therefore happens in resolvers and directives, where the field being read is known. The tricky part is batching: loaders mix rows from many parents into one query, so the guard must run on every parent before it enters a batch, or one user's data leaks into another user's response.",
    detailedContent: `
**Layer 1 — HTTP middleware** (before GraphQL runs): parse \`Authorization\`, verify the JWT, load tenant and roles, put \`{ user, tenantId, roles }\` into \`context\`. If the token is missing or expired, fail here with 401 — the same middleware you wrote in Phase 2 still applies to \`POST /graphql\`.

**Layer 2 — resolvers and directives** (per field): middleware cannot know that \`Query.invoice(id)\` exposes another tenant's financial record, because every GraphQL request has the same URL. Authorization must run where the field is resolved:

    Query.invoice: checkOwnership(invoice, ctx.user)   // explicit, greppable
    @auth @hasRole("admin")                           // declarative, schema-visible

**Directives versus middleware.** Directives attach guards in SDL (\`invoice(id: ID!): Invoice @auth\`), so the rule is visible in the schema and generated documentation, and one implementation applies it everywhere via schema mapping. Explicit resolver guards are simpler to debug and can express conditions directives cannot (ownership, plan limits). Use directives for uniform rules (must be authenticated, must be admin) and resolver checks for data-dependent rules (this row belongs to me). Middleware remains for transport concerns only: token parsing, rate limits, request logging.

**Batching changes the threat model.** A loader called for 200 parents issues one query and returns 200 results. If authorization is checked only after the batch (on the child row), you have already read other rows. Check authorization **on the parent before enqueueing the key**, and scope the batch query itself with \`tenant_id = ?\` so even a buggy key cannot cross tenants.

Also avoid information leaks: a forbidden resource should consistently return either \`FORBIDDEN\` or \`NOT_FOUND\` — pick one policy, because distinguishing them reveals which ids exist.
    `,
    howItWorks: `
A query \`{ viewer { invoices { id total } } }\` runs:

1. Express middleware verifies the JWT, builds \`ctx = { user, tenantId, roles, loaders }\`.
2. \`viewer\` resolves from the token — no database hit.
3. \`Invoice.total\` is reached for each invoice; the parent resolver already filtered by \`tenantId\`, so only this tenant's rows are in play.
4. Each invoice's field resolver checks \`ctx.roles\` before returning anything the role may not see (a \`balance\` field hidden from read-only roles).
5. A crafted query asking for \`adminAuditLog\` fails validation or throws \`FORBIDDEN\` with \`extensions.code\` — the client gets \`errors\` plus whatever else succeeded.

Every check reads the same per-request context, so revoking access (short-lived tokens, deny-list) takes effect on the next request without touching schema code.
    `,
    codeExamples: [
      {
        title: "Directive plus resolver guard, side by side",
        language: "graphql",
        code: `directive @auth on FIELD_DEFINITION
directive @hasRole(role: String!) on FIELD_DEFINITION

type Query {
  viewer: User @auth
  invoices: [Invoice!]! @auth
  auditLog: [AuditEntry!]! @hasRole(role: "admin")
}

type Mutation {
  refundCharge(id: ID!): Charge! @auth @hasRole(role: "finance")
}

type Invoice {
  id: ID!
  total: Int!
  balance: Int          # hidden from read-only roles in the resolver
}`,
        description:
          "Uniform rules (authenticated, role) live in SDL where clients and docs can see them; data-dependent rules (ownership, row-level visibility) stay in the resolver because no directive can express 'this invoice belongs to the caller'.",
      },
      {
        title: "Guarding before the batch",
        language: "ts",
        code: `import { GraphQLError } from "graphql";

export function requireAuth(ctx) {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required.", {
      extensions: { code: "UNAUTHENTICATED", http: { status: 401 } },
    });
  }
  return ctx.user;
}

export function requireRole(ctx, role) {
  const user = requireAuth(ctx);
  if (!user.roles.includes(role)) {
    throw new GraphQLError("You may not perform this action.", {
      extensions: { code: "FORBIDDEN", requiredRole: role },
    });
  }
  return user;
}

export const resolvers = {
  Query: {
    invoices: (_p, _a, ctx) => {
      const user = requireAuth(ctx);                       // before any query runs
      return ctx.db.invoices.find({ tenantId: user.tenantId });
    },
  },
  Invoice: {
    balance: (parent, _args, ctx) => {
      if (!ctx.roles.includes("finance")) return null;      // field-level redaction
      return parent.balanceCents;
    },
  },
  Mutation: {
    refundCharge: (_p, args, ctx) => {
      requireRole(ctx, "finance");
      return ctx.services.payments.refund(args.id, ctx.user);
    },
  },
};

// loaders are built per request with the tenant already bound:
export function makeContext({ req }) {
  const user = verifyToken(req.headers.authorization);
  return {
    user,
    loaders: makeLoaders(ctxDb.forTenant(user.tenantId)),
  };
}`,
        description:
          "Authorization runs before data is loaded, and the loader factory closes over the tenant so every batched query is automatically tenant-scoped. Redacting a field returns null rather than leaking its existence.",
      },
    ],
    commonMistakes: [
      "Checking authentication only, then assuming any authenticated user may read any row — the classic broken-object-level-authorization bug.",
      "Trusting schema visibility: hiding a field helps, but any field you do expose must still be authorised per request.",
      "Authorising after the batched query has already run, so foreign rows were read into memory even if they are discarded.",
      "Returning 'not found' for one resource and 'forbidden' for another inconsistently, which leaks the existence of private ids.",
    ],
    bestPractices: [
      "Default deny: every new resolver starts unauthorized and earns its guard in code review.",
      "Keep a single requireAuth/requireRole helper shared by REST routers and GraphQL resolvers so rules cannot drift.",
      "Bind tenant scoping inside the data layer, not in each resolver — defense in depth beats remembering 60 call sites.",
      "Log every FORBIDDEN with the user id, field path and query hash for security monitoring.",
    ],
    realWorldUseCases: [
      "A multi-tenant SaaS uses tenant-bound loaders so a crafted query can never assemble another customer's records.",
      "Finance-only fields such as invoice balance are redacted in the resolver for support roles that legitimately need the invoice list.",
      "Admin-only audit queries are declared with @hasRole in SDL and verified again in the resolver for defense in depth.",
    ],
    resources: [
      docs(
        "GraphQL — Authorization",
        "https://graphql.org/learn/authorization/",
        "Official guidance on authentication at the boundary and authorization at the field level.",
        "en",
        "10 min",
      ),
      docs(
        "OWASP — API Security Top 10",
        OFFICIAL.owaspApi,
        "Broken object level authorization (API1) is the exact failure mode GraphQL resolvers must prevent.",
        "en",
        "reference",
      ),
      docs(
        "Node.js — crypto (JWT verification)",
        OFFICIAL.nodejsApi,
        "Where token verification actually happens before it reaches GraphQL context.",
        "en",
        "reference",
      ),
      ytSearch(
        "graphql authorization directives resolver based access control",
        "Explainers on @auth directives, context and per-field authorization.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-authz-map",
        title: "Authorize a schema field by field",
        prompt:
          "Take a schema with Query.viewer, Query.user(id), Query.users, Mutation.updateUser(id, input) and Invoice.balance. For each field write: who may call it, which check enforces it (directive or resolver), and what error code the caller receives. Include one case where you deliberately return NOT_FOUND instead of FORBIDDEN and justify it.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Anything that exposes a specific id needs an ownership check, not just a role check.",
          "Public directory fields may be readable by any authenticated user — that is a deliberate exception, not a default.",
        ],
      },
      {
        id: "ex-p3m2-tenant-leak",
        title: "Find the cross-tenant leak",
        prompt:
          "A loader batch function runs SELECT * FROM invoices WHERE id IN (…) with no tenant filter, and the resolver authorises each invoice after the batch returns. Explain precisely how an attacker extracts another tenant's data, then rewrite the code so authorization and tenant scoping happen before any row is read.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "The attacker controls the parent ids that enter the batch.",
          "Two fixes are needed: guard the parent, and scope the batch query itself.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-dataloader-n1",
    slug: "dataloader-and-the-n-plus-one-problem",
    title: "DataLoader and the N+1 Problem",
    description:
      "Why per-field resolvers explode into one query per row, how DataLoader batches keys inside a single tick, and why the cache must be scoped to one request.",
    order: 5,
    estimatedMinutes: 24,
    tags: ["graphql", "dataloader", "n+1", "performance"],
    prerequisites: ["p3m2-graphql-schemas-resolvers", "p2m3-mongoose-populate", "p2m4-joins"],
    relatedTopics: [
      "p3m2-graphql-auth",
      "p3m2-distributed-api-design",
      "p3m2-api-gateways",
      "p3m2-rate-limiting-strategies",
    ],
    learningObjectives: [
      "Diagnose an N+1 problem by counting queries for a given document",
      "Explain how DataLoader collects keys and dispatches one batched query",
      "Write a batch function that preserves key order and handles missing rows",
      "Scope the loader cache per request and know when to disable it",
    ],
    simpleExplanation:
      "A GraphQL query asking for 50 posts and each post's author runs 1 query for the posts and then 50 tiny queries for the authors — that is the N+1 problem, and it is the most common way a GraphQL API melts a database. DataLoader fixes it by collecting all author ids that appear in the same tick and issuing one WHERE id IN (…) query, then handing each resolver back exactly the row it asked for. Its cache is deliberately request-scoped so one request can never be served another user's data.",
    detailedContent: `
**Count the queries.** For \`{ posts { title author { name } } }\` with 50 posts:

    SELECT * FROM posts LIMIT 50;                        -- 1
    SELECT * FROM users WHERE id = 7;                    -- 2
    SELECT * FROM users WHERE id = 12;                   -- 3
    ...                                                  -- ... 51 total

That is N+1: one query for the parent list plus one per child reference. It also exists in REST (an N+1 inside a loop) and in MongoDB (populating inside a for-loop) — GraphQL simply makes it structural, because each field has its own resolver.

**How batching works.** Resolvers at the same depth run concurrently and are all reached before the event loop yields. DataLoader hooks into that: every \`load(id)\` pushes the key onto a pending list, and on the next microtask it calls your **batch function once** with all keys. The function issues one \`WHERE id IN (…)\` query (or \`find({ _id: { $in: ids } })\` in MongoDB) and returns an array **in the same order as the keys** — that positional contract is the whole API:

    batch([7, 12, 3]) => [row7, row12, row3]   // never reorder, never skip

Missing rows must be filled with \`null\` (or \`undefined\`) rather than dropped, otherwise every subsequent position shifts and resolver A receives resolver B's row.

**Cache scoping.** \`new DataLoader(batch)\` also memoises each key's promise. Create loaders **inside the per-request context factory**, never at module level: a process-wide cache serves stale rows across users, leaks data across tenants, and grows without bound. On mutations, call \`loader.clear(id)\` or \`loader.clearAll()\` for anything the mutation changed, and consider \`cache: false\` for high-cardinality lookups where a hit is unlikely anyway.

Loaders never cross request boundaries and are never shared between users — that is the rule that keeps batching safe.
    `,
    howItWorks: `
Inside one request:

1. \`Query.posts\` resolves and returns 50 post rows.
2. Each \`Post.author\` resolver runs \`ctx.loaders.author.load(post.authorId)\` — 50 calls, but no query yet: they are queued.
3. All 50 resolvers return promises; the queue flushes on the next microtask with keys \`[7, 12, 3, ...]\`.
4. Your batch function runs one query: \`SELECT * FROM users WHERE id IN (7,12,3,…)\` plus \`tenant_id = ?\`.
5. The database returns 47 rows (some authors were deleted). The batch function maps them back to 50 positions, using \`null\` for the 3 missing ids.
6. DataLoader resolves each queued promise with its own row and caches it for the rest of this request only.

Result: 2 queries total instead of 51, with identical data.
    `,
    codeExamples: [
      {
        title: "A correct batch function",
        language: "ts",
        code: `import DataLoader from "dataloader";

export function makeAuthorLoader(db, tenantId) {
  return new DataLoader(
    async (userIds) => {
      const rows = await db
        .collection("users")
        .find({ _id: { $in: [...userIds] }, tenantId })   // tenant scoping inside the batch
        .toArray();

      const byId = new Map(rows.map((r) => [String(r._id), r]));

      // positional contract: one entry per key, same order, null for misses
      return userIds.map((id) => byId.get(String(id)) ?? null);
    },
    { maxBatchSize: 100 },                                 // chunk very large key sets
  );
}

// built ONCE PER REQUEST in the context factory — never at module scope
export function createContext({ req }) {
  const user = verifyToken(req.headers.authorization);
  return {
    user,
    loaders: { author: makeAuthorLoader(db, user.tenantId) },
  };
}`,
        description:
          "The array returned by the batch function must line up with the array of keys: no reordering, no skipping, null for missing rows. maxBatchSize splits huge key sets into several queries so one request cannot build an unbounded IN clause.",
      },
      {
        title: "The same N+1 in plain REST — and the fix",
        language: "ts",
        code: `// N+1: one query per order inside a loop (REST or GraphQL)
const orders = await db.orders.find({ tenantId }).limit(50).toArray();
for (const order of orders) {
  order.customer = await db.customers.findById(order.customerId); // 50 extra queries
}

// Fixed: single batched query
const ids = [...new Set(orders.map((o) => o.customerId))];
const customers = await db.customers.find({ _id: { $in: ids }, tenantId }).toArray();
const byId = new Map(customers.map((c) => [String(c._id), c]));
for (const order of orders) {
  order.customer = byId.get(String(order.customerId)) ?? null;
}`,
        description:
          "DataLoader is just this pattern, automated and memoised per request. Recognising the loop-around-a-query shape lets you fix N+1 bugs even outside GraphQL.",
      },
    ],
    commonMistakes: [
      "Creating loaders in a module-level singleton, so their cache leaks rows between requests, users and tenants.",
      "Returning fewer results than keys from the batch function, silently shifting every subsequent position.",
      "Forgetting tenant or soft-delete filters inside the batch, which returns rows the caller may never see.",
      "Batching a mutation's reads without clearing the loader, so the same request sees stale data right after a write.",
    ],
    bestPractices: [
      "Log query counts per GraphQL request in development — a jump from 3 to 50 is your N+1 alarm.",
      "Keep batch functions dumb and centralised: one per entity, tenant-scoped, ordering guaranteed, misses mapped to null.",
      "Set maxBatchSize and a request timeout so one pathological document cannot build a million-key IN clause.",
      "Prime the cache after mutations (loader.prime(id, row)) so follow-up reads in the same request stay correct and fast.",
    ],
    realWorldUseCases: [
      "A social feed rendering 50 posts with authors, groups and reaction counts: without batching, one page view runs hundreds of queries.",
      "An e-commerce order list populating customer, product and shipment rows — three loaders, three queries total.",
      "Mongoose populate over an array of ids already batches; DataLoader gives the same guarantee inside GraphQL resolvers.",
    ],
    resources: [
      docs(
        "DataLoader (graphql org) — repository and README",
        "https://github.com/graphql/dataloader",
        "The reference implementation: batching contract, caching options and request-scoping guidance.",
        "en",
        "15 min",
      ),
      docs(
        "GraphQL — Execution",
        "https://graphql.org/learn/execution/",
        "Why sibling fields run concurrently and where the batching window comes from.",
        "en",
        "12 min",
      ),
      docs(
        "MongoDB — $in query operator",
        "https://www.mongodb.com/docs/manual/reference/operator/query/in/",
        "The MongoDB side of a batched lookup, paired with a unique index on the key.",
        "en",
        "8 min",
      ),
      ytSearch(
        "graphql n+1 problem dataloader explained",
        "Query-count demos showing 51 queries collapse into 2.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-count-queries",
        title: "Count the queries",
        prompt:
          "For the document { orders { id items { sku product { name manufacturer { name } } } } } returning 25 orders with 4 items each, write down how many SQL queries a naive implementation runs and how many a fully batched implementation runs. Show the batch function for the deepest level (manufacturer).",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Count one query per level that loads rows per parent — items and product and manufacturer each multiply.",
          "A batched implementation uses one query per level, not one per row.",
        ],
        solution: `Naive:  1 (orders) + 25 (items per order) + 100 (product per item) + 100 (manufacturer per product) = 226
Batched: 1 (orders) + 1 (all items) + 1 (all products) + 1 (all manufacturers) = 4

export function makeManufacturerLoader(db, tenantId) {
  return new DataLoader(async (productIds) => {
    const products = await db.products.find({ _id: { $in: [...productIds] }, tenantId }).toArray();
    const manIds = [...new Set(products.map((p) => p.manufacturerId))];
    const makers = await db.manufacturers.find({ _id: { $in: manIds }, tenantId }).toArray();
    const makerById = new Map(makers.map((m) => [String(m._id), m]));

    // key = product id, value = that product's manufacturer (or null)
    return products.map((p) => makerById.get(String(p.manufacturerId)) ?? null);
  });
}`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-cache-scope",
        title: "Prove the cache is request-scoped",
        prompt:
          "Write the two versions of a loader factory — one at module scope and one inside the context factory. Then describe a concrete test: two sequential requests from different tenants, what each returns with the module-scope version, and what changes with the request-scoped version. Include the test code.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "The module-level cache is keyed only by id, so tenant is invisible to it.",
          "Use vitest to fire two requests against the same process and assert on the second response.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-chat-app"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-api-gateways",
    slug: "api-gateways",
    title: "API Gateways: Routing, Aggregation and Auth Termination",
    description:
      "What an edge gateway does (routing, aggregation, authentication termination, limits), the pitfalls of the smart-pipe temptation, and when direct service calls are the better choice.",
    order: 6,
    estimatedMinutes: 20,
    tags: ["api-gateway", "architecture", "edge", "routing"],
    prerequisites: [
      "p2m5-rest-principles",
      "p3m1-modular-monoliths",
      "p3m1-separation-of-concerns",
      "p2m6-jwt-access-tokens",
    ],
    relatedTopics: [
      "p3m2-distributed-api-design",
      "p3m2-rate-limiting-strategies",
      "p3m2-backward-compatibility",
      "p3m2-dataloader-n1",
    ],
    learningObjectives: [
      "Describe the responsibilities of an API gateway and the requests it terminates",
      "Aggregate several upstream services into one response without hiding failures",
      "Explain auth termination and the trusted-header boundary it creates",
      "Decide between a gateway and direct exposure using team size, service count and policy needs",
    ],
    simpleExplanation:
      "An API gateway is the single front door in front of many services: it routes a public URL to the right internal service, verifies tokens once, applies rate limits and CORS, and can merge several internal responses into one. It buys you one place for cross-cutting policy, but costs an extra hop, another system to operate, and the risk that the gateway quietly becomes a second monolith — so a small system with one service is usually better exposed directly.",
    detailedContent: `
A gateway sits between clients and your services and handles four categories of work:

- **Routing.** \`/api/orders/**\` → orders-service, \`/api/catalog/**\` → catalog-service, \`/graphql\` → graphql-service. Public URLs stay stable while internal service names, ports and replicas change freely.
- **Aggregation (fan-out / BFF).** A mobile home screen needs user, cart and recommendations: three internal calls merged into one response with \`Promise.all\`. Always decide what happens when one upstream fails — return partial data with an \`errors\` array, or fail the whole request; silently dropping a section is the worst option.
- **Auth termination.** The gateway verifies the JWT signature and forwards trusted identity headers (\`X-User-Id\`, \`X-Tenant-Id\`) on a private network that internal services accept **only from the gateway**. This removes crypto work from every service and gives one enforcement point — but if an internal port is reachable from outside, anyone can forge those headers.
- **Cross-cutting policy.** TLS, rate limiting per key or tenant, request-size limits, CORS, WAF rules, access logging, correlation ids and request timeouts.

**Gateway or direct?** Direct exposure wins when you have one service, one team and no shared policy beyond what the service itself already does — a gateway adds latency, a deployment, a failure mode and on-call surface. A gateway earns its keep when you have many services, several client types (web, iOS, partner), centralized compliance requirements, or a need to aggregate.

**The smart-pipe trap:** gateways that start transforming payloads, holding business logic or owning database credentials become unowned monoliths. Keep it to routing, policy and aggregation; leave domain rules in services.
    `,
    howItWorks: `
One request through a gateway:

1. \`GET https://api.example.com/v1/orders/o_9\` hits the gateway on 443; TLS terminates there.
2. Middleware runs in order: correlation id → rate-limit check (\`rl:tenant_12\` in Redis) → JWT verification → CORS → request logging.
3. The route table matches \`/v1/orders/**\` and forwards to \`http://orders-service:3000/v1/orders/o_9\` with \`X-User-Id\` attached and an upstream timeout of 2s.
4. The service reads the header (never the token), loads the order and responds.
5. The gateway streams the response back, records latency and status, and on a 503/timeout decides whether to retry the idempotent GET once.

For an aggregate route, steps 3–4 happen in parallel across services and the gateway merges the JSON before step 5.
    `,
    codeExamples: [
      {
        title: "A small gateway in Express",
        language: "ts",
        code: `import express from "express";
import jwt from "jsonwebtoken";

const app = express();

const ROUTES = [
  { prefix: "/v1/orders", target: "http://orders-service:3000" },
  { prefix: "/v1/catalog", target: "http://catalog-service:3000" },
];

app.use(express.json({ limit: "100kb" }));

// 1) auth termination: verify once at the edge
app.use((req, res, next) => {
  if (req.path.startsWith("/public")) return next();
  const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
  try {
    const claims = jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ["RS256"] });
    req.identity = { userId: claims.sub, tenantId: claims.tenant };
    next();
  } catch {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Bad token." } });
  }
});

// 2) routing with trusted identity headers
for (const route of ROUTES) {
  app.use(route.prefix, async (req, res) => {
    const upstream = await fetch(route.target + req.originalUrl, {
      method: req.method,
      headers: {
        "content-type": "application/json",
        "x-user-id": req.identity.userId,       // only meaningful on the private network
        "x-tenant-id": req.identity.tenantId,
      },
      body: req.method === "GET" ? undefined : JSON.stringify(req.body),
      signal: AbortSignal.timeout(2000),
    });
    res.status(upstream.status).json(await upstream.json());
  });
}`,
        description:
          "Verify the token once, forward identity as headers, and put a hard timeout on every upstream call. The identity headers must be stripped at the edge for any inbound request that did not come through the gateway's own TLS listener.",
      },
      {
        title: "Aggregation with explicit partial failure",
        language: "ts",
        code: `app.get("/v1/home", authenticate, async (req, res) => {
  const [user, cart, recs] = await Promise.allSettled([
    get(req.user.id),
    getCart(req.user.id),
    getRecommendations(req.user.id),
  ]);

  const data = {
    user: user.status === "fulfilled" ? user.value : null,
    cart: cart.status === "fulfilled" ? cart.value : null,
    recommendations: recs.status === "fulfilled" ? recs.value : null,
  };

  const failed = ["user", "cart", "recommendations"].filter(
    (k, i) => [user, cart, recs][i].status === "rejected",
  );

  res.status(200).json({ data, degraded: failed });
});`,
        description:
          "Promise.allSettled instead of Promise.all: one dead upstream does not blank the whole screen, and the degraded array tells the client which sections are missing rather than pretending they were empty.",
      },
    ],
    commonMistakes: [
      "Letting internal services accept identity headers from anywhere — a reachable port turns the gateway's trust into a full auth bypass.",
      "Using Promise.all in aggregation, so a single slow upstream fails the entire mobile screen.",
      "Putting business rules or payload reshaping into gateway plugins, creating an unowned second codebase.",
      "No upstream timeout at the gateway, so one hanging service holds client connections until the gateway runs out of sockets.",
    ],
    bestPractices: [
      "Strip inbound x-user-* headers at the edge and re-add them only for upstream calls you originate.",
      "Give every upstream call an explicit timeout and a retry budget; retry only idempotent GETs.",
      "Keep the gateway configuration in version control and test route changes in CI like any other code.",
      "Expose per-route metrics (latency, 5xx, retries) — the gateway is the best place to see overall API health.",
    ],
    realWorldUseCases: [
      "Kong, NGINX and AWS API Gateway in front of a dozen microservices give one TLS endpoint, one WAF and one rate-limit policy.",
      "A mobile BFF aggregates six internal services into the three payloads the app actually renders.",
      "Multi-tenant SaaS terminates OAuth at the gateway so services only read a trusted tenant header.",
    ],
    resources: [
      docs(
        "NGINX — Reverse proxy",
        "https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/",
        "The mechanics a gateway builds on: proxying, upstream timeouts and header handling.",
        "en",
        "15 min",
      ),
      docs(
        "12factor.net — Backing services",
        "https://12factor.net/backing-services/",
        "Treat services as attached resources: the gateway keeps addresses swappable behind stable URLs.",
        "en",
        "5 min",
      ),
      docs(
        "Express — Node.js web application framework",
        OFFICIAL.expressDocs,
        "The reference implementation style used for the gateway example above.",
        "en",
        "reference",
      ),
      ytSearch(
        "api gateway pattern explained routing aggregation authentication",
        "Architecture walkthroughs comparing gateways, sidecars and direct exposure.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-gateway-decision",
        title: "Gateway or direct?",
        prompt:
          "Three scenarios: (1) a single Express API with one frontend and 4 engineers, (2) 12 microservices with web, iOS and partner clients plus a compliance requirement for one audit log, (3) an internal batch worker calling other services with no external clients. Choose gateway or no gateway for each and give three costs of your choice, not just benefits.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Count the extra operational surface: deployment, on-call, failure modes, latency hop.",
          "A requirement shared by every service (audit log, rate limits) is what tips the balance.",
        ],
      },
      {
        id: "ex-p3m2-trust-boundary",
        title: "Harden the trust boundary",
        prompt:
          "Write the checklist that makes identity headers safe: where they are accepted, where they are stripped, how services authenticate the gateway, what happens if a service port is exposed, and how you would test that an attacker cannot forge X-User-Id. Include one concrete test using curl.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Test by calling the service directly with a forged header from outside the private network.",
          "Mutual TLS or a network policy is the usual answer to 'how does the service know it is the gateway'.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-websockets",
    slug: "websockets",
    title: "WebSockets: Handshake, Rooms, Auth and Scaling Out",
    description:
      "The HTTP upgrade handshake, rooms and broadcasting, authenticating at connect time, surviving disconnects with reconnection and resync, and scaling to many Node.js processes with Redis pub/sub.",
    order: 7,
    estimatedMinutes: 25,
    tags: ["websockets", "realtime", "socket.io", "redis"],
    prerequisites: ["p2m2-express-app", "p2m6-protected-routes", "p2m5-rate-limiting"],
    relatedTopics: [
      "p3m2-sse",
      "p3m2-realtime-communication",
      "p3m2-distributed-api-design",
      "p3m2-api-gateways",
    ],
    learningObjectives: [
      "Describe the WebSocket handshake and what happens after the 101 response",
      "Organise connections into rooms and broadcast to a room without looping messages",
      "Authenticate during the handshake and refresh identity when the token expires",
      "Design reconnection with backoff plus a resync strategy for missed messages",
      "Fan out events across several Node.js processes using Redis pub/sub",
    ],
    simpleExplanation:
      "A WebSocket starts as a normal HTTP request that asks to upgrade into a long-lived, full-duplex connection: the server answers 101 Switching Protocols and from then on both sides push frames whenever they like, with no headers per message. That makes it ideal for chat, live dashboards and multiplayer state. The hard parts are not the socket itself but everything around it: who is allowed to connect, what happens after a dropped connection, and how broadcasts reach clients connected to other server processes.",
    detailedContent: `
**The handshake.** The client sends a normal HTTP request with \`Upgrade: websocket\`, \`Connection: Upgrade\` and a random \`Sec-WebSocket-Key\`. The server replies:

    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

where the accept value is \`base64(sha1(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))\`. After that, messages are framed binary packets (masked client-to-server), with \`ping\`/\`pong\` keep-alives — HTTP headers are gone forever.

**Rooms and broadcast.** A room is a named set of sockets on one server: \`socket.join("order:o_9")\`, then \`io.to("order:o_9").emit("price.changed", payload)\`. Rooms prevent the naive alternative — iterating every connected socket — and keep subscription state explicit. Always exclude the sender when echo would loop (\`socket.broadcast.to(room)\`), and guard join calls with an ownership check.

**Auth at connect.** Verify the token inside the handshake middleware (\`io.use\`) before the socket is accepted; reject with an error the client can interpret. Re-verify on token expiry with a timer, and disconnect on revocation. Never rely on a later client event to establish identity.

**Reconnection.** Clients reconnect with exponential backoff and jitter (avoid a thundering herd), but reconnection alone loses messages that were sent while offline. Attach a monotonically increasing sequence to every event and let the client ask for "everything since seq 412" after reconnect, or send a fresh snapshot and resume deltas.

**Scale-out.** One Node.js process cannot hold every socket in a load-balanced fleet. With \`@socket.io/redis-adapter\`, each process publishes events to Redis pub/sub and subscribers deliver to their local sockets — rooms and broadcasts work across processes without sticky sessions.
    `,
    howItWorks: `
A price-update flow across two servers:

1. Client A connects to server 1 and joins room \`order:o_9\` (authorised during the handshake).
2. Client B connects to server 2 and joins the same room.
3. A worker publishes \`price.changed\` to Redis channel \`socket.io-bridge\`.
4. Server 1 and server 2 both receive the message; each delivers it only to its local sockets in that room.
5. If client B's connection drops, its SDK reconnects (backoff + jitter), the handshake re-runs with the token, \`socket.join\` is replayed, and the app fetches events since its last sequence number.

Ordering is per publisher: sequence numbers, not wall-clock arrival, decide what "latest" means.
    `,
    codeExamples: [
      {
        title: "Socket.IO server: handshake auth, rooms, broadcast",
        language: "ts",
        code: `import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import jwt from "jsonwebtoken";

const io = new Server(httpServer, { cors: { origin: "https://app.example.com" } });

const pub = createClient({ url: process.env.REDIS_URL });
const sub = pub.duplicate();
await Promise.all([pub.connect(), sub.connect()]);
io.adapter(createAdapter(pub, sub));          // rooms now span every process

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  try {
    const claims = jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ["RS256"] });
    socket.data.user = { id: claims.sub, roles: claims.roles };
    next();
  } catch (err) {
    next(new Error("UNAUTHENTICATED"));        // rejected before 'connect' ever fires
  }
});

io.on("connection", (socket) => {
  socket.on("order:subscribe", async ({ orderId }, ack) => {
    const allowed = await canReadOrder(socket.data.user, orderId);
    if (!allowed) return ack({ error: "FORBIDDEN" });
    socket.join("order:" + orderId);
    ack({ ok: true, seq: await lastSeq(orderId) });
  });

  socket.on("order:message", async ({ orderId, body, seq }, ack) => {
    if (!socket.rooms.has("order:" + orderId)) return ack({ error: "FORBIDDEN" });
    const saved = await persistMessage(orderId, socket.data.user.id, body);
    io.to("order:" + orderId).emit("order:message", { ...saved, seq });
    ack({ ok: true, seq: saved.seq });
  });
});

// elsewhere (a worker or another process):
// io.to("order:o_9").emit("order:typing", { userId, seq });

// hard disconnect when a token expires
io.of("/").use((socket, next) => {
  const ttl = socket.handshake.auth?.exp ?? 0;
  const ms = Math.max(0, ttl * 1000 - Date.now());
  setTimeout(() => socket.disconnect(true), ms);
  next();
});`,
        description:
          "Identity is proven before the socket exists, room membership is authorised per subscription, and every outgoing event carries a sequence number the client can use to resume. The Redis adapter makes broadcasts work when subscribers sit on other processes.",
      },
      {
        title: "Client reconnection with resync",
        language: "ts",
        code: `import { io } from "socket.io-client";

const socket = io("https://api.example.com", {
  auth: { token: getAccessToken() },
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 15000,
  randomizationFactor: 0.5,          // jitter: avoids a reconnect stampede
});

let lastSeq = 0;

socket.on("order:message", (msg) => {
  if (msg.seq <= lastSeq) return;    // dedupe: the server may replay overlaps
  lastSeq = msg.seq;
  renderMessage(msg);
});

socket.io.on("reconnect", async () => {
  // the socket is back, but messages sent while we were down are gone
  const missed = await fetch("/api/v1/orders/o_9/messages?since=" + lastSeq).then((r) => r.json());
  missed.data.forEach((m) => {
    if (m.seq > lastSeq) {
      lastSeq = m.seq;
      renderMessage(m);
    }
  });
  socket.emit("order:subscribe", { orderId: "o_9" }, console.log);
});`,
        description:
          "Backoff with jitter handles the network; sequence numbers handle correctness. Rejoining the room alone is not enough — anything published while disconnected must be fetched over HTTP or replayed by the server.",
      },
    ],
    commonMistakes: [
      "Authenticating after connect with a client-sent event, so an unauthenticated socket is already in memory and can flood you.",
      "Broadcasting to every connected socket instead of a room, which does not scale and leaks data across tenants.",
      "Assuming reconnection restores missed events — without sequence numbers or a snapshot, clients silently show stale state.",
      "Creating the Redis adapter after connections are accepted, or forgetting it in one process, so broadcasts only reach part of the fleet.",
    ],
    bestPractices: [
      "Treat every incoming socket event as untrusted input: validate with a schema, authorise against room membership, rate limit per socket.",
      "Use rooms for fan-out and keep a per-room sequence counter so clients can detect gaps and duplicates.",
      "Log connects, disconnects, join failures and per-event latency — realtime bugs are invisible in normal request logs.",
      "Cap message size and per-socket send rate; one misbehaving client must not exhaust the event loop.",
    ],
    realWorldUseCases: [
      "A chat app keeps one socket per user, joins per conversation room, and scales across processes with a Redis adapter.",
      "Live order tracking streams courier position updates to every viewer of that order.",
      "Collaborative editors and multiplayer games use sockets for both directions, with snapshots over HTTP for initial state.",
    ],
    resources: [
      docs(
        "socket.io — Documentation (v4)",
        "https://socket.io/docs/v4/",
        "Rooms, namespaces, the handshake middleware and the official Redis adapter.",
        "en",
        "reference",
      ),
      docs(
        "MDN — WebSockets API",
        "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API",
        "Client-side reference for the browser WebSocket API and the upgrade handshake.",
        "en",
        "12 min",
      ),
      docs(
        "ws — WebSocket library for Node.js",
        "https://github.com/websockets/ws",
        "Minimal standards-compliant server implementation, useful to see raw frames and upgrade handling.",
        "en",
        "reference",
      ),
      ytSearch(
        "socket.io redis adapter scale out rooms broadcast",
        "Demos of multi-process fan-out and room management.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-handshake",
        title: "Complete the handshake by hand",
        prompt:
          "Compute the Sec-WebSocket-Accept value for the key dGhlIHNhbXBsZSBub25jZQ== (the example from RFC 6455) using Node.js crypto, then write the raw 101 response a plain TCP server would send. Paste the output of your script.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Append the magic GUID 258EAFA5-E914-47DA-95CA-C5AB0DC85B11 to the key, SHA-1 it, then base64 the digest.",
          "The header names are case-insensitive but the value must match exactly.",
        ],
        solution: `import crypto from "node:crypto";

const key = "dGhlIHNhbXBsZSBub25jZQ==";
const guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const accept = crypto.createHash("sha1").update(key + guid).digest("base64");
console.log(accept); // s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

// raw response a server writes:
// HTTP/1.1 101 Switching Protocols\\r\\n
// Upgrade: websocket\\r\\n
// Connection: Upgrade\\r\\n
// Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\\r\\n\\r\\n`,
        solutionLanguage: "js",
      },
      {
        id: "ex-p3m2-room-authz",
        title: "Authorise room joins",
        prompt:
          "Design the subscription flow for a chat app: the client emits conversation:join, the server must verify membership, join the room, and return the last 50 messages plus the current sequence number. Write the server handler, the failure responses (unauthenticated, not a member, unknown conversation), and what the client does on reconnect.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Never join the room before the membership check resolves.",
          "Return a seq so the client can resume with ?since= after a reconnect.",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-booking-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-sse",
    slug: "server-sent-events",
    title: "Server-Sent Events: text/event-stream, Retry and Backpressure",
    description:
      "One-way server push over plain HTTP: the text/event-stream format, event ids and automatic reconnection, backpressure with res.write, and when SSE beats WebSockets.",
    order: 8,
    estimatedMinutes: 20,
    tags: ["sse", "eventsource", "streaming", "http"],
    prerequisites: ["p2m2-express-app", "p3m2-websockets", "p3m2-api-gateways"],
    relatedTopics: [
      "p3m2-realtime-communication",
      "p3m2-webhooks",
      "p3m2-api-gateways",
      "p3m2-rate-limiting-strategies",
    ],
    learningObjectives: [
      "Write a correct text/event-stream response with id, event, data and retry fields",
      "Handle backpressure by respecting res.write() returning false",
      "Clean up subscriptions when the client disconnects to avoid leaked listeners",
      "Choose SSE over WebSockets for a given feature and defend the choice",
    ],
    simpleExplanation:
      "Server-Sent Events let the server push a stream of updates to the browser over an ordinary HTTP response: the body stays open, content type is text/event-stream, and each message is a few lines of text. The browser's EventSource reconnects on its own, remembering the last event id it saw. Because it is just HTTP, your existing proxies, TLS, auth middleware and CORS rules all keep working — which is why SSE is often the simplest realtime tool when updates only flow from server to client.",
    detailedContent: `
**The wire format.** The response begins with the right headers, then never closes:

    HTTP/1.1 200 OK
    Content-Type: text/event-stream
    Cache-Control: no-cache
    Connection: keep-alive
    X-Accel-Buffering: no

Each message is a block of field lines separated by a blank line:

    retry: 5000
    id: 413
    event: price.changed
    data: {"sku":"NP-1","price":4100}

- \`data\` is the payload; multiple \`data:\` lines are joined with newlines (so JSON must be one line).
- \`event\` names the message; without it the client fires \`message\`.
- \`id\` is critical: on reconnect the browser sends \`Last-Event-ID: 413\`, letting the server resume rather than replay everything.
- \`retry\` tells EventSource how long to wait before reconnecting.
- Lines starting with \`:\` are comments — the standard heartbeat that keeps idle connections alive through proxies.

**Backpressure.** \`res.write(chunk)\` returns \`false\` when the kernel buffer is full. If you keep writing anyway, Node buffers in memory until the process dies. Correct behaviour: stop producing (pause the source, cancel the DB cursor) and resume on \`drain\`.

**Cleanup.** Store the unsubscribe function and call it on \`req.on("close")\`. Every leaked interval, Redis subscription or query listener is a slow memory leak multiplied by your connection count.

**SSE or WebSocket?** Prefer SSE when data flows one way (prices, notifications, build logs, live scores), clients are browsers on normal HTTP, and you want EventSource's built-in reconnect. Prefer WebSockets when the client also sends frequent messages, you need binary frames, or you are building a protocol on top of the connection.
    `,
    howItWorks: `
A live price stream:

1. The browser opens \`new EventSource("/api/v1/stream?channel=prices")\` — a plain GET with cookies or a token query param.
2. Express authenticates, sets \`text/event-stream\` headers and flushes them immediately (no buffering).
3. The handler subscribes to a Redis channel or an in-process emitter and writes \`id\`, \`event\` and \`data\` lines for every update.
4. A heartbeat comment is written every 20 seconds so proxies do not reap the idle connection.
5. When the tab closes or the network drops, \`close\` fires, the subscription is torn down, and EventSource reconnects with \`Last-Event-ID\` after \`retry\` milliseconds.

Server-side the connection is just an open HTTP response — no new protocol, no new port.
    `,
    codeExamples: [
      {
        title: "A production-shaped SSE endpoint",
        language: "ts",
        code: `import express from "express";

const app = express();

app.get("/api/v1/stream", authenticate, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",          // disable proxy buffering (nginx)
  });
  res.flushHeaders();

  let seq = Number(req.headers["last-event-id"] ?? req.query.since ?? 0);

  const send = (event, payload) => {
    seq += 1;
    const ok = res.write(
      "id: " + seq + "\\nevent: " + event + "\\ndata: " + JSON.stringify(payload) + "\\n\\n",
    );
    if (!ok) {
      // backpressure: the client cannot keep up, so pause the producer
      prices.pause?.();
      res.once("drain", () => prices.resume?.());
    }
  };

  const unsubscribe = prices.subscribe(req.user.channel, (payload) => send("price.changed", payload));

  const heartbeat = setInterval(() => res.write(": keep-alive\\n\\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();                        // never leak listeners per connection
  });
});`,
        description:
          "Flush headers immediately, resume from Last-Event-ID, honour backpressure from res.write, heartbeat through proxies, and tear everything down on close. Missing any one of these five is the classic SSE bug.",
      },
      {
        title: "Browser client with manual JSON parsing",
        language: "ts",
        code: `const source = new EventSource("/api/v1/stream?channel=prices", {
  withCredentials: true,
});

source.addEventListener("price.changed", (e) => {
  const payload = JSON.parse(e.data);
  renderPrice(payload.sku, payload.price);
});

source.onopen = () => console.log("stream open, last id:", source.readyState);

source.onerror = () => {
  // EventSource retries automatically; retry: on the stream controls the delay
  if (source.readyState === EventSource.CLOSED) {
    // the server answered with a fatal status (401/410) — show a re-auth action
    showReconnectButton();
  }
};`,
        description:
          "readyState tells you whether a retry is coming or the stream is permanently closed — treat a 401 or 410 differently from a transient network blip.",
      },
    ],
    commonMistakes: [
      "Forgetting no-transform / X-Accel-Buffering and watching nginx buffer the whole stream so nothing arrives in real time.",
      "Wrapping data in JSON.stringify but splitting across multiple data lines incorrectly, breaking the client's parse.",
      "Not removing the emitter listener on close, so a busy server leaks one listener per dropped connection.",
      "Using SSE for a chat where the client also sends messages — that needs WebSockets or a separate POST path.",
    ],
    bestPractices: [
      "Add a heartbeat comment every 15–30 seconds and an explicit server-side idle timeout.",
      "Send an id on every event so Last-Event-ID can resume after a reconnect without gaps.",
      "Include a bounded event buffer (or a catch-up URL) so a client that reconnects does not lose updates.",
      "Apply your normal rate limiting and per-user connection caps to streams — they hold resources for minutes.",
    ],
    realWorldUseCases: [
      "GitHub's API exposes SSE streams for repository events and check runs.",
      "Live sports scores, stock tickers and delivery tracking are one-way, high-frequency and ideal for SSE.",
      "Build systems stream log output to the browser with SSE while the client only sends commands over normal POSTs.",
    ],
    resources: [
      docs(
        "MDN — Using server-sent events",
        "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events",
        "The event stream format, Last-Event-ID reconnection and EventSource usage.",
        "en",
        "12 min",
      ),
      docs(
        "MDN — EventSource",
        "https://developer.mozilla.org/en-US/docs/Web/API/EventSource",
        "Client API reference: readyState, error handling and addEventListener for named events.",
        "en",
        "8 min",
      ),
      docs(
        "Express — API reference",
        OFFICIAL.expressApi,
        "res.write, flushHeaders and the response lifecycle used to keep a stream open.",
        "en",
        "reference",
      ),
      ytSearch(
        "server sent events vs websockets when to use SSE",
        "Comparisons with live demos of reconnect, heartbeats and proxies.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-sse-server",
        title: "Stream a queue's status",
        prompt:
          "Build an SSE endpoint /api/v1/jobs/stream that emits job.status events whenever a job changes state. Requirements: resumes from Last-Event-ID, heartbeats every 20s, cleans up on close, and returns 401 for a missing token. Demonstrate two concurrent clients and show that both receive every event.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Use curl -N to keep the connection open in a terminal.",
          "Keep a Set of subscriber callbacks and remove by identity on close.",
        ],
        solution: `app.get("/api/v1/jobs/stream", authenticate, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  let last = Number(req.headers["last-event-id"] ?? 0);
  for (const job of jobsSince(last)) {
    res.write("id: " + job.seq + "\\nevent: job.status\\ndata: " + JSON.stringify(job) + "\\n\\n");
  }

  const onJob = (job) => {
    if (job.seq <= last) return;
    last = job.seq;
    res.write("id: " + job.seq + "\\nevent: job.status\\ndata: " + JSON.stringify(job) + "\\n\\n");
  };

  bus.on("job", onJob);
  const hb = setInterval(() => res.write(": ping\\n\\n"), 20000);

  req.on("close", () => {
    clearInterval(hb);
    bus.off("job", onJob);
  });
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-sse-vs-ws",
        title: "Pick the transport",
        prompt:
          "For five features (live chat, order status updates, collaborative document editing, CI build logs, stock ticker), choose polling, SSE or WebSockets and justify each in one sentence covering: direction of data, frequency, and what the HTTP layer gives you for free.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Ask whether the client sends anything besides acknowledgements.",
          "Low-frequency one-way updates rarely justify a stateful connection at all.",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-analytics-api"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-realtime-communication",
    slug: "choosing-realtime-communication",
    title: "Realtime Communication: Polling, SSE, WebSockets, Ordering and Presence",
    description:
      "A decision framework for choosing a transport, guaranteeing event order with sequence numbers, and modelling who is online without lying after a crash.",
    order: 9,
    estimatedMinutes: 21,
    tags: ["realtime", "polling", "presence", "architecture"],
    prerequisites: ["p3m2-websockets", "p3m2-sse", "p2m5-rate-limiting"],
    relatedTopics: [
      "p3m2-webhooks",
      "p3m2-distributed-api-design",
      "p3m2-api-gateways",
      "p3m2-websockets",
    ],
    learningObjectives: [
      "Compare polling, long polling, SSE and WebSockets on latency, cost and operations",
      "Pick a transport for a feature using data direction and frequency, not preference",
      "Preserve event order across reconnects with sequence numbers and gap detection",
      "Design presence with heartbeats, TTLs and fail-safe expiry",
    ],
    simpleExplanation:
      "Realtime does not automatically mean WebSockets. A poll every 30 seconds may be all a low-frequency feed needs, SSE covers everything that flows one way, and WebSockets earn their operational cost only when the client talks back frequently. Whatever transport you choose, two details decide whether users trust it: events must arrive in order (sequence numbers), and presence must survive crashes (heartbeats with expiry, not a permanent 'online' flag).",
    detailedContent: `
**The transport ladder**, cheapest first:

| Transport | Direction | Latency | Cost to operate | Choose when |
| --- | --- | --- | --- | --- |
| Short polling | client → server | up to interval | lowest | data changes rarely; clients tolerate staleness |
| SSE | server → client | ~instant | low (plain HTTP) | one-way updates, browsers, proxies everywhere |
| WebSockets | both | ~instant | high (stateful, rooms, scaling) | frequent client → server messages, binary, protocols |

Polling with \`ETag\`/\`If-None-Match\` is still excellent: most polls return 304 with a few hundred bytes. Long polling (server holds the request until data or timeout) is a middle ground that is now rarely worth the held-connection complexity.

**Ordering.** Deliver "events 41, 43, 42" is worse than delivering nothing. Give every event a monotonically increasing \`seq\` per stream (or a per-entity version number). Clients drop anything \`seq <= lastSeen\`, detect gaps (\`seq > lastSeen + 1\`) and fetch the missing range over a normal HTTP endpoint. On reconnect, the client asks for \`?since=<lastSeq>\`; if the server no longer keeps that history, it sends a snapshot plus the current seq. Never rely on wall-clock timestamps for ordering — clocks drift.

**Presence.** "Online" is not a fact you can store; it is an observation that expires. Each connection writes a Redis key \`presence:user_42\` with a TTL of roughly three heartbeat intervals. Heartbeats refresh the TTL; when a process crashes, the key simply expires and the user is marked offline — a crash-safe design by construction. Emit join/leave events on transitions only, and jitter heartbeats so a thousand clients do not refresh in the same second.

Anti-herd rule for any realtime system: reconnects, heartbeats and retries all need random jitter or a deploy becomes a thundering herd against your own gateway.
    `,
    howItWorks: `
Choosing for a delivery-tracking screen:

1. The courier app posts position updates (client → server) — a normal POST, no socket needed.
2. The customer's browser needs to see those updates (server → client): SSE fits perfectly, one connection, EventSource reconnects for free.
3. If the customer could also send chat messages to the courier, that pair becomes bidirectional and frequent → WebSockets for the room, with the position updates published into the same room.
4. Every update carries \`seq\`; the browser keeps \`lastSeq\` and on reconnect calls \`GET /api/v1/deliveries/88/events?since=lastSeq\` before resuming the stream.

Presence for the courier (online/offline) is a Redis key refreshed by each heartbeat, expiring automatically after a crash.
    `,
    codeExamples: [
      {
        title: "Sequence numbers make reconnects safe",
        language: "ts",
        code: `// server: every event for a stream is numbered before it is published
async function publish(streamId, type, payload) {
  const seq = await redis.incr("seq:" + streamId);
  const event = { streamId, seq, type, payload, at: Date.now() };
  await redis.xadd("events:" + streamId, "*", "json", JSON.stringify(event));
  bus.emit(streamId, event);
  return event;
}

// catch-up over plain HTTP — works with any transport
app.get("/api/v1/streams/:id/events", authenticate, async (req, res) => {
  const since = Number(req.query.since ?? 0);
  const events = await redis.xrange("events:" + req.params.id, since + 1, "+", 100);
  res.json({ data: events, lastSeq: events.at(-1)?.seq ?? since });
});`,
        description:
          "The stream is the source of truth; the socket or SSE connection is only a fast path. A client that missed events recovers the gap over HTTP instead of hoping the push layer replays them.",
      },
      {
        title: "Crash-safe presence with a TTL",
        language: "ts",
        code: `const HEARTBEAT_MS = 15000;
const TTL_SECONDS = 45;                         // three missed heartbeats = offline

async function goOnline(userId, socketId) {
  await redis.hset("presence:" + userId, socketId, String(Date.now()));
  await redis.expire("presence:" + userId, TTL_SECONDS);
  await publishPresence(userId, "online");
}

async function heartbeat(userId, socketId) {
  await redis.hset("presence:" + userId, socketId, String(Date.now()));
  await redis.expire("presence:" + userId, TTL_SECONDS);   // crash => key expires on its own
}

setInterval(() => {
  for (const socket of onlineSockets) {
    // jitter so a fleet does not refresh in the same millisecond
    setTimeout(() => heartbeat(socket.data.user.id, socket.id), Math.random() * 3000);
  }
}, HEARTBEAT_MS);

// an expiry watcher (or a periodic scan) flips users offline when their key disappears
redis.subscribe("__keyevent@0__:expired", (key) => {
  if (key.startsWith("presence:")) publishPresence(key.slice(9), "offline");
});`,
        description:
          "There is no 'offline' write on disconnect — expiry IS the offline signal, so a crashed process cannot leave ghosts. The TTL is deliberately a few heartbeat periods so a single dropped packet does not flicker presence.",
      },
    ],
    commonMistakes: [
      "Reaching for WebSockets for a feature where one SSE stream (or 30-second polling) would do, then inheriting rooms, adapters and sticky sessions for nothing.",
      "Ordering by timestamp instead of a sequence number, so two events written in the same millisecond arrive swapped.",
      "Setting presence to false only in the disconnect handler, which never runs when the process crashes — ghosts stay online forever.",
      "Refreshing heartbeats in lockstep, so a restart reconnects ten thousand clients in the same second and knocks over the gateway.",
    ],
    bestPractices: [
      "Decide the transport from a table (direction, frequency, client type) and write the choice down in the design doc.",
      "Give every realtime event a sequence number and ship a catch-up HTTP endpoint alongside it.",
      "Model presence as a TTL key refreshed by heartbeats; treat expiry as the only offline signal.",
      "Add jitter to reconnects, heartbeats and retries; cap concurrent connections per user and per tenant.",
    ],
    realWorldUseCases: [
      "A food-delivery map uses SSE for the customer, POSTs from the courier and presence keys to show the courier's availability.",
      "An operations dashboard polls at 60s normally and switches to SSE during an incident window — same backend events, different transports.",
      "A chat app combines WebSocket rooms with an HTTP history endpoint so reconnecting clients fill gaps deterministically.",
    ],
    resources: [
      docs(
        "MDN — WebSockets API",
        "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API",
        "The bidirectional option: handshake, events and browser support.",
        "en",
        "12 min",
      ),
      docs(
        "MDN — Using server-sent events",
        "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events",
        "The one-way option: event streams, ids and automatic reconnection.",
        "en",
        "12 min",
      ),
      docs(
        "Redis — Documents",
        OFFICIAL.redisDocs,
        "TTLs, streams and pub/sub underpin presence, catch-up buffers and multi-process fan-out.",
        "en",
        "reference",
      ),
      ytSearch(
        "polling vs long polling vs sse vs websockets comparison",
        "Side-by-side latency and complexity comparisons for each transport.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-transport-table",
        title: "Fill the decision table",
        prompt:
          "For six features (typing indicators, stock ticker, support chat, build log, multi-cursor editor, notification badge) fill a table: direction, updates per minute, chosen transport, and the single strongest reason against your choice. Then write the rule of thumb you would put in your team's engineering handbook.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Below roughly one update per minute, polling with ETag is usually unbeatable on cost.",
          "If the client sends more than an acknowledgement per second, think WebSockets.",
        ],
      },
      {
        id: "ex-p3m2-ordering",
        title: "Prove ordering under reconnect",
        prompt:
          "Design a test that delivers events 1–5, drops the connection, publishes 6–9, reconnects, and asserts the client renders 1–9 exactly once in order. Include the failure mode where the server replays overlapping events and how seq guards against it. Write the test with vitest.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Assert on the rendered sequence array, not on individual callbacks.",
          "Include an intentional duplicate in the replay to prove dedupe works.",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-job-processing"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-webhooks",
    slug: "webhooks",
    title: "Webhooks: Signatures, Retries and Idempotent Receiving",
    description:
      "Outbound push done properly: HMAC signature verification over the raw body, retry policy with backoff, deduplicating deliveries by event id, and queueing before you process.",
    order: 10,
    estimatedMinutes: 24,
    tags: ["webhooks", "hmac", "security", "async"],
    prerequisites: ["p2m5-idempotency", "p2m5-error-response-formats", "p2m6-jwt-access-tokens"],
    relatedTopics: [
      "p3m2-idempotent-operations",
      "p3m2-sse",
      "p3m2-api-deprecation",
      "p3m2-rate-limiting-strategies",
    ],
    learningObjectives: [
      "Sign an outgoing webhook with HMAC and verify one with constant-time comparison",
      "Write a retry policy with backoff, jitter and a disable rule for dead endpoints",
      "Make receiving idempotent by deduplicating on the provider's event id",
      "Respond fast by queueing work instead of processing inside the webhook handler",
    ],
    simpleExplanation:
      "A webhook is your API calling someone else's: when something happens, you POST a JSON payload to a URL the customer registered. Because the receiver cannot know who really sent it, you sign each delivery with an HMAC computed from a shared secret and the exact request bytes; the receiver recomputes and compares. Because the network retries, the same event may arrive many times — so you include an event id and the receiver stores ids to drop duplicates. And because processing can be slow, the receiver should acknowledge in milliseconds and do the work on a queue.",
    detailedContent: `
**Signing.** Compute \`hex(HMAC_SHA256(secret, timestamp + "." + rawBody))\` and send it as a header alongside the timestamp and a unique event id:

    X-Signature-256: t=1728000000,v1=5257a869e7ecebeda32affa62cdca3fa...
    X-Event-Id: evt_3kd9n
    X-Event-Type: invoice.paid

Include the timestamp in the signed payload so a captured request cannot be replayed tomorrow; reject anything older than five minutes. Verify with \`crypto.timingSafeEqual\` on equal-length buffers — \`===\` leaks timing information. The verification **must** run against the raw body bytes: verify before \`express.json()\` parses and re-serialises, or store the raw buffer in \`req.rawBody\`.

**Retries.** Deliveries that do not answer 2xx within your timeout (say 10s) are retried with exponential backoff and jitter — for example at 1m, 5m, 30m, 2h and 6h. Honour \`410 Gone\` as "stop sending, this endpoint is retired", and honour \`Retry-After\` when present. After the final failure, mark the endpoint disabled and surface it in the customer's dashboard.

**Idempotent receiving.** The same \`X-Event-Id\` may arrive five times. Store it with a unique constraint; a second insert conflicts and you return 200 immediately without re-processing. Never make "process the event" and "record the id" two separate transactions with no ordering — a crash between them resurrects the duplicate.

**Queue before processing.** Verify, insert the event id, enqueue a job, answer 202. Your handler stays fast, retries become harmless, and the worker can apply its own retry policy with a dead-letter queue.
    `,
    howItWorks: `
An \`invoice.paid\` event travelling to a customer:

1. Your billing service commits the payment and writes an outbox row (same transaction).
2. A worker reads the outbox, builds the payload, signs it with that endpoint's secret and POSTs with a 10s timeout.
3. The customer's server verifies the signature over the raw body, checks the timestamp, and inserts the event id into a unique-indexed table.
4. If the insert conflicts (duplicate), it answers 200 and stops. Otherwise it enqueues \`handleInvoicePaid\` and answers 202.
5. The worker processes; if it throws, the job retries with backoff; after N attempts it lands in a DLQ with the payload intact for replay.
6. If two consecutive deliveries time out, the sender keeps retrying per policy — and after the last attempt, disables the endpoint and notifies the customer.
    `,
    codeExamples: [
      {
        title: "Verify a signature over the raw body",
        language: "ts",
        code: `import crypto from "node:crypto";
import express from "express";

// keep the raw bytes: express.json() would destroy the signed representation
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const header = req.headers["x-signature-256"] ?? "";
    const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")));
    const timestamp = parts.t;
    const sent = parts.v1 ?? "";

    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
      return res.status(400).json({ error: { code: "STALE_DELIVERY", message: "Timestamp outside tolerance." } });
    }

    const expected = crypto
      .createHmac("sha256", process.env.WEBHOOK_SECRET)
      .update(timestamp + "." + req.body.toString("utf8"))
      .digest("hex");

    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sent, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: { code: "BAD_SIGNATURE", message: "Signature mismatch." } });
    }

    res.status(202).json({ accepted: true });
  },
);`,
        description:
          "Raw body, timestamp inside the signed message, five-minute replay window, constant-time comparison. This is the same shape Stripe, GitHub and Stripe-style providers use — copy their header names so customers can reuse tooling.",
      },
      {
        title: "Idempotent receiving with a queue",
        language: "ts",
        code: `async function handleWebhook(req, res) {
  const eventId = req.headers["x-event-id"];
  const type = req.headers["x-event-type"];

  try {
    await db.webhookEvents.insertOne({ _id: eventId, type, receivedAt: new Date() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ duplicate: true });   // already seen: ack and stop
    }
    throw err;
  }

  await queue.add(type, { eventId, payload: req.body }, {
    attempts: 5,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: { age: 7 * 24 * 3600 },
  });

  res.status(202).json({ accepted: true, eventId });
}

// worker: the job itself is still idempotent, because retries re-run it
async function processInvoicePaid(job) {
  const already = await db.processedEvents.findOne({ _id: job.data.eventId });
  if (already) return;

  await billing.markPaid(job.data.payload.invoiceId);
  await db.processedEvents.insertOne({ _id: job.data.eventId, at: new Date() });
}`,
        description:
          "The unique index on the event id is the dedupe mechanism; 202 keeps the sender's timeout comfortable; the worker double-checks because queue retries can still duplicate a job after a crash between two operations.",
      },
    ],
    commonMistakes: [
      "Verifying the signature against JSON.parse(JSON.stringify(body)) — any key reordering breaks every signature.",
      "Using === for hex digests, which is both timing-unsafe and unforgiving about padding differences.",
      "Processing heavy work (calling three APIs, generating a PDF) inside the webhook handler, so the sender times out and retries forever.",
      "Storing events in a table without a unique index on the event id, making dedupe a race you always lose under retries.",
    ],
    bestPractices: [
      "Copy the header conventions of a major provider (Stripe/GitHub) so customers can reuse their verification code.",
      "Log every delivery attempt with event id, attempt number, status and latency — support tickets always need this.",
      "Expose an endpoint dashboard: last success, last failure, consecutive failures, disable state.",
      "Give each endpoint its own secret and support rotation with an overlap window where either secret validates.",
    ],
    realWorldUseCases: [
      "Stripe sends signed events for payments, refunds and disputes; unverified receivers can be spoofed into granting goods.",
      "CI systems notify via webhooks on push and build results, and receivers must survive duplicate deliveries after a timeout.",
      "Your own platform can use outbound webhooks for partners while consuming inbound ones — same patterns both directions.",
    ],
    resources: [
      docs(
        "Stripe — Webhooks",
        "https://docs.stripe.com/webhooks",
        "The reference design for signatures, retries, endpoint management and test deliveries.",
        "en",
        "reference",
      ),
      docs(
        "GitHub — Webhooks",
        "https://docs.github.com/en/webhooks",
        "Payload formats, secret handling and delivery semantics from another major provider.",
        "en",
        "reference",
      ),
      docs(
        "Node.js — crypto.createHmac",
        "https://nodejs.org/api/crypto.html#cryptocreatehmackey-digest-output",
        "How to compute the HMAC used by every serious webhook signature scheme.",
        "en",
        "8 min",
      ),
      ytSearch(
        "webhook signature verification retry policy idempotency",
        "End-to-end walkthroughs of signing, verifying and surviving duplicates.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-webhook-verify",
        title: "Break then fix verification",
        prompt:
          "Write a receiver that verifies a signature using req.body after express.json(), prove with curl that a valid payload fails verification, then fix it (raw body or req.rawBody) and show the passing curl command including the computed HMAC. Include a replay test: the same request 10 minutes later must be rejected.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "express.raw({ type: 'application/json' }) keeps the bytes intact on that route.",
          "Compute the header in PowerShell or Node from timestamp + '.' + body.",
        ],
        solution: `import crypto from "node:crypto";
import express from "express";

const app = express();
app.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  const raw = req.body.toString("utf8");
  const [t, v1] = String(req.headers["x-signature-256"]).split(",").map((s) => s.split("=")[1]);

  if (Math.floor(Date.now() / 1000) - Number(t) > 300) {
    return res.status(400).json({ error: { code: "STALE_DELIVERY" } });
  }

  const expected = crypto.createHmac("sha256", "s3cret").update(t + "." + raw).digest("hex");
  const ok = crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  if (!ok) return res.status(401).json({ error: { code: "BAD_SIGNATURE" } });

  res.status(202).json({ accepted: true });
});

// test:
// node -e "const c=require('crypto');const t=Math.floor(Date.now()/1000);const raw='{\\"id\\":1}';
// const s=c.createHmac('sha256','s3cret').update(t+'.'+raw).digest('hex');
// console.log(\`curl -X POST http://localhost:3000/webhooks -H 'content-type: application/json' -H 'x-signature-256: t=\${t},v1=\${s}' -d '\${raw}'\`)"`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-retry-policy",
        title: "Write the retry policy",
        prompt:
          "Design the outbound retry policy for webhooks: timeout, attempt schedule with backoff, what response codes count as success, how 429 and Retry-After are honoured, when an endpoint is disabled, and how the customer is notified and can replay missed events. Express the schedule as a table.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "410 Gone should stop retries immediately — the customer retired the endpoint.",
          "A replay window backed by stored event bodies is what makes the dashboard's 'resend' button possible.",
        ],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-job-processing"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-idempotent-operations",
    slug: "idempotent-operations-deep-dive",
    title: "Idempotent Operations: A Deep Dive on Idempotency Keys",
    description:
      "How Idempotency-Key actually works: atomic claiming, storage choices, TTLs, response replay, and the race between two identical in-flight requests.",
    order: 11,
    estimatedMinutes: 25,
    tags: ["idempotency", "retries", "redis", "api-design"],
    prerequisites: ["p2m5-idempotency", "p2m5-rest-principles", "p2m5-error-response-formats"],
    relatedTopics: [
      "p3m2-webhooks",
      "p3m2-distributed-api-design",
      "p3m2-rate-limiting-strategies",
      "p3m2-advanced-rest-design",
    ],
    learningObjectives: [
      "Explain the full lifecycle of an Idempotency-Key from claim to replay",
      "Implement atomic key claiming with Redis SET NX and a database-backed alternative",
      "Store and replay the original response, including its status code",
      "Handle the concurrency race and the same-key-different-body case",
    ],
    simpleExplanation:
      "Clients on flaky networks cannot tell whether a timed-out POST actually succeeded, so they retry — and a naive server charges twice. An Idempotency-Key fixes that: the client generates a UUID per logical operation and sends it on every attempt; the server atomically claims that key, and any later request with the same key gets the first response replayed instead of the work running again. The hard parts are the atomic claim, how long to remember (TTL) and what to do when two copies arrive at the same instant.",
    detailedContent: `
**The protocol.** The client sends \`Idempotency-Key: 8f2c0a9e-…\` on the POST. The server then:

1. **Claims the key atomically.** \`SET idem:<key> IN_PROGRESS EX 86400 NX\` in Redis — \`NX\` means "only if it does not exist", so exactly one request wins.
2. **Checks for a replay.** If the claim failed, read the existing value:
   - value is a completed record → **replay**: return the stored status and body verbatim, plus a header such as \`Idempotency-Replayed: true\`.
   - value is \`IN_PROGRESS\` → the twin is still executing: answer \`409 Conflict\` (or \`425 Too Early\`) with \`Retry-After\`, never run the work a second time.
3. **Rejects mismatched payloads.** Hash the method, path and body; if the same key arrives with a different hash, answer 422 \`IDEMPOTENCY_KEY_REUSED\` — the client is confused, not retrying.
4. **Executes the operation** and stores the outcome: \`{ status: 201, body: {...} }\` under the key, extending the TTL.
5. **Replays forever after** (within the TTL) with the byte-identical body, because clients may retry minutes later after reading a timeout page.

**Storage.** Redis is the fast path but is not durable by default; for payments-grade work, also persist to a table (\`idempotency_keys(key, request_hash, status, response_body, created_at)\`) with a unique primary key, or use a write-behind so a Redis restart cannot cause double-charges.

**TTL.** 24 hours is the common default (Stripe uses it): long enough to cover client retries and support investigations, short enough to bound storage. Document it — a client retrying on day two is outside the guarantee.

**Crash window.** If the process dies after executing but before storing, the key expires as IN_PROGRESS and a later retry re-executes. Narrow this by keeping the execute-and-store window small, storing a durable record before returning, and treating a stale IN_PROGRESS older than your maximum request time as failed.
    `,
    howItWorks: `
Two copies of the same charge arriving:

1. Both carry \`Idempotency-Key: k_1\`. Both reach Redis at nearly the same time.
2. Request A wins \`SET NX\` and proceeds; request B's SET fails, so it reads the value, sees \`IN_PROGRESS\`, and answers 409 with Retry-After.
3. A calls the payment provider once, writes \`{status:201, body:{id:"ch_1"}}\` and returns the same body.
4. A mobile client that never saw A's response retries 30 seconds later with the same key: the claim fails, the stored 201 is found, and the response is replayed — one charge, two 201s.
5. After 24 hours the key expires; a retry after that would create a new charge, which is why the TTL is part of the published contract.
    `,
    codeExamples: [
      {
        title: "Idempotency middleware with Redis",
        language: "ts",
        code: `import crypto from "node:crypto";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
const TTL_SECONDS = 24 * 3600;

export function idempotent(handler) {
  return async (req, res) => {
    const key = req.header("Idempotency-Key");
    if (!key) {
      return res.status(400).json({ error: { code: "IDEMPOTENCY_KEY_REQUIRED", message: "Send Idempotency-Key." } });
    }

    const redisKey = "idem:" + req.user.id + ":" + key;
    const requestHash = crypto
      .createHash("sha256")
      .update(req.method + req.originalUrl + JSON.stringify(req.body ?? {}))
      .digest("hex");

    const claimed = await redis.set(redisKey, "IN_PROGRESS", "EX", TTL_SECONDS, "NX");

    if (claimed !== "OK") {
      const stored = await redis.get(redisKey);
      if (stored === "IN_PROGRESS") {
        return res.status(409).json({
          error: { code: "IN_PROGRESS", message: "An identical request is still running." },
        });
      }
      const record = JSON.parse(stored);
      if (record.requestHash !== requestHash) {
        return res.status(422).json({
          error: { code: "IDEMPOTENCY_KEY_REUSED", message: "Same key, different payload." },
        });
      }
      res.set("Idempotency-Replayed", "true");
      return res.status(record.status).json(record.body);
    }

    try {
      const result = await handler(req);            // returns { status, body }
      await redis.set(
        redisKey,
        JSON.stringify({ requestHash, status: result.status, body: result.body }),
        "EX",
        TTL_SECONDS,
      );
      res.status(result.status).json(result.body);
    } catch (err) {
      await redis.del(redisKey);                    // failed attempt: allow an honest retry
      throw err;
    }
  };
}

app.post("/api/v1/charges", authenticate, idempotent(async (req) => {
  const charge = await payments.create({ amountCents: req.body.amountCents, userId: req.user.id });
  return { status: 201, body: { data: charge } };
}));`,
        description:
          "SET NX is the atomic claim that makes concurrent duplicates safe; the stored record carries the request hash, the status and the body, so a replay is byte-identical and a mismatched payload is rejected. Deleting the key on failure keeps honest retries possible after a server error.",
      },
      {
        title: "Durable keys in PostgreSQL",
        language: "sql",
        code: `CREATE TABLE idempotency_keys (
  key           uuid          NOT NULL,
  user_id       uuid          NOT NULL,
  request_hash  char(64)      NOT NULL,
  status        int           NOT NULL,
  response_body jsonb         NOT NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- claim is a single INSERT; the unique primary key does the atomicity
INSERT INTO idempotency_keys (key, user_id, request_hash, status, response_body)
VALUES ($1, $2, $3, 201, $4)
ON CONFLICT (user_id, key) DO NOTHING;`,
        description:
          "The database gives the same atomic claim as SET NX and survives a Redis restart — the choice for money-moving endpoints. Pair it with a scheduled job that deletes rows older than your TTL.",
      },
    ],
    commonMistakes: [
      "Checking 'does the key exist' and then inserting in two steps — both copies pass the check and both execute; use SET NX or INSERT … ON CONFLICT.",
      "Replaying only the body but not the original status code, so a retried creation answers 200 where the client expects 201.",
      "Not namespacing keys per user, letting one tenant probe or collide with another tenant's operations.",
      "Returning the stored response for a key whose request body differs — the second operation never ran but the client believes it did.",
    ],
    bestPractices: [
      "Require the header on every money-moving POST and document the TTL in your API reference.",
      "Namespace keys by user or tenant, and validate the key format (UUID) to bound storage.",
      "Add the Idempotency-Replayed header so clients and support can tell a replay from a fresh execution.",
      "Record metrics: replay rate, 409 rate and key reuse errors — spikes usually mean a client bug or an outage.",
    ],
    realWorldUseCases: [
      "Stripe requires Idempotency-Key on every POST; a retried payment after a timeout returns the original charge instead of double-charging.",
      "Booking APIs use keys so a double-tapped 'confirm reservation' cannot create two seats.",
      "Background workers reuse the same pattern with job ids, which are just idempotency keys generated by the queue.",
    ],
    resources: [
      docs(
        "Stripe — Idempotent requests",
        "https://docs.stripe.com/api/idempotent_requests",
        "The protocol that made Idempotency-Key a de-facto industry standard.",
        "en",
        "12 min",
      ),
      docs(
        "RFC 9110 — HTTP Semantics (idempotent methods)",
        OFFICIAL.rfcHttp,
        "The spec-level definition of idempotency that safe retries depend on.",
        "en",
        "reference",
      ),
      docs(
        "Redis — SET",
        "https://redis.io/docs/latest/commands/set/",
        "NX, EX and the atomic claim that makes concurrent duplicates safe.",
        "en",
        "5 min",
      ),
      ytSearch(
        "idempotency keys explained how stripe handles retries",
        "Walkthroughs of claim, execute, store and replay flows.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-idem-middleware",
        title: "Prove a double-submit is safe",
        prompt:
          "Implement the middleware above, then with two parallel curl commands (same Idempotency-Key, same body) show: one 201 with a new id, one 409 or a replayed 201, and exactly one row in the database. Then change the body on the third request with the same key and show the 422. Paste the outputs.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Use bash & or PowerShell Start-Job to fire both requests at once.",
          "Count rows before and after to prove the work ran once.",
        ],
        solution: `# terminal 1
curl -s -X POST http://localhost:3000/api/v1/charges \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f2c0a9e-1111-4222-8333-abcdefabcdef" \\
  -d '{"amountCents":4200}'

# terminal 2 (immediately)
curl -s -i -X POST http://localhost:3000/api/v1/charges \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f2c0a9e-1111-4222-8333-abcdefabcdef" \\
  -d '{"amountCents":4200}'
# expect: 409 IN_PROGRESS, or a replayed 201 with Idempotency-Replayed: true

# third request, same key, different body
curl -s -X POST http://localhost:3000/api/v1/charges \\
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 8f2c0a9e-1111-4222-8333-abcdefabcdef" \\
  -d '{"amountCents":9900}'
# expect: 422 IDEMPOTENCY_KEY_REUSED`,
        solutionLanguage: "bash",
      },
      {
        id: "ex-p3m2-ttl-contract",
        title: "Design the TTL contract",
        prompt:
          "Decide the idempotency TTL for three operations (charge a card, create a booking, update a notification preference). Justify each with: how long a client might retry, storage cost, and the business damage of a re-execution after the TTL. Write the exact wording you would put in the API documentation.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Money operations need the longest window; a preference update is safely repeatable anyway.",
          "The documentation sentence should state both the guarantee and its expiry.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-rate-limiting-strategies",
    slug: "rate-limiting-strategies",
    title: "Rate Limiting Strategies: Token Buckets, Windows and Distributed Counters",
    description:
      "Token bucket, leaky bucket, sliding windows and fixed windows — what each guarantees, how to apply per-tenant tiers, and how to keep accurate counters in Redis across many processes.",
    order: 12,
    estimatedMinutes: 23,
    tags: ["rate-limiting", "redis", "algorithms", "multi-tenancy"],
    prerequisites: ["p2m5-rate-limiting", "p2m5-error-response-formats", "p2m6-role-based-access-control"],
    relatedTopics: [
      "p3m2-api-gateways",
      "p3m2-distributed-api-design",
      "p3m2-idempotent-operations",
      "p3m2-websockets",
    ],
    learningObjectives: [
      "Describe token bucket, leaky bucket, sliding window and fixed window, including their burst behaviour",
      "Apply per-tenant and per-key limits driven by a tier configuration",
      "Implement a distributed token bucket atomically in Redis with a Lua script",
      "Emit standard limit headers and choose fail-open versus fail-closed deliberately",
    ],
    simpleExplanation:
      "Rate limiting protects your API from both attackers and accidental loops, but different algorithms allow different traffic shapes. A token bucket stores up to a burst of requests and refills steadily, which is what most APIs want. A sliding window is more precise about counts per minute, while fixed windows are simple but allow a double burst at the boundary. Because you run many Node.js processes, the counters themselves must live in one shared place — Redis — and be updated atomically, usually by a Lua script.",
    detailedContent: `
**Token bucket.** State: \`tokens\` (0..capacity) and the last refill time. Each request consumes one token; tokens refill at \`rate\` per second. Empty bucket means 429. Burst = full capacity, sustained rate = refill rate — this is the model most APIs want, because a client can spike after idle time without being permanently penalised.

**Leaky bucket.** Requests enter a queue that drains at a constant output rate. Excess queue depth means 429 (or shaping delay). This **smooths** traffic rather than merely counting it — good for protecting a downstream that cannot take bursts, bad for UX if you queue user-facing calls.

**Sliding window log.** Keep every timestamp in a sorted set, remove those outside the window, count what remains: exact, but memory grows with request volume. **Sliding window counter** approximates with \`count = previous*overlap + current\`, which is cheap and close enough for most APIs. **Fixed window** (INCR per minute) is simplest but allows up to 2× the limit across a boundary (59s of one window plus 1s of the next).

**Per-tenant limits.** Key the limiter by \`<tier>:<tenantId>\` (or user, or API key), read the tier from your plan table: free = 60/min, pro = 600/min, enterprise = 6000/min. Always keep a global per-IP limit underneath so an attacker with many keys still hits a ceiling, and isolate noisy tenants so one customer's loop cannot consume the whole fleet's budget.

**Distributed counters.** Naive \`get → incr → set\` in Node.js races between processes. Use one atomic step:

    INCR rl:tenant_12:20261014T1230
    if count == 1 then EXPIRE key 60

…or a Lua script for a full token bucket (read tokens and timestamp, refill, decide, write back). Put the decision server-side in one place (gateway or shared middleware), return \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\` and \`429\` with \`Retry-After\`, and decide explicitly whether a Redis outage means **fail-open** (accept traffic, log loudly) or **fail-closed** (reject with 503) — for money endpoints, usually fail-closed with a short circuit.
    `,
    howItWorks: `
One request through a token-bucket limiter:

1. The gateway extracts the key: API key → tenant → tier "pro" (600 rpm, burst 100).
2. It runs the Lua script with \`now\`, \`rate\`, \`capacity\` and the Redis key.
3. The script refills tokens based on elapsed time (with fractional precision), subtracts one, and returns the new balance plus the wait time if empty.
4. If tokens remain, the request proceeds with \`X-RateLimit-Remaining: 97\`. If not, the script returns a retry delay and the gateway answers 429 with \`Retry-After\`.
5. The decision is recorded in Redis, so every other process sees the same remaining budget — the limit is per tenant, not per server.

A burst of 100 requests in one second drains the bucket; the next request waits until one token refills.
    `,
    codeExamples: [
      {
        title: "The token bucket, written in Lua",
        language: "lua",
        code: `-- token-bucket.lua — evaluated atomically inside Redis (EVAL)
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])   -- tokens per second
local capacity = tonumber(ARGV[3])

local data   = redis.call("HMGET", key, "tokens", "ts")
local tokens = tonumber(data[1]) or capacity
local ts     = tonumber(data[2]) or now

local delta = math.max(0, now - ts)
tokens = math.min(capacity, tokens + delta * rate)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call("HSET", key, "tokens", tokens, "ts", now)
redis.call("EXPIRE", key, math.ceil(capacity / rate) * 2)

return { allowed, tokens, math.ceil((1 - tokens) / rate) }`,
        description:
          "Read, refill, decide and write back in one script: Redis runs Lua scripts one at a time, so no other process can interleave between the read and the write. Fractional tokens give an exact refill rate.",
      },
      {
        title: "Evaluating the bucket from Express",
        language: "ts",
        code: `import { readFileSync } from "node:fs";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);
const TOKEN_BUCKET = readFileSync("./token-bucket.lua", "utf8");

async function takeToken(tenantId, tier) {
  const [allowed, remaining, retryAfterSeconds] = await redis.eval(
    TOKEN_BUCKET,
    1,
    "rl:token:" + tenantId,
    String(Date.now() / 1000),
    String(tier.ratePerSecond),
    String(tier.burst),
  ).then((r) => r.map(Number));

  return { allowed: allowed === 1, remaining, retryAfterSeconds };
}

app.use(async (req, res, next) => {
  const tier = await tiers.forTenant(req.user.tenantId);
  const { allowed, remaining, retryAfterSeconds } = await takeToken(req.user.tenantId, tier);

  res.set({
    "X-RateLimit-Limit": String(tier.burst),
    "X-RateLimit-Remaining": String(Math.floor(remaining)),
  });

  if (!allowed) {
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many requests.", retryAfterSeconds },
    });
  }
  next();
});`,
        description:
          "Thousands of Node.js processes share one budget because the whole decision happens inside Redis. The tier comes from your plan table, never from a client-supplied header.",
      },
    ],
    commonMistakes: [
      "Implementing the limiter with get-then-incr in application code, which loses counts under concurrency between processes.",
      "Keying limits per process instead of per tenant, so the real limit multiplies by your instance count.",
      "Ignoring burst: a pure fixed window punishes a client that legitimately spikes once per minute.",
      "Returning 429 with no Retry-After and no remaining-budget headers, so clients either hammer you or wait far too long.",
    ],
    bestPractices: [
      "Start with a token bucket per tenant plus a global per-IP ceiling; revisit only if you have a concrete shaping need.",
      "Run the decision in one Lua script so refill, subtract and write are atomic.",
      "Expose X-RateLimit-* headers on every response, not just on 429s, so clients can slow down before they are blocked.",
      "Load-test the limiter itself: it sits on the hot path of every request.",
    ],
    realWorldUseCases: [
      "Multi-tenant SaaS: per-plan rpm limits with per-IP abuse caps, enforced at the gateway with Redis counters.",
      "Public API tiers (free/pro/enterprise) whose pricing is literally the numbers in the limiter configuration.",
      "Scraping protection: a tight per-IP sliding window in front of expensive search endpoints.",
    ],
    resources: [
      docs(
        "express-rate-limit",
        OFFICIAL.expressRateLimit,
        "In-memory limiter middleware — useful as a starting point, with clear docs on why memory is per-process.",
        "en",
        "10 min",
      ),
      docs(
        "Redis — Documents",
        OFFICIAL.redisDocs,
        "INCR, EXPIRE, sorted sets and Lua scripting for atomic distributed counters.",
        "en",
        "reference",
      ),
      docs(
        "RFC 9110 — HTTP Semantics",
        OFFICIAL.rfcHttp,
        "429 Too Many Requests and Retry-After semantics that clients and SDKs rely on.",
        "en",
        "reference",
      ),
      ytSearch(
        "token bucket vs sliding window vs leaky bucket rate limiting",
        "Algorithm comparisons with worked numeric examples.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-algorithm-math",
        title: "Work the numbers",
        prompt:
          "Capacity 10, refill 2 per second, client sends 10 requests instantly then 1 request every 400ms for 5 seconds. Trace the token count second by second and say which requests are rejected under a token bucket. Then compute what the same trace does under a fixed 10-per-minute window, including the boundary burst at 59s/0s.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Refill happens continuously: 400ms adds 0.8 tokens, so fractional accounting matters.",
          "A fixed window allows the last requests of one window plus the first of the next back to back.",
        ],
        solution: `Token bucket (capacity 10, rate 2/s):
t=0.0  send 10 -> 10 accepted, tokens 0
t=0.4  send 1  -> tokens 0.8 < 1 -> REJECTED, retry in 100ms
t=0.8  send 1  -> tokens 1.6 -> accepted, tokens 0.6
t=1.2  send 1  -> tokens 1.4 -> accepted, tokens 0.4
... from here every 400ms adds 0.8 and each send costs 1, so the
    bucket slowly drains: after ~5s tokens hover near 0 and roughly
    every third or fourth request is rejected. Sustained rate = 2/s.

Fixed window (limit 10 per minute):
requests 1-10 accepted in second 0; the window then allows up to 10
more immediately at second 60. Across the 59s/60s boundary a client
can send 20 requests back to back — twice the intended rate — which
is exactly the fixed-window boundary problem.`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-tier-limiter",
        title: "Ship per-tenant tiers",
        prompt:
          "Write the configuration and middleware for three tiers (free 60/min burst 10, pro 600/min burst 100, enterprise 6000/min burst 500) plus a global per-IP limit. Include the headers you set, the 429 body, and what your service does when Redis times out (justify fail-open or fail-closed for this product).",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Look the tier up from the authenticated tenant, never from a client-supplied header.",
          "Fail-open needs a loud metric and an alert, or you will not notice an outage silently allowing traffic.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-capstone"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-distributed-api-design",
    slug: "distributed-api-design",
    title: "Distributed API Design: Statelessness, Consistency, Timeouts and Retries",
    description:
      "Running the same API on many machines: why sessions must not live on a server, what consistency clients should expect, and how to set timeouts, retries and hedges that do not amplify an outage.",
    order: 13,
    estimatedMinutes: 24,
    tags: ["distributed-systems", "retries", "timeouts", "statelessness"],
    prerequisites: [
      "p3m1-layered-architecture",
      "p3m1-modular-monoliths",
      "p2m5-rest-principles",
      "p3m2-api-gateways",
    ],
    relatedTopics: [
      "p3m2-rate-limiting-strategies",
      "p3m2-idempotent-operations",
      "p3m2-realtime-communication",
      "p3m2-websockets",
    ],
    learningObjectives: [
      "Explain why server-side session state forces session affinity and how to avoid it",
      "State the consistency guarantees clients should be told about (read-your-writes, staleness)",
      "Set explicit timeouts on every outbound call and propagate a request budget",
      "Design retries and hedges that respect idempotency and use full jitter",
    ],
    simpleExplanation:
      "When your API runs on twenty machines behind a load balancer, any request may land on any machine — so nothing may live in that machine's memory between requests. Put identity in the token and state in the database or Redis. Then be honest about consistency: after a write, a read on another replica may lag slightly, and clients need to know that. Finally, every call you make to another service needs a timeout, and every retry needs a reason: retrying a non-idempotent call is how one outage becomes duplicated orders.",
    detailedContent: `
**Statelessness and session affinity.** If user A's session lives in instance 1's memory, the load balancer must keep sending A to instance 1 (sticky sessions). That breaks scaling (rebalancing moves traffic), failover (instance 1 dies, sessions vanish) and deployments (draining instance 1 kicks users). The fix: no server-side session state — carry identity and tenant in a signed token, put anything mutable (carts, rate budgets, presence) in Redis or the database, keyed by id and shared by all instances. Sticky sessions are sometimes used for WebSockets; if you do, treat them as a temporary transport detail, not a correctness requirement.

**Consistency expectations.** Clients deserve to be told: after a successful write, does the next read see it? **Read-your-writes** means routing a user's reads to the same shard (or waiting for replication). With asynchronous replicas you get **stale reads** — document the bound ("up to 500ms"). **Monotonic reads** per client means a sequence number or a short-lived session pin so a user never sees data go backwards. Pick the weakest guarantee that satisfies the feature and write it in the API docs.

**Timeouts.** Every outbound call gets an explicit deadline — never a default of infinity. Propagate a **budget**: the request started at T with a 2s overall deadline; when calling three services, each gets the remaining budget, not the full 2s. Node.js: \`AbortSignal.timeout(ms)\` or \`AbortSignal.any([userSignal, AbortSignal.timeout(ms)])\`.

**Retries and hedging.** Retry only idempotent operations (GET, PUT, DELETE) or non-idempotent ones carrying an Idempotency-Key. Use exponential backoff with **full jitter** (delay = random(0, min(cap, base * 2^attempt))) so a thousand clients do not retry in the same millisecond. Bound retries with a **retry budget** (at most 10% of normal traffic) to stop retry storms from amplifying an outage. **Hedging** — firing a second copy after p95 latency and cancelling the loser — only for idempotent reads, and only with the same budget discipline.
    `,
    howItWorks: `
A read that fans out to three services with a 2s budget:

1. The gateway records \`deadline = now + 2000ms\` and forwards it as a header so downstream hops know their ceiling.
2. Service A is called with \`AbortSignal.timeout(remaining)\`; it answers in 200ms.
3. Service B is slow. At 1200ms the signal fires, the call is aborted, and the handler returns partial data plus a degraded flag rather than holding the user's connection.
4. A retry of service B is attempted once (it was a GET) after \`random(0, 400ms)\` jitter — still within the budget.
5. If the budget is exhausted, the response is 200 with \`degraded: ["B"]\` or a 504-style error, decided by the product, never an unbounded hang.

If service B had been a POST /orders, step 4 would not retry at all — it would fail fast or retry only with an Idempotency-Key.
    `,
    codeExamples: [
      {
        title: "Timeout, jittered retry and budget in one helper",
        language: "ts",
        code: `async function callWithPolicy(url, init = {}, budgetMs = 2000) {
  const deadline = Date.now() + budgetMs;
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("BUDGET_EXHAUSTED");

    const idempotent = !init.method || ["GET", "HEAD", "PUT", "DELETE"].includes(init.method);
    if (!idempotent && attempt > 0 && !init.headers?.["Idempotency-Key"]) {
      throw lastError;                      // never blind-retry a POST
    }

    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(remaining) });
    } catch (err) {
      lastError = err;
      const backoff = Math.random() * Math.min(400 * 2 ** attempt, 2000); // full jitter
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastError;
}

// usage
const res = await callWithPolicy(
  "http://catalog-service:3000/v1/products/84",
  { headers: { accept: "application/json" } },
  800,                                        // remaining slice of the request budget
);`,
        description:
          "One policy object covers all three concerns: a hard deadline per attempt, full-jitter backoff between attempts, and a hard rule that non-idempotent calls are never retried without a key.",
      },
      {
        title: "Statelessness: identity travels in the token",
        language: "ts",
        code: `// BAD: session state pinned to one process
const sessions = new Map();                  // lost on deploy, invisible to other instances
app.get("/api/v1/cart", (req, res) => {
  res.json(sessions.get(req.cookies.sid));
});

// GOOD: shared state, stateless instances
app.get("/api/v1/cart", authenticate, async (req, res) => {
  const cart = await redis.get("cart:" + req.user.id);
  res.json(JSON.parse(cart ?? "{}"));
});

// and for reads, tell clients what consistency they get
app.get("/api/v1/orders/:id", authenticate, async (req, res) => {
  // route to a replica if you must, but honour read-your-writes when the
  // client echoes the version it just wrote (If-Match / ?version=)
  const order = await db.orders.findForUser(req.params.id, req.user.id, {
    preferPrimary: Boolean(req.headers["if-match"]),
  });
  res.set("X-Consistency", req.headers["if-match"] ? "read-your-writes" : "bounded-stale");
  res.json({ data: order });
});`,
        description:
          "Any instance can serve any request because nothing lives in process memory. The second half makes the consistency choice explicit instead of leaving clients to discover lag in production.",
      },
    ],
    commonMistakes: [
      "Using sticky sessions to 'fix' server-side sessions instead of moving state to shared storage.",
      "Leaving default (infinite) timeouts on outbound HTTP calls, so one hung dependency holds connections until the process runs out.",
      "Retrying every 503 automatically, including POSTs — the fastest way to duplicate orders during an incident.",
      "Promising strong consistency in docs while the implementation reads from async replicas.",
    ],
    bestPractices: [
      "Give every service call an explicit timeout, a retry count and an idempotency rule; encode them in one shared client helper.",
      "Use full jitter on every backoff and reconnect; synchronized retries are a self-inflicted outage.",
      "Document per-endpoint consistency (strong, read-your-writes, bounded stale) next to the latency SLO.",
      "Add a circuit breaker around flaky dependencies so failures fail fast instead of queueing work you cannot finish.",
    ],
    realWorldUseCases: [
      "A checkout calls inventory, payments and email — a 2s budget with partial results and no retries on the payment POST.",
      "A multi-region read replica set documents 500ms staleness, and the UI shows a 'syncing' badge for the user's own writes.",
      "A retry storm after a deploy is stopped by a 10% retry budget at the gateway, protecting the remaining healthy instances.",
    ],
    resources: [
      docs(
        "AWS Builders Library — Timeouts, retries and backoff with jitter",
        "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/",
        "The canonical explanation of why retries need jitter and budgets.",
        "en",
        "15 min",
      ),
      docs(
        "12factor.net",
        OFFICIAL.twelveFactor,
        "Processes: stateless, share-nothing instances behind a routing tier.",
        "en",
        "5 min",
      ),
      docs(
        "Node.js — AbortSignal.timeout",
        "https://nodejs.org/api/globals.html#abortsignaltimeoutmilliseconds",
        "The native primitive for deadline-based cancellation of fetch and streams.",
        "en",
        "5 min",
      ),
      ytSearch(
        "distributed system timeouts retries hedging idempotency api",
        "Production war stories and worked examples of retry budgets.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-budget",
        title: "Compute the budget",
        prompt:
          "A request has a 2000ms budget and calls three services in sequence with per-call timeouts of 2000ms each. Explain what happens when service A takes 1500ms, and rewrite the code so each call receives only the remaining budget. Then decide what the client sees when the third call cannot fit in the remaining time.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Timeouts do not shrink automatically — you must pass remaining time explicitly.",
          "Partial success with a degraded flag is usually better than a 504 for a dashboard.",
        ],
        solution: `const deadline = Date.now() + 2000;

async function call(name) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw Object.assign(new Error("BUDGET_EXHAUSTED"), { upstream: name });
  return fetch(UPSTREAMS[name], { signal: AbortSignal.timeout(remaining) });
}

// A takes 1500ms, B times out after the remaining ~450ms, C never starts.
// The handler answers 200 with { data: partial, degraded: ["B", "C"] }
// instead of hanging for 4500ms (which is what three 2000ms timeouts add up to).`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-consistency-matrix",
        title: "Write the consistency contract",
        prompt:
          "For four endpoints (read my profile, read my orders, read a public product page, read a live delivery status) write down: which consistency guarantee you offer, the number clients should tolerate, and how the implementation achieves it (primary read, replica with bound, version pin). Then write the one-paragraph note you would publish to API consumers.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Reads of a user's own writes deserve read-your-writes; public catalog data can be bounded-stale.",
          "A version or If-Match header is the cheapest way to force primary reads when the client cares.",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-backward-compatibility",
    slug: "backward-compatible-api-changes",
    title: "Backward Compatibility: Additive Changes and Tolerant Readers",
    description:
      "How APIs evolve without breaking callers: additive-only changes, tolerant readers on both sides, handling enums and nulls, and contract tests that catch a break before it ships.",
    order: 14,
    estimatedMinutes: 21,
    tags: ["compatibility", "versioning", "contract-testing", "evolution"],
    prerequisites: ["p2m2-api-versioning", "p2m5-openapi-swagger", "p2m5-rest-principles"],
    relatedTopics: [
      "p3m2-api-deprecation",
      "p3m2-openapi-advanced",
      "p3m2-advanced-rest-design",
      "p3m2-distributed-api-design",
    ],
    learningObjectives: [
      "Classify a proposed change as additive, evolving or breaking",
      "Write tolerant readers and servers that ignore unknown fields safely",
      "Handle new enum values and nullability without breaking strict clients",
      "Set up consumer-driven contract tests that block breaking changes in CI",
    ],
    simpleExplanation:
      "Backward compatibility means an existing client keeps working after you deploy. The rules are simpler than versioning suggests: add new optional fields freely, never change the meaning or type of an existing one, and make both sides tolerant of what they do not recognise yet — clients ignore unknown JSON fields, servers ignore unknown request fields. When you truly cannot avoid a break, catch it first with contract tests and then take the long deprecation path from the next lesson.",
    detailedContent: `
**Classify every change:**

| Change | Class | Example |
| --- | --- | --- |
| Add an optional response field | additive | \`emailVerified: boolean\` |
| Add a new endpoint | additive | \`GET /v1/invoices/:id/pdf\` |
| Add a new optional request field with a default | evolving | \`?locale=en\` |
| Rename a field | **breaking** | \`name\` → \`fullName\` |
| Change a type or units | **breaking** | \`total\` (cents) → \`total\` (dollars) |
| Make an optional field required | **breaking** | request now rejects missing \`locale\` |
| Add a value to a response enum | **evolving** (risky) | status gains \`ARCHIVED\` |

**Tolerant readers.** JSON parsers ignore keys the code does not know — that is your free safety net, so never enable strict deserialisation that rejects unknown properties. Write client models as "known fields plus a bag for the rest" (TypeScript: \`[key: string]: unknown\`; Zod: \`.passthrough()\`). The **server** should be equally tolerant of unknown request fields: an older mobile app and a newer one share one endpoint, and rejecting the older one's (subset) payload is a self-inflicted break.

**The two classic landmines.** First, **nullability**: making a field nullable, or a nullable field non-null, are both breaks for typed clients — pick nullability once and treat it as permanent. Second, **enums**: a client with a \`switch\` over every known status will hit the default branch when you add \`ARCHIVED\`. Document that clients must treat unknown enum values as "something new I do not handle" rather than crashing.

**Contract tests.** Consumer-driven contract tests (Pact-style) invert the safety net: the consumer publishes the exact expectations it depends on, and your provider verifies them in CI. A PR that renames \`total\` fails the contract before any client feels it. Pair with a spec diff (oasdiff against the previous OpenAPI version) so the pipeline flags breaking schema changes too.
    `,
    howItWorks: `
A safe evolution of a product endpoint:

1. The team wants to show stock levels. New field \`inventory: { available: int, reserved: int }\` is added to the schema — additive, optional.
2. Old clients ignore it completely (tolerant readers) and keep working.
3. The OpenAPI document is updated and a contract test asserts the new field is present but that \`price\` is untouched.
4. A generated TypeScript type gains an optional \`inventory?: ...\`; the frontend adopts it when ready — no coordinated release.
5. Meanwhile a proposal to rename \`price\` to \`priceCents\` fails CI: the consumer contract still references \`price\`.

That is the whole loop: additive change, tolerant consumers, CI as the referee.
    `,
    codeExamples: [
      {
        title: "Tolerant reader and tolerant server",
        language: "ts",
        code: `import { z } from "zod";

// CLIENT: unknown fields are kept, not rejected — future server additions survive
const ProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    price: z.number().int(),
    status: z.enum(["active", "archived"]).or(z.string()),  // tolerate new enum values
  })
  .passthrough();

export type Product = z.infer<typeof ProductSchema> & { [key: string]: unknown };

// SERVER: ignore unknown request fields from older clients instead of 400ing them
const UpdateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(80),
    locale: z.string().default("en"),
  })
  .strip()   // drop extras silently; use .passthrough() if you forward them downstream
  .strict(); // only if you deliberately want to reject unknown fields (rare, versioned)

app.patch("/api/v1/me", authenticate, (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: "VALIDATION_FAILED", details: parsed.error.flatten() } });
  }
  res.json({ data: parsed.data });
});`,
        description:
          "On the client, .passthrough() plus a string-tolerant enum means a server deploy never crashes an old build. On the server, defaults let a two-year-old app keep sending the subset of fields it knows.",
      },
      {
        title: "A consumer contract test that blocks a break",
        language: "ts",
        code: `import { PactV3 } from "@pact-foundation/pact";

const provider = new PactV3({ consumer: "web-storefront", provider: "products-api" });

describe("product contract", () => {
  it("exposes price as an integer in cents and id as a string", () => {
    return provider
      .given("a product exists")
      .uponReceiving("a request for a product")
      .withRequest({ method: "GET", path: "/v1/products/84" })
      .willRespondWith({
        status: 200,
        body: {
          id: matcher.string("84"),
          price: matcher.integer(4200),
          status: matcher.string("active"),
        },
      })
      .executeTest((mockServer) =>
        fetch(mockServer.url + "/v1/products/84").then((r) => r.json()),
      );
  });
});

// provider side (runs in CI against the real service):
// pact-verify-provider --provider-base-url http://localhost:3000 --pacticipant products-api
// a rename of price => priceCents fails here, before any deploy`,
        description:
          "The consumer records what it actually depends on; CI replays that expectation against the provider. Renames, type changes and removed fields all fail the verification step instead of production clients.",
      },
    ],
    commonMistakes: [
      "Renaming a field because it reads better — 'cosmetic' renames are the most common breaking change in production APIs.",
      "Enabling strict JSON deserialisation in clients, which turns every additive server change into a crash.",
      "Making an optional response field required, breaking every client that legitimately omits it in requests.",
      "Shipping enum values without telling clients to handle unknown members, so a new status takes down an old app's switch statement.",
    ],
    bestPractices: [
      "Treat the response schema as append-only: add fields, never remove, rename or retype.",
      "Write nullability and enum policy once in the API guidelines and enforce it with a schema linter.",
      "Run consumer-driven contracts plus a spec diff in CI for every PR that touches the API.",
      "Give every field a units and nullability note in the OpenAPI description — most 'compatible' bugs are unit confusions.",
    ],
    realWorldUseCases: [
      "Google's API design guide forbids field renames outright: the original name is reserved and a new field is added instead.",
      "A mobile app in the wild for three years keeps working because servers add optional fields and clients ignore them.",
      "An e-commerce team catches a breaking 'price' rename in contract CI while it is still a pull request.",
    ],
    resources: [
      docs(
        "Google Cloud — API Design Guide (compatibility)",
        "https://cloud.google.com/apis/design#compatibility",
        "Field naming, reserved names and the rules for evolving an API without version churn.",
        "en",
        "reference",
      ),
      docs(
        "Zalando — RESTful API guidelines",
        "https://opensource.zalando.com/restful-api-guidelines/",
        "Concrete compatibility rules including enums, nullability and deprecation workflow.",
        "en",
        "reference",
      ),
      docs(
        "Pact — Documentation",
        "https://docs.pact.io/",
        "Consumer-driven contract testing: how expectations are recorded and verified in CI.",
        "en",
        "reference",
      ),
      ytSearch(
        "backward compatible api design additive changes contract testing",
        "Walkthroughs of tolerant readers and consumer-driven contracts.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-classify",
        title: "Classify ten changes",
        prompt:
          "Classify each as additive, evolving or breaking, and say what you would do instead for every breaking one: rename userId to user; add optional fields; change price from cents to dollars; add ARCHIVED to a status enum; make limit default 25 instead of 10; remove a deprecated field; add a new header accepted but not required; change pagination from offset to cursor on the same URL; add a new error code; make an optional response field non-null.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Ask: can an already-deployed client still parse and behave correctly?",
          "Changing a default is only safe when the documented behaviour stays valid.",
        ],
      },
      {
        id: "ex-p3m2-contract-ci",
        title: "Wire the safety net",
        prompt:
          "Write the CI steps (a GitHub Actions job is fine) that run: a consumer contract suite, a provider verification against a throwaway database, and a spec diff of the OpenAPI document against main. Explain which step catches which class of break, and what happens when the diff reports a break that the team decides to ship anyway.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "The spec diff is fast feedback; the provider verification is the authoritative check.",
          "A deliberate break still goes through the deprecation path, not a force-merge of a silent break.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-api-deprecation",
    slug: "api-deprecation",
    title: "API Deprecation: Sunset Headers, Usage Monitoring and Migration Guides",
    description:
      "Retiring endpoints without breaking strangers: the Deprecation and Sunset headers, measuring real usage, writing migration guides, and surviving the long tail of silent consumers.",
    order: 15,
    estimatedMinutes: 20,
    tags: ["deprecation", "sunset-header", "operations", "api-lifecycle"],
    prerequisites: ["p3m2-backward-compatibility", "p2m2-api-versioning", "p2m5-rest-principles"],
    relatedTopics: [
      "p3m2-openapi-advanced",
      "p3m2-webhooks",
      "p3m2-advanced-rest-design",
      "p3m2-distributed-api-design",
    ],
    learningObjectives: [
      "Run a deprecation lifecycle with Deprecation and Sunset headers",
      "Identify consumers through client ids, API keys and User-Agent logging",
      "Write a migration guide that makes the new path the easiest path",
      "Plan for the long tail: silent consumers, staged removal and 410 handling",
    ],
    simpleExplanation:
      "Removing an API endpoint is a social process with technical signalling, not a deploy. You announce the replacement, mark every response with Deprecation and a Sunset date (RFC 8594), and watch real usage so you know who is actually calling. Then you migrate the consumers you can find, give the silent ones months of warning and a clear error when it finally goes dark. The goal is that removal is boring — not an outage.",
    detailedContent: `
**The lifecycle.** Use four stages with explicit dates:

1. **Announce** (T-6 months): changelog post, email to registered consumers, the replacement endpoint live and documented.
2. **Warn** (T-3 months): every response from the old path carries \`Deprecation: true\` (or the deprecation date) and a \`Link\` to the successor; logs start tagging each call with the consumer id.
3. **Sunset** (T-1 month): add \`Sunset: Sat, 01 Nov 2025 00:00:00 GMT\` — the RFC 8594 header with an HTTP-date. Clients and API gateways can act on it programmatically.
4. **Remove** (T=0): return \`410 Gone\` with a body pointing at the migration guide — never a bare 404, which looks like a routing bug.

**Usage monitoring.** You cannot deprecate what you cannot see. Authenticate every call with an API key or \`client_id\` and log it; build a dashboard of requests per endpoint per consumer per week. Two questions decide everything: which consumers still call this, and how much of total traffic is it? Below roughly 1% of traffic with zero known production consumers, you can usually move fast; a top-10 consumer requires a joint migration plan.

**The long tail.** The dangerous consumer is the one that never reads announcements: a cron job on a forgotten server, a partner's vendor, an internal script. Countermeasures: 12-month windows for anything public, direct outreach to every key holder, staged removals (soft 410 for one region first), and a "which of my keys is affected" page in the developer portal. After removal, keep the 410 handler for at least as long as the deprecation window — resurrections are common.

**Migration guides** must be boring and complete: side-by-side request/response examples, a change list, a date, and a way to ask questions. If migrating is harder than using the old endpoint, consumers will wait you out.
    `,
    howItWorks: `
Removing \`GET /v1/reports\`:

1. \`GET /v2/reports\` ships with identical semantics plus the improvements that motivated the version.
2. The old route keeps working and now answers with \`Deprecation: true\`, \`Sunset: Sat, 01 Nov 2025 00:00:00 GMT\` and \`Link: </v2/reports>; rel="successor-version"\`.
3. The dashboard shows 340 keys per week; the top 5 are contacted directly, 300 have not called in 90 days and get an automated notice.
4. After the Sunset date, \`/v1/reports\` returns 410 with \`{ error: { code: "GONE", migrationUrl } }\`; the same path in a second region is darked first as a canary.
5. Two weeks later, remaining calls are two keys from a partner's test environment — resolved by support, then the endpoint is deleted from the router and the OpenAPI document.
    `,
    codeExamples: [
      {
        title: "Deprecation and Sunset headers",
        language: "ts",
        code: `const SUNSET_DATE = new Date("2025-11-01T00:00:00Z");

app.get("/api/v1/reports", authenticate, async (req, res) => {
  usage.record({ endpoint: "GET /v1/reports", clientId: req.user.clientId });

  res.set({
    Deprecation: "true",                                      // RFC 9745-style marker
    Sunset: SUNSET_DATE.toUTCString(),                        // RFC 8594
    Link: '</api/v2/reports>; rel="successor-version"',
  });

  if (Date.now() > SUNSET_DATE.getTime()) {
    return res.status(410).json({
      error: {
        code: "GONE",
        message: "This endpoint was retired on 2025-11-01.",
        migrationUrl: "https://developers.example.com/migrations/reports-v2",
      },
    });
  }

  res.json({ data: await reports.listV1(req.query) });
});`,
        description:
          "The warning phase and the gone phase share one handler: headers during the window, a 410 with a migration URL after it. Every call records the client id, which is what makes the usage dashboard possible.",
      },
      {
        title: "Which consumers still call this?",
        language: "sql",
        code: `-- one week before the Sunset date
SELECT
  client_id,
  count(*)                        AS calls,
  count(DISTINCT user_agent)      AS agents,
  max(seen_at)                    AS last_seen
FROM api_usage
WHERE endpoint = 'GET /v1/reports'
  AND seen_at > now() - interval '30 days'
GROUP BY client_id
ORDER BY calls DESC;

-- result drives the outreach list: top keys get a human email,
-- keys with last_seen older than 90 days get an automated notice.`,
        description:
          "Usage data is the difference between a calm migration and an outage: this query turns a vague 'nobody uses it' into a ranked call list with real timestamps.",
      },
    ],
    commonMistakes: [
      "Deleting an endpoint in the same release that announces its replacement — announcement and removal must be months apart.",
      "Using 404 after removal, which makes the failure look like a client bug instead of a planned retirement.",
      "Relying on changelog posts alone: the consumers that break you are the ones that never read them.",
      "Deprecating an endpoint while still routing internal tools through it, so your own team discovers the removal first.",
    ],
    bestPractices: [
      "Emit Deprecation and Sunset headers on every deprecated route from day one — they cost nothing and let tooling do the work.",
      "Publish the migration guide before the announcement email, so the link is never a dead end.",
      "Track 'requests to deprecated endpoints by client' as a first-class dashboard with an alert on new consumers.",
      "Keep the 410 handler and the migration docs alive long after removal; resurrections are normal.",
    ],
    realWorldUseCases: [
      "GitHub publishes removal dates years in advance for preview headers and still runs long migration windows.",
      "Stripe versions its API by date (`2024-06-20`) so every account can pin a behaviour set and migrate on their schedule.",
      "An internal platform retires an endpoint after a dashboard proves zero calls for 90 days, then hardens it to 410.",
    ],
    resources: [
      docs(
        "RFC 8594 — The Sunset HTTP header",
        "https://www.rfc-editor.org/rfc/rfc8594",
        "The standard header and date format clients use to detect an approaching retirement.",
        "en",
        "reference",
      ),
      docs(
        "GitHub — Deprecations",
        "https://docs.github.com/en/rest/overview/deprecations",
        "How a large public API communicates, times and enforces endpoint removals.",
        "en",
        "reference",
      ),
      docs(
        "Google Cloud — API Design Guide (deprecation)",
        "https://cloud.google.com/apis/design#deprecation",
        "Deprecation policy as part of a design guide, including notice periods.",
        "en",
        "reference",
      ),
      ytSearch(
        "api deprecation strategy sunset header migration",
        "Real deprecation timelines and header mechanics.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-deprecation-plan",
        title: "Write the deprecation plan",
        prompt:
          "You must retire PATCH /api/v1/users/:id (replaced by PUT /api/v2/users/:id). Write the plan: timeline with dates, every header set during the window, the status code and body after removal, how you will identify remaining consumers, and the exact contents of the migration guide's first section.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "PUT replacing PATCH is a semantic change too — call that out in the guide.",
          "The first section of a migration guide should answer: what do I call instead, and when must I be done?",
        ],
        solution: `Timeline:
  2025-05-01  announce: changelog + email to all key holders; v2 live and documented
  2025-08-01  warn: Deprecation: true + Sunset: Sat, 01 Nov 2025 00:00:00 GMT
              + Link: </api/v2/users/{id}>; rel="successor-version"
  2025-10-01  direct outreach to every key that called in the last 30 days
  2025-11-01  remove: 410 Gone, body { error: { code: "GONE", migrationUrl } }
  2025-11-15  router entry deleted; 410 handler retained for 12 months

Migration guide, section 1:
  "What changed" — PATCH merges partial updates; the v2 PUT replaces the full
  representation and requires every writable field. Clients must read the
  current user first, apply their change, and PUT the complete object.
  Deadline: 2025-11-01. Questions: #api-help or api-support@example.com.`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m2-long-tail",
        title: "Hunt the long tail",
        prompt:
          "Describe how you would find consumers that authenticate with an IP allowlist instead of an API key (so they are invisible in key-based usage reports). Then design the staged removal: which region goes dark first, what metric decides rollback, and what a partner sees at each stage.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Access logs keyed by source IP plus TLS SNI can reconstruct anonymous consumers.",
          "A canary removal with a rollback metric is safer than a global flag day.",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-analytics-api"],
    quizId: "quiz-p3-m2",
  },
  {
    ...shared,
    id: "p3m2-openapi-advanced",
    slug: "openapi-advanced",
    title: "OpenAPI 3.1: Components, Security Schemes, Webhooks and Tooling",
    description:
      "Reusable components and $ref, securitySchemes for bearer and OAuth2, the webhooks section in OpenAPI 3.1, generating typed clients, and linting the spec in CI.",
    order: 16,
    estimatedMinutes: 23,
    tags: ["openapi", "documentation", "code-generation", "ci"],
    prerequisites: ["p2m5-openapi-swagger", "p3m2-backward-compatibility", "p3m1-separation-of-concerns"],
    relatedTopics: [
      "p3m2-advanced-rest-design",
      "p3m2-api-deprecation",
      "p3m2-graphql-schemas-resolvers",
      "p3m2-webhooks",
    ],
    learningObjectives: [
      "Factor schemas, parameters, responses and security schemes into components",
      "Declare security schemes and apply them per operation",
      "Document outbound webhooks using the OpenAPI 3.1 webhooks section",
      "Generate a typed client from the spec and enforce quality with a linter in CI",
    ],
    simpleExplanation:
      "OpenAPI is the contract your API can be verified against. Beyond listing endpoints, a mature spec factors everything reusable into components ($ref instead of copy-paste), declares exactly how authentication works with securitySchemes, and — in version 3.1 — can describe your outbound webhooks, so a partner sees the whole integration surface in one document. That same file then drives typed client generation and automated linting, which is how a spec stays honest instead of drifting from the code.",
    detailedContent: `
**Components are the point.** Anything used twice belongs in \`components\`: schemas (\`Order\`, \`Error\`), parameters (\`TenantHeader\`, \`CursorQuery\`), responses (\`Unauthorized\`, \`TooManyRequests\`), request bodies and security schemes. Reference them with \`$ref: '#/components/schemas/Order'\`. A single shared \`Error\` schema keeps every 4xx body identical across 80 endpoints, and changing a field there is a one-line diff.

**Security schemes** describe auth machine-readably:

    components.securitySchemes.bearerAuth:  type: http, scheme: bearer, bearerFormat: JWT
    components.securitySchemes.apiKeyAuth:  type: apiKey, in: header, name: X-API-Key
    components.securitySchemes.oauth2:      type: oauth2, flows: { authorizationCode: {...} }

Then apply them globally (\`security: [{ bearerAuth: [] }]\`) or per operation, and override with an empty array for public routes. Tools use this to render "Authorize" buttons and SDKs to attach tokens automatically.

**Webhooks in 3.1.** OpenAPI 3.1 adds a top-level \`webhooks\` map describing what **your server sends out** — the reverse of \`paths\`:

    webhooks:
      invoicePaid:
        post:
          operationId: invoicePaid
          requestBody: { content: { application/json: { schema: { $ref: ... } } } }

Partner teams validate their receivers against it, and your signature headers can be declared as parameters with descriptions.

**Tooling loop.** Generate a typed client (\`openapi-generator\` or \`orval\`) so the frontend imports \`api.orders.get("o_9")\` instead of hand-rolled fetch calls; generate server stubs or mocks for contract-first development; lint with Spectral rules (naming, required examples, consistent error shapes) and run \`oasdiff\` against main to block breaking changes. The spec becomes executable documentation that CI enforces — closer to how GraphQL's schema behaves by construction.
    `,
    howItWorks: `
A spec-first change flow:

1. Edit \`openapi.yaml\`: add a component schema and a new field on \`Order\` via \`$ref\`.
2. Spectral runs in CI: naming rules pass, the required \`example\` is present.
3. oasdiff compares against \`main\` and reports an additive change (safe to merge).
4. The backend team generates a server stub; the frontend regenerates its client and gets the new optional field typed for free.
5. Pact or contract tests verify the implementation matches the spec at runtime.

Because everything references one component, the change touched one place — the same reason GraphQL schemas feel safer than REST docs.
    `,
    codeExamples: [
      {
        title: "Components, security and webhooks in one spec",
        language: "yaml",
        code: `openapi: 3.1.0
info:
  title: Orders API
  version: 2.4.0

security:
  - bearerAuth: []

paths:
  /v1/orders/{orderId}:
    get:
      operationId: getOrder
      parameters:
        - $ref: "#/components/parameters/OrderId"
      responses:
        "200":
          description: The order
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: "#/components/schemas/Order" }
        "401": { $ref: "#/components/responses/Unauthorized" }
        "429": { $ref: "#/components/responses/TooManyRequests" }

webhooks:
  invoicePaid:
    post:
      operationId: invoicePaid
      description: Sent when an invoice is paid. Verify the HMAC signature over the raw body.
      parameters:
        - name: X-Signature-256
          in: header
          required: true
          schema: { type: string }
        - name: X-Event-Id
          in: header
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/InvoicePaidEvent" }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  parameters:
    OrderId:
      name: orderId
      in: path
      required: true
      schema: { type: string }
  schemas:
    Order:
      type: object
      required: [id, status, total]
      properties:
        id: { type: string, examples: ["o_9"] }
        status: { type: string, enum: [PENDING, PAID, SHIPPED, CANCELLED] }
        total: { type: integer, description: Total in minor units (cents). }
    InvoicePaidEvent:
      type: object
      required: [id, invoiceId, amountPaid]
      properties:
        id: { type: string }
        invoiceId: { type: string }
        amountPaid: { type: integer }
  responses:
    Unauthorized:
      description: Missing or invalid credentials.
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    TooManyRequests:
      description: Rate limit exceeded; retry after Retry-After seconds.
      headers:
        Retry-After: { schema: { type: integer } }
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }`,
        description:
          "One Error schema, one parameter, two shared responses and a declared webhook. Adding a field to Order is a one-line change that every generated client sees, and the security scheme drives both docs UI and SDKs.",
      },
      {
        title: "Lint and diff the spec in CI",
        language: "bash",
        code: `# .spectral.yml
# rulesets: ["spectral:oas"]
# extends:
#   - "spectral:oas"
# rules:
#   operation-operationId:
#     severity: error
#   oas3-api-servers:
#     severity: error

# CI steps (GitHub Actions)
npx @stoplight/spectral-cli lint openapi.yaml --ruleset .spectral.yml

npx @redocly/cli lint openapi.yaml --config redocly.yaml

# fail the PR on breaking changes relative to main
npx oasdiff breaking main:openapi.yaml openapi.yaml --fail-on ERR

# generate a typed client for the frontend workspace
npx openapi-generator-cli generate \\
  -i openapi.yaml \\
  -g typescript-fetch \\
  -o packages/api-client/src/generated`,
        description:
          "Three gates keep the contract honest: style linting, breaking-change detection and client generation. A field rename fails the diff before a single client is broken.",
      },
    ],
    commonMistakes: [
      "Copy-pasting the same schema into 30 paths instead of $ref — the first fix takes an hour, the next 29 take a minute.",
      "Documenting auth in prose while omitting securitySchemes, so generated clients cannot authenticate at all.",
      "Hand-writing TypeScript types that drift from the spec; generate them instead.",
      "Treating the spec as a post-deploy artifact — a spec that is not in CI is a spec that is already wrong.",
    ],
    bestPractices: [
      "Keep one shared Error schema and shared response components; consistency becomes structural rather than a code-review burden.",
      "Declare security per operation for mixed public/private APIs, and test that public routes really are public.",
      "Use the 3.1 webhooks section for outbound events so partners integrate against one document.",
      "Run lint + oasdiff + client generation in CI on every PR that touches openapi.yaml.",
    ],
    realWorldUseCases: [
      "Stripe publishes one enormous versioned OpenAPI document from which SDKs in eight languages are generated.",
      "Twilio describes both REST resources and outbound webhook payloads so partners can build receivers from the same reference.",
      "An internal platform team generates fetch clients for all 14 microservices, so frontends never hand-write API calls.",
    ],
    resources: [
      docs(
        "OpenAPI Specification — latest",
        OFFICIAL.openapiSpec,
        "The normative specification, including components, security schemes and the 3.1 webhooks section.",
        "en",
        "reference",
      ),
      docs(
        "Swagger UI",
        OFFICIAL.swaggerUi,
        "Rendering the spec interactively, including the Authorize button driven by securitySchemes.",
        "en",
        "8 min",
      ),
      docs(
        "Redocly CLI — linting",
        "https://redocly.com/docs/cli/",
        "Linting rulesets and CI integration for OpenAPI documents.",
        "en",
        "10 min",
      ),
      docs(
        "OpenAPI Generator",
        "https://openapi-generator.tech/",
        "Generating typed clients, server stubs and mocks from a spec.",
        "en",
        "8 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m2-refactor-spec",
        title: "Refactor a copy-paste spec",
        prompt:
          "Take an OpenAPI document you wrote in Phase 2 (or any 5-path spec) and refactor it: extract every repeated schema into components, add a shared Error schema and Unauthorized/TooManyRequests responses, add securitySchemes for bearer JWT and an API key, and mark two endpoints public. Show the before/after line count and the exact $ref syntax you used.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "A $ref is a JSON pointer: '#/components/schemas/Order' resolves inside the same document.",
          "Public endpoints override the global security with 'security: []'.",
        ],
        solution: `paths:
  /v1/orders/{orderId}:
    get:
      security: [{ bearerAuth: [] }]
      parameters:
        - $ref: "#/components/parameters/OrderId"
      responses:
        "200":
          description: The order
          content:
            application/json:
              schema:
                type: object
                properties:
                  data: { $ref: "#/components/schemas/Order" }
        "401": { $ref: "#/components/responses/Unauthorized" }

  /v1/health:
    get:
      security: []           # public: overrides the document-level requirement
      responses:
        "200": { description: Service is healthy }

components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
    apiKeyAuth: { type: apiKey, in: header, name: X-API-Key }
  parameters:
    OrderId:
      name: orderId
      in: path
      required: true
      schema: { type: string }`,
        solutionLanguage: "yaml",
      },
      {
        id: "ex-p3m2-lint-gate",
        title: "Build the CI gate",
        prompt:
          "Write a GitHub Actions workflow that lints openapi.yaml with Spectral, fails on breaking changes with oasdiff against main, and regenerates the client. Explain what error message you expect from each gate for: a missing description, a renamed field, and a new optional field.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "oasdiff classifies changes; only breaking ones should fail the build.",
          "Client regeneration produces a diff that reviewers can read like any other code change.",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m2",
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m2",
  moduleId: "p3-m2",
  title: "Module 2 quiz — Advanced API design",
  description:
    "Test your judgement on REST projections, GraphQL execution and DataLoader, webhooks and idempotency, rate limiting algorithms, transports and API lifecycle tooling.",
  questions: [
    {
      id: "q-p3m2-1",
      type: "multiple-choice",
      prompt:
        "A client calls GET /api/v1/products/84?fields=id,name,price and the server implements the partial-response pattern from this module. Which statement is correct?",
      options: [
        "The server must return 404 when the product has no price attribute",
        "The server projects the representation to the requested attributes before serialising, follows a documented policy for unknown field names, and caches key on the full URL including the fields query string",
        "The fields are applied by the client after the full response arrives, so the server still serialises every attribute",
        "The fields parameter requires a POST, because query strings cannot change a representation",
      ],
      correctIndex: 1,
      explanation:
        "Partial responses are a server-side projection: fewer attributes are serialised (and often fewer columns selected), unknown fields follow an explicit ignore-or-400 policy, and because HTTP caches use the full URL as the key, each distinct fields value is cached separately. 404 is about the resource, not its attributes; doing it client-side defeats the bandwidth and database savings; and GET with a query string is exactly how sparse fieldsets work.",
      optionExplanations: [
        "A missing attribute on an existing resource is a projection concern, not a not-found condition.",
        "Correct — projection happens server-side, the unknown-field policy is explicit, and the cache key includes the query string.",
        "Client-side filtering saves no bandwidth and no database work, which is the whole point of the pattern.",
        "GET is cacheable and safe; the query string is the standard place for projection parameters.",
      ],
    },
    {
      id: "q-p3m2-2",
      type: "code-output",
      prompt:
        "The idempotent middleware claims Idempotency-Key k1 with SET NX, runs the handler on the first request and stores { status, body }; later requests with the same key and body replay the stored response. A client sends this request, times out without seeing the answer, then retries with the same key. What happens?",
      code: `app.post("/api/v1/charges", idempotent, async (req, res) => {
  const charge = await db.charges.create({ amountCents: req.body.amountCents });
  res.status(201).json({ data: charge });
});`,
      language: "ts",
      options: [
        "A second charge row is created with a new id, and the retry answers 201",
        "The retry returns the stored first response — same charge id, status 201 — and no new row is created",
        "The retry always answers 409 Conflict, even long after the first request finished",
        "The retry answers 429 Too Many Requests because the key was already used",
      ],
      correctIndex: 1,
      explanation:
        "That is the entire contract of an idempotency key: the work runs once, the first response is stored under the key, and every replay with the same key and payload returns the stored status and body (often with an Idempotency-Replayed header). 409 is for the narrow in-progress race, not for completed keys; 429 is a rate-limit signal, unrelated to idempotency.",
      optionExplanations: [
        "A new row on retry is exactly the double-charge bug the key prevents.",
        "Correct — the stored 201 (including the original charge id) is replayed and the handler never runs again.",
        "Once the first request completes, replays succeed with the stored response; 409 applies only while it is still running.",
        "429 means rate limiting; using a key twice is normal and expected.",
      ],
    },
    {
      id: "q-p3m2-3",
      type: "find-bug",
      prompt:
        "This webhook receiver rejects every valid delivery from the provider. What is wrong?",
      code: `app.post("/webhooks", express.json(), (req, res) => {
  const expected = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (expected === req.headers["x-signature-256"]) {
    res.status(200).end();
  } else {
    res.status(401).end();
  }
});`,
      language: "ts",
      options: [
        "Nothing is wrong — HMAC-SHA256 over the body is the standard scheme",
        "The route must use PATCH instead of POST before signatures apply",
        "The signature must be computed over the raw request bytes, but express.json() has already parsed and re-serialised the body (changing key order and whitespace), and === is not a constant-time comparison — verify the raw buffer with crypto.timingSafeEqual",
        "The secret should be sent in a header rather than read from the environment",
      ],
      correctIndex: 2,
      explanation:
        "Providers sign the exact bytes on the wire. After express.json() runs, JSON.stringify(req.body) is a different byte sequence (key order, spacing, unicode escapes), so the digest never matches. Route-level raw parsing (express.raw) or a captured rawBody fixes that; timingSafeEqual then avoids leaking the secret through comparison timing.",
      optionExplanations: [
        "The scheme is right, but the bytes being signed are not.",
        "HTTP method has no bearing on signature verification.",
        "Correct — sign the raw bytes with a raw-body parser and compare with crypto.timingSafeEqual.",
        "Reading the secret from the environment is correct and standard; sending it in a header would defeat the purpose.",
      ],
    },
    {
      id: "q-p3m2-4",
      type: "code-output",
      prompt:
        "A GraphQL document selects { posts { title author { name } } } and returns 50 posts. How many database queries run?",
      code: `Query.posts: () => db.posts.find().limit(50).toArray();          // 1 query
Post.author: (post) => ctx.loaders.author.load(post.authorId); // DataLoader, batched`,
      language: "ts",
      options: [
        "1 query",
        "2 queries",
        "50 queries",
        "51 queries",
      ],
      correctIndex: 1,
      explanation:
        "One query for the posts, then the 50 author keys collected by DataLoader are flushed as a single WHERE id IN (…) query — 2 total. Without DataLoader it would be 51 (1 + N), which is the N+1 problem. 1 would mean a join inside the first query, which these resolvers do not do.",
      optionExplanations: [
        "That would require a join in Query.posts, which the code does not perform.",
        "Correct — one query for the parents plus one batched query for all authors.",
        "50 author queries is the naive per-field implementation, not the batched one.",
        "51 is the classic N+1 count (1 + 50) that DataLoader exists to eliminate.",
      ],
    },
    {
      id: "q-p3m2-5",
      type: "multiple-choice",
      prompt:
        "A token bucket has capacity 20 and refills at 5 tokens per second. It has been idle for 10 seconds. A client then sends 35 requests simultaneously. How many are accepted?",
      options: [
        "5 accepted, 30 rejected",
        "20 accepted, 15 rejected with 429 and Retry-After",
        "35 accepted, because the bucket refilled during the burst",
        "0 accepted, because simultaneous requests always lose the race",
      ],
      correctIndex: 1,
      explanation:
        "After 10 idle seconds the bucket holds min(20, 0 + 10×5) = 20 tokens — capacity is the ceiling, so the extra 30 seconds of theoretical refill are discarded. The burst of 35 consumes 20 tokens and 15 requests are rejected with 429. A leaky or windowed algorithm would behave differently; a bucket never exceeds its capacity.",
      optionExplanations: [
        "5 is the refill rate per second, not the burst capacity.",
        "Correct — the bucket refills to its capacity of 20, then the remaining 15 requests are rejected.",
        "Refill is capped at capacity: idle time cannot bank more than 20 tokens.",
        "Requests are evaluated against the token count, not against each other's timing.",
      ],
    },
    {
      id: "q-p3m2-6",
      type: "multiple-choice",
      prompt:
        "A team is adding GraphQL to an endpoint that returns a single product object with five fields, is called by one first-party web app, and is currently served from a CDN by URL. Which argument is the strongest reason to keep REST for this endpoint?",
      options: [
        "GraphQL cannot return nested data",
        "GraphQL is always slower than REST for small payloads",
        "The endpoint has no over- or under-fetching problem, one consumer, and would lose URL-keyed CDN caching while gaining schema governance costs for no benefit",
        "GraphQL requires a different database than REST does",
      ],
      correctIndex: 2,
      explanation:
        "GraphQL earns its costs (caching complexity, query-cost defences, schema governance) when clients need different shapes or nested reads. A single-shape, single-client CRUD endpoint has neither problem, and moving to POST /graphql would forfeit the CDN caching the team already has. The other options are simply false.",
      optionExplanations: [
        "False — GraphQL handles nesting extremely well; that is one of its strengths.",
        "False — speed differences come from round-trips and payload size, not the protocol label.",
        "Correct — no over/under-fetching, one consumer, and it would give up URL-based CDN caching.",
        "False — GraphQL runs over the same databases; the data layer is unchanged.",
      ],
    },
    {
      id: "q-p3m2-7",
      type: "short-answer",
      prompt:
        "An API is retiring an endpoint. During the warning window, responses must carry a standard HTTP header stating the date after which the endpoint will be permanently unavailable (RFC 8594). Name that header.",
      acceptedKeywords: ["sunset", "sunset header"],
      explanation:
        "The Sunset header carries an HTTP-date after which the resource should no longer be used; RFC 8594 also suggests a Sunset link relation. Deprecation marks that the resource is deprecated (often without a date), Link points at the successor, and 410 Gone is what clients see after the date passes.",
    },
    {
      id: "q-p3m2-8",
      type: "find-bug",
      prompt:
        "Customers report duplicate orders after brief network outages. What is the core defect in this client?",
      code: `async function placeOrder(payload) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fetch("https://api.example.com/v1/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 100));
    }
  }
}`,
      language: "ts",
      options: [
        "fetch throws on every HTTP 500, so the catch block retries server errors automatically",
        "The loop should use while(true) so retries continue until success",
        "The backoff should be a fixed delay so retries are predictable",
        "It blindly retries a non-idempotent POST with no Idempotency-Key: a timeout after the server committed the order means the retry creates a second one — send a key (or make the operation idempotent) before retrying",
      ],
      correctIndex: 3,
      explanation:
        "POST is not idempotent, and a network timeout does not tell the client whether the order was created. Blind retries therefore duplicate it. The fix is an Idempotency-Key so a replay returns the first response, or not retrying the POST at all. fetch only rejects on network failures (so 500s are not retried here), and neither loop shape nor fixed delay addresses the correctness problem.",
      optionExplanations: [
        "False — fetch resolves for any completed HTTP exchange; only network-level failures land in catch.",
        "A tighter loop would duplicate orders faster, not fix them.",
        "Fixed delays synchronize clients and make retry storms worse; jitter is preferred — but the real defect is the retrying itself.",
        "Correct — non-idempotent retries without a key are what create the duplicates.",
      ],
    },
  ],
};
