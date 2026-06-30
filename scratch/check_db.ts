import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envConfig = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
const env: Record<string, string> = {};
envConfig.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env variables");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Inspecting columns of users table...");
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Query failed:", error);
  } else if (data && data.length > 0) {
    console.log("Columns found on users record:", Object.keys(data[0]));
  } else {
    console.log("No rows in users table, trying to select from information_schema...");
  }
}

main().catch(console.error);
