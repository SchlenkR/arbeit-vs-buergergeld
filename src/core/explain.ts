import {
  EST_TARIF_2026,
  KINDERFREIBETRAG_2026,
  WOHNLAGEN_2026,
  SV_2026,
  SOLI_2026,
  KINDERGELD_EUR_MONAT,
  REGELBEDARF_2026_EUR_MONAT,
  MEHRBEDARF_WARMWASSER_PCT,
  MEHRBEDARF_SCHWANGERSCHAFT_PCT,
  BUT_2026,
  RUNDFUNKBEITRAG_EUR_MONAT,
  OEPNV_2026,
} from "./constants2026";
import { berechneKdU } from "./buergergeld";
import type { VergleichsErgebnis, Szenario } from "./types";

export interface Abschnitt {
  titel: string;
  defaultOffen: boolean;
  html: string;
}

/**
 * Erzeugt eine vollständige narrative Erklärung des Rechenwegs für das gegebene
 * Szenario, mit Paragraphen-Referenzen. Reiner Text/HTML-Output, damit das UI
 * nur rendern muss.
 */
export function erklaereErgebnis(ergebnis: VergleichsErgebnis): Abschnitt[] {
  return [
    abschnittEinleitung(),
    abschnittParameter(ergebnis.szenario),
    abschnittArbeitsseite(ergebnis),
    abschnittBuergergeldseite(ergebnis),
    abschnittVergleich(ergebnis),
    abschnittAnnahmen(),
  ];
}

function abschnittEinleitung(): Abschnitt {
  return {
    titel: "Was macht dieses Tool?",
    defaultOffen: true,
    html: `
      <p>
        Der Rechner stellt für denselben Haushalt zwei Fälle gegenüber:
        <strong>Einkommen aus einem Arbeitsverhältnis (abhängige Beschäftigung)</strong> versus
        <strong>Einkommen aus Bürgergeld</strong> (ab 01.07.2026: „Neue Grundsicherung“).
        Gerechnet wird auf Jahresbasis in Euro, Rechtsstand 2026.
      </p>
      <p>
        Beide Szenarien werden auf die gleiche Kennzahl geführt:
        <em>verfügbares Einkommen nach Miete pro Monat</em>. Der Sankey-Fluss links zeigt,
        was vom Bruttoeinkommen übrig bleibt. Rechts zeigt er, woraus sich die
        Bürgergeld-Leistung zusammensetzt.
      </p>
    `,
  };
}

function abschnittParameter(s: Szenario): Abschnitt {
  const anzKinder = s.haushalt.kinder.length;
  const kinderListe = anzKinder > 0
    ? s.haushalt.kinder.map((k, i) => `Kind ${i + 1}: ${k.alter} J.`).join(", ")
    : "keine";
  return {
    titel: "Deine Parameter",
    defaultOffen: false,
    html: `
      <ul class="param-list">
        <li>Haushaltstyp: <strong>${labelHaushaltsTyp(s.haushalt.typ)}</strong></li>
        <li>Kinder: <strong>${anzKinder}</strong> (${kinderListe})</li>
        <li>
          Wohnlage: <strong>${WOHNLAGEN_2026[s.haushalt.wohnlage].label}</strong>
          <small class="muted"> (Beispiele: ${WOHNLAGEN_2026[s.haushalt.wohnlage].beispiele})</small>
        </li>
        <li>Warmmiete angenommen: <strong>${fmt(s.haushalt.warmmieteEurProMonat)} / Monat</strong></li>
        <li>
          Warmwasser dezentral: <strong>${s.haushalt.warmwasserDezentral ? "ja (MB §21⁷)" : "nein"}</strong>,
          Schwangerschaft: <strong>${s.haushalt.schwangerschaftAb13SSW ? "ja ab 13. SSW (MB §21²)" : "nein"}</strong>
        </li>
        <li>ÖPNV-Nutzer (Deutschlandticket): <strong>${s.haushalt.oepnvNutzer}</strong></li>
        <li>Arbeitnehmer-Brutto: <strong>${fmt(s.arbeit.bruttoJahr)} / Jahr</strong> (angestellt, sv-pflichtig)</li>
      </ul>
    `,
  };
}

