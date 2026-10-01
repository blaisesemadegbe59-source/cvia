import { describe, expect, it } from "vitest";
import { getCvAccess, addDays } from "../src/lib/access";
import { evaluatePromo } from "../src/lib/pricing";

const now = new Date("2026-10-01T10:00:00Z");

describe("getCvAccess", () => {
  it("CV gratuit : filigrane", () => {
    const a = getCvAccess({ now, cv: { unlockedAt: null, editableUntil: null }, passActive: false });
    expect(a.cleanPdf).toBe(false);
    expect(a.unlocked).toBe(false);
  });
  it("CV débloqué dans la fenêtre : PDF propre + jours restants", () => {
    const a = getCvAccess({ now, cv: { unlockedAt: addDays(now, -5), editableUntil: addDays(now, 25) }, passActive: false });
    expect(a.cleanPdf).toBe(true);
    expect(a.windowOpen).toBe(true);
    expect(a.daysLeft).toBe(25);
  });
  it("après la fenêtre : filigrane mais dernier PDF payé disponible", () => {
    const a = getCvAccess({ now, cv: { unlockedAt: addDays(now, -40), editableUntil: addDays(now, -10) }, passActive: false });
    expect(a.cleanPdf).toBe(false);
    expect(a.lastPaidAvailable).toBe(true);
  });
  it("pass actif : tout est propre, même un CV jamais débloqué", () => {
    const a = getCvAccess({ now, cv: { unlockedAt: null, editableUntil: null }, passActive: true });
    expect(a.cleanPdf).toBe(true);
    expect(a.viaPass).toBe(true);
  });
});

describe("evaluatePromo", () => {
  const base = { kind: "PERCENT", value: 20, minAmountXof: null, startsAt: null, endsAt: null, isActive: true, maxUses: null, maxUsesPerUser: 1 };
  it("pourcentage arrondi au franc inférieur", () => {
    expect(evaluatePromo(base, 1200, now, 0, 0)).toEqual({ ok: true, discount: 240 });
    expect(evaluatePromo({ ...base, value: 33 }, 1200, now, 0, 0)).toEqual({ ok: true, discount: 396 });
  });
  it("montant fixe plafonné au prix", () => {
    expect(evaluatePromo({ ...base, kind: "FIXED", value: 5000 }, 1200, now, 0, 0)).toEqual({ ok: true, discount: 1200 });
  });
  it("100 % = gratuit", () => {
    expect(evaluatePromo({ ...base, value: 100 }, 1200, now, 0, 0)).toEqual({ ok: true, discount: 1200 });
  });
  it("refus : expiré, limite, déjà utilisé, inactif", () => {
    expect(evaluatePromo({ ...base, endsAt: addDays(now, -1) }, 1200, now, 0, 0)).toMatchObject({ ok: false, reason: "expired" });
    expect(evaluatePromo({ ...base, maxUses: 5 }, 1200, now, 5, 0)).toMatchObject({ ok: false, reason: "max_uses" });
    expect(evaluatePromo(base, 1200, now, 0, 1)).toMatchObject({ ok: false, reason: "user_limit" });
    expect(evaluatePromo({ ...base, isActive: false }, 1200, now, 0, 0)).toMatchObject({ ok: false, reason: "inactive" });
  });
});
