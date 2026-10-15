import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, article, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p1-m3",
  slug: "development-environment-and-git",
  title: "Development Environment & Git",
  description:
    "Set up a professional Node.js development environment on Windows: install Node and npm, choose the right LTS version, configure VS Code and PowerShell, understand package.json, lockfiles, npm scripts, semantic versioning and environment variables — then track everything with Git, from the first commit to pull requests, branches, .gitignore, README files and debugging with breakpoints.",
  phaseId: "phase-1",
  order: 3,
};

const shared = {
  phaseId: "phase-1",
  moduleId: "p1-m3",
  difficulty: "beginner",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p1m3-installing-node",
    slug: "installing-node-js-on-windows",
    title: "Installing Node.js on Windows",
    description:
      "Running the official Windows installer, choosing the right options, verifying node and npm, and refreshing PATH in PowerShell.",
    order: 1,
    estimatedMinutes: 15,
    tags: ["nodejs", "installation", "windows", "setup"],
    prerequisites: [],
    relatedTopics: ["p1m3-choosing-node-lts", "p1m3-terminal-powershell", "p1m3-npm-basics"],
    learningObjectives: [
      "Download and run the official Node.js .msi installer on Windows and select the correct options",
      "Verify the installation with node -v and npm -v in PowerShell",
      "Refresh an open terminal's PATH without restarting Windows",
      "Locate the node and npm executables and the global npm prefix on disk",
    ],
    simpleExplanation:
      "Node.js on Windows is a normal MSI installer: it copies node.exe and npm into C:\\Program Files\\nodejs and adds that folder to your PATH so every terminal can run them. After installing you prove it works by asking two questions — node -v for the runtime and npm -v for the package manager. A terminal you already had open keeps the old PATH, so you either open a new one or refresh PATH manually.",
    detailedContent: `
Installing Node.js on Windows takes about five minutes:

1. Open the official **Downloads** page (link in Resources) in your browser.
2. Download **Windows Installer (.msi), 64-bit**. The site defaults to the Active LTS line, which is exactly what you want.
3. Double-click the .msi, choose *Next*, accept the licence, and keep the default folder \`C:\\Program Files\\nodejs\`.
4. In **Custom Setup** keep every entry selected — in particular *Node.js runtime*, *npm package manager* and *Add to PATH*.
5. Leave *Automatically install the necessary tools. (Chocolatey, Python, Visual Studio Build Tools)* **unchecked** for now. That optional step is only needed when you install packages that compile native code (such as \`bcrypt\`), and it pulls in several gigabytes of build tools.
6. Finish the wizard, then open a **new** PowerShell window.

What the installer actually changes on your machine:

| Change | Where |
| --- | --- |
| \`node.exe\`, \`npm.cmd\`, \`npx.cmd\` | \`C:\\Program Files\\nodejs\\\` |
| System PATH | the nodejs folder appended to the Machine PATH |
| npm global packages | \`%APPDATA%\\npm\` inside your user profile |

Verify from any terminal:

    node -v     # e.g. v24.22.0
    npm -v      # e.g. 11.x.x

\`where.exe node\` prints every node.exe Windows can find, in resolution order. One line means a clean install; several lines mean competing installations, which is worth fixing before anything else confuses you.
    `,
    howItWorks: `
The installer copies a folder of executables and updates the **Machine** PATH environment variable (stored in the registry under the session manager's environment). Windows gives every new process a snapshot of PATH when it starts; running processes keep their old snapshot. That is why a PowerShell window opened before the install still says *'node' is not recognized* — refresh it in the current session:

    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")

npm itself is a Node script wrapped in \`npm.cmd\`. When you type \`npm install express\`, PowerShell resolves \`npm.cmd\` from the nodejs folder, Node executes the npm CLI, and npm places packages inside the current project's \`node_modules\` folder (or the global prefix if you pass \`-g\`).
    `,
    codeExamples: [
      {
        title: "Verify the installation in PowerShell",
        language: "bash",
        code: `# 1. Both tools must answer with a version
node -v
npm -v

# 2. Which binaries is PowerShell actually using?
where.exe node
where.exe npm

# 3. Where will globally installed packages go?
npm config get prefix`,
        description:
          "Run these after a fresh install. Expected shape: v24.x.x, 11.x.x, C:\\Program Files\\nodejs\\node.exe and C:\\Users\\<you>\\AppData\\Roaming\\npm.",
      },
      {
        title: "Refresh PATH in an already-open terminal",
        language: "bash",
        code: `# Re-read Machine + User PATH into THIS session only
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

# node should answer now
node -v`,
        description:
          "Useful after any installer that changes PATH. Closing and reopening the terminal has the same effect — the registry is the source of truth.",
      },
    ],
    commonMistakes: [
      "Reusing the terminal window that was open during the install: environment variables are read at process start, so 'node is not recognized' is almost always a stale terminal, not a broken install.",
      "Mixing installation methods — the MSI plus winget plus a zip download — so where.exe node lists several binaries and npm globals behave unpredictably.",
      "Running PowerShell as Administrator for everyday work: npm then installs global packages into the Administrator profile and your PATH story becomes impossible to explain.",
      "Restarting Windows when a new terminal would do: only Explorer and long-running apps cache the old environment.",
    ],
    bestPractices: [
      "Install the LTS .msi from nodejs.org and keep the default install path unless you have a real reason not to.",
      "Run node -v and npm -v as the first two lines of every environment-setup checklist.",
      "Record your exact versions (node -v, npm -v) in a bug report or a team onboarding doc.",
      "If where.exe node prints more than one path, uninstall the duplicates before debugging anything else.",
    ],
    realWorldUseCases: [
      "Onboarding a new Windows laptop: install the MSI, verify, clone the team repo, npm ci, start coding.",
      "Reproducing a colleague's bug by comparing node -v, npm -v and npm config get prefix before touching code.",
    ],
    resources: [
      docs(
        "Node.js — Downloads",
        "https://nodejs.org/en/download",
        "Official Windows installer (MSI) plus alternative installation methods.",
        "en",
        "5 min",
      ),
      docs(
        "npm — Downloading and installing Node.js and npm",
        "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm",
        "npm's own guide to installing both tools and checking they work.",
        "en",
        "8 min",
      ),
      ytSearch(
        "install node.js on windows powershell verify",
        "Walkthroughs of the MSI installer and the verification commands.",
        "en",
        "5–12 min",
      ),
      docs(
        "Node.js — Getting started",
        OFFICIAL.nodejsLearn,
        "What to read (and run) right after Node.js is installed.",
        "en",
        "10 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-node-install",
        title: "Install and prove it",
        prompt:
          "Install Node.js LTS with the official MSI. Then open a fresh PowerShell and record: (1) node -v, (2) npm -v, (3) where.exe node, (4) npm config get prefix. Finally, deliberately run node -v in a terminal that was opened *before* the install finished, describe the error, and fix it by refreshing PATH with the command from this lesson.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "where.exe lists every node.exe on PATH — the first entry wins.",
          "If the command is not recognized, refresh PATH or simply open a new terminal.",
        ],
        solution: `node -v                 # v24.x.x (Active LTS)
npm -v                  # 11.x.x
where.exe node          # C:\\Program Files\\nodejs\\node.exe
npm config get prefix   # C:\\Users\\<you>\\AppData\\Roaming\\npm

# stale terminal fix
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")
node -v                 # works now`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: [],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-choosing-node-lts",
    slug: "choosing-node-lts",
    title: "Choosing the Right Node.js Version: LTS vs Current",
    description:
      "Release lines, why production runs on LTS, the support schedule, and how to switch versions with nvm-windows or fnm.",
    order: 2,
    estimatedMinutes: 16,
    tags: ["nodejs", "lts", "versioning", "nvm"],
    prerequisites: ["p1m3-installing-node"],
    relatedTopics: ["p1m3-package-json", "p1m3-environment-variables", "p1m3-installing-packages"],
    learningObjectives: [
      "Explain the difference between Current, Active LTS, Maintenance LTS and EOL",
      "Justify why production deployments use Active LTS or Maintenance LTS",
      "Install and switch Node.js versions with a version manager on Windows",
      "Pin a project's runtime with a .nvmrc or .node-version file",
    ],
    simpleExplanation:
      "Node.js ships in release lines. Every major version spends about six months as Current (bleeding edge); the even-numbered ones then become LTS — Long Term Support — meaning critical bugs and security issues are patched for roughly 30 months. Production applications should only run Active LTS or Maintenance LTS, because those are the versions your dependencies, hosting platforms and teammates all support. A version manager such as nvm-windows or fnm keeps several lines installed side by side and switches between them per project.",
    detailedContent: `
**Release statuses**

| Status | Meaning | Use it for |
| --- | --- | --- |
| Current | New major, six months of rapid change | Checking that dependencies work on the next line |
| Active LTS | Even major, hardened, ready for general use | **Production and everyday development** |
| Maintenance LTS | Still receiving critical and security fixes | Finishing your upgrade before end-of-life |
| EOL | No fixes of any kind | Never |

The Node.js project states the rule plainly: production applications should only use Active LTS or Maintenance LTS releases. An LTS line receives critical bug fixes for a total of about 30 months, which gives libraries and hosting platforms time to catch up.

**Choosing for this course.** Install Active LTS. It is what tutorials, cloud providers (Azure, Railway, Render, Vercel) and npm packages are tested against. Peek at Current only when you want to test forward compatibility.

**Switching versions on Windows**

- **nvm-windows** — the classic tool: \`nvm install lts\`, \`nvm use 22.11.0\`, \`nvm list\`. It repoints a system-wide symlink, so an elevated prompt and a fresh terminal are usually required.
- **fnm** — written in Rust, noticeably faster, and it can auto-switch per directory via your PowerShell profile: \`fnm install 22\`, \`fnm use 22\`, \`fnm env --use-on-cd\`.

**Pinning the version** — commit a \`.nvmrc\` (or \`.node-version\`) file whose entire content is the version, for example:

    22

\`nvm use\` (nvm-windows) and \`fnm use\` both read it, teammates get the same runtime, and continuous integration can parse the same file.
    `,
    howItWorks: `
A version manager does not touch the MSI installation. nvm-windows downloads official binaries into its own folder (typically under your user profile, controlled by the NVM_HOME environment variable) and repoints the nodejs PATH entry to the selected version. Because PATH is captured when a process starts, already-open terminals keep showing the previous version until you open a new one.

fnm takes a different route: instead of a system-wide symlink it prepends the chosen version's directory to PATH for the current shell session only, which is why it needs a line in your PowerShell profile (\`fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression\`) and why it never requires elevation. Both tools read \`.nvmrc\` so the directory you are in decides the runtime.
    `,
    codeExamples: [
      {
        title: "Install and switch versions with nvm-windows",
        language: "bash",
        code: `# elevated PowerShell (nvm-windows updates a system-wide link)
nvm install lts         # download the newest LTS line
nvm install 22.11.0     # or pin an exact version
nvm list                # everything installed
nvm use 22.11.0         # switch

# open a NEW terminal, then confirm
node -v
npm -v`,
        description:
          "nvm install can fetch both LTS and Current lines; nvm use decides which one node.exe resolves to system-wide.",
      },
      {
        title: "fnm plus a committed .nvmrc",
        language: "bash",
        code: `# one-time setup, added to $PROFILE
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression

# inside the project folder
Set-Content -Path .nvmrc -Value "22"
fnm use                  # reads .nvmrc
node -v                  # v22.x.x for this folder only`,
        description:
          "Commit .nvmrc to the repository. Everyone (and CI) then defaults to the same major line the moment they enter the project.",
      },
    ],
    commonMistakes: [
      "Shipping the newest Current release to production because it is newer: native modules and libraries lag behind, and the line reaches end-of-life in months.",
      "Calling nvm use in a terminal that is already open and seeing the old version — open a new shell or check where.exe node.",
      "Assuming global packages follow you between versions: globals are installed per Node.js version, which is why dependencies belong in package.json.",
      "Letting every developer pick a different major version, then debugging 'works on my machine' failures for a week.",
    ],
    bestPractices: [
      "Standardise on one Active LTS line for the whole team and commit it as .nvmrc.",
      "Declare the requirement in package.json as well: \"engines\": { \"node\": \">=22 <23\" }.",
      "Check the official release schedule each quarter and upgrade before your line hits end-of-life.",
      "Prefer a version manager over downloading a second MSI whenever you need another version.",
    ],
    realWorldUseCases: [
      "A CI pipeline installs exactly the major version from .nvmrc so tests run on the same runtime developers use.",
      "An agency keeps one client project on Node 22 and another on Node 24, switching with a single command instead of reinstalling.",
    ],
    resources: [
      docs(
        "Node.js — Releases and support schedule",
        "https://nodejs.org/en/about/previous-releases",
        "Official statuses for every major line: Current, Active LTS, Maintenance LTS and EOL.",
        "en",
        "5 min",
      ),
      docs(
        "Node.js — Release Schedule",
        "https://nodejs.org/en/about/releases",
        "The schedule table teams use to plan upgrades.",
        "en",
        "reference",
      ),
      article(
        "nvm-windows — Node version manager for Windows",
        "https://github.com/coreybutler/nvm-windows",
        "github.com",
        "Official repository and README: install, nvm use, nvm list and settings.",
        { resourceType: "tool", estimatedDuration: "10 min" },
      ),
      article(
        "fnm — Fast Node Manager",
        "https://github.com/Schniz/fnm",
        "github.com",
        "Official repository: installation and the PowerShell --use-on-cd setup.",
        { resourceType: "tool", estimatedDuration: "10 min" },
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-node-versions",
        title: "Two versions, one machine",
        prompt:
          "Install nvm-windows (or fnm). Install two lines — 22 and 24 — switch between them and record node -v from a fresh terminal after each switch. Then add a .nvmrc to a project folder, run the manager's use command with no arguments, and confirm the folder always starts on that version.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "nvm-windows: nvm install <version> followed by nvm use <version>.",
          "Terminals must be reopened after a switch because PATH is captured at start-up.",
        ],
      },
    ],
    projectIds: [],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-vscode-setup",
    slug: "visual-studio-code-setup",
    title: "Setting Up Visual Studio Code",
    description:
      "The editor, the essential extensions, workspace settings.json, workspace trust and the integrated terminal.",
    order: 3,
    estimatedMinutes: 14,
    tags: ["vscode", "editor", "tooling"],
    prerequisites: ["p1m3-installing-node"],
    relatedTopics: ["p1m3-terminal-powershell", "p1m3-debugging-breakpoints", "p1m3-git-fundamentals"],
    learningObjectives: [
      "Install VS Code and open a project folder as a workspace",
      "Install ESLint, Prettier and an HTTP client extension",
      "Write a workspace settings.json that formats and lints on save",
      "Explain workspace trust and use the integrated terminal productively",
    ],
    simpleExplanation:
      "Visual Studio Code is the free editor most Node developers use. Two habits matter from day one: open the *project folder* rather than a single file, so the terminal, search and Git all know where you are, and keep shared configuration in a committed .vscode/settings.json so every teammate formats code identically. Its integrated terminal (Ctrl+`) means you never leave the editor to run npm run dev or git status.",
    detailedContent: `
**Install and first run**

1. Download the Windows installer from the official VS Code site and run it — keep *Add to PATH* and *Register Code as an editor* selected.
2. **File → Open Folder…** and pick your project root. Opening a lone file leaves the terminal in an arbitrary directory and hides Git status entirely.

**Extensions to install first** (Ctrl+Shift+X):

| Extension | Extension id | Why |
| --- | --- | --- |
| ESLint | \`dbaeumer.vscode-eslint\` | Inline diagnostics from the project's ESLint config |
| Prettier | \`esbenp.prettier-vscode\` | One formatter for JS, TS, JSON, Markdown and CSS |
| Thunder Client | \`rangav.vscode-thunder-client\` | Call your REST API from inside the editor (Postman alternative) |

**Workspace trust.** The first time you open a folder, VS Code asks whether you trust it. Trusting lets tasks, debugging and extensions execute code from that folder. Only trust repositories you created or cloned from sources you know — a hostile repository can run arbitrary commands through tasks the moment you trust it.

**Integrated terminal.** Ctrl+\` opens a shell in the workspace root, Ctrl+Shift+\` starts a second one, and splitting the panel gives you a runner and a Git shell side by side. Set the default profile to PowerShell so the commands in this course work verbatim.

Shared editor behaviour belongs in **\`.vscode/settings.json\`**, which you commit; personal preferences such as font size stay in your user settings.
    `,
    howItWorks: `
\`.vscode/settings.json\` is ordinary JSON that the editor reads when the folder opens. Settings cascade in three layers — built-in defaults, your user settings (Ctrl+,) and workspace settings — and the most specific layer wins. That is why format-on-save configured in the workspace behaves identically for everyone on the team, while your colour theme stays personal.

The ESLint extension does not bundle ESLint: it finds the \`eslint\` package inside the project's \`node_modules\\.bin\` and runs it against open files, streaming problems into the editor as you type. Prettier runs on save when \`editor.formatOnSave\` is enabled. Because both tools are declared as devDependencies in package.json, a fresh clone lints and formats exactly like your machine.
    `,
    codeExamples: [
      {
        title: ".vscode/settings.json (workspace, committed to Git)",
        language: "json",
        code: `{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript"],
  "files.eol": "\\n",
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}`,
        description:
          "\"files.eol\": \"\\n\" keeps line endings consistent with Git settings on every platform. \"source.fixAll.eslint\": \"explicit\" is the current value format — older docs show true.",
      },
      {
        title: "Install the extensions from the terminal",
        language: "bash",
        code: `code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension rangav.vscode-thunder-client`,
        description:
          "If 'code' is not recognized, press Ctrl+Shift+P and run \"Shell Command: Install 'code' command in PATH\", then reopen the terminal.",
      },
    ],
    commonMistakes: [
      "Trusting every folder VS Code opens — tasks and extensions can execute code from the repository the moment you do.",
      "Keeping formatting rules only in personal user settings, so every teammate's editor disagrees and pull requests fill up with whitespace noise.",
      "Opening a single file instead of the folder, then wondering why the terminal starts in the wrong directory and Git shows nothing.",
      "Running ESLint and Prettier on the same rule and watching them fight; disable overlapping rules once in the ESLint config instead.",
    ],
    bestPractices: [
      "Commit .vscode/settings.json with the settings the whole team wants; leave personal preferences in user settings.",
      "Let the project's devDependencies provide ESLint and Prettier versions, so tooling matches CI.",
      "Use the integrated terminal so the working directory always equals the open workspace.",
      "Test your API with Thunder Client (or curl) without switching windows while you write the handler.",
    ],
    realWorldUseCases: [
      "A teammate clones the repository and immediately gets the same formatter, lint rules and terminal profile as everyone else.",
      "Splitting the editor: Thunder Client on the left sending POST /login, server code on the right, terminal at the bottom streaming logs.",
    ],
    resources: [
      docs(
        "VS Code — Node.js tutorial",
        "https://code.visualstudio.com/docs/nodejs/nodejs-tutorial",
        "Microsoft's guide to running and debugging Node.js inside VS Code.",
        "en",
        "15 min",
      ),
      docs(
        "VS Code — Settings",
        "https://code.visualstudio.com/docs/getstarted/settings",
        "How default, user and workspace settings combine.",
        "en",
        "10 min",
      ),
      docs(
        "VS Code — Workspace Trust",
        "https://code.visualstudio.com/docs/editor/workspace-trust",
        "What trusting a folder actually enables and how to restrict it.",
        "en",
        "8 min",
      ),
      docs(
        "VS Code — Terminal basics",
        "https://code.visualstudio.com/docs/terminal/basics",
        "Profiles, splitting panes and choosing a default shell.",
        "en",
        "10 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-vscode",
        title: "Configure the workspace",
        prompt:
          "Create .vscode/settings.json with format-on-save and Prettier as the default formatter. Install the three extensions from the terminal using code --install-extension. Paste a badly formatted JavaScript file, save it, and report exactly what changed. Finally: what does the Workspace Trust dialog offer, and which option should you pick for a repository cloned from a stranger?",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "Ctrl+Shift+X opens the extensions view; Ctrl+, opens settings.",
          "Prettier must be available — as the extension or as a devDependency.",
        ],
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-terminal-powershell",
    slug: "terminal-powershell-basics",
    title: "The Terminal: PowerShell Basics",
    description:
      "Navigating folders, pipelines, aliases versus real commands, profiles, and the gotchas Windows developers hit coming from bash.",
    order: 4,
    estimatedMinutes: 18,
    tags: ["powershell", "terminal", "windows"],
    prerequisites: ["p1m3-installing-node"],
    relatedTopics: ["p1m3-vscode-setup", "p1m3-npm-scripts", "p1m3-git-fundamentals"],
    learningObjectives: [
      "Navigate the filesystem and run Node.js scripts from PowerShell",
      "Build a pipeline that filters, sorts and displays command output",
      "Resolve any alias to its real command with Get-Alias and Get-Command",
      "Create a PowerShell profile and name the main differences from bash",
    ],
    simpleExplanation:
      "PowerShell is the Windows terminal you will live in. It looks like bash — cd, ls and cat all work — but those names are *aliases* for real commands such as Set-Location and Get-ChildItem. The big difference is that PowerShell pipes *objects* instead of text, so downstream commands receive structured data they can filter and sort. Learn the navigation commands plus one pipeline and you can drive Git, npm and Node.js entirely from the keyboard.",
    detailedContent: `
**Navigation**

| Task | PowerShell | bash equivalent |
| --- | --- | --- |
| List files | \`ls\` / \`dir\` (Get-ChildItem) | \`ls\` |
| Change folder | \`cd src\` (Set-Location) | \`cd src\` |
| Where am I? | \`pwd\` (Get-Location) | \`pwd\` |
| Make a folder | \`mkdir src\` (New-Item) | \`mkdir -p src\` |
| Read a file | \`Get-Content package.json\` (\`cat\`) | \`cat package.json\` |
| Clear the screen | \`cls\` (Clear-Host) | \`clear\` |
| Previous folder | Push-Location / Pop-Location | \`cd -\` |

**Pipelines.** Each stage receives objects, not strings:

    Get-ChildItem *.ts | Where-Object { $_.Length -gt 10KB } |
      Sort-Object Length -Descending | Select-Object Name, Length

\`$_\` is the current object in the pipeline. \`Where-Object\` is the filter; \`Select-String pattern file\` is the cmdlet that really searches *text* inside files, the way grep does.

**Aliases versus real commands.** \`Get-Alias ls\` reveals the underlying cmdlet, and \`Get-Command npm\` shows whether npm is an alias, a function or the external \`npm.cmd\`. When a bash snippet misbehaves on Windows, this is the first diagnostic to run.

**Profiles.** \`$PROFILE\` is a script executed when PowerShell starts — the home of your prompt, aliases and version-manager hooks. Create it once:

    if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Force $PROFILE }
    notepad $PROFILE
    `,
    howItWorks: `
When you type \`ls *.ts | Sort-Object Name\`, PowerShell parses the line, resolves each name (alias, then function, then cmdlet, then external program) and connects the stages by handing .NET objects down the pipe. No text re-parsing happens, which is why \`Get-Process | Where-Object { $_.CPU -gt 100 }\` can filter on a numeric property directly.

External programs such as node, npm and git are the exception: their stdout is plain text, so you wrap the output with Select-String or ConvertFrom-Json to get objects back. The profile runs once per new shell session, which is why profile edits need a fresh terminal — and why VS Code must start new terminal instances (or reload the window) to pick them up.
    `,
    codeExamples: [
      {
        title: "Daily navigation and running Node.js",
        language: "bash",
        code: `cd .\\projects\\notes-cli      # backslashes or forward slashes both work
ls                            # Get-ChildItem
mkdir src                     # New-Item -ItemType Directory
node .\\src\\index.js
Get-Content .\\package.json    # cat package.json
Set-Location ..               # cd ..`,
        description:
          "The eight commands you will type hundreds of times a week. Everything here also works inside VS Code's integrated terminal.",
      },
      {
        title: "A real pipeline, plus resolving aliases",
        language: "bash",
        code: `# five largest .js files, skipping node_modules — objects all the way
Get-ChildItem -Recurse -File -Filter *.js |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Sort-Object Length -Descending |
  Select-Object -First 5 FullName, Length

# what do the friendly names actually run?
Get-Alias ls
Get-Alias cat
Get-Command npm

# where would my profile live?
$PROFILE`,
        description:
          "Where-Object filters objects; Select-String would search file contents. Get-Command tells you if npm resolves to npm.cmd on PATH.",
      },
    ],
    commonMistakes: [
      "Copying bash one-liners with && — Windows PowerShell 5.1 does not support it (PowerShell 7 does). Chain safely with: cmd1; if ($?) { cmd2 }.",
      "Using rm -r folder, which does not exist: Remove-Item -Recurse -Force folder is the PowerShell way.",
      "Expecting Where-Object to search file contents — it filters objects in the pipeline; use Select-String for text inside files.",
      "Editing $PROFILE and seeing no effect: the file only runs when a new shell starts.",
    ],
    bestPractices: [
      "Make PowerShell the default integrated-terminal profile so every command in documentation works unchanged.",
      "Use full cmdlet names in scripts (Get-ChildItem) and enjoy aliases interactively.",
      "Keep $PROFILE small: prompt, PATH additions, fnm env hook, a couple of aliases.",
      "Use Push-Location and Pop-Location to hop between folders in long sessions instead of retyping paths.",
    ],
    realWorldUseCases: [
      "Debugging a 'file not found' report with Get-Location and Test-Path before assuming your code is broken.",
      "Cleaning old logs automatically: Get-ChildItem *.log | Where-Object LastWriteTime -lt (Get-Date).AddDays(-7) | Remove-Item.",
    ],
    resources: [
      docs(
        "Microsoft Learn — PowerShell overview",
        "https://learn.microsoft.com/en-us/powershell/scripting/overview",
        "Official starting point for PowerShell concepts and learning paths.",
        "en",
        "10 min",
      ),
      docs(
        "Microsoft Learn — about_Profiles",
        "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles",
        "Where the profile lives, when it runs and how to create it.",
        "en",
        "8 min",
      ),
      docs(
        "Microsoft Learn — about_Command_Precedence",
        "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_command_precedence",
        "How PowerShell chooses between an alias, a function, a cmdlet and an external program.",
        "en",
        "10 min",
      ),
      ytSearch(
        "powershell for developers vs bash",
        "Side-by-side comparisons of bash habits and their PowerShell equivalents.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-powershell",
        title: "Pipeline and profile",
        prompt:
          "In PowerShell: (1) list the five largest files under your project folder while excluding node_modules; (2) find out what ls and cat really are; (3) add a custom alias ll to $PROFILE, open a NEW terminal and prove the alias works. Paste the commands you used.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "Get-ChildItem -Recurse -File combined with Where-Object { $_.FullName -notmatch 'node_modules' }.",
          "Set-Alias ll Get-ChildItem belongs in $PROFILE.",
        ],
        solution: `Get-ChildItem -Recurse -File |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Sort-Object Length -Descending |
  Select-Object -First 5 FullName, Length

Get-Alias ls        # -> Get-ChildItem
Get-Alias cat       # -> Get-Content

if (!(Test-Path $PROFILE)) { New-Item -ItemType File -Force $PROFILE }
Add-Content $PROFILE 'Set-Alias ll Get-ChildItem'
# open a NEW terminal, then:
ll`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-npm-basics",
    slug: "npm-basics",
    title: "npm Basics: Registry, Init and Local vs Global",
    description:
      "What the npm registry actually is, starting a project with npm init, and why local installs beat global ones.",
    order: 5,
    estimatedMinutes: 15,
    tags: ["npm", "packages", "registry"],
    prerequisites: ["p1m3-installing-node"],
    relatedTopics: ["p1m3-package-json", "p1m3-installing-packages", "p1m3-package-lock"],
    learningObjectives: [
      "Explain what the npm registry is and what a published package contains",
      "Create a project with npm init -y and describe the resulting package.json",
      "Distinguish local installs (node_modules) from global installs (-g)",
      "Locate node_modules and the global npm prefix on Windows",
    ],
    simpleExplanation:
      "npm is both a command and a public registry — a huge catalogue of reusable packages published as tarballs. Every Node project starts with npm init, which writes a package.json manifest, and grows by installing packages into a local node_modules folder next to that manifest. Global installs (-g) are reserved for command-line tools you want available in every folder; your application code should only depend on local installs so the project stays portable.",
    detailedContent: `
**The registry in one paragraph.** When you run \`npm install express\`, npm asks the registry (the default is the public registry at npmjs.com) for the express package, downloads the tarball that matches the range recorded in package.json, unpacks it into \`node_modules\`, and records the exact resolved version in \`package-lock.json\`. Private registries (GitHub Packages, Verdaccio, Artifactory) speak the same protocol, so switching later is a config change rather than a rewrite.

**Starting a project**

    mkdir notes-cli
    cd notes-cli
    npm init -y

\`npm init\` writes \`package.json\` — the identity card of the project: name, version, entry point, scripts and dependencies. The \`-y\` flag accepts every default so you can refine the file afterwards.

**Local versus global**

| Command | Where it lands | Use it for |
| --- | --- | --- |
| \`npm install express\` | .\\node_modules\\express in this project | Anything your code imports |
| \`npm install --save-dev vitest\` | same folder, listed under devDependencies | Tests, linters and build tools |
| \`npm install -g nodemon\` | %APPDATA%\\npm (your user prefix) | CLI tools you run from any folder |

Only global tools end up on PATH. A project that "works because nodemon is installed globally" is broken for the next developer and for CI.

**Where things live on Windows**

    npm config get prefix   # e.g. C:\\Users\\<you>\\AppData\\Roaming\\npm
    npm root                # e.g. C:\\projects\\notes-cli\\node_modules
    npm root -g             # the global node_modules folder
    `,
    howItWorks: `
npm resolves a dependency *tree*, not a flat list: express itself depends on dozens of packages, each with their own versions. Since npm 5, an install is two-phase — the CLI computes the ideal tree, then writes \`node_modules\` and \`package-lock.json\` together.

Each package may ship CLI executables; npm places shims for them in \`node_modules\\.bin\`. While running a script from package.json, npm prepends that folder to PATH, which is why \`"lint": "eslint ."\` works without ESLint being installed globally.
    `,
    codeExamples: [
      {
        title: "From empty folder to runnable project",
        language: "bash",
        code: `mkdir notes-cli
Set-Location notes-cli
npm init -y

npm install commander            # runtime dependency -> dependencies
npm install --save-dev vitest    # dev tool -> devDependencies

node -e "console.log(require('./package.json').name)"
npm ls                           # local dependency tree`,
        description:
          "npm init -y creates package.json; npm ls prints what is actually installed under node_modules right now.",
      },
      {
        title: "Inspect where npm puts everything",
        language: "bash",
        code: `npm config get prefix     # global bin folder (where -g packages go)
npm root                  # this project's node_modules
npm root -g               # global node_modules
npm config list           # every setting npm is using`,
        description:
          "Run these once in any project — knowing the prefix explains every 'why is my global CLI not found' mystery.",
      },
    ],
    commonMistakes: [
      "Installing everything with -g so it is always available: the project stops being portable and CI fails immediately.",
      "Running npm install in your home directory by accident, creating a stray package.json and node_modules that slow every later command.",
      "Deleting node_modules and assuming the dependencies are gone — package.json still declares them and npm ci restores the whole tree.",
      "Committing node_modules (never do this) or forgetting to commit package.json and package-lock.json (always commit these).",
    ],
    bestPractices: [
      "Install every runtime dependency locally; reserve -g for personal CLI utilities only.",
      "Use npx to run a tool once instead of installing it globally (covered in the npx lesson).",
      "Run npm ls --depth=0 to see the exact top-level dependencies of a project.",
      "Commit package.json and package-lock.json from the very first commit.",
    ],
    realWorldUseCases: [
      "Cloning a repository on a new machine: npm ci rebuilds the entire dependency tree from the lockfile in one command.",
      "An internal company package published to a private registry can be installed exactly like any public package.",
    ],
    resources: [
      docs(
        "npm — Getting started",
        OFFICIAL.npmGettingStarted,
        "The official introduction to npm's registry, packages and commands.",
        "en",
        "15 min",
      ),
      docs(
        "npm — Creating a package.json file",
        "https://docs.npmjs.com/creating-a-package-json-file",
        "Step-by-step guide to npm init and the file it produces.",
        "en",
        "8 min",
      ),
      docs(
        "npm — npm init",
        "https://docs.npmjs.com/cli/commands/npm-init",
        "Reference for every npm init flag, including -y.",
        "en",
        "5 min",
      ),
      ytSearch(
        "npm basics local vs global install for beginners",
        "Introductory walkthroughs of npm init, node_modules and global installs.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-npm-init",
        title: "Bootstrap a project",
        prompt:
          "Create a folder called hello-npm. Initialise it with npm init -y, install express locally and vitest with --save-dev, then answer: (1) which file lists both, (2) which folder holds the actual downloaded code, (3) what npm config get prefix returns on your machine, (4) what npm ls --depth=0 shows before and after the installs.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "npm init -y writes package.json without asking questions.",
          "npm root prints the node_modules path for the current project.",
        ],
      },
    ],
    projectIds: ["p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-package-json",
    slug: "inside-package-json",
    title: "Inside package.json",
    description:
      "The manifest every Node project must have: identity fields, type, entry points, scripts, dependencies and the JSON pitfalls that break npm.",
    order: 6,
    estimatedMinutes: 20,
    tags: ["package.json", "npm", "manifest"],
    prerequisites: ["p1m3-npm-basics"],
    relatedTopics: ["p1m3-package-lock", "p1m3-npm-scripts", "p1m3-semantic-versioning"],
    learningObjectives: [
      "Name the fields every package.json needs and what npm uses each for",
      'Explain how "type": "module" changes how .js files are interpreted',
      "Choose between main and exports for a package entry point",
      "Spot and fix the JSON syntax pitfalls that stop every npm command",
    ],
    simpleExplanation:
      "package.json is the manifest of a Node project: it names the package, declares its version, lists the scripts you can run with npm run, and records which packages the code needs. npm reads it before doing anything — installing, starting or publishing. Because it is strict JSON, one trailing comma or a stray single quote breaks every npm command with a confusing parse error, so treat the file as code and keep it valid.",
    detailedContent: `
| Field | Purpose |
| --- | --- |
| \`name\` | Lowercase, no spaces; becomes the registry name if you ever publish |
| \`version\` | The semver of *your* package, not of Node.js |
| \`description\` | One-line summary shown on the registry |
| \`type\` | \`"module"\` makes .js files use ESM import/export |
| \`main\` | Classic entry point for CommonJS consumers |
| \`exports\` | Modern, precise entry-point map (preferred for libraries) |
| \`scripts\` | Commands runnable with \`npm run <name>\` |
| \`dependencies\` | Packages needed at runtime |
| \`devDependencies\` | Packages needed only for development, tests and builds |
| \`engines\` | Which Node.js versions you support |
| \`private\` | \`true\` blocks accidental publishing |
| \`license\` | e.g. \`"MIT"\` |

**\`"type": "module"\` in practice.** With it set, Node treats .js files as ECMAScript modules: you must use import/export, top-level await is allowed, and CommonJS-only libraries may need a .cjs extension. Without it, .js means require()/module.exports and you opt into ESM per file with .mjs. Pick one style per project — every project on this platform uses ESM.

**main versus exports.** \`main\` is a single fallback path. \`exports\` is a map that can expose subpaths while hiding internal files:

    "exports": {
      ".": "./src/index.js",
      "./utils": "./src/utils.js"
    }

**JSON pitfalls.** Double quotes only, no comments, no trailing commas. When the file is invalid, npm refuses to run and prints the line and column of the problem — believe it and fix the JSON, not your code.
    `,
    howItWorks: `
When you run \`npm install\`, npm merges three sources: the ranges you declared in \`dependencies\`, the resolved versions recorded in \`package-lock.json\`, and each package's own metadata. When you run \`npm start\`, npm looks up \`scripts.start\`, spawns a shell with \`node_modules\\.bin\` on PATH, and executes the command.

When another project installs *your* package, npm reads \`main\`/\`exports\` to decide which file \`import "your-package"\` loads, and reads your \`dependencies\` to install everything your package needs in turn. That chain is why a missing entry in dependencies breaks in production even though it worked on your laptop.
    `,
    codeExamples: [
      {
        title: "A realistic package.json for an application",
        language: "json",
        code: `{
  "name": "notes-cli",
  "version": "1.0.0",
  "description": "A tiny CLI that stores notes in a JSON file",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22" },
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  },
  "dependencies": {
    "commander": "^12.1.0"
  },
  "devDependencies": {
    "vitest": "^2.1.8"
  },
  "license": "MIT"
}`,
        description:
          "private prevents publishing, engines warns about the wrong Node version, and type: module enables import/export everywhere.",
      },
      {
        title: "Validate package.json before blaming npm",
        language: "bash",
        code: `# npm points at the exact line and column of a JSON problem
npm install

# isolate the check: is the file even valid JSON?
node -e "JSON.parse(require('node:fs').readFileSync('package.json','utf8')); console.log('valid')"`,
        description:
          "If the node -e line prints valid but npm still fails, the problem is semantic (bad fields) rather than syntactic.",
      },
    ],
    commonMistakes: [
      "Trailing commas and single quotes: invalid JSON; every npm command fails with a parse error.",
      'Adding "type": "module" halfway through a project, instantly breaking every require() call.',
      "Listing a package in both dependencies and devDependencies, or forgetting one of them entirely.",
      "Giving the package capitals or spaces in name — the registry rejects it at publish time.",
    ],
    bestPractices: [
      'Keep "private": true on applications so you can never publish them by accident.',
      'Set "type": "module" on day one and use import/export consistently.',
      'Add "engines" so npm can warn (or fail with engine-strict) when the wrong Node version is used.',
      "Let npm edit package.json for you (npm install <pkg>) instead of hand-typing versions.",
    ],
    realWorldUseCases: [
      "A typical interview task: add a start script and a dependency to an existing package.json.",
      "Reading any open-source repository — the scripts section is the fastest map of how to run, build and test it.",
    ],
    resources: [
      docs(
        "npm — package.json documentation",
        "https://docs.npmjs.com/cli/configuring-npm/package-json",
        "Field-by-field reference written by the npm team.",
        "en",
        "reference",
      ),
      docs(
        "npm — Creating a package.json file",
        "https://docs.npmjs.com/creating-a-package-json-file",
        "Walkthrough of npm init and the fields worth editing by hand.",
        "en",
        "8 min",
      ),
      docs(
        "Node.js — Package entry points",
        "https://nodejs.org/api/packages.html#package-entry-points",
        "How Node resolves main and exports when you import a package.",
        "en",
        "12 min",
      ),
      ytSearch(
        "package.json explained for beginners",
        "Beginner-friendly tours of every common package.json field.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-package-json",
        title: "Read a manifest",
        prompt:
          "Pick any open-source Node repository and open its package.json. Record: the value of type, three scripts and what each runs, the count of dependencies versus devDependencies, and the engines range. Then copy the file into a scratch folder, add a trailing comma after a script entry, and run npm install — paste the error npm gives you.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "npm prints the line and column of the JSON error it finds.",
          "node -e \"JSON.parse(...)\" isolates JSON validity from npm itself.",
        ],
      },
    ],
    projectIds: ["p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-package-lock",
    slug: "package-lock-and-reproducible-installs",
    title: "package-lock.json: Reproducible Installs",
    description:
      "What the lockfile pins that package.json cannot, why it must be committed, and npm ci versus npm install.",
    order: 7,
    estimatedMinutes: 15,
    tags: ["npm", "lockfile", "ci"],
    prerequisites: ["p1m3-package-json"],
    relatedTopics: ["p1m3-installing-packages", "p1m3-semantic-versioning", "p1m3-npm-basics"],
    learningObjectives: [
      "Explain exactly what the lockfile records that package.json does not",
      "Argue why package-lock.json belongs in version control",
      "Use npm ci for clean, deterministic installs locally and in CI",
      "Recognise a package.json/lockfile mismatch and repair it",
    ],
    simpleExplanation:
      "package.json declares which *ranges* of versions you accept (for example ^4.18.2); package-lock.json records the *exact* version every package resolved to, the URL each tarball came from, and a cryptographic integrity hash. Committing the lockfile means every install on every machine — your laptop, a teammate's laptop, the CI server — downloads an identical tree, so a bug that appears after npm install on one machine can be reproduced everywhere.",
    detailedContent: `
**What the lockfile contains** (lockfileVersion 3):

- The full dependency tree with the exact \`version\` of every package
- \`resolved\`: the registry URL the tarball was downloaded from
- \`integrity\`: an SRI hash npm uses to verify the tarball was not tampered with
- The edges of the tree — which package required which

**Commit it.** For applications and libraries alike, the npm documentation recommends committing package-lock.json. The lockfile is not noise: it is the record of a *tested* combination of versions. The only generated things you never commit are \`node_modules\` and secrets.

**npm install versus npm ci**

| Command | Updates the lockfile? | Clears node_modules first? | Fails if out of sync? |
| --- | --- | --- | --- |
| \`npm install\` | Yes, when needed | No — merges into it | No |
| \`npm ci\` | Never — errors instead | Yes | Yes |

\`npm ci\` is the CI command: clean, deterministic and slightly faster because it skips dependency resolution altogether.

**A real workflow**

    npm install lodash       # updates package.json AND package-lock.json
    git add package.json package-lock.json
    git commit -m "Add lodash"

Everyone else (and every CI run) then uses \`npm ci\` and receives exactly the pinned version of lodash plus its whole subtree.
    `,
    howItWorks: `
During \`npm install\` the CLI reads your ranges, consults the existing lockfile, re-resolves only what must change, then writes \`node_modules\` and rewrites the lockfile. During \`npm ci\` resolution never happens: npm walks the lockfile top to bottom, deletes \`node_modules\`, downloads each pinned tarball, verifies its integrity hash and unpacks it.

That is why a single mismatch between package.json and the lockfile makes \`npm ci\` abort with an EUSAGE error instead of guessing what you meant — by design, a CI pipeline should never silently invent versions.
    `,
    codeExamples: [
      {
        title: "Clean, reproducible installs",
        language: "bash",
        code: `# after cloning a repository (also what CI runs)
npm ci

# when you change dependencies on purpose
npm install
git add package.json package-lock.json
git commit -m "chore: bump express"

# prove the tree matches the lockfile
npm ls --depth=0`,
        description:
          "npm ci exits non-zero when the lockfile and package.json disagree — treat that as a bug in the branch, not an inconvenience.",
      },
      {
        title: "Review lockfile changes in a pull request",
        language: "bash",
        code: `git diff --stat package-lock.json
git diff package-lock.json | Select-String -Pattern '"version"|"resolved"' |
  Select-Object -First 20`,
        description:
          "A lockfile diff full of unrelated major bumps usually means someone ran npm install without the lockfile present.",
      },
    ],
    commonMistakes: [
      "Deleting package-lock.json to 'fix a conflict' — you have thrown away every pinned version; restore it from Git instead.",
      "Running npm install in CI, which silently re-resolves ranges and can pull newer, untested versions.",
      "Committing node_modules because a lockfile exists: they solve different problems, node_modules is pure output.",
      "Hand-merging a lockfile conflict and corrupting the JSON — take either side, then run npm install to regenerate.",
    ],
    bestPractices: [
      "Commit package-lock.json from the very first commit.",
      "Use npm ci everywhere a fresh install happens: CI, new machine, after switching branches.",
      "Review lockfile diffs in pull requests; a surprise major version bump deserves a comment.",
      "Never git add node_modules — the lockfile plus npm ci recreates it exactly.",
    ],
    realWorldUseCases: [
      "CI runs npm ci so the tree you tested is byte-for-byte the tree you deploy.",
      "A supply-chain audit: the integrity hashes in the lockfile prove exactly which tarballs are running in production.",
    ],
    resources: [
      docs(
        "npm — About package-lock.json",
        "https://docs.npmjs.com/cli/configuring-npm/package-lock-json",
        "Official description of every lockfile field and version.",
        "en",
        "reference",
      ),
      docs(
        "npm — npm ci",
        "https://docs.npmjs.com/cli/commands/npm-ci",
        "Clean install semantics, lockfile requirements and error behaviour.",
        "en",
        "8 min",
      ),
      ytSearch(
        "npm ci vs npm install lockfile explained",
        "Walkthroughs of lockfiles, determinism and continuous integration.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-lockfile",
        title: "Break and repair the sync",
        prompt:
          "In a scratch project: (1) install one dependency and commit package.json plus package-lock.json; (2) run npm ci and confirm success; (3) delete the lockfile, run npm install, and diff the regenerated lockfile against the committed one — which versions changed and why? (4) Restore the committed lockfile from Git and run npm ci again.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "git checkout -- package-lock.json restores the committed version.",
          "Without a lockfile npm re-resolves every range to the newest version the range allows.",
        ],
        solution: `npm install express
git add package.json package-lock.json
git commit -m "pin express"
npm ci                        # clean install, exit code 0

git stash push -- package-lock.json
npm install                   # lockfile regenerated at newest allowed versions
git diff stash -- package-lock.json   # version + integrity churn

git stash pop
npm ci                        # back to the pinned, tested tree`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-installing-packages",
    slug: "installing-and-managing-packages",
    title: "Installing and Managing Packages",
    description:
      "--save-dev, version ranges, uninstalling, npm audit fix and what peer dependencies expect from you.",
    order: 8,
    estimatedMinutes: 16,
    tags: ["npm", "dependencies", "audit"],
    prerequisites: ["p1m3-package-json", "p1m3-package-lock"],
    relatedTopics: ["p1m3-semantic-versioning", "p1m3-npm-basics", "p1m3-npx"],
    learningObjectives: [
      "Install runtime and development dependencies with the correct flags",
      "Compare caret, tilde and exact version ranges and choose one deliberately",
      "Remove packages cleanly and inspect outdated ones",
      "Use npm audit to fix vulnerabilities and explain peer dependencies",
    ],
    simpleExplanation:
      "npm install express adds a package to dependencies; npm install --save-dev vitest puts it in devDependencies instead, for tools used only while developing. The version written into package.json is a *range*: caret (^) accepts anything short of a major bump, tilde (~) only patch updates, and no symbol pins the exact version. npm can also audit your tree for known vulnerabilities and tells you which peer dependencies each package expects you to provide.",
    detailedContent: `
**Install commands**

    npm install express             # runtime dependency
    npm install --save-dev vitest   # development-only dependency
    npm uninstall express           # package.json + lockfile + node_modules
    npm outdated                    # current / wanted / latest table
    npm ls express                  # what is really installed

**Ranges**

| Written as | Accepts | Typical use |
| --- | --- | --- |
| \`^4.18.2\` | \`>=4.18.2 <5.0.0\` | bug fixes and features |
| \`~4.18.2\` | \`>=4.18.2 <4.19.0\` | bug fixes only |
| \`4.18.2\` | exactly \`4.18.2\` | maximum caution |
| \`*\` | anything | never commit this |

Since npm 5, \`npm install pkg\` writes a caret range by default. That is safe *as long as the lockfile is committed*, because the lockfile is what actually decides what gets installed.

**Security: npm audit**

    npm audit               # vulnerabilities mapped onto your lockfile tree
    npm audit fix           # compatible, non-breaking upgrades
    npm audit fix --force   # breaking upgrades — read the diff first

**Peer dependencies** are packages a library expects *you* to supply (an ESLint plugin expects eslint; a React component library expects react). Since npm 7 they are installed automatically, and conflicts surface as ERESOLVE errors instead of mysterious runtime crashes. The error text usually names the version the plugin wants.
    `,
    howItWorks: `
Behind \`npm install pkg\` the CLI fetches the package's *packument* (its full metadata document listing every published version), selects the highest version satisfying your range and all peer constraints, builds a tree while deduplicating compatible versions, then writes \`node_modules\` and \`package-lock.json\` together.

\`npm audit\` sends the name/version pairs from your lockfile to the registry's advisory endpoint and maps the response back onto your tree. A stale lockfile therefore produces audit results that do not match what production actually runs — one more reason to commit it.
    `,
    codeExamples: [
      {
        title: "Install, inspect, remove",
        language: "bash",
        code: `npm install express
npm install --save-dev vitest

npm outdated           # current vs wanted vs latest for every dependency
npm audit              # vulnerability report for the locked tree

npm uninstall vitest   # removed from package.json, lockfile and node_modules
npm ls --depth=0       # top-level summary`,
        description:
          "'wanted' in npm outdated is the newest version your package.json range allows; 'latest' is whatever the registry newest happens to be.",
      },
      {
        title: "Reading a peer dependency (ERESOLVE) error",
        language: "bash",
        code: `npm install some-plugin-for-react
# npm error ERESOLVE: unable to resolve dependency tree
# peer react@"^17.0.0" from some-plugin-for-react
#   some-plugin-for-react@"^1.2.0" from the root project

# proper fix: upgrade the plugin (or align react)
# last resort, and only with understanding:
npm install some-plugin-for-react --legacy-peer-deps`,
        description:
          "--legacy-peer-deps silences the check; it does not make the incompatible versions work together.",
      },
    ],
    commonMistakes: [
      "Treating npm audit fix --force as a routine button — it can jump majors and break the application.",
      "Installing test tooling without --save-dev, bloating production installs and muddying the dependency story.",
      "Copying --legacy-peer-deps into every install to hide peer conflicts instead of resolving them.",
      "Assuming npm install on a teammate's machine gives them your versions — without the lockfile it will not.",
    ],
    bestPractices: [
      "Runtime imports belong in dependencies; everything else goes in devDependencies.",
      "Commit the lockfile so caret ranges stay deterministic for the whole team.",
      "Run npm audit in CI and fail the build on high or critical findings.",
      "When publishing a library, prefer exact versions; applications rely on ranges plus a lockfile.",
    ],
    realWorldUseCases: [
      "A supply-chain scare: the audit report plus the lockfile tell you within minutes which services contain the vulnerable version.",
      "Upgrading a major version on a branch: peer-dependency errors surface every incompatible plugin before your users do.",
    ],
    resources: [
      docs(
        "npm — npm install",
        "https://docs.npmjs.com/cli/commands/npm-install",
        "Flags, saved ranges and install semantics.",
        "en",
        "reference",
      ),
      docs(
        "npm — npm audit",
        "https://docs.npmjs.com/cli/commands/npm-audit",
        "How vulnerability reporting against the lockfile works.",
        "en",
        "8 min",
      ),
      docs(
        "npm — npm uninstall",
        "https://docs.npmjs.com/cli/commands/npm-uninstall",
        "Removing a package from all three places at once.",
        "en",
        "5 min",
      ),
      ytSearch(
        "npm install save-dev caret tilde explained",
        "Version ranges, audits and peer dependencies walked through.",
        "en",
        "10–18 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-deps",
        title: "Dependency hygiene",
        prompt:
          "In a scratch project: install express, install vitest with --save-dev, then (1) paste the dependencies and devDependencies sections of package.json; (2) run npm outdated and explain what 'wanted' means; (3) pin express to an exact older version, run npm install, and show the lockfile entry; (4) uninstall both and prove the project is clean with npm ls --depth=0.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "'wanted' is the newest version your package.json range allows.",
          "npm uninstall updates package.json and the lockfile, not only the folder.",
        ],
      },
    ],
    projectIds: ["p1-contact-manager"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-npm-scripts",
    slug: "npm-scripts",
    title: "npm Scripts: Your Cross-Platform Task Runner",
    description:
      "The scripts field, pre/post lifecycle hooks, npm run versus the implicit scripts, and cross-platform shell pitfalls.",
    order: 9,
    estimatedMinutes: 18,
    tags: ["npm", "scripts", "automation"],
    prerequisites: ["p1m3-package-json"],
    relatedTopics: ["p1m3-installing-packages", "p1m3-npx", "p1m3-vscode-setup"],
    learningObjectives: [
      "Define project commands in the scripts field and run them with npm run",
      "Explain the pre/post hook ordering around any script",
      "Remember which scripts run without the run keyword",
      "Fix cross-platform script problems with cross-env and Node scripts",
    ],
    simpleExplanation:
      "The scripts field of package.json is a tiny task runner: every entry becomes a command your whole team — and your CI pipeline — can run with npm run <name>, without memorising paths or flags. npm also runs hidden pre<name> and post<name> hooks around each script, so for example a linter can run automatically before every build. The catch is the shell: npm uses cmd.exe on Windows by default, so bash-only syntax such as NODE_ENV=production node app.js fails — use cross-env or a small Node script instead.",
    detailedContent: `
**Defining and running scripts**

    "scripts": {
      "start": "node src/index.js",
      "dev":   "node --watch src/index.js",
      "lint":  "eslint .",
      "test":  "node --test"
    }

    npm run dev       # any script needs "run"
    npm start         # implicit: start, test, stop, restart
    npm test          # implicit
    npm run           # list every available script

**Lifecycle order.** For any script called \`foo\`, npm runs \`prefoo\` first and \`postfoo\` after:

    "prebuild": "npm run lint",
    "build": "node scripts/build.js",
    "postbuild": "node scripts/verify.js"

\`npm run build\` therefore executes prebuild → build → postbuild, in that order, and aborts the chain if a step fails. The same rule applies to the implicit scripts: \`npm test\` runs \`pretest\` then \`test\` then \`posttest\`.

**Cross-platform problems.** npm spawns cmd.exe on Windows by default, so these bash idioms break:

| bash idea | Windows-safe version |
| --- | --- |
| \`NODE_ENV=production node app.js\` | \`cross-env NODE_ENV=production node app.js\` |
| \`rm -rf dist\` | \`node -e "fs.rmSync('dist',{recursive:true,force:true})"\` |
| \`export DEBUG=*\` | move it into cross-env or an .env file |

**Tool binaries resolve automatically.** npm prepends \`node_modules\\.bin\` to PATH while running a script, so \`"lint": "eslint ."\` works even though ESLint is only a devDependency — no global install involved.
    `,
    howItWorks: `
\`npm run lint\` spawns a shell (cmd.exe on Windows unless configured otherwise) with an augmented environment: \`node_modules\\.bin\` is prepended to PATH, npm_lifecycle_event is set to the script name, and npm's configuration values become environment variables your script can read.

Anything a script does inherits that shell's limitations, which is exactly why teams keep package.json lines short and portable and move real logic into Node scripts under a \`scripts\` folder. A Node script behaves identically on Windows, macOS and Linux — no shell dialects involved.
    `,
    codeExamples: [
      {
        title: "A portable script set",
        language: "json",
        code: `{
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "pretest": "node scripts/clean.js",
    "test": "node --test",
    "build": "cross-env NODE_ENV=production node scripts/build.js"
  }
}`,
        description:
          "Install the helper first: npm install --save-dev cross-env. Only cross-env is needed for the environment variable; everything else is plain node.",
      },
      {
        title: "A cross-platform clean script (scripts/clean.js)",
        language: "js",
        code: `import { rmSync } from "node:fs";

// replaces "rm -rf dist" everywhere, including Windows
rmSync("dist", { recursive: true, force: true });
console.log("dist/ removed");`,
        description:
          'Referenced from package.json as "prebuild": "node scripts/clean.js" — runs identically on every operating system.',
      },
    ],
    commonMistakes: [
      "Writing NODE_ENV=production node app.js in package.json and watching it fail on Windows with 'NODE_ENV' is not recognized.",
      "Forgetting npm run — only start, test, stop and restart work without the keyword.",
      "Overloading the start script: hosting platforms run npm start by default, so keep it the honest entry point.",
      "Depending on globally installed CLIs inside scripts — teammates and CI will not have them; add them as devDependencies.",
    ],
    bestPractices: [
      "Every command you type twice becomes a script: dev, build, test, lint, format.",
      "Keep scripts portable — Node one-liners or scripts/*.js instead of shell-specific syntax.",
      "Use pretest and prebuild hooks for cheap automatic checks such as linting.",
      "Document the scripts table in your README so newcomers know what to run first.",
    ],
    realWorldUseCases: [
      "Hosting platforms execute npm ci and npm start — your scripts field is the deployment contract.",
      "A project with test:unit, test:integration and test scripts keeps the CI YAML almost empty.",
    ],
    resources: [
      docs(
        "npm — Scripts",
        "https://docs.npmjs.com/cli/using-npm/scripts",
        "Official reference for the scripts field, hooks and the environment npm provides.",
        "en",
        "reference",
      ),
      docs(
        "npm — npm run",
        "https://docs.npmjs.com/cli/commands/npm-run",
        "How npm resolves and executes a script, including pre/post hooks.",
        "en",
        "8 min",
      ),
      docs(
        "npm — npm config",
        "https://docs.npmjs.com/cli/using-npm/config",
        "The environment variables and settings npm exposes to your scripts.",
        "en",
        "reference",
      ),
      ytSearch(
        "npm scripts tutorial cross-platform cross-env",
        "Practical npm scripts, lifecycle hooks and Windows portability.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-scripts",
        title: "Automate your workflow",
        prompt:
          "Add three scripts to a project: dev using node --watch, a pretest hook that prints 'linting...', and test running node --test. Run npm test and paste the output proving the hook order. Then add a clean script that deletes a dist folder *without* bash syntax and prove it works in PowerShell.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "pretest runs automatically before test — no extra configuration needed.",
          "node -e \"fs.rmSync('dist',{recursive:true,force:true})\" is portable.",
        ],
      },
    ],
    projectIds: ["p1-file-organizer"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-npx",
    slug: "running-packages-with-npx",
    title: "npx: Running Packages Without Installing Them",
    description:
      "Executing a package's CLI for a single task, how npx resolves binaries, where the cache lives on Windows, and how to stay safe.",
    order: 10,
    estimatedMinutes: 12,
    tags: ["npx", "npm", "cli"],
    prerequisites: ["p1m3-npm-basics", "p1m3-installing-packages"],
    relatedTopics: ["p1m3-npm-scripts", "p1m3-installing-packages", "p1m3-semantic-versioning"],
    learningObjectives: [
      "Run a package's command-line interface for one task with npx",
      "Explain how npx resolves local binaries before downloading anything",
      "Describe the npx cache behaviour and locate it on Windows",
      "Apply safety habits: pinned versions, --yes and typo awareness",
    ],
    simpleExplanation:
      "npx runs a package's command-line tool without installing it permanently. It looks inside the current project's node_modules/.bin first; if nothing matches, it downloads the package into a temporary cache and runs it once. That is how npx create-vite . scaffolds a project without cluttering your machine — and because anyone can publish to the public registry, pin versions and double-check spelling before letting npx execute code.",
    detailedContent: `
**What npx does, step by step**

1. Is there a matching binary in \`node_modules\\.bin\`? If yes, run it — no network access needed.
2. Otherwise, is that package spec already in the npx cache? Run the cached copy.
3. Otherwise download the package (highest version matching your spec) into the cache and run it.

**Classic uses**

    npx create-vite my-app            # scaffold a new project
    npx create-vite .                 # scaffold into the current folder
    npx cowsay "hello node"           # one-off utility
    npx --yes http-server -p 8080     # skip the confirmation prompt
    npx typescript@5.6.3 tsc --noEmit # pin the exact version

**Cache location (Windows).** npx stores downloaded packages under \`%LocalAppData%\\npm-cache\\_npx\`, with one folder per package spec. Repeat runs start instantly; deleting the folder is always safe — npx simply re-downloads when asked again.

**Safety.** npx executes arbitrary code from the registry. Typo-squatting — publishing \`create-vitee\` hoping people mistype — is a real supply-chain attack. Habits that protect you: copy exact names from official docs, pin \`pkg@1.2.3\` in anything automated, and never reflexively answer yes to a prompt naming a package you do not recognise.
    `,
    howItWorks: `
npx ships with npm, so there is nothing extra to install. Under the hood it builds a tiny install tree inside its cache, links the requested binary, and spawns it with every argument you typed after the package name — those arguments belong to the tool, not to npx.

Because the project's own \`node_modules\\.bin\` always wins, a project that depends on \`typescript\` runs *its* tsc via \`npx tsc\`, keeping local and CI behaviour identical. When the package is missing locally, the cached download is keyed by the exact spec, which is why \`npx pkg@1.2.3\` and \`npx pkg\` populate different cache folders.
    `,
    codeExamples: [
      {
        title: "Scaffold and run one-off tools",
        language: "bash",
        code: `# create a project without installing anything globally
npx create-vite my-app

# inside an existing project: use the locally installed TypeScript
npm install --save-dev typescript
npx tsc --noEmit

# one-off tools that never touch package.json
npx --yes cowsay "hello from npx"`,
        description:
          "The first npx create-vite downloads; running it again (or in another folder) is almost instant because of the cache.",
      },
      {
        title: "Inspect and pin the cache",
        language: "bash",
        code: `# what npx has downloaded so far
Get-ChildItem "$env:LocalAppData\\npm-cache\\_npx"

# pin a version so tomorrow's run behaves exactly like today's
npx create-vite@5.4.11 my-app`,
        description:
          "In CI, always pin: an unpinned npx call is a dependency that updates itself whenever its author publishes.",
      },
    ],
    commonMistakes: [
      "Running npx some-tool with no version in CI, so a registry publish silently changes your build.",
      "Answering yes to the npx confirmation prompt without reading which package it is about to execute.",
      "Installing a CLI globally 'because npx felt slow' — repeat runs come from the cache and globals drift per machine.",
      "Mistyping a package name; typo-squatted packages are a documented attack vector.",
    ],
    bestPractices: [
      "Pin versions for anything automated: npx pkg@1.2.3.",
      "Prefer a project devDependency plus npx over global installs so every teammate runs the same version.",
      "Use --yes only when you already trust the package.",
      "Treat scaffolding tools as one-offs: the generated project must not depend on them.",
    ],
    realWorldUseCases: [
      "Trying an HTTP client or linter for two minutes without touching package.json.",
      "Bootstrapping a workshop project on a shared machine with zero global installs.",
    ],
    resources: [
      docs(
        "npm — npx",
        "https://docs.npmjs.com/cli/commands/npx",
        "Official reference: binary resolution, cache behaviour and flags.",
        "en",
        "reference",
      ),
      docs(
        "npm — Documentation home",
        OFFICIAL.npmDocs,
        "Every npm command, including the ones npx wraps.",
        "en",
        "reference",
      ),
      ytSearch(
        "npx explained how it works node.js",
        "Walkthroughs of npx resolution, caching and common one-off tools.",
        "en",
        "8–12 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-npx",
        title: "Try before you install",
        prompt:
          "Without installing anything globally: (1) run a one-off tool with npx and time the first and the second run; (2) locate the _npx cache folder and list what is inside; (3) in a project that has typescript as a devDependency, run npx tsc --version and confirm it matches the local install; (4) run the same tool pinned to an exact version and describe what appears in the cache.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "The cache lives under %LocalAppData%\\npm-cache\\_npx.",
          "npx pkg@1.2.3 creates its own cache entry, separate from npx pkg.",
        ],
        solution: `Measure-Command { npx --yes cowsay "first run" }    # downloads into cache
Measure-Command { npx --yes cowsay "second run" }   # served from cache

Get-ChildItem "$env:LocalAppData\\npm-cache\\_npx"

npm install --save-dev typescript
npx tsc --version                 # Version 5.x.x — the local devDependency
npx typescript@5.6.3 tsc --version # pinned spec, separate cache entry`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p1-calculator"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-semantic-versioning",
    slug: "semantic-versioning",
    title: "Semantic Versioning and Version Ranges",
    description:
      "MAJOR.MINOR.PATCH, caret/tilde/exact ranges, what counts as a breaking change, and ranges versus the lockfile.",
    order: 11,
    estimatedMinutes: 16,
    tags: ["semver", "versioning", "npm"],
    prerequisites: ["p1m3-package-json"],
    relatedTopics: ["p1m3-package-lock", "p1m3-installing-packages", "p1m3-npm-basics"],
    learningObjectives: [
      "Parse MAJOR.MINOR.PATCH and state what each bump promises",
      "Choose between caret, tilde, exact and comparator ranges",
      "Give concrete examples of breaking changes in a Node library",
      "Explain how the lockfile relates to the ranges in package.json",
    ],
    simpleExplanation:
      "Semantic versioning gives every version three numbers: MAJOR for breaking changes, MINOR for backwards-compatible features, PATCH for backwards-compatible fixes. So 2.4.1 means third major generation, fourth feature drop, first fix. Ranges in package.json declare what you *accept* (^2.4.1 allows anything from 2.4.1 up to but not including 3.0.0), while the lockfile records what you actually *use*.",
    detailedContent: `
**The three numbers**

| Part | Bump when… | Example |
| --- | --- | --- |
| MAJOR (2) | existing callers break | removing an export, changing a parameter order |
| MINOR (4) | backwards-compatible features are added | a new optional parameter, a new export |
| PATCH (1) | a bug is fixed without changing the API | correcting a validation edge case |

**Pre-1.0 caveat.** While a package is 0.x.y the author may break anything in a minor bump. Many teams treat 0.x as "API not settled yet" and pin more tightly.

**Breaking changes in a Node library**

- Removing or renaming \`module.exports.serialize\`
- Changing an option's meaning (\`timeout\` from milliseconds to seconds)
- Dropping Node 20 from \`engines\` when it was previously allowed
- Switching the package's default format from CommonJS to ESM

**Ranges in package.json**

| Range | Accepts | Notes |
| --- | --- | --- |
| \`^2.4.1\` | \`>=2.4.1 <3.0.0\` | what npm install writes by default |
| \`~2.4.1\` | \`>=2.4.1 <2.5.0\` | patch fixes only |
| \`2.4.1\` | exactly \`2.4.1\` | full manual control |
| \`>=2.4.1 <3.0.0\` | the explicit comparator pair | identical to caret, written out |
| \`2.x\` | \`>=2.0.0 <3.0.0\` | wildcard on the major |

**Range versus lockfile.** package.json is *intent* ("anything compatible with 2.4.1"); package-lock.json is *fact* ("we tested 2.4.9"). Delete the lockfile and intent becomes a lottery.
    `,
    howItWorks: `
When npm resolves \`^2.4.1\` it fetches the package's packument (the document listing every published version), filters all versions through the range, and picks the highest match that also satisfies peer constraints and the ranges of everything else in the tree. Compatible versions are then deduplicated so \`node_modules\` stays as flat as possible.

That is why a lockfile can represent thousands of resolved versions while your package.json lists only a handful of ranges: the ranges *describe* what may be installed, the lockfile *remembers* what was.
    `,
    codeExamples: [
      {
        title: "Installing specific ranges",
        language: "bash",
        code: `npm install express@^4.18.2     # any 4.x at or above 4.18.2
npm install express@~4.18.2     # 4.18.x only
npm install express@4.18.2      # exactly that version
npm install express@"<5.0.0"    # explicit comparator (quote it in PowerShell)

npm outdated                    # current vs wanted vs latest`,
        description:
          "Quoting the range protects characters such as < from the shell. 'wanted' is the newest version your declared range allows.",
      },
      {
        title: "What a major bump does to callers",
        language: "js",
        code: `// v1 — the API everybody calls
function greet(name) {
  return "Hi " + name;
}

// v2 — same name, new signature: a MAJOR bump is required
function greet({ name, lang = "en" }) {
  return lang === "ar" ? "Marhaba " + name : "Hi " + name;
}

// A caller that kept "lib": "^1.0.0" in package.json never sees v2.
// After bumping to ^2.0.0 the old call breaks at runtime:
console.log(greet("Amina")); // TypeError: name is not iterable`,
        description:
          "Semver's whole job is letting that caller choose when to absorb the breakage — instead of discovering it in production.",
      },
    ],
    commonMistakes: [
      "Reading a version in the lockfile and calling it 'the range' — they are two different layers with two different jobs.",
      "Using * or latest in dependencies, which makes every build resolve differently.",
      "Assuming patch bumps can never break you: broken releases exist in every ecosystem, the lockfile is your insurance.",
      "Publishing a breaking change as a MINOR or PATCH and breaking everyone who trusted your semver.",
    ],
    bestPractices: [
      "Follow semver strictly when publishing and document breaking changes in a CHANGELOG.",
      "Applications: caret ranges plus a committed lockfile.",
      "Libraries others install: exact versions or very tight ranges.",
      "Before a major upgrade, read the dependency's changelog for every version your range will cross.",
    ],
    realWorldUseCases: [
      "npm outdated listing every package with a newer compatible version — your safe upgrade queue.",
      "Dependabot or Renovate opening pull requests that bump one lockfile entry at a time.",
    ],
    resources: [
      docs(
        "npm — About semantic versioning",
        "https://docs.npmjs.com/about-semantic-versioning",
        "npm's own explanation of MAJOR.MINOR.PATCH and ranges.",
        "en",
        "10 min",
      ),
      docs(
        "npm — npm ls",
        "https://docs.npmjs.com/cli/commands/npm-ls",
        "See which resolved version currently satisfies each range.",
        "en",
        "5 min",
      ),
      ytSearch(
        "semantic versioning semver explained",
        "Beginner-friendly breakdowns of version numbers and ranges.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-semver",
        title: "Predict the resolution",
        prompt:
          "Write the exact set of versions accepted by each spec: (a) ^3.1.4, (b) ~3.1.4, (c) 3.1.4, (d) >=3.1.0 <3.2.0. Then in a scratch project run npm install chalk@^5.0.0, inspect what was resolved with npm ls chalk, and explain in one sentence the difference between the range and the resolved version.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: [
          "^3.1.4 allows everything from 3.1.4 up to (but not including) 4.0.0.",
          "npm ls shows the installed version; the lockfile additionally records where it came from.",
        ],
      },
    ],
    projectIds: ["p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-environment-variables",
    slug: "environment-variables-and-dotenv",
    title: "Environment Variables and .env Files",
    description:
      "Why configuration belongs outside the code, loading .env with dotenv, .env.example, never committing secrets, and Windows setx versus session variables.",
    order: 12,
    estimatedMinutes: 18,
    tags: ["environment", "dotenv", "security", "config"],
    prerequisites: ["p1m3-npm-basics", "p1m3-terminal-powershell"],
    relatedTopics: ["p1m3-gitignore", "p1m3-package-json", "p1m3-npm-scripts"],
    learningObjectives: [
      "Explain why configuration and secrets belong outside source code",
      "Load a .env file with dotenv and read process.env deliberately",
      "Keep .env out of Git while committing a useful .env.example",
      "Set session and persistent environment variables on Windows",
    ],
    simpleExplanation:
      "Anything that differs between your laptop, staging and production — API keys, database URLs, ports — belongs in environment variables, not in your code. A developer copies the committed .env.example to a local .env, fills in real values, and dotenv loads that file into process.env at startup. Windows gives you two kinds of variables: session-only ($env:PORT=3000) that die with the terminal, and persistent (setx) ones that every *new* process can see.",
    detailedContent: `
**Why configuration lives outside code.** Ship one codebase and configure it per environment. Hardcoding \`postgres://user:pass@localhost/dev\` means every secret is committed forever (Git history keeps deleted files), every environment needs a code change, and you cannot safely hand the repository to a colleague or a recruiter.

**The .env workflow**

1. Commit **\`.env.example\`** — the same keys with dummy or empty values.
2. Gitignore **\`.env\`** — never commit it (see the gitignore lesson).
3. Each developer runs \`Copy-Item .env.example .env\` and fills in real values.
4. At startup, dotenv reads \`.env\` into \`process.env\`.

**Reading values.** Everything in \`process.env\` is a string or undefined. Coerce and validate deliberately:

    const port = Number(process.env.PORT ?? 3000);

**Windows variables**

| Style | Command | Lifetime |
| --- | --- | --- |
| Session only | \`$env:PORT = "3000"\` | current PowerShell window |
| Persistent (user) | \`setx PORT 3000\` | processes started later |
| Persistent (API) | \`[Environment]::SetEnvironmentVariable("PORT","3000","User")\` | same, without setx quirks |

\`setx\` never affects programs that are already running — restart the terminal or VS Code to pick the value up — and it truncates values longer than 1024 characters, so it is the wrong tool for certificates or large keys.
    `,
    howItWorks: `
dotenv parses \`.env\` line by line (KEY=VALUE, \`#\` for comments, optional quotes) and assigns each key into \`process.env\` **only when that key is not already set**. A real environment variable always wins, which is exactly right for production, where the hosting platform injects secrets through its own mechanism.

You can skip dotenv entirely while debugging: VS Code's Node debugger loads variables via \`"envFile": "\${workspaceFolder}/.env"\` in launch.json. On Windows, persistent user variables live in the registry under HKCU\\Environment, which Explorer and newly started processes read — that is the whole reason for the "restart your terminal" rule.
    `,
    codeExamples: [
      {
        title: "dotenv from scratch",
        language: "js",
        code: `import "dotenv/config"; // reads ./.env into process.env at import time
import http from "node:http";

const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.WEATHER_API_KEY;

if (!apiKey) {
  console.error("Missing WEATHER_API_KEY — copy .env.example to .env");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ port, hasApiKey: Boolean(apiKey) }));
});

server.listen(port, () => {
  console.log("listening on http://127.0.0.1:" + port);
});`,
        description:
          "Install it first: npm install dotenv. Note the fail-fast check — an app that silently runs with a missing key wastes an afternoon.",
      },
      {
        title: ".env.example (committed) versus .env (ignored)",
        language: "bash",
        code: `# .env.example — committed, safe placeholder values
PORT=3000
WEATHER_API_KEY=your-key-here

# .env — gitignored, real values
PORT=3000
WEATHER_API_KEY=9f3a...

# create your local copy in PowerShell
Copy-Item .env.example .env

# persistent Windows user variable (visible to NEW processes only)
setx WEATHER_API_KEY 9f3a...`,
        description:
          "git status must never show .env. If it does, stop and fix .gitignore before your next commit.",
      },
    ],
    commonMistakes: [
      "Committing .env 'just this once' — rotate the key immediately; deleting the file does not remove it from Git history.",
      "Treating process.env values as numbers or booleans — they are always strings, so coerce them on purpose.",
      "Running setx and wondering why the running app cannot see the value: existing processes keep their old environment.",
      "Shipping a .env.example full of realistic-looking secrets that somebody pastes into production.",
    ],
    bestPractices: [
      "Never commit .env; always commit .env.example listing every key the app needs.",
      "Validate required variables at startup and fail fast with a clear message.",
      "In production, set variables through the platform's UI or API rather than files on disk.",
      'Use process.env.X ?? default instead of || so an empty string is not silently replaced.',
    ],
    realWorldUseCases: [
      "One build artefact, three environments: the same image is started with different DATABASE_URL values in dev, staging and production.",
      "Incident response: rotating a leaked API key becomes a variable change, not a code change.",
    ],
    resources: [
      docs(
        "Node.js — process.env",
        "https://nodejs.org/api/process.html#processenv",
        "How Node.js exposes environment variables to your code.",
        "en",
        "8 min",
      ),
      docs(
        "Microsoft Learn — about_environment_variables",
        "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_environment_variables",
        "PowerShell's model of session versus persistent variables.",
        "en",
        "8 min",
      ),
      docs(
        "Microsoft Learn — setx",
        "https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/setx",
        "Setting persistent Windows variables, including the 1024-character limit.",
        "en",
        "5 min",
      ),
      article(
        "dotenv",
        "https://github.com/motdotla/dotenv",
        "github.com",
        "The zero-dependency module that loads .env into process.env.",
        { resourceType: "tool", estimatedDuration: "8 min" },
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-env",
        title: "Config outside code",
        prompt:
          "Create .env.example and .env in a scratch project, load them with dotenv, and read two variables (a port and a secret). Prove .env is ignored with git status. Then set a persistent Windows variable with setx, open a *new* terminal, print it with $env:MY_VAR, and explain in one sentence why a process that was already running did not see the change.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "Copy-Item .env.example .env creates the local copy.",
          "setx writes to the registry for processes that start later; it never touches running ones.",
        ],
      },
    ],
    projectIds: ["p1-weather-client"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-git-fundamentals",
    slug: "git-fundamentals",
    title: "Git Fundamentals: Track Everything",
    description:
      "git init, status, add, commit, log and diff — plus the three areas: working tree, staging area and repository.",
    order: 13,
    estimatedMinutes: 20,
    tags: ["git", "version-control"],
    prerequisites: ["p1m3-installing-node", "p1m3-terminal-powershell"],
    relatedTopics: ["p1m3-github-repositories", "p1m3-gitignore", "p1m3-commits-branches-merges"],
    learningObjectives: [
      "Initialise a repository and create your first commit",
      "Describe the three areas: working tree, staging area, repository",
      "Use status, add, commit, diff and log to inspect and record work",
      "Configure user identity and choose main as the default branch",
    ],
    simpleExplanation:
      "Git is a snapshot system for folders. git init starts tracking the current folder; you choose what to record with git add — the staging area is the draft of your next snapshot — and git commit -m freezes that draft into permanent history with a message. Between commits, git status and git diff show you exactly what changed, which makes Git both a safety net and the best project diary you will ever have.",
    detailedContent: `
**The three areas**

| Area | What it holds | Typical command |
| --- | --- | --- |
| Working tree | the files you edit every day | \`git status\` reports changes here |
| Staging area (index) | the draft of your next commit | \`git add <file>\` moves changes here |
| Repository (.git) | permanent snapshots plus metadata | \`git commit\` writes the draft here |

**One-time setup per machine**

    git config --global user.name "Your Name"
    git config --global user.email "you@example.com"
    git config --global init.defaultBranch main

**The daily loop**

    git init                     # once per project
    git status                   # what changed?
    git diff                     # content of unstaged changes
    git add src/index.js         # stage a file (or git add .)
    git diff --staged            # content of the next commit
    git commit -m "Add greeting endpoint"
    git log --oneline            # compact history, newest first

**Commit messages.** Write the *why*, not the *what* — the diff already shows what changed. "Fix crash when PORT is a string" beats "Update index.js". Keep the first line under about 72 characters; add a body for anything non-obvious.
    `,
    howItWorks: `
\`git init\` creates a \`.git\` folder holding objects (zlib-compressed snapshots of every file, addressed by content hash), refs (names such as \`refs/heads/main\` that point at commits) and the index (your staging area).

\`git add\` hashes the current contents of the files you named, stores those blobs, and updates the index to reference them. \`git commit\` then writes a commit object containing the whole index tree plus the author, message, timestamp and parent commit, and finally moves \`main\` to that commit. Identical content is stored once, so committing a one-line change to a huge file is still cheap.
    `,
    codeExamples: [
      {
        title: "From empty folder to history",
        language: "bash",
        code: `mkdir hello-git
Set-Location hello-git
git init

Set-Content index.js "console.log('hello git');"
git status --short          # ?? index.js  (untracked)

git add index.js
git commit -m "Add index.js"

Set-Content index.js "console.log('hello again');"
git diff                    # unstaged changes
git add index.js
git commit -m "Update greeting"
git log --oneline           # two commits`,
        description:
          "?? means untracked, a space+M means modified but not staged, M in the left column means staged — those two characters explain everything git status says.",
      },
      {
        title: "Inspect before you trust",
        language: "bash",
        code: `git status                  # staged, unstaged and untracked at a glance
git diff --staged           # exactly what the next commit will contain
git log --oneline --graph   # history with branch topology`,
        description:
          "Run git status before every single commit; it takes two seconds and prevents almost every 'oops' commit.",
      },
    ],
    commonMistakes: [
      "Committing with no identity configured, so commits carry an placeholder author — set user.name and user.email first.",
      "Running git add . from the repository root and sweeping secrets or build output into the commit (prevent this with .gitignore).",
      "Treating commit as a save button with fifty 'wip' messages; stage deliberately and write one meaningful message per logical change.",
      "Expecting git diff to show staged changes — staged content needs git diff --staged.",
    ],
    bestPractices: [
      "Commit early and commit small: one logical change per commit.",
      "Check git status before every commit — it is your safety net.",
      "Use git log --oneline and git show instead of guessing what happened last week.",
      "Never commit secrets; verify with git status and a correct .gitignore before staging everything.",
    ],
    realWorldUseCases: [
      "Throwing away a bad idea with git restore <file>, or resurrecting a deleted function from three commits ago.",
      "Explaining an outage: git log plus git bisect pinpoints the exact commit that introduced the bug.",
    ],
    resources: [
      docs(
        "Git — git init",
        "https://git-scm.com/docs/git-init",
        "Creating a repository, including the default branch configuration.",
        "en",
        "8 min",
      ),
      docs(
        "Git — git status",
        "https://git-scm.com/docs/git-status",
        "Reading staged, unstaged and untracked states.",
        "en",
        "8 min",
      ),
      docs(
        "Git — Pro Git book",
        OFFICIAL.gitBook,
        "The free official book that explains Git's snapshot model properly.",
        "en",
        "self-paced",
      ),
      ytSearch(
        "git basics init add commit status for beginners",
        "Short introductions to the Git daily loop on Windows.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-first-repo",
        title: "Your first repository",
        prompt:
          "Create a folder and git init it. Make two commits: one adding a README.md, one adding index.js — paste git log --oneline after each. Then modify index.js *without* staging it, run both git diff and git diff --staged, and explain the difference between the two commands in one sentence.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "git add . stages every untracked and modified file in the current folder.",
          "git diff compares working tree to the index; git diff --staged compares the index to the last commit.",
        ],
        solution: `mkdir first-repo
Set-Location first-repo
git init

Set-Content README.md "# First repo"
git add README.md
git commit -m "Add README"

Set-Content index.js "console.log('v1');"
git add index.js
git commit -m "Add index.js"
git log --oneline
# 1a2b3c4 Add index.js
# 9f8e7d6 Add README

Set-Content index.js "console.log('v2');"
git diff            # shows the unstaged edit
git diff --staged   # empty: nothing has been staged yet`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p1-calculator", "p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-github-repositories",
    slug: "github-remotes-and-pull-requests",
    title: "GitHub: Remotes, Push, Pull and Pull Requests",
    description:
      "Connecting a local repository to GitHub, clone/pull/fetch, the GitHub flow, pull requests, and SSH versus HTTPS authentication on Windows.",
    order: 14,
    estimatedMinutes: 20,
    tags: ["git", "github", "remotes", "pull-requests"],
    prerequisites: ["p1m3-git-fundamentals"],
    relatedTopics: ["p1m3-commits-branches-merges", "p1m3-gitignore", "p1m3-readme-files"],
    learningObjectives: [
      "Connect a local repository to GitHub with remote add and push",
      "Clone, fetch and pull from an existing repository",
      "Describe the GitHub flow: branch, push, pull request, merge",
      "Set up SSH keys on Windows or rely on HTTPS with credential management",
    ],
    simpleExplanation:
      "GitHub hosts your Git repository online so work survives laptop disasters and teammates can collaborate. You link a local repo to a GitHub repo with git remote add origin, then git push -u origin main uploads your commits while git pull brings everyone else's commits down. Day-to-day collaboration happens through pull requests: push a branch, open a PR, get review, merge.",
    detailedContent: `
**Publish an existing local repository**

    git remote add origin git@github.com:you/hello-node.git
    git branch -M main
    git push -u origin main

\`-u\` records \`origin\` as the upstream of \`main\`, so afterwards plain \`git push\` and \`git pull\` know where to go.

**Clone a repository that already exists**

    git clone git@github.com:team/api.git
    cd api          # full history, remote already configured

**Pull versus fetch**

| Command | Effect |
| --- | --- |
| \`git fetch origin\` | download new commits; your files are untouched |
| \`git pull\` | fetch **and** merge into your current branch |

Pull before you start the day's work; fetch when you want to look around without touching your working tree.

**The GitHub flow**

1. Branch: \`git switch -c feat/add-notes\`
2. Commit, then \`git push -u origin feat/add-notes\`
3. Open a pull request — describe *why*, link the issue
4. Review, CI checks, approval, merge (merge commit or squash)
5. \`git switch main && git pull\` to collect the result

**SSH versus HTTPS on Windows**

- **HTTPS** works immediately. Git Credential Manager (bundled with Git for Windows) stores your personal access token in Windows Credential Manager.
- **SSH** uses a key pair: \`ssh-keygen -t ed25519 -C "you@example.com"\`, paste the public key into GitHub, and use the \`git@github.com:\` URL form. Start the agent with \`Start-Service ssh-agent\` and load the key with \`ssh-add ~\\.ssh\\id_ed25519\`.

Verify with \`ssh -T git@github.com\` — a reply of *Hi username!* means authentication works.
    `,
    howItWorks: `
A remote is only a name mapped to a URL; \`git remote -v\` lists yours. \`git push\` uploads the commit objects the server does not have yet and then asks the server to move its branch reference. \`git pull\` is \`git fetch\` followed by a merge (or rebase, if you ask) of the remote branch into the branch you are on — which is why conflicts appear during pull and never during fetch.

Authentication happens with a personal access token over HTTPS or with your key over SSH; the commit objects transferred are identical either way. Protected branches on GitHub additionally require the PR flow, so a direct push to main is rejected even with valid credentials.
    `,
    codeExamples: [
      {
        title: "Publish, collaborate, clean up",
        language: "bash",
        code: `# existing local repository -> GitHub
git remote add origin git@github.com:you/hello-node.git
git branch -M main
git push -u origin main

# next day: start a feature
git switch -c feat/add-notes
# ... edit and commit ...
git push -u origin feat/add-notes      # open the PR from this branch

# after the PR is merged
git switch main
git pull
git branch -d feat/add-notes`,
        description:
          "git remote -v confirms the URL behind 'origin' before you push anything anywhere.",
      },
      {
        title: "Set up SSH authentication on Windows",
        language: "bash",
        code: `ssh-keygen -t ed25519 -C "you@example.com"   # accept the default path
Start-Service ssh-agent
Set-Service -StartupType Automatic ssh-agent
ssh-add ~\\.ssh\\id_ed25519

Get-Content ~\\.ssh\\id_ed25519.pub   # paste into GitHub -> Settings -> SSH keys
ssh -T git@github.com                # Hi you! You've successfully authenticated.`,
        description:
          "The .pub file is the half you share; id_ed25519 (no extension) is your private key and never leaves your machine.",
      },
    ],
    commonMistakes: [
      "Forgetting -u on the first push and getting 'no upstream branch'.",
      "Pushing straight to main and bypassing review; use a feature branch even for small changes.",
      "Running git pull mid-task and mixing a teammate's commits into half-finished work — fetch and look first.",
      "Committing with an email that is not on your GitHub account, so contributions do not link to your profile.",
    ],
    bestPractices: [
      "Prefer SSH once it is set up — no tokens embedded in URLs to rotate.",
      "Open a draft pull request early so CI runs before you consider the work finished.",
      "Write a real pull request description: what changed, why, and how to test it.",
      "Pull before starting work, and delete feature branches after they merge.",
    ],
    realWorldUseCases: [
      "A two-person startup running trunk-based development with short-lived branches and small pull requests.",
      "An open-source contribution: fork, branch, pull request, maintainer review, CI-gated merge.",
    ],
    resources: [
      docs(
        "GitHub — GitHub Flow",
        "https://docs.github.com/en/get-started/using-github/github-flow",
        "The official branch-and-pull-request workflow.",
        "en",
        "10 min",
      ),
      docs(
        "GitHub — Connecting to GitHub with SSH",
        "https://docs.github.com/en/authentication/connecting-to-github-with-ssh",
        "Key generation, the ssh-agent and the ssh -T verification step.",
        "en",
        "12 min",
      ),
      docs(
        "GitHub — About pull requests",
        "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests",
        "What a pull request is and how review and merging work.",
        "en",
        "8 min",
      ),
      docs(
        "Git — git remote",
        "https://git-scm.com/docs/git-remote",
        "Managing the names you push to and pull from.",
        "en",
        "8 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-remote",
        title: "Publish a project",
        prompt:
          "Publish a local project to GitHub over SSH: generate the key, add the public half to your account, add the remote, push main, then create a branch, push it and open a pull request. Record the exact commands you ran and paste the output of ssh -T git@github.com.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "git remote -v confirms which URL the name origin points at.",
          "The first push of a brand-new branch needs -u origin <branch>.",
        ],
      },
    ],
    projectIds: ["p1-contact-manager"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-commits-branches-merges",
    slug: "commits-branches-and-merges",
    title: "Commits, Branches and Merges",
    description:
      "Creating and switching branches, fast-forward versus real merges, resolving conflicts, and when (not) to rebase.",
    order: 15,
    estimatedMinutes: 22,
    tags: ["git", "branches", "merging"],
    prerequisites: ["p1m3-git-fundamentals"],
    relatedTopics: ["p1m3-github-repositories", "p1m3-gitignore", "p1m3-git-fundamentals"],
    learningObjectives: [
      "Create, list and delete branches with git switch and git branch",
      "Explain fast-forward merges versus true (three-way) merges",
      "Resolve a merge conflict step by step",
      "State when rebasing is safe and when it rewrites shared history",
    ],
    simpleExplanation:
      "A branch is a movable label pointing at a commit — creating one costs nothing and takes a millisecond. You build a feature on a branch and merge it back into main. If main has not moved, Git simply fast-forwards the label; if both sides changed, Git creates a merge commit and may ask you to resolve conflicts by editing marked files. Rebase rewrites history, so it is for cleaning up your own local work — never for branches other people already use.",
    detailedContent: `
**Branch commands**

    git switch -c feat/add-notes   # create a branch and move to it
    git switch main                # move back
    git branch                     # list local branches
    git branch -d feat/add-notes   # delete after merging (safe)

\`git switch\` is the modern command; \`git checkout <branch>\` still does the same job for moving between branches.

**Merging**

    git switch main
    git merge feat/add-notes

Two outcomes:

| Situation | Result |
| --- | --- |
| main has no new commits | **Fast-forward**: main's label simply moves to the branch tip |
| both sides have new commits | **True merge**: Git writes a merge commit with two parents |

Force a merge commit even on a fast-forward with \`git merge --no-ff feat/x\` when you want an explicit "this was a feature" record in the history.

**Conflicts.** When both sides edited the same lines, the merge stops and the conflicted file contains markers:

    <<<<<<< HEAD
    const port = process.env.PORT ?? 3000;
    =======
    const port = Number(process.env.PORT || 3000);
    >>>>>>> feat/add-notes

Edit the file into the version you actually want, delete the three marker styles, \`git add\` the file, then \`git commit\` — a paused merge resumes automatically. \`git merge --abort\` cancels the whole attempt.

**Rebase — handle with care.** \`git rebase main\` replays your branch's commits on top of main, giving a clean linear history. But it *creates new commit ids*: never rebase a branch that other people have already pulled. Rule of thumb: rebase your own unpushed feature branches; merge everywhere else.
    `,
    howItWorks: `
A branch is one small file inside \`.git\` holding a commit hash. Creating \`feat/x\` copies main's hash into that file; committing on the branch only moves it forward. \`git merge\` finds the best common ancestor, three-way compares ancestor → ours → theirs, auto-merges changes that do not overlap, and stops where they do.

Rebase takes a different route: it stores your commits as a list of patches, rewinds your branch to the new base, and replays them one by one — producing fresh hashes. That is why a pushed-and-rebased branch needs \`push --force\`, and why doing that to a shared branch wrecks your teammates' clones.
    `,
    codeExamples: [
      {
        title: "Branch, merge, clean up",
        language: "bash",
        code: `git switch main
git switch -c feat/port-config
# ... edit, git add, git commit ...
git switch main
# meanwhile a teammate pushed new commits to main ...
git merge feat/port-config        # merge commit, or fast-forward
git branch -d feat/port-config    # tidy up after the merge`,
        description:
          "git log --oneline --graph after the merge shows whether you got a fast-forward or a real merge commit.",
      },
      {
        title: "Cause and resolve a conflict",
        language: "bash",
        code: `git merge feat/add-notes
# CONFLICT (content): Merge conflict in src/index.js

Get-Content src\\index.js         # inspect the <<<<<<< ======= >>>>>>> markers

# edit the file into the correct final version, then:
git add src\\index.js
git commit -m "Merge feat/add-notes, resolve PORT conflict"
git log --oneline --graph         # the merge commit has two parents`,
        description:
          "Conflicts are Git asking a human a question it cannot answer: which of these two intents should survive?",
      },
    ],
    commonMistakes: [
      "Rebasing a shared branch and force-pushing, rewriting history for everyone and breaking teammates' clones.",
      "Abandoning a conflicted merge with git merge --abort every time — the conflict will still be waiting tomorrow.",
      "Deleting a branch before merging it (git branch -D when -d refuses) and losing the commits.",
      "Expecting every merge to fast-forward: after a teammate's push, a real merge commit is completely normal.",
    ],
    bestPractices: [
      "One branch, one purpose; name them feat/…, fix/… and chore/….",
      "Keep branches short-lived — a day or two — so merges stay small and conflicts rare.",
      "Use --no-ff for feature merges when you want each pull request visible in history.",
      "Never force-push a shared branch; if a rewrite is unavoidable, coordinate first.",
    ],
    realWorldUseCases: [
      "Two developers editing the same API file: the conflict markers force the human decision Git cannot make for you.",
      "Squashing five 'fix typo' commits with an interactive rebase before opening the pull request.",
    ],
    resources: [
      docs(
        "Git — git switch",
        "https://git-scm.com/docs/git-switch",
        "Creating and moving between branches with the modern command.",
        "en",
        "8 min",
      ),
      docs(
        "Git — git merge",
        "https://git-scm.com/docs/git-merge",
        "Fast-forward versus true merge, conflict handling and options.",
        "en",
        "12 min",
      ),
      docs(
        "Git — git rebase",
        "https://git-scm.com/docs/git-rebase",
        "What rewriting history actually does, and the safety rules.",
        "en",
        "12 min",
      ),
      ytSearch(
        "git branches and merge conflicts explained",
        "Visual walkthroughs of branching, merging and conflict resolution.",
        "en",
        "12–25 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-merge",
        title: "Cause and resolve a conflict",
        prompt:
          "Create a branch, edit one line of a file, switch back to main, edit the same line differently, and merge. Paste the conflict markers you see. Resolve the conflict so the file contains the agreed value, finish the merge, and show git log --oneline --graph. Then repeat the experiment with git rebase main and describe how the resulting history differs.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "Both edits must touch the same line for Git to stop and ask.",
          "git merge --abort safely cancels a merge you want to retry from scratch.",
        ],
      },
    ],
    projectIds: ["p1-contact-manager"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-gitignore",
    slug: "gitignore-patterns",
    title: ".gitignore: Keeping Junk out of Git",
    description:
      "Pattern syntax, the standard Node.js ignore list, untracking files that were committed by mistake, and the global gitignore.",
    order: 16,
    estimatedMinutes: 14,
    tags: ["git", "gitignore", "security"],
    prerequisites: ["p1m3-git-fundamentals"],
    relatedTopics: ["p1m3-environment-variables", "p1m3-package-lock", "p1m3-github-repositories"],
    learningObjectives: [
      "Write and read .gitignore patterns including negation and anchors",
      "Apply the standard Node.js ignore list from the first commit",
      "Untrack a file that was committed before its ignore rule existed",
      "Configure a global gitignore for OS and editor noise",
    ],
    simpleExplanation:
      ".gitignore tells Git which files to pretend do not exist: dependencies, build output and especially .env files with secrets. The rules are plain text patterns evaluated per folder, and they only affect files Git has not started tracking yet — anything already committed keeps being tracked until you explicitly untrack it. Commit the .gitignore so everyone on the team ignores the same things.",
    detailedContent: `
**Pattern syntax** (one pattern per line)

| Pattern | Meaning |
| --- | --- |
| \`node_modules/\` | that directory anywhere in the repository |
| \`/dist\` | only the top-level dist folder |
| \`*.log\` | any file ending in .log |
| \`coverage/**\` | everything inside coverage |
| \`.env.local\` | that exact name in any folder |
| \`!keep.log\` | do **not** ignore this — exceptions must come after the matching rule |
| \`# comment\` | comments and blank lines are skipped |

**A Node.js starter .gitignore**

    # dependencies
    node_modules/
    .npm

    # builds
    dist/
    build/
    coverage/

    # secrets and local config
    .env
    .env.*.local

    # logs
    *.log
    npm-debug.log*

    # OS / editor noise
    .DS_Store
    Thumbs.db

**Already tracked?** Adding \`node_modules/\` to .gitignore does nothing for files Git already tracks:

    git rm -r --cached node_modules
    git commit -m "Stop tracking node_modules"

\`--cached\` (or \`--staged\`) removes the file from Git's index but leaves it on your disk. For a file you must keep locally yet never commit again — an IDE configuration, a local override — use \`git update-index --skip-worktree <file>\`.

**Global gitignore.** Editor and OS junk is personal, not project-wide:

    git config --global core.excludesFile ~/.gitignore_global
    # then put .DS_Store, Thumbs.db and *.swp in that file
    `,
    howItWorks: `
Git consults ignore rules from several places, with later sources overriding earlier ones: command-line patterns, \`.gitignore\` files in the current directory and every parent (the closest file wins), \`.git/info/exclude\` (local to your clone, never pushed) and the global \`core.excludesFile\`.

The command \`git check-ignore -v <path>\` prints exactly which file and line matched — the single best debugging tool for "why is this ignored?" or "why is this NOT ignored?". Note that \`.gitignore\` itself belongs in the repository: it describes the project, not your machine.
    `,
    codeExamples: [
      {
        title: "Ignore, then verify each rule",
        language: "bash",
        code: `Set-Content .gitignore "node_modules/\`ndist/\`n.env\`n*.log"

git check-ignore -v node_modules/left-pad/package.json
# .gitignore:1:node_modules/   node_modules/left-pad/package.json

git check-ignore -v .env
# .gitignore:3:.env            .env

git status --short             # none of the ignored paths appear`,
        description:
          "Set-Content with PowerShell's `n escape writes the four lines; git check-ignore -v is the proof each rule works.",
      },
      {
        title: "Untrack something already committed",
        language: "bash",
        code: `git rm -r --cached node_modules
git rm --cached .env
git commit -m "Untrack generated files and secrets"
git status --short             # the files stay on disk, Git stops tracking them

# a file you need locally but must never commit again
git update-index --skip-worktree .vscode/settings.json`,
        description:
          "If a secret was ever committed, untracking is not enough — rotate the key, because it remains in Git history.",
      },
    ],
    commonMistakes: [
      "Believing .gitignore hides a file that is already tracked — it does not; use git rm --cached.",
      "Ignoring .env after committing it and assuming the secret is safe: it is still in history, so rotate the key.",
      "Ignoring files the team actually needs, such as package-lock.json or .vscode/settings.json.",
      "Forgetting that a pattern with a leading slash is anchored to the folder containing the .gitignore.",
    ],
    bestPractices: [
      "Commit .gitignore as one of the first files of any new repository.",
      "Start from the standard Node.js list: node_modules, .env, dist, coverage, logs.",
      "Debug with git check-ignore -v instead of guessing why a path is or is not ignored.",
      "Keep machine-specific noise (editor backups, OS files) in the global gitignore, not the project one.",
    ],
    realWorldUseCases: [
      "A pull request that accidentally adds 40 MB of node_modules — prevented by a single line.",
      "A leaked database password in a committed .env: the recovery plan is rotation first, history rewriting second.",
    ],
    resources: [
      docs(
        "Git — gitignore",
        "https://git-scm.com/docs/gitignore",
        "The official pattern format, precedence and special cases.",
        "en",
        "12 min",
      ),
      docs(
        "Git — git rm",
        "https://git-scm.com/docs/git-rm",
        "Removing tracked files from the index while keeping them on disk.",
        "en",
        "8 min",
      ),
      docs(
        "Git — git config",
        "https://git-scm.com/docs/git-config",
        "Setting core.excludesFile for a machine-wide gitignore.",
        "en",
        "reference",
      ),
      ytSearch(
        "gitignore tutorial node.js .env secrets",
        "Practical .gitignore walkthroughs for Node.js projects.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-gitignore",
        title: "Ignore, verify, untrack",
        prompt:
          "Create a .gitignore that ignores node_modules/, dist/, .env and *.log. Prove every rule with git check-ignore -v. Then deliberately commit a file named test.log, show that git status no longer complains even though the file is tracked, untrack it the right way and commit that change. Finally configure a global gitignore and put Thumbs.db in it.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "git check-ignore -v prints the file and line number of the matching rule.",
          "git rm --cached <file> keeps the file on disk but removes it from Git's index.",
        ],
        solution: `Set-Content .gitignore "node_modules/\`ndist/\`n.env\`n*.log"
git check-ignore -v .env            # .gitignore:3:.env  .env

Add-Content test.log "noise"
git add test.log
git commit -m "oops"
git rm --cached test.log
git commit -m "Untrack test.log"
git status --short                  # test.log is now ignored

git config --global core.excludesFile ~/.gitignore_global
Add-Content ~/.gitignore_global "Thumbs.db"`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p1-file-organizer"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-readme-files",
    slug: "readme-files",
    title: "README Files: Your Project's Front Door",
    description:
      "What a README must answer, the standard section structure, the Markdown you need daily, and screenshots that survive forks.",
    order: 17,
    estimatedMinutes: 12,
    tags: ["documentation", "markdown", "github"],
    prerequisites: ["p1m3-git-fundamentals"],
    relatedTopics: ["p1m3-github-repositories", "p1m3-npm-scripts"],
    learningObjectives: [
      "Explain what a first-time visitor needs to learn from a README",
      "Structure a README with the standard sections",
      "Use the Markdown syntax needed every day: headings, lists, code fences, tables, links",
      "Add a screenshot using a relative path and meaningful alt text",
    ],
    simpleExplanation:
      "README.md is the first — often the only — thing anyone reads: recruiters skimming a portfolio, teammates joining a project, users deciding whether to install your package. A good one answers four questions fast: what is this, how do I install it, how do I run it, and which knobs may I turn. It is written in Markdown, a plain-text format that GitHub renders into styled HTML.",
    detailedContent: `
**Standard structure**

1. **Title and one-line pitch** — \`# Notes CLI\`
2. **About** — the problem it solves, in two or three sentences
3. **Install** — copy-pasteable commands starting from a cold machine
4. **Usage** — the commands a user actually runs, with example output
5. **Scripts** — a table of the package.json scripts
6. **Configuration** — required environment variables, pointing at .env.example
7. **License** — MIT, ISC or whatever the project uses

**Markdown essentials**

| You type | You get |
| --- | --- |
| \`# Title\`, \`## Section\` | heading levels |
| \`- item\` or \`1. item\` | bullet and numbered lists |
| fenced code with \`\`\`js | a syntax-highlighted code block |
| \`**bold**\`, \`*italic*\` | emphasis |
| \`[text](url)\` | a link |
| pipe-delimited rows | a table |
| \`> quote\` | a blockquote |

**Screenshots and assets.** Store images in an \`assets/\` folder and reference them with a *relative* path so the README works on every fork and on npm:

    ![Notes CLI screenshot](./assets/screenshot.png)

Alt text is not decoration: it is what screen readers announce and what readers see when the image fails to load.

**Badges.** A build-status, version and licence badge row is fine, but badges never replace a real Install section.
    `,
    howItWorks: `
GitHub renders README.md on the repository landing page by converting the Markdown to HTML on the server — no JavaScript from your README ever runs in a visitor's browser. npm performs the same rendering on package pages, which is why relative image paths must also be inside the published files (controlled by the \`files\` field or an \`.npmignore\`).

A README that only renders on GitHub because it relies on site-specific features is a trap: plain Markdown travels to npm, GitLab, static site generators and plain text editors without losing meaning.
    `,
    codeExamples: [
      {
        title: "README.md skeleton",
        language: "markdown",
        code: `\`\`\`markdown
# Notes CLI

A tiny command-line notebook that stores notes in a JSON file.

## Install

\`\`\`bash
git clone https://github.com/you/notes-cli.git
cd notes-cli
npm ci
\`\`\`

## Usage

\`\`\`bash
npm start add "Buy milk"
npm start list
\`\`\`

| Script | Purpose |
| --- | --- |
| \`npm start\` | Run the CLI |
| \`npm test\` | Run the tests |

## Configuration

Copy \`.env.example\` to \`.env\` and set \`NOTES_FILE\`.

## License

MIT
\`\`\``,
        description:
          "Copy this skeleton, replace the content, and every project you build from now on has a proper front door.",
      },
      {
        title: "Links, images and emphasis",
        language: "markdown",
        code: `**Bold** and *italic* in running text.

Read the [Pro Git book](https://git-scm.com/book/en/v2) for the theory.

> Prefer small, frequent commits with messages that explain why.

![Notes CLI screenshot](./assets/screenshot.png)`,
        description:
          "Relative image paths keep working when someone forks the repository; absolute paths to your laptop do not.",
      },
    ],
    commonMistakes: [
      "A README that is only a title and a badge row — the classic empty front door.",
      "Instructions that skip a step (npm start with no Install section), so nobody gets past minute one.",
      "Absolute image URLs pointing at a personal gist or local disk that later disappear.",
      "Documenting flags that no longer exist: update the README in the same pull request as the change.",
    ],
    bestPractices: [
      "Write the Install section, then follow it yourself on a clean clone — if it fails, the README is wrong.",
      "Keep the Scripts table in the README in sync with package.json.",
      "Show real example output; it sets expectations better than prose.",
      "Update documentation in the same PR as any user-facing change.",
    ],
    realWorldUseCases: [
      "A portfolio README that carries a candidate through the first minute of a technical review.",
      "An internal tool whose README saves its author a dozen 'how do I run this?' messages every sprint.",
    ],
    resources: [
      docs(
        "GitHub — Basic writing and formatting syntax",
        "https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax",
        "GitHub's Markdown reference: headings, lists, tables, images and more.",
        "en",
        "12 min",
      ),
      docs(
        "GitHub — About README files",
        "https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readme-files",
        "Where READMEs render and how GitHub picks the file.",
        "en",
        "6 min",
      ),
      ytSearch(
        "how to write a great GitHub README markdown",
        "Examples of strong READMEs and the Markdown used to build them.",
        "en",
        "8–15 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-readme",
        title: "Write your project's README",
        prompt:
          "Write a complete README.md for one of your Phase 1 projects: title and pitch, About, Install with copy-paste commands, Usage showing example output, a Scripts table that matches package.json, a Configuration section pointing at .env.example, and a License line. Push it to GitHub, look at the rendered page, and report anything that looked wrong.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "Follow the Install section literally on a fresh clone — if it fails, the README is wrong.",
          "Relative image paths (./assets/…) survive forks; absolute ones do not.",
        ],
      },
    ],
    projectIds: ["p1-notes-cli"],
    quizId: "quiz-p1-m3",
  },
  {
    ...shared,
    id: "p1m3-debugging-breakpoints",
    slug: "debugging-with-breakpoints",
    title: "Debugging Node.js with Breakpoints",
    description:
      "Breakpoints, conditional breakpoints and logpoints in VS Code, launch.json for Node.js, stepping, the call stack and the debug console.",
    order: 18,
    estimatedMinutes: 20,
    tags: ["debugging", "vscode", "breakpoints"],
    prerequisites: ["p1m3-vscode-setup", "p1m3-npm-scripts"],
    relatedTopics: ["p1m2-debugging-javascript", "p1m3-vscode-setup"],
    learningObjectives: [
      "Set breakpoints, conditional breakpoints and logpoints in VS Code",
      "Create a launch.json configuration for a Node.js program",
      "Use step over, step into, step out, the call stack and the debug console",
      "Attach the debugger to an already-running process with node --inspect",
    ],
    simpleExplanation:
      "A breakpoint pauses your program on an exact line so you can inspect real values instead of guessing with console.log. In VS Code you click the gutter to set one, press F5 to start debugging, and use F10 and F11 to move line by line. The variables panel, watch expressions and call stack show the program's live state, and the debug console evaluates JavaScript right at the paused point.",
    detailedContent: `
**Setting breakpoints**

- Click the gutter to the left of a line number (or press F9) — a red dot appears.
- Right-click the gutter → **Conditional Breakpoint**: pauses only when your expression is true, for example \`id === "42"\`.
- Right-click the gutter → **Logpoint**: prints a message to the Debug Console *without* pausing; interpolate with \`{variable}\`.
- Hit-count conditions (\`>10\`, \`%5\`) pause only after a number of hits.

**launch.json** — create it from the Run and Debug panel (Node.js snippet):

    {
      "version": "0.2.0",
      "configurations": [
        {
          "type": "node",
          "request": "launch",
          "name": "Launch program",
          "program": "\${workspaceFolder}/src/index.js",
          "skipFiles": ["<node_internals>/**"],
          "envFile": "\${workspaceFolder}/.env",
          "console": "integratedTerminal"
        }
      ]
    }

**The debug toolbar**

| Action | Key | What it does |
| --- | --- | --- |
| Continue | F5 | run until the next breakpoint |
| Step over | F10 | execute the current line, pause on the next |
| Step into | F11 | enter the function called on this line |
| Step out | Shift+F11 | finish the current function, pause in its caller |
| Restart | Ctrl+Shift+F5 | relaunch with the same configuration |
| Stop | Shift+F5 | kill the session |

**Panes that matter.** *Variables* lists locals and parameters; *Watch* keeps expressions alive across steps; *Call Stack* shows who called whom — click a frame to inspect that scope; the *Debug Console* evaluates expressions in the currently paused scope.

**Attach to a running process.** Start your program with \`node --inspect src/index.js\` (add \`--inspect-brk\` to pause before the first line), then use Run and Debug → *Attach to Process*.
    `,
    howItWorks: `
When VS Code launches Node with the inspector enabled, Node opens a WebSocket on port 9229 and speaks a JSON-RPC dialect of the V8 debugger protocol. Setting a breakpoint tells V8 to trap on that line; when it hits, execution freezes and VS Code reads scopes, variables and the call stack over the same socket.

Step over is a single V8 step; step into descends into the current frame; step out returns to the caller and pauses. \`console: "internalConsole"\` streams your logs to the Debug Console, while \`integratedTerminal\` gives the program a real stdin — the only correct choice for a command-line tool that asks for input.
    `,
    codeExamples: [
      {
        title: "launch.json for a CLI with arguments",
        language: "json",
        code: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug notes CLI",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/src/index.js",
      "args": ["add", "Buy milk"],
      "cwd": "\${workspaceFolder}",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}`,
        description:
          "args are passed to your program exactly like typing them in a terminal; skipFiles keeps Node internals out of your stepping.",
      },
      {
        title: "A bug worth a conditional breakpoint",
        language: "js",
        code: `function average(nums) {
  let total = 0;
  for (const n of nums) {
    total += n;
  }
  return total / nums.length; // pause here: nums is [] on the bad call
}

console.log(average([2, 4, 6])); // 4
console.log(average([]));        // NaN`,
        description:
          "Set a conditional breakpoint with the condition nums.length === 0: execution pauses only for the empty array, and the Variables pane shows the whole story.",
      },
    ],
    commonMistakes: [
      "Scattering console.log everywhere and restarting constantly — a conditional breakpoint inspects the one case that matters.",
      "Stepping through node_modules for minutes because skipFiles was never configured.",
      "Choosing internalConsole for a CLI that needs stdin: input silently fails; use integratedTerminal.",
      "Debugging TypeScript without source maps, so breakpoints land in generated code or are ignored entirely.",
    ],
    bestPractices: [
      "Reach for a conditional breakpoint the moment a bug only appears for one input.",
      'Add "skipFiles": ["<node_internals>/**"] so you stay in your own code.',
      "Use logpoints in hot loops where pausing would change the timing you are measuring.",
      "Prefer the debugger over print statements — and delete leftover logs once the bug is fixed.",
    ],
    realWorldUseCases: [
      "A 'sometimes the total is NaN' report: a conditional breakpoint on the empty input finds the cause in seconds.",
      "Debugging a long-lived server: node --inspect plus attach lets you pause a process that has been running for hours.",
    ],
    resources: [
      docs(
        "VS Code — Node.js debugging",
        "https://code.visualstudio.com/docs/nodejs/nodejs-debugging",
        "Auto attach, launch.json, conditional breakpoints and source maps.",
        "en",
        "20 min",
      ),
      docs(
        "VS Code — Debugging",
        "https://code.visualstudio.com/docs/editor/debugging",
        "The general debugging UI: breakpoints, call stack, watch and the debug console.",
        "en",
        "15 min",
      ),
      docs(
        "Node.js — Debugger",
        "https://nodejs.org/api/debugger.html",
        "The inspector protocol behind --inspect and --inspect-brk.",
        "en",
        "12 min",
      ),
      ytSearch(
        "vs code debug node.js breakpoints launch.json",
        "Hands-on debugging sessions with breakpoints and watch expressions.",
        "en",
        "10–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p1m3-debug",
        title: "Break, inspect, fix",
        prompt:
          "Take a script with a bug that only occurs for one input (for example the average function above returning NaN for an empty array). Create launch.json, set a conditional breakpoint that fires only for that input, and use the Variables pane plus Watch to find the cause. Then delete every console.log from the file and solve the bug using the debugger alone.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: [
          "Right-click the gutter → Conditional Breakpoint, with the condition nums.length === 0.",
          "The Call Stack pane shows which caller produced the bad value.",
        ],
      },
    ],
    projectIds: ["p1-weather-client"],
    quizId: "quiz-p1-m3",
  },
];

export const quiz: Quiz = {
  id: "quiz-p1-m3",
  moduleId: "p1-m3",
  title: "Module 3 quiz — Development environment & Git",
  description:
    "Test your understanding of Node.js installs and LTS, npm scripts and lockfiles, semantic versioning, environment variables, Git and debugging.",
  questions: [
    {
      id: "q-p1m3-1",
      type: "multiple-choice",
      prompt: "You are about to deploy a production API. Which Node.js release should the servers run?",
      options: [
        "The newest Current release, so you get the latest features",
        "The Active LTS release, which receives critical and security fixes for roughly 30 months",
        "A nightly build, so you catch bugs before anyone else",
        "Any End-of-Life release that happens to match your dependencies",
      ],
      correctIndex: 1,
      explanation:
        "The Node.js project itself states that production applications should only use Active LTS or Maintenance LTS. Current releases change rapidly and odd-numbered lines may be unsupported within months; EOL releases receive no security fixes at all.",
      optionExplanations: [
        "Current is for testing forward compatibility, not for production stability.",
        "Correct — Active LTS is the supported production line.",
        "Nightly builds are for Node.js contributors, not application deployments.",
        "EOL means no fixes ever, including for security vulnerabilities.",
      ],
    },
    {
      id: "q-p1m3-2",
      type: "code-output",
      prompt:
        "A package.json contains \"lodash\": \"^4.17.21\" and no lockfile exists. After npm install, which version is installed?",
      code: `{
  "dependencies": {
    "lodash": "^4.17.21"
  }
}`,
      language: "json",
      options: ["4.17.20", "4.17.21", "5.0.0", "3.99.99"],
      correctIndex: 1,
      explanation:
        "The caret range ^4.17.21 accepts >=4.17.21 below 5.0.0. Among the options only 4.17.21 qualifies: 4.17.20 is older than the floor, 5.0.0 is the excluded major, and 3.99.99 is below the floor. npm would pick the newest published version inside the range — if 4.18.0 existed it would win, but it is not an option here.",
      optionExplanations: [
        "4.17.20 is lower than the minimum 4.17.21 allowed by the range.",
        "Correct — the smallest version inside ^4.17.21 offered here.",
        "^4.17.21 never accepts a 5.x release; that would require ^5.0.0 or a manual upgrade.",
        "Anything below 4.17.21 is outside the range.",
      ],
    },
    {
      id: "q-p1m3-3",
      type: "code-output",
      prompt: "What does git status --short print after these commands?",
      code: `git init
echo hello > notes.txt
git add notes.txt
echo world >> notes.txt
git status --short`,
      language: "bash",
      options: ["A  notes.txt", " M notes.txt", "AM notes.txt", "?? notes.txt"],
      correctIndex: 2,
      explanation:
        "git add staged a brand-new file, so the index column shows A. The second echo modified the working-tree copy after staging, so the worktree column shows M. git status --short combines them as AM: staged for addition, plus further unstaged modifications.",
      optionExplanations: [
        "A alone would mean the staged version equals the working tree — but the file changed after staging.",
        " M alone would mean the file was already tracked and only has unstaged edits; here it is also newly staged.",
        "Correct — staged as a new file (A) plus unstaged modifications (M).",
        "?? means untracked; the file was added to the index, so it is tracked.",
      ],
    },
    {
      id: "q-p1m3-4",
      type: "find-bug",
      prompt: "Running npm install fails immediately. What is wrong here?",
      code: `{
  "name": "demo",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
  }
}`,
      language: "json",
      options: [
        "The value of scripts.start must be wrapped in single quotes",
        "The trailing comma after the start script makes the file invalid JSON",
        "package.json is not allowed to contain a scripts field",
        'The name field must be scoped, for example "@me/demo"',
      ],
      correctIndex: 1,
      explanation:
        "package.json is strict JSON: trailing commas are not permitted. npm refuses to parse the file and reports a SyntaxError pointing at the offending position. JSON also forbids comments and single-quoted strings, which are the other two classic package.json mistakes.",
      optionExplanations: [
        "JSON requires double quotes; single quotes would be another syntax error, not a fix.",
        "Correct — remove the trailing comma and every npm command works again.",
        "The scripts field is one of the most important parts of package.json.",
        "Unscoped names are perfectly valid for private packages.",
      ],
    },
    {
      id: "q-p1m3-5",
      type: "short-answer",
      prompt:
        "Which file must be committed to version control so that every developer and every CI run installs the exact same dependency versions? Answer with the file name.",
      acceptedKeywords: ["package-lock.json", "package lock json", "package-lock", "lockfile", "lock file"],
      explanation:
        "package-lock.json pins the exact resolved version, download location and integrity hash of every package in the tree. package.json only declares ranges; the lockfile turns those ranges into a reproducible fact. node_modules is regenerated output and is never committed.",
    },
    {
      id: "q-p1m3-6",
      type: "multiple-choice",
      prompt:
        "In CI you want a clean, deterministic install that fails loudly when package.json and the lockfile disagree. Which command should the pipeline run?",
      options: ["npm install", "npm ci", "npm install -g express", "npm update"],
      correctIndex: 1,
      explanation:
        "npm ci deletes node_modules, installs exactly what the lockfile specifies without re-resolving ranges, and exits with an error if package.json and the lockfile are out of sync. npm install and npm update re-resolve; npm install -g installs globally, which is never what a CI build of your app wants.",
      optionExplanations: [
        "npm install may update the lockfile and merge into an existing node_modules — not deterministic.",
        "Correct — clean install from the lockfile, with an error on any mismatch.",
        "Global installs put packages outside the project; the build would not include them.",
        "npm update deliberately raises versions within their ranges.",
      ],
    },
    {
      id: "q-p1m3-7",
      type: "multiple-choice",
      prompt:
        "You are writing a package.json script on Windows PowerShell 5.1. Which expression runs cmd2 only if cmd1 succeeds?",
      options: ["cmd1 && cmd2", "cmd1; if ($?) { cmd2 }", "cmd1 | cmd2", "cmd1 and cmd2"],
      correctIndex: 1,
      explanation:
        "Windows PowerShell 5.1 does not understand && (PowerShell 7 added it, but npm on Windows usually spawns the 5.1-compatible cmd.exe anyway). The portable pattern is cmd1; if ($?) { cmd2 } — $? is true when the previous command succeeded. A pipe sends objects, not success conditions, and 'and' is not an operator.",
      optionExplanations: [
        "&& is bash syntax and fails on Windows PowerShell 5.1.",
        "Correct — $? is the success flag of the previous command.",
        "| pipes output objects; it does not gate execution on success.",
        "'and' is not an operator in PowerShell or cmd.",
      ],
    },
    {
      id: "q-p1m3-8",
      type: "find-bug",
      prompt:
        "A teammate added node_modules/ to .gitignore, yet git status still reports changes inside node_modules. What is the real cause?",
      code: `# .gitignore
node_modules/`,
      language: "bash",
      options: [
        "node_modules was already tracked before the ignore rule existed — untrack it with git rm -r --cached node_modules and commit",
        ".gitignore only applies to files sitting in the repository root",
        "Git cannot ignore directories, only individual files",
        "You must run git pull --rebase before ignore rules take effect",
      ],
      correctIndex: 0,
      explanation:
        "Ignore rules only affect untracked files. Because node_modules was committed at some point, Git keeps tracking every change inside it. git rm -r --cached node_modules removes it from the index (the files stay on disk), and the follow-up commit makes Git stop watching them — after which .gitignore finally has an effect.",
      optionExplanations: [
        "Correct — tracked files ignore .gitignore until you untrack them.",
        "Patterns match anywhere in the repository; a leading slash is what anchors a rule.",
        "Directories are ignored all the time — that is what node_modules/ means.",
        "Pulling has no effect on which files Git tracks locally.",
      ],
    },
  ],
};
