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

export interface FormContainers {
  settings: HTMLElement;
  arbeit: HTMLElement;
  bg: HTMLElement;
}

export interface FormCallbacks {
  onChange: (szenario: Szenario, antragsItems: AntragsAnspruchItem[]) => void;
}

const HAUSHALTSTYPEN: { value: HaushaltsTyp; main: string; sub: string }[] = [
  { value: "single", main: "Single", sub: "1 Erw." },
  { value: "alleinerziehend", main: "Alleinerz.", sub: "1 Erw. + Kind(er)" },
  { value: "paar", main: "Paar", sub: "unverh." },
  { value: "paar_verheiratet", main: "Paar", sub: "verheiratet" },
];

const WOHNLAGEN_OPTIONS: { value: Wohnlage; main: string; sub: string }[] = [
  { value: "A", main: "A", sub: "Top-Ballung" },
  { value: "B", main: "B", sub: "Großstadt" },
  { value: "C", main: "C", sub: "Mittelstadt" },
  { value: "D", main: "D", sub: "Ländlich" },
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
        <label class="kind-label">Alter Kind ${i + 1}
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
      <div class="computed-field-title">Warmmiete (berechnet)</div>
      <div class="computed-field-value">${fmtEur(warmmiete)} <span class="muted">/ Monat</span></div>
      <div class="computed-field-formel">
        ${personen} Pers. · ${Math.round(qm)} m² × ${qmPreis.toFixed(2)} €/m² (warm)
      </div>
      <div class="computed-field-check">
        KdU-Grenze (§ 22 SGB II): ${fmtEur(angemessen)} ${
          warmmiete <= angemessen
            ? '<span class="ok">✓ angemessen</span>'
            : '<span class="warn">⚠ über Grenze — BG deckelt</span>'
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
    if (nameEl) nameEl.textContent = `Szenario: ${preset.titel}`;
    const detailEl = form.querySelector<HTMLElement>("[data-antrags-detail]");
    if (!detailEl) return;
    if (preset.items.length === 0) {
      detailEl.innerHTML = `
        <p class="antrags-beschreibung">${preset.beschreibung}</p>
        <p class="antrags-empty">Keine Antragsleistungen modelliert.</p>
      `;
      return;
    }
    const rows = preset.items
      .map(
        (it) => `
        <li class="antrags-item">
          <div class="antrags-item-head">
            <span class="antrags-item-label">${it.label}</span>
            <span class="antrags-item-amount">${fmtEurCt(it.eurMonat)} / ${basisLabel(it.basis)}</span>
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
      <legend>Haushalt</legend>
      <div class="btn-group" role="radiogroup" aria-label="Haushaltstyp">
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
        Anzahl Kinder: <output name="anzahlKinderOut">${KINDER_DEFAULT}</output>
        <input type="range" name="anzahlKinder"
          min="0" max="${KINDER_MAX}" step="1" value="${KINDER_DEFAULT}" />
      </label>
      <div id="kinderAlter" class="kinder-alter"></div>
    </fieldset>

    <fieldset>
      <legend>Wohnlage</legend>
      <div class="btn-group" role="radiogroup" aria-label="Wohnlage">
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
      <summary>Detail-Annahmen (marginal, meist unverändert)</summary>
      <fieldset>
        <legend>ÖPNV</legend>
        <label class="slider-label">
          Deutschlandticket-Nutzer (Personen): <output name="oepnvOut">${OEPNV_NUTZER_DEFAULT}</output>
          <input type="range" name="oepnvNutzer" min="0" max="${OEPNV_NUTZER_MAX}" step="1" value="${OEPNV_NUTZER_DEFAULT}" />
          <small class="hint">
            regulär ${fmtEur(58)}/Monat · mit Sozialpass ${fmtEur(31.5)}/Monat
          </small>
        </label>
      </fieldset>
      <fieldset>
        <legend>Sonderfälle</legend>
        <label>
          <input type="checkbox" name="warmwasserDezentral" ${WARMWASSER_DEZENTRAL_DEFAULT ? "checked" : ""} />
          Warmwasser dezentral (Boiler/Durchlauferhitzer)
          <small class="hint">→ Mehrbedarf § 21 Abs. 7 SGB II, ~13 €/Monat/Erw.</small>
        </label>
        <label>
          <input type="checkbox" name="schwangerschaftAb13SSW" ${SCHWANGERSCHAFT_AB_13_SSW_DEFAULT ? "checked" : ""} />
          Schwangerschaft ab 13. SSW
          <small class="hint">→ Mehrbedarf § 21 Abs. 2 SGB II (17 % RBS1 = ${fmtEur(95.71)}/Monat)</small>
        </label>
      </fieldset>
    </details>
  `;
}

function renderArbeitHtml(): string {
  return `
    <fieldset class="panel-arbeit">
      <legend class="sr-only">Einkommen</legend>
      <div class="arbeit-split">
        <div class="arbeit-slider-col">
          <label class="slider-label">
            Bruttolohn: <output name="bruttoOut">${fmtEur(BRUTTO_DEFAULT)}</output> / Jahr
            <input type="range" name="bruttoJahr"
              min="${BRUTTO_MIN}" max="${BRUTTO_MAX}" step="${BRUTTO_STEP}"
              value="${BRUTTO_DEFAULT}" />
            <small class="hint">
              Slider ${fmtEur(BRUTTO_MIN)}–${fmtEur(BRUTTO_MAX)} in ${fmtEur(BRUTTO_STEP)}-Schritten ·
              GKV/PV bis BBG 5.812,50 €/Mt, RV/AV bis BBG 8.450 €/Mt
            </small>
          </label>
        </div>
        <div class="arbeit-ag-col">
          <div class="arbeit-ag-hero">
            <div class="arbeit-ag-hero-label">Arbeitgebergesamtkosten</div>
            <div class="arbeit-ag-hero-value" data-gesamt-big>${fmtEur(BRUTTO_DEFAULT)}</div>
            <div class="arbeit-ag-hero-sub">pro Jahr einschließlich AG-Anteil zur Sozialversicherung</div>
          </div>
          <div class="arbeit-ag-breakdown">
            <div class="arbeit-ag-row">
              <span>AN-Brutto</span>
              <span data-brutto-echo>${fmtEur(BRUTTO_DEFAULT)}</span>
            </div>
            <div class="arbeit-ag-row">
              <span>+ AG-Anteil Sozialversicherung</span>
              <span data-ag-anteil>${fmtEur(0)}</span>
            </div>
            <div class="arbeit-ag-row arbeit-ag-sum">
              <span>= Arbeitgebergesamtkosten</span>
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
      <legend class="sr-only">Nebeneinkünfte &amp; Antragsleistungen</legend>
      <div class="schwarz-row">
        <label class="slider-label schwarz-slider">
          Nicht gemeldete Nebeneinkünfte (illegal): <output name="schwarzOut">${fmtEur(SCHWARZ_DEFAULT)}</output> / Monat
          <input type="range" name="schwarzarbeitMonat"
            min="0" max="${SCHWARZ_MAX}" step="${SCHWARZ_STEP}" value="${SCHWARZ_DEFAULT}" />
        </label>
        <p class="panel-hint schwarz-hint">
          Im Modell als ungeschmälerter Zufluss ohne Steuer- oder SV-Abzug und ohne
          §&nbsp;11-Anrechnung behandelt. Das bildet nur das illegale, nicht entdeckte
          Szenario ab; Strafbarkeit, Rückforderungen und Sanktionen sind nicht eingepreist.
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
        <span class="btn-preset-badge data-${p.datenlage}">Datenlage: ${datenlageLabel(p.datenlage)}</span>
      </label>
    `;
  }).join("");

  return `
    <div class="antrags-inline">
      <span class="antrags-inline-label">Antragsleistungen</span>
      <button type="button" class="antrags-btn" data-open-antrags
        aria-haspopup="dialog" aria-controls="antragsDialog">
        <span data-antrags-preset-name>—</span>
        <span class="antrags-btn-chev" aria-hidden="true">▸</span>
      </button>
      <span class="antrags-inline-sum">
        <strong data-antrags-summe>—</strong>
        <span class="muted">/ Monat</span>
      </span>
    </div>
    <dialog id="antragsDialog" class="antrags-dialog" aria-labelledby="antragsDialogTitle">
      <div class="antrags-dialog-inner">
        <button type="button" class="antrags-dialog-close" aria-label="Schließen" data-close-antrags>×</button>
        <h2 id="antragsDialogTitle">Antragsleistungen — Szenario wählen</h2>
        <p class="antrags-panel-hint">
          Viele Bürgergeld-Leistungen werden nur auf Antrag gezahlt (Erstausstattung,
          Lernförderung, Telefon-Sozialtarif …). Wähle ein Szenario, wie vollständig
          der Haushalt diese Leistungen tatsächlich ausschöpft.
        </p>
        <div class="btn-group-preset" role="radiogroup" aria-label="Antragsleistungen-Szenario">
          ${presetButtons}
        </div>
        <div class="antrags-panel-detail" data-antrags-detail></div>
        <div class="antrags-dialog-footer">
          <button type="button" class="btn-cta" data-close-antrags>Fertig</button>
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
      return "Haushalt";
    case "erwachsener":
      return "Erw.";
    case "kind":
      return "Kind";
    case "schulkind":
      return "Schulkind";
    case "kindU3":
      return "Kind < 3";
    case "person":
      return "Person";
  }
}

function datenlageLabel(d: "gut" | "mittel" | "schwach"): string {
  switch (d) {
    case "gut":
      return "gut belegt";
    case "mittel":
      return "teilw. belegt";
    case "schwach":
      return "Schätzung";
  }
}

function fmtEurCt(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}
