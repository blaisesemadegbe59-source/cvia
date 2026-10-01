import { db } from "./db";

export const SETTING_DEFAULTS = {
  brand: "Cvia",
  supportWhatsapp: "+2290195978819",
  supportEmail: "contact@cvia.bj",
  editWindowDays: 30,
  maxCvsPerUser: 10,
  pdfPerHour: 20,
  pdfPerHourGuest: 5,
  passCvsUnlimited: true,
  referralEnabled: true,
  referralReward: 1,
  referralMaxRewards: 5,
  creditsValidityMonths: 12,
  announcement: "",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

let cache: { at: number; data: Record<string, unknown> } | null = null;

export async function getSettings(): Promise<{ [K in SettingKey]: (typeof SETTING_DEFAULTS)[K] extends number ? number : (typeof SETTING_DEFAULTS)[K] extends boolean ? boolean : string }> {
  if (!cache || Date.now() - cache.at > 15_000) {
    const rows = await db.setting.findMany();
    const data: Record<string, unknown> = { ...SETTING_DEFAULTS };
    for (const r of rows) {
      try { data[r.key] = JSON.parse(r.value); } catch { /* ignore */ }
    }
    cache = { at: Date.now(), data };
  }
  return cache.data as never;
}

export async function setSetting(key: SettingKey, value: unknown) {
  await db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  cache = null;
}
