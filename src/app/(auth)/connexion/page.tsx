import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForms";
export const metadata: Metadata = { title: "Connexion" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      {sp.reset && <p className="mb-6 rounded-xl bg-brand-50 p-3.5 text-sm text-brand-900">Mot de passe mis à jour. Vous pouvez vous connecter.</p>}
      <LoginForm next={sp.next} />
    </>
  );
}