function abschnittArbeitsseite(r: VergleichsErgebnis): Abschnitt {
  const a = r.arbeit;
  const s = r.szenario;
  const verheiratet = s.haushalt.typ === "paar_verheiratet";
  const bruttoMonat = a.bruttoJahr / 12;
  const ueberBbgGkv = bruttoMonat > SV_2026.bbgGkvPvMonat;
  const ueberBbgRv = bruttoMonat > SV_2026.bbgRvAlvMonat;
  const gkvSatzGesamt =
    SV_2026.gkvSatzAllgemein + SV_2026.gkvZusatzbeitragDurchschnitt;
  const kinderU25 = s.haushalt.kinder.filter((k) => k.alter < 25).length;
  const pvSatz = pvSatzText(kinderU25);

  const zone = estZone(a.zvE);
  const soliBasisWeichtAb = Math.abs(a.soliBemessungsgrundlageJahr - a.einkommensteuerJahr) > 0.005;
  const soliBasisText = soliBasisWeichtAb
    ? `Für den Soli zählt hier die festzusetzende Einkommensteuer nach Kinderfreibetrag: ${fmt(a.soliBemessungsgrundlageJahr)}. Die zusätzliche Kindergeld-Zurechnung aus der Günstigerprüfung (${fmt(a.einkommensteuerJahr)}) erhöht den Solidaritätszuschlag nicht.`
    : `Die für den Soli maßgebliche Einkommensteuer beträgt ${fmt(a.soliBemessungsgrundlageJahr)}.`;
  const soliText = a.soliJahr > 0
    ? `${soliBasisText} Sie liegt über der Freigrenze von
       ${fmt(verheiratet ? SOLI_2026.freigrenzeEstEinzeln * 2 : SOLI_2026.freigrenzeEstEinzeln)}
       (${verheiratet ? "Zusammenveranlagung" : "Einzelveranlagung"}), daher fällt Solidaritätszuschlag an:
       <strong>${fmt(a.soliJahr)}</strong>.`
    : `${soliBasisText} Sie liegt unter der Soli-Freigrenze
       (${fmt(verheiratet ? SOLI_2026.freigrenzeEstEinzeln * 2 : SOLI_2026.freigrenzeEstEinzeln)}),
       deshalb fällt <strong>kein Solidaritätszuschlag</strong> an.`;

  const kinderBlock = s.haushalt.kinder.length > 0
    ? `
      <h4>Kindergeld &amp; Kinderfreibetrag</h4>
      <p>
        Für ${s.haushalt.kinder.length} Kind${s.haushalt.kinder.length === 1 ? "" : "er"}
        wird Kindergeld von <strong>${fmt(KINDERGELD_EUR_MONAT)}/Monat</strong> gezahlt
        (§ 66 EStG), im Jahr also ${fmt(a.kindergeldJahr)}.
      </p>
      <p>
        Das Finanzamt führt die <em>Günstigerprüfung</em> durch (§ 31 EStG): Es vergleicht das
        bereits gezahlte Kindergeld mit der Steuerersparnis, die der Kinderfreibetrag
        (${fmt(KINDERFREIBETRAG_2026.saechlichesExistenzminimum)} sächliches Existenzminimum +
        ${fmt(KINDERFREIBETRAG_2026.bea)} BEA, zusammen
        ${fmt(KINDERFREIBETRAG_2026.saechlichesExistenzminimum + KINDERFREIBETRAG_2026.bea)}
        je Kind) bringen würde.
        ${a.steuerlicheEntlastungDurchKinderfreibetrag > 0
          ? `Bei deinem Einkommen ist der Freibetrag günstiger: zusätzliche Netto-Entlastung
             von <strong>${fmt(a.steuerlicheEntlastungDurchKinderfreibetrag)}</strong> über das
             Kindergeld hinaus.`
          : `Bei deinem Einkommen bleibt das Kindergeld günstiger — der Freibetrag wird nicht angesetzt.`}
      </p>
    `
    : "";

  return {
    titel: "Arbeit — Schritt für Schritt",
    defaultOffen: true,
    html: `
      <h4>1. Gesamtkosten Arbeitgeber</h4>
      <p>
        Als sozialversicherungspflichtige:r Angestellte:r zahlt der Arbeitgeber
        zusätzlich zum Brutto den <em>Arbeitgeberanteil</em> zur Sozialversicherung
        (Lohnnebenkosten). Das ist zwar nicht dein Nettoeinkommen, aber die echten
        Kosten, die der Job verursacht.
      </p>
      <ul>
        <li>Arbeitnehmer-Brutto (laut Vertrag): <strong>${fmt(a.bruttoJahr)} / Jahr</strong></li>
        <li>Arbeitgeberanteil SV: <strong>+ ${fmt(a.arbeitgeberAnteilJahr)} / Jahr</strong></li>
        <li>
          <strong>Gesamtkosten AG: ${fmt(a.gesamtBruttoJahr)} / Jahr</strong>
          (≈ ${fmt(a.gesamtBruttoJahr / 12)} / Monat)
        </li>
      </ul>

      <h4>2. Sozialabgaben Arbeitnehmer</h4>
      <p>
        Die Beiträge werden <em>paritätisch</em> zwischen Arbeitnehmer und Arbeitgeber
        geteilt — mit Ausnahme des PV-Kinderlos-Zuschlags und des PV-Kinderabschlags ab
        dem 2. Kind &lt; 25, die nur die AN-Seite treffen.
      </p>
      <ul>
        <li>
          Krankenversicherung (§ 241/242 SGB V): allgemeiner Satz
          ${pct(SV_2026.gkvSatzAllgemein)} + Ø Zusatzbeitrag
          ${pct(SV_2026.gkvZusatzbeitragDurchschnitt)} = <strong>${pct(gkvSatzGesamt)}</strong>,
          paritätisch je ${pct(gkvSatzGesamt / 2)}.
        </li>
        <li>
          Pflegeversicherung (§ 55 SGB XI): AN-Seite <strong>${pvSatz.text}</strong>
          (${pvSatz.paragraf}), AG-Seite ${pct(SV_2026.pvSatzMitKind / 2)} flat.
        </li>
        <li>
          Rentenversicherung (§ 157 SGB VI): ${pct(SV_2026.rvSatz)}, paritätisch je
          ${pct(SV_2026.rvSatz / 2)}.
        </li>
        <li>
          Arbeitslosenversicherung (§ 341 SGB III): ${pct(SV_2026.avSatz)}, paritätisch je
          ${pct(SV_2026.avSatz / 2)}.
        </li>
      </ul>
      <p>
        Bemessungsgrenzen (§ 159 SGB VI, § 223 SGB V): BBG GKV/PV
        <strong>${fmt(SV_2026.bbgGkvPvMonat)}/Monat</strong>, BBG RV/AV
        <strong>${fmt(SV_2026.bbgRvAlvMonat)}/Monat</strong>.
        ${ueberBbgRv
          ? `Dein Brutto (${fmt(bruttoMonat)}/Monat) liegt über <em>beiden</em> BBGs — SV wird auf allen Säulen gedeckelt.`
          : ueberBbgGkv
            ? `Dein Brutto liegt über der BBG GKV/PV, aber unter der BBG RV/AV — KV/PV gedeckelt, RV/AV vom vollen Brutto.`
            : `Dein Brutto (${fmt(bruttoMonat)}/Monat) liegt unterhalb beider BBGs — SV vom vollen Brutto.`}
      </p>
      <p>
        <strong>Summe AN-Anteil: ${fmt(a.sozialabgabenJahr)} / Jahr</strong> (mindert dein Netto).
      </p>

      <h4>3. Zu versteuerndes Einkommen (zvE)</h4>
      <p>
        Abgezogen werden vom Brutto die im Modell berücksichtigten <em>abziehbaren Vorsorgeaufwendungen</em>
        nach § 10 EStG, der <em>Arbeitnehmer-Pauschbetrag</em> (§ 9a Nr. 1 EStG, 1.230 €/Jahr)
        und die <em>Sonderausgabenpauschale</em> (§ 10c EStG, ${fmt(verheiratet ? 72 : 36)}).
        Berücksichtigt werden dabei: RV voll, gesetzliche KV für die Basisabsicherung mit 4-%-Abschlag
        wegen Krankengeldanspruch, PV voll und AV nur soweit der Höchstbetrag für sonstige
        Vorsorgeaufwendungen noch nicht ausgeschöpft ist.
      </p>
      <p>
        zvE = ${fmt(a.bruttoJahr)} − ${fmt(a.abziehbareVorsorgeaufwendungenJahr)} − 1.230 € − ${fmt(verheiratet ? 72 : 36)}
        = <strong>${fmt(a.zvE)}</strong>.
      </p>

      <h4>4. Einkommensteuer (§ 32a EStG)</h4>
      <p>
        Grundtarif 2026 hat fünf Zonen. Dein zvE liegt in <strong>Zone ${zone.nummer}</strong>
        (${zone.beschreibung}). ${zone.formel}
      </p>
      <p>
        ${verheiratet
          ? `Als Ehepaar kommt das <em>Splitting-Verfahren</em> zur Anwendung:
             ESt = 2 · Grundtarif(zvE / 2).`
          : `Einzelveranlagung.`}
        Ergebnis: <strong>${fmt(a.einkommensteuerJahr)}</strong>${s.haushalt.kinder.length > 0 ? " (nach Günstigerprüfung, siehe unten)" : ""}.
      </p>

      <h4>5. Solidaritätszuschlag</h4>
      <p>${soliText}</p>

      ${kinderBlock}

      <h4>6. Miete</h4>
      <p>
        Deine angenommene Warmmiete beträgt
        <strong>${fmt(s.haushalt.warmmieteEurProMonat)}/Monat</strong>
        (${fmt(a.mieteJahr)}/Jahr). Diese zahlst du vollständig aus dem Nettoeinkommen.
      </p>

      <h4>7. Rundfunkbeitrag &amp; ÖPNV</h4>
      <p>
        Zwei Fixkosten werden explizit ausgewiesen, weil sie auf der Bürgergeld-Seite
        entfallen oder stark reduziert sind — sonst wäre der Vergleich unfair:
      </p>
      <ul>
        <li>
          <strong>Rundfunkbeitrag</strong> (§ 2 RBStV):
          ${fmt(RUNDFUNKBEITRAG_EUR_MONAT)}/Monat × 12 = <strong>${fmt(a.rundfunkbeitragJahr)}/Jahr</strong>.
          Arbeitende Haushalte zahlen ihn voll; Bürgergeld-Empfänger sind auf Antrag
          befreit (§ 4 Abs. 1 RBStV).
        </li>
        <li>
          <strong>Deutschlandticket (regulär)</strong>:
          ${fmt(OEPNV_2026.deutschlandticketRegulaerEurMonat)}/Monat × 12 ×
          ${s.haushalt.oepnvNutzer} Nutzer =
          <strong>${fmt(a.oepnvJahr)}/Jahr</strong>.
          Bürgergeld-Empfänger bekommen es je nach Kommune über Sozialticket- oder
          Sozialpass-Programme
          für ${fmt(OEPNV_2026.deutschlandticketErmaessigtEurMonat)}/Monat.
        </li>
      </ul>

      <h4>Ergebnis Arbeit</h4>
      <p class="result-line">
        Netto nach Steuern, Sozialabgaben, Kindergeld, Miete, Rundfunk &amp; ÖPNV:
        <strong>${fmt(a.nettoNachAllemJahr)} / Jahr</strong>
        (${fmt(a.nettoNachAllemMonat)} / Monat).
      </p>
    `,
  };
}

