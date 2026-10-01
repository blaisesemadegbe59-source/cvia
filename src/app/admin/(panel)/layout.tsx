import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/AdminNav";

export const metadata = { title: "Administration" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block"><Logo href="/admin" /><span className="badge bg-stone-900 text-white lg:mt-2">{user.role}</span></div>
        <AdminNav />
        <div className="hidden px-5 py-4 text-xs text-stone-500 lg:absolute lg:bottom-0 lg:block"><Link href="/app" className="font-semibold text-brand-700 hover:underline">← Retour au site</Link><p className="mt-1">{user.email}</p></div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">{children}</main>
    </div>
  );
}
