/**
 * Zentraler Konstantenkatalog Rechtsstand 2026.
 * Alle Quellen als URL-Kommentar. Änderungen ausschließlich hier.
 */

// Bürgergeld-Regelbedarfe (§ 20 SGB II, Regelbedarfe-Fortschreibungsverordnung 2026 — Nullrunde)
// https://www.bundesregierung.de/breg-de/aktuelles/nullrunde-buergergeld-2383676
// https://www.publikationen-bundesregierung.de/pp-de/publikationssuche/regelbedarfe-zum-01-01-2026-2384092
export const REGELBEDARF_2026_EUR_MONAT = {
  alleinstehend: 563,
  partner: 506,
  erwachsenerU25ImHaushalt: 451,
  jugendlicher14Bis17: 471,
  kind6Bis13: 390,
  kind0Bis5: 357,
} as const;

// Regelbedarfs-Abteilungen RBS 1 laut Regelbedarfs-Ermittlungsgesetz (RBEG §5/§6).
// Anteile gelten rechnerisch, Leistungsempfänger darf frei darüber verfügen.
// Summe 563 € Alleinstehender = 100 %. Stand 2024, bis 2026 unverändert (Nullrunde).
// https://www.gesetze-im-internet.de/rbeg_2021/
export const REGELBEDARF_ABTEILUNGEN_RBS1_2026 = {
  nahrungsmittelGetraenke: 195.37,
  bekleidungSchuhe: 43.36,
  wohnenEnergieInstandhaltung: 44.16, // NICHT Miete — nur Strom + Haushaltsführung.
  innenausstattung: 33.79,
  gesundheitspflege: 21.45,
  verkehr: 50.19, // NICHT ÖPNV-Abo — separat über BT bzw. Sozialticket.
  nachrichtenInternet: 46.78,
  freizeitKultur: 49.02,
  bildung: 1.96,
  gaststaetten: 13.7,
  sonstigeWarenDienstleistungen: 41.34,
  beherbergung: 23.88,
} as const;

// Krankenversicherung Bürgergeld-Empfänger: Pflichtversichert in GKV (§ 5 Abs. 1 Nr. 2a
// SGB V); Beiträge werden vom Jobcenter pauschal an die Krankenkasse gezahlt
// (§ 251 Abs. 4 SGB V iVm § 246 SGB V). Berechnung: Mindestbemessung nach § 232a Abs. 1
// SGB V = Regelsatz + pauschalierte Bedarfe; daraus ergibt sich ein Monatsbeitrag von
// ca. 119 € GKV + 14 € PV (je nach Kinderzahl/Alter leicht variierend).
// https://www.gesetze-im-internet.de/sgb_5/__251.html
// Quelle Wert: BMAS Haushalt 2025, Schätzung 2026 fortgeschrieben.
export const BUERGERGELD_KV_PV_PAUSCHALE_2026 = {
  krankenversicherungMonat: 119,
  pflegeversicherungMonat: 14,
} as const;

// Rentenversicherung Bürgergeld-Empfänger: Seit 01.01.2011 KEINE Beitragszahlung durch
// Jobcenter mehr (§ 3 Satz 1 Nr. 3 SGB VI aufgehoben durch Haushaltsbegleitgesetz 2011).
// Bezugsmonate gelten nur noch als "Anrechnungszeit" (§ 58 SGB VI), ohne Entgeltpunkte.
// Praktischer Effekt: Rentenanwartschaft wächst nicht — reale Rentenlücke pro Bezugsjahr
// ca. 35-40 € spätere Monatsrente (bei Durchschnittsverdienst-Referenz).
// https://www.gesetze-im-internet.de/sgb_6/__58.html
export const BUERGERGELD_RV_BEITRAG_2026 = 0;
export const BUERGERGELD_RV_RENTENVERLUST_PRO_JAHR_BEZUG = 37;

// Mehrbedarf Alleinerziehend (§ 21 Abs. 3 SGB II): 36% RBS1 oder 12%/Kind, gedeckelt 60%
export const MEHRBEDARF_ALLEINERZIEHEND = {
  prozentRbs1Basis: 0.36,
  prozentProKind: 0.12,
  prozentDeckel: 0.6,
} as const;

