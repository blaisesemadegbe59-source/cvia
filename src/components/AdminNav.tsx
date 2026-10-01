"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Receipt, Tag, LayoutTemplate, Mail, Settings, ShieldCheck, ScrollText } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/commandes", label: "Commandes", icon: Receipt },
  { href: "/admin/offres", label: "Offres et promos", icon: Tag },
  { href: "/admin/modeles", label: "Modèles", icon: LayoutTemplate },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/reglages", label: "Réglages", icon: Settings },
  { href: "/admin/securite", label: "Sécurité (2FA)", icon: ShieldCheck },
  { href: "/admin/journal", label: "Journal d’audit", icon: ScrollText },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Administration">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-brand-50 text-brand-800" : "text-stone-600 hover:bg-stone-100"}`}><i.icon size={17} />{i.label}</Link>;
      })}
    </nav>
  );
}
