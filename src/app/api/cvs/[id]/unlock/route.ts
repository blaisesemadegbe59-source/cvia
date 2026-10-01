import { authed, json, route } from "@/lib/http";
import { unlockCv } from "@/lib/orders";
export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await authed();
  return json(await unlockCv(user.id, (await params).id));
});
