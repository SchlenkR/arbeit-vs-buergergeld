import {
  WOHNLAGEN_2026,
  REGELBEDARF_2026_EUR_MONAT,
  REGELBEDARF_ABTEILUNGEN_RBS1_2026,
  MEHRBEDARF_ALLEINERZIEHEND,
  MEHRBEDARF_SCHWANGERSCHAFT_PCT,
  BUT_2026,
  BUERGERGELD_KV_PV_PAUSCHALE_2026,
  BUERGERGELD_RV_RENTENVERLUST_PRO_JAHR_BEZUG,
  RUNDFUNKBEITRAG_EUR_MONAT,
  OEPNV_2026,
} from "./constants2026";
import { berechneKdU } from "./buergergeld";
import type { Haushalt } from "./types";
import type { AntragsAnspruchItem } from "../config";
import { OVERLAY_ID } from "../config";
import { T } from "../i18n";

export interface AnspruchPosten {
  label: string;
  wertMonat: number | null;
  hinweis?: string;
  paragraf?: string;
  overlayId?: string;
}

export interface AnspruchsKategorie {
  titel: string;
  untertitel: string;
  summeMonat: number | null;
  items: AnspruchPosten[];
  kennzahlen?: string[];
  ton?: "positiv" | "neutral" | "minus";
}

export interface Anspruchsuebersicht {
  haushalt: Haushalt;
  personen: number;
  erwachsene: number;
  kategorien: AnspruchsKategorie[];
}

export function buildAnspruchsuebersicht(
  haushalt: Haushalt,
  antragsItems: AntragsAnspruchItem[] = [],
): Anspruchsuebersicht {
  const erwachsene =
    haushalt.typ === "paar" || haushalt.typ === "paar_verheiratet" ? 2 : 1;
  const personen = erwachsene + haushalt.kinder.length;
  const overlay = buildOverlay(antragsItems);

  return {
    haushalt,
    personen,
    erwachsene,
    kategorien: [
      applyOverlay(kategorieWohnung(haushalt, personen), overlay),
      kategorieRegelbedarf(haushalt, erwachsene),
      applyOverlay(kategorieKrankenversicherung(haushalt, erwachsene), overlay),
      applyOverlay(kategorieMehrbedarfe(haushalt), overlay),
      applyOverlay(kategorieBildungTeilhabe(haushalt), overlay),
      applyOverlay(kategorieEinmalleistungen(), overlay),
      applyOverlay(kategorieGeldwerteVorteile(haushalt, erwachsene), overlay),
      kategorieRentenversicherung(),
    ],
  };
}

function buildOverlay(items: AntragsAnspruchItem[]): Map<string, AntragsAnspruchItem> {
  const m = new Map<string, AntragsAnspruchItem>();
  for (const it of items) {
    if (it.ersetztAnspruchId) m.set(it.ersetztAnspruchId, it);
  }
  return m;
}

function applyOverlay(
  k: AnspruchsKategorie,
  overlay: Map<string, AntragsAnspruchItem>,
): AnspruchsKategorie {
  if (overlay.size === 0) return k;
  let touched = false;
  const items = k.items.map((it): AnspruchPosten => {
    if (!it.overlayId) return it;
    const hit = overlay.get(it.overlayId);
    if (!hit || it.wertMonat !== null) return it;
    touched = true;
    const next: AnspruchPosten = {
      label: it.label,
      wertMonat: hit.eurMonat,
      hinweis: T(
        `Annahme aus aktivem Antrags-Szenario: ${hit.quelle}`,
        `Assumption from active application scenario: ${hit.quelle}`,
      ),
    };
    if (hit.paragraf) next.paragraf = hit.paragraf;
    if (it.overlayId) next.overlayId = it.overlayId;
    return next;
  });
  if (!touched) return k;
  const hasPositiveValue = items.some((i) => (i.wertMonat ?? 0) > 0);
  const summe = items.reduce((s, i) => s + (i.wertMonat ?? 0), 0);
  const ton: AnspruchsKategorie["ton"] =
    hasPositiveValue && k.ton !== "minus" ? "positiv" : k.ton;
  const next: AnspruchsKategorie = {
    titel: k.titel,
    untertitel: k.untertitel,
    summeMonat: summe > 0 ? summe : k.summeMonat,
    items,
  };
  if (k.kennzahlen) next.kennzahlen = k.kennzahlen;
  if (ton) next.ton = ton;
  return next;
}

