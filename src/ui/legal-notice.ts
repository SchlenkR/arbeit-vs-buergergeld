import { WOHNLAGEN_2026 } from "../core/constants2026";

interface LegalSource {
  titel: string;
  url?: string;
  hinweis?: string;
}

interface LegalSourceGroup {
  titel: string;
  beschreibung: string;
  quellen: LegalSource[];
}

interface WohnlageSourceEntry {
  key: keyof typeof WOHNLAGEN_2026;
  beschreibung: string;
  quellen: LegalSource[];
}

const INTEGER_FORMAT = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
});

const DECIMAL_FORMAT = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const WOHNLAGE_GRUNDLAGEN: LegalSourceGroup = {
  titel: "Wohnlage A-D: gemeinsame Primärquellen",
  beschreibung:
    "Diese Quellen beschreiben die räumliche Typisierung, die regionalen Wohnungsmarktunterschiede und den bundesweit einheitlichen Heizkostenansatz, auf deren Basis die vier offenen Rechnerklassen A bis D gebildet wurden.",
  quellen: [
    {
      titel: "BBSR: Wachsende und schrumpfende Stadt-Land-Regionen / Wohnungsmarktregionstypen",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/deutschland/regionen/wohnungsmarktregionstypen/StadtLandRegionen_WoMa.html",
      hinweis:
        "Bundesweite Wohnungsmarktregionstypen und methodische Beschreibung der BBSR-Typisierung; die App verdichtet diese öffentliche Struktur zu vier eigenen Klassen.",
    },
    {
      titel: "BBSR: Referenztabellen zu Raumgliederungen des BBSR",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/downloads/download-referenzen.html",
      hinweis:
        "Downloadbereich für die Zuordnung administrativer Gebietseinheiten zu den BBSR-Raumgliederungen.",
    },
    {
      titel: "BBSR: Stadt-Land-Regionen oder Wohnungsmarktregionen 2015 (Karte)",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/deutschland/regionen/StadtLandRegionen/download-karte-pdf.pdf?__blob=publicationFile&v=1",
      hinweis:
        "Kartografische Übersicht der Wohnungsmarktregionen bzw. Stadt-Land-Regionen.",
    },
    {
      titel: "BBSR: Wohn- und Wirtschaftsimmobilien in Deutschland 2025",
      url: "https://www.bbsr.bund.de/BBSR/DE/veroeffentlichungen/sonderveroeffentlichungen/2026/wohn-wirtschaftsimmobilien-deutschland-2025-dl.pdf?__blob=publicationFile&v=3",
      hinweis:
        "Aktueller BBSR-Marktbericht zur regional unterschiedlichen Anspannung der Wohnungsmärkte; dient hier als Orientierungsrahmen für die gestaffelten Nettokaltmiet-Klassen.",
    },
    {
      titel: "Heizspiegel: Heizkosten berechnen",
      url: "https://www.heizspiegel.de/heizkosten-berechnen/",
      hinweis:
        "Bundesweit einheitlicher Referenzrahmen für die Heizkostenannahme im Rechner.",
    },
  ],
};

