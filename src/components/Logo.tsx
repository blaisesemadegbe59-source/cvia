import Link from "next/link";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Cvia";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12906c" /><stop offset="1" stopColor="#0a5640" /></linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lg)" />
      <rect x="11" y="9" width="18" height="22" rx="3" fill="#fff" opacity=".95" />
      <circle cx="17" cy="16" r="2.6" fill="#0b6b4f" />
      <rect x="21.5" y="14" width="5" height="1.8" rx=".9" fill="#a7d9c6" />
      <rect x="21.5" y="17.4" width="4" height="1.8" rx=".9" fill="#d6ece3" />
      <rect x="13.5" y="22" width="13" height="1.8" rx=".9" fill="#c9e6da" />
      <rect x="13.5" y="25.5" width="9" height="1.8" rx=".9" fill="#c9e6da" />
      <path d="M26 28.5l2.2 2.2 4.3-5" fill="none" stroke="#facc15" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={`${APP_NAME} — accueil`}>
      <LogoMark />
      <span className={`font-display text-[22px] font-extrabold tracking-tight ${light ? "text-white" : "text-stone-900"}`}>{APP_NAME}</span>
    </Link>
  );
}
