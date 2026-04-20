import {
  KINDERGELD_EUR_MONAT,
  RUNDFUNKBEITRAG_EUR_MONAT,
  OEPNV_2026,
} from "./constants2026";
import { berechneBuergergeld2026 } from "./buergergeld";
import { berechneSozialabgabenAngestellt } from "./sozialabgaben";
import {
  einkommensteuer2026,
  einkommensteuerSplitting2026,
  guenstigerpruefung2026,
  solidaritaetszuschlag2026,
} from "./steuer";
import { berechneWohngeld2026, berechneKinderzuschlag2026 } from "./wohngeld";
import type { ArbeitsErgebnis, Szenario, VergleichsErgebnis } from "./types";

const ARBEITNEHMER_PAUSCHBETRAG_2026 = 1230;
const SONSTIGE_VORSORGE_CAP_ARBEITNEHMER = 1900;
const SONSTIGE_VORSORGE_CAP_FAMILIENVERSICHERTER_EHEPARTNER = 2800;
const GKV_BASISABSICHERUNG_FAKTOR = 0.96;

/**
 * Vereinfachtes Steuermodell sozialversicherungspflichtig Angestellter 2026:
 * - zvE = Brutto − abziehbare Vorsorgeaufwendungen (§ 10 EStG) − Arbeitnehmer-Pauschbetrag 1.230 €
 *   − Sonderausgabenpauschale 36 € (Ledige) / 72 € (Verheiratete).
 * - RV-Beiträge sind seit 2023 voll abziehbar (§ 10 Abs. 3 EStG).
 * - GKV-Basisabsicherung ist abziehbar, bei Krankengeldanspruch mit 4-%-Abschlag
 *   (§ 10 Abs. 1 Nr. 3a Satz 4 EStG); PV voll.
 * - AV fällt unter § 10 Abs. 1 Nr. 3a EStG und ist nur insoweit berücksichtigt,
 *   wie der sonstige Vorsorge-Höchstbetrag noch nicht durch KV/PV ausgeschöpft ist.
 * - Kinderfreibetrag über Günstigerprüfung.
 * - Soli nur falls Freigrenze überschritten; bei günstigerem Kinderfreibetrag auf Basis
 *   der festzusetzenden ESt vor Kindergeld-Zurechnung.
 *
 * Nicht modelliert: Werbungskosten jenseits des Pauschbetrags, Kirchensteuer,
 * außergewöhnliche Belastungen, Pendlerpauschale-spezifisch, Steuerklassen (implizit I/III).
 */
export function berechneVergleich(szenario: Szenario): VergleichsErgebnis {
  const arbeit = berechneArbeitsErgebnis(szenario);
  const buergergeld = berechneBuergergeld2026(szenario.haushalt, szenario.buergergeld);

  return { szenario, arbeit, buergergeld };
}

