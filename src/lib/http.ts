import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { getCurrentUser } from "./auth";
import { OrderError } from "./orders";

export const json = (data: unknown, status = 200, headers?: Record<string, string>) => NextResponse.json(data, { status, headers });
export const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ code: status, message, ...extra }, { status });

export async function parse<T extends ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try { body = await req.json(); } catch { throw new HttpError("Requête invalide.", 400); }
  const r = schema.safeParse(body);
  if (!r.success) throw new HttpError(r.error.issues[0]?.message || "Données invalides.", 422);
  return r.data;
}

export class HttpError extends Error {
  constructor(message: string, public status = 400, public extra: Record<string, unknown> = {}) { super(message); }
}

export async function authed() {
  const u = await getCurrentUser();
  if (!u) throw new HttpError("Connexion requise.", 401);
  return u;
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;
export function route<C = unknown>(h: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try { return await h(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status, e.extra);
      if (e instanceof OrderError) return fail(e.message, e.status);
      if (e instanceof ZodError) return fail(e.issues[0]?.message || "Données invalides.", 422);
      console.error("[api]", e);
      return fail("Erreur interne. Veuillez réessayer.", 500);
    }
  };
}

export const baseUrl = (req: Request) => process.env.APP_URL || new URL(req.url).origin;
