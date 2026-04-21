import { berechneVergleich } from "../core/compare";
import type { Szenario } from "../core/types";
import { T, fmtEur } from "../i18n";

const BRUTTO_MIN = 10_000;
const BRUTTO_MAX = 100_000;
const BRUTTO_STEP = 2_500;

interface Point {
  brutto: number;
  deltaMonat: number;
}

export function renderBreakEvenChart(
  container: HTMLElement,
  szenario: Szenario,
): void {
  const punkte = berechnePunkte(szenario);
  const aktuellesBrutto = szenario.arbeit.bruttoJahr;
  const aktuellerPunktIndex = punkte.reduce((bestIdx, p, i) => {
    return Math.abs(p.brutto - aktuellesBrutto) <
      Math.abs(punkte[bestIdx]!.brutto - aktuellesBrutto)
      ? i
      : bestIdx;
  }, 0);
  const breakEven = findeBreakEven(punkte);

  const width = 900;
  const height = 260;
  const margin = { top: 20, right: 70, bottom: 40, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const deltaValues = punkte.map((p) => p.deltaMonat);
  const yMin = Math.min(0, Math.min(...deltaValues));
  const yMax = Math.max(0, Math.max(...deltaValues));
  const yPadding = (yMax - yMin) * 0.1 || 100;
  const yDomain: [number, number] = [yMin - yPadding, yMax + yPadding];

  const xScale = (brutto: number): number =>
    ((brutto - BRUTTO_MIN) / (BRUTTO_MAX - BRUTTO_MIN)) * innerW;
  const yScale = (v: number): number =>
    innerH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerH;

  const allePositiv = punkte.every((p) => p.deltaMonat >= 0);
  const linienKlasse = allePositiv ? "delta-line positive" : "delta-line mixed";

  const pfad = punkte
    .map((p, i) => {
      const x = xScale(p.brutto);
      const y = yScale(p.deltaMonat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const xTicks = [10_000, 25_000, 50_000, 75_000, 100_000];
  const xTickMarks = xTicks
    .map(
      (v) => `
        <g transform="translate(${xScale(v).toFixed(1)}, ${innerH})">
          <line y2="5"></line>
          <text y="18" text-anchor="middle">${fmtEur(v)}</text>
        </g>
      `,
    )
    .join("");

  const yTicks = yTickValues(yDomain[0], yDomain[1]);
  const yTickMarks = yTicks
    .map(
      (v) => `
        <g transform="translate(0, ${yScale(v).toFixed(1)})">
          <line x2="${innerW}" stroke-opacity="0.4"></line>
          <text x="-8" dy="0.32em" text-anchor="end">${fmtEurSigned(v)}</text>
        </g>
      `,
    )
    .join("");

  const aktuellerPunkt = punkte[aktuellerPunktIndex]!;
  const markerX = xScale(aktuellerPunkt.brutto);
  const markerY = yScale(aktuellerPunkt.deltaMonat);

  const breakEvenMarker = breakEven
    ? `
      <g class="breakeven-marker" transform="translate(${xScale(breakEven).toFixed(1)}, 0)">
        <line y1="0" y2="${innerH}"></line>
        <text y="-5" text-anchor="middle">Break-Even ≈ ${fmtEur(breakEven)}</text>
      </g>
    `
    : "";

  const monatLabel = T("Monat", "month");

  container.innerHTML = `
    <div class="breakeven-chart">
      <h3>${T(
        "Differenz „Arbeit − Bürgergeld\" nach Brutto (Monat)",
        "Difference „Work − Bürgergeld\" by gross income (month)",
      )}</h3>
      <p class="breakeven-sub">
        ${T(
          `X-Achse: Jahres-Brutto in ${fmtEur(BRUTTO_STEP)}-Schritten · Y-Achse: Mehreinkommen durch Arbeit pro Monat · alle übrigen Parameter bleiben aus der aktuellen Konfiguration konstant.`,
          `X axis: gross yearly income in ${fmtEur(BRUTTO_STEP)} steps · Y axis: extra income from work per month · all other parameters stay fixed from the current configuration.`,
        )}
      </p>
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(${margin.left}, ${margin.top})">
          <g class="axis">${yTickMarks}</g>
          <line class="zero-line" x1="0" x2="${innerW}" y1="${yScale(0).toFixed(1)}" y2="${yScale(0).toFixed(1)}"></line>
          <path class="${linienKlasse}" d="${pfad}"></path>
          ${breakEvenMarker}
          <g class="current-marker" transform="translate(${markerX.toFixed(1)}, ${markerY.toFixed(1)})">
            <circle r="5"></circle>
            <text x="8" dy="0.32em">${fmtEurSigned(aktuellerPunkt.deltaMonat)}/${monatLabel} @ ${fmtEur(aktuellerPunkt.brutto)}</text>
          </g>
          <g class="axis" transform="translate(0, ${innerH})">
            <line x2="${innerW}"></line>
            ${xTickMarks}
          </g>
        </g>
      </svg>
    </div>
  `;
}

function berechnePunkte(szenario: Szenario): Point[] {
  const punkte: Point[] = [];
  for (let b = BRUTTO_MIN; b <= BRUTTO_MAX; b += BRUTTO_STEP) {
    const variante: Szenario = {
      ...szenario,
      arbeit: { ...szenario.arbeit, bruttoJahr: b },
    };
    const ergebnis = berechneVergleich(variante);
    const delta =
      ergebnis.arbeit.nettoNachAllemMonat -
      ergebnis.buergergeld.verfuegbarNachMieteMonat;
    punkte.push({ brutto: b, deltaMonat: delta });
  }
  return punkte;
}

function findeBreakEven(punkte: Point[]): number | null {
  for (let i = 1; i < punkte.length; i++) {
    const a = punkte[i - 1]!;
    const b = punkte[i]!;
    if ((a.deltaMonat < 0 && b.deltaMonat >= 0) ||
        (a.deltaMonat > 0 && b.deltaMonat <= 0)) {
      const t = Math.abs(a.deltaMonat) / (Math.abs(a.deltaMonat) + Math.abs(b.deltaMonat));
      return a.brutto + t * (b.brutto - a.brutto);
    }
  }
  return null;
}

function yTickValues(min: number, max: number): number[] {
  const range = max - min;
  const target = 5;
  const step = niceStep(range / target);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max; v += step) ticks.push(v);
  return ticks;
}

function niceStep(raw: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  let nice: number;
  if (normalized < 1.5) nice = 1;
  else if (normalized < 3) nice = 2;
  else if (normalized < 7) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

function fmtEurSigned(v: number): string {
  const prefix = v > 0 ? "+" : "";
  return prefix + fmtEur(v);
}
