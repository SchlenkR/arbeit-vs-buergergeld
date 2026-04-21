import type { Haushalt, HaushaltsTyp } from "./core/types";
import type { Wohnlage } from "./core/constants2026";
import { T } from "./i18n";

// ===== Haushalt =====
export const TYP_DEFAULT: HaushaltsTyp = "paar_verheiratet";
export const KINDER_DEFAULT = 2;
export const KINDER_MAX = 6;
export const WOHNLAGE_DEFAULT: Wohnlage = "A";
export const WARMWASSER_DEZENTRAL_DEFAULT = false;
export const SCHWANGERSCHAFT_AB_13_SSW_DEFAULT = false;

export function adultsFor(typ: HaushaltsTyp): number {
  return typ === "paar" || typ === "paar_verheiratet" ? 2 : 1;
}

// ===== ÖPNV =====
export const OEPNV_NUTZER_DEFAULT = adultsFor(TYP_DEFAULT) + KINDER_DEFAULT;
export const OEPNV_NUTZER_MAX = 2 + KINDER_MAX;

// ===== Einkommen (Arbeit / Selbstständig) =====
export const BRUTTO_MIN = 10_000;
export const BRUTTO_MAX = 150_000;
export const BRUTTO_STEP = 2_500;
export const BRUTTO_DEFAULT = 60_000;

// ===== Nebeneinkünfte (Schwarzarbeit) =====
export const SCHWARZ_MIN = 0;
export const SCHWARZ_MAX = 3000;
export const SCHWARZ_STEP = 50;
export const SCHWARZ_DEFAULT = 0;

// ===== Antragsleistungen (on-request Bürgergeld benefits) =====

export type AntragsBasis =
  | "haushalt"
  | "erwachsener"
  | "kind"
  | "schulkind"
  | "kindU3"
  | "person";

export interface AntragsItem {
  label: string;
  /** €/Monat, bezogen auf die Basis (z.B. pro Kind, pro Haushalt, …). */
  eurMonat: number;
  basis: AntragsBasis;
  quelle: string;
  paragraf: string;
  /** Stable ID used to match against a qualitative anspruch entry ("auf Antrag"). */
  ersetztAnspruchId?: string;
  /** Label-form of the matched anspruch entry, kept for backwards display only. */
  ersetztAnspruch?: string;
}

export interface AntragsAnspruchItem {
  label: string;
  eurMonat: number;
  paragraf: string;
  quelle: string;
  ersetztAnspruchId?: string;
  ersetztAnspruch?: string;
}

export type AntragsPresetId = "keine" | "gesichert" | "realistisch" | "hoch";

export type AntragsDatenlage = "gut" | "mittel" | "schwach";

export interface AntragsPreset {
  id: AntragsPresetId;
  titel: string;
  untertitel: string;
  datenlage: AntragsDatenlage;
  beschreibung: string;
  items: AntragsItem[];
}

/** Stable IDs used to match ANTRAGS_PRESETS items with qualitative "auf Antrag" entries. */
export const OVERLAY_ID = {
  TELEFON_SOZIALTARIF: "telefon-sozialtarif",
  ERSTAUSSTATTUNG_WOHNUNG: "erstausstattung-wohnung",
  ERSTAUSSTATTUNG_BEKLEIDUNG: "erstausstattung-bekleidung",
  ZUZAHLUNGSBEFREIUNG: "zuzahlungsbefreiung",
  LERNFOERDERUNG: "lernfoerderung",
  SCHWIMMBAD_MUSEUM: "sozialpass-teilhabe",
  KITA_GEBUEHREN_U3: "kita-gebuehren-u3",
  UMZUGSKOSTEN: "umzugskosten",
  WEIHNACHTSBEIHILFE: "weihnachtsbeihilfe",
  EINZUGSRENOVIERUNG: "einzugsrenovierung",
  ORTHOPAEDISCHE_SCHUHE: "orthopaedische-schuhe",
  SCHUELER_BEFOERDERUNG: "schueler-befoerderung",
  KOSTENAUFW_ERNAEHRUNG: "kostenaufw-ernaehrung",
  NEBENKOSTENNACHZAHLUNGEN: "nebenkostennachzahlungen",
} as const;

