# Analiză Cod: AI Course Generator Edge Function

## 📋 Descriere Generală

Această funcție Deno Edge servește ca backend pentru o platformă de generare automată a conținutului de training/cursuri folosind AI (Google Gemini și Moonshot/Kimi API). Funcția orchestrează crearea de materiale pedagogice complete - de la blueprint-uri până la manuale și exerciții practice.

---

## ✅ PUNCTE TARI

### 1. **Arhitectură Multi-Provider Flexibilă**
- Suport pentru multiple modele AI (Gemini + Moonshot/Kimi)
- Failover automat între modele Gemini (`gemini-2.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`)
- Fallback la Moonshot dacă Gemini eșuează
- **Impact:** Reziliență mare și disponibilitate continuă

### 2. **Sistem de Prompting Sofisticat**
- Prompturi structurate pedagogic pentru fiecare tip de conținut
- Integrare principii de design instrucțional:
  - Merrill's First Principles (LiveWorkshop)
  - Mayer's Multimedia Learning (OnlineCourse)
  - Bloom's Taxonomy pentru obiective de învățare
- Context-aware: folosește istoric conversații și pași anteriori
- **Impact:** Calitate pedagogică ridicată a conținutului generat

### 3. **Workflow în 12 Pași Complet**
Suportă generarea secvențială a:
- Performance & Course Objectives
- Structure & Architecture
- Learning Methods & Timing
- Exercises, Examples, Stories
- Facilitator Notes & Manuals
- Participant Workbooks
- Video Scripts & Slides
- **Impact:** Acoperire completă a unui curs profesional

### 4. **Context Management Avansat**
- Extragere text din fișiere uplodate (via Supabase)
- Moștenire context din pași anteriori (până la 2000 caractere)
- Structured context cu module/durații
- **Impact:** Consistență și continuitate în conținut

### 5. **Adaptabilitate la Environment**
- LiveWorkshop: focus pe interactivitate, slides, exerciții
- OnlineCourse: video scripts, self-paced learning
- **Impact:** Conținut optimizat pentru mediul de livrare

### 6. **Funcții de Editare Inteligente**
- `improve`: rescrierea completă a conținutului
- `refine`: editare granulară pe text selectat
- **Impact:** Permite iterație și rafinare

### 7. **Blueprint Auto-Generation**
- Conversație ghidată pentru onboarding (`chat_onboarding`)
- Auto-calculare durată bazată pe complexitate
- Validare minimă pentru blueprint (2+ module, 30+ chars audience)
- **Impact:** Reduce frictionul la start

---

## ⚠️ PUNCTE SLABE

### 1. **Gestionare Deficitară a Erorilor**
```typescript
try {
  text = (data?.choices?.[0]?.message?.content ?? '') as string;
} catch (_) { void 0; }
```
- Erori ignorate complet (silent failures)
- Mesaje de eroare generice către utilizator
- Lipsa logging structurat
- **Impact:** Debugging dificil în producție

### 2. **Rate Limiting Fragil**
- Detectare rate limit doar după regex (`includes("429")`)
- Nu există retry cu exponential backoff
- Nu există queue sau throttling proactiv
- **Impact:** Experiență user inconsistentă la volum mare

### 3. **Probleme de Securitate**

#### a) Injection Vulnerabilities
```typescript
prompt = `
  **SELECTED TEXT:**
  "${selectedText}"
  **INSTRUCTION:** ${actionType}
`;
```
- Input utilizator injectat direct în prompturi fără sanitizare
- Potential pentru prompt injection attacks
- **Impact:** Manipularea comportamentului AI

#### b) Expunere Credențiale
- API keys citite din `Deno.env` dar lipsa validării/rotației
- Nu există rate limiting per-user

#### c) CORS Wildcard
```typescript
'Access-Control-Allow-Origin': '*'
```
- Permite orice origine să acceseze funcția
- **Impact:** Vulnerabil la CSRF, data leakage

### 4. **Scalabilitate Limitată**

#### a) Lipsa Caching
- Fiecare request regenerează conținut de la zero
- Context files fetched pe fiecare call
- **Impact:** Costuri API ridicate, latență mare

#### b) Procesare Sincronă
- Generarea conținutului lungă blochează request-ul
- Fără support pentru long-polling sau webhooks
- **Impact:** Timeouts la conținut complex

#### c) Token Limits Negestionate
```typescript
const snippet = text.length > 800 ? text.substring(0, 800) + '…' : text;
```
- Trunchiere naivă (la jumătatea unui cuvânt)
- Nu există contorizare token reală
- **Impact:** Context incomplet sau corupt

### 5. **Prompt Engineering Fragil**

#### a) Hardcoded Logic
```typescript
const STEP_TITLES: { [key: string]: string } = {
  'course.steps.structure': "Structure & Agenda",
  // ...
};
```
- Prompts nu sunt versionate
- Schimbarea logicii necesită redeploy
- **Impact:** Lipsa A/B testing, dificultate în iterare

#### b) Language Mixing
```typescript
**LANGUAGE**: ${course.language}
// dar apoi:
"**TASK**: Generate content for ${step_type}"
```
- Instrucțiuni în engleză chiar când cursul e în română
- Poate confunda modelul pentru limbi non-engleze
- **Impact:** Output inconsistent

