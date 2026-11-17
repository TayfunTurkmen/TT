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

const MIN_PASSWORD_LENGTH = 12;

// Reads one line straight from the terminal in raw mode. readline's terminal mode
// misbehaves in some Windows terminals (the prompt is erased and stdin closes early).
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let value = "";
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    const finish = (err) => {
      stdin.off("data", onData);
      stdin.off("end", onEnd);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write("\n");
      if (err) reject(err);
      else resolve(value);
    };
    const onEnd = () => finish(new Error("Input closed before a value was entered."));
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish();
        if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130); // Ctrl+C
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = value.slice(0, -1);
            if (!hidden) process.stdout.write("\b \b");
          }
        } else if (ch >= " ") {
          value += ch;
          if (!hidden) process.stdout.write(ch);
        }
      }
    };
    stdin.on("data", onData);
    stdin.once("end", onEnd);
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
