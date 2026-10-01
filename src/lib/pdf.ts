import "server-only";
import { chromium, type Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;
let active = 0;
const MAX_CONCURRENT = 3;
const waiters: Array<() => void> = [];

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] }).catch((e) => {
      browserPromise = null;
      throw e;
    });
  }
  const b = await browserPromise;
  if (!b.isConnected()) { browserPromise = null; return getBrowser(); }
  return b;
}

async function acquire() {
  if (active < MAX_CONCURRENT) { active++; return; }
  await new Promise<void>((r) => waiters.push(r));
  active++;
}
function release() { active--; waiters.shift()?.(); }

/** Rend du HTML complet en PDF A4. Le réseau externe est bloqué (sécurité SSRF). */
export async function htmlToPdf(html: string): Promise<Buffer> {
  await acquire();
  try {
    const browser = await getBrowser();
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await ctx.newPage();
      await page.route("**/*", (route) => {
        const u = route.request().url();
        return u.startsWith("data:") || u.startsWith("about:") ? route.continue() : route.abort();
      });
      await page.setContent(html, { waitUntil: "load", timeout: Number(process.env.PDF_TIMEOUT_MS || 20000) });
      const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await ctx.close();
    }
  } finally {
    release();
  }
}
