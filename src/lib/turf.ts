// Transformation identique à la macro VBA "Turf" (colonnes A → AX de Feuil1)
export type Row = {
  nom: string; num: number; age: number | ""; sexe: string; driver: string; corde: number | "";
  oeilleres: string; entraineur: string; musique: string; courses: number | ""; victoires: number | "";
  places: number | ""; gainCarriere: number | ""; gainVic: number | ""; gainPlace: number | "";
  gainAnnee: number | ""; gainAnneePrec: number | ""; supplement: number | ""; handDistance: number | "";
  cote: number | ""; ordreArrivee: number | ""; place2: number | ""; place3: number | "";
  handValeur: number | ""; jumentPleine: boolean | ""; engagement: boolean | ""; poids: number | "";
  poidsMonteChange: boolean | ""; distCourt: string; distLong: string;
  drTypePari: string; drRapport: number | ""; drType: string; drTendance: string; drNbTendance: number | "";
  drFavori: boolean | ""; drGrossePrise: boolean | "";
  rfTypePari: string; rfRapport: number | ""; rfType: string; rfTendance: string; rfNbTendance: number | "";
  rfFavori: boolean | ""; rfGrossePrise: boolean | "";
  allure: string; deferre: string; incident: string; inedit: boolean | ""; temps: number | ""; redKm: number | "";
  statut: string;
};

const v = (x: unknown) => (x === undefined || x === null ? "" : (x as any));

export function toRow(c: any): Row {
  const g = c.gainsParticipant ?? {};
  const dr = c.dernierRapportDirect ?? {};
  const rf = c.dernierRapportReference ?? {};
  const dc = c.distanceChevalPrecedent ?? {};
  const div = (n: unknown) => (typeof n === "number" ? n / 100 : "");
  return {
    nom: v(c.nom), num: v(c.numPmu), age: v(c.age), sexe: v(c.sexe), driver: v(c.driver),
    corde: v(c.placeCorde), oeilleres: v(c.oeilleres), entraineur: v(c.entraineur), musique: v(c.musique),
    courses: v(c.nombreCourses), victoires: v(c.nombreVictoires), places: v(c.nombrePlaces),
    gainCarriere: div(g.gainsCarriere), gainVic: div(g.gainsVictoires), gainPlace: div(g.gainsPlace),
    gainAnnee: div(g.gainsAnneeEnCours), gainAnneePrec: div(g.gainsAnneePrecedente),
    supplement: v(c.supplement), handDistance: v(c.handicapDistance), cote: v(dr.rapport),
    ordreArrivee: v(c.ordreArrivee), place2: v(c.nombrePlacesSecond), place3: v(c.nombrePlacesTroisieme),
    handValeur: v(c.handicapValeur), jumentPleine: v(c.jumentPleine), engagement: v(c.engagement),
    poids: typeof c.handicapPoids === "number" ? c.handicapPoids / 10 : "",
    poidsMonteChange: v(c.poidsConditionMonteChange), distCourt: v(dc.libelleCourt), distLong: v(dc.libelleLong),
    drTypePari: v(dr.typePari), drRapport: v(dr.rapport), drType: v(dr.typeRapport), drTendance: v(dr.indicateurTendance),
    drNbTendance: v(dr.nombreIndicateurTendance), drFavori: v(dr.favoris), drGrossePrise: v(dr.grossePrise),
    rfTypePari: v(rf.typePari), rfRapport: v(rf.rapport), rfType: v(rf.typeRapport), rfTendance: v(rf.indicateurTendance),
    rfNbTendance: v(rf.nombreIndicateurTendance), rfFavori: v(rf.favoris), rfGrossePrise: v(rf.grossePrise),
    allure: v(c.allure), deferre: v(c.deferre), incident: v(c.incident), inedit: v(c.indicateurInedit),
    temps: v(c.tempsObtenu), redKm: v(c.reductionKilometrique), statut: v(c.statut),
  };
}

