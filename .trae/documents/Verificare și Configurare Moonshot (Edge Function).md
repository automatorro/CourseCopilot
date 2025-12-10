## De ce nu contează KIMI vs MOONSHOT
- Codul acceptă ambele nume de variabile de mediu: `MOONSHOT_API_KEY` și `KIMI_API_KEY` (supabase/functions/generate-course-content/index.ts:24–26, 131–133, 742).
- URL-ul și modelul pot fi setate fie cu prefix `MOONSHOT_` fie `KIMI_`; există valori implicite (`https://api.moonshot.ai/v1`, `kimi-k2-turbo-preview`) (supabase/functions/generate-course-content/index.ts:22–27).
- Concluzie: lăsarea `KIMI_API_KEY` în unele locuri NU afectează negativ; sunt suportate intenționat ambele.

## Modificări recente
- Au fost adăugate endpoint-urile de sănătate `ping` și `provider_status` (supabase/functions/generate-course-content/index.ts:121–137).
- A fost introdus fallback-ul către Moonshot/Kimi când Gemini nu e disponibil sau există rate-limit (supabase/functions/generate-course-content/index.ts:713–754 și funcția `generateWithKimi` la 21–58).
- UI-ul Dashboard afișează starea providerului și rulează health check (src/pages/DashboardPage.tsx:287–297).

## Pași de configurare (Moonshot)
1. Secrete în Supabase
- Setează cel puțin `MOONSHOT_API_KEY` (sau `KIMI_API_KEY`). Opțional: `MOONSHOT_API_URL` și `MOONSHOT_MODEL`.
- Dacă folosești CLI: `supabase secrets set MOONSHOT_API_KEY=... MOONSHOT_API_URL=https://api.moonshot.ai/v1 MOONSHOT_MODEL=kimi-k2-turbo-preview`

2. Redeploy Edge Function
- Redeploy pentru `generate-course-content` ca secretele să fie vizibile funcției: `supabase functions deploy generate-course-content`

3. Verificare Health Check din aplicație
- În Dashboard, apasă `Verifică`. Așteptări:
  - Ping: „ok”.
  - Provider activ: „Google” dacă `GEMINI_API_KEY` este setat; altfel „Moonshot” dacă `MOONSHOT_API_KEY/KIMI_API_KEY` este setat (src/pages/DashboardPage.tsx:289–297).

4. Verificare directă a providerului
- Apelează funcția cu `action: "provider_status"` și `action: "ping"` (supabase/functions/generate-course-content/index.ts:121–137) pentru a confirma configurările.

5. Test de generare
- Generează conținut în orice pas. Dacă Gemini e indisponibil sau 429/quota, funcția cade pe Moonshot/Kimi (supabase/functions/generate-course-content/index.ts:740–749).

## Diagnosticare
- Dacă primești „non‑2xx”: verifică dacă secretul este prezent (provider_status raportează `moonshotConfigured`), cote/ratelimiting și URL-ul.
- Erorile sunt returnate cu mesaj clar; 429 indică limită; 500 indică altă problemă (supabase/functions/generate-course-content/index.ts:751–763).

Vrei să trecem prin acești pași acum și să validăm cu un health check și un test de generare?