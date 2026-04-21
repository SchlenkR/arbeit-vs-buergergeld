import { WOHNLAGEN_2026 } from "../core/constants2026";
import { T, locale } from "../i18n";

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

const INTEGER_FORMAT = new Intl.NumberFormat(locale, {
  maximumFractionDigits: 0,
});

const DECIMAL_FORMAT = new Intl.NumberFormat(locale, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const WOHNLAGE_GRUNDLAGEN: LegalSourceGroup = {
  titel: T(
    "Wohnlage A-D: gemeinsame Primärquellen",
    "Residential tier A-D: shared primary sources",
  ),
  beschreibung: T(
    "Diese Quellen beschreiben die räumliche Typisierung, die regionalen Wohnungsmarktunterschiede und den bundesweit einheitlichen Heizkostenansatz, auf deren Basis die vier offenen Rechnerklassen A bis D gebildet wurden.",
    "These sources describe the spatial typology, regional housing-market differences and the nationally uniform heating-cost basis underlying the four open calculator classes A to D.",
  ),
  quellen: [
    {
      titel: "BBSR: Wachsende und schrumpfende Stadt-Land-Regionen / Wohnungsmarktregionstypen",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/deutschland/regionen/wohnungsmarktregionstypen/StadtLandRegionen_WoMa.html",
      hinweis: T(
        "Bundesweite Wohnungsmarktregionstypen und methodische Beschreibung der BBSR-Typisierung; die App verdichtet diese öffentliche Struktur zu vier eigenen Klassen.",
        "Nationwide housing-market region types and methodological description of the BBSR typology; the app condenses this public structure into four own classes.",
      ),
    },
    {
      titel: "BBSR: Referenztabellen zu Raumgliederungen des BBSR",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/downloads/download-referenzen.html",
      hinweis: T(
        "Downloadbereich für die Zuordnung administrativer Gebietseinheiten zu den BBSR-Raumgliederungen.",
        "Download area for the mapping of administrative units to the BBSR spatial classifications.",
      ),
    },
    {
      titel: "BBSR: Stadt-Land-Regionen oder Wohnungsmarktregionen 2015 (Karte)",
      url: "https://www.bbsr.bund.de/BBSR/DE/forschung/raumbeobachtung/Raumabgrenzungen/deutschland/regionen/StadtLandRegionen/download-karte-pdf.pdf?__blob=publicationFile&v=1",
      hinweis: T(
        "Kartografische Übersicht der Wohnungsmarktregionen bzw. Stadt-Land-Regionen.",
        "Cartographic overview of the housing-market regions / urban-rural regions.",
      ),
    },
    {
      titel: "BBSR: Wohn- und Wirtschaftsimmobilien in Deutschland 2025",
      url: "https://www.bbsr.bund.de/BBSR/DE/veroeffentlichungen/sonderveroeffentlichungen/2026/wohn-wirtschaftsimmobilien-deutschland-2025-dl.pdf?__blob=publicationFile&v=3",
      hinweis: T(
        "Aktueller BBSR-Marktbericht zur regional unterschiedlichen Anspannung der Wohnungsmärkte; dient hier als Orientierungsrahmen für die gestaffelten Nettokaltmiet-Klassen.",
        "Current BBSR market report on regional differences in housing-market tightness; used here as the framework for the tiered cold-rent classes.",
      ),
    },
    {
      titel: "Heizspiegel: Heizkosten berechnen",
      url: "https://www.heizspiegel.de/heizkosten-berechnen/",
      hinweis: T(
        "Bundesweit einheitlicher Referenzrahmen für die Heizkostenannahme im Rechner.",
        "Nationally uniform reference framework for the calculator's heating-cost assumption.",
      ),
    },
  ],
};

const WOHNLAGE_QUELLEN: WohnlageSourceEntry[] = [
  {
    key: "A",
    beschreibung: T(
      "Repräsentativklasse für sehr teure und besonders nachgefragte Ballungsräume.",
      "Representative class for very expensive, particularly sought-after metropolitan areas.",
    ),
    quellen: [
      {
        titel: "Frankfurt am Main: angemessene Bruttokaltmiete in Frankfurt am Main",
        url: "https://frankfurt.de/-/media/frankfurtde/service-und-rathaus/verwaltung/aemter-und-institutionen/jugend-und-sozialamt/pdf/antraege-formulare-merkblaetter/kdu/angemessene-bruttokaltmiete.pdf",
        hinweis: T(
          "Amtliche Bruttokaltmiet-Tabelle der Stadt Frankfurt am Main, Stand Mietspiegel 2024; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse A.",
          "Official cold-rent table of the city of Frankfurt am Main, rent index 2024; serves as the publicly traceable housing-cost anchor for class A.",
        ),
      },
      {
        titel: "Jobcenter Frankfurt am Main: Wohnen in Frankfurt",
        url: "https://www.jc-frankfurt.de/geld/wohnen-in-frankfurt",
        hinweis: T(
          "Amtliche Jobcenter-Seite zu Unterkunftskosten und Angemessenheit im laufenden Bezug.",
          "Official jobcenter page on housing costs and reasonableness during ongoing benefits.",
        ),
      },
    ],
  },
  {
    key: "B",
    beschreibung: T(
      "Repräsentativklasse für größere Städte mit überdurchschnittlich angespanntem Mietmarkt.",
      "Representative class for larger cities with above-average rental-market tightness.",
    ),
    quellen: [
      {
        titel: "Berlin.de: Kosten der Unterkunft - AV-Wohnen",
        url: "https://www.berlin.de/sen/soziales/soziale-sicherung/grundsicherung-fuer-arbeitssuchende-hartz-iv/av-wohnen/",
        hinweis: T(
          "Amtliche Berliner Übersichtsseite zu Bruttokaltmiet-Richtwerten, Heizkosten und Karenzzeit; verweist selbst auf Mietspiegel- und Heizspiegel-Basis.",
          "Official Berlin overview page on cold-rent benchmarks, heating costs and grace period; itself refers to rent-index and heating-index data.",
        ),
      },
      {
        titel: "Berlin Sozialrecht: AV-Wohnen, Anlage 1",
        url: "https://sozialrecht.berlin.de/kategorie/ausfuehrungsvorschriften/av-wohnen-571939-v9-anlage-1.html",
        hinweis: T(
          "Amtliche Berliner Anlage zur Ermittlung angemessener Unterkunftskosten.",
          "Official Berlin appendix for determining reasonable housing costs.",
        ),
      },
    ],
  },
  {
    key: "C",
    beschreibung: T(
      "Repräsentativklasse für Mittelstädte und prosperierende Umlandlagen mit mittlerem Kostenniveau.",
      "Representative class for mid-sized cities and prosperous surrounding areas with mid-level cost.",
    ),
    quellen: [
      {
        titel: "Stadt Leipzig: Richtwerte für die Kosten der Unterkunft",
        url: "https://static.leipzig.de/fileadmin/mediendatenbank/leipzig-de/Stadt/02.5_Dez5_Jugend_Soziales_Gesundheit_Schule/50_Sozialamt/KdU/Richtwerte_KdUH.pdf",
        hinweis: T(
          "Amtliche Leipziger Richtwert-Tabelle für Bruttokaltmiete und Heizkosten; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse C.",
          "Official Leipzig benchmark table for cold rent and heating costs; serves as the publicly traceable housing-cost anchor for class C.",
        ),
      },
      {
        titel: "Jobcenter Leipzig: Unterkunft und Heizung",
        url: "https://jobcenter-leipzig.de/geldleistungen/unterkunft-und-heizung/",
        hinweis: T(
          "Amtliche Jobcenter-Seite mit Erläuterungen zur Zusammensetzung und Prüfung der Unterkunftskosten.",
          "Official jobcenter page explaining the composition and review of housing costs.",
        ),
      },
    ],
  },
  {
    key: "D",
    beschreibung: T(
      "Repräsentativklasse für ländliche oder strukturschwächere Räume mit niedrigerem Kostenniveau.",
      "Representative class for rural or structurally weaker areas with lower cost level.",
    ),
    quellen: [
      {
        titel: "Landkreis Görlitz: Neue Angemessenheitswerte für Kosten der Unterkunft ab 1. Februar 2023",
        url: "https://www.kreis-goerlitz.de/Bekanntmachungen/Neue-Angemessenheitswerte-fuer-Kosten-der-Unterkunft-im-Landkreis-Goerlitz-ab-1-Februar-2023.html?",
        hinweis: T(
          "Amtliche Bekanntmachung des Landkreises Görlitz zu den angehobenen Unterkunftsrichtwerten; dient als öffentlich nachvollziehbarer KdU-Anker für Klasse D.",
          "Official announcement of the Görlitz district on raised housing-cost benchmarks; serves as the publicly traceable housing-cost anchor for class D.",
        ),
      },
      {
        titel: "Richtwerte zur Bestimmung abstrakt angemessener Kosten der Unterkunft im Landkreis Görlitz",
        url: "https://www.wirtschaft-goerlitz.de/images/pdf/Richtwerte_KdU_ENO_2023.pdf",
        hinweis: T(
          "Ausformuliertes Richtwertdokument für den Landkreis Görlitz; ergänzende Detailquelle zur amtlichen Bekanntmachung.",
          "Fully worked benchmark document for the Görlitz district; supplementary detail source to the official announcement.",
        ),
      },
    ],
  },
];

const RECHTSGRUNDLAGEN: LegalSourceGroup[] = [
  {
    titel: T(
      "Bürgergeld, Mehrbedarfe und Bildung/Teilhabe",
      "Bürgergeld, additional needs and education/participation",
    ),
    beschreibung: T(
      "Amtliche Rechtsgrundlagen und Veröffentlichungen für Regelbedarfe, Mehrbedarfe und BuT.",
      "Official legal basis and publications for standard needs, additional needs and education/participation.",
    ),
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
        hinweis: T(
          "Abteilungen des Regelbedarfs / Referenzstruktur der Regelbedarfe.",
          "Departments of the standard need / reference structure of the standard needs.",
        ),
      },
      {
        titel: "SGB II § 21 Mehrbedarfe",
        url: "https://www.gesetze-im-internet.de/sgb_2/__21.html",
        hinweis: T(
          "Alleinerziehend, Warmwasser, Schwangerschaft und weitere Mehrbedarfe.",
          "Single parent, hot water, pregnancy and further additional needs.",
        ),
      },
      {
        titel: "BMAS: Leistungen aus dem Bildungspaket",
        url: "https://www.bmas.de/DE/Arbeit/Grundsicherung-Buergergeld/Bildungspaket/Leistungen/leistungen-bildungspaket_art.html",
      },
      {
        titel: "SGB V § 251",
        url: "https://www.gesetze-im-internet.de/sgb_5/__251.html",
        hinweis: T(
          "Beiträge zur Krankenversicherung bei Bürgergeld-Bezug.",
          "Health insurance contributions while on Bürgergeld.",
        ),
      },
      {
        titel: "SGB VI § 58",
        url: "https://www.gesetze-im-internet.de/sgb_6/__58.html",
        hinweis: T(
          "Anrechnungszeiten statt RV-Beitragszahlung beim Bürgergeld-Bezug.",
          "Credited periods instead of pension contributions while on Bürgergeld.",
        ),
      },
    ],
  },
  {
    titel: T(
      "Steuern, Kindergeld und Sozialversicherung",
      "Taxes, child benefit and social insurance",
    ),
    beschreibung: T(
      "Rechtsgrundlagen für den Einkommensteuer-, Soli- und SV-Teil des Rechners.",
      "Legal basis for the income-tax, solidarity-surcharge and social-insurance parts of the calculator.",
    ),
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
        hinweis: T(
          "Günstigerprüfung Kindergeld vs. Kinderfreibetrag.",
          "More-favourable test: child benefit vs. child allowance.",
        ),
      },
      {
        titel: "EStG § 32 Kinder, Freibeträge für Kinder",
        url: "https://www.gesetze-im-internet.de/estg/__32.html",
        hinweis: T(
          "Kinderfreibetrag, BEA-Freibetrag, hälftige Zuordnung und Übertragung.",
          "Child allowance, care/education allowance, half-share attribution and transfer.",
        ),
      },
      {
        titel: "EStG § 10 Sonderausgaben",
        url: "https://www.gesetze-im-internet.de/estg/__10.html",
        hinweis: T(
          "Vorsorgeaufwendungen, Basis-KV/PV, Rentenversicherung, sonstige Vorsorge.",
          "Provision expenses, basic health/care, pension, other provision.",
        ),
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
        hinweis: T(
          "Bemessungsgrundlage und Freigrenzen des Solidaritätszuschlags.",
          "Assessment basis and exemption thresholds for the solidarity surcharge.",
        ),
      },
      {
        titel: "GKV-Spitzenverband: Rechengrößen der Sozialversicherung 2026",
        url: "https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf",
      },
    ],
  },
  {
    titel: T(
      "Wohnen, Rundfunk, KiZ und ergänzende Orientierung",
      "Housing, broadcasting, child supplement and supplementary orientation",
    ),
    beschreibung: T(
      "Quellen für Wohnen, Rundfunkbeitrag und ergänzende Plausibilisierung einzelner Annahmen.",
      "Sources for housing, the broadcasting fee and supplementary plausibility checks for individual assumptions.",
    ),
    quellen: [
      {
        titel: "Heizspiegel: Heizkosten berechnen",
        url: "https://www.heizspiegel.de/heizkosten-berechnen/",
      },
      {
        titel: "WoGG Anlage 1 Höchstbeträge",
        url: "https://www.gesetze-im-internet.de/wogg/anlage_1.html",
        hinweis: T(
          "Im Rechner derzeit nur als Obergrenzen-Referenz, Wohngeld selbst bleibt Platzhalter 0 €.",
          "In the calculator currently only as a ceiling reference; the housing benefit itself remains a placeholder at 0 €.",
        ),
      },
      {
        titel: "BKGG § 6a Kinderzuschlag",
        url: "https://www.gesetze-im-internet.de/bkgg_1996/__6a.html",
        hinweis: T(
          "Im Rechner derzeit nur als Rechtsgrundlage, KiZ selbst bleibt Platzhalter 0 €.",
          "In the calculator currently only as a legal basis; the child supplement itself remains a placeholder at 0 €.",
        ),
      },
      {
        titel: "Rundfunkbeitrag: Informationen für Bürgerinnen und Bürger",
        url: "https://www.rundfunkbeitrag.de/buergerinnen_und_buerger/informationen/index_ger.html",
        hinweis: T(
          "18,36 € pro Wohnung und Befreiungs-/Ermäßigungszugänge.",
          "18.36 € per dwelling and exemption/reduction entry points.",
        ),
      },
      {
        titel: "Rundfunkbeitrag: Befreiung oder Ermäßigung beantragen",
        url: "https://www.rundfunkbeitrag.de/buergerinnen_und_buerger/formulare/befreiung-oder-ermaessigung-beantragen",
      },
      {
        titel: "Sekundärquelle: Warmwasser-Mehrbedarf",
        url: "https://www.buergergeld.org/sgb-ii/mehrbedarf-warmwasser/",
        hinweis: T(
          "Nur zur Plausibilisierung; maßgeblich ist SGB II § 21.",
          "For plausibility only; the authoritative source is SGB II § 21.",
        ),
      },
      {
        titel: "Sekundärquelle: Bildungspaket Überblick",
        url: "https://www.buergergeld.org/bildungspaket/",
        hinweis: T(
          "Nur ergänzend; maßgeblich sind BMAS und Gesetz.",
          "Supplementary only; the authoritative sources are BMAS and the statute.",
        ),
      },
      {
        titel: "Sekundärquelle: Solidaritätszuschlag Überblick",
        url: "https://www.tk.de/firmenkunden/service/fachthemen/fachthema-beitraege/solidaritaetszuschlag-2075802",
        hinweis: T(
          "Nur ergänzend; maßgeblich ist SolzG § 3.",
          "Supplementary only; the authoritative source is SolzG § 3.",
        ),
      },
      {
        titel: "Sekundärquelle: Kindergeld/Kinderfreibetrag 2026",
        url: "https://www.familienkasse-info.de/news/kindergeld-und-elterngeld/mehr-geld-fuer-familien-2026-kindergeld-und-kinderfreibetrag-steigen-erneut-1615/",
        hinweis: T(
          "Nur ergänzend; maßgeblich sind §§ 31, 32, 66 EStG.",
          "Supplementary only; the authoritative sources are §§ 31, 32, 66 EStG.",
        ),
      },
    ],
  },
  {
    titel: T("Website-Recht und Haftungsgrenzen", "Website law and liability limits"),
    beschreibung: T(
      "Rechtsgrundlagen für den eingeblendeten Disclaimer und den Betrieb einer öffentlichen Website.",
      "Legal basis for the displayed disclaimer and the operation of a public website.",
    ),
    quellen: [
      {
        titel: "BGB § 309",
        url: "https://www.gesetze-im-internet.de/bgb/__309.html",
        hinweis: T(
          "Grenzen pauschaler Haftungsausschlüsse, insbesondere bei Vorsatz, grober Fahrlässigkeit sowie Leben, Körper, Gesundheit.",
          "Limits on blanket liability disclaimers, especially for intent, gross negligence and life, body, health.",
        ),
      },
      {
        titel: "DDG § 5 Allgemeine Informationspflichten",
        url: "https://www.gesetze-im-internet.de/ddg/__5.html",
        hinweis: T(
          "Impressumspflichten für öffentliche, nicht rein private Websites.",
          "Imprint requirements for public, not purely private websites.",
        ),
      },
    ],
  },
];

