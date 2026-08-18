import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const root = process.cwd();
const strictEnvironment = process.argv.includes("--env");
const failures = [];
const warnings = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

function hasConfiguredValue(name) {
  const value = process.env[name]?.trim() || "";
  return Boolean(value)
    && !value.startsWith("your_")
    && !value.includes("replace_with")
    && !value.includes(".example");
}

const packageJson = JSON.parse(read("package.json"));
const vercelConfig = JSON.parse(read("vercel.json"));
const nextConfig = read("next.config.ts");
const buybackRoute = read("app/api/treasury/buyback/route.ts");

requireCondition(!packageJson.scripts?.postinstall, "postinstall must not patch payment dependencies");
requireCondition(!Array.isArray(vercelConfig.crons) || vercelConfig.crons.length === 0, "release must not schedule treasury automation");
requireCondition(nextConfig.includes('{ source: "/operations/:path*", destination: "/"'), "Operations pages must remain outside the public product");
requireCondition(nextConfig.includes('{ source: "/api/operations/:path*", destination: "/"'), "Operations APIs must remain outside the public product");
requireCondition(buybackRoute.includes('TREASURY_BUYBACK_ENABLED === "true"'), "treasury execution must require an explicit enable flag");
requireCondition(buybackRoute.includes("GET is permanently read-only"), "treasury GET must remain read-only");
requireCondition(fs.existsSync(path.join(root, "supabase/migrations/20260817170000_create_x402_operations.sql")), "x402 receipt migration is missing");
requireCondition(fs.existsSync(path.join(root, "supabase/migrations/20260817210000_create_guest_agent_usage.sql")), "guest quota migration is missing");

if (strictEnvironment) {
  loadEnvConfig(root);
  const requiredCore = [
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "WALLET_SALT",
    "NEXT_PUBLIC_SOLANA_RPC_URL",
    "SOLANA_RPC_URL",
    "GEOCODING_USER_AGENT",
  ];
  for (const name of requiredCore) {
    requireCondition(hasConfiguredValue(name), `production environment is missing ${name}`);
  }

  if (process.env.TREASURY_BUYBACK_ENABLED === "true") {
    failures.push("TREASURY_BUYBACK_ENABLED must remain false for this release");
  }

  if (hasConfiguredValue("SVM_ADDRESS")) {
    for (const name of ["SVM_NETWORK", "PAYAI_FACILITATOR_URL"]) {
      requireCondition(hasConfiguredValue(name), `x402 recipient is configured but ${name} is missing`);
    }
  } else {
    warnings.push("x402 remains runtime-disabled until SVM_ADDRESS and the receipt migration are configured");
  }
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`[release:warning] ${warning}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`[release:failed] ${failure}`);
  process.exit(1);
}

console.log(`[release:ok] repository safety gates passed${strictEnvironment ? " with production environment checks" : ""}`);
