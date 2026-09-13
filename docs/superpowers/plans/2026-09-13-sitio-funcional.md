# Plan — Sitio funcional (formulario → WhatsApp, checklist → WhatsApp, SEO, CSP Hostinger)

- **Fecha:** 2026-09-13
- **Repo:** `D:\Diagrama` (rama `master`; Pages `https://millocba.github.io/zelenisvet/`)
- **Autor:** opencode · **Estado:** aprobado por el usuario el 2026-09-13

## Overview
Llevar el mockup de ZELENI SVET a un estado **funcional** de producción manteniendo la arquitectura actual (runtime `support.js` + React CDN + inline). Decisiones cerradas con el usuario:

1. **Contacto:** el botón "Enviar consulta" abre WhatsApp (`wa.me/5493513001702`) con el texto del formulario pre-cargado (sin backend).
2. **Checklist:** el botón "Descargar checklist" abre WhatsApp con un mensaje pidiendo el checklist (sin descarga).
3. **Hostinger:** se relaja la CSP del `.htaccess` para que el mockup cargue tal cual (sin reescribir a un sitio sin runtime).
4. **Analytics:** no se agrega en este plan.

Además (SEO esencial, propuesto y aceptado): `<title>`, meta description, Open Graph, canonical, favicon y theme-color en `<head>`.

## Problem statement
El sitio **se ve** completo pero aún **no es funcional**:
- El formulario de contacto es simulado: `submit` solo hace `setState({sent:true})` (no envía nada).
- "Descargar checklist" es simulado: `getLead` solo hace `setState({lead:true})`.
- No hay `<title>`, meta description, Open Graph, canonical ni favicon → no es indexable presentablemente.
- La CSP estricta del `.htaccess` (pensada para el sitio estático original) **bloquea** el mockup en Hostinger (inline styles, handlers, `new Function` y React desde unpkg). El CI `check-csp.cjs` falla **a propósito** en cada push.

## Architecture summary
- El sitio es un mockup de "Design Composer": template `<x-dc>` en `index.html` + runtime `support.js`. Los scripts de datos están en `<script type="text/x-dc" data-dc-script data-props="...">` (JS evaluado con `new Function` a boot; parsea siempre OK). React 18.3.1 se carga desde `https://unpkg.com` con SRI.
- `state`: `{screen, layer, sent, lead, lang, accent, showTop, reason}`. `sent` conmuta el label del botón del formulario; `lead` conmuta el del checklist.
- Los handlers viven en `renderVals` (objeto de funciones): `submit`, `getLead`, `pickReason`, etc. Todos reciben el evento y usan `self.setState`.
- El `<head>` actual (4 líneas) no tiene `<title>` ni meta; el runtime inyecta al head el contenido de `<helmet data-dc-atomics>` (fuentes + `ATOMIC_CSS` + `<style>` global). Los tags SEO **estáticos** van directo en `<head>` (fuera del helmet: no dependen del boot y los leen los crawlers).
- El formulario usa inputs **sin `id`** (estilo controlado por `setState` solo en "Motivo"). Los demás campos (Nombre, Empresa, Email, Etapa, Mensaje) no tienen handler → se leen del DOM por `id` al momento de `submit`.
- `.htaccess` es Apache/Hostinger (GitHub Pages lo ignora → no afecta la preview). `enviar.php` (mail específico del sitio original) queda **sin tocar**; el CI lo valida con `php -l`.

## Rules / Constraints
- Commits directos a `master` (Pages solo compila `master`) con `git -c user.name="opencode" -c user.email="opencode@local"`. Push = build automático de Pages.
- Shell = PowerShell 5.1 (sin `&&`). Preferir `node -e` / `node scripts/...` para verificaciones.
- **No agregar comentarios** al código. **No usar emojis** en el código (los labels usan "✓" ya existentes).
- No agregar dependencias nuevas (nada de librerías etc.). `scripts/check-dc-parse.cjs` es Node estándar.
- No tocar `support.js`. No tocar el resto de secciones. No reescribir estilos ni estructura.
- Verificación ante cada claim: correr los checks y mostrar salida (ver `Verification`).

