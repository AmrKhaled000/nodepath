import type { Lesson, Quiz } from "@/types";
import { OFFICIAL, docs, lessonResources, ytSearch } from "../helpers/resources";

export const meta = {
  id: "p1-m1",
  slug: "web-backend-fundamentals",
  title: "Web Development & Backend Fundamentals",
  description:
    "How the web actually works before you write any code: clients, servers, DNS, IP addresses, HTTP/HTTPS, requests, responses, methods, status codes, headers, JSON, REST, cookies and sessions.",
  phaseId: "phase-1",
  order: 1,
};

const shared = {
  phaseId: "phase-1",
  moduleId: "p1-m1",
  difficulty: "beginner",
} as const;

export const lessons: Lesson[] = [
  {
    ...shared,
    id: "p1m1-how-internet-works",
    slug: "how-the-internet-works",
    title: "How the Internet Works",
    description:
      "The global network of networks, packets, routers, ISPs and the journey of a single request across the Internet.",
    order: 1,
    estimatedMinutes: 18,
    tags: ["internet", "networking", "fundamentals"],
    prerequisites: [],
    relatedTopics: ["p1m1-clients-servers", "p1m1-dns", "p1m1-http"],
    learningObjectives: [
      "Describe the Internet as a network of networks rather than a single cloud",
      "Explain what packets are and how routers forward them",
      "Trace the high-level path of a request from your laptop to a server and back",
    ],
    simpleExplanation:
      "The Internet is just a worldwide set of computers (routers) agreed to carry small chunks of data called packets between each other using shared rules (protocols). When you visit a website, your device breaks the request into packets, hands them to your router, and they hop from network to network until they reach the machine hosting the site — which sends packets back that your browser reassembles into the page.",
    detailedContent: `
The Internet is not a place or a mystical “cloud”. It is a **global network of networks**: your home Wi-Fi is a small network, your Internet Service Provider (ISP) runs a bigger one, and big carriers interconnect those networks through agreements called **peering**.

Data travels in **packets** — small chunks (typically up to ~1,500 bytes on Ethernet) with a header carrying source and destination addresses plus a sequence number. Routers read the destination address of each packet and forward it one *hop* closer to the target using routing tables computed by protocols like BGP.

Key ideas to internalise:

- **Latency vs bandwidth.** Latency is the round-trip time of one packet (measured in milliseconds); bandwidth is how much data fits per second. A satellite connection can have huge bandwidth and terrible latency.
- **Hops and routing.** A packet may cross 10–20 routers. Each hop adds a little delay.
- **TCP and reliability.** The Internet itself only promises best-effort delivery. TCP (Transmission Control Protocol) adds ordering, retransmission of lost packets and congestion control on top of it.
- **Protocols stack.** Conceptually: physical cable/radio → IP (addressing & routing) → TCP/UDP (ports & reliability) → application protocol such as HTTP.

Every backend feature you will ever build — an API call, a database query over the network, a webhook — is ultimately packets moving through this machinery.
    `,
    howItWorks: `
A request to \`https://example.com/api/users\` takes this path:

1. Your browser asks a DNS resolver for the IP of \`example.com\` (usually the resolver run by your ISP or a public one like 1.1.1.1).
2. It opens a TCP connection to that IP on port 443 and performs a TLS handshake to encrypt the channel.
3. It sends an HTTP request packet stream: “GET /api/users HTTP/1.1 …”.
4. Routers forward packets hop-by-hop; the server’s kernel reassembles them and hands the stream to the Node.js HTTP server.
5. Your server writes a response; packets flow back the same way, TCP acknowledges each one, and the browser renders the result.

Packets can take **different routes** on the way back — the Internet does not guarantee a symmetric path.
    `,
    codeExamples: [
      {
        title: "See the path packets take to a server",
        language: "bash",
        code: "# Windows (PowerShell) — shows each router hop and round-trip time\ntracert nodejs.org\n\n# macOS / Linux\ntraceroute nodejs.org\n\n# Also useful: check that DNS resolves\nnslookup nodejs.org",
        description:
          "Run this in your terminal. Each numbered line is a router (hop) between you and nodejs.org, with the time three test packets took.",
      },
    ],
    commonMistakes: [
      "Assuming the Internet has a single central server — content is spread across data centres worldwide, often with CDNs close to users.",
      "Confusing bandwidth with speed: a slow page can still be on a high-bandwidth link if latency or server processing is the bottleneck.",
      "Ignoring that everything is plaintext unless TLS is used — which is exactly why HTTPS exists.",
    ],
    bestPractices: [
      "When debugging “the API is slow”, measure latency and payload size separately — they have different causes and fixes.",
      "Prefer HTTP/2 or HTTP/3-capable clients in production; fewer round-trips matters as much as raw bandwidth.",
      "Learn to read traceroute output — it instantly distinguishes ‘my network is broken’ from ‘the server is down’.",
    ],
    realWorldUseCases: [
      "Diagnosing user complaints in different countries: a CDN or edge deployment reduces packet round-trips.",
      "Choosing between polling and WebSockets later: each extra round-trip multiplies your latency cost.",
    ],
    resources: lessonResources({
      official: {
        title: "Cloudflare Learning Center — What is the Internet?",
        url: "https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/",
        description: "Clear, illustrated explanation of networks, packets, routers and the Internet.",
      },
      videos: [
        {
          query: "how the internet works in 5 minutes",
          description: "Short visual introductions to packets, routers and ISPs.",
          estimatedDuration: "5–10 min",
        },
      ],
      article: {
        title: "MDN — How the Web works",
        url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works",
        provider: "developer.mozilla.org",
        description: "Mozilla's primer on clients, servers and the request/response cycle.",
        estimatedDuration: "8 min",
      },
    }),
    exercises: [
      {
        id: "ex-p1m1-tracert",
        title: "Trace the route",
        prompt:
          "Run a traceroute to three different sites (for example nodejs.org, github.com and cloudflare.com). Write down: the number of hops, the smallest round-trip time, and whether any hop timed out. Explain in two sentences why hop counts differ.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Windows: tracert, macOS/Linux: traceroute", "Some hops hide their hostname — that is normal (they return * * *)"],
      },
    ],
    projectIds: [],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-clients-servers",
    slug: "clients-and-servers",
    title: "Clients and Servers",
    description:
      "The two roles in every web interaction: who asks, who answers, and why backend code lives on the server.",
    order: 2,
    estimatedMinutes: 12,
    tags: ["client", "server", "architecture"],
    prerequisites: ["p1m1-how-internet-works"],
    relatedTopics: ["p1m1-frontend-backend", "p1m1-http", "p1m1-browsers-servers"],
    learningObjectives: [
      "Define client and server and give examples of each",
      "Explain why the same machine can act as both",
      "Recognise which side of an interaction your Node.js code sits on",
    ],
    simpleExplanation:
      "A **client** is any program that asks for something (a browser, a mobile app, a curl command). A **server** is any program that listens and answers (your Node.js API). Your laptop is a client when it requests Google, but a server when your own app accepts a connection.",
    detailedContent: `
The client–server model separates **who initiates** from **who responds**:

- The **client** starts the conversation: it resolves a name, opens a connection and sends a request.
- The **server** waits passively on a known address and port for connections, then replies to each request.

Important nuances:

- **Roles, not machines.** A single machine can host clients and servers simultaneously. Your phone runs a browser (client) and also hosts a server when you enable Hotspot or use AirDrop.
- **Many clients, one server.** A production API serves thousands of concurrent clients — which is why backend code must be non-blocking and stateless wherever possible.
- **Server-to-server clients.** When your Node.js app calls Stripe or a database, *it* is the client of that request. In Phase 2 your API will be a client of MongoDB dozens of times per second.
- **Servers never call you first** (with exceptions like WebSockets and server push): this request/response shape is what makes HTTP simple to reason about.
    `,
    howItWorks: `
A server is fundamentally a loop:

1. Bind a socket to an IP + port (\`0.0.0.0:3000\` means “all interfaces, port 3000”).
2. Accept the next incoming connection (this *blocks*/waits until someone knocks).
3. Read the request bytes, parse them into a structured request object.
4. Run your handler logic — maybe query a database.
5. Write response bytes back and close or reuse the connection.
6. Loop back to step 2.

Node.js hides steps 2–3 behind the \`http\` module (and Express hides them even further), but this loop is exactly what runs underneath.
    `,
    codeExamples: [
      {
        title: "Client and server in the same program",
        language: "js",
        code: `import http from "node:http";

// 1) The SERVER: listens and answers
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ message: "hello from the server", path: req.url }));
});

server.listen(3000, () => {
  // 2) The CLIENT: the same process now asks the server a question
  http.get("http://127.0.0.1:3000/ping", (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("client received:", body); // {"message":"hello from the server","path":"/ping"}
      server.close();
    });
  });
});`,
        description:
          "Proof that client and server are roles, not machines: this single file plays both. Run it with `node server.js`.",
      },
    ],
    commonMistakes: [
      "Assuming a server is a special expensive machine — a laptop can run production-grade Node.js servers.",
      "Doing heavy work in the request handler without thinking: one slow request blocks every other client on that process.",
      "Confusing ‘server’ with ‘backend’: backend also includes databases, queues and third-party services.",
    ],
    bestPractices: [
      "Design APIs so clients never need to know how many servers exist behind the scenes (load balancers hide this).",
      "Return errors as structured responses instead of crashing — one bad request must not kill the process for other clients.",
      "Log with a request id so you can follow one client's journey through many server-side events.",
    ],
    realWorldUseCases: [
      "A mobile app, a web app and a partner integration all act as different clients of the same REST API.",
      "Microservices call each other over HTTP or message queues — each call has a client side and a server side.",
    ],
    resources: lessonResources({
      official: {
        title: "Node.js Guide — Introduction to Node.js",
        url: OFFICIAL.nodejsLearn,
        description: "Official explanation of what Node.js is and the environment it runs in.",
      },
      videos: [
        {
          query: "client server architecture explained for beginners",
          description: "Visual introductions to the client/server model.",
          estimatedDuration: "6–12 min",
        },
      ],
    }),
    exercises: [
      {
        id: "ex-p1m1-roles",
        title: "Spot the roles",
        prompt:
          "List five programs you used today. For each, state whether it acted as a client, a server, or both — and name what it requested or served.",
        difficulty: "beginner",
        estimatedMinutes: 10,
        hints: ["Your browser is a client of web servers; your OS update agent is a client of update servers."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-dns",
    slug: "dns-and-domain-names",
    title: "DNS and Domain Names",
    description: "How human-readable names like example.com become IP addresses machines can route to.",
    order: 3,
    estimatedMinutes: 16,
    tags: ["dns", "domains", "networking"],
    prerequisites: ["p1m1-how-internet-works"],
    relatedTopics: ["p1m1-ip-ports", "p1m1-http"],
    learningObjectives: [
      "Explain the DNS resolution chain: stub resolver → recursive resolver → root/TLD/authoritative servers",
      "Read common record types (A, AAAA, CNAME, TXT, MX) and know what each does",
      "Use nslookup/dig to inspect records for any domain",
    ],
    simpleExplanation:
      "DNS is the Internet's phone book. Browsers only understand numbers (IP addresses), but humans want names. When you type `example.com`, resolvers ask a chain of DNS servers ‘what is the IP for this name?’ and hand the answer back so your device can connect.",
    detailedContent: `
Domain names are hierarchical, right to left: \`shop.example.co.uk\` is managed by \`uk\` → \`co\` → \`example\` → \`shop\`. Each level can delegate to different name servers.

**Resolution flow** for \`api.example.com\`:

1. Your device checks its own cache (and the \`hosts\` file).
2. It asks the **recursive resolver** (usually run by your ISP, or 1.1.1.1 / 8.8.8.8).
3. The resolver, if it has no cached answer, asks a **root server**, then the **.com TLD server**, then the **authoritative nameserver** for \`example.com\`.
4. The authoritative server returns the answer (an \`A\` record like \`93.184.216.34\`).
5. Every answer comes with a **TTL** (time to live) in seconds — resolvers cache it for that long.

Record types you will meet as a backend developer:

| Record | Purpose |
| --- | --- |
| A | Maps a name to an IPv4 address |
| AAAA | Maps a name to an IPv6 address |
| CNAME | Alias pointing to another name |
| TXT | Arbitrary text (SPF, domain verification, ACME challenges) |
| MX | Mail servers for the domain |
| NS | Delegates the domain to a nameserver |

DNS is also how services discover each other inside Docker and Kubernetes (every container name becomes a resolvable hostname).
    `,
    howItWorks: `
DNS uses UDP port 53 for queries (TCP for large responses). A lookup returns more than an IP: the response contains the record type, the TTL, and sometimes additional records (such as the nameservers of a parent domain).

When you “point a domain at your server”, you are simply creating an \`A\` (or \`AAAA\`) record that maps your hostname to the public IP where your Node.js process will be reachable. A \`CNAME\` such as \`www.example.com → example.com\` lets one address serve both names.
    `,
    codeExamples: [
      {
        title: "Inspect DNS records from the terminal",
        language: "bash",
        code: `# Windows PowerShell
Resolve-DnsName nodejs.org -Type A
Resolve-DnsName example.com -Type MX

# macOS / Linux
dig A nodejs.org +short
dig MX example.com
dig TXT example.com`,
        description:
          "Every DNS answer includes a TTL. Short TTLs (60s) let you switch servers fast; long TTLs (3600s+) reduce load but slow down changes.",
      },
    ],
    commonMistakes: [
      "Deploying a new server and immediately testing the domain: cached DNS answers (old TTL) can route you to the previous IP for hours.",
      "Forgetting the trailing dot when scripting DNS: the root domain is `example.com.` — tools treat `example.com` as relative in some contexts.",
      "Believing DNS is required for every request — clients can connect to a raw IP address directly (http://127.0.0.1:3000 needs no DNS).",
    ],
    bestPractices: [
      "Use a managed DNS provider with an API so environments can be scripted.",
      "Keep TTLs low (60–300s) around planned migrations, then raise them again.",
      "When debugging ‘site not updating’, check DNS first: `nslookup yourdomain.com` shows which IP the world currently sees.",
    ],
    realWorldUseCases: [
      "Blue/green deployments switch a DNS record (or load balancer target) to move traffic between versions.",
      "Docker Compose service names (`db`, `api`) resolve through embedded DNS to container IPs.",
    ],
    resources: [
      docs("Cloudflare Learning Center — What is DNS?", "https://www.cloudflare.com/learning/dns/what-is-dns/", "Detailed, beginner-friendly DNS explainer with diagrams."),
      ytSearch("DNS explained 5 minutes", "Short visual explanations of DNS resolution.", "en", "5–10 min"),
      docs("MDN — What is a domain name?", "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name", "MDN's domain name overview."),
    ],
    exercises: [
      {
        id: "ex-p1m1-dns-lookup",
        title: "Map a domain",
        prompt:
          "Look up A, AAAA, CNAME, MX and TXT records for three domains you use daily. Record the TTL of each answer and explain in one sentence why an MX record exists but your browser never requests it.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["dig ANY is unreliable on many public resolvers — query each type separately."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-ip-ports",
    slug: "ip-addresses-and-ports",
    title: "IP Addresses and Ports",
    description:
      "Addresses identify machines; ports identify programs. Together they define exactly where data is delivered.",
    order: 4,
    estimatedMinutes: 15,
    tags: ["ip", "ports", "networking"],
    prerequisites: ["p1m1-how-internet-works", "p1m1-dns"],
    relatedTopics: ["p1m1-http", "p1m1-clients-servers"],
    learningObjectives: [
      "Distinguish IPv4 and IPv6 addressing and recognise private ranges",
      "Explain what a port is and why one IP can host many services",
      "Bind and reach a Node.js server on localhost during development",
    ],
    simpleExplanation:
      "An **IP address** is the street address of a machine on a network. A **port** is the apartment number — it picks *which program* on that machine should receive the data. `127.0.0.1:3000` means ‘this computer, program listening on port 3000’.",
    detailedContent: `
**IPv4** addresses are 32-bit numbers written as four octets (\`192.168.1.20\`). That allows only ~4.3 billion addresses, so **IPv6** (128-bit, written \`2001:db8::1\`) was introduced. Both work identically from Node.js's point of view.

**Private address ranges** (never routed on the public Internet):

- \`10.0.0.0/8\` — e.g. 10.0.0.5
- \`172.16.0.0/12\` — e.g. 172.17.0.2 (Docker's default bridge range)
- \`192.168.0.0/16\` — e.g. 192.168.1.10 (your home router)
- \`127.0.0.0/8\` — loopback; \`127.0.0.1\` means “this machine only”, never reachable from outside
- \`0.0.0.0\` — “listen on every network interface” (used by servers, not as an address to dial)

**Ports** are 16-bit numbers (0–65535). Below 1024 are **privileged** (80 HTTP, 443 HTTPS, 22 SSH, 53 DNS) and need admin rights on most OSes. Everything above 1024 is free for you — which is why \`3000\`, \`5173\` and \`8080\` are the famous dev ports.

One IP + one port + one protocol (TCP/UDP) = one **socket**. A server binds a socket; many clients connect *to* that same socket from their own ephemeral ports (randomly chosen, usually 49152–65535).
    `,
    howItWorks: `
When your Node.js app calls \`server.listen(3000)\`:

1. The process asks the OS: “bind TCP port 3000 on 0.0.0.0”.
2. The OS marks that port as owned by your PID and starts queuing incoming connections.
3. A browser on another machine sends a SYN packet to \`<your-public-ip>:3000\` → the OS accepts it and hands the socket to your process via \`server.on('connection')\`.
4. If the port is already taken, you get \`EADDRINUSE\` — the most common beginner server error.

In development you connect to \`127.0.0.1\` (loopback). In production, a reverse proxy on port 80/443 forwards traffic to your Node.js process on a high port like 3000 inside a private network.
    `,
    codeExamples: [
      {
        title: "Bind explicitly and inspect what is listening",
        language: "js",
        code: `import http from "node:http";
import os from "node:os";

// 0.0.0.0 => reachable from other machines on your network
// 127.0.0.1 => only reachable from this machine (safer for dev)
const server = http.createServer((req, res) => res.end("ok"));

server.listen(3000, "127.0.0.1", () => {
  console.log("listening on http://127.0.0.1:3000");
  console.log("your network interfaces:", os.networkInterfaces());
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") console.error("Port 3000 is already in use!");
});`,
        description:
          "Always handle EADDRINUSE: it is the ‘port already taken’ error you will see constantly during development.",
      },
      {
        title: "See which process owns a port (Windows)",
        language: "bash",
        code: `# Windows PowerShell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Format-Table

# macOS / Linux
lsof -i :3000
ss -ltnp | grep 3000`,
      },
    ],
    commonMistakes: [
      "Listening on 127.0.0.1 and then wondering why teammates cannot reach your API from another machine — use 0.0.0.0 in that case.",
      "Hardcoding port 3000 in production: read it from the environment (`process.env.PORT`) so hosting platforms can assign one.",
      "Thinking a firewall ‘block’ is a DNS problem — if the IP is right but the connection times out, a firewall or binding issue is more likely.",
    ],
    bestPractices: [
      "Always read the port from `process.env.PORT ?? 3000` in real apps.",
      "Keep development servers on loopback unless you explicitly need LAN access.",
      "Document which ports each service in your project uses (3000 API, 5173 frontend, 27017 MongoDB, 5432 PostgreSQL).",
    ],
    realWorldUseCases: [
      "A reverse proxy (Nginx) listens on 443 and forwards to your Node.js process on 127.0.0.1:3000 inside the same machine.",
      "Docker maps ports with `-p 8080:3000`, exposing container port 3000 as host port 8080.",
    ],
    resources: [
      docs("Node.js API — server.listen()", "https://nodejs.org/api/net.html#serverlisten", "Official docs for binding sockets and ports.", "en", "10 min"),
      ytSearch("IP addresses and ports explained", "Beginner videos on IPv4, private ranges and ports.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-ports",
        title: "Bind three ports",
        prompt:
          "Start three Node.js HTTP servers in three terminals on ports 3000, 3001 and 3002, each returning a different message. Then try to start a fourth on 3000 and observe the error. Finally, restart one server on 127.0.0.1 and verify with a second device on your LAN whether you can reach it.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Use `server.listen(port, '127.0.0.1')` for the loopback-only case.", "curl or a browser on the other device can test LAN reachability."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-http",
    slug: "http-and-https",
    title: "HTTP and HTTPS",
    description:
      "The application protocol of the web: plain-text request/response messages, and what TLS adds to make them private and authentic.",
    order: 5,
    estimatedMinutes: 20,
    tags: ["http", "https", "tls", "protocols"],
    prerequisites: ["p1m1-ip-ports", "p1m1-clients-servers"],
    relatedTopics: ["p1m1-requests-responses", "p1m1-methods", "p1m1-status-codes", "p1m1-headers"],
    learningObjectives: [
      "Read and write a raw HTTP request and response",
      "Explain what TLS protects: confidentiality, integrity and server identity",
      "State why HTTPS is mandatory for real applications, not optional",
    ],
    simpleExplanation:
      "HTTP is a simple text protocol: the client sends a request (method, path, headers, optional body), the server sends a response (status code, headers, body). HTTPS is the same protocol wrapped in TLS encryption, so eavesdroppers cannot read or tamper with the messages and you know you are talking to the real server.",
    detailedContent: `
**HTTP/1.1 message anatomy** (you should be able to write this from memory):

    GET /api/users?page=2 HTTP/1.1
    Host: api.example.com
    Accept: application/json
    User-Agent: my-app/1.0

The response:

    HTTP/1.1 200 OK
    Content-Type: application/json
    Content-Length: 31

    {"id":1,"name":"Amina"}

That is literally all HTTP is — a structured text conversation over TCP. Frameworks like Express simply parse these bytes into objects and help you build the reply.

**HTTPS = HTTP + TLS.** TLS provides:

- **Confidentiality** — the payload is encrypted with symmetric keys negotiated over an asymmetric handshake.
- **Integrity** — every record is authenticated; tampering breaks the MAC and the connection dies.
- **Server identity** — the server proves it owns the domain via a certificate signed by a Certificate Authority your device trusts (Let's Encrypt issues these for free).

Browsers mark plain HTTP as “Not secure”, and modern APIs should never send credentials over HTTP — including in internal networks, where lateral movement by an attacker is a real risk.

**Versions:** HTTP/1.1 (one request at a time per connection), HTTP/2 (multiplexed streams over one connection, header compression), HTTP/3 (runs over QUIC/UDP, survives network switches better). Node.js supports all three depending on how you terminate TLS.
    `,
    howItWorks: `
An HTTPS request to your Node.js app in production usually looks like this:

1. Browser connects to port 443 and performs a TLS handshake; Nginx (or your cloud load balancer) terminates TLS using its certificate.
2. Nginx opens (or reuses) a plain HTTP connection to your Node.js process on 127.0.0.1:3000.
3. Your handler runs and responds; Nginx encrypts the response back to the browser.

In local development you usually skip TLS and use \`http://localhost:3000\`. For testing secure behaviour locally you can use a self-signed certificate with a tool like mkcert.
    `,
    codeExamples: [
      {
        title: "Read a raw HTTP request with Node.js",
        language: "js",
        code: `import net from "node:net";

// A tiny TCP server that prints the RAW http request bytes
const server = net.createServer((socket) => {
  socket.once("data", (buffer) => {
    console.log("--- raw request ---");
    console.log(buffer.toString("utf8"));
    socket.end(
      "HTTP/1.1 200 OK\\r\\nContent-Type: text/plain\\r\\nContent-Length: 12\\r\\n\\r\\nHello HTTP!\\n",
    );
  });
});

server.listen(3000, () => {
  console.log("raw server on http://127.0.0.1:3000 — open it in a browser");
});`,
        description:
          "Send a request with `curl -v http://127.0.0.1:3000` and you will see the exact bytes HTTP uses. Everything Express does is parsing and generating messages like this one.",
      },
    ],
    commonMistakes: [
      "Serving login forms over plain HTTP ‘just for now’ — credentials leak permanently in logs and proxies.",
      "Forgetting that HTTPS does not make your *application* secure: it only protects data in transit.",
      "Assuming HTTP/2 makes an inefficient API fast — multiplexing helps, but payload size and round-trips still dominate.",
    ],
    bestPractices: [
      "Terminate TLS at a reverse proxy or load balancer; keep Node.js on plain HTTP inside the private network.",
      "Redirect all HTTP traffic to HTTPS (301) and enable HSTS once you are sure every subdomain supports TLS.",
      "Use Let's Encrypt + certbot (or your platform's automatic certificates) — certificates are free and short-lived by design.",
    ],
    realWorldUseCases: [
      "Every production API: TLS at the edge, plain HTTP to the app, database on a private network.",
      "Webhooks from providers like Stripe require HTTPS endpoints with valid certificates.",
    ],
    resources: [
      docs("RFC 9110 — HTTP Semantics", OFFICIAL.rfcHttp, "The authoritative HTTP specification (reference reading, not cover-to-cover).", "en", "reference"),
      docs("Cloudflare — What is HTTPS?", "https://www.cloudflare.com/learning/ssl/what-is-https/", "Plain-English HTTPS and TLS explainer.", "en", "10 min"),
      ytSearch("HTTP and HTTPS explained", "Video walkthroughs of the HTTP message format and TLS handshake.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-raw-http",
        title: "Handwrite an HTTP response",
        prompt:
          "Using the raw TCP example above, modify the server so it (1) returns a JSON body, (2) sets Content-Type to application/json, and (3) returns status 404 when the path is not `/hello`. Verify with curl -v and paste the raw response you observed.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["Status line format: HTTP/1.1 <code> <reason>", "Headers and body are separated by \\r\\n\\r\\n."],
        solution: `import net from "node:net";

const server = net.createServer((socket) => {
  socket.once("data", (buffer) => {
    const requestLine = buffer.toString("utf8").split("\\r\\n")[0];
    const path = requestLine.split(" ")[1] ?? "/";

    if (path === "/hello") {
      const body = JSON.stringify({ message: "Hello!" });
      socket.end(
        "HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\nContent-Length: " +
          Buffer.byteLength(body) +
          "\\r\\n\\r\\n" +
          body,
      );
    } else {
      const body = JSON.stringify({ error: "Not found" });
      socket.end(
        "HTTP/1.1 404 Not Found\\r\\nContent-Type: application/json\\r\\nContent-Length: " +
          Buffer.byteLength(body) +
          "\\r\\n\\r\\n" +
          body,
      );
    }
  });
});

server.listen(3000);`,
        solutionLanguage: "js",
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-weather-client"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-requests-responses",
    slug: "requests-and-responses",
    title: "Requests and Responses",
    description:
      "The anatomy of an HTTP request (start line, headers, body) and an HTTP response (status line, headers, body).",
    order: 6,
    estimatedMinutes: 16,
    tags: ["http", "request", "response"],
    prerequisites: ["p1m1-http"],
    relatedTopics: ["p1m1-headers", "p1m1-status-codes", "p1m1-json"],
    learningObjectives: [
      "Identify every part of a request and a response",
      "Use curl -v to inspect real headers and bodies",
      "Explain when a request needs a body and when a response must not have one",
    ],
    simpleExplanation:
      "Every HTTP exchange has two messages. The **request** says what you want (method + path + optional headers/body). The **response** says what happened (status code + headers + optional body). Learning to read them fluently is the single most useful debugging skill for a backend developer.",
    detailedContent: `
**Request structure**

    <METHOD> <path>?<query> HTTP/1.1      ← start line
    Header-Name: value                    ← zero or more headers
    ...
                                       ← blank line
    optional body                         ← JSON, form data, file bytes...

**Response structure**

    HTTP/1.1 <status> <reason>            ← status line
    Header-Name: value
    ...
                                       ← blank line
    optional body

Rules worth memorising:

- The **body** is optional in both messages. \`GET\` requests normally have none; \`POST\` almost always does.
- \`Content-Type\` describes the body format (\`application/json\`, \`multipart/form-data\`, \`text/html\`).
- \`Content-Length\` is the body size in bytes — clients use it to know when the message is complete.
- Headers are **case-insensitive** in HTTP/1.1 but conventionally use \`Kebab-Case\` (\`Content-Type\`).
- Informational bodies must be transferred as encoded structures rather than raw HTML.

Query strings (\`?page=2&sort=name\`) are part of the path and let clients pass parameters without a body.
    `,
    howItWorks: `
When Node.js receives a request, the HTTP module parses the bytes into a \`IncomingMessage\`:

- \`req.method\` → "GET"
- \`req.url\` → "/api/users?page=2" (includes the query string)
- \`req.headers\` → lower-cased header map
- \`req\` itself is a **readable stream** — if there is a body you must consume it in chunks.

The response object \`res\` is a **writable stream**: you set headers, optionally a status code, then write the body and end the response. Express wraps this with nicer helpers (\`res.json()\`, \`res.status(404).send(...)\`).
    `,
    codeExamples: [
      {
        title: "Inspect a real request/response cycle",
        language: "bash",
        code: `curl -v https://nodejs.org/en 2>&1 | Select-String -Pattern "< ", "> ", "\\* "`,
        description:
          "Lines starting with `>` are sent by the client, `<` are received. Run this against any API to see the full conversation.",
      },
      {
        title: "Parse a request and reply with Node.js",
        language: "js",
        code: `import http from "node:http";

const server = http.createServer((req, res) => {
  console.log(req.method, req.url, "user-agent:", req.headers["user-agent"]);

  res.writeHead(200, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify({ method: req.method, url: req.url, headers: req.headers }));
});

server.listen(3000);`,
        description:
          "The console.log line is the backbone of API debugging — log method, path and relevant headers on every request.",
      },
    ],
    commonMistakes: [
      "Calling res.end() twice — the second call throws or silently corrupts the response.",
      "Sending a JSON body without setting Content-Type: many clients then fail to parse it.",
      "Reading req.body manually with await on the request stream in plain http — you must collect 'data' events or use a framework.",
    ],
    bestPractices: [
      "Use `curl -v` before blaming the framework — most ‘Express bugs’ are actually wrong headers or bodies.",
      "Return a body (even an empty JSON object) for every API response; never leave clients guessing.",
      "Forward a correlation id header (x-request-id) through every hop so logs can be stitched together.",
    ],
    realWorldUseCases: [
      "Integrating a third-party API: you first reproduce their documented request in curl, then code it.",
      "Debugging a mobile-client bug: capture the exact request the app sends and replay it.",
    ],
    resources: [
      docs("MDN — HTTP request response overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages", "Reference for request and response message parts.", "en", "12 min"),
      ytSearch("HTTP request and response explained", "Walkthroughs of headers, bodies and curl -v output.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-inspect",
        title: "Replay and inspect",
        prompt:
          "Pick any public GET endpoint. Use curl -v and write down: the status code, three response headers, whether a body was returned, and the size of that body. Then send a POST to the same URL and record what changes.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Most public APIs answer 404 or 405 to unknown methods — that is still a valid observation."],
      },
    ],
    projectIds: ["p1-weather-client", "p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-methods",
    slug: "http-methods",
    title: "HTTP Methods",
    description:
      "GET, POST, PUT, PATCH, DELETE and the semantics of idempotency and safety that guide correct API design.",
    order: 7,
    estimatedMinutes: 15,
    tags: ["http", "methods", "rest"],
    prerequisites: ["p1m1-requests-responses"],
    relatedTopics: ["p1m1-status-codes", "p1m1-rest", "p1m1-cookies"],
    learningObjectives: [
      "State the conventional meaning of GET, POST, PUT, PATCH and DELETE",
      "Explain safety and idempotency and why proxies and clients rely on them",
      "Choose the correct method for a given operation",
    ],
    simpleExplanation:
      "HTTP methods tell the server *what kind of action* you want. GET reads, POST creates, PUT replaces, PATCH updates part of something, DELETE removes. Using them consistently is what makes an API predictable — and idempotent methods (GET, PUT, DELETE) can be retried safely after a network failure.",
    detailedContent: `
| Method | Meaning | Body? | Idempotent | Safe |
| --- | --- | --- | --- | --- |
| GET | Read a resource | No | Yes | Yes |
| POST | Create / submit / trigger an action | Yes | No | No |
| PUT | Replace a resource entirely | Yes | Yes | No |
| PATCH | Partially update a resource | Yes | No* | No |
| DELETE | Remove a resource | Optional | Yes | No |

*PATCH *can* be designed as idempotent (e.g. \`{"status":"done"}\` sets an absolute value), but it is not guaranteed by the spec.

**Safe** methods must not change server state — caches, browsers and crawlers rely on this.

**Idempotent** means “doing it N times has the same effect as doing it once”. This matters enormously on flaky networks: if a POST create times out, retrying might create a duplicate; retrying a PUT replace will not.

Other methods you will meet: \`HEAD\` (like GET without a body), \`OPTIONS\` (CORS preflight — browsers ask which methods/headers are allowed), \`TRACE\` (rarely enabled; a security risk).

> **Pitfall:** \`GET /users/1/delete\` “works” but is wrong — crawlers and prefetchers will delete data. The method *is* the action.
    `,
    howItWorks: `
Inside Node.js/Express, the method arrives as \`req.method\`. Express routes are registered per method:

    app.get("/users", listUsers);
    app.post("/users", createUser);
    app.put("/users/:id", replaceUser);
    app.patch("/users/:id", updateUser);
    app.delete("/users/:id", removeUser);

Behind the scenes every one of these is the same HTTP message format; only the first token of the start line differs. Proxies, CDNs and browsers all make caching and retry decisions from that token.
    `,
    codeExamples: [
      {
        title: "Method routing with plain Node.js",
        language: "js",
        code: `import http from "node:http";

const users = new Map([["1", { id: "1", name: "Amina" }]]);

const server = http.createServer(async (req, res) => {
  const [, resource, id] = req.url.split("/"); // "", "users", "1"
  res.setHeader("content-type", "application/json");

  if (resource !== "users") {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: "Not found" }));
  }

  if (req.method === "GET" && !id) return res.end(JSON.stringify([...users.values()]));
  if (req.method === "GET" && id)
    return users.has(id)
      ? res.end(JSON.stringify(users.get(id)))
      : ((res.statusCode = 404), res.end(JSON.stringify({ error: "No user" })));
  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const user = { id: String(users.size + 1), ...JSON.parse(body) };
    users.set(user.id, user);
    res.statusCode = 201;
    return res.end(JSON.stringify(user));
  }
  if (req.method === "DELETE" && id) {
    users.delete(id);
    res.statusCode = 204;
    return res.end();
  }

  res.statusCode = 405;
  res.setHeader("allow", "GET, POST, DELETE");
  res.end(JSON.stringify({ error: "Method not allowed" }));
});

server.listen(3000);`,
        description:
          "A complete mini CRUD server in 25 lines. Note the 201 for creation, 204 for deletion and 405 with an Allow header for unsupported methods.",
      },
    ],
    commonMistakes: [
      "Using GET for actions that change data — prefetchers and retries will cause damage.",
      "Returning 200 for a successful DELETE with no body preference — 204 is clearer and saves bandwidth.",
      "Implementing POST /users/:id as an update because a client library was lazy — accept it at the edge but keep your API consistent.",
    ],
    bestPractices: [
      "One resource, five verbs: keep the same path shape across your API (/tasks, /tasks/:id).",
      "Reject unsupported methods with 405 + Allow header instead of a generic 404.",
      "Document the idempotency expectations of every endpoint in your API docs.",
    ],
    realWorldUseCases: [
      "Stripe uses idempotency keys on POST so a retried payment request cannot double-charge.",
      "CDNs cache GET responses but never cache POST — understanding this prevents mysterious production bugs.",
    ],
    resources: [
      docs("MDN — HTTP request methods", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods", "Authoritative table of methods and their semantics.", "en", "10 min"),
      ytSearch("HTTP methods GET POST PUT PATCH DELETE explained", "Beginner-friendly method overview videos.", "en", "8–12 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-methods",
        title: "Design the verbs",
        prompt:
          "For a hospital appointment system, write the HTTP method + path for: list a patient's appointments, book one, change its time, cancel it, list a doctor's schedule. Justify why each is or is not idempotent.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: ["Booking is a creation → POST. Cancelling twice should leave the same end state → DELETE is idempotent."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-status-codes",
    slug: "http-status-codes",
    title: "HTTP Status Codes",
    description:
      "The 2xx/3xx/4xx/5xx families, which code to use when, and how status codes drive client behaviour.",
    order: 8,
    estimatedMinutes: 15,
    tags: ["http", "status-codes", "api-design"],
    prerequisites: ["p1m1-requests-responses"],
    relatedTopics: ["p1m1-methods", "p1m1-rest", "p1m1-requests-responses"],
    learningObjectives: [
      "Pick the correct status code for common API outcomes",
      "Distinguish 4xx (client's fault) from 5xx (server's fault)",
      "Use redirects (3xx) correctly and know when they break APIs",
    ],
    simpleExplanation:
      "The status code is the first word of the server's answer. 2xx means success, 3xx means ‘look elsewhere’, 4xx means ‘you sent something wrong’, 5xx means ‘we broke’. Clients — browsers, mobile apps, retry libraries — behave completely differently based on which family you return.",
    detailedContent: `
**2 Success**

- \`200 OK\` — standard success for GET, PUT, PATCH
- \`201 Created\` — a resource was created; include a Location header or the created body
- \`202 Accepted\` — accepted for processing, not finished yet (background jobs)
- \`204 No Content\` — success with no body (typical for DELETE)

**3 Redirection**

- \`301 Moved Permanently\` — permanent URL change (browsers cache this aggressively)
- \`302 / 307\` — temporary redirects; 307 preserves the method
- \`304 Not Modified\` — cached copy is still valid (works with ETag/If-None-Match)
- \`308\` — permanent redirect that preserves the method

**4 Client errors**

- \`400 Bad Request\` — malformed JSON, failed validation
- \`401 Unauthorized\` — *who are you?* (not authenticated)
- \`403 Forbidden\` — *I know who you are, you may not do this*
- \`404 Not Found\` — resource does not exist
- \`405 Method Not Allowed\` — wrong verb; send an Allow header
- \`409 Conflict\` — state conflict (duplicate email, version mismatch)
- \`413 Payload Too Large\` — body exceeds the limit
- \`415 Unsupported Media Type\` — wrong Content-Type
- \`422 Unprocessable Entity\` — valid JSON but semantically invalid
- \`429 Too Many Requests\` — rate limited

**5 Server errors**

- \`500 Internal Server Error\` — your code threw; never expose stack traces to clients
- \`502 Bad Gateway\` / \`503 Service Unavailable\` / \`504 Gateway Timeout\` — infrastructure problems; clients often retry these

> Memory hook: **4xx = fix your request; 5xx = fix the server.**
    `,
    howItWorks: `
Status codes are not decoration — they trigger behaviour everywhere:

- Browsers show their own error pages for non-2xx HTML responses.
- \`fetch\` does **not** reject on 404 or 500 (only on network failure) — your code must check \`res.ok\`.
- HTTP clients and service meshes automatically retry 502/503/504 and (carefully) idempotent 429s after \`Retry-After\`.
- Monitoring alarms are wired to 5xx rates: a spike of 500s pages a human; a spike of 404s usually means a client bug.
    `,
    codeExamples: [
      {
        title: "Status codes that clients actually rely on",
        language: "js",
        code: `import http from "node:http";

const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/created") {
    res.statusCode = 201;
    res.setHeader("location", "/users/42");
    return res.end(JSON.stringify({ id: 42, name: "Amina" }));
  }

  if (url.pathname === "/conflict") {
    res.statusCode = 409;
    return res.end(
      JSON.stringify({ error: "EMAIL_TAKEN", message: "This email is already registered." }),
    );
  }

  if (url.pathname === "/boom") {
    res.statusCode = 500;
    // Never leak the real error to the client — log it, send a generic message
    return res.end(JSON.stringify({ error: "INTERNAL_ERROR", message: "Something went wrong." }));
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "NOT_FOUND", message: "No such route." }));
});

server.listen(3000);`,
        description:
          "Note the structured error body paired with the status code — clients need both the code and a machine-readable error key.",
      },
    ],
    commonMistakes: [
      "Returning 200 with `{\"error\": ...}` inside — clients and monitoring tools see a success; use 4xx/5xx.",
      "Using 401 when the user is authenticated but not allowed — that is 403.",
      "Sending 500 for validation mistakes: validation is the client's problem (400/422), not a server failure.",
    ],
    bestPractices: [
      "Pick one error code vocabulary (e.g. `EMAIL_TAKEN`) and document it; HTTP codes alone are not specific enough for clients.",
      "Always set a JSON error body for API 4xx/5xx responses.",
      "Return 503 with Retry-After during planned maintenance so clients and load balancers react sensibly.",
    ],
    realWorldUseCases: [
      "Mobile apps branch on status codes to decide between showing a form error (422), a login prompt (401) or a retry button (503).",
      "Load balancers remove instances returning 5xx, so correct status codes protect your whole fleet.",
    ],
    resources: [
      docs("MDN — HTTP response status codes", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status", "Complete annotated list of status codes.", "en", "15 min"),
      ytSearch("HTTP status codes explained", "Short reference videos covering 2xx–5xx.", "en", "8–12 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-codes",
        title: "Choose the code",
        prompt:
          "For each scenario pick the best status code and justify it: (1) a user updates their profile successfully, (2) a JWT expired, (3) the user is logged in but tries to delete someone else's post, (4) the request body is valid JSON but the email field is missing, (5) the database is down, (6) a signup uses an existing email.",
        difficulty: "beginner",
        estimatedMinutes: 15,
        hints: ["Expired token is still an authentication problem → 401.", "Missing required field in valid JSON → 400 or 422 (pick one and be consistent)."],
      },
    ],
    projectIds: ["p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-headers",
    slug: "headers-and-request-bodies",
    title: "Headers and Request Bodies",
    description:
      "The metadata channel of HTTP: content types, caching, auth headers, cookies, and when and how to send bodies.",
    order: 9,
    estimatedMinutes: 16,
    tags: ["http", "headers", "content-type"],
    prerequisites: ["p1m1-requests-responses", "p1m1-methods"],
    relatedTopics: ["p1m1-json", "p1m1-cookies", "p1m1-http"],
    learningObjectives: [
      "Name the most important request and response headers and their purposes",
      "Set and read headers correctly in Node.js",
      "Understand Content-Type negotiation and body encoding",
    ],
    simpleExplanation:
      "Headers are key–value metadata attached to every HTTP message. They tell the other side how to interpret the body, whether it may be cached, whether credentials are included, and dozens of other rules. The body itself carries the actual data — JSON, form fields or file bytes.",
    detailedContent: `
**Headers you will use weekly**

| Header | Where | Purpose |
| --- | --- | --- |
| \`Content-Type\` | both | Media type of the body (\`application/json\`) |
| \`Content-Length\` | both | Body size in bytes |
| \`Authorization\` | request | Bearer token: \`Authorization: Bearer <jwt>\` |
| \`Cookie\` | request | Session cookies sent automatically by browsers |
| \`Set-Cookie\` | response | Ask the browser to store a cookie |
| \`Accept\` | request | Types the client can handle |
| \`User-Agent\` | request | Client software identification |
| \`Accept-Encoding\` | request | gzip, br, zstd supported |
| \`Cache-Control\`, \`ETag\` | response | Caching rules and validators |
| \`Location\` | response | Target of a 201/3xx redirect |
| \`Access-Control-Allow-*\` | response | CORS rules (Phase 2) |
| \`x-request-id\` | both | Correlation id for logs |

**Body rules**

- \`GET\`/\`DELETE\` usually have no body.
- \`POST\`/\`PUT\`/\`PATCH\` bodies are almost always JSON today (\`Content-Type: application/json\`).
- File uploads use \`multipart/form-data\` (handled by Multer in Phase 2).
- Bodies are **streams**: Node.js receives them in chunks, not all at once. Never assume \`req\` is already a string in plain \`http\`.

Headers must be set **before** writing the body — after the first byte of body is sent, the status line and headers are already on the wire.
    `,
    howItWorks: `
Node.js exposes headers as \`req.headers\` — an object with **lower-cased** keys (\`content-type\`, \`user-agent\`). Duplicate headers are joined with \`, \`, except \`set-cookie\` which is an array.

On the response side:

    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-store");

    // or all at once:
    res.writeHead(200, { "content-type": "application/json" });

For large bodies, always check \`content-length\` before buffering everything into memory — an attacker could otherwise stream gigabytes at you.
    `,
    codeExamples: [
      {
        title: "Reading and setting headers safely",
        language: "js",
        code: `import http from "node:http";

const MAX_BODY = 1024 * 1024; // 1 MB

const server = http.createServer(async (req, res) => {
  const contentType = req.headers["content-type"] ?? "";
  const requestId = req.headers["x-request-id"] ?? crypto.randomUUID();

  res.setHeader("x-request-id", requestId);
  res.setHeader("content-type", "application/json");

  if (req.method === "POST") {
    if (!contentType.includes("application/json")) {
      res.statusCode = 415;
      return res.end(JSON.stringify({ error: "Send application/json" }));
    }

    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) {
        req.destroy(); // stop the upload immediately
        return;
      }
      chunks.push(chunk);
    }

    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return res.end(JSON.stringify({ received: body, requestId }));
  }

  res.end(JSON.stringify({ requestId }));
});

server.listen(3000);`,
        description:
          "Shows three production habits: content-type validation, a hard body-size limit, and propagating a request id through response headers.",
      },
    ],
    commonMistakes: [
      "Calling res.end() before setting headers — you can no longer change them.",
      "Assuming req.headers['Content-Type'] works — Node.js lower-cases all header names.",
      "Buffering unbounded request bodies into memory; always enforce a size limit.",
    ],
    bestPractices: [
      "Validate Content-Type before parsing; reject unexpected types with 415.",
      "Set cache-control: no-store on any response containing user-specific data.",
      "Propagate x-request-id from the client (or generate one) on every response and log line.",
    ],
    realWorldUseCases: [
      "APIs use Accept headers (or URL versioning) to return JSON to apps and HTML to browsers.",
      "Upload endpoints stream large files instead of buffering them, keeping memory flat.",
    ],
    resources: [
      docs("MDN — HTTP headers", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers", "The canonical header reference.", "en", "reference"),
      ytSearch("HTTP headers explained", "Videos walking through request and response headers with curl.", "en", "10–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-headers",
        title: "Header scavenger hunt",
        prompt:
          "Use curl -v against https://nodejs.org and record: the value of content-type, cache-control and accept-ranges in the response. Then send a POST with a JSON body to httpbin.org/post and inspect which headers httpbin echoes back.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "curl -v prints request headers above the < prefix and response headers above the > prefix — run it twice, once without -X and once with -X POST.",
          "Use -H 'Content-Type: application/json' and -d '{\"a\":1}' so the server treats your body as JSON.",
          "httpbin.org/post echoes the headers it received inside the json.headers object of the response.",
        ],
      },
    ],
    projectIds: ["p1-weather-client"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-json",
    slug: "json",
    title: "JSON",
    description:
      "The data interchange format of the web: syntax rules, parsing, serialization, and the pitfalls of JSON in JavaScript.",
    order: 10,
    estimatedMinutes: 18,
    tags: ["json", "data", "serialization"],
    prerequisites: ["p1m1-requests-responses"],
    relatedTopics: ["p1m1-headers", "p1m1-rest", "p1m2-array-methods"],
    learningObjectives: [
      "Write valid JSON and spot invalid JSON instantly",
      "Use JSON.parse and JSON.stringify with error handling and replacers",
      "Explain JSON's limitations (no dates, no functions, no comments)",
    ],
    simpleExplanation:
      "JSON (JavaScript Object Notation) is a tiny text format for data: objects `{}`, arrays `[]`, strings \"\", numbers, booleans and `null`. Nearly every modern API speaks it. In JavaScript you convert with `JSON.parse` (text → value) and `JSON.stringify` (value → text).",
    detailedContent: `
**The complete JSON grammar** in practice:

- Keys and string values use **double quotes** — \`{'a':1}\` is invalid, \`{"a":1}\` is valid.
- No comments, no trailing commas, no \`undefined\`, no functions, no dates.
- Numbers are IEEE-754 doubles — you lose precision above \`Number.MAX_SAFE_INTEGER\` (9,007,199,254,740,991). Use strings for large ids.
- Only three literal values: \`true\`, \`false\`, \`null\`.

**In JavaScript:**

- \`JSON.parse\` throws \`SyntaxError\` on bad input — always wrap untrusted input in try/catch.
- \`JSON.stringify(value)\` omits \`undefined\` values and functions; drops keys whose value is \`undefined\`; converts \`Date\` objects to ISO strings via their \`toJSON\`.
- Circular references throw \`TypeError: Converting circular structure to JSON\`.

**Dates:** JSON has no date type. The universal convention is ISO 8601 strings: \`"2026-10-14T09:30:00.000Z"\`. Always agree on this with your frontend team.

JSON is a *text* format — it is larger than binary formats (like MessagePack or Protobuf). For most REST APIs this trade-off is worth it for debuggability.
    `,
    howItWorks: `
\`JSON.parse\` is a recursive-descent parser implemented in native code in V8, so it is very fast — but it is still **synchronous and blocking**. Parsing a 50 MB JSON payload freezes the event loop for every other request on that process, which is exactly why request size limits matter (and why streaming parsers exist).

When your server responds with \`res.end(JSON.stringify(obj))\`, Node.js first builds the whole string in memory, then writes it to the socket in chunks. For huge payloads, streaming serializers avoid the double-memory spike.
    `,
    codeExamples: [
      {
        title: "Parsing and serializing safely",
        language: "js",
        code: `// Parsing untrusted input must never crash your process
function parseJsonSafe(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

console.log(parseJsonSafe('{"a": 1}'));          // { ok: true, value: { a: 1 } }
console.log(parseJsonSafe("{a: 1}"));            // { ok: false, error: "..." }
console.log(parseJsonSafe("{'a': 1}"));          // single quotes => invalid JSON

// Dates become ISO strings; undefined and functions disappear
const user = {
  name: "Amina",
  createdAt: new Date("2026-01-15T10:00:00Z"),
  passwordHash: undefined, // never serialise secrets!
  greet() { return "hi"; },
};
const text = JSON.stringify(user, null, 2);
console.log(text);
// {
//   "name": "Amina",
//   "createdAt": "2026-01-15T10:00:00.000Z"
// }

// Very large ids lose precision as numbers — keep them as strings
console.log(JSON.parse('{"id": 12345678901234567890}').id); // 12345678901234567000
console.log(JSON.parse('{"id": "12345678901234567890"}').id); // exact string`,
        description:
          "Three habits that prevent production incidents: safe parsing, never serialising secrets, and string ids for large numbers.",
      },
      {
        title: "JSON over HTTP",
        language: "bash",
        code: `curl -X POST https://httpbin.org/post \`\`
  -H "Content-Type: application/json" \`\`
  -d '{"name":"Amina","tags":["node","api"]}'`,
        description: "The -H flag sets the Content-Type header; -d sends the JSON body.",
      },
    ],
    commonMistakes: [
      "Sending JSON with single quotes or trailing commas and then debugging a confusing 400.",
      "Assuming JSON.stringify throws on circular structures only in weird cases — it throws, and it will crash an unhandled handler.",
      "Returning JSON with a Date object and then calling .toISOString() on the client without parsing — parse it first.",
    ],
    bestPractices: [
      "Use res.json(obj) in Express (sets Content-Type and stringifies for you).",
      "Validate and normalise ids as strings in APIs that cross databases with 64-bit ids.",
      "Strip sensitive fields explicitly before serialising — never rely on undefined to hide data.",
    ],
    realWorldUseCases: [
      "Every REST API request and response body you will write in Phase 2.",
      "Config files, package.json, tsconfig.json, CI workflow files — all JSON.",
    ],
    resources: [
      docs("RFC 8259 — The JSON Data Interchange Format", OFFICIAL.rfcJson, "The specification itself (short and surprisingly readable).", "en", "reference"),
      docs("MDN — JSON", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON", "Reference for JSON.parse/stringify behaviour.", "en", "10 min"),
      ytSearch("JSON for beginners tutorial", "Beginner JSON syntax walkthroughs.", "en", "8–15 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-json",
        title: "Break JSON on purpose",
        prompt:
          "Write a JS script that tries JSON.parse on: single quotes, a trailing comma, a comment, undefined, a date literal, and a very large number id. Record the result of each, then fix every snippet so it parses.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["Dates must be quoted strings; large ids must be quoted strings or lose precision."],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client", "p1-file-organizer"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-rest",
    slug: "rest-api-fundamentals",
    title: "REST API Fundamentals",
    description:
      "Resources, statelessness, uniform interfaces and the design rules that make an API predictable for years.",
    order: 11,
    estimatedMinutes: 20,
    tags: ["rest", "api-design", "http"],
    prerequisites: ["p1m1-methods", "p1m1-status-codes", "p1m1-json"],
    relatedTopics: ["p1m1-headers", "p1m1-cookies", "p2m5-rest-principles"],
    learningObjectives: [
      "Explain REST's constraints, especially statelessness and a uniform resource interface",
      "Design resource URLs and pick correct methods and status codes",
      "Recognise when an API is *not* REST and what to do about it",
    ],
    simpleExplanation:
      "REST is a set of design rules for APIs built on HTTP: you address **nouns** (resources) with URLs, act on them with **verbs** (HTTP methods), send and receive JSON, and every request stands alone — the server keeps no memory of previous requests from that client (that is *statelessness*).",
    detailedContent: `
REST (REpresentational State Transfer) has several constraints. The ones that matter in practice:

1. **Client–server** — separate the UI from the data store; either can evolve alone.
2. **Statelessness** — every request carries everything needed (auth token, locale, ids). No “remember me” server sessions in the REST core. This makes horizontal scaling trivial: any server instance can serve any request.
3. **Uniform interface** — resources identified by URLs; manipulation through representations (usually JSON); self-descriptive messages (status codes + headers); HATEOAS in the purist form (links to related resources).
4. **Cacheable** — responses declare whether they may be cached.

**Naming conventions that scale:**

- Plural nouns: \`/users\`, \`/users/:id/orders\`
- Sub-resources for relations: \`/posts/:id/comments\`
- Actions only when unavoidable: \`POST /orders/:id/cancel\`
- Version in the path or header: \`/v1/users\` or \`Accept: application/vnd.myapi.v1+json\`
- Query params for filtering/pagination: \`/users?role=admin&page=2&limit=20\`

> REST is a spectrum, not a religion. An RPC-style API (\`POST /send-email\`) is perfectly fine for actions — just be consistent and honest about the style.
    `,
    howItWorks: `
A REST request is completely self-contained:

    GET /v1/users/42 HTTP/1.1
    Host: api.example.com
    Authorization: Bearer eyJhbGciOi...
    Accept: application/json

The server authenticates the token, loads user 42, checks permissions, serialises a representation and responds — then **forgets everything**. The next request re-establishes context. Because of this, adding a second API server behind a load balancer requires zero session replication.
    `,
    codeExamples: [
      {
        title: "A REST-shaped resource router (plain Node.js)",
        language: "js",
        code: `import http from "node:http";

let tasks = [
  { id: "1", title: "Learn HTTP", done: true },
  { id: "2", title: "Build a CLI", done: false },
];

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const [_, resource, id] = url.pathname.split("/");

  if (resource !== "tasks") return json(res, 404, { error: "NOT_FOUND" });

  if (req.method === "GET" && !id) {
    const done = url.searchParams.get("done");
    let result = tasks;
    if (done !== null) result = tasks.filter((t) => String(t.done) === done);
    return json(res, 200, { data: result, total: result.length });
  }

  if (req.method === "GET" && id) {
    const task = tasks.find((t) => t.id === id);
    return task ? json(res, 200, task) : json(res, 404, { error: "TASK_NOT_FOUND" });
  }

  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const task = { id: String(tasks.length + 1), done: false, ...JSON.parse(body) };
    tasks.push(task);
    return json(res, 201, task);
  }

  if (req.method === "PATCH" && id) {
    let body = "";
    for await (const chunk of req) body += chunk;
    const task = tasks.find((t) => t.id === id);
    if (!task) return json(res, 404, { error: "TASK_NOT_FOUND" });
    Object.assign(task, JSON.parse(body));
    return json(res, 200, task);
  }

  if (req.method === "DELETE" && id) {
    const before = tasks.length;
    tasks = tasks.filter((t) => t.id !== id);
    return tasks.length < before ? res.writeHead(204).end() : json(res, 404, { error: "TASK_NOT_FOUND" });
  }

  return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
});

server.listen(3000);`,
        description:
          "Note the response shape `{ data, total }` for lists, 201+body for creation, 204 for deletion and 404 with a machine-readable error key.",
      },
    ],
    commonMistakes: [
      "Verbs in URLs: /getUser, /deleteTask — REST uses methods, not action names, on nouns.",
      "Returning different response shapes per endpoint; pick one envelope and stick to it.",
      "Implementing state via sticky sessions instead of tokens or a shared session store — this blocks scaling.",
    ],
    bestPractices: [
      "Agree on one list envelope (e.g. { data: [], meta: { total, page } }) across your whole API.",
      "Use pagination on every list endpoint from day one — retrofitting it later is painful.",
      "Document every endpoint (path, method, auth, status codes) before implementing it.",
    ],
    realWorldUseCases: [
      "GitHub, Stripe, and OpenAI's APIs are all REST-style and follow these conventions.",
      "Mobile + web clients sharing one API: REST's statelessness keeps auth simple across platforms.",
    ],
    resources: [
      docs("Roy Fielding's REST dissertation (chapter 5)", "https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm", "The original REST constraints, from the author of the term.", "en", "reference"),
      docs("MDN — REST", "https://developer.mozilla.org/en-US/docs/Glossary/REST", "Short, precise definition of REST.", "en", "5 min"),
      ytSearch("REST API design tutorial for beginners", "Practical REST naming and structure videos.", "en", "15–30 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-rest-design",
        title: "Design a library API",
        prompt:
          "Design the URL structure, methods and success status codes for a library API covering: books, members, loans (a member borrows a book), and reviews on books. Include one query-string filter and one nested route.",
        difficulty: "beginner",
        estimatedMinutes: 30,
        hints: ["A loan is a relationship between a member and a book → /loans or /members/:id/loans.", "Borrowing creates a loan → POST, returning it → DELETE or PATCH."],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-weather-client"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-cookies",
    slug: "cookies-and-sessions",
    title: "Cookies and Sessions",
    description:
      "How HTTP — a stateless protocol — still remembers users: cookies, session ids, server-side stores and the trade-offs.",
    order: 12,
    estimatedMinutes: 18,
    tags: ["cookies", "sessions", "auth"],
    prerequisites: ["p1m1-headers", "p1m1-http"],
    relatedTopics: ["p1m1-rest", "p2m6-auth-vs-authz", "p3m3-owasp-api-security"],
    learningObjectives: [
      "Explain how Set-Cookie and the Cookie header create continuity across stateless requests",
      "Describe the server-side session store pattern",
      "State the security attributes every session cookie needs (HttpOnly, Secure, SameSite)",
    ],
    simpleExplanation:
      "HTTP forgets everything between requests. To remember a logged-in user, the server sends a small token in a `Set-Cookie` header; the browser stores it and automatically attaches it to every future request to that site. The server looks the token up in a session store to know who you are.",
    detailedContent: `
**The flow**

1. \`POST /login\` with credentials.
2. Server verifies the password, creates a session record (\`sess_abc123 → { userId: 42 }\`) in a store, and responds with:
   \`Set-Cookie: sid=sess_abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800\`
3. The browser stores the cookie and sends \`Cookie: sid=sess_abc123\` on every subsequent request to the same site.
4. Middleware looks up \`sess_abc123\` in the store; missing/expired → 401.

**Cookie attributes that matter**

- \`HttpOnly\` — JavaScript cannot read it; blocks XSS token theft.
- \`Secure\` — only sent over HTTPS.
- \`SameSite=Lax|Strict|None\` — controls cross-site sending; mitigates CSRF. \`None\` requires \`Secure\`.
- \`Path\` / \`Domain\` — scoping.
- \`Max-Age\` / \`Expires\` — lifetime.

**Session stores:** in-memory \`Map\` (fine for one dev process, lost on restart), or Redis/Memcached/PostgreSQL for production so any server instance can resolve any session id.

Cookies vs tokens: cookies are automatic browser plumbing + CSRF surface; bearer tokens (Phase 2, JWT) are explicit headers + no CSRF but harder to revoke. You will compare both properly in Phase 2.
    `,
    howItWorks: `
Browsers implement cookie storage per-origin with strict rules: a response from \`evil.com\` cannot set cookies for \`bank.com\`, and \`SameSite\` decides whether a cookie is attached on cross-site navigation or form posts. This is why \`SameSite=Lax\` (the modern default) stops most CSRF attacks: a form post from another site arrives **without** your session cookie, so the server rejects it.

Servers do not magically receive cookies — they just receive a \`Cookie\` header assembled by the client. curl will not send cookies unless you pass \`-b\`.
    `,
    codeExamples: [
      {
        title: "Cookie-based sessions with plain Node.js",
        language: "js",
        code: `import crypto from "node:crypto";
import http from "node:http";

// Toy session store — use Redis in production
const sessions = new Map();

const server = http.createServer((req, res) => {
  const cookieHeader = req.headers.cookie ?? "";
  const sid = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sid="))
    ?.slice(4);

  const session = sid ? sessions.get(sid) : undefined;

  if (req.url === "/login") {
    const newSid = crypto.randomUUID();
    sessions.set(newSid, { userId: 42, createdAt: Date.now() });
    res.writeHead(200, {
      "content-type": "application/json",
      // HttpOnly: JS can't read it. Secure: HTTPS only. SameSite=Lax: CSRF protection.
      "set-cookie": \`sid=\${newSid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600\`,
    });
    return res.end(JSON.stringify({ ok: true }));
  }

  if (req.url === "/me") {
    if (!session) {
      res.writeHead(401, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "NOT_AUTHENTICATED" }));
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ userId: session.userId }));
  }

  res.writeHead(404).end();
});

server.listen(3000);`,
        description:
          "Test with: curl -i -X POST http://localhost:3000/login then curl -i http://localhost:3000/me -b 'sid=<value>'.",
      },
    ],
    commonMistakes: [
      "Missing HttpOnly — any XSS payload can steal the session cookie.",
      "Storing sessions only in memory in production: a restart or a second instance logs everyone out.",
      "Setting SameSite=None without Secure — browsers reject the cookie.",
    ],
    bestPractices: [
      "Always set HttpOnly + Secure + SameSite=Lax on session cookies.",
      "Regenerate the session id after login (prevents fixation attacks).",
      "Store only the session id in the cookie; keep user data server-side where you can expire it.",
    ],
    realWorldUseCases: [
      "Traditional server-rendered apps (and most B2B SaaS dashboards) still use cookie sessions.",
      "Load-balanced fleets share sessions through Redis so users are not logged out when an instance restarts.",
    ],
    resources: [
      docs("MDN — HTTP cookies", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies", "Complete cookie reference including security attributes.", "en", "12 min"),
      ytSearch("cookies and sessions explained", "Session cookie walkthroughs with demos.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-cookies",
        title: "Follow a cookie",
        prompt:
          "Implement the session server above, then use curl -i twice (login, then /me) and paste the Set-Cookie and Cookie headers you observed. Finally remove HttpOnly and show with a one-line browser console command how JavaScript could read the token.",
        difficulty: "beginner",
        estimatedMinutes: 35,
        hints: ["In the browser console: document.cookie (HttpOnly cookies will not appear)."],
      },
    ],
    projectIds: ["p1-contact-manager"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-frontend-backend",
    slug: "frontend-vs-backend",
    title: "Frontend vs Backend",
    description:
      "Where each kind of code runs, what each is responsible for, and why validation must exist on the server.",
    order: 13,
    estimatedMinutes: 12,
    tags: ["frontend", "backend", "career"],
    prerequisites: ["p1m1-clients-servers"],
    relatedTopics: ["p1m1-browsers-servers", "p1m1-rest"],
    learningObjectives: [
      "List the responsibilities of frontend and backend code",
      "Explain why the server is the only place security can be enforced",
      "Describe the backend's wider ecosystem (databases, queues, third-party services)",
    ],
    simpleExplanation:
      "The **frontend** is everything the user sees and interacts with — it runs in the browser (or a mobile app) and focuses on UI, validation hints and experience. The **backend** is the engine room: it runs on a server, holds the data, enforces rules, talks to databases and third-party APIs, and is the only place where security can actually be enforced.",
    detailedContent: `
| Concern | Frontend | Backend |
| --- | --- | --- |
| Runs in | Browser / mobile app | Server |
| Tech | HTML, CSS, React, Vue | Node.js, Express, databases |
| Primary jobs | Presentation, UX, optimistic UI | Business rules, data, security, integrations |
| Trust level | Never trusted | Source of truth |

**Why the server is the only security boundary.** Anything the client sends can be forged — anyone can open DevTools, edit a fetch request, or use curl. Client-side validation is a *usability* feature; server-side validation is the *actual* feature.

**The backend's real neighbourhood** includes more than HTTP servers:

- **Databases** (PostgreSQL, MongoDB, Redis)
- **Caches** (Redis, CDN edge caches)
- **Queues** (BullMQ, RabbitMQ) for slow background work
- **Third-party services** (Stripe, SendGrid, S3)
- **Schedulers and workers** (cron jobs, email senders)
- **Observability** (logs, metrics, traces)

A backend developer's job is to make all of those collaborate reliably behind one clean API.
    `,
    howItWorks: `
A single user action fans out across the stack. Clicking “Place order” in the browser runs client-side validation, then sends one \`POST /orders\`. The backend: authenticates the token, validates the payload again, checks inventory in PostgreSQL, charges a card via Stripe, writes an order row, pushes an “order.confirmation_email” job onto a queue, and returns 201. A worker later sends the email — the user never waits for it.
    `,
    codeExamples: [
      {
        title: "The same rule, enforced twice",
        language: "js",
        code: `// FRONTEND (React-ish) — nice UX, but attacker-editable
function validateEmailField(value) {
  if (!value.includes("@")) return "Please enter a valid email";
  return null;
}

// BACKEND (Node.js) — the real enforcement point
import { z } from "zod";

const createOrderSchema = z.object({
  email: z.string().email(),
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().positive() })).min(1),
});

export function validateCreateOrder(body) {
  const result = createOrderSchema.safeParse(body);
  if (!result.success) {
    return { status: 422, body: { error: "VALIDATION_ERROR", details: result.error.flatten() } };
  }
  return { status: 200, body: result.data };
}`,
        description:
          "Same rule, two places. The frontend copy improves UX; the backend copy is the one that actually protects your data. You will build this pattern with Zod in Phase 2.",
      },
    ],
    commonMistakes: [
      "Trusting client-side validation — an attacker simply skips it.",
      "Returning different data to different clients by accident because the check lived only in the UI.",
      "Putting secrets (API keys, admin tokens) in frontend code — everything shipped to the browser is public.",
    ],
    bestPractices: [
      "Validate every input on the server, always, even if the frontend already did.",
      "Keep business rules in the backend so mobile, web and partner integrations behave identically.",
      "Return the same domain errors to all clients rather than UI-specific messages.",
    ],
    realWorldUseCases: [
      "Price changes: never trust the price sent by the cart UI — look it up on the server.",
      "Feature flags and permissions: decide visibility server-side so hidden endpoints are truly hidden.",
    ],
    resources: [
      docs("Node.js — Getting started", OFFICIAL.nodejsLearn, "Official start page for the backend side of JavaScript.", "en", "10 min"),
      ytSearch("frontend vs backend difference explained", "Career-overview videos on the split of responsibilities.", "en", "8–12 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-trust",
        title: "Break your own form",
        prompt:
          "Take any form you have built (or a simple HTML page) and submit it with curl, bypassing the UI entirely. Change one supposedly validated field to an invalid value and record what the server did. Write one sentence about what the server should have done.",
        difficulty: "beginner",
        estimatedMinutes: 20,
        hints: [
          "Copy the exact POST request your form sends (browser devtools → Network tab) and replay it with curl -X POST -H 'Content-Type: application/json' -d '{...}'.",
          "Try values the client would reject: an empty string, a 10,000-character string, a negative number, or a wrong type such as an array where a string is expected.",
          "Check the status code and response body: 2xx means the server trusted the payload, 4xx means it validated it.",
        ],
      },
    ],
    projectIds: ["p1-contact-manager", "p1-basic-http-server"],
    quizId: "quiz-p1-m1",
  },
  {
    ...shared,
    id: "p1m1-browsers-servers",
    slug: "how-browsers-communicate-with-servers",
    title: "How Browsers Communicate with Servers",
    description:
      "The complete lifecycle of a page load and an API call: DNS, TCP, TLS, request, render, cookies and errors.",
    order: 14,
    estimatedMinutes: 18,
    tags: ["browser", "http", "lifecycle"],
    prerequisites: ["p1m1-clients-servers", "p1m1-dns", "p1m1-http", "p1m1-json"],
    relatedTopics: ["p1m1-cookies", "p1m1-frontend-backend"],
    learningObjectives: [
      "Trace a page load from URL bar to rendered pixels, step by step",
      "Describe what happens when a fetch() call fails at each layer",
      "Use browser DevTools' Network panel to diagnose real problems",
    ],
    simpleExplanation:
      "When you open a site, the browser resolves the name, connects, encrypts, asks for the page, receives HTML, discovers CSS/JS/images, requests those too, and paints the result. Every one of those steps can fail — and each failure looks completely different to a backend developer who knows what to look for.",
    detailedContent: `
**Page-load timeline**

1. URL parsed → scheme, host, path.
2. DNS lookup (cached at several layers).
3. TCP handshake (SYN → SYN-ACK → ACK).
4. TLS handshake (certificates, key exchange) — HTTPS only.
5. HTTP request for the HTML document.
6. Server (or CDN) responds with HTML + headers.
7. Browser parses HTML → finds \`<link>\`, \`<script>\`, \`<img>\` → more requests.
8. CSSOM + JS execution; layout and paint.
9. JavaScript may fire \`fetch()\` calls for data → JSON responses → UI updates.

**Where failures happen (and what you see)**

| Failure | Layer | Symptom |
| --- | --- | --- |
| DNS does not resolve | DNS | \`ERR_NAME_NOT_RESOLVED\` |
| Connection refused | TCP | \`ERR_CONNECTION_REFUSED\` (server not listening) |
| Timeout / firewall | TCP | \`ERR_CONNECTION_TIMED_OUT\` |
| Bad/expired certificate | TLS | \`ERR_CERT_DATE_INVALID\` |
| Server error | HTTP | 5xx page or JSON error |
| Wrong JSON | App | \`Unexpected token\` in console |

**CORS** deserves special mention: it is a *browser-enforced* rule. A request from \`http://localhost:5173\` to \`http://localhost:3000\` is cross-origin — the browser blocks reading the response unless the **server** sends \`Access-Control-Allow-Origin\`. curl and mobile apps are not subject to CORS at all.
    `,
    howItWorks: `
DevTools → Network panel is your X-ray machine:

- Reload the page and watch every request's status, size and timing.
- The **Timing** tab shows DNS, TCP, TLS, waiting (server processing) and download separately — “waiting” being large usually means slow server code or database queries.
- The **Response** tab shows exactly what your API returned, including headers.

When users report “the site is broken”, 90% of the time the Network panel tells you in under a minute whether it is DNS, TLS, a 4xx, a 5xx or a frontend bug.
    `,
    codeExamples: [
      {
        title: "Reproduce a browser fetch from Node.js",
        language: "js",
        code: `// Understanding fetch layers: network error vs HTTP error
try {
  const res = await fetch("http://127.0.0.1:3000/api/users");

  // HTTP errors (404, 500) do NOT throw — check res.ok yourself
  if (!res.ok) {
    console.log("HTTP error:", res.status, await res.text());
  } else {
    console.log("payload:", await res.json());
  }
} catch (err) {
  // Only network-level failures land here (server down, DNS, CORS in browsers)
  console.log("network failure:", err.cause?.code ?? err.message);
}`,
        description:
          "This distinction — res.ok vs try/catch — is the #1 fetch bug in frontend code. Backend teams should document it in their API guides.",
      },
      {
        title: "What the server logs for one browser request",
        language: "bash",
        code: `curl -v https://example.com \`\`
  -H "User-Agent: Mozilla/5.0" \`\`
  -H "Accept: text/html"`,
        description: "Exactly what a browser sends (plus cookies). Reproduce client issues by replaying the request.",
      },
    ],
    commonMistakes: [
      "Blaming the backend for a CORS error — CORS is enforced by the browser; the fix is a server header.",
      "Not checking res.ok before calling res.json(), so 500 HTML error pages crash the frontend with a parse error.",
      "Ignoring the Timing tab: 'waiting' time is usually where your Node.js performance problem hides.",
    ],
    bestPractices: [
      "Teach your frontend teammates to send x-request-id and echo it in error reports.",
      "Return JSON error bodies for API routes even under Nginx error pages, so clients can parse failures.",
      "Test your API with curl before opening the browser — it isolates layers instantly.",
    ],
    realWorldUseCases: [
      "Support tickets that say 'the button does nothing' are almost always a hidden 4xx/5xx in the Network panel.",
      "Mobile apps and partner servers call your API without any CORS — validating behaviour with curl mimics them.",
    ],
    resources: [
      docs("MDN — Web development", "https://developer.mozilla.org/en-US/docs/Learn", "Mozilla's structured path through web fundamentals.", "en", "self-paced"),
      ytSearch("browser server request lifecycle explained", "End-to-end page load walkthroughs.", "en", "10–20 min"),
    ],
    exercises: [
      {
        id: "ex-p1m1-devtools",
        title: "Audit a real site",
        prompt:
          "Open DevTools on any news site, reload, and answer: how many requests were made, which was the slowest (and in which timing phase), which returned a non-200 status, and which response headers control caching. Then reproduce the slowest request with curl -w to see server timing.",
        difficulty: "beginner",
        estimatedMinutes: 25,
        hints: ["curl -w '\\nTTFB: %{time_starttransfer}\\n' shows time to first byte."],
      },
    ],
    projectIds: ["p1-basic-http-server", "p1-weather-client"],
    quizId: "quiz-p1-m1",
  },
];

export const quiz: Quiz = {
  id: "quiz-p1-m1",
  moduleId: "p1-m1",
  title: "Module 1 quiz — Web & backend fundamentals",
  description:
    "Test your understanding of clients, servers, DNS, HTTP, status codes, headers, JSON, REST and cookies.",
  questions: [
    {
      id: "q-p1m1-1",
      type: "multiple-choice",
      prompt:
        "A client sends a request and receives 'HTTP/1.1 503 Service Unavailable'. Which statement is most accurate?",
      options: [
        "The client sent malformed JSON and must fix its request",
        "The server (or its infrastructure) is temporarily unable to handle the request; a retry may succeed",
        "The requested resource was deleted permanently",
        "The client is not authenticated",
      ],
      correctIndex: 1,
      explanation:
        "5xx means server-side trouble. 503 specifically signals temporary unavailability (overload, maintenance, no backend) and typically carries Retry-After. 400 would be a client error, 404 a missing resource, 401 an authentication problem.",
      optionExplanations: [
        "Malformed JSON would produce 400 Bad Request or 422.",
        "Correct — 5xx family = server's fault; 503 is temporary and often retryable.",
        "A permanently removed resource would be 404 (or 410 Gone).",
        "Missing/invalid credentials produce 401.",
      ],
    },
    {
      id: "q-p1m1-2",
      type: "code-output",
      prompt: "What does this code print?",
      code: `const data = '{"id": 9007199254740993, "name": "Amina"}';
const parsed = JSON.parse(data);
console.log(typeof parsed.id, parsed.id);`,
      language: "js",
      options: [
        "number 9007199254740993",
        "number 9007199254740992",
        "string 9007199254740993",
        "It throws a SyntaxError",
      ],
      correctIndex: 1,
      explanation:
        "JSON numbers become IEEE-754 doubles. 9007199254740993 exceeds Number.MAX_SAFE_INTEGER (9007199254740991) and rounds to ...992. The JSON itself is valid, so nothing throws. Quoting the id keeps it exact.",
      optionExplanations: [
        "The value is not exactly representable as a double, so it is rounded.",
        "Correct — precision is lost above 2^53 - 1.",
        "The id was not quoted in the JSON, so it is parsed as a number.",
        "The syntax is valid; only precision is lost.",
      ],
    },
    {
      id: "q-p1m1-3",
      type: "multiple-choice",
      prompt:
        "Which cookie attribute prevents JavaScript running on your page from reading the session token?",
      options: ["Secure", "HttpOnly", "SameSite=Lax", "Path=/"],
      correctIndex: 1,
      explanation:
        "HttpOnly hides the cookie from document.cookie and from any injected script (XSS mitigation). Secure only restricts transmission to HTTPS; SameSite controls cross-site sending; Path only scopes where it is sent.",
      optionExplanations: [
        "Secure limits the cookie to HTTPS but JavaScript can still read it.",
        "Correct — HttpOnly removes it from JavaScript access entirely.",
        "SameSite mitigates CSRF, not XSS token theft.",
        "Path controls which URL prefix receives the cookie.",
      ],
    },
    {
      id: "q-p1m1-4",
      type: "find-bug",
      prompt: "A user reports 'the site is broken' — the frontend shows nothing. What is wrong here?",
      code: `async function loadUser(id) {
  try {
    const res = await fetch("/api/users/" + id);
    const user = await res.json();
    renderUser(user);
  } catch {
    showError("Network error, please retry");
  }
}`,
      language: "js",
      options: [
        "fetch should be called with await only inside a .then()",
        "The code never checks res.ok, so a 404/500 JSON or HTML error body is passed to renderUser (or res.json() throws on non-JSON)",
        "res.json() does not exist; use res.text()",
        "There is no bug — fetch throws on every HTTP error status",
      ],
      correctIndex: 1,
      explanation:
        "fetch only rejects on network-level failures. HTTP 4xx/5xx arrive normally, and res.json() will either parse an error payload the UI does not understand or throw on an HTML error page. The fix: check res.ok (or res.status) before parsing/handling the body.",
      optionExplanations: [
        "That is not a requirement and would not help.",
        "Correct — check res.ok and handle non-2xx explicitly.",
        "res.json() exists on the Response object.",
        "A common myth: fetch resolves for any completed HTTP exchange.",
      ],
    },
    {
      id: "q-p1m1-5",
      type: "short-answer",
      prompt:
        "In the domain name 'api.example.com', which DNS record type would you create to point a machine-readable hostname at an IPv4 address? Answer with the record type only.",
      acceptedKeywords: ["a", "a record", "type a"],
      explanation:
        "An A record maps a name to an IPv4 address. AAAA maps to IPv6; CNAME aliases one name to another; MX is for mail servers.",
    },
    {
      id: "q-p1m1-6",
      type: "multiple-choice",
      prompt: "Which pair of statements about HTTP methods is correct?",
      options: [
        "GET is safe and idempotent; POST is neither",
        "POST is idempotent; DELETE is not",
        "GET is unsafe; PUT is safe",
        "PATCH is always idempotent; PUT is not",
      ],
      correctIndex: 0,
      explanation:
        "Safe = no server-side state change (GET). Idempotent = same effect no matter how many times it runs (GET, PUT, DELETE). POST creates new state each time, so it is neither.",
      optionExplanations: [
        "Correct — GET changes nothing and can be retried; POST creates new resources each call.",
        "POST is not idempotent; DELETE is idempotent (deleting twice ends in the same state).",
        "GET is safe by definition; PUT changes state.",
        "The opposite is closer to true: PUT is idempotent, PATCH is not guaranteed to be.",
      ],
    },
  ],
};
