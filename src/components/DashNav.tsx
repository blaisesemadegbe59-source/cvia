"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, ShoppingBag, Receipt, UserCircle, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

const LINKS = [
  { href: "/app", label: "Mes CV", icon: FileText, exact: true },
  { href: "/app/offres", label: "Offres", icon: ShoppingBag },
  { href: "/app/paiements", label: "Paiements", icon: Receipt },
  { href: "/app/profil", label: "Profil", icon: UserCircle },
];

export function DashNav({ name, staff }: { name: string; staff: boolean }) {
  const path = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation du compte">
        {LINKS.map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return <Link key={l.href} href={l.href} className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${active ? "bg-brand-50 text-brand-800" : "text-stone-600 hover:bg-stone-100"}`}><l.icon size={16} />{l.label}</Link>;
        })}
      </nav>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 text-sm font-semibold hover:bg-stone-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
          <span className="hidden max-w-[120px] truncate sm:inline">{name}</span><ChevronDown size={15} />
        </button>
        {open && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-lift" onClick={() => setOpen(false)}>
            <div className="md:hidden">{LINKS.map((l) => <Link key={l.href} href={l.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-stone-100"><l.icon size={16} />{l.label}</Link>)}<hr className="my-1.5 border-stone-100" /></div>
            {staff && <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-stone-100"><ShieldCheck size={16} />Administration</Link>}
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={16} />Se déconnecter</button>
          </div>
        )}
      </div>
    </>
  );
}
