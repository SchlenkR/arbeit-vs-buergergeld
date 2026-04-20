import type { VergleichsErgebnis } from "./types";

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

/**
 * Sankey für Arbeits-Szenario:
 *   Brutto ─┬─> KV, PV, RV (Sozialabgaben)
 *           ├─> ESt, Soli (Steuern)
 *           └─> Netto ─┬─> Miete
 *                      └─> Frei verfügbar
 *   Kindergeld ─> Netto  (sofern vorhanden)
 */
export function sankeyArbeit(ergebnis: VergleichsErgebnis): SankeyData {
  const a = ergebnis.arbeit;
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  nodes.push({ id: "brutto", label: `Bruttoeinkommen`, category: "source" });

  for (const p of a.sozialabgabenDetail) {
    if (p.betragJahr <= 0) continue;
    const id = slug(p.label);
    nodes.push({ id, label: p.label, category: "deduction" });
    links.push({ source: "brutto", target: id, value: p.betragJahr });
  }

  if (a.einkommensteuerJahr > 0) {
    nodes.push({ id: "est", label: "Einkommensteuer", category: "deduction" });
    links.push({ source: "brutto", target: "est", value: a.einkommensteuerJahr });
  }
  if (a.soliJahr > 0) {
    nodes.push({ id: "soli", label: "Solidaritätszuschlag", category: "deduction" });
    links.push({ source: "brutto", target: "soli", value: a.soliJahr });
  }

  const nachAbzug =
    a.bruttoJahr - a.sozialabgabenJahr - a.einkommensteuerJahr - a.soliJahr;

  nodes.push({ id: "netto", label: "Netto-Pool", category: "pool" });
  if (nachAbzug > 0) {
    links.push({ source: "brutto", target: "netto", value: nachAbzug });
  }
  if (a.kindergeldJahr > 0) {
    nodes.push({ id: "kindergeld", label: "Kindergeld", category: "benefit" });
    links.push({ source: "kindergeld", target: "netto", value: a.kindergeldJahr });
  }
  if (a.wohngeldJahr > 0) {
    nodes.push({ id: "wohngeld", label: "Wohngeld", category: "benefit" });
    links.push({ source: "wohngeld", target: "netto", value: a.wohngeldJahr });
  }
  if (a.kinderzuschlagJahr > 0) {
    nodes.push({ id: "kiz", label: "Kinderzuschlag", category: "benefit" });
    links.push({ source: "kiz", target: "netto", value: a.kinderzuschlagJahr });
  }

  if (a.mieteJahr > 0) {
    nodes.push({ id: "miete", label: "Miete (warm)", category: "sink" });
    links.push({ source: "netto", target: "miete", value: a.mieteJahr });
  }
  if (a.rundfunkbeitragJahr > 0) {
    nodes.push({ id: "gez", label: "Rundfunkbeitrag", category: "sink" });
    links.push({ source: "netto", target: "gez", value: a.rundfunkbeitragJahr });
  }
  if (a.oepnvJahr > 0) {
    nodes.push({ id: "oepnv", label: "ÖPNV (regulär)", category: "sink" });
    links.push({ source: "netto", target: "oepnv", value: a.oepnvJahr });
  }
  nodes.push({
    id: "verfuegbar",
    label: "Frei verfügbar",
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
    title: `Arbeit (Brutto ${fmt(a.bruttoJahr)})`,
    footer: `Netto nach Miete: ${fmt(a.nettoNachAllemJahr)} / Jahr • ${fmt(
      a.nettoNachAllemMonat,
    )} / Monat`,
  };
}

/**
 * Sankey für Bürgergeld-Szenario:
 *   Regelbedarf, Mehrbedarf, KdU, BuT, Kindergeld ─> Haushalts-Pool ─┬─> Miete
 *                                                                     └─> Frei verfügbar
 */
export function sankeyBuergergeld(ergebnis: VergleichsErgebnis): SankeyData {
  const b = ergebnis.buergergeld;
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  const pool = "haushalt";
  nodes.push({ id: pool, label: "Haushaltseinkommen", category: "pool" });

  if (b.regelbedarfJahr > 0) {
    nodes.push({ id: "rb", label: "Regelbedarf §20", category: "benefit" });
    links.push({ source: "rb", target: pool, value: b.regelbedarfJahr });
  }
  if (b.mehrbedarfAlleinerziehendJahr > 0) {
    nodes.push({ id: "mb_ae", label: "MB Alleinerziehend §21³", category: "benefit" });
    links.push({ source: "mb_ae", target: pool, value: b.mehrbedarfAlleinerziehendJahr });
  }
  if (b.mehrbedarfWarmwasserJahr > 0) {
    nodes.push({ id: "mb_ww", label: "MB Warmwasser §21⁷", category: "benefit" });
    links.push({ source: "mb_ww", target: pool, value: b.mehrbedarfWarmwasserJahr });
  }
  if (b.mehrbedarfSchwangerschaftJahr > 0) {
    nodes.push({ id: "mb_ss", label: "MB Schwangerschaft §21²", category: "benefit" });
    links.push({ source: "mb_ss", target: pool, value: b.mehrbedarfSchwangerschaftJahr });
  }
  if (b.kdUJahr > 0) {
    nodes.push({ id: "kdu", label: "KdU §22 (Miete + Heizung)", category: "benefit" });
    links.push({ source: "kdu", target: pool, value: b.kdUJahr });
  }
  if (b.butGesamtJahr > 0) {
    nodes.push({ id: "but", label: "Bildung & Teilhabe §28", category: "benefit" });
    links.push({ source: "but", target: pool, value: b.butGesamtJahr });
  }
  // Kindergeld wird vom Jobcenter über §11 SGB II angerechnet (reduziert die Auszahlung
  // 1:1). Der Haushalt bekommt die volle Leistung RB+MB+KdU+BuT als Summe ausgezahlt
  // (aufgeteilt auf Jobcenter + Familienkasse). Deshalb kein separater Kindergeld-Fluss.
  if (b.geldwerteVorteileJahr > 0) {
    nodes.push({
      id: "gv",
      label: "Geldwerte Vorteile (Rundfunk/Sozialpass)",
      category: "benefit",
    });
    links.push({ source: "gv", target: pool, value: b.geldwerteVorteileJahr });
  }
  if (b.schwarzarbeitJahr > 0) {
    nodes.push({
      id: "schwarz",
      label: "Nicht gemeldete Nebeneinkünfte (illegal)",
      category: "source",
    });
    links.push({ source: "schwarz", target: pool, value: b.schwarzarbeitJahr });
  }

  if (b.mieteJahr > 0) {
    nodes.push({ id: "miete", label: "Miete (warm)", category: "sink" });
    links.push({ source: pool, target: "miete", value: b.mieteJahr });
  }
  if (b.oepnvJahr > 0) {
    nodes.push({ id: "oepnv", label: "ÖPNV (ermäßigt)", category: "sink" });
    links.push({ source: pool, target: "oepnv", value: b.oepnvJahr });
  }
  nodes.push({ id: "verfuegbar", label: "Frei verfügbar", category: "sink" });
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
    title: `Bürgergeld (Haushalt)`,
    footer: `Verfügbar nach Miete: ${fmt(b.verfuegbarNachMieteJahr)} / Jahr • ${fmt(
      b.verfuegbarNachMieteMonat,
    )} / Monat • zzgl. geldwerte Vorteile ${fmt(b.geldwerteVorteileJahr)} / Jahr`,
  };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fmt(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}