const WOHNLAGE_QUELLEN: WohnlageSourceEntry[] = [
  {
    key: "A",
    beschreibung:
      "Repräsentativklasse für sehr teure und besonders nachgefragte Ballungsräume.",
    quellen: [
      {
        titel: "Frankfurt am Main: angemessene Bruttokaltmiete in Frankfurt am Main",
        url: "https://frankfurt.de/-/media/frankfurtde/service-und-rathaus/verwaltung/aemter-und-institutionen/jugend-und-sozialamt/pdf/antraege-formulare-merkblaetter/kdu/angemessene-bruttokaltmiete.pdf",
        hinweis:
          "Amtliche Bruttokaltmiet-Tabelle der Stadt Frankfurt am Main, Stand Mietspiegel 2024; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse A.",
      },
      {
        titel: "Jobcenter Frankfurt am Main: Wohnen in Frankfurt",
        url: "https://www.jc-frankfurt.de/geld/wohnen-in-frankfurt",
        hinweis:
          "Amtliche Jobcenter-Seite zu Unterkunftskosten und Angemessenheit im laufenden Bezug.",
      },
    ],
  },
  {
    key: "B",
    beschreibung:
      "Repräsentativklasse für größere Städte mit überdurchschnittlich angespanntem Mietmarkt.",
    quellen: [
      {
        titel: "Berlin.de: Kosten der Unterkunft - AV-Wohnen",
        url: "https://www.berlin.de/sen/soziales/soziale-sicherung/grundsicherung-fuer-arbeitssuchende-hartz-iv/av-wohnen/",
        hinweis:
          "Amtliche Berliner Übersichtsseite zu Bruttokaltmiet-Richtwerten, Heizkosten und Karenzzeit; verweist selbst auf Mietspiegel- und Heizspiegel-Basis.",
      },
      {
        titel: "Berlin Sozialrecht: AV-Wohnen, Anlage 1",
        url: "https://sozialrecht.berlin.de/kategorie/ausfuehrungsvorschriften/av-wohnen-571939-v9-anlage-1.html",
        hinweis:
          "Amtliche Berliner Anlage zur Ermittlung angemessener Unterkunftskosten.",
      },
    ],
  },
  {
    key: "C",
    beschreibung:
      "Repräsentativklasse für Mittelstädte und prosperierende Umlandlagen mit mittlerem Kostenniveau.",
    quellen: [
      {
        titel: "Stadt Leipzig: Richtwerte für die Kosten der Unterkunft",
        url: "https://static.leipzig.de/fileadmin/mediendatenbank/leipzig-de/Stadt/02.5_Dez5_Jugend_Soziales_Gesundheit_Schule/50_Sozialamt/KdU/Richtwerte_KdUH.pdf",
        hinweis:
          "Amtliche Leipziger Richtwert-Tabelle für Bruttokaltmiete und Heizkosten; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse C.",
      },
      {
        titel: "Jobcenter Leipzig: Unterkunft und Heizung",
        url: "https://jobcenter-leipzig.de/geldleistungen/unterkunft-und-heizung/",
        hinweis:
          "Amtliche Jobcenter-Seite mit Erläuterungen zur Zusammensetzung und Prüfung der Unterkunftskosten.",
      },
    ],
  },
  {
    key: "D",
    beschreibung:
      "Repräsentativklasse für ländliche oder strukturschwächere Räume mit niedrigerem Kostenniveau.",
    quellen: [
      {
        titel: "Landkreis Görlitz: Neue Angemessenheitswerte für Kosten der Unterkunft ab 1. Februar 2023",
        url: "https://www.kreis-goerlitz.de/Bekanntmachungen/Neue-Angemessenheitswerte-fuer-Kosten-der-Unterkunft-im-Landkreis-Goerlitz-ab-1-Februar-2023.html?",
        hinweis:
          "Amtliche Bekanntmachung des Landkreises Görlitz zu den angehobenen Unterkunftsrichtwerten; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse D.",
      },
      {
        titel: "Richtwerte zur Bestimmung abstrakt angemessener Kosten der Unterkunft im Landkreis Görlitz",
        url: "https://www.wirtschaft-goerlitz.de/images/pdf/Richtwerte_KdU_ENO_2023.pdf",
        hinweis:
          "Ausformuliertes Richtwertdokument für den Landkreis Görlitz; ergänzende Detailquelle zur amtlichen Bekanntmachung.",
      },
    ],
  },
];