#### c) Lipsa Validării Output-ului
- Nu verifică dacă JSON-ul generat e valid (la `isJsonMode`)
- Nu verifică dacă blueprint-ul respectă constraints
- **Impact:** Erori downstream în aplicație

### 6. **Dependențe Externe Fragile**
- `@google/generative-ai` via npm (Deno)
- `@supabase/supabase-js` via esm.sh CDN
- **Impact:** Breaking changes necontrolate

### 7. **Lipsa Observabilității**
- Nu există metrici (latență, success rate, token usage)
- Nu există tracing pentru debugging
- Nu există audit log pentru generări
- **Impact:** Imposibil de monitorizat sănătatea sistemului

### 8. **Blueprint Validation Superficială**
```typescript
const bpOk = bp && Array.isArray(bp.modules) && bp.modules.length >= 2 && 
  typeof bp.target_audience === 'string' && (bp.target_audience || '').trim().length >= 30;
```
- Validare prea simplă (doar lungime string)
- Nu verifică conținut semantic (e.g., "asdfasdf..." trece)
- **Impact:** Blueprints de proastă calitate acceptate

### 9. **Duration Enforcement Lax**
```typescript
const durationEnforcement = `**CRITICAL CONSTRAINT**: ${blueprintDuration}`;
```
- Doar un string în prompt, nu există validare hard
- Modelul poate ignora această constrângere
- **Impact:** Cursuri prea lungi/scurte

### 10. **Code Smells**
```typescript
const isMoonshotKey = !!Deno.env.get('MOONSHOT_API_KEY');
const isKimiKey = !!Deno.env.get('KIMI_API_KEY');
// apoi doar `isKimiKey` nu e folosit nicăieri
```
- Variabile neutilizate
- Logică duplicată (Moonshot/Kimi sunt același API)
- Funcții prea lungi (serve handler ~500 linii)

---

## 🎯 REZULTATE POTENȚIALE

### Scenarii Pozitive
1. **Generare Rapidă**: Cursuri complete în 10-15 minute
2. **Consistență**: Același nivel de calitate pedagogică
3. **Scalare Orizontală**: Poate genera sute de cursuri simultan
4. **Personalizare**: Adaptat la audience/environment specific

### Scenarii Negative
1. **Cost Exploziv**: Fără caching, fiecare curs = 50k+ tokens
2. **Hallucinations**: Conținut faptic incorect (mai ales la referințe specifice)
3. **Generic Output**: Fără exemple din industria specifică
4. **Failures în Cascadă**: Dacă un pas eșuează, tot workflow-ul e compromis

### Metrici Estimate (la 100 cursuri/zi)
- **Costuri API**: $50-150/zi (variază cu modelul)
- **Latență medie**: 30-60s per generare
- **Success rate**: 75-85% (cu failover)
- **Quality score**: 6-7/10 (necesită editare umană)

---

## 🔧 RECOMANDĂRI CRITICE

### Prioritate MAXIMĂ
1. **Sanitizare Input**: Escape user input în prompts
2. **Rate Limiting**: Implementare per-user + Redis
3. **Error Handling**: Structurat cu Sentry/logging
4. **CORS**: Whitelist de domenii, nu `*`

### Prioritate MARE
5. **Caching**: Redis pentru context files + partial results
6. **Async Processing**: Queue (BullMQ) pentru generări lungi
7. **Token Accounting**: Track usage per-user/per-course
8. **Output Validation**: Schema validation pentru JSON responses

### Prioritate MEDIE
9. **A/B Testing**: Versioning pentru prompts
10. **Observability**: OpenTelemetry + dashboards
11. **Graceful Degradation**: Fallback la template-uri pre-generate
12. **Code Refactoring**: Split în module (promptBuilder, aiClient, validator)

---

## 📊 SCOR GENERAL

| Criteriu | Scor | Comentariu |
|----------|------|------------|
| **Funcționalitate** | 8/10 | Feature-rich, acoperă workflow complet |
| **Calitate Cod** | 4/10 | Monolitic, code smells, lipsa tipizare |
| **Securitate** | 3/10 | Vulnerabilități critice (injection, CORS) |
| **Performance** | 5/10 | Functional dar neoptimizat |
| **Mentenabilitate** | 4/10 | Greu de extins/debugat |
| **Fiabilitate** | 6/10 | Failover OK, dar error handling slab |

**SCOR TOTAL: 5/10** - Prototip funcțional cu potențial, dar necesită refactoring major pentru producție.

---

## 💡 CONCLUZIE

Codul demonstrează o **viziune ambițioasă** și înțelegere solidă a design-ului instrucțional. Sistemul de prompturi multi-step este impresionant. 

**ÎNSĂ** - pentru a fi production-ready, necesită:
- Securizare (sanitizare + CORS + rate limiting)
- Optimizare (caching + async processing)
- Observabilitate (logging + metrici)
- Refactoring (modularizare + testare)

**Recomandare finală**: Folosește acest cod ca **MVP pentru validare**, dar planifică o rescriere arhitecturală înainte de lansare publică.