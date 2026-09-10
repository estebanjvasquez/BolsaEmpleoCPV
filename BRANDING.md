# Identidad visual de la Cámara Petrolera de Venezuela

Este documento describe el sistema visual de la Bolsa de Talento CPV. Úselo como referencia para cualquier cambio de marca; los valores que consume la aplicación se encuentran en `apps/frontend/src/app/globals.css`.

## Logo

- Guarde el logotipo institucional en `apps/frontend/public/brand/logo-camara-petrolera.svg`.
- Formato preferido: SVG con fondo transparente y versión horizontal.
- Incluya el nombre completo de la organización si forma parte del logotipo oficial.
- Si solo se dispone de PNG, use `apps/frontend/public/brand/logo-camara-petrolera.png`, con al menos 800 px de ancho y fondo transparente.
- No cambie el nombre ni la ruta del archivo: el componente compartido `apps/frontend/src/components/logo.tsx` lo utiliza en cabecera y pie de página de toda la aplicación.

## Tipografía

| Uso | Fuente actual | Token |
| --- | --- | --- |
| Titulares y marca | Hanken Grotesk | `--font-headline` |
| Texto de interfaz | Open Sans | `--font-body` |
| Etiquetas y controles | Inter | `--font-label` |

Las fuentes se cargan en `apps/frontend/src/app/layout.tsx`. Si se sustituye una fuente, actualice allí la importación de `next/font` y el token correspondiente en `globals.css`.

## Colores

| Rol | Valor actual | Token |
| --- | --- | --- |
| Fondo principal | `#fbf9f8` | `--color-surface` |
| Texto principal | `#1b1c1c` | `--color-on-surface` |
| Azul institucional | `#141c27` | `--color-primary-container` |
| Naranja de acción | `#fe9819` | `--color-secondary-container` |
| Error y rechazo | `#ba1a1a` | `--color-error` |

## Aplicación

- Mantenga el azul institucional para navegación, identidad y titulares relevantes.
- Reserve el naranja para llamadas a la acción y estados que requieren atención.
- Reserve el rojo para errores, rechazos y acciones destructivas.
- Mantenga contraste WCAG AA: texto normal con relación mínima 4.5:1.
- Use los tokens de Tailwind expuestos por `globals.css` (`bg-primary-container`, `text-on-surface`, etc.) en lugar de valores hexadecimales dentro de componentes.

## Espaciado y formas

- Unidad base: 8 px (`--spacing-unit`).
- Márgenes: 16 px en móvil y 32 px en escritorio.
- Contenedor máximo: 1200 px.
- Radios: de 2 px a 12 px, según los tokens `--radius-*`; no introduzca radios arbitrarios.

## Cómo actualizar la marca

1. Actualice los tokens de `apps/frontend/src/app/globals.css` para cambiar colores, tipografías, espaciado o radios en toda la interfaz.
2. Reemplace el archivo de logo en `apps/frontend/public/brand/` manteniendo el nombre establecido.
3. Revise la landing, el acceso administrativo y el pie de página en escritorio y móvil.
4. Ejecute `npm run build --workspace=frontend` antes de desplegar.

El Markdown documenta las decisiones. Los cambios visuales efectivos se realizan en los tokens y el componente de logo indicados arriba; así se evita que una edición documental altere la interfaz de forma accidental.
