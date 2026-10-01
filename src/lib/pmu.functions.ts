"use server";

import { z } from "zod";
import { requireAccess } from "./access.server";

const dateSchema = z.string().regex(/^\d{8}$/);
const courseSchema = z.object({
  date: dateSchema,
  reunion: z.number().int().min(1).max(99),
  course: z.number().int().min(1).max(99),
});

const HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "fr-FR,fr;q=0.9",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Referer: "https://www.pmu.fr/",
};
const HOSTS = ["online.turfinfo.api.pmu.fr", "tablette.turfinfo.api.pmu.fr", "offline.turfinfo.api.pmu.fr"];

export async function getJson(url: string) {
  const path = url.replace(/^https:\/\/[^/]+/, "");
  let last = "";
  for (const host of HOSTS) {
    try {
      const res = await fetch(`https://${host}${path}`, { headers: HEADERS });
      if (res.ok) return res.json();
      last = `[${res.status}] ${host}`;
      console.error("PMU", last);
    } catch (e) {
      last = `${host}: ${String(e)}`;
    }
  }
  throw new Error(`PMU indisponible ${last}`);
}

export type Course = { num: number; libelle: string; heure: number; discipline: string; distance: number; partants: number; statut: string; prix: number; arrivee: number[][] };
export type Reunion = { num: number; hippodrome: string; pays: string; courses: Course[] };

export async function getProgramme(params: { date: string }) {
  await requireAccess();
  const date = dateSchema.parse(params.date);
  const json = await getJson(
    `https://online.turfinfo.api.pmu.fr/rest/client/1/programme/${date}`,
  );
  const reunions: Reunion[] = (json?.programme?.reunions ?? []).map((r: any) => ({
    num: r.numOfficiel as number,
    hippodrome: (r.hippodrome?.libelleCourt ?? "") as string,
    pays: (r.pays?.libelle ?? "") as string,
    courses: (r.courses ?? []).map((c: any) => ({
      num: c.numOrdre as number,
      libelle: (c.libelle ?? "") as string,
      heure: (c.heureDepart ?? 0) as number,
      discipline: (c.discipline ?? "") as string,
      distance: (c.distance ?? 0) as number,
      partants: (c.nombreDeclaresPartants ?? 0) as number,
      statut: (c.statut ?? "") as string,
      prix: (c.montantPrix ?? 0) as number,
      arrivee: (c.ordreArrivee ?? []) as number[][],
    })),
  }));
  return { reunions };
}

export async function getParticipants(params: { date: string; reunion: number; course: number }) {
  await requireAccess();
  const parsed = courseSchema.parse(params);
  const json = await getJson(
    `https://tablette.turfinfo.api.pmu.fr/rest/client/1/programme/${parsed.date}/R${parsed.reunion}/C${parsed.course}/participants`,
  );
  return { participants: (json?.participants ?? []) as any[] };
}

export async function getPerformances(params: { date: string; reunion: number; course: number }) {
  await requireAccess();
  const parsed = courseSchema.parse(params);
  try {
    const json = await getJson(
      `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${parsed.date}/R${parsed.reunion}/C${parsed.course}/performances-detaillees/pretty`,
    );
    return { participants: (json?.participants ?? []) as any[] };
  } catch {
    return { participants: [] as any[] };
  }
}