const RECHTSGRUNDLAGEN: LegalSourceGroup[] = [
  {
    titel: "Bürgergeld, Mehrbedarfe und Bildung/Teilhabe",
    beschreibung:
      "Amtliche Rechtsgrundlagen und Veröffentlichungen für Regelbedarfe, Mehrbedarfe und BuT.",
    quellen: [
      {
        titel: "Bundesregierung: Nullrunde Bürgergeld 2026",
        url: "https://www.bundesregierung.de/breg-de/aktuelles/nullrunde-buergergeld-2383676",
      },
      {
        titel: "Publikationen der Bundesregierung: Regelbedarfe zum 01.01.2026",
        url: "https://www.publikationen-bundesregierung.de/pp-de/publikationssuche/regelbedarfe-zum-01-01-2026-2384092",
      },
      {
        titel: "Regelbedarfs-Ermittlungsgesetz (RBEG)",
        url: "https://www.gesetze-im-internet.de/rbeg_2021/",
        hinweis: "Abteilungen des Regelbedarfs / Referenzstruktur der Regelbedarfe.",
      },
      {
        titel: "SGB II § 21 Mehrbedarfe",
        url: "https://www.gesetze-im-internet.de/sgb_2/__21.html",
        hinweis: "Alleinerziehend, Warmwasser, Schwangerschaft und weitere Mehrbedarfe.",
      },
      {
        titel: "BMAS: Leistungen aus dem Bildungspaket",
        url: "https://www.bmas.de/DE/Arbeit/Grundsicherung-Buergergeld/Bildungspaket/Leistungen/leistungen-bildungspaket_art.html",
      },
      {
        titel: "SGB V § 251",
        url: "https://www.gesetze-im-internet.de/sgb_5/__251.html",
        hinweis: "Beiträge zur Krankenversicherung bei Bürgergeld-Bezug.",
      },
      {
        titel: "SGB VI § 58",
        url: "https://www.gesetze-im-internet.de/sgb_6/__58.html",
        hinweis: "Anrechnungszeiten statt RV-Beitragszahlung beim Bürgergeld-Bezug.",
      },
    ],
  },
  {
    titel: "Steuern, Kindergeld und Sozialversicherung",
    beschreibung:
      "Rechtsgrundlagen für den Einkommensteuer-, Soli- und SV-Teil des Rechners.",
    quellen: [
      {
        titel: "EStG § 32a Einkommensteuertarif",
        url: "https://www.gesetze-im-internet.de/estg/__32a.html",
      },
      {
        titel: "BMF: Das ändert sich 2026",
        url: "https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2026.html",
      },
      {
        titel: "EStG § 31 Familienleistungsausgleich",
        url: "https://www.gesetze-im-internet.de/estg/__31.html",
        hinweis: "Günstigerprüfung Kindergeld vs. Kinderfreibetrag.",
      },
      {
        titel: "EStG § 32 Kinder, Freibeträge für Kinder",
        url: "https://www.gesetze-im-internet.de/estg/__32.html",
        hinweis: "Kinderfreibetrag, BEA-Freibetrag, hälftige Zuordnung und Übertragung.",
      },
      {
        titel: "EStG § 10 Sonderausgaben",
        url: "https://www.gesetze-im-internet.de/estg/__10.html",
        hinweis: "Vorsorgeaufwendungen, Basis-KV/PV, Rentenversicherung, sonstige Vorsorge.",
      },
      {
        titel: "EStG § 10c Sonderausgaben-Pauschbetrag",
        url: "https://www.gesetze-im-internet.de/estg/__10c.html",
      },
      {
        titel: "EStG § 9a Arbeitnehmer-Pauschbetrag",
        url: "https://www.gesetze-im-internet.de/estg/__9a.html",
      },
      {
        titel: "EStG § 66 Höhe des Kindergeldes",
        url: "https://www.gesetze-im-internet.de/estg/__66.html",
      },
      {
        titel: "SolzG 1995 § 3",
        url: "https://www.gesetze-im-internet.de/solzg_1995/__3.html",
        hinweis: "Bemessungsgrundlage und Freigrenzen des Solidaritätszuschlags.",
      },
      {
        titel: "GKV-Spitzenverband: Rechengrößen der Sozialversicherung 2026",
        url: "https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf",
      },
    ],
  },
  {
    titel: "Wohnen, Rundfunk, KiZ und ergänzende Orientierung",
    beschreibung:
      "Quellen für Wohnen, Rundfunkbeitrag und ergänzende Plausibilisierung einzelner Annahmen.",
    quellen: [
      {
        titel: "Heizspiegel: Heizkosten berechnen",
        url: "https://www.heizspiegel.de/heizkosten-berechnen/",
      },
      {
        titel: "WoGG Anlage 1 Höchstbeträge",
        url: "https://www.gesetze-im-internet.de/wogg/anlage_1.html",
        hinweis: "Im Rechner derzeit nur als Obergrenzen-Referenz, Wohngeld selbst bleibt Platzhalter 0 €.",
      },
      {
        titel: "BKGG § 6a Kinderzuschlag",
        url: "https://www.gesetze-im-internet.de/bkgg_1996/__6a.html",
        hinweis: "Im Rechner derzeit nur als Rechtsgrundlage, KiZ selbst bleibt Platzhalter 0 €.",
      },
      {
        titel: "Rundfunkbeitrag: Informationen für Bürgerinnen und Bürger",
        url: "https://www.rundfunkbeitrag.de/buergerinnen_und_buerger/informationen/index_ger.html",
        hinweis: "18,36 € pro Wohnung und Befreiungs-/Ermäßigungszugänge.",
      },
      {
        titel: "Rundfunkbeitrag: Befreiung oder Ermäßigung beantragen",
        url: "https://www.rundfunkbeitrag.de/buergerinnen_und_buerger/formulare/befreiung-oder-ermaessigung-beantragen",
      },
      {
        titel: "Sekundärquelle: Warmwasser-Mehrbedarf",
        url: "https://www.buergergeld.org/sgb-ii/mehrbedarf-warmwasser/",
        hinweis: "Nur zur Plausibilisierung; maßgeblich ist SGB II § 21.",
      },
      {
        titel: "Sekundärquelle: Bildungspaket Überblick",
        url: "https://www.buergergeld.org/bildungspaket/",
        hinweis: "Nur ergänzend; maßgeblich sind BMAS und Gesetz.",
      },
      {
        titel: "Sekundärquelle: Solidaritätszuschlag Überblick",
        url: "https://www.tk.de/firmenkunden/service/fachthemen/fachthema-beitraege/solidaritaetszuschlag-2075802",
        hinweis: "Nur ergänzend; maßgeblich ist SolzG § 3.",
      },
      {
        titel: "Sekundärquelle: Kindergeld/Kinderfreibetrag 2026",
        url: "https://www.familienkasse-info.de/news/kindergeld-und-elterngeld/mehr-geld-fuer-familien-2026-kindergeld-und-kinderfreibetrag-steigen-erneut-1615/",
        hinweis: "Nur ergänzend; maßgeblich sind §§ 31, 32, 66 EStG.",
      },
    ],
  },
  {
    titel: "Website-Recht und Haftungsgrenzen",
    beschreibung:
      "Rechtsgrundlagen für den eingeblendeten Disclaimer und den Betrieb einer öffentlichen Website.",
    quellen: [
      {
        titel: "BGB § 309",
        url: "https://www.gesetze-im-internet.de/bgb/__309.html",
        hinweis: "Grenzen pauschaler Haftungsausschlüsse, insbesondere bei Vorsatz, grober Fahrlässigkeit sowie Leben, Körper, Gesundheit.",
      },
      {
        titel: "DDG § 5 Allgemeine Informationspflichten",
        url: "https://www.gesetze-im-internet.de/ddg/__5.html",
        hinweis: "Impressumspflichten für öffentliche, nicht rein private Websites.",
      },
    ],
  },
];

