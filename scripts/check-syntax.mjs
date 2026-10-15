// Validation harness for content files: parse checks, structure checks, id checks.
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const lessonsDir = path.resolve("src/content/lessons");
const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

let failed = false;

for (const file of files) {
  const full = path.join(lessonsDir, file);
  const text = fs.readFileSync(full, "utf8");
  const sf = ts.createSourceFile(full, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const diags = sf.parseDiagnostics ?? [];
  if (diags.length > 0) {
    failed = true;
    console.log(`\n[SYNTAX] ${file}: ${diags.length} parse error(s)`);
    for (const d of diags.slice(0, 8)) {
      const { line, character } = sf.getLineAndCharacterOfPosition(d.start ?? 0);
      const msg = ts.flattenDiagnosticMessageText(d.messageText, " ");
      // print source line
      const srcLine = text.split("\n")[line] ?? "";
      console.log(`  ${line + 1}:${character + 1} ${msg}`);
      console.log(`    > ${srcLine.slice(0, 160)}`);
    }
  } else {
    console.log(`[ok-parse] ${file}`);
  }
}

// Structural validation via transpile+import is done in verify-content.mjs
process.exit(failed ? 1 : 0);
