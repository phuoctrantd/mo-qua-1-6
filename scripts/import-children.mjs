/**
 * Import children from the company Excel template.
 *
 * Expected sheet layout (row 2 = headers):
 *   A: STT
 *   B: Họ và tên bố mẹ (optional) OR department title rows (skipped)
 *   C: Họ và tên con
 *   D: Ngày sinh (Excel date or dd/mm/yyyy text)
 *   E: Giới tính (Nam / Nữ)
 *
 * Usage:
 *   node scripts/import-children.mjs "C:\path\file.xlsx"
 *   node scripts/import-children.mjs "C:\path\file.xlsx" --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import XLSX from "xlsx";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    throw new Error("Missing .env.local (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  }
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeGender(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (["nam", "male", "m", "trai", "boy"].includes(s)) return "male";
  if (["nu", "nữ", "female", "f", "gai", "girl"].includes(s)) return "female";
  return null;
}

function excelSerialToDdmmyyyy(serial) {
  const d = XLSX.SSF.parse_date_code(serial);
  if (!d) return null;
  const dd = String(d.d).padStart(2, "0");
  const mm = String(d.m).padStart(2, "0");
  const yyyy = String(d.y);
  return `${dd}${mm}${yyyy}`;
}

function parseDob(cell) {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") return excelSerialToDdmmyyyy(cell);
  const s = String(cell).trim();
  if (/^\d{8}$/.test(s)) return s;
  const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${dd}${mm}${m[3]}`;
  }
  return null;
}

function isDepartmentRow(nameB, nameC) {
  const b = String(nameB ?? "").trim();
  const c = String(nameC ?? "").trim();
  if (!c && b) {
    const lower = b.toLowerCase();
    if (
      lower.startsWith("ban ") ||
      lower.startsWith("phòng") ||
      lower.startsWith("p.") ||
      lower.startsWith("bộ phận")
    ) {
      return true;
    }
  }
  return false;
}

function parseRowsFromWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  });

  const children = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const parentName = String(r[1] ?? "").trim();
    const childName = String(r[2] ?? "").trim();
    const dobRaw = r[3];
    const genderRaw = r[4];

    if (!childName || childName === "Họ và tên con") continue;
    if (isDepartmentRow(parentName, childName)) continue;

    const dob = parseDob(dobRaw);
    const gender = normalizeGender(genderRaw);

    if (!dob) {
      errors.push(`Row ${i + 1}: "${childName}" — invalid/missing Ngày sinh.`);
      continue;
    }
    if (!gender) {
      errors.push(
        `Row ${i + 1}: "${childName}" — invalid/missing Giới tính (use Nam/Nữ in column E).`,
      );
      continue;
    }

    children.push({
      name: childName,
      dob,
      gender,
      parent_name: parentName || null,
    });
  }

  return { children, errors, sheetName };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => !a.startsWith("--"));

  if (!fileArg) {
    console.error(
      'Usage: node scripts/import-children.mjs "<path-to.xlsx>" [--dry-run]',
    );
    process.exit(1);
  }

  const filePath = resolve(fileArg);
  if (!existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  loadEnvLocal();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const { children, errors, sheetName } = parseRowsFromWorkbook(filePath);

  console.log(`Sheet: ${sheetName}`);
  console.log(`Parsed ${children.length} children.`);

  if (errors.length) {
    console.warn("\nWarnings:");
    errors.forEach((e) => console.warn(" -", e));
  }

  if (children.length === 0) {
    console.error("\nNo rows imported. Add column E (Giới tính) with Nam/Nữ for each child.");
    process.exit(1);
  }

  console.log("\nPreview:");
  children.forEach((c, idx) => {
    console.log(
      `  ${idx + 1}. ${c.name} | dob=${c.dob} | ${c.gender}${c.parent_name ? ` | parent=${c.parent_name}` : ""}`,
    );
  });

  if (dryRun) {
    console.log("\n--dry-run: no database writes.");
    return;
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb
    .from("children")
    .upsert(children, { onConflict: "dob" })
    .select("id,name,dob,gender");

  if (error) {
    console.error("\nSupabase error:", error.message);
    if (error.message.includes("gender")) {
      console.error(
        "Run supabase/migrations/002_add_gender.sql in SQL Editor first.",
      );
    }
    process.exit(1);
  }

  console.log(`\nUpserted ${data?.length ?? children.length} rows into public.children.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
