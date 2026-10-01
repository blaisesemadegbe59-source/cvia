import { requireAdmin } from "@/lib/auth";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";

export default async function Security() {
  const u = await requireAdmin();
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold">Sécurité du compte</h1>
      <p className="mt-2 text-stone-600">La double authentification (application Google Authenticator, Authy, Microsoft Authenticator…) protège l’accès à l’administration.</p>
      <div className="card mt-6 p-6"><TwoFactorSetup enabled={u.totpEnabled} /></div>
    </div>
  );
}
