import type { NextRequest } from "next/server";

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;

  const binary = atob(padded + "=".repeat(pad));

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeJSON(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj));
}

function decodeJSON<T>(bytes: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

function getSecret(): string {
  return (
    process.env.JWT_SECRET ??
    "ghost-trade-insecure-default-secret-32ch"
  );
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"]
  );
}

export async function signToken(
  payload: Omit<JwtPayload, "iat" | "exp">
): Promise<string> {
  const header = b64urlEncode(
    encodeJSON({
      alg: "HS256",
      typ: "JWT",
    })
  );

  const now = Math.floor(Date.now() / 1000);
  const expires = now + 30 * 24 * 60 * 60;

  const body = b64urlEncode(
    encodeJSON({
      ...payload,
      iat: now,
      exp: expires,
    })
  );

  const key = await importHmacKey(getSecret());

  const sigBuf = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${body}`)
  );

  const sig = b64urlEncode(new Uint8Array(sigBuf));

  return `${header}.${body}.${sig}`;
}

export async function verifyToken(
  token: string
): Promise<JwtPayload> {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Malformed JWT");
  }

  const [header, body, sig] = parts;

  const key = await importHmacKey(getSecret());

  const valid = await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sig),
    new TextEncoder().encode(`${header}.${body}`)
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  const payload = decodeJSON<JwtPayload>(
    b64urlDecode(body)
  );

  if (
    payload.exp &&
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Token expired");
  }

  return payload;
}

export function getTokenFromRequest(
  req: NextRequest
): string | null {
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return req.cookies.get("gt_token")?.value ?? null;
}

export async function getUserFromRequest(
  req: NextRequest
): Promise<JwtPayload | null> {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } catch {
    return null;
  }
}