// Genera il blog statico a partire dai file Markdown in _posts/.
//
//   _posts/AAAA-MM-GG-slug.md  ->  blog/slug/index.html
//                                  blog/index.html      (elenco articoli)
//                                  feed.xml             (RSS)
//                                  index.html           (ultimi articoli in home, tra i marcatori BLOG)
//
// Uso: npm run build   (SITE_URL=https://tuodominio.it npm run build per un altro dominio)

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = join(ROOT, "_posts");
const BLOG_DIR = join(ROOT, "blog");
const SITE_URL = (process.env.SITE_URL || "https://sauro-vicini.github.io").replace(/\/$/, "");
const AUTHOR = "Sauro Vicini";
const HOME_LIMIT = 3;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const formatDate = (d) => dateFmt.format(d);
const isoDate = (d) => d.toISOString().slice(0, 10);

function parsePost(file) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: front matter mancante (blocco --- iniziale)`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  const nameMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!nameMatch) throw new Error(`${file}: il nome deve essere AAAA-MM-GG-slug.md`);
  if (!meta.title) throw new Error(`${file}: manca "title" nel front matter`);
  const date = new Date(`${meta.date || nameMatch[1]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`${file}: data non valida`);
  const body = match[2];
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug: nameMatch[2],
    title: meta.title,
    summary: meta.summary || "",
    draft: meta.draft === "true",
    date,
    minutes: Math.max(1, Math.round(words / 200)),
    html: marked.parse(body),
  };
}

function nav(prefix, current) {
  const link = (href, label, key) =>
    `<li><a href="${href}"${current === key ? ' aria-current="page"' : ""}>${label}</a></li>`;
  return `  <header class="nav">
    <div class="wrap">
      <a class="brand" href="${prefix}index.html">${AUTHOR}</a>
      <nav aria-label="Principale">
        <ul>
          ${link(`${prefix}index.html#temi`, "Temi", "temi").replace("<li>", '<li class="hide-sm">')}
          ${link(`${prefix}blog/index.html`, "Blog", "blog")}
          ${link(`${prefix}index.html#contatti`, "Contatti", "contatti")}
        </ul>
      </nav>
    </div>
  </header>`;
}

function page({ prefix, title, description, current, main }) {
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="color-scheme" content="light dark">
  <link rel="preload" href="${prefix}fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${prefix}icons/phosphor.css">
  <link rel="stylesheet" href="${prefix}css/site.css">
  <link rel="alternate" type="application/rss+xml" title="Blog di ${AUTHOR}" href="${prefix}feed.xml">
</head>
<body>
  <script>document.documentElement.classList.add("js");</script>
${nav(prefix, current)}

  <main id="top">
${main}
  </main>

  <footer>
    <div class="wrap">
      <span>© ${new Date().getUTCFullYear()} ${AUTHOR}</span>
      <a href="https://github.com/sauro-vicini"><i class="ph ph-github-logo" aria-hidden="true"></i>GitHub</a>
    </div>
  </footer>
  <script src="${prefix}js/site.js" defer></script>
</body>
</html>
`;
}

const meta = (p) =>
  `<time datetime="${isoDate(p.date)}">${formatDate(p.date)}</time><span aria-hidden="true">·</span><span>${p.minutes} min di lettura</span>`;

function postPage(p, newer, older) {
  const pager = [
    older ? `<a class="pager-link" href="../${older.slug}/index.html"><span>Articolo precedente</span><strong>${esc(older.title)}</strong></a>` : "<span></span>",
    newer ? `<a class="pager-link pager-next" href="../${newer.slug}/index.html"><span>Articolo successivo</span><strong>${esc(newer.title)}</strong></a>` : "<span></span>",
  ].join("\n          ");
  return page({
    prefix: "../../",
    title: `${p.title} | ${AUTHOR}`,
    description: p.summary || p.title,
    current: "blog",
    main: `    <article class="post">
      <div class="wrap wrap-narrow">
        <a class="back" href="../index.html"><i class="ph ph-arrow-left" aria-hidden="true"></i>Tutti gli articoli</a>
        <h1>${esc(p.title)}</h1>
        <p class="post-meta">${meta(p)}</p>
        ${p.summary ? `<p class="post-summary">${esc(p.summary)}</p>` : ""}
        <div class="prose">
${p.html}
        </div>
        <nav class="pager" aria-label="Altri articoli">
          ${pager}
        </nav>
      </div>
    </article>`,
  });
}

