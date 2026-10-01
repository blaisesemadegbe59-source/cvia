import { authed, fail, route } from "@/lib/http";
import { accessFor, buildCvHtml, getOwnedCv, slugFile } from "@/lib/cv-service";
import { htmlToPdf } from "@/lib/pdf";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { activePass } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const { access } = await accessFor(user.id, cv);
  const s = await getSettings();
  const limit = (await activePass(user.id)) ? s.pdfPerHour * 3 : s.pdfPerHour;
  const rl = rateLimit(`pdf:${user.id}`, limit, 3600_000);
  if (!rl.ok) return fail(`Limite de téléchargements atteinte. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} min.`, 429);

  const url = new URL(req.url);
  const withPhoto = url.searchParams.get("photo") !== "0";
  const html = await buildCvHtml(cv, { watermark: !access.cleanPdf, withPhoto });
  let pdf: Buffer;
  try { pdf = await htmlToPdf(html); }
  catch (e) {
    console.error("[pdf]", e);
    return fail("Le service de génération PDF est momentanément indisponible. Réessayez dans un instant.", 503);
  }
  const inline = url.searchParams.get("inline") === "1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${inline ? "inline" : "attachment"}; filename="${slugFile(cv)}"`,
      "x-cv-watermark": access.cleanPdf ? "0" : "1",
      "cache-control": "private, no-store",
    },
  });
});
