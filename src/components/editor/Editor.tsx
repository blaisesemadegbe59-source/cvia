"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, Award, Briefcase, Camera, Check, Cloud, CloudOff, Download, Eye, EyeOff, FileText, Globe2, GraduationCap, GripVertical, Heart, Languages,
  Link2, Loader2, Palette, Pencil, Rocket, Share2, Sparkles, Trash2, User, Users, Wrench, Copy, Lock, Crown,
} from "lucide-react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { ACCENTS, FONTS, SECTION_KEYS, uid, type CvContent, type CvStyle } from "@/lib/cv-schema";
import { ListEditor, Modal, Section, TextField, type FieldDef } from "./parts";
import { PhotoCropper } from "./PhotoCropper";

export interface CvDoc { title: string; templateSlug: string; lang: "fr" | "en"; content: CvContent; style: CvStyle }
export interface AccessInfo { cleanPdf: boolean; unlocked: boolean; windowOpen: boolean; daysLeft: number; viaPass: boolean; lastPaidAvailable: boolean }
interface Props {
  mode: "guest" | "user"; cvId?: string; initial: CvDoc; photoAssetId?: string | null;
  access?: AccessInfo; credits?: number; priceXof: number; templates: { slug: string; name: string; hasPhoto: boolean }[];
}

const SECTION_LABELS: Record<string, string> = {
  summary: "Profil", experiences: "Expériences", education: "Formation", skills: "Compétences", languages: "Langues",
  certifications: "Certifications", projects: "Projets", volunteering: "Engagement associatif", interests: "Centres d’intérêt", references: "Références",
};
const LEVELS = ["Langue maternelle", "Courant", "Avancé", "Intermédiaire", "Débutant"];

const F = {
  experiences: [
    { key: "title", label: "Poste", max: 120, placeholder: "Chargée de clientèle" },
    { key: "company", label: "Entreprise", max: 120, half: true, placeholder: "Société X" },
    { key: "location", label: "Lieu", max: 120, half: true, placeholder: "Cotonou" },
    { key: "period", label: "", type: "period" },
    { key: "description", label: "Missions et résultats", type: "textarea", max: 1200, rows: 5, hint: "Une ligne = une puce. Ex : Augmentation du CA de 35 %." },
  ] as FieldDef[],
  education: [
    { key: "degree", label: "Diplôme", max: 160, placeholder: "Licence en Gestion" },
    { key: "school", label: "Établissement", max: 160, half: true, placeholder: "Université d’Abomey-Calavi" },
    { key: "field", label: "Filière", max: 120, half: true },
    { key: "location", label: "Lieu", max: 120, half: true },
    { key: "honors", label: "Mention", max: 120, half: true, placeholder: "Bien" },
    { key: "period", label: "", type: "period" },
  ] as FieldDef[],
  skills: [
    { key: "name", label: "Compétence", max: 60, placeholder: "Excel" },
    { key: "level", label: "Niveau (facultatif, 1 à 5)", type: "level" },
  ] as FieldDef[],
  languages: [
    { key: "name", label: "Langue", max: 60, half: true, placeholder: "Français" },
    { key: "level", label: "Niveau", max: 40, half: true, placeholder: "Courant", hint: LEVELS.slice(0, 3).join(" · ") },
  ] as FieldDef[],
  certifications: [
    { key: "name", label: "Intitulé", max: 160 },
    { key: "issuer", label: "Organisme", max: 120, half: true },
    { key: "year", label: "Année", max: 8, half: true, placeholder: "2024" },
  ] as FieldDef[],
  projects: [
    { key: "title", label: "Projet", max: 120 },
    { key: "description", label: "Description", type: "textarea", max: 600, rows: 3 },
    { key: "url", label: "Lien (facultatif)", max: 200, placeholder: "https://…" },
  ] as FieldDef[],
  volunteering: [
    { key: "role", label: "Rôle", max: 120, placeholder: "Mentor" },
    { key: "organization", label: "Organisation", max: 120 },
    { key: "period", label: "", type: "period" },
    { key: "description", label: "Description", type: "textarea", max: 600, rows: 3 },
  ] as FieldDef[],
  references: [
    { key: "name", label: "Nom", max: 100, half: true },
    { key: "title", label: "Fonction", max: 100, half: true },
    { key: "organization", label: "Organisation", max: 100, half: true },
    { key: "contact", label: "Téléphone / e-mail", max: 120, half: true },
  ] as FieldDef[],
  links: [
    { key: "label", label: "Libellé", max: 40, half: true, placeholder: "LinkedIn" },
    { key: "url", label: "Adresse", max: 200, half: true, placeholder: "linkedin.com/in/…" },
  ] as FieldDef[],
};

