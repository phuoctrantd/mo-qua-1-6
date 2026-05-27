/**
 * Import gifts from Excel.
 *
 * Headers: Tên quà | Số lượng | Giới tính | Ảnh (optional URL)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import XLSX from "xlsx";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) throw new Error("Missing .env.local");
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

function normalizeGiftGender(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (["nam", "male", "m", "trai"].includes(s)) return "male";
  if (["nu", "female", "f", "gai"].includes(s)) return "female";
  if (["chung", "unisex", "all", "ca hai", "cả hai"].includes(s)) return "unisex";
  return null;
}

function findHeaderIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map((c) => String(c).toLowerCase());
    const nameIdx = row.findIndex((c) => c.includes("tên") || c === "name");
    const qtyIdx = row.findIndex(
      (c) =>
        c.includes("số lượng") ||
        c.includes("so luong") ||
        c.includes("quantity"),
    );
    const genderIdx = row.findIndex(
      (c) => c.includes("giới") || c.includes("gioi") || c === "gender",
    );
    const imageIdx = row.findIndex(
      (c) =>
        c.includes("ảnh") ||
        c.includes("anh") ||
        c.includes("image") ||
        c.includes("url") ||
        c.includes("link"),
    );
    if (nameIdx >= 0 && qtyIdx >= 0 && genderIdx >= 0) {
      return { headerRow: i, nameIdx, qtyIdx, genderIdx, imageIdx };
    }
  }
  return { headerRow: 0, nameIdx: 0, qtyIdx: 1, genderIdx: 2, imageIdx: 3 };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => !a.startsWith("--"));

  if (!fileArg) {
    console.error('Usage: node scripts/import-gifts.mjs "<path-to.xlsx>" [--dry-run]');
    process.exit(1);
  }

  const filePath = resolve(fileArg);
  const wb = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: "",
  });

  const { headerRow, nameIdx, qtyIdx, genderIdx, imageIdx } = findHeaderIndex(rows);
  const gifts = [];
  const errors = [];

  for (let i = headerRow + 1; i < rows.length; i++) {
    const r = rows[i];
    const name = String(r[nameIdx] ?? "").trim();
    const qty = Number(r[qtyIdx]);
    const gender = normalizeGiftGender(r[genderIdx]);
    const imageRaw =
      imageIdx >= 0 ? String(r[imageIdx] ?? "").trim() : "";

    if (!name) continue;
    if (!Number.isFinite(qty) || qty < 0) {
      errors.push(`Row ${i + 1}: invalid quantity for "${name}".`);
      continue;
    }
    if (!gender) {
      errors.push(`Row ${i + 1}: invalid gender for "${name}".`);
      continue;
    }

    const row = {
      name,
      quantity_remaining: Math.floor(qty),
      gender,
    };
    if (imageRaw) row.image_url = imageRaw;
    gifts.push(row);
  }

  console.log(`Parsed ${gifts.length} gifts.`);
  gifts.forEach((g, i) =>
    console.log(
      `  ${i + 1}. ${g.name} | qty=${g.quantity_remaining} | ${g.gender}${g.image_url ? " | 🖼" : ""}`,
    ),
  );
  errors.forEach((e) => console.warn(" -", e));

  if (gifts.length === 0) process.exit(1);
  if (dryRun) return;

  loadEnvLocal();
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await sb.from("gifts").insert(gifts);
  if (error) {
    console.error("Supabase error:", error.message);
    if (error.message.includes("image_url")) {
      console.error("Run supabase/migrations/004_gift_image_url.sql first.");
    }
    process.exit(1);
  }
  console.log(`Inserted ${gifts.length} gifts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
