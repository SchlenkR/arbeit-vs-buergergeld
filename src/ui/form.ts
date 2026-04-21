import type { Haushalt, Szenario } from "../core/types";
import { WOHNLAGEN_2026 } from "../core/constants2026";
import {
  berechneKdU,
  berechneMarktWarmmiete,
  berechneWohnflaecheQm,
} from "../core/buergergeld";
import { berechneSozialabgabenAngestellt } from "../core/sozialabgaben";
import {
  BRUTTO_MIN,
  BRUTTO_MAX,
  BRUTTO_STEP,
  BRUTTO_DEFAULT,
  SCHWARZ_MAX,
  SCHWARZ_STEP,
  SCHWARZ_DEFAULT,
  KINDER_MAX,
  KINDER_DEFAULT,
  TYP_DEFAULT,
  WOHNLAGE_DEFAULT,
  OEPNV_NUTZER_DEFAULT,
  OEPNV_NUTZER_MAX,
  WARMWASSER_DEZENTRAL_DEFAULT,
  SCHWANGERSCHAFT_AB_13_SSW_DEFAULT,
  adultsFor,
  ANTRAGS_PRESETS,
  ANTRAGS_PRESET_DEFAULT,
  ANTRAGS_PRESET_ORDER,
  buildAntragsAnspruchItems,
  getAntragsPreset,
  type AntragsPresetId,
  type AntragsPreset,
  type AntragsAnspruchItem,
} from "../config";
import type { HaushaltsTyp } from "../core/types";
import type { Wohnlage } from "../core/constants2026";
import { T, fmtEur, fmtEur2 } from "../i18n";

export interface FormContainers {
  settings: HTMLElement;
  arbeit: HTMLElement;
  bg: HTMLElement;
}

export interface FormCallbacks {
  onChange: (szenario: Szenario, antragsItems: AntragsAnspruchItem[]) => void;
}

const HAUSHALTSTYPEN: { value: HaushaltsTyp; main: string; sub: string }[] = [
  { value: "single", main: T("Single", "Single"), sub: T("1 Erw.", "1 adult") },
  {
    value: "alleinerziehend",
    main: T("Alleinerz.", "Single parent"),
    sub: T("1 Erw. + Kind(er)", "1 adult + child(ren)"),
  },
  { value: "paar", main: T("Paar", "Couple"), sub: T("unverh.", "unmarried") },
  {
    value: "paar_verheiratet",
    main: T("Paar", "Couple"),
    sub: T("verheiratet", "married"),
  },
];

const WOHNLAGEN_OPTIONS: { value: Wohnlage; main: string; sub: string }[] = [
  { value: "A", main: "A", sub: T("Top-Ballung", "Top metro") },
  { value: "B", main: "B", sub: T("Großstadt", "Large city") },
  { value: "C", main: "C", sub: T("Mittelstadt", "Mid-sized city") },
  { value: "D", main: "D", sub: T("Ländlich", "Rural") },
];


