import { describe, expect, it } from "vitest";
import { berechneBuergergeld2026 } from "./buergergeld";

describe("Bürgergeld: Schwangerschafts-Mehrbedarf", () => {
  it("verwendet bei Paaren den maßgebenden Partner-Regelbedarf", () => {
    const r = berechneBuergergeld2026({
      typ: "paar_verheiratet",
      kinder: [],
      wohnlage: "A",
      wohnflaecheQm: 60,
      warmmieteEurProMonat: 1300,
      warmwasserDezentral: false,
      schwangerschaftAb13SSW: true,
      oepnvNutzer: 0,
    });

    expect(r.mehrbedarfSchwangerschaftJahr).toBeCloseTo(506 * 0.17 * 12, 2);
  });
});