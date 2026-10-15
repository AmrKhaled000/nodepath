import type { Phase } from "@/types";

export const phases: Phase[] = [
  {
    id: "phase-1",
    order: 1,
    title: "Foundations",
    subtitle: "Absolute beginner → comfortable with JavaScript, tooling and Node.js core",
    description:
      "Phase 1 builds the ground floor: how the web actually works, modern JavaScript, professional tooling (Node.js, npm, Git, VS Code) and the Node.js runtime itself — modules, files, streams, events, the event loop and a first HTTP server. You finish this phase able to write small but real command-line tools and talk to HTTP APIs.",
    outcomes: [
      "Explain clients, servers, DNS, HTTP/HTTPS, methods, status codes, headers and JSON",
      "Write modern JavaScript confidently: functions, closures, arrays/objects, promises, async/await, modules",
      "Set up a professional environment: Node.js LTS, VS Code, npm, package.json, env vars, Git and GitHub",
      "Use Node.js core APIs: fs, path, process, Buffer, streams, events and the http module",
      "Understand the event loop and asynchronous programming deeply enough to avoid blocking it",
      "Build and ship six small projects, including a CLI tool and a basic HTTP server",
    ],
    accent: "#38bdf8",
    estimatedHoursRange: "60–100 hours",
  },
  {
    id: "phase-2",
    order: 2,
    title: "Backend Developer",
    subtitle: "Comfortable with Node.js → building production-style REST APIs",
    description:
      "Phase 2 turns Node.js skills into real backend engineering. You go deep on advanced JavaScript and the runtime, build structured Express applications, model data in MongoDB and PostgreSQL, design and document REST APIs, implement secure authentication, and prove correctness with automated tests.",
    outcomes: [
      "Master promises, streams, backpressure, error propagation, child processes and worker threads",
      "Structure Express apps with routers, controllers, services, middleware and centralized error handling",
      "Model data with MongoDB + Mongoose and PostgreSQL + Prisma, including indexes, relations and transactions",
      "Design, validate, version, document and secure REST APIs (OpenAPI, CORS, rate limiting, pagination)",
      "Implement authentication and authorization: password hashing, sessions, JWT, refresh tokens, RBAC",
      "Write unit, integration and end-to-end tests, and enforce code quality with ESLint, Prettier and CI",
    ],
    accent: "#a78bfa",
    estimatedHoursRange: "120–180 hours",
  },
  {
    id: "phase-3",
    order: 3,
    title: "Professional Node.js Engineer",
    subtitle: "Building APIs → owning architecture, security, scale, delivery and operations",
    description:
      "Phase 3 is about production responsibility. You design maintainable architectures, harden APIs against real attacks, profile and scale Node.js services, add messaging and background processing, containerize and deploy with CI/CD, and practice the professional skills — reviews, docs, system design and interviews — that get and keep senior backend roles.",
    outcomes: [
      "Choose and justify architectures: modular monoliths, layered/clean design, DI, SOLID, domain modeling",
      "Design advanced APIs: GraphQL, WebSockets, SSE, webhooks, gateways, versioning and deprecation",
      "Secure applications against OWASP API risks: injection, SSRF, broken access control, secrets leakage",
      "Profile CPU/memory, eliminate leaks and event-loop blocking, cache with Redis, scale with clusters and queues",
      "Use queues, brokers, retries, DLQs and the outbox pattern to build resilient distributed flows",
      "Ship with Docker, CI/CD, reverse proxies, health checks, graceful shutdown, migrations and rollbacks",
      "Communicate like a professional: code review, documentation, system design and interview preparation",
    ],
    accent: "#f472b6",
    estimatedHoursRange: "150–250 hours",
  },
];