export function renderForm(
  containers: FormContainers,
  callbacks: FormCallbacks,
): void {
  containers.settings.innerHTML = renderSettingsHtml();
  containers.arbeit.innerHTML = renderArbeitHtml();
  containers.bg.innerHTML = renderBgHtml();

  const form = document.getElementById("eingabe") as HTMLFormElement;
  const kinderAlterDiv =
    containers.settings.querySelector<HTMLDivElement>("#kinderAlter")!;
  const mieteAnzeige =
    containers.settings.querySelector<HTMLElement>("#mieteAnzeige")!;
  const wohnlageHint =
    containers.settings.querySelector<HTMLElement>("#wohnlageHint")!;

  function getSelect(name: string): string {
    const el = form.elements.namedItem(name);
    if (el instanceof RadioNodeList) return el.value;
    return (el as HTMLSelectElement | HTMLInputElement).value;
  }

  function getRange(name: string): number {
    return parseFloat((form.elements.namedItem(name) as HTMLInputElement).value) || 0;
  }

  function aktualisiereOepnvSlider(typ: HaushaltsTyp, anzahlKinder: number): void {
    const slider = form.elements.namedItem("oepnvNutzer") as HTMLInputElement;
    const prevMax = parseInt(slider.max, 10) || 0;
    const prevVal = parseInt(slider.value, 10) || 0;
    const newMax = adultsFor(typ) + anzahlKinder;
    slider.max = String(newMax);
    if (prevVal === prevMax || prevVal > newMax) {
      slider.value = String(newMax);
    }
  }

  function renderKinderAlterInputs(): void {
    const n = getRange("anzahlKinder");
    (form.elements.namedItem("anzahlKinderOut") as HTMLOutputElement).value = String(n);
    const vorhandeneAlter = Array.from(
      kinderAlterDiv.querySelectorAll<HTMLInputElement>('input[name^="alter"]'),
    ).map((el) => parseInt(el.value, 10) || 0);

    const defaults = [5, 10, 14, 3, 7, 11];
    const felder: string[] = [];
    for (let i = 0; i < n; i++) {
      const val = vorhandeneAlter[i] ?? defaults[i] ?? 5;
      felder.push(`
        <label class="kind-label">${T("Alter Kind", "Age of child")} ${i + 1}
          <input type="number" name="alter${i}" min="0" max="24" value="${val}" />
        </label>
      `);
    }
    kinderAlterDiv.innerHTML = felder.join("");
    feuereChange();
  }

  function aktualisiereMieteAnzeige(haushalt: Haushalt): void {
    const wohnlage = haushalt.wohnlage;
    const w = WOHNLAGEN_2026[wohnlage];
    wohnlageHint.innerHTML = w.beispiele;

    const qm = berechneWohnflaecheQm(haushalt);
    const warmmiete = haushalt.warmmieteEurProMonat;
    const angemessen = berechneKdU(haushalt);
    const personen =
      (haushalt.typ === "paar" || haushalt.typ === "paar_verheiratet" ? 2 : 1) +
      haushalt.kinder.length;
    const qmPreis =
      w.nettokaltEurProQmMonat + w.nebenkostenEurProQmMonat + w.heizkostenEurProQmMonat;

    mieteAnzeige.innerHTML = `
      <div class="computed-field-title">${T(
        "Warmmiete (berechnet)",
        "Warm rent (computed)",
      )}</div>
      <div class="computed-field-value">${fmtEur(warmmiete)} <span class="muted">/ ${T(
        "Monat",
        "month",
      )}</span></div>
      <div class="computed-field-formel">
        ${personen} ${T("Pers.", "pers.")} · ${Math.round(qm)} m² × ${qmPreis
          .toFixed(2)
          .replace(".", T(",", "."))} €/m² (${T("warm", "warm")})
      </div>
      <div class="computed-field-check">
        ${T("KdU-Grenze (§ 22 SGB II)", "KdU limit (§ 22 SGB II)")}: ${fmtEur(angemessen)} ${
          warmmiete <= angemessen
            ? `<span class="ok">✓ ${T("angemessen", "within limit")}</span>`
            : `<span class="warn">⚠ ${T(
                "über Grenze; BG deckelt",
                "above limit; Bürgergeld caps",
              )}</span>`
        }
      </div>
    `;
  }

  function feuereChange(): void {
    const typ = getSelect("typ") as HaushaltsTyp;
    const wohnlage = getSelect("wohnlage") as Wohnlage;
    const anzahlKinder = getRange("anzahlKinder");
    const kinder = Array.from(
      kinderAlterDiv.querySelectorAll<HTMLInputElement>('input[name^="alter"]'),
    ).map((el) => ({ alter: parseInt(el.value, 10) || 0 }));

    const brutto = getRange("bruttoJahr");
    (form.elements.namedItem("bruttoOut") as HTMLOutputElement).value = fmtEur(brutto);
    const kinderU25 = kinder.filter((k) => k.alter < 25).length;
    const svAngestellt = berechneSozialabgabenAngestellt({
      bruttoJahr: brutto,
      anzahlKinderUnter25: kinderU25,
      alterVersicherter: 35,
    });
    const gesamtkostenAg = brutto + svAngestellt.arbeitgeberAnteilJahr;
    const setText = (sel: string, val: string): void => {
      const el = form.querySelector<HTMLElement>(sel);
      if (el) el.textContent = val;
    };
    setText("[data-gesamt-big]", fmtEur(gesamtkostenAg));
    setText("[data-brutto-echo]", fmtEur(brutto));
    setText("[data-ag-anteil]", fmtEur(svAngestellt.arbeitgeberAnteilJahr));
    setText("[data-gesamt-small]", fmtEur(gesamtkostenAg));
    const oepnv = getRange("oepnvNutzer");
    (form.elements.namedItem("oepnvOut") as HTMLOutputElement).value = String(oepnv);
    (form.elements.namedItem("anzahlKinderOut") as HTMLOutputElement).value =
      String(anzahlKinder);
    const schwarz = getRange("schwarzarbeitMonat");
    (form.elements.namedItem("schwarzOut") as HTMLOutputElement).value = fmtEur(schwarz);

    const antragsPresetId = (getSelect("antragsPreset") as AntragsPresetId) || ANTRAGS_PRESET_DEFAULT;
    const antragsPreset = getAntragsPreset(antragsPresetId);

    const basisHaushalt: Haushalt = {
      typ,
      kinder,
      wohnlage,
      wohnflaecheQm: 0,
      warmmieteEurProMonat: 0,
      warmwasserDezentral: (
        form.elements.namedItem("warmwasserDezentral") as HTMLInputElement
      ).checked,
      schwangerschaftAb13SSW: (
        form.elements.namedItem("schwangerschaftAb13SSW") as HTMLInputElement
      ).checked,
      oepnvNutzer: oepnv,
    };
    const qm = berechneWohnflaecheQm(basisHaushalt);
    const warmmiete = berechneMarktWarmmiete(basisHaushalt);
    const haushalt: Haushalt = {
      ...basisHaushalt,
      wohnflaecheQm: qm,
      warmmieteEurProMonat: warmmiete,
    };
    aktualisiereMieteAnzeige(haushalt);

    const antragsItems = buildAntragsAnspruchItems(antragsPreset, haushalt);
    const antragsLeistungenMonat = antragsItems.reduce((s, i) => s + i.eurMonat, 0);
    aktualisiereAntragsAnzeige(antragsPreset, antragsLeistungenMonat);

    const szenario: Szenario = {
      haushalt,
      arbeit: {
        bruttoJahr: brutto,
      },
      buergergeld: {
        schwarzarbeitEurMonat: schwarz,
        antragsLeistungenEurMonat: antragsLeistungenMonat,
      },
    };

    callbacks.onChange(szenario, antragsItems);
  }

  function aktualisiereAntragsAnzeige(preset: AntragsPreset, summeMonat: number): void {
    const summeEl = form.querySelector<HTMLElement>("[data-antrags-summe]");
    if (summeEl) summeEl.textContent = fmtEur(summeMonat);
    const nameEl = form.querySelector<HTMLElement>("[data-antrags-preset-name]");
    if (nameEl) nameEl.textContent = `${T("Szenario", "Scenario")}: ${preset.titel}`;
    const detailEl = form.querySelector<HTMLElement>("[data-antrags-detail]");
    if (!detailEl) return;
    if (preset.items.length === 0) {
      detailEl.innerHTML = `
        <p class="antrags-beschreibung">${preset.beschreibung}</p>
        <p class="antrags-empty">${T(
          "Keine Antragsleistungen modelliert.",
          "No on-request benefits modelled.",
        )}</p>
      `;
      return;
    }
    const rows = preset.items
      .map(
        (it) => `
        <li class="antrags-item">
          <div class="antrags-item-head">
            <span class="antrags-item-label">${it.label}</span>
            <span class="antrags-item-amount">${fmtEur2(it.eurMonat)} / ${basisLabel(it.basis)}</span>
          </div>
          <div class="antrags-item-src">
            <span class="antrags-item-paragraf">${it.paragraf}</span>
            <span class="antrags-item-quelle">${it.quelle}</span>
          </div>
        </li>
      `,
      )
      .join("");
    detailEl.innerHTML = `
      <p class="antrags-beschreibung">${preset.beschreibung}</p>
      <ul class="antrags-liste">${rows}</ul>
    `;
  }

  form.addEventListener("input", (e) => {
    const target = e.target as HTMLElement;
    const name = target.getAttribute("name");

    if (name === "anzahlKinder" || name === "typ") {
      aktualisiereOepnvSlider(
        getSelect("typ") as HaushaltsTyp,
        getRange("anzahlKinder"),
      );
    }

    if (name === "anzahlKinder") {
      renderKinderAlterInputs();
      return;
    }
    feuereChange();
  });

  aktualisiereOepnvSlider(TYP_DEFAULT, KINDER_DEFAULT);
  renderKinderAlterInputs();
}