## Config
- Número WhatsApp: `5493513001702` (el que ya usa todo el sitio).
- Dominio producción: `https://zelenisvet.com.ar/` (canonical + og:url) — el preview GitHub es de prueba.
- Favicon: `assets/img/logo1.png` (existe; `check-assets` la referencia).
- OG image: `https://zelenisvet.com.ar/assets/img/encabezado1.png`.

## Non-goals
- No convertir el sitio a un runtime-free/hosteado sin CDN.
- No armado de URLs por página ni SEO por-screen (el SPA no cambia URLs).
- No analytics.
- No reemplazar/eliminar `enviar.php`.
- No crear un icono nuevo (favicon = logo1.png tal cual).

## Task 1 — Formulario de contacto → WhatsApp
**Files:** `D:\Diagrama\index.html` (data-dc-script: handler `submit`; 5 campos del formulario "Escribinos").

### N.1.1 Replacement 1 — handler `submit`
Reemplazar (único y exacto):
```
submit: function(e){ e.preventDefault(); self.setState({sent:true}); }
```
por:
```
submit: function(e){ e.preventDefault();
      var v=function(id){ var el=document.getElementById(id); return el?el.value.trim():""; };
      var lineas=[
        "Hola Zeleni Svet. Consulta desde el sitio (Diagnóstico Territorial Express).",
        "",
        "Nombre: "+(v("zs-name")||"—"),
        "Empresa u organismo: "+(v("zs-org")||"—"),
        "Email: "+(v("zs-email")||"—"),
        "Etapa del proyecto: "+(v("zs-stage")||"—"),
        "Motivo: "+self.state.reason,
        "",
        v("zs-msg")||"—"
      ];
      window.open("https://wa.me/5493513001702?text="+encodeURIComponent(lineas.join("\n")), "_blank", "noopener");
      self.setState({sent:true}); }
```
Mantiene el label "Consulta enviada ✓" (`submitLabel` ya existe y no cambia).

### N.1.2 Add `id`s a los 5 campos del formulario
Reemplazos exactos (cada línea incluye su `\n`):
1. `Nombre`:
   old: `<span ...>Nombre</span>` (línea) + nueva línea `<input type="text" style="padding:13px 15px;...;outline:none" style-focus="border-color:#2FB6A8">`
   new: mismo input con `id="zs-name"` insertado como primer atributo: `<input id="zs-name" type="text" ...>`
2. `Empresa u organismo` (form, tiene `;width:100%` y `#2FB6A8`): agregar `id="zs-org"`.
3. `Email` (form, `type="email"` + `;width:100%` + `#2FB6A8`): agregar `id="zs-email"`.
4. Select `Etapa del proyecto` (sin `onChange`, sin `style-focus`): agregar `id="zs-stage"`.
5. `<textarea rows="4" ...>...resize:vertical"...>`: agregar `id="zs-msg"`.

> Nota de ejecución: el input "Nombre" (sin id en la versión anterior) no tiene `width:100%`; los inputs del hero tienen `placeholder="..."` y `#D8B072` — son cadenas distintas. Verificar unicidad con grep antes de editar.

### Verify N.1
- `node scripts/check-dc-parse.cjs` → `OK · data-dc-script parsea correctamente.`
- `git diff` muestra solo el handler + 5 ids en el formulario.
- Visual (usuario, en la preview): llenar el formulario y enviar → se abre WhatsApp con el texto pre-cargado.

## Task 2 — Checklist → WhatsApp
**Files:** `D:\Diagrama\index.html` (handler `getLead`; 3 inputs del box "Descargá gratis: los 10 errores…").

