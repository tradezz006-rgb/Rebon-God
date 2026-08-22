/**
 * Fix common Tanglish romanization / grammar issues in student_mode lessons.
 * Run: node scripts/fix-tanglish-lessons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(__dirname, "../src/data/cloud/student_mode"),
  path.resolve(
    __dirname,
    "../../../Rebon God/commu-craft-coach-main/commu-craft-coach-main/src/data/cloud/student_mode"
  ),
];

const REPLACEMENTS = [
  [/thoda-vae thoda-la/gi, "thodalavae thodalai"],
  [/file-yae thoda-vae thoda-la/gi, "file-yae thodalavae thodalai"],
  [/veyra yaaroadhuu/gi, "veyra yaarodhu"],
  [/veyra yaaraavadhu/gi, "veyra yaaravadhu"],
  [/yaaraavadhu/gi, "yaaravadhu"],
  [/yaraavadhu/gi, "yaravadhu"],
  [/join aanaanga/gi, "join aanaalum"],
  [/Idle capacity-ku pay pannuvom illai/g, "Idle capacity-ku pay pannaatheenga"],
  [/Idle capacity-ku oru paisa-um pay pannuvom\./g, "Idle capacity-ku oru paisa-um pay pannaatheenga."],
  [/pay pannuvom illai/g, "pay pannaatheenga"],
  [/ulayae/g, "ulleye"],
  [/padhilamaaga/g, "pathilamaaga"],
  [/katharrom/g, "katrom"],
  [/edutthukkitta/g, "eduthukitta"],
  [/panniruchu/g, "pannuchu"],
  [/panurathuu/g, "panradhu"],
  [/serndhuu/g, "serndhu"],
  [/irundhuu/g, "irundhu"],
  [/irundhaa/g, "irundha"],
  [/aanaalaa/g, "aanaalum"],
  [/aanaa,/g, "aanaa,"],
];

function walk(obj) {
  if (typeof obj === "string") {
    let s = obj;
    for (const [re, to] of REPLACEMENTS) s = s.replace(re, to);
    return s;
  }
  if (Array.isArray(obj)) return obj.map(walk);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = walk(v);
    return out;
  }
  return obj;
}

for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const name of fs.readdirSync(root)) {
    if (!/^day\d_lesson_tanglish\.json$/.test(name)) continue;
    const fp = path.join(root, name);
    const raw = fs.readFileSync(fp, "utf8").replace(/^\uFEFF/, "");
    const data = walk(JSON.parse(raw));
    fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
    console.log("fixed", path.basename(root), name);
  }
}
