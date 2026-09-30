import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return <main className="grid min-h-screen place-items-center bg-[var(--accent-brand)] p-6 text-[var(--ink)]"><div className="max-w-xl bg-white p-8 text-center sm:p-12"><CheckCircle2 className="mx-auto size-16 text-[var(--brand)]"/><p className="mt-6 text-sm font-black uppercase tracking-[.16em]">Pagamento recebido</p><h1 className="mt-3 text-5xl font-black uppercase tracking-[-.06em]">Obrigado!</h1><p className="mt-5 text-lg leading-relaxed text-black/60">A tua encomenda foi registada. Receberás os detalhes e atualizações no email indicado no checkout.</p><Button asChild className="mt-8 rounded-none bg-[var(--ink)] text-white"><Link href="/">Voltar à loja</Link></Button></div></main>;
}