function renderSettingsHtml(): string {
  return `
    <fieldset>
      <legend>${T("Haushalt", "Household")}</legend>
      <div class="btn-group" role="radiogroup" aria-label="${T("Haushaltstyp", "Household type")}">
        ${HAUSHALTSTYPEN.map(
          (t) => `
          <label class="btn-option">
            <input type="radio" name="typ" value="${t.value}"
              ${t.value === TYP_DEFAULT ? "checked" : ""} />
            <span class="btn-main">${t.main}</span>
            <span class="btn-sub">${t.sub}</span>
          </label>
        `,
        ).join("")}
      </div>
      <label class="slider-label">
        ${T("Anzahl Kinder", "Number of children")}: <output name="anzahlKinderOut">${KINDER_DEFAULT}</output>
        <input type="range" name="anzahlKinder"
          min="0" max="${KINDER_MAX}" step="1" value="${KINDER_DEFAULT}" />
      </label>
      <div id="kinderAlter" class="kinder-alter"></div>
    </fieldset>

    <fieldset>
      <legend>${T("Wohnlage", "Residential tier")}</legend>
      <div class="btn-group" role="radiogroup" aria-label="${T("Wohnlage", "Residential tier")}">
        ${WOHNLAGEN_OPTIONS.map(
          (w) => `
          <label class="btn-option">
            <input type="radio" name="wohnlage" value="${w.value}"
              ${w.value === WOHNLAGE_DEFAULT ? "checked" : ""} />
            <span class="btn-main">${w.main}</span>
            <span class="btn-sub">${w.sub}</span>
          </label>
        `,
        ).join("")}
      </div>
      <small class="hint" id="wohnlageHint"></small>
      <div class="computed-field" id="mieteAnzeige"></div>
    </fieldset>

    <details class="details-section">
      <summary>${T(
        "Detail-Annahmen (marginal, meist unverändert)",
        "Detail assumptions (marginal, rarely changed)",
      )}</summary>
      <fieldset>
        <legend>${T("ÖPNV", "Public transit")}</legend>
        <label class="slider-label">
          ${T(
            "Deutschlandticket-Nutzer (Personen)",
            "Deutschlandticket users (persons)",
          )}: <output name="oepnvOut">${OEPNV_NUTZER_DEFAULT}</output>
          <input type="range" name="oepnvNutzer" min="0" max="${OEPNV_NUTZER_MAX}" step="1" value="${OEPNV_NUTZER_DEFAULT}" />
          <small class="hint">
            ${T("regulär", "regular")} ${fmtEur(58)}/${T("Monat", "month")} · ${T(
              "mit Sozialpass",
              "with welfare pass",
            )} ${fmtEur(31.5)}/${T("Monat", "month")}
          </small>
        </label>
      </fieldset>
      <fieldset>
        <legend>${T("Sonderfälle", "Special cases")}</legend>
        <label>
          <input type="checkbox" name="warmwasserDezentral" ${WARMWASSER_DEZENTRAL_DEFAULT ? "checked" : ""} />
          ${T(
            "Warmwasser dezentral (Boiler/Durchlauferhitzer)",
            "Decentralised hot water (boiler / instantaneous heater)",
          )}
          <small class="hint">→ ${T(
            "Mehrbedarf § 21 Abs. 7 SGB II, ~13 €/Monat/Erw.",
            "Additional need § 21 (7) SGB II, ~13 €/month/adult.",
          )}</small>
        </label>
        <label>
          <input type="checkbox" name="schwangerschaftAb13SSW" ${SCHWANGERSCHAFT_AB_13_SSW_DEFAULT ? "checked" : ""} />
          ${T(
            "Schwangerschaft ab 13. SSW",
            "Pregnancy from 13th week",
          )}
          <small class="hint">→ ${T(
            `Mehrbedarf § 21 Abs. 2 SGB II (17 % RBS1 = ${fmtEur(95.71)}/Monat)`,
            `Additional need § 21 (2) SGB II (17 % RBS1 = ${fmtEur(95.71)}/month)`,
          )}</small>
        </label>
      </fieldset>
    </details>
  `;
}

