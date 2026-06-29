import { randomBytes, scrypt } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { neon } = require("/home/cloukili/labs/saveit/node_modules/.pnpm/@neondatabase+serverless@1.1.0/node_modules/@neondatabase/serverless/index.js");

// Load DATABASE_URL from apps/web/.env.local
const envContent = readFileSync(resolve(__dirname, "../apps/web/.env.local"), "utf8");
const dbUrl = envContent.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim();
if (!dbUrl) throw new Error("DATABASE_URL not found in apps/web/.env.local");

const EMAIL = process.argv[2];
const NEW_PASSWORD = process.argv[3];

if (!EMAIL || !NEW_PASSWORD) {
  console.error("Usage: node scripts/reset-password.mjs <email> <newpassword>");
  process.exit(1);
}

// Même algo que Better Auth (@better-auth/utils/password)
const config = { N: 16384, r: 16, p: 1, dkLen: 64 };

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      config.dkLen,
      { N: config.N, r: config.r, p: config.p, maxmem: 128 * config.N * config.r * 2 },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });
  return `${salt}:${key.toString("hex")}`;
}

const sql = neon(dbUrl);

const users = await sql`SELECT id FROM users WHERE email = ${EMAIL}`;
if (users.length === 0) {
  console.error(`Aucun utilisateur trouvé avec l'email : ${EMAIL}`);
  process.exit(1);
}

const hash = await hashPassword(NEW_PASSWORD);

const result = await sql`
  UPDATE accounts
  SET password = ${hash}, updated_at = NOW()
  WHERE user_id = ${users[0].id} AND provider_id = 'credential'
  RETURNING id
`;

if (result.length === 0) {
  console.error("Pas de compte email/mdp trouvé (connexion Google uniquement ?)");
  process.exit(1);
}

console.log(`✓ Mot de passe mis à jour pour ${EMAIL}`);