const label = {
  telefonSozialtarif: T("Telefon-Sozialtarif (Telekom)", "Phone welfare rate (Telekom)"),
  erstausstattungWohnungAmortisiert: T(
    "Erstausstattung Wohnung (amortisiert)",
    "Initial home equipment (amortised)",
  ),
  erstausstattungKindAmortisiert: T(
    "Erstausstattung Kind (amortisiert)",
    "Initial child equipment (amortised)",
  ),
  zuzahlungsbefreiungGKV: T("Zuzahlungsbefreiung GKV", "Co-payment exemption (public health)"),
  lernfoerderungErwartungswert: T(
    "Lernförderung / Nachhilfe (Erwartungswert)",
    "Tutoring / remedial teaching (expected value)",
  ),
  kinderZusatzbedarf: T(
    "Kinder-Zusatzbedarf (Vereine, Kita-Extras)",
    "Additional child needs (clubs, kindergarten extras)",
  ),
  kitaGebuehrenU3: T("Kita-Gebührenbefreiung (U3)", "Kindergarten fee exemption (under 3)"),
  umzugskostenAmortisiert: T("Umzugskosten (amortisiert)", "Moving costs (amortised)"),
  weihnachtsbeihilfe: T("Weihnachtsbeihilfe (kommunal)", "Christmas allowance (municipal)"),
  einzugsrenovierung: T(
    "Einzugsrenovierung (amortisiert)",
    "Move-in renovation (amortised)",
  ),
  erstausstattungWohnungKurz: T(
    "Erstausstattung Wohnung (amortisiert, kürzere Laufzeit)",
    "Initial home equipment (amortised, shorter period)",
  ),
  erstausstattungKindVoll: T(
    "Erstausstattung Kind (voll)",
    "Initial child equipment (full)",
  ),
  lernfoerderungVoll: T(
    "Lernförderung voll ausgeschöpft",
    "Tutoring fully utilised",
  ),
  beihilfenBrille: T(
    "Beihilfen (Brille, orthopäd. Schuhe, etc.)",
    "Allowances (glasses, orthopaedic shoes, etc.)",
  ),
  haertefallfonds: T(
    "Härtefallfonds / sonstige Einmalleistungen",
    "Hardship fund / other one-off benefits",
  ),
  zuzahlungsbefreiungGKVVoll: T(
    "Zuzahlungsbefreiung GKV (voll)",
    "Co-payment exemption (public health, full)",
  ),
  kitaGebuehrenU3Frankfurt: T(
    "Kita-Gebührenbefreiung U3 (voll, Frankfurt)",
    "Kindergarten fee exemption under 3 (full, Frankfurt)",
  ),
  schuelerbefoerderung: T(
    "Schülerbeförderung (zusätzlich zum Sozialticket)",
    "School transport (in addition to welfare ticket)",
  ),
  umzugsEinzugsRenovierung: T(
    "Umzugskosten + Einzugsrenovierung",
    "Moving costs + move-in renovation",
  ),
  weihnachtsbeihilfeVoll: T(
    "Weihnachtsbeihilfe + Härtefälle (voll)",
    "Christmas allowance + hardship (full)",
  ),
  kostenaufwErnaehrung: T(
    "Kostenaufwändige Ernährung (ärztlich)",
    "Medically-required diet (certified)",
  ),
  nebenkostennachzahlungen: T(
    "Nebenkostennachzahlungen (amortisiert)",
    "Utility back-payments (amortised)",
  ),
};

