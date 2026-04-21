import type { VergleichsErgebnis } from "./types";
import { T, fmtEur } from "../i18n";

export interface SankeyNode {
  id: string;
  label: string;
  category: "source" | "deduction" | "benefit" | "pool" | "sink";
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  title: string;
  footer: string;
}

export function sankeyArbeit(ergebnis: VergleichsErgebnis): SankeyData {
  const a = ergebnis.arbeit;
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  nodes.push({
    id: "brutto",
    label: T("Bruttoeinkommen", "Gross income"),
    category: "source",
  });

  for (const p of a.sozialabgabenDetail) {
    if (p.betragJahr <= 0) continue;
    const id = slug(p.label);
    nodes.push({ id, label: p.label, category: "deduction" });
    links.push({ source: "brutto", target: id, value: p.betragJahr });
  }

  if (a.einkommensteuerJahr > 0) {
    nodes.push({
      id: "est",
      label: T("Einkommensteuer", "Income tax"),
      category: "deduction",
    });
    links.push({ source: "brutto", target: "est", value: a.einkommensteuerJahr });
  }
  if (a.soliJahr > 0) {
    nodes.push({
      id: "soli",
      label: T("Solidaritätszuschlag", "Solidarity surcharge"),
      category: "deduction",
    });
    links.push({ source: "brutto", target: "soli", value: a.soliJahr });
  }

  const nachAbzug =
    a.bruttoJahr - a.sozialabgabenJahr - a.einkommensteuerJahr - a.soliJahr;

  nodes.push({
    id: "netto",
    label: T("Netto-Pool", "Net pool"),
    category: "pool",
  });
  if (nachAbzug > 0) {
    links.push({ source: "brutto", target: "netto", value: nachAbzug });
  }
  if (a.kindergeldJahr > 0) {
    nodes.push({
      id: "kindergeld",
      label: T("Kindergeld", "Child benefit"),
      category: "benefit",
    });
    links.push({ source: "kindergeld", target: "netto", value: a.kindergeldJahr });
  }
  if (a.wohngeldJahr > 0) {
    nodes.push({
      id: "wohngeld",
      label: T("Wohngeld", "Housing benefit"),
      category: "benefit",
    });
    links.push({ source: "wohngeld", target: "netto", value: a.wohngeldJahr });
  }
  if (a.kinderzuschlagJahr > 0) {
    nodes.push({
      id: "kiz",
      label: T("Kinderzuschlag", "Child supplement"),
      category: "benefit",
    });
    links.push({ source: "kiz", target: "netto", value: a.kinderzuschlagJahr });
  }

  if (a.mieteJahr > 0) {
    nodes.push({
      id: "miete",
      label: T("Miete (warm)", "Rent (warm)"),
      category: "sink",
    });
    links.push({ source: "netto", target: "miete", value: a.mieteJahr });
  }
  if (a.rundfunkbeitragJahr > 0) {
    nodes.push({
      id: "gez",
      label: T("Rundfunkbeitrag", "Broadcasting fee"),
      category: "sink",
    });
    links.push({ source: "netto", target: "gez", value: a.rundfunkbeitragJahr });
  }
  if (a.oepnvJahr > 0) {
    nodes.push({
      id: "oepnv",
      label: T("ÖPNV (regulär)", "Transit (regular)"),
      category: "sink",
    });
    links.push({ source: "netto", target: "oepnv", value: a.oepnvJahr });
  }
  nodes.push({
    id: "verfuegbar",
    label: T("Frei verfügbar", "Free disposable"),
    category: "sink",
  });
  links.push({
    source: "netto",
    target: "verfuegbar",
    value: Math.max(0, a.nettoNachAllemJahr),
  });

  return {
    nodes,
    links,
    title: T(
      `Arbeit (Brutto ${fmtEur(a.bruttoJahr)})`,
      `Work (Gross ${fmtEur(a.bruttoJahr)})`,
    ),
    footer: T(
      `Netto nach Miete: ${fmtEur(a.nettoNachAllemJahr)} / Jahr • ${fmtEur(a.nettoNachAllemMonat)} / Monat`,
      `Net after rent: ${fmtEur(a.nettoNachAllemJahr)} / year • ${fmtEur(a.nettoNachAllemMonat)} / month`,
    ),
  };
}

