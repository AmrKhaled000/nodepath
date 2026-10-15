// Repair CP1252-mangled UTF-8 sequences introduced by PowerShell Get-Content round-trips.
import fs from "node:fs";
import path from "node:path";

// byte -> unicode for the CP1252 0x80-0x9F block (chars that map ABOVE 0x9F)
const CP_HIGH = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

// unicode char -> original byte (reverse map), plus identity for 0xA0-0xFF
const TO_BYTE = new Map();
for (const [byte, uni] of Object.entries(CP_HIGH)) TO_BYTE.set(uni, Number(byte));
for (let b = 0xa0; b <= 0xff; b++) TO_BYTE.set(b, b);
// undefined CP1252 bytes (0x81, 0x8D, 0x8F, 0x90, 0x9D) surface as C1 control chars
for (let b = 0x80; b <= 0x9f; b++) if (!TO_BYTE.has(b)) TO_BYTE.set(b, b);

function byteOf(ch) {
  const cp = ch.codePointAt(0);
  return TO_BYTE.get(cp) ?? null;
}

function repair(text) {
  let out = "";
  let i = 0;
  let fixes = 0;
  const chars = [...text];
  while (i < chars.length) {
    const cp = chars[i].codePointAt(0);
    // Mangled 3-byte UTF-8 sequences start with â (0xE2); 2-byte with Â (0xC2)
    if (cp === 0x00e2 || cp === 0x00c2 || cp === 0x00c3) {
      const take = cp === 0x00e2 ? 3 : 2;
      const slice = chars.slice(i, i + take);
      if (slice.length === take) {
        const bytes = [];
        let ok = true;
        for (const s of slice) {
          const b = byteOf(s);
          if (b === null) { ok = false; break; }
          bytes.push(b);
        }
        if (ok) {
          try {
            const decoded = Buffer.from(bytes).toString("utf8");
            if (decoded && !decoded.includes("\uFFFD")) {
              out += decoded;
              i += take;
              fixes++;
              continue;
            }
          } catch { /* fall through */ }
        }
      }
    }
    out += chars[i];
    i += 1;
  }
  return { text: out, fixes };
}

function collect(target, out = []) {
  const st = fs.statSync(target, { throwIfNoEntry: false });
  if (!st) return out;
  if (st.isDirectory()) {
    for (const entry of fs.readdirSync(target)) collect(path.join(target, entry), out);
  } else if (target.endsWith(".ts")) {
    out.push(target);
  }
  return out;
}

const files = process.argv.slice(2).flatMap((a) => collect(a));
for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const { text: fixed, fixes } = repair(text);
  fs.writeFileSync(file, fixed, "utf8");
  console.log(`${path.basename(file)}: repaired ${fixes} sequence(s)`);
}
