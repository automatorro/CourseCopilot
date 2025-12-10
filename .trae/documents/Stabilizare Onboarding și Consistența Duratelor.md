## Concluzii din sesiunea curentă
- Chat onboarding pune o singură întrebare și trece direct la Blueprint Preview; Edge Function acceptă prea devreme generarea.
- Generarea în 12 pași rulează complet, dar validarea eșuează constant la „neconcordanță durate între Structură și Workbook”, apoi „Regenerează materialele afectate” regenerează Workbook și „Salvează ca draft” permite exportul.
- Loguri relevante: `GenerationProgressModal.tsx:252` pași 1–11, `GenerationProgressModal.tsx:336–437` agregare livrabile, `GenerationProgressModal.tsx:433` lipsă video_scripts (OK pentru LiveWorkshop), `installHook.js:1` „Validation failed”.

## Cauze probabile
- Chat: promptul `chat_onboarding` lasă modelul să genereze blueprintul dacă „pare suficient” după o singură întrebare; nu există o barieră programatică pe server/client care să verifice că LO, audiența și profunzimea sunt completate.
- Durate: Workbook nu consumă fidel lista de durate pe module din Structură; chiar cu „STRUCTURED CONTEXT” transmis, promptul pentru Workbook nu impune aliniere exactă sau modelul o ignoră.

## Plan Tehnic
### 1) Îmbunătățire Onboarding (Client + Server)
- Client: Gate logic în `OnboardingChat` pentru blueprint acceptance:
  - Nu accepta blueprint dacă lipsesc câmpuri cheie (LO, audiență, profunzime/ton); continuă chatul cu întrebări.
  - Indicator vizual „Încă colectăm detalii” înainte de Blueprint Preview.
- Server: Validator minim pentru `chat_onboarding`:
  - Analizează `chat_history`; dacă lipsesc cheile, răspunde cu `blueprint: null` și o întrebare suplimentară.
  - Constrânge durata: returnează blueprint doar dacă are ≥2 module și `estimated_duration` conform regulii (2–8 ore) și audiență detaliată.

### 2) Forțarea alinierii duratelor (Server + Client)
- Server:
  - În `generate_step_content` pentru `participant_workbook`, injectează lista de durate pe modul și titlurile din „STRUCTURED CONTEXT”; adaugă reguli „STRICTLY match module order and durations”.
  - Pentru `facilitator_manual`, folosește Structură + Timing & Flow ca sursă autoritativă.
- Client:
  - Post‑finalizare, dacă validarea duratelor eșuează, rulează automat `alignWorkbookDurationsByStructure` și re‑validează; dacă trece, inserează fără a cere acțiune manuală.

### 3) Regenerare țintită și transparență
- Când apare „modulesMismatch” sau „durationMismatch”, afișează diferențele concrete (titlu/durată) în raportul de validare.
- La „Regenerează livrabilele afectate”, extinde setul: Slides pentru `modulesMismatch`, Workbook pentru `durationMismatch`, Trainer Manual dacă Timing & Flow s‑a schimbat.

### 4) UX ajustări
- În Workspace fără blueprint: taburi „Chat Onboarding” și „Analizează material” (deja adăugat) cu tooltips despre ce alege fiecare.
- În Blueprint Review: banner cu „Detalii insuficiente” dacă validatorul minim nu trece; buton „Continuă Q&A”.

### 5) Logging și observabilitate
- Server: log explicit al regulilor încălcate (de exemplu: „Workbook durations [x,y,z] ≠ Structure [x,y,z]”).
- Client: log pentru ce pași au fost regenerați și rezultatul re‑validării.

## Verificare
- Test end‑to‑end: 3 scenarii (LiveWorkshop și OnlineCourse) cu chat minimal, chat complet, analiză material lipit.
- Confirmă că:
  - Chat cere mai multe întrebări până la completare.
  - Workbook are duratele identice cu Structura după generare sau auto‑fix.
  - Validarea trece automat dacă auto‑fix rezolvă.

## Referințe de cod
- Pași generare: `src/components/GenerationProgressModal.tsx:220–306`.
- Validare și agregare: `src/components/GenerationProgressModal.tsx:308–497`.
- Chat onboarding: `src/components/OnboardingChat.tsx:66–123`.
- Edge function (chat & pași): `supabase/functions/generate-course-content/index.ts:259–342`, `377–561`.