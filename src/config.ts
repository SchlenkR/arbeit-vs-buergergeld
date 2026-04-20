import type { Haushalt, HaushaltsTyp } from "./core/types";
import type { Wohnlage } from "./core/constants2026";

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
// Default: alle Haushaltsmitglieder (Erwachsene + Kinder) nutzen das Deutschlandticket.
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
//
// Viele Leistungen werden NICHT automatisch ausgezahlt, sondern müssen gezielt
// beantragt werden. Diese Presets fassen häufig übersehene oder unterschiedlich
// ausgeschöpfte Leistungen zu realistischen Szenarien zusammen — jeweils mit
// Quelle und Rechtsgrundlage.

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
  /** Label eines qualitativen Eintrags in der Ansprüche-Übersicht ("auf Antrag"),
   *  den diese Position mit einem konkreten Wert überdeckt. */
  ersetztAnspruch?: string;
}

/** Expandierte, haushaltsbezogene Antragsposition für die Ansprüche-Übersicht.
 *  Wird aus Preset × Haushalt errechnet und überdeckt qualitative "auf Antrag"-Zeilen. */
export interface AntragsAnspruchItem {
  label: string;
  eurMonat: number;
  paragraf: string;
  quelle: string;
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

export const ANTRAGS_PRESETS: Record<AntragsPresetId, AntragsPreset> = {
  keine: {
    id: "keine",
    titel: "Keine",
    untertitel: "nur Regelleistungen",
    datenlage: "gut",
    beschreibung:
      "Nur die automatisch modellierten Leistungen. Keine zusätzlichen Antragsleistungen — strikte Untergrenze.",
    items: [],
  },
  gesichert: {
    id: "gesichert",
    titel: "Gesichert",
    untertitel: "nachweisbare Pauschalen",
    datenlage: "gut",
    beschreibung:
      "Nur Leistungen mit klarer Rechtsgrundlage und belastbaren Pauschalen (Telekom-Sozialtarif, amortisierte Erstausstattungen nach Berliner AV-Wohnen). Konservativ gerechnet.",
    items: [
      {
        label: "Telefon-Sozialtarif (Telekom)",
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: "Telekom AGB Sozialtarif — 8,72 €/Monat Ermäßigung auf Festnetz",
        paragraf: "§ 45n TKG",
        ersetztAnspruch: "Telefon-Sozialtarif",
      },
      {
        label: "Erstausstattung Wohnung (amortisiert)",
        eurMonat: 12,
        basis: "haushalt",
        quelle: "Berliner AV-Wohnen Pauschalen (~1.000 €), verteilt auf 7 Jahre",
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruch: "Erstausstattung Wohnung (Möbel, Haushaltsgeräte)",
      },
      {
        label: "Erstausstattung Kind (amortisiert)",
        eurMonat: 3,
        basis: "kind",
        quelle: "BBR-Richtlinien Babyerstausstattung, verteilt über Kindheit",
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruch: "Erstausstattung Bekleidung — Schwangerschaft/Geburt",
      },
      {
        label: "Zuzahlungsbefreiung GKV",
        eurMonat: 6,
        basis: "erwachsener",
        quelle: "GKV-Spitzenverband: ø Zuzahlungen ~70–100 €/Jahr, bei BG-Empfängern befreit",
        paragraf: "§ 62 SGB V",
        ersetztAnspruch: "Zuzahlungsbefreiung",
      },
    ],
  },
  realistisch: {
    id: "realistisch",
    titel: "Realistisch",
    untertitel: "typische Ausschöpfung",
    datenlage: "mittel",
    beschreibung:
      "Gesicherte Pauschalen plus BuT-Lernförderung und kommunale Kinder-Zusatzleistungen in typischer (nicht voller) Inanspruchnahme. Orientiert an BMAS-BuT-Evaluation 2021.",
    items: [
      {
        label: "Telefon-Sozialtarif (Telekom)",
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: "Telekom AGB Sozialtarif",
        paragraf: "§ 45n TKG",
        ersetztAnspruch: "Telefon-Sozialtarif",
      },
      {
        label: "Erstausstattung Wohnung (amortisiert)",
        eurMonat: 12,
        basis: "haushalt",
        quelle: "Berliner AV-Wohnen, 7 Jahre",
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruch: "Erstausstattung Wohnung (Möbel, Haushaltsgeräte)",
      },
      {
        label: "Erstausstattung Kind (amortisiert)",
        eurMonat: 3,
        basis: "kind",
        quelle: "BBR-Richtlinien",
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruch: "Erstausstattung Bekleidung — Schwangerschaft/Geburt",
      },
      {
        label: "Lernförderung / Nachhilfe (Erwartungswert)",
        eurMonat: 12,
        basis: "schulkind",
        quelle:
          "BMAS BuT-Evaluation 2021: ~14 % Inanspruchnahme × voller Satz ≈ 12 €/Mt·Schulkind",
        paragraf: "§ 28 Abs. 5 SGB II",
        ersetztAnspruch: "Lernförderung / Nachhilfe",
      },
      {
        label: "Kinder-Zusatzbedarf (Vereine, Kita-Extras)",
        eurMonat: 5,
        basis: "kind",
        quelle: "Deutscher Städte- und Gemeindebund, Schätzung kommunaler Zusatzleistungen",
        paragraf: "kommunal, § 28 SGB II",
        ersetztAnspruch: "Schwimmbad / Museum / Zoo / VHS lokal ermäßigt",
      },
      {
        label: "Zuzahlungsbefreiung GKV",
        eurMonat: 8,
        basis: "erwachsener",
        quelle: "GKV-Statistik: typische Zuzahlungen entfallen vollständig",
        paragraf: "§ 62 SGB V",
        ersetztAnspruch: "Zuzahlungsbefreiung",
      },
      {
        label: "Kita-Gebührenbefreiung (U3)",
        eurMonat: 70,
        basis: "kindU3",
        quelle:
          "Mittelwert kommunaler Gebühren U3 (Hessen: ~150 €/Mt, in Frankfurt auf Antrag erlassen); stadtscharfer Median ~70 € nach Einkommensstaffel",
        paragraf: "§ 90 SGB VIII / kommunale Gebührensatzung",
        ersetztAnspruch: "Kita-Gebührenbefreiung (U3)",
      },
      {
        label: "Umzugskosten (amortisiert)",
        eurMonat: 4,
        basis: "haushalt",
        quelle:
          "Tatsächliche Umzugskosten (~500–1.000 €), angenommen alle 10 Jahre → ~4 €/Mt",
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruch: "Umzugskosten bei Wohnungswechsel",
      },
      {
        label: "Weihnachtsbeihilfe (kommunal)",
        eurMonat: 3,
        basis: "person",
        quelle:
          "Beispiele: Diakonie, Caritas, kommunale Härtefonds — ~30–50 €/Person/Jahr",
        paragraf: "kommunal, § 21 Abs. 6 SGB II (analog)",
        ersetztAnspruch: "Weihnachts-/Härtefallbeihilfen (kommunal)",
      },
      {
        label: "Einzugsrenovierung (amortisiert)",
        eurMonat: 3,
        basis: "haushalt",
        quelle:
          "Renovierung bei Einzug (~500 €), amortisiert auf Mietdauer ~12–15 Jahre",
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruch: "Einzugs- und Schönheitsreparaturen",
      },
    ],
  },
  hoch: {
    id: "hoch",
    titel: "Hoch",
    untertitel: "voll ausgeschöpft",
    datenlage: "schwach",
    beschreibung:
      "Obere Grenze — alle zustehenden Leistungen konsequent beantragt und bewilligt. Rechtlich möglich, aber nicht repräsentativ: Inanspruchnahme-Quote in der Realität deutlich niedriger.",
    items: [
      {
        label: "Telefon-Sozialtarif (Telekom)",
        eurMonat: 8.72,
        basis: "haushalt",
        quelle: "Telekom AGB Sozialtarif",
        paragraf: "§ 45n TKG",
        ersetztAnspruch: "Telefon-Sozialtarif",
      },
      {
        label: "Erstausstattung Wohnung (amortisiert, kürzere Laufzeit)",
        eurMonat: 18,
        basis: "haushalt",
        quelle: "Berliner AV-Wohnen, 5 Jahre",
        paragraf: "§ 24 Abs. 3 Nr. 1 SGB II",
        ersetztAnspruch: "Erstausstattung Wohnung (Möbel, Haushaltsgeräte)",
      },
      {
        label: "Erstausstattung Kind (voll)",
        eurMonat: 5,
        basis: "kind",
        quelle: "BBR-Richtlinien, volle Ausschöpfung",
        paragraf: "§ 24 Abs. 3 Nr. 2 SGB II",
        ersetztAnspruch: "Erstausstattung Bekleidung — Schwangerschaft/Geburt",
      },
      {
        label: "Lernförderung voll ausgeschöpft",
        eurMonat: 50,
        basis: "schulkind",
        quelle: "BuT Nachhilfe-Höchstsatz lokaler Träger (~45–60 €/Mt·Schulkind)",
        paragraf: "§ 28 Abs. 5 SGB II",
        ersetztAnspruch: "Lernförderung / Nachhilfe",
      },
      {
        label: "Beihilfen (Brille, orthopäd. Schuhe, etc.)",
        eurMonat: 6,
        basis: "erwachsener",
        quelle: "Verbraucherzentrale-Schätzung einmaliger Gesundheits-Beihilfen",
        paragraf: "§ 24 Abs. 3 SGB II",
        ersetztAnspruch: "Orthopädische Schuhe, Reparaturen therapeutischer Geräte",
      },
      {
        label: "Härtefallfonds / sonstige Einmalleistungen",
        eurMonat: 8,
        basis: "haushalt",
        quelle: "Schätzung kommunaler Härtefallfonds",
        paragraf: "§ 21 Abs. 6 SGB II",
      },
      {
        label: "Zuzahlungsbefreiung GKV (voll)",
        eurMonat: 12,
        basis: "erwachsener",
        quelle: "Bei chronisch Kranken / hoher Belastung — voller Wert entfallender Zuzahlungen",
        paragraf: "§ 62 SGB V",
        ersetztAnspruch: "Zuzahlungsbefreiung",
      },
      {
        label: "Kita-Gebührenbefreiung U3 (voll, Frankfurt)",
        eurMonat: 150,
        basis: "kindU3",
        quelle: "Frankfurt: volle Kita-Gebühr U3 kann ~150 €/Mt erlassen werden",
        paragraf: "§ 90 SGB VIII",
        ersetztAnspruch: "Kita-Gebührenbefreiung (U3)",
      },
      {
        label: "Schülerbeförderung (zusätzlich zum Sozialticket)",
        eurMonat: 8,
        basis: "schulkind",
        quelle: "Tatsächliche Kosten Schulweg, soweit nicht anderweitig abgedeckt",
        paragraf: "§ 28 Abs. 4 SGB II",
        ersetztAnspruch: "Schüler-Beförderung",
      },
      {
        label: "Umzugskosten + Einzugsrenovierung",
        eurMonat: 10,
        basis: "haushalt",
        quelle: "Umzug + Renovierung + Streichkosten, voll ausgeschöpft, amortisiert",
        paragraf: "§ 22 Abs. 6 SGB II",
        ersetztAnspruch: "Umzugskosten bei Wohnungswechsel",
      },
      {
        label: "Weihnachtsbeihilfe + Härtefälle (voll)",
        eurMonat: 5,
        basis: "person",
        quelle: "Mehrere kommunale Töpfe + Wohlfahrtsverbände kombiniert",
        paragraf: "kommunal",
        ersetztAnspruch: "Weihnachts-/Härtefallbeihilfen (kommunal)",
      },
      {
        label: "Kostenaufwändige Ernährung (ärztlich)",
        eurMonat: 35,
        basis: "erwachsener",
        quelle:
          "Deutscher Verein Empfehlungen — z.B. Zöliakie/Niereninsuffizienz, nur bei Attest",
        paragraf: "§ 21 Abs. 5 SGB II",
        ersetztAnspruch: "Kostenaufwändige Ernährung (ärztlich)",
      },
      {
        label: "Nebenkostennachzahlungen (amortisiert)",
        eurMonat: 15,
        basis: "haushalt",
        quelle:
          "Nebenkostennachzahlungen (Strom/Heizung) im Fälligkeitsmonat übernommen, gemittelt",
        paragraf: "§ 22 Abs. 1 Satz 4 SGB II",
        ersetztAnspruch: "Nebenkostennachzahlungen",
      },
    ],
  },
};

export const ANTRAGS_PRESET_DEFAULT: AntragsPresetId = "gesichert";

export function getAntragsPreset(id: AntragsPresetId): AntragsPreset {
  return ANTRAGS_PRESETS[id];
}

/** Reihenfolge für das UI (links → rechts). */
export const ANTRAGS_PRESET_ORDER: AntragsPresetId[] = [
  "keine",
  "gesichert",
  "realistisch",
  "hoch",
];

/** Expandiert ein Preset × Haushalt zu konkreten €/Monat-Positionen.
 *  Positionen, die sich im aktuellen Haushalt zu 0 € auflösen würden (z.B. Kind-Basis
 *  ohne Kinder), werden weggelassen. */
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
    result.push({
      label: item.label,
      eurMonat: Math.round(item.eurMonat * faktor * 100) / 100,
      paragraf: item.paragraf,
      quelle: item.quelle,
      ...(item.ersetztAnspruch ? { ersetztAnspruch: item.ersetztAnspruch } : {}),
    });
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
