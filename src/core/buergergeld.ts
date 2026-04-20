import {
  REGELBEDARF_2026_EUR_MONAT,
  MEHRBEDARF_ALLEINERZIEHEND,
  MEHRBEDARF_WARMWASSER_PCT,
  MEHRBEDARF_SCHWANGERSCHAFT_PCT,
  BUT_2026,
  WOHNLAGEN_2026,
  KINDERGELD_EUR_MONAT,
  RUNDFUNKBEITRAG_EUR_MONAT,
  OEPNV_2026,
} from "./constants2026";
import type {
  Haushalt,
  BuergergeldInput,
  BuergergeldErgebnis,
  EinkuenftePosten,
} from "./types";

/**
 * Bürgergeld-Bedarf 2026 für einen Haushalt nach gewählter Wohnlage.
 *
 * Modelliert:
 * - Regelbedarfe § 20 SGB II
 * - Mehrbedarfe § 21: Alleinerziehend (Abs. 3), Warmwasser dezentral (Abs. 7),
 *   Schwangerschaft ab 13. SSW (Abs. 2)
 * - KdU § 22 — angemessene Bruttokaltmiete + Heizkosten nach Wohnlage
 * - BuT § 28 im Detail: Schulbedarf, Teilhabe, Mittagessen, Klassenfahrt/Ausflug
 * - Kindergeldanrechnung § 11
 * - Geldwerte Vorteile: Rundfunkbeitrag-Befreiung (§ 4 RBStV), lokales Sozialticket /
 *   Sozialpass-ÖPNV + pauschale sonstige Vorteile (Zoo/Schwimmbad/Museum)
 *
 * Nicht modelliert: Einmalleistungen § 24 (Erstausstattung Wohnung, Baby, ortho. Schuhe),
 *   § 21 Abs. 4/5/6 (Behinderung, kostenaufwändige Ernährung, sonstige), Telekom-Sozialtarif,
 *   Unterhaltsvorschuss (i.d.R. voll angerechnet, netto 0), Elterngeld-Freibetrag.
 */
