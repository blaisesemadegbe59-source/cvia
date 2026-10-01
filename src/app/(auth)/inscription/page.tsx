import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForms";
export const metadata: Metadata = { title: "Inscription" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; ref?: string }> }) {
  const sp = await searchParams;
  return <RegisterForm next={sp.next} refCode={sp.ref} />;
}
