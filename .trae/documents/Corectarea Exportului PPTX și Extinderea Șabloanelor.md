## Observații din analiză
- Exportul actual include etichete (Titlu/Subtitlu/Imagine Sugerată/Speaker Notes) ca bullet-uri, ceea ce gonflează numărul de slide-uri și aglomerează conținutul.
- Parsarea slide-urilor pornește prea permisiv pe headere Markdown, „Module” și separatoare (---), ceea ce rupe suplimentar blocurile.
- Logica imagini folosind Unsplash este integrată corect, dar prompt-urile prea lungi pot da „503”/rezultate slabe; există deja fallback.
- Implementarea V2 folosește un pipeline determinist și conversie Base64 pentru imagini, rezolvând coruperile PPTX.

## Obiectiv
- Sursă de adevăr: pentru fiecare slide, folosim exclusiv:
  - Titlul: textul după „Slide nr:” / „Slide X:”
  - Conținut: numai secțiunea „Text:”
  - Imagine: căutare Unsplash pe baza „Visual:” (sau sinonime), cu keyword-uri scurte.
- Eliminăm complet „Titlu:”, „Subtitlu:”, „Imagine Sugerată:”, „Speaker Notes:” din conținutul plasat pe slide.
- Numărul de slide-uri exportate = numărul blocurilor „Slide nr: …” din editor (ex. Marketing: 46, Schimbarea: 15).

## Corecții de parsare (determinist)
- În [exportService.ts](file:///c:/Users/Lucian/COURSECOPILOT/AI-Course-Co-Pilot/src/services/exportService.ts#L307-L376) restrângem segmentarea:
  - Primar: detectăm doar „Slide nr:” / „Slide X:” ca început de slide.
  - Fallback: dacă nu există deloc „Slide …”, acceptăm „## / ###” drept delimitatori; ignorăm „Module …” și „---” când există „Slide …”.
- În [processSlideBlock](file:///c:/Users/Lucian/COURSECOPILOT/AI-Course-Co-Pilot/src/services/exportService.ts#L384-L505):
  - Setăm `currentMode = null` până când întâlnim „Text:”; colectăm conținut doar când `currentMode === 'content'` după „Text:”.
  - Ignorăm liniile care corespund etichetelor: „Titlu”, „Subtitlu”, „Imagine Sugerată/Visual”, „Speaker Notes”, chiar dacă vin ca bullet-uri sau bold (`• **Titlu:** …`).
  - Păstrăm doar bullet-urile/numerotarea de sub „Text:”. Dacă „Text:” are paragrafe, le prescurtăm în 3–6 bullet-uri.
- Filtrăm agresiv din `bulletPoints` orice element ce seamănă cu „Slide/Module/---/Titlu/Subtitlu/Imagine Sugerată/Speaker Notes”.

## Reguli pentru imagine
- În [addContentSlides](file:///c:/Users/Lucian/COURSECOPILOT/AI-Course-Co-Pilot/src/services/exportService.ts#L121-L254 și #L255-L503):
  - Construim `visualSearchTerm` din „Visual:” (sinonime: „Imagine sugerată”, „Visual cue”, „Image prompt”). Extragem 3–4 cuvinte cheie, fără stopwords, și scurtăm.
  - Invocăm `searchImages` cu keyword-urile scurte; timeout 8s rămâne.
  - Fallback: titlul slide-ului ca prompt; dacă tot eșuează, placeholder.

## Alocarea de șabloane
- Menținem rotația random inteligentă din [presentationAiService.ts](file:///c:/Users/Lucian/COURSECOPILOT/AI-Course-Co-Pilot/src/services/presentationAiService.ts#L36-L64) dar:
  - Folosim șabloane cu imagine doar dacă există imagine (`ImageText`, `Hero`, `SplitLeft/Right`, `FullImage`, `ImageCenter`).
  - Folosim șabloane text-only pentru lipsă imagine (`Explainer`, `Triad`, `ThreeColumns`, `Comparison`, `Timeline`).

## Testare și verificare
- Teste unitare pentru parser: 6 fișiere fixture (Marketing/Schimbarea + variații bold/bullets) ce validează:
  - Număr de secțiuni = număr de „Slide nr: …”.
  - `title` = text după „Slide nr:”; `content` provine doar de sub „Text:”.
  - `visualSearchTerm` extras corect; `speakerNotes` ignorat.
- Test de integrare: export PPTX pentru cele două cursuri; verificăm numărul de slide-uri (46 și 15), absența etichetelor în bullets și deschiderea fără „Repair”.
- Verificare Unsplash: 10 apeluri random; rata de succes ≥ 80%; fallback funcțional.

## Managementul riscului
- Modificări strict localizate în parser și mapping; nu atingem alte livrabile.
- Păstrăm V2 ca default; fallback la legacy deja implementat.
- Timeout/graceful degrade pentru imagini; conversie Base64 deja activă.
- Logare non-intrusivă la nivel „warn”; fără expunerea cheilor.
- Feature guard ușor reactivabil dacă dorim (flag existent comentat).

## Extindere: încă 10 șabloane moderne
- Adăugăm funcții `render…` în [templates.ts](file:///c:/Users/Lucian/COURSECOPILOT/AI-Course-Co-Pilot/src/lib/pptx/templates.ts):
  1. SectionHeader (titlu + bandă accent)
  2. Checklist (bife mari, 5–7 itemi)
  3. DoDont (coloane „Do/Don’t” cu pictograme)
  4. ProcessSteps (timeline cu 4–6 pași)
  5. KeyTakeaways (carduri cu icon + text)
  6. DataPoints (numere mari + etichete)
  7. QuoteCenter (citat central pe fundal neutru)
  8. TableSimple (tabel simplu 2–4 coloane)
  9. ImageSidebar (imagine îngustă pe margine + text)
  10. AgendaCompact (listă compactă pentru recapitulări)
- Integrare: extindem rotația și regulile din `getTemplateRules` pentru densitate și max bullets.

## Criterii de acceptare
- Marketing: 46 slide-uri exportate, fără texte „Titlu/Subtitlu/Imagine Sugerată/Speaker Notes” în conținut.
- Schimbarea: 15 slide-uri exportate, layout-urile alese corect și imagini relevante.
- Niciun „Repair” la deschiderea PPTX; imagini afișate consistent.
- Rotație activă pe 20 de șabloane, cu selecție dependentă de prezența imaginii.

Confirmați planul și trec la implementare/validare end-to-end.