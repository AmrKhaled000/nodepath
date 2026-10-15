import type { Lesson, Quiz } from "@/types";
import { lessonResources } from "../helpers/resources";

export const meta = {
  id: "p1-m2",
  slug: "javascript-fundamentals",
  title: "JavaScript Fundamentals",
  description:
    "The core language every Node.js developer must master: variables, types, operators, control flow, functions, scope, closures, objects, arrays, destructuring, spread, template literals, array methods, errors, classes, this, modules, promises, async/await, callbacks, the event loop and debugging.",
  phaseId: "phase-1",
  order: 2,
};

const shared = {
  phaseId: "phase-1",
  moduleId: "p1-m2",
  difficulty: "beginner",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p1m2-variables-data-types",
    slug: "variables-and-data-types",
    title: "Variables and Data Types",
    description:
      "Binding names to values, the seven primitive types, typeof quirks, and the implicit coercion traps that catch every beginner.",
    order: 1,
    estimatedMinutes: 18,
    tags: ["variables", "types", "fundamentals"],
    prerequisites: [],
    relatedTopics: ["p1m2-let-const-var", "p1m2-operators-expressions", "p1m1-json"],
    learningObjectives: [
      "Create variables and explain what a binding actually is",
      "Identify all seven primitive types and the one non-primitive typeof result",
      "Predict the output of typeof for every primitive, including null's famous quirk",
      "Recognise and avoid common implicit coercion traps",
    ],
    simpleExplanation:
      "A variable is just a labelled box: you give a name to a value so you can use the name later. JavaScript has a small set of primitive value types (string, number, bigint, boolean, null, undefined, symbol) plus objects. JavaScript converts types automatically in many situations (coercion), which is convenient but full of surprises — learning where it happens saves hours of debugging.",
    detailedContent: `
A **variable** is a *binding*: a name linked to a value in memory. JavaScript is dynamically typed — the type belongs to the *value*, not the variable — so the same variable can hold a string on one line and an object on the next.

### Primitive types

| Type | Example | Notes |
| --- | --- | --- |
| \`string\` | \`"hello"\`, \`'hi'\` | Text; immutable |
| \`number\` | \`42\`, \`3.14\`, \`NaN\`, \`Infinity\` | IEEE-754 double; safe integers up to 2^53−1 |
| \`bigint\` | \`9007199254740993n\` | Arbitrary-precision integers; cannot mix with \`number\` in arithmetic |
| \`boolean\` | \`true\`, \`false\` | Logical values |
| \`null\` | \`null\` | Intentional “no value” |
| \`undefined\` | \`undefined\` | Uninitialised binding or missing property |
| \`symbol\` | \`Symbol("id")\` | Unique, immutable identifier |

Everything else is an **object** — including arrays and functions.

### The \`typeof\` quirks

- \`typeof null === "object"\` — a bug preserved for backward compatibility since 1995.
- \`typeof NaN === "number"\` — NaN stands for “Not-a-Number” but is still a number value.
- \`typeof [] === "object"\` and \`typeof function(){} === "function"\`.

Use \`Array.isArray(x)\` for arrays and \`x !== null && typeof x === "object"\` for real objects.

### Implicit coercion traps

JavaScript converts types automatically in loose comparisons and mixed arithmetic. \`"5" * 2 === 10\` (string → number), but \`"5" + 2 === "52"\` (number → string, because \`+\` also concatenates). \`[] == false\` is \`true\`. These surprises are why \`===\` (strict equality, no coercion) is the default choice.
    `,
    howItWorks: `
When you write \`const name = "Ada"\`, the engine creates a binding \`name\` in the current scope pointing at the string value \`"Ada"\`. Values are copied for primitives, but *references* are shared for objects (see the objects lesson later).

\`typeof\` is an operator that inspects an internal tag on the value: primitives report their type string; \`null\`’s internal tag happens to be \`"object"\` (legacy bug); arrays and plain objects also report \`"object"\`; functions carry a callable tag and report \`"function"\`.

Coercion happens inside operators: \`+\` prefers string concatenation if either side is a string; \`-\`, \`*\`, \`/\` coerce both sides to numbers; \`==\` walks a fixed coercion table (ToPrimitive → ToNumber, etc.) while \`===\` skips all of that and compares type + value directly.
    `,
    codeExamples: [
      {
        title: "Exploring types and coercion",
        language: "js",
        code: `const name = "Ada";
let age = 36;
const pi = 3.14159;
const big = 9007199254740993n;
const isActive = true;
const middleName = null;
let nothing;

console.log(typeof name, typeof age, typeof pi);   // string number number
console.log(typeof big, typeof isActive);          // bigint boolean
console.log(typeof middleName, typeof nothing);    // object undefined
console.log(typeof NaN, typeof [1, 2]);            // number object

console.log("5" * 2);   // 10  (string coerced to number)
console.log("5" + 2);   // "52" (number coerced to string)
console.log("5" == 5);  // true  (loose)
console.log("5" === 5); // false (strict)`,
        description:
          "Run each line and confirm the typeof results, including the null and NaN quirks. Notice how + and * coerce differently.",
      },
    ],
    commonMistakes: [
      "Using == in equality checks and being surprised by coercion (\\\"\\\" == 0 is true).",
      "Assuming typeof null returns \\\"null\\\" — it returns \\\"object\\\".",
      "Mixing bigint and number in arithmetic (throws TypeError).",
      "Expecting typeof to distinguish arrays from plain objects — both return \\\"object\\\".",
    ],
    bestPractices: [
      "Prefer === and !== unless you deliberately want coercion.",
      "Use meaningful names (isAdmin, userCount) instead of single letters except in tiny loops.",
      "Pick one declaration style per project: const by default, let when reassignment is needed.",
      "Use Array.isArray() and explicit null checks instead of relying on typeof for objects.",
    ],
    realWorldUseCases: [
      "Form data arrives as strings from JSON query params — you must convert with Number() or parseInt() deliberately.",
      "API payloads often contain null for missing fields; distinguishing null from undefined matters when merging objects.",
      "Debugging TypeError: x is not a function frequently traces back to a value whose type you assumed wrongly.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — JavaScript data types and data structures",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures",
        description: "Canonical description of primitives, objects, and the type system.",
      },
      videos: [
        {
          query: "JavaScript data types and variables for beginners",
          description: "Visual introductions to primitives, bindings and typeof.",
          estimatedDuration: "8–15 min",
        },
        {
          query: "JavaScript type coercion explained == vs ===",
          description: "Walkthroughs of implicit conversion rules and why === is preferred.",
          estimatedDuration: "8–12 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-types",
        title: "Predict typeof",
        prompt:
          "Without running the code, write the typeof result for each: 0, '', null, undefined, NaN, 10n, Symbol('x'), [ ], { }, () => {}. Then run a script and verify your answers.",
        difficulty: "beginner",
        estimatedMinutes: 10,
        hints: ["null is the famous quirk", "Arrays are objects; functions report \\\"function\\\""],
      },
      {
        id: "ex-p1m2-coercion",
        title: "Coercion detective",
        prompt:
          "Explain in one sentence why each expression is true, then rewrite it with === so it is false: 0 == '', 1 == '1', null == undefined, [] == false.",
        difficulty: "beginner",
        estimatedMinutes: 12,
        hints: ["Follow the == coercion chain: ToPrimitive then ToNumber", "[] converts to '' via toString()"],
        solution: `// Loose equality chains:
console.log(0 == '');        // true: '' → 0, 0 === 0
console.log(1 == '1');       // true: '1' → 1
console.log(null == undefined); // true (special rule, no other == pair behaves this way)
console.log([] == false);    // true: [] → '' → 0, false → 0

// Strict versions are all false:
console.log(0 === '');
console.log(1 === '1');
console.log(null === undefined);
console.log([] === false);`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-let-const-var",
    slug: "let-const-and-var",
    title: "let, const and var",
    description:
      "Declaration keywords, block scope vs function scope, hoisting, the temporal dead zone, and when you will still meet var in old code.",
    order: 2,
    estimatedMinutes: 16,
    tags: ["declaration", "scope", "hoisting"],
    prerequisites: ["p1m2-variables-data-types"],
    relatedTopics: ["p1m2-scope-closures", "p1m2-loops", "p1m2-conditionals"],
    learningObjectives: [
      "Choose between const and let in everyday code",
      "Explain block scope and how it differs from function scope",
      "Describe hoisting and the temporal dead zone",
      "Read legacy code that uses var without being confused by it",
    ],
    simpleExplanation:
      "const creates a binding you cannot reassign; let creates one you can. Both are block-scoped — they exist only inside the nearest { } braces. var is the old keyword: it is function-scoped and hoisted in a way that often produces undefined instead of an error. Modern code uses const by default and let only when reassignment is needed.",
    detailedContent: `
### Comparison

| Feature | var | let | const |
| --- | --- | --- | --- |
| Scope | Function (or global) | Block | Block |
| Hoisting | Initialized to \`undefined\` | Hoisted but TDZ | Hoisted but TDZ |
| Redeclaration in same scope | Allowed (silent overwrite) | Error | Error |
| Reassignment | Yes | Yes | No |

### Block scope

\`{ }\` creates a block for let/const, if statements, and loops — not just functions:

\`\`\`js
for (let i = 0; i < 3; i++) {
  // i is unique per iteration here
}
// i is not accessible outside
\`\`\`

### Hoisting and the temporal dead zone (TDZ)

All declarations are hoisted to the top of their scope during compilation, but:

- \`var x;\` hoists as \`x = undefined\` — reading it before assignment returns \`undefined\`.
- \`let\`/\`const\` hoist *without* initialization. Accessing them before the declaration line throws a \`ReferenceError\`. The region from scope start to the declaration is the **temporal dead zone**.

\`\`\`js
console.log(a); // undefined (var)
console.log(b); // ReferenceError: Cannot access 'b' before initialization (let)
var a = 1;
let b = 2;
\`\`\`

### When var still appears

Older libraries, tutorials, and stack-overflow answers pre-2015 use var. You may also see \`var\` inside non-module scripts where it creates a global. Read it, understand it, but write const/let.
    `,
    howItWorks: `
The JavaScript engine performs two passes over a scope: it first *creates* all bindings (hoisting), then *executes* statements in order. For var, “creation” assigns undefined; for let/const, “creation” marks the binding as uninitialised, so any read before the declaration hits the TDZ and throws.

Block scope for let/const is implemented by treating each \`{...}\` as a new lexical environment. Each loop iteration of \`for (let i ...)\` actually gets its own environment — which is why closures inside loops capture the expected value (a classic var pitfall).
    `,
    codeExamples: [
      {
        title: "var vs let/const in practice",
        language: "js",
        code: `// Function vs block scope
function demo() {
  var x = 1;
  let y = 2;
  const z = 3;
  if (true) {
    var x = 10;   // same binding — overwrites outer x
    let y = 20;   // new block-scoped binding
    console.log(x, y, z); // 10 20 3
  }
  console.log(x, y); // 10 2 — outer y was not touched
}
demo();

// TDZ
try {
  console.log(count); // ReferenceError
} catch (e) {
  console.log(e.name); // ReferenceError
}
let count = 5;

// const prevents reassignment, not mutation
const user = { name: "Ada" };
user.name = "Grace"; // OK — object still mutable
console.log(user.name); // "Grace"`,
        description:
          "The reassignment of x inside the if updates the same var binding, while let y shadows it. const stops rebinding, not property mutation.",
      },
    ],
    commonMistakes: [
      "Thinking const freezes an object — it only prevents reassignment of the binding.",
      "Using var in loops and being surprised when every iteration shares one i (the classic closure bug).",
      "Declaring let after use and expecting undefined like var — you get a ReferenceError instead.",
      "Redeclaring let in the same block (SyntaxError) when you meant to reassign.",
    ],
    bestPractices: [
      "const by default; let when you must reassign; never introduce new var.",
      "Keep declarations as close to first use as possible to minimise TDZ windows.",
      "Use block-scoped let in for loops so each iteration has its own i.",
      "When maintaining old code, do not convert var to let blindly inside loops — the closure semantics change.",
    ],
    realWorldUseCases: [
      "Loop counters and accumulators use let; configuration objects and dependencies use const.",
      "Legacy jQuery-era codebases still contain var — you need to read it safely during refactors.",
      "Interview questions and bug reports often centre on the loop + var + closure pitfall.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — let",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let",
        description: "Full specification of let, block scope and the temporal dead zone.",
      },
      videos: [
        {
          query: "let const var JavaScript difference explained",
          description: "Side-by-side comparisons of the three declaration keywords.",
          estimatedDuration: "8–14 min",
        },
      ],
      article: {
        title: "MDN — var",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var",
        provider: "developer.mozilla.org",
        description: "Why var behaves differently and how to reason about legacy code.",
        estimatedDuration: "8 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-declare",
        title: "Pick the keyword",
        prompt:
          "For each scenario choose const, let or var and justify in one line: (1) a fixed API base URL, (2) a loop counter that increments, (3) a function-scoped accumulator in legacy code you cannot change yet, (4) a user object that will gain properties, (5) a counter that is reassigned.",
        difficulty: "beginner",
        estimatedMinutes: 8,
        hints: ["const = never reassigned", "var only when forced by legacy constraints"],
      },
    ],
    projectIds: ["p1-calculator", "p1-notes-cli"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-operators-expressions",
    slug: "operators-and-expressions",
    title: "Operators and Expressions",
    description:
      "Arithmetic, assignment, comparison (== vs ===), logical && || ??, the ternary operator, and precedence pitfalls.",
    order: 3,
    estimatedMinutes: 20,
    tags: ["operators", "expressions", "syntax"],
    prerequisites: ["p1m2-variables-data-types"],
    relatedTopics: ["p1m2-conditionals", "p1m2-functions"],
    learningObjectives: [
      "Use arithmetic and assignment operators correctly",
      "Explain the difference between == and === and when == is safe",
      "Apply &&, || and ?? including short-circuit behaviour",
      "Read and write ternary expressions without readability loss",
    ],
    simpleExplanation:
      "Operators combine values into new values. Arithmetic (\\`+ - * / % **\\`) works on numbers (and strings for \\`+\\`). Comparison comes in two flavours: \\`==\\` converts types first, \\`===\\` does not. Logical operators \\`&&\\` and \\`||\\` return one of their operands (not a boolean!) and short-circuit; \\`??\\` only triggers on null/undefined. The ternary \\`cond ? a : b\\` is a compact if/else that returns a value.",
    detailedContent: `
### Arithmetic and assignment

- \`+\`, \`-\`, \`*\`, \`/\`, \`%\` (remainder), \`**\` (exponent).
- Compound assignment: \`+= -= *= /= %= **=\`.
- \`++\` and \`--\` return the value *before* or *after* depending on prefix/postfix position.

### Comparison

| Operator | Coerces? | Example |
| --- | --- | --- |
| \`==\` | Yes | \`'1' == 1\` → \`true\` |
| \`===\` | No | \`'1' === 1\` → \`false\` |
| \`!=\` | Yes | \`null != undefined\` → \`false\` |
| \`!==\` | No | \`null !== undefined\` → \`true\` |
| \`>\`, \`<\`, \`>=\`, \`<=\` | Yes (ToNumber/ToPrimitive) | \`'10' > 9\` → \`true\` |

The only safe loose comparison: \`x == null\` checks for null **or** undefined in one shot.

### Logical operators return operands

\`a && b\` returns \`a\` if \`a\` is falsy, else \`b\`. \`a || b\` returns \`a\` if \`a\` is truthy, else \`b\`. This powers defaults and guards:

\`\`\`js
const name = user.name || "anonymous";   // fallback on any falsy value
const port = config.port ?? 3000;        // fallback only on null/undefined
user.admin && console.log("admin logged");
\`\`\`

\`??\` is crucial when 0, '' or false are *valid* values you do not want replaced.

### Ternary

\`condition ? whenTrue : whenFalse\`. Keep it single-line; nest at most once for readability. It is an *expression* — it produces a value — unlike if/else which is a statement.
    `,
    howItWorks: `
Expressions are evaluated left-to-right with precedence rules (similar to maths): \`**\` > unary \`! - +\` > \`* / %\` > \`+ -\` > comparisons > \`== ===\` > \`&&\` > \`||\` > \`??\` > ternary > assignment.

Short-circuiting means \`&&\`/\`||\`/\`??\` stop evaluating as soon as the result is known — the right side is never executed. This is why \`obj && obj.method()\` is a safe guard: if \`obj\` is falsy, \`method()\` is never called.

\`??\` cannot be mixed with \`&&\`/\`||\` without parentheses (SyntaxError), preventing ambiguous chains.
    `,
    codeExamples: [
      {
        title: "Operators in action",
        language: "js",
        code: `// Arithmetic
console.log(10 % 3);   // 1 (remainder)
console.log(2 ** 10);  // 1024
console.log(7 / 2);    // 3.5 — always float division

// Comparison
console.log("5" == 5);  // true
console.log("5" === 5); // false
console.log(x == null); // safe null/undefined check (if x exists)

// Logical short-circuit returns operands
const user = null;
console.log(user && user.name);   // null (never throws)
const config = { port: 0 };
console.log(config.port || 3000); // 3000 — BUG: 0 is valid but falsy
console.log(config.port ?? 3000); // 0  — ?? only replaces null/undefined

// Ternary as an expression
const age = 20;
const status = age >= 18 ? "adult" : "minor";
console.log(status); // "adult"`,
        description:
          "Note the classic || vs ?? bug with port 0. Always prefer ?? when the falsy value itself is meaningful.",
      },
    ],
    commonMistakes: [
      "Using || for defaults when 0 or '' are valid values — use ?? instead.",
      "Mixing ?? with && or || without parentheses (SyntaxError).",
      "Confusing postfix ++ return value: (i++) returns old value, (++i) returns new.",
      "Deeply nested ternaries that become unreadable — use an if/else instead.",
    ],
    bestPractices: [
      "Default to === and !==; only use == for x == null.",
      "Use ?? for nullish defaults, || only when any falsy value should be replaced.",
      "Parenthesise complex logical expressions even when precedence would work — clarity wins.",
      "Keep ternaries to one level; convert to if/else for multiple branches.",
    ],
    realWorldUseCases: [
      "Express handlers use req.query.page || 1 style defaults — understanding || vs ?? prevents off-by-zero bugs.",
      "Feature flags: featureEnabled && renderFeature() short-circuits cleanly.",
      "Form validation uses ternaries to compute error messages inline.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Expressions and operators",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators",
        description: "Complete reference for every JavaScript operator.",
      },
      videos: [
        {
          query: "JavaScript logical operators AND OR nullish coalescing",
          description: "Short-circuit behaviour and ?? vs || explained.",
          estimatedDuration: "8–12 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-operators",
        title: "Rewrite with ??",
        prompt:
          "Given config = { retries: 0, host: '', region: null }, rewrite each default so valid falsy values survive: retries || 3, host || 'localhost', region || 'us-east-1'. Then verify with console.log.",
        difficulty: "beginner",
        estimatedMinutes: 10,
        hints: ["?? only replaces null and undefined", "host: '' may actually need || if empty host is invalid"],
        solution: `const config = { retries: 0, host: '', region: null };

console.log(config.retries ?? 3);      // 0 (kept)
console.log(config.host || 'localhost'); // 'localhost' (empty host is invalid here)
console.log(config.region || 'us-east-1'); // 'us-east-1' (null is falsy either way)

// Choose per field: ?? preserves valid falsy; || replaces any falsy.`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-conditionals",
    slug: "conditionals-and-truthiness",
    title: "Conditionals and Truthiness",
    description: "if/else if/else, truthiness rules, switch with fall-through, and when the ternary is readable enough.",
    order: 4,
    estimatedMinutes: 15,
    tags: ["conditionals", "control-flow", "truthiness"],
    prerequisites: ["p1m2-operators-expressions"],
    relatedTopics: ["p1m2-loops", "p1m2-functions"],
    learningObjectives: [
      "Write multi-branch if/else if/else chains",
      "List the falsy values and reason about truthiness of objects/arrays",
      "Use switch with intentional fall-through and default",
      "Decide between ternary and if/else for readability",
    ],
    simpleExplanation:
      "Conditionals let your program choose a path. \\`if (condition)\\` runs a block when the condition is truthy. JavaScript has six falsy values (false, 0, '' , null, undefined, NaN) — everything else is truthy, including [] and {}. The switch statement compares against cases with strict equality and ‘falls through’ to the next case unless you break.",
    detailedContent: `
### if / else if / else

\`\`\`js
if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else {
  grade = "C";
}
\`\`\`

Conditions are coerced to boolean. Empty blocks or assignments inside conditions (\`if (x = 5)\`) are classic bugs — always use \`===\` or a boolean expression.

### Truthiness

Falsy: \`false\`, \`0\`, \`-0\`, \`0n\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`.
Everything else is truthy — including \`"false"\`, \`[]\`, and \`{}\`.

### switch

Cases use **strict** comparison (\`===\`). Fall-through is intentional when you omit \`break\`:

\`\`\`js
switch (day) {
  case "sat":
  case "sun":
    isWeekend = true;
    break;
  case "mon":
    isWeekend = false;
    break;
  default:
    throw new Error("bad day");
}
\`\`\`

### Ternary vs if/else

Ternary returns a value and fits single assignments. Multi-branch or side-effecting logic belongs in if/else.
    `,
    howItWorks: `
The engine evaluates the condition expression, converts it via ToBoolean (a fixed table — no coercion of "" to 0 here, unlike ==), then jumps to the matching block. For switch, it evaluates the discriminant once, then compares each case with === from top to bottom; on match it executes statements until a \`break\`, \`return\`, or the block ends (fall-through). \`default\` runs when nothing matched, and can appear anywhere in the list.

\`if\` chains are evaluated in order — a later branch never runs if an earlier one matched. Put the most specific conditions first.
    `,
    codeExamples: [
      {
        title: "Conditionals and switch fall-through",
        language: "js",
        code: `function classify(value) {
  if (value === 0) return "zero";
  if (typeof value === "number") return value > 0 ? "positive" : "negative";
  if (typeof value === "string") return "text";
  return "other";
}

console.log(classify(0));      // "zero"
console.log(classify(-2));     // "negative"
console.log(classify("hi"));   // "text"

// switch with intentional fall-through
function dayType(day) {
  switch (day) {
    case "sat":
    case "sun":
      return "weekend";
    case "mon":
    case "tue":
    case "wed":
    case "thu":
    case "fri":
      return "weekday";
    default:
      return "unknown";
  }
}
console.log(dayType("sun")); // "weekend"`,
        description:
          "The early-return style keeps each condition flat. The switch groups weekend days via fall-through, then uses default for safety.",
      },
    ],
    commonMistakes: [
      "Forgetting break in switch and accidentally executing the next case.",
      "Using = instead of === inside if (assignment vs comparison).",
      "Assuming [] and {} are falsy — they are truthy.",
      "Deeply nested if/else pyramids that should be early returns or guard clauses.",
    ],
    bestPractices: [
      "Use guard clauses (early returns) to flatten nested ifs.",
      "Prefer === in conditions; avoid == entirely except x == null.",
      "Always include default in switch unless exhaustive checking is enforced by TypeScript.",
      "Extract complex conditions to named booleans: const isWeekend = day === 'sat' || day === 'sun'.",
    ],
    realWorldUseCases: [
      "HTTP status handlers map status codes to messages with switch.",
      "Middleware routers branch on req.method and req.path.",
      "Form validation builds error objects conditionally before submit.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — if...else",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else",
        description: "Syntax and semantics of conditional statements.",
      },
      videos: [
        {
          query: "JavaScript if else switch truthiness tutorial",
          description: "Beginner-friendly walkthroughs of conditionals.",
          estimatedDuration: "8–14 min",
        },
      ],
      article: {
        title: "MDN — Truthy and falsy values",
        url: "https://developer.mozilla.org/en-US/docs/Glossary/Truthy",
        provider: "developer.mozilla.org",
        description: "The complete list of falsy values and how truthiness is determined.",
        estimatedDuration: "5 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-grade",
        title: "Grade calculator",
        prompt:
          "Write a function grade(score) that returns 'F' for < 60, 'D' for 60–69, 'C' for 70–79, 'B' for 80–89, 'A' for >= 90, and throws for non-numbers or scores outside 0–100. Test with at least 6 inputs.",
        difficulty: "beginner",
        estimatedMinutes: 12,
        hints: ["Validate type first with typeof", "Use else-if chain from highest to lowest, or vice versa"],
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-loops",
    slug: "loops-and-iteration",
    title: "Loops and Iteration",
    description: "for, while, do...while, for...of vs for...in, break/continue, and avoiding infinite loops.",
    order: 5,
    estimatedMinutes: 18,
    tags: ["loops", "iteration", "control-flow"],
    prerequisites: ["p1m2-let-const-var", "p1m2-conditionals"],
    relatedTopics: ["p1m2-arrays-objects", "p1m2-array-methods", "p1m2-scope-closures"],
    learningObjectives: [
      "Write for, while and do...while loops with correct termination",
      "Choose for...of for values and for...in for keys",
      "Use break and continue to control flow",
      "Identify and fix infinite loop conditions",
    ],
    simpleExplanation:
      "Loops repeat a block of code. \\`for\\` is best when you know the iteration count; \\`while\\` when you loop until a condition changes; \\`do...while\\` runs at least once. \\`for...of\\` iterates over the *values* of arrays/iterables; \\`for...in\\` iterates over the *keys* (property names) of objects. Always make sure the loop variable changes — otherwise the loop never ends.",
    detailedContent: `
### Loop forms

\`\`\`js
// Classic counted loop: init; condition; increment
for (let i = 0; i < 5; i++) console.log(i); // 0..4

// While: check before each iteration
let n = 3;
while (n > 0) { console.log(n); n--; }

// Do...while: body runs at least once
let first = true;
do { console.log("runs once"); first = false; } while (first);
\`\`\`

### for...of vs for...in

| Construct | Iterates over | Best for |
| --- | --- | --- |
| \`for...of\` | values of iterables (Array, String, Map, Set) | arrays, typed arrays, sets |
| \`for...in\` | enumerable string keys (including inherited) | plain objects |

\`\`\`js
for (const item of [10, 20]) console.log(item);   // 10, 20
for (const key in { a: 1, b: 2 }) console.log(key); // "a", "b"
\`\`\`

Using for...in on an array gives you index *strings* and can pick up inherited properties — a common bug.

### break and continue

- \`break\` exits the innermost loop entirely.
- \`continue\` skips to the next iteration.

### Infinite loops

A loop with an unchanged condition (\`while (true)\` without a break, or a forgotten \`i++\`) freezes the process. In Node.js this blocks the event loop and your server stops responding. Always include a guaranteed exit path.
    `,
    howItWorks: `
A \`for (init; test; update)\` loop expands roughly to:

\`\`\`js
init;
while (test) {
  body;
  update;
}
\`\`\`

\`for...of\` uses the **iterator protocol**: it calls \`arr[Symbol.iterator]()\` which returns an object with \`next()\`; each call yields \`{ value, done }\` until \`done: true\`. This is why strings, Sets and Maps all work with for...of, and why you can make your own iterables.

\`for...in\` walks the prototype chain collecting enumerable property names as strings.
    `,
    codeExamples: [
      {
        title: "Loop forms and early exit",
        language: "js",
        code: `const users = [
  { id: 1, name: "Ada", active: true },
  { id: 2, name: "Grace", active: false },
  { id: 3, name: "Linus", active: true },
];

// find first inactive user with for...of + break
let inactive = null;
for (const user of users) {
  if (!user.active) {
    inactive = user;
    break;
  }
}
console.log(inactive?.name); // "Grace"

// skip noise with continue
for (const user of users) {
  if (!user.active) continue;
  console.log("active:", user.name);
}

// for...in is for object keys
const config = { host: "localhost", port: 3000 };
for (const key in config) {
  console.log(key, "=", config[key]);
}

// classic counted loop
let sum = 0;
for (let i = 1; i <= 100; i++) sum += i;
console.log(sum); // 5050`,
        description:
          "break stops the search early; continue skips filtered items. for...in yields keys as strings — remember to index safely.",
      },
    ],
    commonMistakes: [
      "Using for...in on arrays (yields string indices and inherited keys).",
      "Writing while (true) without any break or exit condition.",
      "Forgetting i++ in a for loop (infinite loop).",
      "Mutating an array while iterating it forward, causing skipped elements.",
    ],
    bestPractices: [
      "Prefer for...of for arrays; for...in only for plain objects (or use Object.keys()).",
      "Use let in for loops so each iteration has its own binding for closures.",
      "For array transformations, prefer map/filter over manual loops.",
      "Add a safety counter or timeout when looping over externally supplied data.",
    ],
    realWorldUseCases: [
      "Processing batch jobs: iterate rows, skip invalid entries with continue, stop early with break on fatal errors.",
      "Reading request headers with for...in (or Object.entries) to log each key.",
      "Parsing character-by-character in a simple tokenizer with for...of over a string.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Loops and iteration",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration",
        description: "Guide covering every loop form plus iterators.",
      },
      videos: [
        {
          query: "JavaScript for of vs for in loops explained",
          description: "Clear comparison of iteration styles with examples.",
          estimatedDuration: "8–12 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-fizzbuzz",
        title: "FizzBuzz variant",
        prompt:
          "Print numbers 1–50. For multiples of both 3 and 5 print 'FizzBuzz', multiples of 3 'Fizz', multiples of 5 'Buzz', otherwise the number. Then rewrite it using a single loop without nested ifs (hint: build a string).",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Use % for divisibility", "Accumulate a string and fall back to String(i)"],
        solution: `for (let i = 1; i <= 50; i++) {
  let out = "";
  if (i % 3 === 0) out += "Fizz";
  if (i % 5 === 0) out += "Buzz";
  console.log(out || i);
}`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-calculator", "p1-file-organizer"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-functions",
    slug: "functions-basics",
    title: "Functions",
    description: "Declarations vs expressions, parameters, default values, return values, and functions as first-class values.",
    order: 6,
    estimatedMinutes: 20,
    tags: ["functions", "parameters", "first-class"],
    prerequisites: ["p1m2-variables-data-types", "p1m2-let-const-var"],
    relatedTopics: ["p1m2-arrow-functions", "p1m2-scope-closures", "p1m2-this-keyword"],
    learningObjectives: [
      "Write function declarations and function expressions",
      "Use parameters, rest-friendly defaults and return values",
      "Explain that functions are values you can store, pass and return",
      "Choose meaningful function signatures and avoid side-effect confusion",
    ],
    simpleExplanation:
      "A function is a reusable block of code with a name (or assigned to a variable) that you can call with inputs (parameters) and optionally get a value back (return). Without a return statement, a function gives back \\`undefined\\`. Functions are *values* in JavaScript — you can store them in variables, pass them to other functions, and return them, which is the foundation of callbacks and array methods.",
    detailedContent: `
### Two ways to define

\`\`\`js
// Declaration — hoisted, available before its line
function add(a, b) {
  return a + b;
}

// Expression — assigned like any other value; not hoisted
const multiply = function (a, b) {
  return a * b;
};
\`\`\`

Declarations are hoisted entirely (you can call them above their definition). Expressions are not — calling before the assignment line throws \`TypeError\`.

### Parameters and defaults

- Extra arguments are ignored (unless you read \`arguments\` or use rest).
- Missing arguments become \`undefined\` — provide defaults:

\`\`\`js
function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}\`;
}
greet("Ada");           // "Hello, Ada"
greet("Ada", "Hi");     // "Hi, Ada"
\`\`\`

Defaults are evaluated **at call time**, only when the argument is missing (or \`undefined\`).

### Return values

\`return\` exits the function immediately. With no \`return\`, the result is \`undefined\`. Arrow functions with a concise body implicitly return:

\`\`\`js
const double = (n) => n * 2;
\`\`\`

### Functions as values

\`\`\`js
function applyTwice(fn, value) {
  return fn(fn(value));
}
applyTwice(double, 5); // 20
\`\`\`

This is the key idea behind \`map\`, \`filter\`, event handlers, and middleware in Express.
    `,
    howItWorks: `
When you call \`fn(a, b)\`, the engine:

1. Creates a new **execution context** (scope) for the call.
2. Binds parameters \`a\`, \`b\` to the passed values (missing ones get defaults or \`undefined\`).
3. Links the scope’s outer reference to where \`fn\` was *defined* (lexical scope) — this is what makes closures work.
4. Runs the body until \`return\` or the end; the returned value becomes the call’s result.
5. Discards the scope (unless something still references it, e.g. a closure).

Function objects also carry properties (e.g. \`name\`, \`length\`) and can be attached to other objects as methods.
    `,
    codeExamples: [
      {
        title: "Declarations, defaults and higher-order use",
        language: "js",
        code: `function formatUser(name, { role = "member", active = true } = {}) {
  return \`\${name} (\${role}\${active ? "" : ", inactive"})\`;
}

console.log(formatUser("Ada"));
// "Ada (member)"
console.log(formatUser("Grace", { role: "admin", active: false }));
// "Grace (admin, inactive)"

// Function as a value
function applyTwice(fn, value) {
  return fn(fn(value));
}
const double = (n) => n * 2;
console.log(applyTwice(double, 5)); // 20

// Declaration is hoisted — safe to call above definition
console.log(square(4)); // 16
function square(n) { return n * n; }`,
        description:
          "The options-object pattern with defaults is common in Node.js APIs. Hoisting lets declarations be called before their definition line.",
      },
    ],
    commonMistakes: [
      "Forgetting that a function without return gives undefined.",
      "Calling a function expression before its assignment (TypeError: fn is not a function).",
      "Mutating default parameter objects instead of copying them.",
      "Using truthiness checks on numeric parameters that can legitimately be 0.",
    ],
    bestPractices: [
      "Give functions a single responsibility and a verb-based name (getUser, sendEmail).",
      "Return new values instead of mutating arguments — easier to test and reason about.",
      "Use the options-object pattern for 3+ optional parameters to avoid positional confusion.",
      "Keep functions small; extract helpers when you nest more than two levels.",
    ],
    realWorldUseCases: [
      "Express route handlers are functions: (req, res) => { ... }.",
      "Utility modules export pure functions (formatDate, parseQuery) reused across the codebase.",
      "Testing frameworks inject mock functions (mocks/spies) wherever a function value is accepted.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Functions",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions",
        description: "Comprehensive guide to function syntax, scope and closures.",
      },
      videos: [
        {
          query: "JavaScript functions tutorial for beginners parameters return",
          description: "Step-by-step introductions to writing and calling functions.",
          estimatedDuration: "10–18 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-utils",
        title: "Build small utilities",
        prompt:
          "Write three pure functions: clamp(n, min, max), average(numbers), and repeat(str, times). Include defaults where sensible (e.g. times = 1). Test each with several inputs.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["clamp: Math.min(Math.max(n, min), max)", "average: sum / length, guard empty arrays"],
      },
    ],
    projectIds: ["p1-calculator", "p1-notes-cli"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-arrow-functions",
    slug: "arrow-functions",
    title: "Arrow Functions",
    description: "Concise syntax, lexical this, no own this/arguments, and when NOT to use arrows.",
    order: 7,
    estimatedMinutes: 16,
    tags: ["functions", "arrow-functions", "this"],
    prerequisites: ["p1m2-functions"],
    relatedTopics: ["p1m2-this-keyword", "p1m2-scope-closures", "p1m2-array-methods"],
    learningObjectives: [
      "Write arrow functions in all common forms",
      "Explain lexical this and how arrows differ from regular functions",
      "Know why arrows cannot be used as constructors or object methods needing their own this",
      "Choose the right function style for each situation",
    ],
    simpleExplanation:
      "Arrow functions are a shorter way to write functions: \\`(a, b) => a + b\\`. Unlike normal functions, they do **not** get their own \\`this\\` — they use the \\`this\\` from the surrounding code where they were written. That makes them great for callbacks (especially inside classes and loops) but wrong for object methods or constructors that need their own this.",
    detailedContent: `
### Syntax forms

\`\`\`js
const add = (a, b) => a + b;       // concise body, implicit return
const square = (n) => n * n;       // parens optional for one param
const noop = () => {};             // no params
const getUser = async (id) => {    // async arrows allowed
  return await fetchUser(id);
};
const identity = x => x;           // parens optional even without them
\`\`\`

An object literal return needs parentheses: \`const point = () => ({ x: 1 });\` — otherwise \`{ }\` is parsed as a block.

### Lexical this

Arrows capture \`this\` from the enclosing scope at definition time. They have no \`this\` binding of their own.

### What arrows lack

- No \`this\`, \`arguments\`, \`super\`, or \`new.target\`.
- Cannot be used with \`new\` (TypeError).
- Not suitable as prototype methods that rely on dynamic this.

### When NOT to use arrows

1. **Object methods** that need \`this\` to refer to the object.
2. **Constructors** / classes as factories with \`new\`.
3. **Event handlers** where \`this\` should be the element (browser DOM).
4. **Utility functions** that are intentionally generic — arrows lock in surrounding this.
    `,
    howItWorks: `
During parsing, the engine notices arrow functions have no \`this\` token and links their scope chain to the nearest enclosing function’s \`this\` (and \`arguments\`). This is implemented the same way closures capture variables — \`this\` becomes a captured binding.

That is why an arrow inside a class method correctly sees the instance, but an arrow as a class field or standalone helper outside any function sees the module/global this (usually \`undefined\` in modules, or \`globalThis\` in sloppy scripts).
    `,
    codeExamples: [
      {
        title: "Arrows: the good and the trap",
        language: "js",
        code: `// Great: callbacks keep outer this
const counter = {
  count: 0,
  incrementLater() {
    setTimeout(() => {
      this.count++; // arrow captures method's this → counter
      console.log(this.count); // 1
    }, 10);
  },
};
counter.incrementLater();

// Trap: arrow as object method has no its own this
const broken = {
  value: 42,
  getValue: () => this.value, // this is module/global — not broken
};
console.log(broken.getValue()); // undefined

// Concise array callbacks
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2);
console.log(doubled); // [2, 4, 6]

// Parentheses needed to return an object literal
const makeId = (n) => ({ id: n, createdAt: Date.now() });
console.log(makeId(7)); // { id: 7, createdAt: ... }`,
        description:
          "The setTimeout example shows arrows preserving this correctly. The broken object shows why arrows should not be methods that need this.",
      },
    ],
    commonMistakes: [
      "Using arrows as object methods that call this.something — this is not the object.",
      "Trying to use new with an arrow function (TypeError).",
      "Forgetting parentheses around an object-literal return: () => ({ }) vs () => { }.",
      "Using arrows where dynamic this is required (DOM event handlers, some libraries).",
    ],
    bestPractices: [
      "Use arrows for short callbacks (map/filter/forEach) and inline handlers.",
      "Use concise method shorthand for object methods that need this.",
      "Mix freely in the same file — style should follow the need for this, not personal habit.",
      "For async callbacks, prefer async arrows with explicit try/catch.",
    ],
    realWorldUseCases: [
      "Express middleware and route handlers are commonly arrow functions (no this needed).",
      "Array pipelines like orders.filter(o => o.paid).map(o => o.total) read like SQL.",
      "React hooks and effects (later phases) rely heavily on arrow functions.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Arrow function expressions",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions",
        description: "Syntax, lexical this, and guidance on appropriate usage.",
      },
      videos: [
        {
          query: "JavaScript arrow functions lexical this explained",
          description: "Comparisons of arrow vs regular functions with this demos.",
          estimatedDuration: "8–14 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-arrows",
        title: "Convert and critique",
        prompt:
          "Convert these to arrows where appropriate: function add(a,b){return a+b}; var items=[1,2,3]; items.map(function(n){return n*1}); an object method getName that returns this.name. Explain your choice for each.",
        difficulty: "beginner",
        estimatedMinutes: 10,
        hints: ["Pure utilities → arrow is fine", "Methods using this → keep shorthand"],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-contact-manager"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-scope-closures",
    slug: "scope-and-closures",
    title: "Scope and Closures",
    description: "Lexical scope, the closure, the module/private-state pattern, and common loop+closure pitfalls.",
    order: 8,
    estimatedMinutes: 22,
    tags: ["scope", "closures", "functions"],
    prerequisites: ["p1m2-let-const-var", "p1m2-functions"],
    relatedTopics: ["p1m2-arrow-functions", "p1m2-object-methods-references", "p1m2-es-modules"],
    learningObjectives: [
      "Describe lexical scope and the scope chain",
      "Create and use closures deliberately",
      "Implement the private-state / module pattern with closures",
      "Recognise and fix the classic loop+closure bug",
    ],
    simpleExplanation:
      "Scope decides which variables a piece of code can see. JavaScript uses *lexical* scope: a function sees variables from where it was *written*, not where it was called. A **closure** is a function bundled with its outer variables — even after the outer function has finished, the inner function still remembers them. This is how you keep private state and is the root of many subtle bugs.",
    detailedContent: `
### Lexical scope and the chain

Each execution context has an environment pointing to its parent (where the code was written). Variable lookup walks the chain outward until it finds a match or throws \`ReferenceError\`.

\`\`\`js
const globalName = "global";
function outer() {
  const outerName = "outer";
  function inner() {
    const innerName = "inner";
    console.log(innerName, outerName, globalName);
  }
  inner();
}
outer();
\`\`\`

### Closures

A closure is created whenever an inner function is returned (or otherwise escapes) while still referencing outer variables:

\`\`\`js
function makeCounter() {
  let count = 0;          // private to this call
  return () => ++count;   // closes over count
}
const next = makeCounter();
next(); // 1
next(); // 2
// count is unreachable from outside — true privacy
\`\`\`

Each call to \`makeCounter()\` creates a *separate* environment — two counters do not share state.

### The module / private state pattern

Before ES modules, closures were the standard way to hide implementation details. They still are for factory functions and class-like APIs.

### Loop + closure pitfall

With \`var\`, all callbacks share one \`i\`:

\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3, 3, 3
}
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 0, 1, 2
}
\`\`\`

\`let\` gives each iteration its own binding, fixing the bug.
    `,
    howItWorks: `
The engine implements closures by keeping the outer environment **alive** as long as any inner function references its variables. Environments are reference-counted (or GC-traced); if nothing references them, they are collected.

When you call \`next()\` above, the engine walks: \`next\`’s scope → \`makeCounter\`’s captured scope (holding \`count\`) → global. It finds \`count\`, increments it, and stores the new value back into the *same* captured environment — that is why the value persists between calls.

Closures also explain memory leaks: accidentally holding references to large scopes (e.g. attaching closures to long-lived global arrays) keeps entire environments alive.
    `,
    codeExamples: [
      {
        title: "Closure-based private state",
        language: "js",
        code: `function createStore(initial) {
  let state = initial; // private
  return {
    get: () => state,
    set: (next) => { state = next; },
    update: (fn) => { state = fn(state); },
  };
}

const store = createStore({ count: 0 });
store.update((s) => ({ count: s.count + 1 }));
store.update((s) => ({ count: s.count + 10 }));
console.log(store.get()); // { count: 11 }
// store.state is undefined — truly private

// Loop + var pitfall vs let
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i)); // 3 3 3
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j)); // 0 1 2
}`,
        description:
          "The store hides state behind closures. Notice var vs let behaviour inside setTimeout callbacks.",
      },
    ],
    commonMistakes: [
      "Returning an arrow that captures a loop variable declared with var, expecting per-iteration values.",
      "Creating closures in tight loops without releasing references (memory pressure).",
      "Assuming closures copy values — they capture bindings, so later mutations are visible.",
      "Confusing module scope (ES modules) with function closures — both hide, but differently.",
    ],
    bestPractices: [
      "Use closures for factories and private counters instead of exposing mutable globals.",
      "Use let in for loops that create closures.",
      "Avoid capturing huge objects in closures that live forever; pass only what you need.",
      "When debugging mysterious state, log the captured variable from inside the closure.",
    ],
    realWorldUseCases: [
      "Express middleware factories: rateLimiter(options) returns a handler that closes over config.",
      "Event listener helpers that remember user-specific data without globals.",
      "Memoization caches implemented as closures around a Map.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Closures",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
        description: "The canonical explanation of lexical scope and closures.",
      },
      videos: [
        {
          query: "JavaScript closures explained visually",
          description: "Diagrams and demos of scope chains and closure lifetime.",
          estimatedDuration: "10–18 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-closure-counter",
        title: "Private bank account",
        prompt:
          "Create bankAccount(startingBalance) returning deposit(amount), withdraw(amount) and getBalance(). Prevent negative balances (withdraw returns false on failure). The balance must not be accessible as a property.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Keep let balance in the factory scope", "Return an object of arrow functions"],
        solution: `function bankAccount(startingBalance = 0) {
  let balance = startingBalance;
  return {
    deposit(amount) {
      if (amount <= 0) return false;
      balance += amount;
      return true;
    },
    withdraw(amount) {
      if (amount <= 0 || amount > balance) return false;
      balance -= amount;
      return true;
    },
    getBalance: () => balance,
  };
}

const acct = bankAccount(100);
acct.deposit(50);       // true
acct.withdraw(30);      // true
acct.withdraw(500);     // false
console.log(acct.getBalance()); // 120
console.log(acct.balance);      // undefined`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-contact-manager"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-arrays-objects",
    slug: "arrays-and-objects",
    title: "Arrays and Objects",
    description: "Literals, reference semantics, nesting, and checking properties with hasOwnProperty / in.",
    order: 9,
    estimatedMinutes: 20,
    tags: ["arrays", "objects", "references"],
    prerequisites: ["p1m2-variables-data-types", "p1m2-loops"],
    relatedTopics: ["p1m2-destructuring", "p1m2-spread-rest", "p1m2-object-methods-references"],
    learningObjectives: [
      "Create and manipulate arrays and plain objects",
      "Explain reference semantics: assignment copies the reference, not the value",
      "Work with nested structures safely",
      "Distinguish own properties from inherited ones",
    ],
    simpleExplanation:
      "Arrays are ordered lists; objects are collections of key–value pairs. Both are *reference* types: when you assign them to a new variable, you copy the *pointer*, not the contents — so both variables point at the same data. Nested structures work the same way. To check whether a property really belongs to the object (not its prototype), use \\`Object.hasOwn()\\` or \\`hasOwnProperty()\\`.",
    detailedContent: `
### Literals

\`\`\`js
const tags = ["node", "js"];
const user = { id: 1, name: "Ada", "email address": "ada@example.com" };
\`\`\`

Dot access requires a valid identifier; anything else needs brackets: \`user["email address"]\`.

### Reference semantics

\`\`\`js
const a = { v: 1 };
const b = a;          // same object!
b.v = 2;
console.log(a.v);     // 2 — mutation is shared

const c = { ...a };   // shallow copy
c.v = 3;
console.log(a.v);     // 2 — a is untouched
\`\`\`

\`===\` on objects compares references, not contents.

### Nesting

\`\`\`js
const order = {
  id: "o1",
  customer: { name: "Ada", address: { city: "London" } },
  items: [{ sku: "A", qty: 2 }],
};
\`\`\`

Mutating \`order.customer\` affects any other variable pointing at the same customer object.

### Own vs inherited properties

Every object has a prototype (except \`Object.create(null)\`). \`in\` checks the whole chain; \`Object.hasOwn(obj, key)\` checks only the object itself.

\`\`\`js
"toString" in {};            // true — inherited
Object.hasOwn({}, "toString"); // false
\`\`\`
    `,
    howItWorks: `
Objects are hash maps of string (or symbol) keys to values, plus a hidden \`[[Prototype]]\` link. Property lookup first checks the object’s own properties, then walks the prototype chain until exhausted (returning \`undefined\` if not found).

Arrays are objects with a special \`length\` property and optimized internal storage. They can hold any values (including holes), and extra string properties can be attached — which is why \`Array.isArray\` exists.

Assignment of a reference copies the pointer stored in the variable. The engine’s garbage collector frees an object only when no references remain.
    `,
    codeExamples: [
      {
        title: "Reference semantics demo",
        language: "js",
        code: `const original = { name: "Ada", tags: ["math"] };

const copyRef = original;     // reference copy
const copyShallow = { ...original }; // shallow value copy
const copyDeep = structuredClone(original);

copyRef.name = "Grace";
copyShallow.tags.push("cs");  // mutates the SAME tags array!

console.log(original.name);           // "Grace" (shared via copyRef)
console.log(original.tags);           // ["math", "cs"] (shared via copyShallow)
console.log(copyDeep.tags);           // ["math"] (independent)

// own vs inherited
const book = { title: "Eloquent JS" };
console.log("title" in book);                 // true
console.log(Object.hasOwn(book, "title"));    // true
console.log(Object.hasOwn(book, "toString")); // false`,
        description:
          "Shallow spread copies the top level only — nested arrays/objects are still shared. structuredClone (Node 17+) gives a deep copy.",
      },
    ],
    commonMistakes: [
      "Assuming const prevents mutating an object — it only prevents reassignment.",
      "Using spread and thinking nested objects were cloned — they were not.",
      "Using in to check for a key and accidentally matching an inherited prototype property.",
      "Confusing array holes (sparse arrays) with undefined values.",
    ],
    bestPractices: [
      "Default to immutability: create new objects/arrays instead of mutating shared ones.",
      "Use Object.hasOwn (Node 16.9+) or Object.prototype.hasOwnProperty.call(obj, key).",
      "Use structuredClone for true deep copies of serialisable data.",
      "Keep object shapes consistent — varied shapes hurt performance and readability.",
    ],
    realWorldUseCases: [
      "Request bodies are nested JSON objects — you constantly read and transform them.",
      "Database documents map directly to JS objects; understanding references prevents accidental writes.",
      "Merging config objects incorrectly is a top source of production bugs.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Working with objects",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects",
        description: "Creation, properties, methods and prototypes explained.",
      },
      videos: [
        {
          query: "JavaScript arrays and objects reference vs copy",
          description: "Visual demos of reference sharing and cloning strategies.",
          estimatedDuration: "8–14 min",
        },
      ],
      article: {
        title: "MDN — structuredClone",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/structuredClone",
        provider: "developer.mozilla.org",
        description: "How to deep-clone plain data safely.",
        estimatedDuration: "5 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-refs",
        title: "Mutation hunt",
        prompt:
          "Given const base = { config: { retries: 1 }, list: [1] }, create three variables: one sharing the reference, one shallow-copied, one deep-copied. Mutate nested values in each and observe which originals change. Write down the rule you discovered.",
        difficulty: "beginner",
        estimatedMinutes: 12,
        hints: ["Use = for reference, {...obj} for shallow, structuredClone for deep"],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-destructuring",
    slug: "destructuring",
    title: "Destructuring",
    description: "Object and array destructuring, defaults, renaming, nested patterns, and function parameter destructuring.",
    order: 10,
    estimatedMinutes: 18,
    tags: ["destructuring", "syntax", "objects"],
    prerequisites: ["p1m2-arrays-objects"],
    relatedTopics: ["p1m2-spread-rest", "p1m2-functions"],
    learningObjectives: [
      "Extract values from objects and arrays with destructuring",
      "Apply defaults and renaming",
      "Handle nested structures with nested patterns",
      "Destructure function parameters cleanly",
    ],
    simpleExplanation:
      "Destructuring unpacks values from objects or arrays into variables in one line. \\`const { name, age } = user\\` pulls \\`name\\` and \\`age\\` out of \\`user\\`. \\`const [first, second] = list\\` does the same for arrays. You can set defaults for missing values, rename while extracting, and nest patterns to match deep structures.",
    detailedContent: `
### Object destructuring

\`\`\`js
const user = { id: 1, name: "Ada", email: "ada@example.com" };
const { name, email, phone = null } = user;
// name = "Ada", email = "ada@example.com", phone = null (default)

const { name: userName } = user; // rename: userName = "Ada"
\`\`\`

### Array destructuring

\`\`\`js
const nums = [10, 20, 30];
const [first, second] = nums;          // 10, 20
const [, , third] = nums;              // 30 (skip)
const [head, ...rest] = nums;          // 10, [20, 30]
const [a = 1, b = 2] = [7];            // 7, 2
\`\`\`

### Nested patterns

Match the shape you expect:

\`\`\`js
const response = {
  status: 200,
  data: { user: { name: "Ada", address: { city: "London" } } },
};
const { status, data: { user: { name, address: { city } } } } = response;
\`\`\`

### Parameter destructuring

Common in options objects:

\`\`\`js
function createUser({ name, role = "member", active = true }) {
  return { name, role, active };
}
createUser({ name: "Ada" });
\`\`\`

Provide a default for the whole parameter (\`= {}\`) when the argument may be missing entirely.
    `,
    howItWorks: `
Destructuring is sugar over property access (Get) and variable definition. The engine matches the pattern shape against the value: for objects it reads keys (supporting renames and defaults when the value is \`undefined\`); for arrays it reads numeric indices and can rest-collect the remainder into a new array.

Defaults trigger only for \`undefined\` — not for \`null\`. Rest elements must be last. The same pattern syntax appears in \`catch\`, imports, and for...of bindings.
    `,
    codeExamples: [
      {
        title: "Destructuring patterns",
        language: "js",
        code: `// Object + defaults + rename
const config = { host: "localhost", port: 8080 };
const { host, port, protocol = "http", host: bindHost } = config;
console.log(host, port, protocol, bindHost);
// "localhost" 8080 "http" "localhost"

// Array + skip + rest
const [primary, , tertiary, ...others] = ["red", "green", "blue", "gold", "silver"];
console.log(primary, tertiary, others); // "red" "blue" ["gold", "silver"]

// Nested extraction from an API-like payload
const apiResponse = {
  id: "u1",
  profile: { name: "Ada", settings: { theme: "dark" } },
};
const {
  profile: {
    name,
    settings: { theme },
  },
} = apiResponse;
console.log(name, theme); // "Ada" "dark"

// Parameter destructuring with guard
function draw({ x = 0, y = 0, color = "black" } = {}) {
  console.log(\`draw at \${x},\${y} in \${color}\`);
}
draw({ x: 10, color: "red" }); // "draw at 10,0 in red"
draw();                        // "draw at 0,0 in black"`,
        description:
          "The = {} default on the parameter prevents a crash when the whole argument is missing. Nested patterns mirror the data shape.",
      },
    ],
    commonMistakes: [
      "Expecting defaults to apply to null — only undefined triggers them.",
      "Destructuring a missing nested object without defaults (TypeError).",
      "Forgetting that renaming syntax is { oldName: newName } (source first).",
      "Using rest in the middle of an array pattern (SyntaxError).",
    ],
    bestPractices: [
      "Destructure only the fields you need — keeps call sites self-documenting.",
      "Use parameter destructuring for options objects with 2+ optional settings.",
      "Combine with defaults for resilient parsing of external JSON.",
      "Avoid deep nested destructuring more than 2–3 levels; extract step by step instead.",
    ],
    realWorldUseCases: [
      "Express handlers: const { id } = req.params; const { title, body } = req.body.",
      "React props (later phases) rely almost entirely on object destructuring.",
      "Test setups destructure describe/it functions from the framework import.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Destructuring assignment",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment",
        description: "Full syntax for object/array destructuring, defaults and nested patterns.",
      },
      videos: [
        {
          query: "JavaScript destructuring assignment tutorial",
          description: "Practical destructuring examples for objects and arrays.",
          estimatedDuration: "8–14 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-destructure",
        title: "Parse a payload",
        prompt:
          "Given const data = { status: 200, body: { users: [{ name: 'Ada', age: 36 }, { name: 'Grace', age: 45 }], total: 2 }, meta: null }, extract status, total, and the first user's name using destructuring (with a sensible default for meta).",
        difficulty: "beginner",
        estimatedMinutes: 12,
        hints: ["Nested patterns must match the shape", "meta = 'unknown' only if undefined — consider ?? instead"],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-spread-rest",
    slug: "spread-and-rest",
    title: "Spread and Rest",
    description: "Shallow copies, merging objects, rest parameters, and pitfalls with nested objects.",
    order: 11,
    estimatedMinutes: 16,
    tags: ["spread", "rest", "immutability"],
    prerequisites: ["p1m2-arrays-objects", "p1m2-functions"],
    relatedTopics: ["p1m2-destructuring", "p1m2-object-methods-references"],
    learningObjectives: [
      "Use the spread operator to copy and merge arrays/objects",
      "Write rest parameters for flexible function signatures",
      "Explain why spread is only a shallow copy",
      "Avoid common merge and rest pitfalls",
    ],
    simpleExplanation:
      "The spread operator \\`...\\` expands an array or object into individual elements or properties. \\`[...arr]\\` makes a shallow array copy; \\`{ ...obj }\\` makes a shallow object copy; \\`{ ...a, ...b }\\` merges. Rest is the same syntax used in the opposite direction: it *collects* leftover values into an array (rest parameters) or properties into a new object.",
    detailedContent: `
### Spread for copying and merging

\`\`\`js
const arr = [1, 2, 3];
const copy = [...arr];
const more = [0, ...arr, 4];          // [0, 1, 2, 3, 4]

const base = { host: "localhost", port: 3000 };
const withDefaults = { ...base, port: 8080 }; // later keys win → port 8080
\`\`\`

### Rest parameters and rest properties

\`\`\`js
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6

const { host, ...secureOptions } = { host: "h", secure: true, httpOnly: true };
// secureOptions = { secure: true, httpOnly: true }
\`\`\`

### The shallow-copy pitfall

\`\`\`js
const user = { profile: { name: "Ada" } };
const clone = { ...user };
clone.profile.name = "Grace";
console.log(user.profile.name); // "Grace" — nested object is still shared!
\`\`\`

Use \`structuredClone\` (or manual deep copy) when nested data must be independent.

### Other pitfalls

- Spread ignores non-enumerable properties and symbol keys are copied but methods are not bound.
- Cannot rest in the middle of an array pattern; rest must be last.
- Spreading very large arrays creates a real copy — watch memory.
    `,
    howItWorks: `
The engine performs a shallow merge: it iterates own enumerable properties (for objects) or elements (for arrays) of the source and assigns them onto a brand-new object/array. Only one level is duplicated; deeper values are copied by reference.

Rest parameters collect arguments into a real Array at call time. Rest *properties* in object patterns use the same semantics but iterate own enumerable string keys (not symbols by default in older engines — check your runtime).
    `,
    codeExamples: [
      {
        title: "Spread, merge and rest",
        language: "js",
        code: `// Safe top-level merge with override
const env = { NODE_ENV: "development", PORT: "3000" };
const overrides = { PORT: "4000" };
const config = { ...env, ...overrides };
console.log(config.PORT); // "4000"

// Array utilities without mutation
const tags = ["node", "js"];
const withTag = [...tags, "ts"];   // original untouched
const withoutFirst = tags.slice(1);
console.log(tags, withTag, withoutFirst);

// Rest parameters
function logLevel(level, ...messages) {
  console.log(\`[\${level}]\`, ...messages);
}
logLevel("INFO", "server", "started", "on", 3000);

// Rest properties
const { password, ...safeUser } = { id: 1, name: "Ada", password: "secret" };
console.log(safeUser); // { id: 1, name: "Ada" }
console.log(password); // "secret" (not logged accidentally if you only pass safeUser)`,
        description:
          "Rest properties are ideal for stripping secrets before logging or sending data over the network.",
      },
    ],
    commonMistakes: [
      "Assuming { ...obj } deep-clones nested structures.",
      "Expecting later-spread keys not to override earlier ones (they do override).",
      "Forgetting that rest must be the last element in a pattern.",
      "Spreading huge datasets unnecessarily and blowing memory.",
    ],
    bestPractices: [
      "Use spread for shallow, immutable updates in reducers and state.",
      "Combine spread with structuredClone when deep independence is required.",
      "Use rest parameters instead of arguments for modern, testable functions.",
      "Strip sensitive fields with rest before logging user objects.",
    ],
    realWorldUseCases: [
      "Express middleware chains clone request options before modification.",
      "React state updates rely on spread to create new objects immutably.",
      "CLI argument parsers collect unknown flags with rest and spread into a config.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Spread syntax",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax",
        description: "How spread works for calls, arrays and objects.",
      },
      videos: [
        {
          query: "JavaScript spread and rest operators explained",
          description: "Copy/merge examples and rest parameter patterns.",
          estimatedDuration: "8–12 min",
        },
      ],
      article: {
        title: "MDN — Rest parameters",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters",
        provider: "developer.mozilla.org",
        description: "Collecting variable arguments into a real array.",
        estimatedDuration: "5 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-merge",
        title: "Immutable updates",
        prompt:
          "Write mergeWithOverride(defaults, overrides) using spread. Then write deepMergeShallow(a, b) that merges one extra level manually (e.g. merge a.nested and b.nested into a new object). Explain the difference.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Top level: { ...a, ...b }", "Second level: { ...a.nested, ...b.nested }"],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-template-literals",
    slug: "template-literals",
    title: "Template Literals",
    description: "Interpolation, multiline strings, expressions inside templates, and a first look at tagged templates.",
    order: 12,
    estimatedMinutes: 14,
    tags: ["strings", "templates", "syntax"],
    prerequisites: ["p1m2-variables-data-types"],
    relatedTopics: ["p1m2-functions", "p1m2-arrow-functions"],
    learningObjectives: [
      "Build strings with interpolation using backticks",
      "Create true multiline strings without \\n escapes",
      "Embed arbitrary expressions inside \\${ }",
      "Recognise tagged templates and their use cases",
    ],
    simpleExplanation:
      "Template literals are strings written with backticks (\\` \\`). Inside them, \\${expression} inserts any value or expression. They can span multiple lines literally, so you no longer need \\`\\\\n\\` or string concatenation for logs and messages. You can also ‘tag’ a template with a function to process the parts — useful for escaping, formatting, or building SQL safely.",
    detailedContent: `
### Interpolation

\`\`\`js
const name = "Ada";
const age = 36;
console.log(\`\${name} is \${age} years old\`); // "Ada is 36 years old"
console.log(\`Next year: \${age + 1}\`);        // expressions allowed
\`\`\`

### Multiline

\`\`\`js
const html = \`
  <div class="card">
    <h1>\${title}</h1>
  </div>
\`;
\`\`\`

Leading/trailing newlines after the backticks are preserved — trim if needed.

### Escaping

To include a literal backslash before a dollar: \\\\\${. To include a backtick inside, escape it: \\\`.

### Tagged templates

\`\`\`js
function highlight(strings, ...values) {
  return strings.raw.reduce((out, s, i) =>
    out + s + (values[i] !== undefined ? \`**\${values[i]}**\` : ""), "");
}
const user = "Ada";
console.log(highlight\`Hello \${user}!\`); // "Hello **Ada**!"
\`\`\`

Tagged templates receive the static \`strings\` array (with a \`.raw\` property) separately from the interpolated values — enabling custom parsing, sanitisation, or i18n.
    `,
    howItWorks: `
The parser splits the template into an array of literal segments and a list of expression ASTs. At runtime it evaluates each expression, converts values to strings via ToString (objects become \`[object Object]\` unless they implement \`toString\`/\`Symbol.toPrimitive\`), and concatenates.

When tagged, the engine caches the strings array per call site (so repeated calls reuse it) and passes the raw (un-escaped) version on \`.raw\`. This is how libraries like sql-template tag strings to prevent SQL injection, and how styled-components-style CSS-in-JS works.
    `,
    codeExamples: [
      {
        title: "Template literals and a simple tag",
        language: "js",
        code: `const product = { name: "Keyboard", price: 79.5 };
const qty = 2;

// Interpolation + expression
const receipt = \`
Receipt
-------
\${product.name} x\${qty} = $\${(product.price * qty).toFixed(2)}
\`;
console.log(receipt);

// Escaping a backtick and a dollar
console.log(\`Price: $\${product.price} (use \\\` for literals)\`);

// Tagged template: uppercase everything
function upper(strings, ...values) {
  return strings.reduce((out, s, i) =>
    out + s + (i < values.length ? String(values[i]).toUpperCase() : ""), "");
}
const role = "admin";
console.log(upper\`role is \${role}\`); // "role is ADMIN"`,
        description:
          "The tag receives static pieces and dynamic values separately, enabling transformations without manual parsing.",
      },
    ],
    commonMistakes: [
      "Using regular quotes and expecting real multiline content — only backticks allow literal newlines.",
      "Forgetting that interpolations call ToString — objects render as [object Object].",
      "Confusing \\${} interpolation with shell-style $variables (no braces, no expression).",
      "Unescaped backticks inside the template causing a syntax error.",
    ],
    bestPractices: [
      "Prefer template literals over + concatenation for any multi-part string.",
      "Keep interpolations simple; extract complex logic to variables first.",
      "Use tags for escaping (HTML/SQL) rather than manual replace chains.",
      "Be aware of security: never interpolate untrusted input into HTML or SQL without a proper escaper/tag.",
    ],
    realWorldUseCases: [
      "Log lines: console.log(`[${req.method}] ${req.url} ${ms}ms`).",
      "Building CLI output and error messages in Node.js scripts.",
      "SQL builders use tagged templates to parameterise queries safely.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Template literals",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals",
        description: "Interpolation, multiline and tagged template syntax.",
      },
      videos: [
        {
          query: "JavaScript template literals and tagged templates",
          description: "String interpolation demos and practical tag examples.",
          estimatedDuration: "6–12 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-tag",
        title: "Write a safe tag",
        prompt:
          "Write a tag function sql(strings, ...values) that returns a query string with each interpolated value replaced by a placeholder $1, $2, … and logs the values array. Demonstrate with a username variable.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Use strings.reduce with an index", "Values become parameters, not concatenated SQL"],
        solution: `function sql(strings, ...values) {
  const query = strings.reduce((out, s, i) =>
    out + s + (i < values.length ? \`$\${i + 1}\` : ""), "");
  console.log("params:", values);
  return query;
}

const username = "ada'; DROP TABLE users; --";
console.log(sql\`SELECT * FROM users WHERE name = \${username}\`);
// params: ["ada'; DROP TABLE users; --"]
// "SELECT * FROM users WHERE name = $1"`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-weather-client"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-array-methods",
    slug: "array-methods",
    title: "Array Methods",
    description: "map, filter, reduce, find, some, every, flatMap, sort stability/mutation, and chaining.",
    order: 13,
    estimatedMinutes: 22,
    tags: ["arrays", "functional", "iteration"],
    prerequisites: ["p1m2-functions", "p1m2-arrays-objects"],
    relatedTopics: ["p1m2-loops", "p1m2-spread-rest"],
    learningObjectives: [
      "Transform arrays with map and flatMap",
      "Filter and search with filter, find, findIndex, some, every",
      "Accumulate results with reduce",
      "Control sort: mutation, comparator function and stability",
    ],
    simpleExplanation:
      "Arrays come with built-in methods that replace most manual loops. \\`map\\` transforms each item, \\`filter\\` keeps items that pass a test, \\`reduce\\` folds the array into a single value, \\`find\\` returns the first match. \\`sort\\` mutates the array in place and sorts everything as strings unless you provide a comparator — a classic source of bugs.",
    detailedContent: `
### The core trio

\`\`\`js
const orders = [
  { id: 1, total: 120, paid: true },
  { id: 2, total: 80,  paid: false },
  { id: 3, total: 45,  paid: true },
];

orders.filter(o => o.paid)              // keep paid
     .map(o => o.total)                 // [120, 45]
     .reduce((sum, t) => sum + t, 0);   // 165
\`\`\`

### Search helpers

| Method | Returns |
| --- | --- |
| \`find(fn)\` | first matching value or \`undefined\` |
| \`findIndex(fn)\` | index or \`-1\` |
| \`some(fn)\` | \`true\` if at least one matches |
| \`every(fn)\` | \`true\` if all match (vacuously true for empty arrays) |
| \`includes(v)\` | membership test (uses SameValueZero) |

### flatMap

\`flatMap(fn)\` maps then flattens one level — perfect when each item produces zero-or-more results:

\`\`\`js
["hello world", "hi"].flatMap(s => s.split(" "));
// ["hello", "world", "hi"]
\`\`\`

### sort — mutation and comparators

\`sort\` sorts **in place** and converts elements to strings by default:

\`\`\`js
[10, 9, 100].sort();          // [10, 100, 9]  (lexicographic!)
[10, 9, 100].sort((a, b) => a - b); // [9, 10, 100]
\`\`\`

The comparator returns \`< 0\` (a first), \`0\` (keep order), or \`> 0\` (b first). Modern engines use a **stable** sort — equal elements keep relative order. To avoid mutating, copy first: \`[...arr].sort(...)\`.
    `,
    howItWorks: `
Each method takes a callback invoked with \`(value, index, array)\`. They iterate with the array’s iterator internally. \`reduce\` carries an **accumulator** between calls: the initial value you pass becomes the first accumulator; if omitted, the first element is used (and an empty array then throws).

Callbacks that return new objects create new references — map does not mutate the source. Methods like \`sort\`, \`reverse\`, \`splice\`, \`push\` mutate in place and return the same reference (or an index), which surprises people chaining them.
    `,
    codeExamples: [
      {
        title: "Data pipeline with array methods",
        language: "js",
        code: `const users = [
  { name: "Ada",   age: 36, active: true },
  { name: "Grace", age: 45, active: false },
  { name: "Linus", age: 54, active: true },
];

const activeNames = users.filter(u => u.active).map(u => u.name);
console.log(activeNames); // ["Ada", "Linus"]

const totalAge = users.reduce((sum, u) => sum + u.age, 0);
console.log(totalAge); // 135

const hasSenior = users.some(u => u.age >= 50);   // true
const allActive = users.every(u => u.active);     // false
const firstActive = users.find(u => u.active);    // { name: "Ada", ... }

// sort without mutating
const byAge = [...users].sort((a, b) => a.age - b.age);
console.log(byAge.map(u => u.name)); // ["Ada", "Grace", "Linus"]
console.log(users[0].name);          // "Ada" — original order intact

// flatMap: one item → many
const tags = ["node js", "typescript"].flatMap(s => s.split(" "));
console.log(tags); // ["node", "js", "typescript"]`,
        description:
          "A typical backend pipeline: filter → map → reduce. Copy before sort to keep the source array immutable.",
      },
    ],
    commonMistakes: [
      "Using sort on numbers without a comparator (lexicographic order).",
      "Forgetting the initial value in reduce with an empty array (TypeError).",
      "Assuming map/filter create deep copies — nested objects are still shared.",
      "Expecting filter to mutate — it returns a new array.",
    ],
    bestPractices: [
      "Prefer method chains over manual loops for readability.",
      "Always pass an initial value to reduce for safety.",
      "Copy before sort/reverse when the original order matters.",
      "Break very long chains into named intermediate variables.",
    ],
    realWorldUseCases: [
      "API response shaping: filter valid records, map to DTOs, reduce into a lookup map.",
      "Report generation sums and counts with reduce over database rows.",
      "Input normalisation uses flatMap when one field can produce many tokens.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Array",
        description: "Reference for every array method with examples.",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
      },
      videos: [
        {
          query: "JavaScript map filter reduce explained",
          description: "Classic functional array method tutorials.",
          estimatedDuration: "10–18 min",
        },
      ],
      article: {
        title: "MDN — Array.prototype.sort",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort",
        provider: "developer.mozilla.org",
        description: "Default sorting behaviour and comparator contract.",
        estimatedDuration: "6 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-pipeline",
        title: "Invoice totals",
        prompt:
          "Given invoices = [{ total: 120, paid: true }, { total: 80, paid: false }, { total: 45, paid: true }], compute the sum of paid totals using filter+reduce, find the largest single invoice (without sort if you can), and return names of unpaid invoice totals sorted descending.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["reduce((max, inv) => inv.total > max.total ? inv : max, invoices[0])", "Copy before sort"],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client", "p1-file-organizer"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-object-methods-references",
    slug: "object-methods-and-references",
    title: "Object Methods and References",
    description: "Object.keys/values/entries/assign, Object.freeze vs const, and reference equality pitfalls.",
    order: 14,
    estimatedMinutes: 18,
    tags: ["objects", "references", "immutability"],
    prerequisites: ["p1m2-arrays-objects"],
    relatedTopics: ["p1m2-spread-rest", "p1m2-scope-closures"],
    learningObjectives: [
      "Enumerate objects with keys/values/entries",
      "Merge and copy with Object.assign",
      "Explain what Object.freeze does (and does not) do",
      "Use reference equality checks correctly",
    ],
    simpleExplanation:
      "JavaScript gives you static helpers to work with objects: \\`Object.keys()\\` returns property names, \\`Object.values()\\` the values, \\`Object.entries()\\` pairs you can map over. \\`Object.assign\\` merges sources into a target. \\`Object.freeze\\` makes an object’s properties read-only — but it is *shallow*, and \\`const\\` is unrelated (it only stops rebinding the variable). Equality on objects compares references, not contents.",
    detailedContent: `
### Enumerating

\`\`\`js
const env = { NODE_ENV: "production", PORT: 3000 };
Object.keys(env);    // ["NODE_ENV", "PORT"]
Object.values(env);  // ["production", 3000]
Object.entries(env); // [["NODE_ENV","production"], ["PORT", 3000]]

Object.fromEntries(Object.entries(env).map(([k, v]) => [k, String(v)]));
// { NODE_ENV: "production", PORT: "3000" }
\`\`\`

### assign vs spread

\`\`\`js
const merged = Object.assign({}, base, overrides); // same as { ...base, ...overrides }
\`\`\`

\`Object.assign\` **mutates** its first argument. Always pass \`{}\` as target unless you intend to mutate.

### freeze vs const

| | Prevents reassignment of variable | Prevents adding/changing props | Deep? |
| --- | --- | --- | --- |
| \`const\` | yes | no | n/a |
| \`Object.freeze\` | no | yes (silent fail in sloppy, TypeError in strict) | **no** — nested objects still mutable |

\`\`\`js
const conf = Object.freeze({ db: { host: "localhost" } });
conf.db.host = "evil"; // works! freeze is shallow
\`\`\`

### Reference equality

\`\`\`js
const a = { x: 1 };
const b = a;
const c = { x: 1 };
a === b; // true — same reference
a === c; // false — different objects, same content
\`\`\`

To compare content, write a helper, use \`JSON.stringify\` (order-sensitive, no cycles), or a library.
    `,
    howItWorks: `
\`Object.keys/values/entries\` collect **own enumerable** string-keyed properties (same list \`for...in\` uses after filtering out inherited ones). Symbol keys are skipped.

\`Object.assign\` walks the same list of each source and performs \`[[Set]]\` on the target — which triggers setters if present.

\`Object.freeze\` sets the \`[[Extensible]]\` flag to false and marks each property non-writable/configurable. Nested objects are separate entities and remain unfrozen.

Strict-mode modules (all ES modules) throw \`TypeError\` on writes to frozen properties; sloppy-mode scripts fail silently — which is why freeze bugs can hide.
    `,
    codeExamples: [
      {
        title: "Object helpers and freeze depth",
        language: "js",
        code: `const defaults = { retries: 3, timeout: 1000, headers: { "x-app": "demo" } };
const overrides = { timeout: 5000 };

// Safe merge
const config = Object.assign({}, defaults, overrides);
console.log(config); // { retries: 3, timeout: 5000, headers: {...} }

// Enumerate for logging
for (const [key, value] of Object.entries(config)) {
  console.log(\`\${key}: \${value}\`);
}

// freeze is shallow
const frozen = Object.freeze(config);
try {
  frozen.timeout = 1; // TypeError in strict/module code
} catch (e) {
  console.log(e.name); // TypeError
}
frozen.headers["x-app"] = "mutated"; // still works — nested not frozen
console.log(config.headers["x-app"]); // "mutated"

// Reference equality trap
const userA = { id: 1 };
const userB = userA;
const userC = { id: 1 };
console.log(userA === userB, userA === userC); // true false`,
        description:
          "Shows the shallow-freeze pitfall and why === cannot compare object contents.",
      },
    ],
    commonMistakes: [
      "Calling Object.assign(existing, ...) and mutating the original by accident.",
      "Expecting Object.freeze to deep-freeze nested objects.",
      "Using === to compare two structurally identical objects (always false).",
      "Using JSON.stringify equality and being bitten by key order or undefined values.",
    ],
    bestPractices: [
      "Object.assign({}, a, b) or { ...a, ...b } — never mutate shared defaults.",
      "Freeze top-level config objects in libraries, but document that nested data is not frozen.",
      "For content equality, write equals(a, b) helpers or use a tested library.",
      "Use Object.entries + map to transform objects into arrays when you need array methods.",
    ],
    realWorldUseCases: [
      "Library authors freeze exported default options to protect consumers.",
      "Building HTTP headers objects from env vars with Object.fromEntries.",
      "Detecting whether cached data changed by comparing references before deep-comparing.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Object",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object",
        description: "Static methods including keys, values, entries, assign, freeze, hasOwn.",
      },
      videos: [
        {
          query: "JavaScript Object keys values entries assign freeze",
          description: "Practical walkthrough of the Object static helpers.",
          estimatedDuration: "8–14 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-freeze",
        title: "Immutable config",
        prompt:
          "Create a deepFreeze(obj) that recursively freezes nested plain objects and arrays. Test it on a 3-level structure and verify writes throw in strict mode.",
        difficulty: "beginner",
        estimatedMinutes: 18,
        hints: ["Use Object.values / Object.entries to recurse", "Handle arrays with Array.isArray"],
        solution: `function deepFreeze(obj) {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const value of Object.values(obj)) deepFreeze(value);
  }
  return obj;
}

const config = deepFreeze({ db: { host: "localhost", creds: { user: "root" } } });
try {
  "use strict";
  config.db.host = "evil";
} catch (e) {
  console.log(e.name); // TypeError
}
console.log(config.db.host); // "localhost"`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-error-handling-try-catch",
    slug: "error-handling",
    title: "Error Handling with try/catch",
    description: "Error objects, try/catch/finally, throw, error propagation, and catching nothing useful.",
    order: 15,
    estimatedMinutes: 20,
    tags: ["errors", "exceptions", "debugging"],
    prerequisites: ["p1m2-functions"],
    relatedTopics: ["p1m2-debugging-javascript", "p1m2-promises", "p1m2-async-await"],
    learningObjectives: [
      "Create and throw Error objects with useful messages",
      "Use try/catch/finally correctly",
      "Understand how errors propagate up the call stack",
      "Avoid catch blocks that swallow errors silently",
    ],
    simpleExplanation:
      "When something goes wrong, JavaScript *throws* an exception. You catch it with \\`try { ... } catch (err) { ... }\\`, and optionally clean up in \\`finally\\`. Errors bubble up until someone catches them — if nobody does, Node.js prints the stack and may exit. Always throw real \\`Error\\` objects (not strings) so you get stack traces and instanceof checks.",
    detailedContent: `
### Anatomy of an Error

\`\`\`js
class NotFoundError extends Error {
  constructor(resource, id) {
    super(\`\${resource} \${id} not found\`);
    this.name = "NotFoundError";
    this.status = 404;
  }
}
\`\`\`

Built-in types: \`TypeError\`, \`ReferenceError\`, \`SyntaxError\`, \`RangeError\`, \`URIError\`, plus \`AggregateError\`. Each has \`message\`, \`name\`, \`stack\`.

### try / catch / finally

\`\`\`js
try {
  const data = JSON.parse(input);
} catch (err) {
  if (err instanceof SyntaxError) return { error: "bad json" };
  throw err; // unknown errors must not be swallowed
} finally {
  // always runs — close files, release locks
}
\`\`\`

### Propagation

An uncaught throw unwinds the stack to the nearest enclosing catch. Functions that do not catch simply let errors escape their callers — this is usually what you want (‘error bubbling’).

### Catching nothing useful

\`\`\`js
try { risky(); } catch {} // swallows everything — hides bugs
\`\`\`

Or logging and continuing as if nothing happened. Both make production incidents undebuggable. Catch only what you can *handle*; rethrow otherwise.
    `,
    howItWorks: `
When \`throw\` executes, the engine performs a non-local exit: it walks the call stack looking for a \`try\` block with a matching \`catch\` (or a \`finally\` to run during unwinding). Local variables in frames being unwound are discarded. The caught value can be *anything*, but only \`Error\` instances carry a stack.

In async code (promises, async/await), a throw inside a promise callback becomes a rejection rather than a synchronous unwind — see the promises lesson.
    `,
    codeExamples: [
      {
        title: "Custom errors and safe catch",
        language: "js",
        code: `class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function parseAge(raw) {
  const n = Number(raw);
  if (Number.isNaN(n)) {
    throw new ValidationError("age", "age must be numeric");
  }
  if (n < 0 || n > 150) {
    throw new ValidationError("age", "age out of range");
  }
  return n;
}

try {
  parseAge("abc");
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(\`Invalid \${err.field}: \${err.message}\`);
  } else {
    throw err; // never hide unexpected errors
  }
} finally {
  console.log("parse attempt finished");
}`,
        description:
          "Custom Error subclasses let callers catch by type. The finally block always runs, even on throw.",
      },
    ],
    commonMistakes: [
      "Throwing strings or plain objects instead of Error (no stack trace).",
      "Empty catch blocks that hide failures.",
      "Catching too broadly and converting real bugs into silent wrong results.",
      "Forgetting that finally runs even when catch returns or throws.",
    ],
    bestPractices: [
      "Throw Error subclasses with a name and relevant context fields (statusCode, field).",
      "Log errors with their stack before converting to HTTP responses.",
      "Rethrow errors you cannot handle at that layer.",
      "In Express, prefer calling next(err) over try/catch-and-ignore.",
    ],
    realWorldUseCases: [
      "Validation layers throw ValidationError so the HTTP layer can map to 400.",
      "Database drivers throw typed errors you translate to domain errors.",
      "finally closes file handles in CLI tools regardless of success or failure.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Error",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error",
        description: "Error object properties, subclasses and stack traces.",
      },
      videos: [
        {
          query: "JavaScript try catch finally error handling best practices",
          description: "Practical error-handling patterns for application code.",
          estimatedDuration: "8–14 min",
        },
      ],
      article: {
        title: "Node.js — Errors",
        url: "https://nodejs.org/api/errors.html",
        provider: "nodejs.org",
        description: "How Node.js error classes and system errors work.",
        estimatedDuration: "12 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-safe-parse",
        title: "Safe JSON parse",
        prompt:
          "Write safeParse(json, fallback) that returns the parsed value or the fallback on SyntaxError, and rethrows anything else. Then write parseUser(obj) that throws TypeError if obj is not an object and RangeError if age is missing.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["instanceof SyntaxError to distinguish parse failures", "Use finally to log attempts if useful"],
        solution: `function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch (err) {
    if (err instanceof SyntaxError) return fallback;
    throw err;
  }
}

function parseUser(obj) {
  if (obj === null || typeof obj !== "object") {
    throw new TypeError("user must be an object");
  }
  if (typeof obj.age !== "number") {
    throw new RangeError("user.age is required");
  }
  return { name: obj.name ?? "anonymous", age: obj.age };
}

console.log(safeParse("{oops}", {})); // {}
try { parseUser(null); } catch (e) { console.log(e.name); } // TypeError`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-notes-cli", "p1-basic-http-server", "p1-weather-client"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-classes-prototypes",
    slug: "classes-and-prototypes",
    title: "Classes and Prototypes",
    description: "class syntax, constructors, instance and static methods, class fields, and a first look at the prototype chain.",
    order: 16,
    estimatedMinutes: 22,
    tags: ["classes", "prototypes", "oop"],
    prerequisites: ["p1m2-functions", "p1m2-arrays-objects"],
    relatedTopics: ["p1m2-this-keyword", "p1m2-scope-closures", "p1m2-arrow-functions"],
    learningObjectives: [
      "Define classes with constructors and methods",
      "Use static methods and class fields",
      "Explain that class syntax is prototype-based sugar",
      "Trace the prototype chain for method lookup",
    ],
    simpleExplanation:
      "Classes are a cleaner syntax for creating objects that share behaviour. \\`new ClassName()\\` runs the constructor and returns a new instance. Methods live on the prototype, so every instance shares one copy of the code. \\`static\\` members belong to the class itself. Under the hood, classes are still prototypes — understanding that helps you debug \\`this\\` and inheritance.",
    detailedContent: `
### Class basics

\`\`\`js
class User {
  static roleLabel = "user";          // static field (shared)
  #secret = "hidden";                 // private field

  constructor(name) {
    this.name = name;                 // instance field
  }

  greet() {                           // prototype method
    return \`Hi, I'm \${this.name}\`;
  }

  static create(name) {               // static method
    return new User(name);
  }
}

const ada = new User("Ada");
console.log(ada.greet());             // "Hi, I'm Ada"
console.log(User.roleLabel);          // "user"
console.log(User.create("Grace") instanceof User); // true
\`\`\`

### Prototype chain

\`ada.greet\` is not stored on \`ada\`. The engine looks up:

1. Own properties of \`ada\`
2. \`User.prototype\` (where \`greet\` lives)
3. \`Object.prototype\`
4. \`null\` → \`undefined\` / TypeError for calls

That shared lookup is why methods are memory-efficient.

### Classes are sugar

\`class\` is syntactic sugar over constructor functions + prototype assignment. You cannot call a class without \`new\` (TypeError). Classes are also *not* hoisted like function declarations — TDZ applies.

### Fields

- Instance fields (including \`#private\`) are initialised in the constructor order.
- Static fields belong to the class object.
- Private \`#\` fields are truly inaccessible from outside — better privacy than closures for classes.
    `,
    howItWorks: `
\`new User("Ada")\` roughly does:

1. Create a fresh object whose prototype is \`User.prototype\`.
2. Run the constructor with \`this\` bound to that object.
3. Return the object (unless the constructor returns another object).

Method calls do \`ada.greet()\` → look up \`greet\` on the prototype → call with \`this = ada\`. \`extends\` wires \`Child.prototype.__proto__ = Parent.prototype\`, so method lookup walks up the parent chain; \`super()\` invokes the parent constructor.
    `,
    codeExamples: [
      {
        title: "A small class with static factory",
        language: "js",
        code: `class BankAccount {
  static #instances = 0;

  #balance;

  constructor(owner, opening = 0) {
    this.owner = owner;
    this.#balance = opening;
    BankAccount.#instances++;
  }

  deposit(amount) {
    if (amount <= 0) throw new RangeError("amount must be positive");
    this.#balance += amount;
    return this.#balance;
  }

  get balance() {
    return this.#balance;
  }

  static get instances() {
    return BankAccount.#instances;
  }

  static create(owner, opening) {
    return new BankAccount(owner, opening);
  }
}

const acct = BankAccount.create("Ada", 100);
acct.deposit(50);
console.log(acct.balance);        // 150
console.log(BankAccount.instances); // 1
// acct.#balance → SyntaxError: private field not accessible`,
        description:
          "Private #fields give true encapsulation. The static counter tracks how many accounts were created.",
      },
    ],
    commonMistakes: [
      "Calling a class without new (TypeError: cannot be invoked without 'new').",
      "Forgetting that class declarations are not hoisted like functions.",
      "Using arrow functions as class methods when you need them on the prototype.",
      "Expecting methods defined per-instance in the constructor to be shared — they are not.",
    ],
    bestPractices: [
      "Keep classes small; prefer plain functions when there is no shared state.",
      "Use static factories for named constructors with validation.",
      "Use #private fields for invariants instead of _underscore conventions.",
      "When debugging missing methods, check the prototype chain (Object.getPrototypeOf).",
    ],
    realWorldUseCases: [
      "Modeling domain entities (User, Order, Invoice) in backend services.",
      "Wrapper classes around external SDKs with validation in constructors.",
      "Error hierarchies built with class extends Error.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Classes",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes",
        description: "Class declarations, members, inheritance and static members.",
      },
      videos: [
        {
          query: "JavaScript classes and prototype chain explained",
          description: "Class syntax with the underlying prototype model.",
          estimatedDuration: "12–20 min",
        },
      ],
      article: {
        title: "MDN — Inheritance and the prototype chain",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
        provider: "developer.mozilla.org",
        description: "How property lookup walks the prototype chain.",
        estimatedDuration: "10 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-shape",
        title: "Class hierarchy",
        prompt:
          "Create class Shape with area() throwing 'not implemented', and class Rectangle extends Shape with constructor(w, h) and area(). Add a static Shape.describe(). Verify Rectangle instances are instanceof both.",
        difficulty: "beginner",
        estimatedMinutes: 18,
        hints: ["Call super() if the parent constructor takes args", "instanceof walks the prototype chain"],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-notes-cli"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-this-keyword",
    slug: "the-this-keyword",
    title: "The this Keyword",
    description: "The four binding rules — default, implicit, explicit (call/apply/bind) and new — plus arrow functions.",
    order: 17,
    estimatedMinutes: 20,
    tags: ["this", "functions", "classes"],
    prerequisites: ["p1m2-functions", "p1m2-classes-prototypes"],
    relatedTopics: ["p1m2-arrow-functions", "p1m2-scope-closures"],
    learningObjectives: [
      "Identify what this refers to in the four binding scenarios",
      "Use call, apply and bind to set this explicitly",
      "Predict this inside callbacks and arrow functions",
      "Avoid the most common this-related bugs",
    ],
    simpleExplanation:
      "\\`this\\` is a hidden parameter passed to every function call. What it points to depends on *how* the function was called: normally the surrounding object (implicit), undefined in strict mode (default), whatever you pass to call/apply/bind (explicit), or the freshly created object with new. Arrow functions have no this of their own — they inherit it from where they were written.",
    detailedContent: `
### The four rules (in priority order)

1. **new binding** — \`new Foo()\` → \`this\` is the new object.
2. **explicit binding** — \`fn.call(obj)\`, \`fn.apply(obj)\`, \`const g = fn.bind(obj)\` → \`this = obj\`.
3. **implicit binding** — \`obj.method()\` → \`this = obj\`.
4. **default binding** — bare \`fn()\` → \`this = globalThis\` in sloppy mode, \`undefined\` in strict/module code.

### call / apply / bind

\`\`\`js
function greet(punct) {
  return \`\${this.name}\${punct}\`;
}
const user = { name: "Ada" };
greet.call(user, "!");   // "Ada!"
greet.apply(user, ["!"]); // same, args as array
const bound = greet.bind(user, "!");
bound();                  // "Ada!" — this is locked forever
\`\`\`

### this in callbacks and arrows

\`\`\`js
const counter = {
  count: 0,
  bad() {
    setTimeout(function () { this.count++; }, 0); // this = undefined/global → bug
  },
  good() {
    setTimeout(() => { this.count++; }, 0);      // arrow → counter
  },
};
\`\`\`

### Detaching methods

\`\`\`js
const fn = user.greet; // unbound
fn(); // this is lost — call with user.greet() or bind
\`\`\`
    `,
    howItWorks: `
At call time the engine determines \`thisArg\` using the above rules. \`call\`/\`apply\` set it for one invocation; \`bind\` returns a *new function* with \`this\` (and optionally leading arguments) permanently baked in — implemented by wrapping the original function.

Arrow functions capture \`this\` lexically during creation, so no call-site rule can change it. That is also why \`call(user)\` on an arrow has no effect on its internal this.

In class methods, \`this\` is the instance only when the method is called as \`obj.method()\` — extracting it loses the binding (unless bound).
    `,
    codeExamples: [
      {
        title: "this in the wild",
        language: "js",
        code: `const logger = {
  prefix: "LOG",
  log(msg) {
    console.log(\`[\${this.prefix}] \${msg}\`);
  },
};

logger.log("hi"); // "[LOG] hi" — implicit

const fn = logger.log;
try {
  fn("hi"); // TypeError: cannot read properties of undefined (strict)
} catch (e) {
  console.log("detached:", e.name);
}

fn.call(logger, "via call");  // "[LOG] via call"
const bound = fn.bind(logger, "via bound");
bound();                      // "[LOG] via bound"

// new binding
class Point {
  constructor(x, y) { this.x = x; this.y = y; }
  dist() { return Math.hypot(this.x, this.y); }
}
console.log(new Point(3, 4).dist()); // 5`,
        description:
          "Notice the detached method throws in strict mode. bind creates a permanently bound function you can pass around.",
      },
    ],
    commonMistakes: [
      "Passing obj.method as a callback and losing this.",
      "Using function(){} inside a method and expecting this to be the object — use an arrow.",
      "Calling bind twice or re-binding unnecessarily.",
      "Forgetting that class field arrow functions are per-instance (extra memory).",
    ],
    bestPractices: [
      "Use arrows in callbacks that need the outer this.",
      "Bind once in the constructor when a method will be used as a callback.",
      "Prefer explicit parameters over relying on this for values you already have.",
      "When this is undefined in a callback, extract the method call: () => obj.method().",
    ],
    realWorldUseCases: [
      "Express handlers often need this for config — bind in the constructor or use arrows.",
      "Event emitters pass this as the emitter for .on('event', handler) unless an arrow is used.",
      "Utility libraries expose .call/.apply for reusable context-agnostic functions.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — this",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this",
        description: "Binding rules, call/apply/bind and common gotchas.",
      },
      videos: [
        {
          query: "JavaScript this keyword explained call apply bind",
          description: "Rule-by-rule walkthroughs with diagrams.",
          estimatedDuration: "10–18 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-this",
        title: "Predict this",
        prompt:
          "Given the object counter with count and increment() { return ++this.count }, predict this and the return value for: counter.increment(); const f = counter.increment; f(); counter.increment.call({ count: 10 }); Then run to verify.",
        difficulty: "beginner",
        estimatedMinutes: 12,
        hints: ["Detached call uses default binding", "call sets this to { count: 10 }"],
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-contact-manager"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-es-modules",
    slug: "es-modules",
    title: "ES Modules",
    description: "import/export syntax, named vs default exports, hoisting, tree-shaking, and dynamic import().",
    order: 18,
    estimatedMinutes: 20,
    tags: ["modules", "import-export", "architecture"],
    prerequisites: ["p1m2-functions", "p1m2-scope-closures"],
    relatedTopics: ["p1m2-commonjs-basics", "p1m2-classes-prototypes"],
    learningObjectives: [
      "Export and import named bindings and default exports",
      "Explain static analysis and why imports are hoisted",
      "Use dynamic import() for lazy loading",
      "Know when Node.js treats a file as an ES module",
    ],
    simpleExplanation:
      "ES modules split your code into files with explicit \\`export\\` and \\`import\\`. Named exports let a file expose many bindings; a default export provides one main value. Imports are *statically analysed* (the engine knows the whole graph before running code), which enables early errors and bundler optimizations like tree-shaking. In Node.js, use \\`\\\"type\\\": \\\"module\\\"\\` in package.json or the \\`.mjs\\` extension.",
    detailedContent: `
### Named vs default exports

\`\`\`js
// utils.js
export const slugify = (s) => s.toLowerCase().replace(/\\s+/g, "-");
export function formatDate(d) { return d.toISOString().slice(0, 10); }
export default function log(msg) { console.log(msg); }

// main.js
import log, { slugify, formatDate } from "./utils.js";
import * as utils from "./utils.js"; // namespace import
\`\`\`

A file may have **many named exports** but only **one default**.

### Static semantics and hoisting

Import statements are hoisted and evaluated before any other code in the module — but the imported bindings are live views of the exporting module’s variables. You cannot use an imported binding before the exporting module has initialised it (circular imports can produce \`undefined\` temporarily).

### Dynamic import()

\`\`\`js
const { heavy } = await import("./heavy.js");
\`\`\`

Returns a promise; loads the module on demand. Ideal for optional features and startup performance.

### Node.js specifics

- \`.mjs\` always treated as ESM; \`.cjs\` as CommonJS.
- Or set \`"type": "module"\` in package.json and use \`.js\`.
- ESM files are strict mode automatically.
- Relative imports must include the file extension (\`./utils.js\`).
    `,
    howItWorks: `
The parser extracts the static import/export graph before execution — this is why bundlers can *tree-shake* (drop unused exports) and why importing a non-existent export is a **compile-time** SyntaxError in some environments.

At runtime each module has a unique registry record; repeated imports of the same file return the same instance (singleton semantics). Live bindings mean \`export let counter\` updates are visible to importers without re-importing.

Dynamic \`import()\` is the only way to load a module conditionally or lazily; it always returns a promise resolving to the module namespace object.
    `,
    codeExamples: [
      {
        title: "Named, default and dynamic imports",
        language: "js",
        code: `// math.js
export function add(a, b) { return a + b; }
export function mul(a, b) { return a * b; }
export const PI = 3.14159;
export default { add, mul, PI };

// app.js
import mathDefault, { add, mul, PI } from "./math.js";
console.log(add(2, 3));          // 5
console.log(PI);                 // 3.14159
console.log(mathDefault.mul(4, 5)); // 20

// Lazy load a module on demand
async function loadLogger() {
  const { createLogger } = await import("./logger.js");
  return createLogger("app");
}
loadLogger().then(l => l.info("ready"));`,
        description:
          "Run with node app.js (package.json type=module or .mjs extension). Dynamic import enables code-splitting patterns.",
      },
    ],
    commonMistakes: [
      "Forgetting the file extension in relative imports (Node ESM requires ./file.js).",
      "Mixing require and import in the same file without a bridge.",
      "Expecting default export names to matter — importers can rename freely.",
      "Circular imports that read bindings before initialisation (undefined values).",
    ],
    bestPractices: [
      "Prefer named exports for clarity and better refactoring support.",
      "Use dynamic import() for large optional dependencies.",
      "Keep module graphs acyclic where possible; break cycles with dependency injection.",
      "Use .js extensions in relative imports for Node ESM compatibility.",
    ],
    realWorldUseCases: [
      "Node.js services structure code as ESM modules (routes, services, utils).",
      "Bundlers tree-shake unused exports to shrink browser bundles.",
      "CLI tools lazily import heavy subcommands only when invoked.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — ECMAScript modules",
        url: "https://nodejs.org/api/esm.html",
        description: "How Node.js implements ESM, including file extensions and resolution.",
      },
      videos: [
        {
          query: "JavaScript ES modules import export tutorial",
          description: "Named vs default exports, live bindings and dynamic import.",
          estimatedDuration: "10–16 min",
        },
      ],
      article: {
        title: "MDN — JavaScript modules",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
        provider: "developer.mozilla.org",
        description: "Browser-oriented guide that also explains the core semantics.",
        estimatedDuration: "12 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-modules",
        title: "Split a script",
        prompt:
          "Take a single-file script with two functions and a constant and split it into three files exporting them properly. Import them in a main file with both named and default import styles. Verify with node --input-type=module or .mjs files.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Node ESM needs file extensions in relative imports", "Use export default for the primary function"],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-file-organizer", "p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-commonjs-basics",
    slug: "commonjs-basics",
    title: "CommonJS Basics",
    description: "require/module.exports, module resolution order, caching, and circular dependency dangers.",
    order: 19,
    estimatedMinutes: 18,
    tags: ["commonjs", "require", "node"],
    prerequisites: ["p1m2-es-modules", "p1m2-functions"],
    relatedTopics: ["p1m2-es-modules", "p1m2-scope-closures"],
    learningObjectives: [
      "Export and require modules with module.exports",
      "Explain Node's module resolution order",
      "Understand require caching",
      "Recognise circular dependency hazards",
    ],
    simpleExplanation:
      "CommonJS is the original Node.js module system. A file calls \\`module.exports = ...\\` to expose values; other files use \\`const x = require('./x')\\` to load them. Unlike ES modules, \\`require\\` is a normal function — it runs at the moment it is called, loads a *copy* of the exports, and caches the result. Circular requires often give you a partially-filled exports object.",
    detailedContent: `
### Exporting

\`\`\`js
// logger.js
function info(msg) { console.log("INFO", msg); }
module.exports = { info };          // replace entire exports
// or
module.exports.info = info;         // add properties

// consumers
const { info } = require("./logger");
const logger = require("./logger");
\`\`\`

### Resolution order

\`require('./utils')\` is resolved as:

1. Exact path if it has an extension.
2. \`.js\`, \`.json\`, \`.node\` (in order).
3. If it’s a directory: \`package.json\` “main”/“exports”, else \`index.js\`.

Bare specifiers (\`require('express')\`) search \`node_modules\` upward through parent directories.

### Caching

The first \`require\` of a resolved path executes the module and stores \`module.exports\` in \`require.cache\`. Subsequent requires return the **same object reference** — a singleton. Delete \`require.cache[path]\` only in tests for hot-reloading.

### Circular dependencies

A requires B, B requires A: whichever loads second gets the partially initialised exports of the other. Exports assigned *after* the require call may still be missing. Mitigations: invert the dependency, pass functions instead of values, or assign exports early.

### require vs import

ESM \`import\` is static and hoisted; \`require\` is dynamic and runs in order. Node can load CJS from ESM (via default interop) but not the reverse without \`createRequire\`.
    `,
    howItWorks: `
Node wraps every CJS module in a function:

\`\`\`js
(function (exports, require, module, __filename, __dirname) {
  // module code
});
\`\`\`

That is why \`module\`, \`exports\`, \`require\`, \`__filename\` and \`__dirname\` exist — each module has its own scope and these are injected.

\`require\` is synchronous: it reads the file from disk (or cache), compiles it, runs it, and returns \`module.exports\`. This blocking load is one reason ESM introduced async dynamic import.
    `,
    codeExamples: [
      {
        title: "CommonJS module and cache behaviour",
        language: "js",
        code: `// config.js
let loadCount = 0;
module.exports = {
  load() { return ++loadCount; },
  getLoadCount: () => loadCount,
};

// a.js
const config = require("./config");
console.log("a load:", config.load()); // 1

// b.js
const configAgain = require("./config");
console.log("b load:", configAgain.load()); // 2 — same cache
console.log("same object:", configAgain === require("./config")); // true

// math.js
module.exports.add = (a, b) => a + b;
module.exports.mul = (a, b) => a * b;

// app.js
const { add, mul } = require("./math");
console.log(add(2, 3), mul(4, 5)); // 5 20`,
        description:
          "Run a.js and b.js from the same process (require a then b) to observe shared cache state.",
      },
    ],
    commonMistakes: [
      "Mixing module.exports and exports incorrectly — module.exports = x replaces the whole object.",
      "Assuming require gives a deep clone — it returns the same cached exports object.",
      "Circular requires that read properties assigned later (undefined).",
      "Using __dirname in ESM (undefined) — use import.meta.url instead.",
    ],
    bestPractices: [
      "Pick one module system per package; do not mix require and import in the same file.",
      "Export early and often — assign properties to module.exports before requiring siblings when cycles are unavoidable.",
      "Prefer pure functions to reduce hidden singleton state via the cache.",
      "For new Node.js projects, default to ESM unless a dependency requires CJS.",
    ],
    realWorldUseCases: [
      "Most existing npm packages still ship CJS — you will read require constantly.",
      "Express apps historically use module.exports = router patterns.",
      "Testing often clears require.cache between suites (or uses jest.resetModules).",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — CommonJS modules",
        url: "https://nodejs.org/api/modules.html",
        description: "Official docs on require, exports, resolution and caching.",
      },
      videos: [
        {
          query: "Node.js CommonJS require module.exports tutorial",
          description: "Beginner-friendly walkthrough of the original Node module system.",
          estimatedDuration: "10–16 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-cjs",
        title: "Circular warning",
        prompt:
          "Create a.js requiring b.js and b.js requiring a.js. Export a function from each after the require. Observe what you get, then fix the cycle by moving shared state to c.js or passing callbacks. Document the behaviour difference.",
        difficulty: "beginner",
        estimatedMinutes: 18,
        hints: ["Log what you receive from the circular require", "Assign exports before requiring if you must keep the cycle"],
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-file-organizer"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-promises",
    slug: "promises",
    title: "Promises",
    description: "Pending/fulfilled/rejected states, chaining, error propagation, and the Promise constructor anti-pattern.",
    order: 20,
    estimatedMinutes: 22,
    tags: ["promises", "async", "asynchronous"],
    prerequisites: ["p1m2-functions", "p1m2-error-handling-try-catch"],
    relatedTopics: ["p1m2-async-await", "p1m2-callbacks", "p1m2-event-loop"],
    learningObjectives: [
      "Describe the three promise states and transitions",
      "Chain .then/.catch/.finally correctly",
      "Explain how errors propagate through chains",
      "Spot and fix the Promise constructor anti-pattern",
    ],
    simpleExplanation:
      "A Promise represents a value that may arrive later. It starts **pending**, then becomes **fulfilled** with a value or **rejected** with an error — permanently. You attach .then to handle success and .catch for failure. Chains return new promises, so each .then can transform the previous value. Errors skip .then handlers and jump to the nearest .catch.",
    detailedContent: `
### States

| State | Meaning | Settled? |
| --- | --- | --- |
| pending | not finished | no |
| fulfilled | completed with a value | yes |
| rejected | failed with a reason | yes |

Once settled, a promise never changes state again.

### Creating

\`\`\`js
const ok = Promise.resolve(42);
const bad = Promise.reject(new Error("nope"));
const later = new Promise((resolve, reject) => {
  setTimeout(() => resolve("done"), 100);
});
\`\`\`

### Chaining

\`\`\`js
fetchUser(id)
  .then(user => fetchOrders(user.id))
  .then(orders => orders.length)
  .catch(err => console.error(err))
  .finally(() => loading = false);
\`\`\`

Each \`then\` receives the previous resolved value and returns a new promise. Returning a promise inside \`then\` flattens it (waits for the inner one).

### Error propagation

A throw inside \`then\` rejects the *next* promise in the chain — exactly like try/catch semantics. \`catch\` can recover (return a fallback value) or rethrow.

### The anti-pattern

\`\`\`js
// BAD: wrapping an already-async API in new Promise
new Promise((resolve, reject) => {
  doAsync(cb).then(resolve, reject); // useless nesting
});
\`\`\`

Use \`new Promise\` only for *sync-to-async* bridges (setTimeout, event listeners).
    `,
    howItWorks: `
Internally a promise maintains a list of subscribed reaction functions. When it settles, the engine enqueues reactions onto the **microtask queue** — they run after the current script finishes, before timers. This guarantees .then callbacks are always asynchronous (even for \`Promise.resolve\`), preventing Zalgo (unpredictable sync/async).

\`Promise.all\` runs promises concurrently and rejects on the first failure; \`Promise.allSettled\` never rejects; \`Promise.race\` settles with the first settled result; \`Promise.any\` with the first success.
    `,
    codeExamples: [
      {
        title: "Chaining and error handling",
        language: "js",
        code: `function wait(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
function fail(message) {
  return Promise.reject(new Error(message));
}

wait(50, "user-1")
  .then(id => {
    console.log("got id", id);
    return wait(50, { id, name: "Ada" });
  })
  .then(user => {
    if (!user.name) throw new Error("missing name");
    return user.name.toUpperCase();
  })
  .then(name => console.log(name))   // "ADA"
  .catch(err => console.log("caught:", err.message))
  .finally(() => console.log("always runs"));

// Concurrency
Promise.all([wait(30, 1), wait(20, 2), wait(10, 3)])
  .then(values => console.log(values)); // [1, 2, 3] after ~30ms`,
        description:
          "Errors thrown in any then jump to catch. Promise.all waits for all — order is preserved regardless of timing.",
      },
    ],
    commonMistakes: [
      "Wrapping promise-returning functions in new Promise (anti-pattern, double-handling).",
      "Forgetting to return the promise from then, so the next then receives undefined.",
      "Catching and swallowing errors without recovery or rethrow.",
      "Using Promise.all when you need partial results (use allSettled).",
    ],
    bestPractices: [
      "Return promises from then callbacks to keep chains typed and testable.",
      "Use Promise.all for independent concurrent requests.",
      "Always attach .catch at the end of floating chains to avoid unhandled rejections.",
      "Prefer async/await for readability once you understand promises underneath.",
    ],
    realWorldUseCases: [
      "Fan-out API calls to several microservices with Promise.all.",
      "Retry helpers that wrap a promise with exponential backoff.",
      "Queue workers resolve job promises as processing completes.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — Promises",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises",
        description: "Guide to chaining, error handling and composition.",
      },
      videos: [
        {
          query: "JavaScript promises explained then catch chaining",
          description: "Visual walkthroughs of promise states and chains.",
          estimatedDuration: "10–18 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-retry",
        title: "Promise retry",
        prompt:
          "Write retry(fn, attempts) that calls fn() (which returns a promise) up to attempts times, waiting 100ms between tries, and resolves with the first success or rejects after exhausting attempts. Avoid the Promise constructor anti-pattern around fn.",
        difficulty: "beginner",
        estimatedMinutes: 18,
        hints: ["Recursive then/catch works well", "Use new Promise only for the sleep delay"],
      },
    ],
    projectIds: ["p1-weather-client", "p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-async-await",
    slug: "async-and-await",
    title: "async/await",
    description: "Syntax sugar over promises, await in loops vs Promise.all, try/catch, and top-level await.",
    order: 21,
    estimatedMinutes: 20,
    tags: ["async", "await", "promises"],
    prerequisites: ["p1m2-promises"],
    relatedTopics: ["p1m2-event-loop", "p1m2-error-handling-try-catch"],
    learningObjectives: [
      "Write async functions that return promises",
      "Use await to pause until a promise settles",
      "Choose between sequential awaits and Promise.all",
      "Handle async errors with try/catch and know about top-level await",
    ],
    simpleExplanation:
      "\\`async\\` marks a function as returning a Promise. Inside it, \\`await\\` pauses execution until a promise fulfills (or throws if it rejects). This makes asynchronous code read like synchronous code. But beware: awaiting inside a loop runs sequentially — to run tasks concurrently, start them all and await Promise.all.",
    detailedContent: `
### Basics

\`\`\`js
async function getUser(id) {
  const res = await fetch(\`/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

getUser(1).then(console.log); // still a promise!
\`\`\`

An async function always returns a promise — even if you return a plain value (it is wrapped). Throwing inside is the same as rejecting.

### Sequential vs concurrent

\`\`\`js
// BAD: sequential — total time = sum of each call
for (const id of ids) {
  results.push(await fetchUser(id));
}

// GOOD: concurrent — total time ≈ slowest call
const results = await Promise.all(ids.map(id => fetchUser(id)));
\`\`\`

### try/catch

\`\`\`js
try {
  const user = await getUser(1);
} catch (err) {
  // handles both thrown errors and rejections
} finally {
  // cleanup
}
\`\`\`

### Top-level await

ES modules (and Node ESM) allow \`await\` at the top level of a module — useful for initialising config or connections before exporting. CJS cannot use it.

### Gotchas

- \`await\` only pauses *inside* the async function — other code keeps running.
- Floating awaits (not awaited, no .catch) create unhandled rejections.
- \`await\` in a for...of loop is intentional when order/dependencies matter.
    `,
    howItWorks: `
The compiler transforms async/await into promise state-machine code under the hood. When you hit \`await p\`, the function returns control to its caller (with a pending promise), and registers a continuation on \`p\`. When \`p\` settles, the continuation resumes execution on the microtask queue after the previous synchronous work finishes.

This is why \`await\` does not block the thread — it only blocks that async function’s logical execution.
    `,
    codeExamples: [
      {
        title: "async/await done right",
        language: "js",
        code: `async function loadDashboard(userId) {
          try {
            // independent calls: run concurrently
            const [user, notifications] = await Promise.all([
              fetchUser(userId),
              fetchNotifications(userId),
            ]);

            // dependent call: must wait for user first
            const orders = await fetchOrders(user.id);

            return { user, notifications, orders };
          } catch (err) {
            console.error("dashboard failed:", err.message);
            return null;
          } finally {
            console.log("load attempt finished");
          }
        }

// Top-level await (ESM only)
// const config = await loadConfig();`,
        description:
          "Promise.all combines independent requests; dependent calls await sequentially. try/catch/finally work exactly like sync code.",
      },
    ],
    commonMistakes: [
      "Awaiting sequentially when requests are independent (slow!).",
      "Forgetting that await inside a non-async function is a SyntaxError.",
      "Not catching rejections from floating promises.",
      "Using await inside a .then callback unnecessarily — just return the promise.",
    ],
    bestPractices: [
      "Use Promise.all / allSettled for independent concurrent work.",
      "Wrap risky awaits in try/catch; rethrow when you cannot handle.",
      "Mark helper functions async only if they actually await.",
      "Use top-level await sparingly — it complicates module evaluation order.",
    ],
    realWorldUseCases: [
      "Express handlers with async functions calling databases and external APIs.",
      "CLI scripts that fetch data, transform it, then write files sequentially.",
      "Worker processes that await job results with proper error handling.",
    ],
    resources: lessonResources({
      official: {
        title: "MDN — async function",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
        description: "Semantics of async functions and the await operator.",
      },
      videos: [
        {
          query: "JavaScript async await tutorial promises",
          description: "Practical async/await patterns with try/catch and concurrency.",
          estimatedDuration: "10–16 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-async-pipeline",
        title: "Concurrent loader",
        prompt:
          "Given ids = [1,2,3] and an async fetchUser(id), load them concurrently with Promise.all and compute the total age. Then rewrite to load sequentially and compare timing (add artificial delays).",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["ids.map(id => fetchUser(id)) returns an array of promises", "Measure with Date.now()"],
      },
    ],
    projectIds: ["p1-weather-client", "p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-callbacks",
    slug: "callbacks",
    title: "Callbacks",
    description: "Callback style, the error-first convention, callback hell, and why promises replaced them.",
    order: 22,
    estimatedMinutes: 18,
    tags: ["callbacks", "async", "patterns"],
    prerequisites: ["p1m2-functions"],
    relatedTopics: ["p1m2-promises", "p1m2-async-await", "p1m2-event-loop"],
    learningObjectives: [
      "Write and invoke callback functions",
      "Apply the error-first callback convention",
      "Recognise callback hell and its readability costs",
      "Explain how promises and async/await improved on callbacks",
    ],
    simpleExplanation:
      "A callback is simply a function you pass to another function so it can run later — typically when an async operation finishes. Node.js historically used the *error-first* convention: the callback receives \\`(error, result)\\`. Nesting many callbacks leads to ‘callback hell’ (deep indentation, tangled error handling), which is why promises and async/await became the default.",
    detailedContent: `
### Callback basics

\`\`\`js
function doLater(cb) {
  setTimeout(() => cb("done"), 100);
}

doLater((msg) => console.log(msg)); // "done" after ~100ms
\`\`\`

Callbacks can be synchronous too:

\`\`\`js
function forEachItem(list, cb) {
  for (const item of list) cb(item);
}
\`\`\`

### The error-first convention

\`\`\`js
fs.readFile("notes.txt", "utf8", (err, data) => {
  if (err) {
    console.error("read failed:", err.message);
    return;
  }
  console.log(data);
});
\`\`\`

Rule: the first parameter is always an error (or \`null\`), the rest are results. Never call the callback with a falsy error and also with a result as if both are valid.

### Callback hell

\`\`\`js
getUser(id, (err, user) => {
  if (err) return done(err);
  getOrders(user.id, (err, orders) => {
    if (err) return done(err);
    getOrderDetails(orders[0].id, (err, details) => {
      if (err) return done(err);
      done(null, details);
    });
  });
});
\`\`\`

Each level adds indentation and duplicated error checks — the classic pyramid of doom.

### Why promises won

- Flat chains with centralised .catch.
- Composable with Promise.all / race / allSettled.
- Guaranteed asynchronicity (no Zalgo).
- async/await makes them look synchronous.
    `,
    howItWorks: `
The caller stores your callback function and invokes it later — after a timer fires, an I/O event arrives, or a response is parsed. In Node’s C-style APIs, the callback is enqueued on the event loop once the underlying operation completes (see the event loop lesson).

Error-first callbacks propagate manually: each layer must check \`if (err) return cb(err)\`. Forgetting one check silently drops errors — a major source of production bugs before promises.
    `,
    codeExamples: [
      {
        title: "Error-first callbacks vs promise style",
        language: "js",
        // Error-first callback style
        code: `// Error-first callback style
function readConfig(path, callback) {
  // simulate async failure
  setTimeout(() => {
    if (!path) {
      callback(new Error("path required"));
    } else {
      callback(null, { path, retries: 3 });
    }
  }, 10);
}

readConfig("app.json", (err, config) => {
  if (err) {
    console.error("failed:", err.message);
    return;
  }
  console.log("loaded:", config);
});

// The same logic as a promise (modern style)
function readConfigAsync(path) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!path) reject(new Error("path required"));
      else resolve({ path, retries: 3 });
    }, 10);
  });
}

readConfigAsync("app.json")
  .then(config => console.log("loaded:", config))
  .catch(err => console.error("failed:", err.message));`,
        description:
          "Both styles achieve the same result. The promise version composes better and pairs with async/await.",
      },
    ],
    commonMistakes: [
      "Forgetting to check err as the first thing inside a callback.",
      "Calling the callback twice (e.g. after an error and after success).",
      "Using callbacks where a synchronous return would be clearer.",
      "Assuming callback arguments are always present — check for undefined.",
    ],
    bestPractices: [
      "When maintaining old callback code, keep the error-first convention intact.",
      "Convert callback APIs to promises at the edges of your codebase (util.promisify in Node).",
      "Avoid deep nesting: extract helper functions or switch to async/await.",
      "Always pass err to the next layer — never swallow it.",
    ],
    realWorldUseCases: [
      "Legacy Node.js core APIs (fs, dns, crypto) still expose callback forms.",
      "Event handlers in browser and Node event systems are callbacks.",
      "Libraries like async.js exist purely to orchestrate callback workflows (historical).",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — Using callbacks",
        url: "https://nodejs.org/en/learn/asynchronous-work/asynchronous-patterns",
        description: "How Node.js uses callbacks for asynchronous operations.",
      },
      videos: [
        {
          query: "JavaScript callbacks error-first convention explained",
          description: "Callback patterns, error handling and the road to promises.",
          estimatedDuration: "8–14 min",
        },
      ],
      article: {
        title: "Node.js — util.promisify",
        url: "https://nodejs.org/api/util.html#utilpromisifyoriginal",
        provider: "nodejs.org",
        description: "Convert error-first callbacks to promise-returning functions.",
        estimatedDuration: "6 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-callback",
        title: "Promisify a callback API",
        prompt:
          "Given a callback-style function delayCallback(ms, value, cb) that calls cb(null, value) after ms (or cb(error) if ms < 0), wrap it with a promisified version using new Promise. Then rewrite one call site using async/await.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["new Promise((resolve, reject) => ...)", "Map (err, value) to resolve(value) / reject(err)"],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-event-loop",
    slug: "the-event-loop",
    title: "The Event Loop",
    description: "Call stack, task (macrotask) queue, microtask queue, order of execution, and blocking the loop.",
    order: 23,
    estimatedMinutes: 22,
    tags: ["event-loop", "async", "node"],
    prerequisites: ["p1m2-callbacks", "p1m2-promises"],
    relatedTopics: ["p1m2-async-await", "p1m2-debugging-javascript"],
    learningObjectives: [
      "Describe the call stack and how function calls push/pop frames",
      "Differentiate microtasks (promises) from macrotasks (timers, I/O)",
      "Predict the execution order of mixed sync/micro/macro tasks",
      "Recognise and fix code that blocks the event loop",
    ],
    simpleExplanation:
      "Node.js runs your code on a single thread with a **call stack**. When the stack empties, the event loop drains the **microtask queue** (promise callbacks) first, then one **macrotask** (timer, I/O event). That is why \\`Promise.resolve().then()\\` runs before \\`setTimeout(..., 0)\\`, and why a long synchronous loop freezes everything — the loop cannot advance until your code yields.",
    detailedContent: `
### The pieces

| Component | Holds | Examples |
| --- | --- | --- |
| Call stack | synchronous frames | function calls, expressions |
| Microtask queue | promise reactions | .then, .catch, await continuations, queueMicrotask |
| Macrotask queue | events & timers | setTimeout, setInterval, I/O callbacks, setImmediate |

### Execution order (simplified)

1. Run the current macrotask (often a whole script or an I/O callback) to completion.
2. Drain **all** microtasks (including newly added ones).
3. Pick the next macrotask and repeat.

\`\`\`js
console.log("1 sync");

setTimeout(() => console.log("4 macrotask"), 0);

Promise.resolve().then(() => console.log("3 microtask"));

console.log("2 sync");
\`\`\`

Output: 1, 2, 3, 4.

### Blocking the loop

Any synchronous CPU-heavy work (big loops, sync file reads, JSON.parse of huge payloads) prevents step 1 from finishing — timers and other requests wait. In a web server this shows up as ballooning response times under load.

### Where Node adds its own phases

Node’s loop has extra phases (timers, pending callbacks, poll, check) that refine *which* macrotask runs next, but the microtask-before-macrotask rule stays the same.
    `,
    howItWorks: `
The event loop is a C++-level loop in libuv. Each iteration: process timers → process pending I/O callbacks → poll for new I/O → run setImmediate callbacks → close handlers. Between every callback and before yielding to the OS, JavaScript microtasks are flushed by V8.

\`await\` resumes as a microtask. \`setTimeout(fn, 0)\` schedules a macrotask that runs *after* all currently queued microtasks. \`process.nextTick\` (Node-specific) has even higher priority than promise microtasks.
    `,
    codeExamples: [
      {
        title: "Predict the order",
        language: "js",
        code: `console.log("start");

        setTimeout(() => console.log("timeout 1"), 0);

        Promise.resolve()
          .then(() => {
            console.log("micro 1");
            Promise.resolve().then(() => console.log("micro 2"));
          })
          .then(() => console.log("micro 3"));

        setTimeout(() => console.log("timeout 2"), 0);

        console.log("end");

        // Expected output:
        // start
        // end
        // micro 1
        // micro 2
        // micro 3
        // timeout 1
        // timeout 2`,
        description:
          "All microtasks (including nested ones) drain before any macrotask. Both timeouts are macrotasks in FIFO order.",
      },
    ],
    commonMistakes: [
      "Assuming setTimeout(fn, 0) runs immediately — it waits for the current stack and all microtasks.",
      "Running CPU-heavy sync work in a request handler and wondering why latency spikes for everyone.",
      "Creating promise chains in a loop and expecting them to run concurrently — they queue microtasks.",
      "Ignoring unhandledRejection events and losing track of failing promises.",
    ],
    bestPractices: [
      "Keep handlers short; move heavy work to worker threads or background jobs.",
      "Use Promise.all for concurrency instead of awaiting inside tight loops.",
      "Profile with node --prof or perf hooks when you suspect blocking.",
      "Remember: async does not mean parallel — Node is single-threaded for JS.",
    ],
    realWorldUseCases: [
      "Explaining why one slow request can degrade an entire Node.js server.",
      "Designing rate limiters and schedulers that rely on timer ordering.",
      "Debugging flaky tests that depend on microtask vs macrotask timing.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — The event loop",
        url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-nexttick",
        description: "Official breakdown of phases, timers, nextTick and microtasks.",
      },
      videos: [
        {
          query: "JavaScript event loop explained call stack microtask macrotask",
          description: "Visual explanations of queues and execution order.",
          estimatedDuration: "10–20 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m2-order",
        title: "Ordering challenge",
        prompt:
          "Without running it, write the exact console.log output of a snippet mixing sync logs, setTimeout(0), process.nextTick, and two levels of Promise.then. Then run node and verify. Explain any surprises using queue priority.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["nextTick runs before promise microtasks in Node", "Nested .then adds another microtask turn"],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
  {
    ...shared,
    id: "p1m2-debugging-javascript",
    slug: "debugging-javascript",
    title: "Debugging JavaScript",
    description: "console methods, the debugger statement, VS Code breakpoints, reading stack traces, and common error types.",
    order: 24,
    estimatedMinutes: 18,
    tags: ["debugging", "console", "errors"],
    prerequisites: ["p1m2-error-handling-try-catch", "p1m2-event-loop"],
    relatedTopics: ["p1m2-error-handling-try-catch", "p1m2-async-await"],
    learningObjectives: [
      "Use console methods beyond console.log for real diagnostics",
      "Set breakpoints in VS Code and the debugger statement",
      "Read and interpret JavaScript stack traces",
      "Distinguish TypeError, ReferenceError and SyntaxError quickly",
    ],
    simpleExplanation:
      "Debugging is finding *where* and *why* code misbehaves. Start with targeted \\`console\\` output, step up to the \\`debugger\\` statement or VS Code breakpoints when logs are not enough, and learn to read the error stack to jump straight to the offending line. Knowing the difference between TypeError, ReferenceError and SyntaxError narrows the search immediately.",
    detailedContent: `
### console beyond log

| Method | Use |
| --- | --- |
| \`console.log\` | general output |
| \`console.error\` / \`console.warn\` | severity-tagged output (shows in stderr / yellow) |
| \`console.table\` | tabular data (arrays of objects) |
| \`console.time/timeEnd\` | measure duration of a block |
| \`console.trace\` | print current stack without throwing |
| \`console.assert(cond, msg)\` | log only when condition is falsy |
| \`console.dir(obj, { depth: null })\` | inspect deep objects |

### debugger and breakpoints

Insert \`debugger;\` in code — when run under a debugger (VS Code launch.json, Chrome DevTools, node --inspect), execution pauses there. You can inspect variables, watch expressions, and step over/into/out.

In VS Code: click the gutter next to a line number to set a breakpoint, then F5 to start debugging.

### Reading stack traces

\`\`\`js
TypeError: Cannot read properties of undefined (reading 'name')
    at getDisplayName (user.js:12:20)
    at renderHeader (header.js:4:18)
    at Server.handle (server.js:40:5)
\`\`\`

Read top-down: the innermost frame first. \`user.js:12:20\` is line 12, column 20. Follow the chain outward to see the call path.

### Common error types

| Error | Meaning | Typical cause |
| --- | --- | --- |
| \`SyntaxError\` | code cannot parse | missing bracket, bad token |
| \`ReferenceError\` | variable not defined (or TDZ) | typo, use before declare |
| \`TypeError\` | wrong type for operation | calling non-function, null access |
| \`RangeError\` | value outside allowed range | stack overflow, invalid array length |
    `,
    howItWorks: `
The engine records a **stack trace** whenever an error is constructed or (optionally) when console.trace runs. Frames map to source positions via source maps if you use them. Breakpoints work by pausing the JS thread inside the debugger protocol (V8 inspector) — the process freezes until you resume, so timers do not fire while paused.

\`--inspect\` starts Node with the inspector port open (default 9229), letting VS Code or Chrome DevTools attach.
    `,
    codeExamples: [
      {
        title: "Practical debugging toolkit",
        language: "js",
        code: `function analyseUser(user) {
          console.time("analyse");
          console.assert(user != null, "user is required");
          console.log("raw:", user);
          console.table([
            { field: "name", value: user?.name },
            { field: "age", value: user?.age },
          ]);
          try {
            const label = user.name.trim(); // throws if user undefined
            return label;
          } catch (err) {
            console.error(err.stack); // full stack for logs
            console.trace("after failure"); // current frames
            return "unknown";
          } finally {
            console.timeEnd("analyse"); // ms elapsed
          }
        }

        analyseUser(undefined);`,
        description:
          "console.assert validates without throwing; time/timeEnd measure; .stack gives the trace to paste into bug reports.",
      },
    ],
    commonMistakes: [
      "console.log of a huge object and losing the important fields — use console.table or pick fields.",
      "Removing all debugger statements before testing whether they actually help.",
      "Reading only the first line of an error and missing the stack that shows your code.",
      "Confusing SyntaxError (parse time) with runtime errors — fix syntax first.",
    ],
    bestPractices: [
      "Log with context: include ids, inputs, and the failing branch.",
      "Use structured logging (JSON) in production instead of ad-hoc console.log.",
      "Keep a debugger session open for complex async flows — stepping beats guessing.",
      "Capture err.stack in error trackers (Sentry etc.) for post-mortem analysis.",
    ],
    realWorldUseCases: [
      "Reproducing a bug report by replaying with the same inputs under a breakpoint.",
      "Profiling a slow endpoint with console.time / perf hooks to find the hot function.",
      "Triaging production incidents by classifying error types from logs.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js — Debugging — getting started",
        url: "https://nodejs.org/en/learn/getting-started/debug-nodejs",
        description: "How to run Node with --inspect and attach VS Code or Chrome DevTools.",
      },
      videos: [
        {
          query: "How to debug JavaScript VS Code breakpoints tutorial",
          description: "Step-by-step debugging walkthroughs for Node.js and browsers.",
          estimatedDuration: "8–15 min",
        },
      ],
      article: {
        title: "MDN — Console",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/Console",
        provider: "developer.mozilla.org",
        description: "Full console API including table, trace, time and dir.",
        estimatedDuration: "8 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m2-stack",
        title: "Stack trace autopsy",
        prompt:
          "Write a small script with three nested functions where the innermost one throws a TypeError. Catch at the top and print err.stack. Annotate which frame corresponds to which function and explain how the trace helped you locate the bug.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["The first line of the stack is the throw site", "Frames read innermost → outermost"],
      },
    ],
    projectIds: ["p1-notes-cli", "p1-basic-http-server"],
    quizId: "quiz-p1-m2",
  },
];

export const quiz: Quiz = {
  id: "quiz-p1-m2",
  moduleId: "p1-m2",
  title: "Module 2 quiz — JavaScript fundamentals",
  description:
    "Test your understanding of variables, operators, control flow, functions, closures, objects, arrays, errors, classes, this, modules, promises, async/await and the event loop.",
  questions: [
    {
      id: "q-p1m2-1",
      type: "code-output",
      prompt: "What does this code print?",
      code: `const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length, b === a);`,
      language: "js",
      options: ["3 true", "4 true", "3 false", "4 false"],
      correctIndex: 1,
      explanation:
        "Arrays are reference types: b = a copies the reference, so both point to the same array. Pushing to b mutates that shared array — a.length becomes 4 and b === a remains true.",
      optionExplanations: [
        "The array was mutated through b, so length is 4, not 3.",
        "Correct — reference assignment shares the same object.",
        "=== on objects compares references, not a snapshot of contents.",
        "Both variables still point to the same array, so === is true.",
      ],
    },
    {
      id: "q-p1m2-2",
      type: "code-output",
      prompt: "What is printed?",
      code: `console.log(typeof null);
console.log(typeof undefined);
console.log(typeof []);
console.log(typeof function () {});`,
      language: "js",
      options: [
        "object undefined object function",
        "null undefined object function",
        "object undefined array function",
        "object undefined object object",
      ],
      correctIndex: 0,
      explanation:
        "typeof null is the famous legacy quirk returning 'object'. undefined reports 'undefined'. Arrays are objects internally. Functions report 'function' because of an internal callable flag.",
      optionExplanations: [
        "Correct — matches the actual typeof results for each value.",
        "typeof never returns 'null' — the bug returns 'object'.",
        "typeof cannot distinguish arrays; it reports 'object'.",
        "Functions are special-cased and report 'function', not 'object'.",
      ],
    },
    {
      id: "q-p1m2-3",
      type: "multiple-choice",
      prompt: "Which declaration creates a block-scoped binding that can be reassigned but not redeclared?",
      options: ["var", "let", "const", "function"],
      correctIndex: 1,
      explanation:
        "let is block-scoped, allows reassignment, and forbids redeclaration in the same scope. var is function-scoped and allows redeclaration. const is block-scoped but forbids reassignment. Function declarations are hoisted differently.",
      optionExplanations: [
        "var is function-scoped and allows silent redeclaration.",
        "Correct — let: block scope, reassignable, no redeclaration.",
        "const cannot be reassigned — only the binding, not object mutation.",
        "function declarations have their own hoisting and scoping rules.",
      ],
    },
    {
      id: "q-p1m2-4",
      type: "find-bug",
      prompt: "This function is supposed to return a greeting. What is wrong?",
      code: `function greet(user) {
  const { name = "guest", age = 0 } = user;
  return \`\${name} is \${age} years old\`;
}

console.log(greet({ name: "Ada" }));`,
      language: "js",
      options: [
        "Nothing — this code works correctly",
        "Destructuring defaults only apply for undefined, but the real issue is greet(null) would throw — however with the given call it works, so the actual bug is the missing return type",
        "The default for age should use || because 0 is falsy",
        "Template literals cannot use destructured variables",
      ],
      correctIndex: 0,
      explanation:
        "With the call greet({ name: 'Ada' }), name is provided and age is undefined so the default 0 applies. The code runs correctly and prints 'Ada is 0 years old'. There is no bug in this specific call — a common trick question to test that you actually execute it mentally.",
      optionExplanations: [
        "Correct — the shown call works; defaults handle the missing age.",
        "greet(null) would indeed throw, but that call is not shown; the code as written is fine.",
        "age: 0 is a valid default; switching to || would keep 0 anyway for undefined but the stated 'bug' does not exist here.",
        "Template literals interpolate any expression, including destructured variables.",
      ],
    },
    {
      id: "q-p1m2-5",
      type: "code-output",
      prompt: "What does this print after the timeouts fire?",
      code: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`,
      language: "js",
      options: ["A D C B", "A B C D", "A C D B", "A D B C"],
      correctIndex: 0,
      explanation:
        "Synchronous logs A and D run first. Promise reactions are microtasks and run before macrotasks — so C prints before the setTimeout callback B. Order: A, D, C, B.",
      optionExplanations: [
        "Correct — sync, then microtask C, then macrotask B.",
        "setTimeout is a macrotask and cannot run before microtasks.",
        "C is a microtask and must run before B, the timer callback.",
        "B is a macrotask queued after the current script; C beats it.",
      ],
    },
    {
      id: "q-p1m2-6",
      type: "multiple-choice",
      prompt: "What does Object.freeze(config) guarantee about config?",
      options: [
        "The variable config can never be reassigned",
        "All properties become deeply immutable, including nested objects",
        "Existing properties cannot be added, removed, or changed at the top level — but nested objects can still change",
        "The object becomes a primitive value",
      ],
      correctIndex: 2,
      explanation:
        "Object.freeze is shallow: it prevents adding/removing/changing own properties on that object only. Nested objects are separate and remain mutable. Preventing variable reassignment is what const does, not freeze.",
      optionExplanations: [
        "That is the job of const, not Object.freeze.",
        "freeze is not deep — nested objects are untouched.",
        "Correct — top-level props locked, nested still mutable.",
        "freeze returns the same object; types never change to primitives.",
      ],
    },
    {
      id: "q-p1m2-7",
      type: "short-answer",
      prompt:
        "Which array method transforms every element and returns a NEW array of the same length? Answer with the method name only.",
      acceptedKeywords: ["map"],
      explanation:
        "map calls a callback on each element and returns a new array of the same length. filter returns a shorter array; forEach returns undefined; reduce returns a single accumulated value.",
    },
    {
      id: "q-p1m2-8",
      type: "find-bug",
      prompt: "Users report intermittent crashes. What is the bug here?",
      code: `async function loadUsers(ids) {
  const results = [];
  for (const id of ids) {
    const user = await fetchUser(id);
    results.push(user);
  }
  return results;
}`,
      language: "js",
      options: [
        "await is not allowed inside a for...of loop",
        "The function does not catch network errors, so any rejection rejects the whole promise — and callers that forget .catch get an unhandled rejection",
        "fetchUser should be called with .then instead of await",
        "results should be declared with var",
      ],
      correctIndex: 1,
      explanation:
        "The async function works, but any fetchUser rejection propagates and rejects the returned promise. If callers omit try/catch or .catch, Node emits an unhandledRejection and may crash depending on settings. Also each await runs sequentially — fine for dependencies, slow for independent ids — but the crash risk is the missing error handling.",
      optionExplanations: [
        "for...of with await is perfectly valid JavaScript.",
        "Correct — no try/catch or .catch means rejections can go unhandled.",
        "await is the modern, correct way to call promise-returning fetchUser.",
        "var vs let is irrelevant to the crash — the issue is error propagation.",
      ],
    },
  ],
};
