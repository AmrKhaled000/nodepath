// Quick structural stats over all content module files.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("src/content/lessons");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "index.ts");

for (const file of files.sort()) {
  const text = fs.readFileSync(path.join(dir, file), "utf8");
  const lessons = (text.match(/^\s{4}id: "([a-z0-9-]+)",$/gm) ?? []).length;
  const quizQs = (text.match(/^\s{6}id: "q-/gm) ?? []).length;
  const hasQuiz = /export const quiz/.test(text);
  const hasMeta = /export const meta/.test(text);
  const hasLessons = /export const lessons/.test(text);
  console.log(
    `${file.padEnd(12)} lessons=${String(lessons).padStart(2)} quiz=${hasQuiz ? "Y" : "N"} q=${quizQs} meta=${hasMeta ? "Y" : "N"} lessonsExport=${hasLessons ? "Y" : "N"}`,
  );
}
