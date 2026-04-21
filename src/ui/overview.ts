import type { VergleichsErgebnis } from "../core/types";
import { T, fmtEur } from "../i18n";

export function renderOverviewArbeit(
  container: HTMLElement,
  ergebnis: VergleichsErgebnis,
): void {
  const arbeitMonat = ergebnis.arbeit.nettoNachAllemMonat;
  container.innerHTML = `
    <div class="overview-card overview-arbeit">
      <div class="overview-value">${fmtEur(arbeitMonat)}</div>
      <div class="overview-sub">${T(
        "frei verfügbar",
        "free disposable",
      )}<br><span class="muted">${T(
        "pro Monat nach Steuern, SV, Miete, Rundfunk, ÖPNV",
        "per month after taxes, social insurance, rent, broadcasting fee, transit",
      )}</span></div>
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
      ? `${T("frei verfügbar", "free disposable")}<br><span class="muted">${T(
          `pro Monat nach Miete, ÖPNV · inkl. ${fmtEur(schwarz)} nicht gemeldeter Nebeneinkünfte`,
          `per month after rent, transit · incl. ${fmtEur(schwarz)} undeclared side income`,
        )}</span>`
      : `${T("frei verfügbar", "free disposable")}<br><span class="muted">${T(
          "pro Monat nach Miete, ÖPNV (+ geldw. Vorteile)",
          "per month after rent, transit (+ in-kind benefits)",
        )}</span>`;
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
    verdict = T("Differenz zugunsten Arbeit", "Difference favours work");
    subText = T(
      "Monatliche Differenz unter den aktuellen Annahmen",
      "Monthly difference under the current assumptions",
    );
    variantClass = "positive";
  } else if (nurDurchSchwarz) {
    verdict = T(
      "Differenz kippt nur durch illegale Nebeneinkünfte",
      "Difference only tips due to illegal side income",
    );
    subText = T(
      `Ohne nicht gemeldete Nebeneinkünfte (${fmtEur(schwarzMonat)}/Monat) läge Arbeit vorn.`,
      `Without undeclared side income (${fmtEur(schwarzMonat)}/month), work would be ahead.`,
    );
    variantClass = "negative has-schwarz";
  } else {
    verdict = T("Differenz zugunsten Bürgergeld", "Difference favours Bürgergeld");
    subText = T(
      "Monatliche Differenz unter den aktuellen Annahmen",
      "Monthly difference under the current assumptions",
    );
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
