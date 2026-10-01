import { db } from "@/lib/db";
import { authed, fail, json, route } from "@/lib/http";
import { getOwnedCv } from "@/lib/cv-service";
import { getSettings } from "@/lib/settings";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const s = await getSettings();
  if ((await db.cv.count({ where: { userId: user.id } })) >= s.maxCvsPerUser) return fail(`Limite de ${s.maxCvsPerUser} CV atteinte.`, 409);
  // La copie repart "gratuite" : un déblocage est lié à un CV précis.
  const copy = await db.cv.create({ data: { userId: user.id, title: `${cv.title} (copie)`, templateSlug: cv.templateSlug, content: cv.content, style: cv.style, lang: cv.lang } });
  return json({ id: copy.id }, 201);
});