function berechneArbeitsErgebnis(szenario: Szenario): ArbeitsErgebnis {
  const { haushalt, arbeit } = szenario;
  const verheiratet = haushalt.typ === "paar_verheiratet";
  const anzahlKinder = haushalt.kinder.length;
  const kinderU25 = haushalt.kinder.filter((k) => k.alter < 25).length;

  const sv = berechneSozialabgabenAngestellt({
    bruttoJahr: arbeit.bruttoJahr,
    anzahlKinderUnter25: kinderU25,
    alterVersicherter: 35,
  });

  const sonderausgabenPauschale = verheiratet ? 72 : 36;
  const vorsorgeaufwendungenJahr = berechneAbziehbareVorsorgeaufwendungen2026(
    sv,
    verheiratet,
  );
  const zvEOhneKiFrB = Math.max(
    0,
    arbeit.bruttoJahr -
      vorsorgeaufwendungenJahr -
      ARBEITNEHMER_PAUSCHBETRAG_2026 -
      sonderausgabenPauschale,
  );

  const kindergeldJahr = anzahlKinder * KINDERGELD_EUR_MONAT * 12;

  let einkommensteuerJahr: number;
  let soliBemessungsgrundlageJahr: number;
  let steuerlicheEntlastungDurchKinderfreibetrag = 0;

  if (anzahlKinder === 0) {
    einkommensteuerJahr = verheiratet
      ? einkommensteuerSplitting2026(zvEOhneKiFrB)
      : einkommensteuer2026(zvEOhneKiFrB);
    soliBemessungsgrundlageJahr = einkommensteuerJahr;
  } else {
    const gp = guenstigerpruefung2026({
      zvEOhneKiFrB,
      anzahlKinder,
      kindergeldJahr,
      verheiratet,
    });
    einkommensteuerJahr = gp.effektiveSteuer;
    soliBemessungsgrundlageJahr = gp.soliBemessungsgrundlage;
    steuerlicheEntlastungDurchKinderfreibetrag = gp.steuerersparnisDurchFreibetrag;
  }

  const soliJahr = solidaritaetszuschlag2026(soliBemessungsgrundlageJahr, verheiratet);

  const personen =
    (haushalt.typ === "paar" || verheiratet ? 2 : 1) + anzahlKinder;
  const wohngeld = berechneWohngeld2026({
    personenImHaushalt: personen,
    mieteMonat: haushalt.warmmieteEurProMonat,
    bruttoJahrGesamtEinkommen: arbeit.bruttoJahr,
  });
  const kiz = berechneKinderzuschlag2026({
    anzahlKinder,
    bruttoJahrElternEinkommen: arbeit.bruttoJahr,
    alleinerziehend: haushalt.typ === "alleinerziehend",
  });

  const mieteJahr = haushalt.warmmieteEurProMonat * 12;

  // Lebenshaltungskosten, die auch auf der Bürgergeld-Seite anfallen (dort aber reduziert/null):
  // Rundfunkbeitrag voll, ÖPNV Deutschlandticket regulär je Nutzer.
  const rundfunkbeitragJahr = RUNDFUNKBEITRAG_EUR_MONAT * 12;
  const oepnvJahr =
    haushalt.oepnvNutzer *
    OEPNV_2026.deutschlandticketRegulaerEurMonat *
    12;

  const nettoNachAllemJahr = roundEuro(
    arbeit.bruttoJahr -
      sv.arbeitnehmerAnteilJahr -
      einkommensteuerJahr -
      soliJahr +
      kindergeldJahr +
      wohngeld.betragJahr +
      kiz.betragJahr -
      mieteJahr -
      rundfunkbeitragJahr -
      oepnvJahr,
  );

  const gesamtBruttoJahr = roundEuro(arbeit.bruttoJahr + sv.arbeitgeberAnteilJahr);

  return {
    bruttoJahr: arbeit.bruttoJahr,
    arbeitgeberAnteilJahr: sv.arbeitgeberAnteilJahr,
    gesamtBruttoJahr,
    sozialabgabenJahr: sv.arbeitnehmerAnteilJahr,
    sozialabgabenDetail: sv.detail,
    abziehbareVorsorgeaufwendungenJahr: vorsorgeaufwendungenJahr,
    einkommensteuerJahr: roundEuro(einkommensteuerJahr),
    soliBemessungsgrundlageJahr: roundEuro(soliBemessungsgrundlageJahr),
    soliJahr,
    zvE: zvEOhneKiFrB,
    steuerlicheEntlastungDurchKinderfreibetrag,
    kindergeldJahr,
    wohngeldJahr: wohngeld.betragJahr,
    kinderzuschlagJahr: kiz.betragJahr,
    mieteJahr,
    rundfunkbeitragJahr,
    oepnvJahr,
    nettoNachAllemJahr,
    nettoNachAllemMonat: roundEuro(nettoNachAllemJahr / 12),
  };
}

function roundEuro(v: number): number {
  return Math.round(v * 100) / 100;
}

function berechneAbziehbareVorsorgeaufwendungen2026(
  sv: ReturnType<typeof berechneSozialabgabenAngestellt>,
  verheiratet: boolean,
): number {
  const rvAbziehbar = sv.rvANJahr;
  const kvBasisAbziehbar = roundEuro(sv.gkvANJahr * GKV_BASISABSICHERUNG_FAKTOR);
  const pvAbziehbar = sv.pvANJahr;
  const basisKrankenPflege = roundEuro(kvBasisAbziehbar + pvAbziehbar);

  const sonstigeVorsorgeCap = verheiratet
    ? SONSTIGE_VORSORGE_CAP_ARBEITNEHMER +
      SONSTIGE_VORSORGE_CAP_FAMILIENVERSICHERTER_EHEPARTNER
    : SONSTIGE_VORSORGE_CAP_ARBEITNEHMER;
  const restCap = Math.max(0, sonstigeVorsorgeCap - basisKrankenPflege);
  const avAbziehbar = Math.min(sv.avANJahr, restCap);

  return roundEuro(rvAbziehbar + basisKrankenPflege + avAbziehbar);
}