export function sankeyBuergergeld(ergebnis: VergleichsErgebnis): SankeyData {
  const b = ergebnis.buergergeld;
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  const pool = "haushalt";
  nodes.push({
    id: pool,
    label: T("Haushaltseinkommen", "Household income"),
    category: "pool",
  });

  if (b.regelbedarfJahr > 0) {
    nodes.push({
      id: "rb",
      label: T("Regelbedarf §20", "Standard need §20"),
      category: "benefit",
    });
    links.push({ source: "rb", target: pool, value: b.regelbedarfJahr });
  }
  if (b.mehrbedarfAlleinerziehendJahr > 0) {
    nodes.push({
      id: "mb_ae",
      label: T("MB Alleinerziehend §21³", "Addl. need single parent §21(3)"),
      category: "benefit",
    });
    links.push({ source: "mb_ae", target: pool, value: b.mehrbedarfAlleinerziehendJahr });
  }
  if (b.mehrbedarfWarmwasserJahr > 0) {
    nodes.push({
      id: "mb_ww",
      label: T("MB Warmwasser §21⁷", "Addl. need hot water §21(7)"),
      category: "benefit",
    });
    links.push({ source: "mb_ww", target: pool, value: b.mehrbedarfWarmwasserJahr });
  }
  if (b.mehrbedarfSchwangerschaftJahr > 0) {
    nodes.push({
      id: "mb_ss",
      label: T("MB Schwangerschaft §21²", "Addl. need pregnancy §21(2)"),
      category: "benefit",
    });
    links.push({ source: "mb_ss", target: pool, value: b.mehrbedarfSchwangerschaftJahr });
  }
  if (b.kdUJahr > 0) {
    nodes.push({
      id: "kdu",
      label: T(
        "KdU §22 (Miete + Heizung)",
        "KdU §22 (rent + heating)",
      ),
      category: "benefit",
    });
    links.push({ source: "kdu", target: pool, value: b.kdUJahr });
  }
  if (b.butGesamtJahr > 0) {
    nodes.push({
      id: "but",
      label: T("Bildung & Teilhabe §28", "Education & participation §28"),
      category: "benefit",
    });
    links.push({ source: "but", target: pool, value: b.butGesamtJahr });
  }
  if (b.geldwerteVorteileJahr > 0) {
    nodes.push({
      id: "gv",
      label: T(
        "Geldwerte Vorteile (Rundfunk/Sozialpass)",
        "In-kind benefits (broadcasting/welfare pass)",
      ),
      category: "benefit",
    });
    links.push({ source: "gv", target: pool, value: b.geldwerteVorteileJahr });
  }
  if (b.schwarzarbeitJahr > 0) {
    nodes.push({
      id: "schwarz",
      label: T(
        "Nicht gemeldete Nebeneinkünfte (illegal)",
        "Undeclared side income (illegal)",
      ),
      category: "source",
    });
    links.push({ source: "schwarz", target: pool, value: b.schwarzarbeitJahr });
  }

  if (b.mieteJahr > 0) {
    nodes.push({
      id: "miete",
      label: T("Miete (warm)", "Rent (warm)"),
      category: "sink",
    });
    links.push({ source: pool, target: "miete", value: b.mieteJahr });
  }
  if (b.oepnvJahr > 0) {
    nodes.push({
      id: "oepnv",
      label: T("ÖPNV (ermäßigt)", "Transit (reduced)"),
      category: "sink",
    });
    links.push({ source: pool, target: "oepnv", value: b.oepnvJahr });
  }
  nodes.push({
    id: "verfuegbar",
    label: T("Frei verfügbar", "Free disposable"),
    category: "sink",
  });
  const verfuegbarInklGeldwert =
    Math.max(0, b.verfuegbarNachMieteJahr) + b.geldwerteVorteileJahr;
  links.push({
    source: pool,
    target: "verfuegbar",
    value: verfuegbarInklGeldwert,
  });

  return {
    nodes,
    links,
    title: T(`Bürgergeld (Haushalt)`, `Bürgergeld (household)`),
    footer: T(
      `Verfügbar nach Miete: ${fmtEur(b.verfuegbarNachMieteJahr)} / Jahr • ${fmtEur(b.verfuegbarNachMieteMonat)} / Monat • zzgl. geldwerte Vorteile ${fmtEur(b.geldwerteVorteileJahr)} / Jahr`,
      `Disposable after rent: ${fmtEur(b.verfuegbarNachMieteJahr)} / year • ${fmtEur(b.verfuegbarNachMieteMonat)} / month • plus in-kind benefits ${fmtEur(b.geldwerteVorteileJahr)} / year`,
    ),
  };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
