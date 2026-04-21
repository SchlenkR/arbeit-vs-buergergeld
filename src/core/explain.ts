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
import { T, fmtEur, locale } from "../i18n";

export interface Abschnitt {
  titel: string;
  defaultOffen: boolean;
  html: string;
}

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
    titel: T("Was macht dieses Tool?", "What does this tool do?"),
    defaultOffen: true,
    html: T(
      `
      <p>
        Der Rechner stellt für denselben Haushalt zwei Fälle gegenüber:
        <strong>Einkommen aus einem Arbeitsverhältnis (abhängige Beschäftigung)</strong> versus
        <strong>Einkommen aus Bürgergeld</strong> (ab 01.07.2026: „Neue Grundsicherung").
        Gerechnet wird auf Jahresbasis in Euro, Rechtsstand 2026.
      </p>
      <p>
        Beide Szenarien werden auf die gleiche Kennzahl geführt:
        <em>verfügbares Einkommen nach Miete pro Monat</em>. Der Sankey-Fluss links zeigt,
        was vom Bruttoeinkommen übrig bleibt. Rechts zeigt er, woraus sich die
        Bürgergeld-Leistung zusammensetzt.
      </p>
    `,
      `
      <p>
        The calculator compares two cases for the same household:
        <strong>income from employment (dependent employment)</strong> versus
        <strong>income from Bürgergeld</strong> (from 1 July 2026: "Neue Grundsicherung").
        Everything is computed on an annual basis in euros, legal status 2026.
      </p>
      <p>
        Both scenarios lead to the same headline figure:
        <em>disposable income after rent per month</em>. The Sankey flow on the left shows
        what remains of gross income. On the right it shows how the Bürgergeld
        benefit is composed.
      </p>
    `,
    ),
  };
}

