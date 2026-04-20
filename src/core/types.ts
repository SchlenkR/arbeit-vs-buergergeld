import type { Wohnlage } from "./constants2026";

export type HaushaltsTyp =
  | "single"
  | "alleinerziehend"
  | "paar"
  | "paar_verheiratet";

export interface Kind {
  alter: number;
}

export interface Haushalt {
  typ: HaushaltsTyp;
  kinder: Kind[];
  /** Wohnlage A (Top-Ballungsraum) ... D (ländlich). Wirkt auf KdU & Marktmiete. */
  wohnlage: Wohnlage;
  wohnflaecheQm: number;
  warmmieteEurProMonat: number;
  warmwasserDezentral: boolean;
  schwangerschaftAb13SSW: boolean;
  /** Anzahl Personen im Haushalt, die ÖPNV nutzen (Deutschlandticket). Erwachsene + Kinder. */
  oepnvNutzer: number;
}

export interface ArbeitsInput {
  /** Arbeitnehmer-Brutto (Jahresgehalt laut Arbeitsvertrag). */
  bruttoJahr: number;
}

export interface BuergergeldInput {
  /** Nicht angemeldete Nebeneinkünfte (Schwarzarbeit). Reine Addition zum verfügbaren
   *  Einkommen — keine Anrechnung auf BG, keine Steuern/SV. Modelliert nicht das
   *  strafrechtliche/entdeckungsbedingte Risiko (§ 263 StGB, § 266a StGB, § 54 SGB II). */
  schwarzarbeitEurMonat: number;
  /** Pauschalisierte Antragsleistungen (Telefon-Sozialtarif, Erstausstattung, Lernförderung
   *  etc.). Wird vom UI als Preset-Auswahl auf einen €/Monat-Wert heruntergerechnet. */
  antragsLeistungenEurMonat: number;
}

export interface Szenario {
  haushalt: Haushalt;
  arbeit: ArbeitsInput;
  buergergeld: BuergergeldInput;
}

export interface AbgabenPosten {
  label: string;
  betragJahr: number;
}

export interface EinkuenftePosten {
  label: string;
  betragJahr: number;
}

export interface ArbeitsErgebnis {
  /** Arbeitnehmer-Brutto (Vertrags-Brutto, laut Lohnabrechnung). */
  bruttoJahr: number;
  /** Arbeitgeberanteil der SV (Lohnnebenkosten, kommt oben drauf). */
  arbeitgeberAnteilJahr: number;
  /** Gesamt-Brutto = Arbeitnehmer-Brutto + Arbeitgeberanteil SV. */
  gesamtBruttoJahr: number;
  /** Arbeitnehmer-Anteil SV (mindert Netto). */
  sozialabgabenJahr: number;
  sozialabgabenDetail: AbgabenPosten[];
  abziehbareVorsorgeaufwendungenJahr: number;
  einkommensteuerJahr: number;
  /** Bemessungsgrundlage des Soli; bei Kinderfreibetrag ohne die Kindergeld-Zurechnung. */
  soliBemessungsgrundlageJahr: number;
  soliJahr: number;
  zvE: number;
  steuerlicheEntlastungDurchKinderfreibetrag: number;
  kindergeldJahr: number;
  wohngeldJahr: number;
  kinderzuschlagJahr: number;
  mieteJahr: number;
  /** Rundfunkbeitrag, den der Haushalt selbst zahlt (bei Bürgergeld: 0 wg. Befreiung). */
  rundfunkbeitragJahr: number;
  /** ÖPNV-Kosten (Deutschlandticket), regulär bzw. ermäßigt. */
  oepnvJahr: number;
  nettoNachAllemJahr: number;
  nettoNachAllemMonat: number;
}

export interface BuergergeldErgebnis {
  regelbedarfJahr: number;
  regelbedarfDetail: EinkuenftePosten[];
  mehrbedarfAlleinerziehendJahr: number;
  mehrbedarfWarmwasserJahr: number;
  mehrbedarfSchwangerschaftJahr: number;
  kdUJahr: number;
  /** Summe aller BuT-Leistungen im Jahr. */
  butGesamtJahr: number;
  butDetail: EinkuenftePosten[];
  /** Geldwerte Vorteile (Rundfunkbefreiung, Sozialticket / Sozialpass) — keine Auszahlung, aber Ersparnis. */
  geldwerteVorteileJahr: number;
  geldwerteVorteileDetail: EinkuenftePosten[];
  kindergeldAngerechnetJahr: number;
  /** Jobcenter-Auszahlung (ohne geldwerte Vorteile, ohne Kindergeld). */
  gesamtLeistungJahr: number;
  mieteJahr: number;
  rundfunkbeitragJahr: number;
  oepnvJahr: number;
  /** Nicht angemeldete Nebeneinkünfte, reine Addition zum Verfügbaren. */
  schwarzarbeitJahr: number;
  /** Pauschalisierte Antragsleistungen (Preset), reine Addition zum Verfügbaren. */
  antragsLeistungenJahr: number;
  verfuegbarNachMieteJahr: number;
  verfuegbarNachMieteMonat: number;
}

export interface VergleichsErgebnis {
  szenario: Szenario;
  arbeit: ArbeitsErgebnis;
  buergergeld: BuergergeldErgebnis;
}
