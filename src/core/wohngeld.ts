import {
  WOHNGELD_HOECHSTBETRAG_STUFE_VII,
  KINDERZUSCHLAG_2026,
} from "./constants2026";

/**
 * Wohngeld und Kinderzuschlag — Platzhalter-Implementierung.
 *
 * BEGRÜNDUNG: Die exakten Parameter a/b/c aus Anlage 2 WoGG für die §19-Formel
 *   W = 1,15 · (M − (a + b·M + c·Y) · Y)
 * wurden für 2026 noch nicht vollständig erhoben. Ebenso fehlen für den KiZ die
 * detaillierten Anrechnungsregeln (§ 6a Abs. 6 BKGG) über die Pauschalen hinaus.
 *
 * Um kein falsches Ergebnis zu produzieren, liefert das Modul derzeit 0 €
 * und meldet explizit, dass eine Anspruchsprüfung nötig ist. Die obere Schranke
 * (Höchstmiete Mietenstufe VII Frankfurt) wird zurückgegeben, damit die UI
 * sichtbar machen kann, in welchem Rahmen sich ein Anspruch bewegen würde.
 *
 * TODO(2026-05): Vollständige §19-WoGG-Formel mit Tabelle Anlage 2 implementieren,
 *                gegen wohngeld.org-Rechner testen.
 */
export function berechneWohngeld2026(_params: {
  personenImHaushalt: number;
  mieteMonat: number;
  bruttoJahrGesamtEinkommen: number;
}): {
  betragJahr: number;
  hoechstMieteBerucksichtigungsfaehigMonat: number;
  nichtImplementiert: true;
} {
  const p = Math.max(1, Math.min(5, _params.personenImHaushalt));
  const zusatzPersonen = Math.max(0, _params.personenImHaushalt - 5);
  const tabellen = WOHNGELD_HOECHSTBETRAG_STUFE_VII;
  const grundbetragProPerson: Record<number, number> = {
    1: tabellen.stufe1Person,
    2: tabellen.stufe2Person,
    3: tabellen.stufe3Person,
    4: tabellen.stufe4Person,
    5: tabellen.stufe5Person,
  };
  const hoechstMiete =
    grundbetragProPerson[p]! + zusatzPersonen * tabellen.jeWeiterePerson;

  return {
    betragJahr: 0,
    hoechstMieteBerucksichtigungsfaehigMonat: hoechstMiete,
    nichtImplementiert: true,
  };
}

export function berechneKinderzuschlag2026(_params: {
  anzahlKinder: number;
  bruttoJahrElternEinkommen: number;
  alleinerziehend: boolean;
}): {
  betragJahr: number;
  hoechstbetragMonatProKind: number;
  nichtImplementiert: true;
} {
  return {
    betragJahr: 0,
    hoechstbetragMonatProKind: KINDERZUSCHLAG_2026.hoechstbetragEurMonat,
    nichtImplementiert: true,
  };
}
