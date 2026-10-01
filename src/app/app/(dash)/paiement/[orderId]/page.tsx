import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, Pencil, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatXof } from "@/lib/pricing";
import { PayPanel } from "@/components/PayPanel";
import { isDemoMode } from "@/lib/payments";

export const metadata = { title: "Paiement" };

export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requireUser(`/app/paiement/${orderId}`);
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) notFound();
  const product = await db.product.findUnique({ where: { code: order.productCode } });
  const cv = order.targetCvId ? await db.cv.findUnique({ where: { id: order.targetCvId } }) : null;

  if (order.status === "PAID") {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card p-8 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600"><CheckCircle2 size={44} /></span>
          <h1 className="mt-5 text-3xl font-extrabold text-stone-900">Paiement confirmé 🎉</h1>
          <p className="mt-2 text-stone-600">{product?.name}{cv ? ` — « ${cv.title} »` : ""}</p>
          <p className="mt-1 text-sm text-stone-500">Commande {order.number} · {formatXof(order.totalXof)}</p>
          <div className="mt-8 grid gap-3">
            {cv && <a href={`/api/cvs/${cv.id}/pdf`} className="btn btn-primary btn-lg"><Download size={18} />Télécharger mon CV (PDF)</a>}
            {cv && <Link href={`/app/cv/${cv.id}`} className="btn btn-outline"><Pencil size={16} />Modifier mon CV</Link>}
            {!cv && <Link href="/app" className="btn btn-primary btn-lg">Voir mes CV</Link>}
            <Link href={`/app/recu/${order.id}`} className="btn btn-ghost"><Receipt size={16} />Voir le reçu</Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-extrabold text-stone-900">Paiement</h1>
      <div className="card mt-6 flex items-center justify-between p-5">
        <div><p className="font-display font-bold">{product?.name}</p><p className="text-sm text-stone-500">{cv ? cv.title : "Compte"} · {order.number}</p></div>
        <p className="font-display text-2xl font-extrabold text-brand-800">{formatXof(order.totalXof)}</p>
      </div>
      <div className="mt-5"><PayPanel orderId={order.id} initialStatus={order.status} demo={isDemoMode()} defaultPhone={user.phone ?? ""} /></div>
    </div>
  );
}