function abschnittParameter(s: Szenario): Abschnitt {
  const anzKinder = s.haushalt.kinder.length;
  const kinderListe = anzKinder > 0
    ? s.haushalt.kinder
        .map(
          (k, i) =>
            T(`Kind ${i + 1}: ${k.alter} J.`, `Child ${i + 1}: age ${k.alter}`),
        )
        .join(", ")
    : T("keine", "none");
  const wohnlage = WOHNLAGEN_2026[s.haushalt.wohnlage];
  return {
    titel: T("Deine Parameter", "Your parameters"),
    defaultOffen: false,
    html: `
      <ul class="param-list">
        <li>${T("Haushaltstyp", "Household type")}: <strong>${labelHaushaltsTyp(s.haushalt.typ)}</strong></li>
        <li>${T("Kinder", "Children")}: <strong>${anzKinder}</strong> (${kinderListe})</li>
        <li>
          ${T("Wohnlage", "Residential tier")}: <strong>${wohnlage.label}</strong>
          <small class="muted"> (${T("Beispiele", "Examples")}: ${wohnlage.beispiele})</small>
        </li>
        <li>${T("Warmmiete angenommen", "Warm rent assumed")}: <strong>${fmt(s.haushalt.warmmieteEurProMonat)} / ${T("Monat", "month")}</strong></li>
        <li>
          ${T("Warmwasser dezentral", "Decentralised hot water")}: <strong>${
            s.haushalt.warmwasserDezentral
              ? T("ja (MB §21⁷)", "yes (add. need §21(7))")
              : T("nein", "no")
          }</strong>,
          ${T("Schwangerschaft", "Pregnancy")}: <strong>${
            s.haushalt.schwangerschaftAb13SSW
              ? T("ja ab 13. SSW (MB §21²)", "yes from 13th week (add. need §21(2))")
              : T("nein", "no")
          }</strong>
        </li>
        <li>${T("ÖPNV-Nutzer (Deutschlandticket)", "Transit users (Deutschlandticket)")}: <strong>${s.haushalt.oepnvNutzer}</strong></li>
        <li>${T("Arbeitnehmer-Brutto", "Employee gross")}: <strong>${fmt(s.arbeit.bruttoJahr)} / ${T("Jahr", "year")}</strong> (${T("angestellt, sv-pflichtig", "employed, subject to social security")})</li>
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
  const soliBasisWeichtAb =
    Math.abs(a.soliBemessungsgrundlageJahr - a.einkommensteuerJahr) > 0.005;
  const soliBasisText = soliBasisWeichtAb
    ? T(
        `Für den Soli zählt hier die festzusetzende Einkommensteuer nach Kinderfreibetrag: ${fmt(a.soliBemessungsgrundlageJahr)}. Die zusätzliche Kindergeld-Zurechnung aus der Günstigerprüfung (${fmt(a.einkommensteuerJahr)}) erhöht den Solidaritätszuschlag nicht.`,
        `For the solidarity surcharge what counts is the assessed income tax after the child allowance: ${fmt(a.soliBemessungsgrundlageJahr)}. The additional child-benefit add-back from the more-favourable test (${fmt(a.einkommensteuerJahr)}) does not increase the surcharge.`,
      )
    : T(
        `Die für den Soli maßgebliche Einkommensteuer beträgt ${fmt(a.soliBemessungsgrundlageJahr)}.`,
        `The income tax relevant for the surcharge is ${fmt(a.soliBemessungsgrundlageJahr)}.`,
      );
  const freigrenze = verheiratet
    ? SOLI_2026.freigrenzeEstEinzeln * 2
    : SOLI_2026.freigrenzeEstEinzeln;
  const soliText =
    a.soliJahr > 0
      ? T(
          `${soliBasisText} Sie liegt über der Freigrenze von ${fmt(freigrenze)} (${verheiratet ? "Zusammenveranlagung" : "Einzelveranlagung"}), daher fällt Solidaritätszuschlag an: <strong>${fmt(a.soliJahr)}</strong>.`,
          `${soliBasisText} It exceeds the exemption threshold of ${fmt(freigrenze)} (${verheiratet ? "joint assessment" : "single assessment"}), so the solidarity surcharge applies: <strong>${fmt(a.soliJahr)}</strong>.`,
        )
      : T(
          `${soliBasisText} Sie liegt unter der Soli-Freigrenze (${fmt(freigrenze)}), deshalb fällt <strong>kein Solidaritätszuschlag</strong> an.`,
          `${soliBasisText} It is below the exemption threshold (${fmt(freigrenze)}), so <strong>no solidarity surcharge</strong> applies.`,
        );

  const kinderBlock =
    s.haushalt.kinder.length > 0
      ? T(
          `
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
        ${
          a.steuerlicheEntlastungDurchKinderfreibetrag > 0
            ? `Bei deinem Einkommen ist der Freibetrag günstiger: zusätzliche Netto-Entlastung von <strong>${fmt(a.steuerlicheEntlastungDurchKinderfreibetrag)}</strong> über das Kindergeld hinaus.`
            : `Bei deinem Einkommen bleibt das Kindergeld günstiger; der Freibetrag wird nicht angesetzt.`
        }
      </p>
    `,
          `
      <h4>Child benefit &amp; child allowance</h4>
      <p>
        For ${s.haushalt.kinder.length} child${s.haushalt.kinder.length === 1 ? "" : "ren"}
        child benefit of <strong>${fmt(KINDERGELD_EUR_MONAT)}/month</strong> is paid
        (§ 66 EStG), i. e. ${fmt(a.kindergeldJahr)} per year.
      </p>
      <p>
        The tax office performs the <em>more-favourable test</em> (§ 31 EStG): it compares the
        child benefit already paid with the tax saving the child allowance
        (${fmt(KINDERFREIBETRAG_2026.saechlichesExistenzminimum)} material subsistence +
        ${fmt(KINDERFREIBETRAG_2026.bea)} care/education, together
        ${fmt(KINDERFREIBETRAG_2026.saechlichesExistenzminimum + KINDERFREIBETRAG_2026.bea)}
        per child) would yield.
        ${
          a.steuerlicheEntlastungDurchKinderfreibetrag > 0
            ? `At your income the allowance is more favourable: additional net relief of <strong>${fmt(a.steuerlicheEntlastungDurchKinderfreibetrag)}</strong> on top of child benefit.`
            : `At your income the child benefit remains more favourable; the allowance is not applied.`
        }
      </p>
    `,
        )
      : "";

  return {
    titel: T("Arbeit; Schritt für Schritt", "Work; step by step"),
    defaultOffen: true,
    html: T(
      `
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
        geteilt; mit Ausnahme des PV-Kinderlos-Zuschlags und des PV-Kinderabschlags ab
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
        ${
          ueberBbgRv
            ? `Dein Brutto (${fmt(bruttoMonat)}/Monat) liegt über <em>beiden</em> BBGs; SV wird auf allen Säulen gedeckelt.`
            : ueberBbgGkv
              ? `Dein Brutto liegt über der BBG GKV/PV, aber unter der BBG RV/AV; KV/PV gedeckelt, RV/AV vom vollen Brutto.`
              : `Dein Brutto (${fmt(bruttoMonat)}/Monat) liegt unterhalb beider BBGs; SV vom vollen Brutto.`
        }
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
        ${
          verheiratet
            ? `Als Ehepaar kommt das <em>Splitting-Verfahren</em> zur Anwendung: ESt = 2 · Grundtarif(zvE / 2).`
            : `Einzelveranlagung.`
        }
        Ergebnis: <strong>${fmt(a.einkommensteuerJahr)}</strong>${
          s.haushalt.kinder.length > 0 ? " (nach Günstigerprüfung, siehe unten)" : ""
        }.
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
        entfallen oder stark reduziert sind; sonst wäre der Vergleich unfair:
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
      `
      <h4>1. Total cost to the employer</h4>
      <p>
        As an employee subject to social security, the employer pays the
        <em>employer share</em> of social insurance on top of the gross salary
        (ancillary wage costs). This is not your net income, but the real cost the
        job generates.
      </p>
      <ul>
        <li>Employee gross (per contract): <strong>${fmt(a.bruttoJahr)} / year</strong></li>
        <li>Employer share of social insurance: <strong>+ ${fmt(a.arbeitgeberAnteilJahr)} / year</strong></li>
        <li>
          <strong>Total cost to employer: ${fmt(a.gesamtBruttoJahr)} / year</strong>
          (≈ ${fmt(a.gesamtBruttoJahr / 12)} / month)
        </li>
      </ul>

      <h4>2. Employee social contributions</h4>
      <p>
        Contributions are split <em>equally</em> between employee and employer;
        except for the childless surcharge in long-term care and the child
        reduction from the 2nd child &lt; 25, which only affect the employee side.
      </p>
      <ul>
        <li>
          Health insurance (§ 241/242 SGB V): general rate
          ${pct(SV_2026.gkvSatzAllgemein)} + avg. additional
          ${pct(SV_2026.gkvZusatzbeitragDurchschnitt)} = <strong>${pct(gkvSatzGesamt)}</strong>,
          split equally at ${pct(gkvSatzGesamt / 2)} each.
        </li>
        <li>
          Long-term care (§ 55 SGB XI): employee side <strong>${pvSatz.text}</strong>
          (${pvSatz.paragraf}), employer side ${pct(SV_2026.pvSatzMitKind / 2)} flat.
        </li>
        <li>
          Pension (§ 157 SGB VI): ${pct(SV_2026.rvSatz)}, split equally at
          ${pct(SV_2026.rvSatz / 2)}.
        </li>
        <li>
          Unemployment (§ 341 SGB III): ${pct(SV_2026.avSatz)}, split equally at
          ${pct(SV_2026.avSatz / 2)}.
        </li>
      </ul>
      <p>
        Contribution ceilings (§ 159 SGB VI, § 223 SGB V): ceiling health/care
        <strong>${fmt(SV_2026.bbgGkvPvMonat)}/month</strong>, ceiling pension/unemployment
        <strong>${fmt(SV_2026.bbgRvAlvMonat)}/month</strong>.
        ${
          ueberBbgRv
            ? `Your gross (${fmt(bruttoMonat)}/month) is above <em>both</em> ceilings; all pillars are capped.`
            : ueberBbgGkv
              ? `Your gross is above the health/care ceiling but below pension/unemployment; health/care capped, pension/unemployment on full gross.`
              : `Your gross (${fmt(bruttoMonat)}/month) is below both ceilings; all pillars on full gross.`
        }
      </p>
      <p>
        <strong>Total employee share: ${fmt(a.sozialabgabenJahr)} / year</strong> (reduces your net).
      </p>

      <h4>3. Taxable income</h4>
      <p>
        From gross income we subtract the <em>deductible provision expenses</em>
        according to § 10 EStG, the <em>employee flat rate</em> (§ 9a no. 1 EStG, 1,230 €/year)
        and the <em>special expenses flat rate</em> (§ 10c EStG, ${fmt(verheiratet ? 72 : 36)}).
        Within this: pension full, statutory health for basic cover with a 4 % deduction
        because of sick-pay entitlement, care full, unemployment only while the ceiling
        for other provision expenses is not yet exhausted.
      </p>
      <p>
        Taxable income = ${fmt(a.bruttoJahr)} − ${fmt(a.abziehbareVorsorgeaufwendungenJahr)} − 1,230 € − ${fmt(verheiratet ? 72 : 36)}
        = <strong>${fmt(a.zvE)}</strong>.
      </p>

      <h4>4. Income tax (§ 32a EStG)</h4>
      <p>
        The 2026 basic tariff has five zones. Your taxable income lies in <strong>zone ${zone.nummer}</strong>
        (${zone.beschreibung}). ${zone.formel}
      </p>
      <p>
        ${
          verheiratet
            ? `As a married couple the <em>splitting procedure</em> applies: income tax = 2 · basic-tariff(taxable income / 2).`
            : `Individual assessment.`
        }
        Result: <strong>${fmt(a.einkommensteuerJahr)}</strong>${
          s.haushalt.kinder.length > 0
            ? " (after more-favourable test, see below)"
            : ""
        }.
      </p>

      <h4>5. Solidarity surcharge</h4>
      <p>${soliText}</p>

      ${kinderBlock}

      <h4>6. Rent</h4>
      <p>
        Your assumed warm rent is
        <strong>${fmt(s.haushalt.warmmieteEurProMonat)}/month</strong>
        (${fmt(a.mieteJahr)}/year). You pay this fully out of net income.
      </p>

      <h4>7. Broadcasting fee &amp; transit</h4>
      <p>
        Two fixed costs are shown explicitly because they disappear or are heavily
        reduced on the Bürgergeld side; otherwise the comparison would be unfair:
      </p>
      <ul>
        <li>
          <strong>Broadcasting fee</strong> (§ 2 RBStV):
          ${fmt(RUNDFUNKBEITRAG_EUR_MONAT)}/month × 12 = <strong>${fmt(a.rundfunkbeitragJahr)}/year</strong>.
          Working households pay in full; Bürgergeld recipients can apply for exemption (§ 4(1) RBStV).
        </li>
        <li>
          <strong>Deutschlandticket (regular)</strong>:
          ${fmt(OEPNV_2026.deutschlandticketRegulaerEurMonat)}/month × 12 ×
          ${s.haushalt.oepnvNutzer} users =
          <strong>${fmt(a.oepnvJahr)}/year</strong>.
          Bürgergeld recipients get it via welfare ticket or welfare pass
          programmes (varies by municipality) for ${fmt(OEPNV_2026.deutschlandticketErmaessigtEurMonat)}/month.
        </li>
      </ul>

      <h4>Work result</h4>
      <p class="result-line">
        Net after taxes, social contributions, child benefit, rent, broadcasting &amp; transit:
        <strong>${fmt(a.nettoNachAllemJahr)} / year</strong>
        (${fmt(a.nettoNachAllemMonat)} / month).
      </p>
    `,
    ),
  };
}

