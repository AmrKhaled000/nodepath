import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m5",
  slug: "messaging-and-distributed-systems",
  title: "Messaging & Distributed Systems",
  description:
    "From single-process Node.js to distributed systems: background job queues, message brokers like RabbitMQ, event-driven architecture, the honest microservices-vs-monolith trade-off, retries with backoff, dead-letter queues, idempotent consumers, sagas, the transactional outbox, eventual consistency, failure handling and distributed tracing.",
  phaseId: "phase-3",
  order: 5,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m5",
  difficulty: "advanced",
  quizId: "quiz-p3-m5",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m5-background-processing",
    slug: "background-processing",
    title: "Background Processing",
    description:
      "What work belongs off the request path - email, reports, webhooks, image processing - and how synchronous request handling differs from asynchronous jobs.",
    order: 1,
    estimatedMinutes: 18,
    tags: ["background-processing", "async", "queues", "nodejs"],
    prerequisites: ["p3m4-queue-background-jobs", "p2m1-worker-threads"],
    relatedTopics: ["p3m5-job-queues", "p3m4-graceful-shutdown", "p2m1-eventemitter-advanced"],
    learningObjectives: [
      "Distinguish synchronous request-path work from asynchronous background work",
      "Classify a feature as a good or bad candidate for a background queue",
      "Trace the lifecycle of a queued job from HTTP request to worker completion",
      "Explain how the API contract changes once work is acknowledged rather than completed",
    ],
    simpleExplanation:
      "When a request triggers work that is slow or failure-prone - sending an email, generating a report, calling a flaky webhook - doing it inside the HTTP handler makes every user wait for the worst case. Background processing moves that work off the request path: the API records what needs to happen and returns immediately, while a separate worker process does the heavy lifting later. The user gets a fast response; the slow work gets retries, monitoring and its own scaling story.",
    detailedContent: `
**Synchronous work** happens inside the request/response cycle: validate the payload, write a row to the database, return 201. The client's connection stays open until you finish. That is correct for anything the user must see immediately.

**Asynchronous (background) work** is everything else - anything that can happen *after* the response is sent. Good candidates share three traits: the user does not need the result in this response, the work is slow or slow-prone (third-party APIs, file processing), and it should survive a process restart via durable storage.

Classic queue candidates:

- **Emails and notifications** - SMTP providers time out; your users should not wait on them.
- **Reports and exports** - aggregating a month of data takes seconds to minutes.
- **Webhooks to partners** - they are famously flaky; you need retries with backoff.
- **Image and file processing** - resizing a 10 MB upload burns CPU you cannot spare on the API.

The flow of a signup with a queued email:

1. \`POST /signup\` arrives at the API.
2. The API writes the user row and enqueues an \`email\` job (type \`welcome\`, payload containing the user id) as part of accepting the request.
3. The API responds \`201 Created\` immediately - no SMTP involved.
4. A **worker** process pulls the job, calls the email provider, and retries with backoff on failure.
5. Queue-depth metrics and alerts make a silent backlog visible before customers complain.

The mental shift: the HTTP response no longer means "the email was sent". It means "we accepted responsibility for the email". Your API contracts, UI copy and monitoring must all reflect that gap.
    `,
    howItWorks: `
In Node.js the pieces are: an HTTP process (the API), a queue (Redis + BullMQ, RabbitMQ, or even a Postgres table), and one or more worker processes running a \`Worker\` loop. The API's only queue interaction is a cheap \`queue.add(...)\` - typically one network round-trip that adds single-digit milliseconds. Workers pull jobs, run your handler, and acknowledge completion; failures are retried by broker policies rather than by user-facing code. Because workers are separate processes (or containers), you scale them independently: ten API pods and two heavy-job workers, or the reverse on batch nights. On shutdown, workers stop taking new jobs, finish in-flight ones, then exit - the graceful-shutdown discipline from earlier modules continues here.
    `,
    codeExamples: [
      {
        title: "Sign up fast, send the email later",
        language: "ts",
        code: `import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({ host: "127.0.0.1", maxRetriesPerRequest: null });
const emailQueue = new Queue("email", { connection });

// API process: respond immediately
app.post("/signup", async (req, res) => {
  const user = await users.create(req.body);
  await emailQueue.add(
    "welcome",
    { userId: user.id, template: "welcome" },
    { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
  );
  res.status(201).json({ id: user.id }); // never awaits SMTP
});

// Worker process (can run in a separate container)
const worker = new Worker(
  "email",
  async (job) => {
    await sendWelcomeEmail(job.data.userId);
  },
  { connection, concurrency: 5 },
);`,
        description:
          "The API only enqueues - a fast, durable operation. The Worker owns the slow, failure-prone email send and its retries. Run the worker with a second process or container so job bursts never starve request handlers.",
      },
    ],
    commonMistakes: [
      "Queueing work the user must see the result of (payment capture confirmation) - that needs a synchronous path plus polling for status.",
      "Enqueuing with no payload snapshot: if the worker re-reads mutable state later, it may process a different record than the user intended.",
      "Forgetting that a 201 now means 'accepted', not 'done' - UI copy and status endpoints must say so.",
      "Running workers inside the API process 'for simplicity' - a burst of jobs then starves your request handlers.",
    ],
    bestPractices: [
      "Write the business row and the job in one logical unit (same DB transaction or the outbox pattern) so neither exists without the other.",
      "Give every job a stable dedup key so a redelivery cannot double-send.",
      "Monitor queue age (oldest job), not just job count - a stuck worker shows up as aging jobs first.",
      "Keep job handlers small and importable so tests do not need a live broker.",
    ],
    realWorldUseCases: [
      "E-commerce checkout returns 201 in 80 ms while receipt email, invoice PDF and analytics events run as jobs.",
      "A photo app enqueues resize/thumbnail jobs on upload and pushes a notification when processing completes.",
      "SaaS nightly report generation: the API accepts a 'generate report' job with a 24-hour delay.",
    ],
    resources: lessonResources({
      official: {
        title: "BullMQ Documentation",
        url: OFFICIAL.bullmqDocs,
        description: "Official docs for the Redis-backed job queue used throughout these examples.",
      },
      videos: [
        {
          query: "node.js background jobs queues explained",
          description: "Walkthroughs of moving slow work out of Express handlers.",
          estimatedDuration: "10-18 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p3m5-bg-classify",
        title: "Queue or not queue?",
        prompt:
          "Classify each feature as request-path, background, or hybrid, and justify in one sentence each: (1) charging a credit card at checkout, (2) sending the order confirmation email, (3) generating a 90-day CSV export, (4) updating a search index, (5) resetting a password.",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "Ask: does the HTTP response depend on this finishing? Does the user watch a progress UI?",
          "Password reset: the email can be queued, but the token write is request-path.",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m5-job-queues",
    slug: "job-queues-and-delivery-semantics",
    title: "Job Queues: Semantics, States and Priorities",
    description:
      "At-least-once, at-most-once and exactly-once delivery, the job state machine, priorities, delays, and why exactly-once is achieved by idempotency rather than broker magic.",
    order: 2,
    estimatedMinutes: 22,
    tags: ["queues", "delivery-semantics", "bullmq", "jobs"],
    prerequisites: ["p3m5-background-processing", "p3m4-queue-background-jobs"],
    relatedTopics: ["p3m5-idempotent-consumers", "p3m5-message-brokers", "p3m5-retries-backoff"],
    learningObjectives: [
      "Define at-least-once, at-most-once and exactly-once delivery and state their trade-offs",
      "Explain why practical systems target at-least-once plus idempotent consumers",
      "Map the job lifecycle: delayed, waiting, active, completed, failed, delayed-retry",
      "Use priorities and delayed jobs appropriately and know when they hurt fairness",
    ],
    simpleExplanation:
      "A job queue is durable storage plus a delivery contract. Most brokers give you at-least-once: a job might be delivered more than once (after a crash, say) but will not silently vanish. At-most-once risks loss; exactly-once does not exist as a broker guarantee across failures - you get effectively-once behavior by making consumers idempotent. On top of that, queues track job states and let you delay, prioritize and retry work.",
    detailedContent: `
**Three delivery guarantees**

- **At-most-once** - deliver once or not at all. The broker forgets a job the moment it hands it out. A worker crash mid-job loses the work. Fast, unsafe for anything valuable.
- **At-least-once** - the broker keeps the job until the consumer acknowledges it. A crash before ack means redelivery. Jobs can be duplicated. This is what RabbitMQ, BullMQ and SQS (standard mode) give you.
- **Exactly-once** - the effect of the work happens once despite duplicates, crashes and retries. No production broker offers this end-to-end; you build it from **at-least-once delivery + idempotent processing + deduplication**.

**The job state machine** (BullMQ and most libraries follow this shape):

    delayed --> waiting --> active --> completed
                   ^          |
                   |          v
                   +------ failed (retry with backoff, or dead-lettered)

- **delayed** - not eligible until a future timestamp (reminders, scheduled exports).
- **waiting** - eligible now, queued for a free worker slot.
- **active** - a worker holds it; if the worker dies without ack, the broker returns it to waiting.
- **completed / failed** - terminal; failed may re-enter waiting up to a max-attempts limit.

**Priorities** let urgent jobs (payment capture) jump ahead of bulk jobs (nightly analytics). The cost: large priority ranges complicate fairness, and a flood of high-priority jobs starves the low ones. Prefer **separate queues** when the workloads have truly different SLOs.

**Delays** are for time-based triggers ("remind in 24h"), not for hiding slow consumers - that is a scaling problem, not a scheduling one.
    `,
    howItWorks: `
Under the hood a job is a small record: id, name, payload, attempts made, timestamps and state. \`queue.add\` writes it durably (Redis AOF/RDB or a broker persistence mode) before returning. Workers atomically claim the next eligible job (a lock or a fetch-and-mark-active), increment the attempt counter, and run your handler. On success they ack and the job moves to completed. On failure the library schedules a retry at \`now + backoff(attempt)\`, or moves the job to failed and eventually to a dead-letter destination once attempts are exhausted. If the process dies while the job is active, a reaper returns stale active jobs to waiting - which is exactly why the handler must tolerate receiving the same job twice.
    `,
    codeExamples: [
      {
        title: "Priorities, delays and inspecting state",
        language: "ts",
        code: `import { Queue } from "bullmq";

const reportQueue = new Queue("reports", { connection });

// High-priority job jumps ahead of normal ones (lower number = higher priority)
await reportQueue.add("generate", { reportId: "r_high" }, { priority: 1 });
await reportQueue.add("generate", { reportId: "r_normal" }, { priority: 5 });

// Delayed job becomes eligible in 24 hours
await reportQueue.add(
  "cleanup",
  { olderThanDays: 90 },
  { delay: 24 * 60 * 60 * 1000 },
);

const job = await reportQueue.getJob("r_high");
const state = await job.getState(); // delayed | waiting | active | completed | failed
console.log(state, job.attemptsMade, job.opts.priority);`,
        description:
          "Lower priority numbers run first in BullMQ. getState() is your window into the state machine - wire it into an admin endpoint or a metrics exporter.",
      },
    ],
    commonMistakes: [
      "Promising 'exactly-once' to stakeholders because the broker docs mention it - always design for duplicate delivery.",
      "Putting huge JSON blobs in job payloads: store a reference id and load the data when the job runs.",
      "Using one queue with 50 priority levels instead of two queues - you lose throughput predictability.",
      "Treating 'job completed' as 'user saw the result' - the UI still needs a status endpoint.",
    ],
    bestPractices: [
      "Default to at-least-once and make handlers idempotent; only choose at-most-once for truly disposable data (metrics ticks).",
      "Cap attempts (3-10) and pair every retry policy with a dead-letter destination.",
      "Include a jobId derived from a business key (orderId + operation) so enqueueing twice deduplicates.",
      "Record both enqueuedAt and startedAt so you can alert on queue wait time separately from processing time.",
    ],
    realWorldUseCases: [
      "Ride-hailing: a 'charge rider' job at priority 1 beats 'rebuild materialized view' at priority 9 on the same fleet.",
      "Billing systems delay proration jobs until the period boundary with delayed jobs instead of cron polling.",
      "Job platforms use separate queues per tenant tier so enterprise SLAs are not starved by free-tier bulk work.",
    ],
    resources: [
      docs("BullMQ Documentation", OFFICIAL.bullmqDocs, "Official reference for job states, priorities, delays and attempts."),
      docs("Redis Documentation", OFFICIAL.redisDocs, "The data structures and persistence modes that back most Redis job queues."),
      ytSearch("job queue delivery semantics at-least-once explained", "Visual explanations of acks, redelivery and delivery guarantees.", "en", "10-18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-delivery-matrix",
        title: "Delivery matrix",
        prompt:
          "For a payment-capture job, fill in a 3x3 matrix: rows = delivery mode (at-most-once, at-least-once, exactly-once-via-idempotency), columns = (worker crashes before side effect, worker crashes after side effect before ack, duplicate delivery). For each cell, say whether money is lost, double-charged, or correct.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "At-most-once + crash before side effect = money never captured.",
          "Exactly-once-via-idempotency uses the payment reference as the dedup key, so duplicates collapse.",
        ],
        solution: `| Scenario                        | at-most-once | at-least-once (naive) | at-least-once + idempotent |
|---------------------------------|--------------|------------------------|----------------------------|
| Crash BEFORE side effect        | LOST capture | Redelivered -> correct | Redelivered -> correct     |
| Crash AFTER effect, before ack  | Effect done  | DUPLICATE charge       | Dedup key -> correct       |
| Duplicate delivery              | (rare) once  | DOUBLE charge          | Dedup key -> correct       |

Conclusion: only the third column is safe, and it is built entirely from
consumer-side idempotency (a processed-jobs table with a UNIQUE constraint
on the business key), not from broker configuration.`,
        solutionLanguage: "markdown",
      },
    ],
    projectIds: ["p3-job-processing"],
  },
  {
    ...shared,
    id: "p3m5-message-brokers",
    slug: "message-brokers",
    title: "Message Brokers",
    description:
      "Brokers vs queue libraries, exchanges and topics, durability, acknowledgements, consumer prefetch, and when Redis Streams is enough instead of a dedicated broker.",
    order: 3,
    estimatedMinutes: 22,
    tags: ["message-brokers", "rabbitmq", "redis-streams", "pub-sub"],
    prerequisites: ["p3m5-job-queues", "p3m4-redis"],
    relatedTopics: ["p3m5-rabbitmq", "p3m5-event-driven-architecture", "p3m5-service-communication"],
    learningObjectives: [
      "Distinguish a dedicated message broker from a queue library layered on Redis",
      "Explain durability, acknowledgements and consumer prefetch and why each matters",
      "Describe topics/exchanges and how one publish reaches zero-to-many consumers",
      "Compare broker features with Redis Streams and pick the right tool",
    ],
    simpleExplanation:
      "A message broker is a standalone system whose whole job is to accept, route, buffer and deliver messages between processes. A queue library like BullMQ is convenience code on top of Redis: great for job queues, weaker at routing and fan-out. Brokers add exchanges or topics (publish once, many subscribers), explicit acknowledgements, and delivery controls like prefetch. Redis Streams cover a useful middle ground when you already run Redis and need consumer groups without full broker features.",
    detailedContent: `
**Broker vs queue library.** BullMQ and Sidekiq-style tools manage *jobs* inside Redis: one queue, retries, scheduling. A broker such as RabbitMQ, NATS or Kafka is infrastructure you run (or buy) specifically for messaging. It speaks AMQP/Kafka protocols, routes by rules, and enforces delivery guarantees per queue.

**Routing: exchanges and topics.** In RabbitMQ publishers never write to queues directly. They publish to an **exchange** with a **routing key**; bindings between exchanges and queues decide who receives a copy:

    publisher --> [ exchange ] --bindings--> queue A
                                  \`--> queue B (or nobody)

Exchange types: **direct** (exact key match), **fanout** (everyone bound), **topic** (wildcard patterns like \`order.*.created\`), **headers** (match on header attributes; rarely used).

**Durability** has two halves: durable queues/exchanges (survive broker restart) and persistent messages (written to disk, not just RAM). Both are required if losing a message is unacceptable.

**Acknowledgements.** A consumer acks after successful processing. Unacked messages are redelivered if the connection drops - the backbone of at-least-once. Negative acks (nack) can requeue or dead-letter.

**Prefetch (QoS).** \`prefetch(N)\` caps unacked messages in flight per consumer. \`prefetch(1)\` gives strict fairness; higher values hide latency but risk memory bloat and slow acks. Start at 10-50 and tune from metrics.

**Brokers vs Redis Streams.** Streams are a log structure inside Redis with consumer groups and pending-entry lists (PEL) - excellent for event fan-out when Redis is already in your stack. They lack native per-message routing, rich TTLs, and the ops ecosystem of a dedicated broker. Choose Streams for moderate scale and simple topologies; choose RabbitMQ/Kafka when routing, partitioned ordering or large-scale replay are first-class requirements.
    `,
    howItWorks: `
When a publisher sends a message the broker persists it (if configured durable), applies exchange/binding rules to compute target queues, and enqueues. Consumers subscribe with a channel and prefetch window; the broker pushes messages until the window is full. Each delivered message sits in the queue's *unacked* set until the consumer sends ack (delete) or nack (requeue/dead-letter). If the consumer connection dies, unacked messages automatically return to the ready state for another consumer. Clustering adds mirrored/quorum queues so a node failure does not lose data - the same trade-off you know from Redis Sentinel, but with message-specific semantics like publisher confirms.
    `,
    codeExamples: [
      {
        title: "Same idea, two stacks: BullMQ vs Redis Streams",
        language: "ts",
        code: `import { Queue } from "bullmq";
import IORedis from "ioredis";

// --- Queue library style (BullMQ) ---
const emailQueue = new Queue("emails", { connection });
await emailQueue.add("send", { to: "a@example.com" }); // retries, backoff handled for you

// --- Broker-style primitives: Redis Streams + consumer groups ---
const redis = new IORedis();
await redis.xadd("events", "*", "type", "user.created", "payload", JSON.stringify({ id: 42 }));
await redis.xgroupCreate("events", "billing", "0", "MKSTREAM").catch(() => {});
// Each consumer reads from its own position and acks with XACK
const result = await redis.xreadgroup(
  "GROUP", "billing", "worker-1",
  "COUNT", 10, "BLOCK", 5000,
  "STREAMS", "events", ">",
);
if (result) {
  for (const [, messages] of result) {
    for (const [id, fields] of messages) {
      console.log(id, fields);
      await redis.xack("events", "billing", id);
    }
  }
}`,
        description:
          "Left: a job queue library gives you retries and scheduling for free. Right: raw Streams give you consumer groups and replayable history - closer to a broker, but you wire redelivery policy yourself via the pending-entries list.",
      },
    ],
    commonMistakes: [
      "Assuming a queue library gives you publish/subscribe fan-out - most are one-consumer-per-job models.",
      "Leaving prefetch unbounded: one slow consumer can pull thousands of messages and bloat memory.",
      "Calling messages 'safe' while using non-durable queues on ephemeral storage.",
      "Choosing Kafka 'because scale' when the real need was RabbitMQ-style routing at modest volume.",
    ],
    bestPractices: [
      "Name queues and exchanges by domain (orders.created, billing.charges) not by technology.",
      "Set explicit prefetch and measure unacked count as a saturation metric.",
      "Prefer Redis Streams when you already operate Redis and topology is simple; graduate to a broker when routing or replay dominates.",
      "Document the ack point in code: the line where 'done' actually means done.",
    ],
    realWorldUseCases: [
      "Ride-hailing publishes ride events once; billing, matching and analytics each bind their own queue.",
      "IoT platforms ingest device telemetry into Redis Streams and fan out to real-time dashboards and cold-storage writers.",
      "E-commerce uses a broker so the storefront never talks to the warehouse system synchronously.",
    ],
    resources: [
      docs("RabbitMQ Docs", "https://www.rabbitmq.com/docs", "Official broker documentation: exchanges, bindings, durability, acknowledgements."),
      docs("Redis Documentation", OFFICIAL.redisDocs, "Redis data structures including Streams, consumer groups and persistence."),
      ytSearch("message broker vs queue explained", "Comparisons of brokers (RabbitMQ, Kafka, NATS) and Redis-backed queues.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-choose-tool",
        title: "Pick the tool",
        prompt:
          "For each scenario choose BullMQ, Redis Streams, or a dedicated broker (RabbitMQ/Kafka), and give one reason and one drawback: (1) nightly report jobs with retries, (2) six microservices subscribing to 'order.created', (3) 50k IoT events/sec with replay for new consumers, (4) a reminder to email a user in 48 hours.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Fan-out to many independent services is a routing problem.",
          "Replay for new consumers implies an append-only log, not a work queue.",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m5-rabbitmq",
    slug: "rabbitmq",
    title: "RabbitMQ in Node.js",
    description:
      "Exchanges, queues and bindings in practice: direct, fanout and topic routing, manual acks, publisher confirms and robust connection management with amqplib.",
    order: 4,
    estimatedMinutes: 25,
    tags: ["rabbitmq", "amqp", "nodejs", "acks"],
    prerequisites: ["p3m5-message-brokers"],
    relatedTopics: ["p3m5-dead-letter-queues", "p3m5-retries-backoff", "p3m5-service-communication"],
    learningObjectives: [
      "Model a routing topology with exchanges, bindings and queues",
      "Choose between direct, fanout and topic exchanges for a given requirement",
      "Implement manual acknowledgements and publisher confirms in Node.js",
      "Write connection/channel management that survives broker restarts",
    ],
    simpleExplanation:
      "RabbitMQ is a message broker that speaks AMQP. You publish messages to an *exchange* with a routing key; bindings decide which queues get a copy. Consumers read from queues and explicitly acknowledge messages, so unacked work is redelivered after a crash. Publisher confirms tell the producer the broker has taken responsibility for the message - without them, 'published' is just 'wrote to a socket'.",
    detailedContent: `
**Topology.** Three objects:

1. **Exchange** - routing inbox. Publishers send here.
2. **Binding** - a rule from an exchange to a queue, optionally with a routing key pattern.
3. **Queue** - durable buffer that consumers read from.

**Exchange types you will use:**

- **direct** - message is delivered only to queues bound with the *exact* routing key. \`billing.charges\` goes to whoever bound \`billing.charges\`.
- **fanout** - delivered to *every* bound queue, ignoring the key. Perfect for "replicate this event everywhere".
- **topic** - patterns with \`*\` (exactly one word) and \`#\` (zero or more words). \`order.*.created\` matches \`order.eu.created\`; \`eu.#\` matches everything under \`eu\`.

**Acknowledgements.** With auto-ack RabbitMQ forgets a message the moment it is delivered - at-most-once. Production consumers call \`channel.ack(msg)\` only after side effects succeed, and \`channel.nack(msg, false, false)\` (requeue=false) to route poison messages to a dead-letter exchange. A redelivery carries a \`redelivered\` flag: use it as a hint, never as correctness logic.

**Publisher confirms.** \`createConfirmChannel()\` plus \`waitForConfirms()\` (or per-publish callbacks) means the broker has persisted/routed the message. Combine with an idempotent consumer because a confirm can succeed while the consumer still crashes later.

**Connections vs channels.** AMQP uses one TCP connection multiplexed by channels - cheap, but channels are not safe to share across uncoordinated concurrent tasks. Create connections lazily, attach error handlers, and reconnect with exponential backoff. Never share a channel across unrelated async work.

Sequence:

1. Connect (retry forever with backoff on failure).
2. \`assertExchange\` / \`assertQueue\` / \`bindQueue\` (idempotent setup).
3. Publish with confirm, or consume with manual ack.
4. On connection loss, destroy channels, reconnect, re-assert topology.
    `,
    howItWorks: `
The \`amqplib\` client opens a TCP socket and performs an AMQP handshake. Topology commands (\`assertQueue\`, \`bindQueue\`) are synchronous RPCs to the broker. Publishing writes a \`basic.publish\` frame; without confirms the client has no idea whether the broker accepted it. With a confirm channel the broker sends an ack per message after storage. On the consumer side \`basic.consume\` starts push delivery; messages stay unacked in the broker's *unacknowledged* set until your ack arrives. If the channel or connection drops, RabbitMQ returns every unacked message to the ready queue - possibly to a different consumer. This redelivery is your at-least-once safety net and the reason idempotent handlers are non-negotiable.
    `,
    codeExamples: [
      {
        title: "Topic publishing with confirms, consuming with manual acks",
        language: "ts",
        code: `import amqp from "amqplib";

const url = process.env.AMQP_URL ?? "amqp://localhost";
const connection = await amqp.connect(url);

// --- Producer: durable topology + publisher confirms ---
const pub = await connection.createConfirmChannel();
await pub.assertExchange("orders", "topic", { durable: true });
await pub.assertQueue("orders.emails", { durable: true });
await pub.bindQueue("orders.emails", "orders", "order.*.created");

const payload = Buffer.from(JSON.stringify({ orderId: "o_1", region: "eu" }));
pub.publish("orders", "order.eu.created", payload, { persistent: true });
await pub.waitForConfirms(); // broker has accepted responsibility

// --- Consumer: manual ack, small prefetch, nack to DLQ on poison ---
const sub = await connection.createChannel();
await sub.assertQueue("orders.emails", { durable: true });
await sub.prefetch(20);
await sub.consume("orders.emails", async (msg) => {
  if (!msg) return;
  try {
    await handleOrderCreated(JSON.parse(msg.content.toString()));
    sub.ack(msg);
  } catch (err) {
    if (isNonRetryable(err)) sub.nack(msg, false, false); // to DLQ, do not requeue
    else sub.nack(msg, false, true);                       // transient: requeue
  }
});`,
        description:
          "Note the split: publisher confirms protect the producer, manual acks protect the consumer, and the nack policy decides retry vs dead-letter. persistent: true plus a durable queue covers disk survival across broker restarts.",
      },
    ],
    commonMistakes: [
      "Using auto-ack in production - one crash between delivery and side effect silently loses the message.",
      "Publishing without confirms and treating 'no exception thrown' as success.",
      "Sharing a single channel across concurrent publishes - interleaved frames can cause protocol errors.",
      "Forgetting to re-assert bindings after a broker rebuild; topology should live in deployable code, not manual UI clicks.",
    ],
    bestPractices: [
      "Keep topology assertions in a startup script or migration so every environment matches.",
      "Set qos/prefetch explicitly; start at 20 and tune from unacked and processing-time metrics.",
      "Wrap connect with reconnect-with-backoff logic and a single 'broker up/down' health signal.",
      "Always attach a dead-letter exchange to queues whose failures matter.",
    ],
    realWorldUseCases: [
      "Order service publishes order.eu.created once; email, analytics and fraud queues bind their own patterns.",
      "Payment providers push webhook-style events into a topic exchange consumed by partner-specific queues.",
      "Legacy monolith decoupling: wrap risky writes behind a broker so new services subscribe without touching the monolith.",
    ],
    resources: [
      docs("RabbitMQ Documentation", "https://www.rabbitmq.com/docs", "Official docs hub: exchanges, queues, bindings, durability."),
      docs("RabbitMQ - Publisher Confirms", "https://www.rabbitmq.com/docs/confirm", "How producers learn the broker accepted a message."),
      docs("amqplib (Node AMQP client)", "https://www.npmjs.com/package/amqplib", "API reference for the Node.js AMQP 0-9-1 client used in the examples."),
      ytSearch("rabbitmq node.js tutorial exchanges acks", "Hands-on RabbitMQ + Node walkthroughs.", "en", "15-30 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-rabbit-topology",
        title: "Design the topology",
        prompt:
          "An e-commerce system publishes: order.created, order.shipped, payment.captured, payment.failed. Consumers: email service (order.created, payment.failed), analytics (everything), fraud (payment.captured, payment.failed). Sketch exchanges, binding keys and queues using a topic exchange. Then state which binding you would change to make analytics use fanout instead.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "One topic exchange with keys like order.* and payment.* covers most needs.",
          "Analytics can bind '#' on the topic exchange - or bind a fanout exchange that the publisher also publishes to.",
        ],
        solution: `Exchange: events (type: topic, durable)

Queues and bindings:
  emails      <- binding keys: order.created, payment.failed
  analytics   <- binding key:  #            (matches everything)
  fraud       <- binding keys: payment.captured, payment.failed

Publisher routing keys used: order.created, order.shipped,
payment.captured, payment.failed.

Alternative for analytics via fanout: create a fanout exchange
'mirror', publish each message to BOTH 'events' and 'mirror',
and bind the analytics queue to 'mirror' with no key.`,
        solutionLanguage: "markdown",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-chat-app"],
  },
  {
    ...shared,
    id: "p3m5-event-driven-architecture",
    slug: "event-driven-architecture",
    title: "Event-Driven Architecture",
    description:
      "Events vs commands, naming and schema discipline, how events reduce coupling, the eventual side effects they introduce, and when not to go event-driven.",
    order: 5,
    estimatedMinutes: 22,
    tags: ["events", "eda", "coupling", "schemas"],
    prerequisites: ["p3m5-message-brokers", "p3m1-separation-of-concerns"],
    relatedTopics: ["p3m5-outbox-pattern", "p3m5-eventual-consistency", "p3m5-service-communication"],
    learningObjectives: [
      "Distinguish events (facts that happened) from commands (instructions to do something)",
      "Name and version events with past-tense, business-meaningful identifiers",
      "Explain how events reduce temporal and spatial coupling - and what they trade away",
      "Identify situations where an event-driven design is the wrong tool",
    ],
    simpleExplanation:
      "An event is a record that something happened: 'order.created', not 'send email'. Producers announce facts without knowing who listens; consumers subscribe and decide their own reactions. This flips control flow and reduces coupling, but it also means side effects happen later, possibly twice, and you must design schemas and failure handling carefully. When users need an immediate, deterministic answer, a plain function call is still better.",
    detailedContent: `
**Events vs commands.**

- **Event** - past tense, a fact: \`order.created.v1\`. The emitter does not care who reacts. Many subscribers are normal.
- **Command** - imperative, an instruction: \`send-receipt\`. Exactly one handler should succeed. Retrying a command is safe only if the handler is idempotent.

Mixing them ("event" names that actually order someone around) creates hidden coupling and confusion in every on-call incident.

**Naming and schemas.** Use domain language, past tense, and explicit versions: \`order.created.v1\`. Validate with a schema (Zod, JSON Schema, Avro) at the producer *and* the consumer. Evolution rule: additive changes are minor-version-safe; breaking changes require a new major version and a transition period where both are published.

**Coupling reduction.** Synchronous chains couple services in *time* (the caller must be up) and *space* (the caller must know the callee's address). Events cut both: the producer publishes and moves on; consumers appear and disappear without deploys on the producer side. The price: you no longer control when (or how many times) side effects run.

**Eventual side effects.** Receipt emails, search-index updates and analytics will lag the write by milliseconds to seconds. Your UI and support tooling need "processing" states rather than pretending the effect is instant.

**When NOT event-driven.** When the user needs a synchronous decision (approve/decline a payment in the same response). When the workflow is a short, single-owner transaction (use a database transaction). When your team lacks the observability to debug five services that each reacted to one click. Events are a tool for decoupling scale and ownership - not a substitute for thinking about flow.
    `,
    howItWorks: `
A producer emits an event after (or atomically with) a state change - ideally via the transactional outbox so the event cannot be lost. The broker fans it out to bound queues or consumer groups. Each consumer validates the payload schema, executes its own logic, and acks. Failures are retried per consumer, so one broken subscriber never blocks others. Tracing stitches the flow together: a single trace id travels in event headers so you can see every reaction to one user action. Over time the ecosystem grows by addition - new consumers join by binding a queue - without the producer ever redeploying.
    `,
    codeExamples: [
      {
        title: "Versioned event schema with Zod",
        language: "ts",
        code: `import { z } from "zod";

export const OrderCreatedV1 = z.object({
  eventId: z.string().uuid(),
  eventType: z.literal("order.created.v1"),
  occurredAt: z.string().datetime(),
  aggregateId: z.string(), // order id
  causationId: z.string().optional(), // trace of what triggered this
  payload: z.object({
    orderId: z.string(),
    customerId: z.string(),
    totalCents: z.number().int(),
    currency: z.string().length(3),
  }),
});

export type OrderCreatedV1 = z.infer<typeof OrderCreatedV1>;

// Producer: refuse to publish invalid events
async function publishOrderCreated(event: unknown) {
  const parsed = OrderCreatedV1.parse(event);
  await bus.publish(parsed.eventType, parsed);
}

// Consumer: refuse to process invalid events; ack only after side effects
await bus.subscribe("order.created.v1", async (raw) => {
  const event = OrderCreatedV1.parse(raw);
  await sendReceiptEmail(event.payload);
});`,
        description:
          "Schema-first events: the literal eventType keeps versions explicit, and parsing at both ends turns silent corruption into a loud, early failure.",
      },
    ],
    commonMistakes: [
      "Publishing 'events' that are really commands (order.sendEmail) - consumers multiply and nobody owns the flow.",
      "No versioning strategy: one day a breaking payload change deploys and half the consumers crash.",
      "Treating delivery as instant in the UI - users click twice when nothing appears to happen.",
      "Emitting events from a background job that itself was only 'probably' executed - use the outbox pattern.",
    ],
    bestPractices: [
      "Name events as facts in past tense; review names like a public API - they are permanent.",
      "Version every schema and support N and N-1 during migrations.",
      "Carry trace/context ids in event metadata for end-to-end debugging.",
      "Start with one or two consumers; resist inventing a full event mesh on day one.",
    ],
    realWorldUseCases: [
      "Marketplace: one order.created event fans out to shipping, loyalty points, analytics and seller notifications owned by different teams.",
      "Ride-hailing: trip.completed triggers driver payout, rider rating prompt and city-level demand models independently.",
      "Chat apps: message.sent events feed push notifications, moderation scans and read-receipt projections.",
    ],
    resources: [
      docs("RabbitMQ Documentation", "https://www.rabbitmq.com/docs", "Topic and fanout exchanges as the routing substrate for event fan-out."),
      docs("Martin Fowler - Event Sourcing", "https://martinfowler.com/eaaDev/EventSourcing.html", "Foundational essay on events as first-class records of fact."),
      ytSearch("event driven architecture events vs commands", "Talks contrasting events, commands and choreography.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-event-audit",
        title: "Audit your events",
        prompt:
          "List 8 event names a ride-hailing app might publish. Mark each as well-formed (past tense, business fact) or broken, and rewrite the broken ones. Then say which of your events should never be consumed by more than one service.",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "'requestDriver' is a command, not an event.",
          "Payment capture should have exactly one owner - duplicates charge riders twice.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform"],
  },
  {
    ...shared,
    id: "p3m5-microservices-fundamentals",
    slug: "microservices-fundamentals",
    title: "Microservices Fundamentals - and the Honest Monolith Comparison",
    description:
      "What microservices actually are, an explicit comparison against modular monoliths (network failure modes, operational burden, data consistency), and why the recommended path starts monolithic.",
    order: 6,
    estimatedMinutes: 25,
    tags: ["microservices", "modular-monolith", "architecture", "trade-offs"],
    prerequisites: ["p3m5-event-driven-architecture", "p3m1-modular-monoliths"],
    relatedTopics: ["p3m5-service-communication", "p3m5-distributed-transactions", "p3m5-failure-handling"],
    learningObjectives: [
      "Define microservices by their properties (independent deployability, data ownership) rather than by size",
      "Compare modular monoliths and microservices across failure modes, operations and consistency",
      "Explain why splitting a codebase does not automatically reduce complexity - it relocates it",
      "Justify a 'modular monolith first' evolution path with concrete extraction criteria",
    ],
    simpleExplanation:
      "Microservices are separately deployed services, each owning its data, communicating over the network. A modular monolith keeps the same module boundaries inside one deployable process. The modular monolith gets you most of the design benefits with a fraction of the operational cost; microservices buy independent scaling and team autonomy but add network failure modes, a much heavier operational burden, and the loss of easy cross-service transactions. Split only when a real constraint demands it.",
    detailedContent: `
**What microservices are.** Not "small services" - they are services that can be **deployed independently**, **owned by one team**, and that **own their data** (no other service reads their database directly). Communication happens over the network: synchronous HTTP/gRPC or asynchronous events.

**The honest comparison** - this is the curriculum-critical table:

| Concern | Modular monolith | Microservices |
| --- | --- | --- |
| Deploy | One artifact, one pipeline, atomic releases | N pipelines, version skew between callers/callees |
| Failure modes | In-process call: exceptions, one stack trace | Network call: timeouts, partial outages, retries, cascading failure |
| Data consistency | One database, real ACID transactions | Database per service; cross-service work needs sagas/events |
| Latency | Function-call cost (microseconds) | Network hop (milliseconds) x every interaction |
| Operations | One service to monitor, scale and debug | Every service needs CI/CD, metrics, tracing, on-call knowledge |
| Team autonomy | Module ownership inside one repo | Full stack ownership per team: repo, infra, runbooks |

**Costs of splitting, spelled out:**

- **Network failure modes.** Every call can now time out, be slow, or hit half the fleet that is on a bad deploy. You inherit retries, circuit breakers, idempotency and partial-failure thinking - the rest of this module.
- **Operational burden.** More deployables means more pipelines, dashboards, alert routes and runbooks. For a small team this dominates feature work.
- **Data consistency.** "Reserve inventory and charge the card" stops being one transaction and becomes a saga with compensations and very careful reasoning.

**Recommended path.** Build a modular monolith with hard module boundaries (enforced with lint rules and dependency checks). Extract a module into a service only when you can name the forcing function: a genuinely different scaling profile, a compliance isolation requirement, or independent team release cadence that a monolith cannot satisfy. Most products never hit those thresholds - and that is a success, not a failure.
    `,
    howItWorks: `
In practice a modular monolith looks like a repo of modules, each with domain/application/infrastructure/api layers and a public interface that is the *only* import surface other modules may use. Composition happens in a single process at startup: the orders module receives the payments module's interface as a constructor dependency. Extraction to a service then replaces that in-process implementation with a network client behind the *same* interface - a mechanical change if you respected the boundary, a rewrite if you did not. Meanwhile the operational surface stays at one deployable until the moment extraction is justified, so you pay distributed-systems costs exactly once, when the business case exists.
    `,
    codeExamples: [
      {
        title: "Module boundaries that can become services later",
        language: "ts",
        code: `// src/modules/orders/api.ts - the ONLY surface other modules may import
export interface OrdersApi {
  placeOrder(cmd: PlaceOrderCommand): Promise<Order>;
  getOrder(id: string): Promise<OrderView>;
}

// src/modules/orders/index.ts - wires the module in-process
export function createOrdersModule(deps: {
  payments: PaymentsApi;
  inventory: InventoryApi;
  db: Db;
}): OrdersApi {
  return new OrdersServiceImpl(deps);
}

// Composition root (monolith startup)
const orders = createOrdersModule({ payments, inventory, db });
const app = express();
app.use("/orders", orders.httpRouter());

// FUTURE extraction: same interface, network client
// const orders = new OrdersHttpClient("https://orders.internal");`,
        description:
          "The interface is the seam. As long as every cross-module call goes through OrdersApi, swapping the in-process implementation for an HTTP client is a bounded change - that is what 'modular monolith designed for extraction' means.",
      },
    ],
    commonMistakes: [
      "Splitting into microservices to 'look senior' - you add network bugs without adding business value.",
      "Sharing a database between 'services' - that is a distributed monolith with none of the benefits.",
      "Microservices that each contain the whole layered stack of the monolith, owned by the same team anyway.",
      "Extracting a module mid-flight while its boundaries are still being rewritten weekly.",
    ],
    bestPractices: [
      "Enforce module boundaries with dependency-cruiser, ESLint boundaries rules or an import allow-list in CI.",
      "Keep a written forcing function (scaling number, compliance rule, team size) before any extraction.",
      "If you do go distributed, adopt this module's patterns: idempotency, timeouts, DLQs, tracing - they are not optional.",
      "Design module interfaces as if they were already network APIs: explicit DTOs, no leaking ORM entities.",
    ],
    realWorldUseCases: [
      "Shopify-scale platforms evolved from Rails monoliths; extraction happened per pressure point, not as a big-bang rewrite.",
      "A startup keeps billing, catalog and admin in one Node.js process with strict modules for 3 years, then extracts catalog when search relevance needs its own GPU fleet.",
      "Regulated fintech extracts only the KYC module into an isolated service for compliance, keeping the rest monolithic.",
    ],
    resources: [
      docs("Microsoft - Microservices architecture", "https://learn.microsoft.com/en-us/dotnet/architecture/microservices/", "Vendor-neutral properties of microservices and when to apply them."),
      docs("Martin Fowler - MonolithFirst", "https://martinfowler.com/bliki/MonolithFirst.html", "The classic 'start monolithic, extract later' recommendation."),
      ytSearch("modular monolith vs microservices", "Talks arguing the trade-offs, including operational cost.", "en", "15-25 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-forcing-function",
        title: "Name the forcing function",
        prompt:
          "Your Node.js e-commerce monolith (orders, catalog, payments, admin modules) has 6 engineers and 200 req/s. For each proposed split (catalog, payments, admin), write a one-paragraph justification citing a concrete forcing function - or reject the split. Then list three operational costs you would start paying on day one of any split.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "'Admin feels different' is not a forcing function; 'needs weekly security patching on a separate cadence' might be.",
          "Day-one costs: second CI/CD pipeline, distributed tracing, secrets per service, cross-service testing environment.",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m5-service-communication",
    slug: "service-communication",
    title: "Service Communication: Sync vs Async",
    description:
      "Choosing HTTP/gRPC versus events, setting timeouts as a first-class concern, light circuit breakers, and who owns the contract between services.",
    order: 7,
    estimatedMinutes: 20,
    tags: ["http", "grpc", "async", "contracts"],
    prerequisites: ["p3m5-microservices-fundamentals", "p3m5-rabbitmq"],
    relatedTopics: ["p3m5-retries-backoff", "p3m5-failure-handling", "p3m5-distributed-tracing"],
    learningObjectives: [
      "Choose sync HTTP/gRPC vs async events based on who needs the answer and when",
      "Apply timeouts at every hop and understand the timeout budget",
      "Implement a minimal circuit breaker to stop cascading failures",
      "Define contract ownership and versioning between producer and consumer",
    ],
    simpleExplanation:
      "Synchronous calls (HTTP, gRPC) ask a question and block for the answer - great when the caller's next step depends on the response. Asynchronous messages announce facts or queue instructions - great when the caller can continue without the answer. Every sync call needs a timeout, because the network never says 'this will fail eventually'. Contracts (OpenAPI, protobuf, event schemas) are the agreements that keep services interoperable as they deploy independently.",
    detailedContent: `
**The decision rule.** Ask two questions: *Does the caller need the result now?* and *Does the caller need to know it succeeded at all?*

- Checkout needs "was the payment authorized?" now -> **sync HTTP**.
- "Send a receipt when the order is placed" can happen later -> **async event**.
- A partner webhook endpoint flaky 5% of the time -> **async with retries** (never block your user on their uptime).

gRPC adds efficiency (binary protobuf, HTTP/2 multiplexing, codegen) and streaming; the trade-off is browser friction and less curl-friendly debugging. Most Node.js service meshes use JSON HTTP internally and gRPC only on hot paths.

**Timeouts and budgets.** A user-facing request that must answer in 2 s gives every downstream hop a slice of that budget: API waits max 1.8 s on inventory, which waits max 1.2 s on stock. Without explicit timeouts, one hung dependency consumes all your Node.js sockets and takes down everything - the classic cascading failure.

**Circuit breaker (lite).** Track recent failures per dependency. When the failure rate crosses a threshold, *open* the breaker and fail fast for a cooldown, periodically letting a probe request through (*half-open*). Failing in 1 ms beats timing out in 2 s when the dependency is already dead.

**Contract ownership.** The *producer* owns the schema (OpenAPI for HTTP, proto for gRPC, versioned event schemas for async) and must not break existing consumers. Consumers own their client code and their tolerance for additive change. Consumer-driven contract tests catch breaks in CI before deploy.
    `,
    howItWorks: `
A sync call is: serialize request, open or reuse a connection, write, wait under an AbortSignal/timeout, parse response, classify errors (retryable 5xx vs terminal 4xx). An async interaction replaces the wait with a durable enqueue and an acknowledgement of receipt, then decouples in time - which is why async removes latency coupling but adds consistency coupling (the systems are briefly out of sync; see eventual consistency). Tracing links both worlds: a traceparent header on HTTP and in event metadata lets you follow one user action through three sync hops and two async consumers, which is the only way to answer "why is checkout slow?" once you are distributed.
    `,
    codeExamples: [
      {
        title: "Timeouts and a light circuit breaker",
        language: "ts",
        code: `class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 10_000,
  ) {}
  isOpen() {
    return this.failures >= this.threshold && Date.now() - this.openedAt < this.cooldownMs;
  }
  recordSuccess() { this.failures = 0; }
  recordFailure() {
    this.failures++;
    if (this.failures === this.threshold) this.openedAt = Date.now();
  }
}

const breaker = new CircuitBreaker();

async function callBilling<T>(fn: () => Promise<T>): Promise<T> {
  if (breaker.isOpen()) throw new Error("CIRCUIT_OPEN: billing unavailable");
  try {
    const result = await Promise.race([
      fn(),
      sleep(2000).then(() => { throw new Error("TIMEOUT: billing"); }),
    ]);
    breaker.recordSuccess();
    return result;
  } catch (err) {
    breaker.recordFailure();
    throw err;
  }
}`,
        description:
          "Failing fast when billing is already failing keeps checkout workers free to serve users who can still complete. The timeout is non-negotiable; the breaker is what turns many timeouts into one clear 'down' signal.",
      },
    ],
    commonMistakes: [
      "Calling a dependency with no timeout - one hung socket eventually exhausts the pool.",
      "Retrying a non-idempotent POST on timeout: the first attempt may have succeeded.",
      "Consumers pinning exact response shapes - additive fields then become breaking changes.",
      "Using async messaging for a flow where the user must see the outcome in the same screen.",
    ],
    bestPractices: [
      "Make every outbound call carry an explicit timeout smaller than the caller's remaining budget.",
      "Version contracts in the producer's repo; consumers pin a version range and run contract tests.",
      "Prefer async with retries for third-party integrations so their downtime never becomes your downtime.",
      "Log dependency latency histograms per call site - they reveal which hop to optimize.",
    ],
    realWorldUseCases: [
      "Checkout: sync calls to inventory and payment with 800 ms budgets, then async events for receipts and analytics.",
      "Search autocomplete uses gRPC streaming to a ranking service for sub-50 ms suggestions.",
      "Partner notifications always go through a queue with long retry horizons, isolating partner flakiness.",
    ],
    resources: [
      docs("OpenTelemetry Documentation", "https://opentelemetry.io/docs/", "Propagating context across sync and async hops."),
      docs("OpenAPI Specification", OFFICIAL.openapiSpec, "The contract format most HTTP service meshes standardise on."),
      ytSearch("microservices sync vs async communication", "Comparisons of RPC, messaging and when to use each.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-choose-mode",
        title: "Sync or async?",
        prompt:
          "For each interaction choose sync HTTP, sync gRPC, or async events, and give a one-line justification: (1) check seat availability during booking, (2) update the loyalty points projection, (3) stream live auction bids to bidders, (4) trigger a partner's shipping system after purchase, (5) validate a coupon code in the cart.",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "If the UI blocks on the answer, it is sync.",
          "Partner systems are outside your availability domain - decouple them.",
        ],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-chat-app"],
  },
  {
    ...shared,
    id: "p3m5-retries-backoff",
    slug: "retries-and-backoff",
    title: "Retries and Backoff",
    description:
      "Retryable vs non-retryable errors, exponential backoff with jitter, attempt caps, the idempotency requirement, and staying inside timeout budgets.",
    order: 8,
    estimatedMinutes: 20,
    tags: ["retries", "backoff", "resilience", "errors"],
    prerequisites: ["p3m5-service-communication", "p2m1-custom-errors"],
    relatedTopics: ["p3m5-dead-letter-queues", "p3m5-idempotent-consumers", "p3m5-failure-handling"],
    learningObjectives: [
      "Classify errors as retryable (transient) or non-retryable (terminal)",
      "Implement exponential backoff with jitter and justify each component",
      "Set max attempts and understand why retries require idempotent operations",
      "Compute a retry schedule that fits inside an overall timeout budget",
    ],
    simpleExplanation:
      "Networks and dependencies fail temporarily all the time, so production code retries transient errors. Blind retries are dangerous: they hammer a struggling service and can double-charge users. The safe pattern is to retry only known-transient errors, with exponential delays and random jitter, capped at a small number of attempts, against operations you have made idempotent.",
    detailedContent: `
**Retryable vs non-retryable.** Retrying makes sense for *transient* failures: connection resets, DNS blips, HTTP 502/503/504, 429 with Retry-After, timeouts where the outcome is unknown. Never retry *terminal* failures: 400 validation, 401/403 auth, 404, 409 conflict, schema-parse errors. Retrying a 400 is pure noise; retrying a timeout of a non-idempotent POST risks duplicate side effects - if the outcome is unknown, you must first reconcile (check whether the effect happened) or use an idempotency key.

**Exponential backoff.** Delay before retry n is \`base * factor^n\` (e.g. 500 ms, 1 s, 2 s, 4 s). Growth gives the dependency time to recover and sheds load naturally.

**Jitter.** Add randomness - full jitter (\`random(0, backoff)\`) or equal jitter (\`backoff/2 + random(0, backoff/2)\`). Without jitter, a thousand clients that failed together retry together and stampede the recovering service: the thundering herd.

**Attempt caps.** 3-6 attempts is typical. Past that you are converting a transient blip into an outage by tying up workers. After the cap, fail visibly (move the job to a DLQ, alert).

**Timeout budgets.** If the caller must answer in 2 s, your retry loop must budget: attempt(400 ms) + wait + attempt(400 ms) ... Stop retrying when the remaining budget cannot fit another attempt plus its minimum backoff - fail early with a clear error instead of a guaranteed client timeout.

**The idempotency requirement.** Retries imply duplicate execution. Make the operation idempotent first (dedup keys, conditional writes) or only retry operations whose semantics are safe (PUT replace, GET).
    `,
    howItWorks: `
A retry helper wraps any flaky operation: run it, catch, classify the error, sleep with computed backoff, loop until success or attempts exhausted. Classification usually maps error types/HTTP codes to a boolean. The sleep must be cancellable (AbortSignal) so shutdown does not wait out a 30 s backoff. Instrument every attempt: attempt number, error class, sleep duration - these become the dashboards that tell you whether a dependency is flaky or down. In BullMQ the same policy lives declaratively in job options (\`attempts\`, \`backoff: { type: "exponential", delay: 1000 }\`) and the library owns the loop, but the classification still belongs in your handler via \`UnrecoverableError\` for terminal failures.
    `,
    codeExamples: [
      {
        title: "Retry with classification, exponential backoff and jitter",
        language: "ts",
        code: `function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500;
  if (err instanceof TimeoutError) return true; // outcome unknown -> only if idempotent
  return false; // validation, auth, not found: terminal
}

async function withRetry<T>(fn: () => Promise<T>, retries = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;
      if (attempt === retries) break;
      const base = Math.min(30_000, 500 * 2 ** attempt);   // 500, 1s, 2s, 4s ...
      const delay = base / 2 + Math.random() * (base / 2); // equal jitter
      await sleep(delay);
    }
  }
  throw lastErr;
}`,
        description:
          "Equal jitter keeps the exponential curve while desynchronizing a thundering herd. The isRetryable classifier is the single place policy lives - keep it unit-tested.",
      },
    ],
    commonMistakes: [
      "Retrying every error equally - a permanent 400 burns attempts and hides the real bug.",
      "No jitter: a broker blip causes all workers to retry in lockstep and finish the outage.",
      "Retrying non-idempotent POSTs on timeout without an idempotency key.",
      "Letting retries exceed the client's timeout budget - slow failure is worse than fast failure.",
    ],
    bestPractices: [
      "Centralize policy in one helper (or the queue library's options); do not scatter try/retry blocks.",
      "Cap attempts and always pair exhaustion with a DLQ or a visible error path.",
      "Honor Retry-After headers on 429 responses.",
      "Log each retry with attempt count and error class to feed dependency health dashboards.",
    ],
    realWorldUseCases: [
      "Webhook deliveries to partners: retries over hours with growing backoff, then DLQ and alerting.",
      "Payment authorization calls retried only on 5xx/network errors with an idempotency key from the merchant.",
      "Service-to-service calls in a mesh use per-call retry budgets to avoid retry storms.",
    ],
    resources: [
      docs("AWS Builders Library - Timeouts, retries and backoff with jitter", "https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/", "Canonical treatment of backoff, jitter and thundering herds."),
      docs("BullMQ Documentation", OFFICIAL.bullmqDocs, "Declarative attempts and backoff options for queue-based retries."),
      ytSearch("exponential backoff and jitter explained", "Visual explanations of retry storms and jitter strategies.", "en", "8-15 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-backoff-math",
        title: "Compute the schedule",
        prompt:
          "An operation fails 6 times then succeeds. Base delay 100 ms, factor 2, full jitter (uniform in [0, backoff]), 6 retries max. (1) What is the maximum total time spent sleeping? (2) What is the minimum? (3) Why does full jitter help when 500 workers fail at once?",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "Backoffs before retries 1..6 are 100, 200, 400, 800, 1600, 3200 ms at full size.",
          "Full jitter means expected sleep is half the backoff.",
        ],
        solution: `1. Maximum total sleep (no jitter applied):
   100 + 200 + 400 + 800 + 1600 + 3200 = 6300 ms

2. Minimum total sleep approaches 0 ms (each jitter draw can be
   arbitrarily close to 0). Expected total with full jitter is
   about 3150 ms (half of 6300).

3. Without jitter, all 500 workers retry at identical timestamps
   (100ms, 300ms, 700ms...), creating synchronized load spikes on
   an already-struggling dependency. Full jitter spreads retries
   uniformly across each backoff window, flattening the spike.`,
        solutionLanguage: "markdown",
      },
    ],
    projectIds: ["p3-job-processing", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m5-dead-letter-queues",
    slug: "dead-letter-queues",
    title: "Dead-Letter Queues",
    description:
      "Why poison messages need a quarantine, alerting on DLQ depth, a safe replay procedure, and separating retryable failures from broken payloads.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["dlq", "queues", "operations", "replay"],
    prerequisites: ["p3m5-retries-backoff", "p3m5-job-queues"],
    relatedTopics: ["p3m5-rabbitmq", "p3m5-failure-handling", "p3m5-idempotent-consumers"],
    learningObjectives: [
      "Explain what a poison message is and why unbounded retries are harmful",
      "Configure a dead-letter exchange/queue in RabbitMQ and a failed-job destination in BullMQ",
      "Design an alerting and replay procedure for dead-lettered work",
      "Decide when to requeue, when to drop, and when to fix forward",
    ],
    simpleExplanation:
      "Some messages can never succeed: malformed payloads, references to deleted records, a bug in a new deploy. If they stay in the main queue they block or crash consumers forever. A dead-letter queue (DLQ) is a quarantine: after a retry limit or a terminal error, the message moves to a side queue where operators can inspect, fix the cause, and replay it deliberately. The DLQ turns a silent loop into a visible, operable incident.",
    detailedContent: `
**Why DLQs exist.** Without them you get two failure modes: infinite redelivery of a broken message (a poison message) that burns CPU and hides real traffic, or silent drops that lose money. A DLQ makes the third path explicit: park it, alert on it, fix the root cause, replay.

**What routes a message to the DLQ:**

1. Retry attempts exhausted (the queue library moves a failed job after N attempts).
2. A consumer nacks with requeue=false (RabbitMQ) or throws an unrecoverable error (BullMQ).
3. Message TTL expiry, if you configure per-queue TTL with a dead-letter exchange as the expiry target.

**RabbitMQ mechanics.** Attach \`x-dead-letter-exchange\` (and optional \`x-dead-letter-routing-key\`) arguments to the source queue. Failed messages are re-published to that exchange like new messages. The broker also annotates headers (\`x-death\` counts, reason) so replay tooling can show why each message arrived.

**Alerting.** DLQ depth must be a first-class metric with an alert - a DLQ nobody watches is a drop with extra steps. Pair depth with age: one 3 a.m. failure that stops repeating is different from a steady drip.

**Replay procedure.**

1. Acknowledge the incident; snapshot the DLQ (export messages).
2. Fix the cause: bad deploy rolled back, schema bug patched, missing record created.
3. Replay in a controlled way: either re-publish to the source queue (preserving headers if needed) or run an operator tool that iterates the DLQ with a dry-run mode.
4. Verify success metrics, then purge the DLQ copy to avoid double-processing.

**Requeue vs drop.** Requeue when the cause is fixed and the work still matters (charges, provisioning). Drop with an audit log when the message is obsolete (a notification for a cancelled order).
    `,
    howItWorks: `
In RabbitMQ the DLQ is a normal queue; only the source queue's arguments make it a destination. When a consumer nacks without requeue, or a TTL expires, the broker routes the message to the dead-letter exchange and applies the stored routing key. Headers accumulate an \`x-death\` array with reason and count per hop, which is how you distinguish "retried 5 times by our consumer" from "expired at the exchange". In BullMQ, failed jobs with attempts exhausted stay in the failed set; a relay or operator tool moves them to an archive queue for replay via \`queue.add\` with the original payload. Either way the mechanics are bookkeeping - the discipline is the alert-and-replay runbook around them.
    `,
    codeExamples: [
      {
        title: "RabbitMQ DLX wiring plus a replayable failed queue",
        language: "ts",
        code: `import amqp from "amqplib";

const conn = await amqp.connect(process.env.AMQP_URL ?? "amqp://localhost");
const ch = await conn.createChannel();

await ch.assertExchange("tasks.dlx", "direct", { durable: true });
await ch.assertQueue("tasks.failed", { durable: true });
await ch.bindQueue("tasks.failed", "tasks.dlx", "tasks.failed");

await ch.assertQueue("tasks.work", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "tasks.dlx",
    "x-dead-letter-routing-key": "tasks.failed",
  },
});

// Consumer policy: transient -> requeue; poison -> dead-letter
await ch.consume("tasks.work", async (msg) => {
  try {
    await handle(JSON.parse(msg.content.toString()));
    ch.ack(msg);
  } catch (err) {
    if (isNonRetryable(err)) ch.nack(msg, false, false); // -> tasks.failed
    else ch.nack(msg, false, true);                       // retry
  }
});

// After the fix: replay by re-publishing from the DLQ
async function replay(msg: amqp.ConsumeMessage) {
  await ch.sendToQueue("tasks.work", msg.content, {
    persistent: true,
    headers: { ...msg.properties.headers, "x-replay-of": msg.fields.deliveryTag },
  });
}`,
        description:
          "The DLX arguments do the routing; the consume callback decides retry vs quarantine. Replay is just a careful re-publish to the source queue once the root cause is fixed.",
      },
    ],
    commonMistakes: [
      "No alert on DLQ depth - messages quietly accumulate for weeks.",
      "Replaying an entire DLQ into production during an incident, causing a second incident.",
      "Dead-lettering on every error including transient network blips, quarantining recoverable work.",
      "Purging the DLQ before capturing evidence needed for the postmortem.",
    ],
    bestPractices: [
      "Alert on DLQ depth and oldest-message age with different severities.",
      "Store DLQ payloads immutably (or snapshot before replay) as incident evidence.",
      "Mark replayed messages with a header/metric so you can distinguish first-run from replay effects.",
      "Review the DLQ weekly; a persistent message type is a product bug, not an operations chore.",
    ],
    realWorldUseCases: [
      "Payment webhooks with invalid signatures land in a DLQ and are reviewed by the security team.",
      "A bad deploy emits events with a missing field; the consumer dead-letters them, the deploy is rolled back, and the DLQ is replayed cleanly.",
      "Nightly batch jobs that reference deleted tenants are dead-lettered and auto-archived rather than retried forever.",
    ],
    resources: [
      docs("RabbitMQ Docs - Dead Lettering", "https://www.rabbitmq.com/docs/dlx", "Official guide to dead-letter exchanges, queues and headers."),
      docs("BullMQ Documentation", OFFICIAL.bullmqDocs, "Failed-job handling, attempts and how to build DLQ flows on BullMQ."),
      ytSearch("dead letter queue explained", "Introductions to DLQs, poison messages and replay practices.", "en", "8-15 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-dlq-runbook",
        title: "Write the runbook",
        prompt:
          "A DLQ named orders.emails.dlq receives 40 messages/hour after a deploy. Write a 6-step runbook: detection, triage (how you classify poison vs transient), containment, fix, replay, and verification. Include the metric you alert on and the tool you would use to replay.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Triage looks at the DLQ message headers/body and the error logs of the consumer.",
          "Containment might pause the consumer to stop the drip before the fix.",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m5-idempotent-consumers",
    slug: "idempotent-consumers",
    title: "Idempotent Consumers",
    description:
      "Dedup keys, processed-message stores, naturally idempotent operations, and the ordering caveats that come with redelivery.",
    order: 10,
    estimatedMinutes: 22,
    tags: ["idempotency", "consumers", "dedup", "exactly-once"],
    prerequisites: ["p3m5-job-queues", "p2m5-idempotency"],
    relatedTopics: ["p3m5-retries-backoff", "p3m5-outbox-pattern", "p3m5-dead-letter-queues"],
    learningObjectives: [
      "Design a dedup key and place a processed-message store in the consumer path",
      "Recognize operations that are naturally idempotent versus those that need guarding",
      "Implement the insert-then-apply pattern inside one database transaction",
      "Explain ordering caveats under at-least-once redelivery",
    ],
    simpleExplanation:
      "At-least-once delivery means your handler will sometimes run twice for the same message. An idempotent consumer makes the second run a no-op: it remembers what it has already processed (usually via a unique row keyed by the message id) and acks duplicates without applying side effects again. This is the practical way production systems get 'effectively once' behavior.",
    detailedContent: `
**The dedup key.** Prefer a producer-generated, globally unique \`eventId\` (UUID) carried in the payload or headers. Business keys (orderId + operation) work too and are friendlier for manual debugging - the best systems carry both.

**The processed-message store.** A table/collection with a unique index on the dedup key:

    processed_messages(dedup_key UNIQUE, processed_at, consumer_name)

The consumer's flow inside **one database transaction**:

1. Try to insert the dedup key.
2. If the insert violates the unique constraint, this is a duplicate: ack and stop.
3. Otherwise apply the business side effects in the same transaction.
4. Commit, then ack the message.

Crash between commit and ack -> redelivery -> insert hits the unique constraint -> duplicate recognized, side effects not repeated. This is your effectively-once guarantee for the part of the system the transaction covers.

**Naturally idempotent operations.** \`SET status = 'cancelled'\` (absolute write), upserts keyed by business id, \`DELETE\` of a row that may not exist, idempotency-key APIs like Stripe's. Prefer designing handlers this way; add the dedup table when natural idempotency is impossible (incrementing balances, appending log lines, calling a third party without keys).

**Ordering caveats.** A queue gives per-connection FIFO, but redelivery reorders: a message nacked and requeued can be processed after its successor. Never build correctness on arrival order. If order matters, either partition by aggregate id (Kafka partitions, single-queue-per-key) or make each message self-sufficient (include the version/sequence in the payload and apply conditionally: \`WHERE version < incoming.version\`).
    `,
    howItWorks: `
The unique index is the whole trick - the database already gives you an atomic compare-and-set for free. Instead of a check-then-insert race (two workers both see "not processed"), a single \`INSERT\` either wins or loses atomically. In Node.js with Prisma you catch error code P2002; with pg you catch SQLSTATE 23505. For side effects outside the database (emails, HTTP calls), the transaction trick does not extend automatically - either move those effects behind a transactional outbox (the effect is driven by a row you committed) or make the external call itself idempotent with a request key. The processed-message table should also record the consumer name, so two different consumers can each process the same event exactly once without colliding.
    `,
    codeExamples: [
      {
        title: "Insert-then-apply in one transaction",
        language: "ts",
        code: `// Prisma-style; adapt the unique-violation check to your driver
async function handlePaymentCaptured(tx: Tx, msg: Message) {
  const dedupKey = msg.headers["x-event-id"] as string;
  try {
    await tx.processedMessages.create({ data: { dedupKey, consumerName: "billing" } });
  } catch (err) {
    if (isUniqueViolation(err)) return { duplicate: true }; // ack and stop
    throw err;
  }
  await tx.accounts.update({
    where: { id: msg.payload.accountId },
    data: { balanceCents: { decrement: msg.payload.amountCents } },
  });
  return { duplicate: false };
}

// Worker
await queue.process(async (msg) => {
  await db.$transaction((tx) => handlePaymentCaptured(tx, msg));
  // commit done -> ack (library or manual)
});`,
        description:
          "The unique constraint converts a race into deterministic duplicate detection. Business effects and the dedup record commit together, so a crash cannot half-apply.",
      },
    ],
    commonMistakes: [
      "Check-then-insert without a unique constraint - two parallel workers both pass the check.",
      "Deduplicating only the database write on the consumer side, while still sending a second email.",
      "Assuming the queue preserves global order across redeliveries - it does not.",
      "Storing dedup keys forever without TTL/compaction - the table grows unbounded.",
    ],
    bestPractices: [
      "Producer generates a unique eventId; document it as part of the event contract.",
      "Include consumer_name in the dedup key so independent consumers do not block each other.",
      "Expire old dedup rows on a schedule aligned with your maximum redelivery horizon.",
      "When ordering matters, carry a version number and apply conditional writes.",
    ],
    realWorldUseCases: [
      "Payment webhooks: Stripe-style event ids are stored uniquely so a redelivered webhook cannot double-charge.",
      "Inventory reservations: reservation id is the dedup key; duplicates return the original reservation.",
      "Chat read-receipts: naturally idempotent (set lastReadSequence to max) - no dedup table needed.",
    ],
    resources: [
      docs("BullMQ Documentation", OFFICIAL.bullmqDocs, "Job id semantics and how they support deduplication at enqueue time."),
      docs("PostgreSQL Documentation", OFFICIAL.postgresDocs, "ON CONFLICT / unique constraints as the atomic dedup primitive."),
      ytSearch("idempotent consumer pattern explained", "Walkthroughs of dedup stores and effectively-once processing.", "en", "10-18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-dedup-design",
        title: "Design the dedup",
        prompt:
          "A consumer receives 'shipment.created.v1' events and (1) writes a row to shipments, (2) calls a third-party SMS API. Design the idempotency strategy: what is the dedup key, where does the processed-message store live, how do you make the SMS call safe on redelivery, and what happens if the process crashes after the SMS but before the ack?",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "The third-party call sits outside your database transaction - you need an outbox or a request-id the provider dedupes.",
          "Crash-after-SMS means redelivery will re-enter the handler; the dedup row (or SMS receipt) must already record success.",
        ],
        solution: `Dedup key: eventId (shipment.created.v1 UUID) + consumer name 'sms-notifier'.

Flow:
1. In ONE DB transaction: insert (dedupKey) into processed_messages AND
   insert an sms_outbox row (status=pending, requestId=dedupKey).
   Commit.
2. Relay picks pending sms_outbox rows, calls SMS API with
   Idempotency-Key = requestId.
3. Mark row sent; the consumer acks the original message after the
   transaction commits (ack timing is safe because the outbox row
   is durable).

Crash after SMS, before ack:
- Redelivery hits the unique constraint on processed_messages ->
  duplicate -> handler becomes a no-op -> no second SMS.
- If the SMS call itself timed out mid-flight, the relay retries
  with the SAME requestId, so the provider can deduplicate.`,
        solutionLanguage: "markdown",
      },
    ],
    projectIds: ["p3-chat-app", "p3-job-processing"],
  },
  {
    ...shared,
    id: "p3m5-distributed-transactions",
    slug: "distributed-transactions",
    title: "Distributed Transactions and Sagas",
    description:
      "Why two-phase commit hurts in real systems, saga choreography vs orchestration, designing compensations, and what to do when a step fails in the middle.",
    order: 11,
    estimatedMinutes: 23,
    tags: ["sagas", "2pc", "consistency", "microservices"],
    prerequisites: ["p3m5-event-driven-architecture", "p2m4-transactions-acid"],
    relatedTopics: ["p3m5-outbox-pattern", "p3m5-eventual-consistency", "p3m5-microservices-fundamentals"],
    learningObjectives: [
      "Explain why two-phase commit (2PC) is a bottleneck and a single point of failure",
      "Compare saga choreography and orchestration and choose between them",
      "Design compensating actions for each forward step",
      "Handle the 'failed in the middle' case without leaving resources dangling",
    ],
    simpleExplanation:
      "Once each service owns its database, one ACID transaction cannot span them. Two-phase commit tries to restore atomicity but locks resources across a coordinator that can itself crash - so distributed systems use sagas instead: a sequence of local transactions, each with a compensating action that undoes it. If step three fails, the saga runs the compensations for steps one and two, leaving the system in a consistent, if 'wound', state.",
    detailedContent: `
**Why 2PC is painful.** Two-phase commit asks every participant to vote 'ready', then commits or aborts all. Problems: the coordinator is a single point of failure; participants hold locks (or prepare state) until the coordinator decides, so a crash mid-protocol stalls or times out everything; latency multiplies by the number of participants. Across datacenters it is worse. This is why you almost never implement 2PC yourself between microservices - you accept that the *unit of atomicity shrinks to one service* and design around it.

**Sagas.** A saga is a long-lived transaction made of local ACID steps. Each step publishes an event or returns a result that triggers the next. Compensating actions (\`refundPayment\`, \`releaseStock\`) run in reverse order if a later step fails. At the saga level the system is never half-committed - it either completed or was compensated.

**Choreography vs orchestration.**

- **Choreography**: each service reacts to events; no central coordinator. Low coupling, but the flow is implicit - hard to see "where is this order stuck?".
- **Orchestration**: one coordinator service issues commands step by step and invokes compensations on failure. The flow is explicit and testable, at the cost of a central piece that must itself be highly available.

Most teams start with orchestration for money-moving flows (clarity beats elegance) and choreography for loose, fan-out-style processes.

**Compensations are not rollbacks.** \`refundPayment\` creates a new financial fact; it does not erase the charge. Design compensations as business actions with their own auditing, retries and idempotency.

**Failure in the middle.** The saga must be *resumable*: persist saga state (which steps completed, pending compensations) and drive retries from that state - typically with the same queue infrastructure. Timeouts without an explicit decision ('still running' vs 'failed') are how sagas hang forever.
    `,
    howItWorks: `
An orchestrator saga for "place order" persists a saga instance row, then: 1) command inventory.reserve; 2) on ack, command payment.charge; 3) on ack, command order.confirm. If payment.charge fails with a terminal error, the orchestrator issues inventory.release and marks the saga compensated, recording each transition so a process restart resumes exactly where it left off. In choreography the same flow emerges from events: OrderPlaced -> InventoryReserved -> PaymentCharged; PaymentFailed triggers a handler which emits StockReleaseRequested. Both rely on idempotent commands and durable event delivery (outbox) so no step is lost between services.
    `,
    codeExamples: [
      {
        title: "Orchestrated saga with compensations",
        language: "ts",
        code: `type Step = "reserveInventory" | "chargePayment" | "confirmOrder";

const compensations: Record<Exclude<Step, "confirmOrder">, (o: Order) => Promise<void>> = {
  reserveInventory: (o) => inventory.release(o.id),
  chargePayment: (o) => payments.refund(o.id),
};

async function placeOrderSaga(order: Order) {
  const completed: Step[] = [];
  try {
    await inventory.reserve(order);  completed.push("reserveInventory");
    await payments.charge(order);    completed.push("chargePayment");
    await orders.confirm(order);     completed.push("confirmOrder");
  } catch (err) {
    // Compensate in reverse order; each compensation is itself idempotent
    for (const step of completed.reverse()) {
      if (step === "confirmOrder") await orders.cancel(order.id);
      else await compensations[step](order);
    }
    await sagas.markCompensated(order.id, String(err));
    throw err;
  }
}`,
        description:
          "The compensation list is built as steps succeed, so a failure at any point unwinds exactly what happened - never more, never less. Persist completed steps per saga if the process may crash mid-flow.",
      },
    ],
    commonMistakes: [
      "Designing a saga with no compensations for early steps - inventory stays reserved forever.",
      "Treating compensation as undoing history: refunds are new transactions and can themselves fail.",
      "Forgetting to persist saga progress - a restart re-runs step 1 and double-reserves.",
      "Using choreography for payment flows and losing the ability to answer 'why was this order not charged?'.",
    ],
    bestPractices: [
      "Prefer orchestration for linear, money-critical flows; it is easier to reason about at 3 a.m.",
      "Give every command and compensation an idempotency key derived from the saga id + step.",
      "Store saga state transitions in a queryable table; build an operator view for stuck sagas.",
      "Time out every step and force an explicit decision (retry vs compensate) instead of waiting forever.",
    ],
    realWorldUseCases: [
      "Travel booking: hold flight + hold hotel + charge card, with automatic releases on any failure.",
      "E-commerce checkout saga: reserve stock, authorize payment, capture on shipment, refund on cancellation.",
      "Provisioning flows in SaaS: create tenant resources in order, tear them down in reverse if a step fails.",
    ],
    resources: [
      docs("Microservices.io - Saga pattern", "https://microservices.io/patterns/data/saga.html", "Reference description of choreography and orchestration sagas."),
      docs("PostgreSQL Documentation", OFFICIAL.postgresDocs, "Local ACID transactions - the building blocks of each saga step."),
      ytSearch("saga pattern microservices explained", "Talks walking through compensations and orchestrators.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-saga-design",
        title: "Design the compensations",
        prompt:
          "Draw a 4-step orchestrated saga for 'book dentist appointment': check slot, hold slot, charge deposit, send confirmation. For each step write its compensation, note whether it can fail, and say what the orchestrator should do if a compensation itself fails.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "A failed compensation is a new incident, not a reason to give up - it must be retried and alerted.",
          "Holding a slot usually expires via TTL, which is a safety net, not the primary compensation.",
        ],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m5-outbox-pattern",
    slug: "transactional-outbox",
    title: "The Transactional Outbox Pattern",
    description:
      "Writing the entity and the outbox row atomically, relay pollers vs CDC, at-least-once publishing, and why 'publish after commit' loses events.",
    order: 12,
    estimatedMinutes: 20,
    tags: ["outbox", "reliability", "events", "cdc"],
    prerequisites: ["p3m5-distributed-transactions", "p2m3-transactions"],
    relatedTopics: ["p3m5-idempotent-consumers", "p3m5-event-driven-architecture", "p3m5-retries-backoff"],
    learningObjectives: [
      "Explain the dual-write problem: why publishing to a broker after a DB commit can lose events",
      "Implement a transactional outbox: entity write plus outbox row in one transaction",
      "Choose between a polling relay and change-data-capture for publishing",
      "Accept and reason about the resulting at-least-once publish guarantee",
    ],
    simpleExplanation:
      "If your service writes to the database and then publishes an event to a broker, there is a window where one succeeds and the other does not - the dual-write problem. The transactional outbox solves it: write the business row and an 'event to publish' row in the *same* database transaction, then let a separate relay process publish pending outbox rows to the broker. Either both rows exist or neither does, and the relay guarantees at-least-once delivery.",
    detailedContent: `
**The dual-write problem.** \`db.commit()\` then \`broker.publish()\`: if the process crashes between the two, the database has the order but nobody will ever hear about it. Retry the whole request and you may double-charge. Trust the broker to join your DB transaction and you discover it cannot - brokers and databases do not share a commit protocol in practice (this is the 2PC trap again).

**The outbox.** Inside one local transaction:

1. Insert/update the business entity (the order).
2. Insert a row into \`outbox_events\`: event type, aggregate id, payload, created_at, published_at = null.
3. Commit.

Now the event exists if and only if the business change exists. A **relay** periodically selects unpublished rows, publishes them to the broker, and marks them published.

**Relay strategies.**

- **Poller**: \`SELECT ... WHERE published_at IS NULL ORDER BY created_at LIMIT n\` every 100-500 ms. Simple, works everywhere, adds small latency.
- **LISTEN/NOTIFY or queue wakeup**: commit triggers a notify, relay wakes instantly. Low latency, Postgres-friendly.
- **CDC (Debezium)**: tail the write-ahead log. No polling, captures every change, but a much bigger operational footprint.

**At-least-once publish.** The relay can crash after publishing but before marking published - the event goes out twice. That is fine: it forces consumers to be idempotent, which you already know how to build. The guarantee to advertise is: *the event will be published at least once, eventually, unless the outbox row is deleted*.

**Ordering.** A single relay ordering by a monotonic id preserves per-aggregate order for a single worker; scale out the relay carefully - partition by aggregate id if order matters.
    `,
    howItWorks: `
The outbox table is just another table - no new infrastructure. The relay is a tiny worker: fetch batch, publish each, mark published (batch update). Because publishing uses the same broker client you already operate, the pattern slots into existing Node.js services. Teams sometimes 'simplify' by publishing from the request handler with \`await publish()\` after commit; the outbox exists precisely for the day a deploy restarts that process between commit and publish. For high event volume, CDC reads the write-ahead log and turns every insert into a message with near-zero added latency - at the cost of running a connector platform. Start with a poller; graduate only when the metrics demand it.
    `,
    codeExamples: [
      {
        title: "Atomic entity + outbox write, then a simple relay",
        language: "ts",
        code: `// 1) One transaction: business row AND outbox row
await db.$transaction(async (tx) => {
  const order = await tx.orders.create({ data: orderData });
  await tx.outboxEvents.create({
    data: {
      eventType: "order.created.v1",
      aggregateId: order.id,
      payload: JSON.stringify({ orderId: order.id, totalCents: order.totalCents }),
    },
  });
});

// 2) Relay worker: publish at-least-once
async function relayBatch(batch = 50) {
  const rows = await db.outboxEvents.findMany({
    where: { publishedAt: null },
    orderBy: { id: "asc" },
    take: batch,
  });
  for (const row of rows) {
    await bus.publish(row.eventType, row.payload); // crash here => duplicate publish (ok)
    await db.outboxEvents.update({
      where: { id: row.id },
      data: { publishedAt: new Date() },
    });
  }
}`,
        description:
          "Entity and event commit together, so a crash can never leave them inconsistent. The relay's crash window (publish then fail to mark) yields duplicate publishes, which idempotent consumers absorb.",
      },
    ],
    commonMistakes: [
      "Publishing after commit in the request handler and calling it 'the outbox pattern' - the crash window remains.",
      "Letting the outbox table grow forever: archive or purge published rows after a retention window.",
      "Running multiple relay instances without ordering guarantees, reordering events for the same aggregate.",
      "Using the outbox for high-frequency telemetry where a small loss window is acceptable - that adds cost for no benefit.",
    ],
    bestPractices: [
      "Start with a polling relay; add LISTEN/NOTIFY or CDC only when latency metrics require it.",
      "Keep the outbox payload immutable and self-describing (versioned schema, aggregate id, occurredAt).",
      "Metric: oldest unpublished row age - alert before users notice missing events.",
      "Idempotent consumers remain mandatory: the relay's guarantee is at-least-once, not exactly-once.",
    ],
    realWorldUseCases: [
      "Order service writes orders + outbox in one Postgres transaction; a relay publishes to RabbitMQ for five downstream teams.",
      "Banking ledgers emit transaction-posted events from the same transaction that mutates balances - auditors rely on the pairing.",
      "Multi-tenant SaaS uses the outbox so tenant-scoped events are never lost during failovers.",
    ],
    resources: [
      docs("Microservices.io - Transactional Outbox", "https://microservices.io/patterns/data/transactional-outbox.html", "Canonical pattern description with relay and CDC variants."),
      docs("PostgreSQL Documentation", OFFICIAL.postgresDocs, "Transactions, LISTEN/NOTIFY and the write-ahead log that CDC tails."),
      ytSearch("transactional outbox pattern explained", "Walkthroughs of dual-write problems and relays.", "en", "10-18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-outbox-failure",
        title: "Find the crash windows",
        prompt:
          "A naive implementation does: begin txn -> insert order -> commit -> publish event -> ack. List every crash point and what state results (lost event, duplicate event, inconsistent). Then rewrite it with an outbox and list the remaining failure modes.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Crash after commit but before publish loses the event forever.",
          "The outbox version still has a publish-then-crash-before-mark window.",
        ],
        solution: `Naive:
1. Crash BEFORE commit: nothing happened anywhere - safe.
2. Crash AFTER commit, BEFORE publish: order exists, event LOST.
3. Publish succeeds, crash BEFORE ack: client may retry -> possible
   DUPLICATE order (if the create is not idempotent) plus one event.

Outbox version (txn writes order + outbox row; relay publishes):
1. Crash before commit: safe (nothing written).
2. Crash after commit, before relay runs: event waits in outbox -
   eventually published. No loss.
3. Relay crashes after publish, before marking published: event
   published TWICE - requires idempotent consumers (dedup key).

Remaining risks shrink from 'lost events' (data loss) to
'duplicate events' (handled by design).`,
        solutionLanguage: "markdown",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m5-eventual-consistency",
    slug: "eventual-consistency",
    title: "Eventual Consistency",
    description:
      "What actually converges, read-your-writes concerns, messaging the delay to users, and when strong consistency is non-negotiable.",
    order: 13,
    estimatedMinutes: 18,
    tags: ["consistency", "replication", "ux", "architecture"],
    prerequisites: ["p3m5-event-driven-architecture", "p3m4-caching-fundamentals"],
    relatedTopics: ["p3m5-outbox-pattern", "p3m5-distributed-transactions", "p3m5-service-communication"],
    learningObjectives: [
      "Define eventual consistency and identify which projections actually converge",
      "Explain the read-your-writes problem and practical mitigations",
      "Design user-facing copy and UI states for delayed side effects",
      "Recognize invariants that demand strong consistency and refuse to weaken them",
    ],
    simpleExplanation:
      "In a distributed system, after you write something, other copies (read models, caches, other services) learn about it a little later. Eventual consistency means: with no new updates, all copies will eventually agree - but for a brief window they will not. Users experience this as 'I just saved, why is it not there?'. Good designs either hide the lag, wait for it, or clearly message it - and they never apply eventual consistency to invariants like money balances.",
    detailedContent: `
**What converges.** Projections built by consuming events: search indexes, analytics rollups, notification feeds, materialized views. Each is a function of the event log; once the log is applied, the view is correct. The lag is bounded by consumer throughput - which is why consumer lag is a first-class SLO.

**Read-your-writes.** A user saves a profile, the API writes to the primary and returns 200, then the user refreshes and reads from a replica that has not caught up. They see stale data and assume the save failed. Mitigations:

1. **Session stickiness** - route the user's next reads to the primary or the same replica for a short window.
2. **Read-after-write token** - return the write timestamp/etag; the client sends it back and the reader waits (or falls back to the primary) until the replica has seen it.
3. **Serve-your-own-write** - for key-value style updates, return the value you just wrote from memory/cache instead of re-reading.
4. **UI honesty** - show the optimistic value you submitted and reconcile in the background.

**User-facing messaging.** When side effects lag (receipt email, report ready), say so: "We are processing - you will get an email shortly." A spinner that resolves instantly into wrong data is worse than an explicit pending state. Status endpoints (\`GET /jobs/:id\`) turn invisible lag into observable progress.

**When strong consistency is non-negotiable.**

- Money: balances, quotas, inventory counts that must never oversell - use conditional writes (\`WHERE stock > 0\`), row locks, or a single owner per aggregate.
- Security: permission revocations must take effect on the next request, not 'eventually'.
- Idempotency keys and unique constraints - the database is already your strong-consistency engine; use it for uniqueness even in a distributed design.

Rule of thumb: strong consistency for *invariants*, eventual consistency for *projections*.
    `,
    howItWorks: `
Under the hood, eventual consistency is queues plus time. A write hits the source of truth (the primary database). Events flow through a broker or outbox relay to consumers that update derived stores. Each hop adds latency: outbox poll interval + queue delivery + consumer processing + maybe a cache TTL. Measuring each hop separately is how you keep 'eventually' bounded to milliseconds rather than minutes. Systems like Kafka make the lag measurable (consumer lag in offsets); Redis Streams expose the pending-entries list. When an incident hits, these numbers tell you whether you are seconds from convergence or hours from it - which is the question every stakeholder will ask.
    `,
    codeExamples: [
      {
        title: "Read-your-writes with a token",
        language: "ts",
        code: `// Write: return the version the client should wait for
app.patch("/profiles/:id", async (req, res) => {
  const updated = await profiles.update(req.params.id, req.body);
  res.json({ profile: updated, syncedAt: updated.updatedAt.toISOString() });
});

// Read: honor the client's token before answering from the read model
app.get("/profiles/:id", async (req, res) => {
  const syncedAt = Number(req.headers["x-client-synced-at"] ?? 0);
  let view = await readStore.getProfile(req.params.id);
  const deadline = Date.now() + 1000;
  while ((!view || view.updatedAt.getTime() < syncedAt) && Date.now() < deadline) {
    await sleep(50); // poll the replica briefly
    view = await readStore.getProfile(req.params.id);
  }
  if (!view || view.updatedAt.getTime() < syncedAt) {
    return res.status(202).json({ status: "propagating" });
  }
  res.json(view);
});`,
        description:
          "The client echoes the syncedAt token from the write response. The reader waits (bounded) for the replica to catch up instead of showing stale data - and degrades to an explicit 'propagating' state rather than lying.",
      },
    ],
    commonMistakes: [
      "Applying eventual consistency to money balances or seat counts - oversells follow.",
      "No bound on lag: a stuck consumer makes 'eventual' mean 'maybe never'.",
      "Showing the user the old value right after a save with no pending indicator.",
      "Silently serving stale reads from a cache with a long TTL after a write.",
    ],
    bestPractices: [
      "Label every derived store with its lag SLO (e.g. p99 < 2 s) and alert on it.",
      "Use conditional writes for uniqueness/oversell protection even when reads are eventually consistent.",
      "Prefer version stamps over wall-clock timestamps when ordering matters.",
      "Write the user-facing copy for delayed effects during design, not during the incident.",
    ],
    realWorldUseCases: [
      "Social feeds: your own post appears immediately (read-your-writes), others' posts may lag a few seconds.",
      "Booking systems: the seat count that prevents double-booking is strongly consistent; the 'popular seats' badge is eventually consistent.",
      "Analytics dashboards show 'data as of 2 minutes ago' labels so lag is expected, not surprising.",
    ],
    resources: [
      docs("Amazon Builders Library - consistency models", "https://aws.amazon.com/builders-library/", "Production writing on balancing consistency, latency and availability."),
      docs("Redis Documentation", OFFICIAL.redisDocs, "Replication lag and read-replica behavior in Redis-backed read models."),
      ytSearch("eventual consistency explained", "Visual explanations of replication lag and read-your-writes.", "en", "10-18 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-consistency-map",
        title: "Map your invariants",
        prompt:
          "For a booking platform, list 8 pieces of data (seat availability, waitlist position, invoice PDF, promo-code redemption limit, profile bio, friend list, chat message, analytics count). For each, classify: must-be-strong or can-be-eventual, and justify in one sentence. Then pick one eventual item and describe the UI state you would show during the lag window.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Anything that prevents a business-rule violation (oversell, double redemption) is strong.",
          "Profile bio can show a 'saving...' state and reconcile when the read model catches up.",
        ],
      },
    ],
    projectIds: ["p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m5-failure-handling",
    slug: "failure-handling",
    title: "Failure Handling in Distributed Systems",
    description:
      "Timeouts at every layer, bulkheads, graceful degradation, a light introduction to chaos experiments, and the partial-failure mentality.",
    order: 14,
    estimatedMinutes: 22,
    tags: ["resilience", "timeouts", "bulkheads", "chaos"],
    prerequisites: ["p3m5-retries-backoff", "p3m4-graceful-shutdown"],
    relatedTopics: ["p3m5-service-communication", "p3m5-dead-letter-queues", "p3m5-distributed-tracing"],
    learningObjectives: [
      "Apply timeouts at every layer and design an explicit timeout budget",
      "Use bulkheads to isolate failures to one pool of resources",
      "Design graceful degradation paths for critical user journeys",
      "Run a small, safe chaos experiment and reason about partial failure",
    ],
    simpleExplanation:
      "In a distributed system, partial failure is the norm: half the fleet is healthy, one dependency is timing out, and the queue is backing up - all at once. Good failure handling means every call has a timeout, every shared resource is pooled so one bad client cannot exhaust it (bulkheads), and every critical flow has a degraded mode that still delivers core value. You rehearse this with small chaos experiments instead of waiting for Saturday night.",
    detailedContent: `
**Timeouts at every layer.** Database pool acquisition, HTTP client call, queue consume loop, load balancer health check - each needs its own timeout, and each must be *smaller* than its parent's budget. A 30 s default timeout on an inner call inside a 5 s outer request is how thread/socket pools disappear.

**Bulkheads.** Named after ship compartments: if one floods, the ship still floats. In Node.js, separate connection pools or concurrency limits per dependency (payments vs search vs notifications). One flaky dependency then consumes only its own slice of sockets and event-loop time.

**Graceful degradation.** For each user journey, define the degraded answer:

- Recommendations service down -> show bestsellers (static list).
- Payment gateway down -> let users fill the cart, block only at submit, show a clear message.
- Search index lagging -> fall back to a simpler query on the primary database.

The rule: degrade the *optional* parts, protect the *core* path.

**Chaos experiments (light).** You do not need a chaos platform. Start with: kill one worker process during a deploy, add 500 ms latency to one dependency in a staging environment, fill a queue and watch alerts. The point is not cruelty - it is verifying that timeouts, bulkheads and alerts behave as designed *before* production writes the test for you.

**Partial-failure mentality.** Every multi-step operation asks: what if step 2 of 3 fails? What if the response never arrives? What if half the replicas have the new code? Design for those questions explicitly - they are not edge cases, they are Tuesday.
    `,
    howItWorks: `
A resilient Node.js handler wires these together: an outer timeout covers the whole request; inside, each outbound call has its own smaller timeout and retry policy; each dependency uses a dedicated pool (bulkhead); failures trip a circuit breaker that fails fast; the fallback path still returns a useful response. Observability closes the loop: structured logs with a correlation id, metrics per dependency (latency, error rate, pool saturation), and traces that show exactly which hop failed. When an incident starts, these signals tell you within minutes whether to scale out, shed load, or enable a degradation flag - instead of restarting everything and hoping.
    `,
    codeExamples: [
      {
        title: "Bulkhead pool plus timeout on a dependency call",
        language: "ts",
        code: `// Tiny dedicated pool: payments can never starve the rest of the app
const paymentSlots = new Semaphore(5);

async function callPayment(req: PaymentRequest) {
  return paymentSlots.run(async () => {
    const res = await fetch(PAYMENT_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": req.id },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(1500), // < outer 2s budget
    });
    if (!res.ok) throw new HttpError(res.status);
    return res.json();
  });
}

// Degradation: if payments fail rate exceeds the breaker threshold,
// checkout switches to 'queue and reconcile' instead of erroring every user.
try {
  const auth = await callPayment(req);
  res.json({ status: "authorized", auth });
} catch (err) {
  if (breaker.isOpen() || err instanceof TimeoutError) {
    await deferredPayments.enqueue(req); // user sees 'processing', not a failure
    res.status(202).json({ status: "processing" });
  } else {
    throw err;
  }
}`,
        description:
          "The semaphore is the bulkhead; AbortSignal.timeout is the inner budget slice; the catch block is the degradation path that keeps the core checkout journey alive.",
      },
    ],
    commonMistakes: [
      "Relying on a single global default timeout for every outbound call.",
      "One shared HTTP agent/pool for all dependencies - the first failure takes everything down.",
      "Treating 'the page rendered 80% correctly' as success without a user-visible degraded-mode label.",
      "Running chaos experiments in production on day one, or never testing failure at all.",
    ],
    bestPractices: [
      "Write the timeout budget in the design doc: outer request, each hop, each retry window.",
      "Limit concurrency per dependency; expose pool saturation as a metric.",
      "Feature-flag degradation paths so you can flip them without a deploy.",
      "Rehearse one failure mode per sprint in staging; keep a checklist of verified behaviors.",
    ],
    realWorldUseCases: [
      "Netflix-style bulkheads isolate encoding pipelines so one broken encoder cannot stall the whole stream.",
      "E-commerce checkout degrades reviews and recommendations under load to protect payment latency.",
      "On-call teams run game days: pull the plug on one broker node and verify failover timing.",
    ],
    resources: [
      docs("Node.js API - AbortSignal.timeout", "https://nodejs.org/api/globals.html#abortsignaltimeouttimeoutsignal", "Native timeout support for fetch and other abortable operations."),
      docs("Chaos Mesh documentation", "https://chaos-mesh.org/docs/", "Open-source chaos engineering tool for controlled failure experiments."),
      ytSearch("resilience patterns timeouts bulkheads circuit breakers", "Conference talks on bulkheads, budgets and graceful degradation.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-chaos-drill",
        title: "Design a drill",
        prompt:
          "Pick your checkout flow (or any 3-step flow). Write a one-page chaos drill: which failure you will inject (e.g. add 3 s latency to payments in staging), the expected behavior (timeout fires, breaker opens, degradation path activates), the metrics you will watch, and the abort criteria for the drill.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Name the exact metric thresholds that prove the drill worked (e.g. p99 checkout < 2.5 s even with payments degraded).",
          "Abort criteria: if error rate on unrelated endpoints rises, stop - the isolation failed.",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m5-distributed-tracing",
    slug: "distributed-tracing",
    title: "Distributed Tracing",
    description:
      "Trace and span ids, context propagation via headers, OpenTelemetry concepts, sampling strategies, and using traces to find slow hops.",
    order: 15,
    estimatedMinutes: 22,
    tags: ["tracing", "opentelemetry", "observability", "performance"],
    prerequisites: ["p3m5-failure-handling", "p3m5-service-communication"],
    relatedTopics: ["p3m5-service-communication", "p3m5-event-driven-architecture", "p3m5-failure-handling"],
    learningObjectives: [
      "Explain the trace/span model and how ids propagate across services",
      "Set up OpenTelemetry tracing in a Node.js service",
      "Propagate trace context over HTTP headers and in event metadata",
      "Use sampling wisely and read a trace to identify the slow hop",
    ],
    simpleExplanation:
      "One user action might touch five services and a queue. Logs from each service exist, but stitching them together by hand is impossible. Distributed tracing assigns a single trace id to the whole request and records each hop as a span with timings; tools like Jaeger or your APM render the waterfall so you can see instantly which hop is slow. OpenTelemetry is the vendor-neutral standard for producing this data.",
    detailedContent: `
**The model.** A **trace** is one end-to-end request, identified by a 128-bit **trace id**. A **span** is one unit of work (an HTTP call, a DB query, a queue consume) with a **span id**, a parent span id, a start/end timestamp and optional attributes. A trace is a tree of spans; the waterfall view is that tree laid out on a timeline.

**Propagation.** The initiating service creates the root span and puts the ids in a header. HTTP uses \`traceparent\` (W3C standard: version-traceid-spanid-flags). Message-based flows carry the same fields in event headers. If any hop drops the header, the trace splits into disconnected pieces - the most common tracing bug.

**OpenTelemetry concepts.** Three signals: **traces** (spans), **metrics**, **logs** - all sharing resource attributes (service.name, environment). You instrument with the OTel SDK or auto-instrumentation packages (HTTP, pg, BullMQ); a **span processor** exports spans to a backend (Jaeger, Tempo, Datadog, Honeycomb). Keep application code vendor-neutral: code against the OTel API, swap the exporter.

**Sampling.** Tracing every request at high volume is expensive. **Head sampling** decides at the root (keep 1% of traces, or always keep slow/error traces via tail sampling). Start with a low rate plus 100% error capture; increase when investigating a specific latency issue.

**Finding slow hops.** Open the trace, sort spans by duration, look for the long leaf. Common culprits: an unindexed query, a missing connection-pool slot, an unbounded retry, or a synchronous call that should have been async. The trace tells you *which* hop; logs and metrics tell you *why*.
    `,
    howItWorks: `
When a request enters the service, the instrumentation extracts \`traceparent\`, starts a SERVER span, and every outbound call becomes a CLIENT child span with the ids injected into its headers. Async consumers start a new span linked to the producer's context via the event headers (and optionally as a span link rather than child, since time has passed). Spans are queued and batch-exported; a tail can be flushed on shutdown (tie this to the graceful-shutdown work from earlier modules). In the backend, spans with the same trace id assemble into a waterfall: browser -> API -> orders service -> Postgres (800 ms) -> payments (120 ms). The Postgres span dominates - that is your next optimization, discovered in minutes instead of days of log grepping.
    `,
    codeExamples: [
      {
        title: "OpenTelemetry setup with W3C propagation",
        language: "ts",
        code: `import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { trace, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const provider = new NodeTracerProvider({
  resource: new Resource({ "service.name": "orders-api" }),
});
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: "http://localhost:4318/v1/traces" }),
  ),
);
provider.register({ propagator: new W3CTraceContextPropagator() });

const tracer = trace.getTracer("orders-api");

app.post("/orders", async (req, res) => {
  const span = tracer.startSpan("place-order", { kind: SpanKind.SERVER });
  try {
    const order = await orders.place(req.body); // child spans via auto-instrumentation
    span.setStatus({ code: SpanStatusCode.OK });
    res.status(201).json(order);
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();
  }
});`,
        description:
          "The W3C propagator reads and writes the traceparent header automatically for instrumented HTTP clients/servers, stitching this service into whatever upstream trace already exists.",
      },
    ],
    commonMistakes: [
      "Dropping trace context when forwarding to a queue - async consumers appear as disconnected traces.",
      "Sampling 100% of traffic in production without cost analysis - the exporter bill becomes the incident.",
      "Creating spans by hand everywhere instead of using auto-instrumentation - noisy, incomplete, abandoned.",
      "Ignoring broken traces: if 30% of traces show a missing hop, fix propagation before optimizing latency.",
    ],
    bestPractices: [
      "Propagate traceparent on every outbound HTTP call and in every event header - automate it in your HTTP client wrapper.",
      "Always sample 100% of errors/5xx even when head-sampling normal traffic at 1%.",
      "Add business attributes (order.id, tenant) as span attributes for powerful filtered queries.",
      "Flush spans on shutdown so the last request before a deploy is not lost.",
    ],
    realWorldUseCases: [
      "Black-Friday triage: traces reveal the checkout slowdown is one unindexed query, not 'the queue'.",
      "Support tooling: paste a user's trace id and see every service they touched in the last action.",
      "Capacity planning: span duration histograms per dependency become the input to timeout budgets.",
    ],
    resources: [
      docs("OpenTelemetry Documentation", "https://opentelemetry.io/docs/", "Official docs: concepts, traces, context propagation, sampling."),
      docs("OpenTelemetry JS", "https://open-telemetry.github.io/opentelemetry-js/", "Node.js SDK, auto-instrumentation and exporters."),
      ytSearch("distributed tracing opentelemetry explained", "Walkthroughs of traces, spans and waterfall analysis.", "en", "12-20 min"),
    ],
    exercises: [
      {
        id: "ex-p3m5-trace-anatomy",
        title: "Read a waterfall",
        prompt:
          "Given this trace of a checkout: API total 2400ms -> inventory 80ms -> payments 1900ms -> notify-queue-publish 15ms -> db-write 40ms. Identify the slow hop, propose two hypotheses for why payments is slow, and describe the next two measurements you would take to confirm.",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "The waterfall gives you the 'where', not the 'why' - you need metrics/logs from the payments service.",
          "Hypotheses: upstream provider latency, connection-pool wait, retry loop, GC pressure.",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-capstone"],
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m5",
  moduleId: "p3-m5",
  title: "Messaging & Distributed Systems - Quiz",
  description:
    "Background processing, delivery semantics, RabbitMQ routing, retries, DLQs, idempotent consumers, sagas, the outbox pattern and distributed tracing.",
  questions: [
    {
      id: "q-p3m5-1",
      type: "multiple-choice",
      prompt:
        "A signup handler validates input, creates the user row, calls the email provider's SMTP API (avg 800 ms, sometimes 5 s), then returns 201. What is the best change?",
      options: [
        "Wrap the SMTP call in a try/catch and still return 202 after it finishes.",
        "Enqueue a welcome-email job and return 201 immediately.",
        "Increase the HTTP server timeout to 30 seconds.",
        "Send the email before writing the user row so failures roll back.",
      ],
      correctIndex: 1,
      optionExplanations: [
        "try/catch improves error handling but the user still waits for the slow path; 202 would also come after the SMTP call.",
        "Correct: email is the textbook background-job candidate - the user does not need it in the response, and a queue gives it retries and monitoring.",
        "A longer timeout makes the worst case worse for every user; it trades UX for simplicity.",
        "SMTP has no transactional rollback with your database; ordering the calls differently does not make them atomic.",
      ],
      explanation:
        "Work the user does not need in the response - especially slow or failure-prone work like email - belongs on a queue. The API enqueues durably and responds; a worker owns delivery, retries and monitoring.",
    },
    {
      id: "q-p3m5-2",
      type: "multiple-choice",
      prompt: "A queue is configured for at-least-once delivery. Which statement is true?",
      options: [
        "Consumers can apply side effects blindly because the broker prevents duplicates.",
        "Duplicate deliveries are possible, so consumers must be idempotent to get effectively-once behavior.",
        "You must enable exactly-once mode in the broker configuration.",
        "At-least-once means messages may be silently lost if a worker crashes.",
      ],
      correctIndex: 1,
      optionExplanations: [
        "The broker does not deduplicate for you; a crash before ack causes redelivery of the same job.",
        "Correct: at-least-once + idempotent consumers (dedup keys, unique constraints) is how production systems achieve effectively-once effects.",
        "No mainstream broker offers end-to-end exactly-once across network failures; it is built from consumer design.",
        "Losing messages on worker crash describes at-most-once, not at-least-once.",
      ],
      explanation:
        "At-least-once favors loss-prevention over duplicate-prevention. The duplicate window is real (crash between side effect and ack), so idempotent handlers close it.",
    },
    {
      id: "q-p3m5-3",
      type: "code-output",
      prompt:
        "A topic exchange named 'orders' receives a publish with routing key 'order.eu.created'. Queue 'q-eu' is bound with 'order.eu.*' and queue 'q-created' is bound with 'order.*.created'. Which queues receive a copy of the message?",
      code: `channel.assertExchange("orders", "topic", { durable: true });
channel.assertQueue("q-eu", { durable: true });
channel.assertQueue("q-created", { durable: true });
channel.bindQueue("q-eu", "orders", "order.eu.*");
channel.bindQueue("q-created", "orders", "order.*.created");
channel.publish("orders", "order.eu.created", Buffer.from("{}"));`,
      language: "ts",
      options: ["Only q-eu", "Only q-created", "Both q-eu and q-created", "Neither"],
      correctIndex: 2,
      optionExplanations: [
        "q-eu does match ('eu' fills the *), but that is not the full answer - the second binding also matches.",
        "q-created matches ('eu' fills the * in the middle), but q-eu matches too.",
        "Correct: topic wildcard * matches exactly one word, so both bindings match the key and each bound queue gets its own copy.",
        "At least one binding matches; 'neither' would require a non-matching key like 'payment.eu.created'.",
      ],
      explanation:
        "Topic exchanges evaluate every binding independently: 'order.eu.*' and 'order.*.created' both match 'order.eu.created', so a fan-out of one copy to each queue occurs.",
    },
    {
      id: "q-p3m5-4",
      type: "find-bug",
      prompt:
        "The payments queue is configured for at-least-once delivery and redelivers unacked messages after a crash. Find the critical bug in this consumer.",
      code: `channel.consume("payments", async (msg) => {
  const payment = JSON.parse(msg.content.toString());
  await db.query(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
    [payment.amount, payment.accountId],
  );
  channel.ack(msg);
});`,
      language: "ts",
      options: [
        "The consumer acks before the database write completes.",
        "On a duplicate delivery the balance is subtracted again - the consumer is not idempotent.",
        "JSON.parse is not wrapped in try/catch.",
        "The message should be acked with channel.nack instead.",
      ],
      correctIndex: 1,
      optionExplanations: [
        "The ack clearly runs after the awaited UPDATE; the ordering shown is correct.",
        "Correct: balance - $1 is a relative update. A redelivery (crash after UPDATE, before ack) subtracts the amount twice, corrupting the balance.",
        "Lack of try/catch is a robustness issue that could lose a message on a parse error, but it is not the delivery-semantics correctness bug.",
        "nack without requeue would dead-letter the message; ack after success is the right pattern - the bug is the non-idempotent write.",
      ],
      explanation:
        "Relative writes (increments/decrements) are never naturally idempotent. Guard them with a processed-message store (unique dedup key) or make the write absolute/conditional.",
    },
    {
      id: "q-p3m5-5",
      type: "code-output",
      prompt:
        "A retry helper uses base delay 100 ms, exponential factor 2, NO jitter, and up to 4 retries (5 attempts total). The operation fails every time. What delays occur between consecutive attempts?",
      code: `for (let attempt = 0; attempt <= 4; attempt++) {
  try { return await op(); }
  catch (err) {
    if (attempt === 4) break;
    await sleep(100 * 2 ** attempt); // no jitter
  }
}`,
      language: "ts",
      options: ["100, 200, 400, 800 ms", "100, 100, 100, 100 ms", "100, 200, 300, 400 ms", "200, 400, 800, 1600 ms"],
      correctIndex: 0,
      optionExplanations: [
        "Correct: sleeps between attempts are 100*2^0, 100*2^1, 100*2^2, 100*2^3 = 100, 200, 400, 800 ms.",
        "That is constant delay, not exponential backoff.",
        "That is an arithmetic progression, not a geometric one.",
        "That would be 200 * 2^attempt - the base is 100, not 200.",
      ],
      explanation:
        "Exponential backoff grows the wait geometrically: base * factor^attemptNumber. Jitter (omitted here) would then randomize each value to prevent synchronized retry storms.",
    },
    {
      id: "q-p3m5-6",
      type: "multiple-choice",
      prompt:
        "Why must the outbox row be inserted in the SAME database transaction as the business write?",
      options: [
        "So the relay can publish events to the broker faster.",
        "It guarantees the event exists if and only if the business change was committed - no lost or phantom events.",
        "So consumers can read the outbox table instead of calling the API.",
        "Because message brokers can join the database's ACID transaction directly.",
      ],
      correctIndex: 1,
      optionExplanations: [
        "Publishing speed is not the point; the poll interval dominates relay latency anyway.",
        "Correct: atomicity of entity + outbox row removes the dual-write window in both directions - the event cannot exist without the change, and the change cannot exist without the event being queued for publication.",
        "Consumers should not couple to your database schema; the relay publishes to the broker.",
        "Brokers and databases do not share a commit protocol in practice - that is the 2PC fantasy the pattern exists to avoid.",
      ],
      explanation:
        "The outbox converts a distributed atomicity problem into a local transaction plus a reliable relay. The relay's own crash window only produces duplicate publishes, which idempotent consumers handle.",
    },
    {
      id: "q-p3m5-7",
      type: "short-answer",
      prompt:
        "In a saga, what replaces the database rollback of a single-service ACID transaction when step 3 of 5 fails?",
      acceptedKeywords: ["compensation", "compensating", "compensate", "undo"],
      explanation:
        "Sagas use compensating transactions: each forward step has a corresponding undo action (refundPayment, releaseStock) that runs in reverse order for the steps that already completed. Compensations are business operations with their own auditing, retries and idempotency - they do not erase history the way a ROLLBACK would.",
    },
    {
      id: "q-p3m5-8",
      type: "multiple-choice",
      prompt:
        "Your team debates splitting a stable Node.js monolith into microservices. Which argument best reflects the trade-off taught in this module?",
      options: [
        "Microservices always reduce latency because each service is smaller.",
        "Microservices buy independent scaling and team autonomy at the cost of network failure modes, operational burden and giving up cross-service ACID transactions.",
        "A modular monolith cannot enforce module boundaries.",
        "Microservices are required before any queue or event can be used.",
      ],
      correctIndex: 1,
      optionExplanations: [
        "Smaller services add network hops - latency typically increases, not decreases.",
        "Correct: this is the honest comparison - you trade simplicity of a single deployable and one database for autonomy and scale, while inheriting timeouts, retries, tracing, and saga-style consistency.",
        "Lint rules, dependency checks and import boundaries enforce module structure inside a monolith very effectively.",
        "Monoliths use queues and events all the time; messaging is orthogonal to deployment topology.",
      ],
      explanation:
        "The recommended path is a modular monolith first, extracting services only when a forcing function (scaling profile, compliance isolation, team release cadence) demands it. Splitting relocates complexity - network failures, operations, consistency - rather than removing it.",
    },
  ],
};
