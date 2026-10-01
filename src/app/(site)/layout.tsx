import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      {s.announcement && <div className="bg-sun-400 px-4 py-2 text-center text-sm font-semibold text-stone-900">{s.announcement}</div>}
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
