import Link from "next/link";
import { requireUser, isStaff } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { DashNav } from "@/components/DashNav";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/90 backdrop-blur-lg">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Logo href="/app" />
          <DashNav name={user.name || user.email || "Compte"} staff={isStaff(user)} />
        </div>
      </header>
      <main className="container-x py-8 pb-24">{children}</main>
      <p className="pb-8 text-center text-xs text-stone-400"><Link href="/contact" className="hover:underline">Besoin d’aide ?</Link></p>
    </div>
  );
}
