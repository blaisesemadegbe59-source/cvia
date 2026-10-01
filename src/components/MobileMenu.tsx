"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenu({ nav, loggedIn }: { nav: { href: string; label: string }[]; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen(!open)} className="rounded-lg p-2 text-stone-700 hover:bg-stone-200/60">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-stone-200 bg-white p-4 shadow-soft">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium text-stone-700 hover:bg-stone-100">{n.label}</Link>
            ))}
          </nav>
          <div className="mt-3 grid gap-2">
            {loggedIn ? (
              <Link href="/app" onClick={() => setOpen(false)} className="btn btn-primary">Mes CV</Link>
            ) : (
              <>
                <Link href="/creer" onClick={() => setOpen(false)} className="btn btn-primary">Créer mon CV</Link>
                <Link href="/connexion" onClick={() => setOpen(false)} className="btn btn-outline">Connexion</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
