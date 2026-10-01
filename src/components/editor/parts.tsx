"use client";
import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { uid } from "@/lib/cv-schema";

/* ---------- champs ---------- */
export type FieldDef = {
  key: string; label: string; type?: "text" | "textarea" | "period" | "level"; max?: number;
  placeholder?: string; half?: boolean; hint?: string; rows?: number;
};
type Item = { id: string; [k: string]: unknown };

export function TextField({ label, value, onChange, max, placeholder, type = "text", hint, textarea, rows = 4, id }: {
  label: string; value: string; onChange: (v: string) => void; max?: number; placeholder?: string; type?: string; hint?: string; textarea?: boolean; rows?: number; id?: string;
}) {
  const fid = id ?? `f-${label}-${placeholder ?? ""}`.replace(/\W+/g, "-");
  return (
    <div>
      <label className="label" htmlFor={fid}>{label}</label>
      {textarea ? (
        <textarea id={fid} className="input resize-y" rows={rows} maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={fid} className="input" type={type} maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      <div className="mt-1 flex justify-between text-xs text-stone-400">
        <span>{hint}</span>{textarea && max ? <span>{value.length}/{max}</span> : null}
      </div>
    </div>
  );
}

function FieldInput({ f, item, set }: { f: FieldDef; item: Item; set: (patch: Partial<Item>) => void }) {
  const id = `${item.id}-${f.key}`;
  if (f.type === "period") {
    const start = String(item.start ?? ""); const end = (item.end as string | null) ?? "";
    return (
      <div className="col-span-2 grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor={`${id}-s`}>Début</label><input id={`${id}-s`} type="month" className="input" value={start} onChange={(e) => set({ start: e.target.value })} /></div>
        <div>
          <label className="label" htmlFor={`${id}-e`}>Fin</label>
          <input id={`${id}-e`} type="month" className="input" disabled={!end} value={end} onChange={(e) => set({ end: e.target.value })} />
        </div>
      </div>
    );
  }
  if (f.type === "level") {
    const v = Number(item[f.key] ?? 0);
    return (
      <div className="col-span-2">
        <label className="label">{f.label}</label>
        <div className="flex gap-1.5" role="radiogroup" aria-label={f.label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={v === n} onClick={() => set({ [f.key]: v === n ? 0 : n })}
              className={`h-8 flex-1 rounded-lg border text-xs font-bold transition ${n <= v ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 text-stone-400 hover:border-brand-400"}`}>{n}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={f.half ? "col-span-1" : "col-span-2"}>
      <TextField id={id} label={f.label} value={String(item[f.key] ?? "")} onChange={(v) => set({ [f.key]: v })} max={f.max} placeholder={f.placeholder} textarea={f.type === "textarea"} rows={f.rows} hint={f.hint} />
    </div>
  );
}

/* ---------- liste réordonnable ---------- */
function Row({ item, title, fields, onChange, onRemove, defaultOpen }: {
  item: Item; title: string; fields: FieldDef[]; onChange: (patch: Partial<Item>) => void; onRemove: () => void; defaultOpen: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [open, setOpen] = useState(defaultOpen);
  const hasPeriod = fields.some((f) => f.type === "period");
  const ongoing = hasPeriod && !item.end;
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-xl border bg-white ${isDragging ? "z-10 border-brand-400 shadow-lift" : "border-stone-200"}`}>
      <div className="flex items-center gap-1 px-2 py-2">
        <button type="button" {...attributes} {...listeners} aria-label="Déplacer" className="touch-none cursor-grab rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 active:cursor-grabbing"><GripVertical size={18} /></button>
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 py-1 text-left" aria-expanded={open}>
          <span className={`truncate text-sm font-semibold ${title ? "text-stone-900" : "text-stone-400"}`}>{title || "Sans titre"}</span>
          <ChevronDown size={18} className={`shrink-0 text-stone-400 transition ${open ? "rotate-180" : ""}`} />
        </button>
        <button type="button" onClick={onRemove} aria-label="Supprimer" className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-3 border-t border-stone-100 p-3.5">
          {fields.map((f) => <FieldInput key={f.key} f={f} item={item} set={onChange} />)}
          {hasPeriod && (
            <label className="col-span-2 -mt-1 flex cursor-pointer items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={ongoing} onChange={(e) => onChange({ end: e.target.checked ? "" : new Date().toISOString().slice(0, 7) })} />
              En cours / poste actuel
            </label>
          )}
        </div>
      )}
    </div>
  );
}

export function ListEditor<T extends Item>({ items, onChange, fields, titleOf, make, addLabel, max }: {
  items: T[]; onChange: (items: T[]) => void; fields: FieldDef[]; titleOf: (i: T) => string; make: () => Omit<T, "id">; addLabel: string; max?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [newId, setNewId] = useState<string | null>(null);
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = items.findIndex((i) => i.id === active.id); const to = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, from, to));
    }
  }
  return (
    <div className="space-y-2.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((it) => (
            <Row key={it.id} item={it} title={titleOf(it)} fields={fields} defaultOpen={it.id === newId || (items.length === 1 && !titleOf(it))}
              onChange={(patch) => onChange(items.map((x) => (x.id === it.id ? { ...x, ...patch } : x)))}
              onRemove={() => onChange(items.filter((x) => x.id !== it.id))} />
          ))}
        </SortableContext>
      </DndContext>
      {(!max || items.length < max) && (
        <button type="button" onClick={() => { const id = uid(); setNewId(id); onChange([...items, { ...make(), id } as T]); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-3 text-sm font-semibold text-stone-600 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800">
          <Plus size={17} /> {addLabel}
        </button>
      )}
    </div>
  );
}

/* ---------- accordéon ---------- */
export function Section({ title, icon, open, onToggle, children, badge }: { title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode; badge?: string | number }) {
  return (
    <section className="card overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
        <span className="flex-1 font-display text-[15px] font-bold text-stone-900">{title}</span>
        {badge ? <span className="badge bg-stone-100 text-stone-600">{badge}</span> : null}
        <ChevronDown size={18} className={`text-stone-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-stone-100 p-4">{children}</div>}
    </section>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold text-stone-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg px-2 py-1 text-2xl leading-none text-stone-400 hover:bg-stone-100">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
