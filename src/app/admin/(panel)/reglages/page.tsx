import { getSettings } from "@/lib/settings";
import { saveSettings } from "../../actions";

export const dynamic = "force-dynamic";

const FIELDS: [string, string, "text" | "number" | "bool", string?][] = [
  ["brand", "Nom de la marque", "text"], ["supportWhatsapp", "WhatsApp du support", "text", "Format international sans espace : +22901…"], ["supportEmail", "E-mail du support", "text"],
  ["announcement", "Bandeau d’annonce (vide = aucun)", "text"], ["editWindowDays", "Fenêtre de modification après paiement (jours)", "number"], ["maxCvsPerUser", "CV maximum par compte", "number"],
  ["pdfPerHour", "PDF par heure et par utilisateur", "number"], ["referralEnabled", "Parrainage activé", "bool"], ["referralReward", "Crédits offerts par parrainage", "number"], ["referralMaxRewards", "Récompenses de parrainage maximum par parrain", "number"],
  ["creditsValidityMonths", "Validité des crédits (mois)", "number"],
];

export default async function SettingsPage() {
  const s = (await getSettings()) as unknown as Record<string, string | number | boolean>;
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-extrabold">Réglages</h1>
      <form action={saveSettings} className="card mt-6 grid gap-5 p-6">
        {FIELDS.map(([k, label, type, hint]) => type === "bool" ? (
          <label key={k} className="flex cursor-pointer items-center gap-3 text-sm font-medium"><input type="checkbox" name={k} defaultChecked={Boolean(s[k])} className="h-4 w-4 accent-brand-700" />{label}</label>
        ) : (
          <div key={k}><label className="label" htmlFor={k}>{label}</label><input id={k} name={k} type={type} defaultValue={String(s[k] ?? "")} className="input" />{hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}</div>
        ))}
        <input type="hidden" name="passCvsUnlimited" value="on" /><button className="btn btn-primary w-fit">Enregistrer</button>
      </form>
    </div>
  );
}