function renderArbeitHtml(): string {
  return `
    <fieldset class="panel-arbeit">
      <legend class="sr-only">${T("Einkommen", "Income")}</legend>
      <div class="arbeit-split">
        <div class="arbeit-slider-col">
          <label class="slider-label">
            ${T("Bruttolohn", "Gross salary")}: <output name="bruttoOut">${fmtEur(BRUTTO_DEFAULT)}</output> / ${T(
              "Jahr",
              "year",
            )}
            <input type="range" name="bruttoJahr"
              min="${BRUTTO_MIN}" max="${BRUTTO_MAX}" step="${BRUTTO_STEP}"
              value="${BRUTTO_DEFAULT}" />
            <small class="hint">
              ${T("Slider", "Slider")} ${fmtEur(BRUTTO_MIN)} - ${fmtEur(BRUTTO_MAX)} ${T(
                `in ${fmtEur(BRUTTO_STEP)}-Schritten`,
                `in ${fmtEur(BRUTTO_STEP)} steps`,
              )} ·
              ${T(
                "GKV/PV bis BBG 5.812,50 €/Mt, RV/AV bis BBG 8.450 €/Mt",
                "Health/LTC up to ceiling 5,812.50 €/mo, pension/UE up to ceiling 8,450 €/mo",
              )}
            </small>
          </label>
        </div>
        <div class="arbeit-ag-col">
          <div class="arbeit-ag-hero">
            <div class="arbeit-ag-hero-label">${T(
              "Arbeitgebergesamtkosten",
              "Total employer cost",
            )}</div>
            <div class="arbeit-ag-hero-value" data-gesamt-big>${fmtEur(BRUTTO_DEFAULT)}</div>
            <div class="arbeit-ag-hero-sub">${T(
              "pro Jahr einschließlich AG-Anteil zur Sozialversicherung",
              "per year including employer social-insurance share",
            )}</div>
          </div>
          <div class="arbeit-ag-breakdown">
            <div class="arbeit-ag-row">
              <span>${T("AN-Brutto", "Employee gross")}</span>
              <span data-brutto-echo>${fmtEur(BRUTTO_DEFAULT)}</span>
            </div>
            <div class="arbeit-ag-row">
              <span>${T(
                "+ AG-Anteil Sozialversicherung",
                "+ Employer social-insurance share",
              )}</span>
              <span data-ag-anteil>${fmtEur(0)}</span>
            </div>
            <div class="arbeit-ag-row arbeit-ag-sum">
              <span>${T(
                "= Arbeitgebergesamtkosten",
                "= Total employer cost",
              )}</span>
              <span data-gesamt-small>${fmtEur(BRUTTO_DEFAULT)}</span>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  `;
}