const quelle = {
  telekomAGB: T(
    "Telekom AGB Sozialtarif; 8,72 €/Monat Ermäßigung auf Festnetz",
    "Telekom welfare rate T&C; 8.72 €/month reduction on fixed line",
  ),
  telekomAGBKurz: T("Telekom AGB Sozialtarif", "Telekom welfare rate T&C"),
  berlinerAV7Jahre: T(
    "Berliner AV-Wohnen Pauschalen (~1.000 €), verteilt auf 7 Jahre",
    "Berlin housing ordinance lump sums (~1,000 €), spread over 7 years",
  ),
  berlinerAV7JahreKurz: T(
    "Berliner AV-Wohnen, 7 Jahre",
    "Berlin housing ordinance, 7 years",
  ),
  berlinerAV5Jahre: T(
    "Berliner AV-Wohnen, 5 Jahre",
    "Berlin housing ordinance, 5 years",
  ),
  bbrBaby: T(
    "BBR-Richtlinien Babyerstausstattung, verteilt über Kindheit",
    "BBR baby equipment guidelines, spread over childhood",
  ),
  bbrKurz: T("BBR-Richtlinien", "BBR guidelines"),
  bbrVoll: T("BBR-Richtlinien, volle Ausschöpfung", "BBR guidelines, full utilisation"),
  gkvSpitz: T(
    "GKV-Spitzenverband: ø Zuzahlungen ~70-100 €/Jahr, bei BG-Empfängern befreit",
    "GKV national association: avg co-payments ~70-100 €/year, exempt for Bürgergeld recipients",
  ),
  gkvStat: T(
    "GKV-Statistik: typische Zuzahlungen entfallen vollständig",
    "GKV statistics: typical co-payments are fully waived",
  ),
  gkvChronisch: T(
    "Bei chronisch Kranken / hoher Belastung; voller Wert entfallender Zuzahlungen",
    "For chronic illness / high burden; full value of waived co-payments",
  ),
  bmasBut: T(
    "BMAS BuT-Evaluation 2021: ~14 % Inanspruchnahme × voller Satz ≈ 12 €/Mt·Schulkind",
    "Federal Ministry BuT evaluation 2021: ~14 % take-up × full rate ≈ 12 €/mo per pupil",
  ),
  butNachhilfe: T(
    "BuT Nachhilfe-Höchstsatz lokaler Träger (~45-60 €/Mt·Schulkind)",
    "BuT tutoring max rate at local providers (~45-60 €/mo per pupil)",
  ),
  dsgbKommunale: T(
    "Deutscher Städte- und Gemeindebund, Schätzung kommunaler Zusatzleistungen",
    "German Association of Cities and Municipalities, estimate of municipal add-ons",
  ),
  hessenU3: T(
    "Mittelwert kommunaler Gebühren U3 (Hessen: ~150 €/Mt, in Frankfurt auf Antrag erlassen); stadtscharfer Median ~70 € nach Einkommensstaffel",
    "Average municipal fees U3 (Hesse: ~150 €/mo, waived on request in Frankfurt); city-level median ~70 € by income bracket",
  ),
  frankfurtU3Voll: T(
    "Frankfurt: volle Kita-Gebühr U3 kann ~150 €/Mt erlassen werden",
    "Frankfurt: full U3 kindergarten fee (~150 €/mo) can be waived",
  ),
  umzugKosten: T(
    "Tatsächliche Umzugskosten (~500-1.000 €), angenommen alle 10 Jahre → ~4 €/Mt",
    "Actual moving costs (~500-1,000 €), assumed every 10 years → ~4 €/mo",
  ),
  wohlfahrt: T(
    "Beispiele: Diakonie, Caritas, kommunale Härtefonds; ~30-50 €/Person/Jahr",
    "Examples: Diakonie, Caritas, municipal hardship funds; ~30-50 €/person/year",
  ),
  renovierung: T(
    "Renovierung bei Einzug (~500 €), amortisiert auf Mietdauer ~12-15 Jahre",
    "Move-in renovation (~500 €), amortised over ~12-15 years of tenancy",
  ),
  verbraucherZentrale: T(
    "Verbraucherzentrale-Schätzung einmaliger Gesundheits-Beihilfen",
    "Consumer association estimate of one-off health allowances",
  ),
  kommunaleHaertefall: T(
    "Schätzung kommunaler Härtefallfonds",
    "Estimate of municipal hardship funds",
  ),
  schulweg: T(
    "Tatsächliche Kosten Schulweg, soweit nicht anderweitig abgedeckt",
    "Actual school-commute costs, to the extent not otherwise covered",
  ),
  umzugRenovVoll: T(
    "Umzug + Renovierung + Streichkosten, voll ausgeschöpft, amortisiert",
    "Move + renovation + painting, fully utilised, amortised",
  ),
  mehrereTopfe: T(
    "Mehrere kommunale Töpfe + Wohlfahrtsverbände kombiniert",
    "Multiple municipal funds + welfare associations combined",
  ),
  dvZoeliakie: T(
    "Deutscher Verein Empfehlungen; z.B. Zöliakie/Niereninsuffizienz, nur bei Attest",
    "German Association recommendations; e.g. coeliac/renal insufficiency, certificate required",
  ),
  nebenkostenFaelligkeit: T(
    "Nebenkostennachzahlungen (Strom/Heizung) im Fälligkeitsmonat übernommen, gemittelt",
    "Utility back-payments (electricity/heating) covered in the month due, averaged",
  ),
};