function kategorieWohnung(haushalt: Haushalt, personen: number): AnspruchsKategorie {
  const w = WOHNLAGEN_2026[haushalt.wohnlage];
  const idx = Math.min(personen, 5) - 1;
  const extra = Math.max(0, personen - 5);
  const qm = w.wohnflaecheQm[idx]! + extra * w.aufschlagJeWeiterePersonQm;
  const bruttokalt =
    w.bruttokaltmieteEurMonat[idx]! + extra * w.aufschlagJeWeiterePersonEur;
  const heizkosten = qm * w.heizkostenEurProQmMonat;
  const gesamtKdu = berechneKdU(haushalt);
  const zimmer = personen + 1;

  return {
    titel: T("Wohnung", "Housing"),
    untertitel: T("Kosten der Unterkunft § 22 SGB II", "Housing costs § 22 SGB II"),
    summeMonat: gesamtKdu,
    kennzahlen: [
      T(`${qm} m² Wohnfläche`, `${qm} m² living space`),
      T(`~ ${zimmer} Zimmer`, `~ ${zimmer} rooms`),
      T(`Wohnlage ${haushalt.wohnlage}`, `Residential tier ${haushalt.wohnlage}`),
    ],
    ton: "positiv",
    items: [
      {
        label: T("Angemessene Bruttokaltmiete", "Reasonable cold rent"),
        wertMonat: bruttokalt,
        hinweis: T(
          "Wird 1:1 übernommen bis zur regionalen Angemessenheitsgrenze.",
          "Covered 1:1 up to the regional reasonableness limit.",
        ),
        paragraf: "§ 22 Abs. 1 SGB II",
      },
      {
        label: T(
          "Heizkosten (tatsächlich, in angemessener Höhe)",
          "Heating costs (actual, at reasonable level)",
        ),
        wertMonat: Math.round(heizkosten),
        hinweis: T(
          `Ansatz: ${w.heizkostenEurProQmMonat.toFixed(2).replace(".", ",")} €/m² (Bundesheizkostenspiegel).`,
          `Basis: ${w.heizkostenEurProQmMonat.toFixed(2)} €/m² (federal heating cost index).`,
        ),
        paragraf: "§ 22 Abs. 1 Satz 3 SGB II",
      },
      {
        label: T("Nebenkostennachzahlungen", "Utility back-payments"),
        wertMonat: null,
        hinweis: T(
          "Werden im Monat der Fälligkeit als einmaliger Bedarf zusätzlich übernommen.",
          "Covered in the month they come due as a one-off additional need.",
        ),
        paragraf: "§ 22 Abs. 1 Satz 4 SGB II",
        overlayId: OVERLAY_ID.NEBENKOSTENNACHZAHLUNGEN,
      },
      {
        label: T("Mietkaution bei Umzug", "Rental deposit on moving"),
        wertMonat: null,
        hinweis: T(
          "Auf Antrag als Darlehen (zinslos), verrechnet mit künftigen Regelbedarfen.",
          "On request as an interest-free loan, offset against future standard needs.",
        ),
        paragraf: "§ 22 Abs. 6 SGB II",
      },
      {
        label: T("Umzugskosten bei Wohnungswechsel", "Moving costs when changing flats"),
        wertMonat: null,
        hinweis: T(
          "Spedition, Kartons, Helfer; tatsächliche Kosten werden übernommen, wenn Umzug notwendig ist.",
          "Movers, boxes, helpers; actual costs are covered when the move is necessary.",
        ),
        paragraf: "§ 22 Abs. 6 SGB II",
        overlayId: OVERLAY_ID.UMZUGSKOSTEN,
      },
      {
        label: T(
          "Einzugs- und Schönheitsreparaturen",
          "Move-in and cosmetic repairs",
        ),
        wertMonat: null,
        hinweis: T(
          "Renovierung bei Einzug und Auszug (Streichen, Tapezieren), sofern mietvertraglich geschuldet.",
          "Renovation on move-in and move-out (painting, wallpapering) where contractually required.",
        ),
        paragraf: "§ 22 Abs. 6 SGB II",
        overlayId: OVERLAY_ID.EINZUGSRENOVIERUNG,
      },
    ],
  };
}

