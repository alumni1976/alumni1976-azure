import { getText } from "../services/textService.js";
export async function render() {
  return getText("home.renderHtml", `
    <main class="page home-page">

      <section id="event" class="section recap-section">
        <div class="section-header">
          <div class="section-eyebrow">Reunion 50 Ετών</div>

          <h2 class="section-title">
            50 Χρόνια Μαζί: Μια Συγκινητική Επιστροφή στις Ρίζες μας!
          </h2>

          <p class="section-subtitle">
            Το Σάββατο 20 Ιουνίου 2026, το Πανεπιστήμιο Πατρών στο Ρίο
            πλημμύρισε από αναμνήσεις, χαμόγελα και βαθιά συγκίνηση.
          </p>
        </div>

        <div class="memory-card recap-card">
          <p>
            Μισός αιώνας πέρασε από τότε που η τάξη του 1976 των Ηλεκτρολόγων
            Μηχανικών πέρασε για πρώτη φορά το κατώφλι του ιδρύματος. Το
            περασμένο Σάββατο, ανταμώσαμε ξανά εκεί όπου ξεκίνησαν όλα: στο
            κτίριο της Πρυτανείας, σε ένα ιστορικό Reunion 50 ετών που
            ξεπέρασε κάθε προσδοκία και θα μείνει για πάντα χαραγμένο στην
            καρδιά μας.
          </p>

          <h3>Μια Μεγάλη Αντάμωση από Κάθε Γωνιά της Ελλάδας</h3>

          <p>
            Η συμμετοχή ήταν συγκλονιστική. Συμφοιτητές και φίλοι ταξίδεψαν
            από κάθε γωνιά της Ελλάδας για να βρεθούν ξανά στον γνώριμο χώρο
            του Ρίου. Αποδείξαμε περίτρανα ότι ο χρόνος μπορεί να πέρασε,
            αλλά οι δεσμοί που σφυρηλατήθηκαν στα αμφιθέατρα, στις ατέλειωτες
            ώρες των εργαστηρίων και στις νεανικές μας ανησυχίες παραμένουν
            αναλλοίωτοι.
          </p>

          <p>
            Το συναίσθημα ήταν διάχυτο σε κάθε χειραψία, σε κάθε αγκαλιά και
            σε κάθε ιστορία από τα παλιά που ζωντάνεψε στις συζητήσεις μας.
            Όπως έγραφε και ο Όμηρος στην <em>Οδύσσεια</em>, δεν υπάρχει
            μεγαλύτερη χαρά από το να ανταμώνουν ξανά παλιοί γνώριμοι και
            φίλοι, «ασπάσιοι αναφανδόν» (γεμάτοι λαχτάρα και αγαλλίαση),
            κοιτάζοντας ο ένας τον άλλον στα μάτια.
          </p>

          <blockquote class="quote">
            «ὧν πάντων ἐξ ἑκάστου, ἐξ ἁπάντων τῶν πραγμάτων, ὁ τῆς φιλίας
            συντελεῖται καρπός...»
            <cite>
              — Επίκουρος · Από όλα αυτά, ο μέγιστος καρπός που μας χαρίζει
              η σοφία για την ευτυχία όλης μας της ζωής, είναι η απόκτηση
              της φιλίας.
            </cite>
          </blockquote>

          <p>
            Κοιτάζοντας πίσω, νιώθουμε βαθιά περήφανοι για την πορεία του
            καθενός ξεχωριστά, αλλά και για τη συλλογική σφραγίδα που άφησε
            αυτή η σπουδαία γενιά των Ηλεκτρολόγων του '76.
          </p>

          <h3>Για πάντα «Αιώνιοι Έφηβοι»</h3>

          <p>
            Η συνάντηση αυτή δεν ήταν ένας απλός απολογισμός του παρελθόντος,
            αλλά μια ζωντανή υπόσχεση για το μέλλον. Μπορεί τα χρόνια να
            πέρασαν, όμως η σπίθα στα μάτια όλων παρέμεινε η ίδια.
          </p>

          <p>
            Κλείνουμε αυτή την ιστορική αναδρομή με μια βαθιά ευχή για όλους
            μας, δανειζόμενοι τα λόγια του σπουδαίου Αντώνη Σαμαράκη:
          </p>

          <blockquote class="quote">
            «Η εφηβεία δεν είναι βιολογική ηλικία, αλλά κατάσταση πνευματική
            και τρόπος ζωής.»
          </blockquote>

          <p>
            Είθε, λοιπόν, να παραμείνουμε για πάντα <strong>αιώνιοι
            έφηβοι</strong>! Να κρατάμε το πνεύμα μας ανήσυχο, τη
            δημιουργικότητά μας ζωντανή και την καρδιά μας ανοιχτή, όπως
            τότε που πρωτοπεράσαμε τις πύλες του Πανεπιστημίου.
          </p>

           <p hidden>
             Σύντομα θα αναρτηθεί πλούσιο φωτογραφικό υλικό από τη χθεσινή
             μας συνάντηση στο Gallery της ιστοσελίδας μας.
           </p>

          <p class="recap-thanks">
            Σας ευχαριστούμε όλους από καρδιάς για τη μοναδική σας παρουσία.
            Εις το επανιδείν!
          </p>
        </div>
      </section>

      <div class="ornament-divider"><span>✦</span></div>

      <section class="hero chronicle-hero">
        <div class="hero-grid-overlay"></div>
        <div class="hero-year-bg">1976</div>

        <div class="hero-content">
          <div class="hero-eyebrow">Πενήντα χρόνια κοινής πορείας</div>

          <h1 class="hero-title">
            Η <em>Ιστορία</em> μας
          </h1>

          <p class="hero-desc">
            Ψηφιακός τόπος μνήμης και επικοινωνίας για τους αποφοίτους
            της Σχολής Ηλεκτρολόγων Μηχανικών του Πανεπιστημίου Πατρών,
            τάξη του 1976.
          </p>

          <div class="hero-wisdom">
            <p>⚡ Η θεωρία δείχνει τον δρόμο. Η πράξη τον επιβεβαιώνει.</p>
            <p>🎓 Η γνώση αποκτά αξία όταν μοιράζεται.</p>
            <p>🤝 Η κοινή διαδρομή γίνεται κοινή μνήμη.</p>
          </div>

          <div class="hero-actions">
            <a class="btn btn-primary" href="#/community">Κατάλογος Μελών</a>
            <a class="btn btn-outline" href="#/thinktank">Δεξαμενή Σκέψεων</a>
          </div>
        </div>
      </section>

      <div class="ornament-divider"><span>✦</span></div>

      <div class="stats-strip">
        <div class="stat-item">
          <span class="stat-number">50</span>
          <span class="stat-label">Χρόνια από την αποφοίτηση</span>
        </div>

        <div class="stat-item">
          <span class="stat-number">1976</span>
          <span class="stat-label">Έτος αποφοίτησης</span>
        </div>

        <div class="stat-item">
          <span class="stat-number">2026</span>
          <span class="stat-label">Έτος επετείου</span>
        </div>

        <div class="stat-item">
          <span class="stat-number">∞</span>
          <span class="stat-label">Αναμνήσεις και δεσμοί</span>
        </div>
      </div>

      <div class="ornament-divider"><span>✦</span></div>

      <section class="section feature-section">
        <div class="section-header">
          <div class="section-eyebrow">Τι φιλοξενεί ο χώρος μας</div>

          <h2 class="section-title">
            Επιστροφή στις μνήμες. Επαφή με τους φίλους. Γιορτή της διαδρομής.
          </h2>

          <p class="section-subtitle">
            Ένας λιτός και ζωντανός χώρος για πρόσωπα, φωτογραφίες,
            εκδηλώσεις και σκέψεις από μισό αιώνα κοινής πορείας.
          </p>
        </div>

        <div class="card-grid">
          <a class="card" href="javascript:void(0)" onclick="document.getElementById('event').scrollIntoView({behavior:'smooth'})">
            <div class="card-icon">🎓</div>
            <div class="card-title">Επετειακή Συνάντηση</div>
            <div class="card-text">
              Η μεγάλη συνάντηση των αποφοίτων του 1976, πενήντα χρόνια μετά. Δείτε πώς πήγε.
            </div>
          </a>

          <a class="card" href="#/community">
            <div class="card-icon">🤝</div>
            <div class="card-title">Κατάλογος Αποφοίτων</div>
            <div class="card-text">
              Πρόσωπα, στοιχεία επικοινωνίας, βιογραφικά και σύνδεσμοι των μελών.
            </div>
          </a>

          <a class="card" href="#/thinktank">
            <div class="card-icon">💡</div>
            <div class="card-title">Δεξαμενή Σκέψεων</div>
            <div class="card-text">
              Αναμνήσεις, ιδέες, προβληματισμοί και εμπειρίες των αποφοίτων.
            </div>
          </a>
        </div>
      </section>

      <div class="ornament-divider"><span>✦</span></div>

      <section id="heritage" class="section heritage-section">
        <div class="heritage-layout">
          <div>
            <div class="section-eyebrow">Η Κληρονομιά μας</div>

            <h2 class="section-title">
              Μηχανικοί που άφησαν το αποτύπωμά τους
            </h2>

            <p>
              Τα πενήντα χρόνια από την αποφοίτησή μας είναι μια διαδρομή
              προσφοράς, δημιουργίας και επιτυχιών. Με περηφάνια κοιτάμε
              το παρελθόν, τιμώντας τις αξίες και το ήθος που μας καθόρισαν
              ως μηχανικούς και ανθρώπους.
            </p>

            <blockquote>
              «Οἵτινες ποτ᾽ ἔστε χαίρετε! Εἰρηνικῶς πρός φίλους φίλοι ἐληλύθαμεν.»
              <cite>— Ηχογράφηση, Ανδρέας Καζαντζίδης, Cornell University</cite>
            </blockquote>
          </div>

          <div class="heritage-photo">
            <img
              src="https://drive.google.com/thumbnail?id=1Kskj_9y0lNF94FT3XZgS-D9RyQk81XjN&sz=w2000"
              alt="Alumni 1976"
            >
          </div>
        </div>
      </section>

      <section id="memory" class="section memory-section">
        <div class="memory-card">
          <div class="section-eyebrow">Μνήμη</div>

          <h2>Αφιερωμένο στη μνήμη του</h2>

          <p>
            Με αφορμή τη συμπλήρωση ενός χρόνου από τον θάνατο του αγαπημένου
            μας συμφοιτητή, αφιερώνουμε λίγες σκέψεις μνήμης. Δεν ήταν απλώς
            ένας συμφοιτητής — ήταν φίλος και συνοδοιπόρος στα χρόνια των σπουδών.
          </p>

          <div class="person">Δημήτρης Κολέτσος</div>
          <div class="dates">1953 – 2025</div>
          <span class="rip">✦ Αιωνία του η μνήμη</span>
        </div>
      </section>

    </main>
  `);
}
