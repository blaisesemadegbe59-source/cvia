import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { sampleContent, defaultStyle } from "../src/lib/cv-schema";
import { TEMPLATE_DEFS } from "../src/lib/templates/templates";

const db = new PrismaClient();

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function main() {
  for (const [i, t] of TEMPLATE_DEFS.entries()) {
    await db.template.upsert({ where: { slug: t.slug }, update: { name: t.name, description: t.description, category: t.category, hasPhoto: t.hasPhoto, columns: t.columns, sortOrder: i }, create: { ...t, sortOrder: i } });
  }

  const products = [
    { code: "CV_SINGLE", name: "CV à l’unité", description: "PDF sans filigrane, téléchargements illimités et modifications pendant 30 jours.", priceXof: 1200, durationDays: 30, credits: null, sortOrder: 1 },
    { code: "CV_PACK_3", name: "Pack 3 CV", description: "3 crédits de déblocage, valables 12 mois. Idéal pour plusieurs candidatures.", priceXof: 3000, durationDays: null, credits: 3, sortOrder: 2 },
    { code: "PASS_30", name: "Pass illimité 30 jours", description: "Tous vos CV débloqués, modifications et téléchargements illimités pendant 30 jours.", priceXof: 2500, durationDays: 30, credits: null, sortOrder: 3 },
    { code: "PASS_90", name: "Pass illimité 90 jours", description: "Tous vos CV débloqués pendant 90 jours, pour une recherche d’emploi sereine.", priceXof: 5500, durationDays: 90, credits: null, sortOrder: 4 },
    { code: "CV_REACTIVATE", name: "Réactivation d’un CV", description: "Prolonge de 30 jours la période de modification d’un CV déjà débloqué.", priceXof: 500, durationDays: 30, credits: null, sortOrder: 5 },
  ];
  for (const p of products) await db.product.upsert({ where: { code: p.code }, update: {}, create: p });

  const promos = [
    { code: "BIENVENUE20", kind: "PERCENT", value: 20, maxUsesPerUser: 1 },
    { code: "ETUDIANT", kind: "FIXED", value: 300, maxUsesPerUser: 1 },
    { code: "GRATUIT100", kind: "PERCENT", value: 100, maxUses: 20, maxUsesPerUser: 1 },
  ];
  for (const p of promos) await db.promoCode.upsert({ where: { code: p.code }, update: {}, create: p });

  const email = (process.env.ADMIN_EMAIL || "admin@cvia.local").toLowerCase();
  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Administrateur", role: "SUPERADMIN", passwordHash: hashPassword(process.env.ADMIN_PASSWORD || "Admin#2026"), referralCode: crypto.randomBytes(4).toString("hex").toUpperCase(), emailVerified: new Date() },
  });
  // Compte de démonstration avec un CV d'exemple
  const demo = await db.user.upsert({
    where: { email: "demo@cvia.local" }, update: {},
    create: { email: "demo@cvia.local", name: "Awa Adjovi", role: "CANDIDATE", passwordHash: hashPassword("Demo#2026"), referralCode: crypto.randomBytes(4).toString("hex").toUpperCase(), emailVerified: new Date() },
  });
  if ((await db.cv.count({ where: { userId: demo.id } })) === 0) {
    await db.cv.create({ data: { userId: demo.id, title: "CV Gestionnaire commercial", templateSlug: "moderne", content: JSON.stringify(sampleContent()), style: JSON.stringify(defaultStyle()) } });
  }
  console.log("Seed terminé. Admin :", email);
}
main().finally(() => db.$disconnect());
