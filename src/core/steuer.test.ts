import { describe, expect, it } from "vitest";
import {
  einkommensteuer2026,
  einkommensteuerSplitting2026,
  solidaritaetszuschlag2026,
  guenstigerpruefung2026,
} from "./steuer";

describe("Einkommensteuer 2026 Grundtarif (§32a EStG)", () => {
  it("bei zvE <= Grundfreibetrag 12.348 € ist Steuer 0", () => {
    expect(einkommensteuer2026(0)).toBe(0);
    expect(einkommensteuer2026(12348)).toBe(0);
  });

  it("an der Grenze Zone2→Zone3 (17.799 €) ist ESt ≈ 1.034,87 €", () => {
    const est = einkommensteuer2026(17799);
    expect(est).toBeGreaterThan(1000);
    expect(est).toBeLessThan(1070);
  });

  it("an der Grenze Zone3→Zone4 (69.878 €) liefert kontinuierliche Funktion", () => {
    const estZone3Ende = einkommensteuer2026(69878);
    const estZone4Start = einkommensteuer2026(69879);
    expect(Math.abs(estZone3Ende - estZone4Start)).toBeLessThan(1);
  });

  it("in Zone 4 gilt 0,42·x − 11.135,63", () => {
    expect(einkommensteuer2026(100000)).toBeCloseTo(0.42 * 100000 - 11135.63, 2);
  });

  it("in Zone 5 (ab 277.826 €) gilt 0,45·x − 19.470,38", () => {
    expect(einkommensteuer2026(300000)).toBeCloseTo(0.45 * 300000 - 19470.38, 2);
  });

  it("Splitting-Tarif bei 2× Einzel-zvE entspricht 2× Einzel-ESt", () => {
    const zvEPaar = 80000;
    expect(einkommensteuerSplitting2026(zvEPaar)).toBeCloseTo(
      2 * einkommensteuer2026(zvEPaar / 2),
      2,
    );
  });
});

describe("Solidaritätszuschlag 2026", () => {
  it("keine Soli unterhalb Freigrenze 20.350 € ESt (Einzel)", () => {
    expect(solidaritaetszuschlag2026(20350, false)).toBe(0);
  });

  it("Milderungszone knapp oberhalb Freigrenze", () => {
    const soli = solidaritaetszuschlag2026(21000, false);
    expect(soli).toBeGreaterThan(0);
    expect(soli).toBeLessThan(21000 * 0.055);
  });

  it("voller Soli-Satz bei sehr hoher ESt", () => {
    const est = 100000;
    expect(solidaritaetszuschlag2026(est, false)).toBeCloseTo(est * 0.055, 2);
  });

  it("verheiratet: Freigrenze verdoppelt", () => {
    expect(solidaritaetszuschlag2026(40700, true)).toBe(0);
    expect(solidaritaetszuschlag2026(50000, true)).toBeGreaterThan(0);
  });
});

describe("Günstigerprüfung Kindergeld vs. Kinderfreibetrag", () => {
  it("bei niedrigem zvE bleibt Kindergeld günstiger (effektive Steuer = ESt ohne FrB)", () => {
    const gp = guenstigerpruefung2026({
      zvEOhneKiFrB: 30000,
      anzahlKinder: 1,
      kindergeldJahr: 259 * 12,
      verheiratet: false,
    });
    expect(gp.freibetragGuenstiger).toBe(false);
    expect(gp.effektiveSteuer).toBe(gp.estOhneFrB);
  });

  it("bei hohem zvE wird Freibetrag günstiger", () => {
    const gp = guenstigerpruefung2026({
      zvEOhneKiFrB: 150000,
      anzahlKinder: 1,
      kindergeldJahr: 259 * 12,
      verheiratet: false,
    });
    expect(gp.freibetragGuenstiger).toBe(true);
    expect(gp.steuerersparnisDurchFreibetrag).toBeGreaterThan(0);
  });

  it("bei nicht zusammen veranlagten Eltern zählt standardmäßig nur der hälftige Freibetrag und KG-Anteil", () => {
    const gp = guenstigerpruefung2026({
      zvEOhneKiFrB: 150000,
      anzahlKinder: 1,
      kindergeldJahr: 259 * 12,
      verheiratet: false,
    });

    expect(gp.estMitFrB).toBeCloseTo(einkommensteuer2026(150000 - (3414 + 1464)), 2);
    expect(gp.effektiveSteuer).toBeCloseTo(gp.estMitFrB + (259 * 12) / 2, 2);
  });

  it("bei zusammen veranlagten Ehegatten zählt der volle Freibetrag und volle KG-Anspruch", () => {
    const gp = guenstigerpruefung2026({
      zvEOhneKiFrB: 150000,
      anzahlKinder: 1,
      kindergeldJahr: 259 * 12,
      verheiratet: true,
    });

    expect(gp.estMitFrB).toBeCloseTo(
      einkommensteuerSplitting2026(150000 - 2 * (3414 + 1464)),
      2,
    );
    expect(gp.effektiveSteuer).toBeCloseTo(gp.estMitFrB + 259 * 12, 2);
  });
});
