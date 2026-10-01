/**
 * Règles d'accès à un CV (cahier des charges, §9.1). Fonction pure : testable sans base de données.
 */
export interface AccessInput {
  now: Date;
  cv: { unlockedAt: Date | null; editableUntil: Date | null };
  passActive: boolean;
}
export interface CvAccess {
  /** PDF sans filigrane autorisé maintenant. */
  cleanPdf: boolean;
  /** CV déjà débloqué à un moment donné. */
  unlocked: boolean;
  /** Fenêtre de modification payée encore ouverte. */
  windowOpen: boolean;
  /** Jours restants de la fenêtre (0 si fermée). */
  daysLeft: number;
  /** Un pass actif couvre ce CV. */
  viaPass: boolean;
  /** Après fenêtre : dernier PDF payé téléchargeable. */
  lastPaidAvailable: boolean;
}

export function getCvAccess({ now, cv, passActive }: AccessInput): CvAccess {
  const unlocked = cv.unlockedAt !== null;
  const windowOpen = unlocked && cv.editableUntil !== null && now.getTime() <= cv.editableUntil.getTime();
  const daysLeft = windowOpen && cv.editableUntil ? Math.max(0, Math.ceil((cv.editableUntil.getTime() - now.getTime()) / 86_400_000)) : 0;
  return {
    cleanPdf: passActive || windowOpen,
    unlocked,
    windowOpen,
    daysLeft,
    viaPass: passActive,
    lastPaidAvailable: unlocked && !windowOpen && !passActive,
  };
}

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
export const addMonths = (d: Date, m: number) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