function abschnittBuergergeldseite(r: VergleichsErgebnis): Abschnitt {
  const s = r.szenario;
  const b = r.buergergeld;
  const angemessen = berechneKdU(s.haushalt);
  const mieteZuHoch = s.haushalt.warmmieteEurProMonat > angemessen;

  const regelBlock = b.regelbedarfDetail
    .map((p) => `<li>${p.label}: <strong>${fmt(p.betragJahr / 12)} / Monat</strong></li>`)
    .join("");

  // Mehrbedarfe-Block — konditional je nach Aktivierung
  const mbBloecke: string[] = [];
  if (b.mehrbedarfAlleinerziehendJahr > 0) {
    mbBloecke.push(`
      <li>
        <strong>Alleinerziehend (§ 21 Abs. 3 SGB II)</strong>:
        36 % RBS 1 = ${fmt(REGELBEDARF_2026_EUR_MONAT.alleinstehend * 0.36)}/Monat bei 1 Kind
        &lt; 7 oder 2–3 Kindern &lt; 16; sonst 12 % je Kind, Deckel 60 %. Angewendet:
        <strong>${fmt(b.mehrbedarfAlleinerziehendJahr / 12)} / Monat</strong>.
      </li>
    `);
  }
  if (b.mehrbedarfWarmwasserJahr > 0) {
    mbBloecke.push(`
      <li>
        <strong>Dezentrale Warmwasserbereitung (§ 21 Abs. 7 SGB II)</strong>:
        Boiler/Durchlauferhitzer → prozentualer Aufschlag auf jede Regelbedarfsstufe
        (${pct(MEHRBEDARF_WARMWASSER_PCT.rbs1)} für Erwachsene,
        ${pct(MEHRBEDARF_WARMWASSER_PCT.rbs6)}–${pct(MEHRBEDARF_WARMWASSER_PCT.rbs4)} für Kinder je nach Alter).
        Summe Haushalt: <strong>${fmt(b.mehrbedarfWarmwasserJahr / 12)} / Monat</strong>.
      </li>
    `);
  }
  if (b.mehrbedarfSchwangerschaftJahr > 0) {
    mbBloecke.push(`
      <li>
        <strong>Schwangerschaft ab 13. SSW (§ 21 Abs. 2 SGB II)</strong>:
        ${pct(MEHRBEDARF_SCHWANGERSCHAFT_PCT)} von RBS 1 =
        <strong>${fmt(b.mehrbedarfSchwangerschaftJahr / 12)} / Monat</strong>
        (läuft bis zum Monat der Entbindung).
      </li>
    `);
  }
  const mehrbedarfBlock = mbBloecke.length > 0
    ? `
      <h4>Mehrbedarfe (§ 21 SGB II)</h4>
      <ul>${mbBloecke.join("")}</ul>
    `
    : "";

  const kduText = mieteZuHoch
    ? `Deine Warmmiete (${fmt(s.haushalt.warmmieteEurProMonat)}/Monat) liegt <em>über</em> der
       angemessenen Grenze (${fmt(angemessen)}/Monat, Bruttokaltmiete + Heizkosten).
       Nur die angemessene Miete wird vom Jobcenter übernommen — die Differenz
       <strong>${fmt(s.haushalt.warmmieteEurProMonat - angemessen)}/Monat</strong>
       muss aus dem Regelbedarf finanziert werden.`
    : `Deine Warmmiete (${fmt(s.haushalt.warmmieteEurProMonat)}/Monat) liegt innerhalb
       der Angemessenheitsgrenze (${fmt(angemessen)}/Monat) und wird vollständig übernommen.`;

  // BuT-Detail
  const butBlock = b.butDetail.length > 0
    ? `
      <h4>Bildung &amp; Teilhabe im Detail (§ 28 SGB II)</h4>
      <ul>
        ${b.butDetail.map((p) => `
          <li>${p.label}: <strong>${fmt(p.betragJahr)} / Jahr</strong></li>
        `).join("")}
      </ul>
      <p class="fine">
        Schulbedarfspauschale (§ 28 Abs. 3):
        ${fmt(BUT_2026.schulbedarfEurJahr)}/Jahr/Kind (130 € zum 1.8., 65 € zum 1.2.).
        Teilhabe (Abs. 7): 15 €/Monat bis 18 J. für Verein, Musikschule, Kultur.
        Mittagessen (Abs. 6): Eigenanteil voll übernommen; Schätzung ~70 €/Monat/Kind in Betreuung.
        Klassenfahrten &amp; Schulausflüge (Abs. 2): tatsächliche Kosten; Schätzung
        ${fmt(BUT_2026.klassenfahrtSchulausflugEurJahr)}/Jahr/Schulkind.
        Lernförderung (Abs. 5) nach Bedarf — nicht pauschaliert.
      </p>
      <p>Summe BuT im Jahr: <strong>${fmt(b.butGesamtJahr)}</strong>.</p>
    `
    : "";

  // Geldwerte Vorteile
  const vorteileBlock = `
    <h4>Geldwerte Vorteile (keine Auszahlung, aber Kostenersparnis)</h4>
    <p>
      Bürgergeld-Bezug eröffnet Vergünstigungen, die den Haushalt real entlasten und im
      Vergleich zur „Arbeit“-Seite (die diese Kosten voll zahlt) berücksichtigt werden müssen:
    </p>
    <ul>
      <li>
        <strong>Rundfunkbeitrag-Befreiung (§ 4 Abs. 1 RBStV)</strong>:
        ${fmt(RUNDFUNKBEITRAG_EUR_MONAT)}/Monat = <strong>${fmt(RUNDFUNKBEITRAG_EUR_MONAT * 12)}/Jahr</strong>
        Ersparnis, auf Antrag beim ARD ZDF Deutschlandradio Beitragsservice.
      </li>
      <li>
        <strong>Sozialticket / ÖPNV-Ermäßigung</strong>: Deutschlandticket reduziert auf
        ${fmt(OEPNV_2026.deutschlandticketErmaessigtEurMonat)}/Monat
        (statt ${fmt(OEPNV_2026.deutschlandticketRegulaerEurMonat)}).
        Programm je nach Kommune: Sozialticket, Sozialpass, Stadtpass, …
        Ersparnis pro Nutzer/Jahr:
        ${fmt((OEPNV_2026.deutschlandticketRegulaerEurMonat - OEPNV_2026.deutschlandticketErmaessigtEurMonat) * 12)}.
      </li>
      <li>
        <strong>Lokaler Sozialpass (Zoo/Schwimmbad/Museum/VHS)</strong>:
        ${s.haushalt.wohnlage === "A" || s.haushalt.wohnlage === "B"
          ? `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenAB)}/Jahr pro Erwachsenem (Wohnlage A/B — umfangreiches Angebot)`
          : `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenCD)}/Jahr pro Erwachsenem (Wohnlage C/D — begrenztes Angebot)`}.
      </li>
    </ul>
    <p>
      Summe geldwerte Vorteile: <strong>${fmt(b.geldwerteVorteileJahr)}/Jahr</strong>.
      In dieser Rechnung fließen sie indirekt ein: die Arbeits-Seite zahlt
      ${fmt(r.arbeit.rundfunkbeitragJahr + r.arbeit.oepnvJahr)}/Jahr für Rundfunk+ÖPNV aus dem Netto,
      die Bürgergeld-Seite nur ${fmt(b.oepnvJahr)}/Jahr.
    </p>
  `;

  return {
    titel: "Bürgergeld — Schritt für Schritt",
    defaultOffen: true,
    html: `
      <h4>1. Regelbedarfe (§ 20 SGB II)</h4>
      <p>
        Der Regelbedarf deckt Ernährung, Kleidung, Strom, Hygiene, Freizeit.
        2026 wurde eine <em>Nullrunde</em> beschlossen — Werte unverändert zu 2024/2025.
      </p>
      <ul>${regelBlock}</ul>
      <p>Summe Regelbedarfe: <strong>${fmt(b.regelbedarfJahr / 12)} / Monat</strong>.</p>

      ${mehrbedarfBlock}

      <h4>Kosten der Unterkunft &amp; Heizung (§ 22 SGB II)</h4>
      <p>
        KdU werden in <em>angemessener</em> Höhe übernommen. Richtlinien variieren
        je Kommune; hier angesetzt: Wohnlage
        <strong>${WOHNLAGEN_2026[s.haushalt.wohnlage].label}</strong>
        mit Referenzwerten (Bruttokaltmiete nach Personenzahl + Heizkosten 1,60 €/m²
        nach Bundesheizkostenspiegel). Diese Werte wirken <em>symmetrisch</em>: auch die
        Marktmieten-Vorbelegung im Formular stammt aus derselben Wohnlage — so bleibt
        der Vergleich zwischen Arbeit und Bürgergeld methodisch fair.
      </p>
      <p>${kduText}</p>
      <p>Übernommene KdU im Jahr: <strong>${fmt(b.kdUJahr)}</strong>.</p>

      ${butBlock}

      ${vorteileBlock}

      <h4>Anrechnung Kindergeld (§ 11 SGB II)</h4>
      <p>
        Kindergeld gilt als Einkommen des Kindes und wird in voller Höhe auf den Bedarf
        angerechnet. Angerechnet: <strong>${fmt(b.kindergeldAngerechnetJahr)}</strong> / Jahr
        (${fmt(KINDERGELD_EUR_MONAT)}/Monat × ${r.szenario.haushalt.kinder.length} Kind${r.szenario.haushalt.kinder.length === 1 ? "" : "er"}).
        Die Jobcenter-Auszahlung sinkt entsprechend — der Haushalt bekommt aber insgesamt
        die volle Leistung, weil die Familienkasse das Kindergeld separat auszahlt.
      </p>

      <h4>Ergebnis Bürgergeld</h4>
      <p>
        Haushaltseinnahmen: Regelbedarf ${fmt(b.regelbedarfJahr)}
        + Mehrbedarfe ${fmt(b.mehrbedarfAlleinerziehendJahr + b.mehrbedarfWarmwasserJahr + b.mehrbedarfSchwangerschaftJahr)}
        + KdU ${fmt(b.kdUJahr)}
        + BuT ${fmt(b.butGesamtJahr)}.
        Davon ab: Miete ${fmt(b.mieteJahr)} + ÖPNV ${fmt(b.oepnvJahr)} (Rundfunk befreit).
      </p>
      <p class="result-line">
        Verfügbar nach Miete: <strong>${fmt(b.verfuegbarNachMieteJahr)} / Jahr</strong>
        (${fmt(b.verfuegbarNachMieteMonat)} / Monat),
        zzgl. geldwerte Vorteile ${fmt(b.geldwerteVorteileJahr)} / Jahr.
      </p>
    `,
  };
}

