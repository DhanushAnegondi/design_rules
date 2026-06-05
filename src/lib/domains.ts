// Domain metadata. The `id` matches the library folder name with its numeric prefix stripped
// (e.g. "01-visual-styles" -> "visual-styles"). `order` drives display order.
//
// `accentHue` is an OKLCH hue tied to each domain. It is used only as a very low-chroma tint
// inside that card's background motif — never as a loud full-tile color (see docs/GUIDELINES.md,
// color rules). The neutral surface + single amber accent identity is preserved; the motif and
// texture differentiate the cards, not a rainbow of hues.
//
// `motif` selects which CSS background motif `DomainCard.astro` paints behind the card text. Each
// motif is a quiet visual metaphor for the domain (glass planes, motion lines, a grid skeleton,
// stacked tiles, a ghosted glyph, layered cards, an aurora field, a shimmer/progress bar, nested
// device frames). All motifs are pure CSS and stay low-contrast so text remains AA-legible.

export type DomainMotif =
  | "glass"
  | "motion"
  | "grid"
  | "blocks"
  | "type"
  | "layers"
  | "aurora"
  | "shimmer"
  | "frames";

export interface Domain {
  id: string;
  folder: string;
  order: number;
  title: string;
  /** Plain-English, beginner-facing one-liner. */
  blurb: string;
  accentHue: number;
  /** Which background motif the home-page bento card paints for this domain. */
  motif: DomainMotif;
}

export const DOMAINS: Domain[] = [
  {
    id: "visual-styles",
    folder: "01-visual-styles",
    order: 1,
    title: "Visual styles",
    blurb: "The overall look and feel — glass, clay, brutalist, minimal, dark. The skin you put on a page.",
    accentHue: 28,
    motif: "glass",
  },
  {
    id: "scroll-motion",
    folder: "02-scroll-motion",
    order: 2,
    title: "Scroll & motion",
    blurb: "How things move as you scroll or interact — parallax, reveals, sticky sections, smooth scrolling.",
    accentHue: 62,
    motif: "motion",
  },
  {
    id: "layout-systems",
    folder: "03-layout-systems",
    order: 3,
    title: "Layout systems",
    blurb: "How content is arranged on the page — grids, bento, split screens, sidebars, single columns.",
    accentHue: 152,
    motif: "grid",
  },
  {
    id: "component-patterns",
    folder: "04-component-patterns",
    order: 4,
    title: "Component patterns",
    blurb: "The reusable building blocks — navbars, heroes, cards, carousels, modals, footers, forms.",
    accentHue: 196,
    motif: "blocks",
  },
  {
    id: "typography-color",
    folder: "05-typography-color",
    order: 5,
    title: "Typography & color",
    blurb: "Choosing and pairing fonts, building type scales, and constructing accessible color systems.",
    accentHue: 256,
    motif: "type",
  },
  {
    id: "recipes",
    folder: "06-recipes",
    order: 6,
    title: "Recipes",
    blurb: "Complete builds that combine a style, a layout, and behaviors — landing pages, portfolios, dashboards.",
    accentHue: 312,
    motif: "layers",
  },
  {
    id: "backgrounds-effects",
    folder: "07-backgrounds-effects",
    order: 7,
    title: "Backgrounds & effects",
    blurb: "Surface treatments behind your content — gradients, mesh, noise, blur, patterns, spotlight glow.",
    accentHue: 18,
    motif: "aurora",
  },
  {
    id: "ui-states-feedback",
    folder: "08-ui-states-feedback",
    order: 8,
    title: "UI states & feedback",
    blurb: "What the interface shows while things happen — loading, empty, error, toasts, steppers, tooltips.",
    accentHue: 96,
    motif: "shimmer",
  },
  {
    id: "responsive-foundations",
    folder: "09-responsive-foundations",
    order: 9,
    title: "Responsive foundations",
    blurb: "Making it work on every screen — breakpoints, fluid sizing, container queries, touch targets.",
    accentHue: 224,
    motif: "frames",
  },
];

const BY_ID = new Map(DOMAINS.map((d) => [d.id, d]));
const BY_FOLDER = new Map(DOMAINS.map((d) => [d.folder, d]));

export function domainById(id: string): Domain | undefined {
  return BY_ID.get(id);
}

export function domainByFolder(folder: string): Domain | undefined {
  return BY_FOLDER.get(folder);
}

/** "01-visual-styles" -> "visual-styles". Tolerates an already-stripped id. */
export function folderToId(folder: string): string {
  return folder.replace(/^\d+-/, "");
}