// Bildungs- und Teilhabepaket — Einzelposten 2026 (§ 28 SGB II)
// https://www.bmas.de/DE/Arbeit/Grundsicherung-Buergergeld/Bildungspaket/Leistungen/leistungen-bildungspaket_art.html
// https://www.buergergeld.org/bildungspaket/
export const BUT_2026 = {
  // § 28 Abs. 3 — Schulbedarfspauschale, 130 € zum 01.08. + 65 € zum 01.02.
  schulbedarfEurJahr: 195,
  // § 28 Abs. 7 — Teilhabe am sozialen/kulturellen Leben bis 18 J.
  teilhabeEurMonat: 15,
  // § 28 Abs. 6 — Eigenanteil Mittagessen Kita/Schule/Hort voll übernommen.
  //   Schätzung: 3,50 € × 20 Tage ≈ 70 €/Monat. Nur Kinder in Betreuung (ab ca. 3 J.).
  mittagessenEurMonat: 70,
  mittagessenMinAlter: 3,
  // § 28 Abs. 2 — Klassenfahrten + ein-/mehrtägige Schulausflüge, tatsächliche Kosten.
  //   Modellierung als Jahrespauschale ab Schulalter (6+).
  klassenfahrtSchulausflugEurJahr: 250,
  klassenfahrtMinAlter: 6,
} as const;

// Mehrbedarf Warmwasser § 21 Abs. 7 SGB II — prozentualer Aufschlag je Regelbedarfsstufe
// https://www.buergergeld.org/sgb-ii/mehrbedarf-warmwasser/
export const MEHRBEDARF_WARMWASSER_PCT = {
  rbs1: 0.023,
  rbs2: 0.023,
  rbs3: 0.023,
  rbs4: 0.014, // Jugendliche 14-17
  rbs5: 0.012, // Kinder 6-13
  rbs6: 0.008, // Kinder 0-5
} as const;

// Mehrbedarf Schwangerschaft § 21 Abs. 2 SGB II — 17 % der maßgeblichen Regelbedarfsstufe
// https://www.gesetze-im-internet.de/sgb_2/__21.html
export const MEHRBEDARF_SCHWANGERSCHAFT_PCT = 0.17;

// Wohnflächen-Tabelle WBS/VV-Wohnraumförderung — bundesweit einheitlich.
const WOHNFLAECHE_QM = [50, 60, 75, 87, 99] as const;
const AUFSCHLAG_JE_WEITERE_PERSON_QM = 12;
// Bundesheizkostenspiegel 2024/2025 — Durchschnitt Mehrfamilienhäuser, Gas/Öl/Wärme.
// https://www.heizspiegel.de/heizkosten-berechnen/
const HEIZKOSTEN_EUR_PRO_QM_MONAT = 1.6;

export type Wohnlage = "A" | "B" | "C" | "D";

/**
 * Wohnlage-Katalog 2026 — bundesweite Systematik in 4 Klassen.
 *
 * METHODIK:
 * Beide Seiten des Vergleichs (angemessene KdU nach § 22 SGB II *und* Marktmiete bei
 * Neuvermietung) werden gleichzeitig pro Wohnlage skaliert. Dadurch bleibt der Vergleich
 * methodisch neutral — wer teurer wohnt, zahlt auf der Arbeitsseite mehr, bekommt aber
 * auf der Bürgergeldseite auch mehr KdU-Übernahme. Kein systematischer Bias.
 *
 * DATENBASIS:
 * - Räumliche Struktur: BBSR-Wohnungsmarktregionen / Stadt-Land-Regionen.
 * - KdU-Werte: veröffentlichte lokale Richtwerte ausgewählter Kommunen je Klasse;
 *   die konkret benutzten Beispielquellen sind im öffentlichen Quellenanhang der UI genannt.
 * - Marktmieten: offen gelegte editoriale Repräsentativwerte je Klasse, orientiert an
 *   BBSR-Marktberichten; keine amtlichen Mietspiegelwerte.
 *
 * VEREINFACHUNGEN:
 * - Innerhalb einer Klasse bestehen reale Spreizungen (München > Frankfurt > Stuttgart
 *   bei Klasse A). Die Werte sind Repräsentanten, keine exakten Kommunen-Werte.
 * - Heizkosten werden bundesweit einheitlich (Bundesheizkostenspiegel) angesetzt.
 * - § 22a SGB II (Satzungsermächtigung) + lokale Richtlinien variieren stark — Nutzer
 *   können ihre tatsächliche Warmmiete im Formular überschreiben.
 */
