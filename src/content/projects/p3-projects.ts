import type { Project } from "@/types";
import { OFFICIAL, docs, ytSearch } from "../helpers/resources";

/** Phase 3 capstones — original specifications authored for this platform. */
export const p3Projects: Project[] = [
  {
    id: "p3-ecommerce-platform",
    slug: "production-ecommerce-platform",
    title: "Production E-Commerce Platform",
    description:
      "A multi-role commerce backend: catalog, cart, checkout with test-mode payment, stock reservations, product search, CDN-friendly caching, background jobs and admin analytics — containerized and shipped through CI/CD.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "BullMQ",
      "Stripe test mode",
      "Docker",
      "GitHub Actions",
    ],
    estimatedHours: 75,
    requiredKnowledge: [
      "p3m1-layered-architecture",
      "p3m1-modular-monoliths",
      "p3m1-repository-service-patterns",
      "p3m3-owasp-api-security",
      "p3m3-broken-access-control",
      "p3m4-caching-fundamentals",
      "p3m4-cache-invalidation",
      "p3m4-queue-background-jobs",
      "p2m4-transactions-acid",
      "p2m4-prisma-orm",
      "p2m5-idempotency",
      "p2m5-rate-limiting",
      "p2m2-input-validation",
      "p2m6-role-based-access-control",
      "p2m6-refresh-tokens-rotation",
      "p2m7-integration-testing",
      "p3m6-health-checks",
      "p3m6-multi-stage-docker",
      "p3m7-system-design-fundamentals",
    ],
    learningObjectives: [
      "Structure a commerce domain as a modular monolith with repository/service boundaries",
      "Implement transactional checkout: cart → order → payment (test mode) → stock reservation",
      "Serve catalog reads from Redis + HTTP caching (ETag, Cache-Control, CDN) with safe invalidation",
      "Move emails, search reindexing and analytics rollups onto BullMQ with retries and a DLQ",
      "Ship multi-stage Docker images and a CI/CD pipeline gated on lint, types, tests and load budget",
    ],
    userStories: [
      "As a shopper I can browse and search products, add them to a cart and check out with a test card.",
      "As a shopper I get a clear 409 when a product sells out between adding to cart and paying.",
      "As a merchant I can manage products and stock, and I am alerted when stock drops below the reorder level.",
      "As an admin I can read cached sales analytics (revenue by day, top products) without slowing down the store.",
      "As an operator I can scale API and worker containers independently from one compose file.",
    ],
    functionalRequirements: [
      "Roles: customer, merchant, admin — enforced per route and per object (a merchant may only edit their own products)",
      "Cart → checkout → payment (Stripe test mode) → order; checkout reserves stock inside a single DB transaction",
      "Idempotent checkout: replaying the same Idempotency-Key returns the original order, never a second charge",
      "Product search by text, category and price range with keyset pagination; results cached 60s per query",
      "Background jobs: order confirmation email, product search reindex, daily analytics rollup, payment webhook retry",
      "Admin analytics endpoints (revenue by day, top N products, low-stock list) served from a precomputed rollup",
      "Authentication: register/login with argon2 or bcrypt + short-lived JWT access token and rotating refresh token; admin routes require role=admin",
      "Logging & monitoring: structured JSON logs (requestId, userId, route, status, ms) to stdout; Prometheus /metrics with http_request_duration_seconds, queue depth and cache hit ratio; alert when error rate > 1%",
      "Failure handling: Redis down → serve from DB and skip cache; payment provider timeout → order stays pending with a retry job; DB write conflict → 409 with Retry-After",
      "NFR: p95 latency ≤ 250 ms for cached catalog GETs and ≤ 600 ms for checkout at 500 RPS",
      "NFR: throughput 1,000 req/s sustained across 2 API containers (k6 verified in CI)",
      "NFR: 99.9% monthly availability for the storefront API; read-only catalog degrades gracefully when workers are stopped",
      "NFR: data retention — orders/payments 7 years, audit logs 1 year, abandoned carts 30 days, raw request logs 90 days",
    ],
    milestones: [
      {
        title: "M1 — Foundation, auth and roles",
        tasks: [
          "Layered skeleton (routes → controllers → services → repositories) with zod validation",
          "Users, roles, JWT access/refresh rotation, permission middleware",
          "Prisma schema + migrations for users, products, orders",
        ],
      },
      {
        title: "M2 — Catalog, cart and checkout",
        tasks: [
          "Product CRUD with ownership checks and image upload allow-list",
          "Cart service and transactional checkout with stock reservation",
          "Payment (test mode) + webhook with signature verification and idempotency",
        ],
      },
      {
        title: "M3 — Caching, search and background jobs",
        tasks: [
          "Redis catalog cache with tag-based invalidation + ETag/Cache-Control headers",
          "Search endpoint with keyset pagination and reindex worker",
          "BullMQ: email, reindex and analytics rollup queues with retries and DLQ",
        ],
      },
      {
        title: "M4 — Admin analytics, hardening, Docker and CI/CD",
        tasks: [
          "Admin dashboard endpoints from rollups; rate limiting on login and checkout",
          "Security pass: OWASP API checklist, safe logging, helmet, CORS, body size limits",
          "GitHub Actions: lint, typecheck, unit/integration tests, image build, staging deploy, rollback job",
          "k6 load test vs p95 budget + runbook (deployment, scaling, incident steps)",
        ],
      },
    ],
    suggestedStructure: `ecommerce-platform/
├── src/
│   ├── server.ts                 # bootstrap: config, app, graceful shutdown
│   ├── app.ts                    # express app + middleware wiring
│   ├── config/                   # env parsing (zod), secrets via env only
│   ├── modules/
│   │   ├── auth/                 # routes, controller, service, repository
│   │   ├── catalog/              # products, categories, search
│   │   ├── cart/
│   │   ├── orders/               # checkout, payments, webhooks
│   │   └── admin/                # analytics rollups, stock alerts
│   ├── shared/                   # errors, logger, redis, prisma, auth middleware
│   ├── workers/                  # BullMQ processors (email, reindex, rollup)
│   └── jobs/                     # queue definitions and producers
├── prisma/schema.prisma
├── test/                         # unit / integration / e2e / load (k6)
├── docs/adr/                     # architecture decision records
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── README.md`,
    dataModel: `### Architecture narrative
Three deployable units share one codebase: **api** (Express, stateless, horizontally scaled), **worker**
(BullMQ processors) and the data tier. Reads that change rarely (product list, category tree, analytics) are
served from Redis with tag-based invalidation; sessions and rate-limit counters also live in Redis.
PostgreSQL is the source of truth — primary for writes, one read replica for analytics. Queues carry side
effects (email, reindex, rollups, webhook retries) so checkout stays fast and non-blocking.

### Schema (PostgreSQL / Prisma)
\`\`\`sql
users(id uuid PK, email citext UNIQUE, password_hash, role user_role, created_at)
products(id uuid PK, merchant_id FK->users, slug UNIQUE, title, description,
         price_cents int CHECK (price_cents >= 0), stock int CHECK (stock >= 0),
         reorder_level int, search_tsv tsvector GENERATED, updated_at)
carts(id uuid PK, user_id FK->users, updated_at)
cart_items(cart_id FK, product_id FK, qty int, PRIMARY KEY(cart_id, product_id))
orders(id uuid PK, user_id FK, status order_status, total_cents,
       idempotency_key UNIQUE, created_at)
order_items(order_id FK, product_id FK, qty, unit_price_cents)
payments(id uuid PK, order_id FK, provider, provider_ref, status, amount_cents)
inventory_reservations(id, order_id FK, product_id FK, qty, expires_at)
\`\`\`
Indexes: products(search_tsv GIN), orders(user_id, created_at DESC), order_items(order_id).
Rollup table analytics_daily(day, revenue_cents, orders, product_id) written by a nightly job.

### Cache & queues
Redis keys: catalog:product:{id} (TTL 60s, tag "products"), catalog:list:{hash(query)},
ratelimit:{route}:{ip}. Queues: email, reindex, analytics, webhook-retry — each with exponential
backoff (3 attempts) and a dedicated dead-letter queue inspected from the admin dashboard.`,
    endpoints: [
      { method: "GET", path: "/api/v1/products", description: "List/search products (keyset pagination, ETag)", auth: "public" },
      { method: "GET", path: "/api/v1/products/:id", description: "Product detail (cacheable 60s)", auth: "public" },
      { method: "POST", path: "/api/v1/auth/register", description: "Create account", auth: "public" },
      { method: "POST", path: "/api/v1/auth/login", description: "Issue access + refresh tokens", auth: "public" },
      { method: "GET", path: "/api/v1/cart", description: "Current user's cart", auth: "user" },
      { method: "POST", path: "/api/v1/cart/items", description: "Add or update a line item", auth: "user" },
      { method: "POST", path: "/api/v1/checkout", description: "Cart → order → payment (Idempotency-Key required)", auth: "user" },
      { method: "GET", path: "/api/v1/orders", description: "Own order history", auth: "user" },
      { method: "POST", path: "/api/v1/webhooks/payments", description: "Provider callback, signature-verified", auth: "public" },
      { method: "POST", path: "/api/v1/admin/products", description: "Create product (own shop only)", auth: "admin" },
      { method: "GET", path: "/api/v1/admin/analytics/sales", description: "Revenue and top products from rollups", auth: "admin" },
      { method: "GET", path: "/health", description: "Liveness; /ready checks DB + Redis", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions (0–5 each): architecture, data modelling, API design, security, reliability, performance, testing, delivery.",
      "25% — Architecture: modular monolith with enforced module boundaries, no cross-module table access, ADRs documenting checkout and caching trade-offs.",
      "25% — Correctness & integrity: checkout is atomic; stock never goes negative; idempotent replay returns the same order; payments reconcile.",
      "20% — Security: role/object authorization on every write, secrets outside git, OWASP mitigations proven by tests, rate limits on auth + checkout.",
      "15% — Performance: k6 run meets p95 budgets; cache hit ratio ≥ 80% on catalog reads; no N+1 queries in analytics.",
      "15% — Testing & delivery: unit/integration/E2E/load suites green in CI; multi-stage image; one-command compose boot; documented rollback.",
      "Pass threshold: ≥ 70% weighted total and no grading dimension scored below 2.",
    ],
    tests: [
      "Unit: pricing and stock rules, idempotency key hashing, cache tag builder, zod schemas",
      "Integration: checkout transaction rolls back on stock conflict; webhook replay is a no-op; repositories tested against real PostgreSQL",
      "E2E: register → search → cart → checkout → order visible; admin analytics returns rollup data",
      "Load: k6 — 500 VU catalog reads assert p95 ≤ 250 ms; checkout burst 100 RPS with error rate < 0.5%",
      "Security: user A cannot read user B's order (BOLA); admin route returns 403 for a customer token; oversized body returns 413",
      "Authz: role matrix tested route-by-route; refresh token rotation revokes the token on reuse",
      "Failure: stop Redis → catalog still serves; duplicate payment webhook → single order state transition; poison job lands in the DLQ",
    ],
    hints: [
      "Security checklist — secrets only via env (.env.example committed, .env gitignored), zod validation on every body/query, helmet + CORS allow-list, per-IP and per-user rate limits, magic-byte checks on image uploads, never log tokens or card data.",
      "Reserve stock with UPDATE ... WHERE stock >= qty and check rowCount instead of SELECT-then-UPDATE — that removes the race without advisory locks.",
      "Invalidate cache by tag (products) rather than guessing keys; write cache only after the DB commit.",
      "Queue the confirmation email only after the transaction commits, otherwise you confirm orders that rolled back (see p3m5-outbox-pattern).",
    ],
    optionalSolution: `## Architecture

\`\`\`text
              ┌──────────────┐
   browsers ─▶│ CDN / edge   │  static assets + cacheable GETs (max-age, ETag)
              └──────┬───────┘
                     ▼
        ┌─────────────────────────┐        ┌──────────────────┐
  ────▶ │ api (Express ×2+)       │◀──────▶│ Redis            │
        │ auth · catalog · cart   │        │ catalog cache    │
        │ orders · webhooks admin │        │ sessions, limits │
        └───┬──────────┬──────────┘        └────────▲─────────┘
            │          │                            │
            ▼          ▼                            │
   ┌──────────────┐ ┌───────────────┐      ┌────────┴─────────┐
   │ PostgreSQL   │ │ BullMQ queues │◀─────│ worker containers│
   │ primary +    │ │ email·reindex │      │ email · reindex  │
   │ read replica │ │ analytics     │      │ · rollups        │
   └──────────────┘ └───────────────┘      └──────────────────┘
\`\`\`

## Multi-stage Dockerfile

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build                 # tsc -> dist/

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
\`\`\`

## docker-compose.yml (snippet)

\`\`\`yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/shop
      REDIS_URL: redis://cache:6379
      JWT_SECRET: \${JWT_SECRET}
      PAYMENT_SECRET: \${PAYMENT_SECRET}
    depends_on: [db, cache]
    deploy: { replicas: 2 }
  worker:
    build: .
    command: ["node", "dist/workers/main.js"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/shop
      REDIS_URL: redis://cache:6379
    depends_on: [db, cache]
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
volumes: { pgdata: {} }
\`\`\`

## Deployment steps
1. cp .env.example .env and fill secrets locally; store the same values as GitHub Actions secrets.
2. docker compose build, then docker compose up -d db cache and wait for healthy.
3. Run docker compose run --rm api npx prisma migrate deploy to apply migrations.
4. docker compose up -d api worker and verify curl localhost:3000/health returns {"status":"ok"}.
5. Seed demo data (npm run seed) and smoke-test checkout with test card 4242 4242 4242 4242.
6. Run k6 run test/load/catalog.js and confirm p95 is inside budget before tagging v1.0.0.
7. CI builds and pushes the image, deploys staging, runs E2E smoke; failed smoke triggers the rollback job (previous image tag).`,
    bonusChallenges: [
      "Add a stock-reservation TTL so unpaid orders release inventory automatically (scheduled job)",
      "Serve catalog GETs through a CDN with stale-while-revalidate and purge-on-write",
      "Add an outbox table so payment events publish in the same transaction as the order",
      "Expose GraphQL for the storefront while keeping REST for admin",
    ],
    commonMistakes: [
      "Updating the cache before the DB commit — readers cache lost data",
      "Decrementing stock with two separate queries, allowing oversell under concurrency",
      "Trusting the payment webhook without verifying the provider signature",
    ],
    referenceLinks: [
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "The API-specific risks this capstone must defend against."),
      docs("BullMQ guide", OFFICIAL.bullmqDocs, "Queues, processors, retries and delayed jobs for background work."),
      docs("Redis caching patterns", OFFICIAL.redisDocs, "Cache design, TTLs and invalidation strategies."),
      docs("Docker build best practices", OFFICIAL.dockerDocs, "Multi-stage builds, non-root users and healthchecks."),
      docs("GitHub Actions", OFFICIAL.githubActionsDocs, "CI/CD pipeline for lint, test, image build and deploy."),
      ytSearch("Node.js e-commerce API Express PostgreSQL project", "Reference builds for structuring a full commerce backend."),
    ],
  },

  {
    id: "p3-chat-app",
    slug: "realtime-chat-app",
    title: "Scalable Real-Time Chat Platform",
    description:
      "A production-style chat backend with WebSocket fan-out across multiple nodes via Redis pub/sub, durable message history, presence, per-user rate limits and moderation tooling.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "ws",
      "Redis pub/sub",
      "PostgreSQL",
      "BullMQ",
      "Docker",
      "GitHub Actions",
    ],
    estimatedHours: 70,
    requiredKnowledge: [
      "p3m2-websockets",
      "p3m2-realtime-communication",
      "p3m2-rate-limiting-strategies",
      "p3m3-rate-limiting-security",
      "p3m3-input-sanitization",
      "p3m4-redis",
      "p3m4-horizontal-scaling",
      "p3m4-clustering",
      "p2m1-eventemitter-advanced",
      "p2m1-error-propagation",
      "p2m5-idempotency",
      "p2m2-middleware",
      "p2m6-jwt-access-tokens",
      "p2m7-e2e-testing",
      "p3m6-multi-stage-docker",
      "p3m7-system-design-fundamentals",
    ],
    learningObjectives: [
      "Scale WebSockets horizontally with Redis pub/sub fan-out across nodes",
      "Persist and paginate chat history with keyset (cursor) pagination",
      "Track presence with Redis TTL heartbeats that survive node crashes",
      "Apply token-bucket rate limits and moderation without blocking the socket loop",
      "Handle backpressure, reconnects and graceful shutdown of long-lived connections",
    ],
    userStories: [
      "As a user I can create rooms, invite members and send messages that appear instantly for everyone — even on other server nodes.",
      "As a user I can scroll back through history with a cursor and never miss or duplicate a message.",
      "As a user I see who is online and typing, and my messages show delivered and read state.",
      "As a moderator I can mute a user, delete a message and work through a report queue.",
      "As an operator I can run 3 chat nodes behind one load balancer and every message fans out once per recipient.",
    ],
    functionalRequirements: [
      "Rooms: public and private; membership checked on every message and history read (BOLA-proof)",
      "WebSocket protocol: JWT auth on handshake, typed frames for message.new, message.ack, presence.update, typing and error",
      "Message pipeline: validate → rate limit → persist → publish to Redis → fan out to local sockets → ack with server id + sequence number",
      "History: PostgreSQL is the source of truth; last 200 messages per room cached in Redis; cursor pagination with ?before=seq",
      "Presence: heartbeat every 20s, Redis key TTL 60s; offline is marked when the TTL expires, not when a socket drops",
      "Moderation: profanity/regex filter, per-room mute, message delete broadcasting a tombstone, report queue handled by a BullMQ worker",
      "Rate limits: 30 msg/min/user and 10 connection attempts/min/IP (token bucket in Redis); 429 returns an error frame with retryAfterMs",
      "Authentication & authorization: JWT on handshake; room membership and role (member/moderator/admin) enforced server-side on each frame",
      "Logging & monitoring: structured logs for connection lifecycle and message latency; /metrics exposes connections_total, messages_per_second, fanout_duration_ms; alert when a node exceeds 10k connections",
      "Failure handling: pub/sub drop → reconnect and resubscribe; node crash → clients reconnect with last_seq and backfill; slow consumer → shed oldest buffered frames with a gap notice",
      "NFR: p95 end-to-end fan-out latency ≤ 200 ms between two nodes at 5,000 messages/min",
      "NFR: 10,000 concurrent WebSocket connections per node, 50,000 messages/min cluster-wide",
      "NFR: 99.9% availability; no loss of acknowledged messages (at-least-once delivery + client dedupe by id)",
      "NFR: retention — messages 12 months, presence 24h, moderation reports 1 year, rate-limit counters 10 minutes",
    ],
    milestones: [
      {
        title: "M1 — Socket core",
        tasks: [
          "Express + ws bootstrap, JWT handshake auth, typed frame protocol with zod",
          "Single-node rooms: message persist + broadcast + acks",
          "Cursor-paginated history endpoint",
        ],
      },
      {
        title: "M2 — Scale-out",
        tasks: [
          "Redis pub/sub so two nodes deliver to shared subscribers",
          "Presence with TTL heartbeat; backfill on reconnect using last_seq",
          "Connection and message rate limiting (token bucket in Redis)",
        ],
      },
      {
        title: "M3 — Moderation and jobs",
        tasks: [
          "Filter, mute, delete tombstone and report queue via BullMQ",
          "Read receipts and typing indicators (ephemeral, not persisted)",
          "Graceful shutdown: stop accepting, flush in-flight, notify clients",
        ],
      },
      {
        title: "M4 — Docker, CI/CD and proof",
        tasks: [
          "Compose: 2 chat nodes + load balancer + Redis + Postgres; scale with one command",
          "CI: lint, typecheck, unit/integration tests, image build, staging deploy, rollback",
          "Load test fan-out latency and 10k connections per node; write the runbook",
        ],
      },
    ],
    suggestedStructure: `chat-platform/
├── src/
│   ├── server.ts                 # http + ws server, graceful shutdown
│   ├── app.ts                    # REST routes (auth, rooms, history, moderation)
│   ├── realtime/
│   │   ├── connection.ts         # auth handshake, heartbeat, backpressure
│   │   ├── protocol.ts           # typed frames + zod schemas
│   │   ├── hub.ts                # local sockets per room/user
│   │   └── bus.ts                # Redis pub/sub adapter (cross-node fan-out)
│   ├── modules/
│   │   ├── rooms/
│   │   ├── messages/
│   │   ├── presence/
│   │   └── moderation/
│   ├── workers/                  # moderation + notification processors
│   └── shared/                   # logger, redis, prisma, errors, config
├── test/                         # unit / integration / e2e / load
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── README.md`,
    dataModel: `### Architecture narrative
Any node accepts any socket (stateless auth via JWT). Delivery is **at-least-once**: a message is written to
PostgreSQL first, then published on Redis channel room:{roomId}; every node subscribes and writes to its local
sockets. A per-recipient dedupe set (message id, 5 min TTL) guarantees clients see each message once.
Presence, typing and rate-limit counters live in Redis only — losing them is recoverable; messages are not.

### Schema (PostgreSQL)
\`\`\`sql
users(id uuid PK, handle citext UNIQUE, display_name, status, created_at)
rooms(id uuid PK, name, kind room_kind, created_by FK->users, next_seq bigint)
room_members(room_id FK, user_id FK, role member_role, joined_at,
             muted_until timestamptz, PRIMARY KEY(room_id, user_id))
messages(id uuid PK, room_id FK, author_id FK, seq bigint, body text,
         client_msg_id uuid UNIQUE, deleted_at, created_at)
         -- UNIQUE(room_id, seq) gives a stable cursor
reports(id uuid PK, message_id FK, reporter_id FK, reason, state, created_at)
\`\`\`
Sequence: rooms.next_seq is bumped inside the insert transaction, so ordering is total and gaps
are detectable.

### Redis layout
pubsub:room:{roomId} (pub/sub channel) · presence:room:{roomId} → hash userId→lastSeen (TTL 60s) ·
ratelimit:msg:{userId} and ratelimit:conn:{ip} (token bucket) · history:room:{roomId} (list, 200 msgs) ·
dedupe:{msgId} (SET with TTL).`,
    endpoints: [
      { method: "POST", path: "/api/v1/auth/login", description: "Get the JWT used for the WS handshake", auth: "public" },
      { method: "POST", path: "/api/v1/rooms", description: "Create a room", auth: "user" },
      { method: "GET", path: "/api/v1/rooms/:id/members", description: "Members and roles", auth: "user" },
      { method: "GET", path: "/api/v1/rooms/:id/messages", description: "History with ?before=seq cursor", auth: "user" },
      { method: "POST", path: "/api/v1/rooms/:id/messages", description: "REST fallback send (same pipeline)", auth: "user" },
      { method: "GET", path: "/api/v1/rooms/:id/presence", description: "Online members", auth: "user" },
      { method: "POST", path: "/api/v1/reports", description: "Report a message", auth: "user" },
      { method: "POST", path: "/api/v1/moderation/messages/:id/delete", description: "Broadcast a tombstone", auth: "admin" },
      { method: "POST", path: "/api/v1/moderation/users/:id/mute", description: "Mute until a timestamp", auth: "admin" },
      { method: "GET", path: "/ws", description: "WebSocket upgrade; Authorization header carries the JWT", auth: "user" },
      { method: "GET", path: "/health", description: "Liveness; /ready pings Redis + Postgres", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions (0–5 each): realtime architecture, data design, protocol quality, security, reliability, performance, testing, delivery.",
      "25% — Fan-out correctness: two nodes, one message → exactly one delivery per connected recipient; no duplicates after reconnect.",
      "25% — Durability: every acknowledged message survives a node crash; history cursors return stable, gap-free pages.",
      "20% — Security: handshake auth, per-room authorization, rate limits, audited moderation actions, no message content in logs.",
      "15% — Performance: measured p95 cross-node fan-out ≤ 200 ms; 10k connections per node without event-loop blocking > 50 ms.",
      "15% — Operations: compose scales to 3 nodes; CI green with unit/integration/E2E/load; runbook covers node loss and Redis restart.",
      "Pass threshold: ≥ 70% weighted total with no dimension below 2.",
    ],
    tests: [
      "Unit: frame schema validation, token-bucket limiter, cursor builder, mute expiry logic",
      "Integration: two app instances in-process → publish on the bus → both hubs deliver; history pagination stable under inserts",
      "E2E: two browser clients in different rooms receive messages, presence and typing events",
      "Load: artillery/k6 — 10k connections and 5k msg/min, assert p95 fan-out ≤ 200 ms and zero dropped acks",
      "Security: expired JWT on handshake → close 4044; a user outside the room gets 403 on send and on history",
      "Authz: moderator-only delete and mute; a muted user's frame is rejected with error code 4291",
      "Failure: restart Redis → subscribers resubscribe and clients backfill; kill node A → clients reconnect to node B with last_seq and no gaps",
    ],
    hints: [
      "Security checklist — verify the JWT on handshake, zod-validate every frame, cap frame size (4 KB), sanitize rendered message content against XSS, rate limit per user and per IP, keep tokens and message bodies out of logs, verify upload magic bytes for attachments.",
      "Do not write faster than a socket drains: watch bufferedAmount (or ws backpressure events) and shed load with a gap notice instead of growing memory.",
      "Fan out through Redis only — never assume a user's sockets live on the node that received the message.",
      "Persist before publish: publishing first creates ghost messages when the insert fails.",
    ],
    optionalSolution: `## Architecture

\`\`\`text
   client A ──WS──▶ ┌───────────────┐   pub/sub   ┌───────────────┐
                    │ chat node 1   │◀───────────▶│ chat node 2   │◀── client B
                    │ hub + dedupe  │  Redis      │ hub + dedupe  │
                    └──────┬────────┘             └──────┬────────┘
                           │                             │
              ┌────────────▼─────────────────────────────▼───────────┐
              │ Redis: channels · presence TTL · token buckets ·     │
              │        history cache · dedupe keys                   │
              └────────────┬─────────────────────────────────────────┘
                           ▼
              ┌──────────────────────┐      ┌──────────────────────┐
              │ PostgreSQL           │      │ BullMQ worker        │
              │ messages / rooms     │      │ moderation · reports │
              └──────────────────────┘      └──────────────────────┘
\`\`\`

## Multi-stage Dockerfile

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.js"]
\`\`\`

## docker-compose.yml (snippet) — proves cross-node fan-out

\`\`\`yaml
services:
  lb:
    image: nginx:1.27-alpine
    ports: ["8080:80"]
    volumes: ["./ops/nginx-lb.conf:/etc/nginx/nginx.conf:ro"]
  chat:
    build: .
    environment:
      REDIS_URL: redis://cache:6379
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/chat
      JWT_SECRET: \${JWT_SECRET}
    deploy: { replicas: 3 }
    depends_on: [cache, db]
  cache:
    image: redis:7-alpine
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes: { pgdata: {} }
\`\`\`

## Deployment steps
1. cp .env.example .env — set JWT_SECRET (32+ random bytes) and POSTGRES_PASSWORD; mirror them into CI secrets.
2. docker compose build && docker compose up -d db cache.
3. Apply migrations (npx prisma migrate deploy), then docker compose up -d chat lb.
4. Verify: two browsers on http://localhost:8080 — a message from one arrives on the other within 200 ms; docker compose logs chat shows deliveries from different replicas.
5. Run the fan-out load test (artillery/k6) and record p95 in the runbook.
6. Tag a release; CI pushes the image and does a rolling update (one replica at a time, health-gated) with automatic rollback if /ready fails.`,
    bonusChallenges: [
      "End-to-end encrypted rooms (client-side keys, server stores ciphertext only)",
      "Presence aggregation across rooms with a global active-now feed",
      "Sharded pub/sub channels for 100k-member rooms",
      "SSE fallback for clients that cannot open WebSockets",
    ],
    commonMistakes: [
      "Assuming sockets are local to the node that received the HTTP request",
      "OFFSET pagination for history — rows shift; use the seq cursor",
      "Logging message bodies (privacy incident) instead of ids and sizes",
    ],
    referenceLinks: [
      docs("ws — Node.js WebSocket library", "https://github.com/websockets/ws#readme", "Server-side WebSocket implementation used for the hub."),
      docs("Socket.IO protocol reference", "https://socket.io/docs/v4/", "Alternative stack: rooms, reconnection and fallback transports."),
      docs("Redis pub/sub", OFFICIAL.redisDocs, "Cross-node fan-out channel semantics."),
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "BOLA and resource-level abuse to defend against."),
      ytSearch("Node.js WebSocket horizontal scaling Redis pub/sub", "Walkthroughs of multi-node socket fan-out."),
    ],
  },

  {
    id: "p3-job-processing",
    slug: "background-job-processing-system",
    title: "Background Job Processing System",
    description:
      "A BullMQ-based job platform with priorities, exponential backoff, dead-letter queues, scheduled jobs, a monitoring dashboard and Prometheus metrics — API, workers and ops tooling in one repository.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "BullMQ",
      "Redis",
      "PostgreSQL",
      "Prometheus",
      "Grafana",
      "Docker",
      "GitHub Actions",
    ],
    estimatedHours: 60,
    requiredKnowledge: [
      "p3m4-queue-background-jobs",
      "p3m5-background-processing",
      "p3m5-job-queues",
      "p3m5-retries-backoff",
      "p3m5-dead-letter-queues",
      "p3m5-idempotent-consumers",
      "p3m5-failure-handling",
      "p3m4-graceful-shutdown",
      "p3m4-performance-monitoring",
      "p2m5-rate-limiting",
      "p2m2-input-validation",
      "p2m1-worker-threads",
      "p2m7-unit-testing",
      "p3m6-cicd-pipelines",
      "p3m6-metrics-monitoring",
      "p3m7-technical-documentation",
    ],
    learningObjectives: [
      "Model work as queues with priorities, delay, attempts and exponential backoff with jitter",
      "Build idempotent processors so at-least-once delivery never duplicates side effects",
      "Design a DLQ policy: inspect, retry-with-patch, or archive with full context",
      "Operate workers: concurrency tuning, graceful shutdown, pause/resume, horizontal scaling",
      "Expose queue health as Prometheus metrics and prove throughput with load tests",
    ],
    userStories: [
      "As an API client I can enqueue a job with a priority and get back a job id to poll.",
      "As an operator I can pause a queue, drain it safely and replay dead-letter jobs after a fix.",
      "As a developer I can see waiting/active/failed/completed counts and failure rates on a dashboard.",
      "As a platform team we run nightly reports through a repeatable scheduler without an external cron box.",
    ],
    functionalRequirements: [
      "Queues: critical, default, bulk and scheduled — each with its own concurrency and rate limits",
      "Job lifecycle: enqueue → wait → active → completed | failed → retries (exponential backoff + jitter) → DLQ",
      "Idempotency: the job id doubles as the idempotency key; processors record processed job ids to dedupe",
      "Priorities (1 = highest) and delayed jobs; FIFO within a priority band",
      "Repeatable (cron) jobs registered at boot, restart-safe with no duplicate schedules",
      "Dashboard: Bull Board behind admin auth — queue stats, job detail, retry/delete/pause actions",
      "Metrics: /metrics exposes queue depth, jobs completed/failed totals, processing duration histogram, retry and DLQ counters",
      "Authentication & authorization: enqueuing requires a user token; dashboard and admin actions require role=admin; /metrics is restricted to the ops network",
      "Logging & monitoring: one structured log line per state transition (jobId, queue, attempt, durationMs); alert when the failed rate > 5% or DLQ depth > 0 for 10 min",
      "Failure handling: worker SIGTERM finishes the active job then exits; Redis restart → jobs re-read from queue state; poison job → attempts exhausted → DLQ with full context payload",
      "NFR: 500 jobs/s sustained enqueue, 300 jobs/s processed per worker container",
      "NFR: p95 end-to-end latency ≤ 2 s for default priority at 200 jobs/s; critical queue p95 ≤ 500 ms",
      "NFR: 99.9% availability of the enqueue API; no acknowledged job is ever lost (Redis AOF persistence enabled)",
      "NFR: retention — completed jobs 7 days, failed/DLQ 30 days, metric samples 15 days",
    ],
    milestones: [
      {
        title: "M1 — Queue core",
        tasks: [
          "Queue definitions, typed payloads, enqueue API with zod validation",
          "Processors with attempts, backoff, timeout and structured logs",
          "Job status endpoint (completed/failed/active/waiting)",
        ],
      },
      {
        title: "M2 — Reliability",
        tasks: [
          "Idempotent consumer store and exactly-once side-effect guard",
          "DLQ flow: archive, inspect, manual replay endpoint",
          "Graceful shutdown (SIGTERM drain) and pause/resume endpoints",
        ],
      },
      {
        title: "M3 — Scheduling, dashboard, metrics",
        tasks: [
          "Repeatable/cron jobs registered idempotently at startup",
          "Bull Board mounted behind admin auth",
          "Prometheus metrics + Grafana dashboard JSON + alert rules",
        ],
      },
      {
        title: "M4 — Docker, CI/CD and validation",
        tasks: [
          "Compose: api, worker (scale to 3), Redis, Postgres, Prometheus, Grafana",
          "CI: lint/typecheck/tests, image build, deploy worker before api (job schema compat)",
          "Load test at 500 jobs/s, record p95, publish the ops runbook",
        ],
      },
    ],
    suggestedStructure: `job-processor/
├── src/
│   ├── server.ts                # enqueue/status API
│   ├── app.ts
│   ├── queues/
│   │   ├── definition.ts        # queue names, concurrency, backoff policy
│   │   ├── producer.ts          # typed enqueue helpers + idempotency
│   │   └── registry.ts          # repeatable job registration
│   ├── processors/              # critical.ts, default.ts, bulk.ts, report.ts
│   ├── dlq/                     # archive, inspect, replay
│   ├── metrics/                 # prom-client registry + /metrics
│   ├── dashboard/               # Bull Board mounting (admin only)
│   └── shared/                  # redis, prisma, logger, config, errors
├── test/                        # unit / integration / e2e / load
├── ops/grafana/dashboard.json
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── README.md`,
    dataModel: `### Architecture narrative
The **API** only validates and enqueues (fast path, p95 < 100 ms) — all real work happens in **worker**
containers that scale independently (docker compose up -d --scale worker=4). Redis is the queue store
(BullMQ) and the metrics cache; PostgreSQL keeps the audit trail (job history, processed-id dedupe table,
DLQ archive) so queue state can be rebuilt and audited. Prometheus scrapes /metrics; Grafana renders queue
depth and failure rate.

### Queue model
\`\`\`text
producer ─▶ queue:critical ─┐
producer ─▶ queue:default ──┼─▶ worker pool (concurrency N) ─▶ handler
producer ─▶ queue:bulk ─────┤        │ attempts exhausted
cron     ─▶ queue:scheduled┘        ▼
                                queue:*:failed ─▶ DLQ archive (Postgres) ─▶ manual replay
\`\`\`

### Schema (PostgreSQL)
\`\`\`sql
job_audit(id uuid PK, queue, job_id, state, attempt, priority, enqueued_at,
          started_at, finished_at, error text, payload jsonb)
processed_jobs(job_id text PK, queue, processed_at)          -- idempotency guard
dlq_entries(id uuid PK, queue, job_id, payload jsonb, error,
            last_attempt_at, archived_at, replayed_at)
schedules(name text PK, cron, queue, payload jsonb, enabled bool, last_run_at)
\`\`\`
Redis keys are managed by BullMQ (bull:{queue}:*) — do not write them by hand.`,
    endpoints: [
      { method: "POST", path: "/api/v1/jobs", description: "Enqueue {queue, name, payload, priority?, delay?}; idempotent via Idempotency-Key", auth: "user" },
      { method: "GET", path: "/api/v1/jobs/:id", description: "Job state, attempts, last error", auth: "user" },
      { method: "GET", path: "/api/v1/jobs", description: "List own jobs (keyset pagination)", auth: "user" },
      { method: "GET", path: "/api/v1/queues", description: "Depth, active, failed, completed per queue", auth: "admin" },
      { method: "POST", path: "/api/v1/queues/:name/pause", description: "Pause or resume a queue", auth: "admin" },
      { method: "POST", path: "/api/v1/dlq/:id/replay", description: "Replay an archived dead-letter job", auth: "admin" },
      { method: "GET", path: "/admin/queues", description: "Bull Board UI", auth: "admin" },
      { method: "GET", path: "/metrics", description: "Prometheus exposition (ops network only)", auth: "public" },
      { method: "GET", path: "/health", description: "Liveness; /ready pings Redis", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions (0–5 each): queue design, reliability semantics, observability, API design, security, testing, delivery, documentation.",
      "25% — Reliability: retries with exponential backoff and jitter, DLQ after attempts are exhausted, no job loss on worker kill (job returns to the queue).",
      "25% — Idempotency: replaying the same Idempotency-Key enqueues once; a job executed twice produces one side effect.",
      "20% — Observability: /metrics covers depth, throughput, failure rate and duration; Grafana dashboard and alert rules shipped in ops/.",
      "15% — Operations: pause/resume, graceful shutdown and replay demonstrated live; runbook covers Redis restart and poison jobs.",
      "15% — Quality: CI gates on lint/typecheck/tests; unit/integration/E2E/load suites exist and meet the stated latency budgets.",
      "Pass threshold: ≥ 70% weighted total with no dimension below 2.",
    ],
    tests: [
      "Unit: backoff calculation, priority ordering, payload schemas, idempotency key derivation",
      "Integration: worker processes a job against real Redis; a failing handler retries then lands in the DLQ; processed_jobs blocks a second run",
      "E2E: enqueue via API → job completes → status endpoint flips to completed with the result payload",
      "Load: enqueue 500 jobs/s for 2 min; assert no drops, p95 end-to-end ≤ 2 s and bounded Redis memory",
      "Security: the dashboard returns 401 without an admin token; /metrics is blocked from the public interface",
      "Authz: a user can read only their own jobs (BOLA test across ids)",
      "Failure: SIGTERM during an active job → the job finishes or is requeued and the container exits 0; Redis restart → the queue resumes; poison payload → exactly N attempts then DLQ",
    ],
    hints: [
      "Security checklist — payloads are untrusted input: zod-validate on enqueue and again in the processor; secrets only from env; dashboard behind admin auth; cap payload size (64 KB) so queues are not free storage; scrub PII from error payloads archived to the DLQ.",
      "Always configure attempts plus backoff: { type: exponential, delay: 1000 } and jitter — synchronized retries cause thundering herds.",
      "Set removeOnComplete/removeOnFail retention or Redis will grow without bound.",
      "Give every handler a timeout; a hanging handler consumes a concurrency slot forever.",
    ],
    optionalSolution: `## Architecture

\`\`\`text
  clients ─▶ ┌──────────────┐   enqueue (p95 < 100 ms)
             │ api (Express)│───────────────┐
             └──────────────┘               ▼
                                  ┌────────────────────┐
   cron (repeatable) ────────────▶│ Redis + BullMQ     │
                                  │ critical/default/  │
                                  │ bulk/scheduled     │
                                  └───┬──────────┬─────┘
                       backoff/retry  │          │ attempts exhausted
                                      ▼          ▼
                            ┌──────────────┐  ┌───────────┐
                            │ worker ×N    │  │ DLQ       │
                            │ processors   │  │ (Postgres)│
                            └──────┬───────┘  └───────────┘
                                   │ audit + dedupe
                                   ▼
                            ┌──────────────┐   ┌────────────────┐
                            │ PostgreSQL   │   │ /metrics ▶     │
                            └──────────────┘   │ Prometheus ▶   │
                                               │ Grafana        │
                                               └────────────────┘
\`\`\`

## Multi-stage Dockerfile (one image, two commands)

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.js"]
\`\`\`

## docker-compose.yml (snippet)

\`\`\`yaml
services:
  api:
    build: .
    environment:
      REDIS_URL: redis://cache:6379
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/jobs
    ports: ["3000:3000"]
    depends_on: [cache, db]
  worker:
    build: .
    command: ["node", "dist/workers/main.js"]
    environment:
      REDIS_URL: redis://cache:6379
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/jobs
      WORKER_CONCURRENCY: "10"
    deploy: { replicas: 3 }
    depends_on: [cache, db]
    stop_grace_period: 30s      # let SIGTERM drain active jobs
  cache:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]   # durability for queues
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
  prometheus:
    image: prom/prometheus:v2.54.0
    volumes: ["./ops/prometheus.yml:/etc/prometheus/prometheus.yml:ro"]
  grafana:
    image: grafana/grafana:11.2.0
    ports: ["3001:3000"]
\`\`\`

## Deployment steps
1. cp .env.example .env — set DATABASE_URL, REDIS_URL and API keys; CI receives the same keys as secrets.
2. docker compose up -d cache db, then apply migrations (npx prisma migrate deploy).
3. docker compose up -d --build api worker — start workers before the API so no job waits unprocessed.
4. Smoke: POST /api/v1/jobs, then poll GET /api/v1/jobs/:id until completed; check Grafana for queue depth.
5. Scale: docker compose up -d --scale worker=5; verify throughput rises and p95 stays in budget (k6 script in test/load).
6. Release: tag → CI builds/pushes image, runs tests, deploys workers first then API (backward-compatible job payloads); rollback = redeploy previous tag.`,
    bonusChallenges: [
      "Job chains and fan-out/fan-in aggregates (parent job spawning children)",
      "Per-tenant fair-share scheduling so one client cannot starve others",
      "Stuck-job watchdog that requeues active jobs whose worker died",
      "SLA report: percentage of jobs meeting the p95 latency target per day",
    ],
    commonMistakes: [
      "Doing heavy CPU work inside the processor — move it to a worker thread or separate service",
      "Logging the whole payload (secrets/PII) instead of job id + metadata",
      "Forgetting retention settings so completed jobs fill Redis",
    ],
    referenceLinks: [
      docs("BullMQ guide", OFFICIAL.bullmqDocs, "Queues, processors, priorities, backoff and repeatable jobs."),
      docs("Redis persistence (AOF)", OFFICIAL.redisDocs, "Durability configuration so queued jobs survive restarts."),
      docs("Prometheus exposition format", "https://prometheus.io/docs/instrumenting/exposition_formats/", "How /metrics should be formatted."),
      docs("GitHub Actions", OFFICIAL.githubActionsDocs, "CI/CD pipeline for the API and worker images."),
      ytSearch("BullMQ tutorial Node.js queues retries dead letter", "Hands-on BullMQ walkthroughs for retries and DLQs."),
    ],
  },

  {
    id: "p3-booking-platform",
    slug: "multi-service-booking-platform",
    title: "Multi-Service Booking Platform",
    description:
      "A booking backend split into availability, search, booking and notification services — with idempotent writes, conflict-safe reservations, outbox-driven events and demonstrable eventual consistency.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "PostgreSQL",
      "Prisma",
      "Redis",
      "RabbitMQ",
      "Docker",
      "GitHub Actions",
    ],
    estimatedHours: 75,
    requiredKnowledge: [
      "p3m1-modular-monoliths",
      "p3m5-service-communication",
      "p3m5-event-driven-architecture",
      "p3m5-outbox-pattern",
      "p3m5-eventual-consistency",
      "p3m5-idempotent-consumers",
      "p3m2-idempotent-operations",
      "p3m4-caching-fundamentals",
      "p3m4-cache-invalidation",
      "p2m4-transactions-acid",
      "p2m4-constraints",
      "p2m5-idempotency",
      "p3m3-broken-access-control",
      "p2m6-permissions",
      "p2m7-integration-testing",
      "p3m6-cloud-deployment",
      "p3m7-database-design-interviews",
      "p3m7-system-design-fundamentals",
    ],
    learningObjectives: [
      "Split a domain into cohesive services (availability, search, booking, notification) with explicit contracts",
      "Prevent double-booking with transactional locking and PostgreSQL exclusion constraints",
      "Publish events transactionally with the outbox pattern and consume them idempotently",
      "Design idempotent, retry-safe APIs (Idempotency-Key) and demonstrate eventual consistency",
      "Cache availability slots with short TTLs and invalidate them on booking writes",
    ],
    userStories: [
      "As a customer I can search available slots for a service, reserve one and receive a confirmation notification.",
      "As a customer I never see a slot that is already taken, even if I submit from two tabs at the same time.",
      "As a provider I can define working hours, capacity per slot and blackout dates.",
      "As an operator I can watch a pending booking settle to confirmed within seconds, and see outbox lag.",
      "As a developer I can replay a notification event without sending duplicate emails.",
    ],
    functionalRequirements: [
      "Services: availability (slots + holds), search (indexed discovery), booking (order lifecycle), notification (email/SMS via queue)",
      "Slot holds: a slot can be held for 10 minutes with a TTL; expired holds release capacity automatically (scheduled sweeper)",
      "Conflict handling: reserve inside a DB transaction with SELECT FOR UPDATE plus an exclusion constraint; the loser gets 409 SLOT_TAKEN",
      "Idempotency: POST /bookings requires an Idempotency-Key; retries return the same booking and never create a second hold",
      "Eventual consistency: booking state changes write an outbox row in the same transaction; a relay publishes to the queue; notification workers consume idempotently",
      "Search: full-text plus filters (service, provider, price, rating) with keyset pagination; the index is updated by an event consumer",
      "Authentication & authorization: customer JWT for own bookings; provider role for own calendars; admin for all; slot capacity checks are server-side only",
      "Logging & monitoring: a correlation id propagates API → outbox → consumer; /metrics exposes booking_success_total, conflict_total, outbox_lag_seconds and notification_delay; alert when outbox lag > 30 s",
      "Failure handling: consumer crash → redelivery handled by the dedupe key; notification provider timeout → retry with backoff then DLQ; search index behind → serve stale cached results with a banner flag",
      "NFR: p95 availability lookup ≤ 150 ms (cached) / ≤ 400 ms (cold); booking confirmation p95 ≤ 1.5 s end-to-end",
      "NFR: zero double-bookings under 100 concurrent reservers of a single slot (verified by test)",
      "NFR: 99.95% availability for the booking write path; notification eventual consistency within 30 s (p95)",
      "NFR: retention — bookings 5 years, holds 30 days, events/outbox 30 days, audit trail 1 year",
    ],
    milestones: [
      {
        title: "M1 — Domain and availability",
        tasks: [
          "Schema: services, providers, slots, capacity, holds, bookings, outbox",
          "Availability service: slot generation from working hours, blackout dates",
          "Redis slot cache with short TTL + invalidation on writes",
        ],
      },
      {
        title: "M2 — Booking core",
        tasks: [
          "Transactional reservation (row lock + exclusion constraint) and the 409 conflict path",
          "Idempotency-Key store; hold TTL sweeper job",
          "Booking lifecycle: pending → confirmed → cancelled → refunded",
        ],
      },
      {
        title: "M3 — Events and notification",
        tasks: [
          "Outbox table + relay process + idempotent consumers",
          "Notification service: email/SMS templates, retries, DLQ",
          "Search consumer maintaining the discovery index",
        ],
      },
      {
        title: "M4 — Delivery",
        tasks: [
          "Docker images + compose (gateway, booking, relay, workers, db, cache, broker)",
          "CI/CD: forward-only migrations, contract tests, canary deploy, rollback",
          "Load test 100 concurrent bookings on one slot; document the consistency model in the README",
        ],
      },
    ],
    suggestedStructure: `booking-platform/
├── services/
│   ├── gateway/               # auth, rate limit, correlation id, routing
│   ├── availability/          # slots, holds, capacity
│   ├── search/                # discovery index + queries
│   ├── booking/               # reservations, lifecycle, outbox writer
│   └── notification/          # consumers + providers (email/SMS)
├── packages/
│   ├── contracts/             # shared zod schemas + event types
│   ├── db/                    # prisma schema, migrations, seed
│   └── observability/         # logger, metrics, tracing helpers
├── ops/                       # compose overrides, nginx, alerts
├── test/                      # unit / integration / e2e / load / contract
├── .github/workflows/ci.yml
├── Dockerfile                 # multi-stage, shared by all services
├── docker-compose.yml
└── README.md`,
    dataModel: `### Architecture narrative
A **modular service layout in one repository**, deployable as a single compose stack (split later if needed).
The gateway terminates auth and attaches a correlation id. The **availability** service owns slot capacity and
short-TTL Redis caches; **booking** owns reservations and writes outbox rows inside the same transaction as the
state change; the **relay** publishes outbox rows to the broker where **notification** and **search** consumers
process them idempotently (dedupe on event id). You get asynchronous workflows without distributed transactions.

### Schema (PostgreSQL)
\`\`\`sql
providers(id uuid PK, name, timezone)
services(id uuid PK, provider_id FK, title, duration_minutes, price_cents)
calendars(service_id FK, weekday, opens_at, closes_at)
slots(id uuid PK, service_id FK, starts_at, ends_at, capacity int,
      UNIQUE(service_id, starts_at))
holds(id uuid PK, slot_id FK, user_id FK, expires_at, state hold_state)
bookings(id uuid PK, service_id FK, slot_id FK, user_id FK, idempotency_key UNIQUE,
         state booking_state, total_cents, created_at)
         -- EXCLUDE (slot_id WITH =) WHERE (state IN ('pending','confirmed'))
         --   using btree_gist → hard guarantee against double-booking
outbox(id uuid PK, aggregate_type, aggregate_id, event_type, payload jsonb,
       created_at, published_at)
processed_events(event_id text PK, consumer, processed_at)   -- idempotent consumers
\`\`\`
The exclusion constraint needs CREATE EXTENSION btree_gist.

### Cache & queues
Redis: avail:{serviceId}:{date} (TTL 30 s), hold:{holdId} (TTL = hold window), rate limits.
Queues: booking.events → consumers notification and search-index; scheduled → hold sweeper.`,
    endpoints: [
      { method: "GET", path: "/api/v1/services", description: "Discover services (filters + keyset pagination)", auth: "public" },
      { method: "GET", path: "/api/v1/services/:id/availability", description: "Free slots for a date range (cached 30 s)", auth: "public" },
      { method: "POST", path: "/api/v1/holds", description: "Hold a slot for 10 minutes", auth: "user" },
      { method: "POST", path: "/api/v1/bookings", description: "Confirm booking — Idempotency-Key required", auth: "user" },
      { method: "GET", path: "/api/v1/bookings", description: "Own bookings (cursor pagination)", auth: "user" },
      { method: "POST", path: "/api/v1/bookings/:id/cancel", description: "Cancel and release capacity", auth: "user" },
      { method: "PUT", path: "/api/v1/providers/:id/calendar", description: "Working hours + blackout dates", auth: "admin" },
      { method: "GET", path: "/api/v1/admin/metrics/outbox", description: "Outbox relay lag and failures", auth: "admin" },
      { method: "GET", path: "/health", description: "Liveness; /ready checks DB, cache, broker", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions (0–5 each): service boundaries, concurrency correctness, consistency design, API quality, security, observability, testing, delivery.",
      "25% — No double-booking: 100 concurrent requests for one slot produce exactly one success and 99 clean 409s (test evidence required).",
      "25% — Idempotency & consistency: a retried POST /bookings returns the same booking; outbox lag < 30 s; consumers dedupe by event id.",
      "15% — Service design: contracts live in packages/contracts, no cross-service table access, correlation id end-to-end.",
      "15% — Security: role/object authorization, validated inputs, rate limits on hold and booking, secrets from env only.",
      "10% — Performance: availability p95 ≤ 150 ms warm; booking p95 ≤ 1.5 s under load test.",
      "10% — Delivery & docs: compose boots the whole stack, CI/CD with migration + rollback, README documents the consistency model.",
      "Pass threshold: ≥ 70% weighted total with no dimension below 2.",
    ],
    tests: [
      "Unit: slot generation from calendars, hold expiry, backoff, idempotency key hashing",
      "Integration: concurrent reservation race against real Postgres (exclusion constraint hit → 409); outbox row written with the state change",
      "E2E: search → availability → hold → booking → notification event consumed → confirmation email rendered",
      "Contract: a consumer rejects an unknown event version (backward compatibility)",
      "Load: 100 concurrent bookings on one slot (zero doubles) and 200 RPS availability reads (p95 ≤ 150 ms)",
      "Security: user A cannot cancel user B's booking; a provider cannot edit another provider's calendar",
      "Failure: kill the notification worker mid-job → redelivered and processed once; broker down → outbox lag grows and the alert fires; duplicate event delivery → single email",
    ],
    hints: [
      "Security checklist — validate every input with shared zod contracts, enforce object-level authorization on :id, rate limit hold/booking per user, keep secrets in env with a rotation note, verify webhook signatures, and keep PII out of event payloads beyond ids.",
      "The exclusion constraint requires CREATE EXTENSION btree_gist — a UNIQUE on slot_id alone is wrong because capacity can exceed 1.",
      "Invalidate avail:* after the booking commits; writing the cache before commit lets a concurrent reader re-sell a taken slot.",
      "Version your events (booking.confirmed.v1) so consumers can evolve independently.",
    ],
    optionalSolution: `## Architecture

\`\`\`text
 client ─▶ ┌──────────┐   ┌───────────────┐   ┌───────────────┐
           │ gateway  │──▶│ availability  │──▶│ Redis (slots, │
           │ auth ·   │   │ search ·      │   │ holds, limits)│
           │ rate lim │   │ booking       │   └───────────────┘
           └──────────┘   └──────┬────────┘
                                 │ same transaction
                                 ▼
                          ┌──────────────┐   publish    ┌──────────────┐
                          │ PostgreSQL   │────────────▶│ broker       │
                          │ bookings +   │  (relay)     │ booking.*    │
                          │ outbox       │              └──────┬───────┘
                          └──────────────┘                     │
                                 ▲                    ┌────────▼────────┐
                                 │  audit             │ notification    │
                                 └────────────────────│ search-index    │
                                                      │ (idempotent)    │
                                                      └─────────────────┘
\`\`\`

## Multi-stage Dockerfile

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/gateway.js"]
\`\`\`

## docker-compose.yml (snippet)

\`\`\`yaml
services:
  gateway:
    build: .
    command: ["node", "dist/gateway.js"]
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/booking
      REDIS_URL: redis://cache:6379
      BROKER_URL: amqp://broker:5672
    depends_on: [db, cache, broker]
  booking:
    build: .
    command: ["node", "dist/services/booking.js"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/booking
      BROKER_URL: amqp://broker:5672
  relay:
    build: .
    command: ["node", "dist/relay/outbox.js"]     # outbox → broker
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/booking
  worker-notification:
    build: .
    command: ["node", "dist/services/notification.js"]
    environment:
      BROKER_URL: amqp://broker:5672
      SMTP_URL: \${SMTP_URL}
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  cache:
    image: redis:7-alpine
  broker:
    image: rabbitmq:3.13-alpine
volumes: { pgdata: {} }
\`\`\`

## Deployment steps
1. cp .env.example .env; put DATABASE_URL, BROKER_URL, SMTP_URL and JWT_SECRET in the environment (and CI secrets).
2. docker compose up -d db cache broker and wait until healthy.
3. docker compose run --rm gateway npx prisma migrate deploy (forward-only migrations in CI).
4. docker compose up -d — start the relay before workers so outbox rows drain quickly.
5. Smoke flow: create service → GET availability → POST hold → POST booking with Idempotency-Key (repeat it to prove no duplicate) → observe the confirmation event in worker logs.
6. Run the concurrency test (npm run test:load) and the 100-writer slot race; attach the report to the PR.
7. Ship: CI builds one image, deploys canary (10% traffic) then full; rollback = previous image + migrate rollback step documented in the runbook.`,
    bonusChallenges: [
      "Two-phase hold → confirm with an expiry sweep that scales to 1M slots/day",
      "Multi-resource bookings (room + instructor) with ordered lock acquisition to avoid deadlock",
      "Read-your-writes consistency for the customer's booking list via session-sticky cache",
      "Swap the outbox relay to batched Kafka publishing",
    ],
    commonMistakes: [
      "Publishing events before the transaction commits — consumers read state that never existed",
      "OFFSET pagination for availability windows; use (starts_at, id) keyset cursors",
      "Forgetting to release capacity on cancellation, silently losing inventory",
    ],
    referenceLinks: [
      docs("PostgreSQL constraints (EXCLUDE)", "https://www.postgresql.org/docs/current/ddl-constraints.html", "btree_gist exclusion constraints used to forbid overlapping holds."),
      docs("RabbitMQ docs", "https://www.rabbitmq.com/docs", "Broker used for booking events and notification jobs."),
      docs("BullMQ guide (alternatives)", OFFICIAL.bullmqDocs, "Redis-based queue option for the hold sweeper and notification jobs."),
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "Object-level authorization and resource-consumption risks."),
      ytSearch("transactional outbox pattern Node.js PostgreSQL", "Reference implementations of outbox + relay."),
    ],
  },

  {
    id: "p3-analytics-api",
    slug: "analytics-ingestion-api",
    title: "Analytics Ingestion & Query API",
    description:
      "A high-volume analytics backend: batched event ingestion, aggregation workers, Redis-cached dashboards, read replicas and keyset pagination over very large result sets.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "PostgreSQL",
      "Redis",
      "BullMQ",
      "Prisma",
      "Docker",
      "GitHub Actions",
      "k6",
    ],
    estimatedHours: 65,
    requiredKnowledge: [
      "p3m4-caching-fundamentals",
      "p3m4-cache-invalidation",
      "p3m4-redis",
      "p3m4-query-optimization-advanced",
      "p3m4-database-indexing-performance",
      "p3m4-connection-pooling",
      "p3m4-load-testing",
      "p3m2-advanced-rest-design",
      "p2m5-pagination",
      "p2m5-filtering-sorting",
      "p2m4-group-by-aggregates",
      "p3m5-event-driven-architecture",
      "p3m3-input-sanitization",
      "p2m7-unit-testing",
      "p3m6-cicd-pipelines",
      "p3m7-database-design-interviews",
      "p3m7-technical-documentation",
    ],
    learningObjectives: [
      "Ingest high-volume events safely: batch, validate, dedupe and queue",
      "Aggregate incrementally into rollup tables instead of scanning raw events",
      "Cache dashboard queries in Redis with TTL jitter and single-flight protection",
      "Read from replicas with bounded pools; paginate millions of rows with keyset cursors",
      "Prove p95 budgets with k6 and tune indexes from EXPLAIN ANALYZE",
    ],
    userStories: [
      "As a client I can POST thousands of events in one batch and get a receipt with accepted/rejected counts.",
      "As an analyst I can query dashboard metrics and get sub-300 ms responses backed by cache and rollups.",
      "As an engineer I can page through a million-row export with stable cursors and no duplicates.",
      "As an operator I can watch ingestion rate, cache hit ratio and replica lag on a Grafana dashboard.",
      "As a customer I can request deletion of all events past my retention window.",
    ],
    functionalRequirements: [
      "Ingestion: POST /api/v1/events accepts 1–1000 events, validates each against a schema and returns { accepted, rejected[] } per item",
      "Pipeline: ingest → Redis stream/BullMQ → batched COPY insert (1k rows per chunk) → incremental rollup update",
      "Queries: timeseries (bucketed), top-N and counts — served from rollups, never full raw scans for dashboards",
      "Caching: dashboard responses cached in Redis (TTL 30–60 s + jitter) with stale-while-revalidate and a single-flight lock to prevent stampedes",
      "Reads route to a PostgreSQL read replica; writes always use the primary; pool sizes are bounded per instance",
      "Pagination: signed opaque keyset cursors on all large lists; OFFSET allowed only for admin lists under 10k rows",
      "Authentication & authorization: ingestion via project API key (X-API-Key, scoped, rotatable); query endpoints use a user JWT with project scoping; admin endpoints require role=admin",
      "Rate limits: 600 requests/min and 50k events/min per API key (token bucket in Redis), 429 with Retry-After",
      "Logging & monitoring: structured logs with projectId and requestId (never event PII); /metrics: events_ingested_total, batch_flush_seconds, cache_hit_ratio, replica_lag; alert when lag > 5 s or error rate > 1%",
      "Failure handling: replica lag high → route reads to primary; Redis down → serve uncached; malformed batch → reject item-by-item, never 500; worker crash → batch re-delivered and deduped by event_id",
      "NFR: ingestion 5,000 events/s sustained, p95 ack ≤ 300 ms for a 500-event batch",
      "NFR: dashboard reads p95 ≤ 300 ms warm and ≤ 1.2 s cold; 500 RPS on the query API with 2 replicas",
      "NFR: 99.9% availability for both the ingest and query APIs",
      "NFR: retention — raw events 30 days, hourly rollups 13 months, daily rollups 5 years, API keys rotated every 90 days",
    ],
    milestones: [
      {
        title: "M1 — Ingestion path",
        tasks: [
          "API key auth + project scoping + rate limiting",
          "Batch endpoint with per-item validation and a rejection report",
          "Queue + batched writer with dedupe on event_id",
        ],
      },
      {
        title: "M2 — Aggregation and queries",
        tasks: [
          "Rollup tables (hourly/daily) maintained incrementally by workers",
          "Query endpoints: timeseries, top-N, counts with filters",
          "EXPLAIN ANALYZE pass + indexes for every hot query",
        ],
      },
      {
        title: "M3 — Caching and scale",
        tasks: [
          "Redis dashboard cache with jitter + single-flight + stale-while-revalidate",
          "Read replica routing and bounded connection pools",
          "Signed keyset cursors for exports over 1M rows",
        ],
      },
      {
        title: "M4 — Hardening and delivery",
        tasks: [
          "Retention job (partition drop / purge) and data-deletion endpoint",
          "Docker multi-stage images + compose; CI with tests, image build, staging deploy, rollback",
          "k6 suites for ingest and query budgets; Grafana dashboards + alert rules",
        ],
      },
    ],
    suggestedStructure: `analytics-api/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── modules/
│   │   ├── ingest/             # batch endpoint, schema, rate limit
│   │   ├── query/              # timeseries, top-N, exports
│   │   ├── projects/           # API keys, scoping, rotation
│   │   └── retention/          # purge jobs, deletion requests
│   ├── workers/
│   │   ├── flush.ts            # batched COPY inserts
│   │   └── rollup.ts           # hourly/daily aggregation
│   ├── cache/                  # redis client, single-flight, jitter TTLs
│   ├── db/                     # pools (write/replica), repositories, SQL
│   └── shared/                 # logger, metrics, config, errors
├── test/                       # unit / integration / e2e / load (k6)
├── ops/                        # prometheus.yml, grafana dashboards, alerts
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── README.md`,
    dataModel: `### Architecture narrative
Write path: the **ingest** service validates and acknowledges fast (queue ack), then a **flush worker** batches
rows into PostgreSQL with COPY and updates incremental rollups. Read path: the **query API** serves dashboards
from rollups, fronted by Redis (TTL + jitter, single-flight). Heavy analytical reads go to **read replicas**
with their own bounded pool; writes always use the primary. Raw events are partitioned by day so retention is
a cheap DROP PARTITION.

### Schema (PostgreSQL)
\`\`\`sql
projects(id uuid PK, name, api_key_hash, retention_days int)
events(event_id text PK, project_id FK, name, user_key, ts timestamptz, props jsonb)
       -- PARTITION BY RANGE (ts), one partition per day
events_part_2026_10_15 ...                     -- retention = DROP PARTITION

rollups_hourly(project_id, name, hour timestamptz, count bigint, uniq bigint,
               PRIMARY KEY(project_id, name, hour))
rollups_daily(project_id, name, day date, count bigint, uniq bigint,
              PRIMARY KEY(project_id, name, day))
\`\`\`
Indexes: events(project_id, name, ts DESC) · rollups_hourly(project_id, name, hour DESC).

### Redis layout
dash:{projectId}:{hash(query)} TTL 45s ± 20% jitter · lock:dash:{hash} single-flight (SET NX, 5s) ·
rl:key:{apiKey}:{minute} token bucket · cursors are stateless signed values, not Redis keys.`,
    endpoints: [
      { method: "POST", path: "/api/v1/events", description: "Batch ingest (1–1000 events) → { accepted, rejected[] }", auth: "public" },
      { method: "POST", path: "/api/v1/projects", description: "Create project + first API key", auth: "admin" },
      { method: "POST", path: "/api/v1/projects/:id/keys/rotate", description: "Rotate the ingest key (24 h grace overlap)", auth: "admin" },
      { method: "GET", path: "/api/v1/query/timeseries", description: "?name=&from=&to=&bucket=hour, cached", auth: "user" },
      { method: "GET", path: "/api/v1/query/top", description: "Top-N by count, cached", auth: "user" },
      { method: "GET", path: "/api/v1/events/export", description: "Keyset-paginated export of raw events", auth: "user" },
      { method: "DELETE", path: "/api/v1/projects/:id/data", description: "Retention/deletion purge", auth: "admin" },
      { method: "GET", path: "/metrics", description: "Prometheus metrics (ops network)", auth: "public" },
      { method: "GET", path: "/health", description: "Liveness; /ready checks DB, replica, Redis", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions (0–5 each): ingestion design, query design, caching discipline, performance engineering, security, observability, testing, delivery.",
      "25% — Ingestion correctness: batch ack ≤ 300 ms p95 at 5k events/s; invalid items rejected individually; no duplicate rows from retries.",
      "25% — Query & pagination: every dashboard query served from rollups/cache; a 1M-row export pages with stable cursors, zero duplicates or skips.",
      "20% — Performance: k6 evidence for p95 ≤ 300 ms warm dashboard reads and cache hit ratio ≥ 85% at steady state.",
      "15% — Security: scoped rotatable API keys, project isolation (cross-project query → 403 or empty), rate limits, no PII in logs.",
      "15% — Operations & delivery: replica-lag failover, retention job, compose boot, CI/CD with rollback, documented alerts.",
      "Pass threshold: ≥ 70% weighted total with no dimension below 2.",
    ],
    tests: [
      "Unit: event schema validation, bucketing math, cursor encode/decode with HMAC, jitter TTL",
      "Integration: flush worker writes 10k rows via COPY and updates rollups; dedupe on event_id across redeliveries",
      "E2E: ingest a batch → poll until queries reflect counts (eventual, ≤ 5 s) → export pages fully",
      "Load: k6 — 5k events/s ingest (p95 ≤ 300 ms) and 500 RPS queries (p95 ≤ 300 ms warm)",
      "Security: wrong API key → 401; a key from project A cannot query project B's data; 429 after the limit with Retry-After",
      "Authz: role matrix on export/delete/rotation routes",
      "Failure: Redis stopped → queries still work uncached; replica lag > 5 s → reads flip to primary; worker killed mid-batch → reprocessed without duplicates; one malformed item → per-item rejection, not 500",
    ],
    hints: [
      "Security checklist — hash API keys at rest (store a digest, show the value once), scope every query by project_id in SQL (never trust a query param), rate limit per key and per IP, zod-validate nested props against JSON abuse, cap batch size and body bytes, keep user identifiers out of logs.",
      "Use COPY or multi-row INSERT for flushes — one row per statement will never hit 5k events/s.",
      "Add ±20% jitter to every TTL; identical TTLs cause synchronized expiry stampedes.",
      "Opaque pagination cursors should be signed (sort key + id + HMAC) so clients cannot tamper with them.",
    ],
    optionalSolution: `## Architecture

\`\`\`text
  SDKs/services ──batch──▶ POST /api/v1/events ──▶ ┌──────────────┐
        (5k events/s)      X-API-Key + rate limit   │ ingest API   │
                                                    │ validate ·   │
                                                    │ ack ≤ 300ms  │
                                                    └──────┬───────┘
                                                           ▼ enqueue
                                                    ┌──────────────┐
                                                    │ Redis stream │
                                                    │ + BullMQ     │
                                                    └──────┬───────┘
                                             batch COPY    ▼
  dashboards ◀── Redis cache ◀── query API ◀─ ┌─────────────────────────┐
  (CDN/ETag)      (TTL+jitter,               │ PostgreSQL              │
                   single-flight)            │ events (partitioned) ·  │
                                             │ rollups · read replica  │
                                             └─────────────────────────┘
\`\`\`

## Multi-stage Dockerfile

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server.js"]
\`\`\`

## docker-compose.yml (snippet)

\`\`\`yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/analytics
      DATABASE_REPLICA_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db-replica:5432/analytics
      REDIS_URL: redis://cache:6379
    depends_on: [db, cache]
  worker:
    build: .
    command: ["node", "dist/workers/flush.js"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/analytics
      REDIS_URL: redis://cache:6379
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  db-replica:
    image: postgres:16-alpine      # streaming replica for reads (demo: separate instance)
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
  cache:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru"]
volumes: { pgdata: {} }
\`\`\`

## Deployment steps
1. cp .env.example .env; generate DATABASE_URL, REDIS_URL and JWT secrets; mirror them into CI secrets.
2. docker compose up -d db db-replica cache, apply migrations, then docker compose up -d api worker.
3. Create a project (admin) → copy the one-time API key → POST a smoke batch to /api/v1/events.
4. Run k6 run test/load/ingest.js and test/load/query.js; record p95 values in the README performance table.
5. Verify dashboards: Grafana shows ingestion rate, cache hit ratio ≥ 85% and replica lag; page-size and cursor behavior spot-checked on the 1M-row export.
6. CI builds and pushes the image, deploys staging, runs the smoke batch and query checks; rollback job redeploys the previous tag.`,
    bonusChallenges: [
      "Continuous aggregates (pg_cron or workers) instead of a fixed hourly rollup cadence",
      "Per-project ingest quotas with fair-share scheduling in the queue",
      "Anomaly alerts (z-score on event volume) delivered through the notification pattern from the booking project",
      "Columnar read path via ClickHouse behind the same query API",
    ],
    commonMistakes: [
      "Building dashboards with SELECT COUNT(*) over raw events — always read from rollups",
      "Caching without jitter, so every key expires at the same second after a deploy",
      "Trusting an OFFSET page on a table that is being written to — rows shift and you skip or duplicate events",
    ],
    referenceLinks: [
      docs("PostgreSQL COPY", "https://www.postgresql.org/docs/current/sql-copy.html", "Bulk load path used by the flush worker."),
      docs("Redis caching patterns", OFFICIAL.redisDocs, "TTL design, jitter and stampede protection."),
      docs("BullMQ guide", OFFICIAL.bullmqDocs, "Queue between ingest and flush/rollup workers."),
      docs("k6 docs", "https://grafana.com/docs/k6/latest/", "Load testing used to prove the p95 budgets."),
      ytSearch("Node.js high throughput event ingestion pipeline", "Reference architectures for batched ingest pipelines."),
    ],
  },

  {
    id: "p3-capstone",
    slug: "full-production-backend-capstone",
    title: "Full Production-Style Backend Capstone",
    description:
      "The definitive final evaluation: design, build and operate a production-style backend that integrates REST + auth, relational and document data, queues, caching, Docker, CI/CD and full observability — then defend it against a weighted senior-level rubric.",
    difficulty: "advanced",
    phaseId: "phase-3",
    original: true,
    technologies: [
      "Node.js",
      "TypeScript",
      "Express",
      "PostgreSQL",
      "Prisma",
      "MongoDB",
      "Mongoose",
      "Redis",
      "BullMQ",
      "JWT",
      "Docker",
      "GitHub Actions",
      "Prometheus",
      "k6",
    ],
    estimatedHours: 80,
    requiredKnowledge: [
      "p3m1-layered-architecture",
      "p3m1-clean-architecture",
      "p3m1-dependency-injection",
      "p3m1-config-secrets-management",
      "p3m2-advanced-rest-design",
      "p3m2-webhooks",
      "p3m2-idempotent-operations",
      "p3m3-owasp-api-security",
      "p3m3-injection-attacks",
      "p3m3-secure-file-uploads",
      "p3m3-secrets-management",
      "p3m4-redis",
      "p3m4-cache-invalidation",
      "p3m4-queue-background-jobs",
      "p3m4-horizontal-scaling",
      "p3m4-graceful-shutdown",
      "p3m5-outbox-pattern",
      "p3m5-retries-backoff",
      "p3m5-dead-letter-queues",
      "p2m4-prisma-orm",
      "p2m4-transactions-acid",
      "p2m2-input-validation",
      "p2m3-mongoose-schemas-models",
      "p2m5-rate-limiting",
      "p2m5-idempotency",
      "p2m6-refresh-tokens-rotation",
      "p2m6-role-based-access-control",
      "p2m7-unit-testing",
      "p2m7-integration-testing",
      "p2m7-e2e-testing",
      "p3m6-docker-compose",
      "p3m6-cicd-pipelines",
      "p3m7-rest-api-interviews",
      "p3m7-system-design-fundamentals",
      "p3m7-code-reviews",
    ],
    learningObjectives: [
      "Integrate every major skill from phases 1–3 into one coherent, maintainable system",
      "Choose and justify data stores per concern (relational for integrity, document for flexible events, Redis for speed)",
      "Design a resilient write path: auth → validation → transaction → outbox → queue → idempotent consumers",
      "Operate the system: Docker images, compose stack, CI/CD with rollback, health probes, graceful shutdown, metrics and alerts",
      "Defend the architecture in a written report and a code-review style walkthrough",
    ],
    userStories: [
      "As a platform user I register, authenticate, manage my resources and subscribe to webhooks for state changes.",
      "As a partner system I call versioned REST endpoints with idempotency keys and get consistent, documented errors.",
      "As an operator I deploy the whole stack with one command and watch health, latency and queue depth live.",
      "As a reviewer I can navigate a clean module structure with ADRs explaining every significant trade-off.",
      "As an interviewer-style evaluator I can stress the system (failures, load, security probes) and see it behave predictably.",
    ],
    functionalRequirements: [
      "Domain: pick one — marketplace, fleet/asset tracker, or health-records hub — and model it with a modular monolith (routes → controllers → services → repositories)",
      "REST API: versioned (/api/v1), consistent success/error envelope, cursor pagination, filtering/sorting, OpenAPI spec generated from zod schemas",
      "Authentication & authorization: register/login with argon2 hashing, JWT access (15 min) + rotating refresh tokens with reuse detection, RBAC (user/support/admin) plus object-level checks on every :id",
      "Data: PostgreSQL (Prisma) for transactional core with migrations and seed; MongoDB (Mongoose) for flexible event/audit documents; justify both choices in ADRs",
      "Queues: BullMQ with priorities, exponential backoff + jitter, retry limits and dead-letter queues; workers deployable independently",
      "Caching: Redis for hot reads with tag invalidation, TTL jitter and single-flight locks; documented cache key registry",
      "Async workflows: outbox table written in the same transaction as state changes; relay publishes events; at-least-once consumers dedupe by event id; outbound webhooks signed (HMAC) with retry + DLQ",
      "File uploads (one feature, e.g. avatars/attachments): MIME allow-list, magic-byte check, size cap, randomized storage names, served with Content-Disposition",
      "Security: helmet, CORS allow-list, body size limits, per-route rate limits, zod validation on every input, parameterized SQL only, secrets via env with .env.example, dependency audit in CI, safe logging (no tokens/PII)",
      "Reliability: /health and /ready probes, graceful shutdown (drain HTTP → finish jobs → close pools), circuit breaker on external APIs, one documented failure drill per dependency",
      "Observability: structured JSON logs with request/trace id, Prometheus /metrics (latency histogram, error rate, queue depth, cache hit ratio), sampled tracing headers, 5 golden signals on a Grafana dashboard with alerts",
      "CI/CD: GitHub Actions — lint → typecheck → unit → integration (service containers) → build image → deploy staging → smoke → promote/rollback",
      "NFR: p95 latency ≤ 200 ms on hot GETs and ≤ 500 ms on writes at 300 RPS (k6 evidence attached)",
      "NFR: throughput 800 req/s sustained on 2 API containers; queue throughput 200 jobs/s per worker",
      "NFR: 99.9% availability; RTO ≤ 15 min and RPO ≤ 5 min documented for the primary datastore",
      "NFR: retention — domain records 7 years (or domain law), audit log 1 year, raw request logs 90 days, secrets rotated every 90 days",
    ],
    milestones: [
      {
        title: "M1 — Architecture & foundation",
        tasks: [
          "ADR set: module layout, data store choices, auth model, consistency approach",
          "Skeleton: config (zod-parsed env), logger, error envelope, express app, graceful shutdown",
          "Prisma schema + migrations + seed; Mongoose models for the document store",
        ],
      },
      {
        title: "M2 — Core domain & security",
        tasks: [
          "Auth: register/login/refresh/rotate/reuse-detection + RBAC and object-level middleware",
          "Domain resources with full CRUD, zod validation, keyset pagination, OpenAPI export",
          "Rate limits, CORS, helmet, upload pipeline with safety checks",
        ],
      },
      {
        title: "M3 — Async, cache, webhooks",
        tasks: [
          "BullMQ workers (priorities, backoff, DLQ) consuming domain events",
          "Redis cache layer with tags, jitter, single-flight + invalidation tests",
          "Outbox + relay + signed outbound webhooks with retry policy",
        ],
      },
      {
        title: "M4 — Delivery & operations",
        tasks: [
          "Multi-stage Dockerfile + compose (api, worker, db, mongo, cache, prometheus, grafana)",
          "GitHub Actions pipeline: gates, image publish, staging deploy, smoke, rollback job",
          "k6 load suites vs NFR budgets; Grafana dashboards + alert rules; runbook and failure drills",
        ],
      },
      {
        title: "M5 — Review & defense",
        tasks: [
          "Self code review: address 10 findings in a REVIEW.md",
          "README with architecture diagram, setup, API examples, NFR table and trade-offs",
          "System-design walkthrough: how you would split into services at 10× traffic",
        ],
      },
    ],
    suggestedStructure: `production-capstone/
├── src/
│   ├── server.ts                # bootstrap + graceful shutdown
│   ├── app.ts                   # middleware wiring, helmet/cors/limits
│   ├── config/                  # env schema (zod), no secrets in code
│   ├── modules/
│   │   ├── auth/                # routes, controller, service, repository
│   │   ├── domain/              # your chosen core resource
│   │   ├── files/               # safe upload pipeline
│   │   └── webhooks/            # outbound signed deliveries
│   ├── async/
│   │   ├── queues/              # definitions, producers, backoff policy
│   │   ├── workers/             # processors (idempotent)
│   │   ├── outbox/              # writer + relay
│   │   └── dlq/                 # inspect + replay
│   ├── cache/                   # redis client, tag registry, single-flight
│   ├── db/
│   │   ├── postgres/            # prisma, migrations, seed
│   │   └── mongo/               # mongoose models (events/audit)
│   ├── observability/           # logger, metrics, tracing, probes
│   └── shared/                  # errors, pagination, zod helpers
├── test/
│   ├── unit/  integration/  e2e/  load/
├── ops/                         # prometheus.yml, grafana/, alerts, runbook
├── docs/adr/                    # ADR-0001 … 0006, REVIEW.md
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md`,
    dataModel: `### Architecture narrative
A **modular monolith** with the seams of a service-oriented design: each module owns its tables, exposes a
service interface and never reaches into another module's repository. Relational data (users, resources,
orders/state machines) lives in PostgreSQL where constraints and transactions carry the integrity guarantees;
flexible, schema-evolving data (event documents, audit trail, webhook delivery attempts) lives in MongoDB.
Redis provides speed layers (cache, rate limits, queue backend). The **write path** is always: authenticate →
authorize → validate → transaction { state change + outbox row } → relay → queue → idempotent consumer →
side effects. This is the single most important pattern in the capstone.

### Schema — PostgreSQL (transactional core)
\`\`\`sql
users(id uuid PK, email citext UNIQUE, password_hash, role user_role, created_at)
refresh_tokens(id uuid PK, user_id FK, token_hash, expires_at, revoked_at, replaced_by)
resources(id uuid PK, owner_id FK->users, title, state resource_state,
          version int, created_at, updated_at)
          -- optimistic locking: UPDATE ... WHERE version = $n
outbox(id uuid PK, aggregate_type, aggregate_id, event_type, payload jsonb,
       created_at, published_at)
processed_events(event_id text PK, consumer text, processed_at)
audit_log(id uuid PK, actor_id, action, target, metadata jsonb, created_at)
\`\`\`

### Schema — MongoDB (flexible documents)
\`\`\`js
// collections: event_docs, webhook_attempts
{ _id, eventId, type, source, payload, receivedAt, retries, lastError }
\`\`\`

### Redis & queues
cache:res:{id} (TTL 60s ± 20% jitter, tag "res") · cache:res:list:{hash} · rl:{route}:{ip} ·
queues: critical, default, webhook-delivery with attempts: 5, backoff exponential+jitter, DLQ after exhaustion.

### ASCII overview
\`\`\`text
 client ─▶ API (auth · validate · rate limit) ─▶ services ─▶ PostgreSQL (+ outbox)
                                              │                    │
                                              ▼                    ▼ relay
                                        Redis cache           BullMQ workers
                                                             (idempotent) ─▶ MongoDB event_docs
                                                             webhook-delivery ─▶ partner endpoints (HMAC)
\`\`\``,
    endpoints: [
      { method: "POST", path: "/api/v1/auth/register", description: "Create account", auth: "public" },
      { method: "POST", path: "/api/v1/auth/login", description: "Access + refresh token pair", auth: "public" },
      { method: "POST", path: "/api/v1/auth/refresh", description: "Rotate refresh token (reuse revokes family)", auth: "public" },
      { method: "GET", path: "/api/v1/me", description: "Current user profile", auth: "user" },
      { method: "GET", path: "/api/v1/resources", description: "List with cursor pagination, filters, sort", auth: "user" },
      { method: "POST", path: "/api/v1/resources", description: "Create (Idempotency-Key supported)", auth: "user" },
      { method: "PATCH", path: "/api/v1/resources/:id", description: "Partial update with optimistic version", auth: "user" },
      { method: "DELETE", path: "/api/v1/resources/:id", description: "Soft delete, audited", auth: "user" },
      { method: "POST", path: "/api/v1/files", description: "Upload attachment (validated, size-capped)", auth: "user" },
      { method: "POST", path: "/api/v1/webhooks/subscriptions", description: "Subscribe to events (target URL + secret)", auth: "user" },
      { method: "GET", path: "/api/v1/admin/audit", description: "Audit trail (cursor paged)", auth: "admin" },
      { method: "GET", path: "/api/v1/admin/dlq", description: "Inspect/replay dead-letter jobs", auth: "admin" },
      { method: "GET", path: "/health", description: "Liveness; /ready checks db, mongo, redis", auth: "public" },
      { method: "GET", path: "/metrics", description: "Prometheus exposition (ops network)", auth: "public" },
    ],
    acceptanceCriteria: [
      "Grading dimensions — score each 0–5 (0 = absent, 3 = competent, 5 = senior-level): architecture & modularity; data modelling; API design; security; reliability & failure handling; performance engineering; testing; delivery & operations; documentation & communication.",
      "20% — Architecture & modularity: layered modular monolith with enforced boundaries (no cross-module repository access), DI-friendly services, ADRs in docs/adr explaining at least six decisions including rejected alternatives.",
      "15% — Data modelling: Postgres schema with real constraints/indexes and migration history; Mongo justified per collection; seed script; no SELECT-then-UPDATE races (demonstrated by a concurrency test).",
      "15% — API design: versioned REST, consistent envelope, documented error codes, cursor pagination everywhere, OpenAPI generated and lint-clean, idempotency on all non-GET writes that create resources.",
      "15% — Security: full authn/authz matrix implemented and tested (including object-level BOLA cases); secrets only via env; OWASP API top-10 mitigations evidenced by tests; rate limits; upload safety; no secrets/PII in logs.",
      "10% — Reliability: retries with backoff, DLQ with replay, graceful shutdown verified under load, circuit breaker on the external dependency, written failure-drill notes (kill Redis, kill worker, duplicate webhook).",
      "10% — Performance: k6 reports showing p95 ≤ 200 ms hot GETs and ≤ 500 ms writes at 300 RPS; cache hit ratio ≥ 80%; no N+1 queries (verified with a query counter).",
      "10% — Testing: unit (domain logic), integration (real Postgres/Mongo/Redis in CI service containers), E2E (auth → CRUD → async effect), load; overall line/branch coverage is not the goal — critical-path coverage is: state machine, authz, outbox.",
      "5% — Delivery & operations: multi-stage non-root image, compose boots everything, CI gates and deploys staging with smoke + rollback, runbook with dashboards and alert thresholds.",
      "5% — Documentation & communication: README (setup in ≤ 10 minutes), architecture diagram, NFR table with measured numbers, REVIEW.md with 10 real findings, and the 10× scale-out plan.",
      "Pass threshold: ≥ 70% weighted total AND every grading dimension ≥ 2. Distinction: ≥ 88% with all dimensions ≥ 4.",
    ],
    tests: [
      "Unit: domain state machine, permission matrix, backoff/jitter, cursor signing, cache key/tag registry",
      "Integration: migration up/down, repository queries against real Postgres, Mongoose round-trips, outbox row written with the state change, BullMQ worker consumes and dedupes",
      "E2E: register → login → create resource → async job completes → webhook delivery attempt recorded in Mongo with valid HMAC signature",
      "Load: k6 suites for hot GET (p95 ≤ 200 ms) and write path (p95 ≤ 500 ms, error rate < 0.5%); queue soak at 200 jobs/s",
      "Security: SQL injection probes on every filter param (parameterization proof); oversized/typed-confused uploads rejected; refresh-token reuse revokes the family; admin routes 403 for users; rate limit returns 429 with Retry-After",
      "Authz: BOLA suite — user A vs user B resources across GET/PATCH/DELETE; support role sees limited fields (field-level redaction)",
      "Failure drills: Redis down → cache bypass + rate limits fall back safely; worker SIGTERM mid-job → job requeued, no duplicate side effect; duplicate webhook from partner → idempotent no-op; DB primary unavailable → /ready fails and traffic drains with 503 + Retry-After",
    ],
    hints: [
      "Security checklist — env-only secrets (.env gitignored, .env.example committed), zod at every boundary, parameterized SQL through Prisma, helmet + CORS allow-list, per-route and per-user rate limits, HMAC-signed webhooks with timestamp tolerance, upload MIME + magic-byte + size checks, dependency audit (npm audit) and secret scanning in CI, structured logs that never include tokens, passwords or card data.",
      "Start with the ADRs — graders reward justified trade-offs more than exotic technology choices.",
      "The outbox is the spine of the capstone: write it in the same transaction as the state change, publish after commit, dedupe on consume.",
      "Keep the compose file runnable offline: every test and smoke script must work with docker compose up -d.",
      "Time-box polish: a smaller system that is fully tested, secured and operated beats a sprawling half-finished one.",
    ],
    optionalSolution: `## End-to-end walkthrough (reference shape, not a copy-paste solution)

\`\`\`text
 client ─▶ API (auth · validate · rate limit) ─▶ services ─▶ PostgreSQL (+ outbox)
                                              │                    │
                                              ▼                    ▼ relay
                                        Redis cache           BullMQ workers
                                                             (idempotent) ─▶ MongoDB event_docs
                                                             webhook-delivery ─▶ partner endpoints (HMAC)
\`\`\`

Recommended build order: config/logger/errors → auth + RBAC → domain CRUD with pagination →
outbox + queue + workers → cache layer → uploads + webhooks → metrics/dashboards → Docker + CI →
load tests → REVIEW.md + README.

## Multi-stage Dockerfile

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
\`\`\`

## docker-compose.yml (snippet)

\`\`\`yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/capstone
      MONGO_URL: mongodb://mongo:27017/capstone
      REDIS_URL: redis://cache:6379
      JWT_SECRET: \${JWT_SECRET}
    depends_on: [db, mongo, cache]
  worker:
    build: .
    command: ["node", "dist/async/workers/main.js"]
    environment:
      DATABASE_URL: postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@db:5432/capstone
      MONGO_URL: mongodb://mongo:27017/capstone
      REDIS_URL: redis://cache:6379
    deploy: { replicas: 2 }
    stop_grace_period: 30s
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: \${POSTGRES_PASSWORD} }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  mongo:
    image: mongo:7
    volumes: ["mongodata:/data/db"]
  cache:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
  prometheus:
    image: prom/prometheus:v2.54.0
    volumes: ["./ops/prometheus.yml:/etc/prometheus/prometheus.yml:ro"]
  grafana:
    image: grafana/grafana:11.2.0
    ports: ["3001:3000"]
volumes: { pgdata: {}, mongodata: {} }
\`\`\`

## Deployment steps
1. cp .env.example .env; generate JWT_SECRET (32+ bytes), DATABASE_URL, MONGO_URL, REDIS_URL; mirror into CI secrets.
2. docker compose up -d db mongo cache; wait for healthy, then npx prisma migrate deploy and npm run seed.
3. docker compose up -d api worker prometheus grafana; curl /health and /ready must both return ok.
4. Smoke: register → login → create resource twice with the same Idempotency-Key (same id back) → wait for the async effect → confirm the webhook attempt document in Mongo with a valid HMAC signature.
5. Load: k6 run test/load/hot-get.js and test/load/write.js; paste the p95 table into README (budget: 200 ms / 500 ms).
6. Failure drills: docker compose stop cache (reads still work), docker compose kill worker mid-job (job requeues, no duplicate side effect), replay a DLQ entry.
7. Release: tag → CI gates (lint, typecheck, unit, integration, image) → deploy staging → smoke → promote; rollback job redeploys the previous image tag and runs migrate rollback if needed.`,
    bonusChallenges: [
      "Extract one module into a standalone service and document the contract + observability changes",
      "Add OpenTelemetry tracing end-to-end (gateway → worker) with a sampled export",
      "Blue/green deploy script with automatic rollback on smoke failure",
      "Chaos drill suite: automated container kills proving the runbook's claims",
    ],
    commonMistakes: [
      "Writing business logic inside route handlers — services and repositories must be testable without HTTP",
      "Committing the access token to long-lived jobs; pass the user id instead and re-authorize in the worker",
      "Treating /health as a database check — liveness must stay cheap and dependency-free",
      "Calling it 'eventually consistent' with no evidence: show the lag metric and the dedupe test",
    ],
    referenceLinks: [
      docs("Node.js best practices", OFFICIAL.nodeBestPractices, "Production conventions: project structure, error handling, graceful shutdown."),
      docs("OWASP API Security Top 10", OFFICIAL.owaspApi, "The security baseline this capstone is graded against."),
      docs("The Twelve-Factor App", OFFICIAL.twelveFactor, "Config, logs and stateless process rules for the deployment section."),
      docs("BullMQ guide", OFFICIAL.bullmqDocs, "Queues, retries, DLQs and repeatable jobs."),
      docs("Dockerfile best practices", OFFICIAL.dockerDocs, "Multi-stage builds, non-root users, healthchecks."),
      docs("GitHub Actions", OFFICIAL.githubActionsDocs, "CI/CD pipeline definition with service containers."),
      docs("k6 load testing", "https://grafana.com/docs/k6/latest/", "Proving the NFR latency and throughput budgets."),
      ytSearch("Node.js production backend capstone Express Postgres Redis Docker", "End-to-end reference builds to compare your architecture against."),
    ],
  },
];
