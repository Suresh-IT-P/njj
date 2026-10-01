# NJJ Technologies — Website

Corporate website for NJJ Technologies and its flagship product, CityRideTaxi.

Static HTML, CSS and JS. No build step and no dependencies apart from the Geist fonts on Google Fonts.

```
index.html            Website (all sections)
design-system.html    Tokens and reusable components
assets/css/styles.css Design tokens, components, responsive rules
assets/js/main.js     Interactions: nav, live maps, diagrams, chart, white-label preview, FAQ, form
```

Open `index.html` in a browser, or serve the folder with any static server.

## Before launch

- **Contact form.** Validation and the loading and success states run in the browser only. Connect the `submit` handler in `main.js` (search for `Contact form`) to your form endpoint or CRM.
- **Legal links.** Privacy Policy and Terms & Conditions currently point to `#top`. Replace them with the real pages.
- **Domains.** The mockups show `cityride.app` and `yourbrand.com` as placeholder domains.
- **Sample data.** Dashboard figures, driver and vendor names, and trip IDs are illustrative and labelled as sample data. The site makes no claims about customers, bookings, revenue, certifications or partners.

## Design system

- Colour: near-black charcoal, cool neutrals and one accent (route teal `#0b7a73`, or `#3ccfc0` on dark). Semantic colours are used for status only.
- Type: Geist (UI and display) and Geist Mono (labels, IDs, data).
- Themes: light by default, full dark mode through `prefers-color-scheme` plus a System / Light / Dark switch in the footer. The Dashboard, Technology and Vision sections stay dark in both themes.
- Breakpoints: 1440, 1280, 1100, 1024, 900, 768, 560 and 390px. Mobile layouts are reorganised rather than scaled down: the hero stacks, the dashboard becomes a single-column admin view, and navigation moves into a full-screen menu.
- Motion: moving map vehicles, a slow network in the hero, flowing connectors, a walkthrough of the architecture layers, and a chart that draws in. All of it is turned off under `prefers-reduced-motion`.
