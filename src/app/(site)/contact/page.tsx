import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact" };

export default async function Contact() {
  const s = await getSettings();
  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900">Une question ? Parlons-en.</h1>
        <p className="mt-4 text-stone-600">Nous répondons généralement en moins de 24 heures. Pour un paiement, indiquez votre numéro de commande.</p>
        <div className="mt-8 space-y-3">
          <a href={`https://wa.me/${s.supportWhatsapp.replace(/\D/g, "")}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700"><MessageCircle size={20} /></span>
            <div><p className="font-bold text-stone-900">WhatsApp</p><p className="text-sm text-stone-600">{s.supportWhatsapp}</p></div>
          </a>
          <a href={`mailto:${s.supportEmail}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Mail size={20} /></span>
            <div><p className="font-bold text-stone-900">E-mail</p><p className="text-sm text-stone-600">{s.supportEmail}</p></div>
          </a>
        </div>
      </div>
      <div className="card p-6 sm:p-8"><ContactForm /></div>
    </div>
  );
}