export const ANTRAGS_PRESETS: Record<AntragsPresetId, AntragsPreset> = {
  keine: {
    id: "keine",
    titel: T("Keine", "None"),
    untertitel: T("nur Regelleistungen", "standard benefits only"),
    datenlage: "gut",
    beschreibung: T(
      "Nur die automatisch modellierten Leistungen. Keine zusätzlichen Antragsleistungen; strikte Untergrenze.",
      "Only the automatically modelled benefits. No additional on-request benefits; strict lower bound.",
    ),
    items: [],
  },
  gesichert: {
    id: "gesichert",
    titel: T("Gesichert", "Secured"),
    untertitel: T("nachweisbare Pauschalen", "documented lump sums"),
    datenlage: "gut",
    beschreibung: T(
      "Nur Leistungen mit klarer Rechtsgrundlage und belastbaren Pauschalen (Telekom-Sozialtarif, amortisierte Erstausstattungen nach Berliner AV-Wohnen). Konservativ gerechnet.",
      "Only benefits with a clear legal basis and reliable lump sums (Telekom welfare rate, amortised initial equipment per Berlin housing ordinance). Calculated conservatively.",
    ),
    items: [
      {
        label: label.telefonSozialtarif,
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: quelle.telekomAGB,
        paragraf: "§ 45n TKG",
        ersetztAnspruchId: OVERLAY_ID.TELEFON_SOZIALTARIF,
      },
      {
        label: label.erstausstattungWohnungAmortisiert,
        eurMonat: 12,
        basis: "haushalt",
        quelle: quelle.berlinerAV7Jahre,
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_WOHNUNG,
      },
      {
        label: label.erstausstattungKindAmortisiert,
        eurMonat: 3,
        basis: "kind",
        quelle: quelle.bbrBaby,
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_BEKLEIDUNG,
      },
      {
        label: label.zuzahlungsbefreiungGKV,
        eurMonat: 6,
        basis: "erwachsener",
        quelle: quelle.gkvSpitz,
        paragraf: "§ 62 SGB V",
        ersetztAnspruchId: OVERLAY_ID.ZUZAHLUNGSBEFREIUNG,
      },
    ],
  },
  realistisch: {
    id: "realistisch",
    titel: T("Realistisch", "Realistic"),
    untertitel: T("typische Ausschöpfung", "typical utilisation"),
    datenlage: "mittel",
    beschreibung: T(
      "Gesicherte Pauschalen plus BuT-Lernförderung und kommunale Kinder-Zusatzleistungen in typischer (nicht voller) Inanspruchnahme. Orientiert an BMAS-BuT-Evaluation 2021.",
      "Secured lump sums plus BuT tutoring and municipal add-ons at typical (not full) take-up. Based on the 2021 federal BuT evaluation.",
    ),
    items: [
      {
        label: label.telefonSozialtarif,
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: quelle.telekomAGBKurz,
        paragraf: "§ 45n TKG",
        ersetztAnspruchId: OVERLAY_ID.TELEFON_SOZIALTARIF,
      },
      {
        label: label.erstausstattungWohnungAmortisiert,
        eurMonat: 12,
        basis: "haushalt",
        quelle: quelle.berlinerAV7JahreKurz,
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_WOHNUNG,
      },
      {
        label: label.erstausstattungKindAmortisiert,
        eurMonat: 3,
        basis: "kind",
        quelle: quelle.bbrKurz,
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_BEKLEIDUNG,
      },
      {
        label: label.lernfoerderungErwartungswert,
        eurMonat: 12,
        basis: "schulkind",
        quelle: quelle.bmasBut,
        paragraf: "§ 28 Abs. 5 SGB II",
        ersetztAnspruchId: OVERLAY_ID.LERNFOERDERUNG,
      },
      {
        label: label.kinderZusatzbedarf,
        eurMonat: 5,
        basis: "kind",
        quelle: quelle.dsgbKommunale,
        paragraf: T("kommunal, § 28 SGB II", "municipal, § 28 SGB II"),
        ersetztAnspruchId: OVERLAY_ID.SCHWIMMBAD_MUSEUM,
      },
      {
        label: label.zuzahlungsbefreiungGKV,
        eurMonat: 8,
        basis: "erwachsener",
        quelle: quelle.gkvStat,
        paragraf: "§ 62 SGB V",
        ersetztAnspruchId: OVERLAY_ID.ZUZAHLUNGSBEFREIUNG,
      },
      {
        label: label.kitaGebuehrenU3,
        eurMonat: 70,
        basis: "kindU3",
        quelle: quelle.hessenU3,
        paragraf: T(
          "§ 90 SGB VIII / kommunale Gebührensatzung",
          "§ 90 SGB VIII / municipal fee regulations",
        ),
        ersetztAnspruchId: OVERLAY_ID.KITA_GEBUEHREN_U3,
      },
      {
        label: label.umzugskostenAmortisiert,
        eurMonat: 4,
        basis: "haushalt",
        quelle: quelle.umzugKosten,
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruchId: OVERLAY_ID.UMZUGSKOSTEN,
      },
      {
        label: label.weihnachtsbeihilfe,
        eurMonat: 3,
        basis: "person",
        quelle: quelle.wohlfahrt,
        paragraf: T(
          "kommunal, § 21 Abs. 6 SGB II (analog)",
          "municipal, § 21 (6) SGB II (analog)",
        ),
        ersetztAnspruchId: OVERLAY_ID.WEIHNACHTSBEIHILFE,
      },
      {
        label: label.einzugsrenovierung,
        eurMonat: 3,
        basis: "haushalt",
        quelle: quelle.renovierung,
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruchId: OVERLAY_ID.EINZUGSRENOVIERUNG,
      },
    ],
  },
  hoch: {
    id: "hoch",
    titel: T("Hoch", "High"),
    untertitel: T("voll ausgeschöpft", "fully utilised"),
    datenlage: "schwach",
    beschreibung: T(
      "Obere Grenze; alle zustehenden Leistungen konsequent beantragt und bewilligt. Rechtlich möglich, aber nicht repräsentativ: Inanspruchnahme-Quote in der Realität deutlich niedriger.",
      "Upper bound; all applicable benefits consistently applied for and granted. Legally possible but not representative: real-world take-up is considerably lower.",
    ),
    items: [
      {
        label: label.telefonSozialtarif,
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: quelle.telekomAGBKurz,
        paragraf: "§ 45n TKG",
        ersetztAnspruchId: OVERLAY_ID.TELEFON_SOZIALTARIF,
      },
      {
        label: label.erstausstattungWohnungKurz,
        eurMonat: 18,
        basis: "haushalt",
        quelle: quelle.berlinerAV5Jahre,
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_WOHNUNG,
      },
      {
        label: label.erstausstattungKindVoll,
        eurMonat: 5,
        basis: "kind",
        quelle: quelle.bbrVoll,
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ERSTAUSSTATTUNG_BEKLEIDUNG,
      },
      {
        label: label.lernfoerderungVoll,
        eurMonat: 50,
        basis: "schulkind",
        quelle: quelle.butNachhilfe,
        paragraf: "§ 28 Abs. 5 SGB II",
        ersetztAnspruchId: OVERLAY_ID.LERNFOERDERUNG,
      },
      {
        label: label.beihilfenBrille,
        eurMonat: 6,
        basis: "erwachsener",
        quelle: quelle.verbraucherZentrale,
        paragraf: "§ 24 Abs. 3 SGB II",
        ersetztAnspruchId: OVERLAY_ID.ORTHOPAEDISCHE_SCHUHE,
      },
      {
        label: label.haertefallfonds,
        eurMonat: 8,
        basis: "haushalt",
        quelle: quelle.kommunaleHaertefall,
        paragraf: "§ 21 Abs. 6 SGB II",
      },
      {
        label: label.zuzahlungsbefreiungGKVVoll,
        eurMonat: 12,
        basis: "erwachsener",
        quelle: quelle.gkvChronisch,
        paragraf: "§ 62 SGB V",
        ersetztAnspruchId: OVERLAY_ID.ZUZAHLUNGSBEFREIUNG,
      },
      {
        label: label.kitaGebuehrenU3Frankfurt,
        eurMonat: 150,
        basis: "kindU3",
        quelle: quelle.frankfurtU3Voll,
        paragraf: "§ 90 SGB VIII",
        ersetztAnspruchId: OVERLAY_ID.KITA_GEBUEHREN_U3,
      },
      {
        label: label.schuelerbefoerderung,
        eurMonat: 8,
        basis: "schulkind",
        quelle: quelle.schulweg,
        paragraf: "§ 28 Abs. 4 SGB II",
        ersetztAnspruchId: OVERLAY_ID.SCHUELER_BEFOERDERUNG,
      },
      {
        label: label.umzugsEinzugsRenovierung,
        eurMonat: 10,
        basis: "haushalt",
        quelle: quelle.umzugRenovVoll,
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruchId: OVERLAY_ID.UMZUGSKOSTEN,
      },
      {
        label: label.weihnachtsbeihilfeVoll,
        eurMonat: 5,
        basis: "person",
        quelle: quelle.mehrereTopfe,
        paragraf: T("kommunal", "municipal"),
        ersetztAnspruchId: OVERLAY_ID.WEIHNACHTSBEIHILFE,
      },
      {
        label: label.kostenaufwErnaehrung,
        eurMonat: 35,
        basis: "erwachsener",
        quelle: quelle.dvZoeliakie,
        paragraf: "§ 21 Abs. 5 SGB II",
        ersetztAnspruchId: OVERLAY_ID.KOSTENAUFW_ERNAEHRUNG,
      },
      {
        label: label.nebenkostennachzahlungen,
        eurMonat: 15,
        basis: "haushalt",
        quelle: quelle.nebenkostenFaelligkeit,
        paragraf: "§ 22 Abs. 1 Satz 4 SGB II",
        ersetztAnspruchId: OVERLAY_ID.NEBENKOSTENNACHZAHLUNGEN,
      },
    ],
  },
};

