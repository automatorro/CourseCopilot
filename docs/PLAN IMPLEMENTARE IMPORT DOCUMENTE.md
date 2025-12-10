Obiectiv & Constrângeri

Flux binar la început: “din materialele tale” vs “de la zero”.
Pipeline separat de import, fără injectare directă în editor.
Formate acceptate: DOCX, PPTX, Markdown, HTML, PDF cu text selectabil. Fără scanuri/imagini/OCR.
Implicit “Strict Mode”, non‑distructiv: importul intră în Staging ca draft, cu dif înainte de aplicare.
Arhitectură

Adaptoare fișier: docx-adapter, pptx-adapter, md-adapter, html-adapter, pdf-text-adapter.
Normalizator: transformă în format canonic (Markdown + metadate) și tipuri (ExerciseItem, SlideItem, TextSection).
Segmentator: produce blocuri structurale pe baza heading‑urilor/slide‑urilor/listelor.
Staging Service: gestionează sesiunea de import, previzualizare, mapare pe sloturi, dif granular.
Merge Engine: moduri Append, Replace (scoped), Merge inteligent.
Refresh Derivatives: recalculări deterministe (ToC, numerotare, durate, rute, acoperire obiective).
Versionare & Rollback: instantanee pe aplicare, revenire oricând; audit log.
Question Bank: depozit sigur pentru item‑uri (întrebări/exerciții) decuplat de structura cursului.
Model Canonic (rezumat)

ExerciseItem: type, prompt, options[], answerKey, solution, hints[], tags[], difficulty, source.
SlideItem: title, content, media[], notesAsHints, tags[], source.
TextSection: heading, body, tags[], source.
ExerciseSet: title, description, items[], scope (modul/lecție), visibility, version.
ImportDraft: id, sourceFiles[], canonicalBlocks[], confidenceScores[], proposedMapping, scope, mode.
QuestionBank: colecție globală de ExerciseItem.
Pipeline de Import

Upload → Detectare tip fișier → Adapter → Normalizare → Segmentare → Evaluare calitate (scor/flag) → Propuneri mapare → Staging Preview → Dif pe blocuri → Aplicare ca draft → Refresh Derivatives → Publicare opțională.
Staging & Mapare

Scope selector: Curs întreg / Modul / Lecție / Exerciții / Question Bank.
Mod de îmbinare: Append / Replace (scoped) / Merge.
Strict vs Guided:
Strict: fără rearanjare AI; doar normalizare + mapare.
Guided: propuneri (grupări, tag‑uri, quiz) cu accept pe blocuri; niciun overwrite implicit.
Previzualizare + Dif: arată impactul pe item‑uri; accept/reject pe secțiuni; rezumat modificări.
Reguli de Mapare pe Formate

DOCX:
H1/H2 → set/grup; liste numerotate → item‑uri open/short; tabele cu opțiuni → MCQ; secțiuni “Soluții” → soluții/hinturi.
PPTX:
Slide “Exercițiu” → item; Notes → soluții/hinturi; bullet “A/B/C/D” → MCQ; imagini → atașamente.
Markdown/HTML/PDF text:
Heading‑uri → seturi; code blocks → exerciții de coding; blockquote → hint.
Moduri de Îmbinare

Append: adaugă la finalul slotului selectat, renumerotează, moștenește tag‑uri.
Replace (scoped): înlocuiește doar slotul (lecție/set/slide deck) menținând IDs de lecție/rute și metadate parent.
Merge inteligent: deduplică pe similitudini (titlu, tag‑uri), combină soluții/hinturi, marchează conflicte pentru rezolvare manuală.
Implicit draft: orice aplicare creează versiune draft; publicarea e separată.
Refresh Derivates (fără regenerare AI)

Lecție: renumerotare secțiuni/slide‑uri, recalcul durată, reindex media, reparare linkuri interne, evaluare acoperire obiective.
Modul: reordonează/renumerotează lecții, agregă tag‑uri, distribuție dificultate.
Curs: ToC, breadcrumb, rute, progres global, matrice obiective vs conținut.
Raport de impact: item‑uri noi/modificate/înlocuite, acoperire obiective scăzută, linkuri reparate.
UX Flow

