import type { Abschnitt } from "../core/explain";
import { T } from "../i18n";

export function renderExplanation(container: HTMLElement, abschnitte: Abschnitt[]): void {
  container.innerHTML = `
    <section class="explanation">
      <h2>${T("So wird gerechnet", "How it's calculated")}</h2>
      <p class="explanation-intro">
        ${T(
          "Alle Werte dynamisch aus deinen Eingaben. Paragraphen-Referenzen verweisen auf die jeweiligen Rechtsgrundlagen.",
          "All values are derived dynamically from the inputs. Section references point to the underlying legal basis.",
        )}
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
