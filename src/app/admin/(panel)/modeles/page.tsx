import { db } from "@/lib/db";
import { toggleTemplate } from "../../actions";
import { TemplatePreview } from "@/components/TemplatePreview";
import { sampleContent } from "@/lib/cv-schema";

export const dynamic = "force-dynamic";

export default async function Templates() {
  const list = await db.template.findMany({ orderBy: { sortOrder: "asc" } });
  const content = sampleContent();
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Modèles</h1>
      <p className="mt-1 text-sm text-stone-600">Un modèle désactivé n’est plus proposé aux nouveaux CV ; les CV existants continuent de s’afficher normalement.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => (
          <div key={t.id} className={`card overflow-hidden ${t.isActive ? "" : "opacity-60"}`}>
            <div className="h-56 overflow-hidden bg-stone-100 p-4"><div className="overflow-hidden rounded bg-white shadow-soft"><TemplatePreview slug={t.slug} content={content} /></div></div>
            <div className="flex items-center justify-between p-4"><div><p className="font-bold">{t.name}</p><p className="text-xs text-stone-500">{t.slug} · {t.category}</p></div>
              <form action={toggleTemplate.bind(null, t.id)}><button className={`btn btn-sm ${t.isActive ? "btn-outline" : "btn-primary"}`}>{t.isActive ? "Désactiver" : "Activer"}</button></form></div>
          </div>
        ))}
      </div>
    </div>
  );
}
