# Curățenie și modernizare CourseCopilot
## Plan de implementare complet — pentru Claude Code
**Versiune:** 2.0 (finală, compilată) · **Data:** 18 iulie 2026
**Înlocuiește:** PLAN-IMPLEMENTARE-CourseCopilot.md v1.0 · **Se bazează pe:** AUDIT-CourseCopilot-2026-07-18.md

---

# PARTEA I — CADRUL

## 1. Protocol de lucru pentru Claude Code (obligatoriu)

1. **Sursa de adevăr a progresului:** `IMPLEMENTATION_STATUS.md` în rădăcina repo-ului (creat în F0). Fiecare task are ID (`F1-T3`). Status: `TODO / IN_PROGRESS / DONE / BLOCKED(motiv)`. `DONE` doar cu Definition of Done (DoD) trecut.
2. **O fază per branch** (`phase-0-safety` … `phase-9-cleanup`). Merge în `main` doar cu DoD complet. Faza N+1 nu începe fără faza N `DONE`. Excepție: F8 (plafon 8h + landing) poate rula oricând după F0.
3. **Poartă de calitate per commit:** `npm run typecheck` verde. Per fază: `npm run typecheck && npm run test` + smoke-ul manual din DoD.
4. **Zero funcționalități în afara planului.** Descoperirile se notează în `IMPLEMENTATION_STATUS.md § Descoperiri`, cu propunere; decide owner-ul.
5. **Ștergerile sunt definitive** (există git), nu cod comentat.
6. **Prompturile sunt artefacte versionate separat de cod** (vezi Cap. 4). Un PR care schimbă prompturi nu schimbă și logică, și invers — altfel calibrarea (F6) devine imposibil de diagnosticat.
7. **Edge functions:** test local cu `supabase functions serve` înainte de orice deploy.
8. **Porți umane (owner):** aprobat contract-etalon (final F4-parțial, vezi F4-T7), aprobat prag rubrică (final F6). Sunt singurele două opriri care cer omul; sunt blocante.

## 2. Borne (se copiază în IMPLEMENTATION_STATUS.md)

| Bornă | Faza | Livrabil verificabil | Status |
|---|---|---|---|
| M0 | F0 | Tag + status file + baseline „before" + fixture etalon | TODO |
| M1 | F1 | Cod mort șters (butoane editor, ProtagonistEnforcer, fixes/); build verde | TODO |
| M2 | F2 | Test puritate lingvistică verde (EN fără RO, RO fără EN) | TODO |
| M3 | F3 | Arhitectura de prompturi instalată: prompts/ + changelog + preambul de ton | TODO |
| M4 | F4 | Contracte de modul valide pe etalon; aprobate de owner | TODO |
| M5 | F5 | Cele 5 livrabile randate din contract, validare deterministă verde | TODO |
| M6 | F6 | **Rubrica ≥ prag pe cursul-etalon (RO+EN)** — poarta de calitate | TODO |
| M7 | F7 | Slides: layout stabil generare→editor→export, zero AI la export | TODO |
| M8 | F8 | Plafon 8h în UI+server; landing actualizat | TODO |
| M9 | F9 | Design system pe toate exporturile (DOCX/PDF/PPTX) | TODO |
| M10 | F10 | Legacy șters; index.ts spart în module; e2e verde | TODO |

## 3. Cursul-etalon (fixture pentru toate fazele)

- **Titlu:** „Managementul Stakeholderilor pentru Manageri de Proiect Juniori"
- **Durată:** 4h · **Mediu:** ONLINE · **Limbi:** ro + clonă en
- **Audiență:** manageri de proiect la început de drum, companii de servicii IT
- **Ton (text liber al utilizatorului):** „direct, cald, fără corporatisme; folosim «tu»; umor discret; interzis: «sinergie», «paradigmă»"

Motiv: reproduce exact contextul materialului defect din audit (Alex×3, limbi amestecate), deci orice regresie e vizibilă imediat. Clona EN verifică puritatea lingvistică inversă.

## 4. Rezumatul auditului (ce reparăm — referință rapidă)

Detalii complete cu fișier:linie în AUDIT-CourseCopilot-2026-07-18.md.

