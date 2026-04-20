import { describe, expect, it } from "vitest";
import { berechneVergleich } from "./compare";
import { berechneSozialabgabenAngestellt } from "./sozialabgaben";

describe("Arbeitsseite: steuerliche Vorsorgeaufwendungen", () => {
  it("zieht GKV nicht vollständig und AV nur begrenzt nach § 10 EStG ab", () => {
    const bruttoJahr = 60000;
    const sv = berechneSozialabgabenAngestellt({
      bruttoJahr,
      anzahlKinderUnter25: 0,
      alterVersicherter: 35,
    });

    const erwarteteVorsorge =
      sv.rvANJahr +
      Math.round((sv.gkvANJahr * 0.96 + sv.pvANJahr) * 100) / 100;
    const erwartetesZvE = Math.max(0, bruttoJahr - erwarteteVorsorge - 1230 - 36);

    const r = berechneVergleich({
      haushalt: {
        typ: "single",
        kinder: [],
        wohnlage: "A",
        wohnflaecheQm: 50,
        warmmieteEurProMonat: 1086,
        warmwasserDezentral: false,
        schwangerschaftAb13SSW: false,
        oepnvNutzer: 1,
      },
      arbeit: { bruttoJahr },
      buergergeld: { schwarzarbeitEurMonat: 0, antragsLeistungenEurMonat: 0 },
    });

    expect(r.arbeit.zvE).toBeCloseTo(erwartetesZvE, 2);
  });

  it("berechnet den Soli bei Kinderfreibetrag aus der festzusetzten ESt vor Kindergeld-Zurechnung", () => {
    const r = berechneVergleich({
      haushalt: {
        typ: "paar_verheiratet",
        kinder: [{ alter: 7 }, { alter: 10 }],
        wohnlage: "A",
        wohnflaecheQm: 87,
        warmmieteEurProMonat: 1600,
        warmwasserDezentral: false,
        schwangerschaftAb13SSW: false,
        oepnvNutzer: 4,
      },
      arbeit: { bruttoJahr: 175000 },
      buergergeld: { schwarzarbeitEurMonat: 0, antragsLeistungenEurMonat: 0 },
    });

    expect(r.arbeit.einkommensteuerJahr).toBeGreaterThan(40700);
    expect(r.arbeit.soliBemessungsgrundlageJahr).toBeLessThan(40700);
    expect(r.arbeit.soliJahr).toBe(0);
  });
});