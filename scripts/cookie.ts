// npx tsx scripts/cookie.ts email password out
(async () => {
  const [email, password, out] = process.argv.slice(2);
  const r = await fetch("http://localhost:3000/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  const c = r.headers.get("set-cookie")!.split(";")[0].split("=")[1];
  (await import("node:fs")).writeFileSync(out, c);
})();
