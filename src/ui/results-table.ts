import type { VergleichsErgebnis } from "../core/types";
import { WOHNLAGEN_2026 } from "../core/constants2026";
import { T, fmtEur } from "../i18n";

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
      ${T("Wohnlage", "Residential tier")} <strong>${wohnlage.label}</strong> · ${wohnlage.beispiele}
    </p>
    <div class="summary">
      <div class="summary-col summary-arbeit">
        <h3>${T("Arbeit", "Work")}</h3>
        <dl>
          <dt>${T("Brutto (Jahr)", "Gross (year)")}</dt><dd>${fmtEur(arbeit.bruttoJahr)}</dd>
          <dt>${T("Sozialabgaben", "Social-insurance contributions")}</dt><dd>− ${fmtEur(arbeit.sozialabgabenJahr)}</dd>
          <dt>${T("Einkommensteuer", "Income tax")}</dt><dd>− ${fmtEur(arbeit.einkommensteuerJahr)}</dd>
          <dt>${T("Soli", "Solidarity surcharge")}</dt><dd>− ${fmtEur(arbeit.soliJahr)}</dd>
          <dt>${T("Kindergeld", "Child benefit")}</dt><dd>+ ${fmtEur(arbeit.kindergeldJahr)}</dd>
          <dt>${T("Miete (warm)", "Rent (warm)")}</dt><dd>− ${fmtEur(arbeit.mieteJahr)}</dd>
          <dt>${T("Rundfunkbeitrag", "Broadcasting fee")}</dt><dd>− ${fmtEur(arbeit.rundfunkbeitragJahr)}</dd>
          <dt>${T(
            "ÖPNV (Deutschlandticket regulär)",
            "Public transit (Deutschlandticket regular)",
          )}</dt><dd>− ${fmtEur(arbeit.oepnvJahr)}</dd>
          <dt class="total">${T("Netto verfügbar (Jahr)", "Net disposable (year)")}</dt>
          <dd class="total">${fmtEur(arbeit.nettoNachAllemJahr)}</dd>
          <dt class="total">${T("Netto verfügbar (Monat)", "Net disposable (month)")}</dt>
          <dd class="total">${fmtEur(arbeit.nettoNachAllemMonat)}</dd>
        </dl>
      </div>
      <div class="summary-col summary-buergergeld">
        <h3>${T("Bürgergeld", "Bürgergeld")}</h3>
        <dl>
          <dt>${T("Regelbedarfe", "Standard needs")}</dt><dd>${fmtEur(buergergeld.regelbedarfJahr)}</dd>
          <dt>${T("Mehrbedarfe (§ 21)", "Additional needs (§ 21)")}</dt><dd>${fmtEur(mbGesamt)}</dd>
          <dt>${T("KdU (Miete + Heizung)", "KdU (rent + heating)")}</dt><dd>${fmtEur(buergergeld.kdUJahr)}</dd>
          <dt>${T(
            "Bildung &amp; Teilhabe (§ 28)",
            "Education &amp; participation (§ 28)",
          )}</dt><dd>${fmtEur(buergergeld.butGesamtJahr)}</dd>
          <dt>${T("Geldwerte Vorteile", "In-kind benefits")}</dt><dd>≈ ${fmtEur(buergergeld.geldwerteVorteileJahr)}</dd>
          <dt>${T("Kindergeld (angerechnet)", "Child benefit (offset)")}</dt>
          <dd>− ${fmtEur(buergergeld.kindergeldAngerechnetJahr)}</dd>
          <dt>${T(
            "Miete (warm, tatsächlich)",
            "Rent (warm, actual)",
          )}</dt><dd>− ${fmtEur(buergergeld.mieteJahr)}</dd>
          <dt>${T("Rundfunkbeitrag", "Broadcasting fee")}</dt><dd>− ${fmtEur(
            buergergeld.rundfunkbeitragJahr,
          )} (${T("befreit", "exempt")})</dd>
          <dt>${T(
            "ÖPNV (Deutschlandticket ermäßigt)",
            "Public transit (Deutschlandticket reduced)",
          )}</dt><dd>− ${fmtEur(buergergeld.oepnvJahr)}</dd>
          <dt class="total">${T(
            "Verfügbar nach Miete (Jahr)",
            "Disposable after rent (year)",
          )}</dt>
          <dd class="total">${fmtEur(buergergeld.verfuegbarNachMieteJahr)}</dd>
          <dt class="total">${T(
            "Verfügbar nach Miete (Monat)",
            "Disposable after rent (month)",
          )}</dt>
          <dd class="total">${fmtEur(buergergeld.verfuegbarNachMieteMonat)}</dd>
        </dl>
      </div>
      <div class="summary-col summary-delta ${delta >= 0 ? "positive" : "negative"}">
        <h3>${T(
          "Differenz (Arbeit − Bürgergeld)",
          "Difference (Work − Bürgergeld)",
        )}</h3>
        <p class="delta-big">${delta >= 0 ? "+" : ""}${fmtEur(deltaMonat)} / ${T("Monat", "month")}</p>
        <p class="delta-month">${delta >= 0 ? "+" : ""}${fmtEur(delta)} / ${T("Jahr", "year")}</p>
        <p class="hint">
          ${
            delta >= 0
              ? T(
                  "Unter diesen Annahmen liegt Arbeit finanziell über Bürgergeld.",
                  "Under these assumptions, work comes out financially ahead of Bürgergeld.",
                )
              : T(
                  "Unter diesen Annahmen liegt Bürgergeld finanziell über Arbeit. Wohngeld und Kinderzuschlag sind derzeit mit 0 € angesetzt.",
                  "Under these assumptions, Bürgergeld comes out financially ahead of work. Housing benefit and child supplement are currently set to 0 €.",
                )
          }
        </p>
      </div>
    </div>
  `;
}
