import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/** Stockage local ; l'interface est identique à celle d'un stockage S3 (put/get/delete). */
const root = () => path.resolve(process.env.STORAGE_DIR || "./data/uploads");

export async function putFile(buf: Buffer, ext: string, prefix = "f"): Promise<string> {
  const key = `${prefix}/${crypto.randomBytes(12).toString("hex")}.${ext}`;
  const full = path.join(root(), key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return key;
}
export async function getFile(key: string): Promise<Buffer | null> {
  if (key.includes("..")) return null;
  try { return await fs.readFile(path.join(root(), key)); } catch { return null; }
}
export async function deleteFile(key: string) {
  if (key.includes("..")) return;
  try { await fs.unlink(path.join(root(), key)); } catch { /* déjà supprimé */ }
}