export function berechneBuergergeld2026(
  haushalt: Haushalt,
  input: BuergergeldInput = {
    schwarzarbeitEurMonat: 0,
    antragsLeistungenEurMonat: 0,
  },
): BuergergeldErgebnis {
  const regelbedarfDetail: EinkuenftePosten[] = [];
  const butDetail: EinkuenftePosten[] = [];
  const geldwerteVorteileDetail: EinkuenftePosten[] = [];

  // --- Regelbedarfe ---
  const erwachseneRB = berechneErwachsenenRegelbedarfMonat(haushalt, regelbedarfDetail);
  let kinderRegelbedarfMonat = 0;
  for (const kind of haushalt.kinder) {
    const rb = regelbedarfFuerKind(kind.alter);
    kinderRegelbedarfMonat += rb.betragMonat;
    regelbedarfDetail.push({ label: rb.label, betragJahr: rb.betragMonat * 12 });
  }
  const regelbedarfMonat = erwachseneRB + kinderRegelbedarfMonat;

  // --- Mehrbedarfe ---
  const mbAlleinerziehendMonat = berechneMehrbedarfAlleinerziehend(haushalt);
  const mbWarmwasserMonat = haushalt.warmwasserDezentral
    ? berechneMehrbedarfWarmwasser(haushalt)
    : 0;
  const schwangerschaftRegelbedarf =
    haushalt.typ === "paar" || haushalt.typ === "paar_verheiratet"
      ? REGELBEDARF_2026_EUR_MONAT.partner
      : REGELBEDARF_2026_EUR_MONAT.alleinstehend;
  const mbSchwangerschaftMonat = haushalt.schwangerschaftAb13SSW
    ? schwangerschaftRegelbedarf * MEHRBEDARF_SCHWANGERSCHAFT_PCT
    : 0;

  // --- KdU ---
  const angemesseneKduMonat = berechneKdU(haushalt);
  const mieteMonat = haushalt.warmmieteEurProMonat;
  const kduMonat = Math.min(angemesseneKduMonat, mieteMonat);

  // --- Bildung & Teilhabe im Detail ---
  let butMonat = 0;
  let butJahrEinmal = 0;
  for (const kind of haushalt.kinder) {
    // Teilhabe (§28 Abs. 7): bis 18 J.
    if (kind.alter < 18) {
      butMonat += BUT_2026.teilhabeEurMonat;
    }
    // Schulbedarf (§28 Abs. 3): Schüler ab 6 J.
    if (kind.alter >= 6 && kind.alter < 25) {
      butJahrEinmal += BUT_2026.schulbedarfEurJahr;
    }
    // Mittagessen (§28 Abs. 6): Kinder in Kita/Schule ab ~3 J.
    if (kind.alter >= BUT_2026.mittagessenMinAlter && kind.alter < 18) {
      butMonat += BUT_2026.mittagessenEurMonat;
    }
    // Klassenfahrt/Ausflug (§28 Abs. 2): Schüler
    if (kind.alter >= BUT_2026.klassenfahrtMinAlter && kind.alter < 18) {
      butJahrEinmal += BUT_2026.klassenfahrtSchulausflugEurJahr;
    }
  }
  const butGesamtJahr = roundEuro(butMonat * 12 + butJahrEinmal);

  // BuT-Detail als zusammengefasste Jahresposten
  const teilhabeKinder = haushalt.kinder.filter((k) => k.alter < 18).length;
  const schulKinder = haushalt.kinder.filter((k) => k.alter >= 6 && k.alter < 25).length;
  const mittagessenKinder = haushalt.kinder.filter(
    (k) => k.alter >= BUT_2026.mittagessenMinAlter && k.alter < 18,
  ).length;
  const klassenfahrtKinder = haushalt.kinder.filter(
    (k) => k.alter >= BUT_2026.klassenfahrtMinAlter && k.alter < 18,
  ).length;

  if (schulKinder > 0) {
    butDetail.push({
      label: `Schulbedarfspauschale (${schulKinder} Kind${schulKinder === 1 ? "" : "er"})`,
      betragJahr: schulKinder * BUT_2026.schulbedarfEurJahr,
    });
  }
  if (teilhabeKinder > 0) {
    butDetail.push({
      label: `Teilhabepauschale Freizeit/Verein (${teilhabeKinder} Kind${teilhabeKinder === 1 ? "" : "er"})`,
      betragJahr: teilhabeKinder * BUT_2026.teilhabeEurMonat * 12,
    });
  }
  if (mittagessenKinder > 0) {
    butDetail.push({
      label: `Mittagessen Kita/Schule (${mittagessenKinder} Kind${mittagessenKinder === 1 ? "" : "er"})`,
      betragJahr: mittagessenKinder * BUT_2026.mittagessenEurMonat * 12,
    });
  }
  if (klassenfahrtKinder > 0) {
    butDetail.push({
      label: `Klassenfahrt & Schulausflüge (${klassenfahrtKinder} Kind${klassenfahrtKinder === 1 ? "" : "er"})`,
      betragJahr: klassenfahrtKinder * BUT_2026.klassenfahrtSchulausflugEurJahr,
    });
  }

  // --- Geldwerte Vorteile (Rundfunkbefreiung, Sozialticket / Sozialpass) ---
  const rundfunkErsparnis = RUNDFUNKBEITRAG_EUR_MONAT * 12;
  geldwerteVorteileDetail.push({
    label: "Rundfunkbeitrag-Befreiung (§ 4 RBStV)",
    betragJahr: rundfunkErsparnis,
  });

  const oepnvErsparnis =
    haushalt.oepnvNutzer *
    (OEPNV_2026.deutschlandticketRegulaerEurMonat -
      OEPNV_2026.deutschlandticketErmaessigtEurMonat) *
    12;
  if (haushalt.oepnvNutzer > 0) {
    geldwerteVorteileDetail.push({
      label: `Sozialticket / ÖPNV-Ermäßigung (${haushalt.oepnvNutzer} Pers.)`,
      betragJahr: oepnvErsparnis,
    });
  }

  const erwachseneImHaushalt =
    haushalt.typ === "paar" || haushalt.typ === "paar_verheiratet" ? 2 : 1;
  const sonstigeVorteilePerErw =
    haushalt.wohnlage === "A" || haushalt.wohnlage === "B"
      ? OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenAB
      : OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenCD;
  const sonstigeFpVorteile = erwachseneImHaushalt * sonstigeVorteilePerErw;
  geldwerteVorteileDetail.push({
    label: "Lokaler Sozialpass (Zoo/Schwimmbad/VHS, geschätzt)",
    betragJahr: sonstigeFpVorteile,
  });

  const geldwerteVorteileJahr = roundEuro(
    rundfunkErsparnis + oepnvErsparnis + sonstigeFpVorteile,
  );

  // --- Eigene Kosten Haushalt: Rundfunkbeitrag 0, ÖPNV ermäßigt ---
  const rundfunkbeitragSelbstMonat = 0; // befreit
  const oepnvSelbstMonat =
    haushalt.oepnvNutzer *
    OEPNV_2026.deutschlandticketErmaessigtEurMonat;

  // --- Summen ---
  const mehrbedarfSummeMonat =
    mbAlleinerziehendMonat + mbWarmwasserMonat + mbSchwangerschaftMonat;

  const kindergeldMonat = haushalt.kinder.length * KINDERGELD_EUR_MONAT;

  // Jobcenter-Auszahlung: RB + alle MB + KdU + BuT − Kindergeld (Anrechnung als Einkommen Kind)
  const gesamtLeistungMonat =
    regelbedarfMonat +
    mehrbedarfSummeMonat +
    kduMonat +
    butGesamtJahr / 12 -
    kindergeldMonat;

  const schwarzarbeitMonat = Math.max(0, input.schwarzarbeitEurMonat);
  const antragsLeistungenMonat = Math.max(0, input.antragsLeistungenEurMonat);
  const verfuegbarNachMieteMonat =
    gesamtLeistungMonat +
    kindergeldMonat - // Kindergeld wird separat gezahlt, fließt also real zu
    mieteMonat -
    rundfunkbeitragSelbstMonat -
    oepnvSelbstMonat +
    schwarzarbeitMonat +
    antragsLeistungenMonat;

  return {
    regelbedarfJahr: roundEuro(regelbedarfMonat * 12),
    regelbedarfDetail,
    mehrbedarfAlleinerziehendJahr: roundEuro(mbAlleinerziehendMonat * 12),
    mehrbedarfWarmwasserJahr: roundEuro(mbWarmwasserMonat * 12),
    mehrbedarfSchwangerschaftJahr: roundEuro(mbSchwangerschaftMonat * 12),
    kdUJahr: roundEuro(kduMonat * 12),
    butGesamtJahr,
    butDetail,
    geldwerteVorteileJahr,
    geldwerteVorteileDetail,
    kindergeldAngerechnetJahr: roundEuro(kindergeldMonat * 12),
    gesamtLeistungJahr: roundEuro(gesamtLeistungMonat * 12),
    mieteJahr: roundEuro(mieteMonat * 12),
    rundfunkbeitragJahr: 0,
    oepnvJahr: roundEuro(oepnvSelbstMonat * 12),
    schwarzarbeitJahr: roundEuro(schwarzarbeitMonat * 12),
    antragsLeistungenJahr: roundEuro(antragsLeistungenMonat * 12),
    verfuegbarNachMieteJahr: roundEuro(verfuegbarNachMieteMonat * 12),
    verfuegbarNachMieteMonat: roundEuro(verfuegbarNachMieteMonat),
  };
}

