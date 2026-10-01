import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type GateSession = { access?: boolean; codeId?: string; admin?: boolean };

const COOKIE_NAME = "turfmaster_session";

function getSecretKey() {
  const secret = process.env["SESSION_SECRET"] || "turfmaster_default_secret_key_32_bytes!!";
  return createHash("sha256").update(secret).digest();
}

export function encryptSession(data: GateSession): string {
  const key = getSecretKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const jsonStr = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(jsonStr, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSession(token: string): GateSession {
  try {
    const [ivHex, tagHex, encryptedHex] = token.split(":");
    if (!ivHex || !tagHex || !encryptedHex) return {};
    const key = getSecretKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    return JSON.parse(decrypted);
  } catch {
    return {};
  }
}

export async function getGateData(): Promise<GateSession> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return {};
  return decryptSession(raw);
}

export async function setGateData(data: GateSession) {
  const cookieStore = await cookies();
  const token = encryptSession(data);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearGateData() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export async function hasValidAccess(): Promise<boolean> {
  const data = await getGateData();
  if (data.admin) return true;
  if (!data.access || !data.codeId) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("access_codes").select("active, expires_at").eq("id", data.codeId).maybeSingle();
  const ok = !!row && row.active && (!row.expires_at || new Date(row.expires_at) > new Date());
  if (!ok) await clearGateData();
  return ok;
}

export async function requireAccess() {
  if (!(await hasValidAccess())) throw new Error("Accès refusé");
}

export async function requireAdmin() {
  const data = await getGateData();
  if (!data.admin) throw new Error("Admin requis");
}
