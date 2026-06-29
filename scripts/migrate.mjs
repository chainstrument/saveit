import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env.local manuellement
const envContent = readFileSync(join(__dirname, "../apps/web/.env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const sql = neon(process.env.DATABASE_URL);

// Ensure migrations table exists
await sql`
  CREATE TABLE IF NOT EXISTS drizzle_migrations (
    id SERIAL PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const journal = JSON.parse(
  readFileSync(join(__dirname, "../apps/web/drizzle/meta/_journal.json"), "utf8")
);

for (const entry of journal.entries) {
  const already = await sql`SELECT 1 FROM drizzle_migrations WHERE tag = ${entry.tag}`;
  if (already.length > 0) {
    console.log(`  skip  ${entry.tag}`);
    continue;
  }
  const migrationSql = readFileSync(
    join(__dirname, `../apps/web/drizzle/${entry.tag}.sql`),
    "utf8"
  );
  await sql.unsafe(migrationSql);
  await sql`INSERT INTO drizzle_migrations (tag) VALUES (${entry.tag})`;
  console.log(`  apply ${entry.tag}`);
}

console.log("Done.");
