// Usage: npx tsx scripts/snap.ts <path> <out.png> [width] [full] [cookieFile]
import { chromium } from "playwright";
import fs from "node:fs";
(async () => {
  const [path, out, w = "1280", full = "1", cookie] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: Number(w), height: Number(w) < 600 ? 800 : 800 }, deviceScaleFactor: 1 });
  if (cookie && fs.existsSync(cookie)) await ctx.addCookies([{ name: "cvia_session", value: fs.readFileSync(cookie, "utf8").trim(), url: "http://localhost:3000" }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
  await p.goto("http://localhost:3000" + path, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out, fullPage: full === "1" });
  await b.close();
})();