// En-têtes Feuil1 (ligne 19) — dans l'ordre exact des colonnes
export const FEUIL1_COLS: { key: keyof Row; label: string; group: string }[] = [
  { key: "nom", label: "Nom Cheval", group: "Donnée cheval / Musique" },
  { key: "num", label: "N°", group: "Donnée cheval / Musique" },
  { key: "age", label: "Age", group: "Donnée cheval / Musique" },
  { key: "sexe", label: "Sexe", group: "Donnée cheval / Musique" },
  { key: "driver", label: "Jockey/Drivers", group: "Donnée cheval / Musique" },
  { key: "corde", label: "Corde", group: "Donnée cheval / Musique" },
  { key: "oeilleres", label: "Oeilleres", group: "Donnée cheval / Musique" },
  { key: "entraineur", label: "Entraineur", group: "Donnée cheval / Musique" },
  { key: "musique", label: "Musique", group: "Donnée cheval / Musique" },
  { key: "courses", label: "Nombr Courses", group: "Nombre course/Vic/place" },
  { key: "victoires", label: "Nombr Vic", group: "Nombre course/Vic/place" },
  { key: "places", label: "Nombr Place", group: "Nombre course/Vic/place" },
  { key: "gainCarriere", label: "Gain Carrière", group: "Gain Carrière" },
  { key: "gainVic", label: "Gain Vic", group: "Gain Carrière" },
  { key: "gainPlace", label: "Gain Place", group: "Gain Carrière" },
  { key: "gainAnnee", label: "Gain Année Cours", group: "Gain Carrière" },
  { key: "gainAnneePrec", label: "Gain Année Préc", group: "Gain Carrière" },
  { key: "supplement", label: "Chev Supplement", group: "Gain Carrière" },
  { key: "handDistance", label: "HandDistance", group: "Gain Carrière" },
  { key: "cote", label: "Rapport Cote", group: "Cote" },
  { key: "ordreArrivee", label: "Ordre Arrivé", group: "Derniére P" },
  { key: "place2", label: "Nombr place 2ém", group: "Place 2ém/3éme" },
  { key: "place3", label: "Nombr place 3éme", group: "Place 2ém/3éme" },
  { key: "handValeur", label: "Hand Valeur", group: "Valeur" },
  { key: "jumentPleine", label: "Jument Pleine", group: "Valeur" },
  { key: "engagement", label: "Engagement", group: "Valeur" },
  { key: "poids", label: "Poids", group: "Poids" },
  { key: "poidsMonteChange", label: "Poids monte change", group: "Poids" },
  { key: "distCourt", label: "Distance Cheval", group: "Distance Cheval Précedent" },
  { key: "distLong", label: "Distance Chev2", group: "Distance Cheval Précedent" },
  { key: "drTypePari", label: "Type pari", group: "Dernier Rapport Direct" },
  { key: "drRapport", label: "Rapport", group: "Dernier Rapport Direct" },
  { key: "drType", label: "Type rapport", group: "Dernier Rapport Direct" },
  { key: "drTendance", label: "Tendance", group: "Dernier Rapport Direct" },
  { key: "drNbTendance", label: "Nb tendance", group: "Dernier Rapport Direct" },
  { key: "drFavori", label: "Favori", group: "Dernier Rapport Direct" },
  { key: "drGrossePrise", label: "Grosse prise", group: "Dernier Rapport Direct" },
  { key: "rfTypePari", label: "Type pari", group: "Dernier Rapport Reference" },
  { key: "rfRapport", label: "Rapport", group: "Dernier Rapport Reference" },
  { key: "rfType", label: "Type rapport", group: "Dernier Rapport Reference" },
  { key: "rfTendance", label: "Tendance", group: "Dernier Rapport Reference" },
  { key: "rfNbTendance", label: "Nb tendance", group: "Dernier Rapport Reference" },
  { key: "rfFavori", label: "Favori", group: "Dernier Rapport Reference" },
  { key: "rfGrossePrise", label: "Grosse prise", group: "Dernier Rapport Reference" },
  { key: "allure", label: "Allure", group: "Indice Trot" },
  { key: "deferre", label: "Déferré", group: "Indice Trot" },
  { key: "incident", label: "Incident", group: "Indice Trot" },
  { key: "inedit", label: "Inédit", group: "Indice Trot" },
  { key: "temps", label: "Temps obtenu", group: "Indice Trot" },
  { key: "redKm", label: "Réd. km", group: "Indice Trot" },
];

