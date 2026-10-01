"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminLogin, checkAccess, createCode, deleteCode, listCodes, logout, toggleCode } from "@/lib/access.functions";
import mark from "@/assets/turfmaster-mark.png";

export default function AdminPage() {
  const status = useQuery({ queryKey: ["status"], queryFn: () => checkAccess() });

  if (status.isLoading) return <div className="min-h-screen bg-background" />;
  return status.data?.admin ? <Dashboard /> : <Login onOk={() => status.refetch()} />;
}

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await adminLogin(pw);
          if (r.ok) onOk();
          else setErr(true);
        }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center"
      >
        <img src={typeof mark === "string" ? mark : mark.src} alt="" width={64} height={64} className="mx-auto h-16 w-16" />
        <h1 className="mt-3 font-display text-2xl font-bold">Administration</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          autoComplete="current-password"
          className="mt-6 h-11 w-full rounded-lg border border-input bg-background px-3"
        />
        {err && <p className="mt-2 text-sm text-destructive">Mot de passe incorrect.</p>}
        <button className="mt-4 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground">Connexion</button>
        <Link href="/acces" className="mt-6 inline-block text-xs text-muted-foreground hover:text-primary">
          Retour
        </Link>
      </form>
    </div>
  );
}

function Dashboard() {
  const qc = useQueryClient();
  const codes = useQuery({ queryKey: ["codes"], queryFn: () => listCodes() });
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [days, setDays] = useState(30);
  const [msg, setMsg] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["codes"] });

  const create = useMutation({
    mutationFn: () => createCode({ label, code: code || undefined, days }),
    onSuccess: (r) => {
      setMsg(`Code créé : ${r.code}`);
      setLabel("");
      setCode("");
      refresh();
    },
    onError: (e: Error) => setMsg(e.message),
  });
  const toggle = useMutation({ mutationFn: (v: { id: string; active: boolean }) => toggleCode(v), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: string) => deleteCode(id), onSuccess: refresh });

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <img src={typeof mark === "string" ? mark : mark.src} alt="" width={40} height={40} className="h-10 w-10" />
          <div className="font-display text-xl font-bold text-primary">Administration</div>
          <Link href="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
            Ouvrir l'application
          </Link>
          <button
            onClick={async () => {
              await logout();
              window.location.href = "/acces";
            }}
            className="h-9 rounded-md border border-border px-3 text-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-lg">Nouveau code d'accès</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="mt-3 grid gap-3 md:grid-cols-[1fr_180px_140px_auto] md:items-end"
          >
            <label className="text-xs text-muted-foreground">
              Nom / client
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="ex. Jean Dupont"
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Code (vide = automatique)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm uppercase text-foreground"
              />
            </label>
            <label className="text-xs text-muted-foreground">
              Durée (jours, 0 = illimité)
              <input
                type="number"
                min={0}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              />
            </label>
            <button className="h-10 rounded-md bg-primary px-5 font-semibold text-primary-foreground">Créer</button>
          </form>
          {msg && <p className="mt-3 font-mono text-sm text-primary">{msg}</p>}
        </section>

        <section className="overflow-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                {["Code", "Nom", "Statut", "Expire", "Dernière utilisation", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Aucun code pour l'instant.
                  </td>
                </tr>
              )}
              {codes.data?.map((c) => {
                const expired = !!c.expires_at && new Date(c.expires_at) <= new Date();
                return (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono font-semibold text-primary">{c.code}</td>
                    <td className="px-3 py-2">{c.label || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${expired ? "bg-destructive/30" : c.active ? "bg-success/30" : "bg-muted"}`}>
                        {expired ? "Expiré" : c.active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{fmt(c.expires_at)}</td>
                    <td className="px-3 py-2 text-xs">{fmt(c.last_used_at)}</td>
                    <td className="space-x-2 whitespace-nowrap px-3 py-2 text-right">
                      <button onClick={() => toggle.mutate({ id: c.id, active: !c.active })} className="rounded border border-border px-2 py-1 text-xs">
                        {c.active ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer le code ${c.code} ?`)) del.mutate(c.id);
                        }}
                        className="rounded border border-destructive/50 px-2 py-1 text-xs text-destructive"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
