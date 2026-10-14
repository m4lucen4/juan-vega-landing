# Juan Vega Landing

Minimal Astro project with Tailwind CSS 4 and strict TypeScript.

## Getting started

Requires Node.js 22.12.0 or newer and npm 9.6.5 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:4321`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run check` | Check Astro and TypeScript diagnostics. |
| `npm run build` | Build the static site into `dist/`. |
| `npm run preview` | Preview the production build locally. |

## Project structure

- `src/pages/index.astro`: Figma-based homepage.
- `src/pages/arquitectura.astro`: architecture catalogue.
- `src/pages/arquitectura/proyecto-ejemplo.astro`: shared project-detail mock.
- `src/pages/estudio.astro`: studio presentation, approach, team and services.
- `src/pages/contacto.astro`: contact details and reflections.
- `src/components/`: reusable Astro sections, header, footer, cards and filters.
- `src/data/architecture.ts`: local mock catalogue and filter metadata.
- `src/styles/global.css`: shared design tokens, source-frame layouts and Tailwind import.
- `src/styles/home.css`: homepage-only readable typography.
- `src/styles/interior-readability.css`: shared readable typography for the four interior routes.
- `src/styles/architecture.css`: catalogue and responsive layouts.
- `src/styles/project.css`: project-detail gallery and responsive layouts.
- `src/styles/studio.css`: studio screen and responsive layouts.
- `src/styles/contact.css`: contact screen and responsive layouts.
- `astro.config.mjs`: Astro configuration and Tailwind Vite plugin.

## Homepage readability

The homepage keeps its original image composition but uses a readable, responsive type scale rather than the source frame's 8–10px labels. Paragraphs start at 16px with 1.6 line spacing; navigation, links, metadata, the project index and footer start at 14px; card headings start at 20px. Text sections grow naturally and captions wrap on narrower screens.

`src/styles/home.css` is scoped to `.home-page`, so interior routes keep their existing typography. Muted text is darker on the paper background, and placeholder team cards use dark text instead of white. Browser tests check eight widths from 320px to 1920px, including both sides of the 600px layout breakpoint, text clipping, section-link overlap and at least 4.5:1 contrast for the checked solid-background text. These checks are not a complete accessibility audit of text over photographs.

## Interior readability

Arquitectura, Estudio, Contacto and project detail use the same reading principles as the homepage: body copy starts at 16px with 1.6 line spacing, secondary text starts at 14px, and headings have a stronger visual hierarchy. Muted text meets 4.5:1 contrast against the paper background. The shared layer in `src/styles/interior-readability.css` is scoped to `.interior-page`; it does not change homepage styling or page content.

Text sections grow naturally instead of retaining the source frame's fixed heights. Catalogue filters use compact, side-by-side dropdowns with 44px minimum control heights; captions, studio names, service rows and contact addresses can wrap. Studio approach rows stack below 801px to avoid narrow reading columns. Photographs, project galleries, mock data, filters, Grid/Lista state, contact destinations and plan links are preserved.

`tests/interior-readability.test.mjs` checks all four screens at 11 widths, including both sides of the 600px, 800px, 900px and 1000px breakpoints. It checks rendered text sizes, leading, clipping, header collisions, solid-background label contrast and active navigation. Existing page tests retain content, interaction, asset and photo-composition assertions while allowing text-driven vertical flow to change. These are not a full accessibility audit of text over photographs.

## Architecture screen

Open `/arquitectura` from the main navigation or the home's **Todos los proyectos** link. The logo returns home; **Estudio** opens `/estudio` and **Contacto** opens `/contacto`.

The catalogue reproduces Figma frame `163:188` in file `A2DaGuh2wyHg1ITawxjFYj`. At 1100px it has three edge-to-edge columns; tablet uses two columns and mobile one. Original images and the interior header assets are self-hosted under `public/images/architecture/`.

- **Tipo** and **Estado** are labelled native dropdowns placed side by side on mobile and desktop. Their selected values stay visible and combine to filter the local projects.
- **Grid / Lista** changes the view without clearing filters.
- An empty result offers **Mostrar todos los proyectos** to reset both dropdowns to **Todos** without changing the current Grid/Lista view.
- Native dropdowns support keyboard selection and visible focus. Grid/Lista retains its pressed states. Without JavaScript, all cards remain visible and the no-script notice explains that filtering requires JavaScript.

This is a mock: the 12 visible Figma cards are implemented. The initial **27 proyectos** label is retained for design fidelity, not a complete database count; filtered counts reflect the actual local subset. Statuses and filter groupings are demonstration data, not verified project facts. Cultural intentionally has no mock projects. All catalogue cards now open the shared project-detail mock. English translation, social links and legal pages remain outside this draft.

## Project detail screen

Click any Arquitectura card in **Grid** or **Lista** to open `/arquitectura/proyecto-ejemplo`. All twelve cards intentionally show **La Riva Sherryhomes**, as authorized for this mock. The full card is a keyboard-accessible link; home cards and their fragment index remain unchanged. The interior header highlights Arquitectura and retains the existing page destinations.