function abschnittVergleich(r: VergleichsErgebnis): Abschnitt {
  const delta = r.arbeit.nettoNachAllemJahr - r.buergergeld.verfuegbarNachMieteJahr;
  const arbeitLohnt = delta > 0;
  const effektivStundenlohn = r.arbeit.bruttoJahr > 0
    ? (delta / (52 * 40)).toFixed(2)
    : "–";

  return {
    titel: "Vergleich &amp; Interpretation",
    defaultOffen: true,
    html: `
      <p>
        Die Differenz zwischen beiden Szenarien — das, was Arbeit an zusätzlichem
        verfügbaren Einkommen bringt — beträgt
        <strong>${arbeitLohnt ? "+" : ""}${fmt(delta)} / Jahr</strong>
        (${arbeitLohnt ? "+" : ""}${fmt(delta / 12)} / Monat).
      </p>
      <p>
        ${arbeitLohnt
         ? `Unter den aktuellen Annahmen liegt Arbeit finanziell vorn. Rechnerisch bringt
           jede Arbeitsstunde gegenüber dem Bürgergeld-Pfad einen <em>effektiven Mehrertrag</em> von rund
             <strong>${effektivStundenlohn} €</strong> (bei 40 h/Woche, 52 Wochen). Das ist
           <u>nicht</u> der Netto-Stundenlohn, sondern die Differenz zwischen den beiden modellierten Pfaden.`
         : `Unter den aktuellen Annahmen liegt der Bürgergeld-Pfad finanziell vorn.
           Typische Treiber sind hohe KdU-Übernahme (große Haushalte, teure Städte) und
             moderaten Arbeitseinkommen mit voller SV-Last.`}
      </p>
      <p>
        <strong>Derzeit mit 0 € angesetzt:</strong> Wohngeld und Kinderzuschlag,
        die für arbeitende Haushalte mit Kindern greifen können und Bürgergeld-Bezug
        ausschließen. Diese sind derzeit Platzhalter (siehe Annahmen).
      </p>
    `,
  };
}

