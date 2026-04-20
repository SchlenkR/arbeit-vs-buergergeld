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

export interface AnspruchPosten {
  label: string;
  wertMonat: number | null; // null = qualitativ, keine Zahl
  hinweis?: string;
  paragraf?: string;
}

export interface AnspruchsKategorie {
  titel: string;
  untertitel: string;
  summeMonat: number | null;
  items: AnspruchPosten[];
  kennzahlen?: string[]; // z.B. "87 qm · 4 Zimmer"
  ton?: "positiv" | "neutral" | "minus";
}

export interface Anspruchsuebersicht {
  haushalt: Haushalt;
  personen: number;
  erwachsene: number;
  kategorien: AnspruchsKategorie[];
}

/**
 * Baut eine strukturierte Übersicht aller Ansprüche eines Bürgergeld-berechtigten
 * Haushalts, explizit sichtbar pro Lebensbereich. Ergänzt die Cashflow-Rechnung um
 * qualitative Ansprüche (Wohnungsgröße, KV-Pflichtversicherung, Einmalleistungen).
 *
 * Optional: `antragsItems` überdeckt qualitative "auf Antrag"-Zeilen (wertMonat: null)
 * mit konkreten €-Werten aus dem aktiven Antrags-Preset. Nicht überdeckte Positionen
 * bleiben als "auf Antrag" sichtbar.
 */
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
    if (it.ersetztAnspruch) m.set(it.ersetztAnspruch, it);
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
    const hit = overlay.get(it.label);
    if (!hit || it.wertMonat !== null) return it;
    touched = true;
    return {
      label: it.label,
      wertMonat: hit.eurMonat,
      hinweis: `Annahme aus aktivem Antrags-Szenario: ${hit.quelle}`,
      paragraf: hit.paragraf,
    };
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
    titel: "Wohnung",
    untertitel: "Kosten der Unterkunft § 22 SGB II",
    summeMonat: gesamtKdu,
    kennzahlen: [
      `${qm} m² Wohnfläche`,
      `~ ${zimmer} Zimmer`,
      `Wohnlage ${haushalt.wohnlage}`,
    ],
    ton: "positiv",
    items: [
      {
        label: "Angemessene Bruttokaltmiete",
        wertMonat: bruttokalt,
        hinweis: "Wird 1:1 übernommen bis zur regionalen Angemessenheitsgrenze.",
        paragraf: "§ 22 Abs. 1 SGB II",
      },
      {
        label: "Heizkosten (tatsächlich, in angemessener Höhe)",
        wertMonat: Math.round(heizkosten),
        hinweis: `Ansatz: ${w.heizkostenEurProQmMonat.toFixed(2).replace(".", ",")} €/m² (Bundesheizkostenspiegel).`,
        paragraf: "§ 22 Abs. 1 Satz 3 SGB II",
      },
      {
        label: "Nebenkostennachzahlungen",
        wertMonat: null,
        hinweis: "Werden im Monat der Fälligkeit als einmaliger Bedarf zusätzlich übernommen.",
        paragraf: "§ 22 Abs. 1 Satz 4 SGB II",
      },
      {
        label: "Mietkaution bei Umzug",
        wertMonat: null,
        hinweis: "Auf Antrag als Darlehen (zinslos), verrechnet mit künftigen Regelbedarfen.",
        paragraf: "§ 22 Abs. 6 SGB II",
      },
      {
        label: "Umzugskosten bei Wohnungswechsel",
        wertMonat: null,
        hinweis:
          "Spedition, Kartons, Helfer — tatsächliche Kosten werden übernommen, wenn Umzug notwendig ist.",
        paragraf: "§ 22 Abs. 6 SGB II",
      },
      {
        label: "Einzugs- und Schönheitsreparaturen",
        wertMonat: null,
        hinweis:
          "Renovierung bei Einzug und Auszug (Streichen, Tapezieren), sofern mietvertraglich geschuldet.",
        paragraf: "§ 22 Abs. 6 SGB II",
      },
    ],
  };
}