export const fmtNum = (n: number | "", dec = 0) =>
  n === "" ? "" : n.toLocaleString("fr-FR", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
export const fmtEur = (n: number | "") => (n === "" ? "" : `${fmtNum(n)} €`);
export const fmtCell = (x: unknown) => {
  if (x === "" || x === null || x === undefined) return "";
  if (typeof x === "boolean") return x ? "VRAI" : "FAUX";
  if (typeof x === "number") return fmtNum(x, 2);
  return String(x);
};

// Chrono "1'17''1" à partir d'une réduction kilométrique en ms
export function fmtChrono(ms?: number | null) {
  if (!ms || ms <= 0) return "";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const d = Math.floor((ms % 1000) / 100);
  return `${m}'${String(s).padStart(2, "0")}''${d}`;
}

export function toPmuDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
}

// Analyse de la musique : places des dernières courses
export function parseMusique(m: string) {
  const clean = m.replace(/\(\d+\)/g, "");
  const tokens = clean.match(/[0-9DATR][a-z]/gi) ?? [];
  return tokens.map((t) => (t[0] ?? "").toUpperCase());
}
export function musiqueScore(m: string) {
  const p = parseMusique(m).slice(0, 5);
  if (!p.length) return 0;
  const pts = p.map((x) => {
    const n = Number(x);
    if (x === "0") return 0;
    if (!Number.isNaN(n)) return Math.max(0, 11 - n * 2);
    return 0;
  });
  return Math.round((pts.reduce((a, b) => a + b, 0) / (p.length * 9)) * 100);
}

export type Perf = {
  num: number;
  bestChrono: number | null;
  lastChrono: number | null;
  last: string;
  sexeAge: string;
};

export function toPerf(p: any): Perf {
  const cc: any[] = p.coursesCourues ?? [];
  let best: number | null = null;
  let last: number | null = null;
  let lastTxt = "";
  cc.forEach((c, i) => {
    const me = (c.participants ?? []).find((x: any) => x.itsHim);
    const rk = me?.reductionKilometrique;
    if (typeof rk === "number" && rk > 0) {
      if (best === null || rk < best) best = rk;
      if (last === null) last = rk;
    }
    if (i === 0 && me) {
      const dt = new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const pl = me.place?.place ? `${me.place.place}ème` : me.place?.rawValue ?? "";
      lastTxt = `${dt} - ${c.hippodrome ?? ""} ${c.distance ?? ""}m, ${pl}`;
    }
  });
  return { num: p.numPmu, bestChrono: best, lastChrono: last, last: lastTxt, sexeAge: "" };
}

// Indice TurfMaster (forme 35 %, victoire 25 %, place 15 %, cote 25 %)
export function indice(r: Row) {
  const n = typeof r.courses === "number" ? r.courses : 0;
  const tv = n > 0 ? ((Number(r.victoires) || 0) / n) * 100 : 0;
  const tp = n > 0 ? ((Number(r.places) || 0) / n) * 100 : 0;
  const c = typeof r.cote === "number" ? r.cote : 999;
  const coteScore = c >= 999 ? 0 : Math.max(0, 100 - c * 3);
  return { tv, tp, total: Math.round(musiqueScore(r.musique) * 0.35 + tv * 0.25 + tp * 0.15 + coteScore * 0.25) };
}

// Points et rang automatiques : rang 1 = meilleur indice, non-partants en dernier
export function autoPointsRang(rows: Row[]) {
  const list = rows.map((r) => ({ num: r.num, pts: r.statut === "NON_PARTANT" ? 0 : indice(r).total }));
  const sorted = [...list].sort((a, b) => b.pts - a.pts);
  const map = new Map<number, { p: number; r: number }>();
  sorted.forEach((x, i) => map.set(x.num, { p: x.pts, r: i + 1 }));
  return map;
}
