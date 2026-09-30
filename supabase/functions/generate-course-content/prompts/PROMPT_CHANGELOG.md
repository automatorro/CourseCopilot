# PROMPT_CHANGELOG

Jurnalul de calibrare al prompturilor sistemului (plan v2.0 § A.5).

**Regulă:** fiecare modificare = o linie. O iterație de calibrare = o singură modificare
(un prompt SAU un parametru), niciodată mai multe simultan — altfel nu se poate atribui
delta de scor (§ B.2).

**Regulă de PR:** un PR care schimbă prompturi nu schimbă și logică, și invers
(`CLAUDE.md § 3`).

**Scorul** e media pe rubrica din `docs/QUALITY_RUBRIC.md`, punctată pe cursul-etalon,
separat RO și EN. Pragul M6: medie ≥ 4,0 și niciun criteriu < 3.

---

| Data | Prompt | Ce s-a schimbat | Scor înainte | Scor după |
|---|---|---|---|---|
| 2026-09-30 | *(toate)* | **v1 instalată pe `main`** — cele 7 schelete din § A.4, preluate de pe branch-ul `claude/context-rlv61y` (scrise acolo pe 2026-08-15, D-016) și revizuite față de A.4. Formă comună `PromptSkeleton` (role/task/format/quality), mapată pe `PromptLayers` din index.ts. Singura modificare față de branch: `exercise-sheet` și `trainer-flow-polish` cer headerele lipsă prin `{{label_*}}` noi (workspace, timing, observerChecklist, successIndicators, adaptation, openingRitual, closingRitual — D-017). Fără few-shot-uri (§ A.5). Necablate în orchestrator — asta e F4-T2. | — | — |

---

## Interdicții permanente (§ A.5, derivate din audit)

Acestea nu sunt preferințe de stil — sunt anti-pattern-uri pe care auditul le-a identificat
ca fiind cauze directe ale problemelor de calitate. Nu se reintroduc fără decizie de owner
scrisă în `IMPLEMENTATION_STATUS.md § Descoperiri`.

1. **Fără retry-with-scolding în lanț.** Maximum 1 re-apel pe unitatea eșuată, apoi warning
   vizibil. Nu se „ceartă" modelul în buclă.
2. **Fără post-procesare care rescrie textul generat.** Doar validare + re-apel. (Cauza
   rădăcină a bug-ului „Alex×3" / „pozițAlexând" din audit: `ProtagonistEnforcer`, șters
   în F1-T2.)
3. **Fără few-shot-uri gigantice by default.** `GOLDEN_SAMPLES` umfla prompturile fără
   câștig demonstrat. v1 pornește fără ele; se reintroduc doar chirurgical în F6, ca
   fragmente de 300–600 cuvinte, în promptul criteriului deficitar, dacă rubrica o cere
   (treapta 1 din scara de escaladare § B.3).
4. **Nicio propoziție în limbă naturală hardcodată în FORMAT SPEC.** Doar placeholders
   `{{label_*}}`, rezolvate din `localized_labels` / `STATIC_LABELS`. (§ A.1)
5. **Meta-instrucțiunile sunt în engleză, conținutul e în limba cursului.** Practica
   corectă: modelele urmează fidel instrucțiuni EN cu output în altă limbă. (§ A.1, F2-T4)

---

## Cum se folosește la calibrare (F6)

```
generează etalonul → punctează pe rubrică → identifică cel mai slab criteriu →
modifică EXACT UN prompt → regenerează DOAR unitățile afectate → re-punctează →
adaugă o linie în tabelul de mai sus cu delta → repetă
```

Buget: 10 iterații. Dacă pragul nu e atins, se urcă pe scara § B.3 — nu se iterează orbește.
