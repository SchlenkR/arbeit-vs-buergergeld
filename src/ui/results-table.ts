import type { VergleichsErgebnis } from "../core/types";
import { WOHNLAGEN_2026 } from "../core/constants2026";

export function renderResultsTable(
  container: HTMLElement,
  ergebnis: VergleichsErgebnis,
): void {
  const { arbeit, buergergeld } = ergebnis;
  const wohnlage = WOHNLAGEN_2026[ergebnis.szenario.haushalt.wohnlage];
  const delta = arbeit.nettoNachAllemJahr - buergergeld.verfuegbarNachMieteJahr;
  const deltaMonat = delta / 12;

  const mbGesamt =
    buergergeld.mehrbedarfAlleinerziehendJahr +
    buergergeld.mehrbedarfWarmwasserJahr +
    buergergeld.mehrbedarfSchwangerschaftJahr;

  container.innerHTML = `
    <p class="wohnlage-banner muted">
      Wohnlage <strong>${wohnlage.label}</strong> · ${wohnlage.beispiele}
    </p>
    <div class="summary">
      <div class="summary-col summary-arbeit">
        <h3>Arbeit</h3>
        <dl>
          <dt>Brutto (Jahr)</dt><dd>${fmtEur(arbeit.bruttoJahr)}</dd>
          <dt>Sozialabgaben</dt><dd>− ${fmtEur(arbeit.sozialabgabenJahr)}</dd>
          <dt>Einkommensteuer</dt><dd>− ${fmtEur(arbeit.einkommensteuerJahr)}</dd>
          <dt>Soli</dt><dd>− ${fmtEur(arbeit.soliJahr)}</dd>
          <dt>Kindergeld</dt><dd>+ ${fmtEur(arbeit.kindergeldJahr)}</dd>
          <dt>Miete (warm)</dt><dd>− ${fmtEur(arbeit.mieteJahr)}</dd>
          <dt>Rundfunkbeitrag</dt><dd>− ${fmtEur(arbeit.rundfunkbeitragJahr)}</dd>
          <dt>ÖPNV (Deutschlandticket regulär)</dt><dd>− ${fmtEur(arbeit.oepnvJahr)}</dd>
          <dt class="total">Netto verfügbar (Jahr)</dt>
          <dd class="total">${fmtEur(arbeit.nettoNachAllemJahr)}</dd>
          <dt class="total">Netto verfügbar (Monat)</dt>
          <dd class="total">${fmtEur(arbeit.nettoNachAllemMonat)}</dd>
        </dl>
      </div>
      <div class="summary-col summary-buergergeld">
        <h3>Bürgergeld</h3>
        <dl>
          <dt>Regelbedarfe</dt><dd>${fmtEur(buergergeld.regelbedarfJahr)}</dd>
          <dt>Mehrbedarfe (§ 21)</dt><dd>${fmtEur(mbGesamt)}</dd>
          <dt>KdU (Miete + Heizung)</dt><dd>${fmtEur(buergergeld.kdUJahr)}</dd>
          <dt>Bildung &amp; Teilhabe (§ 28)</dt><dd>${fmtEur(buergergeld.butGesamtJahr)}</dd>
          <dt>Geldwerte Vorteile</dt><dd>≈ ${fmtEur(buergergeld.geldwerteVorteileJahr)}</dd>
          <dt>Kindergeld (angerechnet)</dt>
          <dd>− ${fmtEur(buergergeld.kindergeldAngerechnetJahr)}</dd>
          <dt>Miete (warm, tatsächlich)</dt><dd>− ${fmtEur(buergergeld.mieteJahr)}</dd>
          <dt>Rundfunkbeitrag</dt><dd>− ${fmtEur(buergergeld.rundfunkbeitragJahr)} (befreit)</dd>
          <dt>ÖPNV (Deutschlandticket ermäßigt)</dt><dd>− ${fmtEur(buergergeld.oepnvJahr)}</dd>
          <dt class="total">Verfügbar nach Miete (Jahr)</dt>
          <dd class="total">${fmtEur(buergergeld.verfuegbarNachMieteJahr)}</dd>
          <dt class="total">Verfügbar nach Miete (Monat)</dt>
          <dd class="total">${fmtEur(buergergeld.verfuegbarNachMieteMonat)}</dd>
        </dl>
      </div>
      <div class="summary-col summary-delta ${delta >= 0 ? "positive" : "negative"}">
        <h3>Differenz (Arbeit − Bürgergeld)</h3>
        <p class="delta-big">${delta >= 0 ? "+" : ""}${fmtEur(deltaMonat)} / Monat</p>
        <p class="delta-month">${delta >= 0 ? "+" : ""}${fmtEur(delta)} / Jahr</p>
        <p class="hint">
          ${
            delta >= 0
              ? "Unter diesen Annahmen liegt Arbeit finanziell über Bürgergeld."
              : "Unter diesen Annahmen liegt Bürgergeld finanziell über Arbeit. Wohngeld und Kinderzuschlag sind derzeit mit 0 € angesetzt."
          }
        </p>
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
