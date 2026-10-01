import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/AuthForms";
export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-100 px-5">
      <div className="mb-8"><Logo /></div>
      <div className="card w-full max-w-md p-8"><LoginForm admin /></div>
    </div>
  );
}