function kategorieRegelbedarf(haushalt: Haushalt, erwachsene: number): AnspruchsKategorie {
  const items: AnspruchPosten[] = [];
  const a = REGELBEDARF_ABTEILUNGEN_RBS1_2026;

  if (erwachsene === 1) {
    items.push({
      label: T("Erwachsene/r (Regelbedarfsstufe 1)", "Adult (standard need level 1)"),
      wertMonat: REGELBEDARF_2026_EUR_MONAT.alleinstehend,
      paragraf: "§ 20 Abs. 2 SGB II",
    });
  } else {
    items.push({
      label: T(
        "2 Partner (Regelbedarfsstufe 2, je 506 €)",
        "2 partners (standard need level 2, 506 € each)",
      ),
      wertMonat: REGELBEDARF_2026_EUR_MONAT.partner * 2,
      paragraf: "§ 20 Abs. 4 SGB II",
    });
  }

  for (const kind of haushalt.kinder) {
    if (kind.alter >= 14) {
      items.push({
        label: T(
          `Jugendliche/r ${kind.alter} J. (RBS 4)`,
          `Adolescent age ${kind.alter} (level 4)`,
        ),
        wertMonat: REGELBEDARF_2026_EUR_MONAT.jugendlicher14Bis17,
        paragraf: "§ 23 Nr. 1 SGB II",
      });
    } else if (kind.alter >= 6) {
      items.push({
        label: T(
          `Kind ${kind.alter} J. (RBS 5)`,
          `Child age ${kind.alter} (level 5)`,
        ),
        wertMonat: REGELBEDARF_2026_EUR_MONAT.kind6Bis13,
        paragraf: "§ 23 Nr. 2 SGB II",
      });
    } else {
      items.push({
        label: T(
          `Kind ${kind.alter} J. (RBS 6)`,
          `Child age ${kind.alter} (level 6)`,
        ),
        wertMonat: REGELBEDARF_2026_EUR_MONAT.kind0Bis5,
        paragraf: "§ 23 Nr. 3 SGB II",
      });
    }
  }

  const summe = items.reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: T("Regelbedarf (frei verfügbar)", "Standard need (freely disposable)"),
    untertitel: T(
      "Deckt Ernährung, Kleidung, Strom, Freizeit",
      "Covers food, clothing, electricity, leisure",
    ),
    summeMonat: summe,
    ton: "positiv",
    items,
    kennzahlen: [
      T(`Essen ~${Math.round(a.nahrungsmittelGetraenke)}€`, `Food ~${Math.round(a.nahrungsmittelGetraenke)}€`),
      T(`Kleidung ~${Math.round(a.bekleidungSchuhe)}€`, `Clothing ~${Math.round(a.bekleidungSchuhe)}€`),
      T(`Strom ~${Math.round(a.wohnenEnergieInstandhaltung)}€`, `Electricity ~${Math.round(a.wohnenEnergieInstandhaltung)}€`),
      T(`Freizeit ~${Math.round(a.freizeitKultur)}€`, `Leisure ~${Math.round(a.freizeitKultur)}€`),
      T(`Telefon/Internet ~${Math.round(a.nachrichtenInternet)}€`, `Phone/internet ~${Math.round(a.nachrichtenInternet)}€`),
    ],
  };
}

