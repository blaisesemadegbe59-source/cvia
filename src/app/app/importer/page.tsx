"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Importe le brouillon local (créé avant l'inscription) dans le compte, puis ouvre l'éditeur. */
export default function Import() {
  const router = useRouter();
  const [msg, setMsg] = useState("Récupération de votre brouillon…");
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("cvia:draft");
        if (!raw) return router.replace("/app");
        const d = JSON.parse(raw);
        const r = await fetch("/api/cvs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: d.title, templateSlug: d.templateSlug, lang: d.lang, content: d.content, style: d.style }) });
        const j = await r.json();
        if (!r.ok) { setMsg(j.message); setTimeout(() => router.replace("/app"), 2500); return; }
        localStorage.removeItem("cvia:draft");
        router.replace(`/app/cv/${j.id}`);
      } catch { router.replace("/app"); }
    })();
  }, [router]);
  return <div className="flex h-dvh flex-col items-center justify-center gap-3 text-stone-600"><Loader2 className="animate-spin text-brand-700" size={32} />{msg}</div>;
}
