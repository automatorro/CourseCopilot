# Arhitectura Modulară AI Service (v4.0)

Acest document descrie arhitectura funcției `generate-course-content`, actualizată odată cu
migrarea providerului LLM de la Google Gemini la Anthropic Claude (2026-09).

## 1. Privire de Ansamblu

Funcția e organizată modular, orientat pe obiecte, cu responsabilități clar separate. Scopul este
de a crește robustețea, testabilitatea și ușurința de întreținere.

### Componente Principale

1.  **Config**: Gestionarea centralizată a variabilelor de mediu și a secretelor (API Keys).
2.  **Logger**: Sistem unificat de logging cu prefixe de versiune și nivele (INFO, WARN, ERROR).
3.  **IAIProvider (Interface)**: Contract standard pentru toți furnizorii de AI.
4.  **Providers**: `ClaudeProvider` — singurul provider AI activ (Anthropic).
5.  **AIOrchestrator**: Gestionează strategia de apelare și agregarea erorilor (scaffolding
    păstrat din arhitectura multi-provider anterioară, pentru cazul în care se adaugă un fallback
    în viitor).

## 2. Detalii Tehnice

### 2.1 Configurare (`Config`)
-   Citește variabilele din `Deno.env` (`ANTHROPIC_API_KEY`).
-   **Sanitizare**: Elimină automat spațiile și ghilimelele care pot apărea la copierea cheilor.
-   **Securitate**: Cheile nu sunt logate niciodată în clar (doar primele/ultimele 4 caractere,
    pentru debugging).

### 2.2 AI Service Layer

#### `ClaudeProvider`
-   Folosește SDK-ul oficial Anthropic (`npm:@anthropic-ai/sdk`, specificator Deno).
-   Model: `claude-sonnet-5` — ales pentru echilibrul cost/performanță (mai ieftin ȘI mai capabil
    decât generația anterioară Sonnet 4.5/4.6).
-   `max_tokens: 8192` — plafon explicit, obligatoriu la Claude API (spre deosebire de Gemini,
    unde lipsa lui era un risc de cost neplafonat).
-   Retry-ul pe erori tranzitorii (429/5xx/rețea) e gestionat intern de SDK (`max_retries`
    implicit 2) — nu mai există un wrapper `fetchWithRetry` custom.
-   Erori tipate din SDK (`Anthropic.AuthenticationError`, `Anthropic.RateLimitError`,
    `Anthropic.APIError`) sunt distinse explicit pentru mesaje de eroare mai clare.

#### `AIOrchestrator`
-   Iterează prin lista de provideri configurați (azi: doar `ClaudeProvider`).
-   Propagă `modelTier` (`standard` sau `premium`) până la provider. Ambele tier-uri
    folosesc momentan `claude-sonnet-5`; escaladarea tier-ului premium se decide la F6.
-   Dacă toți cad, aruncă o eroare agregată detaliată `[v3.0-MODULAR] AI_ERROR`.

**Istoric.** Până în 2026-09, arhitectura folosea Gemini (`GeminiProvider`, cu fallback pe 3
modele: `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-2.5-flash`, apelat prin `fetch`
brut la `generativelanguage.googleapis.com`) și Moonshot/Kimi (`MoonshotProvider`, fallback
secundar, format OpenAI-compatible, `moonshot-v1-8k`) orchestrate prin `fetchWithRetry`. Ambele au
fost eliminate complet — motiv cost (Gemini) și context insuficient de 8k pentru prompturile
lungi ale aplicației (Moonshot, risc de trunchiere silențioasă).

## 3. Testare

### Endpoint `test_connection`
Funcția expune o acțiune specială pentru verificarea sănătății sistemului:
```json
{ "action": "test_connection" }
```
Instanțiază `ClaudeProvider` și încearcă un apel "Hi", returnând `results.claude` cu statusul.

### Endpoint `provider_status`
```json
{ "action": "provider_status" }
```
Returnează `{ claudeConfigured: boolean, activeProvider: 'claude' | 'none' }`.

## 4. Ghid de Extindere

Pentru a adăuga un nou provider (ex. un fallback):
1.  Adăugați cheia în `Config`.
2.  Creați o clasă care implementează `IAIProvider`.
3.  Adăugați instanța în lista din constructorul `AIOrchestrator`.

---
*Versiune: v4.0.0-CLAUDE*
*Data: 2026-09-04*
