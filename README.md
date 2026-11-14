# Cotizador · constructor de propuestas

Demo de un constructor de cotizaciones/proformas: se arma el documento con bloques,
se guarda la estructura como plantilla y se exporta a PDF.

## Qué hace

- **Bloques arrastrables:** encabezado, título, datos, sección/subsección (numeradas solas), texto
  enriquecido (estilo Gmail), lista, tabla de partidas (categorías, subtotales, descuentos, IGV),
  imagen, nota destacada, firma y salto de página.
- **Secciones como contenedores:** los bloques viven dentro de su sección; se pliega, mueve y duplica completa.
- **Añadir bloques arrastrando** desde la paleta, con una línea que marca dónde caerá.
- **Plantillas:** guarda cualquier cotización como plantilla, importa/exporta JSON. Incluye una plantilla de ejemplo.
- **PDF** vectorial (texto seleccionable, numeración de páginas) con vista previa.
- **Modo claro/oscuro** y animaciones.
- **Sin backend:** todo se guarda en `localStorage` del navegador (demo).

## Stack

React 19 · Vite · Tailwind CSS 4 · dnd-kit · TipTap · @react-pdf/renderer · lucide-react

## Uso

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en dist/
```

## Estructura

```
src/
  components/   Home, Editor, SectionGroup, BlockCard, editors (uno por tipo de bloque), RichText, ui
  lib/          blocks (tipos, cálculos), groups (secciones), storage (localStorage), richtext, seed, theme
  pdf/          QuoteDocument (diseño del PDF) y exportPdf
```

> Los datos se guardan solo en el navegador: limpiar los datos del sitio borra plantillas y cotizaciones.
