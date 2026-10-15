import type { Project } from "@/types";
import { docs } from "../helpers/resources";

/** Phase 1 projects — original specifications authored for this platform. */
export const p1Projects: Project[] = [
  {
    id: "p1-calculator",
    slug: "command-line-calculator",
    title: "Command-Line Calculator",
    description:
      "A terminal calculator that parses arguments, supports multiple operations, and handles invalid input gracefully. Your first complete Node.js CLI program.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "Readline", "process.argv"],
    estimatedHours: 4,
    requiredKnowledge: ["p1m2-functions", "p1m2-conditionals", "p1m3-process-argv"],
    learningObjectives: [
      "Read and validate command-line arguments with process.argv",
      "Separate parsing, validation and calculation into pure functions",
      "Build an interactive REPL loop with the node:readline module",
      "Exit with meaningful status codes for scripts and CI",
    ],
    userStories: [
      "As a user I can run `node calculator.js add 2 3` and see `5`.",
      "As a user I can start an interactive mode and type expressions until I quit.",
      "As a user I see a clear error message (not a stack trace) when I pass non-numbers.",
    ],
    functionalRequirements: [
      "Support operations: add, sub, mul, div, pow, sqrt",
      "Validate that numeric operands are present and finite",
      "Refuse division by zero with a friendly message and exit code 1",
      "Interactive mode: prompt for an operation, then operands, print the result, repeat until `quit`",
      "Print usage help when called with no arguments or with `--help`",
    ],
    milestones: [
      {
        title: "M1 — Argument mode",
        tasks: [
          "Create calculator.js that reads process.argv",
          "Implement add/sub/mul/div as pure functions",
          "Validate input and print friendly errors",
          "Add --help usage text",
        ],
      },
      {
        title: "M2 — Interactive mode",
        tasks: [
          "Add an interactive loop using node:readline/promises",
          "Support pow and sqrt operations",
          "Handle Ctrl+C / stream end gracefully",
        ],
      },
      {
        title: "M3 — Polish",
        tasks: [
          "Extract functions into src/operations.js and unit-test them",
          "Support chained expressions or history (bonus)",
          "Write a README with usage examples",
        ],
      },
    ],
    suggestedStructure: `cli-calculator/
├── calculator.js          # entry point: argv parsing + interactive loop
├── src/
│   ├── operations.js      # pure calculation functions
│   ├── parse.js           # argument parsing & validation
│   └── format.js          # output formatting
├── test/
│   └── operations.test.js
├── package.json
└── README.md`,
    ioExamples: [
      {
        title: "Argument mode",
        input: "node calculator.js add 2 3",
        output: "5",
      },
      {
        title: "Division by zero",
        input: "node calculator.js div 10 0",
        output: "Error: cannot divide by zero",
        language: "bash",
      },
      {
        title: "Interactive mode",
        input: "> mul 4 5\n> quit",
        output: "20\nGoodbye!",
        language: "bash",
      },
    ],
    acceptanceCriteria: [
      "All six operations produce correct results for integer and decimal inputs",
      "Invalid input prints a one-line error and exits with code 1 (no stack trace)",
      "No calculation logic lives inside the readline loop (testable pure functions)",
      "Interactive mode survives invalid input without crashing",
    ],
    tests: [
      "Unit tests for each operation, including edge cases (0, negatives, decimals)",
      "Test that division by zero returns an error result rather than throwing",
      "Test argument parsing: missing operands, unknown operation, non-numeric input",
    ],
    hints: [
      "process.argv looks like ['node', 'calculator.js', 'add', '2', '3'] — the first two entries are not your arguments.",
      "Number('abc') is NaN — use Number.isNaN to validate.",
      "Start with the non-interactive mode; add readline only after the math is correct.",
    ],
    bonusChallenges: [
      "Support a --json flag that prints {\"result\": 42} for scripting",
      "Keep the last 5 results in memory and add a `history` command",
      "Accept expressions like `2 + 3 * 4` with correct operator precedence",
    ],
    commonMistakes: [
      "Using parseInt without a radix and silently accepting '12abc' as 12",
      "Calling process.exit() inside library functions — keep process control in the entry point",
    ],
    referenceLinks: [
      docs("Node.js API — Readline", "https://nodejs.org/api/readline.html", "Official docs for interactive command-line input."),
      docs("Node.js API — process.argv", "https://nodejs.org/api/process.html#processargv", "How command-line arguments are exposed."),
    ],
  },
  {
    id: "p1-notes-cli",
    slug: "notes-manager-cli",
    title: "Notes Manager CLI",
    description:
      "A `notes` command to add, list, remove and search notes, persisted to a JSON file. Learn CRUD on the filesystem plus argument subcommands.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "fs/promises", "JSON", "path"],
    estimatedHours: 6,
    requiredKnowledge: ["p1m1-json", "p1m4-fs-module", "p1m4-reading-writing-files", "p1m3-process-argv"],
    learningObjectives: [
      "Persist data to a JSON file atomically and reload it on start",
      "Structure a CLI around subcommands",
      "Use fs/promises instead of blocking fs callbacks",
      "Design a stable data shape that can grow",
    ],
    userStories: [
      "As a user I can add a note with a title and body: `notes add \"Buy milk\" \"2 bottles\"`.",
      "As a user I can list all notes with their ids and dates.",
      "As a user I can remove a note by id and search notes by keyword.",
    ],
    functionalRequirements: [
      "Store notes in notes.json with { id, title, body, createdAt }",
      "Subcommands: add, list, remove <id>, search <keyword>",
      "Create the storage file on first run if missing",
      "Never destroy existing notes when the file is temporarily invalid — warn and back up the corrupt file",
      "Print human-readable output by default and JSON with --json",
    ],
    milestones: [
      {
        title: "M1 — Storage layer",
        tasks: [
          "Implement loadNotes() and saveNotes() with fs/promises",
          "Generate unique ids (crypto.randomUUID or timestamp counter)",
          "Handle a missing or corrupt notes.json",
        ],
      },
      {
        title: "M2 — Commands",
        tasks: ["add", "list", "remove", "search", "usage help"],
      },
      {
        title: "M3 — Robustness",
        tasks: [
          "Validate required arguments per subcommand",
          "Add --json output mode",
          "Write a README and a few manual test cases",
        ],
      },
    ],
    suggestedStructure: `notes-cli/
├── notes.js               # entry: subcommand router
├── src/
│   ├── storage.js         # load/save notes.json
│   ├── commands/
│   │   ├── add.js
│   │   ├── list.js
│   │   ├── remove.js
│   │   └── search.js
│   └── format.js
├── data/notes.json        # created at runtime (gitignored)
├── package.json
└── README.md`,
    ioExamples: [
      {
        title: "Add and list",
        input: 'notes add "Buy milk" "2 bottles"\nnotes list',
        output: "Added note a1b2\na1b2  Buy milk  2026-10-14",
        language: "bash",
      },
    ],
    acceptanceCriteria: [
      "Notes survive process restarts",
      "Removing a non-existent id prints a clear error and does not corrupt the file",
      "A corrupt notes.json is backed up to notes.json.bak instead of silently overwritten",
    ],
    tests: [
      "Storage round-trip: save then load returns the same array",
      "add then search finds the note; remove then list does not",
      "Corrupt file handling",
    ],
    hints: [
      "Write to a temporary file first, then rename over notes.json — that write is atomic on the same filesystem.",
      "Keep command implementations pure where possible: pass in the notes array, return the new array.",
    ],
    bonusChallenges: [
      "Add `notes update <id>` and colored terminal output",
      "Add categories/tags with filtering",
      "Export notes to Markdown",
    ],
    referenceLinks: [
      docs("Node.js API — fs/promises", "https://nodejs.org/api/fs.html#promises-api", "Promise-based filesystem API."),
      docs("Node.js API — crypto.randomUUID", "https://nodejs.org/api/crypto.html#cryptorandomuuid", "Simple unique id generation."),
    ],
  },
  {
    id: "p1-file-organizer",
    slug: "file-organizer",
    title: "File Organizer",
    description:
      "A script that scans a folder and sorts files into subfolders by extension, with a dry-run mode. Teaches directory traversal and safe file moves.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "fs/promises", "path"],
    estimatedHours: 5,
    requiredKnowledge: ["p1m4-fs-module", "p1m4-path-module", "p1m4-working-directories"],
    learningObjectives: [
      "Read directory contents and distinguish files from folders",
      "Move files safely with rename and cross-device fallback",
      "Implement a dry-run mode that logs planned actions without touching disk",
      "Ignore target folders to avoid infinite organizing loops",
    ],
    userStories: [
         "As a user I can run `organize ./Downloads` and find files grouped into Images/, Documents/, Archives/, Other/.",
         "As a user I can preview the plan with --dry-run before anything moves.",
         "As a user I see a summary of how many files were moved per category when the run finishes.",
       ],
    functionalRequirements: [
      "Map extensions to category folders (configurable object)",
      "Skip the output folders themselves and hidden files",
      "On name collision, append a counter instead of overwriting",
      "Print a summary: N files moved, M conflicts renamed",
    ],
    milestones: [
      {
        title: "M1 — Scan and plan",
        tasks: ["readdir with withFileTypes", "classify by extension", "build a plan array of {from, to}"],
      },
      { title: "M2 — Execute", tasks: ["mkdir -p targets", "move with rename + EXDEV fallback", "collision handling"] },
      { title: "M3 — Safety", tasks: ["--dry-run flag", "confirmation prompt when moving > 50 files", "README"] },
    ],
    suggestedStructure: `file-organizer/
├── organize.js
├── src/
│   ├── scan.js
│   ├── classify.js
│   ├── move.js
│   └── categories.js
├── package.json
└── README.md`,
    acceptanceCriteria: [
      "Running twice in a row is safe (already-sorted files are skipped)",
      "--dry-run moves nothing but prints the full plan",
      "Colliding filenames never overwrite existing files",
    ],
    tests: [
      "classify() maps .png → Images, .pdf → Documents, .xyz → Other",
      "Collision rename: file(1).png, file(2).png",
      "Dry-run leaves the directory byte-identical",
    ],
    hints: [
      "fs.rename throws EXDEV when crossing devices — catch it and fall back to copyFile + unlink.",
      "Always resolve paths with path.resolve so relative arguments behave predictably.",
    ],
    bonusChallenges: ["Undo last run via a manifest file", "Watch mode with fs.watch"],
    referenceLinks: [
      docs("Node.js API — fs", "https://nodejs.org/api/fs.html", "Directory and file operations."),
      docs("Node.js API — path", "https://nodejs.org/api/path.html", "Path manipulation utilities."),
    ],
  },
  {
    id: "p1-contact-manager",
    slug: "json-contact-manager",
    title: "JSON File-Based Contact Manager",
    description:
      "Add, list, update and delete contacts stored in a JSON file, with validation, search and a clean output table. Your first full CRUD data app.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "fs/promises", "JSON", "validation"],
    estimatedHours: 7,
    requiredKnowledge: ["p1m1-json", "p1m2-arrays-objects", "p1m4-fs-module"],
    learningObjectives: [
      "Model entities and enforce validation rules in plain JavaScript",
      "Implement full CRUD against a JSON store",
      "Design searchable fields and simple filters",
      "Keep a clean separation between store, rules and CLI output",
    ],
    userStories: [
      "As a user I can add a contact with name (required), phone, email and notes.",
      "As a user I can list contacts as a table and search by name or phone.",
      "As a user I can update individual fields and delete by id.",
    ],
    functionalRequirements: [
      "Validate: name non-empty; email must contain @ if provided; phone digits/spaces/+ only",
      "Ids are stable (uuid); createdAt/updatedAt tracked",
      "search matches partial name or phone, case-insensitive",
      "Output a aligned table for list; JSON with --json",
    ],
    milestones: [
      { title: "M1 — Store + validation", tasks: ["contacts.json persistence", "validateContact()", "id/timestamp handling"] },
      { title: "M2 — CRUD commands", tasks: ["add", "list", "update", "delete", "search"] },
      { title: "M3 — UX", tasks: ["table formatting", "--json mode", "README with examples"] },
    ],
    suggestedStructure: `contact-manager/
├── contacts.js
├── src/
│   ├── store.js
│   ├── validate.js
│   ├── commands.js
│   └── table.js
├── data/contacts.json
├── package.json
└── README.md`,
    dataModel: `Contact
- id: string (uuid)
- name: string (required, trimmed, 1–120 chars)
- phone?: string
- email?: string (must contain "@" if present)
- notes?: string
- createdAt: ISO string
- updatedAt: ISO string`,
    ioExamples: [
      {
        title: "Add and list",
        input: 'contacts add --name "Amina" --email amina@example.com\ncontacts list',
        output: "ID                                   NAME    EMAIL               \n8f2a…                                 Amina   amina@example.com",
        language: "bash",
      },
    ],
    acceptanceCriteria: [
      "Invalid input is rejected with a specific message before anything is written",
      "update changes only the provided fields and refreshes updatedAt",
      "delete of an unknown id exits with code 1 and a clear message",
    ],
    tests: [
      "Validation rules for name/email/phone",
      "CRUD round-trip against a temp directory",
      "Search finds partial matches case-insensitively",
    ],
    hints: ["Parse flags with a small loop over process.argv — no CLI library required.", "Write tests using a temp directory (os.tmpdir) so your real data is untouched."],
    bonusChallenges: ["Import/export CSV", "Duplicate detection by phone", "Colorized terminal output with ANSI codes"],
    referenceLinks: [docs("Node.js API — os.tmpdir", "https://nodejs.org/api/os.html#ostmpdir", "Safe temp directories for tests.")],
  },
  {
    id: "p1-basic-http-server",
    slug: "basic-http-server",
    title: "Basic HTTP Server",
    description:
      "A zero-dependency HTTP server with routing, JSON responses, 404/405 handling and query parameters. The bridge from CLIs to web backends.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "http module", "JSON"],
    estimatedHours: 8,
    requiredKnowledge: ["p1m1-http", "p1m1-methods", "p1m4-http-module", "p1m4-basic-http-server"],
    learningObjectives: [
      "Create and run an HTTP server with the node:http module",
      "Route by method and path without a framework",
      "Return correct status codes, content types and error bodies",
      "Parse query strings and JSON request bodies",
    ],
    userStories: [
      "As an API consumer I can GET /health and receive {\"status\":\"ok\"}.",
      "As an API consumer I can GET /items and GET /items/:id.",
      "As an API consumer I can POST /items with JSON and receive 201 plus the created item.",
      "As an API consumer I receive JSON 404/405 errors for unknown routes/methods.",
    ],
    functionalRequirements: [
      "Routes: GET /health, GET /items, GET /items/:id, POST /items, DELETE /items/:id",
      "In-memory items store with id, name, price",
      "Validate POST body: name string required, price number ≥ 0; respond 400 with details otherwise",
      "Read PORT from process.env.PORT (default 3000)",
      "Log every request: method, path, status, duration ms",
    ],
    milestones: [
      { title: "M1 — Server + health", tasks: ["createServer", "listen on env PORT", "GET /health", "request logging"] },
      { title: "M2 — Router", tasks: ["method + path matching", "params extraction", "JSON helpers", "404/405"] },
      { title: "M3 — CRUD + validation", tasks: ["in-memory store", "POST validation", "GET by id", "DELETE"] },
    ],
    suggestedStructure: `http-server/
├── server.js               # entry: createServer + listen
├── src/
│   ├── router.js
│   ├── handlers/
│   │   ├── health.js
│   │   └── items.js
│   ├── store.js
│   └── json.js             # sendJson(res, status, body)
├── test/server.test.js     # use node:test + fetch
├── package.json
└── README.md`,
    endpoints: [
      { method: "GET", path: "/health", description: "Liveness probe", auth: "public" },
      { method: "GET", path: "/items", description: "List items", auth: "public" },
      { method: "GET", path: "/items/:id", description: "Fetch one item", auth: "public" },
      { method: "POST", path: "/items", description: "Create an item", auth: "public" },
      { method: "DELETE", path: "/items/:id", description: "Delete an item", auth: "public" },
    ],
    ioExamples: [
      {
        title: "Create an item",
        input: 'curl -X POST http://localhost:3000/items -H "Content-Type: application/json" -d \'{"name":"Keyboard","price":49.9}\'',
        output: '{"id":"1","name":"Keyboard","price":49.9}',
        language: "bash",
      },
      { title: "Missing item", input: "GET /items/99", output: '{"error":"ITEM_NOT_FOUND"}' },
    ],
    acceptanceCriteria: [
      "Server starts with `node server.js` and survives unknown routes without crashing",
      "Every response has the correct status code and content-type: application/json",
      "Invalid JSON body returns 400, not an unhandled exception",
      "Tests run with `node --test` and cover 200, 201, 400, 404, 405 paths",
    ],
    tests: [
      "GET /health returns 200 with status ok",
      "POST /items with invalid body returns 400 with error details",
      "GET /items/unknown returns 404 with ITEM_NOT_FOUND",
      "POST /items on /health path returns 405",
    ],
    hints: [
      "Wrap JSON.parse of the body in try/catch — malformed JSON must become a 400.",
      "Split req.url on '?' to separate the path from searchParams.",
      "Use the built-in test runner (node --test) plus global fetch to test the server on an ephemeral port.",
    ],
    bonusChallenges: [
      "Add ETag/304 support for GET /items",
      "Add a simple token check: Authorization: Bearer dev-token on write routes",
      "Stream a large JSON array response instead of buffering it",
    ],
    commonMistakes: ["Calling res.end() twice when a handler falls through", "Forgetting to consume the request stream, leaving the connection hanging"],
    referenceLinks: [
      docs("Node.js API — http.createServer", "https://nodejs.org/api/http.html#httpcreateuserserverrequestlistener", "Official HTTP server docs."),
      docs("Node.js Test Runner", "https://nodejs.org/api/test.html", "Built-in test runner used by the testing checklist."),
    ],
  },
  {
    id: "p1-weather-client",
    slug: "simple-weather-api-client",
    title: "Simple Weather API Client",
    description:
      "A CLI that calls a public weather API, parses the JSON response, handles failures and displays a forecast. Your first HTTP client.",
    difficulty: "beginner",
    phaseId: "phase-1",
    original: true,
    technologies: ["Node.js", "fetch", "OpenWeatherMap (free tier)", "dotenv-style env vars"],
    estimatedHours: 6,
    requiredKnowledge: ["p1m1-json", "p1m4-env-vars-node", "p1m1-headers"],
    learningObjectives: [
      "Call a third-party HTTP API with the built-in fetch",
      "Read an API key from the environment, never from source code",
      "Handle network errors, non-2xx statuses and unexpected payload shapes",
      "Transform and present remote data cleanly",
    ],
    userStories: [
         "As a user I can run `weather London` and see current temperature, conditions and humidity.",
         "As a user I see a clear message when the city is not found or the API key is missing.",
         "As a user I can pass `--json` and get a machine-readable payload I can pipe into other tools.",
       ],
    functionalRequirements: [
      "Read OPENWEATHER_API_KEY from the environment (no key committed)",
      "Call the free current-weather endpoint and map the response to a compact display",
      "Distinguish error cases: missing key (exit 2), city not found (404), rate limit (429), network failure",
      "Support --json for raw output",
    ],
    milestones: [
      { title: "M1 — HTTP client", tasks: ["fetch with timeout via AbortSignal.timeout", "status handling", "parse JSON safely"] },
      { title: "M2 — Presentation", tasks: ["format temperature unit", "map weather codes to text", "--json mode"] },
      { title: "M3 — Resilience", tasks: ["missing-key message", "404/429 handling", "README with key setup instructions"] },
    ],
    suggestedStructure: `weather-cli/
├── weather.js
├── src/
│   ├── client.js           # fetch wrapper with timeout + errors
│   ├── map.js              # API payload -> display model
│   └── format.js
├── .env.example            # OPENWEATHER_API_KEY=
├── .gitignore              # never commit .env
├── package.json
└── README.md`,
    ioExamples: [
      { title: "Success", input: "weather London", output: "London: 14°C, overcast, humidity 72%" },
      { title: "Missing key", input: "weather Paris", output: "Error: OPENWEATHER_API_KEY is not set (see .env.example)" },
    ],
    acceptanceCriteria: [
      "No secret appears in the repository; .env is gitignored",
      "A 20-second API timeout produces a friendly message instead of hanging forever",
      "Malformed payloads do not crash the process",
    ],
    tests: [
      "map() converts a sample payload fixture into the display model",
      "client() surfaces a typed error for 404 and 429",
      "Missing key exits with code 2",
    ],
    hints: [
      "Use `AbortSignal.timeout(20_000)` as the second argument to fetch for timeouts.",
      "Save one real API response as test/fixture.json so tests never hit the network.",
    ],
    bonusChallenges: ["Add a 3-day forecast mode", "Cache responses for 10 minutes in a local file", "Support metric/imperial units via --units"],
    referenceLinks: [
      docs("OpenWeatherMap API (free tier)", "https://openweathermap.org/api", "Sign up for a free API key; docs describe parameters.", "en", "reference"),
      docs("MDN — Using the Fetch API", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", "Official fetch reference (available in Node.js 18+)."),
    ],
  },
];
