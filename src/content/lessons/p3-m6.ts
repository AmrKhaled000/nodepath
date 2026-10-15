import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, article, docs, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p3-m6",
  slug: "devops-and-deployment",
  title: "DevOps & Deployment",
  description:
    "Ship a Node.js API like a real team does: Linux servers, Docker images, CI/CD pipelines with GitHub Actions, Nginx and TLS, production databases, process management, logging, metrics, health checks, safe migrations, backups, rollbacks and incident debugging.",
  phaseId: "phase-3",
  order: 6,
};

const shared = {
  phaseId: "phase-3",
  moduleId: "p3-m6",
  difficulty: "advanced",
  quizId: "quiz-p3-m6",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p3m6-linux-fundamentals",
    slug: "linux-fundamentals-for-deployment",
    title: "Linux Fundamentals for Deployment",
    description:
      "SSH logins, users and permissions, package managers, services and the everyday shell commands that every Node.js deployment eventually runs on.",
    order: 1,
    estimatedMinutes: 20,
    tags: ["linux", "ssh", "server", "devops"],
    prerequisites: [],
    relatedTopics: ["p3m6-environment-configuration", "p3m6-process-management", "p3m6-cloud-deployment"],
    learningObjectives: [
      "Log in to a Linux server over SSH with key-based authentication",
      "Explain file ownership and permissions and why deploy users need least privilege",
      "Install packages and inspect services with the distribution package manager and systemctl",
      "Distinguish a running process from a listening port using ps and ss",
    ],
    simpleExplanation:
      "Almost every production Node.js server is a Linux box you reach through a terminal. SSH is the secure remote-login protocol; you authenticate with a key pair instead of a password, land in a shell, and run commands just like locally. The server is managed with tools like apt for software installs and systemctl to start, stop and auto-restart services such as your API, Nginx or the database.",
    detailedContent: `
Most clouds ship Ubuntu LTS, Debian, or a similar distribution — long-term-support releases that receive security updates for years. Learning a few commands covers 90% of deployment work:

- **SSH.** \`ssh deploy@203.0.113.10\` opens a remote shell. Key-based auth uses a private key on your laptop and a matching public key in \`~/.ssh/authorized_keys\` on the server. After keys work, disable password login.
- **Users and least privilege.** Never deploy as root. Create a dedicated user (\`useradd -m deploy\`), give it sudo only for what it needs, and keep application files owned by it. Permissions are a \`user group other\` triplet of rwx bits; \`chmod 640 .env\` means the owner reads/writes, the group reads, everyone else nothing.
- **Packages.** \`apt update\` refreshes the package index; \`apt install nginx\` installs software. \`apt upgrade\` applies updates — schedule it, don't surprise production with it mid-incident.
- **Services.** systemd is the init system and service manager. \`systemctl status nginx\`, \`systemctl restart api\`, \`systemctl enable api\` (start on boot). Logs per service: \`journalctl -u api -f\`.
- **Observing the machine.** \`top\`/\`htop\` for CPU and memory, \`ss -tlnp\` for listening TCP ports, \`df -h\` for disk space, \`free -h\` for RAM, \`uptime\` for load average.
- **Firewall.** ufw (Ubuntu) or nftables control inbound traffic. A common setup: allow SSH, HTTP and HTTPS only.

None of this requires memorising everything on day one; it requires knowing these tools exist so an outage starts with investigation instead of panic.
    `,
    howItWorks: `
When you run \`ssh deploy@host\`, your client resolves the host, connects to port 22, and negotiates an encrypted channel. With public-key auth the server challenges you to prove you hold the private key; the proof is signed and verified against \`authorized_keys\`. The server's sshd then spawns a login shell for your user.

Services you install don't run in your shell — they run under systemd (PID 1, started by the kernel at boot). systemd reads unit files describing how to start the program, whether to restart it on failure, and which users it runs as. Your shell is just another child process; systemctl talks to systemd over D-Bus.
    `,
    codeExamples: [
      {
        title: "First-login hardening and a deploy user",
        language: "bash",
        code: `# From your laptop, as root on a fresh server:
adduser deploy
usermod -aG sudo deploy

# As the deploy user: publish your key
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... you@laptop" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Only AFTER your key login works, as root:
sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh`,
        description:
          "Creates a non-root deploy user, installs your public key, then (deliberately last) turns off password login so you cannot lock yourself out.",
      },
      {
        title: "Daily inspection commands",
        language: "bash",
        code: `uptime                      # load average — is the machine overloaded?
ss -tlnp                    # which processes listen on which ports
df -h                       # disk full? (a classic outage cause)
journalctl -u api -n 100 --no-pager   # last 100 log lines of your service
systemctl is-active nginx   # "active" or "inactive"`,
        description:
          "Run these whenever something feels off; they quickly separate machine problems from application problems.",
      },
    ],
    commonMistakes: [
      "Running the app as root — any vulnerability in your API becomes a full server compromise.",
      "Disabling password SSH login before confirming key-based login works, locking yourself out.",
      "Forgetting the firewall: cloud VM firewall defaults vary and are easy to misread.",
      "Letting the root disk fill up with logs; databases, Docker and journald all love to write.",
    ],
    bestPractices: [
      "Use a dedicated non-root deploy user and keep sudo for admin tasks only.",
      "Prefer LTS distributions and apply security updates on a schedule, not ad hoc.",
      "Record server setup as shell scripts or cloud-init user data — pets become cattle only if setup is reproducible.",
    ],
    realWorldUseCases: [
      "First-time setup of a small VPS that will host your API, Nginx and a database.",
      "On-call debugging: SSH in, check disk, ports and journalctl before touching application code.",
      "Security audit: reviewers check that password auth is disabled and .env files are not world-readable.",
    ],
    resources: [
      docs(
        "Ubuntu Server — Managing users",
        "https://documentation.ubuntu.com/server/how-to/managing-users/",
        "Official Ubuntu guide to creating users, sudo groups and permissions.",
      ),
      docs(
        "systemd.service manual",
        "https://www.freedesktop.org/software/systemd/man/systemd.service.html",
        "Reference for the unit-file directives used in the process-management lesson.",
      ),
      docs(
        "OpenSSH manual",
        "https://www.openssh.com/manual.html",
        "Authoritative reference for ssh, sshd, keys and hardening options.",
      ),
      ytSearch(
        "Linux server basics for developers SSH systemctl",
        "Walkthrough-style videos of logging in, installing packages and managing services.",
        "en",
        "20–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-linux-ssh",
        title: "Harden a fresh VM",
        prompt:
          "Provision any free-tier VM (or a local VM/Vagrant box). Create a deploy user with sudo, install key-based SSH, disable password login, install Nginx, and prove it works: show the output of systemctl is-active nginx and ss -tlnp | grep :80. Write down exactly which commands you would re-run to recreate this server from scratch.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Create the user and install the key before you touch sshd_config",
          "ss -tlnp may need sudo to show process names",
        ],
      },
      {
        id: "ex-p3m6-linux-permissions",
        title: "Lock down a secrets file",
        prompt:
          "Create a file called .env containing DATABASE_URL=postgres://user:pass@localhost:5432/app. Make it readable only by its owner. Then explain why chmod 644 would be dangerous and which user should own the file when your app runs.",
        difficulty: "advanced",
        estimatedMinutes: 10,
        hints: ["Think about who can log in to the machine", "644 = world-readable"],
        solution: `chmod 600 .env
chown deploy:deploy .env
# 600 = only the owner can read/write. Any other account on the box
# (or a compromised low-privilege process) can no longer read the secret.
# The file must be owned by the same user that runs your Node process.`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-analytics-api", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-environment-configuration",
    slug: "environment-configuration-in-production",
    title: "Environment Configuration in Production",
    description:
      "How configuration and secrets differ per environment, how to validate them at boot, and how platforms inject them without ever baking secrets into images.",
    order: 2,
    estimatedMinutes: 18,
    tags: ["configuration", "secrets", "env", "twelve-factor"],
    prerequisites: ["p1m3-environment-variables", "p3m1-config-secrets-management"],
    relatedTopics: ["p3m6-docker", "p3m6-cloud-deployment", "p3m6-deployment-platforms"],
    learningObjectives: [
      "Separate configuration (URLs, feature flags) from secrets (passwords, API keys)",
      "Validate process.env at startup with a schema so misconfiguration fails fast",
      "Inject secrets via the platform or Docker secrets instead of files in the repo",
      "Explain why NODE_ENV=production changes both behavior and expectations",
    ],
    simpleExplanation:
      "Your code should run identically everywhere and get its differences — database URLs, API keys, log levels — from environment variables supplied by whatever machine it runs on. Development, staging and production each have their own values, stored in the platform's dashboard or secret manager, never committed to git. If a required variable is missing, the app should refuse to boot loudly instead of failing mysteriously at 3am.",
    detailedContent: `
The Twelve-Factor App methodology (still the best short distillation of production config practice) says: store config in the environment, keep it strictly separate from code, and don't check secrets into version control.

What belongs in configuration:

- **Connection strings** — database, Redis, queue URLs (each environment has its own).
- **Third-party keys** — payment, email, storage providers.
- **Tunables** — log level, rate limits, worker concurrency, feature flags.
- **Identity** — PORT, HOST, PUBLIC_BASE_URL, NODE_ENV.

How values reach the process:

1. **Platform-injected env vars** — most PaaS dashboards and cloud runtimes set environment variables per service or revision.
2. **.env files loaded at boot** — Node 20.6+ supports \`node --env-file=.env\`; libraries like dotenv load at import time. These files must be git-ignored and excluded from Docker images via \`.dockerignore\`.
3. **Docker/Compose env and secrets** — \`environment:\` for non-sensitive config; Docker secrets or mounted files for sensitive material so they are less visible in \`docker inspect\`.
4. **Cloud secret managers** (AWS Secrets Manager, GCP Secret Manager, Vault) — fetched at boot or injected by the platform; they add rotation and audit trails.

Fail-fast validation is non-negotiable: parse env with a schema (Zod is ideal) and throw a descriptive error before listening on a port. Never log the values of secrets — log which keys were present and whether a value was set.
    `,
    howItWorks: `
At process start, Node gives you a plain object \`process.env\` populated from the OS environment of whatever launched the process (your shell, systemd's \`EnvironmentFile=\`, the orchestrator, or \`docker run -e\`). Your config module reads from it once, validates it, and exports a frozen typed object; the rest of the codebase imports that object instead of touching \`process.env\` directly.

This indirection is what makes the same Docker image deployable to staging and production: nothing environment-specific is inside the image — only code. \`NODE_ENV=production\` additionally flips framework behaviors (Express disables template caching, some libraries enable stronger defaults, and dependency installation should use \`npm ci --omit=dev\`).
    `,
    codeExamples: [
      {
        title: "Validated config module with Zod",
        language: "ts",
        code: `import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug"]).default("info"),
  STRIPE_SECRET_KEY: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // List WHICH variables are wrong — never print their values.
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = Object.freeze(parsed.data);
// Usage elsewhere: import { config } from "./config";`,
        description:
          "A config module that fails boot with a clear message when something is missing — far better than a runtime crash on the first request that needs the value.",
      },
      {
        title: "Keeping secrets out of git and images",
        language: "bash",
        code: `# .gitignore
.env
.env.*
!.env.example

# .dockerignore
.env
.env.*
node_modules
.git

# .env.example is the only env file you commit — placeholders only:
cp .env.example .env   # then fill real values locally`,
        description:
          ".env.example documents every required variable for teammates while the real .env stays local, on the server, or in the platform dashboard.",
      },
    ],
    commonMistakes: [
      "Baking .env into a Docker image — anyone with registry access can extract your database password.",
      "Reading process.env scattered through the codebase, so a typo like process.env.DATABSE_URL silently becomes undefined.",
      "Sharing production secrets in chat or screenshots; rotate immediately if this happens.",
      "Using development defaults in production (chatty log levels, wide-open CORS, schema auto-sync).",
    ],
    bestPractices: [
      "Validate and freeze config once at startup; crash early with a helpful message.",
      "Keep one .env.example with documented placeholders committed to the repo.",
      "Rotate secrets on a schedule and after any staff or contractor change.",
    ],
    realWorldUseCases: [
      "Same Docker image promoted from staging to production with only env vars changed.",
      "A contractor onboarding: they copy .env.example and get a staging database URL, never the production one.",
      "Incident review: config drift (wrong log level, wrong DB URL) identified from the platform's env dashboard.",
    ],
    resources: [
      docs(
        "The Twelve-Factor App — Config",
        OFFICIAL.twelveFactor,
        "The classic essay on storing config in the environment.",
      ),
      docs(
        "Node.js CLI — --env-file",
        "https://nodejs.org/api/cli.html#--env-filepath",
        "Node's built-in way to load .env files without third-party libraries.",
      ),
      docs("Zod documentation", OFFICIAL.zodDocs, "Schema validation used in the example above."),
      docs(
        "Docker Compose — environment variables",
        "https://docs.docker.com/compose/how-tos/environment-variables/",
        "How Compose injects environment variables and links dedicated env files.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-config-schema",
        title: "Fail-fast config",
        prompt:
          "Take one of your existing projects and replace every direct process.env access with a single validated config module. Start the app with a variable removed and capture the error output. Then start it correctly and confirm nothing else changed.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Create the schema before any route or DB connection code runs",
          "process.exit(1) in the failure branch is intentional — the app must not serve traffic half-configured",
        ],
        solution: `// src/config.ts
import { z } from "zod";
const parsed = z.object({ DATABASE_URL: z.string().url(), PORT: z.coerce.number().default(3000) })
  .safeParse(process.env);
if (!parsed.success) { console.error(parsed.error.flatten().fieldErrors); process.exit(1); }
export const config = parsed.data;

// $ DATABASE_URL= node dist/server.js   → exits with a clear field-error map
// $ node dist/server.js                 → boots exactly as before`,
        solutionLanguage: "ts",
      },
    ],
    projectIds: [
      "p3-ecommerce-platform",
      "p3-chat-app",
      "p3-job-processing",
      "p3-booking-platform",
      "p3-analytics-api",
      "p3-capstone",
    ],
  },
  {
    ...shared,
    id: "p3m6-docker",
    slug: "docker-fundamentals",
    title: "Docker Fundamentals",
    description:
      "Images, containers, layers and registries — plus a practical Dockerfile that packages a Node.js API the way production expects.",
    order: 3,
    estimatedMinutes: 22,
    tags: ["docker", "containers", "images", "devops"],
    prerequisites: ["p1m3-environment-variables"],
    relatedTopics: ["p3m6-docker-compose", "p3m6-multi-stage-docker", "p3m6-container-networking"],
    learningObjectives: [
      "Explain the difference between an image, a container and a registry",
      "Write a Dockerfile that installs dependencies reproducibly and runs Node as a non-root user",
      "Use build cache effectively by copying package files before application code",
      "Build, run and tag images and push them to a container registry",
    ],
    simpleExplanation:
      "Docker packages your app together with everything it needs (a specific Node version, native libraries, the OS userland) into a single artifact called an image. Running a container starts an isolated process from that image. Because the image is identical on your laptop, CI and production, 'it works on my machine' stops being a meaningful complaint — the machine is inside the image.",
    detailedContent: `
An **image** is an immutable, layered filesystem snapshot. Each Dockerfile instruction (\`FROM\`, \`RUN\`, \`COPY\`) adds a layer; layers are cached and shared between images. A **container** is a writable instance of an image with a thin layer on top — throw it away and start a fresh one freely. A **registry** (Docker Hub, GitHub Container Registry, cloud registries) stores tagged images that CI pushes and servers pull.

Key commands:

- \`docker build -t myapi:1.0.0 .\` — build from the Dockerfile in the current directory.
- \`docker run -p 3000:3000 -e DATABASE_URL=... myapi:1.0.0\` — run, publishing port 3000.
- \`docker ps\`, \`docker logs -f <id>\`, \`docker exec -it <id> sh\` — inspect and poke running containers.
- \`docker push ghcr.io/org/myapi:1.0.0\` — publish to a registry (requires docker login first).

Dockerfile design for Node.js:

- Pin the base image to a specific version (\`node:22-slim\` at minimum; digest-pinning is stricter). \`-slim\` drops docs and package caches, cutting image size a lot.
- Copy \`package.json\` and the lockfile first, run \`npm ci\`, then copy source. This lets Docker reuse the dependency layer whenever only your code changes.
- Set \`NODE_ENV=production\` and install with \`npm ci --omit=dev\`.
- Create a non-root user and \`USER node\`.
- Prefer \`CMD ["node", "src/server.js"]\` (exec form) over shell form so Node is PID 1 and receives signals directly — critical for graceful shutdown later.
- Use \`.dockerignore\` to exclude \`node_modules\`, \`.git\`, \`.env\` and tests from the build context.
    `,
    howItWorks: `
When you run \`docker build\`, the CLI sends the build context (files not excluded by \`.dockerignore\`) to the Docker daemon. The daemon executes each instruction, snapshots the resulting filesystem as a layer, and caches it keyed on the instruction plus its inputs. When you later change only \`src/server.js\`, every layer before the final \`COPY src\` hits cache, so rebuilds take seconds.

At \`docker run\`, the daemon stacks your image's read-only layers with a writable layer, sets up a private network namespace, mount namespace and cgroup (resource limits), then starts the command as PID 1 inside that namespace. From the host's perspective it's just a process — but it sees its own filesystem, ports and process tree.
    `,
    codeExamples: [
      {
        title: "Production-ready Dockerfile for a Node.js API",
        language: "dockerfile",
        code: `FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Dependencies layer first: cached until package files change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application code last
COPY dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
        description:
          "Minimal, cache-friendly and non-root. Assumes your TypeScript is compiled to dist/ before the image build (the multi-stage lesson does the compile inside Docker).",
      },
      {
        title: "Build, run and publish",
        language: "bash",
        code: `docker build -t ghcr.io/acme/orders-api:1.4.2 .
docker run --rm -p 3000:3000 --env-file .env ghcr.io/acme/orders-api:1.4.2

curl http://localhost:3000/healthz   # smoke test before pushing

docker login ghcr.io
docker push ghcr.io/acme/orders-api:1.4.2
# Tags matter later: :latest is ambiguous; a version tag is a rollback target.`,
        description:
          "The local loop: build, smoke-test the container, then push an immutable version tag to the registry.",
      },
    ],
    commonMistakes: [
      "Copying the whole project before npm ci — every code change reinstalls all dependencies.",
      "Shipping devDependencies to production by forgetting --omit=dev (bigger image, more CVEs).",
      "Running as root inside the container because USER node was omitted.",
      "Using :latest everywhere, which makes rollbacks and 'what is running?' questions unanswerable.",
    ],
    bestPractices: [
      "Pin base image versions and choose slim or alpine variants deliberately.",
      "Tag every production image with the git SHA or semver, never only latest.",
      "Add a .dockerignore before anything else; it prevents the most common cache-busting mistake.",
    ],
    realWorldUseCases: [
      "CI builds the image once per merge and the same artifact is promoted through environments.",
      "A laptop with the wrong Node version still runs the app correctly because Node lives in the image.",
      "Security scanning tools (Trivy, registry scanning) audit every image pushed to the registry.",
    ],
    resources: [
      docs(
        "Dockerfile reference",
        "https://docs.docker.com/reference/dockerfile/",
        "Official Docker documentation: every instruction explained with canonical examples.",
      ),
      docs(
        "Building images — best practices",
        "https://docs.docker.com/build/building/best-practices/",
        "Official guidance on cache, context size and image hygiene.",
      ),
      docs(
        "Node.js Docker image on Docker Hub",
        "https://hub.docker.com/_/node",
        "Available tags including slim, alpine and bookworm variants.",
      ),
      ytSearch(
        "Docker tutorial for Node.js developers build and run",
        "End-to-end video walkthroughs of Dockerfile to build to run for Node apps.",
        "en",
        "15–45 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-docker-build",
        title: "Containerize an existing API",
        prompt:
          "Take any Node/Express project and produce a Dockerfile that builds and runs it on port 3000 with NODE_ENV=production and a non-root user. Prove it: docker run, then curl the health endpoint from the host. Then change one source file and rebuild — measure how fast the build is and confirm the dependency layer was cached (docker build output shows CACHED).",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "COPY package.json and the lockfile before the rest of the code",
          "Use .dockerignore to keep node_modules out of the build context",
        ],
        solution: `# .dockerignore first, then:
docker build -t api:dev .
docker run --rm -p 3000:3000 --env-file .env api:dev &
sleep 3 && curl -fsS http://localhost:3000/healthz
# Rebuild after touching only src/: the npm ci layer prints CACHED`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-chat-app", "p3-job-processing", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-docker-compose",
    slug: "docker-compose",
    title: "Docker Compose",
    description:
      "Declaring multi-container stacks — API, database, Redis — in one YAML file for reproducible local development and single-host demos.",
    order: 4,
    estimatedMinutes: 18,
    tags: ["docker", "compose", "local-development", "yaml"],
    prerequisites: ["p3m6-docker"],
    relatedTopics: ["p3m6-container-networking", "p3m6-multi-stage-docker", "p3m6-production-database-setup"],
    learningObjectives: [
      "Describe services, networks and volumes in a Compose file",
      "Run an API plus its database locally with one command",
      "Use healthchecks and depends_on conditions to control startup order",
      "Keep environment-specific values out of the Compose file itself",
    ],
    simpleExplanation:
      "Docker Compose lets you describe a whole multi-container application in a single YAML file: your API, a Postgres instance, a Redis server. One command (docker compose up) starts all of them on a private network where they can reach each other by service name. The same file works for every developer on the team, replacing the 'install Postgres 14 exactly like this' section of your README.",
    detailedContent: `
A Compose file (usually \`compose.yaml\`) has three top-level sections:

- **services** — each service builds or pulls an image and runs one kind of process. Service names become DNS hostnames on the Compose network: your API connects to the database at \`postgres://db:5432/app\` — the hostname \`db\` is the service name, not something you configure.
- **networks** — Compose creates one default bridge network; services talk over it. Custom networks matter when you want isolation between tiers.
- **volumes** — named volumes persist data (Postgres data files) beyond a container's lifetime so \`docker compose down\` doesn't eat your rows. Bind mounts (\`./src:/app/src\`) are different: they map host directories into the container, ideal for live-reloading dev servers.

Important behaviors:

- \`depends_on\` with \`condition: service_healthy\` waits for the dependency's healthcheck (e.g., Postgres answering \`pg_isready\`) before starting dependents. Plain \`depends_on\` only waits for the container to *start*, which is not the same thing.
- A \`.env\` file next to compose.yaml feeds \`\\\${VAR}\` substitutions inside the YAML.
- \`docker compose up --build\` rebuilds; \`docker compose down -v\` removes containers *and volumes* (destructive — handy for a clean slate, catastrophic for real data).
- Compose is production-adjacent (single host, fine for demos and side projects) but serious multi-host production uses an orchestrator or a platform that does scheduling, autoscaling and rolling updates.
    `,
    howItWorks: `
Each service in the file is just a \`docker run\` with better ergonomics. Compose parses the YAML, pulls or builds images, creates the network and volumes, then starts containers with the right links, env vars and mounts. The embedded DNS server on the Compose network resolves service names to container IPs, so \`db\` points at whichever container is currently running that service.

Healthchecks work by periodically running a command *inside* the container (\`pg_isready -U app\`, \`curl -f http://localhost:3000/healthz\`); the result flips the container's status to healthy, which both humans and \`depends_on\` conditions can key off.
    `,
    codeExamples: [
      {
        title: "API + Postgres + Redis in one file",
        language: "yaml",
        code: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 10

  cache:
    image: redis:7-alpine
    volumes:
      - cache-data:/data

volumes:
  db-data:
  cache-data:`,
        description:
          "A complete local stack. The API reaches the database as host 'db' over the Compose network; data survives restarts via the named db-data volume.",
      },
      {
        title: "Day-to-day commands",
        language: "bash",
        code: `docker compose up -d          # start everything in the background
docker compose logs -f api    # tail API logs
docker compose ps             # status + health of all services
docker compose exec db psql -U app -d app   # open a DB shell
docker compose down           # stop and remove containers/network
docker compose down -v        # also delete volumes — data loss by design`,
        description: "The five commands you will type constantly during local development.",
      },
    ],
    commonMistakes: [
      "Using depends_on without a healthcheck and racing the database: the API boots, Postgres isn't ready, connection refused, crash loop.",
      "Committing real credentials in compose.yaml instead of reading them from a git-ignored .env via interpolation.",
      "Running docker compose down -v against anything with data you care about.",
      "Bind-mounting node_modules from a Mac or Windows host into a Linux container, causing native-module breakage.",
    ],
    bestPractices: [
      "Add a healthcheck to every stateful service; make dependents wait on service_healthy.",
      "Use official image tags pinned to minor versions (postgres:16, redis:7-alpine).",
      "Keep compose.yaml for local/dev; treat production topology as a separate, deliberate decision.",
    ],
    realWorldUseCases: [
      "New engineer clones the repo and has the full stack running in minutes with docker compose up.",
      "Integration tests spin up throwaway Postgres and Redis services per CI run.",
      "A side project or demo deployed to a single VPS with compose, before justifying a bigger platform.",
    ],
    resources: [
      docs(
        "Docker Compose overview",
        "https://docs.docker.com/compose/",
        "What Compose is and how it fits the Docker ecosystem.",
      ),
      docs(
        "Compose file reference",
        "https://docs.docker.com/compose/compose-file/",
        "Full YAML schema for services, networks and volumes, including healthcheck.",
      ),
      docs(
        "PostgreSQL Docker image",
        "https://hub.docker.com/_/postgres",
        "Official image docs: env vars, volumes and data-directory behavior.",
      ),
      ytSearch(
        "Docker Compose full course Node Postgres",
        "Videos building a multi-service Compose stack from scratch.",
        "en",
        "20–60 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-compose-stack",
        title: "Compose-ify your project",
        prompt:
          "Write a compose.yaml for your main project with the API plus its real database. Add a healthcheck to the database and make the API wait for it. Prove the ordering works by starting from empty volumes and watching the API logs come up without connection errors. Also show what happens when you remove the healthcheck — observe the race.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "pg_isready is the standard Postgres healthcheck command",
          "docker compose up --abort-on-container-exit makes failed races easier to see",
        ],
        solution: `docker compose up -d
docker compose ps            # db shows (healthy), api shows Up
docker compose logs api | head
# Without the healthcheck, api logs show ECONNREFUSED before db is ready`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-multi-stage-docker",
    slug: "multi-stage-docker-builds",
    title: "Multi-Stage Docker Builds",
    description:
      "Compiling TypeScript and installing devDependencies in a build stage, then shipping only the runtime — smaller images, fewer CVEs, faster deploys.",
    order: 5,
    estimatedMinutes: 20,
    tags: ["docker", "multi-stage", "typescript", "security"],
    prerequisites: ["p3m6-docker", "p2m7-test-coverage"],
    relatedTopics: ["p3m6-docker-compose", "p3m6-cicd-pipelines", "p3m6-cloud-deployment"],
    learningObjectives: [
      "Structure a Dockerfile with named build and runtime stages",
      "Compile TypeScript and generate ORM clients inside the build stage",
      "Copy only the artifacts the runtime needs into the final image",
      "Explain the security and size benefits of leaving build tooling behind",
    ],
    simpleExplanation:
      "To build a TypeScript app you need compilers, type packages and dev tooling — none of which should run in production. A multi-stage Dockerfile uses one stage as a workshop (install everything, compile, test) and a second stage as a clean room (copy the compiled output plus production dependencies only). The final image never contains the compiler or your source files.",
    detailedContent: `
A multi-stage Dockerfile contains multiple \`FROM\` instructions; each starts a new stage. You build in one stage, then use \`COPY --from=<stage>\` to pull specific artifacts into the next. Only the last stage becomes the tagged image — intermediate layers are discarded from the final artifact but still cached for faster rebuilds.

Why bother:

- **Size.** A full Node + devDependencies + TypeScript image might be 800MB–1.2GB; the runtime-only image is typically 120–200MB with \`node:22-slim\`. Less to push over the network on every deploy.
- **Attack surface.** Fewer packages means fewer known CVEs for scanners to flag. Compilers and test harnesses have no business in a production container.
- **Separation of concerns.** CI can run tests in a stage (or job), and the runtime image is assembled from proven artifacts.

Practical details that trip people up:

- Prisma (and similar ORM generators) needs \`prisma generate\` in the build stage; copy both the generated client inside \`node_modules/.prisma\` and the production \`node_modules\`.
- If the build stage runs as root and the runtime as \`node\`, file ownership can bite — \`chown\` artifacts or generate as the right user.
- BuildKit (default in modern Docker) supports cache mounts: \`RUN --mount=type=cache,target=/root/.npm npm ci\`, which speeds CI rebuilds further.
    `,
    howItWorks: `
Docker executes stages sequentially. Stage \`builder\` starts from the full toolchain image, installs all dependencies, copies source, and runs \`tsc\`. Stage \`runner\` starts fresh from the slim runtime image, copies \`/app/dist\` from the builder, and installs only production dependencies with the same lockfile, so the dependency tree stays identical. Because layers are cached per stage, editing a source file invalidates the compile step but not the dependency-install step above it.

The resulting image contains exactly three kinds of things: the Node runtime, production node_modules and your compiled JavaScript.
    `,
    codeExamples: [
      {
        title: "TypeScript API with a two-stage build",
        language: "dockerfile",
        code: `# ---- build stage ----
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build        # tsc -> /app/dist

# ---- runtime stage ----
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]`,
        description:
          "The builder installs everything and compiles; the runner installs only production deps and copies dist/. The final image has no TypeScript, no tests, no source files.",
      },
      {
        title: "Building only the final stage",
        language: "bash",
        code: `docker build -t orders-api:2.0.0 .
# With multiple stages you can target explicitly:
docker build --target runner -t orders-api:2.0.0 .
docker images orders-api   # compare size against a single-stage build`,
        description:
          "By default Docker builds all stages and tags the last one; --target is useful for debugging an intermediate stage or building a test stage in CI.",
      },
    ],
    commonMistakes: [
      "Forgetting prisma generate in the build stage and getting a runtime error about a missing generated client.",
      "Copying the whole node_modules from builder to runner, dragging devDependencies into production.",
      "Running the final stage as root because USER node was placed before COPY with root-owned files.",
      "Leaving secrets in ARG/ENV of intermediate stages — build args can leak into image metadata; use BuildKit secret mounts instead.",
    ],
    bestPractices: [
      "Name stages (AS builder / AS runner) so --target and COPY --from stay readable.",
      "Compare image sizes before and after: docker images shows the win and motivates keeping the discipline.",
      "Run npm cache clean --force in the final stage to drop the package-manager cache.",
    ],
    realWorldUseCases: [
      "CI builds a 150MB production image while the monorepo's full toolchain stays in CI only.",
      "Security policy: production images must not contain compilers or test frameworks.",
      "Faster autoscaling: smaller images pull in seconds, so new instances become healthy sooner.",
    ],
    resources: [
      docs(
        "Multi-stage builds",
        "https://docs.docker.com/build/building/multi-stage/",
        "Official Docker guide with several Node.js patterns.",
      ),
      docs(
        "Prisma — the Prisma Client overview",
        "https://www.prisma.io/docs/orm/prisma-client/overview",
        "Why prisma generate must run at build time.",
      ),
      docs(
        "Docker build cache",
        "https://docs.docker.com/build/cache/",
        "Layer caching and BuildKit cache mounts for faster npm ci in CI.",
      ),
      ytSearch(
        "multi-stage Dockerfile Node.js TypeScript production",
        "Videos comparing single-stage vs multi-stage image sizes.",
        "en",
        "10–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-multistage",
        title: "Shrink an image",
        prompt:
          "Take your single-stage Dockerfile from the previous lesson and convert it to two stages. Build both versions and compare docker images sizes. List every package category that disappeared from the final image and explain why each one was safe to remove.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "npm run build must happen in the builder stage where devDependencies exist",
          "COPY --from=builder /app/dist ./dist is the only code path into the runner",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-job-processing", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-container-networking",
    slug: "container-networking",
    title: "Container Networking",
    description:
      "Bridge networks, published ports, service-name DNS and the crucial difference between exposing a port inside a network and publishing it to the host.",
    order: 6,
    estimatedMinutes: 17,
    tags: ["docker", "networking", "ports", "dns"],
    prerequisites: ["p3m6-docker", "p3m6-docker-compose"],
    relatedTopics: ["p3m6-reverse-proxies", "p3m6-cloud-deployment", "p3m6-production-database-setup"],
    learningObjectives: [
      "Explain the difference between EXPOSE, -p port publishing and internal-only ports",
      "Reach another container by service name on a shared Docker network",
      "Debug connection refused vs network-unreachable errors inside containers",
      "Decide which services should be publicly reachable and which should not",
    ],
    simpleExplanation:
      "Every Docker container gets its own private network namespace: its own interfaces, its own ports. Containers on the same user-defined network can talk to each other by container or service name, like mini microservices on a private LAN. Publishing a port (-p 3000:3000) punches a hole from the host into that private world — that is the only way outside traffic gets in, and you should do it as rarely as possible.",
    detailedContent: `
Three concepts are constantly confused:

- **EXPOSE** in a Dockerfile is metadata: it documents that the image listens on a port. It publishes nothing.
- **Publishing (-p host:container)** asks the host kernel to forward a host port into the container. \`-p 3000:3000\` maps host 3000 to container 3000. \`-p 127.0.0.1:3000:3000\` binds only to the host's loopback — perfect when Nginx on the same host is the public entry point.
- **Internal service ports** — a database inside a Compose network needs no published port at all; the API reaches it at \`db:5432\`. Publishing 5432 to the host would expose the database to your laptop and, worse, to the Internet if the firewall is open.

Networking details worth knowing:

- User-defined and Compose networks are bridge networks with an embedded DNS server that resolves container names and service names. Standalone containers on the *default* bridge network historically did not get this DNS — another reason to prefer user-defined networks and Compose.
- Containers get IPs from a private range (commonly 172.17.0.0/16); those IPs are not stable across restarts, so never hard-code them — use names.
- Host networking (\`--network host\`) skips isolation entirely and is mostly a Linux-only performance trick; avoid it for ordinary apps.
    `,
    howItWorks: `
When a container joins a bridge network, Docker creates a veth pair (a virtual cable): one end inside the container's namespace, one end attached to a bridge on the host. Outbound traffic is NAT-ed to the host IP. Between containers on the same bridge, traffic is forwarded at layer 2 — fast, no host port involved.

When you use \`-p 8080:3000\`, the Docker daemon programs iptables/nftables rules so packets arriving at host port 8080 are DNAT-ed to the container's IP on port 3000. The application inside binds 0.0.0.0:3000 and is unaware of any of this. Embedded DNS handles name lookups: a query for \`db\` from the api container is answered by Docker's DNS on 127.0.0.11, returning the current IP of the db container.
    `,
    codeExamples: [
      {
        title: "Inspecting and using container networks",
        language: "bash",
        code: `docker network ls
docker network inspect myapp_default   # see containers, IPs, aliases

# Prove inter-container DNS: run a throwaway client on the same network
docker run --rm --network myapp_default curlimages/curl:8 \\
  curl -s http://api:3000/healthz

# Publish only to loopback so only host Nginx can reach the API:
docker run -p 127.0.0.1:3000:3000 ghcr.io/acme/api:1.0.0`,
        description:
          "Network inspection plus the safest way to publish a port when a reverse proxy sits in front.",
      },
    ],
    commonMistakes: [
      "Publishing the database port 'just to test' and leaving it in the production run command.",
      "Hard-coding container IPs instead of service names — they change on every restart.",
      "Using curl http://localhost:3000 from inside the container (that means the container itself) when they meant the host.",
      "Expecting containers on different Compose projects to resolve each other — they sit on different networks unless attached.",
    ],
    bestPractices: [
      "Expose publicly only the reverse proxy; everything else stays on the internal network.",
      "Bind published ports to 127.0.0.1 when a local proxy will forward to them.",
      "Reach dependencies by service name, never by IP.",
    ],
    realWorldUseCases: [
      "Compose stack where only Nginx's ports 80/443 are published; API, Postgres and Redis are unreachable from outside.",
      "Debugging a webhook integration: connection refused vs DNS failure point at completely different layers.",
      "Migrating from one host to another: names survive, IPs never do.",
    ],
    resources: [
      docs(
        "Docker networking overview",
        "https://docs.docker.com/engine/network/",
        "Bridge networks, embedded DNS and port publishing explained by Docker.",
      ),
      docs(
        "Run reference — expose and publish ports",
        "https://docs.docker.com/engine/reference/run/",
        "Exact semantics of EXPOSE vs -p and binding to specific host interfaces.",
      ),
      docs(
        "Compose networking",
        "https://docs.docker.com/compose/networking/",
        "How Compose wires services together by default.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-network-debug",
        title: "Prove DNS and isolation",
        prompt:
          "With your Compose stack running, (1) exec into the API container and resolve the db service name with getent hosts db, (2) from your host, show that db:5432 is NOT reachable while the API port is, (3) run a temporary container attached to the Compose network that successfully connects to the database. Write down which command proves each property.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "getent hosts db runs inside the container and uses the container's resolver",
          "nc -zv localhost 5432 from the host should fail if you did not publish the port",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-analytics-api", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-production-database-setup",
    slug: "production-database-setup",
    title: "Production Database Setup",
    description:
      "Managed versus self-hosted databases, authentication, TLS, connection limits and the operational work people forget until the first outage.",
    order: 7,
    estimatedMinutes: 23,
    tags: ["database", "postgresql", "operations", "security"],
    prerequisites: ["p3m4-connection-pooling", "p2m3-atlas"],
    relatedTopics: ["p3m6-backups-recovery", "p3m6-database-migrations", "p3m6-container-networking"],
    learningObjectives: [
      "Weigh managed database services against self-hosted instances with real trade-offs",
      "Configure users, grants and TLS for a Postgres production instance",
      "Respect connection limits and connect through a pooler",
      "Choose sensible storage, backups and maintenance windows on day one",
    ],
    simpleExplanation:
      "A production database is a long-lived stateful service with its own users, backups, upgrade path and capacity limits. Most teams should buy a managed offering (the provider handles backups, patching, failover) rather than self-host, unless compliance or budget forces otherwise. Either way: no public exposure, strong authentication, TLS on, connection pooling, and backups you have actually restored.",
    detailedContent: `
**Managed vs self-hosted.** Managed services (MongoDB Atlas, Neon, Supabase, RDS, Cloud SQL, Azure Database) cost more per GB but remove the hardest work: backup automation, failover, minor-version upgrades, storage autoscaling. Self-hosting on a VM gives control and flat pricing but assigns you every one of those jobs — often at 3am. Be honest about your team's ops capacity before choosing.

**Security baseline (Postgres-flavoured; ideas transfer):**

- Create a least-privilege role per application (\`CREATE ROLE app LOGIN PASSWORD '...'\` then \`GRANT\` only needed tables/schemas). Never use the superuser in the app.
- Listen only on private interfaces; keep port 5432 closed in the cloud firewall unless a jump host needs it.
- Require TLS (\`ssl = on\`, client \`sslmode=verify-full\`) especially across cloud regions.
- Rotate credentials and store them in your secret manager.

**Connections and capacity.** Postgres spawns a backend per connection; hundreds of app instances each opening 10 connections will exhaust \`max_connections\` (default 100). Put a pooler (PgBouncer or the provider's built-in pooler) in front, and size your app-side pool (e.g., Prisma \`connection_limit\`) to something sane — often 5–20 per instance.

**Day-one operations:** enable automated backups with a retention you can defend, note the maintenance/upgrade window, set monitoring for disk and connections, and document the restore procedure while nothing is broken.
    `,
    howItWorks: `
When your Node process opens a connection, it performs the Postgres wire-protocol handshake: authentication (password, SCRAM or certificate), optional SSL negotiation, then session setup. With a pooler in between, the pooler accepts many client connections but maintains a small set of real server connections, multiplexing them — which is why transaction pooling modes require you to avoid prepared-statement-heavy or session-state features unless configured for them.

Storage grows and autovacuum fights bloat in the background; disks fill from data, WAL/transaction logs and forgotten test tables. Monitoring watches these so the first signal is a graph, not a user error. Failover (managed) promotes a replica and hands you a new endpoint — which is exactly why your app's DATABASE_URL should be a single stable hostname the provider can repoint.
    `,
    codeExamples: [
      {
        title: "Hardening a self-hosted Postgres",
        language: "sql",
        code: `-- Run as the postgres superuser during setup
CREATE ROLE app LOGIN PASSWORD 'strong-password-here';
CREATE DATABASE appdb OWNER app;

\\c appdb
-- Schema-level least privilege (extend per table as needed)
GRANT USAGE ON SCHEMA public TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;

-- postgresql.conf: listen on localhost only; ssl = on. Then reload:
-- SELECT pg_reload_conf();`,
        description:
          "Application role with a password and table-level grants — no superuser in the connection string.",
      },
      {
        title: "Checking connection health from Node",
        language: "js",
        code: `// After connecting with your pool:
const { rows } = await pool.query(
  "SELECT count(*)::int AS n, " +
  "(SELECT setting FROM pg_settings WHERE name = 'max_connections') AS max " +
  "FROM pg_stat_activity WHERE state = 'active'"
);
console.log(rows[0]); // { n: 12, max: "100" } — watch n creep toward max`,
        description:
          "A cheap query to see live activity; alert when active connections consistently exceed ~70% of max_connections.",
      },
    ],
    commonMistakes: [
      "Exposing 5432 to the public Internet with a weak password — scanned and breached within hours.",
      "One connection per incoming HTTP request with no pool, exhausting max_connections during a traffic spike.",
      "Skipping TLS 'because it's the same VPC' — one misrouted service and credentials are plaintext.",
      "No tested restore path: an 'auto-backups' checkbox is not the same as a recovery drill.",
    ],
    bestPractices: [
      "Default to managed unless you have a concrete reason and the ops capacity to self-host.",
      "Use a pooler between horizontally scaled app instances and Postgres.",
      "Grant the application role only the privileges its queries actually need.",
    ],
    realWorldUseCases: [
      "Launch day traffic spike handled because the pooler absorbed connection churn.",
      "A compromised app server leaking DATABASE_URL — TLS, least privilege and network isolation limit the blast radius.",
      "Vendor evaluation: comparing a managed Postgres bill against an ops-engineer salary.",
    ],
    resources: [
      docs(
        "PostgreSQL — client authentication",
        "https://www.postgresql.org/docs/current/client-authentication.html",
        "pg_hba.conf, roles and authentication methods.",
      ),
      docs(
        "MongoDB Atlas — security checklist",
        "https://www.mongodb.com/docs/atlas/security/checklist/",
        "The managed-MongoDB equivalent of the security baseline.",
      ),
      docs(
        "pgbouncer configuration",
        "https://www.pgbouncer.org/config.html",
        "Reference for the most common external Postgres pooler.",
      ),
      ytSearch(
        "PostgreSQL production hardening TLS roles connection pooling",
        "Talks and tutorials on running Postgres beyond the defaults.",
        "en",
        "20–60 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-db-baseline",
        title: "Baseline audit",
        prompt:
          "Against a staging database (managed or self-hosted), answer with evidence: (1) Which user does the app connect as, and is it a superuser? (2) Is TLS required? (3) What is max_connections and how many are in use at peak? (4) When was the last successful backup, and where is it stored? Fix anything alarming.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Postgres: SELECT usesuper FROM pg_user WHERE usename = current_user;",
          "Show that you can find the backup retention setting in your provider's dashboard",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-cicd-pipelines",
    slug: "cicd-pipelines",
    title: "CI/CD Pipelines",
    description:
      "What continuous integration and delivery actually mean, how to stage quality gates, and how deployments should ride the same pipeline as tests.",
    order: 8,
    estimatedMinutes: 18,
    tags: ["ci", "cd", "pipelines", "automation"],
    prerequisites: ["p2m7-ci-fundamentals", "p1m3-git-fundamentals"],
    relatedTopics: ["p3m6-github-actions", "p3m6-rollbacks", "p3m6-database-migrations"],
    learningObjectives: [
      "Define CI, CD and the difference between continuous delivery and continuous deployment",
      "Design a pipeline with fast feedback first and slower checks after",
      "Use caching and artifacts to keep pipelines under a few minutes",
      "Protect production with review gates and environment approvals",
    ],
    simpleExplanation:
      "A CI/CD pipeline is a robot that, every time you push code, checks out the commit, installs dependencies, lints, tests, builds the deployable artifact, and — if you allow it — rolls that artifact out. CI answers 'is this change safe to merge?'; CD answers 'can this change reach users without a human hand-copying files?'. The pipeline is the institutional memory of how to ship your app correctly.",
    detailedContent: `
**Pipeline stages, fastest first:**

1. **Install** — clean dependency install from the lockfile (\`npm ci\`). Cache the package-manager store so this is seconds, not minutes.
2. **Lint/typecheck** — catches whole classes of mistakes before tests run.
3. **Unit tests** — fast, isolated, run in parallel.
4. **Integration tests** — spin real dependencies (Postgres via service containers) and run slower suites.
5. **Build artifact** — compile TypeScript; build the Docker image.
6. **Publish** — push the image with an immutable tag (git SHA or semver).
7. **Deploy** — to staging automatically; to production on approval or on merge to main (continuous deployment).

Design principles:

- **Fail fast.** Put the cheapest, highest-signal checks first so developers get feedback in 1–2 minutes.
- **Same artifact everywhere.** Build the image once; promote it. Rebuilding per environment invites 'works in staging' divergence.
- **Pipelines as code.** Workflow files live in the repo, reviewed like code.
- **Secrets only in CI.** Inject via the platform's secret store; never echo them; never print them in logs.
- **Every deploy is a commit.** The pipeline records which SHA is live, which makes rollback mechanical.

CI is not a substitute for good tests — it multiplies their value by running them on every change.
    `,
    howItWorks: `
When you push, the CI provider (GitHub Actions, GitLab CI and others) queues a job on a fresh ephemeral runner: a clean VM or container with your repo checked out at that commit. Steps run sequentially inside a job; jobs run in parallel where possible. Caches (dependency downloads) and artifacts (build outputs) are content-addressed stores the provider maintains between runs; a cache key based on the lockfile hash means the cache is reused exactly when dependencies are unchanged.

Environments add another layer: a deployment job targets 'staging' or 'production', each with its own secrets and optional required reviewers. That is how 'merge to main' becomes 'production deploy' with a human checkpoint when the business requires one.
    `,
    codeExamples: [
      {
        title: "Conceptual pipeline with quality gates",
        language: "yaml",
        code: `# Conceptual stages — GitHub Actions syntax comes in the next lesson
stages:
  - verify:      # lint, typecheck, unit tests (parallel jobs)
  - integration: # tests against a real Postgres service
  - build:       # docker build, tag with git SHA
  - publish:     # push image to registry (main branch only)
  - deploy-staging:
  - deploy-production:   # requires manual approval`,
        description:
          "Ordering is the lesson: verification always precedes artifact publication, which always precedes deployment.",
      },
    ],
    commonMistakes: [
      "Running everything sequentially in one giant job, so a failing lint takes 10 minutes to surface.",
      "Rebuilding the image for production instead of promoting the exact artifact tested in staging.",
      "Storing production credentials as plain repo secrets available to pull_request workflows from forks.",
      "No pipeline for database migrations, so deploys and schema changes drift apart.",
    ],
    bestPractices: [
      "Keep the main verification loop under ~5 minutes; move slow suites to a nightly job if needed.",
      "Tag artifacts with the commit SHA; store the SHA as the source of truth for what is deployed.",
      "Require passing CI and review for merges; require environment approval for production.",
    ],
    realWorldUseCases: [
      "A team replaces manual FTP-style deploys with a pipeline and cuts release friction from hours to minutes.",
      "Contractor contributions: fork PRs run tests without access to production secrets.",
      "Audit trail: which commit is live in production right now is answerable from the deploy history.",
    ],
    resources: [
      docs(
        "GitHub Actions documentation",
        OFFICIAL.githubActionsDocs,
        "The CI system used in this curriculum's practical examples.",
      ),
      docs(
        "DORA — the four keys",
        "https://dora.dev/guides/dora-metrics-four-keys/",
        "Research-backed framing of deployment frequency, lead time, change fail rate and recovery.",
      ),
      docs(
        "npm — scripts and continuous integration",
        "https://docs.npmjs.com/cli/using-npm/scripts",
        OFFICIAL.npmDocs + " — how npm scripts map to pipeline steps.",
      ),
      ytSearch(
        "CI CD pipeline explained for Node.js projects",
        "Beginner-friendly pipeline walkthroughs with real tool output.",
        "en",
        "15–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-pipeline-design",
        title: "Design before you automate",
        prompt:
          "For your capstone project, write out the pipeline stages you would implement, the command that runs in each, an estimate of its duration, and which failures should block merge vs block deploy. Identify where secrets are needed and which steps are safe for fork PRs.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Anything that needs production secrets should never run on pull_request from a fork",
          "Distinguish blocking merge (lint, unit tests) from blocking deploy (integration tests, approval)",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-capstone", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-github-actions",
    slug: "github-actions-in-practice",
    title: "GitHub Actions in Practice",
    description:
      "Workflow YAML anatomy, runners, caching, artifacts, secrets, environments and a real pipeline that tests, builds a Docker image and deploys over SSH.",
    order: 9,
    estimatedMinutes: 25,
    tags: ["github-actions", "ci", "yaml", "automation"],
    prerequisites: ["p3m6-cicd-pipelines", "p3m6-docker"],
    relatedTopics: ["p3m6-deployment-platforms", "p3m6-rollbacks", "p2m7-eslint-prettier"],
    learningObjectives: [
      "Read and write a workflow: triggers, jobs, steps and runners",
      "Cache npm dependencies and upload test artifacts",
      "Use repository secrets and deployment environments safely",
      "Build and push a Docker image to GHCR from a workflow",
    ],
    simpleExplanation:
      "GitHub Actions runs your pipeline inside GitHub: you commit a YAML file describing when it runs (every push, every PR, on a schedule) and what to do (checkout code, install, test, build, deploy). Jobs run on GitHub-hosted virtual machines or your own runners, and everything — secrets, approvals, logs — is managed next to your code.",
    detailedContent: `
Anatomy of a workflow file under \`.github/workflows/\`:

- **name** — shown in the Actions tab.
- **on** — triggers: \`push\` (optionally filtered by branches), \`pull_request\`, \`workflow_dispatch\` (manual button), \`schedule\` (cron).
- **jobs** — units that run on a runner in parallel by default; \`needs:\` creates dependencies. Each job gets a fresh VM.
- **steps** — a job is a list of steps: \`uses:\` runs an action (like \`actions/checkout\`), \`run:\` executes shell commands.
- **env and secrets** — \`\${{ secrets.NAME }}\` injects repository or environment secrets. GitHub masks secret values in logs automatically when they are registered as secrets.
- **matrix** — run the same job across Node versions or operating systems.
- **artifacts** — upload files (with \`actions/upload-artifact\`) for humans to download or for later jobs to consume.
- **caching** — \`actions/setup-node\` has built-in npm caching keyed on the lockfile; wrong keys are the number-one cause of 'why is my cache never hit?'.
- **environments** — \`environment: production\` scopes secrets to deploy jobs and can require reviewers (manual approval gates).

Security notes: pull_request workflows from forks do not receive your secrets — design around that. Pin third-party actions to full commit SHAs if your threat model requires it. Never \`echo\` a secret.
    `,
    howItWorks: `
When the trigger fires, GitHub queues the workflow run and assigns each job to a runner — an ephemeral hosted VM (clean every run) or a self-hosted machine you register. The runner checks out your repo at the triggering SHA, then executes steps in order within a shell. If a step exits non-zero, the job fails, dependent jobs are skipped, and the run is marked red (which can block merges via branch protection).

For Docker deploys, the common pattern is: build the image in CI with the SHA as tag, push to GitHub Container Registry using the built-in \`GITHUB_TOKEN\` (no long-lived password needed), then a deploy job SSHes to your server and runs \`docker pull\` and \`docker compose up -d\` with the new tag — or calls your platform's API to redeploy.
    `,
    codeExamples: [
      {
        title: "Test, build and push — a realistic workflow",
        language: "yaml",
        code: `name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test

  docker:
    needs: verify
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: |
            ghcr.io/\${{ github.repository }}:\${{ github.sha }}
            ghcr.io/\${{ github.repository }}:latest`,
        description:
          "PRs run verify only. Pushes to main additionally build and push the image tagged with the commit SHA — that SHA is your rollback target.",
      },
      {
        title: "Deploy over SSH after approval",
        language: "yaml",
        code: `  deploy:
    needs: docker
    runs-on: ubuntu-latest
    environment: production    # reviewers can be required here
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: \${{ secrets.DEPLOY_HOST }}
          username: deploy
          key: \${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            docker pull ghcr.io/acme/api:\${{ github.sha }}
            docker compose up -d`,
        description:
          "Environment-protected deploy: a reviewer clicks approve, then the server pulls the exact SHA that passed CI.",
      },
    ],
    commonMistakes: [
      "Cache never hits because the key includes github.sha instead of hashing package-lock.json.",
      "Forgetting packages: write permission, so the push to GHCR fails with a 403.",
      "Using pull_request_target with untrusted checkout code — a known way to leak secrets.",
      "Echoing docker login output; register secrets properly and avoid printing anything sensitive at all.",
    ],
    bestPractices: [
      "Split jobs (verify / build / deploy) for parallelism and clear failure attribution.",
      "Deploy via environment: production with required reviewers when the stakes are real.",
      "Tag images with github.sha and keep the tag list as your deploy history.",
    ],
    realWorldUseCases: [
      "Every merge to main automatically ships a new container to a single-VPS production host.",
      "A nightly scheduled workflow runs the full test suite and a security scan.",
      "workflow_dispatch lets an operator deploy any historical SHA on demand.",
    ],
    resources: [
      docs(
        "GitHub Actions quickstart",
        "https://docs.github.com/en/actions/quickstart",
        "First workflow in minutes, straight from GitHub.",
      ),
      docs(
        "Workflow syntax reference",
        "https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions",
        "Triggers, jobs, expressions and conditionals — the full grammar.",
      ),
      docs(
        "Caching dependencies",
        "https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows",
        "How cache keys and restore-keys work.",
      ),
      docs(
        "GitHub Container Registry",
        "https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry",
        "Pushing and pulling images with GITHUB_TOKEN.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-actions-pipeline",
        title: "Ship a real workflow",
        prompt:
          "Add a workflow to your project that runs lint, build and tests on PRs, and on push to main additionally builds a Docker image tagged with the SHA and pushes it to GHCR. Verify: open a PR and confirm verify runs; merge and confirm the image appears in the packages tab. Then make one dependency change and confirm npm caching reduced install time by comparing run logs.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "packages: write is required on the build job for GHCR",
          "actions/setup-node cache: npm uses the lockfile automatically",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform", "p3-chat-app"],
  },
  {
    ...shared,
    id: "p3m6-reverse-proxies",
    slug: "reverse-proxies-with-nginx",
    title: "Reverse Proxies",
    description:
      "Why Nginx sits in front of Node, how proxy_pass works, and the headers, timeouts and WebSocket details that make proxies invisible to clients.",
    order: 10,
    estimatedMinutes: 20,
    tags: ["nginx", "proxy", "linux", "http"],
    prerequisites: ["p3m6-linux-fundamentals"],
    relatedTopics: ["p3m6-https-tls-production", "p3m6-container-networking", "p3m6-health-checks"],
    learningObjectives: [
      "Explain why a reverse proxy is placed in front of a Node.js API",
      "Configure Nginx to forward requests to a local Node process",
      "Set X-Forwarded-* headers so Express sees the real client and protocol",
      "Proxy WebSocket connections with the correct Upgrade headers",
    ],
    simpleExplanation:
      "A reverse proxy is a middleman: the public talks to it, it talks to your Node app on the private side. You gain one public port for many services, TLS termination (next lesson), gzip, static-file performance, rate limiting and the ability to swap the backend without changing URLs. Nginx is the classic choice; Caddy and cloud load balancers play the same role.",
    detailedContent: `
Node can absolutely serve HTTPS itself — but production setups almost always put Nginx (or a load balancer) in front because:

- **One public face.** Nginx owns ports 80/443; your app listens on 127.0.0.1:3000, unreachable from the Internet.
- **TLS termination.** Certificate handling lives in one place (covered next lesson).
- **Static assets.** Nginx serves files far more efficiently than Node, freeing the event loop.
- **Operational levers.** Rate limits, request-size caps, timeouts, graceful reloads (Nginx reloads without dropping connections; restarting Node does not).

Core directives:

- \`location / { proxy_pass http://127.0.0.1:3000; }\` — forward everything.
- Forwarded headers: \`proxy_set_header Host\`, \`X-Forwarded-For\` (client IP chain), \`X-Forwarded-Proto\` (original scheme). Without these your app thinks every request is plain HTTP from localhost, which breaks secure cookies, redirects and rate limiting by IP.
- Timeouts: \`proxy_read_timeout\` defaults to 60s — long-running endpoints need it raised deliberately.
- WebSockets: forward \`Upgrade\` and \`Connection\` headers, otherwise the handshake fails and your chat app mysteriously disconnects.

Nginx is itself a process managed by systemd; \`nginx -t\` validates config before \`systemctl reload nginx\` applies it with zero dropped connections.
    `,
    howItWorks: `
On each request, Nginx's worker processes accept the connection, match a \`server\` block by Host header (and SNI for TLS) and a \`location\` block by path, then open (or reuse from \`proxy_http_version 1.1\` keepalive upstreams) a connection to the upstream — your Node app — and stream bytes both ways while injecting the headers you configured.

Because Nginx and Node are separate processes, 'reload' semantics differ: \`nginx -t && systemctl reload nginx\` starts new workers with the new config and drains old ones gracefully. Your Node app needs its own restart story — which is exactly what the graceful-shutdown lesson handles.
    `,
    codeExamples: [
      {
        title: "Minimal reverse-proxy config",
        language: "nginx",
        code: `# /etc/nginx/sites-available/api
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`,
        description:
          "Enable with ln -s sites-available/api sites-enabled/api, validate with nginx -t, apply with systemctl reload nginx.",
      },
      {
        title: "WebSocket upgrade for a chat app",
        language: "nginx",
        code: `location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;   # keep long-lived sockets open
}`,
        description:
          "The Upgrade/Connection pair completes the WebSocket handshake; the raised read timeout prevents idle sockets from being cut.",
      },
    ],
    commonMistakes: [
      "Omitting X-Forwarded-Proto, so Express generates http:// links and 'secure' cookies are rejected.",
      "Not knowing that proxy_pass with a trailing path segment rewrites the request path differently than without — read the nginx docs rule once and remember it.",
      "Forgetting the WebSocket Upgrade headers and debugging 'my socket works with curl but not the browser'.",
      "Applying config without nginx -t and bricking Nginx at the worst moment.",
    ],
    bestPractices: [
      "Bind the app to 127.0.0.1 only; publish nothing else through the host firewall.",
      "Run nginx -t before every reload; keep a working config backup.",
      "Trust proxy headers only from your proxy: use Express's trust proxy setting deliberately.",
    ],
    realWorldUseCases: [
      "Single VPS serving an API, an admin SPA and a status page through one Nginx with three server/location blocks.",
      "Weighted routing between two local app ports during a blue-green style deploy.",
      "Chat applications proxied without breaking WebSockets.",
    ],
    resources: [
      docs(
        "nginx reverse proxy guide",
        "https://nginx.org/en/docs/http/ngx_http_revproxy.html",
        "Official conceptual guide to reverse proxying.",
      ),
      docs(
        "ngx_http_proxy_module reference",
        "https://nginx.org/en/docs/http/ngx_http_proxy_module.html",
        "proxy_pass, headers and timeouts in full.",
      ),
      docs(
        "Express API — trust proxy",
        OFFICIAL.expressApi,
        "How Express consumes X-Forwarded-* headers safely.",
      ),
      ytSearch(
        "Nginx reverse proxy Node.js tutorial",
        "Video setup walkthroughs from apt install to first proxied request.",
        "en",
        "15–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-nginx-proxy",
        title: "Put Nginx in front",
        prompt:
          "Install Nginx on your server (or a VM), write a server block proxying to a local Node app on 127.0.0.1:3000, and verify with curl -I that responses arrive. Then log the client IP in Express (req.ip) before and after adding X-Forwarded-For plus app.set('trust proxy', 1), and explain the difference.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "ln -s into sites-enabled, then nginx -t && systemctl reload nginx",
          "Without trust proxy, Express ignores X-Forwarded-For by design",
        ],
        solution: `# sites-available/api → proxy_pass http://127.0.0.1:3000 with X-Forwarded-* headers
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -I http://localhost/
# app: app.set("trust proxy", 1);  then req.ip shows the real client, not 127.0.0.1`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-chat-app", "p3-ecommerce-platform", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-https-tls-production",
    slug: "https-and-tls-in-production",
    title: "HTTPS & TLS in Production",
    description:
      "Certificates, Let's Encrypt, certbot with Nginx, automatic renewal, HSTS and the browser warnings users see when TLS is misconfigured.",
    order: 12,
    estimatedMinutes: 20,
    tags: ["tls", "https", "security", "nginx"],
    prerequisites: ["p3m6-reverse-proxies", "p3m6-domain-configuration"],
    relatedTopics: ["p3m6-domain-configuration", "p3m6-cloud-deployment", "p3m6-production-database-setup"],
    learningObjectives: [
      "Describe the TLS handshake and what a certificate proves",
      "Obtain and install a Let's Encrypt certificate with certbot",
      "Set up automatic renewal and verify it actually works",
      "Enable HSTS and redirect HTTP to HTTPS correctly",
    ],
    simpleExplanation:
      "HTTPS is HTTP inside an encrypted tunnel. A certificate is a site's ID card, signed by a Certificate Authority that browsers already trust — it proves you are really talking to api.example.com and encrypts everything so eavesdroppers see gibberish. Let's Encrypt issues these certificates free and automates renewal, which is why there is almost no excuse left for serving plain HTTP.",
    detailedContent: `
**What TLS gives you:** confidentiality (encryption), integrity (tampering detection) and authentication (the certificate binds a name to a public key). The handshake happens before any HTTP bytes: client hello, server certificate chain, key agreement, then symmetric encryption for the session.

**Getting certificates.** The ACME protocol automates issuance. Certbot is the reference client:

- The *HTTP-01* challenge: Let's Encrypt asks for a token at \`http://yourdomain/.well-known/acme-challenge/<token>\`; certbot temporarily serves it via Nginx. Requires port 80 reachable from the Internet.
- The *DNS-01* challenge: you prove domain control via a DNS TXT record — works for wildcard certs and for hosts without public HTTP.

**Renewal.** Let's Encrypt certificates last ~90 days. Certbot installs a systemd timer (or cron job) that renews daily and reloads Nginx on success. Verify with \`certbot renew --dry-run\` — never assume the timer works.

**Configuring Nginx:** after \`certbot --nginx\`, your server block gains \`listen 443 ssl\` and \`ssl_certificate\` paths. Add an HTTP-to-HTTPS redirect server block, then HSTS (\`Strict-Transport-Security\`) only once HTTPS is reliably working — HSTS makes browsers *refuse* plain HTTP for the max-age period, and a mistake here can lock users out of your domain.

**Platform note:** many PaaS offerings terminate TLS for you with auto-renewed certs. On those platforms you skip certbot entirely; on VMs you own the whole chain.
    `,
    howItWorks: `
During the handshake the server presents its certificate: a signed statement of the form 'this public key belongs to api.example.com', signed by an intermediate CA whose root is in the client's trust store. The client verifies signatures up the chain, checks the hostname and expiry, then both sides derive shared session keys (via ECDHE in modern configs) so traffic is encrypted with symmetric ciphers.

For ACME HTTP-01, the CA's validators hit your server from multiple locations over port 80; once they retrieve the token file that only you could place, they sign the certificate. Certbot writes key and cert to /etc/letsencrypt, the Nginx config references them, and renewal repeats the challenge at 2am via the timer.
    `,
    codeExamples: [
      {
        title: "Certbot in front of Nginx",
        language: "bash",
        code: `sudo apt install -y certbot python3-certbot-nginx
# Nginx server block for port 80 must already point at your domain
sudo certbot --nginx -d api.example.com
# Follow prompts: choose the HTTP-to-HTTPS redirect option

# Prove renewal automation before trusting it:
sudo certbot renew --dry-run

# Inspect the installed timer:
systemctl list-timers | grep certbot`,
        description:
          "One command obtains the certificate, edits Nginx and enables redirects; the dry-run proves the renewal path end-to-end.",
      },
      {
        title: "Manual TLS snippet you may need to add",
        language: "nginx",
        code: `server {
    listen 443 ssl;
    http2 on;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;

    location / { proxy_pass http://127.0.0.1:3000; }
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$host$request_uri;
}`,
        description:
          "Modern protocol floor (TLS 1.2+), HSTS, and a permanent redirect from HTTP. Certbot generates most of this; knowing how to read it matters.",
      },
    ],
    commonMistakes: [
      "Enabling HSTS with a huge max-age before HTTPS is fully stable — users cannot override the redirect.",
      "Certificate expires because the renewal timer was disabled or the HTTP-01 challenge broke when Nginx config changed.",
      "Mixed content: the page is HTTPS but the API URL in the frontend still says http://, and browsers block it.",
      "Copying an old SSL config full of deprecated ciphers instead of using current defaults.",
    ],
    bestPractices: [
      "Automate renewal and add a monitoring check on certificate expiry (check the TLS cert, not your memory).",
      "Start with redirect plus TLS 1.2/1.3 defaults; only add custom hardening when you can test it.",
      "Prefer platform-managed TLS when your host offers it — fewer moving parts.",
    ],
    realWorldUseCases: [
      "A domain that silently expired its cert over a weekend, found only because uptime monitoring alerted.",
      "E-commerce checkout: browsers mark non-HTTPS payment pages as 'Not secure' and users bounce.",
      "API partners requiring TLS 1.2+ in their integration checklist.",
    ],
    resources: [
      docs(
        "Let's Encrypt documentation",
        "https://letsencrypt.org/docs/",
        "How ACME issuance and the challenge types work.",
      ),
      docs(
        "Certbot documentation",
        "https://certbot.eff.org/docs/",
        "Official client docs; certbot.eff.org also generates OS-specific commands.",
      ),
      docs(
        "nginx SSL module reference",
        "https://nginx.org/en/docs/http/ngx_http_ssl_module.html",
        "Every ssl_* directive used in production Nginx configs.",
      ),
      ytSearch(
        "certbot Let's Encrypt Nginx full tutorial automatic renewal",
        "Guided certificate setup videos including the dry-run check.",
        "en",
        "15–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-tls",
        title: "Go green in the browser",
        prompt:
          "Using a real domain pointed at your server, obtain a Let's Encrypt certificate with certbot --nginx, enable the HTTP-to-HTTPS redirect, and confirm: (1) https://your-domain returns your API's health endpoint, (2) http:// redirects to https, (3) certbot renew --dry-run succeeds. Document the exact commands so you can repeat them on a new server.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Port 80 must be reachable from the Internet for the HTTP-01 challenge",
          "openssl s_client -connect your-domain:443 -servername your-domain shows the chain",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-domain-configuration",
    slug: "domain-and-dns-configuration",
    title: "Domain & DNS Configuration",
    description:
      "A, AAAA, CNAME and TXT records, TTLs, apex vs subdomains and how a name becomes your server's IP address.",
    order: 11,
    estimatedMinutes: 16,
    tags: ["dns", "domains", "networking"],
    prerequisites: ["p3m6-linux-fundamentals"],
    relatedTopics: ["p3m6-https-tls-production", "p3m6-cloud-deployment", "p3m6-reverse-proxies"],
    learningObjectives: [
      "Explain how DNS resolution turns a hostname into an IP address",
      "Create and reason about A, AAAA, CNAME and TXT records",
      "Choose sensible TTLs before and during migrations",
      "Point apex and subdomains at a server or platform correctly",
    ],
    simpleExplanation:
      "DNS is the Internet's phonebook. When someone visits api.example.com, a resolver asks your domain's nameservers 'where is this?' and gets back an IP address. You control those answers in your DNS provider's dashboard: an A record points a name at an IPv4 address, CNAME aliases one name to another, and TTL says how long resolvers may cache the answer before asking again.",
    detailedContent: `
The records you will actually use:

- **A** — hostname to IPv4 address (e.g., \`api → 203.0.113.10\`).
- **AAAA** — hostname to IPv6 address.
- **CNAME** — hostname to another hostname (\`www → example.com\`). Cannot coexist with other data on the same name — which is why apex records usually can't be CNAMEs at many providers (apex ALIAS/ANAME records are a provider-specific workaround that flattens the answer).
- **TXT** — arbitrary text, used for domain verification and email policies (SPF/DKIM). Also how DNS-01 ACME challenges prove ownership.

Operational realities:

- **TTL (time to live).** Lower it (e.g., 60s) *before* an IP migration so changes propagate fast; raise it back (3600s+) after for efficiency. Changing TTL does not retroactively shorten caches already storing the old value.
- **Propagation is not magic** — it's caching at recursive resolvers worldwide plus your registrar's nameserver delegation. \`dig\` shows the truth: \`dig +short api.example.com\`, \`dig api.example.com\` for the full record, \`dig NS example.com\` to see authoritative nameservers.
- **Registrar vs DNS host.** Your registrar sells the domain; DNS may live at the registrar, at a dedicated DNS host, or at your platform. The NS records decide who answers.
- **Mail and verification.** If you later add transactional email, SPF/DKIM/DMARC TXT records decide whether Gmail trusts your mail. Platform domain-verification challenges are also TXT or CNAME records.
    `,
    howItWorks: `
When a browser wants \`api.example.com\`, the stub resolver asks a recursive resolver (often your ISP's or 1.1.1.1/8.8.8.8). That resolver walks the hierarchy: root servers point to the .com TLD servers, which point to your authoritative nameservers (the NS records), which return the final A record with its TTL. The recursive resolver caches each answer per TTL, so subsequent lookups are instant until expiry.

CNAMEs introduce a second lookup: the resolver sees 'this is really \`lb.provider.net\`' and resolves that name — which is how platforms re-point thousands of customers' domains by changing one upstream record.
    `,
    codeExamples: [
      {
        title: "Inspecting DNS from any terminal",
        language: "bash",
        code: `dig +short api.example.com A        # just the IPv4 answer
dig api.example.com                 # full record, TTL, authority section
dig NS example.com                  # which nameservers are authoritative
dig TXT _acme-challenge.api.example.com   # certbot DNS-01 proof record
dig @1.1.1.1 api.example.com        # ask a specific public resolver`,
        description:
          "dig is the debugging microscope for DNS; comparing answers from your resolver vs a public one localizes problems.",
      },
      {
        title: "Typical records for a Node API",
        language: "text",
        code: `Type   Name    Value                 TTL
A      api     203.0.113.10          300
CNAME  www     example.com           3600
A      @       203.0.113.10          300        # apex — CNAME often not allowed
TXT    @       "verification-token"  3600      # platform domain ownership proof`,
        description:
          "Apex and subdomain pointing at the same server; the TXT record shows the usual domain-verification pattern.",
      },
    ],
    commonMistakes: [
      "Forgetting to lower TTLs before a migration, then waiting days for caches to expire.",
      "Creating a CNAME on the apex and getting rejected (or breaking the zone at strict providers).",
      "Editing records at the registrar while NS records point elsewhere — the change silently does nothing.",
      "Testing DNS with a browser that has its own cache or DNS-over-HTTPS enabled; dig from the terminal instead.",
    ],
    bestPractices: [
      "Keep a written inventory of every record and why it exists.",
      "Use short TTLs during planned IP changes, longer TTLs at rest.",
      "Point platforms at a CNAME on a subdomain rather than the apex when the platform supports it.",
    ],
    realWorldUseCases: [
      "Migrating a side project from a VPS to a platform: lower TTL, change record, raise TTL after verifying.",
      "Wildcard subdomains (`*.app.example.com`) for customer workspaces resolved by a single A/AAAA or CNAME.",
      "Debugging 'our domain doesn't resolve in one country' with dig from multiple resolvers.",
    ],
    resources: [
      docs(
        "Cloudflare Learning — What is DNS?",
        "https://www.cloudflare.com/learning/dns/what-is-dns/",
        "Illustrated introduction to resolvers, nameservers and records.",
      ),
      docs(
        "Cloudflare Learning — DNS record types",
        "https://www.cloudflare.com/learning/dns/dns-records/",
        "A, AAAA, CNAME and TXT explained with examples.",
      ),
      docs(
        "Let's Encrypt — DNS-01 challenge",
        "https://letsencrypt.org/docs/challenge-types/#dns-01-challenge",
        "How TXT records prove domain control for wildcard certificates.",
      ),
      ytSearch(
        "DNS records explained A CNAME TTL for beginners",
        "Short visual explanations of resolution and record types.",
        "en",
        "8–20 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-dns",
        title: "Own a subdomain",
        prompt:
          "If you control a domain, create api.<your-domain> pointing at your server. Prove resolution with dig +short from two different networks (your machine and something like a cloud shell). Then lower the TTL, change the IP to a dummy address, and observe how quickly the change appears via dig. Restore the correct IP afterwards.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "dig @1.1.1.1 api.example.com queries a specific resolver, bypassing your ISP's cache",
          "Some registrars take minutes to publish NS-recorded changes — be patient between edits",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-capstone", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m6-cloud-deployment",
    slug: "deploying-to-a-cloud-vm",
    title: "Deploying to a Cloud VM",
    description:
      "The full IaaS path: provision a server, configure the firewall, deploy code with rsync or Docker pulls, run migrations, and keep releases repeatable with scripts.",
    order: 13,
    estimatedMinutes: 23,
    tags: ["cloud", "deployment", "ssh", "vm"],
    prerequisites: ["p3m6-linux-fundamentals", "p3m6-docker", "p3m6-reverse-proxies"],
    relatedTopics: ["p3m6-deployment-platforms", "p3m6-process-management", "p3m6-rollbacks"],
    learningObjectives: [
      "Provision a VM and lock down its firewall",
      "Deploy application code with rsync, git or Docker image pulls",
      "Wire a deploy script that builds, migrates, restarts and health-checks safely",
      "Recognize when a VM is the right choice versus a platform",
    ],
    simpleExplanation:
      "The classic path: rent a virtual machine from a cloud provider, install Nginx and Docker, and put your app on it. You control everything, costs are predictable, and the skills transfer everywhere — but you also own backups, updates and scaling. A good deploy turns this from hand-work into a one-command ritual.",
    detailedContent: `
**Provisioning.** Choose a region near your users, the smallest instance that fits (a 1–2 vCPU / 1–2 GB box carries a surprising amount of Node traffic), add SSH keys, and enable the provider firewall: allow only SSH (ideally restricted), HTTP and HTTPS. Enable swap or a memory-optimized size if you run Postgres on the same box — but separate compute from database as soon as you can afford it.

**Getting code onto the server.**

- **Docker pull** — CI pushes an image; server runs \`docker compose pull && docker compose up -d\`. Currently the most boring and reliable default.
- **rsync push** — \`rsync -az --delete dist/ deploy@host:/var/www/api/\` from CI after build. Fast, explicit, no git needed on the server.
- **git pull** — server clones the repo; deploy script does \`git fetch && git reset --hard origin/main\`. Simple; requires git credentials on the box and care that untracked junk doesn't linger.

**Deploy script shape.** Every deploy: fetch artifact, stop accepting new work gracefully, run migrations, start new code, health-check, roll back on failure. Even a 20-line bash script encoding this sequence beats clicking around.

**Honest trade-offs.** A VM costs a few dollars a month and gives root; a comparable PaaS tier may cost more but deletes your ops to-do list (TLS, backups, scaling, OS patching). Small teams with one product often start on a platform and move to VMs (or managed containers) when cost or control demands it.
    `,
    howItWorks: `
Under the hood a cloud VM is a hypervisor-isolated guest with virtual NIC/disk. Your SSH session is a normal SSH connection to the guest's sshd. When CI deploys over SSH, it runs the same commands you would: pull the artifact, signal the process manager (systemd or pm2) to restart, watch health until ready.

The health-check-and-rollback loop matters most: a restart that comes up crashing should fail the deploy within a defined timeout, while the previous container stays in place under Docker's restart policy. That loop is what separates a script from a deployment system.
    `,
    codeExamples: [
      {
        title: "A small but serious deploy script",
        language: "bash",
        code: `#!/usr/bin/env bash
set -euo pipefail
TAG="\${1:?usage: deploy.sh <image-tag>}"

docker login ghcr.io -u "$GHCR_USER" -p "$GHCR_TOKEN"
docker pull "ghcr.io/acme/api:\${TAG}"

docker compose run --rm api npm run migrate:deploy
docker compose up -d api

# Wait for health before declaring success
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/healthz >/dev/null; then
    echo "deploy ok: \${TAG}"; exit 0
  fi
  sleep 2
done

echo "health check failed — fix forward, previous logic still diagnosable" >&2
exit 1`,
        description:
          "Immutable tag in, migration, restart, health gate. Failure exits non-zero so CI/CD surfaces a red deploy instead of a silent outage.",
      },
      {
        title: "Quick rsync release (no Docker)",
        language: "bash",
        code: `# From CI or your laptop, after npm ci && npm run build:
rsync -az --delete \\
  --exclude node_modules --exclude .env --exclude .git \\
  dist/ package.json package-lock.json deploy@203.0.113.10:/var/www/api/

ssh deploy@203.0.113.10 'cd /var/www/api && npm ci --omit=dev && sudo systemctl restart api'
curl -fsS https://api.example.com/healthz`,
        description:
          "Source-only rsync keeps secrets and local junk off the server; npm ci there rebuilds native deps against the server's platform.",
      },
    ],
    commonMistakes: [
      "Copying node_modules from a Mac to Linux — native binaries break silently.",
      "Deploying while the previous code still owns in-flight writes; order migrations carefully (expand-contract later in this module).",
      "No firewall at all: the box is scanned within minutes of a public IP being assigned.",
      "Manual deploys 'for now' that nobody can reproduce during an incident.",
    ],
    bestPractices: [
      "Script every deploy step; if it isn't in the script, it doesn't happen.",
      "Health-check after restart and treat failure as a failed deploy, not a shrug.",
      "Keep the server disposable: anything needed to rebuild it belongs in scripts or the image.",
    ],
    realWorldUseCases: [
      "A side project on a cheap VPS serving thousands of users behind Nginx and certbot.",
      "Migrating from rsync deploys to Docker pulls without changing the server hardware.",
      "An agency running five client apps on five small VMs with identical deploy scripts.",
    ],
    resources: [
      docs(
        "DigitalOcean — product tutorials and initial setup guides",
        "https://docs.digitalocean.com/products/droplets/how-to/create-droplets/",
        "Provider-specific steps, but the patterns (users, firewalls, SSH) transfer everywhere.",
      ),
      docs(
        "rsync man page",
        "https://download.samba.org/pub/rsync/rsync.1",
        "Flags for --delete, --exclude and archive mode.",
      ),
      docs(
        "Node.js — deployment guidance",
        "https://nodejs.org/en/learn/getting-started/deployment",
        OFFICIAL.nodejsLearn + " — production deployment checklist from the Node team.",
      ),
      ytSearch(
        "deploy Node.js API to VPS Nginx pm2 full walkthrough",
        "End-to-end VM deployment videos from provisioning to first HTTPS request.",
        "en",
        "20–60 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-vm-deploy",
        title: "Deploy by script",
        prompt:
          "Deploy your API to a VM twice: first by following your written steps manually, then by a single script (or CI job) that runs those steps. Time both runs. Add a health check to the script that fails the deploy when the app doesn't come up — prove it by deploying a deliberately broken image and watching the script exit non-zero.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "curl -fsS returns non-zero on HTTP errors — use that as the health gate",
          "Keep the last good image tag so recovery is a one-liner",
        ],
      },
    ],
    projectIds: ["p3-job-processing", "p3-booking-platform", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-deployment-platforms",
    slug: "deployment-platforms-compared",
    title: "Deployment Platforms Compared",
    description:
      "PaaS, serverless and managed containers: Vercel, Render, Fly.io, Railway, Cloud Run, AWS and friends — capabilities, limits and honest free-tier caveats.",
    order: 14,
    estimatedMinutes: 20,
    tags: ["paas", "vercel", "render", "cloud-run", "serverless"],
    prerequisites: ["p3m6-docker", "p3m6-environment-configuration"],
    relatedTopics: ["p3m6-cloud-deployment", "p3m6-cicd-pipelines", "p3m6-container-networking"],
    learningObjectives: [
      "Classify deployment targets: VMs, PaaS, managed containers, serverless",
      "Match a platform to an app's shape (long-running server vs functions)",
      "Evaluate free tiers honestly: cold starts, limits and egress pricing",
      "Identify lock-in risks and keep deployability portable",
    ],
    simpleExplanation:
      "Instead of managing a VM, you can hand your code or container to a platform that runs it: push to git, get a URL. Each platform draws the line differently — some want a Dockerfile, some a Node version and a start command, some only a serverless function. Free tiers exist to get you started; production features (always-on, custom scaling, longer builds) are usually paid, and limits change, so verify current docs before promising anything to your team.",
    detailedContent: `
The spectrum, from most control to least:

1. **IaaS VM** — you own OS, runtime, TLS, backups. Maximum control, maximum chores.
2. **Managed containers** — Google Cloud Run, AWS App Runner, Azure Container Apps: you ship a Docker image; the platform handles networking, TLS and scaling, including scale-to-zero on some. Request/response friendly; long-lived WebSockets need specific config or a different service.
3. **Container PaaS** — Render, Railway, Fly.io, Koyeb: git-connected or image-based deploys, usually running your container on always-on (or suspendable) instances. Free tiers typically suspend idle services which means **cold starts** (seconds of latency while the instance spins up): fine for demos, painful for APIs that must answer instantly.
4. **Frontend/serverless platforms** — Vercel, Netlify, Cloudflare Workers: excellent for React frontends and *API routes / functions*. Node support exists, but functions are ephemeral: no long-lived sockets, limited execution duration, mostly read-only filesystem, background work needs queues. A chat server holding thousands of open sockets is a different shape than a function.
5. **Full cloud DIY** — AWS Elastic Beanstalk, ECS/Fargate, Lightsail, GCP Compute Engine: more knobs, more pricing lines, more power.

Evaluation checklist (vendor-neutral): runtime shape (always-on vs request-scoped), cold-start behavior on the tier you will actually use, region availability near users, custom domains + managed TLS, background job support, database add-ons and their cost, egress fees, deploy rollback features, and the exit path (can I get my container, image and data out?).
    `,
    howItWorks: `
Most of these platforms share a pipeline: connect repo, detect or declare the build (Node version, \`npm ci && npm run build\`, or Dockerfile), run the result behind the platform's load balancer with auto-renewed TLS, inject env vars/secrets from the dashboard, and deploy new revisions on git push or image push, draining old instances.

Scale-to-zero platforms keep your revision metadata and spin a fresh instance on the next request (the cold start); always-on platforms keep at least one instance warm and add/remove replicas against CPU or request metrics. Serverless function platforms go further: they invoke your handler per request on shared infrastructure with strict timeouts.
    `,
    codeExamples: [
      {
        title: "A platform-neutral deployment contract",
        language: "text",
        code: `Whatever the platform, prepare:
  start command:   node dist/server.js   (or the Dockerfile CMD)
  health endpoint: GET /healthz returning 200 JSON
  env config:      all secrets as platform env vars, validated at boot
  port:            read from process.env.PORT (platforms inject it)
  build:           npm ci && npm run build
  migrations:      release phase or pre-deploy hook, not on boot of every instance`,
        description:
          "Apps that satisfy this contract port between platforms with minutes of work instead of a rewrite.",
      },
      {
        title: "Respecting PORT — the most common platform bug",
        language: "ts",
        code: `import express from "express";

const app = express();
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Platforms inject PORT; hard-coding 3000 is why "works locally, 502s there"
const port = Number(process.env.PORT ?? 3000);
app.listen(port, "0.0.0.0", () => console.log("listening on " + port));`,
        description:
          "Binding 0.0.0.0 and honouring PORT is non-negotiable for PaaS and container platforms alike.",
      },
    ],
    commonMistakes: [
      "Assuming a free tier's limits (execution time, memory, concurrent instances) match production needs without reading current docs.",
      "Running a WebSocket server on a function platform that only supports request/response.",
      "Ignoring cold starts for health-check endpoints that external uptime monitors hit every minute — you pay for spin-ups and look flaky.",
      "Deep platform-specific features (proprietary cron UIs, vendor queues) with no exit plan.",
    ],
    bestPractices: [
      "Pick the simplest platform that honestly fits your workload shape; migrate when a specific limit hurts, not speculatively.",
      "Keep the platform-neutral contract above so switching costs stay low.",
      "Track the real monthly bill at projected traffic — egress and add-on databases dominate costs on some platforms.",
    ],
    realWorldUseCases: [
      "A React frontend plus small API on a free-tier PaaS for a portfolio project — accepting cold starts.",
      "An always-on API for paying customers on a paid container plan with autoscaling and managed TLS.",
      "Serverless functions for webhooks and scheduled jobs, while the main API stays on a long-running container.",
    ],
    resources: [
      docs(
        "Google Cloud Run overview",
        "https://cloud.google.com/run/docs/overview",
        "Managed containers with scale-to-zero; useful as a baseline mental model.",
      ),
      docs(
        "Render — Node.js docs",
        "https://render.com/docs/node",
        "Build/start commands, health checks and environment on a popular container PaaS.",
      ),
      docs(
        "Fly.io documentation",
        "https://fly.io/docs/",
        "Region-pinned machines, persistent volumes and WebSocket-friendly deployments.",
      ),
      docs(
        "Vercel documentation",
        "https://vercel.com/docs",
        "Functions and full-stack deployments; check current runtime and duration limits.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-platform-matrix",
        title: "Comparison matrix",
        prompt:
          "For your capstone app, pick three candidate platforms from different categories (e.g., one VM, one container PaaS, one serverless). For each, record: pricing at your projected load, cold-start behavior, WebSocket support, managed database option, rollback mechanism and how you would export your app if leaving. Choose one and justify it in a paragraph.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Check the docs for current free-tier limits — they change and marketing pages bury them",
          "Long-lived sockets and per-request functions are usually incompatible",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-chat-app", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m6-process-management",
    slug: "process-management-with-pm2-and-systemd",
    title: "Process Management",
    description:
      "systemd units and pm2: keeping Node running, restarting on crash, clustering across cores, and routing logs where ops can find them.",
    order: 15,
    estimatedMinutes: 20,
    tags: ["pm2", "systemd", "processes", "linux"],
    prerequisites: ["p2m1-process-signals", "p3m6-linux-fundamentals"],
    relatedTopics: ["p3m6-logging-production", "p3m6-graceful-shutdown-deploy", "p3m6-cloud-deployment"],
    learningObjectives: [
      "Write a systemd unit that runs your API as a service with auto-restart",
      "Use pm2 for process supervision and cluster mode on multi-core hosts",
      "Explain why the start command and signal handling matter for restarts",
      "Choose between systemd, pm2 and platform-native process management",
    ],
    simpleExplanation:
      "When your SSH session closes, anything started naively in that shell dies. A process manager keeps your Node API alive across reboots and crashes: systemd is the Linux-native service manager built into every modern distribution; pm2 is a Node-specific tool that adds clustering and a friendly CLI. Both do the same core job — start the process, restart it if it dies, collect its logs.",
    detailedContent: `
**systemd.** A unit file in \`/etc/systemd/system/api.service\` declares the command, user, working directory and restart policy. \`systemctl enable api\` starts it at boot; \`systemctl restart api\` redeploys; \`journalctl -u api -f\` streams logs. systemd is ideal when Node is one of several machine services (Nginx, sshd, certbot timers) and you want uniform supervision.

**pm2.** \`pm2 start dist/server.js --name api\` daemonizes the process; \`pm2 save\` plus \`pm2 startup\` installs boot persistence. \`pm2 start dist/server.js -i max\` runs one worker per CPU core (Node cluster under the hood), which multiplies throughput on multi-core hosts because V8 is single-threaded per process. \`pm2 logs api\`, \`pm2 monit\` and \`pm2 restart api --update-env\` round out the workflow.

**Signals.** Both send SIGTERM on stop/restart. Your app must exit on SIGTERM after closing servers and pools (graceful shutdown — covered later); a process that ignores SIGTERM gets SIGKILL after a timeout, losing in-flight work.

**Which to choose?** Platforms (PaaS, Cloud Run, k8s) manage processes for you — don't install pm2 there. On a VM: systemd is the more universal, more ops-friendly choice; pm2 wins on Node ergonomics and easy clustering. Pick one per host and document it.
    `,
    howItWorks: `
systemd is PID 1: it starts enabled units at boot and reaps their children. When you run \`systemctl restart api\`, systemd sends SIGTERM to the main process (identified by the unit's PIDFile or the exec'd process), waits \`TimeoutStopSec\`, then SIGKILLs. The Restart= directive controls what happens on unexpected exits — \`always\` or \`on-failure\` keeps a crashed app alive without human intervention.

pm2 runs as a daemon (\`pm2 daemon\`) that supervises each app process, restarting them per policy and multiplexing their stdout into its own log files. In cluster mode it forks workers with the Node cluster module: the master holds the listening socket and balances connections across workers, so a crash of one worker doesn't drop the listener.
    `,
    codeExamples: [
      {
        title: "systemd unit for a Node API",
        language: "ini",
        code: `# /etc/systemd/system/api.service
[Unit]
Description=Orders API
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/api
EnvironmentFile=/var/www/api/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5
# Give the app time to drain on SIGTERM:
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target`,
        description:
          "systemctl daemon-reload && systemctl enable --now api. Logs flow to journald: journalctl -u api -f.",
      },
      {
        title: "pm2 with cluster mode",
        language: "bash",
        code: `npm ci --omit=dev
pm2 start dist/server.js --name api -i max   # one worker per CPU core
pm2 save                                     # snapshot process list
pm2 startup systemd -u deploy --hp /home/deploy   # run the printed sudo cmd

pm2 logs api
pm2 restart api --update-env   # re-read env vars after a config change
pm2 delete api                 # stop and forget`,
        description:
          "Cluster mode multiplies throughput; save + startup survive reboots. Remember: -i max only helps if your app is stateless per request.",
      },
    ],
    commonMistakes: [
      "Starting node with nohup in an SSH session and wondering why it vanished after logout.",
      "Using pm2 inside Docker or on a PaaS that already supervises the process — double supervision causes confusion and double restarts.",
      "Forgetting TimeoutStopSec and killing connections mid-request on every deploy.",
      "Cluster mode with in-memory sessions or caches, so users get inconsistent responses across workers.",
    ],
    bestPractices: [
      "One process manager per host, documented in your runbook.",
      "Always pair process management with graceful SIGTERM handling in the app.",
      "Log to stdout and let the supervisor (journald, pm2, the platform) handle files.",
    ],
    realWorldUseCases: [
      "A VPS API surviving reboot and crash loops thanks to systemd Restart=on-failure.",
      "pm2 cluster mode doubling request throughput on a 2-core box without code changes.",
      "Incident: 'the site is down' traced to systemd showing the unit in a failed state with OOM in the journal.",
    ],
    resources: [
      docs(
        "systemd.service manual",
        "https://www.freedesktop.org/software/systemd/man/systemd.service.html",
        "Directives used in the unit file above.",
      ),
      docs(
        "pm2 quick start",
        "https://pm2.keymetrics.io/docs/usage/quick-start/",
        "Official pm2 usage guide: start, save, startup, logs.",
      ),
      docs(
        "Node.js cluster module",
        "https://nodejs.org/api/cluster.html",
        OFFICIAL.nodejsApi + " — what pm2 -i max does under the hood.",
      ),
      docs(
        "Node.js process signals",
        "https://nodejs.org/api/process.html#process-signals-and-events",
        "How Node exposes SIGTERM/SIGINT handlers for clean shutdown.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-systemd",
        title: "Service-ify your app",
        prompt:
          "Run your API under systemd (or pm2) with automatic restart and boot persistence. Prove all three: (1) kill -9 the process and watch it come back, (2) reboot the machine and confirm the service is listening, (3) show logs via journalctl -u api (or pm2 logs). Record the exact enable commands in your runbook.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "kill -9 tests crash recovery; systemctl restart tests the normal path",
          "systemctl daemon-reload is required after editing a unit file",
        ],
        solution: `sudo systemctl daemon-reload && sudo systemctl enable --now api
systemctl is-active api          # active
kill -9 $(pgrep -f dist/server.js); sleep 5
systemctl is-active api          # active again (Restart=on-failure)
sudo reboot                      # after boot: ss -tlnp | grep :3000
journalctl -u api -n 20 --no-pager`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-job-processing", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-logging-production",
    slug: "logging-in-production",
    title: "Logging in Production",
    description:
      "Structured JSON logs, levels, request correlation, what never to log, stdout versus files, rotation and shipping logs to a central place.",
    order: 16,
    estimatedMinutes: 19,
    tags: ["logging", "pino", "observability", "json"],
    prerequisites: ["p2m2-logging-requests", "p2m5-logging-monitoring"],
    relatedTopics: ["p3m6-metrics-monitoring", "p3m6-process-management", "p3m6-production-incident-debugging"],
    learningObjectives: [
      "Emit structured JSON logs with consistent fields and levels",
      "Attach a request/correlation id so one user action is traceable across logs",
      "Know what must never be logged (secrets, tokens, card data, passwords)",
      "Route stdout to journald or a log file with rotation and optional aggregation",
    ],
    simpleExplanation:
      "In production you cannot attach a debugger to a request that happened three hours ago in another timezone. Logs are the flight recorder: structured, machine-parseable lines that tell you what happened, for whom, and why. Writing 'console.log(\"error\")' is not logging; a JSON line with level, timestamp, request id, route and error message is.",
    detailedContent: `
**Structured beats formatted.** Human-readable multi-line logs are fine locally; in production, one JSON object per line lets grep, jq and log platforms filter on fields: \`{"level":"error","reqId":"a1b2","msg":"payment failed","userId":42}\`. Libraries like pino (Fastify's default) or winston produce this with near-zero overhead.

**Levels with intent.** debug (dev only), info (business milestones: order created, deploy finished), warn (degraded but survived), error (request failed, someone should look), fatal (process is dying). In production set level to info; debug logging at scale is slow and expensive.

**Correlation.** Generate a request id at the edge (or trust a well-formed \`X-Request-Id\`), attach it to every log line in that request's context, and return it in a response header. When a user says 'it failed', their id pulls the whole story from the logs.

**What never to log.** Passwords, session tokens, JWTs, API keys, full payment card data, health-check spam, and entire request bodies by default. Log ids and outcomes, not payloads. Assume logs are readable by everyone with infrastructure access — because they will be.

**Where logs go.** Apps should write to **stdout/stderr only**. systemd/journald, Docker's json-file driver, or the platform captures it. Add rotation (Docker \`max-size\`/\`max-file\`, logrotate, or journald limits) or disks fill. Centralized tools (Grafana Loki, CloudWatch, Datadog, self-hosted ELK) aggregate multi-instance logs so you can search across the fleet.
    `,
    howItWorks: `
A structured logger serializes a log object to a single-line JSON string and writes it to stdout. The process supervisor (systemd, Docker, the PaaS) owns durability: journald appends to /var/log/journal with size caps; Docker's logging driver rotates files; platforms ship stdout to their own collectors. Agents on the host (Promtail, Fluent Bit, Vector) tail those destinations, add metadata (host, service, environment) and push batches to a query engine like Loki.

Sampling is the pressure valve: at high RPS, log every error but sample successful requests (e.g., 1%), and always keep slow requests. That preserves signal while capping cost.
    `,
    codeExamples: [
      {
        title: "pino with request ids",
        language: "ts",
        code: `import pino from "pino";
import { randomUUID } from "node:crypto";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // Never log the config object wholesale — it contains secrets.
});

export function requestContext(req, res, next) {
  const reqId = (req.headers["x-request-id"] as string) ?? randomUUID();
  res.setHeader("x-request-id", reqId);
  // Every line for this request now carries reqId, method, path
  (req as any).log = logger.child({ reqId, method: req.method, path: req.path });
  next();
}

// Usage in a handler:
// req.log.info({ orderId }, "order created");
// req.log.error({ err }, "payment failed");   // pino serializes Error stacks`,
        description:
          "Child loggers inject shared fields once; handlers stay clean. Error objects serialize with stack traces via pino's err serializer.",
      },
      {
        title: "Docker log rotation — non-negotiable",
        language: "json",
        code: `// /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}`,
        description:
          "Without this, container logs grow until the disk is full — a classic self-inflicted outage. Restart docker after editing.",
      },
    ],
    commonMistakes: [
      "Logging secrets or entire config objects because 'it's easier to debug'.",
      "No request id, so reconstructing one failed request means eyeballing timestamps across instances.",
      "Console.log of unstructured strings that no tool can index or filter.",
      "Never rotating logs and losing the disk to your own debugging output.",
    ],
    bestPractices: [
      "stdout only; let the platform own files, rotation and shipping.",
      "Structured JSON with a stable schema: level, time, reqId, msg, plus context fields.",
      "Log outcomes and durations; sample or drop noisy success paths at high volume.",
    ],
    realWorldUseCases: [
      "A payment failure reconstructed end-to-end from a single x-request-id across API and worker logs.",
      "Compliance review: confirming no customer passwords or card numbers appear in the log pipeline.",
      "Cost control: switching a high-traffic endpoint from debug to info cuts the monthly log bill.",
    ],
    resources: [
      docs(
        "pino — documentation",
        "https://github.com/pinojs/pino",
        "Fast JSON logger used in the example, with child loggers and serializers.",
      ),
      docs(
        "12factor.net — logs",
        "https://12factor.net/logs",
        "The 'treat logs as event streams, write to stdout' philosophy.",
      ),
      docs(
        "Grafana Loki — getting started",
        "https://grafana.com/docs/loki/latest/get-started/",
        "How centralized log querying works without indexing every field.",
      ),
      ytSearch(
        "structured logging Node.js pino production",
        "Videos wiring pino, request ids and log shipping into Express/Fastify.",
        "en",
        "15–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-structured-logs",
        title: "Make logs searchable",
        prompt:
          "Add structured logging with a request id to your API. Trigger three requests, capture the JSON lines, and use jq (or your platform's search) to answer: how many errors occurred, which paths were hit, and the full log for one request id. Then deliberately log a secret and remove it — write down the rule you'll enforce in review.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "jq 'select(.level==\"error\")' file.log filters levels",
          "Return x-request-id in the response header so users can quote it in bug reports",
        ],
      },
    ],
    projectIds: ["p3-chat-app", "p3-analytics-api", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-metrics-monitoring",
    slug: "metrics-and-monitoring",
    title: "Metrics & Monitoring",
    description:
      "Logs vs metrics vs traces, the RED method, Prometheus + Grafana in practice, alert thresholds that don't cry wolf, and a first OpenTelemetry step.",
    order: 17,
    estimatedMinutes: 21,
    tags: ["metrics", "prometheus", "grafana", "observability"],
    prerequisites: ["p3m4-performance-monitoring", "p2m5-logging-monitoring"],
    relatedTopics: ["p3m6-logging-production", "p3m6-health-checks", "p3m6-production-incident-debugging"],
    learningObjectives: [
      "Distinguish logs, metrics and traces and when each answers which question",
      "Instrument an API with RED metrics (rate, errors, duration) via prom-client",
      "Run Prometheus scraping and visualize with Grafana dashboards",
      "Write alerts that page humans only when action is needed",
    ],
    simpleExplanation:
      "Logs tell you what happened in one request; metrics tell you what is happening *right now, across everything*: request rate, error rate, latency percentiles, memory. Metrics are numbers you graph and alert on. Traces connect one request across many services. Together they answer 'is it broken, how badly, and where?' in minutes instead of hours.",
    detailedContent: `
**The three pillars.** Metrics (aggregate numeric time series — cheap to store, great for graphs and alerts), logs (discrete events — great for detail), traces (one request's path through services — great for latency analysis in distributed systems).

**RED method** for request-driven services: **R**ate (requests/sec), **E**rrors (failed requests/sec or %), **D**uration (latency distribution — p50/p95/p99, not averages). USE (Utilization, Saturation, Errors) applies the same idea to resources like CPU, memory and queues.

**Prometheus model.** Your app exposes \`/metrics\` in the Prometheus text format. Prometheus scrapes it on an interval, stores time series with labels (\`{route="/orders",status="500"}\`), and answers PromQL queries like \`sum(rate(http_requests_total[5m]))\`. Grafana connects to Prometheus as a data source and renders dashboards; alert rules evaluate PromQL and notify (email, Slack, PagerDuty via Alertmanager).

**Cardinality warning.** Never label metrics with user ids, order ids or raw URLs with ids in them — \`/orders/123\` and \`/orders/124\` as separate labels explode storage. Normalize routes first (\`/orders/:id\`).

**Uptime checks** (external probes hitting /healthz every minute) catch 'whole region unreachable' — something internal metrics cannot see if the whole host is down. OpenTelemetry adds standardized traces/metrics export without vendor lock-in.
    `,
    howItWorks: `
Instrumentation code increments counters (atomic-ish increments with labels) and observes histograms (bucketed latency samples). At scrape time the library renders current counter values and histogram buckets as text. Prometheus pulls that snapshot, appends to its time-series database (TSDB), and keeps it for a retention window (often 15 days; longer retention usually lives in remote storage or Thanos/Mimir-style systems).

Grafana dashboards are just PromQL queries plus panels. A minimal useful board: request rate by status class, error rate, p95 latency by route, CPU/memory of the host, and DB pool saturation. Alerts like \`error rate > 5% for 10m\` or \`p95 > 1s for 15m\` turn graphs into a notification system — tuned so pages are rare and meaningful.
    `,
    codeExamples: [
      {
        title: "prom-client middleware for Express",
        language: "ts",
        code: `import { Registry, Counter, Histogram, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();
collectDefaultMetrics({ register: registry }); // event loop, heap, GC...

export const httpRequests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Request duration in seconds",
  labelNames: ["method", "route"] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method });
  res.on("finish", () => {
    httpRequests.inc({ method: req.method, route: req.route?.path ?? "other", status: res.statusCode });
    end();
  });
  next();
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});`,
        description:
          "Expose /metrics for Prometheus; keep route labels normalized to avoid cardinality explosions.",
      },
      {
        title: "A first alert rule",
        language: "yaml",
        code: `groups:
  - name: api
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "More than 5% of requests are 5xx for 10 minutes"`,
        description:
          "The 'for: 10m' clause stops single blips from paging you; tune thresholds against real traffic, not guesses.",
      },
    ],
    commonMistakes: [
      "Alerting on CPU alone — apps are often I/O bound; RED signals match user pain better.",
      "High-cardinality labels (user id in a metric label) melting the Prometheus TSDB.",
      "Only measuring averages, which hide the p99 tail where users actually suffer.",
      "Dashboards nobody looks at: if an alert doesn't reference a dashboard panel, build one.",
    ],
    bestPractices: [
      "Start with RED dashboards plus host CPU/memory; add traces when services multiply.",
      "Page on symptoms users feel (errors, latency), not on causes (CPU), when possible.",
      "Record runbook links in alert annotations so responders land on next steps.",
    ],
    realWorldUseCases: [
      "A memory-leak deploy detected in 20 minutes by a heap trend panel, before customers noticed.",
      "Black-box uptime checks catching a DNS misconfiguration that internal metrics couldn't see.",
      "Capacity planning: request-rate graphs justifying a bigger instance before a sale event.",
    ],
    resources: [
      docs(
        "Prometheus — getting started",
        "https://prometheus.io/docs/introduction/overview/",
        "Scrape model, PromQL and alerting concepts.",
      ),
      docs(
        "prom-client (Node.js client)",
        "https://github.com/siimon/prom-client",
        "The library used in the example: counters, histograms, default metrics.",
      ),
      docs(
        "Grafana — documentation",
        "https://grafana.com/docs/grafana/latest/",
        "Dashboards, data sources and alerting UI.",
      ),
      docs(
        "OpenTelemetry JS",
        "https://opentelemetry.io/docs/languages/js/",
        "Vendor-neutral traces and metrics for when you outgrow a single Prometheus.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-red-dashboard",
        title: "RED from zero",
        prompt:
          "Instrument your API with request count, error count and duration histograms. Run Prometheus + Grafana via Docker Compose, scrape the app, and build one dashboard showing rate, error % and p95 latency. Generate load and 500s (a temporary broken route works), and screenshot each panel's response. Write one alert rule you would actually page on.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "Normalize route labels before incrementing counters",
          "Histogram quantiles: histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))",
        ],
      },
    ],
    projectIds: ["p3-analytics-api", "p3-job-processing", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-health-checks",
    slug: "health-check-endpoints",
    title: "Health Checks",
    description:
      "Liveness versus readiness, what a health endpoint should (and should not) check, and how load balancers and platforms consume them.",
    order: 18,
    estimatedMinutes: 15,
    tags: ["health-checks", "readiness", "load-balancers", "reliability"],
    prerequisites: ["p3m6-metrics-monitoring", "p3m6-reverse-proxies"],
    relatedTopics: ["p3m6-graceful-shutdown-deploy", "p3m6-deployment-platforms", "p3m6-cicd-pipelines"],
    learningObjectives: [
      "Define liveness and readiness probes and when each should fail",
      "Implement a fast /healthz endpoint that checks critical dependencies",
      "Explain how load balancers and platforms use health checks to route traffic",
      "Avoid the classic traps: slow health checks and lying health checks",
    ],
    simpleExplanation:
      "A health endpoint is your app answering the question 'should I be used right now?'. Liveness means 'the process isn't wedged — restart me if not'. Readiness means 'I can serve real traffic —don't route users to me yet'. Platforms and load balancers poll these endpoints; getting them right is the difference between zero-downtime deploys and mysterious 502s.",
    detailedContent: `
**Two endpoints, two meanings:**

- \`GET /healthz\` (liveness): is the process alive and the event loop turning? Almost nothing else. If this fails, the platform should restart the process. Checking the database here is a mistake: a brief DB blip would cause restart storms across every instance.
- \`GET /readyz\` (readiness): are critical dependencies reachable (DB ping, migrations finished, config loaded)? If not, return 503 so the load balancer removes this instance from rotation *without* restarting it. During graceful shutdown, flip readiness to failing immediately — that is how you drain traffic.

**Implementation rules:**

- Return quickly (single-digit milliseconds typical). The DB check should be a trivial ping with a tight timeout, not a full query.
- Return a small JSON body with per-dependency status for humans; rely on status codes for machines.
- Be honest: a 200 with "ok" while the DB is down trains systems to keep sending traffic you cannot handle.
- Keep them unauthenticated but cheap; they will be hit every 5–10 seconds per instance per checker.

**What platforms expect.** Most PaaS and container platforms let you configure the path, interval and failure threshold for health checks at the service level. Nginx-based health endpoints are often simple 200 checks; more advanced load balancers distinguish the two probe types explicitly.
    `,
    howItWorks: `
The checker (platform, load balancer, or external uptime service) sends an HTTP request on a schedule. Success codes (usually 200) mark the instance healthy; repeated failures mark it unhealthy. What happens next differs by layer: a container orchestrator may restart the container on liveness failure and remove it from service on readiness failure; an external LB stops sending new connections; a Compose file just shows the container as 'unhealthy' to humans.

During deploys the sequence is: new instance starts → readiness fails until warm → readiness passes → LB adds it → old instance flips readiness to fail → LB drains it → old instance finishes in-flight requests and exits. Every zero-downtime platform implements some version of this handshake.
    `,
    codeExamples: [
      {
        title: "Liveness and readiness done properly",
        language: "ts",
        code: `import express from "express";
import { pool } from "./db";

const app = express();
let shuttingDown = false;

// Liveness: cheap, no dependencies. Used to decide "restart me?"
app.get("/healthz", (_req, res) => res.status(200).json({ status: "alive" }));

// Readiness: can we actually serve traffic?
app.get("/readyz", async (_req, res) => {
  if (shuttingDown) {
    return res.status(503).json({ status: "draining" });
  }
  try {
    await pool.query("SELECT 1"); // tight timeout configured on the pool
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "unready", reason: "database" });
  }
});

export function markDraining() { shuttingDown = true; } // called on SIGTERM`,
        description:
          "Readiness doubles as the graceful-shutdown drain signal: markDraining() makes /readyz fail so the LB stops routing to this instance.",
      },
    ],
    commonMistakes: [
      "Checking the database in the liveness endpoint, causing restart cascades during brief DB incidents.",
      "Health endpoints that take seconds under load, so checkers time out and flap the instance.",
      "Returning 200 always ('the process is up!') while a critical dependency is down.",
      "Securing health endpoints with the app's auth middleware, so the platform's anonymous probe gets 401 and kills a healthy instance.",
    ],
    bestPractices: [
      "Separate /healthz (liveness) from /readyz (readiness) and wire them to different platform probes.",
      "Keep checks dependency-light, fast and unauthenticated; use timeouts under 1 second.",
      "Flip readiness to failing at the start of shutdown to drain connections before exit.",
    ],
    realWorldUseCases: [
      "A rolling deploy that keeps 100% of requests successful because new instances are only added when ready.",
      "Database maintenance: readiness fails on affected instances only, while liveness stays green and avoids pointless restarts.",
      "External uptime monitors polling /healthz to catch total outages before customers tweet about them.",
    ],
    resources: [
      docs(
        "Kubernetes — liveness, readiness and startup probes",
        "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
        "The canonical write-up of probe semantics even if you're not on k8s.",
      ),
      docs(
        "Docker Compose healthcheck",
        "https://docs.docker.com/compose/compose-file/05-services/#healthcheck",
        "Container-level health checks used by depends_on conditions.",
      ),
      docs(
        "Google Cloud — health checks overview",
        "https://cloud.google.com/load-balancing/docs/health-checks",
        "How managed load balancers consume health check responses.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-health-endpoints",
        title: "Probe your app",
        prompt:
          "Add /healthz and /readyz to your API. Demonstrate with curl -i: (1) both return 200 normally, (2) stop the database and show /readyz returning 503 while /healthz still returns 200, (3) call your drain function and show /readyz failing with a draining message. Wire /readyz into your Compose healthcheck or platform config.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Give the DB pool a short query timeout so /readyz never hangs",
          "curl -i shows status codes and headers, not just the body",
        ],
        solution: `curl -i localhost:3000/healthz     # HTTP/1.1 200
docker compose stop db
curl -i localhost:3000/readyz     # HTTP/1.1 503 {"status":"unready","reason":"database"}
curl -i localhost:3000/healthz    # still 200 — liveness independent of the DB
docker compose start db && curl -i localhost:3000/readyz  # back to 200`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-chat-app", "p3-capstone"],
  },
  {
    ...shared,
    id: "p3m6-graceful-shutdown-deploy",
    slug: "graceful-shutdown-during-deploys",
    title: "Graceful Shutdown & Deploys",
    description:
      "SIGTERM handling, draining in-flight requests, closing pools, platform drain windows and why process.exit(0) in a handler is a deploy bug.",
    order: 19,
    estimatedMinutes: 19,
    tags: ["shutdown", "signals", "deploys", "reliability"],
    prerequisites: ["p3m4-graceful-shutdown", "p2m1-process-signals"],
    relatedTopics: ["p3m6-health-checks", "p3m6-process-management", "p3m6-rollbacks"],
    learningObjectives: [
      "Handle SIGTERM by stopping new work, finishing in-flight requests and closing resources",
      "Order shutdown steps correctly: readiness → server.close → pool → exit",
      "Respect platform drain timeouts and set your own safety net below them",
      "Diagnose deploy-time 502s caused by abrupt process death",
    ],
    simpleExplanation:
      "Every deploy restarts your process. If the process dies instantly, users mid-request get cut off. Graceful shutdown means: on the stop signal, tell load balancers 'don't send me new traffic', finish what you're already doing, close database pools, then exit — within the platform's deadline so you never get force-killed mid-cleanup.",
    detailedContent: `
When systemd, pm2, Docker or a platform stops your app, it sends **SIGTERM** (SIGKILL comes later, unblockable, after a timeout). A graceful shutdown:

1. **Fail readiness** (\`/readyz\` → 503) so the LB drains you. If your platform has a documented deregistration delay, respect it.
2. **Stop the HTTP server** with \`server.close()\` — it stops accepting new connections but waits for existing ones to finish. Node 18+ also has \`server.closeIdleConnections()\` and \`closeKeepAliveConnections()\` for tighter control.
3. **Close downstream resources**: database pool (\`pool.end()\`), queue producers, WebSocket server (send close frames), timers.
4. **Exit 0** — but only after steps 1–3 complete, with a safety-net timer (e.g., 25s) that force-exits if something hangs, always shorter than the platform's kill timeout (e.g., systemd TimeoutStopSec=30).

Do **not** call \`process.exit(0)\` at the top of your SIGTERM handler the moment the signal arrives — that's just a slower SIGKILL: in-flight requests die, DB transactions are cut. (Contrast: a health endpoint's drain flag is a *signal to the LB*, not a reason to exit.)

Handle SIGINT similarly for local Ctrl+C ergonomics. Multiple signals: after the first, start closing; a second can escalate to immediate exit for the impatient operator.
    `,
    howItWorks: `
Node's HTTP server holds open sockets. \`server.close()\` marks the server as no longer accepting; the callback fires only when the last connection ends — which is why a chat app with long-lived WebSockets would hang forever without explicit socket management. Meanwhile the OS keeps the listening socket until the process exits; the platform's LB integration is what actually stops routing new requests.

Timing discipline is everything: total shutdown budget = platform drain delay + your finish time, and your safety timer must sit inside the platform's kill deadline. If deploys show brief 502s, the usual culprit is either missing drain (readiness never fails) or a process.exit that outruns in-flight work.
    `,
    codeExamples: [
      {
        title: "SIGTERM-safe Express server",
        language: "ts",
        code: `import http from "node:http";
import { pool } from "./db";
import { markDraining } from "./health";

const server = http.createServer(app);
server.listen(3000);

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;      // second signal: let the process die naturally
  shuttingDown = true;
  console.log({ signal }, "graceful shutdown started");

  markDraining();                // 1) /readyz now returns 503 — LB drains us

  server.close(() => console.log("http server closed")); // 2) finish in-flight
  // Give the platform/LB a moment to deregister before we stop accepting:
  setTimeout(() => server.closeIdleConnections(), 1000);

  const deadline = setTimeout(() => {
    console.error("shutdown deadline exceeded — forcing exit");
    process.exit(1);
  }, 25000);                    // keep BELOW the platform kill timeout

  try {
    await pool.end();            // 3) close DB pool
  } catch (err) {
    console.error({ err }, "pool close failed");
  }
  clearTimeout(deadline);
  process.exit(0);               // 4) clean exit
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));`,
        description:
          "The canonical sequence: drain flag, close server, close pool, exit — with a hard deadline under the platform's SIGKILL timer.",
      },
      {
        title: "Proving it works locally",
        language: "bash",
        code: `node dist/server.js &
APP_PID=$!
curl -s http://localhost:3000/readyz   # 200
kill -TERM $APP_PID                     # same signal platforms send
sleep 1
curl -s -o /dev/null -w '%{http_code}\\n' http://localhost:3000/readyz
# After drain starts you should see 503, then connection refused once exited`,
        description:
          "Rehearse shutdowns the same way you rehearse restores — on a quiet afternoon, not during a deploy at 5pm.",
      },
    ],
    commonMistakes: [
      "Calling process.exit(0) immediately in the SIGTERM handler, cutting off in-flight requests.",
      "Never failing readiness during drain, so the LB keeps sending traffic while the server is closing.",
      "Shutdown timeout longer than the platform's kill deadline, so cleanup is always interrupted by SIGKILL.",
      "Forgetting WebSocket servers and queue consumers, which keep the process alive after server.close().",
    ],
    bestPractices: [
      "Fail readiness first, close the server second, close resources third, exit last.",
      "Set the safety-net timer 5 seconds under the platform's stop timeout (30s platform / 25s app is a common pair).",
      "Test graceful shutdown in CI with a scripted curl + kill, not just in production luck.",
    ],
    realWorldUseCases: [
      "Rolling deploys on a busy API with zero user-visible errors thanks to readiness draining.",
      "A queue worker finishing its current job before exit, so no message is half-processed.",
      "Debugging recurring deploy-time 502s that vanished after adding a 2-second drain delay.",
    ],
    resources: [
      docs(
        "Node.js process signals",
        "https://nodejs.org/api/process.html#process-signals-and-events",
        "SIGTERM/SIGINT semantics in Node.",
      ),
      docs(
        "Node.js http server close",
        "https://nodejs.org/api/net.html#serversocketclosedevent",
        "How close() waits for connections; closeIdleConnections behavior.",
      ),
      docs(
        "Docker — use signals in containers",
        "https://docs.docker.com/build/building/best-practices/#use-json-array-forms-for-cmd-and-entrypoint",
        "Why the exec-form CMD matters so Node receives SIGTERM as PID 1.",
      ),
      ytSearch(
        "graceful shutdown Node.js SIGTERM deploy drain",
        "Walkthroughs of shutdown handlers and deploy draining.",
        "en",
        "10–30 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-graceful-shutdown",
        title: "Drain under fire",
        prompt:
          "Implement graceful shutdown in your API. Write a test script that starts the server, fires a slow request (add a temporary 3-second delay route), sends SIGTERM mid-request, and proves the slow request still completes with a valid response while /readyz returns 503 during the drain. Then break the handler with process.exit(0) and observe the difference.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Start the slow curl in the background before kill -TERM",
          "Watch the server logs: 'graceful shutdown started' should appear before the response finishes",
        ],
        solution: `node dist/server.js &
curl -s http://localhost:3000/slow &    # 3s delay route
kill -TERM $!
wait %1                                  # slow request completes 200
# Broken version for contrast: first line of the handler = process.exit(0)
# → curl reports empty reply / connection reset instead`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-chat-app", "p3-job-processing", "p3-ecommerce-platform"],
  },
  {
    ...shared,
    id: "p3m6-database-migrations",
    slug: "production-database-migrations",
    title: "Production Database Migrations",
    description:
      "Expand-contract, lock-aware schema changes, running migrations in the deploy pipeline and why big-bang migrations lose to boring incremental ones.",
    order: 20,
    estimatedMinutes: 22,
    tags: ["migrations", "prisma", "schema", "deploys"],
    prerequisites: ["p2m4-prisma-migrations", "p3m6-cicd-pipelines"],
    relatedTopics: ["p3m6-rollbacks", "p3m6-backups-recovery", "p3m6-cloud-deployment"],
    learningObjectives: [
      "Apply the expand-contract (parallel change) pattern for safe schema evolution",
      "Recognize locking hazards: long ALTERs, NOT NULL without defaults, table rewrites",
      "Run Prisma migrate deploy (not dev) as a controlled pipeline step",
      "Keep app versions compatible with the schema during rolling deploys",
    ],
    simpleExplanation:
      "A migration changes the database schema while real users are writing to it. The safe habit is: expand first (add new columns/tables the old code ignores), migrate data, then contract later (drop the old stuff) — so old and new app versions can coexist during a rolling deploy. One giant 'rename everything' migration is how you get a five-minute lock and a five-figure incident.",
    detailedContent: `
**Why migrations are a deploy problem.** During a rolling deploy, old and new app versions run side by side for a window. Any schema change must be safe for *both* versions. Expand-contract (a.k.a. parallel change) makes that possible:

1. **Expand** — add new nullable columns, new tables, new indexes built concurrently. Old code keeps working.
2. **Migrate** — backfill rows in batches; dual-write from the app if needed.
3. **Contract** — once no old code references the old shape, drop the old column/constraint in a later deploy.

**Locking hazards (Postgres-flavoured):**

- \`ALTER TABLE ... ADD COLUMN ... DEFAULT\` is fast on modern Postgres (metadata-only for non-volatile defaults) — but older versions rewrote the table.
- Adding a UNIQUE constraint (or NOT NULL without a prior validated CHECK) can scan and lock the whole table, blocking writes.
- Create indexes with \`CREATE INDEX CONCURRENTLY\` in production, and make migrations that use it non-transactional where your tool requires it.
- Backfills: batch by primary key ranges, throttle, and resume-able beats one 10-hour UPDATE.

**Tooling.** Prisma: \`prisma migrate dev\` creates migrations locally; **production must run \`prisma migrate deploy\`** (applies pending migrations, no prompts, no drift repair). Never run schema-push/auto-sync against prod. Alembic, Knex and Rails-style tools follow the same principle: migrations are versioned, reviewed files applied in order.

**Pipeline placement.** Run migrations as a distinct deploy step before (or as a health-gated phase of) switching app versions — not on boot of every instance, which races instances against each other.
    `,
    howItWorks: `
A migration tool stores an applied-migrations table in the database. On deploy, \`migrate deploy\` diffs that ledger against ordered migration files and applies only what's missing. Each file is plain SQL (or generated SQL from a schema DSL) executed inside a transaction when possible; some statements (CONCURRENTLY index builds) force non-transactional execution, which is why 'resume safety' matters.

The database enforces locking rules during DDL: an ALTER that needs an ACCESS EXCLUSIVE lock waits behind any open transaction — and blocks all subsequent writes behind it. That queue effect is how a 'quick' migration becomes a production outage even when the statement itself would take seconds on an idle table.
    `,
    codeExamples: [
      {
        title: "Expand-contract in two deploys",
        language: "sql",
        code: `-- Deploy A (expand): old code keeps working
ALTER TABLE orders ADD COLUMN status_v2 text;          -- nullable, no rewrite
CREATE INDEX CONCURRENTLY orders_status_v2_idx ON orders (status_v2);

-- Deploy B (backfill, run separately, batched):
-- UPDATE orders SET status_v2 = status WHERE id BETWEEN $1 AND $2;  (loop)

-- App now writes BOTH columns for a while (dual-write)...

-- Deploy C (contract, only after no code reads 'status'):
ALTER TABLE orders DROP COLUMN status;`,
        description:
          "Three boring deploys beat one heroic migration; each step is reversible in isolation and never locks out writers.",
      },
      {
        title: "Prisma in the pipeline",
        language: "bash",
        code: `# CI/CD deploy step (after pulling the new image, before switching traffic):
npx prisma migrate deploy
# Applies pending migrations from prisma/migrations using the ledger table.
# No prompts, no schema drift repair — exactly what automation needs.

# Local development only:
npx prisma migrate dev   # creates migrations from schema.prisma changes`,
        description:
          "migrate dev is for laptops; migrate deploy is for servers. Mixing them up is a classic Friday surprise.",
      },
    ],
    commonMistakes: [
      "Running migrations on every instance boot — concurrent instances race and double-apply.",
      "One migration that renames a column and updates all code at once, so rolling back the app breaks against the new schema.",
      "Creating indexes without CONCURRENTLY on a large table and blocking all writes for minutes.",
      "Backfilling with a single UPDATE on millions of rows inside one transaction.",
    ],
    bestPractices: [
      "Expand, backfill, then contract in separate deploys; treat dropping things as a later ceremony.",
      "Review migrations like code — they run against the only copy of production data.",
      "Keep a pre-migration backup or snapshot step for high-risk changes, and rehearse the migration on a staging copy.",
    ],
    realWorldUseCases: [
      "Adding a required field to an e-commerce order without downtime: nullable column → backfill → app dual-write → constraint.",
      "A failed big-bang migration held ACCESS EXCLUSIVE for 20 minutes; the fix was reverting to expand-contract.",
      "Rolling deploys across 10 app instances, safe because the schema supported both versions throughout.",
    ],
    resources: [
      docs(
        "Prisma Migrate",
        "https://www.prisma.io/docs/orm/prisma-migrate",
        " migrate deploy vs migrate dev, and production workflow.",
      ),
      docs(
        "PostgreSQL — ALTER TABLE",
        "https://www.postgresql.org/docs/current/sql-altertable.html",
        "Locking behavior and NOT NULL / DEFAULT semantics.",
      ),
      docs(
        "PostgreSQL — CREATE INDEX CONCURRENTLY",
        "https://www.postgresql.org/docs/current/sql-createindex.html",
        "Building indexes without blocking writes (and why it can't run in a transaction).",
      ),
      article(
        "Martin Fowler — Parallel Change",
        "https://martinfowler.com/bliki/ParallelChange.html",
        "martinfowler.com",
        "The expand-contract pattern explained by its popularizers.",
        { estimatedDuration: "10 min" },
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-expand-contract",
        title: "Safely add a required field",
        prompt:
          "Pick a model in your app and add a new required field using expand-contract across at least two migration steps. On a staging copy of a large-ish table, measure: does the expand step lock writes? Write the batched backfill script (pseudo-code is fine) and state what you'd monitor during the backfill in production.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "First migration: nullable column only. Second: backfill batches. Third: make it required (NOT NULL) after data is clean",
          "Postgres: ALTER TABLE ... ADD CONSTRAINT ... NOT NULL requires a full scan unless you add a CHECK NOT VALID first and VALIDATE later",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-backups-recovery",
    slug: "backups-and-recovery",
    title: "Backups & Recovery",
    description:
      "The 3-2-1 rule, pg_dump and mongodump automation, offsite encrypted copies, RPO/RTO and why an untested backup is just a hypothesis.",
    order: 21,
    estimatedMinutes: 20,
    tags: ["backups", "recovery", "postgresql", "disaster-recovery"],
    prerequisites: ["p3m6-production-database-setup"],
    relatedTopics: ["p3m6-database-migrations", "p3m6-production-incident-debugging", "p3m6-rollbacks"],
    learningObjectives: [
      "Define RPO and RTO and translate them into a backup schedule",
      "Automate logical dumps with cron or systemd timers and offsite upload",
      "Explain logical dumps versus physical/PITR backups and when each is needed",
      "Run a restore drill and document the procedure while nothing is broken",
    ],
    simpleExplanation:
      "Backups are copies of your data taken regularly and stored somewhere the disaster can't reach. The catch: a backup you have never restored is not a backup — it's a hope. Real backup practice means automation, encryption, offsite storage, and a scheduled drill where someone actually restores into a clean environment and verifies the data.",
    detailedContent: `
**RPO and RTO make it concrete.** RPO (recovery point objective) is how much data you can afford to lose — 15 minutes means backups (or replication) at least that frequent. RTO (recovery time objective) is how quickly service must return — it dictates dump sizes, restore tooling and whether you need a warm standby.

**The 3-2-1 rule:** three copies of the data, on two different media/storage types, with one copy offsite (object storage in another region is the modern version). Provider 'automated backups' count as one copy — if the provider account is compromised or the region dies with them, you may want your own too.

**Methods:**

- **Logical dumps** — \`pg_dump\` (per-database, portable SQL) or \`mongodump\` (BSON). Simple, restorable anywhere, but restore time grows with size (a 500GB dump can take hours to reload).
- **Physical / continuous** — base backups plus WAL archiving (Postgres) enable point-in-time recovery: restore to '3 minutes before the bad migration'. Managed providers offer this; self-hosted you wire it yourself.

**Automation.** A systemd timer or cron job runs the dump, compresses it, stamps it with a date and git SHA of the app, encrypts it (age/GPG or server-side KMS keys), and uploads to object storage with lifecycle rules (keep 7 daily, 4 weekly, 12 monthly). Monitor the job: a backup script that silently fails for three months is worse than none because it breeds false confidence.

**The drill.** Quarterly (or before every risky migration): restore the latest dump into a fresh instance, run integrity checks (\`SELECT count(*)\` on key tables, application smoke tests), and time the process against your RTO. Store the restore runbook next to the backup script.
    `,
    howItWorks: `
\`pg_dump\` connects like any client and streams a consistent logical snapshot (using an export snapshot of the transaction state) to a file — it doesn't need to stop the world, though heavy load can still affect it. Compression (\`-Fc\` custom format enables parallel restore) shrinks storage and transfer. Object storage then provides durability and lifecycle policies; many tools (pgBackRest, WAL-G, restic) add incremental and encrypted handling on top of the primitive.

For PITR, continuous archiving ships WAL segments as they're generated; recovery replays base backup + WAL to any timestamp in the retention window. The operational cost is real (storage of WAL, restore complexity), which is exactly why managed services charge for it — and why it's worth it when your RPO is minutes.
    `,
    codeExamples: [
      {
        title: "Nightly dump, encrypt, upload",
        language: "bash",
        code: `#!/usr/bin/env bash
set -euo pipefail
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT="/tmp/appdb-\${STAMP}.dump"

pg_dump --no-owner -Fc "$DATABASE_URL" -f "$OUT"
age -r "$AGE_RECIPIENT" -o "$OUT.age" "$OUT"   # encrypt before it leaves the host
aws s3 cp "$out.age" "s3://acme-backups/db/\${STAMP}.dump.age" \\
  --storage-class STANDARD_IA

rm -f "$OUT" "$OUT.age"
# Upload a small manifest with size + pg_dump version for restore planning
echo "{\\"stamp\\":\\"\${STAMP}\\",\\"bytes\\":$(stat -c%s "$out.age")}" \\
  > /tmp/manifest-\${STAMP}.json
aws s3 cp /tmp/manifest-\${STAMP}.json "s3://acme-backups/db/manifest-\${STAMP}.json"`,
        description:
          "Custom-format dump (compressed, parallel-restore capable), client-side encryption, offsite upload. Wire into a systemd timer or cron nightly.",
      },
      {
        title: "Restore drill — the part everyone skips",
        language: "bash",
        code: `# On a clean machine/instance with empty Postgres:
aws s3 cp s3://acme-backups/db/latest.dump.age .   # (or dated file)
age -d -i ~/.age/key.txt latest.dump.age -o latest.dump
pg_restore --no-owner -d appdb_restored latest.dump

psql -d appdb_restored -c 'SELECT count(*) FROM orders;'
psql -d appdb_restored -c 'SELECT max(created_at) FROM orders;'  # recency?
# Time the whole procedure — compare against your stated RTO.`,
        description:
          "A drill produces evidence: restore duration, row counts, and any missing-tooling surprises discovered on a calm day.",
      },
    ],
    commonMistakes: [
      "No restore drill: the first real restore happens during the incident, discovering missing extensions or permissions.",
      "Backups only on the same disk/VPS as the database — ransomware or disk failure takes both copies.",
      "pg_dump of one database while the app spans several (or forgets roles/tablespaces).",
      "No monitoring on backup jobs; failures go unnoticed for months.",
    ],
    bestPractices: [
      "Define RPO/RTO first, then choose dump frequency and method to meet them.",
      "Encrypt backups before upload and test decryption during every drill.",
      "Keep manifests and versions with each backup so restores are deterministic.",
    ],
    realWorldUseCases: [
      "Bad migration dropped a table at 2pm; PITR restored to 1:57pm with 3 minutes of re-worked orders.",
      "Staging refreshed weekly from encrypted production dumps (anonymized) for realistic testing.",
      "A provider outage in one region served from backups restored into a different region.",
    ],
    resources: [
      docs(
        "PostgreSQL — pg_dump",
        "https://www.postgresql.org/docs/current/app-pgdump.html",
        "Flags, formats and consistency guarantees of the logical dump tool.",
      ),
      docs(
        "PostgreSQL — continuous archiving and PITR",
        "https://www.postgresql.org/docs/current/continuous-archiving.html",
        "Base backups plus WAL for point-in-time recovery.",
      ),
      docs(
        "MongoDB — mongodump and restore",
        "https://www.mongodb.com/docs/database-tools/mongodump/",
        OFFICIAL.mongodbDocs + " — the Mongo-side tooling equivalent.",
      ),
      docs(
        "restic — backups done right",
        "https://restic.readthedocs.io/",
        "Deduplicating, encrypted backup tool popular for offsite copies.",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-restore-drill",
        title: "Restore under time pressure",
        prompt:
          "Using a staging database, (1) automate a nightly dump script with encryption and offsite upload (or local object-store emulator), (2) restore the dump into a fresh empty database, (3) time the full procedure and verify row counts match the source, (4) write the restore runbook as a numbered list anyone on the team could follow. State your RPO/RTO and whether the current setup meets them.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "pg_restore -l lists the archive contents before you restore",
          "If restore time exceeds RTO, consider parallel restore (-j) or a physical backup tool",
        ],
      },
    ],
    projectIds: ["p3-ecommerce-platform", "p3-booking-platform", "p3-analytics-api"],
  },
  {
    ...shared,
    id: "p3m6-rollbacks",
    slug: "deployment-rollbacks",
    title: "Rollbacks",
    description:
      "Rolling back application artifacts, why database changes make rollback a strategy not a button, feature flags and forward-fix discipline.",
    order: 22,
    estimatedMinutes: 17,
    tags: ["rollbacks", "deploys", "release", "risk"],
    prerequisites: ["p3m6-cicd-pipelines", "p3m6-graceful-shutdown-deploy"],
    relatedTopics: ["p3m6-database-migrations", "p3m6-github-actions", "p3m6-production-incident-debugging"],
    learningObjectives: [
      "Roll back an application deploy to a previous immutable artifact quickly",
      "Explain why schema changes often make instant rollbacks impossible or unsafe",
      "Use feature flags to decouple deploy from release",
      "Practice forward-fix as the default for broken data states",
    ],
    simpleExplanation:
      "A rollback is returning production to the last known-good version after a bad deploy. If your deploys are immutable Docker tags or platform revisions, rollback is 'run the previous tag' — often under a minute. The hard part is the database: once a new schema is live, the old code may not understand it, so true rollback sometimes means a new forward migration, not a revert.",
    detailedContent: `
**App rollback is easy when artifacts are immutable.** Every deploy records the image tag or commit SHA. Rolling back means deploying the previous SHA through the *same* pipeline — same tests, same steps — not SSHing in with yesterday's tarball. Platforms (Render, Vercel, Cloud Run revisions) keep prior revisions selectable; on a VM, the previous image tag plus your deploy script is the same mechanism. Keep at least the last 5–10 tags; garbage-collecting your only rollback target is a rite of passage.

**Database changes break the symmetry.** If deploy N adds a column and deploy N+1 drops the old one, rolling back to N leaves the app querying a column that no longer exists. This is why expand-contract exists: keep the schema compatible with both versions during the window, and rollback stays a pure app operation. When the schema is already incompatible, the correct move is usually **forward-fix** — ship N+2 that repairs the situation — rather than a risky down-migration on live data.

**Feature flags** separate *deploy* from *release*: code ships dark (flag off), then the flag flips without a deploy. Flags make rollback of *behavior* instant and safe even when the schema has moved on. They accumulate though — delete flags once fully rolled out.

**Runbook shape.** 1) Detect (alert/monitoring). 2) Declare rollback. 3) Redeploy previous SHA via pipeline. 4) Verify health/metrics. 5) Communicate. 6) Preserve the bad build for postmortem — don't overwrite the tag. 7) Fix forward with a new PR, not a hot-patch on the old branch.
    `,
    howItWorks: `
In a rolling deploy, instances are replaced gradually; a rollback is simply a second rolling deploy with the older artifact. Load balancers keep routing to whatever passes health checks, so during the rollback both versions coexist again — which is only safe if the schema supports both (expand-contract again). Blue-green deployments make rollback even more trivial: switch traffic back to the untouched green environment, though you still face the same schema-compatibility constraint.

Feature flags work at a different layer: the binary is identical, but runtime configuration gates code paths. Because flags are env/config, flipping them needs no process restart on most platforms — seconds instead of minutes.
    `,
    codeExamples: [
      {
        title: "Rollback via the same pipeline",
        language: "bash",
        code: `# What is live right now?
ssh deploy@host 'docker inspect api --format "{{.Image}}" && cat /var/www/api/RELEASE'

# Roll back to the previous known-good tag (1.4.1 was good, 1.5.0 is bad):
./deploy.sh 1.4.1

# Keep the bad tag around for forensics — do NOT retag latest onto it:
docker pull ghcr.io/acme/api:1.5.0   # still available for inspection`,
        description:
          "One-command rollback because deploys are immutable and scripted; the release file tells you where you are and where you're going.",
      },
      {
        title: "Feature flag as a rollback switch",
        language: "ts",
        code: `import { config } from "./config";

// Code ships dark; behavior is gated by config (env var or flag service)
if (config.FEATURE_NEW_CHECKOUT) {
  app.use("/checkout", newCheckoutRouter);
} else {
  app.use("/checkout", legacyCheckoutRouter);
}

// Incident: FEATURE_NEW_CHECKOUT=false in the platform env → instant revert
// of user-facing behavior with zero deploys and zero schema concerns.`,
        description:
          "Flags turn 'rollback' into a config change when the risk is behavioral, not structural.",
      },
    ],
    commonMistakes: [
      "Only ever practicing the forward path: the first rollback happens during an incident with rusty fingers.",
      "Rolling back the app across an incompatible schema change and causing a second outage.",
      "Overwriting the bad tag with the fixed build, destroying forensic evidence.",
      "Feature flags that live for years, turning the codebase into a maze of half-disabled paths.",
    ],
    bestPractices: [
      "Record the SHA/tag of every deploy; make rollback a one-command pipeline action.",
      "Design migrations so any two adjacent app versions are schema-compatible.",
      "Prefer flags for risky behavior changes; schedule flag cleanup explicitly.",
    ],
    realWorldUseCases: [
      "A memory leak in v1.4.0 detected 10 minutes after deploy; rolling back to v1.3.9 took 45 seconds via the platform UI.",
      "A pricing bug neutralized with a feature flag while the proper fix went through review for two days.",
      "A migration that could not be rolled back safely — team chose forward-fix with a corrective migration instead of a down-migration.",
    ],
    resources: [
      docs(
        "GitHub Actions — workflow re-run and previous artifacts",
        OFFICIAL.githubActionsDocs,
        "Re-running a deploy job for a prior SHA is the pipeline-native rollback.",
      ),
      docs(
        "Google Cloud Run — traffic revision management",
        "https://cloud.google.com/run/docs/traffic-revisions",
        "How managed container platforms make rolling back a revision switch.",
      ),
      docs(
        "Feature toggles (Fowler)",
        "https://martinfowler.com/articles/feature-toggles.html",
        "Patterns and hygiene rules for flags used as release controls.",
      ),
      ytSearch(
        "deployment rollback strategies blue green canary",
        "Talks on rollback mechanics and release engineering practice.",
        "en",
        "15–40 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-rollback-drill",
        title: "Rollback rehearsal",
        prompt:
          "Deploy a known-good version, then a deliberately broken one (e.g., a route that always returns 500 or elevated memory). Time your rollback using your real tooling (platform UI, deploy script, or pipeline). Verify metrics return to baseline. Write the rollback runbook steps you followed, including the communication message you'd send to stakeholders.",
        difficulty: "advanced",
        estimatedMinutes: 25,
        hints: [
          "Do this on staging first; production rehearsals are fine too if traffic tolerates it",
          "Note how the deploy script surfaces the currently live tag — that line goes in the runbook",
        ],
        solution: `./deploy.sh 1.5.0          # broken
# dashboards red; announce rollback
./deploy.sh 1.4.9          # previous good tag, same pipeline
curl -fsS https://staging.example.com/healthz
# runbook: 1) declare rollback 2) ./deploy.sh <prev> 3) verify /healthz + error rate
# 4) keep 1.5.0 tag for postmortem 5) fix forward in a new PR`,
        solutionLanguage: "bash",
      },
    ],
    projectIds: ["p3-capstone", "p3-ecommerce-platform", "p3-job-processing"],
  },
  {
    ...shared,
    id: "p3m6-production-incident-debugging",
    slug: "production-incident-debugging",
    title: "Production Incident Debugging",
    description:
      "A calm triage method for outages: confirm impact, check recent deploys, read logs and metrics, common-cause checklists, and blameless postmortems.",
    order: 23,
    estimatedMinutes: 24,
    tags: ["incidents", "debugging", "on-call", "postmortem"],
    prerequisites: ["p3m6-logging-production", "p3m6-metrics-monitoring", "p3m5-failure-handling"],
    relatedTopics: ["p3m6-rollbacks", "p3m6-health-checks", "p3m6-backups-recovery"],
    learningObjectives: [
      "Run a structured triage: impact, timeline, recent changes, then hypotheses",
      "Use a common-causes checklist (disk, OOM, cert expiry, DNS, DB connections)",
      "Apply safe debugging commands on a live server without making things worse",
      "Write a blameless postmortem with actionable follow-ups",
    ],
    simpleExplanation:
      "When production breaks, the goal is restoration first and root-cause second. A good responder follows a checklist: how bad is it, what changed recently, which layer is failing (app, DB, network, host), then applies the safest fix — often a rollback. Afterwards, a blameless write-up turns the pain into improvements so the same incident doesn't recur.",
    detailedContent: `
**Triage order (time-box each step):**

1. **Impact.** Which users, how many, which errors? Check uptime probes, error rate dashboards, support channels. Severity drives pace, not panic.
2. **What changed?** Recent deploys (pipeline history), config/flag changes, DNS edits, certificate expiries, traffic spikes, dependency incidents (cloud status page, Stripe status). 'What changed' answers a surprisingly large fraction of incidents.
3. **Which layer?** Host (CPU/disk/memory/load), container (restarts, OOM kills), process (listeners, logs), database (connections, locks, replication lag), network/DNS/TLS, third parties.
4. **Mitigate.** Roll back the deploy, fail over, disable the flag, scale up, or shed load. Fix-forward only when rollback is unsafe (usually schema-related).
5. **Diagnose deeper** with the system under stabilization.

**Checklist of classics:** disk full (\`df -h\`), OOM kill loop (\`dmesg | grep -i oom\`, container exit codes), TLS cert expired (\`openssl s_client\`), DNS broken (\`dig\`), DB connection exhaustion (pool + \`max_connections\`), rate limiter or WAF blocking legit traffic, dependency timeout cascade, memory leak after deploy (RSS trend), clock skew, exhausted file descriptors.

**Safe debugging on live systems:** prefer read-only commands (\`journalctl\`, \`ss\`, \`curl -v\`, \`docker logs\`, \`EXPLAIN ANALYZE\` only with care), change one thing at a time, announce actions in the incident channel, and write down timestamps — your future self is writing the postmortem.

**Postmortems are blameless.** Focus on conditions and system design, not individuals. Include timeline, impact metrics, root cause, what went well/badly in the response, and assigned follow-ups with dates. A postmortem without action items is a story, not an improvement.
    `,
    howItWorks: `
Modern incidents are usually visible first in *symptoms* (error rate, 5xx, latency) and only later in *causes*. Metrics tell you the shape of the pain (all routes vs one route; gradual vs cliff), logs give the first failing component's own words, and traces (if instrumented) show which downstream hop blew the budget. Correlating the three against the deploy timeline is the fastest path from 'the site is down' to 'v1.5.0's new DB query saturated the pool'.

Command-line tools extend your senses: \`ss -tlnp\` shows whether the process still listens; \`curl -v\` exposes TLS and header-level failures; \`docker ps\` reveals restart counts; \`journalctl -u api --since "10 minutes ago"\` frames the window; \`top\`/\`free -h\`/\`df -h\` rule out the host in seconds.
    `,
    codeExamples: [
      {
        title: "First five minutes on a broken box",
        language: "bash",
        code: `uptime                 # load spike?
df -h                  # disk full? (journald, logs, docker overlay)
free -h                # memory pressure?
ss -tlnp | grep :3000  # is the app even listening?
docker ps              # restarting? (STATUS column shows "Up 2 seconds")
docker logs --tail 100 api
journalctl -u api -n 50 --no-pager --since "10 min ago"
curl -vk https://api.example.com/healthz   # cert + TLS visibility
dig +short api.example.com                 # DNS still correct?`,
        description:
          "Read-only, fast, and ordered from host to app; each line eliminates a layer before you touch anything.",
      },
      {
        title: "Correlating errors with deploys",
        language: "bash",
        code: `# What did we ship recently?
git log --oneline -10
# On the server: which tag is live?
docker inspect api --format '{{.Config.Image}}'
cat /var/www/api/RELEASE 2>/dev/null

# In logs: first error timestamp vs deploy time
journalctl -u api --since "2 hours ago" | grep -m 5 '"level":"error"'`,
        description:
          "Most outages follow a change; matching the first error timestamp to a deploy time is the highest-value correlation you can make.",
      },
    ],
    commonMistakes: [
      "Root-causing while users are still bleeding — mitigate first (rollback!), diagnose second.",
      "Changing five things at once, so nothing is proven and rollback becomes guesswork.",
      "Debugging with write-heavy or blocking commands on an already-saturated database.",
      "Writing blameful postmortems that name people instead of fixing the system that let the failure happen.",
    ],
    bestPractices: [
      "Keep a short runbook per service: dashboards link, rollback command, key logs, on-call notes.",
      "Declare severity and roles early in an incident channel (comms, ops, scribe).",
      "Every postmortem ends with assigned, dated actions — and a review of whether last month's actions worked.",
    ],
    realWorldUseCases: [
      "Friday deploy caused connection-pool exhaustion; rollback in 3 minutes, postmortem added pool saturation to the dashboard.",
      "Expiry of a TLS cert discovered by uptime monitoring at 3am; the fix was an expiry alert plus a renewal dry-run in CI.",
      "Cascading third-party timeout turned into a resilience improvement: timeouts, circuit breakers and bulkheads (see failure-handling module).",
    ],
    resources: [
      docs(
        "Google SRE — Introduction to Monitoring",
        "https://sre.google/sre-book/monitoring-distributed-systems/",
        "Symptoms vs causes, and how alerting should map to user pain.",
      ),
      docs(
        "Incident response guides (Microsoft)",
        "https://learn.microsoft.com/en-us/azure/waf/guide/incident-response-guidance",
        "Structured incident lifecycle usable by any stack.",
      ),
      docs(
        "PostHog — engineering incident management guide",
        "https://posthog.com/handbook/engineering/incident-management",
        "Practical, example-heavy process docs from a real product team.",
      ),
      ytSearch(
        "production debugging Node.js outage triage",
        "Conference talks walking through real incident timelines.",
        "en",
        "20–45 min",
      ),
    ],
    exercises: [
      {
        id: "ex-p3m6-incident-sim",
        title: "Break it on purpose",
        prompt:
          "In staging, create three failure scenarios and practice triage on each with a timer: (1) fill the disk with a big log file, (2) make /readyz fail by stopping the DB, (3) deploy a version that leaks memory or 500s a critical route. For each: document your detection signal, the commands you ran, the mitigation, and the time-to-recovery. Turn the notes into a one-page runbook.",
        difficulty: "advanced",
        estimatedMinutes: 30,
        hints: [
          "dd if=/dev/zero of=/var/tmp/fill bs=1M count=2000 simulates disk fill (delete it afterwards!)",
          "Practice the rollback path, not just the detection path",
        ],
      },
      {
        id: "ex-p3m6-postmortem",
        title: "Blameless write-up",
        prompt:
          "Take one of the scenarios above (or a real minor incident) and write a blameless postmortem: impact in user terms, timeline with timestamps, root cause chain, what went well and poorly in the response, and three assigned follow-up actions with owners and due dates.",
        difficulty: "advanced",
        estimatedMinutes: 20,
        hints: [
          "Describe conditions and decisions, not personalities",
          "Follow-ups should be verifiable: 'add alert X', 'make deploy script Y do Z'",
        ],
      },
    ],
    projectIds: ["p3-capstone", "p3-analytics-api", "p3-ecommerce-platform"],
  },
];

export const quiz: Quiz = {
  id: "quiz-p3-m6",
  title: "DevOps & Deployment — Quiz",
  description:
    "Dockerfiles, Compose, GitHub Actions, Nginx, TLS, databases, process management, migrations, backups, rollbacks and incident response.",
  moduleId: "p3-m6",
  questions: [
    {
      id: "p3m6-q1",
      type: "multiple-choice",
      prompt:
        "A Dockerfile must install dependencies and copy application code for a Node.js API. Which instruction order best exploits Docker's layer cache?",
      options: [
        "COPY src, then COPY package.json, then RUN npm ci",
        "COPY package.json and package-lock.json, then RUN npm ci, then COPY src",
        "RUN npm ci && COPY . (single instruction)",
        "COPY node_modules, then COPY package.json, then RUN npm ci",
      ],
      correctIndex: 1,
      explanation:
        "Layers are cached keyed on the instruction and the files it consumes. Putting package files before npm ci means the expensive dependency layer only rebuilds when those files change; source edits then reuse the cached install.",
      optionExplanations: [
        "Copying source first busts the dependency layer on every code change.",
        "Correct: dependency-install layer is stable across source edits and only reruns when the lockfile changes.",
        "A single merged instruction means any file change reruns the whole install.",
        "Copying host node_modules is fragile (platform mismatch) and defeats reproducible installs; npm ci should create them in the image.",
      ],
    },
    {
      id: "p3m6-q2",
      type: "code-output",
      prompt:
        "A GitHub Actions workflow is triggered on push to main. Two pushes land within a minute of each other. What behavior does the following workflow exhibit for the docker job?",
      code: `on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-main
      cancel-in-progress: true
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:\${{ github.sha }} .
      - run: sleep 300 && docker push app:\${{ github.sha }}`,
      language: "yaml",
      options: [
        "Both runs complete sequentially; the second waits for the first",
        "The first run is cancelled once the second run starts in the same concurrency group",
        "GitHub rejects the second push as a duplicate",
        "The two runs share one runner and interleave their steps",
      ],
      correctIndex: 1,
      explanation:
        "With concurrency.group set and cancel-in-progress: true, starting a newer run in the same group cancels the already-running one. Only the latest push's build/push proceeds — intentional for deploy jobs, dangerous if the cancelled run was doing something you needed.",
      optionExplanations: [
        "That would be cancel-in-progress: false (queueing), not what's configured.",
        "Correct: same group + cancel-in-progress means the in-flight run is cancelled.",
        "Actions does not deduplicate git pushes; each push schedules its own run.",
        "Runners are isolated per job; steps never interleave across runs.",
      ],
    },
    {
      id: "p3m6-q3",
      type: "find-bug",
      prompt:
        "A team reports that every deploy rebuilds all npm dependencies from scratch, adding 4+ minutes to CI, even for one-line source changes. Identify the bug in this Dockerfile.",
      code: `FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
CMD ["node", "dist/server.js"]`,
      language: "dockerfile",
      options: [
        "npm ci should be npm install",
        "COPY . . before npm ci invalidates the dependency layer whenever any file changes, including source",
        "The CMD should use the shell form",
        "node:22-slim does not include npm",
      ],
      correctIndex: 1,
      explanation:
        "COPY . . copies everything first, so its layer hash changes on every source edit. The following npm ci layer is keyed on that hash, so the cache never hits. Copying only package.json and the lockfile before npm ci fixes it.",
      optionExplanations: [
        "npm install without a lockfile is less reproducible; the problem here is layer ordering, not the command.",
        "Correct diagnosis: whole-context copy busts the subsequent dependency layer.",
        "Shell form would actually make signal handling worse; it's unrelated to cache.",
        "Slim images do include npm; they only strip docs and other OS cruft.",
      ],
    },
    {
      id: "p3m6-q4",
      type: "multiple-choice",
      prompt:
        "During a rolling deploy, an instance's database is briefly unavailable. Which endpoint behavior is correct?",
      options: [
        "Liveness (/healthz) returns 503 so the platform restarts the instance",
        "Readiness (/readyz) returns 503 so the LB stops routing to it, while liveness stays 200",
        "Both endpoints return 503",
        "Both endpoints keep returning 200 because the process is alive",
      ],
      correctIndex: 1,
      explanation:
        "Readiness reflects ability to serve traffic; failing it drains the instance without restarting. Liveness should stay green — restarting every instance because a shared database blipped would cause a restart storm and make the incident worse.",
      optionExplanations: [
        "Liveness failure triggers restarts; a shared DB blip would thrash the whole fleet.",
        "Correct: readiness fails (drain), liveness passes (no restart).",
        "Failing liveness turns a dependency problem into mass restarts.",
        "Lying readiness keeps sending traffic to an instance that will 503 anyway.",
      ],
    },
    {
      id: "p3m6-q5",
      type: "code-output",
      prompt:
        "In a Docker Compose stack with services api and db, the API's env is DATABASE_URL=postgres://app:app@db:5432/app and no ports are published for db. From the HOST machine, what happens when you run `nc -zv localhost 5432`?",
      code: `services:
  api:
    build: .
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
  db:
    image: postgres:16`,
      language: "yaml",
      options: [
        "Connection succeeds; Compose publishes db ports by default",
        "Connection fails (refused/unreachable), because db only listens on the internal Compose network; the API reaches it via the service name db",
        "Connection succeeds, but only from containers on the default bridge network",
        "nc cannot test TCP ports",
      ],
      correctIndex: 1,
      explanation:
        "Without a ports: mapping, the db container is reachable only by other containers on the Compose network, where its hostname is the service name 'db'. The host has no forward into that container, so localhost:5432 on the host fails.",
      optionExplanations: [
        "Compose publishes nothing unless the file explicitly declares ports:.",
        "Correct: internal-only service; host test must fail.",
        "Default bridge is a different network; the point stands — the host still has no mapping.",
        "nc -z performs a TCP connect test; it works fine for this.",
      ],
    },
    {
      id: "p3m6-q6",
      type: "find-bug",
      prompt:
        "Users report brief failures during every deploy. Identify the bug in this shutdown handler.",
      code: `process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  process.exit(0);
});`,
      language: "ts",
      options: [
        "SIGTERM should be logged with console.error",
        "process.exit(0) runs immediately, killing the process before in-flight requests finish and before readiness can drain",
        "The handler should call server.close() only, with no exit",
        "Node does not support SIGTERM handlers",
      ],
      correctIndex: 1,
      explanation:
        "Exiting synchronously in the handler is just a polite-looking SIGKILL: open requests are cut, and the load balancer never gets a drain window. The fix is to fail readiness, close the server and pools, then exit — with a safety-net timeout.",
      optionExplanations: [
        "Log level is irrelevant to the bug.",
        "Correct: immediate process.exit defeats graceful shutdown entirely.",
        "Only closing the server without any exit path risks hanging past the platform's kill deadline — the real fix combines close, drain, and a bounded exit.",
        "Node absolutely supports SIGTERM handlers; that's how process managers stop apps.",
      ],
    },
    {
      id: "p3m6-q7",
      type: "multiple-choice",
      prompt:
        "Your deploy pipeline performs rolling updates: old and new app versions run side by side for a few minutes. A migration renames column users.email to users.email_address and drops the old column in the same release. What is the safest practice?",
      options: [
        "Run the migration on one instance only, so locks are limited",
        "Use expand-contract: add the new column, dual-read/write or backfill, drop the old column only after no old code remains",
        "Disable rolling updates and accept longer downtime instead",
        "Add a transaction around the migration so it can be rolled back",
      ],
      correctIndex: 1,
      explanation:
        "During the overlap window old code still queries users.email. Drop it and old instances fail. Expand-contract keeps the schema compatible with both versions: add the new column first, move data, switch code, and contract only in a later deploy.",
      optionExplanations: [
        "Locks aren't the only issue — even lock-free, old code breaks against a dropped column.",
        "Correct: parallel-change keeps adjacent versions schema-compatible.",
        "Downtime is a different trade-off; it doesn't fix incompatible schema for rolling redeploys later.",
        "Transactions rollback the migration itself, but you cannot transactionally undo the traffic that already failed against the new schema.",
      ],
    },
    {
      id: "p3m6-q8",
      type: "short-answer",
      prompt:
        "Your team's stated RPO is 15 minutes for the production database. What does that imply about the backup (or replication) setup, and what should you verify regularly?",
      acceptedKeywords: [
        "15 minutes",
        "fifteen minutes",
        "data loss",
        "backup",
        "frequency",
        "interval",
        "every 15",
        "recovery point",
        "pitr",
        "wal",
        "replication",
        "restore",
        "drill",
      ],
      explanation:
        "RPO = acceptable data loss. A 15-minute RPO means the newest usable recovery point is at most 15 minutes old: backups must run at least every 15 minutes (or continuous WAL/replication must cover that window). Regularly you should verify backup jobs actually succeed and that a restore into a clean environment recovers data within that window — an untested backup may not meet the stated RPO at all.",
    },
  ],
};