Start:
Ecran decizie: “din materialele tale” vs “de la zero”.
“De la zero”: păstrează fluxul actual (modal variabile / editor gol).
“Din materialele tale”: deschide Staging.
În curs existent:
Buton “Importă” pe Curs, Modul, Lecție, Exerciții, Question Bank cu scope preselectat.
3 pași: Încarcă → Propuneri & Mapare → Dif & Aplică.
Indicatori de încredere (verde/galben/roșu); avertismente pentru secțiuni ambigue; opțiune “Trimite în Question Bank”.
Post‑aplicare:
Rulează “Refresh derivate”; afișează raport de impact; opțiune “Publică” sau “Păstrează ca draft”.
API & Servicii

POST /import/start: files[], scope, mode → importDraftId.
GET /import/{id}/preview: canonical blocks, propuneri mapare, confidence.
POST /import/{id}/map: binding pe sloturi, mod de îmbinare.
POST /import/{id}/apply: aplică ca draft, creează versiune, jurnalizează.
POST /refresh: scope (lecție/modul/curs) → recalcul derivate + raport.
POST /question-bank/import: depozitare în bancă; mapping ulterior.
GET /diff: dif pe blocuri pentru preview.
Versionare & Rollback

Snapshot la fiecare “apply”; rollback(versionId) disponibil.
IDs stabile pentru lecții/rute; sloturile înlocuite primesc IDs noi locale.
Audit log: cine, ce fișier, când, ce impact.
Securitate & Conformitate

Fără OCR; fără imagini/scanuri.
Detector licențe/PII pe conținut; avertismente la încălcări.
Limită dimensiune fișier; import asincron cu progres pentru volume mari.
Testare & Verificare

Unit pentru adaptoare (parsing determinist).
Integrare pentru normalizare/segmentare/mapare pe seturi complexe.
E2E pentru Staging: upload → preview → dif → apply → refresh → rollback.
Teste de consistență: acoperire obiective, linkuri, rute, numerotare.
Performanță: import fișiere mari, preview paginat, job queue.
MVP

Adaptoare DOCX, PPTX, Markdown, HTML, PDF text.
Normalizare + segmentare; Staging cu Strict Mode.
Moduri Append și Replace (scoped); dif pe blocuri.
Refresh derivate la lecție/modul/curs; versionare + rollback.
Question Bank pentru depozitare sigură.
UI: butoane “Importă” în curs și secțiuni; preview clar.
Extinderi

Merge inteligent avansat (deduplicare semnatică).
Generare quiz/glosar în Guided Mode cu accept pe blocuri.
Politici personalizabile de îmbinare per proiect.
Telemetrie de calitate (scoruri), praguri configurabile.
Notificări, job queue, audit extins.
Riscuri & Mitigări

Conținut mixt/confuz: Staging cu dif, Strict Mode, mapare pe sloturi.
Rupturi de structură: Replace (scoped) și IDs stabile.
Linkuri/ancore: rebuild determinist post‑refresh.
Obiective neacoperite: detector + raport; propuneri fără overwrite.
Volume mari: asincron, preview paginat, limite.
Conformitate: detector PII/licență, avertismente.
Criterii de Acceptare (MVP)

Importă DOCX/PPTX/MD/HTML/PDF text în Staging, vizualizează preview.
Aplică Append/Replace (scoped) non‑distructiv cu dif.
Rulează Refresh derivate și obține raport fără erori.
Versionare și rollback funcționale.
Question Bank populabil din import.
Nicio modificare directă în editor din import; flux “de la zero” neschimbat.
Roadmap Scurt

Săptămâna 1–2: adaptoare + normalizator + segmentator + modele.
Săptămâna 3: Staging UI + preview + dif + Append/Replace.
Săptămâna 4: Refresh derivate + versionare/rollback + Question Bank.
Săptămâna 5: testare E2E, performanță, securitate, telemetry.
Săptămâna 6: Guided Mode opțional, merge inteligent, tuning.
Dacă dorești, pot detalia schema JSON pentru ImportDraft, ExerciseItem și payload‑urile endpoint‑urilor, ca să fie direct implementabile.