function renderBgHtml(): string {
  return `
    <fieldset class="panel-bg">
      <legend class="sr-only">${T(
        "Nebeneinkünfte & Antragsleistungen",
        "Side income & on-request benefits",
      )}</legend>
      <div class="schwarz-row">
        <label class="slider-label schwarz-slider">
          ${T(
            "Nicht gemeldete Nebeneinkünfte (illegal)",
            "Undeclared side income (illegal)",
          )}: <output name="schwarzOut">${fmtEur(SCHWARZ_DEFAULT)}</output> / ${T(
            "Monat",
            "month",
          )}
          <input type="range" name="schwarzarbeitMonat"
            min="0" max="${SCHWARZ_MAX}" step="${SCHWARZ_STEP}" value="${SCHWARZ_DEFAULT}" />
        </label>
        <p class="panel-hint schwarz-hint">
          ${T(
            "Im Modell als ungeschmälerter Zufluss ohne Steuer- oder SV-Abzug und ohne §&nbsp;11-Anrechnung behandelt. Das bildet nur das illegale, nicht entdeckte Szenario ab; Strafbarkeit, Rückforderungen und Sanktionen sind nicht eingepreist.",
            "Modelled as an unreduced inflow without tax or social-insurance deductions and without §&nbsp;11 offset. Represents only the illegal, undetected scenario; criminal liability, clawbacks and sanctions are not priced in.",
          )}
        </p>
      </div>
      ${renderAntragsHtml()}
    </fieldset>
  `;
}

