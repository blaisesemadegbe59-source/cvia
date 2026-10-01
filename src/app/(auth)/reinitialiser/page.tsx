import { ResetForm } from "@/components/AuthForms";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) return <p className="rounded-xl bg-red-50 p-4 text-red-700">Lien invalide.</p>;
  return <ResetForm token={token} />;
}
