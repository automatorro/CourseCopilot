# Actualizare: Internaționalizare și Îmbunătățiri UX (Decembrie 2025)

Această actualizare introduce suport complet pentru generarea cursurilor în orice limbă și îmbunătățește experiența de utilizare în editor.

## 1. Internaționalizare Completă (Global Language Support)

### Obiectiv
Permiterea generării de conținut educațional în orice limbă, nu doar în cele 6 limbi limitate anterior, menținând în același timp interfața aplicației în RO/EN.

### Modificări Tehnice
*   **Listă Extinsă de Limbi**: S-a creat `src/languages.ts` care conține o listă completă de limbi (Cod ISO + Nume Nativ + Nume Engleză).
*   **Selector Grupat**: Componenta `NewCourseModal.tsx` folosește acum un selector organizat în două grupuri:
    *   **Popular**: Cele 6 limbi principale (En, Ro, Es, Fr, De, It).
    *   **All Languages**: Lista completă ordonată alfabetic.
*   **AI Language Mapping**: Backend-ul (`generate-course-content/index.ts`) a fost actualizat pentru a converti codurile de limbă (ex: `hu`) în numele lor complet în engleză (`Hungarian`) înainte de a trimite prompt-ul către AI. Aceasta asigură o precizie maximă în generare.

### Fișiere Afectate
*   `src/languages.ts` (Nou)
*   `src/constants.ts`
*   `src/components/NewCourseModal.tsx`
*   `supabase/functions/generate-course-content/index.ts`

## 2. Îmbunătățire UX Editor: Butonul "Save Changes"

### Obiectiv
Rezolvarea confuziei cauzate de dispariția butonului de salvare atunci când sistemul nu detecta modificări majore.

### Modificări
*   Butonul **"Save Changes"** este acum **permanent vizibil** pentru pașii finalizați.
*   **Stare Activă**: Culoare albastră (Primary) când există modificări nesalvate.
*   **Stare Inactivă**: Culoare gri (Secondary) când conținutul este sincronizat, dar rămâne clickabil pentru salvări manuale de siguranță.
*   Această modificare se aplică atât pe Desktop, cât și pe interfața Mobilă.

### Fișiere Afectate
*   `src/pages/CourseWorkspacePage.tsx`
