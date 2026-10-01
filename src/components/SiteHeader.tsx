import Link from "next/link";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export const NAV = [
  { href: "/modeles", label: "Modèles" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/faq", label: "Questions" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur-lg">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-200/60 hover:text-stone-900">{n.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {isStaff(user) && <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>}
              <Link href="/app" className="btn btn-primary btn-sm">Mes CV</Link>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost btn-sm">Connexion</Link>
              <Link href="/creer" className="btn btn-primary btn-sm">Créer mon CV</Link>
            </>
          )}
        </div>
        <MobileMenu nav={NAV} loggedIn={!!user} />
      </div>
    </header>
  );
}
