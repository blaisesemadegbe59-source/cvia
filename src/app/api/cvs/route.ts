import { z } from "zod";
import { db } from "@/lib/db";
import { authed, fail, json, parse, route } from "@/lib/http";
import { cvContentSchema, cvStyleSchema, emptyContent, defaultStyle } from "@/lib/cv-schema";
import { getSettings } from "@/lib/settings";

const schema = z.object({
  title: z.string().trim().max(80).optional(),
  templateSlug: z.string().min(1).max(40),
  lang: z.enum(["fr", "en"]).default("fr"),
  content: cvContentSchema.optional(),
  style: cvStyleSchema.partial().optional(),
});

export const POST = route(async (req) => {
  const user = await authed();
  const d = await parse(req, schema);
  const s = await getSettings();
  if ((await db.cv.count({ where: { userId: user.id } })) >= s.maxCvsPerUser) return fail(`Limite de ${s.maxCvsPerUser} CV atteinte. Supprimez un CV pour en créer un nouveau.`, 409);
  const tpl = await db.template.findFirst({ where: { slug: d.templateSlug, isActive: true } });
  if (!tpl) return fail("Modèle introuvable.", 404);
  const content = d.content ?? emptyContent();
  if (!d.content && user.name) {
    const [first, ...rest] = user.name.split(" ");
    content.basics.firstName = first; content.basics.lastName = rest.join(" ");
    content.basics.email = user.email ?? ""; content.basics.phone = user.phone ?? "";
  }
  const cv = await db.cv.create({
    data: {
      userId: user.id, title: d.title || "Mon CV", templateSlug: tpl.slug, lang: d.lang,
      content: JSON.stringify(content), style: JSON.stringify({ ...defaultStyle(), ...(d.style ?? {}) }),
    },
  });
  return json({ id: cv.id }, 201);
});