function abschnittBuergergeldseite(r: VergleichsErgebnis): Abschnitt {
  const s = r.szenario;
  const b = r.buergergeld;
  const angemessen = berechneKdU(s.haushalt);
  const mieteZuHoch = s.haushalt.warmmieteEurProMonat > angemessen;

  const regelBlock = b.regelbedarfDetail
    .map(
      (p) =>
        `<li>${p.label}: <strong>${fmt(p.betragJahr / 12)} / ${T("Monat", "month")}</strong></li>`,
    )
    .join("");

  const mbBloecke: string[] = [];
  if (b.mehrbedarfAlleinerziehendJahr > 0) {
    mbBloecke.push(
      T(
        `
      <li>
        <strong>Alleinerziehend (§ 21 Abs. 3 SGB II)</strong>:
        36 % RBS 1 = ${fmt(REGELBEDARF_2026_EUR_MONAT.alleinstehend * 0.36)}/Monat bei 1 Kind
        &lt; 7 oder 2-3 Kindern &lt; 16; sonst 12 % je Kind, Deckel 60 %. Angewendet:
        <strong>${fmt(b.mehrbedarfAlleinerziehendJahr / 12)} / Monat</strong>.
      </li>
    `,
        `
      <li>
        <strong>Single parent (§ 21(3) SGB II)</strong>:
        36 % of level 1 = ${fmt(REGELBEDARF_2026_EUR_MONAT.alleinstehend * 0.36)}/month with 1 child
        &lt; 7 or 2-3 children &lt; 16; otherwise 12 % per child, cap 60 %. Applied:
        <strong>${fmt(b.mehrbedarfAlleinerziehendJahr / 12)} / month</strong>.
      </li>
    `,
      ),
    );
  }
  if (b.mehrbedarfWarmwasserJahr > 0) {
    mbBloecke.push(
      T(
        `
      <li>
        <strong>Dezentrale Warmwasserbereitung (§ 21 Abs. 7 SGB II)</strong>:
        Boiler/Durchlauferhitzer → prozentualer Aufschlag auf jede Regelbedarfsstufe
        (${pct(MEHRBEDARF_WARMWASSER_PCT.rbs1)} für Erwachsene,
        ${pct(MEHRBEDARF_WARMWASSER_PCT.rbs6)} - ${pct(MEHRBEDARF_WARMWASSER_PCT.rbs4)} für Kinder je nach Alter).
        Summe Haushalt: <strong>${fmt(b.mehrbedarfWarmwasserJahr / 12)} / Monat</strong>.
      </li>
    `,
        `
      <li>
        <strong>Decentralised hot water (§ 21(7) SGB II)</strong>:
        boiler/instantaneous heater → percentage surcharge on every standard-need level
        (${pct(MEHRBEDARF_WARMWASSER_PCT.rbs1)} for adults,
        ${pct(MEHRBEDARF_WARMWASSER_PCT.rbs6)} - ${pct(MEHRBEDARF_WARMWASSER_PCT.rbs4)} for children by age).
        Household sum: <strong>${fmt(b.mehrbedarfWarmwasserJahr / 12)} / month</strong>.
      </li>
    `,
      ),
    );
  }
  if (b.mehrbedarfSchwangerschaftJahr > 0) {
    mbBloecke.push(
      T(
        `
      <li>
        <strong>Schwangerschaft ab 13. SSW (§ 21 Abs. 2 SGB II)</strong>:
        ${pct(MEHRBEDARF_SCHWANGERSCHAFT_PCT)} von RBS 1 =
        <strong>${fmt(b.mehrbedarfSchwangerschaftJahr / 12)} / Monat</strong>
        (läuft bis zum Monat der Entbindung).
      </li>
    `,
        `
      <li>
        <strong>Pregnancy from 13th week (§ 21(2) SGB II)</strong>:
        ${pct(MEHRBEDARF_SCHWANGERSCHAFT_PCT)} of level 1 =
        <strong>${fmt(b.mehrbedarfSchwangerschaftJahr / 12)} / month</strong>
        (runs until the month of delivery).
      </li>
    `,
      ),
    );
  }
  const mehrbedarfBlock =
    mbBloecke.length > 0
      ? T(
          `<h4>Mehrbedarfe (§ 21 SGB II)</h4><ul>${mbBloecke.join("")}</ul>`,
          `<h4>Additional needs (§ 21 SGB II)</h4><ul>${mbBloecke.join("")}</ul>`,
        )
      : "";

  const kduText = mieteZuHoch
    ? T(
        `Deine Warmmiete (${fmt(s.haushalt.warmmieteEurProMonat)}/Monat) liegt <em>über</em> der angemessenen Grenze (${fmt(angemessen)}/Monat, Bruttokaltmiete + Heizkosten). Nur die angemessene Miete wird vom Jobcenter übernommen; die Differenz <strong>${fmt(s.haushalt.warmmieteEurProMonat - angemessen)}/Monat</strong> muss aus dem Regelbedarf finanziert werden.`,
        `Your warm rent (${fmt(s.haushalt.warmmieteEurProMonat)}/month) is <em>above</em> the reasonable limit (${fmt(angemessen)}/month, cold rent + heating). Only the reasonable share is covered by the jobcenter; the difference <strong>${fmt(s.haushalt.warmmieteEurProMonat - angemessen)}/month</strong> must come from the standard need.`,
      )
    : T(
        `Deine Warmmiete (${fmt(s.haushalt.warmmieteEurProMonat)}/Monat) liegt innerhalb der Angemessenheitsgrenze (${fmt(angemessen)}/Monat) und wird vollständig übernommen.`,
        `Your warm rent (${fmt(s.haushalt.warmmieteEurProMonat)}/month) is within the reasonable limit (${fmt(angemessen)}/month) and is fully covered.`,
      );

  const butBlock =
    b.butDetail.length > 0
      ? T(
          `
      <h4>Bildung &amp; Teilhabe im Detail (§ 28 SGB II)</h4>
      <ul>
        ${b.butDetail.map((p) => `<li>${p.label}: <strong>${fmt(p.betragJahr)} / Jahr</strong></li>`).join("")}
      </ul>
      <p class="fine">
        Schulbedarfspauschale (§ 28 Abs. 3):
        ${fmt(BUT_2026.schulbedarfEurJahr)}/Jahr/Kind (130 € zum 1.8., 65 € zum 1.2.).
        Teilhabe (Abs. 7): 15 €/Monat bis 18 J. für Verein, Musikschule, Kultur.
        Mittagessen (Abs. 6): Eigenanteil voll übernommen; Schätzung ~70 €/Monat/Kind in Betreuung.
        Klassenfahrten &amp; Schulausflüge (Abs. 2): tatsächliche Kosten; Schätzung
        ${fmt(BUT_2026.klassenfahrtSchulausflugEurJahr)}/Jahr/Schulkind.
        Lernförderung (Abs. 5) nach Bedarf; nicht pauschaliert.
      </p>
      <p>Summe BuT im Jahr: <strong>${fmt(b.butGesamtJahr)}</strong>.</p>
    `,
          `
      <h4>Education &amp; participation in detail (§ 28 SGB II)</h4>
      <ul>
        ${b.butDetail.map((p) => `<li>${p.label}: <strong>${fmt(p.betragJahr)} / year</strong></li>`).join("")}
      </ul>
      <p class="fine">
        School supplies allowance (§ 28(3)):
        ${fmt(BUT_2026.schulbedarfEurJahr)}/year/child (130 € on 1 Aug, 65 € on 1 Feb).
        Participation (§ 28(7)): 15 €/month up to age 18 for clubs, music, culture.
        Lunch (§ 28(6)): own share fully covered; estimate ~70 €/month/child in care.
        Class trips &amp; school excursions (§ 28(2)): actual costs; estimate
        ${fmt(BUT_2026.klassenfahrtSchulausflugEurJahr)}/year/school child.
        Tutoring (§ 28(5)) as needed; no flat rate.
      </p>
      <p>Total education &amp; participation per year: <strong>${fmt(b.butGesamtJahr)}</strong>.</p>
    `,
        )
      : "";

  const sozialpassText =
    s.haushalt.wohnlage === "A" || s.haushalt.wohnlage === "B"
      ? T(
          `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenAB)}/Jahr pro Erwachsenem (Wohnlage A/B; umfangreiches Angebot)`,
          `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenAB)}/year per adult (tier A/B; broad offering)`,
        )
      : T(
          `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenCD)}/Jahr pro Erwachsenem (Wohnlage C/D; begrenztes Angebot)`,
          `${fmt(OEPNV_2026.sonstigeVorteileEurJahrProErwachsenenCD)}/year per adult (tier C/D; limited offering)`,
        );

  const vorteileBlock = T(
    `
    <h4>Geldwerte Vorteile (keine Auszahlung, aber Kostenersparnis)</h4>
    <p>
      Bürgergeld-Bezug eröffnet Vergünstigungen, die den Haushalt real entlasten und im
      Vergleich zur „Arbeit"-Seite (die diese Kosten voll zahlt) berücksichtigt werden müssen:
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
        ${sozialpassText}.
      </li>
    </ul>
    <p>
      Summe geldwerte Vorteile: <strong>${fmt(b.geldwerteVorteileJahr)}/Jahr</strong>.
      In dieser Rechnung fließen sie indirekt ein: die Arbeits-Seite zahlt
      ${fmt(r.arbeit.rundfunkbeitragJahr + r.arbeit.oepnvJahr)}/Jahr für Rundfunk+ÖPNV aus dem Netto,
      die Bürgergeld-Seite nur ${fmt(b.oepnvJahr)}/Jahr.
    </p>
  `,
    `
    <h4>In-kind benefits (no cash payout, but cost savings)</h4>
    <p>
      Bürgergeld entitles households to reductions that lighten the real cost burden
      and must be factored in against the "Work" side (which pays these costs in full):
    </p>
    <ul>
      <li>
        <strong>Broadcasting-fee exemption (§ 4(1) RBStV)</strong>:
        ${fmt(RUNDFUNKBEITRAG_EUR_MONAT)}/month = <strong>${fmt(RUNDFUNKBEITRAG_EUR_MONAT * 12)}/year</strong>
        saving, on request via the ARD ZDF Deutschlandradio contribution service.
      </li>
      <li>
        <strong>Welfare ticket / transit discount</strong>: Deutschlandticket reduced to
        ${fmt(OEPNV_2026.deutschlandticketErmaessigtEurMonat)}/month
        (instead of ${fmt(OEPNV_2026.deutschlandticketRegulaerEurMonat)}).
        Programme depends on municipality: welfare ticket, welfare pass, city pass, …
        Saving per user/year:
        ${fmt((OEPNV_2026.deutschlandticketRegulaerEurMonat - OEPNV_2026.deutschlandticketErmaessigtEurMonat) * 12)}.
      </li>
      <li>
        <strong>Local welfare pass (zoo/pool/museum/adult education)</strong>:
        ${sozialpassText}.
      </li>
    </ul>
    <p>
      Total in-kind benefits: <strong>${fmt(b.geldwerteVorteileJahr)}/year</strong>.
      They flow into this calculation indirectly: the work side pays
      ${fmt(r.arbeit.rundfunkbeitragJahr + r.arbeit.oepnvJahr)}/year for broadcasting+transit from its net,
      the Bürgergeld side only ${fmt(b.oepnvJahr)}/year.
    </p>
  `,
  );

  return {
    titel: T("Bürgergeld; Schritt für Schritt", "Bürgergeld; step by step"),
    defaultOffen: true,
    html: T(
      `
      <h4>1. Regelbedarfe (§ 20 SGB II)</h4>
      <p>
        Der Regelbedarf deckt Ernährung, Kleidung, Strom, Hygiene, Freizeit.
        2026 wurde eine <em>Nullrunde</em> beschlossen; Werte unverändert zu 2024/2025.
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
        Marktmieten-Vorbelegung im Formular stammt aus derselben Wohnlage; so bleibt
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
        Die Jobcenter-Auszahlung sinkt entsprechend; der Haushalt bekommt aber insgesamt
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
      `
      <h4>1. Standard needs (§ 20 SGB II)</h4>
      <p>
        The standard need covers food, clothing, electricity, hygiene, leisure.
        For 2026 a <em>zero round</em> was decided; values unchanged from 2024/2025.
      </p>
      <ul>${regelBlock}</ul>
      <p>Total standard needs: <strong>${fmt(b.regelbedarfJahr / 12)} / month</strong>.</p>

      ${mehrbedarfBlock}

      <h4>Housing &amp; heating costs (§ 22 SGB II)</h4>
      <p>
        Housing costs are covered at a <em>reasonable</em> level. Guidelines vary by
        municipality; used here: residential tier
        <strong>${WOHNLAGEN_2026[s.haushalt.wohnlage].label}</strong>
        with reference values (cold rent by persons + heating 1.60 €/m²
        per federal heating index). These values act <em>symmetrically</em>: the
        market-rent default in the form also comes from the same tier; so the
        comparison between work and Bürgergeld remains methodically fair.
      </p>
      <p>${kduText}</p>
      <p>Housing costs covered per year: <strong>${fmt(b.kdUJahr)}</strong>.</p>

      ${butBlock}

      ${vorteileBlock}

      <h4>Child benefit offset (§ 11 SGB II)</h4>
      <p>
        Child benefit counts as the child's income and is fully offset against the need.
        Offset: <strong>${fmt(b.kindergeldAngerechnetJahr)}</strong> / year
        (${fmt(KINDERGELD_EUR_MONAT)}/month × ${r.szenario.haushalt.kinder.length} child${r.szenario.haushalt.kinder.length === 1 ? "" : "ren"}).
        The jobcenter payment falls accordingly; the household still receives the full
        benefit because the Familienkasse pays the child benefit separately.
      </p>

      <h4>Bürgergeld result</h4>
      <p>
        Household income: standard need ${fmt(b.regelbedarfJahr)}
        + additional needs ${fmt(b.mehrbedarfAlleinerziehendJahr + b.mehrbedarfWarmwasserJahr + b.mehrbedarfSchwangerschaftJahr)}
        + housing ${fmt(b.kdUJahr)}
        + education ${fmt(b.butGesamtJahr)}.
        Minus: rent ${fmt(b.mieteJahr)} + transit ${fmt(b.oepnvJahr)} (broadcasting exempt).
      </p>
      <p class="result-line">
        Disposable after rent: <strong>${fmt(b.verfuegbarNachMieteJahr)} / year</strong>
        (${fmt(b.verfuegbarNachMieteMonat)} / month),
        plus in-kind benefits ${fmt(b.geldwerteVorteileJahr)} / year.
      </p>
    `,
    ),
  };
}

function abschnittVergleich(r: VergleichsErgebnis): Abschnitt {
  const delta = r.arbeit.nettoNachAllemJahr - r.buergergeld.verfuegbarNachMieteJahr;
  const arbeitLohnt = delta > 0;
  const effektivStundenlohn =
    r.arbeit.bruttoJahr > 0
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 2,
        }).format(delta / (52 * 40))
      : "-";

  return {
    titel: T("Vergleich &amp; Interpretation", "Comparison &amp; interpretation"),
    defaultOffen: true,
    html: T(
      `
      <p>
        Die Differenz zwischen beiden Szenarien; das, was Arbeit an zusätzlichem
        verfügbaren Einkommen bringt; beträgt
        <strong>${arbeitLohnt ? "+" : ""}${fmt(delta)} / Jahr</strong>
        (${arbeitLohnt ? "+" : ""}${fmt(delta / 12)} / Monat).
      </p>
      <p>
        ${
          arbeitLohnt
            ? `Unter den aktuellen Annahmen liegt Arbeit finanziell vorn. Rechnerisch bringt
           jede Arbeitsstunde gegenüber dem Bürgergeld-Pfad einen <em>effektiven Mehrertrag</em> von rund
             <strong>${effektivStundenlohn}</strong> (bei 40 h/Woche, 52 Wochen). Das ist
           <u>nicht</u> der Netto-Stundenlohn, sondern die Differenz zwischen den beiden modellierten Pfaden.`
            : `Unter den aktuellen Annahmen liegt der Bürgergeld-Pfad finanziell vorn.
           Typische Treiber sind hohe KdU-Übernahme (große Haushalte, teure Städte) und
             moderaten Arbeitseinkommen mit voller SV-Last.`
        }
      </p>
      <p>
        <strong>Derzeit mit 0 € angesetzt:</strong> Wohngeld und Kinderzuschlag,
        die für arbeitende Haushalte mit Kindern greifen können und Bürgergeld-Bezug
        ausschließen. Diese sind derzeit Platzhalter (siehe Annahmen).
      </p>
    `,
      `
      <p>
        The difference between both scenarios; the additional disposable income
        work provides; is
        <strong>${arbeitLohnt ? "+" : ""}${fmt(delta)} / year</strong>
        (${arbeitLohnt ? "+" : ""}${fmt(delta / 12)} / month).
      </p>
      <p>
        ${
          arbeitLohnt
            ? `Under the current assumptions work is financially ahead. In terms of maths,
           each working hour yields an <em>effective extra return</em> vs. the Bürgergeld path of about
             <strong>${effektivStundenlohn}</strong> (at 40 h/week, 52 weeks). That is
           <u>not</u> the net hourly wage but the difference between the two modelled paths.`
            : `Under the current assumptions the Bürgergeld path is financially ahead.
           Typical drivers are high housing coverage (large households, expensive cities) and
             modest work income with a full social-security burden.`
        }
      </p>
      <p>
        <strong>Currently set to 0 €:</strong> housing benefit and child supplement,
        which can apply to working households with children and exclude Bürgergeld.
        These are placeholders for now (see assumptions).
      </p>
    `,
    ),
  };
}

function abschnittAnnahmen(): Abschnitt {
  return {
    titel: T(
      "Vereinfachungen &amp; was NICHT gerechnet wird",
      "Simplifications &amp; what is NOT calculated",
    ),
    defaultOffen: false,
    html: T(
      `
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
          <strong>Lernförderung § 28 Abs. 5</strong>; nur nach Bedarf, nicht pauschalisierbar.
        </li>
        <li>
          <strong>Kirchensteuer</strong> (8-9 % der ESt) wird nicht gerechnet.
        </li>
        <li>
          <strong>Werbungskosten</strong> über den Arbeitnehmer-Pauschbetrag
          (1.230 €/Jahr, § 9a EStG) hinaus werden nicht abgezogen.
        </li>
        <li>
          <strong>Freibeträge auf Erwerbseinkommen</strong> (§ 11b SGB II); der Rechner
          vergleicht reine Fälle „100 % Arbeit" vs. „100 % Bürgergeld", keine Aufstockung.
        </li>
        <li>
          <strong>Wohnlage-Klassen A/B/C/D</strong>: Eigene Repräsentativklassen des
          Rechners auf Basis der BBSR-Raumtypen, keine exakten Kommunen. Die exakten
          Modellwerte und exemplarischen Primärquellen sind im öffentlichen Quellenanhang
          ausgewiesen. Innerhalb einer Klasse bestehen reale Spreizungen. Beide Seiten
          (KdU-Obergrenze §22 SGB II und Marktmieten-Vorschlag) skalieren gleichzeitig;
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
      `
      <p><strong>Modelled:</strong></p>
      <ul>
        <li>Income-tax basic tariff &amp; splitting 2026 (§ 32a EStG), solidarity exemption (§ 3 SolZG),
          more-favourable test child benefit ↔ child allowance (§§ 31, 32 EStG); for parents not
          jointly assessed, the default is half the allowance unless a transfer is modelled.</li>
        <li>Employee social contributions: equal split employee/employer for public health (14.6 % + avg. additional),
          care (3.6 % + child reductions / childless surcharge only employee), pension (18.6 %), unemployment (2.6 %);
          2026 ceilings for health/care and pension/unemployment separately.</li>
        <li>Standard needs §§ 20, 23 SGB II (zero round 2026).</li>
        <li>Additional needs § 21 SGB II: single parent (§ 21(3)), decentralised hot water
          (§ 21(7)), pregnancy from 13th week (§ 21(2)).</li>
        <li>Education &amp; participation § 28 SGB II: school supplies, participation,
          lunch, class trips/excursions (flat estimate).</li>
        <li>Housing costs § 22 SGB II with tier-dependent reasonableness limit; representative values and sources are listed in the public appendix.</li>
        <li>Broadcasting-fee exemption (§ 4 RBStV), local welfare-pass/welfare-ticket transit discount.</li>
        <li>Child-benefit offset § 11 SGB II.</li>
      </ul>
      <p><strong>NOT modelled:</strong></p>
      <ul>
        <li>
          <strong>Housing benefit (§ 19 WoGG)</strong> and <strong>child supplement (§ 6a BKGG)</strong>
          are placeholders at zero. For working families with children they can significantly increase
          disposable income.
        </li>
        <li>
          Further <strong>additional needs § 21</strong>: disability (§ 21(4)), medically required diet
          (§ 21(5)), decentralised hot-water generation combined with further special cases.
        </li>
        <li>
          <strong>One-off needs § 24 SGB II</strong> (initial home equipment, clothing for
          pregnancy/birth, orthopaedic shoes etc.).
        </li>
        <li>
          <strong>Tutoring § 28(5)</strong>; only on demand, not a flat rate.
        </li>
        <li>
          <strong>Church tax</strong> (8-9 % of income tax) is not computed.
        </li>
        <li>
          <strong>Work-related expenses</strong> beyond the employee flat rate
          (1,230 €/year, § 9a EStG) are not deducted.
        </li>
        <li>
          <strong>Earned-income allowances</strong> (§ 11b SGB II); the calculator
          compares pure cases "100 % work" vs. "100 % Bürgergeld", no top-up.
        </li>
        <li>
          <strong>Residential tiers A/B/C/D</strong>: the calculator's own representative
          classes based on BBSR spatial types, not exact municipalities. Exact model values and
          example primary sources are listed in the public source appendix. Within a class real
          spreads remain. Both sides (housing ceiling § 22 SGB II and market-rent default) scale
          simultaneously; so the comparison stays methodically neutral. If you know your actual
          rent, override it.
        </li>
        <li>
          <strong>Long-term care</strong>: for child reductions we assume all children are under
          25 (realistic for the families modelled here). Assumed age of the insured: 35 years
          (for the childless surcharge).
        </li>
      </ul>
    `,
    ),
  };
}

