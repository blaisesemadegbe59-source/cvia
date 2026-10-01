import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getFile } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const a = await db.asset.findUnique({ where: { id: (await params).id } });
  if (!user || !a || (a.ownerId !== user.id && !isStaff(user))) return new Response("Not found", { status: 404 });
  const buf = await getFile(a.storageKey);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { "content-type": a.mime, "cache-control": "private, max-age=3600" } });
}
