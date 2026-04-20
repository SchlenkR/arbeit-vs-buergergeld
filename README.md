# Einkommensrechner

Offene Modellrechnung: **Arbeit (angestellt, sv-pflichtig) vs. Bürgergeld** für Haushalte in Deutschland, Rechtsstand 2026.

🔗 **Live:** https://schlenkr.github.io/arbeit-vs-buergergeld/

## Was der Rechner tut

Für einen frei konfigurierbaren Haushalt wird gegenübergestellt, was bei Arbeit und was bei Bürgergeld tatsächlich verfügbar bleibt — inklusive Steuern, Sozialabgaben, Miete, Rundfunkbeitrag und Transferleistungen.

- **Haushaltstypen:** Single, Alleinerziehend, Paar (verheiratet / unverheiratet), jeweils mit Kindern
- **Wohnlage A–D:** eigener Modellansatz für regionale Miet- und KdU-Spannbreiten (Quellen offengelegt)
- **Antragsleistungen:** Presets von *keine* bis *hoch* (Bildungspaket, Wohngeld, KiZ, …)
- **Schwarzarbeit / nicht gemeldete Nebeneinkünfte:** optionaler Regler als realitätsnaher Faktor
- **Visualisierung:** Sankey-Diagramme und Break-Even-Chart
- **Vollständige Quellen:** Gesetze, BBSR, GKV-Spitzenverband, kommunale KdU-Richtlinien u. a. sind im Disclaimer-Bereich verlinkt

## Modellgrenzen

- Wohngeld (§ 19 WoGG) und Kinderzuschlag (§ 6a BKGG) sind aktuell Platzhalter
- Wohnlage A–D ist keine amtliche Kategorie, sondern ein offengelegter Modellansatz
- Nicht gemeldete Nebeneinkünfte bilden nur das illegale, nicht entdeckte Szenario ab — Strafbarkeit, Rückforderungen und Sanktionen sind nicht eingepreist

Der Rechner ist eine Modellrechnung nach bestem Wissen und Gewissen, **keine Rechts- oder Steuerberatung**.

## Tech Stack

- TypeScript (strict, `exactOptionalPropertyTypes`)
- Vite
- D3 / d3-sankey
- Vitest
- GitHub Actions → GitHub Pages

## Lokale Entwicklung

```bash
npm install
npm run dev        # Dev-Server auf localhost:5173
npm run build      # Type-Check + Production-Build nach dist/
npm run preview    # Build lokal servieren
npm test           # Unit-Tests
```

## Struktur

```
src/
  core/    Berechnungslogik (Steuer, SV, Bürgergeld, Vergleich)
  ui/      Rendering (Form, Sankey, Tabelle, Disclaimer)
  config.ts
  main.ts
```

## Mitwirken

Hinweise auf Rechenfehler, blinde Flecken oder methodische Schwächen sind willkommen — bitte per Issue oder PR.

## Lizenz

© 2026 Ronald Schlenger
