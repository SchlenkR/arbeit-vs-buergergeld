import "./style.css";
import { berechneVergleich } from "./core/compare";
import { sankeyArbeit, sankeyBuergergeld } from "./core/sankey";
import { erklaereErgebnis } from "./core/explain";
import { renderForm } from "./ui/form";
import {
  renderOverviewArbeit,
  renderOverviewBg,
  renderOverviewDelta,
} from "./ui/overview";
import { renderSankey } from "./ui/sankey-chart";
import { renderResultsTable } from "./ui/results-table";
import { renderExplanation } from "./ui/explanation";
import { renderBreakEvenChart } from "./ui/breakeven-chart";
import { renderLegalNotice } from "./ui/legal-notice";
import { buildAnspruchsuebersicht } from "./core/ansprueche";
import { renderAnsprueche } from "./ui/ansprueche-cards";
import type { Szenario } from "./core/types";
import type { AntragsAnspruchItem } from "./config";
import { T, lang, setLang } from "./i18n";

document.documentElement.lang = lang;
document.title = T(
  "Einkommensrechner: Arbeit vs. Bürgergeld (2026)",
  "Income Calculator: Work vs. Bürgergeld (2026)",
);

const app = document.getElementById("app")!;
app.innerHTML = `
  <header class="app-header">
    <h1>${T("Einkommensrechner", "Income Calculator")}</h1>
    <span class="tagline">${T(
      "Arbeit (angestellt) vs. Bürgergeld, Deutschland nach Wohnlage, Rechtsstand 2026.",
      "Salaried work vs. Bürgergeld (German welfare), by residential tier, legal status 2026.",
    )}</span>
    <span class="lang-switch" role="group" aria-label="${T("Sprache", "Language")}">
      <button type="button" class="lang-btn${lang === "de" ? " is-active" : ""}" data-lang="de">DE</button>
      <button type="button" class="lang-btn${lang === "en" ? " is-active" : ""}" data-lang="en">EN</button>
    </span>
  </header>
  <section class="app-banner" aria-label="${T("Wichtige Hinweise", "Important notes")}">
    <p class="app-banner-line">
      <strong>${T(
        "Bürgergeld ist eine Hilfe, kein Lebensmodell.",
        "Bürgergeld is a safety net, not a way of life.",
      )}</strong>
      ${T(
        "Es existiert für Menschen, die wirklich nicht anders können. Wer arbeiten kann, ist gesetzlich zur Arbeit verpflichtet (§ 2 SGB II, Mitwirkungspflichten). Bürgergeld zu beziehen heißt: andere arbeiten für dich. Nichts davon fällt vom Himmel.",
        "It exists for people who genuinely cannot provide for themselves. Anyone able to work is legally required to do so (§ 2 SGB II, duty to cooperate). Receiving Bürgergeld means others are working for you. None of this falls from the sky.",
      )}
    </p>
    <p class="app-banner-line">
      <strong>${T(
        "Dieses Tool ist keine Beratung.",
        "This tool is not professional advice.",
      )}</strong>
      ${T(
        "Es ist eine Modellrechnung, die Fehler enthalten kann. Dieses Tool wurde nicht von einem Steuerberater, Sozialrechtler oder sonstigen Fachexperten erstellt. Für konkrete Entscheidungen braucht es eine echte Beratung. Bitte diesen Hinweis ernst nehmen.",
        "It is a model calculation that may contain errors. This tool was not built by a tax advisor, a social-law specialist, or any other certified expert. Actual decisions require real professional advice. Please take this disclaimer seriously.",
      )}
    </p>
  </section>
  <form id="eingabe" class="form">
    <div class="layout">
      <aside id="formContainer"></aside>
      <section id="results">
        <div class="two-col-headers">
          <h2 class="column-header column-header-arbeit">${T(
            "Arbeit (angestellt)",
            "Work (salaried)",
          )}</h2>
          <h2 class="column-header column-header-bg">${T(
            "Bürgergeld",
            "Bürgergeld",
          )}</h2>
        </div>
        <div class="two-col-panels">
          <div id="arbeitControls" class="side-controls side-arbeit"></div>
          <div id="bgControls" class="side-controls side-bg"></div>
        </div>

        <div class="two-col-panels">
          <div id="overviewArbeit"></div>
          <div id="overviewBg"></div>
        </div>
        <div class="delta-row">
          <div id="overviewDelta"></div>
        </div>

        <div class="two-col-panels">
          <div id="chartArbeit" class="chart"></div>
          <div id="chartBg" class="chart"></div>
        </div>
        <div id="breakEvenChart"></div>

        <section class="details-flow">
          <h2>${T(
            "Details: Tabelle, Ansprüche, Methodik",
            "Details: table, entitlements, methodology",
          )}</h2>
          <div id="summaryTable"></div>
          <div id="ansprueche"></div>
          <div id="explanation"></div>
        </section>
        <footer class="disclaimer" id="legalNotice"></footer>
      </section>
    </div>
  </form>
`;

