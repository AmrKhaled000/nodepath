import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m3",
  slug: "mongodb-and-mongoose",
  title: "Databases: MongoDB & Mongoose",
  description:
    "Persisting data with MongoDB: documents, collections, CRUD, querying, indexes, aggregation, schema design, relationships, transactions and Atlas — then the Mongoose ODM: schemas, models, validation, hooks, populate, pagination and connection management.",
  phaseId: "phase-2",
  order: 3,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m3",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m3-documents-collections",
    slug: "documents-collections",
    title: "Documents and Collections",
    description:
      "How MongoDB stores data: BSON documents, collections, the _id field, typed values, nested structures and how all of it compares to relational tables.",
    order: 1,
    estimatedMinutes: 16,
    tags: ["mongodb", "bson", "documents", "data-model"],
    prerequisites: ["p1m1-json"],
    relatedTopics: ["p2m3-crud", "p2m3-schema-design", "p2m3-mongoose-schemas-models"],
    learningObjectives: [
      "Describe what a collection and a document are and how they map to tables and rows",
      "Explain what BSON adds over JSON and why types matter when filtering",
      "Explain how _id is generated and why it is immutable",
    ],
    simpleExplanation:
      "MongoDB stores data as documents — JSON-like objects with real types (strings, numbers, dates, arrays, nested objects) — grouped into collections, which behave like tables that allow every row to have different fields. Each document gets a unique `_id` automatically, and because there are no fixed columns, you can evolve the shape of your data without running migrations.",
    detailedContent: `
A MongoDB **collection** is a group of **documents**. It plays the role of a table, and a document plays the role of a row — except that no two rows need to share the same set of fields.

Documents are stored as **BSON** (Binary JSON): the JSON object model encoded in a compact binary form the server can parse and scan quickly. BSON adds types plain JSON lacks:

- **Date** — a real timestamp, not a string. \`new Date("2026-01-01")\` in your app becomes a BSON date you can compare with \`$gt\`, \`$lt\` or sort on.
- ** ObjectId** — a 12-byte unique identifier (4-byte timestamp, 5-byte random value, 3-byte counter).
- **Numeric precision** — 32-bit int, 64-bit long, double and decimal128 are distinct types.
- **Binary, regex, nested arrays and sub-documents**.

Type strictness is a real behavioural rule: a document with \`{ age: "18" }\` does **not** match the filter \`{ age: 18 }\`. This is the opposite of SQL, where \`WHERE age = 18\` might implicitly cast a text column.

Every document needs an \`_id\`. If you omit it, MongoDB generates an ObjectId for you. It is indexed automatically (every collection has an implicit \`_id_\` index), it must be unique, and it **cannot be changed** after insertion — which is why you never re-key a document by assigning a new \`_id\`.

Limits worth memorising: a document may not exceed **16 MB**, field names are strings and cannot contain a dot or start with \`$\` (dots are reserved for path notation such as \`author.name\`), and duplicate keys in one document are rejected. Collections are created lazily on first write and are addressed with a namespace such as \`blog.posts\`.
    `,
    howItWorks: `
Under the hood, WiredTiger (MongoDB's storage engine) stores each collection in a set of files and keeps a B-tree per index plus one for \`_id\`. Inserting a document means: serialise it to BSON, allocate an \`_id\` if missing, validate size and field-name rules, append it through the journal (a write-ahead log so a crash cannot lose the write), then update the \`_id_\` index and any other indexes in memory before flushing pages in the background.

Reads work the same way in reverse: a filter is compiled into a match expression, scanned via an index (or a full collection scan), and the matching BSON bytes are deserialised into driver objects — or into Mongoose documents if you use an ODM.
    `,
    codeExamples: [
      {
        title: "Insert and inspect documents in mongosh",
        language: "js",
        code: `use blog

db.posts.insertOne({
  title: "Hello MongoDB",
  tags: ["mongo", "node"],
  author: { name: "Ada", handle: "@ada" },
  views: 0,
  publishedAt: new Date(),
});

db.posts.find({ "author.name": "Ada" }).pretty();

// _id is a typed ObjectId, not a string
db.posts.find({ _id: ObjectId("665f1c2e8b3f2a1d9c4e7a11") });`,
        description:
          "Run these in mongosh. The second query uses dotted path notation to search inside a nested sub-document — the same syntax you will use from the Node driver.",
      },
      {
        title: "Same document, three shapes — no migration needed",
        language: "js",
        code: `db.products.insertOne({ name: "Keyboard", price: 49.99 });
db.products.insertOne({ name: "Mouse", price: 19.99, wireless: true });
db.products.insertOne({
  name: "Laptop",
  price: 1299,
  specs: { ram: 16, cpu: "M-series" },
  tags: ["sale"],
});

// Types are enforced per value, not per column
db.products.find({ price: { $gt: 20 } });   // matches all three
db.products.find({ price: "49.99" });       // matches nothing`,
        description:
          "Collections tolerate optional fields and different nesting. Note that the numeric filter matches the three numeric prices but never the quoted string, because MongoDB compares by BSON type first.",
      },
    ],
    commonMistakes: [
      "Storing dates as strings (\"2026-01-05\") — they then sort lexicographically and cannot use range queries correctly. Use real Date values.",
      "Assuming an ObjectId string can be reassigned or that _id changes on update — _id is immutable by design.",
      "Mixing types in the same field (sometimes 12, sometimes \"12\") — filters and indexes behave inconsistently across the mixed values.",
    ],
    bestPractices: [
      "Let MongoDB generate _id unless you genuinely need a natural key; ObjectId already embeds creation time for free range queries.",
      "Validate types at the edge of your API (and in Mongoose) so documents never mix strings and numbers in one field.",
      "Keep documents under the 16 MB limit; store large blobs in object storage and keep only a reference in the document.",
    ],
    realWorldUseCases: [
      "Product catalogues where one category has attributes another does not (screen size vs battery capacity) — optional fields cost nothing.",
      "Event and audit logs where each event type carries a different payload structure.",
    ],
    resources: lessonResources({
      official: {
        title: "MongoDB Manual — Databases and Collections",
        url: OFFICIAL.mongodbDocs + "manual/core/databases-and-collections/",
        description: "Official reference for collections, namespaces and how documents are addressed.",
      },
      videos: [
        {
          query: "MongoDB documents and collections explained",
          description: "Visual walkthrough of documents, collections and the mongosh shell.",
          estimatedDuration: "8–15 min",
        },
      ],
      article: {
        title: "MongoDB Manual — BSON types",
        url: "https://www.mongodb.com/docs/manual/reference/bson-types/",
        provider: "mongodb.com",
        description: "Every BSON type with its ordering rules and comparison semantics.",
        estimatedDuration: "10 min",
      },
    }),
    exercises: [
      {
        id: "ex-p2m3-documents-shapes",
        title: "Model three shapes of a task",
        prompt:
          "In mongosh, create a collection named tasks and insert three documents for a task app: a task with an assignee sub-document and no due date, a task with a dueDate Date value and two labels, and a task with a nested checklist array of { done, text } objects. Then write the query that returns only tasks that have a dueDate. Report how many documents each query returns.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "Use $exists: true to test for the presence of a field",
          "Date values are written as new Date(...) in mongosh, not as quoted strings",
        ],
        solution: `use taskapp

db.tasks.insertOne({
  title: "Design review",
  assignee: { name: "Sam", team: "platform" },
  labels: [],
});
db.tasks.insertOne({
  title: "Ship v2",
  dueDate: new Date("2026-03-01T00:00:00Z"),
  labels: ["release", "backend"],
});
db.tasks.insertOne({
  title: "Write tests",
  checklist: [
    { done: false, text: "unit tests" },
    { done: false, text: "integration tests" },
  ],
});

db.tasks.countDocuments({ dueDate: { $exists: true } }); // 1
db.tasks.countDocuments({ "checklist.0.done": false });   // 1`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-crud",
    slug: "crud",
    title: "CRUD Operations",
    description:
      "Create, read, update and delete with the Node driver and with Mongoose: insertOne, find, update operators, upserts, bulkWrite and the differences between the two APIs.",
    order: 2,
    estimatedMinutes: 22,
    tags: ["mongodb", "crud", "node-driver", "updates"],
    prerequisites: ["p2m3-documents-collections", "p1m1-rest"],
    relatedTopics: ["p2m3-filtering-sorting", "p2m3-transactions", "p2m3-mongoose-schemas-models"],
    learningObjectives: [
      "Run insert, query, update and delete operations with the official Node driver",
      "Choose between update operators ($set, $inc, $push) and full replacement",
      "Explain matchedCount, modifiedCount and how upsert behaves",
      "Describe how Mongoose wraps the same driver calls in a document-oriented API",
    ],
    simpleExplanation:
      "Every data feature boils down to four verbs: insert documents, read them with a filter, update parts of them with operators like `$set`, and delete them. In the raw driver each verb maps to one method (`insertOne`, `find`, `updateOne`, `deleteOne`), while Mongoose gives you objects with `.save()` and `Model.find()` that do the same work underneath.",
    detailedContent: `
**Create.** \`insertOne(doc)\` and \`insertMany([docs])\` write documents and return acknowledgement info plus the generated \`insertedId\`s. \`insertMany\` stops at the first error unless you pass \`{ ordered: false }\`, which keeps writing the remaining documents.

**Read.** \`find(filter)\` returns a **cursor** — nothing is sent to the server until you call \`toArray()\`, \`forEach()\`, or iterate it with \`for await\`. \`findOne(filter)\` returns the first matching document or \`null\`. Always close cursors you abandon early (\`cursor.close()\`), or use \`toArray()\` / \`for await\`.

**Update.** MongoDB distinguishes **operators** from **replacement**:

- \`{ $set: { title: "x" } }\` changes one field and leaves the rest alone.
- \`{ $inc: { views: 1 } }\`, \`$unset\`, \`$push\`, \`$addToSet\`, \`$min\`, \`$max\`, \`$rename\`, \`$currentDate\` cover counters, arrays and metadata.
- Passing a document with **no** operators, such as \`{ title: "x" }\`, means *replace* the whole document (minus \`_id\`).

\`updateOne(filter, update)\` reports \`matchedCount\` (how many matched) and \`modifiedCount\` (how many actually changed). An update that matches but changes nothing still has \`matchedCount: 1\` and \`modifiedCount: 0\` — a distinction your API should not confuse.

**Upsert.** With \`{ upsert: true }\`, a filter that matches nothing *inserts* a document built from the filter's equality conditions plus the update operators. \`replaceOne\` and \`updateOne\` both support it; \`insertOne\` has a sibling called \`replaceOne\` with upsert, and unique indexes make upserts the standard idempotent-write pattern.

**Delete.** \`deleteOne\` / \`deleteMany\` return \`deletedCount\`. There is no undo — soft-delete with a \`deletedAt\` field if you need reversibility.

**Bulk.** \`bulkWrite([...])\` packs many operations into one round-trip, dramatically faster than a loop of individual calls.

**Driver vs Mongoose.** The driver speaks BSON filters and returns plain objects. Mongoose adds casting, defaults and validation: \`doc.save()\`, \`Model.create()\`, \`Model.updateOne()\`, and importantly **queries do not run until awaited** because a Mongoose Query is a thenable object.
    `,
    howItWorks: `
A write travels through four layers. Your code calls the driver, which serialises the filter and update into BSON and sends them over the connection pool to the **mongos or primary node** of a replica set. The server resolves the filter (index scan or collection scan), applies the update atomically to the matching document *in memory*, writes the new version plus a journal entry, and marks the old version for WiredTiger's garbage collector. Then it updates every affected index and returns counts.

If the write is on a replica set, the primary must record the operation in its **oplog** before acknowledging, so secondaries can apply it. That is why write acknowledgement levels (\`w: 1\`, \`w: "majority"\`) matter for durability.
    `,
    codeExamples: [
      {
        title: "Full CRUD cycle with the Node driver",
        language: "js",
        code: `import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const orders = client.db("shop").collection("orders");

// CREATE
const { insertedId } = await orders.insertOne({
  customer: "ada",
  status: "pending",
  total: 100,
  items: [{ sku: "KB-1", qty: 1 }],
});

// READ
const one = await orders.findOne({ _id: insertedId });

// UPDATE — increment a counter without touching other fields
const res = await orders.updateOne(
  { _id: insertedId, status: "pending" },
  { $set: { status: "paid" }, $inc: { total: 25 } },
);
console.log(res.matchedCount, res.modifiedCount); // 1 1

// DELETE
const del = await orders.deleteOne({ _id: insertedId });
console.log(del.deletedCount); // 1

await client.close();`,
        description:
          "The four verbs in sequence. Note that the update is an operator document ($set/$inc), so untouched fields survive the write.",
      },
      {
        title: "Mongoose says the same thing with objects",
        language: "ts",
        code: `import mongoose, { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    customer: { type: String, required: true },
    status: { type: String, default: "pending" },
    total: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const Order = model("Order", orderSchema);

const order = await Order.create({ customer: "ada", total: 100 });

order.status = "paid";
order.total += 25;
await order.save();               // UPDATE of a loaded document

await Order.updateOne(
  { _id: order._id, status: "paid" },
  { $inc: { total: 5 } },
);                                 // UPDATE without loading

await Order.deleteOne({ _id: order._id });`,
        description:
          "Two update styles: mutate-and-save for documents you already loaded, and a query-level update when you only need to change a few fields (one round-trip, no full document returned).",
      },
    ],
    commonMistakes: [
      "Forgetting that a filter with no matching operator field replaces the whole document — always pass $set unless replacement is intended.",
      "Awaiting find() but not toArray()/for await — the cursor itself is lazy, so nothing runs until you consume it.",
      "Reading matchedCount as 'the document changed': an identical update matches but modifies nothing.",
      "Looping await insertOne() for thousands of rows instead of insertMany() or bulkWrite() — one round-trip per row kills throughput.",
    ],
    bestPractices: [
      "Use operator updates ($set, $inc, $push) in APIs so partial writes cannot drop fields another team member just added.",
      "Check deletedCount/matchedCount and translate '0 matched' into a 404 in your Express handlers.",
      "Batch independent writes with bulkWrite and let ordered: false keep going after a single failure.",
      "Wrap writes that must not be half-done in a transaction (see the transactions lesson).",
    ],
    realWorldUseCases: [
      "A checkout flow that must decrement stock and create an order atomically.",
      "An analytics counter incremented on every page view with $inc and upsert: true.",
    ],
    resources: [
      docs(
        "MongoDB Manual — CRUD Operations",
        "https://www.mongodb.com/docs/manual/crud/",
        "The canonical reference for insert, query, update and delete semantics.",
      ),
      docs(
        "MongoDB Manual — Documents",
        "https://www.mongodb.com/docs/manual/core/document/",
        "How documents are structured, updated and replaced server-side.",
      ),
      ytSearch(
        "MongoDB Node.js driver CRUD tutorial",
        "A hands-on pass through insertOne, find, updateOne and deleteOne.",
        "en",
        "10–20 min",
      ),
      docs(
        "Mongoose API — Model.updateOne",
        "https://mongoosejs.com/docs/api/model.html#model-updateOne",
        "The Mongoose wrapper around the driver's update call, including options and return values.",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-crud-inventory",
        title: "Restock and sell",
        prompt:
          "Write a Node script that inserts three products with a stock number, sells one unit of each with a single bulkWrite call, then prints the documents. Use $inc so the quantity goes 10 → 9, not 10 → 1. Explain in one sentence what would happen if you used $set: { stock: 9 } instead.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "bulkWrite takes an array of { updateOne: { filter, update } } objects",
          "$set replaces; $inc adjusts relative to the current value",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-filtering-sorting",
    slug: "filtering-sorting",
    title: "Filtering, Projection and Sorting",
    description:
      "Query operators ($gt, $in, $regex, $exists, $elemMatch), projection, sort/skip/limit and cursors — plus how these build on the pagination concepts from Express.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["mongodb", "queries", "sorting", "projection"],
    prerequisites: ["p2m3-crud", "p2m2-pagination-filtering-sorting"],
    relatedTopics: ["p2m3-indexes", "p2m3-aggregation", "p2m3-mongoose-pagination"],
    learningObjectives: [
      "Compose filters with comparison, logical, array and existence operators",
      "Project only the fields you need and explain the inclusion/exclusion rule",
      "Apply sort, skip and limit correctly and know when an index can satisfy the sort",
      "Consume a cursor safely with for await",
    ],
    simpleExplanation:
      "A MongoDB query is a filter object plus three modifiers: which fields to return (projection), in what order (sort), and which slice of the result (skip/limit). Instead of SQL's WHERE clause you write operators such as `{ price: { $gt: 50 } }`, and dot notation lets you reach into nested objects and arrays.",
    detailedContent: `
**Filtering.** A filter is a document; matching means every key in it must be satisfied.

- Comparison: \`$gt\`, \`$gte\`, \`$lt\`, \`$lte\`, \`$ne\`, \`$in\`, \`$nin\`.
- Logical: \`$and\`, \`$or\`, \`$not\`, \`$nor\`.
- Existence & type: \`$exists: true\`, \`$type: "string"\`.
- Arrays: \`{ tags: "node" }\` matches if the array *contains* the value, \`$size: 3\` matches exact length, \`$all\` requires every listed element, and \`$elemMatch\` applies several conditions to the **same** element.
- Text/regex: \`{ name: { $regex: "^a", $options: "i" } }\` — regex filters are rarely indexed unless anchored; prefer a prefix range for performance.

Top-level keys are ANDed, so \`{ status: "active", age: { $gt: 18 } }\` needs both. Keep \`$or\` branches few and selective; each branch must be able to use an index.

**Projection.** \`{ title: 1, tags: 1 }\` includes only those fields (plus \`_id\`), \`{ secret: 0 }\` excludes one field. You cannot mix inclusion and exclusion except for \`_id: 0\`. Projection reduces network payload and enables **covered queries**, where the answer comes entirely from an index.

**Sort, skip, limit.** \`sort({ createdAt: -1 })\` (1 = ascending, -1 = descending), then \`skip(n)\` to offset, then \`limit(n)\` to cap. Sort runs **before** skip/limit. Skip must be non-negative and costs work proportional to how far you page — which is exactly why deep pages should use cursor (keyset) pagination instead.

**Cursors.** \`find()\` returns a cursor holding a server-side result set. Iterate with \`for await (const doc of cursor)\`, or materialise with \`toArray()\`. A cursor idles out after 10 minutes of inactivity.
    `,
    howItWorks: `
When a filter arrives, the query planner compiles it into a match expression and consults the available indexes to estimate a plan: it scores each candidate index by how many bounds the filter gives it, how selective those bounds look (from statistics), and whether the index can also deliver the requested sort. The winning plan runs; its statistics are stored in the cache and in \`explain()\` output.

Without a usable index the server performs a **collection scan**: decode every BSON document, evaluate the filter, keep the survivors, then sort them in memory (capped at 100 MB per sort unless you set \`allowDiskUse\`). That is the difference between a 2 ms query and a 2 s one.
    `,
    codeExamples: [
      {
        title: "Operators, projection and paging in one call",
        language: "js",
        code: `const coll = client.db("shop").collection("products");

const cursor = coll.find(
  {
    price: { $gte: 20, $lt: 500 },
    category: { $in: ["audio", "keyboards"] },
    stock: { $exists: true, $ne: 0 },
    "specs.wireless": true,
    tags: { $all: ["sale", "usb-c"] },
  },
  { projection: { name: 1, price: 1, _id: 0 } },
)
  .sort({ price: 1, name: 1 })
  .skip(20)
  .limit(10);

for await (const doc of cursor) {
  console.log(doc.name, doc.price);
}`,
        description:
          "One realistic query: range + membership + existence + nested path + array containment, then a projected, sorted, paged read driven by a cursor.",
      },
      {
        title: "Same idea through Mongoose",
        language: "ts",
        code: `const products = await Product.find({
  price: { $gte: 20, $lt: 500 },
  category: { $in: ["audio", "keyboards"] },
})
  .select("name price -_id")   // inclusion; _id switched off
  .sort({ price: 1 })
  .skip(20)
  .limit(10)
  .lean();                     // plain objects instead of documents

// $elemMatch: both conditions must hit the SAME array element
const orders = await Order.find({
  items: { $elemMatch: { sku: "KB-1", qty: { $gt: 2 } } },
});`,
        description:
          "Mongoose Query methods chain and are lazy: nothing executes until the query is awaited. .lean() skips document hydration when you only read data.",
      },
    ],
    commonMistakes: [
      "Using $elemMatch-free filters: { items: { sku: \"A\", qty: { $gt: 2 } } } needs the elements to satisfy conditions individually and can match across different array elements.",
      "Mixing inclusion and exclusion in one projection (for example { a: 1, b: 0 }) — MongoDB rejects it.",
      "Calling skip() for page 500 of a large result set and wondering why it is slow — skip walks every skipped row.",
      "Forgetting that sort happens before skip/limit, so paging only works if the sort is deterministic (add _id as a tiebreaker).",
    ],
    bestPractices: [
      "Always add _id to the sort key so pagination never repeats or drops a document with duplicate sort values.",
      "Project only the fields the client renders — smaller documents mean less CPU, less bandwidth, faster caches.",
      "Prefer anchored regex (^prefix) or prefix ranges over unanchored $regex so an index can be used.",
      "Sanitise user-supplied sort fields against an allow-list before passing them to sort().",
    ],
    realWorldUseCases: [
      "A catalogue page: filter by price range and category, sort by rating, page through results.",
      "An activity feed: { actorId, createdAt: { $lt: cursor } } sorted descending for infinite scroll.",
    ],
    resources: lessonResources({
      official: {
        title: "MongoDB Manual — Query Documents",
        url: "https://www.mongodb.com/docs/manual/tutorial/query-documents/",
        description: "Official guide to filters, projection and cursor methods.",
      },
      videos: [
        {
          query: "MongoDB query operators $elemMatch $in projection tutorial",
          description: "Walkthrough of the operator zoo with worked examples.",
          estimatedDuration: "12–20 min",
        },
      ],
      article: {
        title: "MongoDB Manual — Sort Results",
        url: "https://www.mongodb.com/docs/manual/tutorial/sort-results/",
        provider: "mongodb.com",
        description: "How sorting interacts with indexes, memory limits and collation.",
        estimatedDuration: "8 min",
      },
    }),
    exercises: [
      {
        id: "ex-p2m3-filter-activity",
        title: "Build a feed query",
        prompt:
          "Given a collection feed of { actorId, type, createdAt, payload }, write the query for page 3 (10 items per page) of posts by type \"post\" or \"repost\" created in the last 7 days, newest first, returning only actorId, type and createdAt. Then explain why the sort must include a unique tiebreaker.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "$or for the type list, $gte with new Date(Date.now() - 7*24*60*60*1000) for the window",
          "skip(20).limit(10) gives page 3 of size 10",
        ],
      },
    ],
    projectIds: ["p2-blog-api", "p2-inventory-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-indexes",
    slug: "indexes",
    title: "Indexes and Query Performance",
    description:
      "Why indexes make queries fast: B-tree structure, single and compound indexes, uniqueness, the ESR rule, explain() plans and the write cost of indexing.",
    order: 4,
    estimatedMinutes: 24,
    tags: ["mongodb", "indexes", "performance", "explain"],
    prerequisites: ["p2m3-filtering-sorting"],
    relatedTopics: ["p2m3-aggregation", "p2m3-crud", "p2m3-mongoose-pagination"],
    learningObjectives: [
      "Create single, compound, unique and TTL indexes",
      "Choose compound index key order using the ESR rule",
      "Read explain(\"executionStats\") to spot collection scans and in-memory sorts",
      "Trade read speed against write cost and storage when adding indexes",
    ],
    simpleExplanation:
      "An index is a sorted side-table that maps a field's value to the documents containing it — like the index at the back of a textbook. MongoDB walks it in O(log n) instead of scanning every document, and a compound index can serve filters, sorts and ranges at once, but every index you add makes writes slower and uses disk.",
    detailedContent: `
Every collection automatically has an \`_id_\` index. Everything else you create deliberately:

\`\`\`
db.orders.createIndex({ status: 1, createdAt: -1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
\`\`\`

The direction (1 or -1) only matters for sort order; a compound index traversed backwards is still useful, so \`(1, -1)\` and \`(1, 1)\` support the same equality filters. What *does* matter is **key order**: an index on \`{ status: 1, createdAt: -1 }\` can efficiently serve an equality on \`status\` followed by a range or sort on \`createdAt\`, but not a range on \`status\` with a sort on \`createdAt\`.

The **ESR rule** orders compound keys: **E**quality fields first, then **S**ort fields, then **R**ange fields. Equality keys narrow the scan to a contiguous block, sort keys arrive pre-ordered inside that block, and range predicates go last because they stop being contiguous.

Index types you will actually use:

- **Single** — one field.
- **Compound** — several fields, one B-tree.
- **Unique** — enforces uniqueness server-side; also speeds lookups on that key.
- **Multikey** — created automatically for array fields, with one index entry per element. A compound index may reference only one array field, so endlessly growing arrays are a poor fit for indexing.
- **TTL** — expires documents by date; a background thread deletes them.
- **Partial / sparse** — index only documents where a filter holds, saving space.

**Reading a plan.** \`db.orders.find({...}).explain("executionStats")\` shows \`totalDocsExamined\` vs \`nReturned\`. A healthy query has \`totalDocsExamined\` close to \`nReturned\`. \`totalKeysExamined\` similar to both means the index did the work (a **covered query** can even have \`totalDocsExamined: 0\`). \`SORT\` stage in the plan means the sort was done in memory — add an index that matches filter + sort.

**Cost.** Each index doubles the work of an insert/update that touches that field and consumes RAM. Index only what you query.
    `,
    howItWorks: `
A B-tree stores keys in sorted order with pointers to document locations (or the \`_id\`, for a secondary index — MongoDB secondary indexes are *not* clustered; they store the index key plus the record id, so an index lookup still costs one extra fetch unless the query is covered).

To answer a query, the planner enumerates index candidates, estimates selectivity from index statistics, picks a plan, and caches it. The first runs use a \`trial period\` to compare plans; a plan that keeps winning is pinned. If your data distribution shifts, MongoDB can re-plan automatically — which is why two runs of the same query can occasionally show different plans in \`explain()\`.
    `,
    codeExamples: [
      {
        title: "Create indexes and read the plan",
        language: "js",
        code: `db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ "customer.email": 1 }, { unique: true });

// What plan does MongoDB choose?
db.orders
  .find({ status: "paid", createdAt: { $gte: ISODate("2026-01-01") } })
  .sort({ createdAt: -1 })
  .limit(20)
  .explain("executionStats");
`,
        description:
          "The index follows the ESR rule: status (equality) first, createdAt (sort + range) second. The explain output should show an IXSCAN stage with totalDocsExamined near nReturned.",
      },
      {
        title: "Index bookkeeping in Mongoose",
        language: "ts",
        code: `const orderSchema = new Schema(
  {
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    email: { type: String, unique: true, index: true },
  },
  { timestamps: true },
);

// Compound index declared on the schema
orderSchema.index({ status: 1, createdAt: -1 });

// MongoServerError: E11000 duplicate key on unique index
await Order.create({ email: "ada@example.com" });
try {
  await Order.create({ email: "ada@example.com" });
} catch (err) {
  if (err.code === 11000) {
    console.log("email already registered");
  }
}`,
        description:
          "Schema-declared indexes are synced by Mongoose (autoIndex in development). The unique index surfaces duplicate writes as error code 11000, which your API should map to 409 Conflict.",
      },
    ],
    commonMistakes: [
      "Creating an index in the wrong order, e.g. { createdAt: -1, status: 1 } when every query filters on status — the index cannot serve that filter efficiently.",
      "Assuming unique means validated: existing duplicates make createIndex fail, and unique indexes do not stop other fields from being invalid.",
      "Ignoring write amplification — a hot collection with 12 indexes writes every insert 13 times.",
      "Not noticing the in-memory SORT stage in explain and blaming the network for a slow page.",
    ],
    bestPractices: [
      "Start from real query logs (the profiler or databaseProfiler level) before creating an index — index what you measure.",
      "Follow ESR: equality keys, then sort keys, then range keys.",
      "Run explain(\"executionStats\") after deploying an index and confirm totalDocsExamined dropped.",
      "Build heavy indexes on secondaries first or during a maintenance window; index builds take resources.",
    ],
    realWorldUseCases: [
      "Unique email/username indexes turn race conditions into a clean 409 instead of duplicate accounts.",
      "A TTL index on sessions.expiresAt automatically purges expired logins without a cron job.",
    ],
    resources: [
      docs(
        "MongoDB Manual — Indexes",
        "https://www.mongodb.com/docs/manual/indexes/",
        "Index types, creation and general guidance.",
      ),
      docs(
        "MongoDB Manual — Compound Indexes",
        "https://www.mongodb.com/docs/manual/core/index-compound/",
        "Key order, ESR rule and how compound indexes serve sort and range queries.",
      ),
      docs(
        "MongoDB Manual — Performance: explain()",
        "https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/",
        "How to read executionStats and diagnose scans and sorts.",
      ),
      ytSearch(
        "MongoDB compound index ESR rule explain",
        "Video walkthroughs of index selection and reading query plans.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-index-esr",
        title: "Fix the slow feed query",
        prompt:
          "A feed endpoint runs db.posts.find({ authorId: X, draft: false }).sort({ createdAt: -1 }).limit(20) and explains as a COLLSCAN with a top-k SORT. Propose a single compound index, justify the key order with the ESR rule, and show the explain stage names you expect afterwards (hint: IXSCAN, and whether a SORT stage should still appear).",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "authorId and draft are both equality predicates; createdAt carries the sort",
          "With equality keys first the sort is served by walking the index in one direction",
        ],
        solution: `db.posts.createIndex({ authorId: 1, draft: 1, createdAt: -1 });

// ESR: authorId and draft are Equality keys (either order among the
// equality keys is fine), createdAt is the Sort key and goes last.

// Expected explain plan:
//   IXSCAN  keyPattern { authorId: 1, draft: 1, createdAt: -1 }
//   no SORT stage — the index already returns documents newest-first
//   totalDocsExamined ≈ nReturned (≈ 20)`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-inventory-api", "p2-url-shortener"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-aggregation",
    slug: "aggregation",
    title: "Aggregation Pipelines",
    description:
      "Multi-stage data transformation: $match, $group, $project, $unwind, $lookup, $sort and how pipelines compare to SQL's SELECT/GROUP BY.",
    order: 5,
    estimatedMinutes: 23,
    tags: ["mongodb", "aggregation", "analytics", "pipeline"],
    prerequisites: ["p2m3-filtering-sorting"],
    relatedTopics: ["p2m3-indexes", "p2m3-relationships", "p2m3-mongoose-pagination"],
    learningObjectives: [
      "Compose a multi-stage aggregation pipeline and predict its output document by document",
      "Use $match early to push filtering into indexes",
      "Group with accumulator operators and reshape with $project/$addFields",
      "Deconstruct arrays with $unwind and join collections with $lookup",
    ],
    simpleExplanation:
      "An aggregation pipeline is a sequence of stages that documents flow through, each stage transforming them — filter, group, reshape, sort, join. It is MongoDB's equivalent of SQL's SELECT … FROM … WHERE … GROUP BY … ORDER BY, written as an array of small objects instead of one big statement.",
    detailedContent: `
You pass \`db.orders.aggregate([ stage1, stage2, ... ])\` an array of stage documents. Every document that enters a stage leaves it transformed, and the output of the last stage is your result (returned as a cursor, so you can chain \`sort()\`, \`limit()\` or \`toArray()\`).

Stages you will use constantly:

| Stage | SQL analogue | Purpose |
| --- | --- | --- |
| \`$match\` | \`WHERE\` | Filter; put it first so an index can be used |
| \`$group\` | \`GROUP BY\` | Bucket by \`_id\` and compute accumulators |
| \`$project\` / \`$addFields\` | \`SELECT expr\` | Reshape, rename, compute new fields |
| \`$sort\` / \`$limit\` / \`$skip\` | \`ORDER BY / LIMIT\` | Order and trim the stream |
| \`$unwind\` | \`LATERAL JOIN\` | Explode an array into one doc per element |
| \`$lookup\` | \`LEFT JOIN\` | Pull matching docs from another collection |
| \`$count\` | \`COUNT(*)\` | Emit a single document with a count |

Accumulators inside \`$group\`: \`$sum\`, \`$avg\`, \`$min\`, \`$max\`, \`$push\` (collect into an array), \`$first\` / \`$last\` (need a prior \`$sort\` to be meaningful).

Two rules of thumb:

1. **Filter early.** \`$match\` as the first stage lets the planner use an index; the same filter late in the pipeline forces every preceding stage to process junk. Adjacent \`$match\` stages can even be merged.
2. **Project late.** Dropping fields early saves memory only if no later stage needs them.

Because \`$group\` and \`$sort\` buffer values in memory (100 MB per operation by default), large pipelines need \`{ allowDiskUse: true }\` or tighter filters.

Aggregation is not only for reports: it powers recommendation lists, dashboards, de-normalisation back-fills and validation sweeps in one server-side round-trip.
    `,
    howItWorks: `
The aggregation framework compiles your stage array into a plan: match stages become index-eligible bounds, sort stages are rewritten to use an index order when possible, and group/project stages become streaming operators. Documents are pulled from the collection (or an index, for a covered match), transformed in batches — 101 documents by default for many stages — and pushed to the next stage.

\`$group\` hashes the \`_id\` expression into a hash table kept in memory; when the table passes 100 MB the server either aborts or, with \`allowDiskUse: true\`, spills runs to temporary files on disk and merges them. \`$lookup\` runs a sub-pipeline against the foreign collection (indexed on the localField/foreignField pair, or a full pipeline for richer joins) per batch, which is why unindexed lookups dominate slow-pipeline incidents.
    `,
    codeExamples: [
      {
        title: "Revenue per city, filtered and sorted",
        language: "js",
        code: `const report = await db.orders.aggregate([
  { $match: { status: "paid", createdAt: { $gte: startOfQuarter } } },
  {
    $group: {
      _id: "$city",
      revenue: { $sum: "$total" },
      orders: { $sum: 1 },
      averageOrder: { $avg: "$total" },
    },
  },
  { $sort: { revenue: -1 } },
  { $limit: 10 },
  { $project: { city: "$_id", revenue: 1, orders: 1, averageOrder: 1, _id: 0 } },
]).toArray();

// [{ city: "Dubai", revenue: 110, orders: 2, averageOrder: 55 }, ...]`,
        description:
          "$match first (index-friendly), then grouping with accumulators, sorting, trimming and finally reshaping. $ refers to a field path inside expressions; without $ the value is a literal.",
      },
      {
        title: "Explode tags and join authors in one pipeline",
        language: "ts",
        code: `const topTags = await Post.aggregate([
  { $match: { publishedAt: { $ne: null } } },
  { $unwind: "$tags" },
  { $group: { _id: "$tags", posts: { $sum: 1 } } },
  { $sort: { posts: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "author",
    },
  },
]);`,
        description:
          "$unwind turns one post with three tags into three documents, so the $group counts each tag once. $lookup left-joins a collection (its name is the literal collection name, never prefixed with $).",
      },
    ],
    commonMistakes: [
      "Writing { $group: { _id: \"city\" } } instead of { $group: { _id: \"$city\" } } — without the $ it groups everything under the literal string.",
      "Placing $match after $group when it could have filtered the source collection, wasting index opportunities.",
      "Exceeding the 100 MB group/sort memory limit on production data and getting a MongoCursorInUse or 'too much memory' error — enable allowDiskUse or filter harder.",
      "Assuming $lookup is free: an unindexed foreignField turns into a collection scan per batch.",
    ],
    bestPractices: [
      "Start pipelines with $match and end with $limit so the server does the least work possible.",
      "Create an index that covers your first-stage filter (and sort, if the sort happens early).",
      "Use .aggregate().allowDiskUse(true) for scheduled reports over large collections.",
      "Prefer aggregation over fetching documents into Node and reducing with Array.reduce for anything touching thousands of rows.",
    ],
    realWorldUseCases: [
      "Monthly revenue dashboards grouped by product category.",
      "A 'users also bought' recommendation built from $unwind + $group + $sort + $lookup.",
    ],
    resources: [
      docs(
        "MongoDB Manual — Aggregation",
        "https://www.mongodb.com/docs/manual/aggregation/",
        "Pipeline concept, stage catalogue and performance guidance.",
      ),
      docs(
        "MongoDB Manual — $lookup stage",
        "https://www.mongodb.com/docs/manual/reference/operator/aggregation/lookup/",
        "How joins are expressed and when they need indexes.",
      ),
      docs(
        "MongoDB Manual — $group accumulator operators",
        "https://www.mongodb.com/docs/manual/reference/operator/aggregation-group/",
        "Reference for $sum, $avg, $push and friends.",
      ),
      ytSearch(
        "MongoDB aggregation pipeline tutorial $match $group",
        "Step-by-step pipelines with worked output documents.",
        "en",
        "15–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-aggregation-top",
        title: "Top customers",
        prompt:
          "Given orders of { customerId, city, total, status, createdAt }, write a pipeline that returns the 5 customers with the highest paid total, including their city and order count, sorted descending by total. List which stage you would index for and why.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "$match status: \"paid\", then $group on $customerId with $sum and $push/$first for the city",
          "$sort { total: -1 } and $limit 5 — index { status: 1, customerId: 1 } supports the first stage",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-blog-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-schema-design",
    slug: "schema-design",
    title: "Schema Design: Embed vs Reference",
    description:
      "Data modelling without foreign keys: embedding versus referencing, cardinality patterns, denormalisation trade-offs and designing for the queries you actually run.",
    order: 6,
    estimatedMinutes: 22,
    tags: ["mongodb", "schema-design", "data-modeling", "denormalization"],
    prerequisites: ["p2m3-documents-collections", "p2m3-crud"],
    relatedTopics: ["p2m3-relationships", "p2m3-aggregation", "p2m3-mongoose-schemas-models"],
    learningObjectives: [
      "Decide between embedding and referencing using cardinality and access patterns",
      "Apply the one-to-few, child-of-parent and side-by-side patterns",
      "Explain the consistency cost of denormalised data",
      "Avoid the traps of unbounded arrays and 16 MB documents",
    ],
    simpleExplanation:
      "In MongoDB you choose where related data lives: embed it inside the parent document so one read returns everything, or store it in a separate collection and reference it when the data is large, shared or updated independently. The rule of thumb is to model around how your application reads data, then keep duplicated copies in sync only when duplication saves you joins.",
    detailedContent: `
There is no foreign key enforcement — **you** decide the shape. Two tools dominate:

**Embed** when data is read together, has bounded cardinality, and shares the parent's lifecycle: comments on a post, a user's addresses, line items on an order. One document, one read, no join, and the whole thing is atomic because single-document writes are always atomic.

**Reference** when any of these hold:

- The child list is **unbounded** (a user's 500,000 events) — arrays have practical limits and 16 MB is a hard ceiling.
- The child is **shared** (an author of 200 posts) — embedding duplicates the author 200 times.
- The child is updated **independently and often** — duplicating means updating every copy.
- Access patterns differ: you rarely read child and parent together.

Useful patterns:

- **One-to-few** → embed (phone numbers, shipping addresses).
- **One-to-many** where the many is read with the one → embed a list of summaries, reference the full records (post document embeds the first 3 comments; full comment list lives in its own collection).
- **One-to-squillions** (sensor readings) → bucket them into time-sliced documents (one document per hour) so growth stays bounded.
- **Parent-child ownership** → store child inside parent when the child makes no sense alone.
- **Computed/duplicated values** (post.commentCount) → keep them next to the reader and update them with the same atomic \`$inc\` that changes the source.

**The consistency bill.** Every duplication is a write you must repeat. MongoDB single-document atomicity does *not* span documents — if an author's name lives in 200 posts, one rename is 200 writes (or an aggregation back-fill) and readers can catch a half-updated state. Transactions exist precisely for the cases where you cannot tolerate that.
    `,
    howItWorks: `
MongoDB stores a document as one contiguous BSON blob with pointers for oversize (BSOBJ) overflow — a document larger than one storage page keeps a pointer chain, so reading it means several fetches. That is why embedding a huge child list does not merely risk the 16 MB cap; it also makes the parent slower to read and rewrite, because WiredTiger rewrites the whole document on every update.

Referencing flips the cost: the parent stays small and fast, but a read that needs both collections costs two round-trips (or a $lookup/populate). The database never rewrites your model for you — the same bytes cost different amounts depending on which fields you touch, so design so that hot paths touch the least data.
    `,
    codeExamples: [
      {
        title: "Embedded orders vs referenced products",
        language: "js",
        code: `// EMBEDDED — line items snapshot the price at purchase time
db.orders.insertOne({
  customerId: ObjectId("..."),
  total: 119,
  items: [
    { sku: "KB-1", name: "Keyboard", qty: 1, unitPrice: 49 },
    { sku: "MS-2", name: "Mouse", qty: 2, unitPrice: 35 },
  ],
});

// REFERENCED — the product changes daily, orders must not
db.products.updateOne({ sku: "KB-1" }, { $set: { unitPrice: 59 } });

// Counters that stay consistent without a join
db.posts.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });`,
        description:
          "Snapshotting price and name inside the order keeps history correct even when the product changes; the comment counter keeps the hot read (post list) join-free.",
      },
      {
        title: "Bucketing an unbounded stream",
        language: "ts",
        code: `// One document per hour keeps each write small
await Telemetry.updateOne(
  { sensorId, bucketStart: hourStart },
  {
    $setOnInsert: { sensorId, bucketStart: hourStart, readings: [] },
    $push: { readings: { at: now, value } },
    $inc: { count: 1 },
  },
  { upsert: true },
);

// Later: read one bucket instead of a million documents
const bucket = await Telemetry.findOne({ sensorId, bucketStart: hourStart });`,
        description:
          "The classic time-series bucket pattern: an unbounded stream becomes bounded documents, so reads and writes both stay O(1) in the number of readings.",
      },
    ],
    commonMistakes: [
      "Embedding an unbounded list (every message, every log line) until documents approach 16 MB and updates start failing.",
      "Duplicating a record that is updated frequently and then finding only some copies were refreshed.",
      "Designing collections around the database tables you already know instead of around read patterns.",
      "Storing derived totals that are recomputed on every read instead of maintained with $inc.",
    ],
    bestPractices: [
      "Write down the top 3 queries first, then design the document so each one is a single read.",
      "Snapshot volatile values (price, title at time of purchase) into the reader document.",
      "Keep any list that a user can scroll indefinitely in its own collection with an index on the parent key.",
      "Rehearse growth: if a field only ever grows, define how it will be trimmed or bucketed before launch.",
    ],
    realWorldUseCases: [
      "E-commerce orders embedding line items so checkout history survives price changes.",
      "A chat app embedding the last 50 messages in the room document for instant history loads.",
    ],
    resources: lessonResources({
      official: {
        title: "MongoDB Manual — Data Modeling",
        url: "https://www.mongodb.com/docs/manual/data-modeling/",
        description: "Official guidance on embedding, referencing and schema evolution.",
      },
      videos: [
        {
          query: "MongoDB schema design embed vs reference patterns",
          description: "Pattern-based modelling walkthroughs with cardinality examples.",
          estimatedDuration: "15–25 min",
        },
      ],
      article: {
        title: "MongoDB — Building with patterns: schema design",
        url: "https://www.mongodb.com/blog/post/building-with-patterns-overview",
        provider: "mongodb.com",
        description: "Series covering bucket, computed, subset and other modelling patterns.",
        estimatedDuration: "12 min",
      },
    }),
    exercises: [
      {
        id: "ex-p2m3-schema-review",
        title: "Model a job board",
        prompt:
          "For a job board with companies, jobs and applications, decide for each relationship whether to embed or reference: (1) company logo and name on a job card, (2) the full list of applications for one job, (3) the skills tag list on a job, (4) a candidate's résumé file. Justify each with cardinality, update frequency and read pattern.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Ask: is the list bounded? Is it read together with the parent? Who updates it and how often?",
          "Volatile or huge data belongs in its own collection; small static lists can be embedded",
        ],
      },
    ],
    projectIds: ["p2-chat-backend", "p2-blog-api", "p2-job-board-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-relationships",
    slug: "relationships",
    title: "Relationships Between Collections",
    description:
      "One-to-one, one-to-many and many-to-many in a foreign-key-free world: reference keys, $lookup joins, and keeping integrity in application code.",
    order: 7,
    estimatedMinutes: 18,
    tags: ["mongodb", "relationships", "lookup", "joins"],
    prerequisites: ["p2m3-schema-design", "p2m3-crud"],
    relatedTopics: ["p2m3-aggregation", "p2m3-mongoose-populate", "p2m3-transactions"],
    learningObjectives: [
      "Model one-to-one, one-to-many and many-to-many relationships with ObjectId references",
      "Join related collections with $lookup and know when to avoid it",
      "Maintain referential integrity without foreign key constraints",
      "Choose where the reference key lives based on query direction",
    ],
    simpleExplanation:
      "MongoDB has no foreign keys, so you store a reference — usually an ObjectId field such as `authorId` — and resolve it either by querying twice from your code or with a `$lookup` join inside an aggregation. The important question is not 'how do I join' but 'which side holds the key', because that decides which queries are single-collection and fast.",
    detailedContent: `
Three cardinalities, three shapes:

- **One-to-one** — a user and their profile. Store a \`profileId\` on the user, or embed the profile if it is small and always read together (the usual choice).
- **One-to-many** — a post and its comments, a customer and orders. Put the **foreign key on the many side**: \`comments.postId\`. Queries like "comments for this post" then hit an indexed single-collection lookup. Putting \`commentIds\` on the post instead makes the parent document grow unboundedly.
- **Many-to-many** — a job and its tags, a student and courses. Either store an array of ids on one side (if one side is clearly bounded: \`job.tagIds\`) or create a junction collection \`applications: { jobId, candidateId, status }\` which itself supports its own indexes and extra fields.

**Resolving a reference** has two routes:

1. **Application-level join** — fetch the parent, collect the ids, run one \`find({ _id: { $in: ids } })\`. Two round-trips, full control over caching, and it is what Mongoose's \`populate\` does under the hood.
2. **\`$lookup\`** — do it server-side inside an aggregation. One round-trip and the join happens where the data already lives, but it is harder to cache and can be slow without an index on \`foreignField\`.

**Integrity.** There is no cascade and no constraint. If you delete a post, its comments are orphaned unless you delete them too (in a transaction or with a background sweep). Decide deliberately: hard-delete children in the same transaction, keep children readable after the parent is gone, or soft-delete the parent and filter it out of queries.
    `,
    howItWorks: `
A \`$lookup\` stage executes as a nested pipeline: for each input document (or per batch, in the efficient grouped form), the server takes \`localField\`, builds a query \`{ foreignField: <value> }\` against the foreign collection, runs it as a normal indexed query, and appends the results as an array on \`as\`. With \`pipeline\`-style lookups you can filter the foreign side before joining.

Mongoose \`populate\` does the same thing from Node: it gathers every referenced id across the documents you loaded, issues a single \`find({ _id: { $in: [...] } })\`, builds a Map, and assigns the hydrated sub-documents back onto each parent — one extra query per populated path, batched across all parents.
    `,
    codeExamples: [
      {
        title: "Manual two-step join",
        language: "js",
        code: `const posts = await db.posts.find({ published: true }).limit(20).toArray();

const authorIds = [...new Set(posts.map((p) => p.authorId))];
const authors = await db.users
  .find({ _id: { $in: authorIds } }, { projection: { name: 1, avatar: 1 } })
  .toArray();

const byId = new Map(authors.map((a) => [String(a._id), a]));
const result = posts.map((p) => ({ ...p, author: byId.get(String(p.authorId)) ?? null }));`,
        description:
          "Exactly what populate does internally: collect distinct ids, one $in query, join in a Map. Two round-trips total regardless of how many posts you loaded.",
      },
      {
        title: "Server-side join with $lookup",
        language: "js",
        code: `const rows = await db.posts.aggregate([
  { $match: { published: true } },
  { $sort: { createdAt: -1 } },
  { $limit: 20 },
  {
    $lookup: {
      from: "users",
      localField: "authorId",
      foreignField: "_id",
      as: "author",
      pipeline: [{ $project: { name: 1, avatar: 1 } }],
    },
  },
  { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
]).toArray();`,
        description:
          "The same join done in the database. $unwind flattens the array $lookup produced; preserveNullAndEmptyArrays keeps posts whose author was deleted.",
      },
    ],
    commonMistakes: [
      "Storing commentIds on the post so the post document grows forever — put the key on the many side.",
      "Deleting a parent and leaving orphaned children with no index to find them later.",
      "Running $lookup without an index on the foreign field — the join becomes a scan per row.",
      "Treating $in lists of thousands of ids as free; batch them or denormalise instead.",
    ],
    bestPractices: [
      "Always index the foreign key: db.comments.createIndex({ postId: 1 }).",
      "Pick one resolution style per endpoint and be consistent so caching stays predictable.",
      "Delete or cascade children inside a transaction, or mark the parent deleted and filter reads.",
      "Prefer application-level $in joins when you might cache the target collection (users rarely change).",
    ],
    realWorldUseCases: [
      "A blog showing author avatars next to each post without duplicating author data 500 times.",
      "A job board linking jobs to tags via a bounded tagIds array on the job document.",
    ],
    resources: lessonResources({
      official: {
        title: "MongoDB Manual — Data Modeling relationships",
        url: "https://www.mongodb.com/docs/manual/data-modeling/",
        description: "Official treatment of referencing patterns and relationship cardinalities.",
      },
      videos: [
        {
          query: "MongoDB relationship patterns $lookup join tutorial",
          description: "Examples of one-to-many and many-to-many modelling with joins.",
          estimatedDuration: "12–20 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p2m3-relations-comments",
        title: "Delete without orphans",
        prompt:
          "A comment collection references posts with postId, and replies reference comments with parentId. Write the sequence of operations that deletes a post and all of its descendants safely (including nested replies), and state which part should run in a transaction. Then show the index you would add to make the first lookup instant.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Start from db.comments.find({ postId }) and expand with parentId until a level returns nothing",
          "Collect every id first, then deleteMany({ _id: { $in: ids } }) plus the post — one transaction",
        ],
        solution: `// 1) collect every descendant comment id (loop or recursive $graphLookup)
const roots = await db.comments.find({ postId }).project({ _id: 1 }).toArray();
const allIds = roots.map((r) => r._id);
let frontier = [...allIds];
while (frontier.length) {
  const level = await db.comments
    .find({ parentId: { $in: frontier } })
    .project({ _id: 1 })
    .toArray();
  frontier = level.map((d) => d._id);
  allIds.push(...frontier);
}

// 2) one atomic unit: children first, then the post
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await db.comments.deleteMany({ _id: { $in: allIds } }, { session });
    await db.posts.deleteOne({ _id: postId }, { session });
  });
} finally {
  await session.endSession();
}

// 3) supporting indexes
db.comments.createIndex({ postId: 1 });
db.comments.createIndex({ parentId: 1 });`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p2-blog-api", "p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-transactions",
    slug: "transactions",
    title: "Multi-Document Transactions",
    description:
      "ACID across documents: sessions, commit/abort, withTransaction retries, causality, and when a transaction is the wrong tool.",
    order: 8,
    estimatedMinutes: 20,
    tags: ["mongodb", "transactions", "acid", "sessions"],
    prerequisites: ["p2m3-crud", "p2m1-error-propagation"],
    relatedTopics: ["p2m3-relationships", "p2m3-crud", "p2m3-atlas"],
    learningObjectives: [
      "Run a multi-document transaction with a session and commit or abort it",
      "Explain the replica-set requirement and what happens on transient errors",
      "Pass a session through every Mongoose call inside the transaction block",
      "Decide when a single atomic document write is enough instead of a transaction",
    ],
    simpleExplanation:
      "A single MongoDB document write is always atomic, but writing two documents at once is not — unless you wrap them in a transaction. A transaction guarantees that either all of the writes commit or none of them do, which is exactly what a money transfer needs; it requires a replica set (Atlas clusters are one), must be kept short, and should be closed in a finally block.",
    detailedContent: `
MongoDB transactions provide **ACID** semantics across documents, collections and databases:

- **Atomicity** — all writes in the transaction become visible together, or none do.
- **Consistency** — the transaction's writes are validated (unique indexes are checked at commit, not only at insert).
- **Isolation** — by default \`snapshot\` reads: the transaction sees a stable snapshot of the data as of its first operation.
- **Durability** — once committed, a write survives a crash (journal + replication acknowledgement).

The API is session-based:

\`\`\`
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await orders.updateOne({ _id }, { $set: { status: "paid" } }, { session });
    await stock.updateOne({ sku }, { $inc: { qty: -1 } }, { session });
  });
} finally {
  await session.endSession();
}
\`\`\`

\`withTransaction\` is a helper: it commits, and if the server returns a **transient transaction error** (a conflict with another writer) or a **transaction label expiry**, it retries the whole callback from scratch. Your callback must therefore be **idempotent** — it may run more than once.

Rules:

- Transactions need a **replica set or sharded cluster**; standalone servers do not support them. Atlas M0+ is a replica set, and \`mongod --replSet\` starts a local one.
- Keep transactions **short** and never hold one across a slow external HTTP call — they pin storage snapshots and block cleanup.
- Every operation inside the block must receive the **same \`{ session }\`** option. A call without it runs outside the transaction and silently defeats the purpose.
- Read your own writes; but data written by *other* transactions after yours started is not visible until you commit.

**When not to use one.** If you can model the operation as a single document (with an embedded child and a \`$inc\` counter), that write is already atomic and cheaper than a transaction. Use transactions for genuinely multi-document invariants: transfer + ledger entry, order + stock decrement.
    `,
    howItWorks: `
Under the hood a transaction reserves a set of WiredTiger transaction ids, records every write in a private write set inside the snapshot, and appends nothing to the oplog yet. On commit, the primary validates that no conflicting transaction committed in between (optimistic concurrency control), then serialises the whole write set as a single **atomic batch in the oplog**. Secondaries apply that batch as one op, so no reader ever sees half of it.

If validation fails — another transaction touched the same documents — the server aborts and returns a transient error, and \`withTransaction\` retries with a fresh snapshot. Aborted writes never touched the oplog, so rollback is trivial: the old values are simply still there.
    `,
    codeExamples: [
      {
        title: "Transfer with the driver",
        language: "js",
        code: `async function transfer(client, from, to, amount) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const debit = await client
        .db("bank")
        .collection("accounts")
        .updateOne(
          { _id: from, balance: { $gte: amount } },
          { $inc: { balance: -amount } },
          { session },
        );
      if (debit.matchedCount === 0) throw new Error("insufficient funds");

      await client
        .db("bank")
        .collection("accounts")
        .updateOne({ _id: to }, { $inc: { balance: amount } }, { session });

      await client
        .db("bank")
        .collection("ledger")
        .insertOne({ from, to, amount, at: new Date() }, { session });
    });
    return { ok: true };
  } finally {
    await session.endSession();
  }
}`,
        description:
          "The balance guard throws inside the transaction, so neither the debit, the credit nor the ledger row is persisted. withTransaction retries only transient conflicts, never your business error.",
      },
      {
        title: "The same flow with Mongoose",
        language: "ts",
        code: `import mongoose from "mongoose";

await mongoose.connection.transaction(async (session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) throw new Error("order not found");

  order.status = "paid";
  await order.save({ session }); // document middleware still runs

  await Inventory.updateOne(
    { sku: order.sku },
    { $inc: { available: -order.qty } },
    { session },
  );

  await Payment.create([{ orderId, amount: order.total }], { session });
});`,
        description:
          "Mongoose's connection.transaction helper opens and commits the session for you. Every call inside must receive { session } — that is the part people forget.",
      },
    ],
    commonMistakes: [
      "Omitting { session } on one of the calls — that operation commits outside the transaction and the invariant breaks silently.",
      "Catching an error inside the callback and returning normally: the transaction then commits the partial work.",
      "Doing a slow third-party API call while the transaction is open, pinning the storage snapshot and timing out.",
      "Using transactions to simulate single-document atomicity that an embedded model would give you for free.",
    ],
    bestPractices: [
      "Put the session option on every operation inside the block and verify with a failing test that none leaks.",
      "Make transaction callbacks idempotent — they can be retried by the driver.",
      "Use Mongoose's connection.transaction / the driver's withTransaction instead of hand-rolled commit/abort pairs.",
      "Ensure your dev environment runs a replica set (mongod --replSet rs0 --keyFile ...) so transaction code is actually exercised before deploy.",
    ],
    realWorldUseCases: [
      "Wallet debit + credit + ledger entry in a payment flow.",
      "Decrementing stock while creating an order so the catalogue can never oversell.",
    ],
    resources: [
      docs(
        "MongoDB Manual — Transactions",
        "https://www.mongodb.com/docs/manual/core/transactions/",
        "Semantics, requirements and limits of multi-document transactions.",
      ),
      docs(
        "MongoDB Manual — Transactions in Applications",
        "https://www.mongodb.com/docs/manual/core/transactions-in-applications/",
        "Sessions, withTransaction, retries and error handling in code.",
      ),
      docs(
        "Mongoose — Transactions tutorial",
        "https://mongoosejs.com/docs/tutorials/transactions.html",
        "How to pass sessions through Mongoose models inside a transaction.",
      ),
      ytSearch(
        "MongoDB multi-document transactions withTransaction tutorial",
        "End-to-end transaction examples and retry semantics.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-tx-order",
        title: "All-or-nothing order",
        prompt:
          "Write a function placeOrder(client, orderId) that marks an order paid, decrements stock, and writes a ledger entry — atomically. Then describe a test that proves atomicity: how do you force the third step to fail and assert that the first two were rolled back?",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "withTransaction retries transient errors, so throw a non-transient error (new Error) to abort",
          "Force failure with a unique index violation or a deliberately invalid document in the ledger insert",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-chat-backend"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-atlas",
    slug: "atlas",
    title: "MongoDB Atlas: Clusters and Connection Strings",
    description:
      "Running MongoDB in the cloud: clusters and tiers, database users, IP access lists, SRV connection strings, replica sets, backups and monitoring.",
    order: 9,
    estimatedMinutes: 17,
    tags: ["mongodb", "atlas", "cloud", "devops"],
    prerequisites: ["p2m3-documents-collections", "p2m2-express-app"],
    relatedTopics: ["p2m3-mongoose-connection-management", "p2m3-transactions", "p2m3-indexes"],
    learningObjectives: [
      "Create a cluster, a database user and an IP access list in Atlas",
      "Read and configure a connection string, including the mongodb+srv protocol",
      "Explain what the replica set behind an Atlas cluster gives you",
      "Diagnose the most common connection failures from error messages",
    ],
    simpleExplanation:
      "Atlas is MongoDB's managed hosting: you press a button and get a real replica set with backups, monitoring and an encryption key, reachable through one connection string. To connect you need three things to line up — a database user with a password, a network path (your IP must be allowed), and the right URI — and when any of them is wrong you get a very specific error.",
    detailedContent: `
**Clusters.** A cluster is a replica set (or a sharded cluster at larger tiers) run by MongoDB. The free **M0** tier is a shared, single-node replica set sized for learning and prototypes — it supports transactions, indexes and aggregation, but with modest CPU, RAM and storage. Paid tiers (M10+) add dedicated nodes, autoscaling, private networking and point-in-time recovery.

**Replica set, always.** Every Atlas cluster is at least a three-node replica set on paid tiers (M0 runs a single node in replica-set mode). This buys you automatic failover — a primary election in seconds if the primary dies — read scaling through secondaries, and the ability to run multi-document transactions.

**The three connection ingredients:**

1. **Database user** — created under Database Access, with a role such as \`readWriteAnyDatabase\` for dev. Never reuse the \`admin\` user in application code.
2. **IP access list** — under Network Access. \`0.0.0.0/0\` ("allow from anywhere") works for a first deploy but means anyone with the credentials can reach the cluster; production should whitelist your server's egress IPs.
3. **Connection string** — from the Connect dialog:

\`\`\`
mongodb+srv://app_user:PASS@cluster0.abcde.mongodb.net/shop?retryWrites=true&w=majority
\`\`\`

The \`mongodb+srv\` protocol uses a DNS SRV record to discover the current host list, so failovers and node changes never require editing your URI. The driver then reads the \`TXT\` record for replica-set options. Standard \`mongodb://\` URIs list every host explicitly and must be maintained by hand.

**Common failures, decoded:**

- *IP not allowed / ENOTFOUND on DNS* → your egress IP is missing from the access list.
- *Bad auth / AuthenticationFailed* → wrong username, password or authSource (\`admin\` by default on Atlas).
- *Server selection timed out after 30 s* → the host is unreachable (firewall, private cluster without VPC peering) rather than an application bug.

**Operational basics.** Backups are continuous (paid) or periodic snapshots; the Real-Time Performance Panel and the query profiler show live operations and slow queries — check there before optimising blindly.
    `,
    howItWorks: `
When your app calls \`connect\`, the driver resolves the SRV record to a set of hosts, performs a TCP + TLS handshake, and runs the MongoDB handshake: it reports driver version, replica-set name and requested features (such as retryable writes), and the server replies with its topology — who is primary, who is secondary, what the logical session timeout is. The driver keeps a **connection pool per server** and a monitoring thread that pings every few seconds, so a primary election is noticed within one monitoring round.

Writes go to the primary; replication applies the oplog to secondaries asynchronously. \`w=majority\` in the URI asks the primary to wait until a majority of nodes has the write before acknowledging, which is what makes an automatic failover lose nothing.
    `,
    codeExamples: [
      {
        title: "Connect a Node service to Atlas",
        language: "ts",
        code: `import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not set");

await mongoose.connect(uri, {
  dbName: "shop",
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

console.log("state:", mongoose.connection.readyState); // 1 = connected`,
        description:
          "The URI carries credentials, host, database defaults and write concerns; options here tune pooling and how long you wait for an unreachable cluster.",
      },
      {
        title: "Verify connectivity from the shell",
        language: "bash",
        code: `# 1) Check DNS for the SRV record
nslookup -type=SRV cluster0.abcde.mongodb.net

# 2) Connect with mongosh using the same URI
mongosh "mongodb+srv://cluster0.abcde.mongodb.net/shop" --username app_user

# 3) Confirm the topology you actually got
#   rs.status() -> members, roles, election info`,
        description:
          "Reproduce the connection outside Node first: if mongosh works, the bug is in your app; if it fails, it is credentials, DNS or the IP access list.",
      },
    ],
    commonMistakes: [
      "Committing the connection string with the password to git — use environment variables and rotate the user's password if it leaks.",
      "Setting 0.0.0.0/0 in production and assuming the password alone is enough protection.",
      "Copying a mongodb:// (non-SRV) URI from an old tutorial — modern clusters publish SRV records and the SRV form is what the Connect button gives you.",
      "Assuming an Atlas timeout is a code bug when it is almost always the IP access list or a private-network configuration.",
    ],
    bestPractices: [
      "Store the URI in the environment (and your platform's secret store), never in source.",
      "Create a least-privilege application user with readWrite on only the databases it uses.",
      "Start every incident with mongosh from the same machine as your app to separate network problems from app problems.",
      "Set write concern w=majority for anything you cannot afford to lose after a failover.",
    ],
    realWorldUseCases: [
      "Shipping a prototype on M0 free tier and scaling to a dedicated M10 cluster without changing your connection code.",
      "Pointing staging and production at separate clusters (or databases) via one environment variable.",
    ],
    resources: [
      docs(
        "MongoDB Atlas Documentation",
        "https://www.mongodb.com/docs/atlas/",
        "Official entry point for clusters, access, security and monitoring.",
      ),
      docs(
        "Atlas — Connect to Your Cluster",
        "https://www.mongodb.com/docs/atlas/connect/",
        "Connection strings, drivers, SRV discovery and the connect dialog.",
      ),
      docs(
        "Atlas — Configure IP Access List",
        "https://www.mongodb.com/docs/atlas/security/ip-access-list/",
        "Allow-listing clients and services that talk to your cluster.",
      ),
      ytSearch(
        "MongoDB Atlas connect Node.js connection string tutorial",
        "Setup walkthroughs covering users, IP lists and mongoose.connect.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-atlas-diagnose",
        title: "Read the error",
        prompt:
          "A teammate reports that their Express app fails on startup with 'IP that is not allowed to access this server' and, after fixing that, 'Authentication failed'. List the exact Atlas console changes that resolve each error, and where the credentials should live in the app.",
        difficulty: "intermediate",
        estimatedMinutes: 15,
        hints: [
          "One error is Network Access, the other is Database Access",
          "A connection string with a password belongs in the environment, not in the repository",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-schemas-models",
    slug: "mongoose-schemas-models",
    title: "Mongoose Schemas and Models",
    description:
      "The ODM layer: defining a Schema, compiling a Model, documents vs plain objects, schema options, defaults, virtuals and instance methods.",
    order: 10,
    estimatedMinutes: 24,
    tags: ["mongoose", "schemas", "models", "odm"],
    prerequisites: ["p2m3-documents-collections", "p2m1-code-organization"],
    relatedTopics: ["p2m3-mongoose-validation", "p2m3-mongoose-hooks", "p2m3-crud"],
    learningObjectives: [
      "Define a typed schema with defaults, nested paths and options",
      "Compile a Model and distinguish Model, Document, Query and plain object",
      "Add virtuals, instance methods and statics where they belong",
      "Explain what Mongoose does on save that the raw driver does not",
    ],
    simpleExplanation:
      "A Mongoose Schema declares the shape of one collection: fields, types, defaults and behaviour. Compiling it into a Model gives you a class-like API — `User.find()`, `new User()`, `user.save()` — where returned documents carry methods and casting, while plain driver objects carry none of that.",
    detailedContent: `
A schema is a **blueprint, not a container**: data lives in MongoDB, the schema only tells Mongoose how to cast, validate, default and hook it.

\`\`\`
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Anonymous" },
    age: { type: Number, min: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    settings: { theme: { type: String, default: "system" } },
    lastLogin: { type: Date, select: false },
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);
\`\`\`

Key ideas:

- **Path syntax.** \`email\`, \`settings.theme\` and array paths like \`tags: [String]\` are all *paths*. \`type: [String]\` declares an array of strings; \`type: [{ text: String }]\` an array of sub-documents.
- **Sub-documents vs documents.** An embedded sub-schema creates sub-documents that save with their parent; \`type: Schema.Types.Mixed\` opts out entirely (no casting, no validation).
- **Schema options.** \`timestamps\` maintains \`createdAt\`/\`updatedAt\`; \`strict\` (default) silently drops fields not in the schema — a classic "my field won't save" bug; \`versionKey\` keeps a \`__v\` used for optimistic concurrency on arrays; \`toJSON: { virtuals: true }\` includes virtuals when you \`res.json(doc)\`.
- **Defaults and setters.** \`default\` applies on creation; \`lowercase\`, \`trim\`, \`set\` run during casting.
- **Virtuals** are computed getters that are never persisted: \`userSchema.virtual("initials").get(...)\`.
- **Methods.** \`schema.methods.toSafeJSON = function () { ... }\` for instances; \`schema.statics.findByEmail = ...\` for the model; \`schema.query.active = function () { return this.where({ status: "active" }); }\` for chainable query helpers.

**Four Mongoose objects to keep apart:** the *Model* (class), the *Document* (loaded row with state), the *Query* (lazy builder you await), and the *Aggregate* (pipeline builder).
    `,
    howItWorks: `
When you call \`mongoose.model("User", schema)\`, Mongoose compiles the schema: it builds internal descriptors for every path (type, casting function, validators, getters/setters, middleware) and registers the model so \`mongoose.models.User\` resolves later. Compilation throws if you register the same model name twice — which is why hot-reload dev servers wrap model registration in a \`mongoose.models.User || mongoose.model(...)\` guard.

At read time the driver hands over plain BSON objects; Mongoose walks them against the schema, attaching getters, applying defaults to missing paths and wrapping the result in a Document that remembers which paths changed. On \`save()\`, Mongoose diffs those tracked paths and issues an \`updateOne\` containing only \`$set\`/\`$unset\` for the changed ones — that is why saving a document you never modified performs no write.
    `,
    codeExamples: [
      {
        title: "Schema, model, document",
        language: "ts",
        code: `import mongoose, { Schema, models, model } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    dueDate: Date,
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

taskSchema.virtual("isLate").get(function (this: any) {
  return !this.done && this.dueDate != null && this.dueDate < new Date();
});

taskSchema.methods.complete = function (this: any) {
  this.done = true;
  return this.save();
};

taskSchema.statics.openCount = function () {
  return this.countDocuments({ done: false });
};

export const Task = models.Task || model("Task", taskSchema);

const task = await Task.create({ title: "Write module" });
console.log(task.isLate); // false — a virtual, never stored
await task.complete();`,
        description:
          "The typical production shape: schema with options, virtuals, instance method, static, and a guarded model export so importing the file twice does not crash.",
      },
      {
        title: "What strict mode does",
        language: "ts",
        code: `const plain = { title: "Note", color: "red" }; // 'color' is not in the schema
const saved = await Task.create(plain as any);
console.log(saved.toObject()); // { title: "Note", ... } — color was dropped

const updated = await Task.updateOne(
  { _id: saved._id },
  { $set: { color: "red" } } as any,
);
console.log(updated.modifiedCount); // 0 — strict filters unknown $set paths too`,
        description:
          "Unrecognised fields disappear rather than error. Either add the path to the schema or set strict: false (or strictQuery where relevant) deliberately.",
      },
    ],
    commonMistakes: [
      "Forgetting that strict mode silently removes unknown fields, then hunting for a 'save bug' that is really a schema mismatch.",
      "Re-registering a model on every import in a hot-reload dev server — use the models.Name || model(...) guard.",
      "Expecting virtuals in res.json() without toJSON: { virtuals: true }.",
      "Putting business logic in controllers that belongs in schema.methods or statics, so it cannot be reused by scripts and jobs.",
    ],
    bestPractices: [
      "Keep schemas in their own module and export compiled models with the registration guard.",
      "Model ref fields with { type: Schema.Types.ObjectId, ref: \"User\" } from day one so populate works later.",
      "Use select: false for secrets (password hash, refresh tokens) so they never leak by default.",
      "Prefer schema statics/methods over ad-hoc queries duplicated across routes.",
    ],
    realWorldUseCases: [
      "A shared User schema used by auth, profile and admin modules with one place to change defaults.",
      "Virtuals for API presentation (initials, displayPrice) without storing derived data.",
    ],
    resources: [
      docs(
        "Mongoose — Schemas guide",
        OFFICIAL.mongooseSchemas,
        "Official introduction to schemas, definitions and options.",
      ),
      docs(
        "Mongoose — Models",
        "https://mongoosejs.com/docs/models.html",
        "Compiling models, constructing documents and the model API.",
      ),
      docs(
        "Mongoose API reference",
        "https://mongoosejs.com/docs/api.html",
        "Every Schema option, Model method and Document method.",
      ),
      ytSearch(
        "Mongoose schema and model tutorial for Node.js",
        "Beginner-to-intermediate walkthroughs of schema design in Mongoose.",
        "en",
        "15–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-mongoose-user-schema",
        title: "Design a User schema",
        prompt:
          "Create a User schema with: email (required, lowercase, unique), passwordHash (required, select: false), displayName (trimmed, max 40 chars via maxlength), role enum with a default, an embedded preferences sub-document with its own defaults, timestamps, a virtual initials getter and an instance method promoteTo(role). Show the strict-mode pitfall in two lines of code.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "select: false keeps passwordHash out of every find() unless you .select('+passwordHash')",
          "Virtuals are declared with schema.virtual(...).get(fn) and need toJSON: { virtuals: true } to appear in JSON",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-task-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-validation",
    slug: "mongoose-validation",
    title: "Mongoose Validation and Casting",
    description:
      "Built-in validators, custom and async validators, casting versus validation, update validators, unique indexes and mapping errors to HTTP responses.",
    order: 11,
    estimatedMinutes: 22,
    tags: ["mongoose", "validation", "errors", "api-design"],
    prerequisites: ["p2m3-mongoose-schemas-models", "p2m2-input-validation"],
    relatedTopics: ["p2m3-mongoose-hooks", "p2m3-crud", "p2m2-input-validation"],
    learningObjectives: [
      "Apply built-in and custom validators on schema paths",
      "Explain the order: cast → validate → persist",
      "Run validators on update queries and understand their limits",
      "Translate ValidationError, CastError and code 11000 into correct HTTP responses",
    ],
    simpleExplanation:
      "Mongoose validates data in two steps: first it *casts* your input to the declared type (`\"42\"` becomes `42`, garbage becomes a CastError), then it runs validators such as `required`, `enum`, `match` or your own function. Validation happens automatically on `save()` and `create()` — but update queries skip it unless you ask for it with `runValidators: true`.",
    detailedContent: `
**Casting comes first.** \`age: Number\` will happily turn \`"17"\` into \`17\`. If it cannot (\`"seventeen"\`), you get a **CastError** with \`err.path\` and \`err.value\` — a client problem, not a server bug. Casting also normalises: \`lowercase\` and \`trim\` run as setters before validation.

**Built-in validators** (all declared on the path):

- \`required: true\` — fails for \`undefined\`, \`null\`, \`""\` (and, for arrays, an empty array).
- \`enum: [...]\`, \`min\`/\`max\` (numbers and dates), \`minlength\`/\`maxlength\` (strings), \`match: /regex/\`.
- \`validate: { validator: fn, message: "..." }\` for anything custom, including async:

\`\`\`
username: {
  type: String,
  validate: {
    validator: async (v) => !(await User.exists({ username: v })),
    message: "username is taken",
  },
},
\`\`\`

**Validation vs uniqueness.** \`unique: true\` creates a **unique index** — it is a database constraint, not a validator, and two concurrent inserts can both pass a \`Model.exists\` check before either commits. Handle \`err.code === 11000\` (duplicate key) and map it to **409 Conflict**; race conditions are solved by the index, not by a pre-check.

**Update validators.** Queries like \`updateOne\` and \`findOneAndUpdate\` do **not** validate by default. With \`{ runValidators: true }\` they validate the paths in the update, and only for \`$set\` and \`$unset\` operations — \`$inc\`, \`$push\` and friends are not validated, and \`required\` is not enforced on a path the update does not touch. Use \`context: "query"\` when a validator needs \`this\` as the Query.

**Error mapping** (mirror what you learned in input validation):

| Error | Meaning | HTTP |
| --- | --- | --- |
| \`ValidationError\` (\`err.errors\`) | one or more paths failed | 422 |
| \`CastError\` | value could not be converted to the path type | 400 |
| \`err.code === 11000\` | unique index violated | 409 |
| Mongoose strict drop | unknown field silently ignored | — |
    `,
    howItWorks: `
Each schema path stores a list of validators and a cast function. On \`save()\` Mongoose runs \`document.$validate()\`: for every modified (and required) path it executes the cast function, then awaits validators **sequentially in declaration order**, stopping at the first failure but collecting failures from *all* paths into a single \`ValidationError\` keyed by path. \`post('validate')\` hooks and \`pre('save')\` hooks therefore run only if validation passed — which is exactly where you hash a password (the hash must not be re-validated as a password rule).

Async validators run on the event loop like any promise; a validator that never resolves hangs the save, so give network-backed validators their own timeouts. Mongoose does not retry them — every \`save\` re-runs them unless you mark a path \`isSelected\`/unchanged, because only changed paths are re-validated.
    `,
    codeExamples: [
      {
        title: "Validators, custom checks and error handling",
        language: "ts",
        code: `const userSchema = new Schema({
  email: { type: String, required: [true, "email is required"], unique: true },
  age: { type: Number, min: [13, "users must be at least 13"], max: 120 },
  status: { type: String, enum: { values: ["active", "banned"], message: "bad status" } },
  referralCode: {
    type: String,
    validate: {
      validator: (v: string) => /^[A-Z]{3}-\\d{4}$/.test(v),
      message: "expected format ABC-1234",
    },
  },
});
const User = model("User", userSchema);

try {
  await User.create({ email: "ada@example.com", age: 11 });
} catch (err: any) {
  if (err.name === "ValidationError") {
    // err.errors.age.path === 'age', err.errors.age.message === 'users must be at least 13'
    res.status(422).json({ errors: err.errors });
  } else if (err.code === 11000) {
    res.status(409).json({ error: "email already registered" });
  } else {
    throw err;
  }
}`,
        description:
          "Array-form messages, per-path error objects, and the two non-ValidationError cases your API must also handle.",
      },
      {
        title: "Validating an update query",
        language: "ts",
        code: `// No validation by default: an invalid status would be written as-is? No —
// casting still happens, but validators (enum, min...) are skipped.
await User.updateOne({ _id }, { $set: { age: 5 } });

// Opt in:
const result = await User.updateOne(
  { _id },
  { $set: { age: 5 } },
  { runValidators: true, context: "query" },
);

// Validate an object without persisting it (handy for PATCH previews)
const report = await User.validate({ email: "not-an-email" }, ["email"]);`,
        description:
          "runValidators covers only $set/$unset paths; casting always runs. Model.validate() is useful when you want the same rules outside a document save.",
      },
    ],
    commonMistakes: [
      "Treating unique: true as a validation that runs on create — it is an index, so duplicates surface as E11000 under concurrency.",
      "Expecting runValidators to check $inc or $push payloads; those operators are never validated.",
      "Hashing passwords in a validator instead of a pre('save') hook — validators may run more than once and must stay pure.",
      "Returning 500 for a ValidationError that is really client input worth a 422.",
    ],
    bestPractices: [
      "Validate shape at the API boundary (zod/joi) for fast feedback, and keep schema validators as the last line of defence.",
      "Give every validator a message a user can act on, and surface err.errors keyed by field.",
      "Handle code 11000 explicitly instead of relying on a pre-check existence query.",
      "Keep validators synchronous and cheap; push uniqueness checks into the index.",
    ],
    realWorldUseCases: [
      "Registration endpoints mapping enum/min errors straight onto form fields.",
      "PATCH endpoints using findOneAndUpdate({ runValidators: true }) so partial updates cannot write out-of-range values.",
    ],
    resources: [
      docs(
        "Mongoose — Validation",
        "https://mongoosejs.com/docs/validation.html",
        "Built-in validators, custom validators, update validators and error shapes.",
      ),
      docs(
        "Mongoose API — ValidationError",
        "https://mongoosejs.com/docs/api/error.html",
        "Error classes Mongoose throws and their fields.",
      ),
      docs(
        "MongoDB Manual — Unique indexes and E11000",
        "https://www.mongodb.com/docs/manual/core/index-unique/",
        "How uniqueness is enforced server-side, including duplicates on index build.",
      ),
      ytSearch(
        "Mongoose validation tutorial custom validators errors",
        "Worked examples of schema validators and error responses.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-validation-patch",
        title: "Safe PATCH",
        prompt:
          "A PATCH /users/:id endpoint accepts displayName and age. Write the Mongoose update call that casts and validates both fields, and write the catch block that maps ValidationError → 422, CastError → 400 and duplicate key → 409. Then explain which of these cannot be caught by runValidators: an update using $inc, an update adding a field not in the schema, or a $set of an invalid enum value.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "findOneAndUpdate(filter, { $set: ... }, { runValidators: true, new: true, context: \"query\" })",
          "Think about which operations update validators are documented to inspect",
        ],
        solution: `try {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { displayName: req.body.displayName, age: req.body.age } },
    { runValidators: true, context: "query", new: true },
  );
  if (!user) return res.status(404).json({ error: "not found" });
  return res.json(user);
} catch (err: any) {
  if (err.name === "ValidationError") {
    return res.status(422).json({ errors: err.errors });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "invalid id or value" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "duplicate value" });
  }
  throw err;
}

// $inc is never validated; unknown $set paths are dropped by strict
// mode (so they never reach the database at all); a $set with an
// invalid enum value IS caught when runValidators: true is set.`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-auth-api", "p2-url-shortener"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-hooks",
    slug: "mongoose-hooks",
    title: "Mongoose Hooks (Middleware)",
    description:
      "pre/post hooks for documents, queries and aggregations: where this points, how errors propagate, and the correct place for password hashing and denormalisation.",
    order: 12,
    estimatedMinutes: 21,
    tags: ["mongoose", "hooks", "middleware", "cross-cutting"],
    prerequisites: ["p2m3-mongoose-schemas-models", "p2m1-error-propagation"],
    relatedTopics: ["p2m3-mongoose-validation", "p2m3-crud", "p2m1-code-organization"],
    learningObjectives: [
      "Register pre and post middleware for document, query and aggregate contexts",
      "Know what this is in each context and how to read/modify the update",
      "Explain how throwing inside a hook rejects the calling promise",
      "Place cross-cutting logic (hashing, timestamps, denormalised counters) in the right hook",
    ],
    simpleExplanation:
      "Hooks let you run code automatically before or after an operation — hash a password on save, add a $set in findOneAndUpdate, hide sensitive fields on toJSON. Mongoose picks the middleware type from the event you register (`save` is document middleware, `findOneAndUpdate` is query middleware), and `this` changes meaning accordingly, which is the main thing to get right.",
    detailedContent: `
**Two (and a half) middleware kinds:**

| Kind | Events | \`this\` is | Runs for |
| --- | --- | --- | --- |
| Document | \`save\`, \`validate\`, \`deleteOne\` (document), \`remove\` (legacy) | the Document | \`doc.save()\`, \`Model.create()\` |
| Query | \`find\`, \`findOne\`, \`findOneAndUpdate\`, \`updateOne\`, \`deleteOne\` | the Query | any matching query call |
| Aggregate | \`aggregate\` | the Aggregate | \`Model.aggregate()\` |

Important boundaries:

- \`Model.updateOne()\` triggers **query** middleware only — no \`save\` hooks, no document \`validate\` hooks, no instance methods.
- \`doc.deleteOne()\` vs \`Model.deleteOne()\` select document or query middleware; Mongoose lets you choose explicitly with \`{ document: true, query: false }\`.
- \`bulkWrite\`, \`insertMany\` (only its own \`insertMany\` events) and driver-level operations bypass your \`save\` hooks entirely.

**Reading and writing updates in query middleware:**

\`\`\`
schema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  this.setUpdate({ ...update, $set: { ...update.$set, updatedAt: new Date() } });
});
\`\`\`

**Async style.** Declare hooks as \`async\` functions (or accept \`next\` and call it exactly once). A hook that returns a promise is awaited; an error thrown or a rejected promise inside \`pre\` **aborts the operation** and rejects the caller — the same error-propagation discipline you use in Express, applied to data access.

**Where things belong:**

- Password hashing → \`pre('save')\` guarded by \`isModified('password')\`, never in a validator.
- \`updatedAt\` → \`timestamps: true\` (or a \`pre('findOneAndUpdate')\` hook if you need custom logic).
- Denormalised counters (commentCount) → \`post('save')\` on the child or \`post('deleteOne')\`, ideally inside the same transaction.
- Hiding secrets → \`toJSON\` transform or \`select: false\`.
- Analytics guards (block $out in production) → \`pre('aggregate')\`.
    `,
    howItWorks: `
When you register \`schema.pre('save', fn)\`, Mongoose stores the function in an internal Kareem hook stack keyed by event and middleware type. On \`doc.save()\` it first runs \`validate\` middleware, then executes the \`save\` stack serially — each async function is awaited in declaration order — then performs the actual \`updateOne\`, then runs the \`post\` stack, resolving the promise returned by \`save()\`.

For query middleware the same stack runs, but the hook receives the Query so it can mutate the filter, the update, or the options (including injecting \`{ session }\`). Because hooks run in-process, they are free of extra round-trips, but they are also invisible to anything that bypasses Mongoose — a reason to keep critical invariants in the database (unique indexes, transactions) rather than only in hooks.
    `,
    codeExamples: [
      {
        title: "Document middleware: hash on save",
        language: "ts",
        code: `userSchema.pre("save", async function () {
  const doc = this as any;
  if (!doc.isModified("passwordHash")) return;
  doc.passwordHash = await bcrypt.hash(doc.passwordHash, 12);
});

userSchema.post("save", function (doc) {
  logger.info({ userId: doc._id }, "user saved");
});

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});`,
        description:
          "isModified keeps hashing idempotent across partial saves; the toJSON transform is the safety net for responses that forget to strip secrets.",
      },
      {
        title: "Query middleware: stamp updates",
        language: "ts",
        code: `userSchema.pre("findOneAndUpdate", function () {
  const update = (this as any).getUpdate() ?? {};
  this.setUpdate({
    ...update,
    $set: { ...(update.$set ?? {}), lastTouchedAt: new Date() },
  });
});

// Runs for aggregation pipelines
userSchema.pre("aggregate", function () {
  const pipeline = (this as any).pipeline();
  // never let a report pipeline write to disk in production
  if (pipeline.some((s: any) => s.$out || s.$merge)) {
    throw new Error("writes via aggregation are not allowed");
  }
});`,
        description:
          "Query middleware modifies the operation before it reaches the database — this is how timestamps and forced $set fields survive even when the caller forgets them.",
      },
    ],
    commonMistakes: [
      "Assuming Model.updateOne() runs your pre('save') password hook — it does not; use query middleware or document.save().",
      "Declaring function (next) without calling next, so save() hangs forever; prefer async functions.",
      "Doing work that must be atomic in a hook while the caller runs without a session, so the hook writes outside the transaction.",
      "Hashing the password in a validator, which may run repeatedly and on untrusted paths.",
    ],
    bestPractices: [
      "Guard hashing with isModified so unrelated saves do not re-hash a hash.",
      "Keep hooks small and pure where possible; anything with external side effects belongs in application code with retries.",
      "Add hook stacks deliberately for deleteOne: specify { document, query } options so you know which fires.",
      "Test hooks by asserting on the database state, not just that the promise resolved.",
    ],
    realWorldUseCases: [
      "Automatic password hashing and secret stripping on every auth flow.",
      "Maintaining denormalised counters and feeds whenever a child document changes.",
    ],
    resources: [
      docs(
        "Mongoose — Middleware",
        "https://mongoosejs.com/docs/middleware.html",
        "Document, query and aggregate middleware with options and ordering.",
      ),
      docs(
        "Mongoose — Queries",
        "https://mongoosejs.com/docs/queries.html",
        "How queries execute lazily and how query middleware fits in.",
      ),
      ytSearch(
        "Mongoose middleware pre save hooks tutorial",
        "Examples of hooks for hashing, timestamps and cascading writes.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-hooks-counter",
        title: "Count comments with hooks",
        prompt:
          "Design the hooks that keep post.commentCount correct when a Comment is created and when it is deleted, and explain why the increment should use $inc rather than reading the post and writing a new count. State which hook event fires for Comment.create() and which for Comment.deleteOne({ _id }) called on the model.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "Model.create() runs document save middleware, so post('save') fires on the comment",
          "Model.deleteOne() is query middleware — register post('deleteOne', { query: true, document: false })",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-blog-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-populate",
    slug: "mongoose-populate",
    title: "Mongoose populate",
    description:
      "Resolving references in one call: ref paths, select/match options, refPath, virtual populate, batching behaviour and avoiding the N+1 problem.",
    order: 13,
    estimatedMinutes: 20,
    tags: ["mongoose", "populate", "relationships", "n-plus-one"],
    prerequisites: ["p2m3-relationships", "p2m3-mongoose-schemas-models"],
    relatedTopics: ["p2m3-aggregation", "p2m3-mongoose-pagination", "p2m3-crud"],
    learningObjectives: [
      "Declare ref fields and resolve them with populate",
      "Limit populated data with select, match, limit and transform options",
      "Explain how populate batches queries and where N+1 still appears",
      "Use virtual populate for one-to-many in the reverse direction",
    ],
    simpleExplanation:
      "When one document stores an `authorId`, populate fetches the matching document and hands it back in an `author` field, as if it had been embedded. Mongoose does this with one extra query per populated path — batched across every parent document — so loading 20 posts still costs only one users query, not twenty.",
    detailedContent: `
**The minimum:** declare the reference on the schema and populate at query time.

\`\`\`
const postSchema = new Schema({
  title: String,
  authorId: { type: Schema.Types.ObjectId, ref: "User" },
});
await Post.find().populate("authorId", "displayName avatar");
\`\`\`

The second argument is the **select** list (plus \`_id\`, which is included unless you exclude it). Populate never returns the raw id once replaced — the field becomes the full document.

**Options you will actually use:**

- \`select\` — project fields; prefix with \`-\` to exclude (e.g. \`"-passwordHash"\`).
- \`match\` — filter the populated side: \`{ match: { active: true } }\`. Non-matching parents get \`null\` for the field.
- \`model\` — resolve a ref declared as a string without a schema \`ref\`.
- \`transform\` / \`perDocumentLimit\` — shape results or cap arrays per parent, not globally.
- \`options: { lean: true }\` — populate into plain objects.

**Where the reference lives.** \`populate("authorId")\` works on a field in the document. For arrays, \`populate("tagIds")\` resolves each element. For a field whose model varies per document, use **refPath**:

\`\`\`
notificationSchema.add({
  item: { type: ObjectId, required: true, refPath: "itemModel" },
  itemModel: { type: String, required: true, enum: ["Post", "Comment"] },
});
\`\`\`

**Reverse direction (one-to-many from the parent).** Instead of storing \`commentIds\` on the post, declare a **virtual populate**:

\`\`\`
postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
  options: { sort: { createdAt: -1 }, limit: 20 },
});
await Post.findById(id).populate("comments");
\`\`\`

Virtuals need \`toJSON: { virtuals: true }\` to appear in responses and must be populated explicitly.

**Cost model.** One extra query per populated path, **batched with $in** across the whole result set: 20 posts → 1 users query. N+1 reappears if you populate inside a loop, populate a path inside another populated sub-document for each parent, or call \`doc.populate()\` one document at a time. For joins that must happen in the database (with filtering on both sides), use \`$lookup\` inside \`aggregate()\` instead.
    `,
    howItWorks: `
When a query with populate executes, Mongoose first runs your original query and collects the result documents. It then walks each populate descriptor, gathers every referenced id (or every value of an array path), deduplicates them, and issues a single \`find({ _id: { $in: ids } })\` with the descriptor's \`select\` and \`match\` applied. The results are indexed into a Map keyed by \`String(id)\`, and each parent's field is replaced with the matching entry — or \`null\` when nothing matched.

Because this all happens after the main query, populate costs **2 round-trips for 1 path, 3 for 2 paths**, independent of how many parents you loaded — until you trigger per-document or looped population, which is where the classic N+1 returns.
    `,
    codeExamples: [
      {
        title: "Populate with select, match and nesting",
        language: "ts",
        code: `const posts = await Post.find({ published: true })
  .sort({ createdAt: -1 })
  .limit(20)
  .populate({
    path: "authorId",
    select: "displayName avatar -email",
    match: { active: true },
  })
  .populate({ path: "categoryId", select: "name" })
  .lean();

// authorId may be null if the author account was deactivated
const payload = posts.map((p) => ({
  title: p.title,
  author: p.authorId ? p.authorId.displayName : null,
  category: p.categoryId?.name ?? null,
}));`,
        description:
          "Two paths = two extra batched queries, regardless of the 20 parents. .lean() keeps everything as plain objects since the response is a serialised DTO anyway.",
      },
      {
        title: "Virtual populate for comments",
        language: "ts",
        code: `const postSchema = new Schema(
  { title: String },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
  options: { sort: { createdAt: -1 }, limit: 20 },
});

const post = await Post.findById(req.params.id).populate({
  path: "comments",
  select: "body authorId",
  populate: { path: "authorId", select: "displayName" },
});

// Avoid N+1: populate is called once on one document, and the nested
// populate is still batched across all 20 comments in a single query.`,
        description:
          "Deep population: comments are loaded, then their authors — still only three queries in total. The nested populate descriptor is applied to every comment at once.",
      },
    ],
    commonMistakes: [
      "Calling populate inside a for await loop over documents — one query per document instead of one batched query.",
      "Forgetting that a non-matching or deleted referenced document yields null and crashing on p.author.name.",
      "Expecting populate to work without a ref on the path, or with a model name Mongoose has not registered.",
      "Assuming populated arrays are paginated globally: perDocumentLimit applies to each parent separately.",
    ],
    bestPractices: [
      "Select only the fields the endpoint renders; populate is the easiest place to leak passwordHash by accident.",
      "Use .lean() for read-only endpoints and hydrate only when you plan to save.",
      "Keep a single populate call per query and batch deep paths with nested populate descriptors.",
      "Switch to aggregate + $lookup when the join itself needs filtering, sorting or grouping.",
    ],
    realWorldUseCases: [
      "A blog feed returning posts with author profile and category in one response.",
      "Notifications that reference different collections (post or comment) through refPath.",
    ],
    resources: [
      docs(
        "Mongoose — populate",
        "https://mongoosejs.com/docs/populate.html",
        "Official guide covering select, match, deep populate, refPath and virtual populate.",
      ),
      docs(
        "Mongoose — Query.prototype.populate API",
        "https://mongoosejs.com/docs/api/query.html#query-populate",
        "Every option accepted by populate and its default behaviour.",
      ),
      ytSearch(
        "Mongoose populate tutorial ref virtual populate",
        "Examples of deep population, refPath and avoiding N+1 queries.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-populate-feed",
        title: "One query plan for a feed",
        prompt:
          "A feed endpoint returns 20 posts, each with an author (name, avatar only, active accounts only) and up to 5 top-level comments with their authors. Write the Mongoose query, count the database round-trips it makes, and show the naive loop version that would cause an N+1 problem.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "One find, one populate for authorId, one populate for comments with a nested populate for its authorId",
          "Batched populate = 3 extra queries total; a populate inside a for await loop = 20+ per document",
        ],
      },
    ],
    projectIds: ["p2-blog-api", "p2-job-board-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-pagination",
    slug: "mongoose-pagination",
    title: "Pagination in Mongoose",
    description:
      "Page-based skip/limit pagination, countDocuments vs estimatedDocumentCount, keyset (cursor) pagination, limit sanitisation and a reusable paginate helper.",
    order: 14,
    estimatedMinutes: 19,
    tags: ["mongoose", "pagination", "performance", "api-design"],
    prerequisites: ["p2m3-mongoose-schemas-models", "p2m2-pagination-filtering-sorting"],
    relatedTopics: ["p2m3-indexes", "p2m3-filtering-sorting", "p2m3-aggregation"],
    learningObjectives: [
      "Implement page/limit pagination with Mongoose including the total count",
      "Choose between countDocuments and estimatedDocumentCount",
      "Build keyset pagination that stays fast on deep pages",
      "Sanitise client-supplied page and limit values",
    ],
    simpleExplanation:
      "Pagination takes a slice of a result set: sort everything, skip to the page offset, and limit how many documents come back. It works well for the first few pages, but skipping thousands of rows gets slower as you go — so feeds and infinite scroll switch to cursor pagination, which asks for 'the next 20 after this point' instead of 'rows 4000–4020'.",
    detailedContent: `
**Page-based (offset) pagination.** The pattern you will use most:

\`\`\`
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
const filter = { status: "published" };

const [items, total] = await Promise.all([
  Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(),
  Post.countDocuments(filter),
]);

return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
\`\`\`

Three details make or break this:

1. **Deterministic sort.** Always add \`_id\` as a tiebreaker; otherwise documents with equal \`createdAt\` can appear on two pages or on none.
2. **Sanitise limit.** Cap it (here 100) — a client asking for \`limit=100000\` is either a bug or a denial-of-service attempt.
3. **Count cost.** \`countDocuments(filter)\` scans (or uses an index) to count exactly. \`estimatedDocumentCount()\` reads collection metadata — fast but it **ignores your filter**, so it is only valid for "how many documents in the whole collection".

**Why offset pagination degrades.** \`skip(40000)\` walks and discards 40,000 index entries on every request, and new inserts shift the offsets so rows repeat or vanish while users scroll.

**Keyset (cursor) pagination.** Remember the last item's sort key and ask for the next window:

\`\`\`
const filter = { status: "published" };
if (cursor) {
  const last = JSON.parse(Buffer.from(cursor, "base64").toString());
  filter.createdAt = { $lt: new Date(last.createdAt) };
  // with a compound sort { createdAt: -1, _id: -1 } also add an _id tiebreak
}
const items = await Post.find(filter)
  .sort({ createdAt: -1, _id: -1 })
  .limit(limit + 1)
  .lean();
\`\`\`

Fetch \`limit + 1\` rows; an extra row means a next page, and the cursor comes from the last returned row (base64 JSON, so clients cannot tamper). Lookups then scan from a known point — constant cost at any depth.

**Mongoose has no built-in paginate.** Use a small helper (as above), a plugin such as \`mongoose-paginate-v2\`, or an aggregation with \`$facet\` to get \`items\` and \`totalDocs\` in one round-trip.
    `,
    howItWorks: `
\`skip\` and \`limit\` are cursor options, not query operators: the server executes the query and index traversal, then discards the first \`skip\` documents before returning \`limit\` of them. With an index matching the sort, documents arrive pre-ordered, so the server only has to count — which is why skip costs O(skip) but never a full sort.

\`countDocuments\` compiles to a \`$group\` with \`$sum: 1\` over your filter (or uses an index-covered count when possible); \`estimatedDocumentCount\` reads WiredTiger's collection-level document count directly. A keyset query instead seeks the index to the cursor value and scans forward — the same work whether you are on page 1 or page 50,000.
    `,
    codeExamples: [
      {
        title: "Reusable Mongoose paginate helper",
        language: "ts",
        code: `type PageOptions = {
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
  page?: number;
  limit?: number;
};

async function paginate<T>(
  model: any,
  { filter = {}, sort = { createdAt: -1, _id: -1 }, page = 1, limit = 20 }: PageOptions,
) {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: skip + items.length < total,
    },
  };
}

// GET /api/jobs?page=3&limit=50
const result = await paginate(Job, {
  filter: { remote: true, "location.city": "Amman" },
  page: Number(req.query.page),
  limit: Number(req.query.limit),
});`,
        description:
          "One helper reused by every list endpoint: sanitised inputs, a deterministic sort, and the count running in parallel with the page query.",
      },
      {
        title: "Cursor pagination with an opaque token",
        language: "ts",
        code: `async function listAfter(cursor: string | undefined, limit: number) {
  const filter: Record<string, unknown> = { status: "published" };

  if (cursor) {
    const { createdAt, _id } = JSON.parse(
      Buffer.from(cursor, "base64").toString("utf8"),
    );
    // sort is { createdAt: -1, _id: -1 }, so the compound bound is:
    filter.$or = [
      { createdAt: { $lt: new Date(createdAt) } },
      { createdAt: new Date(createdAt), _id: { $lt: new ObjectId(_id) } },
    ];
  }

  const rows = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last
    ? Buffer.from(
        JSON.stringify({ createdAt: last.createdAt, _id: last._id }),
        "utf8",
      ).toString("base64")
    : null;

  return { items, nextCursor };
}`,
        description:
          "The $or bound is the correct way to express 'strictly after this row' for a descending compound sort — it avoids repeats when many rows share the same timestamp.",
      },
    ],
    commonMistakes: [
      "Trusting req.query.limit without a cap — one client can request the whole collection in a single response.",
      "Sorting only on createdAt, so rows with identical timestamps flicker between pages.",
      "Using estimatedDocumentCount() for a filtered list and returning a total that ignores the filter.",
      "Combining skip with an unstable sort or with live inserts, then reporting 'duplicate items on page 2' as a bug.",
    ],
    bestPractices: [
      "Keep the sort deterministic (business key + _id) on every paginated endpoint.",
      "Return an opaque cursor for feeds and infinite scroll; reserve skip/limit for admin tables with shallow pages.",
      "Run the items query and the count query in parallel with Promise.all (or $facet for one round-trip).",
      "Index the sort key together with the filter keys so the traversal is index-ordered and no in-memory sort appears.",
    ],
    realWorldUseCases: [
      "Job boards and marketplaces paging through thousands of filtered listings.",
      "Twitter-style feeds where new inserts must not shift older items between pages.",
    ],
    resources: [
      docs(
        "MongoDB Manual — cursor.skip()",
        "https://www.mongodb.com/docs/manual/reference/method/cursor.skip/",
        "Semantics and performance notes for offset pagination.",
      ),
      docs(
        "Mongoose — Queries",
        "https://mongoosejs.com/docs/queries.html",
        "Chaining sort/skip/limit and executing the query lazily.",
      ),
      docs(
        "MongoDB Manual — countDocuments() vs estimatedDocumentCount()",
        "https://www.mongodb.com/docs/manual/reference/method/db.collection.countDocuments/",
        "When an exact filtered count is required and when metadata is enough.",
      ),
      ytSearch(
        "MongoDB pagination skip limit vs cursor pagination",
        "Comparisons of offset and keyset pagination with index examples.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-pagination-cursor",
        title: "Fix the deep page",
        prompt:
          "A listings endpoint uses .skip(page * 20) and reports that page 40 takes 900 ms while page 1 takes 8 ms, and that items sometimes repeat when a new listing is inserted. Diagnose both symptoms and rewrite the endpoint to use keyset pagination, including how the cursor is encoded and validated.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "skip cost is proportional to the offset; inserts shift offsets between requests",
          "Encode { lastKey, lastId } as base64, bound the filter with $or, and fetch limit + 1 rows",
        ],
        solution: `// Diagnosis
// 1) skip(780) walks and throws away 780 index entries on every request.
// 2) Offsets are positional, so a concurrent insert shifts every row by one.

// Rewrite: keyset pagination
const filter: any = { status: "active" };
if (req.query.cursor) {
  const raw = Buffer.from(String(req.query.cursor), "base64").toString("utf8");
  const { price, _id } = JSON.parse(raw);
  if (typeof price !== "number" || !_id) return res.status(400).json({ error: "bad cursor" });
  filter.$or = [
    { price: { $gt: price } },
    { price, _id: { $gt: new mongoose.Types.ObjectId(_id) } },
  ];
}

const rows = await Listing.find(filter)
  .sort({ price: 1, _id: 1 })
  .limit(21)
  .lean();

const items = rows.slice(0, 20);
const last = items[items.length - 1];
const nextCursor = rows.length > 20 && last
  ? Buffer.from(JSON.stringify({ price: last.price, _id: last._id })).toString("base64")
  : null;

return res.json({ items, nextCursor });`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: ["p2-job-board-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m3",
  },
  {
    ...shared,
    id: "p2m3-mongoose-connection-management",
    slug: "mongoose-connection-management",
    title: "Connection Management and Pooling",
    description:
      "connect() options, connection events, buffering behaviour, pools, graceful shutdown, multiple connections and turning driver errors into reliable APIs.",
    order: 15,
    estimatedMinutes: 18,
    tags: ["mongoose", "connections", "reliability", "operations"],
    prerequisites: ["p2m3-mongoose-schemas-models", "p2m2-express-app"],
    relatedTopics: ["p2m3-atlas", "p2m1-error-propagation", "p2m3-transactions"],
    learningObjectives: [
      "Open and close a Mongoose connection with sensible options",
      "Interpret readyState and connection events for health checks",
      "Explain connection pooling and Mongoose's command buffering",
      "Shut down gracefully and host models across multiple connections",
    ],
    simpleExplanation:
      "Mongoose keeps a pool of TCP sockets to your cluster so queries can run in parallel, and it buffers commands for a few seconds while the connection is still coming up. Managing that lifecycle — connect once at startup, listen to events, drain on shutdown — is what separates a service that survives a database blip from one that crashes on the first deploy.",
    detailedContent: `
**Connect once, at startup:**

\`\`\`
await mongoose.connect(uri, {
  dbName: "shop",
  maxPoolSize: 10,             // sockets per server
  minPoolSize: 0,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
});
\`\`\`

\`maxPoolSize\` is the number of simultaneous operations the driver can run — Node.js is single-threaded, so a pool far larger than your CPU cores mostly adds latency; the default 10 suits most APIs.

**Know the states** (\`mongoose.connection.readyState\`): 0 disconnected, 1 connected, 2 connecting, 3 disconnecting. Useful for a \`/healthz\` endpoint. Events: \`connecting\`, \`connected\`, \`disconnected\`, \`reconnecting\`, \`error\`, \`close\`. Log \`disconnected\` and \`error\` — silent disconnects are the ones that turn into 5-minute request timeouts later.

**Buffering.** If your app calls \`User.find()\` before (or while) connecting, Mongoose **queues the command** for \`bufferTimeoutMS\` (10 s by default) and then fails with \`MongooseError: Operation ... buffering timed out\`. That is friendly in tests and fatal in production misconfigurations, so:

- In tests, either \`await mongoose.connect()\` in global setup or call \`mongoose.set('bufferCommands', false)\` to fail fast.
- In production, connect before listening, and treat a buffering timeout as "the database is down", not as a validation error.

**Graceful shutdown.** On \`SIGTERM\`: stop accepting new work, \`await mongoose.disconnect()\`, then exit. The driver closes sockets after in-flight operations finish, so open requests are not cut off mid-write.

**Multiple connections.** \`mongoose.createConnection(uri)\` returns its own connection with its own models:

\`\`\`
const analytics = await mongoose.createConnection(analyticsUri).asPromise();
const Event = analytics.model("Event", eventSchema);
\`\`\`

Each connection has its own pool — use this for a second database, a different cluster, or isolating a misbehaving workload. Register models on \`connection.model(...)\` rather than the global \`mongoose.model\`.

**Reliability habits.** Set \`serverSelectionTimeoutMS\` low enough that failures surface fast, log the original \`MongoServerError\`/\`MongoNetworkError\` name before mapping to HTTP 503, and never leave the default 30 s server-selection wait as your only signal that the database is unreachable.
    `,
    howItWorks: `
\`mongoose.connect()\` creates (or reuses) a driver \`MongoClient\`, performs the handshake, and stores it on \`mongoose.connection\`. The driver maintains a **pool per server** in the topology: when your code awaits a query, it borrows a socket from the pool, writes the message, and returns it when the reply arrives — so N concurrent requests need N free sockets.

A background monitor thread runs \`hello\` heartbeats every 10 s (plus RTT-based checks), which is how the driver learns about a primary election within seconds and marks servers as eligible/ ineligible. During an election all operations on that server fail with a retryable error; retryable writes replay automatically if you have \`retryWrites=true\` and the operation ran inside a session, while reads may be retried against a secondary depending on your read preference.
    `,
    codeExamples: [
      {
        title: "Startup, health check and graceful shutdown",
        language: "ts",
        code: `import express from "express";
import mongoose from "mongoose";

const app = express();

async function main() {
  await mongoose.connect(process.env.MONGO_URI!, {
    dbName: "shop",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  mongoose.connection.on("disconnected", () => logger.warn("mongo disconnected"));
  mongoose.connection.on("error", (err) => logger.error({ err }, "mongo error"));

  app.get("/healthz", (_req, res) => {
    const ok = mongoose.connection.readyState === 1;
    res.status(ok ? 200 : 503).json({ db: ok ? "up" : "down" });
  });

  const server = app.listen(process.env.PORT ?? 3000);

  const shutdown = async (signal: string) => {
    logger.info(signal);
    server.close();
    await mongoose.disconnect(); // waits for in-flight ops, closes pools
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});`,
        description:
          "Connect before accepting traffic, expose readiness from readyState, and let SIGTERM drain the pool instead of killing sockets mid-write.",
      },
      {
        title: "Two connections, two model namespaces",
        language: "ts",
        code: `import mongoose from "mongoose";

const primary = mongoose.connection; // from mongoose.connect()

const analyticsConn = await mongoose.createConnection(analyticsUri).asPromise();

const eventSchema = new mongoose.Schema(
  { name: String, at: { type: Date, default: Date.now } },
  { timestamps: false },
);

// Registered on ITS connection — not on mongoose.models
const Event = analyticsConn.model("Event", eventSchema, "events");

await Event.create({ name: "page_view" }); // uses the analytics pool
await analyticsConn.close();               // closes only this pool`,
        description:
          "Isolating a high-volume event stream in its own connection keeps its pool and failure modes away from your transactional traffic.",
      },
    ],
    commonMistakes: [
      "Calling mongoose.connect() after app.listen(), so the first requests hit a buffering timeout instead of the database.",
      "Creating a new MongoClient/Mongoose connection per request — pools are meant to be long-lived and shared.",
      "Ignoring mongoose.connection.on('error'), so a certificate expiry is discovered when users do.",
      "Leaving Mongoose's default 30 s server-selection wait as your only timeout, turning a 1 s outage into a 30 s outage for every request.",
    ],
    bestPractices: [
      "One connect() per process, awaited in startup before the server listens.",
      "Set bufferCommands: false in test setup so a missing connection fails immediately and loudly.",
      "Expose a readiness probe backed by readyState (or a cheap ping) and alert on disconnected events.",
      "Use createConnection for a genuinely separate workload, and close it explicitly in shutdown.",
    ],
    realWorldUseCases: [
      "Zero-downtime deploys: SIGTERM drains connections so no request loses its database mid-flight.",
      "Splitting analytics writes onto a second cluster so a traffic spike cannot starve the main API's pool.",
    ],
    resources: [
      docs(
        "Mongoose — Connections",
        "https://mongoosejs.com/docs/connections.html",
        "connect options, pooling, events and disconnect lifecycle.",
      ),
      docs(
        "MongoDB Node.js driver — Connection Pooling",
        "https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/pooling/",
        "How sockets are created, reused and monitored by the driver.",
      ),
      docs(
        "MongoDB Manual — Retryable Writes",
        "https://www.mongodb.com/docs/manual/core/retryable-writes/",
        "What retryWrites=true guarantees and which operations are covered.",
      ),
      ytSearch(
        "Mongoose connection management bufferCommands graceful shutdown",
        "Operational walkthroughs of connecting, monitoring and shutting down Node services.",
        "en",
        "12–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p2m3-conn-readiness",
        title: "Readiness vs liveness",
        prompt:
          "Your orchestrator restarts pods that fail /health. Decide how to implement it for a Mongoose app: which readyState values mean ready, what should happen while Mongoose is buffering, and why process liveness must not depend on the database. Include the shutdown order on SIGTERM.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "readyState === 1 is connected; 2 (connecting) should fail readiness, not kill the process",
          "Shutdown order: stop accepting → finish in-flight → mongoose.disconnect() → exit",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-chat-backend"],
    quizId: "quiz-p2-m3",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m3",
  moduleId: "p2-m3",
  title: "Module 3 quiz — MongoDB & Mongoose",
  description:
    "Test your understanding of documents, CRUD, querying, indexes, aggregation, transactions, Mongoose schemas, validation, hooks, populate, pagination and connections.",
  questions: [
    {
      id: "q-p2m3-1",
      type: "multiple-choice",
      prompt:
        'A document is inserted as { _id: 1, name: "Ada", age: "18", joined: "2020-05-01" }. Which statement is correct?',
      options: [
        "db.people.find({ age: 18 }) returns it, because MongoDB converts the filter value to the type stored in the document",
        'db.people.find({ age: 18 }) does NOT return it, because a string and a number are different BSON types and never compare equal',
        "It is returned only if the collection has a declared schema, since collections enforce their first document's shape",
        "The insert fails with a cast error, because MongoDB refuses mixed types in one collection",
      ],
      correctIndex: 1,
      explanation:
        "BSON comparisons are type-aware: numeric types compare against each other, but a string never equals a number. Collections have no schema to enforce anything, nothing was cast on insert (the driver writes exactly what you gave it), and only a client-side ODM such as Mongoose would have rejected or converted the value.",
      optionExplanations: [
        "The driver does not cast filter values to match stored types; that asymmetry is a classic source of 'my query returns nothing'.",
        "Correct — comparison operators only match values of comparable BSON types, so age: 18 misses \"18\".",
        "MongoDB is schemaless per collection: each document may have entirely different fields.",
        "Inserts accept any valid BSON; only application validation or Mongoose casting would complain.",
      ],
    },
    {
      id: "q-p2m3-2",
      type: "code-output",
      prompt: "What does toArray() return?",
      code: `// orders collection
// { _id: 1, status: "paid",    total: 50  }
// { _id: 2, status: "shipped", total: 20  }
// { _id: 3, status: "paid",    total: 100 }
// { _id: 4, status: "paid",    total: 75  }

const cursor = db.orders.find(
  { status: "paid" },
  { total: 1, _id: 0 },
).sort({ total: -1 });

printjson(await cursor.toArray());`,
      language: "js",
      options: [
        "[{ total: 100 }, { total: 75 }, { total: 50 }]",
        "[{ total: 50 }, { total: 75 }, { total: 100 }]",
        "[{ _id: 3, total: 100 }, { _id: 4, total: 75 }, { _id: 1, total: 50 }]",
        "[{ status: \"paid\", total: 100 }, { status: \"paid\", total: 75 }, { status: \"paid\", total: 50 }]",
      ],
      correctIndex: 0,
      explanation:
        "The filter keeps only the three paid orders, the projection includes total and excludes _id (and status is not included because this is an inclusion projection), and sort({ total: -1 }) orders them 100, 75, 50 — descending.",
      optionExplanations: [
        "Correct — three matching documents, total only, descending by total.",
        "That is ascending order; -1 means descending.",
        "_id: 0 removed _id from every returned document.",
        "Inclusion projections return only the listed fields; status was not listed.",
      ],
    },
    {
      id: "q-p2m3-3",
      type: "multiple-choice",
      prompt:
        "GET /api/customers/:id/orders always runs db.orders.find({ customerId, status: \"paid\" }).sort({ createdAt: -1 }).limit(20) and explain() reports COLLSCAN followed by an in-memory SORT stage. Which single index best fixes it?",
      options: [
        "{ createdAt: -1, customerId: 1 }",
        "{ customerId: 1, status: 1, createdAt: -1 }",
        "{ status: 1 }",
        "{ customerId: 1 }",
      ],
      correctIndex: 1,
      explanation:
        "Following the ESR rule, equality predicates (customerId, status) come first so they narrow the index to a contiguous range, and the sort key createdAt goes last so the index returns rows already ordered — no SORT stage remains. A sort key in first position cannot serve an equality on a non-prefix field, a lone status index is not selective, and { customerId: 1 } still leaves the sort to be done in memory.",
      optionExplanations: [
        "createdAt first serves only a range/sort on createdAt itself; equality on customerId and status would force a wide index scan.",
        "Correct — equality keys first, sort key last: the planner can use the index for both the filter and the ordering.",
        "status alone still requires scanning every paid order and sorting them in memory.",
        "Better than nothing, but the sort on createdAt still needs an in-memory SORT stage.",
      ],
    },
    {
      id: "q-p2m3-4",
      type: "code-output",
      prompt: "The counters collection is empty. What does the second call print?",
      code: `db.counters.updateOne(
  { _id: "orders" },
  { $inc: { seq: 1 } },
  { upsert: true },
);

printjson(db.counters.find({}).toArray());`,
      language: "js",
      options: [
        "[{ _id: \"orders\", seq: 1 }]",
        "[]",
        "[{ _id: \"orders\", seq: 0 }]",
        "[{ seq: 1 }]",
      ],
      correctIndex: 0,
      explanation:
        "No document matched, so the upsert inserts one built from the equality fields of the filter (_id: \"orders\") plus the update operators applied to it — $inc on a missing path starts at 0 and yields 1. The generated document always carries the filter's _id.",
      optionExplanations: [
        "Correct — an upsert inserts { _id: \"orders\" } and applies $inc, producing seq: 1.",
        "Without upsert: true the operation would match nothing and insert nothing.",
        "$inc starts missing paths at 0 and then adds 1, so seq is 1, not 0.",
        "The _id equality in the filter is copied into the upserted document.",
      ],
    },
    {
      id: "q-p2m3-5",
      type: "find-bug",
      prompt: "This endpoint was reported as an authentication bypass. What is the bug?",
      code: `app.post("/api/login", async (req, res) => {
  const user = await User.findOne(req.body);
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  res.json({ token: signToken(user) });
});`,
      language: "ts",
      options: [
        "findOne is not awaited correctly, so user is always a Query object and the null check never triggers",
        "Client input is used directly as the query filter, so a body like { \"email\": { \"$gt\": \"\" }, \"password\": { \"$gt\": \"\" } } matches an account and bypasses the password check",
        "bcrypt.compare must be called with the hash first and the candidate second, otherwise it always returns true",
        "There is no bug: Mongoose casts req.body to the schema types, so operators are stripped before the query runs",
      ],
      correctIndex: 1,
      explanation:
        "This is operator injection: JSON values in req.body are not strings but can be operator objects. MongoDB evaluates $gt against every document, so the filter matches the first user, and the subsequent bcrypt check only proves the attacker's supplied password matches that user's hash — which fails, but many variations (e.g. only matching on email plus skipping the compare when password is absent) log the attacker in. Filters must be built from explicitly selected, validated fields with plain values.",
      optionExplanations: [
        "await is used correctly; the Query is resolved to a document before the null check.",
        "Correct — never pass request bodies straight into find(); pick known scalar fields after validation.",
        "bcrypt.compare(plain, hash) is the correct argument order and returns false for a wrong password.",
        "Mongoose casting affects declared scalar paths but keeps operator objects like $gt intact as query operators.",
      ],
    },
    {
      id: "q-p2m3-6",
      type: "find-bug",
      prompt: "This pipeline should report total revenue per city, but it returns one row. What is wrong?",
      code: `const report = await db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "city", revenue: { $sum: "$total" } } },
  { $sort: { revenue: -1 } },
]);
printjson(report);`,
      language: "js",
      options: [
        "$match must come after $group, otherwise the filter is applied to the wrong stage",
        "_id is a literal string, so every document falls into one bucket; it must be _id: \"$city\" to group by the field",
        "$sort cannot read a computed field such as revenue; sorting must happen before $group",
        "The pipeline is missing $project, which is required whenever $group is used",
      ],
      correctIndex: 1,
      explanation:
        "Inside $group, _id is the grouping key expression: a plain string is a literal value used for every document, producing a single bucket. A field reference must be written with the $ prefix (\"$city\"), which makes the server read the city path of each incoming document. The other stages are fine — $match-first is the recommended order, $sort can reference grouped output, and $project is optional.",
      optionExplanations: [
        "Filtering before grouping is exactly what you want: it lets an index serve the filter and avoids grouping irrelevant rows.",
        "Correct — without the $ prefix \"city\" is a literal, not a field path.",
        "$sort runs on the pipeline stream, so it can sort by any field produced upstream, including aggregated values.",
        "$group output can be returned, sorted or limited without any $project stage.",
      ],
    },
    {
      id: "q-p2m3-7",
      type: "short-answer",
      prompt:
        "Multi-document transactions in the MongoDB Node driver are opened on a session object. Name the method you call on that session to begin a transaction — answer with the method name only (no parentheses needed).",
      acceptedKeywords: ["starttransaction", "start transaction", "session.starttransaction"],
      explanation:
        "session.startTransaction() opens the transaction; every operation inside must receive { session }, and you finish with commitTransaction() or abortTransaction(). In practice you usually call session.withTransaction(async () => {...}) instead, because it starts, commits and retries transient errors for you — but startTransaction() is the underlying method, and transactions require a replica set or sharded cluster.",
    },
    {
      id: "q-p2m3-8",
      type: "code-output",
      prompt: "What does the query return?",
      code: `// products
// { _id: 1, name: "A", price: 10, inStock: true  }
// { _id: 2, name: "B", price: 5,  inStock: false }
// { _id: 3, name: "C", price: 20, inStock: true  }
// { _id: 4, name: "D", price: 15, inStock: true  }
// { _id: 5, name: "E", price: 8,  inStock: true  }

const cursor = db.products
  .find({ inStock: true })
  .sort({ price: 1, _id: 1 })
  .skip(2)
  .limit(2);

printjson(await cursor.toArray());`,
      language: "js",
      options: [
        "[{ _id: 4, name: \"D\", price: 15, inStock: true }, { _id: 3, name: \"C\", price: 20, inStock: true }]",
        "[{ _id: 5, name: \"E\", price: 8, inStock: true }, { _id: 1, name: \"A\", price: 10, inStock: true }]",
        "[{ _id: 1, name: \"A\", price: 10, inStock: true }, { _id: 4, name: \"D\", price: 15, inStock: true }]",
        "[{ _id: 4, name: \"D\", price: 15, inStock: true }, { _id: 5, name: \"E\", price: 8, inStock: true }]",
      ],
      correctIndex: 0,
      explanation:
        "Filter first (four in-stock products: E 8, A 10, D 15, C 20), then sort ascending by price — E, A, D, C — then skip the first two (E and A) and take two: D at 15 and C at 20, in that order. Out-of-stock B never enters the result.",
      optionExplanations: [
        "Correct — skip removes E and A, leaving D and C from the ascending price order.",
        "That is the result without applying skip(2).",
        "That would be the answer if the in-stock filter were ignored (sorted prices 5, 8, 10, 15 → skip 2 gives 10 and 15).",
        "That reverses the ascending sort and returns the wrong two rows.",
      ],
    },
  ],
};



