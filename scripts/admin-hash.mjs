#!/usr/bin/env node
/**
 * Generates the admin login variables for .env (local) or Cloudflare secrets (production):
 *
 *   npm run admin:hash
 *
 * The password is read from a hidden prompt (or from stdin when piped), never from argv,
 * so it does not end up in shell history.
 */
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const MIN_PASSWORD_LENGTH = 12;

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write(question);
    if (hidden) rl._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readPipedStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

let username = "admin";
let password;

if (process.stdin.isTTY) {
  username = (await ask("Admin username [admin]: ")).trim().toLowerCase() || "admin";
  password = await ask("Admin password: ", { hidden: true });
  const confirm = await ask("Repeat password: ", { hidden: true });
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
} else {
  password = await readPipedStdin();
}

if (username.length < 3) {
  console.error("Username must be at least 3 characters.");
  process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

// Must match src/lib/admin-auth.ts: scrypt (N=16384, r=8, p=1), 16-byte salt, 64-byte key.
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`
Add these lines to .env (and as Cloudflare secrets for production builds):

ADMIN_USERNAME=${username}
ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}
ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}
`);
