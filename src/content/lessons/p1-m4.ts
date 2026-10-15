import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p1-m4",
  slug: "nodejs-core-fundamentals",
  title: "Node.js Core Fundamentals",
  description:
    "What Node.js actually is and how it works under the hood: V8, libuv, the event loop, module systems, process, environment variables, arguments, fs, path, buffers, streams, events, the HTTP module and debugging.",
  phaseId: "phase-1",
  order: 4,
};

const shared = {
  phaseId: "phase-1",
  moduleId: "p1-m4",
  difficulty: "beginner",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p1m4-what-is-nodejs",
    slug: "what-is-nodejs",
    title: "What Is Node.js?",
    description:
      "Definition, a short history, the npm ecosystem, and what the phrase \"JavaScript runtime\" actually means in practice.",
    order: 1,
    estimatedMinutes: 14,
    tags: ["nodejs", "runtime", "javascript", "npm", "history"],
    prerequisites: ["p1m1-clients-servers", "p1m2-variables-data-types"],
    relatedTopics: ["p1m4-node-architecture", "p1m4-node-vs-browser-js", "p1m3-npm-basics"],
    learningObjectives: [
      "Define Node.js precisely: a JavaScript runtime built on V8 with server-side APIs",
      "Summarise the key milestones of Node.js history (2009 launch, io.js merge, LTS model)",
      "Explain the relationship between Node.js, npm and the package registry",
      "Run a script and recognise the node executable, the script path and the output",
    ],
    simpleExplanation:
      "Node.js is a program that runs JavaScript **outside the browser**. It takes Google's V8 engine (the same one inside Chrome), adds a big standard library for things browsers do not have — reading files, opening network ports, working with the operating system — and packages it all as a command called `node`. Because npm ships with Node.js, you can also download and reuse millions of open-source packages with one command.",
    detailedContent: `
When people say “Node.js is a JavaScript runtime”, they mean three concrete things:

1. **It executes JavaScript** using **V8**, the same engine Chrome uses. Your language knowledge transfers 1:1 — variables, functions, classes, async/await all behave the same.
2. **It replaces browser APIs with server APIs.** There is no \`document\`, no \`window\`, no DOM. Instead you get \`fs\` (files), \`net\`/\`http\` (sockets), \`process\` (the OS process), \`os\` (machine info) and dozens more built-in modules.
3. **It is a CLI program.** \`node server.js\` starts V8, loads your file, runs it, and keeps the process alive as long as there is pending work (an open server, a timer, an in-flight request).

**A very short history:**

| Year | Milestone |
| --- | --- |
| 2009 | Ryan Dahl presents the first Node.js at EuroJS; v0.1 arrives |
| 2011 | npm launches — the registry that later defined the JS ecosystem |
| 2014 | Fork controversy → io.js is created with faster release cadence |
| 2015 | Node.js and io.js merge back; the Node.js Foundation forms |
| 2018 | Foundation joins the OpenJS Foundation |
| 2016+ | **LTS** (Long-Term Support) model: even-numbered majors get 30 months of support |

**npm** (Node Package Manager) is installed alongside Node.js. It has two jobs: a **client** (\`npm install\`) and a **public registry** (npmjs.com) holding over two million packages. “Node developer” is largely “JavaScript developer who knows the Node standard library plus how to use npm well”.

Node is single-threaded for your JavaScript code (one call stack), which sounds limiting — but I/O is delegated to the OS and to a small thread pool, so one process can handle thousands of concurrent connections. That design is the heart of everything that follows in this module.
    `,
    howItWorks: `
When you run \`node app.js\`:

1. The \`node\` executable starts, initialises V8 and libuv, and builds the \`process\` global.
2. Node resolves \`app.js\` relative to your current working directory, compiles it, and executes it.
3. Your top-level code runs synchronously from the first line to the last.
4. When the script ends, Node checks for remaining work — timers, open servers, pending I/O. If any exists, the **event loop** keeps running. If none exists, the process exits with code 0.
    `,
    codeExamples: [
      {
        title: "Hello from Node.js (ESM style)",
        language: "js",
        code: `// app.mjs — or set "type": "module" in package.json and name it app.js
const name = process.argv[2] ?? "world";
console.log(\`Hello, \${name}!\`);
console.log("Running on Node", process.version);`,
        description:
          "Save as app.mjs and run with `node app.mjs NodePath`. `process.version` is the Node.js version string, e.g. v22.9.0. All ESM examples in this module use `import`; CJS examples use `require` and say so.",
      },
      {
        title: "The node CLI you will use daily",
        language: "bash",
        code: `node --version          # v22.9.0 (check what you have)
node app.js             # run a script
node --watch app.js     # restart automatically on file changes (Node 18+)
node -e "console.log(1 + 1)"   # run a one-liner
npm --version           # npm client that ships with Node.js`,
        description:
          "The four commands every Node developer types a hundred times a day. --watch is a built-in alternative to third-party watchers for simple projects.",
      },
    ],
    commonMistakes: [
      "Calling Node.js a framework or a language — it is a runtime; Express, Nest and Fastify are frameworks that run on it.",
      "Assuming browser JavaScript knowledge is useless: the language is identical, only the surrounding APIs differ.",
      "Running scripts from the wrong directory and getting MODULE_NOT_FOUND — Node resolves relative paths from process.cwd(), not from wherever the file lives.",
    ],
    bestPractices: [
      "Use an even-numbered LTS release (20.x, 22.x) for anything real; odd majors are current/experimental.",
      "Pin your Node version for a team with the engines field in package.json or an .nvmrc file.",
      "Learn the built-in modules before reaching for npm — many dependencies exist only to polyfill things Node already has.",
    ],
    realWorldUseCases: [
      "REST APIs and GraphQL servers — the most common production use of Node.js.",
      "Command-line tools (CLI): npm, ESLint, Prettier and VS Code's tooling are all Node.js programs.",
      "Build tooling and dev servers: Vite, Webpack and Create React App run Node.js under the hood.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — Introduction to Node.js",
        url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
        description: "Official primer: what Node.js is, its history and core concepts.",
      },
      videos: [
        {
          query: "what is Node.js and why use it",
          description: "Beginner-friendly overviews of Node.js as a runtime.",
          estimatedDuration: "8–15 min",
        },
      ],
      article: {
        title: "Node.js — About",
        url: "https://nodejs.org/en/about",
        provider: "nodejs.org",
        description: "Project mission, governance and the LTS release schedule.",
        estimatedDuration: "8 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m4-what-is-node",
        title: "Prove it is just JavaScript",
        prompt:
          "Create hello.mjs that prints the Node version, your OS platform (process.platform) and the value of 2 ** 10. Then run it with node. Write one sentence explaining which of those three would also work in a browser console and which would not.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["process is a Node.js global — browsers do not have it.", "Math and exponentiation are pure language features."],
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-node-architecture",
    slug: "node-architecture",
    title: "Node.js Architecture",
    description:
      "The layered stack: your code, JavaScript APIs, the C++ binding layer, V8, libuv and the operating system.",
    order: 2,
    estimatedMinutes: 16,
    tags: ["architecture", "v8", "libuv", "internals"],
    prerequisites: ["p1m4-what-is-nodejs"],
    relatedTopics: ["p1m4-v8-engine", "p1m4-libuv", "p1m4-event-loop-node"],
    learningObjectives: [
      "Draw the layered architecture of a Node.js process from memory",
      "Explain the role of each layer: JS APIs, bindings, V8, libuv, OS",
      "Describe why some work runs in JavaScript and some in C++",
      "Use process.versions to see which underlying libraries your Node build uses",
    ],
    simpleExplanation:
      "Node.js is an onion. The outermost layer is your JavaScript. Under it sit Node's standard modules (still JavaScript). Under those sits a thin C++ **binding** layer that talks to two heavy engines: **V8** (which runs your JS) and **libuv** (which runs the event loop and all asynchronous I/O). The bottom layer is the operating system kernel — sockets, disk, processes.",
    detailedContent: `
Think of a Node.js process as five layers, each with one job:

    ┌──────────────────────────────────────────────┐
    │            Your JavaScript code              │
    │        app.js · your handlers · logic        │
    ├──────────────────────────────────────────────┤
    │   Node.js standard APIs (written in JS)      │
    │    fs · http · path · events · stream · …    │
    ├──────────────────────────────────────────────┤
    │      Binding layer (C++ / internal JS)       │
    │   converts JS calls into engine/OS calls     │
    ├───────────────────┬──────────────────────────┤
    │        V8         │          libuv           │
    │  JS engine:       │  event loop, thread      │
    │  parse/JIT/GC     │  pool, cross-platform    │
    │                   │  async I/O               │
    ├───────────────────┴──────────────────────────┤
    │   OS kernel: network stack, filesystem,      │
    │   processes, DNS resolver, timers            │
    └──────────────────────────────────────────────┘

Key points:

- **Your code never touches the OS directly.** \`fs.readFile\` is JavaScript that eventually calls a binding, which asks libuv, which asks the kernel.
- **V8 only runs JavaScript.** It does not know what a file or a socket is. All of that lives in libuv and the bindings.
- **libuv owns asynchrony.** It provides the event loop, a thread pool (default 4 threads) for blocking operations like file reads, and native bindings for networking that use the OS's scalable notification mechanism (epoll on Linux, kqueue on macOS, IOCP on Windows).
- **process.versions** exposes the exact versions of everything compiled in: v8, uv, zlib, OpenSSL and more — invaluable when debugging “works on my machine” issues.
    `,
    howItWorks: `
Take \`fs.readFile("a.txt", cb)\` and follow it down the layers:

1. **Your code** calls the function from the \`fs\` module.
2. **fs (JS)** validates arguments and delegates to the binding layer.
3. **Binding** hands the request to **libuv**, which queues it on its **thread pool** so the main thread is free immediately.
4. A pool thread asks the **OS** to read the file; when bytes arrive, libuv marks the request complete and queues your callback on the main thread's event loop.
5. The event loop runs your callback with the data — still on the main JavaScript thread.

That hopscotch is why Node can “do 10,000 things at once” with a single JavaScript thread: the waiting happens elsewhere.
    `,
    codeExamples: [
      {
        title: "Inspect your build's underlying libraries",
        language: "js",
        code: `// CJS example (require)
const { versions } = require("node:process");

console.log("Node:", process.version);
console.log("V8 (JavaScript engine):", versions.v8);
console.log("libuv (event loop + I/O):", versions.uv);
console.log("OpenSSL:", versions.openssl);
console.log("Platform:", process.platform, process.arch);`,
        description:
          "Every field here is a component of the architecture diagram. Two machines reporting different uv or v8 versions may behave differently with the same code.",
      },
    ],
    commonMistakes: [
      "Assuming Node.js is multi-threaded like Java or C# — your JavaScript always runs on one main thread unless you spawn workers or child processes.",
      "Blaming V8 for slow file reads — file I/O is libuv + OS; V8 only runs the callback code.",
      "Memorising the diagram without knowing which layer to debug: measure whether the time is in your JS, in I/O, or in the OS.",
    ],
    bestPractices: [
      "When performance matters, ask which layer is the bottleneck before optimising.",
      "Keep process.versions (and Node version) in bug reports — they identify the exact engine stack.",
      "Prefer built-in async modules over synchronous calls so the main thread stays free for the event loop.",
    ],
    realWorldUseCases: [
      "Incident reviews: knowing that fs runs on the thread pool explains why 100 concurrent large reads starve everything else.",
      "Upgrading Node majors: a new V8 can change JIT behaviour and thus CPU-bound performance with zero code changes.",
    ],
    resources: [
      docs("Node.js — How Node.js works", "https://nodejs.org/en/learn/getting-started/how-nodejs-works", "Official tour of the single-threaded event loop and blocking model.", "en", "10 min"),
      docs("Node.js API — process.versions", "https://nodejs.org/api/process.html#processversions", "Reference for every version string Node exposes.", "en", "5 min"),
      ytSearch("Node.js architecture V8 libuv explained", "Layered architecture walkthroughs with diagrams.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-architecture-layers",
        title: "Label the layers",
        prompt:
          "Without looking, redraw the five-layer architecture diagram from memory. Then, for each of these calls, write which layers it touches: crypto.pbkdf2(), http.createServer().listen(3000), and process.exit(). Finally run the process.versions snippet and record your V8 and libuv versions.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["crypto.pbkdf2 is CPU-heavy JS-free work — it goes to the thread pool via libuv.", "process.exit talks straight to the OS to end the process."],
      },
    ],
    projectIds: [],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-node-vs-browser-js",
    slug: "node-vs-browser-javascript",
    title: "Node.js vs Browser JavaScript",
    description:
      "No DOM, new globals like process and Buffer, and how to write isomorphic code that safely runs in both environments.",
    order: 3,
    estimatedMinutes: 15,
    tags: ["browser", "node", "globals", "isomorphic"],
    prerequisites: ["p1m4-what-is-nodejs", "p1m4-node-architecture"],
    relatedTopics: ["p1m4-built-in-modules", "p1m4-process-object"],
    learningObjectives: [
      "List globals that exist in Node.js but not in browsers (and vice versa)",
      "Explain why document, window and localStorage are missing in Node.js",
      "Write isomorphic utility code that avoids environment-specific APIs",
      "Detect the current environment safely",
    ],
    simpleExplanation:
      "The JavaScript **language** is the same in Node.js and the browser, but the **environment** around it is completely different. Browsers give you a DOM, `window` and storage; Node.js gives you `process`, `Buffer`, and built-in modules like `fs` and `http`. Code that touches only pure language features (arrays, objects, functions) can run anywhere — everything else needs care.",
    detailedContent: `
Side-by-side comparison:

| Feature | Browser | Node.js |
| --- | --- | --- |
| Global object | \`window\` (plus \`globalThis\`) | \`globalThis\` (plus \`global\`) |
| DOM / HTML | \`document\`, \`window\` | none |
| Network request | \`fetch\`, \`XMLHttpRequest\` | \`fetch\` (18+) and \`http\`/\`https\` modules |
| File system | none (sandboxed) | \`fs\`, \`path\`, streams |
| Process info | none | \`process\` (pid, env, argv, cwd) |
| Binary type | \`ArrayBuffer\`, \`Uint8Array\` | those **plus** \`Buffer\` |
| Timers | \`setTimeout\`, \`setInterval\` | same, plus \`setImmediate\`, \`nextTick\` |
| Module system | bundler-defined | CJS \`require\` or native ESM \`import\` |
| Secrets | impossible (all code ships) | environment variables are safe server-side |

**Isomorphic (shared) code** rules of thumb:

- Pure functions, constants, validation logic, date maths — share freely.
- Anything importing \`node:fs\`, \`window\` or \`document\` — keep environment-specific.
- Detect environments with feature checks, not user-agent strings: \`typeof window !== "undefined"\` or \`typeof process !== "undefined" && !!process.versions?.node\`.

Security note: **never** put secrets in browser code. Server-side Node.js is the only place environment variables stay private — a point we revisit in the env-vars lesson.
    `,
    howItWorks: `
When a browser runs \`import { formatPrice } from "./money.js"\`, a bundler (or native ESM) serves that file from your site's origin inside a sandboxed tab with no disk access. When Node.js runs the same import, it reads the file from disk with libuv, parses it with V8, and evaluates it with full machine privileges. Same syntax, wildly different trust boundaries — which is exactly why validation must live on the server.
    `,
    codeExamples: [
      {
        title: "Environment detection and guarded APIs",
        language: "js",
        code: `// Works in both environments
export function formatPrice(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// Node-only branch
export async function readConfig(file) {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("readConfig only runs in Node.js");
  }
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(file, "utf8"));
}

console.log(formatPrice(1299)); // $12.99 — identical in browser and Node`,
        description:
          "The dynamic import('node:fs/promises') inside a runtime check keeps the pure helper safe for browsers while the Node-only function stays tree-shakeable for frontend bundles.",
      },
    ],
    commonMistakes: [
      "Importing node:fs in a file that a frontend bundler also consumes — the build fails or ships a huge polyfill.",
      "Relying on window.setTimeout differences that no longer exist — both environments share the timer names; the subtleties are nextTick and setImmediate.",
      "Checking navigator.userAgent to detect Node.js — feature detection (process.versions?.node) is reliable.",
    ],
    bestPractices: [
      "Keep shared packages 100% pure JavaScript with zero Node/browser imports.",
      "Put Node-only code behind dynamic import() or separate entry files so bundlers can exclude it.",
      "Remember fetch exists in Node 18+, but the http module gives you lower-level control (timeouts, agents, keep-alive).",
    ],
    realWorldUseCases: [
      "Validation schemas (e.g. Zod) run in the React form and again in the Node.js API from the same source file.",
      "A design-system package ships pure components to the browser while its server-side rendering entry uses Node APIs.",
    ],
    resources: [
      docs("Node.js — Node.js, the difference with the browser", "https://nodejs.org/en/learn/getting-started/nodejs-browser-difference", "Official comparison of browser and Node.js environments.", "en", "8 min"),
      docs("MDN — globalThis", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis", "The one global object shared by both environments.", "en", "5 min"),
      ytSearch("difference between Node.js and browser JavaScript", "Videos contrasting globals, modules and APIs.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-both-worlds",
        title: "One file, two worlds",
        prompt:
          "Write utils.js exporting slugify(text) (pure) and loadLog() (reads last 10 lines of app.log via node:fs). Import slugify in an HTML page via a script type=module and confirm it works; import loadLog in a Node script and confirm it works; then try importing loadLog in the browser and record the exact error.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Browsers refuse to resolve the node:fs specifier — that error is the learning outcome."],
        solution: `// utils.js
export function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function loadLog(path = "app.log") {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("loadLog is Node.js only");
  }
  const { readFile } = await import("node:fs/promises");
  const lines = (await readFile(path, "utf8")).split("\\n").filter(Boolean);
  return lines.slice(-10);
}

// node test.mjs
// const { slugify, loadLog } = await import("./utils.js");
// console.log(slugify("Hello World!")); // hello-world
// console.log(await loadLog());`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-calculator", "p1-weather-client"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-v8-engine",
    slug: "v8-engine",
    title: "The V8 Engine",
    description:
      "How V8 turns your JavaScript into machine code: parsing, interpretation, JIT compilation, hidden classes and the garbage-collected heap.",
    order: 4,
    estimatedMinutes: 18,
    tags: ["v8", "performance", "jit", "memory"],
    prerequisites: ["p1m4-node-architecture"],
    relatedTopics: ["p1m4-libuv", "p1m4-event-loop-node"],
    learningObjectives: [
      "Describe V8's pipeline: parse → bytecode (Ignition) → optimized machine code (TurboFan)",
      "Explain hidden classes and why consistent object shapes help performance",
      "Sketch V8's memory spaces (young/old generation, large object space) and how GC frees them",
      "Recognise common JIT de-optimisation traps in everyday code",
    ],
    simpleExplanation:
      "V8 is the JavaScript engine from Chrome that Node.js embeds. It first parses your code into an abstract syntax tree, compiles it quickly into bytecode, and then — as functions get called a lot — recompiles the hot parts into fast native machine code just in time. Memory lives in a garbage-collected heap: you allocate objects freely, and V8 frees them automatically when nothing references them.",
    detailedContent: `
**The compilation pipeline**

1. **Parsing** — source text → tokens → AST. Syntax errors die here.
2. **Ignition (interpreter)** — AST → bytecode, executed immediately. Startup stays fast.
3. **TurboFan (JIT compiler)** — after a function runs many times (“hot”), V8 profiles types and compiles specialised machine code. If assumptions break (a variable suddenly changes type), it **deoptimises** back to bytecode and re-profiles.

**Hidden classes** (hidden shapes): V8 tracks every object's property layout in an internal map. Two objects created the same way share a hidden class, so property access is a fast offset lookup. Objects that constantly gain, lose or reorder properties create churn:

    // Fast: same shape every time
    function User(name) { this.name = name; this.email = null; }

    // Slow: shape keeps changing
    function User(name) { this.name = name; }          // shape A
    // later: u.email = ...;                           // shape B
    // later: u.nickname = ...;                        // shape C

**Memory (heap) overview**

| Space | Holds |
| --- | --- |
| Young generation (semispace) | freshly allocated short-lived objects; collected very often (scavenge) |
| Old generation | survivors of several scavenges; collected less often (mark–compact) |
| Large object space | objects too big for normal spaces (moved out to avoid copying) |
| Code space / map space | compiled machine code and hidden classes |

When total heap usage crosses a threshold, V8 runs a **major GC pause**. Node exposes this: \`process.memoryUsage()\` and the \`--expose-gc\` flag (for measurement only).
    `,
    howItWorks: `
A hot loop that always sees the same types lets TurboFan emit tight machine code; a loop that alternates \`number\` and \`string\` forces deoptimisations on every switch. Node.js never exposes V8's internals directly, but you can watch its behaviour with \`node --trace-opt --trace-deopt file.js\` (verbose, for the curious) or by measuring wall-clock time before and after a refactor. The lesson for backend code: predictable data shapes and avoiding megamorphic property access in hot paths pay off at scale — though most real APIs are bottlenecked on I/O long before micro-optimising objects matters.
    `,
    codeExamples: [
      {
        title: "See V8 working and measure the heap",
        language: "js",
        code: `// CJS example
function sumLoop(n) {
  let total = 0;
  for (let i = 0; i < n; i++) total += i;
  return total;
}

// Warm up: this makes sumLoop "hot" so TurboFan can optimise it
for (let i = 0; i < 10000; i++) sumLoop(100);

console.time("sum");
sumLoop(1e8);
console.timeEnd("sum"); // e.g. sum: 18ms

console.log("heapUsed MB:", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1));`,
        description:
          "Run with `node --trace-opt --trace-deopt app.js` to watch Ignition and TurboFan decisions. memoryUsage() shows how much of the V8 heap your process currently holds.",
      },
    ],
    commonMistakes: [
      "Prematurely rewriting loops for 'V8 speed' when the real bottleneck is a database query.",
      "Creating objects with wildly different shapes inside hot loops and expecting JIT magic.",
      "Confusing the V8 heap with system memory: RSS (resident set) is always larger than heapUsed.",
    ],
    bestPractices: [
      "Initialise object properties in constructors so shapes stay stable.",
      "Profile with node --cpu-prof before optimising — measurement beats folklore.",
      "For huge datasets prefer streams and Buffers over loading everything into JS objects on the heap.",
    ],
    realWorldUseCases: [
      "Serialisation hot paths (JSON.stringify of large payloads) benefit from monomorphic shapes.",
      "Memory leaks in long-running servers show up first as ever-growing heapUsed in process.memoryUsage().",
    ],
    resources: [
      docs("V8 — Documentation", "https://v8.dev/docs", "Official V8 docs: Ignition, TurboFan, hidden classes, memory.", "en", "reference"),
      docs("Node.js API — process.memoryUsage()", "https://nodejs.org/api/process.html#processmemoryusage", "How to read heap and RSS numbers from Node.js.", "en", "5 min"),
      ytSearch("V8 engine how JavaScript works JIT", "Visual explanations of parsing, bytecode and JIT.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-v8-shapes",
        title: "Stable vs unstable shapes",
        prompt:
          "Write two versions of a function that builds 100,000 user objects: (A) always sets {id, name, active} in that order; (B) sets id and name, then later adds active only for every 3rd user. Time both with console.time and compare. Write two sentences explaining any difference in terms of hidden classes.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Same insertion order → same hidden class → faster property access.", "Small differences are fine — the point is understanding the mechanism, not beating a benchmark."],
      },
    ],
    projectIds: [],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-libuv",
    slug: "libuv",
    title: "libuv — Async I/O and the Thread Pool",
    description:
      "The C library that gives Node.js its event loop, cross-platform async I/O and the four-thread pool that runs blocking work.",
    order: 5,
    estimatedMinutes: 17,
    tags: ["libuv", "event-loop", "io", "thread-pool"],
    prerequisites: ["p1m4-node-architecture", "p1m4-v8-engine"],
    relatedTopics: ["p1m4-event-loop-node", "p1m4-async-programming", "p1m4-fs-module"],
    learningObjectives: [
      "Explain what libuv provides: event loop, thread pool, cross-platform I/O bindings",
      "Name the default operations that run on the thread pool (fs, zlib, crypto.pbkdf2, dns.lookup)",
      "Describe how epoll/kqueue/IOCP let one thread watch thousands of sockets",
      "Set UV_THREADPOOL_SIZE and reason about its trade-offs",
    ],
    simpleExplanation:
      "libuv is the C library underneath Node.js that makes asynchronous I/O possible. It runs the **event loop** on your main thread, provides a small **thread pool** (4 threads by default) for blocking operations like file reads, and uses each operating system's most efficient notification mechanism so a single thread can manage thousands of network connections.",
    detailedContent: `
**What libuv actually does**

- **Event loop** — the scheduler that decides which callbacks run next (fully covered in the next lesson).
- **Thread pool** — 4 worker threads by default for operations that would otherwise block: most \`fs\` functions, \`zlib\`, \`crypto.pbkdf2\`, \`crypto.randomBytes\` (for large sizes) and \`dns.lookup\`. Configurable via the \`UV_THREADPOOL_SIZE\` environment variable (1024 max, sensible range 4–128).
- **Cross-platform I/O abstraction** — one API, different kernels:

| OS | Notification mechanism |
| --- | --- |
| Linux | epoll |
| macOS / BSD | kqueue |
| Windows | IOCP (I/O Completion Ports) |
| Solaris | event ports |

**Network vs disk.** Network sockets are managed directly by the event loop via those mechanisms — they are natively non-blocking. Disk file reads are *not*; the thread pool therefore performs the blocking \`read()\` and posts the result back to the loop.

    ┌───────────────────────────────┐
    │   Main JavaScript thread      │
    │   (event loop runs here)      │
    └──────────────┬────────────────┘
                   │ queue work
    ┌──────────────▼────────────────┐
    │   libuv thread pool (4)       │  fs.readFile · zlib · pbkdf2
    │   [t1]  [t2]  [t3]  [t4]      │  dns.lookup · …
    └───────────────────────────────┘
    ┌───────────────────────────────┐
    │  OS event mechanisms          │  epoll · kqueue · IOCP
    │  (sockets, some watchers)     │
    └───────────────────────────────┘
    `,
    howItWorks: `
When you call \`fs.readFile("big.log", cb)\`: argument validation happens in JS, then libuv creates a work request, assigns it to an idle pool thread, and returns control to the event loop **immediately**. The pool thread executes the blocking kernel read. When it finishes, libuv marks the request for the poll phase of the next loop iteration, where your callback runs on the main thread. If you launch 50 reads at once with a pool of 4, they queue — 46 wait for a free thread. Raising \`UV_THREADPOOL_SIZE\` trades memory for more disk concurrency.
    `,
    codeExamples: [
      {
        title: "Watch the thread pool in action",
        language: "js",
        code: `// CJS example — 8 concurrent pbkdf2 jobs on a pool of 4 threads
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");

console.log("pool size env:", process.env.UV_THREADPOOL_SIZE ?? "default (4)");

const jobs = Array.from({ length: 8 }, (_, i) =>
  new Promise((resolve) => {
    const start = performance.now();
    crypto.pbkdf2("secret", "salt", 200000, 64, "sha512", () => {
      resolve(performance.now() - start);
    });
  }),
);

Promise.all(jobs).then((times) => console.log("durations ms:", times.map((t) => t.toFixed(0))));`,
        description:
          "Run once normally, then with $env:UV_THREADPOOL_SIZE=8 (PowerShell) and re-run. Total wall-clock time drops because 8 jobs run in parallel instead of two waves of 4.",
      },
    ],
    commonMistakes: [
      "Assuming fs.readFile parallelism scales with CPU count — it scales with UV_THREADPOOL_SIZE (default 4).",
      "Setting UV_THREADPOOL_SIZE extremely high (e.g. 128) and hurting latency: each thread has stack overhead.",
      "Forgetting that CPU-heavy synchronous JavaScript never uses the thread pool — only libuv work requests do.",
    ],
    bestPractices: [
      "Leave the pool at 4 for typical APIs; raise it modestly (16–32) for file-heavy workers.",
      "For bulk file processing, use streams so a handful of threads move data continuously instead of many whole-file reads.",
      "Use process.env.UV_THREADPOOL_SIZE in your service manifest, not in code, so ops can tune it.",
    ],
    realWorldUseCases: [
      "An image-resizing worker raises the pool because every resize includes fs reads and CPU work queued as libuv tasks.",
      "A database backup script that hashes many files in parallel finishes faster with UV_THREADPOOL_SIZE=16.",
    ],
    resources: [
      docs("libuv — Documentation", "https://docs.libuv.org/en/latest/", "Official libuv book: event loop, thread pool, handles and requests.", "en", "reference"),
      docs("Node.js — The Node.js Event Loop", "https://nodejs.org/en/learn/asynchronous/event-loop-timers-and-nexttick", "Official explanation of the loop and where the pool fits.", "en", "12 min"),
      ytSearch("libuv thread pool Node.js explained", "Walkthroughs of UV_THREADPOOL_SIZE and I/O paths.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-pool-size",
        title: "Tune the pool",
        prompt:
          "Using the pbkdf2 example, measure total time with UV_THREADPOOL_SIZE at 2, 4 and 8 (PowerShell: $env:UV_THREADPOOL_SIZE='2'). Record a small table of results and explain in three sentences why the improvement plateaus.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["pbkdf2 is CPU-bound — once pool threads >= CPU cores, extra threads contend for the same cores."],
      },
    ],
    projectIds: ["p1-file-organizer"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-event-loop-node",
    slug: "the-nodejs-event-loop",
    title: "The Node.js Event Loop",
    description:
      "Phases (timers, pending callbacks, poll, check, close), where microtasks run, and what happens when you block the loop.",
    order: 6,
    difficulty: "intermediate",
    estimatedMinutes: 22,
    tags: ["event-loop", "async", "timers", "microtasks"],
    prerequisites: ["p1m4-libuv", "p1m4-node-vs-browser-js"],
    relatedTopics: ["p1m4-async-programming", "p1m4-events-eventemitter"],
    learningObjectives: [
      "Name the six event-loop phases in order and what runs in each",
      "Predict the output order of setTimeout, setImmediate, nextTick and promise callbacks",
      "Explain why process.nextTick beats promise microtasks",
      "Diagnose a blocked event loop and propose a fix",
    ],
    simpleExplanation:
      "The event loop is Node.js's single-threaded scheduler. While your script runs top-to-bottom, Node keeps a queue of *callbacks* — timers due, I/O finished, setImmediate requests — and runs them one at a time in **phases**. Between phases it fully drains two microtask queues: `process.nextTick` first, then promise callbacks. If your synchronous code takes too long, every one of those callbacks waits.",
    detailedContent: `
One **iteration** of the loop runs these phases in order:

    ┌───────────────────────────────────────────────┐
    │  timers        setTimeout / setInterval due   │
    ├───────────────────────────────────────────────┤
    │  pending cbs   deferred I/O callbacks         │
    ├───────────────────────────────────────────────┤
    │  poll          retrieve & execute I/O events  │◄── loop may wait here
    ├───────────────────────────────────────────────┤
    │  check         setImmediate callbacks         │
    ├───────────────────────────────────────────────┤
    │  close         e.g. socket 'close' handlers    │
    └───────────────────────────┬───────────────────┘
                                │ repeat while work remains

**Microtasks are not phases.** After the current operation — and after *every* callback — Node drains:

1. The \`process.nextTick\` queue (highest priority; can starve the loop if it re-queues itself).
2. The promise microtask queue (V8's job queue).

Rules of thumb for ordering:

- Top-level \`console.log\` → nextTick → promise → then the loop starts (timers/check/poll).
- Inside an I/O callback, \`setImmediate\` runs before \`setTimeout(fn, 0)\` because **check** immediately follows **poll**.
- From the main module, \`setTimeout(…, 0)\` vs \`setImmediate\` order is **not guaranteed** — it depends on timing precision. Never rely on it.
- \`setTimeout(fn, 0)\` is clamped (≈1ms after the previous, ≥1ms internally).

**Blocking consequences:** all of your JavaScript runs on one thread. A 200ms synchronous JSON parse delays *every* timer, *every* request and *every* keep-alive heartbeat on that process. Node reports this as a "loop delay" and process-level lag.
    `,
    howItWorks: `
Trace this inside an I/O callback:

    fs.readFile(file, () => {          // poll phase delivered this
      setTimeout(logA, 0);            // scheduled for timers phase NEXT iteration
      setImmediate(logB);             // scheduled for check phase, which runs right after poll
    });

Order: **readFile callback → logB (check) → logA (timers)**. Microtasks scheduled inside any of those run before the next phase begins. This is deterministic, unlike the main-module race between setTimeout(0) and setImmediate.
    `,
    codeExamples: [
      {
        title: "Predict the order — run it and verify",
        language: "js",
        code: `// CJS example
const fs = require("node:fs");

console.log("1 script start");

fs.readFile(__filename, () => {
  console.log("2 I/O callback (poll)");
  setTimeout(() => console.log("3 timeout (timers)"), 0);
  setImmediate(() => console.log("4 immediate (check)"));
});

process.nextTick(() => console.log("5 nextTick"));
Promise.resolve().then(() => console.log("6 promise microtask"));

console.log("7 script end");`,
        description:
          "Actual output: 1, 7, 5, 6, 2, 4, 3. nextTick and promises drain before the loop; inside the I/O callback, check (setImmediate) beats the zero-delay timer.",
      },
      {
        title: "See a blocked loop",
        language: "js",
        code: `// CJS example — the timer should fire after ~10ms but cannot
console.log("A");
setTimeout(() => console.log("B"), 10);

const start = Date.now();
while (Date.now() - start < 200) {
  // synchronous busy-wait: nothing else can run
}
console.log("C");`,
        description:
          "Output is A, C, B — B is delayed until the 200ms block finishes. On a real server this is a frozen API for every user at once.",
      },
    ],
    commonMistakes: [
      "Relying on setTimeout(0) vs setImmediate order from the main module — it is timing-dependent and non-portable.",
      "Using process.nextTick for everything and starving the loop (it re-runs before I/O can proceed).",
      "Believing 'single-threaded' means 'cannot do concurrent I/O' — concurrency comes from libuv, not from more JS threads.",
    ],
    bestPractices: [
      "Keep synchronous work under a few milliseconds; push heavy CPU tasks to worker_threads or a child process.",
      "Prefer setImmediate(fn) over setTimeout(fn, 0) when you mean 'after the current phase'.",
      "Use loop monitoring in production (e.g. event-loop-delay metrics) to catch regressions early.",
    ],
    realWorldUseCases: [
      "A JSON-heavy endpoint that parses 30MB payloads in one tick starves every other request — move parsing to a worker or stream it.",
      "Game servers and chat hubs rely on the poll phase to fan out thousands of socket messages per second from one process.",
    ],
    resources: [
      docs("Node.js — The Node.js Event Loop, timers, and process.nextTick()", "https://nodejs.org/en/learn/asynchronous/event-loop-timers-and-nexttick", "The canonical phase-by-phase reference.", "en", "15 min"),
      docs("Node.js API — Timers", "https://nodejs.org/api/timers.html", "setTimeout, setImmediate and their guarantees.", "en", "10 min"),
      ytSearch("Node.js event loop phases explained", "Visual phase walkthroughs with ordering demos.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-loop-order",
        title: "Order oracle",
        prompt:
          "Before running, write the exact output order of: console.log('1'); setTimeout(() => console.log('2'), 0); setImmediate(() => console.log('3')); process.nextTick(() => console.log('4')); Promise.resolve().then(() => console.log('5')); console.log('6'). Run it five times — does 2 vs 3 ever swap? Explain why in terms of phases.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Fixed order: 1, 6, 4, 5 then the loop. 2 vs 3 depends on whether the timers threshold is met before the loop starts."],
      },
      {
        id: "ex-p1m4-block-loop",
        title: "Measure the freeze",
        prompt:
          "Start a tiny HTTP server that returns 'ok'. Add a route /slow that busy-waits 2 seconds synchronously. From a second terminal, curl /slow and / concurrently — time the second request. Then move the busy-wait into setImmediate chunks or a worker and compare.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["While /slow runs, even your health check should hang — that is the lesson.", "worker_threads can run the CPU job off the main thread."],
        solution: `import http from "node:http";
import { Worker } from "node:worker_threads";

const server = http.createServer((req, res) => {
  if (req.url === "/slow") {
    const start = Date.now();
    while (Date.now() - start < 2000) {} // blocks the event loop
    res.end("slow done");
    return;
  }
  res.end("ok");
});

server.listen(3000, () => console.log("try: curl http://127.0.0.1:3000/slow & curl http://127.0.0.1:3000/"));`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-async-programming",
    slug: "asynchronous-programming-in-node",
    title: "Asynchronous Programming in Node.js",
    description:
      "Why one thread plus non-blocking I/O scales, and the crucial difference between concurrency and parallelism.",
    order: 7,
    estimatedMinutes: 16,
    tags: ["async", "concurrency", "callbacks", "promises"],
    prerequisites: ["p1m4-event-loop-node"],
    relatedTopics: ["p1m4-event-loop-node", "p1m4-libuv", "p1m4-streams"],
    learningObjectives: [
      "Explain why non-blocking I/O lets one thread serve thousands of clients",
      "Distinguish concurrency (interleaving) from parallelism (true simultaneous cores)",
      "Choose between callbacks, promises and async/await for Node.js code",
      "Use Promise.all to run independent async operations concurrently",
    ],
    simpleExplanation:
      "Node.js spends almost all its time **waiting** — for disk, sockets or databases. Instead of dedicating a thread per request (which wastes memory), Node issues the request, frees the thread, and resumes your code when data arrives. That is *concurrency*: many operations in flight at once. *Parallelism* is different — it means running computations on multiple CPU cores at the same time, which needs workers or multiple processes.",
    detailedContent: `
**Why non-blocking scales**

A traditional thread-per-request model (old Java servlets, Apache prefork) uses ~1–8 MB of stack per thread. 10,000 concurrent requests ≈ tens of gigabytes of RAM just for idle stacks. Node's model keeps one main thread; waiting lives in the OS and the libuv pool. 10,000 concurrent sockets cost you mostly socket buffers — a single process handles it comfortably.

**Concurrency vs parallelism**

| | Concurrency | Parallelism |
| --- | --- | --- |
| Means | multiple tasks in progress, interleaved | multiple tasks executing at the exact same instant |
| Needs | an event loop or scheduler | multiple CPU cores / threads |
| Node.js? | built in (event loop) | only via worker_threads, child processes, or clustering |

**Async styles** (all supported; async/await is the modern default):

1. Callbacks — \`fs.readFile(p, (err, data) => …)\` (error-first convention).
2. Promises — \`fs.promises.readFile(p).then(…)\`.
3. async/await — \`const data = await fs.promises.readFile(p)\` inside an async function.

Independent operations should run **concurrently**, not serially:

    // Serial: ~600ms (3 × 200ms)
    const a = await fetchA(); const b = await fetchB(); const c = await fetchC();

    // Concurrent: ~200ms
    const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
    `,
    howItWorks: `
When you \`await\` a promise, the async function suspends; the engine stores its continuation and returns control to the event loop, which is then free to run other callbacks (other requests!). When the underlying I/O completes, libuv queues the continuation as a microtask and the function resumes with the resolved value. Nothing is truly paused “on a thread” while waiting — which is exactly why concurrency is nearly free.
    `,
    codeExamples: [
      {
        title: "Serial vs concurrent reads",
        language: "js",
        code: `// ESM example
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const files = Array.from({ length: 6 }, (_, i) => \`file\${i}.txt\`);

// Serial — each await waits for the previous
let t = performance.now();
for (const f of files) {
  await readFile(f, "utf8").catch(() => "");
}
console.log("serial ms:", (performance.now() - t).toFixed(0));

// Concurrent — all issued before any await
t = performance.now();
await Promise.all(files.map((f) => readFile(f, "utf8").catch(() => "")));
console.log("concurrent ms:", (performance.now() - t).toFixed(0));`,
        description:
          "Serial time ≈ sum of each read; concurrent time ≈ the slowest single read. The thread pool is shared, so gains saturate at UV_THREADPOOL_SIZE for disk work.",
      },
    ],
    commonMistakes: [
      "Awaiting independent calls one by one and turning 300ms of I/O into 900ms.",
      "Forgetting that async/await does NOT create a new thread — CPU-heavy work still blocks the loop.",
      "Mixing callbacks and promises without a plan; prefer fs.promises (or promisify) for new code.",
    ],
    bestPractices: [
      "Default to async/await; use Promise.all for independent work and Promise.allSettled when some calls may fail.",
      "Always set timeouts on network awaits — await without a deadline can hang a request forever.",
      "Move CPU-heavy jobs (zip, image resize, big JSON parse) to worker_threads or a queue.",
    ],
    realWorldUseCases: [
      "A dashboard page that calls six microservices uses Promise.all so users wait for the slowest one, not the sum.",
      "Batch importers fan out N inserts with controlled concurrency (e.g. chunks of 50) to avoid saturating the pool.",
    ],
    resources: [
      docs("Node.js — Asynchronous JavaScript", "https://nodejs.org/en/learn/asynchronous/asynchronous-javascript", "Callbacks, promises and async/await in the Node.js context.", "en", "12 min"),
      docs("MDN — Concurrent features", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function", "async/await language reference.", "en", "10 min"),
      ytSearch("Node.js asynchronous programming async await explained", "Practical async pattern walkthroughs.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-concurrency",
        title: "Race serial vs parallel",
        prompt:
          "Write a script that hits the same public endpoint 5 times using (a) sequential await and (b) Promise.all. Compare total durations with performance.now(). Then explain why (b) is not 'multi-threading'.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Both run on one JS thread; the sockets wait inside the OS while the loop stays free."],
      },
    ],
    projectIds: ["p1-weather-client"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-commonjs-es-modules",
    slug: "commonjs-vs-es-modules",
    title: "CommonJS vs ES Modules",
    description: ".js vs .mjs, \"type\": \"module\", require vs import, and how the two systems interoperate.",
    order: 8,
    estimatedMinutes: 18,
    tags: ["modules", "commonjs", "esm", "require", "import"],
    prerequisites: ["p1m4-what-is-nodejs", "p1m3-package-json"],
    relatedTopics: ["p1m4-importing-exporting", "p1m4-built-in-modules"],
    learningObjectives: [
      "Choose between CommonJS and ESM for a Node.js project",
      "Explain how .mjs and package.json type field control the module system of a .js file",
      "Use require and import correctly, including dynamic import()",
      "Import a CommonJS module from ESM (and the reverse) without surprises",
    ],
    simpleExplanation:
      "Node.js originally used **CommonJS** (CJS): `require()` to load, `module.exports` to share. Modern JavaScript has **ES modules** (ESM): static `import`/`export` syntax. Node.js supports both. A file's type is decided by its extension (.mjs always ESM, .cjs always CJS) or by the \"type\" field in the nearest package.json (for .js files).",
    detailedContent: `
**How Node decides which system a file uses**

| File | package.json "type" | Module system |
| --- | --- | --- |
| \`.mjs\` | anything | ESM (forced) |
| \`.cjs\` | anything | CommonJS (forced) |
| \`.js\` | "module" | ESM |
| \`.js\` | "commonjs" or absent | CommonJS |

**Behavioural differences that matter**

| | CommonJS | ESM |
| --- | --- | --- |
| Load syntax | \`require()\` (runtime call) | \`import\` (static, hoisted) |
| Exports | \`module.exports = …\` | \`export\` / \`export default\` |
| Loading | synchronous from cache | async module graph resolution |
| Top-level \`this\` | \`module.exports\` | \`undefined\` |
| Conditional require | trivial | use dynamic \`await import()\` |
| JSON import | require("./x.json") | needs \`with { type: "json" }\` (or assertion syntax on older Node) |

**Interop rules**

- ESM can import CJS: named exports are best-effort (Node's cjs-module-lexer detects \`module.exports.foo = …\` patterns); the default export is \`module.exports\` itself.
- CJS cannot use static import, but can use dynamic \`await import()\` inside an async function.
- Built-in modules support both: \`require("node:fs")\` and \`import fs from "node:fs"\`.

Static imports are **hoisted**: they are resolved and evaluated before any line of the importing module's body runs — a classic source of circular-import surprises covered in the next lesson.
    `,
    howItWorks: `
ESM resolution is asynchronous under the hood: Node builds a module graph, instantiates all modules (linking exports), then evaluates them depth-first. CommonJS resolution is a synchronous function call that reads the file, wraps it in a function (the module wrapper), executes it, and returns \`module.exports\` from a cache. That is why \`require\` can be used conditionally (inside an if) while \`import\` must sit at the top level.
    `,
    codeExamples: [
      {
        title: "Both systems side by side",
        language: "js",
        code: `// ---- CommonJS (utils.cjs) ----
function add(a, b) { return a + b; }
module.exports = { add };

// ---- CommonJS consumer (app.cjs) ----
const { add } = require("./utils.cjs");
console.log(add(2, 3)); // 5

// ---- ESM (utils.mjs) ----
// export function add(a, b) { return a + b; }

// ---- ESM consumer (app.mjs) ----
// import { add } from "./utils.mjs";
// console.log(add(2, 3)); // 5

// ---- ESM importing CJS ----
// import utils from "./utils.cjs";      // default = module.exports
// import { add } from "./utils.cjs";    // named detected by Node
// console.log(utils.add(1, 1), add(1, 1));

// ---- Dynamic import from CJS ----
async function load() {
  const mod = await import("./utils.mjs");
  console.log(mod.add(4, 4));
}
load();`,
        description:
          "In ESM, always include the file extension (\"./utils.mjs\" or \"./utils.js\" under type: module) — Node will not guess like bundlers do.",
      },
    ],
    commonMistakes: [
      "Writing import x from './y' without an extension in Node ESM — you get ERR_MODULE_NOT_FOUND (bundlers forgive this, Node does not).",
      "Using require() inside a \"type\": \"module\" .js file — it is not defined; use import or createRequire.",
      "Assuming named imports from CJS always work — exotic exports (dynamic getters, proxies) may only be reachable via the default import.",
      "Mixing .js CJS and ESM in one folder without package.json scope — the nearest package.json wins, which surprises monorepos.",
    ],
    bestPractices: [
      "New projects: set \"type\": \"module\" and use ESM everywhere; it matches browser syntax and top-level await.",
      "Use .cjs only for legacy config files that must be CJS (some ESLint/PostCSS configs).",
      "Import built-ins with the node: prefix (node:fs) so intent is obvious and future-proof.",
      "In libraries, use the exports field in package.json to expose explicit entry points for both systems when needed.",
    ],
    realWorldUseCases: [
      "Most modern npm packages ship ESM with a CJS fallback build for older tooling.",
      "VS Code extensions and some Electron apps remain CJS because their host requires it.",
    ],
    resources: [
      docs("Node.js API — ECMAScript modules", "https://nodejs.org/api/esm.html", "The authoritative ESM guide: resolution, interop, top-level await.", "en", "20 min"),
      docs("Node.js API — Modules (CommonJS)", "https://nodejs.org/api/modules.html", "require, exports and the module wrapper.", "en", "15 min"),
      ytSearch("CommonJS vs ES modules Node.js", "Comparisons with live demos of .mjs and type module.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-module-type",
        title: "Force Node to choose",
        prompt:
          "Create a folder with package.json containing only \"type\": \"module\", then write a.cjs using require and b.js using import. Run both with node and record the exact error for the wrong one. Now flip type to \"commonjs\" and repeat. Summarise the decision rule in one sentence.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [".cjs is always CommonJS regardless of type; require in a module .js throws ReferenceError."],
      },
      {
        id: "ex-p1m4-interop",
        title: "Interop bridge",
        prompt:
          "Write math.cjs exporting add via module.exports.add = add. Import it from an ESM file two ways: default import and named import. Log both. Which works, and why might named detection ever fail?",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Node statically analyses CJS exports; dynamic assignments like module.exports[name] = fn may not be detected."],
        solution: `// math.cjs
function add(a, b) { return a + b; }
module.exports = { add };

// app.mjs
import mathDefault from "./math.cjs";
import { add } from "./math.cjs";
console.log(mathDefault.add(1, 2)); // 3
console.log(add(3, 4));             // 7`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-calculator", "p1-notes-cli"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-importing-exporting",
    slug: "importing-and-exporting",
    title: "Importing and Exporting Modules",
    description:
      "Resolution rules, named vs default exports, index files and package entry points, and how circular imports behave in Node.js.",
    order: 9,
    estimatedMinutes: 17,
    tags: ["modules", "imports", "exports", "resolution"],
    prerequisites: ["p1m4-commonjs-es-modules"],
    relatedTopics: ["p1m4-commonjs-es-modules", "p1m4-built-in-modules"],
    learningObjectives: [
      "Trace how Node resolves relative, bare and node: specifiers",
      "Choose named exports vs default exports deliberately",
      "Configure package.json main/exports so a package has a clean entry point",
      "Predict what happens with circular imports and how to avoid partial-export bugs",
    ],
    simpleExplanation:
      "Every import statement is a request: “find this file or package and give me its exports.” Node answers with **resolution rules** — relative paths (\"./utils.js\") start from the current file, bare names (\"lodash\") search node_modules, and the node: prefix forces a built-in. In ESM you must include the file extension; in CommonJS Node appends .js for you.",
    detailedContent: `
**Resolution order (simplified)**

1. **Built-in** — \`node:fs\` or bare \`fs\` → core module (node: prefix recommended).
2. **Relative** — \`./x\`, \`../x\` → resolved against the *importing file's* directory.
3. **Bare** — \`lodash\` → walk up node_modules folders; read the package's package.json ("exports" → "main" → index.js).

**ESM specifics**

- Extensions are mandatory: \`import './util.js'\` works; \`import './util'\` throws ERR_MODULE_NOT_FOUND.
- Directory imports (\`import './utils'\` looking for utils/index.js) are **not** supported — use an explicit file or an exports map.
- Top-level await is allowed in ESM.
- Named exports come from \`export const x\` / \`export function x\`; one \`export default\` per module.

**package.json entry points**

    {
      "name": "tiny-utils",
      "type": "module",
      "exports": { ".": "./src/index.js" },
      "main": "./src/index.js"
    }

"exports" is the modern, stricter map (Node 12+); "main" is the legacy fallback. Inside the package, \`src/index.js\` typically re-exports from sibling files — the “index file” pattern keeps the public API in one place.

**Circular imports:** if A imports B and B imports A, one of them will see the other's exports **partially initialised** (live bindings in ESM are updated later; CJS may hand back a partial \`module.exports\`). Symptoms: \`undefined\` functions at call time. Fix: invert the dependency, merge into a third module, or use dynamic import() lazily.
    `,
    howItWorks: `
ESM evaluation is depth-first and cached per resolved URL: Node links the whole graph first (so circular imports often “work” for live bindings), then evaluates modules. CommonJS evaluation is eager and synchronous at each require call — the first module in the cycle finishes with whatever the other had exported *so far*. This is why \`const { helper } = require('./b')\` inside a cycle can be \`undefined\` if b.js required a.js before defining helper.
    `,
    codeExamples: [
      {
        title: "Named vs default exports with an index barrel",
        language: "js",
        code: `// ---- ESM: src/utils/strings.js ----
export function slugify(text) {
  return text.toLowerCase().replace(/\\s+/g, "-");
}
export function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}
export default { slugify, capitalize }; // optional convenience

// ---- ESM: src/utils/index.js (barrel / public API) ----
export { slugify, capitalize } from "./strings.js";

// ---- Consumer anywhere in the package ----
import { slugify, capitalize } from "./utils/index.js";
console.log(slugify("Hello World")); // hello-world`,
        description:
          "Barrel files (index.js re-exporting siblings) give consumers one stable import path while internals can be reorganised freely.",
      },
      {
        title: "Circular imports: the partial-export trap (CommonJS)",
        language: "js",
        code: `// ---- a.cjs ----
console.log("a: loading, b.value =", require("./b.cjs").value); // undefined!
exports.value = "A";
exports.fromA = () => "from A";

// ---- b.cjs ----
exports.value = "B";
const a = require("./a.cjs"); // a is mid-load → partially filled
exports.log = () => console.log("b sees a.value =", a.value); // 'A' after a finishes

// ---- main ----
const b = require("./b.cjs");
b.log(); // b sees a.value = A (filled in by the time log() runs)`,
        description:
          "At the moment b.cjs is required from a.cjs, a has not yet assigned value — you observed undefined. Calls made later usually work because CJS exports are mutable objects, but top-level usage of the partial value is a classic cycle bug.",
      },
    ],
    commonMistakes: [
      "Forgetting the .js extension in ESM relative imports — the most common ERR_MODULE_NOT_FOUND for beginners.",
      "Expecting import './utils' to find utils/index.js — that bundler convenience does not exist in Node ESM.",
      "Building deep circular dependencies between modules and debugging mysterious undefined at runtime.",
      "Exporting a huge default object when named exports would allow better tree-shaking and clearer imports.",
    ],
    bestPractices: [
      "Prefer named exports; reserve default exports for a single main class/function per file.",
      "Give packages an exports map so internal files are not part of the public API.",
      "If two modules keep needing each other, extract the shared piece into a third module.",
      "In monorepos, import workspace packages by name, not by deep relative paths into their src folders.",
    ],
    realWorldUseCases: [
      "A shared \"design system\" package exports components from index.js; apps import the package name, never internal paths.",
      "Plugin architectures dynamically import() optional modules to break cycles and lazy-load heavy code.",
    ],
    resources: [
      docs("Node.js API — Modules: resolution algorithm", "https://nodejs.org/api/packages.html#resolution-algorithm-specification", "Spec-level resolution rules for packages and entry points.", "en", "reference"),
      docs("Node.js API — ESM: cyclic module records", "https://nodejs.org/api/esm.html#cyclic-module-records", "How Node handles circular ESM graphs.", "en", "8 min"),
      ytSearch("Node.js modules circular dependencies explained", "Demos of partial exports and how to restructure.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-resolution",
        title: "Follow the resolution",
        prompt:
          "Create a three-level folder structure (src/a/b/c.js) that imports from src/shared/util.js using a relative path. Then move util.js and rewrite the import. Finally, wrap it as a package named @my/utils with an exports map and import it by name via npm link. Record every error you hit along the way.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["From c.js the relative path is ../../../shared/util.js.", "npm link registers the package globally for local testing."],
      },
    ],
    projectIds: ["p1-calculator", "p1-notes-cli"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-built-in-modules",
    slug: "nodejs-built-in-modules",
    title: "Tour of Node.js Built-in Modules",
    description:
      "fs, path, os, http, crypto, events, stream, util, process and child_process — what each is for and when to reach for it.",
    order: 10,
    estimatedMinutes: 18,
    tags: ["modules", "fs", "http", "crypto", "built-ins"],
    prerequisites: ["p1m4-what-is-nodejs", "p1m4-commonjs-es-modules"],
    relatedTopics: ["p1m4-fs-module", "p1m4-http-module", "p1m4-events-eventemitter"],
    learningObjectives: [
      "Name the purpose of the ten most-used built-in modules",
      "Import built-ins correctly with the node: prefix in both CJS and ESM",
      "Decide which module to use for files, paths, OS info, hashing, HTTP and subprocesses",
      "Appreciate that many npm packages are thin wrappers around built-ins",
    ],
    simpleExplanation:
      "Node.js ships with a batteries-included standard library. You do not need npm to read files, hash passwords, start an HTTP server or spawn a process — you need `fs`, `crypto`, `http` and `child_process`. Learning this toolkit makes npm a tool for *additional* capabilities rather than a crutch for missing basics.",
    detailedContent: `
**The core ten**

| Module | Purpose | Typical function |
| --- | --- | --- |
| \`fs\` | Filesystem read/write | \`readFile\`, \`writeFile\`, \`stat\` |
| \`path\` | Path string manipulation | \`join\`, \`resolve\`, \`dirname\` |
| \`os\` | Machine info | \`cpus\`, \`hostname\`, \`tmpdir\` |
| \`http\` | HTTP/1.1 server & client | \`createServer\`, \`get\` |
| \`crypto\` | Hashing, HMAC, random, TLS helpers | \`createHash\`, \`randomUUID\` |
| \`events\` | Event emitter base class | \`EventEmitter\` |
| \`stream\` | Streaming data primitives | \`Readable\`, \`Transform\` |
| \`util\` | Small helpers | \`promisify\`, \`inspect\`, \`parseArgs\` |
| \`process\` | The OS process (global, also a module) | \`env\`, \`argv\`, \`exit\` |
| \`child_process\` | Spawn subprocesses | \`execFile\`, \`spawn\` |

Others you will meet soon: \`url\`, \`querystring\`, \`buffer\`, \`assert\`, \`test\` (built-in test runner), \`worker_threads\`, \`zlib\`, \`tls\`, \`dns\`, \`readline\`, \`string_decoder\`.

**Import style:** prefer the explicit prefix —

    import fs from "node:fs";
    const { createHash } = require("node:crypto");

The node: prefix guarantees a built-in even if a package with the same name appears in node_modules.
    `,
    howItWorks: `
Each built-in is implemented mostly in JavaScript on top of C++ bindings into V8/libuv and native dependencies (OpenSSL for crypto and TLS, zlib for compression). When you \`import http from "node:http"\`, Node serves it from an internal cache — there is no disk hit and no node_modules lookup. That is also why built-ins cannot be patched by npm install; you wrap them (e.g. \`fs-extra\` around \`fs\`) when you need extra behaviour.
    `,
    codeExamples: [
      {
        title: "Five built-ins in one small script",
        language: "js",
        code: `// ESM example
import os from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const id = randomUUID();
const hash = createHash("sha256").update("nodepath").digest("hex").slice(0, 12);
const report = {
  id,
  hash,
  hostname: os.hostname(),
  cpus: os.cpus().length,
  tmp: path.join(os.tmpdir(), \`\${id}.json\`),
};

await writeFile(report.tmp, JSON.stringify(report, null, 2));
console.log("wrote", report.tmp);`,
        description:
          "os gives machine facts, path builds a safe location, crypto makes ids and hashes, fs writes the result — no npm installs required.",
      },
    ],
    commonMistakes: [
      "npm-installing packages that duplicate built-ins (uuid → crypto.randomUUID, request → http/fetch, path-extra → path).",
      "Forgetting that process is a global — you rarely need to import it, though require('node:process') also works.",
      "Mixing fs (callback/promise/sync in one module) with fs/promises (promise-only) inconsistently in the same file.",
      "Using crypto.createHash('md5') for passwords — hashing for storage must be bcrypt/argon2 (covered in Phase 2).",
    ],
    bestPractices: [
      "Always prefix built-in imports with node: for clarity and future compatibility.",
      "Learn fs/promises + async/await as your default file API.",
      "Check the built-ins list before adding a dependency — the answer is often already installed.",
    ],
    realWorldUseCases: [
      "A backup script combining fs streams, path, zlib compression and crypto checksums — zero dependencies.",
      "A health-check endpoint reading os.loadavg() and process.uptime() for quick diagnostics.",
    ],
    resources: [
      docs("Node.js API — Modules index", OFFICIAL.nodejsApi, "Complete reference for every built-in module.", "en", "reference"),
      docs("Node.js — Node.js, the difference with the browser", "https://nodejs.org/en/learn/getting-started/nodejs-browser-difference", "Lists what the platform gives you beyond the language.", "en", "8 min"),
      ytSearch("Node.js built-in modules you should know", "Tours of fs, path, os, crypto and friends.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-builtins-hunt",
        title: "Built-in scavenger hunt",
        prompt:
          "Without searching the web, guess which built-in module you would use for: (1) unzipping a file, (2) spawning git, (3) parsing a URL, (4) running the built-in test runner, (5) reading a directory. Then verify each guess in the official API docs and write the correct module name.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["1) zlib  2) child_process  3) url (or the global URL class)  4) node:test  5) fs"],
      },
    ],
    projectIds: ["p1-calculator", "p1-file-organizer"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-process-object",
    slug: "the-process-object",
    title: "The Process Object",
    description:
      "Properties, lifecycle, exit codes and stdout/stderr — everything the global process object tells you about the running program.",
    order: 11,
    estimatedMinutes: 15,
    tags: ["process", "lifecycle", "exit-codes", "stdout"],
    prerequisites: ["p1m4-what-is-nodejs", "p1m4-built-in-modules"],
    relatedTopics: ["p1m4-env-vars-node", "p1m4-process-argv", "p1m4-error-handling-node"],
    learningObjectives: [
      "Read key process properties: pid, platform, argv, env, version, cwd()",
      "Explain the process lifecycle: start → script → event loop drains → exit",
      "Set exit codes correctly for scripts and CLIs",
      "Write to stdout/stderr and understand buffering behaviour",
    ],
    simpleExplanation:
      "`process` is a global object representing the currently running Node.js program. It tells you the process id, platform, arguments, environment variables and versions; it lets you exit with a chosen code; and its stdout/stderr streams are what `console.log` writes to. When your script ends and no timers or servers remain, Node exits the process automatically.",
    detailedContent: `
**Properties and methods you will use constantly**

| Member | Meaning |
| --- | --- |
| \`process.pid\` | OS process id (useful in logs) |
| \`process.platform\` | \`win32\`, \`linux\`, \`darwin\`… |
| \`process.arch\` | \`x64\`, \`arm64\` |
| \`process.argv\` | \`[nodePath, scriptPath, ...args]\` |
| \`process.env\` | environment variables (all strings) |
| \`process.version\` / \`versions\` | Node version and component versions |
| \`process.cwd()\` | current working directory |
| \`process.exitCode\` | code to use when the loop drains |
| \`process.exit(code)\` | terminate immediately |
| \`process.stdout\` / \`stderr\` | writable streams console uses |

**Lifecycle**

1. Node boots, builds the process global, loads your entry file.
2. Top-level code runs synchronously.
3. The event loop runs any remaining work (servers, timers, I/O).
4. When there is nothing left, the loop closes and the process exits with \`process.exitCode\` (default 0).

**Exit codes:** 0 = success; 1 = generic failure; 2 = misuse of shell builtins (convention); 3+ project-specific. CLIs should return non-zero on failure so scripts and CI can detect it (\`node deploy.js || echo failed\`).

\`process.exit()\` ends the process *immediately* — pending stdout writes can be lost. Prefer setting \`process.exitCode = 1\` and letting the loop drain, or \`process.exit\` only when you truly must stop (e.g. fatal error handler).
    `,
    howItWorks: `
\`console.log\` is sugar for \`process.stdout.write(String(x) + '\\n')\`. stdout is a stream: when it points to a terminal it usually writes synchronously, but when piped (\`node app.js > out.txt\`) writes become asynchronous — a process that exits too fast can truncate output. That is one reason \`process.exitCode\` is safer than \`process.exit\`: it lets Node flush pending writes before quitting.
    `,
    codeExamples: [
      {
        title: "Inspect the process and exit with a code",
        language: "js",
        code: `// CJS example
console.log("pid:", process.pid);
console.log("platform/arch:", process.platform, process.arch);
console.log("cwd:", process.cwd());
console.log("node:", process.version);

// Simulate a failed run for scripts to detect
if (!process.env.API_KEY) {
  console.error("API_KEY is required");
  process.exitCode = 1; // loop drains, stdout flushes, exit code 1
}`,
        description:
          "Run `node app.js; echo exit=$LASTEXITCODE` in PowerShell after removing API_KEY — you should see exit=1.",
      },
      {
        title: "stdout vs stderr",
        language: "js",
        code: `// ESM example
process.stdout.write("normal output\\n");
process.stderr.write("diagnostics / errors\\n");

// Redirect only stderr: node app.js 2> errors.log   (PowerShell: 2> errors.log)`,
        description:
          "Keep machine-readable output on stdout and human diagnostics on stderr so pipelines like node gen.js | jq stay clean.",
      },
    ],
    commonMistakes: [
      "Calling process.exit() right after console.log when stdout is piped — the last line can be lost.",
      "Returning exit code 0 on failure, so CI and shell && chains think everything succeeded.",
      "Assuming process.platform is 'windows' — it is 'win32' even on 64-bit Windows.",
      "Mutating process.env values expecting numbers — everything is (or becomes) a string.",
    ],
    bestPractices: [
      "Set process.exitCode for failures; reserve process.exit() for fatal situations.",
      "Log errors to stderr and data to stdout.",
      "Include process.pid and process.version in structured logs for multi-process debugging.",
    ],
    realWorldUseCases: [
      "Deployment scripts that abort with exit code 1 when a required environment variable is missing.",
      "Docker health checks that depend on a script exiting 0/1 to mark a container healthy or not.",
    ],
    resources: [
      docs("Node.js API — process", "https://nodejs.org/api/process.html", "The complete process object reference.", "en", "reference"),
      docs("Node.js API — Exit codes", "https://nodejs.org/api/process.html#exit-codes", "What each exit code means.", "en", "5 min"),
      ytSearch("Node.js process object explained", "Walkthroughs of argv, env, stdout and exit codes.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-exit-codes",
        title: "Exit codes matter",
        prompt:
          "Write check.mjs that exits 0 when a file exists and 1 when it does not (use fs.access). Then write a PowerShell one-liner that runs check.mjs and prints SUCCESS or FAILURE based on $LASTEXITCODE. Verify both paths.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["await fs.access(path) throws when missing — catch and set process.exitCode = 1."],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-calculator"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-env-vars-node",
    slug: "environment-variables",
    title: "Environment Variables in Node.js",
    description:
      "process.env semantics, string coercion, defaults, validation and secrets hygiene for real deployments.",
    order: 12,
    estimatedMinutes: 14,
    tags: ["environment", "process.env", "config", "secrets"],
    prerequisites: ["p1m4-process-object", "p1m3-environment-variables", "p1m3-git-fundamentals"],
    relatedTopics: ["p1m4-process-argv", "p1m4-error-handling-node"],
    learningObjectives: [
      "Read and write environment variables with process.env",
      "Handle the fact that every value is a string (coercion pitfalls)",
      "Apply defaults and validation at startup",
      "Follow secrets hygiene: never commit keys, use .env locally only",
    ],
    simpleExplanation:
      "Environment variables are key–value pairs owned by the **operating system process**, not by your code. Node.js exposes them as `process.env.PORT`. They are the standard way to configure the same codebase differently in development, staging and production — and the only safe place to keep secrets on a server, because they never appear in your repository.",
    detailedContent: `
**Semantics of process.env**

- Every property access returns a **string** or \`undefined\` — never a number or boolean.
- Assignments coerce to strings: \`process.env.DEBUG = true\` stores "true".
- Deletions: \`delete process.env.OLD_FLAG\`.
- Values are inherited from the parent shell at startup; changing them later does not update the OS.

**Defaults and parsing**

    const port = Number(process.env.PORT ?? 3000);
    const debug = (process.env.DEBUG ?? "") === "true";

\`??\` handles \`undefined\`, but *not* an empty string — if someone sets \`PORT=""\`, \`Number("")\` is 0. Validate explicitly:

    function requireEnv(name) {
      const value = process.env[name];
      if (!value) throw new Error(\`Missing environment variable: \${name}\`);
      return value;
    }
    const apiKey = requireEnv("WEATHER_API_KEY"); 

**Local development:** tools like dotenv load a \`.env\` file into process.env for convenience:

    // only in local dev entrypoints
    import "dotenv/config";

Add \`.env\` to \`.gitignore\` immediately. Production should inject real values through the platform (systemd, Docker/Kubernetes secrets, Vercel/Railway dashboards) — never by committing files.

**Secrets hygiene checklist**

- Never commit \`.env\` or keys in code.
- Keep secrets out of logs (redact \`authorization\`, \`password\`, \`api_key\` fields).
- Rotate keys after any suspected leak; treat git history as public forever.
- Use different credentials per environment.
    `,
    howItWorks: `
When a process starts, the OS copies the environment block into the new process. V8/libuv simply wrap it as a plain object proxy: reads hit the native environment, writes go back to the process-level copy. Node does not parse types — "8080" stays a string until *your* code converts it. That's also why \`JSON.parse(process.env.CONFIG)\` can throw: it's just another string until validated.
    `,
    codeExamples: [
      {
        title: "Safe config loader with defaults and validation",
        language: "js",
        code: `// ESM example — config.js
function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(\`Invalid \${name}: expected a positive integer, got "\${raw}"\`);
  }
  return n;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(\`Missing required env var \${name}\`);
  return value;
}

export const config = {
  port: intEnv("PORT", 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiKey: requireEnv("WEATHER_API_KEY"),
};

// app entry: fail fast at startup, not on the first request
console.log("listening on port", config.port, "in", config.nodeEnv);`,
        description:
          "Failing fast with a clear message beats a mysterious runtime crash mid-request. $env:WEATHER_API_KEY='x' in PowerShell before running.",
      },
    ],
    commonMistakes: [
      "Using process.env.PORT directly in arithmetic or comparisons — it is a string (\"8080\" + 1 = \"80801\" in sloppy contexts).",
      "Forgetting that `??` does not catch empty strings, leading to Number('') === 0 ports.",
      "Committing .env files “just for now” — git history keeps secrets forever without a rewrite.",
      "Logging the whole process.env in debug mode and leaking every secret in your logs.",
    ],
    bestPractices: [
      "Parse and validate all env config once at startup into a frozen config object.",
      "Document every required variable in your README (names only, never values).",
      "Add .env* to .gitignore and use your platform's secret store in production.",
      "Prefix custom variables with your app name (MYAPP_) to avoid collisions in shared shells.",
    ],
    realWorldUseCases: [
      "The same Docker image runs in staging and prod — only environment variables differ.",
      "CI pipelines inject API keys as masked environment variables during tests.",
    ],
    resources: [
      docs("Node.js API — process.env", "https://nodejs.org/api/process.html#processenv", "Official semantics of the env object.", "en", "8 min"),
      docs("The Twelve-Factor App — Config", OFFICIAL.twelveFactor, "Store config in the environment — the industry-standard rationale.", "en", "8 min"),
      ytSearch("Node.js environment variables and dotenv", "Practical env var patterns for Node apps.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-env-validation",
        title: "Fail fast on bad config",
        prompt:
          "Extend the config loader to also require DATABASE_URL to start with postgres:// or mongodb://, and to coerce FEATURE_FLAG to a real boolean (true/false only, otherwise throw). Test each failure message with bad values set in your shell.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Accept only the strings 'true' and 'false' — anything else should throw."],
      },
      {
        id: "ex-p1m4-secret-scan",
        title: "Prove secrets stay out of git",
        prompt:
          "Create a .env with FAKE_SECRET=abc123, ensure it is gitignored, and commit everything else. Then run git log --all --oneline and git grep -n abc123 $(git rev-list --all) — confirm the secret never entered history. Write one sentence about what would be required to purge it if it had.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["gitignore prevents staging; the grep proves absence even in old commits."],
      },
    ],
    projectIds: ["p1-weather-client", "p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-process-argv",
    slug: "process-argv",
    title: "process.argv and Building CLIs",
    description:
      "Node executable vs script path, parsing flags, and building small command-line interfaces with util.parseArgs.",
    order: 13,
    estimatedMinutes: 16,
    tags: ["cli", "argv", "arguments", "parseargs"],
    prerequisites: ["p1m4-process-object", "p1m3-terminal-powershell"],
    relatedTopics: ["p1m4-env-vars-node", "p1m4-fs-module"],
    learningObjectives: [
      "Explain the four parts of process.argv and which indexes hold user input",
      "Parse positional arguments and --flags safely",
      "Use the built-in util.parseArgs for real CLI options",
      "Design helpful --help output and non-zero exit codes for CLIs",
    ],
    simpleExplanation:
      "When you run `node app.js --port 3000 start`, Node hands your script an array called `process.argv`. Element 0 is the path of the node executable, element 1 is the script path, and everything from index 2 onward is what *you* typed. A CLI is just a script that reads those values and branches on them.",
    detailedContent: `
**argv anatomy**

    $ node app.js --port 3000 start

    process.argv[0] = "/usr/local/bin/node"   ← node executable
    process.argv[1] = "/home/me/app.js"       ← script path
    process.argv[2] = "--port"
    process.argv[3] = "3000"
    process.argv[4] = "start"

User input starts at index 2. Note: after a double dash (\`--\`), some tools stop interpreting flags; Node itself passes everything after the script path through untouched.

**Parsing strategies**

1. **Manual** — fine for 0–2 flags: check \`argv.includes('--verbose')\`, slice positionals.
2. **util.parseArgs** (Node 18.3+, stable) — declarative options, booleans, strings, arrays, required flags. Built in; no npm needed.
3. Full frameworks (commander, yargs) — for large CLIs with subcommands and shell completion.

**Design rules for small CLIs**

- Print \`--help\` when asked or when input is invalid; exit 0 for help, 1 for errors.
- Accept \`--format=json\` or \`--json\` consistently; document in help text.
- Keep the first positional as the primary command (\`notes add "Buy milk"\`).
- Read secrets from env vars, not flags (flags show up in process lists).
    `,
    howItWorks: `
\`util.parseArgs({ options: { port: { type: "string" } }, strict: true })\` returns \`{ values, positionals }\`. With \`strict: true\` unknown flags throw — catching typos like \`--prot\` instead of silently ignoring them. The parser handles \`--port=3000\` and \`--port 3000\` forms, boolean negation defaults, and multiple values for array-typed options. For Windows PowerShell note: \`--port 3000\` passes through fine, but quotes matter for values with spaces (\`node app.js add "two words"\`).
    `,
    codeExamples: [
      {
        title: "A real CLI with util.parseArgs",
        language: "js",
        code: `// ESM example — greet.js
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    name: { type: "string", short: "n", default: "world" },
    loud: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log("Usage: node greet.js [--name/-n <who>] [--loud] [extra words]");
  process.exit(0);
}

let message = \`Hello, \${values.name}!\`;
if (positionals.length) message += " " + positionals.join(" ");
if (values.loud) message = message.toUpperCase();
console.log(message);`,
        description:
          "Try: `node greet.js -n Amina extra --loud` → \"HELLO, AMINA! EXTRA\". Built-in parseArgs keeps CLIs dependency-free.",
      },
      {
        title: "Manual parsing (tiny CLIs)",
        language: "js",
        code: `// CJS example
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const files = args.filter((a) => !a.startsWith("--"));

if (files.length === 0) {
  console.error("Usage: node copy.js [--verbose] <file...>");
  process.exit(1);
}

console.log(verbose ? "copying verbosely:" : "copying:", files.join(", "));`,
        description:
          "slice(2) is the universal idiom for “just the user's input”. Filter out flags to get positionals.",
      },
    ],
    commonMistakes: [
      "Reading user input from argv[1] — that is the script path, not your first argument.",
      "Parsing '3000' as a number without validation — garbage flags become NaN.",
      "Accepting --token=secret on the command line: it leaks in shell history and process listings.",
      "Forgetting PowerShell quoting: values with spaces must be quoted or they split into multiple positionals.",
    ],
    bestPractices: [
      "Use util.parseArgs for anything beyond two flags.",
      "Always implement --help and exit non-zero on misuse.",
      "Validate flag values immediately and print clear usage errors.",
      "Support both --flag value and --flag=value when you write parsers manually.",
    ],
    realWorldUseCases: [
      "The p1-notes-cli project: add/list/delete commands driven entirely by argv.",
      "Deployment scripts that accept --env production --dry-run flags.",
    ],
    resources: [
      docs("Node.js API — util.parseArgs", "https://nodejs.org/api/util.html#utilparseargsoptions", "Built-in argument parser reference.", "en", "10 min"),
      docs("Node.js API — process.argv", "https://nodejs.org/api/process.html#processargv", "Official argv definition.", "en", "5 min"),
      ytSearch("build a Node.js CLI with parseArgs", "CLI-building walkthroughs for beginners.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-argv-cli",
        title: "Mini argument parser",
        prompt:
          "Build todo.js supporting: `node todo.js add \"task\"`, `node todo.js list`, `node todo.js done <index>`, plus --help. Store tasks in a local JSON file. Print a usage error (exit 1) for unknown commands.",
        difficulty: "beginner",
        estimatedMinutes: 35,
        hints: ["const [cmd, ...rest] = process.argv.slice(2)", "Persist with fs/promises readFile/writeFile + JSON."],
        solution: `import { readFile, writeFile } from "node:fs/promises";

const [cmd, ...rest] = process.argv.slice(2);
const store = "tasks.json";

async function load() {
  try { return JSON.parse(await readFile(store, "utf8")); } catch { return []; }
}

if (cmd === "add" && rest.length) {
  const tasks = await load();
  tasks.push({ text: rest.join(" "), done: false });
  await writeFile(store, JSON.stringify(tasks, null, 2));
  console.log("added");
} else if (cmd === "list") {
  const tasks = await load();
  tasks.forEach((t, i) => console.log(i, t.done ? "[x]" : "[ ]", t.text));
} else if (cmd === "done" && rest[0]) {
  const tasks = await load();
  const i = Number(rest[0]);
  if (!tasks[i]) { console.error("no such task"); process.exit(1); }
  tasks[i].done = true;
  await writeFile(store, JSON.stringify(tasks, null, 2));
  console.log("done");
} else {
  console.log("Usage: node todo.js add|list|done ...");
  process.exit(cmd === "--help" || cmd === undefined ? 0 : 1);
}`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-calculator", "p1-file-organizer"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-fs-module",
    slug: "the-fs-module",
    title: "The fs Module",
    description:
      "Callback, promise and synchronous file APIs, when sync is acceptable, and a first look at file descriptors.",
    order: 14,
    estimatedMinutes: 18,
    tags: ["fs", "files", "async", "file-descriptors"],
    prerequisites: ["p1m4-event-loop-node", "p1m4-built-in-modules"],
    relatedTopics: ["p1m4-reading-writing-files", "p1m4-streams", "p1m4-path-module"],
    learningObjectives: [
      "Use the three fs styles: callback, fs/promises and *Sync",
      "Explain why callback-style errors are passed as the first argument",
      "Decide when a synchronous file call is acceptable",
      "Describe file descriptors (fd) and open/read/write/close at a basic level",
    ],
    simpleExplanation:
      "The `fs` module is Node.js's gateway to the filesystem. It comes in three flavours: **callback** (classic, error-first), **promise** (`fs.promises`, great with async/await) and **synchronous** (`readFileSync` — blocks the event loop until done). For most application code, prefer the promise API; use sync calls only for small startup work or one-shot scripts.",
    detailedContent: `
**The three styles**

    // 1) Callback (error-first)
    fs.readFile("a.txt", "utf8", (err, data) => { if (err) throw err; });

    // 2) Promise — recommended
    const data = await fs.promises.readFile("a.txt", "utf8");

    // 3) Sync — blocks the thread
    const data2 = fs.readFileSync("a.txt", "utf8");

**Error-first convention:** Node callbacks receive \`(error, result)\`. If \`error\` is truthy the operation failed (\`ENOENT\`, \`EACCES\`, \`EISDIR\`…) and \`result\` is undefined. Promises reject instead — hence try/catch with await.

**When sync is acceptable**

- CLI scripts and build steps that do one thing and exit.
- Reading a tiny config file at startup **before** the server listens.
- Never inside request handlers, timers or anything that serves concurrent users — sync I/O freezes the event loop for everyone.

**File descriptors (fd), demystified:** when you \`open()\` a file, the OS hands back a small integer — the **file descriptor** — that later calls (\`read\`, \`write\`, \`close\`) use to refer to that open file. High-level helpers (\`readFile\`, \`writeFile\`) open, read/write and close for you. Low-level \`fs.open\`, \`fs.read\`, \`fs.write\`, \`fs.close\` expose the raw steps; you rarely need them, but understanding fds explains errors like \`EBADF\` (bad descriptor) and why too many open files (\`EMFILE\`) happens with unclosed streams.

Common error codes: \`ENOENT\` (no such file), \`EACCES\` (permissions), \`EISDIR\` (tried to read a directory), \`ENOSPC\` (disk full).
    `,
    howItWorks: `
\`await fs.promises.readFile('a.txt')\` validates arguments in JS, asks libuv to queue a thread-pool job, and returns a pending promise — the event loop stays free. A pool thread performs the blocking kernel read into a Buffer, then the promise resolves with that Buffer (or a string if encoding was given). Callback style is the same machinery with a function instead of a promise; sync style calls the kernel directly on the main thread and cannot return until the bytes are in memory.
    `,
    codeExamples: [
      {
        title: "Three styles, one file",
        language: "js",
        code: `// ESM example
import fs from "node:fs";
import fsp from "node:fs/promises";

// Sync — fine at startup, blocks until done
fs.writeFileSync("demo.txt", "line1\\n");

// Promise — default for application code
const text = await fsp.readFile("demo.txt", "utf8");
console.log("promise read:", JSON.stringify(text));

// Callback — still common in older codebases
fs.readFile("demo.txt", "utf8", (err, data) => {
  if (err) {
    console.error("callback error:", err.code); // e.g. ENOENT
    return;
  }
  console.log("callback read:", JSON.stringify(data));
});

// Low-level fd API (rarely needed)
const fd = await fsp.open("demo.txt", "r");
const { buffer, bytesRead } = await fd.read(Buffer.alloc(16), 0, 16, 0);
console.log("first bytes:", buffer.subarray(0, bytesRead).toString("utf8"));
await fd.close();`,
        description:
          "The fd.read example shows what readFile does under the hood: allocate a Buffer, read from a position, close. Position 0 means “from the start of the file”.",
      },
    ],
    commonMistakes: [
      "Using readFileSync inside an HTTP handler — one slow disk stalls every request on the process.",
      "Ignoring the error argument in callbacks and crashing later on undefined data.",
      "Assuming readFile with no encoding returns a string — it returns a Buffer.",
      "Opening files with fs.open and forgetting fd.close(), leaking descriptors until EMFILE.",
    ],
    bestPractices: [
      "Default to fs/promises + async/await in new code.",
      "Always pass an encoding ('utf8') when you want text.",
      "Check err.code (not just truthiness) to handle ENOENT differently from EACCES.",
      "Close resources with try/finally or use the file handle's auto-close on process exit carefully.",
    ],
    realWorldUseCases: [
      "Reading a YAML/JSON config once at boot with readFileSync, then serving traffic asynchronously.",
      "Batch jobs streaming thousands of files with fs.promises so progress callbacks stay responsive.",
    ],
    resources: [
      docs("Node.js API — fs", "https://nodejs.org/api/fs.html", "Complete filesystem reference: promises, callbacks, constants.", "en", "reference"),
      docs("Node.js API — fsPromises.open() FileHandle", "https://nodejs.org/api/fs.html#class-filehandle", "File descriptors via the modern promise API.", "en", "10 min"),
      ytSearch("Node.js fs module tutorial readFile writeFile promises", "Practical file I/O walkthroughs.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-fs-styles",
        title: "Convert callback to async/await",
        prompt:
          "Take any snippet using fs.readFile callbacks and rewrite it with fs/promises and try/catch. Then add a check that distinguishes ENOENT (create an empty file) from EACCES (print a friendly permission message).",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["catch (err) { if (err.code === 'ENOENT') ... }"],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-file-organizer", "p1-contact-manager"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-path-module",
    slug: "the-path-module",
    title: "The path Module",
    description:
      "join vs resolve vs normalize, dirname/basename/extname, and avoiding Windows backslash pitfalls.",
    order: 15,
    estimatedMinutes: 13,
    tags: ["path", "files", "cross-platform"],
    prerequisites: ["p1m4-fs-module"],
    relatedTopics: ["p1m4-working-directories", "p1m4-reading-writing-files"],
    learningObjectives: [
      "Use path.join, path.resolve and path.normalize correctly",
      "Extract dirname, basename and extname from paths",
      "Write cross-platform path code that works on Windows and POSIX",
      "Explain why manual string concatenation with '/' is a bug factory",
    ],
    simpleExplanation:
      "File paths are strings, but the *rules* for combining them differ between Windows (`C:\\Users\\…`, backslashes) and Linux/macOS (`/home/…`, forward slashes). Node's `path` module does the platform-specific work for you: `path.join` glues segments and cleans them up; `path.resolve` turns a path into an absolute one; `dirname`/`basename`/`extname` pull pieces apart.",
    detailedContent: `
**The big three**

| Function | Question it answers | Example (POSIX) |
| --- | --- | --- |
| \`path.join(...parts)\` | “Glue these segments into one valid path” | \`join('/a','b','..','c') → '/a/c'\` |
| \`path.resolve(...parts)\` | “What absolute path does this point to?” (rightmost wins) | \`resolve('/a/b', '../c') → '/a/c'\` |
| \`path.normalize(p)\` | “Clean up this single string” | \`normalize('/a/./b/../c') → '/a/c'\` |

\`resolve\` treats an absolute segment as a reset point and falls back to \`process.cwd()\` when needed:

    path.resolve("uploads", "logo.png")
    // → "/home/me/project/uploads/logo.png"   (cwd = /home/me/project)
    path.resolve("/var/data", "uploads", "logo.png")
    // → "/var/data/uploads/logo.png"

**Piece extraction**

    path.dirname("/a/b/c.txt")   // "/a/b"
    path.basename("/a/b/c.txt")  // "c.txt"
    path.extname("/a/b/c.txt")   // ".txt"
    path.basename("c.txt", ".txt") // "c"

**Windows pitfalls**

- Never hand-build paths with \`/\` or \\\\ concatenation — use \`path.join\` so separators are correct on every OS.
- Windows drive letters (\`C:\\\`) confuse naive parsers; \`path\` and \`fileURLToPath\` handle them.
- \`path.sep\` is \\\\ on Windows and / on POSIX — if you split paths yourself, split on \`path.sep\`.
- URLs are not paths: convert with \`fileURLToPath(new URL('./x', import.meta.url))\` in ESM.
    `,
    howItWorks: `
\`path\` is a pure string library — it never touches the disk. \`path.join\` normalises separators, collapses \`.\`/\`..\`, and joins with the platform separator. \`path.resolve\` processes right-to-left, building an absolute path: each argument is resolved against the previous result, and the first absolute path “wins”. That is why \`path.resolve('/etc', 'passwd')\` is \`/etc/passwd\` regardless of cwd, while \`path.join('etc', 'passwd')\` is relative (\`etc/passwd\`) and only becomes absolute when later passed to fs (which resolves against cwd).
    `,
    codeExamples: [
      {
        title: "join vs resolve vs extraction",
        language: "js",
        code: `// ESM example
import path from "node:path";

console.log(path.join("app", "src", "..", "lib"));     // app/lib
console.log(path.normalize("app/./src/../lib"));       // app/lib
console.log(path.resolve("app", "src"));               // <cwd>/app/src (absolute)
console.log(path.resolve("/opt/app", "src"));          // /opt/app/src
console.log(path.dirname("/opt/app/index.js"));        // /opt/app
console.log(path.basename("/opt/app/index.js"));       // index.js
console.log(path.extname("index.js"));                 // .js
console.log(path.sep);                                 // \\ on Windows, / on POSIX`,
        description:
          "Always run the same script on Windows and Linux in CI if your tool touches paths — separator bugs hide until a user's machine differs from yours.",
      },
    ],
    commonMistakes: [
      "Using path.resolve when you meant path.join — resolve consults cwd and can jump to unexpected absolute locations.",
      "Concatenating paths with + \"/\" + — breaks on Windows and double-slashes annoy some tools.",
      "Comparing paths with === across platforms: Windows is case-insensitive, POSIX is not.",
      "Passing URL strings (file:///C:/…) directly to fs — convert with fileURLToPath first.",
    ],
    bestPractices: [
      "path.join for constructing paths from segments; path.resolve for resolving user input to absolute paths.",
      "Build paths from __dirname / import.meta.url, never from cwd, unless you deliberately want cwd-relative behaviour.",
      "Normalise before comparing or logging paths.",
      "Use path.parse when you need root/dir/base/ext in one call.",
    ],
    realWorldUseCases: [
      "A file organizer that must run on Windows laptops and Linux servers without code changes.",
      "Webpack/Vite-style tools that resolve thousands of relative import paths per second.",
    ],
    resources: [
      docs("Node.js API — path", "https://nodejs.org/api/path.html", "Full reference for join, resolve, dirname and friends.", "en", "12 min"),
      docs("Node.js API — fileURLToPath", "https://nodejs.org/api/url.html#urlfileurltopathurl", "Converting import.meta.url to a real filesystem path.", "en", "5 min"),
      ytSearch("Node.js path module join vs resolve", "Visual comparisons of the two most-confused functions.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-path-drill",
        title: "Predict then verify",
        prompt:
          "Without running, predict the output of: path.join('/x', 'y', '../z'), path.resolve('/x', 'y', '../z'), path.resolve('y', '../z'), path.normalize('/x/./y//z/../')). Then run a script and correct your notes. Explain the cwd-dependency of the third case.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["resolve('y', '../z') → path.join(cwd, 'z').", "join/normalize do not consult cwd."],
      },
    ],
    projectIds: ["p1-file-organizer", "p1-notes-cli"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-working-directories",
    slug: "working-directories-and-dirname",
    title: "Working Directories: cwd vs Script Directory",
    description:
      "process.cwd() vs the script's directory, computing __dirname in ESM, and why relative paths mysteriously break.",
    order: 16,
    estimatedMinutes: 14,
    tags: ["cwd", "dirname", "esm", "paths"],
    prerequisites: ["p1m4-path-module", "p1m4-commonjs-es-modules"],
    relatedTopics: ["p1m4-fs-module", "p1m4-importing-exporting"],
    learningObjectives: [
      "Distinguish process.cwd() (where you launched node) from the module's own directory",
      "Derive __dirname in ESM with fileURLToPath(import.meta.url)",
      "Diagnose ENOENT errors caused by cwd-relative paths",
      "Choose the right base for config files, assets and user data",
    ],
    simpleExplanation:
      "Two different directories are in play whenever Node touches a file. `process.cwd()` is **where you were standing in the terminal** when you ran node. The script's directory is **where the file itself lives**. Relative paths passed to fs are resolved against cwd — so the same script can work from the project root and fail from a subfolder. That is one of the most common beginner bugs.",
    detailedContent: `
**Two directories, two questions**

| You want | Ask | Result example |
| --- | --- | --- |
| “Where was I when I launched node?” | \`process.cwd()\` | \`C:\\me\\project\` |
| “Where does this file live?” | \`__dirname\` (CJS) or derived from \`import.meta.url\` (ESM) | \`C:\\me\\project\\src\` |
| “Where should user data go?” | explicit config or cwd on purpose | project-relative data folder |

    // CJS — Node provides __dirname for free
    const __dirname = require("node:path").dirname; // (illustrative)
    // real CJS: __dirname is already a global inside each module

    // ESM — derive it
    import { fileURLToPath } from "node:url";
    import path from "node:path";
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

**Why relative paths break**

    fs.readFileSync("config.json")   // resolved against process.cwd()

Run \`node src/app.js\` from the project root → looks for \`./config.json\` in the root. Run \`cd src; node app.js\` → looks in \`./src/config.json\` → ENOENT. Nothing is “wrong” with the code; the cwd changed.

**Which base should you choose?**

- **Script-relative** (\`__dirname\`) — templates, static assets, modules shipped with your code. Predictable everywhere.
- **cwd-relative** — user-supplied paths (\`node tool.js ./photos\`) and CLI output folders. This is what the user *means*.
- **Absolute via config/env** — server data directories in production.
    `,
    howItWorks: `
In ESM, \`import.meta.url\` is a file:// URL of the current module (e.g. \`file:///C:/me/project/src/app.js\`). \`fileURLToPath\` converts it to an OS path ("C:\\me\\project\\src\\app.js" on Windows, "/home/me/..." on POSIX), then \`path.dirname\` strips the filename. Node cannot inject a magic __dirname global in ESM because module scope is spec-driven — hence the one-line idiom every ESM codebase repeats (often wrapped in a tiny \`paths.js\` helper).
    `,
    codeExamples: [
      {
        title: "The ESM __dirname idiom",
        language: "js",
        code: `// ESM example — src/config.js
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Load a config file that lives NEXT TO this module, regardless of cwd
const configFile = path.join(__dirname, "config.json");
const config = JSON.parse(await readFile(configFile, "utf8"));
console.log("loaded", configFile, config);`,
        description:
          "Run this from any directory — it always finds src/config.json because the base is the module's location, not yours.",
      },
      {
        title: "See the difference live",
        language: "bash",
        code: `node -e "console.log('cwd:', process.cwd())"

# From project root
node src/app.js

# From src — cwd changes, script-relative paths do not
cd src
node app.js`,
        description:
          "Print process.cwd() at the top of app.js while switching directories to watch it change while __dirname stays put.",
      },
    ],
    commonMistakes: [
      "Passing 'config.json' to readFile and shipping code that only works when launched from one specific folder.",
      "Using process.cwd() to locate your own template files — users launch CLIs from arbitrary directories.",
      "Forgetting fileURLToPath and calling path.dirname on the raw file:// URL string — Windows paths come out mangled.",
      "Confusing import.meta.dirname (Node 21.2+) availability with older LTS — the fileURLToPath idiom still works everywhere.",
    ],
    bestPractices: [
      "For files shipped with your code, always resolve from __dirname (CJS) or the fileURLToPath idiom (ESM).",
      "For user-provided paths, resolve from cwd with path.resolve(process.cwd(), input) so the UX matches other CLI tools.",
      "Centralise the __dirname helper in one module and import it.",
      "Document in your README which paths users must run commands from — or better, make the tool location-independent.",
    ],
    realWorldUseCases: [
      "An npm global CLI (installed under ~/.npm-global/lib/...) must still find its templates via __dirname, not the user's shell cwd.",
      "A notes app storing data next to the script works identically after npm link and after global install.",
    ],
    resources: [
      docs("Node.js — The Node.js file system — __dirname", "https://nodejs.org/api/esm.html#json-modules", "ESM module context (import.meta) including URL handling.", "en", "8 min"),
      docs("MDN — import.meta.url", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta", "Language-level reference for import.meta.", "en", "5 min"),
      ytSearch("Node.js __dirname ESM fileURLToPath", "Short demos of the dirname workaround on Windows and Linux.", "en", "6–12 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-cwd-vs-dirname",
        title: "Break it, then fix it",
        prompt:
          "Write loader.mjs in src/ that reads './data.txt' relative to cwd. Demonstrate it failing when run from the project root, then fix it to read relative to the script directory with fileURLToPath. Paste both terminal commands and their outputs.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Create src/data.txt so only the base directory differs between the two runs."],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-file-organizer"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-reading-writing-files",
    slug: "reading-and-writing-files",
    title: "Reading and Writing Files",
    description:
      "readFileSync vs streaming for large files, encodings, appendFile, stat, and the atomic write pattern (temp file + rename).",
    order: 17,
    estimatedMinutes: 17,
    tags: ["fs", "files", "atomic-write", "stat"],
    prerequisites: ["p1m4-fs-module", "p1m4-path-module"],
    relatedTopics: ["p1m4-streams", "p1m4-working-directories", "p1m4-buffers"],
    learningObjectives: [
      "Choose between readFileSync, readFile and createReadStream based on file size",
      "Append to files and inspect metadata with stat",
      "Implement the atomic write pattern (write temp + rename) to avoid corrupt data",
      "Handle encodings and Buffers correctly when reading and writing text",
    ],
    simpleExplanation:
      "Reading a small config file in one shot is fine — but loading a 2 GB log into memory will crash your process. Node's answer is **streams**: move data in chunks so memory stays flat regardless of file size. When writing important data, use the **atomic pattern**: write to a temporary file, then rename it over the target — readers never see a half-written file.",
    detailedContent: `
**Choosing an API**

| File size / use | API | Memory |
| --- | --- | --- |
| Small (< a few MB), startup | \`readFileSync\` / \`writeFileSync\` | whole file in RAM, blocks loop |
| Medium, in a server handler | \`fs.promises.readFile\` | whole file in RAM, non-blocking |
| Large or unknown size | \`fs.createReadStream\` + \`pipeline\` | constant (chunks) |

**Encodings:** no encoding → returns a \`Buffer\` (raw bytes); \`'utf8'\` → a string. When writing, pass \`'utf8'\` for text so Node encodes it for you. Mismatched encodings produce mojibake (\`’\` instead of ’).

**Append:** \`appendFile\` adds to the end, creating the file if missing — the standard building block for log files:

    await fsp.appendFile(logPath, \`\${new Date().toISOString()} request done\\n\`);

**stat — metadata without reading:** \`await fsp.stat(p)\` returns size, mtime, birthtime, and \`isFile()\` / \`isDirectory()\`. Use it to decide “does this exist and is it big?” before choosing an API.

**Atomic write pattern**

    writeFile(target.tmp, data)   // 1. write to a temp file in the SAME folder
    rename(target.tmp, target)    // 2. atomically replace the real file

\`rename\` on the same filesystem is atomic at the OS level: other processes see either the old file or the complete new one — never a truncated middle state. Crash mid-write only leaves an orphan \`.tmp\` file, which you can sweep on startup.
    `,
    howItWorks: `
Why rename matters: a plain \`writeFile\` opens the target with truncate (O_TRUNC), empties it, then streams bytes in. If your process dies halfway, the file is corrupted forever. With temp+rename, the original file is untouched until the OS flips the directory entry in one operation. Same-filesystem matters too: rename() across devices fails with EXDEV — write the temp file in the destination's directory, not in os.tmpdir().
    `,
    codeExamples: [
      {
        title: "Atomic write + stat + append log",
        language: "js",
        code: `// ESM example
import { readFile, writeFile, rename, stat, appendFile } from "node:fs/promises";
import path from "node:path";

const target = path.resolve("data.json");
const temp = target + ".tmp"; // same folder → rename stays atomic

export async function saveAtomic(obj) {
  await writeFile(temp, JSON.stringify(obj, null, 2), "utf8");
  await rename(temp, target);
}

export async function loadOrInit(defaults) {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return defaults;
    throw err;
  }
}

// metadata without loading content
const info = await stat(target).catch(() => null);
console.log("size bytes:", info?.size ?? "missing");

// appends are perfect for logs
await appendFile("app.log", \`\${new Date().toISOString()} startup\\n\`);
console.log(await readFile("app.log", "utf8"));`,
        description:
          "saveAtomic is the pattern every config store, notes app and database file should use — crash-safe by construction.",
      },
      {
        title: "Streaming a large file (preview of streams)",
        language: "js",
        code: `// ESM example — copy gigabytes without loading them
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

await pipeline(createReadStream("huge.bin"), createWriteStream("huge-copy.bin"));
console.log("copied without buffering the whole file in RAM");`,
        description:
          "pipeline() handles errors, backpressure and cleanup for you — you will learn it properly in the streams lesson.",
      },
    ],
    commonMistakes: [
      "Using writeFile (truncate + write) on a live config file — readers can catch it half-written.",
      "Reading a multi-GB file with readFile 'because it's easier' — heapUsed explodes.",
      "Putting the temp file in os.tmpdir() and renaming — EXDEV errors on cross-device moves.",
      "Writing UTF-8 text without the utf8 option on Buffer inputs, or reading binary with 'utf8' and destroying bytes.",
    ],
    bestPractices: [
      "Atomic temp+rename for anything you would hate to lose.",
      "Stream files of unknown or large size; use sync/promise reads for small files.",
      "Call stat before large reads if you can branch on size.",
      "Include timestamps in appendFile logs (the OS will not add them for you).",
    ],
    realWorldUseCases: [
      "settings.json in a desktop app: saved after every change without ever being observed empty.",
      "Log ingestion that appends events continuously while another process tails the file.",
    ],
    resources: [
      docs("Node.js API — fs.writeFile", "https://nodejs.org/api/fs.html#fswritefilefile-data-options-callback", "Write semantics and options.", "en", "8 min"),
      docs("Node.js API — fsPromises.stat", "https://nodejs.org/api/fs.html#fspromisesstatpath-options", "File metadata reference.", "en", "6 min"),
      ytSearch("atomic file write Node.js temp rename pattern", "Crash-safe file saving walkthroughs.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-atomic-save",
        title: "Crash-proof your saver",
        prompt:
          "Implement saveAtomic for a contacts.json file. While a loop repeatedly saves, kill the process at a random moment (Ctrl+C) several times. Verify the file is always valid JSON after each kill. Then temporarily switch to plain writeFile and show at least one corrupted run.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["Kill during a large write makes corruption easier to observe.", "Always validate with JSON.parse after killing."],
        solution: `import { writeFile, rename, readFile } from "node:fs/promises";

export async function saveAtomic(file, data) {
  const tmp = file + ".tmp";
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, file);
}

// verify integrity at any time
export async function isValidJson(file) {
  try { JSON.parse(await readFile(file, "utf8")); return true; } catch { return false; }
}`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-contact-manager", "p1-file-organizer"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-buffers",
    slug: "buffers",
    title: "Buffers — Handling Binary Data",
    description:
      "Binary data in Node.js: alloc/from/concat, encodings, byteLength vs length, and why streams hand you Buffers.",
    order: 18,
    difficulty: "intermediate",
    estimatedMinutes: 18,
    tags: ["buffer", "binary", "encoding", "memory"],
    prerequisites: ["p1m4-fs-module", "p1m4-event-loop-node"],
    relatedTopics: ["p1m4-streams", "p1m4-reading-writing-files"],
    learningObjectives: [
      "Explain what a Buffer is and how it differs from a string and an ArrayBuffer",
      "Create buffers with alloc, from and concat",
      "Convert between Buffers and strings with explicit encodings",
      "Distinguish byteLength from length and know when Buffers appear",
    ],
    simpleExplanation:
      "JavaScript strings are sequences of UTF-16 code units — great for text, useless for files, images or sockets. A **Buffer** is Node.js's fixed-size chunk of raw bytes living outside the V8 heap. Files, streams and network sockets all hand you Buffers; you convert them to text with `.toString('utf8')` only when you actually want text.",
    detailedContent: `
**Buffer vs string vs ArrayBuffer**

| | String | Buffer | ArrayBuffer |
| --- | --- | --- | --- |
| Unit | UTF-16 code units | bytes | bytes |
| Memory | V8 heap, immutable | pre-allocated, outside heap | outside heap, shared via views |
| Belongs to | JS language | Node.js | JS language (Web API) |

**Creating**

    Buffer.alloc(8)            // 8 zero bytes (safe, initialised)
    Buffer.allocUnsafe(8)      // 8 bytes, UNINITIALISED — faster, may leak old data
    Buffer.from("hello")       // encode a string → bytes (default utf8)
    Buffer.from([1, 2, 255])   // from a byte array
    Buffer.concat([b1, b2])    // join chunks into one

Never use \`allocUnsafe\` for anything a user will see unless you overwrite every byte first — it can expose previous heap contents (a real class of security bugs).

**Encodings:** \`buf.toString('hex')\` → "68656c6c6f"; \`'base64'\` for data URLs/tokens; \`'utf8'\` default for text; \`'ascii'\`/\`'latin1'\` for raw single-byte use.

**byteLength vs length**

    Buffer.from("héllo").length          // 5 — BYTES (h=1, é=2, l=1, l=1, o=1)
    "héllo".length                       // 5 — UTF-16 code units (é counts 1)
    Buffer.byteLength("héllo", "utf8")   // 6 — wait: é is 2 bytes → 6
    // corrected: h(1)+é(2)+l(1)+l(1)+o(1) = 6 bytes; string length stays 5

Use \`Buffer.byteLength(str)\` whenever you must set a Content-Length header or enforce size limits — \`str.length\` lies about bytes for any non-ASCII character (emoji like 🚀 are 4 bytes each).

**Where Buffers appear:** every stream \`data\` event, every \`readFile\` without encoding, request bodies chunked over sockets, and \`http.IncomingMessage\` data.
    `,
    howItWorks: `
Buffers are allocated from a pool in one large slab; small buffers are slices of it (hence \`buf.byteOffset\` and \`buf.buffer\`). When a socket receives bytes, libuv writes them into pool memory and the stream emits that region as a Buffer. \`toString\` decodes bytes according to the encoding — decoding mid-character (if you split a multi-byte sequence across chunks) yields replacement characters (\\uFFFD), which is why proper text parsing of large streams must use a \`StringDecoder\` or \`setEncoding('utf8')\` on the stream.
    `,
    codeExamples: [
      {
        title: "Buffers, encodings and byteLength",
        language: "js",
        code: `// ESM example
const text = "NodePath 🚀";

const buf = Buffer.from(text, "utf8");
console.log("string.length (UTF-16 units):", text.length);          // 10
console.log("Buffer.byteLength (bytes):", Buffer.byteLength(text)); // 17
console.log("buffer.length (bytes):", buf.length);                  // 17

console.log("hex head:", buf.subarray(0, 4).toString("hex"));
console.log("base64:", buf.toString("base64"));

const joined = Buffer.concat([Buffer.from("hello "), Buffer.from("world")]);
console.log(joined.toString("utf8")); // hello world

// Content-Length done right
import { request } from "node:http";
const body = JSON.stringify({ note: "مرحبا" });
console.log("Content-Length must be:", Buffer.byteLength(body), "not", body.length);`,
        description:
          "The length vs byteLength difference is the classic Content-Length bug: using .length sends a header smaller than the actual UTF-8 body and clients hang waiting for bytes that never come.",
      },
    ],
    commonMistakes: [
      "Using str.length for Content-Length or upload limits — wrong for any non-ASCII text.",
      "Calling allocUnsafe for user-facing data without fully overwriting it (info leak).",
      "Concatenating many chunks with += on strings inside a stream — works, but for binary data you must Buffer.concat.",
      "Slicing multi-byte characters across chunk boundaries and getting \\uFFFD replacement characters.",
    ],
    bestPractices: [
      "Buffer.byteLength(string) for all size calculations.",
      "alloc() by default; allocUnsafe only with a proven reason.",
      "setEncoding('utf8') on readable streams when you will consume text chunk by chunk.",
      "Compare Buffers with .equals() (or timingSafeEqual for secrets) — === compares references.",
    ],
    realWorldUseCases: [
      "Uploading an image: request chunks arrive as Buffers; you concat or stream them straight to disk.",
      "JWT/HMAC verification needs constant-time Buffer comparison to avoid timing side channels.",
    ],
    resources: [
      docs("Node.js API — Buffer", "https://nodejs.org/api/buffer.html", "The complete Buffer reference.", "en", "reference"),
      docs("MDN — ArrayBuffer and views", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer", "How binary types relate in the wider JS ecosystem.", "en", "10 min"),
      ytSearch("Node.js Buffer explained encodings byteLength", "Binary data walkthroughs in Node.", "en", "10–18 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-bytes",
        title: "Prove length lies",
        prompt:
          "Measure str.length and Buffer.byteLength for: 'plain ascii', 'café', '日本語', and '🚀🚀🚀'. Tabulate results and write the rule of thumb you will use when setting Content-Length. Then verify with curl -v that your Node server sends a byte-accurate Content-Length for the emoji string.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Each emoji is 4 bytes in UTF-8 but 2 UTF-16 code units (length 2)."],
      },
      {
        id: "ex-p1m4-buffer-roundtrip",
        title: "Hex round-trip",
        prompt:
          "Convert any string to hex via Buffer, store the hex in a file, read it back, convert hex→Buffer→string, and confirm equality. Repeat with base64. Explain in one sentence why hex doubles the size.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Buffer.from(hex, 'hex') decodes back."],
      },
    ],
    projectIds: ["p1-weather-client", "p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-streams",
    slug: "streams",
    title: "Streams",
    description:
      "Readable, Writable, Duplex and Transform streams, pipe, backpressure basics and streaming large files.",
    order: 19,
    difficulty: "intermediate",
    estimatedMinutes: 20,
    tags: ["streams", "pipe", "backpressure", "memory"],
    prerequisites: ["p1m4-buffers", "p1m4-reading-writing-files"],
    relatedTopics: ["p1m4-http-module", "p1m4-error-handling-node"],
    learningObjectives: [
      "Identify the four stream types and give a real example of each",
      "Chain streams safely with pipe() and stream/promises pipeline()",
      "Explain backpressure in plain language and why it protects memory",
      "Stream a large file (or HTTP response) without buffering it entirely",
    ],
    simpleExplanation:
      "A stream processes data in chunks instead of all at once. Reading a 4 GB file with readFile puts 4 GB in memory; a readable stream hands it over piece by piece while a writable stream accepts pieces just as fast as it can — **backpressure** automatically slows the producer when the consumer falls behind. Pipes connect the two safely.",
    detailedContent: `
**The four types**

| Type | Direction | Real examples |
| --- | --- | --- |
| \`Readable\` | produce data | \`fs.createReadStream\`, \`req\` (HTTP request body) |
| \`Writable\` | consume data | \`fs.createWriteStream\`, \`res\` (HTTP response) |
| \`Duplex\` | both, independent sides | \`net.Socket\` (TCP) |
| \`Transform\` | modify on the way through | \`zlib.createGzip\`, crypto cipher streams |

**Two consumption styles**

    // 1) events (manual)
    rs.on("data", (chunk) => process(chunk));   // chunk is a Buffer
    rs.on("end", () => done());
    rs.on("error", fail);

    // 2) async iterator (modern, clean)
    for await (const chunk of rs) process(chunk);

    // 3) pipeline — the recommended way to CONNECT streams
    await pipeline(createReadStream("in.mp4"), createGzip(), createWriteStream("out.mp4.gz"));

**Backpressure, plainly:** a fast producer (disk) can outpace a slow consumer (network). The writable stream returns \`false\` from \`.write()\`; the readable **pauses** until \`drain\` fires. Data queues in a small buffer instead of your heap. \`pipe()\` wires this up automatically but historically swallowed errors — prefer \`stream/promises\`' \`pipeline\`, which propagates errors, destroys all streams and resolves/rejects as one unit.

**Transform example in one line of thought:** gzip is a Transform — bytes in, compressed bytes out — so you compose: read → gzip → write, with each stage applying backpressure to the previous one.
    `,
    howItWorks: `
Streams are EventEmitters under the hood. In flowing mode, \`data\` events push chunks as fast as possible *subject to* downstream demand; in paused mode (awaiting drain or iterating), no more events are emitted. \`pipeline(readable, ...transforms, writable)\` sets up listeners, wires pause/resume, and on error calls \`destroy()\` on every member so file descriptors are closed — something manual pipe chains forget, leaking fds over time.
    `,
    codeExamples: [
      {
        title: "Stream a large file with gzip (constant memory)",
        language: "js",
        code: `// ESM example
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

// Disk → readable → gzip transform → writable. Memory stays ~64 KB
// no matter how big source.bin is.
await pipeline(
  createReadStream("source.bin"),
  createGzip({ level: 6 }),
  createWriteStream("source.bin.gz"),
);
console.log("compressed via pipeline");`,
        description:
          "Swap any stage freely: add a Transform of your own by subclassing stream.Transform and implementing _transform(chunk, enc, cb).",
      },
      {
        title: "Manual events vs pipeline error handling",
        language: "js",
        code: `// CJS example — old style (error-prone)
const fs = require("node:fs");
const rs = fs.createReadStream("maybe-missing.txt");
rs.on("data", (chunk) => process.stdout.write(chunk));
rs.on("error", (err) => console.error("read failed:", err.code));

// Modern style — errors propagate automatically
const { pipeline } = require("node:stream/promises");
const { createWriteStream } = require("node:fs");

(async () => {
  try {
    await pipeline(fs.createReadStream("maybe-missing.txt"), createWriteStream("out.txt"));
  } catch (err) {
    console.error("pipeline failed:", err.code); // ENOENT caught here for ALL streams
  }
})();`,
        description:
          "pipe() without pipeline historically emitted an unhandled 'error' on one of the middle streams — always prefer pipeline() in new code.",
      },
    ],
    commonMistakes: [
      "Using readFile on multi-GB files and blaming Node for OOM crashes.",
      "Chaining with .pipe() and forgetting error handlers on each stream — errors vanish or crash the process.",
      "Calling rs.resume() or attaching 'data' when you meant to consume lazily — flowing mode starts immediately.",
      "Buffering stream chunks into an array 'for later' — you just re-created the memory problem streams solve.",
    ],
    bestPractices: [
      "pipeline() (or stream.promises) for every multi-stream operation.",
      "async iterators (for await) for consuming a stream inside business logic.",
      "Always destroy streams on abnormal shutdown; rely on pipeline for that.",
      "Prefer highWaterMark tuning only after measuring — defaults are sane.",
    ],
    realWorldUseCases: [
      "File upload endpoints stream request bodies to disk (Multer does this with streams) without size limits in RAM.",
      "S3-style downloads: proxy the source stream straight to res so the server never holds the file.",
      "Log shippers tail a file with a stream and forward chunks over a socket.",
    ],
    resources: [
      docs("Node.js API — Stream", "https://nodejs.org/api/stream.html", "Concepts, pipeline and backpressure — the canonical guide.", "en", "reference"),
      docs("Node.js — Node.js streams cheat sheet", "https://nodejs.org/en/learn/transformation/using-streams", "Practical patterns for readable/writable/transform.", "en", "12 min"),
      ytSearch("Node.js streams and backpressure explained", "Visual explanations of flowing mode and drain.", "en", "12–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-stream-copy",
        title: "Copy without loading",
        prompt:
          "Generate a large test file (a loop appending 50 MB) then copy it twice: (1) with readFile/writeFile and observe peak RSS from process.memoryUsage(), (2) with pipeline(). Compare the numbers and explain why they differ.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["Watch process.memoryUsage().rss during each copy with a setInterval logger."],
      },
      {
        id: "ex-p1m4-transform",
        title: "Build a Transform",
        prompt:
          "Create a Transform stream that uppercases ASCII letters as chunks flow through, and pipeline a text file through it into an output file. Verify with diff that only case changed. Bonus: make it skip characters when a flag object says so.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["import { Transform } from 'node:stream'; implement _transform(chunk, enc, cb)."],
        solution: `import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";

const upper = new Transform({
  transform(chunk, _enc, cb) {
    cb(null, chunk.toString("utf8").toUpperCase());
  },
});

await pipeline(createReadStream("in.txt"), upper, createWriteStream("out.txt"));`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-file-organizer", "p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-events-eventemitter",
    slug: "events-and-event-emitter",
    title: "Events and EventEmitter",
    description:
      "on/emit/off/once, error events, the max-listener memory-leak warning and real-world usage on HTTP servers.",
    order: 20,
    estimatedMinutes: 15,
    tags: ["events", "eventemitter", "observer-pattern"],
    prerequisites: ["p1m4-async-programming"],
    relatedTopics: ["p1m4-http-module", "p1m4-event-loop-node"],
    learningObjectives: [
      "Register, emit and remove listeners with on, once, emit and off",
      "Explain why an EventEmitter with no 'error' listener throws",
      "Recognise the MaxListenersExceededWarning and fix listener leaks",
      "Read Node's own event APIs (http server, streams, process) fluently",
    ],
    simpleExplanation:
      "An **EventEmitter** is Node's built-in pub/sub: objects emit named events, and any number of listeners can subscribe. HTTP servers, streams, sockets and even `process` are EventEmitters — learning `on`/`emit` once means you can drive all of Node's async objects with the same two methods.",
    detailedContent: `
**The API (from node:events)**

| Method | Behaviour |
| --- | --- |
| \`on(event, fn)\` / \`addListener\` | subscribe forever |
| \`once(event, fn)\` | subscribe for a single firing, then auto-remove |
| \`off(event, fn)\` / \`removeListener\` | unsubscribe (pass the SAME function reference) |
| \`emit(event, ...args)\` | run listeners now, synchronously, in registration order |
| \`removeAllListeners(event)\` | nuclear unsubscribe |
| \`listenerCount(event)\` | how many listeners are attached |
| \`setMaxListeners(n)\` | raise the default warning threshold (10) |

**The error rule:** \`emit('error', err)\` with **no** 'error' listener registered **throws** the error (crashing the process if unhandled). Always attach \`emitter.on('error', ...)\` if the emitter can fail.

**Memory-leak warning:** adding the same listener 11+ times triggers:

    (node) MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
    11 listeners added for [Server]. Consider using setMaxListeners()

Usually a sign you subscribe inside a per-request handler and never unsubscribe — listeners accumulate forever.

**Where you'll meet emitters:** \`server.on('request')\`, \`server.on('error')\`, \`res.on('close')\`, \`stream.on('drain')\`, \`process.on('uncaughtException')\`, \`readline.on('line')\`, and your own domain objects (\`cart.on('item-added')\`).
    `,
    howItWorks: `
\`emit\` is purely synchronous: it loops through the listener array and calls each function before returning. That means listeners run on the same tick, in order, and an exception in listener #1 prevents listener #2 from running (unless you wrap it). Because \`emit\` returns a boolean (were there listeners?), you can use it as a query: \`if (!emitter.emit('cancel')) { /* nobody cared — default action */ }\` — a pattern used by Node's own APIs.
    `,
    codeExamples: [
      {
        title: "A small domain emitter done right",
        language: "js",
        code: `// ESM example
import { EventEmitter } from "node:events";

export class TaskQueue extends EventEmitter {
  #queue = [];

  add(task) {
    if (!task || typeof task !== "object") {
      // always provide an error listener path — see below
      return this.emit("error", new TypeError("task must be an object"));
    }
    this.#queue.push(task);
    this.emit("added", task);
  }

  drainOne() {
    const task = this.#queue.shift();
    if (task) this.emit("drained", task);
    return task;
  }
}

const q = new TaskQueue();
q.on("error", (err) => console.error("queue error:", err.message)); // REQUIRED
q.once("added", (t) => console.log("first task ever:", t.title));
q.on("added", (t) => console.log("added:", t.title));

q.add({ title: "write tests" });
q.add({ title: "ship" });
q.add("bad"); // → queue error: task must be an object`,
        description:
          "once for one-shot notifications, on for ongoing ones, and a mandatory error listener — the three habits of safe emitters.",
      },
      {
        title: "HTTP server events in the wild",
        language: "js",
        code: `// ESM example
import http from "node:http";

const server = http.createServer((req, res) => res.end("ok"));

server.on("listening", () => console.log("listening on", server.address().port));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") console.error("port busy");
  else console.error(err);
});
server.on("connection", (socket) => console.log("peer:", socket.remoteAddress));
server.on("request", (req, res) => {
  res.on("close", () => console.log(req.method, req.url, "finished"));
});

server.listen(3000);`,
        description:
          "Every Node network API exposes lifecycle through events — this is the same EventEmitter class you use yourself.",
      },
    ],
    commonMistakes: [
      "Removing a listener with an anonymous arrow — you cannot reference it later; pass the same named function.",
      "Emitting 'error' with no listener and being shocked when the process crashes.",
      "Subscribing on every request without unsubscribing — MaxListenersExceededWarning and real memory growth.",
      "Assuming emit is async — listeners run synchronously; heavy work in a listener still blocks the loop.",
    ],
    bestPractices: [
      "Always register an 'error' listener before emitting errors.",
      "Pair on() with off() in teardown (route exit, socket close, component unmount).",
      "Emit small immutable payloads; don't hand out objects you keep mutating.",
      "Use domain-specific event names ('task:added') to avoid clashing with Node's reserved ones.",
    ],
    realWorldUseCases: [
      "Metrics: an HTTP server emits 'request'; a logger subscribes without the handler knowing about logging.",
      "CLI progress: a downloader emits 'progress'; the readline UI renders it; Ctrl+C off()s cleanly.",
    ],
    resources: [
      docs("Node.js API — Events / EventEmitter", "https://nodejs.org/api/events.html", "Full emitter reference including error semantics.", "en", "15 min"),
      docs("Node.js — The Node.js Event Loop", "https://nodejs.org/en/learn/asynchronous/event-loop-timers-and-nexttick", "Context for where emitted callbacks execute.", "en", "12 min"),
      ytSearch("Node.js EventEmitter tutorial", "Emitter patterns with real server examples.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-emitter",
        title: "Design a tiny bus",
        prompt:
          "Build an EventBus with on/once/off/emit. Emit 'user:login' with a payload; verify once fires exactly once across two emits; then remove a permanent listener and confirm it no longer fires. Also demonstrate the error crash by emitting 'error' with no listener (run it knowing it will crash).",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Store listeners in a Map<eventName, Set<fn>>.", "Run the error demo in its own script so it does not kill your tests."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-http-module",
    slug: "the-http-module",
    title: "The http Module",
    description:
      "createServer, the req and res objects, headers, status codes and keep-alive connections.",
    order: 21,
    estimatedMinutes: 18,
    tags: ["http", "server", "req", "res", "keep-alive"],
    prerequisites: ["p1m4-events-eventemitter", "p1m1-http", "p1m1-requests-responses"],
    relatedTopics: ["p1m4-basic-http-server", "p1m4-streams"],
    learningObjectives: [
      "Create a server with http.createServer and respond correctly",
      "Read method, url, headers from req and write status/headers/body to res",
      "Set headers and status codes in the right order",
      "Explain HTTP keep-alive and Node's server timeouts",
    ],
    simpleExplanation:
      "`http.createServer(callback)` returns a server that emits a `request` event for every incoming HTTP request. Your callback receives two objects: `req` (a readable stream with method, url and headers) and `res` (a writable stream where you set the status, headers and body). Express, Fastify and Koa all wrap exactly this.",
    detailedContent: `
**Request (IncomingMessage) essentials**

| Property | Example |
| --- | --- |
| \`req.method\` | "GET" |
| \`req.url\` | "/api/users?page=2" (path + query only, no host) |
| \`req.headers\` | lower-cased keys; \`set-cookie\` is an array |
| \`req.httpVersion\` | "1.1" |
| body | a **readable stream** — you must consume it |

**Response (ServerResponse) essentials**

    res.statusCode = 201;                       // status BEFORE any body byte
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-store");
    res.end(JSON.stringify({ ok: true }));      // flushes and finishes

Or all at once: \`res.writeHead(200, { "content-type": "text/plain" })\`. After the first \`write\`/\`end\`, headers are on the wire — they can no longer be changed (later attempts throw "Cannot set headers after they are sent").

**Keep-alive (HTTP/1.1 default):** browsers reuse one TCP connection for many requests, saving a TCP handshake each time. Node's server keeps connections open with \`server.keepAliveTimeout\` (default 5 s in recent versions) and \`server.headersTimeout\`. If your reverse proxy's timeout is longer than Node's, you'll see occasional 502s when Node closes a connection the proxy still wanted to reuse — set them consistently.

**Also listen for:** \`server.on('error')\` (EADDRINUSE), \`server.on('close')\`, and \`req.on('aborted')\`/\`res.on('close')\` for clients that hang up mid-response.
    `,
    howItWorks: `
Node parses the raw TCP bytes: status line, headers, then streams the body into \`req\`. Your handler may respond before the request body finishes (bodies are lazily consumed). When you \`end\` the response, Node serialises status+headers+body to the socket; with keep-alive the connection stays open for the next request on the same socket. The callback you pass to createServer is bound as a \`request\` listener — nothing more magical than an EventEmitter handler.
    `,
    codeExamples: [
      {
        title: "A correct minimal HTTP server",
        language: "js",
        code: `// ESM example
import http from "node:http";

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }

  if (req.method === "POST" && req.url === "/echo") {
    let bytes = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > 1_000_000) req.destroy(); // 1 MB body limit
      chunks.push(chunk);
    });
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ echoed: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", () => res.destroy());
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "NOT_FOUND" }));
});

server.on("error", (err) => console.error(err.code));
server.listen(3000, () => console.log("http://127.0.0.1:3000"));`,
        description:
          "Note: headers before body, body-limit on the request stream, and an error listener on the server — the three habits that prevent most production incidents.",
      },
    ],
    commonMistakes: [
      "Setting headers after end() — throws or silently corrupts the response.",
      "Forgetting to consume the request body: the 'end' event never fires and the request hangs.",
      "Logging res.end() before headers are set with writeHead on a second call — must call writeHead first.",
      "Mismatched keep-alive timeouts between Nginx and Node causing intermittent 502s.",
    ],
    bestPractices: [
      "Always set an explicit content-type (and content-length when possible).",
      "Enforce a body size limit before buffering.",
      "Handle server 'error' — especially EADDRINUSE.",
      "In production, terminate TLS and compression at a reverse proxy; keep Node on plain HTTP inside.",
    ],
    realWorldUseCases: [
      "The p1-basic-http-server project: routing, JSON helpers and health checks on top of this exact API.",
      "Sidecar health endpoints (/health) that orchestrators probe every few seconds.",
    ],
    resources: [
      docs("Node.js API — http", "https://nodejs.org/api/http.html", "createServer, IncomingMessage, ServerResponse, timeouts.", "en", "reference"),
      docs("Node.js — Build an HTTP server", "https://nodejs.org/en/learn/getting-started/an-introduction-to-the-nodejs-http-module", "Official step-by-step http tutorial.", "en", "15 min"),
      ytSearch("Node.js http module createServer tutorial", "Raw http server walkthroughs before Express.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-http-headers",
        title: "Headers before body",
        prompt:
          "Write a server that (1) responds 405 with an Allow header for unknown methods, (2) sets an ETag on GET /item and answers 304 when If-None-Match matches, (3) sends chunked output using res.write() five times with 100ms delays. Verify with curl -v.",
        difficulty: "beginner",
        estimatedMinutes: 35,
        hints: ["res.write() before res.end() creates a streamed body.", "ETag can be a simple hash of the payload."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-basic-http-server",
    slug: "building-a-basic-http-server",
    title: "Building a Basic HTTP Server",
    description:
      "Assemble a full minimal server with a router and JSON helper — the direct foundation of the p1-basic-http-server project.",
    order: 22,
    estimatedMinutes: 22,
    tags: ["http", "router", "json", "api"],
    prerequisites: ["p1m4-http-module", "p1m4-path-module", "p1m1-methods", "p1m1-status-codes"],
    relatedTopics: ["p1m1-rest", "p1m4-error-handling-node"],
    learningObjectives: [
      "Structure a plain-Node server: router, handlers, JSON helper, error boundary",
      "Parse method, pathname and query without a framework",
      "Read JSON bodies safely with a size limit and validation",
      "Return consistent status codes and error shapes",
    ],
    simpleExplanation:
      "Everything Express does, in miniature: take the raw `req`, work out the **method + path**, look up a handler in a **routes table**, run it, and write back a JSON response through one small helper. Building this once by hand teaches you exactly what a framework is buying — and makes the p1-basic-http-server project straightforward.",
    detailedContent: `
**Anatomy of a minimal but real server**

1. **JSON helper** — one function that sets status + content-type + stringifies.
2. **Body reader** — collect chunks with a hard size limit; parse JSON safely (never let JSON.parse throw out of the handler).
3. **Router** — a plain object/array of \`METHOD + pattern → handler\`. Exact matches first; then simple \`:param\` segments.
4. **Handlers** — pure-ish functions: (req, params, body) → { status, body }.
5. **Error boundary** — wrap handler execution; on throw, log to stderr and return 500 with a generic message (never leak stack traces).
6. **404/405** — unknown path → 404; known path, wrong method → 405 with \`Allow\`.

**Router sketch**

    const routes = {
      "GET /notes": listNotes,
      "GET /notes/:id": getNote,
      "POST /notes": createNote,
      "DELETE /notes/:id": deleteNote,
    };

Match by splitting \`pathname.split('/')\` and comparing segment counts, substituting \`:id\` captures into a params object.

**Response shape convention** — data on success, machine-readable error key on failure:

    { "data": [...] }              → 200
    { "id": "1", ... }             → 201
                                  → 204 (no body)
    { "error": "NOTE_NOT_FOUND" }  → 404
    `,
    howItWorks: `
For every request Node gives you \`req.url\` (path+query) and \`req.method\`. You parse it with the built-in \`new URL(req.url, 'http://localhost')\` — this splits \`pathname\` from \`searchParams\` for free, including correct percent-decoding. Look up \`METHOD + ' ' + pathname\` in your table (normalise trailing slashes first), read the body if the method allows one, call the handler, and write the result. Everything else — middleware, static files, validation — is this loop with more layers.
    `,
    codeExamples: [
      {
        title: "Router + JSON helper (complete minimal server)",
        language: "js",
        code: `// ESM example — server.js
import http from "node:http";

let notes = [{ id: "1", title: "Learn Node" }];

const send = (res, status, body) => {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
};

const readJson = (req, limit = 1_000_000) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        req.destroy();
        reject(Object.assign(new Error("payload too large"), { status: 413 }));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(Object.assign(new Error("invalid json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });

const routes = {
  "GET /notes": () => ({ status: 200, body: { data: notes } }),
  "POST /notes": async (req) => {
    const body = await readJson(req);
    if (!body.title) return { status: 400, body: { error: "TITLE_REQUIRED" } };
    const note = { id: String(notes.length + 1), title: body.title };
    notes.push(note);
    return { status: 201, body: note };
  },
  "DELETE /notes/:id": (_req, params) => {
    const before = notes.length;
    notes = notes.filter((n) => n.id !== params.id);
    return notes.length < before ? { status: 204 } : { status: 404, body: { error: "NOTE_NOT_FOUND" } };
  },
};

const match = (method, pathname) => {
  const path = pathname.replace(/\\/+$/, "") || "/";
  const direct = routes[\`\${method} \${path}\`];
  if (direct) return { handler: direct, params: {} };
  const segments = path.split("/");
  for (const key of Object.keys(routes)) {
    const [m, pattern] = key.split(" ");
    if (m !== method) continue;
    const p = pattern.split("/");
    if (p.length !== segments.length) continue;
    const params = {};
    const ok = p.every((seg, i) => (seg.startsWith(":") ? (params[seg.slice(1)] = segments[i]) : seg === segments[i]));
    if (ok) return { handler: routes[key], params };
  }
  return null;
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const found = match(req.method, url.pathname);
    if (!found) return send(res, 404, { error: "NOT_FOUND" });
    const result = await found.handler(req, found.params, url);
    if (result?.status === 204) return res.writeHead(204).end();
    send(res, result?.status ?? 200, result?.body);
  } catch (err) {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    send(res, status, { error: status >= 500 ? "INTERNAL_ERROR" : err.message });
  }
});

server.listen(3000, () => console.log("http://127.0.0.1:3000"));`,
        description:
          "Paste, run, then: curl http://127.0.0.1:3000/notes and curl -X POST -H \"content-type: application/json\" -d '{\"title\":\"x\"}' http://127.0.0.1:3000/notes. This file is the skeleton of the p1-basic-http-server project.",
      },
    ],
    commonMistakes: [
      "Returning HTML error pages from an API — clients cannot parse them; always JSON.",
      "Letting JSON.parse throw out of the handler without a catch — the connection hangs with no response.",
      "Forgetting 405/Allow, so clients think a resource is missing when the method was wrong.",
      "Leaking err.stack to clients — log it, send a generic INTERNAL_ERROR.",
    ],
    bestPractices: [
      "One send() helper for every response — consistent headers become automatic.",
      "Validate body size and content-type before parsing.",
      "Use new URL() instead of manual string splitting for query strings and decoding.",
      "Log errors with a request id so 500s can be traced to a line in the logs.",
    ],
    realWorldUseCases: [
      "The p1-basic-http-server project milestone: in-memory CRUD with this exact structure.",
      "Sidecar utilities and internal health endpoints where adding Express would be overkill.",
    ],
    resources: [
      docs("Node.js — Build an HTTP server", "https://nodejs.org/en/learn/getting-started/an-introduction-to-the-nodejs-http-module", "Official tutorial this lesson extends.", "en", "15 min"),
      docs("Node.js API — class http.Server", "https://nodejs.org/api/http.html#class-httpserver", "Server events, timeouts and keep-alive settings.", "en", "10 min"),
      ytSearch("Node.js REST API without Express", "Plain http module CRUD servers.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-router",
        title: "Extend the router",
        prompt:
          "Add PATCH /notes/:id (partial update) and GET /notes?limit=n (cap the list) to the server above. Also make POST /notes reject bodies whose content-type is not application/json with 415. Verify everything with curl -v and record the status codes you observed.",
        difficulty: "beginner",
        estimatedMinutes: 40,
        hints: ["url.searchParams.get('limit') after new URL().", "Set status 405 + allow header for known paths called with the wrong method."],
      },
      {
        id: "ex-p1m4-error-boundary",
        title: "Crash on purpose",
        prompt:
          "Add a /boom route that throws new Error('secret detail'). Confirm the client receives only {\"error\":\"INTERNAL_ERROR\"} while the terminal shows the full stack. Then remove the try/catch and observe the connection dying without a response — explain why a global error boundary matters.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["An exception escaping the async handler leaves res unanswered — the socket hangs."],
        solution: `const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/boom") throw new Error("secret detail");
    send(res, 200, { ok: true });
  } catch (err) {
    console.error(err);                       // full stack in logs only
    send(res, 500, { error: "INTERNAL_ERROR" }); // generic message to the client
  }
});`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-contact-manager"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-error-handling-node",
    slug: "error-handling-in-node",
    title: "Error Handling in Node.js",
    description:
      "uncaughtException, unhandledRejection, graceful failure policy — and why try/catch cannot catch everything.",
    order: 23,
    estimatedMinutes: 17,
    tags: ["errors", "uncaught-exception", "rejections", "reliability"],
    prerequisites: ["p1m4-async-programming", "p1m4-events-eventemitter"],
    relatedTopics: ["p1m4-basic-http-server", "p1m4-debugging-node"],
    learningObjectives: [
      "Explain what try/catch can and cannot catch in Node.js",
      "Handle unhandled promise rejections and uncaught exceptions deliberately",
      "Design a graceful-failure policy for a server",
      "Recognise why process.exit is a last resort, not a fix",
    ],
    simpleExplanation:
      "`try/catch` only sees errors inside the same call stack (or awaited promises) you wrapped. Errors thrown in timers, event listeners, or promises nobody awaited fly past it — Node catches those with global handlers: `process.on('uncaughtException')` and `process.on('unhandledRejection')`. A production service should log them, stop accepting new work, and exit cleanly so the supervisor restarts it.",
    detailedContent: `
**What try/catch misses**

| Error source | Caught by try/catch? |
| --- | --- |
| Synchronous throw in the same function | yes |
| \`await\`ed promise rejection | yes |
| \`setTimeout(cb)\` callback that throws | **no** (different tick) |
| Event listener (\`req.on('data')\`) that throws | **no** |
| Promise rejection with no .catch and no await | **no** → unhandledRejection |
| Error thrown in a nextTick/microtask | **no** (unless awaited at creation) |

**The global backstops**

    process.on("unhandledRejection", (reason, promise) => { ... });
    process.on("uncaughtException", (err) => { ... });

\`uncaughtException\` / \`unhandledRejection\` leave the process in an **unknown state**. The official guidance is: treat them as fatal — log synchronously (stderr), stop accepting connections (\`server.close()\`), give in-flight requests a short grace period, then exit non-zero and let your supervisor (systemd, Docker restart policy, PM2, Kubernetes) start a fresh process. Continuing to run after an uncaught exception risks corrupted state and phantom hangs.

**Graceful failure policy (server)**

1. Log the error with full stack to stderr.
2. \`server.close()\` — stop new connections; existing ones finish.
3. Set a timer (e.g. 10–30 s) to \`process.exit(1)\` if shutdown hangs.
4. Optionally drain the event loop (destroy idle sockets).
    `,
    howItWorks: `
Node wires \`process\` (an EventEmitter) to V8's fatal error hooks and to libuv's unhandled-rejection detection. When a rejection's microtask queue drains with no handler attached, Node emits \`unhandledRejection\`; if a \`.catch\` is attached later (e.g. in the same tick after \`queueMicrotask\` tricks), it can still be handled — but never rely on that. Modern Node (15+) **crashes by default** on unhandled rejections; you must opt out with a handler or \`--unhandled-rejections=warn\`, a flag you should think of as taking off your seatbelt.
    `,
    codeExamples: [
      {
        title: "A graceful shutdown policy",
        language: "js",
        code: `// ESM example
import http from "node:http";

const server = http.createServer((req, res) => res.end("ok"));
server.listen(3000);

function shutdown(reason, code) {
  console.error(\`FATAL: \${reason}\`);
  server.close(() => process.exit(code)); // stop accepting; existing requests finish
  setTimeout(() => process.exit(code), 15_000).unref(); // hard deadline
}

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err.stack ?? err);
  shutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
  shutdown("unhandledRejection", 1);
});`,
        description:
          "Log first (console.error is synchronous on stderr), then close, then a bounded exit. The .unref() timer will not keep an otherwise-finished process alive.",
      },
      {
        title: "Catch where the error actually happens",
        language: "js",
        code: `// CJS example — WRONG vs RIGHT placement of try/catch

// WRONG: catches only synchronous throws inside this block
try {
  setTimeout(() => {
    JSON.parse("{oops"); // escapes the try/catch entirely!
  }, 0);
} catch (err) {
  console.error("never happens");
}

// RIGHT: handle inside the callback (or process-level backstops)
setTimeout(() => {
  try {
    JSON.parse("{oops");
  } catch (err) {
    console.error("handled locally:", err.message);
  }
}, 0);

// Promise: await inside try, or attach .catch
Promise.reject(new Error("nope")).catch((e) => console.error("handled:", e.message));`,
        description:
          "This is the single most misunderstood error-handling fact for newcomers: try/catch does not travel across time (ticks), only across the synchronous call stack and awaited promises.",
      },
    ],
    commonMistakes: [
      "Wrapping setTimeout/emit callbacks in try/catch expecting protection — the stack is gone by then.",
      "Adding an uncaughtException handler and continuing as if nothing happened (state may be corrupt).",
      "Swallowing rejections with empty .catch(() => {}) — bugs become invisible.",
      "Assuming Express's default error middleware catches everything — unhandled rejections outside the request cycle still hit the process.",
    ],
    bestPractices: [
      "Handle errors at the nearest point where you can still do something useful; let the rest bubble to the global handlers.",
      "Never run production servers without an unhandledRejection strategy.",
      "Log to stderr with stacks; return generic 500 bodies.",
      "Rely on a supervisor to restart — your job is a clean, fast exit, not self-healing.",
    ],
    realWorldUseCases: [
      "Kubernetes restarts a pod exactly because Node exits on fatal errors — the two work as one system.",
      "A payment worker crashes instead of double-charging after an unexpected state corruption.",
    ],
    resources: [
      docs("Node.js API — process: error events", "https://nodejs.org/api/process.html#event-uncaughtexception", "uncaughtException and unhandledRejection semantics.", "en", "12 min"),
      docs("Node.js — Best practices: error handling", "https://nodejs.org/en/learn/getting-started/error-handling", "Official guidance on handling failures.", "en", "10 min"),
      ytSearch("Node.js error handling uncaughtException unhandledRejection", "Failure-policy walkthroughs for servers.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-error-policy",
        title: "Map your catches",
        prompt:
          "Take any 50-line script you have written and mark every line where a throw could originate. Circle the ones your existing try/catch would miss. Then add global handlers that log and exit 1, and prove they work by triggering one missed case.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Promise.reject() with no handler is the easiest proof.", "Watch the process exit code with echo $LASTEXITCODE."],
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-weather-client"],
    quizId: "quiz-p1-m4",
  },
  {
    ...shared,
    id: "p1m4-debugging-node",
    slug: "debugging-nodejs",
    title: "Debugging Node.js",
    description:
      "node --inspect, chrome://inspect, VS Code attach, console vs debugger, and a first look at profiling.",
    order: 24,
    estimatedMinutes: 16,
    tags: ["debugging", "inspect", "vscode", "profiling"],
    prerequisites: ["p1m4-what-is-nodejs", "p1m3-vscode-setup"],
    relatedTopics: ["p1m4-error-handling-node", "p1m2-debugging-javascript"],
    learningObjectives: [
      "Start a process with node --inspect and attach a debugger",
      "Use VS Code launch/attach configurations for Node.js",
      "Decide between console.log, debugger statement and conditional breakpoints",
      "Generate a CPU profile to find a hot function",
    ],
    simpleExplanation:
      "Node.js can pause execution exactly like the browser DevTools you know: start your script with `--inspect`, attach via `chrome://inspect` or VS Code, and step through breakpoints while watching variables. When logging is not enough, a **CPU profile** shows which functions eat the most time.",
    detailedContent: `
**Three debugging entry points**

1. **\`node --inspect[=port]\`** — starts the V8 Inspector on a WebSocket endpoint (default 9229) and runs the script. \`node --inspect-brk file.js\` pauses *before* your first line — essential for catching startup bugs.
2. **chrome://inspect** (Chrome/Edge) — auto-discovers local Node targets; click *inspect* for the full DevTools: call stack, watch, conditional breakpoints, blackboxing node internals.
3. **VS Code** — Run & Debug → the Node.js environment autodetects a running inspector, or add a launch config:

    {
      "version": "0.2.0",
      "configurations": [
        { "type": "node", "request": "launch", "name": "run file",
          "skipFiles": ["<node_internals>/**"], "program": "\${workspaceFolder}/src/app.js" },
        { "type": "node", "request": "attach", "name": "attach :9229",
          "port": 9229, "skipFiles": ["<node_internals>/**"] }
      ]
    }

**console vs debugger**

- \`console.log\` — great for “what is the value now” and for production logs; noisy and code-touching for exploration.
- \`debugger\` statement — pauses when attached; does nothing when not (Node ignores it without --inspect... actually it throws only in ESM without inspector? Safe rule: it is inert when no debugger is attached).
- Breakpoints (IDE/gutter) — pause without editing code; **conditional breakpoints** are the superpower (\`count > 100\`).

**Profiling intro:** \`node --cpu-prof file.js\` writes a \`.cpuprofile\` you load into Chrome DevTools' Performance panel (or use VS Code's profiler). Look for functions with high *self time* — those are your real bottlenecks, not the code you *think* is slow.
    `,
    howItWorks: `
The inspector speaks the Chrome DevTools Protocol over WebSocket: your client (Chrome or VS Code) sends commands (set breakpoint, evaluate expression) and receives events (paused, console). Because the protocol is standard, any DevTools-compatible client works with any Node process. \`--inspect\` does not slow your code much when no client is attached, but never expose port 9229 publicly — anyone who can reach it has full control of your process (bind with \`--inspect=127.0.0.1:9229\` which is the default).
    `,
    codeExamples: [
      {
        title: "Attach from the terminal and from VS Code",
        language: "bash",
        code: `# Terminal 1: start with inspection, break on first line
node --inspect-brk server.js

# Terminal 2 (alternative to a GUI): Node's built-in REPL debugger
# open chrome://inspect in Chrome and click "inspect" next to your target

# One-off CPU profile of a script
node --cpu-prof profile.js     # writes profile.cpuprofile
node --cpu-prof-dir=profiles profile.js`,
        description:
          "--inspect-brk waits for an attachment before running — use it for bugs in module top-level code, --inspect for long-running servers.",
      },
      {
        title: "debugger statement vs console.log",
        language: "js",
        code: `// CJS example — attach with VS Code or chrome://inspect
function total(items) {
  let sum = 0;
  for (const item of items) {
    if (item.qty > 5) {
      debugger; // pauses here when attached; inert otherwise
      sum += item.price * item.qty;
    } else {
      sum += item.price * item.qty;
    }
  }
  return sum;
}

console.log(total([{ price: 10, qty: 7 }, { price: 2, qty: 1 }]));`,
        description:
          "At the pause you can evaluate item, step over, and add watch expressions — far richer than scattering console.log through the loop.",
      },
    ],
    commonMistakes: [
      "Exposing --inspect on 0.0.0.0 in production — the inspector port is effectively a root shell.",
      "Leaving --inspect-brk on a script nobody will attach to: the process appears to 'hang' at startup.",
      "Debugging production-only bugs with console.log alone — use structured logs or a heap/CPU profile.",
      "Assuming debugger pauses when nothing is attached — without an inspector client it does nothing (and in strict setups may throw).",
    ],
    bestPractices: [
      "Use conditional breakpoints before adding temporary logs to hot paths.",
      "skipFiles: ['<node_internals>/**'] in VS Code keeps the stack readable.",
      "Profile before optimising: --cpu-prof + DevTools performance view finds the truth.",
      "Bind the inspector to 127.0.0.1 and tunnel (SSH) if you must debug remotely.",
    ],
    realWorldUseCases: [
      "Reproducing a dev-only race: --inspect-brk + step through the event-loop callbacks.",
      "A slow nightly job: generate a CPU profile and discover 80% of time in JSON.parse of one giant file.",
    ],
    resources: [
      docs("Node.js — Debugging — Getting started", "https://nodejs.org/en/learn/getting-started/debugging-nodejs", "Official inspector walkthrough (Chrome + VS Code).", "en", "12 min"),
      docs("Node.js API — CLI: --inspect", "https://nodejs.org/api/cli.html#--inspecthostport", "All inspector flags including --inspect-brk.", "en", "8 min"),
      ytSearch("debugging Node.js with VS Code inspect", "End-to-end attach demos.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m4-attach",
        title: "Attach and inspect",
        prompt:
          "Run any script with node --inspect-brk, attach via VS Code (Attach on port 9229) or chrome://inspect, and hit a breakpoint inside a function. Evaluate two expressions in the debug console, set one conditional breakpoint, and confirm the condition works. Finally run --cpu-prof on a script with a slow loop and open the .cpuprofile in Chrome DevTools.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["In VS Code use Run → Start Debugging → 'attach :9229' after starting the process.", "Chrome: open the .cpuprofile via the Performance panel's Load profile button."],
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-weather-client"],
    quizId: "quiz-p1-m4",
  },
];

export const quiz: Quiz = {
  id: "quiz-p1-m4",
  moduleId: "p1-m4",
  title: "Module 4 quiz — Node.js core fundamentals",
  description:
    "Test your understanding of the Node.js runtime, architecture, event loop, modules, process, files, paths, buffers, streams, events and HTTP.",
  questions: [
    {
      id: "q-p1m4-1",
      type: "multiple-choice",
      prompt: "What does it mean that \"Node.js is a JavaScript runtime\"?",
      options: [
        "It is a special web browser that executes JavaScript on the server",
        "It embeds the V8 engine and adds server-side APIs (fs, net, process, …) so JavaScript can run outside the browser",
        "It is a package manager that installs JavaScript libraries",
        "It converts JavaScript into another language before running it",
      ],
      correctIndex: 1,
      explanation:
        "A runtime is the environment that executes code: Node.js bundles Google's V8 (the JavaScript engine) plus a standard library of non-browser APIs and the libuv async I/O layer. It is not a browser, not npm, and it runs your JavaScript directly (V8 compiles it just in time).",
      optionExplanations: [
        "Node.js has no browser UI or DOM — it is a standalone program, not a browser.",
        "Correct — V8 executes the language; Node adds fs, http, process and friends.",
        "npm is the package manager that ships with Node.js, not Node.js itself.",
        "V8 JIT-compiles JavaScript to machine code internally, but you still write and run JavaScript.",
      ],
    },
    {
      id: "q-p1m4-2",
      type: "code-output",
      prompt: "What is the exact output order of this script?",
      code: `const fs = require("node:fs");

console.log("start");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
process.nextTick(() => console.log("nextTick"));
console.log("end");`,
      language: "js",
      options: [
        "start, end, nextTick, immediate, timeout",
        "start, end, nextTick, timeout, immediate",
        "start, end, immediate, nextTick, timeout",
        "start, nextTick, end, immediate, timeout",
      ],
      correctIndex: 0,
      explanation:
        "Top-level sync code runs first (start, end). The nextTick queue drains before the event loop starts. The I/O callback runs in the poll phase; setImmediate is queued for the check phase, which runs immediately after poll, while setTimeout(0) waits for the timers phase of the next iteration.",
      optionExplanations: [
        "Correct — sync → nextTick → poll callback → check (immediate) → timers (timeout).",
        "setImmediate beats a zero-delay timer when both are scheduled inside an I/O callback.",
        "process.nextTick always drains before the loop phases begin.",
        "All sync top-level statements finish before nextTick callbacks run.",
      ],
    },
    {
      id: "q-p1m4-3",
      type: "code-output",
      prompt: "What does this script print?",
      code: `const fs = require("node:fs");

fs.writeFileSync("log.txt", "");
for (let i = 1; i <= 3; i++) {
  fs.appendFileSync("log.txt", String(i));
}
fs.readFile("log.txt", "utf8", (err, data) => console.log("async:", data));
console.log("sync:", fs.readFileSync("log.txt", "utf8"));`,
      language: "js",
      options: [
        "sync: 123 then async: 123",
        "async: 123 then sync: 123",
        "sync: 123 then async: 123 then sync: 123",
        "It throws because appendFileSync does not exist",
      ],
      correctIndex: 0,
      explanation:
        "All *Sync fs calls block the main thread and complete immediately, so the writes finish and the sync read prints first. The async readFile callback is delivered via the event loop on a later tick, printing the same content afterwards.",
      optionExplanations: [
        "Correct — synchronous fs calls run inline; the async callback waits for the event loop.",
        "The async callback cannot run before the synchronous code below it finishes.",
        "fs.readFile is called once, so 'async:' prints exactly once.",
        "appendFileSync exists; the file ends up containing 123 from the three appends.",
      ],
    },
    {
      id: "q-p1m4-4",
      type: "find-bug",
      prompt:
        "This works when you run `node load.js` from the project root but crashes with ENOENT when run from the src/ folder where load.js lives. What is wrong?",
      code: `const fs = require("node:fs");

function loadUsers() {
  return JSON.parse(fs.readFileSync("users.json", "utf8"));
}

console.log(loadUsers());`,
      language: "js",
      options: [
        "JSON.parse cannot read files — you must pass the file path to JSON.parse instead",
        "readFileSync resolves relative paths against process.cwd(), not the script's directory; build the path from __dirname",
        "readFileSync always throws — you must use fs.promises.readFile",
        "The file must be named users.json.js for Node.js to find it",
      ],
      correctIndex: 1,
      explanation:
        "Relative paths given to fs are resolved from the process's current working directory, which changes with wherever you launched node — not where the script file lives. Anchoring with path.join(__dirname, 'users.json') (CJS) or fileURLToPath(import.meta.url) (ESM) fixes it.",
      optionExplanations: [
        "JSON.parse parses strings; readFileSync is still the right API — the path is the problem.",
        "Correct — cwd-relative resolution; __dirname (or import.meta.url) is script-relative.",
        "readFileSync works fine and is the right choice for small startup reads.",
        "Node.js does not append extensions to explicit file paths passed to fs.",
      ],
    },
    {
      id: "q-p1m4-5",
      type: "multiple-choice",
      prompt: "Which statement about ES modules and CommonJS in Node.js is true?",
      options: [
        "ESM import declarations are hoisted and evaluated before the importing module's body runs; require() runs at the exact line where it appears",
        "require() can be used inside .mjs files without any setup",
        "import statements execute strictly top-to-bottom in order with the rest of the code, with no hoisting",
        "Setting \"type\": \"module\" only affects TypeScript compilation, not Node.js itself",
      ],
      correctIndex: 0,
      explanation:
        "ESM imports are static declarations: Node resolves and evaluates the module graph before the importing module's body executes. CommonJS require is an ordinary function call, so it runs when that line is reached and can be used conditionally.",
      optionExplanations: [
        "Correct — static hoisting vs runtime require calls.",
        ".mjs is ESM-only; require is not defined there (use dynamic import()).",
        "Hoisting is precisely the difference: imports run first.",
        "The type field is read by Node.js at runtime to pick the module system for .js files.",
      ],
    },
    {
      id: "q-p1m4-6",
      type: "code-output",
      prompt: "What is the output of this script?",
      code: `console.log("A");
setTimeout(() => console.log("B"), 10);
const start = Date.now();
while (Date.now() - start < 50) {}
console.log("C");`,
      language: "js",
      options: [
        "A, then C, then B",
        "A, then B, then C",
        "A, B and C all printed together after 50ms",
        "The busy loop crashes the event loop, so B is never printed",
      ],
      correctIndex: 0,
      explanation:
        "The while loop synchronously blocks the single JS thread for ~50ms. The timer becomes due after 10ms but its callback cannot run until the stack is free and the timers phase executes. C is printed as soon as the loop ends; B prints shortly after on the next event-loop turn.",
      optionExplanations: [
        "Correct — blocking delays the timer callback until after the synchronous work finishes.",
        "B's callback cannot preempt the running while loop.",
        "Logs are sequential; C still prints before the delayed timer callback.",
        "The loop does not crash — it simply blocks everything, including timers, for its duration.",
      ],
    },
    {
      id: "q-p1m4-7",
      type: "multiple-choice",
      prompt: "Which of these operations runs on libuv's thread pool by default?",
      options: [
        "Reading a large file with fs.readFile",
        "Compiling a hot function with V8's JIT",
        "Firing a process.nextTick callback",
        "Accepting a new TCP connection on a listening HTTP server",
      ],
      correctIndex: 0,
      explanation:
        "Most fs operations (plus zlib, crypto.pbkdf2 and dns.lookup) are dispatched to libuv's thread pool (4 threads by default) because disk reads would otherwise block the event loop. JIT compilation and nextTick callbacks run on the main JS thread; accepting connections is handled by the event loop via OS notification mechanisms (epoll/kqueue/IOCP), not the pool.",
      optionExplanations: [
        "Correct — fs work is queued on the thread pool and completed off the main thread.",
        "V8's compiler runs on the main thread as part of executing JavaScript.",
        "nextTick callbacks are microtasks drained on the main thread.",
        "Socket accepts are event-loop/poll work using the OS event mechanism, not pool threads.",
      ],
    },
    {
      id: "q-p1m4-8",
      type: "short-answer",
      prompt:
        "In Node.js, which property of the global process object contains the environment variables? Answer with the exact property access expression (like process.pid, but for environment variables).",
      acceptedKeywords: ["process.env"],
      explanation:
        "process.env holds environment variables. Every value is coerced to a string, which is why process.env.PORT needs Number(process.env.PORT) for arithmetic and why defaults must be applied carefully (an empty string is not undefined).",
    },
  ],
};
