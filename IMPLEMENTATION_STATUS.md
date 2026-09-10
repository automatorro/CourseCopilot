# IMPLEMENTATION_STATUS — CourseCopilot refactor 2026-07

**Sursa unică de adevăr a progresului.** Se bazează pe:
- `docs/AUDIT-CourseCopilot-2026-07-18.md` (diagnostic)
- `docs/CURATENIE-SI-MODERNIZARE-CourseCopilot.md` v2.0 (plan de execuție)

Convenții:
- Statusuri: `TODO` · `IN_PROGRESS` · `DONE` · `BLOCKED(motiv)` · `N/A`
- `DONE` doar cu Definition of Done al fazei confirmat.
- Descoperirile mergi în §Descoperiri; nu improvizezi soluții.

---

## ▶ REIA DE AICI (scris 2026-09-10, sesiunea S13 — F3-T1 DONE)

**Task terminat: F3-T1** — `buildPrompt(layers)` + `buildTonePreamble` instalate (A.1/A.3), arhetipurile
Mentor/Coach/Buddy + `narrativeUniverse` + `learningPhilosophy` + `masterTimeline` șterse din
`CourseDNA` (`src/types.ts`), `DNAEditModal.tsx` redus la 3 secțiuni (Terminologie + expresii
interzise / Vocea ta — text liber verbatim / Mediu de livrare — afișaj read-only din
`course.environment`).

**Decizii de implementare (surgical, per D-008 — `buildDNABlocks()` alimentează Golden Path-ul încă
live pentru userii existenți):**
- Câmp nou pe `CourseDNA`: `toneFreeText` (nu `userToneText` — am aliniat numele la fixture-ul
  F0-T4 deja commis, `src/tests/fixtures/etalonCourse.ts`, care îl folosea deja sub acest nume).
  `forbiddenPhrases` mutat sub `terminology` (tot aliniat la același fixture), nu câmp separat.
- `buildPrompt(layers)`/`buildTonePreamble` sunt funcții noi, **instalate dar neconectate încă** la
  randarea vie — le consumă abia F3-T2 (cele 7 fișiere de prompt). Așa cum cere eticheta de risc a
  planului pentru F3-T1 ("izolat, nu atinge randarea existentă") — dacă aș fi băgat
  `buildTonePreamble` direct în `buildDNABlocks()`, terminologia ar fi apărut de două ori în prompt
  (block dedicat + preambul), cost de tokeni fără beneficiu.
- `buildDNABlocks()` păstrat (D-008), dar `voiceProfileBlock` acum derivă din `toneFreeText` +
  `terminology.forbiddenPhrases` în loc de vechiul `voiceProfile` (formality/humorLevel/etc.) —
  toate cele 5 generatoare Golden Path (`generateWorkbookContent`, `generateManualContent`,
  `generateSlidesContent`, `generateVideoScriptContent`, `generateModuleContext`) continuă
  neschimbate structural, doar sursa de date s-a simplificat. `philosophyBlock` eliminat complet
  (secțiunea „LEARNING PHILOSOPHY" din `MANUAL_PROMPT` ștearsă — nu era niciodată editabilă din UI).
- Cod legacy încă folosit prin `GLOBAL_STEPS` (nu doar Golden Path): pasul `course_dna` (promptul +
  fallback-ul de generare AI) rescris pe schema nouă; `course_macro_structure`/`agenda_table` nu mai
  citesc `masterTimeline` (oricum nu era niciodată editabil, fallback identic la ce se întâmpla deja
  când lipsea); `facilitator_manual`/`discussion_guide` citesc acum `toneFreeText` în loc de
  `voiceProfile.formality/humorLevel`.
- `hasMinimalCourseDNA()` verifică acum `terminology.participant` în loc de primul protagonist.
- Fallback-ul din `GenerationProgressModal.tsx` (JSON parse error) aliniat la schema nouă.
- Locale actualizate (en/ro/es/fr/it/de): chei narrative/protagonist/formality/humor/signature
  șterse; chei noi `dna.edit.section.voice`/`voice.help`/`voice.placeholder`/`section.environment`/
  `environment.live`/`environment.online`/`environment.help` adăugate (es/fr/it/de au text EN,
  consistent cu restul secțiunii DNA în acele fișiere — gap de traducere pre-existent, nu introdus
  acum). `t()` cade pe fallback EN pentru chei lipsă (`I18nContext.tsx`), verificat în cod.
- Verificat: `npm run typecheck` verde; `npx vitest run` → 14/15 (singurul eșec e D-003,
  pre-existent, neatins de acest task). Nu s-a putut testa generarea live (fără acces la Supabase
  din acest mediu) — la fel ca D-002/D-012; recomandat owner-ului un test manual de generare pe un
  curs existent cu DNA vechi (verifică nedistructiv: `course.dna` cu formă veche în DB nu se strică,
  doar câmpurile noi lipsesc și cad pe fallback-urile din prompturi).

**Următorul pas: F3-T2** — cele 7 fișiere de prompt (`prompts/localized-labels.ts`,
`module-contract.ts`, `participant-manual.ts`, `exercise-sheet.ts`, `trainer-guide.ts`,
`slides-copy.ts`, `trainer-flow-polish.ts`, per A.4) + `PROMPT_CHANGELOG.md`. Acestea sunt primele
locuri unde `buildPrompt`/`buildTonePreamble` chiar intră în uz.

**Rămân deschise, neschimbate față de sesiunea trecută**: F1-T4 (smoke owner, tot BLOCKED), cele două
propuneri neconfirmate pentru F4-T7 (baseline substitut) și F3-T4 (dicționar Bloom RO+EN).

---

## ▶ REIA DE AICI — istoric (scris 2026-09-05, sesiunea S12 — F2 închis, pregătire F3)

**Context de sesiune**: owner-ul a cerut o pauză de reconciliere după migrarea Claude (S11) — „am
făcut o mare paranteză, să vedem cum stăm cu planul de implementare". Am auditat direct în cod (nu
doar status file) starea F0-F10: **F3-F10 sunt 0% începute** — verificat: `grep "ModuleContract|
buildPrompt(|buildTonePreamble"` în `index.ts` → 0 rezultate; `DNAEditModal.tsx` încă are 23
apariții Mentor/Coach/Buddy/narrativeUniverse/etc. Flag-ul `contractPipeline: true` (activ azi) NU e
arhitectura din plan — e un mecanism informal din august (D-009), mult mai simplu.

**Decizie owner (2026-09-05): opțiunea A — înlocuire curată.** La F3, `handleGoldenStep`/
`CONTRACT_STEPS_ORDER` (generare text-liber-direct) se înlocuiesc integral cu fluxul
contract→validare→randare din plan, nu se construiește peste mecanismul informal existent.

**Înainte de F3, am închis F2** (regula planului §1.2: „faza N+1 nu începe fără faza N DONE" — F2
nu era DONE, avea muncă reală rămasă):
- **F2-T1**: infrastructura `LocalizedLabels` (deja construită în S09-S10) confirmată funcțională.
  Conectarea la „consumatorii activi" (WORKBOOK_PROMPT etc.) **re-scopată intenționat**: acele
  șabloane sunt exact ce înlocuiește F4-T2 — a le cabla acum ar fi efort aruncat. Detalii în §F2-T1.
- **F2-T2**: audit exhaustiv (nu punctual) — toate cele 99 de linii cu diacritice RO din `index.ts`
  verificate una câte una. Zero bug-uri noi; tot ce a rămas e fie ramificat corect pe limbă, fie cod
  mort confirmat (D-011). Prompturile structure/blueprint verificate explicit — curate.
- **M2 confirmat DONE**: testul de puritate lingvistică verde + inspecție manuală completă, fără amestec.

**Două lacune reale găsite în planul F3/F4, semnalate owner-ului ÎNAINTE de a le lovi în execuție**
(nu descoperite pe drum):
1. **F4-T7** cere comparație „nou vs baseline F0", dar F0-T3 (generarea baseline-ului) a fost SKIPPED
   prin decizie owner din iulie. **Soluție propusă, neconfirmată încă**: generăm comparația live la
   momentul F4-T7 din fluxul legacy (`handleLegacyStep`, tot există în cod), nu dintr-un baseline vechi.
2. **F3-T4** cere „dicționar de verbi Bloom per nivel per limbă" — aplicația suportă ~100 de limbi;
   nerealist complet. **Propunere, neconfirmată încă**: dicționar riguros doar RO+EN (etalon), restul
   cu degradare grațioasă + warning logat (precedent deja acceptat la F2-T3).

**Task următor: F3, task cu task, cu typecheck+test+commit după fiecare** (nu totul dintr-o rafală).
Ordinea din plan: F3-T1 (buildPrompt/buildTonePreamble + ștergere arhetipuri Mentor/Coach/Buddy din
`DNAEditModal.tsx` — atenție: `buildDNABlocks()` alimentează >10 puncte din prompturi, D-008; se
simplifică chirurgical, nu se șterge tot) → F3-T2 (cele 7 fișiere de prompt, A.4) → F3-T3 (schema
`ModuleContract`) → F3-T4 (validare determinist, cu propunerea de mai sus pentru dicționarul Bloom) →
F3-T5 (persistență, migrație nouă) → F3-T6 (`modelTier`, adaptat la Claude: azi un singur model
`claude-sonnet-5`, parametrul rămâne plumbing pentru o eventuală escaladare la Opus, nu Flash/Pro).

**Blocant separat, tot deschis, ieftin de închis**: F1-T4 (smoke manual pe cursul-etalon) — owner,
~15 minute, restanță din 15 august. Nu blochează F3, dar M1 rămâne ALMOST până se confirmă.

---

## ▶ REIA DE AICI — istoric (scris 2026-09-04, sesiunea S11 — migrare LLM provider Gemini → Claude)

**Task-ul S11** (cerut direct de owner, NU parte din planul F0-F10 formal): înlocuirea completă a
Google Gemini cu Anthropic Claude (`claude-sonnet-5`) ca provider LLM al aplicației, plus eliminarea
fallback-ului Moonshot/Kimi (decizie explicită owner). Detalii complete în secțiunea nouă
**„Migrare LLM provider: Gemini → Claude (2026-09-04)"** de mai jos. `generate_localized_labels`
(din S09-S10) rulează automat prin noul `ClaudeProvider` odată cu acest merge — folosește `callLLM`,
neschimbat de migrare.

**Ce e gata (cod, verificat local, S11):**
- `supabase/functions/generate-course-content/index.ts` — `GeminiProvider`/`MoonshotProvider`/
  `fetchWithRetry` șterse; `ClaudeProvider` nou (SDK `npm:@anthropic-ai/sdk`, model `claude-sonnet-5`,
  `max_tokens: 8192`); `AIOrchestrator` cu un singur provider; `provider_status`/`test_connection`
  actualizate.
