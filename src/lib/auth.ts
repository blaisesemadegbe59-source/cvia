import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { User } from "@prisma/client";

const COOKIE = "cvia_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

/* ---------- mots de passe (scrypt) ---------- */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string | null): boolean {
  if (!stored) return false;
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt") return false;
  const hash = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === hash.length && crypto.timingSafeEqual(hash, expected);
}

const COMMON = new Set(["12345678", "password", "motdepasse", "123456789", "azerty123", "qwertyuiop", "00000000", "11111111"]);
export function passwordIssue(pw: string): string | null {
  if (pw.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (COMMON.has(pw.toLowerCase())) return "Ce mot de passe est trop courant.";
  return null;
}

export const newReferralCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();
export const hashToken = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

/* ---------- sessions (JWT dans un cookie HttpOnly) ---------- */
export async function createSession(userId: string, opts: { admin2faPending?: boolean } = {}) {
  const maxAge = opts.admin2faPending ? 10 * 60 : 30 * 24 * 3600;
  const token = await new SignJWT({ uid: userId, p: opts.admin2faPending ? 1 : 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSessionPayload(): Promise<{ uid: string; pending: boolean } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), pending: payload.p === 1 };
  } catch { return null; }
}

export async function getCurrentUser(): Promise<User | null> {
  const s = await getSessionPayload();
  if (!s || s.pending) return null;
  const u = await db.user.findUnique({ where: { id: s.uid } });
  if (!u || u.status !== "ACTIVE") return null;
  return u;
}

export async function requireUser(next = "/app"): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return u;
}

export const isStaff = (u: Pick<User, "role">) => ["ADMIN", "SUPERADMIN", "SUPPORT"].includes(u.role);
export const isAdmin = (u: Pick<User, "role">) => ["ADMIN", "SUPERADMIN"].includes(u.role);

export async function requireAdmin(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) redirect("/admin/connexion");
  if (!isStaff(u)) redirect("/app");
  return u;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string, detail?: unknown) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId, detail: detail ? JSON.stringify(detail) : null, ip: await clientIp() } });
  } catch { /* l'audit ne doit jamais bloquer */ }
}
