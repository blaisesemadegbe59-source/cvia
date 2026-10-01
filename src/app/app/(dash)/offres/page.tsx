import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OffersClient } from "@/components/OffersClient";
import { creditBalance, activePass } from "@/lib/orders";

export const metadata = { title: "Offres" };

export default async function Offers({ searchParams }: { searchParams: Promise<{ produit?: string; cv?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser("/app/offres");
  const [products, cvs, credits, pass] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.cv.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, unlockedAt: true } }),
    creditBalance(user.id), activePass(user.id),
  ]);
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-stone-900">Offres</h1>
      <p className="mt-1 text-stone-600">Choisissez comment débloquer vos CV. Paiement sécurisé par Mobile Money ou carte.</p>
      <div className="mt-8">
        <OffersClient
          products={products.map((p) => ({ code: p.code, name: p.name, description: p.description, priceXof: p.priceXof }))}
          cvs={cvs.map((c) => ({ id: c.id, title: c.title, unlocked: !!c.unlockedAt }))}
          initialProduct={sp.produit} initialCv={sp.cv} credits={credits} hasPass={!!pass}
        />
      </div>
    </div>
  );
}
