# Plan Revizuit: Diagnosticare Avansată

Înțeleg că cheile API sunt configurate corect și au funcționat anterior. Acest lucru sugerează o altă cauză pentru eroare, cum ar fi:
1.  **Limită de cotă (Quota Exceeded)**: Chiar și cu chei valide, API-ul Gemini poate respinge cereri dacă s-a atins limita de utilizare (frecvent pe planul gratuit).
2.  **Timeout**: Funcția durează prea mult să răspundă.
3.  **Eroare de conținut**: Ceva specific la acest curs provoacă o eroare neașteptată în cod.

Deoarece eroarea actuală ("non-2xx status code") este generică și ascunde cauza reală, **mențin planul de a modifica modul în care serverul raportează erorile**, dar cu un scop strict de diagnosticare.

## Pași de Implementare:

1.  **Diagnosticare ("Soft Error" Fix)**:
    *   Voi modifica `supabase/functions/generate-course-content/index.ts` pentru a captura *orice* eroare (inclusiv Quota Exceeded sau erori de logică) și a o returna ca un răspuns valid JSON (`200 OK` cu `{ error: "..." }`).
    *   **De ce?** Astfel vom vedea mesajul real (ex: "429 Too Many Requests" sau "Resource exhausted") direct în interfață, în loc de eroarea opacă de rețea.

2.  **Verificare Payload Client**:
    *   Voi adăuga un log în consolă (`GenerationProgressModal.tsx`) pentru a verifica dimensiunea datelor trimise. Dacă ați încărcat fișiere foarte mari, e posibil să depășim limita de request a funcției Edge.

3.  **Testare**:
    *   După aplicarea fix-ului, la următoarea încercare de generare, aplicația ne va spune exact *de ce* eșuează (ex: "Quota limit reached"), permițându-ne să luăm măsuri concrete (ex: așteptare sau schimbare model).

Voi proceda la aplicarea acestor modificări pentru a "debloca" mesajul real de eroare.