The screen follows the project column of the supplied 2026 × 5116 PNG, excluding the unrelated people cards and black canvas. At the 1100px reference width it reproduces the six-cell technical sheet, asymmetric galleries, three narrative blocks, six numbered plan sheets and previous/next strip. Text stays real HTML. Photos retain their source aspect ratios; mobile stacks the galleries and plans, tablet uses three metadata columns and two plan columns, and wide-screen body copy scales up to 20px.

With explicit user authorization, fourteen photographs and six plan sheets were losslessly cropped into `public/images/project/`. The hero crop excludes the title already baked into the screenshot, so its reframing is approximate rather than strictly pixel-perfect. PNG crops have limited resolution on wide/high-DPI screens, especially the plan sheets; original photographs and PDFs can replace them later. Each plan opens its local PNG in a new tab, without inventing unavailable PDF files.

**Anterior** and **Siguiente** return to the corresponding Torre D’Arenas and Hotel Soho cards in the catalogue. They do not imply unique project content. The displayed dates, status and wording reproduce the supplied detail draft and may differ from the provisional catalogue data.

## Studio screen

Open `/estudio` through **Estudio**, **Sobre nosotros**, or the home's **Estudio Juan Vega Arquitectos** link. **Todo el equipo** opens `/estudio#equipo`. The logo returns home, **Arquitectura** opens the catalogue and **Contacto** opens `/contacto`. The active interior route is highlighted.

The screen follows Figma frame `163:399` (1100 × 4820). Eight original assets are self-hosted under `public/images/studio/`, including the two shaded full-width photos and three source-specific approach crops. Desktop uses a quarter-width section rail and alternating photo/text rows. The five principal-person cards use three columns on desktop, two on tablet and one on mobile. Mobile stacks sections, uses two-column statistics/collaborator cards and single-column service rows.

**Personas** includes Juan Vega, Cristina Álvarez, Salvador Rubiales, Paola Domouso and María González Baro above the nine **Equipo** collaborator cards. These five portrait slots visually overlap Estudio in Figma but are parented under the neighbouring frame `163:608`; exporting only `163:399` omits them. Juan's original photo uses its specific Figma crop; the other four slots contain only the original gradient placeholders, with no supplied photographs. **Biografía —** remains a non-interactive design label until real biography content is supplied. The nine collaborator names, 20-person statistic, repeated services and five placeholder award rows reproduce the design, not verified business facts. No biographies or new award claims have been invented. Home portraits and placeholders remain unchanged.

## Contact screen

Open `/contacto` through **Contacto** on every page. The active route is highlighted; the logo, **Arquitectura** and **Estudio** retain their existing destinations. Email addresses and the phone number use `mailto:` and `tel:` links; there is no form or backend.

The screen follows the supplied 1100 × 1328 Contacto PNG and a separate screenshot of its four contact blocks. Figma MCP was unavailable due its Starter quota. The text layer was outside the exported frame, as on Estudio; all supplied wording is retained, including **Nuevo proyectos:** and the provisional reflections heading. The exact placement of that detached text layer is approximate. The shared footer fills the export's blank footer region.

With explicit user authorization, only the office photograph was cropped from the PNG into `public/images/contact/office.png` (536 × 670). It matches the reference crop but may appear softer on wide/high-DPI displays until an original asset is supplied. The whole design screenshot is never used as the page. Desktop uses two columns and three reflection cards; mobile stacks the contact details, photograph and cards with readable text and wrapping links. Contact copy now has a readable 16px minimum on every screen, scales fluidly to 18px and uses 1.6 line spacing. Labels remain bold while paragraphs use normal weight; reflections grow naturally to fit their larger text.

The three repeated **2026** reflections reproduce the supplied draft. No article or reflections-index destinations were supplied, so they remain static content, not fabricated links. Existing social/legal placeholders and English translation remain unchanged.

## Browser checks

Use an explicitly authorized isolated Chrome instance with `--hide-scrollbars` and CDP on port 9222. Prefer a production preview to avoid Astro's development-toolbar overlay:

```sh
npm run build
npm run preview -- --port 4322
# In another terminal, with the isolated browser running:
HOME_URL=http://localhost:4322 node --test tests/project-detail.test.mjs
HOME_URL=http://localhost:4322 node --test tests/contact.test.mjs
HOME_URL=http://localhost:4322 node --test tests/studio.test.mjs
HOME_URL=http://localhost:4322 node --test tests/architecture.test.mjs
HOME_URL=http://localhost:4322 node --test tests/interior-readability.test.mjs
HOME_URL=http://localhost:4322 node --test --test-concurrency=1 tests/*.test.mjs
```

Set `HOME_URL` and `CHROME_DEBUG_URL` to override the server and CDP addresses. Screenshots are written to ignored `.astro/visual/`; the tests never use a personal browser profile. Readiness explicitly loads lazy images before decoding them.

No legacy `@astrojs/tailwind` integration or Tailwind configuration file is needed.
