// Test de bout en bout contre le serveur en marche : npx tsx scripts/e2e.ts
import { Webhook } from "fedapay";
const B = process.env.BASE || "http://localhost:3000";
let cookie = "";
const ok = (c: boolean, m: string) => { console.log(c ? "  ✓" : "  ✗ ÉCHEC", m); if (!c) process.exitCode = 1; };
async function api(path: string, init: RequestInit = {}) {
  const r = await fetch(B + path, { ...init, headers: { "content-type": "application/json", cookie, ...(init.headers as object) }, redirect: "manual" });
  const sc = r.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0];
  return r;
}
const j = async (r: Response) => r.json().catch(() => ({}));

(async () => {
  const email = `test${Date.now()}@example.com`;
  console.log("Inscription / session");
  let r = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Test Utilisateur", email, password: "motdepasse-ok-1", phone: "97" + String(Math.floor(100000 + Math.random() * 899999)) }) });
  ok(r.status === 201, "inscription 201");
  r = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "X Y", email, password: "motdepasse-ok-1" }) });
  ok(r.status === 409, "e-mail en doublon refusé");
  r = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "X Y", email: "a@b.co", password: "123" }) });
  ok(r.status === 422, "mot de passe faible refusé");

  console.log("CV");
  r = await api("/api/cvs", { method: "POST", body: JSON.stringify({ templateSlug: "moderne" }) });
  const { id } = await j(r); ok(r.status === 201 && !!id, "création du CV");
  const cv = (await j(await api(`/api/cvs/${id}`))).cv;
  const content = JSON.parse(cv.content); content.basics.headline = "Comptable"; content.summary = "Profil de test";
  r = await api(`/api/cvs/${id}`, { method: "PATCH", body: JSON.stringify({ title: "CV test", content, style: JSON.parse(cv.style) }) });
  ok(r.ok, "sauvegarde (PATCH)");
  r = await api(`/api/cvs/${id}`, { method: "PATCH", body: JSON.stringify({ content: { basics: 1 } }) });
  ok(r.status === 422, "contenu invalide refusé");

  console.log("PDF gratuit");
  r = await api(`/api/cvs/${id}/pdf`);
  const buf = Buffer.from(await r.arrayBuffer());
  ok(r.status === 200 && buf.subarray(0, 4).toString() === "%PDF", `PDF généré (${buf.length} o)`);
  ok(r.headers.get("x-cv-watermark") === "1", "filigrane présent avant paiement");

  console.log("Paiement simulé");
  r = await api("/api/orders", { method: "POST", body: JSON.stringify({ productCode: "CV_SINGLE", cvId: id, promo: "BIENVENUE20" }) });
  const order = await j(r); ok(r.status === 201, "commande créée (promo -20 %)");
  r = await api(`/api/orders/${order.id}/pay`, { method: "POST", body: JSON.stringify({ mode: "mtn_open", phone: "0197000000" }) });
  ok(r.ok, "paiement lancé");
  r = await api(`/api/orders/${order.id}/pay`, { method: "POST", body: JSON.stringify({ mode: "mtn_open", phone: "0197000000" }) });
  ok(r.status === 400, "double paiement simultané refusé");
  r = await api(`/api/orders/${order.id}/simulate`, { method: "POST", body: JSON.stringify({ outcome: "approved" }) });
  ok(r.ok, "confirmation simulée");
  r = await api(`/api/orders/${order.id}/simulate`, { method: "POST", body: JSON.stringify({ outcome: "approved" }) });
  ok(r.status === 409, "rejeu sans effet (idempotence)");
  ok((await j(await api(`/api/orders/${order.id}/status`))).status === "PAID", "commande PAYÉE");
  r = await api(`/api/cvs/${id}/pdf`);
  ok(r.headers.get("x-cv-watermark") === "0", "PDF sans filigrane après paiement");
  const g = (await j(await api(`/api/cvs/${id}`)));
  ok(g.access.windowOpen && g.access.daysLeft === 30, "fenêtre de 30 jours ouverte");

  console.log("Sécurité");
  const saved = cookie; cookie = "";
  r = await api(`/api/cvs/${id}`); ok(r.status === 401, "CV inaccessible sans session");
  await api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Autre Personne", email: `o${Date.now()}@example.com`, password: "motdepasse-ok-2" }) });
  r = await api(`/api/cvs/${id}`); ok(r.status === 404, "CV d'un autre utilisateur introuvable (IDOR)");
  r = await api(`/api/cvs/${id}/pdf`); ok(r.status === 404, "PDF d'un autre utilisateur refusé");
  r = await api(`/api/orders/${order.id}/status`); ok(r.status === 404, "commande d'un autre utilisateur introuvable");
  cookie = "";

  console.log("Webhook FedaPay");
  const evt = JSON.stringify({ name: "transaction.approved", entity: { id: 999999, status: "approved", amount: 1200, currency: { iso: "XOF" } } });
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET || "";
  r = await fetch(B + "/api/webhooks/fedapay", { method: "POST", body: evt, headers: { "x-fedapay-signature": "t=1,s=bad" } });
  ok(r.status === 400, "signature invalide rejetée");
  if (secret) {
    const sig = Webhook.generateTestHeaderString({ payload: evt, secret } as never);
    r = await fetch(B + "/api/webhooks/fedapay", { method: "POST", body: evt, headers: { "x-fedapay-signature": sig as string } });
    ok(r.status === 200, "signature valide acceptée");
  } else console.log("  (FEDAPAY_WEBHOOK_SECRET vide : test de signature valide ignoré)");

  console.log("Admin");
  r = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@cvia.local", password: "Admin#2026" }) });
  ok(r.ok, "connexion admin");
  r = await api("/admin"); ok(r.status === 200, "page /admin accessible");
  cookie = saved; r = await api("/admin"); ok(r.status === 307 || r.status === 302 || r.status === 308, "page /admin interdite à un candidat (redirection)");
  console.log(process.exitCode ? "\nDES TESTS ONT ÉCHOUÉ" : "\nTous les tests passent.");
})();