function labelHaushaltsTyp(t: Szenario["haushalt"]["typ"]): string {
  switch (t) {
    case "single":
      return T("Single", "Single");
    case "alleinerziehend":
      return T("Alleinerziehend", "Single parent");
    case "paar":
      return T("Paar (unverheiratet)", "Couple (unmarried)");
    case "paar_verheiratet":
      return T("Paar (verheiratet, Splitting)", "Couple (married, splitting)");
  }
}

function pvSatzText(kinderU25: number): { text: string; paragraf: string } {
  if (kinderU25 === 0) {
    return {
      text: T(
        `2,40 % (1,80 % + 0,60 % Zuschlag für Kinderlose ab 23 J.)`,
        `2.40 % (1.80 % + 0.60 % surcharge for childless from age 23)`,
      ),
      paragraf: "§ 55 Abs. 3 SGB XI",
    };
  }
  if (kinderU25 === 1) {
    return { text: T("1,80 %", "1.80 %"), paragraf: "§ 55 Abs. 1 SGB XI" };
  }
  const abschlag = Math.min(kinderU25, 5) - 1;
  const satzValue = (0.018 - abschlag * 0.0025) * 100;
  const satzStr = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(satzValue);
  return {
    text: T(
      `${satzStr} % (${kinderU25} Kinder < 25, Abschlag 0,25 % je Kind ab dem 2.)`,
      `${satzStr} % (${kinderU25} children < 25, 0.25 % reduction per child from the 2nd)`,
    ),
    paragraf: "§ 55 Abs. 3a SGB XI",
  };
}

