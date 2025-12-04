Obiective

Păstrează exportul existent în pptx funcțional și stabil.
Introdu un IR pentru slide-uri, arhetipuri și reguli deterministe, fără a rupe fluxul actual.
Adaugă validări pedagogice și de volum text, plus „smart image fit”.
Rulează prin feature flags și fallback-uri, cu rollout etapizat și teste.
Principii

Compatibilitate și fallback: noul pipeline este adăugat în paralel; exportul actual rămâne default (src/services/exportService.ts:281).
Incremental și izolat: fiecare etapă are interfață clară și poate fi dezactivată.
Determinism: aceeași intrare produce același pptx.
Observabilitate: loguri, metrici, erori explicite în UI, fără surprize pentru utilizator.
Arhitectură Propusă

IR de slide: SlideModel cu slide_type, title, bullets[], imageRef, trainer_notes, objective_links, section_id.
ASLS (arhetipuri + template contracts): sloturi (title, bullets, image) și reguli (max chars, max bullets, requires_image).
SLE (Slide Layout Engine): mapping determinist din „Content Packets” către SlideModel.
Normalizer + Validator: scurtare titluri, reducere bullets, verificare densitate/ID-uri, reguli Bloom/Merrill.
PPTX Transformer: randare arhetipuri peste PptxGenJS (compatibil cu engine-ul actual).
Orchestrator Export: CourseMaster.json ca sursă unică, transformatoare per format (pptx/docx/pdf/scorm).
Preview determinist: randare în UI cu aceleași sloturi ca exportul.
Etape Implementare

Etapa 0: Stabilizare și garduri
Adaugă feature flag pentru „nou export pptx” (exemplu pattern isEnabled(...) deja folosit în src/components/BlueprintReview.tsx:3).
Wrap pentru export actual ca „LegacyPptxExporter”.
Etapa 1: IR minim viabil
Tipuri SlideArchetype, SlideModel, SlideRules în src/types.ts (alături de TrainerStepType din src/types.ts:102).
8–12 arhetipuri de bază (Title, Explainer, Image+Text, Quote, Agenda, Exercise, CaseStudy, Summary).
Etapa 2: Content Packets
Builder „ContentPacket” derivat din pașii existenți (structure, examples, exercises, facilitator notes).
Identifică „section_id” și „objective_links” din CourseBlueprint (src/types.ts:65).
Etapa 3: ASLS Templates
Definește „template contracts” cu sloturi și reguli pentru fiecare arhetip.
Fără randare încă; doar specificații și validări.
Etapa 4: Mapping Engine (SLE)
mapPacketToSlide(archetype, rules) cu fallback logic (ex: text prea lung → „Title+Subtitle”, lipsește imagine → „Explainer”).
Mapează sistematic: concept → Concept Key, exemplu → Image+Text, exercițiu → Exercise, studiu de caz → Case Study, rezumat → Summary.
Etapa 5: Normalizer + Validator
Normalizer: scurtare titluri, max bullets, transformă paragrafe lungi în bullets controlate.
Validator: ID-uri, volum text, link la obiective, densitate, reguli Bloom/Merrill. Integrează erori în GenerationProgressModal.tsx (lista pașilor e în src/components/GenerationProgressModal.tsx:10–26).
Etapa 6: PPTX Transformer
toPptxSlide(archetype, model) peste PptxGenJS, înlocuiește addContentSlides (src/services/exportService.ts:76) doar când flag-ul e activ.
Menține addTitleSlide, addAgendaSlide, addSummarySlide (src/services/exportService.ts:22, src/services/exportService.ts:45, src/services/exportService.ts:129), dar cu IR.
Etapa 7: Preview determinist
Randare DOM/canvas în UI, conform sloturilor din arhetipuri; se vede înainte de export.
Buton „Fix issues” aplică Normalizer/Validator asupra slide-urilor.
Etapa 8: Smart Image Fitter
Crop/fit în slot, raport, „safe zone”, limită rezoluție.
Integrează pipeline-ul de imagini deja existent:
Upload la Storage (src/services/imageService.ts:8–24)
Căutare + copiere opțională (src/components/ImageSearchModal.tsx:40–58)
Extracție din markdown (src/services/exportService.ts:171–183)
Etapa 9: Teste și QA
Unitare: mapping arhetipuri, validări, normalizer, edge-cases imagini.
Integrare: generare deck complet din cursuri de exemplu; compară rezultate între run-uri.
Manual QA: preview vs pptx final.
Etapa 10: Rollout
Activare graduală prin feature flag la Pro/Trial, cu buton „New PPTX (Beta)”.
Metrici: rate export, erori, timp generare, mărime fișier.
Fallback instant: „Export vechi” dacă eroare.
Risk Management

Ruptură de compatibilitate
Risc: noul pipeline diferă de comportamentul existent.
Mitigare: feature flag, fallback la LegacyPptxExporter (src/services/exportService.ts:281).
Limitări PptxGenJS
Risc: anumite layout-uri complexe sau imagini mari.
Mitigare: începe cu arhetipuri simple; „Smart Image Fitter” reduce erori; Open XML low-level doar dacă apare o limitare specifică.
Integritatea conținutului
Risc: bullets/titluri prea lungi.
Mitigare: Normalizer + Validator cu erori în UI; auto-scurtare la arhetip.
Stabilitatea imaginilor
Risc: hotlink-uri externe cad.
Mitigare: bifa „Copiază în Storage” (src/components/ImageSearchModal.tsx:87–93); replaceBlobUrlsWithPublic (src/services/imageService.ts:26–68).
Performanță/payload
Risc: imagini data: mari în memorie.
Mitigare: stocare în Supabase și referințe URL; limită rezoluție în fitter; evită embed-uri excesive.
UX și adopție
Risc: utilizatorii văd modificări neașteptate.
Mitigare: Preview determinist, status clar în GenerationProgressModal, butoane explicite „Legacy vs New”.
Criterii de Acceptare

Export pptx trece pe 5–7 cursuri variate fără erori, cu layout consistent.
Slide-urile au max bullets/char conform arhetipurilor; imaginile încadrate corect.
Preview = pptx randat (diferențe doar de antialiasing/metrici PowerPoint).
Legacy export rămâne disponibil și stabil.
Rollout & Monitorizare

Activare Beta pentru conturi selectate; colectare feedback.
Loguri și metrici în front-end (timp, erori), plus evenimente specifice pe arhetipuri.
După stabilizare, „New PPTX” devine default; „Legacy” rămâne ca fallback o perioadă.
Compatibilitate cu Funcționalități Existente

Exportul vechi nu se atinge; noul pipeline intră prin flag.
Parserul actual de markdown rămâne utilizabil și ca sursă pentru Content Packets (retrofitting).
Serviciile imagini și căutare se păstrează, doar se aplică politici „copy-to-storage” by default pentru export.