function kategorieKrankenversicherung(
  _haushalt: Haushalt,
  erwachsene: number,
): AnspruchsKategorie {
  const kv = BUERGERGELD_KV_PV_PAUSCHALE_2026.krankenversicherungMonat * erwachsene;
  const pv = BUERGERGELD_KV_PV_PAUSCHALE_2026.pflegeversicherungMonat * erwachsene;

  return {
    titel: T("Krankenversicherung", "Health insurance"),
    untertitel: T("Pflichtversicherung in der GKV", "Mandatory public health insurance"),
    summeMonat: kv + pv,
    ton: "positiv",
    kennzahlen: [
      T("volle GKV-Leistungen", "full public health benefits"),
      T("Familienversicherung Kinder", "family coverage for children"),
      T("keine Eigenbeiträge", "no own contributions"),
    ],
    items: [
      {
        label: T(
          "Krankenversicherung (GKV); Beiträge vom Jobcenter",
          "Health insurance (public); premiums paid by jobcenter",
        ),
        wertMonat: kv,
        hinweis: T(
          "Pflichtversicherung, Jobcenter zahlt pauschalen Monatsbeitrag direkt an die Krankenkasse. Für den Haushalt keine Eigenleistung.",
          "Mandatory coverage; the jobcenter pays a flat monthly premium directly to the health fund. No own contribution for the household.",
        ),
        paragraf: "§ 5 Abs. 1 Nr. 2a SGB V iVm § 251 Abs. 4 SGB V",
      },
      {
        label: T(
          "Pflegeversicherung (PV); Beiträge vom Jobcenter",
          "Long-term care insurance; premiums paid by jobcenter",
        ),
        wertMonat: pv,
        hinweis: T(
          "Analog zur GKV, Beitrag je Erwachsenem. Kinder über Familienversicherung.",
          "Analogous to public health insurance, premium per adult. Children via family coverage.",
        ),
        paragraf: "§ 20 Abs. 1 Nr. 2a SGB XI",
      },
      {
        label: T("Zuzahlungsbefreiung", "Co-payment exemption"),
        wertMonat: null,
        hinweis: T(
          "Belastungsgrenze für Medikamente/Behandlungen: 2 % des Jahresregelsatzes (bzw. 1 % bei chronisch Kranken). Danach vollständig zuzahlungsfrei.",
          "Burden limit for medication/treatment: 2 % of the annual standard rate (1 % for chronically ill). Beyond that, fully exempt from co-payments.",
        ),
        paragraf: "§ 62 SGB V",
        overlayId: OVERLAY_ID.ZUZAHLUNGSBEFREIUNG,
      },
    ],
  };
}