export function renderLegalNotice(container: HTMLElement): void {
  container.innerHTML = T(
    `
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
  `,
    `
    <section class="legal-block">
      <h2>Legal notice</h2>
      <p>
        This application provides a non-binding, general model calculation to the best of its knowledge and belief.
        It does not replace individual tax, social or legal advice and does not establish any client or advisory relationship.
      </p>
      <ul class="legal-list">
        <li>What counts in every case is the relevant statute, administrative rule, local guideline, decision letter and the actual circumstances of the individual case.</li>
        <li>No guarantee is given for accuracy, completeness, currency, commercial usefulness or fitness for any particular purpose.</li>
        <li>To the extent permitted by law, liability for financial losses arising from the use of the application is excluded; unaffected are liability for intent, gross negligence, under the German Product Liability Act and for injury to life, body or health.</li>
        <li>Before any legally or financially relevant decision, a review by the jobcenter, Familienkasse, tax advisor, wage-tax assistance association or lawyer should be obtained.</li>
      </ul>
      <p class="legal-small">
        For a public, not purely private website, an imprint under DDG § 5 and regular data-protection notices are additionally required. These duties are not replaced by the disclaimer above.
      </p>
    </section>

    <section class="legal-block">
      <h2>Model limits</h2>
      <ul class="legal-list">
        <li>Housing benefit (§ 19 WoGG) and child supplement (§ 6a BKGG) remain placeholders at 0 € and can noticeably change the result for working households.</li>
        <li>Application-based benefits are bundled through presets; the default is the conservative <strong>Secured</strong> preset.</li>
        <li>Residential tier A to D is an own, openly disclosed model approach with representative values; the exact figures and example primary sources are listed in the tier A-D source appendix below. Local rent and local housing-cost guidelines always take precedence.</li>
        <li>Undeclared side income reflects only the illegal, undetected scenario; criminal liability, claw-backs and sanctions are not priced in.</li>
      </ul>
    </section>

    ${renderWohnlageAppendix()}

    <section class="legal-block">
      <h2>Legal basis &amp; sources</h2>
      <p>
        The following lists the legal bases, official publications and supplementary secondary sources used in the calculator, each with the full URL. The separate residential tier A-D assumptions are already in the preceding source appendix.
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
      >Source code on GitHub</a>
    </section>
  `,
  );
}