function abschnittAnnahmen(): Abschnitt {
  return {
    titel: "Vereinfachungen &amp; was NICHT gerechnet wird",
    defaultOffen: false,
    html: `
      <p><strong>Modelliert:</strong></p>
      <ul>
        <li>ESt-Grundtarif &amp; Splitting 2026 (§ 32a EStG), Soli-Freigrenze (§ 3 SolZG),
          Günstigerprüfung Kindergeld ↔ Kinderfreibetrag (§§ 31, 32 EStG); bei nicht
          zusammen veranlagten Eltern standardmäßig mit hälftigem Freibetrag, sofern
          keine Übertragung modelliert ist.</li>
        <li>Sozialabgaben Angestellt: paritätischer AN/AG-Split für GKV (14,6 % + Ø Zusatz),
          PV (3,6 % + Kinderabschläge / Kinderlos-Zuschlag nur AN), RV (18,6 %), AV (2,6 %);
          Beitragsbemessungsgrenzen 2026 für GKV/PV und RV/AV getrennt.</li>
        <li>Regelbedarfe §§ 20, 23 SGB II (Nullrunde 2026).</li>
        <li>Mehrbedarfe § 21 SGB II: Alleinerziehend (Abs. 3), dezentrale Warmwasserbereitung
          (Abs. 7), Schwangerschaft ab 13. SSW (Abs. 2).</li>
        <li>Bildung &amp; Teilhabe § 28 SGB II: Schulbedarfspauschale, Teilhabe,
          Mittagessen, Klassenfahrten/Schulausflüge (pauschalisierte Schätzung).</li>
        <li>KdU § 22 SGB II mit wohnlageabhängiger Angemessenheitsgrenze; Repräsentativwerte und Quellen sind im öffentlichen Anhang ausgewiesen.</li>
        <li>Rundfunkbeitrag-Befreiung (§ 4 RBStV), lokale Sozialpass-/Sozialticket-ÖPNV-Ermäßigung.</li>
        <li>Kindergeld-Anrechnung § 11 SGB II.</li>
      </ul>
      <p><strong>NICHT modelliert:</strong></p>
      <ul>
        <li>
          <strong>Wohngeld (§ 19 WoGG)</strong> und <strong>Kinderzuschlag (§ 6a BKGG)</strong>
          liefern Platzhalter-Null. Für arbeitende Familien mit Kindern können sie das
          verfügbare Einkommen signifikant erhöhen.
        </li>
        <li>
          Weitere <strong>Mehrbedarfe § 21</strong>: Behinderung (Abs. 4), kostenaufwändige
          Ernährung aus medizinischen Gründen (Abs. 5), dezentrale Warmwassererzeugung in
          Kombination mit weiteren Sonderfällen.
        </li>
        <li>
          <strong>Einmalige Bedarfe § 24 SGB II</strong> (Erstausstattung Wohnung, Kleidung bei
          Schwangerschaft/Geburt, orthopädische Schuhe etc.).
        </li>
        <li>
          <strong>Lernförderung § 28 Abs. 5</strong> — nur nach Bedarf, nicht pauschalisierbar.
        </li>
        <li>
          <strong>Kirchensteuer</strong> (8–9 % der ESt) wird nicht gerechnet.
        </li>
        <li>
          <strong>Werbungskosten</strong> über den Arbeitnehmer-Pauschbetrag
          (1.230 €/Jahr, § 9a EStG) hinaus werden nicht abgezogen.
        </li>
        <li>
          <strong>Freibeträge auf Erwerbseinkommen</strong> (§ 11b SGB II) — der Rechner
          vergleicht reine Fälle „100 % Arbeit“ vs. „100 % Bürgergeld“, keine Aufstockung.
        </li>
        <li>
          <strong>Wohnlage-Klassen A/B/C/D</strong>: Eigene Repräsentativklassen des
          Rechners auf Basis der BBSR-Raumtypen, keine exakten Kommunen. Die exakten
          Modellwerte und exemplarischen Primärquellen sind im öffentlichen Quellenanhang
          ausgewiesen. Innerhalb einer Klasse bestehen reale Spreizungen. Beide Seiten
          (KdU-Obergrenze §22 SGB II und Marktmieten-Vorschlag) skalieren gleichzeitig —
          damit bleibt der Vergleich methodisch neutral. Wer die tatsächliche Miete kennt,
          sollte sie überschreiben.
        </li>
        <li>
          <strong>Pflegeversicherung</strong>: Für die Kinderabschläge wird angenommen,
          dass alle Kinder unter 25 sind (realistisch für die hier modellierten Familien).
          Annahme Alter versicherte Person: 35 Jahre (für PV-Kinderlos-Zuschlag).
        </li>
      </ul>
    `,
  };
}