function kategorieRegelbedarf(haushalt: Haushalt, erwachsene: number): AnspruchsKategorie {
  const items: AnspruchPosten[] = [];
  const a = REGELBEDARF_ABTEILUNGEN_RBS1_2026;

  if (erwachsene === 1) {
    items.push({
      label: "Erwachsene/r (Regelbedarfsstufe 1)",
      wertMonat: REGELBEDARF_2026_EUR_MONAT.alleinstehend,
      paragraf: "§ 20 Abs. 2 SGB II",
    });
  } else {
    items.push({
      label: "2 Partner (Regelbedarfsstufe 2, je 506 €)",
      wertMonat: REGELBEDARF_2026_EUR_MONAT.partner * 2,
      paragraf: "§ 20 Abs. 4 SGB II",
    });
  }

  for (const kind of haushalt.kinder) {
    if (kind.alter >= 14) {
      items.push({
        label: `Jugendliche/r ${kind.alter} J. (RBS 4)`,
        wertMonat: REGELBEDARF_2026_EUR_MONAT.jugendlicher14Bis17,
        paragraf: "§ 23 Nr. 1 SGB II",
      });
    } else if (kind.alter >= 6) {
      items.push({
        label: `Kind ${kind.alter} J. (RBS 5)`,
        wertMonat: REGELBEDARF_2026_EUR_MONAT.kind6Bis13,
        paragraf: "§ 23 Nr. 2 SGB II",
      });
    } else {
      items.push({
        label: `Kind ${kind.alter} J. (RBS 6)`,
        wertMonat: REGELBEDARF_2026_EUR_MONAT.kind0Bis5,
        paragraf: "§ 23 Nr. 3 SGB II",
      });
    }
  }

  const summe = items.reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: "Regelbedarf (frei verfügbar)",
    untertitel: "Deckt Ernährung, Kleidung, Strom, Freizeit",
    summeMonat: summe,
    ton: "positiv",
    items,
    kennzahlen: [
      `Essen ~${Math.round(a.nahrungsmittelGetraenke)}€`,
      `Kleidung ~${Math.round(a.bekleidungSchuhe)}€`,
      `Strom ~${Math.round(a.wohnenEnergieInstandhaltung)}€`,
      `Freizeit ~${Math.round(a.freizeitKultur)}€`,
      `Telefon/Internet ~${Math.round(a.nachrichtenInternet)}€`,
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
    titel: "Krankenversicherung",
    untertitel: "Pflichtversicherung in der GKV",
    summeMonat: kv + pv,
    ton: "positiv",
    kennzahlen: [
      "volle GKV-Leistungen",
      "Familienversicherung Kinder",
      "keine Eigenbeiträge",
    ],
    items: [
      {
        label: "Krankenversicherung (GKV) — Beiträge vom Jobcenter",
        wertMonat: kv,
        hinweis:
          "Pflichtversicherung, Jobcenter zahlt pauschalen Monatsbeitrag direkt an die Krankenkasse. Für den Haushalt keine Eigenleistung.",
        paragraf: "§ 5 Abs. 1 Nr. 2a SGB V iVm § 251 Abs. 4 SGB V",
      },
      {
        label: "Pflegeversicherung (PV) — Beiträge vom Jobcenter",
        wertMonat: pv,
        hinweis: "Analog zur GKV, Beitrag je Erwachsenem. Kinder über Familienversicherung.",
        paragraf: "§ 20 Abs. 1 Nr. 2a SGB XI",
      },
      {
        label: "Zuzahlungsbefreiung",
        wertMonat: null,
        hinweis:
          "Belastungsgrenze für Medikamente/Behandlungen: 2 % des Jahresregelsatzes (bzw. 1 % bei chronisch Kranken). Danach vollständig zuzahlungsfrei.",
        paragraf: "§ 62 SGB V",
      },
    ],
  };
}

function kategorieMehrbedarfe(haushalt: Haushalt): AnspruchsKategorie {
  const items: AnspruchPosten[] = [];
  const rbs1 = REGELBEDARF_2026_EUR_MONAT.alleinstehend;

  // Alleinerziehend
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
      label: `Alleinerziehend (${(pct * 100).toFixed(0)} % RBS 1)`,
      wertMonat: rbs1 * pct,
      paragraf: "§ 21 Abs. 3 SGB II",
    });
  } else {
    items.push({
      label: "Alleinerziehend",
      wertMonat: null,
      hinweis: "Trifft nicht zu (Voraussetzung: alleinerziehend mit Kind im Haushalt).",
      paragraf: "§ 21 Abs. 3 SGB II",
    });
  }

  // Warmwasser dezentral
  if (haushalt.warmwasserDezentral) {
    items.push({
      label: "Dezentrale Warmwasserbereitung",
      wertMonat: null,
      hinweis: `2,3 % RBS 1 für Erwachsene, 0,8–1,4 % für Kinder je nach Alter. Aktiv.`,
      paragraf: "§ 21 Abs. 7 SGB II",
    });
  } else {
    items.push({
      label: "Dezentrale Warmwasserbereitung",
      wertMonat: null,
      hinweis: "Nur bei Boiler/Durchlauferhitzer — hier nicht aktiviert.",
      paragraf: "§ 21 Abs. 7 SGB II",
    });
  }

  // Schwangerschaft
  if (haushalt.schwangerschaftAb13SSW) {
    items.push({
      label: "Schwangerschaft ab 13. SSW (17 % RBS 1)",
      wertMonat: rbs1 * MEHRBEDARF_SCHWANGERSCHAFT_PCT,
      paragraf: "§ 21 Abs. 2 SGB II",
    });
  }

  items.push({
    label: "Behinderung / Erwerbsminderung",
    wertMonat: null,
    hinweis:
      "35 % RBS 1 bei Teilhabe-Bezug (§ 21 Abs. 4). 17 % bei Gehbehinderung mit Merkzeichen G. Hier nicht modelliert.",
    paragraf: "§ 21 Abs. 4 SGB II",
  });
  items.push({
    label: "Kostenaufwändige Ernährung (ärztlich)",
    wertMonat: null,
    hinweis:
      "Bei Zöliakie, Niereninsuffizienz u.ä. — nach Empfehlungen des Deutschen Vereins, ärztliches Attest nötig. Nicht modelliert.",
    paragraf: "§ 21 Abs. 5 SGB II",
  });

  const summe = items
    .filter((i) => i.wertMonat !== null)
    .reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: "Mehrbedarfe",
    untertitel: "Zusätzliche Bedarfe in Sonderlagen",
    summeMonat: summe > 0 ? summe : null,
    ton: summe > 0 ? "positiv" : "neutral",
    items,
  };
}