function berechneErwachsenenRegelbedarfMonat(
  haushalt: Haushalt,
  detail: EinkuenftePosten[],
): number {
  if (haushalt.typ === "single" || haushalt.typ === "alleinerziehend") {
    const rb = REGELBEDARF_2026_EUR_MONAT.alleinstehend;
    detail.push({ label: "Regelbedarf Erwachsene/r (RBS 1)", betragJahr: rb * 12 });
    return rb;
  }
  const rb = REGELBEDARF_2026_EUR_MONAT.partner * 2;
  detail.push({ label: "Regelbedarf 2 Partner (RBS 2)", betragJahr: rb * 12 });
  return rb;
}

function regelbedarfFuerKind(alter: number): { label: string; betragMonat: number } {
  if (alter >= 14) {
    return {
      label: "Regelbedarf Jugendliche(r) 14–17 (RBS 4)",
      betragMonat: REGELBEDARF_2026_EUR_MONAT.jugendlicher14Bis17,
    };
  }
  if (alter >= 6) {
    return {
      label: "Regelbedarf Kind 6–13 (RBS 5)",
      betragMonat: REGELBEDARF_2026_EUR_MONAT.kind6Bis13,
    };
  }
  return {
    label: "Regelbedarf Kind 0–5 (RBS 6)",
    betragMonat: REGELBEDARF_2026_EUR_MONAT.kind0Bis5,
  };
}