function blogIndex(posts) {
  const [first, ...rest] = posts;
  const featured = first
    ? `<a class="post-featured reveal" href="${first.slug}/index.html">
          <p class="post-meta">${meta(first)}</p>
          <h2>${esc(first.title)}</h2>
          <p>${esc(first.summary)}</p>
          <span class="read-more">Leggi l'articolo <i class="ph ph-arrow-right" aria-hidden="true"></i></span>
        </a>`
    : `<div class="empty">
          <i class="ph ph-note-pencil" aria-hidden="true"></i>
          <p>Ancora nessun articolo. Aggiungi un file Markdown in <code>_posts/</code> e lancia <code>npm run build</code>.</p>
        </div>`;
  const list = rest
    .map(
      (p) => `<li class="reveal">
            <a href="${p.slug}/index.html">
              <p class="post-meta">${meta(p)}</p>
              <h3>${esc(p.title)}</h3>
              <p>${esc(p.summary)}</p>
            </a>
          </li>`
    )
    .join("\n          ");
  return page({
    prefix: "../",
    title: `Blog | ${AUTHOR}`,
    description: `Appunti di ${AUTHOR} su intelligenza artificiale, dati e sanità digitale in Emilia-Romagna.`,
    current: "blog",
    main: `    <section class="blog-head">
      <div class="wrap">
        <h1>Blog</h1>
        <p class="section-intro">Appunti su intelligenza artificiale, dati e sanità digitale in Emilia-Romagna.</p>
        <a class="rss" href="../feed.xml"><i class="ph ph-rss" aria-hidden="true"></i>Feed RSS</a>
      </div>
    </section>
    <section class="blog-list" aria-label="Articoli">
      <div class="wrap">
        ${featured}
        ${rest.length ? `<ul class="post-list">\n          ${list}\n        </ul>` : ""}
      </div>
    </section>`,
  });
}

function homeSection(posts) {
  if (!posts.length) return "";
  const [first, ...rest] = posts.slice(0, HOME_LIMIT);
  const others = rest
    .map(
      (p) => `<a class="home-post" href="blog/${p.slug}/index.html">
              <p class="post-meta"><time datetime="${isoDate(p.date)}">${formatDate(p.date)}</time></p>
              <h3>${esc(p.title)}</h3>
            </a>`
    )
    .join("\n            ");
  return `    <section id="blog" class="home-blog" aria-labelledby="blog-title">
      <div class="wrap">
        <h2 class="section-title reveal" id="blog-title">Dal blog</h2>
        <div class="home-blog-grid">
          <a class="post-featured reveal" href="blog/${first.slug}/index.html">
            <p class="post-meta">${meta(first)}</p>
            <h3>${esc(first.title)}</h3>
            <p>${esc(first.summary)}</p>
            <span class="read-more">Leggi l'articolo <i class="ph ph-arrow-right" aria-hidden="true"></i></span>
          </a>
          <div class="home-blog-side reveal">
            ${others}
            <a class="btn btn-ghost" href="blog/index.html">Tutti gli articoli</a>
          </div>
        </div>
      </div>
    </section>`;
}

function rss(posts) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid>${SITE_URL}/blog/${p.slug}/</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog di ${AUTHOR}</title>
    <link>${SITE_URL}/blog/</link>
    <description>Appunti su intelligenza artificiale, dati e sanità digitale in Emilia-Romagna.</description>
    <language>it</language>
${items}
  </channel>
</rss>
`;
}

// ---- build ----
const posts = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map(parsePost)
      .filter((p) => !p.draft)
      .sort((a, b) => b.date - a.date)
  : [];

rmSync(BLOG_DIR, { recursive: true, force: true });
mkdirSync(BLOG_DIR, { recursive: true });
writeFileSync(join(BLOG_DIR, "index.html"), blogIndex(posts));
posts.forEach((p, i) => {
  mkdirSync(join(BLOG_DIR, p.slug), { recursive: true });
  writeFileSync(join(BLOG_DIR, p.slug, "index.html"), postPage(p, posts[i - 1], posts[i + 1]));
});
writeFileSync(join(ROOT, "feed.xml"), rss(posts));

const homePath = join(ROOT, "index.html");
const home = readFileSync(homePath, "utf8");
const markers = /(<!-- BLOG:START -->)[\s\S]*?(<!-- BLOG:END -->)/;
if (!markers.test(home)) throw new Error("index.html: marcatori <!-- BLOG:START --> / <!-- BLOG:END --> non trovati");
writeFileSync(homePath, home.replace(markers, (_, a, b) => `${a}\n${homeSection(posts)}\n    ${b}`));

console.log(`Blog generato: ${posts.length} articoli.`);
