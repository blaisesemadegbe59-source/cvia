import { requireUser } from "@/lib/auth";
import { ProfileClient } from "@/components/ProfileClient";
import { db } from "@/lib/db";

export const metadata = { title: "Mon profil" };

export default async function Profile() {
  const user = await requireUser("/app/profil");
  const referred = await db.user.count({ where: { referredById: user.id } });
  const base = process.env.APP_URL || "http://localhost:3000";
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold text-stone-900">Mon profil</h1>
      <ProfileClient name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} refUrl={`${base}/inscription?ref=${user.referralCode}`} referred={referred} />
    </div>
  );
}