export function berechneMehrbedarfAlleinerziehend(haushalt: Haushalt): number {
  if (haushalt.typ !== "alleinerziehend" || haushalt.kinder.length === 0) return 0;
  const rbs1 = REGELBEDARF_2026_EUR_MONAT.alleinstehend;
  const kinderU7 = haushalt.kinder.filter((k) => k.alter < 7).length;
  const kinderU16 = haushalt.kinder.filter((k) => k.alter < 16).length;
  const anzahl = haushalt.kinder.length;
  const pauschale36 =
    kinderU7 >= 1 || (kinderU16 >= 2 && kinderU16 <= 3)
      ? MEHRBEDARF_ALLEINERZIEHEND.prozentRbs1Basis
      : 0;
  const proKind = Math.min(
    anzahl * MEHRBEDARF_ALLEINERZIEHEND.prozentProKind,
    MEHRBEDARF_ALLEINERZIEHEND.prozentDeckel,
  );
  return roundEuro(rbs1 * Math.max(pauschale36, proKind));
}

/**
 * Mehrbedarf Warmwasser § 21 Abs. 7 SGB II — prozentualer Aufschlag je Regelbedarfsstufe,
 * summiert über alle Haushaltsmitglieder entsprechend ihrer RBS.
 */
export function berechneMehrbedarfWarmwasser(haushalt: Haushalt): number {
  const r = REGELBEDARF_2026_EUR_MONAT;
  const p = MEHRBEDARF_WARMWASSER_PCT;
  let summe = 0;

  if (haushalt.typ === "single" || haushalt.typ === "alleinerziehend") {
    summe += r.alleinstehend * p.rbs1;
  } else {
    summe += r.partner * p.rbs2 * 2;
  }
  for (const kind of haushalt.kinder) {
    if (kind.alter >= 14) summe += r.jugendlicher14Bis17 * p.rbs4;
    else if (kind.alter >= 6) summe += r.kind6Bis13 * p.rbs5;
    else summe += r.kind0Bis5 * p.rbs6;
  }
  return roundEuro(summe);
}

export function berechneKdU(haushalt: Haushalt): number {
  const { qm, bruttokalt } = bestimmeWohnungsgroesse(haushalt);
  const w = WOHNLAGEN_2026[haushalt.wohnlage];
  const heizkosten = qm * w.heizkostenEurProQmMonat;
  return roundEuro(bruttokalt + heizkosten);
}

/**
 * Market warmmiete for the apartment the household is entitled to in its Wohnlage.
 *
 * Logic: take the qm entitlement (§ 22 SGB II — Angemessenheitsgrenze der Wohnfläche
 * nach Personenzahl), multiply by the Wohnlage-typical Nettokalt + Nebenkosten and add
 * Heizkosten. This is what such an apartment would actually cost on the local market —
 * used both as a deduction on the work side and as the actual rent on the Bürgergeld side
 * (so KdU-Deckelung bites where appropriate).
 */
export function berechneMarktWarmmiete(haushalt: Haushalt): number {
  const { qm } = bestimmeWohnungsgroesse(haushalt);
  const w = WOHNLAGEN_2026[haushalt.wohnlage];
  const nettokaltPlusNK = qm * (w.nettokaltEurProQmMonat + w.nebenkostenEurProQmMonat);
  const heizkosten = qm * w.heizkostenEurProQmMonat;
  return roundEuro(nettokaltPlusNK + heizkosten);
}

export function berechneWohnflaecheQm(haushalt: Haushalt): number {
  return bestimmeWohnungsgroesse(haushalt).qm;
}

function bestimmeWohnungsgroesse(haushalt: Haushalt): {
  qm: number;
  bruttokalt: number;
} {
  const w = WOHNLAGEN_2026[haushalt.wohnlage];
  const personen =
    (haushalt.typ === "paar" || haushalt.typ === "paar_verheiratet" ? 2 : 1) +
    haushalt.kinder.length;
  if (personen <= 5) {
    const idx = personen - 1;
    return { qm: w.wohnflaecheQm[idx]!, bruttokalt: w.bruttokaltmieteEurMonat[idx]! };
  }
  const extra = personen - 5;
  return {
    qm: w.wohnflaecheQm[4]! + extra * w.aufschlagJeWeiterePersonQm,
    bruttokalt:
      w.bruttokaltmieteEurMonat[4]! + extra * w.aufschlagJeWeiterePersonEur,
  };
}

function roundEuro(v: number): number {
  return Math.round(v * 100) / 100;
}