export const ANTRAGS_PRESET_DEFAULT: AntragsPresetId = "gesichert";

export function getAntragsPreset(id: AntragsPresetId): AntragsPreset {
  return ANTRAGS_PRESETS[id];
}

export const ANTRAGS_PRESET_ORDER: AntragsPresetId[] = [
  "keine",
  "gesichert",
  "realistisch",
  "hoch",
];

export function buildAntragsAnspruchItems(
  preset: AntragsPreset,
  haushalt: Haushalt,
): AntragsAnspruchItem[] {
  const erwachsene = adultsFor(haushalt.typ);
  const kinder = haushalt.kinder.length;
  const schulkinder = haushalt.kinder.filter(
    (k) => k.alter >= 6 && k.alter < 18,
  ).length;
  const kinderU3 = haushalt.kinder.filter((k) => k.alter < 3).length;
  const personen = erwachsene + kinder;

  const result: AntragsAnspruchItem[] = [];
  for (const item of preset.items) {
    let faktor = 0;
    switch (item.basis) {
      case "haushalt":
        faktor = 1;
        break;
      case "erwachsener":
        faktor = erwachsene;
        break;
      case "kind":
        faktor = kinder;
        break;
      case "schulkind":
        faktor = schulkinder;
        break;
      case "kindU3":
        faktor = kinderU3;
        break;
      case "person":
        faktor = personen;
        break;
    }
    if (faktor <= 0) continue;
    const next: AntragsAnspruchItem = {
      label: item.label,
      eurMonat: Math.round(item.eurMonat * faktor * 100) / 100,
      paragraf: item.paragraf,
      quelle: item.quelle,
    };
    if (item.ersetztAnspruchId) next.ersetztAnspruchId = item.ersetztAnspruchId;
    if (item.ersetztAnspruch) next.ersetztAnspruch = item.ersetztAnspruch;
    result.push(next);
  }
  return result;
}

export function computeAntragsLeistungenMonat(
  preset: AntragsPreset,
  haushalt: Haushalt,
): number {
  const items = buildAntragsAnspruchItems(preset, haushalt);
  const summe = items.reduce((s, i) => s + i.eurMonat, 0);
  return Math.round(summe * 100) / 100;
}