function renderAntragsHtml(): string {
  const presetButtons = ANTRAGS_PRESET_ORDER.map((id) => {
    const p = ANTRAGS_PRESETS[id];
    return `
      <label class="btn-preset">
        <input type="radio" name="antragsPreset" value="${p.id}"
          ${p.id === ANTRAGS_PRESET_DEFAULT ? "checked" : ""} />
        <span class="btn-preset-title">${p.titel}</span>
        <span class="btn-preset-sub">${p.untertitel}</span>
        <span class="btn-preset-badge data-${p.datenlage}">${T(
          "Datenlage",
          "Data quality",
        )}: ${datenlageLabel(p.datenlage)}</span>
      </label>
    `;
  }).join("");

  return `
    <div class="antrags-inline">
      <span class="antrags-inline-label">${T(
        "Antragsleistungen",
        "On-request benefits",
      )}</span>
      <button type="button" class="antrags-btn" data-open-antrags
        aria-haspopup="dialog" aria-controls="antragsDialog">
        <span data-antrags-preset-name>-</span>
        <span class="antrags-btn-chev" aria-hidden="true">▸</span>
      </button>
      <span class="antrags-inline-sum">
        <strong data-antrags-summe>-</strong>
        <span class="muted">/ ${T("Monat", "month")}</span>
      </span>
    </div>
    <dialog id="antragsDialog" class="antrags-dialog" aria-labelledby="antragsDialogTitle">
      <div class="antrags-dialog-inner">
        <button type="button" class="antrags-dialog-close" aria-label="${T(
          "Schließen",
          "Close",
        )}" data-close-antrags>×</button>
        <h2 id="antragsDialogTitle">${T(
          "Antragsleistungen: Szenario wählen",
          "On-request benefits: pick a scenario",
        )}</h2>
        <p class="antrags-panel-hint">
          ${T(
            "Viele Bürgergeld-Leistungen werden nur auf Antrag gezahlt (Erstausstattung, Lernförderung, Telefon-Sozialtarif …). Wähle ein Szenario, wie vollständig der Haushalt diese Leistungen tatsächlich ausschöpft.",
            "Many Bürgergeld benefits are paid only on application (initial household equipment, tutoring, phone welfare rate, ...). Pick a scenario for how fully the household actually claims these.",
          )}
        </p>
        <div class="btn-group-preset" role="radiogroup" aria-label="${T(
          "Antragsleistungen-Szenario",
          "On-request benefits scenario",
        )}">
          ${presetButtons}
        </div>
        <div class="antrags-panel-detail" data-antrags-detail></div>
        <div class="antrags-dialog-footer">
          <button type="button" class="btn-cta" data-close-antrags>${T(
            "Fertig",
            "Done",
          )}</button>
        </div>
      </div>
    </dialog>
  `;
}

function basisLabel(
  basis: "haushalt" | "erwachsener" | "kind" | "schulkind" | "kindU3" | "person",
): string {
  switch (basis) {
    case "haushalt":
      return T("Haushalt", "household");
    case "erwachsener":
      return T("Erw.", "adult");
    case "kind":
      return T("Kind", "child");
    case "schulkind":
      return T("Schulkind", "school child");
    case "kindU3":
      return T("Kind < 3", "child < 3");
    case "person":
      return T("Person", "person");
  }
}

function datenlageLabel(d: "gut" | "mittel" | "schwach"): string {
  switch (d) {
    case "gut":
      return T("gut belegt", "well supported");
    case "mittel":
      return T("teilw. belegt", "partly supported");
    case "schwach":
      return T("Schätzung", "estimate");
  }
}
