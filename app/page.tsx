"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/lib/access.functions";
import { getParticipants, getPerformances, getProgramme } from "@/lib/pmu.functions";
import {
  FEUIL1_COLS,
  fmtCell,
  fmtChrono,
  fmtEur,
  fmtNum,
  musiqueScore,
  parseMusique,
  toPerf,
  toPmuDate,
  toRow,
  indice,
  autoPointsRang,
  type Row,
} from "@/lib/turf";
import mark from "@/assets/turfmaster-mark.png";
import logo from "@/assets/turfmaster-logo.png";

const TABS = [
  { id: "feuil1", label: "Feuil1", sub: "Données" },
  { id: "feuil2", label: "Feuil2", sub: "Cotes" },
  { id: "feuil3", label: "Feuil3", sub: "Fiche & points" },
  { id: "sheet2", label: "Sheet2", sub: "Musique & chronos" },
  { id: "sheet3", label: "Sheet3", sub: "Performances" },
  { id: "sheet4", label: "Sheet4", sub: "Synthèse" },
  { id: "sheet1", label: "Sheet1", sub: "Partants" },
  { id: "ia", label: "Analyse IA", sub: "Prétendants" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function toInputDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [dateStr, setDateStr] = useState("");
  const [reunion, setReunion] = useState(1);
  const [course, setCourse] = useState(1);
  const [tab, setTab] = useState<TabId>("feuil1");

  useEffect(() => setDateStr(toInputDate(new Date())), []);
  const pmuDate = dateStr ? toPmuDate(new Date(dateStr + "T12:00:00")) : "";

  const prog = useQuery({
    queryKey: ["prog", pmuDate],
    queryFn: () => getProgramme({ date: pmuDate }),
    enabled: !!pmuDate,
    staleTime: 60_000,
  });
  const params = { date: pmuDate, reunion, course };
  const part = useQuery({
    queryKey: ["part", pmuDate, reunion, course],
    queryFn: () => getParticipants(params),
    enabled: !!pmuDate,
  });
  const perf = useQuery({
    queryKey: ["perf", pmuDate, reunion, course],
    queryFn: () => getPerformances(params),
    enabled: !!pmuDate,
  });

  const reunions = prog.data?.reunions ?? [];
  const curReunion = reunions.find((r) => r.num === reunion);
  const curCourse = curReunion?.courses.find((c) => c.num === course);

  useEffect(() => {
    if (reunions.length && !curReunion) {
      setReunion(reunions[0]!.num);
      setCourse(reunions[0]!.courses[0]?.num ?? 1);
    }
  }, [reunions, curReunion]);

  const rows = useMemo(() => (part.data?.participants ?? []).map(toRow), [part.data]);
  const perfs = useMemo(() => new Map((perf.data?.participants ?? []).map((p) => [p["numPmu"] as number, toPerf(p)] as const)), [perf.data]);

  const markSrc = typeof mark === "string" ? mark : mark.src;
  const logoSrc = typeof logo === "string" ? logo : logo.src;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={markSrc} alt="Logo TurfMaster" width={44} height={44} className="h-11 w-11" />
            <div>
              <div className="font-display text-2xl font-bold leading-none text-primary">TurfMaster</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Analyse PMU</div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-end gap-3">
            <Field label="Date">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-2 font-mono text-sm [color-scheme:dark]"
              />
            </Field>
            <Field label="Réunion">
              <select
                value={reunion}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setReunion(n);
                  setCourse(reunions.find((r) => r.num === n)?.courses[0]?.num ?? 1);
                }}
                className="h-9 max-w-[220px] rounded-md border border-input bg-card px-2 text-sm"
              >
                {reunions.length === 0 && <option value={reunion}>R{reunion}</option>}
                {reunions.map((r) => (
                  <option key={r.num} value={r.num}>
                    R{r.num} · {r.hippodrome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Course">
              <select
                value={course}
                onChange={(e) => setCourse(Number(e.target.value))}
                className="h-9 max-w-[260px] rounded-md border border-input bg-card px-2 text-sm"
              >
                {!curReunion && <option value={course}>C{course}</option>}
                {curReunion?.courses.map((c) => (
                  <option key={c.num} value={c.num}>
                    C{c.num} · {c.libelle}
                  </option>
                ))}
              </select>
            </Field>
            <button
              onClick={() => {
                part.refetch();
                perf.refetch();
                prog.refetch();
              }}
              className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              {part.isFetching ? "Chargement…" : "Actualiser"}
            </button>
            <Link href="/calculatrice" className="h-9 rounded-md border border-border px-3 text-sm leading-9 text-muted-foreground hover:text-foreground">
              Calculatrice
            </Link>
            <Link href="/admin" className="h-9 rounded-md border border-border px-3 text-sm leading-9 text-muted-foreground hover:text-foreground">
              Admin
            </Link>
            <button
              onClick={async () => {
                await logout();
                window.location.href = "/acces";
              }}
              className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-5">
        <RaceBanner reunion={curReunion} course={curCourse} r={reunion} c={course} count={rows.length} />

        <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-t-lg border border-b-0 px-4 py-2 text-left transition ${tab === t.id ? "border-border bg-card text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <div className="font-mono text-xs font-semibold">{t.label}</div>
              <div className="text-[11px]">{t.sub}</div>
            </button>
          ))}
        </nav>

        <section className="rounded-b-xl rounded-tr-xl border border-t-0 border-border bg-card p-3">
          {part.isError ? (
            String(part.error?.message ?? "").includes("PMU indisponible") ? (
              <Empty logoSrc={logoSrc} title="Serveur PMU injoignable" text="Le PMU refuse temporairement la connexion. Cliquez sur « Actualiser » dans quelques instants." />
            ) : (
              <Empty logoSrc={logoSrc} title="Course introuvable" text={`Aucun partant pour R${reunion}C${course} le ${dateStr}. Choisissez une autre réunion ou course.`} />
            )
          ) : part.isLoading || !pmuDate ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty logoSrc={logoSrc} title="Aucune donnée" text="Cette course n'a pas encore de partants publiés." />
          ) : (
            <>
              {tab === "feuil1" && <Feuil1 rows={rows} />}
              {tab === "feuil2" && <Feuil2 rows={rows} />}
              {tab === "feuil3" && <Feuil3 rows={rows} storageKey={`${pmuDate}-R${reunion}C${course}`} />}
              {tab === "sheet2" && <Sheet2 rows={rows} perfs={perfs} />}
              {tab === "sheet3" && <Sheet3 rows={rows} perfs={perfs} distance={curCourse?.distance} loading={perf.isLoading} />}
              {tab === "sheet4" && <Sheet4 rows={rows} />}
              {tab === "sheet1" && <Sheet1 rows={rows} />}
              {tab === "ia" && (
                <AnalyseIA
                  key={`${pmuDate}-${reunion}-${course}`}
                  rows={rows}
                  ids={{ date: pmuDate, reunion, course }}
                  course={
                    curCourse
                      ? `R${reunion}C${course} ${curReunion?.hippodrome ?? ""} – ${curCourse.libelle}, ${curCourse.discipline}, ${curCourse.distance} m, ${curCourse.partants} partants`
                      : `R${reunion}C${course}`
                  }
                />
              )}
            </>
          )}
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">Données issues du programme officiel PMU · Jouer comporte des risques.</p>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

function Empty({ logoSrc, title, text }: { logoSrc: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <img src={logoSrc} alt="" width={260} height={200} loading="lazy" className="w-48 opacity-80" />
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RaceBanner({ reunion, course, r, c, count }: any) {
  const heure = course?.heure ? new Date(course.heure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—";
  const arrivee = course?.arrivee?.flat?.() ?? [];
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-primary font-mono text-2xl font-bold text-primary-foreground">
        R{r}C{c}
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{reunion?.hippodrome ?? "Hippodrome"}</div>
        <h1 className="font-display text-2xl font-bold">{course?.libelle ?? "Sélectionnez une course"}</h1>
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          {[heure, course?.discipline, course?.distance ? `${fmtNum(course.distance)} m` : null, course?.prix ? fmtEur(course.prix) : null, `${count} partants`]
            .filter(Boolean)
            .map((x, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                {x}
              </span>
            ))}
        </div>
      </div>
      {arrivee.length > 0 && (
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Arrivée</div>
          <div className="mt-1 flex gap-1">
            {arrivee.slice(0, 5).map((n: number, i: number) => (
              <Num key={i} n={n} gold={i === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Num({ n, gold }: { n: number | ""; gold?: boolean }) {
  return (
    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1 font-mono text-sm font-semibold ${gold ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
      {n}
    </span>
  );
}

function Musique({ m }: { m: string }) {
  const p = parseMusique(m).slice(0, 8);
  if (!p.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex gap-0.5" title={m}>
      {p.map((x, i) => (
        <span
          key={i}
          className={`h-5 w-5 rounded-sm text-center font-mono text-[11px] font-semibold leading-5 ${x === "1" ? "bg-primary text-primary-foreground" : ["2", "3"].includes(x) ? "bg-success/70 text-background" : /\d/.test(x) && x !== "0" ? "bg-secondary text-foreground" : "bg-destructive/60 text-foreground"}`}
        >
          {x}
        </span>
      ))}
    </span>
  );
}

function Table({ head, children, groups }: { head: string[]; children: React.ReactNode; groups?: { label: string; span: number }[] }) {
  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-secondary text-xs">
          {groups && (
            <tr>
              {groups.map((g, i) => (
                <th key={i} colSpan={g.span} className="border-b border-r border-border px-2 py-1.5 text-center font-display text-primary">
                  {g.label}
                </th>
              ))}
            </tr>
          )}
          <tr>
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap border-b border-r border-border px-2 py-2 text-center font-semibold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:nth-child(even)]:bg-background/40 [&_tr:hover]:bg-primary/10 [&_td]:border-r [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:text-center [&_td]:whitespace-nowrap">
          {children}
        </tbody>
      </table>
    </div>
  );
}

function Feuil1({ rows }: { rows: Row[] }) {
  const groups: { label: string; span: number }[] = [];
  FEUIL1_COLS.forEach((c) => {
    const g = groups[groups.length - 1];
    if (g && g.label === c.group) g.span++;
    else groups.push({ label: c.group, span: 1 });
  });
  return (
    <Table head={FEUIL1_COLS.map((c) => c.label)} groups={groups}>
      {rows.map((r) => (
        <tr key={r.num} className={r.statut === "NON_PARTANT" ? "opacity-40 line-through" : ""}>
          {FEUIL1_COLS.map((c) => (
            <td
              key={c.key}
              className={c.key === "nom" ? "sticky left-0 bg-card text-left font-semibold" : c.key === "cote" ? "font-mono font-semibold text-primary" : "font-mono text-xs"}
            >
              {c.key === "num" ? <Num n={r.num} /> : c.key.startsWith("gain") ? fmtEur(r[c.key] as number) : fmtCell(r[c.key])}
            </td>
          ))}
        </tr>
      ))}
    </Table>
  );
}

const cote = (r: Row) => (typeof r.cote === "number" ? r.cote : 999);

function Feuil2({ rows }: { rows: Row[] }) {
  const sorted = [...rows].sort((a, b) => cote(a) - cote(b));
  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Table head={["n°", "COTES MATIN", "COTES DIRECT", "MUSIQUE", "Tendance"]}>
        {rows.map((r) => {
          const diff = typeof r.rfRapport === "number" && typeof r.drRapport === "number" ? r.drRapport - r.rfRapport : 0;
          return (
            <tr key={r.num}>
              <td>
                <Num n={r.num} />
              </td>
              <td className="font-mono">{fmtCell(r.rfRapport)}</td>
              <td className="font-mono font-semibold text-primary">{fmtCell(r.drRapport)}</td>
              <td className="!text-left">
                <Musique m={r.musique} />
              </td>
              <td className={`font-mono text-xs ${diff < 0 ? "text-success" : diff > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {diff < 0 ? "▼ en baisse" : diff > 0 ? "▲ en hausse" : "="}
              </td>
            </tr>
          );
        })}
      </Table>
      <div>
        <h3 className="mb-2 font-display text-lg text-primary">Classement par cote</h3>
        <Table head={["Rang", "numéros", "noms", "cotes", "MUSIQUE"]}>
          {sorted.map((r, i) => (
            <tr key={r.num}>
              <td className="font-mono text-muted-foreground">{i + 1}</td>
              <td>
                <Num n={r.num} gold={i === 0} />
              </td>
              <td className="!text-left font-semibold">{r.nom}</td>
              <td className="font-mono text-primary">{fmtCell(r.cote)}</td>
              <td className="!text-left">
                <Musique m={r.musique} />
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}

function Feuil3({ rows, storageKey }: { rows: Row[]; storageKey: string }) {
  const [pts, setPts] = useState<Record<number, { p?: string; r?: string }>>({});
  useEffect(() => {
    try {
      setPts(JSON.parse(localStorage.getItem("turf-pts-" + storageKey) ?? "{}"));
    } catch {
      setPts({});
    }
  }, [storageKey]);
  const autoMap = useMemo(() => autoPointsRang(rows), [rows]);
  const save = (next: typeof pts) => {
    setPts(next);
    localStorage.setItem("turf-pts-" + storageKey, JSON.stringify(next));
  };
  const update = (num: number, k: "p" | "r", val: string) => save({ ...pts, [num]: { ...pts[num], [k]: val } });
  const sorted = [...rows].sort((a, b) => (autoMap.get(a.num)?.r ?? 99) - (autoMap.get(b.num)?.r ?? 99));
  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Points et rang sont remplis automatiquement (indice TurfMaster). Vous pouvez modifier une case ; « Recalculer » remet les valeurs automatiques.</p>
        <button onClick={() => save({})} className="h-8 rounded-md border border-primary/50 px-3 text-xs text-primary hover:bg-primary/10">
          Recalculer
        </button>
      </div>
      <Table head={["noms", "numeros", "age", "sexe", "driver", "entreneur", "musique", "gains", "cotes", "Note forme", "Points", "Rang"]}>
        {sorted.map((r) => {
          const a = autoMap.get(r.num);
          return (
            <tr key={r.num}>
              <td className="!text-left font-semibold">{r.nom}</td>
              <td>
                <Num n={r.num} gold={a?.r === 1} />
              </td>
              <td>{r.age}</td>
              <td className="text-xs">{r.sexe}</td>
              <td className="text-xs">{r.driver}</td>
              <td className="text-xs">{r.entraineur}</td>
              <td className="!text-left">
                <Musique m={r.musique} />
              </td>
              <td className="font-mono text-xs">{fmtEur(r.gainCarriere)}</td>
              <td className="font-mono text-primary">{fmtCell(r.cote)}</td>
              <td>
                <Bar v={musiqueScore(r.musique)} />
              </td>
              <td>
                <input
                  value={pts[r.num]?.p ?? String(a?.p ?? "")}
                  onChange={(e) => update(r.num, "p", e.target.value)}
                  inputMode="numeric"
                  aria-label={`Points ${r.nom}`}
                  className="h-7 w-16 rounded border border-input bg-background text-center font-mono text-sm"
                />
              </td>
              <td>
                <input
                  value={pts[r.num]?.r ?? String(a?.r ?? "")}
                  onChange={(e) => update(r.num, "r", e.target.value)}
                  inputMode="numeric"
                  aria-label={`Rang ${r.nom}`}
                  className="h-7 w-14 rounded border border-input bg-background text-center font-mono text-sm font-semibold text-primary"
                />
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

function Bar({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}

function Sheet2({ rows, perfs }: { rows: Row[]; perfs: Map<number, ReturnType<typeof toPerf>> }) {
  return (
    <Table head={["N°", "MUSIQUE", "COTES", "CHRONOS (record)", "Dernier chrono", "age"]}>
      {rows.map((r) => {
        const p = perfs.get(r.num);
        return (
          <tr key={r.num}>
            <td>
              <Num n={r.num} />
            </td>
            <td className="!text-left">
              <Musique m={r.musique} />
            </td>
            <td className="font-mono text-primary">{fmtCell(r.cote)}</td>
            <td className="font-mono font-semibold">{fmtChrono(p?.bestChrono) || "—"}</td>
            <td className="font-mono text-xs">{fmtChrono(p?.lastChrono) || "—"}</td>
            <td>{r.age}</td>
          </tr>
        );
      })}
    </Table>
  );
}

function Sheet3({ rows, perfs, distance, loading }: any) {
  const sx = (s: string) => (s?.[0] === "F" ? "F" : s?.[0] === "H" ? "H" : "M");
  return (
    <Table head={["N°", "Cheval", "Sexe/Âge", "Distance", "Driver", "Chrono", "Dernière course"]}>
      {(rows as Row[]).map((r) => {
        const p = perfs.get(r.num);
        return (
          <tr key={r.num}>
            <td>
              <Num n={r.num} />
            </td>
            <td className="!text-left font-semibold">{r.nom}</td>
            <td className="font-mono">
              {sx(r.sexe)}
              {r.age}
            </td>
            <td className="font-mono">{fmtNum((distance ?? 0) + (typeof r.handDistance === "number" ? 0 : 0))}</td>
            <td className="text-xs">{r.statut === "NON_PARTANT" ? "Non-partant" : r.driver}</td>
            <td className="font-mono">{loading ? "…" : fmtChrono(p?.bestChrono) || "—"}</td>
            <td className="!text-left text-xs">{p?.last || "—"}</td>
          </tr>
        );
      })}
    </Table>
  );
}

function Sheet4({ rows }: { rows: Row[] }) {
  const scored = rows.map((r) => ({ r, ...indice(r) }));
  const top = [...scored].filter((s) => s.r.statut !== "NON_PARTANT").sort((a, b) => b.total - a.total).slice(0, 5);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Table head={["numéros", "AGE", "COTES", "VICTOIRE", "PLACE", "DRIVER", "% Vic", "% Place", "Indice"]}>
        {scored.map(({ r, tv, tp, total }) => (
          <tr key={r.num}>
            <td>
              <Num n={r.num} />
            </td>
            <td>{r.age}</td>
            <td className="font-mono text-primary">{fmtCell(r.cote)}</td>
            <td className="font-mono">{r.victoires}</td>
            <td className="font-mono">{r.places}</td>
            <td className="text-xs">{r.driver}</td>
            <td className="font-mono text-xs">{fmtNum(tv, 0)}%</td>
            <td className="font-mono text-xs">{fmtNum(tp, 0)}%</td>
            <td>
              <Bar v={total} />
            </td>
          </tr>
        ))}
      </Table>
      <aside className="rounded-lg border border-primary/40 bg-background/60 p-4">
        <h3 className="font-display text-lg text-primary">Sélection TurfMaster</h3>
        <p className="mb-3 text-xs text-muted-foreground">Indice : forme (musique) 35 %, réussite victoire 25 %, place 15 %, cote 25 %.</p>
        <ol className="space-y-2">
          {top.map((s, i) => (
            <li key={s.r.num} className="flex items-center gap-3">
              <Num n={s.r.num} gold={i === 0} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{s.r.nom}</div>
                <div className="text-xs text-muted-foreground">
                  {s.r.driver} · cote {fmtCell(s.r.cote)}
                </div>
              </div>
              <span className="font-mono text-sm text-primary">{s.total}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-md bg-secondary p-2 text-center font-mono text-lg tracking-widest">{top.map((s) => s.r.num).join(" - ")}</div>
      </aside>
    </div>
  );
}

function Sheet1({ rows }: { rows: Row[] }) {
  return (
    <Table head={["n°", "NOMS", "age", "sexe", "driver", "entreneur", "musique", "gains", "cotes"]}>
      {rows.map((r) => (
        <tr key={r.num}>
          <td>
            <Num n={r.num} />
          </td>
          <td className="!text-left font-semibold">{r.nom}</td>
          <td>{r.age}</td>
          <td className="text-xs">{r.sexe}</td>
          <td className="text-xs">{r.driver}</td>
          <td className="text-xs">{r.entraineur}</td>
          <td className="!text-left">
            <Musique m={r.musique} />
          </td>
          <td className="font-mono text-xs">{fmtEur(r.gainCarriere)}</td>
          <td className="font-mono text-primary">{fmtCell(r.cote)}</td>
        </tr>
      ))}
    </Table>
  );
}

function rowsToText(rows: Row[]) {
  return rows
    .filter((r) => !String(r.statut ?? "").includes("NON_PARTANT"))
    .map(
      (r) =>
        `${r.num} – ${r.nom} | ${r.sexe} ${r.age} ans | ${r.driver} / ${r.entraineur} | musique ${r.musique || "?"} | courses ${r.courses} vict ${r.victoires} places ${r.places} | gains ${r.gainCarriere} | cote ${r.cote}`,
    )
    .join("\n");
}

function AnalyseIA({ rows, course, ids }: { rows: Row[]; course: string; ids: { date: string; reunion: number; course: number } }) {
  const [text, setText] = useState(() => rowsToText(rows));
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctrl, setCtrl] = useState<AbortController | null>(null);
  useEffect(() => {
    if (!text && rows.length) setText(rowsToText(rows));
  }, [rows]);

  async function run() {
    const c = new AbortController();
    setCtrl(c);
    setBusy(true);
    setOut("");
    setErr("");
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        signal: c.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, partants: text, ids }),
      });
      if (!res.ok || !res.body) {
        setErr((await res.text()) || "Analyse indisponible");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const ev = JSON.parse(line.slice(5));
            if (ev.type === "response.output_text.delta") setOut((o) => o + ev.delta);
            else if (ev.type === "response.failed" || ev.type === "error") setErr(ev.response?.error?.message ?? ev.message ?? "Analyse interrompue");
            else if (ev.type === "response.refusal.delta") setErr("L'IA a refusé cette demande.");
          } catch {
            /* fragment */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr("Connexion interrompue");
    } finally {
      setBusy(false);
      setCtrl(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <div>
        <h3 className="font-display text-lg text-primary">Partants et forme</h3>
        <p className="mb-2 text-xs text-muted-foreground">Pré-rempli avec la course choisie. Terrain, poids, historique, distances et entourage sont ajoutés automatiquement depuis le PMU.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={18}
          className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={run}
            disabled={busy || text.trim().length < 10}
            className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Analyse en cours…" : "Analyser"}
          </button>
          {busy && (
            <button onClick={() => ctrl?.abort()} className="h-9 rounded-md border border-border px-4 text-sm">
              Arrêter
            </button>
          )}
          <button onClick={() => setText(rowsToText(rows))} className="h-9 rounded-md border border-border px-4 text-sm">
            Recharger la course
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-primary/40 bg-background/60 p-4">
        <h3 className="font-display text-lg text-primary">Analyse des prétendants</h3>
        {err && <p className="mt-2 rounded-md bg-destructive/20 p-2 text-sm">{err}</p>}
        {!out && !err && <p className="mt-2 text-sm text-muted-foreground">{busy ? "L'IA étudie les partants…" : "Cliquez sur « Analyser » pour obtenir un classement argumenté."}</p>}
        {out && <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{out}</div>}
        <p className="mt-4 text-[11px] text-muted-foreground">Analyse indicative basée uniquement sur les données affichées. Jouer comporte des risques.</p>
      </div>
    </div>
  );
}