- `supabase/functions/analyze-slide/index.ts` — migrat similar (SDK Anthropic, același prompt/parsing JSON).
- Frontend: `UsageSection.tsx`, `DashboardPage.tsx` (tip `ProviderStatus`, labels), `public/locales/{en,ro}.json`
  (`health.claude` + tot copy-ul de marketing „Powered by Google Gemini" → Claude), `metadata.json`.
- `supabase/functions/generate-course-content/README_ARCHITECTURE.md` — rescris pentru arhitectura nouă.
- Migrație SQL nouă scrisă: `supabase/migrations/20260904_claude_pricing.sql` (branch de preț Claude
  în view-ul `usage_logs_with_cost`, Gemini/Moonshot rămân neatinse pentru istoricul de cost).
- `npm run typecheck` verde, `npx vitest run` → 12/13 verde (D-003 neschimbat, singurul eșec cunoscut).
- Merge cu `origin/main` (commit-urile S08-S10, „Localised Labels") efectuat local — fără conflicte
  de logică reale, doar pe acest fișier de status. `IMPLEMENTATION_STATUS.md`, `DashboardPage.tsx` și
  `index.ts` s-au suprapus, dar pe zone diferite de cod — rezolvate manual, typecheck+teste re-verificate
  după merge.
- **Push direct pe `main` făcut** (commit `a7760f3`, conform noii reguli de workflow — vezi
  `CLAUDE.md § Convenții/Git`). **CI verificat explicit: run #28 „Deploy Supabase Functions" →
  `conclusion: success`** — codul cu Claude e live. Rămân doar pașii owner de mai jos (secret +
  migrație SQL) pentru ca generarea reală să funcționeze.

**Smoke test 2026-09-04 → 2026-09-05: SMOKE OK — toate cele 3 acțiuni de sănătate răspund verde pe
funcția live.** Cronologia celor 2 probleme reale găsite și reparate (apel direct la funcțiile live cu
anon key-ul public din `src/services/supabaseClient.ts`, acțiuni fără cost AI):

1. **Cheia `ANTHROPIC_API_KEY` era de tip „Personal" (identity-linked), nescopată la un singur
   workspace** — nu are legătură cu OAuth/`ant auth login` (corecție la o explicație inițială greșită):
   owner-ul a confirmat cu screenshot din Consolă că toate cele 6 chei vechi sunt „Workspace (legacy)"
   (scopate implicit, niciodată nu au avut nevoie de header), iar Consola generează acum implicit chei
   „Personal" (identity-backed) la „Create key", care necesită `anthropic-workspace-id` explicit dacă
   nu sunt scopate la creare — comportament nou al Consolei, nu ceva schimbat de owner. **Fix**:
   `Config.ANTHROPIC_WORKSPACE_ID` (ambele edge functions), default hardcodat la
   `wrkspc_01CfRoZ5D1KYnNSLd7i8C1Yz` (singurul workspace al organizației — ID public, nu secret),
   trimis ca header `anthropic-workspace-id` pe fiecare apel Claude.
2. **`generate-course-content` nu pornea deloc**: `BOOT_ERROR`, HTTP 503. Log-ul Supabase (cerut
   owner-ului, primit) a dat cauza exactă: `Uncaught SyntaxError: Identifier 'getDefaultEnglishLabels'
   has already been declared` — două funcții cu același nume, apărute din combinarea acestei sesiuni cu
   munca paralelă „Localised Labels" (una veche, moartă, zero apelanți; una nouă, activă). Ipoteza mea
   inițială (conflict `npm:` vs `esm.sh`) era greșită — am șters funcția moartă și am verificat cu un
   parse AST complet că nu mai există alte coliziuni de identificatori la nivel de top-level în fișier
   (`ts.transpileModule`, folosit inițial, NU detectează asta — face doar verificare de sintaxă, nu de
   scope/binding; e o lecție de reținut pentru verificări viitoare pe acest fișier).

**Verificat live, toate 3 acțiuni pe `generate-course-content`:** `ping` → pong; `provider_status` →
`{"claudeConfigured":true,"activeProvider":"claude"}`; `test_connection` →
`{"claude":{"status":200,"ok":true,"body":"Hi! How can I help you today?"}}`. `analyze-slide` la fel,
confirmat anterior. **Migrarea Gemini → Claude e complet funcțională end-to-end.**

**Testul real din UI (owner, 2026-09-05) a mai găsit o problemă — dar NU de cod, NU de Claude:**
„Edge Function returned a non-2xx status code" la „Define Learning Objectives". Diagnosticat din
logurile Supabase trimise de owner:
```
[CreditGate] User 0a6d90f6-b687-49b2-b392-c78e794e5af3 is over limit: 56/50
```
Cererea a fost blocată de **gate-ul intern de credite AI al aplicației** (`profiles.ai_operations_used`
vs `ai_operations_limit`, plan Trial = 50/lună — `supabase/migrations/20260621_credit_system.sql`),
**înainte** de a ajunge la Claude — confirmat și de Claude Console (owner): $0.00 cheltuit luna asta.
**Nicio legătură cu bani/tokeni Anthropic** — contul avea deja 56 operații acumulate (testare anterioară,
inclusiv era Gemini) și a depășit plafonul de 50. Reset automat doar după 30 de zile de la
`plan_reset_at` (`increment_ai_operations`, linia 76-86 din migrația de mai sus) — prea lent pentru
testare activă.

**Cerință owner (2026-09-05), decizie permanentă, nu doar stopgap**: administratorul (owner-ul) trebuie
să aibă operații AI **nelimitate** — plafonat DOAR de facturarea reală Anthropic — iar restul
utilizatorilor (Trial/Basic/Pro) rămân **neatinși**, cu limitele lor actuale exact ca înainte. Rezolvat
la nivel de bază de date (sursă unică de adevăr, nu duplicat în TypeScript), reutilizând conceptul deja
existent `profiles.role = 'admin'` (deja folosit în `DashboardPage.tsx` pentru bypass-ul limitei de
cursuri — pattern consistent, nu o soluție nouă paralelă). Migrație nouă:
`supabase/migrations/20260905_admin_unlimited_ai_credits.sql` — `CREATE OR REPLACE` pe
`increment_ai_operations`/`get_ai_credit_status`: dacă `role='admin'`, `allowed`/`is_over_limit` devin
mereu permisive; pentru orice alt `role`, condiția se reduce algebric exact la comportamentul vechi
(`v_used <= v_limit`), deci zero risc de a afecta userii normali. Contorul `ai_operations_used` tot se
incrementează pentru admin (vizibilitate proprie asupra consumului), doar gate-ul de blocare e dezactivat.
SQL-ul complet postat în chat, **AȘTEAPTĂ RULARE OWNER**. (Update-ul DML de reset manual/limită 500,
propus inițial ca soluție rapidă, devine inutil odată aplicată această migrație — nu mai trebuie rulat.)

**Concluzie finală:** migrarea de cod Gemini → Claude e 100% funcțională și verificată live (auth,
workspace, boot, apel real la Claude — toate confirmate). Singurul obstacol rămas pentru un test complet
de generare curs e plafonul intern de credite, nelegat de migrare — se rezolvă cu migrația SQL de mai
sus, apoi owner-ul reia testul din UI.

**Investigația de cost (cerută explicit de owner ca prioritate mare, IMPLEMENTATĂ în S11 — vezi
secțiunea dedicată mai jos):** cele trei recomandări (deduplicare `ai_cache`, plafon global de retry,
logare completă a token-ilor indiferent de validarea proprie) au fost cerute obligatoriu de owner și
implementate în aceeași sesiune. Detalii complete + avertismentul despre ce NU e acoperit de aceste
trei fixuri în secțiunea **„Investigație cost — fixuri implementate (2026-09-04, S11)"** de mai jos.

### Blocantul #1 — smoke-ul F1-T4 (owner, ~15 min)

Nu mai e blocat de deploy. `generate-course-content` rulează live exact codul de pe `main`
(D-014), deci pasul 1 din §Smoke F1 e **făcut**; owner-ul începe direct de la pasul 2 (login →
creează cursul-etalon RO → generează complet → cele 3 verificări). Când confirmi „F1 smoke OK",
M1 devine DONE. Până atunci M1 rămâne ALMOST și F1-T4 rămâne BLOCKED — nu se bifează pe presupunere.

### Task imediat următor: validare F2-T1/T2 și consumatorii activi

F2-T5 este validat: `npx vitest run src/tests/languagePurity.test.ts` → 2/2 verde, iar `npm run typecheck`
→ 0 erori. În S09 a fost adăugat contractul static `LocalizedLabels` + fallback-ul EN în
`src/constants/localizedLabels.ts`, câmpul opțional `Course.localized_labels` și migrarea
`supabase/migrations/20260903_add_localized_labels_to_courses.sql`. Ownerul a confirmat pe 2026-09-03
că migrarea a fost rulată și este în ordine. În S10 inventarul celor 18 etichete active a devenit
contract runtime; acțiunea `generate_localized_labels` are prompt JSON strict, validare de schemă și
fallback EN. Fluxul de creare/duplicare persistă rezultatul în `courses.localized_labels`. Rămâne
validarea executabilă în checkout-ul sincronizat și sterilizarea consumatorilor activi rămași.
**Atenție la comandă:** `npm test` e `vitest` în **watch mode** — blochează la infinit într-o
sesiune neinteractivă. Rulează `npx vitest run` (vezi nota din §A).

### F2-T4 — ce s-a făcut (S06)

Inventar complet al prompturilor din `index.ts` pentru meta-instrucțiuni în română. Singurele probleme găsite au fost în MANUAL_PROMPT:
- `English/Romanian here only` → `English here only` (regula A.1: meta-limbajul e EN, nu RO)
- `# Modul: {{moduleTitle}}` → `Begin with the module title as a level-1 heading in {{language}}` (eliminat hardcoding RO în OUTPUT FORMAT)
Toate celelalte prompturi (MODULE_CONTEXT_PROMPT, WORKBOOK_PROMPT, SLIDES_PROMPT, EXERCISES_PROMPT, VIDEO_SCRIPT_PROMPT, toate inline-urile) erau deja în EN. Codul mort (D-011: GOLDEN_SAMPLES) ignorat conform planului.

---

**Sesiuni S05 nedocumentate (10-11 aug, lucru ad-hoc în afara fazelor):**
- 599dd5a — fix iterare per-modul (Exercises, Examples, Manual) în `GenerationProgressModal` + acțiuni server noi
- 4bef20f — feat: log token usage (Gemini/Moonshot) în `user_usage` fire-and-forget
- 2989956 — fix `resolveModuleId`: rejectează ID-uri sintetice frontend, verifică mereu prin DB
- 9f2cb92 — fix i18n: anglicisme înlocuite în landing page (RO)
- 88d5459 — feat: UsageSection UI (gauge credite AI, cost lunar) în ProfilePage
- 352c217 — fix: unused vars in UsageSection (TS6133)
- f2d2296 — fix: SUPABASE_SECRET_KEYS fallback + supabase client în logUsage
- 65ff9ce — fix: ACTION_OPERATION_COSTS cu numele reale de acțiuni
- bfb9813 — docs: arhivare fișiere Trae sub `docs/_archive/trae-legacy/`
- 9788ca9 — Update CLAUDE.md (sesiune owner, 14 aug)

Niciuna din cele de mai sus nu e parte din F2–F10 formal. Sunt fix-uri/features ad-hoc confirmate de owner. Nu modifică starea bornelor M0–M10.

---

## Borne (M0–M10)

| Bornă | Faza | Livrabil verificabil | Status |
|---|---|---|---|
| M0 | F0 | Tag + status file + baseline „before" + fixture etalon | DONE (baseline SKIPPED prin decizie owner — vezi F0-T3) |
| M1 | F1 | Cod mort șters (butoane editor, ProtagonistEnforcer, fixes/); build verde | ALMOST (cod șters + typecheck verde + **deploy live confirmat**, D-014; rămâne DOAR smoke-ul manual F1-T4 la owner) |
| M2 | F2 | Test puritate lingvistică verde (EN fără RO, RO fără EN) | DONE (2026-09-05 — F2-T1..T5 toate DONE; testul verde + audit exhaustiv manual, zero amestec găsit) |
| M3 | F3 | Arhitectura de prompturi instalată: prompts/ + changelog + preambul de ton | TODO |
| M4 | F4 | Contracte de modul valide pe etalon; **aprobate de owner** (poarta umană 1) | TODO |
| M5 | F5 | Cele 5 livrabile randate din contract, validare deterministă verde | TODO |
| M6 | F6 | **Rubrica ≥ prag pe cursul-etalon (RO+EN)** — poarta de calitate (poarta umană 2) | TODO |
| M7 | F7 | Slides: layout stabil generare→editor→export, zero AI la export | TODO |
| M8 | F8 | Plafon 8h în UI+server; landing actualizat | TODO |
| M9 | F9 | Design system pe toate exporturile (DOCX/PDF/PPTX) | TODO |
| M10 | F10 | Legacy șters; index.ts spart în module; e2e verde | TODO |

**Porți umane blocante (cer aprobare explicită a owner-ului):**
1. **M4** — la finalul F3, aprobare contracte de modul valide pe etalon
2. **M6** — la finalul F6, aprobare rubrică ≥4,0 pe RO+EN

---

## Migrare LLM provider: Gemini → Claude (2026-09-04, sesiunea S11)

Inițiativă separată de planul de refactor F0-F10 — cerută direct de owner. Nu modifică nicio bornă
M0-M10. Motiv: factură Gemini disproporționată (~$30 / 3-4 cursuri / 3 zile) + dorința de a testa
modelul cel mai echilibrat cost/performanță din gama Anthropic curentă.

**Decizie model:** `claude-sonnet-5` (nu Sonnet 4.5, cum bănuia inițial owner-ul — acela există încă,
dar succesorul lui e simultan mai ieftin, $2/$10 per milion tokeni vs. ~$3/$15, ȘI mai capabil, deci
nu există compromis).

**Decizie fallback:** Moonshot (Kimi), fallback secundar activ azi în producție, a fost **eliminat
complet** odată cu Gemini (decizie explicită owner, subsumă task-ul F10-T4 din planul de curățenie,
care oricum îl programa la eliminare din cauza contextului de 8k, prea mic).

### Fișiere modificate
- `supabase/functions/generate-course-content/index.ts` — motorul principal. `Config.GEMINI_API_KEY`/
  `MOONSHOT_API_KEY`/`MOONSHOT_API_URL` → `Config.ANTHROPIC_API_KEY`. `GeminiProvider`+`MoonshotProvider`+
  `fetchWithRetry`+`RetryConfig` (cod mort, fără alți apelanți) șterse. `ClaudeProvider` nou — SDK oficial
  (`npm:@anthropic-ai/sdk`, același pattern de import Deno deja folosit în `analyze-slide`), model
  `claude-sonnet-5`, `max_tokens: 8192` (obligatoriu la Claude, spre deosebire de Gemini — plafon care
  lipsea complet înainte). Erori tipate SDK (`AuthenticationError`/`RateLimitError`/`APIError`) distinse
  explicit. `_lastCallUsage` populat identic ca înainte (contract neschimbat), deci logging-ul în
  `user_usage` continuă să funcționeze. `AIOrchestrator` cu un singur provider. `provider_status` →
  `{ claudeConfigured, activeProvider: 'claude'|'none' }`. `test_connection` → testează doar Claude.
- `supabase/functions/analyze-slide/index.ts` — SDK Gemini → SDK Anthropic, `GEMINI_API_KEY` →
  `ANTHROPIC_API_KEY`, lanțul de 3 modele Gemini → un singur apel `claude-sonnet-5`, prompt și parsare
  JSON neschimbate (funcția oricum programată la eliminare din export la F7-T4).
- `src/components/UsageSection.tsx` — footnote cost: „Google Gemini" → „Anthropic Claude".
- `src/pages/DashboardPage.tsx` — tip `ProviderStatus`, health-check UI: `googleConfigured`/
  `moonshotConfigured`/`activeProvider: 'google'|'moonshot'|'none'` → `claudeConfigured`/
  `activeProvider: 'claude'|'none'`.
- `public/locales/en.json` + `ro.json` — `health.google`/`health.moonshot` → `health.claude`;
  copy de marketing (`footer.poweredBy`, `homepage.hero.poweredBy`, `homepage.feature5.layer1`,
  `homepage.feature5.layer3_title`) actualizat de la „Google Gemini" la „Anthropic Claude".
- `metadata.json` — descrierea aplicației: „with the help of Google Gemini" → Claude.
- `supabase/functions/generate-course-content/README_ARCHITECTURE.md` — rescris (era deja desincronizat
  cu codul dinainte de migrare — menționa `gemini-1.5-pro`, codul real folosea `gemini-3.5-flash`).
- `src/services/geminiService.ts` — **neschimbat intenționat**: nu apelează Gemini direct (doar proxy
  către edge function via `supabase.functions.invoke`), deci nicio schimbare de logică; numele fișierului
  rămâne (redenumirea ar fi scope creep, fără impact funcțional).
- `docs/CURATENIE-SI-MODERNIZARE-CourseCopilot.md`/`docs/AUDIT-...md` — **neatinse intenționat**, guvernate
  separat de owner (plan activ / diagnostic static); mențiunile lor despre Gemini/Flash/Pro/`modelTier`
  rămân relevante doar pentru deciziile viitoare F3-T6, la M4/M6.

### Migrație SQL nouă — AȘTEAPTĂ DEPLOY OWNER
`supabase/migrations/20260904_claude_pricing.sql` — adaugă branch de preț pentru modelele `claude-*`
în view-ul `usage_logs_with_cost` (Claude Sonnet 5: $2/1M input, $10/1M output). Branch-urile
Gemini/Moonshot existente rămân neatinse (istoric de cost trebuie să rămână corect retroactiv).
SQL-ul complet a fost postat în chat conform `CLAUDE.md § Reguli owner → 1`. **Fără această migrare,
orice cost Claude cade pe fallback-ul greșit (preț Flash).**

### Secret nou — AȘTEAPTĂ ACȚIUNE OWNER
`ANTHROPIC_API_KEY` trebuie adăugat manual în Supabase (Dashboard → Edge Functions → Secrets), în
afara CI-ului (care nu setează niciodată secrete). `GEMINI_API_KEY`/`MOONSHOT_API_KEY` pot fi șterse
ulterior, opțional.

### Verificare făcută în sesiune
- `npm run typecheck` → verde (0 erori), rulat după `npm ci` (node_modules nu era instalat la
  începutul sesiunii).
- `npx vitest run` → 12/13 verde, singurul eșec e `e2e_generation.test.ts` (D-003, pre-existent,
  neschimbat de această migrare).
- Grep final `gemini|moonshot` (case-insensitive) în `src/` și `supabase/functions/` → doar rezultate
  așteptate (import-ul `geminiService` neschimbat intenționat, mențiuni istorice explicite în
  `README_ARCHITECTURE.md`).
- **Nu s-a putut testa generarea live** din acest mediu (fără `ANTHROPIC_API_KEY`, fără acces la
  instanța Supabase reală) — vezi pașii de verificare owner mai sus, în §REIA DE AICI.

### Investigație cost — fixuri implementate (2026-09-04, S11)

Owner-ul a cerut explicit, obligatoriu, implementarea imediată a celor trei recomandări (nu doar
documentarea lor), în aceeași sesiune ca migrarea Claude. Detalii per fix:

1. **Deduplicare `ai_cache`** — conectat în `callLLM`: înainte de `orchestrator.execute(prompt)`,
   se caută un hash SHA-256 al promptului în `ai_cache`; dacă există, se returnează `response`-ul
   cached fără niciun apel LLM nou. După un apel reușit, răspunsul se scrie în `ai_cache` (fire-and-forget,
   nu blochează răspunsul către utilizator). Elimină costul retry-urilor pe prompt identic.
2. **Plafon global de retry per generare** — variabilă nouă `_retryBudget` (per-request, resetată la
   începutul fiecărei acțiuni), decrementată la fiecare `retryWithStrictInstructions`; peste prag,
   se oprește cu „best effort" în loc să tot reîncerce. Nu elimină retry-ul per-modul din
   `GenerationProgressModal.tsx` (client-side, alt fișier/strat) — doar plafonează stratul server.
3. **Logare completă a token-ilor** — `_lastCallUsage` se populează acum din `response.usage` **imediat**
   ce Claude API întoarce un răspuns cu `usage`, înainte de orice validare proprie (conținut gol, JSON
   invalid etc.) — deci un apel care consumă tokeni reali dar eșuează validarea internă tot ajunge în
   `user_usage`, nu mai e invizibil.

**Avertisment onest, ca să nu se creadă că problema e 100% închisă:** aceste trei fixuri acoperă
mecanismele găsite prin analiză statică a codului — nu am avut acces la factura reală Google Cloud
sau la datele reale din `user_usage` pentru cursurile în cauză, deci nu pot confirma că sunt SINGURA
cauză. Rămân neverificate/neexcluse: bug-ul de „iterare per-modul" din S05 (verificat parțial reparat,
nu 100% reconfirmat aici); eventuale cursuri abandonate la jumătate în timpul testării manuale a
owner-ului (fiecare buton apăsat = tokeni reali consumați, indiferent dacă cursul a fost dus la capăt);
și o posibilă cursă de concurență teoretică pe `_lastCallUsage` (variabilă globală la nivel de modul,
într-un isolate Deno cald care poate servi request-uri concurente) — semnalată, dar nedemonstrată,
neremediată aici (ar necesita eliminarea completă a stării globale mutable, schimbare mai amplă decât
plafonul acceptat pentru un fix imediat). Dacă factura rămâne disproporționată și cu Claude, aceste
piste rămân de verificat în continuare.

---

## Verificări restante (owner — verifică la fiecare reluare, nu sări peste)

**Actualizat 2026-08-17 (S07).** Premisa inițială a acestei secțiuni („sesiunile de-aici nu au Node/npm",
D-012) **nu mai e valabilă în mediul remote**: Node 22 + npm 10.9.7 sunt disponibile, typecheck și teste
se rulează direct din sesiune. Coada §A e deci închisă (ambele intrări bifate). Ce rămâne permanent
valabil: sesiunile **nu rulează niciodată** SQL pe Supabase (regulă nenegociabilă, `CLAUDE.md § 1`),
deci coada §B se bifează DOAR de owner, după verificare reală în Supabase Studio — nu se șterge o
intrare doar pentru că a trecut timp sau pentru că „probabil e ok". D-012 rămâne ca istoric: descrie
un mediu local (IDE-ul de atunci) fără Node, nu mediul curent.

### A. Cod scris fără typecheck/test local — ÎNCHISĂ (ambele intrări verificate)
Comenzile de verificare:
```
cd CourseCopilot
npm ci                # sau npm install
npm run typecheck
npx vitest run        # NU `npm test`
```
**De ce `npx vitest run` și nu `npm test`:** scriptul `test` din `package.json` e `vitest` simplu, adică
**watch mode** — într-o sesiune neinteractivă (CI, agent) nu se termină niciodată și pare că a înghețat.
Constatat pe viu în S07. Dacă se adaugă vreodată un script `test:run`, se actualizează și aici.

Dacă ceva pică, spune exact ce — nu presupune că a mers doar pentru că nimeni nu s-a plâns.

| Verificat (data) | Commit-uri | Ce conțin |
|---|---|---|
| ☑ 2026-08-08 | `f3cb0f0`..`a5e7e0e` (7 aug) | Draft save/resume în `GenerationProgressModal` — cea mai riscantă bucată nouă, logică de upsert/state. Typecheck a picat inițial (2 variabile fără tip); reparat, vezi D-013. |
| ☑ 2026-08-08 | `f13d6b9`, `060adcb` (8 aug) | Sterilizare prompturi F2-T2 — text-only în template literals, risc mic. Typecheck/test verde, fără probleme găsite în acest cod. |

### B. Migrații SQL scrise dar fără confirmare scrisă că au fost rulate manual
Regula corectă (deja în `CLAUDE.md § 1`, respectată de aici înainte): Claude scrie `.sql` sub `supabase/migrations/` + postează SQL-ul complet în chat; **numai owner-ul** îl copiază în Supabase Studio → SQL Editor și confirmă. Lista de mai jos = ce există în `supabase/migrations/` sau e presupus de cod, fără o confirmare scrisă aici că a rulat.

| Rulat manual? | Ce | Semnal |
|---|---|---|
| ☑ confirmat de owner 2026-08-14 | `supabase/migrations/20260718_lead_capture.sql` — tabelele `waitlist_leads`, `demo_sessions` | Owner a verificat în Supabase Studio: **ambele tabele există**. Semnalul inițial (commit `683605c`, 19 iul, adăugase un fallback în UI „pentru cazul în care tabela nu există încă") e depășit — migrația a fost rulată între timp. |
| ☑ confirmat de owner 2026-08-14 | Coloanele `course_steps.is_completed` / `course_steps.status` (valoarea `'draft'`) | Owner a verificat în Supabase Studio: **ambele coloane există**. Confirmă ipoteza „există din schema de bază, creată direct în Studio înainte de convenția de migrații" — nu există migrație în repo care să le adauge, și nu e nevoie de una. Feature-ul de draft/resume (`f3cb0f0`) scrie deci în coloane reale, nu eșuează silențios. |

**Coada §B e goală la 2026-08-17.** Se redeschide la prima migrație nouă scrisă de aici: se adaugă un
rând cu ☐, se postează SQL-ul complet în chat, se bifează doar după confirmarea scrisă a owner-ului
(`CLAUDE.md § Reguli owner → 1`).

**Cum verifici B rapid (procedura, pentru intrări viitoare):** Supabase Studio → Table Editor → caută tabela; pentru coloane, deschide tabela → Columns. Raportează ce găsești, ca să pot bifa/corecta lista.

---

## Task-uri pe faze

### F0 — Plasă de siguranță (½ zi) · Risc: zero
- **F0-T1** [DONE] `git tag pre-refactor-2026-07` + `IMPLEMENTATION_STATUS.md` (borne + toate task-urile + secțiunea Descoperiri)
- **F0-T2** [DONE] `docs/` → `docs/_archive/`; creat `docs/golden-references/`, `docs/QUALITY_RUBRIC.md`, `docs/README.md` nou; `docs/baseline/README.md` cu instrucțiuni pentru F0-T3
- **F0-T3** [SKIPPED (owner decision, 2026-07-18)] Generare completă pe etalon RO pe arhitectura ACTUALĂ. Motiv: rubrica F6 e absolută, nu relativă; UI-ul actual nu are câmp de ton verbatim (apare abia în F3-T1) deci baseline-ul ar fi cu preset ≠ cu tonul cursului-etalon; efort ~2h fără impact pe poarta blocantă. Vezi `docs/baseline/README.md` pentru re-execuție opțională.
- **F0-T4** [DONE] `src/tests/fixtures/etalonCourse.ts` (RO+EN, cu tonul din §3)
- **DoD F0:** M0 — tag ✔, status file ✔, rubrică ✔, golden-references ✔, fixture ✔, baseline SKIPPED (decizie owner, motiv în F0-T3); typecheck verde ✔; testul pre-existent e2e_generation vezi D-003.

### F1 — Demolare controlată (1 zi) · Risc: mic
- **F1-T1** [DONE] Butoanele Generate/Rafinează din editor — ștergere completă (commit `ecac06b`)
- **F1-T2** [DONE] `ProtagonistEnforcer` + folderul `fixes/` — șters integral (commit `bbab569`)
- **F1-T3** [DONE] Conceptul de protagonist global — șters: `inferProtagonistFromAudience`, `getOrCreateStoryArc`, `story_arc`, blocul `narrative` din `ModuleContext`, toate placeholder-ele; P4 (personaje locale) în EXERCISES_PROMPT (commit `85b548b`)
- **F1-T4** [BLOCKED(owner runs smoke)] Smoke test pe etalon RO. **Deploy-ul e făcut** (D-014, 15 aug) — owner-ul începe direct de la pasul 2 din §Smoke F1 mai jos
- **DoD F1:** M1 parțial — typecheck ✔, 12/12 teste (D-003), deploy live ✔ (D-014). Grep `ProtagonistEnforcer|refineCourseContent|editorRefineButton|inferProtagonistFromAudience|getOrCreateStoryArc|story_arc` în src/+supabase/ → **2 rezultate, ambele acceptabile** (verificat 2026-08-17; formularea „→ 0" de dinainte era inexactă): ambele sunt în `supabase/migrations/20240128000001_add_story_arc_to_courses.sql`, migrația istorică ce a adăugat coloana `courses.story_arc`. Migrațiile deja rulate nu se rescriu — sunt istoric, nu cod viu. În `src/` și în `supabase/functions/` grep-ul dă efectiv 0. **Consecință de reținut:** coloana `courses.story_arc` probabil încă există în DB deși conceptul a fost șters din cod → intră în „migrația de curățare" din F10-T4. Rămâne smoke-ul live la owner.

### F2 — Fundația de localizare (2 zile) · Risc: mediu
- **F2-T1** [DONE 2026-09-05, scop re-evaluat] `LocalizedLabels` + fallback EN static, schema runtime, promptul `generate_localized_labels`, wrapper-ul client și persistarea la creare/duplicare — toate funcționale, verificate. **Decizie (sesiunea F3-pregătire, 2026-09-05):** conectarea acestui mecanism la „consumatorii activi" (șabloanele WORKBOOK_PROMPT/MANUAL_PROMPT/EXERCISES_PROMPT/VIDEO_SCRIPT_PROMPT) NU se mai face aici — acele 4 șabloane sunt exact ce înlocuiește F4-T2 cu noile prompturi din A.4, care oricum consumă `localizedLabels` determinist (P3). A cabla etichete acum în cod programat la ștergere ar fi efort aruncat. Infrastructura (partea reutilizabilă, cerută de A.4.1) rămâne DONE; conectarea la randare se mută natural în F3-T2/F4-T3. Mecanismul paralel `GoldenModuleData.localizedLabels` rămâne cod mort confirmat (D-011), neatins.
- **F2-T2** [DONE 2026-09-05] Sterilizarea șabloanelor cu headere/etichete hardcodate în română, indiferent de `{{language}}`. **Verificat 2026-08-08 că bug-ul e live**: `WORKBOOK_PROMPT`, `MANUAL_PROMPT`, `EXERCISES_PROMPT`, `VIDEO_SCRIPT_PROMPT` sunt toate atinse prin `handleGoldenStep` → `generateLessonContent`/generare per-modul (calea implicită, `contractPipeline: true`) — deci NU sunt cod mort. Corectat (2 commit-uri, 2026-08-08):
  - Cele 4 șabloane de mai sus: headere/etichete traduse din română + regulă explicită de traducere adăugată. `SLIDES_PROMPT` era deja curat.
  - `COST_ZERO_SLIDES_LABELS`/`generateCostZeroSlides`: fallback-ul alegea RO pentru orice limbă ≠ EN (deci și DE/FR/ES/IT din `src/languages.ts` — ~100 limbi în `ALL_LANGUAGES` — primeau etichete românești); corectat să cadă pe EN pentru orice ≠ RO. Adăugate și 2 bullet-uri hardcodate RO lipsă din dicționar.
  - `getDepthSpecs`: typo `STRUCTURĂ`→`STRUCTURE`.
  - `generateExamplesContent`, prompt-ul `discussion_guide`: headere hardcodate RO în prompturi altfel în engleză.
  - `buildFallbackModuleContext`, fallback-ul final din generarea obiectivelor, fallback-urile de eroare din `handleChatOnboarding` (analiză + blueprint), `generateWorkbookIntro`/`generateWorkbookOutro`: toate aveau text hardcodat RO în ramuri de fallback/eroare, folosit indiferent de `course.language`/`lang` — deși variabila de limbă era deja disponibilă în scope. Corectate cu ramificare pe limbă (RO explicit, altfel EN).
  - **Verificat și exclus din scope** (documentat, neatins): `GOLDEN_SAMPLES.structure_online`/`exercises_live` și întregul subsistem `GoldenModuleData`/`GOLDEN_MASTER_PROMPT`/`renderToMarkdown`/`renderWorkbookSection` etc. — cod mort confirmat, zero apelanți (`renderToMarkdown` nu e apelat de nicăieri; `prompts/golden-master.ts` nu e importat în `index.ts`) — vezi D-011. Mesajul de „credit_limit_exceeded" (linia ~2954) rămâne hardcodat RO — e nivel de aplicație/utilizator, nu conținut de curs, deci în afara scope-ului F2 (candidat pentru o localizare separată a UI-ului de eroare, nu a materialelor generate).
  - Nu s-a putut rula typecheck local (fără Node/npm, D-012) — verificare manuală, diff simetric, backtick-uri verificate pereche cu pereche. (Rulat ulterior: typecheck verde, vezi D-013.)
  - **Finalizat 2026-09-05**: audit exhaustiv (nu punctual) — grep după toate diacriticele românești (`ăâîșțĂÂÎȘȚ`) în tot `index.ts`, 99 de linii găsite, verificate una câte una. Toate se încadrează în categorii deja corecte: ramificare pe limbă existentă (`isRo ? [RO] : [EN]`), dicționare de detecție a contaminării lingvistice (au nevoie de semnătura RO ca să funcționeze), sau `GOLDEN_SAMPLES.structure_online`/liniile 391-402 și 549-559 — cod mort confirmat (D-011), neatins intenționat. **Zero bug-uri noi găsite.** Prompturile structure/blueprint (`architectPrompt`, promptul de „Structure & Agenda", sinteza de blueprint din import documente) — verificate explicit, curate (fără RO hardcodat, deja engleză + `${lang}` corect).
- **F2-T3** [DONE 2026-08-14] Validare de limbă uniformă: `skipAiValidation` eliminat complet (parametru șters din `callLLM`, `retryWithStrictInstructions` și toate cele 5 funcții generatoare — `generateWorkbookContent`, `generateManualContent`, `generateExercisesContent`, `generateVideoScriptContent`, `generateExamplesContent`); detectorul rulează acum pe orice output ≥400 chars (prag pe conținut raw, nu pe sample); `LANG_SIGNATURES` extins cu `it`, `pt`, `nl`, `pl`; adăugat `NON_LATIN_SCRIPTS` (regex Unicode) pentru 26 limbi cu scripturi non-latine (ar, he, ru, uk, bg, sr, zh, zh-TW, ja, ko, el, hi, bn, th, ka, am, km, lo, my, si, ta, te, kn, ml, gu, pa) — detecție fiabilă fără n-gram counting. Maximum 1 retry deja implementat (neschimbat). Typecheck verde.
- **F2-T4** [DONE 2026-08-14] Meta-instrucțiuni EN, conținut verbatim (regula A.1) — MANUAL_PROMPT: eliminat "Romanian" din CRITICAL RULES + eliminat "# Modul:" hardcodat din OUTPUT FORMAT
- **F2-T5** [DONE 2026-09-03] `src/tests/languagePurity.test.ts`; pe etalonul EN → 0 apariții headere RO și 0 diacritice; pe RO → 0 headere EN. Test focalizat 2/2 verde; typecheck verde.
- **DoD F2:** M2 — testul verde pe EN și RO; inspecție manuală fără amestec

### F3 — Instalarea arhitecturii de prompturi + contractul de modul (3 zile) · Risc: mare, izolat
- **F3-T1** [DONE 2026-09-10] `buildPrompt(layers)` + `buildTonePreamble` (A.1, A.3) instalate în `index.ts` (neconectate încă la randarea vie — le consumă F3-T2). Șterse din `CourseDNA`: arhetipurile Mentor/Coach/Buddy (era doar un comentariu-gardă în prompt, nu cod structurat), `narrativeUniverse`, `learningPhilosophy`, `masterTimeline`. `DNAEditModal` → 3 secțiuni (terminologie+expresii interzise / voce liberă `toneFreeText` / mediu, read-only). `buildDNABlocks()` păstrat pentru Golden Path (D-008), adaptat la schema nouă. Detalii complete în §REIA DE AICI (S13). Typecheck verde; vitest 14/15 (D-003 neatins).
- **F3-T2** [TODO] Cele 7 fișiere de prompt (A.4) + `PROMPT_CHANGELOG.md` cu intrarea „v1 instalată"
- **F3-T3** [TODO] Schema `ModuleContract` (server types + Zod client) — obiectiv/blocks/exerciseSpec/transitions
- **F3-T4** [TODO] `validateModuleContract()` determinist: ≥1 ACT+DEM+APP; sumă minute = durată (±5); APP ≥40% la bloomLevel≥APPLY; niciun bloc >25 min fără schimbare de fază; BREAK la module ≥90 min; verbi Bloom din dicționar per limbă. Eșec → 1 re-apel → apoi eroare
- **F3-T5** [TODO] Persistență: migrație `course_modules.contract jsonb` + `contract_version`; `is_dirty` invalidează; cache
- **F3-T6** [TODO] Orchestrator: parametru `modelTier` per tip de apel (default: tot Flash)
- **DoD F3:** M3 (prompts/ + preambul + changelog) și M4 (4 contracte valide pe etalon, **aprobate de owner — poarta umană 1**)

### F4 — Cele 5 livrabile ca randări (4 zile) · Risc: mare, controlat prin flag
- **F4-T1** [TODO] Feature flag `contractPipeline` (fluxul vechi intact până la F10; A/B + revenire instant)
- **F4-T2** [TODO] Granularitate: Manual 1 apel/modul (split >6 blocuri); Exercise Sheets 1 apel/exerciseSpec; Trainer Guide 1 apel/modul; Trainer Flow asamblare deterministă + 1 apel finisare; Slides în F7. Țintă etalon: ~25 apeluri
- **F4-T3** [TODO] Consistență prin cod (P3): renderer-ele construiesc headerele din contract+labels via `BLOCK_HEADER_TOKEN`; LLM scrie doar corpul; ID-urile exercițiilor se propagă programatic
- **F4-T4** [TODO] Validare deterministă post-generare (structură completă, puritate lingvistică per livrabil); re-apel doar pe unitatea eșuată
- **F4-T5** [TODO] DB: livrabilele pe cheile `course.livrables.*` existente; sub flag, livrabilele legacy dispar din `STEPS_ORDER`
- **F4-T6** [TODO] Logare consum: apeluri per generare, per tip (necesar pentru F6 și DoD ≤30)
- **F4-T7** [TODO] Generare completă A/B pe etalon (nou vs baseline F0), prezentată owner-ului
- **DoD F4:** M5 — 5 livrabile pe etalon RO+EN, validare deterministă verde, ≤30 apeluri, owner confirmă superioritatea vs baseline

### F5 — N/A (absorbit în F4; numerotarea păstrează bornele)
- Fără task-uri.

### F6 — CALIBRAREA (poarta de calitate; 2–5 zile, buget 10 iterații) · Risc: aici se decide produsul
- **F6-T1** [TODO] Punctează baseline-ul F0 și output-ul F4 pe rubrică (RO+EN). Claude pre-evaluează criteriile mecanice (3,5,7,9); owner-ul punctează 1,2,4,6,8,10
- **F6-T2** [TODO] Rulează bucla B.2: o modificare per iterație (un prompt SAU un parametru), regenerare doar pe unitățile afectate, log în PROMPT_CHANGELOG cu delta
- **F6-T3** [TODO] Dacă după 10 iterații pragul nu e atins → scara B.3, treaptă cu treaptă (decizie owner la treapta 2 „model Pro" și la treapta 5)
- **DoD F6:** M6 — prag atins pe RO și EN, changelog complet, **decizie scrisă a owner-ului „calitatea aprobată" — poarta umană 2**. Nicio fază ulterioară nu începe fără M6.

### F7 — Slide-urile (3 zile) · Risc: mediu
- **F7-T1** [TODO] Slide plan determinist din contract (în cod): mapare fază → layout
- **F7-T2** [TODO] 1 apel AI/modul cu `slides-copy.ts` → `SlideState[]` JSON validat Zod; se elimină formatul `<SLIDE_BEGIN>` pe drumul nou
- **F7-T3** [TODO] O singură taxonomie: `SlideState.layoutId` cap-coadă; șterse `SlideDesignJSON`, maparea arhetip→layout, euristicile pe cuvinte-cheie (păstrate DOAR pentru importul de documente externe)
- **F7-T4** [TODO] `analyze-slide` scos din export (funcția edge + apeluri + rotația fallback); opțional repurpose ca buton „Sugerează layout" în editor
- **F7-T5** [TODO] `VisualOrchestrator` = singurul editor de slide-uri; persistență `SlideState[]` în `course_steps.slides_state jsonb`
- **F7-T6** [TODO] Imagini alese la editare (Unsplash existent; `imagePrompt` pre-populează căutarea); exportul folosește strict `media.url`
- **F7-T7** [TODO] Reguli de calitate în renderer: max 4 bullets (auto-split), overlay de contrast generalizat, `pptxTextOnlySafeMode` păstrat
- **F7-T8** [TODO] Mini-calibrare: criteriul 10 punctat pe deck-ul etalonului; iterare pe `slides-copy.ts` dacă <4
- **DoD F7:** M7 — deck complet pe etalon; layout justificat; editare → PPTX reflectă exact; zero apeluri AI la export; notes consistente cu guide-ul; criteriul 10 ≥4

### F8 — Plafon 8 ore + landing (½ zi) · Risc: zero · Rulabilă oricând după F0
- **F8-T1** [TODO] UI: durata în `NewCourseModal`/`OnboardingChat` → listă închisă (1h, 2h, 3h, 4h, 6h, 8h); mesaj i18n
- **F8-T2** [TODO] Server: `durationMinutes > 480` → 422 cu mesaj clar; clamp defensiv în promptul de blueprint și de contract
- **F8-T3** [TODO] Landing (`HomePage.tsx` + toate localele): Duration → „up to a full training day (8h)"; `grep -ri semester src/` → 0
- **DoD F8:** M8 — imposibil de creat curs >8h din UI și prin apel direct; landing actualizat EN+RO

### F9 — Design modern al materialelor (2 zile) · Risc: mic
- **F9-T1** [TODO] `src/lib/design/tokens.ts`: 2–3 teme („Paper & Gold", „Boardroom", „Clean Light"); paletă, pereche tipografică, scară, spațieri; sursă unică pentru culori/fonturi
- **F9-T2** [TODO] Consumatori: preview HTML editor (CSS vars din tokens), `templates.ts` (PPTX), `exportService`/`pdfExporter` (DOCX/PDF)
- **F9-T3** [TODO] Șabloane document: copertă, header/footer cu paginare + modul, cuprins din contract; componente (casetă Exercițiu, casetă Notă facilitator, spații de lucru reale, timeline vizual)
- **F9-T4** [TODO] Diferențiere per livrabil: Guide (coloană timing absolut), Manual (reflecții integrate), Exercise Sheets (o foaie/exercițiu, debrief verso)
- **F9-T5** [TODO] Test explicit diacritice RO în PDF (jspdf) + un export EN
- **DoD F9:** M9 — export DOCX+PDF+PPTX pe toate livrabilele etalonului; verificare vizuală owner; diacritice corecte

### F10 — Curățenie finală, tăierea legacy (2 zile) · Risc: mediu
- **F10-T1** [TODO] `contractPipeline` devine implicit + șterse: pași legacy din `STEPS_ORDER` (rămân 5 + blueprint), `handleLegacyStep` + ~15 prompturi globale moarte, `generateCostZeroSlides`, `GOLDEN_SAMPLES`/`golden-master`/`golden-parser` (dacă fără apelanți), dublura FacilitatorNotes/FacilitatorManual, `generate_workbook_part`/`generate_slides_part`, `TrainerStepType`-uri nefolosite
- **F10-T2** [TODO] Spargerea `index.ts` (5.400 linii) fără schimbare de comportament: `index.ts` (routing) · `orchestrator.ts` · `contract.ts` · `renderers/` · `validation.ts` · `localization.ts` · `prompts/`
- **F10-T3** [TODO] Erori reale: elimină masca „200 cu error"; statusuri corecte; clientul afișează `error.message`
- **F10-T4** [TODO] Igienă: `STRIPE_PUBLISHABLE_KEY` → env; scoate `moonshot-v1-8k` din fallback; migrație de curățare; șterge `RlsTestPage`, `header.txt`, teste orfane; `README.md` nou
- **F10-T5** [TODO] `e2e_generation.test.ts` rescris: etalon RO+EN; aserțiuni = validările F4-T4 + puritatea F2-T5 + apeluri ≤30
- **DoD F10:** M10 — teste verzi; `index.ts` <300 linii; grep simboluri legacy → 0; generare etalon reușită în producție; toate bornele DONE

---

## Smoke F1 (instrucțiuni owner pentru F1-T4)

Ștergerile F1 ating edge function-ul `generate-course-content`, deci contau doar după un deploy reușit.

1. ~~**Deploy edge function.**~~ **FĂCUT — 2026-08-15 10:56 UTC** (vezi D-014). CI-ul a fost reparat și
   run-ul #26 a deployat `generate-course-content` de pe commit-ul `9765afd`. Între `9765afd` și HEAD-ul
   lui `main` nu s-a mai schimbat niciun fișier sub `supabase/functions/`, deci **live rulează exact
   codul de pe `main`**: fără ProtagonistEnforcer, fără protagonist global, cu F2-T2/T3/T4 incluse.
   Nu mai e nevoie de deploy manual. Începe direct de la pasul 2.
2. **Loghează-te în UI, creează cursul-etalon** cu parametrii din `src/tests/fixtures/etalonCourse.ts` (RO). Notă (2026-09-10, actualizată după F3-T1): DNA-ul nu mai are preset Mentor/Coach/Buddy — completează câmpul liber de voce din `DNAEditModal` cu `toneFreeText` din fixture, dacă vrei tonul exact etalon.
3. **Generează complet.** Toate step-urile din STEPS_ORDER (17).
4. **Verifică rapid:**
   - **Personaje distincte per exercițiu.** Fiecare exercițiu ar trebui să conțină nume distincte (Maria, Andrei, Elena…), NU aceeași persoană peste tot. Deschide 2-3 exerciții și verifică.
   - **Zero cuvinte sparte.** Caută în output-ul brut al oricărui pas expresii de tip `pozițAlexând`, `ionAlex`, `mariAlexj`. Concret: caută pattern-ul `[a-zăîâșț]Alex` — 0 apariții.
   - **Zero „Alex" repetat 3+ ori pe același material** decât dacă utilizatorul l-a definit explicit ca protagonist în DNA.
5. **Dacă smoke-ul trece:** îmi zici „F1 smoke OK", marchez M1 DONE, pornim F2 în sesiunea următoare.
6. **Dacă apare regresie:** îmi zici ce vezi (paste cu output-ul problematic); rollback la commit-ul `pre-refactor-2026-07` e trivial (`git revert 85b548b bbab569 ecac06b` sau, extrem, `git reset pre-refactor-2026-07`).

Notă (istorică, rezolvată): CI-ul `Deploy Supabase Functions` eșua consecvent din 19 iunie până pe 11 august, ceea ce a ținut aceste ștergeri nedeployate ~4 săptămâni. Reparat de owner pe 15 august — detalii și dovezi în D-014.

---

## Descoperiri

Notează aici orice descoperire sau nelămurire care apare în timpul execuției, cu propunere. Owner-ul decide.

### D-014 — CI-ul de deploy s-a reparat pe 15 aug; edge function-ul E live cu codul de pe `main`
**Context.** Toate notele anterioare din acest fișier și din `CLAUDE.md § Convenții de lucru → CI`
presupun că workflow-ul `Deploy Supabase Functions` e roșu („eșuează consecutiv din 6 iulie, cauza
rădăcină e la owner — secrete Supabase") și că, prin urmare, aplicația live rulează încă versiunea
veche a edge function-ului. **Presupunerea nu mai e adevărată.** Verificat pe 2026-08-17 prin API-ul
GitHub Actions, pe toate cele 26 de run-uri ale workflow-ului:

- Run-urile **#1 → #24** (19 iunie → 11 august) — toate `failure`, attempt 1. Confirmă seria lungă de eșecuri.
- Run **#25** (`65ff9ce`) — `success`, dar la **attempt 3**, pornit pe **15 august**.
- Run **#26** (`9765afd`, merge PR #24 = F2-T3 + F2-T4) — `success` la **attempt 5**, pornit
  **15 august 10:55 UTC**, terminat 10:56. Step-ul „Deploy Edge Functions" a rulat efectiv 18 secunde
  și a ieșit `success` — nu a fost sărit.

Interpretare: owner-ul a reparat secretele (`SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_ID`) pe 15
august și a re-rulat manual ultimele două run-uri eșuate. Nu există nicio urmă a acestei reparații în
repo — de aceea a fost invizibilă până acum.

**Consecința importantă.** `git diff 9765afd..52feda2` (HEAD-ul lui `main`) atinge **un singur fișier,
`IMPLEMENTATION_STATUS.md`** — zero fișiere sub `supabase/functions/`. Deci funcția deployată e
**identică** cu codul de pe `main`: fără `ProtagonistEnforcer`, fără protagonist global (F1-T1…T3), cu
sterilizarea de limbă F2-T2, cu validarea uniformă F2-T3 și meta-instrucțiunile EN din F2-T4. Cele trei
funcții (`generate-course-content`, `analyze-slide`, `unsplash-search`) se deployează toate în același job.

**Impact pe borne.** Pasul 1 din §Smoke F1 („Deploy edge function") e îndeplinit; F1-T4 nu mai e blocat
de infrastructură, ci doar de rularea manuală a smoke-ului de către owner. M1 rămâne ALMOST până la
confirmarea scrisă „F1 smoke OK" — **nu se bifează pe baza deploy-ului**, pentru că DoD-ul F1 cere
verificarea comportamentală (personaje distincte per exercițiu, zero cuvinte sparte de tip `[a-zăîâșț]Alex`),
nu doar prezența codului pe server.

**Efect secundar de reținut.** Ștergerile F1 au stat nedeployate ~4 săptămâni (18 iulie → 15 august) fără
ca cineva să observe, pentru că nimic nu semnala starea CI-ului în fluxul de lucru. Recomandare pentru
owner: la fiecare sesiune care atinge `supabase/functions/**`, se verifică explicit concluzia ultimului
run înainte de a declara task-ul închis. Nu propun automatizare acum — e în afara scope-ului F2.

### D-001 — Poziția tag-ului `pre-refactor-2026-07` și branch-ul `phase-0-safety`
**Context.** Planul cere „tag pe main". Ramura `main` de la origin e semnificativ în urma branch-ului de lucru `claude/courscopilot-refactor-major-e45nfa` — audit-ul (`docs/AUDIT-CourseCopilot-2026-07-18.md`), planul v2.0 (`docs/CURATENIE-SI-MODERNIZARE-CourseCopilot.md`) și toată recuperarea de landing/design tokens au intrat doar pe branch-ul de lucru. Pe `main` nu există punct de referință valid pentru refactor: baza actuală de cod (cu audit + plan) e HEAD-ul branch-ului de lucru.

**Decizie luată.** Tag-ul `pre-refactor-2026-07` s-a pus pe `HEAD` (branch-ul de lucru `claude/courscopilot-refactor-major-e45nfa`), nu pe `main`. Motiv: acest commit este „starea imediat înaintea refactor-ului" — punctul la care s-ar reveni dacă refactor-ul se anulează. Branch-ul `phase-0-safety` a fost creat local ca pointer la același commit; el va avansa în paralel cu munca pe branch-ul de lucru.

**Tensiune cu instrucțiunile CI/harness.** Sistemul cere „DEVELOP all your changes on the designated branch (`claude/courscopilot-refactor-major-e45nfa`)". Planul cere „o fază per branch (phase-0-safety …)". Pentru a satisface ambele: comm-iturile merg pe branch-ul designat (satisface CI), iar `phase-X-Y` sunt branch-uri-etichetă avansate în paralel la finalul fiecărei faze (satisface planul, oferă puncte de revenire per fază). Owner-ul poate suprascrie: dacă preferă strict câte un PR/branch dedicat per fază (`phase-0-safety` push independent), spune-mi și adaptez.

### D-007 — Bug-uri UI descoperite în timpul smoke-ului F1-T4 (reparate, în afara planului, cu aprobare owner)
**Context.** În timp ce owner-ul rula smoke-ul F1-T4, a semnalat două simptome pe onboarding: (a) enum brut `OnlineCourse`/`LiveWorkshop` afișat netradus în salutul de chat, (b) chat-ul pare să reîntrebe obiectivele de învățare deși tocmai fuseseră completate. Niciunul nu ține de ProtagonistEnforcer/protagonist global (scope-ul F1) — dar owner-ul a cerut reparare imediată, aprobată explicit.

**(a) Enum brut în salut (`OnboardingChat.tsx`).** `t('chat.onboarding.greet*', { env: course.environment, ... })` injecta valoarea brută a enum-ului (`'OnlineCourse'`) direct în placeholder-ul `{env}`, în loc de eticheta localizată. Fix: mapare prin cheile deja existente `modal.newCourse.environment.onlinecourse` / `.liveworkshop` înainte de injectare, cu fallback pe valoarea brută dacă cheia lipsește.

**(b) Chat „fantomă" — cauză reală: cursă de randare, nu istoric înghețat.** Investigație confirmă: NU e vorba de `ai_refinement_history` persistat dintr-o sesiune anterioară (owner-ul a confirmat: curs nou, prima deschidere). Cauza reală: `CourseWorkspacePage.tsx` decide ecranul de onboarding (`showLOGenerator`/`showBlueprintReview`) printr-un `useEffect` separat, dependent de `[course]`, care rulează DUPĂ commit. Când `course` se încarcă prima dată (curs nou, fără `learning_objectives`), există un randare intermediar în care `course` e deja setat dar `showLOGenerator` încă are valoarea implicită `false` (efectul de rutare nu a apucat să ruleze) — condiția `!course.blueprint` e adevărată, deci se montează `OnboardingChat` ÎNAINTE ca obiectivele să existe. Acel mount scrie imediat salutul „fără obiective" în `course.ai_refinement_history` (efect de bord, fire-and-forget către Supabase). Randarea următoare corectează vizual ecranul (arată `LearningObjectivesGenerator`, ca și cum fluxul ar fi corect), dar scrierea în DB deja s-a produs. Când utilizatorul ajunge ulterior, normal, la chat, istoricul e deja populat cu acel salut fantomă și nu se regenerează.

**Fix:** flag nou `routedCourseId`, setat la finalul efectului de rutare cu `course.id`-ul pentru care s-a calculat decizia. Randarea de onboarding (inclusiv spinner-ul de încărcare) verifică `routedCourseId !== course.id` — dacă rutarea nu s-a calculat încă pentru cursul curent, rămâne pe spinner. Elimină clipa de randare cu valori implicite stale, deci elimină mount-ul prematur al `OnboardingChat`.

**Fișiere:** `src/components/OnboardingChat.tsx`, `src/pages/CourseWorkspacePage.tsx`. Typecheck verde; teste 12/12 (D-003 neschimbat). Nu a fost reprodus live (fără acces la Supabase din mediul remote) — owner-ul re-testează cu smoke-ul F1-T4.

**Urmare — protocol de triaj permanent.** Discuție cu owner-ul: riscul ca „descoperiri" repetate să bulverseze planul de 11 faze. Decizie: planul rămâne coloana vertebrală; orice descoperire trece printr-un test unic (blochează DoD-ul fazei curente? DA → reparat imediat sub plafon strict + aprobare owner, ca mai sus; NU → doar logat aici, cu recomandare de fază). Revizuirea planului se face DOAR la M4 și M6. Fiecare fază capătă un smoke minimal, nu doar typecheck+test. Protocolul complet e scris permanent în `CLAUDE.md § Reguli owner → 5. Protocolul de triaj pentru descoperiri` — citit automat la fiecare sesiune viitoare.

### D-008 — F1-T5 (branch-ul de refactor) NU a fost adus pe `main`; DNA rămâne, simplificarea se mută la F3-T1
**Context.** Pe branch-ul `claude/courscopilot-refactor-major-e45nfa`, commit-ul `5ba03c2` ("F1-T5: fix agenda_table crash + eliminate CourseDNA feature", 2026-07-19) șterge integral conceptul CourseDNA: `DNAEditModal.tsx` (619 linii), pasul `course_dna` din edge function, integrarea din `CourseWorkspacePage`/`BlueprintReview`, cheile de locale `dna.*`. Acest commit nu a fost niciodată mers pe `main` (PR #20 s-a oprit la F1-T3) și **nu apare deloc în acest fișier** — spre deosebire de `D-007` (fix-ul din aceeași zi), care documentează explicit aprobarea owner-ului, `5ba03c2` nu are nicio urmă de aprobare, deși protocolul de triaj (§D-007, codificat cu ~17 minute înainte în `CLAUDE.md`) o cere pentru orice reparație în afara scope-ului fazei curente.

**Verificare 2026-08-07.** S-a verificat în cod dacă CourseDNA e cod mort: NU e. `buildDNABlocks()` (edge function) alimentează terminologie, voice/tone, learning philosophy și domain context în >10 puncte din prompt-urile de generare pentru aproape toate livrabilele; pasul `course_dna` rulează mereu primul, atât în `LEGACY_STEPS_ORDER` cât și în `CONTRACT_STEPS_ORDER`. Nu blochează generarea dacă lipsește (`hasMinimalCourseDNA` doar loghează un warning). În plus, `main` a continuat să investească activ în DNA **după** data lui F1-T5: `b51ba87` (31 iul) rescrie `buildDNABlocks`/voice profile, `79fd1dc` (1 aug) modifică `DNAEditModal.tsx` — exact fișierul pe care F1-T5 îl șterge complet.

**Decizie (owner, 2026-08-07).** Nu se aduce F1-T5 pe `main`. CourseDNA rămâne ca funcționalitate. Planul formal însuși (F3-T1) prevede deja ce owner-ul de fapt vrea: *simplificare*, nu eliminare — „Șterge arhetipurile Mentor/Coach/Buddy, `narrativeUniverse`, `learningPhilosophy`, `masterTimeline`. `DNAEditModal` → 3 câmpuri." Senzația că „DNA încurcă" vine din supra-complexitatea actuală (arhetipuri, narrative universe, master timeline), nu din conceptul în sine. F1-T5 rămâne un artefact orfan pe branch-ul de refactor — nu se șterge branch-ul (păstrează istoricul), dar nu se mai integrează ca atare.

**Închidere (2026-09-10, S13).** F3-T1 a executat exact simplificarea prevăzută mai sus. `buildDNABlocks()` a fost păstrat (nu șters) și doar adaptat la schema nouă — Golden Path-ul rămâne intact structural, exact cum cerea acest discovery.

### D-009 — Fir de lucru ad-hoc pe `main` (31 iul – 7 aug), în afara fazelor F2–F4 documentate
**Context.** Între ultima actualizare a acestui fișier (F1-T4 BLOCKED, 18 iul) și azi, `main` a primit 10 commit-uri care nu trec prin protocolul de triaj și nu sunt reflectate în tabelul de borne M0–M10, deși unele se suprapun conceptual cu F3/F4:
- `b51ba87` (31 iul) — introduce flag `contractPipeline` (inițial `false`) + rutare parțială "Golden per-module generation" pentru manual. **Nu** e schema `ModuleContract` din F3-T3 (verificat prin grep — nu există în repo); e o implementare paralelă, informală, mult mai restrânsă decât F3/F4.
- `79fd1dc`, `21ad1f1` (1 aug) — extinde flag-ul în `DNAEditModal`; adaugă `agenda_table`, `discussion_guide`, `action_plan`, `diagnostic_questionnaire` în `GLOBAL_STEPS`.
- `c98a59b` (1 aug) — **activează `contractPipeline: true`** (implicit ON de atunci).
- `12bad7a` (5 aug) — hardening erori upsert/insert `course_steps`.
- `f3cb0f0`, `c519463`, `a5e7e0e` (7 aug, azi) — funcție nouă de **salvare draft + reluare server-side a generării** în `GenerationProgressModal.tsx`. `a5e7e0e` adaugă și descoperirea „fără Node/npm local", scrisă atunci ca §D-005 și renumerotată ulterior la **D-012** (vezi nota de renumerotare de acolo).

**Decizie (owner, 2026-08-07).** Se documentează aici ca reper istoric; nu se modifică cod în cadrul reconcilierii de azi. Acest fir rămâne de reconciliat explicit cu planul quando se ajunge la F3/F4 — la momentul respectiv trebuie decis dacă flag-ul `contractPipeline` existent se înlocuiește cu arhitectura `ModuleContract` din plan sau se construiește pe el. Până atunci, `contractPipeline: true` e activ în producție și afectează comportamentul real al aplicației, deși F4 (unde ar trebui introdus formal) e încă `TODO`.

### D-011 — Rutare Golden vs Legacy pentru F2: `handleGoldenStep` e calea vie, nu `EXERCISES_PROMPT`/`WORKBOOK_PROMPT` direct
**Context.** Înainte de a atinge cod pentru F2-T2, s-a verificat dacă `EXERCISES_PROMPT`/`WORKBOOK_PROMPT`/`MANUAL_PROMPT`/`VIDEO_SCRIPT_PROMPT` (cu headerele hardcodate în română) mai sunt pe calea vie, sau au fost înlocuite de sistemul `GoldenModuleData`/`GOLDEN_MASTER_PROMPT` (care are propriul mecanism de `localizedLabels` generat de AI). Verificare: `handleGoldenStep` (calea implicită pentru module/lecții sub `contractPipeline: true`) apelează `generateLessonContent` per lecție (dacă `course_lessons` există) sau direct `generateWorkbookContent`/`generateExercisesContent`/`generateManualContent`/`generateVideoScriptContent` la nivel de modul — **ambele ramuri folosesc șabloanele vechi cu headere RO hardcodate**, nu `GOLDEN_MASTER_PROMPT`. Schema `GoldenModuleData`/prompt-ul „God Prompt" pare pregătită dar nefolosită efectiv de `handleGoldenStep` la data verificării (renderWorkbookSection/renderManualSection care consumă `data.localizedLabels` nu au fost găsite ca fiind apelate din `handleGoldenStep` — posibil cod dintr-o iterație anterioară a arhitecturii Golden, netras din uz).
**Concluzie.** Bug-ul de limbă din F2-T2 e real și afectează cursuri active. Corectat 2026-08-08.

**Update 2026-08-08 (a doua sesiune F2-T2).** Confirmat definitiv: `renderToMarkdown` (linia ~1997, punctul de intrare care ar apela `renderWorkbookSection`/`renderManualSection`/etc.) **nu are niciun apelant în `index.ts`** (grep pentru `renderToMarkdown(` → 0 rezultate). `supabase/functions/generate-course-content/prompts/golden-master.ts` (unde e `GOLDEN_MASTER_PROMPT`) **nu e importat nicăieri în `index.ts`**. Deci întregul subsistem `GoldenModuleData`/`GOLDEN_MASTER_PROMPT`/`renderToMarkdown`/`renderWorkbookSection`/`renderManualSection`/`renderExerciseSheet`/`renderVideoScript` (~270 linii doar în `index.ts`, plus `prompts/golden-master.ts` + `utils/golden-parser.ts` + `types.ts` întregi) e **cod mort confirmat, nu doar suspectat**. La fel, în `GOLDEN_SAMPLES` (linia ~278), doar cheile `workbook_online`/`workbook_live` sunt citite undeva (de `generateWorkbookContent` prin `{{goldenSamples}}`); restul (`objectives`, `structure_online`, `slides_live`, `slides_online`, `quiz`, `video_script_online`, `exercises_live`, `exercises_online`, `case_study`) nu au niciun apelant găsit — inclusiv exemplele cu headere hardcodate RO de la liniile 391-402/549-559, care din acest motiv NU au fost corectate (nu sunt pe calea vie). **Recomandare pentru F10-T1**: candidat clar de șters, cu grep-urile de mai sus ca dovadă.

### D-004 — Tag-ul `pre-refactor-2026-07` respins la push (403)
**Context.** Owner-ul a confirmat push-ul tag-ului de siguranță. `git push origin pre-refactor-2026-07` a returnat `403` de la remote-ul de sesiune. Cauza probabilă: GitHub App-ul folosit de sesiune nu are scope-ul pentru crearea de tag-uri, sau există tag protection rule pe repo.
**Decizie.** Tag-ul rămâne local (`git tag pre-refactor-2026-07` la commit `6b5bc9a`, HEAD-ul branch-ului de lucru la momentul refactor-ului). Ancora e păstrată — orice clonă cu istoricul actual îl poate reconstitui pentru că e la HEAD-ul unui commit deja push-uit.
**Acțiune propusă pentru owner.** Rulează local pe mașina proprie (o singură comandă): `git fetch origin && git tag pre-refactor-2026-07 6b5bc9a && git push origin pre-refactor-2026-07`. Astfel ancora ajunge și pe origin. Alternativ, creează tag-ul manual din GitHub UI („Releases → Tags → Create tag") pe commit-ul `6b5bc9a`.

### D-003 — Testul `src/tests/e2e_generation.test.ts` e rupt la baseline
**Context.** La rularea `npm test` (F0-T4 DoD), testul eșuează cu:
`Failed to load url ../../supabase/functions/generate-course-content/index_bundled`.
Reprodus și pe HEAD-ul curat (înainte de modificările F0), deci defectul e pre-existent, nu introdus de refactor. Fișierul `index_bundled.ts` nu există în repo.
**Decizie.** Nu se atinge acum. Planul îl trece explicit la F10-T5 („e2e_generation.test.ts rescris") — se ignoră până acolo. `npm test` fără acest fișier: 4 test files, 12 tests, toate verzi. DoD F0 („typecheck verde") e îndeplinit; „test verde" se aplică la testele necorupte + orice test adăugat de refactor.
**Riscul asumat.** Dacă în F1–F9 acest test se strică suplimentar, nu vom observa. Fazele F1–F2 adaugă teste noi (F2-T5, F1-T4 smoke) care oferă acoperire alternativă.

### D-002 — Baseline F0-T3 depinde de acces la Supabase + chei LLM
**Context.** Instrucțiunea utilizatorului spune explicit: dacă mediul nu poate rula generarea, marchez F0-T3 ca BLOCKED cu instrucțiuni pas-cu-pas, fără să simulez output-uri.
**Stare.** Mediul remote nu are chei API și nici acces la instanța Supabase de producție. F0-T3 va fi marcat BLOCKED cu instrucțiuni în `docs/baseline/README.md` (creat la F0-T2).

---

## Jurnal de sesiune

| Data | Sesiune | Task-uri atinse | Note |
|---|---|---|---|
| 2026-07-18 | S01 | F0-T1 DONE · F0-T2 DONE · F0-T3 BLOCKED · F0-T4 DONE | Plasa de siguranță instalată. Baseline așteaptă owner-ul (docs/baseline/README.md). M0 rămâne parțial până la F0-T3; F1 NU pornește în această sesiune. |
| 2026-07-18 | S02 | F0-T3 SKIPPED (owner decision) · M0 DONE · F1 pornit | CLAUDE.md adăugat (regula: owner deploy SQL). Baseline abandonat cu motiv (rubrică absolută + UI fără câmp ton verbatim). F1 începe în această sesiune. |
| 2026-07-18 | S02 | F1-T1 · F1-T2 · F1-T3 DONE · F1-T4 BLOCKED(owner smoke live) | Editor Generate/Refine + ProtagonistEnforcer + fixes/ + protagonist global toate șterse (commits ecac06b, bbab569, 85b548b). ~1.000 linii cod mort eliminate. Placeholder-ele `{{protagonist*}}`/`{{storyStage}}` sterilizate din toate prompturile. Regula P4 (personaje locale) intră în EXERCISES_PROMPT. Typecheck verde; teste 12/12 (D-003 pre-existent). Așteaptă deploy edge function + smoke owner. |
| 2026-08-07 | S03 | Reconciliere `main` ↔ branch de refactor | Cherry-pick `7b6f8c3` (fix onboarding: label mediu localizat + cursă de randare) și `81add01` (protocol D-007 în CLAUDE.md) pe `main`. F1-T5 (elimină CourseDNA) NU adus — verificat că DNA nu e mort, decizie owner: rămâne, simplificare mutată la F3-T1 (§D-008). Documentat firul ad-hoc `contractPipeline`/draft-resume din 31 iul–7 aug, nereflectat până acum în borne (§D-009). F1-T4 rămâne BLOCKED — nicio confirmare de smoke test primită încă. F2 nu a început. |
| 2026-08-08 | S04 | F2-T2 IN_PROGRESS | Pornit F2 (următorul pas logic după reconciliere). Verificat rutare Golden/Legacy (§D-011): `EXERCISES_PROMPT`/`WORKBOOK_PROMPT`/`MANUAL_PROMPT`/`VIDEO_SCRIPT_PROMPT` sunt calea vie sub `contractPipeline: true`, nu cod mort. Corectat headerele/etichetele hardcodate în română din toate cele 4 (Manual era cel mai afectat); `SLIDES_PROMPT` era deja curat. Adăugată regulă explicită de traducere a etichetelor la fiecare prompt. Nu s-a putut rula typecheck local (fără Node/npm, D-012) — verificare făcută prin citire atentă + diff linie-cu-linie (55 inserții/55 ștergeri, fără backtick-uri noi, fără drift de linii). |
| 2026-08-08 | S04 (continuare) | F2-T2 tot IN_PROGRESS | Scanare exhaustivă a fișierului pentru text hardcodat RO rămas. Corectat: `COST_ZERO_SLIDES_LABELS` (fallback greșit → RO pentru orice non-EN, inclusiv DE/FR/ES/IT; acum RO doar pentru RO), typo `STRUCTURĂ` în `getDepthSpecs`, headere hardcodate în `generateExamplesContent` și prompt-ul `discussion_guide`, și 5 fallback-uri de eroare/parsare (`buildFallbackModuleContext`, obiective, `handleChatOnboarding` ×2, workbook intro/outro) care ignorau `lang`/`course.language` deja disponibil în scope. Confirmat definitiv cod mort (§D-011 update): `renderToMarkdown` are 0 apelanți, `golden-master.ts` neimportat — subsistemul `GoldenModuleData` întreg + majoritatea `GOLDEN_SAMPLES` sunt candidați F10, nu bug-uri F2 active. Exclus intenționat din scope: mesajul `credit_limit_exceeded` (nivel aplicație, nu conținut curs). Rămas: inventarul complet F2-T1, F2-T3 (validare de limbă uniformă), F2-T4, F2-T5 (test puritate lingvistică). |
| 2026-08-10–11 | S05 (ad-hoc, fără faze) | Fix-uri audit + features | 9 commit-uri nedocumentate (PRs #21-23 + fix-uri directe): per-modul iterare client-side (Exercises/Examples/Manual), token usage logging, fix resolveModuleId, i18n landing, UsageSection UI, TS fix, SUPABASE_SECRET_KEYS fallback, ACTION_OPERATION_COSTS corectat. Niciuna din F2–F10 formal. Typecheck verde la finalul sesiunii. |
| 2026-08-17 | S07 | Audit de status pe `main` (fără cod de producție atins) | Sincronizat folderul local cu `main` (era deja identic; `main` local adus la zi `b84715f`→`52feda2`, ref stale `origin/claude/sync-local-folder-main-gtsn0h` curățat). Verificat statusul punct cu punct față de cod: F2-T3/T4 confirmate în cod, F2-T5 confirmat inexistent, fix-urile D-013 confirmate prezente, typecheck verde, `npx vitest run` 12/13 (D-003 singurul eșec). **Descoperit D-014: CI-ul e verde din 15 aug și edge function-ul e deployat live cu codul de pe `main`** — invalidează notele „CI roșu / live rulează versiunea veche" din tot fișierul. Corectate 7 discrepanțe de documentație: §B bifat (contrazicea §REIA), premisa „fără Node/npm" din §Verificări restante, secțiunea F2-T5 duplicată, referințele moarte la D-005 (→ D-012 / D-014), afirmația „grep → 0" din DoD F1 (real: 2 hit-uri într-o migrație istorică), capcana `npm test` = watch mode. **F1-T4 rămâne BLOCKED** — smoke-ul cere login în UI-ul live și consumă credite AI pe producție, deci îl rulează owner-ul; M1 nebifat intenționat. |
| 2026-08-14 | S06 | F2-T3 DONE · F2-T4 DONE · status actualizat | Pornit cu typecheck+test verde (Node 22 disponibil în mediu remote — nu mai e limitarea D-012). Documentate commit-urile S05 nedocumentate. F2-T3 implementat: `skipAiValidation` eliminat din toate call-site-urile (15 ocurențe), prag 400 chars pe conținut raw, `LANG_SIGNATURES` extins (+it/pt/nl/pl), `NON_LATIN_SCRIPTS` adăugat (26 limbi cu scripturi non-latine via regex Unicode). F2-T4: inventar complet prompturi — singurele probleme în MANUAL_PROMPT: "English/Romanian" → "English" + "# Modul:" hardcodat eliminat. Typecheck verde per commit. |
| 2026-09-10 | S13 | F3-T1 DONE | `buildPrompt`/`buildTonePreamble` instalate (A.1/A.3), neconectate încă la randare. `CourseDNA` simplificat: șters `narrativeUniverse`/`learningPhilosophy`/`masterTimeline`/`voiceProfile`, adăugat `toneFreeText` + `terminology.forbiddenPhrases` (nume aliniate la fixture-ul F0-T4 existent). `DNAEditModal.tsx` rescris la 3 secțiuni. `buildDNABlocks()` adaptat surgical (D-008), Golden Path neatins structural. Toate punctele de citire legacy (`course_dna`, `course_macro_structure`, `agenda_table`, `facilitator_manual`, `discussion_guide`, `hasMinimalCourseDNA`) migrate la schema nouă. Locale (en/ro/es/fr/it/de) actualizate. Typecheck verde, vitest 14/15 (D-003 neatins). Commit+push direct pe `main` (regulă owner 2026-09-04). |

### D-012 — Local terminal lacks Node/npm; cannot execute local repro here
**Notă de renumerotare (2026-08-08, corectată 2026-08-17).** Acest discovery a fost scris inițial cu ID-ul `D-005`, care era deja folosit informal pentru „CI-ul de deploy Supabase eșuează" — cel referit din `CLAUDE.md § Convenții de lucru → CI`. Renumerotat aici la `D-012`. **Corecție S07:** o intrare `### D-005` nu a existat niciodată în acest fișier (ID-urile prezente sunt D-001…D-004, D-007…D-009, D-011…D-014; lipsesc D-005, D-006, D-010), deci trimiterea de mai sus la „`D-005` mai jos" era o referință moartă. Toate referințele la „D-005 = lipsă Node" au fost înlocuite cu D-012, iar cele la „D-005 = CI roșu" cu **D-014**, care documentează subiectul cap-coadă, inclusiv rezolvarea. ID-urile sărite rămân sărite — nu se reciclează.

**Stare 2026-08-17:** depășit pentru mediul remote (Node 22 + npm 10.9.7 disponibile; typecheck și teste rulate direct din sesiune). Rămâne valabil ca istoric pentru IDE-ul local de atunci.

**Context.** The current terminal environment does not expose `node`, `npm`, `npx`, `yarn`, or `pnpm`, so this session cannot run the local JavaScript repro or execute `npm run typecheck` from the workspace.

**Discovery.** The implementation changes in `src/components/GenerationProgressModal.tsx` rely on a working local Node toolchain for full verification. This session can inspect and patch code, but not execute the application locally.

**Recommendation.** Owner or developer should run the following from a local machine with Node 18+ installed:

1. `cd CourseCopilot`
2. `npm install` (or `pnpm install` / `yarn install`)
3. `npm run typecheck`
4. `npm test`
5. Launch the app and reproduce the generation flow:
   - generate content for a course with blueprint/DNA
   - close and reopen the generation modal to verify resume
   - confirm final save persists `course_steps` rows and clears draft state
6. If Supabase is available, inspect `course_steps` rows for draft entries with `is_completed = false` and final `status = generat`.

**Status impact.** This is a local-environment blocker for direct repro in this session, not a code-completion blocker. The implementation and database-safe fallback work were still completed in code inspection.

### D-013 — Prima rulare locală (Pas 1, 2026-08-08): 2 defecte reale găsite și reparate, sub aprobare owner
**Context.** Runbook-ul „REIA DE AICI" (scris în sesiunea anterioară, vezi D-012) a cerut explicit ca prima sesiune cu Node/npm să ruleze `npm run typecheck && npm test` înainte de orice altceva pe F2. Rulat azi pentru prima dată — a confirmat exact avertismentul din §A: codul din 7-8 aug nu fusese verificat de compilator.

**Defect 1 — typecheck roșu, 12 erori TS7034/TS7005.** `src/components/GenerationProgressModal.tsx`, în ambele funcții de sincronizare (`handleFinalize`/logica de salvare finală și `handleSaveDraft`), liniile ~1486-1487 și ~1599-1600: `const toUpdate = []; const toInsert = [];` fără tip → TypeScript nu poate infera `any[]` în ramurile ulterioare unde sunt populate/citite (upsert/insert Supabase). Cauzează DoD-ul F2 (typecheck verde per commit, `CLAUDE.md § 3`). **Fix** (plafon respectat: 1 fișier, adnotare de tip, zero schimbare de logică): `const toUpdate: any[] = []` / `const toInsert: any[] = []` în ambele locuri, consistent cu restul fișierului care folosește deja `as any` pe scară largă în aceeași funcție.

**Defect 2 — test roșu, nou, neconsemnat până acum.** `src/__tests__/chatLocalizer.test.ts` → `detectChatLanguage(undefined, undefined)` aștepta `'en'`, primea `'ro'`. Cauză: `src/lib/chatLocalizer.ts` cădea, în lipsa `courseLanguage`/`appLanguage`, pe `navigator.language` (activ prin flagul `languageDetector: true` din `src/config/featureFlags.ts`) — pe Node 25.4.0/Windows cu locale românesc, acest global reflectă limba sistemului de operare, nu un default fix. Testul documentează intenția corectă („defaults to en when none provided") — comportamentul de fallback pe locale-ul mașinii nu era acoperit de nicio cerință scrisă și e non-determinist (depinde de OS-ul dezvoltatorului/utilizatorului final, nu de cursul sau aplicația CourseCopilot). **Fix** (plafon respectat: 1 fișier, 3 linii eliminate): scoasă ramura `navigator.language`, `detectChatLanguage` cade direct pe `'en'` când nici cursul, nici aplicația nu specifică o limbă.

**Verificare.** `npm run typecheck` → verde (0 erori). `npm test` → 12/13 verde; singurul eșec rămas e `e2e_generation.test.ts`, excepția pre-existentă D-003, ignorată explicit conform `CLAUDE.md § 3`.

**Fișiere atinse:** `src/components/GenerationProgressModal.tsx`, `src/lib/chatLocalizer.ts`. Ambele reparate sub aprobare explicită owner (întrebare pusă înainte de a scrie cod), plafon respectat (≤2 fișiere, zero schimbare de schemă, reversibil într-un commit).