### N.2.1 Replacement — handler `getLead`
Reemplazar (único y exacto, termina con `,`):
```
getLead: function(e){ e.preventDefault(); self.setState({lead:true}); },
```
por:
```
getLead: function(e){ e.preventDefault();
      var v=function(id){ var el=document.getElementById(id); return el?el.value.trim():""; };
      var lineas=[
        "Hola Zeleni Svet. Quiero recibir el checklist \"Los 10 errores críticos que frenan la aprobación de un EsIA\".",
        "",
        "Nombre: "+(v("zs-lead-name")||"—"),
        "Empresa u organismo: "+(v("zs-lead-org")||"—"),
        "Email de trabajo: "+(v("zs-lead-email")||"—")
      ];
      window.open("https://wa.me/5493513001702?text="+encodeURIComponent(lineas.join("\n")), "_blank", "noopener");
      self.setState({lead:true}); },
```

### N.2.2 Add `id`s a los 3 inputs del box checklist
1. `<input type="text" placeholder="Nombre" ...style-focus="border-color:#D8B072">` → `id="zs-lead-name"`.
2. `<input type="text" placeholder="Empresa u organismo" ...style-focus="border-color:#D8B072">` → `id="zs-lead-org"`.
3. `<input type="email" placeholder="Email de trabajo" ...style-focus="border-color:#D8B072">` → `id="zs-lead-email"`.

### Verify N.2
- `node scripts/check-dc-parse.cjs` → OK.
- `git diff` muestra solo handler + 3 ids.
- Visual (usuario): click en "Descargar checklist" → abre WhatsApp pidiendo el checklist.

## Task 3 — SEO esencial (estático en `<head>`)
**Files:** `D:\Diagrama\index.html` (`<head>`).

### N.3.1 Insertar tags antes de `</head>`
El `<head>` actual es:
```html
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
```
Insertar **antes de `</head>`**:
```html
<title>Zeleni Svet · Inteligencia territorial para decisiones ambientales</title>
<meta name="description" content="Zeleni Svet — consultora ambiental y territorial con estación de monitoreo IoT propia, inteligencia territorial, licenciamiento ambiental, monitoreo continuo y programas de apropiación comunitaria. Córdoba, Argentina.">
<meta name="theme-color" content="#080C0B">
<link rel="icon" type="image/png" href="assets/img/logo1.png">
<link rel="apple-touch-icon" href="assets/img/logo1.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Zeleni Svet">
<meta property="og:title" content="Zeleni Svet · Inteligencia territorial para decisiones ambientales">
<meta property="og:description" content="Estaciones de monitoreo IoT, inteligencia territorial, licenciamiento ambiental y gestión ambiental continua.">
<meta property="og:url" content="https://zelenisvet.com.ar/">
<meta property="og:image" content="https://zelenisvet.com.ar/assets/img/encabezado1.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="https://zelenisvet.com.ar/">
```
(Meta estáticos fuera del `<helmet>`: no dependen del boot del runtime y los leen los crawlers. En Google transpone `&amp;` no aplica aquí.)

### Verify N.3
- `node scripts/check-assets.cjs` → OK (favicon local resuelve; og:image es URL absoluta y no se escanea).
- `git diff` muestra solo el bloque nuevo en `<head>`.
- Visual (usuario): pestaña con título correcto; favicon = logo; `?` en redes sociales muestra og:title/description al compartir.
- Resaltar: siendo SPA sin URLs por página, el canonical/og apunta a `https://zelenisvet.com.ar/` (evita contenido duplicado con el preview GitHub).

## Task 4 — CSP producción (.htaccess) + CI coherente
**Files:** `D:\Diagrama\.htaccess`, `D:\Diagrama\scripts\check-csp.cjs`, `D:\Diagrama\.github\workflows\ci.yml` (nombres de steps).

