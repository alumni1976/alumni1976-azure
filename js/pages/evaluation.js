import { getText } from "../services/textService.js";

export async function render() {
  return getText("evaluation.renderHtml", `
    <section class="evaluation-page evaluation-hub">
      <p class="section-tag">Αξιολόγηση</p>
      <h2>Αξιολόγηση</h2>

      <p>
        Η γνώμη σας μας βοηθά να βελτιωνόμαστε. Επιλέξτε τι θα θέλατε να αξιολογήσετε.
      </p>

      <div class="evaluation-hub-cards">
        <a href="#/website-evaluation" class="evaluation-hub-card">
          <span class="evaluation-hub-card-icon" aria-hidden="true">🌐</span>
          <h3>Αξιολόγηση Ιστοσελίδας</h3>
          <p>Πείτε μας τι σκέφτεστε για την ιστοσελίδα — πλοήγηση, σχεδιασμό, ταχύτητα.</p>
        </a>

        <a href="#/reunion-evaluation" class="evaluation-hub-card">
          <span class="evaluation-hub-card-icon" aria-hidden="true">🎉</span>
          <h3>Αξιολόγηση Reunion50</h3>
          <p>Πείτε μας πώς σας φάνηκε η εκδήλωση του Reunion50 — οργάνωση, πρόγραμμα, χώρος.</p>
        </a>
      </div>
    </section>
  `);
}

export async function afterRender() {}
