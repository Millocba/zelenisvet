# Project: Zeleni Svet (D:\Diagrama)

## Stack
- Sitio estático single-file: `index.html` (template `<x-dc>`) + runtime `support.js` (mockup "Design Composer", DC runtime).
- React 18.3.1 desde `https://unpkg.com` con SRI (cargado por support.js). Fuentes Google (Archivo, IBM Plex Mono, Instrument Serif).
- Host/CI: repo `Millocba/zelenisvet`, GitHub Pages `https://millocba.github.io/zelenisvet/`. Producción: `zelenisvet.com.ar` (Hostinger, Apache).
- Scripts Node: `scripts/check-assets.cjs`, `scripts/check-csp.cjs` (coherencia CSP vs mockup), `scripts/check-dc-parse.cjs` (parsea data-dc-script). CI `.github/workflows/ci.yml` + `php -l enviar.php`.
- `enviar.php` = handler mail PHP del sitio original (NO se usa por el mockup; no tocar, lo valida el CI).

## Architecture
- `index.html`: el data script vive en `<script type="text/x-dc" data-dc-script data-props="...">` (JS con `const EN/...`, arrays, y `class Component extends DCLogic` con `renderVals()`). El runtime lo evalúa con `new Function` (siempre parsea OK). `support.js` está en `<head>`.
- `renderVals()` devuelve el objeto de valores + handlers: `goHome/goGeb/goTech/goStation/goTerr/goBio/goCases/goContact`, `pickReason`, `submit`, `getLead`, `scrollTop`, `p.pick` (paleta), `setEs/setEn`, etc. Usa `self.setState(...)`.
- Estado global en el Component: `{screen, layer, sent, lead, lang, accent, showTop, reason}`. `sent`/`lead` conmutan labels del formulario/checklist.
- Las pantallas son `<sc-if value="{{ isXxx }}">`. Los datos con `<sc-for list="..." as="...">` y placeholders `{{ }}`. Helmet `<helmet data-dc-atomics>` inyecta fuentes/`<style>` global al head al bootear.
- Paleta: 4 acentos `["#2FB6A8" (default), "#57B487", "#7FA9D4", "#C9A063"]`; persistencia `localStorage` `zs-accent`/`zs-lang` y URL `?accent=#...` (vía `history.replaceState`).
- Formulario "Escribinos" y box checklist leen inputs por `id`: `zs-name`, `zs-org`, `zs-email`, `zs-stage`, `zs-msg`, `zs-lead-name`, `zs-lead-org`, `zs-lead-email`. `submit`/`getLead` abren `https://wa.me/5493513001702?text=<encodeURIComponent>` (WhatsApp, sin backend).

## Critical Decisions
- **Deploy = mockup tal cual** (mantener `support.js` + React CDN + estilos inline). La CSP del `.htaccess` está **relajada** para permitirlo (`script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com`; `style-src 'unsafe-inline' https://fonts.googleapis.com`; `font-src https://fonts.gstatic.com`; `frame-src https://www.google.com`). (2026-09-13)
- **Contacto/checklist → WhatsApp** (wa.me/5493513001702) en lugar de enviar.php o backend. (2026-09-13)
- **SEO esencial** en `<head>` estático: `<title>`, meta description, OG, canonical y favicon = `assets/img/logo1.png` apuntando a `https://zelenisvet.com.ar/` (canonical para producción; evita duplicados con el preview GitHub). (2026-09-13)
- **Sin analytics** por ahora (decisión del usuario 2026-09-13).
- Commits en `master` + push = build automático Pages + CI (CI ahora sale **verde**: check-csp validó que el mockup siga funcionando, no que no haya inline).
- Sensor **NAP-57A** (Nemoto & Co.) mide solo metano CH₄ por electroquímica; el CO se deja estimado con MiCS-4514/MQ-135 (indicado por el usuario, 2026-09-13).

## Known Issues
- SPA sin URLs por página (sin SEO por screen). El mapa/dashboard son maquetas (`pointer-events:none`, blips fijos).
- `showTop`/paleta: `renderVals` expone `showTop: this.state.showTop === true` y `p.pick`; actualizar juntos o el botón "volver arriba" no aparece (bug ya corregido, 2026-09-13).
- Deploy a Hostinger: método no definido; `.htaccess` relajado listo para el stack mockup. Proxy: NO correr check-csp estricto (descartado).

## Conventions
- Git identity local: `git -c user.name="opencode" -c user.email="opencode@local"`. No usar `&&` en PowerShell; encadenar con `; if ($?) { ... }`.
- NO agregar comentarios al código (salvo .htaccess que ya los tiene). NO usar emojis en código/labels (los "✓" son checks Unicode ya existentes).
- Verificación: `node scripts/check-assets.cjs`, `node scripts/check-csp.cjs`, `node scripts/check-dc-parse.cjs`, `php -l enviar.php`; luego `gh run list --repo Millocba/zelenisvet --limit 3` para confirmar CI + Pages build.
- El agente NO ve la preview; validar por diffs, imágenes y build. El usuario revisa visualmente en la preview antes de producción.
- Backup pre-mockup: `backup/rediseno-singlefile-v1` (commit `2c7cbf1`). Último deploy: `8eec0ee`.

## Corrections
- Asumido "productivo = estricto CSP sin inline" → El usuario eligió mantener el mockup: CSP relajada para que cargue (2026-09-13).
- El CI rojo era **esperado** mientras check-csp exigiera "sin inline"; se reescribió como guard de coherencia (2026-09-13).

## Environment
- Win32 / PowerShell 5.1. Working dir `D:\Diagrama`. Temp autorizado: `C:\Users\el_mi\AppData\Local\Temp\opencode`.
- Material original (zip) en `C:\Users\el_mi\AppData\Local\Temp\opencode\zelenisvet-mockups\` (assets + uploads con PDFs: plan de negocio, póster).
- WhatsApp: `5493513001702` (también `351-7533434`). Mail: `informacion@zelenisvet.com.ar`.