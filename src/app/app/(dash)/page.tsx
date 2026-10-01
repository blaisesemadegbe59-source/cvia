import Link from "next/link";
import { Plus, Wallet, Crown, Gift, Clock, Download, Pencil, Bell } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { TemplatePreview } from "@/components/TemplatePreview";
import { parseContent, parseStyle } from "@/lib/cv-schema";
import { activePass, creditBalance } from "@/lib/orders";
import { getCvAccess } from "@/lib/access";
import { getSettings } from "@/lib/settings";
import { CvMenu, CopyButton } from "@/components/CvMenu";

export const metadata = { title: "Mes CV" };
const fmtDate = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ limite?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [cvs, pass, credits, s, notifs] = await Promise.all([
    db.cv.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    activePass(user.id), creditBalance(user.id), getSettings(),
    db.notification.findMany({ where: { userId: user.id, readAt: null }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  if (notifs.length) await db.notification.updateMany({ where: { id: { in: notifs.map((n) => n.id) } }, data: { readAt: new Date() } });
  const now = new Date();
  const base = process.env.APP_URL || "http://localhost:3000";
  const refUrl = `${base}/inscription?ref=${user.referralCode}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Bonjour {user.name?.split(" ")[0] ?? ""} 👋</h1>
          <p className="mt-1 text-stone-600">Retrouvez et gérez tous vos CV.</p>
        </div>
        <Link href="/creer" className="btn btn-primary btn-lg"><Plus size={18} />Nouveau CV</Link>
      </div>

      {sp.limite && <p className="rounded-xl bg-sun-100 p-3.5 text-sm text-amber-900">Vous avez atteint la limite de {s.maxCvsPerUser} CV. Supprimez-en un pour en créer un nouveau.</p>}
      {notifs.length > 0 && (
        <div className="space-y-2">
          {notifs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm"><Bell size={17} className="mt-0.5 shrink-0 text-brand-700" /><div><p className="font-semibold text-brand-900">{n.title}</p>{n.body && <p className="text-brand-900/80">{n.body}</p>}</div></div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${pass ? "bg-sun-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}><Crown size={22} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Pass illimité</p>
            <p className="font-display text-lg font-bold">{pass ? `Actif jusqu’au ${fmtDate(pass.endsAt)}` : "Aucun"}</p>
            {!pass && <Link href="/app/offres?produit=PASS_30" className="text-sm font-semibold text-brand-700 hover:underline">Découvrir →</Link>}</div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Wallet size={22} /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Crédits CV</p><p className="font-display text-lg font-bold">{credits} disponible{credits > 1 ? "s" : ""}</p>
            <Link href="/app/offres?produit=CV_PACK_3" className="text-sm font-semibold text-brand-700 hover:underline">Acheter un pack →</Link></div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600"><Gift size={22} /></span>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Parrainez, gagnez 1 CV</p>
            <p className="truncate text-sm text-stone-600">{refUrl.replace(/^https?:\/\//, "")}</p><CopyButton text={refUrl} /></div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cvs.map((cv) => {
          const access = getCvAccess({ now, cv, passActive: !!pass });
          const content = parseContent(cv.content); const name = `${content.basics.firstName} ${content.basics.lastName}`.trim();
          return (
            <article key={cv.id} className="card group overflow-hidden transition hover:shadow-lift">
              <Link href={`/app/cv/${cv.id}`} className="relative block bg-gradient-to-b from-stone-100 to-stone-200/60 p-5" aria-label={`Modifier ${cv.title}`}>
                <div className="h-56 overflow-hidden rounded bg-white shadow-soft ring-1 ring-black/5">
                  <TemplatePreview slug={cv.templateSlug} content={content} style={parseStyle(cv.style)} lang={cv.lang === "en" ? "en" : "fr"} watermark={!access.cleanPdf} pages={1} />
                </div>
                <div className="pointer-events-none absolute inset-x-5 bottom-5 h-16 bg-gradient-to-t from-stone-200/90 to-transparent" />
              </Link>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-stone-900">{cv.title}</h2>
                    <p className="truncate text-sm text-stone-500">{name || "Sans nom"} · modifié le {fmtDate(cv.updatedAt)}</p></div>
                  <CvMenu id={cv.id} title={cv.title} />
                </div>
                <div className="mt-3">
                  {access.viaPass ? <span className="badge bg-sun-100 text-amber-800"><Crown size={12} />Pass actif</span>
                    : access.windowOpen ? <span className="badge bg-brand-50 text-brand-800"><Clock size={12} />Débloqué · {access.daysLeft} j restants</span>
                    : access.lastPaidAvailable ? <span className="badge bg-stone-100 text-stone-600">Période terminée</span>
                    : <span className="badge bg-stone-100 text-stone-600">Gratuit · filigrane</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/app/cv/${cv.id}`} className="btn btn-outline btn-sm flex-1"><Pencil size={14} />Modifier</Link>
                  <a href={`/api/cvs/${cv.id}/pdf`} className="btn btn-primary btn-sm flex-1"><Download size={14} />PDF</a>
                </div>
                {!access.cleanPdf && <Link href={`/app/offres?produit=${access.unlocked ? "CV_REACTIVATE" : "CV_SINGLE"}&cv=${cv.id}`} className="mt-2.5 block text-center text-[13px] font-semibold text-brand-700 hover:underline">{access.unlocked ? "Prolonger 30 jours — 500 FCFA" : "Retirer le filigrane — 1 200 FCFA"}</Link>}
              </div>
            </article>
          );
        })}
        <Link href="/creer" className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 text-stone-500 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft"><Plus size={26} /></span>
          <span className="font-display font-bold">Créer un nouveau CV</span>
        </Link>
      </div>
    </div>
  );
}