function labelHaushaltsTyp(t: Szenario["haushalt"]["typ"]): string {
  switch (t) {
    case "single":
      return "Single";
    case "alleinerziehend":
      return "Alleinerziehend";
    case "paar":
      return "Paar (unverheiratet)";
    case "paar_verheiratet":
      return "Paar (verheiratet, Splitting)";
  }
}

function pvSatzText(kinderU25: number): { text: string; paragraf: string } {
  if (kinderU25 === 0) {
    return {
      text: `2,40 % (1,80 % + 0,60 % Zuschlag für Kinderlose ab 23 J.)`,
      paragraf: "§ 55 Abs. 3 SGB XI",
    };
  }
  if (kinderU25 === 1) {
    return { text: "1,80 %", paragraf: "§ 55 Abs. 1 SGB XI" };
  }
  const abschlag = Math.min(kinderU25, 5) - 1;
  const satz = (0.018 - abschlag * 0.0025) * 100;
  return {
    text: `${satz.toFixed(2).replace(".", ",")} % (${kinderU25} Kinder < 25, Abschlag 0,25 % je Kind ab dem 2.)`,
    paragraf: "§ 55 Abs. 3a SGB XI",
  };
}

function estZone(zvE: number): { nummer: number; beschreibung: string; formel: string } {
  const t = EST_TARIF_2026;
  if (zvE <= t.grundfreibetrag) {
    return {
      nummer: 1,
      beschreibung: `zvE ≤ ${fmt(t.grundfreibetrag)} (Grundfreibetrag)`,
      formel: "Steuerfrei: ESt = 0.",
    };
  }
  if (zvE <= t.zone2Ende) {
    return {
      nummer: 2,
      beschreibung: `${fmt(t.grundfreibetrag)} < zvE ≤ ${fmt(t.zone2Ende)} (Eingangsbereich)`,
      formel: "ESt = (914,51·y + 1.400)·y, mit y = (zvE − 12.348) / 10.000.",
    };
  }
  if (zvE <= t.zone3Ende) {
    return {
      nummer: 3,
      beschreibung: `${fmt(t.zone2Ende)} < zvE ≤ ${fmt(t.zone3Ende)} (Progressionszone)`,
      formel: "ESt = (173,10·z + 2.397)·z + 1.034,87, mit z = (zvE − 17.799) / 10.000.",
    };
  }
  if (zvE <= t.zone4Ende) {
    return {
      nummer: 4,
      beschreibung: `${fmt(t.zone3Ende)} < zvE ≤ ${fmt(t.zone4Ende)} (Spitzensteuersatz 42 %)`,
      formel: "ESt = 0,42·zvE − 11.135,63.",
    };
  }
  return {
    nummer: 5,
    beschreibung: `zvE > ${fmt(t.zone4Ende)} (Reichensteuer 45 %)`,
    formel: "ESt = 0,45·zvE − 19.470,38.",
  };
}

function fmt(v: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function pct(v: number): string {
  return `${(v * 100).toFixed(2).replace(".", ",")} %`;
}

// Reference passthrough to satisfy "unused" checks for constant catalog entries.
void WOHNLAGEN_2026;