1. **Trei arhitecturi de generare suprapuse** (17 pași legacy frontend · Golden Path per modul · granular pe lecții) → inconsistență structurală și 45–90 apeluri LLM/curs, cu dublura FacilitatorNotes/FacilitatorManual (2× manualul complet).
2. **ProtagonistEnforcer** înlocuiește orb nume românești cu protagonistul (implicit „Alex") printr-un regex `\b` fără Unicode → trei personaje „Alex" în același exercițiu și cuvinte sparte („pozițAlexând").
3. **Limbi amestecate:** headere RO hardcodate în șabloanele de prompt (`### Instrucțiuni Participant`…), RO hardcodat în slide-urile cost-zero chiar și pe cursuri EN, validarea de limbă dezactivată (`skipAiValidation=true`) exact pe livrabilele mari, detector pentru doar 5 limbi.
4. **„ADN"-ul nu se aplică:** exercițiile nu primesc deloc `voiceProfile`; slide-urile pe calea principală nu trec prin AI; tonul utilizatorului e strivit în 3 arhetipuri predefinite (contra promisiunii „Yours, verbatim").
5. **Butoanele Generate/Rafinează din editor sunt cod mort:** serverul nu are handler pentru `action: generate/refine`, `refinePayload` nu e citit nicăieri.
6. **Slide-uri „pe lângă subiect":** layout decis de 3 sisteme necorelate (euristici la parsare / re-analiză AI la fiecare export care contrazice editorul / fallback prin **rotație de contor global** = aleator), două taxonomii concurente de layout, conținut-sursă de 1 bullet/slide.
7. **Landing vs realitate:** 5 artefacte promise / 17 generate difuz; „orice limbă" neacoperit; „no shallow slides" contrazis de cost-zero; „Trainer Flow" inexistent ca artefact.
8. **Igienă:** erori mascate cu status 200, credit gate fail-open, fallback pe model cu context 8k, cheie Stripe în cod, ~70 documente de plan contradictorii în docs/.

## 5. Principii de arhitectură (deciziile luate în discuție — nenegociabile în implementare)

- **P1 — Descompunere, nu cereri de volum.** Lungimea și profunzimea se obțin structural: un apel LLM = o unitate pedagogică completă (un modul de teorie, UN exercițiu, un deck de modul). Volumul total = consecința numărului de blocuri; numărul de blocuri = consecința duratei. Zero cote de pagini.
- **P2 — Contractul de modul e sursa unică de adevăr.** Obiectiv cu verb Bloom explicit + blocuri tipizate pe fazele Merrill (Activare / Demonstrație / Aplicare / Integrare) + specificații de exercițiu. Cele 5 livrabile sunt *randări* ale aceluiași contract, nu generări independente.
- **P3 — Consistența prin cod, nu prin AI.** Titluri, durate, ID-uri, headere structurale se inserează programatic; LLM-ul scrie doar corpul. Etichetele vin din `localizedLabels`.
- **P4 — Personaje locale, nu protagoniști globali.** Contractul definește *roluri*; LLM-ul dă nume distincte, realiste, în interiorul fiecărui exercițiu. Zero post-procesare pe nume.
- **P5 — Tonul utilizatorului verbatim.** Textul lui liber, citat în preambul, injectat identic în fiecare apel de conținut. Fără arhetipuri.
- **P6 — Validare deterministă, retry chirurgical.** Verificări în cod (structură, timing, verbe Bloom, puritate lingvistică); la eșec, UN re-apel doar pe unitatea eșuată. Fără bucle de „ceartă" cu modelul.
- **P7 — WYSIWYG la slide-uri.** Layout + conținut decise o dată, la generare, din tipul pedagogic al blocului; editorul vizual = singurul loc de modificare; exportul randează exact starea editorului, zero AI la export.
- **P8 — Maximum 8 ore per curs.** Programe mai lungi = mai multe cursuri de câte o zi.

---

# PARTEA II — CELE DOUĂ CAPITOLE CAPITALE

## Cap. A — Arhitectura de prompturi (implementată în F3, folosită în F4–F7, calibrată în F6)

### A.1 Anatomia standard a oricărui apel de conținut

Fiecare prompt din sistem se asamblează din 7 straturi, în această ordine, printr-un singur builder (`buildPrompt(layers)`) — niciodată concatenări ad-hoc:

```
[1. ROLE FRAME]      cine e modelul și standardul de calitate (fix per tip de apel)
[2. TONE PREAMBLE]   vocea utilizatorului verbatim + terminologie + mediu (identic peste tot)
[3. COURSE CONTEXT]  titlu, audiență, limbă-țintă, obiectivele cursului (compact, <150 cuvinte)
[4. UNIT CONTEXT]    contractul modulului / spec-ul exercițiului / slide plan-ul (JSON-ul relevant)
[5. TASK SPEC]       ce anume produce acest apel, cu criteriile pedagogice
[6. FORMAT SPEC]     structura de output cu placeholders {{label_*}} din localizedLabels
[7. QUALITY RULES]   interdicții și cerințe de concretețe (scurte, max ~10)
```

Reguli de asamblare:
- Straturile 1, 5, 6, 7 sunt fixe per tip de apel și trăiesc în `prompts/<tip>.ts`. Straturile 2, 3, 4 se construiesc din date la runtime.
- Meta-instrucțiunile sunt în engleză (practica corectă — modelele urmează fidel instrucțiuni EN cu output în altă limbă); **orice conținut și orice etichetă vizibilă utilizatorului** vine din date/`localizedLabels`, netradus, neparafrazat.
- Nicio propoziție în limbă naturală hardcodată în FORMAT SPEC — doar placeholders.

### A.2 Ce stă în prompt vs ce stă în cod (granița strictă)

| În COD (determinist) | În PROMPT (judecată) |
|---|---|
| Headere, etichete, numerotare, ID-uri | Proza: teorie, scripturi, scenarii, debrief |
| Durate, sume de minute, agenda cronologică | Exemplele lucrate, analogiile, umorul |
| Compoziția fazelor Merrill, ponderea aplicării | Numele și vocile personajelor din exerciții |
| Alegerea layout-ului de slide (din tipul blocului) | Copy-ul slide-ului și speaker notes |
| Validare: structură, verbe Bloom, puritate lingvistică | Adaptarea la audiență și ton |

Dacă un lucru poate fi verificat cu un regex sau o sumă, nu i se cere modelului „să aibă grijă" — se verifică în cod.

### A.3 Preambulul de ton (`buildTonePreamble`, înlocuiește DNA-ul)

```
## VOICE (verbatim from the course author — emulate faithfully)
"{{userToneText}}"
Write every sentence as if this author wrote it. Their phrasing habits, warmth level,
and humor apply to ALL prose, including exercise instructions and speaker notes.

## TERMINOLOGY (mandatory)
Use exactly: participant="{{termParticipant}}", trainer="{{termTrainer}}", exercise="{{termExercise}}".
{{#mandatoryTerms}} Required terms: {{list}}. {{/}}
{{#forbiddenPhrases}} NEVER use: {{list}}. {{/}}

## DELIVERY ENVIRONMENT
{{envConstraints}}   // blocul LIVE/ONLINE existent, păstrat ca atare (singura parte sănătoasă a DNA-ului)

## LANGUAGE
Every word of output in {{language}}. Technical loanwords standard in this language are allowed;
full sentences in any other language are not.
```

### A.4 Scheletele celor 7 prompturi ale sistemului

Acestea sunt scheletele de pornire (v1) — se instalează în F3 și se rafinează EXCLUSIV în F6 (calibrare). Fiecare trăiește în `prompts/`:

**A.4.1 `localized-labels.ts`** (1 apel per curs, la creare)
```
[ROLE] You are a professional translator specializing in corporate training materials.
[TASK] Translate this dictionary of structural labels into {{language}}, using the register
       a professional trainer in that culture would use. Return ONLY valid JSON, same keys.
[INPUT] { "objective": "Objective", "participant_instructions": "Participant Instructions",
  "workspace": "Workspace", "facilitator_instructions": "Facilitator Instructions",
  "debrief_questions": "Debrief Questions", "stage": "Stage", "duration": "Duration",
  "materials": "Materials", "summary": "Summary", "reflection": "Reflection",
  "welcome": "Welcome", "break": "Break", "success_indicators": "Success Indicators",
  "adaptation": "Adaptation", "timing": "Timing", "notes_for_trainer": "Notes for the Trainer", ... }
  // inventarul complet se face în F2-T2 din stringurile găsite
```

**A.4.2 `module-contract.ts`** (1 apel per modul — apelul cu cel mai mare levier din sistem)
```
[ROLE] You are a senior instructional designer. You design modules using Bloom's taxonomy
       and Merrill's First Principles of Instruction. Your contracts are executed literally
       by downstream writers, so every field must be specific and self-sufficient.
[TONE PREAMBLE] …
[COURSE CONTEXT] …
[UNIT CONTEXT] Module title: {{title}} · Duration: {{minutes}} min · Position: {{n}}/{{total}}
       Previous module: {{prev}} · Next module: {{next}}
[TASK]
  Produce the ModuleContract JSON (schema below).
  1. objective.statement: one sentence, observable behavior, with an explicit Bloom verb
     matching bloomLevel. Not "understand X" — what will they DO?
  2. blocks: decompose {{minutes}} min into 15–25 min blocks. Every module needs at least
     one ACTIVATION (connect to their experience), one DEMONSTRATION (worked example —
     show, don't lecture), one APPLICATION (they perform, with feedback). If bloomLevel
     is APPLY or higher, APPLICATION blocks must total ≥40% of module time.
  3. keyPoints: 2–5 per block; each a complete, concrete idea (a claim, not a topic label).
     "Stakeholders with high power and low interest need summary-level updates" — not "stakeholder types".
  4. exerciseSpec (every APPLICATION block): scenarioSeed anchored in the audience's real
     work context, with a built-in tension or dilemma; characters as ROLES only (e.g.
     "a skeptical department head") — names are assigned later, locally; evidenceOfLearning:
     what a successful participant visibly does; debriefBloomVerb at or above bloomLevel.
[FORMAT] Return ONLY valid JSON matching: {{schemaJson}}
[QUALITY] No placeholders ("X%", "TBD"). Invent plausible specifics. All strings in {{language}}.
```

**A.4.3 `participant-manual.ts`** (1 apel per modul; split în 2 la >6 blocuri)
```
[ROLE] You write participant manuals that a learner reads BEFORE, DURING and AFTER the
       session. Dense, warm, worked-example-driven. A manual chapter, not slide notes.
[UNIT CONTEXT] full ModuleContract JSON
[TASK] For each non-APPLICATION, non-BREAK block, write the participant-facing section:
  - Theory as continuous prose (no bullet walls): the key ideas from keyPoints, developed,
    each anchored with ONE worked example from the audience's world.
  - One reflection prompt per block, referencing THEIR job, with visible answer space markers.
  - For APPLICATION blocks: a 2–3 sentence bridge ("what you will practice and why") — the
    full exercise lives on its own sheet; do not duplicate it.
[FORMAT] For each block, exactly:
  ### {{BLOCK_HEADER_TOKEN block.id}}     // înlocuit programatic cu titlu+durata din contract
  [prose] … [reflection under {{label_reflection}}]
[QUALITY] Minimum ~350 words of substance per 15 minutes of block time. No meta-commentary,
  no "in this section we will". Never restate the contract JSON.
```

**A.4.4 `exercise-sheet.ts`** (1 apel per exerciseSpec — capacitate maximă pe materialul cu impact maxim)
```
[ROLE] You design experiential learning activities. Your exercise sheets are standalone
       handouts a participant can use without any other material.
[UNIT CONTEXT] the exerciseSpec JSON + parent block + module objective
[TASK]
  1. Expand scenarioSeed into a complete scenario: name the characters (distinct, realistic
     names for {{language}} culture; they exist ONLY in this exercise), give each a concrete
     stake and a tension. The scenario must make the dilemma unavoidable.
  2. Participant instructions: numbered, imperative, unambiguous.
  3. A REAL workspace: actual Markdown tables / matrices / line-spaces sized for handwriting —
     never "(write your answer here)".
  4. Facilitator section: setup/execution/debrief timing table summing to {{durationMinutes}};
     observer checklist (3–5 behaviors); debrief questions escalating from factual to
     "{{debriefBloomVerb}}"-level; success indicators tied to evidenceOfLearning; adaptation
     for resistant / fast groups.
[FORMAT] headers exclusively via {{label_*}} placeholders (structura din EXERCISES_PROMPT
  actual e bună pedagogic — se păstrează, dar sterilizată lingvistic)
[QUALITY] Scenario specific enough that swapping the industry would break it. Environment
  rules apply ({{envConstraints}}): ONLINE ⇒ breakout/chat/board mechanics; LIVE ⇒ physical only.
```

**A.4.5 `trainer-guide.ts`** (1 apel per modul)
```
[ROLE] You write facilitation guides for trainers delivering someone else's design:
       verbatim-ready scripts, timing discipline, room-reading cues.
[UNIT CONTEXT] full ModuleContract + the exercise sheet IDs already generated
[TASK] For each block: absolute clock time (from {{startTime}}), what the trainer SAYS
  (2–4 verbatim script sentences in the author's voice), what they ASK (one strong open
  question), what they WATCH FOR, transition sentence to the next block (use contract
  transitions). For APPLICATION blocks: run-sheet referencing the exercise by ID and its
  timing table — do not rewrite the exercise.
[FORMAT] time-anchored sections built on {{BLOCK_HEADER_TOKEN}}; labels via {{label_*}}.
[QUALITY] Scripts sound spoken, not written. No stage directions like "engage the audience" —
  only concrete actions.
```

**A.4.6 `slides-copy.ts`** (1 apel per modul; slide plan-ul vine determinist din cod — F7)
```
[ROLE] You write minimalist slide copy and rich speaker notes. Slides support the trainer;
       notes carry the content.
[UNIT CONTEXT] the deterministic slide plan (list of {slideId, layoutId, blockRef, purpose})
[TASK] For each planned slide: title ≤6 words; bullets ≤4 × ≤10 words (only for layouts
  that take bullets); one-sentence visual description for image search (imagePrompt, in
  English, stock-photo style); speaker notes = 60–120 words of what the trainer actually
  says at this slide, consistent with the trainer guide for the same blockRef.
[FORMAT] Return ONLY JSON: SlideState[] per provided schema. Do not invent or drop slides.
[QUALITY] Zero sentence-bullets. Notes in the author's voice. Language: {{language}}
  (imagePrompt excepted — English).
```

**A.4.7 `trainer-flow-polish.ts`** (1 apel per CURS; agenda brută e asamblată determinist)
```
[ROLE] You are a master facilitator writing the choreography of a training day.
[UNIT CONTEXT] the deterministic chronological agenda (all blocks, all modules, absolute
  times, breaks, materials per block)
[TASK] Do NOT alter times, order, titles or durations. For each row add one line of
  choreography: where the trainer stands/what they set up/energy note ("return from break:
  recap from memory, deck closed"). Add a 3-line opening ritual and a 3-line closing ritual
  for the day, in the author's voice.
[FORMAT] return the same table with the added column + the two rituals.
```

### A.5 Versionare și disciplina schimbării

- Toate în `supabase/functions/generate-course-content/prompts/`, un fișier per prompt, export const cu sufix de versiune internă (`CONTRACT_PROMPT_V1`).
- `prompts/PROMPT_CHANGELOG.md`: fiecare modificare = o linie (data, promptul, ce s-a schimbat, scorul pe rubrică înainte/după). Acesta e jurnalul calibrării din F6.
- Interdicții permanente (anti-patterns eliminate de audit): fără retry-with-scolding în lanț (max 1 retry, apoi warning vizibil); fără post-procesare care rescrie textul generat (doar validare + re-apel); fără few-shot-uri gigantice by default (GOLDEN_SAMPLES de azi umflă prompturile — în v1 pornim FĂRĂ ele; se reintroduc doar chirurgical în F6, ca fragmente scurte, dacă rubrica o cere).

## Cap. B — Garanția de calitate: ce facem dacă implementăm totul corect și materialele tot nu sunt cele dorite

Răspunsul onest: planul arhitectural garantează *condițiile* calității, nu calitatea. De aceea calitatea primește propriul mecanism, cu definiție măsurabilă, poartă blocantă și scară de escaladare. „Materialele dorite" încetează să fie o impresie și devin un scor.

### B.1 Rubrica de evaluare (definiția măsurabilă a „materialelor dorite")

Fișier: `docs/QUALITY_RUBRIC.md` (creat în F0). Fiecare criteriu 1–5. Se punctează cursul-etalon complet (toate cele 5 livrabile), separat RO și EN.

| # | Criteriu | 5 înseamnă |
|---|---|---|
| 1 | Aliniere obiectiv–activitate (Bloom) | Fiecare exercițiu antrenează exact verbul obiectivului; debrief-ul îl verifică |
| 2 | Arhitectura Merrill | Activare reală (experiența lor), demonstrație cu exemplu lucrat, aplicare dominantă, integrare spre job |
| 3 | Specificitate | Scenariile s-ar strica dacă schimbi industria; zero placeholder-e; cifre plauzibile |
| 4 | Profunzime/densitate | Teoria e capitol de manual, nu note de slide; proporțională cu minutele blocului |
| 5 | Consistență inter-livrabile | Ghidul, manualul, foile, slide-urile și flow-ul se referă la aceleași blocuri, ID-uri, durate |
| 6 | Ton | Un cititor care cunoaște autorul l-ar recunoaște; interdicțiile respectate 100% |
| 7 | Puritate lingvistică | Zero contaminare (verificat și automat, F2-T5) |
| 8 | Utilizabilitate în sală | Trainerul poate livra DOAR cu ghidul+flow-ul; participantul poate lucra DOAR cu foaia |
| 9 | Mediu (LIVE/ONLINE) | Mecanicile corecte peste tot; zero referințe din mediul greșit |
| 10 | Slide-uri | Layout justificat de conținut; ≤4 bullets; speaker notes care duc greul |

**Referințe-aur:** exemplele existente în `docs/COURSE OUTPUT EXAMPLES/` și `docs/CURS 8 ORE PROMPT ENGINEERING/` se mută în `docs/golden-references/` (F0) și devin standardul lui „5" — sunt materialele pe care owner-ul le-a considerat deja bune.

**Prag de trecere (M6):** medie ≥ 4,0 și niciun criteriu < 3, pe RO și pe EN.

### B.2 Faza de calibrare (F6) — bucla

```
generează etalonul → punctează pe rubrică (owner + Claude ca pre-evaluator pe criteriile
mecanice 3,5,7,9) → identifică cel mai slab criteriu → modifică EXACT UN prompt (sau un
parametru: granularitate/model) → regenerează DOAR unitățile afectate → re-punctează → repetă
```
- O iterație = o modificare, logată în PROMPT_CHANGELOG cu delta de scor. Fără schimbări simultane multiple — altfel nu știi ce a funcționat.
- Buget: 10 iterații. Dacă pragul nu e atins, se urcă pe scara B.3 (nu se mai iterează orbește).

### B.3 Scara de escaladare (dacă calibrarea stagnează) — în ordine, fiecare treaptă doar dacă precedenta n-a atins pragul

1. **Few-shot chirurgical:** fragmente scurte (300–600 cuvinte) din referințele-aur, injectate DOAR în promptul criteriului deficitar (ex. un exemplu de secțiune de manual „nota 5" în `participant-manual.ts`).
2. **Model mai puternic pe apelurile cu levier maxim:** contractul (A.4.2) și exercițiile (A.4.4) trec pe clasa Pro (ex. gemini-pro curent) — sunt ~12 apeluri/curs; restul rămân pe Flash. Cost estimat: creștere <2× total, impact maxim pe criteriile 1–4. Orchestratorul primește parametru `modelTier` per tip de apel (pregătit în F3).
3. **Granularitate mai fină:** manualul trece de la per-modul la per-2-blocuri; ghidul similar. Crește numărul de apeluri (~35–40/curs), crește densitatea.
4. **Îmbogățirea contractului:** dacă proza e bună dar „generică", problema e amonte — se adaugă în contract câmpuri de context (un „world seed" per modul: companie fictivă, cifre, constrângeri) generate o dată și reutilizate de toate livrabilele.
5. **Concluzia onestă (ultima treaptă):** dacă după 1–4 materialele sunt „draft foarte bun, nu gata-de-sală", produsul se poziționează explicit așa (landing-ul deja spune „You keep the pen. It sharpens it."), iar investiția se mută în experiența de editare. Decizie de business, luată de owner pe date (scoruri + costuri), nu prin abandon tăcut.

