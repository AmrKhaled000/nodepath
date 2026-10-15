import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p2-m4",
  slug: "sql-postgresql-prisma",
  title: "SQL, PostgreSQL & Prisma",
  description:
    "The relational model and SQL from first principles in PostgreSQL: tables, keys, queries, joins, aggregates, constraints, indexes, transactions and normalisation — then talking to Postgres from Node.js with pg and Prisma, including a safe migrations workflow.",
  phaseId: "phase-2",
  order: 4,
};

const shared = {
  phaseId: "phase-2",
  moduleId: "p2-m4",
  difficulty: "intermediate",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p2m4-relational-fundamentals",
    slug: "relational-model-fundamentals",
    title: "Relational Model Fundamentals",
    description:
      "Tables as entities, rows as records, columns as attributes — and why Codd's relational model has outlived every database fad since 1970.",
    order: 1,
    estimatedMinutes: 14,
    tags: ["sql", "relational-model", "databases", "theory"],
    prerequisites: [],
    relatedTopics: ["p2m4-tables-rows-columns-keys", "p2m4-normalization", "p2m3-schema-design"],
    learningObjectives: [
      "Explain the relational model in terms of relations, tuples and attributes",
      "Map real-world entities to tables, records to rows and fields to columns",
      "Describe why SQL stayed dominant for five decades while document and key-value stores came and went",
      "Recognise that row order is never guaranteed in a relation",
    ],
    simpleExplanation:
      "A relational database stores data in **tables** — the same structure as a spreadsheet. Each table models one kind of thing (users, orders), each **row** is one record of that thing, and each **column** is a fixed attribute (email, created_at). SQL lets you describe the result you want (\"orders over 100, newest first\") and the database figures out the fastest way to produce it.",
    detailedContent: `
In 1970 Edgar F. Codd proposed the **relational model**: data should live in mathematical *relations* — unordered sets of *tuples* (rows) sharing the same *attributes* (columns). Fifty-plus years later, that idea still underpins PostgreSQL, MySQL, SQLite, SQL Server and Oracle.

The vocabulary maps cleanly onto application code:

| Relational term | Everyday term | Example |
| --- | --- | --- |
| Relation | Table | \`users\` |
| Tuple | Row / record | one user |
| Attribute | Column / field | \`email\` |
| Domain | Column type | \`text\`, \`uuid\`, \`timestamptz\` |
| Primary key | Unique row id | \`users.id\` |
| Foreign key | Reference to another table | \`orders.user_id\` |

Two properties of relations matter more than they look:

1. **Rows are unordered.** A relation is a *set*; "the first row" has no meaning. If you need a specific order, you must ask for it with \`ORDER BY\` every time.
2. **Values are atomic.** Each cell holds one value from its domain. Duplicated structures (a comma-separated hobbies column) break queryability — that is what normalisation (lesson 10) eliminates.

**Why SQL survived.** SQL is *declarative*: you state *what* you want, not *how* to loop to get it. That single property let engineers rewrite the query planner five times — from nested loops to cost-based optimisation with statistics — without touching a line of application code. Add strict schemas, transactions (lesson 9), joins across billions of rows and a rock-solid open standard, and you get a format that outlived every "SQL is dead" prediction. Document stores like MongoDB (module p2-m3) trade these guarantees for flexibility; most product teams end up wanting both, which is exactly why PostgreSQL now also stores JSONB documents beside ordinary rows.
    `,
    howItWorks: `
When you execute \`SELECT ... FROM orders WHERE total > 100 ORDER BY created_at DESC\`, PostgreSQL does not walk the table row by row in the order you typed. The **query planner**:

1. Parses SQL into a parse tree, then rewrites it (views, rules).
2. Estimates the cost of several *plans* — sequential scan, index scan, hash join — using table statistics (\`pg_stats\`) and per-operation cost constants.
3. Picks the cheapest estimated plan, executes it with the executor (pulling tuples through operator nodes), and feeds new statistics back for next time.

This is why the same SQL gets faster automatically when you add the right index (lesson 8): the planner simply starts choosing a different plan. Declarative SQL means *you* own correctness; the *engine* owns speed.
    `,
    codeExamples: [
      {
        title: "The relational model in 20 lines of SQL",
        language: "sql",
        code: `-- Entities as tables
CREATE TABLE users (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE
);

CREATE TABLE orders (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  total   numeric(10,2) NOT NULL
);

-- One tuple (row) inserted per record
INSERT INTO users (email) VALUES ('amina@example.com');
INSERT INTO users (email) VALUES ('sam@example.com');

-- Relations are sets: ask for order explicitly, every time
SELECT u.email, o.total
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.total > 100
ORDER BY o.total DESC;`,
        description:
          "Two entities, one relationship (orders belong to users), and a set-based query. Runs on any PostgreSQL 13+ instance — gen_random_uuid() is built in.",
      },
    ],
    commonMistakes: [
      "Assuming rows come back 'in insertion order' — without ORDER BY the engine may return them in any order, and a plan change can reorder them overnight.",
      "Modelling a table as 'a class with methods' — tables hold data only; behaviour belongs in your application (or in views when you have a good reason).",
      "Skipping normalisation because 'MongoDB taught me arrays are fine' — duplicated data in columns means every update becomes a search-and-replace across rows.",
      "Thinking SQL is slow because it is old — hand-written loops over rows almost always lose to a set-based plan the planner can optimise.",
    ],
    bestPractices: [
      "Give every table a single-column primary key (usually a uuid) — composite keys have their place (lesson 7), but a stable id simplifies APIs and ORMs.",
      "Name tables in plural snake_case (users, order_items) and columns in singular snake_case (created_at, user_id) — pick once, apply everywhere.",
      "Always write ORDER BY in API queries even when the data 'looks ordered' — correctness must not depend on plan choice.",
      "When coming from MongoDB (p2-m3), reframe embedded documents as joined tables first; denormalise later only with a measured reason (lesson 10).",
    ],
    realWorldUseCases: [
      "E-commerce: products, orders and order_items are classic relations joined at query time instead of duplicating product data inside every order.",
      "Multi-tenant SaaS: a tenant_id foreign key on every table gives row-level filtering with a single WHERE clause.",
      "Analytics: the same tables power transactional APIs and nightly GROUP BY reports — one source of truth, no sync jobs.",
    ],
    resources: lessonResources({
      official: {
        title: "PostgreSQL Tutorial — The Concept of Tables and Rows",
        url: OFFICIAL.postgresTutorial,
        description: "Official interactive intro: tables, rows, columns and your first queries, run in the browser.",
      },
      videos: [
        {
          query: "relational model explained tables rows columns",
          description: "Short introductions to Codd's relational model and relational vs document databases.",
          estimatedDuration: "8–15 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p2m4-rel-model",
        title: "Model a domain as relations",
        prompt:
          "A library needs: members, books, authors, and loans (a member borrows a book on a date and returns it later). Write down for each concept: the table name, 4–6 column names with types (uuid, text, int, timestamptz, numeric), which column is the primary key, and which columns are foreign keys to which tables. Do not write full SQL yet — just the model.",
        difficulty: "intermediate",
        estimatedMinutes: 20,
        hints: [
          "A loan is a relationship between a member and a book, and it carries its own attributes (borrowed_at, returned_at).",
          "Relationships with their own attributes become their own table (loans), not a comma-separated column.",
        ],
      },
    ],
    projectIds: ["p2-task-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-tables-rows-columns-keys",
    slug: "tables-rows-columns-and-keys",
    title: "Tables, Rows, Columns and Keys",
    description:
      "CREATE TABLE in PostgreSQL: the data types you will actually use (uuid, text, timestamptz, numeric), primary keys, foreign keys and ON DELETE behaviour.",
    order: 2,
    estimatedMinutes: 22,
    tags: ["sql", "ddl", "primary-key", "foreign-key", "postgresql"],
    prerequisites: ["p2m4-relational-fundamentals"],
    relatedTopics: ["p2m4-constraints", "p2m4-prisma-orm", "p2m4-normalization"],
    learningObjectives: [
      "Choose correct PostgreSQL column types for ids, strings, money, booleans and timestamps",
      "Write CREATE TABLE statements with primary keys and foreign keys",
      "Explain every ON DELETE action and pick the right one for a relationship",
      "Explain why uuid primary keys beat sequential integers for public APIs",
    ],
    simpleExplanation:
      "`CREATE TABLE` defines the shape of your data before any row exists: column names, types and rules. A **primary key** uniquely identifies each row and is never NULL. A **foreign key** points at another table's primary key, and its **ON DELETE** action decides what happens to child rows when the parent disappears — cascade them away, blank the reference, or refuse the delete.",
    detailedContent: `
**PostgreSQL types you will use weekly**

| Type | Use for | Notes |
| --- | --- | --- |
| \`uuid\` | Primary keys | 128-bit, unguessable, safe to expose in URLs |
| \`text\` | Any string | No length limit in Postgres; pair with CHECK or app validation |
| \`integer\` / \`bigint\` | Counts, sort keys | bigint for counters that may exceed 2^31 |
| \`timestamptz\` | Instants in time | Always prefer over \`timestamp\`; stores UTC, renders local |
| \`numeric(10,2)\` | Money | Exact decimal — never float for money |
| \`boolean\` | Flags | \`true\` / \`false\`, not 0/1 |
| \`jsonb\` | Semi-structured blobs | Queryable JSON with indexing (carried over from p2-m3 thinking) |

**Keys.** The primary key (\`PRIMARY KEY\`) is \`NOT NULL\` + \`UNIQUE\` in one — it identifies a row and is what foreign keys reference. A **foreign key** (\`REFERENCES other_table(id)\`) enforces that the referenced row exists.

**ON DELETE actions** — every FK should state one deliberately:

| Action | Child rows when parent is deleted |
| --- | --- |
| \`CASCADE\` | Deleted too (a user's sessions die with the user) |
| \`SET NULL\` | FK column set to NULL (column must be nullable) |
| \`RESTRICT\` | Delete refused immediately |
| \`NO ACTION\` (default) | Delete refused (checked at end of statement) |
| \`SET DEFAULT\` | FK set to its DEFAULT value |

\`NO ACTION\` and \`RESTRICT\` differ only in *when* the check happens if several tables are involved in one statement — both refuse.

**uuid vs serial.** \`serial\`/\`bigserial\` create sequential integers: guessable (an attacker can enumerate \`/orders/1041\`) and they leak volume. UUIDs (v4 random, or v7 time-ordered) are safe to expose and merge across environments. PostgreSQL generates them with \`gen_random_uuid()\`, built in since version 13.
    `,
    howItWorks: `
\`CREATE TABLE\` registers a *relation definition* in the system catalog (\`pg_class\`, \`pg_attribute\`, \`pg_constraint\`). No rows are stored yet — just metadata and an empty heap file.

Every \`INSERT\` then runs through constraint checking: NOT NULL, type coercion, CHECK expressions, and foreign key lookups (typically a nested-loop index scan against the parent's PK). A violation aborts the whole statement with an error such as \`violates foreign key constraint "orders_user_id_fkey"\`.

\`ON DELETE CASCADE\` is implemented by PostgreSQL itself: deleting a parent row recursively queues deletes of children referencing it, and each of those can cascade further. That recursion has a depth limit, and wide fan-out (one user → 100k sessions) makes the delete expensive — which is why \`RESTRICT\` plus explicit cleanup is often kinder to a production database.
    `,
    codeExamples: [
      {
        title: "A realistic two-table schema",
        language: "sql",
        code: `CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total      numeric(10,2) NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'cancelled')),
  CONSTRAINT orders_total_nonneg CHECK (total >= 0)
);

CREATE INDEX orders_user_id_idx ON orders (user_id);

INSERT INTO users (email, display_name)
VALUES ('amina@example.com', 'Amina')
RETURNING id, created_at;`,
        description:
          "Note the habits: uuid PK with DEFAULT, timestamptz everywhere, numeric for money, a CHECK on the status vocabulary, and an index on the FK column because every join and cascade looks up orders by user_id.",
      },
    ],
    commonMistakes: [
      "Using float/double precision for money — floating-point rounding will eventually under-charge or over-charge a customer. Use numeric.",
      "Omitting ON DELETE and silently getting NO ACTION: parent deletes then fail in production with a cryptic FK error nobody planned for.",
      "Leaving FK columns unindexed: joins and ON DELETE checks degrade to sequential scans as child tables grow.",
      "Using timestamp without time zone: you lose the instant and inherit whatever the server's timezone happened to be. Use timestamptz, always.",
      "Choosing varchar(50) as a fake constraint — in Postgres it rarely saves space; enforce length in validation, or with a CHECK if it is a hard rule.",
    ],
    bestPractices: [
      "Default every FK to ON DELETE RESTRICT (or NO ACTION) unless the cascade was named out loud in design review — accidental cascades destroy data.",
      "Add DEFAULT now() to created_at and DEFAULT gen_random_uuid() to id so inserts cannot forget them.",
      "Index every foreign key column from day one; it is the cheapest performance insurance in the database.",
      "Keep status-like columns as text + CHECK (or a native enum) rather than free-form strings — typos then fail loudly at write time.",
    ],
    realWorldUseCases: [
      "Auth: users ↔ refresh_tokens with ON DELETE CASCADE so deleting an account instantly revokes every session.",
      "Marketplace: orders → order_items with CASCADE, but products → order_items with RESTRICT so a sold product cannot be deleted.",
      "Multi-step onboarding: nullable FKs with ON DELETE SET NULL keep audit trails intact while softening references.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Current Version", OFFICIAL.postgresDocs, "Full reference; start with the SQL chapter (DDL) for CREATE TABLE.", "en", "reference"),
      docs("PostgreSQL Tutorial — The Concept of Tables", OFFICIAL.postgresTutorial, "Official beginner tutorial covering tables, keys and sample data.", "en", "20 min"),
      ytSearch("PostgreSQL CREATE TABLE primary key foreign key tutorial", "Hands-on CREATE TABLE walkthroughs with psql.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-create-tables",
        title: "Build the blog schema",
        prompt:
          "In psql, create table users (uuid id PK, text email UNIQUE, text display_name, timestamptz created_at), table posts (uuid id PK, uuid user_id FK → users with ON DELETE CASCADE, text title NOT NULL, text body NOT NULL, timestamptz created_at) and an index on posts(user_id). Insert one user with INSERT ... RETURNING and then one post using the returned uuid. Run DELETE FROM users and observe the cascade remove the post. Paste the final \\d posts output and the post count after deletion.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "gen_random_uuid() and now() are built-in defaults in PostgreSQL 13+.",
          "Check what happened with SELECT count(*) FROM posts after deleting the user.",
        ],
        solution: `CREATE TABLE users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL UNIQUE,
  display_name text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX posts_user_id_idx ON posts (user_id);

INSERT INTO users (email, display_name)
VALUES ('sam@example.com', 'Sam')
RETURNING id;

-- replace the literal with the uuid returned above
INSERT INTO posts (user_id, title, body)
VALUES ('PASTE-UUID-HERE', 'Hello Postgres', 'My first post');

DELETE FROM users WHERE email = 'sam@example.com';
SELECT count(*) FROM posts; -- 0: the post was cascaded away`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-task-api", "p2-blog-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-select-queries",
    slug: "select-queries",
    title: "SELECT Queries",
    description:
      "SELECT, WHERE, ORDER BY, LIMIT/OFFSET, aliases, operators — and the three-valued logic of NULL that trips up every developer at least once.",
    order: 3,
    estimatedMinutes: 24,
    tags: ["sql", "select", "null", "querying"],
    prerequisites: ["p2m4-tables-rows-columns-keys"],
    relatedTopics: ["p2m4-joins", "p2m4-group-by-aggregates", "p2m4-query-optimization"],
    learningObjectives: [
      "Write SELECT statements with WHERE, ORDER BY, LIMIT and OFFSET in the correct logical order",
      "Use column and table aliases to keep queries readable",
      "Explain SQL's three-valued logic and why = NULL never matches",
      "Avoid the NOT IN / NULL trap and prefer NOT EXISTS or <> ALL",
    ],
    simpleExplanation:
      "`SELECT` reads data: pick columns, filter rows with `WHERE`, sort with `ORDER BY`, cut the result with `LIMIT`. The catch is **NULL**: it means 'unknown', not zero or empty string, and almost every comparison with NULL yields *unknown* — which `WHERE` treats as false. So `WHERE email = NULL` matches nothing; you need `WHERE email IS NULL`.",
    detailedContent: `
Clauses may be typed in many orders, but PostgreSQL processes them in a fixed logical sequence — knowing it explains every "why is my alias not working here?" moment:

| Order | Clause | Purpose |
| --- | --- | --- |
| 1 | \`FROM\` / \`JOIN\` | Which tables, and how they combine |
| 2 | \`WHERE\` | Filter **rows** (before grouping) |
| 3 | \`GROUP BY\` | Collapse rows into groups |
| 4 | \`HAVING\` | Filter **groups** (after aggregation) |
| 5 | \`SELECT\` | Compute columns; aliases are born here |
| 6 | \`ORDER BY\` | Sort the result (aliases usable) |
| 7 | \`LIMIT\` / \`OFFSET\` | Keep a window of rows |

Consequence: a \`WHERE\` clause cannot use a \`SELECT\` alias, but \`ORDER BY\` can.

**Operators you will use constantly:** comparison (\`=\`, \`<>\`, \`<\`, \`>=\`), ranges (\`BETWEEN a AND b\`, inclusive on both ends), sets (\`IN (...)\`, \`NOT IN (...)\`), pattern matching (\`LIKE\`, case-insensitive \`ILIKE\`, with \`%\` and \`_\` wildcards), and boolean logic (\`AND\`, \`OR\`, \`NOT\` — with parentheses, always).

**NULL semantics (three-valued logic).** Comparing anything with NULL gives *unknown*, and \`WHERE\` keeps only *true* rows:

- \`WHERE email = NULL\` → matches **zero** rows, ever. Use \`IS NULL\` / \`IS NOT NULL\`.
- \`WHERE email <> 'x'\` → also excludes NULL rows! Only \`IS DISTINCT FROM 'x'\` keeps them.
- **The NOT IN trap:** \`WHERE id NOT IN (SELECT user_id FROM orders)\` returns *no rows at all* if the subquery contains even one NULL — because \`id <> NULL\` is unknown for every row. Use \`NOT EXISTS\`, or filter NULLs out of the subquery first.

Also remember: \`ORDER BY\` puts NULLs last for ASC by default (override with \`NULLS FIRST\` / \`NULLS LAST\`), and \`LIMIT\` without \`ORDER BY\` gives an arbitrary window — always pair them.
    `,
    howItWorks: `
The planner turns your SELECT into a tree of operations: scan (sequential or index) → filter → sort → limit. Predicates in \`WHERE\` that match an index prefix can be executed *during* the scan, skipping irrelevant rows entirely; the rest run as a filter node after the scan.

\`ORDER BY\` forces a **sort** (in memory, or a spill to disk for huge results) unless an index already provides that order — then a plain index scan delivers rows pre-sorted and the sort node disappears. \`LIMIT n\` lets the executor stop early (a top-N heapsort keeps only n rows in memory), which is why \`ORDER BY ... LIMIT\` is cheap on large tables while \`OFFSET\` still has to walk and discard skipped rows.
    `,
    codeExamples: [
      {
        title: "A complete, readable SELECT",
        language: "sql",
        code: `SELECT
  u.email        AS user_email,
  o.id           AS order_id,
  o.total,
  o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
  AND o.total BETWEEN 50 AND 500
  AND u.email ILIKE '%@example.com'
  AND o.created_at >= now() - INTERVAL '30 days'
ORDER BY o.created_at DESC, o.total DESC
LIMIT 20 OFFSET 0;`,
        description:
          "Table aliases (o, u) keep the query short; column aliases make the result self-documenting for the API layer. Every filter is index-friendly: equality on status, a range on created_at, equality on the join key.",
      },
      {
        title: "The NULL traps, demonstrated",
        language: "sql",
        code: `-- Sample: users 1,2,3. orders.user_id contains 2 and one NULL.

-- WRONG: never matches, even for users without orders
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM orders);

-- RIGHT: NULLs cannot make NOT EXISTS unknown
SELECT * FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);

-- WRONG: = NULL is always unknown
SELECT * FROM users WHERE deleted_at = NULL;

-- RIGHT
SELECT * FROM users WHERE deleted_at IS NULL;

-- Keeps NULL rows too (NULL-safe comparison)
SELECT * FROM users WHERE email IS DISTINCT FROM 'x@example.com';`,
        description:
          "Run these against a table containing a NULL foreign key: the first query returns zero rows while the second returns exactly the users with no orders. Silent wrongness, not an error — which is what makes it dangerous.",
      },
    ],
    commonMistakes: [
      "Writing WHERE col = NULL instead of IS NULL — the single most common beginner SQL bug, and it fails silently (zero rows, no error).",
      "Using NOT IN with a subquery that may contain NULLs — the whole predicate becomes unknown and the result set empties out.",
      "Assuming aliases defined in SELECT can be reused in WHERE — they cannot; WHERE runs before SELECT.",
      "Paginating with OFFSET on large, frequently-changing tables — late offsets are slow and rows shift between pages; prefer keyset pagination (WHERE (created_at, id) < ...), which you met in p2m2-pagination-filtering-sorting.",
      "Writing LOWER(col) LIKE ... for case-insensitive search — use ILIKE in Postgres, and a functional index if it becomes hot.",
    ],
    bestPractices: [
      "Alias every expression that is not a plain column; your future self and your API's JSON shape both benefit.",
      "Always pair LIMIT with ORDER BY — otherwise pagination is non-deterministic across requests.",
      "Prefer NOT EXISTS over NOT IN for anti-joins; it is NULL-safe and the planner often handles it better.",
      "Use INTERVAL '30 days' syntax for time math instead of string concatenation — it stays readable and index-friendly.",
    ],
    realWorldUseCases: [
      "Feed endpoints: WHERE author_id = $1 ORDER BY created_at DESC LIMIT 20 — the shape of every timeline query.",
      "Admin dashboards: filtered exports using BETWEEN on dates plus ILIKE on free-text search fields.",
      "Data hygiene jobs: SELECT ... WHERE deleted_at IS NULL AND last_login_at < now() - INTERVAL '90 days' to find dormant accounts.",
    ],
    resources: [
      docs("PostgreSQL Documentation — SELECT", "https://www.postgresql.org/docs/current/sql-select.html", "The authoritative SELECT reference: every clause, operator and NULL rule.", "en", "reference"),
      docs("PostgreSQL Tutorial — The Concept of Tables", OFFICIAL.postgresTutorial, "Interactive SELECT exercises straight from the Postgres team.", "en", "20 min"),
      ytSearch("PostgreSQL SELECT WHERE ORDER BY tutorial", "Query walkthroughs including NULL handling examples.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-select",
        title: "Write the activity query",
        prompt:
          "Given tables users(id uuid, email text, created_at timestamptz) and orders(id uuid, user_id uuid, status text, total numeric, created_at timestamptz): write a query returning email, total and created_at for paid orders between 100 and 1000 placed in the last 90 days, newest first, 50 per page. Then write an anti-join listing emails of users who have NO orders, first with NOT IN and then with NOT EXISTS; run both against data containing a NULL user_id and compare the results.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "now() - INTERVAL '90 days' gives the cutoff instant.",
          "NOT IN returns zero rows when the subquery has a NULL — that difference is the point of the exercise.",
        ],
        solution: `SELECT u.email, o.total, o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.status = 'paid'
  AND o.total BETWEEN 100 AND 1000
  AND o.created_at >= now() - INTERVAL '90 days'
ORDER BY o.created_at DESC
LIMIT 50 OFFSET 0;

-- Anti-join, NOT IN (NULL-hostile)
SELECT email FROM users
WHERE id NOT IN (SELECT user_id FROM orders);

-- Anti-join, NOT EXISTS (NULL-safe)
SELECT u.email FROM users u
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-task-api", "p2-job-board-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-insert-update-delete",
    slug: "insert-update-and-delete",
    title: "INSERT, UPDATE and DELETE",
    description:
      "Writing data safely: INSERT with RETURNING, UPDATE and DELETE with defensible WHERE clauses, and atomic upsert patterns with ON CONFLICT.",
    order: 4,
    estimatedMinutes: 20,
    tags: ["sql", "dml", "insert", "update", "delete", "upsert"],
    prerequisites: ["p2m4-select-queries"],
    relatedTopics: ["p2m4-constraints", "p2m4-transactions-acid", "p2m4-prisma-orm"],
    learningObjectives: [
      "Insert single and multiple rows and read generated values back with RETURNING",
      "Write UPDATE and DELETE statements whose WHERE clause you can defend in review",
      "Implement PostgreSQL upsert with ON CONFLICT ... DO UPDATE and understand EXCLUDED",
      "Explain why a missing WHERE on UPDATE/DELETE is a production outage waiting to happen",
    ],
    simpleExplanation:
      "`INSERT` adds rows, `UPDATE` changes them, `DELETE` removes them. Two rules keep you out of trouble: add `RETURNING` to INSERT whenever the app needs the new id or timestamps back, and treat a missing `WHERE` on UPDATE/DELETE as an incident — it silently rewrites or removes **every row** in the table.",
    detailedContent: `
**INSERT.** You can insert one row or many; always list the target columns so a future table reordering cannot break you:

    INSERT INTO users (email, display_name)
    VALUES ('a@x.com', 'A'), ('b@x.com', 'B')
    RETURNING id, created_at;

\`RETURNING\` streams the new rows back in one round-trip — no second SELECT, no race between insert and read. It works on \`INSERT\`, \`UPDATE\` and \`DELETE\`, and in Prisma it becomes \`create\` returning the model.

**UPDATE / DELETE.** The \`WHERE\` clause is not optional in practice:

    -- Catastrophic: rewrites the whole table
    UPDATE orders SET status = 'paid';

    -- Correct: scoped by primary key (or a unique, indexed predicate)
    UPDATE orders SET status = 'paid', paid_at = now()
    WHERE id = '2b3f9c1e-0d4a-4a63-9a6f-77a1b2c3d4e5';

Check the row count your driver reports (pg returns \`rowCount\`). An UPDATE matching zero rows is *not* an error — decide deliberately whether your API should 404 when \`rowCount === 0\`.

**Upsert.** "Insert if missing, otherwise update" is one atomic statement in PostgreSQL:

    INSERT INTO users (email, display_name)
    VALUES ('a@x.com', 'Amina')
    ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING *;

\`EXCLUDED\` is a special alias for the row you *tried* to insert. \`DO NOTHING\` is the other variant. The conflict target must have a unique index. Doing SELECT-then-INSERT in application code is a race: two concurrent requests both find nothing and both insert — with a unique constraint one fails, without it you get silent duplicates.

**Bulk efficiency.** Prefer one INSERT with many VALUES (or \`INSERT ... SELECT\`) over a loop of single inserts — each statement carries plan and round-trip overhead. Prisma's \`createMany\` and psql's \`COPY\` are the same idea at different scales.
    `,
    howItWorks: `
Every DML statement runs inside an implicit transaction: if any row fails a constraint, the entire statement rolls back — you never observe a half-applied multi-row insert.

\`ON CONFLICT\` works because unique indexes are enforced at insert time. When a row collides, PostgreSQL does not raise an error; it jumps to your DO UPDATE / DO NOTHING branch inside the same transaction and snapshot. That atomicity is what makes upsert safe under concurrency.

\`UPDATE\` physically rewrites the old row version (MVCC keeps the previous version visible to other transactions' snapshots) and writes a new version, leaving a dead tuple that VACUUM later reclaims. Frequently updated hot rows therefore cost more than inserts — a reason to avoid touching unchanged columns in tight loops.
    `,
    codeExamples: [
      {
        title: "The full write toolkit",
        language: "sql",
        code: `-- Insert and capture generated values in one round-trip
INSERT INTO users (email, display_name)
VALUES ('amina@example.com', 'Amina')
RETURNING id, created_at;

-- Atomic upsert driven by the unique index on email
INSERT INTO users (email, display_name)
VALUES ('amina@example.com', 'Amina Updated')
ON CONFLICT (email) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      updated_at   = now()
RETURNING id, display_name, (xmax = 0) AS was_inserted;

-- Bulk insert in a single statement
INSERT INTO orders (user_id, total, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 10.00, 'pending'),
  ('11111111-1111-1111-1111-111111111111', 25.50, 'pending'),
  ('22222222-2222-2222-2222-222222222222',  9.99, 'paid');

-- Scoped update: always defend the WHERE
UPDATE orders
SET status = 'cancelled', cancelled_at = now()
WHERE id = '33333333-3333-3333-3333-333333333333'
  AND status = 'pending';

-- Scoped delete: RETURNING logs what died
DELETE FROM orders
WHERE created_at < now() - INTERVAL '1 year'
RETURNING id, total;`,
        description:
          "The (xmax = 0) trick reveals whether the upsert inserted or updated. Note the UPDATE only touches pending orders — status transitions should be guarded, not blind.",
      },
    ],
    commonMistakes: [
      "Running UPDATE or DELETE without WHERE in production — treat it like firing a gun indoors; require a WHERE in review unless a full-table rewrite is the explicit, intended migration.",
      "SELECT-then-INSERT 'upserts' in Node.js — concurrent requests race; use ON CONFLICT (or Prisma upsert) so the database arbitrates atomically.",
      "Forgetting that UPDATE affects zero rows without erroring — check rowCount and decide your API semantics (404 vs 200 no-op).",
      "Inserting row by row in a loop — thousands of round-trips where one multi-row INSERT would do; one of the most common Phase 2 performance bugs.",
      "Updating the conflict-target column inside ON CONFLICT (changing email in DO UPDATE SET email = ...) — it can violate the unique constraint again and errors out.",
    ],
    bestPractices: [
      "Always list column names in INSERT so reordering table columns cannot silently break your app.",
      "Use RETURNING * (or the columns you need) to avoid a follow-up SELECT and the race that comes with it.",
      "Guard state-machine transitions: WHERE status = 'pending' makes double-cancellation harmless.",
      "For large backfills, wrap batches in explicit transactions (BEGIN ... COMMIT every 1,000 rows) to amortise WAL and commit overhead.",
    ],
    realWorldUseCases: [
      "Webhooks from providers like Stripe arrive at least once — ON CONFLICT (external_id) DO NOTHING makes delivery idempotent.",
      "Profile pages: PATCH endpoints map to a single UPDATE ... WHERE id = $1 RETURNING *.",
      "Postgres-based job queues: UPDATE jobs SET locked_by = $1 WHERE id = $2 AND locked_by IS NULL RETURNING * acts as an atomic claim.",
    ],
    resources: [
      docs("PostgreSQL Documentation — INSERT", "https://www.postgresql.org/docs/current/sql-insert.html", "Reference for INSERT, multi-row VALUES, RETURNING and ON CONFLICT.", "en", "reference"),
      docs("PostgreSQL Documentation — UPDATE", "https://www.postgresql.org/docs/current/sql-update.html", "UPDATE semantics, FROM clause and RETURNING.", "en", "reference"),
      ytSearch("PostgreSQL upsert ON CONFLICT tutorial", "Walkthroughs of insert-on-conflict patterns and EXCLUDED.", "en", "10–15 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-dml",
        title: "Idempotent seat booking",
        prompt:
          "Create table bookings(id uuid PK default gen_random_uuid(), seat text NOT NULL UNIQUE, passenger text NOT NULL, booked_at timestamptz default now()). Write: (1) an INSERT bookinging seat '12A' that returns the id; (2) a second attempt to book '12A' for a different passenger using ON CONFLICT (seat) DO UPDATE so the latest passenger wins; (3) an UPDATE freeing seats booked before 2020, verifying with RETURNING how many rows changed. Run all three and paste the outputs.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "The UNIQUE constraint on seat is what ON CONFLICT (seat) hooks into.",
          "EXCLUDED.passenger refers to the value in the attempted insert.",
        ],
        solution: `CREATE TABLE bookings (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat      text NOT NULL UNIQUE,
  passenger text NOT NULL,
  booked_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO bookings (seat, passenger) VALUES ('12A', 'Alice')
RETURNING id;

INSERT INTO bookings (seat, passenger)
VALUES ('12A', 'Bob')
ON CONFLICT (seat) DO UPDATE SET passenger = EXCLUDED.passenger
RETURNING id, seat, passenger;

UPDATE bookings SET passenger = 'RETIRED'
WHERE booked_at < '2020-01-01'
RETURNING *;`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-task-api", "p2-ecommerce-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-joins",
    slug: "sql-joins",
    title: "Joins",
    description:
      "INNER, LEFT, RIGHT and FULL joins, multi-table joins, self joins, and the NULL side effects every join type quietly introduces.",
    order: 5,
    estimatedMinutes: 24,
    tags: ["sql", "joins", "querying"],
    prerequisites: ["p2m4-select-queries"],
    relatedTopics: ["p2m4-group-by-aggregates", "p2m4-query-optimization", "p2m4-normalization"],
    learningObjectives: [
      "Choose between INNER, LEFT, RIGHT and FULL joins by the result set you need",
      "Chain three or more tables in a single query with clear aliases",
      "Write a self join to walk a hierarchy (employees to managers)",
      "Predict which columns become NULL when an outer join finds no match",
    ],
    simpleExplanation:
      "A join combines rows from two tables where a condition matches — like a Venn diagram with a rule. `INNER JOIN` keeps only matches. `LEFT JOIN` keeps **every row of the left table**, filling the right side with NULLs when there is no match. That NULL-filled row is how you answer questions like 'all users, even those with no orders'.",
    detailedContent: `
| Join | Keeps | Typical use |
| --- | --- | --- |
| \`INNER JOIN\` | Only rows matching on both sides | Orders with their customer |
| \`LEFT JOIN\` | All left rows + matches (NULL if none) | Users with their orders, including zero-order users |
| \`RIGHT JOIN\` | All right rows + matches | Same as swapping table order with LEFT |
| \`FULL JOIN\` | All rows from both sides | Reconciling two systems' datasets |
| \`CROSS JOIN\` | Cartesian product (every pair) | Generating calendars, size charts |
| \`LATERAL JOIN\` | Per-row subquery results | Top-N-per-group without window functions |

**Rules that prevent bugs:**

1. The join condition (\`a.id = b.a_id\`) belongs in \`ON\`, not in \`WHERE\` — putting outer-join filters in \`WHERE\` silently converts your LEFT JOIN into an INNER JOIN, because filtering out the NULLs removes the unmatched rows you wanted.
2. Join on keys first, then filter: predicates in \`ON\` decide which right-side rows may match; predicates in \`WHERE\` eliminate joined rows afterwards.
3. **Multi-table joins** are just chains — users u JOIN orders o ON ... JOIN order_items oi ON ... — one alias per table, conditions pairwise.
4. **Self joins** join a table to *itself* under two aliases: \`employees e JOIN employees m ON m.id = e.manager_id\` puts each employee next to their manager's row.
5. **NULL side effects:** after a LEFT JOIN, \`COUNT(o.id)\` skips the padded NULLs (it counts real matches) while \`COUNT(*)\` counts the padded row too. \`COALESCE(SUM(o.total), 0)\` renders 'no orders' as 0 instead of NULL.

PostgreSQL also offers \`JOIN ... USING (col)\` (merges the shared column) and \`NATURAL JOIN\` (joins on every same-named column — avoid it in application code; a schema change silently changes the query).
    `,
    howItWorks: `
The planner implements joins with algorithms chosen by table size and available indexes:

- **Nested loop** — for each left row, look up matches (usually via an index). Great when the outer side is small or the inner side is indexed on the join key.
- **Hash join** — build a hash table of the smaller side, probe with the larger. The default for large unindexed joins.
- **Merge join** — sweep both inputs in lockstep (often already sorted by an index). Excellent for pre-sorted inputs and range joins.

For LEFT joins the executor emits unmatched left rows with NULLs for every right column; for FULL joins it also emits unmatched right rows at the end. Because the cost model relies on row estimates from statistics, an ANALYZE'd table gets better join plans — another reason to keep autovacuum healthy.
    `,
    codeExamples: [
      {
        title: "LEFT JOIN with NULL-safe totals",
        language: "sql",
        code: `-- Every user with their most recent order (NULL when none)
SELECT
  u.id,
  u.email,
  o.id    AS latest_order_id,
  o.total AS latest_total
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id
 AND o.created_at = (
   SELECT max(o2.created_at) FROM orders o2 WHERE o2.user_id = u.id
 )
ORDER BY u.email;

-- Totals that read 0 instead of NULL for users with no orders
SELECT
  u.email,
  count(o.id)              AS order_count,
  COALESCE(sum(o.total), 0) AS lifetime_value
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.email;`,
        description:
          "The 'most recent order' condition sits in ON, not WHERE — putting it in WHERE would drop every user whose latest order is not the matched one, defeating the LEFT JOIN. That single distinction is the most-tested idea in interview SQL.",
      },
      {
        title: "Self join: employees and their managers",
        language: "sql",
        code: `CREATE TABLE employees (
  id         integer PRIMARY KEY,
  name       text NOT NULL,
  manager_id integer REFERENCES employees(id)
);

INSERT INTO employees (id, name, manager_id) VALUES
  (1, 'Dana',   NULL),
  (2, 'Eli',    1),
  (3, 'Fatima', 2),
  (4, 'Gus',    2);

-- Each employee next to their manager's name
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY e.id;

-- employee | manager
-- Dana     | (null)   -- the CEO has no manager
-- Eli      | Dana
-- Fatima   | Eli
-- Gus      | Eli`,
        description:
          "Two aliases (e, m) of the same table make the hierarchy queryable. LEFT JOIN keeps the top-of-tree row that has no manager.",
      },
    ],
    commonMistakes: [
      "Putting outer-join filters in WHERE instead of ON — your LEFT JOIN silently behaves like an INNER JOIN and 'users with no orders' vanish from results.",
      "Counting the wrong column after a LEFT JOIN: COUNT(*) includes the NULL-padded row; COUNT(child.id) counts only real matches.",
      "Joining on non-indexed columns (emails, names) instead of uuid keys — the planner falls back to hash joins over full table scans.",
      "Using NATURAL JOIN in production code — adding a column to a table can change or break the query with no warning in the SQL text.",
      "Selecting t.* across many joined tables and then being surprised when JSON responses balloon or same-named columns silently overwrite each other.",
    ],
    bestPractices: [
      "Alias every table (users u) and qualify every column (u.email) in multi-table queries — unqualified ambiguity breaks the next migration.",
      "Prefer LEFT JOIN over RIGHT JOIN: reading left-to-right ('users, then their orders') matches how the team talks about the data.",
      "Select an explicit column list, not *, when joining — your API contract should not change because someone added a column.",
      "When a join graph exceeds three tables, consider a view or a lateral subquery to keep the query reviewable.",
    ],
    realWorldUseCases: [
      "Dashboards: LEFT JOIN users to orders to compute per-user revenue including a literal 0 for customers who never bought.",
      "Admin panels: FULL JOIN two id-mapping tables during a migration to find rows that exist on only one side.",
      "Org charts and comment threads: self joins (or recursive CTEs, a step beyond this lesson) walk parent/child hierarchies.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Joins Between Tables", "https://www.postgresql.org/docs/current/tutorial-join.html", "Official tutorial on INNER and LEFT joins with the sample tables.", "en", "15 min"),
      ytSearch("SQL joins explained visual INNER LEFT RIGHT FULL", "Diagram-driven join explanations with runnable examples.", "en", "10–20 min"),
      docs("PostgreSQL Tutorial — Concept of Tables", OFFICIAL.postgresTutorial, "Official tutorial including joining sample tables.", "en", "20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-joins",
        title: "Users, orders and order items",
        prompt:
          "Using users, orders and order_items (order_items has order_id, product_name, quantity): write (1) a query listing every user's email with their order count — including users with zero orders; (2) a query listing every order item line with the customer email (only orders that have items); (3) a self-join query on a two-row sample you create yourself. Run them and record which rows contain NULLs and why.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Zero-order users require LEFT JOIN from users; COUNT(o.id) will correctly show 0 after aggregation.",
          "Item lines with customer email is naturally an INNER chain: order_items JOIN orders JOIN users.",
        ],
        solution: `SELECT u.email, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.email
ORDER BY order_count DESC, u.email;

SELECT oi.id AS item_id, oi.product_name, u.email
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN users  u ON u.id = o.user_id
ORDER BY oi.id;`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-blog-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-group-by-aggregates",
    slug: "group-by-and-aggregates",
    title: "GROUP BY and Aggregates",
    description:
      "Collapsing rows into groups with GROUP BY, filtering groups with HAVING, and how COUNT, SUM, AVG, MIN and MAX behave around NULLs.",
    order: 6,
    estimatedMinutes: 22,
    tags: ["sql", "aggregation", "group-by", "reporting"],
    prerequisites: ["p2m4-joins"],
    relatedTopics: ["p2m4-select-queries", "p2m4-query-optimization"],
    learningObjectives: [
      "Write GROUP BY queries with COUNT, SUM, AVG, MIN and MAX",
      "Explain the difference between WHERE (rows) and HAVING (groups) and place predicates correctly",
      "Predict how each aggregate treats NULL values",
      "Group by a column that contains NULLs without losing rows",
    ],
    simpleExplanation:
      "`GROUP BY` collapses many rows into one summary row per distinct group — 'one row per customer with their totals'. Aggregates (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) compute over each group. `HAVING` filters the *groups* after aggregation (customers with at least 3 orders), while `WHERE` filters rows *before* grouping.",
    detailedContent: `
The clause order from lesson 3 now matters completely:

1. \`WHERE\` removes rows you do not want counted (e.g. \`status = 'paid'\`).
2. \`GROUP BY\` buckets the remaining rows — one output row per distinct combination of the grouped columns.
3. Aggregates run per bucket.
4. \`HAVING\` filters buckets (e.g. \`HAVING count(*) >= 3\`).
5. \`ORDER BY\` / \`LIMIT\` shape the final list.

**Aggregate NULL behaviour** — memorise this table:

| Function | NULL rows |
| --- | --- |
| \`COUNT(*)\` | Counts every row, NULLs included |
| \`COUNT(col)\` | Skips NULLs |
| \`COUNT(DISTINCT col)\` | Skips NULLs, counts unique values |
| \`SUM\` / \`AVG\` | Skip NULLs; AVG of an all-NULL group → NULL |
| \`MIN\` / \`MAX\` | Skip NULLs; all-NULL group → NULL |

Consequences: an empty group (possible with a LEFT JOIN) gives \`COUNT(*) = 0\` but \`SUM(total) = NULL\` — wrap money in \`COALESCE(SUM(total), 0)\`. And AVG ignoring NULLs is usually what you want ('average rating among people who rated'), but confirm that with your product manager.

**Grouping with NULLs.** \`GROUP BY\` treats NULL as a single group — all NULL \`referrer\` values collapse into one output row with a NULL key. That is correct for analytics; just render it as '(none)' in the API.

Every non-aggregated column in the SELECT list must appear in GROUP BY — PostgreSQL enforces this strictly. \`GROUP BY 1, 2\` (ordinal positions) and \`GROUP BY ROLLUP(...)\` for subtotals are handy refinements.
    `,
    howItWorks: `
The executor implements grouping with one of three strategies:

- **Hashed aggregation** — stream rows, accumulate sums/counts in a hash table keyed by the group columns. Fast and the usual choice; spills to disk when memory is exceeded.
- **Sorted aggregation** — if input arrives pre-sorted by the group columns (often via an index), groups are consecutive and no hash table is needed.
- **Group aggregate with index scan** — an index on (user_id, created_at) can serve both the grouping and a "top users" style query with LIMIT.

\`HAVING\` is applied as soon as a group closes. You cannot know 'orders above 500 total' without finishing each group first, so HAVING on an aggregate always follows full aggregation — plan accordingly when reading EXPLAIN.
    `,
    codeExamples: [
      {
        title: "Revenue per customer, only the valuable ones",
        language: "sql",
        code: `SELECT
  u.id,
  u.email,
  count(o.id)               AS order_count,
  COALESCE(sum(o.total), 0) AS lifetime_value,
  round(avg(o.total), 2)    AS avg_order_value,
  max(o.created_at)         AS last_order_at
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id
 AND o.status = 'paid'
WHERE u.created_at >= now() - INTERVAL '1 year'
GROUP BY u.id, u.email
HAVING count(o.id) >= 3
  AND COALESCE(sum(o.total), 0) > 500
ORDER BY lifetime_value DESC
LIMIT 50;`,
        description:
          "The paid filter sits in ON so the LEFT JOIN keeps zero-paid-order users with count 0; WHERE pre-filters users before grouping; HAVING removes unprofitable groups afterwards. COALESCE turns NULL sums into 0 before HAVING compares them.",
      },
      {
        title: "Hourly signups and the NULL bucket",
        language: "sql",
        code: `SELECT
  date_trunc('hour', created_at) AS hour,
  count(*)                       AS signups
FROM users
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY 1          -- ordinal reference to the first SELECT expression
ORDER BY 1;

-- All-NULL referrers collapse into one NULL group
SELECT
  COALESCE(referrer, '(none)') AS source,
  count(*) AS users
FROM users
GROUP BY referrer   -- group by the raw column; NULL is one group
ORDER BY users DESC;`,
        description:
          "date_trunc buckets timestamps into hours. The second query shows that GROUP BY treats NULL as a single group — COALESCE is presentation only and does not change the grouping itself.",
      },
    ],
    commonMistakes: [
      "Forgetting to add a non-aggregated SELECT column to GROUP BY — PostgreSQL rejects the query, unlike some engines that guess for you.",
      "Using WHERE to filter an aggregate (WHERE count(*) > 3) — aggregates do not exist yet at WHERE time; use HAVING.",
      "Assuming SUM/AVG include NULLs — they skip them, so a column that is NULL-meaning-zero can understate reality.",
      "Wrapping every grouped column in MIN() as a workaround for GROUP BY errors — it works but hides the real question: what are you grouping by?",
      "Grouping on raw timestamps for charts — you almost always want date_trunc so rows bucket meaningfully.",
    ],
    bestPractices: [
      "COALESCE aggregates that appear in money or count displays — APIs should return 0, not null, for 'nothing here'.",
      "Filter rows with WHERE before grouping; shrinking the aggregation input is far cheaper than HAVING after.",
      "For 'top N per group', prefer window functions (ROW_NUMBER() OVER (PARTITION BY ...)) once you are comfortable — they compose better.",
      "Add an index matching frequent GROUP BY keys plus the WHERE predicates (see covering indexes, lesson 8) so aggregation reads less heap.",
    ],
    realWorldUseCases: [
      "Business dashboards: daily revenue, conversion funnels and cohort retention are all GROUP BY exercises over orders and events.",
      "Fraud detection: GROUP BY user_id HAVING count(*) > 50 in one minute flags burst behaviour.",
      "Product analytics: 'most viewed products per category' is grouping with aggregates plus a top-N filter.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Aggregate Functions", "https://www.postgresql.org/docs/current/functions-aggregate.html", "Every built-in aggregate, ORDER BY/DISTINCT variants and NULL rules.", "en", "reference"),
      ytSearch("PostgreSQL GROUP BY HAVING tutorial", "Reporting-style query walkthroughs with practice data.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-aggregates",
        title: "Monthly sales report",
        prompt:
          "With orders(id, user_id, total numeric, status text, created_at timestamptz): write a query returning, for paid orders only: the calendar month via date_trunc('month', created_at), number of orders, total revenue, average order value rounded to 2 decimals, and the single largest order. Keep months with zero paid orders OUT of the result. Then (bonus) rewrite it as a LEFT JOIN from a spine of months so empty months appear with zeros.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Filter status in WHERE so HAVING never sees unpaid rows.",
          "round(avg(total), 2) gives clean money; max(total) is the largest order.",
        ],
        solution: `SELECT
  date_trunc('month', o.created_at) AS month,
  count(*)                          AS orders,
  sum(o.total)                      AS revenue,
  round(avg(o.total), 2)            AS avg_order_value,
  max(o.total)                      AS largest_order
FROM orders o
WHERE o.status = 'paid'
  AND o.created_at >= now() - INTERVAL '12 months'
GROUP BY 1
ORDER BY 1 DESC;`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-inventory-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-constraints",
    slug: "constraints-and-data-integrity",
    title: "Constraints and Data Integrity",
    description:
      "NOT NULL, UNIQUE, CHECK, DEFAULT, composite keys and referential integrity — encoding your business rules so the database refuses to store garbage.",
    order: 7,
    estimatedMinutes: 18,
    tags: ["sql", "constraints", "integrity", "schema-design"],
    prerequisites: ["p2m4-tables-rows-columns-keys"],
    relatedTopics: ["p2m4-tables-rows-columns-keys", "p2m4-normalization", "p2m4-prisma-orm"],
    learningObjectives: [
      "Apply NOT NULL, UNIQUE, CHECK and DEFAULT constraints deliberately",
      "Design composite primary keys for true many-to-many relationships",
      "Explain how referential integrity keeps parent and child tables consistent",
      "Add constraints to existing tables with ALTER TABLE without breaking production data",
    ],
    simpleExplanation:
      "Constraints are promises the database keeps for you: a column marked NOT NULL can never be empty, UNIQUE forbids duplicates, CHECK rejects values failing an expression, and foreign keys guarantee referenced rows exist. Every rule you encode as a constraint is one less rule your Node.js code — and every future script, admin and migration — has to remember.",
    detailedContent: `
| Constraint | Enforces | Example |
| --- | --- | --- |
| \`NOT NULL\` | Value must exist | \`email text NOT NULL\` |
| \`UNIQUE\` | No duplicate values (multiple NULLs allowed in Postgres) | \`UNIQUE (email)\` |
| \`PRIMARY KEY\` | NOT NULL + UNIQUE identity | \`id uuid PRIMARY KEY\` |
| \`DEFAULT\` | Filler when INSERT omits the column | \`DEFAULT now()\` |
| \`CHECK\` | Custom boolean expression | \`CHECK (price >= 0)\` |
| \`FOREIGN KEY\` | Referenced parent row exists | \`REFERENCES users(id)\` |
| \`EXCLUDE\` | No two rows may satisfy an operator simultaneously | GiST exclusions for ranges |

**Composite keys.** A join table like order_items often has no independent identity — its meaning *is* the pair:

    CREATE TABLE order_items (
      order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES products(id),
      quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
      PRIMARY KEY (order_id, product_id)
    );

The composite PK automatically forbids the same product appearing twice on one order. A composite UNIQUE (\`UNIQUE (tenant_id, slug)\`) expresses a similar rule when you also keep a surrogate id.

**Referential integrity** is the web of foreign keys. It gives you: INSERT rejection when the parent is missing; UPDATE/DELETE protection per the ON DELETE action (lesson 2); and the confidence that no orphan rows exist for your joins. Turning it off (\`session_replication_role = replica\`) is a restore-time trick for bulk loads — never an application setting.

**Adding constraints later.** \`ALTER TABLE ... ADD CONSTRAINT\` validates existing rows and fails if bad data already exists. Clean the data first (or add \`NOT VALID\` to skip validating old rows while still constraining new writes — a PostgreSQL speciality), then \`VALIDATE CONSTRAINT\` as a second, lock-friendlier step.
    `,
    howItWorks: `
Constraints are recorded in \`pg_constraint\` and checked inline during DML. UNIQUE and PK constraints are backed by unique **indexes** — the same B-tree structure as lesson 8 — so enforcing uniqueness and looking rows up share one mechanism. That is also why every PK/UNIQUE silently costs you an index, which you usually want anyway.

CHECK constraints are stored as expression trees and evaluated per row on INSERT/UPDATE; cheap, but not free on hot bulk inserts. Foreign keys add a lookup against the parent (typically an index scan of the parent's PK) on child writes, plus trigger-like machinery for parent deletes and updates. All of it runs *inside* the same transaction as your statement — a violation aborts atomically, so half-constrained data is never observable.
    `,
    codeExamples: [
      {
        title: "Constraints that encode the business rules",
        language: "sql",
        code: `CREATE TABLE products (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku        text NOT NULL,
  name       text NOT NULL,
  price      numeric(10,2) NOT NULL,
  weight_kg  numeric(8,3),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_sku_unique UNIQUE (sku),
  CONSTRAINT products_price_nonneg CHECK (price >= 0),
  CONSTRAINT products_sku_format CHECK (sku ~ '^[A-Z0-9-]+$'),
  CONSTRAINT products_weight_positive CHECK (weight_kg IS NULL OR weight_kg > 0)
);

-- Tightening an existing table: verify in two lock-friendly steps
ALTER TABLE orders
  ADD CONSTRAINT orders_total_nonneg CHECK (total >= 0) NOT VALID;

-- New writes are checked immediately; old rows are not, until:
ALTER TABLE orders VALIDATE CONSTRAINT orders_total_nonneg;`,
        description:
          "The regex CHECK (the ~ operator) keeps SKUs in canonical format at the database boundary. NOT VALID + VALIDATE CONSTRAINT enforces a rule on new data immediately without a long ACCESS EXCLUSIVE lock over a full-table scan.",
      },
    ],
    commonMistakes: [
      "Trusting only application validation — any second writer (a migration script, psql, an admin, another service) bypasses your Express middleware entirely.",
      "Using UNIQUE on a nullable column expecting 'at most one NULL' — in PostgreSQL NULLs are distinct, so many NULLs are allowed. Use a partial unique index (CREATE UNIQUE INDEX ... WHERE col IS NOT NULL) for that rule.",
      "Adding NOT NULL to a column full of NULLs and getting a hard error — backfill values first, then add the constraint.",
      "Duplicating business rules in CHECK and in TypeScript with no single source of truth — decide which layer owns each rule and document it.",
      "Forgetting that EXCLUDE constraints need an index method (usually GiST) — omitting it fails the CREATE.",
    ],
    bestPractices: [
      "Make every rule that must always hold a database constraint; keep only UX-oriented validation in Node.js/Zod.",
      "Use DEFAULT for values the database knows better than the app: now(), gen_random_uuid(), status = 'pending'.",
      "Favour composite keys on join tables where the pair is genuinely unique — the schema then documents the relationship.",
      "When tightening a production schema, prefer NOT VALID then VALIDATE to avoid long exclusive locks on big tables.",
    ],
    realWorldUseCases: [
      "Billing: CHECK (total >= 0) with numeric(10,2) makes negative invoices impossible regardless of which service wrote the row.",
      "Scheduling: an EXCLUDE constraint using a GiST index on daterange prevents double-booking a room for overlapping periods.",
      "Multi-tenant apps: composite UNIQUE (tenant_id, email) enforces per-tenant uniqueness without global over-restriction.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Constraints", "https://www.postgresql.org/docs/current/ddl-constraints.html", "Official chapter: every constraint type, NOT VALID and deferrable constraints.", "en", "reference"),
      docs("PostgreSQL Documentation — Alter Table", "https://www.postgresql.org/docs/current/sql-altertable.html", "How to add, validate and drop constraints on live tables.", "en", "reference"),
      ytSearch("PostgreSQL constraints CHECK UNIQUE foreign key", "Schema-design sessions focused on integrity rules.", "en", "10–15 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-constraints",
        title: "Harden a sloppy table",
        prompt:
          "Given CREATE TABLE tickets(id uuid, event_id uuid, email text, price numeric, seat text): write ALTER TABLE statements that (1) make id the primary key with a uuid default, (2) make event_id a required foreign key to events(id), (3) require email, (4) forbid negative prices, (5) forbid duplicate seats per event with a composite unique constraint. Insert one violating row for each constraint and record the exact error message PostgreSQL returns.",
        difficulty: "intermediate",
        estimatedMinutes: 25,
        hints: [
          "gen_random_uuid() can be set as a default while id becomes NOT NULL via ALTER COLUMN SET NOT NULL.",
          "Composite unique: ALTER TABLE tickets ADD CONSTRAINT tickets_event_seat_unique UNIQUE (event_id, seat);",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-indexes-sql",
    slug: "indexes-in-postgresql",
    title: "Indexes in PostgreSQL",
    description:
      "B-tree indexes, composite index column order, covering indexes, the write cost of every index, and reading EXPLAIN ANALYZE well enough to be dangerous.",
    order: 8,
    estimatedMinutes: 24,
    tags: ["sql", "indexes", "performance", "postgresql"],
    prerequisites: ["p2m4-select-queries"],
    relatedTopics: ["p2m4-query-optimization", "p2m4-select-queries", "p2m4-transactions-acid"],
    learningObjectives: [
      "Explain what a B-tree index is and which queries it can serve",
      "Order composite index columns correctly using the equality-then-range rule",
      "Use INCLUDE columns to build covering indexes that avoid heap fetches",
      "Read an EXPLAIN ANALYZE plan and recognise sequential scans, index scans and misestimates",
      "Weigh the write and storage cost of every index you add",
    ],
    simpleExplanation:
      "An index is a sorted side-structure (usually a B-tree) that lets PostgreSQL find rows by key without reading the whole table — like the index at the back of a textbook. It makes `WHERE user_id = $1` take milliseconds instead of seconds, but every index slows down INSERT, UPDATE and DELETE slightly because it must be maintained too. Index only what you actually query.",
    detailedContent: `
**B-tree in one paragraph.** A B-tree keeps keys sorted in a balanced tree of pages; searching any key takes a few page reads regardless of table size. Leaves hold key values plus pointers to table rows (ctid). Equality, ranges (\`WHERE created_at > ...\`), \`IN\`, \`IS NULL\` and \`ORDER BY\` on the index prefix can all use it. Other index types exist (GIN for jsonb/arrays, GiST for ranges, BRIN for naturally ordered data) — B-tree covers the vast majority of API queries.

**Composite column order — the equality/range rule.** Put equality columns first, range columns last:

    -- Great for: WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC
    CREATE INDEX orders_user_id_created_at_idx
      ON orders (user_id, created_at DESC);

A B-tree can skip over leading equality columns, but once a column is used as a range, later columns cannot narrow the scan. So (user_id, created_at) serves "this user's recent orders", while a query filtering *only* by created_at across all users cannot use it effectively.

**Covering indexes.** \`INCLUDE\` adds non-key columns stored in the leaf only:

    CREATE INDEX orders_user_status_total_idx
      ON orders (user_id, status) INCLUDE (total);

\`SELECT total FROM orders WHERE user_id = $1 AND status = 'paid'\` now answers entirely from the index (an **index-only scan**) — the heap is never touched. INCLUDE columns cannot be used as lookup keys; they are payload.

**Write cost.** Every INSERT maintains every index on the table (plus WAL records for each). A table with ten indexes writes ~10 extra page updates per insert, and each index eats disk and shared_buffers. This is why "index everything" is bad advice and "measure with EXPLAIN" is the good one.

**EXPLAIN ANALYZE.** \`EXPLAIN ANALYZE <query>\` actually runs the query and reports the planner's *estimate* vs *actual* rows per node. Red flags: a Seq Scan on a huge table with an estimated-1-row filter; actuals off by orders of magnitude (stale statistics — run ANALYZE); a nested loop over millions of rows (missing index on the inner side).
    `,
    howItWorks: `
An index scan reads root → internal pages → the leaf page matching the key range, then follows heap pointers row by row (random I/O). A covering index stops at the leaf. A **bitmap heap scan** collects many ctids from the index, sorts them, then fetches rows in physical order — ideal for moderately selective predicates where pure random I/O would thrash.

PostgreSQL chooses between sequential scan and index access using cost constants and statistics: scanning a few sequential pages can be cheaper than the same number of random index+heap reads, so tiny tables are *correctly* scanned sequentially. The correlation between index order and physical order (tracked in \`pg_stats\`) also matters — freshly inserted append-only tables scan sequentially almost as fast as an index.

Autovacuum and ANALYZE keep row estimates honest; when estimates diverge wildly from reality the chosen plan collapses — the classic cause of "it was fast until it was slow".
    `,
    codeExamples: [
      {
        title: "From index to verified plan",
        language: "sql",
        code: `-- Composite index: equality first, range last, DESC for the common sort
CREATE INDEX orders_user_id_created_at_idx
  ON orders (user_id, created_at DESC);

-- Covering index: payload columns served from the index leaf
CREATE INDEX orders_user_status_total_idx
  ON orders (user_id, status) INCLUDE (total);

-- Inspect the plan before shipping the feature
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total
FROM orders
WHERE user_id = '0b0e6d3c-3f7a-4b5e-9d2c-1a2b3c4d5e6f'
  AND status = 'paid'
ORDER BY created_at DESC
LIMIT 20;

-- Typical healthy output (abridged):
-- Limit  (cost=0.56..8.59 rows=20 actual time=0.041..0.062 rows=20)
--   ->  Index Scan using orders_user_id_created_at_idx ...
--         Index Cond: (user_id = '0b0e6d3c-...'::uuid)
--         Filter: (status = 'paid')
--         Buffers: shared hit=44`,
        description:
          "EXPLAIN ANALYZE with BUFFERS is your microscope. 'Index Scan using orders_user_id_created_at_idx' plus low buffer hits means the composite index is doing its job; a Seq Scan here would mean a missing index or stale statistics.",
      },
    ],
    commonMistakes: [
      "Creating an index on (created_at) for a query that always filters by user_id first — the leading-column rule makes it useless for that query.",
      "Indexing every column 'just in case' — each index taxes every write and bloats autovacuum and backups with no read benefit.",
      "Assuming indexes speed up SELECT * — you still pay to read every column from the heap; project only what you need.",
      "Adding an index and never verifying with EXPLAIN — sometimes the planner still picks a sequential scan (small table, bad statistics, uncorrelated predicate).",
      "Indexing low-cardinality columns alone (a boolean is_active) — a bitmap scan covering 99% of rows is not a win; combine with a selective leading column.",
    ],
    bestPractices: [
      "Start every slow query investigation with EXPLAIN (ANALYZE, BUFFERS) before writing any DDL.",
      "One well-ordered composite index often replaces three single-column indexes — check pg_stat_user_indexes for unused ones and drop them.",
      "Add DESC to the trailing indexed column when your query always sorts that way (recent-first feeds).",
      "After bulk data loads, run ANALYZE (or wait for autovacuum) so the planner sees real distributions.",
      "Use EXPLAIN without ANALYZE when previewing a dangerous statement — ANALYZE actually executes it.",
    ],
    realWorldUseCases: [
      "Timeline feeds: (user_id, created_at DESC) turns an infinite scroll from full-table scans into constant-time pages.",
      "Billing reports: a covering index with INCLUDE (amount) lets monthly SUM queries run index-only with near-zero I/O.",
      "Unique business keys: UNIQUE constraints are indexes — your 'one order per external_id' rule and its lookup performance come free together.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Indexes", "https://www.postgresql.org/docs/current/indexes.html", "Official chapter: when indexes help, multicolumn rules and index types.", "en", "reference"),
      docs("PostgreSQL Documentation — Using EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html", "How to read plans, with a worked tutorial on the sample tables.", "en", "reference"),
      ytSearch("PostgreSQL EXPLAIN ANALYZE tutorial index tuning", "Plan-reading and index-tuning sessions on real queries.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-indexes",
        title: "Prove the index works",
        prompt:
          "Seed orders with at least 50,000 rows across 100 users (generate_series makes this quick). Run EXPLAIN ANALYZE on: SELECT id, total FROM orders WHERE user_id = 'some-uuid' ORDER BY created_at DESC LIMIT 20. Record the plan and buffers before and after CREATE INDEX orders_user_id_created_at_idx ON orders (user_id, created_at DESC). Write three sentences explaining the difference, and why an index on created_at alone would not help this query.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "INSERT INTO orders (user_id, total, status, created_at) SELECT ... FROM generate_series(1, 50000);",
          "Look for Seq Scan before and Index Scan after, then compare actual time and shared buffers.",
        ],
      },
    ],
    projectIds: ["p2-url-shortener", "p2-ecommerce-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-transactions-acid",
    slug: "transactions-and-acid",
    title: "Transactions and ACID",
    description:
      "BEGIN/COMMIT/ROLLBACK, PostgreSQL's READ COMMITTED default, isolation levels, lost updates and deadlocks — and how to make multi-step writes safe.",
    order: 9,
    estimatedMinutes: 24,
    tags: ["sql", "transactions", "acid", "concurrency"],
    prerequisites: ["p2m4-insert-update-delete"],
    relatedTopics: ["p2m4-constraints", "p2m4-postgres-from-node", "p2m2-express-app"],
    learningObjectives: [
      "Group multiple statements into a transaction with BEGIN, COMMIT and ROLLBACK",
      "State the guarantees of ACID and where each shows up in PostgreSQL",
      "Compare READ COMMITTED (the default), REPEATABLE READ and SERIALIZABLE at a practical level",
      "Detect and fix lost updates and deadlocks in application code",
    ],
    simpleExplanation:
      "A transaction makes several statements behave as **one indivisible unit**: either all of them commit, or none do. `BEGIN` starts the unit, `COMMIT` makes it permanent, `ROLLBACK` undoes everything since BEGIN. PostgreSQL's default isolation level, READ COMMITTED, shows other transactions your changes only after COMMIT — which is why two concurrent 'read then write' flows can race unless you add locks or raise the isolation level.",
    detailedContent: `
**ACID, mapped to PostgreSQL:**

| Guarantee | Meaning | Postgres mechanism |
| --- | --- | --- |
| Atomicity | All or nothing | Write-ahead log (WAL); ROLLBACK undoes from WAL |
| Consistency | Constraints hold at commit | Constraint and FK checks inside the transaction |
| Isolation | Concurrent transactions do not interfere | MVCC snapshots + row locks |
| Durability | Committed data survives crashes | WAL flushed to disk at commit (fsync) |

**The statement lifecycle.** Every single statement already runs in an implicit transaction. \`BEGIN\` extends that to multiple statements until \`COMMIT\` or \`ROLLBACK\`. In Node.js with pg you must use a dedicated **client** (not the pool's convenience query) for multi-statement transactions:

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE accounts ...", [...]);
      await client.query("UPDATE accounts ...", [...]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

**Isolation levels.**

| Level | Dirty read | Non-repeatable read | Phantom | Lost update |
| --- | --- | --- | --- | --- |
| READ COMMITTED (default) | No | Yes | Yes | Possible |
| REPEATABLE READ | No | No | No (in Postgres) | Possible |
| SERIALIZABLE | No | No | No | No |

- **READ COMMITTED** — each statement sees a snapshot as of *that statement's start*. Fine for the vast majority of CRUD.
- **REPEATABLE READ** — one snapshot for the whole transaction. In PostgreSQL, a conflicting concurrent commit makes your transaction fail with \`could not serialize access due to concurrent update\` — you retry.
- **SERIALIZABLE** — true serial equivalence via predicate locks; aborts are more frequent. Use it for ledgers and anything where read-then-write races are unacceptable.

**Lost update.** Two transactions read balance 100, each adds 10, both write 110 — one increment vanishes. Fixes: \`SELECT ... FOR UPDATE\` before updating, an atomic \`UPDATE accounts SET balance = balance + 10\`, or SERIALIZABLE with retries.

**Deadlock.** T1 locks row A then waits for B; T2 locks B then waits for A — PostgreSQL detects the cycle and aborts one victim (error \`deadlock detected\`). Prevention: lock rows in a consistent order (e.g. by primary key), keep transactions short, and never hold locks while calling external APIs.
    `,
    howItWorks: `
PostgreSQL uses MVCC (Multi-Version Concurrency Control): writers never block readers and readers never block writers. An UPDATE creates a *new* row version; the old version stays visible to transactions whose snapshot predates the change. \`VACUUM\` later removes versions no snapshot can see.

Row locks (\`FOR UPDATE\`) are recorded in the tuple's \`xmax\`; a second transaction requesting the same lock waits, or errors immediately with \`NOWAIT\`. At COMMIT the WAL record guarantees durability, and other transactions see the new version once their snapshot allows. This architecture is why READ COMMITTED proceeds with almost no blocking — and why application-level lock discipline (the lost-update patterns above) still matters.
    `,
    codeExamples: [
      {
        title: "A safe bank transfer in SQL",
        language: "sql",
        code: `BEGIN;

-- Lock both rows in a deterministic order (by account id) to avoid deadlock
SELECT id, balance FROM accounts
WHERE id IN ('acct-a', 'acct-b')
ORDER BY id
FOR UPDATE;

UPDATE accounts SET balance = balance - 100 WHERE id = 'acct-a';
UPDATE accounts SET balance = balance + 100 WHERE id = 'acct-b';

-- Verify invariants before committing — Postgres can't know your business rules
DO $$
BEGIN
  IF (SELECT balance FROM accounts WHERE id = 'acct-a') < 0 THEN
    RAISE EXCEPTION 'overdraft';
  END IF;
END $$;

COMMIT;`,
        description:
          "FOR UPDATE serialises concurrent transfers over the same accounts. If any statement throws, the client ROLLBACKs and both accounts remain untouched — no half-transfers, ever.",
      },
      {
        title: "Transactions done right in Node.js (pg)",
        language: "ts",
        code: `import type pg from "pg";

export async function transfer(
  pool: pg.Pool,
  fromId: string,
  toId: string,
  amount: number,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Deterministic lock order by id prevents deadlock
    const first = fromId < toId ? fromId : toId;
    const second = fromId < toId ? toId : fromId;
    await client.query(
      "SELECT id FROM accounts WHERE id = $1 OR id = $2 ORDER BY id FOR UPDATE",
      [first, second],
    );

    const dec = await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1",
      [amount, fromId],
    );
    if (dec.rowCount === 0) throw new Error("INSUFFICIENT_FUNDS");

    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
      [amount, toId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // back to the pool — never pool.query() mid-transaction
  }
}`,
        description:
          "The three non-negotiables: one client for the whole transaction, ROLLBACK in catch, release in finally. Calling pool.query() per statement could grab different connections and break the transaction entirely.",
      },
    ],
    commonMistakes: [
      "Issuing BEGIN on one pooled connection and COMMIT via pool.query() — they may be different connections; the transaction never commits and the first connection leaks an open transaction.",
      "Doing slow work (calling Stripe, rendering files) inside a transaction — locks and idle-in-transaction sessions pile up; fetch first, then transact.",
      "Assuming READ COMMITTED prevents lost updates — it does not; two read-modify-write cycles can still race without FOR UPDATE.",
      "Treating serialization failures as bugs — under REPEATABLE READ/SERIALIZABLE, 'could not serialize access' is an expected retryable error.",
      "Forgetting ROLLBACK on error paths — a stuck open transaction holds locks and blocks autovacuum until the connection dies.",
    ],
    bestPractices: [
      "Keep transactions as short as possible: batch statements, avoid user interaction and network calls inside them.",
      "Adopt a global lock ordering (always ascending primary keys) and you will virtually eliminate deadlocks.",
      "For counters and balances prefer atomic expressions (SET balance = balance + $1) over read-modify-write in the app.",
      "Wrap retryable failures (deadlock, serialization failure) in a small retry helper with jittered backoff at the service layer.",
      "Set idle_in_transaction_session_timeout on production pools so leaked transactions die loudly instead of hanging locks forever.",
    ],
    realWorldUseCases: [
      "Wallet top-ups and payouts: transfer endpoints are textbook BEGIN/COMMIT with row locks.",
      "Inventory reservation: UPDATE stock SET qty = qty - 1 WHERE product_id = $1 AND qty > 0 with a rowCount check replaces pessimistic locking code.",
      "Order placement: creating an order, decrementing stock and writing an audit row must commit or roll back together.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Transactions", "https://www.postgresql.org/docs/current/tutorial-transactions.html", "Official tutorial on BEGIN/COMMIT/ROLLBACK and transaction blocks.", "en", "15 min"),
      docs("PostgreSQL Documentation — Transaction Isolation", "https://www.postgresql.org/docs/current/transaction-iso.html", "Precise semantics of each isolation level, including serialization failures.", "en", "reference"),
      ytSearch("PostgreSQL transactions isolation levels explained", "Concurrency walkthroughs with deadlock demonstrations.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-transactions",
        title: "Prove atomicity with psql",
        prompt:
          "Create accounts(id text PK, balance numeric NOT NULL CHECK (balance >= 0)) with two rows at 500 each. In one psql session: BEGIN, transfer 100 with two UPDATEs, then run a deliberately failing statement (SELECT 1/0). Observe that after the error and ROLLBACK both balances are still 500. Repeat with COMMIT and show they changed. Then reproduce a lost update across two psql sessions using read-modify-write, and compare the final balance with what you expected.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "Demo: UPDATE accounts SET balance = balance - 100 WHERE id = 'a'; then SELECT 1/0;",
          "For the lost update, each session writes the absolute value it read (UPDATE ... SET balance = 350) — one increment disappears.",
        ],
        solution: `CREATE TABLE accounts (
  id      text PRIMARY KEY,
  balance numeric NOT NULL CHECK (balance >= 0)
);
INSERT INTO accounts (id, balance) VALUES ('a', 500), ('b', 500);

BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 'a';
UPDATE accounts SET balance = balance + 100 WHERE id = 'b';
SELECT 1/0;      -- forces an error
ROLLBACK;        -- both balances remain 500

BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 'a';
UPDATE accounts SET balance = balance + 100 WHERE id = 'b';
COMMIT;          -- a=400, b=600

-- Atomic update that cannot lose increments:
UPDATE accounts SET balance = balance + 100 WHERE id = 'a';`,
        solutionLanguage: "sql",
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-chat-backend"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-normalization",
    slug: "normalisation-1nf-2nf-3nf",
    title: "Normalisation (1NF, 2NF, 3NF)",
    description:
      "Removing update anomalies with the first three normal forms — and the honest criteria for when denormalising is the right engineering call.",
    order: 10,
    estimatedMinutes: 20,
    tags: ["sql", "normalization", "schema-design"],
    prerequisites: ["p2m4-tables-rows-columns-keys", "p2m3-schema-design"],
    relatedTopics: ["p2m4-joins", "p2m4-indexes-sql", "p2m4-query-optimization"],
    learningObjectives: [
      "Apply 1NF, 2NF and 3NF to a denormalised table design",
      "Recognise update, insertion and deletion anomalies caused by duplicated data",
      "Decide when denormalisation is justified and how to keep it honest",
    ],
    simpleExplanation:
      "Normalisation is the craft of storing each fact **once**. 1NF: no repeating groups or arrays-in-cells. 2NF: every non-key column depends on the *whole* primary key. 3NF: non-key columns depend on nothing *but* the primary key. Following these rules eliminates the classic anomalies — one row says a customer's city is Paris, another still says Lyon.",
    detailedContent: `
**1NF — atomic values, one row per fact.** No comma-separated columns (\`tags = 'node,sql'\`), no repeating groups (\`email1, email2, email3\`). Move repeating facts to a child table — or keep arrays in jsonb only when you truly treat them as opaque documents (the MongoDB trade-off from p2-m3).

**2NF — no partial dependencies.** Applies to *composite* primary keys: every non-key column must depend on **all** key columns, not just part of it.

    -- Violates 2NF: customer_name depends only on order_id, not (order_id, product_id)
    order_items(order_id, product_id, customer_name, qty)

    -- Fix: split
    orders(id PK, customer_id FK, ...)
    order_items(order_id FK, product_id FK, qty, PK(order_id, product_id))

**3NF — no transitive dependencies.** Non-key columns must not determine each other:

    -- Violates 3NF: city/zip depend on customer_id transitively via customers
    orders(id PK, customer_id, customer_city, customer_zip)

    -- Fix: move address attributes to customers
    customers(id PK, city, zip)
    orders(id PK, customer_id FK, ...)

**The anomalies you just eliminated:** *update* (change a customer's city in 500 order rows, miss one), *insertion* (cannot record a new city until an order exists), *deletion* (deleting the last order deletes the customer's address).

**When to denormalise — the honest checklist.** Normalise first; denormalise only when a measured problem demands it:

1. A report query joins so many tables that latency is unacceptable *and* covering indexes (lesson 8) are not enough.
2. The read:write ratio is extreme (say 1000:1) and the duplicated data has one clear writer.
3. You are storing a *cache of a computation* (materialised view, summary table) with an explicit rebuild strategy — not a second, drifting copy of the truth.

Denormalisation you can defend: an \`orders.total_cents\` maintained by a trigger, or a \`posts.search_vector\` (tsvector) for full-text search. Denormalisation you cannot: three tables each holding \`author_name\` "for convenience". PostgreSQL's JSONB is a middle path — a genuinely nested, rarely-filtered-by-field payload can live as jsonb inside an otherwise normalised row.
    `,
    howItWorks: `
The normal forms are not magic incantations; they are dependency analysis. You list functional dependencies (A → B: knowing A determines B), compute candidate keys, and split relations so each determinant is a key. Every split introduces joins — the price you pay, and exactly why lesson 8 (indexes) and lesson 5 (joins) exist.

PostgreSQL gives you tools that keep normalised schemas fast: materialised views (\`CREATE MATERIALIZED VIEW monthly_sales AS SELECT ... GROUP BY ...\`) pre-compute report joins and refresh on a schedule; \`GENERATED ALWAYS AS (...) STORED\` columns persist derived values; covering indexes answer simple projections without joins at all. In other words, the database can denormalise *for* you, in a controlled, rebuildable way — far safer than scattering copies across tables.
    `,
    codeExamples: [
      {
        title: "Before and after 3NF",
        language: "sql",
        code: `-- DENORMALISED: repeating groups + partial + transitive dependencies
-- (cannot even be created in SQL without violating 1NF via email1/email2)
CREATE TABLE bad_orders (
  order_id      uuid,
  product_id    uuid,
  product_name  text,      -- depends on product_id only
  customer_name text,      -- depends on order_id only
  customer_city text,      -- transitive via customer
  qty           integer
);

-- NORMALISED to 3NF
CREATE TABLE customers (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL
);

CREATE TABLE products (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  price numeric(10,2) NOT NULL
);

CREATE TABLE orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  qty        integer NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, product_id)
);

-- Reading it back is one query; the planner does the joins
SELECT o.id, c.name, c.city, p.name AS product, oi.qty
FROM order_items oi
JOIN orders o    ON o.id = oi.order_id
JOIN customers c ON c.id = o.customer_id
JOIN products p  ON p.id = oi.product_id
ORDER BY o.created_at DESC;`,
        description:
          "Each fact (customer city, product name, quantity) has exactly one home. The JOIN is not a workaround — it is the mechanism that keeps those homes independent.",
      },
      {
        title: "Controlled denormalisation: a materialised view",
        language: "sql",
        code: `CREATE MATERIALIZED VIEW monthly_revenue AS
SELECT
  date_trunc('month', o.created_at) AS month,
  count(*)                          AS orders,
  sum(oi.qty * p.price)             AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p     ON p.id = oi.product_id
WHERE o.status = 'paid'
GROUP BY 1;

CREATE UNIQUE INDEX monthly_revenue_month_idx ON monthly_revenue (month);

-- Refresh nightly, without locking readers
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue;`,
        description:
          "The join cost is paid once per refresh, not once per dashboard hit. CONCURRENTLY keeps the old snapshot readable while the new one builds — a textbook justified denormalisation.",
      },
    ],
    commonMistakes: [
      "Denormalising before measuring — most 'JOINs are slow' complaints are missing indexes or SELECT * habits, not normalisation problems.",
      "Storing derived values (full_name = first + last) with no single writer — they drift, and support tickets follow.",
      "Treating 3NF as an end rather than a means: over-splitting tiny lookup tables (a statuses table with 4 rows) adds joins for no anomaly-prevention benefit when a CHECK constraint suffices.",
      "Forgetting that jsonb columns bypass relational normalisation entirely — nested documents have their own partial-rewrite story.",
      "Creating a materialised view without a refresh strategy — stale dashboards silently erode trust in the data.",
    ],
    bestPractices: [
      "Normalise by default; denormalise per query with covering indexes or per schedule with materialised views.",
      "If you duplicate a column for performance, name it as the cache it is (denormalized_author_name) and document the writer that maintains it.",
      "Revisit the design with real query patterns after a month of production traffic — 3NF plus good indexes handles far more scale than teams expect.",
      "When migrating from a document model (p2-m3), flatten documents into 3NF tables first; keep genuinely opaque payloads as jsonb columns.",
    ],
    realWorldUseCases: [
      "E-commerce catalogues: product names live once in products; order lines reference them by id so renames do not rewrite history — and a price snapshot column on order_items is a deliberate, documented denormalisation.",
      "Reporting warehouses intentionally re-denormalise into star schemas for analytics — a different workload with different rules.",
      "Feature stores for ML pipelines denormalise aggressively because read throughput beats storage purity there.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Materialized Views", "https://www.postgresql.org/docs/current/rules-materializedviews.html", "Creation, unique indexes and CONCURRENTLY refresh.", "en", "reference"),
      ytSearch("database normalisation 1NF 2NF 3NF explained examples", "Classic normal-form walkthroughs with anomaly demonstrations.", "en", "12–20 min"),
      docs("PostgreSQL Tutorial — The Concept of Tables", OFFICIAL.postgresTutorial, "Official grounding in relational table design before normal forms.", "en", "20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-normalise",
        title: "Find and fix the anomalies",
        prompt:
          "Given a flat table student_courses(student_id, student_name, student_email, course_id, course_name, instructor_name, grade) where a student takes many courses and each course has one instructor: identify in writing one update anomaly, one insertion anomaly and one deletion anomaly. Then produce a 3NF design (list tables, PKs, FKs) and the single SELECT that reconstructs the original flat view.",
        difficulty: "intermediate",
        estimatedMinutes: 30,
        hints: [
          "student_name depends on student_id only — with a composite (student_id, course_id) key that is a 2NF violation.",
          "instructor_name depends on course_id — a transitive dependency through courses, which 3NF removes.",
        ],
      },
    ],
    projectIds: ["p2-ecommerce-api", "p2-job-board-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-query-optimization",
    slug: "query-optimization",
    title: "Query Optimization",
    description:
      "The N+1 query problem, SELECT *, sequential scans, batching round-trips, and measuring everything with EXPLAIN before optimising anything.",
    order: 11,
    estimatedMinutes: 22,
    tags: ["sql", "performance", "n+1", "optimization"],
    prerequisites: ["p2m4-indexes-sql", "p2m4-joins"],
    relatedTopics: ["p2m4-prisma-orm", "p2m4-postgres-from-node", "p2m4-group-by-aggregates"],
    learningObjectives: [
      "Spot and fix N+1 queries in both raw SQL and Prisma code",
      "Explain why SELECT * hurts and how explicit projections help",
      "Recognise sequential scans in EXPLAIN and choose the right fix",
      "Batch round-trips with IN/ANY lists, unnest and multi-row statements",
      "Follow a disciplined measure, hypothesise, change, re-measure loop",
    ],
    simpleExplanation:
      "Slow APIs are usually slow because of *how many queries* they run or *how much data* each query drags home — not because SQL is slow. The N+1 pattern (one query for a list, then one query per item to fetch relations) is the number one offender. Selecting only the columns you need, adding the right index, and batching 100 round-trips into one are the fixes.",
    detailedContent: `
**The hall of fame, in likely order:**

1. **N+1 queries.** Fetch 20 posts, then loop \`SELECT ... WHERE author_id = $1\` twenty times. Fix: a JOIN / \`include\` (Prisma) / \`WHERE id = ANY($1)\` (pg) so it is one round-trip. Network latency × N is the killer, not the row count.
2. **SELECT *.** Dragging a jsonb payload, a text body and 40 other columns for a list view multiplies heap reads, network bytes and JSON serialization. Project \`SELECT id, title, created_at\`.
3. **Sequential scans on big tables.** \`EXPLAIN\` shows \`Seq Scan\` with high actual rows for a selective predicate → missing index (lesson 8) or stale statistics (ANALYZE).
4. **OFFSET pagination.** \`LIMIT 20 OFFSET 100000\` makes the engine find and discard 100k rows. Use keyset pagination instead: \`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20\`.
5. **Row-by-row writes in loops.** 1,000 single INSERTs = 1,000 plans plus 1,000 round-trips. One multi-row INSERT (or \`unnest\`) collapses it.
6. **Unindexed join keys** — every FK you join on needs an index or that join side degrades to a scan.

**The loop that actually works:** measure (EXPLAIN ANALYZE + pg_stat_statements), hypothesise (which node is expensive and why), change *one thing*, re-measure. Skipping measurement is how teams add five useless indexes and still miss the real culprit — a jsonb column inside SELECT *.

**Postgres-side toolkit:** \`pg_stat_statements\` (top queries by total time), \`EXPLAIN (ANALYZE, BUFFERS)\`, \`pg_stat_user_indexes.idx_scan\` (unused indexes), and \`auto_explain\` for capturing slow plans in logs.
    `,
    howItWorks: `
The latency of a 10-query loop is roughly Q × (network round-trip + plan + execute). With 0.5 ms round-trips inside one datacentre, 100 queries add 50 ms of pure waiting — on a page rendered with 100 queries, the API spends most of its life waiting on itself. Batching to one query removes almost all of that waiting and lets the planner amortise the parse/plan step.

Sequential scans exist because they are sometimes optimal: reading a few sequential pages beats the same number of random index+heap pairs. The planner decides using cost estimates and statistics. Your job is to make sure statistics are current (autovacuum/ANALYZE) and that selective predicates have an index whose leading columns match — then verify with EXPLAIN that the plan actually changed. A "faster" code change that leaves the plan identical did nothing.
    `,
    codeExamples: [
      {
        title: "N+1 vs one query (pg)",
        language: "ts",
        code: `// BAD: 1 + N round-trips
const { rows: posts } = await pool.query(
  "SELECT id, title, author_id FROM posts ORDER BY created_at DESC LIMIT 20",
);
for (const post of posts) {
  const { rows } = await pool.query(
    "SELECT email FROM users WHERE id = $1",
    [post.author_id],
  );
  post.authorEmail = rows[0].email;
}

// GOOD: one round-trip, explicit projection
const { rows: posts } = await pool.query(
  "SELECT p.id, p.title, p.created_at, u.email AS author_email " +
    "FROM posts p JOIN users u ON u.id = p.author_id " +
    "ORDER BY p.created_at DESC LIMIT 20",
);

// GOOD for bulk ops: batch with ANY($1)
const ids = posts.map((p) => p.id);
await pool.query(
  "UPDATE posts SET view_count = view_count + 1 WHERE id = ANY($1)",
  [ids],
);`,
        description:
          "The ANY($1) trick sends an entire array as one parameter — PostgreSQL expands it into an IN-style predicate while keeping the statement plan-cacheable.",
      },
      {
        title: "The same fix in Prisma",
        language: "ts",
        code: `// BAD: N+1 — relation loaded per item
const posts = await prisma.post.findMany({ take: 20 });
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// GOOD: one include for the relation, plus a lean select for list responses
const postsWithAuthors = await prisma.post.findMany({
  take: 20,
  orderBy: { createdAt: "desc" },
  include: { author: { select: { email: true } } },
});

// GOOD: batch a where-clause instead of looping finds
const emails = ["a@x.com", "b@x.com"];
const users = await prisma.user.findMany({ where: { email: { in: emails } } });`,
        description:
          "Prisma's include loads the relation with one extra query for lists (or a single JOIN for to-one relations) — both beat per-row findUnique by an order of magnitude.",
      },
    ],
    commonMistakes: [
      "Adding indexes before reading EXPLAIN — you may be fixing an N+1 problem that no index can touch.",
      "Using include: { comments: true } on a list endpoint and pulling 10,000 comments with 20 posts; cap relation queries with take and orderBy.",
      "Micro-optimising application loops while every request still does SELECT * on a wide table.",
      "Forgetting that Prisma's findMany with include returns nested arrays — serializing them for a REST list can balloon payload size 10×.",
      "Trusting local timings on a 1,000-row dev database — production skew surfaces different plans; always re-measure on realistic data.",
    ],
    bestPractices: [
      "Enable pg_stat_statements in staging and production; let it name the slowest queries instead of guessing.",
      "Give every list endpoint an explicit column projection (SELECT columns / Prisma select) — treat the API shape as a contract.",
      "Log query counts per request in development; middleware that counts pool.query calls makes N+1 bugs jump out immediately.",
      "Prefer keyset pagination beyond the first few pages (p2m2-pagination-filtering-sorting) — OFFSET is a hidden quadratic cost.",
      "Re-run EXPLAIN ANALYZE after every schema or index change and paste the plan into the PR description.",
    ],
    realWorldUseCases: [
      "A product listing that took 4 s dropped to 120 ms after replacing an N+1 author lookup with one join — no new hardware involved.",
      "Nightly ETL jobs switch from row-by-row INSERTs to unnest-based batches, cutting job time from hours to minutes.",
      "Search endpoints project only (id, title, snippet) so Postgres never reads the multi-megabyte body column for list views.",
    ],
    resources: [
      docs("PostgreSQL Documentation — Using EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html", "The measurement tool every optimisation starts from.", "en", "reference"),
      docs("Prisma Docs", OFFICIAL.prismaDocs, "Reference for include, select and query performance guidance.", "en", "reference"),
      ytSearch("N+1 query problem solutions SQL", "Walkthroughs of N+1 detection and batch or join fixes.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-n-plus-one",
        title: "Count your queries",
        prompt:
          "Wrap pool.query (or Prisma middleware) with a counter, then hit one of your Phase 2 list endpoints (e.g. GET /tasks or GET /posts). Record the query count. Rewrite the data-access code to remove every N+1 (JOIN, ANY($1), or include), re-hit the endpoint, and report before/after query counts and p95 latency. Paste both EXPLAIN ANALYZE outputs for the main query.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "A typical naive list endpoint: 1 list query + 1 per item for the author = N+1.",
          "For Prisma, prisma.$on('query') events or a query-logging extension count statements.",
        ],
      },
    ],
    projectIds: ["p2-blog-api", "p2-job-board-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-postgres-from-node",
    slug: "postgres-from-node-with-pg",
    title: "PostgreSQL from Node.js with pg",
    description:
      "The node-postgres driver: connection pools, clients vs pool.query, parameterised queries with $1 placeholders, and SQL injection prevention that actually works.",
    order: 12,
    estimatedMinutes: 24,
    tags: ["nodejs", "pg", "sql-injection", "connection-pool"],
    prerequisites: ["p2m2-express-app", "p2m4-select-queries"],
    relatedTopics: ["p2m4-transactions-acid", "p2m4-prisma-orm", "p2m1-error-propagation"],
    learningObjectives: [
      "Configure a pg.Pool with sane limits and timeouts from environment config",
      "Use pool.query for single statements and a dedicated client for transactions",
      "Write parameterised queries with $1 placeholders and understand how they bind",
      "Explain how string-concatenated SQL enables injection and how parameters eliminate it",
    ],
    simpleExplanation:
      "The `pg` package (node-postgres) is the standard way Node.js talks to PostgreSQL. It gives you a **pool** of reusable connections (opening a TCP connection per request would be ruinously slow), a `query(sql, params)` method that substitutes values safely via `$1` placeholders, and typed row results. Never build SQL by concatenating user input into a string — that is SQL injection; parameters make it structurally impossible.",
    detailedContent: `
**Install and configure.**

    npm install pg

The pool is the centrepiece: it keeps N connections open, lends one out per query, and reclaims it. Sizing matters — \`max\` (default 10) should stay *below* PostgreSQL's max_connections divided by your number of app instances. If every instance eagerly opens 100 connections, the database collapses under a connection storm.

**pool vs client.**

| API | Use for | Notes |
| --- | --- | --- |
| \`pool.query(sql, params)\` | Single statements | Borrows and returns a connection automatically |
| \`pool.connect()\` | Transactions, sessions | You must \`release()\` in \`finally\` |
| \`client.query\` | Statements on that client | Same connection across calls, so BEGIN/COMMIT work |

**Parameterised queries.** PostgreSQL uses numbered placeholders:

    await pool.query(
      "SELECT id, email FROM users WHERE email = $1 AND created_at >= $2",
      [email, since],
    );

The driver sends the SQL text and the values as *separate* protocol fields; the server parses the SQL once (plan cache) and binds values afterward. Values never become SQL syntax — no matter what they contain.

**SQL injection, concretely.** Concatenating:

    "SELECT * FROM users WHERE email = '" + email + "'"

with \`email = "x' OR '1'='1"\` produces:

    SELECT * FROM users WHERE email = 'x' OR '1'='1'

— the attacker closed your string and appended a condition. With \`$1\` the same payload is just a weird email value that matches nothing. **There is no reason to concatenate SQL.** The one place parameters cannot go is an identifier such as ORDER BY direction: map \`asc|desc\` → \`ASC|DESC\` through a strict allow-list in your code.

**Error handling.** pg throws Error objects whose \`code\` property is the SQLSTATE (\`23505\` unique violation, \`23503\` FK violation, \`40001\` serialization failure). Map these to domain errors in your service layer (p2m1-error-propagation) instead of parsing English messages.
    `,
    howItWorks: `
Under the hood pg speaks PostgreSQL's wire protocol v3: startup message, authentication ( scram-SHA-256 in modern setups ), then simple or extended queries. Parameterised queries use the *extended* protocol: Parse (SQL with $n), Bind (values), Describe, Execute. The server caches the parsed statement, so 10,000 calls with different values reuse one plan.

The pool tracks idle connections and validates them so a killed connection does not fail your next request. \`connectionTimeoutMillis\` and \`idleTimeoutMillis\` keep the pool from hanging forever when the database is down — pair them with a circuit breaker at the service layer and your API degrades gracefully instead of stacking 30-second timeouts on every incoming request.
    `,
    codeExamples: [
      {
        title: "A production-shaped pg module",
        language: "ts",
        code: `import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  // Idle client errors must never crash the process
  console.error("Unexpected PG idle client error", err);
});

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query(
    "SELECT id, email, display_name, created_at FROM users WHERE email = $1",
    [email],
  );
  return rows[0] ?? null;
}

export async function searchTasks(q: string, limit: number) {
  const sql =
    "SELECT id, title, status FROM tasks " +
    "WHERE title ILIKE $1 ORDER BY created_at DESC LIMIT $2";
  const { rows } = await pool.query(sql, ["%" + q + "%", limit]);
  return rows;
}`,
        description:
          "One exported pool for the whole app, environment-driven config, an error listener for idle clients, and every value passed as a parameter — including the user-supplied search string.",
      },
      {
        title: "Injection attempted, injection defeated",
        language: "ts",
        code: `// VULNERABLE — never ship this
async function badLogin(pool: pg.Pool, email: string, passwordHash: string) {
  const sql =
    "SELECT * FROM users WHERE email = '" + email +
    "' AND password_hash = '" + passwordHash + "'";
  const { rows } = await pool.query(sql);
  return rows[0];
}
// email = "x' OR '1'='1"  =>  WHERE email = 'x' OR '1'='1' AND ...
// The attacker is logged in without knowing any password.

// SAFE — same intent, structurally un-injectable
async function goodLogin(pool: pg.Pool, email: string, passwordHash: string) {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE email = $1 AND password_hash = $2",
    [email, passwordHash],
  );
  return rows[0] ?? null;
}`,
        description:
          "Same query, two worlds. In the safe version the payload is bound as data, the statement text never changes, and PostgreSQL's plan cache can even reuse the parsed statement across logins.",
      },
    ],
    commonMistakes: [
      "Concatenating user input into SQL 'just for ORDER BY' — use an allow-list mapping, never string building.",
      "Forgetting client.release() after pool.connect() — the pool silently empties and every later request hangs on connectionTimeoutMillis.",
      "Opening a new Pool per request or per module import in tests — pools multiply until Postgres refuses connections; export one pool.",
      "Leaving transactions open by using pool.query between BEGIN and COMMIT — each call may use a different connection.",
      "Parsing pg error messages as strings — switch on err.code (SQLSTATE) so message wording changes never break your logic.",
    ],
    bestPractices: [
      "One pool per process, configured from DATABASE_URL via environment variables (twelve-factor).",
      "Always parameterise; treat any query string built with + or template interpolation as a review blocker.",
      "Set statement_timeout on the pool or role so a pathological query cannot pin a connection forever.",
      "Wrap common SQLSTATE codes into typed domain errors at the data layer before they reach Express handlers.",
      "In tests, use a transaction-per-test helper (BEGIN ... ROLLBACK) so suites stay fast and isolated.",
    ],
    realWorldUseCases: [
      "Every classic Express + Postgres API: routes validate input (Zod, p2m2-input-validation), services hold logic, and a pg module owns all queries.",
      "Connection pooling is what lets one Node process safely multiplex thousands of concurrent HTTP requests onto ten database connections.",
      "Migration and seed scripts use the same parameterised helpers as the app — one data-access layer everywhere.",
    ],
    resources: [
      docs("node-postgres — Home", "https://node-postgres.com/", "Official site for the most widely used PostgreSQL client for Node.js.", "en", "reference"),
      docs("node-postgres — Queries", "https://node-postgres.com/features/queries", "Parameterised queries, types and streaming results.", "en", "15 min"),
      ytSearch("node postgres pg tutorial parameterized queries", "Node.js + PostgreSQL walkthroughs covering pools and injection safety.", "en", "15–25 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-pg",
        title: "Parameterise a vulnerable endpoint",
        prompt:
          "Take (or write) an Express route GET /users?email=... that currently builds SQL with string concatenation. Reproduce the injection with curl using the payload x' OR '1'='1. Then rewrite the handler to use a parameterised $1 query behind a pg.Pool, and prove the same payload now returns zero rows. Add an ORDER BY that accepts only asc or desc via an allow-list and reject anything else with 400.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "curl \"http://localhost:3000/users?email=x'%20OR%20'1'%3D'1\" shows the classic bypass before the fix.",
          "ORDER BY cannot be parameterised — validate the string against ['asc','desc'] and interpolate the uppercase keyword.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-auth-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-prisma-orm",
    slug: "prisma-orm",
    title: "Prisma ORM",
    description:
      "schema.prisma models and relations, generating the typed client, the CRUD API every Prisma app is built on, and when to drop to $queryRaw.",
    order: 13,
    estimatedMinutes: 25,
    tags: ["prisma", "orm", "typescript", "schema"],
    prerequisites: ["p2m4-postgres-from-node", "p2m1-typescript-node"],
    relatedTopics: ["p2m4-prisma-migrations", "p2m4-query-optimization", "p2m4-tables-rows-columns-keys"],
    learningObjectives: [
      "Write a schema.prisma file with models, relations and sensible defaults",
      "Generate the Prisma Client and use it from TypeScript with full type safety",
      "Perform CRUD with findMany, findUnique, create, update, delete and upsert",
      "Use include and select to load relations without N+1 queries",
      "Decide when a query must drop to $queryRaw",
    ],
    simpleExplanation:
      "Prisma is a type-safe ORM for Node.js: you declare your tables in a `schema.prisma` file, run one command, and get a client whose every method is typed against your schema. `prisma.user.findMany()` returns perfectly typed User rows, and refactoring a column name makes TypeScript flag every call site — no more hand-written row interfaces drifting from the database.",
    detailedContent: `
**The schema is the contract.** A minimal Postgres schema.prisma:

    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    model User {
      id          String   @id @default(uuid())
      email       String   @unique
      displayName String   @default("Anonymous")
      createdAt   DateTime @default(now())
      posts       Post[]
    }

    model Post {
      id        String   @id @default(uuid())
      title     String
      published Boolean  @default(false)
      authorId  String
      author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
      createdAt DateTime @default(now())

      @@index([authorId])
    }

Key syntax: \`String @id @default(uuid())\`, \`@unique\` (which also makes it a valid findUnique key), \`DateTime\` mapped to timestamptz on Postgres, \`@relation(fields: [...], references: [...])\` for foreign keys, and \`@@index([...])\` for the FK column we learned to always create.

**The client.** \`npx prisma generate\` reads the schema and emits \`@prisma/client\` with types derived from it:

    import { PrismaClient } from "@prisma/client";
    const prisma = new PrismaClient();

**CRUD API** (models are singular, camelCased — \`prisma.user\`):

| Call | SQL equivalent |
| --- | --- |
| \`findMany({ where, orderBy, take, skip })\` | SELECT with WHERE/ORDER/LIMIT |
| \`findUnique({ where: { id } })\` | SELECT by unique key |
| \`create({ data })\` | INSERT ... RETURNING |
| \`update({ where, data })\` | UPDATE |
| \`delete({ where })\` | DELETE |
| \`upsert({ where, create, update })\` | ON CONFLICT upsert |
| \`count({ where })\` | SELECT COUNT(*) |
| \`aggregate / groupBy\` | Aggregation queries |

**Relations without N+1.** \`include\` loads relations (an extra query per relation, or a JOIN for to-one); \`select\` trims columns; and you can combine them:

    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        author: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

**When to drop to $queryRaw.** Window functions, CTEs, \`FOR UPDATE\`, \`ON CONFLICT\` edge cases, \`EXPLAIN\`, and anything the Query API cannot express:

    const [{ count }] = await prisma.$queryRaw\`
      SELECT COUNT(*)::int AS count FROM orders
      WHERE status = \${status} AND created_at >= \${since}\`;

The tagged template keeps values parameterised (same $1 safety as pg). Prefer \`$queryRawUnsafe\` never — it is exactly the string-concatenation footgun from lesson 12.
    `,
    howItWorks: `
Prisma Client is not a thin SQL string builder at runtime: it ships a query engine (a Rust binary/WASM module) that receives a JSON description of your query, plans the SQL, opens connections from its own pool, and maps result rows back into JavaScript objects according to the schema. That is why relations become nested objects and why \`DateTime\` values arrive as JS Date instances.

Type generation happens at \`prisma generate\`: the generator walks the schema and emits TypeScript types mirroring your models, including relation shapes shaped by your include/select arguments. Running generate in CI (and in Docker builds) keeps the client in lockstep with the schema — a column rename fails the typecheck instead of failing at 3 a.m. in production.

Underneath, every call is still the parameterised SQL from lesson 12; Prisma just chooses it for you, which is why reading \`prisma.$explainRaw\` or turning on query logging matters when you need to verify a plan.
    `,
    codeExamples: [
      {
        title: "Typed CRUD in an Express service",
        language: "ts",
        code: `import { PrismaClient, Prisma } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.get("/posts", async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ data: posts });
  } catch (err) {
    next(err);
  }
});

app.post("/posts", async (req, res, next) => {
  try {
    const { title, body, authorId } = req.body as {
      title: string;
      body: string;
      authorId: string;
    };
    const post = await prisma.post.create({
      data: { title, body, authorId },
    });
    res.status(201).json(post);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return res.status(404).json({ error: "AUTHOR_NOT_FOUND" });
    }
    next(err);
  }
});

app.delete("/posts/:id", async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "POST_NOT_FOUND" });
    }
    next(err);
  }
});`,
        description:
          "Note the Prisma error codes: P2003 is a foreign-key violation (author missing), P2025 is 'record to delete not found'. Mapping them to HTTP statuses is the Prisma version of the SQLSTATE handling from lesson 12.",
      },
    ],
    commonMistakes: [
      "Calling prisma.user.findMany() and then looping findUnique per row — include or select the relation instead (N+1 lives everywhere, including ORMs).",
      "Using findUnique with a non-unique field — the Query API requires a unique constraint; add @unique or use findFirst.",
      "Forgetting @@index([...]) on FK columns — Prisma creates the FK but the performance habit from lesson 8 is still yours.",
      "Creating a new PrismaClient() per request or per test file — one client per process; many clients exhaust the connection pool.",
      "Leaving prisma generate out of your Docker build or CI step — the emitted types and runtime client must match the committed schema.",
    ],
    bestPractices: [
      "Keep the schema in version control and run prisma format + generate in CI so drift fails early.",
      "Use select on list endpoints to hold the API contract — include everything 'for convenience' bloats payloads.",
      "Validate request bodies with Zod (p2m2-input-validation) before they reach prisma.create; the schema is not an input validator.",
      "Map Prisma error codes to domain errors in one error-handling middleware, mirroring your SQLSTATE strategy.",
      "When a query feels awkward in the Query API, that is your signal to try $queryRaw — not to contort the client.",
    ],
    realWorldUseCases: [
      "Phase 2 auth APIs: users, password hashes, refresh tokens and unique-email enforcement all map directly to Prisma models with @unique.",
      "Blog APIs: Post → User relations with include give the /posts response its nested author shape in a single round-trip pair.",
      "Multi-tenant SaaS: every model carries tenantId, and a Prisma middleware/extension can inject the filter so no query forgets it.",
    ],
    resources: [
      docs("Prisma — Getting Started", OFFICIAL.prismaGettingStarted, "Official onboarding: init a project, model data, run your first query.", "en", "20 min"),
      docs("Prisma Docs", OFFICIAL.prismaDocs, "Full reference: schema, client API, error handling and raw queries.", "en", "reference"),
      ytSearch("Prisma ORM crash course PostgreSQL", "End-to-end Prisma + Postgres walkthroughs in Node.js.", "en", "20–40 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-prisma-crud",
        title: "Model and query a task API",
        prompt:
          "Create a Prisma schema with User (uuid id, unique email, displayName) and Task (uuid id, title, done Boolean default false, dueAt DateTime?, authorId FK with index) against a local PostgreSQL. npx prisma migrate dev --name init, then write a small script that: creates a user, creates three tasks for them, lists tasks where done = false with the author's email selected, updates one task to done = true, and deletes the user — verifying with psql what cascade did to the tasks. Paste the script and its output.",
        difficulty: "intermediate",
        estimatedMinutes: 40,
        hints: [
          "prisma migrate dev both applies the migration and regenerates the client — no manual generate needed afterwards.",
          "select: { author: { select: { email: true } } } loads the relation without the rest of the User columns.",
        ],
      },
    ],
    projectIds: ["p2-auth-api", "p2-blog-api"],
    quizId: "quiz-p2-m4",
  },
  {
    ...shared,
    id: "p2m4-prisma-migrations",
    slug: "prisma-migrations",
    title: "Prisma Migrations",
    description:
      "The migrations workflow: migrate dev vs migrate deploy vs db push, seeding, and keeping environments (dev, staging, production) in sync safely.",
    order: 14,
    estimatedMinutes: 20,
    tags: ["prisma", "migrations", "deployments", "seeding"],
    prerequisites: ["p2m4-prisma-orm"],
    relatedTopics: ["p2m4-prisma-orm", "p2m4-constraints", "p2m4-query-optimization"],
    learningObjectives: [
      "Explain what a Prisma migration is on disk and how migrate dev creates one",
      "Choose between migrate dev, migrate deploy and db push for each situation",
      "Seed reference data idempotently and wire it into the workflow",
      "Run the same migration pipeline safely across development, staging and production",
    ],
    simpleExplanation:
      "A migration is a checked-in folder of SQL that moves the database from schema version A to version B. During development you change schema.prisma and run `npx prisma migrate dev` — Prisma diffs, writes the SQL, applies it and regenerates the client. In production you never let the machine 'figure it out': you commit the migration and run `npx prisma migrate deploy` to apply exactly the committed files, in order, with a history table guarding against double-applies.",
    detailedContent: `
**The development loop.**

1. Edit \`schema.prisma\` (add a column, a relation, an index).
2. \`npx prisma migrate dev --name add_due_at\` — Prisma:
   - compares schema to the migrations history,
   - generates \`prisma/migrations/20261015120000_add_due_at/migration.sql\`,
   - applies it to your dev database,
   - regenerates the client,
   - runs seed scripts if configured.
3. Commit the schema change **and** the migration folder together.

**migrate vs db push.**

| Command | Creates migration files | Applies to DB | Use when |
| --- | --- | --- | --- |
| \`migrate dev\` | Yes | Yes (dev DB) | Daily development |
| \`migrate deploy\` | No | Yes (pending only) | Staging / production |
| \`db push\` | No | Yes, direct DDL | Prototyping; *no history* |
| \`generate\` | No | No | After any schema change, no DB touch |
| \`migrate reset\` | No | Drops + re-applies all | Only on throwaway dev DBs |

\`db push\` is tempting because it is instant, but it leaves no SQL history, cannot be reviewed in a PR, and cannot run against a production database with data you care about (destructive changes abort without a migration to eyeball). Use it for spikes; graduate to migrations the moment the schema is shared.

**Seeding.** A seed script lives at \`prisma/seed.ts\` and is wired in package.json:

    {
      "prisma": { "seed": "tsx prisma/seed.ts" }
    }

Make it **idempotent** with upsert so re-running never duplicates or crashes:

    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: { email: "admin@example.com", displayName: "Admin" },
    });

Always close with \`await prisma.$disconnect()\` so the process exits.

**Environments.** One rule: *the same migrations, applied in the same order, everywhere.* Dev databases get \`migrate dev\` freely; CI runs \`migrate deploy\` against an ephemeral database to prove the SQL is valid; production runs \`migrate deploy\` as a release step (before the new app version boots, or as an explicit init container). Use \`migrate diff\` and \`migrate status\` to audit drift. Destructive migrations (dropping a column) need a expand/contract strategy: add the new column and dual-write first, deploy code that reads it, *then* remove the old column in a later release — exactly the discipline any production database demands.
    `,
    howItWorks: `
Prisma keeps its own bookkeeping table, \`_prisma_migrations\`, recording every applied migration's checksum and timestamp. \`migrate deploy\` compares that table with the folders on disk: unapplied folders run in lexicographic (timestamp) order inside a transaction where PostgreSQL supports it, and a checksum mismatch on an already-applied migration halts the deploy — protecting you from someone editing history.

The migration SQL itself is ordinary PostgreSQL DDL. Prisma's diffing engine (\`migrate diff\`) computes the change set from your schema models — including its defaults for @@index and relation constraints — so the generated SQL follows the same conventions the lessons taught by hand (FK actions, index-on-FK). You can and should read every migration file before merging it; it is a reviewable artifact, not magic.
    `,
    codeExamples: [
      {
        title: "The daily workflow",
        language: "bash",
        code: `# 1. Change schema.prisma (add a column, index, relation...)

# 2. Create + apply a migration, regenerate the client
npx prisma migrate dev --name add_task_due_at

# 3. Inspect exactly what will run in production
cat prisma/migrations/*/migration.sql

# 4. Check state / drift on any environment
npx prisma migrate status

# 5. Production deploy step (never migrate dev here)
npx prisma migrate deploy

# After editing schema without touching the database (e.g. types only)
npx prisma generate`,
        description:
          "Read the generated migration.sql every time — it is the artifact your DBA, your future self and your rollback plan all depend on.",
      },
      {
        title: "An idempotent seed script",
        language: "ts",
        code: `import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { displayName: "Admin" },
    create: { email: "admin@example.com", displayName: "Admin" },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-welcome" },
    update: {},
    create: {
      id: "seed-task-welcome",
      title: "Welcome to NodePath",
      done: false,
      authorId: admin.id,
    },
  });

  console.log("Seeded admin and welcome task");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`,
        description:
          "upsert + a fixed uuid makes the seed safe to re-run on every migrate dev and in CI. The finally block guarantees the process exits even on failure — critical in CI containers.",
      },
    ],
    commonMistakes: [
      "Editing a migration file after it has been applied somewhere — the checksum mismatch will brick deploys; write a new migration instead.",
      "Using db push against shared or production databases — no history, no review, no rollback story.",
      "Running migrate dev in production — it can reset, reseed and rewrite the dev database; production gets migrate deploy only.",
      "Seeding with plain create calls that crash on the second run — upsert everywhere so seeds are idempotent.",
      "Deploying new app code before its migration has run — the code expects a column the database does not have yet; order migrations first.",
    ],
    bestPractices: [
      "Commit schema.prisma and the generated migration folder in the same pull request; review the SQL like application code.",
      "Run migrate deploy in CI against an ephemeral Postgres to catch invalid SQL before it reaches staging.",
      "Adopt expand/contract for destructive changes: additive first, switch reads, then drop in a later release.",
      "Keep migrations forward-only in production; prepare data backfills as separate, resumable scripts rather than migration side effects.",
      "Use prisma migrate diff --from-migrations --to-schema-datamodel to verify drift between committed history and the schema at any time.",
    ],
    realWorldUseCases: [
      "A typical release pipeline: build image → run migrate deploy against staging → smoke tests → migrate deploy in production → roll out new pods.",
      "Feature branches each carry their migration; the merge order of branches must match the timestamp order of migration folders — coordinate with your team's numbering.",
      "Disaster recovery: replaying the committed migrations onto a fresh database reconstructs the full schema — backups store data, migrations store structure.",
    ],
    resources: [
      docs("Prisma — Getting Started", OFFICIAL.prismaGettingStarted, "Official onboarding including the migrate workflow and project layout.", "en", "20 min"),
      docs("Prisma Docs", OFFICIAL.prismaDocs, "Migrations reference: migrate dev, deploy, diff, status and seeding.", "en", "reference"),
      ytSearch("Prisma migrate dev deploy migrations tutorial", "Workflow demos covering local development and production deploys.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p2m4-migrations",
        title: "Ship a schema change end to end",
        prompt:
          "Starting from a Prisma project with one model: add a second field to the model, run migrate dev --name add_field, and open the generated migration.sql — paste its contents. Then simulate a teammate's environment: drop the database, recreate it empty, and run only npx prisma migrate deploy, proving the schema comes back identically. Finally break things on purpose: apply the migration, then edit the migration.sql file and run migrate deploy again — record the checksum error you see and explain why Prisma refuses.",
        difficulty: "intermediate",
        estimatedMinutes: 35,
        hints: [
          "migrate reset (dev only) is the quickest way to rebuild from migrations from scratch.",
          "The history table _prisma_migrations stores a checksum of each applied migration — that is what catches edited history.",
        ],
      },
    ],
    projectIds: ["p2-task-api", "p2-inventory-api"],
    quizId: "quiz-p2-m4",
  },
];

export const quiz: Quiz = {
  id: "quiz-p2-m4",
  moduleId: "p2-m4",
  title: "Module 4 quiz — SQL, PostgreSQL & Prisma",
  description:
    "Test your understanding of relational fundamentals, SQL querying, joins and aggregates, constraints, indexes, transactions, pg and Prisma migrations.",
  questions: [
    {
      id: "q-p2m4-1",
      type: "multiple-choice",
      prompt:
        "Table users has ids 1, 2, 3. Table orders.user_id contains the value 2 and one NULL. What does this query return?",
      code: `SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM orders);`,
      language: "sql",
      options: [
        "Ids 1 and 3",
        "Id 1 only",
        "No rows at all",
        "A syntax error",
      ],
      correctIndex: 2,
      explanation:
        "NOT IN with a subquery containing NULL returns no rows: for every id the comparison id <> NULL is UNKNOWN (not TRUE), and WHERE only keeps TRUE rows. NOT EXISTS would correctly return ids 1 and 3.",
      optionExplanations: [
        "That would be the answer if the subquery had no NULLs.",
        "Id 2 is correctly excluded by the NOT, but the NULL poisons the whole predicate.",
        "Correct — one NULL in the subquery makes the entire NOT IN predicate UNKNOWN for every row.",
        "The syntax is perfectly valid; it fails semantically, silently.",
      ],
    },
    {
      id: "q-p2m4-2",
      type: "code-output",
      prompt: "Given the orders table below, what rows does this query return?",
      code: `-- Table: orders
-- | id | user_id | total |
-- | 1  | 'a'     | 10.00 |
-- | 2  | 'a'     | 15.00 |
-- | 3  | 'b'     |  5.00 |

SELECT user_id, COUNT(*) AS cnt, SUM(total) AS spent
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 1;`,
      language: "sql",
      options: [
        "One row: a | 2 | 25.00",
        "Two rows: a | 2 | 25.00 and b | 1 | 5.00",
        "One row: a | 3 | 30.00",
        "Two rows: a | 2 | 25.00 and a | 1 | 15.00",
      ],
      correctIndex: 0,
      explanation:
        "GROUP BY user_id creates two groups: 'a' (two rows, 10+15) and 'b' (one row, 5). HAVING COUNT(*) > 1 removes group 'b', leaving only a | 2 | 25.00.",
      optionExplanations: [
        "Correct — group 'b' has only one row and fails the HAVING filter.",
        "That would be the result without the HAVING clause.",
        "The count is 2 (number of rows in group 'a'), not 3, and the sum is 25.00.",
        "GROUP BY collapses the two 'a' rows into one output row — duplicates cannot appear.",
      ],
    },
    {
      id: "q-p2m4-3",
      type: "multiple-choice",
      prompt:
        "orders.user_id is declared REFERENCES users(id) ON DELETE CASCADE. What happens when you run DELETE FROM users WHERE id = $1 and that user has five order rows?",
      options: [
        "The delete fails with a foreign key violation",
        "The five order rows are deleted along with the user, in the same transaction",
        "The user's user_id column in those orders is set to NULL",
        "The orders remain, pointing at a missing user",
      ],
      correctIndex: 1,
      explanation:
        "ON DELETE CASCADE tells PostgreSQL to remove every child row referencing the deleted parent. SET NULL would blank the column instead, RESTRICT/NO ACTION would refuse the delete, and orphans can never exist while the FK is enforced.",
      optionExplanations: [
        "That is the behaviour of RESTRICT or NO ACTION (the default), not CASCADE.",
        "Correct — the engine recursively deletes children atomically with the parent.",
        "That is ON DELETE SET NULL, and the column would also need to be nullable.",
        "Referential integrity forbids that; the whole point of the FK.",
      ],
    },
    {
      id: "q-p2m4-4",
      type: "find-bug",
      prompt:
        "The query below fails at compile time / typecheck with 'email is not a unique field'. What is wrong and how do you fix it?",
      code: `-- schema.prisma
model User {
  id    Int    @id @default(autoincrement())
  email String
  name  String
}

// code.ts
const user = await prisma.user.findUnique({
  where: { email: "amina@example.com" },
});`,
      language: "ts",
      options: [
        "findUnique must be awaited inside a transaction — wrap it in prisma.$transaction",
        "The email column must be added to include — use include: { email: true }",
        "Bug: findUnique only accepts unique fields, but email lacks @unique — add @unique to email or use findFirst",
        "There is no bug; findUnique accepts any column in where",
      ],
      correctIndex: 2,
      explanation:
        "Prisma's findUnique requires the where clause to be built on fields with a unique constraint (the @id or @unique attributes), because it maps to a lookup the database can satisfy with a unique index. Add @unique to email (and migrate), or switch to findFirst, which allows arbitrary filters.",
      optionExplanations: [
        "Transactions are unrelated; the failure is in the where clause shape.",
        "include loads relations, not scalar columns — it cannot make a non-unique key usable.",
        "Correct — either make email truly unique in the schema (the right fix for login lookups) or use findFirst.",
        "A common myth: at runtime Prisma would reject the query because no unique index backs it.",
      ],
    },
    {
      id: "q-p2m4-5",
      type: "code-output",
      prompt: "Given users and orders below, what does this query return?",
      code: `-- users: (1,'a'), (2,'b')
-- orders: (10, user_id=1), (11, user_id=1)

SELECT u.name, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY u.name;`,
      language: "sql",
      options: [
        "a | 2 and b | 0",
        "a | 2 and b | (null)",
        "a | 2, b | 1 and one row with name (null)",
        "a | 2 only — user b is dropped",
      ],
      correctIndex: 0,
      explanation:
        "LEFT JOIN keeps both users; user b gets a NULL-padded orders row. COUNT(o.id) counts only non-NULL values, so b correctly shows 0, not NULL. COUNT(*) would have shown 1 for b because it counts the padded row.",
      optionExplanations: [
        "Correct — COUNT(o.id) skips the NULL padding and yields a real 0.",
        "COUNT returns a number, never NULL, whenever at least one row is in the group.",
        "There is no NULL name group; both users have names, and no extra rows are produced.",
        "LEFT JOIN guarantees the left table's rows survive; only INNER JOIN would drop b.",
      ],
    },
    {
      id: "q-p2m4-6",
      type: "multiple-choice",
      prompt: "Which statement about PostgreSQL indexes is correct?",
      options: [
        "Indexes only speed up reads; they have no effect on writes",
        "Every column should have its own index for maximum coverage",
        "Composite index column order does not matter as long as all columns appear",
        "Indexes speed up reads but add write and storage cost, so they should be measured with EXPLAIN before adding",
      ],
      correctIndex: 3,
      explanation:
        "Every index must be maintained on INSERT/UPDATE/DELETE and consumes disk and cache. Composite order matters: leading equality columns then range columns, per the B-tree rule. Measuring with EXPLAIN (ANALYZE, BUFFERS) before and after is the only honest way to decide.",
      optionExplanations: [
        "Indexes tax every write — a table with ten indexes performs ten extra page updates per insert.",
        "Wasted indexes slow every write and bloat the database with no read benefit.",
        "A query can only use a B-tree efficiently when it constrains a prefix of the indexed columns.",
        "Correct — the read/write trade-off plus the equality-then-range rule is the whole lesson.",
      ],
    },
    {
      id: "q-p2m4-7",
      type: "short-answer",
      prompt:
        "Which SQL clause filters groups after aggregation has been applied (as opposed to WHERE, which filters rows before grouping)? Answer with the clause name only.",
      acceptedKeywords: ["having"],
      explanation:
        "HAVING filters the output of GROUP BY — for example HAVING COUNT(*) >= 3. WHERE runs before grouping and cannot reference aggregates; HAVING runs after and can.",
    },
    {
      id: "q-p2m4-8",
      type: "multiple-choice",
      prompt:
        "Which approach makes the following endpoint safe from SQL injection when email comes straight from the query string?",
      code: `app.get("/users", async (req, res) => {
  const email = req.query.email as string;
  // ... how should the query run?
});`,
      language: "ts",
      options: [
        "Concatenate: pool.query(\"SELECT * FROM users WHERE email = '\" + email + \"'\")",
        "Call email.replace(/'/g, \"\") before concatenating",
        "Parameterise: pool.query(\"SELECT * FROM users WHERE email = $1\", [email])",
        "JSON.stringify(email) and then concatenate the result",
      ],
      correctIndex: 2,
      explanation:
        "Parameterised queries send SQL and values as separate protocol fields; the value is always data, never syntax, so the classic ' OR '1'='1 payload matches nothing. Manual escaping and quote-stripping are bypassable in edge cases; concatenation is the vulnerability itself.",
      optionExplanations: [
        "This is the textbook injection: x' OR '1'='1 turns into a always-true condition.",
        "Stripping quotes breaks legitimate emails and can often be bypassed with other encodings.",
        "Correct — $1 placeholders are the structural fix, identical in pg and Prisma's $queryRaw.",
        "JSON encoding is not SQL escaping; the quotes still break out of the string literal.",
      ],
    },
  ],
};