export function renderLegalNotice(container: HTMLElement): void {
  container.innerHTML = `
    <section class="legal-block">
      <h2>Rechtlicher Hinweis</h2>
      <p>
        Diese Anwendung stellt eine unverbindliche, allgemein gehaltene Modellrechnung nach bestem Wissen und Gewissen bereit.
        Sie ersetzt keine individuelle Steuerberatung, Sozialberatung oder Rechtsberatung und begründet kein Mandats- oder Beratungsverhältnis.
      </p>
      <ul class="legal-list">
        <li>Maßgeblich sind immer die gesetzlichen Vorschriften, Verwaltungsvorgaben, lokalen Richtlinien, Bescheide und die tatsächlichen Umstände des Einzelfalls.</li>
        <li>Für Richtigkeit, Vollständigkeit, Aktualität, wirtschaftliche Verwertbarkeit und Eignung für einen bestimmten Zweck wird keine Gewähr übernommen.</li>
        <li>Soweit gesetzlich zulässig, ist die Haftung für Vermögensschäden aus der Nutzung der Anwendung ausgeschlossen; unberührt bleibt die Haftung bei Vorsatz, grober Fahrlässigkeit, nach dem Produkthaftungsgesetz sowie bei Verletzung von Leben, Körper oder Gesundheit.</li>
        <li>Vor rechtlich oder wirtschaftlich relevanten Entscheidungen sollte eine Prüfung durch Jobcenter, Familienkasse, Steuerberater, Lohnsteuerhilfeverein oder Rechtsanwalt erfolgen.</li>
      </ul>
      <p class="legal-small">
        Für eine öffentliche, nicht rein private Website sind zusätzlich ein Impressum nach DDG § 5 und regelmäßig Datenschutzhinweise erforderlich. Diese Pflichten werden durch den obigen Disclaimer nicht ersetzt.
      </p>
    </section>

    <section class="legal-block">
      <h2>Modellgrenzen</h2>
      <ul class="legal-list">
        <li>Wohngeld (§ 19 WoGG) und Kinderzuschlag (§ 6a BKGG) sind weiterhin Platzhalter mit 0 € und können das Ergebnis für arbeitende Haushalte spürbar verändern.</li>
        <li>Antragsleistungen werden über Presets pauschaliert; Standard ist das konservative Preset <strong>Gesichert</strong>.</li>
        <li>Wohnlage A bis D ist ein eigener, offen gelegter Modellansatz mit Repräsentativwerten; die exakten Zahlen und exemplarischen Primärquellen stehen im Wohnlage-A-D-Quellenanhang unten. Lokale Miete und lokale KdU-Richtlinie haben immer Vorrang.</li>
        <li>Nicht gemeldete Nebeneinkünfte bilden nur das illegale, nicht entdeckte Szenario ab; Strafbarkeit, Rückforderungen und Sanktionen sind nicht eingepreist.</li>
      </ul>
    </section>

    ${renderWohnlageAppendix()}

    <section class="legal-block">
      <h2>Rechtsgrundlagen &amp; Quellen</h2>
      <p>
        Nachfolgend sind die im Rechner verwendeten Rechtsgrundlagen, amtlichen Veröffentlichungen und ergänzenden Sekundärquellen mit vollständiger URL aufgeführt. Die gesonderten Wohnlage-A-D-Annahmen stehen bereits im vorstehenden Quellenanhang.
      </p>
      <div class="source-groups">
        ${RECHTSGRUNDLAGEN.map(renderGroup).join("")}
      </div>
    </section>

    <section class="legal-footer">
      <a
        class="legal-footer-link"
        href="https://github.com/SchlenkR/arbeit-vs-buergergeld"
        target="_blank"
        rel="noopener noreferrer"
      >Quellcode auf GitHub</a>
    </section>
  `;
}