export const WOHNLAGEN_2026: Record<
  Wohnlage,
  {
    label: string;
    beispiele: string;
    bruttokaltmieteEurMonat: readonly [number, number, number, number, number];
    aufschlagJeWeiterePersonEur: number;
    nettokaltEurProQmMonat: number;
    nebenkostenEurProQmMonat: number;
    wohnflaecheQm: readonly [number, number, number, number, number];
    aufschlagJeWeiterePersonQm: number;
    heizkostenEurProQmMonat: number;
  }
> = {
  A: {
    label: "A — Top-Ballungsraum",
    beispiele: "Frankfurt, München, Hamburg-Mitte, Düsseldorf, Stuttgart",
    bruttokaltmieteEurMonat: [786, 903, 1078, 1219, 1360],
    aufschlagJeWeiterePersonEur: 141,
    nettokaltEurProQmMonat: 15.0,
    nebenkostenEurProQmMonat: 3.0,
    wohnflaecheQm: WOHNFLAECHE_QM,
    aufschlagJeWeiterePersonQm: AUFSCHLAG_JE_WEITERE_PERSON_QM,
    heizkostenEurProQmMonat: HEIZKOSTEN_EUR_PRO_QM_MONAT,
  },
  B: {
    label: "B — Großstadt",
    beispiele: "Berlin, Köln, Hannover, Bonn, Wiesbaden, Mainz",
    bruttokaltmieteEurMonat: [650, 745, 890, 1005, 1120],
    aufschlagJeWeiterePersonEur: 115,
    nettokaltEurProQmMonat: 11.0,
    nebenkostenEurProQmMonat: 2.8,
    wohnflaecheQm: WOHNFLAECHE_QM,
    aufschlagJeWeiterePersonQm: AUFSCHLAG_JE_WEITERE_PERSON_QM,
    heizkostenEurProQmMonat: HEIZKOSTEN_EUR_PRO_QM_MONAT,
  },
  C: {
    label: "C — Mittelstadt / prosperierendes Umland",
    beispiele: "Leipzig, Dresden, Nürnberg, Kassel, Erfurt, Speckgürtel",
    bruttokaltmieteEurMonat: [490, 565, 675, 760, 850],
    aufschlagJeWeiterePersonEur: 90,
    nettokaltEurProQmMonat: 8.5,
    nebenkostenEurProQmMonat: 2.5,
    wohnflaecheQm: WOHNFLAECHE_QM,
    aufschlagJeWeiterePersonQm: AUFSCHLAG_JE_WEITERE_PERSON_QM,
    heizkostenEurProQmMonat: HEIZKOSTEN_EUR_PRO_QM_MONAT,
  },
  D: {
    label: "D — Ländlich / strukturschwach",
    beispiele: "Ostvorpommern, Görlitz, Eifelkreis, Uckermark",
    bruttokaltmieteEurMonat: [380, 440, 525, 595, 665],
    aufschlagJeWeiterePersonEur: 70,
    nettokaltEurProQmMonat: 6.0,
    nebenkostenEurProQmMonat: 2.2,
    wohnflaecheQm: WOHNFLAECHE_QM,
    aufschlagJeWeiterePersonQm: AUFSCHLAG_JE_WEITERE_PERSON_QM,
    heizkostenEurProQmMonat: HEIZKOSTEN_EUR_PRO_QM_MONAT,
  },
};

// Kindergeld 2026 — 259 €/Kind/Monat
// https://www.familienkasse-info.de/news/kindergeld-und-elterngeld/mehr-geld-fuer-familien-2026-kindergeld-und-kinderfreibetrag-steigen-erneut-1615/
export const KINDERGELD_EUR_MONAT = 259;

// Einkommensteuer-Tarif 2026 (§ 32a EStG)
// https://www.gesetze-im-internet.de/estg/__32a.html
// https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2026.html
export const EST_TARIF_2026 = {
  grundfreibetrag: 12348,
  zone2Ende: 17799,
  zone3Ende: 69878,
  zone4Ende: 277825,
  zone2: { faktorY2: 914.51, faktorY: 1400 },
  zone3: { faktorZ2: 173.1, faktorZ: 2397, konstant: 1034.87 },
  zone4: { faktor: 0.42, abzug: 11135.63 },
  zone5: { faktor: 0.45, abzug: 19470.38 },
} as const;