type SaveState = "saved" | "saving" | "error" | "dirty";

export function Editor({ mode, cvId, initial, photoAssetId: initialPhoto, access, credits = 0, priceXof, templates }: Props) {
  const router = useRouter();
  const [doc, setDoc] = useState<CvDoc>(initial);
  const [photoId, setPhotoId] = useState<string | null>(initialPhoto ?? null);
  const [photoVer, setPhotoVer] = useState(0);
  const [tab, setTab] = useState<"content" | "design">("content");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [open, setOpen] = useState<string>("identity");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [dlOpen, setDlOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoErr, setPhotoErr] = useState("");
  const first = useRef(true);
  const latest = useRef(doc); latest.current = doc;

  const patch = useCallback((p: Partial<CvDoc>) => setDoc((d) => ({ ...d, ...p })), []);
  const setContent = useCallback((fn: (c: CvContent) => CvContent) => setDoc((d) => ({ ...d, content: fn(d.content) })), []);
  const setStyle = useCallback((p: Partial<CvStyle>) => setDoc((d) => ({ ...d, style: { ...d.style, ...p } })), []);
  const b = (k: keyof CvContent["basics"]) => doc.content.basics[k] as string;
  const setBasic = (k: keyof CvContent["basics"], v: string) => setContent((c) => ({ ...c, basics: { ...c.basics, [k]: v } }));

  /* ---- sauvegarde automatique ---- */
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setSaveState("dirty");
    const t = setTimeout(async () => {
      const d = latest.current;
      if (mode === "guest") {
        try { localStorage.setItem("cvia:draft", JSON.stringify({ ...d, savedAt: Date.now() })); setSaveState("saved"); } catch { setSaveState("error"); }
        return;
      }
      setSaveState("saving");
      try {
        const r = await fetch(`/api/cvs/${cvId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
        setSaveState(r.ok ? "saved" : "error");
      } catch { setSaveState("error"); }
    }, mode === "guest" ? 400 : 1200);
    return () => clearTimeout(t);
  }, [doc, mode, cvId]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (saveState === "dirty" || saveState === "saving") e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [saveState]);

  /* ---- aperçu ---- */
  const previewContent = useMemo(() => doc.content, [doc.content]);
  const photoUrl = photoId ? `/api/files/${photoId}?v=${photoVer}` : null;
  const watermark = !(access?.cleanPdf);
  const tpl = templates.find((t) => t.slug === doc.templateSlug);

  /* ---- photo ---- */
  async function uploadPhoto(blob: Blob) {
    const fd = new FormData(); fd.append("file", blob, "photo.jpg");
    const r = await fetch(`/api/cvs/${cvId}/photo`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) { setPhotoErr(j.message); return; }
    setPhotoId(j.photoAssetId); setPhotoVer((v) => v + 1); setCropFile(null); setPhotoErr("");
  }
  async function removePhoto() {
    await fetch(`/api/cvs/${cvId}/photo`, { method: "DELETE" }); setPhotoId(null);
  }

  const c = doc.content;
  const toggle = (k: string) => setOpen(open === k ? "" : k);

  const status = {
    saved: { icon: <Cloud size={15} />, text: mode === "guest" ? "Brouillon enregistré sur cet appareil" : "Enregistré", cls: "text-brand-700" },
    dirty: { icon: <Loader2 size={15} className="animate-spin" />, text: "Modifications…", cls: "text-stone-500" },
    saving: { icon: <Loader2 size={15} className="animate-spin" />, text: "Enregistrement…", cls: "text-stone-500" },
    error: { icon: <CloudOff size={15} />, text: "Échec de l’enregistrement", cls: "text-red-600" },
  }[saveState];

  return (
    <div className="flex h-dvh flex-col bg-stone-100">
      {/* BARRE DU HAUT */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 sm:px-4">
        <Link href={mode === "user" ? "/app" : "/"} aria-label="Retour" className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"><ArrowLeft size={20} /></Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Pencil size={14} className="hidden shrink-0 text-stone-400 sm:block" />
          <input aria-label="Titre du CV" value={doc.title} maxLength={80} onChange={(e) => patch({ title: e.target.value })}
            className="min-w-0 max-w-[260px] flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 font-display text-[15px] font-bold text-stone-900 hover:border-stone-200 focus:border-brand-600 focus:outline-none" />
          <span className={`hidden items-center gap-1.5 text-xs font-medium md:flex ${status.cls}`}>{status.icon}{status.text}</span>
        </div>
        {mode === "user" && <button onClick={() => setShareOpen(true)} className="btn btn-ghost btn-sm hidden sm:inline-flex"><Share2 size={16} />Partager</button>}
        <button onClick={() => setDlOpen(true)} className="btn btn-primary btn-sm"><Download size={16} /><span>Télécharger</span></button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(440px,520px)_1fr]">
        {/* PANNEAU GAUCHE */}
        <div className={`min-h-0 flex-col border-r border-stone-200 bg-stone-50 ${mobileView === "edit" ? "flex" : "hidden"} lg:flex`}>
          <div className="flex shrink-0 gap-1 border-b border-stone-200 bg-white p-2">
            {([["content", "Contenu", FileText], ["design", "Design", Palette]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${tab === k ? "bg-brand-50 text-brand-800" : "text-stone-500 hover:bg-stone-100"}`}><I size={16} />{l}</button>
            ))}
          </div>
          <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pb-28 lg:pb-6">
            {tab === "content" ? (
              <>
                <Section title="Identité et contact" icon={<User size={18} />} open={open === "identity"} onToggle={() => toggle("identity")}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex items-center gap-4 rounded-xl bg-stone-50 p-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 text-stone-400">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" /> : <Camera size={22} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900">Photo</p>
                        {mode === "guest" ? (
                          <p className="text-xs text-stone-500">Disponible après création du compte gratuit.</p>
                        ) : (
                          <div className="mt-1 flex flex-wrap gap-2">
                            <label className="btn btn-outline btn-sm cursor-pointer">
                              {photoUrl ? "Changer" : "Ajouter"}
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />
                            </label>
                            {photoUrl && <button onClick={removePhoto} className="btn btn-ghost btn-sm text-red-600">Retirer</button>}
                          </div>
                        )}
                        {tpl && !tpl.hasPhoto && <p className="mt-1 text-xs text-amber-700">Ce modèle n’affiche pas de photo.</p>}
                        {photoErr && <p className="mt-1 text-xs text-red-600">{photoErr}</p>}
                      </div>
                    </div>
                    <TextField label="Prénom" value={b("firstName")} onChange={(v) => setBasic("firstName", v)} max={60} placeholder="Awa" />
                    <TextField label="Nom" value={b("lastName")} onChange={(v) => setBasic("lastName", v)} max={60} placeholder="Adjovi" />
                    <div className="col-span-2"><TextField label="Titre professionnel" value={b("headline")} onChange={(v) => setBasic("headline", v)} max={120} placeholder="Gestionnaire commerciale" hint="Ce que vous visez : « Comptable », « Développeur web »…" /></div>
                    <TextField label="Téléphone" type="tel" value={b("phone")} onChange={(v) => setBasic("phone", v)} max={40} placeholder="+229 01 97 00 00 00" />
                    <TextField label="E-mail" type="email" value={b("email")} onChange={(v) => setBasic("email", v)} max={120} />
                    <TextField label="Ville" value={b("city")} onChange={(v) => setBasic("city", v)} max={80} placeholder="Cotonou" />
                    <TextField label="Pays" value={b("country")} onChange={(v) => setBasic("country", v)} max={80} placeholder="Bénin" />
                    <div className="col-span-2">
                      <p className="label">Liens (LinkedIn, portfolio…)</p>
                      <ListEditor items={c.basics.links} fields={F.links} titleOf={(l) => l.label || l.url} make={() => ({ label: "", url: "" })} addLabel="Ajouter un lien" max={4}
                        onChange={(links) => setContent((x) => ({ ...x, basics: { ...x.basics, links } }))} />
                    </div>
                  </div>
                </Section>

                <Section title="Profil" icon={<Sparkles size={18} />} open={open === "summary"} onToggle={() => toggle("summary")}>
                  <TextField label="Présentez-vous en 3 à 4 lignes" textarea rows={5} max={700} value={c.summary} onChange={(v) => setContent((x) => ({ ...x, summary: v }))}
                    placeholder="Gestionnaire commerciale avec 5 ans d’expérience… Dites ce que vous savez faire et ce que vous cherchez." />
                </Section>

                <Section title="Expériences" icon={<Briefcase size={18} />} badge={c.experiences.length || undefined} open={open === "experiences"} onToggle={() => toggle("experiences")}>
                  <ListEditor items={c.experiences} fields={F.experiences} max={10} titleOf={(e) => [e.title, e.company].filter(Boolean).join(" · ")}
                    make={() => ({ title: "", company: "", location: "", start: "", end: "", description: "" })} addLabel="Ajouter une expérience" onChange={(experiences) => setContent((x) => ({ ...x, experiences }))} />
                </Section>

                <Section title="Formation" icon={<GraduationCap size={18} />} badge={c.education.length || undefined} open={open === "education"} onToggle={() => toggle("education")}>
                  <ListEditor items={c.education} fields={F.education} max={6} titleOf={(e) => [e.degree, e.school].filter(Boolean).join(" · ")}
                    make={() => ({ degree: "", school: "", field: "", location: "", start: "", end: "", honors: "" })} addLabel="Ajouter une formation" onChange={(education) => setContent((x) => ({ ...x, education }))} />
                </Section>

                <Section title="Compétences" icon={<Wrench size={18} />} badge={c.skills.length || undefined} open={open === "skills"} onToggle={() => toggle("skills")}>
                  <ListEditor items={c.skills} fields={F.skills} max={20} titleOf={(s) => s.name} make={() => ({ name: "", level: 0 })} addLabel="Ajouter une compétence" onChange={(skills) => setContent((x) => ({ ...x, skills }))} />
                </Section>

                <Section title="Langues" icon={<Languages size={18} />} badge={c.languages.length || undefined} open={open === "languages"} onToggle={() => toggle("languages")}>
                  <ListEditor items={c.languages} fields={F.languages} max={8} titleOf={(l) => [l.name, l.level].filter(Boolean).join(" · ")} make={() => ({ name: "", level: "" })} addLabel="Ajouter une langue" onChange={(languages) => setContent((x) => ({ ...x, languages }))} />
                </Section>

                <Section title="Certifications" icon={<Award size={18} />} badge={c.certifications.length || undefined} open={open === "certifications"} onToggle={() => toggle("certifications")}>
                  <ListEditor items={c.certifications} fields={F.certifications} max={10} titleOf={(x) => x.name} make={() => ({ name: "", issuer: "", year: "" })} addLabel="Ajouter une certification" onChange={(certifications) => setContent((x) => ({ ...x, certifications }))} />
                </Section>

                <Section title="Projets" icon={<Rocket size={18} />} badge={c.projects.length || undefined} open={open === "projects"} onToggle={() => toggle("projects")}>
                  <ListEditor items={c.projects} fields={F.projects} max={6} titleOf={(x) => x.title} make={() => ({ title: "", description: "", url: "" })} addLabel="Ajouter un projet" onChange={(projects) => setContent((x) => ({ ...x, projects }))} />
                </Section>

                <Section title="Engagement associatif" icon={<Heart size={18} />} badge={c.volunteering.length || undefined} open={open === "volunteering"} onToggle={() => toggle("volunteering")}>
                  <ListEditor items={c.volunteering} fields={F.volunteering} max={5} titleOf={(x) => [x.role, x.organization].filter(Boolean).join(" · ")} make={() => ({ role: "", organization: "", start: "", end: "", description: "" })} addLabel="Ajouter un engagement" onChange={(volunteering) => setContent((x) => ({ ...x, volunteering }))} />
                </Section>

                <Section title="Centres d’intérêt" icon={<Globe2 size={18} />} badge={c.interests.length || undefined} open={open === "interests"} onToggle={() => toggle("interests")}>
                  <TextField label="Séparés par des virgules" value={c.interests.join(", ")} max={300} placeholder="Lecture, Football, Entrepreneuriat"
                    onChange={(v) => setContent((x) => ({ ...x, interests: v.split(",").map((s) => s.trimStart().slice(0, 40)).slice(0, 10) }))} />
                </Section>

                <Section title="Références" icon={<Users size={18} />} badge={c.references.length || undefined} open={open === "references"} onToggle={() => toggle("references")}>
                  <ListEditor items={c.references} fields={F.references} max={3} titleOf={(x) => [x.name, x.organization].filter(Boolean).join(" · ")} make={() => ({ name: "", title: "", organization: "", contact: "" })} addLabel="Ajouter une référence" onChange={(references) => setContent((x) => ({ ...x, references }))} />
                </Section>
              </>
            ) : (
              <DesignPanel doc={doc} templates={templates} patch={patch} setStyle={setStyle} content={previewContent} />
            )}
          </div>
        </div>

        {/* APERÇU */}
        <div className={`min-h-0 flex-col ${mobileView === "preview" ? "flex" : "hidden"} lg:flex`}>
          <AccessBanner mode={mode} access={access} priceXof={priceXof} onUnlock={() => setDlOpen(true)} />
          <div className="scroll-thin min-h-0 flex-1 overflow-auto p-4 pb-28 sm:p-8 lg:pb-8">
            <div className="mx-auto w-full max-w-[760px] rounded-sm bg-white shadow-lift ring-1 ring-black/5">
              <TemplatePreview slug={doc.templateSlug} content={previewContent} style={doc.style} lang={doc.lang} photoUrl={photoUrl} watermark={watermark} pages={0} guides />
            </div>
            <p className="mx-auto mt-4 max-w-[760px] text-center text-xs text-stone-500">Les traits jaunes indiquent les sauts de page du PDF A4.</p>
          </div>
        </div>
      </div>

      {/* BARRE MOBILE */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-sm gap-1 rounded-xl bg-stone-100 p-1">
          {([["edit", "Éditer", Pencil], ["preview", "Aperçu", Eye]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => setMobileView(k)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${mobileView === k ? "bg-white text-brand-800 shadow-sm" : "text-stone-500"}`}><I size={16} />{l}</button>
          ))}
        </div>
      </div>

      <PhotoCropper file={cropFile} round={doc.style.photoShape === "round"} onCancel={() => setCropFile(null)} onDone={uploadPhoto} />
      <DownloadDialog open={dlOpen} onClose={() => setDlOpen(false)} mode={mode} cvId={cvId} access={access} credits={credits} priceXof={priceXof} hasPhoto={!!photoId} saving={saveState !== "saved"} onUnlocked={() => { setDlOpen(false); router.refresh(); }} />
      {mode === "user" && <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} cvId={cvId!} />}
    </div>
  );
}

/* ---------- Bandeau d'état ---------- */
function AccessBanner({ mode, access, priceXof, onUnlock }: { mode: string; access?: AccessInfo; priceXof: number; onUnlock: () => void }) {
  let cls = "bg-sun-100 text-amber-900 border-sun-300"; let icon = <Lock size={16} />; let text: React.ReactNode;
  if (access?.viaPass) { cls = "bg-brand-50 text-brand-900 border-brand-200"; icon = <Crown size={16} />; text = "Pass illimité actif : PDF sans filigrane."; }
  else if (access?.windowOpen) { cls = "bg-brand-50 text-brand-900 border-brand-200"; icon = <Check size={16} />; text = <>CV débloqué : PDF sans filigrane, encore <strong>{access.daysLeft} jour{access.daysLeft > 1 ? "s" : ""}</strong> de modifications.</>; }
  else if (access?.lastPaidAvailable) text = <>Période de modification terminée. Prolongez pour retirer le filigrane des nouvelles versions.</>;
  else text = <>Aperçu gratuit avec filigrane. {mode === "guest" ? "Vos modifications sont enregistrées sur cet appareil." : ""}</>;
  const showBtn = !(access?.cleanPdf);
  return (
    <div className={`flex shrink-0 items-center gap-2.5 border-b px-4 py-2 text-[13px] ${cls}`}>
      {icon}<span className="min-w-0 flex-1">{text}</span>
      {showBtn && <button onClick={onUnlock} className="shrink-0 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-stone-800">Retirer le filigrane</button>}
    </div>
  );
}

/* ---------- Panneau Design ---------- */
function SortableSection({ id, label, hidden, onToggle }: { id: string; label: string; hidden: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-1 rounded-xl border bg-white px-2 py-1.5 ${isDragging ? "z-10 border-brand-400 shadow-lift" : "border-stone-200"}`}>
      <button type="button" {...attributes} {...listeners} aria-label={`Déplacer ${label}`} className="touch-none cursor-grab rounded-md p-1.5 text-stone-400 hover:bg-stone-100"><GripVertical size={17} /></button>
      <span className={`flex-1 text-sm font-medium ${hidden ? "text-stone-400 line-through" : "text-stone-800"}`}>{label}</span>
      <button type="button" onClick={onToggle} aria-label={hidden ? `Afficher ${label}` : `Masquer ${label}`} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100">{hidden ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-stone-100 p-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`flex-1 rounded-lg px-2 py-2 text-[13px] font-semibold transition ${value === v ? "bg-white text-brand-800 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>{l}</button>
      ))}
    </div>
  );
}

