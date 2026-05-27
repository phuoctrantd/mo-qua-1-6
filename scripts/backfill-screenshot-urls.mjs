/**
 * Fill screenshot_url for existing spins (signed URL, 1 year).
 *
 * Usage: node scripts/backfill-screenshot-urls.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

async function main() {
  loadEnvLocal();
  const sb = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: rows, error } = await sb
    .from("spins")
    .select("id,screenshot_path,screenshot_url")
    .not("screenshot_path", "is", null);

  if (error) throw error;

  let updated = 0;
  for (const row of rows ?? []) {
    if (!row.screenshot_path || row.screenshot_url) continue;

    const { data: signed, error: signErr } = await sb.storage
      .from("screenshots")
      .createSignedUrl(row.screenshot_path, 60 * 60 * 24 * 365);

    if (signErr || !signed?.signedUrl) {
      console.warn(`Skip ${row.id}:`, signErr?.message ?? "no signed url");
      continue;
    }

    const { error: upErr } = await sb
      .from("spins")
      .update({ screenshot_url: signed.signedUrl })
      .eq("id", row.id);

    if (upErr) {
      console.warn(`Update ${row.id} failed:`, upErr.message);
      continue;
    }

    console.log(row.id, signed.signedUrl);
    updated++;
  }

  console.log(`\nUpdated ${updated} row(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
