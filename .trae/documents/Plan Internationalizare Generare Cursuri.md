# Plan de Internationalizare pentru Generarea Cursurilor

Acest plan vizează extinderea capacității de generare a cursurilor în **orice limbă**, menținând în același timp limba interfeței aplicației (RO/EN) neschimbată.

## Obiective
1.  **Selector Global**: Înlocuirea listei hardcodate de 6 limbi cu o listă completă (ISO Standard).
2.  **Generare Nativa**: Asigurarea că AI-ul generează conținutul direct în limba selectată.
3.  **Risk Management**: Păstrarea compatibilității cu cursurile existente și evitarea modificărilor riscante în baza de date.

## Etape de Implementare

### 1. Extinderea Listei de Limbi (`Frontend`)
Vom crea o sursă centrală de adevăr pentru limbile disponibile.
- **Acțiune**: Crearea fișierului `src/languages.ts` care va conține o listă extinsă de limbi (Cod ISO + Nume Nativ + Nume Engleză).
- **Detaliu**: Lista va include prioritizat cele 6 limbi actuale (En, Ro, Es, Fr, De, It) urmate de restul limbilor lumii, sortate alfabetic.
- **Fișier țintă**: `src/constants.ts` va fi actualizat să importe această listă în loc să o definească hardcodat.

### 2. Actualizarea Interfeței (`NewCourseModal.tsx`)
Vom îmbunătăți experiența de selecție fără a introduce librării complexe care pot cauza erori vizuale.
- **Acțiune**: Actualizarea dropdown-ului de selecție a limbii.
- **Design**: Utilizarea unui `<select>` standard (pentru stabilitate maximă) organizat cu `<optgroup>`:
    - **Grupul 1 "Populare"**: Română, Engleză, Franceză, etc. (pentru acces rapid).
    - **Grupul 2 "Toate Limbile"**: Restul listei complete.
- **Risk Management**: Această abordare garantează că nu există probleme de afișare pe mobil sau conflicte CSS.

### 3. Adaptarea Backend-ului (`Edge Function`)
Asigurarea că AI-ul înțelege corect orice cod de limbă, chiar și cele mai exotice.
- **Acțiune**: Actualizarea funcției `generate-course-content/index.ts`.
- **Logică Nouă**:
    - Vom introduce o mapare internă (Code -> English Name) pentru limbile principale.
    - Prompt-ul trimis la AI va conține numele complet al limbii (ex: `LANGUAGE: "Hungarian"`) în loc de doar codul (`hu`), pentru a elimina orice ambiguitate.
    - Pentru limbile foarte rare care nu sunt în mapare, se va folosi codul ISO sau numele nativ ca fallback.

### 4. Verificare și Testare
- **Test UI**: Verificarea afișării corecte a listei extinse în modalul de creare curs.
- **Test Generare**: Crearea unui curs de test într-o limbă nouă (ex: Portugheză sau Italiană) pentru a valida că tot conținutul (structură, slide-uri, exerciții) este generat în acea limbă.
- **Test Compatibilitate**: Verificarea că un curs vechi (în 'ro' sau 'en') funcționează în continuare fără probleme.

## Notă despre Riscuri
- **Baza de Date**: Nu modificăm structura bazei de date. Coloana `language` acceptă deja text, deci va accepta orice cod nou fără erori.
- **Interfața Aplicației**: Nu atingem logica de traducere a meniurilor/butoanelor aplicației. Aceasta rămâne separată.

Doriți să procedez cu acest plan?