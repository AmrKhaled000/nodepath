import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m4",
  slug: "performance-and-scalability",
  title: "Performance & Scalability",
  description:
    "Making a Node.js service fast and keeping it fast under load: metrics and baselines, CPU/memory profiling, heap snapshots and leak hunting, event-loop blocking, load testing, caching with Redis and cache invalidation, database indexing and query tuning, connection pools, streaming, worker threads, clustering, horizontal scaling, background queues, graceful shutdown and Prometheus monitoring.",
  phaseId: "phase-3",
  order: 4,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m4",
  difficulty: "advanced",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m4-performance-profiling",
    slug: "performance-profiling",
    title: "Performance Profiling: Measure Before You Optimise",
    description:
      "The numbers that actually describe performance — p50/p95/p99 latency, throughput and error rate — and the baseline-first workflow that keeps every optimisation honest.",
    order: 1,
    estimatedMinutes: 20,
    tags: ["performance", "metrics", "latency", "benchmarking", "profiling"],
    prerequisites: ["p2m1-event-loop-order", "p2m5-logging-monitoring"],
    relatedTopics: ["p3m4-cpu-profiling", "p3m4-load-testing", "p3m4-performance-monitoring"],
    learningObjectives: [
      "Define latency percentiles (p50, p95, p99), throughput and error rate and say what each one hides",
      "Capture a reproducible baseline before changing a single line of code",
      "Attribute a slow response to the right layer: network, application, cache or database",
      "Choose the profiling tool that matches the symptom instead of guessing",
    ],
    simpleExplanation:
      "Performance is a set of numbers, not a feeling. You measure how long requests take (especially the slowest 5% and 1%, not the average), how many requests per second you serve and how many fail — then you change one thing and measure again. Without that before/after pair, an optimisation is only a guess dressed up as a result.",
    detailedContent: `
**Define the numbers before writing code**

| Metric | Question it answers | Why it matters |
| --- | --- | --- |
| p50 latency | What does a *typical* request feel like? | Day-to-day responsiveness |
| p95 / p99 latency | What do the unluckiest 5% / 1% experience? | Where users abandon, retry and complain |
| Throughput | How many requests per second do we sustain? | Capacity and cost per user |
| Error rate | What share of requests fail (5xx, timeouts)? | Reliability of every other metric |

**Why the average lies.** A mean of 80 ms is perfectly consistent with 99% of requests at 10 ms and 1% at seven seconds — and users remember the seven seconds. Percentiles expose the tail. The tail is where mobile clients time out, carts get abandoned, retries multiply and load balancers start marking instances unhealthy.

**Baseline before optimisation.** Pick one representative endpoint, seed production-like data volume, fix concurrency and duration (for example 50 connections for 30 seconds), then record p50/p95/p99, throughput and error rate. Save the raw output under a name that describes the experiment. From that moment on, every change is judged against that file — not against memory, vibes or a colleague's laptop.

**Attribute before you act.** A slow response is one of: network round-trip, serialisation, application CPU, cache miss, database query, or a slow downstream API. Measure each layer separately — server-side handler time, database statement time, cache hit ratio — so you do not rewrite a JSON serialiser while a sequential table scan is the real cost.

Profiling (lessons 2–6) answers *which line* is responsible once these numbers have told you *where* the time goes.
    `,
    howItWorks: `
A measurement run has three parts. A load generator opens N connections against one endpoint; every response duration is sampled — client-side by the tool, server-side by a high-resolution timer around your handler; and at the end the samples are sorted so the 50th, 95th and 99th positions can be read off. Throughput is completed requests divided by elapsed time, and the error rate counts non-2xx plus timed-out responses.

Because a Node.js process runs handlers on one thread, the server-side view also captures what *other* requests suffered during the same window. That is why tail latency under concurrency — not latency measured alone on an idle machine — is the number worth defending, and why you should run every scenario twice before treating a difference as real.
    `,
    codeExamples: [
      {
        title: "A dependency-free percentile harness",
        language: "js",
        code: `import { performance } from "node:perf_hooks";

const pct = (samples, p) => {
  const sorted = [...samples].sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[i];
};

async function run(url, requests) {
  const samples = [];
  let errors = 0;
  const started = performance.now();

  for (let i = 0; i < requests; i++) {
    const t0 = performance.now();
    const res = await fetch(url);
    await res.arrayBuffer(); // drain the body so we measure the full exchange
    samples.push(performance.now() - t0);
    if (!res.ok) errors++;
  }

  const seconds = (performance.now() - started) / 1000;
  console.log("requests/s", (requests / seconds).toFixed(1));
  console.log("p50 (ms)  ", pct(samples, 50).toFixed(1));
  console.log("p95 (ms)  ", pct(samples, 95).toFixed(1));
  console.log("p99 (ms)  ", pct(samples, 99).toFixed(1));
  console.log("errors    ", errors);
}

await run("http://127.0.0.1:3000/api/products", 500);`,
        description:
          "Four numbers, no dependencies: throughput, p50, p95, p99 and errors. Run it twice per experiment — variance between runs is normal, a trend across runs is signal.",
      },
      {
        title: "One-line baseline with autocannon",
        language: "bash",
        code: `npm i -D autocannon

# -c concurrency, -d duration seconds, -j machine-readable output
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/products > baseline-c50.json

# Pure server latency with a single connection (no queueing)
npx autocannon -c 1 -d 20 http://127.0.0.1:3000/api/products`,
        description:
          "autocannon reports throughput, latency distribution and error counts in one pass. Keep the -j files: they are the \"before\" half of every before/after comparison in this module.",
      },
    ],
    commonMistakes: [
      "Optimising before measuring — a rewrite that \"should be faster\" with no baseline can easily improve p50 while quietly making p99 much worse.",
      "Quoting the average or the single fastest run instead of p95/p99, which hides exactly the requests users complain about.",
      "Benchmarking an empty database: three rows prove nothing. Seed data to production-like volume and key distribution first.",
      "Comparing numbers taken on different machines, cold caches or different payload sizes and calling the difference a win.",
    ],
    bestPractices: [
      "Fix the request mix, payload, concurrency and duration; change exactly one variable per experiment.",
      "Record error rate next to latency — a faster endpoint that returns 5% 500s is slower for those users.",
      "Store raw output per experiment with a descriptive name (baseline, after-index, after-cache) so results are diffable.",
      "Measure server-side and client-side numbers; the gap between them is where the network and proxies live.",
    ],
    realWorldUseCases: [
      "Before shipping a checkout endpoint, capture a baseline at 50 concurrent users so the code review argues with numbers.",
      "After adding a database index, replay the identical load test and diff p95 — that is the evidence the index was worth its write cost.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js API — Perf_hooks module",
        url: "https://nodejs.org/api/perf_hooks.html",
        description:
          "High-resolution timers, PerformanceObserver and the measurement primitives every later lesson builds on.",
      },
      videos: [
        {
          query: "API latency percentiles p50 p95 p99 explained",
          description: "Visual explanations of percentiles and why averages hide the tail.",
          estimatedDuration: "8–15 min",
        },
      ],
      article: {
        title: "k6 docs — Thresholds",
        url: "https://k6.io/docs/using-k6/thresholds/",
        provider: "k6.io",
        description: "Turning an SLO such as p95 under 200 ms into a pass/fail assertion for an automated test.",
        estimatedDuration: "10 min",
      },
    }),
    exercises: [
      {
        id: "ex-p3m4-baseline",
        title: "Build a three-point baseline",
        prompt:
          "Pick one endpoint of your project and seed it with at least 10,000 rows. Record p50/p95/p99, throughput and error rate at concurrency 1, 50 and 200 (30 seconds each). Write three sentences explaining where throughput plateaus and at which concurrency p99 starts to explode — that concurrency number is your saturation point.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Concurrency 1 measures pure server latency; concurrency 200 measures queueing behaviour.",
          "If errors appear at high concurrency, note whether they are timeouts (queue too deep) or 500s (a real bug under load).",
        ],
        solution: `# 1) Seed data so the table is production-sized
node scripts/seed.js

# 2) Moderate concurrency: your reference baseline
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/products > baseline-c50.json

# 3) Single connection: latency without queueing
npx autocannon -c 1 -d 20 -j http://127.0.0.1:3000/api/products > baseline-c1.json

# 4) Saturation: where the service falls over
npx autocannon -c 200 -d 30 -j http://127.0.0.1:3000/api/products > baseline-c200.json

# Read each file: latency.p99, requestsPerSec and non2xx.
# Expectation (class of result, not a magic number):
#   c=1   -> lowest p95, throughput far below maximum
#   c=50  -> near peak throughput, p95 still stable
#   c=200 -> p99 climbs sharply (queueing), possibly timeouts/5xx
# Every later lesson is judged by moving the c=50 and c=200 numbers,
# not by micro-benchmarking a single function in isolation.`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-analytics-api"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-cpu-profiling",
    slug: "cpu-profiling",
    title: "CPU Profiling: Finding the Hot Function",
    description:
      "Sampling CPU profiles with the inspector and --cpu-prof, opening them in DevTools, and reading self time vs total time to find the line worth optimising.",
    order: 2,
    estimatedMinutes: 22,
    tags: ["cpu-profiling", "inspector", "profiling", "flame-graph"],
    prerequisites: ["p3m4-performance-profiling", "p2m1-event-loop-order"],
    relatedTopics: ["p3m4-event-loop-blocking", "p3m4-memory-profiling", "p3m4-worker-threads-performance"],
    learningObjectives: [
      "Start a CPU profile from the CLI, from DevTools and programmatically with the inspector",
      "Explain what a .cpuprofile contains and how sampling produces it",
      "Read a flame graph by self time and total time and name the hottest application frame",
      "Profile under representative load instead of on an idle server",
    ],
    simpleExplanation:
      "A CPU profiler periodically asks the running program \"where are you right now?\" and stacks up thousands of answers per second. Plot those answers as horizontal bars and the functions that appear most often are the ones burning your CPU. In Node.js you can switch profiling on with a flag, attach DevTools, or start it from your own code — the output is the same, and it points at the line to fix.",
    detailedContent: `
Three ways to get a profile, all built on V8's sampling profiler:

- **\`node --cpu-prof --cpu-prof-dir=./profiles server.js\`** — samples for the whole run and writes a \`.cpuprofile\` file when the process exits (if your server traps SIGINT, make sure the handler still calls \`process.exit\` so the file is flushed).
- **DevTools attach** — run \`node --inspect-brk server.js\` and open \`chrome://inspect\`, so you can start and stop profiling from the JS Profiler tab while watching a live console.
- **Programmatic** — an \`inspector.Session\` lets a hidden admin endpoint start and stop a profile on demand in a staging environment.

**Reading the result.** A profile is a tree of sample counts. **Self time** is time spent *in* that function; **total time** includes everything it called. Framework and library frames (Express routing, JSON.parse, GC) will always be wide — look for the widest frame that is *your* code, because that is the only one you can change. A flame graph is the same data drawn as nested bars: width equals time, so wide flat plateaus are suspicious and tall thin spikes are usually cheap.

**Profile under load.** An idle server's profile is a picture of the event loop waiting. Drive 20–30 seconds of realistic traffic (autocannon from lesson 1) while profiling, and only then read the numbers. Sampling adds a small constant overhead — do not profile production continuously.

The goal is never "make everything fast"; it is to remove the largest frame you can prove, then re-measure p95 (lesson 1) to confirm the frame actually shrank.
    `,
    howItWorks: `
V8 interrupts the running program at a fixed interval (by default every millisecond of CPU time) and records the current JavaScript stack into a ring buffer. When profiling stops, those samples are aggregated into a graph: each node is a function, each edge a call relation, and \`timeDeltas\` shows how long between samples. DevTools renders it as a chronological flame chart (left to right = time) and a "Bottom-Up" view (sorted by self time).

Because sampling is statistical rather than exact, a function that runs for under a millisecond rarely appears — which is exactly the behaviour you want: the profile points at code that consumes a *meaningful* share of CPU, not at noise.
    `,
    codeExamples: [
      {
        title: "Profile a loaded server from the command line",
        language: "bash",
        code: `# 1) Start the server under the sampling profiler
node --cpu-prof --cpu-prof-dir=./profiles server.js

# 2) In a second terminal, drive realistic traffic for ~20 seconds
npx autocannon -c 50 -d 20 http://127.0.0.1:3000/api/reports

# 3) Stop the load, then stop the server — profiles/<timestamp>-<pid>.cpuprofile
#    appears in ./profiles (call process.exit(0) from your SIGINT handler so
#    the profile is flushed when you trap shutdown signals).

# 4) Open it: chrome://inspect is for sources; for profiles, open DevTools on
#    any page -> Performance panel -> drag the .cpuprofile file onto it.`,
        description:
          "The whole loop: flag, load, stop, inspect. Compare the flame chart from this run with a second run after your change — the same frame should visibly narrow.",
      },
      {
        title: "Start and stop a profile on demand",
        language: "js",
        code: `import inspector from "node:inspector";
import { mkdir, writeFile } from "node:fs/promises";

const session = new inspector.Session();
session.connect();

const post = (method, params) =>
  new Promise((resolve, reject) => {
    session.post(method, params ?? {}, (err, result) =>
      err ? reject(err) : resolve(result),
    );
  });

await post("Profiler.enable");
await post("Profiler.start");

// ... drive traffic here for 20-30 seconds ...

const { profile } = await post("Profiler.stop");
await mkdir("./profiles", { recursive: true });
await writeFile("./profiles/on-demand.cpuprofile", JSON.stringify(profile));
session.disconnect();
console.log("wrote ./profiles/on-demand.cpuprofile");`,
        description:
          "An on-demand profile is how you catch an intermittent hot path: start profiling when the slow behaviour appears, stop it when it is gone, and you have the exact window you needed.",
      },
    ],
    commonMistakes: [
      "Profiling an idle server: the profile then shows the event loop waiting, not your bottleneck.",
      "Optimising the widest frame that happens to be library code you do not own (JSON.parse, the router) while your own handler sits one frame below it.",
      "Reading total time only — a function whose total time is huge but self time is zero is simply calling something else; go one level down.",
      "Shipping the profiler to production permanently: sampling interrupts the loop and costs throughput.",
    ],
    bestPractices: [
      "Profile for a fixed 20–30 second window under the same load scenario you use for benchmarks, so runs are comparable.",
      "Look at self time first, then expand the frame to see which line of your code it maps to.",
      "Attach the .cpuprofile (or a screenshot of the flame graph) to the pull request that claims a performance fix.",
      "Confirm with numbers: after changing the hot line, re-run the load test and check that p95 moved in the right direction.",
    ],
    realWorldUseCases: [
      "A nightly report endpoint shows 300 ms p95; the profile reveals 60% of samples inside one date-grouping helper, which is then replaced with a single-pass reducer.",
      "A \"random\" production slowdown is reproduced in staging with load, profiled for 30 seconds, and traced to a regex that backtracks on malformed input.",
    ],
    resources: [
      docs(
        "Node.js API — Inspector module",
        "https://nodejs.org/api/inspector.html",
        "Session, Profiler domain and the programmatic route to CPU profiles.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Command line options",
        "https://nodejs.org/api/cli.html",
        "Reference for --cpu-prof, --cpu-prof-dir, --cpu-prof-interval and --inspect.",
        "en",
        "reference",
      ),
      docs(
        "Clinic.js",
        "https://clinicjs.org/",
        "Tooling that wraps profiling flows (flame, bubbleprof, doctor) for Node.js services.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node.js cpu profiling chrome devtools cpuprofile",
        "Walkthroughs of generating and interpreting a .cpuprofile flame graph.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-cpu-hotpath",
        title: "Find it, fix it, prove it",
        prompt:
          "Run your server with --cpu-prof while autocannon drives it for 20 seconds. Open the profile and write down the top three frames by self time. Pick the widest frame that belongs to your own code, change that code (loop hoisting, precomputation, cheaper algorithm — whatever fits), then re-run the identical load test. Report p50/p95/p99 before and after and whether the hot frame's share of samples dropped. If the frame was roughly a third of samples, expect a meaningful but sub-linear p95 improvement, not a 10x jump.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Sort the Bottom-Up view by self time; that ordering is the answer to \"where is the CPU?\".",
          "If your top frames are all in library code, open the parent frame — the caller is usually where the repeated work originates.",
          "Re-run the same concurrency and duration you used for the baseline; only then is the comparison valid.",
        ],
        solution: `# BEFORE
node --cpu-prof --cpu-prof-dir=./profiles server.js &
npx autocannon -c 50 -d 20 -j http://127.0.0.1:3000/api/reports > before.json
cp profiles/*.cpuprofile before.cpuprofile

# ... edit the hot function, restart the server ...

# AFTER (identical scenario)
npx autocannon -c 50 -d 20 -j http://127.0.0.1:3000/api/reports > after.json

# What to compare
# 1) before.json vs after.json -> latency.p99 and requestsPerSec
# 2) before.cpuprofile vs after.cpuprofile -> the hot frame's self-time share
# Class of improvement: if the frame held ~30-40% of samples and you removed
# most of that work, p95 should fall by a visible double-digit percentage.
# If p95 did not move, the frame was not your bottleneck — go back to lesson 1
# and re-attribute the time before touching more code.`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-analytics-api"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-memory-profiling",
    slug: "memory-profiling",
    title: "Memory Profiling: Reading heapUsed Trends",
    description:
      "rss, heapUsed, external and arrayBuffers explained; sampling heap profiles with --heap-prof; and the steady-growth test that separates normal caching from a leak.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["memory", "heap-profiling", "v8", "gc"],
    prerequisites: ["p2m1-memory-management", "p3m4-performance-profiling"],
    relatedTopics: ["p3m4-heap-snapshots", "p3m4-memory-leaks", "p3m4-cpu-profiling"],
    learningObjectives: [
      "Explain the difference between rss, heapUsed, external and arrayBuffers in process.memoryUsage()",
      "Sample where allocations come from with the heap profiler instead of guessing",
      "Design a growth test that distinguishes a healthy cache from an unbounded leak",
      "Know when garbage collection is the problem and when retention is",
    ],
    simpleExplanation:
      "Node.js keeps your objects in a heap that the garbage collector reclaims when nothing references them any more. Memory profiling means watching how that heap changes over time: if it climbs, plateaus and resets, that is normal; if it climbs forever no matter what you do, something is holding references. process.memoryUsage() gives you the raw numbers, and the heap profiler tells you which code allocated them.",
    detailedContent: `
**The four numbers in \`process.memoryUsage()\`**

| Field | What it measures | Typical worry |
| --- | --- | --- |
| \`rss\` | Total memory the process holds from the OS | Container OOM kills |
| \`heapUsed\` | Live JS objects inside the V8 heap | Steady climb = leak suspicion |
| \`external\` | Memory outside V8 but tied to JS objects (native addons) | sharp bumps after large payloads |
| \`arrayBuffers\` | Explicit ArrayBuffers and Buffers | forgotten large buffers |

\`rss\` never shrinks quickly — V8 returns memory to the OS lazily — so do not read a flat rss line as a leak.

**Two different problems.** *Allocation churn* is lots of short-lived objects: high CPU in GC, but memory that recycles. *Retention* is objects that should have died but are still referenced: heapUsed climbs and never comes back down. The first is optimised with allocation profiles; the second needs snapshots (lesson 4) and the leak diagnosis loop (lesson 5).

**Sampling heap profiles.** \`node --heap-prof --heap-prof-dir=./profiles server.js\` writes a \`.heapsnapshot\`-style heap sampling profile showing *which functions allocated the most bytes*. Unlike a CPU profile it answers "who creates the memory", not "who spends the time" — perfect for finding the function that builds a 50 MB array per request.

**The growth test.** Drive a fixed workload (for example 1,000 requests), force a full GC if you can (\`node --expose-gc\` then \`global.gc()\`), record heapUsed, repeat ten times. A sawtooth that returns to roughly the same floor is healthy; a floor that rises every cycle is your leak — record the per-cycle delta as the number you must drive to zero.
    `,
    howItWorks: `
V8 splits the heap into a young generation (short-lived objects, collected quickly by scavenge) and an old generation (long-lived objects, collected by mark-sweep cycles). \`heapUsed\` is the live-plus-garbage total at that instant, which is why a single reading means nothing — you need a series. The sampling heap profiler hooks V8's allocation events and records a fraction of allocations with their stacks; aggregating those samples tells you which call paths dominate byte volume.

When the old generation keeps growing across forced GC cycles, the objects are *reachable*: a Map entry, a listener, a closure capture or a module-level cache. Reachability is exactly what a snapshot comparison shows, and what no amount of GC tuning can fix.
    `,
    codeExamples: [
      {
        title: "Log a memory trend while you drive traffic",
        language: "js",
        code: `import { memoryUsage } from "node:process";

const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";

setInterval(() => {
  const { rss, heapUsed, heapTotal, external, arrayBuffers } = memoryUsage();
  console.log(
    "rss", mb(rss),
    "| heapUsed", mb(heapUsed),
    "| heapTotal", mb(heapTotal),
    "| external", mb(external),
    "| buffers", mb(arrayBuffers),
  );
}, 1000).unref();`,
        description:
          "One line per second with all five numbers. Run it during a 10-minute soak: look at the *floor* of heapUsed after GC, not the peaks.",
      },
      {
        title: "Growth test: is that cache a leak?",
        language: "bash",
        code: `# heap profiling needs --expose-gc only if you want forced collections
node --heap-prof --heap-prof-dir=./profiles --expose-gc server.js

# In another terminal: fixed workload, ten times
for i in $(seq 1 10); do
  npx autocannon -c 10 -d 15 http://127.0.0.1:3000/api/search
  sleep 2
done

# Read the trend line you logged, then open the resulting .heapsnapshot-nodes
# file (DevTools -> Memory -> take/compare) to see which function allocated
# the dominant share of bytes.`,
        description:
          "Fixed workload + repeated measurement is the only honest way to separate \"the cache is warming\" from \"the cache never forgets\".",
      },
    ],
    commonMistakes: [
      "Panicking over a single memoryUsage() reading — memory in a running process always looks large and rarely returns to zero.",
      "Treating rss as the leak metric: V8 keeps reserved pages, so rss stays high even when the heap is empty.",
      "Forcing gc() before every reading and then concluding there is no leak — a leak is exactly what survives a forced collection.",
      "Profiling memory on an empty system: allocation profiles must be taken under the workload that allocates.",
    ],
    bestPractices: [
      "Chart heapUsed over minutes (or hours in staging), and judge the post-GC floor, not the peaks.",
      "Keep a memory budget in your container spec (limit well above normal peak) so a leak degrades into a visible alert instead of an instant OOM kill.",
      "Re-run the same growth test after every \"fix\" and record the per-cycle delta.",
      "Separate concerns: allocation-heavy but short-lived code needs algorithm changes; retention needs reference removal.",
    ],
    realWorldUseCases: [
      "A chat server's heapUsed grows 40 MB per hour under steady traffic; the allocation profile points at a per-message formatter building throwaway arrays — and the snapshot shows the real culprit is an unbounded per-connection Map.",
      "Nightly batch jobs push external memory up as Buffer pools grow; the trend tells you whether that is one-off warmup or a slow leak in the streaming path.",
    ],
    resources: [
      docs(
        "Node.js API — process.memoryUsage()",
        "https://nodejs.org/api/process.html#processmemoryusage",
        "rss, heapUsed, external, arrayBuffers and what each field really reports.",
        "en",
        "8 min",
      ),
      docs(
        "MDN — JavaScript memory management",
        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management",
        "Allocation, reachability and garbage collection concepts that apply unchanged in Node.js.",
        "en",
        "12 min",
      ),
      ytSearch(
        "node.js heap profiling memoryUsage heapUsed trends",
        "Sessions on reading memory trends and sampling heap profiles.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-growth-test",
        title: "Prove or disprove a leak",
        prompt:
          "Add the memory logger to your API, then run three 10-minute soaks: (1) idle, (2) read-only traffic, (3) a traffic mix that creates new records. For each, record the starting and ending post-GC heapUsed and the slope. Write a verdict sentence for each scenario — \"healthy sawtooth\", \"expected growth from cache warmup\", or \"leak: +X MB per cycle\" — and back it with the numbers.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "Start the process with node --expose-gc so you can call global.gc() between cycles and read the true floor.",
          "A cache that fills once and then stops growing is warmup; a cache that grows with every request is unbounded.",
        ],
      },
    ],
    projectIds: ["p3-chat-app"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-heap-snapshots",
    slug: "heap-snapshots",
    title: "Heap Snapshots: Catching What Is Retained",
    description:
      "Taking heap snapshots on demand or on a signal, comparing two of them in DevTools, and reading retaining paths to find closures, listeners and detached structures that never die.",
    order: 4,
    estimatedMinutes: 21,
    tags: ["heap-snapshot", "v8", "memory-leak", "devtools"],
    prerequisites: ["p3m4-memory-profiling", "p2m1-memory-management"],
    relatedTopics: ["p3m4-memory-leaks", "p3m4-memory-profiling", "p3m4-event-loop-blocking"],
    learningObjectives: [
      "Trigger a heap snapshot from code and from a command-line flag",
      "Compare a \"before\" and \"after\" snapshot using the Comparison view",
      "Follow a retaining path from a leaked object back to its owner",
      "Recognise the classic retention shapes: closures, listeners, detached objects and unbounded maps",
    ],
    simpleExplanation:
      "A heap snapshot is a frozen inventory of every object in memory at one instant, plus the references keeping each one alive. Take one snapshot while your app is healthy, another after it has been running for a while, and DevTools will show you exactly which objects grew — and, more importantly, the chain of references that prevents them from being garbage collected. That chain is the bug.",
    detailedContent: `
**Taking a snapshot.** Three practical routes:

- **DevTools** — Chrome/Edge DevTools → Memory panel → *Take heap snapshot* against an attached Node.js process (\`node --inspect\`).
- **On demand** — call \`v8.writeHeapSnapshot("name.heapsnapshot")\` from a protected admin endpoint or a test hook.
- **On signal** — start with \`node --heapsnapshot-signal=SIGUSR2 app.js\` and send SIGUSR2 when the heap looks wrong; this is the production-friendly route because nothing changes in your code.

Snapshots are large (often a multiple of the live heap) and pause the process briefly while writing — take them in staging when you can.

**Comparing.** Take snapshot A under normal load, keep the same workload running, take snapshot B ten minutes later, then load both into DevTools and select *Comparison* for B. Sort by *Delta size* and you get "what grew", not "what exists". A healthy process shows churn across many types; a leak shows one or two types with a suspicious delta (strings, arrays, or objects of a class you recognise).

**Reading a retaining path.** Select a leaked object and expand *Retainers*: the list walks the reference chain up to a root (a global, an active handle, a timer). The last object in the chain that you *own* is the fix location. Classic shapes: a module-level \`Map\` that only ever grows, an event listener registered per request and never removed, a closure capturing \`req\`/\`res\`, or a detached structure held alive by a callback.

Snapshots answer *retention*; allocation profiles (lesson 3) answer *creation*. Use both when the story is unclear.
    `,
    howItWorks: `
When you trigger a snapshot, V8 walks the heap graph from the GC roots (globals, stack frames, handles for timers, sockets and pending promises), serialises every live object with its shape, size and references, and writes JSON. Because it starts from roots, anything *not* in the snapshot was already collected — which is why "it is in the snapshot" means "something still references it".

DevTools then rebuilds the graph locally. The Comparison view diffs two graphs by object identity class and size, and the Retainers pane reconstructs the incoming reference chain, letting you jump node by node from a 40 MB array up to the global cache that refuses to let it go.
    `,
    codeExamples: [
      {
        title: "Snapshot on demand from a guarded endpoint",
        language: "js",
        code: `import v8 from "node:v8";

// Mount behind auth (or admin-only middleware) in staging.
app.post("/admin/heap-snapshot", async (req, res) => {
  const file = "heap-" + Date.now() + ".heapsnapshot";
  const path = v8.writeHeapSnapshot(file);
  res.json({ path });
});`,
        description:
          "writeHeapSnapshot returns the absolute path it wrote. Copy the file off the machine, then load it in DevTools: Memory panel -> Load.",
      },
      {
        title: "Snapshot a live process with a signal",
        language: "bash",
        code: `# Start with the signal handler enabled — no code changes required
node --heapsnapshot-signal=SIGUSR2 server.js

# When heapUsed looks wrong in your metrics:
#   Windows PowerShell
Get-Process -Name node | ForEach-Object { Stop-Process -Id $_.Id -WhatIf }
#   macOS / Linux
kill -SIGUSR2 $(pgrep -f server.js)

# A file like Heap.<date>-<pid>.heapsnapshot appears in the working directory.
# Take one early and one late, then compare them in DevTools.`,
        description:
          "Two snapshots from the same long-running process give you a diff of retained memory — the single most productive artefact in leak hunting.",
      },
    ],
    commonMistakes: [
      "Inspecting a single snapshot instead of comparing two: without a baseline you are reading an inventory, not finding a growth path.",
      "Forgetting that snapshot files are huge and contain your data — treat them like production data when sharing them.",
      "Stopping at \"strings grew\": expand the retaining path until you reach code you wrote, because that is the only place you can fix it.",
      "Taking snapshots in the middle of a burst: transient objects inflate deltas and hide the real signal.",
    ],
    bestPractices: [
      "Keep a snapshot from a freshly warmed-up process as the reference for every later comparison.",
      "Sort comparison results by delta, and group by constructor name before reading individual objects.",
      "Follow retainers to the last object you own — that reference is the line to delete or bound.",
      "Verify the fix by repeating the identical workload and diffing again; the delta for that type should collapse to near zero.",
    ],
    realWorldUseCases: [
      "After 6 hours of chat traffic, a comparison snapshot shows 2 million String instances retained by a per-room history array with no size cap — the fix is a ring buffer with an explicit maximum.",
      "An analytics API leaks one closure per export job; the retaining path points straight at a finished job still referenced by a scheduler's callback list.",
    ],
    resources: [
      docs(
        "Node.js API — v8.writeHeapSnapshot()",
        "https://nodejs.org/api/v8.html",
        "Programmatic snapshot creation and its options.",
        "en",
        "5 min",
      ),
      docs(
        "Node.js API — Command line options",
        "https://nodejs.org/api/cli.html",
        "Details of --heapsnapshot-signal and related heap flags.",
        "en",
        "reference",
      ),
      ytSearch(
        "chrome devtools heap snapshot compare retaining path",
        "Tutorials on taking, loading and comparing heap snapshots for leaks.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-snapshot-diff",
        title: "Catch a leak in the act",
        prompt:
          "Create a deliberate leak (a module-level Map that stores one entry per request). Start the app with --heapsnapshot-signal=SIGUSR2, take a snapshot after 100 requests and another after 1,000. Load both, run a Comparison, and write down: the constructor with the largest delta, its approximate delta size, and the full retaining path back to your Map. Then bound the Map and show the delta collapsing.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "In the Comparison view sort by delta and group by constructor — the leak will dominate instantly.",
          "The retainer chain ends at a global: your module-level Map is the root you are looking for.",
        ],
      },
      {
        id: "ex-p3m4-detached-shapes",
        title: "Name the classic retention shapes",
        prompt:
          "Write a 5-line snippet for each of these four shapes, run it, snapshot before and after, and confirm each appears in the comparison: (1) listener added per request, (2) timer never cleared, (3) closure capturing a large object, (4) Map entry never deleted. For each, state the one-line fix.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "For (1), a shared EventEmitter and a new arrow function per request is enough.",
          "For (2), setInterval inside a request handler with no clearInterval.",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-job-processing"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-memory-leaks",
    slug: "memory-leaks",
    title: "Memory Leaks and the Diagnosis Loop",
    description:
      "The four leak sources that actually appear in Node.js services — unbounded caches, listeners, timers and growing collections — plus a repeatable loop for confirming, finding and verifying the fix.",
    order: 5,
    estimatedMinutes: 20,
    tags: ["memory-leaks", "event-emitter", "caching", "gc"],
    prerequisites: ["p3m4-heap-snapshots", "p3m4-memory-profiling"],
    relatedTopics: ["p3m4-heap-snapshots", "p3m4-cache-invalidation", "p3m4-graceful-shutdown"],
    learningObjectives: [
      "Name the common leak sources in a long-running Node.js service and why each one survives garbage collection",
      "Run a disciplined diagnosis loop: confirm, snapshot, follow the retaining path, fix, verify",
      "Read MaxListenersExceededWarning as an early warning rather than background noise",
      "Bound every in-process cache by size and by time",
    ],
    simpleExplanation:
      "A memory leak is not lost memory — it is memory nobody can free because something still points at it. In Node.js the usual culprits are caches that only grow, event listeners registered per request, timers that are never cleared and collections that are written to but never deleted. Because the garbage collector can only reclaim unreachable objects, the fix is always to remove the reference, not to restart the process.",
    detailedContent: `
**The four shapes you will meet**

| Shape | How it grows | Why GC cannot help | The fix |
| --- | --- | --- | --- |
| Unbounded cache / \`Map\` | one entry per key, forever | the module-level collection is a root | max size + TTL (or move to Redis) |
| Listeners | \`.on()\` inside a request handler | the emitter holds every callback | \`.once()\`, shared handler, or explicit \`.off()\` |
| Timers | \`setInterval\` never cleared | the timer handle keeps its scope alive | \`clearInterval\` in every exit path |
| Closures / captured context | request-scoped object referenced after the response | the callback chain keeps it reachable | stop capturing, null it, or scope the callback |

The recurring theme is *reachability*: V8 frees only what nothing references, and a global Map, an active emitter or a pending timer is a reference that never expires.

**The diagnosis loop** — run it the same way every time:

1. **Confirm.** Drive a fixed workload repeatedly and watch the post-GC heapUsed floor (lesson 3). A rising floor is a leak; a sawtooth is not.
2. **Snapshot.** Take a heap snapshot early and another later, then compare them (lesson 4).
3. **Attribute.** Sort the comparison delta, pick the dominant type, and follow its retaining path up to the root you own.
4. **Fix** that one reference — usually three lines.
5. **Verify.** Repeat the identical workload; the delta for that type must collapse. Record the new per-cycle number.

\`MaxListenersExceededWarning\` is step 3 arriving uninvited: Node warns once an emitter passes 11 listeners on one event, which is almost always a \`.on()\` that belongs in module scope.
    `,
    howItWorks: `
Garbage collection marks every object reachable from a root — globals, the call stack, active handles for timers and sockets, pending microtasks — and sweeps everything else. A "leak" is therefore an object that stays *marked* because a chain of references still leads back to it. That is why restarting helps (roots are recreated) and why calling gc() does not (the chain survives).

Heap snapshots materialise exactly those chains: open the Comparison view, find the constructor with the largest delta, expand Retainers until you reach code you wrote, and delete or bound that edge. Each iteration of the loop shrinks the delta; when the per-cycle growth is flat, the leak is closed and the verification run is your proof.
    `,
    codeExamples: [
      {
        title: "Unbounded cache vs bounded cache",
        language: "js",
        code: `// BEFORE — one entry per client, forever. The module scope is a GC root.
const sessions = new Map();
app.use((req, res, next) => {
  if (!sessions.has(req.ip)) sessions.set(req.ip, { hits: 0, firstSeen: Date.now() });
  sessions.get(req.ip).hits++;
  next();
});

// AFTER — bounded by size and by age
const MAX_SESSIONS = 50_000;
const SESSION_TTL_MS = 30 * 60 * 1000;

function touchSession(ip) {
  let entry = sessions.get(ip);
  if (!entry || Date.now() - entry.firstSeen > SESSION_TTL_MS) {
    entry = { hits: 0, firstSeen: Date.now() };
    sessions.set(ip, entry);
  }
  if (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value); // Map iterates in insertion order
  }
  entry.hits++;
  return entry;
}`,
        description:
          "Two lines of defence — a size cap and a TTL — turn an OOM-in-a-day process into one that runs for months. Insertion order gives you a cheap oldest-first eviction.",
      },
      {
        title: "The listener leak and its warning",
        language: "js",
        code: `import { EventEmitter } from "node:events";
const bus = new EventEmitter();

// BUG — one NEW listener per request, never removed:
function subscribeBroken(userId) {
  bus.on("tick", () => console.log("notify", userId));
}
// After 11 calls Node prints:
// (node) MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
// 11 tick listeners added. Use emitter.setMaxListeners() to increase limit

// FIX — one shared handler, or a listener that removes itself:
function subscribeFixed(userId) {
  const handler = () => console.log("notify", userId);
  bus.once("tick", handler);           // fires once and drops itself
  return () => bus.off("tick", handler); // or return the disposer to call later
}`,
        description:
          "Raising the limit with setMaxListeners(100) hides the warning without fixing the growth. The real fix is pairing every .on() with a .off() or using .once().",
      },
    ],
    commonMistakes: [
      "Adding a cache \"for performance\" with no maximum size and no TTL — the single most common leak in long-running services.",
      "Calling setMaxListeners(Infinity) to silence the warning instead of removing the listeners.",
      "Assuming GC cleans up anything you stopped using: if a global, timer or emitter still references it, it must stay.",
      "Patching the symptom with a nightly restart or a forced gc() rather than deleting the retaining reference.",
    ],
    bestPractices: [
      "Give every in-process cache a maximum entry count and a TTL, written on the same line as the Map() constructor.",
      "Treat .on() as a pair: document who calls .off(), or use .once() when the event is genuinely one-shot.",
      "Create and clear intervals/timeouts in the same function, including error and early-return paths.",
      "Alert on the heapUsed floor and on rss so a slow leak pages a human before the OOM killer pages the container.",
    ],
    realWorldUseCases: [
      "A webhook processor registers one listener per subscription and reaches thousands of retained closures within a day — one shared handler removes the leak entirely.",
      "Rate-limit counters kept in a module-level Map double in size daily; moving them to Redis with an expiry (lesson 9) fixes both the leak and the loss of counters on restart.",
    ],
    resources: [
      docs(
        "Node.js API — Events and EventEmitters",
        "https://nodejs.org/api/events.html",
        "Listener limits, maxListeners and the semantics behind MaxListenersExceededWarning.",
        "en",
        "10 min",
      ),
      docs(
        "Node.js API — Timers",
        "https://nodejs.org/api/timers.html",
        "setInterval, clearInterval and unref — the handles that keep scopes alive.",
        "en",
        "8 min",
      ),
      ytSearch(
        "node.js memory leak diagnosis heap snapshot retainers",
        "End-to-end leak hunts from symptom to retaining path to fix.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-four-leaks",
        title: "Hunt four leaks in your own code",
        prompt:
          "Search your project for: (1) a Map/Set/array declared at module scope with no eviction, (2) any .on( call inside a request handler or middleware, (3) any setInterval/setTimeout that is not paired with a clear* call, (4) any closure that captures req, res or a large object and outlives the response. For each hit, write the file:line, the growth rate per 1,000 requests you estimate, and the one-line fix. Then pick the worst one, apply it, and verify with the growth test from lesson 3.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "grep -rn \"setInterval\\|\\.on(\" src/ is a fast first pass.",
          "A cache without a TTL is not automatically a leak if its key space is bounded (for example, one entry per user id) — say so explicitly in your write-up.",
        ],
      },
    ],
    projectIds: ["p3-chat-app"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-event-loop-blocking",
    slug: "event-loop-blocking",
    title: "Event-Loop Blocking: The Cost of Not Yielding",
    description:
      "Why one synchronous run delays every request in the process, the usual offenders (huge JSON.parse, sync fs, crypto in a loop), and how to measure the damage with event-loop delay monitoring.",
    order: 6,
    estimatedMinutes: 22,
    tags: ["event-loop", "latency", "blocking", "performance"],
    prerequisites: ["p2m1-event-loop-order", "p2m1-microtasks-macrotasks", "p3m4-performance-profiling"],
    relatedTopics: ["p3m4-cpu-profiling", "p3m4-worker-threads-performance", "p3m4-clustering"],
    learningObjectives: [
      "Explain why a long synchronous run blocks every other request in the same process",
      "Identify the common offenders: giant JSON.parse, synchronous fs, CPU-bound crypto and pathological regexes",
      "Measure blocking with monitorEventLoopDelay and eventLoopUtilization",
      "Pick the right remedy: async API, bounded work, caching, or a worker thread",
    ],
    simpleExplanation:
      "A Node.js process runs all of your JavaScript on one thread. While that thread is busy doing a long calculation, nothing else happens: timers do not fire, sockets do not get read, and new requests wait in line. If one endpoint parses a 50 MB JSON file synchronously, every other endpoint on that server — including a trivial health check — stalls for exactly as long as that parse takes.",
    detailedContent: `
**Why one long sync run stops everything.** Timers, I/O callbacks and incoming requests all wait for the same thread to return to the loop. Any run that does not yield delays *everything else* by at least that long, regardless of how idle the rest of the machine is.

| Offender | Why it blocks | Typical fix |
| --- | --- | --- |
| \`JSON.parse\` / \`JSON.stringify\` of a huge payload | one uninterruptible parse | bound body size, parse in a worker, stream-parse |
| \`fs.readFileSync\` / \`writeFileSync\` in a handler | disk latency spent on the loop | use \`fs.promises\` |
| \`crypto.pbkdf2Sync\` / \`scryptSync\` in a loop | deliberate CPU burn per call | async variants (libuv thread pool), or a worker for heavy work |
| Regex with nested quantifiers | exponential backtracking on hostile input | rewrite it, bound input length |
| Sorting or compressing per request | CPU per call | precompute, cache, or move it off-loop |

**Measure, do not guess.** \`perf_hooks.monitorEventLoopDelay\` records how late a periodic timer actually fired; \`eventLoopUtilization\` reports the share of time the loop was busy. A healthy service sits in low single-digit milliseconds of delay; a p99 in the tens or hundreds of milliseconds means something is holding the loop hostage, and you now have a number to put in the bug report.

**Order of preference for fixes:** use the async API first (the work moves to the thread pool); reduce or bound the work (truncate input, paginate); cache the result so it is computed once; and only then move genuinely CPU-bound computation to a worker thread (lesson 15). Chunking a loop with \`setInterval\` merely *spreads* the block — it does not remove it.
    `,
    howItWorks: `
\`monitorEventLoopDelay\` schedules a high-resolution timer every \`resolution\` milliseconds (10 by default) and records how many nanoseconds each tick was overdue. If a synchronous run lasts 200 ms, every tick scheduled inside that window is ~200 ms late, so mean, p99 and max jump together — a signature no other failure produces. \`eventLoopUtilization\` complements it: active time divided by total time since the previous call, which is the number that rises as you approach saturation.

Both are cheap enough to keep on in production. Log them every few seconds, export them as a metric (lesson 20), and alert when p99 delay crosses your tolerance; the same series then proves whether the fix worked rather than merely claiming it did.
    `,
    codeExamples: [
      {
        title: "Watch the loop while a handler blocks it",
        language: "js",
        code: `import { monitorEventLoopDelay, eventLoopUtilization } from "node:perf_hooks";

const loopDelay = monitorEventLoopDelay({ resolution: 10 });
loopDelay.enable();
let elu = eventLoopUtilization();

setInterval(() => {
  const sinceLast = eventLoopUtilization(elu);
  elu = eventLoopUtilization();
  console.log(
    "delay p99:", (loopDelay.percentile(99) / 1e6).toFixed(1), "ms",
    "| mean:", (loopDelay.mean / 1e6).toFixed(1), "ms",
    "| loop busy:", (sinceLast.utilization * 100).toFixed(1) + "%",
  );
  loopDelay.reset();
}, 5000).unref();

// With express.text() the body is still a raw string — parsing it is ours to do
app.post("/import", (req, res) => {
  const rows = JSON.parse(req.body); // one long, uninterruptible run
  res.json({ count: rows.length, total: rows.reduce((s, r) => s + r.amount, 0) });
});`,
        description:
          "Percentiles are in nanoseconds, hence the divide by 1e6. When /import is hit, watch delay p99 leap from ~1 ms to hundreds while loop busy approaches 100%.",
      },
      {
        title: "Prove the collateral damage from the shell",
        language: "bash",
        code: `# server.js exposes /block (200 ms of pure CPU) and /ping (trivial)

# Fire the blocking request, then immediately ask for the healthy one:
curl -s -o /dev/null -w "block:          %{time_total}s\\n" http://127.0.0.1:3000/block &
sleep 0.05
curl -s -o /dev/null -w "ping while blocked: %{time_total}s\\n" http://127.0.0.1:3000/ping
wait

# Expected classes of result:
#   before fix: /ping jumps from ~1 ms to roughly the remaining block time
#   after fix:  /ping stays at ~1 ms no matter what /block is doing`,
        description:
          "The gap between those two ping numbers is the price other users pay for your synchronous work — and the number that must return to baseline after the fix.",
      },
    ],
    commonMistakes: [
      "Calling readFileSync or writeFileSync inside a handler because it is \"simpler\" — you have moved disk latency onto the shared loop.",
      "Using the Sync crypto helpers in a request path: hashing is CPU work, and ten concurrent requests become a queue.",
      "Believing that \"my endpoint is fast on my laptop\" proves anything — blocking only shows up under concurrency.",
      "Fixing a block by yielding every N iterations with setInterval: latency is smoothed, but the total CPU time and tail are unchanged.",
    ],
    bestPractices: [
      "Instrument event-loop delay from day one and put p99 delay on the same dashboard as p95 request latency.",
      "Bound every request body and every batch before parsing — the size limit is the block-size limit.",
      "Reach for fs.promises and the async crypto APIs by default; treat the Sync variants as a deliberate exception.",
      "Reserve worker threads for computation that is genuinely CPU-bound and measured to be the bottleneck (lesson 15).",
    ],
    realWorldUseCases: [
      "A bulk-import endpoint that parses gigabytes of JSON synchronously turns a 2 ms health check into a 3-second timeout, and the load balancer starts evicting the instance.",
      "An image-heavy feed API runs a synchronous blur filter per request; event-loop delay p99 tracks the filter exactly and drops to single digits once it moves to a worker.",
    ],
    resources: [
      docs(
        "Node.js API — Perf_hooks module",
        "https://nodejs.org/api/perf_hooks.html",
        "monitorEventLoopDelay, eventLoopUtilization and PerformanceObserver.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Worker threads",
        "https://nodejs.org/api/worker_threads.html",
        "The escape hatch for work that cannot be made asynchronous.",
        "en",
        "reference",
      ),
      ytSearch(
        "nodejs event loop blocked synchronous code latency",
        "Demos of blocked loops, delay histograms and the fixes.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-block-measure",
        title: "Measure the block, then remove it",
        prompt:
          "Add the event-loop delay logger to your service and create a route that parses a 20 MB JSON body synchronously. With three concurrent imports running (curl or autocannon), record: (a) delay p99, (b) latency of a concurrent GET /health, (c) throughput. Then either move the parse+reduce into a worker thread or cap the body and precompute in bulk, and repeat the identical run. Report all three numbers before and after and explain the class of improvement you saw.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Generate the 20 MB body once and reuse it so the only variable is where the work runs.",
          "Watch delay p99 rather than the mean — the mean hides a single 200 ms block among thousands of idle ticks.",
        ],
        solution: `# 1) baseline with the block in place
node server.js &
npx autocannon -c 3 -d 20 -j http://127.0.0.1:3000/import > before-import.json
curl -s -o /dev/null -w "health: %{time_total}s\\n" http://127.0.0.1:3000/health
#   -> note delay p99 from your logger and health latency from this curl

# 2) apply the fix (worker thread or bounded body) and restart

# 3) identical run
npx autocannon -c 3 -d 20 -j http://127.0.0.1:3000/import > after-import.json
curl -s -o /dev/null -w "health: %{time_total}s\\n" http://127.0.0.1:3000/health

# Class of improvement to expect:
#   /health      -> back to its idle baseline (it was paying the block tax)
#   delay p99    -> falls by roughly the longest synchronous run you removed
#   import rps   -> similar or better, because the loop now interleaves work
# If /health did not improve, the block was elsewhere: profile again (lesson 2).`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-load-testing",
    slug: "load-testing",
    title: "Load Testing: k6, autocannon and Artillery",
    description:
      "Choosing a tool, designing ramp and soak profiles with realistic think time, keeping payloads honest, and encoding your SLOs as thresholds so the test fails loudly.",
    order: 7,
    estimatedMinutes: 23,
    tags: ["load-testing", "k6", "autocannon", "benchmarking", "slo"],
    prerequisites: ["p3m4-performance-profiling"],
    relatedTopics: ["p3m4-performance-monitoring", "p3m4-horizontal-scaling", "p3m4-clustering"],
    learningObjectives: [
      "Pick between autocannon, k6 and Artillery based on scenario complexity and output needs",
      "Design ramp, spike and soak profiles that resemble real traffic",
      "Add realistic think time instead of hammering as fast as possible",
      "Encode latency and error-rate SLOs as thresholds that fail the run",
    ],
    simpleExplanation:
      "A load test replays traffic at your service on purpose so it breaks in a controlled way. The important part is not the tool but the scenario: how many virtual users arrive, how long they think between actions, how big the payloads are, and what numbers must hold for the test to pass. A test without thresholds is just a number generator.",
    detailedContent: `
**Tools and their sweet spots**

| Tool | Model | Best for |
| --- | --- | --- |
| autocannon | closed, connection-based | quick HTTP baselines and CI smoke runs |
| k6 | virtual users, scripted scenarios | ramps, multi-step journeys, thresholds as code |
| Artillery | YAML scenarios, plugins | readable team-owned suites, mixed HTTP/WebSocket |

**Test types**

- **Smoke** — a handful of users; proves the test itself works.
- **Spike** — traffic jumps 10–20x for seconds; tests queue depth, autoscaling reaction and shedding behaviour.
- **Load / steady** — expected peak held for minutes; the p95/p99 numbers you compare releases against.
- **Soak (endurance)** — moderate load for hours; the test that finds leaks, pool exhaustion and log disk fill (lessons 5 and 13).
- **Stress** — push past capacity on purpose to find the ceiling and the failure mode (timeouts vs 500s vs saturation).

**Think time matters.** Real users pause: reading a page, filling a form. \`sleep(1)\` in k6 between actions models that. Removing all think time measures your maximum throughput, not your expected latency — useful, but a different experiment. Also model the *mix*: 80% reads, 10% writes, 10% heavy reports reflects reality far better than one endpoint.

**Thresholds turn numbers into pass/fail.** Express your SLO directly: \`http_req_duration: ["p(95)<300"]\` and \`http_req_failed: ["rate<0.01"]\`. The run now exits non-zero when you regress, which is what makes it viable in CI. Baselines and thresholds together are the regression contract for every change in this module.

Always seed production-like data volume first: a test against an empty table measures your index's best day, not your service.
    `,
    howItWorks: `
A load generator opens a scenario and drives virtual users through it: request, think time, next request, repeated until the duration ends. Every response is timed client-side, aggregated into per-metric distributions, and — in k6 — evaluated against your thresholds at the end of the run. Percentiles come from the client's view, so they include network and proxy time, which is exactly what a user experiences; server-side instrumentation (lesson 20) tells you which internal phase produced it.

The generator also exposes what happens *under* pressure: as concurrency rises, latency curves bend first (queueing), then error rates rise (timeouts, saturation), and finally throughput plateaus. Reading that curve tells you your operating ceiling before production does.
    `,
    codeExamples: [
      {
        title: "A k6 scenario with a ramp and SLO thresholds",
        language: "js",
        code: `import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    steady_ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 }, // warm up
        { duration: "3m", target: 20 }, // hold expected peak
        { duration: "1m", target: 0 },  // graceful ramp down
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],           // fewer than 1% errors
    http_req_duration: ["p(95)<300", "p(99)<1000"], // the SLO, as code
  },
};

export default function () {
  const list = http.get("http://127.0.0.1:3000/api/products");
  check(list, { "list 200": (r) => r.status === 200 });

  const res = http.get("http://127.0.0.1:3000/api/products/sku-123");
  check(res, { "detail 200": (r) => r.status === 200 });

  sleep(1); // realistic think time between user actions
}`,
        description:
          "One scenario, two endpoints, real think time and thresholds that make k6 exit non-zero if p95 or the error rate regresses — ready for CI.",
      },
      {
        title: "Spike and soak with autocannon",
        language: "bash",
        code: `# Spike: 10 seconds of 6x normal concurrency, then recovery
npx autocannon -c 300 -d 10 -j http://127.0.0.1:3000/api/products > spike.json
sleep 15
npx autocannon -c 50  -d 30 -j http://127.0.0.1:3000/api/products > recovery.json

# Soak: 30 minutes at expected steady load — watch for leaks and pool exhaustion
npx autocannon -c 50 -d 1800 -j http://127.0.0.1:3000/api/products > soak.json

# Compare spike.json vs recovery.json: latency should return to baseline.
# Across soak.json watch errors, throughput drift and your heapUsed floor.`,
        description:
          "Spike tests recovery, soak tests endurance. Both are cheap to run overnight against staging and both catch problems a 30-second benchmark never will.",
      },
    ],
    commonMistakes: [
      "Running at maximum concurrency with no think time, then presenting the inflated latency numbers as production expectations.",
      "Testing against an empty database or without caching in the same state as production.",
      "One endpoint, one scenario: real systems fail on the mix (read/write/report) rather than on the fastest route.",
      "No thresholds — the test produces colourful output but cannot fail a build or block a release.",
    ],
    bestPractices: [
      "Commit the scenario alongside the code so every release runs the identical test.",
      "Set thresholds from your SLO (lesson 1), and only tighten them deliberately.",
      "Run a soak before any release that adds a cache, a pool or a queue — those are where slow damage hides.",
      "Record server-side metrics (event-loop delay, pool wait time, cache hit ratio) during the run so the client numbers have a cause.",
    ],
    realWorldUseCases: [
      "A pre-holiday spike test at 10x normal traffic reveals that autoscaling needs 90 seconds but the queue only holds 60 seconds of work.",
      "A nightly soak exposes a leak that only appears after two hours — exactly the class of failure a 60-second benchmark cannot see.",
    ],
    resources: [
      docs(
        "k6 documentation",
        "https://k6.io/docs/",
        "Scenarios, executors, thresholds and running k6 locally or in CI.",
        "en",
        "reference",
      ),
      docs(
        "autocannon",
        "https://github.com/mcollina/autocannon",
        "Fast HTTP benchmarking: flags for concurrency, duration, JSON output and pipelining.",
        "en",
        "8 min",
      ),
      docs(
        "Artillery documentation",
        "https://artillery.io/docs",
        "YAML-defined load scenarios, think times, plugins and reporting.",
        "en",
        "reference",
      ),
      ytSearch(
        "k6 load testing ramp stages thresholds tutorial",
        "Hands-on load test design: ramps, think time and reading the results.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-load-scenario",
        title: "Turn an SLO into a passing test",
        prompt:
          "Write a k6 scenario for your main user journey (list → detail → create) with a 1-minute ramp to 20 VUs, a 3-minute hold, and 1 second of think time. Set thresholds of p95 under 300 ms and error rate under 1%. Run it once as-is, then deliberately break something (remove an index, or add an artificial 200 ms delay) and confirm the run fails with a non-zero exit code. Paste both threshold summaries.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "check() verifies correctness; thresholds decide pass/fail — you need both.",
          "Break the slowest step of the journey, not the whole app, so the failure is attributable.",
        ],
        solution: `// loadtest.js — run with: k6 run loadtest.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    journey: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "3m", target: 20 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

export default function () {
  const list = http.get("http://127.0.0.1:3000/api/products");
  check(list, { "list 200": (r) => r.status === 200 });

  const detail = http.get("http://127.0.0.1:3000/api/products/sku-123");
  check(detail, { "detail 200": (r) => r.status === 200 });

  sleep(1);
}

# Run 1 (healthy): every threshold line shows a green tick, exit code 0.
# Run 2 (after removing the index or adding a delay): p(95)<300 turns into a
# red cross and k6 exits non-zero — that is the regression signal for CI.`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-caching-fundamentals",
    slug: "caching-fundamentals",
    title: "Caching Fundamentals",
    description:
      "Where caches live (browser, HTTP, application, Redis), cache-aside vs read-through and write-through, TTLs and jitter, stampede control and negative caching.",
    order: 8,
    estimatedMinutes: 23,
    tags: ["caching", "http-caching", "ttl", "cache-aside", "performance"],
    prerequisites: ["p3m4-performance-profiling"],
    relatedTopics: ["p3m4-redis", "p3m4-cache-invalidation", "p3m4-database-indexing-performance"],
    learningObjectives: [
      "Distinguish browser/CDN caches, HTTP caches and application caches and where each belongs",
      "Implement cache-aside and explain how it differs from read-through and write-through",
      "Choose TTLs, add jitter, and guard against cache stampede with single-flight",
      "Use negative caching deliberately and track cache hit ratio as a first-class metric",
    ],
    simpleExplanation:
      "Caching means keeping a computed or fetched result close to where it is used so the next request skips the expensive path. The design questions are always the same: where does the copy live, how long may it live, what happens when the underlying data changes, and what stops every request from asking for the missing entry at the same moment. Get those four right and caching is the single biggest performance win available.",
    detailedContent: `
**Layers, from closest to the user**

| Layer | Controlled by | Typical use |
| --- | --- | --- |
| Browser / CDN | \`Cache-Control\`, \`ETag\` headers | static assets, public GET responses |
| Reverse proxy (Nginx, edge) | proxy_cache rules | expensive public reads |
| In-process (Map/LRU) | your code | tiny, hot, non-shared data |
| Shared store (Redis) | your code, TTLs | cross-instance reads, sessions, rate limits |

**Cache-aside (lazy population).** The application asks the cache first; on a miss it reads the source of truth and writes the copy itself. This is the default pattern because it needs no cooperation from the database and degrades gracefully — when the cache is down, every request is just a miss. **Read-through** puts the same logic behind a loading component so callers never see the miss. **Write-through** updates the cache inside the write path, trading write latency for fresher reads; the cheaper alternative is **invalidate on write** (lesson 10).

**TTL and jitter.** Every entry gets a time to live. Add random jitter (\`60 s ± 10 s\`) so a million keys do not expire in the same second.

**Stampede (thundering herd).** When a hot key expires, all concurrent requests miss together and hit the database at once. Mitigations: **single-flight** (one in-flight promise shared by all waiters), **early refresh**, and **request coalescing** at the proxy. Keep a short lock so only one process refills.

**Negative caching.** Cache the *absence* of a result (404s, empty search results) for a short time — seconds, not minutes — so scanners and typo'd ids cannot hammer the database.

Track **hit ratio** (hits / total lookups) per key space; a cache with a 40% hit ratio is mostly overhead, and that number tells you whether the TTL or the key design is wrong.
    `,
    howItWorks: `
A cache-aside read walks four states: *hit* (return immediately), *miss* (load, then populate), *expired* (TTL passed, treat as miss), and *in-flight* (another request is already loading it — wait for that result). The hit ratio you measure is the fraction of lookups in state one, and it is the only number that says whether caching is paying for itself.

Under the hood the cache trades **staleness for latency**: a hit answers in well under a millisecond because it never touches the database, and it returns whatever was true at fill time. That trade is acceptable for product pages and terrible for balances — so the TTL is a correctness decision as much as a performance one.
    `,
    codeExamples: [
      {
        title: "Cache-aside with TTL, jitter and single-flight",
        language: "js",
        code: `const cache = new Map();   // key -> { value, expiresAt }
const inflight = new Map(); // key -> Promise (stampede guard)

async function loadProduct(id) {
  const row = await db.products.findUnique({ where: { id } });
  return row;
}

export async function getProduct(id) {
  const key = "product:" + id;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  if (inflight.has(key)) return inflight.get(key); // one DB call for everyone waiting

  const work = (async () => {
    const row = await loadProduct(id);             // miss: source of truth
    const ttlMs = 60_000 + Math.floor(Math.random() * 10_000); // jitter
    cache.set(key, { value: row, expiresAt: Date.now() + ttlMs });
    return row;
  })().finally(() => inflight.delete(key));

  inflight.set(key, work);
  return work;
}`,
        description:
          "Three defences in one function: a TTL so data can age out, jitter so expiries spread out, and single-flight so 200 concurrent misses become one database query.",
      },
      {
        title: "Let the browser do the work: HTTP caching",
        language: "js",
        code: `app.get("/api/products/:id", async (req, res) => {
  const product = await getProduct(req.params.id);
  const version = '"' + product.updatedAt.getTime() + '"';

  // Reusable for a short window; revalidate afterwards without round-trips
  res.setHeader("cache-control", "public, max-age=30, stale-while-revalidate=120");
  res.setHeader("etag", version);

  if (req.headers["if-none-match"] === version) {
    return res.status(304).end(); // body never leaves the server
  }

  res.json(product);
});`,
        description:
          "ETag + If-None-Match gives you 304 Not Modified: the client still validates, but neither side ships the payload. Combine with max-age for true repeat-visit savings.",
      },
    ],
    commonMistakes: [
      "Caching with no TTL: correctness silently depends on a restart you forgot about.",
      "Caching per-user or per-tenant data under a shared key — the fastest way to leak one customer's data to another.",
      "No jitter: a million keys written at once all expire at once, and the refill looks like a traffic spike.",
      "Treating the cache as the source of truth instead of a copy with an expiry.",
    ],
    bestPractices: [
      "Measure hit ratio per key space and alert when it drops — it is the health check for your cache design.",
      "Put the TTL in the same function that writes the key, so it cannot be added \"later\".",
      "Bound every in-process cache (lesson 5) and prefer a shared store when you run more than one instance.",
      "Shorten TTLs for anything user-specific; lengthen them only for data you can prove is safe to serve stale.",
    ],
    realWorldUseCases: [
      "A product catalogue with 50k rows serves 95% of reads from a 60-second cache, cutting database CPU per request by an order of magnitude.",
      "A public API caches 404 responses for 5 seconds so credential-stuffing scanners cannot turn typos into database load.",
    ],
    resources: [
      docs(
        "MDN — HTTP caching",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
        "Freshness, validation, and how Cache-Control, ETag and If-None-Match fit together.",
        "en",
        "12 min",
      ),
      docs(
        "MDN — Cache-Control header",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
        "max-age, no-store, private, public and stale-while-revalidate semantics.",
        "en",
        "8 min",
      ),
      ytSearch(
        "cache stampede thundering herd explained single flight",
        "Walkthroughs of TTL expiry storms and how coalescing prevents them.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-cache-aside",
        title: "Add a cache and prove it pays",
        prompt:
          "Wrap your slowest read endpoint in cache-aside with a 60-second TTL and single-flight. Instrument three counters — hits, misses, database loads — plus a timer around the database call. Run the same 30-second load test before and after, then report: p95 before/after, database loads per second before/after, hit ratio, and the staleness window you accepted. If p95 did not move, explain what the profile says was actually expensive.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Run the identical scenario from lesson 1 — same concurrency, same duration, same payload.",
          "A hit ratio under ~70% usually means the key space is too fine-grained or the TTL too short for the access pattern.",
        ],
      },
      {
        id: "ex-p3m4-storm",
        title: "Trigger and then stop a stampede",
        prompt:
          "Take your new cache, set the TTL to 5 seconds, and drive 200 concurrent requests at a hot key while watching database query counts. Record the number of database loads in the expiry second with and without single-flight. Write two sentences on why the difference matters more under production traffic than in your local test.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Log each database call with a timestamp so you can count them per second.",
          "With single-flight the count should collapse to roughly one load per expiry, regardless of concurrency.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-redis",
    slug: "redis-in-practice",
    title: "Redis: Structures, Connections and Persistence Reality",
    description:
      "Which Redis structure fits caching, rate limits, locks and queues; how to handle connections without creating a pile of clients; and what RDB/AOF persistence really guarantees.",
    order: 9,
    estimatedMinutes: 24,
    tags: ["redis", "caching", "rate-limiting", "distributed-locks", "ttl"],
    prerequisites: ["p3m4-caching-fundamentals", "p2m5-rate-limiting"],
    relatedTopics: ["p3m4-cache-invalidation", "p3m4-queue-background-jobs", "p3m4-connection-pooling"],
    learningObjectives: [
      "Map a use case (cache, rate limit, lock, queue, leaderboard) to the right Redis data structure",
      "Write atomic-enough rate limiting and locking patterns, including token-safe lock release",
      "Configure one shared client per process and know when a command needs its own connection",
      "State what Redis persistence does and does not survive, and size TTLs/evictions accordingly",
    ],
    simpleExplanation:
      "Redis is an in-memory data store that answers simple operations in well under a millisecond, which is why it is everywhere in Node.js backends: caches, rate-limit counters, distributed locks, sessions and job queues all live on it. Because everything is in memory, you must give keys a lifetime, understand that losing the Redis instance may lose data, and be deliberate about how your process connects to it.",
    detailedContent: `
**Pick the structure by access pattern**

| Use case | Structure | Commands |
| --- | --- | --- |
| Cache / session / config | string + TTL | \`SET key val EX 60\`, \`GET\` |
| Rate limit counter | string (integer) or sorted set | \`INCR\` + \`EXPIRE\`, \`ZADD\`/\`ZREMRANGEBYSCORE\` |
| Distributed lock | string + \`NX\` + \`PX\` | \`SET lock:job1 token NX PX 30000\` |
| Job queue | list | \`LPUSH\`, \`BRPOP\` |
| Leaderboard / recent items | sorted set | \`ZADD\`, \`ZREVRANGE\` |
| Per-entity fields | hash | \`HSET user:1 name Amina\`, \`HGETALL\` |
| Unique visitors / membership | set, HyperLogLog | \`SADD\`, \`PFADD\` |

**Rate limiting** is \`INCR\` on a windowed key plus \`EXPIRE\` so the window cleans itself up. Two caveats: the two commands are not atomic (a crash between them leaves a key with no expiry — use a Lua script or \`SET\` with \`KEEPTTL\` patterns when that matters), and fixed windows allow a burst across the boundary; a sliding window with a sorted set fixes that at the cost of more memory.

**Locks** must be released only by their owner: store a random token, and delete with a compare-and-delete Lua script. A plain \`DEL\` would release someone else's lock when your work overruns the TTL. Treat Redis locks as *coordination*, not correctness — the TTL can expire while you still run.

**Connections.** Create **one client per process** (the library multiplexes commands over it) and share it. Blocking commands (\`BRPOP\`) monopolise their connection, so give each blocking consumer its own client. Pipelines batch commands to cut round-trips. Creating a client per request is the Redis equivalent of a connection leak.

**Persistence reality.** RDB takes point-in-time snapshots on a schedule; AOF appends writes and can fsync every second. Either way, a crash can lose the last window of writes — fine for caches, not fine for ledgers. If you cannot lose it, you are treating Redis as a database: enable AOF, back it up, and accept the throughput cost. Under memory pressure with an \`allkeys-lru\` policy, eviction is *by design* — a cached entry disappearing is a miss, not an incident.
    `,
    howItWorks: `
A Redis server runs a single-threaded command loop over an in-memory dataset (I/O happens on other threads), so one hot key's operations are serialised in arrival order — which is what makes \`INCR\` and the \`NX\` lock work without your application adding coordination. Keys carry optional expiry checked lazily on access plus an active sweeper for keys nobody touches.

Your Node.js process keeps a socket pool to the server; every command is a request/response on that socket, and a pipeline simply writes many commands before reading the replies. Replication and cluster mode add redirections (MOVED/ASK) and asynchronous replica lag, which is why reading your own write immediately after a failover is a real design question rather than a guarantee.
    `,
    codeExamples: [
      {
        title: "Fixed-window rate limiter on one shared client",
        language: "js",
        code: `import { Redis } from "ioredis";

// ONE client for the whole process — never one per request
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});

export async function hitRateLimit(ip, limit = 100, windowSec = 60) {
  const windowIndex = Math.floor(Date.now() / 1000 / windowSec);
  const key = "rl:" + ip + ":" + windowIndex;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec + 1); // first hit opens the window

  const ttl = await redis.ttl(key);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: count > limit ? ttl : 0,
  };
}`,
        description:
          "Return values here map straight onto 429 responses: allowed, X-RateLimit-Remaining and Retry-After. Keys self-destruct via TTL, so the counter table never grows.",
      },
      {
        title: "A lock that can only be released by its owner",
        language: "js",
        code: `import { randomUUID } from "node:crypto";

const RELEASE_LOCK = \`if redis.call("get", KEYS[1]) == ARGV[1]
  then return redis.call("del", KEYS[1])
  else return 0 end\`;

export async function withLock(key, ttlMs, work) {
  const token = randomUUID();
  const ok = await redis.set("lock:" + key, token, "EX", Math.ceil(ttlMs / 1000), "NX");
  if (ok !== "OK") return { acquired: false }; // someone else holds it

  try {
    return { acquired: true, result: await work() };
  } finally {
    // Compare-and-delete: never release a lock that has expired and been re-taken
    await redis.eval(RELEASE_LOCK, 1, "lock:" + key, token);
  }
}`,
        description:
          "SET ... NX PX gives you acquisition with expiry in one atomic command; the Lua script makes release atomic and owner-checked. Without the token check, a slow job releases the next job's lock.",
      },
    ],
    commonMistakes: [
      "Creating a new Redis client inside a request handler — sockets pile up and the server's client count explodes.",
      "Believing Redis is durable by default: without backups and AOF, a restart means losing the keys it held.",
      "Using Redis as a lock for correctness (double-charging money) — locks fail; make the underlying operation idempotent too.",
      "Caching a JSON blob under a key with no TTL and no maxmemory policy, then wondering why memory climbs until eviction.",
    ],
    bestPractices: [
      "One shared client per process, created at startup, closed during graceful shutdown (lesson 19).",
      "Always set a TTL on data that can be recomputed; document the TTL as part of the contract.",
      "Use Lua scripts (or a library's helper) whenever two operations must be atomic together.",
      "Monitor memory, evicted keys and hit ratio — eviction is normal for a cache and alarming for a session store.",
    ],
    realWorldUseCases: [
      "Rate limits on a public API: one INCR per request, keyed by token and minute, returning 429 with Retry-After when the window is exhausted.",
      "A queue-shaped job system: LPUSH to enqueue, BRPOP on a dedicated connection in the worker, LPUSH-based retries with EXPIRE on the job id.",
    ],
    resources: [
      docs(
        "Redis documentation",
        OFFICIAL.redisDocs,
        "Data types, expiry, transactions/Lua, replication and persistence.",
        "en",
        "reference",
      ),
      docs(
        "ioredis",
        "https://github.com/redis/ioredis",
        "A widely used Node.js client: pipelines, blocking commands, cluster support.",
        "en",
        "10 min",
      ),
      ytSearch(
        "nodejs redis rate limiter distributed lock NX PX tutorial",
        "Hands-on counters, locks and connection handling with Redis from Node.js.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-redis-limits",
        title: "Ship a limiter and a lock",
        prompt:
          "Implement the fixed-window limiter from this lesson in front of an expensive endpoint (100 requests per minute per IP) and verify a 429 with Retry-After on the 101st call using curl. Then implement withLock() and use it around a job that must not run twice concurrently — prove that a second attempt while the lock is held returns not-acquired. Finally, restart Redis and describe exactly which of your data survived and why.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "curl -i -X POST ... and count responses with a shell loop or autocannon.",
          "Set the lock TTL longer than the work takes, then deliberately sleep past the TTL to see the danger the token check protects against.",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-cache-invalidation",
    slug: "cache-invalidation",
    title: "Cache Invalidation: Keeping Copies Honest",
    description:
      "Why invalidation is the hard part: delete-on-write races, versioned keys, tag-based invalidation, and deciding how stale each feature is allowed to be.",
    order: 10,
    estimatedMinutes: 21,
    tags: ["caching", "invalidation", "consistency", "redis"],
    prerequisites: ["p3m4-caching-fundamentals", "p3m4-redis"],
    relatedTopics: ["p3m4-caching-fundamentals", "p3m4-redis", "p3m4-queue-background-jobs"],
    learningObjectives: [
      "Enumerate every copy a value may have (browser, CDN, app cache, store) before invalidating",
      "Explain the delete-on-write race and the delayed double-delete workaround",
      "Implement versioned keys and tag-based invalidation",
      "State the acceptable staleness for a feature and encode it in a TTL",
    ],
    simpleExplanation:
      "You wrote a value in five places, so you must fix it in five places — that is cache invalidation. The reliable patterns are: delete the copy when the data changes (accepting a small race), bump a version so old copies become unreachable, or group keys by tag and delete the group. Whichever you choose, the real question is how stale the data may be before a user notices, and that answer belongs in your TTL.",
    detailedContent: `
**Count the copies first.** A product price may exist in the browser cache (max-age), a CDN, your reverse proxy, an in-process Map, Redis, and — for read replicas — lagging in the database. Invalidation that ignores a layer simply moves the bug one hop closer to the user.

**Delete-on-write (invalidate on write).** After the database commit, \`DEL\` the key. The race: a reader can load the *old* row just before the commit, then re-populate the cache just after your delete, leaving stale data until the TTL expires. Mitigations, in increasing strength: a **delayed second delete** (delete again 100–500 ms later), a short TTL, or **versioned keys**.

**Versioned keys.** Keep \`ver:product:42\` and compose the real key as \`product:42:v7\`. On write, \`INCR\` the version: every old copy becomes unreachable immediately — no scan, no tag bookkeeping — and unreachable keys simply expire. Cost: reads now need the version (one extra \`GET\`, or a cached local counter), and the version key itself needs its own TTL strategy.

**Tag-based invalidation.** Store the keys belonging to a logical group in a Redis set (\`tag:product\` → {product:42, product:43}) and delete the set's members on write. This is how you invalidate a *list* page when one row changed. It costs one extra write per read and makes bulk invalidation O(number of keys), not O(everything).

**Staleness budget.** Decide per feature: balances and inventory → 0 s (invalidate on write); product descriptions → 30–300 s is fine; analytics rollups → minutes. Write the number next to the TTL; a TTL with no stated staleness budget is an accident waiting to ship.
    `,
    howItWorks: `
Invalidation is a distributed problem: the writer, the cache and every reader run in different processes with no shared clock. Delete-on-write is optimistic — it assumes no reader will refill between commit and delete, which is mostly true and occasionally false; the delayed second delete closes the practical window because the offending refill has already happened. Versioned keys sidestep the race entirely by making "invalid" a property of the *key name* rather than of the key's existence, trading one extra round-trip on the read path for correctness that does not depend on timing.

Whichever mechanism you choose, the TTL stays as the safety net: if any path forgets to invalidate, the data heals itself within the budget you set. Invalidation without a TTL is a correctness claim you have to keep forever.
    `,
    codeExamples: [
      {
        title: "Invalidate on write, with a delayed double delete",
        language: "js",
        code: `export async function updateProduct(id, patch) {
  const row = await db.products.update({ where: { id }, data: patch });

  const key = "product:" + id;
  await redis.del(key); // first delete: covers readers already finished

  // Second delete: covers a reader that loaded the old row just before
  // the commit and refilled the cache just after the first delete.
  setTimeout(() => {
    void redis.del(key).catch(() => {});
  }, 300);

  return row;
}`,
        description:
          "Two deletes, one small timer. Combined with a modest TTL this closes the classic read-modify race without any distributed lock.",
      },
      {
        title: "Tag-based invalidation for list + detail pages",
        language: "js",
        code: `async function cacheList(tag, key, load, ttlSec = 60) {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);

  const value = await load();
  await redis.set(key, JSON.stringify(value), "EX", ttlSec);
  await redis.sAdd("tag:" + tag, key); // membership: which keys belong to this group
  return value;
}

async function invalidateTag(tag) {
  const members = await redis.sMembers("tag:" + tag);
  if (members.length > 0) await redis.del(...members);
  await redis.del("tag:" + tag);
}

// After any write to a product:
await invalidateTag("products");
await invalidateTag("product:" + id);`,
        description:
          "One write invalidates the list page, the category page and the detail page at once — the group, not the individual key, is what your domain actually reasons about.",
      },
    ],
    commonMistakes: [
      "Invalidating only the detail key and leaving the list endpoint serving stale entries for the whole TTL.",
      "Deleting the cache before committing the database — a reader repopulates with the old row and stays stale.",
      "Inventing a version counter with no expiry and no upper bound, then storing it per key with no reclamation.",
      "Promising \"real time\" in the UI while the edge cache sits in front with max-age=3600.",
    ],
    bestPractices: [
      "Invalidate after the commit, never before it.",
      "Always give cached copies a TTL even when you also invalidate — it is the fallback for the paths you forgot.",
      "Write the acceptable staleness per endpoint in the API docs so clients can set their own expectations.",
      "For multi-instance services prefer shared invalidation (Redis pub/sub or versioned keys) over per-process memory.",
    ],
    realWorldUseCases: [
      "An admin edits a product: the detail key is deleted, the products tag is invalidated, and any browser copy ages out within max-age — three layers, one mental model.",
      "A pricing service bumps a version number on every change; all 12 instances see the new price on the next read with no broadcast at all.",
    ],
    resources: [
      docs(
        "Redis documentation",
        OFFICIAL.redisDocs,
        "Sets and sorted sets as tag indexes, expiry semantics and Lua for atomic invalidation.",
        "en",
        "reference",
      ),
      docs(
        "MDN — HTTP caching",
        "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
        "The client-side copies you must account for when you claim data is fresh.",
        "en",
        "12 min",
      ),
      ytSearch(
        "cache invalidation strategies explained cache aside write through versioned keys",
        "Comparisons of invalidation patterns and their failure modes.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-staleness-contract",
        title: "Write the staleness contract",
        prompt:
          "Take five read endpoints from your project and fill in a table: endpoint, cache layers involved, TTL, invalidation trigger, and the staleness a user may perceive. Then pick the worst row — the one where the perceived staleness exceeds what the feature tolerates — and fix it with either delayed double delete or versioned keys. Include a curl test that demonstrates stale-then-fresh behaviour before and after your change.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Use curl -sI and inspect Cache-Control/ETag to see the browser and proxy layers.",
          "To demo staleness: read, write through a different code path, read again, and note the timestamp on the returned entity.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-database-indexing-performance",
    slug: "database-indexing-performance",
    title: "Database Indexing for Performance",
    description:
      "Finding the queries worth indexing, reading EXPLAIN ANALYZE like a profiler, ordering composite indexes, judging selectivity and reaching for covering indexes.",
    order: 11,
    estimatedMinutes: 24,
    tags: ["indexes", "postgresql", "mongodb", "explain", "query-plan"],
    prerequisites: ["p2m4-indexes-sql", "p2m3-indexes", "p3m4-performance-profiling"],
    relatedTopics: ["p2m4-query-optimization", "p3m4-query-optimization-advanced", "p3m4-connection-pooling"],
    learningObjectives: [
      "Locate the slowest queries with pg_stat_statements or an ORM explain call",
      "Read EXPLAIN ANALYZE: scan type, rows removed by filter, estimated vs actual rows, buffers",
      "Order composite index columns correctly and justify the order from the query shape",
      "Recognise when a covering index eliminates heap access entirely",
    ],
    simpleExplanation:
      "An index is a sorted side structure that lets the database jump to matching rows instead of reading the whole table. Which columns you index, and in what order, decides whether a query runs in a millisecond or scans a million rows — and the only honest way to know the difference is to run EXPLAIN ANALYZE before and after and read the plan the database prints.",
    detailedContent: `
**Start from evidence, not intuition.** Enable \`pg_stat_statements\` and sort by \`mean_exec_time * calls\`: the *total* cost is what hurts, so a 5 ms query called a million times beats a 2-second report nobody runs. In MongoDB, use \`explain("executionStats")\` and look at \`totalDocsExamined\` versus \`nReturned\` — a ratio near 1 means an index did its job, a ratio near the collection size means you scanned.

**Reading \`EXPLAIN ANALYZE\`.** The three numbers that matter:

- **Scan type** — \`Seq Scan\` on a large table with a selective WHERE is usually the bug; \`Index Scan\`, \`Bitmap Index Scan\` or \`Index Only Scan\` are what you want.
- **estimated rows vs actual rows** — a big gap means stale statistics; run \`ANALYZE table\` before you blame the index.
- **Rows Removed by Filter** — how many rows the engine walked past. A million removed rows with \`actual rows=18\` is a predicate the index could have prevented.

**Composite order.** A B-tree can only use a prefix of its columns efficiently, so put **equality columns first, then the sort or range column**: \`WHERE tenant_id = $1 AND status = $2 ORDER BY created_at\` wants \`(tenant_id, status, created_at)\`. The reverse order serves tenant-only queries but not this one.

**Selectivity.** An index on a boolean that is \`true\` for 95% of rows filters almost nothing; combine a low-cardinality column with a high-cardinality one (\`status\`, \`tenant_id\`) so the pair is selective.

**Covering indexes.** PostgreSQL's \`INCLUDE (id, email)\` puts payload columns in the index so the scan answers from the index alone — an *Index Only Scan* with no heap fetch. Worth it for hot, narrow, read-mostly projections; it costs write time and disk.
    `,
    howItWorks: `
A B-tree index stores sorted (key, row-pointer) pairs in pages with a branching structure, so a lookup costs O(log n) page visits instead of O(n) row reads. Range predicates work because entries are sorted — but only along the indexed order, which is why column order is a semantic decision, not a style one. Statistics gathered by ANALYZE feed the planner's cost model: it estimates selectivity from histograms and picks whichever plan is cheaper, which is why "the index exists but is not used" often means stale stats, a function around the column (lesson 12), or a genuinely cheaper sequential scan on a small table.

Indexes are not free: every INSERT/UPDATE/DELETE maintains every index, so each one you add must earn its keep against measured query cost.
    `,
    codeExamples: [
      {
        title: "Before/after: find, read, index, re-read",
        language: "sql",
        code: `-- 1) Which queries actually cost the most?
SELECT calls, mean_exec_time, total_exec_time, left(query, 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- 2) Read the plan for the offender
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, email FROM users
WHERE tenant_id = 'tenant-42' AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;
-- Typical bad shape:
--   Seq Scan on users ... rows=1000000 actual rows=18
--   Rows Removed by Filter: 999982   Execution Time: ~hundreds of ms

-- 3) Index in the order the query constrains: equality, equality, sort
CREATE INDEX CONCURRENTLY idx_users_tenant_status_created
  ON users (tenant_id, status, created_at DESC);

-- 4) Re-run step 2. Expected classes of change:
--   Seq Scan -> Index/Bitmap Scan, Rows Removed by Filter ~ 0,
--   buffers shared read drop sharply, execution time falls by orders of magnitude.

-- 5) Hot narrow projection? Make it covering:
CREATE INDEX CONCURRENTLY idx_users_tenant_status_cover
  ON users (tenant_id, status, created_at DESC) INCLUDE (id, email);`,
        description:
          "The full evidence loop the whole lesson is built on: offenders → plan → index in constraint order → re-plan → optionally covering. Save both plan outputs in the pull request.",
      },
      {
        title: "The MongoDB equivalent",
        language: "js",
        code: `const plan = await Order.find({ userId, status: "paid" })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats");

const stats = plan.executionStats;
console.log({
  returned: stats.nReturned,          // rows you wanted
  keysExamined: stats.totalKeysExamined,   // index entries read
  docsExamined: stats.totalDocsExamined,   // documents fetched
  millis: stats.executionTimeMillis,
});
// Healthy: keysExamined ~= nReturned, docsExamined ~= nReturned
// Unhealthy: docsExamined ~= collection size => COLLSCAN, add an index`,
        description:
          "executionStats gives you the same story EXPLAIN ANALYZE tells in PostgreSQL — the ratio of examined to returned is the single number to watch.",
      },
    ],
    commonMistakes: [
      "Adding an index \"because it might help\" without an EXPLAIN before/after — write cost and disk are permanent, the win is theoretical.",
      "Reversing composite order: (created_at, tenant_id) cannot serve a tenant-scoped query efficiently, while (tenant_id, created_at) usually can.",
      "Indexing a column wrapped in a function (WHERE lower(email) = ...) with a plain index — the planner cannot use it (lesson 12).",
      "Ignoring stale statistics: after bulk loads, ANALYZE (or an ORM's equivalent) before concluding the planner is wrong.",
    ],
    bestPractices: [
      "Every new index ships with its before/after plan in the pull request.",
      "Start with equality columns, then the sort/range column — write the query first and derive the index from it.",
      "Watch index usage: PostgreSQL's pg_stat_user_indexes idx_scan tells you which indexes nobody reads (candidates for removal).",
      "Prefer CONCURRENTLY in production so index creation does not block writes for minutes.",
    ],
    realWorldUseCases: [
      "A tenant-scoped listing query drops from a 400 ms sequential scan to a 2 ms index scan by adding (tenant_id, status, created_at).",
      "An analytics endpoint repeatedly filtering on a boolean is index-free by design; the fix is a covering composite with a selective leading column, not an index on the boolean alone.",
    ],
    resources: [
      docs(
        "PostgreSQL — Using EXPLAIN",
        "https://www.postgresql.org/docs/current/using-explain.html",
        "Plan nodes, EXPLAIN ANALYZE, BUFFERS, and how to read estimated vs actual rows.",
        "en",
        "20 min",
      ),
      docs(
        "PostgreSQL — pg_stat_statements",
        "https://www.postgresql.org/docs/current/pgstatstatements.html",
        "Finding the queries that cost the most in total, not just the slowest single call.",
        "en",
        "12 min",
      ),
      docs(
        "MongoDB Manual — Query plans and explain",
        OFFICIAL.mongodbManual,
        "explain('executionStats'), IXSCAN vs COLLSCAN and docs examined ratios.",
        "en",
        "reference",
      ),
      ytSearch(
        "postgres explain analyze composite index order covering index",
        "Plan-reading walkthroughs with real before/after index examples.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-explain-loop",
        title: "Take one query from scan to index",
        prompt:
          "Find your slowest endpoint and capture the full EXPLAIN (ANALYZE, BUFFERS) output. Record: scan type, estimated vs actual rows, rows removed by filter, buffers read and execution time. Create the index you derive from the WHERE/ORDER BY shape, re-run the same EXPLAIN, and write a before/after table of those five fields. Then run the 30-second load test on that endpoint and report p95 before and after — plus the number of index entries the new index adds on insert (check pg_relation_size).",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "EXPLAIN (ANALYZE, BUFFERS) runs the query — use a read-only statement, or wrap writes in BEGIN/ROLLBACK.",
          "If the plan does not change, check whether a function or implicit cast is wrapping your indexed column.",
        ],
        solution: `-- BEFORE
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, email FROM users
WHERE tenant_id = 'tenant-42' AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;
-- Note: scan type, rows removed by filter, execution time, shared read

-- DERIVE the index from the query: equality, equality, sort
CREATE INDEX CONCURRENTLY idx_users_tenant_status_created
  ON users (tenant_id, status, created_at DESC);

ANALYZE users;

-- AFTER (identical statement)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, email FROM users
WHERE tenant_id = 'tenant-42' AND status = 'active'
ORDER BY created_at DESC
LIMIT 20;

-- Record both plans, then benchmark:
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/users > after-index.json

-- Classes of improvement to expect:
--   Seq Scan        -> Index/Bitmap Scan
--   Rows Removed    -> ~0 (index prefilters)
--   buffers read    -> drops by roughly the table size / index size ratio
--   p95 latency     -> falls by the share of time the scan represented
-- Cost side to report too: pg_relation_size('idx_users_tenant_status_created')
-- and the slower INSERT throughput on users.`,
        solutionLanguage: "sql",
      },
      {
        id: "ex-p3m4-index-audit",
        title: "Audit what you already have",
        prompt:
          "List every index in your database with its size and scan count (pg_stat_user_indexes in PostgreSQL, or db.coll.getIndexes() plus $indexStats in MongoDB). Mark each as \"load-bearing\", \"redundant\" (a prefix of another index) or \"unused\". Propose dropping one redundant or unused index and estimate the write-path saving, then drop it in a staging environment and re-run your load test to confirm nothing regressed.",
        difficulty: "advanced",
        estimatedMinutes: 40,
        hints: [
          "An index whose columns are a strict prefix of another index can usually go.",
          "Re-run the full suite, not just the endpoint that motivated the audit — indexes affect many queries at once.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-query-optimization-advanced",
    slug: "query-optimization-advanced",
    title: "Advanced Query Optimisation",
    description:
      "Batching instead of N+1, keyset pagination over OFFSET, selecting only the columns you need, sargable predicates and precomputed aggregates.",
    order: 12,
    estimatedMinutes: 23,
    tags: ["sql", "query-optimization", "pagination", "n+1", "aggregates"],
    prerequisites: ["p2m4-query-optimization", "p2m4-indexes-sql", "p3m4-database-indexing-performance"],
    relatedTopics: ["p3m4-database-indexing-performance", "p3m4-streams-performance", "p3m4-caching-fundamentals"],
    learningObjectives: [
      "Detect and fix N+1 query patterns by batching round-trips",
      "Replace OFFSET pagination with keyset/cursor pagination for deep pages",
      "Write sargable predicates that the planner can satisfy with an index",
      "Decide when a summary table or materialised aggregate beats computing at read time",
    ],
    simpleExplanation:
      "Fast queries are usually not one clever trick — they are fewer round-trips, fewer rows touched and predicates the index can actually use. Do not ask for columns you never use, do not scan and discard rows to reach page 500, do not hide the indexed column inside a function, and for expensive dashboards stop recomputing the same totals on every view.",
    detailedContent: `
**Batching beats looping.** The N+1 pattern (one query for a list, then one per item) multiplies latency by the row count and turns a 20 ms page into a 400 ms one. Batch with \`WHERE id = ANY($1)\` / Prisma's \`in\` / Mongo's \`$in\`. Two caveats: keep parameter arrays chunked (a few thousand at most) to protect packet size and planner sanity, and remember batching removes *round-trips*, not row-processing cost.

**Pagination.** \`LIMIT 20 OFFSET 10000\` makes the engine read and throw away 10,000 rows — latency grows linearly with page depth, and pages shift when rows are inserted. **Keyset pagination** starts exactly where the index already points:

    WHERE (created_at, id) < ($1, $2)
    ORDER BY created_at DESC, id DESC
    LIMIT 20

The cursor (last \`created_at\`, \`id\`) is handed to the client as an opaque token. Cost is constant per page and pages stay stable under inserts. Use OFFSET only for shallow admin tables where the UX genuinely needs "jump to page 40".

**Select only what you need.** \`SELECT *\` pulls unneeded columns (I/O, memory, serialisation), widens rows so more of them fit per page, and blocks index-only scans. For list views, project two or three columns; expand details on the detail endpoint.

**Sargable predicates.** An index on \`created_at\` cannot serve \`WHERE DATE(created_at) = '2026-10-01'\` — the function is applied *after* retrieval. Rewrite as a range: \`created_at >= '2026-10-01' AND created_at < '2026-10-02'\`. Same for \`LOWER(email)\` (use a functional index or citext), leading wildcards (\`LIKE '%x'\`) and implicit casts.

**Materialised aggregates.** When a dashboard sums a million rows per view, precompute: a \`daily_totals\` table refreshed on a schedule or updated transactionally with each write. The trade is freshness for constant read cost — state the staleness (lesson 10) and let a queue or cron own the refresh.
    `,
    howItWorks: `
Each of these changes alters *how many rows the engine touches and how many round-trips it makes*, which are the two terms in the latency equation the planner cannot optimise for you. N+1 multiplies round-trips; OFFSET multiplies discarded rows; \`SELECT *\` multiplies bytes; a non-sargable predicate multiplies scans into filters; and read-time aggregation multiplies all of them at once.

Because the planner only rewrites expressions it can prove equivalent, it will not turn \`DATE(created_at) = ...\` into a range scan for you — sargability is the programmer's job. Likewise, batching and cursors are application-level decisions that no index can rescue.
    `,
    codeExamples: [
      {
        title: "Keyset pagination vs OFFSET",
        language: "sql",
        code: `-- Page 500 of an OFFSET query: reads and discards 10,000 rows first
SELECT id, title, created_at
FROM articles
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 10000;

-- Keyset: the (created_at, id) index walk starts at the cursor
SELECT id, title, created_at
FROM articles
WHERE (created_at, id) < ($1::timestamptz, $2::uuid)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- Client sends back the last row's created_at and id as an opaque cursor.
-- Latency stays flat as the feed grows; rows inserted meanwhile cannot shift pages.`,
        description:
          "Same 20 rows, radically different work: OFFSET pays for everything it skipped; keyset pays only for the rows it returns.",
      },
      {
        title: "Kill the N+1 with one batched query",
        language: "js",
        code: `// BEFORE — 1 + N queries; 50 orders = 51 round-trips
const orders = await db.orders.findMany({ where: { userId } });
for (const order of orders) {
  order.product = await db.products.findUnique({ where: { id: order.productId } });
}

// AFTER — 2 queries, regardless of row count
const orders = await db.orders.findMany({
  where: { userId },
  select: { id: true, qty: true, price: true, productId: true }, // no SELECT *
});
const productIds = [...new Set(orders.map((o) => o.productId))];
const products = await db.products.findMany({
  where: { id: { in: productIds } },
  select: { id: true, name: true, price: true },
});
const byId = new Map(products.map((p) => [p.id, p]));

for (const order of orders) order.product = byId.get(order.productId);`,
        description:
          "Round-trips drop from 1 + N to 2 and the projection keeps rows narrow. Under load the difference shows up directly in p95 because every avoided query is an avoided pool checkout.",
      },
    ],
    commonMistakes: [
      "Shipping a list endpoint with a nested loop of detail queries — the most common cause of a 'fast locally, slow in production' page.",
      "Using OFFSET for an infinite scroll feed: page cost grows forever and rows shift under concurrent writes.",
      "Wrapping an indexed column in a function or cast, then concluding 'the index does not work'.",
      "Recomputing identical aggregates per request and only adding a summary table after the dashboard times out — measure first (lesson 1).",
    ],
    bestPractices: [
      "Project explicit columns in list queries; fetch full rows only on detail/mutation paths.",
      "Prefer cursor pagination for anything user-facing and unbounded; expose the cursor as an opaque token.",
      "Write predicates as ranges on the raw column so indexes stay usable.",
      "Keep summary tables next to their source of truth and refresh them through the same write path or a queue (lesson 18).",
    ],
    realWorldUseCases: [
      "A social feed moves from OFFSET to a cursor and page 500 stops costing 10x page 1 — the same endpoint, flat latency.",
      "A nightly revenue report precomputes per-day totals; the dashboard query drops from a multi-second aggregate scan to a single indexed range read.",
    ],
    resources: [
      docs(
        "PostgreSQL — Using EXPLAIN",
        "https://www.postgresql.org/docs/current/using-explain.html",
        "Verify each rewriter: plan shapes for OFFSET vs index-ordered LIMIT.",
        "en",
        "20 min",
      ),
      docs(
        "Node.js Best Practices",
        OFFICIAL.nodeBestPractices,
        "Layered data-access advice that keeps query shapes in one place.",
        "en",
        "reference",
      ),
      ytSearch(
        "n+1 query problem keyset pagination cursor sql",
        "Before/after comparisons of batching and cursor pagination.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-page-deep",
        title: "Flatten the deep-page curve",
        prompt:
          "Measure your list endpoint at page 1, page 50 and page 500 (OFFSET), recording p95 for each. Then implement keyset pagination with an opaque cursor and repeat at the same three positions. Plot or tabulate the three pairs and explain in two sentences why the curve flattens — and name one feature you had to give up (for example jumping to an arbitrary page) and how you justified losing it.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "Include (created_at, id) in the cursor: created_at alone is not unique and will skip or duplicate rows.",
          "Autocannon with a URL that changes per page keeps the scenario identical apart from the cursor.",
        ],
      },
      {
        id: "ex-p3m4-sargable",
        title: "Make three predicates sargable",
        prompt:
          "Rewrite these so an index on the raw column can be used, then capture EXPLAIN ANALYZE before and after for each: (1) WHERE DATE(created_at) = '2026-10-01', (2) WHERE LOWER(email) = 'amina@example.com', (3) WHERE status || '/' || region = 'active/emea'. For each, state which index you would add and whether a functional index is required.",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "A date equality becomes a two-sided range on the timestamp column.",
          "lower(email) needs either a functional index on lower(email) or a case-insensitive column type.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-connection-pooling",
    slug: "connection-pooling",
    title: "Connection Pooling and Pool Sizing",
    description:
      "Why pools exist, how to size one from cores and database capacity across all your instances, what exhaustion looks like, and the timeouts that turn a hang into an error.",
    order: 13,
    estimatedMinutes: 22,
    tags: ["connection-pool", "postgresql", "mongodb", "pg", "capacity"],
    prerequisites: ["p2m4-postgres-from-node", "p2m3-mongoose-connection-management", "p3m4-performance-profiling"],
    relatedTopics: ["p3m4-query-optimization-advanced", "p3m4-graceful-shutdown", "p3m4-horizontal-scaling"],
    learningObjectives: [
      "Explain why connections are expensive on both the client and the database side",
      "Size a pool from CPU/memory constraints and account for every replica that will have its own pool",
      "Configure pg and MongoDB pools with explicit limits and timeouts",
      "Read the pool's own health metrics (waiting, idle, total) and act on them",
    ],
    simpleExplanation:
      "Opening a database connection costs a network round-trip, a TLS handshake and authentication, so applications keep a small set of connections open and lend them out — that set is a pool. Too few and requests queue behind each other; too many and the database itself collapses under connection overhead. Sizing is arithmetic: your pool size times the number of instances must fit inside what the database can serve.",
    detailedContent: `
**The trade-off.** A connection is not a socket you own cheaply: on PostgreSQL each one is a backend process with its own memory; on MongoDB each consumes a socket plus server-side state. Reusing connections removes handshake latency; capping their number protects the server.

**The sizing arithmetic.** A common starting point for PostgreSQL is \`max ≈ (cores × 2) + spindles\` — CPU for query work, extra slots for I/O wait. Now multiply by reality: if you run 6 application instances with \`max: 20\`, you are asking for 120 connections against a database whose \`max_connections\` may be 100. Either lower per-instance \`max\`, use fewer replicas, or put a connection pooler (PgBouncer, or PostgreSQL's own pooler) in front. Size **per instance**, then check the **fleet total**.

**What exhaustion looks like.** The queue grows: \`waitingCount\` climbs, p95 rises with it, and without a timeout requests hang until the client gives up. \`connectionTimeoutMillis\` turns that into a fast, loggable error; \`idleTimeoutMillis\` returns unused connections; a server-side \`statement_timeout\` stops a runaway query from holding a slot forever.

**One pool per process.** Construct the pool at startup, share it module-wide, and close it during graceful shutdown (lesson 19). Creating \`new Pool()\` per request is the classic exhaustion bug: sockets multiply, the database refuses new ones, and the whole fleet falls over together.

**MongoDB equivalents:** \`maxPoolSize\`, \`minPoolSize\`, \`waitQueueTimeoutMS\` — same reasoning, different names. Mongoose reuses one connection pool per process when you call \`mongoose.connect\` once.
    `,
    howItWorks: `
When a query arrives, \`pool.query\` checks out an idle client (usually resolved on the next tick), runs the statement, and releases it. If every client is busy, the request joins a FIFO queue; a new client is created only while \`max\` is not reached, and \`waitingCount\` reports how many requests are queued — the number that tells you the pool, not the database, is your bottleneck.

Because the pool lives per process, capacity is multiplicative: process count × pool max × database capacity are three numbers that must be solved together. Monitoring them side by side (pool waiting next to database CPU) separates "my app is queueing on its own pool" from "the database is saturated" in one glance.
    `,
    codeExamples: [
      {
        title: "A pg pool with explicit limits and metrics",
        language: "js",
        code: `import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                       // per process — size it, do not inherit the default blindly
  idleTimeoutMillis: 30_000,     // return unused sockets instead of pinning them
  connectionTimeoutMillis: 2_000, // fail fast rather than queue forever
});

// Idle-client errors (database restart, network blip) arrive as 'error' events;
// without a listener Node treats them as uncaught and kills the process.
pool.on("error", (err) => logger.error({ err }, "idle pg client failed"));

setInterval(() => {
  logger.info({
    waiting: pool.waitingCount, // > 0 sustained => the pool is the ceiling
    idle: pool.idleCount,
    total: pool.totalCount,
  });
}, 10_000).unref();

// One shared entry point for the whole application
export const query = (text, params) => pool.query(text, params);`,
        description:
          "waitingCount is the pool's heart rate: sustained non-zero values mean requests are queueing on your own configuration, not on the database.",
      },
      {
        title: "The MongoDB driver equivalents",
        language: "js",
        code: `import mongoose from "mongoose";

// Called exactly ONCE at startup — one pool per process
await mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 20,          // per process; multiply by instance count
  minPoolSize: 2,           // keep warm connections for bursty traffic
  waitQueueTimeoutMS: 2_000, // turn exhaustion into a visible error
  socketTimeoutMS: 45_000,
});

// During graceful shutdown (lesson 19):
// await mongoose.connection.close();
console.log("pool ready", mongoose.connection.readyState === 1);`,
        description:
          "Driver options mirror pg's: a cap, a floor, and a wait timeout. The critical discipline is still one connect() per process, never one per request.",
      },
    ],
    commonMistakes: [
      "Constructing a new Pool (or MongoClient) inside a request handler — the fastest route to 'too many connections' errors.",
      "Leaving max at the driver default (10 for pg) while running 20 replicas: either you under-use the database or you exceed max_connections on the busy instance.",
      "No connectionTimeoutMillis: under load the queue grows silently and requests hang instead of failing loudly.",
      "Forgetting pool.end()/close() in shutdown, so the process never exits and the orchestrator has to SIGKILL it.",
    ],
    bestPractices: [
      "Compute fleet-wide connections (instances × max) before choosing max, and compare it with the database's limit.",
      "Export waiting/idle/total as metrics and alert when waiting stays above zero.",
      "Set connectionTimeoutMillis and a server-side statement timeout so both queueing and runaway queries fail fast.",
      "Close pools as part of the shutdown sequence (lesson 19) so in-flight work finishes before sockets disappear.",
    ],
    realWorldUseCases: [
      "A deployment with 8 replicas × 25 connections was asking for 200 backends against max_connections=100; halving per-instance max and adding a pooler fixed intermittent 500s.",
      "A batch job opening its own MongoClient per loop iteration exhausted sockets mid-run; a single shared client made it faster and survivable.",
    ],
    resources: [
      docs(
        "node-postgres — pg.Pool",
        "https://node-postgres.com/apis/pool",
        "max, idleTimeoutMillis, connectionTimeoutMillis, waitingCount and pool.end().",
        "en",
        "12 min",
      ),
      docs(
        "node-postgres — Pool sizing guide",
        "https://node-postgres.com/guides/pool-sizing",
        "The reasoning behind pool max and how queueing behaves when you get it wrong.",
        "en",
        "10 min",
      ),
      docs(
        "Mongoose documentation",
        OFFICIAL.mongooseDocs,
        "Connection lifecycle and the driver pool options Mongoose passes through.",
        "en",
        "reference",
      ),
      ytSearch(
        "node js postgres connection pool sizing exhaustion",
        "Walkthroughs of pool queueing, timeouts and fleet-wide sizing.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-pool-ceiling",
        title: "Find your pool ceiling",
        prompt:
          "Log waitingCount/idleCount/total every second, then run the identical 30-second load test three times with POOL_MAX set to 2, 10 and 50. For each run record p95, throughput, errors and the maximum waitingCount you observed. Write a one-paragraph verdict: which setting first stopped queueing, what started limiting you afterwards (pool vs database CPU), and what fleet-wide number your chosen max implies at your production replica count.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "Read POOL_MAX from process.env in the pool constructor so you do not edit code between runs.",
          "If p95 improves from max=2 to max=10 but not from 10 to 50, the database — not the pool — became the limit.",
        ],
        solution: `# app reads:  new Pool({ ..., max: Number(process.env.POOL_MAX ?? 10), connectionTimeoutMillis: 2000 })

# Run 1: max = 2
POOL_MAX=2 node server.js &
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/orders > pool-2.json

# Run 2: max = 10
kill %1; POOL_MAX=10 node server.js &
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/orders > pool-10.json

# Run 3: max = 50
kill %1; POOL_MAX=50 node server.js &
npx autocannon -c 50 -d 30 -j http://127.0.0.1:3000/api/orders > pool-50.json

# For each file record: latency.p99, requestsPerSec, non2xx
# plus the max waitingCount from your logger.
#
# Expected classes of result:
#   max=2  -> waitingCount pinned high, p99 dominated by queueing
#   max=10 -> waitingCount ~0, throughput jumps (pool was the ceiling)
#   max=50 -> little further gain; database CPU/IO now the limit, or errors
#             appear if 50 x replicas exceeds max_connections
#
# Fleet check: chosen max x instance count must stay well under the
# database max_connections (leave headroom for admins, replicas and tools).`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-booking-platform", "p3-ecommerce-platform"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-streams-performance",
    slug: "streams-performance",
    title: "Streams Performance: Never Buffer the Whole Thing",
    description:
      "Streaming JSON, CSV and file exports with pipeline(), what backpressure actually protects, and why Buffer + res.json() collapses on large result sets.",
    order: 14,
    estimatedMinutes: 21,
    tags: ["streams", "backpressure", "pipeline", "exports", "memory"],
    prerequisites: ["p2m1-streams-backpressure", "p3m4-performance-profiling"],
    relatedTopics: ["p3m4-worker-threads-performance", "p3m4-query-optimization-advanced", "p3m4-event-loop-blocking"],
    learningObjectives: [
      "Quantify the memory and time-to-first-byte cost of buffering a large result set",
      "Use pipeline() so errors and backpressure are handled for you",
      "Stream a CSV or NDJSON export from a database cursor instead of findMany()",
      "Honour 'drain' when writing manually, and know when compression belongs in the pipeline",
    ],
    simpleExplanation:
      "If you load a million rows, build one giant string and then send it, memory spikes to several times the data size and the client waits for the whole thing before seeing a byte. Streams move the data in chunks: rows are fetched, transformed and written as they go, memory stays flat, the first bytes leave immediately, and backpressure automatically slows fetching when the client cannot keep up.",
    detailedContent: `
**The buffering trap.** \`const rows = await db.findMany(); res.json(rows)\` materialises the rows, then a serialised copy, then (for text) a string — easily 2–3× the final payload on the heap, all before the first byte is sent. At export sizes that means GC pressure, a possible OOM kill, and a client staring at a spinner while your server finishes the whole job.

**pipeline() is the default tool.** \`pipeline(source, ...transforms, destination)\` from \`node:stream/promises\` wires chunks forward, propagates backpressure, and rejects on the first error — unlike \`readable.pipe()\`, which swallows errors from the middle of the chain. Backpressure is the mechanism: a writable's \`highWaterMark\` marks "I have enough"; if the writer ignores it, chunks queue in memory and you are buffering again with extra steps.

**Sources.** A database cursor (or an async generator paging 500 rows at a time) is a natural \`Readable\`. One rule: page the database as you stream — never \`findMany()\` everything and then wrap it.

**Formats.** NDJSON (one JSON object per line) streams perfectly because each row is self-contained. CSV needs careful escaping but the same one-row-at-a-time shape. Compression (\`createGzip()\`) slots into the pipeline as another transform and usually pays for its CPU — measure it (lesson 1).

**Time-to-first-byte improves too**: clients start consuming as soon as the first page is ready, which is what makes big exports feel fast even when total transfer time is unchanged.
    `,
    howItWorks: `
Each chunk flows source → transform → destination; when the destination's internal buffer fills, it signals "pause", and that signal propagates back up to the source, which stops pulling from the database until the drain. So the fetch rate is governed by the slowest link — the client's download speed — rather than by your memory.

Errors behave the same way: a failure anywhere rejects the pipeline promise, and every stream in the chain is destroyed, so you are not left with a half-open response or an unclosed cursor. That combined behaviour — error propagation plus backpressure — is why manual chunk loops are only justified when you need per-row control the transforms cannot express.
    `,
    codeExamples: [
      {
        title: "Streaming CSV export (rows fetched in pages)",
        language: "js",
        code: `import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

// Async generator: yields arrays of rows, 500 at a time
async function* orderPages() {
  let cursor = null;
  for (;;) {
    const page = await db.raw("SELECT id, total, created_at FROM orders LIMIT 500");
    if (page.rows.length === 0) return;
    yield page.rows;
    cursor = page.rows.at(-1).id;
    if (page.rows.length < 500) return;
  }
}

app.get("/export/orders.csv", async (req, res) => {
  res.setHeader("content-type", "text/csv");
  res.setHeader("content-disposition", 'attachment; filename="orders.csv"');

  const toCsv = new Transform({
    transform(chunk, _enc, cb) {
      const lines = chunk
        .map((r) => [r.id, r.total, r.created_at.toISOString()].join(","))
        .join("\\n");
      cb(null, lines + "\\n");
    },
  });

  try {
    await pipeline(Readable.from(orderPages()), toCsv, createGzip(), res);
  } catch (err) {
    // client aborted, db failed, or headers already sent
    logger.warn({ err }, "export pipeline ended early");
  }
});`,
        description:
          "Memory stays flat regardless of table size because only one page of rows exists at any moment, backpressure slows the cursor automatically, and pipeline destroys everything on error.",
      },
      {
        title: "Before/after: NDJSON without materialising",
        language: "js",
        code: `// BEFORE — heap holds every row plus the serialised copy
const rows = await db.orders.findMany(); // 2,000,000 rows
res.json(rows);                          // JSON.stringify builds one giant string

// AFTER — one row at a time, honouring backpressure
res.setHeader("content-type", "application/x-ndjson");

for await (const page of cursorPages("SELECT id, total FROM orders", 500)) {
  for (const row of page) {
    const ok = res.write(JSON.stringify(row) + "\\n");
    if (!ok) {
      // The client cannot keep up: stop pulling rows until it drains
      await new Promise((resolve) => res.once("drain", resolve));
    }
  }
}
res.end();`,
        description:
          "The 'drain' wait is manual backpressure — the same signal pipeline() would handle for you. Expected class of change: peak RSS drops from payload-multiple to roughly constant, and time-to-first-byte goes from 'after everything' to milliseconds.",
      },
    ],
    commonMistakes: [
      "Reading a large result set fully into memory and then wrapping it in Readable.from — you streamed the output but buffered the input.",
      "Using .pipe() and losing the error: a mid-chain failure leaves an open response and an unhandled error event.",
      "Writing without checking the return value of res.write() and ignoring 'drain' — hidden buffering that grows with client slowness.",
      "String-concatenating a whole CSV in memory before sending, which is buffering with extra steps.",
    ],
    bestPractices: [
      "Default to pipeline() from node:stream/promises for any multi-stage byte path.",
      "Page or cursor the database inside the source so fetch size is bounded.",
      "Emit NDJSON or CSV row by row; reserve whole-document JSON for payloads you have proven are small.",
      "Benchmark total duration, peak RSS and time-to-first-byte — a stream can be slower on tiny payloads and still be correct to prefer.",
    ],
    realWorldUseCases: [
      "A GDPR export of a user's 400k events streams gzip-compressed NDJSON in pages while the API keeps serving normal traffic with flat memory.",
      "A nightly analytics CSV to S3 streams through a pipeline for an hour without ever holding more than a page of rows.",
    ],
    resources: [
      docs(
        "Node.js API — Streams",
        "https://nodejs.org/api/stream.html",
        "pipeline, backpressure, highWaterMark and the stream promises API.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Zlib",
        "https://nodejs.org/api/zlib.html",
        "Compression transforms you can drop into an existing pipeline.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node.js stream large csv export pipeline backpressure",
        "Build-along exports comparing buffered and streamed approaches.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-stream-export",
        title: "Stream it and watch the heap",
        prompt:
          "Export a large table (at least 500k rows) twice: once with findMany + res.json, once with a cursor + pipeline. For each run record peak RSS (from your memory logger), time-to-first-byte (curl -w '%{time_starttransfer}'), total transfer time, and whether the process survived at a 512 MB container limit. Report the four numbers side by side and state which of them changed the user's experience most.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "curl -o /dev/null -s -w 'ttfb: %{time_starttransfer}s total: %{time_total}s\\n' <url> gives you both timings.",
          "If the buffered version completes fine, shrink the container limit until it does not — that is the difference you are demonstrating.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-worker-threads-performance",
    slug: "worker-threads-performance",
    title: "Worker Threads for CPU-Bound Work",
    description:
      "Which computation deserves its own thread, how transferables avoid megabyte copies, sizing a worker pool, and measuring whether moving work off-loop actually won.",
    order: 15,
    estimatedMinutes: 24,
    tags: ["worker-threads", "cpu-bound", "transferables", "pooling", "parallelism"],
    prerequisites: ["p2m1-worker-threads", "p2m1-microtasks-macrotasks", "p3m4-event-loop-blocking"],
    relatedTopics: ["p3m4-event-loop-blocking", "p3m4-clustering", "p3m4-cpu-profiling"],
    learningObjectives: [
      "Separate work that waits (async I/O) from work that computes (worker threads)",
      "Use transfer lists to move ArrayBuffers without copying them",
      "Build or choose a bounded worker pool and queue excess jobs",
      "Measure the win on the heavy endpoint and on the endpoints it was starving",
    ],
    simpleExplanation:
      "If the work waits for a disk or a network reply, async I/O is already the answer — a worker only adds copies and startup cost. If the work computes (PDF generation, image transforms in JavaScript, compression, hashing, big parses), it belongs on another thread so the main loop keeps answering requests. Worker threads let one process use more than one core, at the price of moving data between threads.",
    detailedContent: `
**Choose the work.** Offload pure computation: rendering a PDF, resizing pixels in JS, minifying, deflate level 9, PBKDF2/scrypt at high cost, parsing a 100 MB CSV, regenerating search tokens. Do *not* offload \`fs\` or HTTP calls — those already run off-loop, and a worker would just add a message round-trip. Some native libraries (image codecs, compression) already use the libuv thread pool internally: benchmark before adding threads.

**The copy problem.** \`postMessage\` structured-clones its payload onto the receiver's heap — a 50 MB buffer costs 50 MB of allocation (twice, if you send results back). Two escapes:

- **Transfer list** — \`worker.postMessage(buffer, [buffer])\` *moves* ownership: zero copy, but the sender's buffer becomes detached. Ideal for one-way payloads like image bytes.
- **SharedArrayBuffer** — one mapping every thread sees; requires \`Atomics\` for correctness (covered in Phase 2). Ideal for ring buffers and shared counters, overkill for ordinary jobs.

**Pool it.** Worker startup costs an isolate and a thread (~tens of milliseconds), so create a pool of roughly \`availableParallelism()\` workers once, hand jobs to an idle one, and queue the rest — one worker per request will thrash. Handle crashes: a worker's \`'exit'\` with a non-zero code should be replaced, not retried blindly.

**Measure the win properly.** Re-run the identical load test: the heavy endpoint's p95 should drop (the work is parallel and the loop is free), *and* — usually the bigger effect — unrelated endpoints stop degrading while it runs. If only the heavy route got faster but everything else was already fine, the thread was not your problem.
    `,
    howItWorks: `
A Worker boots its own V8 isolate (separate heap, separate GC) on a pthread inside your process, running a full Node.js event loop. Messages cross through the parent thread's loop as structured-clone jobs; a transfer list instead re-parents the underlying ArrayBuffer so no bytes are copied. Because the isolates share nothing else, all coordination is messages — which is why you pool workers and pass ids rather than live sockets or database handles.

When a job lands, the main thread stays free: timers fire, other requests are answered, event-loop delay stays flat. The job's own duration may be unchanged or slightly worse (copy overhead); what you are buying is *non-interference* plus, with a pool of N, up to N-fold throughput on that workload.
    `,
    codeExamples: [
      {
        title: "A bounded pool with transferable payloads",
        language: "js",
        code: `import { Worker } from "node:worker_threads";
import { availableParallelism } from "node:os";

const SIZE = Math.max(1, availableParallelism() - 1);
const idle = [];
const queue = [];

function dispatch(worker, task) {
  worker.postMessage(task.buffer, [task.buffer]); // zero copy: task.buffer is detached here
  worker.once("message", (result) => {
    task.resolve(result);
    idle.push(worker);
    if (queue.length > 0) dispatch(worker, queue.shift());
  });
  worker.once("error", task.reject);
}

export function transform(buffer) {
  return new Promise((resolve, reject) => {
    const task = { buffer, resolve, reject };
    if (idle.length > 0) dispatch(idle.pop(), task);
    else queue.push(task); // bounded: no worker is created per request
  });
}

for (let i = 0; i < SIZE; i++) {
  const worker = new Worker(new URL("./transform.worker.js", import.meta.url), {
    resourceLimits: { maxOldGenerationSizeMb: 256 },
  });
  worker.on("exit", (code) => {
    if (code !== 0) idle.splice(idle.indexOf(worker), 1);
  });
  idle.push(worker);
}`,
        description:
          "Pool size ≈ cores, excess jobs wait in a queue, and the payload is transferred rather than cloned — the two details that decide whether workers help or hurt.",
      },
      {
        title: "The worker side",
        language: "js",
        code: `import { parentPort } from "node:worker_threads";

parentPort.on("message", (buffer) => {
  // CPU-bound, pure JavaScript: parse / transform / compress
  const view = new Uint8Array(buffer);
  const result = heavyTransform(view);

  const out = Buffer.from(result);
  parentPort.postMessage(out, [out.buffer]); // hand the result back without copying
});`,
        description:
          "Everything the job needs must arrive in the message (or workerData) — workers cannot see your module scope, which keeps the boundary honest.",
      },
    ],
    commonMistakes: [
      "Offloading I/O: you pay thread startup and two message copies to wait for something that was already asynchronous.",
      "Spawning a Worker per request with no bound — threads and heaps multiply until the container OOMs.",
      "Ignoring the clone cost: sending a 100 MB object by postMessage can cost more than the computation you moved.",
      "Measuring only the heavy route: the primary benefit is that other endpoints stop being starved, and that is measured on *their* p95.",
    ],
    bestPractices: [
      "Pool workers at about core count and queue excess jobs (lesson's pattern above).",
      "Pass buffers with transfer lists, and ids/small payloads for everything else.",
      "Set resourceLimits on workers handling untrusted input so one runaway job cannot take the process heap.",
      "Prove the change with the identical load test: heavy-route p95, unrelated-route p95, and CPU utilisation.",
    ],
    realWorldUseCases: [
      "An e-commerce API renders invoice PDFs in a four-worker pool while checkout latency stays flat during a promotion.",
      "A media service transforms uploaded images through transferable ArrayBuffers, cutting both main-loop delay and message-copy memory.",
    ],
    resources: [
      docs(
        "Node.js API — Worker threads",
        "https://nodejs.org/api/worker_threads.html",
        "Worker, workerData, postMessage, transfer lists and resourceLimits.",
        "en",
        "reference",
      ),
      docs(
        "MDN — Structured clone algorithm",
        "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm",
        "What postMessage copies, what it rejects, and why transfers exist.",
        "en",
        "10 min",
      ),
      ytSearch(
        "node worker threads pool image processing benchmark",
        "Comparisons of main-thread vs worker execution with real measurements.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-worker-win",
        title: "Measure the win, both ways",
        prompt:
          "Pick one CPU-bound route (PDF, compression, big parse). With the identical load test, record three numbers before and after moving it to a worker pool: (a) that route's p95, (b) an unrelated lightweight route's p95 *while the heavy route is under load*, (c) process CPU utilisation. Also record the payload size you postMessage and whether you used a transfer list. Conclude in three sentences whether the worker paid for itself and which of the three numbers moved most.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "Run the heavy route and the light route concurrently — measuring them separately hides the whole effect.",
          "If (b) barely moved before the change, your heavy route was not starving the loop; check event-loop delay instead.",
        ],
      },
      {
        id: "ex-p3m4-transfer-vs-clone",
        title: "Clone vs transfer",
        prompt:
          "Micro-benchmark postMessage of a 64 MB ArrayBuffer twice: once cloned, once with a transfer list — measure round-trip time and heapUsed before/after in each case. Then explain which situation each mode suits, and what happens to the sender's buffer after a transfer (demonstrate by reading it).",
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Use performance.now() around a postMessage → message round-trip in the worker.",
          "After transfer the sender's view is detached: reading it throws or yields zero bytes — show that in your output.",
        ],
      },
    ],
    projectIds: ["p3-job-processing"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-clustering",
    slug: "clustering",
    title: "Clustering: Cores, Isolation and Rolling Restarts",
    description:
      "What one Node.js process really uses (it already multiplexes I/O — it just runs on one core), when cluster is the right tool, and how to restart workers without dropping a connection.",
    order: 16,
    estimatedMinutes: 22,
    tags: ["cluster", "multi-core", "zero-downtime", "processes"],
    prerequisites: ["p3m4-performance-profiling", "p2m1-process-signals", "p3m4-event-loop-blocking"],
    relatedTopics: ["p3m4-horizontal-scaling", "p3m4-worker-threads-performance", "p3m4-graceful-shutdown"],
    learningObjectives: [
      "Explain accurately what a single Node.js process already handles well and where it stops",
      "Run workers under the cluster module and describe how they share a listening socket",
      "Implement a rolling restart that never leaves the port unattended",
      "Decide between clustering locally and scaling out across machines",
    ],
    simpleExplanation:
      "One Node.js process is already excellent at thousands of concurrent connections, because nearly all of that time is spent waiting for the network — but it executes your JavaScript on exactly one CPU core. cluster starts several copies of your server inside one machine so that JavaScript runs across cores, a crash takes down only one copy, and you can restart copies one at a time without the load balancer ever seeing a dead port.",
    detailedContent: `
**What one process really does.** Do not reach for cluster to "handle more connections": a single event loop already multiplexes thousands of idle sockets, and async file/crypto/DNS work runs on libuv's thread pool (tune \`UV_THREADPOOL_SIZE\` if that is your bottleneck). Cluster earns its keep for three different reasons:

1. **CPU-bound throughput** — JavaScript runs on one core; N workers give roughly N× throughput for compute-heavy routes.
2. **Fault isolation** — an uncaught exception kills one worker; the primary forks a replacement while the others keep serving.
3. **Rolling restarts** — deploy without dropping connections, which a single process cannot do by itself.

**How sharing works.** The primary forks workers; each worker runs \`server.listen\` and inherits the *same* listening handle (the kernel queues connections and hands each one to a free worker). No sticky sessions are needed for plain HTTP — the state you must share (sessions, caches, rate limits) lives in Redis or the database anyway (lesson 17).

**Rolling restart, step by step:** fork a replacement worker and wait for its \`'online'\` event; \`worker.disconnect()\` on the old one so it stops accepting and drains in-flight requests; exit after a deadline (kill if it hangs); repeat one worker at a time; never take the last worker down.

**Limits.** Each worker is a full process with its own heap — memory multiplies, and cache invalidation needs a broadcast channel (IPC messages or Redis pub/sub). Past one machine, clustering becomes horizontal scaling (lesson 17).
    `,
    howItWorks: `
The primary creates a shared handle for the server's port and passes it to each worker; on Linux this may also use \`SO_REUSEPORT\`. Because the kernel distributes accepts across those sockets, the load reaches whichever worker is free — there is no round-robin in your code and no session affinity requirement.

Liveness is handled through events: \`cluster.on('exit')\` lets you fork a replacement, and \`worker.disconnect()\` closes the worker's servers so the kernel stops routing new connections to it while existing ones finish. Combined with a forced-kill deadline, this yields deployments where the load balancer's health check never fails and users never see a connection refused.
    `,
    codeExamples: [
      {
        title: "Primary with crash respawn and rolling restart",
        language: "js",
        code: `import cluster from "node:cluster";
import { availableParallelism } from "node:os";

if (cluster.isPrimary) {
  const workers = new Set();

  function fork() {
    const worker = cluster.fork();
    workers.add(worker);
    worker.on("exit", () => {
      workers.delete(worker);
      if (!shuttingDown) fork(); // crash => replacement, capacity restored
    });
  }

  let shuttingDown = false;
  for (let i = 0; i < availableParallelism(); i++) fork();

  // Orchestrators send SIGTERM to the primary (PID 1 in the container)
  process.on("SIGTERM", async () => {
    shuttingDown = true;
    for (const worker of [...workers]) {
      worker.disconnect(); // stop accepting; let in-flight requests finish
      const forced = setTimeout(() => worker.kill(), 15_000); // deadline
      await new Promise((done) => worker.on("exit", () => {
        clearTimeout(forced);
        done();
      }));
    }
    process.exit(0);
  });
} else {
  // Each worker runs the ordinary HTTP server
  await import("./server.js");
  console.log("worker up", process.pid);
}`,
        description:
          "One worker at a time, a deadline for stragglers, and automatic respawn on crash — the three properties that make a cluster safe to deploy against.",
      },
      {
        title: "Prove the spread and the uptime",
        language: "bash",
        code: `node cluster.js

# Requests are distributed across workers (add /pid to your route)
for i in $(seq 1 8); do curl -s http://127.0.0.1:3000/pid; echo; done

# Watch CPU: with a CPU-bound route, one process sits at ~100% of ONE core,
# the clustered version spreads across cores.
#   Windows PowerShell: Get-Process node | Select-Object Id, CPU
#   macOS / Linux:      top -p $(pgrep -d, node)

# Rolling restart: send SIGTERM to the primary while hammering the API
npx autocannon -c 50 -d 60 http://127.0.0.1:3000/api/products &
kill -TERM $(pgrep -f cluster.js | head -1)
wait
# Expected: zero connection-refused errors, worker pids change during the run.`,
        description:
          "Two verifications, one paragraph each: requests spread across cores, and a deploy with no visible gap.",
      },
    ],
    commonMistakes: [
      "Reaching for cluster when the problem is I/O latency — the single process was never the limit; check pools and queries first.",
      "Forking far more workers than cores: for CPU-bound work it adds context switching and multiplies memory with no throughput gain.",
      "Taking all workers down during a deploy because shutdown logic runs in the worker instead of the primary.",
      "Storing sessions in worker memory and then rotating workers — users are logged out on every deploy (share state, lesson 17).",
    ],
    bestPractices: [
      "Start with workers = cores; raise only after measuring CPU-bound throughput scaling.",
      "Keep shared state out of process memory: Redis or the database, so any worker can serve any request.",
      "Log worker pid and lifecycle events (online, disconnect, exit) so deploys are auditable.",
      "Pair clustering with graceful shutdown (lesson 19): drain, close pools, then exit — inside each worker.",
    ],
    realWorldUseCases: [
      "A report-heavy API runs eight workers on an eight-core box; CPU-bound rendering throughput scales close to linearly while crashes stay contained.",
      "Deploys restart workers one at a time behind a load balancer, so a health check never sees an empty port and no user loses a request.",
    ],
    resources: [
      docs(
        "Node.js API — Cluster module",
        "https://nodejs.org/api/cluster.html",
        "fork, events, shared handles, disconnect() and worker lifecycle.",
        "en",
        "reference",
      ),
      docs(
        "The Twelve-Factor App — Processes",
        OFFICIAL.twelveFactor,
        "Stateless workers and why shared state belongs outside the process.",
        "en",
        "6 min",
      ),
      ytSearch(
        "node cluster module zero downtime restart rolling deploy",
        "Walkthroughs of primary/worker lifecycles and blue-green style restarts.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-rolling-proof",
        title: "Prove a zero-downtime deploy",
        prompt:
          "Run your server under cluster with N = cores and a load test running for 60 seconds. Halfway through, trigger a rolling restart. Capture: number of connection errors, any 5xx responses, and the sequence of worker pids before/during/after. Then repeat with the naive approach (kill all workers at once) and compare. Finally, run the same load test against a CPU-bound route with 1 worker and with N workers and report throughput for each — state whether you saw near-linear scaling and explain the result either way.",
        difficulty: "advanced",
        estimatedMinutes: 55,
        hints: [
          "autocannon reports non2xx and errors — that is your downtime measurement.",
          "If scaling is far from linear, check whether the route is actually CPU-bound (profile it, lesson 2) or is waiting on a shared pool.",
        ],
        solution: `# Terminal 1: cluster + pid route
node cluster.js

# Terminal 2: 60s load, restart in the middle
npx autocannon -c 50 -d 60 -j http://127.0.0.1:3000/api/products > rolling.json &
sleep 20
kill -TERM $(pgrep -f "node cluster.js" | head -1)   # primary orchestrates the rollout
wait

# Inspect
#   jq '.errors, .non2xx' rolling.json      (expect 0 and 0)
#   grep "worker up" app.log                (pids change, capacity never 0)

# CPU-bound scaling check (add a /burn route doing ~300ms of pure JS)
for workers in 1 4; do
  CLUSTER_SIZE=$workers node cluster.js &
  sleep 1
  npx autocannon -c 16 -d 20 -j http://127.0.0.1:3000/burn > burn-$workers.json
  kill %1; wait 2>/dev/null
done

# Classes of expectation:
#   rolling deploy -> 0 connection errors, 0 non2xx, pids replaced one by one
#   /burn 1 worker -> throughput ~ 1 core's worth
#   /burn 4 workers -> throughput up to ~4x if the route is truly CPU-bound;
#                      if it barely moves, the work is I/O or lock bound (profile it)`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-capstone"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-horizontal-scaling",
    slug: "horizontal-scaling",
    title: "Horizontal Scaling and Stateless Instances",
    description:
      "Adding machines instead of size: what must leave process memory the moment a second instance exists, how load balancers decide who is healthy, and how fleet size is arithmetic on a measured number.",
    order: 17,
    estimatedMinutes: 20,
    tags: ["horizontal-scaling", "load-balancing", "stateless", "autoscaling", "capacity"],
    prerequisites: ["p3m4-clustering", "p3m4-redis", "p3m4-connection-pooling"],
    relatedTopics: ["p3m4-load-testing", "p3m4-caching-fundamentals", "p3m4-graceful-shutdown"],
    learningObjectives: [
      "Choose scale-out over scale-up from a measured bottleneck rather than from habit",
      "List everything that must move out of process memory when a second instance appears",
      "Separate liveness from readiness probes so one downstream failure does not kill the fleet",
      "Compute fleet size from per-instance capacity measured under load, with headroom",
    ],
    simpleExplanation:
      "A single machine can only be made so big, so you put several identical copies of your service behind a load balancer. The hard part is not adding machines, it is making each machine interchangeable: any request must land on any instance and get the same answer, which means sessions, carts, caches and rate-limit counters can no longer live in one process's memory.",
    detailedContent: `
**Scale up or out.** Bigger instances buy headroom until you hit a single-machine ceiling (one kernel, one memory bus, one failure domain) and pay a premium per unit. Scaling out adds interchangeable machines: linear capacity and redundancy, in exchange for every assumption "one process holds everything" relied on.

**The stateless contract.** With two instances, the second request for the same user may land on the machine that never saw the first. Anything kept in module state — session, cart, hot cache entries, rate-limit counters — is now split, so users see empty carts and login loops. Move it to shared storage: carts and sessions in the database or Redis (lesson 8), rate-limit counters in Redis (lesson p3m2), cached pages in a shared cache. Sticky sessions only hide the symptom: they pin clients to one instance, which leaks capacity under uneven traffic, complicates deploys, and still loses everything when that instance restarts.

**Probes must not correlate.** The balancer removes instances failing their probe. Liveness ("is this process answering?") must never call downstream services — if it queried the database, a database blip would mark *every* instance unhealthy at once and turn a partial problem into an outage. Readiness ("may I receive traffic?") is where draining, warming and cheap downstream checks belong.

**Capacity is arithmetic.** Instances = peak QPS ÷ (measured safe QPS per instance), from your load test (lesson 7), with headroom — 70% is typical. The same multiplication applies everywhere: connection pools (lesson 13) and queue consumers grow with fleet size, so re-check the database's budget before you scale out.

**Beyond HTTP:** background jobs scale as their own fleet (lesson 18), and long-lived sockets need a pub/sub fan-out between instances or an affinity you chose deliberately.
    `,
    howItWorks: `
A request reaches the balancer, which forwards it to an instance that passed its readiness probe. That instance has no memory of the previous request: it authenticates from the token, reads the cart and counters from Redis, and therefore produces the same answer as any other instance would.

During a deploy the loop runs in reverse — the instance reports not-ready (or the balancer drains it), new connections stop arriving, in-flight requests finish, and only then does the process exit (lesson 19). Autoscaling watches a symptom signal (p95 latency or queue depth beats CPU alone), scales out when it crosses a threshold and scales in on a long cooldown so the fleet does not oscillate. Autoscaling reacts to yesterday's traffic shape; the headroom in your sizing calculation covers today's spike.
    `,
    codeExamples: [
      {
        title: "Liveness vs readiness, and draining on SIGTERM",
        language: "js",
        code: `let draining = false;

// Liveness: process alive? Never touches downstream services
app.get("/healthz", (_req, res) => res.status(200).end());

// Readiness: may this instance receive traffic?
app.get("/readyz", async (_req, res) => {
  if (draining) return res.status(503).end(); // balancer stops routing to me
  try {
    await pool.query("SELECT 1"); // cheap, bounded check
    res.status(200).end();
  } catch {
    res.status(503).end();
  }
});

// Fail readiness BEFORE closing anything (full sequence in lesson 19)
process.on("SIGTERM", () => {
  draining = true;
});`,
        description:
          "Splitting the two probes is what keeps one bad dependency from marking the whole fleet unhealthy while still letting a draining instance leave the balancer gracefully.",
      },
      {
        title: "Fleet size from a measured number",
        language: "bash",
        code: `# Capacity is arithmetic on a measured per-instance result (lesson 7), not a guess
PEAK_QPS=6000                                # traffic you must absorb at peak
MEASURED_QPS=2800                            # per-instance throughput at the p95 target
SAFE_QPS=$(( MEASURED_QPS * 70 / 100 ))      # 30% headroom
echo "safe qps per instance: $SAFE_QPS"      # => 1960
echo "instances: $(( (PEAK_QPS + SAFE_QPS - 1) / SAFE_QPS ))"   # => 4

# Prove statelessness: identical answers no matter which instance answered
for i in $(seq 1 20); do
  curl -s -b cookies.txt http://lb.internal/api/me | head -c 60
  echo
done`,
        description:
          "Rounding up the division gives the instance count; the second command is the acceptance test for statelessness — any variation means state is still in process memory.",
      },
    ],
    commonMistakes: [
      "Keeping sessions, carts or rate-limit counters in module state and discovering the split only in production.",
      "Using one probe that calls the database: a downstream blip marks every instance unhealthy simultaneously.",
      "Scaling out to fix a slow endpoint — throughput rises but p95 is unchanged, because the bottleneck was never capacity.",
      "Raising pool max on each new instance without re-checking instances × max against the database's connection limit.",
    ],
    bestPractices: [
      "Move all per-user state to shared storage before the second instance comes up; treat sticky sessions as a last resort.",
      "Keep liveness probe-only and put draining, warming and downstream checks in readiness.",
      "Derive fleet size from load-test numbers with 20-30% spare capacity, and revisit it whenever the pool or database changes.",
      "Scale out on a symptom signal (p95 latency, queue depth) rather than on CPU alone.",
    ],
    realWorldUseCases: [
      "A holiday sale plan grows from 3 to 9 instances automatically; the connection-pool budget (9 × 20) was checked against the database first, so the scale-out did not become a connection outage.",
      "A team pinned users with sticky sessions to keep carts in memory; after one instance restarted users saw empty carts, and moving carts to Redis removed the need for affinity entirely.",
    ],
    resources: [
      docs(
        "The Twelve-Factor App",
        OFFICIAL.twelveFactor,
        "Processes: disposable, stateless instances — the discipline horizontal scaling depends on.",
        "en",
        "15 min",
      ),
      docs(
        "Redis documentation",
        OFFICIAL.redisDocs,
        "Where shared sessions, carts and counters live once you run more than one instance.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — HTTP server",
        "https://nodejs.org/api/http.html",
        "keepAliveTimeout, close() and connection handling behind a balancer.",
        "en",
        "reference",
      ),
      ytSearch(
        "horizontal scaling load balancing stateless services explained",
        "Balancers, health checks and the stateless pattern end to end.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-stateless-audit",
        title: "The stateless audit",
        prompt:
          "List every piece of state your service keeps in process memory (sessions, caches, in-flight jobs, rate counters, socket rooms). For each, decide: shared store (which one?) or genuinely per-instance (why is that safe?). Then run two instances behind a round-robin proxy and script 20 alternating requests that depend on the state — e.g. create a cart on instance A, add to it on instance B. Report which items failed, what you moved, and the new fleet-wide numbers for pool size × instances.",
        difficulty: "advanced",
        estimatedMinutes: 50,
        hints: [
          "A module-level Map or object is process state by definition, even if it is not a cache you called \"cache\".",
          "Show which instance answered by exposing process.pid in the response body.",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-chat-app"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-queue-background-jobs",
    slug: "queue-background-jobs",
    title: "Background Jobs and Queue Performance",
    description:
      "Moving slow work out of the request path: at-least-once delivery and idempotency, retries with backoff and a dead-letter queue, concurrency as backpressure, and queue lag as the number you alert on.",
    order: 18,
    estimatedMinutes: 22,
    tags: ["queues", "background-jobs", "bullmq", "retries", "idempotency", "lag"],
    prerequisites: ["p2m1-event-loop-order", "p3m4-event-loop-blocking"],
    relatedTopics: ["p3m4-graceful-shutdown", "p3m4-worker-threads-performance", "p3m4-connection-pooling"],
    learningObjectives: [
      "Explain how deferring work changes both endpoint latency and failure handling",
      "State the delivery guarantee queues actually give you and design idempotent jobs",
      "Configure retries with exponential backoff, attempt caps and a dead-letter queue",
      "Read queue lag as the SLO that tells you whether to add workers or fix the job",
    ],
    simpleExplanation:
      "If a request sends an email, renders a PDF and calls three APIs before answering, the client waits for the slowest of them — and a downstream hiccup becomes user-visible latency. Push the work onto a queue instead: the endpoint validates, enqueues and replies in milliseconds, while a separate worker process performs the job with its own retries and its own concurrency.",
    detailedContent: `
**Why a queue is a performance tool.** The p95 of an endpoint that does the work inline is the p95 of its slowest dependency. Deferring it makes the response fast *and* changes the failure story: an outage of the email provider now produces growing queue lag instead of 500s, and recovery happens by draining the backlog rather than by asking users to retry.

**Delivery semantics.** Queues give **at-least-once**: a worker that finishes the work but dies before acknowledging gets the job redelivered. Every job therefore needs an idempotency strategy — a deterministic job id, an upsert instead of an append, or a unique constraint checked before acting. Without it, "retry" silently means "duplicate email, double charge".

**Retries and poison jobs.** Exponential backoff with **jitter** so a recovering dependency is not hit by the whole fleet at the same instant; a cap on attempts; then a **dead-letter queue** holding the payload and the error for a human to inspect and replay. A visibility timeout or lock duration bounds how long one job can occupy a worker, so a crashed worker's job comes back instead of vanishing.

**Backpressure.** Worker concurrency × jobs per worker must fit the shared resources those jobs touch (lesson 13). When production outpaces consumption, queue depth grows — that is a signal to add workers (lesson 17), not to raise concurrency until the database complains.

**Measure lag, not volume.** "Jobs completed" celebrates activity; **queue lag** (the age of the oldest waiting job) is the user-visible latency of background work. Alert on lag, throughput and failure rate together.
    `,
    howItWorks: `
Enqueueing pushes a job — payload, attempt count, backoff schedule — onto a list in Redis. A worker claims it atomically (a lock with a visibility timeout, so two workers cannot run it simultaneously), executes, and acknowledges; on failure it re-schedules the job with a delay derived from the backoff curve, and after the attempt cap it moves to the dead-letter queue. Because claiming is atomic, adding workers raises throughput until the shared dependency saturates — at which point lag stops falling and concurrency, not worker count, is the knob.

Job latency decomposes into **wait time** (queue lag) and **run time** (your code). Lag rising with flat run time means "more workers"; run time rising means "profile the job" (lesson 2). A single "job duration" metric cannot tell you which, and that distinction is where most queue tuning goes wrong.
    `,
    codeExamples: [
      {
        title: "Enqueue in the request, run in a worker",
        language: "js",
        code: `import { Queue, Worker } from "bullmq";

export const orders = new Queue("orders", {
  connection: { url: process.env.REDIS_URL },
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600 },
  },
});

// Request path: validate, enqueue, answer — the slow part never runs here
app.post("/api/orders/:id/receipt", async (req, res) => {
  // Deterministic job id => re-adding the same receipt cannot create a second job
  await orders.add("receipt", { orderId: req.params.id }, { jobId: "receipt:" + req.params.id });
  res.status(202).json({ status: "queued" });
});

// Worker: its own process (or fleet) and its own concurrency knob
const worker = new Worker(
  "orders",
  async (job) => {
    await renderAndEmailReceipt(job.data.orderId); // idempotent: safe on redelivery
  },
  { connection: { url: process.env.REDIS_URL }, concurrency: 5 },
);

worker.on("failed", (job, err) => {
  logger.warn({ jobId: job.id, attempts: job.attemptsMade, err }, "job failed");
});`,
        description:
          "The endpoint answers in one round-trip regardless of the provider's health, and the deterministic jobId gives you deduplication for free on the retry path.",
      },
      {
        title: "Queue lag: the metric that pages you",
        language: "js",
        code: `async function reportQueueHealth() {
  const [oldest] = await orders.getWaiting(0, 0);
  const counts = await orders.getJobCounts("waiting", "active", "delayed", "failed");
  const lagSeconds = oldest ? Math.round((Date.now() - oldest.timestamp) / 1000) : 0;

  logger.info({ ...counts, lagSeconds });
  if (lagSeconds > 300) {
    await alerts.fire("orders-queue-lag", { lagSeconds, ...counts });
  }
}

setInterval(() => {
  reportQueueHealth().catch((err) => logger.error({ err }, "queue health report failed"));
}, 15000).unref();`,
        description:
          "Lag is measured from the oldest waiting job, so it moves the moment consumption falls behind production — minutes before any user files a complaint.",
      },
    ],
    commonMistakes: [
      "Assuming exactly-once delivery and shipping a job that emails or charges twice on redelivery.",
      "Unlimited retries at a fixed interval: a recovering dependency gets stampeded, and a permanently broken job loops forever.",
      "No dead-letter queue, so poison jobs are invisible — they just burn attempts inside the queue.",
      "Scaling worker concurrency without checking jobs × parallelism against the database pool and downstream rate limits.",
      "Alerting on queue depth alone: a busy queue with lag of 2 seconds is healthy, a short queue with one 10-minute-old job is not.",
    ],
    bestPractices: [
      "Give every job an idempotency key and prove idempotency by forcing a redelivery in a test.",
      "Retry with exponential backoff plus jitter, cap attempts, and dead-letter the rest with the error attached.",
      "Set concurrency from the shared resource budget (pool, API quota), then scale worker count against lag.",
      "Alert on queue lag and failure rate; treat them as latency and error-rate for background work.",
    ],
    realWorldUseCases: [
      "An e-commerce checkout enqueues receipt generation and returns immediately: a provider outage shows up as rising lag on a dashboard instead of slow checkouts.",
      "A nightly analytics pipeline dead-letters malformed events for inspection rather than retrying them all night and starving valid jobs.",
    ],
    resources: [
      docs(
        "BullMQ documentation",
        OFFICIAL.bullmqDocs,
        "Queues, workers, attempts/backoff options, delayed jobs and job metrics.",
        "en",
        "reference",
      ),
      docs(
        "Redis documentation",
        OFFICIAL.redisDocs,
        "The lists and streams primitives queue libraries build their guarantees on.",
        "en",
        "reference",
      ),
      ytSearch(
        "bullmq retries backoff dead letter queue idempotency",
        "Worker lifecycles, retry policies and failure handling walkthroughs.",
        "en",
        "12–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-idempotent-job",
        title: "Make a job survive redelivery",
        prompt:
          "Write a job that sends an email or writes a ledger row, then force redelivery three ways: (1) throw before acknowledging, (2) kill -9 the worker mid-run, (3) re-add the job with the same id while it is active. After each, report how many side effects occurred. The job must produce exactly one — explain which mechanism (deterministic id, unique constraint, upsert) protected it in each case.",
        difficulty: "advanced",
        estimatedMinutes: 45,
        hints: [
          "BullMQ deduplicates re-adds by jobId, but crash-after-work redelivery is a different path — that one needs an idempotent effect.",
          "Log a correlation id per job run so you can count runs separately from side effects.",
        ],
      },
      {
        id: "ex-p3m4-lag-slo",
        title: "Set a lag SLO and tune against it",
        prompt:
          "Run a steady producer at a known rate while workers run at three concurrency settings (1, 5, 20). For each run, record queue lag p95 over five minutes, job throughput, and the database CPU/pool-waiting figures. Write a lag SLO (e.g. p95 lag < 30 s) and state which concurrency satisfies it without pushing the database past its budget — with the numbers that justify the choice.",
        difficulty: "advanced",
        estimatedMinutes: 60,
        hints: [
          "Sample lag every few seconds; the interesting value is the maximum age of a waiting job, not the average depth.",
          "If raising concurrency stops reducing lag, the bottleneck is downstream of the worker — profile it instead (lesson 2).",
        ],
      },
    ],
    projectIds: ["p3-job-processing"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-graceful-shutdown",
    slug: "graceful-shutdown",
    title: "Graceful Shutdown: Draining Without Dropping Requests",
    description:
      "The exact SIGTERM sequence — stop routing, stop accepting, finish in-flight work, close pools, exit before a deadline — and how to prove zero dropped requests instead of trusting it.",
    order: 19,
    estimatedMinutes: 23,
    tags: ["graceful-shutdown", "sigterm", "draining", "deploys", "keep-alive"],
    prerequisites: ["p2m1-process-signals", "p3m4-connection-pooling", "p3m4-clustering"],
    relatedTopics: ["p3m4-horizontal-scaling", "p3m4-queue-background-jobs", "p3m4-performance-monitoring"],
    learningObjectives: [
      "Sequence a SIGTERM handler: not-ready, close, drain, close downstreams, exit",
      "Explain why idle keep-alive connections require closeIdleConnections()",
      "Handle a second signal and a hard deadline so a stuck request cannot block a deploy",
      "Verify a shutdown under load with a load generator instead of by inspection",
    ],
    simpleExplanation:
      "Every deploy stops a process that is probably in the middle of someone's request. Graceful shutdown turns that hard stop into a handover: tell the load balancer to stop routing, finish what is already running, close the database pool, then exit — all inside a deadline, because a hung request must never hold a deployment hostage.",
    detailedContent: `
**What an ungraceful stop costs.** A container that hits its time limit gets SIGKILL: responses cut mid-flight (users and load balancers see resets), pool checkouts that were never returned, jobs half-finished. The failures are rare enough to escape testing and frequent enough to erode trust — which is exactly the shape of bug nobody reproduces.

**The sequence, in order.**

1. **Catch the signal.** Orchestrators send SIGTERM (Ctrl-C sends SIGINT). Installing a listener replaces Node's default immediate exit — without it, everything below never runs. In a container the entrypoint must forward signals: \`sh -c "node app.js"\` swallows them, \`exec node app.js\` does not.
2. **Fail readiness first.** Mark the instance not-ready and wait a few seconds so the balancer's next probe (and its propagation) stops sending new work *before* you close anything.
3. **Stop accepting, drain what exists.** \`server.close()\` refuses new connections but waits for open ones; idle keep-alive sockets would hold that wait open for minutes, so call \`closeIdleConnections()\` too. In-flight requests keep running.
4. **Close downstreams.** Stop claiming new queue jobs (let the active one finish), then \`pool.end()\`, Redis quit, Mongo disconnect, flush logs (lesson 18).
5. **Exit with a deadline.** One timer (say 30 s) force-exits with a non-zero code if a request refuses to finish; a *second* SIGTERM exits immediately — emergency deploys should never queue behind your politeness.

**The arithmetic that decides step 2:** drain window ≥ probe interval × failure threshold + propagation margin. Get it wrong and the balancer routes to an instance that is already closing.

**cluster** turns this into a rolling restart (lesson 16): the primary times workers, one at a time.
    `,
    howItWorks: `
\`server.close()\` stops handing new sockets to your handler and resolves only once every open connection has ended — so with keep-alives enabled, one idle browser tab can block it indefinitely. \`closeIdleConnections()\` destroys sockets with no in-flight request, while active responses keep their connection until they finish; the deadline then covers everything that is genuinely stuck.

Meanwhile readiness returning 503 removes the instance from balancing, so during the drain window the only requests arriving are the ones already inside. Because the sequence closes the database pool *after* in-flight work completes, those requests still have their connections — the classic inversion (pool closed first) turns a graceful shutdown into an error generator.
    `,
    codeExamples: [
      {
        title: "The full SIGTERM sequence",
        language: "js",
        code: `import http from "node:http";

const server = http.createServer(app);
server.keepAliveTimeout = 65000;

let draining = false;
app.get("/readyz", (_req, res) => (draining ? res.status(503).end() : res.status(200).end()));

async function shutdown(signal) {
  if (draining) {
    logger.warn({ signal }, "second signal: forcing exit");
    process.exit(1);
  }
  draining = true;
  logger.info({ signal }, "draining: failing readiness, then closing");

  const deadline = setTimeout(() => {
    logger.error("shutdown deadline exceeded: forcing exit");
    process.exit(1);
  }, 30000);
  deadline.unref();

  // 1. stop accepting new sockets; drop idle keep-alives so close() can finish
  server.closeIdleConnections();
  await new Promise((resolve) => server.close(resolve));

  // 2. in-flight requests are done: close everything below the request path
  await Promise.allSettled([pool.end(), redis.quit(), mongoose.connection.close()]);
  logger.info("downstreams closed: exiting cleanly");

  clearTimeout(deadline);
  process.exit(0);
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    shutdown(signal).catch((err) => {
      logger.error({ err }, "shutdown failed");
      process.exit(1);
    });
  });
}`,
        description:
          "Readiness fails first, sockets drain second, pools close last, and two escape hatches (deadline and second signal) guarantee the deploy can always finish.",
      },
      {
        title: "Prove zero dropped requests",
        language: "bash",
        code: `# Terminal 1: sustained load across a real restart
npx autocannon -c 30 -d 45 -j http://127.0.0.1:3000/api/products > shutdown.json &
LOAD_PID=$!
sleep 10

kill -TERM $(pgrep -f "node server.js" | head -1)
wait $LOAD_PID

# Acceptance criteria, in order
jq '.errors, .non2xx, .timeouts' shutdown.json      # 0 0 0  == nothing dropped
grep -E "draining|downstreams closed" app.log        # the sequence actually ran
# Inside a container, the same test with an explicit grace period:
#   docker stop --time 30 <container>`,
        description:
          "Three numbers from the load generator and two log lines are the difference between \"probably graceful\" and demonstrated graceful.",
      },
    ],
    commonMistakes: [
      "Never installing a SIGTERM listener — the process dies instantly and every step above is theoretical.",
      "Closing the database pool before in-flight requests finish, converting a deploy into a burst of 500s.",
      "Forgetting idle keep-alive connections, so server.close() hangs until the orchestrator SIGKILLs you.",
      "Wrapping the entrypoint in a shell that swallows signals (no exec), so SIGTERM never reaches Node.",
      "No deadline: one stuck request blocks the deploy indefinitely, and the orchestrator's kill becomes the exit path.",
    ],
    bestPractices: [
      "Order: fail readiness → wait propagation → stop accepting → drain → close downstreams → exit.",
      "Give the drain a deadline that is shorter than the orchestrator's kill timeout, and exit non-zero when it fires.",
      "Treat a second SIGTERM/SIGINT as an immediate exit.",
      "Test the sequence under load on every deploy path (bare process, container, cluster) — it is cheap and permanent.",
    ],
    realWorldUseCases: [
      "A service that added readiness draining and closeIdleConnections() took deploy-time 502s from \"a few per release\" to zero, visible directly in the load generator's error count.",
      "A batch worker that finished its active job before exiting stopped a recurring Monday-morning corrupt-report bug that only appeared after releases.",
    ],
    resources: [
      docs(
        "Node.js API — HTTP server",
        "https://nodejs.org/api/http.html",
        "server.close(), closeIdleConnections() and keep-alive timeout behaviour.",
        "en",
        "reference",
      ),
      docs(
        "Node.js API — Process",
        "https://nodejs.org/api/process.html",
        "Signal events, exit codes and what happens without a listener.",
        "en",
        "reference",
      ),
      ytSearch(
        "node js graceful shutdown express docker sigterm",
        "Deploy-time draining walkthroughs with real load tests.",
        "en",
        "12–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-zero-drop-shutdown",
        title: "Prove zero dropped requests",
        prompt:
          "Run a 45-second load test and send SIGTERM 10 seconds in. Record errors, non-2xx and timeouts from the load generator, plus the ordered shutdown log lines and the process exit code. Then break it on purpose three ways — no SIGTERM listener, pool closed first, and a handler that sleeps past a 10-second deadline — and record what the client saw in each case. Finish with the same test inside your container runtime using its default stop timeout vs an explicit --time, and explain any difference.",
        difficulty: "advanced",
        estimatedMinutes: 60,
        hints: [
          "autocannon's -j output carries errors and non2xx per run; that is your drop counter.",
          "Compare the drain window against probe interval × failure threshold + propagation delay before declaring the readiness step correct.",
        ],
        solution: `# 1. Baseline: graceful sequence in place
npx autocannon -c 30 -d 45 -j http://127.0.0.1:3000/api/products > ok.json &
sleep 10
kill -TERM $(pgrep -f "node server.js" | head -1)
wait
jq '.errors, .non2xx, .timeouts' ok.json     # 0 0 0
grep -E "draining|downstreams closed" app.log

# 2. No SIGTERM listener (remove process.on block, restart)
#    -> autocannon reports connection resets; exit is immediate, log has no "draining"

# 3. Pool closed first (move pool.end() above server.close, restart)
#    -> non2xx > 0: in-flight requests query a closed pool

# 4. Deadline test (handler sleeps 60s, deadline 10s, restart)
#    -> log shows "shutdown deadline exceeded", exit code 1,
#       load test shows only the stuck request failing, the rest completed

# 5. Container comparison
docker stop --time 10 <container>            # default-ish: forced kill if drain > 10s
docker stop --time 40 <container>            # drain completes: errors stay 0
#
# Report all five error counts side by side; the point is that every
# broken step has a visible client-side signature you can now recognise.`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-capstone", "p3-job-processing"],
    quizId: "quiz-p3-m4",
  },
  {
    ...shared,
    id: "p3m4-performance-monitoring",
    slug: "performance-monitoring",
    title: "Performance Monitoring and Alerting",
    description:
      "RED and USE for a Node.js service, why p95 comes from histograms rather than averages, the metrics worth exporting (loop delay, pool saturation, queue lag), and alerts that fire on symptoms and causes.",
    order: 20,
    estimatedMinutes: 24,
    tags: ["monitoring", "prometheus", "metrics", "slo", "histograms", "alerting"],
    prerequisites: ["p3m4-performance-profiling", "p2m5-logging-monitoring", "p3m4-load-testing"],
    relatedTopics: ["p3m4-event-loop-blocking", "p3m4-connection-pooling", "p3m4-graceful-shutdown"],
    learningObjectives: [
      "Translate RED and USE into the specific series a Node.js service should export",
      "Explain why percentiles come from histograms and where averages mislead",
      "Instrument route latency, event-loop delay and pool saturation with prom-client",
      "Write alerts on symptoms and causes (SLO breach, saturation) instead of on CPU alone",
    ],
    simpleExplanation:
      "Profiling finds a problem once; monitoring keeps watching for the next one. You export a small set of numbers — request rate, error rate, latency percentiles, and how saturated your resources are — Prometheus scrapes them, and alerts fire when a service level objective is being burned rather than when some arbitrary CPU number is crossed.",
    detailedContent: `
**The two lenses.** **RED** describes endpoints: Rate, Errors, Duration — one series set per route. **USE** describes resources: Utilisation, Saturation, Errors — for the connection pool, the event loop, the database. Together they cover effect and cause: a latency alert tells you *that* users are hurting, pool saturation tells you *why*.

**Percentiles, not averages.** An average latency of 180 ms happily hides 10% of requests taking 2 seconds — those are the users who complain. p95 and p99 come from **histograms**: bucket each duration, count per bucket, and combine buckets across instances (sum by le, then histogram_quantile). This is exactly why Prometheus histograms exist — you cannot average pre-computed quantiles across instances, and an average of averages is not a percentile of anything. Place bucket boundaries around your SLO (50/100/250/500 ms…) so the number you alert on is measured, not interpolated across a huge gap.

**The Node-specific instruments.** \`monitorEventLoopDelay()\` (exported by default metrics as \`nodejs_eventloop_delay_seconds\`) is the single most valuable Node metric: a blocked loop inflates *every* request at once, so one histogram explains an entire incident. Add route histograms, GC pause observations, and saturation gauges — \`db_pool_waiting\`, queue lag, worker in-flight count — which move *before* latency does.

**Alert on symptoms and causes.** Symptom: p95 over SLO for 10 minutes, error rate above budget. Cause: queue lag, pool saturation, event-loop delay. CPU is a poor primary signal for Node.js — the process saturates one core while the machine looks idle. Multi-window burn-rate alerts catch both sudden and slow SLO erosion without paging on a single spike.

**Keep it honest** with a low-rate synthetic probe (lesson 7) so your p95 includes traffic you control, payloads you recognise, and regressions you detect before customers do.
    `,
    howItWorks: `
The application exposes \`/metrics\` in Prometheus text format; a scraper pulls it every 15 seconds; PromQL computes percentiles from cumulative buckets with \`histogram_quantile(0.95, sum by (le, route) (rate(..._bucket[5m])))\`; alerting rules run on those expressions and page through Alertmanager.

Dashboards should mirror the thinking order: golden signals per route first (rate, errors, p95), then Node internals (event-loop delay, heap, GC), then dependencies (pool waiting, queue lag, database CPU). When an alert fires, the metric tells you the *shape* of the problem — flat latency with rising pool waiting means queueing, rising latency with flat pool means the query itself regressed — and a trace or profile (lesson 2) takes you to the code. Metrics aggregate; profiles localise.
    `,
    codeExamples: [
      {
        title: "Histograms, loop delay and saturation gauges",
        language: "js",
        code: `import client from "prom-client";

const register = new client.Registry();
register.setDefaultLabels({ service: "orders-api" });
client.collectDefaultMetrics({ register }); // heap, gc, handles, event-loop delay

// Latency as a HISTOGRAM: buckets chosen around the p95 SLO
const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency by route",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

app.use((req, res, next) => {
  const stop = httpDuration.startTimer();
  res.on("finish", () => {
    stop({ method: req.method, route: req.baseUrl || req.path, status: res.statusCode });
  });
  next();
});

// Saturation moves BEFORE latency does — this is your early warning
new client.Gauge({
  name: "db_pool_waiting",
  help: "Requests queued on the database connection pool",
  registers: [register],
  collect() {
    this.set(pool.waitingCount);
  },
});

app.get("/metrics", async (_req, res) => {
  res.setHeader("content-type", register.contentType);
  res.end(await register.metrics());
});`,
        description:
          "One histogram per route gives you percentiles that aggregate across instances; the pool gauge is the cause-side signal that fires before the histogram moves.",
      },
      {
        title: "Alerting on the tail and on saturation",
        language: "yaml",
        code: `groups:
  - name: api-performance
    rules:
      # Symptom: the tail of the SLO, not the average
      - alert: ApiP95Latency
        expr: |
          histogram_quantile(
            0.95,
            sum by (le, route) (rate(http_request_duration_seconds_bucket[5m]))
          ) > 0.5
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "p95 above 500ms for 10m on {{ $labels.route }}"

      # Cause: saturation, visible before latency regresses
      - alert: DbPoolSaturated
        expr: max_over_time(db_pool_waiting[5m]) > 0
        for: 5m
        labels:
          severity: ticket
        annotations:
          summary: "Connection pool queueing continuously"

      - alert: EventLoopBlocked
        expr: |
          histogram_quantile(
            0.99,
            sum by (le) (rate(nodejs_eventloop_delay_seconds_bucket[5m]))
          ) > 0.1
        for: 10m
        labels:
          severity: page`,
        description:
          "One symptom alert and two cause alerts: together they distinguish \"users are waiting\" from \"the pool is queueing\" and \"the loop is blocked\" within a single page.",
      },
    ],
    commonMistakes: [
      "Alerting on average latency: the tail that generates complaints is mathematically invisible in the mean.",
      "Averaging p95 values across instances — an average of quantiles is not the fleet's p95; use histogram buckets.",
      "Watching CPU as the primary signal: Node.js saturates one core while the host reports 25% utilisation.",
      "Bucket boundaries so wide that the alerted percentile lands between 1 s and 5 s boundaries and is interpolated.",
      "No saturation gauges, so the dashboard shows latency rising with no explanation of what caused it.",
    ],
    bestPractices: [
      "Export RED per route and USE per resource; alert on symptom (SLO) and cause (saturation) together.",
      "Choose histogram buckets around your SLO, and verify the number with an independent measurement (lesson 7).",
      "Keep event-loop delay on the default dashboard — it is one line that explains whole classes of incidents.",
      "Run a low-rate synthetic load continuously so your p95 is measured, not only observed from live traffic.",
    ],
    realWorldUseCases: [
      "A monthly p95 regression was traced in ten minutes: the pool-waiting gauge had risen weeks earlier, but nobody had alerted on it.",
      "A code change doubled heap churn; GC-observed pause metrics caught it before users noticed because the p99 histogram crossed its bucket boundary first.",
    ],
    resources: [
      docs(
        "Prometheus — Histograms and summaries",
        "https://prometheus.io/docs/practices/histograms/",
        "Why percentiles come from buckets, and how to aggregate them across instances.",
        "en",
        "12 min",
      ),
      docs(
        "Node.js API — Performance measurement",
        "https://nodejs.org/api/perf_hooks.html",
        "monitorEventLoopDelay, PerformanceObserver, marks and measures.",
        "en",
        "reference",
      ),
      docs(
        "Node.js CLI — Diagnostic report and tracing flags",
        "https://nodejs.org/api/cli.html",
        "The measurement switches that pair with the metrics you export.",
        "en",
        "reference",
      ),
      ytSearch(
        "prometheus promql histogram_quantile nodejs slo alerting",
        "Bucket design, percentile queries and burn-rate alerts on a Node service.",
        "en",
        "15–35 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m4-alert-on-tail",
        title: "Alert on the tail and prove it fires",
        prompt:
          "Export the route histogram from lesson 20, then generate traffic where 10% of requests take ~800 ms and the rest ~150 ms. Report the average and the p95 side by side and explain why an average-based alert would not fire. Write the histogram_quantile query, confirm it returns ~800 ms, add an alert rule on it (temporarily shorten the 'for' window), and capture the alert firing. Finish by naming which cause-side gauge you would put on the same dashboard and why.",
        difficulty: "advanced",
        estimatedMinutes: 55,
        hints: [
          "Inject slowness with a deterministic rule (e.g. hash of the request id modulo 10) so the ratio is reproducible.",
          "Average = 0.9×150 + 0.1×800 = 215 ms: under a 250 ms average threshold, while p95 sits at 800 ms.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-capstone"],
    quizId: "quiz-p3-m4",
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m4",
  moduleId: "p3-m4",
  title: "Module 4 quiz — Performance & scalability",
  description:
    "Test your understanding of profiling baselines, event-loop behaviour, cache reads, listener leaks, clustering, cache invalidation, shutdown order and latency instrumentation.",
  questions: [
    {
      id: "q-p3m4-1",
      type: "multiple-choice",
      prompt:
        "An endpoint feels slow and you are told to \"optimise it\". Which sequence is the most defensible starting point?",
      options: [
        "Rewrite the function that looks slowest, then benchmark to confirm it improved",
        "Capture a baseline under representative load, profile to find the top offender, change one thing, then re-measure against the baseline",
        "Add caching to every database query, because database calls are almost always the slowest part",
        "Increase server CPU and memory, because performance problems are capacity problems",
      ],
      correctIndex: 1,
      explanation:
        "Baseline → profile → single change → re-measure. The baseline makes the claim falsifiable, the profile replaces guessing with evidence, and changing one thing at a time keeps the measurement attributable. The other options all optimise on assumption — sometimes they help, but you will never know whether they did.",
      optionExplanations: [
        "Optimising first and measuring afterwards inverts the order: you cannot know if the change mattered without a baseline, and the hot spot is usually somewhere you did not suspect.",
        "Correct — evidence first, one change, then compare against the recorded baseline.",
        "Blaming the database is the most common guess in backend work; profiling routinely shows serialization, JSON work or an N+1 instead.",
        "Capacity may be the answer, but only a measurement can tell you whether the process is CPU-bound, blocked on I/O, or queueing on its own pool.",
      ],
    },
    {
      id: "q-p3m4-2",
      type: "code-output",
      prompt: "What does this Node.js program print, and in what order?",
      code: `console.log("start");
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("microtask"));
console.log("end");`,
      language: "js",
      options: [
        "start, end, microtask, timeout",
        "start, end, timeout, microtask",
        "start, microtask, end, timeout",
        "start, timeout, end, microtask",
      ],
      correctIndex: 0,
      explanation:
        "Synchronous code runs to completion first (start, end). The promise job queue is drained before the macrotask queue, so microtask prints before the timer — even though setTimeout was called first and its delay is 0 ms, because a 0 ms timer still means \"a future loop turn\".",
      optionExplanations: [
        "Correct — sync, then promise jobs, then the timer callback.",
        "Timers never run before the promise queue is empty in Node.js.",
        "Nothing in the promise chain can interleave with the synchronous block.",
        "The timer callback cannot interrupt synchronous execution at all.",
      ],
    },
    {
      id: "q-p3m4-3",
      type: "code-output",
      prompt: "Both calls complete successfully. What is printed?",
      code: `let dbCalls = 0;

async function getProfile(id) {
  const hit = await cache.get("profile:" + id);
  if (hit) return JSON.parse(hit);
  dbCalls++;
  const row = await db.query("SELECT * FROM profiles WHERE id = $1", [id]);
  await cache.set("profile:" + id, JSON.stringify(row), { ttl: 60 });
  return row;
}

await getProfile("u1"); // call A
await getProfile("u1"); // call B, one second later
console.log(dbCalls);`,
      language: "js",
      options: ["0", "1", "2", "3"],
      correctIndex: 1,
      explanation:
        "Call A misses the cache, queries the database (dbCalls = 1) and writes the entry with a 60-second TTL. Call B one second later finds that entry still fresh, so it never reaches the database. dbCalls stays 1 — that difference is exactly what a cache hit rate measures.",
      optionExplanations: [
        "dbCalls only counts database queries, and at least one is required to produce a cache entry.",
        "Correct — one miss then one hit inside the TTL.",
        "The second call is served from cache, so it adds no database query.",
        "Nothing in this code retries or issues three queries.",
      ],
    },
    {
      id: "q-p3m4-4",
      type: "find-bug",
      prompt:
        "After an hour of traffic, RSS grows steadily and the log fills with writes to closed responses. What is wrong?",
      code: `// "source" is a module-scoped EventEmitter shared by every request
app.get("/api/events", (req, res) => {
  res.setHeader("content-type", "text/event-stream");
  const onData = (data) => res.write("data: " + data + "\\n\\n");
  source.on("data", onData);
});`,
      language: "js",
      options: [
        "res.write returns false, so the response must be paused before writing more",
        "The listener is added to a shared emitter and never removed, so each request leaks one listener and keeps writing to a response that has closed",
        "text/event-stream requires res.end() after the first chunk or the socket is never flushed",
        "There is no bug — Node.js removes listeners automatically when the response closes",
      ],
      correctIndex: 1,
      explanation:
        "An EventEmitter holds strong references to its listeners. This one is created at module scope, so every request adds a closure that captures its own res and is never detached: memory grows (plus a MaxListenersExceededWarning at 11) and the emitter keeps writing to responses whose clients are gone. The fix is to remove the listener on 'close'/'error' — or avoid the shared emitter and let a pipeline destroy the source with the response.",
      optionExplanations: [
        "Backpressure is a real concern, but it does not explain listeners accumulating or writes to closed responses.",
        "Correct — a module-scoped emitter plus a listener that is never removed is a textbook leak.",
        "SSE responses stay open by design; that is not the cause of the growth.",
        "Only explicit .off()/.removeListener() (or destroying the emitter) detaches a handler.",
      ],
    },
    {
      id: "q-p3m4-5",
      type: "multiple-choice",
      prompt:
        "Your API runs on an 8-core machine and serves a CPU-heavy report route. Which statement is accurate?",
      options: [
        "A single Node.js process already executes JavaScript across all 8 cores, so clustering only adds restart isolation",
        "A single process executes JavaScript on one core; clustering across roughly 8 workers can raise CPU-bound throughput, provided shared state lives outside the processes",
        "Clustering is only useful for handling more idle keep-alive connections, which one process cannot do",
        "You should spawn 8 worker threads per request rather than cluster, because threads share memory",
      ],
      correctIndex: 1,
      explanation:
        "One process runs one JavaScript thread on one core (async I/O lets it *wait* on thousands of connections, but it does not use extra cores for computation). Clustering forks full processes that share the listening socket, spreading computation across cores while adding fault isolation and rolling restarts — on the condition that sessions, caches and counters live in shared storage, not in process memory.",
      optionExplanations: [
        "The event loop is single-threaded; libuv's small thread pool serves async fs/crypto/DNS, not your JavaScript.",
        "Correct — one core for JS, cores for processes, shared state moved out of memory.",
        "One process already multiplexes thousands of idle connections; that was never the limit.",
        "Workers help CPU-bound work too, but per-request threads pay startup and copy costs — pool them (and cluster for full-process scaling).",
      ],
    },
    {
      id: "q-p3m4-6",
      type: "short-answer",
      prompt:
        "A cached product page keeps showing a stale price after an admin edits it. Name the general technique you apply at the moment of the write to fix this — what do you do to the affected keys? (One word or two.)",
      acceptedKeywords: [
        "invalidate",
        "invalidation",
        "evict",
        "eviction",
        "delete",
        "purge",
        "bust",
        "write-through",
      ],
      explanation:
        "Explicit invalidation (often delete-on-write): at the moment of the write, remove the affected keys so the next read rebuilds them from the database — or update them in place (write-through). A TTL only bounds how long staleness can last; it is a safety net, not the fix for data that changes on a known event.",
    },
    {
      id: "q-p3m4-7",
      type: "multiple-choice",
      prompt: "During a deploy the orchestrator sends SIGTERM. Which sequence is correct?",
      options: [
        "Close the database pool first, then stop the HTTP server, then exit",
        "Fail readiness so the balancer stops routing, stop accepting new connections, let in-flight requests finish, close pools and caches, then exit before a deadline",
        "Exit immediately — the balancer will simply retry on another instance",
        "Keep accepting connections until the process runs out of memory, then exit",
      ],
      correctIndex: 1,
      explanation:
        "Readiness must fail before anything closes, so new traffic stops arriving while old traffic drains. Pools close last, because the in-flight requests still need them — closing the pool first (option 0) converts a deploy into a burst of errors. Immediate exit (option 2) cuts responses mid-flight: a retry only helps idempotent requests the client even bothers to retry.",
      optionExplanations: [
        "The requests still draining need those connections; closing the pool first guarantees 500s.",
        "Correct — stop routing, stop accepting, drain, close, exit with a deadline.",
        "In-flight responses are destroyed and clients see resets; non-idempotent work (payments, job submissions) cannot be blindly retried.",
        "That is SIGKILL with extra steps — the orchestrator's timeout will end the process for you.",
      ],
    },
    {
      id: "q-p3m4-8",
      type: "multiple-choice",
      prompt:
        "You want to alert when API p95 latency crosses 500 ms across 6 instances. Which instrumentation gives a correct answer?",
      options: [
        "A request counter plus total duration, divided to get an average latency",
        "A per-instance p95 summary, averaged across the 6 instances",
        "A histogram with buckets around the SLO, aggregated across instances with histogram_quantile over the cumulative buckets",
        "Mean event-loop delay, since the loop explains all request latency",
      ],
      correctIndex: 2,
      explanation:
        "Histograms aggregate correctly: counts per bucket sum across instances, and the quantile is derived from the combined distribution. An average hides the tail entirely; an average of per-instance p95 values is not the fleet's p95 (it can be too high or too low depending on traffic split); event-loop delay is a valuable cause-side signal but cannot stand in for request latency.",
      optionExplanations: [
        "Average latency is blind to the tail — 10% of requests at 2 seconds can hide behind an average of 180 ms.",
        "Quantiles cannot be averaged across instances; percentiles of a mixture are not the mean of percentiles.",
        "Correct — buckets sum across instances, and histogram_quantile computes the true p95 of the combined data.",
        "Loop delay explains a class of incidents (a blocked loop inflates everything), but it is not a substitute for measured request duration.",
      ],
    },
  ],
};
