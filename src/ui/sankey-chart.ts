import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import type { SankeyData } from "../core/sankey";

const KATEGORIE_FARBE: Record<string, string> = {
  source: "#2563eb",
  deduction: "#dc2626",
  benefit: "#16a34a",
  pool: "#7c3aed",
  sink: "#0891b2",
};

export function renderSankey(container: HTMLElement, data: SankeyData): void {
  container.innerHTML = "";

  if (data.links.length === 0) {
    container.innerHTML += `<p class="muted">Keine Daten.</p>`;
    return;
  }

  const width = Math.max(520, container.clientWidth);
  const height = 580;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", height)
    .attr("class", "sankey-svg");

  const nodes = data.nodes.map((n) => ({ ...n }));
  const links = data.links.map((l) => ({ ...l }));

  const leftPad = 110;
  const rightPad = 110;

  const layout = sankey<(typeof nodes)[number], (typeof links)[number]>()
    .nodeId((n) => n.id)
    .nodeAlign(sankeyJustify)
    .nodeWidth(16)
    .nodePadding(22)
    .extent([
      [leftPad, 12],
      [width - rightPad, height - 16],
    ]);

  const graph = layout({
    nodes,
    links,
  });

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.45)
    .selectAll("path")
    .data(graph.links)
    .join("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", (d) => {
      const src = d.source as unknown as (typeof nodes)[number];
      return KATEGORIE_FARBE[src.category] ?? "#999";
    })
    .attr("stroke-width", (d) => Math.max(1, d.width ?? 0))
    .append("title")
    .text((d) => {
      const src = d.source as unknown as (typeof nodes)[number];
      const tgt = d.target as unknown as (typeof nodes)[number];
      return `${src.label} → ${tgt.label}\n${fmtEur(d.value)}`;
    });

  const nodeG = svg
    .append("g")
    .selectAll("g")
    .data(graph.nodes)
    .join("g");

  nodeG
    .append("rect")
    .attr("x", (d) => d.x0 ?? 0)
    .attr("y", (d) => d.y0 ?? 0)
    .attr("width", (d) =>
      d.id === "verfuegbar"
        ? ((d.x1 ?? 0) - (d.x0 ?? 0)) * 2
        : (d.x1 ?? 0) - (d.x0 ?? 0),
    )
    .attr("height", (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
    .attr("fill", (d) =>
      d.id === "verfuegbar" ? "#0d9488" : KATEGORIE_FARBE[d.category] ?? "#666",
    )
    .attr("class", (d) => (d.id === "verfuegbar" ? "sankey-node-highlight" : ""))
    .append("title")
    .text((d) => `${d.label}\n${fmtEur(d.value ?? 0)}`);

  type NodeDatum = (typeof graph.nodes)[number];
  const labelX = (d: NodeDatum) => {
    const rightWidth =
      d.id === "verfuegbar" ? ((d.x1 ?? 0) - (d.x0 ?? 0)) * 2 : 0;
    return (d.x0 ?? 0) < width / 2
      ? (d.x1 ?? 0) + 8 + (d.id === "verfuegbar" ? rightWidth : 0)
      : (d.x0 ?? 0) - 8;
  };

  const labels = nodeG
    .append("text")
    .attr("x", labelX)
    .attr("y", (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
    .attr("text-anchor", (d) => ((d.x0 ?? 0) < width / 2 ? "start" : "end"))
    .attr("fill", "currentColor")
    .attr(
      "class",
      (d) =>
        "sankey-label" + (d.id === "verfuegbar" ? " sankey-label-highlight" : ""),
    );

  labels
    .append("tspan")
    .attr("x", labelX)
    .attr("dy", "-0.1em")
    .attr("class", "sankey-value")
    .text((d) => fmtEur(d.value ?? 0));

  labels
    .append("tspan")
    .attr("x", labelX)
    .attr("dy", "1.15em")
    .attr("class", "sankey-name")
    .text((d) => (d.id === "verfuegbar" ? "★ " + d.label : d.label));

  const footer = document.createElement("div");
  footer.className = "sankey-footer";
  footer.textContent = data.footer;
  container.appendChild(footer);
}

function fmtEur(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}
