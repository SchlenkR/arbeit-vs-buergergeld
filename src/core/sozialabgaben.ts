import { SV_2026 } from "./constants2026";
import type { AbgabenPosten } from "./types";

export interface SozialabgabenInput {
  /** Arbeitnehmer-Brutto (Jahresgehalt laut Arbeitsvertrag). */
  bruttoJahr: number;
  anzahlKinderUnter25: number;
  alterVersicherter: number;
}

export interface SozialabgabenErgebnis {
  /** Arbeitnehmer-Anteil (mindert Netto). */
  arbeitnehmerAnteilJahr: number;
  /** Arbeitgeber-Anteil (oberhalb des Brutto = Lohnnebenkosten). */
  arbeitgeberAnteilJahr: number;
  gkvANJahr: number;
  gkvAGJahr: number;
  pvANJahr: number;
  pvAGJahr: number;
  rvANJahr: number;
  rvAGJahr: number;
  avANJahr: number;
  avAGJahr: number;
  /** AN-Detail für die Anzeige auf der Netto-Seite. */
  detail: AbgabenPosten[];
}

/**
 * Sozialabgaben eines sozialversicherungspflichtig Angestellten, Rechtsstand 2026.
 *
 * GKV/PV-Bemessung: Brutto bis BBG 5.812,50 €/Monat.
 * RV/AV-Bemessung: Brutto bis BBG 8.450 €/Monat.
 * Sätze paritätisch (AN = AG), außer PV-Kinderlos-Zuschlag (+0,6 % nur AN) und
 * PV-Kinderabschlag ab 2. Kind < 25 (−0,25 % je Kind, 2.–5., nur AN).
 */
export function berechneSozialabgabenAngestellt(
  input: SozialabgabenInput,
): SozialabgabenErgebnis {
  const bruttoMonat = input.bruttoJahr / 12;
  const bemessungGkv = Math.min(bruttoMonat, SV_2026.bbgGkvPvMonat);
  const bemessungRv = Math.min(bruttoMonat, SV_2026.bbgRvAlvMonat);

  const gkvSatzGesamt = SV_2026.gkvSatzAllgemein + SV_2026.gkvZusatzbeitragDurchschnitt;
  const gkvHalb = gkvSatzGesamt / 2;

  const pvSatzAN = berechnePflegeversicherungssatzAN2026(
    input.anzahlKinderUnter25,
    input.alterVersicherter,
  );
  const pvSatzAG = SV_2026.pvSatzMitKind / 2;

  const rvHalb = SV_2026.rvSatz / 2;
  const avHalb = SV_2026.avSatz / 2;

  const gkvANMonat = bemessungGkv * gkvHalb;
  const gkvAGMonat = bemessungGkv * gkvHalb;
  const pvANMonat = bemessungGkv * pvSatzAN;
  const pvAGMonat = bemessungGkv * pvSatzAG;
  const rvANMonat = bemessungRv * rvHalb;
  const rvAGMonat = bemessungRv * rvHalb;
  const avANMonat = bemessungRv * avHalb;
  const avAGMonat = bemessungRv * avHalb;

  const gkvANJahr = roundEuro(gkvANMonat * 12);
  const gkvAGJahr = roundEuro(gkvAGMonat * 12);
  const pvANJahr = roundEuro(pvANMonat * 12);
  const pvAGJahr = roundEuro(pvAGMonat * 12);
  const rvANJahr = roundEuro(rvANMonat * 12);
  const rvAGJahr = roundEuro(rvAGMonat * 12);
  const avANJahr = roundEuro(avANMonat * 12);
  const avAGJahr = roundEuro(avAGMonat * 12);

  const arbeitnehmerAnteilJahr = roundEuro(
    gkvANJahr + pvANJahr + rvANJahr + avANJahr,
  );
  const arbeitgeberAnteilJahr = roundEuro(
    gkvAGJahr + pvAGJahr + rvAGJahr + avAGJahr,
  );

  return {
    arbeitnehmerAnteilJahr,
    arbeitgeberAnteilJahr,
    gkvANJahr,
    gkvAGJahr,
    pvANJahr,
    pvAGJahr,
    rvANJahr,
    rvAGJahr,
    avANJahr,
    avAGJahr,
    detail: [
      { label: "Krankenversicherung (AN-Anteil)", betragJahr: gkvANJahr },
      { label: "Pflegeversicherung (AN-Anteil)", betragJahr: pvANJahr },
      { label: "Rentenversicherung (AN-Anteil)", betragJahr: rvANJahr },
      { label: "Arbeitslosenversicherung (AN-Anteil)", betragJahr: avANJahr },
    ],
  };
}

/**
 * PV-Beitragssatz 2026 *auf Arbeitnehmerseite*. AG-Seite trägt immer 1,8 % flat.
 * Regelfall mit 1 Kind / Kind > 25: 1,8 %.
 * Kinderlos ab 23: +0,6 % Zuschlag = 2,4 %.
 * Ab 2. Kind unter 25: je Kind −0,25 % (2.–5.), Boden 0,80 % bei 5+ Kindern unter 25.
 */
export function berechnePflegeversicherungssatzAN2026(
  anzahlKinderUnter25: number,
  alter: number,
): number {
  const basis = SV_2026.pvSatzMitKind / 2;
  if (anzahlKinderUnter25 === 0) {
    return alter >= 23 ? basis + SV_2026.pvZuschlagKinderlos : basis;
  }
  const rabattStufen =
    Math.min(anzahlKinderUnter25, SV_2026.pvMaxKinderrabattStufe) -
    SV_2026.pvMinKinderrabattStufe +
    1;
  if (rabattStufen <= 0) return basis;
  return basis - rabattStufen * SV_2026.pvAbschlagProKindAb2;
}

function roundEuro(v: number): number {
  return Math.round(v * 100) / 100;
}
