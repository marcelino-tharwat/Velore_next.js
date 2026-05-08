/**
 * Seeds a single admin user for local/staging databases.
 *
 * Usage: npm run seed:admin
 *
 * Loads `.env` then `.env.local` with `override: true` so file values win over
 * empty or stale `ADMIN_*` / `MONGODB_*` inherited from the OS shell (Windows
 * User/System env often breaks dotenv’s default “do not override”).
 * Required: MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
 * Suggested demo values: ADMIN_EMAIL=test20261@gmail.com, ADMIN_PASSWORD=Test@5050
 * (use `npm run seed:demo` for catalog + test20262/test20263 accounts)
 *
 * Optional: SEED_DEBUG=1 — extra connection and query diagnostics (never logs passwords).
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../src/models/User";
import { Cart } from "../src/models/Cart";

const LOG = "[seed:admin]";
const BCRYPT_ROUNDS = 12;
const CONNECT_TIMEOUT_MS = 15_000;

function envString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI is required (missing or empty)")
    .refine(
      (s) => s.startsWith("mongodb://") || s.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    ),
  ADMIN_EMAIL: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((s, ctx) => {
      if (!s) {
        ctx.addIssue({
          code: "custom",
          message: "ADMIN_EMAIL is required (missing or empty)",
        });
        return;
      }
      if (!z.string().email().safeParse(s).success) {
        ctx.addIssue({
          code: "custom",
          message: "ADMIN_EMAIL must be a valid email address",
        });
      }
    }),
  ADMIN_PASSWORD: z
    .string()
    .min(1, "ADMIN_PASSWORD is required (missing or empty)")
    .min(8, "ADMIN_PASSWORD must be at least 8 characters"),
});

function loadEnvFiles(): void {
  console.log(`${LOG} Step 1/5 — Loading environment files`);
  const root = process.cwd();
  const envLocal = path.join(root, ".env.local");
  const envFile = path.join(root, ".env");

  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: true });
    console.log(`${LOG}   ✓ Loaded: .env`);
  } else {
    console.log(`${LOG}   · Skipped (missing): .env`);
  }

  if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal, override: true });
    console.log(`${LOG}   ✓ Loaded: .env.local (overrides .env / empty shell vars)`);
  } else {
    console.log(`${LOG}   · Skipped (missing): .env.local`);
  }
}

function isDebug(): boolean {
  const d = process.env.SEED_DEBUG?.trim().toLowerCase();
  if (d === "1" || d === "true" || d === "yes") return true;
  const nodeDebug = process.env.DEBUG ?? "";
  return /\bseed:admin\b/i.test(nodeDebug) || /\bseed\b/i.test(nodeDebug);
}

function dbg(message: string, extra?: Record<string, unknown>): void {
  if (!isDebug()) return;
  if (extra && Object.keys(extra).length > 0) {
    console.log(`${LOG}[debug] ${message}`, extra);
  } else {
    console.log(`${LOG}[debug] ${message}`);
  }
}

function validateEnv(): z.infer<typeof envSchema> {
  console.log(`${LOG} Step 2/5 — Validating environment variables`);
  const parsed = envSchema.safeParse({
    MONGODB_URI: envString(process.env.MONGODB_URI).trim(),
    ADMIN_EMAIL: envString(process.env.ADMIN_EMAIL).trim(),
    ADMIN_PASSWORD: envString(process.env.ADMIN_PASSWORD),
  });

  if (!parsed.success) {
    console.error(`${LOG}   ✗ Validation failed:`);
    for (const issue of parsed.error.issues) {
      const key = issue.path.length ? issue.path.join(".") : "env";
      console.error(`${LOG}     - ${key}: ${issue.message}`);
    }
    console.error(
      `${LOG} Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in .env.local (see .env.example).`,
    );
    throw new Error("Invalid environment");
  }

  const data = parsed.data;
  dbg("Environment OK", {
    adminEmail: data.ADMIN_EMAIL,
    uriPrefix: data.MONGODB_URI.slice(0, 14) + "…",
    passwordLength: data.ADMIN_PASSWORD.length,
  });
  console.log(`${LOG}   ✓ MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD are valid`);
  return data;
}

async function connectMongo(uri: string): Promise<void> {
  console.log(`${LOG} Step 3/5 — Connecting to MongoDB`);
  dbg("mongoose version", { version: mongoose.version });

  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState === 1) {
    console.log(`${LOG}   · Already connected, reusing connection`);
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      family: 4,
    });
  } catch (err) {
    console.error(`${LOG}   ✗ Failed to connect to MongoDB`);
    if (err instanceof Error) {
      console.error(`${LOG}     ${err.name}: ${err.message}`);
    } else {
      console.error(`${LOG}    `, err);
    }
    console.error(
      `${LOG} Check MONGODB_URI, network access, and that mongod / Atlas is reachable.`,
    );
    throw err;
  }

  dbg("mongoose connection readyState", {
    readyState: mongoose.connection.readyState,
  });

  const { host, name } = mongoose.connection;
  console.log(`${LOG}   ✓ Connected (db: ${name ?? "?"}, host: ${host ?? "?"})`);

  if (isDebug()) {
    try {
      const admin = mongoose.connection.db?.admin();
      const ping = await admin?.command({ ping: 1 });
      dbg("ping reply", { ok: ping?.ok });
    } catch (e) {
      dbg("ping skipped or failed", { error: String(e) });
    }
  }
}

async function seedAdmin(
  email: string,
  plainPassword: string,
): Promise<void> {
  console.log(`${LOG} Step 4/5 — Checking for existing user`);
  const emailNorm = email.trim().toLowerCase();

  const existing = await User.findOne({ email: emailNorm }).select(
    "+passwordHash role email emailVerified +verificationToken +verificationTokenExpires",
  );
  dbg("findOne result", {
    found: !!existing,
    role: existing?.role ?? null,
    id: existing?._id?.toString(),
    emailVerified: existing?.emailVerified ? true : false,
  });

  if (existing && existing.role === "admin") {
    console.log(`${LOG}   · Admin already exists for: ${emailNorm}`);
    let ensured = false;
    if (!existing.emailVerified) {
      existing.emailVerified = new Date();
      ensured = true;
    }
    if (existing.verificationToken != null || existing.verificationTokenExpires != null) {
      existing.verificationToken = undefined;
      existing.verificationTokenExpires = undefined;
      ensured = true;
    }
    if (ensured) {
      await existing.save();
      console.log(
        `${LOG}   ✓ emailVerified set automatically; pending verification tokens cleared (credentials login enabled)`,
      );
    } else {
      console.log(
        `${LOG}   · Email already verified (matches app login: authorize() requires emailVerified)`,
      );
    }
    console.log(`${LOG} Step 5/5 — Nothing more to do (exiting)`);
    return;
  }

  if (existing && existing.role !== "admin") {
    console.log(
      `${LOG}   · User exists with role "${existing.role}" — promoting to admin and updating password`,
    );
    existing.role = "admin";
    existing.passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
    existing.emailVerified = new Date();
    existing.verificationToken = undefined;
    existing.verificationTokenExpires = undefined;
    await existing.save();
    dbg("user updated", { id: existing._id.toString(), role: existing.role });
    console.log(
      `${LOG}   ✓ emailVerified set automatically; verification tokens cleared`,
    );

    try {
      await Cart.create({ userId: existing._id, items: [] });
      console.log(`${LOG}   ✓ Empty cart ensured for user`);
    } catch (e: unknown) {
      const code = (e as { code?: number })?.code;
      if (code === 11000) {
        dbg("cart already exists for user, skipping Cart.create");
      } else {
        console.warn(`${LOG}   · Cart create warning:`, e);
      }
    }

    console.log(`${LOG} Step 5/5 — Done (promoted to admin)`);
    return;
  }

  console.log(`${LOG}   · No user with this email — creating admin`);
  const passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  const user = await User.create({
    email: emailNorm,
    passwordHash,
    name: "Admin",
    role: "admin",
    emailVerified: new Date(),
  });
  dbg("user created", { id: user._id.toString(), role: user.role });
  console.log(
    `${LOG}   ✓ emailVerified set automatically at signup (no inbox / verify-email step for seeded admin)`,
  );

  try {
    await Cart.create({ userId: user._id, items: [] });
    console.log(`${LOG}   ✓ Empty cart created for new admin`);
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 11000) {
      dbg("cart duplicate key, ignoring");
    } else {
      console.warn(`${LOG}   · Cart create warning:`, e);
    }
  }

  console.log(`${LOG} Step 5/5 — Done (created admin: ${emailNorm}, role: admin)`);
}

async function disconnectSafe(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      dbg("mongoose.disconnect() completed");
    }
  } catch (e) {
    console.warn(`${LOG} Disconnect warning:`, e);
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const env = validateEnv();
  await connectMongo(env.MONGODB_URI);
  await seedAdmin(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
}

let exitCode = 0;
main()
  .catch((err: unknown) => {
    exitCode = 1;
    console.error(`${LOG} Fatal error:`);
    if (err instanceof Error) {
      console.error(`${LOG}   ${err.stack ?? err.message}`);
    } else {
      console.error(`${LOG}  `, err);
    }
  })
  .finally(async () => {
    console.log(`${LOG} Closing database connection…`);
    await disconnectSafe();
    console.log(`${LOG} Goodbye.`);
    process.exit(exitCode);
  });