document.querySelectorAll<HTMLButtonElement>(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.lang as "de" | "en" | undefined;
    if (next && next !== lang) setLang(next);
  });
});

const formContainer = document.getElementById("formContainer")!;
const arbeitControlsContainer = document.getElementById("arbeitControls")!;
const bgControlsContainer = document.getElementById("bgControls")!;
const overviewArbeit = document.getElementById("overviewArbeit")!;
const overviewBg = document.getElementById("overviewBg")!;
const overviewDelta = document.getElementById("overviewDelta")!;
const columnHeaderArbeit =
  document.querySelector<HTMLElement>(".column-header-arbeit")!;
const columnHeaderBg = document.querySelector<HTMLElement>(".column-header-bg")!;
const breakEvenContainer = document.getElementById("breakEvenChart")!;
const summaryContainer = document.getElementById("summaryTable")!;
const ansprueicheContainer = document.getElementById("ansprueche")!;
const chartArbeit = document.getElementById("chartArbeit")!;
const chartBg = document.getElementById("chartBg")!;
const explanationContainer = document.getElementById("explanation")!;
const legalNotice = document.getElementById("legalNotice")!;

renderLegalNotice(legalNotice);

function aktualisiere(szenario: Szenario, antragsItems: AntragsAnspruchItem[]): void {
  const ergebnis = berechneVergleich(szenario);
  const arbeitWinner =
    ergebnis.arbeit.nettoNachAllemMonat >=
    ergebnis.buergergeld.verfuegbarNachMieteMonat;
  columnHeaderArbeit.classList.toggle("is-winner", arbeitWinner);
  columnHeaderArbeit.classList.toggle("is-loser", !arbeitWinner);
  columnHeaderBg.classList.toggle("is-winner", !arbeitWinner);
  columnHeaderBg.classList.toggle("is-loser", arbeitWinner);
  renderOverviewArbeit(overviewArbeit, ergebnis);
  renderOverviewBg(overviewBg, ergebnis);
  renderOverviewDelta(overviewDelta, ergebnis);
  renderSankey(chartArbeit, sankeyArbeit(ergebnis));
  renderSankey(chartBg, sankeyBuergergeld(ergebnis));
  renderBreakEvenChart(breakEvenContainer, szenario);
  renderResultsTable(summaryContainer, ergebnis);
  renderAnsprueche(
    ansprueicheContainer,
    buildAnspruchsuebersicht(szenario.haushalt, antragsItems),
  );
  renderExplanation(explanationContainer, erklaereErgebnis(ergebnis));
}

renderForm(
  {
    settings: formContainer,
    arbeit: arbeitControlsContainer,
    bg: bgControlsContainer,
  },
  { onChange: aktualisiere },
);

const antragsDialog = document.getElementById(
  "antragsDialog",
) as HTMLDialogElement;

antragsDialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
});

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (target.closest("[data-open-antrags]")) {
    e.preventDefault();
    antragsDialog.showModal();
    document.body.classList.add("modal-open");
    return;
  }
  if (target.closest("[data-close-antrags]")) {
    e.preventDefault();
    antragsDialog.close();
  }
});

antragsDialog.addEventListener("click", (e) => {
  if (e.target === antragsDialog) antragsDialog.close();
});