// Soli 2026 — Freigrenze auf ESt (Einzelveranlagung)
// https://www.tk.de/firmenkunden/service/fachthemen/fachthema-beitraege/solidaritaetszuschlag-2075802
export const SOLI_2026 = {
  freigrenzeEstEinzeln: 20350,
  satz: 0.055,
  milderungsFaktor: 0.119,
} as const;

// Kinderfreibeträge 2026 (pro Kind, beide Eltern zusammen)
export const KINDERFREIBETRAG_2026 = {
  saechlichesExistenzminimum: 6828,
  bea: 2928,
} as const;

// Sozialversicherung 2026 — Rechengrößen
// https://www.gkv-spitzenverband.de/media/dokumente/presse/zahlen_und_grafiken/20260101_Faktenblatt_Rechengroessen_Beitragsrecht.pdf
//
// Modellierung als sozialversicherungspflichtig Angestellte:
// Arbeitnehmer und Arbeitgeber tragen paritätisch (je 50 %) die Sätze von GKV, PV, RV, AV.
// Der PV-Kinderlos-Zuschlag (ab 23 J.) und der PV-Kinderabschlag (ab 2. Kind) betreffen
// nur den Arbeitnehmeranteil. Zusatzbeitrag GKV ebenfalls paritätisch seit 2019 (§ 249 SGB V).
export const SV_2026 = {
  bbgGkvPvMonat: 5812.5,
  bbgRvAlvMonat: 8450,
  bezugsgroesseWestMonat: 3955,
  gkvSatzAllgemein: 0.146,
  gkvZusatzbeitragDurchschnitt: 0.029,
  pvSatzMitKind: 0.036,
  pvZuschlagKinderlos: 0.006,
  pvAbschlagProKindAb2: 0.0025,
  pvMinKinderrabattStufe: 2,
  pvMaxKinderrabattStufe: 5,
  rvSatz: 0.186,
  avSatz: 0.026,
} as const;

// Wohngeld 2026 — Mietenstufe Frankfurt: VII, Höchstbeträge § 12 WoGG Anlage 1 (Grundbetrag)
// https://www.gesetze-im-internet.de/wogg/anlage_1.html
export const WOHNGELD_HOECHSTBETRAG_STUFE_VII = {
  stufe1Person: 677,
  stufe2Person: 820,
  stufe3Person: 975,
  stufe4Person: 1139,
  stufe5Person: 1302,
  jeWeiterePerson: 163,
} as const;

// Kinderzuschlag 2026 (§ 6a BKGG)
// https://www.gesetze-im-internet.de/bkgg_1996/__6a.html
export const KINDERZUSCHLAG_2026 = {
  hoechstbetragEurMonat: 297,
  mindesteinkommenPaarMonat: 900,
  mindesteinkommenAlleinerziehendMonat: 600,
  anrechnungUeberBedarfsgrenze: 0.45,
} as const;

// [Alt] Marktmiete Frankfurt-only: durch WOHNLAGEN_2026["A"] abgelöst.

// Rundfunkbeitrag 2026 — § 10 RBStV; Befreiung bei Bürgergeld auf Antrag, § 4 Abs. 1 RBStV.
// https://www.buerger-geld.org/news/finanzen/rundfunkbeitrag-2026-wer-wie-viel-zahlen-muss-und-wer-sich-von-der-gez-befreien-lassen-kann/
export const RUNDFUNKBEITRAG_EUR_MONAT = 18.36;

// ÖPNV 2026 — Deutschlandticket regulär bzw. ermäßigt für Bürgergeld-Empfänger.
// Ermäßigungsprogramme unter verschiedenen Namen: Sozialticket, Sozialpass,
// Stadtpass etc. Das ermäßigte DT liegt bundesweit
// typisch bei 29–32 €/Monat; wir setzen 31,50 € als Näherung an.
//
// Ländliche Regionen (Kategorie D) haben oft kein Sozialticket und auch weniger ÖPNV-
// Nutzung — das wird über das Formularfeld "Anzahl Nutzer" abgefangen.
export const OEPNV_2026 = {
  deutschlandticketErmaessigtEurMonat: 31.5,
  deutschlandticketRegulaerEurMonat: 58,
  // Weitere geldwerte Vorteile (Zoo, Schwimmbad, Museum, VHS) — Schätzung je
  // erwachsene Person/Jahr. In A/B-Wohnlagen besser ausgebaut als in D.
  sonstigeVorteileEurJahrProErwachsenenAB: 100,
  sonstigeVorteileEurJahrProErwachsenenCD: 50,
} as const;
