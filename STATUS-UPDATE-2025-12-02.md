# Starea aplicației — 2025‑12‑02

## Rezumat
- Generarea pe 11 pași funcționează și include raportul de validare la final.
- Blueprint Preview oferă editare manuală cu editor simplu și previzualizare live.
- Rafinarea cu AI pentru Blueprint este implementată, dar butonul este ascuns în Preview (controlat prin flag). Rafinarea AI din editor rămâne pentru lucrat ulterior.
- S-au rezolvat problemele de JSON în locale și afișarea cheilor brute în raport (se folosesc traducerile).

## Ce s-a realizat
- Modal de editare Blueprint (editor simplu + JSON avansat), previzualizare sincronizată, validare înainte de salvare.
- Modal de „Rafinează cu AI” pentru Blueprint, cu comparație Original vs Rafinat, listă de diferențe și validare de consistență (informativ).
- Raportul de validare din Generare traduce cheile livrabilelor (ex. „Structură completă” în loc de `course.livrables.structure`).
- Flag nou pentru a ascunde butonul „Rafinează cu AI” în Blueprint Preview.
- Corecții în fișierele `locales/*.json` (virgule lipsă / chei noi) pentru a elimina erorile de încărcare.
- Bugfix în `geminiService.ts` (acoladă în exces).

## Referințe utile
- Ascundere buton „Rafinează cu AI” în Preview: `src/components/BlueprintReview.tsx:159-175` cu `isEnabled('blueprintRefineEnabled')`.
- Flaguri: `src/config/featureFlags.ts:1-22` (cheie `blueprintRefineEnabled=false`).
- Editare Blueprint: `src/components/BlueprintEditModal.tsx:118-236` (Editor Simplu) și `:123-134` (tabs, sticky header). Integrare: `src/pages/CourseWorkspacePage.tsx:965-986`.
- Rafinare Blueprint cu AI: serviciu `src/services/geminiService.ts:102-130` și modal `src/components/BlueprintRefineModal.tsx:35-142`. Integrare: `src/pages/CourseWorkspacePage.tsx:969-986, 990-1014`.
- Raport de validare în Generare (traduceri chei): `src/components/GenerationProgressModal.tsx:280-283`.
- Validatorii de ieșire: `src/lib/outputValidators.ts:1-76`.

## Cum se folosește
- Blueprint Preview:
  - „Editează manual” pentru schimbări de structură și conținut (titluri, LO, secțiuni). Salvarea trece prin validare minimă și actualizează `courses.blueprint`.
  - „Generează Materialele Cursului” declanșează cei 11 pași; la final se arată raportul de calitate și, dacă e ok, se inserează în `course_steps`.
- „Rafinează cu AI” în Preview este ascuns (flag); rămâne „Rafinare cu AI” din editorul de materiale pentru o etapă ulterioară.

## Validare & calitate
- Raportul verifică:
  - Fragmente nelocalizate (avertisment; blocare doar dacă `validationStrictLocalization=true`).
  - Consistența titlurilor de module între „Structură” și „Slide-uri”.
  - Consistența duratelor între „Structură” și „Workbook”.

## Probleme cunoscute
- Dif‑ul din rafinare evidențiază doar schimbări structurale (număr module/secțiuni, titluri module). Pentru diferențe text fine se poate adăuga dif textual ulterior.
- Scriptul `lint` există în `package.json`, dar nu avem configurat ESLint (nu impactează buildul). Se poate adăuga `.eslintrc` ulterior.

## Următori pași recomandați
- Editor: reparare „Rafinare cu AI” contextuală pe materiale, păstrând validatorii înainte de salvare.
- Dif textual în modalul de rafinare și acceptare selectivă per modul.
- Îmbunătățiri locale: uniformizare completă a traducerilor pentru noile etichete din editorul simplu în toate limbile.

## Testare
- `npm run typecheck` — OK.
- `npm run dev` — previzualizare pe `http://localhost:5173/`.

