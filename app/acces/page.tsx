"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enterCode } from "@/lib/access.functions";
import logo from "@/assets/turfmaster-logo.png";

export default function AccesPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await enterCode(code).catch(() => ({ ok: false as const }));
    setBusy(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setErr("Code invalide, désactivé ou expiré.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <img src={typeof logo === "string" ? logo : logo.src} alt="TurfMaster" width={900} height={701} className="mx-auto w-56" />
        <h1 className="mt-4 font-display text-2xl font-bold">Code d'accès</h1>
        <p className="mt-1 text-sm text-muted-foreground">Saisissez le code fourni par l'administrateur.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          aria-label="Code d'accès"
          className="mt-6 h-12 w-full rounded-lg border border-input bg-background text-center font-mono text-xl uppercase tracking-[0.3em]"
        />
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
        <button disabled={busy || !code} className="mt-4 h-11 w-full rounded-lg bg-primary font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Vérification…" : "Entrer"}
        </button>
        <Link href="/admin" className="mt-6 inline-block text-xs text-muted-foreground hover:text-primary">
          Espace administrateur
        </Link>
      </form>
    </div>
  );
}
