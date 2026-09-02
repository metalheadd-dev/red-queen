import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const SP3ND_MCP_URL = "https://mcp.sp3nd.shop/mcp";
export const SP3ND_AUTH_ISSUER = "https://happy-dragon-88.authkit.app";
export const SP3ND_AUTHORIZATION_ENDPOINT = `${SP3ND_AUTH_ISSUER}/oauth2/authorize`;
export const SP3ND_TOKEN_ENDPOINT = `${SP3ND_AUTH_ISSUER}/oauth2/token`;
export const SP3ND_OAUTH_SCOPE = "openid profile offline_access";
export const SP3ND_SESSION_COOKIE = "rq_sp3nd_mcp_session";
export const SP3ND_STATE_COOKIE = "rq_sp3nd_mcp_state";
export const SP3ND_PROPOSAL_COOKIE = "rq_sp3nd_mcp_proposal";
export const RED_QUEEN_ORIGIN = "https://redqueen.space";
export const SP3ND_CLIENT_METADATA_URL = `${RED_QUEEN_ORIGIN}/.well-known/oauth-client/sp3nd.json`;
export const SP3ND_REDIRECT_URI = `${RED_QUEEN_ORIGIN}/api/market/sp3nd/mcp/callback`;

type Sp3ndOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt: number;
};

export type Sp3ndOAuthState = {
  state: string;
  verifier: string;
  returnTo: string;
  expiresAt: number;
};

export type Sp3ndMcpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

function sessionKey() {
  const secret = process.env.WALLET_SALT?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("WALLET_SALT is required for the SP3ND OAuth session.");
  }
  return createHash("sha256")
    .update(`red-queen:sp3nd-mcp:v1:${secret || "local-development-only"}`)
    .digest();
}

export function sealSp3ndValue(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function openSp3ndValue<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) return null;
    const decipher = createDecipheriv("aes-256-gcm", sessionKey(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const clear = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(clear) as T;
  } catch {
    return null;
  }
}

export function safeSp3ndReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/onchain#sp3nd-checkout";
  return value.slice(0, 1_000);
}

export function createSp3ndAuthorization(returnTo: string) {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = new URL(SP3ND_AUTHORIZATION_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: SP3ND_CLIENT_METADATA_URL,
    redirect_uri: SP3ND_REDIRECT_URI,
    scope: SP3ND_OAUTH_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: SP3ND_MCP_URL,
  }).toString();
  return {
    authorizationUrl,
    state: { state, verifier, returnTo, expiresAt: Date.now() + 10 * 60_000 } satisfies Sp3ndOAuthState,
  };
}

function parseTokenResponse(payload: Record<string, unknown>, previousRefreshToken?: string): Sp3ndOAuthTokens {
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!accessToken) throw new Error("SP3ND OAuth did not return an access token.");
  const expiresIn = Math.max(60, Number(payload.expires_in) || 3_600);
  return {
    accessToken,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : previousRefreshToken,
    tokenType: typeof payload.token_type === "string" ? payload.token_type : "Bearer",
    scope: typeof payload.scope === "string" ? payload.scope : undefined,
    expiresAt: Date.now() + expiresIn * 1_000,
  };
}

async function tokenRequest(params: URLSearchParams) {
  const response = await fetch(SP3ND_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: params,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const detail = typeof payload.error_description === "string" ? payload.error_description : "SP3ND OAuth failed.";
    throw new Error(detail);
  }
  return payload;
}

export async function exchangeSp3ndCode(code: string, verifier: string) {
  const payload = await tokenRequest(new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    client_id: SP3ND_CLIENT_METADATA_URL,
    redirect_uri: SP3ND_REDIRECT_URI,
    resource: SP3ND_MCP_URL,
  }));
  return parseTokenResponse(payload);
}

export async function refreshSp3ndTokens(tokens: Sp3ndOAuthTokens) {
  if (!tokens.refreshToken) throw new Error("SP3ND session must be reconnected.");
  const payload = await tokenRequest(new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    client_id: SP3ND_CLIENT_METADATA_URL,
    resource: SP3ND_MCP_URL,
  }));
  return parseTokenResponse(payload, tokens.refreshToken);
}

export function readSp3ndTokens(value: string | undefined) {
  return openSp3ndValue<Sp3ndOAuthTokens>(value);
}

export function sp3ndProposalFingerprint(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

function parseMcpPayload(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);
  const data = trimmed
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  return data.length ? JSON.parse(data[data.length - 1]) : null;
}

async function mcpPost(accessToken: string, body: unknown, sessionId?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    "MCP-Protocol-Version": "2025-06-18",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const response = await fetch(SP3ND_MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    if (response.status === 401) throw new Error("SP3ND_SESSION_EXPIRED");
    throw new Error(`SP3ND MCP returned ${response.status}.`);
  }
  return { payload: parseMcpPayload(text), sessionId: response.headers.get("mcp-session-id") || sessionId || "" };
}

async function openMcpSession(accessToken: string) {
  const initialized = await mcpPost(accessToken, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: { elicitation: { url: {} } },
      clientInfo: { name: "RED QUEEN", version: "1.0.0" },
    },
  });
  if (!initialized.sessionId) throw new Error("SP3ND MCP did not establish a session.");
  await mcpPost(accessToken, { jsonrpc: "2.0", method: "notifications/initialized" }, initialized.sessionId);
  return initialized.sessionId;
}

export async function listSp3ndMcpTools(accessToken: string) {
  const sessionId = await openMcpSession(accessToken);
  const result = await mcpPost(accessToken, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sessionId);
  const tools = result.payload?.result?.tools;
  return Array.isArray(tools) ? tools as Sp3ndMcpTool[] : [];
}

export async function callSp3ndMcpTool(accessToken: string, name: string, args: Record<string, unknown>) {
  const sessionId = await openMcpSession(accessToken);
  const result = await mcpPost(accessToken, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name, arguments: args },
  }, sessionId);
  if (result.payload?.error) throw new Error(String(result.payload.error.message || "SP3ND MCP tool failed."));
  return result.payload?.result ?? null;
}

export type { Sp3ndOAuthTokens };