function renderWohnlageAppendix(): string {
  return `
    <section class="legal-block">
      <h2>Wohnlage A-D: Methodik &amp; Quellenanhang</h2>
      <p>
        Die Klassen A bis D sind keine amtlichen Rechtskategorien, sondern ein offener Modellansatz dieses Rechners. Um die Verdichtung transparent zu machen, werden hier sowohl die exakt verwendeten Repräsentativwerte als auch die herangezogenen Struktur- und Beispielquellen veröffentlicht.
      </p>
      <ul class="legal-list">
        <li>Die räumliche Struktur orientiert sich an den Wohnungsmarktregionen bzw. Stadt-Land-Regionen des BBSR.</li>
        <li>Die KdU-Seite nutzt je Klasse öffentlich veröffentlichte lokale Richtwertbeispiele als Anker; rechtsverbindlich bleibt immer die konkret zuständige kommunale Richtlinie nach § 22 SGB II.</li>
        <li>Die Arbeitsseite nutzt offengelegte Repräsentativwerte für Nettokaltmiete und kalte Nebenkosten. Diese Werte sind editoriale Modellwerte zur Klassenbildung, keine amtlichen Mietspiegelwerte.</li>
        <li>Heizkosten werden in allen Klassen einheitlich mit dem bundesweiten Heizspiegel-Ansatz modelliert.</li>
      </ul>
      <div class="source-groups">
        ${renderGroup(WOHNLAGE_GRUNDLAGEN)}
        ${WOHNLAGE_QUELLEN.map(renderWohnlageEntry).join("")}
      </div>
    </section>
  `;
}

