import type { Abschnitt } from "../core/explain";

export function renderExplanation(container: HTMLElement, abschnitte: Abschnitt[]): void {
  container.innerHTML = `
    <section class="explanation">
      <h2>So wird gerechnet</h2>
      <p class="explanation-intro">
        Alle Werte dynamisch aus deinen Eingaben. Paragraphen-Referenzen verweisen auf die
        jeweiligen Rechtsgrundlagen.
      </p>
      ${abschnitte
        .map(
          (a) => `
            <section class="exp-block">
              <h3>${a.titel}</h3>
              <div class="exp-body">${a.html}</div>
            </section>
          `,
        )
        .join("")}
    </section>
  `;
}
