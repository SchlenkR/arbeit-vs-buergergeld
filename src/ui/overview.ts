import type { VergleichsErgebnis } from "../core/types";

export function renderOverviewArbeit(
  container: HTMLElement,
  ergebnis: VergleichsErgebnis,
): void {
  const arbeitMonat = ergebnis.arbeit.nettoNachAllemMonat;
  container.innerHTML = `
    <div class="overview-card overview-arbeit">
      <div class="overview-value">${fmtEur(arbeitMonat)}</div>
      <div class="overview-sub">frei verfügbar<br><span class="muted">pro Monat nach Steuern, SV, Miete, Rundfunk, ÖPNV</span></div>
    </div>
  `;
}

export function renderOverviewBg(
  container: HTMLElement,
  ergebnis: VergleichsErgebnis,
): void {
  const bgMonat = ergebnis.buergergeld.verfuegbarNachMieteMonat;
  const schwarz = ergebnis.buergergeld.schwarzarbeitJahr / 12;
  const sub =
    schwarz > 0
      ? `frei verfügbar<br><span class="muted">pro Monat nach Miete, ÖPNV · inkl. ${fmtEur(schwarz)} nicht gemeldeter Nebeneinkünfte</span>`
      : `frei verfügbar<br><span class="muted">pro Monat nach Miete, ÖPNV (+ geldw. Vorteile)</span>`;
  container.innerHTML = `
    <div class="overview-card overview-bg">
      <div class="overview-value">${fmtEur(bgMonat)}</div>
      <div class="overview-sub">${sub}</div>
    </div>
  `;
}

export function renderOverviewDelta(
  container: HTMLElement,
  ergebnis: VergleichsErgebnis,
): void {
  const arbeitMonat = ergebnis.arbeit.nettoNachAllemMonat;
  const bgMonat = ergebnis.buergergeld.verfuegbarNachMieteMonat;
  const schwarzMonat = ergebnis.buergergeld.schwarzarbeitJahr / 12;
  const deltaMonat = arbeitMonat - bgMonat;
  const deltaPositive = deltaMonat >= 0;

  const bgOhneSchwarz = bgMonat - schwarzMonat;
  const nurDurchSchwarz =
    !deltaPositive && schwarzMonat > 0 && arbeitMonat >= bgOhneSchwarz;

  let verdict: string;
  let subText: string;
  let variantClass: string;

  if (deltaPositive) {
    verdict = "Differenz zugunsten Arbeit";
    subText = "Monatliche Differenz unter den aktuellen Annahmen";
    variantClass = "positive";
  } else if (nurDurchSchwarz) {
    verdict = "Differenz kippt nur durch illegale Nebeneinkünfte";
    subText = `Ohne nicht gemeldete Nebeneinkünfte (${fmtEur(schwarzMonat)}/Monat) läge Arbeit vorn.`;
    variantClass = "negative has-schwarz";
  } else {
    verdict = "Differenz zugunsten Bürgergeld";
    subText = "Monatliche Differenz unter den aktuellen Annahmen";
    variantClass = "negative";
  }

  container.innerHTML = `
    <div class="overview-card overview-delta ${variantClass}">
      <div class="delta-body">
        <div class="overview-value overview-value-big">${deltaPositive ? "+" : ""}${fmtEur(deltaMonat)}</div>
        <div class="delta-text">
          <div class="overview-verdict">${verdict}</div>
          <div class="overview-sub">${subText}</div>
        </div>
      </div>
    </div>
  `;
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}