function renderWohnlageAppendix(): string {
  return T(
    `
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
  `,
    `
    <section class="legal-block">
      <h2>Residential tier A-D: methodology &amp; source appendix</h2>
      <p>
        Classes A to D are not official legal categories but an open model approach of this calculator. To make the condensation transparent, both the exact representative values used and the structural and example sources consulted are published here.
      </p>
      <ul class="legal-list">
        <li>The spatial structure follows the housing-market regions / urban-rural regions of the BBSR.</li>
        <li>The housing-cost side uses publicly published local benchmark examples per class as anchors; what remains legally binding is always the specific local guideline under § 22 SGB II.</li>
        <li>The work side uses openly disclosed representative values for cold rent and non-rent utilities. These values are editorial model values for classification, not official rent-index values.</li>
        <li>Heating costs are modelled uniformly across classes using the nationwide Heizspiegel approach.</li>
      </ul>
      <div class="source-groups">
        ${renderGroup(WOHNLAGE_GRUNDLAGEN)}
        ${WOHNLAGE_QUELLEN.map(renderWohnlageEntry).join("")}
      </div>
    </section>
  `,
  );
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
  const beispiele = T(
    `Beispiele im Rechner: ${wohnlage.beispiele}.`,
    `Examples in the calculator: ${wohnlage.beispiele}.`,
  );
  const offenlegungTitel = T(
    "Offenlegung der Modellverdichtung",
    "Disclosure of the model condensation",
  );
  const offenlegungText = T(
    "Die obigen Werte sind die exakt im Rechner verwendeten Repräsentativwerte für diese Klasse. Sie dienen nur der bundesweiten Vergleichbarkeit und ersetzen keine lokale Miet-, Wohngeld- oder KdU-Prüfung.",
    "The values above are the exact representative values used in the calculator for this class. They serve only nationwide comparability and do not replace any local rent, housing-benefit or housing-cost review.",
  );

  return `
    <section class="source-group">
      <h3>${wohnlage.label}</h3>
      <p class="source-group-intro">${entry.beschreibung} ${beispiele}</p>
      <div class="wohnlage-metrics">
        ${renderMetric(
          T("KdU-Bruttokaltmiete", "Housing cold rent"),
          formatHouseholdValues(
            wohnlage.bruttokaltmieteEurMonat,
            wohnlage.aufschlagJeWeiterePersonEur,
            "€",
          ),
        )}
        ${renderMetric(
          T("Nettokaltmiete", "Net cold rent"),
          `${formatDecimal(wohnlage.nettokaltEurProQmMonat)} €/m²`,
        )}
        ${renderMetric(
          T("Kalte Nebenkosten", "Non-rent utilities"),
          `${formatDecimal(wohnlage.nebenkostenEurProQmMonat)} €/m²`,
        )}
        ${renderMetric(
          T("Wohnfläche", "Living space"),
          formatHouseholdValues(wohnlage.wohnflaecheQm, wohnlage.aufschlagJeWeiterePersonQm, "m²"),
        )}
        ${renderMetric(
          T("Heizkosten", "Heating costs"),
          `${formatDecimal(wohnlage.heizkostenEurProQmMonat)} €/m²`,
        )}
      </div>
      <ul class="source-list">
        <li class="source-item">
          <div class="source-link source-link-static">${offenlegungTitel}</div>
          <div class="source-note">${offenlegungText}</div>
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
    .map((value, index) =>
      T(
        `${index + 1} P ${formatInteger(value)} ${unit}`,
        `${index + 1} p ${formatInteger(value)} ${unit}`,
      ),
    )
    .join(" · ");

  return T(
    `${basis} · je weitere Person +${formatInteger(additionalValue)} ${unit}`,
    `${basis} · each further person +${formatInteger(additionalValue)} ${unit}`,
  );
}

function formatInteger(value: number): string {
  return INTEGER_FORMAT.format(value);
}

function formatDecimal(value: number): string {
  return DECIMAL_FORMAT.format(value);
}
