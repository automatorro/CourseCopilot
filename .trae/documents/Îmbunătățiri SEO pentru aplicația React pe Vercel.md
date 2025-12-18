## Impactul domeniului
- Alegerea unui domeniu canonical (coursecopilot.app) e un plus: putem seta `canonical`, sitemap/robots și redirectări consistente. TLD `.app` impune HTTPS (HSTS preloaded), ceea ce ajută SEO și securitatea.
- Planul rămâne valabil; adăugăm pași de canonicalizare și actualizăm URL‑urile absolute.

## Ajustări specifice domeniului
1. Canonicalizare
- Setăm `link rel="canonical"` per pagină către `https://coursecopilot.app/...`.
- Open Graph/Twitter `og:url` cu URL absolut pe noul domeniu.
2. Sitemap/Robots
- `robots.txt`: `Sitemap: https://coursecopilot.app/sitemap.xml`.
- Generator de `sitemap.xml`: folosește baza `https://coursecopilot.app` pentru toate rutele.
3. Redirectări
- În `vercel.json`: redirect de la orice domeniu vechi către `https://coursecopilot.app`, plus redirect `www.coursecopilot.app` → `coursecopilot.app` (dacă folosim apex).
4. Search Console
- Adăugăm proprietatea domeniu pentru `coursecopilot.app` și facem submit la sitemap.

## Opțiunea A — Quick wins (SPA)
- Înlocuim `HashRouter` cu `BrowserRouter`.
- Adăugăm `react-helmet-async` și meta per pagină (title, description, canonical, OG/Twitter).
- `public/robots.txt` și `public/sitemap.xml` (generator la build cu baza domeniului).
- JSON‑LD (`Organization`, `BreadcrumbList`, `FAQPage`, `Course`).
- Semantic HTML + accesibilitate; code‑split pe rute.
- `vercel.json`: excepții pentru `robots.txt`/`sitemap.xml`/`favicon.ico` și redirecturi de domeniu.
- Validări: Lighthouse + Search Console.

## Opțiunea B — Migrare Next.js
- Migrare graduală la Next.js cu metadata API.
- SSG/ISR pentru conținut; `next/image`.
- Route pentru `robots.txt` și generare `sitemap` cu domeniul canonical.
- Redirecturi de domeniu gestionate nativ în Vercel.

## Livrabile
- URL‑uri curate pe `https://coursecopilot.app` cu meta‑date corecte.
- `robots.txt`/`sitemap.xml` accesibile și declarate.
- Redirecturi către domeniul canonical.
- Raport Lighthouse și submit sitemap.

Confirmați dacă încep cu Opțiunea A și includ toate ajustările de domeniu (coursecopilot.app).