function kategorieMehrbedarfe(haushalt: Haushalt): AnspruchsKategorie {
  const items: AnspruchPosten[] = [];
  const rbs1 = REGELBEDARF_2026_EUR_MONAT.alleinstehend;

  if (haushalt.typ === "alleinerziehend" && haushalt.kinder.length > 0) {
    const kinderU7 = haushalt.kinder.filter((k) => k.alter < 7).length;
    const kinderU16 = haushalt.kinder.filter((k) => k.alter < 16).length;
    const pauschale36 =
      kinderU7 >= 1 || (kinderU16 >= 2 && kinderU16 <= 3)
        ? MEHRBEDARF_ALLEINERZIEHEND.prozentRbs1Basis
        : 0;
    const proKind = Math.min(
      haushalt.kinder.length * MEHRBEDARF_ALLEINERZIEHEND.prozentProKind,
      MEHRBEDARF_ALLEINERZIEHEND.prozentDeckel,
    );
    const pct = Math.max(pauschale36, proKind);
    items.push({
      label: T(
        `Alleinerziehend (${(pct * 100).toFixed(0)} % RBS 1)`,
        `Single parent (${(pct * 100).toFixed(0)} % of level 1)`,
      ),
      wertMonat: rbs1 * pct,
      paragraf: "§ 21 Abs. 3 SGB II",
    });
  } else {
    items.push({
      label: T("Alleinerziehend", "Single parent"),
      wertMonat: null,
      hinweis: T(
        "Trifft nicht zu (Voraussetzung: alleinerziehend mit Kind im Haushalt).",
        "Not applicable (requires single parent with child in household).",
      ),
      paragraf: "§ 21 Abs. 3 SGB II",
    });
  }

  if (haushalt.warmwasserDezentral) {
    items.push({
      label: T("Dezentrale Warmwasserbereitung", "Decentralised hot water supply"),
      wertMonat: null,
      hinweis: T(
        "2,3 % RBS 1 für Erwachsene, 0,8-1,4 % für Kinder je nach Alter. Aktiv.",
        "2.3 % of level 1 for adults, 0.8-1.4 % for children depending on age. Active.",
      ),
      paragraf: "§ 21 Abs. 7 SGB II",
    });
  } else {
    items.push({
      label: T("Dezentrale Warmwasserbereitung", "Decentralised hot water supply"),
      wertMonat: null,
      hinweis: T(
        "Nur bei Boiler/Durchlauferhitzer; hier nicht aktiviert.",
        "Only with boiler or instantaneous water heater; not active here.",
      ),
      paragraf: "§ 21 Abs. 7 SGB II",
    });
  }

  if (haushalt.schwangerschaftAb13SSW) {
    items.push({
      label: T(
        "Schwangerschaft ab 13. SSW (17 % RBS 1)",
        "Pregnancy from 13th week (17 % of level 1)",
      ),
      wertMonat: rbs1 * MEHRBEDARF_SCHWANGERSCHAFT_PCT,
      paragraf: "§ 21 Abs. 2 SGB II",
    });
  }

  items.push({
    label: T("Behinderung / Erwerbsminderung", "Disability / reduced earning capacity"),
    wertMonat: null,
    hinweis: T(
      "35 % RBS 1 bei Teilhabe-Bezug (§ 21 Abs. 4). 17 % bei Gehbehinderung mit Merkzeichen G. Hier nicht modelliert.",
      "35 % of level 1 with participation benefits (§ 21(4)). 17 % with walking disability (marker G). Not modelled here.",
    ),
    paragraf: "§ 21 Abs. 4 SGB II",
  });
  items.push({
    label: T(
      "Kostenaufwändige Ernährung (ärztlich)",
      "Medically-required diet (certified)",
    ),
    wertMonat: null,
    hinweis: T(
      "Bei Zöliakie, Niereninsuffizienz u. ä.; nach Empfehlungen des Deutschen Vereins, ärztliches Attest nötig. Nicht modelliert.",
      "For coeliac disease, renal failure etc.; following recommendations of the Deutscher Verein, medical certificate required. Not modelled.",
    ),
    paragraf: "§ 21 Abs. 5 SGB II",
    overlayId: OVERLAY_ID.KOSTENAUFW_ERNAEHRUNG,
  });

  const summe = items
    .filter((i) => i.wertMonat !== null)
    .reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: T("Mehrbedarfe", "Additional needs"),
    untertitel: T(
      "Zusätzliche Bedarfe in Sonderlagen",
      "Additional needs in special situations",
    ),
    summeMonat: summe > 0 ? summe : null,
    ton: summe > 0 ? "positiv" : "neutral",
    items,
  };
}

