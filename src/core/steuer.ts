import { EST_TARIF_2026, SOLI_2026, KINDERFREIBETRAG_2026 } from "./constants2026";

/**
 * Einkommensteuer 2026 nach § 32a EStG, Grundtarif (Einzelveranlagung).
 * Splitting-Verfahren (Ehegatten) siehe {@link einkommensteuerSplitting}.
 * zvE = zu versteuerndes Einkommen. Rundung nach § 32a: Abrundung auf volle €.
 */
export function einkommensteuer2026(zvE: number): number {
  const x = Math.floor(Math.max(0, zvE));
  const t = EST_TARIF_2026;

  if (x <= t.grundfreibetrag) return 0;

  if (x <= t.zone2Ende) {
    const y = (x - t.grundfreibetrag) / 10000;
    return roundEuro((t.zone2.faktorY2 * y + t.zone2.faktorY) * y);
  }

  if (x <= t.zone3Ende) {
    const z = (x - t.zone2Ende) / 10000;
    return roundEuro((t.zone3.faktorZ2 * z + t.zone3.faktorZ) * z + t.zone3.konstant);
  }

  if (x <= t.zone4Ende) {
    return roundEuro(t.zone4.faktor * x - t.zone4.abzug);
  }

  return roundEuro(t.zone5.faktor * x - t.zone5.abzug);
}

/**
 * Ehegatten-Splitting: ESt = 2 × Grundtarif(zvE/2).
 */
export function einkommensteuerSplitting2026(zvE: number): number {
  return 2 * einkommensteuer2026(zvE / 2);
}

/**
 * Solidaritätszuschlag 2026 mit Freigrenze und Milderungszone (Einzelveranlagung).
 */
export function solidaritaetszuschlag2026(est: number, verheiratet: boolean): number {
  const freigrenze = verheiratet
    ? SOLI_2026.freigrenzeEstEinzeln * 2
    : SOLI_2026.freigrenzeEstEinzeln;

  if (est <= freigrenze) return 0;

  const vollerSoli = est * SOLI_2026.satz;
  const milderung = SOLI_2026.milderungsFaktor * (est - freigrenze);
  return roundEuro(Math.min(vollerSoli, milderung));
}

/**
 * Günstigerprüfung Kindergeld vs. Kinderfreibetrag (§ 31 EStG).
 * Vergleicht die Steuerersparnis durch den Freibetrag mit dem bereits gezahlten Kindergeld.
 *
 * Standardannahme im Modell:
 * - zusammen veranlagte Ehegatten: voller Kinderfreibetrag und voller Kindergeldanspruch
 * - nicht zusammen veranlagte Eltern: hälftiger Freibetrag und hälftiger Kindergeldanteil
 *   (§ 31 Satz 4, § 32 Abs. 6 EStG), sofern keine beantragte Übertragung vorliegt.
 *
 * Eingaben:
 * - zvEOhneKiFrB: zvE vor Abzug der Kinderfreibeträge
 * - anzahlKinder
 * - kindergeldJahr: das im Veranlagungszeitraum erhaltene Kindergeld
 * - verheiratet: Splitting-Tarif?
 *
 * Rückgabe: tatsächliche Lohn-/Einkommensteuer-Belastung (wenn Freibetrag günstiger, wird er
 * angesetzt und das Kindergeld hinzugerechnet; sonst bleibt es bei der ESt ohne Freibetrag).
 */
export function guenstigerpruefung2026(params: {
  zvEOhneKiFrB: number;
  anzahlKinder: number;
  kindergeldJahr: number;
  verheiratet: boolean;
}): {
  estOhneFrB: number;
  estMitFrB: number;
  freibetragGuenstiger: boolean;
  effektiveSteuer: number;
  soliBemessungsgrundlage: number;
  steuerersparnisDurchFreibetrag: number;
} {
  const tarif = params.verheiratet ? einkommensteuerSplitting2026 : einkommensteuer2026;
  const anteilKinderfreibetrag = params.verheiratet ? 1 : 0.5;
  const freibetragProKind =
    (KINDERFREIBETRAG_2026.saechlichesExistenzminimum + KINDERFREIBETRAG_2026.bea) *
    anteilKinderfreibetrag;
  const gesamterFreibetrag = params.anzahlKinder * freibetragProKind;
  const kindergeldAnteilJahr = params.kindergeldJahr * anteilKinderfreibetrag;

  const estOhneFrB = tarif(params.zvEOhneKiFrB);
  const estMitFrB = tarif(Math.max(0, params.zvEOhneKiFrB - gesamterFreibetrag));
  const steuerersparnis = estOhneFrB - estMitFrB;

  if (steuerersparnis > kindergeldAnteilJahr) {
    // Für den Soli zählt die festzusetzende ESt nach Kinderfreibetrag.
    // Die Kindergeld-Zurechnung aus der Günstigerprüfung erhöht den Soli nicht.
    return {
      estOhneFrB,
      estMitFrB,
      freibetragGuenstiger: true,
      effektiveSteuer: estMitFrB + kindergeldAnteilJahr,
      soliBemessungsgrundlage: estMitFrB,
      steuerersparnisDurchFreibetrag: steuerersparnis - kindergeldAnteilJahr,
    };
  }

  return {
    estOhneFrB,
    estMitFrB,
    freibetragGuenstiger: false,
    effektiveSteuer: estOhneFrB,
    soliBemessungsgrundlage: estOhneFrB,
    steuerersparnisDurchFreibetrag: 0,
  };
}

function roundEuro(v: number): number {
  return Math.round(v * 100) / 100;
}