### N.4.1 Reemplazar la línea 29 de CSP en `.htaccess`
Old (único):
```
  Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'; frame-src https://www.google.com; base-uri 'self'; upgrade-insecure-requests"
```
New:
```
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src https://www.google.com; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; upgrade-insecure-requests"
```
Justificación de cada token (queda documentado en el `.htaccess` vía comentario `# --- CSP del stack mockup (runtime support.js + React CDN + estilos inline) ---` que se coloca sobre la línea — se permite comentario, no código).

### N.4.2 Reescribir `scripts/check-csp.cjs`
Pasa de "verificar que no haya inline" a **guard de coherencia**: valida que la CSP del `.htaccess` contenga cada permiso que el mockup realmente usa. Verificar cada token requerido y salir con error si falta. Requisitos:
- Regex: `/Header\s+(?:always\s+)?set\s+Content-Security-Policy\s+"([^"]+)"/i`
- Directivas requeridas (directiva → token): default-src→'self'; script-src→'self'; script-src→'unsafe-inline'; script-src→'unsafe-eval'; script-src→https://unpkg.com; style-src→'self'; style-src→'unsafe-inline'; style-src→https://fonts.googleapis.com; font-src→https://fonts.gstatic.com; img-src→'self'; frame-src→https://www.google.com; form-action→'self'.
- Log: `OK · .htaccess expone permisos compatibles con el mockup (script/style inline, unpkg, fuentes, maps).`
- Governance minimal: `'use strict';` + `fs`/`path`.

### N.4.3 Ajustar `ci.yml`
- Renombrar el step `Guarda CSP (sin style/script/handlers inline)` → `Coherencia CSP (.htaccess vs mockup)`.
- (Opcional) agregar step `Sintaxis data-dc-script` → `node scripts/check-dc-parse.cjs` (crear el script en N.4.4).

### N.4.4 Crear `scripts/check-dc-parse.cjs`
Script Node nuevo que extrae el `data-dc-script` con `/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/i` y lo compila con `new Function`. Falla con `Error de sintaxis en data-dc-script: …` y log `OK · data-dc-script parsea correctamente.`

### Verify N.4
- `node scripts/check-csp.cjs` → OK (ahora sale verde).
- `node scripts/check-dc-parse.cjs` → OK.
- `node scripts/check-assets.cjs` → OK.
- `php -l enviar.php` → "No syntax errors". (enviar.php NO cambia.)
- `git diff` revisa solo `.htaccess` (1 línea CSP + 1 comentario), `check-csp.cjs` (reescrito), `ci.yml` (nombres/steps), `check-dc-parse.cjs` (nuevo).

## Task 5 — Commit, push y verificación final
- `git add` de: `index.html`, `.htaccess`, `scripts/check-csp.cjs`, `scripts/check-dc-parse.cjs`, `.github/workflows/ci.yml`.
- Commit: `git -c user.name="opencode" -c user.email="opencode@local" commit -m "Formulario y checklist a WhatsApp; SEO head; CSP mockup en .htaccess; checks coherentes"`
- Push a `master`.
- Confirmar en Actions: Jobs → `Validación del sitio`: los 3-4 steps verdes y **Pages build success**.
- Reportar al usuario: qué cambió, qué verificar en la preview (formulario, checklist, favicon/título) y estado del deploy a Hostinger (archivos listos; el usuario sube por File Manager o ZIP; `.htaccess` incluido).

## Rollback
- Cada Task es un commit atómico: revertir con `git revert <sha>` (o `git checkout <sha> -- <file>`).
- Si el usuario no quiere la CSP relajada, se revierte solo el Task 4.1 (`.htaccess`) y se restaura `check-csp.cjs` anterior.
- `enviar.php` intacto: no afecta.

## How to verify whole-plan (final checklist)
```
node scripts/check-assets.cjs      # 17+ refs OK
node scripts/check-csp.cjs         # OK (nueva lógica)
node scripts/check-dc-parse.cjs    # OK
php -l enviar.php                  # No syntax errors
git status / git diff              # solo archivos previstos
```
+ Pages build success en Actions + revisión visual del usuario.