import type { Anspruchsuebersicht, AnspruchsKategorie, AnspruchPosten } from "../core/ansprueche";

export function renderAnsprueche(
  container: HTMLElement,
  uebersicht: Anspruchsuebersicht,
): void {
  const gesamtMonat = uebersicht.kategorien
    .filter((k) => k.ton !== "minus" && k.summeMonat !== null)
    .reduce((s, k) => s + (k.summeMonat ?? 0), 0);

  container.innerHTML = `
    <section class="ansprueche-section">
      <header class="ansprueche-header">
        <h2>Was steht diesem Haushalt zu?</h2>
        <p class="ansprueche-sub">
          Bürgergeld-Anspruch für
          <strong>${uebersicht.personen} Person${uebersicht.personen === 1 ? "" : "en"}</strong>
          (${uebersicht.erwachsene} Erw. + ${uebersicht.haushalt.kinder.length} Kind${
            uebersicht.haushalt.kinder.length === 1 ? "" : "er"
          }) in Wohnlage ${uebersicht.haushalt.wohnlage}.
          Zzgl. einmaliger Leistungen und Sachleistungen.
        </p>
        <p class="ansprueche-gesamt">
          Quantifizierbarer Anspruch:
          <strong>${fmt(gesamtMonat)}</strong> / Monat
          <span class="muted">(ohne Einmalleistungen §24)</span>
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
    ? `<div class="kategorie-summe">${fmt(k.summeMonat)} <span class="muted">/ Monat</span></div>`
    : `<div class="kategorie-summe kategorie-summe-qual">nach Bedarf</div>`;
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
      ? `<span class="anspruch-wert">${fmt(i.wertMonat)}/Mo</span>`
      : `<span class="anspruch-wert-qual">auf Antrag</span>`;
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

function fmt(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}
