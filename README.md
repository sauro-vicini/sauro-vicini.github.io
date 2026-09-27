# Pagina personale

Pagina statica (HTML + CSS, nessuna build) creata con la skill **taste-skill**
(`.claude/skills/taste-skill`, MIT, da github.com/Leonxlnx/taste-skill).

Aprire `index.html` nel browser, Pubblicata con GitHub Pages su https://sauro-vicini.github.io/.

## Da completare

- `assets/ritratto.jpg`: foto verticale (circa 1200x1500). Finché manca si vede il monogramma "SV".
- `assets/presentazione.png`: copertina della presentazione (1600x900). Finché manca si vede un riquadro con il titolo.
- Indirizzo email in `index.html`: sostituire `nome@dominio.it` (compare due volte, `href` e `data-email`).
- Controllare i testi: ruolo e temi sono ricavati dai materiali presenti nel repository.

## Scelte di design

- Font Geist e icone Phosphor ospitati in locale (`fonts/`, `icons/`), senza CDN.
- Un solo colore d'accento (cobalto), modalità chiara e scura automatiche.
- Animazioni leggere, disattivate con `prefers-reduced-motion`.

## Deploy su hosting Aruba

Il workflow `.github/workflows/deploy-aruba.yml` carica il sito via FTPS a ogni push su `main`
(o a mano da Actions > Deploy su Aruba > Run workflow). Configurazione una tantum in
Settings > Secrets and variables > Actions:

- Secrets: `ARUBA_FTP_SERVER` (es. `ftp.tuodominio.it`), `ARUBA_FTP_USERNAME`, `ARUBA_FTP_PASSWORD`
- Variable: `ARUBA_FTP_DIR` = `/www.tuodominio.it/`

I dati FTP sono nel pannello Aruba (Hosting Linux > Gestione FTP).

## Blog

Gli articoli sono file Markdown in `_posts/`, con nome `AAAA-MM-GG-titolo-breve.md`:

```markdown
---
title: Titolo dell'articolo
date: 2026-10-01
summary: Una o due frasi che compaiono nell'elenco e nel feed.
---

Testo in Markdown...
```

Aggiungi `draft: true` nel blocco iniziale per tenere un articolo nascosto.

- **Da GitHub:** crea o modifica il file in `_posts/` e salva. Il workflow "Aggiorna blog"
  rigenera le pagine; il deploy su Aruba le rigenera da solo prima di caricarle.
- **In locale:** `npm install` (una volta), poi `npm run build`.

La build crea `blog/`, `feed.xml` e aggiorna la sezione "Dal blog" della home
(tra i marcatori `<!-- BLOG:START -->` e `<!-- BLOG:END -->`).
