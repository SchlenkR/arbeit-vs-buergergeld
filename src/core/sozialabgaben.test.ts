import { describe, expect, it } from "vitest";
import {
  berechnePflegeversicherungssatzAN2026,
  berechneSozialabgabenAngestellt,
} from "./sozialabgaben";
import { SV_2026 } from "./constants2026";

describe("Pflegeversicherungssatz 2026 (AN-Anteil)", () => {
  it("kinderlos ab 23: 1,8 % + 0,6 % = 2,4 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(0, 30)).toBeCloseTo(0.024);
  });

  it("kinderlos unter 23: 1,8 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(0, 22)).toBeCloseTo(0.018);
  });

  it("1 Kind: 1,8 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(1, 35)).toBeCloseTo(0.018);
  });

  it("2 Kinder: 1,55 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(2, 35)).toBeCloseTo(0.0155);
  });

  it("4 Kinder: 1,05 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(4, 35)).toBeCloseTo(0.0105);
  });

  it("6 Kinder unter 25: Boden bei 0,80 %", () => {
    expect(berechnePflegeversicherungssatzAN2026(6, 35)).toBeCloseTo(0.008);
  });
});

describe("Sozialabgaben Angestellt 2026", () => {
  it("paritätische Sätze: AN ≈ AG für GKV/RV/AV (außer PV-Zuschläge)", () => {
    const r = berechneSozialabgabenAngestellt({
      bruttoJahr: 60000,
      anzahlKinderUnter25: 1,
      alterVersicherter: 35,
    });
    expect(r.gkvANJahr).toBeCloseTo(r.gkvAGJahr, 0);
    expect(r.rvANJahr).toBeCloseTo(r.rvAGJahr, 0);
    expect(r.avANJahr).toBeCloseTo(r.avAGJahr, 0);
    // 1 Kind: PV AN = AG = 1,8 % halber Satz
    expect(r.pvANJahr).toBeCloseTo(r.pvAGJahr, 0);
  });

  it("Brutto oberhalb beider BBG: Deckelung greift auf beiden Seiten", () => {
    const r = berechneSozialabgabenAngestellt({
      bruttoJahr: 200000,
      anzahlKinderUnter25: 0,
      alterVersicherter: 35,
    });
    // RV AN: BBG RV/AV × 12 × (18,6 % / 2)
    const erwarteteRvAn = SV_2026.bbgRvAlvMonat * 12 * (SV_2026.rvSatz / 2);
    expect(r.rvANJahr).toBeCloseTo(erwarteteRvAn, 0);
    // GKV AN: BBG GKV/PV × 12 × (14,6 % + 2,9 %) / 2
    const gkvSatzGesamt =
      SV_2026.gkvSatzAllgemein + SV_2026.gkvZusatzbeitragDurchschnitt;
    const erwarteteGkvAn = SV_2026.bbgGkvPvMonat * 12 * (gkvSatzGesamt / 2);
    expect(r.gkvANJahr).toBeCloseTo(erwarteteGkvAn, 0);
  });

  it("kinderlos ab 23: PV AN trägt Zuschlag, AG nicht", () => {
    const r = berechneSozialabgabenAngestellt({
      bruttoJahr: 60000,
      anzahlKinderUnter25: 0,
      alterVersicherter: 30,
    });
    // AN = 2,4 %, AG = 1,8 % — AN > AG um 0,6 % × bemessung × 12
    expect(r.pvANJahr).toBeGreaterThan(r.pvAGJahr);
  });

  it("AN-Anteil summiert GKV + PV + RV + AV", () => {
    const r = berechneSozialabgabenAngestellt({
      bruttoJahr: 60000,
      anzahlKinderUnter25: 0,
      alterVersicherter: 35,
    });
    const summe = r.gkvANJahr + r.pvANJahr + r.rvANJahr + r.avANJahr;
    expect(r.arbeitnehmerAnteilJahr).toBeCloseTo(summe, 0);
  });
});
