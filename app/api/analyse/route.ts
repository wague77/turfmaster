import { NextRequest } from "next/server";
import { z } from "zod";
import { hasValidAccess } from "@/lib/access.server";

const Body = z.object({
  course: z.string().max(2000),
  partants: z.string().min(10).max(30000),
  ids: z.object({ date: z.string().regex(/^\d{8}$/), reunion: z.number().int().min(1).max(99), course: z.number().int().min(1).max(99) }).optional(),
});

type J = any;
const d = (ms: number) => new Date(ms).toLocaleDateString("fr-FR");

async function details(ids: { date: string; reunion: number; course: number }) {
  const { getJson } = await import("@/lib/pmu.functions");
  const base = `https://online.turfinfo.api.pmu.fr/rest/client/1/programme/${ids.date}/R${ids.reunion}/C${ids.course}`;
  const [c, part, perf] = await Promise.all([
    getJson(base).catch(() => null) as Promise<J | null>,
    getJson(`${base}/participants`).catch(() => null) as Promise<J | null>,
    getJson(`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ids.date}/R${ids.reunion}/C${ids.course}/performances-detaillees/pretty`).catch(() => null) as Promise<J | null>,
  ]);
  const out: string[] = [];
  const dist = Number(c?.distance) || 0;
  if (c) {
    out.push(`CONTEXTE : ${c.discipline ?? ""} ${c.specialite ?? ""}, ${c.categorieParticularite ?? ""}, ${c.parcours ?? dist + " m"}, piste ${c.typePiste ?? "?"}, corde ${c.corde ?? "?"}, terrain ${c.penetrometre ? `${c.penetrometre.intitule} (pénétromètre ${c.penetrometre.valeurMesure})` : "non communiqué"}, allocation ${c.montantPrix ?? "?"} €.`);
    if (c.conditions) out.push(`Conditions : ${c.conditions}`);
  }
  const perfs = new Map<number, J[]>(((perf?.participants ?? []) as J[]).map((p) => [p.numPmu, p.coursesCourues ?? []]));
  for (const p of (part?.participants ?? []) as J[]) {
    if (p.statut === "NON_PARTANT") { out.push(`\n${p.numPmu} – ${p.nom} : NON PARTANT`); continue; }
    const poids = p.handicapPoids ? `${p.handicapPoids / 10} kg` : "n.c.";
    out.push(`\n${p.numPmu} – ${p.nom} | poids ${poids}${p.handicapValeur ? `, valeur handicap ${p.handicapValeur}` : ""}${p.poidsConditionMonteChange ? " (poids modifié)" : ""} | oeillères ${p.oeilleres ?? "?"}${p.driverChange ? " | CHANGEMENT de jockey/driver" : ""}${p.indicateurInedit ? " | INÉDIT" : ""}`);
    out.push(`  Stats carrière : ${p.nombreCourses} courses, ${p.nombreVictoires} victoires, ${p.nombrePlacesSecond ?? 0} 2e, ${p.nombrePlacesTroisieme ?? 0} 3e, ${p.nombrePlaces} places au total (top 3 PMU) | origines ${p.nomPere ?? "?"} x ${p.nomMere ?? "?"} | propriétaire ${p.proprietaire ?? "?"} | éleveur ${p.eleveur ?? "?"}`);
    if (p.commentaireApresCourse?.texte) out.push(`  Commentaire dernière course : ${p.commentaireApresCourse.texte}`);
    const hist = (perfs.get(p.numPmu) ?? []).slice(0, 6);
    let aDist = 0, aPlace = 0, sameJock = 0;
    for (const h of hist) {
      const me = (h.participants ?? []).find((x: J) => x.itsHim) ?? {};
      if (dist && Math.abs((h.distance ?? 0) - dist) <= 300) { aDist++; if ((me.place?.place ?? 99) <= 3) aPlace++; }
      if (p.driver && me.nomJockey === p.driver) sameJock++;
      out.push(`  - ${d(h.date)} ${h.hippodrome} ${h.discipline} ${h.distance} m, terrain ${h.etatTerrain ?? "?"}, ${h.nbParticipants} partants : ${me.place?.rawValue ?? me.place?.place ?? "?"}${me.distanceAvecPrecedent?.libelleCourt ? ` (${me.distanceAvecPrecedent.libelleCourt})` : ""}, ${me.nomJockey ?? "?"}${me.poidsJockey ? ` ${me.poidsJockey} kg` : ""}${me.reductionKilometrique ? `, réd. ${(me.reductionKilometrique / 1000).toFixed(1)}` : ""}`);
    }
    if (hist.length) out.push(`  Aptitude distance (±300 m) : ${aDist} course(s), ${aPlace} dans les 3 | même jockey/driver qu'aujourd'hui sur ${sameJock}/${hist.length} dernières sorties`);
  }
  return out.join("\n");
}

const SYSTEM = `Tu es un analyste hippique expert (PMU, trot et galop). À partir UNIQUEMENT des données fournies (partants, musique, cotes, gains, statistiques), produis une analyse factuelle des favoris.
Rappel musique : chiffre = place (0 = au-delà de la 10e), D = disqualifié, A = arrêté, T = tombé, R = rétrogradé ; lettre = discipline (a attelé, m monté, p plat, h haies, s steeple, c cross) ; (24) = année ; toute autre lettre (ex. J) = résultat non classé ou code non officiel, à traiter comme mauvaise performance.
Les « places » = nombre d'arrivées dans les 3 premiers sur toute la carrière (statistique PMU officielle). Utilise le terrain, les poids, l'historique détaillé, l'aptitude à la distance et le changement d'entourage fournis.
Format en français, texte simple sans tableau :
1. Classement des 5 principaux prétendants : pour chacun "N° – Nom", puis 2 à 4 raisons précises tirées des données (citer la musique, la cote, les taux).
2. Outsider(s) à surveiller avec justification.
3. Chevaux à écarter et pourquoi.
4. Pronostic final sous la forme : 3 - 7 - 1 - 9 - 5.
5. Limites : seulement si une donnée importante manque réellement (une phrase).
Ne pas inventer d'information absente. Rester concis (moins de 450 mots).`;

export async function POST(request: NextRequest) {
  if (!(await hasValidAccess())) return new Response("Accès refusé", { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Données invalides", { status: 400 });
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("Clé IA manquante", { status: 500 });
  const extra = parsed.data.ids ? await details(parsed.data.ids).catch(() => "") : "";
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      signal: request.signal,
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: `Course : ${parsed.data.course}\n\nPartants :\n${parsed.data.partants}${extra ? `\n\nDONNÉES PMU DÉTAILLÉES :\n${extra}` : ""}`,
        stream: true,
        store: false,
        reasoning: { effort: "medium", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI", res.status, t);
      let msg = "Analyse indisponible";
      try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? msg; } catch { /* */ }
      if (res.status === 402) msg = "Crédits IA épuisés : ajoutez des crédits à l'espace de travail.";
      if (res.status === 429) msg = "Trop de demandes, réessayez dans un instant.";
      return new Response(msg, { status: res.status });
    }
    return new Response(res.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" } });
  } catch (e) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    throw e;
  }
}