function estZone(zvE: number): { nummer: number; beschreibung: string; formel: string } {
  const t = EST_TARIF_2026;
  if (zvE <= t.grundfreibetrag) {
    return {
      nummer: 1,
      beschreibung: T(
        `zvE ≤ ${fmt(t.grundfreibetrag)} (Grundfreibetrag)`,
        `taxable ≤ ${fmt(t.grundfreibetrag)} (basic allowance)`,
      ),
      formel: T("Steuerfrei: ESt = 0.", "Tax-free: income tax = 0."),
    };
  }
  if (zvE <= t.zone2Ende) {
    return {
      nummer: 2,
      beschreibung: T(
        `${fmt(t.grundfreibetrag)} < zvE ≤ ${fmt(t.zone2Ende)} (Eingangsbereich)`,
        `${fmt(t.grundfreibetrag)} < taxable ≤ ${fmt(t.zone2Ende)} (entry zone)`,
      ),
      formel: T(
        "ESt = (914,51·y + 1.400)·y, mit y = (zvE − 12.348) / 10.000.",
        "Tax = (914.51·y + 1,400)·y, with y = (taxable − 12,348) / 10,000.",
      ),
    };
  }
  if (zvE <= t.zone3Ende) {
    return {
      nummer: 3,
      beschreibung: T(
        `${fmt(t.zone2Ende)} < zvE ≤ ${fmt(t.zone3Ende)} (Progressionszone)`,
        `${fmt(t.zone2Ende)} < taxable ≤ ${fmt(t.zone3Ende)} (progression zone)`,
      ),
      formel: T(
        "ESt = (173,10·z + 2.397)·z + 1.034,87, mit z = (zvE − 17.799) / 10.000.",
        "Tax = (173.10·z + 2,397)·z + 1,034.87, with z = (taxable − 17,799) / 10,000.",
      ),
    };
  }
  if (zvE <= t.zone4Ende) {
    return {
      nummer: 4,
      beschreibung: T(
        `${fmt(t.zone3Ende)} < zvE ≤ ${fmt(t.zone4Ende)} (Spitzensteuersatz 42 %)`,
        `${fmt(t.zone3Ende)} < taxable ≤ ${fmt(t.zone4Ende)} (top rate 42 %)`,
      ),
      formel: T("ESt = 0,42·zvE − 11.135,63.", "Tax = 0.42·taxable − 11,135.63."),
    };
  }
  return {
    nummer: 5,
    beschreibung: T(
      `zvE > ${fmt(t.zone4Ende)} (Reichensteuer 45 %)`,
      `taxable > ${fmt(t.zone4Ende)} (high-income rate 45 %)`,
    ),
    formel: T("ESt = 0,45·zvE − 19.470,38.", "Tax = 0.45·taxable − 19,470.38."),
  };
}

function fmt(v: number): string {
  return fmtEur(v, 0);
}

function pct(v: number): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

void WOHNLAGEN_2026;