Acest capitol este răspunsul la „ce se întâmplă dacă implementăm 100% corect și tot nu iese": nu se poate întâmpla *nedetectat* și există un drum definit pentru fiecare mod de eșec.

---

# PARTEA III — FAZELE DE EXECUȚIE

## F0 — Plasă de siguranță (½ zi) · Risc: zero
- **F0-T1.** `git tag pre-refactor-2026-07`. Creează `IMPLEMENTATION_STATUS.md` (borne + toate task-urile + secțiunea Descoperiri).
- **F0-T2.** `docs/` → `docs/_archive/`, cu excepțiile: creează `docs/golden-references/` (mută `COURSE OUTPUT EXAMPLES/` și `CURS 8 ORE PROMPT ENGINEERING/`), `docs/QUALITY_RUBRIC.md` (conținutul din B.1), `docs/README.md` nou (indică audit, plan, status, rubrică).
- **F0-T3.** Generare completă pe etalon RO pe arhitectura ACTUALĂ → output-uri brute în `docs/baseline/` (comparația „before"; se va puncta și pe rubrică în F6 ca punct de plecare).
- **F0-T4.** `src/tests/fixtures/etalonCourse.ts` (RO+EN, cu tonul exact din §3).
**DoD:** M0 — tag, status file, rubrică, golden-references, baseline, fixture — toate comise; typecheck verde.

## F1 — Demolare controlată (1 zi) · Risc: mic
- **F1-T1. Butoanele Generate/Rafinează din editor** — ștergere completă conform listei din audit §7: `geminiService.ts` (`invokeContentFunction`, `generateCourseContent`, `improveCourseContent`, `refineCourseContent`; păstrează `pingEdgeFunction`, `refineBlueprint`), `CourseWorkspacePage.tsx` (blocuri UI desktop ~1769-1810 și mobil ~2108-2140, `handleAiAction`, `handleGenerate` legat de `generateCourseContent`, `canGenerate`, `canRefine`, `isAiActionsOpen`, ref-urile, `isProposingChanges`, `proposedContent`, `originalForProposal`, `handleAccept/RejectChanges`, `localRefinements`, importuri orfane), `ReviewChangesModal.tsx` (șters dacă are referințe doar aici), `featureFlags.ts` (cele două chei + docs + union type), cheile i18n `course.refine.*`.
- **F1-T2. ProtagonistEnforcer + `fixes/`** — folderul șters integral; cele 5 apeluri `.enforce(...)` eliminate din `index.ts`.
- **F1-T3. Conceptul de protagonist global** — șterse: `inferProtagonistFromAudience`, `getOrCreateStoryArc`, citirile/scrierile `story_arc` (coloana rămâne până la F10), blocul `narrative` din `ModuleContext`, placeholder-ele `{{protagonist*}}`/`{{storyStage}}` din toate prompturile. Regula de personaje locale (P4) intră în prompturile de exerciții (formularea din A.4.4).
- **F1-T4. Smoke:** generare etalon RO; verificări: personaje distincte per exercițiu; `grep -E '[a-zăîâșț]Alex' output` → 0.
**DoD:** M1 — typecheck+test verzi; grep `ProtagonistEnforcer|refineCourseContent|editorRefineButton` în src/ și supabase/ → 0.

## F2 — Fundația de localizare (2 zile) · Risc: mediu
- **F2-T1.** `localizedLabels`: inventarul complet al etichetelor (din F2-T2), promptul A.4.1, migrație `courses.localized_labels jsonb`, fallback EN static, generare la crearea cursului.
- **F2-T2.** Sterilizarea TUTUROR șabloanelor: punctele din audit §4 (EXERCISES_PROMPT:1843-1867, WORKBOOK_PROMPT:1554, prompturi globale :394/:555, `generateCostZeroSlides`, `COST_ZERO_SLIDES_LABELS` — înlocuit cu labels) + orice alt string găsit la inventar. Structura se cere exclusiv prin `{{label_*}}`.
- **F2-T3.** Validare de limbă uniformă: elimină `skipAiValidation` complet; detectorul rulează pe orice output >400 caractere; `LANG_SIGNATURES` extins la toate limbile din `src/languages.ts` (limbi fără semnături → accept cu warning logat); **maximum 1 retry**, apoi warning în raportul de generare.
- **F2-T4.** Meta-instrucțiuni EN, conținut verbatim (regula A.1).
- **F2-T5.** `src/tests/languagePurity.test.ts`: pe etalonul EN → 0 apariții `['Obiectiv','Instrucțiuni','Spațiu','Etapă','Durată','Aplicarea','Povestea']` și 0 diacritice RO; pe RO → 0 headere EN (`Workspace:`, `Objective:` ca headere).
**DoD:** M2 — testul verde pe EN și RO; inspecție manuală fără amestec.

## F3 — Instalarea arhitecturii de prompturi + contractul de modul (3 zile) · Risc: mare, izolat (nu atinge randarea existentă)
- **F3-T1.** `buildPrompt(layers)` + `buildTonePreamble` (A.1, A.3). Șterge din cod: arhetipurile Mentor/Coach/Buddy, `narrativeUniverse`, `learningPhilosophy`, `masterTimeline`. `DNAEditModal` → 3 câmpuri (voce liberă / terminologie / mediu).
- **F3-T2.** Cele 7 fișiere de prompt (A.4) + `PROMPT_CHANGELOG.md` cu intrarea „v1 instalată".
- **F3-T3.** Schema `ModuleContract` (server types + Zod client, exact ca în A.4.2/planul v1: objective{statement,bloomLevel,bloomVerb}, blocks{id,phase,title,durationMinutes,keyPoints,exerciseSpec{format,scenarioSeed,characters[roluri],evidenceOfLearning,debriefBloomVerb}}, transitions).
- **F3-T4.** `validateModuleContract()` determinist: ≥1 ACTIVATION+DEMONSTRATION+APPLICATION; suma minutelor = durata (±5, corecție programatică pe ultimul bloc non-break); APPLICATION ≥40% la bloomLevel≥APPLY; niciun bloc >25 min fără schimbare de fază; BREAK la module ≥90 min; `bloomVerb`/`debriefBloomVerb` din dicționarul de verbi per nivel per limbă (dicționar nou în cod). Eșec → 1 re-apel cu erorile enumerate → apoi eroare vizibilă.
- **F3-T5.** Persistență: migrație `course_modules.contract jsonb` + `contract_version`; `is_dirty` invalidează; cache (nu se regenerează dacă există și e curat).
- **Amendament 2026-09-30 (D-015, aprobat owner):** F3-T5 se extinde cu tabelele `generation_jobs` + `generation_units` (o unitate = un apel LLM, cu `input_hash` și stare) în aceeași migrație; cache-ul = unitate `done` cu același `input_hash`. Detalii în `IMPLEMENTATION_STATUS.md` (F3-T5).
- **F3-T6.** Orchestrator: parametru `modelTier` per tip de apel (pregătire pentru scara B.3-2; default: tot Flash).
**DoD:** M3 (prompts/ + preambul + changelog instalate) și M4 (4 contracte valide pe etalon, salvate, **aprobate de owner** — poarta umană nr. 1).

## F4 — Cele 5 livrabile ca randări (4 zile) · Risc: mare, controlat prin flag
- **F4-T0 (amendament 2026-09-30, D-015, aprobat owner).** Orchestrare pe server a fluxului nou: `start_generation` creează job + unități, un worker le execută (auto-reînlănțuire + pg_cron ca plasă), clientul doar afișează progresul. Generarea continuă cu browserul închis și se reia exact pe unitate. Detalii în `IMPLEMENTATION_STATUS.md` (F4-T0).
- **F4-T1.** Feature flag `contractPipeline` (fluxul vechi rămâne intact până la F10; comparație A/B + revenire instant).
- **F4-T2.** Granularitate (P1): Manual 1 apel/modul (split la >6 blocuri); Exercise Sheets **1 apel/exerciseSpec**; Trainer Guide 1 apel/modul; Trainer Flow asamblare deterministă + 1 apel de finisare/curs; Slides în F7. Etalon: ~25 apeluri total.
- **F4-T3.** Consistență prin cod (P3): renderer-ele construiesc headerele din contract+labels prin `BLOCK_HEADER_TOKEN`; LLM-ul scrie doar corpul; ID-urile exercițiilor se propagă programatic în guide și flow.
- **F4-T4.** Validare deterministă post-generare: fiecare bloc are secțiune în manual și guide; fiecare exerciseSpec are foaie; suma minutelor flow = durata cursului; `debriefBloomVerb` prezent în foaia exercițiului; puritate lingvistică per livrabil. Eșec → re-apel DOAR pe unitatea eșuată. Raport în `GenerationProgressModal` (mecanism existent refolosit).
- **F4-T5.** DB: livrabilele pe cheile `course.livrables.*` existente (editor+export neatinse în această fază); sub flag, livrabilele legacy în plus (diagnostic, discussion guide, action plan, examples, cheat sheets, projects, tests) NU se mai generează — dispar din `STEPS_ORDER`.
- **F4-T6.** Logare consum: numărul de apeluri per generare, per tip, vizibil în logs (necesar pentru F6 și pentru DoD ≤30).
- **F4-T7.** Generare completă A/B pe etalon (nou vs baseline F0), prezentată owner-ului.
**DoD:** M5 — 5 livrabile pe etalon RO+EN, validare deterministă verde, ≤30 apeluri, owner confirmă superioritatea vs baseline (nu încă rubrica — aia e F6).

## F5 — (rezervat: absorbit în F4; numerotarea păstrează bornele) — nimic de făcut, marchează N/A în status.

## F6 — CALIBRAREA (poarta de calitate; 2–5 zile, buget 10 iterații) · Risc: aici se decide produsul
- **F6-T1.** Punctează baseline-ul F0 și output-ul F4 pe rubrică (RO+EN). Claude pre-evaluează criteriile mecanice (3,5,7,9), owner-ul punctează 1,2,4,6,8,10.
- **F6-T2.** Rulează bucla B.2: o modificare per iterație (un prompt SAU un parametru), regenerare doar pe unitățile afectate, log în PROMPT_CHANGELOG cu delta.
- **F6-T3.** Dacă după 10 iterații pragul (medie ≥4,0, niciun criteriu <3) nu e atins → scara B.3, treaptă cu treaptă, cu decizie de owner la treapta 2 (cost model Pro) și la treapta 5.
**DoD:** M6 — prag atins pe RO și EN, changelog complet, decizie scrisă a owner-ului „calitatea aprobată" în IMPLEMENTATION_STATUS.md. **Nicio fază ulterioară nu începe fără M6.**

## F7 — Slide-urile (3 zile) · Risc: mediu
Diagnostic (audit §6): conținut-sursă de 1 bullet; layout decis de 3 sisteme necorelate (euristici / re-analiză AI la export care contrazice editorul / rotație de contor global = aleator); două taxonomii concurente; un apel AI per slide LA FIECARE export. Principiu: **P7 — WYSIWYG strict.**
- **F7-T1.** Slide plan determinist din contract (în cod): ACTIVATION → `SECTION_HEADER`/`QUOTE`; DEMONSTRATION → 1 slide/keyPoint (`EXPLAINER`/`IMAGE_RIGHT` alternate; `COMPARISON` la opoziții marcate; `BIG_NUMBER` la cifre-cheie); APPLICATION → `EXERCISE` din exerciseSpec; final de modul → `SUMMARY`. Layout-ul derivă din tipul pedagogic ⇒ „pe subiect" prin construcție.
- **F7-T2.** 1 apel AI/modul cu `slides-copy.ts` (A.4.6) → direct `SlideState[]` JSON validat Zod (se elimină formatul `<SLIDE_BEGIN>` pe drumul nou). Speaker notes sincronizate cu Trainer Guide prin `blockRef`.
- **F7-T3.** O singură taxonomie: `SlideState.layoutId` cap-coadă; `templates.ts` re-mapat pe `LAYOUT_*`; șterse `SlideDesignJSON`, maparea arhetip→layout, euristicile pe cuvinte-cheie (păstrate DOAR pentru importul de documente externe, marcate ca atare).
- **F7-T4.** `analyze-slide` scos din export (funcția edge + apeluri + rotația fallback). Opțional (decizie owner, în Descoperiri): repurpose ca buton „Sugerează layout" pe UN slide, în editor, la cerere — niciodată automat, niciodată la export.
- **F7-T5.** `VisualOrchestrator` = singurul editor de slide-uri; slide-urile ies din TinyMCE; persistență `SlideState[]` în coloană dedicată `course_steps.slides_state jsonb` (migrație) — fără conversii HTML↔Markdown cu pierderi.
- **F7-T6.** Imagini alese la editare (Unsplash existent; `imagePrompt` pre-populează căutarea); exportul folosește strict `media.url` din state.
- **F7-T7.** Reguli de calitate în renderer: max 4 bullets (auto-split — mecanismul `pptxEnhancedPipeline` păstrat), overlay de contrast generalizat, `pptxTextOnlySafeMode` păstrat ca plasă.
- **F7-T8.** Mini-calibrare: criteriul 10 din rubrică punctat pe deck-ul etalonului; iterare pe `slides-copy.ts` dacă <4.
**DoD:** M7 — deck complet pe etalon; layout justificat de blocuri; editezi 3 slide-uri (layout+imagine+text) → PPTX reflectă exact; zero apeluri AI la export (verificat în logs); notes prezente și consistente cu guide-ul; criteriul 10 ≥4.

## F8 — Plafon 8 ore + landing (½ zi) · Risc: zero · Rulabilă oricând după F0
- **F8-T1.** UI: durata în `NewCourseModal`/`OnboardingChat` → listă închisă (1h, 2h, 3h, 4h, 6h, 8h). Mesaj (cheie i18n, toate limbile): „Pentru programe mai lungi, creează câte un curs de maximum o zi pentru fiecare zi de training."
- **F8-T2.** Server: `durationMinutes > 480` → eroare 422 cu mesaj clar; clamp defensiv în promptul de blueprint și de contract.
- **F8-T3.** Landing (`HomePage.tsx` + toate localele): spec-ul Duration devine „You choose — up to a full training day (8h)" / RO: „Tu alegi durata — până la o zi întreagă de training (8h)". `grep -ri semester src/` → 0.
**DoD:** M8 — imposibil de creat curs >8h din UI și prin apel direct; landing actualizat EN+RO.

## F9 — Design modern al materialelor (2 zile) · Risc: mic
- **F9-T1.** `src/lib/design/tokens.ts`: 2–3 teme („Paper & Gold" aliniată landing-ului — hârtie/grafit/auriu; „Boardroom"; „Clean Light"): paletă, pereche tipografică (display serif + text sans), scară, spațieri, stil bullets/tabele/casete. Tema per curs. O singură sursă pentru culori/fonturi (înlocuiește hex-urile hardcodate tip `#1E3A8A`).
- **F9-T2.** Consumatori: preview HTML editor (CSS variables generate din tokens), `templates.ts` (PPTX), `exportService`/`pdfExporter` (DOCX/PDF).
- **F9-T3.** Șabloane document: copertă (titlu curs, livrabil, dată, temă), header/footer cu paginare + modul, cuprins din structura contractului; componente: casetă Exercițiu (chenar accent + icon), casetă Notă facilitator (doar guide), spații de lucru reale în manual, timeline vizual în flow.
- **F9-T4.** Diferențiere per livrabil („each with a job"): Guide — coloană de timing cu ora absolută; Manual — reflecții integrate în flux; Exercise Sheets — o foaie/exercițiu, self-contained, debrief pe pagină separată (verso).
- **F9-T5.** Test explicit diacritice RO în PDF (jspdf are istoric) + un export EN.
**DoD:** M9 — export DOCX+PDF+PPTX pe toate livrabilele etalonului; verificare vizuală owner; diacritice corecte.

## F10 — Curățenie finală, tăierea legacy (2 zile) · Risc: mediu (doar acum, după M6+M7)
- **F10-T1.** `contractPipeline` devine implicit și dispare, împreună cu: pașii legacy din `STEPS_ORDER` (rămân cei 5 + blueprint), `handleLegacyStep` + ~15 prompturi globale moarte, `generateCostZeroSlides`, `GOLDEN_SAMPLES`/`golden-master`/`golden-parser` (dacă fără apelanți), dubletul FacilitatorNotes/FacilitatorManual, `generate_workbook_part`/`generate_slides_part`, `TrainerStepType`-urile nefolosite.
- **F10-T2.** Spargerea `index.ts` (5.400 linii) fără schimbare de comportament: `index.ts` (routing subțire) · `orchestrator.ts` · `contract.ts` · `renderers/` (guide/manual/exercises/flow/slides) · `validation.ts` · `localization.ts` · `prompts/`.
- **F10-T3.** Erori reale: elimină masca „200 cu error"; statusuri corecte; clientul afișează `error.message` de la server; verifică toate call-site-urile `functions.invoke`.
- **F10-T4.** Igienă: `STRIPE_PUBLISHABLE_KEY` → env (`VITE_STRIPE_PK`); scoate `moonshot-v1-8k` din fallback (context 8k) sau înlocuiește cu model cu context adecvat; migrație de curățare (`story_arc`, câmpurile DNA moarte); șterge `RlsTestPage`, `header.txt`, testele orfane; `README.md` nou cu diagrama: blueprint → contracte → 5 randări → calibrare.
- **F10-T5.** `e2e_generation.test.ts` rescris: etalon RO+EN; aserțiuni = validările F4-T4 + puritatea F2-T5 + apeluri ≤30.
**DoD:** M10 — teste verzi; `index.ts` <300 linii; grep simboluri legacy → 0; generare etalon reușită în producție; toate bornele DONE în IMPLEMENTATION_STATUS.md.

---

# PARTEA IV — RISCURI ȘI ESTIMARE

| Risc | Faza | Mitigare |
|---|---|---|
| Materialele nu ating standardul dorit deși codul e corect | F6 | Rubrică + poartă blocantă M6 + scara de escaladare B.3; eșecul devine detectabil și adresabil, nu o surpriză la final |
| Regresie pe utilizatorii existenți în timpul refactorului | F4–F7 | Flag `contractPipeline`; fluxul vechi neatins până la F10; cursurile vechi rămân citibile |
| Calitatea contractului contaminează tot lanțul | F3–F4 | Validare deterministă strictă + poarta umană M4 înainte de randări |
| Derapaj de prompt-uri fără trasabilitate | F6 | PROMPT_CHANGELOG + regula „o modificare per iterație" + prompturi separate de cod |
| Export PPTX/PDF fragil (istoric documentat) | F7, F9 | `pptxTextOnlySafeMode`, auto-split păstrat, test diacritice |
| Costuri LLM în dezvoltare | toate | Etalon de 4 module; contracte cache-uite; validare deterministă (fără judge AI); regenerare doar pe unități afectate |
| Claude Code deviază de la plan | toate | Protocolul Cap. 1 + status file + DoD + porți umane M4/M6 |

**Estimare:** ~20 zile efective. Drumul critic: F0→F1→F2→F3→F4→F6 (poarta de calitate) → F7 → F9 → F10. F8 paralelizabilă oricând.

**Definiția succesului (recitibilă la final):** un trainer primește pentru cursul-etalon cele 5 artefacte promise de landing, în vocea autorului, în limba cursului, scalate la 4 ore, cu scor de rubrică ≥4,0, exportate cu design consecvent, generate din ≤30 de apeluri — și poate intra în sală doar cu ele.
