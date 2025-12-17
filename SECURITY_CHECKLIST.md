# 4BID.IT - Checklist Sicurezza e SEO Post-Deploy

## ✅ IMPLEMENTATO

### 1. SEO / CANONICAL
- [x] Canonical assoluto configurato su TUTTE le pagine (via metadataBase nel layout)
- [x] Homepage: https://4bid.it
- [x] Tutte le landing pages hanno alternates.canonical nei metadata
- [x] Meta robots configurati (index,follow) su pagine pubbliche
- [x] Meta robots noindex su /admin/login

### 2. SECURITY HEADERS
Configurati in `next.config.mjs`:
- [x] X-Frame-Options: DENY (previene clickjacking)
- [x] X-Content-Type-Options: nosniff (previene MIME sniffing)
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy: camera=(), microphone=(), geolocation=()
- [x] Strict-Transport-Security: max-age=31536000; includeSubDomains; preload (HSTS)
- [x] X-DNS-Prefetch-Control: on
- [x] X-XSS-Protection: 1; mode=block

### 3. REDIRECT WWW → NON-WWW
Implementato in `next.config.mjs` con async redirects():
- [x] Redirect 301 permanente da www.4bid.it a 4bid.it (versione canonica)
- [x] Mantiene pathname e query params
- [x] Non crea loop di redirect

### 4. ROBOTS.TXT E SITEMAP
- [x] robots.ts generato dinamicamente
- [x] Host esplicito: https://4bid.it
- [x] Disallow: /admin/, /api/, /_next/, /scripts/
- [x] Sitemap URL: https://4bid.it/sitemap.xml
- [x] Sitemap con URL assoluti corretti (baseUrl: https://4bid.it)

### 5. TRACKING CLEANUP
- [x] Script caricati solo in produzione (env check: NODE_ENV === "production")
- [x] Google Analytics: G-S6YEEXE4C3
- [x] Google Tag Manager: GTM-K8PFZCBS
- [x] Yandex Metrika: ID 105859080 con Session Replay (webvisor: true)
- [x] Script Yandex caricato DOPO consenso cookie (GDPR compliant)
- [x] Vercel Analytics attivo solo in produzione
- [x] Nessuna duplicazione di script

### 6. FILES MODIFICATI

#### File Eliminati:
- `proxy.ts` - RIMOSSO per evitare loop di redirect

#### File Modificati:
- `next.config.mjs` - Aggiunto async headers() e async redirects()
- `app/layout.tsx` - Aggiunto metadataBase, alternates.canonical, env check per tracking
- `app/page.tsx` - Corretto canonical da www.4bid.it a 4bid.it
- `app/robots.ts` - Aggiunto host, disallow paths aggiuntivi
- `SECURITY_CHECKLIST.md` - Questo documento aggiornato

---

## 🔍 VERIFICA POST-DEPLOY

### Test Automatici (dopo deploy su Vercel):

1. **Canonical URL**
```bash
curl -I https://4bid.it/ | grep -i "link.*canonical"
# Verifica che restituisca: <link rel="canonical" href="https://4bid.it/" />
```

2. **Security Headers**
```bash
curl -I https://4bid.it/ | grep -i "x-frame-options\|strict-transport"
# Verifica presenza degli header di sicurezza
```

3. **Blocco IP Diretto** (sostituisci con IP effettivo se disponibile)
```bash
curl -I http://159.69.22.72/
# Dovrebbe fare redirect 301 a https://4bid.it
```

4. **Redirect WWW**
```bash
curl -I https://www.4bid.it/
# Dovrebbe fare redirect 301 a https://4bid.it/
```

5. **Robots.txt**
```bash
curl https://4bid.it/robots.txt
# Verifica:
# - Host: https://4bid.it
# - Disallow: /admin/, /api/
# - Sitemap: https://4bid.it/sitemap.xml
```

6. **Sitemap.xml**
```bash
curl https://4bid.it/sitemap.xml | head -20
# Verifica che tutti gli URL inizino con https://4bid.it
```

### Test Manuali:

7. **Google Search Console**
   - Vai su search.google.com/search-console
   - Verifica che la proprietà sia https://4bid.it (non www)
   - Richiedi indicizzazione di homepage e principali landing pages
   - Controlla sezione "Copertura" per errori canonical

8. **Yandex Metrika Dashboard**
   - Vai su metrika.yandex.ru
   - Verifica che le visite vengano tracciate su https://4bid.it
   - Controlla che Session Replay (Webvisor) funzioni
   - Verifica che non ci siano doppioni o sessioni da IP

9. **Google Analytics**
   - Verifica real-time tracking
   - Controlla che gli hostname siano solo 4bid.it (nessun IP o www)

10. **PageSpeed Insights**
    - Test su https://pagespeed.web.dev/
    - Verifica presenza canonical corretto
    - Controlla security headers

---

## 🚨 PROBLEMI NOTI DA RISOLVERE

### Hosting Precedente
- [ ] Contattare provider vecchio hosting e richiedere:
  - Disabilitazione sito su IP 159.69.22.72
  - Configurazione redirect 301 permanente verso https://4bid.it
  - Chiusura account se non più necessario

### Google
- [ ] Search Console: Verifica ownership su https://4bid.it
- [ ] Disown www.4bid.it se era una proprietà separata
- [ ] Richiedi re-crawl delle pagine principali

### Yandex
- [ ] Verifica configurazione Yandex.Webmaster su https://4bid.it
- [ ] Se esiste configurazione su vecchio IP/dominio, rimuoverla

---

## 📝 NOTE TECNICHE

### Perché niente proxy.ts/middleware.ts?
Il file proxy.ts causava loop di redirect infiniti (ERR_TOO_MANY_REDIRECTS).
Ora tutto è gestito da next.config.mjs che è più affidabile:
- `async headers()` per security headers
- `async redirects()` per redirect www → non-www

### MetadataBase
Configurato nel layout.tsx:
```ts
metadataBase: new URL("https://4bid.it")
```
Garantisce che TUTTI i canonical relativi vengano convertiti in assoluti.

### Tracking Condizionale
Tutti gli script analytics caricano SOLO se:
```ts
process.env.NODE_ENV === "production"
```
Evita tracking in sviluppo e preview Vercel.

### GDPR Compliance
Yandex Metrika carica dopo consenso cookie:
- Script loader definito in layout
- Inizializzazione chiamata da CookieConsent dopo accept
- Session Replay (webvisor) abilitato per debugging UX

---

## 🎯 RISULTATI ATTESI

Dopo 24-48 ore dal deploy:
1. Google Search inizierà a mostrare solo risultati da https://4bid.it
2. Vecchi risultati con IP o www scompariranno gradualmente
3. Yandex traccerà solo sessioni da dominio canonico
4. Security headers visibili in tutti i browser dev tools
5. Nessun errore canonical in Search Console

---

## 📞 SUPPORTO

Per problemi o domande:
- Vercel Deploy Issues: vercel.com/help
- Next.js Docs: nextjs.org/docs
- Security Headers Test: securityheaders.com

**Data implementazione:** 17 Dicembre 2025
**Versione:** 1.0