function kategorieBildungTeilhabe(haushalt: Haushalt): AnspruchsKategorie {
  if (haushalt.kinder.length === 0) {
    return {
      titel: "Bildung & Teilhabe",
      untertitel: "§ 28 SGB II — nur bei Kindern",
      summeMonat: null,
      ton: "neutral",
      items: [
        {
          label: "Nicht anwendbar",
          wertMonat: null,
          hinweis: "Kein Kind im Haushalt.",
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
      label: `Schulbedarfspauschale (${schulKinder} Kind${schulKinder === 1 ? "" : "er"})`,
      wertMonat: (schulKinder * BUT_2026.schulbedarfEurJahr) / 12,
      hinweis: `${BUT_2026.schulbedarfEurJahr} €/Jahr — 130 € zum 1.8. + 65 € zum 1.2.`,
      paragraf: "§ 28 Abs. 3 SGB II",
    });
  }
  if (teilhabeKinder > 0) {
    items.push({
      label: `Teilhabe Freizeit/Verein/Kultur (${teilhabeKinder})`,
      wertMonat: teilhabeKinder * BUT_2026.teilhabeEurMonat,
      hinweis: "Z.B. Sportverein, Musikschule, Kulturangebote.",
      paragraf: "§ 28 Abs. 7 SGB II",
    });
  }
  if (mittagessenKinder > 0) {
    items.push({
      label: `Mittagessen Kita/Schule (${mittagessenKinder})`,
      wertMonat: mittagessenKinder * BUT_2026.mittagessenEurMonat,
      hinweis: "Eigenanteil am Mittagessen wird in voller Höhe übernommen.",
      paragraf: "§ 28 Abs. 6 SGB II",
    });
  }
  if (klassenfahrtKinder > 0) {
    items.push({
      label: `Klassenfahrt/Schulausflüge (${klassenfahrtKinder})`,
      wertMonat: (klassenfahrtKinder * BUT_2026.klassenfahrtSchulausflugEurJahr) / 12,
      hinweis: "Tatsächliche Kosten — Schätzung 250 €/Jahr/Schulkind.",
      paragraf: "§ 28 Abs. 2 SGB II",
    });
  }
  items.push({
    label: "Schüler-Beförderung",
    wertMonat: null,
    hinweis: "Tatsächliche Schülerticket-Kosten, sofern nötig und nicht anderweitig abgedeckt.",
    paragraf: "§ 28 Abs. 4 SGB II",
  });
  items.push({
    label: "Lernförderung / Nachhilfe",
    wertMonat: null,
    hinweis:
      "Nach Bedarf bei Lernzielgefährdung. Kein Pauschalbetrag — Antrag auf konkrete Lernförderung.",
    paragraf: "§ 28 Abs. 5 SGB II",
  });
  const kinderU3 = haushalt.kinder.filter((k) => k.alter < 3).length;
  if (kinderU3 > 0) {
    items.push({
      label: "Kita-Gebührenbefreiung (U3)",
      wertMonat: null,
      hinweis:
        "In den meisten Kommunen: volle Erstattung der Kita-Gebühren für U3-Kinder bei BG-Bezug. Beantragung beim Jugendamt.",
      paragraf: "§ 90 SGB VIII",
    });
  }

  const summe = items.reduce((s, i) => s + (i.wertMonat ?? 0), 0);

  return {
    titel: "Bildung & Teilhabe",
    untertitel: "§ 28 SGB II — pro Kind",
    summeMonat: summe,
    ton: "positiv",
    items,
  };
}

function kategorieEinmalleistungen(): AnspruchsKategorie {
  return {
    titel: "Einmalleistungen",
    untertitel: "§ 24 SGB II — bei Bedarf",
    summeMonat: null,
    ton: "neutral",
    kennzahlen: ["auf Antrag", "ohne Anrechnung Regelbedarf"],
    items: [
      {
        label: "Erstausstattung Wohnung (Möbel, Haushaltsgeräte)",
        wertMonat: null,
        hinweis:
          "Bei Erstbezug, nach Haft/Klinik, nach Trennung mit Umzug. Pauschalen variieren je Kommune — typisch 800–2.500 € je nach Haushaltsgröße.",
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
      },
      {
        label: "Erstausstattung Bekleidung — Schwangerschaft/Geburt",
        wertMonat: null,
        hinweis: "Kinderwagen, Baby-Ausstattung, Umstandsmode. Pauschale kommunal verschieden.",
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
      },
      {
        label: "Orthopädische Schuhe, Reparaturen therapeutischer Geräte",
        wertMonat: null,
        hinweis: "Tatsächliche Kosten, soweit nicht von Krankenkasse übernommen.",
        paragraf: "§ 24 Abs. 3 Nr. 3 SGB II",
      },
      {
        label: "Weiße Ware (Waschmaschine, Kühlschrank) bei Defekt",
        wertMonat: null,
        hinweis: "Als Darlehen, wird mit künftigen Regelbedarfen verrechnet (max. 10 %).",
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
    titel: "Geldwerte Vorteile",
    untertitel: "Kostenersparnisse außerhalb der Auszahlung",
    summeMonat: rundfunk + oepnvErsparnis * erwachsene,
    ton: "positiv",
    items: [
      {
        label: "Rundfunkbeitrag-Befreiung",
        wertMonat: rundfunk,
        hinweis: "Auf Antrag beim ARD ZDF Deutschlandradio Beitragsservice.",
        paragraf: "§ 4 Abs. 1 Nr. 3 RBStV",
      },
      {
        label: `Sozialticket Deutschlandticket (${erwachsene} Erw.)`,
        wertMonat: oepnvErsparnis * erwachsene,
        hinweis:
          "Deutschlandticket für Bürgergeld-Empfänger ~31,50 €/Monat (statt 58 €). Programme je nach Kommune: Sozialticket, Sozialpass, Stadtpass, …",
      },
      {
        label: "Telefon-Sozialtarif",
        wertMonat: null,
        hinweis:
          "Telekom Sozialtarif (§ 45n TKG): Ermäßigung auf Grundgebühr und Einheiten. Bis ~8,72 € Erstattung/Monat möglich.",
        paragraf: "§ 45n TKG",
      },
      {
        label: "Schwimmbad / Museum / Zoo / VHS lokal ermäßigt",
        wertMonat: null,
        hinweis: "Lokaler Sozialpass — Umfang variiert stark je Kommune.",
      },
      {
        label: "Weihnachts-/Härtefallbeihilfen (kommunal)",
        wertMonat: null,
        hinweis:
          "Kommunale Sozialämter, Wohlfahrtsverbände (Diakonie, Caritas, AWO) und Stiftungen zahlen auf Antrag einmalige Beihilfen — typisch 30–100 €/Person/Jahr.",
        paragraf: "kommunal, § 21 Abs. 6 SGB II (analog)",
      },
    ],
  };
}

function kategorieRentenversicherung(): AnspruchsKategorie {
  const verlust = BUERGERGELD_RV_RENTENVERLUST_PRO_JAHR_BEZUG;

  return {
    titel: "Rentenversicherung",
    untertitel: "Nachteil: keine Beitragszahlung",
    summeMonat: null,
    ton: "minus",
    items: [
      {
        label: "Keine RV-Beiträge durch Jobcenter (seit 01.01.2011)",
        wertMonat: null,
        hinweis:
          "Bis 2010 zahlte das Jobcenter einen Mindestbeitrag für ALG-II-Empfänger. Seit Haushaltsbegleitgesetz 2011 entfallen — Bezugsmonate gelten nur noch als Anrechnungszeit ohne Entgeltpunkte.",
        paragraf: "§ 58 SGB VI",
      },
      {
        label: "Geschätzte spätere Rentenlücke",
        wertMonat: null,
        hinweis: `Pro Bezugsjahr ca. ${verlust} € weniger spätere Monatsrente (Referenz: Durchschnittsverdienst). Bei langen Bezugsphasen signifikanter Altersarmut-Treiber.`,
      },
      {
        label: "Freiwillige RV-Beiträge möglich",
        wertMonat: null,
        hinweis:
          "Selbstzahler-Beiträge sind weiterhin zulässig, werden aber nicht aus dem Regelbedarf finanziert — praktisch selten umsetzbar.",
        paragraf: "§ 7 SGB VI",
      },
    ],
  };
}

