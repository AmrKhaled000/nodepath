import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, article, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m7",
  slug: "professional-development-skills",
  title: "Professional Development Skills",
  description:
    "The skills that decide how far your code goes beyond your laptop: maintainable code, honest code reviews, documentation, Git workflows, versioning, publishing, open source, and a grounded approach to system design, database, REST and Node.js interview conversations.",
  phaseId: "phase-3",
  order: 7,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m7",
  difficulty: "advanced",
  quizId: "quiz-p3-m7",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m7-maintainable-code",
    slug: "maintainable-code",
    title: "Writing Maintainable Code",
    description:
      "Readability, coupling and feedback speed: the three forces that decide how expensive your next change will be.",
    order: 1,
    estimatedMinutes: 20,
    tags: ["maintainability", "refactoring", "code-quality", "clean-code"],
    prerequisites: ["p3m1-refactoring", "p3m1-solid", "p3m1-separation-of-concerns"],
    relatedTopics: ["p3m7-code-reviews", "p3m7-technical-documentation", "p3m1-technical-debt", "p3m1-clean-architecture"],
    learningObjectives: [
      "Frame maintainability as the cost of the next change rather than a matter of taste",
      "Spot high-coupling and low-cohesion structures in an existing codebase",
      "Choose between duplication and abstraction based on why the code changes",
      "Use tests and static analysis as the safety net that makes refactoring affordable",
    ],
    simpleExplanation:
      "Maintainable code is code that a person can safely change six months later, including you. It is not about looking clever: it is about clear names, small pieces that each do one job, few hidden connections between modules, and fast tests that tell you immediately when a change broke something else.",
    detailedContent: `
Maintainability is not a property you can judge from one screen of code. It is the **cost of the next change**: how many files you must understand first, how much existing behaviour you might break, and how long you wait to find out whether you broke it. Two identical-looking codebases can differ by 10x in that cost.

Three forces drive it:

- **Readability.** Code is read far more often than it is written. Names that reveal intent (\`calculateOrderTotal\` over \`calc2\`), functions with a single job, and one consistent style lower the mental effort of every future reader, including future you.
- **Coupling.** When changing module A forces you to edit modules B and C too, every change grows. Depend on narrow contracts, a function signature, an interface, a documented behaviour, instead of on internals.
- **Feedback speed.** Without tests every edit is a guess. A fast, reliable suite converts "I think it works" into "I know it works", which is what makes restructuring affordable rather than frightening.

Duplication is not automatically a defect. Two places that change for the *same reason* should share one abstraction; two places that merely look alike may be cheaper to leave duplicated than to bind together prematurely.

Maintainability also means keeping decisions visible: record why a workaround exists, delete dead code instead of leaving it "just in case", and let the structure of the code mirror the structure of the problem, so a new teammate can make a correct small change on day one.
    `,
    howItWorks: `
Maintainability comes from a loop that runs on every change: **understand** (read code and tests to learn current behaviour), **change** (smallest edit that satisfies the requirement), **verify** (type check, lint, tests), then **leave it cleaner** (extract, rename or restructure while behaviour stays fixed).

Tools mechanise the verify step. TypeScript's compiler eliminates whole classes of mistakes before runtime; linters such as ESLint enforce local conventions; formatters remove style from review discussions. The loop only stays cheap while the suite is fast and trustworthy.

Two smells signal the loop is getting expensive: *shotgun surgery*, where one requirement touches many unrelated files, and *long functions with several responsibilities*, where every edit risks an unrelated regression. Both are refactor invitations, not invitations to add more code.
    `,
    codeExamples: [
      {
        title: "Before: intent hidden inside one long handler",
        language: "ts",
        code: `async function handle(req: Request, res: Response) {
  const items = await db.query("SELECT * FROM cart_items WHERE cart_id = ?", [req.params.id]);
  let t = 0;
  for (const i of items) {
    const p = await db.query("SELECT price, stock FROM products WHERE id = ?", [i.product_id]);
    if (p[0].stock > 0) t += p[0].price * i.qty;
  }
  res.json({ total: t });
}`,
        description:
          "Works, but the rule (only in-stock items count) is buried, every loop iteration awaits serially, and the logic cannot be tested without HTTP.",
      },
      {
        title: "After: one rule per function, testable without HTTP",
        language: "ts",
        code: `type Line = { priceCents: number; qty: number; inStock: boolean };

export function orderTotalCents(lines: Line[]): number {
  return lines.filter((l) => l.inStock).reduce((sum, l) => sum + l.priceCents * l.qty, 0);
}

async function cartLines(cartId: string): Promise<Line[]> {
  const rows = await db.findLinesWithStock(cartId);
  return rows.map((r) => ({ priceCents: r.price, qty: r.qty, inStock: r.stock > 0 }));
}

async function handle(req: Request, res: Response) {
  res.json({ total: orderTotalCents(await cartLines(req.params.id)) });
}`,
        description:
          "The business rule is a pure function with no I/O, so it can be unit tested; data access and HTTP are thin, separate shells.",
      },
    ],
    commonMistakes: [
      "Optimising for lines of code instead of for the reader: clever one-liners routinely cost more than the ten lines they replace.",
      "Extracting an abstraction the first time two things look similar, then paying for the wrong generalisation on every later change.",
      "Letting tests drift from reality: a green suite that asserts nothing gives exactly the false confidence that makes refactoring dangerous.",
      "Explaining what the next line does in comments while leaving the why (the constraint, the bug history, the workaround) undocumented.",
    ],
    bestPractices: [
      "Name functions after the business rule they implement, and keep side effects at the edges where they are visible.",
      "Refactor in small steps with the suite green after each step; never mix a behaviour change and a restructure in one commit.",
      "Delete dead code and stale comments rather than preserving them; Git keeps the history.",
      "Write the test first when you are about to change logic you do not fully understand; it documents current behaviour.",
    ],
    realWorldUseCases: [
      "Onboarding: a modular codebase lets a new engineer ship a correct small change in their first week instead of their first month.",
      "Incident response: when the fault sits in code with clear boundaries, the blast radius of the fix is predictable.",
      "Estimation: teams with high coupling learn to quietly double every estimate, which is the real price of unmaintainable code.",
    ],
    resources: [
      docs(
        "Node.js Best Practices (goldbergyoni/nodebestpractices)",
        OFFICIAL.nodeBestPractices,
        "Crowd-sourced, continuously updated catalogue of Node.js coding, error-handling and structure practices.",
      ),
      article(
        "Refactoring, the Martin Fowler site",
        "https://refactoring.com/",
        "refactoring.com",
        "The catalogue of refactoring patterns: small, behaviour-preserving steps with clear motivation and mechanics.",
        { estimatedDuration: "reference" },
      ),
      ytSearch(
        "refactoring legacy code safely with tests",
        "Walkthroughs of extracting functions and modules without changing behaviour.",
        "en",
        "15-30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-refactor-handler",
        title: "Refactor for the next change",
        prompt:
          "Take a 120+ line request handler from one of your projects (or the before example above). Split it so that (1) the business rule is a pure function with no I/O, (2) data access lives in one place, (3) the handler only glues the two together. Keep behaviour identical and list the tests you would add to prove it. Write down which functions you extracted and why you drew the boundaries where you did.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Ask of each block: does it decide something, fetch something, or translate something?",
          "If a block needs req/res to do its job, it is HTTP glue, keep it at the edge.",
        ],
        solution:
          "Model answer outline:\n1. Identify the decision (in-stock lines only, sum price * qty) and extract it as a pure function taking plain data.\n2. Identify the fetch (cart lines plus product stock) and move it behind one repository function returning plain rows.\n3. Leave the handler as: parse input, call repository, call pure function, serialise response.\n4. Tests: unit tests on the pure function covering empty cart, out-of-stock line and mixed quantities; one integration test for the repository query; one HTTP test asserting the JSON shape.\n5. Justification: boundaries were drawn where side effects change (I/O versus no I/O), so the rule can be tested without a database and the query can change without touching the rule.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m7-code-reviews",
    slug: "code-reviews",
    title: "Effective Code Reviews",
    description:
      "How to give and receive review feedback that catches real defects, spreads knowledge, and does not destroy team morale or velocity.",
    order: 2,
    estimatedMinutes: 18,
    tags: ["code-review", "pull-requests", "collaboration", "quality"],
    prerequisites: ["p1m3-git-fundamentals", "p1m3-github-repositories", "p2m7-test-coverage"],
    relatedTopics: ["p3m7-maintainable-code", "p3m7-git-workflows", "p3m7-technical-documentation", "p2m7-test-coverage"],
    learningObjectives: [
      "Review for correctness, risk and clarity in that order, not for personal style",
      "Write feedback that names the problem, its impact and a concrete suggestion",
      "Decide when request-changes is warranted versus a comment or an offline discussion",
      "Structure your own pull requests so reviewers can be effective",
    ],
    simpleExplanation:
      "A code review is a second pair of eyes before changes become permanent. The best reviews ask two questions: can this break and how, and can the next reader understand this? Then they leave feedback that says what is wrong, why it matters, and what could be done instead.",
    detailedContent: `
A review has two jobs that rank above everything else: **finding defects that tests missed** and **spreading understanding** so the team is not dependent on one author. Style is a distant third; automate it with linters so human attention goes where machines cannot.

A useful comment has three parts: the observation, the impact, and a suggestion. Compare:

- "This is wrong, please fix." (no impact, no path forward)
- "This inner loop awaits \`db.get\` per row, so 500 items means 500 sequential round-trips; on staging that added 1.2s to this endpoint. Consider one \`WHERE id = ANY(...)\` query, or \`Promise.all\` if the driver cannot batch."

The second version is checkable: the author can confirm the numbers, and either accept or argue against the suggestion. Disagreement with facts is a good outcome; unexplained taste wars are not.

Scope the effort to the risk. A payments change deserves line-by-line scrutiny; a docs typo does not. Read the diff, run it if that is cheap, then look specifically for boundary conditions, error paths, concurrency, unvalidated input, N+1 queries, and anything the tests do not cover.

Reviews also fail socially. Nitpicks delivered as demands train people to skim approvals. Reserve "request changes" for real defects, use comments for preferences, and take prolonged debates to a call where you record the decision. As the author, keep pull requests small: a 1,200-line diff gets a rubber stamp in practice, no matter what the policy says.
    `,
    howItWorks: `
On GitHub the mechanics are: the author pushes a branch and opens a pull request; reviewers are requested (manually, by CODEOWNERS, or by team assignment); each reviewer leaves line comments and submits a *review* with one of three decisions, **comment**, **approve**, or **request changes**. Repositories can protect the default branch so a fixed number of approvals and passing status checks are required before merging.

Small, focused commits make review tractable: reviewers work commit by commit rather than against one wall of diff. Suggestions can be applied directly in the browser, and unresolved conversations stay attached to the code, which is what lets a team treat review as the record of *why* the code looks like it does rather than a chat that disappears.
    `,
    codeExamples: [
      {
        title: "Anatomy of a reviewable pull request",
        language: "text",
        code: `Title:  fix(orders): avoid double charge when webhook is retried

Body:
- Problem: Stripe retries delivery for up to 3 days; our handler charged again on retry #2.
- Cause: no idempotency check on event.id.
- Fix: store processed event ids (unique index) before charging, return 200 on hit.
- Risk: processed_events grows; added index and a note in docs/OPERATIONS.md.
- Tested: integration test replaying the same payload twice produces one charge.

Files changed: 4  (+63 / -11)   CI: green   Coverage: +2%`,
        description:
          "Problem, cause, fix, risk, test: a reviewer can judge correctness before opening a single diff hunk. Contrast with a description that only says fixed bug.",
      },
      {
        title: "From vague to actionable feedback",
        language: "text",
        code: `Weak:   "This is ugly. Why not use a class?"

Strong: "handlePayment() both validates the card and writes two tables.
        If the second write fails, we have already marked it paid.
        Suggest: validate, write the ledger entry, then mark paid in one
        transaction so a partial failure rolls back. If the split is
        intentional, a comment explaining the ordering would help."`,
        description:
          "Same concern, different outcome: the strong version names the failure mode, proposes a fix, and invites correction if context is missing.",
      },
    ],
    commonMistakes: [
      "Reviewing style that a formatter or linter could enforce, so human attention is spent on trivia.",
      "Approving a large diff out of fatigue, silently admitting the change was unreviewable.",
      "Commenting on the person (you always...) instead of the code, which makes authors defensive.",
      "Requesting changes for a preference with no defect behind it, which blocks work and erodes trust.",
    ],
    bestPractices: [
      "Review in risk order: correctness first, then security and data integrity, then clarity, then style last.",
      "Say why, cite evidence (a failing case, a measurement, a link), and offer an alternative or a question.",
      "Keep pull requests to roughly 400 changed lines and split unrelated work; reviewers respond to size.",
      "As an author, self-review the diff before requesting review and mark drafts while work is in progress.",
    ],
    realWorldUseCases: [
      "Regression prevention: reviews routinely catch schema mismatches and missing error handling that unit tests never exercise.",
      "Knowledge distribution: reviewing a teammate's module means they can take a holiday without the system stopping.",
      "Standards diffusion: agreed conventions propagate through review comments faster than through documents nobody reads.",
    ],
    resources: [
      docs(
        "GitHub: Pull request reviews",
        "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews",
        "Official description of review decisions (comment, approve, request changes), required reviews and CODEOWNERS.",
      ),
      article(
        "Google Engineering Practices: Code Review Developer Guide",
        "https://google.github.io/review/reviews.html",
        "google.github.io",
        "Google's review standards: speed expectations, how to write comments, and how to handle disagreement.",
        { estimatedDuration: "20 min" },
      ),
      ytSearch(
        "how to review a pull request like a senior engineer",
        "Walkthroughs of reading diffs, testing edge cases and phrasing feedback.",
        "en",
        "10-25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-review-diff",
        title: "Review a hostile diff",
        prompt: `
A teammate sends you this diff for review:

    - const price = product.price;
    + const price = product.price * (1 - discount.pct);
    + await db.update("orders", { total: price }, { where: { id: order.id } });
        await chargeCustomer(order.customerId, price);

Their pull request description says only: "apply discount".

Write three review comments ordered by severity. For each, state the observation, the impact, and a concrete suggestion.
        `,
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "What happens if discount.pct is undefined, negative, or taken from an untrusted source?",
          "Is the order total persisted before or after the charge, and what happens if the charge fails?",
        ],
        solution:
          "Model answer outline:\n1. (Blocker) Missing validation: discount comes from the request; pct = 5 or 1.5 silently gives money away or overcharges. Suggest validating server-side against a whitelist of known discount codes with a maximum of 1.\n2. (Blocker) Order of operations: the total is written before the charge succeeds, so a failed charge leaves a paid-looking order. Suggest one transaction, or record pending then confirm on the provider webhook.\n3. (Major) No test and no rounding rule: floating point cents drift. Suggest integer cents plus tests covering 0%, 100% and a rounding boundary.\nAlso note the missing PR detail: which table and field changed, and whether existing rows need a migration.",
        solutionLanguage: "text",
      },
      {
        id: "ex-p3m7-review-one-line",
        title: "Rewrite your last review comment",
        prompt:
          "Find the last review comment you wrote (or invent one in the style of 'this is wrong, fix it'). Rewrite it with the three-part structure: observation, impact, suggestion. Keep it under 80 words.",
        difficulty: "advanced",
        estimatedMinutes: 10,
        hints: ["Impact should be concrete: an error case, a number, a user-visible effect."],
        solution:
          "Any rewrite of the form: Observation: X at file:line does Y. Impact: this means Z for the user or the system, ideally with a repro or a number. Suggestion: try A, or tell me if context I am missing makes this intentional. The grade is on structure, not on picking one right change.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-chat-app"],
  },
  {
    ...shared,
    id: "p3m7-technical-documentation",
    slug: "technical-documentation",
    title: "Technical Documentation",
    description:
      "Documentation as engineering: deciding what to write, for whom, where it lives, and how to keep it true.",
    order: 3,
    estimatedMinutes: 17,
    tags: ["documentation", "adr", "knowledge-sharing", "writing"],
    prerequisites: ["p1m3-readme-files", "p3m1-separation-of-concerns", "p3m7-maintainable-code"],
    relatedTopics: ["p3m7-readme-presentation", "p3m7-code-reviews", "p3m1-technical-debt"],
    learningObjectives: [
      "Classify documentation by reader and purpose (tutorial, how-to, reference, explanation)",
      "Write an Architecture Decision Record that survives the departure of its author",
      "Keep documentation verifiable by tying it to code, tests and CI",
      "Decide what not to document",
    ],
    simpleExplanation:
      "Good documentation answers a real question a real person is asking right now: how do I run this, what does this endpoint return, why did we choose Postgres? Writing the right kind of document for the right reader beats writing more documents, and a document nobody verifies is worse than none, because people believe it.",
    detailedContent: `
Documentation fails in two opposite ways: it does not exist, or it exists and lies. The second is worse, because a stale document costs the reader more time than the missing one would have.

A practical framework is the **Diátaxis** split: four document types, four different jobs.

- **Tutorial** — a lesson for a beginner with a guaranteed outcome: "build your first worker in 15 minutes".
- **How-to** — a recipe for someone who already knows the system: "rotate API keys", "add a database index".
- **Reference** — the accurate, boring description of the machinery: endpoints, config keys, function signatures.
- **Explanation** — context and trade-offs: "why orders are eventually consistent".

Mixing these is what makes docs useless: a reference page that starts lecturing about history, or a tutorial full of theory. Keep each type in its own file and let readers choose.

For decisions, use an **Architecture Decision Record**: one short file with context, the options considered, the decision, and its consequences. ADRs are cheap to write and priceless six months later, when the reader's instinct is "why is it like this, who approved this?"

Documentation stays true when it is close to the code (in the repository, reviewed in the same pull request that changes behaviour) and when links are checked by CI. Document the *why*, the sharp edges and the invariants; leave the *what* to types, names and tests, which cannot drift.
    `,
    howItWorks: `
A documentation set works like a map with layers. The entry layer (README) answers what this is and how to start. The operational layer (how-to guides, runbooks) is organised by task, so you find it by the goal you have. The specification layer (reference) is organised by the system's structure, one page per endpoint or module, ideally generated from code or an OpenAPI document so drift is prevented mechanically. The reasoning layer (ADRs, explanations) is organised by time: append-only decision files with dates.

In a repository these live as Markdown next to the code, which means they are versioned, branchable and reviewed. A pull request that changes an endpoint without updating its reference page should be visible to reviewers, and that single habit is worth more than any documentation portal.
    `,
    codeExamples: [
      {
        title: "Architecture Decision Record (ADR)",
        language: "markdown",
        code: `# ADR-007: Use a queue for image processing instead of inline work

Date: 2026-04-12   Status: Accepted

## Context
Upload requests take 4-9s because resizing runs inside the HTTP handler.
p95 latency budget is 800ms. Workers already exist for email.

## Options
1. Inline with async fire-and-forget: fast to build, lost on crash.
2. Queue (BullMQ + Redis): retries, visibility, existing infrastructure.
3. Separate upload service: cleanest, but operational cost now.

## Decision
Option 2. Upload returns 202 with a job id; clients poll GET /uploads/:id.

## Consequences
+ Retries and dead-letter handling for free; handler stays under 100ms.
- Images are not immediately available; UI must show a pending state.
- Redis becomes required infrastructure for the upload path.`,
        description:
          "Context, options, decision, consequences. The value is in the options that were *rejected*; that is what the future reader cannot reconstruct from the code.",
      },
    ],
    commonMistakes: [
      "Writing reference documentation by hand when it can be generated from types or an OpenAPI spec; it will drift within a quarter.",
      "Documenting every function for completeness, which buries the two pages a new user actually needs.",
      "Publishing docs outside the repository where they cannot be reviewed alongside the change they describe.",
      "Recording the decision but not the consequences, so nobody knows what trade-off they are living with.",
    ],
    bestPractices: [
      "Write documentation in the same pull request as the behaviour change; reviewers should see both.",
      "Prefer a short page that is right over a long page that is 80% right; readers cannot tell which 20% is stale.",
      "Add a docs check to CI: broken links, missing pages referenced from code, or a spec generated from source.",
      "Start every doc with one sentence stating who it is for and what they will be able to do after reading it.",
    ],
    realWorldUseCases: [
      "Runbooks turn 2am incidents into a checklist instead of a Slack archaeology session.",
      "ADRs prevent re-litigating settled arguments every time someone new joins the project.",
      "A generated API reference keeps a client team unblocked when the server team ships a change.",
    ],
    resources: [
      article(
        "The Diátaxis framework",
        "https://diataxis.fr/",
        "diataxis.fr",
        "The tutorial / how-to / reference / explanation model for structuring technical documentation.",
        { estimatedDuration: "25 min" },
      ),
      article(
        "Architecture Decision Records",
        "https://adr.github.io/",
        "adr.github.io",
        "The ADR idea, its naming conventions and how teams record decisions as versioned files.",
        { estimatedDuration: "10 min" },
      ),
      article(
        "Write the Docs: documentation guide",
        "https://www.writethedocs.org/guide/",
        "writethedocs.org",
        "Practical guidance on writing, organising and maintaining software documentation.",
        { estimatedDuration: "20 min" },
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-adr",
        title: "Record a real decision",
        prompt:
          "Pick one technical decision from a project you worked on (database choice, cache strategy, auth mechanism, monolith versus services). Write a one-page ADR following the template in this lesson. You must name at least two alternatives you rejected and the consequence you are living with today.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "If you cannot name a real consequence, the ADR is marketing; dig for the downside you accepted.",
          "Keep it under one page; the reader is mid-task.",
        ],
        solution:
          "Model answer outline: a numbered title with a status; a Context paragraph stating the concrete pressure, numbers help (latency, team size, deadline); two or more Options with one line each including cost; a Decision naming the option and the deciding factor; Consequences split into plus and minus where at least one minus is a real ongoing cost, for example Redis is now on the critical path, or we accepted manual migration steps. A weak ADR lists only benefits or omits alternatives.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-capstone"],
  },
  {
    ...shared,
    id: "p3m7-git-workflows",
    slug: "git-workflows",
    title: "Git Workflows for Teams",
    description:
      "Trunk-based development, GitHub flow, Gitflow, rebasing versus merging, protected branches and recoverable history on shared repositories.",
    order: 4,
    estimatedMinutes: 22,
    tags: ["git", "branching", "workflow", "collaboration"],
    prerequisites: ["p1m3-git-fundamentals", "p1m3-github-repositories", "p3m6-cicd-pipelines"],
    relatedTopics: ["p3m7-code-reviews", "p3m7-semantic-versioning-advanced", "p3m6-github-actions"],
    learningObjectives: [
      "Choose between trunk-based, GitHub flow and Gitflow based on release cadence",
      "Explain exactly when rebasing is safe and when it rewrites shared history",
      "Use branch protection and pull requests to make the default branch unbreakable",
      "Recover from the common disasters: bad merge, lost commit, conflicted rebase",
    ],
    simpleExplanation:
      "A Git workflow is just the team's agreement about where work happens and how it reaches the main branch. The safest simple rule: everyone works on short-lived branches, everything lands through a reviewed pull request, and the main branch always builds and deploys. Rewriting history is fine on your own branch and dangerous on one other people have already pulled.",
    detailedContent: `
Every workflow trades **release cadence** against **review depth** and **coordination overhead**. There is no universal best one.

- **Trunk-based development.** Everyone commits to main behind short-lived feature flags; branches live hours, not weeks. Fast integration and continuous delivery, but it demands strong tests, good flags and small changes. It works when the deployment pipeline is reliable.
- **GitHub flow.** Branch per change, pull request, review, merge. The simplest model that still gets review, and the default choice for most product teams.
- **Gitflow.** Named branches for \`develop\`, \`release\` and \`hotfix\` alongside \`main\`. It fits software with scheduled, versioned releases (desktop apps, SDKs, installed products) and adds ceremony that web teams rarely need.

The sharpest day-to-day rule is about history: **rebase your own unshared branch freely; never rewrite a branch other people have pulled**. Replaying your commits onto the latest main gives a linear, reviewable history and a clean merge. Running \`git push --force\` on a shared branch silently discards teammates' commits. If you must rewrite a branch someone else may hold, use \`--force-with-lease\`, which refuses to overwrite work you have not seen.

Merge commits are not a crime either: \`git merge --no-ff\` preserves the fact that a feature existed as a unit, which is exactly what you want for later archaeology.

Protect the default branch: require pull requests, required approvals and passing status checks. Then the strongest guarantees in your workflow come from platform settings rather than from people remembering the rules.
    `,
    howItWorks: `
A pull-request workflow runs like this: \`git switch -c feature/x\` creates a branch pointing at the current commit, and commits advance only that pointer. Opening a pull request asks the host to diff the branch tip against the target branch. CI runs on the merge result, reviewers inspect it, and merging updates the target branch (fast-forward, merge commit, or squash, a repository setting).

Under the hood a rebase detaches your commits, re-applies them one by one onto a new base, and writes *new* commit hashes carrying the same changes. That is why it produces a clean line and why it is destructive: anyone holding the old hashes now has a divergent history. A merge, by contrast, creates a single new commit with two parents and never alters existing ones, which is why it is safe on shared branches and why \`git reflog\` can rescue you after almost any mistake.
    `,
    codeExamples: [
      {
        title: "Safe daily loop",
        language: "bash",
        code: `git switch main
git pull --ff-only origin main
git switch -c fix/invoice-rounding

# ...edit, then verify locally...
npm test

git add -p
git commit -m "fix(billing): round invoice totals to integer cents"
git push -u origin fix/invoice-rounding

# after review is approved:
git fetch origin
git rebase origin/main        # own branch only
git push --force-with-lease   # own branch only
# then merge the pull request on GitHub`,
        description:
          "Short-lived branch, atomic commits, rebase before merge, force-with-lease instead of force. Nothing here touches a branch anyone else has pulled.",
      },
      {
        title: "Recovering from a bad rebase",
        language: "bash",
        code: `git status                      # mid-conflict state
git rebase --abort              # undo the rebase, back to where you were

git log --oneline -5            # after a merge you regret
git revert -m 1 <merge-sha>     # safe: adds an undo commit, keeps history

git reflog                      # "where was I 30 minutes ago?"
git reset --hard HEAD@{7}       # move the branch back (only if unpushed)`,
        description:
          "Revert for shared history, reset and reflog for your own. Almost nothing in Git is truly lost while the commits are still in the reflog.",
      },
    ],
    commonMistakes: [
      "Force-pushing the default branch after a rebase and destroying work that had already been merged or pulled.",
      "Letting feature branches live for months, so every merge becomes a conflict marathon nobody wants to review.",
      "Committing secrets or giant generated files, then trying to fix them with a new commit instead of rewriting history.",
      "Choosing Gitflow because it sounds professional, when the team ships to production several times a day.",
    ],
    bestPractices: [
      "Protect the default branch: pull requests, required approvals, passing checks, no direct pushes.",
      "Keep commits atomic and messages conventional (see the Conventional Commits spec) so history is readable and changelogs can be generated.",
      "Rebase only unshared branches, and use --force-with-lease rather than bare --force on anything a teammate might hold.",
      "Delete branches after merge and keep the pull request as the permanent record of the discussion.",
    ],
    realWorldUseCases: [
      "Release trains: Gitflow release branches give QA a stable target while development continues.",
      "Hotfixes: trunk-based teams patch main in one small reviewed commit and deploy straight away.",
      "Audits: protected branches plus required reviews prove who approved a change to compliance teams.",
    ],
    resources: [
      docs(
        "Pro Git: Branching and Rebasing (official Git book)",
        "https://git-scm.com/book/en/v2/Git-Branching-Rebasing",
        "The canonical explanation of rebasing, including the rule about never rebasing published work.",
      ),
      docs(
        "GitHub: GitHub flow",
        "https://docs.github.com/en/get-started/using-github/github-flow",
        "GitHub's own lightweight branch-based workflow: branch, pull request, review, merge, delete.",
      ),
      docs(
        "Conventional Commits 1.0.0",
        "https://www.conventionalcommits.org/en/v1.0.0/",
        "Commit message convention that maps directly to semver bumps and generated changelogs.",
      ),
      article(
        "Atlassian: Gitflow workflow",
        "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow",
        "atlassian.com",
        "The original Gitflow model with develop, release and hotfix branches, and when it earns its ceremony.",
        { estimatedDuration: "15 min" },
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-history-surgery",
        title: "Plan the history cleanup",
        prompt: `
Your team has a branch called feature/billing with 23 messy commits (wip, fix, fix2, asdf) that was branched off main five weeks ago. Main has moved on with 40 commits, and two teammates have each checked out the branch.

Describe step by step how you get this merged safely. State explicitly which commands you would run, which you would refuse to run, and what you tell your teammates to do first.
        `,
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Who has the branch checked out changes what is safe.",
          "Squashing and rebasing are both fine on unshared work; the danger is sharing first.",
        ],
        solution:
          "Model answer outline:\n1. Tell both teammates to stop and push or back up their local state; agree on one owner of the branch.\n2. On the owning branch: git fetch origin, then git rebase origin/main to replay the commits onto current main, resolving conflicts once.\n3. Optionally squash the 23 commits into a few meaningful ones with an interactive rebase; still unshared, so safe.\n4. Push with git push --force-with-lease origin feature/billing; never bare --force, and never touch main.\n5. Refresh the pull request; CI runs on the merge result; review; merge with the team's chosen strategy; delete the branch.\nRefuse: git push --force origin main, rewriting history others already built on, or merging without CI. Alternative if teammates must keep working: merge main into the feature branch instead of rebasing, non-destructive but with messier history.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-job-processing"],
  },
  {
    ...shared,
    id: "p3m7-semantic-versioning-advanced",
    slug: "semantic-versioning-advanced",
    title: "Semantic Versioning in Practice",
    description:
      "Reading and applying SemVer honestly: what counts as breaking, ranges and pre-releases, and the limits of the scheme.",
    order: 5,
    estimatedMinutes: 16,
    tags: ["semver", "versioning", "releases", "api-stability"],
    prerequisites: ["p2m1-npm-package-management", "p3m2-backward-compatibility"],
    relatedTopics: ["p3m7-package-publishing", "p3m7-git-workflows", "p3m2-backward-compatibility"],
    learningObjectives: [
      "Classify a change as major, minor or patch using observable caller impact",
      "Explain how caret, tilde and pre-release versions constrain installs",
      "Use version zero and pre-release tags to signal instability deliberately",
      "Identify changes that are breaking even when the signature looks unchanged",
    ],
    simpleExplanation:
      "Semantic versioning is a promise in three numbers: major.minor.patch. If nothing about using your package changed, bump patch. If you added something backwards-compatible, bump minor. If you removed or changed something callers depend on, bump major. Anyone installing with a caret range then gets updates automatically, but only up to the next major version.",
    detailedContent: `
SemVer only works if you define *breaking* from the caller's perspective, not from yours. **Breaking** means code that worked against the old version can fail against the new one: a removed export, a renamed parameter, a changed return shape, stricter validation that now rejects an input which used to succeed, a changed default, or a raised minimum runtime version.

Several changes are breaking even though nothing visible moved:

- Changing the *type* of a returned field (number to string), or adding a required field to an input.
- Changing behaviour under an input you consider invalid but never rejected.
- Tightening rate limits or changing error codes that callers branch on.
- Removing a transitive dependency that consumers imported directly, a de facto breaking change you never advertised.

The converse matters too: a bug fix that *changes observable behaviour* is still a patch bump if the previous behaviour was the defect. Document it in the changelog regardless, because someone may have depended on the bug.

Version \`0.y.z\` means anything may change at any time. npm caret ranges (\`^1.2.3\`) allow updates below \`2.0.0\`, tildes (\`~1.2.3\`) allow only patch-level updates, and pre-release labels (\`2.0.0-rc.1\`) are only picked up by consumers who explicitly ask for them.

Honest limits: SemVer cannot detect breaking changes for you. Tests, changelogs and deprecation windows are what make the numbers trustworthy; the number is a claim and your release discipline is the evidence.
    `,
    howItWorks: `
The registry stores the exact version string, and your dependency range is evaluated against all published versions when you install. For \`^1.2.3\` the resolver accepts \`>=1.2.3 <2.0.0\`; for \`~1.2.3\` it accepts \`>=1.2.3 <1.3.0\`. Exact pins accept nothing else.

At publish time the version must be unique forever: npm rejects a name and version pair that already exists, even if the old version was unpublished. That immutability is what makes ranges safe, because \`1.4.0\` will always mean the same bytes.

Tooling turns convention into automation. With Conventional Commits, \`feat:\` implies a minor bump, \`fix:\` a patch, and a \`BREAKING CHANGE\` footer a major, so a release script can derive the next version from commit history instead of from someone's memory. Pre-release versions use a hyphen (\`2.0.0-beta.2\`) and, by SemVer rules, sort *below* the eventual \`2.0.0\` release.
    `,
    codeExamples: [
      {
        title: "Classifying real changes",
        language: "text",
        code: `Current version: 3.4.1   (consumers install with ^3.4.1)

1. Fix off-by-one in pagination cursor              -> 3.4.2  (patch)
2. Add optional timeoutMs option                    -> 3.5.0  (minor)
3. Rename createUser(opts) to createUser(input)     -> 4.0.0  (major)
4. Default pageSize changes from 20 to 50           -> 4.0.0  (breaking
   default change, even though nothing was removed)
5. Reject emails without a TLD (previously accepted)-> 4.0.0
6. Add deprecated alias createUserV2                -> 3.6.0  (minor);
   remove that alias in a later release             -> 4.0.0`,
        description:
          "Cases 4 and 5 are the ones people get wrong: no API surface changed, yet working callers can now fail.",
      },
      {
        title: "Range behaviour",
        language: "json",
        code: `{
  "dependencies": {
    "semver-pkg": "^3.4.1",
    "pinned-pkg": "3.4.1",
    "conservative-pkg": "~3.4.1"
  },
  "devDependencies": {
    "beta-tool": "4.0.0-rc.1"
  }
}
// ^3.4.1 installs 3.4.1 ... 3.x.x but never 4.0.0
// 3.4.1    installs exactly 3.4.1
// ~3.4.1   installs 3.4.1 ... 3.4.x
// 4.0.0-rc.1 matches only when a pre-release is asked for explicitly`,
        description: "The same four ranges and what a fresh install resolves to after 4.0.0 is published.",
      },
    ],
    commonMistakes: [
      "Shipping a breaking change as a minor version because most people will not notice; the ones who do notice lose trust permanently.",
      "Bumping the major version for an internal refactor with no observable behaviour change, which trains consumers to ignore majors.",
      "Publishing 1.0.0 too early while the API is still moving, then breaking it repeatedly in minors.",
      "Assuming SemVer alone protects consumers: ranges auto-install whatever you publish within the allowed window.",
    ],
    bestPractices: [
      "Write an upgrade note for every major: what broke, why, and the exact before and after code.",
      "Deprecate first: mark an API as deprecated in a minor release, remove it in the next major.",
      "Automate version bumps from commit messages so the number cannot disagree with the history.",
      "Keep a CHANGELOG with headings per version; it is the document consumers actually read.",
    ],
    realWorldUseCases: [
      "A library at 0.x can iterate fast and signal instability honestly before committing to a stable contract.",
      "Enterprise consumers pin exact versions and upgrade deliberately; open source defaults to caret ranges.",
      "A breaking security fix requires a major bump and a coordinated migration note across dependent teams.",
    ],
    resources: [
      docs("Semantic Versioning 2.0.0", "https://semver.org/", "The specification itself: the three rules, pre-release and build metadata, and authorship notes."),
      docs(
        "npm: npm publish",
        "https://docs.npmjs.com/cli/v10/commands/npm-publish",
        "How versions are published, why a name and version pair can never be reused, and dist-tags.",
      ),
      docs(
        "Conventional Commits 1.0.0",
        "https://www.conventionalcommits.org/en/v1.0.0/",
        "Commit types that tools map to major, minor and patch bumps.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-bump-decision",
        title: "Decide the next version",
        prompt: `
Your package is at 2.3.7. This release contains:
(a) a fix for a crash when the config file is empty;
(b) a new optional "retry" option;
(c) fetchOrder now returns null for missing orders instead of throwing;
(d) an internal file reorganisation with no behaviour change.

Decide the next version, write the changelog entry a consumer would need, and explain why (c) does not get a minor bump.
        `,
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "Who catches the exception today, and will their catch block still run?",
          "One release takes the highest bump its parts require.",
        ],
        solution:
          "Model answer outline: next version 3.0.0, because (c) is breaking; callers relying on try/catch, or on the throw as control flow, now get null and may crash or misbehave. (a) is a patch, (b) a minor, (d) not user-visible, and a single release takes the largest required bump. Changelog: BREAKING: fetchOrder resolves to null for unknown ids instead of throwing NotFound, replace try/catch with a null check (include a migration snippet); Added: optional retry option, default off; Fixed: crash on empty config file; Internal: no behaviour change. Bonus credit for shipping a deprecation release that logs a warning first.",
        solutionLanguage: "text",
      },
    ],
    projectIds: [],
  },
  {
    ...shared,
    id: "p3m7-package-publishing",
    slug: "package-publishing",
    title: "Publishing Packages to npm",
    description:
      "From local module to registry: package metadata, files and exports, dry runs, two-factor publishing and what you can never undo.",
    order: 6,
    estimatedMinutes: 21,
    tags: ["npm", "packaging", "publishing", "modules"],
    prerequisites: ["p2m1-npm-package-management", "p2m1-reusable-modules", "p3m7-semantic-versioning-advanced"],
    relatedTopics: ["p3m7-semantic-versioning-advanced", "p3m7-open-source-contribution", "p2m1-reusable-modules"],
    learningObjectives: [
      "Configure name, files, exports and engines so the tarball contains exactly what consumers need",
      "Predict tarball contents before publishing using npm pack --dry-run",
      "Publish safely with version checks, two-factor auth, dist-tags and dry runs",
      "Know which publish mistakes are permanent and how to deprecate instead of unpublish",
    ],
    simpleExplanation:
      "Publishing means uploading a tarball of files plus metadata to a public registry where anyone can install it. The important part is deciding what goes in the tarball and what your package promises, and knowing that published versions are effectively permanent, so you verify with a dry run before the real thing.",
    detailedContent: `
A package is a folder with a \`package.json\`. Two fields are mandatory for publishing: **name** and **version**. Everything else shapes how usable it is.

**What ships.** By default npm packs nearly everything that is not ignored. Use a \`files\` allowlist so tests, screenshots and local scratch files never leave your machine; \`package.json\`, README, LICENSE and your entry file are always included regardless. Always inspect the result with \`npm pack --dry-run\`, which prints the exact file list.

**How it is imported.** The \`exports\` field defines the public surface and hides internal paths. That encapsulation is the difference between a package you can refactor and one where every file path is accidental API. Pair it with \`types\` so TypeScript consumers get declarations, and set \`engines\` if you require a minimum Node version.

**Safety rails.** Set \`"private": true\` in every app repo so \`npm publish\` fails loudly instead of silently uploading something. Scope names (\`@yourname/pkg\`) avoid collisions; scoped packages need \`--access public\` the first time. Enable two-factor authentication, because a leaked token with publish rights means anyone can ship code that installs into your users' CI.

**Irreversibility.** A published name and version can never be reused, even after unpublish, and unpublish is restricted by registry policy. The professional move when a bad release escapes is to publish a fixed patch and **deprecate** the broken version with a message, not to pretend it never existed.
    `,
    howItWorks: `
When you run \`npm publish\`, npm builds a tarball (the same logic as \`npm pack\`), runs the \`prepublishOnly\` and \`prepare\` lifecycle scripts, uploads it, and updates the dist-tag (default \`latest\`) to point at the new version. Consumers resolve a range against published versions, download the tarball, verify its integrity hash against the lockfile, and extract it into \`node_modules\`.

The \`main\` field is the classic single entry point; \`exports\` is the modern map that supports conditional resolution (import versus require, node versus browser) and *blocks* any path you did not list. Types resolve through \`types\` so editors jump to declarations instead of source.

From CI, trusted publishing with OIDC lets a workflow publish without a long-lived token, and \`npm publish --provenance\` links the tarball back to the exact workflow run that built it.
    `,
    codeExamples: [
      {
        title: "Package metadata that publishes well",
        language: "json",
        code: `{
  "name": "@yourname/http-retry",
  "version": "1.2.0",
  "description": "Retry HTTP requests with exponential backoff",
  "license": "MIT",
  "type": "module",
  "files": ["dist", "README.md", "LICENSE"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepublishOnly": "npm run build && npm test"
  }
}`,
        description:
          "Allowlisted files, one public entry point with types, an engines floor, and a prepublishOnly hook that refuses to publish untested code.",
      },
      {
        title: "Verify before you publish",
        language: "bash",
        code: `npm pack --dry-run          # exact tarball contents, nothing uploaded
npm publish --dry-run       # full publish simulation, nothing uploaded

npm version minor           # bump package.json and create a git tag
npm publish --access public --tag next   # publish under the "next" tag

npm dist-tag add @yourname/http-retry@1.2.0 latest   # promote deliberately
npm deprecate @yourname/http-retry@1.1.0 "crashes on empty config; use 1.2.0"`,
        description:
          "Dry-run first, publish under a non-default tag, then promote. Deprecation warns every installer without hiding history.",
      },
    ],
    commonMistakes: [
      "Publishing the whole repository (secrets, screenshots, fixtures) because there was no files allowlist.",
      "Running npm publish from the wrong directory or with the wrong registry configured in .npmrc.",
      "Using a long-lived automation token in CI instead of trusted publishing or short-lived credentials.",
      "Unpublishing a broken release instead of shipping a fix; consumers' lockfiles still reference it and installs start failing.",
    ],
    bestPractices: [
      "Add a prepublishOnly script that builds and tests, so a broken artifact cannot be produced from a clean checkout.",
      "Publish a candidate with --tag next, install it in a scratch project, then promote it to latest.",
      "Enable 2FA for publishing and store the recovery codes; treat publish rights like production database access.",
      "Tag every release in Git (npm version does this) so source and registry can always be matched.",
    ],
    realWorldUseCases: [
      "Internal tooling: a small CLI shared across teams removes copy-pasted scripts and version drift.",
      "Design systems: publishing component packages lets several frontends consume one source of truth.",
      "Libraries with consumers: dist-tags support staged rollouts the same way canary deploys do.",
    ],
    resources: [
      docs(
        "npm: npm publish",
        "https://docs.npmjs.com/cli/v10/commands/npm-publish",
        "Publish mechanics: files included, dry-run, dist-tags, OTP and provenance.",
      ),
      docs(
        "npm: package.json specifics",
        "https://docs.npmjs.com/cli/v10/configuring-npm/package-json",
        "Field-by-field reference for name, files, exports, engines, private and publishConfig.",
      ),
      docs("npm documentation home", OFFICIAL.npmDocs, "Guides on scopes, access levels, tokens, 2FA and deprecating packages."),
      ytSearch(
        "publishing a scoped npm package walkthrough",
        "End-to-end video of preparing, dry-running and publishing a scoped package.",
        "en",
        "10-20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-publish-checklist",
        title: "Publish checklist for a scoped package",
        prompt: `
You are about to publish @yourteam/rate-limiter for the first time, from a repository that also contains staging config and a .env file.

Produce the ordered checklist you would follow, including the exact commands to inspect what ships, what you configure before publishing, and what you do after a broken 1.0.0 is discovered in production.
        `,
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "npm pack --dry-run tells you everything about the tarball.",
          "What happens to lockfiles if you remove a published version?",
        ],
        solution:
          "Model answer outline:\n1. Pre: name and version valid, license set, files allowlist (dist, README, LICENSE), exports and types wired, this package not marked private, .env excluded and .npmignore reviewed, git tag created.\n2. Verify: npm pack --dry-run confirms no .env or staging config; install the tarball in a scratch directory and run a smoke test.\n3. Auth: 2FA enabled; publish with --access public for the first scoped publish, or from CI via trusted publishing.\n4. Publish: npm publish --access public --tag next, test in a consumer project, then npm dist-tag add to move it to latest.\n5. After a bad 1.0.0: do not unpublish, it breaks lockfiles. Publish 1.0.1 with the fix, run npm deprecate on 1.0.0 with a clear message, and post a migration note.",
        solutionLanguage: "text",
      },
    ],
    projectIds: [],
  },
  {
    ...shared,
    id: "p3m7-open-source-contribution",
    slug: "open-source-contribution",
    title: "Contributing to Open Source",
    description:
      "Finding good first issues, understanding contribution conventions, shipping a pull request maintainers will actually merge, and handling review.",
    order: 7,
    estimatedMinutes: 18,
    tags: ["open-source", "community", "pull-requests", "collaboration"],
    prerequisites: ["p1m3-github-repositories", "p3m7-git-workflows", "p3m7-code-reviews"],
    relatedTopics: ["p3m7-git-workflows", "p3m7-code-reviews", "p3m7-technical-documentation"],
    learningObjectives: [
      "Read a repository's contribution materials and follow its conventions exactly",
      "Choose an issue scoped so a first pull request can realistically land",
      "Write a pull request body that answers a maintainer's questions before they ask",
      "Respond to review without taking it personally and iterate to merge",
    ],
    simpleExplanation:
      "Open source contribution is normal collaborative software development in public: you find a problem in someone else's project, discuss or claim it, make the change on a branch, and open a pull request. Most projects publish exactly how they want to be helped, and reading that page first is the single biggest predictor of whether your contribution gets merged.",
    detailedContent: `
The best first contributions are **small, complete and verifiable**: a fixed typo in code comments is fine, but a bug fix with a test, or a documentation page that unblocks a real user, earns far more respect for the same effort.

Start by reading the project's \`CONTRIBUTING\` file, \`README\`, issue templates and recent pull requests. This tells you the conventions that are not written anywhere else: branch naming, whether they want tests, their style rules, and how quickly they respond. Comment on the issue before you start large work, because maintainers often have a preferred approach, and building for two weeks in silence is how contributions get politely closed.

Before submitting:

1. Reproduce the bug or state the docs gap in the issue.
2. Branch from the latest default branch, make a focused change, add or update tests.
3. Run the project's own checks locally (lint, type check, test) so CI is not your first feedback.
4. Open a pull request that links the issue, explains the *why*, and shows before and after behaviour.

Review is where contributions live or die. Maintainers are volunteers protecting a codebase they will have to live with; a comment like "please split this into two commits" is a request, not a verdict. Answer every point, push changes, and re-request the review. If a contribution stalls, one polite follow-up after a reasonable wait is normal, then let it go and pick another issue. The habit of shipping small, reviewed changes in public is itself the skill that other people notice.
    `,
    howItWorks: `
The mechanics are Git plus a forge: you fork the repository (a copy under your account), clone it, create a branch, and push it to *your* fork. Opening a pull request proposes merging your fork's branch into the upstream repository. Because the branch lives on your fork, you can keep pushing to it as the maintainer reviews.

Upstream projects usually gate merges with checks: a status list (tests, lint, build, coverage) that must pass, one or more approving reviews, and often a signed-commit or DCO requirement. \`CODEOWNERS\` routes files to the right reviewers automatically. Some projects run bots that label issues, request changes or warn about inactivity, and understanding these signals saves you from arguing with automation.

Once merged, your commit becomes part of the project's history with you as author, and the issue closes automatically if you used a closing keyword such as \`Closes #123\`.
    `,
    codeExamples: [
      {
        title: "From fork to pull request",
        language: "bash",
        code: `# 1. Fork on github.com, then:
git clone https://github.com/<you>/some-lib.git
cd some-lib
git remote add upstream https://github.com/<org>/some-lib.git

git switch -c fix/null-check-uploads
# ...make a focused change, add a test, run the project's checks...

git commit -m "fix(upload): guard against null filename"
git push -u origin fix/null-check-uploads
# open the pull request from the fork to upstream, then:
gh pr checkout 42        # when the maintainer requests changes`,
        description:
          "The standard fork workflow: upstream is a read-only remote, your fork carries the branch, the pull request bridges them.",
      },
      {
        title: "A pull request body maintainers like",
        language: "markdown",
        code: `Fixes #1234

## Problem
Uploads with a null filename threw a TypeError inside the parser,
returning a 500 instead of the documented 400.

## Change
Validate the filename before parsing; return 400 with the standard error body.

## Testing
- Added a unit test for null filename (fails before this change)
- Added a test for empty string filename
- npm test and npm run lint pass locally`,
        description:
          "Link, problem, change, testing: four lines that pre-empt the maintainer's checklist.",
      },
    ],
    commonMistakes: [
      "Starting a large feature before discussing it, then discovering the maintainers planned it differently.",
      "Submitting to several projects at once with generic messages, which reads as contribution farming.",
      "Ignoring the project's own scripts and letting CI be your first feedback loop.",
      "Taking review comments as rejection and arguing instead of iterating, or silently abandoning the pull request.",
    ],
    bestPractices: [
      "Read CONTRIBUTING and the last ten merged pull requests before writing any code.",
      "Keep the first contribution tiny: a test, a docs fix, or a small bug with a reproduction.",
      "Respond to every review comment, even with a simple done; silence makes maintainers guess.",
      "Maintain the contribution after merge: watch the issue, reply to users, keep the branch habits.",
    ],
    realWorldUseCases: [
      "Portfolio evidence: a merged pull request to a well-known project proves you can work inside someone else's codebase and conventions.",
      "Career signal: sustained review participation shows communication, not just coding.",
      "Tooling you depend on: fixing the library you use daily removes friction for your own team.",
    ],
    resources: [
      article(
        "Open Source Guides: How to contribute to open source",
        "https://opensource.guide/how-to-contribute/",
        "opensource.guide",
        "GitHub's official guide to finding projects, making a pull request and what to do when you get stuck.",
        { estimatedDuration: "15 min" },
      ),
      docs(
        "GitHub: Contributing to a project",
        "https://docs.github.com/en/get-started/quickstart/contributing-to-projects",
        "Official walkthrough of forks, branches, pull requests and resolving conflicts when contributing.",
      ),
      ytSearch(
        "first open source pull request walkthrough",
        "Step-by-step videos of fork, branch, test, pull request and review iteration.",
        "en",
        "10-25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-first-contribution",
        title: "Plan a real contribution",
        prompt: `
Pick a library you actually use. Locate its CONTRIBUTING file and one open issue labelled good first issue, or a clear documentation gap.

Write the full plan: the issue URL, what you will change, which files, what test you will add, the branch and commit message you will use, and the exact opening paragraph of your pull request. If you then submit it, note what the maintainers asked you to change.
        `,
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Prefer an issue with a reproduction, or a clearly wrong sentence in the docs.",
          "Check whether the project asks for an issue comment before you start.",
        ],
        solution:
          "Model answer outline: (1) issue link plus a one-sentence problem statement in your own words; (2) repo conventions copied from CONTRIBUTING (branch prefix, required checks, sign-off); (3) change plan with file paths, the diff intent, and the test that fails without your change; (4) a commit message following the project's convention; (5) an opening paragraph under 150 words covering Fixes #N, problem, change, how you tested; (6) a contingency: if the maintainer asks for a different approach, you iterate rather than defend. A complete plan, even for an unsubmitted change, demonstrates the skill; the merged PR is a bonus.",
        solutionLanguage: "text",
      },
    ],
    projectIds: [],
  },
  {
    ...shared,
    id: "p3m7-system-design-fundamentals",
    slug: "system-design-fundamentals",
    title: "System Design Fundamentals",
    description:
      "A repeatable method for open-ended design questions: clarify, estimate, sketch, go deep, and defend the trade-offs out loud.",
    order: 8,
    estimatedMinutes: 25,
    tags: ["system-design", "architecture", "scalability", "interviews"],
    prerequisites: ["p3m5-microservices-fundamentals", "p2m5-rest-principles", "p3m4-performance-profiling"],
    relatedTopics: ["p3m7-database-design-interviews", "p3m7-rest-api-interviews", "p3m5-microservices-fundamentals"],
    learningObjectives: [
      "Run a design conversation in a structured order instead of improvising",
      "Turn rough traffic estimates into concrete capacity decisions",
      "Explain caching, queues, sharding and replication as trade-offs rather than vocabulary",
      "State the failure modes and the chosen consistency model for your design",
    ],
    simpleExplanation:
      "A system design question is not a test of memorised architectures. It is a conversation where you ask what the system must do, estimate how big it is, draw a first simple design, then pick one or two risky parts and discuss them in depth, always naming what you are trading away.",
    detailedContent: `
Interviewers are evaluating how you think under ambiguity, not whether you name the same components they would. Use a method so your thinking is visible:

1. **Clarify scope (3-5 minutes).** Which features are in, which are explicitly out? Read and write ratio, expected users, latency target, consistency needs, regulatory constraints. A design for 100 daily users and one for 100 million differ by orders of magnitude, so ask.
2. **Estimate roughly.** Daily active users multiplied by requests per action gives orders of magnitude for QPS, storage per day and bandwidth. The point is not precision; it is knowing whether you need one database or sharding before you draw them.
3. **Sketch the high-level path.** Client, CDN or load balancer, stateless application tier, data store, plus whatever third parties exist. Get one correct end-to-end flow first; the happy path is a design, not decoration.
4. **Go deep on the hardest one or two parts.** Usually read scaling (cache, read replicas, denormalisation), write scaling (queue the slow work, partition by a key you can defend), or hot spots (rate limiting, fan-out).
5. **State the trade-offs explicitly.** Which consistency model, what happens when a dependency fails, where duplicate requests go, what breaks first at 10x.
6. **Wrap up.** Summarise, then offer the alternative you rejected and why.

Two failure modes dominate: drawing boxes without flows ("then it scales horizontally") and collecting technologies without reasons. Every component should answer a specific constraint you established in step 1 or 2.
    `,
    howItWorks: `
Beneath the diagrams a few mechanisms do most of the work. A **load balancer** spreads requests across interchangeable stateless instances, so capacity grows by adding machines. A **cache** serves popular keys from memory; the trade-off is staleness, so your policy (write-through, TTL, invalidate on write) must match how wrong the data may be. A **queue** converts a spike into a smooth backlog and turns synchronous work into retries, at the cost of eventual delivery and idempotent consumers. **Replication** buys read throughput and failover; **partitioning** buys write throughput at the price of no simple query across partitions.

Designs fail predictably: a thundering herd when a hot key expires, an N+1 fan-out, an unbounded queue because consumers fall behind, and a cache that lies after a write. Naming these in advance, plus how you would detect them (metrics, queue depth, p99), separates a reasoned design from a vocabulary display.
    `,
    codeExamples: [
      {
        title: "A design outline you can actually say out loud",
        language: "text",
        code: `Prompt: "Design a URL shortener."

1. Clarify: 100M new links/month, 10:1 read to write, 1-year default TTL.
   Redirects must answer in under 50ms at p99. Custom aliases allowed.
2. Estimate: ~40 writes/s average (spikes x20), ~400 reads/s average -> 4k/s peak.
   Storage: 100M rows x ~100B = ~10GB/month, fits one primary for years.
3. Sketch:  POST /links -> API -> Postgres (base62 key, unique)
            GET /:code   -> cache (Redis) -> on miss, DB -> 301
            Writes go through a queue for analytics fan-out.
4. Deep dive: key generation, random 7-char base62 (~3.5e12 combos),
   retry on unique violation; avoids reading max(id), a hot row.
5. Trade-offs: 301 (cached forever by browsers, no click stats) vs 302
   (stats possible, slower). Cache stampede -> single-flight + TTL jitter.
   If the DB dies: cache still serves the top 20% of links.
6. Wrap: blocked on custom-domain abuse control; would add rate limiting.`,
        description:
          "Six steps spoken in about twelve minutes, with numbers driving each decision instead of intuition.",
      },
      {
        title: "Turning estimates into a decision",
        language: "text",
        code: `Given: 10M DAU, 20 reads + 1 write per active user per day
  -> ~200M reads/day  ~= 2.3k reads/s average
  ->  10M writes/day  ~= 115 writes/s average

Decision: reads dominate 20:1, so spend effort on read paths
(cache, read replicas, CDN for immutable assets), not on sharding
the write path. Sharding is deferred until measurements show the
single primary saturating; a write rate of ~115/s is trivial.`,
        description: "The same arithmetic should visibly change which part of the design you spend time on.",
      },
    ],
    commonMistakes: [
      "Skipping clarification and designing for imagined requirements, the fastest way to solve the wrong problem.",
      "Listing technologies (Kafka, Redis, Kubernetes) without saying which constraint each one addresses.",
      "Ignoring failure: what happens when the cache is empty, the queue backs up, or one replica dies.",
      "Optimising for a scale the estimate never justified, adding sharding where a bigger instance would do.",
    ],
    bestPractices: [
      "Write your estimates on the board; they are the evidence for every later choice.",
      "Draw the request flow first, then annotate it with caches, queues and stores.",
      "Always name the trade-off: consistency versus availability, latency versus cost, freshness versus load.",
      "End with what you would monitor and what you would revisit first at 10x traffic.",
    ],
    realWorldUseCases: [
      "Architecture reviews: the same clarify-estimate-deepen structure keeps design meetings from becoming opinion exchanges.",
      "Capacity planning: back-of-envelope math decides whether infrastructure work is needed this quarter or next year.",
      "Incident postmortems: identifying the component that was never designed for its actual load.",
    ],
    resources: [
      article(
        "System Design Primer",
        "https://github.com/donnemartin/system-design-primer",
        "github.com",
        "Free, extensive reference covering scalability patterns, caching, replication and interview-style questions with diagrams.",
      ),
      article(
        "Martin Fowler: MonolithFirst",
        "https://martinfowler.com/bliki/MonolithFirst.html",
        "martinfowler.com",
        "Why most teams should start with a well-structured monolith and split only when a measured need appears.",
        { estimatedDuration: "10 min" },
      ),
      article(
        "Google SRE: Addressing Cascading Failures",
        "https://sre.google/sre-book/addressing-cascading-failures/",
        "sre.google",
        "How overload, retries and shared dependencies actually take systems down: the failure side of design.",
        { estimatedDuration: "25 min" },
      ),
      ytSearch(
        "system design interview walkthrough with estimates",
        "Full-length mock sessions that show clarification and arithmetic before diagrams.",
        "en",
        "20-45 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-design-feed",
        title: "Design under stated constraints",
        prompt: `
Design a feed system for a photo-sharing app: 5M daily active users, each posts twice a week and follows 100 accounts, and feeds must load in under 200ms at p99.

Write your clarifying questions, your rough estimates, the high-level flow, the one component you would go deep on, and two explicit trade-offs you are accepting. Keep it under one page.
        `,
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Fan-out on write versus fan-out on read is the central decision; what does your read and write ratio say?",
          "What breaks when an account with 5M followers posts?",
        ],
        solution:
          "Model answer outline: Questions: timeline freshness (real-time or 30s stale), is ranking required, do expiring stories count? Estimates: 5M DAU with 100 follows each implies a large candidate set per day; posts are rare relative to reads. Flow: ingest service writes the post, pushes to a fan-out worker queue, computes timelines for normal followers, stores a per-user cached timeline plus a durable copy. Deep dive: the celebrity problem, fan-out-on-read (pull) for accounts above a follower threshold, merged at read time with the pre-computed store. Trade-offs accepted: (1) up to a few seconds of staleness for normal users; (2) read-path CPU cost and cache misses in exchange for not melting the write path. Also mention ranking at read time, invalidation strategy, and what you monitor (timeline generation lag, p99 read).",
        solutionLanguage: "text",
      },
      {
        id: "ex-p3m7-design-critique",
        title: "Critique a design someone else gave",
        prompt:
          "Find a system design answer online, or write one yourself in five minutes, and critique it: which requirement from step 1 does it not satisfy, which component has no stated reason to exist, and what single failure mode would take it down first? Propose one concrete change.",
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: ["Look for caches with no invalidation story and queues with no back-pressure."],
        solution:
          "Model answer outline: (a) requirement gap, for example the design never addressed the stated p99 or the write volume; (b) unjustified component, for example microservices chosen for a team of three, or a message broker where a database table would carry the load; (c) first failure, for example a thundering herd on cache expiry, unbounded queue growth, or a single primary with no failover plan; (d) one change, for example add single-flight locking plus TTL jitter, or set a queue length alarm with a dead-letter policy. Credit is for the reasoning chain, not for the specific component chosen.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m7-database-design-interviews",
    slug: "database-design-interviews",
    title: "Database Design Interviews",
    description:
      "Schema design and indexing reasoning you can defend: normalisation, composite index order, EXPLAIN, N+1 queries and when to denormalise.",
    order: 9,
    estimatedMinutes: 24,
    tags: ["database", "sql", "indexing", "interviews"],
    prerequisites: ["p3m4-performance-profiling", "p3m7-system-design-fundamentals"],
    relatedTopics: ["p3m7-system-design-fundamentals", "p3m4-performance-profiling", "p3m7-rest-api-interviews"],
    learningObjectives: [
      "Design a normalised schema and justify each table and relationship",
      "Choose composite index columns from WHERE, JOIN and ORDER BY usage, and explain the order",
      "Read an EXPLAIN plan well enough to spot a sequential scan or a mis-ordered index",
      "Recognise N+1 queries and choose between an index, a join, caching or denormalisation",
    ],
    simpleExplanation:
      "Database interviews are not about memorising index types. They are about reasoning: this query filters on these columns, sorts by that one and returns this many rows, therefore this index helps, and here is what it costs on writes. The interviewer wants to hear you connect the shape of the data and the shape of the queries to a concrete choice.",
    detailedContent: `
Start with the **access patterns**, not the entities. Write down every query the system needs before you draw a table; a schema that is beautiful for the entities and hostile to the queries will fail in review.

**Normalisation as reasoning.** Third normal form exists to prevent update anomalies: if a customer's city lives in three places, three rows must change together and one will eventually disagree. Normalise until it hurts, then denormalise with evidence, a measured slow query, or a read-heavy workload you cannot join cheaply. Knowing *why* you denormalised is the answer interviewers want; "joins are slow" is not one.

**Indexes.** A B-tree index is a sorted structure that lets the engine find a range without reading the table. For a composite index \`(a, b, c)\`, think of a phone book sorted by last name then first name: you can search on (a), (a, b) and (a, b, c), but not on (b) alone. Put equality columns first, then the column used for ordering, so \`WHERE customer_id = ? ORDER BY created_at DESC\` wants \`(customer_id, created_at)\`. Also account for selectivity (a boolean with two values is a poor leading column) and remember the write cost: every index slows every insert and update and consumes memory.

**Reading plans.** \`EXPLAIN ANALYZE\` shows the actual path. Look for a sequential scan on a large table when you expected an index, an estimate wildly different from actual rows (stale statistics), and loops that reveal N+1 behaviour. Measure, then change one thing.

**Trade-offs.** Read replicas add lag, caching adds staleness, denormalisation adds write amplification. Name the inconsistency you are accepting every time.
    `,
    howItWorks: `
When you run a query the planner builds candidate plans and picks the cheapest estimated one: index scan, bitmap scan, sequential scan, nested loop, hash join. Cost comes from estimated page reads, so accurate statistics (updated by \`ANALYZE\`) matter as much as your indexes.

An index seek on \`(customer_id, created_at)\` walks the B-tree to the first matching customer, then reads the contiguous slice in time order, which is why the sort disappears when the index order matches the \`ORDER BY\`. A missing sort node in the plan is the visual proof your column order was right.

N+1 lives in the application layer: one query for the list, then one per row for a relation. The planner never warns you, because each query alone looks fine; you spot it by counting round-trips per request. The fix is a single \`JOIN\` or an \`IN (...)\` batch, and only then a denormalised column if the workload truly demands it.
    `,
    codeExamples: [
      {
        title: "Index choice for a real query",
        language: "sql",
        code: `-- Query: last 20 orders for one customer
SELECT id, status, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;

-- A: CREATE INDEX idx_orders_created ON orders (created_at);
-- B: CREATE INDEX idx_orders_cust     ON orders (customer_id);
-- C: CREATE INDEX idx_orders_cust_created
--        ON orders (customer_id, created_at DESC);

-- C wins: equality column first, ordering column second.
-- The engine seeks to customer 42, walks backwards in time,
-- stops after 20 rows: no sort node, no full scan.
-- A finds the right time range but must filter every row;
-- B finds all of the customer's orders but must sort them all.`,
        description:
          "Reasoning from the query shape, not from a rule of thumb. A and B both look plausible and are both worse.",
      },
      {
        title: "Finding an N+1",
        language: "ts",
        code: `// 1 query for the page + 50 queries for relations = 51 round-trips
const orders = await db.order.findMany({ take: 50 });
for (const o of orders) {
  o.items = await db.orderItem.findMany({ where: { orderId: o.id } }); // N+1
}

// One round-trip; the planner can still use idx_order_items_order_id
const ordersWithItems = await db.order.findMany({
  take: 50,
  include: { items: true }, // JOIN or IN (...) under the hood
});`,
        description:
          "Same result, one network round-trip instead of fifty, the fix that indexing alone can never give you.",
      },
    ],
    commonMistakes: [
      "Indexing every column to be safe, which slows writes, bloats storage and confuses the planner.",
      "Putting the low-selectivity column first in a composite index and wondering why it is not used.",
      "Adding a cache to hide a query that a single index or join would have fixed.",
      "Denormalising before measuring, then discovering the write path now has two sources of truth that disagree.",
    ],
    bestPractices: [
      "List the queries first, then design the schema and the indexes that serve them.",
      "Verify every index claim with EXPLAIN ANALYZE and record the before and after timing.",
      "Watch query counts per request; N+1 hides in application code, not in the plan.",
      "Document the inconsistency you accept whenever you denormalise or add a cache.",
    ],
    realWorldUseCases: [
      "Checkout latency: moving an order-history page from 1.8s to 60ms by adding one composite index in the right order.",
      "Reporting versus OLTP: read replicas keep analytics queries away from the transactional primary.",
      "Data growth: partitioning by month when a single table's index no longer fits comfortably in memory.",
    ],
    resources: [
      docs(
        "PostgreSQL: Indexes",
        "https://www.postgresql.org/docs/current/indexes.html",
        "Official explanation of index types, multi-column indexes and when PostgreSQL will use them.",
      ),
      docs(
        "PostgreSQL: Using EXPLAIN",
        "https://www.postgresql.org/docs/current/using-explain.html",
        "How to read query plans, including row estimates versus actual rows and ANALYZE output.",
      ),
      article(
        "Use The Index, Luke",
        "https://use-the-index-luke.com/",
        "use-the-index-luke.com",
        "Database-agnostic, example-driven guide to indexing and writing index-friendly SQL.",
      ),
      ytSearch(
        "SQL indexing and query plan analysis explained",
        "Visual walkthroughs of B-tree lookups and EXPLAIN output on real tables.",
        "en",
        "15-30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-index-design",
        title: "Design indexes for three query patterns",
        prompt: `
Schema: bookings(id, room_id, guest_id, starts_at, ends_at, status)

Queries:
1. availability check for one room in a date range;
2. all upcoming bookings for one guest ordered by starts_at;
3. count of confirmed bookings per room for a dashboard.

Propose the fewest indexes that serve these, justify each column order, state which query still needs application-level work, and name the write cost you are accepting.
        `,
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "A range predicate on starts_at and equality on room_id: which column leads?",
          "Can one index serve both query 1 and query 2? Two indexes is allowed; three may be too many.",
        ],
        solution:
          "Model answer outline:\n1. (room_id, starts_at): equality on room_id first, range and order on starts_at second; supports the availability scan.\n2. (guest_id, starts_at): equality then ordering; the upcoming filter rides on the same index.\n3. Query 3 is an aggregate over all rooms: a partial index on room_id WHERE status = 'confirmed' is often the best fit, or a summary table if the dashboard runs frequently; count(*) over a large table per request is the wrong shape.\nCost: each index adds write amplification on every insert and update of bookings and consumes buffer memory; on a write-light booking table that is acceptable. If queries also need a global date sweep, a (starts_at, room_id) ordering may be needed instead; state the assumption you are making.",
        solutionLanguage: "text",
      },
      {
        id: "ex-p3m7-explain-plan",
        title: "Interpret a plan",
        prompt: `
You run EXPLAIN ANALYZE and see:

    Seq Scan on orders
      rows=1,240,000   actual rows=1,198,000
      time=840ms   filter: (customer_id = 42)

An index idx_orders_cust (customer_id) already exists but is not used.

Describe your investigation steps in order, and give two plausible causes with the fix for each.
        `,
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "What does the planner believe about the data distribution?",
          "Is the column data type what the index expects?",
        ],
        solution:
          "Model answer outline: Steps: confirm the estimate versus actual in a formatted plan; check statistics freshness (ANALYZE orders); verify the index exists and is on the right column; check the query types and expressions (a parameter typed as text versus integer, or a function on the column, disables use). Cause 1: stale statistics or very low estimated selectivity; fix: run ANALYZE, revisit n_distinct or random_page_cost, and re-plan. Cause 2: an implicit cast or expression, for example customer_id = '42' against an integer column; fix: align types or index the expression. Other valid causes: the planner decided a parallel sequential scan was cheaper for a huge fraction of the table; the index is invalid after a failed migration; or the LIMIT makes a full scan appear cheaper than estimated.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m7-rest-api-interviews",
    slug: "rest-api-interviews",
    title: "REST API Design Interviews",
    description:
      "Defensible API design: resources and status codes, idempotency and retries, pagination, versioning, caching and the REST versus RPC trade-off.",
    order: 10,
    estimatedMinutes: 22,
    tags: ["rest", "api-design", "http", "interviews"],
    prerequisites: ["p2m5-rest-principles", "p2m5-resource-naming", "p3m2-advanced-rest-design"],
    relatedTopics: ["p3m7-system-design-fundamentals", "p3m2-openapi-advanced", "p3m2-advanced-rest-design"],
    learningObjectives: [
      "Model a domain as resources and choose verbs, status codes and error bodies deliberately",
      "Explain idempotency and why retries make it a correctness requirement, not a nicety",
      "Pick a pagination style and a versioning strategy with their costs named",
      "Justify caching headers, partial updates and consistency choices in the design conversation",
    ],
    simpleExplanation:
      "An API design interview is a conversation about contracts: what the resources are, what each request means, what can safely be retried, and what happens when the network lies. Good answers are not 'REST uses nouns' rules; they are explanations of why a client can recover when a response is lost halfway.",
    detailedContent: `
Design from the client's problem inward. List the use cases, then model the data as **resources** and let HTTP verbs carry the semantics:

- \`GET /orders/123\` is safe, idempotent and cacheable, and returns a representation.
- \`POST /orders\` creates; it is not idempotent, so a retried request may create twice unless you deduplicate.
- \`PUT /orders/123\` replaces with a complete body, so repeating it yields the same state. \`PATCH\` applies a partial change and is only idempotent if the patch itself is.
- \`DELETE /orders/123\` is idempotent in effect: deleting twice ends in the same state, and the second may return 404, which is fine.

**Status codes are part of the contract.** 201 with a Location header for creation, 204 for a successful delete, 400 for malformed input, 401 versus 403 (who you are versus what you may do), 404 for absent, 409 for state conflicts, 422 for semantic validation failures, 429 with Retry-After for rate limits, 503 for temporary inability. Returning 200 with an error JSON inside is the classic failure: clients, caches and monitoring cannot tell success from failure.

**Retries and idempotency.** Timeouts are ambiguous; the server may have committed. Idempotency keys on unsafe endpoints let the server deduplicate a replayed request, which is exactly why payment APIs accept an Idempotency-Key header.

**Pagination.** Offset pagination is simple but skips or repeats rows when data changes underneath; cursor pagination is stable and efficient for infinite scroll, at the cost of not jumping to arbitrary pages.

**Versioning.** URI versioning is explicit and cacheable; headers are cleaner but harder to inspect. Either way, prefer additive changes and deprecation windows over version churn.

Say out loud what you are trading: HATEOAS adds discoverability at real complexity cost, and strict REST purity sometimes loses to a pragmatic action such as \`POST /orders/123/refund\` when the operation is not natural CRUD.
    `,
    howItWorks: `
A request goes through routing to a handler that parses input, enforces auth and validation, runs domain logic against the store, then serialises a response with a status and headers. Middleware layers (auth, rate limiting, logging, tracing) wrap that path, which is why cross-cutting concerns like a request id and 429 handling belong in middleware rather than in every handler.

Caching interacts with the protocol: Cache-Control, ETag and If-None-Match let a client revalidate instead of re-download, and conditional requests turn a full 200 into a cheap 304. Optimistic concurrency uses the same mechanism on writes: If-Match with the current ETag rejects a stale update with 412 instead of silently overwriting a colleague's change.

Rate limiting is enforced at the edge or in middleware with a token bucket, and its response headers are what make a client's backoff behaviour correct. Finally, an OpenAPI document generated from, or verified against, the implementation is how the contract survives contact with other teams.
    `,
    codeExamples: [
      {
        title: "Idempotent retry with a key",
        language: "http",
        code: `POST /v1/charges HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>
Idempotency-Key: 3f9a1c2e-8f4d-4b6a-9d0e-7c2b5a1f4e88
Content-Type: application/json

{ "orderId": "ord_123", "amountCents": 4999 }

HTTP/1.1 201 Created
Location: /v1/charges/ch_8842
Idempotency-Replayed: true
Content-Type: application/json

{ "id": "ch_8842", "status": "succeeded" }`,
        description:
          "The client retried after a timeout; the key lets the server return the original result instead of charging twice.",
      },
      {
        title: "A contract worth criticising",
        language: "text",
        code: `Weak design:
  POST /getUserOrderInfo        (verb in path, RPC style)
  GET  /orders?id=123           (filters instead of identity)
  HTTP 200 { "error": "failed" }  (error hidden inside a 200)
  offset pagination only        (rows shift under the reader)

Stronger design:
  GET    /v1/orders/123                     200 | 404
  POST   /v1/orders                         201 + Location
  PATCH  /v1/orders/123  If-Match: "W/..."   200 | 412
  DELETE /v1/orders/123                     204 | 404
  GET    /v1/orders?limit=50&after=cD0yMDI2  keyset cursor
  errors: problem+json with type, title, status and traceId`,
        description:
          "Use this before and after framing to structure an API critique in an interview.",
      },
    ],
    commonMistakes: [
      "Returning HTTP 200 with an error payload, so caches, clients and monitoring all misread failures.",
      "Ignoring idempotency on payment or creation endpoints, then discovering double charges under retry.",
      "Designing only happy paths: with no 409 or 412 story, client conflicts silently overwrite data.",
      "Choosing offset pagination for a high-write feed, producing duplicated and skipped items during paging.",
    ],
    bestPractices: [
      "Write the OpenAPI spec first for at least the tricky endpoints; let the spec be the discussion artifact.",
      "Make every unsafe endpoint safe to retry with idempotency keys and clear 409 and 412 semantics.",
      "Document error shapes with one consistent format and include a trace id in every error response.",
      "Use ETags and conditional requests for reads and updates; version only when you must, and deprecate loudly.",
    ],
    realWorldUseCases: [
      "Mobile clients on flaky networks: idempotency keys turn an ambiguous timeout into a safe retry.",
      "Third-party integrations: consistent status codes and error bodies decide whether partners can build unattended.",
      "High-traffic reads: cursor pagination plus ETag revalidation keeps feeds fast without offset scans.",
    ],
    resources: [
      docs(
        "RFC 9110: HTTP Semantics",
        "https://www.rfc-editor.org/rfc/rfc9110",
        "The specification behind the verbs, status codes, idempotency definitions and caching semantics.",
      ),
      article(
        "Microsoft: API design best practices",
        "https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design",
        "learn.microsoft.com",
        "Concrete guidance on resource naming, status codes, pagination, versioning and error handling for HTTP APIs.",
        { estimatedDuration: "30 min" },
      ),
      docs(
        "OpenAPI Specification",
        "https://spec.openapis.org/oas/latest.html",
        "The contract format you will use to describe and review API designs with other teams.",
      ),
      ytSearch(
        "REST API design interview deep dive",
        "Interview-style discussions of status codes, idempotency and versioning trade-offs.",
        "en",
        "15-30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-api-critique",
        title: "Critique and redesign an endpoint",
        prompt: `
An API under review:

    POST /api/v1/createBooking
    Body: { room, date, userId }
    Always returns HTTP 200 with { ok: true } or { ok: false, msg }
    Retries after a timeout create duplicate bookings.

List at least five problems, then redesign the endpoint or endpoints: method, path, request, possible responses with status codes, and how you make a client retry safe.
        `,
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Which parts of the request are identity, and could the server deduplicate on them?",
          "What should 200, 201, 409 and 422 each mean here?",
        ],
        solution:
          "Model answer outline, problems: (1) verb in the path and RPC shape; (2) success and failure hidden in a 200; (3) no idempotency, so retries duplicate bookings; (4) no conflict semantics for double-booking; (5) a client-supplied userId trusted without an auth check; (6) missing validation error codes and no trace id. Redesign: POST /v1/bookings with an Idempotency-Key header; the server derives the user from the token; 201 with Location on create, 409 Conflict when the slot is taken, 400 or 422 for malformed input, 401 or 403 for auth; a unique constraint on room and slot as the last line of defence; replaying the same idempotency key returns the original 201 body; GET /v1/bookings/{id} for retrieval with an ETag. Optional: a GET /v1/availability read path.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m7-nodejs-internals-interviews",
    slug: "nodejs-internals-interviews",
    title: "Node.js Internals Interviews",
    description:
      "Event loop phases, the libuv thread pool, microtasks versus macrotasks, streams and blocking: reasoning instead of reciting trivia.",
    order: 11,
    estimatedMinutes: 23,
    tags: ["nodejs", "event-loop", "async", "internals"],
    prerequisites: ["p2m1-event-loop-order", "p2m1-typescript-node"],
    relatedTopics: ["p2m1-event-loop-order", "p3m4-performance-profiling", "p3m7-system-design-fundamentals"],
    learningObjectives: [
      "Explain what the event loop actually does and which work is offloaded to libuv",
      "Predict callback ordering across nextTick, promises, timers and I/O",
      "Diagnose a blocked event loop from symptoms using measurable reasoning",
      "Choose between async I/O, the thread pool and worker threads for CPU-heavy work",
    ],
    simpleExplanation:
      "Node runs your JavaScript on one thread and handles I/O by handing work to the operating system or to libuv's small thread pool, then running your callbacks when results arrive. The event loop is the queue-draining machine that decides when each callback runs, and any code that runs synchronously for a long time stops every other request until it finishes.",
    detailedContent: `
Node's promise is **non-blocking I/O on a single JavaScript thread**. When you call \`fs.readFile\`, the work is given to libuv, which uses a thread pool of four threads by default for file I/O and the OS kernel's readiness APIs for TCP. Your function returns immediately and the result comes back later as a callback or promise. That is why one Node process can hold thousands of concurrent connections: it spends its time waiting, not computing.

The event loop cycles through phases: timers (\`setTimeout\` and \`setInterval\`), pending callbacks, idle and prepare, poll (incoming connections and I/O), check (\`setImmediate\`), and close callbacks. Two queues are easy to confuse with them:

- **\`process.nextTick\`** callbacks run after the current operation completes, *before* the loop continues, regardless of phase.
- **Promise microtasks** (then, catch, finally) run right after nextTick callbacks, and again each time the stack unwinds.
- **Timers and I/O** are macrotasks; they wait for their phase.

So synchronous code always wins, then nextTick, then microtasks, then the earliest due timer. Recursing \`process.nextTick\` starves I/O entirely, which is a real production failure mode rather than trivia.

"Single threaded" has precise limits: your JavaScript is single-threaded, but DNS, file system work and crypto can run in libuv's pool, and CPU-heavy work (image processing, compression, parsing a huge JSON body) genuinely blocks the loop. For that the answer is not \`setTimeout\`; it is worker threads or moving the job to a separate process or queue.
    `,
    howItWorks: `
Each loop iteration runs due timers, then deferred I/O callbacks, then polls for new events (blocking there until something happens or a timer is due), then \`setImmediate\` callbacks, then close handlers. The nextTick and microtask queues drain between each step. The poll phase is where an idle server waits; when a socket receives data, the kernel wakes it and the corresponding callback is queued.

The thread pool services \`fs\`, \`dns\`, \`zlib\` and \`crypto\` operations. Four threads by default means a fifth simultaneous \`fs.readFile\` queues up, a classic cause of mysterious latency that you fix with \`UV_THREADPOOL_SIZE\` or by switching to APIs that do not use the pool.

To reason about slowness: measure event loop delay with \`perf_hooks.monitorEventLoopDelay\`, correlate spikes with the CPU-heavy request, and profile the stack. The symptom set, every endpoint slow at once with low database CPU, points at a blocked loop rather than a slow dependency.
    `,
    codeExamples: [
      {
        title: "Predict the output before running it",
        language: "js",
        code: `console.log("1: script start");

setTimeout(() => console.log("4: timer"), 0);

Promise.resolve().then(() => console.log("3: microtask"));

process.nextTick(() => console.log("2: nextTick"));

setImmediate(() => console.log("5: immediate"));

console.log("6: script end");

// Synchronous first, then nextTick queue, then promise microtasks,
// then timers and check phases:  1, 6, 2, 3, 4, 5`,
        description:
          "Work through it by queue, not by line. The two sync logs finish before any callback runs, and nextTick always beats microtasks.",
      },
      {
        title: "CPU work that blocks every other request",
        language: "ts",
        code: `// Blocked loop: p99 for unrelated GET /health jumps to 300ms
app.post("/reports", async (req, res) => {
  const rows = await db.findHugeDataset();
  const csv = rows.map(toCsvLine).join("\\n"); // 400ms of pure JS
  res.type("text/csv").send(csv);
});

// Option A: yield the loop periodically while chunking
// Option B: hand the work to a worker thread or the job queue
import { Worker } from "node:worker_threads";
const result = await runInWorker("./report-worker.js", payload);`,
        description:
          "The interview answer is not 'make it async'; await does not free the thread. It is measuring, then moving CPU work off the loop.",
      },
    ],
    commonMistakes: [
      "Believing that adding await around CPU work makes it non-blocking; only I/O yields, computation does not.",
      "Assuming setTimeout(fn, 0) runs immediately; it waits for the timers phase and is affected by other work.",
      "Forgetting the thread pool limit of four concurrent fs or crypto operations before requests queue.",
      "Reaching for worker threads to fix what is actually a missing index or an N+1 query.",
    ],
    bestPractices: [
      "Instrument event loop delay in production and treat a rising p99 as a first-class alert.",
      "Reserve synchronous heavy parsing for boundaries: stream large inputs instead of buffering and parsing them whole.",
      "Use setImmediate, or proper async APIs, instead of recursing process.nextTick.",
      "Keep handlers small and measure; profile before optimising, and confirm the loop rather than the database is the bottleneck.",
    ],
    realWorldUseCases: [
      "A single slow endpoint degrading the whole service: moving report generation to a worker restores latency for everyone.",
      "Batch jobs inside a web process: moving them to a queue gives retries, backoff and visibility.",
      "File upload spikes: raising UV_THREADPOOL_SIZE, or using streaming crypto, resolves unexplained stalls.",
    ],
    resources: [
      docs(
        "Node.js: The Node.js Event Loop",
        "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
        "Official explanation of phases, nextTick versus setImmediate, and how timers interact with the poll phase.",
      ),
      docs(
        "libuv: Design overview",
        "https://docs.libuv.org/en/stable/design.html",
        "The C library under Node: event-driven architecture, the thread pool and platform abstraction.",
      ),
      docs(
        "Node.js: Worker threads",
        "https://nodejs.org/api/worker_threads.html",
        "Running real parallel JavaScript for CPU-bound work, with structured messaging and shared memory.",
      ),
      ytSearch(
        "node event loop phases explained with demos",
        "Visual demos of timers, poll, check and microtask ordering.",
        "en",
        "10-25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-order-prediction",
        title: "Predict and explain the ordering",
        prompt: `
Given the code in the first example of this lesson (sync logs, setTimeout 0, Promise.then, process.nextTick, setImmediate):
1. Write the output you expect.
2. Justify each step by naming the queue it waits in.
3. Change one line so that "immediate" prints before "timer" deterministically, and explain why your change makes it deterministic.
        `,
        difficulty: "advanced",
        estimatedMinutes: 15,
        hints: [
          "Sync code always completes before any queued callback runs.",
          "What happens when both timers are scheduled inside an I/O cycle?",
        ],
        solution:
          "Model answer outline: Output 1, 6, 2, 3, 4, 5. Steps: sync logs run immediately; after the operation ends the nextTick queue drains (2); then promise microtasks (3); then the loop enters the timers phase (4) and the check phase (5). Deterministic fix: schedule both inside an I/O callback, for example inside an fs.readFile callback; inside an I/O cycle setImmediate always runs before setTimeout with 0. Note in discussion: from the main module, timer versus immediate order can vary between runs, and inside an I/O phase it cannot.",
        solutionLanguage: "text",
      },
      {
        id: "ex-p3m7-blocked-loop",
        title: "Diagnose from symptoms",
        prompt: `
Production symptoms: every endpoint on a Node service has a p99 of about 350ms at peak; database CPU is at 12%; a profiler shows one stack frame consuming most CPU during spikes: JSON.parse on a 40MB payload.

Describe your fix, in order, and what you would measure to confirm each step worked.
        `,
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Who is blocked while JSON.parse runs?",
          "What is the difference between streaming and buffering here?",
        ],
        solution:
          "Model answer outline: (1) confirm the loop is the cause: monitorEventLoopDelay shows delay spikes aligned with the symptoms; (2) immediate mitigation: cap request body size at the edge so a 40MB payload cannot arrive (413); (3) real fix: stream the body and parse incrementally, or reject payloads above a threshold, so no single synchronous call exceeds a few milliseconds; move genuinely heavy transformation to a worker thread or a queue-backed job; (4) verify: p99 for unrelated endpoints returns to baseline, loop delay p99 drops, and the new payload limit is visible in metrics; (5) prevent: alert on event loop delay and add a load test with large bodies to CI. Wrong answers to avoid: adding await (no effect on CPU) or scaling replicas (each replica still blocks).",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-job-processing"],
  },
  {
    ...shared,
    id: "p3m7-coding-challenges",
    slug: "coding-challenges",
    title: "Approaching Coding Challenges",
    description:
      "A repeatable process for interview problems: clarify, exemplify, brute force, optimise, test and narrate, plus what practice is actually for.",
    order: 12,
    estimatedMinutes: 20,
    tags: ["algorithms", "problem-solving", "interviews", "typescript"],
    prerequisites: ["p2m1-typescript-node", "p2m7-test-coverage"],
    relatedTopics: ["p3m7-technical-interview-prep", "p3m7-system-design-fundamentals", "p2m7-test-coverage"],
    learningObjectives: [
      "Run a visible problem-solving process that includes clarification and testing",
      "Reason about time and space complexity as trade-offs rather than labels",
      "Recognise common structural patterns (hashing, two pointers, traversal) by their constraints",
      "Write clean, compilable code with edge-case tests under time pressure",
    ],
    simpleExplanation:
      "Interview problems are not solved by remembering the answer; they are solved by working through one carefully out loud. You confirm what is being asked, try small examples, get any working solution down, then improve it while explaining what you are trading, and you finish by testing the edges, because that is what you would do at work anyway.",
    detailedContent: `
Interviewers cannot see your thinking, so the process *is* the deliverable. A structure that consistently works:

1. **Clarify for 2 minutes.** Restate the problem. Ask about input size (does it permit an \`O(n^2)\` solution?), duplicates, ordering, empty inputs, and whether the function may mutate its input. An unstated assumption that turns out wrong costs more than two questions.
2. **Exemplify.** Walk one normal case and one edge case on the board by hand. This is where off-by-one bugs surface.
3. **Brute force honestly.** State the naive approach and its cost. This guarantees you have *a* solution and shows you can analyse one.
4. **Optimise with a reason.** The lever is almost always the data structure: a hash map turns a lookup from \`O(n)\` into \`O(1)\` (frequency counting, seen sets, memoisation); two pointers exploit sorted input; a sliding window exploits a contiguous range; BFS and DFS explore a graph. Ask "what am I repeatedly computing?" because the answer names the optimisation.
5. **Code it** in clean TypeScript, naming variables for the domain, and think aloud while you write.
6. **Test the edges**: empty, single element, duplicates, already-sorted, maximum size, overflow.

Complexity is a trade-off statement: this uses \`O(n)\` extra memory to get \`O(n)\` time, and if memory were the constraint you could sort in place for \`O(n log n)\` time and \`O(1)\` extra space.

Practice is for building pattern recall and for making the process automatic, not for memorising questions. Two or three problems a week, each written up with the mistake you made, beats twenty skimmed solutions.
    `,
    howItWorks: `
Under the hood each optimisation changes the algorithm's growth by changing what work is *shared*. The brute-force double loop recomputes the same comparisons; a hash map memoises the answers to those comparisons. Two-pointer techniques work because sorted order lets one comparison eliminate a whole region of candidates. A sliding window maintains a summary (counts, sums, sets) across a moving range so each element is added and removed once.

In a TypeScript interview the practical layer matters too: declaring types such as \`(nums: number[]): number[]\` documents the contract, early returns handle empties, and a small assertion block at the bottom proves your edge cases instead of asserting that you tested them. Interviewers often ask you to extend the solution afterwards, and a version that is easy to modify (pure function, clear names, no duplicated logic) scores better than a dense one that merely passes.
    `,
    codeExamples: [
      {
        title: "Clarify, then solve, then test",
        language: "ts",
        code: `// Prompt: return indices of two numbers that add up to a target.
// Clarified: exactly one solution, may not reuse the same element,
// input length up to 10^5, so O(n^2) is too slow.

export function twoSum(nums: number[], target: number): [number, number] {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    const j = seen.get(need);
    if (j !== undefined) return [j, i]; // partner was seen earlier
    seen.set(nums[i], i);
  }
  throw new Error("no solution");
}

// edge cases checked out loud
// twoSum([2, 7, 11, 15], 9)  -> [0, 1]
// twoSum([3, 3], 6)          -> [0, 1]  (duplicate values, distinct indices)
// twoSum([1, 2], 100)        -> throws  (stated: solution always exists)`,
        description:
          "One pass, a map as the 'what have I already seen' memory: O(n) time and O(n) space, named as a trade-off rather than a trick.",
      },
      {
        title: "Complexity as a trade-off statement",
        language: "text",
        code: `Naive:   for each i, scan the rest   -> O(n^2) time, O(1) space
Window:  keep a running summary      -> O(n) time, O(k) space (k = alphabet)
Sorted:  sort first                  -> O(n log n) time, O(1) extra space

Say which resource you are buying with which: time is bought with
memory (hash map), or memory is bought with time (sorting plus two
pointers). Interviewers ask "can you do better?" to hear this
sentence, not a name.`,
        description: "A template answer for the 'can you improve it?' follow-up.",
      },
    ],
    commonMistakes: [
      "Coding before restating the problem, then discovering halfway through that the output should be sorted.",
      "Presenting the optimal solution first with no reasoning trail, which leaves the interviewer unable to assess you.",
      "Skipping edge cases: empty input, single element, duplicates and negatives are where most failures live.",
      "Practising by memorising solutions instead of by writing the process until it is automatic.",
    ],
    bestPractices: [
      "Think aloud constantly, including when you are stuck; silence is the worst possible signal.",
      "Get any working solution into code before optimising; a passing brute force beats a perfect design in your head.",
      "Test with the examples you clarified plus the ugly ones, and narrate why each case matters.",
      "After solving, ask what would change at 10^8 elements or with concurrent writes; it shows engineering judgement.",
    ],
    realWorldUseCases: [
      "Daily coding: the clarify-then-test process prevents the same defects in production features.",
      "Performance work: recognising an O(n^2) inner loop inside application code is a real debugging skill.",
      "Technical interviews: the structure is what assessors grade, independent of whether you recall the optimal trick.",
    ],
    resources: [
      docs("TypeScript Handbook", OFFICIAL.typescriptDocs, "Types, narrowing and generics you will lean on while coding under pressure."),
      docs("MDN: JavaScript Guide", OFFICIAL.mdnJsGuide, "Language fundamentals, arrays, maps and iteration patterns used in challenge solutions."),
      ytSearch(
        "how to approach coding interview problems out loud",
        "Mock interviews that show clarification questions and edge-case testing in real time.",
        "en",
        "15-40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-solve-live",
        title: "Solve one problem out loud, on paper",
        prompt: `
Take a problem you have never seen (from any public set). Set a 35-minute timer and write down, in order:
1. your clarifying questions;
2. one worked example including an edge case;
3. the brute force with its complexity;
4. the optimisation and the data structure behind it;
5. the final code;
6. three test cases with expected outputs.

Do not run the code until you have predicted its output for each test.
        `,
        difficulty: "advanced",
        estimatedMinutes: 35,
        hints: [
          "Write the questions before you write the function.",
          "If you cannot say what data structure buys the optimisation, you have guessed.",
        ],
        solution:
          "Model answer outline, graded on process: (1) at least two clarifying questions that change the solution (input size, duplicates, mutation, ordering); (2) a worked example traced step by step; (3) a brute force named with complexity; (4) an optimisation justified by 'I was recomputing X, and a map or window or sort removes that'; (5) code that compiles in TypeScript with named variables and an explicit complexity statement; (6) three tests including an empty or single-element input, with a stated prediction for each before execution. A correct but unspecced run scores lower than a slightly rough answer that shows all six steps.",
        solutionLanguage: "text",
      },
    ],
    projectIds: [],
  },
  {
    ...shared,
    id: "p3m7-portfolio-development",
    slug: "portfolio-development",
    title: "Building a Strong Portfolio",
    description:
      "What makes repositories worth opening twice: depth, evidence of engineering discipline, and honest presentation over project count.",
    order: 13,
    estimatedMinutes: 16,
    tags: ["portfolio", "career", "github", "projects"],
    prerequisites: ["p1m3-github-repositories", "p1m3-readme-files", "p3m7-maintainable-code"],
    relatedTopics: ["p3m7-readme-presentation", "p3m7-technical-interview-prep", "p3m7-code-reviews"],
    learningObjectives: [
      "Select two to four projects that demonstrate range plus depth rather than a long list of clones",
      "Add the engineering signals reviewers look for: tests, CI, clear structure, documented decisions",
      "Present each project so a reader understands value and contribution within one screen",
      "Set honest expectations about what a portfolio can and cannot demonstrate",
    ],
    simpleExplanation:
      "A portfolio is a handful of repositories that let someone judge how you work: does it have a clear README, tests that run, a sensible structure, and commits that show how you solved problems? Three projects with those signals beat twenty tutorial clones, because reviewers are looking for evidence of engineering, not volume.",
    detailedContent: `
Reviewers spend little time. Usually a repository gets one screen of attention: the description, the README top, the language bar, the last commit date. Design for that screen, then reward the reader who scrolls.

**Depth beats count.** One project that shows an architecture decision, a test suite, a CI pipeline and a deployment tells a story of ownership. Five identical todo apps tell you nothing except that you can follow a tutorial. Pick projects that cover different muscles: a service with a database and auth, a tool with a CLI or library surface, and one thing that reflects a genuine interest of yours.

**Show the discipline.** The signals that separate a portfolio piece from homework:

- A README that starts with *what problem it solves*, not with the tech stack.
- Tests that run in CI on every push, a green badge you earned rather than one you pasted.
- An issue tracker used for real work; even one or two issues show how you plan.
- Commits with meaningful messages and a history that shows iteration, not one 3,000-line commit.
- An ADR or two for the non-obvious choices.

**Be honest about scale.** Do not claim production readiness you have not tested, and do not present a tutorial as original work; link the tutorial and say what you added. Reviewers ask "what would you change if this had 10,000 users?" and having a real answer matters more than pretending you already have them.

A portfolio demonstrates *how you build*. It does not by itself demonstrate teamwork at scale or on-call judgement; those come from conversation. Presenting it as what it is, rather than as a guarantee of outcomes, is itself a sign of maturity.
    `,
    howItWorks: `
A reviewer's path through your profile is: profile README, pinned repositories, a repository landing page, its README, then the code. Each step is a filter, so make each one earn the next.

On the landing page GitHub surfaces the description, topics, the About links (live demo, docs), the README rendered immediately, and the activity graph. An About section with a working deployment link removes the single biggest friction: reviewers will not clone and run your project just to find out what it does.

Inside, the structure should be legible at a glance: \`src\`, \`tests\`, \`docs\`, a root README, a CONTRIBUTING file if others may help, and a CI workflow that runs the same commands the README tells you to run. That alignment, documented commands that actually work from a clean clone, is the difference between a portfolio that survives scrutiny and one that collapses at the first \`npm install\`.
    `,
    codeExamples: [
      {
        title: "A repository landing page that works",
        language: "text",
        code: `Description:  Rate limiting middleware for Express with sliding-window
              counters and Redis fallback.   [Live demo]  [Docs]

README top:
  # express-rate-window
  Protects an Express app from bursts using a sliding window, with an
  in-memory fallback when Redis is unavailable.

  npm i express-rate-window        # 3-minute integration
  [badges: build passing | coverage 92% | npm version | license MIT]

  Why: fixed-window counters allow 2x bursts at window edges; this
  implementation smooths them (benchmarks in /docs).

Activity: 6 commits this week, 2 merged pull requests, 14 tests in CI`,
        description:
          "Problem first, install second, evidence third. A reviewer understands the project without leaving the page.",
      },
      {
        title: "Portfolio audit checklist",
        language: "text",
        code: `[ ] Every pinned repo: one-sentence description with a real use case
[ ] README fits above the fold; screenshot or GIF present
[ ] npm install from a clean clone works exactly as documented
[ ] CI badge links to a workflow that actually runs tests
[ ] No repository is 100% generated boilerplate with none of your own changes
[ ] Commit history shows incremental work, not a single import
[ ] At least one repo documents a rejected alternative
[ ] Dead links, demo credentials and TODO walls removed`,
        description: "Run this over your profile once a quarter; each unchecked item is an hour of high-value work.",
      },
    ],
    commonMistakes: [
      "Publishing twenty small tutorial repos, which dilutes attention and signals following rather than building.",
      "Leading with a stack list (React, Node, MongoDB) instead of the problem the project solves.",
      "Broken READMEs: install steps that fail, demo links that are down, badges for CI that never ran.",
      "Exaggerating scale or impact; one interviewer question about real traffic exposes it immediately.",
    ],
    bestPractices: [
      "Pin your best three or four repositories and write their descriptions as one-line value statements.",
      "Deploy something and link it; a working demo answers 'does this actually run?' instantly.",
      "Keep one repository continuously maintained; recent commits prove current habits.",
      "Write an 'extending this' or 'what I would change' section; it invites the follow-up question you want.",
    ],
    realWorldUseCases: [
      "First-job applications: a repository with tests and CI answers 'can they work without supervision?' before the interview.",
      "Freelance conversations: a live demo plus a short README shortens the trust-building phase.",
      "Open source credibility: a maintained portfolio makes maintainers more willing to review your first contribution.",
    ],
    resources: [
      docs(
        "GitHub: Managing your profile README",
        "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme",
        "How the special username repository works and what GitHub surfaces on your profile.",
      ),
      docs(
        "GitHub: Quickstart for repositories",
        "https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories",
        "Creating repositories with descriptions, topics, READMEs and a license from the start.",
      ),
      ytSearch(
        "developer portfolio review and improvements",
        "Critiques of real portfolios that show what reviewers actually notice.",
        "en",
        "10-25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-portfolio-audit",
        title: "Audit your own profile",
        prompt: `
Open your GitHub profile as if you had never met you. Apply the checklist in this lesson and write a report:
1. what a reviewer learns in the first 30 seconds;
2. which repositories you would unpin and why;
3. the three concrete changes you will make this month, with time estimates.

Then make the highest-value change before doing anything else.
        `,
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Read only the first screen of each README; that is all most reviewers read.",
          "A broken demo link costs more than a missing feature.",
        ],
        solution:
          "Model answer outline: (1) first 30 seconds findings, whether one-sentence summaries are present, whether the pinned set shows range, whether activity looks current; (2) unpin reasoning based on boilerplate, abandonment, or duplicated purpose; (3) three changes ranked by value per hour, for example rewrite the top README opening paragraph (30 min), add a CI workflow that runs the existing tests (1h), deploy the API and fix the demo link (2h); (4) evidence that the first change was made. Graded on specificity and prioritisation, not on which repositories were chosen.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-capstone"],
  },
  {
    ...shared,
    id: "p3m7-readme-presentation",
    slug: "readme-presentation",
    title: "README & Project Presentation",
    description:
      "Structure, tone and evidence for a README that lets a stranger run your project in minutes and understand why it exists.",
    order: 14,
    estimatedMinutes: 15,
    tags: ["readme", "documentation", "presentation", "github"],
    prerequisites: ["p1m3-readme-files", "p3m7-technical-documentation", "p3m7-portfolio-development"],
    relatedTopics: ["p3m7-technical-documentation", "p3m7-portfolio-development", "p1m3-readme-files"],
    learningObjectives: [
      "Structure a README around the reader's questions in the order they ask them",
      "Write an opening paragraph that states the problem, not the tech stack",
      "Produce a quickstart that works verbatim from a clean clone",
      "Present screenshots, configuration and limitations honestly",
    ],
    simpleExplanation:
      "A README is the front door: a stranger decides in seconds whether your project is worth their time. Answer five questions in order, what is it, why would I care, how do I run it, how do I use it, what should I watch out for, and give commands they can paste without editing.",
    detailedContent: `
The README is not for you; you already know what the project does. Write it for the person who arrived from a search result with no context and roughly ninety seconds of patience.

**The opening.** One or two sentences: the problem, for whom, and what your solution gives them. "A rate limiter for Express using a sliding window, with an in-memory fallback" beats "a full-stack application built with React, Node.js, Express, MongoDB and Docker"; the second sentence describes implementation, which the reader discovers in section three anyway.

**The structure that matches the reader's questions:**

1. **Name and one-line pitch**, what and why.
2. **Demo** — a screenshot or GIF above the fold; nothing sells utility like seeing it work.
3. **Install and quickstart** — copy-pasteable commands with expected output, plus requirements (Node version, external services).
4. **Usage** — the two or three most common calls, with real input and output.
5. **Configuration** — every environment variable in a table: name, purpose, default, required?
6. **Testing and scripts** — how to run the suite and what it covers.
7. **Architecture and decisions** — a short section or a link to \`docs/\` for readers who want depth.
8. **Limitations and roadmap** — honest boundaries build more trust than a feature list.
9. **License, contributing, contact.**

**Evidence over adjectives.** "Blazing fast" means nothing; "handles 4,000 req/s on a 2-vCPU container, benchmark script in /bench" means something. Badges are fine only when each one links to a real pipeline, coverage report or published version, because a badge for a workflow that does not exist is worse than no badge.

Keep the README to what a newcomer needs to get started; deeper material belongs in \`docs/\`, linked from here.
    `,
    howItWorks: `
GitHub renders Markdown from \`.github/README.md\`, the repository root, or \`docs/\` in that precedence order, and auto-generates a table of contents from your headings, which is another reason heading hierarchy matters. Relative links and image paths resolve against the current branch, so links survive forks and clones while absolute URLs may not.

Practically, the README is executed as often as it is read: the install and start commands become the first thing a contributor runs, and the first thing CI should be able to reproduce. Treating the quickstart as an executable contract, a job that literally runs those commands on a clean machine, is how READMEs stop roting. The same content usually feeds your project's landing page, your portfolio summary, and the answer to "so what does your project do?" in an interview, which is why investing an hour here has unusually high leverage.
    `,
    codeExamples: [
      {
        title: "Before: stack list with no path forward",
        language: "markdown",
        code: `# MyProject

A MERN stack application using React, Node, Express and MongoDB.
Built during my course.

## Features
- Authentication
- CRUD operations
- Dashboard

## Setup
npm install
npm run dev`,
        description:
          "Nothing here says what problem it solves, what to expect, which env vars exist, or what the dashboard shows.",
      },
      {
        title: "After: problem-first, runnable, honest",
        language: "markdown",
        code: `# bookable, self-hosted room booking for small teams

Avoids the double-booking problem with a per-slot unique constraint, so
two people cannot claim the same room even when requests race.

![booking flow](docs/screenshot.gif)

## Quickstart
Requirements: Node 20+, PostgreSQL 16.

    git clone <repo> && cd bookable
    cp .env.example .env        # then set DATABASE_URL
    npm install
    npm run migrate && npm run seed
    npm test                    # 84 passing
    npm run dev                 # http://localhost:3000

## Usage
POST /v1/bookings with Idempotency-Key returns 201, or 409 when the slot is taken.

## Configuration
| Variable     | Purpose          | Default | Required |
|--------------|------------------|---------|----------|
| DATABASE_URL | Postgres connection | —     | yes      |

## Limitations
Single-region only, no i18n. See docs/DESIGN.md for the trade-offs.

MIT licensed, see LICENSE.`,
        description:
          "Problem, visual proof, verbatim quickstart, a real configuration table and honest limits, all above the second screen.",
      },
    ],
    commonMistakes: [
      "Opening with the tech stack instead of the problem, so the reader never learns why to care.",
      "Quickstart commands that fail from a clean clone (missing env vars, undocumented migrations).",
      "Claiming performance or reliability you have not measured, or showing fake or stale badges.",
      "Duplicating the entire architecture in the README instead of linking to docs for depth.",
    ],
    bestPractices: [
      "Test the README with someone, or in a fresh container, who has never seen the project.",
      "Put a GIF or screenshot above the fold; visual proof beats a paragraph.",
      "Keep one source of truth: link to docs rather than restating them where they will drift.",
      "Update the README in the same pull request as the behaviour change it describes.",
    ],
    realWorldUseCases: [
      "Adoption: a clear quickstart is the difference between a starred repository and one abandoned after cloning.",
      "Interviews: 'walk me through your project' is answered by a README you have already structured.",
      "Handover: when a teammate takes over, the README is the onboarding document.",
    ],
    resources: [
      docs(
        "GitHub: About the repository README file",
        "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes",
        "What GitHub surfaces, file locations, auto-generated table of contents and relative link behaviour.",
      ),
      article(
        "Make a README",
        "https://www.makeareadme.com/",
        "makeareadme.com",
        "A short, classic guide to what belongs in a README and how to structure it.",
        { estimatedDuration: "10 min" },
      ),
      ytSearch(
        "rewriting a project README step by step",
        "Before and after walkthroughs that show what reviewers notice first.",
        "en",
        "8-20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-readme-rewrite",
        title: "Rewrite a README in one hour",
        prompt: `
Take one of your repositories with a weak README. Rewrite it using the structure from this lesson: problem-first opening, working quickstart, usage example with real input and output, configuration table, honest limitations.

Then have someone, or a fresh container, follow your quickstart verbatim and record every point where they had to guess.
        `,
        difficulty: "advanced",
        estimatedMinutes: 60,
        hints: [
          "Copy your own commands from history; do not write them from memory.",
          "If a step needs an env var, say which one and where to get it.",
        ],
        solution:
          "Model answer outline: the rewrite is graded against the structure (pitch, demo, quickstart, usage, config, tests, limitations, license) and against honesty (no unmeasured claims, badges link to real runs). The second half matters as much: a list of guess-points found by a fresh reader (missing Node version, undocumented migration, undefined env var, port conflict) with at least two of them fixed in the README. A README that reads well but fails from a clean clone does not meet the bar.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-chat-app"],
  },
  {
    ...shared,
    id: "p3m7-technical-interview-prep",
    slug: "technical-interview-prep",
    title: "Technical Interview Preparation",
    description:
      "A structured, honest prep plan: mock interviews, project storytelling, handling the unknown, and what interviews can and cannot predict.",
    order: 15,
    estimatedMinutes: 21,
    tags: ["interviews", "career", "communication", "preparation"],
    prerequisites: [
      "p3m7-system-design-fundamentals",
      "p3m7-coding-challenges",
      "p3m7-rest-api-interviews",
      "p3m7-portfolio-development",
    ],
    relatedTopics: ["p3m7-system-design-fundamentals", "p3m7-coding-challenges", "p3m7-portfolio-development"],
    learningObjectives: [
      "Build a time-boxed preparation plan across coding, design and behavioural areas",
      "Tell a project story with context, your specific actions, evidence and what you learned",
      "Handle unknown or partially known questions honestly without freezing",
      "Set realistic expectations about what a single interview can and cannot measure",
    ],
    simpleExplanation:
      "Interview preparation is mostly rehearsal, not discovery: practise the same process you already learned until it is automatic, record yourself doing a mock session, and fix the two or three habits that cost you the most. For project questions, prepare a story with real numbers and your own decisions; for unknown questions, the honest 'here is how I would find out' answer beats a confident guess.",
    detailedContent: `
Treat preparation like training: a plan, measurable reps, and feedback. A workable eight-week shape, adapted to your own gaps:

- **Every week:** two or three coding problems worked fully out loud with the clarify-and-test process, written up in your own words afterwards.
- **Every week:** one design session (mock with a partner or recorded solo) using the clarify, estimate, sketch, deepen, trade-off structure.
- **Once:** audit your portfolio and README so project questions become easy, because you already know the material.
- **Twice:** a full mock interview with someone else, timed, with notes afterwards.

**Project storytelling.** Prepare two or three stories you can steer most behavioural questions toward. Use a light structure: the *context* (scale, constraints, your role), the *decision* (what you chose and why, including what you rejected), the *evidence* (a number: p99 from 900ms to 250ms, review turnaround from five days to one), and the *lesson* (what you would do differently). Specific numbers and an honest drawback are what make a story credible.

**Handling the unknown.** When you do not know, say so, then reason out loud: state what you do know, name the concept you need to confirm, describe how you would verify it (docs, an experiment, a metric), and keep moving. Interviewers are watching how you work with incomplete information, which is the normal condition of the job.

**Honesty about outcomes.** Interview performance is noisy: it samples a few hours, depends on the interviewer's style and the day's questions, and no preparation guarantees an outcome. What preparation does reliably do is raise the floor, remove avoidable mistakes, and give you better questions to ask them in return.
    `,
    howItWorks: `
A technical loop usually has four rounds: a screening conversation, a coding exercise, a system or project design discussion, and a behavioural or team-fit conversation. Each round is graded against a rubric, and understanding the rubric changes your behaviour: coding rounds score communication, correctness, testing and complexity, not just the final answer; design rounds score requirement clarification, structured reasoning and trade-off awareness; behavioural rounds score self-awareness and evidence.

The feedback loop is where improvement happens. Record or transcribe a mock, then mark only the three biggest gaps, for example: silently coding for eight minutes without a plan, never stating complexity, or answering a project question without a number. Fix one gap per week with a targeted rep. Spreading attention across everything at once is why people can practise for months without improving: they never isolate a habit long enough to change it.
    `,
    codeExamples: [
      {
        title: "A one-page prep plan",
        language: "text",
        code: `Weeks 1-8   (adjust to your gaps)

Mon  45m  coding problem, out loud, with complexity stated
Wed  45m  design session: clarify, estimate, sketch, deep dive, trade-offs
Fri  30m  write-up of the week: what mistake did I repeat?
Sun  60m  mock interview with a partner, or recorded solo + review

Once:     portfolio audit + README rewrite (lesson 13 and 14)
Twice:    full loop simulation with feedback from another person

Feedback rule: after each mock, list every gap, then pick ONE to fix
next week. The other gaps stay on the list; they are not forgotten.`,
        description: "Deliberate practice: fewer targets, repeated, with a single focus per cycle.",
      },
      {
        title: "Handling a question you do not know",
        language: "text",
        code: `Weak:  "I have never used that, next question?"
       (ends the conversation, hides your reasoning)

Strong: "I have not worked with that specific tool. I know the category
         problem it solves, X. My understanding is that it differs from Y
         in Z, and I would confirm the details in the docs before
         relying on it. In production I handled the same need with A,
         here is how that went..."
       (states the boundary, reasons from what you know, shows how
        you verify, keeps the floor from collapsing)`,
        description: "Confident guessing is the fastest way to lose an interviewer's trust; a bounded, reasoned answer keeps it.",
      },
    ],
    commonMistakes: [
      "Grinding new problems weekly without reviewing your own recurring mistakes, so nothing compounds.",
      "Memorising design answers instead of practising the method, which collapses the moment the prompt differs.",
      "Rambling project stories with no numbers and no mention of what you personally decided.",
      "Treating a rejection as a verdict on ability rather than as one noisy sample, and stopping all practice.",
    ],
    bestPractices: [
      "Practise under realistic conditions: timed, out loud, without an editor autocomplete crutch.",
      "Prepare questions for the interviewers; the conversation is two-way and good questions signal judgement.",
      "Sleep and schedule matter more than one extra problem the night before.",
      "Keep a short list of your two or three recurring gaps and check them before every mock.",
    ],
    realWorldUseCases: [
      "On-site loops: a rehearsed structure keeps you composed across four consecutive rounds.",
      "Career transitions: a prepared project story lets you redirect questions toward your strongest work.",
      "Design reviews at work: the same clarify-estimate-trade-off method improves real architecture meetings.",
    ],
    resources: [
      article(
        "Google Engineering Practices: Code Review Developer Guide",
        "https://google.github.io/review/reviews.html",
        "google.github.io",
        "How engineers at scale review code, which is what your own code will be judged against after hiring.",
        { estimatedDuration: "20 min" },
      ),
      article(
        "Tech Interview Handbook",
        "https://www.techinterviewhandbook.org/",
        "techinterviewhandbook.org",
        "Structured, free preparation material covering coding, system design and behavioural rounds.",
      ),
      ytSearch(
        "mock technical interview walkthrough with feedback",
        "Full mock sessions with an evaluator explaining what scored and what did not.",
        "en",
        "20-60 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m7-mock-interview",
        title: "Run a complete mock round",
        prompt: `
Run a 45-minute mock interview with a partner, or record yourself solo:
10 minutes of clarifying questions, 20 minutes of problem solving, 10 minutes of follow-ups ("can you test the empty case?", "what changes at 10x?"), 5 minutes of your questions for them.

Afterwards, write a debrief: three things that went well, three gaps, and the single gap you will fix before the next mock. If you had a partner, include their notes verbatim.
        `,
        difficulty: "advanced",
        estimatedMinutes: 60,
        hints: [
          "Use a timer and do not pause it; the point is rehearsing under constraint.",
          "The debrief is the deliverable; a mock without one is only practice of your current habits.",
        ],
        solution:
          "Model answer outline: (1) the mock followed a structure with clarifying questions up front, not after coding started; (2) at least one edge case tested without prompting and complexity stated without being asked; (3) a debrief with exactly three strengths, three gaps written as observable behaviours (silence for two minutes, no complexity statement, story with no numbers), and one chosen focus; (4) concrete next rep scheduled with the same focus. Graded on the presence and specificity of the debrief rather than on the problem being solved correctly.",
        solutionLanguage: "text",
      },
      {
        id: "ex-p3m7-story-prep",
        title: "Prepare two project stories",
        prompt:
          "Write two project stories in the context, decision, evidence, lesson structure, with at least one hard number in each and one honest drawback you would admit to. Then map each story to at least four different behavioural prompts (a conflict, a failure, a trade-off, a time you influenced someone).",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "If you cannot find a number, you do not yet know the impact of your own work.",
          "The drawback is not a humble-brag; pick a real one.",
        ],
        solution:
          "Model answer outline: Story A context includes scale and your role in two sentences; decision names at least one rejected alternative and why; evidence is a measured number with its source (from a dashboard, a benchmark, a before and after); lesson is a real change in how you work. Story B covers a different muscle, ideally a failure. Each story is mapped to at least four prompts by varying which paragraph leads. Weak versions are generic (I improved performance), unnumbered, or attribute every outcome to 'we' with no distinguishable contribution.",
        solutionLanguage: "text",
      },
    ],
    projectIds: ["p3-capstone"],
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m7",
  title: "Professional Development Skills",
  description:
    "Versioning judgement, Git safety, review quality, README honesty, indexing reasoning, API contracts, event loop ordering and design process.",
  moduleId: "p3-m7",
  questions: [
    {
      id: "q-p3m7-1",
      type: "multiple-choice",
      prompt:
        "Your library is published as 3.4.1 and consumers install it with ^3.4.1. In one release you add an optional options field, fix a crash on empty config, and change fetchOrder so that it resolves to null instead of throwing for missing records. What is the next version you should publish?",
      options: ["3.4.2", "3.5.0", "4.0.0", "3.4.2-rc.1"],
      correctIndex: 2,
      explanation:
        "A release takes the highest bump any of its changes require. Changing fetchOrder from throwing to resolving null breaks callers whose catch blocks handled the failure, so it is a breaking change and demands a major bump, even though no signature was removed. The fix alone would be a patch and the new optional field alone would be a minor.",
      optionExplanations: [
        "A patch bump covers only backwards-compatible fixes. It would silently ship a breaking behaviour change to everyone on a caret range.",
        "A minor bump would also auto-install the breaking change for every consumer on ^3.4.1.",
        "Correct: the null-instead-of-throw change can break existing callers, so SemVer requires a major bump; the other changes ride along.",
        "A pre-release tag signals an unstable candidate, but it does not make a breaking change acceptable inside the 3.x line.",
      ],
    },
    {
      id: "q-p3m7-2",
      type: "code-output",
      prompt: "What is the exact console output of this script?",
      language: "js",
      code: `console.log("1: start");

setTimeout(() => console.log("4: timer"), 0);

Promise.resolve().then(() => console.log("3: microtask"));

process.nextTick(() => console.log("2: nextTick"));

setImmediate(() => console.log("5: immediate"));

console.log("6: end");`,
      options: [
        "1: start, 6: end, 2: nextTick, 3: microtask, 4: timer, 5: immediate",
        "1: start, 2: nextTick, 3: microtask, 4: timer, 5: immediate, 6: end",
        "1: start, 6: end, 3: microtask, 2: nextTick, 4: timer, 5: immediate",
        "1: start, 2: nextTick, 6: end, 3: microtask, 5: immediate, 4: timer",
      ],
      correctIndex: 0,
      explanation:
        "Synchronous statements always run to completion first, so 1 and 6 print before any callback. After the current operation ends the nextTick queue drains (2), then promise microtasks (3). Only then does the event loop reach the timers phase (4) and the check phase for setImmediate (5).",
      optionExplanations: [
        "Correct: sync 1 and 6, then nextTick, then microtasks, then timers, then setImmediate.",
        "This incorrectly interleaves the synchronous logs with queued callbacks; nothing queued can print before the script finishes.",
        "This swaps nextTick and promise microtasks; process.nextTick callbacks always run before promise jobs.",
        "This places setImmediate before the timer and breaks the synchronous-first rule at the same time.",
      ],
    },
    {
      id: "q-p3m7-3",
      type: "find-bug",
      prompt:
        "A teammate posts these commands in their pull request description as the way they resolved review comments. Which line is the problem, and why?",
      language: "bash",
      code: `git checkout main
git merge feature/login --no-ff
git push --force origin main`,
      options: [
        "git push --force origin main rewrites the shared default branch and can discard commits teammates have already pulled; a normal push, or force-with-lease only on your own branch, is the safe alternative",
        "git merge feature/login --no-ff is wrong because merges should always be fast-forward",
        "git checkout main is the problem; the branch should never be switched during a review",
        "Nothing here is dangerous; this is a normal way to land a pull request",
      ],
      correctIndex: 0,
      explanation:
        "Forcing the default branch replaces remote history with local history. Anyone who had pulled main now has commits that no longer exist upstream, and open pull requests can be left in an inconsistent state. History rewriting is only acceptable on branches nobody else has built on, and even then --force-with-lease is preferable because it refuses to overwrite work you have not seen.",
      optionExplanations: [
        "Correct: force-pushing main destroys shared history; merge the pull request normally or force-with-lease only your own branch.",
        "--no-ff preserves a record that a feature landed as a unit, which is a deliberate and safe choice.",
        "Switching to main before merging is routine; it is not what puts other people's work at risk.",
        "The first two lines are fine, but the final line is destructive on a shared branch.",
      ],
    },
    {
      id: "q-p3m7-4",
      type: "multiple-choice",
      prompt: "You are reviewing a colleague's pull request. Which comment is most likely to improve the code?",
      options: [
        "This is wrong. Please fix it.",
        "LGTM, ship it.",
        "I would not have written it this way.",
        "calculateTotal is being passed amountCents divided by 100 here, but the parameter is documented as dollars, so the value is multiplied by 100 twice and the invoice total is inflated. Suggest passing amountCents directly, or renaming the parameter and updating the caller.",
      ],
      correctIndex: 3,
      explanation:
        "A useful review comment states the observation, the impact, and a concrete suggestion. That structure lets the author verify the claim, understand the severity, and act without a second round of questions. Vague flags, approvals and personal preference give the author nothing to work with.",
      optionExplanations: [
        "Names no location, no impact and no path forward, so the author has to guess what is wrong.",
        "Provides no information at all; rubber-stamp approvals are how defects reach production.",
        "States a preference without a defect or evidence, which invites an unproductive style debate.",
        "Correct: observation (double conversion), impact (inflated invoice totals) and a specific alternative.",
      ],
    },
    {
      id: "q-p3m7-5",
      type: "code-output",
      prompt: "Which index best serves this query, and why?",
      language: "sql",
      code: `SELECT id, total_cents
FROM orders
WHERE customer_id = $1
ORDER BY created_at DESC
LIMIT 20;

-- A: CREATE INDEX idx_created ON orders (created_at);
-- B: CREATE INDEX idx_cust    ON orders (customer_id);
-- C: CREATE INDEX idx_cust_created ON orders (customer_id, created_at DESC);`,
      options: [
        "A, because the query sorts by created_at so a time index is all that matters",
        "B, because filtering by customer_id is the only predicate so any index on it is enough",
        "C, because the equality column leads and the ordering column follows, so the engine seeks to the customer and reads the newest rows in order without sorting",
        "None of them; a primary key index is always sufficient for this query",
      ],
      correctIndex: 2,
      explanation:
        "Composite indexes work like a phone book: you can seek efficiently on the leading column and then take a contiguous, already-ordered slice. With (customer_id, created_at DESC) the planner finds one customer and walks backwards in time, stopping after 20 rows and skipping the sort entirely. A forces a filter over every row in the time range, and B finds all of the customer's orders but must sort them all first.",
      optionExplanations: [
        "A helps the ordering but not the equality filter, so most matching-time rows still get discarded after reading them.",
        "B satisfies the filter but leaves a full sort of that customer's entire history on every request.",
        "Correct: equality column first, ordering column second, which eliminates both the scan and the sort.",
        "A primary key index does not reflect either the customer filter or the time ordering.",
      ],
    },
    {
      id: "q-p3m7-6",
      type: "find-bug",
      prompt: "A project's README opens with the text below. What is the most serious problem with it?",
      language: "markdown",
      code: `# FastQueue

The fastest queue on the planet, guaranteed 10x performance.

## Install
yarn add fastqueue

## Usage
FastQueue.start() // that's it!

## API
Read the source code.`,
      options: [
        "It makes unverifiable performance claims and omits the API documentation, requirements, configuration and license information a reader needs to decide whether the library fits their use case",
        "It uses a level-one heading at the top; headings should all start at level two",
        "It recommends yarn instead of npm, which is not the default package manager",
        "Nothing; short READMEs are always better than long ones",
      ],
      correctIndex: 0,
      explanation:
        "A README exists to answer what this is, why to care, how to run it, how to use it and what to watch out for. Unmeasured superlatives damage credibility, and telling readers to read the source pushes exactly the work the README was supposed to do. The heading level and package manager choice are cosmetic by comparison.",
      optionExplanations: [
        "Correct: the marketing claim is uncheckable, and the missing API, requirements, config and license block adoption.",
        "A single level-one heading for the project title is conventional Markdown, not a defect.",
        "Both package managers are valid; this does not prevent anyone from using the project.",
        "Brevity is fine, but omitting the information a reader needs is not the same as being concise.",
      ],
    },
    {
      id: "q-p3m7-7",
      type: "short-answer",
      prompt:
        "Explain why PUT on a resource should be idempotent, and describe what a client that retries after a timeout gains from that property. Mention what a client must do differently when an endpoint is not idempotent, such as POST.",
      acceptedKeywords: [
        "idempotent",
        "same result",
        "same state",
        "retry",
        "retries",
        "duplicate",
        "safe",
        "multiple times",
        "once",
        "network",
        "timeout",
        "idempotency-key",
        "idempotency key",
        "deduplicate",
        "post",
      ],
      explanation:
        "PUT is a full replacement, so applying it any number of times converges on the same server state as applying it once. That matters because a timeout is ambiguous: the request may have succeeded even though the response was lost, and the client cannot safely assume either way. Because PUT can simply be replayed, a client can retry automatically. POST has no such guarantee, since a replay can create a second resource, so a client using POST must either check for an existing result first or send an idempotency key that lets the server recognise and deduplicate the replay.",
    },
    {
      id: "q-p3m7-8",
      type: "multiple-choice",
      prompt:
        "You are asked to design a URL shortener with roughly 100 million new links per month, a 10:1 read-to-write ratio, and redirects answering in under 50ms at p99. What is the best first move in the conversation?",
      options: [
        "Start drawing the database schema, since data modelling determines everything else",
        "Recommend microservices, because they scale better than a monolith",
        "Clarify scope and constraints: which features are in, the traffic and storage estimates, consistency and TTL behaviour, then agree on them before designing",
        "Choose a NoSQL database, because document stores handle high write volumes best",
      ],
      correctIndex: 2,
      explanation:
        "Design answers are only as good as the requirements they are measured against, so clarifying scope and producing rough numbers comes first: it determines whether you need caching, partitioning or simply a bigger instance. Schema, service boundaries and database choice are decisions that follow from those constraints, not premises to start from.",
      optionExplanations: [
        "Modelling first locks you into a shape before you know the access patterns or scale, which is how schemas end up hostile to the queries.",
        "Architecture style is a response to measured pressure; naming it up front is technology-first thinking.",
        "Correct: clarify, estimate, then design, so every later component can be tied to a stated constraint.",
        "Database selection is a conclusion drawn from access patterns and volume, not an opening move.",
      ],
    },
  ],
};

