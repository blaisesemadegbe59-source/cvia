import { Logo } from "@/components/Logo";
import { Check } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-14 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-sun-400/20 blur-3xl" />
        <div className="pattern-dots absolute inset-0 opacity-30" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Un CV soigné ouvre des portes.</h2>
          <p className="mt-4 text-lg text-brand-100">Créez, retouchez et téléchargez votre CV où que vous soyez.</p>
          <ul className="mt-10 space-y-4">
            {["Aperçu gratuit et enregistrement automatique", "Paiement Mobile Money en quelques secondes", "30 jours de modifications après paiement", "Vos données restent privées"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-brand-50"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun-400 text-stone-900"><Check size={14} strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
