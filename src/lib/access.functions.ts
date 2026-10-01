"use server";

import { z } from "zod";
import { getGateData, setGateData, clearGateData, hasValidAccess, requireAdmin, safeEqual } from "./access.server";

export async function checkAccess() {
  const s = await getGateData();
  return { access: await hasValidAccess(), admin: !!s.admin };
}

export async function enterCode(code: string) {
  const parsed = z.string().trim().min(1).max(64).safeParse(code);
  if (!parsed.success) return { ok: false as const };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("access_codes")
    .select("id, active, expires_at")
    .eq("code", parsed.data.toUpperCase())
    .maybeSingle();

  if (!row || !row.active || (row.expires_at && new Date(row.expires_at) <= new Date())) {
    return { ok: false as const };
  }

  const s = await getGateData();
  await setGateData({ ...s, access: true, codeId: row.id });
  await supabaseAdmin.from("access_codes").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true as const };
}

export async function logout() {
  await clearGateData();
  return { ok: true };
}

export async function adminLogin(password: string) {
  const parsed = z.string().min(1).max(200).safeParse(password);
  if (!parsed.success) return { ok: false as const };

  const expected = process.env["ADMIN_PASSWORD"]?.trim();
  if (!expected || !safeEqual(parsed.data.trim(), expected)) return { ok: false as const };

  const s = await getGateData();
  await setGateData({ ...s, admin: true });
  return { ok: true as const };
}

export async function listCodes() {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("access_codes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}

export async function createCode(data: { label: string; code?: string; days: number }) {
  await requireAdmin();
  const schema = z.object({
    label: z.string().trim().max(100),
    code: z.string().trim().max(32).regex(/^[A-Za-z0-9-]*$/).optional(),
    days: z.number().int().min(0).max(3650),
  });
  const parsed = schema.parse(data);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const code = (parsed.code || randomCode()).toUpperCase();
  const expires_at = parsed.days > 0 ? new Date(Date.now() + parsed.days * 86400000).toISOString() : null;
  const { error } = await supabaseAdmin.from("access_codes").insert({ code, label: parsed.label, expires_at });
  if (error) throw new Error(error.code === "23505" ? "Ce code existe déjà" : error.message);
  return { code };
}

export async function toggleCode(data: { id: string; active: boolean }) {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("access_codes").update({ active: data.active }).eq("id", data.id);
  return { ok: true };
}

export async function deleteCode(id: string) {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("access_codes").delete().eq("id", id);
  return { ok: true };
}