function renderGroup(group: LegalSourceGroup): string {
  return `
    <section class="source-group">
      <h3>${group.titel}</h3>
      <p class="source-group-intro">${group.beschreibung}</p>
      <ul class="source-list">
        ${group.quellen.map(renderSource).join("")}
      </ul>
    </section>
  `;
}

function renderWohnlageEntry(entry: WohnlageSourceEntry): string {
  const wohnlage = WOHNLAGEN_2026[entry.key];

  return `
    <section class="source-group">
      <h3>${wohnlage.label}</h3>
      <p class="source-group-intro">${entry.beschreibung} Beispiele im Rechner: ${wohnlage.beispiele}.</p>
      <div class="wohnlage-metrics">
        ${renderMetric(
          "KdU-Bruttokaltmiete",
          formatHouseholdValues(
            wohnlage.bruttokaltmieteEurMonat,
            wohnlage.aufschlagJeWeiterePersonEur,
            "€",
          ),
        )}
        ${renderMetric("Nettokaltmiete", `${formatDecimal(wohnlage.nettokaltEurProQmMonat)} €/m²`)}
        ${renderMetric("Kalte Nebenkosten", `${formatDecimal(wohnlage.nebenkostenEurProQmMonat)} €/m²`)}
        ${renderMetric(
          "Wohnfläche",
          formatHouseholdValues(wohnlage.wohnflaecheQm, wohnlage.aufschlagJeWeiterePersonQm, "m²"),
        )}
        ${renderMetric("Heizkosten", `${formatDecimal(wohnlage.heizkostenEurProQmMonat)} €/m²`)}
      </div>
      <ul class="source-list">
        <li class="source-item">
          <div class="source-link source-link-static">Offenlegung der Modellverdichtung</div>
          <div class="source-note">Die obigen Werte sind die exakt im Rechner verwendeten Repräsentativwerte für diese Klasse. Sie dienen nur der bundesweiten Vergleichbarkeit und ersetzen keine lokale Miet-, Wohngeld- oder KdU-Prüfung.</div>
        </li>
        ${entry.quellen.map(renderSource).join("")}
      </ul>
    </section>
  `;
}

function renderSource(source: LegalSource): string {
  const urlBlock = source.url
    ? `
      <a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.titel}</a>
      <div class="source-url">${source.url}</div>
    `
    : `
      <div class="source-link source-link-static">${source.titel}</div>
    `;

  return `
    <li class="source-item">
      ${urlBlock}
      ${source.hinweis ? `<div class="source-note">${source.hinweis}</div>` : ""}
    </li>
  `;
}

function renderMetric(label: string, value: string): string {
  return `
    <div class="wohnlage-metric">
      <span class="wohnlage-metric-label">${label}</span>
      <span class="wohnlage-metric-value">${value}</span>
    </div>
  `;
}

function formatHouseholdValues(
  values: readonly number[],
  additionalValue: number,
  unit: string,
): string {
  const basis = values
    .map((value, index) => `${index + 1} P ${formatInteger(value)} ${unit}`)
    .join(" · ");

  return `${basis} · je weitere Person +${formatInteger(additionalValue)} ${unit}`;
}

function formatInteger(value: number): string {
  return INTEGER_FORMAT.format(value);
}

function formatDecimal(value: number): string {
  return DECIMAL_FORMAT.format(value);
}