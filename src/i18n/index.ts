export type Lang = "de" | "en";

const STORAGE_KEY = "eink.lang";

function detectDefault(): Lang {
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("de")) return "de";
    return "en";
  }
  return "de";
}

export function getLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return detectDefault();
}

export function setLang(next: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  location.reload();
}

export const lang: Lang = getLang();

export const locale: string = lang === "de" ? "de-DE" : "en-US";

/** Pick between a German and an English variant at runtime. */
export function T(de: string, en: string): string {
  return lang === "de" ? de : en;
}

export function fmtEur(v: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: maxFractionDigits,
  }).format(v);
}

export function fmtEur2(v: number): string {
  return fmtEur(v, 2);
}

export function fmtNum(v: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: maxFractionDigits,
  }).format(v);
}

export function fmtPct(v: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: maxFractionDigits,
  }).format(v);
}