function kategorieBildungTeilhabe(haushalt: Haushalt): AnspruchsKategorie {
  if (haushalt.kinder.length === 0) {
    return {
      titel: T("Bildung & Teilhabe", "Education & participation"),
      untertitel: T("§ 28 SGB II; nur bei Kindern", "§ 28 SGB II; only with children"),
      summeMonat: null,
      ton: "neutral",
      items: [
        {
          label: T("Nicht anwendbar", "Not applicable"),
          wertMonat: null,
          hinweis: T("Kein Kind im Haushalt.", "No child in the household."),
        },
      ],
    };
  }

  const items: AnspruchPosten[] = [];
  const schulKinder = haushalt.kinder.filter((k) => k.alter >= 6 && k.alter < 25).length;
  const teilhabeKinder = haushalt.kinder.filter((k) => k.alter < 18).length;
  const mittagessenKinder = haushalt.kinder.filter(
    (k) => k.alter >= BUT_2026.mittagessenMinAlter && k.alter < 18,
  ).length;
  const klassenfahrtKinder = haushalt.kinder.filter(
    (k) => k.alter >= BUT_2026.klassenfahrtMinAlter && k.alter < 18,
  ).length;

  if (schulKinder > 0) {
    items.push({
      label: T(
        `Schulbedarfspauschale (${schulKinder} Kind${schulKinder === 1 ? "" : "er"})`,
        `School supplies allowance (${schulKinder} child${schulKinder === 1 ? "" : "ren"})`,
      ),
      wertMonat: (schulKinder * BUT_2026.schulbedarfEurJahr) / 12,
      hinweis: T(
        `${BUT_2026.schulbedarfEurJahr} €/Jahr; 130 € zum 1.8. + 65 € zum 1.2.`,
        `${BUT_2026.schulbedarfEurJahr} €/year; 130 € on 1 Aug + 65 € on 1 Feb.`,
      ),
      paragraf: "§ 28 Abs. 3 SGB II",
    });
  }
  if (teilhabeKinder > 0) {
    items.push({
      label: T(
        `Teilhabe Freizeit/Verein/Kultur (${teilhabeKinder})`,
        `Participation leisure/club/culture (${teilhabeKinder})`,
      ),
      wertMonat: teilhabeKinder * BUT_2026.teilhabeEurMonat,
      hinweis: T(
        "Z. B. Sportverein, Musikschule, Kulturangebote.",
        "E. g. sports clubs, music schools, cultural offerings.",
      ),
      paragraf: "§ 28 Abs. 7 SGB II",
    });
  }
  if (mittagessenKinder > 0) {
    items.push({
      label: T(
        `Mittagessen Kita/Schule (${mittagessenKinder})`,
        `Lunch at kindergarten/school (${mittagessenKinder})`,
      ),
      wertMonat: mittagessenKinder * BUT_2026.mittagessenEurMonat,
      hinweis: T(
        "Eigenanteil am Mittagessen wird in voller Höhe übernommen.",
        "Own contribution for lunch is covered in full.",
      ),
      paragraf: "§ 28 Abs. 6 SGB II",
    });
  }
  if (klassenfahrtKinder > 0) {
    items.push({
      label: T(
        `Klassenfahrt/Schulausflüge (${klassenfahrtKinder})`,
        `School trips/excursions (${klassenfahrtKinder})`,
      ),
      wertMonat: (klassenfahrtKinder * BUT_2026.klassenfahrtSchulausflugEurJahr) / 12,
      hinweis: T(
        "Tatsächliche Kosten; Schätzung 250 €/Jahr/Schulkind.",
        "Actual costs; estimate 250 €/year/school child.",
      ),
      paragraf: "§ 28 Abs. 2 SGB II",
    });
  }
  items.push({
    label: T("Schüler-Beförderung", "Student transport"),
    wertMonat: null,
    hinweis: T(
      "Tatsächliche Schülerticket-Kosten, sofern nötig und nicht anderweitig abgedeckt.",
      "Actual student ticket costs where needed and not otherwise covered.",
    ),
    paragraf: "§ 28 Abs. 4 SGB II",
    overlayId: OVERLAY_ID.SCHUELER_BEFOERDERUNG,
  });
  items.push({
    label: T("Lernförderung / Nachhilfe", "Tutoring / remedial teaching"),
    wertMonat: null,
    hinweis: T(
      "Nach Bedarf bei Lernzielgefährdung. Kein Pauschalbetrag; Antrag auf konkrete Lernförderung.",
      "As needed where learning objectives are at risk. No flat rate; application for specific support.",
    ),
    paragraf: "§ 28 Abs. 5 SGB II",
    overlayId: OVERLAY_ID.LERNFOERDERUNG,
  });
  const kinderU3 = haushalt.kinder.filter((k) => k.alter < 3).length;
  if (kinderU3 > 0) {
    items.push({
      label: T("Kita-Gebührenbefreiung (U3)", "Kindergarten fee exemption (under 3)"),
      wertMonat: null,
      hinweis: T(
        "In den meisten Kommunen: volle Erstattung der Kita-Gebühren für U3-Kinder bei BG-Bezug. Beantragung beim Jugendamt.",
        "In most municipalities: full reimbursement of kindergarten fees for under-3 children on Bürgergeld. Apply at the youth office.",
      ),
      paragraf: "§ 90 SGB VIII",
      overlayId: OVERLAY_ID.KITA_GEBUEHREN_U3,
    });
  }

  const summe = items.reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: T("Bildung & Teilhabe", "Education & participation"),
    untertitel: T("§ 28 SGB II; pro Kind", "§ 28 SGB II; per child"),
    summeMonat: summe,
    ton: "positiv",
    items,
  };
}

