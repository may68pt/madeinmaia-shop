"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Check = { ok: boolean; label: string; detail: string };
type Status = { mode: "live" | "test" | "off"; ready: boolean; checks: Check[]; notify: string };

/** Payments and order-email setup checklist (Studio → Encomendas). */
export function PaymentsPanel({ user, studioKey }: { user: string; studioKey: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [sending, setSending] = useState(false);
  const headers = useCallback((json = false): HeadersInit => ({ ...(json ? { "content-type": "application/json" } : {}), "x-studio-user": user, "x-studio-key": studioKey }), [user, studioKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/studio/payments", { headers: headers(), cache: "no-store" });
      if (response.ok) { const data = (await response.json()) as Status; setStatus(data); setTestTo((current) => current || data.notify.split(",")[0] || ""); }
    } finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { void load(); }, [load]);

  async function sendTest() {
    setSending(true);
    try {
      const response = await fetch("/api/studio/payments", { method: "POST", headers: headers(true), body: JSON.stringify({ action: "test-email", to: testTo }) });
      const data = (await response.json()) as { ok?: boolean; to?: string; error?: string };
      if (response.ok) toast.success(`Email de teste enviado para ${data.to}.`); else toast.error(data.error || "Falhou o envio.");
    } finally { setSending(false); }
  }

  if (!status) return null;
  return <section className="mim-payments-panel mb-8 border border-black/10 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[.12em]">Pagamentos e emails</p>
        <p className="mt-1 text-sm text-black/55">{status.ready ? "Tudo pronto: a loja aceita pagamentos e envia emails." : "Falta configurar alguns passos antes de a loja vender online."}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 text-xs font-black uppercase ${status.mode === "live" ? "bg-green-100 text-green-800" : status.mode === "test" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>{status.mode === "live" ? "Modo real" : status.mode === "test" ? "Modo de teste" : "Sem pagamentos"}</span>
        <Button type="button" size="icon" variant="ghost" onClick={() => void load()} aria-label="Verificar de novo"><RefreshCw className={loading ? "animate-spin" : undefined} /></Button>
      </div>
    </div>
    <ul className="mt-4 grid gap-2">{status.checks.map((check) => <li key={check.label} className="flex items-start gap-3 text-sm">
      {check.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />}
      <span className="min-w-0"><strong className="block">{check.label}</strong><span className="break-words text-black/55">{check.detail}</span></span>
    </li>)}</ul>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/10 pt-4">
      <Mail className="size-4 text-black/40" />
      <input value={testTo} onChange={(event) => setTestTo(event.target.value)} placeholder="email@exemplo.pt" className="h-9 min-w-0 flex-1 border border-black/10 bg-transparent px-3 text-sm outline-none focus:border-black/35" />
      <Button type="button" size="sm" variant="outline" className="rounded-none" disabled={sending || !testTo} onClick={() => void sendTest()}>{sending ? "A enviar…" : "Enviar email de teste"}</Button>
    </div>
  </section>;
}
