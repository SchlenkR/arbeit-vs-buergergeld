import { describe, expect, it } from "vitest";
import { berechneVergleich } from "./compare";
import type { Szenario } from "./types";

function szenario(overrides: Partial<Szenario["haushalt"]> & { brutto: number }): Szenario {
  return {
    haushalt: {
      typ: "single",
      kinder: [],
      wohnlage: "A",
      wohnflaecheQm: 50,
      warmmieteEurProMonat: 1086,
      warmwasserDezentral: false,
      schwangerschaftAb13SSW: false,
      oepnvNutzer: 1,
      ...overrides,
    },
    arbeit: {
      bruttoJahr: overrides.brutto,
    },
    buergergeld: { schwarzarbeitEurMonat: 0, antragsLeistungenEurMonat: 0 },
  };
}

describe("Smoke: realistische Szenarien Frankfurt 2026", () => {
  it("Single, 60k Brutto, ohne RV", () => {
    const r = berechneVergleich(szenario({ brutto: 60000 }));
    console.log("\n=== Single 60k Brutto ===");
    console.log("Arbeit:", {
      brutto: r.arbeit.bruttoJahr,
      sv: r.arbeit.sozialabgabenJahr,
      est: r.arbeit.einkommensteuerJahr,
      miete: r.arbeit.mieteJahr,
      nettoJahr: r.arbeit.nettoNachAllemJahr,
      nettoMonat: r.arbeit.nettoNachAllemMonat,
    });
    console.log("Bürgergeld:", {
      regelbedarf: r.buergergeld.regelbedarfJahr,
      kdu: r.buergergeld.kdUJahr,
      miete: r.buergergeld.mieteJahr,
      verfuegbarMonat: r.buergergeld.verfuegbarNachMieteMonat,
    });
    expect(r.arbeit.nettoNachAllemMonat).toBeGreaterThan(0);
    expect(r.arbeit.sozialabgabenJahr).toBeGreaterThan(10000);
  });

  it("Paar verheiratet + 2 Kinder, 70k Brutto", () => {
    const s = szenario({
      typ: "paar_verheiratet",
      kinder: [{ alter: 4 }, { alter: 10 }],
      brutto: 70000,
      warmmieteEurProMonat: 1600,
    });
    const r = berechneVergleich(s);
    console.log("\n=== Paar verh. + 2 Kinder, 70k Brutto ===");
    console.log("Arbeit:", {
      brutto: r.arbeit.bruttoJahr,
      sv: r.arbeit.sozialabgabenJahr,
      est: r.arbeit.einkommensteuerJahr,
      kindergeld: r.arbeit.kindergeldJahr,
      miete: r.arbeit.mieteJahr,
      nettoMonat: r.arbeit.nettoNachAllemMonat,
    });
    console.log("Bürgergeld:", {
      regelbedarf: r.buergergeld.regelbedarfJahr,
      kdu: r.buergergeld.kdUJahr,
      verfuegbarMonat: r.buergergeld.verfuegbarNachMieteMonat,
    });
    expect(r.arbeit.kindergeldJahr).toBe(2 * 259 * 12);
  });

  it("Alleinerziehend + 4 Kinder (3, 7, 10, 14), 45k Brutto", () => {
    const s = szenario({
      typ: "alleinerziehend",
      kinder: [{ alter: 3 }, { alter: 7 }, { alter: 10 }, { alter: 14 }],
      brutto: 45000,
      warmmieteEurProMonat: 1800,
    });
    const r = berechneVergleich(s);
    console.log("\n=== Alleinerziehend + 4 Kinder, 45k Brutto ===");
    console.log("Bürgergeld Detail:");
    for (const p of r.buergergeld.regelbedarfDetail) {
      console.log(`  ${p.label}: ${p.betragJahr}`);
    }
    console.log({
      regelbedarfSum: r.buergergeld.regelbedarfJahr,
      mbAlleinerziehend: r.buergergeld.mehrbedarfAlleinerziehendJahr,
      mbWarmwasser: r.buergergeld.mehrbedarfWarmwasserJahr,
      mbSchwangerschaft: r.buergergeld.mehrbedarfSchwangerschaftJahr,
      kdu: r.buergergeld.kdUJahr,
      butGesamt: r.buergergeld.butGesamtJahr,
      geldwerteVorteile: r.buergergeld.geldwerteVorteileJahr,
      kgAngerechnet: r.buergergeld.kindergeldAngerechnetJahr,
      verfuegbarMonat: r.buergergeld.verfuegbarNachMieteMonat,
    });
    console.log("Arbeit:", {
      sv: r.arbeit.sozialabgabenJahr,
      est: r.arbeit.einkommensteuerJahr,
      kg: r.arbeit.kindergeldJahr,
      nettoMonat: r.arbeit.nettoNachAllemMonat,
    });
    expect(r.buergergeld.mehrbedarfAlleinerziehendJahr).toBeGreaterThan(0);
  });
});