function kategorieEinmalleistungen(): AnspruchsKategorie {
  return {
    titel: T("Einmalleistungen", "One-off benefits"),
    untertitel: T("§ 24 SGB II; bei Bedarf", "§ 24 SGB II; as needed"),
    summeMonat: null,
    ton: "neutral",
    kennzahlen: [
      T("auf Antrag", "on request"),
      T("ohne Anrechnung Regelbedarf", "no offset against standard need"),
    ],
    items: [
      {
        label: T(
          "Erstausstattung Wohnung (Möbel, Haushaltsgeräte)",
          "Initial home equipment (furniture, appliances)",
        ),
        wertMonat: null,
        hinweis: T(
          "Bei Erstbezug, nach Haft/Klinik, nach Trennung mit Umzug. Pauschalen variieren je Kommune; typisch 800-2.500 € je nach Haushaltsgröße.",
          "On first move-in, after custody/clinic, after separation with a move. Lump sums vary by municipality; typically 800-2,500 € depending on household size.",
        ),
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        overlayId: OVERLAY_ID.ERSTAUSSTATTUNG_WOHNUNG,
      },
      {
        label: T(
          "Erstausstattung Bekleidung; Schwangerschaft/Geburt",
          "Initial clothing; pregnancy/birth",
        ),
        wertMonat: null,
        hinweis: T(
          "Kinderwagen, Baby-Ausstattung, Umstandsmode. Pauschale kommunal verschieden.",
          "Stroller, baby equipment, maternity clothing. Lump sum differs by municipality.",
        ),
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        overlayId: OVERLAY_ID.ERSTAUSSTATTUNG_BEKLEIDUNG,
      },
      {
        label: T(
          "Orthopädische Schuhe, Reparaturen therapeutischer Geräte",
          "Orthopaedic shoes, therapeutic device repairs",
        ),
        wertMonat: null,
        hinweis: T(
          "Tatsächliche Kosten, soweit nicht von Krankenkasse übernommen.",
          "Actual costs where not covered by the health fund.",
        ),
        paragraf: "§ 24 Abs. 3 Nr. 3 SGB II",
        overlayId: OVERLAY_ID.ORTHOPAEDISCHE_SCHUHE,
      },
      {
        label: T(
          "Weiße Ware (Waschmaschine, Kühlschrank) bei Defekt",
          "White goods (washing machine, fridge) on failure",
        ),
        wertMonat: null,
        hinweis: T(
          "Als Darlehen, wird mit künftigen Regelbedarfen verrechnet (max. 10 %).",
          "As a loan, offset against future standard needs (max. 10 %).",
        ),
        paragraf: "§ 24 Abs. 1 SGB II",
      },
    ],
  };
}

