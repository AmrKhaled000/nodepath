import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, article, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m1",
  slug: "software-architecture",
  title: "Software Architecture",
  description:
    "How to structure a growing Node.js backend on purpose: MVC and where it stops, layered and clean architecture, separation of concerns, modular monoliths versus microservices, dependency injection without a framework, SOLID, repositories and services, domain modelling, DDD fundamentals, backend design patterns, refactoring, technical debt, large-project layout and configuration/secrets management.",
  phaseId: "phase-3",
  order: 1,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m1",
  difficulty: "advanced",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m1-mvc",
    slug: "model-view-controller",
    title: "Model-View-Controller",
    description:
      "The classic three-role split, how it maps onto an Express application, and why the view half-disappears in a JSON API.",
    order: 1,
    estimatedMinutes: 18,
    tags: ["mvc", "architecture", "express", "patterns"],
    prerequisites: ["p2m2-app-structure", "p2m2-controllers-services"],
    relatedTopics: ["p3m1-layered-architecture", "p3m1-separation-of-concerns", "p3m1-clean-architecture"],
    learningObjectives: [
      "Describe the responsibilities of model, view and controller and the direction of data flow between them",
      "Map MVC roles onto folders and files in a typical Express application",
      "Explain what replaces the view in a JSON API and why the model/controller split gets unbalanced",
      "Decide when MVC is enough and when a layered or use-case structure is a better fit",
    ],
    simpleExplanation:
      "MVC divides an application into three jobs: the **model** owns data and business rules, the **view** is what the user sees, and the **controller** receives the request, talks to the model and picks a view for the answer. In a server-rendered web app the view is an HTML template; in a JSON API the view is basically your serializer, so MVC ends up meaning \"controller and model with a thin response layer\".",
    detailedContent: `
The three roles, precisely:

- **Model** — the data plus the rules that govern it: entities, invariants, validation, persistence. In Node this is your domain classes and the Prisma/SQL layer they use.
- **View** — the representation handed to the caller: an EJS/Handlebars template, or in a REST API, the shape of the JSON you return.
- **Controller** — translates an HTTP request into input for the model, asks for the work to be done, then selects a view or JSON shape for the response.

The intended flow is one-directional: **request → controller → model → controller → view → response**. The controller must not contain business rules, and the view must not query the database.

**Where MVC fits in Express.** Express ships routers, not controllers, so the mapping is a convention you adopt: \`app.post("/orders", createOrder)\` with \`createOrder\` in \`src/controllers/order.controller.ts\`, the model in \`src/domain/\`, and the view either \`res.render("order")\` or \`res.json(order)\`.

**Where it strains.** MVC was designed for interfaces with rich server-rendered views. A JSON API has no real view layer, so the balanced triangle collapses into two boxes — and business logic quietly migrates into controllers because nothing pushes back from the view side.

| Architecture | View layer | Business logic lives in | Best when |
| --- | --- | --- | --- |
| MVC (server-rendered) | Templates | Model | Pages with lots of HTML |
| MVC (JSON API) | Serializers | Drifting into controllers | Small CRUD APIs |
| Layered / use cases | Controllers + presenters | Service or use-case layer | Rules grow past CRUD |
    `,
    howItWorks: `
At runtime an Express MVC request does this: routing matches a path to a controller function; the controller reads \`req.params\`, \`req.query\` and \`req.body\`; it passes plain data to the model, which applies rules and persists; the model returns a result object; the controller decides the status code and hands the result to a view — \`res.render()\` for templates or \`res.json()\` for APIs. Middleware (auth, validation, error handlers) runs around this pipeline. Nothing in this flow is magic: MVC is a folder-and-call convention you enforce, and the framework will happily let you break it.
    `,
    codeExamples: [
      {
        title: "The three roles separated in Express",
        language: "ts",
        code: `import type { Request, Response, NextFunction } from "express";

// ---- MODEL: data + rules, no HTTP knowledge ----
export type OrderStatus = "draft" | "placed" | "cancelled";
export interface Order {
  id: string;
  items: { sku: string; qty: number }[];
  status: OrderStatus;
}
export function placeOrder(order: Order): Order {
  if (order.items.length === 0) throw new Error("EMPTY_ORDER");
  if (order.status !== "draft") throw new Error("NOT_DRAFT");
  return { ...order, status: "placed" };
}

const store = new Map<string, Order>();

// ---- CONTROLLER: transport only, no rules ----
export function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const draft: Order = { id: "o-" + (store.size + 1), items: req.body.items, status: "draft" };
    const placed = placeOrder(draft); // model decides, not the controller
    store.set(placed.id, placed);
    res.status(201).json(placed); // VIEW: JSON is the response representation
  } catch (err) {
    next(err);
  }
}`,
        description:
          "The model never imports express, the controller never contains business rules, and the \"view\" is the single res.json call. That last line is the whole view layer of a JSON API — which is why MVC alone stops being descriptive once logic grows.",
      },
      {
        title: "The same app when the view is a template",
        language: "ts",
        code: `// Server-rendered variant: the view is now a real file
export function showOrder(req: Request, res: Response, next: NextFunction) {
  const order = store.get(req.params.id);
  if (!order) return res.status(404).render("error", { code: 404 });
  // The template only interpolates: {{order.id}} {{order.status}}
  res.render("order", { order });
}`,
        description:
          "With a template the third role becomes visible: the view formats and never fetches. Compare this with the JSON version — the asymmetry between the two is exactly why APIs usually evolve into layered or use-case architectures.",
      },
    ],
    commonMistakes: [
      "Putting business rules in controllers because \"there is no view to hold them\" — the model role still exists even when nobody renders HTML.",
      "Letting controllers build SQL or Prisma queries directly; that is the model's persistence concern leaking upward.",
      "Naming a folder src/views and filling it with response-shaping code that also decides status codes and side effects — a view only formats.",
      "Claiming the app \"uses MVC\" when there is one 600-line route file: MVC is a set of enforced boundaries, not a folder name.",
    ],
    bestPractices: [
      "Keep controllers thin: parse input, call one model/use-case function, choose a status code, return.",
      "Treat serializers as the API view layer and keep them pure functions of domain objects.",
      "Write the flow down in a README (route → controller → service → repository) so new contributors do not invent a second style.",
      "Re-evaluate MVC when a controller exceeds roughly one screen of logic — that is the signal to move to layers.",
    ],
    realWorldUseCases: [
      "Server-rendered dashboards and admin panels (EJS, Handlebars, Nunjucks) where each page has a controller action plus a template.",
      "Small REST CRUD services where every endpoint maps to a model operation and a JSON serializer — MVC plus a service file is enough.",
      "Legacy Express codebases: refactoring a fat controller usually means re-discovering the missing model role.",
    ],
    resources: lessonResources({
      official: {
        title: "Express — Routing guide",
        url: OFFICIAL.expressGuide,
        description: "How routes and handlers are registered — the place MVC controllers plug into Express.",
      },
      videos: [
        {
          query: "MVC pattern explained with node express",
          description: "Visual walkthroughs of model, view, controller responsibilities and data flow.",
          estimatedDuration: "10–20 min",
        },
      ],
      article: {
        title: "Wikipedia — Model–view–controller",
        url: "https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller",
        provider: "wikipedia.org",
        description: "Origin of the pattern in Smalltalk GUIs — the context that explains its modern limits on APIs.",
        estimatedDuration: "15 min",
      },
    }),
    exercises: [
      {
        id: "ex-p3m1-mvc-split",
        title: "Split a fat controller",
        prompt:
          "This route does everything: parsing, a SQL query, a discount rule and JSON shaping. Refactor it into MVC roles (controller, model, serializer) without changing its observable behaviour: status codes, response bodies and error cases must be identical. List what moved and why.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Anything that decides whether the order is valid belongs to the model, not the controller.",
          "Keep the SQL (or Prisma call) behind one model function so the controller cannot touch the database.",
        ],
        solution: `app.post("/orders", async (req, res, next) => {
  try {
    const { customerId, items } = req.body;
    const order = await createOrder({ customerId, items }); // MODEL: rule + persistence
    res.status(201).json(toOrderDto(order));                 // VIEW: serializer
  } catch (err) {
    next(err);
  }
});

// model/createOrder.ts — pure rules plus one persistence call
export async function createOrder(input: { customerId: string; items: Item[] }) {
  if (input.items.length === 0) throw new AppError("EMPTY_ORDER", 422);
  const total = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return prisma.order.create({ data: { ...input, total, status: "OPEN" } });
}

// view/orderDto.ts — formatting only
export const toOrderDto = (o: Order) => ({ id: o.id, total: o.total, status: o.status });`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-mvc-audit",
        title: "Audit an MVC claim",
        prompt:
          "Open any Express project you have written (or a sample repo) and answer: where does business logic actually live, how many lines are in the largest route handler, and which role — model, view or controller — is missing or overgrown? Propose one concrete move that rebalances it.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["Grep for SQL keywords or prisma. calls inside files that also read req.body — that is a merged controller+model."],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-layered-architecture",
    slug: "layered-architecture",
    title: "Layered Architecture",
    description:
      "Presentation, domain and infrastructure layers, the dependency rule that points everything inward, and how layering compares with MVC and hexagonal architecture.",
    order: 2,
    estimatedMinutes: 22,
    tags: ["layers", "architecture", "dependency-direction", "clean-code"],
    prerequisites: ["p3m1-mvc", "p2m2-controllers-services"],
    relatedTopics: ["p3m1-clean-architecture", "p3m1-separation-of-concerns", "p3m1-dependency-injection"],
    learningObjectives: [
      "Name the three conventional layers and what each one is allowed to know",
      "Enforce a dependency direction so domain code never imports Express or Prisma",
      "Compare layered, MVC and hexagonal architectures with explicit trade-offs",
      "Detect layering violations such as controllers calling the database or domain importing HTTP types",
    ],
    simpleExplanation:
      "A layered architecture stacks the program into horizontal bands: **presentation** (routes, controllers, serializers) on top, **domain** (business rules) in the middle, **infrastructure** (databases, HTTP clients, queues) at the bottom. Code in an inner/lower layer may never know about the layer above it — so your domain does not know Express exists, and it does not care whether data comes from Postgres or an in-memory array.",
    detailedContent: `
**The three layers and their allowed knowledge**

| Layer | Contains | May import | Must never import |
| --- | --- | --- | --- |
| Presentation | Routes, controllers, DTOs, middleware | Domain services, use cases | SQL, Prisma client, external SDKs |
| Domain | Entities, rules, application services | Nothing outward | \`express\`, \`prisma\`, SDKs, \`process.env\` |
| Infrastructure | Repositories, message clients, clock, config | Domain interfaces (to implement them) | Controllers, Express types |

The rule that makes it work: **dependencies point downward and inward only**. Domain defines *what* it needs (\`interface OrderRepository\`); infrastructure implements *how* (\`PrismaOrderRepository\`). When control flow must travel upward — the domain emitting an event a controller handles — you invert the dependency with an interface declared on the domain side.

**Compared with MVC**, layering is horizontal rather than role-based: MVC separates by user-interface responsibility, layering separates by *reason to change*. **Compared with hexagonal/clean architecture**, a strict three-layer split is a coarser version of the same idea: fewer rings, less ceremony, weaker guarantees.

Use layers when your app has real business rules but one delivery mechanism (HTTP). Reach for more rings (clean/hexagonal) when you also ship a CLI, a queue consumer and a cron job against the same rules.
    `,
    howItWorks: `
A request enters at the top: Express routes it to a controller (presentation), which validates input and calls an application service. The service consults domain objects to decide what should happen, then asks a repository interface for data. At the composition root — \`app.ts\` — you wire \`new OrderService(new PrismaOrderRepository(prisma))\`, and the concrete infrastructure class is injected there. Because the domain file only mentions the interface, importing it in a test needs no database at all. Layering is therefore enforced in two places: TypeScript's import graph (what compiles) and a composition root (where concretes meet abstractions).
    `,
    codeExamples: [
      {
        title: "Dependency direction: domain defines, infrastructure implements",
        language: "ts",
        code: `// domain/order/orderRepository.ts — INNER layer, imports nothing outward
export interface Order {
  id: string;
  total: number;
  status: "OPEN" | "PAID" | "CANCELLED";
}
export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

// domain/order/placeOrder.ts — still no Express, no Prisma
export class PlaceOrder {
  constructor(private readonly orders: OrderRepository) {}
  async run(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== "OPEN") throw new Error("NOT_OPEN");
    const paid = { ...order, status: "PAID" as const };
    await this.orders.save(paid);
    return paid;
  }
}`,
        description:
          "The domain layer knows only interfaces. It can be unit-tested with a five-line fake repository and reused by an HTTP controller, a queue worker or a CLI without modification.",
      },
      {
        title: "Composition root: where concretes are allowed",
        language: "ts",
        code: `// src/app.ts — the ONLY file allowed to import every layer
import { PlaceOrder } from "./domain/order/placeOrder.js";
import { PrismaOrderRepository } from "./infrastructure/prismaOrderRepository.js";
import { orderRouter } from "./presentation/order.router.js";

const placeOrder = new PlaceOrder(new PrismaOrderRepository(prisma));
app.use("/orders", orderRouter(placeOrder)); // controller receives the use case`,
        description:
          "Dependency inversion made practical: wiring happens once at startup, so swapping Postgres for an in-memory repository in tests means changing one line instead of rewriting controllers.",
      },
    ],
    commonMistakes: [
      "Domain services importing prisma or express types 'just for convenience' — that single import collapses the whole layering.",
      "Creating a layer for every noun (DTO layer, mapper layer, utility layer) so nobody can find where logic lives.",
      "Letting controllers construct repositories themselves, which forces every handler to know infrastructure details.",
      "Passing ORM row objects up to the presentation layer, so a schema change ripples through every endpoint.",
    ],
    bestPractices: [
      "Define repository interfaces in the domain folder and implement them in infrastructure — the interface lives next to its only consumer.",
      "Wire dependencies in exactly one composition root (app.ts / container.ts).",
      "Keep the layer count small: presentation, domain, infrastructure covers most Node services; add rings only with a concrete reason.",
      "Add an import-boundary lint rule (for example eslint-plugin-boundaries or a simple dependency-cruiser config) so violations fail CI.",
    ],
    realWorldUseCases: [
      "Payment or booking services where the same rules must run from an HTTP endpoint and a background job.",
      "Teams swapping persistence technology (MongoDB to Postgres) without touching endpoint code.",
      "Codebases being prepared for tests that must not spin up a database.",
    ],
    resources: [
      docs("Express API reference", OFFICIAL.expressApi, "Presentation-layer primitives your controllers are built on.", "en", "reference"),
      article(
        "Wikipedia — Three-tier architecture",
        "https://en.wikipedia.org/wiki/Three-tier_architecture",
        "wikipedia.org",
        "The classic presentation / application / data tier split and its rationale.",
        { estimatedDuration: "12 min" },
      ),
      ytSearch("layered architecture nodejs typescript", "Walkthroughs of presentation, domain and infrastructure layers in Node services.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-layer-audit",
        title: "Find the violations",
        prompt:
          "Take any Node project with 3+ folders and list every import that crosses the layering rules (domain importing express/prisma, presentation importing prisma directly, infrastructure importing controllers). For each, write the one-line change that fixes the direction.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Search for `from \"express\"` and `from \"@prisma/client\"` and check which folders they appear in."],
      },
      {
        id: "ex-p3m1-layer-reverse",
        title: "Invert one upward dependency",
        prompt:
          "Your domain code needs to send an email after an order is placed, but sending email is infrastructure. Refactor so the domain decides *when* and the infrastructure decides *how*: declare a port in the domain, implement it in infrastructure, inject it in the composition root, and show the unit test that uses a fake.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["The interface must be declared in the domain folder even though the implementation lives outside it."],
        solution: `// domain/ports/mailer.ts
export interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

// domain/order/placeOrder.ts
export class PlaceOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly mailer: Mailer,
  ) {}
  async run(id: string) {
    const order = await this.orders.findById(id);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    await this.orders.save({ ...order, status: "PAID" });
    await this.mailer.send("ops@example.com", "Order paid", "Order " + id);
  }
}

// test: no SMTP, no network
const sent: string[] = [];
const fakeMailer: Mailer = { send: async (to, subject) => void sent.push(subject) };
const useCase = new PlaceOrder(new FakeOrderRepo(), fakeMailer);
await useCase.run("o-1");
expect(sent).toEqual(["Order paid"]);`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-analytics-api"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-separation-of-concerns",
    slug: "separation-of-concerns",
    title: "Separation of Concerns",
    description:
      "The principle underneath every architecture, with a practical inventory of the smells that show it breaking in real Express code.",
    order: 3,
    estimatedMinutes: 17,
    tags: ["soc", "design-principles", "refactoring", "architecture"],
    prerequisites: ["p3m1-mvc", "p2m2-controllers-services"],
    relatedTopics: ["p3m1-layered-architecture", "p3m1-solid", "p3m1-refactoring"],
    learningObjectives: [
      "State separation of concerns in one sentence and explain why it reduces change cost",
      "Recognise concrete violations in Express code: route handlers doing SQL, validation inside queries, formatting inside rules",
      "Use a file-by-file question list to decide which concern a block of code belongs to",
      "Apply a small extraction that restores separation without changing behaviour",
    ],
    simpleExplanation:
      "Separation of concerns means each module should own exactly one reason to change. When a route handler parses input, runs SQL, applies a discount and formats JSON, four independent concerns are welded together — so a change to any of them risks breaking the other three. Splitting them lets each piece change on its own schedule.",
    detailedContent: `
The classic formulation is "do one thing", but the useful test is sharper: **how many things change for different reasons inside this function?** A concern is anything with its own trigger for change — HTTP shape, business rule, storage format, third-party API, logging policy.

**Signs of violation you can spot in an Express codebase**

| Symptom in code | Concerns mixed | Typical fix |
| --- | --- | --- |
| \`res.send\` handler contains \`SELECT\`/ \`prisma.$queryRaw\` | Transport + persistence | Extract a repository function |
| Discount/tax rules inline in a route | Transport + business rules | Move rules to a domain function |
| \`try/catch\` blocks copy-pasted per handler | Error policy duplicated | Centralised error middleware |
| JSON field renaming scattered across handlers | Transport + representation | One serializer per resource |
| Date/time zones computed in several files | Domain + environment | Inject a clock, format once |

Layering, MVC, clean architecture and DDD are all *specific answers* to the same question separation of concerns poses. The principle itself has no folder structure — it is a property you keep verifying.

Two cautions: separating too early creates indirection with one implementation and no test value; and "concerns" are not "files". One small pure function with three rules is fine if they change together.
    `,
    howItWorks: `
In practice you restore separation with a three-move sequence. First, identify the seam: the line where "what the HTTP layer must do" stops and "what the business needs" begins. Second, extract the second half into a named function that takes plain data and returns plain data — no \`req\`, no \`res\`, no imports from express. Third, call it from the original handler and verify behaviour with tests or a manual request replay. Because the extracted function has no framework types, you can now unit-test it directly and reuse it from a queue worker. The event loop never notices; the diff is usually smaller than the discussion about it.
    `,
    codeExamples: [
      {
        title: "Before: one route handler owns four concerns",
        language: "ts",
        code: `app.post("/coupons/redeem", async (req, res) => {
  const { code, userId } = req.body;                                  // 1. transport parsing
  const rows = await prisma.$queryRaw\`                                 // 2. persistence
    SELECT * FROM coupons WHERE code = \${code} AND used_by IS NULL\`;
  if (!rows.length) return res.status(404).json({ error: "NOT_FOUND" });
  const pct = rows[0].discount_pct > 50 ? 50 : rows[0].discount_pct;   // 3. business rule
  await prisma.$executeRaw\`UPDATE coupons SET used_by = \${userId} WHERE code = \${code}\`;
  res.json({ message: "redeemed", discount: pct, when: new Date() });  // 4. formatting
});`,
        description:
          "Every concern here has a different reason to change: the payload shape, the SQL schema, the capping rule and the response contract. A single bug report can require editing this function for all four.",
      },
      {
        title: "After: each concern has one home",
        language: "ts",
        code: `// domain/coupons/redeemCoupon.ts — rules only
export function capDiscount(pct: number): number {
  return Math.min(pct, 50);
}

// infrastructure/couponRepository.ts — SQL only
export async function redeem(code: string, userId: string): Promise<Coupon | null> {
  const rows = await prisma.$queryRaw<CouponRow[]>\`
    SELECT * FROM coupons WHERE code = \${code} AND used_by IS NULL\`;
  return rows[0] ? toDomain(rows[0]) : null;
}

// presentation/coupon.controller.ts — transport only
app.post("/coupons/redeem", async (req, res, next) => {
  try {
    const coupon = await redeemCoupon(req.body.code, req.body.userId);
    if (!coupon) return res.status(404).json({ error: "NOT_FOUND" });
    res.json({ message: "redeemed", discount: capDiscount(coupon.pct), when: new Date() });
  } catch (err) {
    next(err);
  }
});`,
        description:
          "Same observable behaviour, three files with one reason to change each. The rule (capDiscount) is now a two-line unit test with no database and no HTTP server.",
      },
    ],
    commonMistakes: [
      "Doing SQL inside route handlers because the query is \"only three lines\" — that is exactly how persistence becomes unreplaceable.",
      "Splitting by layer so aggressively that reading one feature requires opening nine files; separate concerns, not every statement.",
      "Mixing formatting into rules (returning a pre-rendered string from a domain function), which forces duplication for a second output format.",
      "Treating middleware as a dumping ground: a middleware that validates, authorises, queries and logs has four concerns again.",
    ],
    bestPractices: [
      "Ask \"what would force me to edit this function?\" for each block; more than two independent answers means split it.",
      "Keep framework types (Request/Response) at the edge — anything that takes them is presentation code.",
      "Name extracted functions after the concern (priceOrder, reserveSeat) rather than the layer (helper2).",
      "Prefer boring seams: extract one function at a time and keep the tests green between steps.",
    ],
    realWorldUseCases: [
      "Adding a webhook delivery of \"coupon redeemed\" events: trivial once redemption logic is not trapped in an HTTP handler.",
      "Switching an analytics query from Postgres to ClickHouse without touching endpoint contracts.",
      "Making business rules testable in CI without booting Express or a database container.",
    ],
    resources: [
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Layered project structure guidance for Node services, including separation of layers.", "en", "reference"),
      article(
        "Wikipedia — Separation of concerns",
        "https://en.wikipedia.org/wiki/Separation_of_concerns",
        "wikipedia.org",
        "Dijkstra's formulation and how the idea underpins every layered architecture.",
        { estimatedDuration: "10 min" },
      ),
      ytSearch("separation of concerns node express refactor", "Before/after refactors of fat route handlers.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-soc-inventory",
        title: "Concern inventory",
        prompt:
          "Take your largest route handler (or the sample above) and annotate every statement with one of: transport, validation, business rule, persistence, formatting, logging. Report the count per concern and split the top two into functions. Show the final handler.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Anything importing express types is transport; anything mentioning a table or collection is persistence."],
        solution: `// After annotation the handler shrinks to orchestration:
app.post("/orders", async (req, res, next) => {
  try {
    const input = OrderInput.parse(req.body);      // validation (zod) — transport concern
    const order = await placeOrder(input);         // rules + persistence, inside the domain
    res.status(201).json(toOrderDto(order));        // formatting
  } catch (err) {
    next(err);                                      // error policy handled once, globally
  }
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-soc-middleware",
        title: "Audit your middleware",
        prompt:
          "List every middleware in an Express app and the concerns each one touches. Write a one-paragraph design for a request: which middleware runs, in what order, and what each is exclusively responsible for.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: ["A well-formed chain looks like: request id → auth → rate limit → parse/validate → handler → error handler."],
      },
    ],
    projectIds: ["p3-chat-app", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-modular-monoliths",
    slug: "modular-monoliths",
    title: "Modular Monoliths",
    description:
      "Modules with hard boundaries and in-process events inside a single deployable — plus the full trade-off table against microservices before you ever split a process.",
    order: 4,
    estimatedMinutes: 24,
    tags: ["modular-monolith", "microservices", "boundaries", "events"],
    prerequisites: ["p3m1-separation-of-concerns", "p2m1-code-organization"],
    relatedTopics: ["p3m1-large-project-structure", "p3m1-clean-architecture", "p3m1-ddd-fundamentals"],
    learningObjectives: [
      "Define a module boundary: public API, private internals, own data, explicit dependencies",
      "Use an in-process event bus to decouple modules without importing each other",
      "Compare modular monoliths and microservices across deployment, data, failure modes and team cost",
      "State concrete triggers that justify extracting a service — and the ones that do not",
    ],
    simpleExplanation:
      "A modular monolith is one deployable process whose insides are cut into modules that may only talk through a small published API — exactly like separate services, except everything runs in the same process. You get most of the clarity of microservices (clear ownership, replaceable pieces) without the network: calls are function calls, transactions are real transactions, and deploys stay one button.",
    detailedContent: `
A module is defined by four rules:

1. **Public API only** — other modules import from \`modules/billing/index.ts\`, never from deep files.
2. **Private internals** — everything else in the folder is invisible outside; enforce it with lint boundaries.
3. **Own data** — module-owned tables/collections; cross-module reads go through the API, not raw SQL.
4. **Explicit dependencies** — modules declare what they need, wired at composition root.

**In-process events** remove the remaining coupling. When an order is paid, billing publishes \`order.paid\` on a tiny bus; inventory and analytics subscribe. Neither module imports the other, and adding a subscriber cannot break the publisher.

**Monolith vs microservices — the honest trade-off**

| Dimension | Modular monolith | Microservices |
| --- | --- | --- |
| Deployment | One artifact, one rollback | Per-service rollout, version skew |
| Calls | In-process, microseconds | Network: latency, timeouts, retries |
| Data | Real ACID transactions across modules | Saga/eventual consistency by default |
| Failure | One process dies: everything dies | Isolated failures, but cascades possible |
| Ops cost | One service to monitor | N services, tracing, CI/CD pipelines |
| Team scaling | Fine up to tens of engineers | Needed when teams must deploy independently |
| Tech diversity | One stack | Polyglot possible |

**When to split:** an extraction must buy something concrete — an independent scaling profile (video transcoder), an isolated failure domain, a hard security boundary, or genuinely separate team ownership with conflicting release cadence. "We might need it later" and "microservices look modern" are not reasons. Almost every successful microservice estate started as a monolith that was later split along boundaries it had already grown.
    `,
    howItWorks: `
At boot the composition root imports each module's public entry point and wires dependencies: \`new BillingModule({ orders, events, prisma })\`. A cross-module call is an interface call — fast, synchronous, typed. When order matters more than coupling, the publisher emits an event on an in-memory emitter and subscribers run asynchronously; because it is in-process, ordering and error handling stay simple (a failed subscriber logs and can retry without a broker). A module can later be lifted out by replacing the in-process bus with a message broker and the interface with an HTTP client — the seam already exists, which is precisely the point.
    `,
    codeExamples: [
      {
        title: "Module boundary plus an in-process event bus",
        language: "ts",
        code: `// shared/events.ts — the only shared piece every module may touch
import { EventEmitter } from "node:events";
export type AppEvent = { type: "order.paid"; orderId: string; total: number };
export const bus = new EventEmitter();
export const publish = (e: AppEvent) => void bus.emit(e.type, e);

// modules/orders/public.ts — PUBLIC API only
export { placeOrder } from "./placeOrder.js";
export { subscribeOrderPaid } from "./subscriber.js"; // registration, not internals

// modules/orders/internal/  — nothing outside this folder may import from here

// modules/billing/index.ts — subscribes without importing the orders module
export function registerBilling(events: { on: (h: (e: AppEvent) => void) => void }) {
  events.on((e) => {
    if (e.type === "order.paid") void issueInvoice(e.orderId, e.total);
  });
}`,
        description:
          "Modules couple through one event type and one bus, not through each other's folders. Billing can be deleted, tested or later extracted to its own process by swapping this registration for a broker consumer.",
      },
      {
        title: "Forbid deep imports with a lint rule",
        language: "ts",
        code: `// dependency-cruiser rule (excerpt): module internals stay private
module.exports = {
  forbidden: [
    {
      name: "module-public-api",
      from: { path: "src/modules/([^/]+)/.+", pathNot: "src/modules/([^/]+)/index.ts" },
      to: { path: "src/modules/([^/]+)/" },
      comment: "Import the module barrel, not files deep inside it.",
    },
  ],
};`,
        description:
          "Boundaries that live only in code review decay; a rule that fails CI keeps them honest as the team and codebase grow.",
      },
    ],
    commonMistakes: [
      "A \"shared\" module that every module imports and which slowly becomes a dumping ground — the shared kernel must stay tiny.",
      "Cross-module SQL: reading another module's tables silently destroys the boundary you just built.",
      "Publishing events for everything so that control flow becomes invisible; keep synchronous calls for requests, events for reactions.",
      "Jumping to microservices to \"enforce\" boundaries — a network hop enforces nothing if the same team still shares the database.",
    ],
    bestPractices: [
      "Start every new domain as a module folder with an index.ts barrel and one owner team/person.",
      "Give each module its own tables and migrate them together with the module's code.",
      "Use events for \"something happened, others may care\", direct calls for \"I need an answer now\".",
      "Track cross-module imports on a dashboard; a rising count is the signal to refactor, not to distribute.",
    ],
    realWorldUseCases: [
      "E-commerce backends where catalog, orders and billing are separate modules but need atomic checkout transactions.",
      "SaaS products with a small team that want domain ownership now and the option to extract a heavy worker (reporting, video) later.",
      "Brownfield systems: introducing modules inside an existing monolith is the safest first step toward any future split.",
    ],
    resources: [
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Structural recommendations for layering and organising a growing Node codebase.", "en", "reference"),
      article(
        "Martin Fowler — Microservices guide",
        "https://martinfowler.com/microservices/",
        "martinfowler.com",
        "The definition, benefits and costs of microservices — including \"monolith first\" advice.",
        { estimatedDuration: "25 min" },
      ),
      ytSearch("modular monolith vs microservices trade offs", "Comparisons covering deployment, transactions and team scaling.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-mono-boundaries",
        title: "Draw the boundary",
        prompt:
          "For an e-commerce backend, list modules (catalog, cart, orders, billing, shipping, notifications) and for each: its public API (max 5 functions), its private internals, its tables, and the events it publishes/subscribes to. Then mark every place in your existing code where one module reaches into another's tables.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["If two modules must share a table today, note it as a migration task rather than pretending it is fine."],
      },
      {
        id: "ex-p3m1-mono-extract",
        title: "Justify an extraction",
        prompt:
          "Pick one candidate for extraction from the previous exercise (for example image transcoding). Write a one-page decision: what it buys (scaling, isolation, ownership), what it costs (network, consistency, ops), the trigger metric that would make it worth it, and what you must change first while still a monolith.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: ["A good answer names a measurable trigger — for example \"transcoding CPU starves API p95 above 800ms\" — not a feeling."],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-clean-architecture",
    slug: "clean-architecture",
    title: "Clean Architecture",
    description:
      "Entities, use cases and adapters in concentric rings, the dependency rule that points source-code dependencies inward, and framework independence as the payoff.",
    order: 5,
    estimatedMinutes: 24,
    tags: ["clean-architecture", "boundaries", "dependency-rule", "ports-and-adapters"],
    prerequisites: ["p3m1-layered-architecture", "p3m1-separation-of-concerns"],
    relatedTopics: ["p3m1-dependency-injection", "p3m1-repository-service-patterns", "p3m1-solid", "p3m1-ddd-fundamentals"],
    learningObjectives: [
      "Draw the four clean-architecture rings and state the dependency rule for each boundary",
      "Write a use case that depends on ports instead of a database, an HTTP framework or a clock",
      "Show how dependency inversion keeps control flow moving outward while imports move inward",
      "Compare clean architecture with layered and MVC structures, including what the extra ceremony costs",
    ],
    simpleExplanation:
      "Clean architecture arranges code in concentric rings: **entities** (core business objects) in the middle, **use cases** (application actions) around them, **adapters** (controllers, repositories, gateways) around those, and **frameworks/drivers** (Express, Prisma, fs) on the outside. The one rule: source-code dependencies may only point inward, so nothing in the middle even knows that Express or a database exists.",
    detailedContent: `
**The rings, inner to outer**

| Ring | Contains | Knows about | Changes when |
| --- | --- | --- | --- |
| Entities | Enterprise business objects and rules | Nothing external | Business rules change |
| Use cases | Application-specific orchestration | Entities, ports | A workflow changes |
| Interface adapters | Controllers, presenters, repository impls | Use cases | Delivery or storage format changes |
| Frameworks & drivers | Express, Prisma, fs, queues | Adapters | You swap a tool |

**The dependency rule.** Imports point inward only. When control flow must go outward — a use case calling a presenter or a repository — you declare an interface *in the inner ring* and implement it outside, then inject the implementation. The import graph and the runtime call flow deliberately oppose each other.

**Data crossing a ring** is plain data: primitives, small DTOs, or domain objects you own. Never let an ORM row type or an \`express.Request\` leak inward; those are outer-ring formats.

**Versus the alternatives**

| | MVC | Layered | Clean |
| --- | --- | --- | --- |
| Unit of separation | UI roles | Horizontal layers | Business distance from tools |
| Domain free of framework types? | Rarely | Usually | By rule |
| Ceremony | Low | Medium | High (ports, DTOs, mappers) |
| Swap Express/Prisma | Touches everything | Moderate | Mostly adapters |
| When it pays off | Simple web apps | Single delivery channel | Multiple delivery channels + strict tests |

The honest cost: more files, more mapping code and more indirection per feature. Clean architecture earns that back when the same rules are driven by HTTP, a queue and a CLI — or when tests must run with zero infrastructure.
    `,
    howItWorks: `
A request flows outward-in on control and inward-out on dependencies. Express receives the request (outer ring), a controller maps it to a use-case input DTO and calls \`placeOrder.execute({ orderId })\`. The use case loads the entity through a \`OrderRepository\` port, applies rules, saves through the same port, and returns an output DTO. The controller (or a presenter) formats that for HTTP. At boot, \`main.ts\` binds \`PrismaOrderRepository\` to the port. Because the use case imports only the port, the whole middle of the system runs in a unit test with arrays instead of Postgres — and a CLI entry point can call the identical use case without any HTTP code.
    `,
    codeExamples: [
      {
        title: "A use case that imports only inward",
        language: "ts",
        code: `// entities/order.ts — innermost ring
export class Order {
  status: "OPEN" | "PAID" = "OPEN";
  paidAt?: Date;
  constructor(readonly id: string) {}
  pay(clock: { now(): Date }) {
    if (this.status !== "OPEN") throw new Error("ALREADY_PAID");
    this.status = "PAID";
    this.paidAt = clock.now();
  }
}

// use-cases/placeOrder.ts — depends on ports, never on Prisma or Express
export interface OrderRepository {
  get(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
export interface Clock {
  now(): Date;
}
export interface PlaceOrderInput {
  orderId: string;
}
export class PlaceOrder {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}
  async execute(input: PlaceOrderInput): Promise<{ status: string }> {
    const order = await this.orders.get(input.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    order.pay(this.clock); // entity rule decides, injected clock keeps it pure
    await this.orders.save(order);
    return { status: order.status };
  }
}`,
        description:
          "Two ports declared where they are consumed. The use case compiles with no knowledge of HTTP, SQL, Date.now() or Node — swapping any of them is an outer-ring change.",
      },
      {
        title: "Adapters outside, wiring at the edge",
        language: "ts",
        code: `// adapters/http/order.controller.ts
export function makeOrderHandler(placeOrder: PlaceOrder) {
  return async (req: Request, res: Response) => {
    const out = await placeOrder.execute({ orderId: req.params.id });
    res.json(out);
  };
}

// adapters/persistence/prismaOrderRepository.ts
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async get(id: string) {
    const row = await this.prisma.order.findUnique({ where: { id } });
    return row ? hydrate(row) : null; // row type stops here
  }
  async save(order: Order) { /* map back to columns */ }
}

// frameworks/drivers/main.ts — composition root
const placeOrder = new PlaceOrder(new PrismaOrderRepository(prisma), systemClock);
app.get("/orders/:id", makeOrderHandler(placeOrder));`,
        description:
          "The Express handler and the Prisma adapter are both replaceable shells: tests can pass an in-memory repository and a fake clock to the exact same use case class.",
      },
    ],
    commonMistakes: [
      "Creating a port, a mapper, a DTO and a service for a function that is four lines — ceremony without a second implementation is waste.",
      "Letting `express.Request` or a Prisma row type cross into a use case: the dependency rule is broken even if the folder names look right.",
      "Splitting into more rings than you have delivery mechanisms; four rings for one HTTP app is usually three too many.",
      "Mutable shared entities with no invariants: clean architecture does not fix a domain model that permits invalid states.",
    ],
    bestPractices: [
      "Add a ring only when a second consumer appears (CLI, worker, second protocol) and feel the pain first.",
      "Keep use-case input/output as plain objects you own, so a framework upgrade cannot break them.",
      "Inject cross-cutting outer capabilities (clock, id generator, mailer, logger) as ports instead of importing them.",
      "Verify the rule mechanically: an import-boundary test that fails when domain files mention express or prisma.",
    ],
    realWorldUseCases: [
      "Job-processing backends where the same use case serves HTTP, a queue consumer and a scheduled sweep.",
      "Fintech or booking domains where business rules must be testable to high coverage without touching a database.",
      "Teams migrating off a framework: only adapters and the composition root are rewritten.",
    ],
    resources: [
      article(
        "The Clean Architecture — Robert C. Martin",
        "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html",
        "blog.cleancoder.com",
        "The original article defining entities, use cases, interface adapters and the dependency rule.",
        { estimatedDuration: "20 min" },
      ),
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Structuring Node services so concerns stay separated as they grow.", "en", "reference"),
      ytSearch("clean architecture typescript node example", "Ring-by-ring walkthroughs with runnable TypeScript projects.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-clean-ring",
        title: "Move one use case inward",
        prompt:
          "Take an endpoint that currently queries Prisma directly and restructure it into entity + use case + port + Prisma adapter + controller. Write down, for each file you created, which ring it belongs to and what it is allowed to import. Then run the use case in a unit test with an in-memory repository.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "The port interface must be declared in the use-case folder even though only the adapter implements it.",
          "If your test needs a database, a ring boundary has leaked.",
        ],
        solution: `class InMemoryOrderRepo implements OrderRepository {
  private rows = new Map<string, Order>();
  async get(id: string) { return this.rows.get(id) ?? null; }
  async save(order: Order) { this.rows.set(order.id, order); }
}

it("pays an open order exactly once", async () => {
  const repo = new InMemoryOrderRepo();
  await repo.save(new Order("o-1"));
  const useCase = new PlaceOrder(repo, { now: () => new Date("2026-01-01T00:00:00Z") });
  await useCase.execute({ orderId: "o-1" });
  await expect(useCase.execute({ orderId: "o-1" })).rejects.toThrow("ALREADY_PAID");
});`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-clean-boundary-check",
        title: "Prove the dependency rule",
        prompt:
          "Write a script (or test) that walks your source tree and prints every file under domain/ or use-cases/ whose imports mention express, prisma, axios, fs or process.env. Run it on your project and refactor the first violation it reports.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Node's fs.readdirSync with { recursive: true } plus a regex over `from \"...\"` clauses is enough."],
      },
    ],
    projectIds: ["p3-job-processing", "p3-capstone"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-dependency-injection",
    slug: "dependency-injection",
    title: "Dependency Injection",
    description:
      "Constructor injection, a twenty-line service container that you write yourself, and why injected seams make Node tests fast — without any DI framework.",
    order: 6,
    estimatedMinutes: 21,
    tags: ["dependency-injection", "testing", "composition-root", "di"],
    prerequisites: ["p3m1-clean-architecture", "p2m7-unit-testing"],
    relatedTopics: ["p3m1-solid", "p3m1-repository-service-patterns", "p3m1-layered-architecture"],
    learningObjectives: [
      "Separate the dependency injection technique from the DI-container tooling that often shadows it",
      "Apply constructor injection so every dependency of a service is visible in its signature",
      "Build a minimal container-lite that composes the object graph once at boot",
      "Explain precisely how injection improves test speed, determinism and isolation",
    ],
    simpleExplanation:
      "Dependency injection means a class does not go and fetch what it needs — it receives it, usually through its constructor. That simple change means you can hand a service a fake database, a fake clock or a fake mailer in tests, and it also means every dependency is visible in one place instead of scattered across `import` lines buried in method bodies.",
    detailedContent: `
There are three ways to get a collaborator, and they differ far more than they look:

| Approach | How it works | Advantages | Disadvantages | Use when |
| --- | --- | --- | --- | --- |
| Constructor injection | Dependencies are constructor arguments | Explicit, typed, works with plain \`new\` | Wiring moves to a composition root | Default for every service |
| Service locator | Class calls \`container.get(Mailer)\` | Few constructor parameters | Hidden deps, hard to see what a class needs, tests must build a container | Never for domain code |
| DI framework (Inversify, Nest, tsyringe) | Decorators + reflection resolve graphs | Centralised, handles scoping/lifecycle | Metadata/reflection magic, runtime surprises, steep learning curve | Large teams already committed to it |

**Why tests get better.** A service with injected dependencies can be constructed with fakes in microseconds — no database container, no network, no mocking library poking at module registries. Determinism improves too: inject \`Clock\` and \`IdGenerator\` instead of calling \`Date.now()\` and \`crypto.randomUUID()\` deep inside, and "next Monday" tests stop being flaky.

**Container-lite** is just a function that news up the graph and returns the roots. It replaces a framework for all but the most complex applications — in Node, where modules are already functions, thirty lines usually suffice.
    `,
    howItWorks: `
At boot, \`createApp()\` performs construction in dependency order: create the Prisma client, then repositories, then services that take repositories, then routers that take services, then \`app.use\` registrations. Nothing inside a service ever looks anything up — it only holds references passed at construction. In a test you call \`new PlaceOrder(fakeRepo, fixedClock)\` directly, or run the same \`createApp()\` with a \`buildContainer({ repo, clock })\` option object to get a fully wired app for integration tests. Because construction is ordinary code, you get compile-time checking, refactor-safe renames, and a call stack you can step through — properties no decorator-based container gives you for free.
    `,
    codeExamples: [
      {
        title: "Constructor injection + a container-lite you own",
        language: "ts",
        code: `// The service: three dependencies, all visible in the signature
export class BillingService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
  ) {}
  async issue(orderId: string, email: string) {
    const invoice = { id: "inv-" + this.invoices.nextId(), orderId, issuedAt: this.clock.now() };
    await this.invoices.save(invoice);
    await this.mailer.send(email, "Invoice ready", invoice.id);
    return invoice;
  }
}

// container.ts — the whole "framework"
export function buildContainer(overrides: Partial<Deps> = {}) {
  const prisma = overrides.prisma ?? new PrismaClient();
  const deps: Deps = {
    invoices: overrides.invoices ?? new PrismaInvoiceRepository(prisma),
    mailer: overrides.mailer ?? new SmtpMailer(),
    clock: overrides.clock ?? systemClock,
    events: overrides.events ?? new EventBus(),
  };
  return {
    billing: new BillingService(deps.invoices, deps.mailer, deps.clock),
    // routers, workers, CLI handlers all take from here
  };
}`,
        description:
          "One plain function composes the graph; overrides make an in-memory app for tests without a single decorator, reflection call or global registry.",
      },
      {
        title: "The test this enables",
        language: "ts",
        code: `it("stores the invoice before emailing", async () => {
  const saved: Invoice[] = [];
  const sent: string[] = [];
  const order: string[] = [];

  const svc = new BillingService(
    { nextId: () => 1, save: async (i) => { saved.push(i); order.push("save"); } },
    { send: async () => { order.push("mail"); } },
    { now: () => new Date("2026-03-01T10:00:00Z") },
  );

  await svc.issue("o-9", "a@example.com");

  expect(saved).toHaveLength(1);
  expect(order).toEqual(["save", "mail"]); // persistence before side effect
});`,
        description:
          "Milliseconds, no mocks-of-modules, no open ports. The assertion on ordering documents a real invariant that a database-backed test would struggle to check.",
      },
    ],
    commonMistakes: [
      "Reaching for `container.get(SomeService)` inside methods — that is a service locator, and it hides what the class actually needs.",
      "Injecting concrete framework objects (the whole Prisma client) into domain services instead of narrow interfaces.",
      "Building a generic reflective container with decorators before the app has more than a handful of services.",
      "Mutable singletons registered at import time, which leak state between tests and create hidden circular imports.",
    ],
    bestPractices: [
      "Constructor-inject everything a class needs; if the constructor has too many arguments, the class has too many responsibilities.",
      "Make overrides partial and explicit so tests compose only what they care about.",
      "Inject time, randomness and external I/O — they are the four classic sources of flaky tests.",
      "Keep the composition root boring: one file, no business logic, easily read top to bottom.",
    ],
    realWorldUseCases: [
      "Integration tests that boot the real Express app against an in-memory repository and a fake payment gateway.",
      "Sandboxed environments: the same services wired to a stub mailer in CI and a real provider in production.",
      "Progressive migrations: replacing one infrastructure dependency at a time by changing only the container.",
    ],
    resources: [
      article(
        "Wikipedia — Dependency injection",
        "https://en.wikipedia.org/wiki/Dependency_injection",
        "wikipedia.org",
        "The technique, its history and the distinction between injection and a service locator.",
        { estimatedDuration: "15 min" },
      ),
      docs("Vitest — Getting started", OFFICIAL.vitestDocs, "Run the fast unit tests that injected dependencies make possible.", "en", "10 min"),
      ytSearch("dependency injection typescript without a framework", "Constructor injection and hand-rolled containers in Node projects.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-di-rewrite",
        title: "Inject three dependencies",
        prompt:
          "Find (or write) a service that calls Date.now(), crypto.randomUUID() and a database client directly. Refactor it to constructor-inject a Clock, an IdGenerator and a repository. Write one test that freezes time to prove an expiry rule, and one that asserts a fixed id.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Define the ports next to the service; the system implementations live in infrastructure.",
          "A frozen clock is just { now: () => new Date(\"2026-01-01T00:00:00Z\") }.",
        ],
        solution: `export class SessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}
  async start(userId: string) {
    const session = {
      id: this.ids.next(),
      userId,
      expiresAt: new Date(this.clock.now().getTime() + 1000 * 60 * 30),
    };
    await this.sessions.save(session);
    return session;
  }
}

const fixed = { now: () => new Date("2026-01-01T00:00:00Z") };
const svc = new SessionService(new FakeSessions(), fixed, { next: () => "s-1" });
const s = await svc.start("u-1");
expect(s.expiresAt.toISOString()).toBe("2026-01-01T00:30:00.000Z");`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-di-container",
        title: "Write your own container",
        prompt:
          "Implement buildContainer() for an app with at least four services and two repositories, including an overrides parameter. Prove it works by building a second container with an in-memory repository and running the same service test against both containers.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: ["Type the overrides as Partial<Deps> so omission means \"use production wiring\"."],
      },
    ],
    projectIds: ["p3-job-processing", "p3-analytics-api"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-solid",
    slug: "solid-principles",
    title: "SOLID in Node and TypeScript",
    description:
      "Each of the five principles with a real TypeScript violation and its fix — and guidance on which ones actually pay for themselves in backend services.",
    order: 7,
    estimatedMinutes: 25,
    tags: ["solid", "design-principles", "typescript", "refactoring"],
    prerequisites: ["p3m1-dependency-injection", "p3m1-separation-of-concerns"],
    relatedTopics: ["p3m1-refactoring", "p3m1-design-patterns", "p3m1-repository-service-patterns", "p3m1-clean-architecture"],
    learningObjectives: [
      "State SRP, OCP, LSP, ISP and DIP in terms of reasons to change, extension, substitutability, interfaces and direction",
      "Spot one concrete TypeScript violation of each principle in realistic code",
      "Apply the smallest fix that restores the principle without speculative abstraction",
      "Explain which principles give the best return in a Node backend and which are commonly over-applied",
    ],
    simpleExplanation:
      "SOLID is five design habits compressed into an acronym: a class should have **one reason to change** (SRP), you should **extend behaviour without editing** existing code (OCP), **subtypes must honour** their base contracts (LSP), **clients should not depend** on methods they do not use (ISP), and **depend on abstractions**, not concrete implementations (DIP). In TypeScript most of these show up as design smells you can fix with a small extraction or a narrower interface.",
    detailedContent: `
| Principle | Violation you will see in Node | Fix |
| --- | --- | --- |
| **S**ingle responsibility | A \`user.service.ts\` that validates, hashes passwords, writes SQL, sends email and formats DTOs | Extract password policy, mailer and repository; one service orchestrates them |
| **O**pen/closed | An \`if (provider === "stripe") ... else if (provider === "paypal")\` chain edited for every new provider | A \`PaymentProvider\` interface; a registry maps names to implementations |
| **L**iskov substitution | \`class ReadOnlyMap extends Map\` whose \`set()\` throws — callers holding a \`Map\` now explode | Do not publish a subtype that rejects the base contract; compose instead |
| **I**nterface segregation | One \`AnalyticsClient\` interface with 24 methods so every fake in every test must stub all 24 | Split by consumer: \`PageViewSink\`, \`FunnelReader\` |
| **D**ependency inversion | A service doing \`new PrismaClient()\` inside its own body — the domain constructs infrastructure | Depend on an \`OrderRepository\` interface; inject the Prisma implementation |

**What pays off most in a backend:** DIP (testability), then OCP (adding endpoints/providers without regression risk), then SRP. LSP matters mostly when you publish types others implement. ISP matters when you force people to build fakes.

**What gets over-applied:** ISP and OCP in codebases with three endpoints. A 3-method class with an interface nobody else implements is not "clean" — it is indirection without a second consumer.
    `,
    howItWorks: `
Each principle is checked by a different question you can ask during review. SRP: *who would ask me to edit this file?* OCP: *does adding a case mean editing a function that already works?* LSP: *can every implementation I ship be used wherever the base type is expected?* ISP: *does any consumer only need half of this interface?* DIP: *does this module name a concrete tool from the outside world?* Because TypeScript makes contracts explicit, most fixes are mechanical: extract an interface where you see \`new Concrete()\` in inner code, split an interface where fakes grow, and replace a conditional with a registered implementation where the branches multiply. Behaviour does not change; the change surface does.
    `,
    codeExamples: [
      {
        title: "OCP violation → registry of strategies",
        language: "ts",
        code: `// BEFORE: every new provider edits this function (open for modification everywhere)
function discount(price: number, customer: { type: string; spent: number }) {
  if (customer.type === "regular") return price * 0.95;
  if (customer.type === "vip") return price * 0.8;
  if (customer.type === "wholesale") return price * 0.7;
  throw new Error("UNKNOWN_TIER");
}

// AFTER: new tiers are new files; this function never changes again
export interface DiscountStrategy {
  readonly tier: string;
  apply(price: number, customer: Customer): number;
}
export const strategies = new Map<string, DiscountStrategy>([
  ["regular", { tier: "regular", apply: (p) => p * 0.95 }],
  ["vip", { tier: "vip", apply: (p) => p * 0.8 }],
  ["wholesale", { tier: "wholesale", apply: (p) => p * 0.7 }],
]);
export function discount(price: number, customer: Customer): number {
  const s = strategies.get(customer.type);
  if (!s) throw new Error("UNKNOWN_TIER");
  return s.apply(price, customer);
}`,
        description:
          "Open/closed in miniature: the pricing rule is now extended by adding a registration, and existing branches keep their tests untouched.",
      },
      {
        title: "ISP + DIP violations and the corrected version",
        language: "ts",
        code: `// BEFORE: fat interface + concrete construction = ISP and DIP violations
export interface Analytics {
  track(event: string, payload: unknown): Promise<void>;
  flush(): Promise<void>;
  segmentUser(id: string, traits: object): Promise<void>;
  rotateKey(): Promise<void>; // nobody needs this but the admin panel
}
export class ReportService {
  private analytics = new SnowflakeClient(process.env.ANALYTICS_KEY!); // hidden dep
  async daily() { await this.analytics.track("daily_report", {}); }
}

// AFTER: interfaces split by consumer, dependency injected
export interface EventTracker {
  track(event: string, payload: unknown): Promise<void>;
}
export interface SegmentAdmin {
  segmentUser(id: string, traits: object): Promise<void>;
  rotateKey(): Promise<void>;
}
export class ReportService {
  constructor(private readonly tracker: EventTracker) {}
  async daily() { await this.tracker.track("daily_report", {}); }
}

// test: three lines, no environment variables
const seen: string[] = [];
const svc = new ReportService({ track: async (e) => void seen.push(e) });`,
        description:
          "ReportService now declares exactly what it uses (ISP) and receives it from outside (DIP), so its test needs no real client and no env var.",
      },
    ],
    commonMistakes: [
      "Treating SOLID as five commandments instead of five trade-off heuristics — abstraction with one consumer usually costs more than it saves.",
      "Fixing \"LSP violations\" by deleting inheritance that was never needed; prefer small immutable objects and composition.",
      "Creating an interface per class purely so a mock exists — TypeScript structural typing already lets you pass object literals.",
      "Applying OCP with a plugin system when a switch statement would be shorter and clearer for three stable cases.",
    ],
    bestPractices: [
      "Ask the five review questions on PRs that touch shared modules; skip them for leaf utilities.",
      "Let real change drive abstraction: a second implementation or a second caller is the usual green light.",
      "Prefer injecting narrow interfaces (EventTracker) over whole clients (Analytics).",
      "Combine principles with tests: refactoring toward SOLID under a green suite is what makes the steps safe.",
    ],
    realWorldUseCases: [
      "Adding a new payment or shipping provider without editing (and re-testing) the checkout core.",
      "Keeping report generation testable when the analytics vendor changes contracts every quarter.",
      "Teams sharing a domain package: ISP keeps consumers from depending on methods owned by another team.",
    ],
    resources: [
      article(
        "Wikipedia — SOLID",
        "https://en.wikipedia.org/wiki/SOLID",
        "wikipedia.org",
        "Concise definitions of the five principles and their origins.",
        { estimatedDuration: "12 min" },
      ),
      docs("TypeScript Handbook — Narrowing", "https://www.typescriptlang.org/docs/handbook/2/narrowing.html", "Discriminated unions often remove the conditionals OCP tells you to replace.", "en", "15 min"),
      ytSearch("SOLID principles typescript node examples", "Violation/refactor walkthroughs for each principle.", "en", "20–40 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-solid-hunt",
        title: "Five violations, five fixes",
        prompt:
          "In any codebase, find one candidate for each principle (it is acceptable if some are weak). For each: quote the offending code, name the principle, and write the minimal refactor. Run the tests after every single change, not at the end.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "Grep for `new PrismaClient(` outside the composition root for DIP.",
          "Grep for chains of `if (type ===` / `provider ===` for OCP.",
        ],
      },
      {
        id: "ex-p3m1-solid-open-closed",
        title: "Extend without editing",
        prompt:
          "Take a function with 4+ conditional branches over a type string and convert it to a registry of implementations. Then add a fifth case by creating a new file and registering it — confirm that no existing file changed except the registry line.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["Give every strategy the same interface and look up by a discriminating field."],
        solution: `export const handlers = new Map<JobType, JobHandler>([
  ["email.send", emailHandler],
  ["report.build", reportHandler],
  ["image.thumb", thumbHandler],
  ["webhook.deliver", webhookHandler],
]);

export async function runJob(job: Job) {
  const handler = handlers.get(job.type);
  if (!handler) throw new Error("UNSUPPORTED_JOB_TYPE: " + job.type);
  return handler.run(job.payload);
}

// adding "csv.export" = new file + one Map entry; runJob is untouched`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-chat-app"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-repository-service-patterns",
    slug: "repository-and-service-patterns",
    title: "Repository and Service Patterns",
    description:
      "The repository as a persistence boundary, the service as use-case orchestration, and the honest criteria for when repositories are just an extra file to click through.",
    order: 8,
    estimatedMinutes: 22,
    tags: ["repository", "service", "persistence", "patterns"],
    prerequisites: ["p3m1-solid", "p3m1-clean-architecture"],
    relatedTopics: ["p3m1-domain-modeling", "p3m1-layered-architecture", "p2m4-prisma-orm", "p3m1-dependency-injection"],
    learningObjectives: [
      "State the single responsibility of a repository and of a service, and where each sits in the call chain",
      "Design repository methods in domain language instead of mirroring every SQL query",
      "Decide with explicit criteria when a repository is worth its abstraction and when it is not",
      "Write a service that coordinates repositories, a clock and events without becoming a second controller",
    ],
    simpleExplanation:
      "A **repository** answers \"where do aggregates live?\" by exposing domain-shaped operations (`orders.findOpenByCustomer(id)`) while hiding SQL, Prisma and collection names. A **service** answers \"what does this use case need to happen?\" by coordinating repositories, domain rules and side effects. Controllers stay thin: parse HTTP, call a service, format the response.",
    detailedContent: `
**The call chain**

    controller  →  service (use case)  →  domain objects
                     ↓
                repository interface
                     ↓
             Prisma / SQL / Mongo adapter

**Repository responsibility:** one aggregate, persistence only. It loads, saves and expresses domain-level queries. It must not send emails, decide business rules, know about HTTP status codes, or return Prisma row types.

**Service responsibility:** orchestration for one use case. It loads via repositories, asks entities to apply rules, saves, and publishes events. It should read like the use case name: \`cancelOrder(orderId, reason)\`.

**When a repository earns its keep**

| Signal | Repository helps | Skip it (pass-through) |
| --- | --- | --- |
| Query logic | Aggregates, joins, filtering in domain terms | One-liners delegating 1:1 to \`prisma.x.findMany\` |
| Test strategy | Domain/service tests without a database | Everything is an integration test anyway |
| Persistence churn | You expect to swap or shard storage | One database, fixed forever, tiny CRUD app |
| Mapping | Row types must be converted to entities | You return DTOs directly everywhere |
| Callers | Several services share loading rules | Exactly one caller, one query |

A repository with five methods that each forward to Prisma unchanged is not "clean architecture" — it is a second file to open. Write it when one of the signals above is true; otherwise use the client behind a service and add the boundary when the second consumer arrives.
    `,
    howItWorks: `
In a request, the controller hands validated input to a service. The service constructs or loads an aggregate through the repository interface, invokes a domain method that enforces invariants (and throws typed errors), then persists via \`save()\`. Because the repository returns domain objects, the rules travel with the data — the service cannot accidentally persist an invalid state it never validated. Errors thrown in the domain are mapped by the central error middleware to HTTP codes, so neither repository nor service mentions \`res.status\`. In tests, the service runs against a fake repository in memory, while a small suite of repository tests proves the adapter's queries against a real database container.
    `,
    codeExamples: [
      {
        title: "Repository in domain terms, implemented with Prisma",
        language: "ts",
        code: `// domain/booking/bookingRepository.ts
export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  findConflicting(roomId: string, from: Date, to: Date): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
}

// infrastructure/prismaBookingRepository.ts
import type { BookingRepository } from "../../domain/booking/bookingRepository.js";
export class PrismaBookingRepository implements BookingRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findConflicting(roomId: string, from: Date, to: Date) {
    const row = await this.prisma.booking.findFirst({
      where: { roomId, status: "CONFIRMED", startsAt: { lt: to }, endsAt: { gt: from } },
    });
    return row ? toDomain(row) : null; // Prisma types stop at this file
  }
  async findById(id: string) { /* ... */ }
  async save(booking: Booking) { /* upsert columns from booking.toRow() */ }
}`,
        description:
          "The method name states intent (\"is this room taken?\") instead of exposing query mechanics, and the row-to-domain mapping is the boundary that protects the rest of the app from schema changes.",
      },
      {
        title: "Service as use-case orchestration",
        language: "ts",
        code: `export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly events: EventBus,
    private readonly clock: Clock,
  ) {}

  async bookRoom(input: { roomId: string; guestId: string; from: string; to: string }) {
    const from = new Date(input.from);
    const to = new Date(input.to);
    if (from < this.clock.now()) throw new AppError("PAST_DATE", 422);

    const clash = await this.bookings.findConflicting(input.roomId, from, to);
    if (clash) throw new AppError("ROOM_UNAVAILABLE", 409);

    const booking = Booking.create({ roomId: input.roomId, guestId: input.guestId, from, to });
    await this.bookings.save(booking);
    this.events.publish({ type: "booking.confirmed", bookingId: booking.id });
    return booking;
  }
}`,
        description:
          "Validation of transport-agnostic rules, conflict detection through the repository, entity creation that enforces invariants, persistence and one event — no HTTP types anywhere.",
      },
    ],
    commonMistakes: [
      "Repositories that return Prisma rows, leaking schema into services and domain code.",
      "God services that talk to twelve repositories and own every rule in the system — split by use case.",
      "Mirroring every query as a repository method (countByStatusAndRegionAndMonth), which just moves the query into an interface.",
      "Putting transaction boundaries in controllers instead of the service that owns the use case.",
    ],
    bestPractices: [
      "Name repository methods after questions the domain asks, not after SQL clauses.",
      "Keep one repository per aggregate; let it own all queries for that aggregate's tables.",
      "Let services throw typed domain errors and map them to HTTP centrally.",
      "Write a couple of real-database tests for the adapter, and unit-test services against fakes.",
    ],
    realWorldUseCases: [
      "Booking systems where availability rules and conflict queries must stay in one place with one implementation.",
      "E-commerce checkouts coordinating inventory, orders and payments across several repositories in one transaction.",
      "Teams enabling integration tests with a repository fake while the query layer is covered by a smaller Postgres suite.",
    ],
    resources: [
      article(
        "Wikipedia — Repository pattern",
        "https://en.wikipedia.org/wiki/Repository_pattern",
        "wikipedia.org",
        "Definition, origins in DDD and common criticisms of the pattern.",
        { estimatedDuration: "12 min" },
      ),
      docs("Prisma — Client API", OFFICIAL.prismaDocs, "The concrete persistence adapter your repository implementations wrap.", "en", "reference"),
      ytSearch("repository pattern service layer node typescript", "End-to-end examples separating controllers, services and repositories.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-repo-signature",
        title: "Design by questions, not by SQL",
        prompt:
          "For an inventory module, list five questions the domain genuinely asks (\"which products are below the reorder point?\"), then write the repository interface that answers them. Compare with a naive interface that mirrors `findMany`, `count`, `aggregate` and explain what each design costs when the schema changes.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["If a method name contains 'where' or 'orderBy', it is probably leaking query mechanics."],
      },
      {
        id: "ex-p3m1-repo-skip",
        title: "Argue against a repository",
        prompt:
          "Take a CRUD endpoint whose repository is five one-line forwards to Prisma. Write the case for deleting it (callers, tests, files touched) and the case for keeping it (second storage, aggregate mapping). Decide and describe the trigger that would make you reverse your decision.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["A good decision names the observable signal — e.g. 'when analytics needs the same query on a second datastore'."],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-domain-modeling",
    slug: "domain-modelling",
    title: "Domain Modelling",
    description:
      "Entities, value objects and identifiers: representing business concepts as types that cannot hold invalid states, in TypeScript.",
    order: 9,
    estimatedMinutes: 23,
    tags: ["domain-model", "entities", "value-objects", "types"],
    prerequisites: ["p3m1-solid", "p2m3-schema-design"],
    relatedTopics: ["p3m1-ddd-fundamentals", "p3m1-repository-service-patterns", "p3m1-design-patterns"],
    learningObjectives: [
      "Tell entities, value objects and identifiers apart by identity, equality and lifecycle",
      "Move invariants into constructors and factory functions so invalid states fail immediately",
      "Keep distinct ids distinct using branded types in a structurally typed language",
      "Model money, quantities and time ranges as value objects instead of bare numbers",
    ],
    simpleExplanation:
      "A domain model is code that speaks the business's language: `Booking`, `Money`, `RoomId`, rather than `row` and `data`. **Entities** are things with an identity that survives change (an order stays the same order), while **value objects** are values compared by their contents (two `Money(10, \"EUR\")` are equal, and neither can ever be negative if you model it correctly).",
    detailedContent: `
| Concept | Identity | Equality | Lifecycle | TypeScript shape |
| --- | --- | --- | --- | --- |
| Entity | Stable id | By id | Long-lived, mutated by rules | \`class Order\` with \`id\` |
| Value object | None | By value | Immutable, replaceable | \`class Money\`, \`class DateRange\` |
| Identifier | Is the identity | Exact match | Created with the entity | \`branded string\` type |
| Aggregate | Root entity + internals | By root id | Consistency boundary | \`class Booking\` owning \`Stay\` |

**Why types, not comments.** An interface with \`total: number\` accepts \`-5\`. A \`Money\` value object built through \`Money.of(amount, currency)\` throws (or returns a \`Result\`) when the amount is negative or the currency is unsupported — every consumer can then assume a property that is guaranteed by construction. That guarantee is what lets services drop defensive checks.

**Identity in a structural type system.** TypeScript lets any \`string\` stand in for any other \`string\`, so \`assignBooking(roomId, guestId)\` compiles with the arguments swapped. Branding closes that hole:

    type RoomId = string & { readonly __brand: "RoomId" };

**Keep it proportional.** Value objects shine for concepts with real rules (money, ranges, percentages, codes). Wrapping \`firstName\` in a class to "be DDD" adds files and zero safety.
    `,
    howItWorks: `
Construction goes through a factory that validates once: \`Money.of\` rejects mixed currencies and negatives; \`DateRange.of\` rejects an end before the start. After that the object is frozen (\`Object.freeze\` or read-only fields), so every method returns a *new* value object instead of mutating — \`price.add(tax)\` cannot corrupt an amount already stored on an invoice. Entities differ: they keep mutable state but only through intention-revealing methods (\`booking.cancel(reason)\`) that check preconditions and throw typed domain errors. When persisting, the mapper converts value objects to plain columns (\`amount\`, \`currency\`) and back, keeping storage format an outer concern.
    `,
    codeExamples: [
      {
        title: "Money and ids that cannot be confused or negative",
        language: "ts",
        code: `export class Money {
  private constructor(
    readonly minorUnits: number,
    readonly currency: "EUR" | "USD" | "GBP",
  ) {
    if (!Number.isInteger(minorUnits)) throw new Error("FRACTIONAL_MINOR_UNITS");
    if (minorUnits < 0) throw new Error("NEGATIVE_MONEY");
    Object.freeze(this);
  }
  static of(minorUnits: number, currency: Money["currency"]) {
    return new Money(minorUnits, currency);
  }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error("CURRENCY_MISMATCH");
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }
}

type RoomId = string & { readonly __brand: "RoomId" };
type GuestId = string & { readonly __brand: "GuestId" };

// This now fails to compile — the swap is a type error, not a runtime bug
export function assignRoom(roomId: RoomId, guestId: GuestId) { /* ... */ }`,
        description:
          "Minor units avoid floating-point money entirely, the constructor enforces the invariants once, and branded ids defeat structural typing's biggest trap.",
      },
      {
        title: "Entity with an invariant that only its methods can satisfy",
        language: "ts",
        code: `export class Booking {
  private constructor(
    readonly id: string,
    private _status: "PENDING" | "CONFIRMED" | "CANCELLED",
    private _cancelledReason?: string,
  ) {}
  static create(id: string) { return new Booking(id, "PENDING"); }
  static restore(id: string, status: Booking["_status"], reason?: string) {
    return new Booking(id, status, reason); // persistence path, skips rules
  }
  get status() { return this._status; }
  confirm() {
    if (this._status !== "PENDING") throw new Error("NOT_PENDING");
    this._status = "CONFIRMED";
  }
  cancel(reason: string) {
    if (this._status === "CANCELLED") throw new Error("ALREADY_CANCELLED");
    if (reason.trim().length < 3) throw new Error("REASON_TOO_SHORT");
    this._status = "CANCELLED";
    this._cancelledReason = reason;
  }
}`,
        description:
          "There is no way to reach a CANCELLED booking without a reason, because fields are private and only rule-checked methods move the state machine.",
      },
    ],
    commonMistakes: [
      "Anemic models: interfaces full of data with every rule living in services — the rules drift apart from the state they protect.",
      "Using floating-point numbers for money; one division and your ledger is off by a cent.",
      "Wrapping every string in a value object, which drowns the model in boilerplate with no new guarantees.",
      "Letting JSON.parse output flow straight into domain objects with no validation at the boundary.",
    ],
    bestPractices: [
      "Put the invariant next to the state it protects — in the constructor or the method that transitions it.",
      "Keep value objects immutable; return new instances from every operation.",
      "Brand ids of different kinds so they cannot be swapped at call sites.",
      "Model in minor units or decimals, and never store currency-less amounts.",
    ],
    realWorldUseCases: [
      "Pricing engines where discounts, taxes and currencies must compose without rounding drift.",
      "Scheduling domains where a time range must never be inverted or overlap-invalid.",
      "Any API accepting two ids in one call — branding catches transposed arguments in CI.",
    ],
    resources: [
      docs("TypeScript Handbook", OFFICIAL.typescriptDocs, "Discriminated unions, readonly classes and type-level modelling techniques.", "en", "reference"),
      article(
        "Wikipedia — Value object",
        "https://en.wikipedia.org/wiki/Value_object",
        "wikipedia.org",
        "Definition, immutability requirements and contrast with entities.",
        { estimatedDuration: "10 min" },
      ),
      ytSearch("domain modelling typescript entities value objects", "Refactoring plain interfaces into entities and value objects.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-model-money",
        title: "Model a refund rule",
        prompt:
          "Implement `refund(invoice, amount, reason)` using a Money value object: refunds can never exceed the invoice total, never be negative, and never mix currencies. Write three tests that must fail with typed errors. Then show the same function written with bare numbers and list which of your tests you could not write.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Compare currencies before adding — Money.add already refuses mismatched currencies.",
          "The excess check belongs in the refund policy, not in Money itself.",
        ],
        solution: `export async function refund(invoice: Invoice, amount: Money, reason: string) {
  if (amount.currency !== invoice.total.currency) throw new DomainError("CURRENCY_MISMATCH");
  const already = invoice.refunded.reduce((sum, r) => sum.add(r.amount), Money.of(0, amount.currency));
  const future = already.add(amount);
  if (future.minorUnits > invoice.total.minorUnits) throw new DomainError("EXCEEDS_TOTAL");
  if (reason.trim().length < 3) throw new DomainError("REASON_TOO_SHORT");
  await invoiceRepo.addRefund(invoice.id, { amount, reason, at: clock.now() });
}`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-model-entities",
        title: "Find the entities",
        prompt:
          "Take the data model of one of your projects and classify every concept as entity, value object or plain record. For each entity, list its state transitions and write the method names you would add so callers can never set state directly.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["If two records with the same fields but different database ids are different things, it is an entity."],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-ddd-fundamentals",
    slug: "ddd-fundamentals",
    title: "Domain-Driven Design Fundamentals",
    description:
      "Ubiquitous language, bounded contexts, strategic versus tactical design — plus a candid note on when DDD is overkill for your product.",
    order: 10,
    estimatedMinutes: 24,
    tags: ["ddd", "bounded-context", "ubiquitous-language", "strategic-design"],
    prerequisites: ["p3m1-domain-modeling", "p3m1-clean-architecture"],
    relatedTopics: ["p3m1-modular-monoliths", "p3m1-large-project-structure", "p3m1-repository-service-patterns"],
    learningObjectives: [
      "Explain ubiquitous language and audit code for places where names diverge from the business",
      "Identify a bounded context and justify why one word can mean two different things in two contexts",
      "Separate strategic design (contexts and their relationships) from tactical design (aggregates, events, domain services)",
      "Judge honestly whether a feature set warrants DDD, and name the lighter alternative",
    ],
    simpleExplanation:
      "Domain-driven design starts with language: developers, domain experts and the code must use the *same* words for the same ideas. A **bounded context** is a boundary inside which a word has one precise meaning — \"customer\" in Billing (who pays) is a different concept from \"customer\" in Support (who files tickets), even though both are called the same. Strategic design draws those boundaries; tactical design gives you the building blocks inside them.",
    detailedContent: `
**Strategic vs tactical — different altitudes**

| | Strategic design | Tactical design |
| --- | --- | --- |
| Questions | Where are the boundaries? Who talks to whom? What does a word mean here? | How is one context structured internally? |
| Tools | Bounded contexts, context maps, ubiquitous language, shared kernel, upstream/downstream | Aggregates, entities, value objects, domain events, domain services, repositories |
| artefacts | Diagrams, glossaries, module boundaries | Classes and interfaces in code |
| Failure mode | Wrong boundary: one muddled model, constant translation bugs | Over-engineering: ceremony inside a context that needed none |

**Ubiquitous language** is a living glossary enforced by naming: if the business says "check-in", no method may be called \`startStay()\`. When the language and the code disagree for long enough, the code becomes a second, competing model — and every feature then needs a translation layer.

**Honest limits.** DDD pays when the domain itself is complex (insurance rules, logistics, trading, bookings) or when many teams must share a model. For CRUD-heavy products with simple rules, the overhead — aggregates, event storms, translation layers — buys little. Start with a clean domain model and a glossary; escalate to full DDD when you feel specific pain: repeated translation bugs between teams, or rules scattered and contradictory across services.
    `,
    howItWorks: `
A real initiative runs like this. First, workshop with domain experts and write the glossary (the ubiquitous language). Second, model contexts: draw boundaries where the language shifts, typically along teams or data ownership — Catalog, Ordering, Billing, Shipping. Third, define relationships: Customer/Order is **upstream** of Billing, which consumes it via a published contract (published language), never by reading its tables — that is a **shared kernel** only if both teams explicitly own a small jointly-changed subset. Fourth, inside one context, use tactical building blocks only where complexity demands: an aggregate enforces invariants in one transaction, domain events record facts (\`OrderShipped\`), and translation happens at context boundaries through anti-corruption layers.
    `,
    codeExamples: [
      {
        title: "One word, two contexts, two types",
        language: "ts",
        code: `// context: billing — "customer" means the party that pays
export type BillingCustomer = {
  id: string;
  vatNumber?: string;
  paymentTermsDays: number;
};

// context: support — "customer" means the person who contacts us
export type SupportCustomer = {
  id: string;
  contactChannel: "email" | "chat" | "phone";
  slaHours: number;
};

// anti-corruption layer at the boundary: billing data never leaks into support
export function toSupportCustomer(from: { id: string; email: string }): SupportCustomer {
  return { id: from.id, contactChannel: "email", slaHours: 24 };
}`,
        description:
          "Two explicitly named types prevent the silent coupling that appears when a single `Customer` interface grows fields from every context that ever touched it.",
      },
      {
        title: "Aggregate root enforcing invariants in one place",
        language: "ts",
        code: `export class Cart {
  private constructor(
    readonly id: string,
    private readonly lines: CartLine[],
    readonly maxItems: number,
  ) {}
  static open(id: string, maxItems = 50) { return new Cart(id, [], maxItems); }

  add(item: { sku: string; qty: number }) {
    if (this.lines.length >= this.maxItems) throw new DomainError("CART_FULL");
    if (item.qty < 1) throw new DomainError("INVALID_QTY");
    const existing = this.lines.find((l) => l.sku === item.sku);
    if (existing) existing.increase(item.qty);
    else this.lines.push(new CartLine(item.sku, item.qty));
  }
  totalLines() { return this.lines.length; }
}`,
        description:
          "The aggregate is the consistency boundary: everything that must hold true for a cart is checked inside the cart, regardless of which feature (API, import, admin tool) adds the line.",
      },
    ],
    commonMistakes: [
      "Starting with an event storm and tactical blocks for an app whose hardest rule is \"field required\".",
      "Faking bounded contexts as folders while everyone still shares one database schema — the boundary is data ownership, not directory names.",
      "Letting one shared `types.ts` re-merge contexts by holding a Customer with contradictory fields from three teams.",
      "Skipping the glossary: \"order\", \"purchase\" and \"checkout\" used interchangeably in code, tests and tickets.",
    ],
    bestPractices: [
      "Keep the glossary in the repo next to the code and name types exactly after it.",
      "Give each context ownership of its tables; integrate through APIs or events, not cross-context SQL.",
      "Use tactical patterns only when a rule is genuinely complex; a service with three if-statements does not need an aggregate.",
      "Revisit boundaries when two contexts constantly need each other's internals — that is a boundary smell.",
    ],
    realWorldUseCases: [
      "Booking platforms where \"reservation\", \"hold\" and \"confirmed stay\" mean different things to Inventory, Billing and Front Desk.",
      "E-commerce where Catalog's \"product\" and Fulfilment's \"item\" must stay separate models connected by a translation.",
      "Multi-team organisations needing an explicit upstream/downstream contract instead of ad-hoc table sharing.",
    ],
    resources: [
      article(
        "Wikipedia — Domain-driven design",
        "https://en.wikipedia.org/wiki/Domain-driven_design",
        "wikipedia.org",
        "Overview of strategic and tactical DDD, history and core terminology.",
        { estimatedDuration: "20 min" },
      ),
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Structural guidance that lines up with context-per-folder organisation.", "en", "reference"),
      ytSearch("domain driven design bounded contexts explained", "Introductions to ubiquitous language, context maps and when to skip DDD.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-ddd-contexts",
        title: "Draw a context map",
        prompt:
          "Pick a product you know (marketplace, bank, hospital) and list every domain word with more than one meaning. Propose bounded contexts, mark which is upstream for each shared concept, and name the relationship type (shared kernel, customer/supplier, conformist, anti-corruption layer).",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Ask who owns the table for each word; two owners means two contexts.",
          "A translation layer you need only because the upstream model is awkward is an anti-corruption layer.",
        ],
      },
      {
        id: "ex-p3m1-ddd-glossary",
        title: "Audit the language gap",
        prompt:
          "Compare your product's vocabulary (tickets, docs, spoken usage) with your code's names. List five mismatches — words used in meetings that do not appear in code, or code names nobody in the business recognises — and propose renames with the diff scope for each.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Search for abbreviations and synonyms: cust, usr, client, account, member — they often hide one concept."],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-capstone"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-design-patterns",
    slug: "backend-design-patterns",
    title: "Backend Design Patterns",
    description:
      "Strategy, factory, observer, adapter and decorator — the five GoF patterns that recur in Node services, each with an idiomatic TypeScript version.",
    order: 11,
    estimatedMinutes: 23,
    tags: ["design-patterns", "strategy", "observer", "adapter"],
    prerequisites: ["p3m1-solid", "p2m1-reusable-modules"],
    relatedTopics: ["p3m1-refactoring", "p3m1-modular-monoliths", "p3m1-dependency-injection", "p3m1-solid"],
    learningObjectives: [
      "Choose between strategy, factory, observer, adapter and decorator from the change you expect",
      "Implement each pattern in TypeScript for a realistic backend scenario",
      "Map each pattern onto the JavaScript feature you may already be using (map, EventEmitter, middleware)",
      "Recognise when the pattern costs more than the problem it removes",
    ],
    simpleExplanation:
      "Design patterns are named solutions to problems you will keep meeting. **Strategy** swaps an algorithm at runtime, **factory** decides which object to build, **observer** lets many parts react to one event, **adapter** makes an incompatible thing fit an interface you own, and **decorator** adds behaviour around a function without editing it. Knowing the names lets you read a codebase — and your teammates' minds — faster.",
    detailedContent: `
| Pattern | The problem it solves | Backend example | Native JS echo | Main cost |
| --- | --- | --- | --- | --- |
| Strategy | Algorithm varies by input/config | Pricing, retry backoff, notification channels | \`Array.map(fn)\` | One more class per variant |
| Factory | Construction logic must not leak into callers | Building a payment provider client from config | \`JSON.parse\` semantics | Hidden construction rules |
| Observer | Many modules react to one occurrence | \`order.paid\` → invoice, stock, analytics | \`EventEmitter\`, pub/sub | Order and errors become implicit |
| Adapter | An external shape does not match your interface | Wrapping Stripe SDK behind \`PaymentGateway\` | Wrapper functions | Extra mapping file |
| Decorator | Cross-cutting behaviour around a handler | Logging, timing, auth around route handlers | Express middleware | Stack traces grow a layer |

**Where each one really appears in Node.** Observer is built into \`EventEmitter\` and to message brokers; decorator is literally the Express middleware chain (\`app.use\`) and TypeScript function composition; adapter is any SDK wrapper; strategy shows up as a registry of handlers keyed by a discriminator; factory appears as \`createClient(config)\`.

**When to skip:** a pattern without a second variation or a second caller is speculation. Three strategies planned but never shipped is worse than an \`if\` statement you can delete in one minute.
    `,
    howItWorks: `
They all follow the same move: introduce a seam. Strategy names the varying behaviour as an interface and looks it up; factory centralises the decision about *which* implementation to build; observer replaces "publisher calls subscriber directly" with an event so neither knows the other; adapter translates types at the edge so your core keeps its own vocabulary; decorator wraps a function with before/after logic and returns a function of the same shape — which is why middleware can be chained. In each case the seam is what future change lands on: a new provider, a new subscriber, a new SDK, a new cross-cutting concern, all added without editing working code.
    `,
    codeExamples: [
      {
        title: "Strategy + factory: one payment core, many providers",
        language: "ts",
        code: `export interface PaymentGateway {
  readonly name: string;
  charge(amountMinor: number, currency: string, token: string): Promise<{ txId: string }>;
}

export class StripeGateway implements PaymentGateway {
  readonly name = "stripe";
  async charge(a: number, c: string, token: string) {
    return stripe.charges.create({ amount: a, currency: c, source: token });
  }
}
export class MockGateway implements PaymentGateway {
  readonly name = "mock";
  async charge(a: number, c: string) { return { txId: "tx_" + a + "_" + c }; }
}

// factory: the only place that knows how config maps to implementations
export function createGateway(provider: string): PaymentGateway {
  const registry: Record<string, () => PaymentGateway> = {
    stripe: () => new StripeGateway(),
    mock: () => new MockGateway(),
  };
  const make = registry[provider];
  if (!make) throw new Error("UNKNOWN_PROVIDER: " + provider);
  return make();
}

// strategy: the checkout core never changes when providers are added
export async function checkout(gw: PaymentGateway, req: ChargeRequest) {
  return gw.charge(req.minor, req.currency, req.token);
}`,
        description:
          "Adding PayPal means one new class and one registry line; checkout, the order service and all existing tests stay untouched — open/closed via strategy plus factory.",
      },
      {
        title: "Observer + decorator around a handler",
        language: "ts",
        code: `import { EventEmitter } from "node:events";
type DomainEvent = { type: string; payload: unknown };
export const bus = new EventEmitter();

// observer: subscribers register, publisher stays ignorant
export function on(type: string, handler: (e: DomainEvent) => Promise<void>) {
  bus.on(type, (e) => handler(e).catch((err) => console.error("subscriber failed", type, err)));
}
export const publish = (e: DomainEvent) => void bus.emit(e.type, e);

// decorator: cross-cutting behaviour without editing the handler
type Handler = (req: Request, res: Response) => Promise<void>;
export function withTiming(label: string, handler: Handler): Handler {
  return async (req, res) => {
    const started = performance.now();
    try {
      await handler(req, res);
    } finally {
      metrics.histogram("handler_ms", performance.now() - started, { label });
    }
  };
}
app.post("/orders", withTiming("createOrder", async (req, res) => { /* ... */ }));`,
        description:
          "The publisher never imports its subscribers, and timing is added by wrapping — the same shape Express uses for middleware, which is why app.use composes so naturally.",
      },
    ],
    commonMistakes: [
      "Observer overuse: business flow hidden in listeners, so nobody can tell what happens after a payment without grepping for the event name.",
      "Adapters that expose the underlying SDK anyway (`gateway.rawCharge()`), which makes the adapter a second vocabulary instead of a boundary.",
      "Building a plugin registry for a single hardcoded variant that has never changed.",
      "Decorator stacks that swallow errors or double-write responses because `next()` is called twice.",
    ],
    bestPractices: [
      "Name the seam after the variation: `retryPolicy`, `notificationChannel`, `paymentGateway` — not `helper2`.",
      "Type events centrally so a renamed payload field breaks compilation, not production.",
      "Document the call order of decorators/middleware; behaviour that depends on order must be written down.",
      "Revisit after three variants: the third is usually when the pattern proves it was worth it.",
    ],
    realWorldUseCases: [
      "Multi-channel notifications (email, SMS, push) selected by user preferences through a strategy registry.",
      "Payment integrations where an SDK change must not leak into order processing.",
      "Audit logging added to every handler by wrapping them once at router registration.",
    ],
    resources: [
      docs("Node.js API — Events (EventEmitter)", "https://nodejs.org/api/events.html", "The built-in implementation of the observer pattern you will use most.", "en", "reference"),
      article(
        "Refactoring Guru — Design patterns",
        "https://refactoring.guru/design-patterns",
        "refactoring.guru",
        "Clear, illustrated catalogue of GoF patterns with language-specific examples.",
        { estimatedDuration: "reference" },
      ),
      ytSearch("javascript design patterns strategy factory observer adapter", "Pattern-by-pattern walkthroughs with TypeScript code.", "en", "20–40 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-patterns-pick",
        title: "Pick the pattern",
        prompt:
          "For each requirement, name the pattern you would reach for, the seam you would introduce, and one reason NOT to use it: (1) three tax jurisdictions with different formulas, (2) wrapping a legacy SMS vendor, (3) an audit log reacting to any state change, (4) choosing a queue driver from env config, (5) metrics around every route handler.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["(2) and (4) both involve an outside thing that does not fit your interface — but only one of them translates shapes."],
      },
      {
        id: "ex-p3m1-patterns-implement",
        title: "Implement one seam",
        prompt:
          "Implement a notification feature with a strategy registry (email, in-app, webhook) and a decorator that records delivery attempts. Write a test that adds a fourth channel without modifying any existing file except the registry entry.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: ["Give every channel the same interface: send(message): Promise<void>."],
        solution: `const channels: Record<string, Channel> = {
  email: emailChannel,
  inApp: inAppChannel,
  webhook: webhookChannel,
};

export function withDeliveryLog(channel: Channel, log: AttemptLog): Channel {
  return {
    async send(msg) {
      const started = Date.now();
      try { await channel.send(msg); await log.ok(msg, Date.now() - started); }
      catch (err) { await log.fail(msg, err); throw err; }
    },
  };
}`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p3-job-processing", "p3-chat-app"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-refactoring",
    slug: "refactoring-under-tests",
    title: "Refactoring Safely",
    description:
      "Small steps, seam identification and characterization tests: changing structure in unfamiliar code without changing behaviour.",
    order: 12,
    estimatedMinutes: 22,
    tags: ["refactoring", "tests", "seams", "legacy-code"],
    prerequisites: ["p3m1-solid", "p2m7-unit-testing"],
    relatedTopics: ["p3m1-technical-debt", "p3m1-separation-of-concerns", "p2m7-integration-testing"],
    learningObjectives: [
      "Explain the green-red-green loop of behaviour-preserving change and why big-bang rewrites fail",
      "Locate seams — injection points, branches and I/O boundaries — in code you did not write",
      "Apply a small catalogue of moves (extract function, replace conditional, introduce parameter object) one at a time",
      "Write a characterization test that locks current behaviour before refactoring legacy code",
    ],
    simpleExplanation:
      "Refactoring means changing the *structure* of code while its *observable behaviour* stays identical — status codes, responses and side effects do not move. You do it in tiny steps: run tests, change one thing, run tests again. If you cannot run tests, your first move is to write a characterization test that records what the code does today, quirks included, so you can prove you did not change it.",
    detailedContent: `
**The loop:** make sure tests pass → make one small change → make sure tests still pass → repeat. Each step should be small enough that if it breaks something, you know immediately which line did it. "Refactor Friday" batches of 900 changed lines invert this: you find out on Monday.

**Common moves**

| Move | Trigger | Behaviour |
| --- | --- | --- |
| Extract function | A block has a name you can say aloud | Same output, now callable/testable |
| Introduce parameter object | Three functions share the same 4 params | Signature changes, logic does not |
| Replace conditional with polymorphism | A type-switch grows a branch per variant | Dispatch moves into objects |
| Inline variable | A name adds nothing (\`const x = a + b\`) | Pure deletion |
| Split phase | One function both fetches and computes | Two functions, one call site |

**Seams** are places where behaviour can be altered without editing the code itself: a constructor parameter (inject a fake clock), an interface implementation (swap a repository), an environment boundary (file, network, queue), or a registered handler (override a route). Legacy code is hard to change precisely because seams were never cut — so the refactoring often *is* creating the seam.

**Characterization tests** do not assert what is right; they assert what happens *now*. You cover inputs, outputs, and side effects (what was written, what was logged), including odd cases. Only then do you move code.
    `,
    howItWorks: `
Take a 120-line handler that calculates a quote and calls the API. Step 1: extract the pure calculation into \`calcQuote()\`, keep the handler calling it, run tests. Step 2: pull the validation block into \`parseQuoteInput()\`. Step 3: replace an inner \`if (type === ...)\` chain with a lookup map. Step 4: move the persistence call behind an injected repository. After each step the suite goes green; the final diff is a structure you can test in isolation — and no commit contains both a behaviour change and a structure change, which keeps blame readable and rollbacks trivial.
    `,
    codeExamples: [
      {
        title: "Characterization test before touching the code",
        language: "ts",
        code: `// You inherited this. You do NOT know if it is correct — you only need to know what it does.
it("legacy: fees under 100 are waived, over 100 cost 2 (current behaviour)", () => {
  expect(calcFee(99)).toBe(0);
  expect(calcFee(100)).toBe(0);   // boundary quirk recorded as-is
  expect(calcFee(101)).toBe(2);
  expect(calcFee(1_000_00)).toBe(2);
});

it("legacy: fractional input currently returns NaN (recorded, not judged)", () => {
  expect(calcFee(50.5)).toBeNaN();
});

// Now refactor. When calcFee(100) changes from 0 to 2, the test fails
// and you decide deliberately whether the new behaviour is a fix or a regression.`,
        description:
          "Characterization tests turn \"I think it still works\" into evidence, and they make the boundary quirk visible so fixing it becomes an explicit product decision.",
      },
      {
        title: "Creating a seam by extracting and injecting",
        language: "ts",
        code: `// BEFORE: no seam — expiry can only be tested by sleeping or by editing the function
export function isExpired(session: { createdAt: string }) {
  return Date.now() - Date.parse(session.createdAt) > 30 * 60 * 1000;
}

// AFTER: same behaviour, seam opened at the clock
export function isExpired(session: { createdAt: string }, now: number = Date.now()) {
  return now - Date.parse(session.createdAt) > 30 * 60 * 1000;
}

it("expires exactly at 30 minutes", () => {
  const s = { createdAt: "2026-01-01T10:00:00.000Z" };
  const at29 = Date.parse(s.createdAt) + 29 * 60 * 1000;
  const at30 = Date.parse(s.createdAt) + 30 * 60 * 1000;
  expect(isExpired(s, at29)).toBe(false);
  expect(isExpired(s, at30)).toBe(true);
});`,
        description:
          "A defaulted parameter is often the cheapest seam available: behaviour at runtime is unchanged, and the test can now freeze time to the millisecond.",
      },
    ],
    commonMistakes: [
      "Refactoring and adding a feature in one branch — when tests fail you cannot tell which half caused it.",
      "Deleting behaviour you believe is dead instead of proving it with tests or telemetry first.",
      "Skipping the safety net on legacy code: without characterization tests every step is a gamble.",
      "Batching dozens of moves before running the suite, which makes failures unattributable.",
    ],
    bestPractices: [
      "Keep every step small enough to explain in one sentence and revert in one commit.",
      "Run the suite (or at least the touched module's tests) after each move, not after the whole session.",
      "Prefer seams you can inject over sleeps, global patches and network mocks.",
      "Separate commits: pure behaviour-preserving moves first, behaviour changes second — reviewers thank you.",
    ],
    realWorldUseCases: [
      "Extracting pricing logic from a 600-line handler so a new promotion rule can be added and tested independently.",
      "Preparing an endpoint for a database migration by placing a repository seam before the driver changes.",
      "Stabilising a flaky test by replacing `setTimeout` waits with an injected clock.",
    ],
    resources: [
      article(
        "Martin Fowler — Refactoring (book)",
        "https://martinfowler.com/books/refactoring.html",
        "martinfowler.com",
        "The catalogue of refactorings and the discipline of behaviour-preserving change.",
        { estimatedDuration: "reference" },
      ),
      docs("Vitest — Getting started", OFFICIAL.vitestDocs, "The fast feedback loop that makes small-step refactoring practical.", "en", "10 min"),
      ytSearch("refactoring legacy nodejs code with tests", "Guided before/after refactors of real Node services.", "en", "20–40 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-refactor-steps",
        title: "Ten steps, one refactor",
        prompt:
          "Pick a 50+ line function in any project and refactor it into named functions in at least ten separate commits (or save points), running tests after each. List each step, what it preserved, and the moment you were tempted to change behaviour — and what you did instead.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "If you are tempted to also fix a bug, write a failing test for it first and do it in a separate commit after the structure work.",
        ],
        solution: `// Typical sequence for a 120-line checkout handler
// 1  extract parseInput(body)
// 2  extract loadCustomer(id)          (no signature change yet)
// 3  extract applyPromotion(lines, p)  pure, now unit-testable
// 4  replace if/else chain with promo registry
// 5  extract reserveStock(lines)       behind InventoryPort
// 6  inject clock into calculateExpiry
// 7  introduce parameter object CheckoutRequest
// 8  split save-and-charge into two calls
// 9  move response shaping into toCheckoutDto
// 10 inline the leftover temp variables
// Every step green; final behaviour diff: none.`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-refactor-seams",
        title: "Map the seams",
        prompt:
          "For one module, list every seam that exists today (constructor params, interfaces, env reads, timers, network calls) and every seam that is missing. For each missing seam, describe the cheapest change that would open it.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Grep for Date.now(), Math.random(), setTimeout and direct SDK construction — those are the seams you never got."],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-chat-app"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-technical-debt",
    slug: "technical-debt",
    title: "Technical Debt",
    description:
      "The categories of debt, how to measure the interest it charges, how to keep a visible ledger, and how to negotiate repayment with people who own the roadmap.",
    order: 13,
    estimatedMinutes: 20,
    tags: ["technical-debt", "refactoring", "process", "estimation"],
    prerequisites: ["p3m1-refactoring", "p2m1-code-organization"],
    relatedTopics: ["p3m1-large-project-structure", "p3m1-modular-monoliths", "p3m1-refactoring"],
    learningObjectives: [
      "Classify debt by intent and prudence and give a concrete Node example of each kind",
      "Find evidence of debt interest: lead time, defect rate, onboarding time, change-failure rate",
      "Maintain a debt ledger with enough context that each item can be estimated and scheduled",
      "Frame repayment in terms of risk and delivery speed so it competes fairly with features",
    ],
    simpleExplanation:
      "Technical debt is any shortcut that makes the next change slower or riskier than it needs to be — duplicated rules, a missing test, a schema everyone is afraid to touch. Like financial debt it is not automatically bad: borrowing deliberately to ship can be smart, *as long as you record it and plan to pay it back*. The problem is silent debt that nobody tracks, because its interest shows up as \"why does this simple change take two weeks?\".",
    detailedContent: `
A useful classification comes from combining **intent** with **prudence**:

| Type | Meaning | Typical example | Interest paid |
| --- | --- | --- | --- |
| Deliberate + prudent | Knowingly borrowed, plan to repay | Ship now behind a flag; refactor next sprint | Low if repaid, high if forgotten |
| Deliberate + reckless | "No time for tests" | "We'll fix it later" with no ticket | High: defects ship silently |
| Undeliberate + prudent | Discovered as understanding improved | A schema that no longer fits the domain | Medium: migration needed |
| Undeliberate + reckless | Did not know better | Copy-pasted rule in four services | Highest: divergence and bugs |

**Measuring the interest.** Debt is real when you can observe it: pull requests that touch the same file repeatedly (shotgun surgery), cycle time rising on one module, a bug class that keeps recurring, a test suite nobody trusts (so releases become events), or onboarding that takes weeks because nothing has an obvious home. Gather two or three of these numbers before asking for repayment time — "this endpoint caused 40% of incidents last quarter" beats "the code is ugly".

**The ledger rule:** every accepted shortcut becomes a ticket with a tag (\`debt\`), the context, the trigger for repayment, and an owner. Items with no trigger never get scheduled — "someday" is where debt goes to compound.
    `,
    howItWorks: `
Practical repayment works in three modes. **Interest-driven**: when a module shows up repeatedly in incident reviews or slow PRs, schedule a refactoring story for it before the next feature touches it. **Opportunistic**: when you are already editing a function for a feature, spend a bounded slice (say 20% of the PR) removing the duplication you now understand. **Strangler**: for debt too big to move at once, put an interface in front of the legacy path and migrate callers one by one, keeping the system shippable the whole time. Each mode converts debt into a planned unit of work with an observable before/after metric instead of a vague cleanup weekend.
    `,
    codeExamples: [
      {
        title: "A ledger entry worth scheduling",
        language: "yaml",
        code: `- id: DEBT-114
  title: Pricing rules duplicated in api, worker and cli
  kind: deliberate-prudent        # borrowed to hit the launch date
  discovered: 2026-04-02
  evidence:
    - "same discount table edited in 3 files in the last 6 weeks"
    - "2 incidents where the worker disagreed with the API"
  interest: every new rule costs 3x edits; divergence causes wrong charges
  trigger: next time a pricing rule changes OR next pricing feature
  firstStep: extract pricing/ to one module with tests, keep old exports as re-exports
  owner: payments-team
  estimateDays: 3`,
        description:
          "Evidence plus a trigger plus a first step turns a complaint into a schedulable ticket — the difference between a ledger and a list of grievances.",
      },
      {
        title: "Paying down incrementally: wrap, then migrate",
        language: "ts",
        code: `// Legacy path everyone is afraid to touch
export function legacyQuote(lines: unknown[]): unknown { /* 180 lines */ }

// Step 1: put a typed interface in front (no behaviour change)
export interface QuotePort {
  quote(lines: QuoteLine[]): Promise<Quote>;
}
export class LegacyQuoteAdapter implements QuotePort {
  async quote(lines: QuoteLine[]) {
    return normalize(await legacyQuote(lines)); // old code, new boundary
  }
}

// Step 2: new code depends only on QuotePort; callers migrate one at a time
export class CheckoutService {
  constructor(private readonly quotes: QuotePort) {}
  // ...
}

// Step 3: when the last caller is migrated, delete legacyQuote with evidence,
// not with hope. The strangler pattern makes the deletion safe.`,
        description:
          "An adapter seam converts one risky big-bang deletion into a sequence of small, individually verifiable steps — the cheapest form of large-scale repayment.",
      },
    ],
    commonMistakes: [
      "Calling every imperfect decision \"technical debt\" — a deliberate, documented trade-off with a plan is engineering, not debt.",
      "Tracking debt only in chat and heads: untracked debt is indistinguishable from nothing.",
      "Proposing a rewrite of everything; big-bang rewrites usually create more debt than they remove.",
      "Repaying low-interest debt while a high-interest module burns incident time — order by interest, not by annoyance.",
    ],
    bestPractices: [
      "Tag debt tickets and review the ledger in the same ritual as the feature backlog.",
      "Attach a measurable cost (lead time, incidents, duplicated edits) to anything you ask others to prioritise.",
      "Budget a standing slice (10–20%) for repayment so it does not depend on heroic free time.",
      "Prefer strangler-style migration over freezes where nothing ships for a month.",
    ],
    realWorldUseCases: [
      "Explaining to product why a \"small\" feature estimate doubled: three legacy files must change in lockstep.",
      "Justifying a schema normalisation project after duplicate data caused two billing disputes.",
      "Onboarding acceleration: naming conventions and folder rules are cheap debt repayment with broad interest savings.",
    ],
    resources: [
      article(
        "Wikipedia — Technical debt",
        "https://en.wikipedia.org/wiki/Technical_debt",
        "wikipedia.org",
        "Cunningham's metaphor, the quadrant of intent vs prudence, and common sub-types.",
        { estimatedDuration: "15 min" },
      ),
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Structural practices that prevent the most common forms of accidental debt.", "en", "reference"),
      ytSearch("technical debt explained how to pay it off", "Practical talks on measuring interest and negotiating repayment.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-debt-ledger",
        title: "Build a ledger for your project",
        prompt:
          "Write your five largest sources of debt as ledger entries in the format above. For each, include at least one piece of evidence (a file touched by N recent PRs, a recurring defect, a slow test) and a trigger for repayment. Rank them by interest and justify the order in three sentences.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: ["git log --since=3.months --name-only piped through a count is an easy way to find shotgun-surgery files."],
        solution: `- id: DEBT-201
  title: Order state transitions checked in controllers, not in the entity
  kind: undeliberate-prudent
  evidence:
    - "3 controllers contain a copy of the status transition table"
    - "incident 2026-08: worker allowed CANCELLED -> PAID"
  interest: every new channel (api, cli, import) risks a new inconsistency
  trigger: before adding the next order-related endpoint
  firstStep: extract OrderStateMachine with tests; controllers call one method
  owner: orders-team
  estimateDays: 2`,
        solutionLanguage: "yaml",
      },
      {
        id: "ex-p3m1-debt-conversation",
        title: "Negotiate one repayment",
        prompt:
          "Take the top item from your ledger and write the message you would send to a product owner: current cost with evidence, cost of repayment, cost of not repaying over the next quarter, and two options (a bounded slice now, or a scheduled block). Keep it under 200 words and avoid jargon.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: ["Lead with a business-visible number (incidents, delays, error rate), not with 'bad code'."],
      },
    ],
    projectIds: ["p3-capstone", "p3-analytics-api"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-large-project-structure",
    slug: "large-project-structure",
    title: "Structuring Large Projects",
    description:
      "Feature folders versus layer folders, naming conventions, a tiny shared kernel, module boundaries and how circular dependencies start and end.",
    order: 14,
    estimatedMinutes: 23,
    tags: ["project-structure", "folders", "circular-dependencies", "boundaries"],
    prerequisites: ["p3m1-modular-monoliths", "p3m1-refactoring"],
    relatedTopics: ["p3m1-separation-of-concerns", "p3m1-config-secrets-management", "p2m1-code-organization", "p2m1-reusable-modules"],
    learningObjectives: [
      "Compare feature-first and layer-first folder layouts with their real trade-offs",
      "Keep shared code deliberately small and avoid the utils dumping ground",
      "Set naming and import conventions that keep module boundaries enforceable",
      "Diagnose and break circular dependencies, then prevent them with a lint rule",
    ],
    simpleExplanation:
      "At ten files, folders are decoration; at a hundred, they are navigation. A large project needs a rule for *how* things are grouped — usually **by feature** (each domain area owns its routes, services and tests) with a thin layer of shared primitives — plus a hard rule about what may import what, so teams never create the circular imports that make modules load half-initialised.",
    detailedContent: `
**Two layouts, honestly compared**

| | Feature-first (\`modules/orders/\`) | Layer-first (\`controllers/\`, \`services/\`) |
| --- | --- | --- |
| Findability | Everything for one feature is in one place | Everything of one kind is in one place |
| Cross-feature work | Edits spread across module folders | Edits spread across layer folders |
| Reuse of a layer | Naturally shared across features | Naturally shared |
| Team ownership | Maps cleanly to team/module | Ownership is fuzzy |
| Risk | Duplication between modules | "God folders" nobody owns |
| When it wins | Many distinct features, several teams | Few features, one team, uniform pipeline |

Hybrids are common: feature folders at the top level, layering *inside* each feature.

**Shared kernel:** a small, explicitly owned set (\`shared/ids\`, \`shared/errors\`, \`shared/result\`) that everyone may import. Everything else that looks like \`utils/\` must either move to a feature or graduate to the kernel with a decision — an ever-growing utils folder is architecture debt with a friendly name.

**Boundaries:** each module exposes \`index.ts\` and nothing else; deep imports and cross-module SQL are lint errors. Naming reinforces it: files named \`*.router.ts\`, \`*.service.ts\`, \`*.repository.ts\` say which layer they belong to before you open them.

**Circular dependencies** start as a convenience (\`billing → orders → billing\`) and end with modules that are \`undefined\` at import time or build graphs nobody can reason about.
    `,
    howItWorks: `
Module graphs are computed from \`import\` statements: when A imports B and B imports A, Node must pick a partially initialised object to hand back — hence the classic \`TypeError: X is not a function\` at startup, or a cycle that only appears in production bundles. You break a cycle in one of three ways: extract the shared concept into a third module both sides import (usually the right answer), invert the direction by declaring an interface where the dependency is consumed (dependency inversion), or replace the direct call with an event so one side no longer imports the other. Then you make it permanent: a lint rule (eslint-plugin-import's no-cycle, or dependency-cruiser) fails the build when someone reintroduces it.
    `,
    codeExamples: [
      {
        title: "A layout that scales with teams",
        language: "bash",
        code: `src/
  app.ts                    # composition root: wires everything, imports all modules
  shared/                   # tiny kernel: ids, errors, result, clock port
    errors.ts
    ids.ts
  modules/
    orders/
      index.ts              # PUBLIC API - the only file others import
      orders.router.ts      # presentation (layering inside the feature)
      orders.service.ts
      orders.repository.ts
      orders.entity.ts
      orders.test.ts
    billing/
      index.ts
      billing.service.ts
      invoice.pdf.ts        # feature-private helper, never imported from outside
    shipping/
      index.ts
  workers/                  # non-HTTP entry points, same module APIs
  scripts/`,
        description:
          "Feature folders on top, layering inside each feature, one barrel per module and a deliberately small kernel — the structure most mid-size Node services converge on.",
      },
      {
        title: "A cycle, its symptom and the lint rule that stops it",
        language: "ts",
        code: `// modules/billing/billing.service.ts
import { getOrder } from "../orders/orders.service.js";   // billing -> orders

// modules/orders/orders.service.ts
import { issueInvoice } from "../billing/billing.service.js"; // orders -> billing  = CYCLE
export async function getOrder(id: string) { /* ... */ }

// FIX 1 - invert: orders declares the port it needs
export interface InvoiceIssuer { issue(orderId: string, total: number): Promise<void>; }
// app.ts injects the billing implementation

// FIX 2 - or decouple with an event: billing subscribes to "order.paid"

// dependency-cruiser rule that enforces it forever
{ name: "no-circular", from: { path: "src" }, to: { path: "src" }, to: { dependencyTypes: ["circular"] }, severity: "error" }`,
        description:
          "Cycles are cheap to create and expensive to trace; the rule turns a runtime surprise into a compile-time/CI failure with a file path.",
      },
    ],
    commonMistakes: [
      "The `utils/` black hole: dates, money, auth and validation all in one folder everyone imports from.",
      "Copy-pasting a feature folder to create a second feature, so fixes are applied to one and forgotten in the other.",
      "Deep imports across modules (`modules/orders/internal/pricing`), which silently voids the boundary.",
      "Naming everything `helpers.ts` or `manager.ts`, so code review requires opening files to learn what they do.",
    ],
    bestPractices: [
      "Pick feature-first above ~15 features or 3+ teams; keep layer-first while the app is still one pipeline.",
      "Give the shared kernel a named owner and a written admission rule.",
      "Enforce boundaries and cycles in CI; conventions without enforcement are suggestions.",
      "Name files by role (`orders.service.ts`) and keep one public barrel per module.",
    ],
    realWorldUseCases: [
      "A 40-endpoint API where newcomers find a feature in one folder instead of five layer folders.",
      "A platform team extracting `shared/errors` so every module returns the same error envelope.",
      "Preventing a startup crash in production caused by a require cycle introduced during a rushed hotfix.",
    ],
    resources: [
      docs("Node.js Best Practices", OFFICIAL.nodeBestPractices, "Layered structure and folder-naming guidance for Node repositories.", "en", "reference"),
      docs("npm — Workspaces", "https://docs.npmjs.com/cli/using-npm/workspaces", "Splitting a large repo into packages when module boundaries become package boundaries.", "en", "10 min"),
      article(
        "dependency-cruiser",
        "https://github.com/sverweij/dependency-cruiser",
        "github.com",
        "Validate and visualise import graphs: cycles, forbidden deep imports, layer rules.",
        { estimatedDuration: "reference" },
      ),
      ytSearch("nodejs large project structure feature folders", "Walkthroughs of scalable folder layouts and module boundaries.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-structure-move",
        title: "Re-layout one area",
        prompt:
          "Take a layer-first project (controllers/, services/, repositories/) and reorganise one bounded area into a feature folder, keeping behaviour identical: same endpoints, same responses, tests green after every move. Document the import rules you will apply to the remaining features.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: ["Move one file at a time and let the compiler find every stale import; do not rename exports in the same step."],
      },
      {
        id: "ex-p3m1-structure-cycles",
        title: "Find and break a cycle",
        prompt:
          "Run a cycle detector (dependency-cruiser, madge, or a small script over import statements) on any codebase. For the first cycle found, draw it, explain why each import exists, and apply either extraction or dependency inversion to break it. Show the before/after graph.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: ["npx madge --circular src is a quick start; most cycles hide behind a shared types file."],
        solution: `# Detect
npx madge --circular --extensions ts src

# before: orders <-> billing
# fix: move "OrderPaid" event type into shared/events.ts and have
#      billing subscribe via the bus instead of importing orders.service
import { publish } from "../../shared/events.js";   // orders side
import { on } from "../../shared/events.js";        // billing side
// both now depend on shared/, never on each other -> cycle gone`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m1",
  },
  {
    ...shared,
    id: "p3m1-config-secrets-management",
    slug: "config-and-secrets-management",
    title: "Configuration and Secrets Management",
    description:
      "Layered configuration validated at boot, secrets kept out of git and injected by the environment, rotation, and the difference between config, secrets and state.",
    order: 15,
    estimatedMinutes: 21,
    tags: ["configuration", "secrets", "environment", "security"],
    prerequisites: ["p2m2-configuration-management", "p3m1-large-project-structure"],
    relatedTopics: ["p3m1-clean-architecture", "p2m2-centralized-error-handling", "p3m1-large-project-structure"],
    learningObjectives: [
      "Layer configuration from defaults through local files to process environment without scattered process.env reads",
      "Validate configuration at boot with a schema and fail fast with an actionable message",
      "Separate config, secrets and runtime state, and store each appropriately",
      "Describe a rotation procedure and the hygiene rules that keep secrets out of git forever",
    ],
    simpleExplanation:
      "Configuration is everything your app needs to run: ports, URLs, feature flags, timeouts. Secrets are configuration with a blast radius: API keys, database passwords, signing keys. Both should be supplied by the *environment* rather than the code, read once at startup into one typed object, validated before you accept traffic — and never, ever committed to the repository.",
    detailedContent: `
**Config, secrets and state are three different things**

| | Config | Secret | Runtime state |
| --- | --- | --- | --- |
| Example | \`PORT\`, \`LOG_LEVEL\`, feature flag | DB password, Stripe key, JWT signing key | Sessions, carts, counters |
| Changes | On deploy or by decision | On compromise or schedule | Continuously |
| Stored in | Env / config file | Env from a secret manager | Database / cache |
| In git? | Non-sensitive values ok | Never | Never |

**Layered resolution:** built-in defaults → environment-specific file (\`.env.development\`, ignored except a committed \`.env.example\` with dummy values) → process environment (what actually matters in production) → secrets manager mounted at boot. Later layers override earlier ones. Code reads \`config.port\`, never \`process.env.PORT\` — one typed object makes every dependency explicit and testable.

**Validate at boot.** Parse once with a schema (Zod, Joi, envalid), print *all* missing/invalid keys, and exit non-zero before listening. A service that starts with a half-configured database and fails on the first request converts a one-second startup error into a 3 a.m. page.

**Rotation:** every secret has an owner, a rotation interval and a documented procedure — issue the new credential, deploy it, revoke the old one, and never rotate in a way that requires downtime. Add scanning (gitleaks/trufflehog) in CI so a leaked key fails the build instead of failing you.
    `,
    howItWorks: `
At boot: \`loadConfig()\` gathers layers, \`ConfigSchema.parse()\` validates types, ranges and required fields, and throws a single aggregated error listing everything wrong (\`DATABASE_URL: required; PORT: expected integer 1-65535\`). \`main()\` catches it, logs the message without any secret *values*, and exits with code 1 — the orchestrator restarts and the logs tell a human exactly what to fix. Only after validation does the app construct the Prisma client and \`app.listen()\`. In production the platform injects env vars from a secret manager (AWS Secrets Manager, Doppler, Vault, GitHub secrets); locally developers copy \`.env.example\` to \`.env\`, which git ignores. Nothing in application code names a secret *value* — only the key it expects.
    `,
    codeExamples: [
      {
        title: "One typed config, validated before the server starts",
        language: "ts",
        code: `import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Print every problem at once - and never print the values themselves
  const issues = parsed.error.issues.map((i) => "  - " + i.path.join(".") + ": " + i.message);
  console.error("Invalid configuration:\\n" + issues.join("\\n"));
  process.exit(1);
}
export const config = parsed.data; // the ONLY object the rest of the app imports`,
        description:
          "Fail-fast turns misconfiguration into a readable startup log. Note the aggregated issues and that secret values are never echoed back.",
      },
      {
        title: "Secrets hygiene in the repository and the runbook",
        language: "bash",
        code: `# 1) local env files never enter git
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# 2) what IS committed is the contract, with dummy values only
cat .env.example
# PORT=3000
# DATABASE_URL=postgres://user:pass@localhost:5432/app
# JWT_SECRET=generate-a-random-string-of-at-least-32-characters

# 3) CI fails the build if a real secret lands in history
npx gitleaks detect --source . --redact

# 4) zero-downtime rotation drill for a signing key
#    a. mint the NEW key alongside the OLD one (both valid)
#    b. deploy the service reading NEW_KEY with OLD_KEY accepted as fallback
#    c. verify traffic and token issuance on the new key
#    d. stop accepting OLD_KEY, then revoke it in the provider
#    e. update the secret manager, record the date, close the ticket`,
        description:
          "Hygiene that actually holds: ignore rules, a committed contract file, a scanner in CI, and a rotation procedure that never needs a deploy freeze.",
      },
    ],
    commonMistakes: [
      "Reading process.env inside business logic all over the app, so nobody can list what configuration the service truly requires.",
      "Committing .env or pasting a key into a test \"just to make it run\" — git history keeps it forever; the fix is rotation, not deletion.",
      "Validating config lazily: the service starts and only fails on the first request that needs the missing variable.",
      "Logging configuration wholesale at boot, which prints secret values into log aggregators that thousands can read.",
    ],
    bestPractices: [
      "One schema, one parse, one exported `config` object; ban direct `process.env` reads elsewhere with a lint rule.",
      "Ship `.env.example` as living documentation of every knob, with obviously fake values.",
      "Scope each secret to a single service with least privilege, and give it an owner plus a rotation interval.",
      "Treat any secret that appears in a log, ticket or commit as compromised: rotate first, investigate second.",
    ],
    realWorldUseCases: [
      "Shipping one immutable image across dev, staging and prod, with only environment variables differing between them.",
      "Audits and SOC 2-style reviews that require evidence secrets are outside source control and rotated on a schedule.",
      "New-developer onboarding: `.env.example` plus boot validation tells a newcomer in minutes exactly what they must supply.",
    ],
    resources: [
      docs(
        "The Twelve-Factor App — Config",
        "https://12factor.net/config",
        "Store config in the environment; strict separation of config from code.",
        "en",
        "8 min",
      ),
      docs(
        "OWASP — Secrets Management Cheat Sheet",
        "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
        "Storage, access control and rotation guidance for credentials.",
        "en",
        "20 min",
      ),
      article(
        "dotenv",
        "https://github.com/motdotla/dotenv",
        "github.com",
        "Loads local .env files into process.env for development only.",
        { estimatedDuration: "reference" },
      ),
      ytSearch("nodejs environment variables secrets management", "Boot-time config validation and secret-manager integrations in Node.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m1-config-audit",
        title: "Config inventory and fail-fast test",
        prompt:
          "Grep your project for process.env and list every key used, with the file that reads it. Build a schema covering all of them (types, required/optional, defaults), export one config object, and replace the scattered reads. Add a test that asserts boot fails when PORT is 'abc' and that the error message names PORT without printing any secret values.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "grep -rho \"process\\\\.env\\\\.[A-Z_]*\" src | sort -u is a fast inventory.",
          "Use schema.safeParse so you can aggregate every issue into one message.",
        ],
        solution: `it("refuses to boot with an invalid PORT", () => {
  const result = schema.safeParse({ ...process.env, PORT: "abc", DATABASE_URL: "postgres://x", JWT_SECRET: "x".repeat(40) });
  expect(result.success).toBe(false);
  expect(result.error!.issues[0].path).toContain("PORT");
});

it("never includes secret values in the failure output", () => {
  const msg = formatIssues(schema.safeParse({ ...process.env, JWT_SECRET: "short" }).error!);
  expect(msg).toContain("JWT_SECRET");
  expect(msg).not.toContain("short");`,
        solutionLanguage: "ts",
      },
      {
        id: "ex-p3m1-config-rotation",
        title: "Write a rotation runbook",
        prompt:
          "Write a zero-downtime rotation procedure for your most sensitive credential (database password, JWT signing key or third-party API key): preconditions, the exact steps in order, how you verify success, the rollback path, and what you do if the old credential was already exposed.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: ["Dual credentials during the transition are what remove the downtime window."],
      },
    ],
    projectIds: ["p3-capstone", "p3-analytics-api"],
    quizId: "quiz-p3-m1",
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m1",
  moduleId: "p3-m1",
  title: "Module 1 quiz — Software architecture",
  description:
    "Architecture judgement calls: MVC in APIs, layering rules, modular monoliths versus microservices, the dependency rule, injection for testability, SOLID, secrets hygiene and domain invariants.",
  questions: [
    {
      id: "q-p3m1-1",
      type: "multiple-choice",
      prompt:
        "A team says \"our Express API is MVC\". Which statement best describes the view role in a JSON API?",
      options: [
        "The view is the response representation — res.json() or a serializer — so most of MVC's balance shifts between model and controller",
        "The view is the React frontend, so the backend only needs model and controller",
        "The view is the router file that maps paths to handler functions",
        "There is no view in MVC; the V existed only for desktop GUIs",
      ],
      correctIndex: 0,
      explanation:
        "MVC's view is whatever formats data for the consumer. In an API that is the JSON shape you return, which is usually one res.json() call or a serializer function. Because that role is so thin, business logic tends to drift into controllers — the classic reason teams evolve from MVC toward a layered or use-case structure.",
      optionExplanations: [
        "Correct — the \"view\" of an API is its representation layer, and it is thin, which unbalances the pattern.",
        "The frontend renders, but it is a separate application talking over HTTP; it is not part of this server's MVC triad.",
        "The router is routing/transport mechanism, part of the controller side, not a representation of data.",
        "MVC does include a view — it is the presentation of model data, here expressed as JSON.",
      ],
    },
    {
      id: "q-p3m1-2",
      type: "code-output",
      prompt: "Which architectural rule does this code violate?",
      code: `// presentation/order.router.ts
import { prisma } from "../db.js";

router.get("/orders/:id", async (req, res) => {
  const rows = await prisma.$queryRaw\`SELECT * FROM orders WHERE id = \${req.params.id}\`;
  res.json(rows[0]);
});`,
      language: "ts",
      options: [
        "The presentation layer talks directly to persistence, so domain rules and storage are welded together and neither can be tested or swapped alone",
        "The domain layer imports Express, breaking the dependency rule by pointing outward",
        "The repository pattern is wrong here because Prisma cannot be used with raw SQL",
        "Nothing is wrong: a route handler may query the database as long as it returns JSON",
      ],
      correctIndex: 0,
      explanation:
        "This is a presentation-layer file issuing SQL. Layering requires dependencies to flow from presentation into domain and from domain into persistence abstractions; direct queries from a router mean no domain rules, no repository seam and no unit test without a live database. It also drags HTTP concerns and storage concerns into one file.",
      optionExplanations: [
        "Correct — the query belongs behind a domain/repository boundary, not inside the HTTP handler.",
        "That would be a different (reverse) violation: domain importing express. Here it is the presentation layer importing persistence.",
        "Nothing prevents Prisma from being used — the problem is *where* it is used, not which API it calls.",
        "Behaviour may look correct, but the structural violation is exactly what makes later changes expensive.",
      ],
    },
    {
      id: "q-p3m1-3",
      type: "multiple-choice",
      prompt:
        "Your team runs one Node deployable with clear module boundaries. Someone proposes extracting billing into a microservice \"because a competitor did\". Which response is architecturally sound?",
      options: [
        "Split only when a concrete trigger exists — independent scaling needs, an isolated failure/security domain, or genuinely independent team ownership — and remember the existing module boundary already makes extraction cheap later",
        "Split immediately: microservices always reduce risk because failures stay isolated in their own processes",
        "Never split: microservices are always more expensive than any benefit they can provide",
        "Split as soon as you can run a second programming language or a different database",
      ],
      correctIndex: 0,
      explanation:
        "Modular monoliths buy most of microservices' design clarity without distribution costs: in-process calls, real ACID transactions across modules, one deploy and one rollback. Microservices are justified by measurable triggers (scaling profile, failure isolation, independent release cadence), and a well-built module boundary is precisely the seam you extract from — \"monolith first\" is the pattern behind almost every successful microservice estate.",
      optionExplanations: [
        "Correct — demand evidence of a benefit, and note that the hard part (boundaries) is already done.",
        "Isolation cuts both ways: you also gain network failure modes, retries, eventual consistency and real operational overhead.",
        "Overcorrect: independent scaling, team autonomy and compliance isolation can genuinely justify the split.",
        "Polyglot capability is a side effect, not a reason; it multiplies ops cost without serving a stated need.",
      ],
    },
    {
      id: "q-p3m1-4",
      type: "short-answer",
      prompt:
        "In clean architecture, what is the name of the rule stating that source-code dependencies may only point from the outer rings toward the inner rings?",
      acceptedKeywords: ["dependency rule", "the dependency rule", "point inward", "inward"],
      explanation:
        "It is called the dependency rule: imports may only point inward, so nothing in an inner ring (entities, use cases) may name a class, framework or data format from an outer ring. Control flow often travels outward, which is handled by declaring ports inward and implementing them outside (dependency inversion).",
    },
    {
      id: "q-p3m1-5",
      type: "code-output",
      prompt: "What happens when the test below runs, and why?",
      code: `export class ReportService {
  private prisma = new PrismaClient(); // created inside the class
  async daily() {
    const rows = await this.prisma.$queryRaw\`SELECT count(*) FROM events\`;
    return rows;
  }
}

it("runs without a database", async () => {
  const svc = new ReportService();
  await svc.daily();
});`,
      language: "ts",
      options: [
        "It fails (or requires a real database), because the concrete dependency is constructed inside the class — there is no seam where a fake could be injected",
        "It passes, because PrismaClient silently falls back to an in-memory database under NODE_ENV=test",
        "It fails to compile, because class property initialisers cannot call constructors",
        "It passes, because the test never awaits the query result",
      ],
      correctIndex: 0,
      explanation:
        "This is the dependency-inversion problem expressed as a test failure: `new PrismaClient()` is buried in the class, so the only way to test the service is to provide what Prisma needs. The fix is constructor injection of a narrow data-source port, letting tests pass an in-memory implementation — no framework, just an argument.",
      optionExplanations: [
        "Correct — no injection point exists, so the test needs real infrastructure (or fails on connection errors).",
        "Prisma makes no such fallback; it connects to the URL in DATABASE_URL and errors if it cannot.",
        "Field initialisers with constructor calls are perfectly valid TypeScript.",
        "The await does execute daily(); awaiting or not only changes whether the rejection surfaces as an unhandled error.",
      ],
    },
    {
      id: "q-p3m1-6",
      type: "multiple-choice",
      prompt:
        "Every test fake for your Analytics interface has to stub 20 methods that callers never use. Which principle is violated, and what is the best fix?",
      options: [
        "Interface segregation — split the interface by consumer, so ReportService only depends on a narrow EventTracker",
        "Liskov substitution — fakes that do not behave like the real client are illegal substitutes",
        "Open/closed — the interface should be extended by inheritance instead of edited",
        "Single responsibility — one interface should hold exactly one method, so collapse everything into free functions",
      ],
      correctIndex: 0,
      explanation:
        "ISP says clients should not depend on methods they do not use. A 20-method interface forces every implementor — especially test doubles — to carry dead surface. Splitting by consumer (EventTracker for reporting, SegmentAdmin for the admin panel) shrinks fakes to the two or three methods a test cares about.",
      optionExplanations: [
        "Correct — narrow the contract to what each client actually needs; fakes shrink accordingly.",
        "LSP is about honouring base contracts when substituting subtypes; it does not address interface size.",
        "OCP concerns adding behaviour without modifying stable code — irrelevant to a too-wide contract.",
        "ISP does not demand one method per interface; it demands no methods a given client ignores.",
      ],
    },
    {
      id: "q-p3m1-7",
      type: "find-bug",
      prompt: "A security review blocks this file from merging. What is the real problem?",
      code: `// src/config.ts
const HARDCODED_SECRET = "sk_live_4f8a2c9b1e7d6a3f"; // fallback so deploys never fail

export function getConfig() {
  return {
    jwtSecret: process.env.JWT_SECRET ?? HARDCODED_SECRET,
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}`,
      language: "ts",
      options: [
        "A real secret is committed as a fallback, so it lives in git history forever and missing config never fails fast — remove it, rotate the key, and validate at boot",
        "process.env should be read once at module load time instead of inside a function",
        "The fallback should be an empty string rather than a literal, which would make it safe to commit",
        "Nothing is wrong: falling back to a constant default is the recommended twelve-factor pattern",
      ],
      correctIndex: 0,
      explanation:
        "Two failures compound: a working credential inside source control (rotate it — deletion does not erase history), and a design that hides misconfiguration by silently substituting a default. Config must be validated at boot and the process must exit with a clear message when required values are absent. Twelve-factor says config comes from the environment — not that secrets sit in the repository.",
      optionExplanations: [
        "Correct — committed secrets are compromised by definition, and the fallback prevents the fail-fast you want.",
        "Reading env inside a function is fine (often preferable for tests); it is not the security issue here.",
        "An empty fallback avoids leaking a key but still masks missing configuration instead of failing at boot.",
        "Twelve-factor explicitly separates config from code and forbids baking credentials into the source.",
      ],
    },
    {
      id: "q-p3m1-8",
      type: "find-bug",
      prompt: "What is wrong with this domain model?",
      code: `export class Booking {
  constructor(
    public roomId: string,
    public startsAt: Date,
    public endsAt: Date,
  ) {}
  nights() {
    return Math.round((this.endsAt.getTime() - this.startsAt.getTime()) / 86_400_000);
  }
}

const b = new Booking("r101", new Date("2026-06-10T15:00:00Z"), new Date("2026-06-09T15:00:00Z"));
console.log(b.nights());`,
      language: "ts",
      options: [
        "Nothing enforces endsAt after startsAt, so an inverted range silently produces negative nights and can drive negative charges — validate the invariant in a constructor or factory",
        "Date objects cannot be compared with getTime, so the code throws a TypeError",
        "Public constructor parameter properties are disallowed in strict TypeScript and fail to compile",
        "The bug is Math.round: only Math.ceil can handle daylight-saving transitions correctly",
      ],
      correctIndex: 0,
      explanation:
        "An entity whose invariants live nowhere permits invalid states — and this one is reachable from any caller, including JSON.parse output. Move validation into a factory (`Booking.create({ roomId, startsAt, endsAt })` throwing on an inverted range), make the fields readonly, and the bug becomes unrepresentable rather than merely tested for.",
      optionExplanations: [
        "Correct — the missing invariant is the defect; a factory that rejects end-before-start makes it impossible.",
        "getTime() on Dates is standard and returns epoch milliseconds; the math itself is fine.",
        "public parameter properties are valid TypeScript; visibility is not the issue — validation is.",
        "Math.round vs Math.ceil is a rounding policy question; it cannot fix a negative duration.",
      ],
    },
  ],
};
