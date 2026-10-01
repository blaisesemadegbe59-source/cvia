import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { defaultStyle, emptyContent } from "@/lib/cv-schema";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/connexion?next=/app", url));
  const s = await getSettings();
  if ((await db.cv.count({ where: { userId: user.id } })) >= s.maxCvsPerUser) return NextResponse.redirect(new URL("/app?limite=1", url));
  const tpl = (await db.template.findFirst({ where: { slug: url.searchParams.get("modele") ?? "", isActive: true } })) ?? (await db.template.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
  const content = emptyContent();
  const [first, ...rest] = (user.name ?? "").split(" ");
  content.basics.firstName = first ?? ""; content.basics.lastName = rest.join(" ");
  content.basics.email = user.email ?? ""; content.basics.phone = user.phone ?? "";
  const cv = await db.cv.create({ data: { userId: user.id, title: "Mon CV", templateSlug: tpl!.slug, content: JSON.stringify(content), style: JSON.stringify(defaultStyle()) } });
  return NextResponse.redirect(new URL(`/app/cv/${cv.id}`, url));
}