function kategorieGeldwerteVorteile(
  _haushalt: Haushalt,
  erwachsene: number,
): AnspruchsKategorie {
  const rundfunk = RUNDFUNKBEITRAG_EUR_MONAT;
  const oepnvErsparnis =
    OEPNV_2026.deutschlandticketRegulaerEurMonat -
    OEPNV_2026.deutschlandticketErmaessigtEurMonat;

  return {
    titel: T("Geldwerte Vorteile", "In-kind benefits"),
    untertitel: T(
      "Kostenersparnisse außerhalb der Auszahlung",
      "Cost savings outside of cash payouts",
    ),
    summeMonat: rundfunk + oepnvErsparnis * erwachsene,
    ton: "positiv",
    items: [
      {
        label: T("Rundfunkbeitrag-Befreiung", "Broadcasting fee exemption"),
        wertMonat: rundfunk,
        hinweis: T(
          "Auf Antrag beim ARD ZDF Deutschlandradio Beitragsservice.",
          "On request via the ARD ZDF Deutschlandradio contribution service.",
        ),
        paragraf: "§ 4 Abs. 1 Nr. 3 RBStV",
      },
      {
        label: T(
          `Sozialticket Deutschlandticket (${erwachsene} Erw.)`,
          `Welfare Deutschlandticket (${erwachsene} adult${erwachsene === 1 ? "" : "s"})`,
        ),
        wertMonat: oepnvErsparnis * erwachsene,
        hinweis: T(
          "Deutschlandticket für Bürgergeld-Empfänger ~31,50 €/Monat (statt 58 €). Programme je nach Kommune: Sozialticket, Sozialpass, Stadtpass, …",
          "Deutschlandticket for Bürgergeld recipients ~31.50 €/month (instead of 58 €). Programmes differ by municipality: welfare ticket, welfare pass, city pass, …",
        ),
      },
      {
        label: T("Telefon-Sozialtarif", "Phone welfare rate"),
        wertMonat: null,
        hinweis: T(
          "Telekom Sozialtarif (§ 45n TKG): Ermäßigung auf Grundgebühr und Einheiten. Bis ~8,72 € Erstattung/Monat möglich.",
          "Telekom welfare rate (§ 45n TKG): reduction on base fee and units. Up to ~8.72 €/month reimbursement possible.",
        ),
        paragraf: "§ 45n TKG",
        overlayId: OVERLAY_ID.TELEFON_SOZIALTARIF,
      },
      {
        label: T(
          "Schwimmbad / Museum / Zoo / VHS lokal ermäßigt",
          "Swimming pool / museum / zoo / adult education locally discounted",
        ),
        wertMonat: null,
        hinweis: T(
          "Lokaler Sozialpass; Umfang variiert stark je Kommune.",
          "Local welfare pass; scope varies widely by municipality.",
        ),
        overlayId: OVERLAY_ID.SCHWIMMBAD_MUSEUM,
      },
      {
        label: T(
          "Weihnachts-/Härtefallbeihilfen (kommunal)",
          "Christmas / hardship allowances (municipal)",
        ),
        wertMonat: null,
        hinweis: T(
          "Kommunale Sozialämter, Wohlfahrtsverbände (Diakonie, Caritas, AWO) und Stiftungen zahlen auf Antrag einmalige Beihilfen; typisch 30-100 €/Person/Jahr.",
          "Municipal welfare offices, welfare associations (Diakonie, Caritas, AWO) and foundations pay one-off allowances on request; typically 30-100 €/person/year.",
        ),
        paragraf: T(
          "kommunal, § 21 Abs. 6 SGB II (analog)",
          "municipal, § 21(6) SGB II (analogous)",
        ),
        overlayId: OVERLAY_ID.WEIHNACHTSBEIHILFE,
      },
    ],
  };
}

function kategorieRentenversicherung(): AnspruchsKategorie {
  const verlust = BUERGERGELD_RV_RENTENVERLUST_PRO_JAHR_BEZUG;

  return {
    titel: T("Rentenversicherung", "Pension insurance"),
    untertitel: T("Nachteil: keine Beitragszahlung", "Disadvantage: no contributions paid"),
    summeMonat: null,
    ton: "minus",
    items: [
      {
        label: T(
          "Keine RV-Beiträge durch Jobcenter (seit 01.01.2011)",
          "No pension contributions by jobcenter (since 01 Jan 2011)",
        ),
        wertMonat: null,
        hinweis: T(
          "Bis 2010 zahlte das Jobcenter einen Mindestbeitrag für ALG-II-Empfänger. Seit Haushaltsbegleitgesetz 2011 entfallen; Bezugsmonate gelten nur noch als Anrechnungszeit ohne Entgeltpunkte.",
          "Until 2010 the jobcenter paid a minimum contribution for ALG II recipients. Abolished with the 2011 budget act; benefit months now count only as credited periods without earnings points.",
        ),
        paragraf: "§ 58 SGB VI",
      },
      {
        label: T(
          "Geschätzte spätere Rentenlücke",
          "Estimated future pension gap",
        ),
        wertMonat: null,
        hinweis: T(
          `Pro Bezugsjahr ca. ${verlust} € weniger spätere Monatsrente (Referenz: Durchschnittsverdienst). Bei langen Bezugsphasen signifikanter Altersarmut-Treiber.`,
          `Per year on benefits approx. ${verlust} € less in future monthly pension (reference: average earnings). Over long periods a significant driver of old-age poverty.`,
        ),
      },
      {
        label: T(
          "Freiwillige RV-Beiträge möglich",
          "Voluntary pension contributions possible",
        ),
        wertMonat: null,
        hinweis: T(
          "Selbstzahler-Beiträge sind weiterhin zulässig, werden aber nicht aus dem Regelbedarf finanziert; praktisch selten umsetzbar.",
          "Self-paid contributions remain permitted, but are not financed from the standard need; rarely practical.",
        ),
        paragraf: "§ 7 SGB VI",
      },
    ],
  };
}
