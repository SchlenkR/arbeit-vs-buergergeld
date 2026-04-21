import type { Anspruchsuebersicht, AnspruchsKategorie, AnspruchPosten } from "../core/ansprueche";
import { T, fmtEur } from "../i18n";

export function renderAnsprueche(
  container: HTMLElement,
  uebersicht: Anspruchsuebersicht,
): void {
  const gesamtMonat = uebersicht.kategorien
    .filter((k) => k.ton !== "minus" && k.summeMonat !== null)
    .reduce((s, k) => s + (k.summeMonat ?? 0), 0);

  const personenLabel = T(
    `${uebersicht.personen} Person${uebersicht.personen === 1 ? "" : "en"}`,
    `${uebersicht.personen} person${uebersicht.personen === 1 ? "" : "s"}`,
  );
  const kinderAnz = uebersicht.haushalt.kinder.length;
  const kinderLabel = T(
    `${kinderAnz} Kind${kinderAnz === 1 ? "" : "er"}`,
    `${kinderAnz} child${kinderAnz === 1 ? "" : "ren"}`,
  );
  const erwLabel = T(
    `${uebersicht.erwachsene} Erw.`,
    `${uebersicht.erwachsene} adult${uebersicht.erwachsene === 1 ? "" : "s"}`,
  );

  container.innerHTML = `
    <section class="ansprueche-section">
      <header class="ansprueche-header">
        <h2>${T(
          "Was steht diesem Haushalt zu?",
          "What is this household entitled to?",
        )}</h2>
        <p class="ansprueche-sub">
          ${T("Bürgergeld-Anspruch für", "Bürgergeld entitlement for")}
          <strong>${personenLabel}</strong>
          (${erwLabel} + ${kinderLabel}) ${T("in Wohnlage", "in residential tier")} ${uebersicht.haushalt.wohnlage}.
          ${T(
            "Zzgl. einmaliger Leistungen und Sachleistungen.",
            "Plus one-off benefits and in-kind benefits.",
          )}
        </p>
        <p class="ansprueche-gesamt">
          ${T("Quantifizierbarer Anspruch", "Quantifiable entitlement")}:
          <strong>${fmtEur(gesamtMonat)}</strong> / ${T("Monat", "month")}
          <span class="muted">(${T(
            "ohne Einmalleistungen §24",
            "excluding one-off benefits § 24",
          )})</span>
        </p>
      </header>
      <div class="ansprueche-grid">
        ${uebersicht.kategorien.map(renderKategorie).join("")}
      </div>
    </section>
  `;
}

function renderKategorie(k: AnspruchsKategorie): string {
  const tonClass = `tone-${k.ton ?? "neutral"}`;
  const summe = k.summeMonat !== null
    ? `<div class="kategorie-summe">${fmtEur(k.summeMonat)} <span class="muted">/ ${T(
        "Monat",
        "month",
      )}</span></div>`
    : `<div class="kategorie-summe kategorie-summe-qual">${T(
        "nach Bedarf",
        "as needed",
      )}</div>`;
  const kennzahlen = k.kennzahlen && k.kennzahlen.length > 0
    ? `<div class="kategorie-kennzahlen">${k.kennzahlen
        .map((kz) => `<span class="kennzahl">${kz}</span>`)
        .join("")}</div>`
    : "";

  return `
    <article class="anspruch-card ${tonClass}">
      <header>
        <h3>${k.titel}</h3>
        <p class="kategorie-sub">${k.untertitel}</p>
      </header>
      ${kennzahlen}
      ${summe}
      <ul class="anspruch-items">
        ${k.items.map(renderItem).join("")}
      </ul>
    </article>
  `;
}

function renderItem(i: AnspruchPosten): string {
  const wert =
    i.wertMonat !== null && i.wertMonat !== undefined
      ? `<span class="anspruch-wert">${fmtEur(i.wertMonat)}/${T("Mo", "mo")}</span>`
      : `<span class="anspruch-wert-qual">${T("auf Antrag", "on request")}</span>`;
  const para = i.paragraf
    ? `<span class="anspruch-paragraf">${i.paragraf}</span>`
    : "";
  const hinweis = i.hinweis ? `<p class="anspruch-hinweis">${i.hinweis}</p>` : "";
  return `
    <li class="anspruch-item">
      <div class="anspruch-item-top">
        <span class="anspruch-label">${i.label}</span>
        ${wert}
      </div>
      ${para}
      ${hinweis}
    </li>
  `;
}
