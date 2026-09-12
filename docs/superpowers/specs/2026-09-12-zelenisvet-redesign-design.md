# Rediseño zelenisvet.com.ar — Design Doc

**Fecha:** 2026-09-12
**Proyecto:** Rediseño del sitio one-page de "ZELENI SVET Consultora" con seguridad y UX/UI mejoradas.
**Estado:** Aprobado por el usuario (secciones 1–3).

## Contexto

Sitio actual (auditado): one-page estático en Hostinger (hPanel/CDN) con formulario PHP. Hallazgos previos:
HTML sin cabeceras de seguridad, jQuery 3.7.1 desde CDN sin SRI, formulario `enviar.php` sin CSRF/rate-limit/validación, sin robots.txt. TLS grado A (mantener).

## Decisiones aprobadas

1. **Backend del formulario:** PHP endurecido en Hostinger (CSRF, rate-limit, honeypot, validación server-side).
2. **Estructura:** one-page con anclas (Inicio, Servicios, Proyectos, Contacto).
3. **Imágenes:** las fotos y logos de la página original (ya descargadas a `assets/img/`).
4. **Paleta:** Opción A "Verde Energía" (estilo Solpan).
5. **Enfoque técnico:** HTML/CSS/JS vanilla + `enviar.php`. Sin build tools ni dependencias.
6. **UX extras:** botón flotante de WhatsApp, mapa de Google, correo clickeable (`mailto:`), botón volver-arriba.

## Identidad visual

- Verde oscuro `#1B5E20` (nav, títulos, footer)
- Verde vibrante `#4CAF50` (CTAs, acentos, hover)
- Tinte claro `#E8F5E9` (fondos alternos)
- Texto `#212121`, bordes suaves `#C8E6C9`, blanco base
- Tipografías actuales: **Montserrat** (títulos 600/700) + **Open Sans** (cuerpo 400/600), auto-hospedadas en `.woff2`

## Componentes del one-page

1. **Header sticky** verde oscuro: logo (`logo1.png`), nav (Inicio/Servicios/Proyectos/Contacto), hamburguesa en móvil, scroll suave.
2. **Hero** a pantalla completa: fondo `banner2.jpeg` + overlay verde oscuro translúcido + H1 + CTA "Más Información".
3. **Servicios:** grilla responsive de tarjetas con iconos SVG inline (ecología) y texto idéntico al actual (12 servicios).
4. **Proyectos:** galería de 4 tarjetas con `imagen1-4.jpeg` y sus leyendas originales.
5. **Banner separador:** `banner2.jpeg`.
6. **Contacto:** dos columnas — info (correo `mailto:`, teléfonos, certificación RNCEA con `logoCertificado.png`) + formulario.
7. **Footer** verde oscuro (texto original).
8. **Floating:** botón WhatsApp (351-3001702) + botón volver-arriba.
9. **Mapa de Google** de Córdoba en la sección contacto.

## Formulario `enviar.php` (seguridad)

- Token CSRF por sesión (`random_bytes` + `hash_equals`), campo oculto.
- Rate-limit: máx. 5 envíos/hora por IP + sesión, bloqueo progresivo.
- Honeypot anti-bots.
- Validación: nombre 2–60 chars, email `filter_var`, teléfono formato AR, mensaje 10–2000 chars.
- Anti header-injection: prohibido `\r\n` en cualquier campo; cabeceras `mail()` filtradas.
- `display_errors=Off`, logs a archivo privado, errores genéricos al usuario.
- Respuesta JSON con escape correcto (sin reflectar input).

## Cabeceras y servidor (`.htaccess`)

- HSTS (`max-age=31536000; includeSubDomains`), `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off).
- CSP estricta: `default-src 'self'`; `img-src 'self' data:`; `font-src 'self'`; `script-src 'self'`; `style-src 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`. Sin `unsafe-inline`/`unsafe-eval`.
- HTTP→HTTPS, ocultar `.htaccess`/`.env`, deshabilitar listado de directorios, 404 propio.
- CSP + Google Maps: se usa el iframe de embed estándar (`https://www.google.com/maps/embed?pb=...`) y se añade únicamente `frame-src https://www.google.com` a la CSP. El contenido del iframe lo rige el CSP de Google, no el nuestro; el documento principal conserva una CSP estricta sin `unsafe-inline`/`unsafe-eval`. El mapa se carga con `loading="lazy"` y sin el parámetro de API key.

## Archivos (structure)

```
index.html, enviar.php, .htaccess, robots.txt, 404.html
css/styles.css, js/main.js
assets/img/*, assets/fonts/*
```

## UX / Accesibilidad / Performance

- Semántica HTML5, `label`s, `alt` descriptivos, foco visible, `prefers-reduced-motion`.
- Lazy-load imágenes bajo el fold; CSS/JS propios compactos; sin librerías.
- `main.js`: menú móvil, scroll suave, animaciones IntersectionObserver, submit del form por `fetch` con fallback amigable si no hay PHP local.

## Verificación

- `php -l enviar.php`.
- Review de cabeceras con curl.
- Prueba visual responsive (desktop/móvil) con y sin despliegue.