function DesignPanel({ doc, templates, patch, setStyle, content }: { doc: CvDoc; templates: Props["templates"]; patch: (p: Partial<CvDoc>) => void; setStyle: (p: Partial<CvStyle>) => void; content: CvContent }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }));
  const known = SECTION_KEYS as readonly string[];
  const order = [...doc.style.order.filter((k) => known.includes(k)), ...known.filter((k) => !doc.style.order.includes(k))];
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) setStyle({ order: arrayMove(order, order.indexOf(String(e.active.id)), order.indexOf(String(e.over.id))) });
  };
  const hidden = doc.style.hidden;
  return (
    <div className="space-y-5">
      <div className="card p-4">
        <h3 className="mb-3 font-display text-[15px] font-bold">Modèle</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {templates.map((t) => (
            <button key={t.slug} onClick={() => patch({ templateSlug: t.slug })} aria-pressed={doc.templateSlug === t.slug}
              className={`overflow-hidden rounded-xl border-2 bg-white text-left transition ${doc.templateSlug === t.slug ? "border-brand-600 ring-4 ring-brand-600/10" : "border-stone-200 hover:border-stone-300"}`}>
              <div className="pointer-events-none h-24 overflow-hidden bg-stone-50">
                <TemplatePreview slug={t.slug} content={content} style={{ ...doc.style }} lang={doc.lang} />
              </div>
              <div className="flex items-center justify-between px-2.5 py-2"><span className="text-[13px] font-bold">{t.name}</span>{doc.templateSlug === t.slug && <Check size={15} className="text-brand-700" />}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-5 p-4">
        <div>
          <h3 className="mb-3 font-display text-[15px] font-bold">Couleur</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENTS.map((a) => (
              <button key={a.value} title={a.name} aria-label={a.name} aria-pressed={doc.style.accent.toLowerCase() === a.value.toLowerCase()} onClick={() => setStyle({ accent: a.value })}
                className={`flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition ${doc.style.accent.toLowerCase() === a.value.toLowerCase() ? "ring-2 ring-stone-900" : "hover:scale-110"}`} style={{ background: a.value }}>
                {doc.style.accent.toLowerCase() === a.value.toLowerCase() && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            ))}
            <label className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-3 text-xs font-semibold text-stone-600">
              <input type="color" value={doc.style.accent} onChange={(e) => setStyle({ accent: e.target.value })} className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Couleur personnalisée" />Autre
            </label>
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-display text-[15px] font-bold">Police</h3>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((f) => (
              <button key={f} onClick={() => setStyle({ font: f })} aria-pressed={doc.style.font === f} style={{ fontFamily: `"${f}", sans-serif` }}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold ${doc.style.font === f ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-200 hover:border-stone-300"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div><h3 className="mb-2 font-display text-[15px] font-bold">Taille du texte</h3><Seg label="Taille" value={doc.style.scale} onChange={(v) => setStyle({ scale: v })} options={[["sm", "Petite"], ["md", "Normale"], ["lg", "Grande"]]} /></div>
        <div><h3 className="mb-2 font-display text-[15px] font-bold">Espacement</h3><Seg label="Espacement" value={doc.style.density} onChange={(v) => setStyle({ density: v })} options={[["compact", "Compact"], ["normal", "Normal"], ["airy", "Aéré"]]} /></div>
        <div><h3 className="mb-2 font-display text-[15px] font-bold">Photo</h3>
          <div className="space-y-2">
            <Seg label="Forme" value={doc.style.photoShape} onChange={(v) => setStyle({ photoShape: v })} options={[["round", "Ronde"], ["square", "Carrée"]]} />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700"><input type="checkbox" className="h-4 w-4 accent-brand-700" checked={doc.style.showPhoto} onChange={(e) => setStyle({ showPhoto: e.target.checked })} />Afficher la photo</label>
          </div>
        </div>
        <div><h3 className="mb-2 font-display text-[15px] font-bold">Langue du CV</h3><Seg label="Langue" value={doc.lang} onChange={(v) => patch({ lang: v })} options={[["fr", "Français"], ["en", "English"]]} /></div>
      </div>

      <div className="card p-4">
        <h3 className="font-display text-[15px] font-bold">Ordre des sections</h3>
        <p className="mb-3 mt-1 text-xs text-stone-500">Glissez pour réordonner, masquez ce que vous ne voulez pas montrer. (Les sections vides ne s’affichent jamais.)</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {order.map((k) => <SortableSection key={k} id={k} label={SECTION_LABELS[k]} hidden={hidden.includes(k)} onToggle={() => setStyle({ hidden: hidden.includes(k) ? hidden.filter((h) => h !== k) : [...hidden, k] })} />)}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

/* ---------- Dialogue de téléchargement ---------- */
function DownloadDialog({ open, onClose, mode, cvId, access, credits, priceXof, hasPhoto, saving, onUnlocked }: {
  open: boolean; onClose: () => void; mode: string; cvId?: string; access?: AccessInfo; credits: number; priceXof: number; hasPhoto: boolean; saving: boolean; onUnlocked: () => void;
}) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const price = new Intl.NumberFormat("fr-FR").format(priceXof).replace(/\u202f/g, " ");
  async function useCredit() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/cvs/${cvId}/unlock`, { method: "POST" });
    setBusy(false);
    if (r.ok) onUnlocked(); else setErr((await r.json()).message);
  }
  const href = `/api/cvs/${cvId}/pdf`;
  return (
    <Modal open={open} onClose={onClose} title="Télécharger mon CV">
      {saving && <p className="mb-3 rounded-lg bg-sun-100 px-3 py-2 text-xs text-amber-900">Enregistrement en cours… patientez un instant pour obtenir la dernière version.</p>}
      {mode === "guest" ? (
        <div className="space-y-4">
          <p className="text-[15px] leading-7 text-stone-600">Créez votre compte gratuit pour télécharger votre CV. <strong className="text-stone-800">Votre brouillon est conservé</strong> et s’ouvre automatiquement après l’inscription.</p>
          <Link href="/inscription?next=/app/importer" className="btn btn-primary btn-lg w-full">Créer mon compte gratuit</Link>
          <Link href="/connexion?next=/app/importer" className="btn btn-outline w-full">J’ai déjà un compte</Link>
        </div>
      ) : access?.cleanPdf ? (
        <div className="space-y-4">
          <p className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-900"><Check size={18} />Votre CV est débloqué : PDF net, sans filigrane.</p>
          <a href={href} className="btn btn-primary btn-lg w-full" onClick={onClose}><Download size={18} />Télécharger le PDF</a>
          {hasPhoto && <a href={`${href}?photo=0`} className="btn btn-outline w-full" onClick={onClose}>Version sans photo</a>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-brand-600 bg-brand-50 p-4">
            <p className="font-display text-lg font-extrabold text-brand-900">PDF sans filigrane</p>
            <p className="mt-1 text-sm text-brand-900/80">Téléchargements illimités et 30 jours de modifications.</p>
            <Link href={`/app/offres?produit=CV_SINGLE&cv=${cvId}`} className="btn btn-primary mt-3 w-full">Débloquer — {price} FCFA</Link>
            {credits > 0 && <button onClick={useCredit} disabled={busy} className="btn btn-outline mt-2 w-full">{busy && <Loader2 size={16} className="animate-spin" />}Utiliser 1 de mes {credits} crédit{credits > 1 ? "s" : ""}</button>}
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          </div>
          <a href={href} className="btn btn-outline w-full" onClick={onClose}><Download size={17} />Télécharger avec filigrane (gratuit)</a>
          <p className="text-center text-xs text-stone-500">Payable par MTN MoMo, Moov Money, Celtiis Cash ou carte.</p>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Partage ---------- */
function ShareDialog({ open, onClose, cvId }: { open: boolean; onClose: () => void; cvId: string }) {
  const [link, setLink] = useState<{ token: string; views?: number } | null>(null);
  const [showContact, setShowContact] = useState(false); const [busy, setBusy] = useState(false); const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    fetch(`/api/cvs/${cvId}/share`).then((r) => r.json()).then((j) => { if (j.link) { setLink(j.link); setShowContact(j.link.showContact); } else setLink(null); });
  }, [open, cvId]);
  async function create(sc = showContact) {
    setBusy(true);
    const r = await fetch(`/api/cvs/${cvId}/share`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ showContact: sc, days: 30 }) });
    setLink(await r.json()); setBusy(false);
  }
  async function revoke() { await fetch(`/api/cvs/${cvId}/share`, { method: "DELETE" }); setLink(null); }
  const url = link && typeof window !== "undefined" ? `${window.location.origin}/c/${link.token}` : "";
  return (
    <Modal open={open} onClose={onClose} title="Partager mon CV">
      {!link ? (
        <div className="space-y-4">
          <p className="text-[15px] leading-7 text-stone-600">Créez un lien web à envoyer par WhatsApp ou e-mail. Valable 30 jours, vous pouvez le désactiver à tout moment.</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-700" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} />Afficher mon téléphone et mon e-mail</label>
          <button onClick={() => create()} disabled={busy} className="btn btn-primary w-full"><Link2 size={16} />Créer le lien</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 p-2">
            <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-sm" onFocus={(e) => e.currentTarget.select()} aria-label="Lien de partage" />
            <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn btn-primary btn-sm">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copié" : "Copier"}</button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-700" checked={showContact} onChange={(e) => { setShowContact(e.target.checked); create(e.target.checked); }} />Afficher mon téléphone et mon e-mail</label>
          <p className="text-xs text-stone-500">{link.views ?? 0} vue(s)</p>
          <div className="flex gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent("Voici mon CV : " + url)}`} target="_blank" rel="noreferrer" className="btn btn-outline flex-1">WhatsApp</a>
            <button onClick={revoke} className="btn btn-outline flex-1 text-red-600"><Trash2 size={15} />Désactiver</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
