import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "eslint-report.json");

try {
  execSync(`npx eslint . -f json -o "${out}" --no-error-on-unmatched-pattern`, {
    cwd: root,
    stdio: "pipe",
  });
} catch (error) {
  // eslint exits non-zero while errors exist; the JSON report is still written.
  if (!fs.existsSync(out)) throw error;
}

const report = JSON.parse(fs.readFileSync(out, "utf8"));
let fixedCount = 0;
let fileCount = 0;

for (const fileResult of report) {
  const filePath = fileResult.filePath;
  const messages = fileResult.messages.filter(
    (m) => m.ruleId === "no-useless-escape" && typeof m.line === "number" && typeof m.column === "number",
  );
  if (messages.length === 0) continue;

  const original = fs.readFileSync(filePath, "utf8");
  const lines = original.split("\n");
  let touched = false;

  const byLine = new Map();
  for (const message of messages) {
    if (!byLine.has(message.line)) byLine.set(message.line, []);
    byLine.get(message.line).push(message.column);
  }

  for (const [lineNumber, columns] of byLine) {
    const index = lineNumber - 1;
    if (index < 0 || index >= lines.length) continue;
    const line = lines[index];
    // Remove the backslash immediately before each reported column (columns are 1-based).
    const sorted = [...new Set(columns)].sort((a, b) => b - a);
    let updated = line;
    for (const column of sorted) {
      const charIndex = column - 1;
      if (updated[charIndex] === "\\") {
        updated = updated.slice(0, charIndex) + updated.slice(charIndex + 1);
        fixedCount += 1;
      }
    }
    if (updated !== line) {
      lines[index] = updated;
      touched = true;
    }
  }

  if (touched) {
    fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    fileCount += 1;
  }
}

fs.rmSync(out, { force: true });
console.log(`Fixed ${fixedCount} useless escapes across ${fileCount} files.`);
